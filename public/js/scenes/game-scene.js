"use strict";
import Player from "/js/graphics/player.js";
import Map from "/js/graphics/map.js";
import Item from "/js/graphics/item.js";
import Socket from "/js/socket.js";

const EXTRA_FRAME_CONFIG = {
	frameRate: 25,
	repeat: 1
};

const ANIM_FRAMES = {
	bomb: { start: 0, end: 3 },
	explosion: { start: 0, end: 6 }
};

export default class GameScene extends Phaser.Scene {
	constructor() {
		super({ key: "game-scene" });
		this.players = {};
		this.sprites = {};
		this.items = {};
		this.principalPlayer = null;
		this.playerLoaded = false;
	}

	init(map) {
		this.map = map;
	}

	create() {
		this.generateBombAnimations();
		const map = new Map(this, this.map.name, this.map.tilesets);
		const spawnPoints = map.getSpawnPoints(map);
		Socket.on("LOAD_COMPLETE", players => {
			this.players = players;
			this.createPlayers(map, spawnPoints);
		});
		Socket.emit("GAME_LOADED");
	}

	generateBombAnimations() {
		const e = "explosion";
		this.anims.create({
			key: "bomb",
			frames: this.anims.generateFrameNumbers("bomb", ANIM_FRAMES.bomb),
			frameRate: 15,
			repeat: -1
		});
		let actual = "up";
		this.anims.create({
			key: `${e}-${actual}`,
			frames: this.anims.generateFrameNumbers(
				`${e}-${actual}`,
				ANIM_FRAMES.bomb
			),
			...EXTRA_FRAME_CONFIG,
			hideOnComplete: true
		});
		actual = "down";
		this.anims.create({
			key: `${e}-${actual}`,
			frames: this.anims.generateFrameNumbers(
				`${e}-${actual}`,
				ANIM_FRAMES.bomb
			),
			...EXTRA_FRAME_CONFIG,
			hideOnComplete: true
		});
		actual = "center";
		this.anims.create({
			key: `${e}-${actual}`,
			frames: this.anims.generateFrameNumbers(
				`${e}-${actual}`,
				ANIM_FRAMES.bomb
			),
			...EXTRA_FRAME_CONFIG,
			hideOnComplete: true
		});
		actual = "left";
		this.anims.create({
			key: `${e}-${actual}`,
			frames: this.anims.generateFrameNumbers(
				`${e}-${actual}`,
				ANIM_FRAMES.bomb
			),
			...EXTRA_FRAME_CONFIG,
			hideOnComplete: true
		});
		actual = "right";
		this.anims.create({
			key: `${e}-${actual}`,
			frames: this.anims.generateFrameNumbers(
				`${e}-${actual}`,
				ANIM_FRAMES.bomb
			),
			...EXTRA_FRAME_CONFIG,
			hideOnComplete: true
		});
		actual = "mid-h";
		this.anims.create({
			key: `${e}-${actual}`,
			frames: this.anims.generateFrameNumbers(
				`${e}-${actual}`,
				ANIM_FRAMES.bomb
			),
			...EXTRA_FRAME_CONFIG,
			hideOnComplete: true
		});
		actual = "mid-v";
		this.anims.create({
			key: `${e}-${actual}`,
			frames: this.anims.generateFrameNumbers(
				`${e}-${actual}`,
				ANIM_FRAMES.bomb
			),
			...EXTRA_FRAME_CONFIG,
			hideOnComplete: true
		});
	}

	updatePlayer(player) {
		const { id, x, y, flip, anim } = player;
		this.sprites[id].move(x, y, flip, anim);
	}

	createPlayers(map, spawnPoints) {
		let ipoke = 0,
			ipeo = 0;
		Object.keys(this.players).forEach(key => {
			const p = this.players[key];
			let sp;
			if (p.team === "pokemon") {
				sp = spawnPoints[ipoke];
				ipoke++;
			} else {
				sp = spawnPoints[ipeo + 2];
				ipeo++;
			}
			const characterName = `${p.team}-${p.character}`;
			const isPokemon = p.team === "pokemon";
			const isPrincipal = key === Socket.id();
			this.sprites[key] = new Player(
				this,
				sp.x,
				sp.y,
				characterName,
				isPokemon,
				isPrincipal,
				p.stats,
				map
			);
			if (isPrincipal) {
				this.principalPlayer = this.sprites[key];
				map.collideWith(this.principalPlayer.sprite);
				this.playerLoaded = true;
			}
		});

		this.principalPlayer.stats.buildHUD(this);

		Socket.on("PLAYER_MOVED", player => {
			this.updatePlayer(player);
		});

		Socket.on("STATS_CHANGED", stats => {
			if (Socket.id() === stats.id)
				this.principalPlayer.stats.statsChanged(stats);
			this.items[stats.item].destroy();
			delete this.items[stats.item];
		});

		Socket.on("BOMB_PLANTED", info => {
			this.sprites[info.id].putBomb(info);
		});

		Socket.on("SOMEONE_DIES", id => {
			this.sprites[id].kill();
		});

		Socket.on("BOMB_EXPLODED", info => {
			this.tryToKillMe(info, map);
			this.showItems(info.items);
			this.sprites[info.id].bomb.explode(info, false);
		});

		Socket.on("GAME_OVER", teamWinner => {
			this.playerLoaded = false;
			this.add
				.bitmapText(
					this.game.config.width / 3.5,
					this.game.config.height / 2 - 100,
					"font",
					`¡¡¡${teamWinner} GANA!!!`,
					150
				)
				.setDepth(9999);
		});

		Socket.on("EXIT", () => {
			const cam = this.cameras.main;
			cam.shake(200, 0.01);
			cam.once("camerashakecomplete", () => {
				this.disableButtonListeners();
				this.scene.start("menu");
			});
		});

		Socket.on("disconnect", id => {
			const sprite = this.sprites[id];
			if (sprite) {
				sprite.destroy();
				delete this.players[id];
				delete this.sprites[id];
			}
		});
	}

	showItems(items) {
		for (let index = 0; index < items.length; index++) {
			this.items[items[index].id] = new Item(
				this,
				items[index],
				this.principalPlayer
			);
		}
	}

	tryToKillMe(constraints, map) {
		const { minX, maxX, minY, maxY, x, y } = constraints;
		const tile1 = map.getTileAtWorldXY(
			this.principalPlayer.sprite.x,
			this.principalPlayer.sprite.y + 15
		);
		for (let index = minY; index <= maxY; index++) {
			const tile2 = map.getTileAtWorldXY(x, y + 32 * index);
			if (this.sameTile(tile1, tile2)) {
				this.principalPlayer.kill();
				return;
			}
		}
		for (let index = minX; index <= maxX; index++) {
			const tile2 = map.getTileAtWorldXY(x + 32 * index, y);
			if (this.sameTile(tile1, tile2)) {
				this.principalPlayer.kill();
				return;
			}
		}
	}

	sameTile(tile1, tile2) {
		if (tile1 && tile2) return tile1.x === tile2.x && tile1.y === tile2.y;
		return false;
	}

	update() {
		if (this.playerLoaded) this.principalPlayer.update();
	}

	disableButtonListeners() {
		Socket.removeAllListeners();
	}

	destroy() {
		Object.keys(this.sprites).forEach(key => {
			this.sprites[key].destroy();
		});
		this.principalPlayer.destroy();
	}
}
