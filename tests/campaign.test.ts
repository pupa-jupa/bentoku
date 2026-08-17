import { describe, expect, it } from 'vitest';
import {
  CAMPAIGN_CHAPTERS,
  CAMPAIGN_FINAL_DURATION_MS,
  CAMPAIGN_ORDERS,
  getNextCampaignOrder,
  isCampaignOrderUnlocked,
} from '../src/campaign/campaignData';
import {
  CAMPAIGN_STORIES,
  getCampaignStoryForOrder,
  localizeStoryText,
  storyEventId,
  visitorTextureKey,
} from '../src/campaign/storyData';
import { HintController } from '../src/gameplay/HintController';
import { solveHumanly } from '../src/puzzle/HumanSolver';
import { PuzzleGenerator } from '../src/puzzle/PuzzleGenerator';
import { solvePuzzle } from '../src/puzzle/PuzzleSolver';

describe('campaign framework', () => {
  it('defines five six-order chapters and only one timed 1:45 finale', () => {
    expect(CAMPAIGN_CHAPTERS).toHaveLength(5);
    expect(CAMPAIGN_CHAPTERS.every((chapter) => chapter.orders.length === 6)).toBe(true);
    expect(CAMPAIGN_ORDERS).toHaveLength(30);
    expect(new Set(CAMPAIGN_ORDERS.map((order) => order.id)).size).toBe(30);
    expect(new Set(CAMPAIGN_ORDERS.map((order) => order.seed)).size).toBe(30);
    expect(CAMPAIGN_CHAPTERS.map((chapter) => chapter.difficulty)).toEqual([
      'cozy',
      'gentle',
      'clever',
      'tricky',
      'master',
    ]);
    expect(CAMPAIGN_ORDERS.filter((order) => order.timed)).toEqual([
      expect.objectContaining({
        id: 'chapter-5-order-6',
        difficulty: 'master',
        durationMs: CAMPAIGN_FINAL_DURATION_MS,
      }),
    ]);
  });

  it('keeps all thirty fixed orders unique and human-deduction solvable', () => {
    const generator = new PuzzleGenerator();
    const normalizedSeeds = new Set<string>();
    for (const order of CAMPAIGN_ORDERS) {
      const puzzle = generator.create(order.seed, order.difficulty);
      normalizedSeeds.add(puzzle.seed);
      expect(solvePuzzle(puzzle, 2).count, order.id).toBe(1);
      const human = solveHumanly(puzzle);
      expect(human.solved, order.id).toBe(true);
      expect(human.board, order.id).toEqual(puzzle.solution);
    }
    expect(normalizedSeeds.size).toBe(30);
  });

  it('unlocks campaign orders in one linear sequence', () => {
    const completed = new Set<(typeof CAMPAIGN_ORDERS)[number]['id']>();
    expect(isCampaignOrderUnlocked(CAMPAIGN_ORDERS[0]!.id, completed)).toBe(true);
    expect(isCampaignOrderUnlocked(CAMPAIGN_ORDERS[1]!.id, completed)).toBe(false);
    completed.add(CAMPAIGN_ORDERS[0]!.id);
    expect(isCampaignOrderUnlocked(CAMPAIGN_ORDERS[1]!.id, completed)).toBe(true);
    expect(getNextCampaignOrder(CAMPAIGN_ORDERS[0]!.id)?.id).toBe('chapter-1-order-2');
    expect(getNextCampaignOrder(CAMPAIGN_ORDERS[29]!.id)).toBeUndefined();
  });

  it('rejects Reveal through the hint controller when campaign policy disables it', () => {
    const puzzle = new PuzzleGenerator().create('CAMPAIGN-HINT-GUARD', 'cozy');
    expect(new HintController(false).reveal(puzzle, Array(9).fill(null))).toBeNull();
    expect(new HintController(true).reveal(puzzle, Array(9).fill(null))).toBe(0);
  });

  it('provides one complete localized visitor story for every chapter', () => {
    expect(CAMPAIGN_STORIES).toHaveLength(5);
    expect(new Set(CAMPAIGN_STORIES.map((story) => story.visitor.id)).size).toBe(5);

    for (const story of CAMPAIGN_STORIES) {
      expect(story.firstOrderId).toBe(`chapter-${story.chapter}-order-1`);
      expect(story.finalOrderId).toBe(`chapter-${story.chapter}-order-6`);
      expect(story.lines.length).toBeGreaterThanOrEqual(6);
      expect(story.lines.some((line) => line.mood === 'neutral')).toBe(true);
      expect(story.lines.some((line) => line.mood === 'speaking')).toBe(true);
      expect(story.lines.some((line) => line.mood === 'pleased')).toBe(true);
      expect(localizeStoryText(story.opening, 'en')).not.toBe('');
      expect(localizeStoryText(story.opening, 'ru')).not.toBe('');
      expect(storyEventId(story.chapter, 'intro')).toBe(`chapter-${story.chapter}:intro`);
      expect(storyEventId(story.chapter, 'chapterComplete')).toBe(
        `chapter-${story.chapter}:complete`,
      );
      expect(visitorTextureKey(story.visitor.id, 'pleased')).toBe(
        `visitor_${story.visitor.id}_pleased`,
      );
      expect(getCampaignStoryForOrder(story.firstOrderId)).toBe(story);
      expect(getCampaignStoryForOrder(story.finalOrderId)).toBe(story);
    }
  });
});
