# Bentoku campaign-framework implementation plan

**Approved source:** `docs/superpowers/specs/2026-08-17-dunya-menu-campaign-design.md`  
**Visual invariant:** keep commit `9fc99e6` main-menu composition unchanged  
**Deployment rule:** local preview only; no Vercel action

## Task 1: stable campaign data

- Define five chapters and six fixed orders per chapter.
- Keep chapter difficulties Cozy, Gentle, Clever, Tricky, and Master.
- Make chapter 5 orders 1–5 untimed Master and order 6 the only 1:45 order.
- Verify all 30 seeds with the production generator, exact solver, and human deduction solver.

## Task 2: version 3 local save migration

- Migrate version 1 and version 2 saves into version 3 without losing settings, tutorial state,
  current compatible Infinite puzzle, solved count, or Rush statistics.
- Add completed campaign order IDs and current campaign order.
- Ignore corrupt or unknown campaign IDs individually.
- Keep all data local to the current browser.

## Task 3: campaign order book

- Replace the Campaign information shell with a focused `CampaignScene`.
- Present five chapters and six order seals with clear completed, available, and locked states.
- Unlock exactly one linear next order after a completion.
- Keep all chapter and guidance copy localized while leaving difficulty names untranslated.

## Task 4: gameplay context and policy

- Pass an explicit Infinite, Rush, or Campaign context into `PuzzleScene`.
- Load the fixed campaign seed and difficulty without changing the player's Infinite preference.
- Remove Reveal from campaign Help and reject it in `HintController` as a second guard.
- Hide Infinite-only Daily, Rush, and difficulty-changing actions during campaign orders.
- Preserve board resume per campaign order.

## Task 5: completion and final timer

- Completing a campaign order stamps it and unlocks the next order.
- Return from the celebration card to the campaign book.
- Start a countdown only for chapter 5 order 6 and keep its retry timed.
- Never offer a new random challenge or an untimed replay from the final-order timeout screen.

## Task 6: regression checks

- Add save-migration, progression, policy, data, and browser tests.
- Re-run formatting, lint, unit tests, production build, asset verification, desktop browser tests,
  and mobile-landscape browser tests.
- Leave the completed checkpoint at `http://localhost:64242/` and do not deploy.
