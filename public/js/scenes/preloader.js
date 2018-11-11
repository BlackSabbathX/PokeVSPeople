export default class Preloader extends Phaser.Scene {
	constructor() {
		super({ key: 'preload' });
	}

	preload() {
		this.loadAssets();
		const yMax = this.sys.game.config.height;
		this.loadText = this.add.bitmapText(50, yMax - 70, 'font', 'Cargando... 0', 50);
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
		this.load.image('bg-1', 'assets/images/bg.jpg');
		this.load.image('number-tileset', 'assets/maps/tileset/number-tileset.png');
		this.load.image('gym-tileset', 'assets/maps/tileset/gym-tileset.png');
		this.load.image('interior-tileset', 'assets/maps/tileset/interior-tileset.png');
		this.load.image('outside-tileset', 'assets/maps/tileset/outside-tileset.png');
		this.load.image('graveyard-tileset', 'assets/maps/tileset/graveyard-tileset.png');
		this.load.tilemapTiledJSON('outside-map', 'assets/maps/map.json');
		this.load.tilemapTiledJSON('graveyard-map', 'assets/maps/graveyard map.json');
		this.load.tilemapTiledJSON('lobby', 'assets/maps/lobby.json');
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
				`people_${index}`,
				`assets/characters/people/_(${index}).png`,
				{ frameWidth: 32, frameHeight: 48 }
			);
		}
		for (let index = 1; index <= 43; index++) {
			this.load.spritesheet(
				`pokemon_${index}`,
				`assets/characters/pokemon/_(${index}).png`,
				{ frameWidth: 64, frameHeight: 64 }
			);
		}
	}
}
