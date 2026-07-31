// MARO ERP - Enterprise Validation Framework Automated Test Suite
import { productMasterSchema } from '../lib/productValidation';
import { ProductService } from '../services/productService';
import { ProductRepository } from '../repositories/productRepository';
import { MaroSyncEngine } from '../lib/maroSyncEngine';

async function runTests() {
  console.log('🧪 Starting Enterprise Validation Framework Tests...\n');
  let passedCount = 0;
  let totalCount = 7;

  // 1. Test: Empty form
  try {
    const result = productMasterSchema.safeParse({});
    if (!result.success) {
      const errorMessages = result.error.errors.map(e => e.message);
      console.log('✅ Test 1 Passed: Empty form validation failed as expected.');
      console.log('   Errors:', errorMessages.join(', '));
      passedCount++;
    } else {
      console.error('❌ Test 1 Failed: Empty form should not pass validation.');
    }
  } catch (err: any) {
    console.error('❌ Test 1 Exception:', err.message);
  }

  // 2. Test: Missing SKU
  try {
    const result = productMasterSchema.safeParse({
      name: 'منتج تجريبي 1',
      category: 'إلكترونيات',
      price: 1500,
    });
    if (!result.success) {
      const skuError = result.error.errors.find(e => e.path.includes('sku'));
      if (skuError) {
        console.log('✅ Test 2 Passed: Missing SKU error caught:', skuError.message);
        passedCount++;
      } else {
        console.error('❌ Test 2 Failed: SKU error missing from Zod errors.');
      }
    } else {
      console.error('❌ Test 2 Failed: Form without SKU passed validation.');
    }
  } catch (err: any) {
    console.error('❌ Test 2 Exception:', err.message);
  }

  // 3. Test: Missing Category
  try {
    const result = productMasterSchema.safeParse({
      name: 'منتج تجريبي 2',
      sku: 'TEST-SKU-99',
      price: 200,
      category: '',
    });
    if (!result.success) {
      const catError = result.error.errors.find(e => e.path.includes('category'));
      if (catError) {
        console.log('✅ Test 3 Passed: Missing Category error caught:', catError.message);
        passedCount++;
      } else {
        console.error('❌ Test 3 Failed: Category error missing.');
      }
    } else {
      console.error('❌ Test 3 Failed: Form with empty category passed.');
    }
  } catch (err: any) {
    console.error('❌ Test 3 Exception:', err.message);
  }

  // 4. Test: Invalid Price (negative)
  try {
    const result = productMasterSchema.safeParse({
      name: 'منتج تجريبي 3',
      sku: 'TEST-SKU-100',
      category: 'عام',
      price: -500,
    });
    if (!result.success) {
      const priceError = result.error.errors.find(e => e.path.includes('price'));
      if (priceError) {
        console.log('✅ Test 4 Passed: Negative price error caught:', priceError.message);
        passedCount++;
      } else {
        console.error('❌ Test 4 Failed: Negative price error missing.');
      }
    } else {
      console.error('❌ Test 4 Failed: Negative price passed validation.');
    }
  } catch (err: any) {
    console.error('❌ Test 4 Exception:', err.message);
  }

  // Seed sample product for duplicate SKU test & save tests
  const sampleSku = `SKU-TEST-${Date.now()}`;

  const defaultFlags = {
    batchTracking: false,
    expiryTracking: false,
    serialNumberTracking: false,
    allowNegativeStock: false,
    allowFraction: false,
    taxIncluded: false,
  };

  // 5. Test: Successful Save
  try {
    const newId = await ProductService.createProduct({
      ...defaultFlags,
      name: 'شاشة حاسوب سامسونج 27 بوصة',
      sku: sampleSku,
      category: 'إلكترونيات',
      price: 4500,
      costPrice: 3800,
      quantity: 15,
      description: 'شاشة عالية الدقة 4K',
      reorderLevel: 3,
      isTaxable: true,
      status: 'active',
      units: [],
      barcodes: [],
      warehouseStocks: [],
      priceLists: [],
      batches: [],
      images: [],
      attachments: [],
      openingBalance: 15,
    });

    if (newId) {
      console.log('✅ Test 5 Passed: Product created successfully with ID:', newId);
      passedCount++;
    } else {
      console.error('❌ Test 5 Failed: Product creation returned null ID.');
    }
  } catch (err: any) {
    console.error('❌ Test 5 Exception:', err.message);
  }

  // 6. Test: Duplicate SKU
  try {
    await ProductService.createProduct({
      ...defaultFlags,
      name: 'منتج مكرر',
      sku: sampleSku, // Same SKU created in Test 5
      category: 'عام',
      price: 100,
      costPrice: 50,
      quantity: 10,
      description: '',
      reorderLevel: 2,
      isTaxable: true,
      status: 'active',
      units: [],
      barcodes: [],
      warehouseStocks: [],
      priceLists: [],
      batches: [],
      images: [],
      attachments: [],
      openingBalance: 10,
    });
    console.error('❌ Test 6 Failed: Duplicate SKU did not throw error.');
  } catch (err: any) {
    if (err.message.includes('رمز المنتج (SKU) مستخدم بالفعل')) {
      console.log('✅ Test 6 Passed: Duplicate SKU correctly rejected:', err.message);
      passedCount++;
    } else {
      console.error('❌ Test 6 Failed with unexpected error:', err.message);
    }
  }

  // 7. Test: Offline Save
  try {
    const offlineSku = `OFFLINE-SKU-${Date.now()}`;
    const newId = await ProductService.createProduct({
      ...defaultFlags,
      name: 'منتج أوفلاين تجريبي',
      sku: offlineSku,
      category: 'مخزن أوفلاين',
      price: 750,
      costPrice: 500,
      quantity: 50,
      description: '',
      reorderLevel: 10,
      isTaxable: true,
      status: 'active',
      units: [],
      barcodes: [],
      warehouseStocks: [],
      priceLists: [],
      batches: [],
      images: [],
      attachments: [],
      openingBalance: 50,
    });

    const savedProduct = ProductRepository.getProductByIdSync(newId);
    if (savedProduct && savedProduct.sku === offlineSku) {
      console.log('✅ Test 7 Passed: Offline save verified in local sync engine store.');
      passedCount++;
    } else {
      console.error('❌ Test 7 Failed: Offline product not found in local sync store.');
    }
  } catch (err: any) {
    console.error('❌ Test 7 Exception:', err.message);
  }

  console.log(`\n📊 TEST RESULTS: ${passedCount} / ${totalCount} PASSED`);
  if (passedCount === totalCount) {
    console.log('🎉 ALL VALIDATION FRAMEWORK TESTS PASSED SUCCESSFULLY!');
  } else {
    process.exit(1);
  }
}

runTests();
