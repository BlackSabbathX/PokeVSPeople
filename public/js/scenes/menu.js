export default class Menu extends Phaser.Scene {
	constructor() {
		super({ key: "menu" });
	}

	create() {
		this.cameras.main.setBackgroundColor(0xffffff).shake(200, 0.01);
		const widthProportion = this.game.config.width / 1920;
		this.add.image(1920 / 3, 1080 / 3.5, "bg-1").setScale(widthProportion);
		this.playButton = this.add
			.bitmapText(
				0,
				0,
				"font",
				"Conectarse a la partida",
				40 * widthProportion
			)
			.setPosition(
				this.game.config.width / 2.6,
				this.game.config.height - 100
			)
			.setInteractive()
			.on("pointerover", () => this.pointerOver(this.playButton))
			.on("pointerout", () => this.pointerOut(this.playButton))
			.on("pointerdown", () => this.pointerDown(this.playButton));
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
			cam.shake(200, 0.01);
			this.disableButtonListeners();
			cam.once("camerashakecomplete", () => this.scene.start("lobby"));
		}
	}

	disableButtonListeners() {
		this.playButton.removeAllListeners("pointerover");
		this.playButton.removeAllListeners("pointerout");
		this.playButton.removeAllListeners("pointerdown");
	}

	destroy() {
		this.didisableButtonListeners();
	}
}
