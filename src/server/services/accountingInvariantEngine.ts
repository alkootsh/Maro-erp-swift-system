/**
 * @file accountingInvariantEngine.ts
 * @module Financial & Inventory Invariants Engine
 * @description Enterprise Financial Hardening: Enforces Total Debit = Total Credit, Immutable Posted Journal Entries, and Ledger-First Stock Accounting
 */

export interface JournalLineInput {
  accountId: string;
  debit: number | string;
  credit: number | string;
  description?: string;
  metadata?: Record<string, any>;
}

export class AccountingInvariantViolationError extends Error {
  constructor(message: string, public readonly details?: any) {
    super(message);
    this.name = 'AccountingInvariantViolationError';
  }
}

export class AccountingInvariantEngine {
  /**
   * Enforces the fundamental Double-Entry Accounting Invariant:
   * SUM(Debit) MUST EQUAL SUM(Credit) with precision <= 0.0001
   */
  public static validateJournalEntryLines(lines: JournalLineInput[]): {
    totalDebit: number;
    totalCredit: number;
    balanced: boolean;
  } {
    if (!lines || lines.length < 2) {
      throw new AccountingInvariantViolationError('القيد المحاسبي يجب أن يحتوي على طرفين على الأقل (مدين ودائن)');
    }

    let totalDebit = 0;
    let totalCredit = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const d = typeof line.debit === 'string' ? parseFloat(line.debit) || 0 : line.debit || 0;
      const c = typeof line.credit === 'string' ? parseFloat(line.credit) || 0 : line.credit || 0;

      if (d < 0 || c < 0) {
        throw new AccountingInvariantViolationError(`سطر القيد رقم ${i + 1} يحتوي على قيم سالبة غير مسموح بها بالقيود المزدوجة`);
      }

      if (d > 0 && c > 0) {
        throw new AccountingInvariantViolationError(`سطر القيد رقم ${i + 1} لا يجوز أن يحتوي على قيمتين للمدين والدائن معاً في نفس السطر`);
      }

      totalDebit += d;
      totalCredit += c;
    }

    // Rounding check up to 4 decimal places
    const diff = Math.abs(totalDebit - totalCredit);
    if (diff > 0.0001) {
      throw new AccountingInvariantViolationError(
        `القيد المحاسبي غير متوازن! مجموع المدين (${totalDebit.toFixed(2)}) لا يساوي مجموع الدائن (${totalCredit.toFixed(2)}). الفرق: ${diff.toFixed(4)}`,
        { totalDebit, totalCredit, difference: diff }
      );
    }

    return {
      totalDebit: Math.round(totalDebit * 10000) / 10000,
      totalCredit: Math.round(totalCredit * 10000) / 10000,
      balanced: true,
    };
  }

  /**
   * Generates a Reversal Journal Entry for an existing Posted Journal Entry (Reversal Pattern)
   */
  public static createReversalJournalLines(originalLines: JournalLineInput[], reversalReason: string): JournalLineInput[] {
    this.validateJournalEntryLines(originalLines);

    return originalLines.map((line) => ({
      accountId: line.accountId,
      debit: line.credit, // Invert Debit and Credit
      credit: line.debit,
      description: `قيد عكسي للتصحيح: ${reversalReason} | (الأصلي: ${line.description || ''})`,
      metadata: {
        ...(line.metadata || {}),
        isReversal: true,
        reversalReason,
        reversedAt: new Date().toISOString(),
      },
    }));
  }

  /**
   * Enforces Ledger-First Inventory Invariant:
   * Ensures that stock changes are accompanied by an immutable signed stock_ledger record.
   */
  public static calculateStockLedgerImpact(
    transactionType: 'Purchase' | 'Sale' | 'Transfer' | 'Adjustment' | 'POS' | 'Return',
    quantity: number,
    unitCost: number
  ): {
    signedQuantity: number;
    unitCost: number;
    totalCost: number;
  } {
    if (isNaN(quantity) || quantity === 0) {
      throw new AccountingInvariantViolationError('كمية الحركة المخزنية يجب أن تكون قيمة رقمية غير صفرية');
    }

    let signedQuantity = quantity;
    if (['Sale', 'POS'].includes(transactionType)) {
      signedQuantity = -Math.abs(quantity); // Outbound
    } else if (['Purchase', 'Return'].includes(transactionType)) {
      signedQuantity = Math.abs(quantity); // Inbound
    }

    const absCost = Math.abs(unitCost || 0);
    const totalCost = Math.round(Math.abs(signedQuantity) * absCost * 10000) / 10000;

    return {
      signedQuantity,
      unitCost: absCost,
      totalCost,
    };
  }
}
