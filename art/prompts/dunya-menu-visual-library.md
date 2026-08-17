# Dunya menu visual-library prompts

## Reference roles

- User screenshot: style, palette, pastel softness, and material reference only.
- Generated café background: lighting and rendering reference for Dunya.

## Main-menu café background v1

```text
Use case: stylized-concept
Asset type: production 2D game main-menu environment background for Bentoku
Input images: Image 1 is a style, palette, softness, and material reference only; do not copy
its portrait layout, board, puzzle pieces, UI, text, or exact objects.
Primary request: create a completely new wide 16:9 interior of a kawaii Bentoku café in an
elegant classic sweet Lolita visual direction.
Scene/backdrop: a strawberry-pink and warm-cream café counter with pearl glaze, stitched fabric
panels, lace trim, bows, subtle heart details, pale mint accents, and a glass display case
containing neatly arranged rice onigiri, tamagoyaki egg rolls, and animal-shaped sandwiches.
Shelves, bento boxes, softly curtained windows, and restrained floral details behind the counter.
Style/medium: polished high-resolution hand-painted anime game environment, tactile 2.5D depth,
soft three-dimensional materials, premium cozy indie game, detailed but calm; match Image 1's
dreamy pastel softness and pearly lighting.
Composition/framing: wide straight-on 16:9 desktop game background. Reserve the entire left
35 percent as a deliberately calm low-detail navigation zone with gentle wall/panel texture and
no important props. Place the display case and empty standing area for a separate mascot
character in the center-right. Keep all important objects away from outer edges.
Lighting/mood: bright soft morning daylight, diffused glow, subtle pearlescent highlights,
welcoming and magical but readable.
Color palette: strawberry pink, warm milk, cherry accents, pale mint, honey gold, chocolate
brown; no neon.
Constraints: environment only; no people, no mascot, no animals except food-shaped items inside
the display, no radio, no buttons, no interface, no legible text, no logo, no watermark, no
checkerboard, no black border. The left navigation area must remain visibly empty and usable.
The image must feel like the same product family as Image 1 without copying its game-board
composition.
Avoid: maid café clichés, photorealism, generic modern coffee shop, clutter on the left, heavy
bloom, dark mood, fisheye perspective, readable labels, additional characters.
```

**Result:** selected and normalized to 1600 × 900 at
`art/user-assets/menu/main-menu-cafe-background-v1.png`.

## Neutral Dunya concept v1

```text
Use case: stylized-concept
Asset type: production 2D game mascot character cutout for Bentoku
Input images: Image 1 is the approved café environment and establishes the warm morning light,
pastel palette, soft hand-painted 2.5D finish, and material detail. Image 2 is an earlier Bentoku
style reference for dreamy pastel softness only. Generate a new character; do not copy any food
character or UI.
Primary request: Dunya, the adult 22–25-year-old owner and mascot of Bentoku café, in an elegant
classic sweet Lolita outfit.
Subject: warm brown eyes, friendly rounded adult face, chestnut hair with neat straight bangs and
two long softly curled ponytails, one large strawberry-pink head bow. Cream high-collar blouse
with puff sleeves and lace cuffs; strawberry-pink bell-shaped jumper dress with refined ruffles,
bows, tiny restrained strawberry-and-heart print; pale lace café apron; small Bentoku cameo
brooch shaped like a heart/onigiri. Calm attentive neutral expression. Adult body proportions
and mature, capable café-owner presence.
Style/medium: polished high-resolution hand-painted anime game character, soft three-dimensional
fabric folds, pearlescent highlights, clean readable silhouette, premium cozy indie game,
matching Image 1's lighting and finish.
Composition/framing: vertical 2:3 transparent character asset, centered, from full head and bow
through just below the knees, generous clear padding on all sides. Front-facing with a gentle
three-quarter turn. Both arms lowered and hands resting calmly together near the apron at waist
level. Designed to be placed behind the café display counter.
Lighting/mood: warm diffuse morning light from upper left, soft contact shading contained on the
character, cheerful and welcoming.
Color palette: strawberry pink, warm milk, cherry accents, pale mint details, honey gold,
chocolate brown.
Background: genuinely transparent alpha background, completely empty around the character.
Constraints: one character only; preserve complete hair and bow silhouette; five fingers where
visible; no environment, no counter, no floor, no props, no text, no logo, no watermark, no
checkerboard, no colored or white matte, no halo, no cropped hair or dress. She must clearly read
as an adult woman.
Avoid: waving, raised arms, maid costume, maid headband, Wa Lolita, Decora overload, school
uniform, child or teen proportions, chibi body, huge eyes, sexualized pose, photorealism, 3D doll
render, extra accessories, extra limbs, busy background.
```

