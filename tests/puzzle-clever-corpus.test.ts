import { describe, it } from 'vitest';
import { assertDeductiveCorpus } from './helpers/puzzleCorpus';

describe('Clever generator corpus', () => {
  it('proves 2,500 puzzles are unique and deduction-only', () => {
    assertDeductiveCorpus('clever');
  }, 60_000);
});
