# CI, persistent atmosphere, developer access, clue layout, and runtime assets

**Status:** Approved design, pending implementation  
**Date:** 2026-08-28

## Scope

This change addresses the current GitHub Actions failures and the related product corrections as one coherent release:

- keep routine push and pull-request checks fast and move the complete browser suite to a manually dispatched workflow;
- remove the timing assumptions that make the campaign-finale and Rush browser tests fail on software-rendered CI runners;
- keep music continuous across menus, stories, campaign orders, and puzzles, with explicit previous/next track controls;
- add a persistent user-controlled night-dimming layer;
- hide unfinished Campaign and Achievements navigation behind a session-only developer shortcut while preserving their layouts;
- keep Daily and Rush visible but disabled during campaign play;
- replace fixed clue-card geometry with a background-free, measured two-column layout;
- standardize outside-click and Escape dismissal for modal surfaces;
- keep difficulty names in game history in English in every interface language;
- guarantee that production ships only pixel-verified lossless WebP artwork and apply stronger lossless compression where it reduces size.

The earlier game-history, elapsed-timer, and six-track BGM work remains in place. This specification corrects and extends that implementation rather than replacing its save/history model.

## Investigation and root causes

### CI and browser tests

The failed GitHub Actions run spent about 8.2 minutes in Playwright after installing Chromium and running the complete quick suite in the same sequential job. The four reported failures were limited to two assertions repeated in the `desktop` and `mobile-landscape` Playwright profiles:

- the campaign-finale test allowed only ten seconds for a Phaser scene to finish loading and advance its challenge timer from `idle` to `running`;
- the Rush test read the rendered timer label immediately after the underlying challenge state changed, before the next Phaser render frame updated the text.

On the same machine, stressing the selected scenarios with four workers made Preload exceed its fixed five-second wait. The screenshot showed the loader still making progress rather than an application deadlock. Running the selected scenarios with one worker passed repeatedly. The root cause is therefore wall-clock synchronization combined with CPU contention on software-rendered Phaser, not incorrect campaign or timer rules.

The Vercel deployment for the same commit completed successfully and `main` is not protected by a required CI status. The current workflow does not technically gate Vercel, but it creates a long red status for every deployment and consumes time installing browser dependencies that routine verification does not need.

### Music lifecycle

`MenuScene`, `CampaignScene`, `StoryScene`, and `PuzzleScene` each construct their own `MusicService`. The service subscribes to its owning scene's `SHUTDOWN` event and disposes the current sound. Every scene transition therefore destroys and restarts the playlist even though Phaser's Sound Manager is global and sounds do not inherently need to stop between scenes.

### Clue overlap

`CluePanel` positions partial clues with fixed row increments of 116 pixels in compact mode. A 1x3 partial clue currently receives a 154-pixel card, so neighboring rows can overlap by 38 pixels. The divider is also at a fixed Y coordinate unrelated to the measured anchor or partial-clue bounds. Translucent card fills and their padding consume additional visible space and make the collision more obvious.

### Modal dismissal and localized difficulty

Modal backdrops are interactive blockers but have no shared outside-click behavior, and Escape handling is either absent or implemented per scene. `GameHistoryModal` formats difficulty through the active localized `I18nService`, although difficulty names are intentionally an English-only part of the product vocabulary.

### Runtime artwork

All 39 current runtime images are already registered as `.webp`, and a fresh production build contains 39 WebP images and zero PNG/JPG files. Source PNG/JPG files live under `art/`, outside Vite's runtime roots. The existing verifier proves identical alpha and visible RGB values after decoding, but it does not scan the final `dist` for accidentally introduced source rasters.

The current encoder uses Sharp lossless WebP with `effort: 6`, the maximum Sharp exposes, but leaves lossless `quality` at its default. An all-asset experiment found that comparing `quality: 80` and `quality: 100` and taking the smaller output reduces the current 13,447,142 bytes to 13,265,518 bytes: a 181,624-byte (about 1.35%) reduction with identical visible pixels. Near-lossless and lossy modes are excluded because they modify decoded pixels.

## Selected architecture

Three approaches were considered:

1. patch every existing scene with more lifecycle and UI conditionals;
2. add one persistent atmosphere scene plus small shared controllers and pure layout helpers;
3. replace the scene structure with a full persistent application shell.

