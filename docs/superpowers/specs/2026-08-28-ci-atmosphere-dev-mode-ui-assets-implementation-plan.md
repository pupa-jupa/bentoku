# CI, atmosphere, developer mode, UI, and assets implementation plan

1. Add save-setting defaults, parsing, clamping, and update methods for `nightDim` and
   `musicTrackKey`; add regression tests for legacy v4 saves and malformed values.
2. Add English-only difficulty formatting and a session-backed `DevModeService`; unit-test both
   independently from Phaser.
3. Extend music registry entries with human-readable titles and replace scene-local
   `MusicService` ownership with a persistent `MusicDirector` that supports lazy loading,
   automatic continuation, persisted selection, and manual previous/next crossfades.
4. Add a persistent parallel `AtmosphereScene` launched by Preload, with a resize-aware,
   non-interactive multiply-blend `NightOverlay`; connect it to saved settings and expose a small
   typed bridge used by Menu and Puzzle settings.
5. Remove all scene-local BGM construction/disposal and add Settings rows for current track
   previous/next controls and the night-dimming slider in both Menu and Puzzle.
6. Implement `Ctrl+Shift+D` developer mode in the main menu, keep Campaign and Achievements
   visible but inert/dimmed normally, restore them in developer mode, and render the session-only
   badge.
7. Always render Daily and Rush in PuzzleScene; preserve coordinates and disable/dim them in
   campaign context without exposing difficulty or mode changes.
8. Extract a pure measured clue-layout helper and corpus-test the 18/12/8-pixel invariants;
   remove ClueView background graphics and padding, move the anchor upward, and render partial
   clues in height-aware two-column rows.
9. Add a shared outside-click/Escape modal-dismiss helper, apply it to Menu, Puzzle, and history
   modals, and ensure campaign timed-rules dismissal returns to Campaign instead of leaving an
   idle locked puzzle.
10. Render English difficulty labels in game history while preserving localization for every
    other history field.
11. Update runtime asset generation to compare lossless WebP quality 80 and 100 buffers, verify
    decoded visible pixels before replacement, keep the smaller candidate, and regenerate the 39
    committed WebP files.
12. Extend asset guards to reject runtime PNG/JPG paths/files in `public` and `dist`; add script
    commands and unit coverage for the production-only WebP contract.
13. Split GitHub Actions into a cached automatic quick workflow and a manual
    `workflow_dispatch` E2E matrix for `desktop` and `mobile-landscape`, one worker per matrix job,
    with failure artifacts and superseded-run cancellation.
14. Replace brittle Playwright sleeps/immediate frame assertions with observable scene/timer
    conditions and add browser coverage for persistent BGM, track switching, night dimming,
    developer gating, campaign toolbar stability, modal dismissal, English history difficulty,
    clue geometry, and runtime WebP requests.
15. Run focused tests after each subsystem, then run Prettier, ESLint, asset verification, the
    complete Vitest unit/corpus suite, production build plus `dist` scan, and local Playwright in
    both browser profiles with one worker.
16. Inspect desktop and mobile-landscape states in the in-app browser, correct any visual or input
    regressions, commit the implementation, push `main`, and confirm the resulting GitHub status.
