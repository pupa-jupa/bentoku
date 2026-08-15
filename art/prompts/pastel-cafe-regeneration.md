# Bentoku pastel café regeneration prompts

This prompt pack redesigns the existing bitmap assets without changing their gameplay geometry. Generate every asset from its current source image plus the approved style reference. Keep filenames and final canvas sizes exactly as listed. Work in a versioned staging directory first; never overwrite production sources before an in-game review.

## Shared art direction

Append this block to every generation:

> Redesign the attached Bentoku asset in a dreamy pastel kawaii stationery-and-plush café style matching the provided reference image. Soft powder pink, warm ivory, baby blue, pale mint and lilac; pearly highlights; subtle quilted fabric, scalloped lace, embroidered trim and tiny flower details. Rounded toy-like forms, gentle diffuse light, delicate ambient occlusion and a very soft lower-right contact shadow. Polished premium 2D casual-game illustration with tactile clay, felt, mochi and paper materials. Preserve the current asset's exact purpose, silhouette footprint, viewing angle, focal position, padding and readable contrast at small size. No text, letters, numbers, watermark, logo, extra characters, extra objects, hard black outline, neon color, photorealism, glossy plastic, complex background or cropped edges.

For isolated objects add:

> One centered object only on a truly transparent background. Preserve generous transparent padding and a clean alpha edge. Do not draw a white or checkerboard background. Keep the object within the same approximate bounding box as the source.

For the environment plate add:

> Preserve the exact 16:9 composition and functional empty zones: inventory tray on the left, empty 3×3 bento board in the center, blank order-note area on the right, and free header/footer bands. Do not add any labels, food pieces, clue symbols or controls.

## Character consistency sheet

- Cat: rounded triangular ears, tiny brown seed eyes, small `ω` mouth, two short whiskers per cheek.
- Bear: small round ears, cream muzzle, tiny brown seed eyes, restrained smile.
- Pig: floppy rounded ears, pink oval snout with two tiny nostrils.
- Bunny: long upright ears with blush inner panels, slightly taller silhouette.
- Egg family: pale custard-yellow omelette/mochi body, smooth matte surface.
- Rice family: warm ivory rice grains simplified into a soft plush cluster; no wet gloss.
- Sandwich family: milk-bread body, pale golden crust, one thin pink-and-mint filling seam.
- Every family member uses the same eye size, cheek placement, light direction, camera and overall scale.

## Environment generations

### `gameplay_plate.png` — 1672×941, opaque

> Restyle the attached complete gameplay plate. Keep every major rectangle and usable space in exactly the same location and proportion. Left: a powder-pink quilted fabric tray with twelve soft recessed pockets, rounded piping, stitched seams and a few restrained pearly sparkles. Center: an empty square 3×3 bento box made from warm ivory lacquer with pale mint dividers, softly inset compartments and a blush shadow rim. Right: a large pale-mint order-note pad on a slightly darker backing card, scalloped lower paper edge, small heart-shaped clip, tiny sakura-and-pearl decoration near one corner. Background: dreamy baby-blue sky fabric with soft white clouds, blush/lilac haze and very subtle paper grain; small floral arrangement only in a noninteractive lower corner; a short lilac ribbon with white lace only in a noninteractive upper corner. Maintain strong separation between the three play zones and enough quiet contrast for overlaid UI and clue glyphs. No characters, no icons, no writing.

### `background_surface.png` — 1254×1254, opaque tile source

> Seamless dreamy baby-blue sky-fabric surface with soft white cloud shapes, blush and lilac atmospheric patches, extremely subtle pearly specks and paper-fiber grain. Low contrast so UI remains readable. No focal object, horizon, text, border or directional vignette. Edges must tile cleanly.

### `inventory_fabric.png` — 1254×1254, opaque tile source

> Seamless powder-pink quilted satin-felt texture with very soft diamond stitching, tiny embroidered dots and faint pearly sheen. Plush but not furry, tactile but low-frequency, no individual pocket, flower, lace strip, border or shadow. Edges tile cleanly.

### `maple_wood.png` — 1254×1254, opaque tile source

> Seamless warm ivory lacquered wood texture for a cute bento box, with extremely restrained pale honey grain, softly matte finish and no knots. Shift the old orange wood toward creamy biscuit and blush warmth. No borders, dividers, objects or hard highlights. Edges tile cleanly.

### `clue_paper.png` — 1254×1254, opaque tile source

