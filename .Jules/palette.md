## 2026-09-23 - Keyboard accessibility for fixed-width Phaser UI

**Learning:** Adding text hints to fixed-width icon buttons in a Phaser canvas can break the layout due to a lack of automatic CSS reflow.
**Action:** Implement keyboard accessibility via silent event listeners (e.g., `keydown-U`) rather than attempting to modify canvas element dimensions to include visual shortcuts.
