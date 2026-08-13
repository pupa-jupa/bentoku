import Phaser from 'phaser';
import { BentoSlot } from './BentoSlot';

export class BentoBoard extends Phaser.GameObjects.Container {
  readonly slots: BentoSlot[] = [];
  readonly slotSize = 145;
  private readonly frame: Phaser.GameObjects.Graphics;
  private readonly restingX: number;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y);
    this.restingX = x;
    scene.add.existing(this);
    this.frame = scene.add.graphics();
    this.add(this.frame);
    this.drawFrame();

    const columnOffsets = [-160, 5, 170];
    const rowOffsets = [-185, -3, 186];
    for (let index = 0; index < 9; index += 1) {
      const column = index % 3;
      const row = Math.floor(index / 3);
      const slot = new BentoSlot(
        scene,
        index,
        columnOffsets[column]!,
        rowOffsets[row]!,
        this.slotSize,
      );
      this.add(slot);
      this.slots.push(slot);
    }
  }

  private drawFrame(): void {
    this.frame.setVisible(false);
  }

  slotWorldPosition(index: number): Phaser.Math.Vector2 {
    const slot = this.slots[index]!;
    return new Phaser.Math.Vector2(this.x + slot.x, this.y + slot.y);
  }

  nearestSlot(worldX: number, worldY: number): number | null {
    let nearest: number | null = null;
    let distance = Number.POSITIVE_INFINITY;
    this.slots.forEach((slot, index) => {
      const current = Phaser.Math.Distance.Between(
        worldX,
        worldY,
        this.x + slot.x,
        this.y + slot.y,
      );
      if (current < this.slotSize * 0.72 && current < distance) {
        nearest = index;
        distance = current;
      }
    });
    return nearest;
  }

  wobble(reducedMotion: boolean): void {
    if (reducedMotion) {
      this.setAlpha(0.82);
      this.scene.time.delayedCall(140, () => this.setAlpha(1));
      return;
    }
    this.scene.tweens.add({
      targets: this,
      x: { from: this.x - 7, to: this.x + 7 },
      duration: 70,
      yoyo: true,
      repeat: 2,
      ease: 'Sine.easeInOut',
      onComplete: () => (this.x = this.restingX),
    });
  }
}
