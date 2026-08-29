import Phaser from 'phaser';
import { musicAssets } from '../services/AssetRegistry';
import { MusicDirector } from '../services/MusicDirector';
import { SaveService } from '../services/SaveService';

const NIGHT_OVERLAY_COLOR = 0x20242c;
const NIGHT_OVERLAY_MAX_ALPHA = 0.45;

export class AtmosphereScene extends Phaser.Scene {
  private save!: SaveService;
  private music!: MusicDirector;
  private nightOverlay!: Phaser.GameObjects.Rectangle;
  private nightDim = 0;

  constructor() {
    super('AtmosphereScene');
  }

  create(): void {
    this.save = new SaveService();
    const settings = this.save.settings;
    this.nightDim = settings.nightDim;
    this.nightOverlay = this.add
      .rectangle(0, 0, this.scale.width, this.scale.height, NIGHT_OVERLAY_COLOR, 1)
      .setOrigin(0)
      .setScrollFactor(0)
      .setBlendMode(Phaser.BlendModes.MULTIPLY)
      .setName('night-overlay');
    this.applyNightDim();
    this.scale.on(Phaser.Scale.Events.RESIZE, this.handleResize, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off(Phaser.Scale.Events.RESIZE, this.handleResize, this);
    });

    this.music = new MusicDirector(
      this,
      musicAssets,
      settings.musicVolume,
      settings.musicTrackKey,
      (track) => {
        this.save.updateSettings({ musicTrackKey: track.key });
        this.events.emit('track-changed', track.title);
      },
    );
    this.music.start();
  }

  update(): void {
    const active = this.scene.manager.getScenes(true);
    if (active.at(-1) !== this) this.scene.bringToTop();
  }

  setNightDim(value: number): void {
    this.nightDim = Phaser.Math.Clamp(value, 0, 1);
    this.applyNightDim();
  }

  setMusicVolume(value: number): void {
    this.music.setVolume(value);
  }

  previousTrack(): void {
    this.music.previous();
  }

  nextTrack(): void {
    this.music.next();
  }

  get currentTrackKey(): string | undefined {
    return this.music.currentTrackKey;
  }

  get currentTrackTitle(): string {
    return this.music.currentTrackTitle;
  }

  onTrackChange(listener: (title: string) => void): () => void {
    this.events.on('track-changed', listener);
    return () => this.events.off('track-changed', listener);
  }

  private applyNightDim(): void {
    this.nightOverlay.setAlpha(this.nightDim * NIGHT_OVERLAY_MAX_ALPHA);
  }

  private handleResize(gameSize: Phaser.Structs.Size): void {
    this.nightOverlay.setSize(gameSize.width, gameSize.height);
  }
}

export const getAtmosphereScene = (scene: Phaser.Scene): AtmosphereScene | undefined => {
  const atmosphere = scene.scene.get('AtmosphereScene');
  return atmosphere instanceof AtmosphereScene ? atmosphere : undefined;
};
