## 2024-10-27 - Keyboard Shortcuts in Canvas

**Learning:** In a Phaser canvas-based game, implementing keyboard shortcuts (like undo) requires adding keyboard event listeners directly via `this.input.keyboard?.on` (or `document.addEventListener`). The event handler must filter out unwanted triggers by checking `document.activeElement?.tagName === 'INPUT'`, `this.modal` (to see if a dialog is open), and `event.repeat` to prevent continuous accidental firing while holding down a key. It's also important to unbind the listener in the `SHUTDOWN` event to prevent memory leaks and duplicate handlers.
**Action:** Always check active modals, inputs, and repeating keys when attaching global keyboard shortcuts in Canvas/Phaser games, and bind cleanup to the scene's shutdown lifecycle event.
