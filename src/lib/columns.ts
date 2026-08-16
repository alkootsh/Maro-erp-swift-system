/**
 * @file columns.ts
 * @module المكتبات والمحركات الأساسية (Core Libraries)
 * @description ملف جزء من نظام MARO ERP. الوظيفة: columns.ts.
 */
export interface TableColumn {
  key: string;
  label: string;
}

export const SHIFTS_COLUMNS: TableColumn[] = [
  { key: 'id', label: 'رقم الوردية' },
  { key: 'cashierName', label: 'الكاشير المسؤول' },
  { key: 'openedAt', label: 'وقت الفتح' },
  { key: 'closedAt', label: 'وقت الإغلاق' },
  { key: 'openingBalance', label: 'العهدة الافتتاحية' },
  { key: 'totalSales', label: 'إجمالي المبيعات' },
  { key: 'totalCash', label: 'مبيعات نقدية' },
  { key: 'totalCard', label: 'مبيعات شبكة / فيزا' },
  { key: 'totalExpenses', label: 'المصروفات النثرية' },
  { key: 'closingBalance', label: 'الرصيد الفعلي' },
  { key: 'difference', label: 'الفارق (عجز/زيادة)' },
  { key: 'status', label: 'الحالة' },
  { key: 'actions', label: 'التحكم' },
];

export const SHIFTS_DEFAULT_VISIBLE = [
  'id',
  'cashierName',
  'openedAt',
  'closedAt',
  'openingBalance',
  'totalSales',
  'difference',
  'status',
  'actions'
];
