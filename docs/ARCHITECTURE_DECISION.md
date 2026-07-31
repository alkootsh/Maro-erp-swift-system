# MARO Business Platform - Enterprise Architecture Decision Record (ADR)

## Status: APPROVED & MANDATORY

## Context & Decision
MARO Business Platform is an **Offline-First Enterprise ERP**.

### Primary Database Architecture:
- **Primary Local Database**: PostgreSQL (Client offline-first cache & sync storage via MARO Sync Engine)
- **Primary Cloud Database**: PostgreSQL
- **Synchronization**: MARO Sync Engine (Bidirectional offline delta sync, queueing, and conflict resolution)

### Restricted Scope of Firebase:
Firebase MUST NOT be used for primary operational ERP data. Firebase is restricted strictly to:
- Push Notifications
- Crash Reporting
- Analytics
- Optional Cloud Messaging

### Operational Data Categories (Stored strictly in PostgreSQL / MARO Sync Engine):
- Products & Master Data
- Inventory & Multi-Warehouse Movements
- Sales & Invoicing
- Purchases & Bills
- Accounting & General Ledger
- Customers & CRM
- Suppliers & Vendor Management
- POS Transactions

---

## Technical Specifications & Implementation
1. **MARO Sync Engine (`src/lib/maroSyncEngine.ts`)**:
   - Maintains offline key-value persistent storage for zero-latency UI interaction.
   - Enqueues operational delta transactions (`CREATE`, `UPDATE`, `DELETE`).
   - Syncs automatically when online with PostgreSQL REST endpoints (`/api/erp/sync`).
2. **Repository Layer (`src/repositories/productRepository.ts`)**:
   - Decoupled from Firebase Firestore for operational domain models.
   - Leverages `MaroSyncEngine` for real-time local subscriptions and database persistence.
3. **Backend Server (`server.ts`)**:
   - Exposes REST synchronization endpoints for PostgreSQL backend services.
