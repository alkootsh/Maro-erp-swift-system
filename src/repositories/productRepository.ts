// MARO ERP - Operational Data Repository (MARO Sync Engine + PostgreSQL Architecture)
import { MaroSyncEngine } from '../lib/maroSyncEngine';
import { 
  ProductMaster, 
  ProductCategory, 
  ProductGroup, 
  Brand, 
  Manufacturer, 
  InventorySettings,
  AuditLog
} from '../types/productMaster';

export class ProductRepository {
  private static PRODUCTS_COLL = 'products';
  private static CATEGORIES_COLL = 'product_categories';
  private static GROUPS_COLL = 'product_groups';
  private static BRANDS_COLL = 'brands';
  private static MANUFACTURERS_COLL = 'manufacturers';
  private static INVENTORY_SETTINGS_COLL = 'inventory_settings';
  private static AUDIT_COLL = 'audit_logs';

  // Synchronous getters from local sync engine store
  static getProducts(): ProductMaster[] {
    return MaroSyncEngine.getLocalCollection<ProductMaster>(this.PRODUCTS_COLL);
  }

  static getProductByIdSync(id: string): ProductMaster | null {
    return MaroSyncEngine.getLocalDocument<ProductMaster>(this.PRODUCTS_COLL, id);
  }

  // --- Audit Logging ---
  static async logAudit(action: 'CREATE' | 'UPDATE' | 'DELETE', moduleName: string, targetId: string, targetName: string, details?: Record<string, any>) {
    try {
      const logItem: AuditLog = {
        module: moduleName,
        action,
        targetId,
        targetName,
        userEmail: 'user@maro-erp.local',
        timestamp: new Date().toISOString(),
        details: details || {}
      };
      await MaroSyncEngine.saveDocument(this.AUDIT_COLL, { id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`, ...logItem }, true);
    } catch (err) {
      console.warn('Audit logging failed (non-critical):', err);
    }
  }

  // --- Products Master ---
  static subscribeProducts(onData: (products: ProductMaster[]) => void, onError?: (err: any) => void): () => void {
    return MaroSyncEngine.subscribe<ProductMaster>(this.PRODUCTS_COLL, onData);
  }

  static async getProductById(id: string): Promise<ProductMaster | null> {
    return MaroSyncEngine.getLocalDocument<ProductMaster>(this.PRODUCTS_COLL, id);
  }

  static async addProduct(product: Omit<ProductMaster, 'id'>): Promise<string> {
    const newId = `prod_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;
    const fullProduct: ProductMaster = {
      ...product,
      id: newId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    await MaroSyncEngine.saveDocument(this.PRODUCTS_COLL, fullProduct, true);
    await this.logAudit('CREATE', 'products', newId, product.name, { sku: product.sku });
    return newId;
  }

  static async updateProduct(id: string, productData: Partial<ProductMaster>): Promise<void> {
    const existing = this.getProductByIdSync(id);
    const updated: ProductMaster = {
      ...(existing || { id, name: '', sku: '', description: '', price: 0, costPrice: 0, quantity: 0, category: '', isTaxable: true, status: 'active', units: [], barcodes: [], warehouseStocks: [], priceLists: [], batches: [], images: [], attachments: [], openingBalance: 0, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }),
      ...productData,
      id,
      updatedAt: new Date().toISOString()
    } as ProductMaster;
    await MaroSyncEngine.saveDocument(this.PRODUCTS_COLL, updated, false);
    await this.logAudit('UPDATE', 'products', id, productData.name || id, productData);
  }

  static async deleteProduct(id: string, name?: string): Promise<void> {
    await MaroSyncEngine.deleteDocument(this.PRODUCTS_COLL, id);
    await this.logAudit('DELETE', 'products', id, name || id);
  }

  // --- Categories ---
  static subscribeCategories(onData: (categories: ProductCategory[]) => void, onError?: (err: any) => void): () => void {
    return MaroSyncEngine.subscribe<ProductCategory>(this.CATEGORIES_COLL, onData);
  }

  static async addCategory(category: Omit<ProductCategory, 'id'>): Promise<string> {
    const newId = `cat_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;
    const fullCat: ProductCategory = {
      ...category,
      id: newId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    await MaroSyncEngine.saveDocument(this.CATEGORIES_COLL, fullCat, true);
    await this.logAudit('CREATE', 'categories', newId, category.name);
    return newId;
  }

  static async updateCategory(id: string, data: Partial<ProductCategory>): Promise<void> {
    const existing = MaroSyncEngine.getLocalDocument<ProductCategory>(this.CATEGORIES_COLL, id);
    const updated: ProductCategory = {
      ...(existing || { id, name: '', code: '', description: '', status: 'active', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }),
      ...data,
      id,
      updatedAt: new Date().toISOString()
    } as ProductCategory;
    await MaroSyncEngine.saveDocument(this.CATEGORIES_COLL, updated, false);
    await this.logAudit('UPDATE', 'categories', id, data.name || id);
  }

  static async deleteCategory(id: string, name?: string): Promise<void> {
    await MaroSyncEngine.deleteDocument(this.CATEGORIES_COLL, id);
    await this.logAudit('DELETE', 'categories', id, name || id);
  }

  // --- Product Groups ---
  static subscribeGroups(onData: (groups: ProductGroup[]) => void, onError?: (err: any) => void): () => void {
    return MaroSyncEngine.subscribe<ProductGroup>(this.GROUPS_COLL, onData);
  }

  static async addGroup(group: Omit<ProductGroup, 'id'>): Promise<string> {
    const newId = `grp_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;
    const fullGrp: ProductGroup = {
      ...group,
      id: newId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    await MaroSyncEngine.saveDocument(this.GROUPS_COLL, fullGrp, true);
    await this.logAudit('CREATE', 'product_groups', newId, group.name);
    return newId;
  }

  static async deleteGroup(id: string, name?: string): Promise<void> {
    await MaroSyncEngine.deleteDocument(this.GROUPS_COLL, id);
    await this.logAudit('DELETE', 'product_groups', id, name || id);
  }

  // --- Brands ---
  static subscribeBrands(onData: (brands: Brand[]) => void, onError?: (err: any) => void): () => void {
    return MaroSyncEngine.subscribe<Brand>(this.BRANDS_COLL, onData);
  }

  static async addBrand(brand: Omit<Brand, 'id'>): Promise<string> {
    const newId = `brand_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;
    const fullBrand: Brand = {
      ...brand,
      id: newId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    await MaroSyncEngine.saveDocument(this.BRANDS_COLL, fullBrand, true);
    await this.logAudit('CREATE', 'brands', newId, brand.name);
    return newId;
  }

  static async deleteBrand(id: string, name?: string): Promise<void> {
    await MaroSyncEngine.deleteDocument(this.BRANDS_COLL, id);
    await this.logAudit('DELETE', 'brands', id, name || id);
  }

  // --- Manufacturers ---
  static subscribeManufacturers(onData: (mfrs: Manufacturer[]) => void, onError?: (err: any) => void): () => void {
    return MaroSyncEngine.subscribe<Manufacturer>(this.MANUFACTURERS_COLL, onData);
  }

  static async addManufacturer(mfr: Omit<Manufacturer, 'id'>): Promise<string> {
    const newId = `mfr_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;
    const fullMfr: Manufacturer = {
      ...mfr,
      id: newId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    await MaroSyncEngine.saveDocument(this.MANUFACTURERS_COLL, fullMfr, true);
    await this.logAudit('CREATE', 'manufacturers', newId, mfr.name);
    return newId;
  }

  static async deleteManufacturer(id: string, name?: string): Promise<void> {
    await MaroSyncEngine.deleteDocument(this.MANUFACTURERS_COLL, id);
    await this.logAudit('DELETE', 'manufacturers', id, name || id);
  }

  // --- Inventory Settings ---
  static async getInventorySettings(): Promise<InventorySettings> {
    const doc = MaroSyncEngine.getLocalDocument<InventorySettings>(this.INVENTORY_SETTINGS_COLL, 'global');
    if (doc) return doc;

    const defaultSettings: InventorySettings = {
      defaultValuationMethod: 'FIFO',
      allowNegativeStock: false,
      defaultTaxRate: 14,
      defaultReorderLevel: 5,
      enforceBatchTracking: false,
      enforceExpiryTracking: false,
      updatedAt: new Date().toISOString()
    };
    await MaroSyncEngine.saveDocument(this.INVENTORY_SETTINGS_COLL, { id: 'global', ...defaultSettings }, true);
    return defaultSettings;
  }

  static async saveInventorySettings(settings: InventorySettings): Promise<void> {
    await MaroSyncEngine.saveDocument(this.INVENTORY_SETTINGS_COLL, { id: 'global', ...settings }, false);
    await this.logAudit('UPDATE', 'inventory_settings', 'global', 'Global Inventory Settings', settings);
  }
}
