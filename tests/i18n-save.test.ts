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
});
