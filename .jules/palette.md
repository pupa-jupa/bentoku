## 2024-05-24 - Undo Keyboard Shortcut (Z / U)

**Learning:** Puzzle games benefit greatly from a quick keyboard shortcut to undo a move, particularly for accessibility and power users. Adding an undo shortcut (`keydown-Z` or `keydown-U`) tied to the existing `undo()` method improves the experience. We must ensure modals or input fields are not active.
**Action:** Add a keyboard shortcut listener in `PuzzleScene` for the Undo action and clean it up on SHUTDOWN.
