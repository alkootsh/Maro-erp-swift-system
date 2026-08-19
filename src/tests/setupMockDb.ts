/**
 * @file setupMockDb.ts
 * @description تهيئة قاعدة البيانات الافتراضية PGlite في الذاكرة لـ Drizzle قبل تحميل أي موديول آخر.
 */

import { Pool } from 'pg';
import { PGlite } from '@electric-sql/pglite';

// 1. تهيئة قاعدة البيانات الافتراضية بالكامل في الذاكرة
export const pglite = new PGlite();

class Mutex {
  private queue: (() => void)[] = [];
  private locked = false;

  async acquire() {
    if (!this.locked) {
      this.locked = true;
      return;
    }
    return new Promise<void>((resolve) => {
      this.queue.push(resolve);
    });
  }

  release() {
    if (this.queue.length > 0) {
      const next = this.queue.shift();
      next?.();
    } else {
      this.locked = false;
    }
  }
}

const txMutex = new Mutex();

// 2. إنشاء Pool حقيقي وتوجيه كل العمليات إلى PGlite
const pool = new Pool();

function formatPgliteRows(rows: any[], fields: any[], rowMode?: string) {
  if (!rows || !fields) return rows;
  
  // 1. تنسيق التواريخ والـ Timestamps أولاً
  const formatted = rows.map(row => {
    const newRow = { ...row };
    for (const field of fields) {
      const val = newRow[field.name];
      if (val instanceof Date) {
        if (field.dataTypeID === 1082) {
          // DATE type (OID 1082) -> format as YYYY-MM-DD string
          const y = val.getUTCFullYear();
          const m = String(val.getUTCMonth() + 1).padStart(2, '0');
          const d = String(val.getUTCDate()).padStart(2, '0');
          newRow[field.name] = `${y}-${m}-${d}`;
        } else {
          // TIMESTAMP types -> format as ISO string
          newRow[field.name] = val.toISOString();
        }
      }
    }
    return newRow;
  });

  // 2. إذا طلبت Drizzle نمط المصفوفة (rowMode = 'array')، نقوم بتحويل كل كائن إلى مصفوفة قيم مرتبة حسب الحقول
  if (rowMode === 'array') {
    return formatted.map(row => fields.map(field => {
      const val = row[field.name];
      return val === undefined ? null : val;
    }));
  }

  return formatted;
}

pool.query = async function (text: any, params?: any) {
  let sqlText = typeof text === 'string' ? text : text.text;
  let sqlParams = params || (typeof text === 'object' ? (text.values || text.params) : undefined);
  let rowMode = typeof text === 'object' ? text.rowMode : undefined;
  try {
    const res = await pglite.query(sqlText, sqlParams);
    const formattedRows = formatPgliteRows(res.rows, res.fields, rowMode);
    console.log('   [MOCK-DB DEBUG] Query:', sqlText);
    console.log('   [MOCK-DB DEBUG] Params:', sqlParams);
    console.log('   [MOCK-DB DEBUG] RowMode:', rowMode);
    console.log('   [MOCK-DB DEBUG] Result Rows:', JSON.stringify(formattedRows));
    return {
      rows: formattedRows,
      rowCount: res.affectedRows,
      fields: res.fields
    } as any;
  } catch (err: any) {
    console.error('   [MOCK-DB ERROR] Query failed:', sqlText, 'Params:', sqlParams, 'Error:', err);
    throw err;
  }
};

pool.connect = async function () {
  let inTransaction = false;
  const client = {
    query: async (text: any, params?: any) => {
      let sqlText = typeof text === 'string' ? text : text.text;
      let sqlParams = params || (typeof text === 'object' ? (text.values || text.params) : undefined);
      let rowMode = typeof text === 'object' ? text.rowMode : undefined;

      const trimmedSql = sqlText.trim().toLowerCase();
      if (trimmedSql.startsWith('begin')) {
        await txMutex.acquire();
        inTransaction = true;
      }

      try {
        const res = await pglite.query(sqlText, sqlParams);
        const formattedRows = formatPgliteRows(res.rows, res.fields, rowMode);
        console.log('   [MOCK-DB DEBUG] Conn Query:', sqlText);
        console.log('   [MOCK-DB DEBUG] Conn Params:', sqlParams);
        console.log('   [MOCK-DB DEBUG] Conn RowMode:', rowMode);
        console.log('   [MOCK-DB DEBUG] Conn Result Rows:', JSON.stringify(formattedRows));

        if (trimmedSql.startsWith('commit') || trimmedSql.startsWith('rollback')) {
          if (inTransaction) {
            inTransaction = false;
            txMutex.release();
          }
        }

        return {
          rows: formattedRows,
          rowCount: res.affectedRows,
          fields: res.fields
        } as any;
      } catch (err: any) {
        console.error('   [MOCK-DB ERROR] Conn Query failed:', sqlText, 'Params:', sqlParams, 'Error:', err);
        if (trimmedSql.startsWith('commit') || trimmedSql.startsWith('rollback') || inTransaction) {
          inTransaction = false;
          txMutex.release();
        }
        throw err;
      }
    },
    release: () => {
      if (inTransaction) {
        inTransaction = false;
        txMutex.release();
      }
    }
  };
  return client as any;
};

// 3. تسجيل الـ Pool في الـ global cache ليراه Drizzle فور تحميله
(global as any)._postgresPool = pool;

console.log('   [MOCK-DB] Virtual in-memory PostgreSQL pool registered successfully.');

// 4. اعتراض وتصحيح أي قيم تالفة تمر عبر PgDateString أو PgDate
import { PgDateString, PgDate } from 'drizzle-orm/pg-core';

const originalMapDateString = PgDateString.prototype.mapFromDriverValue;
PgDateString.prototype.mapFromDriverValue = function (value: any) {
  console.log('   [PgDateString DEBUG] mapFromDriverValue received:', value, 'type:', typeof value, 'column:', this.name);
  if (value === undefined || value === null) {
    console.warn('   [PgDateString DEBUG] Intercepted undefined/null for column:', this.name, 'returning empty/null.');
    return '';
  }
  try {
    return originalMapDateString.call(this, value);
  } catch (err: any) {
    console.error('   [PgDateString DEBUG] Failed to map:', value, 'on column:', this.name, err);
    throw err;
  }
};

const originalMapDate = PgDate.prototype.mapFromDriverValue;
PgDate.prototype.mapFromDriverValue = function (value: any) {
  console.log('   [PgDate DEBUG] mapFromDriverValue received:', value, 'type:', typeof value, 'column:', this.name);
  if (value === undefined || value === null) {
    console.warn('   [PgDate DEBUG] Intercepted undefined/null for column:', this.name, 'returning null.');
    return null as any;
  }
  try {
    return originalMapDate.call(this, value);
  } catch (err: any) {
    console.error('   [PgDate DEBUG] Failed to map:', value, 'on column:', this.name, err);
    throw err;
  }
};

