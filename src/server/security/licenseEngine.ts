/**
 * @file licenseEngine.ts
 * @module Server Security & Licensing
 * @description Enterprise Server-Side License Verification & Module Entitlement Engine (PostgreSQL & Ed25519 Source of Truth)
 */
import { eq } from 'drizzle-orm';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { db, isDatabaseConfigured } from '../../db/index';
import { licenses } from '../../db/schema';
import { AuditLogger } from './auditLogger';
import { Ed25519Engine } from '../../lib/crypto/ed25519Engine';
import { DeviceEngine } from '../../lib/crypto/deviceEngine';
import { 
  SignedLicensePayload, 
  ActivationRequestPackage, 
  LicensePlan, 
  LicenseStatus, 
  LicenseVerificationResult 
} from '../../types/licensing';

export type { LicenseStatus, LicenseVerificationResult };
export type LicenseValidationResult = LicenseVerificationResult;

export interface OfflineLicenseToken {
  licenseId: string;
  tenantId: string;
  plan: string;
  status: LicenseStatus;
  allowOperationalWrite: boolean;
  allowAdminAccess: boolean;
  maxUsers: number;
  maxBranches: number;
  maxWarehouses: number;
  maxPosDevices: number;
  enabledModules: string[];
  issuedAt: string;
  expiryDate: string;
  gracePeriodEndsAt?: string | null;
  deviceId?: string;
  signature: string;
}

const OFFLINE_LICENSE_SECRET = process.env.OFFLINE_LICENSE_SECRET || 'MARO_ENTERPRISE_LICENSE_OFFLINE_SECRET_2026';
const LOCAL_LICENSE_FILE = path.join(process.cwd(), '.maro-license.json');
const ACTIVATION_REQS_FILE = path.join(process.cwd(), '.maro-activation-requests.json');

export function computeOfflineLicenseSignature(token: Omit<OfflineLicenseToken, 'signature'>): string {
  const payload = [
    token.licenseId,
    token.tenantId,
    token.plan,
    token.status,
    token.expiryDate,
    token.enabledModules.join(','),
    token.deviceId || ''
  ].join('|');
  return crypto.createHmac('sha256', OFFLINE_LICENSE_SECRET).update(payload).digest('hex');
}

// In-memory cache for validated online license snapshots
const tenantLicenseCache = new Map<string, LicenseVerificationResult>();

// Cryptographically verified Offline License Registry (Legacy Compatibility)
const offlineLicenseRegistry = new Map<string, OfflineLicenseToken>();

export class ServerLicenseEngine {
  /**
   * Register a cryptographically signed offline license token (Legacy compatibility)
   */
  static registerOfflineLicenseToken(token: OfflineLicenseToken): boolean {
    const { signature, ...rest } = token;
    const expectedSig = computeOfflineLicenseSignature(rest);
    if (signature !== expectedSig) {
      console.error(`[LICENSE] Rejected tampered offline license token for tenant ${token.tenantId}`);
      return false;
    }
    offlineLicenseRegistry.set(token.tenantId, token);
    return true;
  }

  /**
   * Verify an offline license token cryptographically (Legacy compatibility)
   */
  static verifyOfflineLicenseToken(token: OfflineLicenseToken, targetTenantId: string, targetDeviceId?: string): { valid: boolean; reason?: string } {
    if (token.tenantId !== targetTenantId) {
      return { valid: false, reason: 'معرف الشركة غير متطابق مع مفتاح الترخيص.' };
    }
    const { signature, ...rest } = token;
    const expectedSig = computeOfflineLicenseSignature(rest);
    if (signature !== expectedSig) {
      return { valid: false, reason: 'توقيع الترخيص غير صالح أو تم تعديله بصورة غير مصرح بها.' };
    }
    if (token.deviceId && targetDeviceId && token.deviceId !== targetDeviceId) {
      return { valid: false, reason: 'الترخيص غير مسجل على هذا الجهاز.' };
    }
    const expiry = new Date(token.expiryDate);
    if (new Date() > expiry) {
      return { valid: false, reason: 'انتهت صلاحية الترخيص الموفق لهذه المؤسسة.' };
    }
    return { valid: true };
  }

