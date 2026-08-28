import { describe, expect, it } from 'vitest';
import { ElapsedTimer, formatElapsedTime } from '../src/gameplay/ElapsedTimer';

describe('elapsed game timer', () => {
  it('counts only while running and preserves an accumulated session', () => {
    let now = 1_000;
    const timer = new ElapsedTimer(2_500, () => now);

    expect(timer.elapsedMs).toBe(2_500);
    expect(timer.resume()).toBe(true);
    now += 750;
    expect(timer.elapsedMs).toBe(3_250);
    expect(timer.pause()).toBe(true);
    now += 30_000;
    expect(timer.elapsedMs).toBe(3_250);

    expect(timer.resume()).toBe(true);
    now += 250;
    expect(timer.elapsedMs).toBe(3_500);
  });

  it('makes repeated pause and resume calls idempotent', () => {
    let now = 0;
    const timer = new ElapsedTimer(0, () => now);

    expect(timer.pause()).toBe(false);
    expect(timer.resume()).toBe(true);
    expect(timer.resume()).toBe(false);
    now = 400;
    expect(timer.pause()).toBe(true);
    expect(timer.pause()).toBe(false);
    expect(timer.elapsedMs).toBe(400);
  });

  it('resets elapsed time without changing the requested running state', () => {
    let now = 100;
    const timer = new ElapsedTimer(900, () => now);
    timer.resume();
    now = 600;

    timer.reset();
    expect(timer.running).toBe(true);
    expect(timer.elapsedMs).toBe(0);
    now = 850;
    expect(timer.elapsedMs).toBe(250);

    timer.reset(1_200, false);
    now = 5_000;
    expect(timer.running).toBe(false);
    expect(timer.elapsedMs).toBe(1_200);
  });

  it('normalizes invalid elapsed values', () => {
    expect(new ElapsedTimer(-1).elapsedMs).toBe(0);
    expect(new ElapsedTimer(Number.NaN).elapsedMs).toBe(0);
  });
});

describe('elapsed time formatting', () => {
  it('uses mm:ss below an hour and h:mm:ss afterwards', () => {
    expect(formatElapsedTime(0)).toBe('00:00');
    expect(formatElapsedTime(65_999)).toBe('01:05');
    expect(formatElapsedTime(3_661_000)).toBe('1:01:01');
  });
});
