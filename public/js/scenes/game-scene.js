"use strict";
import Player from "/js/graphics/player.js";
import Socket from "/js/socket.js";
import {
	PLAYER_MOVED,
	GAME_LOADED,
	LOAD_COMPLETE,
	POKEMON,
	DISCONNECT,
	BOMB_PLANTED,
	BOMB_EXPLODED
} from "/js/strings.js";

const EXTRA_FRAME_CONFIG = {
	frameRate: 15,
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
		this.playersSprites = {};
		this.principalPlayer = null;
		this.playerLoaded = false;
	}

	create() {
		this.generateBombAnimations();
		const map = this.make.tilemap({ key: "graveyard-map" });
		const tilesets = [
			map.addTilesetImage("gym-tileset", "gym-tileset"),
			map.addTilesetImage("interior-tileset", "interior-tileset"),
			map.addTilesetImage("outside-tileset", "outside-tileset"),
			map.addTilesetImage("graveyard-tileset", "graveyard-tileset")
		];
		const terrainLayer = map.createStaticLayer("terrain", tilesets);
		const collideLayer = map.createStaticLayer("collide", tilesets);
		const rocksLayer = map.createDynamicLayer("rocks", tilesets);
		collideLayer.setCollisionByProperty({ collides: true });
		rocksLayer.setCollisionByProperty({ collides: true });
		this.spawnPoint = this.getSpawnPoints(map);
		Socket.on(LOAD_COMPLETE, players => {
			this.players = players;
			this.createPlayers(map, tilesets, [
				terrainLayer,
				collideLayer,
				rocksLayer
			]);
		});
		Socket.emit(GAME_LOADED);
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
		this.playersSprites[id].move(x, y, flip, anim);
	}

	createPlayers(map, tilesets, layers) {
		const { pokemon, people } = this.spawnPoint;
		let ipoke = 0,
			ipeo = 0;
		Object.keys(this.players).forEach(key => {
			const p = this.players[key];
			let sp;
			if (p.team === POKEMON) {
				sp = pokemon[ipoke];
				ipoke++;
			} else {
				sp = people[ipeo];
				ipeo++;
			}
			if (key === Socket.id()) {
				this.principalPlayer = new Player(
					this,
					sp.x,
					sp.y,
					`${p.team}_${p.character}`,
					p.team === POKEMON,
					true,
					layers[0],
					this.players[key].stats,
					layers[1],
					layers[2]
				);
				this.playersSprites[key] = this.principalPlayer;
			} else {
				this.playersSprites[key] = new Player(
					this,
					sp.x,
					sp.y,
					`${p.team}_${p.character}`,
					p.team === POKEMON,
					false,
					layers[0],
					this.players[key].stats,
					layers[1],
					layers[2]
				);
			}
		});
		map.createStaticLayer("visual", tilesets).setDepth(999999);
		for (let index = 1; index < layers.length; index++) {
			this.collideWith(this.principalPlayer.sprite, layers[index]);
		}
		this.playerLoaded = true;

		Socket.on(PLAYER_MOVED, player => {
			this.updatePlayer(player);
		});

		Socket.on(BOMB_PLANTED, info => {
			this.playersSprites[info.id].putBomb(info);
		});

		Socket.on(BOMB_EXPLODED, info => {
			this.playersSprites[info.id].bomb.explode(info, false, layers[2]);
		});

		Socket.on(DISCONNECT, id => {
			const sprite = this.playersSprites[id];
			if (sprite) {
				sprite.destroy();
				delete this.players[id];
				delete this.playersSprites[id];
			}
		});
	}

	update() {
		if (this.playerLoaded) this.principalPlayer.update();
	}

	collideWith(object1, object2) {
		this.physics.world.addCollider(object1, object2);
		return this;
	}

	getSpawnPoints(map) {
		const pos = map.getObjectLayer("positions");
		return {
			pokemon: [
				{ x: pos.objects[0].x, y: pos.objects[0].y },
				{ x: pos.objects[1].x, y: pos.objects[1].y }
			],
			people: [
				{ x: pos.objects[2].x, y: pos.objects[2].y },
				{ x: pos.objects[3].x, y: pos.objects[3].y }
			]
		};
	}

	destroy() {
		Object.keys(this.playersSprites).forEach(key => {
			this.playersSprites[key].destroy();
		});
		this.principalPlayer.destroy();
		Socket.removeAllListeners();
	}
}