  /**
   * Loads the local Ed25519 signed license from disk if it exists
   */
  static getLocalLicense(): SignedLicensePayload | null {
    try {
      if (fs.existsSync(LOCAL_LICENSE_FILE)) {
        const raw = fs.readFileSync(LOCAL_LICENSE_FILE, 'utf8');
        return JSON.parse(raw) as SignedLicensePayload;
      }
    } catch (err) {
      console.error('[LICENSE] Error reading local Ed25519 license', err);
    }
    return null;
  }

  /**
   * Saves a valid Ed25519 signed license to disk after verifying signature and device fingerprint
   */
  static saveLocalLicense(signedLicense: SignedLicensePayload): { success: boolean; error?: string } {
    try {
      // 1. Verify Ed25519 signature
      const sigCheck = Ed25519Engine.verifyLicenseSignature(signedLicense);
      if (!sigCheck.valid) {
        return { success: false, error: sigCheck.error || 'التوقيع الرقمي للترخيص غير صالح.' };
      }

      // 2. Verify device binding with tolerance
      const hwCheck = DeviceEngine.verifyHardwareTolerance(
        signedLicense.deviceBinding.persistentDeviceId,
        signedLicense.deviceBinding.compositeHash,
        signedLicense.deviceBinding.allowHardwareTolerance
      );
      if (!hwCheck.matched) {
        return { success: false, error: hwCheck.details };
      }

      // 3. Save to disk
      fs.writeFileSync(LOCAL_LICENSE_FILE, JSON.stringify(signedLicense, null, 2), 'utf8');

      // Clear memory caches to force reload
      tenantLicenseCache.clear();

      return { success: true };
    } catch (err: any) {
      return { success: false, error: `فشل حفظ الترخيص: ${err.message}` };
    }
  }

  /**
   * Remove the active local license (Deactivation)
   */
  static deleteLocalLicense(): void {
    try {
      if (fs.existsSync(LOCAL_LICENSE_FILE)) {
        fs.unlinkSync(LOCAL_LICENSE_FILE);
      }
      tenantLicenseCache.clear();
    } catch (err) {
      console.error('[LICENSE] Failed to delete local license file', err);
    }
  }

  /**
   * Gathers list of stored activation requests
   */
  static getActivationRequests(): ActivationRequestPackage[] {
    try {
      if (fs.existsSync(ACTIVATION_REQS_FILE)) {
        const raw = fs.readFileSync(ACTIVATION_REQS_FILE, 'utf8');
        return JSON.parse(raw) as ActivationRequestPackage[];
      }
    } catch {
      // Return empty array if file does not exist yet
    }
    return [];
  }

  /**
   * Save a new activation request to the local requests register
   */
  static saveActivationRequest(req: ActivationRequestPackage): void {
    try {
      const current = this.getActivationRequests();
      const filtered = current.filter(r => r.requestId !== req.requestId);
      filtered.push(req);
      fs.writeFileSync(ACTIVATION_REQS_FILE, JSON.stringify(filtered, null, 2), 'utf8');
    } catch (err) {
      console.error('[LICENSE] Failed to save activation request', err);
    }
  }

