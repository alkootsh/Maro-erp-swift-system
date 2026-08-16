/**
 * @file lowStockReplenishmentService.ts
 * @module خدمات النظام (Services)
 * @description ملف جزء من نظام MARO ERP. الوظيفة: lowStockReplenishmentService.ts.
 */
// MARO ERP - Low Stock Replenishment & Purchase Automation Service
import { ProductMaster } from '../types/productMaster';
import { Supplier, PurchaseOrder, PurchaseBill, PurchaseOrderItem, PurchaseBillItem } from '../types/sprint8';
import { ProductRepository } from '../repositories/productRepository';
import { SupplierRepository } from '../repositories/supplierRepository';
import { PurchaseRepository } from '../repositories/purchaseRepository';
import { MaroEventBus } from '../lib/eventBus';
import { MaroSyncEngine } from '../lib/maroSyncEngine';

export interface ReplenishmentItem {
  productId: string;
  productName: string;
  sku: string;
  category?: string;
  currentStock: number;
  reorderLevel: number;
  maxStockLevel: number;
  recommendedQty: number;
  orderQty: number;
  unitCost: number;
  taxRate: number;
  supplierId: string;
  supplierName: string;
  supplierPhone?: string;
  urgency: 'CRITICAL' | 'HIGH' | 'MEDIUM';
}

export interface ReplenishmentResult {
  ordersCreated: PurchaseOrder[];
  billsCreated: PurchaseBill[];
  summary: {
    totalItems: number;
    totalQuantity: number;
    totalAmount: number;
    suppliersCount: number;
  };
}

export class LowStockReplenishmentService {
  /**
   * Scans products and computes recommended replenishment items with matched suppliers
   */
  static getReplenishmentRecommendations(): ReplenishmentItem[] {
    const products = ProductRepository.getProducts();
    const suppliers = SupplierRepository.getSuppliers();
    const defaultSupplier: Supplier = suppliers[0] || {
      id: 'supp_default',
      name: 'المورد الرئيسي العام',
      phone: '01000000000',
      currentBalance: 0,
      paymentTerms: 'NET30',
      status: 'active',
      createdAt: new Date().toISOString()
    };

    const recommendations: ReplenishmentItem[] = [];

    for (const p of products) {
      const stock = p.quantity || 0;
      const reorderLevel = p.reorderLevel || 10;
      const maxStock = (p as any).maxStockLevel || (reorderLevel * 3) || 50;

      if (stock <= reorderLevel) {
        // Calculate recommended replenishment quantity to bring stock up to max stock or healthy buffer
        const deficit = Math.max(maxStock - stock, 10);
        // Round to nice batch size (multiples of 5 or 10)
        const recommendedQty = Math.ceil(deficit / 5) * 5;

        // Determine urgency
        let urgency: 'CRITICAL' | 'HIGH' | 'MEDIUM' = 'MEDIUM';
        if (stock <= 0) {
          urgency = 'CRITICAL';
        } else if (stock <= reorderLevel / 2) {
          urgency = 'HIGH';
        }

        // Supplier matching
        let matchedSupplier = suppliers.find(s => s.id === (p as any).supplierId);
        if (!matchedSupplier && p.category) {
          matchedSupplier = suppliers.find(s => ((s as any).notes?.includes(p.category || '')) || s.name.includes(p.category || ''));
        }
        if (!matchedSupplier) {
          matchedSupplier = defaultSupplier;
        }

        const unitCost = p.costPrice || (p.price ? p.price * 0.7 : 50);

        recommendations.push({
          productId: p.id,
          productName: p.name,
          sku: p.sku,
          category: p.category,
          currentStock: stock,
          reorderLevel,
          maxStockLevel: maxStock,
          recommendedQty,
          orderQty: recommendedQty,
          unitCost,
          taxRate: 14,
          supplierId: matchedSupplier.id,
          supplierName: matchedSupplier.name,
          supplierPhone: matchedSupplier.phone,
          urgency
        });
      }
    }

    // Sort by urgency: CRITICAL first, then HIGH, then MEDIUM
    return recommendations.sort((a, b) => {
      const rank = { CRITICAL: 0, HIGH: 1, MEDIUM: 2 };
      return rank[a.urgency] - rank[b.urgency];
    });
  }

  /**
   * Group replenishment items by Supplier ID
   */
  static groupItemsBySupplier(items: ReplenishmentItem[]): Map<string, { supplier: { id: string; name: string; phone?: string }; items: ReplenishmentItem[] }> {
    const map = new Map<string, { supplier: { id: string; name: string; phone?: string }; items: ReplenishmentItem[] }>();

    for (const item of items) {
      if (!map.has(item.supplierId)) {
        map.set(item.supplierId, {
          supplier: {
            id: item.supplierId,
            name: item.supplierName,
            phone: item.supplierPhone
          },
          items: []
        });
      }
      map.get(item.supplierId)!.items.push(item);
    }

    return map;
  }

