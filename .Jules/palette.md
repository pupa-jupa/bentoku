## 2024-05-24 - Canvas Shortcut Layouts

**Learning:** In Phaser canvas-based games, adding visual shortcut hints to fixed-width icon buttons can break layout due to a lack of automatic CSS reflow.
**Action:** Implement keyboard accessibility via silent event listeners (e.g., standard keydown handlers) on the scene instead of modifying fixed-size canvas elements.
