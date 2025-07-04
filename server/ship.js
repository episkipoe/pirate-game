const Cannon = require("./cannon");
const Crew = require("./crew");

class Ship {
	constructor(id, x, y) {
		this.id = id;
		this.name = "Pirate";
		this.respawn(x, y)
	}

	respawn(x, y) {
		this.x = x;
		this.y = y;
		this.hp = 100;
		this.gold = 0;
		this.cannon = new Cannon();
		this.crew = new Crew();
		this.hit = 0;
	}

	randomType() {
		const types = [
			{ name: "Fishing Boat",hp: 20,  crew: 3,   cannon: [0, "grape"],    gold: [5, 25] },
			{ name: "Raft",        hp: 10,  crew: 1,   cannon: [0, "standard"],    gold: [0, 10] },
			{ name: "Sloop",       hp: 40,  crew: 5,   cannon: [1, "grape"],    gold: [10, 50] },
			{ name: "Brigantine",  hp: 70,  crew: 12,  cannon: [2, "standard"], gold: [50, 100] },
			{ name: "Schooner",    hp: 60,  crew: 10,  cannon: [1, "chain"],    gold: [30, 80] },
			{ name: "Galleon",     hp: 120, crew: 30,  cannon: [4, "standard"], gold: [100, 200] },
			{ name: "Frigate",     hp: 100, crew: 25,  cannon: [3, "chain"],    gold: [80, 150] },
			{ name: "Man-of-war",  hp: 160, crew: 40,  cannon: [5, "standard"], gold: [50, 100] },
			{ name: "Corsair",     hp: 75,  crew: 15,  cannon: [2, "grape"],    gold: [40, 90] },
			{ name: "Privateer",   hp: 90,  crew: 18,  cannon: [2, "standard"], gold: [50, 100] },
			{ name: "Junk",        hp: 70,  crew: 14,  cannon: [2, "chain"],    gold: [30, 90] },
			{ name: "Barque",      hp: 110, crew: 22,  cannon: [3, "standard"], gold: [70, 130] },
			{ name: "Caravel",     hp: 65,  crew: 8,   cannon: [1, "chain"],    gold: [25, 60] },
			{ name: "Fire Ship",   hp: 30,  crew: 2,   cannon: [3, "standard"], gold: [10, 40] },
			{ name: "Merchantman", hp: 95,  crew: 20,  cannon: [1, "chain"],    gold: [80, 160] },
			{ name: "Naval Cutter",hp: 60,  crew: 10,  cannon: [2, "standard"], gold: [40, 90] },
		];

		const ship = types[Math.floor(Math.random() * types.length)];
		//const ship = types[0];

		this.name = ship.name;
		this.type = ship.name;
		this.hp = ship.hp;
		this.crew.count = ship.crew;
		this.cannon = new Cannon(...ship.cannon); // count, shotType
		this.gold = ship.gold[0] + Math.floor(Math.random() * (ship.gold[1] - ship.gold[0] + 1));
		
	}

	tick() {
		this.cannon.tick();
		this.hit--;
	}

	shoot(dmg) {
		if (this.hit > 0) {
			dmg = Math.floor(dmg * 1.5)
		}
		this.hp -= dmg
		this.hit = 3
		if (this.hp <= 0) {
			let booty = { gold: this.gold,  xy: this.crew }
			if (this.cannon.count > 2 && Math.random() < 0.1) {
				booty.cannon = 1;
			}
			if (this.crew.count > 10 && Math.random() < 0.1) {
				booty.crew = 1;
			} 
			return booty;
		}
		return {}
	}

	pickup(booty) {
		if (booty.gold) {
			this.gold += booty.gold;
		}
		if (booty.hp) {
			this.hp += booty.hp;
		}
	}


	
}

module.exports = Ship ;
