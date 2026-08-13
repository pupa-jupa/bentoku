import { describe, expect, it } from 'vitest';
import { boardSatisfiesPuzzle } from '../src/puzzle/ConstraintEvaluator';
import { createPieceMap } from '../src/puzzle/PieceFactory';
import { PuzzleGenerator } from '../src/puzzle/PuzzleGenerator';
import { countSolutions, solvePuzzle } from '../src/puzzle/PuzzleSolver';
import { normalizeSeed, SeededRandom } from '../src/puzzle/SeededRandom';

describe('seeded random', () => {
  it('repeats the same sequence for the same seed', () => {
    const first = new SeededRandom('BENTO-TEST-0001');
    const second = new SeededRandom('BENTO-TEST-0001');
    expect(Array.from({ length: 20 }, () => first.next())).toEqual(
      Array.from({ length: 20 }, () => second.next()),
    );
  });

  it('normalizes shareable seeds', () => {
    expect(normalizeSeed(' k7f2-qm91 ')).toBe('BENTO-K7F2-QM91');
  });
});

describe('puzzle generator and solver', () => {
  const generator = new PuzzleGenerator();

  it('is reproducible and its hidden solution satisfies every clue', () => {
    const first = generator.create('BENTO-K7F2-QM91');
    const second = generator.create('BENTO-K7F2-QM91');
    expect(first).toEqual(second);
    expect(boardSatisfiesPuzzle(first.solution, first.clues, createPieceMap(first.pieces))).toBe(
      true,
    );
    expect(countSolutions(first, 2)).toBe(1);
  });

  it('returns telemetry and the generated solution', () => {
    const puzzle = generator.create('BENTO-MOON-CAKE');
    const result = solvePuzzle(puzzle, 2);
    expect(result.count).toBe(1);
    expect(result.firstSolution).toEqual(puzzle.solution);
    expect(result.metrics.exploredStates).toBeGreaterThan(0);
  });

  it('proves 10,000 deterministic puzzles have exactly one solution', () => {
    for (let index = 0; index < 10_000; index += 1) {
      const puzzle = generator.create(`BENTO-QA-${index.toString(36).padStart(4, '0')}`);
      const active = new Set(puzzle.activeAnimals);
      const solutionIds = puzzle.solution.filter((id): id is NonNullable<typeof id> => id !== null);
      expect(puzzle.activeAnimals).toHaveLength(3);
      expect(active.size).toBe(3);
      expect(solutionIds).toHaveLength(9);
      expect(new Set(solutionIds).size).toBe(9);
      expect(puzzle.pieces.filter((piece) => active.has(piece.animal))).toHaveLength(9);
      expect(puzzle.clues.length).toBeLessThanOrEqual(5);
      expect(puzzle.clues.every((clue) => clue.width <= 3 && clue.height <= 3)).toBe(true);
      expect(countSolutions(puzzle, 2), puzzle.seed).toBe(1);
    }
  }, 120_000);
});
