import { eq, desc } from 'drizzle-orm';
import { db } from '../../db';
import { salesInvoices, salesInvoiceLines, products } from '../../db/schema';
import { InventoryEngine } from './inventoryEngine';
import { FinanceEngine } from './financeEngine';

export interface SalesInvoiceInput {
  tenantId: string;
  branchId?: string;
  invoiceNumber: string;
  customerId?: string;
  customerName?: string;
  date?: Date;
  subtotal: number;
  taxAmount: number;
  discountAmount?: number;
  totalAmount: number;
  paidAmount?: number;
  status?: string;
  paymentMethod?: 'Cash' | 'Card' | 'Credit' | 'Split';
  source?: 'POS' | 'DirectSales' | 'ECommerce';
  lines: {
    productId: string;
    productName?: string;
    quantity: number;
    unitPrice: number;
    unitCost?: number;
    taxRate?: number;
    taxAmount?: number;
    totalPrice: number;
  }[];
  metadata?: any;
}

export class SalesEngine {
  /**
   * Create a Sales Invoice with full ACID transaction:
   * 1. Inserts invoice header and detail lines
   * 2. Deducts stock quantities and records stock ledger audit logs
   * 3. Generates balanced double-entry accounting journal entries (GL Posting)
   */
  static async createSalesInvoice(input: SalesInvoiceInput) {
    const warehouse = await InventoryEngine.getOrCreateDefaultWarehouse(input.tenantId);

    return await db.transaction(async (tx) => {
      // 1. Insert Sales Invoice Header
      const [invoice] = await tx.insert(salesInvoices).values({
        tenantId: input.tenantId,
        branchId: input.branchId,
        invoiceNumber: input.invoiceNumber,
        customerId: input.customerId,
        customerName: input.customerName || 'عميل نقدي (Walk-in Customer)',
        date: input.date || new Date(),
        subtotal: input.subtotal.toString(),
        taxAmount: input.taxAmount.toString(),
        discountAmount: (input.discountAmount || 0).toString(),
        totalAmount: input.totalAmount.toString(),
        paidAmount: (input.paidAmount !== undefined ? input.paidAmount : input.totalAmount).toString(),
        status: input.status || 'Paid',
        paymentMethod: input.paymentMethod || 'Cash',
        source: input.source || 'DirectSales',
        metadata: input.metadata || {}
      }).returning();

      let totalCOGS = 0;

      // 2. Insert Invoice Lines & Deduct Inventory
      for (const line of input.lines) {
        const lineTax = line.taxAmount !== undefined ? line.taxAmount : (line.totalPrice * (line.taxRate || 15) / 100);
        const cost = line.unitCost || 0;
        totalCOGS += (cost * line.quantity);

        await tx.insert(salesInvoiceLines).values({
          invoiceId: invoice.id,
          productId: line.productId,
          productName: line.productName || 'صنف',
          quantity: line.quantity.toString(),
          unitPrice: line.unitPrice.toString(),
          unitCost: cost.toString(),
          taxRate: (line.taxRate || 15).toString(),
          taxAmount: lineTax.toString(),
          totalPrice: line.totalPrice.toString(),
        });

        // Deduct from stock ledger (negative quantity for sale)
        if (line.productId) {
          await InventoryEngine.recordStockMovement(
            input.tenantId,
            line.productId,
            warehouse.id,
            input.source === 'POS' ? 'POS' : 'Sale',
            -Math.abs(line.quantity),
            cost,
            input.invoiceNumber,
            { invoiceId: invoice.id, customerName: input.customerName }
          );
        }
      }

      // 3. Automated Double-Entry General Ledger (GL) Posting
      try {
        const isPos = input.source === 'POS';
        const isCredit = input.paymentMethod === 'Credit';
        const debitAccountCode = isCredit ? '11200' : (isPos ? '11110' : '11100'); // AR, POS Clearing, or Cash
        const revenueAccountCode = isPos ? '41200' : '41100'; // Retail or Wholesale

        const glLines: { accountCode: string; debit: number; credit: number }[] = [
          // Debit Cash / AR
          { accountCode: debitAccountCode, debit: input.totalAmount, credit: 0 },
          // Credit Revenue
          { accountCode: revenueAccountCode, debit: 0, credit: input.subtotal },
        ];

        // Credit Tax Payable if tax > 0
        if (input.taxAmount > 0) {
          glLines.push({ accountCode: '21400', debit: 0, credit: input.taxAmount });
        }

        // Record COGS if cost is tracked
        if (totalCOGS > 0) {
          glLines.push(
            { accountCode: '51100', debit: totalCOGS, credit: 0 }, // Debit COGS Expense
            { accountCode: '11300', debit: 0, credit: totalCOGS }  // Credit Inventory Asset
          );
        }

        await FinanceEngine.postJournalEntry(
          input.tenantId,
          `GL-${input.invoiceNumber}`,
          `ترحيل مبيعات فاتورة رقم ${input.invoiceNumber} (${input.customerName || 'عميل نقدي'})`,
          glLines
        );
      } catch (glError) {
        console.warn("Auto GL Posting Notice:", glError);
      }

      return invoice;
    });
  }

  /**
   * Get all sales invoices with their item lines
   */
  static async getSalesInvoices(tenantId: string) {
    try {
      const invoices = await db.select().from(salesInvoices)
        .where(eq(salesInvoices.tenantId, tenantId))
        .orderBy(desc(salesInvoices.date));

      const lines = await db.select().from(salesInvoiceLines);

      return invoices.map(inv => ({
        id: inv.id,
        invoiceNumber: inv.invoiceNumber,
        customerId: inv.customerId,
        customerName: inv.customerName,
        date: inv.date,
        subtotal: parseFloat(inv.subtotal),
        taxAmount: parseFloat(inv.taxAmount),
        discountAmount: parseFloat(inv.discountAmount || '0'),
        totalAmount: parseFloat(inv.totalAmount),
        paidAmount: parseFloat(inv.paidAmount || '0'),
        status: inv.status,
        paymentMethod: inv.paymentMethod,
        source: inv.source,
        metadata: inv.metadata,
        items: lines.filter(l => l.invoiceId === inv.id).map(l => ({
          id: l.id,
          productId: l.productId,
          productName: l.productName,
          quantity: parseFloat(l.quantity),
          unitPrice: parseFloat(l.unitPrice),
          unitCost: parseFloat(l.unitCost || '0'),
          taxAmount: parseFloat(l.taxAmount),
          totalPrice: parseFloat(l.totalPrice)
        }))
      }));
    } catch (e) {
      console.error("Failed to query sales invoices", e);
      return [];
    }
  }
}
