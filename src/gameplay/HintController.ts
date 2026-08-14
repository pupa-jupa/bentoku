import type { PuzzleDefinition } from '../puzzle/types';

export class HintController {
  private nudgeIndex = 0;

  explain(puzzle: PuzzleDefinition): string {
    const spatialCount = puzzle.clues.filter((clue) => clue.width < 3 || clue.height < 3).length;
    const anchor = puzzle.clues.find((clue) => clue.id === 'anchor-map');
    const partialMapNote =
      anchor && anchor.cells.length < 9 ? ' Blank map cells give no information.' : '';
    return `Use exactly three complete animal families—egg, rice, and sandwich—so one whole family remains on the tray. Each little sketch can slide anywhere inside the 3 × 3 box while its symbols keep the same relative positions. You have ${spatialCount} movable ${spatialCount === 1 ? 'sketch' : 'sketches'} and one fixed café map.${partialMapNote}`;
  }

  nudge(puzzle: PuzzleDefinition): string {
    const clues = puzzle.clues.filter((clue) => clue.id !== 'anchor-map');
    const clue = clues[this.nudgeIndex % Math.max(clues.length, 1)];
    this.nudgeIndex += 1;
    if (!clue) return 'Start with the café map: each mark belongs to that exact cell.';
    const revealed = clue.cells.filter((cell) => cell.animal || cell.food).length;
    return `Try the ${clue.name} sketch. It has ${revealed} visible marks—test the few places where its whole shape can fit.`;
  }

  reveal(puzzle: PuzzleDefinition, board: readonly (string | null)[]): number | null {
    for (let index = 0; index < 9; index += 1) {
      if (board[index] !== puzzle.solution[index]) return index;
    }
    return null;
  }
}
