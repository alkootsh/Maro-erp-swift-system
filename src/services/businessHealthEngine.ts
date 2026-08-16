/**
 * @file businessHealthEngine.ts
 * @module خدمات النظام (Services)
 * @description ملف جزء من نظام MARO ERP. الوظيفة: businessHealthEngine.ts.
 */
import { MaroSyncEngine } from '../lib/maroSyncEngine';
import { BusinessHealth } from '../types/businessIntelligence';
import { ProductRepository } from '../repositories/productRepository';
import { SalesRepository } from '../repositories/salesRepository';

export class BusinessHealthEngine {
  private static WEIGHTS: Record<string, number> = {
    inventoryHealth: 0.4,
    salesPerformance: 0.4,
    syncEngineStatus: 0.2
  };

  static async calculateBusinessHealth(companyId: string): Promise<BusinessHealth> {
    const products = ProductRepository.getProducts();
    const invoices = SalesRepository.getInvoices();

    // 1. Calculate Inventory Health
    const totalProducts = products.length || 1;
    const wellStocked = products.filter(p => (p.quantity || 0) > (p.reorderLevel || 5)).length;
    const inventoryHealth = (wellStocked / totalProducts) * 100;

    // 2. Calculate Sales Performance
    const salesPerformance = Math.min(100, Math.max(0, invoices.length * 10)); 

    // 3. Composite Score
    const score = Math.round(
      (inventoryHealth * this.WEIGHTS.inventoryHealth) +
      (salesPerformance * this.WEIGHTS.salesPerformance) +
      (100 * this.WEIGHTS.syncEngineStatus)
    );

    const health: BusinessHealth = {
      id: `health_${Date.now()}`,
      companyId,
      branchId: 'main',
      score,
      metrics: { inventoryHealth, salesPerformance },
      aiExplanation: `تم تقييم أداء الشركة بنسبة ${score}%. ${inventoryHealth < 50 ? 'يوجد نقص في توازن المخزون.' : 'مستوى المخزون جيد.'}`,
      calculatedAt: new Date()
    };

    return health;
  }
}
