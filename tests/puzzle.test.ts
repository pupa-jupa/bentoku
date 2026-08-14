import { describe, expect, it } from 'vitest';
import { boardSatisfiesPuzzle } from '../src/puzzle/ConstraintEvaluator';
import { solveHumanly } from '../src/puzzle/HumanSolver';
import { createAllPieces, createPieceMap } from '../src/puzzle/PieceFactory';
import { PuzzleGenerator } from '../src/puzzle/PuzzleGenerator';
import { countSolutions, solvePuzzle } from '../src/puzzle/PuzzleSolver';
import { normalizeSeed, SeededRandom } from '../src/puzzle/SeededRandom';
import { DIFFICULTIES, type CluePattern, type Difficulty } from '../src/puzzle/types';

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

describe('puzzle generator and public solver', () => {
  const generator = new PuzzleGenerator();

  it('is reproducible per difficulty and its solution satisfies every visible rule', () => {
    const first = generator.create('BENTO-K7F2-QM91', 'Clever');
    const second = generator.create('BENTO-K7F2-QM91', 'Clever');
    const cozy = generator.create('BENTO-K7F2-QM91', 'Cozy');
    expect(first).toEqual(second);
    expect(first).not.toHaveProperty('activeAnimals');
    expect(first.solution).toEqual(cozy.solution);
    expect(first.clues).not.toEqual(cozy.clues);
    expect(boardSatisfiesPuzzle(first.solution, first.clues, createPieceMap(first.pieces))).toBe(
      true,
    );
    expect(countSolutions(first, 2)).toBe(1);
    expect(solveHumanly(first)).toMatchObject({ solved: true, stalled: false });
  });

  it('counts solutions using all twelve visible pieces, not hidden active animals', () => {
    const pieces = createAllPieces();
    const foodOnlyMap: CluePattern = {
      id: 'anchor-map',
      name: 'food-only map',
      width: 3,
      height: 3,
      cells: ['egg', 'rice', 'sandwich', 'egg', 'rice', 'sandwich', 'egg', 'rice', 'sandwich'].map(
        (food, position) => ({
          x: position % 3,
          y: Math.floor(position / 3),
          food: food as 'egg' | 'rice' | 'sandwich',
        }),
      ),
    };
    expect(countSolutions({ pieces, clues: [foodOnlyMap] }, 2)).toBe(2);
  });

  it('returns the generated solution from both exact and deduction solvers', () => {
    const puzzle = generator.create('BENTO-MOON-CAKE', 'Tricky');
    const exact = solvePuzzle(puzzle, 2);
    const human = solveHumanly(puzzle);
    expect(exact.count).toBe(1);
    expect(exact.firstSolution).toEqual(puzzle.solution);
    expect(human.solved).toBe(true);
    expect(human.board).toEqual(puzzle.solution);
    expect(human.metrics.rounds).toBeGreaterThan(0);
  });

  it('keeps the reported daily tricky puzzle consistent and uniquely solvable', () => {
    const puzzle = generator.create('BENTO-D260-814B', 'Tricky');
    const exact = solvePuzzle(puzzle, 2);
    const human = solveHumanly(puzzle);

    expect(boardSatisfiesPuzzle(puzzle.solution, puzzle.clues, createPieceMap(puzzle.pieces))).toBe(
      true,
    );
    expect(exact).toMatchObject({ count: 1, firstSolution: puzzle.solution });
    expect(human).toMatchObject({ solved: true, stalled: false, board: puzzle.solution });
  });

  it('builds Master puzzles from a partial café map and several substantial sketches', () => {
    const puzzle = generator.create('BENTO-MASTER-01', 'Master');
    const anchor = puzzle.clues.find((clue) => clue.id === 'anchor-map')!;
    const sketches = puzzle.clues.filter((clue) => clue.id !== 'anchor-map');

    expect(anchor.cells.length).toBeGreaterThanOrEqual(6);
    expect(anchor.cells.length).toBeLessThan(9);
    expect(sketches.length).toBeGreaterThanOrEqual(5);
    expect(sketches.length).toBeLessThanOrEqual(6);
    expect(sketches.every((clue) => clue.cells.length >= 3)).toBe(true);
    expect(
      sketches.every((clue) => clue.cells.filter((cell) => cell.animal || cell.food).length >= 3),
    ).toBe(true);
    expect(countSolutions(puzzle, 2)).toBe(1);
    expect(solveHumanly(puzzle)).toMatchObject({
      solved: true,
      stalled: false,
      board: puzzle.solution,
    });
  });

  it('orders the five levels by measured deduction complexity', () => {
    const scores = new Map<Difficulty, number>();
    for (const difficulty of DIFFICULTIES) {
      let totalScore = 0;
      for (let index = 0; index < 100; index += 1) {
        totalScore += generator.create(`SCORE${index.toString(36).padStart(3, '0')}`, difficulty)
          .metrics.score;
      }
      scores.set(difficulty, totalScore / 100);
    }
    expect(scores.get('Cozy')!).toBeLessThan(scores.get('Gentle')!);
    expect(scores.get('Gentle')!).toBeLessThan(scores.get('Clever')!);
    expect(scores.get('Clever')!).toBeLessThan(scores.get('Tricky')!);
    expect(scores.get('Tricky')!).toBeLessThan(scores.get('Master')!);
  }, 20_000);
});
