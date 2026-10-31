## 2024-10-31 - Constraint Evaluator functional array method optimization

**Learning:** In the hot path of the constraint solver/generator (`src/puzzle/ConstraintEvaluator.ts`), using `.some` and `.every` causes significant function call overhead and closure allocations when evaluating clue matchings thousands of times per puzzle.
**Action:** Replace `.some` and `.every` with traditional `for` loops in `clueCouldMatch`, `clueMatchesBoard`, and `boardSatisfiesPuzzle` to avoid array method overhead, improving evaluator performance.
