export default class Boot extends Phaser.Scene {
	constructor() {
		super({ key: 'boot' });
	}

	preload() {
		this.load.bitmapFont('font', 'assets/fonts/font.png', 'assets/fonts/font.fnt');
	}

	create() {
		this.scene.start('preload');
	}
}