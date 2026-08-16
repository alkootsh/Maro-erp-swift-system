/**
 * @file supplierRepository.ts
 * @module طبقة التعامل مع البيانات (Data Repositories)
 * @description ملف جزء من نظام MARO ERP. الوظيفة: supplierRepository.ts.
 */
// MARO ERP - Supplier & Supplier Ledger Repository
import { Supplier, SupplierLedger } from '../types/sprint8';
import { MaroSyncEngine } from '../lib/maroSyncEngine';
import { ProductRepository } from './productRepository';
import { MaroEventBus } from '../lib/eventBus';

const SUPPLIER_COLLECTION = 'suppliers';
const LEDGER_COLLECTION = 'supplier_ledger';

export class SupplierRepository {
  static getSuppliers(): Supplier[] {
    return MaroSyncEngine.getLocalCollection<Supplier>(SUPPLIER_COLLECTION);
  }

  static getSupplierById(id: string): Supplier | null {
    return MaroSyncEngine.getLocalDocument<Supplier>(SUPPLIER_COLLECTION, id);
  }

  static async saveSupplier(supplierData: Omit<Supplier, 'id' | 'createdAt'> & { id?: string }): Promise<string> {
    const isNew = !supplierData.id;
    const id = supplierData.id || `supp_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;
    
    const supplier: Supplier = {
      ...supplierData,
      id,
      currentBalance: supplierData.currentBalance || 0,
      paymentTerms: supplierData.paymentTerms || 'NET30',
      status: supplierData.status || 'active',
      createdAt: isNew ? new Date().toISOString() : (this.getSupplierById(id)?.createdAt || new Date().toISOString()),
      updatedAt: new Date().toISOString()
    };

    await MaroSyncEngine.saveDocument(SUPPLIER_COLLECTION, supplier, isNew);
    await ProductRepository.logAudit(isNew ? 'CREATE' : 'UPDATE', SUPPLIER_COLLECTION, id, supplier.name);

    if (isNew) {
      await MaroEventBus.publish('ProductCreated', { type: 'SupplierCreated', id, name: supplier.name });
    }

    return id;
  }

  static async deleteSupplier(id: string, name?: string): Promise<void> {
    await MaroSyncEngine.deleteDocument(SUPPLIER_COLLECTION, id);
    await ProductRepository.logAudit('DELETE', SUPPLIER_COLLECTION, id, name || id);
  }

  static getLedger(supplierId: string): SupplierLedger[] {
    const all = MaroSyncEngine.getLocalCollection<SupplierLedger>(LEDGER_COLLECTION);
    return all.filter(l => l.supplierId === supplierId).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  static async addLedgerEntry(entry: Omit<SupplierLedger, 'id' | 'createdAt' | 'balanceAfter'>): Promise<SupplierLedger> {
    const supplier = this.getSupplierById(entry.supplierId);
    if (!supplier) throw new Error(`المورد المحدد غير موجود (ID: ${entry.supplierId})`);

    // Credit increases payable, debit decreases payable
    const netChange = (entry.credit || 0) - (entry.debit || 0);
    const newBalance = (supplier.currentBalance || 0) + netChange;

    supplier.currentBalance = newBalance;
    await MaroSyncEngine.saveDocument(SUPPLIER_COLLECTION, supplier, false);

    const ledger: SupplierLedger = {
      ...entry,
      id: `sledg_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`,
      supplierName: supplier.name,
      balanceAfter: newBalance,
      createdAt: new Date().toISOString()
    };

    await MaroSyncEngine.saveDocument(LEDGER_COLLECTION, ledger, true);
    return ledger;
  }
}
