## 2024-05-15 - Implement Silent Event Listeners for Phaser Shortcuts

**Learning:** Adding text hints to fixed-width icon buttons in a Phaser canvas UI can break the layout due to a lack of automatic CSS reflow. It is better to rely on silent keyboard event listeners (e.g., `keydown-U`) than trying to dynamically resize canvas elements for visual hints.
**Action:** Always implement keyboard accessibility shortcuts via silent event listeners within Phaser scenes, ensuring to check for active DOM inputs or modals before executing the logic.
