## 2026-10-24 - Silent Keyboard Shortcuts for Canvas UIs

**Learning:** Adding visual keyboard shortcut hints (like "U") to Phaser canvas fixed-width buttons breaks the layout because canvas elements lack automatic CSS reflow.
**Action:** Implement keyboard accessibility in canvas games via silent event listeners (e.g., `keydown-U`) rather than attempting to modify canvas element dimensions to include visual shortcuts. Always ensure modals and inputs are checked before triggering shortcuts.
