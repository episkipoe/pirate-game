const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const createGame = require("./game");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const game = createGame(io);

app.use(express.static("public"));

io.on("connection", (socket) => {
    console.log("Player connected:", socket.id);
    game.addPlayer(socket, "Unnamed Pirate");

    socket.on("setName", name => {
        game.updatePlayerName(socket.id, name);
    });

    socket.on("move", dir => {
        game.movePlayer(socket.id, dir);
    });

    socket.on("newWorld", () => {
        game.resetWorld();
    });

    socket.on("fireCannons", () => {
        game.playerFire(socket.id);
    });

    socket.on("disconnect", () => {
        console.log("Player disconnected:", socket.id);
        game.removePlayer(socket.id);
    });
});

server.listen(3000, () => {
    console.log("Server running at http://localhost:3000");
});
