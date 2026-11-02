import type { BentoPiece, Board, ClueCell, CluePattern, PieceId } from './types';

export const pieceMatchesCell = (piece: BentoPiece, clueCell: ClueCell): boolean =>
  (!clueCell.animal || clueCell.animal === piece.animal) &&
  (!clueCell.food || clueCell.food === piece.food);

export interface ClueOffset {
  x: number;
  y: number;
}

const offsetsCache = new Map<number, ClueOffset[]>();

export const getClueOffsets = (clue: CluePattern): ClueOffset[] => {
  const key = (clue.width << 8) | clue.height;
  let offsets = offsetsCache.get(key);
  if (offsets) return offsets;

  offsets = [];
  for (let y = 0; y <= 3 - clue.height; y += 1) {
    for (let x = 0; x <= 3 - clue.width; x += 1) offsets.push({ x, y });
  }
  offsetsCache.set(key, offsets);
  return offsets;
};

export const clueCouldMatch = (
  board: Board,
  clue: CluePattern,
  pieceMap: ReadonlyMap<PieceId, BentoPiece>,
): boolean => {
  const offsets = getClueOffsets(clue);
  for (let i = 0; i < offsets.length; i++) {
    const offset = offsets[i]!;
    let matches = true;
    for (let j = 0; j < clue.cells.length; j++) {
      const cell = clue.cells[j]!;
      if (!cell.animal && !cell.food) continue;
      const pieceId = board[(cell.y + offset.y) * 3 + cell.x + offset.x];
      if (!pieceId) continue;
      const piece = pieceMap.get(pieceId);
      if (
        !piece ||
        !(
          (!cell.animal || cell.animal === piece.animal) &&
          (!cell.food || cell.food === piece.food)
        )
      ) {
        matches = false;
        break;
      }
    }
    if (matches) return true;
  }
  return false;
};

export const clueMatchesBoard = (
  board: Board,
  clue: CluePattern,
  pieceMap: ReadonlyMap<PieceId, BentoPiece>,
): boolean => {
  const offsets = getClueOffsets(clue);
  for (let i = 0; i < offsets.length; i++) {
    const offset = offsets[i]!;
    let matches = true;
    for (let j = 0; j < clue.cells.length; j++) {
      const cell = clue.cells[j]!;
      if (!cell.animal && !cell.food) continue;
      const pieceId = board[(cell.y + offset.y) * 3 + cell.x + offset.x];
      if (!pieceId) {
        matches = false;
        break;
      }
      const piece = pieceMap.get(pieceId);
      if (
        !piece ||
        !(
          (!cell.animal || cell.animal === piece.animal) &&
          (!cell.food || cell.food === piece.food)
        )
      ) {
        matches = false;
        break;
      }
    }
    if (matches) return true;
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
