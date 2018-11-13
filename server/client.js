"use strict";
const INITIAL_STATS = {
	people: {
		speed: 90,
		range: 1
	},
	pokemon: {
		speed: 50,
		range: 2
	}
};

const TEAM_NAMES = {
	pokemon: "pokemon",
	people: "people",
	opposites: {
		pokemon: "people",
		people: "pokemon"
	}
};

const MAX_CHAR_NUMBER = {
	pokemon: 43,
	people: 63
};

class Client {
	constructor(server, socket, io, lobbyPosition, team) {
		this.server = server;
		this.socket = socket;
		this.io = io;
		this.id = this.socket.id;
		this.lobbyPosition = lobbyPosition;
		this.initialize(team);
	}

	initialize(team) {
		this.team = team;
		this.character = this.randomCharacter(team);
		this.onLobby = false;
		this.loaded = false;
		this.ready = false;
		this.stats = INITIAL_STATS[team];
		this.isAlive = true;
	}

	basicInfo() {
		return {
			team: this.team,
			id: this.id,
			character: this.character,
			onLobby: this.onLobby,
			lobbyPosition: this.lobbyPosition,
			isAlive: this.isAlive,
			stats: this.stats
		};
	}

	startClient() {
		this.socket.on("LOBBY_ENTER", this.onLobbyEnter.bind(this));
		this.socket.on("CHANGE_CHARACTER", this.onChangeCharacter.bind(this));
		this.socket.on("TOOGLE_TEAM", this.onToogleTeam.bind(this));
		this.socket.on("READY", this.onReady.bind(this));
		this.socket.on("GAME_LOADED", this.onGameLoaded.bind(this));
		this.socket.on("MOVING_PLAYER", this.onPlayerMoved.bind(this));
		this.socket.on("PLANTING_BOMB", this.onBombPlanted.bind(this));
		this.socket.on("BOMB_EXPLODING", this.onBombExploding.bind(this));
		this.socket.on("DIE", this.onDie.bind(this));
		return this;
	}

	onLobbyEnter() {
		this.onLobby = true;
		this.socket.emit("CURRENT_PLAYERS", this.server.getPlayers());
		this.socket.broadcast.emit("NEW_PLAYER", this.basicInfo());
	}

	onChangeCharacter(newCharacter) {
		const character = this.constraintCharacter(newCharacter, this.team);
		this.character = character;
		this.io.emit("CHARACTER_CHANGED", {
			id: this.id,
			newCharacter: character
		});
	}

	onToogleTeam() {
		const lastTeam = this.team;
		const newTeam = TEAM_NAMES.opposites[lastTeam];
		const lastNewCharacter = this.randomCharacter(lastTeam);
		const newNewCharacter = this.randomCharacter(newTeam);
		let otherKey;
		this.server.iteratePlayers(player => {
			if (player.id !== this.id) otherKey = player.id;
		});
		this.team = newTeam;
		this.stats = INITIAL_STATS[newTeam];
		this.character = newNewCharacter;
		if (this.server.size === 1) {
			this.server.setTeamLength(newTeam, 1, lastTeam, 0, true);
		} else if (this.server.size === 2 || this.server.teams[lastTeam] === 1) {
			this.server.updateClient(otherKey, {
				team: lastTeam,
				stats: INITIAL_STATS[lastTeam],
				character: lastNewCharacter
			});
			this.io.emit("TEAM_CHANGED", {
				id: otherKey,
				newTeam: lastTeam,
				newCharacter: lastNewCharacter
			});
		} else {
			this.server.setTeamLength(newTeam, 1, lastTeam, -1, false);
		}
		this.io.emit("TEAM_CHANGED", {
			id: this.id,
			newTeam: newTeam,
			newCharacter: newNewCharacter
		});
	}

	onReady() {
		this.ready = true;
		this.server.onPlayerReady();
	}

	onGameLoaded() {
		this.loaded = true;
		this.server.onPlayerLoaded();
	}

	onPlayerMoved(info) {
		this.socket.broadcast.emit("PLAYER_MOVED", { id: this.id, ...info });
	}

	onBombPlanted(info) {
		this.socket.emit("BOMB_PLANTED", {
			id: this.id,
			...info,
			auto: true
		});
		this.socket.broadcast.emit("BOMB_PLANTED", {
			id: this.id,
			...info,
			auto: false
		});
	}

	onBombExploding(info) {
		this.io.emit("BOMB_EXPLODED", {
			id: this.id,
			...info
		});
	}

	onDie() {
		this.socket.broadcast.emit("SOMEONE_DIES", this.id);
		this.isAlive = false;
		this.server.someoneDies();
	}

	randomCharacter(team) {
		return Math.floor(Math.random() * MAX_CHAR_NUMBER[team]) + 1;
	}

	constraintCharacter(character, team) {
		const maxCharNumber = MAX_CHAR_NUMBER[team];
		if (character < 1) character = maxCharNumber;
		else if (character > maxCharNumber) character = 1;
		return character;
	}
}

module.exports = Client;
