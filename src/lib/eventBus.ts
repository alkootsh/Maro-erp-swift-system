/**
 * @file eventBus.ts
 * @module المكتبات والمحركات الأساسية (Core Libraries)
 * @description ملف جزء من نظام MARO ERP. الوظيفة: eventBus.ts.
 */
// MARO ERP - Decoupled Event Bus Engine
import { MaroEvent } from '../types/sprint8';

type EventCallback = (event: MaroEvent) => Promise<void> | void;

export class MaroEventBus {
  private static subscribers: Map<string, Set<EventCallback>> = new Map();

  static subscribe(eventType: MaroEvent['type'], callback: EventCallback): () => void {
    if (!this.subscribers.has(eventType)) {
      this.subscribers.set(eventType, new Set());
    }
    const set = this.subscribers.get(eventType)!;
    set.add(callback);

    return () => {
      set.delete(callback);
    };
  }

  static async publish(eventType: MaroEvent['type'], payload: Record<string, any>): Promise<MaroEvent> {
    const event: MaroEvent = {
      id: `evt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      type: eventType,
      timestamp: new Date().toISOString(),
      payload
    };

    const listeners = this.subscribers.get(eventType);
    if (listeners && listeners.size > 0) {
      for (const callback of listeners) {
        try {
          await callback(event);
        } catch (e) {
          console.error(`[MaroEventBus] Error handling event ${eventType}:`, e);
        }
      }
    }

    return event;
  }
}
