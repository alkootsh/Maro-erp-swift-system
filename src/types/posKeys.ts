// MARO ERP - Sprint 8.1 POS Function Keys Customization Types

export type FunctionKey = 'F1' | 'F2' | 'F3' | 'F4' | 'F5' | 'F6' | 'F7' | 'F8' | 'F9' | 'F10' | 'F11' | 'F12';

export type POSActionCategory = 
  | 'INVOICE'      // فاتورة وبيعات
  | 'PAYMENT'      // طرق الدفع
  | 'ITEM'         // الاصناف والتعديل
  | 'CUSTOMER'     // العملاء والولاء
  | 'INVENTORY'    // المخزون والأسعار
  | 'SHIFT'        // ورديات وتقارير
  | 'SYSTEM'       // الأدوات والنظام
  | 'PLUGIN';      // الإضافات المخصصة

export interface POSActionDefinition {
  id: string;
  titleAr: string;
  titleEn: string;
  category: POSActionCategory;
  defaultKey?: FunctionKey;
  iconName: string;
  color: string;
  description?: string;
  isPlugin?: boolean;
  pluginId?: string;
}

export type POSKeyMapping = {
  [key in FunctionKey]: string; // actionId
};

export interface POSFunctionKeyConfig {
  id: string; // 'default' or terminal ID
  terminalId: string;
  mappings: POSKeyMapping;
  updatedAt: string;
  updatedBy?: string;
}
