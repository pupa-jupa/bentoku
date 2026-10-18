## 2024-06-25 - Avoid map and sort on every match iteration

**Learning:** In highly called functions like `matchingExists` inside the HumanSolver, using array methods like `.map().sort().map()` allocates closures and intermediary arrays constantly.
**Action:** Replace map chaining with traditional for loops and pre-allocated arrays where the bound is known to decrease garbage collection pressure and allocation overhead.
