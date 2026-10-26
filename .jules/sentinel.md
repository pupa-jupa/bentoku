## 2024-05-18 - Content Security Policy for Vite + Phaser Apps

**Vulnerability:** Missing Content-Security-Policy (CSP) headers leaving the app vulnerable to XSS and injection.
**Learning:** Adding a CSP header to static SPAs using Vite and Phaser requires specific accommodations. Vite's development HMR requires `ws:`/`wss:` in `connect-src`. Both Vite and Phaser heavily rely on inline styles and scripts, necessitating `'unsafe-inline'` for `style-src` and `script-src`. Additionally, Phaser uses canvas rendering and internal blob/data URLs, requiring `data:` and `blob:` in `img-src`. Overly restrictive CSPs will break the application architecture.
**Prevention:** Always implement a baseline CSP that balances security with the framework's operational requirements. When using Phaser and Vite, use the known-safe directives: `default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'self' ws: wss:;`
