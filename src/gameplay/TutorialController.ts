import type { PieceId } from '../puzzle/types';

export const TUTORIAL_SEED = 'BENTO-TUTO-RIAL';

export const TUTORIAL_STEPS = [
  'welcome',
  'inventory',
  'selectFirst',
  'placeFirst',
  'anchor',
  'sketch',
  'selectSecond',
  'placeSecond',
  'undo',
  'reselectSecond',
  'replaceSecond',
  'complete',
] as const;

export type TutorialStep = (typeof TUTORIAL_STEPS)[number];
export type TutorialAction =
  | { type: 'continue' }
  | { type: 'selectPiece'; pieceId: PieceId }
  | { type: 'placePiece'; pieceId: PieceId; cell: number }
  | { type: 'undo' };

const INFORMATION_STEPS = new Set<TutorialStep>([
  'welcome',
  'inventory',
  'anchor',
  'sketch',
  'complete',
]);

export class TutorialController {
  private index = 0;
  private activeValue = true;

  constructor(
    readonly firstPiece: PieceId,
    readonly firstCell: number,
    readonly secondPiece: PieceId,
    readonly secondCell: number,
  ) {}

  get active(): boolean {
    return this.activeValue;
  }

  get step(): TutorialStep {
    return TUTORIAL_STEPS[Math.min(this.index, TUTORIAL_STEPS.length - 1)]!;
  }

  get canContinue(): boolean {
    return this.activeValue && INFORMATION_STEPS.has(this.step);
  }

  allowsPiece(pieceId: PieceId): boolean {
    if (!this.activeValue) return true;
    if (this.step === 'selectFirst') return pieceId === this.firstPiece;
    if (this.step === 'selectSecond' || this.step === 'reselectSecond') {
      return pieceId === this.secondPiece;
    }
    return false;
  }

  allowsCell(cell: number): boolean {
    if (!this.activeValue) return true;
    if (this.step === 'placeFirst') return cell === this.firstCell;
    if (this.step === 'placeSecond' || this.step === 'replaceSecond') {
      return cell === this.secondCell;
    }
    return false;
  }

  get allowsUndo(): boolean {
    return !this.activeValue || this.step === 'undo';
  }

  handle(action: TutorialAction): boolean {
    if (!this.activeValue) return false;
    const matches =
      (action.type === 'continue' && this.canContinue) ||
      (action.type === 'selectPiece' && this.allowsPiece(action.pieceId)) ||
      (action.type === 'placePiece' &&
        this.allowsCell(action.cell) &&
        ((this.step === 'placeFirst' && action.pieceId === this.firstPiece) ||
          ((this.step === 'placeSecond' || this.step === 'replaceSecond') &&
            action.pieceId === this.secondPiece))) ||
      (action.type === 'undo' && this.step === 'undo');
    if (!matches) return false;

    if (this.step === 'complete') {
      this.activeValue = false;
      return true;
    }
    this.index += 1;
    return true;
  }
}
