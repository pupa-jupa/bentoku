## 2024-05-18 - Keyboard Accessibility for Phaser Canvas Buttons

**Learning:** In a Phaser canvas-based game, adding visual text hints or standard DOM ARIA labels to fixed-width icon buttons can break layouts due to the lack of automatic CSS reflow. Accessibility and usability for these buttons (like Undo and Help) require an alternative approach.
**Action:** Instead of forcing visual hints that break the layout, implement global silent keyboard event listeners (e.g., `keydown-U` for Undo) to provide keyboard shortcuts for these actions. Always bind them cleanly and remove them on scene shutdown to prevent memory leaks, checking that no modals or inputs are active.
