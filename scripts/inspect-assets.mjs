import { readdir } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const root = process.argv[2] ?? 'public/assets';
const entries = [];

async function walk(directory) {
  for (const name of await readdir(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, name.name);
    if (name.isDirectory()) await walk(fullPath);
    else if (name.name.endsWith('.png')) entries.push(fullPath);
  }
}

await walk(root);
for (const file of entries) {
  const image = sharp(file);
  const metadata = await image.metadata();
  const stats = await image.stats();
  const alpha = stats.channels[3];
  console.log(
    JSON.stringify({
      file,
      width: metadata.width,
      height: metadata.height,
      alpha: metadata.hasAlpha,
      transparentMin: alpha?.min ?? null,
      transparentMax: alpha?.max ?? null,
    }),
  );
}
