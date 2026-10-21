## 2025-02-18 - Constraint Evaluator functional array methods optimization

**Learning:** In the `ConstraintEvaluator.ts`, the solver loops evaluate conditions millions of times. Functional array methods like `some` and `every` cause massive closure allocations and slow down the hot path of puzzle constraint evaluation.
**Action:** Replaced functional loops (`some` and `every`) with traditional `for` loops in `clueCouldMatch`, `clueMatchesBoard`, and `boardSatisfiesPuzzle`. This avoided closures and resulted in a noticeable decrease in test duration (from ~214s down to ~197s overall on the test suite).
