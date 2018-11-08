const EXTRA_ANIM_CONFIG = {
	frameRate: 1,
	repeat: -1,
}

export default class Character {
	constructor(scene, x, y, name) {
		this.scene = scene;
		this.name = name;
		this.sprite = scene.physics.add.sprite(x, y, name).setScale(0.9);
		this.scene.anims.create({
			key: `character_${name}`,
			frames: [
				{ key: name, frame: 0 },
				{ key: name, frame: 4 },
				{ key: name, frame: 12 },
				{ key: name, frame: 8 },
			],
			...EXTRA_ANIM_CONFIG,
		});
		this.sprite.play(`character_${name}`, true);
	}

	destroy() {
		this.sprite.destroy();
		this.scene.anims.remove(`character_${this.name}`);
	}
}