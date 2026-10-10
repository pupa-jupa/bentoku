## 2024-11-20 - Keyboard Accessibility for Fixed-Width Canvas Buttons

**Learning:** Adding text hints (like tooltips or extra text) to fixed-width icon buttons in a Phaser canvas breaks the visual layout, as canvas elements don't automatically reflow like HTML/CSS.
**Action:** Implement keyboard accessibility via silent event listeners (`keydown` bindings) rather than attempting to modify canvas element dimensions to include visual shortcuts. Ensure checks for active modals, HTML input focus, and key repeats are used.
