const socket = io();
const TILE_SIZE = 32;
let scene;
let playerSprites = {};
let npcSprites = {};
let myId = null;

const config = {
    type: Phaser.AUTO,
    width: TILE_SIZE * 40,
    height: TILE_SIZE * 30,
    backgroundColor: '#87CEEB',
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
        },
        update: function () {}
    }
};

new Phaser.Game(config);

socket.on("gameState", state => {
    myId = socket.id;
    for (let id in playerSprites) {
        playerSprites[id].container.destroy();
    }
    playerSprites = {};

    for (let id in state.players) {
        const p = state.players[id];
        const x = p.x * TILE_SIZE + TILE_SIZE / 2;
        const y = p.y * TILE_SIZE + TILE_SIZE / 2;
        const color = (id === socket.id) ? 0x00ff00 : 0x0000ff;
        const rect = scene.add.rectangle(0, 0, TILE_SIZE * 0.8, TILE_SIZE * 0.8, color);
        const label = scene.add.text(0, -TILE_SIZE * 0.6, p.name, { fontSize: '10px', color: '#000' }).setOrigin(0.5);
        const hp = scene.add.text(0, TILE_SIZE * 0.5, `HP: ${p.hp}`, { fontSize: '8px', color: '#333' }).setOrigin(0.5);
        const container = scene.add.container(x, y, [rect, label, hp]);
        playerSprites[id] = { container };
    }

    for (let id in npcSprites) {
        npcSprites[id].destroy();
    }
    npcSprites = {};

    for (let npc of state.npcShips) {
        const x = npc.x * TILE_SIZE + TILE_SIZE / 2;
        const y = npc.y * TILE_SIZE + TILE_SIZE / 2;
        const body = scene.add.rectangle(x, y, TILE_SIZE * 0.9, TILE_SIZE * 0.9, 0x555555);
        const label = scene.add.text(x, y - TILE_SIZE * 0.9, npc.type, { fontSize: '10px', color: '#fff' }).setOrigin(0.5);
        const hp = scene.add.text(x, y + TILE_SIZE * 0.6, `HP: ${npc.hp}`, { fontSize: '8px', color: '#ccc' }).setOrigin(0.5);
        const group = scene.add.container(0, 0, [body, label, hp]);
        npcSprites[npc.id] = group;
    }
});

document.getElementById("startButton").addEventListener("click", () => {
    const name = document.getElementById("nameInput").value.trim();
    if (name) {
        socket.emit("setName", name);
        document.getElementById("startButton").innerText = "Rename";
    }
});

const fireButton = document.getElementById("fireButton");
const cooldownDisplay = document.getElementById("cooldownDisplay");
let canFire = true;
let cooldownTimer = null;

fireButton.addEventListener("click", () => {
    if (!canFire) return;
    socket.emit("fireCannons");

    canFire = false;
    fireButton.disabled = true;
    let remaining = 10;
    cooldownDisplay.textContent = `Reloading... ${remaining}s`;

    cooldownTimer = setInterval(() => {
        remaining--;
        if (remaining <= 0) {
            clearInterval(cooldownTimer);
            fireButton.disabled = false;
            cooldownDisplay.textContent = "";
            canFire = true;
        } else {
            cooldownDisplay.textContent = `Reloading... ${remaining}s`;
        }
    }, 1000);
});

