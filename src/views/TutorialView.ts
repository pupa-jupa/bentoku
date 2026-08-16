import Phaser from 'phaser';
import { COLORS, FONT_BODY, FONT_DISPLAY } from '../game/constants';
import type { I18nService } from '../i18n/I18nService';
import type { TranslationKey } from '../i18n/translations';
import type { TutorialStep } from '../gameplay/TutorialController';

export interface TutorialHighlight {
  x: number;
  y: number;
  width: number;
  height: number;
}

const copyKeys: Record<TutorialStep, { title: TranslationKey; body: TranslationKey }> = {
  welcome: { title: 'tutorial.welcomeTitle', body: 'tutorial.welcomeBody' },
  inventory: { title: 'tutorial.inventoryTitle', body: 'tutorial.inventoryBody' },
  selectFirst: { title: 'tutorial.selectFirstTitle', body: 'tutorial.selectFirstBody' },
  placeFirst: { title: 'tutorial.placeFirstTitle', body: 'tutorial.placeFirstBody' },
  anchor: { title: 'tutorial.anchorTitle', body: 'tutorial.anchorBody' },
  sketch: { title: 'tutorial.sketchTitle', body: 'tutorial.sketchBody' },
  selectSecond: { title: 'tutorial.selectSecondTitle', body: 'tutorial.selectSecondBody' },
  placeSecond: { title: 'tutorial.placeSecondTitle', body: 'tutorial.placeSecondBody' },
  undo: { title: 'tutorial.undoTitle', body: 'tutorial.undoBody' },
  reselectSecond: { title: 'tutorial.replaceTitle', body: 'tutorial.replaceBody' },
  replaceSecond: { title: 'tutorial.replaceTitle', body: 'tutorial.replaceBody' },
  complete: { title: 'tutorial.completeTitle', body: 'tutorial.completeBody' },
};

export class TutorialView {
  private container?: Phaser.GameObjects.Container;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly i18n: I18nService,
    private readonly onContinue: () => void,
    private readonly onSkip: () => void,
  ) {}

  show(
    step: TutorialStep,
    highlight: TutorialHighlight | undefined,
    pieceLabel = '',
    showContinue = false,
  ): void {
    this.destroy();
    const container = this.scene.add.container(0, 0).setDepth(4200);
    const shade = this.scene.add.rectangle(800, 450, 1600, 900, COLORS.walnut, 0.24);
    container.add(shade);

    if (highlight) {
      const focus = this.scene.add.graphics();
      focus.fillStyle(COLORS.milk, 0.18);
      focus.fillRoundedRect(
        highlight.x - highlight.width / 2,
        highlight.y - highlight.height / 2,
        highlight.width,
        highlight.height,
        26,
      );
      focus.lineStyle(7, COLORS.focus, 1);
      focus.strokeRoundedRect(
        highlight.x - highlight.width / 2,
        highlight.y - highlight.height / 2,
        highlight.width,
        highlight.height,
        26,
      );
      focus.lineStyle(2, COLORS.milk, 0.95);
      focus.strokeRoundedRect(
        highlight.x - highlight.width / 2 - 7,
        highlight.y - highlight.height / 2 - 7,
        highlight.width + 14,
        highlight.height + 14,
        30,
      );
      container.add(focus);
    }

    const cardPosition = this.cardPosition(step, highlight);
    const cardWidth = 520;
    const cardHeight = showContinue ? 226 : 188;
    const card = this.scene.add.graphics();
    card.fillStyle(COLORS.shadow, 0.22);
    card.fillRoundedRect(
      cardPosition.x - cardWidth / 2 + 8,
      cardPosition.y - cardHeight / 2 + 10,
      cardWidth,
      cardHeight,
      32,
    );
    card.fillStyle(COLORS.milk, 1);
    card.fillRoundedRect(
      cardPosition.x - cardWidth / 2,
      cardPosition.y - cardHeight / 2,
      cardWidth,
      cardHeight,
      32,
    );
    card.lineStyle(4, COLORS.blush, 0.8);
    card.strokeRoundedRect(
      cardPosition.x - cardWidth / 2 + 6,
      cardPosition.y - cardHeight / 2 + 6,
      cardWidth - 12,
      cardHeight - 12,
      27,
    );
    container.add(card);

    if (highlight) {
      const arrow = this.scene.add.graphics();
      const fromX =
        cardPosition.x + (highlight.x < cardPosition.x ? -cardWidth / 2 : cardWidth / 2);
      const fromY = cardPosition.y;
      arrow.lineStyle(5, COLORS.focus, 0.95);
      arrow.lineBetween(fromX, fromY, highlight.x, highlight.y);
      arrow.fillStyle(COLORS.focus, 1);
      arrow.fillCircle(highlight.x, highlight.y, 9);
      container.add(arrow);
    }

    const keys = copyKeys[step];
    const title = this.scene.add
      .text(cardPosition.x, cardPosition.y - cardHeight / 2 + 42, this.i18n.t(keys.title), {
        fontFamily: FONT_DISPLAY,
        fontSize: '27px',
        fontStyle: 'bold',
        color: '#684a42',
        align: 'center',
      })
      .setOrigin(0.5);
    const body = this.scene.add
      .text(
        cardPosition.x,
        cardPosition.y - cardHeight / 2 + 104,
        this.i18n.t(keys.body, { piece: pieceLabel }),
        {
          fontFamily: FONT_BODY,
          fontSize: '18px',
          color: '#745d57',
          align: 'center',
          wordWrap: { width: 446 },
          lineSpacing: 5,
        },
      )
      .setOrigin(0.5);
    container.add([title, body]);

    const skip = this.scene.add
      .text(
        cardPosition.x + cardWidth / 2 - 24,
        cardPosition.y - cardHeight / 2 + 22,
        this.i18n.t('button.skipTutorial'),
        {
          fontFamily: FONT_BODY,
          fontSize: '15px',
          fontStyle: 'bold',
          color: '#a06f78',
        },
      )
      .setOrigin(1, 0.5)
      .setInteractive({ useHandCursor: true });
    skip.on('pointerdown', this.onSkip);
    container.add(skip);

    if (showContinue) {
      const button = this.scene.add.container(cardPosition.x, cardPosition.y + cardHeight / 2 - 42);
      const background = this.scene.add.graphics();
      background.fillStyle(COLORS.coral, 1);
      background.fillRoundedRect(-112, -23, 224, 46, 22);
      const label = this.scene.add
        .text(
          0,
          0,
          step === 'welcome' ? this.i18n.t('button.takeTutorial') : this.i18n.t('button.continue'),
          {
            fontFamily: FONT_BODY,
            fontSize: '17px',
            fontStyle: 'bold',
            color: '#fffaf3',
          },
        )
        .setOrigin(0.5);
      button.add([background, label]);
      button.setSize(224, 46).setInteractive({ useHandCursor: true });
      button.on('pointerdown', this.onContinue);
      container.add(button);
    }

    container.setAlpha(0);
    this.scene.tweens.add({ targets: container, alpha: 1, duration: 160 });
    this.container = container;
  }

  destroy(): void {
    this.container?.destroy(true);
    this.container = undefined;
  }

  private cardPosition(
    step: TutorialStep,
    highlight: TutorialHighlight | undefined,
  ): { x: number; y: number } {
    if (!highlight || step === 'welcome' || step === 'complete') return { x: 800, y: 450 };
    if (highlight.x < 560) return { x: 820, y: 470 };
    if (highlight.x > 1110) return { x: 820, y: 650 };
    if (highlight.y < 150) return { x: 800, y: 330 };
    return { x: 1265, y: 185 };
  }
}
