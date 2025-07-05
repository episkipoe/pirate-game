const COOLDOWN_TIME = 60;

const islandTypes = [
	"Treasure Island",
	"Treasure Island",
	"AddCannon",
	"AddCannon",
	"UpgradeRange",
	"UpgradeMaxHP",
	"Hospital Island",
	"SailorsLeave",
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
				return `You found a cannon`;

			case "UpgradeRange":
				ship.cannon.range = Math.min(ship.cannon.range + 1, 8);
				return `Your cannon range is upgraded!`;

			case "UpgradeMaxHP":
				if (ship.maxHP < 255) {
					ship.maxHP += 10;
					return "Your ship has been upgraded"
				} 
				//fallthrough
			case "Hospital Island":
				ship.hp = Math.min(ship.hp + 25, ship.maxHP);
				return `Your ship was repaired`;

			case "SailorsLeave": {
				const crewDelta = randomInt(1, 5);
				if (ship.crew.count > crewDelta) {
					ship.crew.count -= crewDelta;
					return `Some of your crew fails to return`;
				}
			}
				//fallthrough
			case "Recruitment Isle":
				ship.crew.count += randomInt(1, 5);
				return `You found a marooned sailor`;

			default:
				return `Missing handler for island type: ${this.type}`;
		}
	}

	tick() {
		this.cooldown--;
	}
}

module.exports = Island;
