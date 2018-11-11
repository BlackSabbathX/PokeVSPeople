"use strict";
const strings = require("./strings.js");
const express = require("express");
const app = express();
const server = require("http").Server(app);
const io = require("socket.io").listen(server);

const maps = [
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

const max = {
	pokemon: 43,
	people: 63
};

const teams = {
	next: strings.PEOPLE,
	last: strings.POKEMON,
	pokemon: 0,
	people: 0
};

const initialStats = {
	people: {
		speed: 90,
		range: 1
	},
	pokemon: {
		speed: 50,
		range: 2
	}
};

const players = {};

const lobbyPositions = [
	{ pos: 0, busy: false },
	{ pos: 1, busy: false },
	{ pos: 2, busy: false },
	{ pos: 3, busy: false }
];

let playersSize = 0;

app.use(express.static(__dirname + "/public"));

io.on("connection", socket => {
	let index = lobbyPositions.find(position => !position.busy).pos;
	players[socket.id] = {
		team: teams.next,
		id: socket.id,
		character: Math.floor(Math.random() * max[teams.next]) + 1,
		lobbyPosition: index,
		onLobby: false,
		loaded: false,
		ready: false,
		stats: initialStats[teams.next]
	};
	lobbyPositions[index].busy = true;
	teams[teams.next]++;
	playersSize++;

	console.log("players", players);

	const tempLast = teams.next;
	teams.next = teams.last;
	teams.last = tempLast;

	socket.on(strings.LOBBY_ENTER, () => {
		players[socket.id].onLobby = true;
		socket.emit(strings.CURRENT_PLAYERS, players);
		socket.broadcast.emit(strings.NEW_PLAYER, players[socket.id]);
	});

	socket.on(strings.CHANGE_CHARACTER, newCharacter => {
		const player = players[socket.id];
		if (newCharacter < 1) newCharacter = max[player.team];
		else if (newCharacter > max[player.team]) newCharacter = 1;
		player.character = newCharacter;
		io.emit(strings.CHARACTER_CHANGED, {
			id: socket.id,
			newCharacter: newCharacter
		});
	});

	socket.on(strings.TOOGLE_TEAM, () => {
		const lastTeam = players[socket.id].team;
		const newTeam =
			lastTeam === strings.POKEMON ? strings.PEOPLE : strings.POKEMON;
		if (teams[lastTeam] === 1 && playersSize > 1) return;
		players[socket.id].team = newTeam;
		players[socket.id].stats = initialStats[newTeam];
		teams[newTeam]++;
		teams[lastTeam]--;
		teams.next =
			teams.pokemon > teams.people ? strings.PEOPLE : strings.POKEMON;
		teams.last =
			teams.next === strings.PEOPLE ? strings.POKEMON : strings.PEOPLE;
		io.emit(strings.TEAM_CHANGED, {
			id: socket.id,
			newTeam: newTeam,
			newCharacter: Math.floor(Math.random() * max[newTeam]) + 1
		});
	});

	socket.on(strings.READY, () => {
		players[socket.id].ready = true;
		let readys = 0;
		Object.keys(players).forEach(key => {
			if (players[key].ready) readys++;
		});
		if (readys === playersSize)
			io.emit(strings.ALL_READY, maps[Math.floor(Math.random() * 8)]);
	});

	socket.on(strings.GAME_LOADED, () => {
		players[socket.id].loaded = true;
		let loadeds = 0;
		Object.keys(players).forEach(key => {
			if (players[key].loaded) loadeds++;
		});
		if (loadeds === playersSize) io.emit(strings.LOAD_COMPLETE, players);
	});

	socket.on(strings.MOVING_PLAYER, info =>
		socket.broadcast.emit(strings.PLAYER_MOVED, { id: socket.id, ...info })
	);

	socket.on(strings.PLANTING_BOMB, info => {
		socket.emit(strings.BOMB_PLANTED, {
			id: socket.id,
			...info,
			auto: true
		});
		socket.broadcast.emit(strings.BOMB_PLANTED, {
			id: socket.id,
			...info,
			auto: false
		});
	});

	socket.on(strings.BOMB_EXPLODING, info =>
		socket.broadcast.emit(strings.BOMB_EXPLODED, {
			id: socket.id,
			...info
		})
	);

	socket.on(strings.DISCONNECT, () => {
		lobbyPositions[players[socket.id].lobbyPosition].busy = false;
		teams[players[socket.id].team]--;
		playersSize--;
		delete players[socket.id];
		io.emit(strings.DISCONNECT, socket.id);
	});
});

app.get("/", (req, res) => res.sendFile(__dirname + "/index.html"));

server.listen(8081, function() {
	console.log(`Listening on ${server.address().port}`);
});
