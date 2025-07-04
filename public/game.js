const socket = io();
const TILE_SIZE = 50;
const EXPLOSION_SIZE = 12
const VIEW_RADIUS = 10;

let scene;
let myId = null;

const config = {
	type: Phaser.AUTO,
	width: (VIEW_RADIUS * 2 + 1) * TILE_SIZE,
	height: (VIEW_RADIUS * 2 + 1) * TILE_SIZE,
	parent: "gameContainer",
	scene: {
		preload: function () {},
		create: function () {
			scene = this;
			this.input.keyboard.on('keydown', e => {
				if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
					const dir = e.key.replace("Arrow", "").toLowerCase();
					socket.emit("move", dir);
				} else if (e.key === "n") {
					socket.emit("newWorld");
				} else if (e.key === "d") {
					socket.emit("die");
				}
			});

			this.input.on('pointerdown', function (pointer) {
				if (!myId || !scene || !scene.playerPos) return;

				const me = scene.playerPos;
				const clickX = pointer.x;
				const clickY = pointer.y;

				const dx = Math.round((clickX - config.width / 2) / TILE_SIZE);
				const dy = Math.round((clickY - config.height / 2) / TILE_SIZE);

				let dir = null;
				if (Math.abs(dx) > Math.abs(dy)) {
					dir = dx > 0 ? 'right' : 'left';
				} else if (Math.abs(dy) > 0) {
					dir = dy > 0 ? 'down' : 'up';
				}

				if (dir) {
					socket.emit("move", dir);
				}
			});
		},
		update: function () {}
	}
};

const game = new Phaser.Game(config);

document.getElementById("startButton").onclick = () => {
	const name = document.getElementById("nameInput").value;
	socket.emit("setName", name);
};

socket.on("connect", () => {
	myId = socket.id;
});

let fireCooldown = false;

document.getElementById("fireButton").onclick = () => {
	if (fireCooldown) return; // ?? Don't allow firing again during cooldown
	const me = state.players[myId];
	if (me.sunk) return;

	socket.emit("fireCannons"); // ? Fire the cannons

	fireCooldown = true;
	document.getElementById("fireButton").disabled = true;

	let cooldownTime = 10;
	const cooldownDisplay = document.getElementById("cooldownDisplay");
	cooldownDisplay.innerText = `Cooldown: ${cooldownTime}s`;

	const interval = setInterval(() => {
		cooldownTime--;
		if (cooldownTime > 0) {
			cooldownDisplay.innerText = `Cooldown: ${cooldownTime}s`;
		} else {
			clearInterval(interval);
			fireCooldown = false;
			document.getElementById("fireButton").disabled = false;
			cooldownDisplay.innerText = "";
		}
	}, 1000);
};

function getShipStatus(ship) {
	return "Cannons: " + ship.cannon.count + " Crew: " + ship.crew.count;
}

function getServerGoldStatus(state) {
	let total = 0;
	let richest = { name: "", gold: 0 }
	for (let id in state.players) {
		const p = state.players[id].ship;
		total += p.gold
		if (p.gold > richest.gold) {
			richest.name = p.name
			richest.gold = p.gold
		}
	}
	return "Total gold: " + total + "(" + richest.name + ")";
}



