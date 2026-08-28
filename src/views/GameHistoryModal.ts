import Phaser from 'phaser';
import { COLORS, FONT_BODY, FONT_DISPLAY } from '../game/constants';
import { formatElapsedTime } from '../gameplay/ElapsedTimer';
import type { I18nService } from '../i18n/I18nService';
import type { TranslationKey } from '../i18n/translations';
import type { GameHistoryEntry } from '../puzzle/types';

export const HISTORY_PAGE_SIZE = 7;

export type HistoryGameRow = GameHistoryEntry & { current: boolean };

interface HistoryModalCallbacks {
  close: () => void;
  copy: (row: HistoryGameRow) => Promise<boolean>;
  replay: (row: HistoryGameRow) => void;
}

const COLUMN_X = {
  date: -505,
  seed: -286,
  difficulty: -76,
  duration: 120,
  moves: 280,
  replay: 445,
} as const;

export class GameHistoryModal extends Phaser.GameObjects.Container {
  private readonly rowsLayer: Phaser.GameObjects.Container;
  private readonly pageText: Phaser.GameObjects.Text;
  private readonly previousButton: Phaser.GameObjects.Container;
  private readonly nextButton: Phaser.GameObjects.Container;
  private rows: readonly HistoryGameRow[] = [];
  private page = 0;

  constructor(
    scene: Phaser.Scene,
    private readonly i18n: I18nService,
    private readonly callbacks: HistoryModalCallbacks,
  ) {
    super(scene, 800, 450);
    scene.add.existing(this);
    this.setDepth(3000);

    const shade = scene.add.rectangle(0, 0, 1600, 900, COLORS.walnut, 0.3).setInteractive();
    const card = scene.add.graphics();
    card.fillStyle(COLORS.shadow, 0.18);
    card.fillRoundedRect(-574, -328, 1164, 682, 38);
    card.fillStyle(COLORS.milk, 1);
    card.fillRoundedRect(-582, -340, 1164, 682, 38);
    card.lineStyle(4, COLORS.blush, 0.42);
    card.strokeRoundedRect(-574, -332, 1148, 666, 32);

    const title = scene.add
      .text(0, -286, i18n.t('history.title'), {
        fontFamily: FONT_DISPLAY,
        fontSize: '31px',
        fontStyle: 'bold',
        color: '#684a42',
      })
      .setOrigin(0.5);
    const subtitle = scene.add
      .text(0, -247, i18n.t('history.subtitle'), {
        fontFamily: FONT_BODY,
        fontSize: '16px',
        color: '#846961',
      })
      .setOrigin(0.5);
    const copyHint = scene.add
      .text(-510, 238, i18n.t('history.copyHint'), {
        fontFamily: FONT_BODY,
        fontSize: '13px',
        color: '#9a7970',
      })
      .setOrigin(0, 0.5);

    const close = this.makeSymbolButton(534, -298, '×', callbacks.close, 42, 1, false);
    this.add([shade, card, title, subtitle, copyHint, close]);

    this.addHeader(i18n.t('history.date'), COLUMN_X.date, 178, 'left');
    this.addHeader(i18n.t('history.seed'), COLUMN_X.seed, 176, 'left');
    this.addHeader(i18n.t('history.difficulty'), COLUMN_X.difficulty, 150, 'left');
    this.addHeader(i18n.t('history.duration'), COLUMN_X.duration, 106, 'center');
    this.addHeader(i18n.t('history.moves'), COLUMN_X.moves, 82, 'center');
    this.addHeader(i18n.t('history.replay'), COLUMN_X.replay, 86, 'center');

    const divider = scene.add.graphics();
    divider.lineStyle(2, COLORS.ink, 0.14);
    divider.lineBetween(-520, -194, 520, -194);
    divider.lineBetween(-520, 215, 520, 215);
    this.add(divider);

    this.rowsLayer = scene.add.container(0, 0);
    this.add(this.rowsLayer);

    this.previousButton = this.makeSymbolButton(-76, 286, '‹', () => this.changePage(-1), 42, 0);
    this.nextButton = this.makeSymbolButton(76, 286, '›', () => this.changePage(1), 42, 0);
    this.pageText = scene.add
      .text(0, 286, '', {
        fontFamily: FONT_BODY,
        fontSize: '15px',
        fontStyle: 'bold',
        color: '#785d55',
      })
      .setOrigin(0.5);
    this.add([this.previousButton, this.nextButton, this.pageText]);

    this.setAlpha(0).setScale(0.97);
    scene.tweens.add({ targets: this, alpha: 1, scale: 1, duration: 180, ease: 'Sine.easeOut' });
  }

  refresh(rows: readonly HistoryGameRow[]): void {
    this.rows = rows;
    const pageCount = this.pageCount;
    this.page = Phaser.Math.Clamp(this.page, 0, pageCount - 1);
    this.renderRows();
  }

  private get pageCount(): number {
    return Math.max(1, Math.ceil(this.rows.length / HISTORY_PAGE_SIZE));
  }

  private changePage(delta: number): void {
    const nextPage = Phaser.Math.Clamp(this.page + delta, 0, this.pageCount - 1);
    if (nextPage === this.page) return;
    this.page = nextPage;
    this.renderRows();
  }

