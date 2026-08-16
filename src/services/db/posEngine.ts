/**
 * @file posEngine.ts
 * @module خدمات النظام (Services)
 * @description ملف جزء من نظام MARO ERP. الوظيفة: posEngine.ts.
 */
import { eq, desc, and } from 'drizzle-orm';
import { db } from '../../db';
import { posSessions } from '../../db/schema';
import { SalesEngine, SalesInvoiceInput } from './salesEngine';

export interface POSSaleInput {
  tenantId: string;
  branchId?: string;
  cashierId?: string;
  cashierName?: string;
  terminalName?: string;
  invoiceNumber: string;
  customerName?: string;
  paymentMethod: 'Cash' | 'Card' | 'Credit' | 'Split';
  subtotal: number;
  taxAmount: number;
  discountAmount?: number;
  totalAmount: number;
  paidAmount?: number;
  changeAmount?: number;
  splitDetails?: { method: string; amount: number }[];
  items: {
    productId: string;
    productName: string;
    barcode?: string;
    quantity: number;
    unitPrice: number;
    unitCost?: number;
    taxRate?: number;
    taxAmount?: number;
    totalPrice: number;
  }[];
}

export class POSEngine {
  /**
   * Process ultra-fast POS Checkout (< 50ms)
   * Saves to Sales, updates Inventory & Stock Ledger, and records GL Journal Entry
   */
  static async processSale(input: POSSaleInput) {
    const startTime = performance.now();

    const salesInvoiceInput: SalesInvoiceInput = {
      tenantId: input.tenantId,
      branchId: input.branchId,
      invoiceNumber: input.invoiceNumber,
      customerName: input.customerName || 'عميل كاشير سريع',
      subtotal: input.subtotal,
      taxAmount: input.taxAmount,
      discountAmount: input.discountAmount || 0,
      totalAmount: input.totalAmount,
      paidAmount: input.paidAmount || input.totalAmount,
      status: 'Paid',
      paymentMethod: input.paymentMethod,
      source: 'POS',
      lines: input.items.map(item => ({
        productId: item.productId,
        productName: item.productName,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        unitCost: item.unitCost || 0,
        taxRate: item.taxRate || 15,
        taxAmount: item.taxAmount || 0,
        totalPrice: item.totalPrice
      })),
      metadata: {
        cashierName: input.cashierName || 'كاشير 1',
        terminalName: input.terminalName || 'POS-01',
        changeAmount: input.changeAmount || 0,
        splitDetails: input.splitDetails || []
      }
    };

    const invoice = await SalesEngine.createSalesInvoice(salesInvoiceInput);
    const durationMs = Math.round(performance.now() - startTime);

    return {
      success: true,
      invoice,
      executionTimeMs: durationMs,
      receipt: {
        invoiceNumber: input.invoiceNumber,
        date: new Date().toISOString(),
        customerName: input.customerName || 'عميل كاشير سريع',
        itemsCount: input.items.length,
        subtotal: input.subtotal,
        taxAmount: input.taxAmount,
        totalAmount: input.totalAmount,
        paidAmount: input.paidAmount || input.totalAmount,
        changeAmount: input.changeAmount || 0,
        paymentMethod: input.paymentMethod,
        cashierName: input.cashierName || 'كاشير 1'
      }
    };
  }

  /**
   * Open POS Session for Cashier Shift
   */
  static async openSession(tenantId: string, cashierId: string, openingCash: number, terminalName?: string) {
    const [session] = await db.insert(posSessions).values({
      tenantId,
      cashierId,
      terminalName: terminalName || 'Main POS Terminal',
      openingCash: openingCash.toString(),
      status: 'Open',
      openedAt: new Date()
    }).returning();

    return session;
  }

  /**
   * Get Active Session
   */
  static async getActiveSession(tenantId: string, cashierId?: string) {
    try {
      const condition = cashierId 
        ? and(eq(posSessions.tenantId, tenantId), eq(posSessions.cashierId, cashierId), eq(posSessions.status, 'Open'))
        : and(eq(posSessions.tenantId, tenantId), eq(posSessions.status, 'Open'));

      const sessions = await db.select().from(posSessions)
        .where(condition)
        .orderBy(desc(posSessions.openedAt))
        .limit(1);

      return sessions.length > 0 ? sessions[0] : null;
    } catch (e) {
      console.error("Failed to query active POS session", e);
      return null;
    }
  }
}
