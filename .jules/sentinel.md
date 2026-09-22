## 2025-01-23 - Add Content Security Policy
**Vulnerability:** Missing Content Security Policy (CSP)
**Learning:** Client-side static games without backends still benefit from defense in depth. A CSP meta tag prevents the execution of unauthorized scripts and limits the sources of assets, reducing the impact of potential future XSS vulnerabilities.
**Prevention:** Always include a strict CSP meta tag in the main HTML entry point of client-side web applications.
