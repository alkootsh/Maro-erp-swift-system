import { MaroSyncEngine } from '../lib/maroSyncEngine';

export interface POSPanelConfig {
  id: string;
  type: 'products' | 'cart' | 'customer' | 'payment' | 'functions' | 'categories' | 'totals';
  title: string;
  visible: boolean;
  order: number;
  width?: number; // percentage or flex value
  height?: number; // percentage or flex value
  position?: 'left' | 'right' | 'top' | 'bottom' | 'center';
}

export interface POSLayout {
  id: string;
  name: string;
  description: string;
  isDefault: boolean;
  deviceType: 'desktop' | 'touch' | 'tablet' | 'mobile';
  theme: 'light' | 'dark' | 'system';
  panels: POSPanelConfig[];
  
  // Advanced configuration
  allowFractionalQuantities: boolean;
  showProductImages: boolean;
  keyboardShortcutsEnabled: boolean;
  quickAmounts: number[];
  
  // Assignment criteria
  assignedRoles: string[];
  assignedUsers: string[];
  assignedBranches: string[];
  
  createdAt: string;
  updatedAt: string;
}

export class POSLayoutRepository {
  private static COLLECTION = 'pos_layouts';

  static getLayouts(): POSLayout[] {
    return MaroSyncEngine.getLocalCollection<POSLayout>(this.COLLECTION);
  }

  static getLayoutById(id: string): POSLayout | null {
    return MaroSyncEngine.getLocalDocument<POSLayout>(this.COLLECTION, id);
  }

  static getDefaultLayout(): POSLayout {
    const layouts = this.getLayouts();
    const defaultLayout = layouts.find(l => l.isDefault);
    if (defaultLayout) return defaultLayout;
    
    // Fallback default
    return {
      id: 'default',
      name: 'الافتراضي (Desktop)',
      description: 'التخطيط الافتراضي لنقاط البيع',
      isDefault: true,
      deviceType: 'desktop',
      theme: 'system',
      panels: [
        { id: 'p1', type: 'products', title: 'المنتجات', visible: true, order: 1, position: 'center' },
        { id: 'p2', type: 'cart', title: 'سلة المشتريات', visible: true, order: 2, position: 'right' },
        { id: 'p3', type: 'categories', title: 'الفئات', visible: true, order: 3, position: 'top' },
        { id: 'p4', type: 'customer', title: 'العميل', visible: true, order: 4, position: 'right' },
        { id: 'p5', type: 'payment', title: 'الدفع', visible: true, order: 5, position: 'right' },
        { id: 'p6', type: 'functions', title: 'أزرار المهام', visible: true, order: 6, position: 'bottom' }
      ],
      allowFractionalQuantities: false,
      showProductImages: true,
      keyboardShortcutsEnabled: true,
      quickAmounts: [50, 100, 200, 500],
      assignedRoles: [],
      assignedUsers: [],
      assignedBranches: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  static async saveLayout(layout: POSLayout): Promise<void> {
    if (layout.isDefault) {
      // Unset other defaults
      const layouts = this.getLayouts();
      for (const l of layouts) {
        if (l.isDefault && l.id !== layout.id) {
          l.isDefault = false;
          await MaroSyncEngine.saveDocument(this.COLLECTION, l);
        }
      }
    }
    
    layout.updatedAt = new Date().toISOString();
    await MaroSyncEngine.saveDocument(this.COLLECTION, layout);
  }

  static async deleteLayout(id: string): Promise<void> {
    await MaroSyncEngine.deleteDocument(this.COLLECTION, id);
  }
}
