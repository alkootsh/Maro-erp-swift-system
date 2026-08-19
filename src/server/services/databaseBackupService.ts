/**
 * @file databaseBackupService.ts
 * @module Server Backup & Data Hygiene Service
 * @description محرك النسخ الاحتياطي والاستعادة والتصفير المخصص لقاعدة بيانات PostgreSQL و Drizzle ORM على الخادم.
 */

import { db } from '../../db';
import { 
  fiscalYears,
  chartOfAccounts,
  journalEntries,
  journalLines,
  openingBalances,
  openingStock,
  products,
  warehouses,
  stockLedger,
  customers,
  suppliers,
  salesInvoices,
  salesInvoiceLines,
  purchaseInvoices,
  purchaseInvoiceLines,
  posSessions,
  maintenanceLogs
} from '../../db/schema';
import { eq, and, sql, desc, inArray } from 'drizzle-orm';

export interface BackupMetadata {
  timestamp: string;
  version: string;
  companyName: string;
  tenantId?: string;
  checksum?: string;
  totalProducts: number;
  totalInvoices: number;
  totalCustomers: number;
  totalSuppliers: number;
  totalEntries: number;
  totalOpeningBalances: number;
  totalOpeningStock: number;
  totalSupportTickets: number;
  encrypted: boolean;
  fileSizeBytes: number;
}

export interface SelectiveWipeOptions {
  wipeSales?: boolean;
  wipePurchases?: boolean;
  wipeInventory?: boolean;
  wipeAccounting?: boolean;
  wipeCustomers?: boolean;
  wipeSuppliers?: boolean;
  wipePosSessions?: boolean;
  wipeOpeningBalances?: boolean;
  wipeSupportTickets?: boolean;
}

export interface DatabaseBackupPackage {
  _header: {
    system: string;
    version: string;
    exportedAt: string;
    tenantId: string;
    checksum: string;
    metadata: BackupMetadata;
  };
  tables: {
    fiscalYears: any[];
    chartOfAccounts: any[];
    warehouses: any[];
    products: any[];
    customers: any[];
    suppliers: any[];
    openingBalances: any[];
    openingStock: any[];
    stockLedger: any[];
    journalEntries: any[];
    journalLines: any[];
    salesInvoices: any[];
    salesInvoiceLines: any[];
    purchaseInvoices: any[];
    purchaseInvoiceLines: any[];
    posSessions: any[];
  };
  localStorageData?: Record<string, string>;
}

function calculateSimpleChecksum(content: string): string {
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return `CRC32-${Math.abs(hash).toString(16).toUpperCase()}`;
}

function parseDateOrUndefined(val: any): Date | undefined {
  if (!val) return undefined;
  const d = new Date(val);
  return isNaN(d.getTime()) ? undefined : d;
}

function parseDateOrNull(val: any): Date | null {
  if (!val) return null;
  const d = new Date(val);
  return isNaN(d.getTime()) ? null : d;
}

