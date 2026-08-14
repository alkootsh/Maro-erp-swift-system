import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema.ts';
import 'dotenv/config';

// Global cache to persist across hot-reloads in dev
declare global {
  var _postgresPool: Pool | undefined;
}

export const createPool = () => {
  if (!global._postgresPool) {
    if (!process.env.DATABASE_URL) {
      console.warn("DATABASE_URL is not set. Database connection will fail if queried.");
      return new Pool(); // Return empty pool to avoid immediate crash at startup
    }
    
    global._postgresPool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 10,
      connectionTimeoutMillis: 15000,
    });

    global._postgresPool.on('error', (err) => {
      console.error('Unexpected error on idle SQL pool client:', err);
    });
  }
  return global._postgresPool;
};

const pool = createPool();

// Initialize Drizzle with the pool and strictly defined relational schema
export const db = drizzle(pool, { schema });
