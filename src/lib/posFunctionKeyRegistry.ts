// MARO ERP - Dynamic POS Function Keys Registry & Plugin Action Engine
// Sprint 8.1 Enterprise Customization Architecture

import { MaroSyncEngine } from './maroSyncEngine';

export type POSActionCategory = 
  | 'invoicing' 
  | 'items' 
  | 'payments' 
  | 'customer' 
  | 'reports' 
  | 'inquiry' 
  | 'plugins';

export interface POSActionDefinition {
  id: string;
  name: string; // Arabic display name
  nameEn: string;
  category: POSActionCategory;
  categoryName: string; // Arabic category name
  description: string;
  defaultKey?: string;
  defaultColor?: string;
  isPlugin?: boolean;
  pluginName?: string;
}

export interface POSKeyMapping {
  key: string; // 'F1' through 'F12'
  actionId: string;
  customLabel?: string;
  color?: string; // e.g. 'bg-emerald-600'
}

type FKeyChangeListener = () => void;
const listeners: Set<FKeyChangeListener> = new Set();

export function subscribeFKeys(listener: FKeyChangeListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function notifyListeners() {
  listeners.forEach(fn => {
    try { fn(); } catch (e) { console.error(e); }
  });
}

// Built-in POS Action Definitions (42 Comprehensive Actions)
const CORE_POS_ACTIONS: POSActionDefinition[] = [
  // 1. Invoicing & Cart Management
  { id: 'NEW_INVOICE', name: 'فاتورة جديدة', nameEn: 'New Invoice', category: 'invoicing', categoryName: 'إدارة الفواتير والبيع', description: 'بدء فاتورة مبيعات جديدة خالية', defaultKey: 'F1', defaultColor: 'bg-emerald-600' },
  { id: 'HOLD_INVOICE', name: 'تعليق الفاتورة', nameEn: 'Hold Invoice', category: 'invoicing', categoryName: 'إدارة الفواتير والبيع', description: 'حفظ الفاتورة الحالية مؤقتاً بالانتظار', defaultKey: 'F4', defaultColor: 'bg-amber-600' },
  { id: 'RESUME_INVOICE', name: 'استدعاء الفاتورة', nameEn: 'Resume Invoice', category: 'invoicing', categoryName: 'إدارة الفواتير والبيع', description: 'استرجاع الفواتير المعلقة في قائمة الانتظار', defaultKey: 'F5', defaultColor: 'bg-indigo-600' },
  { id: 'SUSPEND_SALE', name: 'إيقاف البيع مؤقتاً', nameEn: 'Suspend Sale', category: 'invoicing', categoryName: 'إدارة الفواتير والبيع', description: 'إيقاف شاشة البيع وتجميد الفاتورة', defaultColor: 'bg-amber-700' },
  { id: 'PARK_SALE', name: 'حفظ مؤقت للبيع', nameEn: 'Park Sale', category: 'invoicing', categoryName: 'إدارة الفواتير والبيع', description: 'إرسال الفاتورة إلى شاشة التجهيز/المطبخ', defaultColor: 'bg-orange-600' },
  { id: 'DELETE_INVOICE', name: 'إفراغ السلة / حذف الفاتورة', nameEn: 'Delete Invoice', category: 'invoicing', categoryName: 'إدارة الفواتير والبيع', description: 'مسح جميع الأصناف من الفاتورة الحالية', defaultKey: 'F12', defaultColor: 'bg-slate-700' },
  { id: 'VOID_INVOICE', name: 'إلغاء الفاتورة', nameEn: 'Void Invoice', category: 'invoicing', categoryName: 'إدارة الفواتير والبيع', description: 'إلغاء الفاتورة بالكامل وإلغاء عملياتها', defaultColor: 'bg-red-700' },
  { id: 'DELETE_ITEM', name: 'حذف الصنف', nameEn: 'Delete Item', category: 'invoicing', categoryName: 'إدارة الفواتير والبيع', description: 'حذف الصنف المحدد حالياً في السلة', defaultColor: 'bg-rose-600' },
  { id: 'EDIT_LINE', name: 'تعديل السطر', nameEn: 'Edit Line', category: 'invoicing', categoryName: 'إدارة الفواتير والبيع', description: 'تعديل الكمية والسعر المباشر بالسطر', defaultColor: 'bg-blue-600' },
  { id: 'ADD_NOTES', name: 'إضافة ملاحظات', nameEn: 'Add Notes', category: 'invoicing', categoryName: 'إدارة الفواتير والبيع', description: 'إضافة ملاحظات مخصصة للفاتورة أو الصنف', defaultColor: 'bg-teal-600' },
  { id: 'RETURN_INVOICE', name: 'مرتجع مبيعات', nameEn: 'Return Invoice', category: 'invoicing', categoryName: 'إدارة الفواتير والبيع', description: 'إجراء فاتورة مرتجع مبيعات بصافٍ سالب', defaultColor: 'bg-red-600' },
  { id: 'EXCHANGE', name: 'تبديل أصناف', nameEn: 'Exchange', category: 'invoicing', categoryName: 'إدارة الفواتير والبيع', description: 'عملية استبدال صنف بآخر بالفاتورة', defaultColor: 'bg-violet-600' },

  // 2. Products & Price Controls
  { id: 'PRODUCT_SEARCH', name: 'بحث عن صنف', nameEn: 'Product Search', category: 'items', categoryName: 'الأصناف والأسعار', description: 'فتح النافذة الشاملة للبحث عن المنتجات', defaultColor: 'bg-purple-600' },
  { id: 'QUANTITY', name: 'تغيير الكمية', nameEn: 'Quantity', category: 'items', categoryName: 'الأصناف والأسعار', description: 'تغيير كمية الصنف المحدد', defaultColor: 'bg-blue-600' },
  { id: 'PRICE', name: 'تغيير السعر', nameEn: 'Price Override', category: 'items', categoryName: 'الأصناف والأسعار', description: 'تغيير سعر البيع حسب الصلاحيات', defaultColor: 'bg-cyan-600' },
  { id: 'DISCOUNT_PERCENT', name: 'خصم نسبة %', nameEn: 'Discount %', category: 'items', categoryName: 'الأصناف والأسعار', description: 'تطبيق خصم نسبة مئوية على الفاتورة/الصنف', defaultColor: 'bg-pink-600' },
  { id: 'DISCOUNT_VALUE', name: 'خصم قيمة', nameEn: 'Discount Value', category: 'items', categoryName: 'الأصناف والأسعار', description: 'تطبيق خصم مبلغ ثابت على الفاتورة/الصنف', defaultColor: 'bg-fuchsia-600' },
  { id: 'CHANGE_UNIT', name: 'تغيير الوحدة', nameEn: 'Change Unit', category: 'items', categoryName: 'الأصناف والأسعار', description: 'التبديل بين وحدات القياس للصنف', defaultColor: 'bg-indigo-500' },
  { id: 'CHANGE_WAREHOUSE', name: 'تغيير المستودع', nameEn: 'Change Warehouse', category: 'items', categoryName: 'الأصناف والأسعار', description: 'تغيير المستودع المصدر للصنف', defaultColor: 'bg-sky-600' },
  { id: 'CHANGE_PRICE_LIST', name: 'تغيير قائمة الأسعار', nameEn: 'Change Price List', category: 'items', categoryName: 'الأصناف والأسعار', description: 'التبديل بين أسعار التجزئة والجملة والموزعين', defaultColor: 'bg-emerald-700' },
  { id: 'MANUAL_BARCODE', name: 'إدخال باركود يدوياً / مسح', nameEn: 'Manual Barcode', category: 'items', categoryName: 'الأصناف والأسعار', description: 'فتح حقل أو كاميرا الكشف عن الباركود', defaultKey: 'F3', defaultColor: 'bg-purple-600' },
  { id: 'WEIGHT_ENTRY', name: 'إدخال الوزن', nameEn: 'Weight Entry', category: 'items', categoryName: 'الأصناف والأسعار', description: 'إدخال الوزن المباشر من الميزان الإلكتروني', defaultColor: 'bg-amber-700' },
  { id: 'SERIAL_NUMBER', name: 'الرقم التسلسلي Serial', nameEn: 'Serial Number', category: 'items', categoryName: 'الأصناف والأسعار', description: 'إدخال السيريال نمبر للأجهزة والمنتجات', defaultColor: 'bg-slate-600' },
  { id: 'BATCH_NUMBER', name: 'رقم الشحنة Batch', nameEn: 'Batch Number', category: 'items', categoryName: 'الأصناف والأسعار', description: 'اختيار رقم التشغيلة وتاريخ الصلاحية', defaultColor: 'bg-stone-600' },

  // 3. Payments & Drawer
  { id: 'CASH_PAYMENT', name: 'دفع نقدي (Cash)', nameEn: 'Cash Payment', category: 'payments', categoryName: 'طرق التحصيل والدفع', description: 'إنهاء الفاتورة بتحصيل نقدي مباشر', defaultKey: 'F7', defaultColor: 'bg-emerald-500' },
  { id: 'VISA_PAYMENT', name: 'دفع بطاقة (Visa/Mada)', nameEn: 'Visa Payment', category: 'payments', categoryName: 'طرق التحصيل والدفع', description: 'تحصيل الفاتورة عبر جهاز الشبكة والبطاقات', defaultKey: 'F8', defaultColor: 'bg-blue-500' },
  { id: 'MIXED_PAYMENT', name: 'دفع مشترك / آجل', nameEn: 'Mixed/Credit Payment', category: 'payments', categoryName: 'طرق التحصيل والدفع', description: 'تقسيم الدفع بين نقدي وشبكة وآجل', defaultKey: 'F9', defaultColor: 'bg-amber-500' },
  { id: 'OPEN_CASH_DRAWER', name: 'فتح درج النقدية', nameEn: 'Open Cash Drawer', category: 'payments', categoryName: 'طرق التحصيل والدفع', description: 'إرسال أمر فتح درج الكاشير الإلكتروني', defaultColor: 'bg-green-600' },
  { id: 'PRINT_INVOICE', name: 'طباعة الفاتورة', nameEn: 'Print Invoice', category: 'payments', categoryName: 'طرق التحصيل والدفع', description: 'طباعة الفاتورة الحالية مباشرة', defaultColor: 'bg-blue-700' },
  { id: 'REPRINT_INVOICE', name: 'إعادة طباعة الفاتورة', nameEn: 'Reprint Invoice', category: 'payments', categoryName: 'طرق التحصيل والدفع', description: 'إعادة طباعة آخر إيصال تم إصداره', defaultColor: 'bg-indigo-700' },
  { id: 'GIFT_CARD', name: 'كارت هدايا Gift Card', nameEn: 'Gift Card', category: 'payments', categoryName: 'طرق التحصيل والدفع', description: 'الدفع باستخدام قسيمة أو كارت هدايا', defaultColor: 'bg-violet-500' },
  { id: 'COUPON', name: 'قسيمة شراء Coupon', nameEn: 'Coupon', category: 'payments', categoryName: 'طرق التحصيل والدفع', description: 'تطبيق كود خصم أو كوبون ترقية', defaultColor: 'bg-pink-500' },

  // 4. Customer & Accounts
  { id: 'CUSTOMER_SEARCH', name: 'اختيار / بحث عميل', nameEn: 'Customer Search', category: 'customer', categoryName: 'العملاء والولاء', description: 'تحديد العميل أو ربط الفاتورة بعميل محدد', defaultKey: 'F2', defaultColor: 'bg-blue-600' },
  { id: 'OPEN_CUSTOMER_ACCOUNT', name: 'فتح حساب العميل', nameEn: 'Open Customer Account', category: 'customer', categoryName: 'العملاء والولاء', description: 'عرض كشف حساب وسقف الائتمان للعميل', defaultColor: 'bg-cyan-700' },
  { id: 'LOYALTY', name: 'برنامج الولاء والنقاط', nameEn: 'Loyalty Program', category: 'customer', categoryName: 'العملاء والولاء', description: 'استبدال نقاط الولاء برصيد بالفاتورة', defaultColor: 'bg-amber-600' },

  // 5. Inquiry & System Tools
  { id: 'PRICE_CHECK', name: 'فحص السعر', nameEn: 'Price Check', category: 'inquiry', categoryName: 'الاستعلامات والأدوات', description: 'شاشة سريعة لفحص سعر الصنف للعميل', defaultColor: 'bg-emerald-800' },
  { id: 'STOCK_INQUIRY', name: 'استعلام عن المخزون', nameEn: 'Stock Inquiry', category: 'inquiry', categoryName: 'الاستعلامات والأدوات', description: 'استعلام عن الرصيد المتاح بالمستودعات', defaultColor: 'bg-teal-700' },
  { id: 'PRODUCT_INQUIRY', name: 'استعلام عن المنتج', nameEn: 'Product Inquiry', category: 'inquiry', categoryName: 'الاستعلامات والأدوات', description: 'عرض التفاصيل والبدائل المتاحة للمنتج', defaultColor: 'bg-sky-700' },
  { id: 'CALCULATOR', name: 'الحاسبة', nameEn: 'Calculator', category: 'inquiry', categoryName: 'الاستعلامات والأدوات', description: 'فتح آلة حاسبة شاشة POS السريعة', defaultColor: 'bg-slate-600' },

  // 6. Reports & Shifts
  { id: 'CLOSE_SHIFT', name: 'إغلاق الوردية Z-Report', nameEn: 'Close Shift Z-Report', category: 'reports', categoryName: 'التقارير والورديات', description: 'إنهاء الوردية ومطابقة النقدية وطباعة Z-Report', defaultKey: 'F10', defaultColor: 'bg-red-600' },
  { id: 'X_REPORT', name: 'تقرير X المالي', nameEn: 'X-Report', category: 'reports', categoryName: 'التقارير والورديات', description: 'عرض ملخص المبيعات الحالي دون إغلاق الوردية', defaultColor: 'bg-orange-700' },
  { id: 'Z_REPORT', name: 'تقرير Z النهائي', nameEn: 'Z-Report', category: 'reports', categoryName: 'التقارير والورديات', description: 'عرض تقرير Z-Report للوردية السابقة', defaultColor: 'bg-rose-700' },
];

// Default Key Mapping (F1 - F24)
const DEFAULT_KEY_MAPPINGS: POSKeyMapping[] = [
  { key: 'F1', actionId: 'NEW_INVOICE', customLabel: 'فتح جلسة / فاتورة جديدة', color: 'bg-emerald-600' },
  { key: 'F2', actionId: 'CUSTOMER_SEARCH', customLabel: 'اختيار عميل', color: 'bg-blue-600' },
  { key: 'F3', actionId: 'MANUAL_BARCODE', customLabel: 'مسح الباركود', color: 'bg-purple-600' },
  { key: 'F4', actionId: 'HOLD_INVOICE', customLabel: 'تعليق الفاتورة', color: 'bg-amber-600' },
  { key: 'F5', actionId: 'RESUME_INVOICE', customLabel: 'استدعاء الفاتورة', color: 'bg-indigo-600' },
  { key: 'F6', actionId: 'DISCOUNT_PERCENT', customLabel: 'خصم نسبة %', color: 'bg-pink-600' },
  { key: 'F7', actionId: 'CASH_PAYMENT', customLabel: 'دفع نقدي', color: 'bg-emerald-500' },
  { key: 'F8', actionId: 'VISA_PAYMENT', customLabel: 'دفع بطاقة', color: 'bg-blue-500' },
  { key: 'F9', actionId: 'MIXED_PAYMENT', customLabel: 'دفع آجل', color: 'bg-amber-500' },
  { key: 'F10', actionId: 'CLOSE_SHIFT', customLabel: 'إغلاق الوردية Z-Report', color: 'bg-red-600' },
  { key: 'F11', actionId: 'CALCULATOR', customLabel: 'الحاسبة', color: 'bg-slate-600' },
  { key: 'F12', actionId: 'DELETE_INVOICE', customLabel: 'إفراغ السلة', color: 'bg-slate-700' },

  // F13 to F24 Enterprise Extended Keys
  { key: 'F13', actionId: 'PRICE_CHECK', customLabel: 'فحص السعر', color: 'bg-teal-600' },
  { key: 'F14', actionId: 'STOCK_INQUIRY', customLabel: 'استعلام المخزون', color: 'bg-cyan-700' },
  { key: 'F15', actionId: 'OPEN_CASH_DRAWER', customLabel: 'فتح درج النقدية', color: 'bg-green-600' },
  { key: 'F16', actionId: 'RETURN_INVOICE', customLabel: 'مرتجع مبيعات', color: 'bg-red-600' },
  { key: 'F17', actionId: 'EXCHANGE', customLabel: 'تبديل صنف', color: 'bg-violet-600' },
  { key: 'F18', actionId: 'X_REPORT', customLabel: 'تقرير X المالي', color: 'bg-orange-700' },
  { key: 'F19', actionId: 'GIFT_CARD', customLabel: 'كارت هدايا', color: 'bg-pink-500' },
  { key: 'F20', actionId: 'CHANGE_PRICE_LIST', customLabel: 'تغيير قائمة الأسعار', color: 'bg-emerald-700' },
  { key: 'F21', actionId: 'CHANGE_WAREHOUSE', customLabel: 'تغيير المستودع', color: 'bg-sky-600' },
  { key: 'F22', actionId: 'ADD_NOTES', customLabel: 'إضافة ملاحظات', color: 'bg-teal-600' },
  { key: 'F23', actionId: 'WEIGHT_ENTRY', customLabel: 'وزن ميزان', color: 'bg-amber-700' },
  { key: 'F24', actionId: 'SERIAL_NUMBER', customLabel: 'رقم السيريال', color: 'bg-slate-600' },
];

const STORAGE_KEY = 'maro_erp_pos_fkeys';
const PLUGIN_ACTIONS_KEY = 'maro_erp_pos_plugin_actions';

export class POSFunctionKeyRegistry {
  private static pluginActions: POSActionDefinition[] = [];

  static init() {
    try {
      const storedPlugins = localStorage.getItem(PLUGIN_ACTIONS_KEY);
      if (storedPlugins) {
        this.pluginActions = JSON.parse(storedPlugins);
      }
    } catch {
      this.pluginActions = [];
    }
  }

  // Dynamic Plugin Action Registration API
  static registerPluginAction(action: Omit<POSActionDefinition, 'category'> & { category?: POSActionCategory }): POSActionDefinition {
    const fullAction: POSActionDefinition = {
      ...action,
      category: action.category || 'plugins',
      categoryName: action.category ? this.getCategoryName(action.category) : 'الملحقات والإضافات Dynamic Plugins',
      isPlugin: true,
      pluginName: action.pluginName || 'إضافة مخصصة Custom Plugin'
    };

    const idx = this.pluginActions.findIndex(p => p.id === fullAction.id);
    if (idx >= 0) {
      this.pluginActions[idx] = fullAction;
    } else {
      this.pluginActions.push(fullAction);
    }

    try {
      localStorage.setItem(PLUGIN_ACTIONS_KEY, JSON.stringify(this.pluginActions));
    } catch (e) {
      console.warn('Failed to save plugin actions to localStorage', e);
    }

    notifyListeners();
    return fullAction;
  }

  static getCategoryName(category: POSActionCategory): string {
    switch (category) {
      case 'invoicing': return 'إدارة الفواتير والبيع';
      case 'items': return 'الأصناف والأسعار';
      case 'payments': return 'طرق التحصيل والدفع';
      case 'customer': return 'العملاء والولاء';
      case 'reports': return 'التقارير والورديات';
      case 'inquiry': return 'الاستعلامات والأدوات';
      case 'plugins': return 'الملحقات والإضافات Dynamic Plugins';
      default: return 'عام';
    }
  }

  static getAllActions(): POSActionDefinition[] {
    this.init();
    return [...CORE_POS_ACTIONS, ...this.pluginActions];
  }

  static getActionById(actionId: string): POSActionDefinition | undefined {
    return this.getAllActions().find(a => a.id === actionId);
  }

  static getActionsByCategory(): { category: POSActionCategory; categoryName: string; actions: POSActionDefinition[] }[] {
    const all = this.getAllActions();
    const categories: POSActionCategory[] = ['invoicing', 'items', 'payments', 'customer', 'inquiry', 'reports', 'plugins'];

    return categories.map(cat => ({
      category: cat,
      categoryName: this.getCategoryName(cat),
      actions: all.filter(a => a.category === cat)
    })).filter(group => group.actions.length > 0);
  }

  static getKeyMappings(): POSKeyMapping[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to read pos function keys from localStorage', e);
    }

    return DEFAULT_KEY_MAPPINGS;
  }

  static saveKeyMappings(mappings: POSKeyMapping[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(mappings));
    } catch (e) {
      console.warn('Failed to save pos function keys to localStorage', e);
    }

    try {
      MaroSyncEngine.saveDocument('pos_function_keys', {
        id: 'terminal_01_fkeys',
        terminalId: 'term_01',
        mappings,
        updatedAt: new Date().toISOString()
      }, true);
    } catch (e) {
      console.warn('Sync engine save failed', e);
    }

    notifyListeners();
  }

  static resetToDefaults(): POSKeyMapping[] {
    this.saveKeyMappings(DEFAULT_KEY_MAPPINGS);
    return DEFAULT_KEY_MAPPINGS;
  }
}

POSFunctionKeyRegistry.init();
