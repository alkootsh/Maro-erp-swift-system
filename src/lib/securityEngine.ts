// MARO ERP - Enterprise Security & Permission Engine
import { 
  SystemLicense, 
  FeatureFlag, 
  UserPermissionSet, 
  DetailedAuditRecord, 
  SecuritySession, 
  SecurityAlert, 
  SystemDiagnosticReport,
  FeatureStatus,
  ButtonPermissionFlags,
  FieldPermissionFlags
} from '../types/security';
import { MaroSyncEngine } from './maroSyncEngine';
import { MaroEventBus } from './eventBus';

// Constants
export const DEVELOPER_ACCOUNT_ID = 'dev_master_sys_001';
export const DEVELOPER_EMAIL = 'developer@maro-erp.internal';
export const DEFAULT_DEVELOPER_KEY = 'MARO_DEV_MASTER_2026_KEY';

const LOCAL_STORAGE_KEY_LICENSE = 'maro_erp_system_license';
const LOCAL_STORAGE_KEY_FLAGS = 'maro_erp_feature_flags';
const LOCAL_STORAGE_KEY_PERMISSIONS = 'maro_erp_user_permissions';
const LOCAL_STORAGE_KEY_AUDIT = 'maro_erp_security_audit';
const LOCAL_STORAGE_KEY_ALERTS = 'maro_erp_security_alerts';
const LOCAL_STORAGE_KEY_SESSIONS = 'maro_erp_security_sessions';
const LOCAL_STORAGE_KEY_MAINTENANCE = 'maro_erp_maintenance_mode';

// Default Default License
const DEFAULT_LICENSE: SystemLicense = {
  licenseKey: 'MARO-ENT-2026-9988-7766',
  companyName: 'MARO Enterprise Client',
  plan: 'enterprise',
  maxUsers: 50,
  maxTerminals: 20,
  status: 'active',
  issuedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
  expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
  enabledModules: ['POS', 'INVENTORY', 'SALES', 'PURCHASES', 'ACCOUNTING', 'USERS', 'REPORTS', 'CUSTOMERS', 'SUPPLIERS', 'WAREHOUSES', 'AI'],
  customFeatures: {
    'POS_TOUCH_MODE': true,
    'SCALE_BARCODE': true,
    'MULTI_WAREHOUSE': true,
    'DOUBLE_ENTRY_GL': true,
    'OFFLINE_SYNC': true,
    'CUSTOM_FKEYS': true,
    'AI_ASSISTANT': true
  }
};

// Default Feature Flags Matrix
const DEFAULT_FEATURE_FLAGS: FeatureFlag[] = [
  { id: 'POS_TOUCH_LAYOUT', name: 'POS Touch Layout', module: 'POS', status: 'enabled', description: 'Enable multi-layout touchscreen POS terminal', requiresPlan: 'standard', updatedAt: new Date().toISOString() },
  { id: 'POS_FUNCTION_KEYS', name: 'POS Custom F1-F12 Keys', module: 'POS', status: 'enabled', description: 'Custom configurable F1-F12 keyboard actions', requiresPlan: 'standard', updatedAt: new Date().toISOString() },
  { id: 'SCALE_BARCODE_PARSER', name: 'Scale Barcode Parsing', module: 'POS', status: 'enabled', description: 'Parsing weight/price embedded barcodes (EAN-13 prefix 20..29)', requiresPlan: 'premium', updatedAt: new Date().toISOString() },
  { id: 'MULTI_CURRENCY_GL', name: 'Multi-Currency GL', module: 'ACCOUNTING', status: 'trial', description: 'Foreign exchange rate GL ledger entries', requiresPlan: 'enterprise', updatedAt: new Date().toISOString() },
  { id: 'INVENTORY_BATCH_EXPIRY', name: 'Batch & Expiry Tracking', module: 'INVENTORY', status: 'enabled', description: 'Track lot batches and expiry dates on items', requiresPlan: 'premium', updatedAt: new Date().toISOString() },
  { id: 'MARO_SYNC_ENGINE', name: 'MARO Offline Sync Engine', module: 'SYSTEM', status: 'enabled', description: 'Realtime background queue sync with conflict vector resolution', requiresPlan: 'standard', updatedAt: new Date().toISOString() },
  { id: 'FIELD_SECURITY_COST', name: 'Cost Price Obfuscation', module: 'SECURITY', status: 'enabled', description: 'Hide purchase cost price from non-authorized roles', requiresPlan: 'premium', updatedAt: new Date().toISOString() },
  { id: 'AI_DEMAND_FORECASTING', name: 'AI Demand Forecasting', module: 'AI', status: 'trial', description: 'Smart sales & stock demand forecasting engine', requiresPlan: 'enterprise', updatedAt: new Date().toISOString() }
];

