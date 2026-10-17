## 2025-02-12 - Adding Keyboard Shortcuts for Canvas UIs Without Modifying Fixed Dimensions

**Learning:** Adding text hints to fixed-width icon buttons in a Phaser canvas UI breaks the layout because there is no automatic CSS reflow. To provide keyboard accessibility without disrupting visual constraints, shortcuts must be implemented as invisible global listeners (e.g., `keydown` for 'U' or 'Ctrl+Z').
**Action:** Use global keyboard event listeners bound to the scene context (and unbound on `SHUTDOWN`) with appropriate checks for `!event.repeat`, modal state, and input focus to safely implement non-visual accessibility shortcuts.
