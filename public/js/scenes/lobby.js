import Character from "/js/graphics/character.js";
import Map from "/js/graphics/map.js";
import Socket from "/js/socket.js";
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
} from "/js/strings.js";

export default class Lobby extends Phaser.Scene {
	constructor() {
		super({ key: "lobby" });
		this.players = {};
		this.sprites = {};
		this.nPlayers = 0;
	}

	create() {
		const map = new Map(this, "lobby", ["multiplayer-room"]);
		const spawnPoints = map.getSpawnPoints();

		Socket.on(CURRENT_PLAYERS, players => {
			this.players = players;
			this.nPlayers = Object.keys(players).length;
			this.createCharacters(spawnPoints);
			this.player = players[Socket.id()];
		});

		Socket.on(NEW_PLAYER, player => {
			this.players[player.id] = player;
			this.nPlayers++;
			this.createCharacter(player, spawnPoints);
		});

		Socket.on(CHARACTER_CHANGED, change => {
			const { id, newCharacter } = change;
			if (id === this.player.id) {
				this.player.character = newCharacter;
			}
			this.players[id].character = newCharacter;
			this.sprites[id].destroy();
			delete this.sprites[id];
			this.createCharacter(this.players[id], spawnPoints);
		});

		Socket.on(TEAM_CHANGED, change => {
			const { id, newTeam, newCharacter } = change;
			if (id === this.player.id) {
				this.player.team = newTeam;
			}
			this.players[id].team = newTeam;
			this.players[id].character = newCharacter;
			this.sprites[id].destroy();
			delete this.sprites[id];
			this.createCharacter(this.players[id], spawnPoints);
		});

		Socket.on(DISCONNECT, id => {
			this.sprites[id].destroy();
			delete this.sprites[id];
			delete this.players[id];
			this.nPlayers--;
		});

		Socket.on(ALL_READY, map => {
			const cam = this.cameras.main;
			cam.shake(200, 0.02);
			cam.once("camerashakecomplete", () => {
				this.disableButtonListeners();
				this.scene.start("game-scene", map);
			});
		});

		this.input.keyboard.on("keydown_LEFT", () => {
			Socket.emit(CHANGE_CHARACTER, this.player.character - 1);
		});

		this.input.keyboard.on("keydown_RIGHT", () => {
			Socket.emit(CHANGE_CHARACTER, this.player.character + 1);
		});

		this.input.keyboard.on("keydown_SPACE", () => {
			Socket.emit(TOOGLE_TEAM);
		});
		const widthProportion = this.game.config.width / 1920;

		this.playButton = this.add
			.bitmapText(0, 0, "font", "Listo", 40 * widthProportion)
			.setPosition(
				this.game.config.width / 2.05,
				this.game.config.height - 100
			)
			.setInteractive()
			.on("pointerover", () => this.pointerOver(this.playButton))
			.on("pointerout", () => this.pointerOut(this.playButton))
			.once("pointerdown", () => this.pointerDown(this.playButton));

		Socket.emit(LOBBY_ENTER);
	}

	createCharacters(spawnPoints) {
		Object.keys(this.players).forEach(id => {
			const player = this.players[id];
			if (player.onLobby) {
				const sp = spawnPoints[player.lobbyPosition];
				this.sprites[id] = new Character(
					this,
					sp.x,
					sp.y,
					`${player.team}-${player.character}`
				);
				this.nPlayers++;
			}
		});
	}

	createCharacter(player, spawnPoints) {
		const sp = spawnPoints[player.lobbyPosition];
		this.sprites[player.id] = new Character(
			this,
			sp.x,
			sp.y,
			`${player.team}-${player.character}`
		);
	}

	pointerOver(button) {
		button.setTint(0xff0000);
	}

	pointerOut(button) {
		button.setTint(0x000000);
	}

	pointerDown(button) {
		if (button === this.playButton) {
			this.playButton
				.setText("Esperando a los demás...")
				.setPosition(
					this.game.config.width / 2.6,
					this.game.config.height - 100
				);
			Socket.emit(READY);
		}
	}

	disableButtonListeners() {
		Socket.removeAllListeners();
		this.playButton.removeAllListeners("pointerover");
		this.playButton.removeAllListeners("pointerout");
	}
}
