import { describe, it } from 'vitest';
import { assertDeductiveCorpus } from './helpers/puzzleCorpus';

describe('Tricky generator corpus', () => {
  it('proves 2,500 puzzles are unique and deduction-only', () => {
    assertDeductiveCorpus('tricky');
  }, 60_000);
});
