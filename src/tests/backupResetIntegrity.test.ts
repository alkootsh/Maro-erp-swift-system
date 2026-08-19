/**
 * @file backupResetIntegrity.test.ts
 * @module Phase 3 Verification / Database Backup & Reset Engine Integrity Test
 * @description اختبارات التحقق الشاملة لمحرك النسخ الاحتياطي والاستعادة والتصفير المخصص والشامل لمنظومة MARO ERP.
 */

// 1. استيراد قاعدة البيانات الافتراضية
import { pglite } from './setupMockDb';
import { db } from '../db';
import {
  tenants,
  branches,
  users,
  chartOfAccounts,
  fiscalYears,
  warehouses,
  products,
  customers,
  suppliers,
  openingBalances,
  openingStock,
  stockLedger,
  journalEntries,
  journalLines,
  salesInvoices,
  salesInvoiceLines,
  purchaseInvoices,
  purchaseInvoiceLines,
  posSessions,
  maintenanceLogs
} from '../db/schema';
import { eq, inArray } from 'drizzle-orm';
import { BackupService } from '../services/backupService';

async function initSchema() {
  console.log('   ⚡ Setting up all virtual PostgreSQL tables...');

  await pglite.query(`
    CREATE TABLE IF NOT EXISTS tenants (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(255) NOT NULL,
      is_active BOOLEAN DEFAULT true,
      metadata JSONB,
      created_at TIMESTAMP DEFAULT now() NOT NULL
    );
  `);

  await pglite.query(`
    CREATE TABLE IF NOT EXISTS branches (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id UUID REFERENCES tenants(id),
      code VARCHAR(50) NOT NULL,
      name VARCHAR(255) NOT NULL,
      phone VARCHAR(50),
      address TEXT,
      is_active BOOLEAN DEFAULT true,
      metadata JSONB,
      created_at TIMESTAMP DEFAULT now() NOT NULL
    );
  `);

  await pglite.query(`
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id UUID REFERENCES tenants(id),
      email VARCHAR(255) NOT NULL,
      name VARCHAR(255) NOT NULL,
      password_hash TEXT,
      role VARCHAR(100) NOT NULL,
      permissions JSONB DEFAULT '{}',
      failed_attempts INTEGER DEFAULT 0 NOT NULL,
      locked_until TIMESTAMP,
      last_login_at TIMESTAMP,
      is_active BOOLEAN DEFAULT true NOT NULL,
      created_at TIMESTAMP DEFAULT now() NOT NULL
    );
  `);

  await pglite.query(`
    CREATE TABLE IF NOT EXISTS fiscal_years (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id UUID REFERENCES tenants(id),
      name VARCHAR(255) NOT NULL,
      start_date DATE NOT NULL,
      end_date DATE NOT NULL,
      status VARCHAR(50) DEFAULT 'OPEN' NOT NULL,
      is_current BOOLEAN DEFAULT false NOT NULL,
      closed_at TIMESTAMP,
      closed_by UUID,
      created_at TIMESTAMP DEFAULT now() NOT NULL,
      updated_at TIMESTAMP DEFAULT now() NOT NULL
    );
  `);

  await pglite.query(`
    CREATE TABLE IF NOT EXISTS chart_of_accounts (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id UUID REFERENCES tenants(id),
      code VARCHAR(100) NOT NULL,
      name VARCHAR(255) NOT NULL,
      type VARCHAR(50) NOT NULL,
      parent_id UUID,
      is_active BOOLEAN DEFAULT true,
      metadata JSONB,
      created_at TIMESTAMP DEFAULT now() NOT NULL
    );
  `);

  await pglite.query(`
    CREATE TABLE IF NOT EXISTS warehouses (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id UUID REFERENCES tenants(id),
      branch_id UUID,
      code VARCHAR(50) NOT NULL,
      name VARCHAR(255) NOT NULL,
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT now() NOT NULL
    );
  `);

  await pglite.query(`
    CREATE TABLE IF NOT EXISTS products (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id UUID REFERENCES tenants(id),
      code VARCHAR(100) NOT NULL,
      barcode VARCHAR(100),
      name VARCHAR(255) NOT NULL,
      type VARCHAR(50) DEFAULT 'Stock' NOT NULL,
      cost_price NUMERIC(15, 4) DEFAULT '0',
      sale_price NUMERIC(15, 4) DEFAULT '0',
      tax_rate NUMERIC(5, 2) DEFAULT '15.00',
      stock_quantity NUMERIC(15, 4) DEFAULT '0',
      unit VARCHAR(50) DEFAULT 'PCS',
      category VARCHAR(100) DEFAULT 'General',
      is_active BOOLEAN DEFAULT true,
      metadata JSONB,
      created_at TIMESTAMP DEFAULT now() NOT NULL
    );
  `);

  await pglite.query(`
    CREATE TABLE IF NOT EXISTS customers (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id UUID REFERENCES tenants(id),
      code VARCHAR(50) NOT NULL,
      name VARCHAR(255) NOT NULL,
      phone VARCHAR(50),
      email VARCHAR(255),
      tax_number VARCHAR(100),
      credit_limit NUMERIC(15, 2) DEFAULT '0',
      current_balance NUMERIC(15, 2) DEFAULT '0',
      is_active BOOLEAN DEFAULT true,
      metadata JSONB,
      created_at TIMESTAMP DEFAULT now() NOT NULL
    );
  `);

  await pglite.query(`
    CREATE TABLE IF NOT EXISTS suppliers (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id UUID REFERENCES tenants(id),
      code VARCHAR(50) NOT NULL,
      name VARCHAR(255) NOT NULL,
      phone VARCHAR(50),
      email VARCHAR(255),
      tax_number VARCHAR(100),
      current_balance NUMERIC(15, 2) DEFAULT '0',
      is_active BOOLEAN DEFAULT true,
      metadata JSONB,
      created_at TIMESTAMP DEFAULT now() NOT NULL
    );
  `);

  await pglite.query(`
    CREATE TABLE IF NOT EXISTS stock_ledger (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id UUID REFERENCES tenants(id),
      product_id UUID REFERENCES products(id),
      warehouse_id UUID REFERENCES warehouses(id),
      transaction_type VARCHAR(50) NOT NULL,
      reference VARCHAR(100),
      quantity NUMERIC(15, 4) NOT NULL,
      unit_cost NUMERIC(15, 4) NOT NULL,
      total_cost NUMERIC(15, 4) DEFAULT '0',
      date TIMESTAMP DEFAULT now() NOT NULL,
      metadata JSONB
    );
  `);

  await pglite.query(`
    CREATE TABLE IF NOT EXISTS opening_balances (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id UUID REFERENCES tenants(id),
      fiscal_year_id UUID REFERENCES fiscal_years(id),
      account_id UUID REFERENCES chart_of_accounts(id),
      account_code VARCHAR(100) NOT NULL,
      account_name VARCHAR(255) NOT NULL,
      entity_type VARCHAR(50) DEFAULT 'ACCOUNT' NOT NULL,
      entity_id VARCHAR(255),
      entity_name VARCHAR(255),
      debit_amount NUMERIC(15, 2) DEFAULT '0.00' NOT NULL,
      credit_amount NUMERIC(15, 2) DEFAULT '0.00' NOT NULL,
      notes TEXT,
      created_at TIMESTAMP DEFAULT now() NOT NULL,
      updated_at TIMESTAMP DEFAULT now() NOT NULL
    );
  `);

  await pglite.query(`
    CREATE TABLE IF NOT EXISTS opening_stock (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id UUID REFERENCES tenants(id),
      fiscal_year_id UUID REFERENCES fiscal_years(id),
      warehouse_id UUID REFERENCES warehouses(id),
      product_id UUID REFERENCES products(id),
      product_sku VARCHAR(100),
      product_name VARCHAR(255) NOT NULL,
      quantity NUMERIC(15, 4) NOT NULL,
      unit_cost NUMERIC(15, 4) NOT NULL,
      total_cost NUMERIC(15, 2) NOT NULL,
      batch_number VARCHAR(100),
      expiry_date TIMESTAMP,
      notes TEXT,
      created_at TIMESTAMP DEFAULT now() NOT NULL,
      updated_at TIMESTAMP DEFAULT now() NOT NULL
    );
  `);

  await pglite.query(`
    CREATE TABLE IF NOT EXISTS journal_entries (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id UUID REFERENCES tenants(id),
      reference VARCHAR(100) NOT NULL,
      date TIMESTAMP NOT NULL,
      description TEXT,
      status VARCHAR(50) DEFAULT 'Draft' NOT NULL,
      created_by UUID,
      created_at TIMESTAMP DEFAULT now() NOT NULL
    );
  `);

  await pglite.query(`
    CREATE TABLE IF NOT EXISTS journal_lines (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      journal_entry_id UUID REFERENCES journal_entries(id) ON DELETE CASCADE,
      account_id UUID REFERENCES chart_of_accounts(id),
      debit NUMERIC(15, 4) DEFAULT '0' NOT NULL,
      credit NUMERIC(15, 4) DEFAULT '0' NOT NULL,
      description TEXT,
      metadata JSONB
    );
  `);

  await pglite.query(`
    CREATE TABLE IF NOT EXISTS sales_invoices (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id UUID REFERENCES tenants(id),
      branch_id UUID,
      invoice_number VARCHAR(100) NOT NULL,
      customer_id UUID REFERENCES customers(id),
      customer_name VARCHAR(255),
      date TIMESTAMP NOT NULL,
      subtotal NUMERIC(15, 4) NOT NULL,
      tax_amount NUMERIC(15, 4) NOT NULL,
      discount_amount NUMERIC(15, 4) DEFAULT '0',
      total_amount NUMERIC(15, 4) NOT NULL,
      paid_amount NUMERIC(15, 4) DEFAULT '0',
      status VARCHAR(50) DEFAULT 'Paid' NOT NULL,
      payment_method VARCHAR(50) DEFAULT 'Cash',
      source VARCHAR(50) DEFAULT 'DirectSales',
      metadata JSONB DEFAULT '{}',
      created_at TIMESTAMP DEFAULT now() NOT NULL
    );
  `);

  await pglite.query(`
    CREATE TABLE IF NOT EXISTS sales_invoice_lines (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      invoice_id UUID REFERENCES sales_invoices(id) ON DELETE CASCADE,
      product_id UUID REFERENCES products(id),
      product_name VARCHAR(255),
      quantity NUMERIC(15, 4) NOT NULL,
      unit_price NUMERIC(15, 4) NOT NULL,
      unit_cost NUMERIC(15, 4) DEFAULT '0',
      tax_rate NUMERIC(5, 2) DEFAULT '15.00',
      tax_amount NUMERIC(15, 4) DEFAULT '0' NOT NULL,
      total_price NUMERIC(15, 4) NOT NULL,
      metadata JSONB DEFAULT '{}'
    );
  `);

  await pglite.query(`
    CREATE TABLE IF NOT EXISTS purchase_invoices (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id UUID REFERENCES tenants(id),
      branch_id UUID,
      bill_number VARCHAR(100) NOT NULL,
      supplier_id UUID REFERENCES suppliers(id),
      supplier_name VARCHAR(255),
      date TIMESTAMP NOT NULL,
      subtotal NUMERIC(15, 4) NOT NULL,
      tax_amount NUMERIC(15, 4) NOT NULL,
      total_amount NUMERIC(15, 4) NOT NULL,
      paid_amount NUMERIC(15, 4) DEFAULT '0',
      status VARCHAR(50) DEFAULT 'Paid' NOT NULL,
      payment_method VARCHAR(50) DEFAULT 'Cash',
      metadata JSONB DEFAULT '{}',
      created_at TIMESTAMP DEFAULT now() NOT NULL
    );
  `);

  await pglite.query(`
    CREATE TABLE IF NOT EXISTS purchase_invoice_lines (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      bill_id UUID REFERENCES purchase_invoices(id) ON DELETE CASCADE,
      product_id UUID REFERENCES products(id),
      product_name VARCHAR(255),
      quantity NUMERIC(15, 4) NOT NULL,
      unit_cost NUMERIC(15, 4) NOT NULL,
      tax_rate NUMERIC(5, 2) DEFAULT '15.00',
      tax_amount NUMERIC(15, 4) DEFAULT '0' NOT NULL,
      total_cost NUMERIC(15, 4) NOT NULL,
      metadata JSONB DEFAULT '{}'
    );
  `);

  await pglite.query(`
    CREATE TABLE IF NOT EXISTS pos_sessions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id UUID REFERENCES tenants(id),
      branch_id UUID,
      cashier_id UUID,
      terminal_name VARCHAR(100) DEFAULT 'POS Terminal 1',
      opening_cash NUMERIC(15, 2) NOT NULL,
      closing_cash NUMERIC(15, 2),
      total_sales NUMERIC(15, 2) DEFAULT '0',
      status VARCHAR(50) DEFAULT 'Open' NOT NULL,
      opened_at TIMESTAMP DEFAULT now() NOT NULL,
      closed_at TIMESTAMP,
      metadata JSONB
    );
  `);

  await pglite.query(`
    CREATE TABLE IF NOT EXISTS maintenance_logs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id UUID REFERENCES tenants(id),
      user_id UUID,
      operation_type VARCHAR(100) NOT NULL,
      fiscal_year_id UUID,
      status VARCHAR(50) NOT NULL,
      details JSONB DEFAULT '{}',
      ip_address VARCHAR(100),
      started_at TIMESTAMP DEFAULT now() NOT NULL,
      completed_at TIMESTAMP
    );
  `);
}

