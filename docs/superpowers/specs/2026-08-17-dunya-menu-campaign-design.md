# Bentoku: Dunya café menu, campaign, and album design

**Status:** approved direction, awaiting written-spec review before implementation  
**Date:** 2026-08-17  
**Supersedes:** the generic café/customer proposals in
`2026-08-17-porcelain-toolbar-and-product-roadmap-design.md`

## Mandatory development and deployment rule

- All work is previewed locally during development.
- Vercel must not be updated during intermediate stages.
- Vercel may be updated only after the complete agreed scope is finished and the user gives a
  separate, explicit deployment permission.
- A request to continue work, approve artwork, commit, or push code is not deployment permission.

## Product goal

Bentoku becomes a small, complete café puzzle game with a clear loop:

`main menu → choose a mode or campaign order → solve a bento → receive progress → choose again`.

The new product shell adds Dunya, a story campaign, an album with achievements, and selectable
visual rewards without changing the deduction rules of the existing puzzle.

## Approved scope

1. A new main menu shown whenever the game is launched.
2. Dunya, the adult owner and mascot of the café, in classic sweet Lolita fashion.
3. Four main-menu actions in this order: Campaign, Infinite, Achievements, Settings.
4. A five-chapter campaign with six fixed orders per chapter.
5. One human visitor at the beginning of each chapter and order slips for the remaining orders.
6. A Bentoku Album that combines campaign progress, achievements, visitors, and appearance.
7. Cosmetic rewards that change the real puzzle background or the complete piece set.
8. English as the default language and Russian as a selectable language.
9. Local saves only. No accounts, backend, cloud sync, leaderboard, currency, or shop.

## Explicit non-goals

- No radio in the café.
- No arm-waving animation for Dunya.
- No animal customers; campaign visitors are people.
- No campaign weather or day background replacing the puzzle background.
- No Reveal in any campaign order.
- No second untimed version of the final timed campaign order.
- No separate decorative trinkets as cosmetic rewards.
- No baked text inside generated menu buttons, dialogue frames, or backgrounds.

## Main menu composition

The menu uses the same 1600 × 900 logical canvas as the current game.

### Layout

- The left side is a quiet, readable navigation zone.
- Four large buttons are stacked vertically in the exact order Campaign, Infinite,
  Achievements, Settings.
- The center and right contain the café counter, display case, and Dunya.
- The display case contains rice onigiri, tamagoyaki rolls, and animal-shaped sandwiches.
- The background includes shelves, bento packaging, lace curtains, bows, a branded café sign,
  and soft daylight.
- The left navigation area must remain free of detailed props and high-contrast highlights.
- The display case and Dunya must not be cropped at the 16:9 desktop size or mobile landscape
  size.

### Interaction

- The buttons use generated raster bases with live Phaser text and live hit areas.
- Hover uses a gentle highlight/scale response; press uses a short inward scale response.
- Locked campaign content uses a disabled visual state and cannot receive pointer events.
- Settings remains available from the menu and during the tutorial.
- The main menu appears even on a first visit. The tutorial choice appears only when the player
  first attempts to enter a playable puzzle from Campaign or Infinite.
- After the tutorial, the player returns to the mode that originally requested it.

## Dunya character bible

Dunya is an adult woman, approximately 22–25 years old. Her presentation is warm, competent,
and cheerful rather than childlike.

### Appearance

- Chestnut hair with straight bangs and two long curled ponytails.
- A large strawberry-pink head bow.
- Warm brown eyes, expressive eyelashes, and a friendly rounded face.
- A cream high-collar blouse with puff sleeves and lace cuffs.
- A strawberry-pink bell-shaped jumper dress with ruffles, bows, and a restrained strawberry
  and heart print.
- A pale lace café apron.
- A Bentoku cameo brooch shaped like a heart/onigiri.
- Her hands rest calmly on or below the counter. No waving pose is generated.

### Palette and rendering

- Strawberry pink, warm milk, cherry accents, a small amount of mint, honey gold, and chocolate
  brown.
- Polished anime illustration with soft three-dimensional fabric folds, controlled highlights,
  and clean readable edges.
- Classic sweet Lolita influence, not Wa Lolita, Decora, maid costume, or historical realism.
- The design remains identical across all generated states.

### Five-state animation set

1. Neutral attentive state.
2. Short blink state.
3. Speaking state with a small mouth and eye change.
4. Delighted state for positive selections and rewards.
5. Focused/concerned state for locked or difficult campaign content.

All five images use the same transparent canvas, camera, crop, body position, costume, hair,
lighting, and counter overlap. Code supplies subtle 1–2 px breathing, crossfades, and timed state
changes. There is no frame-by-frame arm animation.

## Core menu artwork package

The first art checkpoint creates only a minimal representative set:

