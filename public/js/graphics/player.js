import Socket from "/js/socket.js";
import Bomb from "/js/graphics/bomb.js";
import Stats from "/js/graphics/stats.js";
import { MOVING_PLAYER, PLANTING_BOMB, DIE } from "/js/strings.js";

const TILE_ANIMATION_INFO = {
	DOWN: { start: 0, end: 3 },
	SIDEPO: { start: 4, end: 7 },
	SIDEPE: { start: 8, end: 11 },
	UP: { start: 12, end: 15 }
};

const ANIMATION_NAME = {
	UP: "UP",
	DOWN: "DOWN",
	SIDE: "SIDE",
	FLYING: "FLYING"
};

const EXTRA_FRAME_CONFIG = {
	frameRate: 15,
	repeat: -1
};

export default class Player {
	constructor(scene, x, y, name, isPokemon, isPrincipal, stats, map) {
		this.scene = scene;
		this.name = name;
		this.isPokemon = isPokemon;
		this.quiet = true;
		this.isAlive = true;
		this.isPrincipal = isPrincipal;
		this.map = map;
		this.stats = new Stats(stats);
		this.bomb = new Bomb(this.scene, this.stats, this.map);
		this.sprite = scene.physics.add
			.sprite(x, y, name)
			.setScale(isPokemon ? 0.8 : 0.9)
			.setCollideWorldBounds(isPrincipal)
			.setDepth(99);
		if (isPokemon) {
			this.sprite.setSize(30, 20).setOffset(16, 42);
		} else {
			this.sprite.setSize(28, 20).setOffset(0, 30);
		}
		this.cursors = scene.input.keyboard.createCursorKeys();
		this.generateAnimations(scene.anims, name);
		if (isPrincipal)
			scene.input.keyboard.on("keydown_SPACE", this.plantBomb, this);
	}

	plantBomb() {
		if (this.bomb.planted) return;
		const tile = this.map.getTileAtWorldXY(
			this.sprite.x,
			this.sprite.y + 15
		);
		Socket.emit(PLANTING_BOMB, {
			x: tile.getCenterX(),
			y: tile.getCenterY()
		});
	}

	putBomb(info) {
		this.bomb.putAt(info.x, info.y, info.auto);
	}

	generateAnimations(anims, name) {
		anims.create({
			key: name + ANIMATION_NAME.UP,
			frames: anims.generateFrameNumbers(name, TILE_ANIMATION_INFO.UP),
			...EXTRA_FRAME_CONFIG
		});
		anims.create({
			key: name + ANIMATION_NAME.SIDE,
			frames: anims.generateFrameNumbers(
				name,
				this.isPokemon
					? TILE_ANIMATION_INFO.SIDEPO
					: TILE_ANIMATION_INFO.SIDEPE
			),
			...EXTRA_FRAME_CONFIG
		});
		anims.create({
			key: name + ANIMATION_NAME.DOWN,
			frames: anims.generateFrameNumbers(name, TILE_ANIMATION_INFO.DOWN),
			...EXTRA_FRAME_CONFIG
		});
	}

	move(x, y, flip, anim) {
		this.sprite.setPosition(x, y);
		if (anim) {
			this.sprite.play(this.name + anim, true);
			this.sprite.setFlipX(flip);
		} else {
			this.sprite.anims.stop();
		}
	}

	run(xfactor, yfactor, flip, anim) {
		const { speed } = this.stats;
		this.sprite.setVelocityX(speed * xfactor);
		this.sprite.setVelocityY(speed * yfactor);
		if (anim) {
			this.quiet = false;
			this.sprite.play(this.name + anim, true);
			this.sprite.setFlipX(flip);
			Socket.emit(MOVING_PLAYER, {
				x: this.sprite.x,
				y: this.sprite.y,
				flip: flip,
				anim: anim
			});
		} else {
			if (!this.quiet) {
				this.quiet = true;
				Socket.emit(MOVING_PLAYER, {
					x: this.sprite.x,
					y: this.sprite.y,
					flip: flip,
					anim: null
				});
				this.sprite.anims.stop();
			}
		}
	}

	update() {
		if (!this.isAlive) return;
		if (this.cursors.up.isDown) {
			if (this.cursors.left.isDown) {
				this.run(
					-this.stats.speedNormalizer,
					-this.stats.speedNormalizer,
					!this.isPokemon,
					ANIMATION_NAME.SIDE
				);
			} else if (this.cursors.right.isDown) {
				this.run(
					this.stats.speedNormalizer,
					-this.stats.speedNormalizer,
					this.isPokemon,
					ANIMATION_NAME.SIDE
				);
			} else {
				this.run(0, -1, false, ANIMATION_NAME.UP);
			}
		} else if (this.cursors.left.isDown) {
			if (this.cursors.down.isDown) {
				this.run(
					-this.stats.speedNormalizer,
					this.stats.speedNormalizer,
					!this.isPokemon,
					ANIMATION_NAME.SIDE
				);
			} else {
				this.run(-1, 0, !this.isPokemon, ANIMATION_NAME.SIDE);
			}
		} else if (this.cursors.right.isDown) {
			if (this.cursors.down.isDown) {
				this.run(
					this.stats.speedNormalizer,
					this.stats.speedNormalizer,
					this.isPokemon,
					ANIMATION_NAME.SIDE
				);
			} else {
				this.run(1, 0, this.isPokemon, ANIMATION_NAME.SIDE);
			}
		} else if (this.cursors.down.isDown) {
			this.run(0, 1, false, ANIMATION_NAME.DOWN);
		} else this.run(0, 0, false, null);
	}

	kill() {
		this.isAlive = false;
		this.quiet = true;
		this.sprite.anims.stop();
		this.sprite.setTexture(this.name, 12);
		if (this.isPrincipal) Socket.emit(DIE);
	}

	destroy() {
		this.scene.anims.remove(`${this.name}${ANIMATION_NAME.UP}`);
		this.scene.anims.remove(`${this.name}${ANIMATION_NAME.SIDE}`);
		this.scene.anims.remove(`${this.name}${ANIMATION_NAME.DOWN}`);
		this.sprite.destroy();
	}
}
