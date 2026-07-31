// MARO ERP - Sprint 7: Zod Data Validation Schemas
import { z } from 'zod';

export const productCategorySchema = z.object({
  name: z.string().min(1, 'اسم الفئة مطلوب'),
  code: z.string().min(1, 'رمز الفئة مطلوب'),
  description: z.string().optional(),
  parentId: z.string().nullable().optional(),
  status: z.enum(['active', 'inactive']).default('active'),
});

export const productGroupSchema = z.object({
  name: z.string().min(1, 'اسم المجموعة مطلوب'),
  code: z.string().min(1, 'رمز المجموعة مطلوب'),
  categoryId: z.string().min(1, 'الفئة الرئيسية مطلوبة'),
  description: z.string().optional(),
});

export const brandSchema = z.object({
  name: z.string().min(1, 'اسم العلامة التجارية مطلوب'),
  code: z.string().min(1, 'الرمز مطلوب'),
  logoUrl: z.string().optional(),
  website: z.string().optional(),
  country: z.string().optional(),
});

export const manufacturerSchema = z.object({
  name: z.string().min(1, 'اسم المصنّع مطلوب'),
  code: z.string().min(1, 'الرمز مطلوب'),
  contactPerson: z.string().optional(),
  email: z.string().email('البريد الإلكتروني غير صالح').or(z.literal('')).optional(),
  phone: z.string().optional(),
  country: z.string().optional(),
});

export const productUnitSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'اسم الوحدة مطلوب'),
  symbol: z.string().min(1, 'رمز الوحدة مطلوب'),
  factor: z.number().min(0.0001, 'معامل التحويل يجب أن يكون أكبر من 0'),
  isBaseUnit: z.boolean(),
  barcode: z.string().optional(),
  salePrice: z.number().min(0).optional(),
  purchasePrice: z.number().min(0).optional(),
});

export const productBatchSchema = z.object({
  id: z.string(),
  batchNumber: z.string().min(1, 'رقم التشغيلة/الوجبة مطلوب'),
  manufacturingDate: z.string().optional(),
  expiryDate: z.string().optional(),
  quantity: z.number().min(0, 'الكمية لا يمكن أن تكون بالسالب'),
  warehouseId: z.string().optional(),
  warehouseName: z.string().optional(),
  costPrice: z.number().min(0).optional(),
  status: z.enum(['active', 'expired', 'quarantined']).default('active'),
});

export const productMasterSchema = z.object({
  name: z.string().min(2, 'اسم المنتج يجب أن يحتوي على حرفين على الأقل'),
  sku: z.string().min(1, 'رمز المنتج (SKU) مطلوب'),
  description: z.string().optional(),
  price: z.number().min(0, 'سعر البيع لا يمكن أن يكون بالسالب'),
  costPrice: z.number().min(0, 'سعر التكلفة لا يمكن أن يكون بالسالب'),
  quantity: z.number().min(0, 'الكمية الإجمالية لا يمكن أن تكون بالسالب'),
  category: z.string().min(1, 'الفئة مطلوبة'),
  reorderLevel: z.number().min(0, 'حد إعادة الطلب لا يمكن أن يكون بالسالب'),
  isTaxable: z.boolean().default(true),
  status: z.enum(['active', 'draft', 'archived']).default('active'),
});

export const inventorySettingsSchema = z.object({
  defaultValuationMethod: z.enum(['FIFO', 'LIFO', 'WEIGHTED_AVG']),
  allowNegativeStock: z.boolean(),
  defaultTaxRate: z.number().min(0).max(100),
  defaultReorderLevel: z.number().min(0),
  enforceBatchTracking: z.boolean(),
  enforceExpiryTracking: z.boolean(),
});
