const socket = io();
const TILE_SIZE = 32;
const GRID_WIDTH = 120;
const GRID_HEIGHT = 120;
const VIEW_RADIUS = 12;

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

let fireCooldown = false;

document.getElementById("fireButton").onclick = () => {
    if (fireCooldown) return; // ?? Don't allow firing again during cooldown

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


socket.on("connect", () => {
	myId = socket.id;
});

socket.on("gameState", (state) => {
	window.latestGameState = state; 
	if (!scene) return;
	scene.children.removeAll();

	const me = state.players[myId];
	if (!me) return;

	scene.playerPos = { x: me.x, y: me.y };

	document.getElementById("coordDisplay").innerText = `(${me.x}, ${me.y})`;

	const centerX = config.width / 2;
	const centerY = config.height / 2;

	const visibleTiles = new Set();
	// Draw visible blue water tiles with checkerboard pattern
	for (let dy = -VIEW_RADIUS; dy <= VIEW_RADIUS; dy++) {
		for (let dx = -VIEW_RADIUS; dx <= VIEW_RADIUS; dx++) {
			const tx = me.x + dx;
			const ty = me.y + dy;
			const key = `${tx},${ty}`;
			visibleTiles.add(key);
			//if (!visibleTiles.has(key)) continue;
			const x = centerX + dx * TILE_SIZE;
			const y = centerY + dy * TILE_SIZE;

			// Checkerboard: alternate opacity based on tile position
			const alpha = (tx + ty) % 2 === 0 ? 1.0 : 0.85;

+			scene.add.rectangle(x, y, TILE_SIZE, TILE_SIZE, 0x3399ff).setOrigin(0.5); // blue water
			//tile.setAlpha(alpha);
		}
	}


	for (let island of state.islands) {
		for (let dx = 0; dx < 2; dx++) {
			for (let dy = 0; dy < 2; dy++) {
				const key = `${island.x + dx},${island.y + dy}`;
				if (!visibleTiles.has(key)) continue;
				const drawX = centerX + (island.x + dx - me.x) * TILE_SIZE;
				const drawY = centerY + (island.y + dy - me.y) * TILE_SIZE;
				scene.add.text(drawX, drawY, "🏝️", {
					fontSize: TILE_SIZE + "px"
				}).setOrigin(0.5);
			}
		}
	}

	for (let npc of state.npcShips) {
		const dx = npc.x - me.x;
		const dy = npc.y - me.y;
		if (Math.abs(dx) > VIEW_RADIUS || Math.abs(dy) > VIEW_RADIUS) continue;
		const x = centerX + dx * TILE_SIZE;
		const y = centerY + dy * TILE_SIZE;
		scene.add.text(x, y, "🚢", { fontSize: TILE_SIZE + "px" }).setOrigin(0.5);
		scene.add.text(x, y - TILE_SIZE * 0.6, npc.type, { fontSize: "16px" }).setOrigin(0.5);
		scene.add.text(x, y + TILE_SIZE * 0.6, `HP: ${npc.hp}`, { fontSize: "16px", color: "#000" }).setOrigin(0.5);
		const dist = Math.abs(npc.x - me.x) + Math.abs(npc.y - me.y);
		if (dist <= 4) {
			const outline = scene.add.rectangle(x, y, TILE_SIZE, TILE_SIZE);
			outline.setStrokeStyle(4, 0xFF0000);
			outline.setOrigin(0.5);
		}
	}

	for (let id in state.players) {
		const p = state.players[id];
		const dx = p.x - me.x;
		const dy = p.y - me.y;
		if (Math.abs(dx) > VIEW_RADIUS || Math.abs(dy) > VIEW_RADIUS) continue;
		const x = centerX + dx * TILE_SIZE;
		const y = centerY + dy * TILE_SIZE;
		const color = id === myId ? 0xffffff : 0x888888;
		scene.add.rectangle(x, y, TILE_SIZE, TILE_SIZE, color);
		scene.add.text(x, y - TILE_SIZE * 0.6, p.name, { fontSize: "16px" }).setOrigin(0.5);
	}
});

socket.on("shotResult", ({ damage, missed, targetType }) => {
	const div = document.getElementById("shotResultDisplay");
	if (targetType == "none") {
		div.innerText = `x`;
	} if (missed) {
		div.innerText = `You missed the ${targetType}!`;
	} else {
		div.innerText = `Hit the ${targetType} for ${damage} damage!`;
	}

	// Clear after 10 seconds
	setTimeout(() => {
		div.innerText = "";
	}, 10000);
});

