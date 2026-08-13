import { readdir } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const root = process.argv[2];
if (!root) throw new Error('Usage: node scripts/audit-raster-assets.mjs <directory>');

const files = [];
async function walk(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) await walk(fullPath);
    else if (/\.(png|jpe?g|webp)$/i.test(entry.name)) files.push(fullPath);
  }
}

await walk(root);
for (const file of files.sort()) {
  const image = sharp(file).ensureAlpha();
  const metadata = await image.metadata();
  const { data, info } = await image.raw().toBuffer({ resolveWithObject: true });
  let minX = info.width;
  let minY = info.height;
  let maxX = -1;
  let maxY = -1;
  let opaque = 0;
  let partial = 0;
  for (let y = 0; y < info.height; y += 1) {
    for (let x = 0; x < info.width; x += 1) {
      const alpha = data[(y * info.width + x) * 4 + 3];
      if (alpha === 0) continue;
      if (alpha === 255) opaque += 1;
      else partial += 1;
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
  }
  const bounds = maxX >= 0 ? { minX, minY, maxX, maxY } : null;
  const padding = bounds
    ? {
        left: bounds.minX,
        top: bounds.minY,
        right: info.width - 1 - bounds.maxX,
        bottom: info.height - 1 - bounds.maxY,
      }
    : null;
  console.log(
    JSON.stringify({
      file: path.relative(root, file),
      format: metadata.format,
      width: info.width,
      height: info.height,
      sourceHasAlpha: metadata.hasAlpha ?? false,
      bounds,
      padding,
      opaque,
      partial,
    }),
  );
}
