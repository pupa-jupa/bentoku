import Phaser from 'phaser';
import { COLORS, FONT_BODY, FONT_DISPLAY } from '../game/constants';
import { I18nService } from '../i18n/I18nService';
import type { TranslationKey } from '../i18n/translations';
import type { PlayerSettings } from '../puzzle/types';
import { AudioService } from '../services/AudioService';
import { musicAssets } from '../services/AssetRegistry';
import { MusicService } from '../services/MusicService';
import { SaveService } from '../services/SaveService';

type DunyaExpression = 'neutral' | 'blink' | 'speaking' | 'delighted' | 'focused';

interface MenuAction {
  id: 'campaign' | 'infinite' | 'achievements' | 'settings';
  label: TranslationKey;
  expression: DunyaExpression;
  callback: () => void;
}

export class MenuScene extends Phaser.Scene {
  private save!: SaveService;
  private settings!: PlayerSettings;
  private i18n!: I18nService;
  private audio!: AudioService;
  private music!: MusicService;
  private menuLayer?: Phaser.GameObjects.Container;
  private panel?: Phaser.GameObjects.Container;
  private dunya?: Phaser.GameObjects.Image;
  private dunyaExpression: DunyaExpression = 'neutral';
  private blinkTimer?: Phaser.Time.TimerEvent;

  constructor() {
    super('MenuScene');
  }

  create(): void {
    this.save = new SaveService();
    this.settings = this.save.settings;
    this.i18n = new I18nService(this.settings.language);
    this.audio = new AudioService(this, this.settings);
    this.music = new MusicService(this, musicAssets, this.settings.musicVolume);
    this.music.start();
    this.renderMenu();
  }

  private renderMenu(): void {
    this.blinkTimer?.remove(false);
    if (this.dunya) this.tweens.killTweensOf(this.dunya);
    this.menuLayer?.destroy(true);
    this.menuLayer = this.add.container(0, 0).setName('main-menu');

    document.documentElement.lang = this.settings.language;
    this.game.canvas.setAttribute('aria-label', this.i18n.t('app.ariaLabel'));

    const background = this.add
      .image(800, 450, 'menu_cafe_background')
      .setDisplaySize(1600, 900)
      .setName('menu-background');

    this.dunya = this.add
      .image(1283.5, 440, 'dunya_neutral')
      .setDisplaySize(547, 820)
      .setName('dunya');

    const foreground = this.add
      .image(1145, 630, 'menu_display_foreground')
      .setDisplaySize(910, 540)
      .setName('menu-display-foreground');

    const title = this.add
      .text(82, 80, 'Bentoku', {
        fontFamily: 'Georgia, Times New Roman, serif',
        fontSize: '54px',
        fontStyle: 'bold',
        color: '#6a453d',
        stroke: '#fff4e8',
        strokeThickness: 2,
        shadow: { color: '#fffaf2', blur: 5, fill: true, offsetY: 2 },
      })
      .setOrigin(0, 0.5);
    const tagline = this.add
      .text(86, 120, this.i18n.t('menu.tagline'), {
        fontFamily: FONT_BODY,
        fontSize: this.settings.language === 'ru' ? '16px' : '18px',
        color: '#9b6b61',
        letterSpacing: this.settings.language === 'ru' ? 2 : 3,
      })
      .setOrigin(0, 0.5);

    this.menuLayer.add([background, this.dunya, foreground, title, tagline]);

    const actions: MenuAction[] = [
      {
        id: 'campaign',
        label: 'menu.campaign',
        expression: 'focused',
        callback: () => this.openCampaign(),
      },
      {
        id: 'infinite',
        label: 'menu.infinite',
        expression: 'delighted',
        callback: () => this.scene.start('PuzzleScene'),
      },
      {
        id: 'achievements',
        label: 'menu.achievements',
        expression: 'delighted',
        callback: () => this.openAlbum(),
      },
      {
        id: 'settings',
        label: 'menu.settings',
        expression: 'speaking',
        callback: () => this.openSettings(),
      },
    ];

    actions.forEach((action, index) => this.createMenuButton(action, 268 + index * 166, index));
    this.setDunyaExpression('neutral');
    this.scheduleBlink();
  }

