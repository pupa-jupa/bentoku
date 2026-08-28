import { beforeEach, describe, expect, it, vi } from 'vitest';
import { emptyBoard } from '../src/puzzle/types';
import { MAX_GAME_HISTORY_ENTRIES, SaveService } from '../src/services/SaveService';

class MemoryStorage {
  private values = new Map<string, string>();

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }
}

describe('saved game history', () => {
  let storage: MemoryStorage;

  beforeEach(() => {
    storage = new MemoryStorage();
    vi.stubGlobal('localStorage', storage);
    vi.stubGlobal('window', { matchMedia: () => ({ matches: false }) });
  });

  it('migrates a legacy active puzzle without inventing elapsed history', () => {
    storage.setItem(
      'bentoku.save.v3',
      JSON.stringify({
        version: 3,
        settings: { difficulty: 'gentle', audioDefaultsVersion: 1 },
        currentPuzzle: {
          seed: 'LEGACY-GAME',
          difficulty: 'gentle',
          mode: 'standard',
          source: 'infinite',
          board: Array(9).fill(null),
          moves: 4,
        },
      }),
    );

    const before = Date.now();
    const save = new SaveService();
    expect(save.activeGame).toMatchObject({
      seed: 'LEGACY-GAME',
      moves: 4,
      elapsedMs: 0,
    });
    expect(save.activeGame?.attemptId).toBeTruthy();
    expect(save.activeGame?.startedAt).toBeGreaterThanOrEqual(before);
    expect(save.gameHistory).toEqual([]);
    expect(JSON.parse(storage.getItem('bentoku.save.v4') ?? '{}').version).toBe(4);
  });

  it('records the active attempt before clearing it on completion', () => {
    const save = new SaveService();
    const active = save.loadPuzzle('HISTORY-ONE', 'clever');
    save.savePuzzle('HISTORY-ONE', 'clever', emptyBoard(), 12, 'standard', undefined, {
      attemptId: active.attemptId,
      startedAt: 1_750_000_000_000,
      elapsedMs: 42_000,
    });

    save.markSolved('standard', 0, 45_500, 13);

    expect(save.activeGame).toBeUndefined();
    expect(save.gameHistory).toEqual([
      expect.objectContaining({
        attemptId: active.attemptId,
        startedAt: 1_750_000_000_000,
        seed: 'HISTORY-ONE',
        difficulty: 'clever',
        durationMs: 45_500,
        moves: 13,
      }),
    ]);
    expect(new SaveService().gameHistory).toEqual(save.gameHistory);
  });

  it('starts replay as a fresh attempt and caps completed history', () => {
    const save = new SaveService();
    let lastAttemptId = '';

    for (let index = 0; index < MAX_GAME_HISTORY_ENTRIES + 4; index += 1) {
      const seed = `HISTORY-${index}`;
      const active = save.loadPuzzle(seed, 'cozy', 'standard', undefined, false);
      lastAttemptId = active.attemptId;
      save.savePuzzle(seed, 'cozy', emptyBoard(), index, 'standard', undefined, {
        attemptId: active.attemptId,
        startedAt: 1_750_000_000_000 + index,
        elapsedMs: index * 1_000,
      });
      save.markSolved('standard', 0, index * 1_000, index);
    }

    expect(save.gameHistory).toHaveLength(MAX_GAME_HISTORY_ENTRIES);
    expect(save.gameHistory[0]?.attemptId).toBe(lastAttemptId);
    expect(save.gameHistory.at(-1)?.seed).toBe('HISTORY-4');

    const replay = save.loadPuzzle('HISTORY-103', 'cozy', 'standard', undefined, false);
    expect(replay.board).toEqual(emptyBoard());
    expect(replay.moves).toBe(0);
    expect(replay.attemptId).not.toBe(lastAttemptId);
  });

  it('discards malformed rows without losing valid history', () => {
    new SaveService();
    const stored = JSON.parse(storage.getItem('bentoku.save.v4') ?? '{}');
    stored.history = [
      { seed: 'MISSING-FIELDS' },
      {
        attemptId: 'valid-attempt',
        startedAt: 1_750_000_000_000,
        seed: 'VALID-HISTORY',
        difficulty: 'gentle',
        mode: 'standard',
        source: 'infinite',
        durationMs: 8_000,
        moves: 3,
      },
      {
        attemptId: 'bad-campaign',
        startedAt: 1,
        seed: 'BAD-CAMPAIGN',
        difficulty: 'gentle',
        mode: 'standard',
        source: 'campaign',
        durationMs: 1,
        moves: 1,
      },
    ];
    storage.setItem('bentoku.save.v4', JSON.stringify(stored));

    expect(new SaveService().gameHistory).toEqual([
      expect.objectContaining({ attemptId: 'valid-attempt', seed: 'VALID-HISTORY' }),
    ]);
  });
});
