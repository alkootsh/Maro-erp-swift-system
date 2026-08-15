# MARO ERP - Migration & Database Schema Notes

## 1. Multi-Tenant Architecture & Schema Overview
The MARO Business Platform utilizes PostgreSQL with Drizzle ORM as its primary relational backbone.

### Core Tables & Composite Partitioning
- **`tenants`**: Tenant root entity with license and tax settings.
- **`branches`**: Multi-branch support with individual cost center and warehouse mappings.
- **`users`**: RBAC system with tenant, branch, and role associations (`developer`, `admin`, `accountant`, `cashier`, `inventory_manager`).
- **`products`**: Catalog with composite uniqueness across `(tenantId, sku)` and `(tenantId, barcode)`.
- **`accounts` & `journal_entries` & `journal_lines`**: Double-entry financial ledger enforcing balanced debit/credit sums per journal entry.
- **`invoices` & `invoice_items`**: Sales invoices with ZATCA/ETA compliance fields.
- **`pos_sessions` & `pos_transactions`**: High-performance cashier terminal sessions with Z-Report aggregates.
- **`sync_inbox` & `sync_outbox`**: Offline-first mutation queues with idempotency keys and cryptographic hash validation.

---

## 2. Environment Variables & Configuration
The following variables must be configured in `.env`:

```env
# Database Connection
DATABASE_URL=postgresql://postgres:password@localhost:5432/maro_erp

# Security & Multi-Tenancy
JWT_SECRET=your_super_secret_enterprise_jwt_key_here
ENABLE_MULTI_TENANCY=true

# AI Capabilities (Server-Side Only)
GEMINI_API_KEY=your_gemini_api_key_here

# Runtime
PORT=3000
NODE_ENV=production
```

---

## 3. Database Migration Steps
To apply schema updates:
```bash
# Generate migration files
npm run db:generate

# Push schema directly to connected database
npm run db:push
```