  private createMenuButton(action: MenuAction, y: number, index: number): void {
    const container = this.add
      .container(312, y)
      .setName(`menu-action-${action.id}`)
      .setAlpha(this.settings.reducedMotion ? 1 : 0);
    const art = this.add.image(0, 0, 'menu_button_normal').setDisplaySize(670, 223);
    const label = this.i18n.t(action.label);
    const text = this.add
      .text(0, -1, label, {
        fontFamily: 'Georgia, Times New Roman, serif',
        fontSize: label.length > 17 ? '25px' : '31px',
        fontStyle: 'bold',
        color: '#6a453d',
        stroke: '#fff9ef',
        strokeThickness: 2,
        align: 'center',
      })
      .setOrigin(0.5);

    container.add([art, text]);
    container.setSize(520, 148).setInteractive({ useHandCursor: true });
    container.on('pointerover', () => {
      if (this.panel) return;
      art.setTexture('menu_button_hover');
      container.setScale(1.025);
      this.setDunyaExpression(action.expression);
    });
    container.on('pointerout', () => {
      art.setTexture('menu_button_normal');
      container.setScale(1);
      if (!this.panel) this.setDunyaExpression('neutral');
    });
    container.on('pointerdown', () => {
      if (this.panel) return;
      this.audio.play('ui_tap');
      art.setTexture('menu_button_pressed');
      container.setScale(0.985);
      this.time.delayedCall(this.settings.reducedMotion ? 1 : 85, () => {
        if (!container.active) return;
        action.callback();
      });
    });

    this.menuLayer?.add(container);
    if (!this.settings.reducedMotion) {
      container.y += 16;
      this.tweens.add({
        targets: container,
        y,
        alpha: 1,
        duration: 310,
        delay: 90 + index * 65,
        ease: 'Sine.easeOut',
      });
    }
  }

  private setDunyaExpression(expression: DunyaExpression): void {
    this.dunyaExpression = expression;
    if (!this.dunya?.active) return;
    this.dunya.setTexture(`dunya_${expression}`);
  }

