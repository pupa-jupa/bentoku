import path from 'node:path';
import sharp from 'sharp';

const [input, output] = process.argv.slice(2);
if (!input || !output) {
  throw new Error('Usage: node scripts/key-chroma-background.mjs <input> <output>');
}

const source = await sharp(input)
  .resize(1254, 1254, { fit: 'fill', kernel: sharp.kernel.lanczos3 })
  .removeAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });
const result = Buffer.alloc(source.info.width * source.info.height * 4);

for (let sourceOffset = 0, targetOffset = 0; sourceOffset < source.data.length; sourceOffset += 3) {
  let red = source.data[sourceOffset];
  let green = source.data[sourceOffset + 1];
  let blue = source.data[sourceOffset + 2];
  const greenDominance = green - Math.max(red, blue);
  const alpha = Math.round(Math.max(0, Math.min(1, (145 - greenDominance) / 105)) * 255);

  if (alpha === 0) {
    red = 0;
    green = 0;
    blue = 0;
  } else if (alpha < 255) {
    green = Math.min(green, Math.round(Math.max(red, blue) * 1.06 + 5));
  }
  result[targetOffset] = red;
  result[targetOffset + 1] = green;
  result[targetOffset + 2] = blue;
  result[targetOffset + 3] = alpha;
  targetOffset += 4;
}

await sharp(result, {
  raw: { width: source.info.width, height: source.info.height, channels: 4 },
})
  .png({ compressionLevel: 9 })
  .toFile(output);
process.stdout.write(`${path.resolve(output)}\n`);