  /**
   * Convert selected low-stock items into Purchase Orders (RFQ / POs)
   */
  static async convertToPurchaseOrders(
    items: ReplenishmentItem[], 
    options?: { warehouseId?: string; notes?: string }
  ): Promise<PurchaseOrder[]> {
    if (!items || items.length === 0) return [];

    const grouped = this.groupItemsBySupplier(items);
    const createdPOs: PurchaseOrder[] = [];
    const warehouseId = options?.warehouseId || 'wh_main_01';

    for (const [, group] of grouped) {
      const poItems: PurchaseOrderItem[] = group.items.map((item, index) => ({
        id: `poi_${Date.now()}_${index}`,
        productId: item.productId,
        productName: item.productName,
        sku: item.sku,
        unitName: 'قطعة',
        quantity: item.orderQty,
        unitPrice: item.unitCost,
        lineTotal: item.orderQty * item.unitCost
      }));

      const totalAmount = poItems.reduce((s, i) => s + i.lineTotal, 0);

      const po = await PurchaseRepository.createPurchaseOrder({
        supplierId: group.supplier.id,
        supplierName: group.supplier.name,
        warehouseId,
        items: poItems,
        totalAmount,
        status: 'SUBMITTED'
      });

      createdPOs.push(po);
    }

    await MaroEventBus.publish('StockAdjusted', {
      action: 'REPLENISHMENT_PO_GENERATED',
      count: createdPOs.length,
      itemCount: items.length
    });

    return createdPOs;
  }

  /**
   * Convert selected low-stock items directly into Purchase Bills (Instant Goods Receipt + Supplier Payable + GL)
   */
  static async convertToPurchaseBills(
    items: ReplenishmentItem[], 
    options?: { warehouseId?: string; payImmediately?: boolean; notes?: string }
  ): Promise<PurchaseBill[]> {
    if (!items || items.length === 0) return [];

    const grouped = this.groupItemsBySupplier(items);
    const createdBills: PurchaseBill[] = [];
    const warehouseId = options?.warehouseId || 'wh_main_01';

    for (const [, group] of grouped) {
      const billItems: PurchaseBillItem[] = group.items.map((item, index) => {
        const lineUntaxed = item.orderQty * item.unitCost;
        const lineTax = lineUntaxed * ((item.taxRate || 14) / 100);
        return {
          id: `bi_${Date.now()}_${index}`,
          productId: item.productId,
          productName: item.productName,
          sku: item.sku,
          unitName: 'قطعة',
          quantity: item.orderQty,
          unitCost: item.unitCost,
          taxRate: item.taxRate || 14,
          lineTotal: lineUntaxed + lineTax
        };
      });

      const totalUntaxed = billItems.reduce((s, i) => s + (i.quantity * i.unitCost), 0);
      const totalTax = billItems.reduce((s, i) => s + ((i.quantity * i.unitCost) * (i.taxRate / 100)), 0);
      const grandTotal = totalUntaxed + totalTax;
      const paidAmount = options?.payImmediately ? grandTotal : 0;
      const dueAmount = grandTotal - paidAmount;

      const bill = await PurchaseRepository.createPurchaseBill({
        supplierId: group.supplier.id,
        supplierName: group.supplier.name,
        warehouseId,
        items: billItems,
        totalUntaxed,
        totalTax,
        grandTotal,
        paidAmount,
        dueAmount,
        status: options?.payImmediately ? 'PAID' : 'APPROVED',
        notes: options?.notes || `فاتورة شراء فورية واستلام مخزني لمعالجة نواقص الأصناف (${group.items.length} صنف)`
      });

      createdBills.push(bill);
    }

    await MaroEventBus.publish('StockAdjusted', {
      action: 'REPLENISHMENT_BILLS_GENERATED',
      count: createdBills.length,
      itemCount: items.length
    });

    return createdBills;
  }

  /**
   * Formats a formal Purchase Quotation / RFQ message for sending directly to supplier via WhatsApp
   */
  static formatSupplierOrderWhatsApp(supplier: { name: string; phone?: string }, items: ReplenishmentItem[]): string {
    const totalEst = items.reduce((s, i) => s + (i.orderQty * i.unitCost * 1.14), 0);
    const dateStr = new Date().toLocaleDateString('ar-EG', { dateStyle: 'medium' });

    let msg = `السلام عليكم ورحمة الله وبركاته،\n`;
    msg += `السادة / *${supplier.name}* المحترمين\n`;
    msg += `تحية طيبة وبعد،،،\n\n`;
    msg += `📦 *طلب توريد أصناف ونواقص مخزون عاجل*\n`;
    msg += `التاريخ: ${dateStr}\n`;
    msg += `المستودع المستلم: المستودع الرئيسي\n`;
    msg += `------------------------------------\n`;
    msg += `يرجى التكرم بتجهيز وتوريد الأصناف التالية بأسرع وقت:\n\n`;

    items.forEach((item, index) => {
      msg += `${index + 1}. *${item.productName}*\n`;
      msg += `   - كود الصنف: ${item.sku}\n`;
      msg += `   - الكمية المطلوبة: *${item.orderQty} قطعة / وحدة*\n`;
      msg += `   - سعر التكلفة المتفق عليه: ${item.unitCost.toLocaleString()} ج.م\n\n`;
    });

    msg += `------------------------------------\n`;
    msg += `📊 *إجمالي عدد الأصناف:* ${items.length} صنف\n`;
    msg += `💰 *القيمة التقديرية للطلبية:* ${totalEst.toLocaleString()} ج.م شاملة ضريبة القيمة المضافة 14%\n\n`;
    msg += `يرجى تأكيد الاستلام وموعد التوريد المتوقع.\n`;
    msg += `شاكرين حسن تعاونكم الدائم معنا.\n`;
    msg += `*قسم المشتريات والمخازن - منصة MARO ERP*`;

    return msg;
  }

  /**
   * Generates WhatsApp direct chat link
   */
  static generateWhatsAppLink(phone: string | undefined, message: string): string {
    let cleanPhone = (phone || '01000000000').replace(/[^0-9]/g, '');
    if (cleanPhone.startsWith('01') && cleanPhone.length === 11) {
      cleanPhone = '20' + cleanPhone.substring(1);
    }
    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
  }
}
