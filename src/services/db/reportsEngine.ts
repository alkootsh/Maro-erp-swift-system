/**
 * @file reportsEngine.ts
 * @module خدمات النظام (Services)
 * @description ملف جزء من نظام MARO ERP. الوظيفة: reportsEngine.ts.
 */
import { eq, sql } from 'drizzle-orm';
import { db } from '../../db';
import { salesInvoices, purchaseInvoices, products, journalLines, chartOfAccounts } from '../../db/schema';

export class ReportsEngine {
  /**
   * Executive Financial Dashboard Summary
   */
  static async getExecutiveSummary(tenantId: string) {
    try {
      // 1. Sales Total
      const salesResult = await db.select({
        totalSales: sql<string>`COALESCE(SUM(total_amount), 0)`,
        totalTax: sql<string>`COALESCE(SUM(tax_amount), 0)`,
        count: sql<number>`COUNT(*)`
      }).from(salesInvoices).where(eq(salesInvoices.tenantId, tenantId));

      // 2. Purchases Total
      const purchasesResult = await db.select({
        totalPurchases: sql<string>`COALESCE(SUM(total_amount), 0)`,
        totalTax: sql<string>`COALESCE(SUM(tax_amount), 0)`,
        count: sql<number>`COUNT(*)`
      }).from(purchaseInvoices).where(eq(purchaseInvoices.tenantId, tenantId));

      // 3. Current Stock Valuation (Quantity * Cost)
      const stockResult = await db.select({
        totalStockValue: sql<string>`COALESCE(SUM(stock_quantity * cost_price), 0)`,
        totalItemsCount: sql<number>`COUNT(*)`
      }).from(products).where(eq(products.tenantId, tenantId));

      const totalSales = parseFloat(salesResult[0]?.totalSales || '0');
      const totalPurchases = parseFloat(purchasesResult[0]?.totalPurchases || '0');
      const totalStockValuation = parseFloat(stockResult[0]?.totalStockValue || '0');
      const netProfit = totalSales - totalPurchases;

      return {
        totalSales,
        salesCount: Number(salesResult[0]?.count || 0),
        totalPurchases,
        purchasesCount: Number(purchasesResult[0]?.count || 0),
        totalStockValuation,
        productsCount: Number(stockResult[0]?.totalItemsCount || 0),
        netProfit,
        vatNetPayable: (parseFloat(salesResult[0]?.totalTax || '0') - parseFloat(purchasesResult[0]?.totalTax || '0'))
      };
    } catch (e) {
      console.error("Failed to compute executive summary", e);
      return {
        totalSales: 0,
        salesCount: 0,
        totalPurchases: 0,
        purchasesCount: 0,
        totalStockValuation: 0,
        productsCount: 0,
        netProfit: 0,
        vatNetPayable: 0
      };
    }
  }
}
