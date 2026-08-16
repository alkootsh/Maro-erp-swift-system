/**
 * @file pricingEngine.ts
 * @module خدمات النظام (Services)
 * @description ملف جزء من نظام MARO ERP. الوظيفة: pricingEngine.ts.
 */
// MARO ERP - Enterprise Pricing & Promotions Engine
import { PriceList, PromotionRule, PriceListItem, CreditCheckResult } from '../types/sprint8';
import { MaroSyncEngine } from '../lib/maroSyncEngine';

const PRICELIST_COLLECTION = 'pricelists';
const PROMOTIONS_COLLECTION = 'promotions';

export class PricingEngine {
  // Initialize Default Enterprise Price Lists if not present
  static initializeDefaults(): void {
    const existing = MaroSyncEngine.getLocalCollection<PriceList>(PRICELIST_COLLECTION);
    if (existing.length === 0) {
      const defaultLists: PriceList[] = [
        {
          id: 'RETAIL',
          name: 'سعر التجزئة العام (Retail)',
          type: 'RETAIL',
          currency: 'EGP',
          isDefault: true,
          items: []
        },
        {
          id: 'WHOLESALE',
          name: 'سعر الجملة (Wholesale)',
          type: 'WHOLESALE',
          currency: 'EGP',
          items: []
        },
        {
          id: 'VIP',
          name: 'سعر كبار العملاء (VIP)',
          type: 'VIP',
          currency: 'EGP',
          items: []
        },
        {
          id: 'CONTRACT',
          name: 'أسعار العقود الرسمية (Contract)',
          type: 'CONTRACT',
          currency: 'EGP',
          items: []
        }
      ];
      defaultLists.forEach(pl => MaroSyncEngine.saveDocument(PRICELIST_COLLECTION, pl, false));
    }
  }

  static getPriceLists(): PriceList[] {
    this.initializeDefaults();
    return MaroSyncEngine.getLocalCollection<PriceList>(PRICELIST_COLLECTION);
  }

  static getPriceListById(id: string): PriceList | null {
    this.initializeDefaults();
    return MaroSyncEngine.getLocalDocument<PriceList>(PRICELIST_COLLECTION, id);
  }

  static getActivePromotions(): PromotionRule[] {
    const rules = MaroSyncEngine.getLocalCollection<PromotionRule>(PROMOTIONS_COLLECTION);
    const now = new Date().toISOString();
    return rules.filter(r => r.isActive && r.startDate <= now && r.endDate >= now);
  }

  // Calculate Unit Price based on Price List & Volume Tier
  static calculateUnitPrice(
    productId: string,
    standardSellingPrice: number,
    quantity: number,
    priceListId: string = 'RETAIL'
  ): { unitPrice: number; discountPercent: number; appliedTier?: string } {
    const priceList = this.getPriceListById(priceListId);
    let basePrice = standardSellingPrice;

    if (priceList) {
      const matchedItem = priceList.items.find(i => i.productId === productId);
      if (matchedItem) {
        basePrice = matchedItem.price;

        // Check Quantity Tier Discounts
        if (matchedItem.tiers && matchedItem.tiers.length > 0) {
          const sortedTiers = [...matchedItem.tiers].sort((a, b) => b.minQuantity - a.minQuantity);
          const applicableTier = sortedTiers.find(t => quantity >= t.minQuantity);
          if (applicableTier) {
            return {
              unitPrice: applicableTier.unitPrice,
              discountPercent: 0,
              appliedTier: `خصم الكمية (>= ${applicableTier.minQuantity} قطعة)`
            };
          }
        }
      } else if (priceList.type === 'WHOLESALE') {
        basePrice = standardSellingPrice * 0.85; // 15% automatic wholesale discount
      } else if (priceList.type === 'VIP') {
        basePrice = standardSellingPrice * 0.80; // 20% VIP discount
      }
    }

    // Check Active Time-based Promotions
    const activePromotions = this.getActivePromotions();
    let promoDiscountPercent = 0;

    activePromotions.forEach(promo => {
      if (!promo.applicableProductIds || promo.applicableProductIds.includes(productId)) {
        if (promo.type === 'PERCENTAGE_DISCOUNT') {
          promoDiscountPercent = Math.max(promoDiscountPercent, promo.discountValue);
        }
      }
    });

    return {
      unitPrice: basePrice,
      discountPercent: promoDiscountPercent
    };
  }
}
