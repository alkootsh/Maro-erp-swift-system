// MARO ERP - CQRS Query Handlers (Product, Sales, Purchase, POS, Accounting)
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
import { PricingEngine } from '../services/pricingEngine';
import {
  Customer, CustomerLedger, Supplier, SupplierLedger, SalesInvoice, PurchaseOrder, PurchaseBill, POSSession, InventoryMovement, Account, JournalEntry,
  SalesQuotation, SalesOrder, SalesReturn, PurchaseRequest, RFQ, GoodsReceivedNote, SupplierDebitNote, PriceList
} from '../types/sprint8';
import { MaroSyncEngine } from '../lib/maroSyncEngine';

export interface IQuery<TResult = any> {
  execute(): Promise<TResult>;
}

// --- Product & Inventory Queries ---
export class GetProductQuery implements IQuery<ProductMaster | null> {
  constructor(private productId: string) {}
  async execute(): Promise<ProductMaster | null> {
    return ProductRepository.getProductById(this.productId);
  }
}

export class SearchProductsQuery implements IQuery<ProductMaster[]> {
  constructor(
    private searchTerm: string = '',
    private categoryFilter: string = 'all',
    private statusFilter: string = 'all'
  ) {}

  async execute(): Promise<ProductMaster[]> {
    const allProducts = MaroSyncEngine.getLocalCollection<ProductMaster>('products');
    return allProducts.filter(p => {
      const matchesSearch = !this.searchTerm || 
        p.name.toLowerCase().includes(this.searchTerm.toLowerCase()) || 
        p.sku.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        (p.barcode && p.barcode.includes(this.searchTerm));

      const matchesCategory = this.categoryFilter === 'all' || p.category === this.categoryFilter || p.categoryId === this.categoryFilter;
      const matchesStatus = this.statusFilter === 'all' || p.status === this.statusFilter;

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }
}

export class GetInventoryQuery implements IQuery<{
  totalItems: number;
  totalProductsCount: number;
  totalStockValue: number;
  lowStockCount: number;
  outOfStockCount: number;
  inventoryList: ProductMaster[];
}> {
  async execute() {
    const products = MaroSyncEngine.getLocalCollection<ProductMaster>('products');
    let totalItems = 0;
    let totalStockValue = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;

    products.forEach(p => {
      const qty = Number(p.quantity) || 0;
      const cost = Number(p.costPrice) || Number(p.price) || 0;
      const reorder = Number(p.reorderLevel) || 5;

      totalItems += qty;
      totalStockValue += qty * cost;

      if (qty === 0) outOfStockCount++;
      else if (qty <= reorder) lowStockCount++;
    });

    return {
      totalItems,
      totalProductsCount: products.length,
      totalStockValue,
      lowStockCount,
      outOfStockCount,
      inventoryList: products
    };
  }
}

export class GetWarehousesQuery implements IQuery<WarehouseData[]> {
  async execute(): Promise<WarehouseData[]> {
    return MaroSyncEngine.getLocalCollection<WarehouseData>('warehouses');
  }
}

// --- Customer Queries ---
export class GetCustomersQuery implements IQuery<Customer[]> {
  async execute(): Promise<Customer[]> {
    return CustomerRepository.getCustomers();
  }
}

export class GetCustomerLedgerQuery implements IQuery<CustomerLedger[]> {
  constructor(private customerId: string) {}
  async execute(): Promise<CustomerLedger[]> {
    return CustomerRepository.getLedger(this.customerId);
  }
}

// --- Supplier Queries ---
export class GetSuppliersQuery implements IQuery<Supplier[]> {
  async execute(): Promise<Supplier[]> {
    return SupplierRepository.getSuppliers();
  }
}

export class GetSupplierLedgerQuery implements IQuery<SupplierLedger[]> {
  constructor(private supplierId: string) {}
  async execute(): Promise<SupplierLedger[]> {
    return SupplierRepository.getLedger(this.supplierId);
  }
}

// --- Sales Invoice Queries ---
export class GetSalesInvoicesQuery implements IQuery<SalesInvoice[]> {
  async execute(): Promise<SalesInvoice[]> {
    return SalesRepository.getInvoices();
  }
}

// --- Purchase Order & Bill Queries ---
export class GetPurchaseOrdersQuery implements IQuery<PurchaseOrder[]> {
  async execute(): Promise<PurchaseOrder[]> {
    return PurchaseRepository.getPurchaseOrders();
  }
}

export class GetPurchaseBillsQuery implements IQuery<PurchaseBill[]> {
  async execute(): Promise<PurchaseBill[]> {
    return PurchaseRepository.getPurchaseBills();
  }
}

// --- POS Queries ---
export class GetActivePOSSessionQuery implements IQuery<POSSession | null> {
  constructor(private terminalId = 'TERM-01') {}
  async execute(): Promise<POSSession | null> {
    return POSRepository.getActiveSession(this.terminalId);
  }
}

// --- Inventory Movements Queries ---
export class GetInventoryMovementsQuery implements IQuery<InventoryMovement[]> {
  async execute(): Promise<InventoryMovement[]> {
    return InventoryRepository.getMovements();
  }
}

// --- Sales Quotation, Sales Order & Return Queries ---
export class GetSalesQuotationsQuery implements IQuery<SalesQuotation[]> {
  async execute(): Promise<SalesQuotation[]> {
    return QuotationRepository.getQuotations();
  }
}

export class GetSalesOrdersQuery implements IQuery<SalesOrder[]> {
  async execute(): Promise<SalesOrder[]> {
    return SalesOrderRepository.getSalesOrders();
  }
}

export class GetSalesReturnsQuery implements IQuery<SalesReturn[]> {
  async execute(): Promise<SalesReturn[]> {
    return SalesReturnRepository.getReturns();
  }
}

// --- Procurement Queries ---
export class GetPurchaseRequestsQuery implements IQuery<PurchaseRequest[]> {
  async execute(): Promise<PurchaseRequest[]> {
    return ProcurementRepository.getPurchaseRequests();
  }
}

export class GetRFQsQuery implements IQuery<RFQ[]> {
  async execute(): Promise<RFQ[]> {
    return ProcurementRepository.getRFQs();
  }
}

export class GetGRNsQuery implements IQuery<GoodsReceivedNote[]> {
  async execute(): Promise<GoodsReceivedNote[]> {
    return ProcurementRepository.getGRNs();
  }
}

export class GetSupplierDebitNotesQuery implements IQuery<SupplierDebitNote[]> {
  async execute(): Promise<SupplierDebitNote[]> {
    return ProcurementRepository.getDebitNotes();
  }
}

// --- Pricing Engine Queries ---
export class GetPriceListsQuery implements IQuery<PriceList[]> {
  async execute(): Promise<PriceList[]> {
    return PricingEngine.getPriceLists();
  }
}

// --- Accounting Queries ---
export class GetChartOfAccountsQuery implements IQuery<Account[]> {
  async execute(): Promise<Account[]> {
    return AccountingService.getChartOfAccounts();
  }
}

export class GetJournalEntriesQuery implements IQuery<JournalEntry[]> {
  async execute(): Promise<JournalEntry[]> {
    return AccountingService.getJournalEntries();
  }
}
