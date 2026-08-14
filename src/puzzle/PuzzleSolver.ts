import { boardSatisfiesPuzzle, clueCouldMatch, pieceMatchesCell } from './ConstraintEvaluator';
import { createPieceMap } from './PieceFactory';
import {
  ANIMALS,
  emptyBoard,
  toBoard,
  type Animal,
  type BentoPiece,
  type Board,
  type ClueCell,
  type PieceId,
  type PuzzleDefinition,
  type SolveMetrics,
  type SolveResult,
} from './types';

type SolverPuzzle = Pick<PuzzleDefinition, 'pieces' | 'clues'>;

const anchoredDescriptors = (puzzle: SolverPuzzle): ClueCell[][] => {
  const descriptors = Array.from({ length: 9 }, () => [] as ClueCell[]);
  for (const clue of puzzle.clues) {
    if (clue.width !== 3 || clue.height !== 3) continue;
    for (const cell of clue.cells) {
      if (cell.animal || cell.food) descriptors[cell.y * 3 + cell.x]!.push(cell);
    }
  }
  return descriptors;
};

const pieceAllowedAt = (
  piece: BentoPiece,
  position: number,
  descriptors: readonly ClueCell[][],
): boolean => descriptors[position]!.every((descriptor) => pieceMatchesCell(piece, descriptor));

const solveForAnimals = (
  puzzle: SolverPuzzle,
  includedAnimals: readonly Animal[],
  limit: number,
  initialBoard: Board,
): SolveResult => {
  const includedAnimalSet = new Set(includedAnimals);
  const availablePieces = puzzle.pieces.filter((piece) => includedAnimalSet.has(piece.animal));
  const pieceMap = createPieceMap(puzzle.pieces);
  const descriptors = anchoredDescriptors(puzzle);
  const board = toBoard(initialBoard);
  const used = new Set<PieceId>(board.filter((cell): cell is PieceId => cell !== null));
  const metrics: SolveMetrics = {
    exploredStates: 0,
    maxDepth: 0,
    forcedMoves: 0,
    branchCount: 0,
  };
  let count = 0;
  let firstSolution: Board | undefined;

  if (used.size !== board.filter(Boolean).length) return { count: 0, metrics };
  for (let position = 0; position < 9; position += 1) {
    const pieceId = board[position];
    if (!pieceId) continue;
    const piece = pieceMap.get(pieceId);
    if (
      !piece ||
      !includedAnimalSet.has(piece.animal) ||
      !pieceAllowedAt(piece, position, descriptors)
    ) {
      return { count: 0, metrics };
    }
  }

  const allCluesPossible = (): boolean =>
    puzzle.clues.every((clue) => clueCouldMatch(board, clue, pieceMap));

  const candidatesFor = (position: number): BentoPiece[] =>
    availablePieces.filter(
      (piece) => !used.has(piece.id) && pieceAllowedAt(piece, position, descriptors),
    );

  const search = (depth: number): void => {
    if (count >= limit) return;
    metrics.maxDepth = Math.max(metrics.maxDepth, depth);

    let nextPosition = -1;
    let nextCandidates: BentoPiece[] | undefined;
    for (let position = 0; position < 9; position += 1) {
      if (board[position]) continue;
      const candidates = candidatesFor(position);
      if (candidates.length === 0) return;
      if (!nextCandidates || candidates.length < nextCandidates.length) {
        nextPosition = position;
        nextCandidates = candidates;
        if (candidates.length === 1) break;
      }
    }

    if (nextPosition === -1 || !nextCandidates) {
      if (boardSatisfiesPuzzle(board, puzzle.clues, pieceMap)) {
        count += 1;
        firstSolution ??= toBoard(board);
      }
      return;
    }

    if (nextCandidates.length === 1) metrics.forcedMoves += 1;
    else metrics.branchCount += 1;

    for (const piece of nextCandidates) {
      metrics.exploredStates += 1;
      board[nextPosition] = piece.id;
      used.add(piece.id);
      if (allCluesPossible()) search(depth + 1);
      used.delete(piece.id);
      board[nextPosition] = null;
      if (count >= limit) return;
    }
  };

  if (allCluesPossible()) search(board.filter(Boolean).length);
  return { count, firstSolution, metrics };
};

/**
 * Solves exactly the rules visible to the player: choose nine pieces that form
 * three complete animal families, leaving one whole family on the tray.
 * No hidden animal-set input is accepted by this public solver.
 */
export const solvePuzzle = (
  puzzle: SolverPuzzle,
  limit = 2,
  initialBoard: Board = emptyBoard(),
): SolveResult => {
  const metrics: SolveMetrics = {
    exploredStates: 0,
    maxDepth: 0,
    forcedMoves: 0,
    branchCount: 0,
  };
  let count = 0;
  let firstSolution: Board | undefined;

  for (const omittedAnimal of ANIMALS) {
    if (count >= limit) break;
    const includedAnimals = ANIMALS.filter((animal) => animal !== omittedAnimal);
    const result = solveForAnimals(puzzle, includedAnimals, limit - count, initialBoard);
    count += result.count;
    firstSolution ??= result.firstSolution;
    metrics.exploredStates += result.metrics.exploredStates;
    metrics.maxDepth = Math.max(metrics.maxDepth, result.metrics.maxDepth);
    metrics.forcedMoves += result.metrics.forcedMoves;
    metrics.branchCount += result.metrics.branchCount;
  }

  return { count, firstSolution, metrics };
};

export const countSolutions = (puzzle: SolverPuzzle, limit = 2): number =>
  solvePuzzle(puzzle, limit).count;
