import { describe, it } from 'vitest';
import { assertDeductiveCorpus } from './helpers/puzzleCorpus';

describe('Cozy generator corpus', () => {
  it('proves 2,500 puzzles are unique and deduction-only', () => {
    assertDeductiveCorpus('cozy');
  }, 60_000);
});
