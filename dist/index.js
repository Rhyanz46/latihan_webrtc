"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
exports.__esModule = true;
var express_1 = __importDefault(require("express"));
var socket_io_1 = __importDefault(require("socket.io"));
var http_1 = require("http");
var path_1 = __importDefault(require("path"));
var app = express_1["default"]();
var httpServer = http_1.createServer(app);
var io = socket_io_1["default"](httpServer);
var activeSockets = [];
app.use(express_1["default"].json());
app.use(express_1["default"].static(path_1["default"].join(__dirname, "../public")));
// app.use((req: Request, res: Response, next: Function) => {
//   next(createError(404))
// })
io.on("connection", function (socket) {
    var existingSocket = activeSockets.find(function (existingSocket) { return existingSocket === socket.id; });
    if (!existingSocket) {
        activeSockets.push(socket.id);
        socket.emit("update-user-list", {
            users: activeSockets.filter(function (existingSocket) { return existingSocket !== socket.id; })
        });
        socket.broadcast.emit("update-user-list", {
            users: [socket.id]
        });
    }
    socket.on("call-user", function (data) {
        socket.to(data.to).emit("call-made", {
            offer: data.offer,
            socket: socket.id
        });
    });
    socket.on("message", function (data) {
        socket.broadcast.emit("new-message", {
            from: socket.id,
            text: data.text
        });
    });
    socket.on("make-answer", function (data) {
        socket.to(data.to).emit("answer-made", {
            socket: socket.id,
            answer: data.answer
        });
    });
    socket.on("reject-call", function (data) {
        socket.to(data.from).emit("call-rejected", {
            socket: socket.id
        });
    });
    socket.on("disconnect", function () {
        activeSockets = activeSockets.filter(function (existingSocket) { return existingSocket !== socket.id; });
        socket.broadcast.emit("remove-user", {
            socketId: socket.id
        });
    });
});
httpServer.listen(5000, '0.0.0.0', function () {
    console.log("\u26A1\uFE0F[server]: Server is running at https://0.0.0.0:5000");
});
//# sourceMappingURL=index.js.map