# Game history, timer, audio, and layout implementation plan

## 1. Add elapsed-time domain logic

Files:

- create `src/gameplay/ElapsedTimer.ts`
- create `tests/elapsed-timer.test.ts`

Implement a clock-injected active elapsed timer with start, pause, resume, reset, and an accumulated value. Test repeated calls, hidden/pause gaps, and reset behavior independently from Phaser.

## 2. Version and migrate saved history

Files:

- update `src/puzzle/types.ts`
- update `src/services/SaveService.ts`
- create `tests/save-history.test.ts`

Move SaveData to version 4. Add timing identity to `currentPuzzle`, add a bounded completed history collection, and safely parse legacy v1-v3 data. Extend load/save methods to return and persist attempt timing. Record completion before clearing the current puzzle. Cover fresh defaults, migration, malformed entries, completion, and the 100-entry cap.

## 3. Build the paginated history modal

Files:

- create `src/views/GameHistoryModal.ts`
- update `src/i18n/translations.ts`
- update `src/scenes/PuzzleScene.ts`

Replace the seed text badge with a Game History pill. Build a wide paper modal with column headers, seven rows per page, clickable seeds, copy feedback, active-row treatment, pagination, and compact replay actions. Supply live active-attempt data from PuzzleScene and replay the selected seed/difficulty/context as a fresh attempt.

## 4. Integrate elapsed tracking into gameplay lifecycle

Files:

- update `src/scenes/PuzzleScene.ts`
- update relevant browser tests under `tests/e2e/game.spec.ts`

Show elapsed time alongside moves. Pause/resume around document visibility, scene shutdown, modal open/close, timed rules/countdown, completion, and timeout. Persist timing with board state. Reset timing on restart and start a fresh attempt on replay.

## 5. Correct the requested layouts

Files:

- update `src/views/CluePanel.ts`
- update `src/views/ClueView.ts`
- update `src/scenes/PuzzleScene.ts`
- update or add layout assertions

Use one shared clue-content optical offset, remove translucent clue-card strokes, move the divider upward, narrow only difficulty modal actions, and normalize top icon metrics/offsets.

## 6. Add supplied BGM

Files:

- copy two supplied MP3s to `public/assets/music`
- update `src/services/AssetRegistry.ts`
- update `art/audio-manifest.json`
- update `tests/assets.test.ts`

Register both tracks with safe runtime filenames. Preserve the existing lazy-loaded fading playlist. Record source hashes and available MP3 metadata and require six tracks in tests.

## 7. Verify behavior and visuals

Run in order:

1. focused elapsed/save/history/layout/asset tests;
2. TypeScript production build;
3. ESLint and Prettier check;
4. full unit/corpus suite;
5. Playwright browser suite;
6. capture 1600 × 900 screenshots for gameplay, history, and difficulty modals and inspect them visually;
7. run `git diff --check` and audit every numbered user requirement against the current files and rendered UI.
