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

  const candidates: PieceId[][] = [];
  for (let cell = 0; cell < 9; cell++) {
    if (forced?.cell === cell) {
      candidates.push([forced.piece]);
      continue;
    }
    const cellCandidates: PieceId[] = [];
    for (const piece of domains[cell]!) {
      if (allowed.has(piece) && piece !== forced?.piece) {
        cellCandidates.push(piece as PieceId);
      }
    }
    if (cellCandidates.length === 0) return false;
    candidates.push(cellCandidates);
  }

  // Pre-allocate the visited set so we don't recreate it for every assignment
  const visited = new Set<PieceId>();
  const pieceOwner = new Map<PieceId, number>();

  const assign = (cell: number): boolean => {
    const candidatesCell = candidates[cell]!;
    for (let i = 0; i < candidatesCell.length; i++) {
      const piece = candidatesCell[i] as PieceId;
      if (!piece) continue;
      if (visited.has(piece)) continue;
      visited.add(piece);
      const previousCell = pieceOwner.get(piece);
      if (previousCell === undefined || assign(previousCell)) {
        pieceOwner.set(piece, cell);
        return true;
      }
    }
    return false;
  };

  // Sort by fewest candidates first for faster failure
  const order = candidates
    .map((items, cell) => ({ cell, size: items.length }))
    .sort((first, second) => first.size - second.size);

  for (let i = 0; i < order.length; i++) {
    visited.clear();
    if (!order[i] || !assign(order[i]!.cell)) return false;
  }
  return true;
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

  const memoPiecesForOmittedAnimal = new Map<Animal, PieceId[]>();
  const piecesForOmittedAnimal = (omittedAnimal: Animal): PieceId[] => {
    let result = memoPiecesForOmittedAnimal.get(omittedAnimal);
    if (!result) {
      result = puzzle.pieces
        .filter((piece) => piece.animal !== omittedAnimal)
        .map((piece) => piece.id);
      memoPiecesForOmittedAnimal.set(omittedAnimal, result);
    }
    return result;
  };

  while (changed && rounds < 50 && domains.every((domain) => domain.size > 0)) {
    changed = false;
    rounds += 1;
    const singletonBefore = domains.filter((domain) => domain.size === 1).length;

    for (let stateIdx = 0; stateIdx < offsetStates.length; stateIdx++) {
      const state = offsetStates[stateIdx];
      if (!state) continue;
      const surviving = [];
      for (let i = 0; i < state.offsets.length; i++) {
        const offset = state.offsets[i];
        if (!offset) continue;
        let offsetMatches = true;
        for (let j = 0; j < state.clue.cells.length; j++) {
          const cell = state.clue.cells[j];
          if (!cell) continue;
          if (!cell.animal && !cell.food) continue;
          const position = (cell.y + offset.y) * 3 + cell.x + offset.x;
          const domain = domains[position]!;
          let cellMatches = false;
          for (const pieceId of domain) {
            if (pieceMatchesCell(pieceMap.get(pieceId)!, cell)) {
              cellMatches = true;
              break;
            }
          }
          if (!cellMatches) {
            offsetMatches = false;
            break;
          }
        }
        if (offsetMatches) {
          surviving.push(offset);
        }
      }
      if (surviving.length !== state.offsets.length) {
        clueOffsetEliminations += state.offsets.length - surviving.length;
        state.offsets = surviving;
        changed = true;
      }
    }

    for (let position = 0; position < 9; position += 1) {
      for (const pieceId of [...domains[position]!]) {
        const piece = pieceMap.get(pieceId)!;
        let supportedByEveryClue = true;
        for (let i = 0; i < offsetStates.length; i++) {
          const state = offsetStates[i];
          if (!state) continue;
          let someOffsetSupported = false;
          for (let j = 0; j < state.offsets.length; j++) {
            const offset = state.offsets[j];
            if (!offset) continue;
            const descriptor = descriptorAt(state.clue, offset, position);
            if (
              !descriptor ||
              (!descriptor.animal && !descriptor.food) ||
              pieceMatchesCell(piece, descriptor)
            ) {
              someOffsetSupported = true;
              break;
            }
          }
          if (!someOffsetSupported) {
            supportedByEveryClue = false;
            break;
          }
        }
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
