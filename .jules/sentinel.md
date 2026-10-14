## 2024-05-24 - [Fix insecure randomness in puzzle seed generation]

**Vulnerability:** Found `Math.random()` being used as a fallback for puzzle seed generation when `crypto` was undefined.
**Learning:** Even as a fallback, using `Math.random()` for things like seeds could introduce predictability which is a security risk where unpredictable behavior is required by design. The Web Crypto API is widely supported.
**Prevention:** Strictly enforce `globalThis.crypto.getRandomValues()` and throw an error when unavailable, instead of using insecure fallbacks.
