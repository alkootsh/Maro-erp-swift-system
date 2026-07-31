// MARO ERP - Customer & Customer Ledger Repository
import { Customer, CustomerLedger } from '../types/sprint8';
import { MaroSyncEngine } from '../lib/maroSyncEngine';
import { ProductRepository } from './productRepository';
import { MaroEventBus } from '../lib/eventBus';

const CUSTOMER_COLLECTION = 'customers';
const LEDGER_COLLECTION = 'customer_ledger';

export class CustomerRepository {
  static getCustomers(): Customer[] {
    return MaroSyncEngine.getLocalCollection<Customer>(CUSTOMER_COLLECTION);
  }

  static getCustomerById(id: string): Customer | null {
    return MaroSyncEngine.getLocalDocument<Customer>(CUSTOMER_COLLECTION, id);
  }

  static async saveCustomer(customerData: Omit<Customer, 'id' | 'createdAt'> & { id?: string }): Promise<string> {
    const isNew = !customerData.id;
    const id = customerData.id || `cust_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;
    
    const customer: Customer = {
      ...customerData,
      id,
      currentBalance: customerData.currentBalance || 0,
      creditLimit: customerData.creditLimit || 0,
      creditDays: customerData.creditDays || 0,
      priceListId: customerData.priceListId || 'RETAIL',
      status: customerData.status || 'active',
      createdAt: isNew ? new Date().toISOString() : (this.getCustomerById(id)?.createdAt || new Date().toISOString()),
      updatedAt: new Date().toISOString()
    };

    await MaroSyncEngine.saveDocument(CUSTOMER_COLLECTION, customer, isNew);
    await ProductRepository.logAudit(isNew ? 'CREATE' : 'UPDATE', CUSTOMER_COLLECTION, id, customer.name);

    if (isNew) {
      await MaroEventBus.publish('ProductCreated', { type: 'CustomerCreated', id, name: customer.name });
    }

    return id;
  }

  static async deleteCustomer(id: string, name?: string): Promise<void> {
    await MaroSyncEngine.deleteDocument(CUSTOMER_COLLECTION, id);
    await ProductRepository.logAudit('DELETE', CUSTOMER_COLLECTION, id, name || id);
  }

  static getLedger(customerId: string): CustomerLedger[] {
    const all = MaroSyncEngine.getLocalCollection<CustomerLedger>(LEDGER_COLLECTION);
    return all.filter(l => l.customerId === customerId).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  static async addLedgerEntry(entry: Omit<CustomerLedger, 'id' | 'createdAt' | 'balanceAfter'>): Promise<CustomerLedger> {
    const customer = this.getCustomerById(entry.customerId);
    if (!customer) throw new Error(`العميل المحدد غير موجود (ID: ${entry.customerId})`);

    const netChange = (entry.debit || 0) - (entry.credit || 0);
    const newBalance = (customer.currentBalance || 0) + netChange;

    // Check Credit Limit Warning
    if (customer.creditLimit > 0 && entry.debit > 0 && newBalance > customer.creditLimit) {
      console.warn(`[MARO Credit Warning] العميل ${customer.name} تجاوز الحد الائتماني (الرصيد: ${newBalance}, الحد: ${customer.creditLimit})`);
    }

    // Update Customer Balance
    customer.currentBalance = newBalance;
    await MaroSyncEngine.saveDocument(CUSTOMER_COLLECTION, customer, false);

    const ledger: CustomerLedger = {
      ...entry,
      id: `cledg_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`,
      customerName: customer.name,
      balanceAfter: newBalance,
      createdAt: new Date().toISOString()
    };

    await MaroSyncEngine.saveDocument(LEDGER_COLLECTION, ledger, true);
    return ledger;
  }
}
