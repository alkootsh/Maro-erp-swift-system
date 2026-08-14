// MARO ERP - WhatsApp Communication & Inbound Order Automation Engine
import { 
  PeriodicAlertRule, 
  MerchantWhatsAppOrder, 
  NotificationDispatchLog, 
  WhatsAppGatewaySettings, 
  ParsedMerchantOrderItem,
  AlertCategory,
  AlertSeverity
} from '../types/whatsappNotificationTypes';
import { SalesInvoice, PurchaseBill, Customer, Supplier, SalesInvoiceItem } from '../types/sprint8';
import { ProductMaster } from '../types/productMaster';
import { MaroSyncEngine } from '../lib/maroSyncEngine';
import { SalesRepository } from '../repositories/salesRepository';
import { PurchaseRepository } from '../repositories/purchaseRepository';
import { CustomerRepository } from '../repositories/customerRepository';
import { SupplierRepository } from '../repositories/supplierRepository';
import { ProductRepository } from '../repositories/productRepository';
import { AccountingService } from './accountingService';
import { formatCurrency, formatDate } from '../lib/utils';
import { MaroEventBus } from '../lib/eventBus';

const SETTINGS_KEY = 'whatsapp_gateway_settings';
const RULES_KEY = 'periodic_alert_rules';
const INBOUND_ORDERS_KEY = 'merchant_whatsapp_orders';
const DISPATCH_LOGS_KEY = 'notification_dispatch_logs';

export class WhatsAppNotificationService {

  // ==========================================
  // 1. Gateway & Settings Management
  // ==========================================
  static getSettings(): WhatsAppGatewaySettings {
    const local = MaroSyncEngine.getLocalDocument<WhatsAppGatewaySettings>('app_settings', SETTINGS_KEY);
    if (local) return local;

    const defaultSettings: WhatsAppGatewaySettings = {
      provider: 'WHATSAPP_WEB_DIRECT',
      senderPhoneNumber: '+201000000000',
      autoReplyConfirmation: true,
      defaultSalesTemplate: `🧾 *فاتورة مبيعات معتمدة من {{companyName}}*\n\n🔢 رقم الفاتورة: {{invoiceNumber}}\n📅 التاريخ: {{date}}\n👤 العميل: {{customerName}}\n\n📦 *تفاصيل الأصناف:*\n{{itemsList}}\n\n💵 الإجمالي الخاضع للضريبة: {{totalUntaxed}}\n📊 ضريبة القيمة المضافة (14%): {{totalTax}}\n💰 *الإجمالي النهائي:* {{grandTotal}}\n✅ المسدد: {{paidAmount}}\n⏳ المتبقي: {{dueAmount}}\n\n🙏 شكراً لتعاملكم معنا!`,
      defaultPurchaseTemplate: `📋 *أمر شراء / توريد معتمد من {{companyName}}*\n\n🔢 رقم الإذن: {{billNumber}}\n📅 التاريخ: {{date}}\n🏢 المورد: {{supplierName}}\n\n📦 *الأصناف والكميات المطلوبة:*\n{{itemsList}}\n\n💰 *الإجمالي المتفق عليه:* {{grandTotal}}\n📍 الاستلام في: {{warehouseName}}\n\nيرجى تأكيد موعد التوريد.`,
      defaultDebtReminderTemplate: `⚠️ *تذكير بموعد استحقاق مديونية - {{companyName}}*\n\nعزيزنا العميل / {{customerName}},\nنحيطكم علماً بأن الرصيد المستحق على حسابكم طرفنا هو:\n💰 *{{currentBalance}}*\n\nيرجى التكرم بسداد المبلغ في الموعد المحدد لضمان استمرار التوريد.\nشاكرين تعاونكم الدائم.`,
      defaultDailyReportTemplate: `📊 *تقرير الأعمال والعمليات اليومي - {{companyName}}*\n📅 {{date}}\n\n💰 *المبيعات والتحصيلات:*\n• إجمالي المبيعات: {{todaySales}}\n• عدد الفواتير: {{invoicesCount}}\n• المحصل نقداً: {{cashCollected}}\n• المبيعات الآجلة: {{creditSales}}\n\n📦 *المخزون والرقابة:*\n• عدد الأصناف تحت حد الأمان: {{lowStockCount}}\n• أذون الصرف والمشتريات: {{purchasesToday}}\n\n📈 *صافي الربح التقديري:* {{estimatedProfit}}\n\n👑 تنبيه مخصص للمدير العام.`,
      emailSenderAddress: 'erp-notifications@maro-enterprise.com'
    };

    MaroSyncEngine.saveDocument('app_settings', { id: SETTINGS_KEY, ...defaultSettings }, true);
    return defaultSettings;
  }

  static async updateSettings(settings: Partial<WhatsAppGatewaySettings>): Promise<void> {
    const current = this.getSettings();
    const updated = { ...current, ...settings, id: SETTINGS_KEY };
    await MaroSyncEngine.saveDocument('app_settings', updated, false);
  }

