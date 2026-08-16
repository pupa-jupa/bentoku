# Tutorial, audio, localization, alignment, and shell corrections

## Approved behavior

### Tutorial

- Every tutorial step exposes a visible `Skip tutorial` action.
- Skip asks for confirmation to prevent accidental dismissal.
- Confirming Skip marks the current tutorial version complete and opens the tutorial Cozy puzzle as normal play with an empty board.
- Settings remain accessible throughout the tutorial. Closing Settings resumes the same tutorial step and board state.
- A tutorial placement is validated before the placement model changes. A tap on a wrong cell keeps the piece selected; an invalid drag returns it to its previous home. The tutorial remains on the same instruction.
- Only the exact requested action advances an interactive tutorial step.

### Music

- Default music volume is 50%.
- Existing version-2 saves receive a one-time migration to the new 50% startup default. After migration, later user-selected values from 0–100% are preserved.
- The settings slider and actual MusicService volume always use the same stored value.

### Localization scope

- The main game surface is always English: brand subtitle, inventory and clue headings, difficulty, top buttons, status, timer, challenge modals, completion UI, and ordinary announcements.
- The saved English/Russian preference affects only Settings, Help and hint copy, and Tutorial.
- Changing language while the tutorial is active redraws the localized tutorial copy without changing its step or board state.

### Piece alignment

- Tray positions match the visual centers of the twelve recesses in the approved pastel gameplay plate.
- Each piece is optically centered from its real non-transparent source bounds, rather than using a shared negative offset.
- The same centered piece container is used on the tray and at `BentoBoard.slotWorldPosition`, so the generated shell and character share one center.

### Generated 3D shell

- `piece_shell.png` remains an independent raster asset with genuine alpha and a lossless WebP runtime copy.
- Replace it with a more detailed three-dimensional glazed porcelain rosette: warm cream concave center, raised blush and lilac petals, pearlescent piping and beads, a restrained mint accent, ambient occlusion, and a short soft lower-right shadow contained inside the asset.
- The center stays quiet enough for every existing food character. No character pixels are regenerated.

## Verification

- Controller tests cover Skip and rejected tutorial actions.
- Browser tests cover wrong-cell recovery, Settings during tutorial, Skip confirmation, scoped Russian copy, and 50% migrated music volume.
- Visual QA captures pieces both on the tray and in several bento cells.
- Asset verification requires exact source/runtime alpha and visible RGB equality.
- TypeScript, ESLint, Prettier, unit/corpus tests, production build, and desktop/mobile Playwright tests must pass.
