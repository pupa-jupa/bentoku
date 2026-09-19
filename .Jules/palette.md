## 2023-10-24 - Canvas-based Keyboard Accessibility
**Learning:** Because this is a Phaser canvas-based game, traditional DOM-based ARIA attributes on buttons do not apply directly to in-game UI. Therefore, keyboard navigation (like allowing Space/Enter to advance and Escape to skip tutorials) is crucial to bridging the accessibility gap for users who can't rely on pointer interactions.
**Action:** Always bind specific keyboard shortcuts (`keydown` events on `scene.input.keyboard`) for key UI interactions and ensure clean event unbinding upon UI destruction to prevent memory leaks in Phaser.
