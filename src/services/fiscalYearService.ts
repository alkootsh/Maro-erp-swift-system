/**
 * @file fiscalYearService.ts
 * @module Fiscal Year & System Closing Service
 * @description إدارة الفترات المالية والتحقق والترحيل والأرصدة الافتتاحية وإغلاق السنة المالية بشكل متكامل وTransactional.
 */

import { db } from '../db';
import { 
  fiscalYears, 
  openingBalances, 
  openingStock, 
  maintenanceLogs, 
  salesInvoices, 
  purchaseInvoices, 
  posSessions, 
  journalEntries, 
  journalLines, 
  chartOfAccounts,
  products,
  warehouses,
  customers,
  suppliers
} from '../db/schema';
import { eq, and, desc, sql } from 'drizzle-orm';

export interface FiscalYearClosePreviewResult {
  fiscalYear: {
    id: string;
    name: string;
    startDate: string;
    endDate: string;
    status: string;
  };
  metrics: {
    totalJournalEntries: number;
    totalSalesInvoices: number;
    totalPurchaseInvoices: number;
    openPosSessionsCount: number;
    pendingOfflineSyncs: number;
    isBalanced: boolean;
    unbalancedEntries: Array<{ id: string; reference: string }>;
  };
  validation: {
    canClose: boolean;
    errors: string[];
    warnings: string[];
  };
  backupAvailable: boolean;
}

export class FiscalYearService {
  /**
   * الحصول على السنة المالية الحالية للـTenant
   */
  public static async getCurrentFiscalYear(tenantId: string) {
    const records = await db
      .select()
      .from(fiscalYears)
      .where(
        and(
          eq(fiscalYears.tenantId, tenantId),
          eq(fiscalYears.isCurrent, true)
        )
      )
      .limit(1);
    
    return records[0] || null;
  }

  /**
   * الحصول على جميع السنوات المالية للـTenant
   */
  public static async getFiscalYears(tenantId: string) {
    return await db
      .select()
      .from(fiscalYears)
      .where(eq(fiscalYears.tenantId, tenantId))
      .orderBy(desc(fiscalYears.startDate));
  }

  /**
   * احتساب تواريخ السنة المالية بناءً على تاريخ البداية (مثال: "01/07") والسنة المستهدفة
   */
  public static calculateFiscalYearDates(setupMonthDay: string, referenceDate: Date = new Date()): { startDate: string, endDate: string } {
    const parts = setupMonthDay.split('/');
    const day = parseInt(parts[0], 10) || 1;
    const month = parseInt(parts[1], 10) || 7; // افتراضياً شهر يوليو

    const refYear = referenceDate.getFullYear();
    
    // تاريخ بداية مقترح في السنة الحالية
    const candidateStart = new Date(refYear, month - 1, day);
    
    let startYear = refYear;
    if (referenceDate < candidateStart) {
      // إذا كان تاريخ اليوم قبل تاريخ البداية المقترح، فإن السنة المالية الحالية بدأت في السنة الميلادية السابقة
      startYear = refYear - 1;
    }

    const startDate = new Date(startYear, month - 1, day);
    
    // تاريخ النهاية هو سنة واحدة ناقص يوم واحد
    const endDate = new Date(startDate);
    endDate.setFullYear(startDate.getFullYear() + 1);
    endDate.setDate(endDate.getDate() - 1);

    const formatDate = (d: Date) => {
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    };

    return {
      startDate: formatDate(startDate),
      endDate: formatDate(endDate)
    };
  }

  /**
   * التحقق من تداخل الفترات المالية لنفس الـTenant
   */
  public static async checkOverlappingPeriods(tenantId: string, startDate: string, endDate: string, excludeId?: string): Promise<boolean> {
    let query = sql`
      SELECT id FROM fiscal_years 
      WHERE tenant_id = ${tenantId} 
      AND (
        (start_date <= ${endDate} AND end_date >= ${startDate})
      )
    `;

    if (excludeId) {
      query = sql`${query} AND id != ${excludeId}`;
    }

    const result = await db.execute(query);
    return result.rows.length > 0;
  }

