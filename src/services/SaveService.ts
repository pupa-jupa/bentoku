import {
  CAMPAIGN_ORDERS,
  firstIncompleteCampaignOrder,
  getNextCampaignOrder,
  isCampaignOrderId,
  type CampaignOrderId,
} from '../campaign/campaignData';
import type { PlayContext } from '../game/playContext';
import type { CampaignStoryEventId } from '../campaign/storyData';
import { parseDifficulty } from '../puzzle/DifficultyEvaluator';
import {
  emptyBoard,
  toBoard,
  type Difficulty,
  type GameMode,
  type Language,
  type PlayerSettings,
  type SaveData,
} from '../puzzle/types';

const STORAGE_KEY = 'bentoku.save.v3';
const VERSION_2_STORAGE_KEY = 'bentoku.save.v2';
const VERSION_1_STORAGE_KEY = 'bentoku.save.v1';
const DEFAULT_SOUND_VOLUME = 1;
const DEFAULT_MUSIC_VOLUME = 0.5;
const AUDIO_DEFAULTS_VERSION = 1;
export const TUTORIAL_VERSION = 1;

const clampVolume = (value: unknown, fallback: number): number =>
  typeof value === 'number' && Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : fallback;

const parseLanguage = (value: unknown): Language => (value === 'ru' ? 'ru' : 'en');
const parseMode = (value: unknown): GameMode => (value === 'timed' ? 'timed' : 'standard');
const parseSource = (
  value: unknown,
  fallback: 'infinite' | 'rush' = 'infinite',
): 'infinite' | 'campaign' | 'rush' =>
  value === 'campaign' || value === 'rush' || value === 'infinite' ? value : fallback;
const finiteNonNegative = (value: unknown, fallback = 0): number =>
  typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : fallback;
const stringArray = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((entry): entry is string => typeof entry === 'string') : [];

const defaults = (): SaveData => ({
  version: 3,
  settings: {
    language: 'en',
    audioDefaultsVersion: AUDIO_DEFAULTS_VERSION,
    sound: true,
    soundVolume: DEFAULT_SOUND_VOLUME,
    musicVolume: DEFAULT_MUSIC_VOLUME,
    reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    hintMode: true,
    difficulty: 'gentle',
    mode: 'standard',
  },
  tutorial: { completedVersion: 0 },
  campaign: {
    completedOrderIds: [],
    currentOrderId: CAMPAIGN_ORDERS[0]!.id,
  },
  album: { achievements: [], viewedStories: [] },
  appearance: { background: 'standard', pieces: 'standard' },
  stats: {
    solved: 0,
    timed: { attempts: 0, wins: 0, bestRemainingMs: 0 },
  },
});

type StoredRecord = Record<string, unknown>;

const asRecord = (value: unknown): StoredRecord =>
  value && typeof value === 'object' ? (value as StoredRecord) : {};

export class SaveService {
  private data: SaveData;

  constructor() {
    this.data = this.load();
    this.persist();
  }

