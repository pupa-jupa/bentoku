export const ANIMALS = ['cat', 'bear', 'pig', 'bunny'] as const;
export const FOODS = ['egg', 'rice', 'sandwich'] as const;

export type Animal = (typeof ANIMALS)[number];
export type Food = (typeof FOODS)[number];
export type PieceId = `${Animal}_${Food}`;
export type Difficulty = 'Cozy' | 'Gentle' | 'Clever' | 'Tricky';

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

export interface PuzzleDefinition {
  version: 1;
  seed: string;
  activeAnimals: [Animal, Animal, Animal];
  pieces: BentoPiece[];
  clues: CluePattern[];
  difficulty: Difficulty;
  solution: Board;
  metrics: SolveMetrics;
}

export interface PlayerSettings {
  sound: boolean;
  reducedMotion: boolean;
  hintMode: boolean;
}

export interface SaveData {
  version: 1;
  currentPuzzle?: {
    seed: string;
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
