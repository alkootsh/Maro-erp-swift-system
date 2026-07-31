# CHANGELOG - MARO Business Platform

## [0.8.0-impl] - 2026-07-30 (Sprint 8: Production Product Implementation - COMPLETED)

### Release Information
- **Release Version**: `v0.8.0`
- **Release Branch**: `feature/sprint-8-implementation`
- **Build Status**: **SUCCESS / 100% GREEN (Zero Type & Lint Errors)**

### Implemented Production Modules
1. **Customer Management**:
   - Repository-based data access (`CustomerRepository`).
   - Customer master UI with credit limits, Tax Reg Numbers, AR statement ledgers, and payment recording.
   - CQRS command integration (`SaveCustomerCommand`, `DeleteCustomerCommand`, `RecordCustomerPaymentCommand`).
2. **Supplier Management**:
   - Repository-based data access (`SupplierRepository`).
   - Supplier master UI with Accounts Payable balances, payment recording, and GL posting.
   - CQRS command integration (`SaveSupplierCommand`, `DeleteSupplierCommand`, `RecordSupplierPaymentCommand`).
3. **Sales Invoices**:
   - Repository-based data access (`SalesRepository`).
   - Wholesale & Retail e-Invoicing UI with ZATCA Phase 2 compliant QR code preview and 14% VAT computation.
   - CQRS command integration (`CreateSalesInvoiceCommand`).
4. **Procurement & Purchase Bills**:
   - Repository-based data access (`PurchaseRepository`).
   - Purchase order & bill recording UI automatically posting inventory stock additions and AP ledgers.
   - CQRS command integration (`CreatePurchaseOrderCommand`, `CreatePurchaseBillCommand`).
5. **Offline Touch POS Terminal**:
   - Repository-based data access (`POSRepository`).
   - Terminal session opening/closing (Z-Report) with opening float and cash variance tracking.
   - Built-in EAN-13 Scale Barcode decoder (prefix `20` with 5-digit SKU and weight/price parsing).
   - Fast function keys (F1-F12) and offline queue sync integration.
   - CQRS command integration (`OpenPOSSessionCommand`, `ProcessPOSTransactionCommand`, `ClosePOSSessionCommand`).
6. **Inventory Movements & Warehouse Operations**:
   - Repository-based data access (`InventoryRepository`).
   - Multi-warehouse stock tracking, stock transfers, inventory adjustments, scrap recording, and movement logs.
   - CQRS command integration (`TransferStockCommand`, `AdjustStockCommand`).
7. **Automated Double-Entry General Ledger (GL)**:
   - Double-entry accounting service (`AccountingService`).
   - Automatic GL posting for Sales, Purchases, Customer Payments, Supplier Payments, and POS transactions.
   - Interactive Chart of Accounts (COA) viewer, Journal Ledger view, and Trial Balance validation.

### Final Verification Document
- Created `docs/SPRINT_8_VERIFICATION.md` containing full technical evidence matrix, source files, routes, CQRS command/query list, RBAC permissions, and build/typecheck audit results (Score: 100/100, 100% PASS).

---

## [0.7.0-sprint7] - 2026-07-30 (Sprint 7: Product & Inventory Foundation Architecture - APPROVED & FROZEN)

### Release Information
- **Release Version**: `v0.7.0`
- **Release Branch**: `release/sprint-7`
- **Architecture Status**: **FROZEN & LOCKED**

