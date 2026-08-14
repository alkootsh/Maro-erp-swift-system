// MARO ERP - WhatsApp & Email Notifications & Inbound Merchant Orders Types
import { SalesInvoice, PurchaseBill, Customer, Supplier } from './sprint8';

export type AlertFrequency = 
  | 'REALTIME' 
  | 'HOURLY' 
  | 'DAILY_MORNING' 
  | 'DAILY_EVENING' 
  | 'WEEKLY' 
  | 'MONTHLY' 
  | 'CUSTOM_TIME';

export type AlertSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'INFO';

export type DeliveryChannel = 'WHATSAPP' | 'EMAIL' | 'SMS' | 'IN_APP';

export type AlertCategory = 
  | 'DAILY_SALES_PROFIT'          // ملخص المبيعات والأرباح اليومية
  | 'LOW_STOCK_REPLENISHMENT'     // تنبيه نواقص المخزون والحد الأدنى
  | 'CASH_DRAWER_CLOSING'         // جرد وإقفال الخزينة والوردية
  | 'CUSTOMER_DEBT_OVERDUE'       // تحصيل مديونيات العملاء والتجار
  | 'EXPIRY_DATES_ALERT'          // تواريخ الصلاحية والتشغيلات
  | 'LARGE_TRANSACTION_ALERT'     // العمليات الكبرى ومرتجعات المبيعات
  | 'SUPPLIER_PAYMENT_DUE'        // مستحقات الموردين ومواعيد السداد
  | 'CUSTOM_ANNOUNCEMENT';        // تعاميم وتنبيهات مخصصة

export type TargetAudienceType = 
  | 'GENERAL_MANAGER'     // المدير العام
  | 'BRANCH_MANAGERS'    // مدراء الفروع
  | 'MERCHANTS'           // التجار والعملاء
  | 'SUPPLIERS'           // الموردين
  | 'ACCOUNTANTS'         // المحاسبين
  | 'CUSTOM_RECIPIENTS';  // أرقام وعناوين مخصصة

export interface AlertRecipient {
  name: string;
  phone: string;
  email?: string;
  role: string;
  branchName?: string;
}

export interface PeriodicAlertRule {
  id: string;
  title: string;
  category: AlertCategory;
  frequency: AlertFrequency;
  customTime?: string; // e.g. "09:00", "23:00"
  severity: AlertSeverity;
  channels: DeliveryChannel[];
  targetAudience: TargetAudienceType;
  recipients: AlertRecipient[];
  isActive: boolean;
  autoDispatchEnabled: boolean;
  lastTriggeredAt?: string;
  lastStatus?: 'SUCCESS' | 'FAILED' | 'PENDING';
  templateFormat?: string;
  notes?: string;
}

export interface ParsedMerchantOrderItem {
  productId?: string;
  productName: string;
  matchedSku?: string;
  quantity: number;
  unit: string; // كرتونة، علبة، قطعة، كجم، متر، زوج
  unitMultiplier: number;
  unitPrice: number;
  costPrice: number;
  subtotal: number;
  availableStock: number;
  isStockSufficient: boolean;
  confidence: number; // 0 - 100%
  attributes?: Record<string, string>; // e.g. { size: 'XL', color: 'Black' }
}

export type MerchantOrderStatus = 
  | 'PENDING_REVIEW' 
  | 'PARSED' 
  | 'CONVERTED_TO_SALES_INVOICE' 
  | 'CONVERTED_TO_PURCHASE_ORDER' 
  | 'REJECTED';

export interface MerchantWhatsAppOrder {
  id: string;
  orderNumber: string;
  merchantName: string;
  merchantPhone: string;
  merchantType: 'CUSTOMER_MERCHANT' | 'SUPPLIER_VENDOR';
  rawMessage: string;
  receivedAt: string;
  status: MerchantOrderStatus;
  channel: 'WHATSAPP' | 'TELEGRAM' | 'EMAIL' | 'SMS';
  parsedItems: ParsedMerchantOrderItem[];
  estimatedUntaxed: number;
  estimatedTax: number;
  estimatedGrandTotal: number;
  warehouseId?: string;
  warehouseName?: string;
  paymentTerms?: 'CASH' | 'CREDIT' | 'SPLIT';
  convertedDocumentId?: string;
  convertedDocumentNumber?: string;
  convertedDocumentType?: 'SALES_INVOICE' | 'PURCHASE_BILL';
  convertedAt?: string;
  customerBalanceBefore?: number;
  customerBalanceAfter?: number;
  confirmationReplySent?: boolean;
  confirmationReplyText?: string;
  notes?: string;
}

export interface NotificationDispatchLog {
  id: string;
  timestamp: string;
  channel: DeliveryChannel;
  recipientName: string;
  recipientContact: string; // Phone or Email
  categoryOrDoc: string;
  title: string;
  messagePreview: string;
  status: 'SENT' | 'DELIVERED' | 'QUEUED' | 'FAILED';
  externalRef?: string;
  directWhatsAppUrl?: string;
  errorReason?: string;
}

export interface WhatsAppGatewaySettings {
  provider: 'WHATSAPP_WEB_DIRECT' | 'META_CLOUD_API' | 'TWILIO_WHATSAPP' | 'ULTRAMSG' | 'GREEN_API';
  apiUrl?: string;
  apiKey?: string;
  senderPhoneNumber: string;
  webhookSecret?: string;
  autoReplyConfirmation: boolean;
  defaultSalesTemplate: string;
  defaultPurchaseTemplate: string;
  defaultDebtReminderTemplate: string;
  defaultDailyReportTemplate: string;
  emailSmtpHost?: string;
  emailSenderAddress?: string;
}
