/**
 * @file productValidation.ts
 * @module المكتبات والمحركات الأساسية (Core Libraries)
 * @description ملف جزء من نظام MARO ERP. الوظيفة: productValidation.ts.
 */
// MARO ERP - Master Enterprise Validation Framework: Zod Schemas
import { z } from 'zod';

export const productCategorySchema = z.object({
  name: z.string().trim().min(1, 'اسم الفئة مطلوب'),
  code: z.string().trim().min(1, 'رمز الفئة مطلوب'),
  description: z.string().optional().default(''),
  parentId: z.string().nullable().optional(),
  status: z.enum(['active', 'inactive']).default('active'),
});

export const productGroupSchema = z.object({
  name: z.string().trim().min(1, 'اسم المجموعة مطلوب'),
  code: z.string().trim().min(1, 'رمز المجموعة مطلوب'),
  categoryId: z.string().trim().min(1, 'الفئة الرئيسية مطلوبة'),
  description: z.string().optional().default(''),
});

export const brandSchema = z.object({
  name: z.string().trim().min(1, 'اسم العلامة التجارية مطلوب'),
  code: z.string().trim().min(1, 'الرمز مطلوب'),
  logoUrl: z.string().optional().default(''),
  website: z.string().optional().default(''),
  country: z.string().optional().default(''),
});

export const manufacturerSchema = z.object({
  name: z.string().trim().min(1, 'اسم المصنّع مطلوب'),
  code: z.string().trim().min(1, 'الرمز مطلوب'),
  contactPerson: z.string().optional().default(''),
  email: z.string().email('البريد الإلكتروني غير صالح').or(z.literal('')).optional().default(''),
  phone: z.string().optional().default(''),
  country: z.string().optional().default(''),
});

export const productUnitSchema = z.object({
  id: z.string(),
  name: z.string().trim().min(1, 'اسم الوحدة مطلوب'),
  symbol: z.string().trim().min(1, 'رمز الوحدة مطلوب'),
  factor: z.coerce.number().min(0.0001, 'معامل التحويل يجب أن يكون أكبر من 0'),
  isBaseUnit: z.boolean().default(false),
  barcode: z.string().optional().default(''),
  salePrice: z.coerce.number().min(0).optional().default(0),
  purchasePrice: z.coerce.number().min(0).optional().default(0),
});

export const productBatchSchema = z.object({
  id: z.string(),
  batchNumber: z.string().trim().min(1, 'رقم التشغيلة/الوجبة مطلوب'),
  manufacturingDate: z.string().optional().default(''),
  expiryDate: z.string().optional().default(''),
  quantity: z.coerce.number().min(0, 'الكمية لا يمكن أن تكون بالسالب'),
  warehouseId: z.string().optional().default(''),
  warehouseName: z.string().optional().default(''),
  costPrice: z.coerce.number().min(0).optional().default(0),
  status: z.enum(['active', 'expired', 'quarantined']).default('active'),
});

