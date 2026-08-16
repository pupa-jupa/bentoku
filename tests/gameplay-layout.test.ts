import { describe, expect, it } from 'vitest';
import {
  BENTO_HOLDER_CENTERS,
  BENTO_HOLDER_SIZE,
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
});
