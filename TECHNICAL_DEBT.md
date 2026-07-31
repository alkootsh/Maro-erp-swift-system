# MARO Business Platform - Technical Debt Registry

## Active Items & Mitigation Plan

| Debt Item | Risk Level | Description | Mitigation Strategy | Target Sprint |
| :--- | :--- | :--- | :--- | :--- |
| **Firestore Legacy Read Fallbacks in Invoices/POS** | Medium | Non-operational modules (POS / Invoices) retain Firestore fallback listeners with offline catch blocks. | Migrate Invoices & POS transactions to MARO Sync Engine + PostgreSQL in Sprint 8. | Sprint 8 |
| **IndexedDB Upgrade for Large Datasets** | Low | Local Storage is currently used for client key-value cache (up to 5MB). | Upgrade storage driver in `maroSyncEngine.ts` to `idb` / `localforage` for datasets exceeding 100,000 SKUs. | Sprint 9 |
| **WebSocket Real-Time Broadcast** | Low | Sync engine polls server endpoint every batch dispatch. | Add Server-Sent Events (SSE) or WebSocket channel to push database changes instantly across clients. | Sprint 10 |
