// MARO ERP - Unit of Work Pattern (Atomic Transactional Operations for PostgreSQL & MARO Sync Engine)
import { MaroSyncEngine, SyncOperation } from '../lib/maroSyncEngine';

export interface EntityChange {
  collectionName: string;
  type: 'CREATE' | 'UPDATE' | 'DELETE';
  entityId: string;
  payload: any;
}

export class UnitOfWork {
  private pendingChanges: EntityChange[] = [];
  private isCommitted: boolean = false;

  registerNew(collectionName: string, entity: { id: string; [key: string]: any }): void {
    this.pendingChanges.push({
      collectionName,
      type: 'CREATE',
      entityId: entity.id,
      payload: entity
    });
  }

  registerDirty(collectionName: string, entity: { id: string; [key: string]: any }): void {
    this.pendingChanges.push({
      collectionName,
      type: 'UPDATE',
      entityId: entity.id,
      payload: entity
    });
  }

  registerDeleted(collectionName: string, entityId: string): void {
    this.pendingChanges.push({
      collectionName,
      type: 'DELETE',
      entityId,
      payload: { id: entityId }
    });
  }

  async commit(): Promise<void> {
    if (this.isCommitted) {
      throw new Error('UnitOfWork has already been committed');
    }

    if (this.pendingChanges.length === 0) {
      return;
    }

    // Process all registered changes atomically in local storage
    for (const change of this.pendingChanges) {
      if (change.type === 'DELETE') {
        const items = MaroSyncEngine.getLocalCollection(change.collectionName);
        const updated = items.filter((i: any) => i.id !== change.entityId);
        MaroSyncEngine.setLocalCollection(change.collectionName, updated);
      } else {
        const items = MaroSyncEngine.getLocalCollection(change.collectionName);
        const idx = items.findIndex((i: any) => i.id === change.entityId);
        if (idx >= 0) {
          items[idx] = { ...items[idx], ...change.payload, updatedAt: new Date().toISOString() };
        } else {
          items.push({ ...change.payload, updatedAt: new Date().toISOString() });
        }
        MaroSyncEngine.setLocalCollection(change.collectionName, items);
      }
    }

    // Convert changes to sync queue operations
    const operations: SyncOperation[] = this.pendingChanges.map(c => ({
      id: `uow_op_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      collectionName: c.collectionName,
      type: c.type,
      entityId: c.entityId,
      payload: c.payload,
      timestamp: new Date().toISOString(),
      status: 'PENDING',
      retryCount: 0
    }));

    // Dispatch batch to Sync Engine queue
    MaroSyncEngine.enqueueBatch(operations);

    this.isCommitted = true;
    this.pendingChanges = [];

    // Trigger background synchronization
    MaroSyncEngine.processSyncQueue();
  }

  rollback(): void {
    this.pendingChanges = [];
    this.isCommitted = false;
  }
}
