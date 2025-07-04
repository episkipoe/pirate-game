class Cannon {
	constructor(count = 1, shotType = "standard") {
		this.count = count;
		this.shotType = shotType;
		this.range = 4;
		this.cooldown = 0;
		this.cooldownTime = 5;
	}

	fire(modifier) {
		const base = modifier;

		let total = 0;
		for (let i = 0; i < this.count; i++) {
			const miss = Math.random() < 0.1; // 10% miss chance
			if (!miss) {
				total += base + Math.floor(Math.random() * 3); // Slight variability
			}
		}
		this.cooldown = this.cooldownTime;
		return total;
	}

	tick() {
		this.cooldown--;
	}


	canFire(dx) {
		return (dx < this.range && this.cooldown <= 0)
	}
}

module.exports = Cannon;
