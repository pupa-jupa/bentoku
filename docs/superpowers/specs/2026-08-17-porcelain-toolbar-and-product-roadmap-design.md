# Porcelain toolbar and product-completion roadmap

## Approved visual direction

The selected direction is **A: glazed porcelain**. The top toolbar should feel like a small
set of polished café ceramics that belongs with the pearl food shells and the pastel painted
table. It must remain calmer than the puzzle pieces and clues.

The generated imagery is decoration only. Labels, dynamic difficulty text, icons, hit areas,
localization, and button callbacks remain live Phaser objects so the interface stays readable
and functional in English and Russian.

## Raster button system

Create three new transparent PNG source assets:

1. `top_button_pill.png`: a blank warm-milk glazed porcelain pill with a raised cream rim,
   restrained pearl highlight, very thin mint inner piping, and a soft blush lower reflection.
2. `top_button_pill_active.png`: the matching pill in a muted strawberry-blush glaze with a
   pale cream rim and high enough contrast for light text. It represents the active Rush mode.
3. `top_button_round.png`: a blank circular porcelain button matching the normal pill, with a
   slightly stronger mint rim to separate icon controls from text controls.

All files must have real alpha transparency, no checkerboard, no white canvas, no text, no
symbols, no baked shadow rectangle, and no cropped edge. Artwork should be front-facing and
nearly symmetrical so it scales cleanly. Source files are stored under `art/user-assets/ui/`;
lossless runtime WebP files are built under `public/assets/ui/`.

The pill is rendered through a nine-slice object so the glazed end caps do not distort across
the 92, 110, and 126 pixel button widths. The round asset is scaled uniformly. Existing live
text remains centered over the images. Hover scales to 1.04, press briefly scales to 0.97, and
disabled tutorial actions do not animate or fire. The active Rush button uses the blush asset.

If an image is unavailable, the existing vector-like Graphics background remains a functional
fallback. The assets are preloaded through `AssetRegistry` with all other UI imagery.

## Settings wording

The settings title changes from `Cozy settings` / `Уютные настройки` to `Settings` /
`Настройки`. The body remains a neutral atmosphere description. Difficulty names and game
mode naming are unchanged.

## Product-completion direction

Bentoku should become a small complete premium-feeling browser puzzle, not an endless pile of
unconnected modes. The product loop is:

`enter café → choose an order → solve → receive a stamp/reward → see progress → choose next order`.

### 1. Café counter home screen

Add a real entrance screen instead of dropping every returning player directly into a board.
It has one dominant `Continue order` action, then `Order book`, `Daily order`, and `Rush`.
Settings and Help stay visible as porcelain icon buttons. First-time players go from the café
counter into the tutorial; returning players resume their exact board. This screen makes the
game understandable and provides a natural home for future systems.

### 2. Order Book campaign

Create five illustrated chapters with six fixed, solver-verified seeds each: Morning Picnic,
Garden Tea, Rainy Lunch, Moonlit Café, and Festival Table. Difficulty rises deliberately across
30 orders instead of relying only on random generation. Each page shows the customer, bento
silhouette, difficulty, and earned stamp. Completing an order unlocks the next; there are no
energy systems or artificial waits.

### 3. Customer stories with very light narrative

Give the four animal families small café personalities. A customer requests each chapter order
in one or two lines, reacts to completion, and appears on the result postcard. This supplies
warmth and purpose without turning a logic game into a dialogue-heavy visual novel. Story text
is localized and skippable after the first view.

### 4. Bento Album collection

The Album is the permanent progress screen: chapter stamps, discovered clue shapes, completed
animal-family portraits, Daily dates, and Rush records. Empty silhouettes show what remains to
discover. It replaces abstract counters with a visual reason to keep playing and gives the
finished game a clear completion percentage.

### 5. Cosmetic Pantry rewards

Award cosmetic sets at meaningful milestones: tray fabrics, bento rim colors, food-shell
variants, toolbar glaze colors, result-card borders, and music tracks. Cosmetics never change
logic or clue readability. Unlocks are tied to chapter completion, Daily stamps, and Rush
records; no shop or monetization is needed for the first release.

### 6. Daily stamp card without punitive streaks

Finishing the Daily order places a dated stamp on a seven-slot café card. Five stamps in any
seven-day window earn the weekly cosmetic, so missing one day does not erase progress. The
Daily uses the same seed for everyone and can generate a shareable result card without showing
the solution.

### 7. Completion postcard and meaningful score

Replace the current generic completion modal with a polished postcard that shows the customer,
order name, difficulty, moves, time when relevant, hints/reveal usage, and a flower rating.
Ratings compare the player only with the puzzle's known logical baseline, not with other people.
The postcard has `Next order`, `Back to café`, and `Share` actions; sharing copies a link and can
export a small spoiler-free image.

### 8. Rush records and weekly Master challenge

Keep Rush as the strict 1:45 Master mode with Reveal disabled. Add local records: best remaining
time, current win chain, and personal best postcard. A weekly Master seed provides one common
challenge, but remains asynchronous and needs no account or leaderboard. Retrying always keeps
the timer and never exposes the standard untimed version of that challenge.

### 9. Gentle achievements that teach mastery

Use a compact set of visible achievements rather than dozens of filler badges: first complete
family deduction, solve without Reveal, solve every difficulty, five Daily stamps, three Rush
wins, and all campaign stamps. Each achievement unlocks a cosmetic or album illustration, so
the reward is visible in the game.

### 10. Release-quality shell

Make the web game installable and dependable: responsive landscape scaling, a clear portrait
rotation card on phones, offline caching after the first load, a branded loading screen, exact
resume behavior, safe save migrations, reduced-motion support, touch hit areas, audio pause on
tab hide, and an unobtrusive reset-save action with confirmation. Keyboard gameplay is not a
product requirement; all primary interaction remains pointer/touch.

## Recommended release sequence

### Release 0.9 — cohesive core

- Porcelain toolbar and clean Settings wording.
- Café counter home screen and reliable Continue.
- New completion postcard.
- Basic Album statistics.
- Responsive/mobile and offline pass.

### Release 1.0 — complete product

- 30-order Order Book campaign.
- Chapter/customer art and light story lines.
- Album completion tracking and 8–12 cosmetic rewards.
- Seven-slot Daily stamp card.
- Rush personal records and a compact achievement set.
- Full English/Russian copy review, saved-game migration tests, and browser QA.

### Release 1.1+ — retention without bloat

- Weekly Master seed.
- Seasonal cosmetic chapter.
- Additional customer postcards and music.
- Only after real player feedback: optional anonymous analytics or cloud sync.

Accounts, competitive leaderboards, a backend, social feeds, currencies, and monetization are
deliberately excluded from the first complete release. They add operational work without first
improving the core puzzle experience.

## Current implementation scope

This change implements only the approved porcelain toolbar assets and removes `Cozy` /
`Уютные` from the Settings title. The product-completion ideas above are the ordered roadmap for
separate approved milestones, not hidden scope in the toolbar patch.

## Verification

- Validate each PNG has a real alpha channel and transparent corners.
- Build lossless WebP runtime copies and run the asset verifier.
- Run formatting, lint, unit tests, production build, and the full browser test suite.
- Capture the live 1600 × 900 game and inspect all six top buttons at their final sizes.
- Verify the active Rush button, all callbacks, tutorial Settings access, English defaults, and
  Russian Settings title.
- Deploy the verified build to the existing Bentoku Vercel project and open the stable URL.
