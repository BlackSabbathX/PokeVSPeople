export default class Menu extends Phaser.Scene {
	constructor() {
		super({ key: 'menu' });
	}

	create() {
		this.cameras.main.fadeIn(70);
		const widthProportion = this.game.config.width / 1920;
		this.add
			.image(1920 / 3, 1080 / 3.5	, 'bg-1')
			.setScale(widthProportion);
		const pb = this.playButton = this.add
			.bitmapText(0, 0, 'font', 'Conectarse a la partida', 40 * widthProportion);
		pb.setPosition(this.game.config.width / 2.6, this.game.config.height - 100);
		pb.setInteractive()
			.on('pointerover', () => this.pointerOver(this.playButton))
			.on('pointerout', () => this.pointerOut(this.playButton))
			.once('pointerdown', () => this.pointerDown(this.playButton));
	}

	pointerOver(button) {
		button.setTint(0xff0000);
	}

	pointerOut(button) {
		button.setTint(0xffffff);
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
	}

	destroy() {
		this.didisableButtonListeners();
	}
}