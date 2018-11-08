var strings = require('./strings.js');

const express = require('express');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io').listen(server);

const teams = {
	next: strings.PEOPLE,
	last: strings.POKEMON,
	pokemon: 0,
	people: 0,
};

const players = {};

const lobbyPositions = [
	{ pos: 0, busy: false },
	{ pos: 1, busy: false },
	{ pos: 2, busy: false },
	{ pos: 3, busy: false },
];

let playersSize = 0;

app.use(express.static(__dirname + '/public'));

io.on('connection', (socket) => {

	let index = lobbyPositions.find((position) => !position.busy).pos;

	players[socket.id] = {
		team: teams.next,
		id: socket.id,
		character: 1,
		lobbyPosition: index,
		onLobby: false,
		loaded: false,
		ready: false,
	};

	lobbyPositions[index].busy = true;
	teams[teams.next]++;
	playersSize++;
	const tempLast = teams.next;
	teams.next = teams.last;
	teams.last = tempLast;

	console.log('players list');
	console.log(players);
	console.log('end list');

	socket.on(strings.LOBBY_ENTER, () => {
		console.log('lobby enter');
		players[socket.id].onLobby = true;
		socket.emit(strings.CURRENT_PLAYERS, players);
		socket.broadcast.emit(strings.NEW_PLAYER, players[socket.id]);
	});

	socket.on(strings.CHANGE_CHARACTER, (newCharacter) => {
		const player = players[socket.id];
		const max = player.team === strings.POKEMON ? 43 : 63;
		if (newCharacter < 1) {
			newCharacter = max;
		} else if (newCharacter > max) {
			newCharacter = 1;
		}
		player.character = newCharacter;
		console.log('change character');
		socket.emit(strings.CHARACTER_CHANGED, {
			id: socket.id,
			newCharacter: newCharacter,
		});
		socket.broadcast.emit(strings.CHARACTER_CHANGED, {
			id: socket.id,
			newCharacter: newCharacter,
		});
	});

	socket.on(strings.TOOGLE_TEAM, () => {
		const lastTeam = players[socket.id].team;
		const newTeam = lastTeam === strings.POKEMON ? strings.PEOPLE : strings.POKEMON;
		if (teams[lastTeam] == 1) return;
		players[socket.id].team = newTeam;
		teams[newTeam]++;
		teams[lastTeam]--;
		console.log('toogle team');
		socket.emit(strings.TEAM_CHANGED, {
			id: socket.id,
			newTeam: newTeam,
		});
		socket.broadcast.emit(strings.TEAM_CHANGED, {
			id: socket.id,
			newTeam: newTeam,
		});
	});

	socket.on(strings.READY, (id) => {
		console.log('ready');
		players[id].ready = true;
		let readys = 0;
		Object.keys(players).forEach((key) => {
			if (players[key].loaded) readys++;
		});
		if (readys === playersSize) {
			socket.emit(strings.ALL_READY);
			socket.broadcast.emit(strings.ALL_READY);
		}
	});

	socket.on(strings.GAME_LOADED, (id) => {
		console.log('game loaded');
		players[id].loaded = true;
		let loadeds = 0;
		Object.keys(players).forEach((key) => {
			if (players[key].loaded) loadeds++;
		});
		if (loadeds === playersSize) {
			socket.emit(strings.LOAD_COMPLETE, players);
			socket.broadcast.emit(strings.LOAD_COMPLETE, players);
		}
	});

	socket.on(strings.MOVING_PLAYER, (info) => {
		socket.broadcast.emit(strings.PLAYER_MOVED, info);
	});

	socket.on(strings.DISCONNECT, () => {
		lobbyPositions[players[socket.id].lobbyPosition].busy = false;
		teams[players[socket.id].team]--;
		playersSize--;
		delete players[socket.id];
		console.log('disconnect');
		io.emit(strings.DISCONNECT, socket.id);
	});

});

app.get('/', (req, res) => res.sendFile(__dirname + '/index.html'));

server.listen(8081, function () {
	console.log(`Listening on ${server.address().port}`);
});