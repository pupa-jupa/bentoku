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
import { DEFAULT_MUSIC_TRACK_KEY, isMusicTrackKey } from './AssetRegistry';
import {
  emptyBoard,
  toBoard,
  type Difficulty,
  type GameHistoryEntry,
  type GameMode,
  type GameSource,
  type Language,
  type PlayerSettings,
  type SaveData,
  type SavedPuzzleAttempt,
} from '../puzzle/types';

const STORAGE_KEY = 'bentoku.save.v4';
const VERSION_3_STORAGE_KEY = 'bentoku.save.v3';
const VERSION_2_STORAGE_KEY = 'bentoku.save.v2';
const VERSION_1_STORAGE_KEY = 'bentoku.save.v1';
const DEFAULT_SOUND_VOLUME = 1;
const DEFAULT_MUSIC_VOLUME = 0.5;
const AUDIO_DEFAULTS_VERSION = 1;
export const TUTORIAL_VERSION = 1;
export const MAX_GAME_HISTORY_ENTRIES = 100;

const clampVolume = (value: unknown, fallback: number): number =>
  typeof value === 'number' && Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : fallback;

const parseLanguage = (value: unknown): Language => (value === 'ru' ? 'ru' : 'en');
const parseMode = (value: unknown): GameMode => (value === 'timed' ? 'timed' : 'standard');
const parseSource = (value: unknown, fallback: 'infinite' | 'rush' = 'infinite'): GameSource =>
  value === 'campaign' || value === 'rush' || value === 'infinite' ? value : fallback;
const finiteNonNegative = (value: unknown, fallback = 0): number =>
  typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : fallback;
const finitePositive = (value: unknown, fallback: number): number =>
  typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : fallback;
const stringArray = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((entry): entry is string => typeof entry === 'string') : [];

let fallbackAttemptSequence = 0;
const createAttemptId = (): string => {
  const randomId = globalThis.crypto?.randomUUID?.();
  if (randomId) return randomId;
  fallbackAttemptSequence += 1;
  return `attempt-${Date.now().toString(36)}-${fallbackAttemptSequence.toString(36)}`;
};

