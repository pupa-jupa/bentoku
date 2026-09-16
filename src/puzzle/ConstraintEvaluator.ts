import type { BentoPiece, Board, ClueCell, CluePattern, PieceId } from './types';

export const pieceMatchesCell = (piece: BentoPiece, clueCell: ClueCell): boolean => {
  if (clueCell.animal && clueCell.animal !== piece.animal) return false;
  if (clueCell.food && clueCell.food !== piece.food) return false;
  return true;
};

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
  for (let y = 0; y <= 3 - clue.height; y += 1) {
    for (let x = 0; x <= 3 - clue.width; x += 1) {
      let match = true;
      for (let i = 0; i < clue.cells.length; i++) {
        const cell = clue.cells[i];
        const pieceId = board[(cell.y + y) * 3 + cell.x + x];
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

export const clueMatchesBoard = (
  board: Board,
  clue: CluePattern,
  pieceMap: ReadonlyMap<PieceId, BentoPiece>,
): boolean => {
  for (let y = 0; y <= 3 - clue.height; y += 1) {
    for (let x = 0; x <= 3 - clue.width; x += 1) {
      let match = true;
      for (let i = 0; i < clue.cells.length; i++) {
        const cell = clue.cells[i];
        if (!cell.animal && !cell.food) continue;
        const pieceId = board[(cell.y + y) * 3 + cell.x + x];
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
