import sharp from 'sharp';

const backgroundPath = 'art/user-assets/menu/main-menu-cafe-background-v1.png';
const dunyaPath = 'art/user-assets/characters/dunya-neutral-v1.png';
const buttonPath = 'art/user-assets/ui/menu-button-base-v1.png';
const outputPath = 'output/imagegen/main-menu-composition-v1.png';

const dunya = await sharp(dunyaPath).resize({ height: 820 }).png().toBuffer();
const button = await sharp(buttonPath)
  .trim({ background: { r: 0, g: 0, b: 0, alpha: 0 }, threshold: 4 })
  .resize({ width: 480 })
  .png()
  .toBuffer();
const foreground = await sharp(backgroundPath)
  .extract({ left: 690, top: 360, width: 910, height: 540 })
  .png()
  .toBuffer();

const labels = ['Campaign', 'Infinite', 'Achievements', 'Settings'];
const overlays = [
  { input: dunya, left: 1010, top: 30 },
  { input: foreground, left: 690, top: 360 },
];

for (let index = 0; index < labels.length; index += 1) {
  const top = 172 + index * 166;
  overlays.push({ input: button, left: 72, top });
  overlays.push({
    input: Buffer.from(`
      <svg width="480" height="150" xmlns="http://www.w3.org/2000/svg">
        <text x="240" y="91" text-anchor="middle"
          font-family="Georgia, 'Times New Roman', serif" font-size="31" font-weight="700"
          fill="#6a453d">${labels[index]}</text>
      </svg>
    `),
    left: 72,
    top,
  });
}

overlays.push({
  input: Buffer.from(`
    <svg width="560" height="130" xmlns="http://www.w3.org/2000/svg">
      <text x="82" y="62" font-family="Georgia, 'Times New Roman', serif"
        font-size="54" font-weight="700" fill="#6a453d">Bentoku</text>
      <text x="86" y="94" font-family="Arial, sans-serif"
        font-size="18" letter-spacing="3" fill="#9b6b61">A TINY LOLITA CAFÉ</text>
    </svg>
  `),
  left: 0,
  top: 24,
});

await sharp(backgroundPath).composite(overlays).png().toFile(outputPath);
