import Phaser from 'phaser';
import { FONT_DISPLAY } from '../game/constants';

export class InventoryPanel extends Phaser.GameObjects.Container {
  readonly width = 455;
  readonly height = 650;
  private readonly background: Phaser.GameObjects.Graphics;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y);
    scene.add.existing(this);
    this.background = scene.add.graphics();
    this.add(this.background);
    this.draw();
    const title = scene.add
      .text(0, -354, 'BENTO FRIENDS', {
        fontFamily: FONT_DISPLAY,
        fontSize: '20px',
        fontStyle: 'bold',
        color: '#704f47',
        letterSpacing: 2,
        backgroundColor: '#fff9efbb',
        padding: { x: 12, y: 5 },
      })
      .setOrigin(0.5);
    const sub = scene.add
      .text(0, -324, 'Choose nine for the box', {
        fontFamily: 'Trebuchet MS, sans-serif',
        fontSize: '15px',
        color: '#8d6d64',
      })
      .setOrigin(0.5);
    this.add([title, sub]);
  }

  private draw(): void {
    this.background.setVisible(false);
  }

  trayPosition(index: number): Phaser.Math.Vector2 {
    const column = index % 3;
    const row = Math.floor(index / 3);
    const rowOffsets = [-224, -78, 62, 192];
    return new Phaser.Math.Vector2(this.x - 126 + column * 121, this.y + rowOffsets[row]!);
  }

  containsWorldPoint(x: number, y: number): boolean {
    return (
      x >= this.x - this.width / 2 &&
      x <= this.x + this.width / 2 &&
      y >= this.y - this.height / 2 &&
      y <= this.y + this.height / 2
    );
  }
}
