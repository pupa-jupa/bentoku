import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const [input, output, rawSize] = process.argv.slice(2);
if (!input || !output) {
  throw new Error(
    'Usage: node scripts/convert-lossless-webp.mjs <input> <output> [square-canvas-size]',
  );
}

await mkdir(path.dirname(output), { recursive: true });
let image = sharp(input, { failOn: 'error' }).ensureAlpha();
if (rawSize) {
  const size = Number(rawSize);
  image = image.resize(size, size, {
    fit: 'contain',
    position: 'centre',
    background: { r: 0, g: 0, b: 0, alpha: 0 },
    kernel: sharp.kernel.lanczos3,
    withoutEnlargement: false,
  });
}

await image.webp({ lossless: true, effort: 6, smartSubsample: false }).toFile(output);