  private renderRows(): void {
    this.rowsLayer.removeAll(true);
    const start = this.page * HISTORY_PAGE_SIZE;
    const visibleRows = this.rows.slice(start, start + HISTORY_PAGE_SIZE);
    visibleRows.forEach((row, index) => this.renderRow(row, -164 + index * 57));

    this.pageText.setText(
      this.i18n.t('history.page', { page: this.page + 1, total: this.pageCount }),
    );
    this.setPagerEnabled(this.previousButton, this.page > 0);
    this.setPagerEnabled(this.nextButton, this.page < this.pageCount - 1);
  }

  private renderRow(row: HistoryGameRow, y: number): void {
    const background = this.scene.add.graphics();
    background.fillStyle(row.current ? COLORS.peach : COLORS.sage, row.current ? 0.26 : 0.1);
    background.fillRoundedRect(-526, y - 25, 1052, 50, 14);
    this.rowsLayer.add(background);

    const date = this.scene.add
      .text(COLUMN_X.date, y + (row.current ? -7 : 0), this.formatDate(row.startedAt), {
        fontFamily: FONT_BODY,
        fontSize: '14px',
        color: '#70564f',
      })
      .setOrigin(0, 0.5);
    this.rowsLayer.add(date);
    if (row.current) {
      const current = this.scene.add
        .text(COLUMN_X.date, y + 12, this.i18n.t('history.current'), {
          fontFamily: FONT_BODY,
          fontSize: '10px',
          fontStyle: 'bold',
          color: '#c06e68',
          letterSpacing: 0.6,
        })
        .setOrigin(0, 0.5);
      this.rowsLayer.add(current);
    }

    const seed = this.scene.add
      .text(COLUMN_X.seed, y, row.seed, {
        fontFamily: FONT_BODY,
        fontSize: '14px',
        fontStyle: 'bold',
        color: '#c36f69',
      })
      .setOrigin(0, 0.5)
      .setInteractive({ useHandCursor: true });
    seed.on('pointerover', () => seed.setColor('#a85155'));
    seed.on('pointerout', () => seed.setColor('#c36f69'));
    seed.on('pointerdown', async () => {
      const copied = await this.callbacks.copy(row);
      if (!copied || !seed.active) return;
      const original = row.seed;
      seed.setText(this.i18n.t('history.copied'));
      this.scene.time.delayedCall(1_200, () => {
        if (seed.active) seed.setText(original);
      });
    });
    this.rowsLayer.add(seed);

    this.addRowText(
      this.i18n.t(`difficulty.${row.difficulty}` as TranslationKey),
      COLUMN_X.difficulty,
      y,
      150,
      'left',
    );
    this.addRowText(formatElapsedTime(row.durationMs), COLUMN_X.duration, y, 106, 'center');
    this.addRowText(String(row.moves), COLUMN_X.moves, y, 82, 'center');
    this.rowsLayer.add(
      this.makeSymbolButton(
        COLUMN_X.replay,
        y,
        '↻',
        () => this.callbacks.replay(row),
        38,
        1,
        false,
      ),
    );
  }

  private addHeader(label: string, x: number, width: number, align: 'left' | 'center'): void {
    const header = this.scene.add
      .text(x, -212, label, {
        fontFamily: FONT_BODY,
        fontSize: '12px',
        fontStyle: 'bold',
        color: '#93746a',
        align,
        letterSpacing: 0.8,
      })
      .setOrigin(align === 'left' ? 0 : 0.5, 0.5)
      .setFixedSize(width, 22);
    this.add(header);
  }

  private addRowText(
    value: string,
    x: number,
    y: number,
    width: number,
    align: 'left' | 'center',
  ): void {
    const text = this.scene.add
      .text(x, y, value, {
        fontFamily: FONT_BODY,
        fontSize: '14px',
        color: '#70564f',
        align,
      })
      .setOrigin(align === 'left' ? 0 : 0.5, 0.5)
      .setFixedSize(width, 22);
    this.rowsLayer.add(text);
  }

  private makeSymbolButton(
    x: number,
    y: number,
    symbol: string,
    callback: () => void,
    size: number,
    opticalY: number,
    addToModal = true,
  ): Phaser.GameObjects.Container {
    const button = this.scene.add.container(x, y);
    const background = this.scene.add.graphics();
    background.fillStyle(COLORS.milk, 0.96);
    background.fillCircle(0, 0, size / 2);
    background.lineStyle(2, COLORS.blush, 0.38);
    background.strokeCircle(0, 0, size / 2 - 1);
    const text = this.scene.add
      .text(0, opticalY, symbol, {
        fontFamily: 'Arial, sans-serif',
        fontSize: `${Math.round(size * 0.58)}px`,
        fontStyle: 'bold',
        color: '#765950',
      })
      .setOrigin(0.5);
    button.add([background, text]);
    button.setSize(size, size).setInteractive({ useHandCursor: true });
    button.on('pointerdown', callback);
    button.on('pointerover', () => button.setScale(1.06));
    button.on('pointerout', () => button.setScale(1));
    if (addToModal) this.add(button);
    return button;
  }

  private setPagerEnabled(button: Phaser.GameObjects.Container, enabled: boolean): void {
    button.setAlpha(enabled ? 1 : 0.35);
    if (enabled) button.setInteractive({ useHandCursor: true });
    else button.disableInteractive();
  }

  private formatDate(timestamp: number): string {
    return new Intl.DateTimeFormat(this.i18n.language === 'ru' ? 'ru-RU' : 'en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(timestamp));
  }
}
