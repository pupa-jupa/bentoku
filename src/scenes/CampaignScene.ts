import Phaser from 'phaser';
import {
  CAMPAIGN_CHAPTERS,
  getCampaignOrder,
  isCampaignOrderUnlocked,
  type CampaignChapter,
  type CampaignOrder,
  type CampaignOrderId,
} from '../campaign/campaignData';
import { FONT_BODY } from '../game/constants';
import { campaignPlayContext } from '../game/playContext';
import { I18nService } from '../i18n/I18nService';
import type { TranslationKey } from '../i18n/translations';
import { AudioService } from '../services/AudioService';
import { musicAssets } from '../services/AssetRegistry';
import { MusicService } from '../services/MusicService';
import { SaveService } from '../services/SaveService';

export class CampaignScene extends Phaser.Scene {
  private save!: SaveService;
  private i18n!: I18nService;
  private english!: I18nService;
  private audio!: AudioService;
  private music!: MusicService;
  private selectedChapter = 1;
  private selectedOrderId!: CampaignOrderId;

  constructor() {
    super('CampaignScene');
  }

  create(): void {
    this.save = new SaveService();
    const settings = this.save.settings;
    this.i18n = new I18nService(settings.language);
    this.english = new I18nService('en');
    this.audio = new AudioService(this, settings);
    this.music = new MusicService(this, musicAssets, settings.musicVolume);
    this.music.start();
    const current = getCampaignOrder(this.save.selectedCampaignOrderId);
    this.selectedChapter = current.chapter;
    this.selectedOrderId = current.id;
    this.renderBook();
  }

  private renderBook(): void {
    this.children.removeAll(true);
    const completed = new Set(this.save.completedCampaignOrderIds);
    const selectedChapter = CAMPAIGN_CHAPTERS[this.selectedChapter - 1]!;
    const selectedOrder = getCampaignOrder(this.selectedOrderId);

    this.add.image(800, 450, 'menu_cafe_background').setDisplaySize(1600, 900);
    this.add.rectangle(800, 450, 1600, 900, 0x6b493f, 0.34);
    this.add
      .text(800, 58, this.i18n.t('campaign.title'), {
        fontFamily: 'Georgia, Times New Roman, serif',
        fontSize: '42px',
        fontStyle: 'bold',
        color: '#fff8ef',
        stroke: '#704a42',
        strokeThickness: 4,
      })
      .setOrigin(0.5);
    this.add
      .text(800, 105, this.i18n.t('campaign.subtitle'), {
        fontFamily: FONT_BODY,
        fontSize: '19px',
        color: '#fff0e7',
        letterSpacing: 1,
      })
      .setOrigin(0.5);

    const book = this.add.graphics();
    book.fillStyle(0x5a3e38, 0.2);
    book.fillRoundedRect(208, 145, 1200, 690, 44);
    book.fillStyle(0xfff8ed, 0.99);
    book.fillRoundedRect(190, 130, 1210, 690, 44);
    book.lineStyle(6, 0xe9adb5, 0.78);
    book.strokeRoundedRect(202, 142, 1186, 666, 36);
    book.lineStyle(2, 0xf3d5c7, 1);
    book.lineBetween(790, 166, 790, 782);
    book.lineStyle(8, 0x9f7166, 0.12);
    book.lineBetween(800, 164, 800, 786);

    CAMPAIGN_CHAPTERS.forEach((chapter, index) =>
      this.createChapterTab(chapter, 490, 220 + index * 112, completed),
    );
    this.renderSelectedChapter(selectedChapter, selectedOrder, completed);

    this.createRasterButton(150, 72, 280, this.i18n.t('campaign.backMenu'), () =>
      this.scene.start('MenuScene'),
    );
    this.add
      .text(1365, 72, this.i18n.t('campaign.progress', { completed: completed.size }), {
        fontFamily: FONT_BODY,
        fontSize: '18px',
        fontStyle: 'bold',
        color: '#fff8ef',
        backgroundColor: '#7b5148aa',
        padding: { x: 18, y: 9 },
      })
      .setOrigin(1, 0.5);
  }

