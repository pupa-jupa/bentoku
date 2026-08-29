import { expect, test, type Page } from '@playwright/test';

interface GameObjectState {
  name?: string;
  type?: string;
  text?: string;
  width?: number;
  height?: number;
  alpha?: number;
  x?: number;
  y?: number;
  input?: { enabled: boolean };
  clue?: { id: string };
  list?: GameObjectState[];
  texture?: { key: string };
}

interface SceneState {
  selectedPiece: string | null;
  settings: { language: string; musicVolume: number; nightDim: number; musicTrackKey: string };
  placement: { board: Array<string | null>; moves: number };
  puzzle: { solution: string[]; difficulty: string; seed: string };
  playContext?: { source: string; allowReveal: boolean; campaignOrderId?: string };
  solved: boolean;
  mode: string;
  timer?: { state: string; remainingMs: number };
  elapsedTimer?: { elapsedMs: number; running: boolean };
  tutorial?: {
    active: boolean;
    step: string;
    firstPiece: string;
    firstCell: number;
    secondPiece: string;
    secondCell: number;
  };
  modal?: unknown;
  countdown?: { list: GameObjectState[] };
  pieces: Map<
    string,
    {
      x: number;
      y: number;
      alpha: number;
      input?: { enabled: boolean };
      sprite: { tintTopLeft: number };
    }
  >;
  bento: { slotWorldPosition(index: number): { x: number; y: number } };
  children: { list: GameObjectState[] };
}

const SCENE_READY_TIMEOUT = 30_000;

const screenPoint = async (page: Page, x: number, y: number) =>
  page.evaluate(
    ({ x, y }) => {
      const rect = document.querySelector('canvas')!.getBoundingClientRect();
      return { x: rect.x + (x * rect.width) / 1600, y: rect.y + (y * rect.height) / 900 };
    },
    { x, y },
  );

const sceneTexts = async (page: Page, sceneKey = 'PuzzleScene'): Promise<string[]> =>
  page.evaluate((key) => {
    const scene = (
      window as unknown as {
        __BENTOKU_GAME__: { scene: { getScene(key: string): SceneState } };
      }
    ).__BENTOKU_GAME__.scene.getScene(key);
    const collect = (object: GameObjectState): string[] => [
      ...(object.text ? [object.text] : []),
      ...(object.list?.flatMap(collect) ?? []),
    ];
    return scene.children.list.flatMap(collect);
  }, sceneKey);

const enterInfinite = async (page: Page): Promise<void> => {
  await expect
    .poll(
      () =>
        page.evaluate(() => {
          const game = (
            window as unknown as {
              __BENTOKU_GAME__?: { scene: { getScene(key: string): SceneState | undefined } };
            }
          ).__BENTOKU_GAME__;
          const menu = game?.scene.getScene('MenuScene');
          const hasAction = (objects: GameObjectState[]): boolean =>
            objects.some(
              (object) => object.name === 'menu-action-infinite' || hasAction(object.list ?? []),
            );
          return Boolean(menu && hasAction(menu.children.list));
        }),
      { timeout: SCENE_READY_TIMEOUT },
    )
    .toBe(true);
  const infinite = await screenPoint(page, 312, 434);
  await page.mouse.click(infinite.x, infinite.y);
  await expect
    .poll(
      () =>
        page.evaluate(() => {
          const game = (
            window as unknown as {
              __BENTOKU_GAME__?: { scene: { getScene(key: string): SceneState | undefined } };
            }
          ).__BENTOKU_GAME__;
          return Boolean(game?.scene.getScene('PuzzleScene')?.puzzle);
        }),
      { timeout: SCENE_READY_TIMEOUT },
    )
    .toBe(true);
};

const enableDevMode = async (page: Page): Promise<void> => {
  if ((await sceneTexts(page, 'MenuScene')).includes('DEV MODE')) return;
  await page.keyboard.press('Control+Shift+KeyD');
  await expect
    .poll(() => sceneTexts(page, 'MenuScene'), { timeout: SCENE_READY_TIMEOUT })
    .toContain('DEV MODE');
};

const playStoryIntro = async (page: Page): Promise<void> => {
  await expect.poll(() => sceneTexts(page, 'StoryScene')).toContain('Continue');
  const dayContinue = await screenPoint(page, 785, 760);
  await page.mouse.click(dayContinue.x, dayContinue.y);
  await expect
    .poll(async () =>
      (await sceneTexts(page, 'StoryScene')).some((copy) => copy.includes('Visitor artwork slot')),
    )
    .toBe(true);

  for (let index = 0; index < 6; index += 1) {
    const before = (await sceneTexts(page, 'StoryScene')).join('\n');
    const continueButton = await screenPoint(page, 1285, 746);
    await page.mouse.click(continueButton.x, continueButton.y);
    await expect
      .poll(async () => (await sceneTexts(page, 'StoryScene')).join('\n'), {
        timeout: SCENE_READY_TIMEOUT,
      })
      .not.toBe(before);
  }
};

test.beforeEach(async ({ page }) => {
  await page.goto('/?seed=BENTO-E2E-0001&difficulty=gentle');
  await expect
    .poll(() => sceneTexts(page, 'MenuScene'), { timeout: SCENE_READY_TIMEOUT })
    .toContain('Infinite');
  await page.evaluate(() => localStorage.clear());
  await page.evaluate(() =>
    localStorage.setItem(
      'bentoku.save.v2',
      JSON.stringify({
        version: 2,
        settings: { language: 'en', difficulty: 'gentle', mode: 'standard' },
        tutorial: { completedVersion: 1 },
        stats: { solved: 0, timed: { attempts: 0, wins: 0, bestRemainingMs: 0 } },
      }),
    ),
  );
  await page.reload();
  await expect(page.locator('canvas')).toBeVisible();
  await enterInfinite(page);
});

