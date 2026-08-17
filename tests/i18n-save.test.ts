import { beforeEach, describe, expect, it, vi } from 'vitest';
import { I18nService } from '../src/i18n/I18nService';
import { SaveService } from '../src/services/SaveService';

class MemoryStorage {
  private values = new Map<string, string>();

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }

  clear(): void {
    this.values.clear();
  }
}

describe('localization and save migration', () => {
  let storage: MemoryStorage;

  beforeEach(() => {
    storage = new MemoryStorage();
    vi.stubGlobal('localStorage', storage);
    vi.stubGlobal('window', { matchMedia: () => ({ matches: false }) });
  });

  it('uses English by default and persists an explicit Russian choice', () => {
    const first = new SaveService();
    expect(first.settings).toMatchObject({ language: 'en', musicVolume: 0.5 });
    expect(JSON.parse(storage.getItem('bentoku.save.v3') ?? '{}').version).toBe(3);
    first.updateSettings({ language: 'ru' });
    expect(new SaveService().settings.language).toBe('ru');
  });

  it('migrates the previous music default to 50% only once', () => {
    storage.setItem(
      'bentoku.save.v2',
      JSON.stringify({
        version: 2,
        settings: { language: 'en', difficulty: 'gentle', musicVolume: 1 },
      }),
    );
    const migrated = new SaveService();
    expect(migrated.settings).toMatchObject({ musicVolume: 0.5, audioDefaultsVersion: 1 });
    migrated.updateSettings({ musicVolume: 0.8 });
    expect(new SaveService().settings.musicVolume).toBe(0.8);
  });

  it('migrates legacy display-value difficulties to neutral IDs', () => {
    storage.setItem(
      'bentoku.save.v1',
      JSON.stringify({
        version: 1,
        settings: { difficulty: 'Master' },
        currentPuzzle: {
          seed: 'BENTO-TEST-SEED',
          difficulty: 'Gentle',
          board: Array(9).fill(null),
          moves: 3,
        },
        stats: { solved: 4 },
      }),
    );
    const save = new SaveService();
    expect(save.settings).toMatchObject({ language: 'en', difficulty: 'master', mode: 'standard' });
    expect(save.currentDifficulty).toBe('gentle');
    expect(save.solvedCount).toBe(4);
    expect(save.tutorialCompleted).toBe(false);
  });

  it('formats English and Russian counters from the same internal data', () => {
    const i18n = new I18nService('en');
    expect(i18n.moves(1)).toBe('1 move');
    expect(i18n.moves(5)).toBe('5 moves');
    i18n.setLanguage('ru');
    expect(i18n.moves(1)).toBe('1 ход');
    expect(i18n.moves(2)).toBe('2 хода');
    expect(i18n.moves(5)).toBe('5 ходов');
  });

  it('migrates version 2 progress and ignores corrupt campaign IDs', () => {
    storage.setItem(
      'bentoku.save.v2',
      JSON.stringify({
        version: 2,
        settings: { language: 'ru', difficulty: 'clever', audioDefaultsVersion: 1 },
        tutorial: { completedVersion: 1 },
        currentPuzzle: {
          seed: 'OLD-INFINITE',
          difficulty: 'clever',
          mode: 'standard',
          board: Array(9).fill(null),
          moves: 4,
        },
        stats: { solved: 7, timed: { attempts: 3, wins: 2, bestRemainingMs: 11_000 } },
      }),
    );
    const migrated = new SaveService();
    expect(migrated.settings).toMatchObject({ language: 'ru', difficulty: 'clever' });
    expect(migrated.tutorialCompleted).toBe(true);
    expect(migrated.solvedCount).toBe(7);
    expect(migrated.timedStats).toEqual({ attempts: 3, wins: 2, bestRemainingMs: 11_000 });
    expect(migrated.currentSource).toBe('infinite');
    expect(migrated.selectedCampaignOrderId).toBe('chapter-1-order-1');
    expect(migrated.completedCampaignOrderIds).toEqual([]);

    const stored = JSON.parse(storage.getItem('bentoku.save.v3') ?? '{}');
    stored.campaign = {
      completedOrderIds: ['chapter-1-order-1', 'not-a-real-order'],
      currentOrderId: 'also-corrupt',
    };
    storage.setItem('bentoku.save.v3', JSON.stringify(stored));
    const recovered = new SaveService();
    expect(recovered.completedCampaignOrderIds).toEqual(['chapter-1-order-1']);
    expect(recovered.selectedCampaignOrderId).toBe('chapter-1-order-2');
  });

  it('stamps an order and advances campaign progress without unlocking out of sequence', () => {
    const save = new SaveService();
    save.selectCampaignOrder('chapter-2-order-1');
    expect(save.selectedCampaignOrderId).toBe('chapter-1-order-1');
    save.completeCampaignOrder('chapter-1-order-1');
    expect(save.completedCampaignOrderIds).toEqual(['chapter-1-order-1']);
    expect(save.selectedCampaignOrderId).toBe('chapter-1-order-2');
    save.selectCampaignOrder('chapter-1-order-2');
    expect(new SaveService().selectedCampaignOrderId).toBe('chapter-1-order-2');
  });
});
