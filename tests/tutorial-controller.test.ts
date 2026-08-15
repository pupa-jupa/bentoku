import { describe, expect, it } from 'vitest';
import { TutorialController } from '../src/gameplay/TutorialController';

describe('TutorialController', () => {
  it('gates every interactive step until the requested action succeeds', () => {
    const tutorial = new TutorialController('cat_egg', 0, 'bear_rice', 1);
    expect(tutorial.step).toBe('welcome');
    expect(tutorial.handle({ type: 'selectPiece', pieceId: 'cat_egg' })).toBe(false);
    expect(tutorial.handle({ type: 'continue' })).toBe(true);
    expect(tutorial.step).toBe('inventory');
    expect(tutorial.handle({ type: 'continue' })).toBe(true);
    expect(tutorial.step).toBe('selectFirst');
    expect(tutorial.handle({ type: 'selectPiece', pieceId: 'pig_egg' })).toBe(false);
    expect(tutorial.handle({ type: 'selectPiece', pieceId: 'cat_egg' })).toBe(true);
    expect(tutorial.step).toBe('placeFirst');
    expect(tutorial.handle({ type: 'placePiece', pieceId: 'cat_egg', cell: 2 })).toBe(false);
    expect(tutorial.handle({ type: 'placePiece', pieceId: 'cat_egg', cell: 0 })).toBe(true);
    expect(tutorial.step).toBe('anchor');
  });

  it('requires undo, reselection, and replacement before completion', () => {
    const tutorial = new TutorialController('cat_egg', 0, 'bear_rice', 1);
    const actions = [
      { type: 'continue' as const },
      { type: 'continue' as const },
      { type: 'selectPiece' as const, pieceId: 'cat_egg' as const },
      { type: 'placePiece' as const, pieceId: 'cat_egg' as const, cell: 0 },
      { type: 'continue' as const },
      { type: 'continue' as const },
      { type: 'selectPiece' as const, pieceId: 'bear_rice' as const },
      { type: 'placePiece' as const, pieceId: 'bear_rice' as const, cell: 1 },
      { type: 'undo' as const },
      { type: 'selectPiece' as const, pieceId: 'bear_rice' as const },
      { type: 'placePiece' as const, pieceId: 'bear_rice' as const, cell: 1 },
      { type: 'continue' as const },
    ];
    actions.forEach((action) => expect(tutorial.handle(action)).toBe(true));
    expect(tutorial.active).toBe(false);
  });
});
