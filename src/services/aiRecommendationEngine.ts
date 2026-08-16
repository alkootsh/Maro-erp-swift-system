/**
 * @file aiRecommendationEngine.ts
 * @module خدمات النظام (Services)
 * @description ملف جزء من نظام MARO ERP. الوظيفة: aiRecommendationEngine.ts.
 */
import { AIRecommendation } from '../types/businessIntelligence';
import { ProductRepository } from '../repositories/productRepository';
import { SalesRepository } from '../repositories/salesRepository';

export class AIRecommendationEngine {
  static async generateRecommendations(): Promise<AIRecommendation[]> {
    const products = ProductRepository.getProducts();
    const invoices = SalesRepository.getInvoices();
    
    // Calculate sales per product
    const salesPerProduct: Record<string, number> = {};
    invoices.forEach(inv => {
        inv.items.forEach((item: any) => {
            salesPerProduct[item.productId] = (salesPerProduct[item.productId] || 0) + item.quantity;
        });
    });

    const recommendations: AIRecommendation[] = [];

    // Analyze each product
    products.forEach(product => {
        const sales = salesPerProduct[product.id] || 0;
        
        // Dead stock logic: High quantity, Zero/Low sales over a period
        if ((product.quantity || 0) > 10 && sales === 0) {
             recommendations.push({
                id: `rec_${product.id}_${Date.now()}`,
                type: 'INVENTORY_OPTIMIZATION',
                content: `المنتج ${product.name} يعتبر راكداً. لم يتم بيعه مؤخراً رغم توفر كمية كبيرة.`,
                reason: `الكمية الحالية ${product.quantity} مع مبيعات صفرية.`,
                confidence: 0.95,
                status: 'pending',
                createdAt: new Date().toISOString()
            });
        }
    });

    return recommendations;
  }
}