  private createChapterTab(
    chapter: CampaignChapter,
    x: number,
    y: number,
    completed: ReadonlySet<CampaignOrderId>,
  ): void {
    const unlocked = isCampaignOrderUnlocked(chapter.orders[0]!.id, completed);
    const selected = chapter.number === this.selectedChapter;
    const container = this.add
      .container(x, y)
      .setName(`campaign-chapter-${chapter.number}`)
      .setAlpha(unlocked ? 1 : 0.48);
    const panel = this.add.graphics();
    panel.fillStyle(selected ? 0xf3c5c8 : 0xf8e9dc, 1);
    panel.fillRoundedRect(-245, -42, 490, 84, 24);
    panel.lineStyle(3, selected ? 0xd68188 : 0xd6ac9f, selected ? 0.95 : 0.5);
    panel.strokeRoundedRect(-245, -42, 490, 84, 24);
    const title = this.add
      .text(-212, -12, `${chapter.number}. ${this.i18n.t(chapter.titleKey as TranslationKey)}`, {
        fontFamily: 'Georgia, Times New Roman, serif',
        fontSize: '23px',
        fontStyle: 'bold',
        color: '#684740',
      })
      .setOrigin(0, 0.5);
    const difficulty = this.add
      .text(-212, 21, this.english.t(`difficulty.${chapter.difficulty}` as TranslationKey), {
        fontFamily: FONT_BODY,
        fontSize: '16px',
        color: '#967269',
      })
      .setOrigin(0, 0.5);
    const stamps = chapter.orders.filter((order) => completed.has(order.id)).length;
    const progress = this.add
      .text(210, 0, unlocked ? `${stamps} / 6` : '×', {
        fontFamily: FONT_BODY,
        fontSize: '19px',
        fontStyle: 'bold',
        color: selected ? '#9f555f' : '#8d6b63',
      })
      .setOrigin(1, 0.5);
    container.add([panel, title, difficulty, progress]);
    if (unlocked) {
      container.setSize(490, 84).setInteractive({ useHandCursor: true });
      container.on('pointerdown', () => {
        this.audio.play('ui_tap');
        this.selectChapter(chapter, completed);
      });
      container.on('pointerover', () => container.setScale(1.015));
      container.on('pointerout', () => container.setScale(1));
    }
  }

  private selectChapter(chapter: CampaignChapter, completed: ReadonlySet<CampaignOrderId>): void {
    this.selectedChapter = chapter.number;
    const preferred = chapter.orders.find(
      (order) =>
        order.id === this.save.selectedCampaignOrderId &&
        isCampaignOrderUnlocked(order.id, completed),
    );
    const next = chapter.orders.find(
      (order) => isCampaignOrderUnlocked(order.id, completed) && !completed.has(order.id),
    );
    this.selectedOrderId = (preferred ?? next ?? chapter.orders[chapter.orders.length - 1]!).id;
    this.renderBook();
  }

  private renderSelectedChapter(
    chapter: CampaignChapter,
    selectedOrder: CampaignOrder,
    completed: ReadonlySet<CampaignOrderId>,
  ): void {
    this.add
      .text(1090, 205, this.i18n.t(chapter.titleKey as TranslationKey), {
        fontFamily: 'Georgia, Times New Roman, serif',
        fontSize: '32px',
        fontStyle: 'bold',
        color: '#684740',
      })
      .setOrigin(0.5);
    this.add
      .text(1090, 248, this.i18n.t(chapter.visitorKey as TranslationKey), {
        fontFamily: FONT_BODY,
        fontSize: '18px',
        color: '#997169',
      })
      .setOrigin(0.5);

    chapter.orders.forEach((order, index) => {
      const x = 930 + (index % 3) * 160;
      const y = 365 + Math.floor(index / 3) * 155;
      this.createOrderSeal(order, x, y, completed);
    });

    const selectedCompleted = completed.has(selectedOrder.id);
    const selectedUnlocked = isCampaignOrderUnlocked(selectedOrder.id, completed);
    const hasSavedBoard = this.save.currentPuzzleCampaignOrderId === selectedOrder.id;
    const buttonLabel = selectedCompleted
      ? this.i18n.t('campaign.replay', { order: selectedOrder.order })
      : hasSavedBoard
        ? this.i18n.t('campaign.continue', { order: selectedOrder.order })
        : this.i18n.t('campaign.start', { order: selectedOrder.order });
    if (selectedUnlocked) {
      this.createRasterButton(1090, 705, 510, buttonLabel, () => this.startOrder(selectedOrder));
    }
    this.add
      .text(
        1090,
        584,
        selectedOrder.timed
          ? this.i18n.t('campaign.finalTimed')
          : `${this.english.t(`difficulty.${selectedOrder.difficulty}` as TranslationKey)} · ${this.i18n.t(
              selectedCompleted ? 'campaign.completed' : 'campaign.available',
            )}`,
        {
          fontFamily: FONT_BODY,
          fontSize: '18px',
          fontStyle: 'bold',
          color: selectedOrder.timed ? '#b45565' : '#8a665e',
        },
      )
      .setOrigin(0.5);
  }

