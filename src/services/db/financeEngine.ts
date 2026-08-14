import { eq, or, and, gte, lte } from 'drizzle-orm';
import { db } from '../../db';
import { chartOfAccounts, journalEntries, journalLines } from '../../db/schema';
import { v4 as uuidv4 } from 'uuid';

export class FinanceEngine {
  /**
   * Initializes the standard Chart of Accounts for a new tenant
   */
  static async initializeChartOfAccounts(tenantId: string, industry: string) {
    // This maps exactly to the previous DEFAULT_CHART_OF_ACCOUNTS
    const defaultAccounts = [
      { tenantId, code: '11100', name: 'Cash on Hand (الصندوق / النقدية)', type: 'ASSET' },
      { tenantId, code: '11110', name: 'POS Cash Clearing (عُهدة نقطة البيع)', type: 'ASSET' },
      { tenantId, code: '11200', name: 'Accounts Receivable (الذمم المدينة - العملاء)', type: 'ASSET' },
      { tenantId, code: '11300', name: 'Inventory Asset (مخزون البضائع)', type: 'ASSET' },
      { tenantId, code: '11400', name: 'VAT Input Tax (ضريبة المشتريات المدخلات)', type: 'ASSET' },
      { tenantId, code: '21100', name: 'Accounts Payable (الذمم الدائنة - الموردين)', type: 'LIABILITY' },
      { tenantId, code: '21400', name: 'VAT Payable (ضريبة المبيعات المستحقة)', type: 'LIABILITY' },
      { tenantId, code: '31100', name: 'Capital & Retained Earnings (رأس المال والأرباح المبقاة)', type: 'EQUITY' },
      { tenantId, code: '41100', name: 'Wholesale Revenue (إيرادات المبيعات الجملة)', type: 'REVENUE' },
      { tenantId, code: '41200', name: 'Retail Sales Revenue (إيرادات مبيعات التجزئة / POS)', type: 'REVENUE' },
      { tenantId, code: '51100', name: 'Cost of Goods Sold - COGS (تكلفة البضاعة المباعة)', type: 'EXPENSE' }
    ];

    try {
      await db.insert(chartOfAccounts).values(defaultAccounts).onConflictDoNothing();
      return true;
    } catch (e) {
      console.error("Failed to initialize COA", e);
      return false;
    }
  }

  /**
   * Get Chart of Accounts with calculated balances
   */
  static async getChartOfAccounts(tenantId: string) {
    try {
      // In a real enterprise system, balance is calculated dynamically from journal_lines 
      // grouped by accountId, or tracked via a materialized view.
      // For this implementation, we will query the COA and then aggregate the lines.
      const accounts = await db.select().from(chartOfAccounts).where(eq(chartOfAccounts.tenantId, tenantId));
      
      const lines = await db.select().from(journalLines)
        .innerJoin(journalEntries, eq(journalLines.journalEntryId, journalEntries.id))
        .where(eq(journalEntries.tenantId, tenantId));

      return accounts.map(acc => {
        let balance = 0;
        const accLines = lines.filter(l => l.journal_lines.accountId === acc.id);
        
        accLines.forEach(l => {
          const debit = parseFloat(l.journal_lines.debit || '0');
          const credit = parseFloat(l.journal_lines.credit || '0');
          
          if (acc.type === 'ASSET' || acc.type === 'EXPENSE') {
            balance += (debit - credit);
          } else {
            balance += (credit - debit);
          }
        });

        return {
          id: acc.id,
          code: acc.code,
          name: acc.name,
          type: acc.type,
          balance: balance
        };
      });
    } catch (e) {
      console.error(e);
      return [];
    }
  }

  /**
   * Enterprise Double-Entry Journal Posting (ACID Transaction)
   */
  static async postJournalEntry(
    tenantId: string,
    reference: string,
    description: string,
    lines: { accountCode: string; debit: number; credit: number }[],
    userId?: string
  ) {
    // 1. Verify Balance
    const totalDebit = lines.reduce((acc, l) => acc + (l.debit || 0), 0);
    const totalCredit = lines.reduce((acc, l) => acc + (l.credit || 0), 0);

    if (Math.abs(totalDebit - totalCredit) > 0.001) {
      throw new Error(`القيد غير متوازن: إجمالي المدين ${totalDebit.toFixed(2)} لا يساوي الدائن ${totalCredit.toFixed(2)}`);
    }

    // 2. Fetch Accounts to get UUIDs
    const accounts = await db.select().from(chartOfAccounts).where(eq(chartOfAccounts.tenantId, tenantId));
    
    // Execute as Transaction
    return await db.transaction(async (tx) => {
      // Insert Entry Header
      const [entry] = await tx.insert(journalEntries).values({
        tenantId,
        reference,
        description,
        date: new Date(),
        status: 'Posted',
        createdBy: userId || null
      }).returning();

      // Prepare Lines
      const insertLines = lines.map(l => {
        const acc = accounts.find(a => a.code === l.accountCode);
        if (!acc) throw new Error(`الحساب ${l.accountCode} غير موجود في دليل الحسابات`);
        
        return {
          journalEntryId: entry.id,
          accountId: acc.id,
          debit: l.debit.toString(),
          credit: l.credit.toString()
        };
      });

      // Insert Lines
      await tx.insert(journalLines).values(insertLines);
      return entry;
    });
  }
}
