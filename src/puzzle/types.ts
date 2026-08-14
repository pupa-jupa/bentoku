export const ANIMALS = ['cat', 'bear', 'pig', 'bunny'] as const;
export const FOODS = ['egg', 'rice', 'sandwich'] as const;
export const DIFFICULTIES = ['Cozy', 'Gentle', 'Clever', 'Tricky', 'Master'] as const;

export type Animal = (typeof ANIMALS)[number];
export type Food = (typeof FOODS)[number];
export type PieceId = `${Animal}_${Food}`;
export type Difficulty = (typeof DIFFICULTIES)[number];

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
  name: string;
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
  sound: boolean;
  soundVolume: number;
  musicVolume: number;
  reducedMotion: boolean;
  hintMode: boolean;
  difficulty: Difficulty;
}

export interface SaveData {
  version: 1;
  currentPuzzle?: {
    seed: string;
    difficulty: Difficulty;
    board: Board;
    moves: number;
  };
  settings: PlayerSettings;
  stats: {
    solved: number;
  };
}

export const emptyBoard = (): Board => [null, null, null, null, null, null, null, null, null];

export const toBoard = (cells: BoardCell[]): Board => {
  if (cells.length !== 9) throw new Error(`A Bento board needs 9 cells, received ${cells.length}.`);
  return cells.slice() as Board;
};
