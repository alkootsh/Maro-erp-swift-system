/**
 * @file sprint8.ts
 * @module تعريفات الأنواع والبيانات (TypeScript Types)
 * @description ملف جزء من نظام MARO ERP. الوظيفة: sprint8.ts.
 */
// MARO ERP - Sprint 8 Enterprise Types Specification

export interface Customer {
  id: string;
  name: string;
  code?: string;
  phone?: string;
  email?: string;
  taxNumber?: string;
  creditLimit: number;
  creditDays: number;
  priceListId: string; // 'RETAIL' | 'WHOLESALE' | 'DISTRIBUTOR'
  currentBalance: number; // Accounts Receivable balance
  status: 'active' | 'inactive';
  address?: string;
  city?: string;
  deliveryLocationLink?: string;
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
  id?: string;
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
  paymentMethod: 'CASH' | 'CARD' | 'CREDIT' | 'SPLIT' | 'BANK';
  status: SalesInvoiceStatus;
  notes?: string;
  previousBalance?: number;
  currentBalance?: number;
  customerCreditLimit?: number;
  creditStatus?: string;
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
  notes?: string;
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
  treasuryId?: string;
  treasuryName?: string;
  warehouseId?: string;
  warehouseName?: string;
}

export interface InventoryMovement {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  warehouseId: string;
  warehouseName?: string;
  type: 'PURCHASE' | 'SALE' | 'TRANSFER' | 'ADJUSTMENT' | 'RETURN' | 'OPENING_BALANCE';
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

// --- Extended Sprint 8 Types: Quotations, Orders, Returns, GRNs, Pricing & Barcodes ---

export type QuotationStatus = 'DRAFT' | 'SENT' | 'ACCEPTED' | 'REJECTED' | 'CONVERTED';
export type SalesOrderStatus = 'DRAFT' | 'CONFIRMED' | 'PARTIALLY_DELIVERED' | 'DELIVERED' | 'CANCELLED';
export type DeliveryStatus = 'PENDING' | 'SHIPPED' | 'PARTIAL' | 'DELIVERED';

export interface SalesQuotationItem {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  unitName: string;
  quantity: number;
  unitPrice: number;
  discountPercent: number;
  taxRate: number;
  lineTotal: number;
}

export interface SalesQuotation {
  id: string;
  quotationNumber: string; // e.g. QT-2026-00001
  customerId: string;
  customerName: string;
  validUntil: string;
  items: SalesQuotationItem[];
  totalUntaxed: number;
  totalTax: number;
  grandTotal: number;
  status: QuotationStatus;
  notes?: string;
  convertedInvoiceId?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface SalesOrderItem {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  unitName: string;
  orderedQty: number;
  deliveredQty: number;
  unitPrice: number;
  taxRate: number;
  lineTotal: number;
}

export interface SalesOrder {
  id: string;
  orderNumber: string; // e.g. SO-2026-00001
  quotationId?: string;
  customerId: string;
  customerName: string;
  branchId: string;
  warehouseId: string;
  items: SalesOrderItem[];
  grandTotal: number;
  orderStatus: SalesOrderStatus;
  deliveryStatus: DeliveryStatus;
  paymentStatus: 'UNPAID' | 'PARTIAL' | 'PAID';
  createdAt: string;
  updatedAt?: string;
}

export interface SalesReturnItem {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  refundAmount: number;
  reason: string;
}

export interface SalesReturn {
  id: string;
  returnNumber: string; // e.g. SR-2026-00001
  invoiceId: string;
  invoiceNumber: string;
  customerId: string;
  customerName: string;
  warehouseId: string;
  items: SalesReturnItem[];
  totalRefundAmount: number;
  status: 'PENDING_APPROVAL' | 'APPROVED' | 'COMPLETED' | 'REJECTED';
  notes?: string;
  createdAt: string;
}

export interface PurchaseRequestItem {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  requestedQty: number;
  estimatedUnitPrice: number;
}

export interface PurchaseRequest {
  id: string;
  prNumber: string; // e.g. PR-2026-00001
  department: string;
  requesterName: string;
  items: PurchaseRequestItem[];
  totalEstimatedAmount: number;
  status: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED';
  approvedBy?: string;
  createdAt: string;
}

export interface RFQSupplierResponse {
  supplierId: string;
  supplierName: string;
  quotedTotal: number;
  deliveryDays: number;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
}

export interface RFQ {
  id: string;
  rfqNumber: string; // e.g. RFQ-2026-00001
  prId?: string;
  items: PurchaseRequestItem[];
  supplierResponses: RFQSupplierResponse[];
  status: 'OPEN' | 'EVALUATING' | 'AWARDED' | 'CLOSED';
  createdAt: string;
}

export interface GoodsReceivedNoteItem {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  orderedQty: number;
  receivedQty: number;
  rejectedQty: number;
  batchNumber?: string;
  expiryDate?: string;
}

export interface GoodsReceivedNote {
  id: string;
  grnNumber: string; // e.g. GRN-2026-00001
  poId: string;
  poNumber: string;
  supplierId: string;
  supplierName: string;
  warehouseId: string;
  items: GoodsReceivedNoteItem[];
  receivedBy: string;
  status: 'DRAFT' | 'VERIFIED' | 'COMPLETED';
  notes?: string;
  createdAt: string;
}

export interface SupplierDebitNote {
  id: string;
  debitNoteNumber: string; // e.g. DN-2026-00001
  billId: string;
  billNumber: string;
  supplierId: string;
  supplierName: string;
  amount: number;
  reason: string;
  status: 'APPROVED' | 'SETTLED';
  createdAt: string;
}

export interface PriceListTier {
  minQuantity: number;
  unitPrice: number;
}

export interface PriceListItem {
  productId: string;
  price: number;
  tiers?: PriceListTier[];
}

export interface PriceList {
  id: string;
  name: string; // e.g. 'RETAIL' | 'WHOLESALE' | 'VIP' | 'CONTRACT'
  type: 'RETAIL' | 'WHOLESALE' | 'VIP' | 'CONTRACT';
  currency: string;
  isDefault?: boolean;
  items: PriceListItem[];
}

export interface PromotionRule {
  id: string;
  code: string;
  name: string;
  type: 'PERCENTAGE_DISCOUNT' | 'FIXED_AMOUNT' | 'BUY_X_GET_Y' | 'BUNDLE_COMBO';
  discountValue: number;
  minPurchaseAmount?: number;
  applicableProductIds?: string[];
  startDate: string;
  endDate: string;
  isActive: boolean;
}

export interface BarcodeMapping {
  barcode: string;
  productId: string;
  sku: string;
  unitName: string;
  type: 'EAN13' | 'EAN8' | 'UPC' | 'CODE128' | 'GS1' | 'QR' | 'DATAMATRIX' | 'WEIGHT_SCALE';
}

export interface ScaleBarcodeConfig {
  prefix: string; // e.g. '21' or '27'
  itemCodeLength: number; // e.g. 5 digits
  valueType: 'WEIGHT_KG' | 'PRICE_TOTAL';
  valueLength: number; // e.g. 5 digits
  decimalPlaces: number; // e.g. 3 for kg, 2 for price
}

export interface CreditCheckResult {
  allowed: boolean;
  customerId: string;
  creditLimit: number;
  currentBalance: number;
  requestedAmount: number;
  projectedBalance: number;
  exceededAmount: number;
  reason?: string;
}

// --- Event Bus Event Schema ---
export interface MaroEvent {
  id: string;
  type: string;
  timestamp: string;
  payload: Record<string, any>;
}

