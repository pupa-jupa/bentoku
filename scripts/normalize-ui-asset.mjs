import sharp from 'sharp';

const [input, output, rawWidth, rawHeight, rawFillX = '0.94', rawFillY = '0.82'] =
  process.argv.slice(2);
if (!input || !output || !rawWidth || !rawHeight) {
  throw new Error(
    'Usage: node scripts/normalize-ui-asset.mjs <input> <output> <width> <height> [fill-x] [fill-y]',
  );
}

const width = Number(rawWidth);
const height = Number(rawHeight);
const innerWidth = Math.round(width * Number(rawFillX));
const innerHeight = Math.round(height * Number(rawFillY));
const left = Math.floor((width - innerWidth) / 2);
const right = width - innerWidth - left;
const top = Math.floor((height - innerHeight) / 2);
const bottom = height - innerHeight - top;

await sharp(input)
  .ensureAlpha()
  .trim({ background: { r: 0, g: 0, b: 0, alpha: 0 }, threshold: 8 })
  .resize(innerWidth, innerHeight, { fit: 'fill', kernel: sharp.kernel.lanczos3 })
  .extend({
    top,
    bottom,
    left,
    right,
    background: { r: 0, g: 0, b: 0, alpha: 0 },
  })
  .png({ compressionLevel: 9, adaptiveFiltering: true })
  .toFile(output);

const metadata = await sharp(output).metadata();
if (!metadata.hasAlpha || metadata.width !== width || metadata.height !== height) {
  throw new Error(`Normalization failed for ${output}`);
}
