import Player from "/js/graphics/player.js";
import Socket from '/js/socket.js';
import {
	PLAYER_MOVED,
	GAME_LOADED,
	LOAD_COMPLETE,
	POKEMON
} from '/js/strings.js';

export default class GameScene extends Phaser.Scene {
	constructor() {
		super({ key: 'game-scene' });
		this.players = {};
		this.playersSprites = {};
		this.principalPlayer = null;
		this.playerLoaded = false;
	}

	create() {
		const map = this.make.tilemap({ key: 'tilemap' });
		const tilesets = [
			map.addTilesetImage('gyms-tileset', 'gyms-tileset'),
			map.addTilesetImage('interior-tileset', 'interior-tileset'),
			map.addTilesetImage('outside-tileset', 'outside-tileset'),
		];
		map.createStaticLayer('terrain', tilesets);
		const collideLayer = map.createStaticLayer('collide', tilesets);
		collideLayer.setCollisionByProperty({ collides: true });
		this.spawnPoint = this.getSpawnPoints(map);
		Socket.emit(GAME_LOADED, Socket.id());
		Socket.on(LOAD_COMPLETE, (players) => {
			this.players = players;
			this.createPlayers(map, tilesets, collideLayer);
		});
	}

	updatePlayer(player) {
		const { id, x, y, flip, anim } = player;
		this.playersSprites[id].move(x, y, flip, anim);
	}

	createPlayers(map, tilesets, collideLayer) {
		const { pokemon, people } = this.spawnPoint;
		Object.keys(this.players).forEach((key) => {
			const p = this.players[key];
			const sp = p.team === POKEMON ? pokemon : people;
			if (key === Socket.id()) {
				this.principalPlayer = new Player(this, sp.x, sp.y, `${p.team}_${p.character}`, p.team === POKEMON);
			} else {
				this.playersSprites[key] = new Player(this, sp.x, sp.y, `${p.team}_${p.character}`, p.team === POKEMON);
			}
		});
		map.createStaticLayer('visual', tilesets);
		this.collideWith(this.principalPlayer.sprite, collideLayer);
		this.playerLoaded = true;
		Socket.on(PLAYER_MOVED, (player) => {
			this.updatePlayer(player);
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
		const pos = map.getObjectLayer('positions');
		const p1sp = pos.objects[0];
		const p2sp = pos.objects[1];
		return {
			pokemon: { x: p1sp.x, y: p1sp.y },
			people: { x: p2sp.x, y: p2sp.y }
		};
	}

	destroy() {
		Object.keys(this.playersSprites).forEach((key) => {
			this.playersSprites[key].destroy();
		});
		this.principalPlayer.destroy();
	}
}
