## 2024-05-18 - Keyboard Support for Core Actions

**Learning:** Adding keyboard shortcuts (like Ctrl/Cmd+Z for undo) to a mostly pointer-driven Phaser game significantly improves accessibility and workflow for keyboard users without cluttering the UI.
**Action:** When adding global keyboard shortcuts in Phaser scenes, always ensure to clean up the event listener during the scene shutdown event to avoid memory leaks.
