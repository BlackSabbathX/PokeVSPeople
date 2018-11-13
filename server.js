"use strict";
const express = require("express");
const app = express();
const server = require("http").Server(app);
const io = require("socket.io").listen(server);
const GameServer = require("./server/game-server.js");

app.use(express.static(__dirname + "/public"));

const gameServer = new GameServer(io).startServer();

app.get("/", (req, res) => res.sendFile(__dirname + "/index.html"));

server.listen(8081, function() {
	console.log(`Listening on port ${server.address().port}`);
	console.log(`Open your browser in localhost:${server.address().port}`);
});
