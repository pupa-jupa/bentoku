import Phaser from 'phaser';
import { FONT_DISPLAY } from '../game/constants';
import type { I18nService } from '../i18n/I18nService';

export class InventoryPanel extends Phaser.GameObjects.Container {
  readonly width = 455;
  readonly height = 650;
  private readonly background: Phaser.GameObjects.Graphics;

  constructor(scene: Phaser.Scene, x: number, y: number, i18n: I18nService) {
    super(scene, x, y);
    scene.add.existing(this);
    this.background = scene.add.graphics();
    this.add(this.background);
    this.draw();
    const title = scene.add
      .text(0, -363, i18n.t('inventory.title'), {
        fontFamily: FONT_DISPLAY,
        fontSize: '20px',
        fontStyle: 'bold',
        color: '#704f47',
        letterSpacing: 2,
        stroke: '#f5e5d3',
        strokeThickness: 1,
      })
      .setOrigin(0.5);
    const sub = scene.add
      .text(0, -334, i18n.t('inventory.subtitle'), {
        fontFamily: 'Trebuchet MS, sans-serif',
        fontSize: '14px',
        color: '#74584f',
        stroke: '#f5e5d3',
        strokeThickness: 1,
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
    const rowOffsets = [-240, -87, 63, 207];
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
