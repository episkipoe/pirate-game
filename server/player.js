const Ship = require("./ship");

class Player {
	constructor(ship) {
		this.ship = ship
		this.xp = 0
	}

	pickup(booty) {
		this.ship.pickup(booty)
	}

	respawn(x, y) {
		this.xp += Math.floor(this.ship.gold * 0.1)
		this.sunk = false
		this.ship.respawn(x, y)
	}
}

module.exports = Player;
