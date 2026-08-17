# Dunya visual library checkpoint 0 implementation plan

**Source design:** `docs/superpowers/specs/2026-08-17-dunya-menu-campaign-design.md`  
**Scope:** visual checkpoint only; no MenuScene implementation and no Vercel deployment

## Goal

Produce three representative, reviewable raster assets that lock the new menu direction before
generating the full character and UI packs:

1. empty 16:9 café menu background;
2. neutral transparent Dunya character;
3. one blank transparent menu-button base.

## Task 1: prepare project destinations and prompt records

- Add `art/user-assets/menu/` for menu environment sources.
- Add `art/user-assets/characters/` for Dunya and later visitor sources.
- Keep the button draft with the existing UI sources under `art/user-assets/ui/`.
- Save the exact prompts in `art/prompts/dunya-menu-visual-library.md` after generation.
- Use versioned `-v1` names so no approved existing asset can be overwritten.

## Task 2: generate the empty café menu background

- Use the user-provided Bentoku screenshot only as a palette, softness, and material reference.
- Generate a new environment rather than editing the existing puzzle screenshot.
- Request a wide 16:9 composition with a low-detail navigation zone on the left.
- Put the café counter, display case, and Dunya standing area in the center/right.
- Include onigiri, tamagoyaki, and animal-shaped sandwiches in the display.
- Exclude Dunya, visitors, radio, interface buttons, readable text, logos, and watermarks.
- Save the selected source as `art/user-assets/menu/main-menu-cafe-background-v1.png`.
- Normalize the approved crop to exactly 1600 × 900 without stretching.

## Task 3: generate neutral Dunya

- Generate an adult 22–25-year-old anime café owner in classic sweet Lolita fashion.
- Use the approved chestnut curled twin-tail hair, strawberry bow, cream blouse, pink jumper
  dress, lace apron, and heart/onigiri brooch.
- Use a calm front-facing three-quarter pose suitable for standing behind the generated counter.
- Keep both shoulders, hair silhouette, bodice, and resting hands readable.
- Request a genuinely transparent background and clean alpha edges.
- Exclude waving, maid-costume cues, Wa Lolita, Decora overload, childish proportions, text,
  logos, props, and watermarks.
- Save the selected source as `art/user-assets/characters/dunya-neutral-v1.png`.
- Normalize to a 1024 × 1536 transparent canvas without distorting the character.

## Task 4: generate one blank menu-button base

- Generate one wide blank porcelain/plaque button with real transparency.
- Match the Dunya/menu palette: milk ceramic, strawberry-pink lower glaze, lace relief, a small
  centered bow detail, restrained mint piping, and soft depth.
- Keep the center quiet enough for live English/Russian text.
- Use a front-facing symmetrical design that can later become a three-state family.
- Exclude all text, icons, solid canvas, checkerboard, watermarks, and cropped edges.
- Save the selected source as `art/user-assets/ui/menu-button-base-v1.png`.
- Normalize to a generous 768 × 256 transparent source canvas.

## Task 5: technical validation

- Inspect every generated image visually at full size.
- Confirm the background composition leaves sufficient left-side UI space.
- Confirm Dunya and the button have real alpha channels and transparent corners.
- Check for white or colored halos, accidental text, watermarks, extra limbs, costume drift,
  asymmetrical button edges, and crop damage.
- Record source dimensions and alpha statistics.
- Create a non-production composition preview with Dunya over the café background and the sample
  button in the left navigation zone.

## Task 6: local review gate

- Keep the current game available at `http://localhost:64242/`.
- Show the three individual images and the composition preview to the user.
- Do not preload or integrate the draft assets into the game yet.
- Do not generate the other four Dunya states, other button states, icons, campaign visitors, or
  campaign backgrounds until the three representative assets are approved.
- Do not update Vercel.

## Acceptance criteria

- The café clearly reads as Bentoku and classic sweet Lolita rather than generic anime café.
- The left navigation area can hold four large buttons without covering detailed artwork.
- Dunya reads as an adult café owner and matches the approved character description.
- Dunya can plausibly stand behind the counter at the intended scale.
- The button is detailed enough to feel generated and three-dimensional but does not compete
  with its live label.
- Transparent assets have genuine alpha, clean edges, and no pseudo-transparent background.
- All three drafts are saved in the project with versioned names.
- No runtime code, existing approved art, remote deployment, or Vercel project is changed.
