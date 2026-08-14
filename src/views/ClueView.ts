import Phaser from 'phaser';
import { COLORS, FONT_DISPLAY } from '../game/constants';
import type { CluePattern } from '../puzzle/types';

export class ClueView extends Phaser.GameObjects.Container {
  readonly clue: CluePattern;

  constructor(
    scene: Phaser.Scene,
    clue: CluePattern,
    x: number,
    y: number,
    maxWidth: number,
    compact = false,
  ) {
    super(scene, x, y);
    this.clue = clue;
    scene.add.existing(this);
    const isAnchor = clue.width === 3 && clue.height === 3;
    const cellSize = isAnchor ? 48 : Math.min(compact ? 40 : 44, (maxWidth - 24) / clue.width);
    const gridWidth = cellSize * clue.width;
    const gridHeight = cellSize * clue.height;
    const padTop = compact ? 12 : 16;
    const cardWidth = maxWidth;
    const cardHeight = gridHeight + padTop + (compact ? 10 : 14);

    const card = scene.add.graphics();
    card.fillStyle(isAnchor ? 0xf3f1d9 : COLORS.milk, isAnchor ? 0.72 : 0.67);
    card.fillRoundedRect(-cardWidth / 2, -cardHeight / 2, cardWidth, cardHeight, 16);
    card.lineStyle(2, COLORS.ink, 0.15);
    card.strokeRoundedRect(-cardWidth / 2, -cardHeight / 2, cardWidth, cardHeight, 16);
    this.add(card);

    const originX = -gridWidth / 2;
    const originY = -cardHeight / 2 + padTop;
    const graphics = scene.add.graphics();
    graphics.lineStyle(2, COLORS.ink, 0.68);
    for (let column = 0; column <= clue.width; column += 1) {
      const wobble = column % 2 === 0 ? 0 : 0.7;
      graphics.lineBetween(
        originX + column * cellSize,
        originY + wobble,
        originX + column * cellSize,
        originY + gridHeight - wobble,
      );
    }
    for (let row = 0; row <= clue.height; row += 1) {
      const wobble = row % 2 === 0 ? 0.6 : 0;
      graphics.lineBetween(
        originX + wobble,
        originY + row * cellSize,
        originX + gridWidth - wobble,
        originY + row * cellSize,
      );
    }
    this.add(graphics);

    for (const cell of clue.cells) {
      const centerX = originX + (cell.x + 0.5) * cellSize;
      const centerY = originY + (cell.y + 0.5) * cellSize;
      if (!cell.animal && !cell.food) {
        const wildcard = scene.add
          .text(centerX, centerY, '·', {
            fontFamily: FONT_DISPLAY,
            fontSize: `${Math.round(cellSize * 0.52)}px`,
            color: '#8e766f',
          })
          .setOrigin(0.5);
        this.add(wildcard);
        continue;
      }
      if (cell.animal && cell.food) {
        const animal = scene.add.image(
          centerX - cellSize * 0.16,
          centerY - cellSize * 0.15,
          `glyph_${cell.animal}`,
        );
        const food = scene.add.image(
          centerX + cellSize * 0.17,
          centerY + cellSize * 0.17,
          `glyph_${cell.food}`,
        );
        fitInside(animal, cellSize * 0.54);
        fitInside(food, cellSize * 0.5);
        const slash = scene.add.graphics();
        slash.lineStyle(1.5, COLORS.ink, 0.52);
        slash.lineBetween(
          centerX - cellSize * 0.32,
          centerY + cellSize * 0.32,
          centerX + cellSize * 0.32,
          centerY - cellSize * 0.32,
        );
        this.add([animal, food, slash]);
      } else {
        const key = `glyph_${cell.animal ?? cell.food}`;
        const image = scene.add.image(centerX, centerY, key);
        fitInside(image, cellSize * 0.84);
        this.add(image);
      }
    }

    this.setSize(cardWidth, cardHeight);
  }
}

const fitInside = (image: Phaser.GameObjects.Image, size: number): void => {
  image.setScale(Math.min(size / image.width, size / image.height));
};
