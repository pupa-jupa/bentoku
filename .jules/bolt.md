## 2024-05-19 - Constraint Evaluator Array Method Optimization

**Learning:** In the `ConstraintEvaluator.ts` hot path, using `.some` and `.every` array methods and intermediate closures caused a massive performance bottleneck. The constraint evaluator is run hundreds of thousands of times during puzzle generation and solving. Using `getClueOffsets(clue).some(...)` and `clue.cells.every(...)` resulted in excessive garbage collection and closure creation.
**Action:** Replace higher-order functional array iteration with native `for` loops in hot path solver routines (like `clueCouldMatch` and `clueMatchesBoard`) to eliminate memory allocation overhead and dramatically improve generation and evaluation speed.
