## 2023-11-05 - Content Security Policy for Phaser and Vite

**Vulnerability:** Missing Content Security Policy (CSP) leaving the application vulnerable to basic Cross-Site Scripting (XSS).
**Learning:** Due to Vite and Phaser requirements, CSP must allow 'unsafe-inline' for script-src and style-src, ws: wss: in connect-src for Vite's development HMR, data: and blob: in img-src for internal canvas rendering and image loading, and data: and blob: in media-src to ensure audio works.
**Prevention:** Always implement a baseline CSP in index.html for static frontend applications and explicitly maintain necessary allowances for Phaser canvases and Vite tooling.
