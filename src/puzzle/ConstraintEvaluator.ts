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

// Using traditional loops over array methods for hot-path performance
export const clueCouldMatch = (
  board: Board,
  clue: CluePattern,
  pieceMap: ReadonlyMap<PieceId, BentoPiece>,
): boolean => {
  const limitY = 3 - clue.height;
  const limitX = 3 - clue.width;
  for (let offsetY = 0; offsetY <= limitY; offsetY++) {
    for (let offsetX = 0; offsetX <= limitX; offsetX++) {
      let match = true;
      for (let i = 0; i < clue.cells.length; i++) {
        const cell = clue.cells[i]!;
        const pieceId = board[(cell.y + offsetY) * 3 + cell.x + offsetX];
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

// Using traditional loops over array methods for hot-path performance
export const clueMatchesBoard = (
  board: Board,
  clue: CluePattern,
  pieceMap: ReadonlyMap<PieceId, BentoPiece>,
): boolean => {
  const limitY = 3 - clue.height;
  const limitX = 3 - clue.width;
  for (let offsetY = 0; offsetY <= limitY; offsetY++) {
    for (let offsetX = 0; offsetX <= limitX; offsetX++) {
      let match = true;
      for (let i = 0; i < clue.cells.length; i++) {
        const cell = clue.cells[i]!;
        if (!cell.animal && !cell.food) continue;
        const pieceId = board[(cell.y + offsetY) * 3 + cell.x + offsetX];
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
  for (let i = 0; i < clues.length; i++) {
    if (!clueMatchesBoard(board, clues[i]!, pieceMap)) return false;
  }
  return true;
};
