import Phaser from 'phaser';
import { COLORS, FONT_DISPLAY } from '../game/constants';
import {
  calculatePartialClueLayout,
  CLUE_ANCHOR_CELL_SIZE,
  CLUE_ANCHOR_CENTER_Y,
  CLUE_CONTENT_OFFSET_X,
  CLUE_DIVIDER_Y,
  CLUE_PARTIAL_CELL_SIZE,
} from '../game/gameplayLayout';
import type { CluePattern } from '../puzzle/types';
import type { I18nService } from '../i18n/I18nService';
import { ClueView } from './ClueView';

export class CluePanel extends Phaser.GameObjects.Container {
  readonly width = 390;
  readonly height = 730;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    clues: readonly CluePattern[],
    i18n: I18nService,
  ) {
    super(scene, x, y);
    scene.add.existing(this);

    const title = scene.add
      .text(CLUE_CONTENT_OFFSET_X, -300, i18n.t('clues.title'), {
        fontFamily: FONT_DISPLAY,
        fontSize: '25px',
        fontStyle: 'bold',
        color: '#5c4941',
        letterSpacing: 2,
      })
      .setOrigin(0.5);
    const flower = scene.add
      .image(-150 + CLUE_CONTENT_OFFSET_X, -297, 'tiny_flower')
      .setDisplaySize(27, 27)
      .setAngle(-8);
    const leaf = scene.add
      .image(151 + CLUE_CONTENT_OFFSET_X, -297, 'tiny_leaf')
      .setDisplaySize(25, 25)
      .setAngle(13);
    this.add([flower, leaf, title]);

    const anchor = clues.find((clue) => clue.id === 'anchor-map');
    const spatial = clues.filter((clue) => clue.id !== 'anchor-map').slice(0, 6);
    if (anchor) {
      const view = new ClueView(
        scene,
        anchor,
        CLUE_CONTENT_OFFSET_X,
        CLUE_ANCHOR_CENTER_Y,
        CLUE_ANCHOR_CELL_SIZE,
      );
      this.add(view);
    }

    const divider = scene.add.graphics().setName('clue-divider');
    divider.lineStyle(2, COLORS.ink, 0.16);
    divider.lineBetween(
      -156 + CLUE_CONTENT_OFFSET_X,
      CLUE_DIVIDER_Y,
      156 + CLUE_CONTENT_OFFSET_X,
      CLUE_DIVIDER_Y,
    );
    this.add(divider);
    const placements = calculatePartialClueLayout(spatial);
    placements.forEach((placement) => {
      const clue = spatial[placement.index]!;
      const view = new ClueView(
        scene,
        clue,
        placement.x + CLUE_CONTENT_OFFSET_X,
        placement.y,
        CLUE_PARTIAL_CELL_SIZE,
      );
      this.add(view);
    });

    if (spatial.length === 0) {
      const complete = scene.add
        .text(CLUE_CONTENT_OFFSET_X, -42, i18n.t('clues.anchorOnly'), {
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
