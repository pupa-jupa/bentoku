## 2026-10-11 - Canvas UI Keyboard Shortcuts Layout Constraints

**Learning:** Adding text hints to fixed-width icon buttons in a Phaser canvas UI can break the layout due to the lack of automatic CSS reflow. Attempting to modify canvas element dimensions for visual shortcuts creates rendering bugs.
**Action:** Implement keyboard accessibility via silent event listeners (e.g., `keydown-U`) and document them elsewhere, rather than trying to force visual text hints into rigidly sized canvas elements. Always add context safety checks (no modals open, no inputs focused, `event.repeat` check) to these listeners.
