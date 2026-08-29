## 2024-05-18 - Puzzle Solver Cache
**Learning:** Caching clue offsets in \`ConstraintEvaluator\` based on width and height prevents repeated identical object/array allocations during deep solver searches, noticeably reducing garbage collection pressure and execution time for the master corpus.
**Action:** Apply memoization/caching to loops and expensive lookup operations.