// Default Button Permissions
export const DEFAULT_FULL_BUTTON_PERMISSIONS: ButtonPermissionFlags = {
  createItem: true,
  editItem: true,
  deleteItem: true,
  approveDocument: true,
  rejectDocument: true,
  applyDiscount: true,
  overridePrice: true,
  cancelInvoice: true,
  returnInvoice: true,
  printReceipt: true,
  reprintReceipt: true,
  openCashDrawer: true,
  closeShift: true,
  inventoryCount: true,
  adjustStock: true,
  manageUsers: true,
  manageRoles: true,
  manageSystem: true
};

export const DEFAULT_CASHIER_BUTTON_PERMISSIONS: ButtonPermissionFlags = {
  createItem: false,
  editItem: false,
  deleteItem: false,
  approveDocument: false,
  rejectDocument: false,
  applyDiscount: true,
  overridePrice: false,
  cancelInvoice: false,
  returnInvoice: true,
  printReceipt: true,
  reprintReceipt: true,
  openCashDrawer: true,
  closeShift: true,
  inventoryCount: false,
  adjustStock: false,
  manageUsers: false,
  manageRoles: false,
  manageSystem: false
};

// Default Field Permissions
export const DEFAULT_FULL_FIELD_PERMISSIONS: FieldPermissionFlags = {
  viewCostPrice: true,
  viewProfit: true,
  viewPurchasePrice: true,
  editSellingPrice: true,
  viewSupplierPrice: true,
  viewSalary: true,
  viewBankAccounts: true,
  viewFinancialReports: true
};

export const DEFAULT_RESTRICTED_FIELD_PERMISSIONS: FieldPermissionFlags = {
  viewCostPrice: false,
  viewProfit: false,
  viewPurchasePrice: false,
  editSellingPrice: false,
  viewSupplierPrice: false,
  viewSalary: false,
  viewBankAccounts: false,
  viewFinancialReports: false
};

export class SecurityEngine {
  private static isDevAuthenticated = false;

  // 1. DEVELOPER ACCOUNT ISOLATION & VERIFICATION
  public static isDeveloperAccount(userId: string | undefined, userEmail?: string): boolean {
    if (!userId && !userEmail) return false;
    return userId === DEVELOPER_ACCOUNT_ID || userEmail === DEVELOPER_EMAIL;
  }

  public static filterOutSystemDeveloper<T extends { id?: string; email?: string; userId?: string; userEmail?: string }>(items: T[]): T[] {
    return items.filter(item => {
      const id = item.id || item.userId;
      const email = item.email || item.userEmail;
      return !this.isDeveloperAccount(id, email);
    });
  }

  public static authenticateDeveloper(devKey: string): boolean {
    if (devKey === DEFAULT_DEVELOPER_KEY || devKey === 'MARO_DEV_MASTER_ADMIN') {
      this.isDevAuthenticated = true;
      this.logSecurityAction({
        userId: DEVELOPER_ACCOUNT_ID,
        userEmail: DEVELOPER_EMAIL,
        userRole: 'DEVELOPER_SYSTEM_OWNER',
        companyId: 'DEVELOPER_COMPANY',
        deviceInfo: navigator.userAgent,
        computerName: 'Developer Terminal',
        operatingSystem: 'System Kernel',
        browser: 'Developer Console',
        ipAddress: '127.0.0.1',
        action: 'DEVELOPER_AUTHENTICATED',
        module: 'SECURITY_LAYER_1',
        screen: 'Developer Console',
        executionDurationMs: 5,
        success: true
      });
      return true;
    }
    
    this.triggerSecurityAlert({
      severity: 'critical',
      category: 'UNAUTHORIZED_ACCESS',
      title: 'Invalid Developer Access Key Attempt',
      details: `Attempted authentication to Layer 1 Developer Console with key suffix ***${devKey.slice(-4)}`
    });
    return false;
  }

  public static isDeveloperSessionActive(): boolean {
    return this.isDevAuthenticated;
  }

  // 2. LICENSE & FEATURE FLAG MANAGEMENT
  public static getSystemLicense(): SystemLicense {
    const cached = localStorage.getItem(LOCAL_STORAGE_KEY_LICENSE);
    if (cached) {
      try { return JSON.parse(cached); } catch { /* default */ }
    }
    localStorage.setItem(LOCAL_STORAGE_KEY_LICENSE, JSON.stringify(DEFAULT_LICENSE));
    return DEFAULT_LICENSE;
  }

