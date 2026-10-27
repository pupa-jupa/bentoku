## 2024-05-19 - Optimize constraint evaluator hot paths

**Learning:** Using functional array methods (`.some`, `.every`, `.filter`, `.map`) inside frequently called constraint evaluation hot paths (like `clueCouldMatch` and `clueMatchesBoard` during puzzle generation) creates a massive bottleneck due to excessive memory allocations and GC pauses caused by closure creation on every call.
**Action:** Replace array methods with traditional `for` loops and manually inline short helper functions (like `pieceMatchesCell`) in performance-critical code paths that run millions of times to significantly reduce execution time and memory pressure.
