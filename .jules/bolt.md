## 2024-05-19 - Replace functional array methods in ConstraintEvaluator

**Learning:** The constraint solver loops heavily in `ConstraintEvaluator.ts` using `.every` and `.some`, which creates massive closure allocation bottlenecks during puzzle generation and solving.
**Action:** Replace `clueCouldMatch`, `clueMatchesBoard`, and `boardSatisfiesPuzzle` to use traditional `for` loops instead to prevent massive closure allocation bottlenecks in hot paths.
