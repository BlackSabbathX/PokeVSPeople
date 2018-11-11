import Socket from "/js/socket.js";

export default class Stats {
	constructor(stats) {
		this.castStats(stats);
	}

	castStats(stats) {
		this.speedX = stats.speed;
		this.speedY = stats.speed;
		this.speedNormalizer = 0.7;
		this.range = stats.range;
		this.shakeRate = 0.001 * this.range;
		this.explosionTime = 3000;
	}
}
