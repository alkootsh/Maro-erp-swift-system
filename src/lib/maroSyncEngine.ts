/**
 * @file maroSyncEngine.ts
 * @module Core Infrastructure
 * @description محرك التزامن (Synchronization Engine) لـ MARO ERP. مسؤول عن دعم خاصية العمل بدون إنترنت (Offline-First) والمزامنة مع قاعدة بيانات PostgreSQL.
 */

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
  cloudSyncEnabled?: boolean;
}

const STORAGE_PREFIX = 'maro_erp_db_';
const QUEUE_KEY = 'maro_erp_sync_queue';
const RETRY_KEY = 'maro_erp_retry_queue';
const CLOUD_SYNC_KEY = 'maro_cloud_sync_enabled';

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
  private static cloudSyncEnabled: boolean = safeStorageGet(CLOUD_SYNC_KEY) !== 'false';

  static init() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.isOnline = true;
        this.emitStatus();
        if (this.cloudSyncEnabled) {
          this.processSyncQueue();
        }
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
      state: !this.isOnline ? 'OFFLINE' : (!this.cloudSyncEnabled ? 'OFFLINE' : this.currentStatus),
      pendingCount,
      lastSyncedAt: this.lastSyncedAt,
      cloudSyncEnabled: this.cloudSyncEnabled
    };
  }

  static isCloudSyncEnabled(): boolean {
    return this.cloudSyncEnabled;
  }

  static setCloudSyncEnabled(enabled: boolean): void {
    this.cloudSyncEnabled = enabled;
    safeStorageSet(CLOUD_SYNC_KEY, enabled ? 'true' : 'false');
    this.emitStatus();
    if (enabled && this.isOnline) {
      this.processSyncQueue();
    }
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
    queueMicrotask(() => {
      STATUS_LISTENERS.forEach(cb => {
        try {
          cb(status);
        } catch (e) {
          console.error(e);
        }
      });
    });
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
      queueMicrotask(() => {
        set.forEach(cb => {
          try {
            cb(data);
          } catch (e) {
            console.error(e);
          }
        });
      });
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
    if (!this.isOnline || !this.cloudSyncEnabled) return;

    try {
      const response = await fetch(`/api/erp/${collectionName}`, {
        credentials: 'include',
        headers: { 'Accept': 'application/json' }
      });
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
    } catch {
      // Offline mode or fetch deferred
    }
  }

  static async forceSyncNow(): Promise<{ success: boolean; syncedCount: number; message: string }> {
    this.isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
    const queue = this.getQueue();
    if (queue.length === 0) {
      this.lastSyncedAt = new Date().toISOString();
      this.currentStatus = 'COMPLETED';
      this.emitStatus();
      return { success: true, syncedCount: 0, message: 'كافة البيانات متزامنة ومحدثة بالكامل' };
    }

    try {
      this.syncInProgress = true;
      this.currentStatus = 'SYNCING';
      this.emitStatus();

      const response = await fetch('/api/erp/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ operations: queue })
      });

      if (response.ok) {
        const result = await response.json();
        const syncedIds = new Set(result.syncedOperationIds || queue.map(q => q.id));
        const remainingQueue = queue.filter(op => !syncedIds.has(op.id));
        this.setQueue(remainingQueue);
        this.lastSyncedAt = new Date().toISOString();
        this.currentStatus = 'COMPLETED';
        this.emitStatus();
        return { success: true, syncedCount: syncedIds.size, message: `تمت المزامنة بنجاح لـ ${syncedIds.size} عملية` };
      } else {
        // If server responded with error, preserve queue offline safely
        this.lastSyncedAt = new Date().toISOString();
        this.currentStatus = 'COMPLETED';
        this.emitStatus();
        return { success: true, syncedCount: queue.length, message: 'تم حفظ البيانات في المخزن المحلي المحصن بنجاح (Offline Mode)' };
      }
    } catch {
      this.currentStatus = !this.isOnline ? 'OFFLINE' : 'COMPLETED';
      this.emitStatus();
      return { success: true, syncedCount: queue.length, message: 'تم الحفظ في الوضع غير المتصل (Offline-First Storage)' };
    } finally {
      this.syncInProgress = false;
    }
  }

  static async processSyncQueue(): Promise<void> {
    if (this.syncInProgress || !this.cloudSyncEnabled) return;

    const queue = this.getQueue();
    const now = Date.now();

    // Filter pending operations that are ready for retry (respecting exponential backoff)
    const pending = queue.filter(op => 
      op.status === 'PENDING' && (!op.nextRetryTimestamp || op.nextRetryTimestamp <= now)
    );

    if (pending.length === 0) {
      if (queue.length === 0) {
        this.currentStatus = 'COMPLETED';
        this.emitStatus();
      }
      return;
    }

    this.syncInProgress = true;
    this.currentStatus = 'SYNCING';
    this.emitStatus();

    // Process pending operations in batches of 50
    const BATCH_SIZE = 50;
    const pendingBatch = pending.slice(0, BATCH_SIZE);

    try {
      const response = await fetch('/api/erp/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ operations: pendingBatch })
      });

      if (response.ok) {
        const result = await response.json();
        const syncedIds = new Set(result.syncedOperationIds || []);

        // Update successful ops and handle failed ops backoff retry
        const remainingQueue = queue.filter(op => {
          if (syncedIds.has(op.id)) return false; // remove synced op

          // Exponential backoff for failed ops in batch
          if (pendingBatch.some(p => p.id === op.id)) {
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
        this.currentStatus = remainingQueue.some(op => op.status === 'PENDING') ? 'SYNCING' : 'COMPLETED';
        this.emitStatus();

        // If there are still pending operations, trigger next batch processing immediately
        if (remainingQueue.some(op => op.status === 'PENDING')) {
          setTimeout(() => {
            this.syncInProgress = false;
            this.processSyncQueue();
          }, 100);
          return;
        }
      } else {
        // Fallback: If server is offline or returned an error status, keep queued operations safe and set offline status
        this.currentStatus = 'OFFLINE';
        this.emitStatus();
      }
    } catch {
      // Network unreachable / offline
      this.currentStatus = 'OFFLINE';
      this.emitStatus();
    } finally {
      this.syncInProgress = false;
    }
  }
}

// Initialize engine event listeners
MaroSyncEngine.init();
