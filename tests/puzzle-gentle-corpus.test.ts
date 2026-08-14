import { describe, it } from 'vitest';
import { assertDeductiveCorpus } from './helpers/puzzleCorpus';

describe('Gentle generator corpus', () => {
  it('proves 2,500 puzzles are unique and deduction-only', () => {
    assertDeductiveCorpus('Gentle');
  }, 60_000);
});
