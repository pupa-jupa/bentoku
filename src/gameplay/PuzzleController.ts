import { createPieceMap } from '../puzzle/PieceFactory';
import { boardSatisfiesPuzzle } from '../puzzle/ConstraintEvaluator';
import { toBoard, type Board, type PuzzleDefinition } from '../puzzle/types';

export class PuzzleController {
  readonly puzzle: PuzzleDefinition;

  constructor(puzzle: PuzzleDefinition) {
    this.puzzle = puzzle;
  }

  validate(board: Board): boolean {
    if (board.some((cell) => cell === null)) return false;
    const activeSet = new Set(this.puzzle.activeAnimals);
    const map = createPieceMap(this.puzzle.pieces);
    const validPieces = board.every((id) => id && activeSet.has(map.get(id)!.animal));
    return validPieces && boardSatisfiesPuzzle(toBoard(board), this.puzzle.clues, map);
  }
}
