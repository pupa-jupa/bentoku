import sharp from 'sharp';

const [inputPath, outputPath] = process.argv.slice(2);

if (!inputPath || !outputPath) {
  throw new Error('Usage: node scripts/normalize-menu-button.mjs <input> <output>');
}

const contentWidth = 550;
const contentHeight = 220;
const canvasWidth = 768;
const canvasHeight = 256;

const normalized = await sharp(inputPath)
  .trim({ background: { r: 0, g: 0, b: 0, alpha: 0 } })
  .resize(contentWidth, contentHeight, { fit: 'fill' })
  .png()
  .toBuffer();

await sharp({
  create: {
    width: canvasWidth,
    height: canvasHeight,
    channels: 4,
    background: { r: 0, g: 0, b: 0, alpha: 0 },
  },
})
  .composite([{ input: normalized, left: 109, top: 18 }])
  .png()
  .toFile(outputPath);
