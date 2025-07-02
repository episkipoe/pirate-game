const Ship = require("./ship");


const GRID_WIDTH = 255;
const GRID_HEIGHT = 255;

const N_ISLANDS = 128;
const N_NPCS = 22;
const MAX_NPCS = 44;

let io;

const players = {};
let npcShips = [];
let islands = [];

function randomInt(max) {
	return Math.floor(Math.random() * max);
}

function createIsland() {
	return { x: randomInt(GRID_WIDTH - 2), y: randomInt(GRID_HEIGHT - 2) };
}

function createNPC(id) {
	const npc = new Ship(Math.floor(Math.random()), randomInt(GRID_WIDTH), randomInt(GRID_HEIGHT));
	npc.randomType();
	return npc;

}

function initWorld(ioParam) {
	io = ioParam;
	islands = [];
	for (let i = 0; i < N_ISLANDS; i++) islands.push(createIsland());
	npcShips = [];
	for (let i = 0; i < N_NPCS; i++) npcShips.push(createNPC(i)); 
}

function addPlayer(id) {
	players[id] = new Ship(id, randomInt(GRID_WIDTH), randomInt(GRID_HEIGHT));

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
		if (dx + dy <= player.cannon.range) {
			dmg = player.cannon.getDamage();
			npc.hp -= dmg

			io.to(id).emit("shotResult", {
				damage: dmg,
				missed: dmg === 0,
				targetType: npc.type,
			});

			return;
		}
	}

	io.to(id).emit("shotResult", {
		damage: 0,
		missed: true,
		targetType: "none",
	});

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
			if (dx + dy <= npc.cannon.range) {
				p.hp -= npc.cannon.getDamage();
			}
		}
	}

	for (let i = 0; i < npcShips.length; i++) {
		if (npcShips[i].hp <= 0) {
			npcShips.splice(i, 1);
			i--;
		}
	}

	if (npcShips.length < MAX_NPCS) {
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
