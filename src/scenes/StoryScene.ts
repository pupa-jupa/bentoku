import Phaser from 'phaser';
import {
  getCampaignOrder,
  isCampaignOrderId,
  type CampaignOrderId,
} from '../campaign/campaignData';
import {
  getCampaignStory,
  localizeStoryText,
  storyBackgroundTextureKey,
  storyEventId,
  visitorTextureKey,
  type CampaignStory,
  type CampaignStoryLine,
  type StoryPhase,
  type StorySpeaker,
  type VisitorMood,
} from '../campaign/storyData';
import { FONT_BODY } from '../game/constants';
import { campaignPlayContext } from '../game/playContext';
import { I18nService } from '../i18n/I18nService';
import { AudioService } from '../services/AudioService';
import { SaveService } from '../services/SaveService';

interface StorySceneData {
  orderId?: CampaignOrderId;
  phase?: StoryPhase;
}

export class StoryScene extends Phaser.Scene {
  private save!: SaveService;
  private i18n!: I18nService;
  private audio!: AudioService;
  private story!: CampaignStory;
  private orderId!: CampaignOrderId;
  private phase: StoryPhase = 'intro';
  private step = -1;

  constructor() {
    super('StoryScene');
  }

  init(data?: StorySceneData): void {
    this.orderId = isCampaignOrderId(data?.orderId) ? data.orderId : 'chapter-1-order-1';
    this.phase = data?.phase === 'chapterComplete' ? 'chapterComplete' : 'intro';
    this.step = -1;
  }

  create(): void {
    this.save = new SaveService();
    const settings = this.save.settings;
    this.i18n = new I18nService(settings.language);
    this.audio = new AudioService(this, settings);
    const order = getCampaignOrder(this.orderId);
    this.story = getCampaignStory(order.chapter);
    document.documentElement.lang = settings.language;

    if (this.phase === 'chapterComplete') this.renderChapterComplete();
    else this.renderIntro();
  }

  private renderIntro(): void {
    this.children.removeAll(true);
    this.renderBackdrop();
    this.renderHeader();

    const introEvent = storyEventId(this.story.chapter, 'intro');
    if (this.save.hasViewedCampaignStory(introEvent)) {
      this.createRasterButton(1420, 72, 260, this.i18n.t('story.skipReplay'), 'story-skip', () =>
        this.startPuzzle(),
      );
    }
    this.createRasterButton(155, 72, 250, this.i18n.t('story.backBook'), 'story-back', () =>
      this.scene.start('CampaignScene'),
    );

    if (this.step < 0) this.renderDayCard();
    else this.renderDialogue(this.story.lines[this.step]!);
  }

  private renderBackdrop(): void {
    const key = storyBackgroundTextureKey(this.story.chapter);
    if (this.textures.exists(key)) {
      this.add.image(800, 450, key).setDisplaySize(1600, 900);
    } else {
      this.add.image(800, 450, 'menu_cafe_background').setDisplaySize(1600, 900);
      this.add.rectangle(800, 450, 1600, 900, this.story.visitor.palette[0], 0.12);
    }
    this.add.rectangle(800, 450, 1600, 900, 0x3c2730, 0.18);
    const glow = this.add.graphics();
    glow.fillGradientStyle(0xfff6ea, 0xfff6ea, 0xe6cad4, 0xe6cad4, 0.08, 0.08, 0.24, 0.24);
    glow.fillRect(0, 0, 1600, 900);
  }

  private renderHeader(): void {
    this.add
      .text(800, 50, this.i18n.t('story.orderBook'), {
        fontFamily: 'Georgia, Times New Roman, serif',
        fontSize: '22px',
        fontStyle: 'bold',
        color: '#fff8ef',
        stroke: '#684740',
        strokeThickness: 4,
        letterSpacing: 2,
      })
      .setOrigin(0.5);
    this.add
      .text(
        800,
        86,
        `${this.story.chapter} · ${localizeStoryText(this.story.chapterTitle, this.i18n.language)}`,
        {
          fontFamily: 'Georgia, Times New Roman, serif',
          fontSize: '34px',
          fontStyle: 'bold',
          color: '#fff8ef',
          stroke: '#684740',
          strokeThickness: 5,
        },
      )
      .setOrigin(0.5);
  }

