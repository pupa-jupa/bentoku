## 2025-03-01 - Prevented Weak Random Number Generation and Added CSP

**Vulnerability:** The `createRandomSeed` function had a fallback to `Math.random()` when generating random seeds. Additionally, the application lacked a Content-Security-Policy (CSP) meta tag, making it vulnerable to XSS.
**Learning:** `Math.random()` is not cryptographically secure and can generate predictable values. In a game that relies heavily on random seeds, predictable seeds undermine the integrity of the puzzles. Furthermore, a strict CSP is essential to mitigate the impact of potential XSS vulnerabilities by restricting the sources of executable scripts and stylesheets.
**Prevention:** Always enforce the use of `globalThis.crypto.getRandomValues()` for seed generation and avoid non-secure fallbacks. Ensure that all HTML entry points include a restrictive CSP that aligns with the application's architecture (e.g., allowing 'unsafe-inline' only where strictly necessary for the framework, like Phaser/Vite).
