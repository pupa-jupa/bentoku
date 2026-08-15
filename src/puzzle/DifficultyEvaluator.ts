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
}

export const DIFFICULTY_PROFILES: Record<Difficulty, DifficultyProfile> = {
  cozy: {
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
  },
  gentle: {
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
  },
  clever: {
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
  },
  tricky: {
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
  },
  master: {
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
  },
};

export const parseDifficulty = (value: string | null | undefined): Difficulty | undefined => {
  if (!value) return undefined;
  const normalized = value.trim().toLowerCase();
  return DIFFICULTIES.find((difficulty) => difficulty === normalized);
};

export const difficultySlug = (difficulty: Difficulty): string => difficulty;