test('opens on the four-action Dunya café menu before gameplay', async ({ page }) => {
  await page.goto('/');
  await expect.poll(() => sceneTexts(page, 'MenuScene')).toContain('Campaign');
  const copy = await sceneTexts(page, 'MenuScene');
  expect(copy).toEqual(
    expect.arrayContaining(['Campaign', 'Infinite', 'Achievements', 'Settings']),
  );

  const initialDunya = await page.evaluate(() => {
    const scene = (
      window as unknown as {
        __BENTOKU_GAME__: { scene: { getScene(key: string): SceneState } };
      }
    ).__BENTOKU_GAME__.scene.getScene('MenuScene');
    const flatten = (objects: GameObjectState[]): GameObjectState[] =>
      objects.flatMap((object) => [object, ...flatten(object.list ?? [])]);
    const all = flatten(scene.children.list);
    return {
      actions: all.filter((object) => object.name?.startsWith('menu-action-')).length,
      texture: all.find((object) => object.name === 'dunya')?.texture?.key,
    };
  });
  expect(initialDunya).toEqual({ actions: 4, texture: 'dunya_neutral' });

  const campaign = await screenPoint(page, 312, 268);
  await page.mouse.move(campaign.x, campaign.y);
  await expect
    .poll(() =>
      page.evaluate(() => {
        const scene = (
          window as unknown as {
            __BENTOKU_GAME__: {
              scene: { getScene(key: string): { dunya?: { texture?: { key: string } } } };
            };
          }
        ).__BENTOKU_GAME__.scene.getScene('MenuScene');
        return scene.dunya?.texture?.key;
      }),
    )
    .toBe('dunya_neutral');
  await page.mouse.click(campaign.x, campaign.y);
  expect(await sceneTexts(page, 'CampaignScene')).not.toContain("Dunya's Order Book");

  await enableDevMode(page);
  await page.mouse.move(campaign.x, campaign.y);
  await expect
    .poll(() =>
      page.evaluate(() => {
        const scene = (
          window as unknown as {
            __BENTOKU_GAME__: {
              scene: { getScene(key: string): { dunya?: { texture?: { key: string } } } };
            };
          }
        ).__BENTOKU_GAME__.scene.getScene('MenuScene');
        return scene.dunya?.texture?.key;
      }),
    )
    .toBe('dunya_focused');

  await enterInfinite(page);
});

test('opens the real campaign book and unlocks the next fixed order after a win', async ({
  page,
}) => {
  await page.goto('/');
  await expect.poll(() => sceneTexts(page, 'MenuScene')).toContain('Campaign');
  await enableDevMode(page);
  const campaignButton = await screenPoint(page, 312, 268);
  await page.mouse.click(campaignButton.x, campaignButton.y);
  await expect.poll(() => sceneTexts(page, 'CampaignScene')).toContain("Dunya's Order Book");

  const bookState = await page.evaluate(() => {
    const scene = (
      window as unknown as {
        __BENTOKU_GAME__: { scene: { getScene(key: string): SceneState } };
      }
    ).__BENTOKU_GAME__.scene.getScene('CampaignScene');
    const flatten = (objects: GameObjectState[]): GameObjectState[] =>
      objects.flatMap((object) => [object, ...flatten(object.list ?? [])]);
    const all = flatten(scene.children.list);
    return {
      chapters: all.filter((object) => object.name?.startsWith('campaign-chapter-')).length,
      orderSeals: all.filter((object) => object.name?.startsWith('campaign-order-')).length,
      interactiveOrders: all.filter(
        (object) => object.name?.startsWith('campaign-order-') && object.input?.enabled,
      ).length,
    };
  });
  expect(bookState).toEqual({ chapters: 5, orderSeals: 6, interactiveOrders: 1 });

  const startOrder = await screenPoint(page, 1090, 705);
  await page.mouse.click(startOrder.x, startOrder.y);
  await expect.poll(() => sceneTexts(page, 'StoryScene')).toContain('Morning Bows');
  await playStoryIntro(page);
  await expect
    .poll(() =>
      page.evaluate(() => {
        const scene = (
          window as unknown as {
            __BENTOKU_GAME__: { scene: { getScene(key: string): SceneState } };
          }
        ).__BENTOKU_GAME__.scene.getScene('PuzzleScene');
        return {
          source: scene.playContext?.source,
          orderId: scene.playContext?.campaignOrderId,
          reveal: scene.playContext?.allowReveal,
          difficulty: scene.puzzle?.difficulty,
          seed: scene.puzzle?.seed,
        };
      }),
    )
    .toEqual({
      source: 'campaign',
      orderId: 'chapter-1-order-1',
      reveal: false,
      difficulty: 'cozy',
      seed: 'BENTO-C1O1-FEST',
    });

  const campaignCopy = await sceneTexts(page);
  expect(campaignCopy).toContain('Daily');
  expect(campaignCopy).toContain('Rush');
  const campaignToolbar = await page.evaluate(() => {
    const scene = (
      window as unknown as {
        __BENTOKU_GAME__: { scene: { getScene(key: string): SceneState } };
      }
    ).__BENTOKU_GAME__.scene.getScene('PuzzleScene');
    return scene.children.list
      .filter((object) =>
        object.list?.some((child) => child.text === 'Daily' || child.text === 'Rush'),
      )
      .map((object) => ({ alpha: object.alpha, interactive: object.input?.enabled ?? false }));
  });
  expect(campaignToolbar).toEqual([
    { alpha: 0.43, interactive: false },
    { alpha: 0.43, interactive: false },
  ]);
  const helpButton = await screenPoint(page, 1426, 54);
  await page.mouse.click(helpButton.x, helpButton.y);
  await expect.poll(() => sceneTexts(page)).not.toContain('Reveal one');
  await page.evaluate(() => {
    const scene = (
      window as unknown as {
        __BENTOKU_GAME__: { scene: { getScene(key: string): SceneState & { closeModal(): void } } };
      }
    ).__BENTOKU_GAME__.scene.getScene('PuzzleScene');
    scene.closeModal();
  });

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
  for (let index = 0; index < puzzle.solution.length; index += 1) {
    const piece = puzzle.pieces.find((candidate) => candidate.id === puzzle.solution[index])!;
    const piecePoint = await screenPoint(page, piece.x, piece.y);
    const slotPoint = await screenPoint(page, puzzle.slots[index]!.x, puzzle.slots[index]!.y);
    await page.mouse.click(piecePoint.x, piecePoint.y);
    await page.mouse.click(slotPoint.x, slotPoint.y);
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
      .toBe(index + 1);
  }

  await expect.poll(() => sceneTexts(page)).toContain('Order stamped! The next page is ready.');
  const returnBook = await screenPoint(page, 900, 566);
  await page.mouse.click(returnBook.x, returnBook.y);
  await expect.poll(() => sceneTexts(page, 'CampaignScene')).toContain("Dunya's Order Book");
  const progress = await page.evaluate(() => {
    const stored = JSON.parse(localStorage.getItem('bentoku.save.v4') ?? '{}');
    const scene = (
      window as unknown as {
        __BENTOKU_GAME__: { scene: { getScene(key: string): SceneState } };
      }
    ).__BENTOKU_GAME__.scene.getScene('CampaignScene');
    const flatten = (objects: GameObjectState[]): GameObjectState[] =>
      objects.flatMap((object) => [object, ...flatten(object.list ?? [])]);
    return {
      completed: stored.campaign?.completedOrderIds,
      current: stored.campaign?.currentOrderId,
      interactiveOrders: flatten(scene.children.list).filter(
        (object) => object.name?.startsWith('campaign-order-') && object.input?.enabled,
      ).length,
    };
  });
  expect(progress).toEqual({
    completed: ['chapter-1-order-1'],
    current: 'chapter-1-order-2',
    interactiveOrders: 2,
  });
});

