## 2024-10-19 - Keyboard Accessibility in Canvas

**Learning:** Canvas-based games lack native DOM elements for buttons, meaning standard HTML a11y attributes don't apply to individual UI components. Keyboard shortcuts are critical for accessibility, but must be carefully scoped to ignore inputs when modals are open or actual DOM inputs are focused.
**Action:** Always implement silent keyboard listeners (using `event.key.toLowerCase()`) for common actions like Undo in canvas applications, checking modal/input state and ensuring proper cleanup on scene shutdown.
