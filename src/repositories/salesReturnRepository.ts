// MARO ERP - Sales Returns Repository
import { SalesReturn, SalesReturnItem } from '../types/sprint8';
import { MaroSyncEngine } from '../lib/maroSyncEngine';
import { ProductRepository } from './productRepository';
import { InventoryRepository } from './inventoryRepository';
import { CustomerRepository } from './customerRepository';
import { AccountingService } from '../services/accountingService';
import { MaroEventBus } from '../lib/eventBus';

const SALES_RETURN_COLLECTION = 'sales_returns';

export class SalesReturnRepository {
  static getReturns(): SalesReturn[] {
    return MaroSyncEngine.getLocalCollection<SalesReturn>(SALES_RETURN_COLLECTION)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  static getReturnById(id: string): SalesReturn | null {
    return MaroSyncEngine.getLocalDocument<SalesReturn>(SALES_RETURN_COLLECTION, id);
  }

  static async processReturn(returnData: Omit<SalesReturn, 'id' | 'returnNumber' | 'createdAt'>): Promise<SalesReturn> {
    const list = this.getReturns();
    const returnNumber = `SR-2026-${String(list.length + 1).padStart(5, '0')}`;
    const id = `sr_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;
    const createdAt = new Date().toISOString();

    const totalRefundAmount = returnData.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);

    const salesReturn: SalesReturn = {
      ...returnData,
      id,
      returnNumber,
      totalRefundAmount,
      status: returnData.status || 'APPROVED',
      createdAt
    };

    // 1. Save Return Record
    await MaroSyncEngine.saveDocument(SALES_RETURN_COLLECTION, salesReturn, true);

    // 2. Inventory Restock (Increase Stock)
    for (const item of returnData.items) {
      await InventoryRepository.recordMovement({
        productId: item.productId,
        productName: item.productName,
        sku: item.sku,
        warehouseId: returnData.warehouseId,
        type: 'RETURN',
        quantity: item.quantity, // positive restores stock
        unitCost: item.unitPrice * 0.7,
        referenceId: id,
        referenceNo: returnNumber,
        notes: `مردودات مبيعات بموجب سند ${returnNumber}`
      });
    }

    // 3. Customer Ledger Entry (Reduce customer debt or issue credit)
    if (returnData.customerId) {
      await CustomerRepository.addLedgerEntry({
        customerId: returnData.customerId,
        transactionType: 'CREDIT_NOTE',
        referenceNo: returnNumber,
        debit: 0,
        credit: totalRefundAmount, // reduces customer balance owed
        date: createdAt,
        notes: `مرتجع مبيعات ${returnNumber}`
      });
    }

    // 4. Accounting Entry (Reverse Sales & Restore Stock Inventory GL)
    await AccountingService.postSalesReturnGL(
      returnNumber,
      returnData.customerName || 'عميل عام',
      totalRefundAmount,
      totalRefundAmount * 0.7
    );

    // 5. Audit Log & Event Bus
    await ProductRepository.logAudit('CREATE', SALES_RETURN_COLLECTION, id, returnNumber);
    await MaroEventBus.publish('ReturnProcessed', { id, returnNumber, totalRefundAmount });

    return salesReturn;
  }
}
