// MARO ERP - Automated General Ledger & Double-Entry Accounting Service
import { Account, JournalEntry, JournalLine } from '../types/sprint8';
import { MaroSyncEngine } from '../lib/maroSyncEngine';

const ACCOUNT_COLLECTION = 'chart_of_accounts';
const JOURNAL_COLLECTION = 'journal_entries';

export const DEFAULT_CHART_OF_ACCOUNTS: Account[] = [
  { code: '11100', name: 'Cash on Hand (الصندوق / النقدية)', type: 'ASSET', balance: 0 },
  { code: '11110', name: 'POS Cash Clearing (عُهدة نقطة البيع)', type: 'ASSET', balance: 0 },
  { code: '11200', name: 'Accounts Receivable (الذمم المدينة - العملاء)', type: 'ASSET', balance: 0 },
  { code: '11300', name: 'Inventory Asset (مخزون البضائع)', type: 'ASSET', balance: 0 },
  { code: '11400', name: 'VAT Input Tax (ضريبة المشتريات المدخلات)', type: 'ASSET', balance: 0 },
  { code: '21100', name: 'Accounts Payable (الذمم الدائنة - الموردين)', type: 'LIABILITY', balance: 0 },
  { code: '21400', name: 'VAT Payable (ضريبة المبيعات المستحقة)', type: 'LIABILITY', balance: 0 },
  { code: '31100', name: 'Capital & Retained Earnings (رأس المال والأرباح المبقاة)', type: 'EQUITY', balance: 0 },
  { code: '41100', name: 'Wholesale Revenue (إيرادات المبيعات الجملة)', type: 'REVENUE', balance: 0 },
  { code: '41200', name: 'Retail Sales Revenue (إيرادات مبيعات التجزئة / POS)', type: 'REVENUE', balance: 0 },
  { code: '51100', name: 'Cost of Goods Sold - COGS (تكلفة البضاعة المباعة)', type: 'EXPENSE', balance: 0 }
];

export class AccountingService {
  static initAccounts() {
    const existing = MaroSyncEngine.getLocalCollection<Account>(ACCOUNT_COLLECTION);
    if (existing.length === 0) {
      MaroSyncEngine.setLocalCollection(ACCOUNT_COLLECTION, DEFAULT_CHART_OF_ACCOUNTS);
    }
  }

  static getChartOfAccounts(): Account[] {
    this.initAccounts();
    return MaroSyncEngine.getLocalCollection<Account>(ACCOUNT_COLLECTION);
  }

  static getJournalEntries(): JournalEntry[] {
    return MaroSyncEngine.getLocalCollection<JournalEntry>(JOURNAL_COLLECTION);
  }

  static async postJournalEntry(
    reference: string,
    description: string,
    lines: { accountCode: string; debit: number; credit: number }[]
  ): Promise<JournalEntry> {
    this.initAccounts();
    const accounts = this.getChartOfAccounts();

    // Verify debit = credit balance
    const totalDebit = lines.reduce((acc, l) => acc + (l.debit || 0), 0);
    const totalCredit = lines.reduce((acc, l) => acc + (l.credit || 0), 0);

    if (Math.abs(totalDebit - totalCredit) > 0.001) {
      throw new Error(`القيد المحاسبي غير متوازن: إجمالي المدين ${totalDebit.toFixed(2)} لا يساوي الدائن ${totalCredit.toFixed(2)}`);
    }

    const journalLines: JournalLine[] = lines.map((l, index) => {
      const acct = accounts.find(a => a.code === l.accountCode);
      const name = acct ? acct.name : `Account ${l.accountCode}`;
      
      // Update running account balance
      if (acct) {
        if (acct.type === 'ASSET' || acct.type === 'EXPENSE') {
          acct.balance += (l.debit - l.credit);
        } else {
          acct.balance += (l.credit - l.debit);
        }
      }

      return {
        id: `line_${Date.now()}_${index}`,
        accountCode: l.accountCode,
        accountName: name,
        debit: l.debit || 0,
        credit: l.credit || 0
      };
    });

    MaroSyncEngine.setLocalCollection(ACCOUNT_COLLECTION, accounts);

    const count = this.getJournalEntries().length + 1;
    const entryNumber = `JE-2026-${String(count).padStart(5, '0')}`;

    const journalEntry: JournalEntry = {
      id: `je_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`,
      entryNumber,
      date: new Date().toISOString(),
      reference,
      description,
      lines: journalLines,
      status: 'POSTED',
      createdAt: new Date().toISOString()
    };

    await MaroSyncEngine.saveDocument(JOURNAL_COLLECTION, journalEntry, true);
    return journalEntry;
  }

  // --- Automated Sales Entry Generator ---
  static async postSalesInvoiceGL(
    invoiceNumber: string,
    customerName: string,
    grandTotal: number,
    untaxedTotal: number,
    vatAmount: number,
    totalCostPrice: number,
    isCashOrPos: boolean = false
  ) {
    const assetAccount = isCashOrPos ? '11110' : '11200'; // POS Clearing or AR
    const revenueAccount = isCashOrPos ? '41200' : '41100'; // Retail or Wholesale

    const lines = [
      { accountCode: assetAccount, debit: grandTotal, credit: 0 },
      { accountCode: revenueAccount, debit: 0, credit: untaxedTotal },
      { accountCode: '21400', debit: 0, credit: vatAmount }
    ];

    if (totalCostPrice > 0) {
      lines.push(
        { accountCode: '51100', debit: totalCostPrice, credit: 0 }, // COGS
        { accountCode: '11300', debit: 0, credit: totalCostPrice } // Inventory Asset
      );
    }

    return this.postJournalEntry(
      invoiceNumber,
      `فاتورة مبيعات ${invoiceNumber} - العميل: ${customerName || 'عميل نقدي'}`,
      lines
    );
  }

  // --- Automated Purchase Bill Entry Generator ---
  static async postPurchaseBillGL(
    billNumber: string,
    supplierName: string,
    grandTotal: number,
    untaxedTotal: number,
    vatInputAmount: number,
    isPaidCash: boolean = false
  ) {
    const payableAccount = isPaidCash ? '11100' : '21100'; // Cash or AP

    const lines = [
      { accountCode: '11300', debit: untaxedTotal, credit: 0 }, // Inventory Asset
      { accountCode: '11400', debit: vatInputAmount, credit: 0 }, // VAT Input
      { accountCode: payableAccount, debit: 0, credit: grandTotal } // AP or Cash
    ];

    return this.postJournalEntry(
      billNumber,
      `فاتورة شراء ${billNumber} - المورد: ${supplierName}`,
      lines
    );
  }

  // --- Automated Payment Journal Generators ---
  static async postCustomerPaymentGL(referenceNo: string, customerName: string, amount: number) {
    return this.postJournalEntry(
      referenceNo,
      `تحصيل دفعة عميل ${customerName}`,
      [
        { accountCode: '11100', debit: amount, credit: 0 }, // Cash
        { accountCode: '11200', debit: 0, credit: amount }  // Accounts Receivable
      ]
    );
  }

  static async postSupplierPaymentGL(referenceNo: string, supplierName: string, amount: number) {
    return this.postJournalEntry(
      referenceNo,
      `سداد دفعة مورد ${supplierName}`,
      [
        { accountCode: '21100', debit: amount, credit: 0 }, // Accounts Payable
        { accountCode: '11100', debit: 0, credit: amount }  // Cash
      ]
    );
  }
}
