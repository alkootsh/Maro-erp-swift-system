/**
 * @file productLookupService.ts
 * @module خدمات النظام (Services)
 * @description محرك الاستعلام الموحد عن الأصناف والأسعار والمخزون عبر الباركود وSKU والاسم في نظام MARO ERP.
 */
import { MaroSyncEngine } from '../lib/maroSyncEngine';
import { ProductRepository } from '../repositories/productRepository';
import { ProductMaster } from '../types/productMaster';
import { PriceCheckProduct } from '../types/industryModules';
import { BarcodeEngine } from './barcodeEngine';

export interface ProductLookupResult {
  found: boolean;
  product: PriceCheckProduct | null;
  rawQuery: string;
  source: 'MASTER_PRODUCTS' | 'PDA_CATALOG' | 'SCALE_BARCODE' | 'SUPERMARKET' | 'PHARMACY' | 'FASHION' | 'AUTO_PARTS' | 'NOT_FOUND';
  scaleData?: {
    isScale: boolean;
    weightKg?: number;
    embeddedPrice?: number;
  };
}

export class ProductLookupService {
  /**
   * Universal product lookup by Barcode, SKU, ID, Name, Serial, or Scale Barcode
   */
  static lookup(query: string, currentBranchId: string = 'BR-CAIRO-01'): ProductLookupResult {
    const rawQuery = (query || '').trim();
    if (!rawQuery) {
      return {
        found: false,
        product: null,
        rawQuery: '',
        source: 'NOT_FOUND'
      };
    }

    const cleanCode = rawQuery.replace(/[\x00-\x1F\x7F]/g, '');

    // 1. Check for Scale Barcode (prefixes 21, 22, 27, etc.)
    const parsedScale = BarcodeEngine.parseBarcode(cleanCode);
    if (parsedScale.isScaleBarcode && parsedScale.product) {
      const p = parsedScale.product;
      const converted = this.convertMasterToPriceCheck(p, currentBranchId);
      
      if (parsedScale.type === 'WEIGHT_SCALE' && parsedScale.quantity) {
        converted.nameAr = `${converted.nameAr} (وزن: ${parsedScale.quantity} كجم)`;
        const finalPrice = Math.round(converted.retailPrice * parsedScale.quantity * 100) / 100;
        converted.finalPriceWithTax = finalPrice;
      } else if (parsedScale.type === 'PRICE_SCALE' && parsedScale.embeddedPrice) {
        converted.finalPriceWithTax = parsedScale.embeddedPrice;
        converted.retailPrice = parsedScale.embeddedPrice;
      }

      return {
        found: true,
        product: converted,
        rawQuery: cleanCode,
        source: 'SCALE_BARCODE',
        scaleData: {
          isScale: true,
          weightKg: parsedScale.quantity,
          embeddedPrice: parsedScale.embeddedPrice
        }
      };
    }

    // 2. Search Master ERP Products
    const masterProducts = ProductRepository.getProducts();
    const matchedMaster = masterProducts.find(p => {
      if (!p) return false;
      if (p.barcode && p.barcode.trim() === cleanCode) return true;
      if (p.sku && p.sku.trim().toLowerCase() === cleanCode.toLowerCase()) return true;
      if (p.id && p.id.trim() === cleanCode) return true;
      if (p.barcodes && p.barcodes.some(b => b.code && b.code.trim() === cleanCode)) return true;
      if (p.units && p.units.some(u => u.barcode && u.barcode.trim() === cleanCode)) return true;
      if (p.batches && p.batches.some(b => b.batchNumber && b.batchNumber.trim() === cleanCode)) return true;
      return false;
    });

    if (matchedMaster) {
      return {
        found: true,
        product: this.convertMasterToPriceCheck(matchedMaster, currentBranchId),
        rawQuery: cleanCode,
        source: 'MASTER_PRODUCTS'
      };
    }

    // 3. Search PDA / Price Checker Local Collection
    const pdaProducts = MaroSyncEngine.getLocalCollection<PriceCheckProduct>('pda_price_check_products');
    const matchedPda = pdaProducts.find(p => 
      p.barcode === cleanCode || 
      p.sku.toLowerCase() === cleanCode.toLowerCase() || 
      p.id === cleanCode
    );

    if (matchedPda) {
      return {
        found: true,
        product: matchedPda,
        rawQuery: cleanCode,
        source: 'PDA_CATALOG'
      };
    }

    // 4. Search Supermarket & Food Collection
    const foodProducts = MaroSyncEngine.getLocalCollection<any>('food_supermarket_products');
    const matchedFood = foodProducts.find(p => 
      p.barcode === cleanCode || 
      p.sku?.toLowerCase() === cleanCode.toLowerCase() ||
      p.id === cleanCode
    );

    if (matchedFood) {
      return {
        found: true,
        product: {
          id: matchedFood.id || `food_${Date.now()}`,
          barcode: matchedFood.barcode || cleanCode,
          sku: matchedFood.sku || cleanCode,
          nameAr: matchedFood.nameAr || matchedFood.name || 'صنف غذائي',
          nameEn: matchedFood.nameEn || '',
          brand: matchedFood.brand || 'عام',
          category: matchedFood.category || 'مواد غذائية',
          unit: matchedFood.unit || 'حبة',
          costPrice: matchedFood.costPrice || (matchedFood.retailPrice ? matchedFood.retailPrice * 0.75 : 10),
          retailPrice: matchedFood.retailPrice || matchedFood.price || 15,
          taxRate: 0.14,
          finalPriceWithTax: matchedFood.retailPrice || matchedFood.price || 15,
          hasPromotion: Boolean(matchedFood.promoPrice),
          promoPrice: matchedFood.promoPrice,
          promoLabel: matchedFood.promoLabel || (matchedFood.promoPrice ? 'عرض خاص' : undefined),
          priceLevels: [
            { levelNameAr: 'قطاعي', price: matchedFood.retailPrice || 15, minQuantity: 1 },
            { levelNameAr: 'جملة (3+)', price: Math.round((matchedFood.retailPrice || 15) * 0.9), minQuantity: 3 }
          ],
          loyaltyPointsEarned: Math.max(1, Math.round((matchedFood.retailPrice || 15) * 0.05)),
          stockInCurrentBranch: matchedFood.stockQuantity || 25,
          stockTotalAllBranches: (matchedFood.stockQuantity || 25) * 4,
          shelfLocation: matchedFood.shelfLocation || 'ممر الأغذية - رف 1',
          binCode: matchedFood.binCode || 'BIN-FD-01',
          expiryDate: matchedFood.expiryDate,
          imageUrl: matchedFood.imageUrl,
          descriptionAr: matchedFood.descriptionAr
        },
        rawQuery: cleanCode,
        source: 'SUPERMARKET'
      };
    }

    // 5. Search Pharmacy Drugs Collection
    const drugs = MaroSyncEngine.getLocalCollection<any>('pharmacy_drugs');
    const matchedDrug = drugs.find(d => 
      d.barcode === cleanCode || 
      d.sku?.toLowerCase() === cleanCode.toLowerCase() ||
      d.id === cleanCode
    );

    if (matchedDrug) {
      return {
        found: true,
        product: {
          id: matchedDrug.id || `drug_${Date.now()}`,
          barcode: matchedDrug.barcode || cleanCode,
          sku: matchedDrug.sku || cleanCode,
          nameAr: matchedDrug.commercialNameAr || matchedDrug.nameAr || matchedDrug.name || 'دواء طبي',
          nameEn: matchedDrug.scientificNameEn || matchedDrug.nameEn || '',
          brand: matchedDrug.manufacturer || 'شركة أدوية',
          category: matchedDrug.category || 'أدوية علاجية',
          unit: matchedDrug.unit || 'علبة',
          costPrice: matchedDrug.costPrice || (matchedDrug.publicPrice ? matchedDrug.publicPrice * 0.8 : 20),
          retailPrice: matchedDrug.publicPrice || matchedDrug.price || 25,
          taxRate: 0,
          finalPriceWithTax: matchedDrug.publicPrice || matchedDrug.price || 25,
          hasPromotion: false,
          priceLevels: [
            { levelNameAr: 'سعر الجمهور الرسمي', price: matchedDrug.publicPrice || 25, minQuantity: 1 }
          ],
          loyaltyPointsEarned: Math.max(1, Math.round((matchedDrug.publicPrice || 25) * 0.02)),
          stockInCurrentBranch: matchedDrug.stockPacks || 30,
          stockTotalAllBranches: (matchedDrug.stockPacks || 30) * 3,
          shelfLocation: matchedDrug.drawerLocation || matchedDrug.shelfLocation || 'درج الأدوية - خانة A',
          binCode: matchedDrug.binCode || 'BIN-PH-01',
          expiryDate: matchedDrug.expiryDate,
          batchNumber: matchedDrug.batchNumber,
          imageUrl: matchedDrug.imageUrl,
          descriptionAr: matchedDrug.activeIngredient ? `المادة الفعالة: ${matchedDrug.activeIngredient}` : undefined
        },
        rawQuery: cleanCode,
        source: 'PHARMACY'
      };
    }

    // 6. Name / Text Substring Search in Master Products as fallback
    const matchedByName = masterProducts.find(p => 
      p.name && p.name.toLowerCase().includes(cleanCode.toLowerCase())
    );

    if (matchedByName) {
      return {
        found: true,
        product: this.convertMasterToPriceCheck(matchedByName, currentBranchId),
        rawQuery: cleanCode,
        source: 'MASTER_PRODUCTS'
      };
    }

    // 7. Not Found
    return {
      found: false,
      product: null,
      rawQuery: cleanCode,
      source: 'NOT_FOUND'
    };
  }

