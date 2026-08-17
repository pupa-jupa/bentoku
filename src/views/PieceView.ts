import Phaser from 'phaser';
import { COLORS } from '../game/constants';
import { PLACED_SHELL_SIZE } from '../game/gameplayLayout';
import type { BentoPiece } from '../puzzle/types';

export class PieceView extends Phaser.GameObjects.Container {
  readonly piece: BentoPiece;
  readonly sprite: Phaser.GameObjects.Image;
  private readonly shell: Phaser.GameObjects.Image;
  private readonly shadow: Phaser.GameObjects.Ellipse;
  private readonly glaze: Phaser.GameObjects.Image;
  private readonly pearl: Phaser.GameObjects.Graphics;
  private readonly ring: Phaser.GameObjects.Graphics;
  private available = true;
  home = new Phaser.Math.Vector2();
  boardCell: number | null = null;

  constructor(scene: Phaser.Scene, piece: BentoPiece, x: number, y: number) {
    super(scene, x, y);
    this.piece = piece;
    this.shell = scene.add
      .image(0, 0, 'piece_shell')
      .setDisplaySize(PLACED_SHELL_SIZE, PLACED_SHELL_SIZE)
      .setVisible(false);
    this.shadow = scene.add.ellipse(3, 35, 84, 28, COLORS.shadow, 0.18);
    // The source canvas intentionally includes generous transparent safety
    // padding. Scale and optically center the whole canvas; never trim it.
    const visual = VISUAL_LAYOUT[piece.id];
    this.sprite = scene.add
      .image(visual.x, visual.y, piece.textureKey)
      .setDisplaySize(visual.size, visual.size);
    this.glaze = scene.add
      .image(visual.x, visual.y, piece.textureKey)
      .setDisplaySize(visual.size, visual.size)
      .setTint(0xfff3fb)
      .setAlpha(0.13)
      .setBlendMode(Phaser.BlendModes.SCREEN);
    this.pearl = scene.add.graphics();
    this.drawPearlGlint();
    this.ring = scene.add.graphics();
    this.add([this.shell, this.shadow, this.sprite, this.glaze, this.pearl, this.ring]);
    this.setSize(116, 116);
    this.setInteractive({ useHandCursor: true });
    scene.input.setDraggable(this);
    scene.add.existing(this);
  }

  setHome(x: number, y: number, boardCell: number | null): void {
    this.home.set(x, y);
    this.boardCell = boardCell;
    this.refreshAppearance();
  }

  setAvailable(available: boolean): void {
    this.available = available;
    this.setSelected(false);
    if (available) {
      if (this.input) this.input.enabled = true;
      else this.setInteractive({ useHandCursor: true });
      this.scene.input.setDraggable(this, true);
    } else {
      this.disableInteractive();
      this.scene.input.setDraggable(this, false);
    }
    this.refreshAppearance();
  }

  private refreshAppearance(): void {
    const placed = this.boardCell !== null;
    if (!this.available) {
      this.setAlpha(0.46);
      this.shell.setVisible(false);
      this.sprite.setTint(0x8c8c8c);
      this.glaze.setVisible(false);
      this.pearl.setVisible(false);
      this.shadow.setScale(1).setAlpha(0.08);
      return;
    }
    this.setAlpha(1);
    this.sprite.clearTint();
    this.shell.setVisible(placed);
    this.glaze.setVisible(true);
    this.pearl.setVisible(true);
    this.glaze.setAlpha(placed ? 0.2 : 0.13);
    this.pearl.setAlpha(placed ? 0.95 : 0.68);
    this.shadow.setScale(placed ? 1.08 : 1).setAlpha(placed ? 0.22 : 0.18);
  }

  setSelected(selected: boolean): void {
    this.ring.clear();
    if (!selected || !this.available) return;
    this.ring.lineStyle(5, COLORS.focus, 1);
    this.ring.strokeCircle(0, 0, 57);
    this.ring.lineStyle(2, COLORS.milk, 0.9);
    this.ring.strokeCircle(0, 0, 62);
  }

  lift(): void {
    if (!this.available) return;
    this.shadow.setScale(this.boardCell === null ? 1.18 : 1.25).setAlpha(0.26);
    this.scene.tweens.add({ targets: this, scale: 1.07, duration: 100, ease: 'Sine.easeOut' });
    this.setDepth(1000);
  }

  settle(reducedMotion: boolean): void {
    if (!this.available) return;
    this.shadow
      .setScale(this.boardCell === null ? 1 : 1.08)
      .setAlpha(this.boardCell === null ? 0.18 : 0.22);
    if (reducedMotion) {
      this.setScale(1);
      return;
    }
    this.scene.tweens.add({
      targets: this,
      scaleX: { from: 0.95, to: 1 },
      scaleY: { from: 0.95, to: 1 },
      duration: 170,
      ease: 'Back.easeOut',
    });
  }

  returnHome(reducedMotion: boolean): void {
    if (reducedMotion) {
      this.setPosition(this.home.x, this.home.y).setScale(1);
      return;
    }
    this.scene.tweens.add({
      targets: this,
      x: this.home.x,
      y: this.home.y,
      scale: 1,
      duration: 220,
      ease: 'Cubic.easeOut',
    });
  }

  idle(reducedMotion: boolean): void {
    if (!this.available || reducedMotion || this.scene.tweens.isTweening(this)) return;
    this.scene.tweens.add({
      targets: this,
      angle: { from: -1.5, to: 1.5 },
      scaleY: { from: 1, to: 0.975 },
      duration: 420,
      yoyo: true,
      ease: 'Sine.easeInOut',
    });
  }

  private drawPearlGlint(): void {
    this.pearl.fillStyle(0xffffff, 0.78);
    this.pearl.fillEllipse(-30, -31, 12, 6);
    this.pearl.fillCircle(-23, -25, 3);
    this.pearl.lineStyle(2, 0xffffff, 0.76);
    this.pearl.lineBetween(31, -32, 31, -20);
    this.pearl.lineBetween(25, -26, 37, -26);
  }
}

const VISUAL_LAYOUT: Record<BentoPiece['id'], { size: number; x: number; y: number }> = {
  bear_egg: { size: 187, x: 0, y: -1 },
  bear_rice: { size: 199, x: 0, y: -3 },
  bear_sandwich: { size: 206, x: 0, y: 0 },
  bunny_egg: { size: 192, x: 0, y: 1.5 },
  bunny_rice: { size: 175, x: 0, y: 0 },
  bunny_sandwich: { size: 203, x: 0, y: 0 },
  cat_egg: { size: 200, x: 0, y: 0 },
  cat_rice: { size: 199, x: 0, y: 2.5 },
  cat_sandwich: { size: 204, x: 0, y: 1.5 },
  pig_egg: { size: 202, x: 0, y: -1 },
  pig_rice: { size: 202, x: 0, y: 0 },
  pig_sandwich: { size: 209, x: 0, y: -4 },
};

export const getPieceVisualLayout = (
  pieceId: BentoPiece['id'],
): Readonly<{ size: number; x: number; y: number }> => VISUAL_LAYOUT[pieceId];
