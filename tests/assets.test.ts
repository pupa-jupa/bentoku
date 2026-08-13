import { readdirSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { clueAssets, environmentAssets, pieceAssets } from '../src/services/AssetRegistry';

const runtimeAssets = [...pieceAssets, ...clueAssets, ...environmentAssets];

const walk = (directory: string): string[] =>
  readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(fullPath) : [fullPath];
  });

describe('production assets', () => {
  it('registers only WebP images that exist', () => {
    expect(runtimeAssets).toHaveLength(24);
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
});
