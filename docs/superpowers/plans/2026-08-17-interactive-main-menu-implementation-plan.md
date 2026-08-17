# Bentoku interactive main-menu implementation plan

**Source design:** `docs/superpowers/specs/2026-08-17-dunya-menu-campaign-design.md`  
**Approved visual checkpoint:** commit `69d44de`  
**Deployment rule:** local preview only; no Vercel action

## Goal

Turn the approved static composition into the real first screen of Bentoku while preserving the
existing puzzle, tutorial, Rush, localization, audio defaults, and local saves.

## Task 1: complete the approved menu art family

- Keep the approved neutral Dunya, background, and normal button unchanged.
- Derive four Dunya face states from the neutral identity anchor: blink, speaking, delighted,
  and focused.
- Preserve the exact body, hands, costume, hair, light, crop, and 1024 × 1536 canvas.
- Derive hover and pressed variants from the approved button without redesigning its shape.
- Preserve the blank center; labels remain live Phaser text.
- Use the approved blue chroma workflow and verify real alpha for every cutout.
- Do not add menu icons because the approved composition uses clean text-only buttons.

## Task 2: build runtime assets

- Extend the existing runtime asset builder with menu and character source directories.
- Convert approved PNG sources to lossless WebP under `public/assets/menu/` and
  `public/assets/characters/`.
- Register all menu assets in `AssetRegistry` and preload them in `PreloadScene`.
- Extend asset tests to cover dimensions and required alpha.

## Task 3: add the menu scene

- Add `MenuScene` after `PreloadScene` and before `PuzzleScene` in game configuration.
- Make `PreloadScene` start `MenuScene` instead of the puzzle.
- Render the approved 1600 × 900 background.
- Render Dunya behind the display using a crop/mask so her lower body cannot leak beside the
  counter.
- Create four raster-backed buttons at the approved positions with live localized labels:
  Campaign, Infinite, Achievements, Settings.
- Add staggered entrance motion, gentle button hover/press motion, rare Dunya blink, and subtle
  breathing. Respect reduced-motion settings.
- Keep English as default and redraw the menu immediately after a language change.

## Task 4: connect real navigation

- Infinite starts the existing `PuzzleScene` without changing its URL-based seed/difficulty
  behavior or save restoration.
- Settings opens a menu-native panel for language, effects, music volume, and reduced motion.
- Campaign opens a local campaign-book shell that clearly belongs to the approved future
  campaign; it is not marked complete and contains no fake playable orders.
- Achievements opens a local Bentoku Album shell with the approved section names but no fake
  unlocks.
- Add a Back to café action to the puzzle Settings panel so the player can return to `MenuScene`.
- Scene shutdown disposes local music/audio objects and timers cleanly.

## Task 5: preservation and accessibility

- Keep the current version 2 save schema during this menu-only checkpoint; version 3 migration
  begins with real campaign data so no empty speculative save fields are written.
- Preserve first-entry tutorial choice: the menu always appears first, then Infinite triggers
  the existing tutorial when needed.
- Keep Settings accessible during the tutorial.
- Keep button text readable in English and Russian without baking either language into art.
- Use pointer/touch only; no keyboard gameplay controls.
- Preserve the existing portrait rotation overlay and landscape scaling.

## Task 6: tests and local review

- Update browser setup to enter Infinite before puzzle-specific scenarios.
- Add browser checks for menu-first startup, four actions, Dunya alpha/state behavior, Settings
  localization, Infinite navigation, and Back to café.
- Run formatting, lint, 33 unit tests, production build, asset verification, and all desktop and
  mobile browser scenarios.
- Keep the finished checkpoint running at `http://localhost:64242/` for review.
- Commit locally only after the interactive menu passes all checks.
- Do not deploy or update Vercel.
