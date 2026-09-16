## 2024-05-15 - [Avoid functional array methods in hot paths]
**Learning:** [In puzzle generators and solvers that process thousands of states, functional array methods like `.every()`, `.some()`, `.filter()`, and `.map()` are massive performance bottlenecks due to closure allocation and function call overhead.]
**Action:** [Replace these with traditional `for` loops in extremely hot paths like `clueCouldMatch` and `solveHumanly`'s main deductions to significantly boost execution speed (reduced generation time from ~3000ms to ~2200ms in master puzzle gen).]
