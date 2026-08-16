# Bentoku

Bentoku is a finished client-side browser puzzle about arranging nine tiny kawaii food friends inside a 3 × 3 bento box. Twelve pieces are available: choose exactly three complete animal families and leave the fourth family on the tray. The order-note sketches describe relative spatial relationships, and every generated puzzle is proven unique from the rules visible to the player.

## Play

- Click or tap a piece, then a bento cell.
- Drag a piece directly into the box.
- Drop one placed piece onto another to swap them.
- Drop a placed piece back on the tray to return it.
- On the first visit, complete or skip the guided Cozy tutorial. Each interactive instruction must be performed before the lesson advances; the lesson can later be replayed from Help.
- Choose Cozy, Gentle, Clever, Tricky, or Master from the difficulty button. Every level is deduction-only; higher levels use longer chains instead of guesses. Master leaves at least one café-map cell blank and links five or six substantial sliding sketches.
- Choose English or Russian in settings. English is the default language.
- Master Rush adds a 1:45 timer to a fresh Master puzzle. Reveal is disabled, and an expired attempt can only be retried or replaced with a new challenge.
- Set effects and music volume independently in Cozy settings; the Effects switch remains available for quick muting.
- Click the seed to copy a shareable link. Daily and random bentos work without a backend.

## Development

```bash
pnpm install
pnpm exec playwright install chromium
pnpm dev
pnpm test
pnpm test:e2e
pnpm lint
pnpm build
pnpm preview
pnpm assets:build
pnpm assets:verify
```

The 12,500-puzzle suite is part of `pnpm test` and covers all five difficulty levels. It independently verifies public-rule uniqueness and completion by the deterministic deduction solver. All art is prepared ahead of time and shipped as lossless WebP assets; the production game never calls an image-generation API. Source PNG files remain under `art/` and never enter the runtime bundle. `assets:verify` decodes both source and WebP files and verifies pixel-identical visible RGBA data.

## Architecture

- Phaser 4.2.1 canvas game
- TypeScript and Vite 8.1
- Seeded solution-first generator
- A public-rule exact solver that considers all 12 visible pieces
- A separate no-assumption deduction solver using constraint propagation, sliding-pattern support, complete-family elimination, and all-different matching
- Information-gain clue selection and five measured deduction profiles
- Local persistence, softly synthesized sound effects, and a compressed gently faded BGM playlist
- No backend and no runtime network dependency for game logic or art

The art direction, prompts, source generations, and manifest live under `art/`.
