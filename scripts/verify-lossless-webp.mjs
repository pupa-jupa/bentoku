import { readdir } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const pairs = [
  ['art/user-assets/pieces', 'public/assets/pieces'],
  ['art/user-assets/clues', 'public/assets/clues'],
  ['art/user-assets/ui', 'public/assets/ui'],
  ['art/user-assets/menu', 'public/assets/menu'],
  ['art/user-assets/characters', 'public/assets/characters'],
  ['art/runtime-sources/environment', 'public/assets/environment', new Set(['gameplay_plate.png'])],
  ['art/runtime-sources/ui', 'public/assets/ui', new Set(['sakura_seal.png', 'success_stamp.png'])],
];

let failures = 0;
for (const [sourceDir, targetDir, include] of pairs) {
  const files = (await readdir(sourceDir))
    .filter((file) => /\.(png|jpe?g)$/i.test(file))
    .filter((file) => !include || include.has(file))
    .sort();
  for (const file of files) {
    const sourcePath = path.join(sourceDir, file);
    const targetPath = path.join(targetDir, `${path.parse(file).name}.webp`);
    const source = await sharp(sourcePath)
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    const target = await sharp(targetPath)
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    const dimensionsMatch =
      source.info.width === target.info.width &&
      source.info.height === target.info.height &&
      source.info.channels === target.info.channels;
    let visibleChannelDiffs = 0;
    let alphaDiffs = 0;
    if (dimensionsMatch) {
      for (let offset = 0; offset < source.data.length; offset += 4) {
        if (source.data[offset + 3] !== target.data[offset + 3]) alphaDiffs += 1;
        if (source.data[offset + 3] > 0) {
          for (let channel = 0; channel < 3; channel += 1) {
            if (source.data[offset + channel] !== target.data[offset + channel])
              visibleChannelDiffs += 1;
          }
        }
      }
    }
    const okay = dimensionsMatch && alphaDiffs === 0 && visibleChannelDiffs === 0;
    if (!okay) failures += 1;
    process.stdout.write(
      `${okay ? 'PASS' : 'FAIL'} ${file}: ${source.info.width}x${source.info.height}, alpha diffs=${alphaDiffs}, visible RGB diffs=${visibleChannelDiffs}\n`,
    );
  }
}

if (failures > 0) throw new Error(`${failures} lossless WebP verification(s) failed.`);
