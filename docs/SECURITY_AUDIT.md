# MARO ERP - RC1 Security & Audit Review
## Master Enterprise Protocol v3.0

### Security Audit Assessment

#### 1. Authentication & Session Security
- **JWT Protection**: Secure HTTP header token management with automatic expiration handling.
- **Firebase Auth Isolation**: Used strictly for user authentication, identity verification, and push notifications. Zero ERP data stored in Firebase.

#### 2. Authorization & RBAC
- **Granular Permissions**: System enforces screen-level, button-level, column-level, and action-level permission gates (`canUserExecute`).
- **Hidden Developer Account**: Protected developer account maintained with elevated administrative diagnostic rights.

#### 3. Audit Logging
- **Immutable Log Engine**: Every create, update, delete, approval, or balance adjustment action is logged into `audit_logs`.
- **Captured Metadata**: User ID, Timestamp, Action Name, Entity Type, Entity ID, Branch ID, Company ID, Before State, After State.

#### 4. Data Protection & Injection Guards
- **Parametrized PostgreSQL Queries**: All database interactions use ORM query builders or parametrized statements; zero raw string SQL interpolation.
- **XSS Protection**: Strict React JSX escaping prevents script injection.
- **Input Sanitization**: Centralized Zod schemas enforce type safety and input boundaries before data hits domain layers.
