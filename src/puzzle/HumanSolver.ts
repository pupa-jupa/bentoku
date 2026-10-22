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
  for (let cell = 0; cell < domains.length; cell++) {
    if (forced?.cell === cell) {
      candidates.push([forced.piece]);
    } else {
      const cellCandidates: PieceId[] = [];
      const domain = domains[cell]!;
      for (const piece of domain) {
        if (allowed.has(piece) && piece !== forced?.piece) {
          cellCandidates.push(piece);
        }
      }
      candidates.push(cellCandidates);
    }
    if (candidates[cell]!.length === 0) return false;
  }

  const order: { cell: number; size: number }[] = [];
  for (let cell = 0; cell < candidates.length; cell++) {
    order.push({ cell, size: candidates[cell]!.length });
  }
  order.sort((first, second) => first.size - second.size);
  const orderedCells = order.map(({ cell }) => cell);
  const pieceOwner = new Map<PieceId, number>();

  const assign = (cell: number, visited: Set<PieceId>): boolean => {
    const candidateList = candidates[cell]!;
    for (let i = 0; i < candidateList.length; i++) {
      const piece = candidateList[i]!;
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

  for (let i = 0; i < orderedCells.length; i++) {
    if (!assign(orderedCells[i]!, new Set())) return false;
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
  const allPieceIds: PieceId[] = [];
  for (let i = 0; i < puzzle.pieces.length; i++) {
    allPieceIds.push(puzzle.pieces[i]!.id);
  }
  const descriptors = fixedDescriptors(puzzle);
  const domains: Set<PieceId>[] = [];

  for (let position = 0; position < 9; position++) {
    const placed = initialBoard?.[position];
    if (placed) {
      domains.push(new Set<PieceId>(pieceMap.has(placed) ? [placed] : []));
    } else {
      const cellDomain = new Set<PieceId>();
      for (let i = 0; i < puzzle.pieces.length; i++) {
        const piece = puzzle.pieces[i]!;
        let allowed = true;
        for (let j = 0; j < descriptors[position]!.length; j++) {
          if (!pieceMatchesCell(piece, descriptors[position]![j]!)) {
            allowed = false;
            break;
          }
        }
        if (allowed) cellDomain.add(piece.id);
      }
      domains.push(cellDomain);
    }
  }

  let initialCandidateCount = 0;
  let initialForcedPlacements = 0;
  for (let i = 0; i < domains.length; i++) {
    const size = domains[i]!.size;
    initialCandidateCount += size;
    if (size === 1) initialForcedPlacements++;
  }

  let anchorExactCells = 0;
  for (let i = 0; i < descriptors.length; i++) {
    const items = descriptors[i]!;
    for (let j = 0; j < items.length; j++) {
      const item = items[j]!;
      if (item.animal && item.food) {
        anchorExactCells++;
        break;
      }
    }
  }

  const offsetStates: OffsetState[] = [];
  for (let i = 0; i < puzzle.clues.length; i++) {
    const clue = puzzle.clues[i]!;
    if (clue.width < 3 || clue.height < 3) {
      offsetStates.push({ clue, offsets: getClueOffsets(clue) });
    }
  }
  const omittedAnimalCandidates = new Set<Animal>(ANIMALS);
  let candidateEliminations = allPieceIds.length * 9 - initialCandidateCount;
  let familyEliminations = 0;
  let clueOffsetEliminations = 0;
  let forcedPlacements = initialForcedPlacements;
  let rounds = 0;
  let changed = true;

  const piecesByOmittedAnimal = new Map<Animal, PieceId[]>();
  for (let i = 0; i < ANIMALS.length; i++) {
    const omittedAnimal = ANIMALS[i]!;
    const ids: PieceId[] = [];
    for (let j = 0; j < puzzle.pieces.length; j++) {
      const piece = puzzle.pieces[j]!;
      if (piece.animal !== omittedAnimal) ids.push(piece.id);
    }
    piecesByOmittedAnimal.set(omittedAnimal, ids);
  }
  const piecesForOmittedAnimal = (omittedAnimal: Animal): PieceId[] =>
    piecesByOmittedAnimal.get(omittedAnimal)!;

  const allDomainsHaveCandidates = (): boolean => {
    for (let i = 0; i < domains.length; i++) {
      if (domains[i]!.size === 0) return false;
    }
    return true;
  };

  while (changed && rounds < 50 && allDomainsHaveCandidates()) {
    changed = false;
    rounds += 1;
    let singletonBefore = 0;
    for (let i = 0; i < domains.length; i++) {
      if (domains[i]!.size === 1) singletonBefore++;
    }

    for (const state of offsetStates) {
      const surviving: { x: number; y: number }[] = [];
      for (let i = 0; i < state.offsets.length; i++) {
        const offset = state.offsets[i]!;
        let allCellsMatch = true;
        for (let j = 0; j < state.clue.cells.length; j++) {
          const cell = state.clue.cells[j]!;
          if (!cell.animal && !cell.food) continue;
          const position = (cell.y + offset.y) * 3 + cell.x + offset.x;

          const domain = domains[position]!;
          let anyPieceMatches = false;
          for (const pieceId of domain) {
            if (pieceMatchesCell(pieceMap.get(pieceId)!, cell)) {
              anyPieceMatches = true;
              break;
            }
          }
          if (!anyPieceMatches) {
            allCellsMatch = false;
            break;
          }
        }
        if (allCellsMatch) surviving.push(offset);
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
          const state = offsetStates[i]!;
          let anyOffsetMatches = false;
          for (let j = 0; j < state.offsets.length; j++) {
            const offset = state.offsets[j]!;
            const descriptor = descriptorAt(state.clue, offset, position);
            if (
              !descriptor ||
              (!descriptor.animal && !descriptor.food) ||
              pieceMatchesCell(piece, descriptor)
            ) {
              anyOffsetMatches = true;
              break;
            }
          }
          if (!anyOffsetMatches) {
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
        let hasFamilySupport = false;
        for (const omittedAnimal of omittedAnimalCandidates) {
          if (
            matchingExists(domains, piecesForOmittedAnimal(omittedAnimal), {
              cell: position,
              piece: pieceId,
            })
          ) {
            hasFamilySupport = true;
            break;
          }
        }
        if (!hasFamilySupport) {
          domains[position]!.delete(pieceId);
          candidateEliminations += 1;
          changed = true;
        }
      }
    }

    let singletonAfter = 0;
    for (let i = 0; i < domains.length; i++) {
      if (domains[i]!.size === 1) singletonAfter++;
    }
    forcedPlacements += Math.max(0, singletonAfter - singletonBefore);
  }

  const singletonIds: (PieceId | undefined)[] = [];
  let allSingletonsValid = true;
  for (let i = 0; i < domains.length; i++) {
    const domain = domains[i]!;
    if (domain.size === 1) {
      singletonIds.push([...domain][0]!);
    } else {
      singletonIds.push(undefined);
      allSingletonsValid = false;
    }
  }

  const hasNineDistinctSingletons = allSingletonsValid && new Set(singletonIds).size === 9;
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
    cellCandidates: domains.map((domain) => {
      const arr: PieceId[] = [];
      for (const p of domain) arr.push(p);
      return arr;
    }),
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
