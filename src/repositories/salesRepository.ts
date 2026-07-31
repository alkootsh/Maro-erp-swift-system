// MARO ERP - Sales Invoices Repository & Tax QR Generator
import { SalesInvoice, SalesInvoiceItem } from '../types/sprint8';
import { MaroSyncEngine } from '../lib/maroSyncEngine';
import { ProductRepository } from './productRepository';
import { CustomerRepository } from './customerRepository';
import { InventoryRepository } from './inventoryRepository';
import { AccountingService } from '../services/accountingService';
import { MaroEventBus } from '../lib/eventBus';

const INVOICE_COLLECTION = 'invoices';

export class SalesRepository {
  // --- ZATCA / ETA Base64 TLV Tax QR Code Generator ---
  static generateTaxQrCode(sellerName: string, taxNumber: string, timestamp: string, grandTotal: number, vatAmount: number): string {
    const encoder = new TextEncoder();
    
    function getTlvTag(tag: number, value: string): Uint8Array {
      const valBytes = encoder.encode(value);
      const tagBytes = new Uint8Array(2 + valBytes.length);
      tagBytes[0] = tag;
      tagBytes[1] = valBytes.length;
      tagBytes.set(valBytes, 2);
      return tagBytes;
    }

    const tag1 = getTlvTag(1, sellerName || 'MARO ERP Platform');
    const tag2 = getTlvTag(2, taxNumber || '300000000000003');
    const tag3 = getTlvTag(3, timestamp);
    const tag4 = getTlvTag(4, grandTotal.toFixed(2));
    const tag5 = getTlvTag(5, vatAmount.toFixed(2));

    const totalLen = tag1.length + tag2.length + tag3.length + tag4.length + tag5.length;
    const combined = new Uint8Array(totalLen);

    let offset = 0;
    [tag1, tag2, tag3, tag4, tag5].forEach(t => {
      combined.set(t, offset);
      offset += t.length;
    });

    // Convert to Base64
    let binary = '';
    combined.forEach(b => { binary += String.fromCharCode(b); });
    return typeof btoa !== 'undefined' ? btoa(binary) : Buffer.from(binary, 'binary').toString('base64');
  }

  static getInvoices(): SalesInvoice[] {
    return MaroSyncEngine.getLocalCollection<SalesInvoice>(INVOICE_COLLECTION)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  static getInvoiceById(id: string): SalesInvoice | null {
    return MaroSyncEngine.getLocalDocument<SalesInvoice>(INVOICE_COLLECTION, id);
  }

  static async createInvoice(invoiceData: Omit<SalesInvoice, 'id' | 'invoiceNumber' | 'createdAt'>): Promise<SalesInvoice> {
    const invoices = this.getInvoices();
    const invoiceNumber = `INV-2026-${String(invoices.length + 1).padStart(5, '0')}`;
    const id = `inv_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;
    const createdAt = new Date().toISOString();

    // Calculate totals
    let totalUntaxed = 0;
    let totalTax = 0;
    let totalDiscount = 0;
    let totalCostPrice = 0;

    const items: SalesInvoiceItem[] = invoiceData.items.map(item => {
      const lineUntaxed = item.quantity * item.unitPrice * (1 - (item.discountPercent || 0) / 100);
      const lineTax = lineUntaxed * ((item.taxRate || 14) / 100);
      const lineTotal = lineUntaxed + lineTax;

      totalUntaxed += lineUntaxed;
      totalTax += lineTax;
      totalDiscount += item.quantity * item.unitPrice * ((item.discountPercent || 0) / 100);
      totalCostPrice += item.quantity * (item.costPrice || 0);

      return {
        ...item,
        id: item.id || `item_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        lineTotal
      };
    });

    const grandTotal = totalUntaxed + totalTax;
    const paidAmount = invoiceData.paidAmount || (invoiceData.paymentMethod === 'CASH' || invoiceData.type === 'POS' ? grandTotal : 0);
    const dueAmount = grandTotal - paidAmount;

    // Status
    let status = invoiceData.status || 'APPROVED';
    if (dueAmount <= 0) status = 'PAID';
    else if (paidAmount > 0) status = 'PARTIALLY_PAID';

    // Generate ZATCA Tax QR Code
    const taxQrCode = this.generateTaxQrCode(
      'MARO ERP Platform',
      '300000000000003',
      createdAt,
      grandTotal,
      totalTax
    );

    const fullInvoice: SalesInvoice = {
      ...invoiceData,
      id,
      invoiceNumber,
      items,
      totalUntaxed,
      totalTax,
      totalDiscount,
      grandTotal,
      paidAmount,
      dueAmount,
      status,
      taxQrCode,
      createdAt,
      updatedAt: createdAt
    };

    // 1. Save Invoice Document
    await MaroSyncEngine.saveDocument(INVOICE_COLLECTION, fullInvoice, true);

    // 2. Stock Movement & Inventory Deduction
    for (const item of items) {
      await InventoryRepository.recordMovement({
        productId: item.productId,
        productName: item.productName,
        sku: item.sku,
        warehouseId: invoiceData.warehouseId,
        type: 'SALE',
        quantity: -item.quantity,
        unitCost: item.costPrice || 0,
        referenceId: id,
        referenceNo: invoiceNumber,
        notes: `مبيعات فاتورة رقم ${invoiceNumber}`
      });
    }

    // 3. Customer Ledger Entry (if customer selected)
    if (invoiceData.customerId) {
      await CustomerRepository.addLedgerEntry({
        customerId: invoiceData.customerId,
        transactionType: 'INVOICE',
        referenceNo: invoiceNumber,
        debit: grandTotal,
        credit: paidAmount,
        date: createdAt,
        notes: `فاتورة مبيعات ${invoiceNumber}`
      });
    }

    // 4. Automated Double-Entry GL Journal Entry
    await AccountingService.postSalesInvoiceGL(
      invoiceNumber,
      invoiceData.customerName || 'عميل نقدي',
      grandTotal,
      totalUntaxed,
      totalTax,
      totalCostPrice,
      invoiceData.type === 'POS' || invoiceData.paymentMethod === 'CASH'
    );

    // 5. Audit Logging & Event Bus
    await ProductRepository.logAudit('CREATE', INVOICE_COLLECTION, id, invoiceNumber);
    await MaroEventBus.publish('InvoiceCreated', { id, invoiceNumber, grandTotal });

    return fullInvoice;
  }
}
