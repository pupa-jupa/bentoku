## 2024-05-24 - Closure Allocation in Constraint Solver

**Learning:** High-frequency puzzle generation and solving code in `ConstraintEvaluator.ts` uses `.every()` and `.some()` heavily for matching logic. This creates immense closure overhead because the functions are invoked millions of times during solving iterations, causing significant CPU bottleneck on array operations instead of actual logic.
**Action:** Replace `.some()`, `.every()`, and `.map()` with traditional `for` loops in deep constraint checking hot paths (`clueCouldMatch`, `clueMatchesBoard`, `boardSatisfiesPuzzle`) to skip closures entirely and optimize runtime speed.
