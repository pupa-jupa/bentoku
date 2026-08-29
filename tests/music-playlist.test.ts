import { describe, expect, it } from 'vitest';
import { musicAssets } from '../src/services/AssetRegistry';
import { adjacentTrack, resolveTrackIndex } from '../src/services/MusicPlaylist';

describe('music playlist selection', () => {
  it('falls back to the first registered track', () => {
    expect(resolveTrackIndex(musicAssets, 'missing')).toBe(0);
    expect(resolveTrackIndex(musicAssets, undefined)).toBe(0);
  });

  it('wraps previous and next selection', () => {
    expect(adjacentTrack(musicAssets, musicAssets[0]!.key, -1)?.key).toBe(musicAssets.at(-1)?.key);
    expect(adjacentTrack(musicAssets, musicAssets.at(-1)?.key, 1)?.key).toBe(musicAssets[0]!.key);
  });
});
