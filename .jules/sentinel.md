## 2024-05-18 - Enforce Secure Random Number Generation for Seeds

**Vulnerability:** Insecure randomness in puzzle seed generation (`Math.random()` fallback).
**Learning:** `Math.random()` is predictable and unsuitable for security-sensitive logic like seed generation. A fallback was present which could be exploited to predict seeds.
**Prevention:** Strictly enforce `globalThis.crypto.getRandomValues()` for non-visual/seed logic and avoid `Math.random()` outside of visual elements.
