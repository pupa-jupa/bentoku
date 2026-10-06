## 2024-10-27 - Optimizing ConstraintEvaluator using standard loops

**Learning:** Codebase-specific performance pattern: Avoid functional array methods (\`.every\`, \`.some\`, \`.filter\`, \`.map\`) in high-frequency hot paths like puzzle generation and constraint solving loops. Using traditional \`for\` loops avoids massive closure allocation bottlenecks.
**Action:** Use standard \`for\` loops for operations running many times in performance critical paths.
