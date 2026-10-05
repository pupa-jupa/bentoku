## 2026-10-05 - Keyboard accessibility for canvas games

**Learning:** Keyboard accessibility is crucial for repetitive actions (like Undo) in puzzle games, particularly in canvas-based apps (Phaser) where standard DOM/HTML accesskeys cannot be used directly.
**Action:** Add silent global event listeners for keyboard shortcuts on Phaser scenes, unbinding them correctly during SHUTDOWN and checking that standard HTML elements aren't focused.