const defaults = (): SaveData => ({
  version: 4,
  history: [],
  settings: {
    language: 'en',
    audioDefaultsVersion: AUDIO_DEFAULTS_VERSION,
    sound: true,
    soundVolume: DEFAULT_SOUND_VOLUME,
    musicVolume: DEFAULT_MUSIC_VOLUME,
    musicTrackKey: DEFAULT_MUSIC_TRACK_KEY,
    nightDim: 0,
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

const parsePlayerSettings = (value: unknown, fallback: PlayerSettings): PlayerSettings => {
  const settings = asRecord(value);
  const difficulty = parseDifficulty(String(settings.difficulty ?? '')) ?? fallback.difficulty;
  return {
    language: parseLanguage(settings.language),
    audioDefaultsVersion: AUDIO_DEFAULTS_VERSION,
    sound: typeof settings.sound === 'boolean' ? settings.sound : fallback.sound,
    soundVolume: clampVolume(settings.soundVolume, fallback.soundVolume),
    musicVolume:
      finiteNonNegative(settings.audioDefaultsVersion) >= AUDIO_DEFAULTS_VERSION
        ? clampVolume(settings.musicVolume, settings.sound === false ? 0 : fallback.musicVolume)
        : DEFAULT_MUSIC_VOLUME,
    musicTrackKey: isMusicTrackKey(settings.musicTrackKey)
      ? settings.musicTrackKey
      : DEFAULT_MUSIC_TRACK_KEY,
    nightDim: clampVolume(settings.nightDim, fallback.nightDim),
    reducedMotion:
      typeof settings.reducedMotion === 'boolean' ? settings.reducedMotion : fallback.reducedMotion,
    hintMode: typeof settings.hintMode === 'boolean' ? settings.hintMode : fallback.hintMode,
    difficulty,
    mode: parseMode(settings.mode),
  };
};

type StoredRecord = Record<string, unknown>;

const asRecord = (value: unknown): StoredRecord =>
  value && typeof value === 'object' ? (value as StoredRecord) : {};

const parseHistoryEntry = (value: unknown): GameHistoryEntry | undefined => {
  const entry = asRecord(value);
  const difficulty = parseDifficulty(String(entry.difficulty ?? ''));
  const mode = parseMode(entry.mode);
  const source = parseSource(entry.source, mode === 'timed' ? 'rush' : 'infinite');
  const campaignOrderId = isCampaignOrderId(entry.campaignOrderId)
    ? entry.campaignOrderId
    : undefined;
  if (
    typeof entry.attemptId !== 'string' ||
    entry.attemptId.length === 0 ||
    typeof entry.seed !== 'string' ||
    entry.seed.length === 0 ||
    !difficulty ||
    (source === 'campaign' && !campaignOrderId)
  ) {
    return undefined;
  }
  return {
    attemptId: entry.attemptId,
    startedAt: finitePositive(entry.startedAt, Date.now()),
    seed: entry.seed,
    difficulty,
    mode,
    source,
    ...(campaignOrderId ? { campaignOrderId } : {}),
    durationMs: finiteNonNegative(entry.durationMs),
    moves: finiteNonNegative(entry.moves),
  };
};

export class SaveService {
  private data: SaveData;

  constructor() {
    this.data = this.load();
    this.persist(false);
  }

  private load(): SaveData {
    const fallback = defaults();
    try {
      const raw =
        localStorage.getItem(STORAGE_KEY) ??
        localStorage.getItem(VERSION_3_STORAGE_KEY) ??
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
      const loadedAt = Date.now();
      const currentPuzzle =
        typeof current.seed === 'string' &&
        currentDifficulty &&
        currentBoard?.length === 9 &&
        (currentSource !== 'campaign' || currentCampaignOrderId)
          ? {
              attemptId:
                typeof current.attemptId === 'string' && current.attemptId.length > 0
                  ? current.attemptId
                  : createAttemptId(),
              startedAt: finitePositive(current.startedAt, loadedAt),
              elapsedMs: finiteNonNegative(current.elapsedMs),
              seed: current.seed,
              difficulty: currentDifficulty,
              mode: currentMode,
              source: currentSource,
              ...(currentCampaignOrderId ? { campaignOrderId: currentCampaignOrderId } : {}),
              board: toBoard(currentBoard),
              moves: finiteNonNegative(current.moves),
            }
          : undefined;

      const history = (Array.isArray(parsed.history) ? parsed.history : [])
        .map(parseHistoryEntry)
        .filter((entry): entry is GameHistoryEntry => Boolean(entry))
        .slice(0, MAX_GAME_HISTORY_ENTRIES);

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
        version: 4,
        history,
        settings: parsePlayerSettings(settings, { ...fallback.settings, difficulty }),
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

  private persist(preserveStoredSettings = true): void {
    try {
      if (preserveStoredSettings) this.syncStoredSettings();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
    } catch {
      // The game remains playable when storage is unavailable or full.
    }
  }

  private syncStoredSettings(): void {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return;
    const parsed = asRecord(JSON.parse(stored));
    this.data.settings = parsePlayerSettings(parsed.settings, this.data.settings);
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

  get activeGame(): Readonly<SavedPuzzleAttempt> | undefined {
    const current = this.data.currentPuzzle;
    return current ? { ...current, board: toBoard(current.board) } : undefined;
  }

  get gameHistory(): readonly Readonly<GameHistoryEntry>[] {
    return this.data.history.map((entry) => ({ ...entry }));
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
    resume = true,
  ): {
    board: ReturnType<typeof emptyBoard>;
    moves: number;
    attemptId: string;
    startedAt: number;
    elapsedMs: number;
  } {
    const current = this.data.currentPuzzle;
    const source = context?.source ?? (mode === 'timed' ? 'rush' : 'infinite');
    if (
      !resume ||
      !current ||
      current.seed !== seed ||
      current.difficulty !== difficulty ||
      current.mode !== mode ||
      current.source !== source ||
      (source === 'campaign' && current.campaignOrderId !== context?.campaignOrderId)
    ) {
      return {
        board: emptyBoard(),
        moves: 0,
        attemptId: createAttemptId(),
        startedAt: Date.now(),
        elapsedMs: 0,
      };
    }
    return {
      board: toBoard(current.board),
      moves: current.moves,
      attemptId: current.attemptId,
      startedAt: current.startedAt,
      elapsedMs: current.elapsedMs,
    };
  }

  savePuzzle(
    seed: string,
    difficulty: Difficulty,
    board: ReturnType<typeof emptyBoard>,
    moves: number,
    mode: GameMode = 'standard',
    context?: PlayContext,
    timing?: Pick<SavedPuzzleAttempt, 'attemptId' | 'startedAt' | 'elapsedMs'>,
  ): void {
    const source = context?.source ?? (mode === 'timed' ? 'rush' : 'infinite');
    const current = this.data.currentPuzzle;
    const sameAttempt =
      current?.seed === seed &&
      current.difficulty === difficulty &&
      current.mode === mode &&
      current.source === source &&
      (source !== 'campaign' || current.campaignOrderId === context?.campaignOrderId);
    const savedTiming =
      timing ??
      (sameAttempt && current
        ? {
            attemptId: current.attemptId,
            startedAt: current.startedAt,
            elapsedMs: current.elapsedMs,
          }
        : { attemptId: createAttemptId(), startedAt: Date.now(), elapsedMs: 0 });
    this.data.currentPuzzle = {
      attemptId: savedTiming.attemptId.length > 0 ? savedTiming.attemptId : createAttemptId(),
      startedAt: finitePositive(savedTiming.startedAt, Date.now()),
      elapsedMs: finiteNonNegative(savedTiming.elapsedMs),
      seed,
      difficulty,
      mode,
      source,
      ...(source === 'campaign' && context?.campaignOrderId
        ? { campaignOrderId: context.campaignOrderId }
        : {}),
      board: toBoard(board),
      moves: finiteNonNegative(moves),
    };
    this.persist();
  }

  updateSettings(settings: Partial<PlayerSettings>): PlayerSettings {
    try {
      this.syncStoredSettings();
    } catch {
      // Keep the current in-memory settings when persisted data is unavailable or malformed.
    }
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
      musicTrackKey: isMusicTrackKey(settings.musicTrackKey)
        ? settings.musicTrackKey
        : this.data.settings.musicTrackKey,
      nightDim: clampVolume(settings.nightDim, this.data.settings.nightDim),
    };
    this.persist(false);
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

  markSolved(
    mode: GameMode = 'standard',
    remainingMs = 0,
    elapsedMs?: number,
    moves?: number,
  ): void {
    const current = this.data.currentPuzzle;
    if (current) {
      const completed: GameHistoryEntry = {
        attemptId: current.attemptId,
        startedAt: current.startedAt,
        seed: current.seed,
        difficulty: current.difficulty,
        mode: current.mode,
        source: current.source,
        ...(current.campaignOrderId ? { campaignOrderId: current.campaignOrderId } : {}),
        durationMs: finiteNonNegative(elapsedMs, current.elapsedMs),
        moves: finiteNonNegative(moves, current.moves),
      };
      this.data.history = [
        completed,
        ...this.data.history.filter((entry) => entry.attemptId !== completed.attemptId),
      ].slice(0, MAX_GAME_HISTORY_ENTRIES);
    }
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