  /**
   * Fetch and calculate current effective license status for a Tenant.
   * Prioritizes the Ed25519 Asymmetric Signed License File if present.
   */
  static async getTenantLicense(tenantId: string, deviceId?: string): Promise<LicenseValidationResult> {
    const now = new Date();

    // ==========================================
    // LAYER 1: CHECK ED25519 SECURED LOCAL LICENSE FILE (HIGHEST PRIORITY)
    // ==========================================
    const ed25519License = this.getLocalLicense();
    if (ed25519License) {
      // 1. Verify cryptographic signature
      const sigCheck = Ed25519Engine.verifyLicenseSignature(ed25519License);
      if (!sigCheck.valid) {
        return {
          valid: false,
          status: 'UNVERIFIED',
          allowOperationalWrite: false,
          allowAdminAccess: false,
          enabledModules: [],
          maxUsers: 0,
          maxBranches: 0,
          maxWarehouses: 0,
          maxPosDevices: 0,
          reason: `توقيع الترخيص الرقمي غير صالح أو تم التعديل عليه: ${sigCheck.error}`,
          isOffline: !isDatabaseConfigured(),
          deviceMatch: false
        };
      }

      // 2. Verify physical hardware characteristics binding
      const hwCheck = DeviceEngine.verifyHardwareTolerance(
        ed25519License.deviceBinding.persistentDeviceId,
        ed25519License.deviceBinding.compositeHash,
        ed25519License.deviceBinding.allowHardwareTolerance
      );

      if (!hwCheck.matched) {
        return {
          valid: false,
          status: 'UNVERIFIED',
          allowOperationalWrite: false,
          allowAdminAccess: false,
          enabledModules: [],
          maxUsers: 0,
          maxBranches: 0,
          maxWarehouses: 0,
          maxPosDevices: 0,
          reason: `الترخيص غير مسجل على هذا الجهاز: ${hwCheck.details}`,
          isOffline: !isDatabaseConfigured(),
          deviceMatch: false
        };
      }

      // 3. Check expiration
      const expiry = new Date(ed25519License.validity.expiresAt);
      const isExpired = now > expiry;
      let status: LicenseStatus = 'ACTIVE';
      let allowOperationalWrite = true;
      let reason: string | undefined;

      if (isExpired) {
        status = 'EXPIRED';
        allowOperationalWrite = false;
        reason = 'انتهت صلاحية ترخيص المنصة - يرجى تجديد الاشتراك فوراً.';
      }

      const diffTime = expiry.getTime() - now.getTime();
      const daysRemaining = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

      return {
        valid: !isExpired,
        status,
        licenseId: ed25519License.licenseId,
        companyName: ed25519License.tenant.companyName,
        plan: ed25519License.entitlements.plan,
        allowOperationalWrite,
        allowAdminAccess: true,
        enabledModules: ed25519License.entitlements.enabledModules,
        maxUsers: ed25519License.entitlements.maxUsers,
        maxBranches: ed25519License.entitlements.maxBranches,
        maxWarehouses: ed25519License.entitlements.maxWarehouses,
        maxPosDevices: ed25519License.entitlements.maxPosDevices,
        reason,
        issuedAt: ed25519License.validity.issuedAt,
        expiresAt: ed25519License.validity.expiresAt,
        expiryDate: ed25519License.validity.expiresAt,
        daysRemaining,
        isOffline: !isDatabaseConfigured(),
        deviceMatch: true
      };
    }

    // ==========================================
    // LAYER 2: FALLBACK TO DATABASE (WHEN NO ED25519 FILE EXISTS)
    // ==========================================
    try {
      if (isDatabaseConfigured()) {
        const [licenseRecord] = await db.select().from(licenses).where(eq(licenses.tenantId, tenantId));

        if (licenseRecord) {
          const rawStatus = (licenseRecord.status || 'ACTIVE').toUpperCase() as LicenseStatus;
          const expiry = new Date(licenseRecord.expiryDate);
          const graceEnd = licenseRecord.gracePeriodEndsAt ? new Date(licenseRecord.gracePeriodEndsAt) : null;

          let effectiveStatus: LicenseStatus = rawStatus;

          if (rawStatus === 'SUSPENDED') {
            effectiveStatus = 'SUSPENDED';
          } else if (now > expiry) {
            if (graceEnd && now <= graceEnd) {
              effectiveStatus = 'GRACE_PERIOD';
            } else {
              effectiveStatus = 'EXPIRED';
            }
          }

          const enabledMods = (licenseRecord.enabledModules as string[]) || [];

          let allowOperationalWrite = false;
          let allowAdminAccess = true;
          let reason: string | undefined;

          switch (effectiveStatus) {
            case 'ACTIVE':
            case 'TRIAL':
              allowOperationalWrite = true;
              allowAdminAccess = true;
              break;
            case 'GRACE_PERIOD':
              allowOperationalWrite = true;
              allowAdminAccess = true;
              reason = 'الترخيص في فترة السماح (Grace Period) - يرجى تجديد الاشتراك فوراً';
              break;
            case 'EXPIRED':
              allowOperationalWrite = false;
              allowAdminAccess = true;
              reason = 'انتهت صلاحية الترخيص - تم تجميد العمليات التشغيلية حتى التجديد';
              break;
            case 'SUSPENDED':
              allowOperationalWrite = false;
              allowAdminAccess = true;
              reason = 'تم تعليق الترخيص مؤقتاً - يرجى مراجعة إدارة النظام للتفعيل';
              break;
          }

          const result: LicenseVerificationResult = {
            valid: effectiveStatus === 'ACTIVE' || effectiveStatus === 'TRIAL' || effectiveStatus === 'GRACE_PERIOD',
            status: effectiveStatus,
            plan: licenseRecord.plan as LicensePlan,
            allowOperationalWrite,
            allowAdminAccess,
            reason,
            licenseId: licenseRecord.id,
            tenantId,
            enabledModules: enabledMods,
            maxUsers: licenseRecord.maxUsers,
            maxBranches: licenseRecord.maxBranches,
            maxWarehouses: licenseRecord.maxWarehouses,
            maxPosDevices: licenseRecord.maxPosDevices,
            issuedAt: licenseRecord.startDate.toISOString(),
            expiresAt: licenseRecord.expiryDate.toISOString(),
            expiryDate: licenseRecord.expiryDate.toISOString(),
            isOffline: false,
            deviceMatch: true
          };

          tenantLicenseCache.set(tenantId, result);
          return result;
        }
      }
    } catch {
      // Standalone fallback
    }

    // ==========================================
    // LAYER 3: IN-MEMORY CACHE OR LEGACY OFFLINE HMAC
    // ==========================================
    const cached = tenantLicenseCache.get(tenantId);
    if (cached) {
      if (cached.expiresAt && new Date(cached.expiresAt) < now) {
        return {
          ...cached,
          valid: false,
          status: 'EXPIRED',
          allowOperationalWrite: false,
          reason: 'انتهت صلاحية الترخيص الموثق مسبقاً (تم تجميد العمليات التشغيلية).'
        };
      }
      return cached;
    }

    const legacyToken = offlineLicenseRegistry.get(tenantId);
    if (legacyToken) {
      const verification = this.verifyOfflineLicenseToken(legacyToken, tenantId, deviceId);
      if (verification.valid) {
        return {
          valid: legacyToken.status === 'ACTIVE' || legacyToken.status === 'TRIAL' || legacyToken.status === 'GRACE_PERIOD',
          status: legacyToken.status,
          plan: legacyToken.plan as LicensePlan,
          allowOperationalWrite: legacyToken.allowOperationalWrite,
          allowAdminAccess: legacyToken.allowAdminAccess,
          licenseId: legacyToken.licenseId,
          tenantId: legacyToken.tenantId,
          enabledModules: legacyToken.enabledModules,
          maxUsers: legacyToken.maxUsers,
          maxBranches: legacyToken.maxBranches,
          maxWarehouses: legacyToken.maxWarehouses,
          maxPosDevices: legacyToken.maxPosDevices,
          issuedAt: legacyToken.issuedAt,
          expiresAt: legacyToken.expiryDate,
          isOffline: true,
          deviceMatch: true
        };
      }
    }

    // Default Fallback: NO LICENSE
    return {
      valid: false,
      status: 'UNVERIFIED',
      plan: 'NONE' as any,
      allowOperationalWrite: false,
      allowAdminAccess: false,
      tenantId,
      maxUsers: 0,
      maxBranches: 0,
      maxWarehouses: 0,
      maxPosDevices: 0,
      enabledModules: [],
      reason: 'الخادم غير متاح — تعذر التحقق من الترخيص.',
      isOffline: true,
      deviceMatch: false
    };
  }