test('keeps the only campaign finale timed at 1:45 with Reveal locked', async ({ page }) => {
  await page.goto('/');
  await expect.poll(() => sceneTexts(page, 'MenuScene')).toContain('Campaign');
  await page.evaluate(() => {
    const stored = JSON.parse(localStorage.getItem('bentoku.save.v4') ?? '{}');
    stored.campaign = {
      completedOrderIds: Array.from({ length: 29 }, (_, index) => {
        const chapter = Math.floor(index / 6) + 1;
        const order = (index % 6) + 1;
        return `chapter-${chapter}-order-${order}`;
      }),
      currentOrderId: 'chapter-5-order-6',
    };
    localStorage.setItem('bentoku.save.v4', JSON.stringify(stored));
  });
  await enableDevMode(page);
  const campaignButton = await screenPoint(page, 312, 268);
  await page.mouse.click(campaignButton.x, campaignButton.y);
  await expect.poll(() => sceneTexts(page, 'CampaignScene')).toContain('Festival Window');
  await expect.poll(() => sceneTexts(page, 'CampaignScene')).toContain('Final order · 1:45');

  const startOrder = await screenPoint(page, 1090, 705);
  await page.mouse.click(startOrder.x, startOrder.y);
  await expect
    .poll(() => sceneTexts(page))
    .toContain(
      "Complete Dunya's final Master order in 1 minute 45 seconds. Reveal is locked, and every retry keeps the timer.",
    );

  const outsideRules = await screenPoint(page, 120, 120);
  await page.mouse.click(outsideRules.x, outsideRules.y);
  await expect
    .poll(() => sceneTexts(page, 'CampaignScene'), { timeout: SCENE_READY_TIMEOUT })
    .toContain('Festival Window');
  await page.mouse.click(startOrder.x, startOrder.y);
  await expect
    .poll(() => sceneTexts(page), { timeout: SCENE_READY_TIMEOUT })
    .toContain(
      "Complete Dunya's final Master order in 1 minute 45 seconds. Reveal is locked, and every retry keeps the timer.",
    );

  const startChallenge = await screenPoint(page, 800, 527);
  await page.mouse.click(startChallenge.x, startChallenge.y);
  await expect
    .poll(
      () =>
        page.evaluate(() => {
          const scene = (
            window as unknown as {
              __BENTOKU_GAME__: { scene: { getScene(key: string): SceneState } };
            }
          ).__BENTOKU_GAME__.scene.getScene('PuzzleScene');
          return {
            source: scene.playContext?.source,
            orderId: scene.playContext?.campaignOrderId,
            reveal: scene.playContext?.allowReveal,
            mode: scene.mode,
            difficulty: scene.puzzle.difficulty,
            state: scene.timer?.state,
            remainingMs: scene.timer?.remainingMs ?? 0,
          };
        }),
      { timeout: SCENE_READY_TIMEOUT },
    )
    .toMatchObject({
      source: 'campaign',
      orderId: 'chapter-5-order-6',
      reveal: false,
      mode: 'timed',
      difficulty: 'master',
      state: 'running',
    });
  const remaining = await page.evaluate(
    () =>
      (
        window as unknown as {
          __BENTOKU_GAME__: { scene: { getScene(key: string): SceneState } };
        }
      ).__BENTOKU_GAME__.scene.getScene('PuzzleScene').timer?.remainingMs ?? 0,
  );
  expect(remaining).toBeLessThanOrEqual(105_000);
  expect(remaining).toBeGreaterThan(95_000);

  const helpButton = await screenPoint(page, 1426, 54);
  await page.mouse.click(helpButton.x, helpButton.y);
  const helpCopy = await sceneTexts(page);
  expect(helpCopy).not.toContain('Reveal one');
  expect(helpCopy).toContain('Tutorial');
});

test('loads only WebP artwork without console errors', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  await page.reload();
  await page.waitForLoadState('networkidle');
  await enterInfinite(page);
  const requests = await page.evaluate(() =>
    performance
      .getEntriesByType('resource')
      .map((entry) => entry.name)
      .filter((name) => /\.(webp|png|jpe?g)(\?|$)/i.test(name)),
  );
  // The favicon may be fetched by the browser process without appearing in
  // the page resource timeline. Phaser itself preloads exactly 38 images.
  expect(requests.length).toBe(38);
  expect(requests.every((name) => name.endsWith('.webp'))).toBe(true);
  expect(errors).toEqual([]);
  const musicRequests = await page.evaluate(() =>
    performance
      .getEntriesByType('resource')
      .map((entry) => new URL(entry.name).pathname)
      .filter((name) => name.startsWith('/assets/music/')),
  );
  expect(musicRequests).toEqual([
    '/assets/music/sunlit_puzzle.mp3',
    '/assets/music/paper_lantern_logic.mp3',
  ]);
  const defaultMusicVolume = await page.evaluate(
    () =>
      (
        window as unknown as {
          __BENTOKU_GAME__: { scene: { getScene(key: string): SceneState } };
        }
      ).__BENTOKU_GAME__.scene.getScene('PuzzleScene').settings.musicVolume,
  );
  expect(defaultMusicVolume).toBe(0.5);
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
  const undoButton = await screenPoint(page, 1362, 54);
  await page.mouse.click(undoButton.x, undoButton.y);
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
      .toBe(index + 1);
  }

  await expect
    .poll(() =>
      page.evaluate(() => {
        const scene = (
          window as unknown as {
            __BENTOKU_GAME__: { scene: { getScene(key: string): SceneState } };
          }
        ).__BENTOKU_GAME__.scene.getScene('PuzzleScene');
        return {
          solved: scene.solved,
          moves: scene.placement.moves,
          modal: Boolean(scene.modal),
          activeSparkles: scene.children.list.filter((object) => object.type === 'Star').length,
        };
      }),
    )
    .toEqual({ solved: true, moves: 9, modal: true, activeSparkles: 0 });
  const completedHistory = await page.evaluate(() => {
    const stored = JSON.parse(localStorage.getItem('bentoku.save.v4') ?? '{}');
    return {
      current: stored.currentPuzzle,
      latest: stored.history?.[0],
    };
  });
  expect(completedHistory.current).toBeUndefined();
  expect(completedHistory.latest).toMatchObject({ moves: 9, difficulty: 'gentle' });
  expect(completedHistory.latest.durationMs).toBeGreaterThan(0);
});

