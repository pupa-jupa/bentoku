## 2024-10-13 - Silent Keyboard Shortcut Accessibility in Canvas Games

**Learning:** In Phaser canvas games, adding text hints directly to fixed-width UI elements (like icon-only buttons) can break the layout due to the lack of automatic CSS reflow. Relying on canvas visual dimension modifications is brittle for accessibility.
**Action:** Implement keyboard accessibility via silent event listeners (e.g., `keydown-U` and `keydown-Z` for Undo). Always verify no modals are active and `event.repeat` is falsy to prevent rapid accidental triggers or breaking expected UX flow.
