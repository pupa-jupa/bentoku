import type { PlayerSettings } from '../puzzle/types';

export type SoundName = 'pick' | 'drop' | 'swap' | 'wrong' | 'success' | 'paper';

export class AudioService {
  private context?: AudioContext;
  private enabled: boolean;

  constructor(settings: PlayerSettings) {
    this.enabled = settings.sound;
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  private getContext(): AudioContext | undefined {
    if (!this.enabled) return undefined;
    this.context ??= new AudioContext();
    return this.context;
  }

  play(name: SoundName): void {
    const context = this.getContext();
    if (!context) return;
    const now = context.currentTime;
    const gain = context.createGain();
    gain.connect(context.destination);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(name === 'success' ? 0.12 : 0.055, now + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + (name === 'success' ? 0.65 : 0.18));

    const notes: Record<SoundName, number[]> = {
      pick: [420],
      drop: [330],
      swap: [360, 450],
      wrong: [220, 196],
      success: [523, 659, 784],
      paper: [285],
    };

    notes[name].forEach((frequency, index) => {
      const oscillator = context.createOscillator();
      oscillator.type = name === 'wrong' ? 'sine' : 'triangle';
      oscillator.frequency.setValueAtTime(frequency, now + index * 0.11);
      oscillator.connect(gain);
      oscillator.start(now + index * 0.11);
      oscillator.stop(now + index * 0.11 + (name === 'success' ? 0.3 : 0.14));
    });
  }
}
