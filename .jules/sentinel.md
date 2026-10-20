## 2025-02-20 - Add Content Security Policy

**Vulnerability:** Missing Content Security Policy (CSP) headers in `index.html`.
**Learning:** By default, Vite/Phaser setups omit strict CSPs, opening up potential attack vectors for Cross-Site Scripting (XSS) if untrusted input is ever rendered into the DOM. While some frameworks require 'unsafe-inline' or 'unsafe-eval' to work correctly, providing a baseline restrictive CSP establishes a strong foundation of defense-in-depth and blocks unknown external origins.
**Prevention:** Always ensure frontend applications explicitly define a Content Security Policy as early as possible in development, limiting fetch destinations (`connect-src`), scripts (`script-src`), and objects (`object-src`).
