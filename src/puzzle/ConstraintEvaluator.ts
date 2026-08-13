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

const positionAt = (cell: ClueCell, offset: ClueOffset): number =>
  (cell.y + offset.y) * 3 + cell.x + offset.x;

export const clueCouldMatch = (
  board: Board,
  clue: CluePattern,
  pieceMap: ReadonlyMap<PieceId, BentoPiece>,
): boolean =>
  getClueOffsets(clue).some((offset) =>
    clue.cells.every((cell) => {
      const pieceId = board[positionAt(cell, offset)];
      if (!pieceId || (!cell.animal && !cell.food)) return true;
      const piece = pieceMap.get(pieceId);
      return piece ? pieceMatchesCell(piece, cell) : false;
    }),
  );

export const clueMatchesBoard = (
  board: Board,
  clue: CluePattern,
  pieceMap: ReadonlyMap<PieceId, BentoPiece>,
): boolean =>
  getClueOffsets(clue).some((offset) =>
    clue.cells.every((cell) => {
      if (!cell.animal && !cell.food) return true;
      const pieceId = board[positionAt(cell, offset)];
      if (!pieceId) return false;
      const piece = pieceMap.get(pieceId);
      return piece ? pieceMatchesCell(piece, cell) : false;
    }),
  );

export const boardSatisfiesPuzzle = (
  board: Board,
  clues: readonly CluePattern[],
  pieceMap: ReadonlyMap<PieceId, BentoPiece>,
): boolean => clues.every((clue) => clueMatchesBoard(board, clue, pieceMap));
