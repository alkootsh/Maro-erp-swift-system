// MARO ERP - MARO Sync Engine (Offline-First PostgreSQL Synchronization Engine)

export type SyncStatusState = 'IDLE' | 'SYNCING' | 'OFFLINE' | 'ERROR' | 'COMPLETED';

export interface SyncOperation {
  id: string;
  collectionName: string; // e.g. 'products', 'categories', 'brands', 'warehouses', 'inventory_settings'
  type: 'CREATE' | 'UPDATE' | 'DELETE';
  entityId: string;
  payload: any;
  timestamp: string;
  status: 'PENDING' | 'SYNCED' | 'FAILED' | 'CONFLICT';
  retryCount: number;
  lastError?: string;
  nextRetryTimestamp?: number;
}

export interface SyncStatusEvent {
  state: SyncStatusState;
  pendingCount: number;
  lastSyncedAt?: string;
  error?: string;
}

const STORAGE_PREFIX = 'maro_erp_db_';
const QUEUE_KEY = 'maro_erp_sync_queue';
const RETRY_KEY = 'maro_erp_retry_queue';

const LISTENERS: Map<string, Set<(data: any[]) => void>> = new Map();
const STATUS_LISTENERS: Set<(status: SyncStatusEvent) => void> = new Set();
const memoryStore = new Map<string, string>();

function safeStorageGet(key: string): string | null {
  try {
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem(key);
    }
  } catch (_) {}
  return memoryStore.get(key) || null;
}

function safeStorageSet(key: string, value: string): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(key, value);
      return;
    }
  } catch (_) {}
  memoryStore.set(key, value);
}

const MAX_RETRIES = 5;
const INITIAL_BACKOFF_MS = 2000;

export class MaroSyncEngine {
  private static isOnline: boolean = typeof navigator !== 'undefined' ? navigator.onLine : true;
  private static syncInProgress: boolean = false;
  private static currentStatus: SyncStatusState = 'IDLE';
  private static lastSyncedAt: string | undefined = undefined;

