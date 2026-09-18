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
): boolean => {
  const offsets = getClueOffsets(clue);
  const numOffsets = offsets.length;
  const numCells = clue.cells.length;
  for (let i = 0; i < numOffsets; i += 1) {
    const offset = offsets[i]!;
    let allCellsMatch = true;
    for (let j = 0; j < numCells; j += 1) {
      const cell = clue.cells[j]!;
      const pieceId = board[positionAt(cell, offset)];
      if (!pieceId || (!cell.animal && !cell.food)) continue;
      const piece = pieceMap.get(pieceId);
      if (!piece || !pieceMatchesCell(piece, cell)) {
        allCellsMatch = false;
        break;
      }
    }
    if (allCellsMatch) return true;
  }
  return false;
};

export const clueMatchesBoard = (
  board: Board,
  clue: CluePattern,
  pieceMap: ReadonlyMap<PieceId, BentoPiece>,
): boolean => {
  const offsets = getClueOffsets(clue);
  const numOffsets = offsets.length;
  const numCells = clue.cells.length;
  for (let i = 0; i < numOffsets; i += 1) {
    const offset = offsets[i]!;
    let allCellsMatch = true;
    for (let j = 0; j < numCells; j += 1) {
      const cell = clue.cells[j]!;
      if (!cell.animal && !cell.food) continue;
      const pieceId = board[positionAt(cell, offset)];
      if (!pieceId) {
        allCellsMatch = false;
        break;
      }
      const piece = pieceMap.get(pieceId);
      if (!piece || !pieceMatchesCell(piece, cell)) {
        allCellsMatch = false;
        break;
      }
    }
    if (allCellsMatch) return true;
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
