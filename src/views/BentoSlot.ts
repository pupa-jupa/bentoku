import Phaser from 'phaser';
import { COLORS } from '../game/constants';

export class BentoSlot extends Phaser.GameObjects.Container {
  readonly index: number;
  readonly size: number;
  private readonly base: Phaser.GameObjects.Graphics;
  private readonly highlight: Phaser.GameObjects.Graphics;

  constructor(scene: Phaser.Scene, index: number, x: number, y: number, size: number) {
    super(scene, x, y);
    this.index = index;
    this.size = size;
    this.base = scene.add.graphics();
    this.highlight = scene.add.graphics();
    this.add([this.base, this.highlight]);
    this.draw();
    this.setSize(size, size);
    this.setInteractive({ useHandCursor: true });
    scene.add.existing(this);
  }

  private draw(): void {
    this.base.setVisible(false);
  }

  setHighlighted(active: boolean, reveal = false): void {
    this.highlight.clear();
    if (!active) return;
    this.highlight.fillStyle(reveal ? COLORS.honey : COLORS.mint, reveal ? 0.34 : 0.26);
    this.highlight.fillRoundedRect(
      -this.size / 2 - 3,
      -this.size / 2 - 3,
      this.size + 6,
      this.size + 6,
      25,
    );
    this.highlight.lineStyle(5, reveal ? COLORS.honey : COLORS.sage, 0.95);
    this.highlight.strokeRoundedRect(
      -this.size / 2 - 3,
      -this.size / 2 - 3,
      this.size + 6,
      this.size + 6,
      25,
    );
  }
}
