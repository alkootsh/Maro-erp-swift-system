// MARO ERP - Sprint 8 Enterprise Types Specification

export interface Customer {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  taxNumber?: string;
  creditLimit: number;
  creditDays: number;
  priceListId: string; // 'RETAIL' | 'WHOLESALE' | 'DISTRIBUTOR'
  currentBalance: number; // Accounts Receivable balance
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt?: string;
}

export interface CustomerLedger {
  id: string;
  customerId: string;
  customerName?: string;
  transactionType: 'INVOICE' | 'PAYMENT' | 'CREDIT_NOTE' | 'OPENING_BALANCE';
  referenceNo: string;
  debit: number;  // Increases debt owed by customer
  credit: number; // Decreases debt
  balanceAfter: number;
  date: string;
  notes?: string;
  createdAt: string;
}

export interface Supplier {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  taxNumber?: string;
  paymentTerms: string; // e.g. 'NET30', 'COD', 'NET60'
  currentBalance: number; // Accounts Payable balance
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt?: string;
}

export interface SupplierLedger {
  id: string;
  supplierId: string;
  supplierName?: string;
  transactionType: 'PURCHASE_BILL' | 'PAYMENT' | 'DEBIT_NOTE' | 'OPENING_BALANCE';
  referenceNo: string;
  debit: number;  // Reduces payable balance
  credit: number; // Increases payable balance
  balanceAfter: number;
  date: string;
  notes?: string;
  createdAt: string;
}

export interface SalesInvoiceItem {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  unitName: string;
  quantity: number;
  unitPrice: number;
  costPrice: number;
  discountPercent: number;
  taxRate: number; // e.g. 14%
  lineTotal: number;
}

export type SalesInvoiceType = 'RETAIL' | 'WHOLESALE' | 'POS';
export type SalesInvoiceStatus = 'DRAFT' | 'APPROVED' | 'PAID' | 'PARTIALLY_PAID' | 'CANCELLED';

export interface SalesInvoice {
  id: string;
  invoiceNumber: string;
  type: SalesInvoiceType;
  customerId?: string;
  customerName?: string;
  branchId: string;
  warehouseId: string;
  warehouseName?: string;
  items: SalesInvoiceItem[];
  totalUntaxed: number;
  totalTax: number;
  totalDiscount: number;
  grandTotal: number;
  paidAmount: number;
  dueAmount: number;
  paymentMethod: 'CASH' | 'CARD' | 'CREDIT' | 'SPLIT';
  status: SalesInvoiceStatus;
  notes?: string;
  taxQrCode?: string; // ZATCA / ETA Base64 TLV string
  posSessionId?: string;
  cashierId?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface PurchaseOrderItem {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  unitName: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  supplierId: string;
  supplierName?: string;
  warehouseId: string;
  warehouseName?: string;
  items: PurchaseOrderItem[];
  totalAmount: number;
  status: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'PARTIALLY_RECEIVED' | 'RECEIVED' | 'CANCELLED';
  expectedDeliveryDate?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface PurchaseBillItem {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  unitName: string;
  quantity: number;
  unitCost: number;
  taxRate: number;
  lineTotal: number;
}

export interface PurchaseBill {
  id: string;
  billNumber: string; // e.g. BILL-2026-0001
  vendorInvoiceNumber?: string;
  poId?: string;
  supplierId: string;
  supplierName?: string;
  warehouseId: string;
  warehouseName?: string;
  items: PurchaseBillItem[];
  totalUntaxed: number;
  totalTax: number;
  grandTotal: number;
  paidAmount: number;
  dueAmount: number;
  status: 'DRAFT' | 'APPROVED' | 'PAID' | 'PARTIALLY_PAID';
  dueDate?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface POSSession {
  id: string;
  terminalId: string;
  cashierId: string;
  cashierName?: string;
  openingFloat: number;
  closingCash?: number;
  expectedCash?: number;
  totalSales: number;
  totalTransactions: number;
  variance?: number; // closingCash - expectedCash
  status: 'OPEN' | 'CLOSED';
  notes?: string;
  openedAt: string;
  closedAt?: string;
}

export interface InventoryMovement {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  warehouseId: string;
  warehouseName?: string;
  type: 'PURCHASE' | 'SALE' | 'TRANSFER' | 'ADJUSTMENT' | 'RETURN';
  quantity: number; // positive for incoming, negative for outgoing
  unitCost: number;
  referenceId?: string; // invoiceId, billId, transferId
  referenceNo?: string;
  batchNumber?: string;
  notes?: string;
  createdAt: string;
}

// --- Chart of Accounts & General Ledger Types ---
export type AccountType = 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE';

export interface Account {
  code: string; // e.g. '11100', '11300', '21100', '41100', '51100'
  name: string;
  type: AccountType;
  balance: number;
}

export interface JournalLine {
  id: string;
  accountCode: string;
  accountName: string;
  debit: number;
  credit: number;
}

export interface JournalEntry {
  id: string;
  entryNumber: string; // e.g. JE-2026-0001
  date: string;
  reference: string; // e.g. INV-2026-001 or BILL-2026-001
  description: string;
  lines: JournalLine[];
  status: 'POSTED' | 'DRAFT';
  createdAt: string;
}

// --- Event Bus Event Schema ---
export interface MaroEvent {
  id: string;
  type: 'ProductCreated' | 'InvoiceCreated' | 'InvoicePosted' | 'PurchaseApproved' | 'PaymentReceived' | 'StockAdjusted' | 'InventoryMoved' | 'BusinessHealthCalculated' | 'POSSessionClosed' | 'POSFunctionKeysUpdated' | 'LICENSE_UPDATED' | 'FEATURE_FLAGS_UPDATED' | 'AUDIT_LOG_ADDED' | 'SECURITY_ALERT_TRIGGERED' | 'MAINTENANCE_MODE_CHANGED' | 'NAVIGATE_INTENT' | 'CREATE_NEW_INVOICE_INTENT';
  timestamp: string;
  payload: Record<string, any>;
}