  /**
   * Verify whether a specific module is entitled for a tenant
   */
  static async checkModuleEntitlement(tenantId: string, moduleCode: string): Promise<{
    allowed: boolean;
    reason?: string;
    license: LicenseValidationResult;
  }> {
    const license = await this.getTenantLicense(tenantId);
    
    if (!license.valid) {
      return {
        allowed: false,
        reason: license.reason || 'الترخيص غير صالح أو غير موثق. تم منع الوصول للموديول المطلوب.',
        license
      };
    }

    const isModuleIncluded = license.enabledModules.some(
      m => m.toUpperCase() === moduleCode.toUpperCase() || m === '*' || m.toUpperCase() === 'ALL'
    );

    if (!isModuleIncluded) {
      return {
        allowed: false,
        reason: `الموديول (${moduleCode}) غير متاح في باقة الاشتراك الحالية (${license.plan})`,
        license
      };
    }

    return {
      allowed: true,
      license
    };
  }

  /**
   * Legacy activation API helper for backwards compatibility
   */
  static async activateLicenseKey(
    tenantId: string, 
    licenseKey: string,
    performedByUserId?: string,
    ipAddress?: string
  ): Promise<{ success: boolean; message: string; license?: LicenseValidationResult }> {
    const cleanKey = (licenseKey || '').trim().toUpperCase();

    if (!cleanKey.startsWith('MARO-') && !cleanKey.startsWith('DEV-')) {
      await AuditLogger.log({
        tenantId,
        userId: performedByUserId,
        action: 'LICENSE_ACTIVATION_FAILED',
        entityType: 'LICENSE',
        ipAddress,
        metadata: { licenseKey: cleanKey, reason: 'Invalid license format' }
      });
      return {
        success: false,
        message: 'مفتاح الترخيص غير صالح. يرجى إدخال مفتاح ترخيص رسمي يبدأ بـ MARO-'
      };
    }

    const isEnterprise = cleanKey.includes('ENT') || cleanKey.includes('ENTERPRISE');
    const isPro = cleanKey.includes('PRO') || cleanKey.includes('PREMIUM');
    const isBasic = cleanKey.includes('BASIC') || cleanKey.includes('STD');

    const plan = isEnterprise ? 'ENTERPRISE' : isPro ? 'PRO' : isBasic ? 'BASIC' : 'PRO';
    const now = new Date();
    const expiryDate = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000); // 1 year