  private renderDayCard(): void {
    const shadow = this.add.graphics();
    shadow.fillStyle(0x4b2f35, 0.25);
    shadow.fillRoundedRect(330, 184, 940, 530, 46);
    const card = this.add.graphics();
    card.fillStyle(0xfff9ee, 0.985);
    card.fillRoundedRect(315, 168, 940, 530, 46);
    card.lineStyle(7, this.story.visitor.palette[1], 0.72);
    card.strokeRoundedRect(330, 183, 910, 500, 36);
    card.lineStyle(2, 0xffffff, 0.88);
    card.strokeRoundedRect(344, 197, 882, 472, 30);

    this.add
      .text(785, 255, localizeStoryText(this.story.dayLabel, this.i18n.language), {
        fontFamily: FONT_BODY,
        fontSize: '19px',
        fontStyle: 'bold',
        color: '#a2666d',
        letterSpacing: 2,
      })
      .setOrigin(0.5);
    this.add
      .text(785, 318, localizeStoryText(this.story.chapterTitle, this.i18n.language), {
        fontFamily: 'Georgia, Times New Roman, serif',
        fontSize: '48px',
        fontStyle: 'bold',
        color: '#684740',
      })
      .setOrigin(0.5);
    this.add
      .text(785, 374, localizeStoryText(this.story.setting, this.i18n.language), {
        fontFamily: FONT_BODY,
        fontSize: '20px',
        color: '#967169',
      })
      .setOrigin(0.5);
    this.add
      .text(785, 470, localizeStoryText(this.story.opening, this.i18n.language), {
        fontFamily: 'Georgia, Times New Roman, serif',
        fontSize: '25px',
        color: '#664943',
        align: 'center',
        lineSpacing: 9,
        wordWrap: { width: 720 },
      })
      .setOrigin(0.5);

    this.renderProgress(-1);
    this.createRasterButton(785, 760, 430, this.i18n.t('story.next'), 'story-next', () =>
      this.advanceIntro(),
    );
  }

  private renderDialogue(line: CampaignStoryLine): void {
    this.renderVisitor(line.mood);
    this.renderCounterEdge();

    const panelShadow = this.add.graphics();
    panelShadow.fillStyle(0x4b3036, 0.27);
    panelShadow.fillRoundedRect(122, 596, 1358, 244, 38);
    const panel = this.add.graphics();
    panel.fillStyle(0xfffaf0, 0.985);
    panel.fillRoundedRect(108, 582, 1358, 244, 38);
    panel.lineStyle(6, this.story.visitor.palette[1], 0.78);
    panel.strokeRoundedRect(120, 594, 1334, 220, 30);
    panel.lineStyle(2, 0xffffff, 0.9);
    panel.strokeRoundedRect(132, 606, 1310, 196, 24);

    const speaker = this.speakerLabel(line.speaker);
    const nameplate = this.add.graphics();
    nameplate.fillStyle(this.speakerColor(line.speaker), 0.98);
    nameplate.fillRoundedRect(164, 548, 330, 70, 24);
    nameplate.lineStyle(3, 0xfff7e9, 0.92);
    nameplate.strokeRoundedRect(173, 557, 312, 52, 18);
    this.add
      .text(329, 582, speaker, {
        fontFamily: 'Georgia, Times New Roman, serif',
        fontSize: '24px',
        fontStyle: 'bold',
        color: '#fffaf2',
      })
      .setOrigin(0.5);

    this.add
      .text(176, 654, localizeStoryText(line.text, this.i18n.language), {
        fontFamily: 'Georgia, Times New Roman, serif',
        fontSize: '27px',
        color: '#60443f',
        lineSpacing: 8,
        wordWrap: { width: 980 },
      })
      .setOrigin(0, 0.5);

    const lastLine = this.step === this.story.lines.length - 1;
    this.createRasterButton(
      1285,
      746,
      300,
      this.i18n.t(lastLine ? 'story.beginOrder' : 'story.next'),
      'story-next',
      () => this.advanceIntro(),
    );
    this.renderProgress(this.step);
  }

