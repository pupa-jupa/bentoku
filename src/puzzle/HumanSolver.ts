import { boardSatisfiesPuzzle, getClueOffsets, pieceMatchesCell } from './ConstraintEvaluator';
import { createPieceMap } from './PieceFactory';
import {
  ANIMALS,
  toBoard,
  type Animal,
  type Board,
  type CluePattern,
  type HumanSolveResult,
  type PieceId,
  type PuzzleDefinition,
} from './types';

type HumanPuzzle = Pick<PuzzleDefinition, 'pieces' | 'clues'>;

interface OffsetState {
  clue: CluePattern;
  offsets: Array<{ x: number; y: number }>;
}

const fixedDescriptors = (puzzle: HumanPuzzle) => {
  const descriptors = Array.from({ length: 9 }, () => [] as CluePattern['cells']);
  for (const clue of puzzle.clues) {
    if (clue.width !== 3 || clue.height !== 3) continue;
    for (const cell of clue.cells) descriptors[cell.y * 3 + cell.x]!.push(cell);
  }
  return descriptors;
};

const matchingExists = (
  domains: readonly Set<PieceId>[],
  piecesForFamily: readonly PieceId[],
  forced?: { cell: number; piece: PieceId },
): boolean => {
  const allowed = new Set(piecesForFamily);
  if (forced && (!allowed.has(forced.piece) || !domains[forced.cell]!.has(forced.piece)))
    return false;

  const candidates = domains.map((domain, cell) => {
    if (forced?.cell === cell) return [forced.piece];
    return [...domain].filter((piece) => allowed.has(piece) && piece !== forced?.piece);
  });
  if (candidates.some((items) => items.length === 0)) return false;

  const order = candidates
    .map((items, cell) => ({ cell, size: items.length }))
    .sort((first, second) => first.size - second.size)
    .map(({ cell }) => cell);
  const pieceOwner = new Map<PieceId, number>();

  const assign = (cell: number, visited: Set<PieceId>): boolean => {
    for (const piece of candidates[cell]!) {
      if (visited.has(piece)) continue;
      visited.add(piece);
      const previousCell = pieceOwner.get(piece);
      if (previousCell === undefined || assign(previousCell, visited)) {
        pieceOwner.set(piece, cell);
        return true;
      }
    }
    return false;
  };

  return order.every((cell) => assign(cell, new Set()));
};

const descriptorAt = (clue: CluePattern, offset: { x: number; y: number }, position: number) => {
  const x = position % 3;
  const y = Math.floor(position / 3);
  return clue.cells.find((cell) => cell.x + offset.x === x && cell.y + offset.y === y);
};

/**
 * A deterministic propagation solver. It never assumes a candidate and rolls
 * it back: every removal is supported by a visible fixed mark, a surviving
 * sliding-sketch position, the complete-family rule, or all-different matching.
 * A generated puzzle is accepted only when these deductions reach nine singletons.
 */
