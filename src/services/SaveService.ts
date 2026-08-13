import { emptyBoard, toBoard, type PlayerSettings, type SaveData } from '../puzzle/types';

const STORAGE_KEY = 'bentoku.save.v1';

const defaults = (): SaveData => ({
  version: 1,
  settings: {
    sound: true,
    reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    hintMode: true,
  },
  stats: { solved: 0 },
});

export class SaveService {
  private data: SaveData;

  constructor() {
    this.data = this.load();
  }

  private load(): SaveData {
    try {
      const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '') as Partial<SaveData>;
      if (parsed.version !== 1) return defaults();
      return {
        ...defaults(),
        ...parsed,
        settings: { ...defaults().settings, ...parsed.settings },
        stats: { ...defaults().stats, ...parsed.stats },
      };
    } catch {
      return defaults();
    }
  }

  private persist(): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
  }

  get settings(): PlayerSettings {
    return { ...this.data.settings };
  }

  get solvedCount(): number {
    return this.data.stats.solved;
  }

  get currentSeed(): string | undefined {
    return this.data.currentPuzzle?.seed;
  }

  loadPuzzle(seed: string): { board: ReturnType<typeof emptyBoard>; moves: number } {
    const current = this.data.currentPuzzle;
    if (!current || current.seed !== seed) return { board: emptyBoard(), moves: 0 };
    return { board: toBoard(current.board), moves: current.moves };
  }

  savePuzzle(seed: string, board: ReturnType<typeof emptyBoard>, moves: number): void {
    this.data.currentPuzzle = { seed, board: toBoard(board), moves };
    this.persist();
  }

  updateSettings(settings: Partial<PlayerSettings>): PlayerSettings {
    this.data.settings = { ...this.data.settings, ...settings };
    this.persist();
    return this.settings;
  }

  markSolved(): void {
    this.data.stats.solved += 1;
    delete this.data.currentPuzzle;
    this.persist();
  }
}
