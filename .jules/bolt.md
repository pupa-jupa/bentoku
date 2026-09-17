## 2024-05-20 - Array methods vs For loops in puzzle generation
**Learning:** High-frequency functional array methods (`.some`, `.every`) create significant closure allocation bottlenecks when used inside tight constraint solving loops (like `clueCouldMatch` and `solveHumanly`).
**Action:** Always use traditional `for` loops in puzzle constraint evaluation and generation hot paths to avoid closure overhead and allow early returns without allocating functions.
