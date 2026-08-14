import { DIFFICULTIES, type Difficulty } from './types';

export interface DifficultyProfile {
  anchorExactCells: number;
  maxSpatialClues: number;
  wildcardChance: number;
  animalChance: number;
  foodChance: number;
  description: string;
}

export const DIFFICULTY_PROFILES: Record<Difficulty, DifficultyProfile> = {
  Cozy: {
    anchorExactCells: 6,
    maxSpatialClues: 2,
    wildcardChance: 0,
    animalChance: 0.2,
    foodChance: 0.2,
    description: 'More exact marks and short deduction chains.',
  },
  Gentle: {
    anchorExactCells: 3,
    maxSpatialClues: 3,
    wildcardChance: 0.03,
    animalChance: 0.29,
    foodChance: 0.28,
    description: 'A balanced café note with a few linked steps.',
  },
  Clever: {
    anchorExactCells: 1,
    maxSpatialClues: 4,
    wildcardChance: 0.08,
    animalChance: 0.36,
    foodChance: 0.34,
    description: 'Longer chains across several sliding sketches.',
  },
  Tricky: {
    anchorExactCells: 0,
    maxSpatialClues: 4,
    wildcardChance: 0.13,
    animalChance: 0.39,
    foodChance: 0.36,
    description: 'The deepest deductions, still with no guessing.',
  },
};

export const parseDifficulty = (value: string | null | undefined): Difficulty | undefined => {
  if (!value) return undefined;
  const normalized = value.trim().toLowerCase();
  return DIFFICULTIES.find((difficulty) => difficulty.toLowerCase() === normalized);
};

export const difficultySlug = (difficulty: Difficulty): string => difficulty.toLowerCase();
