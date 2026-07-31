# Code Review Checklist
## MARO Business Platform - Technical Review Guidelines

### 1. Architectural Compliance
- [ ] Does the change preserve the **Offline-First PostgreSQL Architecture**?
- [ ] Is operational ERP data strictly isolated from Firestore?
- [ ] Are business logic mutations encapsulated inside CQRS Commands & Unit of Work?
- [ ] Are read operations segregated into CQRS Queries?

---

### 2. Quality & Security Checklist
- [ ] TypeScript compiles cleanly with zero errors (`npm run lint`).
- [ ] Code formatted according to `CODING_STANDARDS.md` and `NAMING_CONVENTIONS.md`.
- [ ] All PostgreSQL queries use parameter placeholders (No raw string concatenation).
- [ ] All user inputs validated with Zod schemas.
- [ ] No `any` types used.
- [ ] No `TODO`, placeholder code, or mock stubs present.
- [ ] Documentation updated (`CHANGELOG.md`, `PROJECT_STATUS.md`).
