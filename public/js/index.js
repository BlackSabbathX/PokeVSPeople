
import Boot from '/js/scenes/boot.js';
import Preloader from '/js/scenes/preloader.js';
import Menu from '/js/scenes/menu.js';
import Lobby from '/js/scenes/lobby.js';
import GameScene from '/js/scenes/game-scene.js';

const config = {
	type: Phaser.AUTO,
	width: 1216,
	height: 704 < window.innerHeight ? 704 : window.innerHeight,
	scene: [
		Boot,
		Preloader,
		Menu,
		Lobby,
		GameScene,
	],
	pixelArt: true,
	parent: 'game-container',
	backgroundColor: '#000000',
	physics: {
		default: 'arcade',
		arcade: { gravity: { y: 0 }, debug: false }
	}
};

const game = new Phaser.Game(config);