  private scheduleBlink(): void {
    this.blinkTimer?.remove(false);
    const delay = Phaser.Math.Between(4200, 6800);
    this.blinkTimer = this.time.delayedCall(delay, () => {
      if (!this.panel && this.dunyaExpression === 'neutral') {
        this.setDunyaExpression('blink');
        this.time.delayedCall(this.settings.reducedMotion ? 80 : 145, () => {
          if (!this.panel && this.dunyaExpression === 'blink') this.setDunyaExpression('neutral');
        });
      }
      this.scheduleBlink();
    });
    if (!this.settings.reducedMotion && this.dunya) {
      this.tweens.killTweensOf(this.dunya);
      this.tweens.add({
        targets: this.dunya,
        y: { from: 440, to: 442 },
        duration: 2500,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    }
  }

  private openCampaign(): void {
    this.openInfoPanel(
      this.i18n.t('menu.campaignTitle'),
      this.i18n.t('menu.campaignBody'),
      this.i18n.t('menu.campaignStatus'),
      'focused',
    );
  }

  private openAlbum(): void {
    this.openInfoPanel(
      this.i18n.t('menu.albumTitle'),
      this.i18n.t('menu.albumBody'),
      this.i18n.t('menu.albumStatus'),
      'delighted',
    );
  }

  private openInfoPanel(
    title: string,
    body: string,
    status: string,
    expression: DunyaExpression,
  ): void {
    this.closePanel(false);
    this.setDunyaExpression(expression);
    const panel = this.createPanelFrame(title, 610);
    const bodyText = this.add
      .text(0, -72, body, {
        fontFamily: FONT_BODY,
        fontSize: '21px',
        color: '#76564f',
        align: 'center',
        lineSpacing: 9,
        wordWrap: { width: 620 },
      })
      .setOrigin(0.5);
    const statusText = this.add
      .text(0, 130, status, {
        fontFamily: FONT_BODY,
        fontSize: '17px',
        fontStyle: 'italic',
        color: '#916c65',
        backgroundColor: '#f7dfd0cc',
        padding: { x: 22, y: 13 },
        align: 'center',
        wordWrap: { width: 550 },
      })
      .setOrigin(0.5);
    panel.add([bodyText, statusText]);
    this.createPanelButton(panel, 222, this.i18n.t('menu.back'), () => this.closePanel());
    this.revealPanel(panel);
  }

  private openSettings(withSound = true): void {
    this.closePanel(false);
    this.setDunyaExpression('speaking');
    const panel = this.createPanelFrame(this.i18n.t('settings.title'), 720);

    this.createPanelButton(
      panel,
      -158,
      this.i18n.t('settings.effects', {
        state: this.i18n.t(this.settings.sound ? 'settings.on' : 'settings.off'),
      }),
      () => {
        this.settings = this.save.updateSettings({ sound: !this.settings.sound });
        this.audio.setEnabled(this.settings.sound);
        this.openSettings(false);
      },
    );
    this.createPanelButton(
      panel,
      -54,
      this.i18n.t('settings.motion', {
        state: this.i18n.t(
          this.settings.reducedMotion ? 'settings.motionReduced' : 'settings.motionGentle',
        ),
      }),
      () => {
        this.settings = this.save.updateSettings({
          reducedMotion: !this.settings.reducedMotion,
        });
        this.renderMenu();
        this.openSettings(false);
      },
    );
    this.createPanelButton(
      panel,
      50,
      this.i18n.t('settings.language', {
        language: this.i18n.t(this.settings.language === 'en' ? 'language.en' : 'language.ru'),
      }),
      () => this.switchLanguage(),
    );

    this.createSlider(
      panel,
      192,
      this.i18n.t('settings.effectsVolume'),
      this.settings.soundVolume,
      (soundVolume) => {
        this.settings = this.save.updateSettings({ soundVolume });
        this.audio.setVolume(this.settings.soundVolume);
      },
    );
    this.createSlider(
      panel,
      286,
      this.i18n.t('settings.music'),
      this.settings.musicVolume,
      (musicVolume) => {
        this.settings = this.save.updateSettings({ musicVolume });
        this.music.setVolume(this.settings.musicVolume);
      },
    );

    this.revealPanel(panel);
    if (withSound) this.audio.play('note_open');
  }

  private switchLanguage(): void {
    this.settings = this.save.updateSettings({
      language: this.settings.language === 'en' ? 'ru' : 'en',
    });
    this.i18n.setLanguage(this.settings.language);
    this.closePanel(false);
    this.renderMenu();
    this.openSettings(false);
  }

  private createPanelFrame(titleText: string, height: number): Phaser.GameObjects.Container {
    const panel = this.add.container(800, 450).setDepth(3000).setName('menu-panel');
    const shade = this.add.rectangle(0, 0, 1600, 900, COLORS.walnut, 0.34).setInteractive();
    const shadow = this.add.graphics();
    shadow.fillStyle(COLORS.shadow, 0.19);
    shadow.fillRoundedRect(-374, -height / 2 + 14, 764, height, 44);
    const card = this.add.graphics();
    card.fillStyle(0xfffbf3, 0.99);
    card.fillRoundedRect(-382, -height / 2, 764, height, 44);
    card.lineStyle(7, 0xf1b8bd, 0.66);
    card.strokeRoundedRect(-371, -height / 2 + 11, 742, height - 22, 36);
    card.lineStyle(2, 0xf8dcd1, 1);
    card.strokeRoundedRect(-358, -height / 2 + 24, 716, height - 48, 30);
    const title = this.add
      .text(0, -height / 2 + 74, titleText, {
        fontFamily: 'Georgia, Times New Roman, serif',
        fontSize: '36px',
        fontStyle: 'bold',
        color: '#67443d',
        align: 'center',
      })
      .setOrigin(0.5);
    const close = this.add
      .text(326, -height / 2 + 48, '×', {
        fontFamily: FONT_DISPLAY,
        fontSize: '38px',
        color: '#936c65',
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    close.on('pointerdown', () => this.closePanel());
    panel.add([shade, shadow, card, title, close]);
    this.panel = panel;
    return panel;
  }

  private createPanelButton(
    panel: Phaser.GameObjects.Container,
    y: number,
    label: string,
    callback: () => void,
  ): Phaser.GameObjects.Container {
    const button = this.add.container(0, y).setName('menu-panel-action');
    const art = this.add.image(0, 0, 'menu_button_normal').setDisplaySize(570, 190);
    const text = this.add
      .text(0, -1, label, {
        fontFamily: 'Georgia, Times New Roman, serif',
        fontSize: label.length > 30 ? '17px' : '20px',
        fontStyle: 'bold',
        color: '#6a453d',
        stroke: '#fffaf0',
        strokeThickness: 1,
        align: 'center',
      })
      .setOrigin(0.5);
    button.add([art, text]);
    button.setSize(430, 78).setInteractive({ useHandCursor: true });
    button.on('pointerover', () => {
      art.setTexture('menu_button_hover');
      button.setScale(1.02);
    });
    button.on('pointerout', () => {
      art.setTexture('menu_button_normal');
      button.setScale(1);
    });
    button.on('pointerdown', () => {
      this.audio.play('ui_tap');
      art.setTexture('menu_button_pressed');
      button.setScale(0.985);
      this.time.delayedCall(this.settings.reducedMotion ? 1 : 70, callback);
    });
    panel.add(button);
    return button;
  }

  private createSlider(
    panel: Phaser.GameObjects.Container,
    y: number,
    labelText: string,
    initialValue: number,
    onChange: (value: number) => void,
  ): void {
    const width = 390;
    let value = Phaser.Math.Clamp(initialValue, 0, 1);
    const label = this.add
      .text(0, y - 28, '', {
        fontFamily: FONT_BODY,
        fontSize: '18px',
        fontStyle: 'bold',
        color: '#6f514a',
      })
      .setOrigin(0.5);
    const visual = this.add.graphics().setPosition(0, y + 13);
    const zone = this.add.zone(0, y + 13, width + 50, 58).setInteractive({ useHandCursor: true });
    const redraw = (): void => {
      label.setText(
        value === 0
          ? `${labelText}: ${this.i18n.t('settings.off')}`
          : `${labelText}: ${Math.round(value * 100)}%`,
      );
      visual.clear();
      visual.fillStyle(0xeec9c3, 0.62);
      visual.fillRoundedRect(-width / 2, -7, width, 14, 7);
      visual.fillStyle(0xd98787, 0.9);
      visual.fillRoundedRect(-width / 2, -7, width * value, 14, 7);
      visual.fillStyle(0xfffbf2, 1);
      visual.fillCircle(-width / 2 + width * value, 0, 17);
      visual.lineStyle(4, 0xd98787, 0.9);
      visual.strokeCircle(-width / 2 + width * value, 0, 17);
    };
    const update = (pointer: Phaser.Input.Pointer): void => {
      value = Phaser.Math.Clamp((pointer.worldX - (panel.x - width / 2)) / width, 0, 1);
      value = Math.round(value * 100) / 100;
      redraw();
      onChange(value);
    };
    zone.on('pointerdown', update);
    zone.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (pointer.isDown) update(pointer);
    });
    redraw();
    panel.add([label, visual, zone]);
  }

  private revealPanel(panel: Phaser.GameObjects.Container): void {
    if (this.settings.reducedMotion) return;
    panel.setAlpha(0).setScale(0.97);
    this.tweens.add({
      targets: panel,
      alpha: 1,
      scale: 1,
      duration: 190,
      ease: 'Sine.easeOut',
    });
  }

  private closePanel(withSound = true): void {
    if (!this.panel) return;
    if (withSound) this.audio.play('ui_tap');
    this.panel.destroy(true);
    this.panel = undefined;
    this.setDunyaExpression('neutral');
  }
}
