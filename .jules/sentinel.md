## 2026-11-03 - Missing Content Security Policy
**Vulnerability:** The application is missing a Content Security Policy (CSP), making it vulnerable to XSS and data injection attacks.
**Learning:** The default Vite and HTML setup does not include a CSP header or meta tag by default.
**Prevention:** Always ensure a restrictive CSP is added to index.html to serve as a defense in depth against client-side vulnerabilities.
