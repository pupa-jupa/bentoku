import Phaser from 'phaser';
import { ANIMAL_LABELS, COLORS, FONT_BODY, FONT_DISPLAY, FOOD_LABELS } from '../game/constants';
import { HintController } from '../gameplay/HintController';
import { PlacementController } from '../gameplay/PlacementController';
import { PuzzleController } from '../gameplay/PuzzleController';
import { PuzzleGenerator } from '../puzzle/PuzzleGenerator';
import { createDailySeed, createRandomSeed } from '../puzzle/SeededRandom';
import type { PieceId, PlayerSettings, PuzzleDefinition } from '../puzzle/types';
import { AudioService } from '../services/AudioService';
import { SaveService } from '../services/SaveService';
import { BentoBoard } from '../views/BentoBoard';
import { CelebrationView } from '../views/CelebrationView';
import { CluePanel } from '../views/CluePanel';
import { InventoryPanel } from '../views/InventoryPanel';
import { PieceView } from '../views/PieceView';

interface ButtonSpec {
  x: number;
  y: number;
  width: number;
  label: string;
  callback: () => void;
  primary?: boolean;
  icon?: boolean;
}

interface PiecePress {
  pieceId: PieceId;
  wasSelected: boolean;
  startX: number;
  startY: number;
  moved: boolean;
}

export class PuzzleScene extends Phaser.Scene {
  private generator = new PuzzleGenerator();
  private save!: SaveService;
  private audio!: AudioService;
  private settings!: PlayerSettings;
  private puzzle!: PuzzleDefinition;
  private puzzleController!: PuzzleController;
  private placement!: PlacementController;
  private hint = new HintController();
  private inventory!: InventoryPanel;
  private bento!: BentoBoard;
  private pieces = new Map<PieceId, PieceView>();
  private selectedPiece: PieceId | null = null;
  private dragging?: PieceView;
  private piecePress?: PiecePress;
  private modal?: Phaser.GameObjects.Container;
  private moveText!: Phaser.GameObjects.Text;
  private seedText!: Phaser.GameObjects.Text;
  private focusIndex = -1;
  private solved = false;

  constructor() {
    super('PuzzleScene');
  }

  create(): void {
    this.save = new SaveService();
    this.settings = this.save.settings;
    this.audio = new AudioService(this.settings);
    const params = new URLSearchParams(window.location.search);
    const seed = params.get('seed') ?? this.save.currentSeed ?? createRandomSeed();
    this.createPuzzle(seed);
    this.bindInput();
    this.time.addEvent({
      delay: 5200,
      loop: true,
      callback: () => {
        const views = [...this.pieces.values()];
        views[Math.floor(Math.random() * views.length)]?.idle(this.settings.reducedMotion);
      },
    });
    this.announce('Bentoku ready. Choose a bento friend, then choose a box cell.');
  }

  private createPuzzle(seed: string): void {
    this.puzzle = this.generator.create(seed);
    this.puzzleController = new PuzzleController(this.puzzle);
    const saved = this.save.loadPuzzle(this.puzzle.seed);
    this.placement = new PlacementController(saved.board, saved.moves);
    this.selectedPiece = null;
    this.solved = false;
    this.renderScene();
    this.saveCurrent();
  }