export const productMasterSchema = z.object({
  name: z.string({ required_error: 'اسم المنتج مطلوب' }).trim().min(2, 'اسم المنتج يجب أن يحتوي على حرفين على الأقل'),
  sku: z.string({ required_error: 'رمز المنتج (SKU) مطلوب' }).trim().min(1, 'رمز المنتج (SKU) مطلوب'),
  category: z.string({ required_error: 'فئة المنتج مطلوبة' }).trim().min(1, 'فئة المنتج مطلوبة'),
  price: z.coerce.number({ invalid_type_error: 'سعر البيع غير صالح' }).min(0, 'سعر البيع لا يمكن أن يكون بالسالب'),
  costPrice: z.coerce.number({ invalid_type_error: 'سعر التكلفة غير صالح' }).min(0, 'سعر التكلفة لا يمكن أن يكون بالسالب').default(0),
  quantity: z.coerce.number({ invalid_type_error: 'الكمية غير صالحة' }).min(0, 'الكمية الإجمالية لا يمكن أن تكون بالسالب').default(0),
  reorderLevel: z.coerce.number({ invalid_type_error: 'حد إعادة الطلب غير صالح' }).min(0, 'حد إعادة الطلب لا يمكن أن يكون بالسالب').default(5),
  isTaxable: z.boolean().default(true),
  status: z.enum(['active', 'draft', 'archived']).default('active'),

  description: z.string().optional().default(''),
  categoryId: z.string().optional().default(''),
  groupId: z.string().optional().default(''),
  groupName: z.string().optional().default(''),
  brandId: z.string().optional().default(''),
  brandName: z.string().optional().default(''),
  manufacturerId: z.string().optional().default(''),
  manufacturerName: z.string().optional().default(''),

  // Extended Phase 2 Fields
  nameArabic: z.string().optional().default(''),
  nameEnglish: z.string().optional().default(''),
  shortName: z.string().optional().default(''),
  countryOfOrigin: z.string().optional().default(''),
  model: z.string().optional().default(''),
  supplierId: z.string().optional().default(''),
  preferredSupplierId: z.string().optional().default(''),
  salesRepresentativeId: z.string().optional().default(''),
  notes: z.string().optional().default(''),

  mainGroupId: z.string().optional().default(''),
  subGroupId: z.string().optional().default(''),
  departmentId: z.string().optional().default(''),
  season: z.string().optional().default(''),
  productType: z.enum(['standard', 'service', 'combo', 'raw_material']).default('standard'),

  safetyStock: z.coerce.number().min(0, 'مخزون الأمان يجب أن يكون صالباً أو أكثر').default(0),
  leadTimeDays: z.coerce.number().min(0, 'فترة التوريد لا يمكن أن تكون بالسالب').default(0),
  stockPolicy: z.enum(['fifo', 'lifo', 'weighted_average']).default('fifo'),
  batchTracking: z.boolean().default(false),
  expiryTracking: z.boolean().default(false),
  serialNumberTracking: z.boolean().default(false),
  allowNegativeStock: z.boolean().default(false),
  maxStockLevel: z.coerce.number().min(0, 'الحد الأقصى للمخزون لا يمكن أن يكون بالسالب').default(0),

  allowFraction: z.boolean().default(false),

  wholesalePrice: z.coerce.number().min(0, 'سعر الجملة لا يمكن أن يكون بالسالب').default(0),
  distributorPrice: z.coerce.number().min(0, 'سعر الموزع لا يمكن أن يكون بالسالب').default(0),
  vipPrice: z.coerce.number().min(0, 'سعر VIP لا يمكن أن يكون بالسالب').default(0),
  maximumDiscountPercent: z.coerce.number().min(0, 'نسبة الخصم لا يمكن أن تكون بالسالب').max(100, 'نسبة الخصم لا تتجاوز 100%').default(0),
  minimumMarginPercent: z.coerce.number().min(0, 'نسبة الهامش لا يمكن أن تكون بالسالب').default(0),
  taxIncluded: z.boolean().default(false),

  inventoryAccount: z.string().optional().default(''),
  salesAccount: z.string().optional().default(''),
  purchaseAccount: z.string().optional().default(''),
  cogsAccount: z.string().optional().default(''),
  vatAccount: z.string().optional().default(''),
  costCenter: z.string().optional().default(''),

  gs1Code: z.string().optional().default(''),
  etaCode: z.string().optional().default(''),
  gtin: z.string().optional().default(''),
  hsCode: z.string().optional().default(''),
  zatcaCode: z.string().optional().default(''),

  units: z.array(z.any()).default([]),
  barcodes: z.array(z.any()).default([]),
  warehouseStocks: z.array(z.any()).default([]),
  priceLists: z.array(z.any()).default([]),
  batches: z.array(z.any()).default([]),
  images: z.array(z.any()).default([]),
  attachments: z.array(z.any()).default([]),
  openingBalance: z.coerce.number().default(0),
});

export type ProductMasterInput = z.infer<typeof productMasterSchema>;

export const inventorySettingsSchema = z.object({
  defaultValuationMethod: z.enum(['FIFO', 'LIFO', 'WEIGHTED_AVG']),
  allowNegativeStock: z.boolean(),
  defaultTaxRate: z.number().min(0).max(100),
  defaultReorderLevel: z.number().min(0),
  enforceBatchTracking: z.boolean(),
  enforceExpiryTracking: z.boolean(),
});
