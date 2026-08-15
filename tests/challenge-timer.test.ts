import { describe, expect, it } from 'vitest';
import {
  ChallengeTimer,
  formatChallengeTime,
  MASTER_CHALLENGE_DURATION_MS,
} from '../src/gameplay/ChallengeTimer';

describe('ChallengeTimer', () => {
  it('counts down from 1:45 and expires at zero', () => {
    let now = 1_000;
    const timer = new ChallengeTimer(MASTER_CHALLENGE_DURATION_MS, () => now);
    expect(timer.remainingMs).toBe(105_000);
    timer.start();
    now += 90_000;
    expect(timer.remainingMs).toBe(15_000);
    expect(timer.urgent).toBe(true);
    now += 15_000;
    expect(timer.remainingMs).toBe(0);
    expect(timer.state).toBe('expired');
  });

  it('does not consume time while paused', () => {
    let now = 0;
    const timer = new ChallengeTimer(10_000, () => now);
    timer.start();
    now = 2_500;
    expect(timer.pause()).toBe(true);
    now = 50_000;
    expect(timer.remainingMs).toBe(7_500);
    expect(timer.resume()).toBe(true);
    now = 57_499;
    expect(timer.remainingMs).toBe(1);
  });

  it('formats the visible countdown with an upward second ceiling', () => {
    expect(formatChallengeTime(105_000)).toBe('1:45');
    expect(formatChallengeTime(1_001)).toBe('0:02');
    expect(formatChallengeTime(1_000)).toBe('0:01');
    expect(formatChallengeTime(0)).toBe('0:00');
  });
});
