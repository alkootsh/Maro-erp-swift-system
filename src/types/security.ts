/**
 * @file security.ts
 * @module تعريفات الأنواع والبيانات (TypeScript Types)
 * @description ملف جزء من نظام MARO ERP. الوظيفة: security.ts.
 */
// MARO ERP - Enterprise Security & Permission System Typings

export type SecurityLayer = 'DEVELOPER' | 'COMPANY_OWNER' | 'USER';

export type FeatureStatus = 
  | 'enabled' 
  | 'disabled' 
  | 'hidden' 
  | 'trial' 
  | 'licensed' 
  | 'premium' 
  | 'enterprise' 
  | 'coming_soon';

export type LicensePlan = 'trial' | 'standard' | 'premium' | 'enterprise';

export interface SystemLicense {
  licenseKey: string;
  companyName: string;
  plan: LicensePlan;
  maxUsers: number;
  maxTerminals: number;
  status: 'active' | 'expired' | 'suspended' | 'grace_period';
  issuedAt: string;
  expiresAt: string;
  enabledModules: string[];
  customFeatures: Record<string, boolean>;
}

export interface FeatureFlag {
  id: string;
  name: string;
  module: string;
  status: FeatureStatus;
  description: string;
  requiresPlan: LicensePlan;
  updatedAt: string;
}

export interface FieldPermissionFlags {
  viewCostPrice: boolean;
  viewProfit: boolean;
  viewPurchasePrice: boolean;
  editSellingPrice: boolean;
  viewSupplierPrice: boolean;
  viewSalary: boolean;
  viewBankAccounts: boolean;
  viewFinancialReports: boolean;
}

export interface ButtonPermissionFlags {
  createItem: boolean;
  editItem: boolean;
  deleteItem: boolean;
  approveDocument: boolean;
  rejectDocument: boolean;
  applyDiscount: boolean;
  overridePrice: boolean;
  cancelInvoice: boolean;
  returnInvoice: boolean;
  printReceipt: boolean;
  reprintReceipt: boolean;
  openCashDrawer: boolean;
  closeShift: boolean;
  inventoryCount: boolean;
  adjustStock: boolean;
  manageUsers: boolean;
  manageRoles: boolean;
  manageSystem: boolean;
}

export interface UserPermissionSet {
  roleId: string;
  roleName: string;
  isSystemOwner: boolean;
  isCompanyOwner: boolean;
  allowedModules: string[];
  allowedScreens: string[];
  buttonPermissions: ButtonPermissionFlags;
  fieldPermissions: FieldPermissionFlags;
  allowedWarehouses: string[];
  allowedBranches: string[];
}

export interface DetailedAuditRecord {
  id: string;
  userId: string;
  userEmail: string;
  userRole: string;
  companyId: string;
  branchId?: string;
  warehouseId?: string;
  terminalId?: string;
  deviceInfo: string;
  computerName: string;
  operatingSystem: string;
  browser: string;
  ipAddress: string;
  macAddress?: string;
  timestamp: string;
  action: string;
  module: string;
  screen: string;
  documentNo?: string;
  oldValue?: string;
  newValue?: string;
  reason?: string;
  executionDurationMs: number;
  success: boolean;
  failureMessage?: string;
}

export interface SecuritySession {
  sessionId: string;
  userId: string;
  userEmail: string;
  role: string;
  loginTime: string;
  lastActiveTime: string;
  ipAddress: string;
  device: string;
  status: 'ACTIVE' | 'IDLE' | 'TIMEOUT' | 'LOGGED_OUT' | 'FORCE_LOGGED_OUT';
}

export interface SecurityAlert {
  id: string;
  severity: 'critical' | 'warning' | 'info';
  category: 
    | 'LOGIN_FAILURE' 
    | 'PERMISSION_VIOLATION' 
    | 'UNAUTHORIZED_ACCESS' 
    | 'PRICE_OVERRIDE' 
    | 'LARGE_DISCOUNT' 
    | 'MASS_DELETE' 
    | 'SYNC_FAILURE' 
    | 'LICENSE_EXPIRED';
  title: string;
  details: string;
  userId?: string;
  userEmail?: string;
  ipAddress?: string;
  timestamp: string;
  read: boolean;
}

export interface SystemDiagnosticReport {
  timestamp: string;
  systemStatus: 'HEALTHY' | 'DEGRADED' | 'MAINTENANCE';
  databaseLatencyMs: number;
  syncQueueDepth: number;
  activeSessions: number;
  unresolvedAlerts: number;
  licenseDaysRemaining: number;
  memoryUsageMb: number;
  activeModules: string[];
}
