# Security Report - Swift ERP

- **Authentication**: Firebase Authentication.
- **Authorization**: Role-Based Access Control (RBAC) implemented in `firestore.rules`.
- **API Keys**: Correctly proxied server-side.
- **Firestore Rules**:
  - `isAuthenticated()` check is used universally.
  - `isAdmin()` helper function uses both user collection roles and hardcoded admin email.
- **Concerns**:
  - `isValid` helper functions in rules are good but should be strictly maintained.
  - Potential for unauthorized users to perform CRUD operations if rules are loose (e.g., `suppliers`, `transactions` rules are very permissive currently).
