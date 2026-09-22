## 2024-10-24 - Keyboard shortcuts for fixed-width components

**Learning:** Adding text hints to fixed-width icon buttons can break the layout due to a lack of automatic CSS reflow. Attempting to modify canvas element dimensions to include visual shortcuts may disrupt the overall design composition.
**Action:** Implement keyboard accessibility via silent event listeners (e.g., `keydown-U`) rather than modifying the visual canvas structure to show shortcuts, as keyboard access matters more than the visual hint.
