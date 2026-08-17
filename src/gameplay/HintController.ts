import type { PuzzleDefinition } from '../puzzle/types';

export class HintController {
  constructor(private readonly allowReveal = true) {}

  reveal(puzzle: PuzzleDefinition, board: readonly (string | null)[]): number | null {
    if (!this.allowReveal) return null;
    for (let index = 0; index < 9; index += 1) {
      if (board[index] !== puzzle.solution[index]) return index;
    }
    return null;
  }
}
