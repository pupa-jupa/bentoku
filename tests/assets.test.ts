import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  clueAssets,
  environmentAssets,
  musicAssets,
  pieceAssets,
  soundAssets,
} from '../src/services/AssetRegistry';

const runtimeAssets = [...pieceAssets, ...clueAssets, ...environmentAssets];

const expectedSoundProfiles = {
  piece_pick: { duration: 0.28, peakDb: -20 },
  piece_drop: { duration: 0.42, peakDb: -17 },
  piece_swap: { duration: 0.62, peakDb: -17.5 },
  piece_return: { duration: 0.56, peakDb: -18 },
  note_open: { duration: 0.68, peakDb: -18 },
  board_incorrect: { duration: 0.82, peakDb: -15.5 },
  hint_reveal: { duration: 0.82, peakDb: -18 },
  success: { duration: 1.42, peakDb: -13 },
  ui_tap: { duration: 0.18, peakDb: -22 },
} satisfies Record<keyof typeof soundAssets, { duration: number; peakDb: number }>;

const walk = (directory: string): string[] =>
  readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(fullPath) : [fullPath];
  });

describe('production assets', () => {
  it('registers only WebP images that exist', () => {
    expect(runtimeAssets).toHaveLength(25);
    for (const asset of runtimeAssets) {
      expect(asset.path.endsWith('.webp'), asset.path).toBe(true);
      expect(() => readdirSync(path.dirname(path.join('public', asset.path)))).not.toThrow();
      expect(walk('public').map((file) => file.replaceAll('\\', '/'))).toContain(
        path.join('public', asset.path).replaceAll('\\', '/'),
      );
    }
  });

  it('contains no raw PNG or JPEG files in the public runtime tree', () => {
    const rawImages = walk('public').filter((file) => /\.(png|jpe?g)$/i.test(file));
    expect(rawImages).toEqual([]);
  });

  it('registers four compressed music tracks that exist', () => {
    expect(musicAssets).toHaveLength(4);
    for (const asset of musicAssets) {
      const file = path.join('public', asset.path);
      expect(asset.path.endsWith('.mp3'), asset.path).toBe(true);
      expect(walk('public').map((entry) => entry.replaceAll('\\', '/'))).toContain(
        file.replaceAll('\\', '/'),
      );
    }
  });

  it('registers nine mono 48 kHz PCM sound effects with valid WAV headers', () => {
    expect(Object.keys(soundAssets)).toHaveLength(9);
    for (const [name, asset] of Object.entries(soundAssets) as Array<
      [keyof typeof soundAssets, (typeof soundAssets)[keyof typeof soundAssets]]
    >) {
      const file = path.join('public', asset.path);
      const wav = readFileSync(file);
      expect(asset.path.endsWith('.wav'), asset.path).toBe(true);
      expect(wav.toString('ascii', 0, 4), asset.path).toBe('RIFF');
      expect(wav.toString('ascii', 8, 12), asset.path).toBe('WAVE');
      expect(wav.readUInt16LE(22), asset.path).toBe(1);
      expect(wav.readUInt32LE(24), asset.path).toBe(48_000);
      expect(wav.readUInt16LE(34), asset.path).toBe(16);
      const dataSize = wav.readUInt32LE(40);
      const duration = dataSize / (48_000 * 2);
      let peak = 0;
      for (let offset = 44; offset < wav.length; offset += 2) {
        peak = Math.max(peak, Math.abs(wav.readInt16LE(offset)) / 32_768);
      }
      const peakDb = 20 * Math.log10(peak);
      expect(duration, asset.path).toBeCloseTo(expectedSoundProfiles[name].duration, 3);
      expect(Math.abs(peakDb - expectedSoundProfiles[name].peakDb), asset.path).toBeLessThan(0.35);
      expect(wav.readInt16LE(44), asset.path).toBe(0);
      expect(wav.readInt16LE(wav.length - 2), asset.path).toBe(0);
    }
  });
});
