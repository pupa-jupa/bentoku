## 2024-11-01 - Content Security Policy missing

**Vulnerability:** Missing Content Security Policy in index.html.
**Learning:** The project's index.html implements a Content Security Policy (CSP). Due to Vite and Phaser requirements, it must allow 'unsafe-inline' for script-src and style-src, ws: wss: in connect-src for Vite's development HMR, and data: and blob: in img-src for internal canvas rendering and image loading.
**Prevention:** Always add a CSP with necessary allowances for Vite and Phaser.
