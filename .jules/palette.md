## 2024-06-03 - Keyboard Shortcuts for Undo

**Learning:** Adding text hints to fixed-width icon buttons can break the layout due to a lack of automatic CSS reflow in Canvas based Phaser UI.
**Action:** Implement keyboard accessibility via silent event listeners (e.g. keydown-U or Ctrl+Z) for icon buttons like "Undo". Check that modals are not active and inputs are not focused.
