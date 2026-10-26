## 2024-05-18 - Avoid array functional methods in puzzle hot paths

**Learning:** In constraint solvers and puzzle generators running deeply nested loops, standard JS array methods (`.filter`, `.map`, `.some`, `.every`) create significant closure allocation bottlenecks. Array spread syntax (`[...set]`) further compounds garbage collection pressure.
**Action:** Replace `Array.prototype` methods and array spread syntax with traditional `for` loops inside the hot paths of `HumanSolver.ts` and `PuzzleGenerator.ts`. Memory footprint reduction directly improves execution times during generation (e.g. Master corpus validation).
