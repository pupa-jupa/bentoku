## 2026-09-28 - Refactor puzzle constraint evaluator away from functional array methods

**Learning:** Functional array methods (`.some`, `.every`) create significant overhead (massive closure allocation and callback execution) when used in extremely high-frequency hot paths, such as puzzle constraint solving and generation logic that run millions of times per puzzle generation.
**Action:** Replace `.some` and `.every` with traditional `for` loops in performance-critical code paths to avoid closure allocation bottlenecks, especially when nesting multiple loops as in the `ConstraintEvaluator` clue matching functions.
