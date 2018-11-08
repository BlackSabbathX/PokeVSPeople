export default class Menu extends Phaser.Scene {
	constructor() {
		super({ key: 'menu' });
	}

	create() {
		this.cameras.main.fadeIn(70);
		const heightProportion = 1080 / window.innerHeight;
		const widthProportion = 1920 / window.innerWidth;
		this.add
			.image(0, 0, 'bg-1')
			.setScale(
				heightProportion > widthProportion ?
					heightProportion :
					widthProportion
			);
		this.add.bitmapText(50, 50, 'font', 'Pokemon VS People :v', 70 * widthProportion);
		this.playButton = this.add
			.bitmapText(50, 300, 'font', 'Conectarse a la partida', 40 * widthProportion)
			.setTint(0x000000)
			.setInteractive()
			.on('pointerover', () => this.pointerOver(this.playButton))
			.on('pointerout', () => this.pointerOut(this.playButton))
			.once('pointerdown', () => this.pointerDown(this.playButton));
		this.creditButton = this.add
			.bitmapText(50, 380, 'font', 'Creditos', 40 * widthProportion)
			.setTint(0x000000)
			.setInteractive()
			.on('pointerover', () => this.pointerOver(this.creditButton))
			.on('pointerout', () => this.pointerOut(this.creditButton))
			.once('pointerdown', () => this.pointerDown(this.creditButton));
	}

	pointerOver(button) {
		button.setTint(0xff0000);
	}

	pointerOut(button) {
		button.setTint(0x000000);
	}

	pointerDown(button) {
		const cam = this.cameras.main;
		if (button === this.playButton) {
			cam.shake(200);
			this.disableButtonListeners();
			cam.once('camerashakecomplete', () => this.scene.start('lobby'));
		}
	}

	disableButtonListeners() {
		this.playButton.removeAllListeners('pointerover');
		this.playButton.removeAllListeners('pointerout');
		this.creditButton.removeAllListeners('pointerover');
		this.creditButton.removeAllListeners('pointerout');
	}

	destroy() {
		this.didisableButtonListeners();
	}
}