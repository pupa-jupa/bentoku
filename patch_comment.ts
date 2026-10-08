import fs from 'fs';
let content = fs.readFileSync('src/puzzle/HumanSolver.ts', 'utf8');

content = content.replace(/const singletonBefore = domains.filter\(\(domain\) => domain.size === 1\).length;[\s\n]*for \(const state of offsetStates\) {/, `const singletonBefore = domains.filter((domain) => domain.size === 1).length;

    // PERFORMANCE OPTIMIZATION:
    // Avoiding functional array methods (filter, some, every) and array spread syntax
    // in this high-frequency hot path to eliminate massive closure/memory allocations
    // and subsequent garbage collection pauses.
    for (const state of offsetStates) {`);

fs.writeFileSync('src/puzzle/HumanSolver.ts', content);