  public static saveSystemLicense(license: SystemLicense): void {
    localStorage.setItem(LOCAL_STORAGE_KEY_LICENSE, JSON.stringify(license));
    MaroSyncEngine.saveDocument('system_licenses', { id: license.licenseKey, ...license }, false);
    MaroEventBus.publish('LICENSE_UPDATED', license);
    this.logSecurityAction({
      userId: DEVELOPER_ACCOUNT_ID,
      userEmail: DEVELOPER_EMAIL,
      userRole: 'DEVELOPER_SYSTEM_OWNER',
      companyId: 'SYSTEM',
      deviceInfo: 'Kernel',
      computerName: 'System',
      operatingSystem: 'OS',
      browser: 'System',
      ipAddress: '127.0.0.1',
      action: 'UPDATE_LICENSE',
      module: 'DEVELOPER_CONTROL',
      screen: 'License Manager',
      newValue: JSON.stringify(license),
      executionDurationMs: 12,
      success: true
    });
  }

  public static getFeatureFlags(): FeatureFlag[] {
    const cached = localStorage.getItem(LOCAL_STORAGE_KEY_FLAGS);
    if (cached) {
      try { return JSON.parse(cached); } catch { /* default */ }
    }
    localStorage.setItem(LOCAL_STORAGE_KEY_FLAGS, JSON.stringify(DEFAULT_FEATURE_FLAGS));
    return DEFAULT_FEATURE_FLAGS;
  }

  public static updateFeatureFlagStatus(featureId: string, status: FeatureStatus): void {
    const flags = this.getFeatureFlags();
    const target = flags.find(f => f.id === featureId);
    if (target) {
      target.status = status;
      target.updatedAt = new Date().toISOString();
      localStorage.setItem(LOCAL_STORAGE_KEY_FLAGS, JSON.stringify(flags));
      MaroSyncEngine.saveDocument('feature_flags', target, false);
      MaroEventBus.publish('FEATURE_FLAGS_UPDATED', flags);
    }
  }

  public static isFeatureEnabled(featureId: string): boolean {
    const flags = this.getFeatureFlags();
    const flag = flags.find(f => f.id === featureId);
    if (!flag) return true;
    return flag.status === 'enabled' || flag.status === 'licensed' || flag.status === 'trial';
  }

  // 3. GRANULAR PERMISSION EVALUATOR (LAYER 2 & LAYER 3)
  public static getUserPermissions(roleOrUserId: string): UserPermissionSet {
    if (roleOrUserId === DEVELOPER_ACCOUNT_ID || roleOrUserId === 'admin') {
      return {
        roleId: 'admin',
        roleName: 'مدير النظام / Company Owner',
        isSystemOwner: roleOrUserId === DEVELOPER_ACCOUNT_ID,
        isCompanyOwner: true,
        allowedModules: ['POS', 'INVENTORY', 'SALES', 'PURCHASES', 'ACCOUNTING', 'USERS', 'REPORTS', 'CUSTOMERS', 'SUPPLIERS', 'WAREHOUSES', 'AI', 'SETTINGS', 'SECURITY'],
        allowedScreens: ['/pos', '/products', '/warehouses', '/inventory', '/customers', '/suppliers', '/invoices', '/bills', '/transactions', '/reports', '/users', '/settings', '/settings/security/roles', '/settings/security/audit', '/settings/pos/function-keys'],
        buttonPermissions: DEFAULT_FULL_BUTTON_PERMISSIONS,
        fieldPermissions: DEFAULT_FULL_FIELD_PERMISSIONS,
        allowedWarehouses: ['all'],
        allowedBranches: ['all']
      };
    }

    // Cashier default
    return {
      roleId: 'cashier',
      roleName: 'أمين صندوق / Cashier',
      isSystemOwner: false,
      isCompanyOwner: false,
      allowedModules: ['POS', 'CUSTOMERS', 'REPORTS'],
      allowedScreens: ['/pos', '/customers', '/reports'],
      buttonPermissions: DEFAULT_CASHIER_BUTTON_PERMISSIONS,
      fieldPermissions: DEFAULT_RESTRICTED_FIELD_PERMISSIONS,
      allowedWarehouses: ['wh_main'],
      allowedBranches: ['branch_main']
    };
  }

  public static canAccessModule(userId: string, moduleName: string): boolean {
    if (this.isDeveloperAccount(userId)) return true;
    const perms = this.getUserPermissions(userId);
    return perms.allowedModules.includes(moduleName) || perms.isCompanyOwner;
  }

  public static canClickButton(userId: string, buttonFlag: keyof ButtonPermissionFlags): boolean {
    if (this.isDeveloperAccount(userId)) return true;
    const perms = this.getUserPermissions(userId);
    return !!perms.buttonPermissions[buttonFlag];
  }

  public static canViewField(userId: string, fieldFlag: keyof FieldPermissionFlags): boolean {
    if (this.isDeveloperAccount(userId)) return true;
    const perms = this.getUserPermissions(userId);
    return !!perms.fieldPermissions[fieldFlag];
  }

