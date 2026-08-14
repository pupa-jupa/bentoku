import { DIFFICULTY_PROFILES } from './DifficultyEvaluator';
import { logicalUncertainty, solveHumanly } from './HumanSolver';
import { createAllPieces, createPieceMap } from './PieceFactory';
import { normalizeSeed, SeededRandom } from './SeededRandom';
import { solvePuzzle } from './PuzzleSolver';
import {
  ANIMALS,
  toBoard,
  type Animal,
  type BentoPiece,
  type ClueCell,
  type CluePattern,
  type Difficulty,
  type PieceId,
  type PuzzleDefinition,
} from './types';

interface Geometry {
  name: string;
  width: number;
  height: number;
  cells: Array<[number, number]>;
}

const GEOMETRIES: Geometry[] = [
  {
    name: 'little row',
    width: 2,
    height: 1,
    cells: [
      [0, 0],
      [1, 0],
    ],
  },
  {
    name: 'little column',
    width: 1,
    height: 2,
    cells: [
      [0, 0],
      [0, 1],
    ],
  },
  {
    name: 'long row',
    width: 3,
    height: 1,
    cells: [
      [0, 0],
      [1, 0],
      [2, 0],
    ],
  },
  {
    name: 'long column',
    width: 1,
    height: 3,
    cells: [
      [0, 0],
      [0, 1],
      [0, 2],
    ],
  },
  {
    name: 'square',
    width: 2,
    height: 2,
    cells: [
      [0, 0],
      [1, 0],
      [0, 1],
      [1, 1],
    ],
  },
  {
    name: 'L turn',
    width: 2,
    height: 2,
    cells: [
      [0, 0],
      [0, 1],
      [1, 1],
    ],
  },
  {
    name: 'reverse L',
    width: 2,
    height: 2,
    cells: [
      [1, 0],
      [0, 1],
      [1, 1],
    ],
  },
  {
    name: 'corner',
    width: 2,
    height: 2,
    cells: [
      [0, 0],
      [1, 0],
      [0, 1],
    ],
  },
  {
    name: 'T shape',
    width: 3,
    height: 2,
    cells: [
      [0, 0],
      [1, 0],
      [2, 0],
      [1, 1],
    ],
  },
  {
    name: 'S shape',
    width: 3,
    height: 2,
    cells: [
      [1, 0],
      [2, 0],
      [0, 1],
      [1, 1],
    ],
  },
  {
    name: 'Z shape',
    width: 3,
    height: 2,
    cells: [
      [0, 0],
      [1, 0],
      [1, 1],
      [2, 1],
    ],
  },
];

const revealFor = (
  piece: BentoPiece,
  rng: SeededRandom,
  difficulty: Difficulty,
  x: number,
  y: number,
): ClueCell => {
  const profile = DIFFICULTY_PROFILES[difficulty];
  const roll = rng.next();
  if (roll < profile.wildcardChance) return { x, y };
  if (roll < profile.wildcardChance + profile.animalChance) {
    return { x, y, animal: piece.animal };
  }
  if (roll < profile.wildcardChance + profile.animalChance + profile.foodChance) {
    return { x, y, food: piece.food };
  }
  return { x, y, animal: piece.animal, food: piece.food };
};

const makeSpatialClue = (
  solution: readonly PieceId[],
  pieces: ReadonlyMap<PieceId, BentoPiece>,
  geometry: Geometry,
  rng: SeededRandom,
  difficulty: Difficulty,
  id: string,
): CluePattern => {
  const originX = rng.int(4 - geometry.width);
  const originY = rng.int(4 - geometry.height);
  const cells = geometry.cells.map(([x, y]) => {
    const pieceId = solution[(originY + y) * 3 + originX + x]!;
    return revealFor(pieces.get(pieceId)!, rng, difficulty, x, y);
  });
  if (cells.filter((cell) => cell.animal || cell.food).length < 2) {
    const [first, second] = cells;
    if (first) {
      const [x, y] = geometry.cells[0]!;
      const pieceId = solution[(originY + y) * 3 + originX + x]!;
      first.animal = pieces.get(pieceId)!.animal;
    }
    if (second) {
      const [x, y] = geometry.cells[1]!;
      const pieceId = solution[(originY + y) * 3 + originX + x]!;
      second.food = pieces.get(pieceId)!.food;
    }
  }
  return { id, name: geometry.name, width: geometry.width, height: geometry.height, cells };
};

const makeAnchorClue = (
  solution: readonly PieceId[],
  pieces: ReadonlyMap<PieceId, BentoPiece>,
  rng: SeededRandom,
  difficulty: Difficulty,
): CluePattern => {
  const exactPositions = new Set(
    rng
      .shuffle([0, 1, 2, 3, 4, 5, 6, 7, 8])
      .slice(0, DIFFICULTY_PROFILES[difficulty].anchorExactCells),
  );
  return {
    id: 'anchor-map',
    name: 'café map',
    width: 3,
    height: 3,
    cells: solution.map((pieceId, index) => {
      const piece = pieces.get(pieceId)!;
      if (exactPositions.has(index)) {
        return {
          x: index % 3,
          y: Math.floor(index / 3),
          animal: piece.animal,
          food: piece.food,
        };
      }
      return rng.next() < 0.5
        ? { x: index % 3, y: Math.floor(index / 3), animal: piece.animal }
        : { x: index % 3, y: Math.floor(index / 3), food: piece.food };
    }),
  };
};

