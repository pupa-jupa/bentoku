import Phaser from 'phaser';
import { COLORS, FONT_DISPLAY } from '../game/constants';
import {
  clueAssets,
  environmentAssets,
  musicAssets,
  pieceAssets,
  soundAssets,
} from '../services/AssetRegistry';

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super('PreloadScene');
  }

  preload(): void {
    const title = this.add
      .text(800, 380, 'Packing your bento…', {
        fontFamily: FONT_DISPLAY,
        fontSize: '30px',
        fontStyle: 'bold',
        color: '#6e5047',
      })
      .setOrigin(0.5);
    const track = this.add.graphics();
    track.fillStyle(COLORS.milk, 0.7);
    track.fillRoundedRect(600, 438, 400, 18, 9);
    const bar = this.add.graphics();
    this.load.on('progress', (value: number) => {
      bar.clear();
      bar.fillStyle(COLORS.coral, 0.92);
      bar.fillRoundedRect(604, 442, 392 * value, 10, 5);
    });
    this.load.on('complete', () => {
      title.setText('Ready!');
    });

    [...pieceAssets, ...clueAssets, ...environmentAssets].forEach(({ key, path }) =>
      this.load.image(key, path),
    );
    Object.values(soundAssets).forEach(({ key, path }) => this.load.audio(key, path));
    const firstMusic = musicAssets[0];
    if (firstMusic) this.load.audio(firstMusic.key, firstMusic.path);
  }

  create(): void {
    this.scene.start('PuzzleScene');
  }
}