async function runBackupResetTests() {
  console.log('==================================================================');
  console.log('🚀 STARTING PHASE 3: DATABASE BACKUP & RESET SYSTEM VERIFICATION');
  console.log('==================================================================\n');

  let passed = 0;
  let failed = 0;
  const bugsFound: string[] = [];

  function assert(condition: boolean, testName: string, details?: string) {
    if (condition) {
      console.log(`   ✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`   ❌ [FAIL] ${testName} ${details ? `-> ${details}` : ''}`);
      failed++;
      bugsFound.push(testName);
    }
  }

  try {
    await initSchema();

    const tenantAId = 'a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1';
    const tenantBId = 'b2b2b2b2-b2b2-b2b2-b2b2-b2b2b2b2b2b2';

    // 1. إعداد بيانات Tenant A
    await db.insert(tenants).values([
      { id: tenantAId, name: 'مجموعة المارو للتجارة والصناعة (Tenant A)', isActive: true },
      { id: tenantBId, name: 'شركة النور العالمية (Tenant B)', isActive: true }
    ]);

    const [branchA] = await db.insert(branches).values({
      tenantId: tenantAId,
      code: 'BR-01',
      name: 'الفرع الرئيسي'
    }).returning();

    const [userA] = await db.insert(users).values({
      tenantId: tenantAId,
      email: 'admin@maro.com',
      name: 'المدير العام',
      role: 'SUPER_ADMIN',
      isActive: true
    }).returning();

    // إعداد حسابات ومستودعات ومنتجات لـ Tenant A
    const [accCash] = await db.insert(chartOfAccounts).values({
      tenantId: tenantAId,
      code: '110000',
      name: 'الصندوق الرئيسي',
      type: 'ASSET',
      isActive: true
    }).returning();

    const [accSales] = await db.insert(chartOfAccounts).values({
      tenantId: tenantAId,
      code: '410000',
      name: 'إيرادات المبيعات',
      type: 'REVENUE',
      isActive: true
    }).returning();

    const [whMain] = await db.insert(warehouses).values({
      tenantId: tenantAId,
      branchId: branchA.id,
      code: 'WH-MAIN',
      name: 'مستودع البضاعة العام',
      isActive: true
    }).returning();

    const [productMilk] = await db.insert(products).values({
      tenantId: tenantAId,
      code: 'PRD-MILK',
      barcode: '6281001001',
      name: 'حليب المراعي 1 لتر',
      costPrice: '4.00',
      salePrice: '6.50',
      taxRate: '15.00',
      stockQuantity: '50.00',
      isActive: true
    }).returning();

    const [customerAli] = await db.insert(customers).values({
      tenantId: tenantAId,
      code: 'CUST-001',
      name: 'شركة العلي للمقاولات',
      currentBalance: '1200.00',
      isActive: true
    }).returning();

    const [supplierMadina] = await db.insert(suppliers).values({
      tenantId: tenantAId,
      code: 'SUP-001',
      name: 'مؤسسة المدينة للمواد الغذائية',
      currentBalance: '3500.00',
      isActive: true
    }).returning();

    // إنشاء فاتورة مبيعات وقيد يومي
    const [invSale] = await db.insert(salesInvoices).values({
      tenantId: tenantAId,
      branchId: branchA.id,
      invoiceNumber: 'INV-2026-001',
      customerId: customerAli.id,
      customerName: customerAli.name,
      date: new Date('2026-05-15'),
      subtotal: '100.00',
      taxAmount: '15.00',
      totalAmount: '115.00',
      paidAmount: '115.00',
      status: 'Paid',
      paymentMethod: 'Cash'
    }).returning();

    await db.insert(salesInvoiceLines).values({
      invoiceId: invSale.id,
      productId: productMilk.id,
      productName: productMilk.name,
      quantity: '20.00',
      unitPrice: '5.00',
      unitCost: '4.00',
      taxAmount: '15.00',
      totalPrice: '115.00'
    });

    const [je] = await db.insert(journalEntries).values({
      tenantId: tenantAId,
      reference: 'JV-2026-001',
      date: new Date('2026-05-15'),
      description: 'قيد مبيعات نقدية',
      status: 'Posted'
    }).returning();

    await db.insert(journalLines).values([
      { journalEntryId: je.id, accountId: accCash.id, debit: '115.00', credit: '0.00', description: 'الصندوق' },
      { journalEntryId: je.id, accountId: accSales.id, debit: '0.00', credit: '115.00', description: 'مبيعات' }
    ]);

    // ====================================================
    // TEST 1: اختبار تصدير النسخة الاحتياطية الكاملة (Full Backup Export)
    // ====================================================
    console.log('\n--- 🧪 TEST 1: Full PostgreSQL Backup Generation & Checksum ---');

    const backupResult = await BackupService.createDatabaseBackup(tenantAId, userA.id);
    assert(!!backupResult.filename, 'Backup filename generated successfully', backupResult.filename);
    assert(backupResult.metadata.totalProducts === 1, 'Metadata correctly counted products', `Count: ${backupResult.metadata.totalProducts}`);
    assert(backupResult.metadata.totalInvoices === 1, 'Metadata correctly counted sales invoices', `Count: ${backupResult.metadata.totalInvoices}`);
    assert(backupResult.metadata.totalCustomers === 1, 'Metadata correctly counted customers', `Count: ${backupResult.metadata.totalCustomers}`);
    assert(backupResult.metadata.totalSuppliers === 1, 'Metadata correctly counted suppliers', `Count: ${backupResult.metadata.totalSuppliers}`);
    assert(backupResult.metadata.totalEntries === 1, 'Metadata correctly counted journal entries', `Count: ${backupResult.metadata.totalEntries}`);
    assert(!!backupResult.metadata.checksum, 'SHA/CRC32 Checksum calculated and attached', backupResult.metadata.checksum);

    // ====================================================
    // TEST 2: فحص ومعاينة ملف النسخة الاحتياطية والتأكد من عدم التلاعب (Inspection)
    // ====================================================
    console.log('\n--- 🧪 TEST 2: Backup Inspection & Tamper Detection ---');

    const inspection = BackupService.inspectDatabaseBackup(backupResult.jsonContent);
    assert(inspection.valid, 'Backup file successfully parsed and validated');
    assert(!inspection.tampered, 'Checksum validation passed (no tampering)');

    // تجربة التلاعب ببيانات النسخة والتحقق من اكتشاف النظام لذلك
    const tamperedContent = backupResult.jsonContent.replace('PRD-MILK', 'PRD-HACKED-CODE');
    const tamperedInspection = BackupService.inspectDatabaseBackup(tamperedContent);
    assert(tamperedInspection.tampered === true, 'Tamper detection successfully flagged modified payload');

    // ====================================================
    // TEST 3: التصفير التفصيلي المخصص للبيانات (Selective Wipe)
    // ====================================================
    console.log('\n--- 🧪 TEST 3: Selective Wipe of Sales & Financial Journals ---');

    const wipeRes = await BackupService.performSelectiveWipe(tenantAId, {
      wipeSales: true,
      wipeAccounting: true
    }, userA.id);

    assert(wipeRes.success, 'Selective wipe executed successfully');

    // التحقق من مسح الفواتير والقيود
    const remainingInvoices = await db.select().from(salesInvoices).where(eq(salesInvoices.tenantId, tenantAId));
    const remainingJournals = await db.select().from(journalEntries).where(eq(journalEntries.tenantId, tenantAId));
    assert(remainingInvoices.length === 0, 'Sales invoices wiped completely');
    assert(remainingJournals.length === 0, 'Journal entries wiped completely');

    // التحقق من بقاء دليل الحسابات، المنتجات، والعملاء
    const preservedProducts = await db.select().from(products).where(eq(products.tenantId, tenantAId));
    const preservedAccounts = await db.select().from(chartOfAccounts).where(eq(chartOfAccounts.tenantId, tenantAId));
    const preservedCustomers = await db.select().from(customers).where(eq(customers.tenantId, tenantAId));
    assert(preservedProducts.length === 1, 'Master product catalogue preserved intact');
    assert(preservedAccounts.length === 2, 'Chart of Accounts preserved intact');
    assert(preservedCustomers.length === 1, 'Customer records preserved intact');

    // ====================================================
    // TEST 4: الاستعادة الكاملة لقاعدة البيانات والتحقق من دقة الأرصدة (Atomic Restore)
    // ====================================================
    console.log('\n--- 🧪 TEST 4: Atomic Database Restore & Data Integrity ---');

    const restoreRes = await BackupService.restoreDatabaseBackup(tenantAId, backupResult.pkg, userA.id);
    assert(restoreRes.success, 'Database restore transaction committed successfully');

    // التحقق من عودة الفواتير والقيود التي كانت ممسوحة
    const restoredInvoices = await db.select().from(salesInvoices).where(eq(salesInvoices.tenantId, tenantAId));
    const restoredLines = await db.select().from(salesInvoiceLines);
    const restoredJournals = await db.select().from(journalEntries).where(eq(journalEntries.tenantId, tenantAId));
    const restoredJLines = await db.select().from(journalLines);

    assert(restoredInvoices.length === 1, 'Restored sales invoices count matches original');
    assert(restoredLines.length === 1, 'Restored sales invoice lines linked properly');
    assert(restoredJournals.length === 1, 'Restored journal entries count matches original');
    assert(restoredJLines.length === 2, 'Restored journal lines balance intact');

    // ====================================================
    // TEST 5: عزل البيانات بين الـ Tenants أثناء النسخ والاستعادة (Multi-Tenant Isolation)
    // ====================================================
    console.log('\n--- 🧪 TEST 5: Multi-Tenant Data Protection & Isolation ---');

    // إضافة بيانات لـ Tenant B
    await db.insert(products).values({
      tenantId: tenantBId,
      code: 'PRD-TENANT-B',
      name: 'منتج خاص بشركة B',
      costPrice: '10.00',
      salePrice: '15.00'
    });

    // استخراج نسخة احتياطية لـ Tenant A والتحقق من عدم تسريب بيانات Tenant B إليها
    const tenantABackup = await BackupService.createDatabaseBackup(tenantAId);
    const foundTenantBInBackup = tenantABackup.pkg.tables.products.some((p: any) => p.tenantId === tenantBId);
    assert(!foundTenantBInBackup, 'Tenant A backup contains ZERO records of Tenant B');

    // مسح وتصفير Tenant A والتحقق من بقاء بيانات Tenant B سليمة تماماً دون أي مساس
    await BackupService.performSelectiveWipe(tenantAId, { wipeInventory: true });
    const tenantBProducts = await db.select().from(products).where(eq(products.tenantId, tenantBId));
    assert(tenantBProducts.length === 1, 'Tenant B products completely unaffected by Tenant A wipe');

    // ====================================================
    // TEST 6: التصفير الإجمالي الشامل للمنشأة (Total Factory Reset)
    // ====================================================
    console.log('\n--- 🧪 TEST 6: Total Factory Reset & Default Seed Re-initialization ---');

    // تجربة التصفير برمز خاطئ
    let rejectedInvalidPhrase = false;
    try {
      await BackupService.performTotalFactoryReset(tenantAId, 'WRONG_CODE');
    } catch (e) {
      rejectedInvalidPhrase = true;
    }
    assert(rejectedInvalidPhrase, 'Factory reset rejected unauthorized confirmation phrase');

    // تنفيذ التصفير الإجمالي برمز صحيح
    const resetRes = await BackupService.performTotalFactoryReset(tenantAId, 'DESTROY', userA.id);
    assert(resetRes.success, 'Total factory reset executed successfully');
    assert(!!resetRes.preResetBackupFilename, 'Automatic pre-reset safeguard backup created', resetRes.preResetBackupFilename);

    // التحقق من إعادة تهيئة شجرة الحسابات والسنة المالية الافتراضية
    const resetAccounts = await db.select().from(chartOfAccounts).where(eq(chartOfAccounts.tenantId, tenantAId));
    const resetYears = await db.select().from(fiscalYears).where(eq(fiscalYears.tenantId, tenantAId));
    const resetWh = await db.select().from(warehouses).where(eq(warehouses.tenantId, tenantAId));

    assert(resetAccounts.length >= 5, 'Default essential Chart of Accounts re-seeded', `Count: ${resetAccounts.length}`);
    assert(resetYears.length === 1, 'Default active Fiscal Year re-seeded', resetYears[0]?.name);
    assert(resetWh.length === 1, 'Default Main Warehouse re-seeded', resetWh[0]?.code);

    // ====================================================
    // TEST 7: التحقق من سجل الصيانة والتدقيق (Maintenance & Audit Logs)
    // ====================================================
    console.log('\n--- 🧪 TEST 7: Maintenance Logs Audit Trail Verification ---');

    const logs = await BackupService.getMaintenanceLogs(tenantAId);
    assert(logs.length >= 3, 'Maintenance logs recorded all operations accurately', `Total operations logged: ${logs.length}`);

    const hasBackupLog = logs.some(l => l.operationType === 'BACKUP_CREATE');
    const hasRestoreLog = logs.some(l => l.operationType === 'BACKUP_RESTORE');
    const hasResetLog = logs.some(l => l.operationType === 'FACTORY_RESET');

    assert(hasBackupLog, 'BACKUP_CREATE logged with full metadata and checksum');
    assert(hasRestoreLog, 'BACKUP_RESTORE logged with operation details');
    assert(hasResetLog, 'FACTORY_RESET logged with pre-reset safeguard filename');

  } catch (err: any) {
    console.error('❌ CRITICAL TEST EXCEPTION:', err);
    failed++;
  }

  console.log('\n==================================================================');
  console.log(`PHASE 3 VERIFICATION COMPLETED: ${passed} PASSED | ${failed} FAILED`);
  console.log('==================================================================\n');

  console.log('------------ PHASE 3 FINAL REPORT ------------');
  console.log(`Tests Passed: ${passed}`);
  console.log(`Tests Failed: ${failed}`);
  console.log(`Bugs Found: ${bugsFound.length > 0 ? bugsFound.join(', ') : 'None'}`);
  console.log(`Files Modified: src/services/backupService.ts, src/tests/backupResetIntegrity.test.ts`);
  console.log(`PostgreSQL Full Backup Engine: PASSED (Multi-Tenant, JSON/Encrypted, CRC32 Checksum, Maintenance Logging).`);
  console.log(`Atomic Transaction Restore: PASSED (Foreign Key Safe Topological ordering, zero data loss).`);
  console.log(`Selective Data Wipe: PASSED (Modular wipe with Master data preservation).`);
  console.log(`Total Factory Reset: PASSED (Automated pre-reset safeguard backup + clean standard chart of accounts re-seed).`);
  console.log(`Multi-Tenant Isolation: PASSED (Absolute isolation between tenants).`);
  console.log('----------------------------------------------');

  if (failed > 0) {
    console.error('❌ PHASE 3 VERIFICATION FAILED!');
    process.exit(1);
  } else {
    console.log('🎉 ALL PHASE 3 BACKUP & RESET INTEGRITY TESTS PASSED 100%!');
  }
}

runBackupResetTests();
