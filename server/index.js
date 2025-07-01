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
        game.handleAction(socket.id, dir);
    });

    socket.on("newWorld", () => {
        game.resetWorld();
    });

    socket.on("fireCannons", () => {
        const player = game.players[socket.id];
        if (!player) return;
        const { x, y } = player;
        const adjacent = [
            { dx: -1, dy: 0 },
            { dx: 1, dy: 0 },
            { dx: 0, dy: -1 },
            { dx: 0, dy: 1 }
        ];
        for (let { dx, dy } of adjacent) {
            const npc = game.npcShips.find(n => n.x === x + dx && n.y === y + dy);
            if (npc) {
                npc.hp -= 20;
                if (npc.hp <= 0) {
                    game.npcShips = game.npcShips.filter(n => n.id !== npc.id);
                }
                break;
            }
        }
        game.broadcastState();
    });

    socket.on("disconnect", () => {
        console.log("Player disconnected:", socket.id);
        game.removePlayer(socket.id);
    });
});

server.listen(3000, () => {
    console.log("Server listening on http://localhost:3000");
});
