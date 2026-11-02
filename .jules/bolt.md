## 2024-11-01 - Avoid closures and higher-order array methods in hot paths like constraint solvers

**Learning:** In the constraint solving loop of this Phaser game, using functional array methods like `.every`, `.some`, and `.filter` with closures created massive allocation overhead. Manually inlining functions and caching intermediate structures (like clue offsets) resulted in significant speedups, avoiding garbage collection pauses during puzzle validation.
**Action:** Always prefer traditional `for` loops and manually inline short helper functions when executing heavily inside hot paths like search and constraint validation loops.