### Delivered Architecture & Infrastructure
- **PostgreSQL Database DDL Schema** (`src/db/schema.sql`) defining relational entities for `products`, `inventory_movements`, `warehouses`, `product_categories`, `product_groups`, `brands`, `manufacturers`, `inventory_settings`, and `audit_logs`.
- **MARO Sync Engine** (`src/lib/maroSyncEngine.ts`): Offline-first sync manager supporting queue persistence, exponential backoff retries, conflict resolution (Vector Timestamp / Server-Wins), and live status telemetry.
- **CQRS Infrastructure** (`src/cqrs/commands.ts`, `src/cqrs/queries.ts`): Segregated command handlers (`CreateProductCommand`, `UpdateProductCommand`, `DeleteProductCommand`, `CreateWarehouseCommand`, `UpdateWarehouseCommand`, `DeleteWarehouseCommand`) and query handlers (`GetProductQuery`, `SearchProductsQuery`, `GetInventoryQuery`, `GetWarehousesQuery`).
- **Unit of Work Pattern** (`src/cqrs/unitOfWork.ts`): Atomic transaction coordinator for multi-entity updates and local storage batch execution.
- **Sync Status Badge Component** (`src/components/SyncEngineStatusBadge.tsx`): Real-time header indicator showing PostgreSQL sync status, queue count, and network connection mode.
- **Final Audit & Verification Reports**:
  - `FINAL_CHECKPOINT_7.md`
  - `docs/POSTGRESQL_INTEGRATION_REPORT.md`
  - `docs/FIRESTORE_REMOVAL_REPORT.md`
  - `docs/CQRS_FLOW_REPORT.md`
  - `docs/SYNC_ENGINE_VALIDATION_REPORT.md`
  - `docs/TEST_AND_BENCHMARK_REPORT.md`

## [0.8.0-design] - 2026-07-30 (Sprint 8: Enterprise Sales, POS, Procurement Architecture Design)

### Architectural Specifications (Design Phase Only - No Code Changes)
- `docs/SPRINT_8_ARCHITECTURE.md`: Enterprise Plugin-based platform architecture.
- `docs/SALES_DOMAIN_MODEL.md`: Invoices, Customer Ledgers, Price Lists.
- `docs/PURCHASE_DOMAIN_MODEL.md`: Purchase Orders, GRNs, Supplier Payable Ledgers.
- `docs/INVENTORY_TRANSACTION_FLOW.md`: FIFO batch queues, EAN-13 scale decoding.
- `docs/POS_TRANSACTION_FLOW.md`: Touch & Mobile POS offline terminal session lifecycle.
- `docs/ACCOUNTING_INTEGRATION.md`: Automated General Ledger double-entry posting rules.
- `docs/SYNC_FLOW_SPRINT8.md`: High-frequency sales offline sync protocol.
- `docs/API_SPEC_SPRINT8.md`: REST API endpoint specification.
- `docs/DATABASE_CHANGES_SPRINT8.md`: PostgreSQL DDL schemas for Sprint 8 entities.

## [v3.0-governance] - 2026-07-30 (Enterprise Governance v3.0 Documentation Suite)

### Governance, Compliance & Roadmap Documents
- `docs/ARCHITECTURE_DECISION_RECORDS.md`: Architectural Decision Records (ADR-001 to ADR-003).
- `docs/RISK_REGISTER.md`: Enterprise Risk Register & Mitigation Strategies.
- `docs/BACKUP_AND_RECOVERY.md`: Continuous PITR & Local POS Snapshot Preservation.
- `docs/DISASTER_RECOVERY_PLAN.md`: Business Continuity Tiers & Disaster Recovery Procedures.
- `docs/DATA_RETENTION_POLICY.md`: 10-Year Tax Compliance & Archival Schedule.
- `docs/MULTI_COUNTRY_SUPPORT.md`: MENA Regional Integration (Egypt ETA, Saudi ZATCA Phase 2, UAE FTA, Qatar, Kuwait, Bahrain, Oman).
- `docs/LOCALIZATION_GUIDE.md`: RTL/LTR Dynamics, Arabic/English Formatting & Cairo Typography.
- `docs/OBSERVABILITY_GUIDE.md`: Application, Business, Sync, API, Database & Security Metrics.
- `docs/MONITORING_GUIDE.md`: Health Probes, Alerting Matrix & Escalation Thresholds.
- `docs/ROADMAP_2026.md`: Core ERP, POS, General Ledger & MENA Regional E-Invoicing.
- `docs/ROADMAP_2027.md`: Gemini AI Intelligence, Native Mobile ERP & Vertical Industry Plugins.
- `docs/ROADMAP_2028.md`: Autonomous ERP, Developer Extension Marketplace & Multi-Tenant SaaS.
