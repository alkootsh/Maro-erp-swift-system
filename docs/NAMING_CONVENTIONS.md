# Naming Conventions
## MARO Business Platform - Enterprise System Naming Standard

### 1. File & Directory Naming
- **React Components**: PascalCase (e.g., `SyncEngineStatusBadge.tsx`, `ProductFormModal.tsx`).
- **Utilities & Helpers**: camelCase (e.g., `maroSyncEngine.ts`, `productValidation.ts`).
- **CQRS Commands & Queries**: camelCase files with noun/verb structure (e.g., `commands.ts`, `queries.ts`).
- **Documentation & Reports**: UPPERCASE_SNAKE_CASE in root (e.g., `CHANGELOG.md`) and `/docs/` (e.g., `DATABASE_CONVENTIONS.md`).
- **Database Tables & Columns**: `snake_case` plural for tables (`products`, `inventory_movements`, `invoices`) and singular for columns (`unit_price`, `cost_price`).

---

### 2. Code Identifier Naming
- **Classes**: PascalCase (e.g., `CreateProductCommand`, `UnitOfWork`, `MaroSyncEngine`).
- **Interfaces & Types**: PascalCase prefixed with descriptive entity names without `I` prefix (e.g., `ProductMaster`, `SyncOperation`, `InvoiceItem`).
- **Functions & Methods**: camelCase starting with action verb (e.g., `calculateInventoryValue()`, `processSyncQueue()`).
- **Constants & Enums**: UPPER_SNAKE_CASE for constants, PascalCase for Enum names, and UPPER_SNAKE_CASE for Enum values.
  ```typescript
  export enum TransactionStatus {
    DRAFT = 'DRAFT',
    APPROVED = 'APPROVED',
    CANCELLED = 'CANCELLED'
  }
  ```
