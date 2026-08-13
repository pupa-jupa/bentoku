import { describe, expect, it } from 'vitest';
import { PlacementController } from '../src/gameplay/PlacementController';

describe('placement controller', () => {
  it('places, swaps, returns and undoes pieces', () => {
    const controller = new PlacementController();
    controller.place('cat_egg', 0);
    controller.place('bear_rice', 1);
    controller.place('cat_egg', 1);
    expect(controller.board[0]).toBe('bear_rice');
    expect(controller.board[1]).toBe('cat_egg');
    expect(controller.moves).toBe(3);

    expect(controller.returnToTray('bear_rice')).toBe(true);
    expect(controller.board[0]).toBeNull();
    expect(controller.restorePrevious()).toBe(true);
    expect(controller.board[0]).toBe('bear_rice');
  });

  it('moves a tray piece into an occupied cell without duplicating pieces', () => {
    const controller = new PlacementController();
    controller.place('cat_egg', 0);
    controller.place('pig_rice', 0);
    expect(controller.board[0]).toBe('pig_rice');
    expect(controller.board).not.toContain('cat_egg');
  });
});
