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
    const domain = domains[cell]!;
    if (forced?.cell === cell) {
      candidates.push([forced.piece]);
      continue;
    }
    const filtered: PieceId[] = [];
    for (const piece of domain) {
      if (allowed.has(piece) && piece !== forced?.piece) {
        filtered.push(piece);
      }
    }
    candidates.push(filtered);
  }
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

  for (let i = 0; i < order.length; i++) {
    if (!assign(order[i]!, new Set())) {
      return false;
    }
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
  const domains: Set<PieceId>[] = [];
  for (let position = 0; position < 9; position++) {
    const placed = initialBoard?.[position];
    if (placed) {
      domains.push(new Set<PieceId>(pieceMap.has(placed) ? [placed] : []));
    } else {
      const allowedPieces: PieceId[] = [];
      const cellDescriptors = descriptors[position]!;
      for (let i = 0; i < puzzle.pieces.length; i++) {
        const piece = puzzle.pieces[i]!;
        let matches = true;
        for (let j = 0; j < cellDescriptors.length; j++) {
          if (!pieceMatchesCell(piece, cellDescriptors[j]!)) {
            matches = false;
            break;
          }
        }
        if (matches) allowedPieces.push(piece.id);
      }
      domains.push(new Set(allowedPieces));
    }
  }
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

  const piecesForOmittedAnimal = (omittedAnimal: Animal): PieceId[] => {
    const pieces: PieceId[] = [];
    for (let i = 0; i < puzzle.pieces.length; i++) {
      if (puzzle.pieces[i]!.animal !== omittedAnimal) {
        pieces.push(puzzle.pieces[i]!.id);
      }
    }
    return pieces;
  };

  while (changed && rounds < 50) {
    let anyEmpty = false;
    for (let i = 0; i < 9; i++) {
      if (domains[i]!.size === 0) {
        anyEmpty = true;
        break;
      }
    }
    if (anyEmpty) break;

    changed = false;
    rounds += 1;
    let singletonBefore = 0;
    for (let i = 0; i < 9; i++) {
      if (domains[i]!.size === 1) singletonBefore += 1;
    }

    for (const state of offsetStates) {
      const surviving: Array<{ x: number; y: number }> = [];
      for (let i = 0; i < state.offsets.length; i++) {
        const offset = state.offsets[i]!;
        let allCellsMatch = true;
        for (let j = 0; j < state.clue.cells.length; j++) {
          const cell = state.clue.cells[j]!;
          if (!cell.animal && !cell.food) continue;
          const position = (cell.y + offset.y) * 3 + cell.x + offset.x;
          let anyPieceMatches = false;
          for (const pieceId of domains[position]!) {
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
      for (const pieceId of domains[position]!) {
        const piece = pieceMap.get(pieceId)!;
        let supportedByEveryClue = true;
        for (let i = 0; i < offsetStates.length; i++) {
          const state = offsetStates[i]!;
          let someOffsetSupported = false;
          for (let j = 0; j < state.offsets.length; j++) {
            const offset = state.offsets[j]!;
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

    for (const omittedAnimal of omittedAnimalCandidates) {
      if (!matchingExists(domains, piecesForOmittedAnimal(omittedAnimal))) {
        omittedAnimalCandidates.delete(omittedAnimal);
        familyEliminations += 1;
        changed = true;
      }
    }

    for (let position = 0; position < 9; position += 1) {
      for (const pieceId of domains[position]!) {
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
    for (let i = 0; i < 9; i++) {
      if (domains[i]!.size === 1) singletonAfter += 1;
    }
    forcedPlacements += Math.max(0, singletonAfter - singletonBefore);
  }

  const singletonIds: (PieceId | undefined)[] = [];
  for (let i = 0; i < 9; i++) {
    const domain = domains[i]!;
    if (domain.size === 1) {
      for (const piece of domain) {
        singletonIds.push(piece);
        break;
      }
    } else {
      singletonIds.push(undefined);
    }
  }

  const hasNineDistinctSingletons =
    singletonIds.every((piece): piece is PieceId => Boolean(piece)) &&
    new Set(singletonIds).size === 9;
  const candidateBoard = hasNineDistinctSingletons ? toBoard(singletonIds) : undefined;
  const solved = Boolean(
    candidateBoard &&
    omittedAnimalCandidates.size === 1 &&
    boardSatisfiesPuzzle(candidateBoard, puzzle.clues, pieceMap),
  );

  let omittedAnimal: Animal | undefined;
  if (solved && omittedAnimalCandidates.size === 1) {
    for (const animal of omittedAnimalCandidates) {
      omittedAnimal = animal;
      break;
    }
  }

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
    omittedAnimal,
    cellCandidates: Array.from({ length: 9 }, (_, i) => {
      const candidates: PieceId[] = [];
      for (const piece of domains[i]!) candidates.push(piece);
      return candidates;
    }),
    omittedAnimalCandidates: (() => {
      const animals: Animal[] = [];
      for (const animal of omittedAnimalCandidates) animals.push(animal);
      return animals;
    })(),
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
