# Sales Domain Model Specification
## MARO Business Platform - Enterprise Sales Engine

### 1. Domain Entities & Relationships

```
┌─────────────────┐       1:N       ┌──────────────────┐
│   customers     ├─────────────────┤  customer_ledger │
└────────┬────────┘                 └──────────────────┘
         │ 1
         │
         │ N
┌────────┴────────┐       1:N       ┌──────────────────┐
│    invoices     ├─────────────────┤   invoice_items  │
└────────┬────────┘                 └──────────────────┘
         │ 1
         │
         │ N
┌────────┴────────┐       1:N       ┌──────────────────┐
│ sales_payments  ├─────────────────┤  credit_notes    │
└─────────────────┘                 └──────────────────┘
```

---

### 2. Primary Entities

#### `customers`
- `id`: Unique Customer ID (`cust_...`).
- `name`: Full Name or Business Name.
- `tax_number`: TRN / Tax Identification Number.
- `credit_limit`: Maximum allowable outstanding balance (NUMERIC(15,4)).
- `credit_days`: Payment terms threshold in days.
- `price_list_id`: Assigned default price list (`RETAIL`, `WHOLESALE`, `VIP`).
- `current_balance`: Real-time calculated ledger balance.

#### `invoices`
- `id`: Unique Invoice ID (`inv_...`).
- `invoice_number`: Auto-incremented human sequence (`INV-2026-00001`).
- `type`: `RETAIL`, `WHOLESALE`, `POS`, `QUOTATION`, `PRO_FORMA`, `RETURN`.
- `customer_id`: FK -> `customers`.
- `branch_id`: FK -> `branches`.
- `warehouse_id`: FK -> `warehouses`.
- `total_untaxed`: Subtotal before taxes & discounts.
- `total_tax`: VAT / Sales tax amount.
- `total_discount`: Itemized + header discount amount.
- `grand_total`: Net payable invoice amount.
- `paid_amount`: Amount collected so far.
- `due_amount`: Outstanding balance (`grand_total - paid_amount`).
- `status`: `DRAFT`, `APPROVED`, `PARTIALLY_PAID`, `PAID`, `VOIDED`, `CANCELLED`.

#### `invoice_items`
- `id`: Item row ID.
- `invoice_id`: FK -> `invoices`.
- `product_id`: FK -> `products`.
- `unit_id`: FK -> `product_units` (e.g. Carton, Box, Piece).
- `quantity`: Transacted quantity.
- `unit_price`: Rate applied from active price list or manual override.
- `batch_number`: Optional batch number tracking.
- `serial_number`: Optional serial number tracking.
- `tax_rate`: Percentage tax applied.
- `line_total`: Net total for row (`quantity * unit_price * (1 - discount%)`).