  static init() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.isOnline = true;
        this.emitStatus();
        this.processSyncQueue();
      });
      window.addEventListener('offline', () => {
        this.isOnline = false;
        this.currentStatus = 'OFFLINE';
        this.emitStatus();
      });
    }
  }

  // --- Status Tracking ---
  static subscribeStatus(callback: (status: SyncStatusEvent) => void): () => void {
    STATUS_LISTENERS.add(callback);
    callback(this.getStatus());
    return () => {
      STATUS_LISTENERS.delete(callback);
    };
  }

  static getStatus(): SyncStatusEvent {
    const queue = this.getQueue();
    const pendingCount = queue.filter(op => op.status === 'PENDING').length;
    return {
      state: !this.isOnline ? 'OFFLINE' : this.currentStatus,
      pendingCount,
      lastSyncedAt: this.lastSyncedAt
    };
  }

  static setOnline(online: boolean): void {
    this.isOnline = online;
    if (!online) {
      this.currentStatus = 'OFFLINE';
    } else {
      this.currentStatus = 'IDLE';
    }
    this.emitStatus();
  }

  static isOnlineStatus(): boolean {
    return this.isOnline;
  }

  static getSyncQueue(): SyncOperation[] {
    return this.getQueue();
  }

  static flushQueueLocally(): void {
    this.setQueue([]);
    this.lastSyncedAt = new Date().toISOString();
    this.currentStatus = 'COMPLETED';
    this.emitStatus();
  }

  private static emitStatus(error?: string) {
    const status = this.getStatus();
    if (error) status.error = error;
    STATUS_LISTENERS.forEach(cb => cb(status));
  }

  // --- Local DB Key-Value Operations (Offline First) ---
  static getLocalCollection<T = any>(collectionName: string): T[] {
    try {
      const dataStr = safeStorageGet(`${STORAGE_PREFIX}${collectionName}`);
      return dataStr ? JSON.parse(dataStr) : [];
    } catch (e) {
      console.error(`[MARO Sync Engine] Error reading local collection ${collectionName}:`, e);
      return [];
    }
  }

  static setLocalCollection<T = any>(collectionName: string, items: T[]): void {
    try {
      safeStorageSet(`${STORAGE_PREFIX}${collectionName}`, JSON.stringify(items));
      this.notifyListeners(collectionName, items);
    } catch (e) {
      console.error(`[MARO Sync Engine] Error writing local collection ${collectionName}:`, e);
    }
  }

  // --- Subscription System for Reactive UI ---
  static subscribe<T = any>(collectionName: string, callback: (data: T[]) => void): () => void {
    if (!LISTENERS.has(collectionName)) {
      LISTENERS.set(collectionName, new Set());
    }
    const set = LISTENERS.get(collectionName)!;
    set.add(callback);

    // Initial callback with current offline local cache
    const currentData = this.getLocalCollection<T>(collectionName);
    callback(currentData);

    // Initial sync fetch if online
    this.fetchRemoteCollection(collectionName);

    return () => {
      set.delete(callback);
    };
  }

  private static notifyListeners(collectionName: string, data: any[]) {
    const set = LISTENERS.get(collectionName);
    if (set) {
      set.forEach(cb => cb(data));
    }
  }

  // --- Read Single Document ---
  static getLocalDocument<T = any>(collectionName: string, id: string): T | null {
    const items = this.getLocalCollection<T>(collectionName);
    return items.find((item: any) => item.id === id) || null;
  }

  // --- Write / Mutation Methods (Save locally immediately & Queue Sync) ---
  static async saveDocument<T extends { id: string }>(collectionName: string, doc: T, isNew: boolean = false): Promise<string> {
    const items = this.getLocalCollection<T>(collectionName);
    const existingIndex = items.findIndex((i: any) => i.id === doc.id);

    if (existingIndex >= 0) {
      items[existingIndex] = { ...items[existingIndex], ...doc, updatedAt: new Date().toISOString() };
    } else {
      items.push({ ...doc, updatedAt: new Date().toISOString() });
    }

    this.setLocalCollection(collectionName, items);

    // Enqueue operation for PostgreSQL backend sync
    this.enqueueSyncOp({
      id: `op_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      collectionName,
      type: isNew ? 'CREATE' : 'UPDATE',
      entityId: doc.id,
      payload: doc,
      timestamp: new Date().toISOString(),
      status: 'PENDING',
      retryCount: 0
    });

    // Attempt immediate background sync
    this.processSyncQueue();

    return doc.id;
  }

  static async deleteDocument(collectionName: string, id: string): Promise<void> {
    const items = this.getLocalCollection(collectionName);
    const updated = items.filter((i: any) => i.id !== id);
    this.setLocalCollection(collectionName, updated);

    this.enqueueSyncOp({
      id: `op_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      collectionName,
      type: 'DELETE',
      entityId: id,
      payload: { id },
      timestamp: new Date().toISOString(),
      status: 'PENDING',
      retryCount: 0
    });

    this.processSyncQueue();
  }

  // --- Sync Queue & Retry Queue Management ---
  public static getQueue(): SyncOperation[] {
    try {
      const q = safeStorageGet(QUEUE_KEY);
      return q ? JSON.parse(q) : [];
    } catch {
      return [];
    }
  }

  public static getQueueDepth(): number {
    return this.getQueue().filter(op => op.status === 'PENDING').length;
  }

  private static setQueue(queue: SyncOperation[]): void {
    try {
      safeStorageSet(QUEUE_KEY, JSON.stringify(queue));
      this.emitStatus();
    } catch (e) {
      console.error('[MARO Sync Engine] Error writing queue:', e);
    }
  }

  public static enqueueSyncOp(op: SyncOperation) {
    const queue = this.getQueue();
    queue.push(op);
    this.setQueue(queue);
  }

  public static enqueueBatch(ops: SyncOperation[]) {
    const queue = this.getQueue();
    queue.push(...ops);
    this.setQueue(queue);
  }

  // --- Conflict Resolution & Vector Timestamp Merge ---
  private static resolveConflict(localDoc: any, remoteDoc: any): any {
    // Conflict resolution policy: Server Timestamp vs Local Timestamp merge
    const localTime = new Date(localDoc.updatedAt || 0).getTime();
    const remoteTime = new Date(remoteDoc.updatedAt || 0).getTime();

    if (remoteTime >= localTime) {
      console.log(`[MARO Sync Engine] Conflict resolved: Server Wins for ${localDoc.id}`);
      return remoteDoc;
    } else {
      console.log(`[MARO Sync Engine] Conflict resolved: Client Wins for ${localDoc.id}`);
      return { ...remoteDoc, ...localDoc };
    }
  }

  // --- Remote Fetching & Background Synchronization ---
  static async fetchRemoteCollection(collectionName: string): Promise<void> {
    if (!this.isOnline) return;

    try {
      const response = await fetch(`/api/erp/${collectionName}`);
      if (response.ok) {
        const remoteItems = await response.json();
        if (Array.isArray(remoteItems)) {
          const currentLocal = this.getLocalCollection(collectionName);
          
          // If remote is empty but local has items, preserve local data and push to sync queue if needed
          if (remoteItems.length === 0 && currentLocal.length > 0) {
            return;
          }

          // Merge strategy with conflict resolution for non-pending items
          const pendingOps = this.getQueue().filter(op => op.collectionName === collectionName && op.status === 'PENDING');
          const pendingIds = new Set(pendingOps.map(op => op.entityId));

          const merged = [...remoteItems.filter(r => !pendingIds.has(r.id))];

          // Re-add locally pending items with conflict check
          pendingOps.forEach(op => {
            if (op.type !== 'DELETE') {
              const localDoc = currentLocal.find(l => l.id === op.entityId);
              const remoteDoc = remoteItems.find(r => r.id === op.entityId);

              if (localDoc && remoteDoc) {
                const resolved = this.resolveConflict(localDoc, remoteDoc);
                merged.push(resolved);
              } else if (localDoc) {
                merged.push(localDoc);
              }
            }
          });

          this.setLocalCollection(collectionName, merged);
        }
      }
    } catch (e) {
      console.log(`[MARO Sync Engine] Fetching ${collectionName} deferred (offline).`);
    }
  }

  static async processSyncQueue(): Promise<void> {
    if (this.syncInProgress || !this.isOnline) return;

    const queue = this.getQueue();
    const now = Date.now();

    // Filter pending operations that are ready for retry (respecting exponential backoff)
    const pending = queue.filter(op => 
      op.status === 'PENDING' && (!op.nextRetryTimestamp || op.nextRetryTimestamp <= now)
    );

    if (pending.length === 0) {
      if (queue.length === 0) {
        this.currentStatus = 'IDLE';
        this.emitStatus();
      }
      return;
    }

    this.syncInProgress = true;
    this.currentStatus = 'SYNCING';
    this.emitStatus();

    try {
      const response = await fetch('/api/erp/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ operations: pending })
      });

      if (response.ok) {
        const result = await response.json();
        const syncedIds = new Set(result.syncedOperationIds || []);

        // Update successful ops and handle failed ops backoff retry
        const remainingQueue = queue.filter(op => {
          if (syncedIds.has(op.id)) return false; // remove synced op

          // Exponential backoff for failed ops in batch
          if (pending.some(p => p.id === op.id)) {
            op.retryCount = (op.retryCount || 0) + 1;
            if (op.retryCount >= MAX_RETRIES) {
              op.status = 'FAILED';
              op.lastError = 'Max retries exceeded';
            } else {
              op.nextRetryTimestamp = now + (INITIAL_BACKOFF_MS * Math.pow(2, op.retryCount));
            }
          }
          return true;
        });

        this.setQueue(remainingQueue);
        this.lastSyncedAt = new Date().toISOString();
        this.currentStatus = 'COMPLETED';
        this.emitStatus();
      } else {
        throw new Error(`Sync HTTP server error ${response.status}`);
      }
    } catch (e: any) {
      console.warn('[MARO Sync Engine] Background sync attempt failed. Scheduling retry.');
      
      // Update retry counters for attempted operations
      const updatedQueue = queue.map(op => {
        if (pending.some(p => p.id === op.id)) {
          const retries = (op.retryCount || 0) + 1;
          return {
            ...op,
            retryCount: retries,
            nextRetryTimestamp: now + (INITIAL_BACKOFF_MS * Math.pow(2, retries)),
            lastError: e.message || 'Network error'
          };
        }
        return op;
      });

      this.setQueue(updatedQueue);
      this.currentStatus = 'ERROR';
      this.emitStatus(e.message);
    } finally {
      this.syncInProgress = false;
    }
  }
}

// Initialize engine event listeners
MaroSyncEngine.init();