  private load(): SaveData {
    const fallback = defaults();
    try {
      const raw =
        localStorage.getItem(STORAGE_KEY) ??
        localStorage.getItem(VERSION_2_STORAGE_KEY) ??
        localStorage.getItem(VERSION_1_STORAGE_KEY);
      if (!raw) return fallback;
      const parsed = asRecord(JSON.parse(raw));
      const settings = asRecord(parsed.settings);
      const stats = asRecord(parsed.stats);
      const timed = asRecord(stats.timed);
      const tutorial = asRecord(parsed.tutorial);
      const campaign = asRecord(parsed.campaign);
      const album = asRecord(parsed.album);
      const current = asRecord(parsed.currentPuzzle);
      const difficulty = parseDifficulty(String(settings.difficulty ?? '')) ?? 'gentle';
      const currentDifficulty = parseDifficulty(String(current.difficulty ?? ''));
      const currentBoard = Array.isArray(current.board) ? current.board : undefined;
      const currentMode = parseMode(current.mode);
      const currentSource = parseSource(
        current.source,
        currentMode === 'timed' ? 'rush' : 'infinite',
      );
      const currentCampaignOrderId = isCampaignOrderId(current.campaignOrderId)
        ? current.campaignOrderId
        : undefined;
      const currentPuzzle =
        typeof current.seed === 'string' &&
        currentDifficulty &&
        currentBoard?.length === 9 &&
        (currentSource !== 'campaign' || currentCampaignOrderId)
          ? {
              seed: current.seed,
              difficulty: currentDifficulty,
              mode: currentMode,
              source: currentSource,
              ...(currentCampaignOrderId ? { campaignOrderId: currentCampaignOrderId } : {}),
              board: toBoard(currentBoard),
              moves: finiteNonNegative(current.moves),
            }
          : undefined;

      const completedOrderIds = stringArray(campaign.completedOrderIds).filter(isCampaignOrderId);
      const completedSet = new Set(completedOrderIds);
      const storedCurrentOrderId = isCampaignOrderId(campaign.currentOrderId)
        ? campaign.currentOrderId
        : undefined;
      const storedIndex = storedCurrentOrderId
        ? CAMPAIGN_ORDERS.findIndex((order) => order.id === storedCurrentOrderId)
        : -1;
      const storedOrderIsUnlocked =
        storedIndex === 0 ||
        (storedIndex > 0 && completedSet.has(CAMPAIGN_ORDERS[storedIndex - 1]!.id));
      const currentOrderId =
        storedCurrentOrderId && storedOrderIsUnlocked
          ? storedCurrentOrderId
          : firstIncompleteCampaignOrder(completedSet).id;

      return {
        version: 3,
        settings: {
          language: parseLanguage(settings.language),
          audioDefaultsVersion: AUDIO_DEFAULTS_VERSION,
          sound: typeof settings.sound === 'boolean' ? settings.sound : fallback.settings.sound,
          soundVolume: clampVolume(settings.soundVolume, DEFAULT_SOUND_VOLUME),
          musicVolume:
            finiteNonNegative(settings.audioDefaultsVersion) >= AUDIO_DEFAULTS_VERSION
              ? clampVolume(
                  settings.musicVolume,
                  settings.sound === false ? 0 : DEFAULT_MUSIC_VOLUME,
                )
              : DEFAULT_MUSIC_VOLUME,
          reducedMotion:
            typeof settings.reducedMotion === 'boolean'
              ? settings.reducedMotion
              : fallback.settings.reducedMotion,
          hintMode:
            typeof settings.hintMode === 'boolean' ? settings.hintMode : fallback.settings.hintMode,
          difficulty,
          mode: parseMode(settings.mode),
        },
        currentPuzzle,
        tutorial: {
          completedVersion: finiteNonNegative(tutorial.completedVersion),
        },
        campaign: { completedOrderIds, currentOrderId },
        album: {
          achievements: stringArray(album.achievements),
          viewedStories: stringArray(album.viewedStories),
        },
        appearance: { background: 'standard', pieces: 'standard' },
        stats: {
          solved: finiteNonNegative(stats.solved),
          timed: {
            attempts: finiteNonNegative(timed.attempts),
            wins: finiteNonNegative(timed.wins),
            bestRemainingMs: finiteNonNegative(timed.bestRemainingMs),
          },
        },
      };
    } catch {
      return fallback;
    }
  }

