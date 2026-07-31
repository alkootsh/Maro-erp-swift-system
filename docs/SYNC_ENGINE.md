# MARO Sync Engine - Offline-First PostgreSQL Synchronization Engine

## Overview
The **MARO Sync Engine** (`src/lib/maroSyncEngine.ts`) is the core offline-first synchronization engine powering MARO ERP. It guarantees instant zero-latency UI interactions when disconnected from network infrastructure while ensuring data consistency with the central PostgreSQL backend.

---

## State Machine & Operation Lifecycle

```
[UI Mutation] ──► Local Storage Save ──► Enqueue Sync Operation (PENDING)
                                                  │
                                                  ▼
                                      [Online Network Check]
                                        /                \
                                       ▼                  ▼
                              (Online)                 (Offline)
                        POST /api/erp/sync             Wait for 'online'
                           /        \                     event
                          ▼          ▼
                      (Success)   (Failure)
                         │           │
                         ▼           ▼
                      SYNCED    Exponential Backoff Retry
                                (Max 5 attempts) ──► FAILED
```

---

## Conflict Resolution Strategy
The MARO Sync Engine uses **Server-Wins with Vector Timestamp Merge**:
1. When fetching remote collections (`fetchRemoteCollection`), the engine compares the local item's `updatedAt` ISO timestamp against the remote PostgreSQL record.
2. If the remote document has a newer timestamp, remote state overwrites local state (`Server Wins`).
3. If pending local edits exist for an uncommitted entity ID, local pending fields take precedence until synchronized.

---

## Retry Mechanism & Exponential Backoff
- `MAX_RETRIES`: 5 attempts.
- `INITIAL_BACKOFF_MS`: 2000 ms.
- Backoff Formula: `nextRetryTimestamp = currentTime + (2000 * 2^retryCount)`.
- Live Status Event Emitter notifies `SyncEngineStatusBadge` UI component in real-time.
