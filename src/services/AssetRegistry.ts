import { ANIMALS, FOODS } from '../puzzle/types';

export interface AssetEntry {
  key: string;
  path: string;
}

export const pieceAssets: AssetEntry[] = ANIMALS.flatMap((animal) =>
  FOODS.map((food) => ({
    key: `piece_${animal}_${food}`,
    path: `assets/pieces/${animal}_${food}.webp`,
  })),
);

export const clueAssets: AssetEntry[] = [
  ...ANIMALS.map((animal) => ({ key: `glyph_${animal}`, path: `assets/clues/${animal}.webp` })),
  ...FOODS.map((food) => ({ key: `glyph_${food}`, path: `assets/clues/${food}.webp` })),
];

export const environmentAssets: AssetEntry[] = [
  { key: 'gameplay_plate', path: 'assets/environment/gameplay_plate.webp' },
  { key: 'success_stamp', path: 'assets/ui/success_stamp.webp' },
  { key: 'tiny_flower', path: 'assets/ui/tiny_flower.webp' },
  { key: 'tiny_leaf', path: 'assets/ui/tiny_leaf.webp' },
  { key: 'tiny_sparkle', path: 'assets/ui/tiny_sparkle.webp' },
];
