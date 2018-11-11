import Socket from "/js/socket.js";
import { BOMB_EXPLODING } from "/js/strings.js";

export default class Bomb {
	constructor(scene, stats) {
		this.scene = scene;
		this.planted = false;
		this.stats = stats;
		this.sprite = scene.physics.add
			.sprite(-5, -5, "bomb")
			.disableBody(false, true);
		this.explosion = scene.physics.add.group();
	}

	putAt(x, y, autoExplodes, collideLayer, rocksLayer) {
		if (this.planted) return false;
		this.planted = true;
		this.sprite
			.enableBody(true, x, y, false, true)
			.setScale(0.8)
			.play("bomb", true);
		if (autoExplodes)
			setTimeout(
				() =>
					this.calcMaxins(collideLayer, rocksLayer, x, y).then(
						constraints =>
							this.explode(constraints, true, rocksLayer)
					),
				this.stats.explosionTime - 50,
				this
			);
	}

	async calcMaxins(collideLayer, rocksLayer, xW, yW) {
		let constraints = {
			toBreak: [],
			x: xW,
			y: yW
		};
		let n = 0;
		for (let x = 1; x <= this.stats.range; x++) {
			const posX = xW + 32 * x;
			if (collideLayer.hasTileAtWorldXY(posX, yW)) {
				constraints.maxX = x - 1;
				break;
			} else if (rocksLayer.hasTileAtWorldXY(posX, yW)) {
				constraints.toBreak.push({ x: posX, y: yW });
				constraints.maxX = x;
				break;
			}
			constraints.maxX = x;
		}
		for (let x = -1; x >= -this.stats.range; x--) {
			const posX = xW + 32 * x;
			if (collideLayer.hasTileAtWorldXY(posX, yW)) {
				constraints.minX = x + 1;
				break;
			} else if (rocksLayer.hasTileAtWorldXY(posX, yW)) {
				constraints.toBreak.push({ x: posX, y: yW });
				constraints.minX = x;
				break;
			}
			constraints.minX = x;
		}
		for (let y = 1; y <= this.stats.range; y++) {
			const posY = yW + 32 * y;
			if (collideLayer.hasTileAtWorldXY(xW, posY)) {
				constraints.maxY = y - 1;
				break;
			} else if (rocksLayer.hasTileAtWorldXY(xW, posY)) {
				constraints.toBreak.push({ x: xW, y: posY });
				constraints.maxY = y;
				break;
			}
			constraints.maxY = y;
		}
		for (let y = -1; y >= -this.stats.range; y--) {
			const posY = yW + 32 * y;
			if (collideLayer.hasTileAtWorldXY(xW, posY)) {
				constraints.minY = y + 1;
				break;
			} else if (rocksLayer.hasTileAtWorldXY(xW, posY)) {
				constraints.toBreak.push({ x: xW, y: posY });
				constraints.minY = y;
				break;
			}
			constraints.minY = y;
		}
		return constraints;
	}

	explode(constraints, autoExplodes, rocksLayer) {
		if (autoExplodes) Socket.emit(BOMB_EXPLODING, constraints);
		this.planted = false;
		this.scene.cameras.main.shake(500, this.stats.shakeRate);
		let position = 0;
		const { minX, maxX, minY, maxY, x, y } = constraints;
		for (let index = minY; index <= maxY; index++) {
			if (index !== 0) {
				let anim = "explosion-mid-v";
				if (index === minY) anim = "explosion-up";
				else if (index === maxY) anim = "explosion-down";
				this.explosion.add(
					this.scene.physics.add.sprite(x, y + 32 * index, anim)
				);
				this.explosion.getChildren()[position].play(anim);
				position++;
			}
		}
		for (let index = minX; index <= maxX; index++) {
			if (index !== 0) {
				let anim = "explosion-mid-h";
				if (index === minX) anim = "explosion-left";
				else if (index === maxX) anim = "explosion-right";
				this.explosion.add(
					this.scene.physics.add.sprite(x + 32 * index, y, anim)
				);
				this.explosion.getChildren()[position].play(anim);
				position++;
			}
		}
		const { toBreak } = constraints;
		for (let index = 0; index < toBreak.length; index++) {
			const { x, y } = toBreak[index];
			rocksLayer.removeTileAtWorldXY(x, y);
		}
		this.sprite.setScale(1).play("explosion-center");
		this.sprite.once("animationcomplete", this.removeExplosion, this);
	}

	removeExplosion() {
		this.explosion.clear(true, true);
	}
}