  /**
   * Search multiple matching products for auto-complete or live search dropdown
   */
  static searchSuggestions(query: string, limit: number = 8): PriceCheckProduct[] {
    const q = (query || '').trim().toLowerCase();
    if (!q) return [];

    const masterProducts = ProductRepository.getProducts();
    const pdaProducts = MaroSyncEngine.getLocalCollection<PriceCheckProduct>('pda_price_check_products');

    const results: PriceCheckProduct[] = [];

    // Search Master
    for (const p of masterProducts) {
      if (
        (p.name && p.name.toLowerCase().includes(q)) ||
        (p.barcode && p.barcode.includes(q)) ||
        (p.sku && p.sku.toLowerCase().includes(q)) ||
        (p.category && p.category.toLowerCase().includes(q))
      ) {
        results.push(this.convertMasterToPriceCheck(p));
        if (results.length >= limit) return results;
      }
    }

    // Search PDA Catalog
    for (const p of pdaProducts) {
      if (
        (p.nameAr && p.nameAr.toLowerCase().includes(q)) ||
        (p.nameEn && p.nameEn.toLowerCase().includes(q)) ||
        (p.barcode && p.barcode.includes(q)) ||
        (p.sku && p.sku.toLowerCase().includes(q))
      ) {
        if (!results.some(r => r.barcode === p.barcode)) {
          results.push(p);
          if (results.length >= limit) return results;
        }
      }
    }

    return results;
  }

