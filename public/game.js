const GRID_WIDTH = 300;
const GRID_HEIGHT = 300;

const socket = io();
const TILE_SIZE = 45;
const EXPLOSION_SIZE = 40
const VIEW_RADIUS = 12;

const seaEmojis = ["🌊", "⚓", "🦑", "🐙", "🦀", "🐬", "🐳", "🦈"];


let scene;
let myId = null;

const config = {
	type: Phaser.AUTO,
	width: window.innerWidth,
	height: window.innerHeight,
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

socket.on("connect", () => {
	myId = socket.id;

	const dialog = document.getElementById("nameDialog");
	dialog.showModal(); 
});

document.getElementById("nameForm").onsubmit = () => {
	const name = document.getElementById("playerName").value.trim();
	if (name.length > 0) {
		socket.emit("setName", name);
	}
};


function getCannonCooldown(cannon) {
	return cannon.cooldown > 0 ? "Cannons reloading: " + cannon.cooldown : "Cannons ready to fire"
}

function getServerGoldStatus(state) {
	let total = 0;
	let players = [];

	for (let id in state.players) {
		const ship = state.players[id].ship;
		if (!ship) continue;

		total += ship.gold;
		players.push({ name: ship.name, gold: ship.gold });
	}

	// Sort by gold descending
	players.sort((a, b) => b.gold - a.gold);

	// Take top 5
	const top = players.slice(0, 5);

	let leaderboard = "Total 💰: " + total + "\n";
	top.forEach((p, i) => {
		leaderboard += `${i + 1}. ${p.name} (${p.gold})\n`;
	});

	return leaderboard.trim();
}


function updateHUD(player) {
	const hud = document.getElementById("hud");
	if (!player || !player.ship) return;

	const cannonCount = player.ship.cannon.count;
	const crewCount = player.ship.crew.count;
	const gold = player.ship.gold;
	const xp = player.xp || 0;

	let text = ''
	text += `💰 Gold: ${gold}\n⭐ XP: ${xp}`;
	text += `\n🧔 Crew: ${crewCount}\n💣 Cannons: ${cannonCount}`;

	hud.innerText = text;
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
	document.getElementById("cannonCooldown").innerText = getCannonCooldown(ship.cannon);
	document.getElementById("serverGold").innerText = getServerGoldStatus(state);
	updateHUD(me);
	
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

			if (tx < 0 || tx > GRID_WIDTH || ty < 0 || ty > GRID_HEIGHT) {
				const tile = scene.add.rectangle(x, y, TILE_SIZE, TILE_SIZE, 0x000);
				tile.setOrigin(0.5);
			} else {
				if (Math.random() < 0.01) {
					let emoji = seaEmojis[Math.floor(Math.random() * seaEmojis.length)];
					const tile = scene.add.text(x, y, emoji, { fontSize: EXPLOSION_SIZE + "px" });
					tile.setOrigin(0.5);
				}


				// Checkerboard: alternate opacity based on tile position
				const alpha = (tx + ty) % 2 === 0 ? 1.0 : 0.85;

				const tile = scene.add.rectangle(x, y, TILE_SIZE, TILE_SIZE, 0x3399ff);
				tile.setOrigin(0.5);
				tile.setAlpha(alpha);
			}
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

		console.log(npc.hp)

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

