/**
 * @file posRepository.ts
 * @module طبقة التعامل مع البيانات (Data Repositories)
 * @description ملف جزء من نظام MARO ERP. الوظيفة: posRepository.ts.
 */
// MARO ERP - POS Terminal Session & Barcode Scale Decoding Engine
import { POSSession } from '../types/sprint8';
import { MaroSyncEngine } from '../lib/maroSyncEngine';
import { ProductRepository } from './productRepository';
import { SalesRepository } from './salesRepository';
import { SalesInvoiceItem } from '../types/sprint8';
import { ProductMaster } from '../types/productMaster';

const SESSION_COLLECTION = 'pos_sessions';

export interface DecodedScaleBarcode {
  isScaleBarcode: boolean;
  itemSku: string;
  weightKg: number;
  totalPrice: number;
  type: 'WEIGHT' | 'PRICE';
  product?: ProductMaster;
}

export class POSRepository {
  // --- Barcode Scale Decoding Protocol (EAN-13) ---
  // Structure: 20 [5-digit Product SKU] [5-digit Price/Weight] [1 Check Digit]
  static decodeScaleBarcode(barcode: string): DecodedScaleBarcode | null {
    if (!barcode || barcode.length !== 13 || !barcode.startsWith('20')) {
      return null;
    }

    const skuDigits = barcode.substring(2, 7); // 5 digits SKU
    const valDigits = barcode.substring(7, 12); // 5 digits Value (e.g. 02500 = 2.500 kg or 25.00 EGP)
    const numericValue = parseFloat(valDigits) / 1000;

    // Search product by matching barcode prefix or SKU
    const products = ProductRepository.getProducts();
    const matchedProduct = products.find(p => p.sku.includes(skuDigits) || p.barcodes?.some(b => b.code.includes(skuDigits)));

    return {
      isScaleBarcode: true,
      itemSku: skuDigits,
      weightKg: numericValue,
      totalPrice: (matchedProduct?.price || 0) * numericValue,
      type: 'WEIGHT',
      product: matchedProduct
    };
  }

  // --- POS Session Operations ---
  static getSessions(): POSSession[] {
    return MaroSyncEngine.getLocalCollection<POSSession>(SESSION_COLLECTION)
      .sort((a, b) => new Date(b.openedAt).getTime() - new Date(a.openedAt).getTime());
  }

  static getActiveSession(terminalId = 'TERM-01'): POSSession | null {
    const sessions = this.getSessions();
    return sessions.find(s => s.terminalId === terminalId && s.status === 'OPEN') || null;
  }

  static async openSession(terminalId: string, cashierId: string, cashierName: string, openingFloat: number): Promise<POSSession> {
    const active = this.getActiveSession(terminalId);
    if (active) {
      return active; // Return existing open session
    }

    const id = `pos_sess_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;
    const session: POSSession = {
      id,
      terminalId,
      cashierId,
      cashierName,
      openingFloat,
      totalSales: 0,
      totalTransactions: 0,
      status: 'OPEN',
      openedAt: new Date().toISOString()
    };

    await MaroSyncEngine.saveDocument(SESSION_COLLECTION, session, true);
    await ProductRepository.logAudit('CREATE', SESSION_COLLECTION, id, `فتح وردية POS - الكاشير: ${cashierName}`);
    return session;
  }

  static async recordPOSTransaction(
    sessionId: string,
    items: SalesInvoiceItem[],
    paymentMethod: 'CASH' | 'CARD' | 'CREDIT' | 'SPLIT',
    customerId?: string,
    customerName?: string,
    paidAmount?: number
  ) {
    const session = MaroSyncEngine.getLocalDocument<POSSession>(SESSION_COLLECTION, sessionId);
    if (!session || session.status !== 'OPEN') {
      throw new Error('لا توجد وردية POS مفتوحة حالياً لإنهاء المعاملة');
    }

    // Create Sales Invoice
    const invoice = await SalesRepository.createInvoice({
      type: 'POS',
      branchId: 'main_branch',
      warehouseId: 'wh_main',
      customerId,
      customerName,
      items,
      totalUntaxed: 0,
      totalTax: 0,
      totalDiscount: 0,
      grandTotal: 0,
      paidAmount: paidAmount || 0,
      dueAmount: 0,
      paymentMethod,
      posSessionId: sessionId,
      cashierId: session.cashierId,
      status: 'PAID'
    });

    // Update Session Totals
    session.totalSales = (session.totalSales || 0) + invoice.grandTotal;
    session.totalTransactions = (session.totalTransactions || 0) + 1;

    await MaroSyncEngine.saveDocument(SESSION_COLLECTION, session, false);
    return invoice;
  }

  static async closeSession(sessionId: string, closingCash: number, notes?: string): Promise<POSSession> {
    const session = MaroSyncEngine.getLocalDocument<POSSession>(SESSION_COLLECTION, sessionId);
    if (!session) throw new Error('الوردية غير موجودة');

    const expectedCash = (session.openingFloat || 0) + (session.totalSales || 0);
    const variance = closingCash - expectedCash;

    session.closingCash = closingCash;
    session.expectedCash = expectedCash;
    session.variance = variance;
    session.status = 'CLOSED';
    session.closedAt = new Date().toISOString();
    session.notes = notes;

    await MaroSyncEngine.saveDocument(SESSION_COLLECTION, session, false);
    await ProductRepository.logAudit('UPDATE', SESSION_COLLECTION, sessionId, `إغلاق وردية Z-Report (فروقات: ${variance.toFixed(2)} EGP)`);
    return session;
  }
}