Approach 2 is selected. It fixes the cross-scene ownership problem directly, makes modal and layout behavior reusable, and avoids a high-risk rewrite of working scene navigation.

## Persistent atmosphere and music

### Atmosphere scene

Add `AtmosphereScene` to the Phaser configuration and launch it once after `PreloadScene` completes. It remains active in parallel with Menu, Campaign, Story, and Puzzle scenes. Ordinary navigation must never stop or restart it.

The scene owns two long-lived systems:

- `MusicDirector`, which controls the global playlist and current track;
- `NightOverlay`, a resize-aware, non-interactive screen rectangle.

The atmosphere scene is brought above the currently active content scene after navigation so the dimmer affects the complete authored game surface. Its overlay never registers input, so pointers continue to reach the active scene. Browser/game destruction is the only normal disposal boundary.

### Music director

Refactor the scene-local music implementation into a director owned only by `AtmosphereScene`.

Required behavior:

- start once after audio is permitted and continue the same sound through scene transitions;
- retain the existing ordered six-track playlist and automatic next-track behavior;
- lazily load an uncached selected or upcoming track;
- expose the current track key/title and `previous()`, `next()`, and `setVolume()` operations;
- retain the established fade-out, short silence, and fade-in sequence when a track reaches its natural end;
- switch manually with a 900-millisecond equal-power crossfade: load the target first, overlap only the outgoing and incoming sounds during the transition, then destroy the outgoing sound;
- persist the selected track key so a later browser session begins with the same track when it still exists;
- ignore an unknown saved key and fall back to the first registered track;
- treat autoplay rejection or an individual file-load failure as non-fatal, preserving the current retry/resume behavior without blocking scene navigation; a failed manual target leaves the current track playing.

Scene-local sound effects remain owned by `AudioService`; only BGM becomes global.

### Track controls

Both Menu Settings and Puzzle Settings display one compact row:

`‹  Current Track  ›`

The label uses the registered human-readable title. The arrows select the previous or next playlist item and remain centered in their hit areas. The music-volume slider continues to control the same global director.

## Night dimming

`NightOverlay` draws a warm navy-brown (`0x20242c`) full-screen rectangle using Phaser's `MULTIPLY` blend mode. It maps a persisted integer slider value from 0–100 to alpha 0–0.45. A value of zero makes the overlay invisible; it does not remove or recreate the scene.

The dimmer:

- covers gameplay, menus, and modal surfaces consistently;
- remains non-interactive;
- resizes with the Phaser scale manager;
- does not alter individual asset colors or require night variants;
- defaults to zero for new and migrated users.

Menu Settings and Puzzle Settings receive the same `Night dimming` slider and numeric percentage. Changing it updates the persistent overlay immediately. No automatic `prefers-color-scheme` behavior is added in this release because the approved control is explicit and user-driven.

## Save-data and session state

Extend `PlayerSettings` with:

- `nightDim: number`, stored as a normalized value from 0 to 1;
- `musicTrackKey: string`, containing a registered BGM key.

The v4 parser accepts these optional fields without requiring a storage-version bump. Missing, malformed, non-finite, or out-of-range dimming values fall back to zero and are clamped. Missing or unknown track keys fall back to the first track. All existing history, puzzle, campaign, tutorial, audio, and appearance fields remain intact.

Developer access is deliberately not durable player progress. A small `DevModeService` stores only a boolean in `sessionStorage`, so it survives same-tab scene changes and reloads but resets when the browser session ends. Storage access failures fall back to an in-memory value.

## Developer-gated navigation

The physical keyboard chord `Ctrl+Shift+D` toggles developer mode. Detection uses `KeyboardEvent.code === 'KeyD'`, making it independent of the active keyboard layout. Repeating the chord disables the mode.

Ordinary player state:

- Campaign and Achievements remain visible in their current main-menu positions;
- both are dimmed and non-interactive;
- pointer hover/press feedback does not imply they can be opened.

Developer state:

- the two buttons regain normal opacity and interaction;
- a small `DEV MODE` badge appears in the main menu;
- toggling updates the current menu without a reload.

The chord is a development convenience, not an authorization or security boundary.

## Campaign toolbar stability

