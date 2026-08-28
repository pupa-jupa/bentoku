export const ANIMALS = ['cat', 'bear', 'pig', 'bunny'] as const;
export const FOODS = ['egg', 'rice', 'sandwich'] as const;
export const DIFFICULTIES = ['cozy', 'gentle', 'clever', 'tricky', 'master'] as const;
export const LANGUAGES = ['en', 'ru'] as const;
export const GAME_MODES = ['standard', 'timed'] as const;
export const CLUE_NAMES = [
  'littleRow',
  'littleColumn',
  'longRow',
  'longColumn',
  'square',
  'lTurn',
  'reverseL',
  'corner',
  'rightCorner',
  'tShape',
  'sShape',
  'zShape',
  'cafeMap',
] as const;

export type Animal = (typeof ANIMALS)[number];
export type Food = (typeof FOODS)[number];
export type PieceId = `${Animal}_${Food}`;
export type Difficulty = (typeof DIFFICULTIES)[number];
export type Language = (typeof LANGUAGES)[number];
export type GameMode = (typeof GAME_MODES)[number];
export type ClueName = (typeof CLUE_NAMES)[number];
export type GameSource = 'infinite' | 'campaign' | 'rush';

export interface BentoPiece {
  id: PieceId;
  animal: Animal;
  food: Food;
  textureKey: string;
}

export type BoardCell = PieceId | null;
export type Board = [
  BoardCell,
  BoardCell,
  BoardCell,
  BoardCell,
  BoardCell,
  BoardCell,
  BoardCell,
  BoardCell,
  BoardCell,
];

export interface ClueCell {
  x: number;
  y: number;
  animal?: Animal;
  food?: Food;
}

export interface CluePattern {
  id: string;
  name: ClueName;
  width: number;
  height: number;
  cells: ClueCell[];
}

export interface SolveMetrics {
  exploredStates: number;
  maxDepth: number;
  forcedMoves: number;
  branchCount: number;
}

export interface SolveResult {
  count: number;
  firstSolution?: Board;
  metrics: SolveMetrics;
}

export interface DeductionMetrics {
  rounds: number;
  candidateEliminations: number;
  familyEliminations: number;
  clueOffsetEliminations: number;
  forcedPlacements: number;
  initialForcedPlacements: number;
  anchorExactCells: number;
  spatialClues: number;
  score: number;
}

export interface HumanSolveResult {
  solved: boolean;
  stalled: boolean;
  board?: Board;
  omittedAnimal?: Animal;
  cellCandidates: PieceId[][];
  omittedAnimalCandidates: Animal[];
  metrics: DeductionMetrics;
}

export interface PuzzleDefinition {
  version: 1;
  seed: string;
  pieces: BentoPiece[];
  clues: CluePattern[];
  difficulty: Difficulty;
  solution: Board;
  metrics: DeductionMetrics;
}

export interface PlayerSettings {
  language: Language;
  audioDefaultsVersion: number;
  sound: boolean;
  soundVolume: number;
  musicVolume: number;
  reducedMotion: boolean;
  hintMode: boolean;
  difficulty: Difficulty;
  mode: GameMode;
}

export interface SavedPuzzleAttempt {
  attemptId: string;
  startedAt: number;
  elapsedMs: number;
  seed: string;
  difficulty: Difficulty;
  mode: GameMode;
  source: GameSource;
  campaignOrderId?: import('../campaign/campaignData').CampaignOrderId;
  board: Board;
  moves: number;
}

export interface GameHistoryEntry {
  attemptId: string;
  startedAt: number;
  seed: string;
  difficulty: Difficulty;
  mode: GameMode;
  source: GameSource;
  campaignOrderId?: import('../campaign/campaignData').CampaignOrderId;
  durationMs: number;
  moves: number;
}

export interface SaveData {
  version: 4;
  currentPuzzle?: SavedPuzzleAttempt;
  history: GameHistoryEntry[];
  settings: PlayerSettings;
  tutorial: {
    completedVersion: number;
  };
  campaign: {
    completedOrderIds: import('../campaign/campaignData').CampaignOrderId[];
    currentOrderId: import('../campaign/campaignData').CampaignOrderId;
  };
  album: {
    achievements: string[];
    viewedStories: string[];
  };
  appearance: {
    background: 'standard';
    pieces: 'standard';
  };
  stats: {
    solved: number;
    timed: {
      attempts: number;
      wins: number;
      bestRemainingMs: number;
    };
  };
}

export const emptyBoard = (): Board => [null, null, null, null, null, null, null, null, null];

export const toBoard = (cells: BoardCell[]): Board => {
  if (cells.length !== 9) throw new Error(`A Bento board needs 9 cells, received ${cells.length}.`);
  return cells.slice() as Board;
};
