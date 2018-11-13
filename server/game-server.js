"use strict";
let Client = require("./client.js");

const MAPS = [
	{ name: "cave", tilesets: ["caves", "gym"] },
	{ name: "graveyard", tilesets: ["graveyard", "gym"] },
	{ name: "gym", tilesets: ["gym"] },
	{ name: "mart", tilesets: ["mart", "gym"] },
	{ name: "outside", tilesets: ["outside"] },
	{ name: "spring", tilesets: ["interior", "outside", "gym"] },
	{
		name: "trainer-tower",
		tilesets: ["bike-shop", "harbour", "trainer-tower", "gym"]
	},
	{ name: "underwater", tilesets: ["harbour", "underwater", "gym"] }
];

const TEAM_NAMES = {
	pokemon: "pokemon",
	people: "people",
	opposites: {
		pokemon: "people",
		people: "pokemon"
	}
};

class GameServer {
	constructor(io) {
		this.io = io;
		this.players = {};
		this.started = false;
		this.size = 0;
		this.teams = {
			next: "people",
			last: "pokemon",
			pokemon: 0,
			people: 0
		};
		this.lobby = [
			{ pos: 0, busy: false },
			{ pos: 1, busy: false },
			{ pos: 2, busy: false },
			{ pos: 3, busy: false }
		];
	}

	startServer() {
		this.io.on("connection", this.receivingConnection.bind(this));
		return this;
	}

	getPlayers() {
		const players = {};
		this.iteratePlayers(player => {
			console.log(player.id);
			players[player.id] = player.basicInfo();
		});
		return players;
	}

	receivingConnection(socket) {
		const { next } = this.teams;
		const index = this.lobby.find(position => !position.busy).pos;
		this.players[socket.id] = new Client(
			this,
			socket,
			this.io,
			index,
			next
		).startClient();
		this.lobby[index].busy = true;
		this.teams[next]++;
		this.setNextTeams();
		this.size++;
		socket.on("disconnect", () => this.onDisconnect(socket.id));
	}

	setNextTeams() {
		const next =
			this.teams.pokemon > this.teams.people
				? TEAM_NAMES.people
				: TEAM_NAMES.pokemon;
		this.teams.next = next;
		this.teams.last = TEAM_NAMES.opposites[next];
	}

	iteratePlayers(callback) {
		Object.keys(this.players).forEach(key => callback(this.players[key]));
	}

	countBy(callback) {
		let n = 0;
		this.iteratePlayers(player => {
			if (callback(player)) n++;
		});
		return n;
	}

	setTeamLength(team1, n1, team2, n2, literal) {
		if (literal) {
			this.teams[team1] = n1;
			this.teams[team2] = n2;
		} else {
			this.teams[team1] += n1;
			this.teams[team2] += n2;
		}
		this.setNextTeams();
	}

	updateClient(id, info) {
		this.players[id].team = info.team;
		this.players[id].stats = info.stats;
		this.players[id].character = info.character;
		Object.keys(info).forEach(key => {
			this.players[id][key] = info[key];
		});
	}

	onPlayerReady() {
		const ready = this.countBy(player => player.ready);
		if (ready === this.size) {
			this.started = true;
			this.io.emit("ALL_READY", MAPS[Math.floor(Math.random() * 8)]);
		}
	}

	onPlayerLoaded() {
		const loaded = this.countBy(player => player.loaded);
		if (loaded === this.size)
			this.io.emit("LOAD_COMPLETE", this.getPlayers());
	}

	someoneDies() {
		const playersAlive = { pokemon: 0, people: 0 };
		this.iteratePlayers(player => {
			if (player.isAlive) playersAlive[player.team]++;
		});
		if (!this.started) return;
		if (playersAlive.pokemon === 0) {
			this.io.emit("GAME_OVER", "PEOPLE");
		} else if (playersAlive.people === 0) {
			this.io.emit("GAME_OVER", "POKEMON");
		} else return;
		this.started = false;
		setTimeout(() => this.io.emit("EXIT"), 7000);
		this.resetGame();
	}

	onDisconnect(id) {
		const player = this.players[id];
		this.lobby[player.lobbyPosition].busy = false;
		this.teams[player.team]--;
		this.size--;
		delete this.players[id];
		this.setNextTeams();
		this.io.emit("disconnect", id);
	}

	resetGame() {
		const { next } = this.teams;
		this.started = false;
		this.teams.pokemon = 0;
		this.teams.people = 0;
		this.iteratePlayers(player => {
			player.initialize(next);
			this.teams[next]++;
			this.setNextTeams();
		});
	}
}

module.exports = GameServer;
