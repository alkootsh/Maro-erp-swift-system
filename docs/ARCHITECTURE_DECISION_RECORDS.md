# Architecture Decision Records (ADR)
## MARO Business Platform - Enterprise Architecture Log

### ADR-001: Offline-First Architecture with PostgreSQL
- **Status**: Approved & Locked (Sprint 7)
- **Context**: High-frequency retail and warehouse environments frequently suffer network latency or intermittent dropouts. Halting checkout or inventory operations due to cloud outages causes severe business loss.
- **Decision**: Adopt an Offline-First pattern. All client transactions execute against local storage (IndexedDB / Local Storage) and sync asynchronously to PostgreSQL via the `MARO Sync Engine`.
- **Consequences**: Zero UI checkout latency; resilient offline operation; requires client-side vector-timestamp conflict resolution (`Server-Wins` with local delta preservation).

---

### ADR-002: Isolation of Operational Data from Firebase
- **Status**: Approved & Locked (Sprint 7)
- **Context**: Storing transactional ERP entities (Products, Invoices, General Ledger, Stock Movements) in Document NoSQL leads to complex relational JOIN queries, schema drift, and unconstrained costs.
- **Decision**: Restrict Firebase strictly to Authentication (`getAuth()`), Push Notifications, and Cloud Messaging. All operational ERP data is housed exclusively in relational PostgreSQL.
- **Consequences**: Strict relational integrity, atomic multi-table transactions, lower query cost at enterprise scale (1M+ products).

---

### ADR-003: Plugin-Based Enterprise Architecture
- **Status**: Approved & Locked (Sprint 8)
- **Context**: Different vertical industries (Hypermarket, Pharmacy, Restaurant) require specialized logic without bloating core ERP source code.
- **Decision**: Implement a Plugin Engine where verticals hook into Core events via `manifest.json` and `MaroEventBus`.
- **Consequences**: Zero tight coupling between core ERP and industry-specific logic; third-party developers can build extensions safely via the Extension SDK.
