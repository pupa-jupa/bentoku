## 2025-01-14 - Functional array loops in constraint propagation cause closure allocation bottlenecks

**Learning:** Using `Array.prototype.every` and `Array.prototype.some` within deeply nested, high-frequency constraint solvers like `clueCouldMatch` and `clueMatchesBoard` creates a massive amount of inline closure objects, slowing down V8's GC loop when generating puzzles.
**Action:** Always replace `.some`, `.every`, `.filter`, and `.map` with traditional `for` loops within the hot paths of any constraint evaluator, human solver, or deduction logic, maintaining standard early return behaviors via `break` or inline checks.
