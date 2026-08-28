# Game history, elapsed timer, clue layout, audio, and night comfort

## Scope and approved behavior

This change keeps Bentoku's existing pastel café art direction and implements the user's eight requested corrections. It adds game history and elapsed-time tracking, corrects the clue and difficulty layouts, optically centers the top-right symbols, and adds the two supplied BGM tracks. Night comfort is researched and presented as implementation options; no night-mode behavior is selected or added in this change.

## Root causes

- The clue contents use two different horizontal coordinate systems: the title, anchor map, and divider are centered at `0`, while partial clues carry a `-42` pixel exception. This makes neither group share the illustrated paper's optical center. A single shared content offset will replace the exception.
- Every clue card draws a translucent rounded stroke. Although it is not part of Phaser's layout bounds, it visually enlarges each card and crowds the partial-clue area.
- The divider is fixed at `y = -55`, where it competes with the top of compact partial-clue cards.
- The seed is an ad-hoc text object with clipboard behavior, not a reusable navigation action. There is no persisted attempt identity, start time, active duration, or completed-game list.
- The generic modal always uses 238-pixel actions. The difficulty chooser does not opt into a narrower width.
- Top-right Unicode glyphs use per-button vertical offsets and the body typeface's differing glyph metrics, so their optical centers disagree.
- `musicAssets` contains four tracks and the playlist already lazy-loads subsequent entries; the two supplied tracks are simply absent from the registry, runtime directory, tests, and manifest.

## History and timer architecture

### Considered persistence approaches

1. **Versioned save-data extension (selected).** Extend the existing localStorage save from v3 to v4 with timing fields on the active puzzle and a bounded completed-history array. This is atomic with moves/board state, follows current architecture, and needs no new storage abstraction.
2. A second localStorage key dedicated to history. This isolates growth but creates cross-key consistency problems when a puzzle is completed.
3. IndexedDB. This scales far beyond the required history size but adds asynchronous lifecycle and migration complexity with no current benefit.

The selected design retains at most 100 completed entries. A typical entry is small, so this remains comfortably within localStorage limits while preventing unbounded growth.

### Saved data

The active puzzle gains:

- a stable attempt id;
- `startedAt` as an epoch timestamp;
- accumulated active `elapsedMs`.

Each completed history entry stores attempt id, start date, seed, difficulty, mode/source context, duration, and moves. Existing v1-v3 saves migrate without losing settings, progress, campaign state, or stats. An already active legacy puzzle receives a fresh start timestamp and zero elapsed time because its real historical timing cannot be reconstructed honestly.

Only one unfinished game exists. Starting a different game replaces an abandoned unfinished attempt rather than presenting multiple ambiguous unfinished rows. Completed attempts remain in history. Replaying any row starts a fresh attempt with the same seed and difficulty; campaign and Rush context are preserved when available.

### Timer semantics

The elapsed timer measures active solving time, not wall-clock time. It pauses while:

- the document is hidden;
- Settings, Help, difficulty, history, or another blocking modal is open;
- a timed-mode rules screen or countdown is active;
- the puzzle scene is not active;
- the puzzle is solved or has timed out.

It resumes when play resumes. The accumulated value is persisted with board/move saves and on scene visibility/shutdown boundaries. Standard games display `Moves · Time` in the existing bottom status area. Rush keeps its countdown and also records actual active duration in history.

### History modal

The seed badge at the top becomes a proper `Game history` pill. It opens a wide, paper-styled modal with:

- start date and time;
- clickable seed (copies the existing share URL and gives inline feedback);
- localized difficulty;
- duration;
- moves;
- a compact centered `↻` replay action.

Rows are newest first. The active unfinished game is row one on page one and uses its current duration/move count. Seven rows fit per page; previous/next controls and `page / total` make pagination explicit. Pagination is clamped after data refresh. Clipboard failure falls back to the existing accessible announcement containing the seed.

## Layout corrections

- Replace the partial-clue-only horizontal exception with one shared optical content offset applied to the title decorations, anchor clue, divider, partial clues, and empty-state copy.
- Remove only the translucent outer card strokes; retain the cream/milk card fills and the dark logical grid strokes.
- Move the divider upward enough to clear compact cards without changing clue hit areas.
- Give only the difficulty chooser a narrower action width; all other modal menus retain their established widths.
- Use one icon style and one optical vertical alignment for the undo, help, settings, pagination, and replay symbols. Remove the help button's one-off offset.

## BGM integration

Copy `light of tea.mp3` and `Pearl Arcade.mp3` into `public/assets/music` with runtime-safe lowercase filenames, add them to the playlist registry, update the audio manifest with hashes and measurable metadata where available, and update asset coverage from four to six tracks. The existing `MusicService` continues to preload only the first item, lazy-load the next item, fade out, insert a short silence, and fade in the following track.

## Night-comfort options

### A. In-canvas warm dimmer with a slider (recommended)

Add a full-canvas, non-interactive navy-brown rectangle at a dedicated depth, use Phaser's WebGL- and Canvas-supported `MULTIPLY` blend mode, and map a Settings slider to a conservative 0-45% strength. Keep modal UI above the dimmer or dim it slightly less. Persist the value and optionally initialize it from `prefers-color-scheme: dark` only for new users.

This directly matches the user's remembered game control, is inexpensive (one game object and one blend batch), preserves the authored palette better than a black veil, and works consistently with the current Phaser 4 renderer. The main design decision is whether UI chrome should remain brighter than the board.

### B. CSS `filter: brightness()` on the Phaser canvas

Apply a persisted slider to the canvas element, for example from `brightness(1)` down to roughly `brightness(.55)`. It is the smallest implementation and MDN marks `brightness()` as widely available. However it uniformly crushes artwork, text, modal contrast, and focus feedback, and browser compositing can make a large animated canvas more expensive.

### C. Authored full night palette

Create dark variants of the background plate and all UI colors, use `prefers-color-scheme` plus a manual `Day / Auto / Night` setting, and declare `color-scheme` for surrounding browser UI. This gives the best contrast and most beautiful result, but requires new art assets and systematic contrast QA. It is a separate art-direction project, not a small correction.

The recommended product path is option A now, with `Day / Auto / Night` semantics added later if user testing justifies option C. `prefers-color-scheme` is a preference signal, not a replacement for the requested manual intensity control.

Primary references:

- MDN `prefers-color-scheme`: https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@media/prefers-color-scheme
- MDN `color-scheme`: https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/color-scheme
- MDN `brightness()`: https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/filter-function/brightness
- Phaser 4 blend modes: https://docs.phaser.io/phaser/concepts/gameobjects/components

## Error handling and compatibility

- Malformed history entries are discarded individually during save parsing; a bad row cannot erase valid current progress.
- Storage and clipboard failures remain non-fatal.
- Unknown legacy values fall back to existing settings defaults.
- History replay validates difficulty and campaign identifiers before use.
- The history modal blocks board input and pauses elapsed tracking exactly like other modals.

## Verification

- Unit tests cover elapsed timer start/pause/resume/reset behavior and v3-to-v4 save migration/history completion.
- Asset tests require six registered MP3 files.
- Existing puzzle, campaign, tutorial, challenge-timer, and layout suites remain green.
- Browser coverage verifies the always-visible elapsed time, history modal columns, current row, clipboard affordance, pagination, replay, narrower difficulty buttons, and centered top icons.
- Visual QA captures the clue paper and both modals at 1600 × 900 and at the existing mobile landscape viewport.
- TypeScript, ESLint, Prettier, unit tests, production build, and Playwright tests pass.
