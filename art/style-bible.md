# Bentoku visual style bible

## North star

Bentoku should feel like a tiny Japanese café counter made from warm wood, soft stationery, and handmade food toys. It is cozy and tactile, never glossy mobile-game UI, anime character art, or a corporate dashboard.

## Palette

| Role        | Color     |
| ----------- | --------- |
| Warm cream  | `#F8EDDB` |
| Milk white  | `#FFFBF2` |
| Soft peach  | `#F3C7AA` |
| Blush pink  | `#E8A7A1` |
| Dusty coral | `#D97F79` |
| Pale mint   | `#CFE1CC` |
| Sage        | `#9EB79A` |
| Honey       | `#E0B66E` |
| Caramel     | `#B8794F` |
| Warm walnut | `#65463D` |
| Ink brown   | `#513A35` |

No pure red, neon cyan, hard black blocks, or cold gray surfaces.

## Camera and light

- Gentle three-quarter top-down view, around 25–30° above the tabletop.
- Warm diffuse studio daylight from upper left.
- Very soft contact shadow, short and slightly down-right.
- Low contrast, softly rolled highlights, no plastic gacha gloss.

## Food characters

- A food object first, an animal second.
- Compact, rounded, slightly chubby handmade proportions.
- Eyes are two tiny dark-brown seeds; mouths are a single restrained mark.
- Cheeks are small dusty-pink dots at low saturation.
- Cat: triangular ears, tiny whiskers, `:3` mouth.
- Bear: round ears and a small round muzzle.
- Pig: short floppy ears and a clear round snout with two nostrils.
- Bunny: long upright ears and a slightly taller silhouette.
- Egg: creamy white with pale yolk yellow, smooth and softly matte.
- Rice: visible but restrained off-white grains, matte and plush-like.
- Sandwich: fluffy bread, toasted edge, one pastel filling seam.

## Asset contract

- Production piece source: one isolated object per image, centered, generous padding.
- Same scale, camera, face proportions, and light direction across all twelve pieces.
- Strong silhouette at 64–80 px; master processed to 512 px PNG with alpha.
- No bows, clothing, props, frames, text, plates, chopsticks, or extra food.
- No photorealism, Pixar-like exaggeration, anime eyes, outlines thicker than the facial marks, or high-frequency texture noise.

## Materials and UI

- Bento frame: pale maple/bamboo with restrained grain and rounded corners.
- Slots: warm walnut with dusty coral rims.
- Inventory: padded peach fabric/ceramic tray.
- Clues: pale mint fibrous order paper with hand-drawn brown ink.
- Layout geometry, borders, selection, focus, and sparkles are crisp Phaser graphics; bitmap art supplies the tactile character and surface language.

## Motion

- Hover grows by about 3–4%.
- Drag lift grows by about 6–7% and deepens the shadow.
- Drop settles with one 140–200 ms squish.
- Idle motion is rare and under 3°.
- Success uses small sequential bounces and a handful of sparkles—never a full-screen blast.