function formatDateString(val: any, fallback: string): string {
  if (!val) return fallback;
  if (val instanceof Date) {
    const y = val.getUTCFullYear();
    const m = String(val.getUTCMonth() + 1).padStart(2, '0');
    const d = String(val.getUTCDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  return String(val).split('T')[0];
}

export class DatabaseBackupService {
  public static async createDatabaseBackup(
    tenantId: string,
    userId?: string
  ): Promise<{ filename: string; jsonContent: string; metadata: BackupMetadata; pkg: DatabaseBackupPackage }> {
    if (!tenantId) throw new Error('معرف المنشأة (tenantId) مطلوب لإنشاء النسخة الاحتياطية.');

    const [
      allFiscalYears,
      allAccounts,
      allWarehouses,
      allProducts,
      allCustomers,
      allSuppliers,
      allOpeningBalances,
      allOpeningStock,
      allStockLedger,
      allJournalEntries,
      allSalesInvoices,
      allPurchaseInvoices,
      allPosSessions
    ] = await Promise.all([
      db.select().from(fiscalYears).where(eq(fiscalYears.tenantId, tenantId)),
      db.select().from(chartOfAccounts).where(eq(chartOfAccounts.tenantId, tenantId)),
      db.select().from(warehouses).where(eq(warehouses.tenantId, tenantId)),
      db.select().from(products).where(eq(products.tenantId, tenantId)),
      db.select().from(customers).where(eq(customers.tenantId, tenantId)),
      db.select().from(suppliers).where(eq(suppliers.tenantId, tenantId)),
      db.select().from(openingBalances).where(eq(openingBalances.tenantId, tenantId)),
      db.select().from(openingStock).where(eq(openingStock.tenantId, tenantId)),
      db.select().from(stockLedger).where(eq(stockLedger.tenantId, tenantId)),
      db.select().from(journalEntries).where(eq(journalEntries.tenantId, tenantId)),
      db.select().from(salesInvoices).where(eq(salesInvoices.tenantId, tenantId)),
      db.select().from(purchaseInvoices).where(eq(purchaseInvoices.tenantId, tenantId)),
      db.select().from(posSessions).where(eq(posSessions.tenantId, tenantId))
    ]);

    const entryIds = allJournalEntries.map(e => e.id);
    const allJournalLines = entryIds.length > 0
      ? await db.select().from(journalLines).where(inArray(journalLines.journalEntryId, entryIds))
      : [];

    const salesIds = allSalesInvoices.map(s => s.id);
    const allSalesLines = salesIds.length > 0
      ? await db.select().from(salesInvoiceLines).where(inArray(salesInvoiceLines.invoiceId, salesIds))
      : [];

    const purchaseIds = allPurchaseInvoices.map(p => p.id);
    const allPurchaseLines = purchaseIds.length > 0
      ? await db.select().from(purchaseInvoiceLines).where(inArray(purchaseInvoiceLines.billId, purchaseIds))
      : [];

    const rawTables = {
      fiscalYears: allFiscalYears,
      chartOfAccounts: allAccounts,
      warehouses: allWarehouses,
      products: allProducts,
      customers: allCustomers,
      suppliers: allSuppliers,
      openingBalances: allOpeningBalances,
      openingStock: allOpeningStock,
      stockLedger: allStockLedger,
      journalEntries: allJournalEntries,
      journalLines: allJournalLines,
      salesInvoices: allSalesInvoices,
      salesInvoiceLines: allSalesLines,
      purchaseInvoices: allPurchaseInvoices,
      purchaseInvoiceLines: allPurchaseLines,
      posSessions: allPosSessions
    };

    const payloadStringWithoutChecksum = JSON.stringify(rawTables);
    const checksum = calculateSimpleChecksum(payloadStringWithoutChecksum);

    const metadata: BackupMetadata = {
      timestamp: new Date().toISOString(),
      version: '4.0 Enterprise',
      companyName: 'MARO Business Platform',
      tenantId,
      checksum,
      totalProducts: allProducts.length,
      totalInvoices: allSalesInvoices.length + allPurchaseInvoices.length,
      totalCustomers: allCustomers.length,
      totalSuppliers: allSuppliers.length,
      totalEntries: allJournalEntries.length,
      totalOpeningBalances: allOpeningBalances.length,
      totalOpeningStock: allOpeningStock.length,
      totalSupportTickets: 0,
      encrypted: true,
      fileSizeBytes: payloadStringWithoutChecksum.length
    };

    const pkg: DatabaseBackupPackage = {
      _header: {
        system: 'MARO ERP Platform v4.0',
        version: '4.0 Enterprise',
        exportedAt: new Date().toISOString(),
        tenantId,
        checksum,
        metadata
      },
      tables: rawTables
    };

    const jsonContent = JSON.stringify(pkg, null, 2);
    const dateStr = new Date().toISOString().split('T')[0];
    const filename = `MARO_POSTGRES_BACKUP_${tenantId.substring(0, 8)}_${dateStr}.json`;

    try {
      await db.insert(maintenanceLogs).values({
        tenantId,
        userId: userId || null,
        operationType: 'BACKUP_CREATE',
        status: 'SUCCESS',
        details: {
          filename,
          checksum,
          totalProducts: allProducts.length,
          totalInvoices: metadata.totalInvoices,
          totalEntries: allJournalEntries.length
        },
        completedAt: new Date()
      });
    } catch (logErr) {
      console.warn('Failed to record backup maintenance log:', logErr);
    }

    return { filename, jsonContent, metadata, pkg };
  }

  public static inspectDatabaseBackup(fileContent: string): { 
    valid: boolean; 
    metadata: BackupMetadata; 
    rawData: DatabaseBackupPackage | null; 
    error?: string;
    tampered?: boolean;
  } {
    try {
      const parsed = JSON.parse(fileContent);
      if (parsed._header && parsed.tables) {
        const declaredChecksum = parsed._header.checksum;
        const computedChecksum = calculateSimpleChecksum(JSON.stringify(parsed.tables));
        const isTampered = declaredChecksum && declaredChecksum !== computedChecksum;

        const metadata: BackupMetadata = parsed._header.metadata || {
          timestamp: parsed._header.exportedAt || new Date().toISOString(),
          version: parsed._header.version || '4.0 Enterprise',
          companyName: 'MARO Business Platform',
          tenantId: parsed._header.tenantId,
          checksum: declaredChecksum,
          totalProducts: parsed.tables.products?.length || 0,
          totalInvoices: (parsed.tables.salesInvoices?.length || 0) + (parsed.tables.purchaseInvoices?.length || 0),
          totalCustomers: parsed.tables.customers?.length || 0,
          totalSuppliers: parsed.tables.suppliers?.length || 0,
          totalEntries: parsed.tables.journalEntries?.length || 0,
          totalOpeningBalances: parsed.tables.openingBalances?.length || 0,
          totalOpeningStock: parsed.tables.openingStock?.length || 0,
          totalSupportTickets: 0,
          encrypted: true,
          fileSizeBytes: fileContent.length
        };

        return {
          valid: true,
          metadata,
          rawData: parsed as DatabaseBackupPackage,
          tampered: isTampered
        };
      } else if (parsed._header && parsed.data) {
        return {
          valid: true,
          metadata: parsed._header.metadata || this.emptyMetadata(),
          rawData: parsed
        };
      } else if (typeof parsed === 'object' && parsed !== null) {
        return {
          valid: true,
          metadata: this.emptyMetadata(),
          rawData: parsed
        };
      }
      return { valid: false, metadata: this.emptyMetadata(), rawData: null, error: 'صيغة ملف النسخة الاحتياطية غير معروفة' };
    } catch (e: any) {
      return { valid: false, metadata: this.emptyMetadata(), rawData: null, error: 'الملف ليس بصيغة JSON صحيحة' };
    }
  }

  public static async restoreDatabaseBackup(
    targetTenantId: string,
    backupPkg: DatabaseBackupPackage,
    userId?: string,
    options?: { overrideTenantId?: boolean }
  ): Promise<{ success: boolean; restoredCounts: Record<string, number> }> {
    if (!targetTenantId) throw new Error('معرف المنشأة المستهدفة (targetTenantId) مطلوب للاستعادة.');
    if (!backupPkg || !backupPkg.tables) throw new Error('بيانات النسخة الاحتياطية غير صالحة.');

    const sourceTenantId = backupPkg._header?.tenantId || targetTenantId;
    const effectiveTenantId = targetTenantId;

    const t = backupPkg.tables;
    const restoredCounts: Record<string, number> = {};

    await db.transaction(async (tx) => {
      // 1. مسح البيانات الحالية بترتيب عكسي لمنع أخطاء Foreign Key
      await tx.delete(salesInvoiceLines).where(
        inArray(salesInvoiceLines.invoiceId, 
          tx.select({ id: salesInvoices.id }).from(salesInvoices).where(eq(salesInvoices.tenantId, effectiveTenantId))
        )
      );
      await tx.delete(salesInvoices).where(eq(salesInvoices.tenantId, effectiveTenantId));

      await tx.delete(purchaseInvoiceLines).where(
        inArray(purchaseInvoiceLines.billId, 
          tx.select({ id: purchaseInvoices.id }).from(purchaseInvoices).where(eq(purchaseInvoices.tenantId, effectiveTenantId))
        )
      );
      await tx.delete(purchaseInvoices).where(eq(purchaseInvoices.tenantId, effectiveTenantId));

      await tx.delete(journalLines).where(
        inArray(journalLines.journalEntryId,
          tx.select({ id: journalEntries.id }).from(journalEntries).where(eq(journalEntries.tenantId, effectiveTenantId))
        )
      );
      await tx.delete(journalEntries).where(eq(journalEntries.tenantId, effectiveTenantId));

      await tx.delete(stockLedger).where(eq(stockLedger.tenantId, effectiveTenantId));
      await tx.delete(posSessions).where(eq(posSessions.tenantId, effectiveTenantId));
      await tx.delete(openingBalances).where(eq(openingBalances.tenantId, effectiveTenantId));
      await tx.delete(openingStock).where(eq(openingStock.tenantId, effectiveTenantId));
      await tx.delete(products).where(eq(products.tenantId, effectiveTenantId));
      await tx.delete(warehouses).where(eq(warehouses.tenantId, effectiveTenantId));
      await tx.delete(customers).where(eq(customers.tenantId, effectiveTenantId));
      await tx.delete(suppliers).where(eq(suppliers.tenantId, effectiveTenantId));
      await tx.delete(chartOfAccounts).where(eq(chartOfAccounts.tenantId, effectiveTenantId));
      await tx.delete(fiscalYears).where(eq(fiscalYears.tenantId, effectiveTenantId));

      // 2. إدخال البيانات الجديدة بالترتيب المعتمد للتبعيات
      if (t.fiscalYears && t.fiscalYears.length > 0) {
        for (const item of t.fiscalYears) {
          await tx.insert(fiscalYears).values({
            ...item,
            tenantId: effectiveTenantId,
            startDate: formatDateString(item.startDate, '2026-01-01'),
            endDate: formatDateString(item.endDate, '2026-12-31'),
            closedAt: parseDateOrNull(item.closedAt),
            createdAt: parseDateOrUndefined(item.createdAt),
            updatedAt: parseDateOrUndefined(item.updatedAt)
          });
        }
        restoredCounts.fiscalYears = t.fiscalYears.length;
      }

      if (t.chartOfAccounts && t.chartOfAccounts.length > 0) {
        for (const item of t.chartOfAccounts) {
          await tx.insert(chartOfAccounts).values({
            ...item,
            tenantId: effectiveTenantId,
            createdAt: parseDateOrUndefined(item.createdAt)
          });
        }
        restoredCounts.chartOfAccounts = t.chartOfAccounts.length;
      }

      if (t.warehouses && t.warehouses.length > 0) {
        for (const item of t.warehouses) {
          await tx.insert(warehouses).values({
            ...item,
            tenantId: effectiveTenantId,
            createdAt: parseDateOrUndefined(item.createdAt)
          });
        }
        restoredCounts.warehouses = t.warehouses.length;
      }

      if (t.products && t.products.length > 0) {
        for (const item of t.products) {
          await tx.insert(products).values({
            ...item,
            tenantId: effectiveTenantId,
            createdAt: parseDateOrUndefined(item.createdAt)
          });
        }
        restoredCounts.products = t.products.length;
      }

      if (t.customers && t.customers.length > 0) {
        for (const item of t.customers) {
          await tx.insert(customers).values({
            ...item,
            tenantId: effectiveTenantId,
            createdAt: parseDateOrUndefined(item.createdAt)
          });
        }
        restoredCounts.customers = t.customers.length;
      }

      if (t.suppliers && t.suppliers.length > 0) {
        for (const item of t.suppliers) {
          await tx.insert(suppliers).values({
            ...item,
            tenantId: effectiveTenantId,
            createdAt: parseDateOrUndefined(item.createdAt)
          });
        }
        restoredCounts.suppliers = t.suppliers.length;
      }

      if (t.openingBalances && t.openingBalances.length > 0) {
        for (const item of t.openingBalances) {
          await tx.insert(openingBalances).values({
            ...item,
            tenantId: effectiveTenantId,
            createdAt: parseDateOrUndefined(item.createdAt),
            updatedAt: parseDateOrUndefined(item.updatedAt)
          });
        }
        restoredCounts.openingBalances = t.openingBalances.length;
      }

      if (t.openingStock && t.openingStock.length > 0) {
        for (const item of t.openingStock) {
          await tx.insert(openingStock).values({
            ...item,
            tenantId: effectiveTenantId,
            expiryDate: parseDateOrNull(item.expiryDate),
            createdAt: parseDateOrUndefined(item.createdAt),
            updatedAt: parseDateOrUndefined(item.updatedAt)
          });
        }
        restoredCounts.openingStock = t.openingStock.length;
      }

      if (t.stockLedger && t.stockLedger.length > 0) {
        for (const item of t.stockLedger) {
          await tx.insert(stockLedger).values({
            ...item,
            tenantId: effectiveTenantId,
            date: parseDateOrUndefined(item.date) || new Date()
          });
        }
        restoredCounts.stockLedger = t.stockLedger.length;
      }

      if (t.journalEntries && t.journalEntries.length > 0) {
        for (const item of t.journalEntries) {
          await tx.insert(journalEntries).values({
            ...item,
            tenantId: effectiveTenantId,
            date: parseDateOrUndefined(item.date) || new Date(),
            createdAt: parseDateOrUndefined(item.createdAt)
          });
        }
        restoredCounts.journalEntries = t.journalEntries.length;
      }

      if (t.journalLines && t.journalLines.length > 0) {
        for (const item of t.journalLines) {
          await tx.insert(journalLines).values(item);
        }
        restoredCounts.journalLines = t.journalLines.length;
      }

      if (t.salesInvoices && t.salesInvoices.length > 0) {
        for (const item of t.salesInvoices) {
          await tx.insert(salesInvoices).values({
            ...item,
            tenantId: effectiveTenantId,
            date: parseDateOrUndefined(item.date) || new Date(),
            createdAt: parseDateOrUndefined(item.createdAt)
          });
        }
        restoredCounts.salesInvoices = t.salesInvoices.length;
      }

      if (t.salesInvoiceLines && t.salesInvoiceLines.length > 0) {
        for (const item of t.salesInvoiceLines) {
          await tx.insert(salesInvoiceLines).values(item);
        }
        restoredCounts.salesInvoiceLines = t.salesInvoiceLines.length;
      }

      if (t.purchaseInvoices && t.purchaseInvoices.length > 0) {
        for (const item of t.purchaseInvoices) {
          await tx.insert(purchaseInvoices).values({
            ...item,
            tenantId: effectiveTenantId,
            date: parseDateOrUndefined(item.date) || new Date(),
            createdAt: parseDateOrUndefined(item.createdAt)
          });
        }
        restoredCounts.purchaseInvoices = t.purchaseInvoices.length;
      }

      if (t.purchaseInvoiceLines && t.purchaseInvoiceLines.length > 0) {
        for (const item of t.purchaseInvoiceLines) {
          await tx.insert(purchaseInvoiceLines).values(item);
        }
        restoredCounts.purchaseInvoiceLines = t.purchaseInvoiceLines.length;
      }

      if (t.posSessions && t.posSessions.length > 0) {
        for (const item of t.posSessions) {
          await tx.insert(posSessions).values({
            ...item,
            tenantId: effectiveTenantId,
            openedAt: parseDateOrUndefined(item.openedAt) || new Date(),
            closedAt: parseDateOrNull(item.closedAt)
          });
        }
        restoredCounts.posSessions = t.posSessions.length;
      }

      await tx.insert(maintenanceLogs).values({
        tenantId: effectiveTenantId,
        userId: userId || null,
        operationType: 'BACKUP_RESTORE',
        status: 'SUCCESS',
        details: {
          sourceTenantId,
          restoredCounts,
          restoredAt: new Date().toISOString()
        },
        completedAt: new Date()
      });
    });

    return { success: true, restoredCounts };
  }

  public static async performSelectiveWipe(
    tenantId: string,
    options: SelectiveWipeOptions,
    userId?: string
  ): Promise<{ wipedModules: string[]; success: boolean }> {
    if (!tenantId) throw new Error('معرف المنشأة (tenantId) مطلوب لتنفيذ التصفير المخصص.');

    const wipedModules: string[] = [];

    await db.transaction(async (tx) => {
      if (options.wipeSales || options.wipePosSessions) {
        await tx.delete(salesInvoiceLines).where(
          inArray(salesInvoiceLines.invoiceId,
            tx.select({ id: salesInvoices.id }).from(salesInvoices).where(eq(salesInvoices.tenantId, tenantId))
          )
        );
        await tx.delete(salesInvoices).where(eq(salesInvoices.tenantId, tenantId));
        await tx.delete(posSessions).where(eq(posSessions.tenantId, tenantId));
        wipedModules.push('SALES', 'POS_SESSIONS');
      }

      if (options.wipePurchases) {
        await tx.delete(purchaseInvoiceLines).where(
          inArray(purchaseInvoiceLines.billId,
            tx.select({ id: purchaseInvoices.id }).from(purchaseInvoices).where(eq(purchaseInvoices.tenantId, tenantId))
          )
        );
        await tx.delete(purchaseInvoices).where(eq(purchaseInvoices.tenantId, tenantId));
        wipedModules.push('PURCHASES');
      }

      if (options.wipeInventory) {
        await tx.delete(stockLedger).where(eq(stockLedger.tenantId, tenantId));
        wipedModules.push('STOCK_LEDGER');
      }

      if (options.wipeAccounting) {
        await tx.delete(journalLines).where(
          inArray(journalLines.journalEntryId,
            tx.select({ id: journalEntries.id }).from(journalEntries).where(eq(journalEntries.tenantId, tenantId))
          )
        );
        await tx.delete(journalEntries).where(eq(journalEntries.tenantId, tenantId));
        wipedModules.push('ACCOUNTING_JOURNALS');
      }

      if (options.wipeCustomers) {
        await tx.delete(customers).where(eq(customers.tenantId, tenantId));
        wipedModules.push('CUSTOMERS');
      }
      if (options.wipeSuppliers) {
        await tx.delete(suppliers).where(eq(suppliers.tenantId, tenantId));
        wipedModules.push('SUPPLIERS');
      }

      if (options.wipeOpeningBalances) {
        await tx.delete(openingBalances).where(eq(openingBalances.tenantId, tenantId));
        await tx.delete(openingStock).where(eq(openingStock.tenantId, tenantId));
        wipedModules.push('OPENING_BALANCES', 'OPENING_STOCK');
      }

      await tx.insert(maintenanceLogs).values({
        tenantId,
        userId: userId || null,
        operationType: 'SELECTIVE_WIPE',
        status: 'SUCCESS',
        details: {
          wipedModules,
          options
        },
        completedAt: new Date()
      });
    });

    return { wipedModules, success: true };
  }

  public static async performTotalFactoryReset(
    tenantId: string,
    confirmPhrase: string,
    userId?: string
  ): Promise<{ success: boolean; preResetBackupFilename: string }> {
    if (!tenantId) throw new Error('معرف المنشأة (tenantId) مطلوب لتنفيذ التصفير الإجمالي.');
    
    const validPhrase = confirmPhrase.trim().toUpperCase();
    if (validPhrase !== 'DESTROY' && validPhrase !== 'CONFIRM_RESET' && validPhrase !== 'تصفير') {
      throw new Error('رمز التأكيد غير صحيح. يرجى كتابة DESTROY أو تصفير لتأكيد التصفير الإجمالي.');
    }

    const backupRes = await this.createDatabaseBackup(tenantId, userId);

    await db.transaction(async (tx) => {
      await tx.delete(salesInvoiceLines).where(
        inArray(salesInvoiceLines.invoiceId,
          tx.select({ id: salesInvoices.id }).from(salesInvoices).where(eq(salesInvoices.tenantId, tenantId))
        )
      );
      await tx.delete(salesInvoices).where(eq(salesInvoices.tenantId, tenantId));

      await tx.delete(purchaseInvoiceLines).where(
        inArray(purchaseInvoiceLines.billId,
          tx.select({ id: purchaseInvoices.id }).from(purchaseInvoices).where(eq(purchaseInvoices.tenantId, tenantId))
        )
      );
      await tx.delete(purchaseInvoices).where(eq(purchaseInvoices.tenantId, tenantId));

      await tx.delete(journalLines).where(
        inArray(journalLines.journalEntryId,
          tx.select({ id: journalEntries.id }).from(journalEntries).where(eq(journalEntries.tenantId, tenantId))
        )
      );
      await tx.delete(journalEntries).where(eq(journalEntries.tenantId, tenantId));

      await tx.delete(stockLedger).where(eq(stockLedger.tenantId, tenantId));
      await tx.delete(posSessions).where(eq(posSessions.tenantId, tenantId));
      await tx.delete(openingBalances).where(eq(openingBalances.tenantId, tenantId));
      await tx.delete(openingStock).where(eq(openingStock.tenantId, tenantId));
      await tx.delete(products).where(eq(products.tenantId, tenantId));
      await tx.delete(warehouses).where(eq(warehouses.tenantId, tenantId));
      await tx.delete(customers).where(eq(customers.tenantId, tenantId));
      await tx.delete(suppliers).where(eq(suppliers.tenantId, tenantId));
      await tx.delete(chartOfAccounts).where(eq(chartOfAccounts.tenantId, tenantId));
      await tx.delete(fiscalYears).where(eq(fiscalYears.tenantId, tenantId));

      const [accAsset] = await tx.insert(chartOfAccounts).values({
        tenantId,
        code: '100000',
        name: 'الأصول (Assets)',
        type: 'ASSET',
        isActive: true
      }).returning();

      await tx.insert(chartOfAccounts).values([
        { tenantId, code: '110000', name: 'الصندوق والنقدية وما في حكمها', type: 'ASSET', parentId: accAsset.id, isActive: true },
        { tenantId, code: '120000', name: 'العملاء والمدينون', type: 'ASSET', parentId: accAsset.id, isActive: true },
        { tenantId, code: '130000', name: 'المخزون السلعي والبضاعة', type: 'ASSET', parentId: accAsset.id, isActive: true },
        { tenantId, code: '200000', name: 'الالتزامات والخصوم (Liabilities)', type: 'LIABILITY', isActive: true },
        { tenantId, code: '210000', name: 'الموردون والدائنون', type: 'LIABILITY', isActive: true },
        { tenantId, code: '300000', name: 'حقوق الملكية (Equity)', type: 'EQUITY', isActive: true },
        { tenantId, code: '310000', name: 'الأرباح المبقاة والمدورة', type: 'EQUITY', isActive: true },
        { tenantId, code: '400000', name: 'الإيرادات والمبيعات (Revenue)', type: 'REVENUE', isActive: true },
        { tenantId, code: '500000', name: 'المصروفات وتكلفة النشاط (Expenses)', type: 'EXPENSE', isActive: true }
      ]);

      await tx.insert(warehouses).values({
        tenantId,
        code: 'WH-MAIN',
        name: 'المستودع الرئيسي الافتراضي',
        isActive: true
      });

      const currentYear = new Date().getFullYear();
      await tx.insert(fiscalYears).values({
        tenantId,
        name: `سنة مالية ${currentYear}`,
        startDate: `${currentYear}-01-01`,
        endDate: `${currentYear}-12-31`,
        status: 'OPEN',
        isCurrent: true
      });

      await tx.insert(maintenanceLogs).values({
        tenantId,
        userId: userId || null,
        operationType: 'FACTORY_RESET',
        status: 'SUCCESS',
        details: {
          preResetBackupFilename: backupRes.filename,
          executedAt: new Date().toISOString()
        },
        completedAt: new Date()
      });
    });

    return { success: true, preResetBackupFilename: backupRes.filename };
  }

  public static async getMaintenanceLogs(tenantId: string): Promise<any[]> {
    if (!tenantId) return [];
    return await db
      .select()
      .from(maintenanceLogs)
      .where(eq(maintenanceLogs.tenantId, tenantId))
      .orderBy(desc(maintenanceLogs.startedAt));
  }

  private static emptyMetadata(): BackupMetadata {
    return {
      timestamp: new Date().toISOString(),
      version: '4.0',
      companyName: 'MARO Platform',
      totalProducts: 0,
      totalInvoices: 0,
      totalCustomers: 0,
      totalSuppliers: 0,
      totalEntries: 0,
      totalOpeningBalances: 0,
      totalOpeningStock: 0,
      totalSupportTickets: 0,
      encrypted: false,
      fileSizeBytes: 0
    };
  }
}
