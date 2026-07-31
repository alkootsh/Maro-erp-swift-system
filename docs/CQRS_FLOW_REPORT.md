# CQRS Execution Flow Report
## MARO ERP - CQRS Implementation Verification

This report details the end-to-end execution flow for the primary CQRS Commands in MARO ERP.

---

### Flow 1: Create Product (`CreateProductCommand`)

```
[UI Form / API] ──► new CreateProductCommand(productData)
                         │
                         ▼
             Validate (Name & SKU required)
                         │
                         ▼
        ProductRepository.addProduct(data)
                         │
                         ▼
   MaroSyncEngine.saveDocument('products', doc, true)
            ┌────────────┴────────────┐
            ▼                         ▼
   Save to Local Storage      Enqueue SyncOp (CREATE)
   (Instant UI Update)                │
                                      ▼
                           Trigger Background Sync
                           POST /api/erp/sync
```

1. **Invocation**: Component initializes `cmd = new CreateProductCommand({ name: 'آيفون 15', sku: 'SKU-IPHONE15', price: 5500, costPrice: 4800, quantity: 10, category: 'إلكترونيات' })`.
2. **Validation**: Checks that `name` and `sku` are non-empty.
3. **Execution**: Generates ID `prod_...` and calls `MaroSyncEngine.saveDocument`.
4. **Local Write**: Updates `maro_erp_db_products` local cache immediately.
5. **Enqueue**: Pushes `{ id, collectionName: 'products', type: 'CREATE', payload, status: 'PENDING' }` to sync queue.
6. **Background Sync**: Dispatches batch to server endpoint `/api/erp/sync`.

---

### Flow 2: Update Product (`UpdateProductCommand`)

1. **Invocation**: `cmd = new UpdateProductCommand('prod_101', { price: 5700, quantity: 12 })`.
2. **Execution**: Merges partial changes with existing local document.
3. **Local Write**: Replaces record in `maro_erp_db_products` and notifies subscriber callbacks.
4. **Enqueue**: Pushes `type: 'UPDATE'` operation to sync queue.
5. **Audit Log**: Appends update action to `audit_logs`.

---

### Flow 3: Delete Product (`DeleteProductCommand`)

1. **Invocation**: `cmd = new DeleteProductCommand('prod_101', 'آيفون 15')`.
2. **Execution**: Calls `MaroSyncEngine.deleteDocument('products', 'prod_101')`.
3. **Local Write**: Removes record from `maro_erp_db_products`.
4. **Enqueue**: Pushes `type: 'DELETE'` operation to sync queue.
5. **Audit Log**: Appends deletion audit entry.
