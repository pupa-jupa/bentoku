## 2024-11-20 - Add keyboard shortcuts

**Learning:** In Phaser, adding text hints to fixed-width icon buttons can break the layout due to a lack of automatic CSS reflow.
**Action:** Implement keyboard accessibility via silent event listeners (e.g., `keydown-U`) rather than attempting to modify canvas element dimensions to include visual shortcuts.
