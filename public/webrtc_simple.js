let uuid = () => {return URL.createObjectURL(new Blob([])).slice(-36)};
const localVideo = document.getElementById('localVideo');
const remoteVideo = document.getElementById('remoteVideo');
const stopDom = document.getElementById('stop')
const pesanDom = document.getElementById('pesan')
const waitDom = document.getElementById('wait')
const mulaiDom = document.getElementById('mulai')
const parrent = document.getElementById("daftar")
const localPeerConnection = new RTCPeerConnection({sdpSemantics: 'unified-plan'});

let your_name = null;
let your_destionation = null;
let oldSession = [];
let localStream = new MediaStream()
let remoteStream = new MediaStream()

localPeerConnection.onicecandidate = (event) => {
  if (event.candidate) {
    // Kirim kandidat ICE ke server atau perangkat lain
    const iceCandidate = event.candidate;

    console.log("iceCandidate")
    console.log(iceCandidate)
    console.log("iceCandidate")
    const iceData = {
      candidate: iceCandidate.candidate,
      sdpMid: iceCandidate.sdpMid,
      sdpMLineIndex: iceCandidate.sdpMLineIndex
    };

    fetch(`/${your_destionation}/ice-candidate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ candidate: iceData })
    });

  }

}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function enableStereoOpus(sdp) {
    return sdp.replace(/a=fmtp:111/, 'a=fmtp:111 stereo=1\r\na=fmtp:111');
}

function getId(){
  let id = localStorage.getItem("id");
  if (id == undefined){
  id = uuid();
  localStorage.setItem('id', id)
  }
  return id
}

window.navigator.mediaDevices.getUserMedia({
  audio: true,
  video: true
}).then((localStream) => {
  localStream.getTracks().forEach((track) => {localPeerConnection.addTrack(track, localStream)});
  localVideo.srcObject = localStream

  mulaiDom.style.display = 'block'
}).catch((e) => {
  alert(e)
})

async function showAllConnnections(){
  let response = await fetch('/connections')
  response = await response.json();
  response.map((name) => {
    if (!oldSession.includes(name)){
      let item = document.createElement("li")
      item.innerHTML = name
      if (name == your_name){
        item.innerHTML = `${name} <span style='color:red'>Anda<span>`
      } 
      if (name == your_destionation){
        item.innerHTML = `${name} <span style='color:red'>Teman Anda<span>`
      }
      item.id = name
      parrent.appendChild(item)
      oldSession.push(name)
    }
  })
  for (let index = 0; index < oldSession.length; index++) {
    const localName = oldSession[index];
    let found = false;
    for (let index = 0; index < response.length; index++) {
      const remoteName = response[index];
      if (remoteName == localName){
        found = true
        break
      }
    }
    if (!found){
      document.getElementById(localName).remove()
      oldSession = oldSession.filter((val) => val != localName)
      if (localName == your_destionation){
        alert("teman anda telah keluar()")
        stop()
      }
    }
  }
}

showAllConnnections()
setInterval(async () => {
  showAllConnnections()
}, 5000)

// stop both mic and camera
function stopBothVideoAndAudio(stream) {
    stream.getTracks().forEach((track) => {
        if (track.readyState == 'live') {
            track.stop();
        }
    });
}

// stop only camera
function stopVideoOnly(stream) {
    stream.getTracks().forEach((track) => {
        if (track.readyState == 'live' && track.kind === 'video') {
            track.stop();
        }
    });
}

// stop only mic
function stopAudioOnly(stream) {
    stream.getTracks().forEach((track) => {
        if (track.readyState == 'live' && track.kind === 'audio') {
            track.stop();
        }
    });
}


function StartStreaming(){
  fetch('/new-connection', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({id: getId()})
  }).then((response) => {
    response.json().then((remotePeerConnection) => {
      const localPeerConnection = new RTCPeerConnection({
        sdpSemantics: 'unified-plan'
      });

      localPeerConnection.setRemoteDescription(remotePeerConnection.localDescription).then(() => {
        window.navigator.mediaDevices.getUserMedia({
          audio: true,
          video: true
        }).then((localStream) => {
          localStream.getTracks().forEach((track) => {localPeerConnection.addTrack(track, localStream)});
          localVideo.srcObject = localStream;

          const remoteStream = new MediaStream(localPeerConnection.getReceivers().map(receiver => receiver.track));
          remoteVideo.srcObject = remoteStream;

          localPeerConnection.createAnswer().then((originalAnswer) => {
            const updatedAnswer = new RTCSessionDescription({
              type: 'answer',
              sdp: originalAnswer.sdp
            });
            localPeerConnection.setLocalDescription(updatedAnswer).then(() => {
              fetch(`/answer/${getId()}`, {
                method: 'POST',
                body: JSON.stringify(localPeerConnection.localDescription),
                headers: {
                  'Content-Type': 'application/json'
                }
              }).then((res) => {
                console.log(res)
              })
            });
          })
        });
      })
    })
  });
}