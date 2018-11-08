export default class Preloader extends Phaser.Scene {
	constructor() {
		super({ key: 'preload' });
	}

	preload() {
		this.loadAssets();
		const yMax = this.sys.game.config.height;
		this.loadText = this.add.bitmapText(50, yMax - 70, 'font', 'Cargando... 0 %', 50);
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
		this.loadText.setText(`Cargando... ${Math.floor(percentage * 100)} %`);
	}

	loadAssets() {
		this.load.image('bg-1', 'assets/images/bg-1.png');
		this.load.image('numbers-tileset', 'assets/maps/tileset/numbers-tileset.png');
		this.load.image('gyms-tileset', 'assets/maps/tileset/gyms-tileset.png');
		this.load.image('interior-tileset', 'assets/maps/tileset/interior-tileset.png');
		this.load.image('outside-tileset', 'assets/maps/tileset/outside-tileset.png');
		this.load.tilemapTiledJSON('tilemap', 'assets/maps/map.json');
		this.load.tilemapTiledJSON('lobby', 'assets/maps/lobby.json');
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