import Phaser from 'phaser';
import { getCampaignOrder } from '../campaign/campaignData';
import { getCampaignStoryForOrder, storyEventId } from '../campaign/storyData';
import { COLORS, FONT_BODY, FONT_DISPLAY } from '../game/constants';
import {
  campaignPlayContext,
  INFINITE_PLAY_CONTEXT,
  RUSH_PLAY_CONTEXT,
  type PlayContext,
} from '../game/playContext';
import {
  ChallengeTimer,
  formatChallengeTime,
  MASTER_CHALLENGE_DURATION_MS,
} from '../gameplay/ChallengeTimer';
import { ElapsedTimer, formatElapsedTime } from '../gameplay/ElapsedTimer';
import { HintController } from '../gameplay/HintController';
import { PlacementController } from '../gameplay/PlacementController';
import { PuzzleController } from '../gameplay/PuzzleController';
import { TUTORIAL_SEED, TutorialController } from '../gameplay/TutorialController';
import { I18nService } from '../i18n/I18nService';
import type { TranslationKey } from '../i18n/translations';
import { difficultySlug, parseDifficulty } from '../puzzle/DifficultyEvaluator';
import { PuzzleGenerator } from '../puzzle/PuzzleGenerator';
import { createDailySeed, createRandomSeed } from '../puzzle/SeededRandom';
import {
  DIFFICULTIES,
  emptyBoard,
  toBoard,
  type Difficulty,
  type GameHistoryEntry,
  type GameMode,
  type PieceId,
  type PlayerSettings,
  type PuzzleDefinition,
} from '../puzzle/types';
import { AudioService } from '../services/AudioService';
import { musicAssets, type SoundName } from '../services/AssetRegistry';
import { MusicService } from '../services/MusicService';
import { SaveService } from '../services/SaveService';
import { BentoBoard } from '../views/BentoBoard';
import { CelebrationView } from '../views/CelebrationView';
import { CluePanel } from '../views/CluePanel';
import { GameHistoryModal, type HistoryGameRow } from '../views/GameHistoryModal';
import { InventoryPanel } from '../views/InventoryPanel';
import { getPieceVisualLayout, PieceView } from '../views/PieceView';
import { TutorialView, type TutorialHighlight } from '../views/TutorialView';

interface ButtonSpec {
  x: number;
  y: number;
  width: number;
  label: string;
  callback: () => void;
  primary?: boolean;
  icon?: boolean;
  sound?: SoundName | false;
  allowDuringTutorial?: boolean;
}

const CELEBRATION_PIECE_STAGGER_MS = 55;
const CELEBRATION_SPARKLE_STAGGER_MS = 60;
const CELEBRATION_SPARKLE_DURATION_MS = 520;
const CELEBRATION_MODAL_DELAY_MS =
  8 * CELEBRATION_PIECE_STAGGER_MS +
  2 * CELEBRATION_SPARKLE_STAGGER_MS +
  CELEBRATION_SPARKLE_DURATION_MS +
  70;

interface PiecePress {
  pieceId: PieceId;
  wasSelected: boolean;
  startX: number;
  startY: number;
  moved: boolean;
}

interface SliderSpec {
  label: string;
  value: number;
  onChange: (value: number) => void;
}

interface ModalLayoutSpec {
  actionWidth?: number;
}

export class PuzzleScene extends Phaser.Scene {
  private generator = new PuzzleGenerator();
  private save!: SaveService;
  private audio!: AudioService;
  private music!: MusicService;
  private i18n!: I18nService;
  private localizedI18n!: I18nService;
  private settings!: PlayerSettings;
  private puzzle!: PuzzleDefinition;
  private puzzleController!: PuzzleController;
  private placement!: PlacementController;
  private hint!: HintController;
  private inventory!: InventoryPanel;
  private bento!: BentoBoard;
  private pieces = new Map<PieceId, PieceView>();
  private usablePieceIds = new Set<PieceId>();
  private selectedPiece: PieceId | null = null;
  private dragging?: PieceView;
  private piecePress?: PiecePress;
  private modal?: Phaser.GameObjects.Container;
  private moveText!: Phaser.GameObjects.Text;
  private petalTimer?: Phaser.Time.TimerEvent;
  private solved = false;
  private mode: GameMode = 'standard';
  private tutorial?: TutorialController;
  private tutorialView?: TutorialView;
  private undoButton?: Phaser.GameObjects.Container;
  private timer?: ChallengeTimer;
  private timerText?: Phaser.GameObjects.Text;
  private elapsedTimer = new ElapsedTimer();
  private attemptId = '';
  private attemptStartedAt = 0;
  private lastElapsedDisplaySecond = -1;
  private lastElapsedPersistedBucket = -1;
  private timedOut = false;
  private countdown?: Phaser.GameObjects.Container;
  private visibilityHandler?: () => void;
  private playContext: PlayContext = INFINITE_PLAY_CONTEXT;
  private launchContext?: PlayContext;
  private pendingCampaignContext?: PlayContext;

  constructor() {
    super('PuzzleScene');
  }

  init(data?: { context?: PlayContext }): void {
    this.launchContext = data?.context;
  }

