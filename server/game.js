const GRID_WIDTH = 100;
const GRID_HEIGHT = 100;

const players = {};
const npcShips = [];
const islands = [];

function randomInt(max) {
    return Math.floor(Math.random() * max);
}

function createIsland() {
    return { x: randomInt(GRID_WIDTH - 2), y: randomInt(GRID_HEIGHT - 2) };
}

function createNPC(type = "sloop") {
    const hpByType = {
        "fishing boat": 20,
        "sloop": 40,
        "schooner": 50,
        "brigantine": 60,
        "frigate": 80,
        "galleon": 100,
        "man-of-war": 120
    };
    return {
        x: randomInt(GRID_WIDTH),
        y: randomInt(GRID_HEIGHT),
        type,
        hp: hpByType[type] || 40
    };
}

function initWorld() {
    for (let i = 0; i < 20; i++) islands.push(createIsland());
    for (let i = 0; i < 10; i++) npcShips.push(createNPC());
}

function addPlayer(id) {
    players[id] = {
        x: randomInt(GRID_WIDTH),
        y: randomInt(GRID_HEIGHT),
        name: "Pirate",
        cannons: [],
        crew: [],
        hp: 100
    };
}

function removePlayer(id) {
    delete players[id];
}

function movePlayer(id, dir) {
    const p = players[id];
    if (!p) return;
    if (dir === "left") p.x = Math.max(0, p.x - 1);
    if (dir === "right") p.x = Math.min(GRID_WIDTH - 1, p.x + 1);
    if (dir === "up") p.y = Math.max(0, p.y - 1);
    if (dir === "down") p.y = Math.min(GRID_HEIGHT - 1, p.y + 1);
}

function setPlayerName(id, name) {
    if (players[id]) players[id].name = name;
}

function fireCannons(id) {
    const player = players[id];
    if (!player) return;
    for (const npc of npcShips) {
        const dx = Math.abs(npc.x - player.x);
        const dy = Math.abs(npc.y - player.y);
        if (dx + dy <= 2) {
            npc.hp -= 10;
        }
    }
}

function updateNPCs() {
    for (const npc of npcShips) {
        const dir = ["left", "right", "up", "down"][randomInt(4)];
        if (dir === "left") npc.x = Math.max(0, npc.x - 1);
        if (dir === "right") npc.x = Math.min(GRID_WIDTH - 1, npc.x + 1);
        if (dir === "up") npc.y = Math.max(0, npc.y - 1);
        if (dir === "down") npc.y = Math.min(GRID_HEIGHT - 1, npc.y + 1);
    }

    for (const npc of npcShips) {
        for (const id in players) {
            const p = players[id];
            const dx = Math.abs(npc.x - p.x);
            const dy = Math.abs(npc.y - p.y);
            if (dx + dy <= 2) {
                p.hp -= 5;
            }
        }
    }

    for (let i = 0; i < npcShips.length; i++) {
        if (npcShips[i].hp <= 0) {
            npcShips.splice(i, 1);
            i--;
        }
    }

    if (npcShips.length < 10) {
        npcShips.push(createNPC());
    }
}

function getState() {
    return {
        players,
        npcShips,
        islands
    };
}

module.exports = {
    initWorld,
    addPlayer,
    removePlayer,
    movePlayer,
    setPlayerName,
    fireCannons,
    updateNPCs,
    getState
};
