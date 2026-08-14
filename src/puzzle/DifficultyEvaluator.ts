import { DIFFICULTIES, type Difficulty } from './types';

export interface DifficultyProfile {
  anchorVisibleCells: number;
  maxAnchorCells: number;
  anchorExactCells: number;
  minSpatialClues: number;
  maxSpatialClues: number;
  minSpatialCells: number;
  minSpatialMarks: number;
  wildcardChance: number;
  animalChance: number;
  foodChance: number;
  description: string;
}

export const DIFFICULTY_PROFILES: Record<Difficulty, DifficultyProfile> = {
  Cozy: {
    anchorVisibleCells: 9,
    maxAnchorCells: 9,
    anchorExactCells: 6,
    minSpatialClues: 0,
    maxSpatialClues: 2,
    minSpatialCells: 2,
    minSpatialMarks: 2,
    wildcardChance: 0,
    animalChance: 0.2,
    foodChance: 0.2,
    description: 'More exact marks and short deduction chains.',
  },
  Gentle: {
    anchorVisibleCells: 9,
    maxAnchorCells: 9,
    anchorExactCells: 3,
    minSpatialClues: 0,
    maxSpatialClues: 3,
    minSpatialCells: 2,
    minSpatialMarks: 2,
    wildcardChance: 0.03,
    animalChance: 0.29,
    foodChance: 0.28,
    description: 'A balanced café note with a few linked steps.',
  },
  Clever: {
    anchorVisibleCells: 9,
    maxAnchorCells: 9,
    anchorExactCells: 1,
    minSpatialClues: 0,
    maxSpatialClues: 4,
    minSpatialCells: 2,
    minSpatialMarks: 2,
    wildcardChance: 0.08,
    animalChance: 0.36,
    foodChance: 0.34,
    description: 'Longer chains across several sliding sketches.',
  },
  Tricky: {
    anchorVisibleCells: 9,
    maxAnchorCells: 9,
    anchorExactCells: 0,
    minSpatialClues: 0,
    maxSpatialClues: 4,
    minSpatialCells: 2,
    minSpatialMarks: 2,
    wildcardChance: 0.13,
    animalChance: 0.39,
    foodChance: 0.36,
    description: 'The deepest deductions, still with no guessing.',
  },
  Master: {
    anchorVisibleCells: 6,
    maxAnchorCells: 8,
    anchorExactCells: 0,
    minSpatialClues: 5,
    maxSpatialClues: 6,
    minSpatialCells: 3,
    minSpatialMarks: 3,
    wildcardChance: 0.08,
    animalChance: 0.42,
    foodChance: 0.42,
    description: 'A partial café map and more interlocking sketches for the longest logic chains.',
  },
};

export const parseDifficulty = (value: string | null | undefined): Difficulty | undefined => {
  if (!value) return undefined;
  const normalized = value.trim().toLowerCase();
  return DIFFICULTIES.find((difficulty) => difficulty.toLowerCase() === normalized);
};

export const difficultySlug = (difficulty: Difficulty): string => difficulty.toLowerCase();
