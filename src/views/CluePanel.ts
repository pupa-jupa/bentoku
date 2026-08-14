import Phaser from 'phaser';
import { COLORS, FONT_DISPLAY } from '../game/constants';
import type { CluePattern } from '../puzzle/types';
import { ClueView } from './ClueView';

export class CluePanel extends Phaser.GameObjects.Container {
  readonly width = 390;
  readonly height = 730;

  constructor(scene: Phaser.Scene, x: number, y: number, clues: readonly CluePattern[]) {
    super(scene, x, y);
    scene.add.existing(this);

    const title = scene.add
      .text(0, -300, 'ORDER NOTES', {
        fontFamily: FONT_DISPLAY,
        fontSize: '25px',
        fontStyle: 'bold',
        color: '#5c4941',
        letterSpacing: 2,
      })
      .setOrigin(0.5);
    const flower = scene.add.image(-150, -297, 'tiny_flower').setDisplaySize(27, 27).setAngle(-8);
    const leaf = scene.add.image(151, -297, 'tiny_leaf').setDisplaySize(25, 25).setAngle(13);
    this.add([flower, leaf, title]);

    const anchor = clues.find((clue) => clue.id === 'anchor-map');
    const spatial = clues.filter((clue) => clue.id !== 'anchor-map').slice(0, 4);
    if (anchor) {
      const view = new ClueView(scene, anchor, 0, -178, 282);
      this.add(view);
    }

    const divider = scene.add.graphics();
    divider.lineStyle(2, COLORS.ink, 0.16);
    divider.lineBetween(-156, -55, 156, -55);
    this.add(divider);
    const sectionTitle = scene.add
      .text(0, -38, 'SLIDING SKETCHES', {
        fontFamily: FONT_DISPLAY,
        fontSize: '13px',
        fontStyle: 'bold',
        color: '#765b52',
        letterSpacing: 1.5,
      })
      .setOrigin(0.5);
    this.add(sectionTitle);
    const sparkle = scene.add.image(149, -37, 'tiny_sparkle').setDisplaySize(20, 20).setAlpha(0.7);
    this.add(sparkle);

    spatial.forEach((clue, index) => {
      const row = Math.floor(index / 2);
      const itemsInRow = Math.min(2, spatial.length - row * 2);
      const column = index % 2;
      const xPosition = itemsInRow === 1 ? 0 : -84 + column * 168;
      const view = new ClueView(scene, clue, xPosition, 52 + row * 166, 158);
      this.add(view);
    });

    if (spatial.length === 0) {
      const complete = scene.add
        .text(0, 92, 'The café map has every detail you need.', {
          fontFamily: 'Trebuchet MS, sans-serif',
          fontSize: '16px',
          color: '#7b6963',
          align: 'center',
          wordWrap: { width: 280 },
        })
        .setOrigin(0.5);
      this.add(complete);
    }
  }
}
