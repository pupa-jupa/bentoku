export type ElapsedClock = () => number;

export const formatElapsedTime = (elapsedMs: number): string => {
  const totalSeconds = Math.floor(Math.max(0, Number.isFinite(elapsedMs) ? elapsedMs : 0) / 1_000);
  const hours = Math.floor(totalSeconds / 3_600);
  const minutes = Math.floor((totalSeconds % 3_600) / 60);
  const seconds = totalSeconds % 60;
  return hours > 0
    ? `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
    : `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

export class ElapsedTimer {
  private accumulatedMs: number;
  private runningSince?: number;

  constructor(
    elapsedMs = 0,
    private readonly now: ElapsedClock = () => Date.now(),
  ) {
    this.accumulatedMs = ElapsedTimer.normalize(elapsedMs);
  }

  get elapsedMs(): number {
    if (this.runningSince === undefined) return this.accumulatedMs;
    return this.accumulatedMs + Math.max(0, this.now() - this.runningSince);
  }

  get running(): boolean {
    return this.runningSince !== undefined;
  }

  resume(): boolean {
    if (this.running) return false;
    this.runningSince = this.now();
    return true;
  }

  pause(): boolean {
    if (this.runningSince === undefined) return false;
    this.accumulatedMs = this.elapsedMs;
    this.runningSince = undefined;
    return true;
  }

  reset(elapsedMs = 0, running = this.running): void {
    this.accumulatedMs = ElapsedTimer.normalize(elapsedMs);
    this.runningSince = running ? this.now() : undefined;
  }

  private static normalize(value: number): number {
    return Number.isFinite(value) && value >= 0 ? value : 0;
  }
}
