import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DevModeService } from '../src/services/DevModeService';

class MemoryStorage {
  private values = new Map<string, string>();

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }
}

describe('developer mode', () => {
  beforeEach(() => {
    vi.stubGlobal('sessionStorage', new MemoryStorage());
  });

  it('toggles for the current browser session', () => {
    const first = new DevModeService();
    expect(first.enabled).toBe(false);
    expect(first.toggle()).toBe(true);
    expect(new DevModeService().enabled).toBe(true);
    expect(new DevModeService().toggle()).toBe(false);
  });

  it('falls back to current-page memory when session storage is denied', () => {
    vi.stubGlobal('sessionStorage', {
      getItem: () => {
        throw new Error('denied');
      },
      setItem: () => {
        throw new Error('denied');
      },
    });
    const service = new DevModeService();
    expect(service.toggle()).toBe(true);
    expect(service.enabled).toBe(true);
  });
});
