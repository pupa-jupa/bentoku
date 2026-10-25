## 2025-10-24 - [Add Content Security Policy]

**Vulnerability:** Missing Content Security Policy allowing unmitigated XSS.
**Learning:** Vite and Phaser require 'unsafe-inline' for scripts/styles and ws/wss for connect-src to function correctly in development (HMR) and canvas rendering. 'data:' is also needed for internal image/blob loading.
**Prevention:** Ensure future CSP additions account for framework-specific execution profiles instead of blindly applying overly restrictive directives.
