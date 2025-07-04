const COOLDOWN_TIME = 60;

const islandTypes = [
	"Treasure Island",
	"AddCannon",
	"UpgradeRange",
	"Hospital Island",
	"Recruitment Isle"

];

function randomIslandType() {
	return islandTypes[Math.floor(Math.random() * islandTypes.length)];
}

function randomInt(max) {
	return Math.floor(Math.random() * max);
}

class Island {
	constructor(x, y) {
		this.x = x;
		this.y = y;
		this.cooldown = 0;
		this.type = randomIslandType();
	}

	land(player) {
		if (this.cooldown > 0) {
			return "";
		}

		this.cooldown = COOLDOWN_TIME;

		const empty = Math.random() < 0.1; // 10% chance
		if (empty) {
			return `You don't find anything interesting`;
		}

		const ship = player.ship

		player.xp++
		switch (this.type) {
			case "Treasure Island": {
				const gold = randomInt(50, 150);
				ship.gold = (ship.gold || 0) + gold;
				return `You dug up ${gold} gold!`;
			}

			case "AddCannon":
				ship.cannon.count += 1;
				return `Your cannons were upgraded! +1`;

			case "UpgradeRange":
				ship.cannon.range = Math.min(ship.cannon.range + 1, 8);
				return `Your cannons were upgraded! +1`;

			case "Hospital Island":
				ship.hp = Math.min(ship.hp + 25, 100);
				return `Your ship was repaired`;

			case "Recruitment Isle":
				ship.crew.count += 1;
				return `You found a marooned sailor +1`;

			default:
				return `Missing handler for island type: ${this.type}`;
		}
	}

	tick() {
		this.cooldown--;
	}
}

module.exports = Island;
