## 2024-10-24 - Avoid Functional Array Methods in High-Frequency Hot Paths

**Learning:** In Phaser/TypeScript games, using functional array methods like `.every`, `.some`, `.filter`, and `.map` in extremely high-frequency hot paths (like puzzle constraint solving loops) causes massive closure allocation bottlenecks. This forces the garbage collector to work constantly and causes severe performance degradation and frame drops.
**Action:** Replace functional array iteration methods with traditional `for` loops in critical hot paths. Explicitly declare counter variables, reuse arrays where possible instead of mapping over them, and return early out of loops instead of using `.some` and `.every`.
