var express = require("express");
var app = express();
var http = require("http").Server(app);
var io = require("socket.io")(http);
const port = process.env.PORT || 3000;

app.use(express.static(__dirname + "/public"));

function onConnection(socket) {
    socket.on("drawing", (data) => socket.broadcast.emit("drawing", data));
    socket.on("boardColor", (data) =>
        socket.broadcast.emit("boardColor", data)
    );
    socket.on("fontSize", (data) => socket.broadcast.emit("fontSize", data));
    socket.on("clearingCanvas", (data) =>
        socket.broadcast.emit("clearingCanvas", data)
    );
    socket.on("textAdded", (data) => socket.broadcast.emit("textAdded", data));
}

io.on("connection", onConnection);

http.listen(3000, () => {
    console.log("listening on *:3000");
});
