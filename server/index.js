const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const { createGame } = require('./game');

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const PORT = process.env.PORT || 3000;

const game = createGame();

app.use(express.static(path.join(__dirname, '..', 'public')));

io.on('connection', (socket) => {
    console.log(`Player connected: ${socket.id}`);

    socket.on('register', (name) => {
        game.addPlayer(socket, name || "Anon");
    });

    socket.on('disconnect', () => {
        console.log(`Player disconnected: ${socket.id}`);
        game.removePlayer(socket.id);
    });

    socket.on('playerAction', (action) => {
        game.handleAction(socket.id, action);
    });
});

server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
