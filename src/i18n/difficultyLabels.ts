import type { Difficulty } from '../puzzle/types';

const ENGLISH_DIFFICULTY_LABELS: Readonly<Record<Difficulty, string>> = {
  cozy: 'Cozy',
  gentle: 'Gentle',
  clever: 'Clever',
  tricky: 'Tricky',
  master: 'Master',
};

export const englishDifficultyLabel = (difficulty: Difficulty): string =>
  ENGLISH_DIFFICULTY_LABELS[difficulty];
