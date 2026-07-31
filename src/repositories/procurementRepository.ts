// MARO ERP - Procurement Repository (PR, RFQ, GRN & Supplier Debit Notes)
import {
  PurchaseRequest,
  RFQ,
  GoodsReceivedNote,
  SupplierDebitNote,
  PurchaseBill
} from '../types/sprint8';
import { MaroSyncEngine } from '../lib/maroSyncEngine';
import { ProductRepository } from './productRepository';
import { InventoryRepository } from './inventoryRepository';
import { SupplierRepository } from './supplierRepository';
import { AccountingService } from '../services/accountingService';
import { MaroEventBus } from '../lib/eventBus';

const PR_COLLECTION = 'purchase_requests';
const RFQ_COLLECTION = 'rfqs';
const GRN_COLLECTION = 'goods_received_notes';
const DEBIT_NOTE_COLLECTION = 'supplier_debit_notes';

export class ProcurementRepository {
  // --- Purchase Requests ---
  static getPurchaseRequests(): PurchaseRequest[] {
    return MaroSyncEngine.getLocalCollection<PurchaseRequest>(PR_COLLECTION)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  static async createPurchaseRequest(prData: Omit<PurchaseRequest, 'id' | 'prNumber' | 'createdAt'>): Promise<PurchaseRequest> {
    const list = this.getPurchaseRequests();
    const prNumber = `PR-2026-${String(list.length + 1).padStart(5, '0')}`;
    const id = `pr_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;
    const createdAt = new Date().toISOString();

    const totalEstimatedAmount = prData.items.reduce((sum, item) => sum + (item.requestedQty * item.estimatedUnitPrice), 0);

    const pr: PurchaseRequest = {
      ...prData,
      id,
      prNumber,
      totalEstimatedAmount,
      status: prData.status || 'SUBMITTED',
      createdAt
    };

    await MaroSyncEngine.saveDocument(PR_COLLECTION, pr, true);
    await ProductRepository.logAudit('CREATE', PR_COLLECTION, id, prNumber);
    return pr;
  }

  // --- Requests for Quotation (RFQ) ---
  static getRFQs(): RFQ[] {
    return MaroSyncEngine.getLocalCollection<RFQ>(RFQ_COLLECTION)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  static async createRFQ(rfqData: Omit<RFQ, 'id' | 'rfqNumber' | 'createdAt'>): Promise<RFQ> {
    const list = this.getRFQs();
    const rfqNumber = `RFQ-2026-${String(list.length + 1).padStart(5, '0')}`;
    const id = `rfq_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;
    const createdAt = new Date().toISOString();

    const rfq: RFQ = {
      ...rfqData,
      id,
      rfqNumber,
      status: 'OPEN',
      createdAt
    };

    await MaroSyncEngine.saveDocument(RFQ_COLLECTION, rfq, true);
    await ProductRepository.logAudit('CREATE', RFQ_COLLECTION, id, rfqNumber);
    return rfq;
  }

  // --- Goods Received Notes (GRN) ---
  static getGRNs(): GoodsReceivedNote[] {
    return MaroSyncEngine.getLocalCollection<GoodsReceivedNote>(GRN_COLLECTION)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  static async recordGoodsReceived(grnData: Omit<GoodsReceivedNote, 'id' | 'grnNumber' | 'createdAt'>): Promise<GoodsReceivedNote> {
    const list = this.getGRNs();
    const grnNumber = `GRN-2026-${String(list.length + 1).padStart(5, '0')}`;
    const id = `grn_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;
    const createdAt = new Date().toISOString();

    const grn: GoodsReceivedNote = {
      ...grnData,
      id,
      grnNumber,
      status: 'COMPLETED',
      createdAt
    };

    await MaroSyncEngine.saveDocument(GRN_COLLECTION, grn, true);

    // Increase Stock in Warehouse for verified received items
    for (const item of grn.items) {
      if (item.receivedQty > 0) {
        await InventoryRepository.recordMovement({
          productId: item.productId,
          productName: item.productName,
          sku: item.sku,
          warehouseId: grn.warehouseId,
          type: 'PURCHASE',
          quantity: item.receivedQty,
          unitCost: 0, // Cost updated upon bill creation
          referenceId: id,
          referenceNo: grnNumber,
          batchNumber: item.batchNumber,
          notes: `استلام بضائع بموجب إذن إدخال ${grnNumber} - أمر الشراء: ${grn.poNumber}`
        });
      }
    }

    await ProductRepository.logAudit('CREATE', GRN_COLLECTION, id, grnNumber);
    await MaroEventBus.publish('InventoryMoved', { id, grnNumber, warehouseId: grn.warehouseId });
    return grn;
  }

  // --- Supplier Debit Notes ---
  static getDebitNotes(): SupplierDebitNote[] {
    return MaroSyncEngine.getLocalCollection<SupplierDebitNote>(DEBIT_NOTE_COLLECTION)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  static async issueSupplierDebitNote(noteData: Omit<SupplierDebitNote, 'id' | 'debitNoteNumber' | 'createdAt'>): Promise<SupplierDebitNote> {
    const list = this.getDebitNotes();
    const debitNoteNumber = `DN-2026-${String(list.length + 1).padStart(5, '0')}`;
    const id = `dn_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;
    const createdAt = new Date().toISOString();

    const debitNote: SupplierDebitNote = {
      ...noteData,
      id,
      debitNoteNumber,
      status: 'APPROVED',
      createdAt
    };

    await MaroSyncEngine.saveDocument(DEBIT_NOTE_COLLECTION, debitNote, true);

    // Update Supplier Ledger (reduce AP owed to supplier)
    if (noteData.supplierId) {
      await SupplierRepository.addLedgerEntry({
        supplierId: noteData.supplierId,
        transactionType: 'DEBIT_NOTE',
        referenceNo: debitNoteNumber,
        debit: noteData.amount, // reduces payable
        credit: 0,
        date: createdAt,
        notes: `إشعار خصم للمورد ${debitNoteNumber} - السبب: ${noteData.reason}`
      });
    }

    await AccountingService.postSupplierPaymentGL(debitNoteNumber, noteData.supplierName, noteData.amount);
    await ProductRepository.logAudit('CREATE', DEBIT_NOTE_COLLECTION, id, debitNoteNumber);

    return debitNote;
  }
}
