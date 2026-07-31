# Sync Flow Specification (Sprint 8)
## MARO Business Platform - Enterprise High-Frequency Sync

### 1. Extended Sync Schema

Sprint 8 extends the MARO Sync Engine schema to manage operational sales and procurement collections:

```typescript
type SyncCollectionSprint8 = 
  | 'products'
  | 'inventory_movements'
  | 'warehouses'
  | 'invoices'
  | 'invoice_items'
  | 'pos_sessions'
  | 'pos_transactions'
  | 'customers'
  | 'customer_ledger'
  | 'purchase_orders'
  | 'purchase_bills'
  | 'suppliers'
  | 'supplier_ledger';
```

---

### 2. Batch Transaction Integrity & Sequence Reservation
- **Sequence Pre-Allocation**: POS terminals pre-allocate invoice ranges (e.g. `POS1-00001` to `POS1-01000`) locally during offline operations to guarantee zero invoice number collisions upon sync.
- **Stock Reservation Locks**: When an offline invoice is created, local stock levels update immediately. During sync dispatch, the server validates stock against central PostgreSQL using `FOR UPDATE` transaction locks.
- **Conflict Handling for Customer Balance**: Customer balance updates use atomic delta increment commands (`UPDATE customers SET balance = balance + :amount WHERE id = :id`) to prevent race conditions during concurrent POS sales.
