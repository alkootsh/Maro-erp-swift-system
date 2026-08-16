/**
 * @file commands.ts
 * @module ملف إضافي في النظام
 * @description ملف جزء من نظام MARO ERP. الوظيفة: commands.ts.
 */
// MARO ERP - CQRS Command Handlers (Product, Sales, Purchase, POS, Accounting)
import { ProductRepository } from '../repositories/productRepository';
import { ProductMaster, WarehouseData } from '../types/productMaster';
import { CustomerRepository } from '../repositories/customerRepository';
import { SupplierRepository } from '../repositories/supplierRepository';
import { SalesRepository } from '../repositories/salesRepository';
import { PurchaseRepository } from '../repositories/purchaseRepository';
import { POSRepository } from '../repositories/posRepository';
import { InventoryRepository } from '../repositories/inventoryRepository';
import { AccountingService } from '../services/accountingService';
import { QuotationRepository } from '../repositories/quotationRepository';
import { SalesOrderRepository } from '../repositories/salesOrderRepository';
import { SalesReturnRepository } from '../repositories/salesReturnRepository';
import { ProcurementRepository } from '../repositories/procurementRepository';
import {
  Customer, Supplier, SalesInvoice, PurchaseOrder, PurchaseBill, POSSession, SalesInvoiceItem,
  SalesQuotation, SalesOrder, SalesReturn, PurchaseRequest, RFQ, GoodsReceivedNote, SupplierDebitNote
} from '../types/sprint8';
import { MaroSyncEngine } from '../lib/maroSyncEngine';

export interface ICommand<TResult = any> {
  execute(): Promise<TResult>;
}

// --- Product & Warehouse Commands ---
export class CreateProductCommand implements ICommand<string> {
  constructor(private productData: Omit<ProductMaster, 'id'>) {}
  async execute(): Promise<string> {
    if (!this.productData.name || !this.productData.sku) {
      throw new Error('اسم المنتج والرمز (SKU) مطلوبان بشكل أساسي');
    }
    return await ProductRepository.addProduct(this.productData);
  }
}

export class UpdateProductCommand implements ICommand<void> {
  constructor(private id: string, private changes: Partial<ProductMaster>) {}
  async execute(): Promise<void> {
    await ProductRepository.updateProduct(this.id, this.changes);
  }
}

export class DeleteProductCommand implements ICommand<void> {
  constructor(private id: string, private name?: string) {}
  async execute(): Promise<void> {
    await ProductRepository.deleteProduct(this.id, this.name);
  }
}

