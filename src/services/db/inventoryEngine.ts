/**
 * @file inventoryEngine.ts
 * @module خدمات النظام (Services)
 * @description ملف جزء من نظام MARO ERP. الوظيفة: inventoryEngine.ts.
 */
import { eq, and, sql, desc } from 'drizzle-orm';
import { db } from '../../db';
import { products, warehouses, stockLedger } from '../../db/schema';

export interface ProductInput {
  tenantId: string;
  code: string;
  barcode?: string;
  name: string;
  type?: string;
  costPrice?: number;
  salePrice?: number;
  taxRate?: number;
  stockQuantity?: number;
  unit?: string;
  category?: string;
  metadata?: any;
}

export class InventoryEngine {
  /**
   * Get or create default warehouse for tenant
   */
  static async getOrCreateDefaultWarehouse(tenantId: string) {
    try {
      const existing = await db.select().from(warehouses).where(eq(warehouses.tenantId, tenantId)).limit(1);
      if (existing.length > 0) return existing[0];

      const [created] = await db.insert(warehouses).values({
        tenantId,
        code: 'WH-MAIN',
        name: 'المستودع الرئيسي (Main Warehouse)',
        isActive: true
      }).returning();

      return created;
    } catch (e) {
      console.error("Failed to get/create default warehouse", e);
      return { id: '00000000-0000-0000-0000-000000000002', name: 'المستودع الرئيسي' };
    }
  }

  /**
   * Get all products with calculated real-time inventory balances
   */
  static async getProducts(tenantId: string) {
    try {
      const allProducts = await db.select().from(products).where(eq(products.tenantId, tenantId));
      return allProducts.map(p => ({
        id: p.id,
        code: p.code,
        barcode: p.barcode || '',
        name: p.name,
        type: p.type,
        costPrice: parseFloat(p.costPrice || '0'),
        salePrice: parseFloat(p.salePrice || '0'),
        taxRate: parseFloat(p.taxRate || '15'),
        stockQuantity: parseFloat(p.stockQuantity || '0'),
        unit: p.unit || 'PCS',
        category: p.category || 'General',
        isActive: p.isActive,
        metadata: p.metadata || {}
      }));
    } catch (e) {
      console.error("Failed to query products from DB", e);
      return [];
    }
  }

  /**
   * Create or update product with automatic opening stock ledger entry
   */
  static async upsertProduct(input: ProductInput) {
    return await db.transaction(async (tx) => {
      const existing = await tx.select().from(products)
        .where(and(eq(products.tenantId, input.tenantId), eq(products.code, input.code)))
        .limit(1);

      let productRecord;

      if (existing.length > 0) {
        const [updated] = await tx.update(products)
          .set({
            name: input.name,
            barcode: input.barcode || existing[0].barcode,
            type: input.type || existing[0].type,
            costPrice: input.costPrice !== undefined ? input.costPrice.toString() : existing[0].costPrice,
            salePrice: input.salePrice !== undefined ? input.salePrice.toString() : existing[0].salePrice,
            taxRate: input.taxRate !== undefined ? input.taxRate.toString() : existing[0].taxRate,
            stockQuantity: input.stockQuantity !== undefined ? input.stockQuantity.toString() : existing[0].stockQuantity,
            unit: input.unit || existing[0].unit,
            category: input.category || existing[0].category,
            metadata: input.metadata || existing[0].metadata
          })
          .where(eq(products.id, existing[0].id))
          .returning();
        productRecord = updated;
      } else {
        const [created] = await tx.insert(products).values({
          tenantId: input.tenantId,
          code: input.code,
          barcode: input.barcode || '',
          name: input.name,
          type: input.type || 'Stock',
          costPrice: (input.costPrice || 0).toString(),
          salePrice: (input.salePrice || 0).toString(),
          taxRate: (input.taxRate || 15).toString(),
          stockQuantity: (input.stockQuantity || 0).toString(),
          unit: input.unit || 'PCS',
          category: input.category || 'General',
          metadata: input.metadata || {}
        }).returning();
        productRecord = created;

        // If opening stock > 0, log in stock ledger
        if (input.stockQuantity && input.stockQuantity > 0) {
          const wh = await this.getOrCreateDefaultWarehouse(input.tenantId);
          await tx.insert(stockLedger).values({
            tenantId: input.tenantId,
            productId: productRecord.id,
            warehouseId: wh.id,
            transactionType: 'OpeningBalance',
            reference: 'INIT-STOCK',
            quantity: input.stockQuantity.toString(),
            unitCost: (input.costPrice || 0).toString(),
            totalCost: ((input.stockQuantity || 0) * (input.costPrice || 0)).toString(),
            metadata: { note: 'رصيد افتتاحي للمنتج' }
          });
        }
      }

      return productRecord;
    });
  }

  /**
   * Record Stock Movement (Incoming / Outgoing / Transfer / Adjustment)
   */
  static async recordStockMovement(
    tenantId: string,
    productId: string,
    warehouseId: string,
    transactionType: 'Purchase' | 'Sale' | 'Adjustment' | 'Transfer' | 'POS' | 'OpeningBalance',
    quantity: number, // Positive for in, negative for out
    unitCost: number,
    reference?: string,
    metadata: any = {}
  ) {
    return await db.transaction(async (tx) => {
      // 1. Insert immutable ledger entry
      const totalCost = Math.abs(quantity) * unitCost;
      const [ledgerEntry] = await tx.insert(stockLedger).values({
        tenantId,
        productId,
        warehouseId,
        transactionType,
        reference: reference || 'TX-' + Date.now(),
        quantity: quantity.toString(),
        unitCost: unitCost.toString(),
        totalCost: totalCost.toString(),
        metadata
      }).returning();

      // 2. Atomically update product stockQuantity
      await tx.update(products)
        .set({
          stockQuantity: sql`${products.stockQuantity} + ${quantity.toString()}::numeric`
        })
        .where(eq(products.id, productId));

      return ledgerEntry;
    });
  }

  /**
   * Get Stock Ledger audit history
   */
  static async getStockLedger(tenantId: string, productId?: string) {
    try {
      let query = db.select({
        id: stockLedger.id,
        productId: stockLedger.productId,
        productName: products.name,
        productCode: products.code,
        warehouseId: stockLedger.warehouseId,
        transactionType: stockLedger.transactionType,
        reference: stockLedger.reference,
        quantity: stockLedger.quantity,
        unitCost: stockLedger.unitCost,
        totalCost: stockLedger.totalCost,
        date: stockLedger.date,
        metadata: stockLedger.metadata
      })
      .from(stockLedger)
      .leftJoin(products, eq(stockLedger.productId, products.id))
      .where(eq(stockLedger.tenantId, tenantId))
      .orderBy(desc(stockLedger.date));

      return await query;
    } catch (e) {
      console.error("Failed to query stock ledger", e);
      return [];
    }
  }
}