The built-in transparent request and a background-extraction retry both returned RGB-only files
with a baked checkerboard. The accepted local fallback used this identity-preserving edit:

```text
Use case: precise-object-edit
Asset type: production game-character cutout prepared for local chroma-key extraction
Input images: Image 1 is the exact Dunya character edit target.
Primary request: replace only the baked gray-and-white checkerboard background with one
perfectly flat, uniform, fully opaque pure electric blue background RGB #0000FF.
Constraints: change only the background. Preserve Dunya's exact identity, adult facial features,
expression, chestnut hair, pink bow, complete hairstyle silhouette, classic sweet Lolita dress,
strawberry embroidery, lace, hands, legs, shoes, pose, proportions, lighting, colors, framing,
and canvas size. Do not redraw, crop, move, recolor, simplify, or restyle the character. The blue
background must be a single solid #0000FF color from edge to edge with no gradient, texture,
grid, pattern, shadow, floor, halo, vignette, or color variation. One character only; no text,
no watermark, no extra objects.
```

`scripts/extract-blue-chroma.mjs` converted the blue background to alpha and borrowed RGB values
for partially transparent edge pixels from the nearest opaque character pixel. This prevents
blue spill around hair and lace.

**Result:** production review asset at `art/user-assets/characters/dunya-neutral-v1.png`,
1024 × 1536 RGBA with real transparent and partially transparent pixels. The rejected
checkerboard concept remains only under `output/imagegen/` for comparison.

## Blank menu-button base v1

```text
Use case: stylized-concept
Asset type: production raster game UI button base prepared for local chroma-key extraction
Input images: Image 1 is the approved Bentoku café background and establishes the warm morning
light, classic sweet Lolita palette, pearl glaze, lace, and material finish. Image 2 is Dunya and
establishes the exact strawberry-pink, cream, and chocolate palette. Do not include the character
or environment in the output.
Primary request: one wide blank classic sweet Lolita café menu button, front-facing, centered,
polished, three-dimensional, and nearly symmetrical.
Subject/materials: a warm milk-porcelain central plaque with a strawberry-pink lower glaze,
raised cream rim, delicate cream lace relief along the outer top and bottom edges, restrained
pale-mint inner piping, tiny pearl highlights, subtle honey-gold hardware, and one small
strawberry-pink bow ornament centered above the rim. The broad center must remain calm and empty
for live English or Russian text.
Style/medium: high-resolution hand-painted 2.5D game UI asset, tactile porcelain and fabric-lace
details, premium cozy indie game, matching the references.
Composition/framing: horizontal 3:1 object, straight-on orthographic/front view, generous even
padding around every edge, no perspective tilt, no cropped lace, rim, or bow.
Lighting/mood: warm diffuse upper-left café light, soft contained object shadow only, no
rectangular shadow plate.
Background: perfectly flat, uniform, fully opaque pure electric blue RGB #0000FF from edge to
edge.
Constraints: exactly one blank button base; no text, no letters, no numbers, no icon, no logo,
no watermark, no checkerboard, no gradient or texture in the blue background, no extra objects,
no solid panel behind the button, no asymmetry. Keep the central label area quiet and high
contrast.
Avoid: generic mobile-game pill, flat vector art, dark outline, neon, excessive ornament in the
center, metallic sci-fi UI, photorealism, environment scene, character.
```

**Result:** production review asset at `art/user-assets/ui/menu-button-base-v1.png`, 768 × 256
RGBA with real transparency. Text and icons remain live game objects and are not baked into the
asset.

## Composition preview

`scripts/create-menu-concept-preview.mjs` creates the non-production review image at
`output/imagegen/main-menu-composition-v1.png`. It layers Dunya behind the display foreground and
uses four copies of the blank button with separately rendered English labels. It does not alter
runtime code or preload the new assets.
