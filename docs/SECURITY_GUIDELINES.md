# Security Guidelines
## MARO Business Platform - Cyber Security Architecture

### 1. Authentication & Session Management
- **Token Infrastructure**: Short-lived JSON Web Tokens (JWT) signed with HS256/RS256 algorithms. Tokens expire in 15 minutes; refresh tokens are stored in `HttpOnly`, `SameSite=Strict`, `Secure` cookies.
- **Firebase Auth Integration**: Used exclusively for identity verification and multi-factor authentication (MFA) challenges.

---

### 2. Role-Based Access Control (RBAC)
- Fine-grained permission strings structured as `module:action` (e.g. `inventory:create`, `invoices:approve`, `reports:view`).
- Middleware checks user permissions against assigned role prior to executing any CQRS Command.

---

### 3. Data Protection & Input Sanitization
- **SQL Injection Defense**: Prepared statements with explicit parameter placeholders (`$1`, `$2`) are mandatory for all PostgreSQL queries. Raw SQL concatenation is strictly forbidden.
- **XSS Mitigation**: React automatic HTML escaping enabled; user rich-text fields sanitized via DOMPurify before rendering.
- **CSRF Protection**: Anti-CSRF double-submit token cookie validation on all non-GET API endpoints.