  create(): void {
    this.save = new SaveService();
    this.settings = this.save.settings;
    this.i18n = new I18nService('en');
    this.localizedI18n = new I18nService(this.settings.language);
    document.documentElement.lang = 'en';
    this.game.canvas.setAttribute('aria-label', this.i18n.t('app.ariaLabel'));
    this.audio = new AudioService(this, this.settings);
    this.music = new MusicService(this, musicAssets, this.settings.musicVolume);
    const params = new URLSearchParams(window.location.search);
    const firstVisit = !this.save.tutorialCompleted;
    const requestedMode: GameMode = params.get('mode') === 'timed' ? 'timed' : 'standard';
    const requestedContext =
      this.launchContext ?? (requestedMode === 'timed' ? RUSH_PLAY_CONTEXT : INFINITE_PLAY_CONTEXT);
    if (firstVisit && requestedContext.source === 'campaign') {
      this.pendingCampaignContext = requestedContext;
    }
    this.playContext = firstVisit ? INFINITE_PLAY_CONTEXT : requestedContext;
    this.mode = this.playContext.timed ? 'timed' : 'standard';
    const campaignOrder =
      requestedContext.source === 'campaign' && requestedContext.campaignOrderId
        ? getCampaignOrder(requestedContext.campaignOrderId)
        : undefined;
    const difficulty = firstVisit
      ? 'cozy'
      : campaignOrder
        ? campaignOrder.difficulty
        : this.mode === 'timed'
          ? 'master'
          : (parseDifficulty(params.get('difficulty')) ??
            (this.save.currentSource === this.playContext.source
              ? this.save.currentDifficulty
              : undefined) ??
            this.settings.difficulty);
    const savedSeed =
      this.save.currentDifficulty === difficulty &&
      this.save.currentSource === this.playContext.source
        ? this.save.currentSeed
        : undefined;
    const seed = firstVisit
      ? TUTORIAL_SEED
      : (campaignOrder?.seed ?? params.get('seed') ?? savedSeed ?? createRandomSeed());
    this.createPuzzle(seed, difficulty, this.mode, this.playContext);
    this.bindInput();
    if (firstVisit) this.beginTutorial();
    else if (this.mode === 'timed') {
      if (this.playContext.source === 'campaign') this.openCampaignTimedRules();
      else this.openTimedChallengeRules(false);
    }
    this.schedulePetalDrift(true);
    this.time.addEvent({
      delay: 5200,
      loop: true,
      callback: () => {
        const views = [...this.pieces.values()];
        views[Math.floor(Math.random() * views.length)]?.idle(this.settings.reducedMotion);
      },
    });
    if (!firstVisit) this.announce(this.i18n.t('announce.ready'));
    this.visibilityHandler = () => this.handleVisibilityChange();
    document.addEventListener('visibilitychange', this.visibilityHandler);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.elapsedTimer.pause();
      if (!this.solved) this.saveCurrent();
      if (this.visibilityHandler)
        document.removeEventListener('visibilitychange', this.visibilityHandler);
    });
  }

  update(): void {
    this.updateElapsedDisplay();
    if (this.mode !== 'timed' || !this.timer || this.timedOut || this.solved) return;
    this.updateTimerDisplay();
    if (this.timer.state === 'expired') this.handleTimedOut();
  }

  private createPuzzle(
    seed: string,
    difficulty: Difficulty = this.settings.difficulty,
    mode: GameMode = 'standard',
    context: PlayContext = mode === 'timed' ? RUSH_PLAY_CONTEXT : INFINITE_PLAY_CONTEXT,
    resume = true,
  ): void {
    this.mode = mode;
    this.playContext = context;
    this.hint = new HintController(context.allowReveal);
    this.settings =
      context.source === 'campaign'
        ? this.save.settings
        : this.save.updateSettings({ difficulty, mode });
    this.puzzle = this.generator.create(seed, difficulty);
    this.usablePieceIds = new Set(
      this.puzzle.solution.filter((pieceId): pieceId is PieceId => pieceId !== null),
    );
    this.puzzleController = new PuzzleController(this.puzzle);
    const saved = this.save.loadPuzzle(
      this.puzzle.seed,
      this.puzzle.difficulty,
      mode,
      context,
      resume && mode !== 'timed',
    );
    const playableBoard = toBoard(
      saved.board.map((pieceId) => (pieceId && this.usablePieceIds.has(pieceId) ? pieceId : null)),
    );
    this.placement = new PlacementController(playableBoard, saved.moves);
    this.attemptId = saved.attemptId;
    this.attemptStartedAt = saved.startedAt;
    this.elapsedTimer = new ElapsedTimer(saved.elapsedMs);
    this.lastElapsedDisplaySecond = -1;
    this.lastElapsedPersistedBucket = Math.floor(saved.elapsedMs / 5_000);
    this.selectedPiece = null;
    this.solved = false;
    this.timedOut = false;
    this.timer =
      mode === 'timed'
        ? new ChallengeTimer(context.durationMs ?? MASTER_CHALLENGE_DURATION_MS)
        : undefined;
    this.renderScene();
    if (mode === 'standard' && !document.hidden) this.elapsedTimer.resume();
    this.saveCurrent();
    this.syncUrl();
  }

  private renderScene(): void {
    this.tutorialView?.destroy();
    this.tutorialView = undefined;
    this.countdown = undefined;
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
      .text(56, 74, this.i18n.t('brand.subtitle'), {
        fontFamily: FONT_BODY,
        fontSize: '15px',
        color: '#765149',
        letterSpacing: 2,
        stroke: '#f3d5bf',
        strokeThickness: 1,
      })
      .setOrigin(0, 0.5);

    this.inventory = new InventoryPanel(this, 305, 465, this.i18n);
    this.bento = new BentoBoard(this, 800, 414);
    // Center the dynamic notes on the illustrated paper, whose visual center
    // sits left of the right-hand layout column.
    new CluePanel(this, 1332, 485, this.puzzle.clues, this.i18n);

    this.puzzle.pieces.forEach((piece, index) => {
      const position = this.inventory.trayPosition(index);
      const view = new PieceView(this, piece, position.x, position.y);
      view.setAvailable(this.usablePieceIds.has(piece.id));
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

    this.makeButton({
      x: 790,
      y: 54,
      width: 144,
      label: this.localizedI18n.t('button.history'),
      callback: () => this.openGameHistory(),
      sound: false,
    });

    this.makeButton({
      x: 1062,
      y: 54,
      width: 92,
      label:
        this.playContext.source === 'campaign'
          ? this.difficultyLabel(this.puzzle.difficulty)
          : `${this.difficultyLabel(this.puzzle.difficulty)} ▾`,
      callback: () => {
        if (this.playContext.source !== 'campaign') this.openDifficultySelect();
      },
      sound: false,
    });

    if (this.playContext.source !== 'campaign') {
      this.makeButton({
        x: 1166,
        y: 54,
        width: 92,
        label: this.i18n.t('button.daily'),
        callback: () => this.startDaily(),
      });
      this.makeButton({
        x: 1270,
        y: 54,
        width: 92,
        label: this.i18n.t('button.timed'),
        callback: () => this.openTimedChallengeRules(),
        primary: this.mode === 'timed',
      });
    }
    this.undoButton = this.makeButton({
      x: 1362,
      y: 54,
      width: 52,
      label: '↶',
      callback: () => this.undo(),
      icon: true,
      sound: false,
      allowDuringTutorial: true,
    });
    this.makeButton({
      x: 1426,
      y: 54,
      width: 52,
      label: '?',
      callback: () => this.openHelp(),
      icon: true,
      sound: false,
    });
    this.makeButton({
      x: 1490,
      y: 54,
      width: 52,
      label: '⚙',
      callback: () => this.openSettings(),
      icon: true,
      sound: false,
      allowDuringTutorial: true,
    });

    this.moveText = this.add
      .text(790, 836, '', {
        fontFamily: FONT_BODY,
        fontSize: '17px',
        color: '#8a6a60',
      })
      .setOrigin(0.5);
    if (this.mode === 'timed') {
      this.timerText = this.add
        .text(790, 102, this.i18n.t('timed.label', { time: '1:45' }), {
          fontFamily: FONT_DISPLAY,
          fontSize: '25px',
          fontStyle: 'bold',
          color: '#74594f',
          backgroundColor: '#fff8e9dd',
          padding: { x: 16, y: 7 },
        })
        .setOrigin(0.5);
    } else {
      this.timerText = undefined;
    }
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
      if (
        this.solved ||
        this.modal ||
        !this.canPlay() ||
        !this.usablePieceIds.has(view.piece.id) ||
        (this.tutorial?.active && !this.tutorial.allowsPiece(view.piece.id))
      )
        return;
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
    this.input.once('pointerdown', () => this.music.start());
    this.input.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      if (!this.selectedPiece || this.dragging || this.modal || this.solved || !this.canPlay())
        return;
      const slot = this.bento.nearestSlot(pointer.worldX, pointer.worldY);
      if (slot !== null) this.placeSelected(slot);
    });
    this.input.on('dragstart', (_pointer: Phaser.Input.Pointer, target: PieceView) => {
      if (
        this.solved ||
        this.modal ||
        !this.canPlay() ||
        !this.usablePieceIds.has(target.piece.id) ||
        (this.tutorial?.active && !this.tutorial.allowsPiece(target.piece.id))
      )
        return;
      this.dragging = target;
      this.selectPiece(target.piece.id, false, false);
      target.lift();
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
      if (slot !== null) {
        const placed = this.placeSelected(slot);
        if (!placed) target.returnHome(this.settings.reducedMotion);
      } else if (
        this.inventory.containsWorldPoint(target.x, target.y) &&
        target.boardCell !== null
      ) {
        this.placement.returnToTray(target.piece.id);
        this.audio.play('piece_return');
        this.afterBoardChange();
      } else target.returnHome(this.settings.reducedMotion);
      target.setDepth(100);
      target.settle(this.settings.reducedMotion);
      this.dragging = undefined;
      this.piecePress = undefined;
    });
  }

  private selectPiece(pieceId: PieceId, toggle = true, withSound = true): void {
    if (!this.usablePieceIds.has(pieceId)) return;
    if (this.tutorial?.active && !this.tutorial.allowsPiece(pieceId)) return;
    this.selectedPiece = toggle && this.selectedPiece === pieceId ? null : pieceId;
    this.pieces.forEach((view, id) => {
      view.setSelected(id === this.selectedPiece);
      if (id !== this.selectedPiece && !this.dragging) view.setScale(1);
    });
    if (this.selectedPiece) {
      const piece = this.pieces.get(this.selectedPiece)!.piece;
      if (withSound) this.audio.play('piece_pick');
      this.announce(this.pieceLabel(piece.id));
      if (this.tutorial?.handle({ type: 'selectPiece', pieceId })) this.showTutorialStep();
    }
  }

  private activateSlot(index: number): void {
    if (
      this.solved ||
      this.modal ||
      !this.canPlay() ||
      (this.tutorial?.active && !this.tutorial.allowsCell(index))
    )
      return;
    if (this.selectedPiece) {
      this.placeSelected(index);
      return;
    }
    const pieceId = this.placement.board[index];
    if (pieceId) this.selectPiece(pieceId);
  }

  private placeSelected(index: number): boolean {
    if (!this.selectedPiece) return false;
    if (this.tutorial?.active && !this.tutorial.allowsCell(index)) {
      this.audio.play('ui_tap');
      this.announce(this.localizedI18n.t('tutorial.wrongCell'));
      return false;
    }
    const placedPiece = this.selectedPiece;
    const result = this.placement.place(placedPiece, index);
    if (result.changed) {
      this.audio.play(result.swapped ? 'piece_swap' : 'piece_drop');
      this.afterBoardChange();
      if (this.tutorial?.handle({ type: 'placePiece', pieceId: placedPiece, cell: index })) {
        this.showTutorialStep();
      }
    }
    if (result.changed) {
      this.selectedPiece = null;
      this.pieces.forEach((view) => view.setSelected(false));
    }
    return result.changed;
  }

  private afterBoardChange(): void {
    this.updatePiecePositions(!this.tutorial?.active);
    this.updateStatus();
    this.saveCurrent();
    if (!this.placement.isFull()) return;
    if (this.puzzleController.validate(this.placement.board)) this.celebrate();
    else {
      this.audio.play('board_incorrect', 120);
      this.bento.wobble(this.settings.reducedMotion);
      this.announce(this.i18n.t('announce.incorrect'));
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
      if (this.usablePieceIds.has(piece.id)) {
        view.setAlpha(boardSet.has(piece.id) || cellIndex < 0 ? 1 : 0.84);
      }
    });
  }

  private updateStatus(): void {
    const filled = this.placement.board.filter(Boolean).length;
    const status = this.i18n.t('status.template', {
      filled,
      moves: this.i18n.moves(this.placement.moves),
      finished: this.i18n.finished(this.save.solvedCount),
    });
    this.moveText.setText(
      this.i18n.t('status.elapsed', {
        status,
        time: formatElapsedTime(this.elapsedTimer.elapsedMs),
      }),
    );
  }

  private undo(): void {
    if (
      this.modal ||
      this.solved ||
      !this.canPlay() ||
      (this.tutorial?.active && !this.tutorial.allowsUndo)
    )
      return;
    if (!this.placement.restorePrevious()) {
      this.audio.play('ui_tap');
      this.announce(this.i18n.t('announce.nothingToUndo'));
      return;
    }
    this.audio.play('piece_return');
    this.updatePiecePositions(!this.tutorial?.active);
    this.updateStatus();
    this.saveCurrent();
    this.announce(this.i18n.t('announce.undo'));
    if (this.tutorial?.handle({ type: 'undo' })) this.showTutorialStep();
  }

  private celebrate(): void {
    this.solved = true;
    const remainingMs = this.timer?.remainingMs ?? 0;
    this.timer?.pause();
    this.elapsedTimer.pause();
    const elapsedMs = this.elapsedTimer.elapsedMs;
    this.save.markSolved(
      this.playContext.source === 'rush' ? 'timed' : 'standard',
      remainingMs,
      elapsedMs,
      this.placement.moves,
    );
    if (this.playContext.source === 'campaign' && this.playContext.campaignOrderId) {
      this.save.completeCampaignOrder(this.playContext.campaignOrderId);
    }
    this.audio.play('success', 100);
    this.announce(this.i18n.t('announce.complete'));
    if (!this.settings.reducedMotion) {
      this.placement.board.forEach((pieceId, index) => {
        if (!pieceId) return;
        const view = this.pieces.get(pieceId)!;
        this.time.delayedCall(index * CELEBRATION_PIECE_STAGGER_MS, () => {
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
    this.time.delayedCall(this.settings.reducedMotion ? 150 : CELEBRATION_MODAL_DELAY_MS, () => {
      this.modal = new CelebrationView(
        this,
        this.i18n,
        () => {
          this.audio.play('ui_tap');
          if (this.playContext.source === 'campaign' && this.playContext.campaignOrderId) {
            const story = getCampaignStoryForOrder(this.playContext.campaignOrderId);
            const shouldShowChapterComplete =
              story?.finalOrderId === this.playContext.campaignOrderId &&
              !this.save.hasViewedCampaignStory(storyEventId(story.chapter, 'chapterComplete'));
            if (shouldShowChapterComplete) {
              this.scene.start('StoryScene', {
                orderId: this.playContext.campaignOrderId,
                phase: 'chapterComplete',
              });
            } else {
              this.scene.start('CampaignScene');
            }
          } else if (this.mode === 'timed') this.startTimedChallenge(createRandomSeed());
          else this.startRandom();
        },
        () => void this.copyGameSeed(this.puzzle.seed, this.puzzle.difficulty),
        this.playContext.source === 'campaign'
          ? this.localizedI18n.t('campaign.completeBody')
          : this.mode === 'timed'
            ? this.i18n.t('celebration.timedBody', { time: formatChallengeTime(remainingMs) })
            : this.i18n.t('celebration.body'),
        this.playContext.source === 'campaign'
          ? this.localizedI18n.t('campaign.returnBook')
          : this.i18n.t('celebration.next'),
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
        duration: CELEBRATION_SPARKLE_DURATION_MS,
        delay: index * CELEBRATION_SPARKLE_STAGGER_MS,
        onComplete: () => star.destroy(),
      });
    }
  }

  private schedulePetalDrift(initial = false): void {
    this.petalTimer?.remove(false);
    const delay = initial ? Phaser.Math.Between(9000, 15000) : Phaser.Math.Between(19000, 32000);
    this.petalTimer = this.time.delayedCall(delay, () => {
      this.petalTimer = undefined;
      if (!this.settings.reducedMotion && !this.modal && !this.solved) this.driftSakuraPetals();
      this.schedulePetalDrift();
    });
  }

  private driftSakuraPetals(): void {
    const fromRight = Math.random() < 0.7;
    const petalCount = Phaser.Math.Between(2, 3);
    const startX = fromRight ? 1620 : Phaser.Math.Between(520, 1510);
    const startY = fromRight ? Phaser.Math.Between(90, 590) : -18;

    for (let index = 0; index < petalCount; index += 1) {
      const petal = this.add
        .ellipse(
          startX + (fromRight ? index * 18 : index * 34),
          startY - (fromRight ? index * 32 : index * 10),
          Phaser.Math.Between(8, 11),
          Phaser.Math.Between(4, 6),
          COLORS.blush,
          Phaser.Math.FloatBetween(0.15, 0.24),
        )
        .setAngle(Phaser.Math.Between(-35, 35))
        .setDepth(70)
        .setName('sakura-petal');
      const driftX = fromRight ? -Phaser.Math.Between(350, 520) : Phaser.Math.Between(-150, 120);
      const driftY = fromRight ? Phaser.Math.Between(140, 250) : Phaser.Math.Between(300, 460);

      this.tweens.add({
        targets: petal,
        x: petal.x + driftX,
        y: petal.y + driftY,
        angle: petal.angle + Phaser.Math.Between(160, 310),
        alpha: 0,
        duration: Phaser.Math.Between(7000, 9500),
        delay: index * 420,
        ease: 'Sine.easeInOut',
        onComplete: () => petal.destroy(),
      });
    }
  }

  private makeButton(
    spec: ButtonSpec,
    parent?: Phaser.GameObjects.Container,
  ): Phaser.GameObjects.Container {
    const container = this.add.container(spec.x, spec.y);
    const height = spec.icon ? 48 : 44;
    const textureKey = spec.icon
      ? 'top_button_round'
      : spec.primary
        ? 'top_button_pill_active'
        : 'top_button_pill';
    const background = this.textures.exists(textureKey)
      ? this.add
          .image(0, 0, textureKey)
          .setDisplaySize(spec.icon ? 55 : spec.width + 6, spec.icon ? 55 : 54)
      : this.createButtonFallback(spec, height);
    const text = this.add
      .text(0, spec.icon ? 1 : 0, spec.label, {
        fontFamily: spec.icon ? 'Arial, sans-serif' : FONT_BODY,
        fontSize: spec.icon ? '23px' : '16px',
        fontStyle: 'bold',
        color: spec.primary ? '#fffaf3' : '#695149',
      })
      .setOrigin(0.5);
    container.add([background, text]);
    container.setSize(spec.width, height).setInteractive({ useHandCursor: true });
    container.on('pointerdown', () => {
      if (this.tutorial?.active && !spec.allowDuringTutorial) return;
      if (spec.sound !== false) this.audio.play(spec.sound ?? 'ui_tap');
      this.tweens.add({
        targets: container,
        scale: 0.97,
        duration: 55,
        yoyo: true,
        ease: 'Sine.easeOut',
      });
      spec.callback();
    });
    container.on('pointerover', () => container.setScale(1.04));
    container.on('pointerout', () => container.setScale(1));
    parent?.add(container);
    return container;
  }

  private createButtonFallback(spec: ButtonSpec, height: number): Phaser.GameObjects.Graphics {
    const background = this.add.graphics();
    background.fillStyle(spec.primary ? COLORS.coral : COLORS.milk, 0.94);
    background.fillRoundedRect(-spec.width / 2, -height / 2, spec.width, height, height / 2);
    background.lineStyle(2, spec.primary ? COLORS.blush : COLORS.sage, 0.3);
    background.strokeRoundedRect(-spec.width / 2, -height / 2, spec.width, height, height / 2);
    return background;
  }

  private openHelp(): void {
    if (this.solved || this.tutorial?.active) return;
    const actions: Array<{
      label: string;
      callback: () => void;
      primary?: boolean;
      sound?: SoundName | false;
    }> = [];
    if (this.playContext.allowReveal) {
      actions.push({
        label: this.localizedI18n.t('help.reveal'),
        callback: () => {
          const index = this.hint.reveal(this.puzzle, this.placement.board);
          this.closeModal();
          if (index !== null) {
            this.audio.play('hint_reveal');
            this.showHintReveal(index);
          }
        },
        sound: false,
      });
    }
    actions.push({
      label: this.localizedI18n.t('help.tutorial'),
      callback: () => this.beginTutorial(),
      primary: true,
      sound: 'note_open',
    });
    this.openModal(
      '',
      `${this.localizedI18n.t('help.body')}\n\n${this.localizedI18n.t('help.tutorialBody')}`,
      actions,
    );
    this.audio.play('note_open');
  }

  private openSettings(withSound = true): void {
    if (this.solved) return;
    const actions: Array<{
      label: string;
      callback: () => void;
      sound?: SoundName | false;
    }> = [
      {
        label: this.localizedI18n.t('settings.effects', {
          state: this.localizedI18n.t(this.settings.sound ? 'settings.on' : 'settings.off'),
        }),
        callback: () => {
          this.settings = this.save.updateSettings({ sound: !this.settings.sound });
          this.audio.setEnabled(this.settings.sound);
          this.closeModal();
          this.openSettings(false);
        },
      },
      {
        label: this.localizedI18n.t('settings.motion', {
          state: this.localizedI18n.t(
            this.settings.reducedMotion ? 'settings.motionReduced' : 'settings.motionGentle',
          ),
        }),
        callback: () => {
          this.settings = this.save.updateSettings({
            reducedMotion: !this.settings.reducedMotion,
          });
          this.closeModal();
          this.openSettings(false);
        },
      },
      {
        label: this.localizedI18n.t('settings.language', {
          language: this.localizedI18n.t(
            this.settings.language === 'en' ? 'language.en' : 'language.ru',
          ),
        }),
        callback: () => this.switchLanguage(this.settings.language === 'en' ? 'ru' : 'en'),
      },
    ];
    if (!this.tutorial?.active) {
      const gameplayActions: typeof actions = [
        {
          label: this.localizedI18n.t('settings.restart'),
          callback: () => {
            this.closeModal();
            this.placement.restart();
            const fresh = this.save.loadPuzzle(
              this.puzzle.seed,
              this.puzzle.difficulty,
              this.mode,
              this.playContext,
              false,
            );
            this.attemptId = fresh.attemptId;
            this.attemptStartedAt = fresh.startedAt;
            this.elapsedTimer.reset(0, !document.hidden && this.canPlay());
            this.lastElapsedDisplaySecond = -1;
            this.lastElapsedPersistedBucket = 0;
            this.updatePiecePositions(true);
            this.updateStatus();
            this.saveCurrent();
          },
          sound: 'piece_return',
        },
      ];
      if (this.playContext.source !== 'campaign') {
        gameplayActions.push({
          label: this.localizedI18n.t('settings.random'),
          callback: () => this.startRandom(),
        });
      }
      actions.splice(2, 0, ...gameplayActions);
    }
    actions.push({
      label: this.localizedI18n.t(
        this.playContext.returnTarget === 'campaign'
          ? 'settings.backToCampaign'
          : 'settings.backToCafe',
      ),
      callback: () => {
        this.closeModal();
        this.scene.start(
          this.playContext.returnTarget === 'campaign' ? 'CampaignScene' : 'MenuScene',
        );
      },
    });
    this.openModal(
      this.localizedI18n.t('settings.title'),
      this.localizedI18n.t('settings.body'),
      actions,
      [
        {
          label: this.localizedI18n.t('settings.effectsVolume'),
          value: this.settings.soundVolume,
          onChange: (soundVolume) => {
            this.settings = this.save.updateSettings({ soundVolume });
            this.audio.setVolume(this.settings.soundVolume);
          },
        },
        {
          label: this.localizedI18n.t('settings.music'),
          value: this.settings.musicVolume,
          onChange: (musicVolume) => {
            this.settings = this.save.updateSettings({ musicVolume });
            this.music.setVolume(this.settings.musicVolume);
          },
        },
      ],
      true,
      { actionWidth: 210 },
    );
    if (withSound) this.audio.play('note_open');
  }

  private openDifficultySelect(): void {
    if (this.solved || this.tutorial?.active) return;
    this.openModal(
      this.localizedI18n.t('difficulty.title'),
      this.localizedI18n.t('difficulty.body'),
      DIFFICULTIES.map((difficulty) => ({
        label: this.difficultyLabel(difficulty),
        callback: () => this.switchDifficulty(difficulty),
        primary: difficulty === this.puzzle.difficulty,
      })),
      undefined,
      true,
      { actionWidth: 188 },
    );
    this.audio.play('note_open');
  }

  private switchDifficulty(difficulty: Difficulty): void {
    if (difficulty === this.puzzle.difficulty) {
      this.closeModal();
      return;
    }
    this.closeModal();
    this.createPuzzle(this.puzzle.seed, difficulty, 'standard');
    this.announce(
      this.i18n.t('announce.difficulty', {
        difficulty: this.difficultyLabel(difficulty),
        description: this.difficultyDescription(difficulty),
      }),
    );
  }

  private openModal(
    titleText: string,
    bodyText: string,
    actions: Array<{
      label: string;
      callback: () => void;
      primary?: boolean;
      sound?: SoundName | false;
    }>,
    sliders?: readonly SliderSpec[],
    dismissible = true,
    layout: ModalLayoutSpec = {},
  ): void {
    this.closeModal(false);
    this.pauseElapsedTracking();
    const modal = this.add.container(800, 450).setDepth(this.tutorial?.active ? 5000 : 2600);
    const shade = this.add.rectangle(0, 0, 1600, 900, COLORS.walnut, 0.26).setInteractive();
    const card = this.add.graphics();
    const height =
      Math.max(330, 240 + Math.ceil(actions.length / 2) * 62) + (sliders?.length ?? 0) * 88;
    const hasTitle = titleText.trim().length > 0;
    card.fillStyle(COLORS.shadow, 0.17);
    card.fillRoundedRect(-312, -height / 2 + 12, 640, height, 38);
    card.fillStyle(COLORS.milk, 1);
    card.fillRoundedRect(-320, -height / 2, 640, height, 38);
    card.lineStyle(4, COLORS.blush, 0.45);
    card.strokeRoundedRect(-312, -height / 2 + 8, 624, height - 16, 32);
    const title = hasTitle
      ? this.add
          .text(0, -height / 2 + 54, titleText, {
            fontFamily: FONT_DISPLAY,
            fontSize: '30px',
            fontStyle: 'bold',
            color: '#684a42',
          })
          .setOrigin(0.5)
      : undefined;
    const body = this.add
      .text(0, -height / 2 + (hasTitle ? 126 : 104), bodyText, {
        fontFamily: FONT_BODY,
        fontSize: '18px',
        color: '#80665f',
        align: 'center',
        wordWrap: { width: 530 },
        lineSpacing: 7,
      })
      .setOrigin(0.5);
    modal.add([shade, card, ...(title ? [title] : []), body]);
    sliders?.forEach((slider, index) => {
      this.makeSlider(modal, -height / 2 + 218 + index * 88, slider);
    });
    const columns = actions.length === 1 ? 1 : 2;
    const rowCount = Math.ceil(actions.length / columns);
    actions.forEach((action, index) => {
      const column = index % columns;
      const row = Math.floor(index / columns);
      const lastRowY = height / 2 - (rowCount === 1 ? 88 : 50);
      this.makeButton(
        {
          x: columns === 1 ? 0 : -135 + column * 270,
          y: lastRowY - (rowCount - 1 - row) * 58,
          width: layout.actionWidth ?? 238,
          label: action.label,
          callback: action.callback,
          primary: action.primary ?? (index === actions.length - 1 && actions.length > 1),
          sound: action.sound,
          allowDuringTutorial: true,
        },
        modal,
      );
    });
    if (dismissible) {
      const close = this.add
        .text(282, -height / 2 + 31, '×', {
          fontFamily: FONT_BODY,
          fontSize: '32px',
          color: '#8a6c63',
        })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true });
      close.on('pointerdown', () => {
        this.audio.play('ui_tap');
        this.closeModal();
      });
      modal.add(close);
    }
    modal.setAlpha(0).setScale(0.96);
    this.tweens.add({ targets: modal, alpha: 1, scale: 1, duration: 180, ease: 'Sine.easeOut' });
    this.modal = modal;
  }

  private showHintReveal(index: number): void {
    const slot = this.bento.slots[index];
    const pieceId = this.puzzle.solution[index];
    if (!slot || !pieceId) return;
    const piece = this.pieces.get(pieceId)?.piece;
    if (!piece) return;

    const position = this.bento.slotWorldPosition(index);
    slot.setHighlighted(true, true);

    const overlay = this.add
      .container(position.x, position.y)
      .setDepth(2200)
      .setName('hint-reveal');
    const ring = this.add.graphics();
    ring.fillStyle(COLORS.milk, 0.78);
    ring.fillRoundedRect(-76, -76, 152, 152, 28);
    ring.lineStyle(7, COLORS.honey, 0.96);
    ring.strokeRoundedRect(-76, -76, 152, 152, 28);

    const visual = getPieceVisualLayout(pieceId);
    const ghost = this.add
      .image(visual.x, visual.y, piece.textureKey)
      .setDisplaySize(visual.size, visual.size)
      .setAlpha(0.78)
      .setName('hint-piece-image');
    const ghostWobble = this.add.container(0, 0, ghost).setName('hint-piece');
    overlay.add([ring, ghostWobble]);

    if (this.settings.reducedMotion) {
      overlay.setScale(1).setAlpha(1);
    } else {
      overlay.setScale(0.92).setAlpha(0);
      this.tweens.add({
        targets: overlay,
        scale: 1,
        alpha: 1,
        duration: 180,
        ease: 'Sine.easeOut',
        onComplete: () => {
          if (!overlay.active) return;
          this.tweens.add({
            targets: overlay,
            scale: 1.018,
            duration: 420,
            yoyo: true,
            repeat: 3,
            ease: 'Sine.easeInOut',
          });
          this.tweens.add({
            targets: ghostWobble,
            angle: { from: -1.5, to: 1.5 },
            scaleY: { from: 1, to: 0.975 },
            duration: 420,
            yoyo: true,
            repeat: 3,
            ease: 'Sine.easeInOut',
          });
        },
      });
    }

    this.time.delayedCall(4000, () => {
      if (slot.active) slot.setHighlighted(false);
      if (overlay.active) overlay.destroy();
    });
  }

  private makeSlider(parent: Phaser.GameObjects.Container, y: number, spec: SliderSpec): void {
    const width = 360;
    let value = Phaser.Math.Clamp(spec.value, 0, 1);
    const label = this.add
      .text(0, y - 22, '', {
        fontFamily: FONT_BODY,
        fontSize: '17px',
        fontStyle: 'bold',
        color: '#6f554d',
      })
      .setOrigin(0.5);
    const visual = this.add.graphics().setPosition(0, y + 14);
    const zone = this.add.zone(0, y + 14, width + 50, 54).setInteractive({ useHandCursor: true });

    const redraw = (): void => {
      label.setText(
        value === 0
          ? `${spec.label}: ${this.localizedI18n.t('settings.off')}`
          : `${spec.label}: ${Math.round(value * 100)}%`,
      );
      visual.clear();
      visual.fillStyle(COLORS.sage, 0.22);
      visual.fillRoundedRect(-width / 2, -5, width, 10, 5);
      if (value > 0) {
        visual.fillStyle(COLORS.coral, 0.82);
        visual.fillRoundedRect(-width / 2, -5, width * value, 10, 5);
      }
      visual.fillStyle(COLORS.milk, 1);
      visual.fillCircle(-width / 2 + width * value, 0, 14);
      visual.lineStyle(3, COLORS.coral, 0.88);
      visual.strokeCircle(-width / 2 + width * value, 0, 14);
    };
    const updateFromPointer = (pointer: Phaser.Input.Pointer): void => {
      value = Phaser.Math.Clamp((pointer.worldX - (parent.x - width / 2)) / width, 0, 1);
      value = Math.round(value * 100) / 100;
      redraw();
      spec.onChange(value);
    };

    zone.on('pointerdown', updateFromPointer);
    zone.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (pointer.isDown) updateFromPointer(pointer);
    });
    redraw();
    parent.add([label, visual, zone]);
  }

  private closeModal(resumeElapsed = true): void {
    if (!this.modal) return;
    this.modal.destroy(true);
    this.modal = undefined;
    if (resumeElapsed) this.resumeElapsedTracking();
  }

  private startRandom(): void {
    this.closeModal();
    this.createPuzzle(createRandomSeed(), this.puzzle.difficulty, 'standard');
    this.announce(this.i18n.t('announce.random'));
  }

  private startDaily(): void {
    if (this.solved || this.tutorial?.active) return;
    this.createPuzzle(createDailySeed(), this.puzzle.difficulty, 'standard');
    this.announce(this.i18n.t('announce.daily'));
  }

  private openGameHistory(): void {
    if (this.solved || this.tutorial?.active) return;
    this.closeModal(false);
    this.pauseElapsedTracking();
    const history = new GameHistoryModal(this, this.localizedI18n, {
      close: () => {
        this.audio.play('ui_tap');
        this.closeModal();
      },
      copy: (row) => this.copyGameSeed(row.seed, row.difficulty),
      replay: (row) => this.replayHistoryGame(row),
    });
    history.refresh(this.historyRows());
    this.modal = history;
    this.audio.play('note_open');
  }

  private historyRows(): HistoryGameRow[] {
    const active = this.save.activeGame;
    const current = active
      ? [
          {
            attemptId: active.attemptId,
            startedAt: active.startedAt,
            seed: active.seed,
            difficulty: active.difficulty,
            mode: active.mode,
            source: active.source,
            ...(active.campaignOrderId ? { campaignOrderId: active.campaignOrderId } : {}),
            durationMs:
              active.attemptId === this.attemptId ? this.elapsedTimer.elapsedMs : active.elapsedMs,
            moves: active.attemptId === this.attemptId ? this.placement.moves : active.moves,
            current: true,
          } satisfies HistoryGameRow,
        ]
      : [];
    return [
      ...current,
      ...this.save.gameHistory.map((entry): HistoryGameRow => ({
        ...(entry as GameHistoryEntry),
        current: false,
      })),
    ];
  }

  private replayHistoryGame(row: HistoryGameRow): void {
    this.audio.play('ui_tap');
    this.closeModal(false);
    if (row.source === 'campaign' && row.campaignOrderId) {
      const order = getCampaignOrder(row.campaignOrderId);
      const context = campaignPlayContext(order.id, order.timed, order.durationMs);
      this.createPuzzle(
        row.seed,
        row.difficulty,
        order.timed ? 'timed' : 'standard',
        context,
        false,
      );
      if (order.timed) this.openCampaignTimedRules();
      else this.announce(this.i18n.t('announce.ready'));
      return;
    }

    if (row.source === 'rush' || row.mode === 'timed') {
      this.createPuzzle(row.seed, row.difficulty, 'timed', RUSH_PLAY_CONTEXT, false);
      this.openTimedChallengeRules(false);
      return;
    }

    this.createPuzzle(row.seed, row.difficulty, 'standard', INFINITE_PLAY_CONTEXT, false);
    this.announce(this.i18n.t('announce.ready'));
  }

  private async copyGameSeed(seed: string, difficulty: Difficulty): Promise<boolean> {
    if (this.tutorial?.active) return false;
    this.audio.play('ui_tap');
    const url = new URL(window.location.pathname, window.location.origin);
    url.searchParams.set('seed', seed);
    url.searchParams.set('difficulty', difficultySlug(difficulty));
    try {
      await navigator.clipboard.writeText(url.toString());
      this.announce(this.i18n.t('announce.copied'));
      return true;
    } catch {
      this.announce(this.i18n.t('announce.shareSeed', { seed }));
      return false;
    }
  }

  private saveCurrent(): void {
    if (!this.puzzle || !this.placement || !this.attemptId) return;
    this.save.savePuzzle(
      this.puzzle.seed,
      this.puzzle.difficulty,
      this.placement.board,
      this.placement.moves,
      this.mode,
      this.playContext,
      {
        attemptId: this.attemptId,
        startedAt: this.attemptStartedAt,
        elapsedMs: this.elapsedTimer.elapsedMs,
      },
    );
  }

  private updateElapsedDisplay(): void {
    if (!this.moveText || !this.elapsedTimer) return;
    const elapsedMs = this.elapsedTimer.elapsedMs;
    const elapsedSecond = Math.floor(elapsedMs / 1_000);
    if (elapsedSecond === this.lastElapsedDisplaySecond) return;
    this.lastElapsedDisplaySecond = elapsedSecond;
    this.updateStatus();
    const persistedBucket = Math.floor(elapsedMs / 5_000);
    if (this.elapsedTimer.running && persistedBucket > this.lastElapsedPersistedBucket) {
      this.lastElapsedPersistedBucket = persistedBucket;
      this.saveCurrent();
    }
  }

  private pauseElapsedTracking(): void {
    if (this.elapsedTimer.pause()) this.saveCurrent();
  }

  private resumeElapsedTracking(): void {
    if (document.hidden || this.modal || this.countdown || this.solved || this.timedOut) return;
    if (this.mode === 'timed' && this.timer?.state !== 'running') return;
    this.elapsedTimer.resume();
  }

  private syncUrl(): void {
    const url = new URL(window.location.href);
    url.searchParams.set('seed', this.puzzle.seed);
    url.searchParams.set('difficulty', difficultySlug(this.puzzle.difficulty));
    if (this.playContext.source === 'campaign' && this.playContext.campaignOrderId) {
      url.searchParams.set('campaignOrder', this.playContext.campaignOrderId);
    } else url.searchParams.delete('campaignOrder');
    if (this.mode === 'timed') url.searchParams.set('mode', 'timed');
    else url.searchParams.delete('mode');
    window.history.replaceState({}, '', url);
  }

  private difficultyLabel(difficulty: Difficulty): string {
    return this.i18n.t(`difficulty.${difficulty}` as TranslationKey);
  }

  private difficultyDescription(difficulty: Difficulty): string {
    return this.i18n.t(`difficulty.${difficulty}.description` as TranslationKey);
  }

  private pieceLabel(pieceId: PieceId, i18n = this.i18n): string {
    const piece =
      this.pieces.get(pieceId)?.piece ?? this.puzzle.pieces.find((item) => item.id === pieceId)!;
    return `${i18n.t(`animal.${piece.animal}` as TranslationKey)} · ${i18n.t(`food.${piece.food}` as TranslationKey)}`;
  }

  private canPlay(): boolean {
    if (this.solved || this.timedOut) return false;
    if (this.mode !== 'timed') return true;
    return this.timer?.state === 'running';
  }

  private switchLanguage(language: PlayerSettings['language']): void {
    this.closeModal();
    this.settings = this.save.updateSettings({ language });
    this.localizedI18n.setLanguage(language);
    document.documentElement.lang = 'en';
    if (this.tutorial?.active) {
      this.showTutorialStep();
    }
    this.openSettings(false);
  }

  private beginTutorial(): void {
    this.closeModal();
    this.tutorialView?.destroy();
    this.tutorial = undefined;
    this.createPuzzle(TUTORIAL_SEED, 'cozy', 'standard');
    this.placement = new PlacementController(emptyBoard(), 0);
    this.updatePiecePositions(false);
    this.updateStatus();
    this.saveCurrent();
    const firstPiece = this.puzzle.solution[0]!;
    const secondPiece = this.puzzle.solution[1]!;
    this.tutorial = new TutorialController(firstPiece, 0, secondPiece, 1);
    this.tutorialView = new TutorialView(
      this,
      this.localizedI18n,
      () => this.continueTutorial(),
      () => this.requestSkipTutorial(),
    );
    this.showTutorialStep();
  }

  private continueTutorial(): void {
    if (!this.tutorial?.handle({ type: 'continue' })) return;
    if (!this.tutorial.active) {
      this.save.completeTutorial();
      this.tutorialView?.destroy();
      this.tutorialView = undefined;
      this.tutorial = undefined;
      if (this.startPendingCampaign()) return;
      this.announce(this.localizedI18n.t('tutorial.completeBody'));
      return;
    }
    this.showTutorialStep();
  }

  private showTutorialStep(): void {
    if (!this.tutorial?.active) return;
    const step = this.tutorial.step;
    let highlight: TutorialHighlight | undefined;
    let pieceLabel = '';
    if (step === 'inventory') highlight = { x: 305, y: 445, width: 470, height: 650 };
    if (step === 'selectFirst') {
      const view = this.pieces.get(this.tutorial.firstPiece)!;
      highlight = { x: view.x, y: view.y, width: 130, height: 130 };
      pieceLabel = this.pieceLabel(this.tutorial.firstPiece, this.localizedI18n);
    }
    if (step === 'placeFirst') {
      const position = this.bento.slotWorldPosition(this.tutorial.firstCell);
      highlight = { x: position.x, y: position.y, width: 155, height: 155 };
    }
    if (step === 'anchor') highlight = { x: 1332, y: 305, width: 330, height: 245 };
    if (step === 'sketch') highlight = { x: 1332, y: 590, width: 350, height: 350 };
    if (step === 'selectSecond' || step === 'reselectSecond') {
      const view = this.pieces.get(this.tutorial.secondPiece)!;
      highlight = { x: view.x, y: view.y, width: 130, height: 130 };
      pieceLabel = this.pieceLabel(this.tutorial.secondPiece, this.localizedI18n);
    }
    if (step === 'placeSecond' || step === 'replaceSecond') {
      const position = this.bento.slotWorldPosition(this.tutorial.secondCell);
      highlight = { x: position.x, y: position.y, width: 155, height: 155 };
    }
    if (step === 'undo' && this.undoButton) {
      highlight = { x: this.undoButton.x, y: this.undoButton.y, width: 68, height: 62 };
    }
    this.tutorialView?.show(step, highlight, pieceLabel, this.tutorial.canContinue);
  }

  private requestSkipTutorial(): void {
    if (!this.tutorial?.active) return;
    this.openModal(
      this.localizedI18n.t('tutorial.skipTitle'),
      this.localizedI18n.t('tutorial.skipBody'),
      [
        {
          label: this.localizedI18n.t('button.keepLearning'),
          callback: () => this.closeModal(),
        },
        {
          label: this.localizedI18n.t('button.skipTutorial'),
          callback: () => this.skipTutorial(),
          primary: true,
        },
      ],
      undefined,
      false,
    );
  }

  private skipTutorial(): void {
    if (!this.tutorial?.active) return;
    const announcement = this.localizedI18n.t('tutorial.skipBody');
    this.closeModal();
    this.tutorial.skip();
    this.save.completeTutorial();
    this.tutorialView?.destroy();
    this.tutorialView = undefined;
    this.tutorial = undefined;
    if (this.startPendingCampaign()) return;
    this.placement = new PlacementController(emptyBoard(), 0);
    this.selectedPiece = null;
    this.pieces.forEach((view) => view.setSelected(false));
    this.updatePiecePositions(false);
    this.updateStatus();
    this.saveCurrent();
    this.announce(announcement);
  }

  private startPendingCampaign(): boolean {
    const context = this.pendingCampaignContext;
    if (!context?.campaignOrderId) return false;
    this.pendingCampaignContext = undefined;
    const order = getCampaignOrder(context.campaignOrderId);
    this.createPuzzle(order.seed, order.difficulty, order.timed ? 'timed' : 'standard', context);
    if (order.timed) this.openCampaignTimedRules();
    else this.announce(this.i18n.t('announce.ready'));
    return true;
  }

  private openTimedChallengeRules(useNewSeed = true): void {
    if (this.solved || this.tutorial?.active) return;
    this.openModal(this.i18n.t('timed.title'), this.i18n.t('timed.rules'), [
      {
        label: this.i18n.t('button.startChallenge'),
        callback: () =>
          this.startTimedChallenge(useNewSeed ? createRandomSeed() : this.puzzle.seed),
        primary: true,
      },
    ]);
  }

  private openCampaignTimedRules(): void {
    if (this.solved || this.tutorial?.active) return;
    this.openModal(this.i18n.t('timed.title'), this.localizedI18n.t('campaign.timedRules'), [
      {
        label: this.localizedI18n.t('button.startChallenge'),
        callback: () => {
          this.closeModal();
          this.startCountdown(() => this.timer?.start());
        },
        primary: true,
      },
    ]);
  }

  private startTimedChallenge(seed: string): void {
    this.closeModal();
    this.tutorialView?.destroy();
    this.tutorial = undefined;
    this.createPuzzle(seed, 'master', 'timed', RUSH_PLAY_CONTEXT);
    this.save.startTimedAttempt();
    this.startCountdown(() => this.timer?.start());
  }

  private retryCampaignTimedOrder(): void {
    this.closeModal();
    this.createPuzzle(this.puzzle.seed, this.puzzle.difficulty, 'timed', this.playContext);
    this.startCountdown(() => this.timer?.start());
  }

  private startCountdown(onComplete: () => void): void {
    this.pauseElapsedTracking();
    this.countdown?.destroy(true);
    const overlay = this.add.container(0, 0).setDepth(5000);
    const shade = this.add.rectangle(800, 450, 1600, 900, COLORS.walnut, 0.28).setInteractive();
    const bubble = this.add.graphics();
    bubble.fillStyle(COLORS.milk, 0.98);
    bubble.fillCircle(800, 450, 112);
    bubble.lineStyle(7, COLORS.blush, 0.9);
    bubble.strokeCircle(800, 450, 105);
    const countText = this.add
      .text(800, 450, '3', {
        fontFamily: FONT_DISPLAY,
        fontSize: '92px',
        fontStyle: 'bold',
        color: '#d97f79',
      })
      .setOrigin(0.5);
    overlay.add([shade, bubble, countText]);
    this.countdown = overlay;
    let count = 3;
    const pulse = (): void => {
      countText.setScale(1.18);
      this.tweens.add({
        targets: countText,
        scaleX: 1,
        scaleY: 1,
        duration: 520,
        ease: 'Sine.easeOut',
      });
    };
    pulse();
    const countdownEvent = this.time.addEvent({
      delay: 700,
      repeat: 2,
      callback: () => {
        if (!overlay.active) {
          countdownEvent.remove();
          return;
        }
        count -= 1;
        if (count > 0) {
          countText.setText(String(count));
          pulse();
          return;
        }
        overlay.destroy(true);
        this.countdown = undefined;
        onComplete();
        this.resumeElapsedTracking();
      },
    });
  }

  private updateTimerDisplay(): void {
    if (!this.timerText || !this.timer) return;
    this.timerText.setText(
      this.i18n.t('timed.label', { time: formatChallengeTime(this.timer.remainingMs) }),
    );
    this.timerText.setColor(this.timer.urgent ? '#c94f61' : '#74594f');
    if (this.timer.urgent && !this.settings.reducedMotion) {
      this.timerText.setScale(1 + Math.sin(this.time.now / 150) * 0.025);
    } else this.timerText.setScale(1);
  }

  private handleTimedOut(): void {
    if (this.timedOut || this.solved) return;
    this.timedOut = true;
    this.pauseElapsedTracking();
    this.audio.play('board_incorrect');
    const actions =
      this.playContext.source === 'campaign'
        ? [
            {
              label: this.localizedI18n.t('button.retry'),
              callback: () => this.retryCampaignTimedOrder(),
              primary: true,
            },
          ]
        : [
            {
              label: this.i18n.t('button.retry'),
              callback: () => this.startTimedChallenge(this.puzzle.seed),
            },
            {
              label: this.i18n.t('button.newChallenge'),
              callback: () => this.startTimedChallenge(createRandomSeed()),
              primary: true,
            },
          ];
    this.openModal(
      this.i18n.t('timed.timeoutTitle'),
      this.playContext.source === 'campaign'
        ? this.localizedI18n.t('campaign.timeoutBody')
        : this.i18n.t('timed.timeoutBody'),
      actions,
      undefined,
      false,
    );
  }

  private handleVisibilityChange(): void {
    if (document.hidden) {
      this.pauseElapsedTracking();
      if (this.mode === 'timed' && this.timer && !this.timedOut && !this.solved) {
        this.timer.pause();
      }
      return;
    }
    if (this.solved || this.timedOut || this.modal || this.countdown) return;
    if (this.mode === 'timed' && this.timer?.state === 'paused') {
      this.startCountdown(() => this.timer?.resume());
      return;
    }
    this.resumeElapsedTracking();
  }

  private announce(message: string): void {
    const status = document.getElementById('a11y-status');
    if (status) status.textContent = message;
  }
}
