import { ANIMALS, FOODS, type Animal, type BentoPiece, type PieceId } from './types';

export const makePieceId = (animal: Animal, food: (typeof FOODS)[number]): PieceId =>
  `${animal}_${food}`;

export const createAllPieces = (): BentoPiece[] =>
  ANIMALS.flatMap((animal) =>
    FOODS.map((food) => ({
      id: makePieceId(animal, food),
      animal,
      food,
      textureKey: `piece_${animal}_${food}`,
    })),
  );

export const createPieceMap = (pieces: readonly BentoPiece[]): Map<PieceId, BentoPiece> =>
  new Map(pieces.map((piece) => [piece.id, piece]));
