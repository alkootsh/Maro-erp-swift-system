# MARO Business Platform v4.0 - Representative Collections & Custody Architecture
## وثيقة التصميم الهندسي والمحاسبي لدورة عهد وتحصيلات المندوبين والتسويات النقدية

This document details the blueprint for an offline-first, enterprise-grade, and double-entry compliant **Representative Collections, Custody & Treasury Handover** subsystem. 

---

## 1. Architectural Blueprint Overview

The fundamental accounting principle driving this design is:
$$\text{Payment Applied} \neq \text{Cash Deposited}$$

When a representative collects a payment from a customer in the field, the customer's outstanding balance must be reduced instantly to maintain credit goodwill, but **the company's central liquid cash must not increase** until the representative physically hands over and verifies the cash at the Treasury. 

The cash flow trajectory is modeled as:
$$\text{Customer Receivable} \longrightarrow \text{Representative Custody} \longrightarrow \text{Treasury Cash}$$

---

## 2. Comprehensive Analysis of Current State

### A. Current Payment Architecture
Currently, when wholesale invoices or sales orders are paid, the payment is recorded directly against the invoice (`paidAmount`, `dueAmount`), immediately debiting Cash on Hand (`11100`) or POS Cash Clearing (`11110`). There is no intermediary holding state or custody buffer.

### B. Current Accounting Architecture
MARO possesses a powerful double-entry accounting engine (`FinanceEngine` in `/src/services/db/financeEngine.ts` and `/src/services/accountingService.ts`). The Chart of Accounts contains standard accounts:
- `11100` (Cash on Hand)
- `11200` (Accounts Receivable)
- `11300` (Inventory Asset)
- `41100` (Wholesale Revenue)
- `51100` (COGS)

The journal system requires strict balancing ($\sum \text{Debit} = \sum \text{Credit}$) before saving transactions in `journal_entries` and `journal_lines`.

### C. Current Treasury Architecture
There are no dedicated Treasury or vault entities. Cash movements go directly to the general `11100` account. Cashier sessions exist for POS terminals (`pos_sessions`) but do not cover field sales representatives.

### D. Current Customer Balance Logic
Customer balances (`currentBalance`) are stored on the `customers` table and updated via `CustomerRepository.addLedgerEntry` or database transactions. 

### E. Current Sales/Invoice Architecture
Sales invoices are logged with type (`RETAIL`, `WHOLESALE`, `POS`) and status (`DRAFT`, `APPROVED`, `PAID`, `PARTIALLY_PAID`, `CANCELLED`). 

### F. Current Inventory Architecture
Inventory deductions occur instantly upon wholesale invoice approval or retail checkouts via `stock_ledger` entries.

### G. Existing Tables
- `tenants`, `branches`, `users`, `chart_of_accounts`, `journal_entries`, `journal_lines`, `products`, `warehouses`, `stock_ledger`, `customers`, `suppliers`, `sales_invoices`, `sales_invoice_lines`, `purchase_invoices`, `pos_sessions`.

### H. Existing APIs
- `GET /api/erp/finance/accounts`
- `POST /api/erp/finance/journal`
- `GET/POST /api/erp/inventory/products`
- `GET/POST /api/erp/sales/invoices`
- `POST /api/erp/pos/checkout`
- `POST /api/erp/sync`

### I. Existing Payment/Accounting Functions
- `AccountingService.postJournalEntry` (Local Client Sync-Store)
- `FinanceEngine.postJournalEntry` (Server-side Postgres Transaction)
- `AccountingService.postSalesInvoiceGL` (Automated invoice double-entries)

### J. Existing Audit Trail
Saves entries under `audit_logs` using standard schema-agnostic key-value formats.

### K. Existing RBAC
Tenant segregation is resolved server-side through `resolveTenantContext(req)`. Roles are assigned in the `users` table.

---

## 3. Proposed Custody & Treasury Integration Design

### L. Proposed Custody Architecture
To isolate funds in transit, we introduce a new Asset account in the Chart of Accounts:
- **`11120` - Representative Custody (عهود وتحصيلات المندوبين)**: Acts as an intermediary asset account.
- **`11125` - Representative Shortages (ذمم عجز المندوبين)**: Receivables account for unapproved shortages.
- **`41400` - Cash Surplus Overage (زيادات وفروقات الخزينة)**: Income account for surplus cash.

