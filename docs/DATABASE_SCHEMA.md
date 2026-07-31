# MARO ERP - PostgreSQL Database Schema Specification
## Sprint 7: Product & Inventory Foundation Architecture

### Overview
This document specifies the PostgreSQL relational database schema for operational ERP modules, establishing transactional integrity, constraints, primary key indexing, and foreign key relationships.

---

### Entity Relationship Diagram (ERD Summary)

```
                       ┌─────────────────────────┐
                       │   product_categories    │
                       └────────────┬────────────┘
                                    │ 1
                                    │
                                    │ N
                       ┌────────────┴────────────┐
                       │     product_groups      │
                       └────────────┬────────────┘
                                    │ 1
                                    │
                                    │ N
┌────────────────┐     ┌────────────┴────────────┐     ┌────────────────┐
│     brands     ├─────┤        products         ├─────┤ manufacturers  │
└────────────────┘ 1  N└────────────┬────────────┘ N  1└────────────────┘
                                    │ 1
                                    │
                                    │ N
                       ┌────────────┴────────────┐
                       │   inventory_movements   │
                       └────────────┬────────────┘
                                    │ N
                                    │
                                    │ 1
                       ┌────────────┴────────────┐
                       │       warehouses        │
                       └─────────────────────────┘
```

---

### Core Tables & Definitions

#### 1. `product_categories`
- `id` (VARCHAR(64), PK): Unique Category ID (`cat_...`).
- `name` (VARCHAR(255), NOT NULL): Category display name in Arabic/English.
- `code` (VARCHAR(100), UNIQUE): Standard classification code (e.g. `CAT-ELEC`).
- `parent_id` (VARCHAR(64), FK): Recursive self-reference for tree hierarchy.
- `status` (VARCHAR(20), DEFAULT 'active'): Status flag (`active`, `inactive`).

#### 2. `product_groups`
- `id` (VARCHAR(64), PK): Sub-group ID.
- `name` (VARCHAR(255), NOT NULL): Sub-group title.
- `code` (VARCHAR(100), UNIQUE): Group code.
- `category_id` (VARCHAR(64), FK -> `product_categories`): Parent category reference.

#### 3. `products`
- `id` (VARCHAR(64), PK): Unique Product ID (`prod_...`).
- `name` (VARCHAR(255), NOT NULL): Product Title.
- `sku` (VARCHAR(100), UNIQUE): Stock Keeping Unit.
- `price` (NUMERIC(15, 4), NOT NULL): Retail Selling Price.
- `cost_price` (NUMERIC(15, 4), NOT NULL): Cost Price / Valuation Price.
- `quantity` (NUMERIC(15, 4), NOT NULL): Total aggregate stock across warehouses.
- `reorder_level` (NUMERIC(15, 4), DEFAULT 5.0): Low stock alert threshold.
- `valuation_method` (VARCHAR(20), DEFAULT 'FIFO'): `FIFO`, `LIFO`, or `AVCO`.
- `units` (JSONB): Multi-unit hierarchy & conversion factors.
- `barcodes` (JSONB): EAN13 / UPC barcode mappings.
- `warehouse_stocks` (JSONB): Per-warehouse inventory breakdown.

#### 4. `warehouses`
- `id` (VARCHAR(64), PK): Warehouse ID (`wh_...`).
- `name` (VARCHAR(255), NOT NULL): Warehouse name.
- `code` (VARCHAR(100), UNIQUE): Warehouse code.
- `location` (TEXT): Physical address/branch.
- `is_main` (BOOLEAN): Flag for primary central warehouse.

#### 5. `inventory_movements`
- `id` (VARCHAR(64), PK): Movement ledger record ID.
- `product_id` (VARCHAR(64), FK -> `products`): Linked product.
- `warehouse_id` (VARCHAR(64), FK -> `warehouses`): Target warehouse.
- `type` (VARCHAR(10)): `in`, `out`, `transfer`, `adjustment`.
- `quantity` (NUMERIC(15, 4)): Transacted quantity.
- `reference_type` (VARCHAR(50)): Source document (`INVOICE`, `BILL`, `RETURN`).

---

### Performance Indexing Strategy
- `idx_products_sku` on `products(sku)` (B-Tree)
- `idx_products_category_id` on `products(category_id)`
- `idx_movements_product` on `inventory_movements(product_id)`
- `idx_movements_created` on `inventory_movements(created_at DESC)`
- `idx_audit_module` on `audit_logs(module)`
