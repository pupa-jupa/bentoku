import type { CampaignOrderId } from '../campaign/campaignData';

export interface PlayContext {
  source: 'infinite' | 'campaign' | 'rush';
  campaignOrderId?: CampaignOrderId;
  timed: boolean;
  durationMs?: number;
  allowReveal: boolean;
  returnTarget: 'menu' | 'campaign';
}

export const INFINITE_PLAY_CONTEXT: PlayContext = {
  source: 'infinite',
  timed: false,
  allowReveal: true,
  returnTarget: 'menu',
};

export const RUSH_PLAY_CONTEXT: PlayContext = {
  source: 'rush',
  timed: true,
  durationMs: 105_000,
  allowReveal: false,
  returnTarget: 'menu',
};

export const campaignPlayContext = (
  campaignOrderId: CampaignOrderId,
  timed: boolean,
  durationMs?: number,
): PlayContext => ({
  source: 'campaign',
  campaignOrderId,
  timed,
  ...(durationMs ? { durationMs } : {}),
  allowReveal: false,
  returnTarget: 'campaign',
});
