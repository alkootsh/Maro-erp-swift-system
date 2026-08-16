/**
 * @file manufacturingRepository.ts
 * @module طبقة التعامل مع البيانات (Data Repositories)
 * @description ملف جزء من نظام MARO ERP. الوظيفة: manufacturingRepository.ts.
 */
// MARO ERP - Enterprise Manufacturing Repository & Service
import { MaroSyncEngine } from '../lib/maroSyncEngine';
import { BillOfMaterials, WorkOrder, BOMComponent, ProductionOperation, WorkOrderStage, ConsumedMaterial } from '../types/manufacturing';
import { ProductRepository } from './productRepository';
import { AccountingService } from '../services/accountingService';
import { MaroEventBus } from '../lib/eventBus';

const BOM_COLLECTION = 'boms';
const WORK_ORDER_COLLECTION = 'work_orders';

export class ManufacturingRepository {
  public static getBOMs(): BillOfMaterials[] {
    const list = MaroSyncEngine.getLocalCollection<BillOfMaterials>(BOM_COLLECTION);
    if (list.length === 0) {
      return this.seedDefaultBOMs();
    }
    return list;
  }

  public static getBOMById(id: string): BillOfMaterials | undefined {
    return this.getBOMs().find(b => b.id === id);
  }

  public static saveBOM(bom: BillOfMaterials): void {
    MaroSyncEngine.saveDocument(BOM_COLLECTION, bom);
    MaroEventBus.publish('AUDIT_LOG_ADDED', {
      entity: 'BOM',
      entityId: bom.id,
      action: 'SAVE',
      details: `تم حفظ قائمة مواد التصنيع: ${bom.name} (${bom.bomCode})`,
      timestamp: new Date().toISOString()
    });
  }

  public static deleteBOM(id: string): void {
    MaroSyncEngine.deleteDocument(BOM_COLLECTION, id);
  }

  public static getWorkOrders(): WorkOrder[] {
    const list = MaroSyncEngine.getLocalCollection<WorkOrder>(WORK_ORDER_COLLECTION);
    if (list.length === 0) {
      return this.seedDefaultWorkOrders();
    }
    return list;
  }

  public static getWorkOrderById(id: string): WorkOrder | undefined {
    return this.getWorkOrders().find(w => w.id === id);
  }

  public static saveWorkOrder(wo: WorkOrder): void {
    MaroSyncEngine.saveDocument(WORK_ORDER_COLLECTION, wo);
    MaroEventBus.publish('AUDIT_LOG_ADDED', {
      entity: 'WorkOrder',
      entityId: wo.id,
      action: 'SAVE',
      details: `تم حفظ أمر التشغيل والتصنيع: ${wo.orderNumber} للـ ${wo.finishedProductName}`,
      timestamp: new Date().toISOString()
    });
  }

