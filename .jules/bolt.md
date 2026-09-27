## 2025-02-18 - Optimized ConstraintEvaluator Loops
**Learning:** The puzzle solver runs millions of constraint checks during constraint solving logic. Array methods (`every`, `some`, `filter`, `map`) create closure allocations which cause significant garbage collection pauses. Changing logic over to traditional for-loops heavily mitigates this issue and avoids functional array methods overhead in high-frequency hot paths.
**Action:** Use traditional `for` loops in hot path logic, specifically within `.puzzle/` code, to avoid massive closure allocation bottlenecks.