### M. Proposed Custody State Machine
```
   [OPEN] ──(Collector receives cash)──> [PENDING_VERIFICATION]
                                                  │
                      ┌───────────────────────────┼───────────────────────────┐
                      ▼                           ▼                           ▼
          [SETTLED (Perfect Match)]     [SHORTAGE (Deficit)]        [SURPLUS (Overage)]
                      │                           │                           │
                      └───────────────────────────┼───────────────────────────┘
                                                  ▼
                                         [CLOSED / RESOLVED]
```

#### Detailed State Descriptions:
1. **`OPEN`**: Custody is created. Cash is officially in the hands of the representative.
2. **`PENDING_VERIFICATION`**: Representative submits a handover request. Treasury officer must count and confirm receipt.
3. **`SETTLED`**: Verified cash matches expected cash exactly.
4. **`SHORTAGE`**: Collected amount is less than expected. Triggers investigative workflows.
5. **`SURPLUS`**: Collected amount is more than expected. Logged as overage revenue or deposit.
6. **`DISPUTED`**: Discrepancy between Representative and Treasurer.
7. **`OVERDUE`**: Exceeded `Maximum Custody Duration` setting (e.g., 24 hours).

---

## 4. Proposed Accounting Entries (Double-Entry Specifications)

### Scenario: Invoice issued for 10,000 EGP, 6,000 EGP collected in Cash by Representative.

#### Step 1: Invoice Booking (Sales Engine)
- **Debit** `11200` (Accounts Receivable) : **10,000**
- **Credit** `41100` (Wholesale Revenue) : **8,771.93**
- **Credit** `21400` (VAT Payable) : **1,228.07**

#### Step 2: Field Collection by Representative (6,000 EGP Cash)
- **Debit** `11120` (Representative Custody) : **6,000**
- **Credit** `11200` (Accounts Receivable) : **6,000**
*(Customer outstanding drops instantly to 4,000 EGP. Liquid Central Treasury remains unaffected.)*

#### Step 3: Treasury Handover (Reconciliation Scenarios)

##### Option A: Perfect Match (Verified Amount = 6,000 EGP)
- **Debit** `11100` (Cash on Hand - Main Treasury) : **6,000**
- **Credit** `11120` (Representative Custody) : **6,000**
*(Status moves to `SETTLED`)*

##### Option B: Deficit/Shortage (Verified Amount = 5,700 EGP, Deficit = 300 EGP)
- **Debit** `11100` (Cash on Hand - Main Treasury) : **5,700**
- **Debit** `11125` (Representative Shortages / Personal Liability Account) : **300**
- **Credit** `11120` (Representative Custody) : **6,000**
*(Status moves to `SHORTAGE`)*

##### Option C: Surplus/Overage (Verified Amount = 6,150 EGP, Surplus = 150 EGP)
- **Debit** `11100` (Cash on Hand - Main Treasury) : **6,150**
- **Credit** `11120` (Representative Custody) : **6,000**
- **Credit** `41400` (Cash Overage Revenue / Miscellaneous Income) : **150**
*(Status moves to `SURPLUS`)*

---

## 5. Security & Isolation Model

1. **Zero-Trust Client Context**:
   - The frontend is strictly forbidden from passing `tenantId`, `branchId`, or `userId` in POST payloads.
   - Endpoints will decrypt Firebase JWT on the server side to resolve the secure tenant and user context.
2. **Role-Based Access Control (RBAC)**:
   - Only accounts with role `TREASURY_OFFICER` or `ADMIN` can execute the `VERIFY_HANDOVER` API.
   - Representatives can only view their own custody sheets and submit handover requests.
3. **Data Isolation**:
   - Schema enforcement using Drizzle's multi-tenant tenant relation filters.

---

## 6. Proposed Relational Tables & DB Schema Modifications

To maintain professional relational integrity, we avoid packing financial transaction metadata inside loose JSONB fields. We propose adding the following structures to `src/db/schema.ts`:

### 1. Table: `representatives` (بيانات المندوبين والحدود الائتمانية للعهدة)
```typescript
export const representatives = pgTable('representatives', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }).notNull(),
  userId: uuid('user_id').references(() => users.id).unique().notNull(),
  code: varchar('code', { length: 50 }).notNull(),
  vehicleInfo: varchar('vehicle_info', { length: 255 }),
  maxCashCustody: numeric('max_cash_custody', { precision: 15, scale: 2 }).default('50000').notNull(),
  maxCustodyDays: integer('max_custody_days').default(2).notNull(),
  status: varchar('status', { length: 20 }).default('active').notNull(), // active, suspended
  createdAt: timestamp('created_at').defaultNow().notNull()
});
```

