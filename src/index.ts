import express, { Request, Response } from "express";
import socketIO, { Server as SocketIOServer } from "socket.io";
import { createServer, Server as HTTPServer } from "http";
import createError from "http-errors"
import path from "path";

const app = express()
const httpServer = createServer(app)
const io = socketIO(httpServer)
let activeSockets: string[] = []

app.use(express.json())


// TODO: Routing aplikasi akan kita tulis di sini

app.use(express.static(path.join(__dirname, "../public")));


// handle 404 error
app.use((req: Request, res: Response, next: Function) => {
  next(createError(404))
})

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

// app.listen(3000, () =>
//   console.log(`⚡️[server]: Server is running at https://localhost:3000`)
// )

httpServer.listen(5000, '0.0.0.0', () => {
    console.log(`⚡️[server]: Server is running at https://0.0.0.0:5000`)
});