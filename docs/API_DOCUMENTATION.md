# MARO ERP - API Documentation (v3.0)
## Master Enterprise Protocol v3.0

### Architecture Standards
- **Protocol**: RESTful JSON over HTTPS / Local Express API server (`server.ts`).
- **Authentication**: JWT Bearer tokens + RBAC Permission Verification.
- **Port & Ingress**: Port 3000 (Internal & Container Ingress).
- **Offline Protocol**: Client-side CQRS Command Bus routes requests to `MaroSyncEngine` when offline, queueing sync payloads for server reconciliation.

### Core Endpoint Categories
1. `/api/health`: System health and PostgreSQL DB connectivity check.
2. `/api/auth`: Login, Token Refresh, Session Validation.
3. `/api/products`: Product Master CRUD, Bulk Import, Barcode Lookups.
4. `/api/inventory`: Warehouse Stock Adjustment, Transfers, Batch Tracking.
5. `/api/sales`: POS Invoices, Orders, Returns, Customer Balances.
6. `/api/purchases`: Purchase Orders, Receiving Vouchers, Vendor Bills.
7. `/api/accounting`: Journal Entries, Ledger Queries, Trial Balance, Financial Statements.
8. `/api/sync`: Bi-directional offline sync queue upload & conflict resolution.
