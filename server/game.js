const crypto = require("crypto");

module.exports = function createGame(io) {
    const players = {};
    const sockets = {};
    const treasures = {};
    const islands = new Set();
    const npcShips = [];

    function randomId() {
        return crypto.randomUUID();
    }

    function generateIslands(count = 30, size = 3) {
        islands.clear();
        for (let i = 0; i < count; i++) {
            const baseX = Math.floor(Math.random() * 40);
            const baseY = Math.floor(Math.random() * 30);
            for (let dx = 0; dx < size; dx++) {
                for (let dy = 0; dy < size; dy++) {
                    islands.add(`${baseX + dx},${baseY + dy}`);
                }
            }
        }
    }

    function spawnTreasure() {
        let x, y, key, attempts = 0;
        do {
            x = Math.floor(Math.random() * 40);
            y = Math.floor(Math.random() * 30);
            key = `${x},${y}`;
            attempts++;
        } while (
            treasures[key] ||
            islands.has(key) ||
            Object.values(players).some(p => p.x === x && p.y === y)
        );
        treasures[key] = { x, y };
    }

    function spawnNpcShips(count = 5) {
        npcShips.length = 0;
        const types = ["fishing boat", "galleon", "sloop", "brigantine", "frigate", "man-of-war"];
        for (let i = 0; i < count; i++) {
            const type = types[Math.floor(Math.random() * types.length)];
            let x, y;
            do {
                x = Math.floor(Math.random() * 40);
                y = Math.floor(Math.random() * 30);
            } while (islands.has(`${x},${y}`));
            npcShips.push(createNpcShip(type, x, y));
        }
    }

    function createNpcShip(type, x, y) {
        const base = { id: randomId(), type, x, y, name: type };
        switch (type) {
            case "fishing boat": return { ...base, hp: 20, speed: 1 };
            case "galleon": return { ...base, hp: 100, cannons: 20, speed: 1 };
            case "sloop": return { ...base, hp: 40, speed: 3 };
            case "brigantine": return { ...base, hp: 60, cannons: 4, speed: 2 };
            case "frigate": return { ...base, hp: 90, cannons: 14, speed: 2 };
            case "man-of-war": return { ...base, hp: 150, cannons: 40, speed: 1 };
            default: return { ...base, hp: 50 };
        }
    }

    function addPlayer(socket, name) {
        players[socket.id] = {
            id: socket.id,
            name,
            x: Math.floor(Math.random() * 40),
            y: Math.floor(Math.random() * 30),
            score: 0,
            hp: 100,
            cannons: [{ shotType: "standard" }, { shotType: "explosive" }],
            crew: [
                { name: "One-Eyed Pete", role: "Gunner" },
                { name: "Limping Lucy", role: "Navigator" },
                { name: "Salty Sam", role: "Cook" }
            ]
        };
        sockets[socket.id] = socket;
        spawnTreasure();
        broadcastState();
    }

    function updatePlayerName(id, name) {
        if (players[id]) {
            players[id].name = name;
            broadcastState();
        }
    }

    function removePlayer(id) {
        delete players[id];
        delete sockets[id];
        broadcastState();
    }

    function handleAction(id, dir) {
        const player = players[id];
        if (!player) return;

        const deltas = {
            up: { dx: 0, dy: -1 },
            down: { dx: 0, dy: 1 },
            left: { dx: -1, dy: 0 },
            right: { dx: 1, dy: 0 }
        };

        const move = deltas[dir];
        if (!move) return;

        const newX = player.x + move.dx;
        const newY = player.y + move.dy;
        const key = `${newX},${newY}`;

        if (newX >= 0 && newX < 40 && newY >= 0 && newY < 30) {
            if (islands.has(key)) {
                sockets[id].emit("eventMessage", "A storm pushed you back!");
            } else {
                player.x = newX;
                player.y = newY;
                if (treasures[key]) {
                    delete treasures[key];
                    player.score += 1;
                    spawnTreasure();
                }
            }
        }
        broadcastState();
    }

    function resetWorld() {
        generateIslands();
        spawnNpcShips();
        for (const id in players) {
            players[id].x = Math.floor(Math.random() * 40);
            players[id].y = Math.floor(Math.random() * 30);
        }
        for (const key in treasures) delete treasures[key];
        for (let i = 0; i < 10; i++) spawnTreasure();
        broadcastState();
    }

    function broadcastState() {
        const state = {
            players,
            treasures: Object.values(treasures),
            islands: Array.from(islands).map(s => {
                const [x, y] = s.split(',').map(Number);
                return { x, y };
            }),
            npcShips
        };
        for (const id in sockets) {
            sockets[id].emit("gameState", state);
        }
    }

    return {
        addPlayer,
        updatePlayerName,
        removePlayer,
        handleAction,
        resetWorld,
        broadcastState,
        players,
        npcShips
    };
};

