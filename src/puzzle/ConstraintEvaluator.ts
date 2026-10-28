import type { BentoPiece, Board, ClueCell, CluePattern, PieceId } from './types';

export const pieceMatchesCell = (piece: BentoPiece, clueCell: ClueCell): boolean =>
  (!clueCell.animal || clueCell.animal === piece.animal) &&
  (!clueCell.food || clueCell.food === piece.food);

export interface ClueOffset {
  x: number;
  y: number;
}

export const getClueOffsets = (clue: CluePattern): ClueOffset[] => {
  const offsets: ClueOffset[] = [];
  for (let y = 0; y <= 3 - clue.height; y += 1) {
    for (let x = 0; x <= 3 - clue.width; x += 1) offsets.push({ x, y });
  }
  return offsets;
};

// ⚡ Bolt Optimization: This file sits in the absolute hottest path of the puzzle solver and generator.
// To avoid closure allocation and function call overhead, we replace functional array methods
// (.every, .some) with traditional nested for loops, and we inline small helper functions
// like coordinate math and piece matching logic directly into the loops.

export const clueCouldMatch = (
  board: Board,
  clue: CluePattern,
  pieceMap: ReadonlyMap<PieceId, BentoPiece>,
): boolean => {
  const maxY = 3 - clue.height;
  const maxX = 3 - clue.width;
  for (let offsetY = 0; offsetY <= maxY; offsetY += 1) {
    for (let offsetX = 0; offsetX <= maxX; offsetX += 1) {
      let matches = true;
      for (let i = 0; i < clue.cells.length; i += 1) {
        const cell = clue.cells[i]!;
        const pieceId = board[(cell.y + offsetY) * 3 + cell.x + offsetX];
        if (!pieceId || (!cell.animal && !cell.food)) continue;
        const piece = pieceMap.get(pieceId);
        if (
          !piece ||
          (cell.animal && cell.animal !== piece.animal) ||
          (cell.food && cell.food !== piece.food)
        ) {
          matches = false;
          break;
        }
      }
      if (matches) return true;
    }
  }
  return false;
};

export const clueMatchesBoard = (
  board: Board,
  clue: CluePattern,
  pieceMap: ReadonlyMap<PieceId, BentoPiece>,
): boolean => {
  const maxY = 3 - clue.height;
  const maxX = 3 - clue.width;
  for (let offsetY = 0; offsetY <= maxY; offsetY += 1) {
    for (let offsetX = 0; offsetX <= maxX; offsetX += 1) {
      let matches = true;
      for (let i = 0; i < clue.cells.length; i += 1) {
        const cell = clue.cells[i]!;
        if (!cell.animal && !cell.food) continue;
        const pieceId = board[(cell.y + offsetY) * 3 + cell.x + offsetX];
        if (!pieceId) {
          matches = false;
          break;
        }
        const piece = pieceMap.get(pieceId);
        if (
          !piece ||
          (cell.animal && cell.animal !== piece.animal) ||
          (cell.food && cell.food !== piece.food)
        ) {
          matches = false;
          break;
        }
      }
      if (matches) return true;
    }
  }
  return false;
};

export const boardSatisfiesPuzzle = (
  board: Board,
  clues: readonly CluePattern[],
  pieceMap: ReadonlyMap<PieceId, BentoPiece>,
): boolean => {
  for (let i = 0; i < clues.length; i += 1) {
    if (!clueMatchesBoard(board, clues[i]!, pieceMap)) {
      return false;
    }
  }
  return true;
};