test('keeps the complete composition usable in landscape', async ({ page }) => {
  const dimensions = await page.locator('canvas').evaluate((canvas) => {
    const rect = canvas.getBoundingClientRect();
    return { width: rect.width, height: rect.height };
  });
  expect(dimensions.width / dimensions.height).toBeCloseTo(16 / 9, 2);
  await expect(page.locator('#rotate-device')).toBeHidden();
});

test('disables and dims the animal family omitted from the solution', async ({ page }) => {
  const omitted = await page.evaluate(() => {
    const scene = (
      window as unknown as {
        __BENTOKU_GAME__: { scene: { getScene(key: string): SceneState } };
      }
    ).__BENTOKU_GAME__.scene.getScene('PuzzleScene');
    const includedAnimals = new Set(scene.puzzle.solution.map((pieceId) => pieceId.split('_')[0]));
    return [...scene.pieces.entries()]
      .filter(([pieceId]) => !includedAnimals.has(pieceId.split('_')[0]))
      .map(([id, piece]) => ({
        id,
        x: piece.x,
        y: piece.y,
        alpha: piece.alpha,
        interactive: piece.input?.enabled ?? false,
        tint: piece.sprite.tintTopLeft,
      }));
  });

  expect(omitted).toHaveLength(3);
  expect(omitted.every((piece) => !piece.interactive)).toBe(true);
  expect(omitted.every((piece) => piece.alpha < 0.7)).toBe(true);
  expect(omitted.every((piece) => piece.tint !== 0xffffff)).toBe(true);

  const disabledPoint = await screenPoint(page, omitted[0]!.x, omitted[0]!.y);
  const firstSlot = await screenPoint(page, 637, 235);
  await page.mouse.click(disabledPoint.x, disabledPoint.y);
  await page.mouse.click(firstSlot.x, firstSlot.y);
  const placement = await page.evaluate(() => {
    const scene = (
      window as unknown as {
        __BENTOKU_GAME__: { scene: { getScene(key: string): SceneState } };
      }
    ).__BENTOKU_GAME__.scene.getScene('PuzzleScene');
    return {
      selectedPiece: scene.selectedPiece,
      board: scene.placement.board,
      moves: scene.placement.moves,
    };
  });
  expect(placement).toEqual({
    selectedPiece: null,
    board: Array.from({ length: 9 }, () => null),
    moves: 0,
  });
});

test('shows the active elapsed timer and paginates game history with replay', async ({ page }) => {
  await expect
    .poll(async () => (await sceneTexts(page)).some((text) => /TIME 00:0[1-9]/.test(text)))
    .toBe(true);

  await page.goto('/');
  await expect.poll(() => sceneTexts(page, 'MenuScene')).toContain('Infinite');
  await page.evaluate(() => {
    const stored = JSON.parse(localStorage.getItem('bentoku.save.v4') ?? '{}');
    stored.history = Array.from({ length: 9 }, (_, index) => ({
      attemptId: `history-e2e-${index}`,
      startedAt: 1_750_000_000_000 - index * 60_000,
      seed: `BENTO-HS00-000${index}`,
      difficulty: index % 2 === 0 ? 'gentle' : 'clever',
      mode: 'standard',
      source: 'infinite',
      durationMs: (index + 1) * 15_000,
      moves: index + 9,
    }));
    localStorage.setItem('bentoku.save.v4', JSON.stringify(stored));
  });
  await enterInfinite(page);

  const historyButton = await screenPoint(page, 790, 54);
  await page.mouse.click(historyButton.x, historyButton.y);
  await expect.poll(() => sceneTexts(page)).toContain('Game history');
  const firstPage = await sceneTexts(page);
  expect(firstPage).toEqual(
    expect.arrayContaining([
      'CURRENT GAME',
      'BENTO-E2E0-001B',
      'BENTO-HS00-0000',
      '1 / 2',
      'STARTED',
      'SEED',
      'LEVEL',
      'TIME',
      'MOVES',
      'REPLAY',
    ]),
  );
  const pausedAt = await page.evaluate(() => {
    const scene = (
      window as unknown as {
        __BENTOKU_GAME__: { scene: { getScene(key: string): SceneState } };
      }
    ).__BENTOKU_GAME__.scene.getScene('PuzzleScene');
    return { elapsedMs: scene.elapsedTimer?.elapsedMs ?? -1, running: scene.elapsedTimer?.running };
  });
  await page.waitForTimeout(450);
  const pausedAfter = await page.evaluate(() => {
    const scene = (
      window as unknown as {
        __BENTOKU_GAME__: { scene: { getScene(key: string): SceneState } };
      }
    ).__BENTOKU_GAME__.scene.getScene('PuzzleScene');
    return { elapsedMs: scene.elapsedTimer?.elapsedMs ?? -1, running: scene.elapsedTimer?.running };
  });
  expect(pausedAt.running).toBe(false);
  expect(pausedAfter).toEqual(pausedAt);

  const nextPage = await screenPoint(page, 876, 736);
  await page.mouse.click(nextPage.x, nextPage.y);
  await expect.poll(() => sceneTexts(page)).toContain('2 / 2');
  expect(await sceneTexts(page)).toContain('BENTO-HS00-0006');

  const replayFirstRow = await screenPoint(page, 1245, 286);
  await page.mouse.click(replayFirstRow.x, replayFirstRow.y);
  await expect
    .poll(() =>
      page.evaluate(() => {
        const scene = (
          window as unknown as {
            __BENTOKU_GAME__: { scene: { getScene(key: string): SceneState } };
          }
        ).__BENTOKU_GAME__.scene.getScene('PuzzleScene');
        return {
          seed: scene.puzzle.seed,
          difficulty: scene.puzzle.difficulty,
          moves: scene.placement.moves,
          modal: Boolean(scene.modal),
        };
      }),
    )
    .toEqual({ seed: 'BENTO-HS00-0006', difficulty: 'gentle', moves: 0, modal: false });
});

