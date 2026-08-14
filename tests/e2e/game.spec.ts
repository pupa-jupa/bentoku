import { expect, test, type Page } from '@playwright/test';

interface SceneState {
  selectedPiece: string | null;
  settings: { musicVolume: number };
  placement: { board: Array<string | null>; moves: number };
  puzzle: { solution: string[]; difficulty: string };
  solved: boolean;
  modal?: unknown;
  pieces: Map<string, { x: number; y: number }>;
  bento: { slotWorldPosition(index: number): { x: number; y: number } };
}

const screenPoint = async (page: Page, x: number, y: number) =>
  page.evaluate(
    ({ x, y }) => {
      const rect = document.querySelector('canvas')!.getBoundingClientRect();
      return { x: rect.x + (x * rect.width) / 1600, y: rect.y + (y * rect.height) / 900 };
    },
    { x, y },
  );

test.beforeEach(async ({ page }) => {
  await page.goto('/?seed=BENTO-E2E-0001&difficulty=gentle');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await expect(page.locator('canvas')).toBeVisible();
  await expect
    .poll(() =>
      page.evaluate(() => {
        const game = (
          window as unknown as {
            __BENTOKU_GAME__?: { scene: { getScene(key: string): SceneState | undefined } };
          }
        ).__BENTOKU_GAME__;
        return Boolean(game?.scene.getScene('PuzzleScene')?.puzzle);
      }),
    )
    .toBe(true);
});

test('loads only WebP artwork without console errors', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  await page.reload();
  await page.waitForLoadState('networkidle');
  await expect
    .poll(() =>
      page.evaluate(() => {
        const game = (
          window as unknown as {
            __BENTOKU_GAME__?: { scene: { getScene(key: string): SceneState | undefined } };
          }
        ).__BENTOKU_GAME__;
        return Boolean(game?.scene.getScene('PuzzleScene')?.puzzle);
      }),
    )
    .toBe(true);
  const requests = await page.evaluate(() =>
    performance
      .getEntriesByType('resource')
      .map((entry) => entry.name)
      .filter((name) => /\.(webp|png|jpe?g)(\?|$)/i.test(name)),
  );
  // The favicon may be fetched by the browser process without appearing in
  // the page resource timeline. Phaser itself preloads exactly 24 images.
  expect(requests.length).toBe(24);
  expect(requests.every((name) => name.endsWith('.webp'))).toBe(true);
  expect(errors).toEqual([]);
  const musicRequests = await page.evaluate(() =>
    performance
      .getEntriesByType('resource')
      .map((entry) => new URL(entry.name).pathname)
      .filter((name) => name.startsWith('/assets/music/')),
  );
  expect(musicRequests).toEqual(['/assets/music/sunlit_puzzle.mp3']);
  const defaultMusicVolume = await page.evaluate(
    () =>
      (
        window as unknown as {
          __BENTOKU_GAME__: { scene: { getScene(key: string): SceneState } };
        }
      ).__BENTOKU_GAME__.scene.getScene('PuzzleScene').settings.musicVolume,
  );
  expect(defaultMusicVolume).toBe(0.35);
});