1. One 1600 × 900 empty café menu background without Dunya or live labels.
2. One neutral transparent Dunya image on a 1024 × 1536 canvas.
3. One blank menu-button base with real alpha transparency.

After those three images are approved, the package expands to:

- four additional Dunya states;
- normal, hover, and pressed blank button bases;
- four transparent icons: order book, infinity, achievement ribbon, and settings gear.

All transparent assets must contain a real alpha channel, clean edges, no checkerboard, no
solid canvas, no watermark, and no baked shadow rectangle. Runtime copies are lossless WebP;
editable source images remain under `art/user-assets/`.

## Campaign structure

The campaign is an illustrated order book with five chapters and six solver-verified fixed
orders per chapter, for 30 orders total.

| Chapter | Russian title        | Difficulty | Visitor                  | Narrative setting                |
| ------- | -------------------- | ---------- | ------------------------ | -------------------------------- |
| 1       | Утренние банты       | Cozy       | Anya, florist assistant  | Bright opening morning           |
| 2       | Клубничный сад       | Gentle     | Lev, pastry courier      | Sunny strawberry delivery        |
| 3       | Дождливый полдень    | Clever     | Mina, illustrator        | Rain against the café window     |
| 4       | Кружевная репетиция  | Tricky     | Margot, costume designer | Warm evening with fabric samples |
| 5       | Фестивальная витрина | Master     | Aoi, festival organizer  | Festival opening preparations    |

### Chapter progression

- Only chapter 1/order 1 is initially available.
- Completing an order unlocks the next order.
- Completing order 6 unlocks the next chapter.
- Order 1 begins with the chapter visitor and a short dialogue.
- Orders 2–6 are delivered as order slips without additional visitors.
- A previously seen chapter scene can be skipped as a whole on replay.
- All 30 seeds are fixed in campaign data and verified by the existing solver before release.

### Difficulty and timer rules

- Chapter 1 contains six Cozy orders.
- Chapter 2 contains six Gentle orders.
- Chapter 3 contains six Clever orders.
- Chapter 4 contains six Tricky orders.
- Chapter 5 orders 1–5 are untimed Master orders.
- Chapter 5 order 6 is the only timed campaign order and uses exactly 1 minute 45 seconds.
- The timed final order cannot be replayed without its timer.

### Reveal policy

- Reveal is absent from campaign Help UI.
- The campaign play context sets `allowReveal: false`.
- The gameplay controller independently rejects Reveal calls in campaign mode.
- Campaign save data never records a revealed cell.
- Tests verify both the missing UI action and the controller-level prohibition.

## Story and visitors

The story follows Dunya as she prepares the family café for a city sweets festival and fills an
old order book with her own completed orders.

### Chapter 1: Anya

Anya is a young adult florist assistant with a honey-blonde braid, a mint coat, and a small
daisy pin. Before her first independent shift she asks for a calm breakfast bento.

Sample intent: “I tied every bouquet too tightly. Could you make a bento that helps the morning
feel calmer?”

### Chapter 2: Lev

Lev is a cheerful young pastry courier with short auburn hair, a cream delivery jacket, and a
strawberry crate. He orders food for a picnic with his younger sisters.

### Chapter 3: Mina

Mina is an illustrator with a black bob, a navy raincoat, a transparent umbrella, and a small
ink mark on one finger. She is drawing a new café sign but cannot settle its composition.

### Chapter 4: Margot

Margot is an adult costume designer with plum-brown curls, a dark classic Lolita-inspired coat,
and a portfolio of lace samples. She helps Dunya finish her festival outfit.

### Chapter 5: Aoi

Aoi is a composed festival organizer with an indigo ponytail, a berry-red coat, and a clipboard.
Her first request begins the final Master chapter. The following five slips form the festival
queue, ending in the single 1:45 order.

### Narrative camera and backgrounds

- Campaign dialogue is shown from Dunya’s point of view behind the counter.
- The visitor stands in front of the counter.
- Dunya is not shown as a second full character in the center of these scenes.
- Five narrative backgrounds represent the five times/weather conditions.
- These backgrounds are used only before/after story orders and never replace the puzzle scene.
- Each visitor has three transparent states: neutral, speaking, and pleased.

## Album and achievements

The Achievements main-menu button opens the Bentoku Album. Achievements are not a separate
screen.

### Album sections

- Campaign chapters and order stamps.
- Visitor portraits and viewed stories.
- Eight achievement stamps.
- Appearance selection.
- Local Rush statistics.

### Achievement set

1. Complete the first campaign order.
2. Complete the first chapter.
3. Solve all five Infinite difficulty levels.
4. Solve an Infinite Master puzzle without using Reveal.
5. Complete an order without Undo.
6. Win three Rush attempts.
7. Complete the full campaign.
8. Complete the final 1:45 festival order.

## Cosmetic rewards

The first complete release contains:

