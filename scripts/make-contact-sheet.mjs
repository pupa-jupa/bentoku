import { readdir } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const [inputDir = 'public/assets/pieces', output = 'art/generations/piece-contact-sheet.png'] =
  process.argv.slice(2);
const files = (await readdir(inputDir))
  .filter((file) => /\.(png|jpe?g|webp)$/i.test(file))
  .sort((a, b) => a.localeCompare(b));
const cell = 300;
const columns = 4;
const rows = Math.ceil(files.length / columns);
const composites = await Promise.all(
  files.map(async (file, index) => ({
    input: await sharp(path.join(inputDir, file))
      .resize(244, 244, { fit: 'inside' })
      .png()
      .toBuffer(),
    left: (index % columns) * cell + 28,
    top: Math.floor(index / columns) * cell + 18,
  })),
);

await sharp({
  create: {
    width: columns * cell,
    height: rows * cell,
    channels: 4,
    background: { r: 248, g: 237, b: 219, alpha: 1 },
  },
})
  .composite(composites)
  .png()
  .toFile(output);
