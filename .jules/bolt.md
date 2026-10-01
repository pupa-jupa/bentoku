## 2024-05-24 - Avoid higher-order array functions in hot loops

**Learning:** Found that using `.every()` and `.some()` in puzzle constraint solving loops (`clueCouldMatch`, `clueMatchesBoard`, `boardSatisfiesPuzzle`) adds massive closure allocation and execution overhead. Removing them drastically cuts test times.
**Action:** Replace `.every()`, `.some()`, and `.map()` with simple `for` loops in hot loops where execution speed is more important than line count.