  private createOrderSeal(
    order: CampaignOrder,
    x: number,
    y: number,
    completed: ReadonlySet<CampaignOrderId>,
  ): void {
    const isCompleted = completed.has(order.id);
    const unlocked = isCampaignOrderUnlocked(order.id, completed);
    const selected = order.id === this.selectedOrderId;
    const seal = this.add
      .container(x, y)
      .setName(`campaign-order-${order.chapter}-${order.order}`)
      .setAlpha(unlocked ? 1 : 0.38);
    const art = this.add.graphics();
    art.fillStyle(isCompleted ? 0xe6a0a9 : unlocked ? 0xfff3e6 : 0xd8c8bf, 1);
    art.fillCircle(0, 0, 57);
    art.lineStyle(selected ? 7 : 4, selected ? 0xc56573 : 0xd7a8a0, 0.95);
    art.strokeCircle(0, 0, selected ? 64 : 60);
    art.lineStyle(2, 0xffffff, 0.7);
    art.strokeCircle(0, 0, 48);
    const number = this.add
      .text(0, -7, isCompleted ? '✓' : unlocked ? String(order.order) : '×', {
        fontFamily: 'Georgia, Times New Roman, serif',
        fontSize: '31px',
        fontStyle: 'bold',
        color: isCompleted ? '#fffaf3' : '#754f47',
      })
      .setOrigin(0.5);
    const state = this.add
      .text(
        0,
        31,
        this.i18n.t(
          isCompleted ? 'campaign.completed' : unlocked ? 'campaign.available' : 'campaign.locked',
        ),
        {
          fontFamily: FONT_BODY,
          fontSize: '12px',
          fontStyle: 'bold',
          color: isCompleted ? '#fffaf3' : '#816059',
        },
      )
      .setOrigin(0.5);
    seal.add([art, number, state]);
    if (unlocked) {
      seal.setSize(128, 128).setInteractive({ useHandCursor: true });
      seal.on('pointerdown', () => {
        this.audio.play('ui_tap');
        this.selectedOrderId = order.id;
        this.save.selectCampaignOrder(order.id);
        this.renderBook();
      });
      seal.on('pointerover', () => seal.setScale(1.04));
      seal.on('pointerout', () => seal.setScale(1));
    }
  }

  private createRasterButton(
    x: number,
    y: number,
    width: number,
    label: string,
    callback: () => void,
  ): Phaser.GameObjects.Container {
    const container = this.add.container(x, y).setName('campaign-action');
    const fullWidth = (width * 768) / 550;
    const art = this.add.image(0, 0, 'menu_button_normal').setDisplaySize(fullWidth, fullWidth / 3);
    const text = this.add
      .text(0, 0, label, {
        fontFamily: 'Georgia, Times New Roman, serif',
        fontSize: width < 350 ? '17px' : '21px',
        fontStyle: 'bold',
        color: '#684740',
        stroke: '#fff8ef',
        strokeThickness: 1,
      })
      .setOrigin(0.5);
    container.add([art, text]);
    container.setSize(width, width / 3.1).setInteractive({ useHandCursor: true });
    container.on('pointerover', () => {
      art.setTexture('menu_button_hover');
      container.setScale(1.02);
    });
    container.on('pointerout', () => {
      art.setTexture('menu_button_normal');
      container.setScale(1);
    });
    container.on('pointerdown', () => {
      this.audio.play('ui_tap');
      art.setTexture('menu_button_pressed');
      container.setScale(0.985);
      this.time.delayedCall(this.save.settings.reducedMotion ? 1 : 70, callback);
    });
    return container;
  }

  private startOrder(order: CampaignOrder): void {
    this.save.selectCampaignOrder(order.id);
    this.scene.start('PuzzleScene', {
      context: campaignPlayContext(order.id, order.timed, order.durationMs),
    });
  }
}
