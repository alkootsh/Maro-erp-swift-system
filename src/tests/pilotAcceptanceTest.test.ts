// MARO ERP - Pilot Functional Acceptance Test (FAT) Suite
// Master Enterprise Protocol v3.0

import { ProductService } from '../services/productService';
import { ProductRepository } from '../repositories/productRepository';
import { SalesRepository } from '../repositories/salesRepository';
import { POSRepository } from '../repositories/posRepository';
import { PurchaseRepository } from '../repositories/purchaseRepository';
import { CustomerRepository } from '../repositories/customerRepository';
import { SupplierRepository } from '../repositories/supplierRepository';
import { InventoryRepository } from '../repositories/inventoryRepository';
import { AccountingService } from '../services/accountingService';
import { MaroSyncEngine } from '../lib/maroSyncEngine';

async function runPilotAcceptanceTest() {
  console.log('==========================================================');
  console.log('MARO BUSINESS PLATFORM - PILOT FUNCTIONAL ACCEPTANCE TEST');
  console.log('==========================================================\n');

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    totalTests++;
    if (condition) {
      passedTests++;
      console.log(`✅ [PASS] Test ${totalTests}: ${testName}${detail ? ` (${detail})` : ''}`);
    } else {
      console.error(`❌ [FAIL] Test ${totalTests}: ${testName}${detail ? ` (${detail})` : ''}`);
    }
  }

  // ==========================================
  // SECTION 1: HYPERMARKET PRODUCT MASTER
  // ==========================================
  console.log('--- SECTION 1: HYPERMARKET PRODUCT MASTER ---');
  try {
    // 1. Create Product with Batch & Expiry
    const prodId = await ProductService.createProduct({
      name: 'جبن شيدر مستورد - 500جم',
      sku: 'CHED-001',
      category: 'ألبان',
      price: 50,
      costPrice: 35,
      quantity: 100,
      batchTracking: true,
      expiryTracking: true,
      status: 'active',
      units: [{ id: 'u1', name: 'قطعة', symbol: 'pcs', factor: 1, isBaseUnit: true, barcode: '1234567890123', salePrice: 50, purchasePrice: 35 }],
      barcodes: [{ id: 'b1', code: '1234567890123', type: 'EAN13', unitId: 'u1' }],
      batches: [{ id: 'bt1', batchNumber: 'LOT-2026-AUG', quantity: 100, expiryDate: '2026-12-31', status: 'active' }],
      openingBalance: 100,
    });
    assert(!!prodId, 'Create Batch/Expiry Product');

    // 2. Weighted Product
    const weightedProdId = await ProductService.createProduct({
        name: 'تفاح أحمر سكري (وزن)',
        sku: 'APP-001',
        category: 'خضار وفواكه',
        price: 10,
        costPrice: 5,
        quantity: 50,
        batchTracking: false,
        expiryTracking: false,
        status: 'active',
        units: [{ id: 'u2', name: 'كجم', symbol: 'kg', factor: 1, isBaseUnit: true, barcode: '2000000000000', salePrice: 10, purchasePrice: 5 }],
        barcodes: [{ id: 'b2', code: '2000000000000', type: 'EAN13', unitId: 'u2' }],
        openingBalance: 50
    });
    assert(!!weightedProdId, 'Create Weighted Product');

  } catch (err: any) {
    console.error(err);
    assert(false, 'Product Master Section');
  }

  // ==========================================
  // SECTION 2: ACCOUNTING & PURCHASING
  // ==========================================
  console.log('\n--- SECTION 2: ACCOUNTING & PURCHASING ---');
  try {
    // 1. Purchasing with Accounting
    const supId = await SupplierRepository.saveSupplier({ name: 'مورد الألبان', phone: '01000', status: 'active' });
    const po = await PurchaseRepository.createPurchaseOrder({
        supplierId: supId,
        supplierName: 'مورد الألبان',
        warehouseId: 'wh_main',
        items: [{ id: 'pi1', productId: 'p1', productName: 'جبن', sku: 'CHED-001', unitName: 'pcs', quantity: 10, unitPrice: 35, lineTotal: 350 }],
        totalAmount: 350,
        status: 'APPROVED',
        expectedDeliveryDate: new Date().toISOString()
    });
    
    // Verify Accounting Entry
    const journal = await AccountingService.generatePurchaseEntry(po);
    assert(!!journal && journal.lines.length >= 2, 'Verify automatic journal entry for purchase (Asset/Payable)');

  } catch (err: any) {
    console.error(err);
    assert(false, 'Accounting/Purchasing Section');
  }

  // ==========================================
  // FINAL SUMMARY
  // ==========================================
  console.log('\n==========================================================');
  console.log(`PILOT FAT FINAL SCORE: ${passedTests} / ${totalTests} PASSED`);
  console.log('==========================================================');

  if (passedTests === totalTests) {
    console.log('🎉 ALL PILOT REAL WORKFLOW TESTS PASSED!');
  } else {
    console.error('❌ SOME TESTS FAILED. REJECTING PILOT RELEASE.');
    process.exit(1);
  }
}

runPilotAcceptanceTest();
