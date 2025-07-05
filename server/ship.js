const Cannon = require("./cannon");
const Crew = require("./crew");

const shipTemplates = {
	low: [
		{ name: "Raft", hp: 10, crew: 1, cannon: [0, "standard"], gold: [0, 10] },
		{ name: "Fishing Boat", hp: 20, crew: 3, cannon: [0, "grape"], gold: [5, 25] },
		{ name: "Sloop", hp: 40, crew: 5, cannon: [1, "grape"], gold: [10, 50] },
		{ name: "Caravel", hp: 65, crew: 8, cannon: [1, "chain"], gold: [25, 60] },
	],
	mid: [
		{ name: "Corsair", hp: 75, crew: 15, cannon: [2, "grape"], gold: [40, 90] },
		{ name: "Brigantine", hp: 70, crew: 12, cannon: [2, "standard"], gold: [50, 100] },
		{ name: "Schooner", hp: 60, crew: 10, cannon: [1, "chain"], gold: [30, 80] },
		{ name: "Privateer", hp: 90, crew: 18, cannon: [2, "standard"], gold: [50, 100] },
		{ name: "Junk", hp: 70, crew: 14, cannon: [2, "chain"], gold: [30, 90] },
		{ name: "Merchantman", hp: 95, crew: 20, cannon: [1, "chain"], gold: [80, 160] },
		{ name: "Naval Cutter", hp: 60, crew: 10, cannon: [2, "standard"], gold: [40, 90] },
	],
	high: [
		{ name: "Barque", hp: 110, crew: 22, cannon: [3, "standard"], gold: [70, 130] },
		{ name: "Frigate", hp: 100, crew: 60, cannon: [8, "chain"], gold: [80, 150] },
		{ name: "Galleon", hp: 200, crew: 100, cannon: [6, "standard"], gold: [100, 200] },
		{ name: "Man-of-war", hp: 200, crew: 100, cannon: [10, "standard"], gold: [50, 100] },
		{ name: "Fire Ship", hp: 30, crew: 2, cannon: [3, "standard"], gold: [10, 40] },
	],
};

function weightedShipSelection(totalGold) {
	let weights = { low: 1, mid: 0, high: 0 };
	if (totalGold > 100) {
		weights.mid = 1;
	}
	if (totalGold > 500) {
		weights.high = 1;
	}
	if (totalGold > 1000) {
		weights.low = 1;
		weights.mid = 2;
		weights.high = 3;
	}

	const pool = [
		...Array(weights.low).fill(shipTemplates.low),
		...Array(weights.mid).fill(shipTemplates.mid),
		...Array(weights.high).fill(shipTemplates.high),
	].flat();

	return pool[Math.floor(Math.random() * pool.length)];
}



class Ship {
	constructor(id, x, y) {
		this.id = id;
		this.name = "Pirate";
		this.respawn(x, y)
		this.destination = null;
	}

	respawn(x, y) {
		this.x = x;
		this.y = y;
		this.hp = 100;
		this.maxHP = 100;
		this.gold = 0;
		this.cannon = new Cannon();
		this.crew = new Crew();
		this.hit = 0;
	}

	randomType(serverGold) {
		const ship = weightedShipSelection(serverGold);
		//console.log(ship)
		//const ship = { name: "test",hp: 1,  crew: 3,   cannon: [0, "grape"],    gold: [5, 25] } ;
		
		
		this.name = ship.name;
		this.type = ship.name;
		this.hp = ship.hp;
		this.crew.count = ship.crew;
		this.cannon = new Cannon(...ship.cannon); // count, shotType
		this.cannon.cooldownTime = 5
		this.gold = ship.gold[0] + Math.floor(Math.random() * (ship.gold[1] - ship.gold[0] + 1));

	}

	tick() {
		this.cannon.tick();
		this.hit--;
	}

	fire() {
		let baseDamage = 1;
		if (this.crew.count > 10) {
			baseDamage = Math.floor(this.crew.count * 0.1);
		} 
		return this.cannon.fire(baseDamage)
	}

	getHitFor(dmg) {
		if (this.hit > 0) {
			dmg = Math.floor(dmg * 1.5)
		}
		this.hp -= dmg
		this.hit = 3
		if (this.hp <= 0) {
			let xp = 1;
			if (this.crew > 10) {
				xp = Math.floor(this.crew * 0.1)
			}
			let booty = { gold: this.gold,  xp: xp }
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
