## 2026-11-01 - Avoid Array Spread and Functional Array Methods in Solver Hot Paths

**Learning:** Codebase-specific performance pattern: `clueCouldMatch` and `clueMatchesBoard` inside `ConstraintEvaluator.ts` act as massive hot paths during puzzle constraint solving. Using functional array methods (`.some`, `.every`) and allocating intermediate arrays (`getClueOffsets`) causes significant function call overhead and heavy closure allocation, degrading performance.
**Action:** Always use traditional `for` loops and manually inline short helper logic for arrays and iterations inside solver hot paths to avoid closure allocation bottlenecks.
