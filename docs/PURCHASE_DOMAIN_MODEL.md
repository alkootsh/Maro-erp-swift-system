# Purchase Domain Model Specification
## MARO Business Platform - Procurement Engine

### 1. Domain Entities & Relationships

```
┌──────────────────┐      1:N       ┌───────────────────┐
│   purchase_reqs  ├────────────────┤  purchase_orders  │
└──────────────────┘                └─────────┬─────────┘
                                              │ 1
                                              │ N
                                    ┌─────────┴─────────┐
                                    │    goods_receipt  │
                                    └─────────┬─────────┘
                                              │ 1
                                              │ N
┌──────────────────┐      1:N       ┌─────────┴─────────┐
│    suppliers     ├────────────────┤  purchase_bills   │
└──────────────────┘                └───────────────────┘
```

---

### 2. Core Entities

#### `suppliers`
- `id`: Unique Supplier ID (`supp_...`).
- `name`: Company Name.
- `tax_number`: Vendor TRN.
- `payment_terms`: Days or agreement (`NET30`, `COD`).
- `current_balance`: Accounts Payable balance owed to supplier.

#### `purchase_orders`
- `id`: PO Record ID (`po_...`).
- `po_number`: `PO-2026-00001`.
- `supplier_id`: FK -> `suppliers`.
- `warehouse_id`: Target receiving warehouse.
- `status`: `DRAFT`, `SUBMITTED`, `APPROVED`, `PARTIALLY_RECEIVED`, `RECEIVED`, `CLOSED`.
- `total_amount`: Total estimated PO value.

#### `goods_receipt_notes` (GRN)
- `id`: GRN ID (`grn_...`).
- `po_id`: FK -> `purchase_orders`.
- `received_date`: Timestamp stock arrived at warehouse.
- `items`: Received quantities, batch numbers, manufacturing/expiry dates.
- `status`: `PENDING_INSPECTION`, `ACCEPTED`, `REJECTED`.

#### `purchase_bills`
- `id`: Supplier Bill ID (`bill_...`).
- `supplier_id`: FK -> `suppliers`.
- `grn_id`: FK -> `goods_receipt_notes`.
- `vendor_invoice_number`: Vendor's invoice number.
- `total_amount`: Net payable bill amount.
- `due_date`: Payable maturity date.
