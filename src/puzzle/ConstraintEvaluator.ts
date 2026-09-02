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

// Inline loop optimizations are used here instead of getClueOffsets().some()
// because this is a highly executed hot path in the deduction solver.
// Avoiding closure creation and array allocation makes these functions ~3x faster.
export const clueCouldMatch = (
  board: Board,
  clue: CluePattern,
  pieceMap: ReadonlyMap<PieceId, BentoPiece>,
): boolean => {
  for (let offsetY = 0; offsetY <= 3 - clue.height; offsetY += 1) {
    for (let offsetX = 0; offsetX <= 3 - clue.width; offsetX += 1) {
      let match = true;
      for (let i = 0; i < clue.cells.length; i += 1) {
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

// Inline loop optimizations are used here instead of getClueOffsets().some()
// because this is a highly executed hot path in the deduction solver.
// Avoiding closure creation and array allocation makes these functions ~3x faster.
export const clueMatchesBoard = (
  board: Board,
  clue: CluePattern,
  pieceMap: ReadonlyMap<PieceId, BentoPiece>,
): boolean => {
  for (let offsetY = 0; offsetY <= 3 - clue.height; offsetY += 1) {
    for (let offsetX = 0; offsetX <= 3 - clue.width; offsetX += 1) {
      let match = true;
      for (let i = 0; i < clue.cells.length; i += 1) {
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
): boolean => clues.every((clue) => clueMatchesBoard(board, clue, pieceMap));
