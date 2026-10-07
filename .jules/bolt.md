## 2023-10-27 - [Avoid Array Methods in Solver Hot Paths]

**Learning:** [Using functional array methods (`.some`, `.every`, `.filter`) inside the recursive puzzle solver and constraint evaluator (e.g. `clueCouldMatch`, `candidatesFor`) creates massive closure allocation bottlenecks during puzzle generation. Profiling showed that replacing these with manual nested `for` loops provides over a 3x speedup under heavy loads.]
**Action:** [When modifying deep recursive search logic or constraint evaluators in this codebase, avoid allocating closures and arrays (e.g., via `getClueOffsets`). Always use traditional, manual `for` loops for iteration.]
