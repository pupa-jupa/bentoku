# Bentoku implementation plan

1. Establish a clean feature branch and record the approved design.
2. Replace English display-value enums with neutral difficulty and mode IDs; migrate tests.
3. Add typed EN/RU dictionaries and `I18nService`; localize every current visible string.
4. Migrate save data to version 2 with language, tutorial version, game mode, and timed statistics.
5. Remove gameplay keyboard controls and update pointer-based E2E coverage.
6. Extract reusable modal/button presentation needed by localized copy and the new pastel tokens.
7. Implement `TutorialController` and unit-test its gated state transitions.
8. Implement `TutorialView`, fixed Cozy tutorial entry, forced first-run flow, and Help replay.
9. Implement `ChallengeTimer` with a controllable clock and full unit tests.
10. Implement timed Master start/countdown/urgency/timeout/retry/new-challenge flows.
11. Add timed results and statistics; ensure Reveal is absent in timed mode.
12. Update prompts and create non-destructive pilot asset filenames.
13. Generate and visually inspect the plate, three cat pieces, and one clue glyph.
14. After visual acceptance, generate and normalize the remaining assets.
15. Run lint, format, unit/corpus, asset, build, and Playwright suites.
16. Review desktop and mobile-landscape screenshots in both locales and both modes.
17. Create a Vercel Preview and perform production-like smoke tests.
18. Wait for explicit approval before Production Deploy or domain changes.