    const enabledModules = isEnterprise 
      ? ['POS', 'SALES', 'PURCHASES', 'INVENTORY', 'ACCOUNTING', 'REPORTS', 'AI', 'CUSTOMERS', 'SUPPLIERS', 'WAREHOUSES', 'CRM', 'MANUFACTURING']
      : isPro 
      ? ['POS', 'SALES', 'PURCHASES', 'INVENTORY', 'ACCOUNTING', 'REPORTS', 'AI', 'CUSTOMERS', 'SUPPLIERS', 'WAREHOUSES']
      : ['POS', 'SALES', 'PURCHASES', 'INVENTORY', 'REPORTS', 'CUSTOMERS', 'SUPPLIERS'];

    try {
      if (!isDatabaseConfigured()) {
        throw new Error('DATABASE_URL is not configured');
      }

      const [existing] = await db.select().from(licenses).where(eq(licenses.tenantId, tenantId));

      if (existing) {
        await db.update(licenses).set({
          licenseKey: cleanKey,
          plan,
          status: 'ACTIVE',
          startDate: now,
          expiryDate,
          gracePeriodEndsAt: null,
          maxUsers: isEnterprise ? 100 : isPro ? 25 : 5,
          maxBranches: isEnterprise ? 20 : isPro ? 5 : 2,
          maxWarehouses: isEnterprise ? 30 : isPro ? 10 : 3,
          maxPosDevices: isEnterprise ? 50 : isPro ? 10 : 2,
          enabledModules,
        }).where(eq(licenses.id, existing.id));
      } else {
        await db.insert(licenses).values({
          tenantId,
          licenseKey: cleanKey,
          plan,
          status: 'ACTIVE',
          startDate: now,
          expiryDate,
          maxUsers: isEnterprise ? 100 : isPro ? 25 : 5,
          maxBranches: isEnterprise ? 20 : isPro ? 5 : 2,
          maxWarehouses: isEnterprise ? 30 : isPro ? 10 : 3,
          maxPosDevices: isEnterprise ? 50 : isPro ? 10 : 2,
          enabledModules,
        });
      }

      await AuditLogger.log({
        tenantId,
        userId: performedByUserId,
        action: 'LICENSE_ACTIVATED',
        entityType: 'LICENSE',
        ipAddress,
        metadata: { plan, expiryDate: expiryDate.toISOString() }
      });

      const updatedLicense = await this.getTenantLicense(tenantId);

      return {
        success: true,
        message: `تم تفعيل ترخيص (${plan}) بنجاح حتى ${expiryDate.toLocaleDateString('ar-EG')}`,
        license: updatedLicense
      };
    } catch (err: any) {
      return {
        success: false,
        message: 'لا يمكن تفعيل أو تعديل الترخيص أثناء انقطاع الاتصال بقاعدة البيانات المركزية.'
      };
    }
  }

  static _setMockLicenseForTesting(tenantId: string, license: LicenseValidationResult): void {
    tenantLicenseCache.set(tenantId, license);
  }

  static _clearMockLicenseCache(): void {
    tenantLicenseCache.clear();
    offlineLicenseRegistry.clear();
  }
}
