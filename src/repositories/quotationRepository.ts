/**
 * @file quotationRepository.ts
 * @module طبقة التعامل مع البيانات (Data Repositories)
 * @description ملف جزء من نظام MARO ERP. الوظيفة: quotationRepository.ts.
 */
// MARO ERP - Sales Quotations Repository
import { SalesQuotation, SalesQuotationItem } from '../types/sprint8';
import { MaroSyncEngine } from '../lib/maroSyncEngine';
import { ProductRepository } from './productRepository';
import { SalesRepository } from './salesRepository';
import { MaroEventBus } from '../lib/eventBus';

const QUOTATION_COLLECTION = 'sales_quotations';

export class QuotationRepository {
  static getQuotations(): SalesQuotation[] {
    return MaroSyncEngine.getLocalCollection<SalesQuotation>(QUOTATION_COLLECTION)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  static getQuotationById(id: string): SalesQuotation | null {
    return MaroSyncEngine.getLocalDocument<SalesQuotation>(QUOTATION_COLLECTION, id);
  }

  static async createQuotation(quotationData: Omit<SalesQuotation, 'id' | 'quotationNumber' | 'createdAt'>): Promise<SalesQuotation> {
    const list = this.getQuotations();
    const quotationNumber = `QT-2026-${String(list.length + 1).padStart(5, '0')}`;
    const id = `qt_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;
    const createdAt = new Date().toISOString();

    let totalUntaxed = 0;
    let totalTax = 0;

    const items: SalesQuotationItem[] = quotationData.items.map(item => {
      const lineUntaxed = item.quantity * item.unitPrice * (1 - (item.discountPercent || 0) / 100);
      const lineTax = lineUntaxed * ((item.taxRate || 14) / 100);
      const lineTotal = lineUntaxed + lineTax;

      totalUntaxed += lineUntaxed;
      totalTax += lineTax;

      return {
        ...item,
        id: item.id || `qitem_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        lineTotal
      };
    });

    const grandTotal = totalUntaxed + totalTax;

    const quotation: SalesQuotation = {
      ...quotationData,
      id,
      quotationNumber,
      items,
      totalUntaxed,
      totalTax,
      grandTotal,
      status: quotationData.status || 'DRAFT',
      createdAt,
      updatedAt: createdAt
    };

    await MaroSyncEngine.saveDocument(QUOTATION_COLLECTION, quotation, true);
    await ProductRepository.logAudit('CREATE', QUOTATION_COLLECTION, id, quotationNumber);
    return quotation;
  }

  static async convertToInvoice(quotationId: string, warehouseId: string = 'wh_main'): Promise<string> {
    const quotation = this.getQuotationById(quotationId);
    if (!quotation) throw new Error('عرض السعر غير موجود');

    const createdInvoice = await SalesRepository.createInvoice({
      type: 'RETAIL',
      customerId: quotation.customerId,
      customerName: quotation.customerName,
      branchId: 'main_branch',
      warehouseId,
      items: quotation.items.map(q => ({
        id: `inv_item_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
        productId: q.productId,
        productName: q.productName,
        sku: q.sku,
        unitName: q.unitName,
        quantity: q.quantity,
        unitPrice: q.unitPrice,
        costPrice: q.unitPrice * 0.7,
        discountPercent: q.discountPercent,
        taxRate: q.taxRate,
        lineTotal: q.lineTotal
      })),
      totalUntaxed: quotation.totalUntaxed,
      totalTax: quotation.totalTax,
      totalDiscount: 0,
      grandTotal: quotation.grandTotal,
      paidAmount: quotation.grandTotal,
      dueAmount: 0,
      paymentMethod: 'CASH',
      status: 'APPROVED',
      notes: `محول من عرض السعر رقم ${quotation.quotationNumber}`
    });

    // Update Quotation Status
    const updatedQuotation: SalesQuotation = {
      ...quotation,
      status: 'CONVERTED',
      convertedInvoiceId: createdInvoice.id,
      updatedAt: new Date().toISOString()
    };
    await MaroSyncEngine.saveDocument(QUOTATION_COLLECTION, updatedQuotation, false);

    return createdInvoice.id;
  }
}