  public static createWorkOrderFromBOM(
    bom: BillOfMaterials, 
    quantity: number, 
    sourceWarehouseId: string, 
    targetWarehouseId: string,
    managerName: string,
    dueDate: string
  ): WorkOrder {
    const woId = `wo_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
    const count = this.getWorkOrders().length + 1;
    const orderNumber = `WO-${new Date().getFullYear()}-${count.toString().padStart(4, '0')}`;

    const stages: WorkOrderStage[] = bom.operations.map((op) => ({
      id: `stg_${Date.now()}_${op.sequence}`,
      operationId: op.id,
      sequence: op.sequence,
      name: op.operationName,
      workCenter: op.workCenterName,
      status: op.sequence === 1 ? 'RUNNING' : 'PENDING',
      startedAt: op.sequence === 1 ? new Date().toISOString() : undefined,
      technicianName: managerName
    }));

    const multiplier = quantity / (bom.yieldQuantity || 1);

    const consumedMaterials: ConsumedMaterial[] = bom.components.map((comp) => {
      const planned = (comp.quantityRequired * multiplier) * (1 + comp.scrapPercentage / 100);
      return {
        id: `mat_${Date.now()}_${comp.id}`,
        productId: comp.productId,
        productName: comp.productName,
        plannedQuantity: planned,
        actualQuantity: planned,
        unitCost: comp.unitCost,
        totalCost: planned * comp.unitCost,
        warehouseId: sourceWarehouseId
      };
    });

    const materialCost = consumedMaterials.reduce((acc, m) => acc + m.totalCost, 0);
    const laborCost = (bom.laborCost || 0) * multiplier;
    const overheadCost = (bom.overheadCost || 0) * multiplier;
    const totalCost = materialCost + laborCost + overheadCost;
    const unitCost = totalCost / (quantity || 1);

    const newWO: WorkOrder = {
      id: woId,
      orderNumber,
      bomId: bom.id,
      bomCode: bom.bomCode,
      bomName: bom.name,
      finishedProductId: bom.finishedProductId,
      finishedProductName: bom.finishedProductName,
      finishedProductSku: bom.finishedProductSku,
      plannedQuantity: quantity,
      producedQuantity: 0,
      rejectedQuantity: 0,
      sourceWarehouseId,
      targetWarehouseId,
      status: 'RELEASED',
      stages,
      consumedMaterials,
      materialCost,
      laborCost,
      overheadCost,
      totalCost,
      unitCost,
      startDate: new Date().toISOString().split('T')[0],
      dueDate: dueDate || new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
      assignedManager: managerName,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.saveWorkOrder(newWO);
    return newWO;
  }

  public static async completeWorkOrder(woId: string, producedQty: number, rejectedQty: number = 0): Promise<WorkOrder> {
    const wo = this.getWorkOrderById(woId);
    if (!wo) throw new Error('أمر الشغل غير موجود');

    // 1. Mark WO as completed
    wo.status = 'COMPLETED';
    wo.producedQuantity = producedQty;
    wo.rejectedQuantity = rejectedQty;
    wo.completedAt = new Date().toISOString();
    wo.stages = wo.stages.map(s => ({ ...s, status: 'COMPLETED', completedAt: new Date().toISOString() }));
    wo.updatedAt = new Date().toISOString();

    // 2. Consume Raw Materials from Source Warehouse
    const allProducts = ProductRepository.getProducts();
    for (const mat of wo.consumedMaterials) {
      const prod = allProducts.find(p => p.id === mat.productId);
      if (prod) {
        const newQty = Math.max(0, (prod.quantity || 0) - mat.actualQuantity);
        await ProductRepository.updateProduct(prod.id, { quantity: newQty });
      }
    }

    // 3. Add Finished Good to Target Warehouse
    const finishedProduct = allProducts.find(p => p.id === wo.finishedProductId);
    if (finishedProduct) {
      const newQty = (finishedProduct.quantity || 0) + producedQty;
      await ProductRepository.updateProduct(finishedProduct.id, { 
        quantity: newQty,
        costPrice: wo.unitCost
      });
    }

    // 4. Generate Manufacturing Accounting Journal Entry
    try {
      await AccountingService.postJournalEntry(
        wo.orderNumber,
        `إثبات تكاليف إنتاج وتصنيع تام: ${wo.finishedProductName} (الكمية: ${producedQty})`,
        [
          {
            accountCode: '11300', // مخزون الإنتاج التام (Inventory - Finished Goods)
            debit: wo.totalCost,
            credit: 0
          },
          {
            accountCode: '11100', // مخزون المواد الخام / الصندوق النقدية
            debit: 0,
            credit: wo.materialCost
          },
          {
            accountCode: '51100', // تكاليف تشغيل وأجور مباشرة
            debit: 0,
            credit: wo.laborCost + wo.overheadCost
          }
        ]
      );
    } catch (e) {
      console.warn('Accounting entry posting notice:', e);
    }

    this.saveWorkOrder(wo);
    return wo;
  }

  // Seed standard Bill of Materials for Production ready environment
  private static seedDefaultBOMs(): BillOfMaterials[] {
    const products = ProductRepository.getProducts();
    const finished = products[0] || { id: 'p_finish_1', name: 'جهاز حاسوب مكتبي مجمّع MARO Pro', sku: 'PC-MARO-PRO', price: 4500, costPrice: 3200 };
    const raw1 = products[1] || { id: 'p_raw_1', name: 'لوحة أم ومعالج Core i7', sku: 'MB-CPU-I7', price: 1800, costPrice: 1500 };
    const raw2 = products[2] || { id: 'p_raw_2', name: 'ذاكرة عشوائية 16GB DDR5', sku: 'RAM-16-DDR5', price: 400, costPrice: 320 };
    const raw3 = products[3] || { id: 'p_raw_3', name: 'قرص تخزين 1TB NVMe SSD', sku: 'SSD-1TB-NVME', price: 350, costPrice: 280 };

    const defaultBOM: BillOfMaterials = {
      id: 'bom_default_01',
      bomCode: 'BOM-2026-001',
      name: 'قائمة تجميع حاسوب مكتبي متقدم (MARO Workstation)',
      finishedProductId: finished.id,
      finishedProductName: finished.name,
      finishedProductSku: finished.sku || 'PC-MARO-PRO',
      yieldQuantity: 1,
      unitName: 'جهاز',
      status: 'ACTIVE',
      components: [
        {
          id: 'cmp_1',
          productId: raw1.id,
          productName: raw1.name,
          sku: raw1.sku || 'MB-CPU-I7',
          unitName: 'قطعة',
          quantityRequired: 1,
          scrapPercentage: 0,
          unitCost: 1500,
          totalCost: 1500
        },
        {
          id: 'cmp_2',
          productId: raw2.id,
          productName: raw2.name,
          sku: raw2.sku || 'RAM-16-DDR5',
          unitName: 'قطعة',
          quantityRequired: 2,
          scrapPercentage: 2,
          unitCost: 320,
          totalCost: 640
        },
        {
          id: 'cmp_3',
          productId: raw3.id,
          productName: raw3.name,
          sku: raw3.sku || 'SSD-1TB-NVME',
          unitName: 'قطعة',
          quantityRequired: 1,
          scrapPercentage: 0,
          unitCost: 280,
          totalCost: 280
        }
      ],
      operations: [
        {
          id: 'op_1',
          sequence: 1,
          operationName: 'تجهيز وتثبيت اللوحة والمعالج بالهيكل',
          workCenterName: 'قسم التركيب الأساسي',
          estimatedDurationHours: 1.5,
          hourlyRate: 100,
          overheadCost: 50,
          totalCost: 200
        },
        {
          id: 'op_2',
          sequence: 2,
          operationName: 'تركيب وحدات الذاكرة وأقراص التخزين ومزود الطاقة',
          workCenterName: 'قسم التجميع الدقيق',
          estimatedDurationHours: 1.0,
          hourlyRate: 100,
          overheadCost: 30,
          totalCost: 130
        },
        {
          id: 'op_3',
          sequence: 3,
          operationName: 'فحص الجودة واختبار الضغط والتغليف النهائي',
          workCenterName: 'مختبر الجودة والتغليف',
          estimatedDurationHours: 0.5,
          hourlyRate: 100,
          overheadCost: 20,
          totalCost: 70
        }
      ],
      materialCost: 2420,
      laborCost: 300,
      overheadCost: 100,
      totalUnitCost: 2820,
      version: 1,
      notes: 'معايير جودة عالية ISO-9001 لاجتياز فحص درجات الحرارة',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    MaroSyncEngine.saveDocument(BOM_COLLECTION, defaultBOM);
    return [defaultBOM];
  }

  private static seedDefaultWorkOrders(): WorkOrder[] {
    const boms = this.getBOMs();
    const bom = boms[0];
    if (!bom) return [];

    const defaultWO: WorkOrder = {
      id: 'wo_default_01',
      orderNumber: 'WO-2026-0001',
      bomId: bom.id,
      bomCode: bom.bomCode,
      bomName: bom.name,
      finishedProductId: bom.finishedProductId,
      finishedProductName: bom.finishedProductName,
      finishedProductSku: bom.finishedProductSku,
      plannedQuantity: 10,
      producedQuantity: 8,
      rejectedQuantity: 0,
      sourceWarehouseId: 'w1',
      targetWarehouseId: 'w1',
      status: 'IN_PROGRESS',
      stages: bom.operations.map(op => ({
        id: `stg_${op.id}`,
        operationId: op.id,
        sequence: op.sequence,
        name: op.operationName,
        workCenter: op.workCenterName,
        status: op.sequence === 1 ? 'COMPLETED' : op.sequence === 2 ? 'RUNNING' : 'PENDING',
        startedAt: new Date().toISOString(),
        technicianName: 'م. أحمد الشناوي'
      })),
      consumedMaterials: bom.components.map(c => ({
        id: `mat_${c.id}`,
        productId: c.productId,
        productName: c.productName,
        plannedQuantity: c.quantityRequired * 10,
        actualQuantity: c.quantityRequired * 10,
        unitCost: c.unitCost,
        totalCost: c.unitCost * c.quantityRequired * 10,
        warehouseId: 'w1'
      })),
      materialCost: bom.materialCost * 10,
      laborCost: bom.laborCost * 10,
      overheadCost: bom.overheadCost * 10,
      totalCost: bom.totalUnitCost * 10,
      unitCost: bom.totalUnitCost,
      startDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
      assignedManager: 'م. أحمد الشناوي',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    MaroSyncEngine.saveDocument(WORK_ORDER_COLLECTION, defaultWO);
    return [defaultWO];
  }
}
