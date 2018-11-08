import Character from '/js/graphics/character.js';
import Socket from '/js/socket.js';
import {
	CURRENT_PLAYERS,
	NEW_PLAYER,
	DISCONNECT,
	CHANGE_CHARACTER,
	CHARACTER_CHANGED,
	TEAM_CHANGED,
	TOOGLE_TEAM,
	LOBBY_ENTER,
	READY,
	ALL_READY
} from '/js/strings.js';

export default class Lobby extends Phaser.Scene {
	constructor() {
		super({ key: 'lobby' });
		this.players = {};
		this.sprites = {};
		this.nPlayers = 0;
	}

	create() {
		const map = this.make.tilemap({ key: 'lobby' });
		const tilesets = [
			map.addTilesetImage('gyms-tileset', 'gyms-tileset'),
			map.addTilesetImage('numbers-tileset', 'numbers-tileset'),
		];
		map.createStaticLayer('lobby', tilesets);
		map.createStaticLayer('hover', tilesets);
		const spawnPoints = this.getSpawnPoints(map);

		Socket.on(CURRENT_PLAYERS, (players) => {
			this.players = players;
			this.nPlayers++;
			this.createCharacters(spawnPoints);
			this.player = players[Socket.id()];
		});

		Socket.on(NEW_PLAYER, (player) => {
			this.players[player.id] = player;
			this.createCharacter(player, spawnPoints);
		});

		Socket.on(CHARACTER_CHANGED, (change) => {
			const { id, newCharacter } = change;
			if (id === this.player.id) {
				this.player.character = newCharacter;
			}
			this.players[id].character = newCharacter;
			this.sprites[id].destroy();
			delete this.sprites[id];
			this.createCharacter(this.players[id], spawnPoints);
		});

		Socket.on(TEAM_CHANGED, (change) => {
			const { id, newTeam } = change;
			if (id === this.player.id) {
				this.player.team = newTeam;
			}
			this.players[id].team = newTeam;
			this.sprites[id].destroy();
			delete this.sprites[id];
			this.createCharacter(this.players[id], spawnPoints);
		});

		Socket.on(DISCONNECT, (id) => {
			this.sprites[id].destroy();
			delete this.sprites[id];
			delete this.players[id];
			this.nPlayers--;
		});

		Socket.on(ALL_READY, () => {
			const cam = this.cameras.main;
			cam.shake(200);
			this.disableButtonListeners();
			cam.once('camerashakecomplete', () => this.scene.start('game-scene'));
		})

		this.input.keyboard.on('keydown_LEFT', () => {
			Socket.emit(CHANGE_CHARACTER, this.player.character - 1);
		});

		this.input.keyboard.on('keydown_RIGHT', () => {
			Socket.emit(CHANGE_CHARACTER, this.player.character + 1);
		});

		this.input.keyboard.on('keydown_SPACE', () => {
			Socket.emit(TOOGLE_TEAM);
		});

		const widthProportion = 1920 / window.innerWidth;
		this.playButton = this.add
			.bitmapText(50, 300, 'font', 'Conectarse a la partida', 40 * widthProportion)
			.setTint(0x000000)
			.setInteractive()
			.on('pointerover', () => this.pointerOver(this.playButton))
			.on('pointerout', () => this.pointerOut(this.playButton))
			.once('pointerdown', () => this.pointerDown(this.playButton));

		Socket.emit(LOBBY_ENTER);
	}

	createCharacters(spawnPoints) {
		Object.keys(this.players).forEach((id) => {
			const player = this.players[id];
			if (player.onLobby) {
				const sp = spawnPoints[player.lobbyPosition];
				this.sprites[id] = new Character(this, sp.x, sp.y, `${player.team}_${player.character}`);
				this.nPlayers++;
			}
		});
	}

	createCharacter(player, spawnPoints) {
		const sp = spawnPoints[player.lobbyPosition];
		this.sprites[player.id] = new Character(this, sp.x, sp.y, `${player.team}_${player.character}`);
	}

	getSpawnPoints(map) {
		const pos = map.getObjectLayer('positions');
		const p1sp = pos.objects[0];
		const p2sp = pos.objects[1];
		const p3sp = pos.objects[2];
		const p4sp = pos.objects[3];
		return [
			{ x: p1sp.x, y: p1sp.y, busy: false },
			{ x: p2sp.x, y: p2sp.y, busy: false },
			{ x: p3sp.x, y: p3sp.y, busy: false },
			{ x: p4sp.x, y: p4sp.y, busy: false },
		];
	}

	pointerOver(button) {
		button.setTint(0xff0000);
	}

	pointerOut(button) {
		button.setTint(0x000000);
	}

	pointerDown(button) {
		if (button === this.playButton) {
			Socket.emit(READY, Socket.id());
		}
	}

	disableButtonListeners() {
		Socket.removeAllListeners();
		this.playButton.removeAllListeners('pointerover');
		this.playButton.removeAllListeners('pointerout');
	}
}