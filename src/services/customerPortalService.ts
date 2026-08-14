// MARO ERP - Customer & Merchant B2B Ordering Portal Service
import { 
  CustomerPortalOrder, 
  CustomerPortalOrderItem, 
  PortalOrderStatus, 
  PortalStoreSettings 
} from '../types/customerPortal';
import { ProductMaster } from '../types/productMaster';
import { SalesInvoice, Customer } from '../types/sprint8';
import { MaroSyncEngine } from '../lib/maroSyncEngine';
import { ProductRepository } from '../repositories/productRepository';
import { CustomerRepository } from '../repositories/customerRepository';
import { SalesRepository } from '../repositories/salesRepository';
import { MaroEventBus } from '../lib/eventBus';

const PORTAL_ORDERS_COLLECTION = 'customer_portal_orders';
const PORTAL_SETTINGS_KEY = 'portal_store_settings';

const DEFAULT_PORTAL_SETTINGS: PortalStoreSettings = {
  storeName: 'منصة مارو للأعمال - متجر الطلبيات الذكي',
  storeSubtitle: 'بوابة طلبات الجملة والتجزئة والتوريد المباشر للعملاء والتجار',
  hotlinePhone: '01012345678',
  whatsappPhone: '01012345678',
  address: 'المنطقة الصناعية - مجمع المستودعات المركزي',
  currency: 'EGP',
  defaultTaxRate: 14,
  minOrderValue: 50,
  allowCreditOrders: true,
  enableSoundAlerts: true,
  welcomeMessageAr: 'مرحباً بكم في متجرنا المباشر. تصفح الأصناف، حدد الكميات، وأرسل طلبك ليصل إلى النظام فوراً.',
  deliveryFee: 0,
  freeDeliveryThreshold: 500
};

export class CustomerPortalService {
  // --- Store Settings Management ---
  static getStoreSettings(): PortalStoreSettings {
    const raw = localStorage.getItem(PORTAL_SETTINGS_KEY);
    if (!raw) {
      localStorage.setItem(PORTAL_SETTINGS_KEY, JSON.stringify(DEFAULT_PORTAL_SETTINGS));
      return DEFAULT_PORTAL_SETTINGS;
    }
    try {
      return { ...DEFAULT_PORTAL_SETTINGS, ...JSON.parse(raw) };
    } catch {
      return DEFAULT_PORTAL_SETTINGS;
    }
  }

  static saveStoreSettings(settings: Partial<PortalStoreSettings>): PortalStoreSettings {
    const current = this.getStoreSettings();
    const updated = { ...current, ...settings };
    localStorage.setItem(PORTAL_SETTINGS_KEY, JSON.stringify(updated));
    return updated;
  }

