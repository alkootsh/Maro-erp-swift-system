/**
 * @file productMaster.ts
 * @module تعريفات الأنواع والبيانات (TypeScript Types)
 * @description ملف جزء من نظام MARO ERP. الوظيفة: productMaster.ts.
 */
// MARO ERP - Sprint 7: Product & Inventory Foundation Enterprise Types

export interface ProductCategory {
  id: string;
  name: string;
  code: string;
  description?: string;
  parentId?: string | null;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export interface ProductGroup {
  id: string;
  name: string;
  code: string;
  categoryId: string;
  categoryName?: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Brand {
  id: string;
  name: string;
  code: string;
  logoUrl?: string;
  website?: string;
  country?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Manufacturer {
  id: string;
  name: string;
  code: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  country?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProductUnit {
  id: string;
  name: string; // e.g., Piece, Box, Carton
  symbol: string; // e.g., pcs, box, ctn
  factor: number; // conversion factor relative to base unit (base unit factor = 1)
  isBaseUnit: boolean;
  barcode?: string;
  salePrice?: number;
  purchasePrice?: number;
}

export interface ProductBarcode {
  id: string;
  code: string;
  type: 'EAN13' | 'UPC' | 'CODE128' | 'CUSTOM';
  unitId?: string;
  isPrimary?: boolean;
}

export interface WarehouseLocation {
  id: string;
  warehouseId: string;
  warehouseName: string;
  aisle?: string;
  rack?: string;
  shelf?: string;
  bin?: string;
  code: string;
}

export interface WarehouseStockItem {
  warehouseId: string;
  warehouseName: string;
  locationCode?: string;
  quantity: number;
  minStock?: number;
  maxStock?: number;
  reorderPoint?: number;
}

export interface ProductPriceListItem {
  priceListId: string;
  priceListName: string; // e.g., Retail, Wholesale, VIP, Distributer
  unitId?: string;
  price: number;
  minQuantity?: number;
}

export interface ProductBatch {
  id: string;
  batchNumber: string;
  manufacturingDate?: string;
  expiryDate?: string;
  quantity: number;
  warehouseId?: string;
  warehouseName?: string;
  costPrice?: number;
  status: 'active' | 'expired' | 'quarantined';
}

export interface ProductImage {
  id: string;
  url: string;
  isPrimary: boolean;
  altText?: string;
}

export interface ProductAttachment {
  id: string;
  title: string;
  url: string;
  fileType: string;
  fileSize?: number;
}

export interface InventorySettings {
  id?: string;
  defaultValuationMethod: 'FIFO' | 'LIFO' | 'WEIGHTED_AVG';
  allowNegativeStock: boolean;
  isTaxEnabled: boolean;
  defaultTaxRate: number; // e.g. 14%
  defaultReorderLevel: number;
  enforceBatchTracking: boolean;
  enforceExpiryTracking: boolean;
  updatedAt?: string;
}

export interface WarehouseData {
  id: string;
  name: string;
  location: string;
  isMain: boolean;
  code?: string;
  managerName?: string;
  phone?: string;
}

export interface ProductMaster {
  id: string;
  name: string;
  sku: string; // Product Code
  barcode?: string;
  description: string;
  price: number; 
  costPrice: number;
  quantity: number; 
  
  // Phase 2: General Information
  nameArabic?: string;
  nameEnglish?: string;
  shortName?: string;
  brandId?: string;
  brandName?: string;
  manufacturerId?: string;
  manufacturerName?: string;
  countryOfOrigin?: string;
  model?: string;
  supplierId?: string;
  supplierName?: string;
  preferredSupplierId?: string;
  salesRepresentativeId?: string;
  status: 'active' | 'draft' | 'archived';
  notes?: string;

  // Phase 2: Classification
  groupId?: string; // restored for compatibility
  groupName?: string; // restored for compatibility
  mainGroupId?: string;
  subGroupId?: string;
  departmentId?: string;
  categoryId?: string;
  category?: string; // legacy support
  tags?: string[];
  collections?: string[];
  season?: string;
  productType?: 'standard' | 'service' | 'combo' | 'raw_material';

  // Phase 2: Inventory
  warehouseStocks: WarehouseStockItem[];
  openingBalance: number;
  openingCost?: number;
  averageCost?: number;
  lastCost?: number;
  standardCost?: number;
  reorderLevel: number; // Reorder point
  maxStockLevel?: number;
  safetyStock?: number;
  leadTimeDays?: number;
  stockPolicy?: 'fifo' | 'lifo' | 'weighted_average';
  batchTracking: boolean;
  expiryTracking: boolean;
  serialNumberTracking: boolean;
  allowNegativeStock: boolean;
  
  // Phase 2: Units
  allowFraction: boolean;
  units: ProductUnit[];
  barcodes: ProductBarcode[];
  packageSizes?: string[]; // e.g. "1x12", "1x24"

  // Phase 2: Pricing
  purchasePrice?: number;
  lastPurchasePrice?: number;
  averagePurchasePrice?: number;
  sellingPrice1?: number;
  sellingPrice2?: number;
  sellingPrice3?: number;
  wholesalePrice?: number;
  distributorPrice?: number;
  vipPrice?: number;
  onlinePrice?: number;
  restaurantPrice?: number;
  deliveryPrice?: number;
  maximumDiscountPercent?: number;
  minimumMarginPercent?: number;
  isTaxable: boolean;
  taxIncluded: boolean;
  taxRate?: number;
  priceLists: ProductPriceListItem[];

  // Phase 2: Accounting
  inventoryAccount?: string;
  salesAccount?: string;
  purchaseAccount?: string;
  cogsAccount?: string;
  vatAccount?: string;
  costCenter?: string;
  projectCode?: string;

  // Phase 2: Electronic Invoice (e-Invoice)
  gs1Code?: string;
  gtin?: string;
  hsCode?: string;
  etaCode?: string;
  zatcaCode?: string;

  // Additional data
  batches: ProductBatch[];
  images: ProductImage[];
  attachments: ProductAttachment[];
  customFields?: Record<string, any>;
  
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
}

export interface AuditLog {
  id?: string;
  module: string; // 'products' | 'categories' | 'inventory_settings'
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  targetId: string;
  targetName: string;
  userEmail?: string;
  timestamp: string;
  details?: Record<string, any>;
}
