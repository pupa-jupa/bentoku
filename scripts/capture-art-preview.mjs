/* global window */
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { chromium } from '@playwright/test';

const baseUrl = process.argv[2] ?? 'http://127.0.0.1:4173';
const output = path.join(
  process.cwd(),
  'art',
  'generations',
  'pastel-pilot',
  'in-game-piece-states.png',
);

await mkdir(path.dirname(output), { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
await page.addInitScript(() => {
  localStorage.setItem(
    'bentoku.save.v2',
    JSON.stringify({
      version: 2,
      settings: { language: 'en', difficulty: 'cozy', mode: 'standard' },
      tutorial: { completedVersion: 1 },
      stats: { solved: 0, timed: { attempts: 0, wins: 0, bestRemainingMs: 0 } },
    }),
  );
});
await page.goto(`${baseUrl}/?seed=BENTO-ART-PREV&difficulty=cozy`);
await page.waitForFunction(() =>
  Boolean(window.__BENTOKU_GAME__?.scene.getScene('PuzzleScene')?.puzzle),
);

const points = await page.evaluate(() => {
  const scene = window.__BENTOKU_GAME__.scene.getScene('PuzzleScene');
  return scene.puzzle.solution.slice(0, 5).map((pieceId, index) => ({
    piece: { x: scene.pieces.get(pieceId).x, y: scene.pieces.get(pieceId).y },
    slot: scene.bento.slotWorldPosition(index),
  }));
});
const canvas = await page.locator('canvas').boundingBox();
if (!canvas) throw new Error('Bentoku canvas is not visible.');
const toScreen = ({ x, y }) => ({
  x: canvas.x + (x * canvas.width) / 1600,
  y: canvas.y + (y * canvas.height) / 900,
});
for (const point of points) {
  const piece = toScreen(point.piece);
  const slot = toScreen(point.slot);
  await page.mouse.click(piece.x, piece.y);
  await page.mouse.click(slot.x, slot.y);
  await page.waitForTimeout(240);
}
await page.waitForTimeout(500);
await page.screenshot({ path: output });
await browser.close();
process.stdout.write(`${output}\n`);
