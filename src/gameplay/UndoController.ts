import { toBoard, type Board } from '../puzzle/types';

export interface UndoState {
  board: Board;
  moves: number;
}

export class UndoController {
  private readonly history: UndoState[] = [];
  private readonly maxEntries: number;

  constructor(maxEntries = 60) {
    this.maxEntries = maxEntries;
  }

  push(state: UndoState): void {
    this.history.push({ board: toBoard(state.board), moves: state.moves });
    if (this.history.length > this.maxEntries) this.history.shift();
  }

  pop(): UndoState | undefined {
    return this.history.pop();
  }

  clear(): void {
    this.history.length = 0;
  }

  get canUndo(): boolean {
    return this.history.length > 0;
  }
}
