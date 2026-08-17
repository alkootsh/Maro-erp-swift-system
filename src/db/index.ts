/**
 * @file index.ts
 * @module ملف إضافي في النظام
 * @description ملف جزء من نظام MARO ERP. الوظيفة: index.ts.
 */
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema.ts';
import 'dotenv/config';

// Global cache to persist across hot-reloads in dev
declare global {
  var _postgresPool: Pool | undefined;
}

export const isDatabaseConfigured = (): boolean => {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) return false;
  return url.startsWith('postgres://') || url.startsWith('postgresql://');
};

export const createPool = () => {
  if (!global._postgresPool) {
    if (!isDatabaseConfigured()) {
      return new Pool(); // Return dummy pool for offline / standalone mode
    }
    
    global._postgresPool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 10,
      connectionTimeoutMillis: 15000,
    });

    global._postgresPool.on('error', (err) => {
      // Ignore idle client disconnect errors in preview environment
    });
  }
  return global._postgresPool;
};

const pool = createPool();

// Initialize Drizzle with the pool and strictly defined relational schema
export const db = drizzle(pool, { schema });