### 2. Table: `representative_custody` (سجلات تسوية وعهود المندوبين)
```typescript
export const representativeCustody = pgTable('representative_custody', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }).notNull(),
  branchId: uuid('branch_id').references(() => branches.id).notNull(),
  representativeId: uuid('representative_id').references(() => representatives.id).notNull(),
  sourceInvoiceId: uuid('source_invoice_id').references(() => salesInvoices.id),
  status: varchar('status', { length: 30 }).default('OPEN').notNull(), // OPEN, PENDING_VERIFICATION, SETTLED, SHORTAGE, SURPLUS, DISPUTED, OVERDUE, CLOSED
  expectedAmount: numeric('expected_amount', { precision: 15, scale: 2 }).notNull(),
  actualAmount: numeric('actual_amount', { precision: 15, scale: 2 }),
  shortageAmount: numeric('shortage_amount', { precision: 15, scale: 2 }).default('0'),
  surplusAmount: numeric('surplus_amount', { precision: 15, scale: 2 }).default('0'),
  paymentMethod: varchar('payment_method', { length: 50 }).notNull(), // CASH, CHEQUE, BANK_TRANSFER, ELECTRONIC
  chequeDetails: jsonb('cheque_details'), // If CHEQUE: bank, number, dueDate
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  submittedAt: timestamp('submitted_at'),
  verifiedAt: timestamp('verified_at'),
  verifiedBy: uuid('verified_by').references(() => users.id),
  treasuryId: varchar('treasury_id', { length: 100 })
});
```

### 3. Table: `representative_custody_logs` (سجل حركات العهد والتسويات للتدقيق الكامل)
```typescript
export const representativeCustodyLogs = pgTable('representative_custody_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  custodyId: uuid('custody_id').references(() => representativeCustody.id, { onDelete: 'cascade' }).notNull(),
  action: varchar('action', { length: 50 }).notNull(), // CREATE, SUBMIT, RECONCILE, DISPUTE
  fromStatus: varchar('from_status', { length: 30 }).notNull(),
  toStatus: varchar('to_status', { length: 30 }).notNull(),
  performedBy: uuid('performed_by').references(() => users.id).notNull(),
  details: jsonb('details'),
  createdAt: timestamp('created_at').defaultNow().notNull()
});
```

---

## 7. Proposed REST APIs

| Endpoint | Method | Authorization | Description |
| :--- | :--- | :--- | :--- |
| `/api/erp/custody/my-dashboard` | `GET` | Representatives | Retrieve own current custody, totals, overdue warnings |
| `/api/erp/custody/sheets` | `GET` | Finance / Treasury | List custody sheets, filter by Status, Representative |
| `/api/erp/custody/collect` | `POST` | Representatives | Record payment from customer -> locks custody into `OPEN` |
| `/api/erp/custody/handover` | `POST` | Representatives | Submit collected cash to treasury -> transitions to `PENDING_VERIFICATION` |
| `/api/erp/custody/verify` | `POST` | Treasury Officer | Reconcile count, book Shortage/Surplus & write Journal Entry |

---

## 8. Proposed UI Modules

1. **Representative Mobile-Optimized Collections Interface**:
   - Simplifies capturing customer cash collections.
   - Multi-payment support: Cheque photo uploads, Bank transaction references, and Cash entries.
   - Single-tap **Submit Handover** request.
2. **Central Financial Treasury Verification Dashboard**:
   - Secure counter UI for treasury officers to count received physical cash.
   - Interactive matching panel illustrating: `Expected Cash` vs `Deposited Cash`.
   - Action triggers for handling shortages, overages, and logging audit logs dynamically.

---

## 9. Implementation Plan & Phases

- **Phase A**: Schema & Database Migrations (Creating `representatives`, `representative_custody`, `representative_custody_logs` and adding accounting codes `11120`, `11125`).
- **Phase B**: Server-side controller logic implementing high-integrity Postgres transactions for handover reconciliations.
- **Phase C**: Field-Representative mobile workspace for tracking field collections.
- **Phase D**: Treasury Verification Dashboard showing shortages, surpluses, and dispatch statuses.

---
*End of Architectural Discovery Report. Awaiting formal user sign-off to proceed with DB Schema updates and controllers.*
