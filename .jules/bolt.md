## 2025-03-05 - Optimize puzzle constraint solver hot paths
**Learning:** Functional array methods like `.every`, `.some`, `.filter`, and `.map` cause significant closure allocation overhead and bottleneck performance when used in high-frequency hot paths like puzzle generation and constraint solving loops (e.g., depth-first search in `PuzzleSolver.ts` and cell matching in `ConstraintEvaluator.ts`).
**Action:** Always use traditional `for` loops instead of functional array methods in core solver algorithms to avoid memory allocation and garbage collection penalties.
