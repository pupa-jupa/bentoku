import { mkdir, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const projectRoot = process.cwd();
const publicAssets = path.join(projectRoot, 'public', 'assets');
const artSources = path.join(projectRoot, 'art');

const jobs = [
  {
    source: path.join(artSources, 'user-assets', 'pieces'),
    target: path.join(publicAssets, 'pieces'),
  },
  {
    source: path.join(artSources, 'user-assets', 'clues'),
    target: path.join(publicAssets, 'clues'),
  },
  {
    source: path.join(artSources, 'user-assets', 'ui'),
    target: path.join(publicAssets, 'ui'),
  },
  {
    source: path.join(artSources, 'user-assets', 'menu'),
    target: path.join(publicAssets, 'menu'),
  },
  {
    source: path.join(artSources, 'user-assets', 'characters'),
    target: path.join(publicAssets, 'characters'),
  },
  {
    source: path.join(artSources, 'runtime-sources', 'environment'),
    target: path.join(publicAssets, 'environment'),
    include: new Set(['gameplay_plate.png']),
  },
  {
    source: path.join(artSources, 'runtime-sources', 'ui'),
    target: path.join(publicAssets, 'ui'),
    include: new Set(['sakura_seal.png', 'success_stamp.png']),
  },
];

for (const job of jobs) {
  await mkdir(job.target, { recursive: true });
  const files = (await readdir(job.source, { withFileTypes: true }))
    .filter((entry) => entry.isFile() && /\.(png|jpe?g)$/i.test(entry.name))
    .map((entry) => entry.name)
    .filter((file) => !job.include || job.include.has(file))
    .sort();

  for (const file of files) {
    const output = path.join(job.target, `${path.parse(file).name}.webp`);
    const input = path.join(job.source, file);
    const source = await sharp(input, { failOn: 'error' })
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    const candidates = await Promise.all(
      [80, 100].map(async (quality) => ({
        quality,
        data: await sharp(input, { failOn: 'error' })
          .webp({ lossless: true, quality, effort: 6, smartSubsample: false })
          .toBuffer(),
      })),
    );
    candidates.sort((left, right) => left.data.length - right.data.length);
    const selected = candidates[0];
    if (!selected) throw new Error(`No lossless WebP candidate produced for ${input}.`);
    const decoded = await sharp(selected.data)
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    const dimensionsMatch =
      source.info.width === decoded.info.width &&
      source.info.height === decoded.info.height &&
      source.info.channels === decoded.info.channels;
    let visibleChannelDiffs = 0;
    let alphaDiffs = 0;
    if (dimensionsMatch) {
      for (let offset = 0; offset < source.data.length; offset += 4) {
        if (source.data[offset + 3] !== decoded.data[offset + 3]) alphaDiffs += 1;
        if (source.data[offset + 3] > 0) {
          for (let channel = 0; channel < 3; channel += 1) {
            if (source.data[offset + channel] !== decoded.data[offset + channel])
              visibleChannelDiffs += 1;
          }
        }
      }
    }
    if (!dimensionsMatch || alphaDiffs > 0 || visibleChannelDiffs > 0) {
      throw new Error(
        `Lossless verification failed for ${input}: alpha=${alphaDiffs}, visible RGB=${visibleChannelDiffs}.`,
      );
    }
    await writeFile(output, selected.data);
    process.stdout.write(
      `${path.relative(projectRoot, input)} -> ${path.relative(projectRoot, output)} (q${selected.quality}, ${selected.data.length} bytes)\n`,
    );
  }
}
