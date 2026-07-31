# Database Conventions
## MARO Business Platform - PostgreSQL Relational Database Standards

### 1. DDL & Schema Rules
- **Naming**: `snake_case` plural table names (`products`, `invoices`). Column names must be explicit and unambiguous (`unit_price`, `cost_price`, `created_at`).
- **Primary Keys**: Every table **MUST** declare a `VARCHAR(64)` primary key named `id`, generated using prefixed UUID string format (`prod_...`, `inv_...`, `cust_...`).
- **Numeric Precision**: Currency, quantities, rates, and unit costs **MUST** use `NUMERIC(15, 4)` to eliminate floating-point rounding errors.
- **Foreign Keys**: All foreign key constraints must specify explicit `ON DELETE` behavior (`RESTRICT` or `CASCADE` where appropriate).
- **Audit Timestamps**: Tables must include `created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP` and `updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP`.

---

### 2. Indexing Strategy
- Create B-Tree indexes on all foreign key columns (`customer_id`, `warehouse_id`, `supplier_id`).
- Create unique indexes on business identifiers (`sku`, `invoice_number`, `tax_number`).
- Compound indexes for date-range queries (`CREATE INDEX idx_invoices_branch_date ON invoices(branch_id, created_at DESC)`).