test('keeps BGM across scenes and persists the night dimmer', async ({ page }) => {
  const atmosphereState = () =>
    page.evaluate(() => {
      const atmosphere = (
        window as unknown as {
          __BENTOKU_GAME__: {
            scene: {
              getScene(key: string): {
                currentTrackKey?: string;
                children: { list: GameObjectState[] };
              };
            };
          };
        }
      ).__BENTOKU_GAME__.scene.getScene('AtmosphereScene');
      return {
        track: atmosphere.currentTrackKey,
        overlayAlpha: atmosphere.children.list.find((object) => object.name === 'night-overlay')
          ?.alpha,
      };
    });

  await expect.poll(atmosphereState).toMatchObject({ track: 'music_sunlit_puzzle' });
  const settingsButton = await screenPoint(page, 1490, 54);
  await page.mouse.click(settingsButton.x, settingsButton.y);
  await expect.poll(() => sceneTexts(page)).toContain('Sunlit Puzzle');

  const nextTrack = await screenPoint(page, 1005, 309);
  await page.mouse.click(nextTrack.x, nextTrack.y);
  await expect
    .poll(atmosphereState, { timeout: SCENE_READY_TIMEOUT })
    .toMatchObject({ track: 'music_paper_lantern_logic' });
  await expect.poll(() => sceneTexts(page)).toContain('Paper Lantern Logic');

  const nightSlider = await screenPoint(page, 836, 549);
  await page.mouse.click(nightSlider.x, nightSlider.y);
  await expect
    .poll(() =>
      page.evaluate(() => {
        const save = JSON.parse(localStorage.getItem('bentoku.save.v4') ?? '{}');
        const atmosphere = (
          window as unknown as {
            __BENTOKU_GAME__: {
              scene: { getScene(key: string): { children: { list: GameObjectState[] } } };
            };
          }
        ).__BENTOKU_GAME__.scene.getScene('AtmosphereScene');
        return {
          nightDim: save.settings?.nightDim,
          alpha: atmosphere.children.list.find((object) => object.name === 'night-overlay')?.alpha,
        };
      }),
    )
    .toEqual({ nightDim: 0.6, alpha: 0.27 });

  const backToCafe = await screenPoint(page, 935, 781);
  await page.mouse.click(backToCafe.x, backToCafe.y);
  await expect
    .poll(() => sceneTexts(page, 'MenuScene'), { timeout: SCENE_READY_TIMEOUT })
    .toContain('Infinite');
  expect(await atmosphereState()).toMatchObject({ track: 'music_paper_lantern_logic' });

  await enterInfinite(page);
  expect(await atmosphereState()).toEqual({
    track: 'music_paper_lantern_logic',
    overlayAlpha: 0.27,
  });
  await page.reload();
  await enterInfinite(page);
  await expect
    .poll(atmosphereState, { timeout: SCENE_READY_TIMEOUT })
    .toEqual({ track: 'music_paper_lantern_logic', overlayAlpha: 0.27 });
});

test('dismisses modal surfaces only from outside or Escape', async ({ page }) => {
  const settingsButton = await screenPoint(page, 1490, 54);
  await page.mouse.click(settingsButton.x, settingsButton.y);
  await expect.poll(() => sceneTexts(page)).toContain('Settings');

  const inside = await screenPoint(page, 800, 180);
  await page.mouse.click(inside.x, inside.y);
  await expect.poll(() => sceneTexts(page)).toContain('Settings');

  const outside = await screenPoint(page, 120, 120);
  await page.mouse.click(outside.x, outside.y);
  await expect.poll(() => sceneTexts(page)).not.toContain('Settings');

  const historyButton = await screenPoint(page, 790, 54);
  await page.mouse.click(historyButton.x, historyButton.y);
  await expect
    .poll(() =>
      page.evaluate(() =>
        Boolean(
          (
            window as unknown as {
              __BENTOKU_GAME__: { scene: { getScene(key: string): SceneState } };
            }
          ).__BENTOKU_GAME__.scene.getScene('PuzzleScene').modal,
        ),
      ),
    )
    .toBe(true);
  await page.keyboard.press('Escape');
  await expect
    .poll(() =>
      page.evaluate(() =>
        Boolean(
          (
            window as unknown as {
              __BENTOKU_GAME__: { scene: { getScene(key: string): SceneState } };
            }
          ).__BENTOKU_GAME__.scene.getScene('PuzzleScene').modal,
        ),
      ),
    )
    .toBe(false);
});

