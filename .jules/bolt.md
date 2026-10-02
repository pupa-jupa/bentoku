## 2024-05-14 - Closure allocation bottlenecks in solver hot loops

**Learning:** High-order functional array methods (`.some`, `.every`) create significant performance drag via closure allocations when used deeply within recursive constraint-solving loops (e.g., `clueCouldMatch` evaluating thousands of states).
**Action:** Replace functional array iteration methods with traditional `for` loops in hot path solver and evaluator files, ensuring to preserve early-return logic.