  /**
   * إنشاء سنة مالية جديدة مع تفعيلها كسنة حالية إذا طُلب ذلك
   */
  public static async createFiscalYear(
    tenantId: string, 
    data: { name: string; startDate: string; endDate: string; isCurrent: boolean },
    userId?: string
  ) {
    // 1. التحقق من تداخل الفترات المالية
    const isOverlapping = await this.checkOverlappingPeriods(tenantId, data.startDate, data.endDate);
    if (isOverlapping) {
      throw new Error('تنبيه: يوجد تداخل بين الفترة المالية الجديدة وفترة مالية مسجلة مسبقاً للشركة.');
    }

    return await db.transaction(async (tx) => {
      // 2. إذا تم تحديدها كسنة مالية حالية، نقوم بإلغاء "السنة الحالية" من السنوات الأخرى للـtenant
      if (data.isCurrent) {
        await tx
          .update(fiscalYears)
          .set({ isCurrent: false, updatedAt: new Date() })
          .where(eq(fiscalYears.tenantId, tenantId));
      }

      // 3. إدراج السنة المالية الجديدة
      const [newYear] = await tx
        .insert(fiscalYears)
        .values({
          tenantId,
          name: data.name,
          startDate: data.startDate,
          endDate: data.endDate,
          status: 'OPEN',
          isCurrent: data.isCurrent,
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning();

      console.log('   [DEBUG] createFiscalYear returning newYear:', JSON.stringify(newYear));

      // 4. تسجيل العملية في سجل الصيانة
      await tx
        .insert(maintenanceLogs)
        .values({
          tenantId,
          userId,
          operationType: 'FISCAL_YEAR_SETTINGS_UPDATE',
          fiscalYearId: newYear.id,
          status: 'SUCCESS',
          details: { message: `تم إنشاء السنة المالية بنجاح: ${data.name}`, config: data },
          startedAt: new Date(),
          completedAt: new Date()
        });

      return newYear;
    });
  }

  /**
   * معاينة إغلاق السنة المالية وتوليد التقرير المالي قبل الإغلاق
   */
  public static async previewFiscalYearClose(tenantId: string, fiscalYearId: string): Promise<FiscalYearClosePreviewResult> {
    const fyList = await db
      .select()
      .from(fiscalYears)
      .where(and(eq(fiscalYears.tenantId, tenantId), eq(fiscalYears.id, fiscalYearId)))
      .limit(1);
    
    const fy = fyList[0];
    if (!fy) {
      throw new Error('السنة المالية المحددة غير موجودة.');
    }

    const { startDate, endDate } = fy;

    // 1. حساب القيود والمؤشرات المالية
    const [journalCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(journalEntries)
      .where(
        and(
          eq(journalEntries.tenantId, tenantId),
          sql`date >= ${startDate}`,
          sql`date <= ${endDate}`
        )
      );

    const [salesCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(salesInvoices)
      .where(
        and(
          eq(salesInvoices.tenantId, tenantId),
          sql`date >= ${startDate}`,
          sql`date <= ${endDate}`
        )
      );

    const [purchasesCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(purchaseInvoices)
      .where(
        and(
          eq(purchaseInvoices.tenantId, tenantId),
          sql`date >= ${startDate}`,
          sql`date <= ${endDate}`
        )
      );

    const [openSessionsCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(posSessions)
      .where(
        and(
          eq(posSessions.tenantId, tenantId),
          eq(posSessions.status, 'Open')
        )
      );

    // 2. التحقق من توازن الدفاتر المحاسبية (القيود المرحلة)
    const unbalancedQuery = await db.execute(sql`
      SELECT je.id, je.reference, SUM(jl.debit) as total_debit, SUM(jl.credit) as total_credit
      FROM journal_entries je
      JOIN journal_lines jl ON je.id = jl.journal_entry_id
      WHERE je.tenant_id = ${tenantId} AND je.status = 'Posted' AND je.date >= ${startDate} AND je.date <= ${endDate}
      GROUP BY je.id, je.reference
      HAVING ABS(SUM(jl.debit) - SUM(jl.credit)) > 0.001
    `);

    const unbalancedEntries = (unbalancedQuery.rows || []).map((row: any) => ({
      id: row.id,
      reference: row.reference
    }));

    const isBalanced = unbalancedEntries.length === 0;

    // 3. التحقق من وجود نسخة احتياطية صالحة اليوم
    const todayStr = new Date().toISOString().split('T')[0];
    const recentBackup = await db
      .select()
      .from(maintenanceLogs)
      .where(
        and(
          eq(maintenanceLogs.tenantId, tenantId),
          eq(maintenanceLogs.operationType, 'BACKUP_CREATE'),
          eq(maintenanceLogs.status, 'SUCCESS'),
          sql`completed_at::text LIKE ${todayStr + '%'}`
        )
      )
      .limit(1);

    const backupAvailable = recentBackup.length > 0;

    // 4. صياغة الأخطاء والتحذيرات
    const errors: string[] = [];
    const warnings: string[] = [];

    if (fy.status === 'CLOSED') {
      errors.push('هذه السنة المالية مغلقة بالفعل.');
    }
    if (openSessionsCount.count > 0) {
      errors.push(`يوجد ${openSessionsCount.count} جلسة POS مفتوحة. يجب إغلاق كافة جلسات البيع قبل ترحيل السنة.`);
    }
    if (!isBalanced) {
      errors.push('يوجد قيود يومية مرحلة غير متزنة (مجموع المدين لا يساوي الدائن).');
    }

    if (!backupAvailable) {
      warnings.push('تحذير: لم يتم أخذ نسخة احتياطية للنظام اليوم. يُنصح بشدة بعمل نسخة احتياطية قبل المتابعة.');
    }

    const canClose = errors.length === 0;

    return {
      fiscalYear: {
        id: fy.id,
        name: fy.name,
        startDate: fy.startDate,
        endDate: fy.endDate,
        status: fy.status
      },
      metrics: {
        totalJournalEntries: journalCount.count || 0,
        totalSalesInvoices: salesCount.count || 0,
        totalPurchaseInvoices: purchasesCount.count || 0,
        openPosSessionsCount: openSessionsCount.count || 0,
        pendingOfflineSyncs: 0, // يتم التحقق منها بشكل حيوي من المتصفح
        isBalanced,
        unbalancedEntries
      },
      validation: {
        canClose,
        errors,
        warnings
      },
      backupAvailable
    };
  }

  /**
   * الترحيل والإغلاق الفعلي للسنة المالية (Transactional) وتوليد الأرصدة الافتتاحية للمرحلة التالية
   */
  public static async closeFiscalYear(tenantId: string, fiscalYearId: string, userId?: string) {
    return await db.transaction(async (tx) => {
      // 1. قفل صف السنة المالية فوراً لمنع التزامن والتشغيل المتوازي (Concurrent Locks)
      const lockedYrs = await tx
        .select()
        .from(fiscalYears)
        .where(eq(fiscalYears.id, fiscalYearId))
        .for('update');
      
      const lockedYr = lockedYrs[0];
      if (!lockedYr) {
        throw new Error('السنة المالية المحددة غير موجودة.');
      }
      
      // التحقق من عزل الـ Tenant
      if (lockedYr.tenantId !== tenantId) {
        throw new Error('غير مسموح بإغلاق سنة مالية تابعة لـ Tenant آخر.');
      }

      if (lockedYr.status === 'CLOSED') {
        throw new Error('السنة المالية مغلقة بالفعل (Operation rejected safely).');
      }

      // 2. تشغيل المعاينة والتحقق من موانع الإغلاق
      const preview = await this.previewFiscalYearClose(tenantId, fiscalYearId);
      if (!preview.validation.canClose) {
        throw new Error(`لا يمكن إغلاق السنة المالية بسبب وجود موانع: ${preview.validation.errors.join(' | ')}`);
      }

      // 3. البحث عن السنة المالية التالية
      const nextYears = await tx
        .select()
        .from(fiscalYears)
        .where(
          and(
            eq(fiscalYears.tenantId, tenantId),
            sql`start_date > ${preview.fiscalYear.endDate}`
          )
        )
        .orderBy(fiscalYears.startDate)
        .limit(1);

      const nextYear = nextYears[0];
      if (!nextYear) {
        throw new Error('لا توجد سنة مالية تالية مسجلة في النظام لترحيل الأرصدة إليها.');
      }

      // 4. تحديث حالة السنة الحالية إلى مغلقة
      await tx
        .update(fiscalYears)
        .set({
          status: 'CLOSED',
          isCurrent: false,
          closedAt: new Date(),
          closedBy: userId,
          updatedAt: new Date()
        })
        .where(eq(fiscalYears.id, fiscalYearId));

      // 5. احتساب وتوليد الأرصدة الافتتاحية للحسابات وإغلاق الأرباح والخسائر (Profit/Loss Closing)
      // نقرأ الأرصدة الافتتاحية للسنة المنتهية أولاً
      const closingOpenings = await tx
        .select()
        .from(openingBalances)
        .where(and(
          eq(openingBalances.fiscalYearId, fiscalYearId),
          eq(openingBalances.entityType, 'ACCOUNT')
        ));

      // نحسب الحركات التي تمت على الحسابات خلال السنة
      const postingsQuery = await tx.execute(sql`
        SELECT jl.account_id, coa.code, coa.name, coa.type, SUM(jl.debit) as total_debit, SUM(jl.credit) as total_credit
        FROM journal_entries je
        JOIN journal_lines jl ON je.id = jl.journal_entry_id
        JOIN chart_of_accounts coa ON coa.id = jl.account_id
        WHERE je.tenant_id = ${tenantId} AND je.status = 'Posted' AND je.date >= ${preview.fiscalYear.startDate} AND je.date <= ${preview.fiscalYear.endDate}
        GROUP BY jl.account_id, coa.code, coa.name, coa.type
      `);

      // دمج الأرصدة الافتتاحية السابقة مع الحركات الجديدة للحصول على رصيد نهائي
      const accountsMap = new Map<string, {
        accountId: string;
        accountCode: string;
        accountName: string;
        accountType: string;
        debit: number;
        credit: number;
      }>();

      // إضافة الأرصدة الافتتاحية القديمة
      closingOpenings.forEach(op => {
        if (op.accountId) {
          accountsMap.set(op.accountId, {
            accountId: op.accountId,
            accountCode: op.accountCode,
            accountName: op.accountName,
            accountType: 'ASSET', // default, refined next
            debit: parseFloat(op.debitAmount),
            credit: parseFloat(op.creditAmount)
          });
        }
      });

      // جلب شجرة الحسابات بالكامل للحصول على الأنواع الدقيقة
      const allAccounts = await tx
        .select()
        .from(chartOfAccounts)
        .where(eq(chartOfAccounts.tenantId, tenantId));
      
      allAccounts.forEach(acc => {
        const existing = accountsMap.get(acc.id);
        if (existing) {
          existing.accountType = acc.type;
          existing.accountCode = acc.code;
          existing.accountName = acc.name;
        }
      });

      // دمج حركات اليومية المحتسبة
      (postingsQuery.rows || []).forEach((row: any) => {
        const accId = row.account_id;
        const current = accountsMap.get(accId) || {
          accountId: accId,
          accountCode: row.code,
          accountName: row.name,
          accountType: row.type,
          debit: 0,
          credit: 0
        };
        current.debit += parseFloat(row.total_debit || '0');
        current.credit += parseFloat(row.total_credit || '0');
        current.accountType = row.type;
        accountsMap.set(accId, current);
      });

      // حذف أي أرصدة افتتاحية قديمة في السنة الجديدة لمنع التكرار تماماً (Cleaning)
      await tx
        .delete(openingBalances)
        .where(eq(openingBalances.fiscalYearId, nextYear.id));

      // حساب Profit/Loss لإغلاقه في حقوق الملكية (Retained Earnings)
      let totalRevenueCredit = 0;
      let totalRevenueDebit = 0;
      let totalExpenseDebit = 0;
      let totalExpenseCredit = 0;

      for (const [_, acc] of accountsMap) {
        if (acc.accountType === 'REVENUE') {
          totalRevenueCredit += acc.credit;
          totalRevenueDebit += acc.debit;
        } else if (acc.accountType === 'EXPENSE') {
          totalExpenseDebit += acc.debit;
          totalExpenseCredit += acc.credit;
        }
      }

      const netRevenue = totalRevenueCredit - totalRevenueDebit;
      const netExpense = totalExpenseDebit - totalExpenseCredit;
      const netProfitOrLoss = netRevenue - netExpense; // إيجابي ربح، سلبي خسارة

      // ترحيل الحسابات المستمرة فقط (Asset, Liability, Equity) وتصفير المؤقتة (Revenue, Expense)
      for (const [_, acc] of accountsMap) {
        if (acc.accountType === 'REVENUE' || acc.accountType === 'EXPENSE') {
          continue; // لا ترحل أرصدتها الافتتاحية بل يتم إغلاقها
        }

        let net = 0;
        let debitAmount = '0.00';
        let creditAmount = '0.00';

        if (acc.accountType === 'ASSET') {
          net = acc.debit - acc.credit;
          if (net > 0) debitAmount = net.toFixed(4);
          else if (net < 0) creditAmount = (-net).toFixed(4);
        } else {
          // LIABILITY or EQUITY
          net = acc.credit - acc.debit;
          if (net > 0) creditAmount = net.toFixed(4);
          else if (net < 0) debitAmount = (-net).toFixed(4);
        }

        if (parseFloat(debitAmount) !== 0 || parseFloat(creditAmount) !== 0) {
          await tx
            .insert(openingBalances)
            .values({
              tenantId,
              fiscalYearId: nextYear.id,
              accountId: acc.accountId,
              accountCode: acc.accountCode,
              accountName: acc.accountName,
              entityType: 'ACCOUNT',
              debitAmount,
              creditAmount,
              notes: `رصيد مرحل تلقائياً من إغلاق السنة المالية ${preview.fiscalYear.name}`
            });
        }
      }

      // ترحيل صافي الأرباح والخسائر إلى حساب الأرباح المبقاة (Equity)
      const equityAccounts = await tx
        .select()
        .from(chartOfAccounts)
        .where(and(eq(chartOfAccounts.tenantId, tenantId), eq(chartOfAccounts.type, 'EQUITY')));

      const retainedEarningsAcc = equityAccounts.find(a => 
        a.name.includes('الارباح') || 
        a.name.includes('الأرباح') || 
        a.name.toLowerCase().includes('retained') || 
        a.name.toLowerCase().includes('profit')
      ) || equityAccounts[0];

      if (retainedEarningsAcc && netProfitOrLoss !== 0) {
        const existingOpening = await tx
          .select()
          .from(openingBalances)
          .where(and(
            eq(openingBalances.fiscalYearId, nextYear.id),
            eq(openingBalances.accountId, retainedEarningsAcc.id)
          ))
          .limit(1);

        let finalDebit = 0;
        let finalCredit = 0;

        if (existingOpening[0]) {
          finalDebit = parseFloat(existingOpening[0].debitAmount);
          finalCredit = parseFloat(existingOpening[0].creditAmount);
          
          await tx
            .delete(openingBalances)
            .where(eq(openingBalances.id, existingOpening[0].id));
        }

        if (netProfitOrLoss > 0) {
          finalCredit += netProfitOrLoss;
        } else {
          finalDebit += Math.abs(netProfitOrLoss);
        }

        const netEquity = finalCredit - finalDebit;
        let debitAmount = '0.00';
        let creditAmount = '0.00';
        if (netEquity > 0) {
          creditAmount = netEquity.toFixed(4);
        } else if (netEquity < 0) {
          debitAmount = (-netEquity).toFixed(4);
        }

        if (parseFloat(debitAmount) !== 0 || parseFloat(creditAmount) !== 0) {
          await tx
            .insert(openingBalances)
            .values({
              tenantId,
              fiscalYearId: nextYear.id,
              accountId: retainedEarningsAcc.id,
              accountCode: retainedEarningsAcc.code,
              accountName: retainedEarningsAcc.name,
              entityType: 'ACCOUNT',
              debitAmount,
              creditAmount,
              notes: `الأرباح والخسائر المرحلة من السنة المالية ${preview.fiscalYear.name}`
            });
        }
      }

      // 6. ترحيل أرصدة العملاء والموردين بدقة
      // العملاء
      const tenantCustomers = await tx
        .select()
        .from(customers)
        .where(and(eq(customers.tenantId, tenantId), eq(customers.isActive, true)));

      const customerReceivableAcc = await tx
        .select()
        .from(chartOfAccounts)
        .where(and(
          eq(chartOfAccounts.tenantId, tenantId),
          eq(chartOfAccounts.type, 'ASSET'),
          sql`name LIKE '%عملاء%' OR name ILIKE '%receivable%'`
        ))
        .limit(1);

      for (const c of tenantCustomers) {
        const balance = parseFloat(c.currentBalance || '0');
        if (balance !== 0) {
          const debitAmount = balance > 0 ? balance.toFixed(2) : '0.00';
          const creditAmount = balance < 0 ? (-balance).toFixed(2) : '0.00';

          await tx
            .insert(openingBalances)
            .values({
              tenantId,
              fiscalYearId: nextYear.id,
              accountId: customerReceivableAcc[0]?.id || null,
              accountCode: customerReceivableAcc[0]?.code || '120000',
              accountName: customerReceivableAcc[0]?.name || 'حساب العملاء',
              entityType: 'CUSTOMER',
              entityId: c.id,
              entityName: c.name,
              debitAmount,
              creditAmount,
              notes: `رصيد العميل الافتتاحي المرحل من السنة المالية ${preview.fiscalYear.name}`
            });
        }
      }

      // الموردون
      const tenantSuppliers = await tx
        .select()
        .from(suppliers)
        .where(and(eq(suppliers.tenantId, tenantId), eq(suppliers.isActive, true)));

      const supplierPayableAcc = await tx
        .select()
        .from(chartOfAccounts)
        .where(and(
          eq(chartOfAccounts.tenantId, tenantId),
          eq(chartOfAccounts.type, 'LIABILITY'),
          sql`name LIKE '%موردين%' OR name ILIKE '%payable%'`
        ))
        .limit(1);

      for (const s of tenantSuppliers) {
        const balance = parseFloat(s.currentBalance || '0');
        if (balance !== 0) {
          const debitAmount = balance < 0 ? (-balance).toFixed(2) : '0.00';
          const creditAmount = balance > 0 ? balance.toFixed(2) : '0.00';

          await tx
            .insert(openingBalances)
            .values({
              tenantId,
              fiscalYearId: nextYear.id,
              accountId: supplierPayableAcc[0]?.id || null,
              accountCode: supplierPayableAcc[0]?.code || '210000',
              accountName: supplierPayableAcc[0]?.name || 'حساب الموردين',
              entityType: 'SUPPLIER',
              entityId: s.id,
              entityName: s.name,
              debitAmount,
              creditAmount,
              notes: `رصيد المورد الافتتاحي المرحل من السنة المالية ${preview.fiscalYear.name}`
            });
        }
      }

      // 7. ترحيل المخزون مع الحفاظ على المستودع الأصلي لكل صنف
      await tx
        .delete(openingStock)
        .where(eq(openingStock.fiscalYearId, nextYear.id));

      const stockQuery = await tx.execute(sql`
        SELECT 
          sl.product_id, 
          sl.warehouse_id, 
          p.code as product_code,
          p.name as product_name,
          SUM(sl.quantity) as current_qty,
          COALESCE(p.cost_price, 0) as cost_price
        FROM stock_ledger sl
        JOIN products p ON p.id = sl.product_id
        WHERE sl.tenant_id = ${tenantId}
        GROUP BY sl.product_id, sl.warehouse_id, p.code, p.name, p.cost_price
        HAVING SUM(sl.quantity) > 0
      `);

      for (const row of (stockQuery.rows || []) as any[]) {
        const qty = parseFloat(row.current_qty || '0');
        const cost = parseFloat(row.cost_price || '0');
        if (qty > 0 && row.warehouse_id) {
          await tx
            .insert(openingStock)
            .values({
              tenantId,
              fiscalYearId: nextYear.id,
              warehouseId: row.warehouse_id as string,
              productId: row.product_id as string,
              productSku: (row.product_code as string) || null,
              productName: (row.product_name as string) || '',
              quantity: qty.toFixed(4),
              unitCost: cost.toFixed(4),
              totalCost: (qty * cost).toFixed(2),
              notes: `مخزون افتتاحى مرحل من إغلاق السنة المالية ${preview.fiscalYear.name}`
            });
        }
      }

      // جعل السنة الجديدة هي السنة الحالية
      await tx
        .update(fiscalYears)
        .set({
          isCurrent: true,
          updatedAt: new Date()
        })
        .where(eq(fiscalYears.id, nextYear.id));

      // 8. تسجيل اكتمال العملية بنجاح في سجلات النظام
      await tx
        .insert(maintenanceLogs)
        .values({
          tenantId,
          userId,
          operationType: 'FISCAL_YEAR_CLOSE',
          fiscalYearId,
          status: 'SUCCESS',
          details: {
            message: `تم إغلاق السنة المالية ${preview.fiscalYear.name} وترحيل الأرصدة بنجاح.`,
            nextYearName: nextYear.name,
            totalOpeningBalances: finalBalancesMapCount(accountsMap)
          },
          startedAt: new Date(),
          completedAt: new Date()
        });

      return {
        success: true,
        closedYear: preview.fiscalYear.name,
        nextYearActivated: nextYear.name
      };
    });
  }
}

function finalBalancesMapCount(map: Map<any, any>): number {
  return map.size;
}