test('keeps toolbar, settings actions, and partial clues inside their intended layout', async ({
  page,
}) => {
  const toolbar = await page.evaluate(() => {
    const scene = (
      window as unknown as {
        __BENTOKU_GAME__: { scene: { getScene(key: string): SceneState } };
      }
    ).__BENTOKU_GAME__.scene.getScene('PuzzleScene');
    const labels = new Set(['Daily', 'Rush']);
    return scene.children.list
      .filter((object) =>
        object.list?.some(
          (child) => child.text && (labels.has(child.text) || child.text.endsWith('▾')),
        ),
      )
      .map((object) => ({
        x: object.x,
        width: object.width,
        role: object.list?.some((child) => child.text?.endsWith('▾'))
          ? 'difficulty'
          : object.list?.find((child) => child.text)?.text?.toLowerCase(),
      }));
  });
  expect(toolbar).toEqual([
    { x: 1062, width: 92, role: 'difficulty' },
    { x: 1166, width: 92, role: 'daily' },
    { x: 1270, width: 92, role: 'rush' },
  ]);

  const iconGlyphPositions = await page.evaluate(() => {
    const scene = (
      window as unknown as {
        __BENTOKU_GAME__: { scene: { getScene(key: string): SceneState } };
      }
    ).__BENTOKU_GAME__.scene.getScene('PuzzleScene');
    return ['↶', '?', '⚙'].map((glyph) => {
      const button = scene.children.list.find((object) =>
        object.list?.some((child) => child.text === glyph),
      );
      const text = button?.list?.find((child) => child.text === glyph);
      return { glyph, x: text?.x, y: text?.y };
    });
  });
  expect(iconGlyphPositions).toEqual([
    { glyph: '↶', x: 0, y: 1 },
    { glyph: '?', x: 0, y: 1 },
    { glyph: '⚙', x: 0, y: 1 },
  ]);

  const difficultyButton = await screenPoint(page, 1062, 54);
  await page.mouse.click(difficultyButton.x, difficultyButton.y);
  const difficultyActionWidths = await page.evaluate(() => {
    const scene = (
      window as unknown as {
        __BENTOKU_GAME__: { scene: { getScene(key: string): SceneState } };
      }
    ).__BENTOKU_GAME__.scene.getScene('PuzzleScene');
    const modal = scene.modal as { list?: GameObjectState[] } | undefined;
    return (
      modal?.list
        ?.filter((object) => object.list?.some((child) => typeof child.text === 'string'))
        .map((object) => object.width) ?? []
    );
  });
  expect(difficultyActionWidths).toEqual([188, 188, 188, 188, 188]);
  await page.evaluate(() => {
    const scene = (
      window as unknown as {
        __BENTOKU_GAME__: { scene: { getScene(key: string): SceneState & { closeModal(): void } } };
      }
    ).__BENTOKU_GAME__.scene.getScene('PuzzleScene');
    scene.closeModal();
  });

  const settingsButton = await screenPoint(page, 1490, 54);
  await page.mouse.click(settingsButton.x, settingsButton.y);
  const settingsActionWidths = await page.evaluate(() => {
    const scene = (
      window as unknown as {
        __BENTOKU_GAME__: { scene: { getScene(key: string): SceneState } };
      }
    ).__BENTOKU_GAME__.scene.getScene('PuzzleScene');
    const modal = scene.modal as { list?: GameObjectState[] } | undefined;
    return (
      modal?.list
        ?.filter((object) => object.list?.some((child) => typeof child.text === 'string'))
        .map((object) => object.width) ?? []
    );
  });
  expect(settingsActionWidths).toEqual([210, 210, 210, 210, 210, 210]);

  await page.goto('/?seed=CLUE-BOUNDS&difficulty=master');
  await enterInfinite(page);
  const partialLayout = await page.evaluate(() => {
    const scene = (
      window as unknown as {
        __BENTOKU_GAME__: { scene: { getScene(key: string): SceneState } };
      }
    ).__BENTOKU_GAME__.scene.getScene('PuzzleScene');
    const panel = scene.children.list.find((object) =>
      object.list?.some((child) => child.clue?.id === 'anchor-map'),
    )!;
    const partial = panel.list!.filter((child) => child.clue && child.clue.id !== 'anchor-map');
    const anchor = panel.list!.find((child) => child.clue?.id === 'anchor-map');
    return {
      anchorX: anchor?.x,
      averageX: partial.reduce((sum, clue) => sum + (clue.x ?? 0), 0) / partial.length,
      clueGridCounts: [anchor, ...partial].map(
        (clue) => clue?.list?.filter((object) => object.name === 'clue-grid').length ?? 0,
      ),
      clueCardCount: [anchor, ...partial].reduce(
        (count, clue) =>
          count + (clue?.list?.filter((object) => object.name === 'clue-card').length ?? 0),
        0,
      ),
      bottom:
        (panel.y ?? 0) + Math.max(...partial.map((clue) => (clue.y ?? 0) + (clue.height ?? 0) / 2)),
    };
  });
  expect(partialLayout.anchorX).toBe(-24);
  expect(partialLayout.averageX).toBe(-24);
  expect(partialLayout.clueGridCounts.every((count) => count === 1)).toBe(true);
  expect(partialLayout.clueCardCount).toBe(0);
  expect(partialLayout.bottom).toBeLessThanOrEqual(830);
});

test('lets the player switch deduction difficulty and preserves the choice', async ({ page }) => {
  const difficultyButton = await screenPoint(page, 1062, 54);
  await page.mouse.click(difficultyButton.x, difficultyButton.y);

  const masterButton = await screenPoint(page, 665, 613);
  await page.mouse.click(masterButton.x, masterButton.y);
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
    .toEqual({ difficulty: 'master', query: 'master', filled: 0 });

  await page.reload();
  await enterInfinite(page);
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
    .toBe('master');
});

