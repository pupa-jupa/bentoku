## 2024-05-18 - Avoid array functional methods in constraint evaluators

**Learning:** In highly frequent hot paths like puzzle generation and constraint solving loops (`ConstraintEvaluator.ts`), using array functional methods (`.every`, `.some`, `.map`, `.filter`) with closures causes massive memory allocations and function call overhead, leading to noticeable performance bottlenecks.
**Action:** Use traditional `for` loops instead of array methods in constraint evaluation logic (`clueCouldMatch`, `clueMatchesBoard`, `boardSatisfiesPuzzle`). Hand-inline small checks where possible and iterate over grid offsets manually.
