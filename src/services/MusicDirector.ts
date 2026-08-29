import Phaser from 'phaser';
import type { MusicAssetEntry } from './AssetRegistry';
import { adjacentTrack, resolveTrackIndex } from './MusicPlaylist';

export const MUSIC_FADE_OUT_SECONDS = 1.25;
export const MUSIC_SILENCE_SECONDS = 0.25;
export const MUSIC_FADE_IN_SECONDS = 1.5;
export const MUSIC_MANUAL_CROSSFADE_MS = 900;

interface PlayingTrack {
  asset: MusicAssetEntry;
  sound: Phaser.Sound.BaseSound;
  mix: number;
  released: boolean;
}

export class MusicDirector {
  private volume: number;
  private started = false;
  private disposed = false;
  private transitioning = false;
  private current?: PlayingTrack;
  private transitionTimer?: Phaser.Time.TimerEvent;
  private gapTimer?: Phaser.Time.TimerEvent;
  private transitionTween?: Phaser.Tweens.Tween;
  private loadingKey?: string;
  private pendingLoadedActions = new Map<string, Array<() => void>>();
  private selectedIndex: number;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly tracks: readonly MusicAssetEntry[],
    volume: number,
    selectedKey?: string,
    private readonly onTrackChange?: (track: MusicAssetEntry) => void,
  ) {
    this.volume = Phaser.Math.Clamp(volume, 0, 1);
    this.selectedIndex = resolveTrackIndex(tracks, selectedKey);
    this.scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.dispose());
  }

  start(): void {
    if (this.disposed || this.started) return;
    this.started = true;
    if (this.volume > 0) this.playSelected();
  }

  setVolume(volume: number): void {
    this.volume = Phaser.Math.Clamp(volume, 0, 1);
    this.applyVolume(this.current);
    if (this.started && !this.current && !this.transitioning && this.volume > 0)
      this.playSelected();
  }

  get currentTrackKey(): string | undefined {
    return this.current?.asset.key ?? this.tracks[this.selectedIndex]?.key;
  }

  get currentTrackTitle(): string {
    return this.current?.asset.title ?? this.tracks[this.selectedIndex]?.title ?? '';
  }

  get isPlaying(): boolean {
    return Boolean(this.current?.sound.isPlaying);
  }

  previous(): void {
    const target = adjacentTrack(this.tracks, this.currentTrackKey, -1);
    if (target) this.select(target.key);
  }

  next(): void {
    const target = adjacentTrack(this.tracks, this.currentTrackKey, 1);
    if (target) this.select(target.key);
  }

  select(key: string): void {
    if (this.disposed || this.transitioning) return;
    const index = this.tracks.findIndex((track) => track.key === key);
    if (index < 0 || this.current?.asset.key === key) return;
    const asset = this.tracks[index]!;
    this.ensureLoaded(asset, () => {
      if (this.disposed || this.transitioning) return;
      this.selectedIndex = index;
      if (!this.current) {
        this.playSelected();
        return;
      }
      this.crossfadeTo(asset);
    });
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.transitionTimer?.remove(false);
    this.gapTimer?.remove(false);
    this.transitionTween?.stop();
    if (this.current) this.release(this.current);
    this.current = undefined;
    this.pendingLoadedActions.clear();
  }

  private playSelected(): void {
    if (this.disposed || this.tracks.length === 0 || this.transitioning) return;
    const asset = this.tracks[this.selectedIndex % this.tracks.length]!;
    this.ensureLoaded(asset, () => this.beginTrack(asset, true));
  }

  private beginTrack(asset: MusicAssetEntry, fadeIn: boolean): PlayingTrack | undefined {
    if (this.disposed) return undefined;
    const sound = this.scene.sound.add(asset.key, {
      volume: fadeIn ? 0 : this.volume,
      loop: false,
    });
    const track: PlayingTrack = { asset, sound, mix: fadeIn ? 0 : 1, released: false };
    if (!sound.play()) {
      sound.destroy();
      this.scene.time.delayedCall(500, () => this.playSelected());
      return undefined;
    }

    this.current = track;
    this.selectedIndex = this.tracks.findIndex((candidate) => candidate.key === asset.key);
    sound.once(Phaser.Sound.Events.COMPLETE, () => this.handleComplete(track));
    this.onTrackChange?.(asset);
    if (fadeIn) this.fadeIn(track);
    else this.scheduleAutomaticTransition(track);
    this.bufferUpcomingTrack();
    return track;
  }

  private fadeIn(track: PlayingTrack): void {
    this.transitioning = true;
    this.transitionTween?.stop();
    this.transitionTween = this.scene.tweens.addCounter({
      from: 0,
      to: 1,
      duration: MUSIC_FADE_IN_SECONDS * 1000,
      ease: 'Linear',
      onUpdate: (tween) => {
        track.mix = Math.sin(((tween.getValue() ?? 0) * Math.PI) / 2);
        this.applyVolume(track);
      },
      onComplete: () => {
        track.mix = 1;
        this.applyVolume(track);
        this.transitionTween = undefined;
        this.transitioning = false;
        this.scheduleAutomaticTransition(track);
      },
    });
  }

  private crossfadeTo(asset: MusicAssetEntry): void {
    const outgoing = this.current;
    if (!outgoing) {
      this.beginTrack(asset, true);
      return;
    }
    this.transitioning = true;
    this.transitionTimer?.remove(false);
    this.gapTimer?.remove(false);
    this.transitionTween?.stop();

    const sound = this.scene.sound.add(asset.key, { volume: 0, loop: false });
    const incoming: PlayingTrack = { asset, sound, mix: 0, released: false };
    if (!sound.play()) {
      sound.destroy();
      this.transitioning = false;
      this.scheduleAutomaticTransition(outgoing);
      return;
    }
    this.current = incoming;
    sound.once(Phaser.Sound.Events.COMPLETE, () => this.handleComplete(incoming));
    this.onTrackChange?.(asset);
    const outgoingStartMix = outgoing.mix;
    this.transitionTween = this.scene.tweens.addCounter({
      from: 0,
      to: 1,
      duration: MUSIC_MANUAL_CROSSFADE_MS,
      ease: 'Linear',
      onUpdate: (tween) => {
        const progress = tween.getValue() ?? 0;
        outgoing.mix = outgoingStartMix * Math.cos((progress * Math.PI) / 2);
        incoming.mix = Math.sin((progress * Math.PI) / 2);
        this.applyVolume(outgoing);
        this.applyVolume(incoming);
      },
      onComplete: () => {
        this.release(outgoing);
        incoming.mix = 1;
        this.applyVolume(incoming);
        this.transitionTween = undefined;
        this.transitioning = false;
        this.scheduleAutomaticTransition(incoming);
        this.bufferUpcomingTrack();
      },
    });
  }

  private scheduleAutomaticTransition(track: PlayingTrack): void {
    if (this.current !== track || track.released) return;
    const delay = Math.max(1, track.sound.duration - MUSIC_FADE_OUT_SECONDS - 0.1);
    this.transitionTimer?.remove(false);
    this.transitionTimer = this.scene.time.delayedCall(delay * 1000, () => {
      if (this.current === track) this.fadeOutAndQueueNext(track);
    });
  }

  private fadeOutAndQueueNext(track: PlayingTrack): void {
    if (this.disposed || this.current !== track || track.released || this.transitioning) return;
    this.transitioning = true;
    this.transitionTimer?.remove(false);
    const startingMix = track.mix;
    this.transitionTween?.stop();
    this.transitionTween = this.scene.tweens.addCounter({
      from: 0,
      to: 1,
      duration: MUSIC_FADE_OUT_SECONDS * 1000,
      ease: 'Linear',
      onUpdate: (tween) => {
        track.mix = startingMix * Math.cos(((tween.getValue() ?? 0) * Math.PI) / 2);
        this.applyVolume(track);
      },
      onComplete: () => {
        this.transitionTween = undefined;
        this.release(track);
        if (this.current === track) this.current = undefined;
        this.queueNextAfterSilence();
      },
    });
  }

  private handleComplete(track: PlayingTrack): void {
    if (this.current !== track || this.disposed) return;
    this.transitionTimer?.remove(false);
    this.transitionTween?.stop();
    this.transitionTween = undefined;
    this.transitioning = true;
    this.release(track);
    this.current = undefined;
    this.queueNextAfterSilence();
  }

  private queueNextAfterSilence(): void {
    if (this.disposed) return;
    this.selectedIndex = (this.selectedIndex + 1) % this.tracks.length;
    this.gapTimer?.remove(false);
    this.gapTimer = this.scene.time.delayedCall(MUSIC_SILENCE_SECONDS * 1000, () => {
      this.gapTimer = undefined;
      this.transitioning = false;
      this.playSelected();
    });
  }

  private bufferUpcomingTrack(): void {
    const asset = this.tracks[(this.selectedIndex + 1) % this.tracks.length];
    if (asset) this.ensureLoaded(asset);
  }

  private ensureLoaded(asset: MusicAssetEntry, onReady?: () => void): void {
    if (this.disposed) return;
    if (this.scene.cache.audio.exists(asset.key)) {
      onReady?.();
      return;
    }
    if (onReady) {
      const actions = this.pendingLoadedActions.get(asset.key) ?? [];
      actions.push(onReady);
      this.pendingLoadedActions.set(asset.key, actions);
    }
    if (this.loadingKey) return;

    this.loadingKey = asset.key;
    const completeEvent = `${Phaser.Loader.Events.FILE_KEY_COMPLETE}audio-${asset.key}`;
    const cleanup = (): void => {
      this.scene.load.off(completeEvent, onComplete);
      this.scene.load.off(Phaser.Loader.Events.FILE_LOAD_ERROR, onError);
      this.loadingKey = undefined;
    };
    const loadNextPending = (): void => {
      const nextKey = this.pendingLoadedActions.keys().next().value as string | undefined;
      const nextAsset = nextKey ? this.tracks.find((track) => track.key === nextKey) : undefined;
      if (nextAsset) this.ensureLoaded(nextAsset);
    };
    const onComplete = (): void => {
      cleanup();
      if (this.disposed) return;
      const actions = this.pendingLoadedActions.get(asset.key) ?? [];
      this.pendingLoadedActions.delete(asset.key);
      actions.forEach((action) => action());
      loadNextPending();
    };
    const onError = (file: Phaser.Loader.File): void => {
      if (file.key !== asset.key) return;
      cleanup();
      if (this.disposed) return;
      this.pendingLoadedActions.delete(asset.key);
      this.scene.time.delayedCall(3000, () => this.ensureLoaded(asset));
      loadNextPending();
    };

    this.scene.load.once(completeEvent, onComplete);
    this.scene.load.on(Phaser.Loader.Events.FILE_LOAD_ERROR, onError);
    this.scene.load.audio(asset.key, asset.path);
    this.scene.load.start();
  }

  private release(track: PlayingTrack): void {
    if (track.released) return;
    track.released = true;
    if (track.sound.isPlaying) track.sound.stop();
    track.sound.destroy();
  }

  private applyVolume(track: PlayingTrack | undefined): void {
    if (!track || track.released) return;
    const sound = track.sound as Phaser.Sound.WebAudioSound | Phaser.Sound.HTML5AudioSound;
    sound.setVolume(this.volume * track.mix);
  }
}
