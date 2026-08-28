export interface GameplayAnchor {
  readonly x: number;
  readonly y: number;
}

// Pixel-measured centers of the recesses painted into gameplay_plate.png,
// after the approved 1672x941 source is displayed on the 1600x900 game canvas.
// Keep these as explicit anchors: the illustration is intentionally handmade
// and is not a mathematically uniform grid.
export const TRAY_HOLDER_CENTERS: readonly GameplayAnchor[] = [
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
];

export const BENTO_HOLDER_CENTERS: readonly GameplayAnchor[] = [
  { x: 637, y: 235 },
  { x: 800, y: 235 },
  { x: 963, y: 235 },
  { x: 637, y: 410 },
  { x: 800, y: 410 },
  { x: 963, y: 410 },
  { x: 637, y: 594 },
  { x: 800, y: 594 },
  { x: 963, y: 594 },
];

export const BENTO_HOLDER_SIZE = 136;
export const PLACED_SHELL_SIZE = 138;
export const CLUE_CONTENT_OFFSET_X = -24;
export const CLUE_DIVIDER_Y = -82;
