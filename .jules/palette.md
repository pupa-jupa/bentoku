## 2024-05-18 - Keyboard accessibility for Fixed-Width Canvas UI

**Learning:** Adding text hints or visual shortcut indicators to fixed-width icon buttons can break the layout in Phaser games since Canvas lacks automatic CSS reflow.
**Action:** Implement keyboard accessibility via silent event listeners (e.g., `keydown-U`) rather than attempting to modify canvas element dimensions to include visual shortcuts, and ensure no modals or inputs are focused when handling these shortcuts.
