export default class Map {
	constructor(scene, name, tilesetNames) {
		this.scene = scene;
		this.name = name;
		const tilesets = [];
		this.map = scene.make.tilemap({ key: `${name}-map` });
		for (let index = 0; index < tilesetNames.length; index++) {
			const name = `${tilesetNames[index]}-tileset`;
			tilesets.push(this.map.addTilesetImage(name, name));
		}
		this.terrain = this.map.createStaticLayer("terrain", tilesets);
		if (name !== "lobby") {
			this.collide = this.map.createStaticLayer("collide", tilesets);
			if (name === "trainer-tower")
				this.map.createStaticLayer("pre-collide", tilesets);
			this.rocks = this.map.createDynamicLayer("rocks", tilesets);
		}
		this.map.createStaticLayer("visual", tilesets).setDepth(999);
	}

	getSpawnPoints() {
		const pos = this.map.getObjectLayer("positions");
		const p1sp = pos.objects[0];
		const p2sp = pos.objects[1];
		const p3sp = pos.objects[2];
		const p4sp = pos.objects[3];
		return [
			{ x: p1sp.x, y: p1sp.y, busy: false },
			{ x: p2sp.x, y: p2sp.y, busy: false },
			{ x: p3sp.x, y: p3sp.y, busy: false },
			{ x: p4sp.x, y: p4sp.y, busy: false }
		];
	}

	getTileAtWorldXY(x, y) {
		return this.terrain.getTileAtWorldXY(x, y);
	}

	collidesAtWorldXY(x, y) {
		return this.collide.hasTileAtWorldXY(x, y);
	}

	hasRockAtWorldXY(x, y) {
		return this.rocks.hasTileAtWorldXY(x, y);
	}

	removeRockAtWorldXY(x, y) {
		this.rocks.removeTileAtWorldXY(x, y);
	}

	collideWith(object) {
		this.scene.physics.world.addCollider(
			this.collide.setCollisionByProperty({ collides: true }),
			object
		);
		this.scene.physics.world.addCollider(
			this.rocks.setCollisionByProperty({ collides: true }),
			object
		);
	}
}
