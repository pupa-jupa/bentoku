import { mkdir, readdir } from 'node:fs/promises';
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
    await sharp(input, { failOn: 'error' })
      .webp({ lossless: true, effort: 6, smartSubsample: false })
      .toFile(output);
    process.stdout.write(
      `${path.relative(projectRoot, input)} -> ${path.relative(projectRoot, output)}\n`,
    );
  }
}
