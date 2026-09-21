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

export const clueCouldMatch = (
  board: Board,
  clue: CluePattern,
  pieceMap: ReadonlyMap<PieceId, BentoPiece>,
): boolean => {
  const maxY = 3 - clue.height;
  const maxX = 3 - clue.width;

  for (let offsetY = 0; offsetY <= maxY; offsetY += 1) {
    for (let offsetX = 0; offsetX <= maxX; offsetX += 1) {
      let offsetMatches = true;
      for (let i = 0; i < clue.cells.length; i += 1) {
        const cell = clue.cells[i];
        const pos = (cell.y + offsetY) * 3 + cell.x + offsetX;
        const pieceId = board[pos];
        if (!pieceId || (!cell.animal && !cell.food)) continue;
        const piece = pieceMap.get(pieceId);
        if (!piece || !pieceMatchesCell(piece, cell)) {
          offsetMatches = false;
          break;
        }
      }
      if (offsetMatches) return true;
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
      let offsetMatches = true;
      for (let i = 0; i < clue.cells.length; i += 1) {
        const cell = clue.cells[i];
        if (!cell.animal && !cell.food) continue;
        const pos = (cell.y + offsetY) * 3 + cell.x + offsetX;
        const pieceId = board[pos];
        if (!pieceId) {
          offsetMatches = false;
          break;
        }
        const piece = pieceMap.get(pieceId);
        if (!piece || !pieceMatchesCell(piece, cell)) {
          offsetMatches = false;
          break;
        }
      }
      if (offsetMatches) return true;
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
    if (!clueMatchesBoard(board, clues[i], pieceMap)) return false;
  }
  return true;
};
