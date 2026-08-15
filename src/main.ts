import Phaser from 'phaser';
import { createGameConfig } from './game/config';
import './styles.css';

const game = new Phaser.Game(createGameConfig());
game.canvas.setAttribute('aria-label', 'Bentoku');

declare global {
  interface Window {
    __BENTOKU_GAME__: Phaser.Game;
  }
}

window.__BENTOKU_GAME__ = game;
