import Phaser from 'phaser';
import type { AssetEntry } from './AssetRegistry';

export const MUSIC_CROSSFADE_SECONDS = 4;
const MUSIC_FADE_IN_SECONDS = 1.6;

interface PlayingTrack {
  sound: Phaser.Sound.BaseSound;
  mix: number;
  released: boolean;
}

export class MusicService {
  private readonly scene: Phaser.Scene;
  private readonly tracks: readonly AssetEntry[];
  private volume: number;
  private nextTrackIndex = 0;
  private started = false;
  private disposed = false;
  private current?: PlayingTrack;
  private outgoing?: PlayingTrack;
  private transitionTimer?: Phaser.Time.TimerEvent;
  private transitionTween?: Phaser.Tweens.Tween;
  private loadingKey?: string;
  private pendingLoadedAction?: () => void;

  constructor(scene: Phaser.Scene, tracks: readonly AssetEntry[], volume: number) {
    this.scene = scene;
    this.tracks = tracks;
    this.volume = Phaser.Math.Clamp(volume, 0, 1);
    this.scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.dispose());
  }

  start(): void {
    if (this.disposed || this.started) return;
    this.started = true;
    if (this.volume > 0) this.playNext(true);
  }

  setVolume(volume: number): void {
    this.volume = Phaser.Math.Clamp(volume, 0, 1);
    this.applyVolume(this.current);
    this.applyVolume(this.outgoing);
    if (this.started && !this.current && this.volume > 0) this.playNext(true);
  }

  get currentTrackKey(): string | undefined {
    return this.current?.sound.key;
  }

  get isPlaying(): boolean {
    return Boolean(this.current?.sound.isPlaying);
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.transitionTimer?.remove(false);
    this.transitionTween?.stop();
    const tracks = new Set([this.current, this.outgoing].filter(Boolean) as PlayingTrack[]);
    tracks.forEach((track) => this.release(track));
    this.current = undefined;
    this.outgoing = undefined;
  }

  private playNext(initial: boolean): void {
    if (this.disposed || this.tracks.length === 0) return;
    const asset = this.tracks[this.nextTrackIndex % this.tracks.length]!;
    if (!this.scene.cache.audio.exists(asset.key)) {
      this.loadTrack(asset, () => this.playNext(initial));
      return;
    }

    const sound = this.scene.sound.add(asset.key, { volume: 0, loop: false });
    const incoming: PlayingTrack = { sound, mix: 0, released: false };

    if (!sound.play()) {
      sound.destroy();
      this.scene.time.delayedCall(500, () => this.playNext(initial));
      return;
    }

    this.nextTrackIndex = (this.nextTrackIndex + 1) % this.tracks.length;
    const previous = this.current;
    this.current = incoming;
    sound.once(Phaser.Sound.Events.COMPLETE, () => this.handleComplete(incoming));

    if (initial || !previous) this.fadeIn(incoming);
    else this.crossfade(previous, incoming);

    const transitionDelay = Math.max(1, sound.duration - MUSIC_CROSSFADE_SECONDS - 0.15);
    this.transitionTimer?.remove(false);
    this.transitionTimer = this.scene.time.delayedCall(transitionDelay * 1000, () => {
      if (this.current === incoming) this.playNext(false);
    });
    this.bufferUpcomingTrack();
  }

  private bufferUpcomingTrack(): void {
    const asset = this.tracks[this.nextTrackIndex % this.tracks.length];
    if (asset && !this.scene.cache.audio.exists(asset.key)) this.loadTrack(asset);
  }

  private loadTrack(asset: AssetEntry, onReady?: () => void): void {
    if (this.disposed) return;
    if (this.scene.cache.audio.exists(asset.key)) {
      onReady?.();
      return;
    }
    if (onReady) this.pendingLoadedAction = onReady;
    if (this.loadingKey === asset.key) return;
    if (this.loadingKey) return;

    this.loadingKey = asset.key;
    const completeEvent = `${Phaser.Loader.Events.FILE_KEY_COMPLETE}audio-${asset.key}`;
    const cleanup = (): void => {
      this.scene.load.off(completeEvent, onComplete);
      this.scene.load.off(Phaser.Loader.Events.FILE_LOAD_ERROR, onError);
      this.loadingKey = undefined;
    };
    const onComplete = (): void => {
      cleanup();
      if (this.disposed) return;
      const action = this.pendingLoadedAction;
      this.pendingLoadedAction = undefined;
      action?.();
    };
    const onError = (file: Phaser.Loader.File): void => {
      if (file.key !== asset.key) return;
      cleanup();
      if (this.disposed) return;
      this.scene.time.delayedCall(3000, () => this.loadTrack(asset, this.pendingLoadedAction));
    };

    this.scene.load.once(completeEvent, onComplete);
    this.scene.load.on(Phaser.Loader.Events.FILE_LOAD_ERROR, onError);
    this.scene.load.audio(asset.key, asset.path);
    this.scene.load.start();
  }

  private fadeIn(track: PlayingTrack): void {
    this.transitionTween?.stop();
    this.transitionTween = this.scene.tweens.addCounter({
      from: 0,
      to: 1,
      duration: MUSIC_FADE_IN_SECONDS * 1000,
      ease: 'Linear',
      onUpdate: (tween) => {
        const progress = tween.getValue() ?? 0;
        track.mix = Math.sin((progress * Math.PI) / 2);
        this.applyVolume(track);
      },
      onComplete: () => {
        track.mix = 1;
        this.applyVolume(track);
      },
    });
  }

  private crossfade(previous: PlayingTrack, incoming: PlayingTrack): void {
    this.outgoing = previous;
    this.transitionTween?.stop();
    this.transitionTween = this.scene.tweens.addCounter({
      from: 0,
      to: 1,
      duration: MUSIC_CROSSFADE_SECONDS * 1000,
      ease: 'Linear',
      onUpdate: (tween) => {
        const progress = tween.getValue() ?? 0;
        previous.mix = Math.cos((progress * Math.PI) / 2);
        incoming.mix = Math.sin((progress * Math.PI) / 2);
        this.applyVolume(previous);
        this.applyVolume(incoming);
      },
      onComplete: () => {
        incoming.mix = 1;
        this.applyVolume(incoming);
        this.release(previous);
      },
    });
  }

  private handleComplete(track: PlayingTrack): void {
    if (this.outgoing === track) {
      this.release(track);
      return;
    }
    if (this.current !== track || this.disposed) return;
    this.transitionTimer?.remove(false);
    this.release(track);
    this.current = undefined;
    this.playNext(true);
  }

  private release(track: PlayingTrack): void {
    if (track.released) return;
    track.released = true;
    if (track.sound.isPlaying) track.sound.stop();
    track.sound.destroy();
    if (this.outgoing === track) this.outgoing = undefined;
  }

  private applyVolume(track: PlayingTrack | undefined): void {
    if (!track || track.released) return;
    const sound = track.sound as Phaser.Sound.WebAudioSound | Phaser.Sound.HTML5AudioSound;
    sound.setVolume(this.volume * track.mix);
  }
}
