# MARO ERP - Remaining Risks & Mitigation Strategies

## 1. Identified Risks & Operational Mitigations

### 1.1 Local Storage Storage Limits in Pure Browser Mode
- **Risk**: Browsers limit `localStorage` to 5MB–10MB per origin. In massive retail hypermarket operations with >50,000 SKUs, purely in-memory/localStorage buffers may hit browser storage thresholds.
- **Mitigation Strategy**: The platform's `MaroSyncEngine` indexes data incrementally and flushes mutations via synchronous batches. For desktop deployments, SQLite/SQLCipher or IndexedDB via Dexie is recommended for long-term off-line archives.

### 1.2 Clock Skew Across Offline Devices
- **Risk**: POS terminals operating offline for extended periods might have inaccurate system clocks.
- **Mitigation Strategy**: `MaroSyncEngine` records both `occurred_at` (client clock) and server reception timestamps, with logical sequence ordering and server-authoritative monotonic counters to prevent sequence collisions.

### 1.3 High-Concurrency Network Flapping during Synchronization
- **Risk**: Intermittent network dropping mid-sync request could trigger re-transmissions of identical payloads.
- **Mitigation Strategy**: Full idempotency key validation (`idempotencyKeyStore` & `inbox_sync`) has been integrated into `InvoiceNumberingEngine` and `MaroSyncEngine`, ensuring replay attempts return the pre-existing response without generating duplicate database records.
