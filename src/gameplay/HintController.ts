import type { I18nService } from '../i18n/I18nService';
import type { PuzzleDefinition } from '../puzzle/types';
import type { TranslationKey } from '../i18n/translations';

export class HintController {
  private nudgeIndex = 0;

  constructor(private readonly i18n: I18nService) {}

  explain(puzzle: PuzzleDefinition): string {
    const spatialCount = puzzle.clues.filter((clue) => clue.width < 3 || clue.height < 3).length;
    const anchor = puzzle.clues.find((clue) => clue.id === 'anchor-map');
    return this.i18n.t('hint.explain', {
      count: spatialCount,
      sketches: this.i18n.t(spatialCount === 1 ? 'hint.sketch.one' : 'hint.sketch.other'),
      partial: anchor && anchor.cells.length < 9 ? this.i18n.t('hint.partialMap') : '',
    });
  }

  nudge(puzzle: PuzzleDefinition): string {
    const clues = puzzle.clues.filter((clue) => clue.id !== 'anchor-map');
    const clue = clues[this.nudgeIndex % Math.max(clues.length, 1)];
    this.nudgeIndex += 1;
    if (!clue) return this.i18n.t('hint.startAnchor');
    const revealed = clue.cells.filter((cell) => cell.animal || cell.food).length;
    return this.i18n.t('hint.nudge', {
      clue: this.i18n.t(`clue.${clue.name}` as TranslationKey),
      count: revealed,
    });
  }

  reveal(puzzle: PuzzleDefinition, board: readonly (string | null)[]): number | null {
    for (let index = 0; index < 9; index += 1) {
      if (board[index] !== puzzle.solution[index]) return index;
    }
    return null;
  }
}
