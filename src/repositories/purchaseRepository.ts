// MARO ERP - Purchase Orders & Bills Repository
import { PurchaseOrder, PurchaseBill, PurchaseBillItem } from '../types/sprint8';
import { MaroSyncEngine } from '../lib/maroSyncEngine';
import { ProductRepository } from './productRepository';
import { SupplierRepository } from './supplierRepository';
import { InventoryRepository } from './inventoryRepository';
import { AccountingService } from '../services/accountingService';
import { MaroEventBus } from '../lib/eventBus';

const PO_COLLECTION = 'purchase_orders';
const BILL_COLLECTION = 'purchase_bills';

export class PurchaseRepository {
  // --- Purchase Orders ---
  static getPurchaseOrders(): PurchaseOrder[] {
    return MaroSyncEngine.getLocalCollection<PurchaseOrder>(PO_COLLECTION)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  static async createPurchaseOrder(poData: Omit<PurchaseOrder, 'id' | 'poNumber' | 'createdAt'>): Promise<PurchaseOrder> {
    const pos = this.getPurchaseOrders();
    const poNumber = `PO-2026-${String(pos.length + 1).padStart(5, '0')}`;
    const id = `po_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;
    const createdAt = new Date().toISOString();

    const totalAmount = poData.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);

    const po: PurchaseOrder = {
      ...poData,
      id,
      poNumber,
      totalAmount,
      status: poData.status || 'SUBMITTED',
      createdAt,
      updatedAt: createdAt
    };

    await MaroSyncEngine.saveDocument(PO_COLLECTION, po, true);
    await ProductRepository.logAudit('CREATE', PO_COLLECTION, id, poNumber);
    return po;
  }

  // --- Purchase Bills ---
  static getPurchaseBills(): PurchaseBill[] {
    return MaroSyncEngine.getLocalCollection<PurchaseBill>(BILL_COLLECTION)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  static async createPurchaseBill(billData: Omit<PurchaseBill, 'id' | 'billNumber' | 'createdAt'>): Promise<PurchaseBill> {
    const bills = this.getPurchaseBills();
    const billNumber = `BILL-2026-${String(bills.length + 1).padStart(5, '0')}`;
    const id = `bill_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;
    const createdAt = new Date().toISOString();

    let totalUntaxed = 0;
    let totalTax = 0;

    const items: PurchaseBillItem[] = billData.items.map(item => {
      const lineUntaxed = item.quantity * item.unitCost;
      const lineTax = lineUntaxed * ((item.taxRate || 14) / 100);
      const lineTotal = lineUntaxed + lineTax;

      totalUntaxed += lineUntaxed;
      totalTax += lineTax;

      return {
        ...item,
        id: item.id || `bitem_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        lineTotal
      };
    });

    const grandTotal = totalUntaxed + totalTax;
    const paidAmount = billData.paidAmount || 0;
    const dueAmount = grandTotal - paidAmount;

    let status = billData.status || 'APPROVED';
    if (dueAmount <= 0) status = 'PAID';
    else if (paidAmount > 0) status = 'PARTIALLY_PAID';

    const fullBill: PurchaseBill = {
      ...billData,
      id,
      billNumber,
      items,
      totalUntaxed,
      totalTax,
      grandTotal,
      paidAmount,
      dueAmount,
      status,
      createdAt,
      updatedAt: createdAt
    };

    // 1. Save Purchase Bill
    await MaroSyncEngine.saveDocument(BILL_COLLECTION, fullBill, true);

    // 2. Stock Movement & Inventory Addition + Cost Price Update
    for (const item of items) {
      await InventoryRepository.recordMovement({
        productId: item.productId,
        productName: item.productName,
        sku: item.sku,
        warehouseId: billData.warehouseId,
        type: 'PURCHASE',
        quantity: item.quantity,
        unitCost: item.unitCost,
        referenceId: id,
        referenceNo: billNumber,
        notes: `شراء بموجب فاتورة مورد رقم ${billNumber}`
      });

      // Update product cost price
      await ProductRepository.updateProduct(item.productId, {
        costPrice: item.unitCost
      });
    }

    // 3. Supplier Ledger Entry
    if (billData.supplierId) {
      await SupplierRepository.addLedgerEntry({
        supplierId: billData.supplierId,
        transactionType: 'PURCHASE_BILL',
        referenceNo: billNumber,
        credit: grandTotal, // increases payable
        debit: paidAmount,  // decreases payable
        date: createdAt,
        notes: `فاتورة شراء ${billNumber}`
      });
    }

    // 4. Automated Double-Entry GL Journal Posting
    await AccountingService.postPurchaseBillGL(
      billNumber,
      billData.supplierName || 'مورد عام',
      grandTotal,
      totalUntaxed,
      totalTax,
      paidAmount > 0 && dueAmount === 0
    );

    // 5. Audit Log & Event Bus
    await ProductRepository.logAudit('CREATE', BILL_COLLECTION, id, billNumber);
    await MaroEventBus.publish('PurchaseApproved', { id, billNumber, grandTotal });

    return fullBill;
  }
}
