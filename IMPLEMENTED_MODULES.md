# MARO Business Platform - Implemented Modules

## 1. Core Architecture & Offline Infrastructure (Sprint 7)
- **MARO Sync Engine (`src/lib/maroSyncEngine.ts`)**: Offline-first queue manager with local persistence (`maro_erp_db_*`), exponential backoff retry logic, conflict resolution (`Server-Wins` with vector timestamp merge), and live event subscriptions.
- **CQRS Engine (`src/cqrs/`)**:
  - `commands.ts`: `CreateProductCommand`, `UpdateProductCommand`, `DeleteProductCommand`, `CreateWarehouseCommand`, `UpdateWarehouseCommand`, `DeleteWarehouseCommand`.
  - `queries.ts`: `GetProductQuery`, `SearchProductsQuery`, `GetInventoryQuery`, `GetWarehousesQuery`.
  - `unitOfWork.ts`: Atomic change tracker registering new/dirty/deleted entities and committing them in a unified batch operation.
- **PostgreSQL Database Schema (`src/db/schema.sql`)**: Production DDL covering 9 tables, indexes on SKUs and dates, check constraints, and audit logging.

## 2. Inventory & Stock Management (Sprint 7)
- **Inventory Ledger (`src/pages/Inventory.tsx`)**: Real-time metric queries via `GetInventoryQuery` calculating total stock pieces, FIFO estimated stock value, low-stock threshold alerts, and out-of-stock counts.
- **Warehouse Management (`src/pages/Warehouses.tsx`)**: Full CRUD support via CQRS for warehouse locations, multi-warehouse stock inspection, and inter-warehouse stock transfer module (`warehouse_transfers`).

## 3. UI Status Telemetry
- **Sync Status Badge (`src/components/SyncEngineStatusBadge.tsx`)**: Header status widget displaying live connection state (Offline / Syncing / Completed / Error), pending operations count, and manual trigger action.

## 4. Operational ERP Repositories
- **Product Repository (`src/repositories/productRepository.ts`)**: Product master record persistence isolated from Firestore, maintaining barcodes, multi-unit pricing, valuation method, and stock levels via MARO Sync Engine.
