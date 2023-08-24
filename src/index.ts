import express, { Request, Response } from "express";
import fs from "fs";
import socketIO, { Server as SocketIOServer } from "socket.io";
import { createServer, Server as HTTPServer } from "http";
import https from "https";
import path from "path";

const app = express()
const httpServer = createServer(app)
let activeSockets: string[] = []

app.use(express.json())
app.use(express.static(path.join(__dirname, "../public")));
// app.use((req: Request, res: Response, next: Function) => {
//   next(createError(404))
// })

var options = {
  key: fs.readFileSync('./privkey.pem'),
  cert: fs.readFileSync('./fullchain.pem'),
};

var server = https.createServer(options, app)
const io = socketIO(server)
  

io.on("connection", socket => {
  const existingSocket = activeSockets.find(
    existingSocket => existingSocket === socket.id
  );

  if (!existingSocket) {
    activeSockets.push(socket.id);

    socket.emit("update-user-list", {
      users: activeSockets.filter(
        existingSocket => existingSocket !== socket.id
      )
    });

    socket.broadcast.emit("update-user-list", {
      users: [socket.id]
    });
  }

  socket.on("call-user", (data: any) => {
    socket.to(data.to).emit("call-made", {
      offer: data.offer,
      socket: socket.id
    });
  });

  socket.on("message", (data: any) => {
    socket.broadcast.emit("new-message", {
      from: socket.id,
      text: data.text,
    })
  });

  socket.on("make-answer", data => {
    socket.to(data.to).emit("answer-made", {
      socket: socket.id,
      answer: data.answer
    });
  });

  socket.on("reject-call", data => {
    socket.to(data.from).emit("call-rejected", {
      socket: socket.id
    });
  });

  socket.on("disconnect", () => {
    activeSockets = activeSockets.filter(
      existingSocket => existingSocket !== socket.id
    );
    socket.broadcast.emit("remove-user", {
      socketId: socket.id
    });
  });
});

server.listen(443, function(){
  console.log(`⚡️[server]: Server is running at https://0.0.0.0:443`)
});
