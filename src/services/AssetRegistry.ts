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
  { key: 'piece_shell', path: 'assets/ui/piece_shell.webp' },
  { key: 'top_button_pill', path: 'assets/ui/top_button_pill.webp' },
  { key: 'top_button_pill_active', path: 'assets/ui/top_button_pill_active.webp' },
  { key: 'top_button_round', path: 'assets/ui/top_button_round.webp' },
  { key: 'success_stamp', path: 'assets/ui/success_stamp.webp' },
  { key: 'tiny_flower', path: 'assets/ui/tiny_flower.webp' },
  { key: 'tiny_leaf', path: 'assets/ui/tiny_leaf.webp' },
  { key: 'tiny_sparkle', path: 'assets/ui/tiny_sparkle.webp' },
];

export const menuAssets: AssetEntry[] = [
  {
    key: 'menu_cafe_background',
    path: 'assets/menu/main-menu-cafe-background-v1.webp',
  },
  {
    key: 'menu_display_foreground',
    path: 'assets/menu/main-menu-display-foreground-v1.webp',
  },
  { key: 'dunya_neutral', path: 'assets/characters/dunya-neutral-v1.webp' },
  { key: 'dunya_blink', path: 'assets/characters/dunya-blink-v1.webp' },
  { key: 'dunya_speaking', path: 'assets/characters/dunya-speaking-v1.webp' },
  { key: 'dunya_delighted', path: 'assets/characters/dunya-delighted-v1.webp' },
  { key: 'dunya_focused', path: 'assets/characters/dunya-focused-v1.webp' },
  { key: 'menu_button_normal', path: 'assets/ui/menu-button-base-v1.webp' },
  { key: 'menu_button_hover', path: 'assets/ui/menu-button-hover-v1.webp' },
  { key: 'menu_button_pressed', path: 'assets/ui/menu-button-pressed-v1.webp' },
];

export const soundAssets = {
  piece_pick: { key: 'sfx_piece_pick', path: 'assets/sfx/piece_pick.wav' },
  piece_drop: { key: 'sfx_piece_drop', path: 'assets/sfx/piece_drop.wav' },
  piece_swap: { key: 'sfx_piece_swap', path: 'assets/sfx/piece_swap.wav' },
  piece_return: { key: 'sfx_piece_return', path: 'assets/sfx/piece_return.wav' },
  note_open: { key: 'sfx_note_open', path: 'assets/sfx/note_open.wav' },
  board_incorrect: { key: 'sfx_board_incorrect', path: 'assets/sfx/board_incorrect.wav' },
  hint_reveal: { key: 'sfx_hint_reveal', path: 'assets/sfx/hint_reveal.wav' },
  success: { key: 'sfx_success', path: 'assets/sfx/success.wav' },
  ui_tap: { key: 'sfx_ui_tap', path: 'assets/sfx/ui_tap.wav' },
} as const satisfies Record<string, AssetEntry>;

export type SoundName = keyof typeof soundAssets;

export const musicAssets: AssetEntry[] = [
  { key: 'music_sunlit_puzzle', path: 'assets/music/sunlit_puzzle.mp3' },
  { key: 'music_paper_lantern_logic', path: 'assets/music/paper_lantern_logic.mp3' },
  { key: 'music_bossa_nova', path: 'assets/music/bossa_nova.mp3' },
  {
    key: 'music_paper_lantern_logic_short',
    path: 'assets/music/paper_lantern_logic_short.mp3',
  },
  { key: 'music_light_of_tea', path: 'assets/music/light_of_tea.mp3' },
  { key: 'music_pearl_arcade', path: 'assets/music/pearl_arcade.mp3' },
];
