## 2024-09-24 - Performance pattern

**Learning:** Codebase-specific performance pattern: Avoid functional array methods (`.every`, `.some`, `.filter`, `.map`) in high-frequency hot paths like puzzle generation and constraint solving loops. Use traditional `for` loops instead to avoid massive closure allocation bottlenecks.
**Action:** Replace functional array methods in ConstraintEvaluator.ts and PuzzleSolver.ts with simple loops.
