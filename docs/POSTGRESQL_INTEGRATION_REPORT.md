# PostgreSQL Integration Report
## MARO ERP - Sprint 7 Architecture Review

### 1. Connection Layer & Server Architecture
The PostgreSQL persistence layer operates through a dedicated Express server bridge (`server.ts`) combined with the `MARO Sync Engine` client adapter.
- **Protocol**: HTTP/REST RESTful Sync Endpoint (`/api/erp/sync` and `/api/erp/:collection`).
- **Data Format**: Strongly-typed JSON entities adhering to the DDL schema in `src/db/schema.sql`.
- **Port & Host Binding**: Port `3000`, Host `0.0.0.0` (Container compliant).

### 2. Repository Usage
Operational ERP repositories no longer issue direct Firestore client queries.
- **Product Repository (`src/repositories/productRepository.ts`)**:
  - `getAllProducts()` -> Calls `MaroSyncEngine.getLocalCollection<ProductMaster>('products')`.
  - `addProduct(data)` -> Issues `MaroSyncEngine.saveDocument('products', doc, true)` and writes audit log.
  - `updateProduct(id, changes)` -> Issues `MaroSyncEngine.saveDocument('products', updated, false)` and writes audit log.
  - `deleteProduct(id, name)` -> Issues `MaroSyncEngine.deleteDocument('products', id)`.

### 3. Transactional Guarantees
- **Local Storage Atomicity**: Multi-entity mutations are encapsulated via `UnitOfWork` (`src/cqrs/unitOfWork.ts`).
- **Server Batch Execution**: The backend processes operations inside explicit PostgreSQL transactions:
  ```sql
  BEGIN TRANSACTION;
  INSERT INTO products (id, name, sku, price, cost_price, quantity, status, updated_at)
  VALUES ('prod_101', 'آيفون 15 برو مكس', 'SKU-IPHONE15', 5500.00, 4800.00, 25, 'active', NOW())
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    cost_price = EXCLUDED.cost_price,
    quantity = EXCLUDED.quantity,
    updated_at = EXCLUDED.updated_at;
  COMMIT;
  ```

### 4. DDL Execution Example
Executing the SQL script in PostgreSQL initializes table schemas and indexes:
```sql
-- Create Products Table
CREATE TABLE IF NOT EXISTS products (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    sku VARCHAR(100) NOT NULL UNIQUE,
    price NUMERIC(15, 4) NOT NULL DEFAULT 0.0000,
    cost_price NUMERIC(15, 4) NOT NULL DEFAULT 0.0000,
    quantity NUMERIC(15, 4) NOT NULL DEFAULT 0.0000,
    reorder_level NUMERIC(15, 4) DEFAULT 5.0000,
    category VARCHAR(255) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexing for high-speed SKU lookup
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
```
