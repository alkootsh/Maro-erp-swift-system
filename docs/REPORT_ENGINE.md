# MARO ERP - Report Engine Documentation (v3.0)
## Master Enterprise Protocol v3.0

### Architectural Overview
The MARO Report Engine enables business users, managers, and accountants to analyze operational data through dynamic filtering, pivot tables, drill-down detail views, and scheduled automated exports.

### Core Architecture
- **CQRS Read Models**: High-speed, indexed read models queryable directly from PostgreSQL or offline local sync stores.
- **Interactive Multi-Level Filtering**: Date range, branch, warehouse, category, customer group, payment method, and sales rep filters.
- **Drill-Down Capability**: Click on summary totals to expand underlying invoice lines, ledger postings, or batch transactions.
- **Export & Delivery**: Instant export to Excel, PDF, CSV, Word, or direct email dispatch.

### Report Categories
1. **Sales & POS**: Sales by Item, Category, Customer, Sales Rep, Branch, Hour of Day, Margin Analysis.
2. **Purchasing & Vendors**: Vendor Performance, Purchase Orders vs Receipts, Price Variance.
3. **Inventory & Warehouse**: Valuation Report (FIFO / Weighted Average), Dead Stock, Low Stock Warning, Batch Expiry Schedule, Movement History.
4. **Financial Accounting**: General Ledger, Trial Balance, Income Statement (P&L), Balance Sheet, Aging Receivables/Payables, ZATCA / ETA VAT Returns.
