import { evaluateDifficulty } from './DifficultyEvaluator';
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

const revealFor = (piece: BentoPiece, rng: SeededRandom, x: number, y: number): ClueCell => {
  const roll = rng.next();
  if (roll < 0.14) return { x, y };
  if (roll < 0.54) return { x, y, animal: piece.animal };
  if (roll < 0.9) return { x, y, food: piece.food };
  return { x, y, animal: piece.animal, food: piece.food };
};

const makeSpatialClue = (
  solution: readonly PieceId[],
  pieces: ReadonlyMap<PieceId, BentoPiece>,
  geometry: Geometry,
  rng: SeededRandom,
  id: string,
): CluePattern => {
  const originX = rng.int(4 - geometry.width);
  const originY = rng.int(4 - geometry.height);
  const cells = geometry.cells.map(([x, y]) => {
    const pieceId = solution[(originY + y) * 3 + originX + x]!;
    return revealFor(pieces.get(pieceId)!, rng, x, y);
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
): CluePattern => ({
  id: 'anchor-map',
  name: 'café map',
  width: 3,
  height: 3,
  cells: solution.map((pieceId, index) => {
    const piece = pieces.get(pieceId)!;
    return index % 2 === rng.int(2)
      ? { x: index % 3, y: Math.floor(index / 3), animal: piece.animal }
      : { x: index % 3, y: Math.floor(index / 3), food: piece.food };
  }),
});

export class PuzzleGenerator {
  create(rawSeed: string): PuzzleDefinition {
    const seed = normalizeSeed(rawSeed);
    const rng = new SeededRandom(seed);
    const pieces = createAllPieces();
    const pieceMap = createPieceMap(pieces);
    const activeAnimals = rng.shuffle(ANIMALS).slice(0, 3) as [Animal, Animal, Animal];
    const activeSet = new Set(activeAnimals);
    const solution = toBoard(
      rng.shuffle(pieces.filter((piece) => activeSet.has(piece.animal))).map((piece) => piece.id),
    );

    const clues: CluePattern[] = [makeAnchorClue(solution as PieceId[], pieceMap, rng)];
    let solveResult = solvePuzzle({ activeAnimals, pieces, clues });
    const geometries = rng.shuffle(GEOMETRIES);

    // Four large notes fit the paper as a stable 2 × 2 set. If they are not
    // sufficient, the fixed map below is progressively made more specific.
    for (let index = 0; solveResult.count !== 1 && index < 4; index += 1) {
      const geometry = geometries[index % geometries.length]!;
      clues.push(
        makeSpatialClue(solution as PieceId[], pieceMap, geometry, rng, `clue-${index + 1}`),
      );
      solveResult = solvePuzzle({ activeAnimals, pieces, clues });
    }

    let fallbackIndex = 0;
    const fallbackOrder = rng.shuffle([0, 1, 2, 3, 4, 5, 6, 7, 8]);
    const anchor = clues[0]!;
    while (solveResult.count !== 1 && fallbackIndex < 9) {
      const position = fallbackOrder[fallbackIndex]!;
      const piece = pieceMap.get(solution[position] as PieceId)!;
      anchor.cells[position] = {
        x: position % 3,
        y: Math.floor(position / 3),
        animal: piece.animal,
        food: piece.food,
      };
      fallbackIndex += 1;
      solveResult = solvePuzzle({ activeAnimals, pieces, clues });
    }

    if (solveResult.count !== 1) {
      anchor.cells = solution.map((pieceId, position) => {
        const piece = pieceMap.get(pieceId as PieceId)!;
        return {
          x: position % 3,
          y: Math.floor(position / 3),
          animal: piece.animal,
          food: piece.food,
        };
      });
      solveResult = solvePuzzle({ activeAnimals, pieces, clues });
    }

    if (solveResult.count !== 1) throw new Error(`Unable to create a unique puzzle for ${seed}.`);

    return {
      version: 1,
      seed,
      activeAnimals,
      pieces,
      clues,
      difficulty: evaluateDifficulty(solveResult.metrics),
      solution,
      metrics: solveResult.metrics,
    };
  }
}
