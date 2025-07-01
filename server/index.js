const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);
const game = require("./game");

app.use(express.static(__dirname + "/../public"));

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
    console.log("Server started on port", PORT);
});

game.initWorld();

setInterval(() => {
    game.updateNPCs();
    io.emit("gameState", game.getState());
}, 1000);

io.on("connection", (socket) => {
    console.log("Player connected:", socket.id);
    game.addPlayer(socket.id);
    io.emit("gameState", game.getState());

    socket.on("disconnect", () => {
        console.log("Player disconnected:", socket.id);
        game.removePlayer(socket.id);
        io.emit("gameState", game.getState());
    });

    socket.on("move", (dir) => {
        game.movePlayer(socket.id, dir);
        io.emit("gameState", game.getState());
    });

    socket.on("setName", (name) => {
        game.setPlayerName(socket.id, name);
        io.emit("gameState", game.getState());
    });

    socket.on("fireCannons", () => {
        game.fireCannons(socket.id);
        io.emit("gameState", game.getState());
    });
};
