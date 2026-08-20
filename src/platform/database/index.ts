/**
 * @file index.ts
 * @module Platform Database Gateway
 * @description Central PostgreSQL & Drizzle ORM Database Access Gateway
 */

export { db, isDatabaseConfigured } from '../../db/index';
export * from '../../db/schema';