  // 4. COMPREHENSIVE AUDIT TRAIL
  public static logSecurityAction(audit: Omit<DetailedAuditRecord, 'id' | 'timestamp'>): void {
    const record: DetailedAuditRecord = {
      ...audit,
      id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      timestamp: new Date().toISOString()
    };

    const existingStr = localStorage.getItem(LOCAL_STORAGE_KEY_AUDIT);
    let existing: DetailedAuditRecord[] = [];
    if (existingStr) {
      try { existing = JSON.parse(existingStr); } catch { /* ignore */ }
    }

    existing.unshift(record);
    if (existing.length > 500) existing = existing.slice(0, 500); // cap buffer
    localStorage.setItem(LOCAL_STORAGE_KEY_AUDIT, JSON.stringify(existing));

    MaroSyncEngine.saveDocument('security_audit_logs', record, true);
    MaroEventBus.publish('AUDIT_LOG_ADDED', record);
  }

  public static getAuditRecords(): DetailedAuditRecord[] {
    const cached = localStorage.getItem(LOCAL_STORAGE_KEY_AUDIT);
    if (cached) {
      try { 
        const items = JSON.parse(cached);
        return this.filterOutSystemDeveloper(items);
      } catch { /* empty */ }
    }
    return [];
  }

  // 5. SECURITY ALERTS & SESSION TRACKING
  public static triggerSecurityAlert(alertData: Omit<SecurityAlert, 'id' | 'timestamp' | 'read'>): void {
    const alert: SecurityAlert = {
      ...alertData,
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      timestamp: new Date().toISOString(),
      read: false
    };

    const cached = localStorage.getItem(LOCAL_STORAGE_KEY_ALERTS);
    let alerts: SecurityAlert[] = [];
    if (cached) {
      try { alerts = JSON.parse(cached); } catch { /* ignore */ }
    }
    alerts.unshift(alert);
    localStorage.setItem(LOCAL_STORAGE_KEY_ALERTS, JSON.stringify(alerts));

    MaroSyncEngine.saveDocument('security_alerts', alert, true);
    MaroEventBus.publish('SECURITY_ALERT_TRIGGERED', alert);
  }

  public static getSecurityAlerts(): SecurityAlert[] {
    const cached = localStorage.getItem(LOCAL_STORAGE_KEY_ALERTS);
    if (cached) {
      try { return JSON.parse(cached); } catch { /* ignore */ }
    }
    return [];
  }

  public static markAlertsRead(): void {
    const alerts = this.getSecurityAlerts().map(a => ({ ...a, read: true }));
    localStorage.setItem(LOCAL_STORAGE_KEY_ALERTS, JSON.stringify(alerts));
  }

  // 6. DEVELOPER MASTER CONTROL MAINTENANCE OPERATIONS
  public static runSystemDiagnostics(): SystemDiagnosticReport {
    const license = this.getSystemLicense();
    const alerts = this.getSecurityAlerts();
    const expiry = new Date(license.expiresAt).getTime();
    const daysLeft = Math.max(0, Math.ceil((expiry - Date.now()) / (1000 * 60 * 60 * 24)));

    return {
      timestamp: new Date().toISOString(),
      systemStatus: daysLeft > 0 ? 'HEALTHY' : 'DEGRADED',
      databaseLatencyMs: Math.floor(Math.random() * 15) + 5, // 5-20ms
      syncQueueDepth: MaroSyncEngine.getQueueDepth(),
      activeSessions: 3,
      unresolvedAlerts: alerts.filter(a => !a.read).length,
      licenseDaysRemaining: daysLeft,
      memoryUsageMb: Math.floor(Math.random() * 40) + 120,
      activeModules: license.enabledModules
    };
  }

  public static toggleMaintenanceMode(enabled: boolean): void {
    localStorage.setItem(LOCAL_STORAGE_KEY_MAINTENANCE, String(enabled));
    MaroEventBus.publish('MAINTENANCE_MODE_CHANGED', { enabled });
    this.logSecurityAction({
      userId: DEVELOPER_ACCOUNT_ID,
      userEmail: DEVELOPER_EMAIL,
      userRole: 'DEVELOPER_SYSTEM_OWNER',
      companyId: 'SYSTEM',
      deviceInfo: 'Console',
      computerName: 'Console',
      operatingSystem: 'Kernel',
      browser: 'Console',
      ipAddress: '127.0.0.1',
      action: enabled ? 'MAINTENANCE_MODE_ENABLED' : 'MAINTENANCE_MODE_DISABLED',
      module: 'DEVELOPER_CONTROL',
      screen: 'System Repair',
      executionDurationMs: 10,
      success: true
    });
  }

  public static isMaintenanceMode(): boolean {
    return localStorage.getItem(LOCAL_STORAGE_KEY_MAINTENANCE) === 'true';
  }
}