test('keeps invalid tutorial placements recoverable and completes the guided path', async ({
  page,
}) => {
  await page.goto('/');
  await expect.poll(() => sceneTexts(page, 'MenuScene')).toContain('Infinite');
  await page.evaluate(() => localStorage.clear());
  await enterInfinite(page);
  await expect
    .poll(() =>
      page.evaluate(() => {
        const game = (
          window as unknown as {
            __BENTOKU_GAME__?: { scene: { getScene(key: string): SceneState | undefined } };
          }
        ).__BENTOKU_GAME__;
        const scene = game?.scene.getScene('PuzzleScene');
        return scene?.tutorial?.step ?? null;
      }),
    )
    .toBe('welcome');

  const visibleCopy = await sceneTexts(page);
  expect(visibleCopy).toContain('Skip tutorial');
  expect(visibleCopy).toContain('Take the tutorial');

  for (const point of [
    { x: 800, y: 521 },
    { x: 820, y: 541 },
  ]) {
    const screen = await screenPoint(page, point.x, point.y);
    await page.mouse.click(screen.x, screen.y);
  }
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          (
            window as unknown as {
              __BENTOKU_GAME__: { scene: { getScene(key: string): SceneState } };
            }
          ).__BENTOKU_GAME__.scene.getScene('PuzzleScene').tutorial?.step,
      ),
    )
    .toBe('selectFirst');

  const tutorial = await page.evaluate(() => {
    const scene = (
      window as unknown as {
        __BENTOKU_GAME__: { scene: { getScene(key: string): SceneState } };
      }
    ).__BENTOKU_GAME__.scene.getScene('PuzzleScene');
    const tutorial = scene.tutorial!;
    return {
      firstPiece: tutorial.firstPiece,
      firstCell: tutorial.firstCell,
      secondPiece: tutorial.secondPiece,
      secondCell: tutorial.secondCell,
      firstPoint: scene.pieces.get(tutorial.firstPiece)!,
      firstSlot: scene.bento.slotWorldPosition(tutorial.firstCell),
      secondPoint: scene.pieces.get(tutorial.secondPiece)!,
      secondSlot: scene.bento.slotWorldPosition(tutorial.secondCell),
    };
  });

  const firstPiece = await screenPoint(page, tutorial.firstPoint.x, tutorial.firstPoint.y);
  await page.mouse.click(firstPiece.x, firstPiece.y);
  const wrongSlotIndex = tutorial.firstCell === 8 ? 7 : tutorial.firstCell + 1;
  const wrongSlotPosition = await page.evaluate((index) => {
    const scene = (
      window as unknown as {
        __BENTOKU_GAME__: { scene: { getScene(key: string): SceneState } };
      }
    ).__BENTOKU_GAME__.scene.getScene('PuzzleScene');
    return scene.bento.slotWorldPosition(index);
  }, wrongSlotIndex);
  const wrongSlot = await screenPoint(page, wrongSlotPosition.x, wrongSlotPosition.y);
  await page.mouse.click(wrongSlot.x, wrongSlot.y);
  await expect
    .poll(() =>
      page.evaluate(() => {
        const scene = (
          window as unknown as {
            __BENTOKU_GAME__: { scene: { getScene(key: string): SceneState } };
          }
        ).__BENTOKU_GAME__.scene.getScene('PuzzleScene');
        return {
          step: scene.tutorial?.step,
          selectedPiece: scene.selectedPiece,
          board: scene.placement.board,
        };
      }),
    )
    .toEqual({
      step: 'placeFirst',
      selectedPiece: tutorial.firstPiece,
      board: Array(9).fill(null),
    });
  const firstSlot = await screenPoint(page, tutorial.firstSlot.x, tutorial.firstSlot.y);
  await page.mouse.click(firstSlot.x, firstSlot.y);

  for (const point of [
    { x: 820, y: 721 },
    { x: 820, y: 721 },
  ]) {
    const screen = await screenPoint(page, point.x, point.y);
    await page.mouse.click(screen.x, screen.y);
  }

  const secondPiece = await screenPoint(page, tutorial.secondPoint.x, tutorial.secondPoint.y);
  await page.mouse.click(secondPiece.x, secondPiece.y);
  const secondSlot = await screenPoint(page, tutorial.secondSlot.x, tutorial.secondSlot.y);
  await page.mouse.click(secondSlot.x, secondSlot.y);
  const undo = await screenPoint(page, 1362, 54);
  await page.mouse.click(undo.x, undo.y);

  const replacement = await page.evaluate((pieceId) => {
    const scene = (
      window as unknown as {
        __BENTOKU_GAME__: { scene: { getScene(key: string): SceneState } };
      }
    ).__BENTOKU_GAME__.scene.getScene('PuzzleScene');
    return scene.pieces.get(pieceId)!;
  }, tutorial.secondPiece);
  const replacementPoint = await screenPoint(page, replacement.x, replacement.y);
  await page.mouse.click(replacementPoint.x, replacementPoint.y);
  await page.mouse.click(secondSlot.x, secondSlot.y);
  const finish = await screenPoint(page, 800, 521);
  await page.mouse.click(finish.x, finish.y);

  await expect
    .poll(() =>
      page.evaluate(() => ({
        tutorialActive: Boolean(
          (
            window as unknown as {
              __BENTOKU_GAME__: { scene: { getScene(key: string): SceneState } };
            }
          ).__BENTOKU_GAME__.scene.getScene('PuzzleScene').tutorial,
        ),
        completedVersion: JSON.parse(localStorage.getItem('bentoku.save.v4') ?? '{}').tutorial
          ?.completedVersion,
      })),
    )
    .toEqual({ tutorialActive: false, completedVersion: 1 });
});

test('allows Settings during the tutorial and can skip into an empty Cozy game', async ({
  page,
}) => {
  await page.goto('/');
  await expect.poll(() => sceneTexts(page, 'MenuScene')).toContain('Infinite');
  await page.evaluate(() => localStorage.clear());
  await enterInfinite(page);
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          (
            window as unknown as {
              __BENTOKU_GAME__: { scene: { getScene(key: string): SceneState } };
            }
          ).__BENTOKU_GAME__.scene.getScene('PuzzleScene').tutorial?.step,
      ),
    )
    .toBe('welcome');

  const settingsButton = await screenPoint(page, 1490, 54);
  await page.mouse.click(settingsButton.x, settingsButton.y);
  await expect.poll(() => sceneTexts(page)).toContain('Settings');
  await page.evaluate(() => {
    const scene = (
      window as unknown as {
        __BENTOKU_GAME__: { scene: { getScene(key: string): SceneState & { closeModal(): void } } };
      }
    ).__BENTOKU_GAME__.scene.getScene('PuzzleScene');
    scene.closeModal();
  });

  const skip = await screenPoint(page, 990, 359);
  await page.mouse.click(skip.x, skip.y);
  await expect.poll(() => sceneTexts(page)).toContain('Skip the tutorial?');
  const confirmSkip = await screenPoint(page, 935, 527);
  await page.mouse.click(confirmSkip.x, confirmSkip.y);

  await expect
    .poll(() =>
      page.evaluate(() => {
        const scene = (
          window as unknown as {
            __BENTOKU_GAME__: { scene: { getScene(key: string): SceneState } };
          }
        ).__BENTOKU_GAME__.scene.getScene('PuzzleScene');
        return {
          tutorial: Boolean(scene.tutorial),
          difficulty: scene.puzzle.difficulty,
          board: scene.placement.board,
          completedVersion: JSON.parse(localStorage.getItem('bentoku.save.v4') ?? '{}').tutorial
            ?.completedVersion,
        };
      }),
    )
    .toEqual({
      tutorial: false,
      difficulty: 'cozy',
      board: Array(9).fill(null),
      completedVersion: 1,
    });
});

