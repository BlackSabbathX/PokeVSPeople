"use strict";
const express = require("express");
const app = express();
const server = require("http").Server(app);
const io = require("socket.io").listen(server);
const GameServer = require("./game-server.js");

const Game = {};

Game.MAPS = [
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

Game.TEAM_NAMES = {
	pokemon: "pokemon",
	people: "people",
	opposites: {
		pokemon: "people",
		people: "pokemon"
	}
};

Game.MAX_CHAR_NUMBER = {
	pokemon: 43,
	people: 63
};

Game.INITIAL_STATS = {
	people: {
		speed: 90,
		range: 1
	},
	pokemon: {
		speed: 50,
		range: 2
	}
};

Game.teams = {
	next: "people",
	last: "pokemon",
	pokemon: 0,
	people: 0
};

Game.players = {};

Game.lobby = [
	{ pos: 0, busy: false },
	{ pos: 1, busy: false },
	{ pos: 2, busy: false },
	{ pos: 3, busy: false }
];

Game.started = false;

Game.size = 0;

Game.randomCharacter = team =>
	Math.floor(Math.random() * Game.MAX_CHAR_NUMBER[team]) + 1;

Game.constraintCharacter = (character, team) => {
	const maxCharNumber = Game.MAX_CHAR_NUMBER[team];
	if (character < 1) character = maxCharNumber;
	else if (character > maxCharNumber) character = 1;
	return character;
};

Game.setNextTeams = () => {
	const { TEAM_NAMES } = Game;
	const next =
		Game.teams.pokemon > Game.teams.people
			? TEAM_NAMES.people
			: TEAM_NAMES.pokemon;
	Game.teams.next = next;
	Game.teams.last = TEAM_NAMES.opposites[next];
};

Game.iteratePlayers = callback => {
	Object.keys(Game.players).forEach(key => callback(Game.players[key]));
};

Game.resetGame = () => {
	const { next } = Game.teams;
	Game.started = false;
	Game.teams.pokemon = 0;
	Game.teams.people = 0;
	Object.keys(Game.players).forEach(key => {
		const baseInformation = Game.players[key] || {};
		Game.players[key] = {
			...baseInformation,
			team: next,
			character: Game.randomCharacter(next),
			onLobby: false,
			loaded: false,
			ready: false,
			stats: Game.INITIAL_STATS[next],
			isAlive: true
		};
		Game.teams[next]++;
		Game.setNextTeams();
	});
};

app.use(express.static(__dirname + "/public"));

io.on("connection", socket => {
	const { next } = Game.teams;
	let index = Game.lobby.find(position => !position.busy).pos;
	Game.players[socket.id] = {
		team: next,
		id: socket.id,
		character: Game.randomCharacter(next),
		lobbyPosition: index,
		onLobby: false,
		loaded: false,
		ready: false,
		stats: Game.INITIAL_STATS[next],
		isAlive: true
	};
	Game.lobby[index].busy = true;
	Game.teams[next]++;
	Game.setNextTeams();
	Game.size++;

	socket.on("LOBBY_ENTER", () => {
		Game.players[socket.id].onLobby = true;
		socket.emit("CURRENT_PLAYERS", Game.players);
		socket.broadcast.emit("NEW_PLAYER", Game.players[socket.id]);
	});

	socket.on("CHANGE_CHARACTER", newCharacter => {
		const id = socket.id;
		const character = Game.constraintCharacter(
			newCharacter,
			Game.players[id].team
		);
		Game.players[id].character = character;
		io.emit("CHARACTER_CHANGED", {
			id: id,
			newCharacter: character
		});
	});

	socket.on("TOOGLE_TEAM", () => {
		const { randomCharacter, INITIAL_STATS, size } = Game;
		const id = socket.id;
		const lastTeam = Game.players[id].team;
		const newTeam = Game.TEAM_NAMES.opposites[lastTeam];
		const lastNewCharacter = randomCharacter(lastTeam);
		const newNewCharacter = randomCharacter(newTeam);
		let otherKey;
		Game.iteratePlayers(player => {
			if (player.id !== id) otherKey = player.id;
		});
		if (size === 1) {
			Game.players[id].team = newTeam;
			Game.players[id].stats = INITIAL_STATS[newTeam];
			Game.players[id].character = newNewCharacter;
			Game.teams[newTeam] = 1;
			Game.teams[lastTeam] = 0;
		} else if (size === 2 || Game.teams[lastTeam] === 1) {
			Game.players[id].team = newTeam;
			Game.players[id].stats = INITIAL_STATS[newTeam];
			Game.players[id].character = newNewCharacter;
			Game.players[otherKey].team = lastTeam;
			Game.players[otherKey].stats = INITIAL_STATS[lastTeam];
			Game.players[otherKey].character = lastNewCharacter;
			io.emit("TEAM_CHANGED", {
				id: otherKey,
				newTeam: lastTeam,
				newCharacter: lastNewCharacter
			});
		} else {
			Game.players[id].team = newTeam;
			Game.players[id].stats = INITIAL_STATS[newTeam];
			Game.players[id].character = newNewCharacter;
			Game.teams[newTeam]++;
			Game.teams[lastTeam]--;
		}
		Game.setNextTeams();
		io.emit("TEAM_CHANGED", {
			id: id,
			newTeam: newTeam,
			newCharacter: newNewCharacter
		});
	});

	socket.on("READY", () => {
		Game.players[socket.id].ready = true;
		let readys = 0;
		Game.iteratePlayers(player => {
			if (player.ready) readys++;
		});
		if (readys === Game.size) {
			Game.started = true;
			io.emit("ALL_READY", Game.MAPS[Math.floor(Math.random() * 8)]);
		}
	});

	socket.on("GAME_LOADED", () => {
		Game.players[socket.id].loaded = true;
		let loadeds = 0;
		Game.iteratePlayers(player => {
			if (player.loaded) loadeds++;
		});
		if (loadeds === Game.size) io.emit("LOAD_COMPLETE", Game.players);
	});

	socket.on("MOVING_PLAYER", info =>
		socket.broadcast.emit("PLAYER_MOVED", { id: socket.id, ...info })
	);

	socket.on("PLANTING_BOMB", info => {
		const id = socket.id;
		socket.emit("BOMB_PLANTED", {
			id: id,
			...info,
			auto: true
		});
		socket.broadcast.emit("BOMB_PLANTED", {
			id: id,
			...info,
			auto: false
		});
	});

	socket.on("BOMB_EXPLODING", info =>
		io.emit("BOMB_EXPLODED", {
			id: socket.id,
			...info
		})
	);

	socket.on("DIE", () => {
		const id = socket.id;
		socket.broadcast.emit("SOMEONE_DIES", id);
		let playersAlive = { pokemon: 0, people: 0 };
		Game.players[id].isAlive = false;
		Game.iteratePlayers(player => {
			if (player.isAlive) playersAlive[player.team]++;
		});
		if (!Game.started) return;
		if (playersAlive.pokemon === 0) {
			io.emit("GAME_OVER", "PEOPLE");
		} else if (playersAlive.people === 0) {
			io.emit("GAME_OVER", "POKEMON");
		} else return;
		Game.started = false;
		setTimeout(() => io.emit("EXIT"), 7000);
		Game.resetGame();
	});

	socket.on("disconnect", () => {
		const id = socket.id;
		const player = Game.players[id];
		Game.lobby[player.lobbyPosition].busy = false;
		Game.teams[player.team]--;
		Game.size--;
		delete Game.players[id];
		io.emit("disconnect", id);
	});
});

app.get("/", (req, res) => res.sendFile(__dirname + "/index.html"));

server.listen(8081, function() {
	console.log(`Listening on ${server.address().port}`);
});