test('supports drag, undo, tap placement, and a complete winning run', async ({ page }) => {
  const puzzle = await page.evaluate(() => {
    const scene = (
      window as unknown as {
        __BENTOKU_GAME__: { scene: { getScene(key: string): SceneState } };
      }
    ).__BENTOKU_GAME__.scene.getScene('PuzzleScene');
    return {
      solution: scene.puzzle.solution,
      pieces: [...scene.pieces.entries()].map(([id, piece]) => ({ id, x: piece.x, y: piece.y })),
      slots: scene.puzzle.solution.map((_, index) => scene.bento.slotWorldPosition(index)),
    };
  });

  const firstId = puzzle.solution[0]!;
  const firstPiece = puzzle.pieces.find((candidate) => candidate.id === firstId)!;
  const firstPiecePoint = await screenPoint(page, firstPiece.x, firstPiece.y);
  const firstSlotPoint = await screenPoint(page, puzzle.slots[0]!.x, puzzle.slots[0]!.y);
  await page.mouse.move(firstPiecePoint.x, firstPiecePoint.y);
  await page.mouse.down();
  await page.mouse.move(firstSlotPoint.x, firstSlotPoint.y, { steps: 12 });
  await page.mouse.up();
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          (
            window as unknown as {
              __BENTOKU_GAME__: { scene: { getScene(key: string): SceneState } };
            }
          ).__BENTOKU_GAME__.scene.getScene('PuzzleScene').placement.moves,
      ),
    )
    .toBe(1);
  await page.keyboard.press('KeyU');
  await expect
    .poll(() =>
      page.evaluate(() => {
        const placement = (
          window as unknown as {
            __BENTOKU_GAME__: { scene: { getScene(key: string): SceneState } };
          }
        ).__BENTOKU_GAME__.scene.getScene('PuzzleScene').placement;
        return { moves: placement.moves, filled: placement.board.filter(Boolean).length };
      }),
    )
    .toEqual({ moves: 0, filled: 0 });

  for (let index = 0; index < puzzle.solution.length; index += 1) {
    const piece = puzzle.pieces.find((candidate) => candidate.id === puzzle.solution[index])!;
    const piecePoint = await screenPoint(page, piece.x, piece.y);
    const slotPoint = await screenPoint(page, puzzle.slots[index]!.x, puzzle.slots[index]!.y);
    await page.mouse.click(piecePoint.x, piecePoint.y);
    await page.mouse.click(slotPoint.x, slotPoint.y);
    await page.waitForTimeout(220);
  }

  await expect
    .poll(() =>
      page.evaluate(() => {
        const scene = (
          window as unknown as {
            __BENTOKU_GAME__: { scene: { getScene(key: string): SceneState } };
          }
        ).__BENTOKU_GAME__.scene.getScene('PuzzleScene');
        return { solved: scene.solved, moves: scene.placement.moves, modal: Boolean(scene.modal) };
      }),
    )
    .toEqual({ solved: true, moves: 9, modal: true });
});

test('keeps the complete composition usable in landscape', async ({ page }) => {
  const dimensions = await page.locator('canvas').evaluate((canvas) => {
    const rect = canvas.getBoundingClientRect();
    return { width: rect.width, height: rect.height };
  });
  expect(dimensions.width / dimensions.height).toBeCloseTo(16 / 9, 2);
  await expect(page.locator('#rotate-device')).toBeHidden();
});

test('lets the player switch deduction difficulty and preserves the choice', async ({ page }) => {
  const difficultyButton = await screenPoint(page, 1034, 54);
  await page.mouse.click(difficultyButton.x, difficultyButton.y);

  const trickyButton = await screenPoint(page, 935, 602);
  await page.mouse.click(trickyButton.x, trickyButton.y);
  await expect
    .poll(() =>
      page.evaluate(() => {
        const scene = (
          window as unknown as {
            __BENTOKU_GAME__: { scene: { getScene(key: string): SceneState } };
          }
        ).__BENTOKU_GAME__.scene.getScene('PuzzleScene');
        return {
          difficulty: scene.puzzle.difficulty,
          query: new URL(window.location.href).searchParams.get('difficulty'),
          filled: scene.placement.board.filter(Boolean).length,
        };
      }),
    )
    .toEqual({ difficulty: 'Tricky', query: 'tricky', filled: 0 });

  await page.reload();
  await expect
    .poll(() =>
      page.evaluate(() => {
        const game = (
          window as unknown as {
            __BENTOKU_GAME__?: { scene: { getScene(key: string): SceneState | undefined } };
          }
        ).__BENTOKU_GAME__;
        return game?.scene.getScene('PuzzleScene')?.puzzle?.difficulty ?? null;
      }),
    )
    .toBe('Tricky');
});
