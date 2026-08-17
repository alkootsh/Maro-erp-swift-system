/**
 * @file licensing.ts
 * @module MARO Licensing Domain Types
 * @description Core interfaces & schemas for Ed25519 Signed Enterprise Licensing, Composite Device Binding & Activation Requests
 */

export type LicensePlan = 'TRIAL' | 'BASIC' | 'PRO' | 'ENTERPRISE';
export type LicenseStatus = 'TRIAL' | 'ACTIVE' | 'GRACE_PERIOD' | 'SUSPENDED' | 'EXPIRED' | 'UNVERIFIED' | 'REVOKED' | 'CANCELLED';

export interface CompositeDeviceIdentity {
  persistentDeviceId: string; // Permanent UUID generated on first run and stored locally
  hostname: string;
  osPlatform: string;
  osRelease: string;
  cpuModel: string;
  cpuArch: string;
  primaryMacHash: string;
  fingerprintVersion: string; // e.g. "v2.0-composite"
  compositeHash: string; // SHA-256 digest of key hardware characteristics
}

export interface ActivationRequestPackage {
  requestId: string;
  appVersion: string;
  timestamp: string;
  company: {
    name: string;
    industry: string;
    taxNumber: string;
    address: string;
  };
  contact: {
    adminName: string;
    phone: string;
    whatsapp: string;
    email: string;
  };
  device: CompositeDeviceIdentity;
  requested: {
    plan: LicensePlan;
    modules: string[];
    maxUsers: number;
    maxBranches: number;
    maxWarehouses: number;
    maxPosDevices: number;
  };
  nonce: string;
}

export interface SignedLicensePayload {
  licenseId: string;
  licenseVersion: string;
  keyId: string;
  tenant: {
    tenantId: string;
    companyName: string;
    industry: string;
  };
  deviceBinding: {
    persistentDeviceId: string;
    compositeHash: string;
    maxPosDevices: number;
    allowHardwareTolerance: boolean; // Allows minor HW upgrades (e.g., RAM/NIC change)
  };
  entitlements: {
    plan: LicensePlan;
    enabledModules: string[];
    maxUsers: number;
    maxBranches: number;
    maxWarehouses: number;
    maxPosDevices: number;
  };
  validity: {
    issuedAt: string;
    expiresAt: string;
    gracePeriodDays: number;
  };
  signature: string; // Ed25519 hex-encoded signature
}

export interface LicenseVerificationResult {
  valid: boolean;
  status: LicenseStatus;
  licenseId?: string;
  companyName?: string;
  plan?: LicensePlan;
  allowOperationalWrite: boolean;
  allowAdminAccess: boolean;
  enabledModules: string[];
  maxUsers: number;
  maxBranches: number;
  maxWarehouses: number;
  maxPosDevices: number;
  reason?: string;
  issuedAt?: string;
  expiresAt?: string;
  expiryDate?: string;
  daysRemaining?: number;
  tenantId?: string;
  isOffline?: boolean;
  deviceMatch?: boolean;
}

export interface LicenseAuditRecord {
  id: string;
  licenseId: string;
  action: 'ISSUED' | 'ACTIVATED' | 'RENEWED' | 'REVOKED' | 'VERIFIED' | 'TAMPER_ATTEMPT';
  tenantId: string;
  companyName: string;
  deviceId: string;
  issuedBy: string;
  timestamp: string;
  details: Record<string, any>;
}