- one selectable alternate puzzle background;
- one complete alternate skin covering all 12 animal/food pieces;
- the standard background and standard pieces as permanent choices.

Cosmetics do not create separate café trinkets. The alternate piece set preserves the exact
dimensions, centers, hit areas, tray alignment, and bento alignment of the standard set. A
campaign narrative background is never automatically selected as a puzzle background.

## Daily without a backend

Daily remains optional and stays inside Infinite/Album rather than becoming a fifth main-menu
button. A deterministic date seed can work locally without a backend, but progress belongs to
one browser/device and the system clock can be changed. Daily is not required for the first
campaign release and may be deferred without blocking the approved core.

## Localization

- English is the default language.
- Russian is selected in Settings.
- Main-menu navigation, campaign text, Album, Settings, Help, and tutorial copy use translation
  keys and follow the selected language.
- Difficulty names Cozy, Gentle, Clever, Tricky, and Master remain untranslated in both
  languages.
- Decorative English text that is part of the existing painted gameplay composition remains
  unchanged.
- Generated imagery contains no language-dependent text.
- User-visible internal option values are localized; stable save identifiers remain
  language-independent so changing language cannot corrupt progress.

## Scene and service architecture

The current BootScene and PreloadScene remain. The new shell adds focused scenes instead of
putting every responsibility into PuzzleScene.

- `MenuScene`: main menu, Dunya state machine, and four navigation actions.
- `CampaignScene`: chapter/order book, locks, stamps, and continue behavior.
- `StoryScene`: chapter cards, visitor dialogue, and transition into an order.
- `AlbumScene`: progress, achievements, visitor collection, and appearance selection.
- `PuzzleScene`: existing puzzle interaction driven by a supplied play context.

The play context has stable behavior rather than scattered mode checks:

```ts
interface PlayContext {
  source: 'infinite' | 'campaign' | 'rush';
  campaignOrderId?: string;
  timed: boolean;
  durationMs?: number;
  allowReveal: boolean;
  returnTarget: 'menu' | 'campaign';
}
```

Campaign definitions are data, not hard-coded scene branches:

```ts
interface CampaignOrder {
  id: string;
  seed: string;
  difficulty: Difficulty;
  timed: boolean;
  durationMs?: number;
}
```

## Save migration and recovery

Save schema version 3 adds campaign, album, achievement, and appearance data. Loading a version
2 save preserves existing settings, tutorial completion, solved count, Rush statistics, and
current compatible puzzle state.

Recovery rules:

- Unknown campaign order IDs fall back to the latest valid unlocked order.
- Missing cosmetic assets fall back to the standard appearance without deleting the unlock.
- Corrupt achievement entries are ignored individually rather than discarding the whole save.
- A selected language never changes stable campaign, achievement, or cosmetic IDs.
- Resume returns to the exact unfinished Infinite or campaign board when compatible.

## Implementation checkpoints

### Checkpoint 0: visual library

- Generate and review neutral Dunya, the empty menu background, and one button base.
- Do not generate the remaining variants until these three are approved.

### Checkpoint 1: shell and saves

- Add play context, version 3 migration, and focused scene boundaries.
- Add the functional menu with approved artwork.

### Checkpoint 2: campaign framework

- Add chapter/order data, progression, resume, Reveal policy, and the single timed finale.

### Checkpoint 3: story content

- Add five backgrounds, five visitors, dialogue, localization, and skip-on-replay behavior.

### Checkpoint 4: album and cosmetics

- Add achievements, progress presentation, one background reward, and one 12-piece skin.

### Checkpoint 5: completion and local release candidate

- Run all automated and visual checks.
- Provide the finished build on the local URL for user review.
- Do not deploy to Vercel until the user explicitly approves the completed local result and
  separately authorizes deployment.

## Acceptance checks

- The menu always opens first and exposes exactly four primary actions.
- Dunya’s five states do not jump, resize, or change identity/costume.
- First puzzle entry offers tutorial or skip; Settings works during the tutorial.
- All 30 campaign seeds are valid and solver-verified.
- Reveal is unavailable throughout the campaign at both UI and controller layers.
- Exactly one campaign order is timed: chapter 5/order 6 at 1:45.
- Replaying the final order never removes its timer.
- Narrative weather/time never changes the puzzle background.
- All five visitors are human and appear only in the first order narrative of their chapter.
- English is default; Russian can be selected; difficulty names remain unchanged.
- Old version 2 saves migrate without losing current statistics and preferences.
- All generated cutouts contain real alpha and all puzzle-piece cosmetics stay aligned.
- Desktop 16:9 and mobile landscape layouts remain usable.
- Reduced motion, audio settings, tab pause, and existing tutorial recovery continue to work.
- Formatting, lint, unit tests, production build, asset verification, and browser tests pass.
- The completed candidate is reviewed locally before any Vercel action.
