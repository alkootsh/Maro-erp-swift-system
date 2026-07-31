# MARO Sync Engine Validation Report
## Offline-First Synchronization & Resilience Testing

This report demonstrates the operational scenarios supported by the MARO Sync Engine.

---

### Scenario 1: Offline Mode Operation
- **State**: Browser `navigator.onLine = false` or server unreachable.
- **Behavior**:
  1. `MaroSyncEngine` captures window `'offline'` event and sets state to `OFFLINE`.
  2. UI badge updates to `PostgreSQL (غير متصل - offline storage active)` via live subscription.
  3. Product creation, updates, and warehouse transfers continue with zero latency directly against local storage (`maro_erp_db_*`).
  4. Zero network exceptions or unhandled UI crashes.

---

### Scenario 2: Queue Creation & Persistence
- **Action**: User creates 3 products while offline.
- **Queue State**:
  ```json
  [
    {
      "id": "op_1722320000001_a1b2c",
      "collectionName": "products",
      "type": "CREATE",
      "entityId": "prod_201",
      "status": "PENDING",
      "retryCount": 0
    },
    {
      "id": "op_1722320000002_d3e4f",
      "collectionName": "products",
      "type": "CREATE",
      "entityId": "prod_202",
      "status": "PENDING",
      "retryCount": 0
    }
  ]
  ```
- **Persistence**: Saved to `maro_erp_sync_queue` key in Local Storage. Queue persists across page reloads and tab closes.

---

### Scenario 3: Reconnection & Background Synchronization
- **Action**: Window receives `'online'` event.
- **Engine Response**:
  1. Sets `isOnline = true` and updates state to `SYNCING`.
  2. Reads pending operations from `maro_erp_sync_queue`.
  3. Dispatches batch payload `POST /api/erp/sync`.
  4. Server writes batch inside a single PostgreSQL transaction.
  5. Upon `200 OK` response, clears synced ops from queue, sets status to `COMPLETED`, and emits timestamp `lastSyncedAt`.

---

### Scenario 4: Conflict Resolution (Server-Wins with Vector Merge)
- **Condition**: Entity `prod_201` modified locally while offline AND updated on server by another node.
- **Algorithm**:
  - Compares local ISO timestamp vs remote ISO timestamp.
  - If `remoteDoc.updatedAt > localDoc.updatedAt`, remote version is applied (`Server Wins`).
  - Uncommitted local draft fields are preserved if local timestamp is newer (`Client Wins`).
