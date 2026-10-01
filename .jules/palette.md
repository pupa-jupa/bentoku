## 2024-10-01 - Canvas Accessibility Shortcuts

**Learning:** As a Phaser canvas-based game, UI elements lack standard DOM nodes for direct HTML ARIA attributes. Accessibility relies heavily on keyboard event listeners (`keydown`), but we must verify that no modals are active and HTML inputs are not focused to prevent unintended triggers.
**Action:** Always implement global keyboard event listeners in Phaser scenes for shortcuts (e.g., Undo with 'U' and 'Z'), verify no modals are active, verify inputs are not focused (`document.activeElement.tagName === 'INPUT'`), and unbind listeners in the `SHUTDOWN` event.
