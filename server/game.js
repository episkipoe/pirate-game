const GRID_WIDTH = 40;
const GRID_HEIGHT = 30;

module.exports = function createGame(io) {
    const players = {};
    let islands = [];
    let npcShips = [];

    function randomCoord() {
        return {
            x: Math.floor(Math.random() * GRID_WIDTH),
            y: Math.floor(Math.random() * GRID_HEIGHT)
        };
    }

    function generateIslands(count = 20) {
        islands = [];
        for (let i = 0; i < count; i++) {
            islands.push(randomCoord());
        }
    }

    function generateNPCs(count = 10) {
        const types = ["sloop", "brigantine", "frigate", "fishing boat", "galleon"];
        const hpByType = {
            "sloop": 40, "brigantine": 60, "frigate": 80,
            "fishing boat": 20, "galleon": 100
        };
        npcShips = [];
        for (let i = 0; i < count; i++) {
            const type = types[Math.floor(Math.random() * types.length)];
            npcShips.push({
                id: "npc_" + Date.now() + "_" + i,
                ...randomCoord(),
                type,
                hp: hpByType[type]
            });
        }
    }

    function broadcastState() {
        io.emit("gameState", {
            players,
            islands,
            npcShips
        });
    }

    function addPlayer(socket, name) {
        players[socket.id] = {
            id: socket.id,
            name,
            x: Math.floor(GRID_WIDTH / 2),
            y: Math.floor(GRID_HEIGHT / 2),
            hp: 100,
            cannons: [],
            crew: []
        };
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
        broadcastState();
    }

    function movePlayer(id, dir) {
        const p = players[id];
        if (!p) return;
        if (dir === "left") p.x = Math.max(0, p.x - 1);
        if (dir === "right") p.x = Math.min(GRID_WIDTH - 1, p.x + 1);
        if (dir === "up") p.y = Math.max(0, p.y - 1);
        if (dir === "down") p.y = Math.min(GRID_HEIGHT - 1, p.y + 1);

        for (let island of islands) {
            const dx = Math.abs(island.x - p.x);
            const dy = Math.abs(island.y - p.y);
            if (dx < 2 && dy < 2) {
                // simulate a randomEvent()
            }
        }

        broadcastState();
    }

    function playerFire(id) {
        const p = players[id];
        if (!p) return;
        for (let npc of npcShips) {
            const dist = Math.abs(npc.x - p.x) + Math.abs(npc.y - p.y);
            if (dist <= 2) {
                npc.hp -= 20;
                if (npc.hp <= 0) {
                    npcShips = npcShips.filter(n => n.id !== npc.id);
                }
                break;
            }
        }
        broadcastState();
    }

    function resetWorld() {
        generateIslands();
        generateNPCs();
        broadcastState();
    }

    setInterval(() => {
        for (let npc of npcShips) {
            const dir = ["left", "right", "up", "down"][Math.floor(Math.random() * 4)];
            if (dir === "left") npc.x = Math.max(0, npc.x - 1);
            if (dir === "right") npc.x = Math.min(GRID_WIDTH - 1, npc.x + 1);
            if (dir === "up") npc.y = Math.max(0, npc.y - 1);
            if (dir === "down") npc.y = Math.min(GRID_HEIGHT - 1, npc.y + 1);
        }
        broadcastState();
    }, 5000);

    setInterval(() => {
        for (let npc of npcShips) {
            for (let id in players) {
                const p = players[id];
                const dist = Math.abs(npc.x - p.x) + Math.abs(npc.y - p.y);
                if (dist <= 2) {
                    p.hp -= 10;
                    if (p.hp < 0) p.hp = 0;
                }
            }
        }
        broadcastState();
    }, 10000);

    setInterval(() => {
        if (npcShips.length < 10) {
            const type = ["sloop", "brigantine", "frigate", "fishing boat", "galleon"][Math.floor(Math.random() * 5)];
            const hp = { sloop: 40, brigantine: 60, frigate: 80, "fishing boat": 20, galleon: 100 }[type];
            npcShips.push({ id: "npc_" + Date.now(), ...randomCoord(), type, hp });
            broadcastState();
        }
    }, 60000);

    resetWorld();

    return {
        players,
        islands,
        npcShips,
        addPlayer,
        updatePlayerName,
        movePlayer,
        removePlayer,
        resetWorld,
        playerFire,
        broadcastState,
        width: GRID_WIDTH,
        height: GRID_HEIGHT
    };
};
