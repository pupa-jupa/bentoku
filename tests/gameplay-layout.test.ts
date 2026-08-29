import { describe, expect, it } from 'vitest';
import {
  BENTO_HOLDER_CENTERS,
  BENTO_HOLDER_SIZE,
  calculatePartialClueLayout,
  CLUE_ANCHOR_CELL_SIZE,
  CLUE_ANCHOR_CENTER_Y,
  CLUE_ANCHOR_DIVIDER_GAP,
  CLUE_CONTENT_OFFSET_X,
  CLUE_DIVIDER_Y,
  CLUE_DIVIDER_PARTIAL_GAP,
  CLUE_PARTIAL_ROW_GAP,
  PLACED_SHELL_SIZE,
  TRAY_HOLDER_CENTERS,
} from '../src/game/gameplayLayout';

describe('approved gameplay background anchors', () => {
  it('maps every tray piece to the center of its illustrated recess', () => {
    expect(TRAY_HOLDER_CENTERS).toEqual([
      { x: 183, y: 231 },
      { x: 307, y: 231 },
      { x: 428, y: 231 },
      { x: 183, y: 366 },
      { x: 307, y: 366 },
      { x: 428, y: 366 },
      { x: 183, y: 501 },
      { x: 307, y: 501 },
      { x: 428, y: 501 },
      { x: 183, y: 638 },
      { x: 307, y: 638 },
      { x: 428, y: 638 },
    ]);
  });

  it('maps every bento holder to the center of its illustrated compartment', () => {
    expect(BENTO_HOLDER_CENTERS).toEqual([
      { x: 637, y: 235 },
      { x: 800, y: 235 },
      { x: 963, y: 235 },
      { x: 637, y: 410 },
      { x: 800, y: 410 },
      { x: 963, y: 410 },
      { x: 637, y: 594 },
      { x: 800, y: 594 },
      { x: 963, y: 594 },
    ]);
    expect(BENTO_HOLDER_SIZE).toBe(136);
    expect(PLACED_SHELL_SIZE).toBe(138);
  });

  it('uses one optical center and measured anchor/divider spacing', () => {
    expect(CLUE_CONTENT_OFFSET_X).toBe(-24);
    const anchorBottom = CLUE_ANCHOR_CENTER_Y + (CLUE_ANCHOR_CELL_SIZE * 3) / 2;
    expect(CLUE_DIVIDER_Y - anchorBottom).toBe(CLUE_ANCHOR_DIVIDER_GAP);
  });

  it('lays out dense partial clues without divider or row overlap', () => {
    const layouts = [
      [
        { width: 1, height: 3 },
        { width: 3, height: 1 },
        { width: 2, height: 2 },
        { width: 3, height: 2 },
        { width: 1, height: 3 },
        { width: 2, height: 1 },
      ],
      [
        { width: 3, height: 2 },
        { width: 1, height: 3 },
        { width: 3, height: 1 },
        { width: 2, height: 2 },
        { width: 1, height: 3 },
      ],
    ];

    for (const clues of layouts) {
      const placements = calculatePartialClueLayout(clues);
      expect(Math.min(...placements.map((item) => item.y - item.height / 2)) - CLUE_DIVIDER_Y).toBe(
        CLUE_DIVIDER_PARTIAL_GAP,
      );
      for (let row = 1; row < Math.ceil(placements.length / 2); row += 1) {
        const previous = placements.slice((row - 1) * 2, row * 2);
        const current = placements.slice(row * 2, row * 2 + 2);
        const previousBottom = Math.max(...previous.map((item) => item.y + item.height / 2));
        const currentTop = Math.min(...current.map((item) => item.y - item.height / 2));
        expect(currentTop - previousBottom).toBe(CLUE_PARTIAL_ROW_GAP);
      }
      expect(Math.max(...placements.map((item) => item.y + item.height / 2))).toBeLessThanOrEqual(
        340,
      );
      if (placements.length % 2 === 1) expect(placements.at(-1)?.x).toBe(0);
    }
  });
});
