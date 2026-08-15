export const MASTER_CHALLENGE_DURATION_MS = 105_000;
export const MASTER_CHALLENGE_URGENT_MS = 15_000;

export type ChallengeTimerState = 'idle' | 'running' | 'paused' | 'expired';

export class ChallengeTimer {
  private stateValue: ChallengeTimerState = 'idle';
  private deadline = 0;
  private pausedRemaining = 0;

  constructor(
    readonly durationMs = MASTER_CHALLENGE_DURATION_MS,
    private readonly now: () => number = () => performance.now(),
  ) {}

  get state(): ChallengeTimerState {
    this.refresh();
    return this.stateValue;
  }

  get remainingMs(): number {
    this.refresh();
    if (this.stateValue === 'idle') return this.durationMs;
    if (this.stateValue === 'paused') return this.pausedRemaining;
    if (this.stateValue === 'expired') return 0;
    return Math.max(0, this.deadline - this.now());
  }

  get urgent(): boolean {
    const remaining = this.remainingMs;
    return (
      this.stateValue === 'running' && remaining > 0 && remaining <= MASTER_CHALLENGE_URGENT_MS
    );
  }

  start(): void {
    this.deadline = this.now() + this.durationMs;
    this.pausedRemaining = this.durationMs;
    this.stateValue = 'running';
  }

  pause(): boolean {
    if (this.state !== 'running') return false;
    this.pausedRemaining = this.remainingMs;
    this.stateValue = 'paused';
    return true;
  }

  resume(): boolean {
    if (this.stateValue !== 'paused') return false;
    if (this.pausedRemaining <= 0) {
      this.stateValue = 'expired';
      return false;
    }
    this.deadline = this.now() + this.pausedRemaining;
    this.stateValue = 'running';
    return true;
  }

  reset(): void {
    this.stateValue = 'idle';
    this.deadline = 0;
    this.pausedRemaining = this.durationMs;
  }

  private refresh(): void {
    if (this.stateValue === 'running' && this.now() >= this.deadline) {
      this.stateValue = 'expired';
      this.pausedRemaining = 0;
    }
  }
}

export const formatChallengeTime = (milliseconds: number): string => {
  const totalSeconds = Math.max(0, Math.ceil(milliseconds / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};
