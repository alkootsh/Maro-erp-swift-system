# MARO ERP - CQRS Architecture (Command Query Responsibility Segregation)

## Overview
MARO ERP implements strict Command Query Responsibility Segregation (CQRS) to isolate write operations (Commands) from read operations (Queries) across the Product & Inventory Foundation modules.

---

## Architectural Pattern

```
                       ┌─────────────────────────┐
                       │     User Interface      │
                       └────┬────────────────┬───┘
                            │                │
            Command Flow    │                │    Query Flow
            (Mutations)     ▼                ▼    (Reads)
                       ┌─────────┐      ┌─────────┐
                       │ Commands│      │ Queries │
                       └────┬────┘      └────┬────┘
                            │                │
                            ▼                ▼
                       ┌─────────┐      ┌─────────┐
                       │  Unit   │      │ Query   │
                       │Of Work  │      │ Handlers│
                       └────┬────┘      └────┬────┘
                            │                │
                            ▼                │
                       ┌─────────┐           │
                       │  MARO   │           │
                       │  Sync   │◄──────────┘
                       │ Engine  │
                       └─────────┘
```

---

## Command Handlers (`src/cqrs/commands.ts`)

| Command | Arguments | Outcome |
| :--- | :--- | :--- |
| `CreateProductCommand` | `Omit<ProductMaster, 'id'>` | Validates mandatory fields, creates unique SKU, persists document to local storage, enqueues operational sync transaction. |
| `UpdateProductCommand` | `id: string, changes: Partial<ProductMaster>` | Applies differential updates, recalculates valuation, logs audit action. |
| `DeleteProductCommand` | `id: string, name?: string` | Soft/Hard deletes product record and enqueues sync deletion. |
| `CreateWarehouseCommand` | `Omit<WarehouseData, 'id'>` | Registers new warehouse location. |
| `UpdateWarehouseCommand` | `id: string, data: Partial<WarehouseData>` | Updates warehouse details. |
| `DeleteWarehouseCommand` | `id: string, name?: string` | Deletes non-main warehouse location. |

---

## Query Handlers (`src/cqrs/queries.ts`)

| Query | Parameters | Result |
| :--- | :--- | :--- |
| `GetProductQuery` | `productId: string` | Returns single `ProductMaster` instance or `null`. |
| `SearchProductsQuery` | `searchTerm, categoryFilter, statusFilter` | Returns filtered list of active product items. |
| `GetInventoryQuery` | None | Returns aggregated inventory metrics (Total Items, Stock Value, Low Stock Count, Out of Stock Count). |
| `GetWarehousesQuery` | None | Returns list of registered warehouses. |

---

## Unit of Work (`src/cqrs/unitOfWork.ts`)
The `UnitOfWork` pattern coordinates multi-entity operations (e.g., updating a product stock while creating an inventory movement record simultaneously) within a single atomic commit step.
