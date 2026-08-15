import { describe, it } from 'vitest';
import { assertDeductiveCorpus } from './helpers/puzzleCorpus';

describe('Master generator corpus, second half', () => {
  it('proves the next 1,250 puzzles are unique and deduction-only', () => {
    assertDeductiveCorpus('master', 1_250, 1_250);
  }, 60_000);
});