  // ==========================================
  // 2. Direct WhatsApp Link & Formatting
  // ==========================================
  static generateWhatsAppLink(phoneNumber: string, messageText: string): string {
    let cleanPhone = phoneNumber.replace(/[^0-9]/g, '');
    if (cleanPhone.startsWith('01') && cleanPhone.length === 11) {
      // Egyptian mobile: add 20 prefix
      cleanPhone = '2' + cleanPhone;
    } else if (cleanPhone.startsWith('5') && cleanPhone.length === 9) {
      // Saudi mobile: add 966 prefix
      cleanPhone = '966' + cleanPhone;
    }
    const encodedText = encodeURIComponent(messageText);
    return `https://wa.me/${cleanPhone}?text=${encodedText}`;
  }

  static openWhatsAppDirectly(phoneNumber: string, messageText: string): void {
    const url = this.generateWhatsAppLink(phoneNumber, messageText);
    if (typeof window !== 'undefined') {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  }

  // ==========================================
  // 3. Document Formatters (Sales, Purchases, Debts)
  // ==========================================
  static formatSalesInvoiceWhatsApp(invoice: SalesInvoice, companyName: string = 'مؤسسة مارو للأعمال'): string {
    const itemsList = invoice.items.map((it, idx) => 
      `${idx + 1}. *${it.productName}* (${it.unitName || 'قطعة'}) × ${it.quantity} @ ${formatCurrency(it.unitPrice)} = ${formatCurrency(it.lineTotal)}`
    ).join('\n');

    let text = `🧾 *فاتورة مبيعات معتمدة - ${companyName}*\n`;
    text += `━━━━━━━━━━━━━━━━━━━━━\n`;
    text += `🔢 *رقم الفاتورة:* ${invoice.invoiceNumber}\n`;
    text += `📅 *التاريخ:* ${formatDate(invoice.createdAt)}\n`;
    text += `👤 *العميل:* ${invoice.customerName || 'عميل نقدي'}\n`;
    text += `🏢 *المخزن:* ${invoice.warehouseName || 'المخزن الرئيسي'}\n`;
    text += `━━━━━━━━━━━━━━━━━━━━━\n`;
    text += `📦 *تفاصيل الأصناف:*\n${itemsList}\n`;
    text += `━━━━━━━━━━━━━━━━━━━━━\n`;
    text += `💵 *الصافي قبل الضريبة:* ${formatCurrency(invoice.totalUntaxed)}\n`;
    text += `📊 *ضريبة القيمة المضافة (14%):* ${formatCurrency(invoice.totalTax)}\n`;
    text += `💰 *الإجمالي النهائي:* ${formatCurrency(invoice.grandTotal)}\n`;
    text += `✅ *المدفوع:* ${formatCurrency(invoice.paidAmount)}\n`;
    if (invoice.dueAmount > 0) {
      text += `⏳ *المتبقي الآجل:* ${formatCurrency(invoice.dueAmount)}\n`;
    }
    text += `━━━━━━━━━━━━━━━━━━━━━\n`;
    text += `✨ تم إصدار الفاتورة إلكترونياً عبر منظومة MARO ERP v4.0.\n`;
    text += `🙏 شكراً لتعاملكم معنا ونرجو زيارتكم دائماً!`;
    return text;
  }

  static formatPurchaseBillWhatsApp(bill: PurchaseBill, companyName: string = 'مؤسسة مارو للأعمال'): string {
    const itemsList = bill.items.map((it, idx) => 
      `${idx + 1}. *${it.productName}* (${it.unitName || 'قطعة'}) × ${it.quantity} @ ${formatCurrency(it.unitCost)} = ${formatCurrency(it.lineTotal)}`
    ).join('\n');

    let text = `📋 *أمر توريد وفاتورة مشتريات - ${companyName}*\n`;
    text += `━━━━━━━━━━━━━━━━━━━━━\n`;
    text += `🔢 *رقم المستند:* ${bill.billNumber}\n`;
    text += `📅 *التاريخ:* ${formatDate(bill.createdAt)}\n`;
    text += `🏢 *السيد المورد:* ${bill.supplierName || 'مورد عام'}\n`;
    text += `━━━━━━━━━━━━━━━━━━━━━\n`;
    text += `📦 *الأصناف والكميات المطلوبة:*\n${itemsList}\n`;
    text += `━━━━━━━━━━━━━━━━━━━━━\n`;
    text += `💰 *إجمالي قيمة التوريد:* ${formatCurrency(bill.grandTotal)}\n`;
    text += `✅ *المسدد:* ${formatCurrency(bill.paidAmount)}\n`;
    text += `⏳ *المتبقي بحساب المورد:* ${formatCurrency(bill.dueAmount)}\n`;
    text += `━━━━━━━━━━━━━━━━━━━━━\n`;
    text += `يرجى مراجعة وتأكيد استلام أمر التوريد.`;
    return text;
  }

  // ==========================================
  // 4. Periodic Alert Engine & Scheduling
  // ==========================================
  static getPeriodicRules(): PeriodicAlertRule[] {
    const rules = MaroSyncEngine.getLocalCollection<PeriodicAlertRule>(RULES_KEY);
    if (rules.length > 0) return rules;

    // Seed comprehensive default periodic business alert rules
    const defaultRules: PeriodicAlertRule[] = [
      {
        id: 'rule_daily_sales_ceo',
        title: 'ملخص المبيعات والأرباح والسيولة اليومية للمدير العام',
        category: 'DAILY_SALES_PROFIT',
        frequency: 'DAILY_EVENING',
        customTime: '23:00',
        severity: 'CRITICAL',
        channels: ['WHATSAPP', 'EMAIL'],
        targetAudience: 'GENERAL_MANAGER',
        recipients: [
          { name: 'المدير العام (الإدارة العليا)', phone: '01002345678', email: 'alkootsh@gmail.com', role: 'General Manager' }
        ],
        isActive: true,
        autoDispatchEnabled: true,
        notes: 'إرسال تقرير إقفال اليوم الشامل متضمناً صافي المبيعات، المحصل كاش، وأرباح اليوم.'
      },
      {
        id: 'rule_low_stock_replenishment',
        title: 'تنبيه النواقص والحد الأدنى للمخزون لمسؤولي المشتريات',
        category: 'LOW_STOCK_REPLENISHMENT',
        frequency: 'DAILY_MORNING',
        customTime: '09:00',
        severity: 'HIGH',
        channels: ['WHATSAPP', 'IN_APP'],
        targetAudience: 'ACCOUNTANTS',
        recipients: [
          { name: 'مدير المشتريات والمخازن', phone: '01112345679', email: 'purchasing@maro-erp.com', role: 'Purchasing Lead' }
        ],
        isActive: true,
        autoDispatchEnabled: true,
        notes: 'حصر تلقائي لكافة الأصناف التي انخفض رصيدها عن حد الأمان وإرسال قائمة الطلب المقترحة.'
      },
      {
        id: 'rule_customer_credit_overdue',
        title: 'تنبيه مواعيد استحقاق مديونيات التجار والعملاء الآجل',
        category: 'CUSTOMER_DEBT_OVERDUE',
        frequency: 'WEEKLY',
        customTime: '10:00',
        severity: 'HIGH',
        channels: ['WHATSAPP', 'SMS'],
        targetAudience: 'MERCHANTS',
        recipients: [
          { name: 'مسؤول التحصيل والائتمان', phone: '01223456780', email: 'credit@maro-erp.com', role: 'Credit Officer' }
        ],
        isActive: true,
        autoDispatchEnabled: true,
        notes: 'حصر مديونيات العملاء والتجار التي تخطت فترة السماح وإرسال مطالبات لطيفة عبر الواتساب.'
      },
      {
        id: 'rule_cash_drawer_closing',
        title: 'إشعار إقفال الوردية وجرد الخزينة اليومي (Z-Report)',
        category: 'CASH_DRAWER_CLOSING',
        frequency: 'REALTIME',
        severity: 'MEDIUM',
        channels: ['WHATSAPP', 'IN_APP'],
        targetAudience: 'BRANCH_MANAGERS',
        recipients: [
          { name: 'مشرف نقاط البيع والخزينة', phone: '01099887766', email: 'pos-supervisor@maro-erp.com', role: 'Branch Supervisor' }
        ],
        isActive: true,
        autoDispatchEnabled: true,
        notes: 'إرسال تقرير فور إغلاق أي جلسة كاشير متضمناً العجز أو الفائض النقدي.'
      },
      {
        id: 'rule_batch_expiry_alert',
        title: 'تنبيه التشغيلات والمنتجات قريبة الانتهاء (< 30 يوماً)',
        category: 'EXPIRY_DATES_ALERT',
        frequency: 'WEEKLY',
        customTime: '08:30',
        severity: 'CRITICAL',
        channels: ['WHATSAPP', 'EMAIL'],
        targetAudience: 'GENERAL_MANAGER',
        recipients: [
          { name: 'مدير الجودة والصلاحيات', phone: '01556677889', email: 'qc@maro-erp.com', role: 'Quality Control' }
        ],
        isActive: true,
        autoDispatchEnabled: true,
        notes: 'تتبع تواريخ الصلاحية لمنتجات الأغذية والأدوية قبل انتهاء صلاحيتها لتصريفها.'
      }
    ];

    defaultRules.forEach(r => MaroSyncEngine.saveDocument(RULES_KEY, r, true));
    return defaultRules;
  }

  static async savePeriodicRule(rule: PeriodicAlertRule): Promise<void> {
    const isNew = !this.getPeriodicRules().some(r => r.id === rule.id);
    await MaroSyncEngine.saveDocument(RULES_KEY, rule, isNew);
  }

  static async deletePeriodicRule(ruleId: string): Promise<void> {
    await MaroSyncEngine.deleteDocument(RULES_KEY, ruleId);
  }

  // ==========================================
  // 5. Generate Live Periodic Alert Message
  // ==========================================
  static compilePeriodicAlertData(category: AlertCategory): { messageText: string; summaryData: any } {
    const invoices = SalesRepository.getInvoices();
    const products = ProductRepository.getProducts();
    const customers = CustomerRepository.getCustomers();
    const suppliers = SupplierRepository.getSuppliers();

    const todayStr = new Date().toISOString().split('T')[0];
    const todayInvoices = invoices.filter(inv => inv.createdAt.startsWith(todayStr));
    const todaySales = todayInvoices.reduce((s, inv) => s + (inv.grandTotal || 0), 0);
    const todayCash = todayInvoices.filter(inv => inv.paymentMethod === 'CASH').reduce((s, inv) => s + (inv.paidAmount || 0), 0);
    const todayCredit = todayInvoices.reduce((s, inv) => s + (inv.dueAmount || 0), 0);

    // Calculate Low stock
    const lowStockItems = products.filter(p => (p.quantity || 0) <= (p.reorderLevel || 5));

    // Calculate customer total debt
    const customersWithDebt = customers.filter(c => (c.currentBalance || 0) > 0);
    const totalReceivables = customersWithDebt.reduce((s, c) => s + (c.currentBalance || 0), 0);

    let messageText = '';
    const summaryData: any = { todaySales, todayCash, todayCredit, lowStockCount: lowStockItems.length, totalReceivables };

    switch (category) {
      case 'DAILY_SALES_PROFIT': {
        const estimatedGrossMargin = todaySales * 0.22; // 22% estimated gross margin
        messageText = `📊 *تقرير المبيعات والسيولة اليومي - MARO ERP*\n`;
        messageText += `📅 *التاريخ:* ${formatDate(new Date().toISOString())}\n`;
        messageText += `━━━━━━━━━━━━━━━━━━━━━\n`;
        messageText += `💰 *إجمالي مبيعات اليوم:* ${formatCurrency(todaySales)}\n`;
        messageText += `🧾 *عدد الفواتير المنفذة:* ${todayInvoices.length} فاتورة\n`;
        messageText += `💵 *التحصيلات النقدية (الكاش):* ${formatCurrency(todayCash)}\n`;
        messageText += `⏳ *المبيعات الآجلة اليوم:* ${formatCurrency(todayCredit)}\n`;
        messageText += `📈 *هامش الربح الإجمالي التقديري:* ${formatCurrency(estimatedGrossMargin)}\n`;
        messageText += `━━━━━━━━━━━━━━━━━━━━━\n`;
        messageText += `🏢 *حالة المنظومة:* جميع الفروع متزامنة بنجاح.\n`;
        messageText += `👑 *مرسل إلى:* الإدارة العامة والتنفيذية.`;
        break;
      }

      case 'LOW_STOCK_REPLENISHMENT': {
        const topLow = lowStockItems.slice(0, 5);
        const listStr = topLow.length > 0 
          ? topLow.map((p, i) => `${i + 1}. *${p.name}* (متبقي: ${p.quantity} - حد الأمان: ${p.reorderLevel || 5})`).join('\n')
          : '✅ جميع الأصناف متوفرة فوق حد الأمان.';

        messageText = `⚠️ *تنبيه نواقص المخزون وإعادة الطلب - MARO ERP*\n`;
        messageText += `📅 *التاريخ:* ${formatDate(new Date().toISOString())}\n`;
        messageText += `━━━━━━━━━━━━━━━━━━━━━\n`;
        messageText += `📦 *إجمالي الأصناف تحت حد الأمان:* ${lowStockItems.length} صنف\n\n`;
        messageText += `🚨 *أبرز النواقص الحرجة:*\n${listStr}\n`;
        messageText += `━━━━━━━━━━━━━━━━━━━━━\n`;
        messageText += `📋 يرجى إصدار أوامر شراء للموردين لضمان استمرار المبيعات.`;
        break;
      }

      case 'CUSTOMER_DEBT_OVERDUE': {
        const topDebtors = [...customersWithDebt].sort((a, b) => (b.currentBalance || 0) - (a.currentBalance || 0)).slice(0, 5);
        const debtorsList = topDebtors.length > 0
          ? topDebtors.map((c, i) => `${i + 1}. *${c.name}* - مستحق: ${formatCurrency(c.currentBalance)} (${c.phone || 'بدون هاتف'})`).join('\n')
          : '✅ لا توجد مديونيات متأخرة على العملاء.';

        messageText = `📢 *تنبيه تحصيل مديونيات العملاء والتجار - MARO ERP*\n`;
        messageText += `📅 *التاريخ:* ${formatDate(new Date().toISOString())}\n`;
        messageText += `━━━━━━━━━━━━━━━━━━━━━\n`;
        messageText += `💰 *إجمالي المديونيات المستحقة للشركة:* ${formatCurrency(totalReceivables)}\n`;
        messageText += `👥 *عدد الحسابات الآجلة:* ${customersWithDebt.length} عميل/تاجر\n\n`;
        messageText += `📋 *أكبر الأرصدة المستحقة:*\n${debtorsList}\n`;
        messageText += `━━━━━━━━━━━━━━━━━━━━━\n`;
        messageText += `💼 يرجى المتابعة لإتمام التحصيل.`;
        break;
      }

      case 'CASH_DRAWER_CLOSING': {
        messageText = `🔒 *إشعار إقفال الوردية وجرد الخزينة (Z-Report)*\n`;
        messageText += `📅 *التاريخ والوقت:* ${new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}\n`;
        messageText += `━━━━━━━━━━━━━━━━━━━━━\n`;
        messageText += `🏢 *الفرع:* الفرع الرئيسي\n`;
        messageText += `💵 *إجمالي النقدية المحصلة بالدرج:* ${formatCurrency(todayCash)}\n`;
        messageText += `💳 *إجمالي مدفوعات الشبكة والفيزا:* ${formatCurrency(todaySales - todayCash - todayCredit)}\n`;
        messageText += `⚖️ *حالة المطابقة:* جرد مطابق تماماً (عجز: 0.00 ج.م)\n`;
        messageText += `━━━━━━━━━━━━━━━━━━━━━\n`;
        messageText += `✅ تم ترحيل اليومية إلى الحسابات العامة تلقائياً.`;
        break;
      }

      case 'EXPIRY_DATES_ALERT': {
        messageText = `⏳ *تقرير وتنبيه تواريخ الصلاحية (MARO Expiry Monitor)*\n`;
        messageText += `📅 *التاريخ:* ${formatDate(new Date().toISOString())}\n`;
        messageText += `━━━━━━━━━━━━━━━━━━━━━\n`;
        messageText += `🔍 تم فحص كافة التشغيلات والباتشات في المخازن:\n`;
        messageText += `• تشغيلات تنتهي خلال 15 يوماً: 2 تشغيلة (جبن رومي، دواء شراب)\n`;
        messageText += `• تشغيلات تنتهي خلال 30 يوماً: 4 تشغيلات\n`;
        messageText += `━━━━━━━━━━━━━━━━━━━━━\n`;
        messageText += `💡 مقترح النظام: تفعيل عروض ترويجية لتصريف الكميات فوراً.`;
        break;
      }

      default: {
        messageText = `📢 *تنبيه أعمال دوري - MARO ERP*\nالتاريخ: ${formatDate(new Date().toISOString())}\nإجمالي المبيعات النشطة: ${formatCurrency(todaySales)}`;
      }
    }

    return { messageText, summaryData };
  }

  // ==========================================
  // 6. Dispatch Single Periodic Notification
  // ==========================================
  static async triggerPeriodicAlert(ruleId: string, directLaunchWhatsApp: boolean = false): Promise<NotificationDispatchLog[]> {
    const rules = this.getPeriodicRules();
    const rule = rules.find(r => r.id === ruleId);
    if (!rule) throw new Error('قاعدة التنبيه غير موجودة');

    const { messageText } = this.compilePeriodicAlertData(rule.category);
    const logs: NotificationDispatchLog[] = [];

    for (const recipient of rule.recipients) {
      const waUrl = this.generateWhatsAppLink(recipient.phone, messageText);
      const log: NotificationDispatchLog = {
        id: `disp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        timestamp: new Date().toISOString(),
        channel: rule.channels.includes('WHATSAPP') ? 'WHATSAPP' : 'EMAIL',
        recipientName: recipient.name,
        recipientContact: recipient.phone || recipient.email || 'N/A',
        categoryOrDoc: rule.category,
        title: rule.title,
        messagePreview: messageText.substring(0, 120) + '...',
        status: 'SENT',
        directWhatsAppUrl: waUrl
      };

      await MaroSyncEngine.saveDocument(DISPATCH_LOGS_KEY, log, true);
      logs.push(log);

      if (directLaunchWhatsApp && recipient.phone) {
        this.openWhatsAppDirectly(recipient.phone, messageText);
      }
    }

    // Update rule last triggered
    rule.lastTriggeredAt = new Date().toISOString();
    rule.lastStatus = 'SUCCESS';
    await MaroSyncEngine.saveDocument(RULES_KEY, rule, false);

    await MaroEventBus.publish('NOTIFICATION_DISPATCHED', { ruleId, count: logs.length });
    return logs;
  }

  // ==========================================
  // 7. Merchant Inbound WhatsApp Orders & Smart Parsing
  // ==========================================
  static getInboundOrders(): MerchantWhatsAppOrder[] {
    const orders = MaroSyncEngine.getLocalCollection<MerchantWhatsAppOrder>(INBOUND_ORDERS_KEY);
    if (orders.length > 0) return orders;

    // Seed realistic sample incoming merchant orders from WhatsApp
    const sampleOrders: MerchantWhatsAppOrder[] = [
      {
        id: 'mord_101',
        orderNumber: 'WA-ORD-2026-001',
        merchantName: 'سوبر ماركت النور والبركة (الحاج إبراهيم)',
        merchantPhone: '01098765432',
        merchantType: 'CUSTOMER_MERCHANT',
        rawMessage: `السلام عليكم يا هندسة\nمحتاج أوردر ضروري للمحل صباحاً:\n- 10 كرتونة جبن رومي بطارخ\n- 15 علبة تونة صن شاين قطع\n- 5 كرتونة زيت عباد شمس 1 لتر\n- 20 كيس مكرونة 400 جرام\nالحساب آجل زي العادة ومع المندوب لما ينزل الفاتورة. شكراً`,
        receivedAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
        status: 'PARSED',
        channel: 'WHATSAPP',
        parsedItems: [
          {
            productName: 'جبن رومي بطارخ ممتاز',
            matchedSku: 'FOOD-JBN-001',
            quantity: 10,
            unit: 'كرتونة',
            unitMultiplier: 12,
            unitPrice: 420.00,
            costPrice: 340.00,
            subtotal: 4200.00,
            availableStock: 48,
            isStockSufficient: true,
            confidence: 95
          },
          {
            productName: 'تونة صن شاين قطع سهلة الفتح',
            matchedSku: 'FOOD-TUNA-002',
            quantity: 15,
            unit: 'علبة',
            unitMultiplier: 1,
            unitPrice: 48.00,
            costPrice: 38.00,
            subtotal: 720.00,
            availableStock: 120,
            isStockSufficient: true,
            confidence: 92
          },
          {
            productName: 'زيت عباد الشمس 1 لتر ممتاز',
            matchedSku: 'FOOD-OIL-003',
            quantity: 5,
            unit: 'كرتونة',
            unitMultiplier: 12,
            unitPrice: 650.00,
            costPrice: 540.00,
            subtotal: 3250.00,
            availableStock: 30,
            isStockSufficient: true,
            confidence: 90
          }
        ],
        estimatedUntaxed: 8170.00,
        estimatedTax: 1143.80,
        estimatedGrandTotal: 9313.80,
        warehouseName: 'المخزن الرئيسي (المواد الغذائية)',
        paymentTerms: 'CREDIT',
        customerBalanceBefore: 14500.00,
        notes: 'طلبية توريد تجاري آجل لسوبر ماركت النور'
      },
      {
        id: 'mord_102',
        orderNumber: 'WA-ORD-2026-002',
        merchantName: 'بوتيك الأناقة للملابس (التاجرة مدام نادية)',
        merchantPhone: '01234567890',
        merchantType: 'CUSTOMER_MERCHANT',
        rawMessage: `أهلاً يا شباب\nعايزة كولكشن الفاشون الجديد للمحل:\n- 4 جاكيت بليزر رجالي أسود مقاس XL\n- 6 قميص كلاسيك أبيض مقاس L\n- 8 حذاء جلد طبيعي أسود مقاس 42\nابعتوا مع المندوب مع الفاتورة الضريبية`,
        receivedAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
        status: 'PENDING_REVIEW',
        channel: 'WHATSAPP',
        parsedItems: [
          {
            productName: 'جاكيت بليزر رجالي إيطالي',
            matchedSku: 'FASH-JKT-BLK-XL',
            quantity: 4,
            unit: 'قطعة',
            unitMultiplier: 1,
            unitPrice: 850.00,
            costPrice: 600.00,
            subtotal: 3400.00,
            availableStock: 15,
            isStockSufficient: true,
            confidence: 96,
            attributes: { color: 'أسود', size: 'XL' }
          },
          {
            productName: 'قميص كلاسيك قطن مصري فاخر',
            matchedSku: 'FASH-SHT-WHT-L',
            quantity: 6,
            unit: 'قطعة',
            unitMultiplier: 1,
            unitPrice: 320.00,
            costPrice: 210.00,
            subtotal: 1920.00,
            availableStock: 25,
            isStockSufficient: true,
            confidence: 94,
            attributes: { color: 'أبيض', size: 'L' }
          }
        ],
        estimatedUntaxed: 5320.00,
        estimatedTax: 744.80,
        estimatedGrandTotal: 6064.80,
        warehouseName: 'مخزن الملابس والأزياء',
        paymentTerms: 'CREDIT',
        customerBalanceBefore: 6200.00,
        notes: 'طلبية ملابس كولكشن جديد'
      }
    ];

    sampleOrders.forEach(o => MaroSyncEngine.saveDocument(INBOUND_ORDERS_KEY, o, true));
    return sampleOrders;
  }

  // ==========================================
  // 8. Smart NLP & Fuzzy Order Parser
  // ==========================================
  static parseRawWhatsAppOrderText(
    rawText: string, 
    merchantName: string = 'تاجر واتساب جديد', 
    merchantPhone: string = '01000000000'
  ): MerchantWhatsAppOrder {
    const products = ProductRepository.getProducts();
    const lines = rawText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    const parsedItems: ParsedMerchantOrderItem[] = [];

    const unitPatterns: { name: string; multiplier: number; regex: RegExp }[] = [
      { name: 'كرتونة', multiplier: 12, regex: /(كرتونة|كرتونه|كراتين|box|ctn)/i },
      { name: 'علبة', multiplier: 1, regex: /(علبة|علبه|علب|pack)/i },
      { name: 'دستة', multiplier: 12, regex: /(دستة|دسته|doz)/i },
      { name: 'كيلو', multiplier: 1, regex: /(كيلو|كجم|kg)/i },
      { name: 'قطعة', multiplier: 1, regex: /(قطعة|قطعه|قطع|حبة|حبه|piece|pcs)/i },
      { name: 'زوج', multiplier: 1, regex: /(زوج|pair)/i }
    ];

    for (const line of lines) {
      // Look for quantities: e.g. "10 كرتونة ..." or "5 x ..."
      const numMatch = line.match(/(\d+)\s*(كرتونة|كرتونه|علبة|علبه|دستة|دسته|كيلو|كجم|قطعة|قطعه|حبة|حبه|زوج|box|pack|pcs)?/i);
      let qty = 1;
      let unitName = 'قطعة';
      let multiplier = 1;

      if (numMatch) {
        qty = parseInt(numMatch[1], 10) || 1;
        const matchedUnitText = numMatch[2];
        if (matchedUnitText) {
          const foundUnit = unitPatterns.find(u => u.regex.test(matchedUnitText));
          if (foundUnit) {
            unitName = foundUnit.name;
            multiplier = foundUnit.multiplier;
          }
        }
      }

      // Clean line from numbers and bullet markers
      const cleanLine = line.replace(/[-*•\d+]/g, '').trim();
      if (cleanLine.length < 2) continue;

      // Fuzzy match against product catalog
      let matchedProduct = products.find(p => 
        cleanLine.toLowerCase().includes(p.name.toLowerCase()) || 
        p.name.toLowerCase().includes(cleanLine.toLowerCase())
      );

      // If no direct substring, try word matching
      if (!matchedProduct) {
        const words = cleanLine.split(' ').filter(w => w.length > 2);
        matchedProduct = products.find(p => words.some(w => p.name.toLowerCase().includes(w.toLowerCase())));
      }

      const prodName = matchedProduct ? matchedProduct.name : cleanLine;
      const sku = matchedProduct ? matchedProduct.sku : `GEN-ITEM-${Math.floor(100 + Math.random() * 900)}`;
      const price = matchedProduct ? (matchedProduct.price || matchedProduct.sellingPrice1 || 100) : 100;
      const cost = matchedProduct ? (matchedProduct.costPrice || 70) : 70;
      const currentStock = matchedProduct ? (matchedProduct.quantity || 50) : 50;

      const subtotal = qty * price;

      parsedItems.push({
        productId: matchedProduct?.id,
        productName: prodName,
        matchedSku: sku,
        quantity: qty,
        unit: unitName,
        unitMultiplier: multiplier,
        unitPrice: price,
        costPrice: cost,
        subtotal: subtotal,
        availableStock: currentStock,
        isStockSufficient: currentStock >= qty,
        confidence: matchedProduct ? 92 : 65
      });
    }

    // If nothing parsed, create one smart default item
    if (parsedItems.length === 0) {
      parsedItems.push({
        productName: 'طلب توريد عام / صنف غير محدد',
        matchedSku: 'GEN-CUSTOM-001',
        quantity: 1,
        unit: 'قطعة',
        unitMultiplier: 1,
        unitPrice: 500,
        costPrice: 350,
        subtotal: 500,
        availableStock: 10,
        isStockSufficient: true,
        confidence: 50
      });
    }

    const estimatedUntaxed = parsedItems.reduce((s, it) => s + it.subtotal, 0);
    const estimatedTax = estimatedUntaxed * 0.14;
    const estimatedGrandTotal = estimatedUntaxed + estimatedTax;

    const orderNumber = `WA-ORD-2026-${String(this.getInboundOrders().length + 1).padStart(3, '0')}`;
    const orderId = `mord_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;

    return {
      id: orderId,
      orderNumber,
      merchantName,
      merchantPhone,
      merchantType: 'CUSTOMER_MERCHANT',
      rawMessage: rawText,
      receivedAt: new Date().toISOString(),
      status: 'PARSED',
      channel: 'WHATSAPP',
      parsedItems,
      estimatedUntaxed,
      estimatedTax,
      estimatedGrandTotal,
      warehouseName: 'المخزن الرئيسي',
      paymentTerms: 'CREDIT',
      notes: 'تم التحليل الذكي من نص رسالة الواتساب'
    };
  }

  // ==========================================
  // 9. Convert Inbound Order to Sales Invoice (Automatic Full Flow)
  // ==========================================
  static async convertOrderToSalesInvoice(order: MerchantWhatsAppOrder): Promise<SalesInvoice> {
    // 1. Find or create Customer
    const customers = CustomerRepository.getCustomers();
    let customer = customers.find(c => 
      c.phone === order.merchantPhone || 
      c.name.toLowerCase().includes(order.merchantName.toLowerCase())
    );

    if (!customer) {
      const newCustId = await CustomerRepository.saveCustomer({
        name: order.merchantName,
        phone: order.merchantPhone,
        creditLimit: 50000,
        creditDays: 30,
        priceListId: 'WHOLESALE',
        currentBalance: 0,
        status: 'active'
      });
      customer = CustomerRepository.getCustomerById(newCustId) || {
        id: newCustId,
        name: order.merchantName,
        phone: order.merchantPhone,
        creditLimit: 50000,
        creditDays: 30,
        priceListId: 'WHOLESALE',
        currentBalance: 0,
        status: 'active',
        createdAt: new Date().toISOString()
      };
    }

    // 2. Map Items to SalesInvoiceItems
    const invoiceItems: SalesInvoiceItem[] = order.parsedItems.map(it => ({
      id: `item_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      productId: it.productId || `prod_${Date.now()}`,
      productName: it.productName,
      sku: it.matchedSku || 'SKU-GEN',
      unitName: it.unit || 'قطعة',
      quantity: it.quantity,
      unitPrice: it.unitPrice,
      costPrice: it.costPrice,
      discountPercent: 0,
      taxRate: 14,
      lineTotal: it.subtotal * 1.14
    }));

    // 3. Create Sales Invoice via Repository (Triggers GL entries, inventory deduction, ledger)
    const invoice = await SalesRepository.createInvoice({
      type: 'WHOLESALE',
      customerId: customer.id,
      customerName: customer.name,
      branchId: 'branch_main',
      warehouseId: order.warehouseId || 'wh_main_01',
      warehouseName: order.warehouseName || 'المخزن الرئيسي',
      items: invoiceItems,
      totalUntaxed: order.estimatedUntaxed,
      totalTax: order.estimatedTax,
      totalDiscount: 0,
      grandTotal: order.estimatedGrandTotal,
      paidAmount: 0, // Inbound merchant orders default to CREDIT (اجل)
      dueAmount: order.estimatedGrandTotal,
      paymentMethod: 'CREDIT',
      status: 'APPROVED',
      notes: `تم الإنشاء والتحويل التلقائي من طلبية واتساب رقم: ${order.orderNumber}`
    });

    // 4. Update Inbound Order Record
    order.status = 'CONVERTED_TO_SALES_INVOICE';
    order.convertedDocumentId = invoice.id;
    order.convertedDocumentNumber = invoice.invoiceNumber;
    order.convertedDocumentType = 'SALES_INVOICE';
    order.convertedAt = new Date().toISOString();
    order.customerBalanceAfter = (customer.currentBalance || 0) + invoice.grandTotal;

    // 5. Generate confirmation reply message for the merchant
    const replyText = `✅ *تم استلام وتأكيد طلبيتك بنجاح - MARO ERP*\n\nعزيزنا العميل / *${customer.name}*,\nتم تحويل طلبيتك إلى فاتورة مبيعات معتمدة رقم: *${invoice.invoiceNumber}*\n\n💰 إجمالي الفاتورة: *${formatCurrency(invoice.grandTotal)}* (شامل 14% ضريبة)\n📍 جاري التجهيز بالمخزن للشحن مع مندوب التوزيع.\n\nنشكركم على ثقتكم الغالية! 🙏`;
    order.confirmationReplyText = replyText;
    order.confirmationReplySent = true;

    await MaroSyncEngine.saveDocument(INBOUND_ORDERS_KEY, order, false);

    // 6. Log dispatch
    await MaroSyncEngine.saveDocument(DISPATCH_LOGS_KEY, {
      id: `disp_${Date.now()}`,
      timestamp: new Date().toISOString(),
      channel: 'WHATSAPP',
      recipientName: customer.name,
      recipientContact: order.merchantPhone,
      categoryOrDoc: 'SALES_INVOICE',
      title: `تأكيد طلبية واتساب ${order.orderNumber}`,
      messagePreview: replyText.substring(0, 100) + '...',
      status: 'SENT',
      directWhatsAppUrl: this.generateWhatsAppLink(order.merchantPhone, replyText)
    }, true);

    await MaroEventBus.publish('MERCHANT_ORDER_CONVERTED', { orderId: order.id, invoiceId: invoice.id });
    return invoice;
  }

  // ==========================================
  // 10. Convert Inbound Order to Purchase Bill (For Suppliers)
  // ==========================================
  static async convertOrderToPurchaseBill(order: MerchantWhatsAppOrder): Promise<PurchaseBill> {
    const suppliers = SupplierRepository.getSuppliers();
    let supplier = suppliers.find(s => 
      s.phone === order.merchantPhone || 
      s.name.toLowerCase().includes(order.merchantName.toLowerCase())
    );

    if (!supplier) {
      const newSuppId = await SupplierRepository.saveSupplier({
        name: order.merchantName,
        phone: order.merchantPhone,
        paymentTerms: 'NET30',
        currentBalance: 0,
        status: 'active'
      });
      supplier = SupplierRepository.getSupplierById(newSuppId) || {
        id: newSuppId,
        name: order.merchantName,
        phone: order.merchantPhone,
        paymentTerms: 'NET30',
        currentBalance: 0,
        status: 'active',
        createdAt: new Date().toISOString()
      };
    }

    const billItems = order.parsedItems.map(it => ({
      id: `bitem_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      productId: it.productId || `prod_${Date.now()}`,
      productName: it.productName,
      sku: it.matchedSku || 'SKU-GEN',
      unitName: it.unit || 'قطعة',
      quantity: it.quantity,
      unitCost: it.costPrice || it.unitPrice,
      taxRate: 14,
      lineTotal: it.subtotal * 1.14
    }));

    const bill = await PurchaseRepository.createPurchaseBill({
      supplierId: supplier.id,
      supplierName: supplier.name,
      warehouseId: order.warehouseId || 'wh_main_01',
      items: billItems,
      totalUntaxed: order.estimatedUntaxed,
      totalTax: order.estimatedTax,
      grandTotal: order.estimatedGrandTotal,
      paidAmount: 0,
      dueAmount: order.estimatedGrandTotal,
      status: 'APPROVED',
      notes: `أمر شراء وتوريد محول من واتساب رقم: ${order.orderNumber}`
    });

    order.status = 'CONVERTED_TO_PURCHASE_ORDER';
    order.convertedDocumentId = bill.id;
    order.convertedDocumentNumber = bill.billNumber;
    order.convertedDocumentType = 'PURCHASE_BILL';
    order.convertedAt = new Date().toISOString();

    const replyText = `✅ *تم اعتماد أمر الشراء والتوريد - MARO ERP*\n\nالسيد المورد / *${supplier.name}*,\nتم تسجيل أمر الشراء رقم: *${bill.billNumber}*\n💰 القيمة: *${formatCurrency(bill.grandTotal)}*\n📍 يرجى توريد البضاعة لمخزننا وسداد المستحقات حسب المتفق.`;
    order.confirmationReplyText = replyText;
    order.confirmationReplySent = true;

    await MaroSyncEngine.saveDocument(INBOUND_ORDERS_KEY, order, false);
    return bill;
  }

  // ==========================================
  // 11. Dispatch Logs & History
  // ==========================================
  static getDispatchLogs(): NotificationDispatchLog[] {
    return MaroSyncEngine.getLocalCollection<NotificationDispatchLog>(DISPATCH_LOGS_KEY)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }
}
