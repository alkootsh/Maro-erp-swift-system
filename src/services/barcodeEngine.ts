// MARO ERP - Enterprise Barcode & Scale Parser Engine
import { ScaleBarcodeConfig, BarcodeMapping } from '../types/sprint8';
import { ProductRepository } from '../repositories/productRepository';
import { ProductMaster } from '../types/productMaster';

export interface ParsedBarcodeResult {
  rawBarcode: string;
  type: 'STANDARD' | 'WEIGHT_SCALE' | 'PRICE_SCALE' | 'GS1' | 'QR';
  product?: ProductMaster;
  sku?: string;
  quantity: number; // For weighted items, e.g. 1.250 kg
  embeddedPrice?: number; // For price embedded barcodes
  isScaleBarcode: boolean;
}

export class BarcodeEngine {
  private static defaultScaleConfig: ScaleBarcodeConfig = {
    prefix: '21',
    itemCodeLength: 5,
    valueType: 'WEIGHT_KG',
    valueLength: 5,
    decimalPlaces: 3
  };

  // Parse any scanned input barcode
  static parseBarcode(scannedCode: string, scaleConfig?: Partial<ScaleBarcodeConfig>): ParsedBarcodeResult {
    const code = scannedCode.trim();
    const config = { ...this.defaultScaleConfig, ...scaleConfig };

    // 1. Check if Code matches Scale Embedded Barcode Pattern (e.g. 13 digits starting with 21 or 27)
    if ((code.startsWith(config.prefix) || code.startsWith('27') || code.startsWith('22')) && code.length === 13) {
      const prefix = code.substring(0, 2);
      const itemCode = code.substring(2, 2 + config.itemCodeLength);
      const rawValue = parseInt(code.substring(2 + config.itemCodeLength, 2 + config.itemCodeLength + config.valueLength), 10);
      
      const products = ProductRepository.getProducts();
      // Find product matching SKU or item code
      const product = products.find(p => p.sku.endsWith(itemCode) || p.barcode === code || p.barcode === itemCode);

      const isWeight = prefix === '21' || config.valueType === 'WEIGHT_KG';
      
      if (isWeight) {
        const weightKg = rawValue / Math.pow(10, config.decimalPlaces); // e.g. 01250 / 1000 = 1.250 kg
        return {
          rawBarcode: code,
          type: 'WEIGHT_SCALE',
          product,
          sku: product?.sku || itemCode,
          quantity: weightKg > 0 ? weightKg : 1,
          isScaleBarcode: true
        };
      } else {
        const price = rawValue / 100; // e.g. 04500 / 100 = 45.00 EGP
        const unitPrice = product?.price || 1;
        const calcQty = price / unitPrice;
        return {
          rawBarcode: code,
          type: 'PRICE_SCALE',
          product,
          sku: product?.sku || itemCode,
          quantity: calcQty > 0 ? Number(calcQty.toFixed(3)) : 1,
          embeddedPrice: price,
          isScaleBarcode: true
        };
      }
    }

    // 2. Standard Barcode Lookup
    const products = ProductRepository.getProducts();
    const matchedProduct = products.find(p => p.barcode === code || p.sku === code || p.id === code);

    return {
      rawBarcode: code,
      type: 'STANDARD',
      product: matchedProduct,
      sku: matchedProduct?.sku || code,
      quantity: 1,
      isScaleBarcode: false
    };
  }

  // Barcode Type Classifier
  static detectBarcodeFormat(code: string): 'EAN13' | 'EAN8' | 'UPC' | 'CODE128' | 'GS1' | 'QR' | 'UNKNOWN' {
    if (!code) return 'UNKNOWN';
    if (/^\d{13}$/.test(code)) return 'EAN13';
    if (/^\d{8}$/.test(code)) return 'EAN8';
    if (/^\d{12}$/.test(code)) return 'UPC';
    if (code.startsWith('{GS1}') || code.includes('\x1D')) return 'GS1';
    if (code.startsWith('http://') || code.startsWith('https://') || code.length > 30) return 'QR';
    if (/^[A-Za-z0-9\-\.\ \$\/\+\%]+$/.test(code)) return 'CODE128';
    return 'UNKNOWN';
  }
}
