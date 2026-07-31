// MARO ERP - Product Service Layer for Business Logic
import { ProductRepository } from '../repositories/productRepository';
import { ProductMaster, ProductUnit, ProductBatch, InventorySettings } from '../types/productMaster';
import { productMasterSchema, inventorySettingsSchema } from '../lib/productValidation';

export class ProductService {
  /**
   * Convert price or quantity based on unit factor.
   * Base unit has factor = 1.
   */
  static convertUnitQuantity(qtyInBaseUnit: number, unitFactor: number): number {
    if (!unitFactor || unitFactor <= 0) return qtyInBaseUnit;
    return qtyInBaseUnit / unitFactor;
  }

  static convertUnitPrice(basePrice: number, unitFactor: number): number {
    if (!unitFactor || unitFactor <= 0) return basePrice;
    return basePrice * unitFactor;
  }

  /**
   * Calculate overall stock level from warehouse stocks or sum of batches
   */
  static calculateTotalQuantity(product: Partial<ProductMaster>): number {
    if (product.batches && product.batches.length > 0) {
      return product.batches.reduce((sum, b) => sum + (b.quantity || 0), 0);
    }
    if (product.warehouseStocks && product.warehouseStocks.length > 0) {
      return product.warehouseStocks.reduce((sum, ws) => sum + (ws.quantity || 0), 0);
    }
    return product.quantity || 0;
  }

  /**
   * Validate & Save new product
   */
  static async createProduct(productData: Omit<ProductMaster, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    // Validate core fields with Zod
    productMasterSchema.parse({
      name: productData.name,
      sku: productData.sku,
      price: productData.price,
      costPrice: productData.costPrice || 0,
      quantity: productData.quantity,
      category: productData.category,
      reorderLevel: productData.reorderLevel || 5,
      isTaxable: productData.isTaxable !== false,
      status: productData.status || 'active'
    });

    // Ensure total quantity is synchronized
    const calculatedQty = this.calculateTotalQuantity(productData);

    const fullProduct: Omit<ProductMaster, 'id'> = {
      ...productData,
      quantity: calculatedQty,
      costPrice: productData.costPrice || 0,
      units: productData.units || [],
      barcodes: productData.barcodes || [],
      warehouseStocks: productData.warehouseStocks || [],
      priceLists: productData.priceLists || [],
      batches: productData.batches || [],
      images: productData.images || [],
      attachments: productData.attachments || [],
      reorderLevel: productData.reorderLevel || 5,
      isTaxable: productData.isTaxable !== false,
      status: productData.status || 'active',
      openingBalance: productData.openingBalance || 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    return await ProductRepository.addProduct(fullProduct);
  }

  /**
   * Validate & Update existing product
   */
  static async updateProduct(id: string, updates: Partial<ProductMaster>): Promise<void> {
    if (updates.name !== undefined || updates.sku !== undefined) {
      productMasterSchema.partial().parse(updates);
    }

    if (updates.batches || updates.warehouseStocks) {
      updates.quantity = this.calculateTotalQuantity(updates);
    }

    await ProductRepository.updateProduct(id, updates);
  }

  /**
   * Save global inventory settings
   */
  static async updateInventorySettings(settings: InventorySettings): Promise<void> {
    inventorySettingsSchema.parse(settings);
    await ProductRepository.saveInventorySettings(settings);
  }
}