PuzzleScene always constructs Daily and Rush controls in the same toolbar coordinates. When `playContext.source === 'campaign'`, both controls are dimmed and non-interactive instead of omitted. Their text and dimensions remain unchanged so campaign mode preserves the ordinary toolbar layout. Difficulty selection remains unavailable during a campaign order.

## Clue layout

### Background-free clue view

`ClueView` no longer creates a rounded background graphic for either the anchor clue or partial clues. Removing a card also removes its invisible top/bottom card padding; only the logical clue grid and glyphs define the view's measured width and height. Grid strokes remain because they convey the clue structure.

### Measured two-column layout

Replace fixed `compact` row spacing with a pure layout calculation based on each clue's actual grid height.

The calculator:

- derives each clue's width and height from its cell size and grid dimensions;
- places the anchor closer to `Order Notes`;
- places up to six partial clues in two columns;
- uses the tallest clue in each row to determine the next row's Y coordinate;
- horizontally centers a single item in the final row;
- applies one shared optical X offset to title, anchor, divider, partial clues, and empty-state copy;
- slightly increases partial glyph/cell size only when all measured rows still fit in the panel.

Hard geometry invariants:

- at least 18 pixels between the anchor grid's bottom edge and the divider;
- at least 12 pixels between the divider and the first partial grid's top edge;
- at least 8 pixels between the measured bounds of consecutive partial rows;
- no clue background, card padding, or overlap;
- all content remains within the existing clue-paper viewport for every generated clue shape, including 1x3 and 3x1 patterns.

The pure calculator receives clue dimensions and panel constraints and returns positions/sizes, allowing corpus tests to validate all layouts without rendering Phaser.

## Modal dismissal

Add one shared modal-dismiss helper used by Menu modals, Puzzle modals, and `GameHistoryModal`.

For a dismissible modal it:

- closes on pointer release outside the measured card bounds;
- closes on Escape;
- consumes interaction inside the card so it cannot fall through to the backdrop;
- removes backdrop and keyboard listeners when the modal closes or its scene shuts down;
- invokes the existing close callback exactly once.

An interaction that begins inside and ends outside is treated as outside dismissal on release. Explicitly non-dismissible transition/countdown states do not opt into the helper.

Closing the campaign-finale timed-rules modal returns to `CampaignScene` rather than leaving an idle, input-locked puzzle behind. Other modal close callbacks preserve their existing destination or resume behavior.

## English difficulty names in history

Add a single English-only difficulty formatter backed by English `I18nService` data or a dedicated typed mapping. `GameHistoryModal` uses it for `Gentle`, `Cozy`, `Tricky`, and `Master` regardless of the active interface language. Dates, headings, status copy, and other history text continue to follow the selected interface language.

## Runtime WebP policy

### Asset generation

`scripts/build-runtime-assets.mjs` encodes every selected PNG/JPG source twice with Sharp lossless WebP at maximum `effort: 6`, using `quality: 80` and `quality: 100`. It keeps the smaller WebP buffer, writes only the `.webp` result under `public/assets`, and reports the selected setting and byte size. No near-lossless, palette quantization, resize, or lossy path is allowed.

The existing pixel verifier remains authoritative for image fidelity:

- dimensions must match;
- alpha values must match;
- RGB values for every visible pixel must match;
- fully transparent RGB values may be normalized because they do not affect rendered output.

### Runtime and build guards

Extend asset verification with these failures:

- any registered runtime image path not ending in `.webp`;
- any `.png`, `.jpg`, or `.jpeg` file under `public`;
- any `.png`, `.jpg`, or `.jpeg` file in the completed `dist` production bundle;
- a missing registered WebP file;
- any source/runtime pixel mismatch.

The automatic workflow runs source/public verification before compilation and scans `dist` immediately after `pnpm build`. PNG/JPG master files remain under `art/` and are never copied to runtime output.

## GitHub Actions design

### Automatic quick workflow

Retain `.github/workflows/ci.yml` for `push` and `pull_request`, but remove Chromium installation and `pnpm test:e2e`. It performs:

1. checkout;
2. pnpm and Node setup with pnpm dependency caching;
3. frozen install;
4. asset/source/public verification;
5. ESLint;
6. Prettier check;
7. complete Vitest unit and corpus suite;
8. production build;
9. final `dist` runtime-asset scan.

