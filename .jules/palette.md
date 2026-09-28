## 2023-09-28 - Keyboard Shortcuts for Undo

**Learning:** Adding text hints for keyboard shortcuts to fixed-width UI elements (like icon buttons) can break the layout and design due to lack of automatic CSS reflow on canvas environments.
**Action:** Implement keyboard accessibility through silent global event listeners (e.g., `U` or `Ctrl+Z` for Undo), checking that no modals or inputs are focused, to provide shortcuts without disrupting canvas UI dimensions.
