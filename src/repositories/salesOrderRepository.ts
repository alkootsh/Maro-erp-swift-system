// MARO ERP - Sales Orders & Delivery Repository
import { SalesOrder, SalesOrderItem } from '../types/sprint8';
import { MaroSyncEngine } from '../lib/maroSyncEngine';
import { ProductRepository } from './productRepository';
import { CreditValidationEngine } from '../services/creditValidationEngine';
import { InventoryRepository } from './inventoryRepository';
import { SalesRepository } from './salesRepository';

const SALES_ORDER_COLLECTION = 'sales_orders';

export class SalesOrderRepository {
  static getSalesOrders(): SalesOrder[] {
    return MaroSyncEngine.getLocalCollection<SalesOrder>(SALES_ORDER_COLLECTION)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  static getSalesOrderById(id: string): SalesOrder | null {
    return MaroSyncEngine.getLocalDocument<SalesOrder>(SALES_ORDER_COLLECTION, id);
  }

  static async createSalesOrder(orderData: Omit<SalesOrder, 'id' | 'orderNumber' | 'createdAt'>): Promise<SalesOrder> {
    const list = this.getSalesOrders();
    const orderNumber = `SO-2026-${String(list.length + 1).padStart(5, '0')}`;
    const id = `so_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;
    const createdAt = new Date().toISOString();

    const grandTotal = orderData.items.reduce((sum, item) => sum + (item.orderedQty * item.unitPrice), 0);

    // Validate Customer Credit Limit before confirming order
    if (orderData.customerId) {
      const creditCheck = CreditValidationEngine.validateCustomerCredit(orderData.customerId, grandTotal);
      if (!creditCheck.allowed) {
        throw new Error(creditCheck.reason || 'تم تجاوز الحد الائتماني المسموح به للعميل');
      }
    }

    const order: SalesOrder = {
      ...orderData,
      id,
      orderNumber,
      grandTotal,
      orderStatus: orderData.orderStatus || 'CONFIRMED',
      deliveryStatus: orderData.deliveryStatus || 'PENDING',
      paymentStatus: 'UNPAID',
      createdAt,
      updatedAt: createdAt
    };

    await MaroSyncEngine.saveDocument(SALES_ORDER_COLLECTION, order, true);
    await ProductRepository.logAudit('CREATE', SALES_ORDER_COLLECTION, id, orderNumber);
    return order;
  }

  // Record Partial or Full Delivery against Sales Order
  static async recordDelivery(
    orderId: string,
    deliveredItems: { productId: string; quantity: number }[]
  ): Promise<SalesOrder> {
    const order = this.getSalesOrderById(orderId);
    if (!order) throw new Error('أمر المبيعات غير موجود');

    let allFullyDelivered = true;

    const updatedItems: SalesOrderItem[] = order.items.map(item => {
      const match = deliveredItems.find(d => d.productId === item.productId);
      const newDelivered = item.deliveredQty + (match ? match.quantity : 0);
      
      if (newDelivered < item.orderedQty) {
        allFullyDelivered = false;
      }

      return {
        ...item,
        deliveredQty: Math.min(newDelivered, item.orderedQty)
      };
    });

    // Record Stock Movement
    for (const dItem of deliveredItems) {
      if (dItem.quantity > 0) {
        const prod = ProductRepository.getProductByIdSync(dItem.productId);
        await InventoryRepository.recordMovement({
          productId: dItem.productId,
          productName: prod?.name || 'منتج مبيعات',
          sku: prod?.sku || 'SKU',
          warehouseId: order.warehouseId || 'wh_main',
          type: 'SALE',
          quantity: -dItem.quantity,
          unitCost: prod?.costPrice || 0,
          referenceId: orderId,
          referenceNo: order.orderNumber,
          notes: `تسليم أمر مبيعات رقم ${order.orderNumber}`
        });
      }
    }

    const deliveryStatus = allFullyDelivered ? 'DELIVERED' : 'PARTIAL';

    const updatedOrder: SalesOrder = {
      ...order,
      items: updatedItems,
      deliveryStatus,
      updatedAt: new Date().toISOString()
    };

    await MaroSyncEngine.saveDocument(SALES_ORDER_COLLECTION, updatedOrder, false);
    return updatedOrder;
  }
}
