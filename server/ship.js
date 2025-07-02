const Cannon = require("./cannon");
const Crew = require("./crew");

class Ship {
	constructor(id, x, y) {
		this.id = id;
		this.name = "Pirate";
		this.x = x;
		this.y = y;
		this.hp = 100;
		this.cannon = new Cannon();
		this.crew = new Crew();
	}

	randomType() {
		const types = [
			{ name: "Sloop", hp: 40, crew: 5, cannon: [1, "grape"] },
			{ name: "Brigantine", hp: 70, crew: 12, cannon: [2, "standard"] },
			{ name: "Schooner", hp: 60, crew: 10, cannon: [1, "chain"] },
			{ name: "Galleon", hp: 120, crew: 30, cannon: [4, "standard"] },
			{ name: "Frigate", hp: 100, crew: 25, cannon: [3, "chain"] },
			{ name: "Man-of-war", hp: 160, crew: 40, cannon: [5, "standard"] },
			{ name: "Fishing Boat", hp: 20, crew: 3, cannon: [0, "grape"] },
			{ name: "Corsair", hp: 75, crew: 15, cannon: [2, "grape"] },
			{ name: "Privateer", hp: 90, crew: 18, cannon: [2, "standard"] },
			{ name: "Junk", hp: 70, crew: 14, cannon: [2, "chain"] },
			{ name: "Barque", hp: 110, crew: 22, cannon: [3, "standard"] },
			{ name: "Caravel", hp: 65, crew: 8, cannon: [1, "chain"] },
			{ name: "Raft", hp: 10, crew: 1, cannon: [0, "grape"] },
			{ name: "Ghost Ship", hp: 90, crew: 0, cannon: [3, "grape"] },
			{ name: "Fire Ship", hp: 30, crew: 2, cannon: [1, "standard"] },
			{ name: "Merchantman", hp: 95, crew: 20, cannon: [1, "chain"] },
			{ name: "Naval Cutter", hp: 60, crew: 10, cannon: [2, "standard"] },
			{ name: "Slaver", hp: 85, crew: 25, cannon: [2, "grape"] },
		];

		const ship = types[Math.floor(Math.random() * types.length)];

		this.name = ship.name;
		this.type = ship.name;
		this.hp = ship.hp;
		this.crew.count = ship.crew;
		this.cannon = new Cannon(...ship.cannon); // count, shotType
	}

	
}

module.exports = Ship ;
