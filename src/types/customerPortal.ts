// MARO ERP - Customer & Merchant B2B Ordering Portal Types
export type PortalOrderStatus = 
  | 'PENDING_REVIEW' 
  | 'APPROVED' 
  | 'PREPARING' 
  | 'DISPATCHED' 
  | 'CONVERTED_TO_INVOICE' 
  | 'CANCELLED';

export type PortalPaymentMethod = 
  | 'COD' 
  | 'CREDIT_ACCOUNT' 
  | 'BANK_TRANSFER' 
  | 'E_WALLET';

export interface CustomerPortalOrderItem {
  productId: string;
  productName: string;
  sku: string;
  barcode?: string;
  unitName: string; // e.g. 'قطعة' | 'كرتونة' | 'باكت' | 'دستة'
  unitMultiplier: number; // multiplier for pieces (e.g. 1 for piece, 12 for dozen, 24 for carton)
  quantity: number; // entered quantity in selected unit
  totalPieces: number; // quantity * unitMultiplier
  unitPrice: number; // price per selected unit
  originalPrice?: number;
  discountPercent?: number;
  taxRate: number; // 14% VAT
  lineTotal: number;
  notes?: string;
}

export interface CustomerPortalOrder {
  id: string;
  orderNumber: string; // e.g. 'WEB-2026-0001'
  customerId?: string; // matched customer id if registered
  customerName: string;
  phone: string;
  email?: string;
  deliveryAddress: string;
  city?: string;
  preferredDeliveryDate?: string;
  preferredDeliveryTime?: string;
  paymentMethod: PortalPaymentMethod;
  items: CustomerPortalOrderItem[];
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  shippingCost: number;
  grandTotal: number;
  status: PortalOrderStatus;
  customerNotes?: string;
  adminNotes?: string;
  source: 'CUSTOMER_PORTAL' | 'QR_CODE' | 'WHATSAPP_LINK' | 'REP_APP';
  convertedInvoiceId?: string;
  convertedInvoiceNumber?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PortalStoreSettings {
  storeName: string;
  storeSubtitle: string;
  hotlinePhone: string;
  whatsappPhone: string;
  address: string;
  currency: string;
  defaultTaxRate: number; // 14
  minOrderValue: number;
  allowCreditOrders: boolean;
  enableSoundAlerts: boolean;
  welcomeMessageAr: string;
  deliveryFee: number;
  freeDeliveryThreshold: number;
}
