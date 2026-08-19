/**
 * @file polyfills.ts
 * @description Global polyfills for browser runtime (Buffer, global, process, EventEmitter)
 */
import { Buffer } from 'buffer';
import { EventEmitter } from 'events';

if (typeof window !== 'undefined') {
  (window as any).Buffer = Buffer;
  (window as any).global = window;
  (window as any).EventEmitter = EventEmitter;
  if (!(window as any).process) {
    (window as any).process = { env: {} };
  }
}

if (typeof globalThis !== 'undefined') {
  (globalThis as any).Buffer = Buffer;
  (globalThis as any).global = globalThis;
  (globalThis as any).EventEmitter = EventEmitter;
  if (!(globalThis as any).process) {
    (globalThis as any).process = { env: {} };
  }
}

export { Buffer, EventEmitter };
