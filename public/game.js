let socket;
const TILE_SIZE = 32;
const MAP_WIDTH = 20;
const MAP_HEIGHT = 15;
let playerSprites = {};
let players = {};
let scene;

document.getElementById("startBtn").addEventListener("click", () => {
    const name = document.getElementById("nameInput").value.trim() || "Anon";
    localStorage.setItem("pirateName", name);

    socket = io();

    socket.on("connect", () => {
        socket.emit("register", name);
    });

    socket.on("gameState", (state) => {
        players = state;

        for (let id in playerSprites) {
            if (!players[id]) {
                playerSprites[id].rect.destroy();
                playerSprites[id].label.destroy();
                delete playerSprites[id];
            }
        }

        for (let id in players) {
            const player = players[id];
            const centerX = player.x * TILE_SIZE + TILE_SIZE / 2;
            const centerY = player.y * TILE_SIZE + TILE_SIZE / 2;

            if (!playerSprites[id]) {
                const color = Phaser.Display.Color.RandomRGB();
                const rect = scene.add.rectangle(centerX, centerY, TILE_SIZE * 0.8, TILE_SIZE * 0.8, color.color);
                const label = scene.add.text(centerX, centerY - TILE_SIZE / 1.2, player.name, {
                    fontSize: '12px',
                    color: '#000'
                }).setOrigin(0.5);
                playerSprites[id] = { rect, label };
            } else {
                playerSprites[id].rect.x = centerX;
                playerSprites[id].rect.y = centerY;
                playerSprites[id].label.x = centerX;
                playerSprites[id].label.y = centerY - TILE_SIZE / 1.2;
                playerSprites[id].label.text = player.name;
            }
        }
    });

    const config = {
        type: Phaser.AUTO,
        width: TILE_SIZE * MAP_WIDTH,
        height: TILE_SIZE * MAP_HEIGHT,
        backgroundColor: '#87CEEB',
        parent: 'game-container',
        scene: { create, update }
    };

    new Phaser.Game(config);
});

function create() {
    scene = this;

    this.input.keyboard.on('keydown', (event) => {
        let dx = 0, dy = 0;
        switch (event.key) {
            case 'ArrowUp': dy = -1; break;
            case 'ArrowDown': dy = 1; break;
            case 'ArrowLeft': dx = -1; break;
            case 'ArrowRight': dx = 1; break;
        }

        if (dx || dy) {
            socket.emit('playerAction', { type: 'move', dx, dy });
        }
    });
}

function update() {}
