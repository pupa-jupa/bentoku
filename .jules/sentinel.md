## 2026-10-24 - Missing Content Security Policy (CSP) in Vite/Phaser App

**Vulnerability:** The application was lacking a Content Security Policy (CSP) meta tag in `index.html`.
**Learning:** For static, frontend-only browser games using Vite and Phaser, a CSP is a crucial layer of defense in depth against XSS, especially since there is no backend to rely on for protection. The CSP must be carefully crafted to include `'unsafe-inline'` for both `script-src` and `style-src`, and `ws: wss:` in `connect-src` to allow Vite's Hot Module Replacement (HMR) to function correctly during development.
**Prevention:** Always include a strictly scoped but functional CSP meta tag in the `index.html` of Vite/Phaser projects, ensuring it accommodates the specific requirements of the build tool and game engine.
