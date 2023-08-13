const http = require('http');
const express = require('express');
const { RTCPeerConnection, RTCSessionDescription, RTCIceCandidate } = require('wrtc');

const app = express();
const server = http.createServer(app);

app.use(express.static('public'));
// app.use(express.json())
app.use(express.json());

const peers = new Map();

function beforeOffer(peerConnection) {
  const audioTransceiver = peerConnection.addTransceiver('audio');
  const videoTransceiver = peerConnection.addTransceiver('video');
  return Promise.all([
    audioTransceiver.sender.replaceTrack(audioTransceiver.receiver.track),
    videoTransceiver.sender.replaceTrack(videoTransceiver.receiver.track)
  ]);
}

app.get('/connections', async (req, res) => {
  res.send([...peers.keys()])
})

app.delete('/:id', async (req, res) => {
  const { id } = req.params;
  peers.delete(id)
  res.send({'message': 'ok'})
})

app.post('/new-connection', async (req, res) => {
  const {id} = req.body;
  let peerConnection = new RTCPeerConnection({
    sdpSemantics: 'unified-plan'
  });

  await beforeOffer(peerConnection)
  const offer = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(offer);
  peers.set(id, peerConnection);
  res.send({
    iceConnectionState: peerConnection.iceConnectionState,
    localDescription: peerConnection.localDescription,
    remoteDescription: peerConnection.remoteDescription,
    signalingState: peerConnection.signalingState
  });
})

app.post('/:id/ice-candidate', express.json(), async (req, res) => {
  const id = req.params.id;
  const pc = peers.get(id);
  if (!pc) {
    res.sendStatus(404);
    return;
  }

  const candidate = new RTCIceCandidate(req.body.candidate);
  // await pc.addIceCandidate(candidate);
  // res.sendStatus(200);
  pc.addIceCandidate(candidate)
    .then(() => {
      res.sendStatus(200);
    })
    .catch(error => {
      console.error('Error adding ICE candidate:', error);
      res.sendStatus(500);
    });
});


app.post('/answer/:id', express.json(), (req, res) => {
  const id = req.params.id;
  const pc = peers.get(id);
  if (!pc) {
    res.sendStatus(404);
    return;
  }

  const answer = new RTCSessionDescription({
    type: req.body.type,
    sdp: req.body.sdp
  });
  pc.setRemoteDescription(answer)
    .then(() => {
      res.sendStatus(200);
    })
    .catch(error => {
      console.error('Error setting remote description:', error);
      res.sendStatus(500);
    });
});

server.listen(3000, () => {
  console.log('Server is running on port 3000');
});