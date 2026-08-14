import Phaser from 'phaser';
import type { PlayerSettings } from '../puzzle/types';
import { soundAssets, type SoundName } from './AssetRegistry';

export class AudioService {
  private readonly scene: Phaser.Scene;
  private enabled: boolean;
  private disposed = false;
  private readonly active = new Set<Phaser.Sound.BaseSound>();
  private readonly pending = new Set<Phaser.Time.TimerEvent>();

  constructor(scene: Phaser.Scene, settings: PlayerSettings) {
    this.scene = scene;
    this.enabled = settings.sound;
    this.scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.dispose());
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (!enabled) [...this.active].forEach((sound) => this.release(sound));
  }

  play(name: SoundName, delayMs = 0): void {
    if (!this.enabled || this.disposed) return;
    if (delayMs <= 0) {
      this.playNow(name);
      return;
    }

    const timer = this.scene.time.delayedCall(delayMs, () => {
      this.pending.delete(timer);
      if (this.enabled && !this.disposed) this.playNow(name);
    });
    this.pending.add(timer);
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.pending.forEach((timer) => timer.remove(false));
    this.pending.clear();
    [...this.active].forEach((sound) => this.release(sound));
  }

  private playNow(name: SoundName): void {
    const asset = soundAssets[name];
    if (!this.scene.cache.audio.exists(asset.key)) return;
    const sound = this.scene.sound.add(asset.key, { volume: 1, loop: false });
    this.active.add(sound);
    sound.once(Phaser.Sound.Events.COMPLETE, () => this.release(sound));
    if (!sound.play()) this.release(sound);
  }

  private release(sound: Phaser.Sound.BaseSound): void {
    if (!this.active.delete(sound)) return;
    if (sound.isPlaying) sound.stop();
    sound.destroy();
  }
}
