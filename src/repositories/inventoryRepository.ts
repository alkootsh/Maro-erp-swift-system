// MARO ERP - Inventory Movement & Stock Transfer Repository
import { InventoryMovement } from '../types/sprint8';
import { MaroSyncEngine } from '../lib/maroSyncEngine';
import { ProductRepository } from './productRepository';
import { MaroEventBus } from '../lib/eventBus';

const MOVEMENT_COLLECTION = 'inventory_movements';

export class InventoryRepository {
  static getMovements(): InventoryMovement[] {
    return MaroSyncEngine.getLocalCollection<InventoryMovement>(MOVEMENT_COLLECTION)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  static async recordMovement(movement: Omit<InventoryMovement, 'id' | 'createdAt'>): Promise<string> {
    const id = `mv_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;
    const fullMovement: InventoryMovement = {
      ...movement,
      id,
      createdAt: new Date().toISOString()
    };

    // Update Product Stock In Specified Warehouse or Main Stock
    const product = ProductRepository.getProductByIdSync(movement.productId);
    if (product) {
      // Find or create warehouse stock item
      const whStocks = [...(product.warehouseStocks || [])];
      const whIndex = whStocks.findIndex(w => w.warehouseId === movement.warehouseId);
      
      if (whIndex >= 0) {
        whStocks[whIndex].quantity += movement.quantity;
      } else {
        whStocks.push({
          warehouseId: movement.warehouseId,
          warehouseName: movement.warehouseName || 'المستودع الرئيسي',
          quantity: movement.quantity
        });
      }

      // Aggregate total product quantity
      const newTotalQuantity = whStocks.reduce((sum, w) => sum + w.quantity, 0);

      await ProductRepository.updateProduct(product.id, {
        warehouseStocks: whStocks,
        quantity: newTotalQuantity
      });
    }

    await MaroSyncEngine.saveDocument(MOVEMENT_COLLECTION, fullMovement, true);
    await ProductRepository.logAudit('CREATE', MOVEMENT_COLLECTION, id, `حركة ${movement.type} - ${movement.productName}`);
    await MaroEventBus.publish('StockAdjusted', { movementId: id, productId: movement.productId, quantity: movement.quantity });

    return id;
  }

  static async transferStock(
    productId: string,
    fromWarehouseId: string,
    toWarehouseId: string,
    quantity: number,
    notes?: string
  ): Promise<void> {
    if (quantity <= 0) throw new Error('الكمية المحولة يجب أن تكون أكبر من الصفر');

    const product = ProductRepository.getProductByIdSync(productId);
    if (!product) throw new Error('المنتج غير موجود');

    // Outgoing movement from source warehouse
    await this.recordMovement({
      productId,
      productName: product.name,
      sku: product.sku,
      warehouseId: fromWarehouseId,
      type: 'TRANSFER',
      quantity: -quantity,
      unitCost: product.costPrice || 0,
      notes: `تحويل مخزني صادرة إلى ${toWarehouseId}. ${notes || ''}`
    });

    // Incoming movement to target warehouse
    await this.recordMovement({
      productId,
      productName: product.name,
      sku: product.sku,
      warehouseId: toWarehouseId,
      type: 'TRANSFER',
      quantity: quantity,
      unitCost: product.costPrice || 0,
      notes: `تحويل مخزني واردة من ${fromWarehouseId}. ${notes || ''}`
    });
  }

  static async adjustStock(
    productId: string,
    warehouseId: string,
    newActualQuantity: number,
    notes?: string
  ): Promise<void> {
    const product = ProductRepository.getProductByIdSync(productId);
    if (!product) throw new Error('المنتج غير موجود');

    const whStock = product.warehouseStocks?.find(w => w.warehouseId === warehouseId);
    const currentQty = whStock ? whStock.quantity : 0;
    const diff = newActualQuantity - currentQty;

    if (diff === 0) return;

    await this.recordMovement({
      productId,
      productName: product.name,
      sku: product.sku,
      warehouseId,
      type: 'ADJUSTMENT',
      quantity: diff,
      unitCost: product.costPrice || 0,
      notes: `تسوية جردية: الفرق (${diff > 0 ? '+' : ''}${diff}). ${notes || ''}`
    });
  }
}