  private renderVisitor(mood: VisitorMood): void {
    const key = visitorTextureKey(this.story.visitor.id, mood);
    if (this.textures.exists(key)) {
      this.add
        .image(1020, 370, key)
        .setName('story-visitor')
        .setDisplaySize(520, 780)
        .setOrigin(0.5, 0.42);
      return;
    }

    const [primary, accent, light] = this.story.visitor.palette;
    const silhouette = this.add.container(1030, 350).setName('story-visitor-placeholder');
    const halo = this.add.graphics();
    halo.fillStyle(light, 0.83);
    halo.fillCircle(0, -15, 250);
    halo.lineStyle(6, accent, 0.72);
    halo.strokeCircle(0, -15, 250);
    const person = this.add.graphics();
    person.fillStyle(primary, 0.98);
    person.fillEllipse(0, 168, 330, 340);
    person.fillStyle(0xf6d5c2, 1);
    person.fillCircle(0, -75, 105);
    person.fillStyle(primary, 1);
    person.fillEllipse(0, -130, 218, 128);
    person.fillRoundedRect(-116, -142, 232, 82, 38);
    person.fillStyle(accent, 1);
    person.fillCircle(mood === 'speaking' ? 36 : -36, -168, 31);
    person.fillStyle(0x5b4042, 1);
    person.fillCircle(-34, -82, 8);
    person.fillCircle(34, -82, 8);
    person.lineStyle(5, 0xa05862, 1);
    if (mood === 'pleased') {
      person.beginPath();
      person.arc(0, -54, 26, 0.1, Math.PI - 0.1, false);
      person.strokePath();
    } else if (mood === 'speaking') {
      person.strokeCircle(0, -48, 11);
    } else {
      person.lineBetween(-13, -48, 13, -48);
    }
    silhouette.add([halo, person]);

    const label = this.add
      .text(
        1030,
        506,
        `${localizeStoryText(this.story.visitor.name, this.i18n.language)}\n${localizeStoryText(
          this.story.visitor.role,
          this.i18n.language,
        )}\n${this.i18n.t('story.artPreview')}`,
        {
          fontFamily: FONT_BODY,
          fontSize: '17px',
          fontStyle: 'bold',
          color: '#684740',
          align: 'center',
          lineSpacing: 6,
          backgroundColor: '#fff9efdd',
          padding: { x: 20, y: 12 },
        },
      )
      .setOrigin(0.5);
    silhouette.add(label);

    if (!this.save.settings.reducedMotion) {
      this.tweens.add({
        targets: silhouette,
        y: silhouette.y - 4,
        duration: 1700,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    }
  }

  private renderCounterEdge(): void {
    const counter = this.add.graphics();
    counter.fillStyle(0xf6dec9, 1);
    counter.fillRoundedRect(-20, 510, 1640, 130, 45);
    counter.fillStyle(0xfff4df, 1);
    counter.fillRoundedRect(-20, 500, 1640, 56, 28);
    counter.lineStyle(6, 0xdba7a3, 0.8);
    counter.lineBetween(0, 552, 1600, 552);
    counter.lineStyle(2, 0xffffff, 0.86);
    counter.lineBetween(0, 515, 1600, 515);
  }

  private renderProgress(activeLine: number): void {
    const total = this.story.lines.length + 1;
    const active = activeLine + 1;
    const startX = 800 - ((total - 1) * 15) / 2;
    for (let index = 0; index < total; index += 1) {
      this.add.circle(
        startX + index * 15,
        852,
        index === active ? 5 : 3.5,
        index <= active ? 0xc46f7d : 0xe1c5bd,
        index <= active ? 1 : 0.7,
      );
    }
  }

  private speakerLabel(speaker: StorySpeaker): string {
    if (speaker === 'visitor') {
      return localizeStoryText(this.story.visitor.name, this.i18n.language);
    }
    return this.i18n.t(speaker === 'dunya' ? 'story.speaker.dunya' : 'story.speaker.narrator');
  }

  private speakerColor(speaker: StorySpeaker): number {
    if (speaker === 'visitor') return this.story.visitor.palette[0];
    if (speaker === 'dunya') return 0xc86f83;
    return 0x8c6d68;
  }

  private advanceIntro(): void {
    if (this.step >= this.story.lines.length - 1) {
      this.startPuzzle();
      return;
    }
    this.step += 1;
    if (this.save.settings.reducedMotion) {
      this.renderIntro();
      return;
    }
    this.cameras.main.fadeOut(
      90,
      255,
      248,
      238,
      (_camera: Phaser.Cameras.Scene2D.Camera, progress: number) => {
        if (progress < 1) return;
        this.renderIntro();
        this.cameras.main.fadeIn(120, 255, 248, 238);
      },
    );
  }

  private startPuzzle(): void {
    const order = getCampaignOrder(this.orderId);
    this.save.markCampaignStoryViewed(storyEventId(this.story.chapter, 'intro'));
    this.save.selectCampaignOrder(order.id);
    this.scene.start('PuzzleScene', {
      context: campaignPlayContext(order.id, order.timed, order.durationMs),
    });
  }

  private renderChapterComplete(): void {
    this.children.removeAll(true);
    this.renderBackdrop();
    this.add.rectangle(800, 450, 1600, 900, 0x4d2f37, 0.25);

    const shadow = this.add.graphics();
    shadow.fillStyle(0x452d33, 0.26);
    shadow.fillRoundedRect(335, 165, 950, 590, 48);
    const card = this.add.graphics();
    card.fillStyle(0xfff9ee, 0.99);
    card.fillRoundedRect(320, 150, 950, 590, 48);
    card.lineStyle(8, this.story.visitor.palette[1], 0.78);
    card.strokeRoundedRect(335, 165, 920, 560, 38);
    card.lineStyle(2, 0xffffff, 0.9);
    card.strokeRoundedRect(350, 180, 890, 530, 30);

    this.add
      .text(795, 220, this.i18n.t('story.chapterComplete'), {
        fontFamily: FONT_BODY,
        fontSize: '19px',
        fontStyle: 'bold',
        color: '#a2666d',
        letterSpacing: 2,
      })
      .setOrigin(0.5);
    this.add
      .text(795, 292, localizeStoryText(this.story.completionTitle, this.i18n.language), {
        fontFamily: 'Georgia, Times New Roman, serif',
        fontSize: '47px',
        fontStyle: 'bold',
        color: '#684740',
      })
      .setOrigin(0.5);
    this.add
      .text(795, 407, localizeStoryText(this.story.completionBody, this.i18n.language), {
        fontFamily: 'Georgia, Times New Roman, serif',
        fontSize: '27px',
        color: '#60443f',
        align: 'center',
        lineSpacing: 9,
        wordWrap: { width: 760 },
      })
      .setOrigin(0.5);
    this.add
      .text(795, 540, localizeStoryText(this.story.completionNote, this.i18n.language), {
        fontFamily: FONT_BODY,
        fontSize: '21px',
        fontStyle: 'italic',
        color: '#8a6861',
        align: 'center',
        lineSpacing: 7,
        wordWrap: { width: 700 },
      })
      .setOrigin(0.5);

    this.createRasterButton(
      795,
      660,
      470,
      this.i18n.t(this.story.chapter === 5 ? 'story.finishCampaign' : 'story.turnPage'),
      'story-complete',
      () => {
        this.save.markCampaignStoryViewed(storyEventId(this.story.chapter, 'chapterComplete'));
        this.scene.start('CampaignScene');
      },
    );
  }

  private createRasterButton(
    x: number,
    y: number,
    width: number,
    label: string,
    name: string,
    callback: () => void,
  ): Phaser.GameObjects.Container {
    const container = this.add.container(x, y).setName(name);
    const fullWidth = (width * 768) / 550;
    const art = this.add.image(0, 0, 'menu_button_normal').setDisplaySize(fullWidth, fullWidth / 3);
    const labelText = this.add
      .text(0, 0, label, {
        fontFamily: 'Georgia, Times New Roman, serif',
        fontSize: width < 300 ? '17px' : '21px',
        fontStyle: 'bold',
        color: '#684740',
        stroke: '#fff8ef',
        strokeThickness: 1,
      })
      .setOrigin(0.5);
    container.add([art, labelText]);
    container.setSize(width, width / 3.1).setInteractive({ useHandCursor: true });
    container.on('pointerover', () => {
      art.setTexture('menu_button_hover');
      if (!this.save.settings.reducedMotion) container.setScale(1.018);
    });
    container.on('pointerout', () => {
      art.setTexture('menu_button_normal');
      container.setScale(1);
    });
    container.on('pointerdown', () => {
      this.audio.play('ui_tap');
      art.setTexture('menu_button_pressed');
      if (!this.save.settings.reducedMotion) container.setScale(0.985);
      this.time.delayedCall(this.save.settings.reducedMotion ? 1 : 65, callback);
    });
    return container;
  }
}
