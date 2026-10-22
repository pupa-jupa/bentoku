## 2024-05-24 - Performance Optimizations for Constraint Solvers

**Learning:** The constraint solvers (`HumanSolver`, `PuzzleSolver`, and `PuzzleGenerator`) are bottlenecked by heavy functional array operations inside high-frequency loops. Specifically, using `.every`, `.some`, `.filter`, `.map`, and array spreading (`[...]`) within inner loops leads to massive closure allocation and garbage collection overhead, especially in deep loops evaluating thousands of board configurations.
**Action:** Replace all usage of functional array methods and array spreading inside hot constraint paths with traditional `for` loops. Mutate variables or arrays directly where possible instead of mapping/filtering into new arrays, and early exit using `break` or `continue` when evaluating sets of conditions.