export class CreateWarehouseCommand implements ICommand<string> {
  constructor(private warehouse: Omit<WarehouseData, 'id'>) {}
  async execute(): Promise<string> {
    const id = `wh_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;
    const fullWh: WarehouseData = { ...this.warehouse, id };
    await MaroSyncEngine.saveDocument('warehouses', fullWh, true);
    await ProductRepository.logAudit('CREATE', 'warehouses', id, this.warehouse.name);
    return id;
  }
}

export class UpdateWarehouseCommand implements ICommand<void> {
  constructor(private id: string, private changes: Partial<WarehouseData>) {}
  async execute(): Promise<void> {
    const existing = MaroSyncEngine.getLocalDocument<WarehouseData>('warehouses', this.id);
    if (!existing) throw new Error('المخزن غير موجود');
    const updated: WarehouseData = { ...existing, ...this.changes };
    await MaroSyncEngine.saveDocument('warehouses', updated, false);
    await ProductRepository.logAudit('UPDATE', 'warehouses', this.id, updated.name);
  }
}

export class DeleteWarehouseCommand implements ICommand<void> {
  constructor(private id: string, private name?: string) {}
  async execute(): Promise<void> {
    await MaroSyncEngine.deleteDocument('warehouses', this.id);
    await ProductRepository.logAudit('DELETE', 'warehouses', this.id, this.name || this.id);
  }
}

// --- Customer Commands ---
export class SaveCustomerCommand implements ICommand<string> {
  constructor(private customerData: Omit<Customer, 'id' | 'createdAt'> & { id?: string }) {}
  async execute(): Promise<string> {
    if (!this.customerData.name) throw new Error('اسم العميل مطلوب');
    return await CustomerRepository.saveCustomer(this.customerData);
  }
}

export class DeleteCustomerCommand implements ICommand<void> {
  constructor(private id: string, private name?: string) {}
  async execute(): Promise<void> {
    await CustomerRepository.deleteCustomer(this.id, this.name);
  }
}

export class RecordCustomerPaymentCommand implements ICommand<void> {
  constructor(
    private customerId: string,
    private amount: number,
    private referenceNo: string,
    private notes?: string
  ) {}

  async execute(): Promise<void> {
    if (this.amount <= 0) throw new Error('مبلغ الدفعة يجب أن يكون أكبر من الصفر');
    const customer = CustomerRepository.getCustomerById(this.customerId);
    if (!customer) throw new Error('العميل غير موجود');

    await CustomerRepository.addLedgerEntry({
      customerId: this.customerId,
      transactionType: 'PAYMENT',
      referenceNo: this.referenceNo || `PAY-${Date.now()}`,
      debit: 0,
      credit: this.amount,
      date: new Date().toISOString(),
      notes: this.notes || 'سداد دفعة نقدية'
    });

    await AccountingService.postCustomerPaymentGL(this.referenceNo, customer.name, this.amount);
  }
}

// --- Supplier Commands ---
export class SaveSupplierCommand implements ICommand<string> {
  constructor(private supplierData: Omit<Supplier, 'id' | 'createdAt'> & { id?: string }) {}
  async execute(): Promise<string> {
    if (!this.supplierData.name) throw new Error('اسم المورد مطلوب');
    return await SupplierRepository.saveSupplier(this.supplierData);
  }
}

export class DeleteSupplierCommand implements ICommand<void> {
  constructor(private id: string, private name?: string) {}
  async execute(): Promise<void> {
    await SupplierRepository.deleteSupplier(this.id, this.name);
  }
}

export class ToggleSupplierStatusCommand implements ICommand<void> {
  constructor(private id: string, private currentStatus: 'active' | 'inactive') {}

  async execute(): Promise<void> {
    const supplier = SupplierRepository.getSupplierById(this.id);
    if (!supplier) throw new Error('المورد غير موجود');
    const newStatus = this.currentStatus === 'active' ? 'inactive' : 'active';
    supplier.status = newStatus;
    supplier.updatedAt = new Date().toISOString();
    await SupplierRepository.saveSupplier(supplier);
    await ProductRepository.logAudit('UPDATE', 'suppliers', this.id, `تم ${newStatus === 'active' ? 'تنشيط' : 'إيقاف'} المورد: ${supplier.name}`);
  }
}

export class RecordSupplierPaymentCommand implements ICommand<void> {
  constructor(
    private supplierId: string,
    private amount: number,
    private referenceNo: string,
    private notes?: string
  ) {}

  async execute(): Promise<void> {
    if (this.amount <= 0) throw new Error('مبلغ الدفعة يجب أن يكون أكبر من الصفر');
    const supplier = SupplierRepository.getSupplierById(this.supplierId);
    if (!supplier) throw new Error('المورد غير موجود');

    await SupplierRepository.addLedgerEntry({
      supplierId: this.supplierId,
      transactionType: 'PAYMENT',
      referenceNo: this.referenceNo || `PAY-SUPP-${Date.now()}`,
      debit: this.amount, // reduces AP
      credit: 0,
      date: new Date().toISOString(),
      notes: this.notes || 'سداد مستحقات مورد'
    });

    await AccountingService.postSupplierPaymentGL(this.referenceNo, supplier.name, this.amount);
  }
}

// --- Sales Invoice Commands ---
export class CreateSalesInvoiceCommand implements ICommand<SalesInvoice> {
  constructor(private invoiceData: Omit<SalesInvoice, 'id' | 'invoiceNumber' | 'createdAt'>) {}
  async execute(): Promise<SalesInvoice> {
    if (!this.invoiceData.items || this.invoiceData.items.length === 0) {
      throw new Error('الفاتورة يجب أن تحتوي على منتج واحد على الأقل');
    }
    return await SalesRepository.createInvoice(this.invoiceData);
  }
}

// --- Purchase Order & Bill Commands ---
export class CreatePurchaseOrderCommand implements ICommand<PurchaseOrder> {
  constructor(private poData: Omit<PurchaseOrder, 'id' | 'poNumber' | 'createdAt'>) {}
  async execute(): Promise<PurchaseOrder> {
    return await PurchaseRepository.createPurchaseOrder(this.poData);
  }
}

export class CreatePurchaseBillCommand implements ICommand<PurchaseBill> {
  constructor(private billData: Omit<PurchaseBill, 'id' | 'billNumber' | 'createdAt'>) {}
  async execute(): Promise<PurchaseBill> {
    return await PurchaseRepository.createPurchaseBill(this.billData);
  }
}

// --- POS Session Commands ---
export class OpenPOSSessionCommand implements ICommand<POSSession> {
  constructor(
    private terminalId: string,
    private cashierId: string,
    private cashierName: string,
    private openingFloat: number
  ) {}

  async execute(): Promise<POSSession> {
    return await POSRepository.openSession(this.terminalId, this.cashierId, this.cashierName, this.openingFloat);
  }
}

export class ProcessPOSTransactionCommand implements ICommand<SalesInvoice> {
  constructor(
    private sessionId: string,
    private customerId: string | undefined,
    private customerName: string | undefined,
    private items: SalesInvoiceItem[],
    private paymentMethod: 'CASH' | 'CARD' | 'CREDIT' | 'SPLIT',
    private paidAmount?: number
  ) {}

  async execute(): Promise<SalesInvoice> {
    return await POSRepository.recordPOSTransaction(
      this.sessionId,
      this.items,
      this.paymentMethod,
      this.customerId,
      this.customerName,
      this.paidAmount
    );
  }
}

export class ClosePOSSessionCommand implements ICommand<POSSession> {
  constructor(private sessionId: string, private closingCash: number, private notes?: string) {}
  async execute(): Promise<POSSession> {
    return await POSRepository.closeSession(this.sessionId, this.closingCash, this.notes);
  }
}

// --- Inventory Movements & Transfer Commands ---
export class TransferStockCommand implements ICommand<void> {
  constructor(
    private productId: string,
    private fromWarehouseId: string,
    private toWarehouseId: string,
    private quantity: number,
    private notes?: string
  ) {}

  async execute(): Promise<void> {
    await InventoryRepository.transferStock(
      this.productId,
      this.fromWarehouseId,
      this.toWarehouseId,
      this.quantity,
      this.notes
    );
  }
}

// --- Sales Order & Quotation & Return Commands ---
export class CreateQuotationCommand implements ICommand<SalesQuotation> {
  constructor(private quotationData: Omit<SalesQuotation, 'id' | 'quotationNumber' | 'createdAt'>) {}
  async execute(): Promise<SalesQuotation> {
    return await QuotationRepository.createQuotation(this.quotationData);
  }
}

export class ConvertQuotationToInvoiceCommand implements ICommand<string> {
  constructor(private quotationId: string, private warehouseId: string = 'wh_main') {}
  async execute(): Promise<string> {
    return await QuotationRepository.convertToInvoice(this.quotationId, this.warehouseId);
  }
}

export class CreateSalesOrderCommand implements ICommand<SalesOrder> {
  constructor(private orderData: Omit<SalesOrder, 'id' | 'orderNumber' | 'createdAt'>) {}
  async execute(): Promise<SalesOrder> {
    return await SalesOrderRepository.createSalesOrder(this.orderData);
  }
}

export class RecordDeliveryCommand implements ICommand<SalesOrder> {
  constructor(private orderId: string, private items: { productId: string; quantity: number }[]) {}
  async execute(): Promise<SalesOrder> {
    return await SalesOrderRepository.recordDelivery(this.orderId, this.items);
  }
}

export class ProcessSalesReturnCommand implements ICommand<SalesReturn> {
  constructor(private returnData: Omit<SalesReturn, 'id' | 'returnNumber' | 'createdAt'>) {}
  async execute(): Promise<SalesReturn> {
    return await SalesReturnRepository.processReturn(this.returnData);
  }
}

// --- Procurement Commands ---
export class CreatePurchaseRequestCommand implements ICommand<PurchaseRequest> {
  constructor(private prData: Omit<PurchaseRequest, 'id' | 'prNumber' | 'createdAt'>) {}
  async execute(): Promise<PurchaseRequest> {
    return await ProcurementRepository.createPurchaseRequest(this.prData);
  }
}

export class CreateRFQCommand implements ICommand<RFQ> {
  constructor(private rfqData: Omit<RFQ, 'id' | 'rfqNumber' | 'createdAt'>) {}
  async execute(): Promise<RFQ> {
    return await ProcurementRepository.createRFQ(this.rfqData);
  }
}

export class RecordGoodsReceivedCommand implements ICommand<GoodsReceivedNote> {
  constructor(private grnData: Omit<GoodsReceivedNote, 'id' | 'grnNumber' | 'createdAt'>) {}
  async execute(): Promise<GoodsReceivedNote> {
    return await ProcurementRepository.recordGoodsReceived(this.grnData);
  }
}

export class IssueSupplierDebitNoteCommand implements ICommand<SupplierDebitNote> {
  constructor(private noteData: Omit<SupplierDebitNote, 'id' | 'debitNoteNumber' | 'createdAt'>) {}
  async execute(): Promise<SupplierDebitNote> {
    return await ProcurementRepository.issueSupplierDebitNote(this.noteData);
  }
}

export class AdjustStockCommand implements ICommand<void> {
  constructor(
    private productId: string,
    private type: 'IN' | 'OUT' | 'ADJUSTMENT' | 'SCRAP',
    private quantity: number,
    private reason?: string,
    private warehouseId: string = 'wh_main'
  ) {}

  async execute(): Promise<void> {
    const qtyModifier = (this.type === 'OUT' || this.type === 'SCRAP') ? -Math.abs(this.quantity) : Math.abs(this.quantity);
    await InventoryRepository.recordMovement({
      productId: this.productId,
      productName: 'منتج مسجل',
      sku: 'SKU',
      warehouseId: this.warehouseId,
      type: this.type === 'SCRAP' ? 'ADJUSTMENT' : (this.type as any),
      quantity: qtyModifier,
      unitCost: 0,
      notes: this.reason
    });
  }
}
