/**
 * @file erpClient.ts
 * @module خدمات النظام (Services)
 * @description ملف جزء من نظام MARO ERP. الوظيفة: erpClient.ts.
 */
import { MaroSyncEngine } from '../../lib/maroSyncEngine';

export interface ProductPayload {
  code: string;
  barcode?: string;
  name: string;
  type?: string;
  costPrice: number;
  salePrice: number;
  taxRate?: number;
  stockQuantity?: number;
  unit?: string;
  category?: string;
  metadata?: any;
}

export interface SalesInvoicePayload {
  invoiceNumber: string;
  customerName?: string;
  subtotal: number;
  taxAmount: number;
  discountAmount?: number;
  totalAmount: number;
  paidAmount?: number;
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
}

export interface PurchaseBillPayload {
  billNumber: string;
  supplierName?: string;
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  paidAmount?: number;
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
}

export interface POSCheckoutPayload {
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

async function safeJson(res: Response) {
  try {
    const text = await res.text();
    if (!text || !text.trim()) return null;
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export class ErpApiClient {
  // 1. INVENTORY API
  static async getProducts() {
    try {
      const res = await fetch('/api/erp/inventory/products');
      if (res.ok) {
        const data = await safeJson(res);
        if (data) return data;
      }
    } catch (e) {
      console.warn("Falling back to local cache for products:", e);
    }
    return MaroSyncEngine.getLocalCollection('products');
  }

  static async saveProduct(product: ProductPayload) {
    const res = await fetch('/api/erp/inventory/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(product)
    });
    const data = await safeJson(res);
    if (!res.ok) {
      throw new Error(data?.error || `Failed to save product (${res.status})`);
    }
    if (data) {
      await MaroSyncEngine.saveDocument('products', data, false);
    }
    return data;
  }

  static async getStockLedger() {
    const res = await fetch('/api/erp/inventory/stock-ledger');
    const data = await safeJson(res);
    if (!res.ok) throw new Error(data?.error || 'Failed to fetch stock ledger');
    return data || [];
  }

  // 2. SALES API
  static async getSalesInvoices() {
    try {
      const res = await fetch('/api/erp/sales/invoices');
      if (res.ok) {
        const data = await safeJson(res);
        if (data) return data;
      }
    } catch (e) {
      console.warn("Falling back to local cache for invoices:", e);
    }
    return MaroSyncEngine.getLocalCollection('invoices');
  }

  static async createSalesInvoice(invoice: SalesInvoicePayload) {
    const res = await fetch('/api/erp/sales/invoices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(invoice)
    });
    const data = await safeJson(res);
    if (!res.ok) {
      throw new Error(data?.error || `Failed to create sales invoice (${res.status})`);
    }
    if (data) {
      await MaroSyncEngine.saveDocument('invoices', data, false);
    }
    return data;
  }

  // 3. PURCHASES (BILLS) API
  static async getPurchaseBills() {
    try {
      const res = await fetch('/api/erp/purchases/bills');
      if (res.ok) {
        const data = await safeJson(res);
        if (data) return data;
      }
    } catch (e) {
      console.warn("Falling back to local cache for bills:", e);
    }
    return MaroSyncEngine.getLocalCollection('bills');
  }

  static async createPurchaseBill(bill: PurchaseBillPayload) {
    const res = await fetch('/api/erp/purchases/bills', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bill)
    });
    const data = await safeJson(res);
    if (!res.ok) {
      throw new Error(data?.error || `Failed to create purchase bill (${res.status})`);
    }
    if (data) {
      await MaroSyncEngine.saveDocument('bills', data, false);
    }
    return data;
  }

  // 4. POS FAST CHECKOUT API
  static async processPOSSale(payload: POSCheckoutPayload) {
    const res = await fetch('/api/erp/pos/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const result = await safeJson(res);
    if (!res.ok) {
      throw new Error(result?.error || `Failed to process POS checkout (${res.status})`);
    }
    if (result && result.invoice) {
      await MaroSyncEngine.saveDocument('invoices', result.invoice, false);
    }
    return result;
  }

  // 5. EXECUTIVE SUMMARY & DASHBOARD METRICS API
  static async getExecutiveSummary() {
    try {
      const res = await fetch('/api/erp/reports/summary');
      if (res.ok) {
        const data = await safeJson(res);
        if (data) return data;
      }
    } catch (e) {
      console.warn("Using offline metric computation:", e);
    }
    return {
      totalSales: 0,
      salesCount: 0,
      totalPurchases: 0,
      purchasesCount: 0,
      totalStockValuation: 0,
      productsCount: 0,
      netProfit: 0,
      vatNetPayable: 0
    };
  }
}
