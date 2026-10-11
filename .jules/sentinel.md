## 2026-10-11 - [RNG & CSP Defenses]
**Vulnerability:** Found insecure fallback to Math.random() for puzzle generation and lack of Content Security Policy.
**Learning:** Browser environments should not fallback silently to Math.random() when crypto is unavailable for features that expect strong randomness, and missing a basic CSP leaves static apps vulnerable.
**Prevention:** Strictly require globalThis.crypto.getRandomValues() and always define a baseline CSP in index.html to minimize XSS risks.
