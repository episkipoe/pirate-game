const Player = require("./player");
const Ship = require("./ship");
const Island = require("./island");


const GRID_WIDTH = 300;
const GRID_HEIGHT = 300;

const N_ISLANDS = 400;
const N_NPCS = 120;
const MAX_NPCS = 255;

let io;

const players = {};
let npcShips = [];
let islands = [];

function randomInt(max) {
	return Math.floor(Math.random() * max);
}

function createIsland() {
	return new Island(randomInt(GRID_WIDTH - 2), randomInt(GRID_HEIGHT - 2));
}

function totalGold() {
	return Object.values(players).reduce((sum, p) => sum + (p.ship?.gold || 0), 0);
	
}

function createNPC() {
	const npc = new Ship(randomInt(64000), randomInt(GRID_WIDTH), randomInt(GRID_HEIGHT));
	npc.randomType(totalGold());
	return npc;

}

function initWorld(ioParam) {
	io = ioParam;
	islands = [];
	for (let i = 0; i < N_ISLANDS; i++) islands.push(createIsland());
	npcShips = [];
	for (let i = 0; i < N_NPCS; i++) npcShips.push(createNPC()); 
}

function die(id) {
	console.log("Sink: " + id)
	players[id].sunk = true
}


function addPlayer(id) {
	players[id] = new Player(new Ship(id, randomInt(GRID_WIDTH), randomInt(GRID_HEIGHT)));

}

function removePlayer(id) {
	delete players[id];
}

function movePlayer(id, dir) {
	const p = players[id].ship;
	if (!p) return;
	if (dir === "left") p.x = Math.max(0, p.x - 1);
	if (dir === "right") p.x = Math.min(GRID_WIDTH - 1, p.x + 1);
	if (dir === "up") p.y = Math.max(0, p.y - 1);
	if (dir === "down") p.y = Math.min(GRID_HEIGHT - 1, p.y + 1);
}

function setPlayerName(id, name) {
	if (players[id]) players[id].ship.name = name;
}

function fireCannons(id) {
	const ship = players[id].ship;
	if (!ship || players[id].sunk) return;
	for (const npc of npcShips) {
		const dx = Math.abs(npc.x - ship.x);
		const dy = Math.abs(npc.y - ship.y);
		if (dx + dy <= ship.cannon.range) {
			dmg = ship.cannon.fire();

			io.to(id).emit("shotResult", {
				damage: dmg,
				missed: dmg === 0,
				targetType: npc.type,
				booty: booty
			});

			return;
		}
	}

	io.to(id).emit("shotResult", {
		damage: 0,
		missed: true,
		targetType: "none",
		booty: {}
	});

}

let spawnCooldown = 5;

function updateNPCs() {
	for (const npc of npcShips) {
		npc.tick();

		let blocked = false
		for (const id in players) {
			const player = players[id];
			const playerShip = player.ship;
			const dx = Math.abs(npc.x - playerShip.x);
			const dy = Math.abs(npc.y - playerShip.y);
			if (dx <= 1 && dy <= 1) {
				blocked = true
			}
			if (npc.cannon.canFire(dx + dy)) {
				playerShip.getHitFor(npc.fire());

				if (playerShip.hp <= 0) {
					io.to(id).emit("message", "Your ship has been sunk!");

					// Reset or mark for respawn
					players[id].sunk = true;

					// Schedule respawn
					setTimeout(() => {
						player.respawn(randomInt(0, GRID_WIDTH), randomInt(0, GRID_HEIGHT))
						io.to(id).emit("message", "Welcome back!.");
					}, 10000);
				}
			}

			if (playerShip.cannon.canFire(dx + dy)) {
				const dmg = playerShip.fire();
				const booty = npc.getHitFor(dmg)
				if (booty.xp) {
					io.to(id).emit("message", "You sank the " + npc.type + "!");
					player.pickup(booty)
				} else {
					io.to(id).emit("message", dmg);
				}
			}
		}

		if (!blocked) {
			if (!npc.destination || npc.x === npc.destination.x && npc.y === npc.destination.y) {
				// Pick a random island as new destination
				const island = islands[Math.floor(Math.random() * islands.length)];
				if (island) {
					npc.destination = { x: island.x, y: island.y };
				}
			}

			// Move toward destination 1 step
			if (npc.destination) {
				if (npc.x < npc.destination.x) npc.x++;
				else if (npc.x > npc.destination.x) npc.x--;

				if (npc.y < npc.destination.y) npc.y++;
				else if (npc.y > npc.destination.y) npc.y--;
			}
		}
		

	}

	for (let i = 0; i < npcShips.length; i++) {
		if (npcShips[i].hp <= 0) {
			npcShips.splice(i, 1);
			i--;
		}
	}

	spawnCooldown--;
	if (spawnCooldown <= 0) {
		spawnCooldown = 5;
		if (npcShips.length < MAX_NPCS) {
			npcShips.push(createNPC());
		}
	}
}

function updateIslands() {
	for (const i of islands) {
		i.tick();
		for (const id in players) {
			const p = players[id];
			const s = p.ship
			if (i.x == s.x && i.y == s.y) {
				const msg = i.land(p);
				if (msg) {
					io.to(id).emit("message", msg)
				}
			}
		}
	}
}


function tick() {
	for (const id in players) {
		players[id].ship.tick();
	}
	updateNPCs();
	updateIslands();
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
	die,
	addPlayer,
	removePlayer,
	movePlayer,
	setPlayerName,
	fireCannons,
	tick,
	getState
};
