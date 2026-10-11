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

// Optimized: Replaced functional array methods (.some, .every) and intermediate
// getClueOffsets allocations with standard inline for-loops. This prevents massive
// closure and array memory allocation overhead in the constraint solver's hot path.
export const clueCouldMatch = (
  board: Board,
  clue: CluePattern,
  pieceMap: ReadonlyMap<PieceId, BentoPiece>,
): boolean => {
  const maxOffsetY = 3 - clue.height;
  const maxOffsetX = 3 - clue.width;
  const cells = clue.cells;
  const numCells = cells.length;

  for (let offsetY = 0; offsetY <= maxOffsetY; offsetY += 1) {
    for (let offsetX = 0; offsetX <= maxOffsetX; offsetX += 1) {
      let match = true;
      for (let j = 0; j < numCells; j += 1) {
        const cell = cells[j];
        if (!cell) continue;
        if (!cell.animal && !cell.food) continue;
        const pieceId = board[(cell.y + offsetY) * 3 + cell.x + offsetX];
        if (!pieceId) continue;
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

export const clueMatchesBoard = (
  board: Board,
  clue: CluePattern,
  pieceMap: ReadonlyMap<PieceId, BentoPiece>,
): boolean => {
  const maxOffsetY = 3 - clue.height;
  const maxOffsetX = 3 - clue.width;
  const cells = clue.cells;
  const numCells = cells.length;

  for (let offsetY = 0; offsetY <= maxOffsetY; offsetY += 1) {
    for (let offsetX = 0; offsetX <= maxOffsetX; offsetX += 1) {
      let match = true;
      for (let j = 0; j < numCells; j += 1) {
        const cell = cells[j];
        if (!cell) continue;
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
  for (let i = 0; i < clues.length; i += 1) {
    const clue = clues[i];
    if (clue && !clueMatchesBoard(board, clue, pieceMap)) return false;
  }
  return true;
};
