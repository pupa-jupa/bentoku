import { describe, it } from 'vitest';
import { assertDeductiveCorpus } from './helpers/puzzleCorpus';

describe('Master generator corpus', () => {
  it('proves the first 1,250 puzzles are unique and deduction-only', () => {
    assertDeductiveCorpus('Master', 1_250);
  }, 60_000);
});