  // --- Audio Alert for Incoming Web Orders ---
  static playNewOrderSound() {
    try {
      const settings = this.getStoreSettings();
      if (!settings.enableSoundAlerts) return;

      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      oscillator.frequency.setValueAtTime(880, audioCtx.currentTime + 0.12); // A5
      oscillator.frequency.setValueAtTime(1174.66, audioCtx.currentTime + 0.24); // D6

      gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.5);
    } catch (e) {
      console.warn('[CustomerPortalService] Audio alert not allowed by browser autoplay policy:', e);
    }
  }

  // --- Public Catalog Retrieval ---
  static getPublicCatalog(): (ProductMaster & { 
    isAvailable: boolean; 
    unitOptions: { name: string; multiplier: number; price: number }[] 
  })[] {
    const products = ProductRepository.getProducts();

    return products.map(p => {
      const stock = p.quantity || 0;
      const basePrice = p.price || 0;
      
      // Standard unit configurations (قطعة / كرتونة / باكت / دستة)
      const unitOptions = [
        { name: (p as any).unit || (p.units?.[0]?.name) || 'قطعة', multiplier: 1, price: basePrice }
      ];

      // If wholesale price or higher unit exists
      if (p.wholesalePrice && p.wholesalePrice < basePrice) {
        unitOptions.push({
          name: 'دستة (12 قطعة)',
          multiplier: 12,
          price: +(p.wholesalePrice * 12).toFixed(2)
        });
      }

      unitOptions.push({
        name: 'كرتونة (24 قطعة)',
        multiplier: 24,
        price: +((p.wholesalePrice || (basePrice * 0.9)) * 24).toFixed(2)
      });

      return {
        ...p,
        isAvailable: stock > 0,
        unitOptions
      };
    });
  }

  // --- Orders CRUD in Local/Sync Engine ---
  static getOrders(): CustomerPortalOrder[] {
    return MaroSyncEngine.getLocalCollection<CustomerPortalOrder>(PORTAL_ORDERS_COLLECTION)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  static getOrderById(id: string): CustomerPortalOrder | null {
    return MaroSyncEngine.getLocalDocument<CustomerPortalOrder>(PORTAL_ORDERS_COLLECTION, id);
  }

  static async submitCustomerOrder(data: {
    customerName: string;
    phone: string;
    email?: string;
    deliveryAddress: string;
    city?: string;
    preferredDeliveryDate?: string;
    preferredDeliveryTime?: string;
    paymentMethod: CustomerPortalOrder['paymentMethod'];
    customerNotes?: string;
    source?: CustomerPortalOrder['source'];
    items: {
      productId: string;
      productName: string;
      sku: string;
      unitName: string;
      unitMultiplier: number;
      quantity: number;
      unitPrice: number;
      taxRate?: number;
      discountPercent?: number;
      notes?: string;
    }[];
  }): Promise<CustomerPortalOrder> {
    if (!data.items || data.items.length === 0) {
      throw new Error('يجب اختيار صنف واحد على الأقل لإتمام طلب الشراء');
    }
    if (!data.customerName.trim()) {
      throw new Error('يرجى إدخال اسم العميل أو اسم المؤسسة');
    }
    if (!data.phone.trim()) {
      throw new Error('يرجى إدخال رقم هاتف للتواصل والتأكيد');
    }

    const settings = this.getStoreSettings();
    const existingOrders = this.getOrders();
    const orderNumber = `WEB-2026-${String(existingOrders.length + 1).padStart(5, '0')}`;
    const id = `cpo_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;
    const now = new Date().toISOString();

    // Check if phone matches an existing registered customer in database
    const customers = CustomerRepository.getCustomers();
    const matchedCustomer = customers.find(c => c.phone && c.phone.replace(/\D/g, '').includes(data.phone.replace(/\D/g, '')));

    let subtotal = 0;
    let discountAmount = 0;
    let taxAmount = 0;

    const formattedItems: CustomerPortalOrderItem[] = data.items.map(item => {
      const qty = item.quantity > 0 ? item.quantity : 1;
      const unitMultiplier = item.unitMultiplier || 1;
      const totalPieces = qty * unitMultiplier;
      const disc = item.discountPercent || 0;
      const taxR = item.taxRate !== undefined ? item.taxRate : settings.defaultTaxRate;

      const rawTotal = qty * item.unitPrice;
      const discVal = rawTotal * (disc / 100);
      const untaxed = rawTotal - discVal;
      const itemTax = untaxed * (taxR / 100);
      const lineTotal = untaxed + itemTax;

      subtotal += rawTotal;
      discountAmount += discVal;
      taxAmount += itemTax;

      return {
        productId: item.productId,
        productName: item.productName,
        sku: item.sku,
        unitName: item.unitName,
        unitMultiplier,
        quantity: qty,
        totalPieces,
        unitPrice: item.unitPrice,
        originalPrice: item.unitPrice,
        discountPercent: disc,
        taxRate: taxR,
        lineTotal: +lineTotal.toFixed(2),
        notes: item.notes
      };
    });

    const shippingCost = (subtotal >= settings.freeDeliveryThreshold || settings.deliveryFee === 0) 
      ? 0 
      : settings.deliveryFee;

    const grandTotal = +(subtotal - discountAmount + taxAmount + shippingCost).toFixed(2);

    const order: CustomerPortalOrder = {
      id,
      orderNumber,
      customerId: matchedCustomer?.id,
      customerName: data.customerName.trim(),
      phone: data.phone.trim(),
      email: data.email?.trim(),
      deliveryAddress: data.deliveryAddress.trim(),
      city: data.city?.trim() || 'المركز الرئيسي',
      preferredDeliveryDate: data.preferredDeliveryDate || new Date().toISOString().split('T')[0],
      preferredDeliveryTime: data.preferredDeliveryTime || 'صباحاً (9:00 ص - 2:00 م)',
      paymentMethod: data.paymentMethod,
      items: formattedItems,
      subtotal: +subtotal.toFixed(2),
      discountAmount: +discountAmount.toFixed(2),
      taxAmount: +taxAmount.toFixed(2),
      shippingCost,
      grandTotal,
      status: 'PENDING_REVIEW',
      customerNotes: data.customerNotes,
      source: data.source || 'CUSTOMER_PORTAL',
      createdAt: now,
      updatedAt: now
    };

    // Save to local sync engine
    await MaroSyncEngine.saveDocument(PORTAL_ORDERS_COLLECTION, order, true);

    // Play notification sound
    this.playNewOrderSound();

    // Publish to Event Bus
    await MaroEventBus.publish('InvoiceCreated', {
      orderId: id,
      orderNumber,
      customerName: order.customerName,
      grandTotal,
      isWebOrder: true
    });

    return order;
  }

  static async updateOrderStatus(
    orderId: string, 
    status: PortalOrderStatus, 
    adminNotes?: string
  ): Promise<CustomerPortalOrder> {
    const order = this.getOrderById(orderId);
    if (!order) throw new Error('الطلب غير موجود');

    const updated: CustomerPortalOrder = {
      ...order,
      status,
      adminNotes: adminNotes !== undefined ? adminNotes : order.adminNotes,
      updatedAt: new Date().toISOString()
    };

    await MaroSyncEngine.saveDocument(PORTAL_ORDERS_COLLECTION, updated, false);
    return updated;
  }

  // --- 1-Click Convert Customer Order into Official Sales Invoice ---
  static async convertOrderToSalesInvoice(
    orderId: string, 
    options?: {
      warehouseId?: string;
      cashierId?: string;
      customNotes?: string;
      markAsPaid?: boolean;
    }
  ): Promise<{ order: CustomerPortalOrder; invoice: SalesInvoice }> {
    const order = this.getOrderById(orderId);
    if (!order) throw new Error('الطلب غير موجود');

    // 1. Ensure Customer exists or create guest profile
    let customerId = order.customerId;
    if (!customerId) {
      const customers = CustomerRepository.getCustomers();
      const existing = customers.find(c => c.name.toLowerCase() === order.customerName.toLowerCase() || (c.phone && c.phone === order.phone));
      if (existing) {
        customerId = existing.id;
      } else {
        const newCustId = await CustomerRepository.saveCustomer({
          name: order.customerName,
          phone: order.phone,
          email: order.email,
          creditLimit: 10000,
          creditDays: 30,
          priceListId: 'RETAIL',
          currentBalance: 0,
          status: 'active'
        });
        customerId = newCustId;
      }
    }

    // 2. Prepare Invoice Items
    const invoiceItems = order.items.map(item => {
      const prod = ProductRepository.getProductByIdSync(item.productId);
      return {
        id: `inv_item_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        productId: item.productId,
        productName: item.productName,
        sku: item.sku,
        unitName: item.unitName,
        quantity: item.totalPieces, // in base units
        unitPrice: item.unitPrice / item.unitMultiplier, // unit price per piece
        costPrice: prod?.costPrice || (item.unitPrice * 0.7),
        discountPercent: item.discountPercent || 0,
        taxRate: item.taxRate || 14,
        lineTotal: item.lineTotal
      };
    });

    const paymentMethodMap: Record<string, 'CASH' | 'CARD' | 'CREDIT' | 'SPLIT'> = {
      'COD': 'CASH',
      'CREDIT_ACCOUNT': 'CREDIT',
      'BANK_TRANSFER': 'CARD',
      'E_WALLET': 'CARD'
    };

    // 3. Create Official Sales Invoice
    const invoice = await SalesRepository.createInvoice({
      type: 'RETAIL',
      customerId,
      customerName: order.customerName,
      branchId: 'branch_main',
      warehouseId: options?.warehouseId || 'wh_main',
      items: invoiceItems,
      totalUntaxed: order.subtotal - order.discountAmount,
      totalTax: order.taxAmount,
      totalDiscount: order.discountAmount,
      grandTotal: order.grandTotal,
      paidAmount: options?.markAsPaid ? order.grandTotal : (order.paymentMethod === 'COD' ? 0 : 0),
      dueAmount: options?.markAsPaid ? 0 : order.grandTotal,
      paymentMethod: paymentMethodMap[order.paymentMethod] || 'CREDIT',
      status: options?.markAsPaid ? 'PAID' : 'APPROVED',
      notes: options?.customNotes || `فاتورة مبيعات تم إنشاؤها وتأكيدها آلياً بناءً على طلب الشراء الإلكتروني رقم ${order.orderNumber} - التوصيل إلى: ${order.deliveryAddress}`
    });

    // 4. Update Web Order Status
    const updatedOrder: CustomerPortalOrder = {
      ...order,
      status: 'CONVERTED_TO_INVOICE',
      convertedInvoiceId: invoice.id,
      convertedInvoiceNumber: invoice.invoiceNumber,
      adminNotes: `تم التحويل بنجاح لفاتورة مبيعات رسمية رقم ${invoice.invoiceNumber}`,
      updatedAt: new Date().toISOString()
    };

    await MaroSyncEngine.saveDocument(PORTAL_ORDERS_COLLECTION, updatedOrder, false);

    return { order: updatedOrder, invoice };
  }

  // --- WhatsApp Order Confirmation Message Generator ---
  static generateCustomerWhatsAppMessage(order: CustomerPortalOrder): string {
    const settings = this.getStoreSettings();
    const itemsList = order.items.map((it, idx) => 
      `${idx + 1}. *${it.productName}* [${it.sku}]\n   الكمية: ${it.quantity} ${it.unitName} × ${it.unitPrice.toFixed(2)} ${settings.currency} = ${it.lineTotal.toFixed(2)} ${settings.currency}`
    ).join('\n\n');

    const paymentLabel: Record<string, string> = {
      'COD': 'نقداً عند الاستلام (الدفع كاش)',
      'CREDIT_ACCOUNT': 'آجل على الحساب المعتمد',
      'BANK_TRANSFER': 'تحويل بنكي مباشر',
      'E_WALLET': 'محفظة إلكترونية / فودافون كاش / انستاباي'
    };

    return `🛍️ *تأكيد استلام طلب الشراء | ${settings.storeName}*
----------------------------------------
عزيزي العميل: *${order.customerName}* المحترم،
نشكركم على ثقتكم بنا. تم استلام طلبكم بنجاح وتسجيله في النظام.

📋 *رقم الطلب:* ${order.orderNumber}
📅 *تاريخ التسجيل:* ${new Date(order.createdAt).toLocaleDateString('ar-EG')}
📍 *عنوان التوصيل:* ${order.deliveryAddress} - ${order.city || ''}
💳 *طريقة الدفع:* ${paymentLabel[order.paymentMethod] || order.paymentMethod}
${order.convertedInvoiceNumber ? `🧾 *رقم الفاتورة الرسمية:* ${order.convertedInvoiceNumber}\n` : ''}
📦 *الأصناف والكميات المطلوبة:*
----------------------------------------
${itemsList}
----------------------------------------
💰 *المجموع:* ${order.subtotal.toFixed(2)} ${settings.currency}
${order.discountAmount > 0 ? `🏷️ *الخصم:* -${order.discountAmount.toFixed(2)} ${settings.currency}\n` : ''}📊 *ضريبة القيمة المضافة (14%):* ${order.taxAmount.toFixed(2)} ${settings.currency}
🚚 *رسوم التوصيل:* ${order.shippingCost === 0 ? 'مجاناً' : `${order.shippingCost.toFixed(2)} ${settings.currency}`}
💵 *الإجمالي النهائي للطلب:* *${order.grandTotal.toFixed(2)} ${settings.currency}*

📞 لأي استفسار يرجى التواصل على الرقم: ${settings.hotlinePhone}
سيقوم فريق التجهيز بمراجعة وشحن طلبكم في أقرب وقت. شكراً لتعاملكم معنا!`;
  }

  static generateWhatsAppLink(phone: string, message: string): string {
    let cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.startsWith('01')) {
      cleanPhone = '20' + cleanPhone.substring(1);
    } else if (cleanPhone.startsWith('05') && cleanPhone.length === 10) {
      cleanPhone = '966' + cleanPhone.substring(1);
    }
    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
  }
}
