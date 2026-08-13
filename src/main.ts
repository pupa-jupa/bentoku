import Phaser from 'phaser';
import { createGameConfig } from './game/config';
import './styles.css';

const game = new Phaser.Game(createGameConfig());
game.canvas.setAttribute('tabindex', '0');
game.canvas.setAttribute('aria-label', 'Bentoku cozy bento deduction puzzle');
game.canvas.addEventListener('pointerdown', () => game.canvas.focus());

declare global {
  interface Window {
    __BENTOKU_GAME__: Phaser.Game;
  }
}

window.__BENTOKU_GAME__ = game;