test('localizes Settings, difficulty guidance, and Help without translating level names', async ({
  page,
}) => {
  const settingsButton = await screenPoint(page, 1490, 54);
  await page.mouse.click(settingsButton.x, settingsButton.y);
  const languageButton = await screenPoint(page, 665, 781);
  await page.mouse.click(languageButton.x, languageButton.y);

  await expect
    .poll(() =>
      page.evaluate(() => {
        const scene = (
          window as unknown as {
            __BENTOKU_GAME__: { scene: { getScene(key: string): SceneState } };
          }
        ).__BENTOKU_GAME__.scene.getScene('PuzzleScene');
        return {
          documentLanguage: document.documentElement.lang,
          sceneLanguage: scene.settings.language,
          savedLanguage: JSON.parse(localStorage.getItem('bentoku.save.v4') ?? '{}').settings
            ?.language,
          hasRussianTitle: (() => {
            const collect = (object: GameObjectState): string[] => [
              ...(object.text ? [object.text] : []),
              ...(object.list?.flatMap(collect) ?? []),
            ];
            return scene.children.list.flatMap(collect).includes('Настройки');
          })(),
        };
      }),
    )
    .toEqual({
      documentLanguage: 'en',
      sceneLanguage: 'ru',
      savedLanguage: 'ru',
      hasRussianTitle: true,
    });

  const mainAndSettingsCopy = await sceneTexts(page);
  expect(mainAndSettingsCopy).toContain('BENTO FRIENDS');
  expect(mainAndSettingsCopy).not.toContain('ДРУЗЬЯ БЕНТО');
  await page.evaluate(() => {
    const scene = (
      window as unknown as {
        __BENTOKU_GAME__: { scene: { getScene(key: string): SceneState & { closeModal(): void } } };
      }
    ).__BENTOKU_GAME__.scene.getScene('PuzzleScene');
    scene.closeModal();
  });

  const difficultyButton = await screenPoint(page, 1062, 54);
  await page.mouse.click(difficultyButton.x, difficultyButton.y);
  const difficultyCopy = await sceneTexts(page);
  expect(difficultyCopy).toContain('Выберите уровень сложности');
  expect(difficultyCopy).toContain('Cozy');
  expect(difficultyCopy).toContain('Gentle');
  expect(difficultyCopy).toContain('Clever');
  expect(difficultyCopy).toContain('Tricky');
  expect(difficultyCopy).toContain('Master');
  expect(difficultyCopy).not.toContain('Уютный');
  expect(difficultyCopy).not.toContain('Спокойный');
  await page.evaluate(() => {
    const scene = (
      window as unknown as {
        __BENTOKU_GAME__: { scene: { getScene(key: string): SceneState & { closeModal(): void } } };
      }
    ).__BENTOKU_GAME__.scene.getScene('PuzzleScene');
    scene.closeModal();
  });

  const helpButton = await screenPoint(page, 1426, 54);
  await page.mouse.click(helpButton.x, helpButton.y);
  const helpCopy = await sceneTexts(page);
  expect(helpCopy).not.toContain('Записка из кафе');
  expect(helpCopy).not.toContain('Объяснить');
  expect(helpCopy).not.toContain('Намекнуть');
  expect(helpCopy).toContain('Обучение');
  expect(helpCopy).toContain('Открыть одну');
  await page.keyboard.press('Escape');
  await expect.poll(() => sceneTexts(page)).not.toContain('Обучение');

  const historyButton = await screenPoint(page, 790, 54);
  await page.mouse.click(historyButton.x, historyButton.y);
  const historyCopy = await sceneTexts(page);
  expect(historyCopy).toContain('История игр');
  expect(historyCopy).toContain('Gentle');
  expect(historyCopy).not.toContain('Спокойный');
});

test('starts Master Rush at 1:45 and removes Reveal from timed help', async ({ page }) => {
  const rushButton = await screenPoint(page, 1270, 54);
  await page.mouse.click(rushButton.x, rushButton.y);
  const startButton = await screenPoint(page, 800, 527);
  await page.mouse.click(startButton.x, startButton.y);

  const countdownValues: string[] = [];
  await expect
    .poll(
      async () => {
        const state = await page.evaluate(() => {
          const scene = (
            window as unknown as {
              __BENTOKU_GAME__: { scene: { getScene(key: string): SceneState } };
            }
          ).__BENTOKU_GAME__.scene.getScene('PuzzleScene');
          return {
            values:
              scene.countdown?.list
                .map((object) => object.text)
                .filter((text): text is string => typeof text === 'string') ?? [],
            timerState: scene.timer?.state,
          };
        });
        for (const value of state.values) {
          if (countdownValues.at(-1) !== value) countdownValues.push(value);
        }
        return state.timerState === 'running';
      },
      { timeout: SCENE_READY_TIMEOUT, intervals: [100] },
    )
    .toBe(true);
  expect(countdownValues).toEqual(['3', '2', '1']);

  await expect
    .poll(
      () =>
        page.evaluate(() => {
          const scene = (
            window as unknown as {
              __BENTOKU_GAME__: { scene: { getScene(key: string): SceneState } };
            }
          ).__BENTOKU_GAME__.scene.getScene('PuzzleScene');
          return {
            mode: scene.mode,
            difficulty: scene.puzzle.difficulty,
            state: scene.timer?.state,
            remainingMs: scene.timer?.remainingMs ?? 0,
          };
        }),
      { timeout: SCENE_READY_TIMEOUT },
    )
    .toMatchObject({ mode: 'timed', difficulty: 'master', state: 'running' });

  const remainingMs = await page.evaluate(() => {
    const scene = (
      window as unknown as {
        __BENTOKU_GAME__: { scene: { getScene(key: string): SceneState } };
      }
    ).__BENTOKU_GAME__.scene.getScene('PuzzleScene');
    return scene.timer!.remainingMs;
  });
  expect(remainingMs).toBeLessThanOrEqual(105_000);
  expect(remainingMs).toBeGreaterThan(100_000);
  await expect
    .poll(async () => (await sceneTexts(page)).some((text) => /^TIME 1:4[45]$/.test(text)), {
      timeout: SCENE_READY_TIMEOUT,
    })
    .toBe(true);

  const helpButton = await screenPoint(page, 1426, 54);
  await page.mouse.click(helpButton.x, helpButton.y);
  const helpCopy = await sceneTexts(page);
  expect(helpCopy).not.toContain('Reveal one');
  expect(helpCopy).toContain('Tutorial');
  expect(helpCopy.some((text) => text.includes('Replay the guided Cozy lesson'))).toBe(true);
});