socket.on("gameState", (state) => {
	window.latestGameState = state; 
	if (!scene) return;
	scene.children.removeAll();

	const me = state.players[myId];
	const ship = state.players[myId].ship;
	if (!ship) return;

	scene.playerPos = { x: ship.x, y: ship.y };

	document.getElementById("coordDisplay").innerText = `(${ship.x}, ${ship.y})`;
	document.getElementById("goldDisplay").innerText = `💰 Gold: ${ship.gold || 0}`;
	document.getElementById("xpDisplay").innerText = `⭐ XP: ${me.xp || 0}`;
	document.getElementById("shipStatus").innerText = getShipStatus(ship);
	document.getElementById("serverGold").innerText = getServerGoldStatus(state);

	const centerX = config.width / 2;
	const centerY = config.height / 2;

	// Draw visible blue water tiles with checkerboard pattern
	//
	for (let dy = -VIEW_RADIUS; dy <= VIEW_RADIUS; dy++) {
		for (let dx = -VIEW_RADIUS; dx <= VIEW_RADIUS; dx++) {
			const tx = ship.x + dx;
			const ty = ship.y + dy;
			const key = `${tx},${ty}`;
			const x = centerX + dx * TILE_SIZE;
			const y = centerY + dy * TILE_SIZE;

			// Checkerboard: alternate opacity based on tile position
			const alpha = (tx + ty) % 2 === 0 ? 1.0 : 0.85;

			const tile = scene.add.rectangle(x, y, TILE_SIZE, TILE_SIZE, 0x3399ff);
			tile.setOrigin(0.5);
			tile.setAlpha(alpha);
		}
	}


	for (let island of state.islands) {
		const dx = island.x - ship.x;
		const dy = island.y - ship.y;
		if (Math.abs(dx) > VIEW_RADIUS || Math.abs(dy) > VIEW_RADIUS) continue;
		const x = centerX + dx * TILE_SIZE;
		const y = centerY + dy * TILE_SIZE;
		const tile = scene.add.text(x, y, "🏝️", { fontSize: TILE_SIZE + "px" });
		tile.setOrigin(0.5);
		if (island.cooldown > 0) {
			tile.setAlpha(0.5);
		}

	}

	for (let npc of state.npcShips) {
		const dx = npc.x - ship.x;
		const dy = npc.y - ship.y;
		if (Math.abs(dx) > VIEW_RADIUS || Math.abs(dy) > VIEW_RADIUS) continue;
		const x = centerX + dx * TILE_SIZE;
		const y = centerY + dy * TILE_SIZE;
		scene.add.text(x, y, "🚢", { fontSize: TILE_SIZE + "px" }).setOrigin(0.5);
		// Draw type centered *inside* the tile above
		scene.add.text(x, y - TILE_SIZE, npc.type, {
			fontSize: `${TILE_SIZE / 2}px`,
			fill: "#ffffff",
			backgroundColor: "rgba(0, 0, 0, 0.5)",
			align: "center",
		}).setOrigin(0.5);

		scene.add.text(x, y + TILE_SIZE, npc.hp, {
			fontSize: `${TILE_SIZE / 2}px`,
			fill: "#ffffff",
			backgroundColor: "rgba(0, 0, 0, 0.5)",
			align: "center",
		}).setOrigin(0.5);

		const dist = Math.abs(npc.x - ship.x) + Math.abs(npc.y - ship.y);
		if (dist <= ship.cannon.range) {
			const outline = scene.add.rectangle(x, y, TILE_SIZE, TILE_SIZE);
			outline.setStrokeStyle(4, 0xFF0000);
			outline.setOrigin(0.5);
		}

		if (npc.hit > 0) {
			scene.add.text(x, y, "💥", { fontSize: EXPLOSION_SIZE + "px" }).setOrigin(0.5);
		}
	}

	for (let id in state.players) {
		const p = state.players[id].ship;
		const dx = p.x - ship.x;
		const dy = p.y - ship.y;
		if (Math.abs(dx) > VIEW_RADIUS || Math.abs(dy) > VIEW_RADIUS) continue;
		const x = centerX + dx * TILE_SIZE;
		const y = centerY + dy * TILE_SIZE;

		// Draw name centered *inside* the tile above
		scene.add.text(x, y - TILE_SIZE, p.name, {
			fontSize: `${TILE_SIZE / 2}px`,
			fill: "#ffffff",
			backgroundColor: "rgba(0, 0, 0, 0.5)",
			align: "center",
		}).setOrigin(0.5);

		if (state.players[id].sunk) {
			scene.add.text(x, y, "👻", { fontSize: TILE_SIZE + "px" }).setOrigin(0.5);
		} else {
			scene.add.text(x, y, "☠️", { fontSize: TILE_SIZE + "px" }).setOrigin(0.5);

			scene.add.text(x, y + TILE_SIZE, p.hp, {
				fontSize: `${TILE_SIZE / 2}px`,
				fill: "#ffffff",
				backgroundColor: "rgba(0, 0, 0, 0.5)",
				align: "center",
			}).setOrigin(0.5);
				scene.add.text(x, y, `${p.hp}`, { fontSize: "16px", color: "#000" }).setOrigin(0.5);

			if (p.hit > 0) {
				scene.add.text(x, y, "💥", { fontSize: EXPLOSION_SIZE + "px" }).setOrigin(0.5);
			}

		}

	}
});

socket.on("shotResult", ({ damage, missed, targetType, booty }) => {
	const div = document.getElementById("shotResultDisplay");
	let result = "";

	if (missed) {
		result = `You missed!`;
	} else {
		result = `Hit the ${targetType} for ${damage} damage!`;
	}

	if (booty) {
		if (booty.gold) {
			result += ` Looted ${booty.gold}`;
		}

		if (booty.hp) {
			result += ` Recovered ${booty.hp} HP`;
		}

		if (booty.cannon) {
			result += ` Picked up a cannon`;
		}
	} 

	div.innerText = result;

	// Clear after 10 seconds
	setTimeout(() => {
		div.innerText = "";
	}, 10000);
});


let messageTimeout;

socket.on("message", (message) => {
	const div = document.getElementById("message");

	div.innerText = message;

	clearTimeout(messageTimeout); // clear previous timeout if any
	messageTimeout = setTimeout(() => {
		div.innerText = '';
	}, 10000);
});

