## 2024-05-23 - Closure Allocation Bottleneck in Constraint Solvers
**Learning:** Functional array methods (`.some`, `.every`) create excessive closure allocations when used in high-frequency hot paths like puzzle generation and constraint solving loops (`clueCouldMatch`, `clueMatchesBoard`). This is a specific performance anti-pattern in this architecture, leading to massive memory churn.
**Action:** Always prefer standard `for` loops and inline offset calculations instead of generating arrays of offsets and mapping over them in critical paths like constraint evaluation.
