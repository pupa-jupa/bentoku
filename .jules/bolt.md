## 2024-05-23 - Avoid Functional Array Methods in Constraint Solving Loops

**Learning:** In highly recursive or tight inner loop paths, like the puzzle generation and constraint checking logic in `src/puzzle/ConstraintEvaluator.ts`, using functional array methods such as `.some()` and `.every()` causes heavy closure allocation overhead and significantly affects performance.
**Action:** Always prefer standard `for` loops with early breaks over `.some()`, `.every()`, `.filter()`, and `.map()` in performance-critical loops such as constraint solvers.
