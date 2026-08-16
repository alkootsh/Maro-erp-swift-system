/**
 * @file manufacturing.ts
 * @module تعريفات الأنواع والبيانات (TypeScript Types)
 * @description ملف جزء من نظام MARO ERP. الوظيفة: manufacturing.ts.
 */
// MARO ERP - Enterprise Manufacturing & Production Module Types
export type BOMStatus = 'ACTIVE' | 'DRAFT' | 'ARCHIVED';
export type WorkOrderStatus = 'DRAFT' | 'RELEASED' | 'IN_PROGRESS' | 'QUALITY_CHECK' | 'COMPLETED' | 'CANCELLED';
export type StageStatus = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'SKIPPED';

export interface BOMComponent {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  unitName: string;
  quantityRequired: number; // Qty per 1 unit of finished product
  scrapPercentage: number;  // Expected wastage %
  unitCost: number;
  totalCost: number;
  warehouseId?: string;
}

export interface ProductionOperation {
  id: string;
  sequence: number;
  operationName: string; // e.g. "تقطيع المواد", "تجميع المكونات", "التشطيب والتغليف"
  workCenterName: string; // e.g. "ورشة التجميع", "خط الإنتاج 1"
  estimatedDurationHours: number;
  hourlyRate: number;
  overheadCost: number;
  totalCost: number;
}

export interface BillOfMaterials {
  id: string;
  bomCode: string; // e.g. BOM-2026-001
  name: string; // e.g. "تجميع جهاز حاسوب مكتبي متقدم"
  finishedProductId: string;
  finishedProductName: string;
  finishedProductSku: string;
  yieldQuantity: number; // Output quantity (usually 1 or batch size)
  unitName: string;
  status: BOMStatus;
  components: BOMComponent[];
  operations: ProductionOperation[];
  materialCost: number;
  laborCost: number;
  overheadCost: number;
  totalUnitCost: number;
  version: number;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface WorkOrderStage {
  id: string;
  operationId: string;
  sequence: number;
  name: string;
  workCenter: string;
  status: StageStatus;
  startedAt?: string;
  completedAt?: string;
  technicianName?: string;
  notes?: string;
}

export interface ConsumedMaterial {
  id: string;
  productId: string;
  productName: string;
  plannedQuantity: number;
  actualQuantity: number;
  unitCost: number;
  totalCost: number;
  warehouseId: string;
}

export interface WorkOrder {
  id: string;
  orderNumber: string; // e.g. WO-2026-0001
  bomId: string;
  bomCode: string;
  bomName: string;
  finishedProductId: string;
  finishedProductName: string;
  finishedProductSku: string;
  plannedQuantity: number;
  producedQuantity: number;
  rejectedQuantity: number;
  sourceWarehouseId: string; // Warehouse for consuming raw materials
  targetWarehouseId: string; // Warehouse for storing finished goods
  status: WorkOrderStatus;
  stages: WorkOrderStage[];
  consumedMaterials: ConsumedMaterial[];
  materialCost: number;
  laborCost: number;
  overheadCost: number;
  totalCost: number;
  unitCost: number;
  startDate: string;
  dueDate: string;
  completedAt?: string;
  assignedManager: string;
  journalEntryId?: string;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}
