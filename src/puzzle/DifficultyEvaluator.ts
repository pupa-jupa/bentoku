import type { Difficulty, SolveMetrics } from './types';

export const evaluateDifficulty = (metrics: SolveMetrics): Difficulty => {
  const score = metrics.exploredStates + metrics.branchCount * 5 + metrics.maxDepth * 2;
  if (score < 35) return 'Cozy';
  if (score < 90) return 'Gentle';
  if (score < 220) return 'Clever';
  return 'Tricky';
};
