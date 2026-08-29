import Phaser from 'phaser';

interface ModalCardBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface ModalDismissSpec {
  scene: Phaser.Scene;
  host: Phaser.GameObjects.Container;
  backdrop: Phaser.GameObjects.GameObject;
  card: Phaser.GameObjects.GameObject;
  cardBounds: ModalCardBounds;
  dismiss: () => void;
}

export const bindModalDismissal = ({
  scene,
  host,
  backdrop,
  card,
  cardBounds,
  dismiss,
}: ModalDismissSpec): (() => void) => {
  let active = true;
  const cleanup = (): void => {
    backdrop.off('pointerup', finish);
    card.off('pointerdown', stop);
    card.off('pointerup', stop);
    scene.input.keyboard?.off('keydown-ESC', onEscape);
    host.off(Phaser.GameObjects.Events.DESTROY, cleanup);
    scene.events.off(Phaser.Scenes.Events.SHUTDOWN, cleanup);
  };
  const finish = (): void => {
    if (!active) return;
    active = false;
    cleanup();
    dismiss();
  };
  const stop = (
    _pointer: Phaser.Input.Pointer,
    _localX: number,
    _localY: number,
    event: Phaser.Types.Input.EventData,
  ): void => event.stopPropagation();
  const onEscape = (event: KeyboardEvent): void => {
    event.preventDefault();
    finish();
  };

  backdrop.on('pointerup', finish);
  card
    .setInteractive(
      new Phaser.Geom.Rectangle(cardBounds.x, cardBounds.y, cardBounds.width, cardBounds.height),
      Phaser.Geom.Rectangle.Contains,
    )
    .on('pointerdown', stop)
    .on('pointerup', stop);
  scene.input.keyboard?.on('keydown-ESC', onEscape);
  host.once(Phaser.GameObjects.Events.DESTROY, cleanup);
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, cleanup);
  return cleanup;
};
