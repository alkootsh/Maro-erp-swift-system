/**
 * @file posActionRegistry.ts
 * @module المكتبات والمحركات الأساسية (Core Libraries)
 * @description ملف جزء من نظام MARO ERP. الوظيفة: posActionRegistry.ts.
 */
// MARO ERP - Sprint 8.1 POS Action Registry Engine

import { POSActionDefinition, POSActionCategory } from '../types/posKeys';

export const DEFAULT_POS_ACTIONS: POSActionDefinition[] = [
  // --- INVOICE CATEGORY ---
  {
    id: 'NEW_INVOICE',
    titleAr: 'فاتورة جديدة',
    titleEn: 'New Invoice',
    category: 'INVOICE',
    defaultKey: 'F1',
    iconName: 'PlusCircle',
    color: 'bg-emerald-600',
    description: 'بدء فاتورة بيع جديدة أو تنظيف الشاشة'
  },
  {
    id: 'HOLD_INVOICE',
    titleAr: 'تعليق الفاتورة',
    titleEn: 'Hold Invoice',
    category: 'INVOICE',
    defaultKey: 'F6',
    iconName: 'PauseCircle',
    color: 'bg-amber-600',
    description: 'تعليق الفاتورة الحالية لإنهاء عملية لعميل آخر'
  },
  {
    id: 'RESUME_INVOICE',
    titleAr: 'استرجاع الفاتورة',
    titleEn: 'Resume Invoice',
    category: 'INVOICE',
    iconName: 'PlayCircle',
    color: 'bg-amber-500',
    description: 'استرجاع فاتورة معلقة سابقاً'
  },
  {
    id: 'SUSPEND_SALE',
    titleAr: 'تعليق البيع',
    titleEn: 'Suspend Sale',
    category: 'INVOICE',
    iconName: 'Archive',
    color: 'bg-orange-600',
    description: 'تعليق عمليات البيع بشكل مؤقت'
  },
  {
    id: 'PARK_SALE',
    titleAr: 'إيقاف مؤقت للبيع',
    titleEn: 'Park Sale',
    category: 'INVOICE',
    iconName: 'Clock',
    color: 'bg-yellow-600',
    description: 'إيقاف البيع مؤقتاً لحين عودة الكاشير'
  },
  {
    id: 'RETURN_INVOICE',
    titleAr: 'مرتجع مبيعات',
    titleEn: 'Return Invoice',
    category: 'INVOICE',
    iconName: 'RotateCcw',
    color: 'bg-purple-600',
    description: 'إنشاء مرتجع فاتورة مبيعات'
  },
  {
    id: 'EXCHANGE',
    titleAr: 'استبدال صنف',
    titleEn: 'Exchange Item',
    category: 'INVOICE',
    iconName: 'Repeat',
    color: 'bg-indigo-600',
    description: 'استبدال صنف مباع بصنف آخر'
  },
  {
    id: 'DELETE_INVOICE',
    titleAr: 'إفراغ السلة / حذف الفاتورة',
    titleEn: 'Clear Cart / Delete Invoice',
    category: 'INVOICE',
    defaultKey: 'F12',
    iconName: 'Trash2',
    color: 'bg-red-700',
    description: 'حذف جميع العناصر وإلغاء الفاتورة الحالية'
  },
  {
    id: 'VOID_INVOICE',
    titleAr: 'إلغاء الفاتورة',
    titleEn: 'Void Invoice',
    category: 'INVOICE',
    iconName: 'XCircle',
    color: 'bg-red-800',
    description: 'إلغاء وإبطال الفاتورة بالكامل'
  },

  // --- ITEM CATEGORY ---
  {
    id: 'PRODUCT_SEARCH',
    titleAr: 'بحث عن منتج',
    titleEn: 'Product Search',
    category: 'ITEM',
    iconName: 'Search',
    color: 'bg-blue-600',
    description: 'فتح شاشة البحث عن المنتجات في الدليل'
  },
  {
    id: 'MANUAL_BARCODE',
    titleAr: 'إدخال باركود يدوي',
    titleEn: 'Manual Barcode',
    category: 'ITEM',
    defaultKey: 'F3',
    iconName: 'Barcode',
    color: 'bg-purple-600',
    description: 'تركيز حقل إدخال الباركود يدوياً أو عبر الماسح الضوئي'
  },
  {
    id: 'CHANGE_QTY',
    titleAr: 'تغيير الكمية',
    titleEn: 'Change Quantity',
    category: 'ITEM',
    defaultKey: 'F4',
    iconName: 'Hash',
    color: 'bg-cyan-600',
    description: 'تعديل كمية الصنف المكتشف بالسطر الحالي'
  },
  {
    id: 'CHANGE_PRICE',
    titleAr: 'تغيير السعر',
    titleEn: 'Change Price',
    category: 'ITEM',
    iconName: 'DollarSign',
    color: 'bg-teal-600',
    description: 'تعديل سعر بيع الصنف المكتشف (للمخولين)'
  },
  {
    id: 'DISCOUNT_PERCENT',
    titleAr: 'خصم نسبة %',
    titleEn: 'Discount %',
    category: 'ITEM',
    defaultKey: 'F5',
    iconName: 'Percent',
    color: 'bg-pink-600',
    description: 'تطبيق نسبة خصم مئوية على السطر أو الفاتورة'
  },
  {
    id: 'DISCOUNT_VALUE',
    titleAr: 'خصم قيمة مبلغ',
    titleEn: 'Discount Value',
    category: 'ITEM',
    iconName: 'Tag',
    color: 'bg-rose-600',
    description: 'تطبيق خصم بمبلغ مقطوع'
  },
  {
    id: 'CHANGE_UNIT',
    titleAr: 'تغيير وحدة القياس',
    titleEn: 'Change Unit',
    category: 'ITEM',
    iconName: 'Layers',
    color: 'bg-slate-600',
    description: 'تبديل وحدة الصنف (كرتونة / قطعة / كجم)'
  },
  {
    id: 'EDIT_LINE',
    titleAr: 'تعديل السطر',
    titleEn: 'Edit Line',
    category: 'ITEM',
    iconName: 'Edit3',
    color: 'bg-sky-600',
    description: 'تعديل تفاصيل الصنف المحدد بالسلة'
  },
  {
    id: 'DELETE_ITEM',
    titleAr: 'حذف الصنف الحالي',
    titleEn: 'Delete Item',
    category: 'ITEM',
    iconName: 'MinusCircle',
    color: 'bg-red-600',
    description: 'إزالة الصنف المحدد من سلة المبيعات'
  },
  {
    id: 'WEIGHT_ENTRY',
    titleAr: 'إدخال الوزن',
    titleEn: 'Weight Entry',
    category: 'ITEM',
    iconName: 'Scale',
    color: 'bg-emerald-700',
    description: 'إدخال وزن المنتجات المباعة بالكيلو جرام'
  },
  {
    id: 'SERIAL_NUMBER',
    titleAr: 'رقم السيريال',
    titleEn: 'Serial Number',
    category: 'ITEM',
    iconName: 'QrCode',
    color: 'bg-violet-600',
    description: 'ربط رقم السيريال بالمنتج'
  },
  {
    id: 'BATCH_NUMBER',
    titleAr: 'رقم الوجبة / الشحنة',
    titleEn: 'Batch Number',
    category: 'ITEM',
    iconName: 'Boxes',
    color: 'bg-fuchsia-600',
    description: 'تحديد رقم الوجبة وتاريخ الصلاحية'
  },

  // --- PAYMENT CATEGORY ---
  {
    id: 'PAYMENT_CASH',
    titleAr: 'دفع نقدي (كاش)',
    titleEn: 'Cash Payment',
    category: 'PAYMENT',
    defaultKey: 'F7',
    iconName: 'Banknote',
    color: 'bg-emerald-500',
    description: 'إتمام عملية السداد النقدي وحساب الباقي'
  },
  {
    id: 'PAYMENT_CARD',
    titleAr: 'دفع بطاقة (فيزا / شبكة)',
    titleEn: 'Card / Visa Payment',
    category: 'PAYMENT',
    defaultKey: 'F8',
    iconName: 'CreditCard',
    color: 'bg-blue-500',
    description: 'سداد الفاتورة بواسطة الجهاز المصرفي POS'
  },
  {
    id: 'PAYMENT_SPLIT',
    titleAr: 'دفع مختلط / آجل',
    titleEn: 'Mixed / Credit Payment',
    category: 'PAYMENT',
    defaultKey: 'F9',
    iconName: 'Split',
    color: 'bg-amber-500',
    description: 'تقسيم السداد بين النقدي والبطاقة والحساب الآجل'
  },

  // --- CUSTOMER & PROMOTION CATEGORY ---
  {
    id: 'CUSTOMER_SEARCH',
    titleAr: 'بحث وتحديد عميل',
    titleEn: 'Customer Search',
    category: 'CUSTOMER',
    defaultKey: 'F2',
    iconName: 'UserCheck',
    color: 'bg-blue-600',
    description: 'اختيار العميل أو إنشاء عميل جديد'
  },
  {
    id: 'OPEN_CUSTOMER_ACCOUNT',
    titleAr: 'كشف حساب العميل',
    titleEn: 'Open Customer Account',
    category: 'CUSTOMER',
    iconName: 'FileText',
    color: 'bg-[#1e293b]',
    description: 'عرض الرصيد الحالي وسجل معاملات العميل'
  },
  {
    id: 'LOYALTY',
    titleAr: 'نقاط الولاء',
    titleEn: 'Loyalty Points',
    category: 'CUSTOMER',
    iconName: 'Award',
    color: 'bg-amber-400',
    description: 'استبدال نقاط الولاء برصيد خصم'
  },
  {
    id: 'GIFT_CARD',
    titleAr: 'بطاقة هدايا',
    titleEn: 'Gift Card',
    category: 'CUSTOMER',
    iconName: 'Gift',
    color: 'bg-pink-500',
    description: 'الدفع أو الشحن باستخدام كارت هدايا'
  },
  {
    id: 'COUPON',
    titleAr: 'كوبون قسيمة خصم',
    titleEn: 'Coupon Code',
    category: 'CUSTOMER',
    iconName: 'Ticket',
    color: 'bg-purple-500',
    description: 'إدخال رمز قسيمة الخصم الترويجية'
  },

  // --- INVENTORY & PRICING CATEGORY ---
  {
    id: 'CHANGE_WAREHOUSE',
    titleAr: 'تغيير المستودع',
    titleEn: 'Change Warehouse',
    category: 'INVENTORY',
    iconName: 'Warehouse',
    color: 'bg-orange-700',
    description: 'تحديد مستودع الصرف المباشر للفاتورة'
  },
  {
    id: 'CHANGE_PRICE_LIST',
    titleAr: 'تغيير قائمة الأسعار',
    titleEn: 'Change Price List',
    category: 'INVENTORY',
    iconName: 'ListFilter',
    color: 'bg-indigo-700',
    description: 'التبديل بين قطاعي / جملة / موزع'
  },
  {
    id: 'STOCK_INQUIRY',
    titleAr: 'استعلام المخزون',
    titleEn: 'Stock Inquiry',
    category: 'INVENTORY',
    iconName: 'PackageCheck',
    color: 'bg-teal-700',
    description: 'فحص كمية الصنف المتوفرة بكافة الفروع'
  },
  {
    id: 'PRODUCT_INQUIRY',
    titleAr: 'استعلام المنتج',
    titleEn: 'Product Inquiry',
    category: 'INVENTORY',
    iconName: 'Info',
    color: 'bg-blue-700',
    description: 'عرض البطاقة التعريفية الشاملة للمنتج'
  },
  {
    id: 'PRICE_CHECK',
    titleAr: 'فحص سعر صنف',
    titleEn: 'Price Check',
    category: 'INVENTORY',
    iconName: 'HelpCircle',
    color: 'bg-sky-700',
    description: 'الاستعلام عن سعر بيع الصنف عبر الباركود'
  },

  // --- SHIFT & SYSTEM CATEGORY ---
  {
    id: 'CLOSE_SHIFT',
    titleAr: 'إغلاق الوردية Z-Report',
    titleEn: 'Close Shift Z-Report',
    category: 'SHIFT',
    defaultKey: 'F10',
    iconName: 'Lock',
    color: 'bg-red-600',
    description: 'إغلاق الوردية وجرد النقدية وإصدار تقرير Z'
  },
  {
    id: 'X_REPORT',
    titleAr: 'تقرير X منتصف الوردية',
    titleEn: 'X-Report',
    category: 'SHIFT',
    iconName: 'BarChart2',
    color: 'bg-slate-700',
    description: 'عرض ملخص مبيعات الوردية دون إغلاقها'
  },
  {
    id: 'Z_REPORT',
    titleAr: 'طباعة تقرير Z الأخير',
    titleEn: 'Print Last Z-Report',
    category: 'SHIFT',
    iconName: 'Printer',
    color: 'bg-[#1e293b]',
    description: 'إعادة طباعة آخر تقرير وردية'
  },
  {
    id: 'OPEN_DRAWER',
    titleAr: 'فتح درج النقدية',
    titleEn: 'Open Cash Drawer',
    category: 'SYSTEM',
    iconName: 'Unlock',
    color: 'bg-[#334155]',
    description: 'إرسال أمر فتح لدرج النقدية الإلكتروني'
  },
  {
    id: 'PRINT_INVOICE',
    titleAr: 'طباعة الفاتورة',
    titleEn: 'Print Invoice',
    category: 'SYSTEM',
    iconName: 'Printer',
    color: 'bg-slate-600',
    description: 'طباعة الإيصال الحالي على طابعة الفواتير'
  },
  {
    id: 'REPRINT_INVOICE',
    titleAr: 'إعادة طباعة آخر إيصال',
    titleEn: 'Reprint Last Receipt',
    category: 'SYSTEM',
    iconName: 'Copy',
    color: 'bg-zinc-600',
    description: 'طباعة نسخة ثانية من آخر عملية مباعة'
  },
  {
    id: 'CALCULATOR',
    titleAr: 'الآلة الحاسبة',
    titleEn: 'Calculator',
    category: 'SYSTEM',
    defaultKey: 'F11',
    iconName: 'Calculator',
    color: 'bg-slate-700',
    description: 'فتح الحاسبة المدمجة على الشاشة'
  },
  {
    id: 'ADD_NOTES',
    titleAr: 'إضافة ملاحظات الفاتورة',
    titleEn: 'Add Invoice Notes',
    category: 'SYSTEM',
    iconName: 'MessageSquare',
    color: 'bg-gray-600',
    description: 'كتابة ملاحظات أو شروط خاصة بالفاتورة'
  }
];

class POSActionRegistryManager {
  private actions: Map<string, POSActionDefinition> = new Map();
  private listeners: Set<() => void> = new Set();

  constructor() {
    // Pre-populate with default actions
    DEFAULT_POS_ACTIONS.forEach(act => this.actions.set(act.id, act));
  }

  public getActions(): POSActionDefinition[] {
    return Array.from(this.actions.values());
  }

  public getAction(id: string): POSActionDefinition | undefined {
    return this.actions.get(id);
  }

  public getActionsByCategory(category: POSActionCategory): POSActionDefinition[] {
    return this.getActions().filter(a => a.category === category);
  }

  /**
   * Requirement 4: Dynamically register plugin / custom POS actions
   */
  public registerAction(action: POSActionDefinition): void {
    const formattedAction: POSActionDefinition = {
      ...action,
      isPlugin: action.isPlugin ?? true,
      category: action.category || 'PLUGIN',
      color: action.color || 'bg-violet-600'
    };
    this.actions.set(formattedAction.id, formattedAction);
    this.notify();
  }

  public registerPluginActions(actions: POSActionDefinition[]): void {
    actions.forEach(a => this.registerAction(a));
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.listeners.forEach(l => l());
  }
}

export const PosActionRegistry = new POSActionRegistryManager();