  private renderScene(): void {
    this.children.removeAll(true);
    this.pieces.clear();
    this.modal = undefined;

    this.add.image(800, 450, 'gameplay_plate').setDisplaySize(1600, 900);
    this.add
      .text(54, 38, 'Bentoku', {
        fontFamily: FONT_DISPLAY,
        fontSize: '42px',
        fontStyle: 'bold',
        color: '#65483f',
      })
      .setOrigin(0, 0.5);
    this.add
      .text(56, 74, 'a tiny logic lunch', {
        fontFamily: FONT_BODY,
        fontSize: '15px',
        color: '#9b756a',
        letterSpacing: 2,
      })
      .setOrigin(0, 0.5);

    this.inventory = new InventoryPanel(this, 285, 465);
    this.bento = new BentoBoard(this, 790, 429);
    // Center the dynamic notes on the illustrated paper, whose visual center
    // sits left of the right-hand layout column.
    new CluePanel(this, 1332, 485, this.puzzle.clues);

    this.puzzle.pieces.forEach((piece, index) => {
      const position = this.inventory.trayPosition(index);
      const view = new PieceView(this, piece, position.x, position.y);
      this.pieces.set(piece.id, view);
      this.bindPiece(view);
    });
    this.bento.slots.forEach((slot) => {
      slot.on('pointerover', () => {
        if (this.dragging || this.selectedPiece) slot.setHighlighted(true);
      });
      slot.on('pointerout', () => slot.setHighlighted(false));
      slot.on('pointerdown', () => this.activateSlot(slot.index));
    });

    this.seedText = this.add
      .text(800, 54, `${this.puzzle.seed}  ·  ${this.puzzle.difficulty}`, {
        fontFamily: FONT_BODY,
        fontSize: '17px',
        fontStyle: 'bold',
        color: '#74594f',
        backgroundColor: '#fff8e9aa',
        padding: { x: 16, y: 9 },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    this.seedText.on('pointerdown', () => void this.copySeed());
    this.seedText.on('pointerover', () => this.seedText.setColor('#c66f69'));
    this.seedText.on('pointerout', () => this.seedText.setColor('#74594f'));

    this.makeButton({
      x: 1170,
      y: 54,
      width: 110,
      label: 'Daily',
      callback: () => this.startDaily(),
    });
    this.makeButton({
      x: 1298,
      y: 54,
      width: 52,
      label: '↶',
      callback: () => this.undo(),
      icon: true,
    });
    this.makeButton({
      x: 1362,
      y: 54,
      width: 52,
      label: '?',
      callback: () => this.openHelp(),
      icon: true,
    });
    this.makeButton({
      x: 1426,
      y: 54,
      width: 52,
      label: '⚙',
      callback: () => this.openSettings(),
      icon: true,
    });

    this.moveText = this.add
      .text(790, 836, '', {
        fontFamily: FONT_BODY,
        fontSize: '17px',
        color: '#8a6a60',
      })
      .setOrigin(0.5);
    this.updatePiecePositions(false);
    this.updateStatus();
  }

  private bindPiece(view: PieceView): void {
    view.on('pointerover', () => {
      if (!this.dragging && !this.settings.reducedMotion) {
        this.tweens.add({ targets: view, scale: 1.035, duration: 100 });
      }
    });
    view.on('pointerout', () => {
      if (!this.dragging && this.selectedPiece !== view.piece.id) {
        this.tweens.add({ targets: view, scale: 1, duration: 100 });
      }
    });
    view.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (this.solved || this.modal) return;
      this.piecePress = {
        pieceId: view.piece.id,
        wasSelected: this.selectedPiece === view.piece.id,
        startX: pointer.worldX,
        startY: pointer.worldY,
        moved: false,
      };
      this.selectPiece(view.piece.id, false);
    });
    view.on(
      'pointerup',
      (
        _pointer: Phaser.Input.Pointer,
        _localX: number,
        _localY: number,
        event: Phaser.Types.Input.EventData,
      ) => {
        if (
          this.piecePress?.pieceId === view.piece.id &&
          !this.piecePress.moved &&
          this.piecePress.wasSelected
        ) {
          this.selectPiece(view.piece.id);
        }
        event.stopPropagation();
      },
    );
  }

