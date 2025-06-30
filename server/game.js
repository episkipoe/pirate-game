function createGame() {
    const players = {};
    const sockets = {};

    function addPlayer(socket, name) {
        players[socket.id] = {
            id: socket.id,
            name,
            x: Math.floor(Math.random() * 10),
            y: Math.floor(Math.random() * 10)
        };
        sockets[socket.id] = socket;
        broadcastState();
    }

    function removePlayer(id) {
        delete players[id];
        delete sockets[id];
        broadcastState();
    }

    function handleAction(id, action) {
        const player = players[id];
        if (!player) return;

        switch (action.type) {
            case 'move':
                player.x += action.dx;
                player.y += action.dy;
                break;
        }

        broadcastState();
    }

    function broadcastState() {
        for (const id in sockets) {
            sockets[id].emit('gameState', players);
        }
    }

    return {
        addPlayer,
        removePlayer,
        handleAction,
    };
}

module.exports = { createGame };
