import { createPieceMap } from '../puzzle/PieceFactory';
import { boardSatisfiesPuzzle } from '../puzzle/ConstraintEvaluator';
import { FOODS, toBoard, type Animal, type Board, type PuzzleDefinition } from '../puzzle/types';

export class PuzzleController {
  readonly puzzle: PuzzleDefinition;

  constructor(puzzle: PuzzleDefinition) {
    this.puzzle = puzzle;
  }

  validate(board: Board): boolean {
    if (board.some((cell) => cell === null)) return false;
    const map = createPieceMap(this.puzzle.pieces);
    const ids = board.filter((id): id is NonNullable<typeof id> => id !== null);
    if (new Set(ids).size !== 9 || ids.some((id) => !map.has(id))) return false;

    const familyFoods = new Map<Animal, Set<string>>();
    ids.forEach((id) => {
      const piece = map.get(id)!;
      const foods = familyFoods.get(piece.animal) ?? new Set<string>();
      foods.add(piece.food);
      familyFoods.set(piece.animal, foods);
    });
    const usesThreeCompleteFamilies =
      familyFoods.size === 3 &&
      [...familyFoods.values()].every(
        (foods) => foods.size === FOODS.length && FOODS.every((food) => foods.has(food)),
      );
    return (
      usesThreeCompleteFamilies && boardSatisfiesPuzzle(toBoard(board), this.puzzle.clues, map)
    );
  }
}
