## 2026-10-26 - Added Keyboard Shortcuts to PuzzleScene

**Learning:** In Phaser canvas-based games, UI elements lack standard DOM nodes for direct HTML ARIA attributes. Accessibility relies heavily on keyboard event listeners (`keydown`), making it critical to map essential gameplay actions (like Undo, Help, and Settings) to intuitive key presses to allow keyboard navigation for screen reader users and power users.
**Action:** Always verify that no modals are active, HTML inputs are not focused, and `event.repeat` is falsy to prevent unintended shortcut triggers when implementing global keyboard event listeners in Phaser scenes. Additionally, check `event.key.toLowerCase()` over `event.code` to ensure reliable shortcut behavior across different international keyboard layouts.
