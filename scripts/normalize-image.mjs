import sharp from 'sharp';

const [input, output, rawSize = '512', rawFill = '0.86'] = process.argv.slice(2);
if (!input || !output) {
  throw new Error('Usage: node scripts/normalize-image.mjs <input> <output> [canvas-size] [fill]');
}

const size = Number(rawSize);
const fill = Number(rawFill);
const inner = Math.round(size * fill);
const image = sharp(input)
  .ensureAlpha()
  .trim({ background: { r: 0, g: 0, b: 0, alpha: 0 } });
const metadata = await image.metadata();
const width = metadata.width ?? inner;
const height = metadata.height ?? inner;
const scale = Math.min(inner / width, inner / height, 1);
const resizedWidth = Math.max(1, Math.round(width * scale));
const resizedHeight = Math.max(1, Math.round(height * scale));
const left = Math.floor((size - resizedWidth) / 2);
const right = size - resizedWidth - left;
const top = Math.floor((size - resizedHeight) / 2);
const bottom = size - resizedHeight - top;

await image
  .resize(resizedWidth, resizedHeight, { kernel: sharp.kernel.lanczos3 })
  .extend({
    top,
    bottom,
    left,
    right,
    background: { r: 0, g: 0, b: 0, alpha: 0 },
  })
  .png({ compressionLevel: 9, adaptiveFiltering: true })
  .toFile(output);

const finalMeta = await sharp(output).metadata();
if (!finalMeta.hasAlpha || finalMeta.width !== size || finalMeta.height !== size) {
  throw new Error(`Normalization failed for ${output}`);
}