export const solveHumanly = (puzzle: HumanPuzzle, initialBoard?: Board): HumanSolveResult => {
  const pieceMap = createPieceMap(puzzle.pieces);
  const allPieceIds = puzzle.pieces.map((piece) => piece.id);
  const descriptors = fixedDescriptors(puzzle);
  const domains = Array.from({ length: 9 }, (_, position) => {
    const placed = initialBoard?.[position];
    if (placed) return new Set<PieceId>(pieceMap.has(placed) ? [placed] : []);
    return new Set(
      puzzle.pieces
        .filter((piece) =>
          descriptors[position]!.every((descriptor) => pieceMatchesCell(piece, descriptor)),
        )
        .map((piece) => piece.id),
    );
  });
  const initialCandidateCount = domains.reduce((total, domain) => total + domain.size, 0);
  const initialForcedPlacements = domains.filter((domain) => domain.size === 1).length;
  const anchorExactCells = descriptors.filter((items) =>
    items.some((item) => Boolean(item.animal && item.food)),
  ).length;
  const offsetStates: OffsetState[] = puzzle.clues
    .filter((clue) => clue.width < 3 || clue.height < 3)
    .map((clue) => ({ clue, offsets: getClueOffsets(clue) }));
  const omittedAnimalCandidates = new Set<Animal>(ANIMALS);
  let candidateEliminations = allPieceIds.length * 9 - initialCandidateCount;
  let familyEliminations = 0;
  let clueOffsetEliminations = 0;
  let forcedPlacements = initialForcedPlacements;
  let rounds = 0;
  let changed = true;

  const piecesForOmittedAnimal = (omittedAnimal: Animal): PieceId[] =>
    puzzle.pieces.filter((piece) => piece.animal !== omittedAnimal).map((piece) => piece.id);

  while (changed && rounds < 50 && domains.every((domain) => domain.size > 0)) {
    changed = false;
    rounds += 1;
    const singletonBefore = domains.filter((domain) => domain.size === 1).length;

    for (const state of offsetStates) {
      const surviving = state.offsets.filter((offset) =>
        state.clue.cells.every((cell) => {
          if (!cell.animal && !cell.food) return true;
          const position = (cell.y + offset.y) * 3 + cell.x + offset.x;
          return [...domains[position]!].some((pieceId) =>
            pieceMatchesCell(pieceMap.get(pieceId)!, cell),
          );
        }),
      );
      if (surviving.length !== state.offsets.length) {
        clueOffsetEliminations += state.offsets.length - surviving.length;
        state.offsets = surviving;
        changed = true;
      }
    }

    for (let position = 0; position < 9; position += 1) {
      for (const pieceId of [...domains[position]!]) {
        const piece = pieceMap.get(pieceId)!;
        const supportedByEveryClue = offsetStates.every((state) =>
          state.offsets.some((offset) => {
            const descriptor = descriptorAt(state.clue, offset, position);
            return (
              !descriptor ||
              (!descriptor.animal && !descriptor.food) ||
              pieceMatchesCell(piece, descriptor)
            );
          }),
        );
        if (!supportedByEveryClue) {
          domains[position]!.delete(pieceId);
          candidateEliminations += 1;
          changed = true;
        }
      }
    }

    for (const omittedAnimal of [...omittedAnimalCandidates]) {
      if (!matchingExists(domains, piecesForOmittedAnimal(omittedAnimal))) {
        omittedAnimalCandidates.delete(omittedAnimal);
        familyEliminations += 1;
        changed = true;
      }
    }

    for (let position = 0; position < 9; position += 1) {
      for (const pieceId of [...domains[position]!]) {
        const hasFamilySupport = [...omittedAnimalCandidates].some((omittedAnimal) =>
          matchingExists(domains, piecesForOmittedAnimal(omittedAnimal), {
            cell: position,
            piece: pieceId,
          }),
        );
        if (!hasFamilySupport) {
          domains[position]!.delete(pieceId);
          candidateEliminations += 1;
          changed = true;
        }
      }
    }

    const singletonAfter = domains.filter((domain) => domain.size === 1).length;
    forcedPlacements += Math.max(0, singletonAfter - singletonBefore);
  }

  const singletonIds = domains.map((domain) => (domain.size === 1 ? [...domain][0]! : undefined));
  const hasNineDistinctSingletons =
    singletonIds.every((piece): piece is PieceId => Boolean(piece)) &&
    new Set(singletonIds).size === 9;
  const candidateBoard = hasNineDistinctSingletons ? toBoard(singletonIds) : undefined;
  const solved = Boolean(
    candidateBoard &&
    omittedAnimalCandidates.size === 1 &&
    boardSatisfiesPuzzle(candidateBoard, puzzle.clues, pieceMap),
  );
  const score =
    (9 - initialForcedPlacements) * 12 +
    Math.max(0, rounds - 1) * 18 +
    offsetStates.length * 10 +
    clueOffsetEliminations +
    familyEliminations * 8;

  return {
    solved,
    stalled: !solved,
    board: solved ? candidateBoard : undefined,
    omittedAnimal:
      solved && omittedAnimalCandidates.size === 1 ? [...omittedAnimalCandidates][0] : undefined,
    cellCandidates: domains.map((domain) => [...domain]),
    omittedAnimalCandidates: [...omittedAnimalCandidates],
    metrics: {
      rounds,
      candidateEliminations,
      familyEliminations,
      clueOffsetEliminations,
      forcedPlacements,
      initialForcedPlacements,
      anchorExactCells,
      spatialClues: offsetStates.length,
      score,
    },
  };
};

export const logicalUncertainty = (result: HumanSolveResult): number =>
  result.cellCandidates.reduce(
    (total, candidates) => total + Math.max(0, candidates.length - 1),
    0,
  ) + Math.max(0, result.omittedAnimalCandidates.length - 1);
