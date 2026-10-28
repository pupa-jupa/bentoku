## 2024-10-28 - Missing Content Security Policy (CSP)

**Vulnerability:** The application was missing a Content Security Policy (CSP), leaving it potentially vulnerable to Cross-Site Scripting (XSS) and other code injection attacks.
**Learning:** The project relies on Vite for development (HMR) and Phaser for rendering. This architecture requires specific CSP directives that are less strict than a standard policy: `unsafe-inline` is needed for both `script-src` and `style-src`, `ws: wss:` must be allowed in `connect-src` for HMR, and `data:` and `blob:` are required in `img-src` for internal canvas operations.
**Prevention:** Ensure a base CSP is always included in `index.html` that balances security with the specific technical requirements of the frontend tooling and game engine.
