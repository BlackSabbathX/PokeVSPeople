export default class Preloader extends Phaser.Scene {
	constructor() {
		super({ key: 'preload' });
	}

	preload() {
		this.loadAssets();
		const yMax = this.sys.game.config.height;
		this.loadText = this.add.bitmapText(50, yMax - 100, 'font', 'Cargando... 0', 50);
		this.load.on('progress', this.updateProgressbar, this);
		this.load.once(
			'complete', () => {
				const cam = this.cameras.main;
				cam.fadeOut(70);
				this.load.off('progress', this.updateProgressbar);
				cam.once('camerafadeoutcomplete', () => this.scene.start('menu'));
			}, this);
	}

	updateProgressbar(percentage) {
		this.loadText.setText(`Cargando... ${Math.floor(percentage * 100)}`);
	}

	loadAssets() {
		this.load.bitmapFont('font-2', 'assets/fonts/font-2.png', 'assets/fonts/font-2.fnt');
		this.load.image('bg-1', 'assets/images/bg.jpg');
		this.load.image('bike-shop-tileset', 'assets/maps/tileset/bike-shop-tileset.png');
		this.load.image('caves-tileset', 'assets/maps/tileset/caves-tileset.png');
		this.load.image('factory-tileset', 'assets/maps/tileset/factory-tileset.png');
		this.load.image('graveyard-tileset', 'assets/maps/tileset/graveyard-tileset.png');
		this.load.image('gym-tileset', 'assets/maps/tileset/gym-tileset.png');
		this.load.image('harbour-tileset', 'assets/maps/tileset/harbour-tileset.png');
		this.load.image('interior-tileset', 'assets/maps/tileset/interior-tileset.png');
		this.load.image('mart-tileset', 'assets/maps/tileset/mart-tileset.png');
		this.load.image('multiplayer-room-tileset', 'assets/maps/tileset/multiplayer-room-tileset.png');
		this.load.image('number-tileset', 'assets/maps/tileset/number-tileset.png');
		this.load.image('outside-tileset', 'assets/maps/tileset/outside-tileset.png');
		this.load.image('trainer-tower-tileset', 'assets/maps/tileset/trainer-tower-tileset.png');
		this.load.image('underwater-tileset', 'assets/maps/tileset/underwater-tileset.png');
		this.load.tilemapTiledJSON('cave-map', 'assets/maps/cave-map.json');
		this.load.tilemapTiledJSON('graveyard-map', 'assets/maps/graveyard-map.json');
		this.load.tilemapTiledJSON('gym-map', 'assets/maps/gym-map.json');
		this.load.tilemapTiledJSON('lobby-map', 'assets/maps/lobby-map.json');
		this.load.tilemapTiledJSON('mart-map', 'assets/maps/mart-map.json');
		this.load.tilemapTiledJSON('outside-map', 'assets/maps/outside-map.json');
		this.load.tilemapTiledJSON('spring-map', 'assets/maps/spring-map.json');
		this.load.tilemapTiledJSON('trainer-tower-map', 'assets/maps/trainer-tower-map.json');
		this.load.tilemapTiledJSON('underwater-map', 'assets/maps/underwater-map.json');
		this.load.spritesheet('bomb', 'assets/images/bomb/bomb.png', { frameWidth: 32, frameHeight: 32 });
		this.load.spritesheet('explosion-center', 'assets/images/bomb/explosion-center.png', { frameWidth: 32, frameHeight: 32 });
		this.load.spritesheet('explosion-down', 'assets/images/bomb/explosion-down.png', { frameWidth: 32, frameHeight: 32 });
		this.load.spritesheet('explosion-left', 'assets/images/bomb/explosion-left.png', { frameWidth: 32, frameHeight: 32 });
		this.load.spritesheet('explosion-mid-h', 'assets/images/bomb/explosion-mid-h.png', { frameWidth: 32, frameHeight: 32 });
		this.load.spritesheet('explosion-mid-v', 'assets/images/bomb/explosion-mid-v.png', { frameWidth: 32, frameHeight: 32 });
		this.load.spritesheet('explosion-right', 'assets/images/bomb/explosion-right.png', { frameWidth: 32, frameHeight: 32 });
		this.load.spritesheet('explosion-up', 'assets/images/bomb/explosion-up.png', { frameWidth: 32, frameHeight: 32 });
		for (let index = 1; index <= 63; index++) {
			this.load.spritesheet(
				`people-${index}`,
				`assets/characters/people/_(${index}).png`,
				{ frameWidth: 32, frameHeight: 48 }
			);
		}
		for (let index = 1; index <= 43; index++) {
			this.load.spritesheet(
				`pokemon-${index}`,
				`assets/characters/pokemon/_(${index}).png`,
				{ frameWidth: 64, frameHeight: 64 }
			);
		}
	}
}