Add workflow concurrency keyed by workflow and ref, with `cancel-in-progress: true`, so superseded pushes do not continue consuming runners. This workflow remains the routine commit signal and contains no browser dependency installation.

### Manual complete E2E workflow

Add `.github/workflows/e2e.yml` with `workflow_dispatch` only. A matrix creates separate `desktop` and `mobile-landscape` jobs. Each job:

- performs the normal frozen install and Chromium setup;
- runs only its named Playwright project;
- uses one Playwright worker to avoid renderer starvation;
- has an explicit job timeout;
- uploads screenshots, traces, and Playwright result artifacts on failure;
- does not become a required deployment status.

The two profiles are browser configurations in one Bentoku project, not two projects or repositories.

### Test synchronization

Browser helpers wait for observable application conditions rather than fixed sleeps:

- Preload completion is detected by the expected active scene or a ready test bridge;
- challenge startup waits for `state === 'running'` with a CI-appropriate condition timeout;
- rendered timer text is polled after state startup until a Phaser frame exposes an allowed value;
- tests do not add retries to hide nondeterminism;
- assertions keep the exact campaign-final and 1:45 Rush product rules.

## Error handling

- Atmosphere startup, autoplay rejection, and BGM lazy-load errors never prevent menu or puzzle navigation.
- An invalid persisted track key and malformed night value fall back safely.
- Modal close callbacks are idempotent and listeners are always cleaned up.
- Session-storage denial does not disable the developer chord for the current page.
- Asset generation fails before overwriting a valid runtime result if neither candidate can be encoded or verified.
- CI artifact upload uses an always/failure condition that does not replace the original Playwright exit status.

## Verification and acceptance criteria

### Unit and corpus tests

- MusicDirector playlist selection, previous/next wrapping, persisted-key fallback, and transition state.
- Save parsing/defaults/clamping for `nightDim` and `musicTrackKey`, including legacy v4 data.
- Developer-mode toggle and session fallback.
- English difficulty formatting under Russian and English UI settings.
- Modal outside/inside/Escape dismissal and one-shot cleanup where logic is testable outside Phaser.
- Clue layout corpus proving every hard spacing invariant and panel containment for all generated clue shapes.
- Existing puzzle, history, elapsed timer, tutorial, campaign, solver, and challenge-timer suites remain green.

### Browser tests

- BGM sound identity/current key survives Menu → Campaign → Story → Puzzle and campaign-order transitions.
- Previous/next controls update the current title and leave no orphaned overlapping sound after the intentional crossfade completes.
- Night slider updates the atmosphere layer, persists after reload, and does not block pointer input.
- Campaign/Achievements are inert normally and enabled after `Ctrl+Shift+D`; the badge and repeat-toggle state are visible.
- Campaign Daily/Rush controls remain present and inert.
- Every dismissible modal closes by outside click and Escape but not by inside click.
- Campaign timed-rules dismissal returns to Campaign.
- Russian history UI still displays English difficulty names.
- Clue geometry has no background graphics and satisfies spacing in representative dense layouts at desktop and mobile-landscape sizes.
- Network/resource inspection observes WebP for all registered artwork and no PNG/JPG runtime requests.
- Campaign-finale and Rush timer scenarios pass in both Playwright profiles without fixed-delay assumptions.

### Release checks

Before the implementation commit is pushed to `main`, run asset verification, lint, format check, the complete Vitest unit/corpus suite, production build, and local E2E in both Playwright browser profiles. Inspect the clue panel, settings/night control, gated main menu, campaign toolbar, and representative modals in the in-app browser at desktop and mobile-landscape dimensions.

## Primary references

- GitHub manual workflows: https://docs.github.com/en/actions/how-tos/manage-workflow-runs/manually-run-a-workflow
- GitHub workflow syntax and concurrency: https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax
- GitHub dependency caching: https://docs.github.com/en/actions/reference/workflows-and-actions/dependency-caching
- Phaser audio and global Sound Manager: https://docs.phaser.io/phaser/concepts/audio
- Phaser parallel scenes: https://docs.phaser.io/phaser/concepts/scenes
- Phaser blend modes: https://docs.phaser.io/phaser/concepts/display/blend-mode
- Sharp WebP output options: https://sharp.pixelplumbing.com/api-output/#webp
- Google WebP encoder options: https://developers.google.com/speed/webp/docs/cwebp
