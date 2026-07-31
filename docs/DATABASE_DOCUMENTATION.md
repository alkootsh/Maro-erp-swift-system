# MARO ERP - Database Documentation (v3.0)
## Master Enterprise Protocol v3.0

### Database Architectural Rules
- **Primary Database**: PostgreSQL (relational DB with Drizzle ORM).
- **ERP Data Isolation**: ALL transactional data (Products, Invoices, Customers, Purchases, Accounting, Inventory) MUST reside in PostgreSQL / Local Sync Engine. Firebase is strictly forbidden for ERP transactional storage.
- **Multi-Tenant Structure**: Every table enforces `company_id` and `branch_id` composite index constraints.
- **Audit Logging**: System audit table `audit_logs` records `(id, user_id, action, entity_name, entity_id, timestamp, before_state, after_state, ip_address, branch_id)`.

### Core Schema Modules
1. **Products & Master Data**: `products`, `product_units`, `product_barcodes`, `product_categories`, `product_groups`, `brands`, `manufacturers`.
2. **Inventory & Batches**: `warehouse_stocks`, `warehouses`, `product_batches`, `inventory_transactions`.
3. **Sales & Customers**: `customers`, `sales_invoices`, `sales_invoice_lines`, `customer_payments`, `pos_shifts`.
4. **Purchasing & Suppliers**: `suppliers`, `purchase_orders`, `purchase_invoices`, `purchase_invoice_lines`, `supplier_payments`.
5. **Accounting & General Ledger**: `chart_of_accounts`, `journal_entries`, `journal_entry_lines`, `fiscal_years`, `cost_centers`.
6. **System & Sync**: `users`, `roles`, `permissions`, `audit_logs`, `sync_queue`.
