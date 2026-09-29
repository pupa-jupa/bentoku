## 2024-05-18 - Keyboard shortcut UI hints and layout constraints in Phaser

**Learning:** Adding text hints (like "(U)") to fixed-width icon-only buttons in the Phaser canvas can break the layout because the canvas lacks automatic CSS reflow and dynamic resizing of button components.

**Action:** Implement keyboard accessibility natively via silent global event listeners (like `keydown-U`) rather than modifying canvas element dimensions to include visual shortcuts, to preserve the layout geometry while still providing keyboard-driven functionality. Ensure listeners correctly filter out events targeting input fields or when modals are active.
