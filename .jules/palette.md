## 2024-10-15 - Keyboard Shortcut Strategy for Canvas UI

**Learning:** Adding text hints to fixed-width icon buttons in a Phaser canvas UI breaks layout because there is no CSS reflow.
**Action:** Implement accessibility shortcuts via silent global event listeners (e.g. `keydown` for 'U' to undo) instead of attempting to modify visual elements. Ensure listeners check for `!this.modal`, `document.activeElement?.tagName !== 'INPUT'`, and `!event.repeat`. Unbind listeners on scene `SHUTDOWN`.
