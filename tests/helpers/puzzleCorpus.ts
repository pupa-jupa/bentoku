import { expect } from 'vitest';
import { DIFFICULTY_PROFILES } from '../../src/puzzle/DifficultyEvaluator';
import { solveHumanly } from '../../src/puzzle/HumanSolver';
import { PuzzleGenerator } from '../../src/puzzle/PuzzleGenerator';
import { countSolutions } from '../../src/puzzle/PuzzleSolver';
import type { Difficulty } from '../../src/puzzle/types';

export const assertDeductiveCorpus = (
  difficulty: Difficulty,
  sampleCount = 2_500,
  startIndex = 0,
): void => {
  const generator = new PuzzleGenerator();
  for (let offset = 0; offset < sampleCount; offset += 1) {
    const index = startIndex + offset;
    const puzzle = generator.create(
      `BENTO-${difficulty[0]}${index.toString(36).padStart(5, '0')}`,
      difficulty,
    );
    const solutionIds = puzzle.solution.filter((id): id is NonNullable<typeof id> => id !== null);
    const pieceMap = new Map(puzzle.pieces.map((piece) => [piece.id, piece]));
    const solutionAnimals = new Set(solutionIds.map((id) => pieceMap.get(id)!.animal));
    const human = solveHumanly(puzzle);

    expect(puzzle.difficulty).toBe(difficulty);
    expect(solutionAnimals.size).toBe(3);
    expect(solutionIds).toHaveLength(9);
    expect(new Set(solutionIds).size).toBe(9);
    expect(puzzle.pieces.filter((piece) => solutionAnimals.has(piece.animal))).toHaveLength(9);
    expect(puzzle.clues.length).toBeLessThanOrEqual(
      DIFFICULTY_PROFILES[difficulty].maxSpatialClues + 1,
    );
    expect(puzzle.clues.every((clue) => clue.width <= 3 && clue.height <= 3)).toBe(true);
    expect(countSolutions(puzzle, 2), `${puzzle.seed} ${difficulty}`).toBe(1);
    expect(human.solved, `${puzzle.seed} ${difficulty}`).toBe(true);
    expect(human.stalled, `${puzzle.seed} ${difficulty}`).toBe(false);
    expect(human.board, `${puzzle.seed} ${difficulty}`).toEqual(puzzle.solution);
  }
};