  /**
   * Convert ProductMaster to PriceCheckProduct
   */
  private static convertMasterToPriceCheck(p: ProductMaster, branchId: string = 'BR-CAIRO-01'): PriceCheckProduct {
    const isTaxable = p.isTaxable !== false;
    const taxRate = isTaxable ? 0.14 : 0;
    const retailPrice = p.price || 0;
    const finalPriceWithTax = isTaxable ? Math.round(retailPrice * (1 + taxRate) * 100) / 100 : retailPrice;

    // Calculate Stock
    let branchStock = p.quantity || 0;
    if (p.warehouseStocks && p.warehouseStocks.length > 0) {
      const match = p.warehouseStocks.find(w => w.warehouseId === branchId || w.warehouseName.includes('رئيسي') || w.warehouseName.includes('المعادي'));
      if (match) {
        branchStock = match.quantity;
      } else {
        branchStock = p.warehouseStocks[0].quantity;
      }
    }

    const totalStock = p.quantity || (p.warehouseStocks ? p.warehouseStocks.reduce((sum, w) => sum + w.quantity, 0) : 0);
    const shelfLocation = (p.warehouseStocks && p.warehouseStocks[0]?.locationCode) 
      ? `موقع المستودع: ${p.warehouseStocks[0].locationCode}` 
      : 'ممر العرض الرئيسي - رف 1';

    // Price Levels
    const priceLevels = (p.priceLists && p.priceLists.length > 0)
      ? p.priceLists.map(pl => ({
          levelNameAr: pl.priceListName,
          price: pl.price,
          minQuantity: pl.minQuantity || 1
        }))
      : [
          { levelNameAr: 'قطاعي (سعر المستهلك)', price: finalPriceWithTax, minQuantity: 1 },
          { levelNameAr: 'نصف جملة (3+ قطع)', price: Math.round(retailPrice * 0.92 * (1 + taxRate) * 100) / 100, minQuantity: 3 },
          { levelNameAr: 'سعر الجملة (كرتونة / 12+)', price: Math.round(retailPrice * 0.85 * (1 + taxRate) * 100) / 100, minQuantity: 12 }
        ];

    // Primary image
    const primaryImg = p.images?.find(img => img.isPrimary)?.url || (p.images && p.images[0]?.url) || '';

    // Primary batch
    const activeBatch = p.batches?.find(b => b.status === 'active') || (p.batches && p.batches[0]);

    return {
      id: p.id,
      barcode: p.barcode || (p.barcodes && p.barcodes[0]?.code) || p.sku || 'N/A',
      sku: p.sku || p.id,
      nameAr: p.name,
      nameEn: p.description || '',
      brand: ((p as any).brand as string) || p.brandId || 'MARO ERP',
      category: p.category || 'أصناف عامة',
      unit: (p.units && p.units.find(u => u.isBaseUnit)?.name) || 'قطعة',
      costPrice: p.costPrice || Math.round(retailPrice * 0.7),
      retailPrice,
      taxRate,
      finalPriceWithTax,
      hasPromotion: false,
      priceLevels,
      loyaltyPointsEarned: Math.max(1, Math.round(finalPriceWithTax * 0.05)),
      stockInCurrentBranch: branchStock,
      stockTotalAllBranches: totalStock,
      shelfLocation,
      binCode: (p.warehouseStocks && p.warehouseStocks[0]?.locationCode) || 'BIN-A1-01',
      batchNumber: activeBatch?.batchNumber,
      expiryDate: activeBatch?.expiryDate,
      imageUrl: primaryImg,
      descriptionAr: p.description || `صنف مسجل بالنظام تحت تصنيف ${p.category || 'عام'}. متاح بالمستودعات.`
    };
  }
}