  private bindInput(): void {
    this.input.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      if (!this.selectedPiece || this.dragging || this.modal || this.solved) return;
      const slot = this.bento.nearestSlot(pointer.worldX, pointer.worldY);
      if (slot !== null) this.placeSelected(slot);
    });
    this.input.on('dragstart', (_pointer: Phaser.Input.Pointer, target: PieceView) => {
      if (this.solved || this.modal) return;
      this.dragging = target;
      this.selectPiece(target.piece.id, false);
      target.lift();
      this.audio.play('pick');
    });
    this.input.on(
      'drag',
      (pointer: Phaser.Input.Pointer, target: PieceView, dragX: number, dragY: number) => {
        if (this.dragging !== target) return;
        if (
          this.piecePress?.pieceId === target.piece.id &&
          Phaser.Math.Distance.Between(
            pointer.worldX,
            pointer.worldY,
            this.piecePress.startX,
            this.piecePress.startY,
          ) > 8
        ) {
          this.piecePress.moved = true;
        }
        target.setPosition(dragX, dragY);
        const nearest = this.bento.nearestSlot(dragX, dragY);
        this.bento.slots.forEach((slot, index) => slot.setHighlighted(index === nearest));
      },
    );
    this.input.on('dragend', (_pointer: Phaser.Input.Pointer, target: PieceView) => {
      if (this.dragging !== target) return;
      const moved = this.piecePress?.pieceId === target.piece.id && this.piecePress.moved;
      if (!moved) {
        target.returnHome(this.settings.reducedMotion);
        target.settle(this.settings.reducedMotion);
        this.dragging = undefined;
        this.piecePress = undefined;
        return;
      }
      const slot = this.bento.nearestSlot(target.x, target.y);
      this.bento.slots.forEach((item) => item.setHighlighted(false));
      if (slot !== null) this.placeSelected(slot);
      else if (this.inventory.containsWorldPoint(target.x, target.y) && target.boardCell !== null) {
        this.placement.returnToTray(target.piece.id);
        this.audio.play('paper');
        this.afterBoardChange();
      } else target.returnHome(this.settings.reducedMotion);
      target.setDepth(100);
      target.settle(this.settings.reducedMotion);
      this.dragging = undefined;
      this.piecePress = undefined;
    });

    const keyboard = this.input.keyboard;
    keyboard?.on('keydown-H', () => this.openHelp());
    keyboard?.on('keydown-U', () => this.undo());
    keyboard?.on('keydown-S', () => this.openSettings());
    keyboard?.on('keydown-ESC', () => this.closeModal());
    keyboard?.on('keydown-TAB', (event: KeyboardEvent) => {
      event.preventDefault();
      this.moveFocus(event.shiftKey ? -1 : 1);
    });
    keyboard?.on('keydown-LEFT', () => this.moveFocus(-1));
    keyboard?.on('keydown-RIGHT', () => this.moveFocus(1));
    keyboard?.on('keydown-UP', () => this.moveFocus(-3));
    keyboard?.on('keydown-DOWN', () => this.moveFocus(3));
    keyboard?.on('keydown-ENTER', () => this.activateFocus());
    keyboard?.on('keydown-SPACE', (event: KeyboardEvent) => {
      event.preventDefault();
      this.activateFocus();
    });
  }

  private selectPiece(pieceId: PieceId, toggle = true): void {
    this.selectedPiece = toggle && this.selectedPiece === pieceId ? null : pieceId;
    this.pieces.forEach((view, id) => {
      view.setSelected(id === this.selectedPiece);
      if (id !== this.selectedPiece && !this.dragging) view.setScale(1);
    });
    if (this.selectedPiece) {
      const piece = this.pieces.get(this.selectedPiece)!.piece;
      this.audio.play('pick');
      this.announce(`${ANIMAL_LABELS[piece.animal]} ${FOOD_LABELS[piece.food]} selected.`);
    }
  }

  private activateSlot(index: number): void {
    if (this.solved || this.modal) return;
    if (this.selectedPiece) {
      this.placeSelected(index);
      return;
    }
    const pieceId = this.placement.board[index];
    if (pieceId) this.selectPiece(pieceId);
  }

  private placeSelected(index: number): void {
    if (!this.selectedPiece) return;
    const result = this.placement.place(this.selectedPiece, index);
    if (result.changed) {
      this.audio.play(result.swapped ? 'swap' : 'drop');
      this.afterBoardChange();
    }
    this.selectedPiece = null;
    this.pieces.forEach((view) => view.setSelected(false));
  }

  private afterBoardChange(): void {
    this.updatePiecePositions(true);
    this.updateStatus();
    this.saveCurrent();
    if (!this.placement.isFull()) return;
    if (this.puzzleController.validate(this.placement.board)) this.celebrate();
    else {
      this.audio.play('wrong');
      this.bento.wobble(this.settings.reducedMotion);
      this.announce('Almost! A few friends are still reading the note differently. Keep trying.');
    }
  }

  private updatePiecePositions(animated: boolean): void {
    const boardSet = new Set(this.placement.board.filter((id): id is PieceId => id !== null));
    this.puzzle.pieces.forEach((piece, trayIndex) => {
      const view = this.pieces.get(piece.id)!;
      const cellIndex = this.placement.board.indexOf(piece.id);
      const position =
        cellIndex >= 0
          ? this.bento.slotWorldPosition(cellIndex)
          : this.inventory.trayPosition(trayIndex);
      view.setHome(position.x, position.y, cellIndex >= 0 ? cellIndex : null);
      view.setDepth(cellIndex >= 0 ? 120 : 100);
      if (animated && !this.settings.reducedMotion) {
        this.tweens.add({
          targets: view,
          x: position.x,
          y: position.y,
          scale: 1,
          duration: 190,
          ease: 'Back.easeOut',
        });
      } else view.setPosition(position.x, position.y).setScale(1);
      view.setAlpha(boardSet.has(piece.id) || cellIndex < 0 ? 1 : 0.84);
    });
  }

  private updateStatus(): void {
    const filled = this.placement.board.filter(Boolean).length;
    this.moveText.setText(
      `${filled} / 9 tucked in  ·  ${this.placement.moves} ${this.placement.moves === 1 ? 'move' : 'moves'}  ·  ${this.save.solvedCount} finished`,
    );
  }

  private undo(): void {
    if (this.modal || this.solved) return;
    if (!this.placement.restorePrevious()) {
      this.announce('Nothing to undo yet.');
      return;
    }
    this.audio.play('paper');
    this.updatePiecePositions(true);
    this.updateStatus();
    this.saveCurrent();
    this.announce('Last move tucked back onto the tray.');
  }

  private celebrate(): void {
    this.solved = true;
    this.save.markSolved();
    this.audio.play('success');
    this.announce('Bento complete!');
    if (!this.settings.reducedMotion) {
      this.placement.board.forEach((pieceId, index) => {
        if (!pieceId) return;
        const view = this.pieces.get(pieceId)!;
        this.time.delayedCall(index * 55, () => {
          this.tweens.add({
            targets: view,
            y: view.y - 15,
            duration: 150,
            yoyo: true,
            ease: 'Sine.easeOut',
          });
          this.sparkle(view.x, view.y);
        });
      });
      this.tweens.add({ targets: this.bento, y: this.bento.y - 9, duration: 420, yoyo: true });
    }
    this.time.delayedCall(this.settings.reducedMotion ? 150 : 850, () => {
      this.modal = new CelebrationView(
        this,
        () => this.startRandom(),
        () => void this.copySeed(),
      );
    });
  }

  private sparkle(x: number, y: number): void {
    for (let index = 0; index < 3; index += 1) {
      const star = this.add.star(
        x + Phaser.Math.Between(-38, 38),
        y + Phaser.Math.Between(-40, 10),
        4,
        2,
        6,
        index % 2 ? COLORS.honey : COLORS.blush,
        0.85,
      );
      star.setDepth(2000).setScale(0);
      this.tweens.add({
        targets: star,
        scale: 1,
        alpha: 0,
        angle: 45,
        y: star.y - 25,
        duration: 520,
        delay: index * 60,
        onComplete: () => star.destroy(),
      });
    }
  }

  private makeButton(
    spec: ButtonSpec,
    parent?: Phaser.GameObjects.Container,
  ): Phaser.GameObjects.Container {
    const container = this.add.container(spec.x, spec.y);
    const background = this.add.graphics();
    const height = spec.icon ? 48 : 44;
    background.fillStyle(spec.primary ? COLORS.coral : COLORS.milk, 0.94);
    background.fillRoundedRect(-spec.width / 2, -height / 2, spec.width, height, height / 2);
    background.lineStyle(2, spec.primary ? COLORS.blush : COLORS.sage, 0.3);
    background.strokeRoundedRect(-spec.width / 2, -height / 2, spec.width, height, height / 2);
    const text = this.add
      .text(0, spec.icon ? -1 : 0, spec.label, {
        fontFamily: FONT_BODY,
        fontSize: spec.icon ? '24px' : '16px',
        fontStyle: 'bold',
        color: spec.primary ? '#fffaf3' : '#695149',
      })
      .setOrigin(0.5);
    container.add([background, text]);
    container.setSize(spec.width, height).setInteractive({ useHandCursor: true });
    container.on('pointerdown', spec.callback);
    container.on('pointerover', () => container.setScale(1.05));
    container.on('pointerout', () => container.setScale(1));
    parent?.add(container);
    return container;
  }

  private openHelp(): void {
    if (this.solved) return;
    this.openModal(
      'A note from the café',
      'Each sketch keeps its shape, but can slide around the bento.\nAn animal mark means any food of that animal. A food mark means any animal.',
      [
        {
          label: 'Explain',
          callback: () => this.showMessage('How notes work', this.hint.explain(this.puzzle)),
        },
        {
          label: 'Nudge',
          callback: () => this.showMessage('A gentle nudge', this.hint.nudge(this.puzzle)),
        },
        {
          label: 'Reveal one',
          callback: () => {
            const index = this.hint.reveal(this.puzzle, this.placement.board);
            this.closeModal();
            if (index !== null) {
              this.bento.slots[index]!.setHighlighted(true, true);
              this.time.delayedCall(2800, () => this.bento.slots[index]?.setHighlighted(false));
              this.announce(`A helpful glow marks cell ${index + 1}.`);
            }
          },
        },
      ],
    );
    this.audio.play('paper');
  }

  private openSettings(): void {
    if (this.solved) return;
    this.openModal('Cozy settings', 'Tune the room to feel just right.', [
      {
        label: `Sound: ${this.settings.sound ? 'on' : 'off'}`,
        callback: () => {
          this.settings = this.save.updateSettings({ sound: !this.settings.sound });
          this.audio.setEnabled(this.settings.sound);
          this.closeModal();
          this.openSettings();
        },
      },
      {
        label: `Motion: ${this.settings.reducedMotion ? 'reduced' : 'gentle'}`,
        callback: () => {
          this.settings = this.save.updateSettings({ reducedMotion: !this.settings.reducedMotion });
          this.closeModal();
          this.openSettings();
        },
      },
      {
        label: 'Restart tray',
        callback: () => {
          this.closeModal();
          this.placement.restart();
          this.updatePiecePositions(true);
          this.updateStatus();
          this.saveCurrent();
        },
      },
      { label: 'New random', callback: () => this.startRandom() },
    ]);
  }

  private openModal(
    titleText: string,
    bodyText: string,
    actions: Array<{ label: string; callback: () => void }>,
  ): void {
    this.closeModal();
    const modal = this.add.container(800, 450).setDepth(2600);
    const shade = this.add.rectangle(0, 0, 1600, 900, COLORS.walnut, 0.26).setInteractive();
    const card = this.add.graphics();
    const height = Math.max(330, 240 + Math.ceil(actions.length / 2) * 62);
    card.fillStyle(COLORS.shadow, 0.17);
    card.fillRoundedRect(-312, -height / 2 + 12, 640, height, 38);
    card.fillStyle(COLORS.milk, 1);
    card.fillRoundedRect(-320, -height / 2, 640, height, 38);
    card.lineStyle(4, COLORS.blush, 0.45);
    card.strokeRoundedRect(-312, -height / 2 + 8, 624, height - 16, 32);
    const title = this.add
      .text(0, -height / 2 + 54, titleText, {
        fontFamily: FONT_DISPLAY,
        fontSize: '30px',
        fontStyle: 'bold',
        color: '#684a42',
      })
      .setOrigin(0.5);
    const body = this.add
      .text(0, -height / 2 + 126, bodyText, {
        fontFamily: FONT_BODY,
        fontSize: '18px',
        color: '#80665f',
        align: 'center',
        wordWrap: { width: 530 },
        lineSpacing: 7,
      })
      .setOrigin(0.5);
    modal.add([shade, card, title, body]);
    actions.forEach((action, index) => {
      const columns = actions.length === 1 ? 1 : 2;
      const column = index % columns;
      const row = Math.floor(index / columns);
      this.makeButton(
        {
          x: columns === 1 ? 0 : -135 + column * 270,
          y: height / 2 - 88 + row * 58,
          width: 238,
          label: action.label,
          callback: action.callback,
          primary: index === actions.length - 1 && actions.length > 1,
        },
        modal,
      );
    });
    const close = this.add
      .text(282, -height / 2 + 31, '×', {
        fontFamily: FONT_BODY,
        fontSize: '32px',
        color: '#8a6c63',
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    close.on('pointerdown', () => this.closeModal());
    modal.add(close);
    modal.setAlpha(0).setScale(0.96);
    this.tweens.add({ targets: modal, alpha: 1, scale: 1, duration: 180, ease: 'Sine.easeOut' });
    this.modal = modal;
  }

  private showMessage(title: string, message: string): void {
    this.openModal(title, message, [{ label: 'Got it', callback: () => this.closeModal() }]);
    this.announce(message);
  }

  private closeModal(): void {
    if (!this.modal) return;
    this.modal.destroy(true);
    this.modal = undefined;
  }

  private moveFocus(delta: number): void {
    if (this.modal || this.solved) return;
    const total = 21;
    this.focusIndex = (this.focusIndex + delta + total) % total;
    this.pieces.forEach((view) => view.setFocused(false));
    this.bento.slots.forEach((slot) => slot.setHighlighted(false));
    if (this.focusIndex < 12) {
      const piece = this.puzzle.pieces[this.focusIndex]!;
      this.pieces.get(piece.id)!.setFocused(true);
      this.announce(
        `${ANIMAL_LABELS[piece.animal]} ${FOOD_LABELS[piece.food]}. Press Enter to select.`,
      );
    } else {
      const cell = this.focusIndex - 12;
      this.bento.slots[cell]!.setHighlighted(true);
      this.announce(`Bento cell ${cell + 1}. Press Enter to place or pick up.`);
    }
  }

  private activateFocus(): void {
    if (this.modal || this.solved) return;
    if (this.focusIndex < 12) this.selectPiece(this.puzzle.pieces[this.focusIndex]!.id);
    else this.activateSlot(this.focusIndex - 12);
  }

  private startRandom(): void {
    this.closeModal();
    this.createPuzzle(createRandomSeed());
    this.announce('A fresh random bento is ready.');
  }

  private startDaily(): void {
    if (this.solved) return;
    this.createPuzzle(createDailySeed());
    this.announce('Today’s daily bento is ready.');
  }

  private async copySeed(): Promise<void> {
    const url = new URL(window.location.href);
    url.searchParams.set('seed', this.puzzle.seed);
    try {
      await navigator.clipboard.writeText(url.toString());
      this.seedText?.setText('Link copied — warm and ready!');
      this.time.delayedCall(1500, () =>
        this.seedText?.setText(`${this.puzzle.seed}  ·  ${this.puzzle.difficulty}`),
      );
      this.announce('Share link copied.');
    } catch {
      this.announce(`Share seed: ${this.puzzle.seed}`);
    }
  }

  private saveCurrent(): void {
    this.save.savePuzzle(this.puzzle.seed, this.placement.board, this.placement.moves);
  }

  private announce(message: string): void {
    const status = document.getElementById('a11y-status');
    if (status) status.textContent = message;
  }
}
