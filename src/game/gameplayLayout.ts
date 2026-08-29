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
export const CLUE_ANCHOR_CENTER_Y = -190;
export const CLUE_ANCHOR_CELL_SIZE = 48;
export const CLUE_DIVIDER_Y = -100;
export const CLUE_PARTIAL_CELL_SIZE = 45;
export const CLUE_ANCHOR_DIVIDER_GAP = 18;
export const CLUE_DIVIDER_PARTIAL_GAP = 12;
export const CLUE_PARTIAL_ROW_GAP = 8;

export interface ClueLayoutInput {
  readonly width: number;
  readonly height: number;
}

export interface PartialCluePlacement {
  readonly index: number;
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

export const calculatePartialClueLayout = (
  clues: readonly ClueLayoutInput[],
): readonly PartialCluePlacement[] => {
  const placements: PartialCluePlacement[] = [];
  let rowTop = CLUE_DIVIDER_Y + CLUE_DIVIDER_PARTIAL_GAP;

  for (let start = 0; start < clues.length; start += 2) {
    const row = clues.slice(start, start + 2);
    const rowHeight = Math.max(...row.map((clue) => clue.height * CLUE_PARTIAL_CELL_SIZE));
    row.forEach((clue, column) => {
      const width = clue.width * CLUE_PARTIAL_CELL_SIZE;
      const height = clue.height * CLUE_PARTIAL_CELL_SIZE;
      placements.push({
        index: start + column,
        x: row.length === 1 ? 0 : -82 + column * 164,
        y: rowTop + height / 2,
        width,
        height,
      });
    });
    rowTop += rowHeight + CLUE_PARTIAL_ROW_GAP;
  }

  return placements;
};
