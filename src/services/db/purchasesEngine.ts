/**
 * @file purchasesEngine.ts
 * @module خدمات النظام (Services)
 * @description ملف جزء من نظام MARO ERP. الوظيفة: purchasesEngine.ts.
 */
import { eq, desc } from 'drizzle-orm';
import { db } from '../../db';
import { purchaseInvoices, purchaseInvoiceLines, products } from '../../db/schema';
import { InventoryEngine } from './inventoryEngine';
import { FinanceEngine } from './financeEngine';

export interface PurchaseInvoiceInput {
  tenantId: string;
  branchId?: string;
  billNumber: string;
  supplierId?: string;
  supplierName?: string;
  date?: Date;
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  paidAmount?: number;
  status?: string;
  paymentMethod?: 'Cash' | 'Card' | 'Credit' | 'BankTransfer';
  lines: {
    productId: string;
    productName?: string;
    quantity: number;
    unitCost: number;
    taxRate?: number;
    taxAmount?: number;
    totalCost: number;
  }[];
  metadata?: any;
}

export class PurchasesEngine {
  /**
   * Create a Purchase Invoice (Bill) with full ACID transaction:
   * 1. Inserts purchase invoice header & line items
   * 2. Automatically updates stock & creates stockLedger entries (Incoming)
   * 3. Automatically generates balanced double-entry accounting entries:
   *    Debit: Inventory Asset (11300)
   *    Debit: VAT Input Tax (11400)
   *    Credit: Accounts Payable (21100) / Cash (11100)
   */
  static async createPurchaseInvoice(input: PurchaseInvoiceInput) {
    const warehouse = await InventoryEngine.getOrCreateDefaultWarehouse(input.tenantId);

    return await db.transaction(async (tx) => {
      // 1. Insert Purchase Invoice
      const [bill] = await tx.insert(purchaseInvoices).values({
        tenantId: input.tenantId,
        branchId: input.branchId,
        billNumber: input.billNumber,
        supplierId: input.supplierId,
        supplierName: input.supplierName || 'مورد عام (General Supplier)',
        date: input.date || new Date(),
        subtotal: input.subtotal.toString(),
        taxAmount: input.taxAmount.toString(),
        totalAmount: input.totalAmount.toString(),
        paidAmount: (input.paidAmount !== undefined ? input.paidAmount : input.totalAmount).toString(),
        status: input.status || 'Paid',
        paymentMethod: input.paymentMethod || 'Cash',
        metadata: input.metadata || {}
      }).returning();

      // 2. Insert lines & increase inventory
      for (const line of input.lines) {
        const lineTax = line.taxAmount !== undefined ? line.taxAmount : (line.totalCost * (line.taxRate || 15) / 100);

        await tx.insert(purchaseInvoiceLines).values({
          billId: bill.id,
          productId: line.productId,
          productName: line.productName || 'صنف مشتريات',
          quantity: line.quantity.toString(),
          unitCost: line.unitCost.toString(),
          taxRate: (line.taxRate || 15).toString(),
          taxAmount: lineTax.toString(),
          totalCost: line.totalCost.toString(),
        });

        // Record incoming stock movement (+ quantity)
        if (line.productId) {
          await InventoryEngine.recordStockMovement(
            input.tenantId,
            line.productId,
            warehouse.id,
            'Purchase',
            Math.abs(line.quantity),
            line.unitCost,
            input.billNumber,
            { billId: bill.id, supplierName: input.supplierName }
          );

          // Update cost price on product master
          await tx.update(products)
            .set({ costPrice: line.unitCost.toString() })
            .where(eq(products.id, line.productId));
        }
      }

      // 3. Automated Double-Entry General Ledger (GL) Posting
      try {
        const isCredit = input.paymentMethod === 'Credit';
        const creditAccountCode = isCredit ? '21100' : '11100'; // Accounts Payable or Cash

        const glLines: { accountCode: string; debit: number; credit: number }[] = [
          // Debit Inventory Asset
          { accountCode: '11300', debit: input.subtotal, credit: 0 },
        ];

        // Debit VAT Input Tax if tax > 0
        if (input.taxAmount > 0) {
          glLines.push({ accountCode: '11400', debit: input.taxAmount, credit: 0 });
        }

        // Credit Cash or Accounts Payable
        glLines.push({ accountCode: creditAccountCode, debit: 0, credit: input.totalAmount });

        await FinanceEngine.postJournalEntry(
          input.tenantId,
          `GL-${input.billNumber}`,
          `ترحيل مشتريات فاتورة رقم ${input.billNumber} (${input.supplierName || 'مورد عام'})`,
          glLines
        );
      } catch (glError) {
        console.warn("Auto GL Posting Notice on Purchase:", glError);
      }

      return bill;
    });
  }

  /**
   * Get all purchase invoices with lines
   */
  static async getPurchaseInvoices(tenantId: string) {
    try {
      const bills = await db.select().from(purchaseInvoices)
        .where(eq(purchaseInvoices.tenantId, tenantId))
        .orderBy(desc(purchaseInvoices.date));

      const lines = await db.select().from(purchaseInvoiceLines);

      return bills.map(b => ({
        id: b.id,
        billNumber: b.billNumber,
        supplierId: b.supplierId,
        supplierName: b.supplierName,
        date: b.date,
        subtotal: parseFloat(b.subtotal),
        taxAmount: parseFloat(b.taxAmount),
        totalAmount: parseFloat(b.totalAmount),
        paidAmount: parseFloat(b.paidAmount || '0'),
        status: b.status,
        paymentMethod: b.paymentMethod,
        metadata: b.metadata,
        items: lines.filter(l => l.billId === b.id).map(l => ({
          id: l.id,
          productId: l.productId,
          productName: l.productName,
          quantity: parseFloat(l.quantity),
          unitCost: parseFloat(l.unitCost),
          taxAmount: parseFloat(l.taxAmount),
          totalCost: parseFloat(l.totalCost)
        }))
      }));
    } catch (e) {
      console.error("Failed to query purchase invoices", e);
      return [];
    }
  }
}
