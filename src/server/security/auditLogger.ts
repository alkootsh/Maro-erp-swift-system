/**
 * @file auditLogger.ts
 * @module Server Security & Audit
 * @description Enterprise Audit Logging Engine for PostgreSQL with Resilient Offline Queue
 */
import { db, isDatabaseConfigured } from '../../db/index';
import { auditLogs } from '../../db/schema';

export interface AuditEventPayload {
  tenantId?: string | null;
  userId?: string | null;
  action: string;
  entityType?: string;
  entityId?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
  timestamp?: Date;
}

// In-memory queue for audit events generated during database downtime
const offlineAuditQueue: AuditEventPayload[] = [];
const MAX_OFFLINE_QUEUE_SIZE = 2000;

export class AuditLogger {
  /**
   * Log sensitive security and operational events to PostgreSQL
   * If database is offline, events are safely queued and flushed upon recovery.
   */
  static async log(event: AuditEventPayload): Promise<void> {
    const payloadWithTime = {
      ...event,
      timestamp: event.timestamp || new Date()
    };

    try {
      if (isDatabaseConfigured()) {
        await db.insert(auditLogs).values({
          tenantId: payloadWithTime.tenantId || null,
          userId: payloadWithTime.userId || null,
          action: payloadWithTime.action,
          entityType: payloadWithTime.entityType || 'SYSTEM',
          entityId: payloadWithTime.entityId || null,
          ipAddress: payloadWithTime.ipAddress || 'unknown',
          userAgent: payloadWithTime.userAgent || 'unknown',
          metadata: payloadWithTime.metadata || {},
          createdAt: payloadWithTime.timestamp,
        });
        return;
      }
      throw new Error('DATABASE_URL not configured');
    } catch {
      // Safely enqueue for offline sync
      if (offlineAuditQueue.length >= MAX_OFFLINE_QUEUE_SIZE) {
        offlineAuditQueue.shift(); // Evict oldest to avoid memory leaks
      }
      offlineAuditQueue.push(payloadWithTime);
    }
  }

  /**
   * Get pending offline audit logs count
   */
  static getPendingOfflineCount(): number {
    return offlineAuditQueue.length;
  }

  static getOfflineQueueLength(): number {
    return offlineAuditQueue.length;
  }

  /**
   * Flush all offline queued audit logs into PostgreSQL upon database recovery
   */
  static async flushOfflineQueue(): Promise<{ flushed: number; remaining: number }> {
    if (offlineAuditQueue.length === 0) return { flushed: 0, remaining: 0 };

    const itemsToFlush = [...offlineAuditQueue];
    let flushedCount = 0;

    try {
      if (!isDatabaseConfigured()) {
        return { flushed: 0, remaining: offlineAuditQueue.length };
      }

      for (const event of itemsToFlush) {
        await db.insert(auditLogs).values({
          tenantId: event.tenantId || null,
          userId: event.userId || null,
          action: event.action,
          entityType: event.entityType || 'SYSTEM',
          entityId: event.entityId || null,
          ipAddress: event.ipAddress || 'unknown',
          userAgent: event.userAgent || 'unknown',
          metadata: {
            ...(event.metadata || {}),
            offlineQueued: true,
            flushedAt: new Date().toISOString()
          },
          createdAt: event.timestamp || new Date(),
        });
        flushedCount++;
      }

      // Remove flushed items from queue
      offlineAuditQueue.splice(0, flushedCount);
      return { flushed: flushedCount, remaining: offlineAuditQueue.length };
    } catch (err: any) {
      console.warn('[AUDIT LOGGER] Failed to flush offline queue:', err?.message);
      return { flushed: flushedCount, remaining: offlineAuditQueue.length };
    }
  }

  /**
   * Get recent audit events (from queue if offline, or helper)
   */
  static getOfflineQueueSnapshot(): AuditEventPayload[] {
    return [...offlineAuditQueue];
  }
}

