import process from 'node:process';
import sharp from 'sharp';

const [inputPath, outputPath] = process.argv.slice(2);

if (!inputPath || !outputPath) {
  throw new Error('Usage: node scripts/extract-blue-chroma.mjs <input> <output>');
}

const { data, info } = await sharp(inputPath)
  .removeAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });
const output = Buffer.alloc(info.width * info.height * 4);
const matte = new Uint8Array(info.width * info.height);

const clamp = (value) => Math.max(0, Math.min(255, Math.round(value)));

for (let source = 0, pixel = 0; source < data.length; source += 3, pixel += 1) {
  const r = data[source];
  const g = data[source + 1];
  const b = data[source + 2];
  const blueDominance = b - Math.max(r, g);

  let alpha = 255;
  if (b > 100 && blueDominance > 20) {
    const chroma = Math.min(1, (blueDominance - 20) / 210);
    alpha = clamp(255 * (1 - chroma));
  }
  if (alpha < 8) alpha = 0;

  matte[pixel] = alpha;
}

const nearestOpaqueColor = (x, y) => {
  for (let radius = 1; radius <= 8; radius += 1) {
    const minX = Math.max(0, x - radius);
    const maxX = Math.min(info.width - 1, x + radius);
    const minY = Math.max(0, y - radius);
    const maxY = Math.min(info.height - 1, y + radius);

    for (let sampleY = minY; sampleY <= maxY; sampleY += 1) {
      for (let sampleX = minX; sampleX <= maxX; sampleX += 1) {
        if (sampleX !== minX && sampleX !== maxX && sampleY !== minY && sampleY !== maxY) continue;
        const samplePixel = sampleY * info.width + sampleX;
        if (matte[samplePixel] !== 255) continue;
        const sampleSource = samplePixel * 3;
        return [data[sampleSource], data[sampleSource + 1], data[sampleSource + 2]];
      }
    }
  }
  return undefined;
};

for (
  let source = 0, pixel = 0, target = 0;
  source < data.length;
  source += 3, pixel += 1, target += 4
) {
  let alpha = matte[pixel];

  if (alpha === 0) {
    output[target] = 0;
    output[target + 1] = 0;
    output[target + 2] = 0;
    output[target + 3] = 0;
    continue;
  }

  let r = data[source];
  let g = data[source + 1];
  let b = data[source + 2];
  if (alpha < 255) {
    const x = pixel % info.width;
    const y = Math.floor(pixel / info.width);
    const neighbor = nearestOpaqueColor(x, y);
    if (!neighbor) {
      alpha = 0;
      r = 0;
      g = 0;
      b = 0;
    } else {
      [r, g, b] = neighbor;
    }
  }

  output[target] = r;
  output[target + 1] = g;
  output[target + 2] = b;
  output[target + 3] = alpha;
}

await sharp(output, {
  raw: { width: info.width, height: info.height, channels: 4 },
})
  .png()
  .toFile(outputPath);
