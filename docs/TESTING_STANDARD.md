# Testing Standard
## MARO Business Platform - Quality Assurance & Test Strategy

### 1. Test Pyramid & Automation Thresholds
- **Unit Tests (Target 85%+ Coverage)**: CQRS Commands, Queries, Unit of Work, Valuation calculation functions, and Sync Engine Queue logic.
- **Integration Tests (Target 75%+ Coverage)**: Server sync API endpoints (`/api/erp/sync`), repository methods, and local storage state persistence.
- **End-to-End Tests**: Critical paths (Product creation, POS offline invoice checkout, shift closure).

---

### 2. Test Execution Commands
- **Linting & Typechecking**: `npm run lint` (`tsc --noEmit`).
- **Production Build Verification**: `npm run build`.

---

### 3. Pre-Commit Quality Gate
No code may be committed to `master` or release branches unless:
1. `npm run lint` outputs 0 errors.
2. `npm run build` succeeds cleanly.
3. Unit test suite passes with 100% green status.
