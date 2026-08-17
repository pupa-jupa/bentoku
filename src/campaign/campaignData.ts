import type { Difficulty } from '../puzzle/types';

export type CampaignChapterNumber = 1 | 2 | 3 | 4 | 5;
export type CampaignOrderNumber = 1 | 2 | 3 | 4 | 5 | 6;
export type CampaignOrderId = `chapter-${CampaignChapterNumber}-order-${CampaignOrderNumber}`;

export interface CampaignOrder {
  id: CampaignOrderId;
  chapter: CampaignChapterNumber;
  order: CampaignOrderNumber;
  seed: string;
  difficulty: Difficulty;
  timed: boolean;
  durationMs?: number;
}

export interface CampaignChapter {
  id: `chapter-${CampaignChapterNumber}`;
  number: CampaignChapterNumber;
  titleKey:
    | 'campaign.chapter1'
    | 'campaign.chapter2'
    | 'campaign.chapter3'
    | 'campaign.chapter4'
    | 'campaign.chapter5';
  visitorKey:
    | 'campaign.visitor.anya'
    | 'campaign.visitor.lev'
    | 'campaign.visitor.mina'
    | 'campaign.visitor.margot'
    | 'campaign.visitor.aoi';
  difficulty: Difficulty;
  orders: readonly CampaignOrder[];
}

export const CAMPAIGN_FINAL_DURATION_MS = 105_000;

const chapterSpecs = [
  {
    number: 1,
    difficulty: 'cozy',
    titleKey: 'campaign.chapter1',
    visitorKey: 'campaign.visitor.anya',
  },
  {
    number: 2,
    difficulty: 'gentle',
    titleKey: 'campaign.chapter2',
    visitorKey: 'campaign.visitor.lev',
  },
  {
    number: 3,
    difficulty: 'clever',
    titleKey: 'campaign.chapter3',
    visitorKey: 'campaign.visitor.mina',
  },
  {
    number: 4,
    difficulty: 'tricky',
    titleKey: 'campaign.chapter4',
    visitorKey: 'campaign.visitor.margot',
  },
  {
    number: 5,
    difficulty: 'master',
    titleKey: 'campaign.chapter5',
    visitorKey: 'campaign.visitor.aoi',
  },
] as const satisfies ReadonlyArray<{
  number: CampaignChapterNumber;
  difficulty: Difficulty;
  titleKey: CampaignChapter['titleKey'];
  visitorKey: CampaignChapter['visitorKey'];
}>;

export const CAMPAIGN_CHAPTERS: readonly CampaignChapter[] = chapterSpecs.map((chapter) => ({
  id: `chapter-${chapter.number}`,
  number: chapter.number,
  titleKey: chapter.titleKey,
  visitorKey: chapter.visitorKey,
  difficulty: chapter.difficulty,
  orders: Array.from({ length: 6 }, (_, index): CampaignOrder => {
    const order = (index + 1) as CampaignOrderNumber;
    const timed = chapter.number === 5 && order === 6;
    return {
      id: `chapter-${chapter.number}-order-${order}`,
      chapter: chapter.number,
      order,
      seed: `C${chapter.number}O${order}FEST`,
      difficulty: chapter.difficulty,
      timed,
      ...(timed ? { durationMs: CAMPAIGN_FINAL_DURATION_MS } : {}),
    };
  }),
}));

export const CAMPAIGN_ORDERS: readonly CampaignOrder[] = CAMPAIGN_CHAPTERS.flatMap(
  (chapter) => chapter.orders,
);

const campaignOrderMap = new Map(CAMPAIGN_ORDERS.map((order) => [order.id, order]));

export const isCampaignOrderId = (value: unknown): value is CampaignOrderId =>
  typeof value === 'string' && campaignOrderMap.has(value as CampaignOrderId);

export const getCampaignOrder = (orderId: CampaignOrderId): CampaignOrder =>
  campaignOrderMap.get(orderId)!;

export const getNextCampaignOrder = (orderId: CampaignOrderId): CampaignOrder | undefined => {
  const index = CAMPAIGN_ORDERS.findIndex((order) => order.id === orderId);
  return index >= 0 ? CAMPAIGN_ORDERS[index + 1] : undefined;
};

export const isCampaignOrderUnlocked = (
  orderId: CampaignOrderId,
  completedOrderIds: ReadonlySet<CampaignOrderId>,
): boolean => {
  const index = CAMPAIGN_ORDERS.findIndex((order) => order.id === orderId);
  return index === 0 || completedOrderIds.has(CAMPAIGN_ORDERS[index - 1]!.id);
};

export const firstIncompleteCampaignOrder = (
  completedOrderIds: ReadonlySet<CampaignOrderId>,
): CampaignOrder =>
  CAMPAIGN_ORDERS.find((order) => !completedOrderIds.has(order.id)) ??
  CAMPAIGN_ORDERS[CAMPAIGN_ORDERS.length - 1]!;
