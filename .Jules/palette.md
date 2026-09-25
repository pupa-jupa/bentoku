## 2024-05-20 - Adding Keyboard Shortcuts to Canvas UI

**Learning:** Phaser UI buttons lack DOM nodes for standard HTML accessibility attributes (like `accesskey` or standard keyboard event propagation). Adding visible text hints to fixed-width buttons can break layout. Screen reader accessibility is supported via silent global keyboard event listeners (like `keydown-U`) rather than modifying the canvas layout.
**Action:** Always implement shortcuts via `this.input.keyboard?.on('keydown-[Key]', handler)` on the scene level, and strictly verify `this.modal` is falsy and `document.activeElement?.tagName !== 'INPUT'` to prevent unintended shortcut triggers during dialogs or text entry.
