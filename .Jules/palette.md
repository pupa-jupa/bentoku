## 2026-09-21 - Keyboard accessibility for common actions
**Learning:** Adding visual hints to fixed-width icon buttons (like changing '↶' to '↶ (U)') breaks the layout since Phaser UI elements lack automatic CSS reflow. Keyboard accessibility can be provided via silent event listeners.
**Action:** Implement keyboard listeners for frequent actions directly (e.g., 'keydown-U' for undo) rather than modifying fixed-size canvas elements to contain extra text.
