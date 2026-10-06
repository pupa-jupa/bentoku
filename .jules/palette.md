## 2024-05-18 - Keyboard Shortcuts for Fixed-Width UIs
**Learning:** Adding text hints to fixed-width icon buttons can break the layout due to a lack of automatic CSS reflow on a canvas-based layout.
**Action:** Implement keyboard accessibility via silent event listeners (e.g., `keydown-U`) within scenes and check for active modals or focused HTML inputs to avoid unintended shortcut triggers.