const cloneClue = (clue: CluePattern, id = clue.id): CluePattern => ({
  ...clue,
  id,
  cells: clue.cells.map((cell) => ({ ...cell })),
});

const exactAnchorAt = (
  anchor: CluePattern,
  position: number,
  solution: readonly PieceId[],
  pieces: ReadonlyMap<PieceId, BentoPiece>,
): CluePattern => {
  const next = cloneClue(anchor);
  const piece = pieces.get(solution[position]!)!;
  next.cells[position] = {
    x: position % 3,
    y: Math.floor(position / 3),
    animal: piece.animal,
    food: piece.food,
  };
  return next;
};

export class PuzzleGenerator {
  create(rawSeed: string, difficulty: Difficulty = 'Gentle'): PuzzleDefinition {
    const seed = normalizeSeed(rawSeed);
    const solutionRng = new SeededRandom(seed);
    const clueRng = new SeededRandom(`${seed}:${difficulty}`);
    const pieces = createAllPieces();
    const pieceMap = createPieceMap(pieces);
    const includedAnimals = solutionRng.shuffle(ANIMALS).slice(0, 3) as [Animal, Animal, Animal];
    const includedSet = new Set(includedAnimals);
    const solution = toBoard(
      solutionRng
        .shuffle(pieces.filter((piece) => includedSet.has(piece.animal)))
        .map((piece) => piece.id),
    );
    const solutionIds = solution as PieceId[];

    let anchor = makeAnchorClue(solutionIds, pieceMap, clueRng, difficulty);
    const selectedClues: CluePattern[] = [];
    const geometries = clueRng.shuffle([...GEOMETRIES, ...clueRng.shuffle(GEOMETRIES).slice(0, 5)]);
    const candidates = geometries.map((geometry, index) =>
      makeSpatialClue(
        solutionIds,
        pieceMap,
        geometry,
        clueRng,
        difficulty,
        `candidate-${index + 1}`,
      ),
    );
    let humanResult = solveHumanly({ pieces, clues: [anchor] });
    const profile = DIFFICULTY_PROFILES[difficulty];

    while (!humanResult.solved && selectedClues.length < profile.maxSpatialClues) {
      const currentUncertainty = logicalUncertainty(humanResult);
      let bestIndex = 0;
      let bestResult = solveHumanly({ pieces, clues: [anchor, ...selectedClues, candidates[0]!] });
      let bestScore = Number.NEGATIVE_INFINITY;

      candidates.forEach((candidate, index) => {
        const result = solveHumanly({ pieces, clues: [anchor, ...selectedClues, candidate] });
        const progress = currentUncertainty - logicalUncertainty(result);
        const score =
          (result.solved ? 1_000_000 : 0) +
          progress * 1_000 +
          result.metrics.forcedPlacements * 10 +
          result.metrics.clueOffsetEliminations;
        if (score > bestScore) {
          bestScore = score;
          bestIndex = index;
          bestResult = result;
        }
      });

      const [chosen] = candidates.splice(bestIndex, 1);
      if (!chosen) break;
      selectedClues.push(cloneClue(chosen, `clue-${selectedClues.length + 1}`));
      humanResult = bestResult;
    }

    while (!humanResult.solved) {
      const unresolvedPositions = anchor.cells
        .map((cell, position) => ({ cell, position }))
        .filter(({ cell }) => !cell.animal || !cell.food);
      if (unresolvedPositions.length === 0) break;

      let bestAnchor = exactAnchorAt(
        anchor,
        unresolvedPositions[0]!.position,
        solutionIds,
        pieceMap,
      );
      let bestResult = solveHumanly({ pieces, clues: [bestAnchor, ...selectedClues] });
      let bestScore = Number.NEGATIVE_INFINITY;
      for (const { position } of unresolvedPositions) {
        const candidateAnchor = exactAnchorAt(anchor, position, solutionIds, pieceMap);
        const result = solveHumanly({ pieces, clues: [candidateAnchor, ...selectedClues] });
        const score =
          (result.solved ? 1_000_000 : 0) -
          logicalUncertainty(result) * 1_000 +
          result.metrics.forcedPlacements * 10;
        if (score > bestScore) {
          bestScore = score;
          bestAnchor = candidateAnchor;
          bestResult = result;
        }
      }
      anchor = bestAnchor;
      humanResult = bestResult;
    }

    const clues = [anchor, ...selectedClues];
    const exactResult = solvePuzzle({ pieces, clues }, 2);
    if (!humanResult.solved || exactResult.count !== 1) {
      throw new Error(`Unable to create a deductive, unique ${difficulty} puzzle for ${seed}.`);
    }
    if (exactResult.firstSolution?.some((pieceId, index) => pieceId !== solution[index])) {
      throw new Error(`Generated clues do not resolve to the intended solution for ${seed}.`);
    }

    return {
      version: 1,
      seed,
      pieces,
      clues,
      difficulty,
      solution,
      metrics: humanResult.metrics,
    };
  }
}
