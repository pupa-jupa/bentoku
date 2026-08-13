import { emptyBoard, toBoard, type Board, type PieceId } from '../puzzle/types';
import { UndoController } from './UndoController';

export interface PlacementResult {
  changed: boolean;
  swapped: boolean;
  previousCell: number | null;
  displacedPiece: PieceId | null;
}

export class PlacementController {
  board: Board;
  moves = 0;
  readonly undo = new UndoController();

  constructor(board: Board = emptyBoard(), moves = 0) {
    this.board = toBoard(board);
    this.moves = moves;
  }

  place(pieceId: PieceId, targetCell: number): PlacementResult {
    if (targetCell < 0 || targetCell > 8) {
      return { changed: false, swapped: false, previousCell: null, displacedPiece: null };
    }
    const previousCell = this.board.indexOf(pieceId);
    if (previousCell === targetCell) {
      return { changed: false, swapped: false, previousCell, displacedPiece: pieceId };
    }

    this.undo.push({ board: this.board, moves: this.moves });
    const displacedPiece = this.board[targetCell]!;
    this.board[targetCell] = pieceId;
    if (previousCell >= 0) this.board[previousCell] = displacedPiece;
    this.moves += 1;
    return {
      changed: true,
      swapped: displacedPiece !== null && previousCell >= 0,
      previousCell: previousCell >= 0 ? previousCell : null,
      displacedPiece: displacedPiece ?? null,
    };
  }

  returnToTray(pieceId: PieceId): boolean {
    const cell = this.board.indexOf(pieceId);
    if (cell < 0) return false;
    this.undo.push({ board: this.board, moves: this.moves });
    this.board[cell] = null;
    this.moves += 1;
    return true;
  }

  restorePrevious(): boolean {
    const state = this.undo.pop();
    if (!state) return false;
    this.board = toBoard(state.board);
    this.moves = state.moves;
    return true;
  }

  restart(): void {
    if (this.board.some(Boolean)) this.undo.push({ board: this.board, moves: this.moves });
    this.board = emptyBoard();
    this.moves = 0;
  }

  isFull(): boolean {
    return this.board.every((cell) => cell !== null);
  }
}
