## 2025-02-18 - Avoid Functional Array Methods in High-Frequency Hot Paths

**Learning:** Heavy use of functional array methods (like `.every`, `.some`, `.filter`, `.map`) in hot paths—specifically constraint solving loops and puzzle generation loops—causes significant performance degradation due to massive closure allocation bottlenecks and function call overhead.
**Action:** Use traditional `for` loops and manually inline checking logic in highly repetitive solver/generator paths to prevent large garbage collection pauses and avoid memory allocations for callbacks.
