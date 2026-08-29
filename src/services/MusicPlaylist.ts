import type { MusicAssetEntry } from './AssetRegistry';

export const resolveTrackIndex = (
  tracks: readonly MusicAssetEntry[],
  requestedKey: string | undefined,
): number => {
  const index = requestedKey ? tracks.findIndex((track) => track.key === requestedKey) : -1;
  return index >= 0 ? index : 0;
};

export const adjacentTrack = (
  tracks: readonly MusicAssetEntry[],
  currentKey: string | undefined,
  direction: -1 | 1,
): MusicAssetEntry | undefined => {
  if (tracks.length === 0) return undefined;
  const currentIndex = resolveTrackIndex(tracks, currentKey);
  return tracks[(currentIndex + direction + tracks.length) % tracks.length];
};
