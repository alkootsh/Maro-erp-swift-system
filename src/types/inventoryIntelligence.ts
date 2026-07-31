export type AlertSeverity = 'critical' | 'high' | 'medium' | 'low' | 'info';

export type AlertType = 
  | 'reorder_level'
  | 'out_of_stock'
  | 'negative_stock'
  | 'near_expiry'
  | 'expired'
  | 'overstock'
  | 'slow_moving'
  | 'dead_stock';

export interface InventoryAlert {
  id: string;
  productId: string;
  productName: string;
  type: AlertType;
  severity: AlertSeverity;
  message: string;
  createdAt: string;
  resolved: boolean;
  assignedTo?: string;
  metadata?: Record<string, any>;
}

export interface InventoryHealthMetrics {
  totalAlerts: number;
  criticalAlerts: number;
  inventoryValue: number;
  healthScore: number; // 0-100
  nearExpiryCount: number;
  deadStockValue: number;
}
