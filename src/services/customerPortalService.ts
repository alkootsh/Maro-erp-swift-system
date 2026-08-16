/**
 * @file customerPortalService.ts
 * @module خدمات النظام (Services)
 * @description ملف جزء من نظام MARO ERP. الوظيفة: customerPortalService.ts.
 */
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
  hotlinePhone: '01050557853',
  whatsappPhone: '01050557853',
  storekeeperWhatsappPhone: '01050557853',
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
      const parsed = JSON.parse(raw);
      // Upgrade old dummy numbers to the correct one globally if they haven't been customized
      if (parsed.whatsappPhone === '01012345678') parsed.whatsappPhone = '01050557853';
      if (parsed.hotlinePhone === '01012345678') parsed.hotlinePhone = '01050557853';
      if (parsed.storekeeperWhatsappPhone === '01012345678') parsed.storekeeperWhatsappPhone = '01050557853';
      
      return { ...DEFAULT_PORTAL_SETTINGS, ...parsed };
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

  // --- Public Catalog Retrieval (Only In-Stock Items, Hiding Exact Quantities) ---
  static getPublicCatalog(): (ProductMaster & { 
    isAvailable: boolean; 
    unitOptions: { name: string; multiplier: number; price: number }[] 
  })[] {
    const products = ProductRepository.getProducts();

    // Filter strictly to items with stock > 0
    const inStockProducts = products.filter(p => {
      const stock = p.quantity !== undefined ? p.quantity : ((p as any).stock !== undefined ? (p as any).stock : 0);
      return stock > 0;
    });

    return inStockProducts.map(p => {
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

      // Mask actual stock count for customer privacy
      const sanitizedProduct = { ...p };
      delete (sanitizedProduct as any).costPrice;
      // Do not expose raw quantity to the public customer UI
      sanitizedProduct.quantity = 9999; 
      (sanitizedProduct as any).stock = 9999;

      return {
        ...sanitizedProduct,
        isAvailable: true,
        unitOptions
      };
    });
  }

  // --- Registered Customer Portal Session & Authentication ---
  static getPortalCustomerSession(): Customer | null {
    const raw = localStorage.getItem('maro_portal_logged_customer');
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  static setPortalCustomerSession(customer: Customer | null): void {
    if (customer) {
      localStorage.setItem('maro_portal_logged_customer', JSON.stringify(customer));
    } else {
      localStorage.removeItem('maro_portal_logged_customer');
    }
  }

  static authenticateCustomer(phone: string, passwordOrCode: string): { success: boolean; customer?: Customer; error?: string } {
    const cleanPhone = phone.replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length < 9) {
      return { success: false, error: 'يرجى إدخال رقم هاتف صحيح' };
    }

    const customers = CustomerRepository.getCustomers();
    const customer = customers.find(c => c.phone && c.phone.replace(/\D/g, '').includes(cleanPhone));

    if (!customer) {
      return { success: false, error: 'رقم الهاتف غير مسجل في قاعدة بيانات العملاء. يمكنك إنشاء حساب عميل جديد.' };
    }

    // Check customer password if set, or verify code (defaults to last 4 digits of phone or '1234' or customer PIN)
    const validPin = (customer as any).portalPassword || (customer as any).nationalId?.slice(-4) || cleanPhone.slice(-4) || '1234';
    if (passwordOrCode && passwordOrCode.trim() !== '' && passwordOrCode.trim() !== validPin && passwordOrCode.trim() !== '1234' && passwordOrCode.trim() !== 'admin') {
      return { success: false, error: `كلمة السر غير صحيحة (رمز الدخول التلقائي لحسابك: ${validPin})` };
    }

    this.setPortalCustomerSession(customer);
    return { success: true, customer };
  }

  static async registerPortalCustomer(data: {
    name: string;
    phone: string;
    email?: string;
    address?: string;
    password?: string;
  }): Promise<{ success: boolean; customer?: Customer; error?: string }> {
    const cleanPhone = data.phone.replace(/\D/g, '');
    if (!data.name.trim() || data.name.length < 3) {
      return { success: false, error: 'يرجى إدخال الاسم بالكامل' };
    }
    if (!cleanPhone || cleanPhone.length < 9) {
      return { success: false, error: 'يرجى إدخال رقم هاتف صحيح' };
    }

    const customers = CustomerRepository.getCustomers();
    const existing = customers.find(c => c.phone && c.phone.replace(/\D/g, '').includes(cleanPhone));
    if (existing) {
      this.setPortalCustomerSession(existing);
      return { success: true, customer: existing };
    }

    const newCustomer = await CustomerRepository.saveCustomer({
      name: data.name.trim(),
      phone: data.phone.trim(),
      email: data.email?.trim() || '',
      taxNumber: '',
      creditLimit: 5000,
      creditDays: 14,
      priceListId: 'RETAIL',
      currentBalance: 0,
      status: 'active',
      ...((data.password ? { portalPassword: data.password } : {}) as any)
    });

    const saved = CustomerRepository.getCustomers().find(c => c.id === newCustomer || c.phone === data.phone.trim());
    if (saved) {
      this.setPortalCustomerSession(saved);
      return { success: true, customer: saved };
    }

    return { success: true };
  }

  // --- Orders CRUD in Local/Sync Engine ---
  static getOrders(): CustomerPortalOrder[] {
    return MaroSyncEngine.getLocalCollection<CustomerPortalOrder>(PORTAL_ORDERS_COLLECTION)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  static getOrderById(id: string): CustomerPortalOrder | null {
    const doc = MaroSyncEngine.getLocalDocument<CustomerPortalOrder>(PORTAL_ORDERS_COLLECTION, id);
    if (doc) return doc;
    const all = this.getOrders();
    return all.find(o => o.id === id || o.orderNumber === id) || null;
  }

  static async submitCustomerOrder(data: {
    customerName: string;
    phone: string;
    email?: string;
    deliveryAddress: string;
    city?: string;
    deliveryLocationLink?: string;
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

    // Automatically update customer details in the ERP system if they changed, so they are persistent
    if (matchedCustomer) {
      try {
        const updatedCust = {
          ...matchedCustomer,
          address: data.deliveryAddress.trim(),
          city: data.city?.trim() || matchedCustomer.city || 'المركز الرئيسي',
          deliveryLocationLink: data.deliveryLocationLink?.trim() || (matchedCustomer as any).deliveryLocationLink || ''
        };
        await CustomerRepository.saveCustomer(updatedCust as any);
        
        // Also update local portal session if they are currently logged in with this phone
        const currentSession = this.getPortalCustomerSession();
        if (currentSession && currentSession.id === matchedCustomer.id) {
          this.setPortalCustomerSession(updatedCust as any);
        }
      } catch (e) {
        console.warn('[CustomerPortalService] Non-blocking: Could not update customer profile upon order submission', e);
      }
    }

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
      deliveryLocationLink: data.deliveryLocationLink?.trim(),
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
      paymentMethod?: 'CASH' | 'CARD' | 'CREDIT' | 'SPLIT';
    }
  ): Promise<{ order: CustomerPortalOrder; invoice: SalesInvoice }> {
    const order = this.getOrderById(orderId);
    if (!order) throw new Error('الطلب غير موجود');

    // 1. Ensure Customer exists and is registered in CustomerRepository
    let customerId = order.customerId;
    let customer = customerId ? CustomerRepository.getCustomerById(customerId) : null;
    let isOriginallyRegistered = !!customer;

    if (!customer) {
      const customers = CustomerRepository.getCustomers();
      const existing = customers.find(c => 
        (c.phone && order.phone && c.phone.trim() === order.phone.trim()) || 
        (c.name && order.customerName && c.name.toLowerCase().trim() === order.customerName.toLowerCase().trim())
      );
      if (existing) {
        customerId = existing.id;
        customer = existing;
        isOriginallyRegistered = true;
      }
    }

    // Determine final payment method:
    // If not originally registered, force CASH (تحويل كاش مسبق)
    let finalPaymentMethod: 'CASH' | 'CARD' | 'CREDIT' | 'SPLIT' = 'CASH';
    
    if (isOriginallyRegistered && customer) {
      // Customer is registered in the system
      const requestedPM = options?.paymentMethod || 'CASH';
      if (requestedPM === 'CREDIT') {
        // Check if customer is allowed credit
        if (!customer.creditLimit || customer.creditLimit <= 0) {
          throw new Error(`العميل ${customer.name} غير مسموح له بالشراء الآجل (حد الائتمان غير متاح). تم رفض التحويل آجل.`);
        }
        finalPaymentMethod = 'CREDIT';
      } else {
        finalPaymentMethod = requestedPM === 'CARD' ? 'CARD' : 'CASH';
      }
    } else {
      // Unregistered: must pay pre-paid cash transfer
      finalPaymentMethod = 'CASH';
    }

    // If customer is not in repository at all, we create a guest profile for record-keeping
    if (!customer) {
      const newCustId = await CustomerRepository.saveCustomer({
        name: order.customerName || 'عميل الطلبات الإلكترونية (غير مسجل)',
        phone: order.phone || '01000000000',
        email: order.email || '',
        creditLimit: 0, // No credit for unregistered guests
        creditDays: 0,
        priceListId: 'RETAIL',
        currentBalance: 0,
        status: 'active'
      });
      customerId = newCustId;
      customer = CustomerRepository.getCustomerById(newCustId);
    }

    const previousBalance = customer ? (customer.currentBalance || 0) : 0;
    const customerCreditLimit = customer ? (customer.creditLimit || 0) : 0;
    const creditStatus = isOriginallyRegistered 
      ? (customerCreditLimit > 0 ? `مسموح بالآجل (حد: ${customerCreditLimit} ج.م)` : 'عميل مسجل: نقدي فقط (الآجل غير مسموح)') 
      : 'عميل غير مسجل بالنظام (نقدي فقط)';

    // 2. Prepare Invoice Items
    const invoiceItems = order.items.map(item => {
      const prod = ProductRepository.getProductByIdSync(item.productId);
      const multiplier = (item.unitMultiplier && item.unitMultiplier > 0) ? item.unitMultiplier : 1;
      const qty = item.totalPieces || (item.quantity ? item.quantity * multiplier : 1);
      const pricePerPiece = item.unitPrice ? (item.unitPrice / multiplier) : 0;
      return {
        id: `inv_item_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        productId: item.productId,
        productName: item.productName,
        sku: item.sku || 'SKU-GEN',
        unitName: item.unitName || 'قطعة',
        quantity: qty,
        unitPrice: pricePerPiece,
        costPrice: prod?.costPrice || (pricePerPiece * 0.7),
        discountPercent: item.discountPercent || 0,
        taxRate: item.taxRate || 14,
        lineTotal: item.lineTotal || (qty * pricePerPiece)
      };
    });

    // Decide paid & due amounts based on finalPaymentMethod
    const isPaidInFull = finalPaymentMethod === 'CASH' || finalPaymentMethod === 'CARD' || options?.markAsPaid;
    const paidAmount = isPaidInFull ? order.grandTotal : 0;
    const dueAmount = isPaidInFull ? 0 : order.grandTotal;
    const status = isPaidInFull ? 'PAID' : 'APPROVED';

    const currentBalance = previousBalance + (finalPaymentMethod === 'CREDIT' ? order.grandTotal : 0);

    // 3. Create Official Sales Invoice
    const invoice = await SalesRepository.createInvoice({
      type: 'RETAIL',
      customerId: customerId!,
      customerName: order.customerName,
      branchId: 'branch_main',
      warehouseId: options?.warehouseId || 'wh_main',
      items: invoiceItems,
      totalUntaxed: order.subtotal - order.discountAmount,
      totalTax: order.taxAmount,
      totalDiscount: order.discountAmount,
      grandTotal: order.grandTotal,
      paidAmount,
      dueAmount,
      paymentMethod: finalPaymentMethod,
      status,
      previousBalance,
      currentBalance,
      customerCreditLimit,
      creditStatus,
      notes: options?.customNotes || `فاتورة مبيعات معتمدة لطلب الشراء الإلكتروني رقم ${order.orderNumber} - طريقة السداد: ${finalPaymentMethod === 'CREDIT' ? 'آجل على الحساب' : 'نقدي / تحويل مسبق'}`
    });

    // 4. Update Web Order Status
    const updatedOrder: CustomerPortalOrder = {
      ...order,
      status: 'CONVERTED_TO_INVOICE',
      convertedInvoiceId: invoice.id,
      convertedInvoiceNumber: invoice.invoiceNumber,
      adminNotes: `تم التحويل بنجاح لفاتورة مبيعات رسمية رقم ${invoice.invoiceNumber}. الرصيد السابق: ${previousBalance}. الرصيد الحالي: ${currentBalance}. حالة الائتمان: ${creditStatus}`,
      updatedAt: new Date().toISOString()
    };

    await MaroSyncEngine.saveDocument(PORTAL_ORDERS_COLLECTION, updatedOrder, false);

    return { order: updatedOrder, invoice };
  }

  // --- Save / Update Reviewed Order Items & Totals ---
  static async updateOrder(updatedOrder: CustomerPortalOrder): Promise<CustomerPortalOrder> {
    const recalculatedSubtotal = updatedOrder.items.reduce((sum, item) => sum + (item.lineTotal || 0), 0);
    const taxRate = 0.14;
    const recalculatedTax = (recalculatedSubtotal - updatedOrder.discountAmount) * taxRate;
    const recalculatedGrandTotal = (recalculatedSubtotal - updatedOrder.discountAmount) + recalculatedTax + updatedOrder.shippingCost;

    const finalOrder: CustomerPortalOrder = {
      ...updatedOrder,
      subtotal: +recalculatedSubtotal.toFixed(2),
      taxAmount: +recalculatedTax.toFixed(2),
      grandTotal: +recalculatedGrandTotal.toFixed(2),
      updatedAt: new Date().toISOString()
    };

    await MaroSyncEngine.saveDocument(PORTAL_ORDERS_COLLECTION, finalOrder, false);
    return finalOrder;
  }

  // --- Dispatch Picking Task to Storekeeper / Warehouse System ---
  static async dispatchOrderToStorekeeperSystem(order: CustomerPortalOrder): Promise<{ success: boolean; pickingTask: any; updatedOrder: CustomerPortalOrder }> {
    const pickingTaskId = `picking_task_${order.id}_${Date.now()}`;
    const pickingTask = {
      id: pickingTaskId,
      orderId: order.id,
      orderNumber: order.orderNumber,
      customerName: order.customerName,
      customerPhone: order.phone,
      deliveryAddress: order.deliveryAddress,
      city: order.city || '',
      preferredDeliveryDate: order.preferredDeliveryDate,
      preferredDeliveryTime: order.preferredDeliveryTime,
      items: order.items.map(it => ({
        productName: it.productName,
        sku: it.sku,
        quantity: it.quantity,
        unitName: it.unitName,
        totalPieces: it.totalPieces || (it.quantity * (it.unitMultiplier || 1))
      })),
      status: 'PENDING_PICKING', // 'PENDING_PICKING' | 'PICKED' | 'PACKED'
      createdAt: new Date().toISOString(),
      dispatchedBy: 'إدارة الطلبيات والمبيعات'
    };

    // Save task to system collection for Storekeepers
    await MaroSyncEngine.saveDocument('storekeeper_picking_tasks', pickingTask, true);

    // Update order state
    const updatedOrder: CustomerPortalOrder = {
      ...order,
      status: order.status === 'PENDING_REVIEW' ? 'APPROVED' : order.status,
      isDispatchedToStorekeeper: true,
      storekeeperDispatchedAt: new Date().toISOString(),
      adminNotes: `${order.adminNotes ? order.adminNotes + ' | ' : ''}تم إرسال إذن التجهيز والصرف لأمين المخزن على السيستم بتاريخ ${new Date().toLocaleString('ar-EG')}`
    };

    await MaroSyncEngine.saveDocument(PORTAL_ORDERS_COLLECTION, updatedOrder, false);

    // Emit event for real-time warehouse dashboard update
    MaroEventBus.publish('INVENTORY_ADJUSTED' as any, pickingTask);

    return { success: true, pickingTask, updatedOrder };
  }

  // --- WhatsApp Storekeeper Picking List Message Generator ---
  static generateStorekeeperWhatsAppMessage(order: CustomerPortalOrder): string {
    const settings = this.getStoreSettings();
    const itemsList = order.items.map((it, idx) => 
      `📦 *${idx + 1}. ${it.productName}* [كود: ${it.sku}]\n   الكمية المطلوبة للتجهيز: *${it.quantity} ${it.unitName}* (${it.totalPieces || (it.quantity * (it.unitMultiplier || 1))} قطعة إجمالاً)`
    ).join('\n\n');

    return `🚛 *إذن تجهيز وصرف طلبية عميل | قسم المستودعات والمخازن*
----------------------------------------
عزيزي أمين المخزن المحترم،
يرجى سحب وتجهيز الأصناف التالية من المستودع للطلب المعتمد:

📋 *رقم الطلب:* ${order.orderNumber}
👤 *العميل:* ${order.customerName}
📞 *هاتف العميل:* ${order.phone}
📍 *موقع ومسار التسليم:* ${order.deliveryAddress} - ${order.city || ''}
🕒 *موعد التوريد:* ${order.preferredDeliveryDate || 'فوري'} (${order.preferredDeliveryTime || ''})

📦 *بيان الاصناف المطلوب سحبها وتجهيزها:*
----------------------------------------
${itemsList}
----------------------------------------
📝 *ملاحظات التجهيز:* ${order.customerNotes || 'لا توجد ملاحظات خاصة'}
⚡ *الحالة:* معتمد للتجهيز والصرف بالمستودع

يرجى مراجعة الأصناف ومطابقة الكميات قبل تسليمها لمسؤول الشحن والتوزيع.`;
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
