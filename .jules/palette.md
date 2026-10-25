## 2024-10-25 - Silent Keyboard Shortcuts in Phaser UI

**Learning:** Adding text hints or visual indicators to fixed-width icon buttons in a Phaser canvas layout can break the UI design due to the lack of automatic CSS reflow.
**Action:** Implement keyboard accessibility via silent event listeners (e.g., `keydown`) rather than attempting to modify canvas element dimensions to include visual shortcuts. Ensure listeners ignore held-down keys (`event.repeat`), active modals, and focused HTML inputs.
