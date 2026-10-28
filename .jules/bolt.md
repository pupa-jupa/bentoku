## 2023-10-28 - Optimizing the Constraint Solver Hot Path

**Learning:** In a heavily executed hot path like the puzzle constraint solver (e.g., `ConstraintEvaluator.ts`), using functional array methods (`.some()`, `.every()`, etc.) and abstracting inner logic into many small function calls (like `positionAt` and `pieceMatchesCell`) causes severe performance bottlenecks due to closure allocation and function call overhead.
**Action:** Replace functional array methods in tight inner loops with traditional, nested `for` loops and inline tiny helper functions (e.g., coordinate calculations and piece matching logic) directly into the loops to minimize allocation and maximize raw performance.