> Seamless pale-mint handmade stationery texture, softly fibrous with faint deckled-paper variation and tiny pearly flecks. Keep the center calm and clean enough for dark-brown clue glyphs. No writing, lines, grid, flower, clip, fold, border or shadow. Edges tile cleanly.

## Piece state treatment — do not regenerate

The twelve existing 1254×1254 RGBA sources already have the approved characters and genuine transparency. Keep them untouched and create the two visual states in the game:

- Tray state: render the original texture plus a low-opacity pearl-pink duplicate in Screen blend mode, one restrained upper-left glaze reflection and a small four-point glint. The original face, color separation, silhouette and alpha remain unchanged.
- Bento state: retain the same glazed piece and reveal the separate generated raster asset `piece_shell.png` behind it. The shell uses a lilac-and-blush folded scalloped edge, warm-ivory center, white pearlescent rim, inner mint line and tiny pearl beads. It must fit inside one board cell and never obscure the face.
- State changes follow placement, swap, undo, restart and return-to-tray automatically. The character remains its original transparent bitmap; only the generated shell is layered underneath.

## Clue glyph generations — transparent RGBA, preserve each source canvas

All glyphs must be flat, instantly recognizable at 22–36 px and visually related to the soft character assets without becoming miniature renders. Use a warm cocoa-brown 4–6 px equivalent outline, softly filled pastel color, one tiny highlight at most, no shadow extending far beyond the glyph, no background and no extra decoration.

- `cat.jpg` — 290×242: “Front-facing rounded cat-head symbol with triangular ears, tiny seed eyes, `ω` mouth and two whiskers per cheek; soft custard/apricot fill and cocoa outline. Preserve the source silhouette and padding.”
- `bear.jpg` — 269×247: “Front-facing round bear-head symbol with two round ears and a small cream muzzle; honey-beige fill and cocoa outline. Preserve padding.”
- `pig.jpg` — 288×234: “Front-facing pig-head symbol with floppy ears and a clear dusty-pink oval snout with two nostrils; blush fill and cocoa outline.”
- `bunny.jpg` — 242×295: “Front-facing bunny-head symbol with long upright ears and blush inner ears; warm ivory fill and cocoa outline.”
- `egg.jpg` — 277×210: “Small rounded tamagoyaki/omelette symbol, custard yellow with two subtle folded layers and cocoa outline; clearly an egg food, not a chick.”
- `rice.jpg` — 246×221: “Compact triangular onigiri/rice mound symbol in warm ivory, a few sparse grain marks and cocoa outline; no seaweed because the piece family has none.”
- `sandwich.jpg` — 250×229: “Triangular milk-bread sandwich symbol, pale golden crust with one thin pink-and-mint filling seam and cocoa outline; no plate or garnish.”

## UI decoration generations — transparent RGBA

- `success_stamp.png` — 256×256: “Pastel strawberry-pink scalloped rubber-stamp seal with a centered ivory heart and tiny mint leaves, soft imperfect ink edge, celebratory but readable. No letters or words.”
- `sakura_seal.png` — 192×192: “Small five-petal sakura wax/paper seal in blush pink with pearly center, slight embossed depth and clean circular footprint. No text.”
- `paper_tape.png` — 256×256: “Short strip of semi-translucent lilac washi tape with tiny cream stars and scalloped white lace along one edge, isolated, straight enough to use as a UI accent.”
- `tiny_flower.png` — 256×256: “One tiny layered sakura/cosmos flower, powder pink petals, warm ivory inner ring and pearl-yellow center, soft felt-paper texture, front view.”
- `tiny_leaf.png` — 256×256: “One small two-leaf sprig in pale mint and sage, delicate embroidered-paper texture, gentle diagonal silhouette.”
- `tiny_sparkle.png` — 320×320: “A sparse cluster of three pearly four-point sparkles in ivory, pale lilac and blush, soft bloom but crisp transparent edges; no stars outside the central cluster.”

## Export and acceptance checks

1. Generate at the highest supported square or landscape size, then crop/resize with Lanczos to the exact dimensions above.
2. For isolated assets, remove any generated background and retain straight/unassociated alpha where possible.
3. Match the source object's occupied bounding-box center and approximate fill ratio; never scale a character family inconsistently.
4. Inspect at native size and at 64 px. Reject merged ears, extra limbs, malformed faces, illegible glyphs, halos and opaque corners.
5. Build lossless WebP runtime copies and run `pnpm assets:verify` before replacing production assets.
6. Review one environment plate, one complete animal family and its glyph in the live game before batch-generating the remaining families.
