## 2026-11-04 - Silent Event Listeners for Phaser Accessibility

**Learning:** Adding keyboard shortcuts to fixed-width canvas-based icon buttons can break layout without CSS reflow. It is safer to use silent `keydown` event listeners that verify modals and inputs aren't active.
**Action:** Always implement shortcuts via global `keydown` events checking `document.activeElement` and `event.repeat`, and remember to bind/unbind appropriately on the Phaser Scene lifecycle to avoid memory leaks.
