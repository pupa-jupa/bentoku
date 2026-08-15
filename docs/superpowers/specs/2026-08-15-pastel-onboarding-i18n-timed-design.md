# Bentoku pastel redesign and feature design

## Status

Approved by the product owner on 2026-08-15 with the corrections recorded below.

## Product direction

Bentoku keeps its existing Phaser puzzle engine, deterministic generator, exact solver, and
human-style solver. The presentation is redesigned around a soft pastel, dimensional bento-toy
style: quilted strawberry-milk fabric, warm ivory ceramic, mint dividers and stationery, pearly
clouds, lace, flowers, and compact tactile food characters.

Generated bitmap assets never contain interface text. All text remains code-rendered so English
and Russian layouts use the same artwork.

## Architecture choice

Use modular Phaser architecture. Do not add the new state machines to `PuzzleScene` directly and
do not rewrite the game as a React application.

New responsibilities are isolated as follows:

- `I18nService`: typed English and Russian dictionaries, interpolation, plural-aware counters.
- `TutorialController`: mandatory tutorial state machine and action gating.
- `TutorialView`: callouts, arrows, highlighted regions, and localized tutorial copy.
- `ChallengeTimer`: testable 105-second countdown independent of rendering.
- `TimedChallengeController`: Master challenge lifecycle, timeout, retry, and timed statistics.
- `SaveService`: versioned migration for language, tutorial completion, mode, and timed statistics.

Stable internal IDs use locale-neutral lowercase keys such as `cozy`, `gentle`, and `master`.
English display strings must not double as business-logic values. Both English and Russian labels
come from the dictionaries.

## Language behavior

- English is always the default for a new player, regardless of browser language.
- The settings modal provides an English/Russian selector.
- The chosen locale is persisted.
- URLs, seeds, and save identifiers use stable neutral keys and are not translated.
- Every visible string, including difficulty names, descriptions, clue names, counters, tutorial
  copy, challenge results, help, settings, and announcements, comes from the locale dictionaries.
- Russian move and completion counters use correct plural forms.

## Mandatory tutorial

The first launch always opens a fixed, solver-verified Cozy tutorial puzzle.

There is no Skip button. Informational steps advance through an explicit localized Continue
button. Interactive steps advance only after the requested action succeeds. Other puzzle actions
are gated during interactive steps.

Tutorial flow:

1. Welcome card with a `Take the tutorial` action.
2. Highlight the Bento Friends tray and explain the three-complete-families rule.
3. Highlight one required piece; advance only when that piece is selected.
4. Highlight its required bento cell; advance only after correct placement.
5. Highlight the fixed café map and explain exact-cell marks.
6. Highlight the movable sketches and explain that the whole shape may slide.
7. Require selection and placement of a second instructed piece.
8. Highlight the on-screen Undo button; advance only after it is pressed.
9. Require replacing the second piece correctly.
10. Mark the tutorial complete and release the Cozy puzzle for normal play.

The tutorial has localized text callouts, arrows, a dimmed surround, and a bright focus outline.
Reloading before completion restarts the tutorial. Completion is stored with a tutorial version.

The existing café-note/help area contains a clearly explained `Take the tutorial again` action.
It is not placed in Settings.

## Input model

The game is controlled by pointer and touch. Gameplay keyboard shortcuts, keyboard focus traversal,
and keyboard placement are removed, together with their README documentation and E2E assumptions.

## Timed Master challenge

Timed play is a separate `timed` mode using the normal Master generator profile.

- Duration: 105 seconds.
- A localized rules modal and explicit Start button appear before timing begins.
- A `3, 2, 1` countdown precedes the active timer.
- The timer becomes visually urgent during the final 15 seconds.
- Reveal is not shown or callable in timed mode.
- At zero, placement locks and the result offers only retry or a new timed challenge.
- There is no continue-without-timer action.
- Timed statistics store attempts, wins, and best remaining time.
- Hiding the page pauses the casual local challenge; returning shows a short resume countdown.
- A normal standard puzzle remains available through the main mode controls, not through the
  timeout result.

## Visual asset workflow

The supplied screenshot is a style reference, not an edit target. Existing Bentoku assets provide
shape, scale, transparent padding, and gameplay geometry.

- Generate isolated pieces and glyphs individually.
- Generate square masters at 2048×2048 and normalize to their existing exact canvases.
- Generate the plate at 2048×1152 and normalize to 1672×941.
- Preserve PNG alpha for isolated assets and build lossless runtime WebP files.
- Run exact dimension, alpha, asset-registry, and rendered screenshot checks.
- Approve a pilot consisting of the plate, the three cat pieces, and one glyph before accepting a
  full visual batch. Existing files are not overwritten until pilot review.

## Testing and acceptance

- Existing generator corpus remains green.
- Tutorial E2E covers first launch, gated steps, completion persistence, and replay from Help.
- Localization tests verify complete key parity and both English and Russian rendering.
- Timed tests use a controllable clock and cover start, urgency, pause/resume, timeout, retry,
  disabled Reveal, and a successful run.
- Pointer/touch E2E replaces keyboard-based interactions.
- Asset tests verify exact dimensions and transparency contracts.
- Desktop and mobile-landscape screenshots are reviewed before deployment.

## Deployment gate

Create a Vercel Preview only after implementation and local verification. Production deployment and
custom-domain changes require explicit approval after the preview is reviewed.

