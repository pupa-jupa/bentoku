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

const positionAt = (cell: ClueCell, offsetX: number, offsetY: number): number =>
  (cell.y + offsetY) * 3 + cell.x + offsetX;

// Optimization: Converted away from array methods (.every, .some) and avoiding getClueOffsets to eliminate
// closure/object allocation overhead in these highly frequent puzzle-solving hot paths.
export const clueCouldMatch = (
  board: Board,
  clue: CluePattern,
  pieceMap: ReadonlyMap<PieceId, BentoPiece>,
): boolean => {
  const maxY = 3 - clue.height;
  const maxX = 3 - clue.width;
  for (let offsetY = 0; offsetY <= maxY; offsetY += 1) {
    for (let offsetX = 0; offsetX <= maxX; offsetX += 1) {
      let match = true;
      for (let i = 0; i < clue.cells.length; i += 1) {
        const cell = clue.cells[i]!;
        const pos = positionAt(cell, offsetX, offsetY);
        const pieceId = board[pos];
        if (!pieceId || (!cell.animal && !cell.food)) continue;
        const piece = pieceMap.get(pieceId);
        if (!piece || !pieceMatchesCell(piece, cell)) {
          match = false;
          break;
        }
      }
      if (match) return true;
    }
  }
  return false;
};

// Optimization: Uses nested for-loops and early returns instead of functional arrays for performance.
export const clueMatchesBoard = (
  board: Board,
  clue: CluePattern,
  pieceMap: ReadonlyMap<PieceId, BentoPiece>,
): boolean => {
  const maxY = 3 - clue.height;
  const maxX = 3 - clue.width;
  for (let offsetY = 0; offsetY <= maxY; offsetY += 1) {
    for (let offsetX = 0; offsetX <= maxX; offsetX += 1) {
      let match = true;
      for (let i = 0; i < clue.cells.length; i += 1) {
        const cell = clue.cells[i]!;
        if (!cell.animal && !cell.food) continue;
        const pos = positionAt(cell, offsetX, offsetY);
        const pieceId = board[pos];
        if (!pieceId) {
          match = false;
          break;
        }
        const piece = pieceMap.get(pieceId);
        if (!piece || !pieceMatchesCell(piece, cell)) {
          match = false;
          break;
        }
      }
      if (match) return true;
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
    if (!clueMatchesBoard(board, clues[i]!, pieceMap)) return false;
  }
  return true;
};
