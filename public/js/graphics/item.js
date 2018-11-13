import Socket from "/js/socket.js";

const FRAMES = {
    start: 0,
    end: 4
};

const EXTRA_FRAME_CONFIG = {
    frameRate: 10,
    repeat: -1
};

export default class Item {
    constructor(scene, item, principalPlayer) {
        this.collected = false;
        this.id = item.id;
        this.scene = scene;
        this.item = item;
        this.sprite = scene.physics.add
            .sprite(item.x, item.y, item.name)
            .setScale(0.6)
            .setDepth(99);
        scene.physics.world.addOverlap(
            this.sprite,
            principalPlayer.sprite,
            this.collect.bind(this)
        );
        this.generateAnimations();
        this.sprite.play(item.name, true);
    }

    generateAnimations() {
        this.scene.anims.create({
            key: this.item.name,
            frames: this.scene.anims.generateFrameNumbers(
                this.item.name,
                FRAMES
            ),
            ...EXTRA_FRAME_CONFIG
        });
    }

    collect() {
        if (this.collected) return;
        this.collected = true;
        Socket.emit("COLLECT_ITEM", { ...this.item, id: this.id });
    }

    destroy() {
        this.sprite.destroy();
    }
}