  private persist(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
    } catch {
      // The game remains playable when storage is unavailable or full.
    }
  }

  get settings(): PlayerSettings {
    return { ...this.data.settings };
  }

  get solvedCount(): number {
    return this.data.stats.solved;
  }

  get timedStats(): Readonly<SaveData['stats']['timed']> {
    return { ...this.data.stats.timed };
  }

  get currentSeed(): string | undefined {
    return this.data.currentPuzzle?.seed;
  }

  get currentDifficulty(): Difficulty | undefined {
    return parseDifficulty(this.data.currentPuzzle?.difficulty);
  }

  get currentMode(): GameMode | undefined {
    return this.data.currentPuzzle?.mode;
  }

  get currentSource(): 'infinite' | 'campaign' | 'rush' | undefined {
    return this.data.currentPuzzle?.source;
  }

  get currentPuzzleCampaignOrderId(): CampaignOrderId | undefined {
    return this.data.currentPuzzle?.campaignOrderId;
  }

  get tutorialCompleted(): boolean {
    return this.data.tutorial.completedVersion >= TUTORIAL_VERSION;
  }

  get completedCampaignOrderIds(): readonly CampaignOrderId[] {
    return [...this.data.campaign.completedOrderIds];
  }

  get selectedCampaignOrderId(): CampaignOrderId {
    return this.data.campaign.currentOrderId;
  }

  get viewedCampaignStoryIds(): readonly CampaignStoryEventId[] {
    return this.data.album.viewedStories.filter((entry): entry is CampaignStoryEventId =>
      /^chapter-[1-5]:(intro|complete)$/.test(entry),
    );
  }

  hasViewedCampaignStory(storyId: CampaignStoryEventId): boolean {
    return this.data.album.viewedStories.includes(storyId);
  }

  loadPuzzle(
    seed: string,
    difficulty: Difficulty,
    mode: GameMode = 'standard',
    context?: PlayContext,
  ): { board: ReturnType<typeof emptyBoard>; moves: number } {
    const current = this.data.currentPuzzle;
    const source = context?.source ?? (mode === 'timed' ? 'rush' : 'infinite');
    if (
      !current ||
      current.seed !== seed ||
      current.difficulty !== difficulty ||
      current.mode !== mode ||
      current.source !== source ||
      (source === 'campaign' && current.campaignOrderId !== context?.campaignOrderId)
    ) {
      return { board: emptyBoard(), moves: 0 };
    }
    return { board: toBoard(current.board), moves: current.moves };
  }

  savePuzzle(
    seed: string,
    difficulty: Difficulty,
    board: ReturnType<typeof emptyBoard>,
    moves: number,
    mode: GameMode = 'standard',
    context?: PlayContext,
  ): void {
    const source = context?.source ?? (mode === 'timed' ? 'rush' : 'infinite');
    this.data.currentPuzzle = {
      seed,
      difficulty,
      mode,
      source,
      ...(source === 'campaign' && context?.campaignOrderId
        ? { campaignOrderId: context.campaignOrderId }
        : {}),
      board: toBoard(board),
      moves,
    };
    this.persist();
  }

  updateSettings(settings: Partial<PlayerSettings>): PlayerSettings {
    this.data.settings = {
      ...this.data.settings,
      ...settings,
      language: settings.language ? parseLanguage(settings.language) : this.data.settings.language,
      difficulty:
        parseDifficulty(settings.difficulty) ??
        parseDifficulty(this.data.settings.difficulty) ??
        'gentle',
      mode: settings.mode ? parseMode(settings.mode) : this.data.settings.mode,
      soundVolume: clampVolume(settings.soundVolume, this.data.settings.soundVolume),
      musicVolume: clampVolume(settings.musicVolume, this.data.settings.musicVolume),
    };
    this.persist();
    return this.settings;
  }

  completeTutorial(): void {
    this.data.tutorial.completedVersion = TUTORIAL_VERSION;
    this.persist();
  }

  selectCampaignOrder(orderId: CampaignOrderId): void {
    const completed = new Set(this.data.campaign.completedOrderIds);
    const index = CAMPAIGN_ORDERS.findIndex((order) => order.id === orderId);
    if (index > 0 && !completed.has(CAMPAIGN_ORDERS[index - 1]!.id)) return;
    this.data.campaign.currentOrderId = orderId;
    this.persist();
  }

  completeCampaignOrder(orderId: CampaignOrderId): void {
    if (!this.data.campaign.completedOrderIds.includes(orderId)) {
      this.data.campaign.completedOrderIds.push(orderId);
    }
    this.data.campaign.currentOrderId = getNextCampaignOrder(orderId)?.id ?? orderId;
    delete this.data.currentPuzzle;
    this.persist();
  }

  markCampaignStoryViewed(storyId: CampaignStoryEventId): void {
    if (!this.data.album.viewedStories.includes(storyId)) {
      this.data.album.viewedStories.push(storyId);
      this.persist();
    }
  }

  startTimedAttempt(): void {
    this.data.stats.timed.attempts += 1;
    this.persist();
  }

  markSolved(mode: GameMode = 'standard', remainingMs = 0): void {
    this.data.stats.solved += 1;
    if (mode === 'timed') {
      this.data.stats.timed.wins += 1;
      this.data.stats.timed.bestRemainingMs = Math.max(
        this.data.stats.timed.bestRemainingMs,
        finiteNonNegative(remainingMs),
      );
    }
    delete this.data.currentPuzzle;
    this.persist();
  }
}
