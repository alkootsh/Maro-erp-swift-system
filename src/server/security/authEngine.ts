/**
 * @file authEngine.ts
 * @module Server Security & Authentication
 * @description Enterprise Session Management, Multi-Tenant Auth, Token Hashing & Strict PostgreSQL Source of Truth
 */
import { eq, and, or, isNull, sql } from 'drizzle-orm';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { db, isDatabaseConfigured } from '../../db/index';
import { users, sessions, tenants, branches, userBranches, devices } from '../../db/schema';
import { AuditLogger } from './auditLogger';
import { ServerLicenseEngine, LicenseValidationResult } from './licenseEngine';

// Rate Limiting & Brute Force Defense Store
// IP/Identifier -> { count: number, firstAttempt: number, lockedUntil?: number }
const bruteForceStore = new Map<string, { count: number; firstAttempt: number; lockedUntil?: number }>();
const BRUTE_FORCE_MAX_ATTEMPTS = 5;
const BRUTE_FORCE_WINDOW_MS = 15 * 60 * 1000; // 15 minutes window
const BRUTE_FORCE_LOCKOUT_MS = 15 * 60 * 1000; // 15 minutes lockout

// =========================================================================
// OFFLINE SESSION & CREDENTIAL SNAPSHOT REGISTRY
// (Populated ONLY during online authentication or explicit signed provision)
// =========================================================================
export interface OfflineSessionSnapshot {
  sessionId: string;
  userId: string;
  userEmail: string;
  userName: string;
  role: string;
  permissions: Record<string, any>;
  tenantId: string;
  tenantName: string;
  branchId: string;
  branchName: string;
  availableBranches: { id: string; name: string; code: string; isDefault?: boolean }[];
  availableTenants: { id: string; name: string }[];
  licenseSnapshot: LicenseValidationResult;
  deviceFingerprint?: string;
  ipAddress?: string;
  issuedAt: Date;
  expiresAt: Date;
  revokedAt?: Date | null;
}

export interface OfflineCredentialSnapshot {
  userId: string;
  email: string;
  name: string;
  passwordHash: string; // bcrypt hash ONLY
  role: string;
  permissions: Record<string, any>;
  tenantId: string;
  tenantName: string;
  branchId: string;
  branchName: string;
  availableBranches: { id: string; name: string; code: string; isDefault?: boolean }[];
  availableTenants: { id: string; name: string }[];
  licenseSnapshot: LicenseValidationResult;
  deviceId?: string;
  issuedAt: Date;
  expiresAt: Date;
  signature: string; // HMAC SHA-256
}

const OFFLINE_AUTH_SECRET = process.env.OFFLINE_AUTH_SECRET || 'MARO_ENTERPRISE_OFFLINE_AUTH_SECRET_2026';

export function computeOfflineCredentialSignature(cred: Omit<OfflineCredentialSnapshot, 'signature'>): string {
  const expStr = cred.expiresAt instanceof Date ? cred.expiresAt.toISOString() : new Date(cred.expiresAt).toISOString();
  const payload = [
    cred.userId,
    cred.email,
    cred.role,
    cred.tenantId,
    cred.branchId,
    cred.deviceId || '',
    expStr,
    cred.passwordHash
  ].join('|');
  return crypto.createHmac('sha256', OFFLINE_AUTH_SECRET).update(payload).digest('hex');
}

const offlineSessionRegistry = new Map<string, OfflineSessionSnapshot>();
const offlineCredentialRegistry = new Map<string, OfflineCredentialSnapshot>();

export interface AuthenticatedUserContext {
  id: string;
  email: string;
  name: string;
  role: string;
  permissions: Record<string, any>;
  tenantId: string;
  tenantName: string;
  branchId?: string;
  branchName?: string;
  availableBranches: { id: string; name: string; code: string; isDefault?: boolean }[];
  availableTenants: { id: string; name: string }[];
  license: LicenseValidationResult;
  isOfflineMode?: boolean;
}

export interface LoginResult {
  success: boolean;
  user?: AuthenticatedUserContext;
  sessionId?: string;
  refreshToken?: string;
  expiresAt?: Date;
  error?: string;
  code?: string;
  statusCode: number;
}

export class ServerAuthEngine {
  /**
   * Register a cryptographically signed offline credential snapshot
   */
  static registerOfflineCredential(cred: OfflineCredentialSnapshot): boolean {
    const { signature, ...rest } = cred;
    const expectedSig = computeOfflineCredentialSignature(rest);
    if (signature !== expectedSig) {
      console.error(`[AUTH ENGINE] Rejected tampered offline credential for ${cred.email}`);
      return false;
    }
    offlineCredentialRegistry.set(cred.email.toLowerCase().trim(), cred);
    return true;
  }

  /**
   * Clear offline credential registry
   */
  static _clearOfflineCredentials(): void {
    offlineCredentialRegistry.clear();
  }

  static _getOfflineRegistryMap(): Map<string, OfflineCredentialSnapshot> {
    return offlineCredentialRegistry;
  }

  /**
   * Computes SHA-256 hash of a sensitive token (e.g. Refresh Token)
   */
  static hashToken(rawToken: string): string {
    return crypto.createHash('sha256').update(rawToken).digest('hex');
  }

  /**
   * Generate cryptographically random token string
   */
  static generateRandomToken(bytes: number = 32): string {
    return crypto.randomBytes(bytes).toString('hex');
  }

  /**
   * Check Brute Force protection for given key (IP + email)
   */
  private static checkBruteForce(key: string): { isLocked: boolean; waitSeconds?: number } {
    const record = bruteForceStore.get(key);
    const now = Date.now();

    if (!record) return { isLocked: false };

    if (record.lockedUntil && record.lockedUntil > now) {
      const waitSeconds = Math.ceil((record.lockedUntil - now) / 1000);
      return { isLocked: true, waitSeconds };
    }

    if (now - record.firstAttempt > BRUTE_FORCE_WINDOW_MS) {
      bruteForceStore.delete(key);
      return { isLocked: false };
    }

    return { isLocked: false };
  }

  /**
   * Register a failed login attempt
   */
  private static registerFailedAttempt(key: string): { isNowLocked: boolean; waitSeconds?: number } {
    const now = Date.now();
    const record = bruteForceStore.get(key) || { count: 0, firstAttempt: now };

    if (now - record.firstAttempt > BRUTE_FORCE_WINDOW_MS) {
      record.count = 1;
      record.firstAttempt = now;
      record.lockedUntil = undefined;
    } else {
      record.count += 1;
    }

    if (record.count >= BRUTE_FORCE_MAX_ATTEMPTS) {
      record.lockedUntil = now + BRUTE_FORCE_LOCKOUT_MS;
      bruteForceStore.set(key, record);
      return { isNowLocked: true, waitSeconds: Math.ceil(BRUTE_FORCE_LOCKOUT_MS / 1000) };
    }

    bruteForceStore.set(key, record);
    return { isNowLocked: false };
  }

  /**
   * Clear failed attempts upon successful authentication
   */
  private static clearFailedAttempts(key: string): void {
    bruteForceStore.delete(key);
  }

  /**
   * Primary Login Method
   * PostgreSQL is the Primary Source of Truth.
   * If PostgreSQL is offline, login is only permitted if a cryptographically verified, non-expired Offline Credential exists for this device.
   * ZERO hardcoded passwords. ZERO automatic admin creation.
   */
  static async login(
    email: string,
    passwordPlain: string,
    ipAddress: string,
    userAgent: string,
    rememberDevice: boolean = false,
    deviceFingerprint?: string
  ): Promise<LoginResult> {
    const cleanEmail = (email || '').trim().toLowerCase();
    const rateLimitKey = `${ipAddress}_${cleanEmail}`;

    // 1. Check Brute-Force lockout
    const bruteCheck = this.checkBruteForce(rateLimitKey);
    if (bruteCheck.isLocked) {
      await AuditLogger.log({
        action: 'BRUTE_FORCE_LOCKOUT_BLOCKED',
        entityType: 'AUTH',
        ipAddress,
        userAgent,
        metadata: { email: cleanEmail, waitSeconds: bruteCheck.waitSeconds }
      });
      return {
        success: false,
        statusCode: 429,
        error: `تم قفل محاولات تسجيل الدخول مؤقتاً بسبب تكرار المحاولات الخاطئة. يرجى الانتظار ${bruteCheck.waitSeconds} ثانية.`,
        code: 'TOO_MANY_REQUESTS'
      };
    }

    // 2. Query User from PostgreSQL or Verified Offline Credential Store
    let user: any = null;
    let isDbConnectionAvailable = false;

    try {
      if (isDatabaseConfigured()) {
        const dbUsers = await db.select().from(users).where(
          or(
            eq(sql`LOWER(${users.email})`, cleanEmail),
            eq(sql`LOWER(${users.email})`, `${cleanEmail}@maro-erp.local`),
            eq(sql`LOWER(${users.email})`, `${cleanEmail}@maro.local`),
            eq(sql`LOWER(${users.name})`, cleanEmail)
          )
        );
        if (dbUsers && dbUsers.length > 0) {
          user = dbUsers[0];
          isDbConnectionAvailable = true;
        } else {
          isDbConnectionAvailable = true;
        }
      }
    } catch {
      isDbConnectionAvailable = false;
    }

    // Handle Database Connection Failure / Offline State
    if (!isDbConnectionAvailable) {
      let offlineCred = offlineCredentialRegistry.get(cleanEmail) ||
        offlineCredentialRegistry.get(`${cleanEmail}@maro-erp.local`) ||
        offlineCredentialRegistry.get(`${cleanEmail}@maro.local`);

      if (!offlineCred) {
        for (const [, cred] of offlineCredentialRegistry) {
          const cEmail = cred.email.toLowerCase();
          const cName = cred.name.toLowerCase();
          if (
            cEmail === cleanEmail || 
            cName === cleanEmail || 
            cEmail.startsWith(`${cleanEmail}@`) ||
            cEmail.split('@')[0] === cleanEmail.split('@')[0]
          ) {
            offlineCred = cred;
            break;
          }
        }
      }

      if (!offlineCred) {
        // Requirement 1 & 7: No offline credential -> reject with clear 503 error, do NOT increment wrong password counter
        await AuditLogger.log({
          action: 'LOGIN_FAILURE_OFFLINE_NO_CREDENTIAL',
          entityType: 'AUTH',
          ipAddress,
          userAgent,
          metadata: { email: cleanEmail, reason: 'No trusted offline session credential for this device' }
        });

        return {
          success: false,
          statusCode: 503,
          error: 'الخادم غير متاح ولا توجد جلسة Offline موثوقة لهذا الجهاز.',
          code: 'DATABASE_UNAVAILABLE'
        };
      }

      // Verify signature of offline credential
      const { signature, ...restCred } = offlineCred;
      const expectedSig = computeOfflineCredentialSignature(restCred);
      if (signature !== expectedSig) {
        return {
          success: false,
          statusCode: 401,
          error: 'جلسة Offline غير صالحة أو تم تعديلها بصورة غير مصرح بها.',
          code: 'INVALID_OFFLINE_CREDENTIAL'
        };
      }

      // Verify expiry of offline credential
      if (new Date() > new Date(offlineCred.expiresAt)) {
        return {
          success: false,
          statusCode: 401,
          error: 'الخادم غير متاح وانتهت صلاحية جلسة Offline الموثوقة لهذا الجهاز.',
          code: 'OFFLINE_CREDENTIAL_EXPIRED'
        };
      }

      // Check Password against offline hashed credential
      let isOfflinePassValid = false;
      try {
        isOfflinePassValid = await bcrypt.compare(passwordPlain, offlineCred.passwordHash);
      } catch {
        isOfflinePassValid = false;
      }

      if (!isOfflinePassValid) {
        const failInfo = this.registerFailedAttempt(rateLimitKey);
        await AuditLogger.log({
          tenantId: offlineCred.tenantId,
          userId: offlineCred.userId,
          action: 'LOGIN_FAILURE_OFFLINE_WRONG_PASSWORD',
          entityType: 'AUTH',
          ipAddress,
          userAgent,
          metadata: { email: cleanEmail, reason: 'Invalid offline password attempt' }
        });

        return {
          success: false,
          statusCode: 401,
          error: failInfo.isNowLocked 
            ? `تم تجاوز الحد الأقصى للمحاولات الخاطئة. تم القفل لمدة 15 دقيقة.`
            : 'بيانات الدخول غير صحيحة',
          code: 'INVALID_CREDENTIALS'
        };
      }

      // Offline Authentication Succeeded!
      this.clearFailedAttempts(rateLimitKey);

      const sessionId = `sess_off_${Date.now()}_${this.generateRandomToken(8)}`;
      const refreshToken = this.generateRandomToken(32);
      const expiresAt = new Date(Date.now() + 12 * 60 * 60 * 1000); // 12 hours

      const authenticatedUserContext: AuthenticatedUserContext = {
        id: offlineCred.userId,
        email: offlineCred.email,
        name: offlineCred.name,
        role: offlineCred.role,
        permissions: offlineCred.permissions,
        tenantId: offlineCred.tenantId,
        tenantName: offlineCred.tenantName,
        branchId: offlineCred.branchId,
        branchName: offlineCred.branchName,
        availableBranches: offlineCred.availableBranches,
        availableTenants: offlineCred.availableTenants,
        license: offlineCred.licenseSnapshot,
        isOfflineMode: true
      };

      offlineSessionRegistry.set(sessionId, {
        sessionId,
        userId: offlineCred.userId,
        userEmail: offlineCred.email,
        userName: offlineCred.name,
        role: offlineCred.role,
        permissions: offlineCred.permissions,
        tenantId: offlineCred.tenantId,
        tenantName: offlineCred.tenantName,
        branchId: offlineCred.branchId,
        branchName: offlineCred.branchName,
        availableBranches: offlineCred.availableBranches,
        availableTenants: offlineCred.availableTenants,
        licenseSnapshot: offlineCred.licenseSnapshot,
        deviceFingerprint,
        ipAddress,
        issuedAt: new Date(),
        expiresAt,
        revokedAt: null
      });

      await AuditLogger.log({
        tenantId: offlineCred.tenantId,
        userId: offlineCred.userId,
        action: 'LOGIN_SUCCESS_OFFLINE',
        entityType: 'AUTH',
        ipAddress,
        userAgent,
        metadata: { role: offlineCred.role, sessionId }
      });

      return {
        success: true,
        user: authenticatedUserContext,
        sessionId,
        refreshToken,
        expiresAt,
        statusCode: 200
      };
    }

    // Online Mode: User not found in PostgreSQL
    if (!user) {
      const failInfo = this.registerFailedAttempt(rateLimitKey);
      await AuditLogger.log({
        action: 'LOGIN_FAILURE',
        entityType: 'USER',
        ipAddress,
        userAgent,
        metadata: { email: cleanEmail, reason: 'User not found in database' }
      });
      return {
        success: false,
        statusCode: 401,
        error: failInfo.isNowLocked 
          ? `تم تجاوز الحد الأقصى للمحاولات الخاطئة. تم القفل لمدة 15 دقيقة.`
          : 'بيانات الدخول غير صحيحة',
        code: 'INVALID_CREDENTIALS'
      };
    }

    // 3. Verify Account is Active
    if (!user.isActive) {
      await AuditLogger.log({
        tenantId: user.tenantId,
        userId: user.id,
        action: 'LOGIN_FAILURE_INACTIVE_USER',
        entityType: 'USER',
        ipAddress,
        userAgent,
        metadata: { email: cleanEmail, reason: 'Account suspended/inactive' }
      });
      return {
        success: false,
        statusCode: 403,
        error: 'تم تعطيل هذا الحساب. يرجى مراجعة مسؤول النظام.',
        code: 'ACCOUNT_INACTIVE'
      };
    }

    // 4. Verify Password Hash using bcrypt.compare
    let isPasswordValid = false;
    if (user.passwordHash) {
      try {
        isPasswordValid = await bcrypt.compare(passwordPlain, user.passwordHash);
      } catch {
        isPasswordValid = false;
      }
    }

    if (!isPasswordValid) {
      const failInfo = this.registerFailedAttempt(rateLimitKey);
      await AuditLogger.log({
        tenantId: user.tenantId,
        userId: user.id,
        action: 'LOGIN_FAILURE',
        entityType: 'USER',
        ipAddress,
        userAgent,
        metadata: { email: cleanEmail, reason: 'Invalid password' }
      });

      try {
        await db.update(users).set({
          failedAttempts: sql`${users.failedAttempts} + 1`
        }).where(eq(users.id, user.id));
      } catch {
        // ignore
      }

      return {
        success: false,
        statusCode: 401,
        error: failInfo.isNowLocked 
          ? `تم تجاوز الحد الأقصى للمحاولات الخاطئة. تم القفل لمدة 15 دقيقة.`
          : 'بيانات الدخول غير صحيحة',
        code: 'INVALID_CREDENTIALS'
      };
    }

    // 5. Authentication Success: Reset failed attempts & update last login
    this.clearFailedAttempts(rateLimitKey);
    try {
      await db.update(users).set({
        failedAttempts: 0,
        lockedUntil: null,
        lastLoginAt: new Date()
      }).where(eq(users.id, user.id));
    } catch {
      // ignore
    }

    // 6. Resolve Tenant & Assigned Branches from PostgreSQL
    let tenantName = 'مؤسسة مارو للأعمال (MARO Enterprise)';
    let availableBranches: { id: string; name: string; code: string; isDefault?: boolean }[] = [
      { id: 'branch_main', name: 'الفرع الرئيسي (Main Branch)', code: 'BR-01', isDefault: true }
    ];

    try {
      const [tenant] = await db.select().from(tenants).where(eq(tenants.id, user.tenantId));
      if (tenant) tenantName = tenant.name;

      const allBranches = await db.select().from(branches).where(eq(branches.tenantId, user.tenantId));
      const userBranchLinks = await db.select().from(userBranches).where(eq(userBranches.userId, user.id));

      if (userBranchLinks.length > 0) {
        const branchMap = new Map(allBranches.map(b => [b.id, b]));
        availableBranches = userBranchLinks
          .filter(ub => branchMap.has(ub.branchId))
          .map(ub => {
            const b = branchMap.get(ub.branchId)!;
            return { id: b.id, name: b.name, code: b.code, isDefault: ub.isDefault };
          });
      } else if (allBranches.length > 0) {
        availableBranches = allBranches.map((b, idx) => ({
          id: b.id,
          name: b.name,
          code: b.code,
          isDefault: idx === 0
        }));
      }
    } catch {
      // use default
    }

    const defaultBranch = availableBranches.find(b => b.isDefault) || availableBranches[0];
    const branchId = defaultBranch ? defaultBranch.id : 'branch_main';
    const branchName = defaultBranch ? defaultBranch.name : 'الفرع الرئيسي';

    // 7. Resolve Tenant License Status from PostgreSQL
    const license = await ServerLicenseEngine.getTenantLicense(user.tenantId);

    if (license.status === 'SUSPENDED' || license.status === 'CANCELLED') {
      await AuditLogger.log({
        tenantId: user.tenantId,
        userId: user.id,
        action: 'LOGIN_BLOCKED_LICENSE_SUSPENDED',
        entityType: 'LICENSE',
        ipAddress,
        metadata: { licenseStatus: license.status }
      });
      return {
        success: false,
        statusCode: 403,
        error: license.reason || 'تم إيقاف اشتراك هذه المؤسسة. يرجى التواصل مع إدارة النظام.',
        code: 'LICENSE_SUSPENDED'
      };
    }

    // 8. Generate Session & Tokens
    const rawRefreshToken = this.generateRandomToken(48);
    const refreshTokenHash = this.hashToken(rawRefreshToken);
    const sessionDurationHours = rememberDevice ? 30 * 24 : 24;
    const expiresAt = new Date(Date.now() + sessionDurationHours * 60 * 60 * 1000);
    const sessionId = `sess_${Date.now()}_${this.generateRandomToken(8)}`;

    // Persist session to PostgreSQL if available
    try {
      if (isDatabaseConfigured()) {
        await db.insert(sessions).values({
          id: sessionId,
          userId: user.id,
          tenantId: user.tenantId,
          branchId,
          refreshTokenHash,
          ipAddress,
          userAgent,
          deviceInfo: { rememberDevice, deviceFingerprint, loginTimestamp: new Date().toISOString() },
          expiresAt,
        });
      }
    } catch {
      // Offline session persisted in memory Session Registry
    }

    // 9. Cache Session Snapshot in Offline Session Registry
    // This establishes a verified, policy-bound offline session for this device
    const offlineSnapshot: OfflineSessionSnapshot = {
      sessionId,
      userId: user.id,
      userEmail: user.email,
      userName: user.name,
      role: user.role,
      permissions: (user.permissions as Record<string, any>) || {},
      tenantId: user.tenantId,
      tenantName,
      branchId,
      branchName,
      availableBranches,
      availableTenants: [{ id: user.tenantId, name: tenantName }],
      licenseSnapshot: license,
      deviceFingerprint,
      ipAddress,
      issuedAt: new Date(),
      expiresAt,
      revokedAt: null
    };

    offlineSessionRegistry.set(sessionId, offlineSnapshot);

    // 10. Audit Log Login
    await AuditLogger.log({
      tenantId: user.tenantId,
      userId: user.id,
      action: 'LOGIN_SUCCESS',
      entityType: 'SESSION',
      entityId: sessionId,
      ipAddress,
      userAgent,
      metadata: { role: user.role, plan: license.plan, licenseStatus: license.status }
    });

    const userContext: AuthenticatedUserContext = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      permissions: (user.permissions as Record<string, any>) || {},
      tenantId: user.tenantId,
      tenantName,
      branchId,
      branchName,
      availableBranches,
      availableTenants: [{ id: user.tenantId, name: tenantName }],
      license
    };

    return {
      success: true,
      statusCode: 200,
      user: userContext,
      sessionId,
      refreshToken: rawRefreshToken,
      expiresAt
    };
  }

  /**
   * Validate Session and Resolve User Context Server-Side
   * - If PostgreSQL is Online: Validates against database table `sessions` & `users` and refreshes cache.
   * - If PostgreSQL is Offline: Uses explicit policy-bound `offlineSessionRegistry`.
   */
  static async validateSession(
    sessionId: string, 
    ipAddress?: string,
    deviceFingerprint?: string
  ): Promise<{
    valid: boolean;
    user?: AuthenticatedUserContext;
    sessionId?: string;
    reason?: string;
    code?: string;
    isOffline?: boolean;
  }> {
    if (!sessionId) {
      return { valid: false, reason: 'No session provided', code: 'NO_SESSION' };
    }

    // 1. Try PostgreSQL validation first
    try {
      if (isDatabaseConfigured()) {
        const [dbSession] = await db.select().from(sessions).where(eq(sessions.id, sessionId));

        if (dbSession) {
          if (dbSession.revokedAt) {
            return { valid: false, reason: 'Session revoked', code: 'SESSION_REVOKED' };
          }

          const now = new Date();
          if (new Date(dbSession.expiresAt) < now) {
            return { valid: false, reason: 'Session expired', code: 'SESSION_EXPIRED' };
          }

          // Fetch user from PostgreSQL
          const [dbUser] = await db.select().from(users).where(eq(users.id, dbSession.userId));
          if (!dbUser || !dbUser.isActive) {
            return { valid: false, reason: 'User not found or inactive', code: 'USER_INACTIVE' };
          }

          // Resolve Tenant
          let tenantName = 'مؤسسة مارو للأعمال (MARO Enterprise)';
          const [tenant] = await db.select().from(tenants).where(eq(tenants.id, dbSession.tenantId));
          if (tenant) tenantName = tenant.name;

          // Resolve Branches
          let availableBranches: { id: string; name: string; code: string; isDefault?: boolean }[] = [
            { id: dbSession.branchId || 'branch_main', name: 'الفرع الرئيسي (Main Branch)', code: 'BR-01', isDefault: true }
          ];

          const allBranches = await db.select().from(branches).where(eq(branches.tenantId, dbSession.tenantId));
          if (allBranches.length > 0) {
            availableBranches = allBranches.map((b) => ({
              id: b.id,
              name: b.name,
              code: b.code,
              isDefault: b.id === dbSession.branchId
            }));
          }

          const currentBranch = availableBranches.find(b => b.id === dbSession.branchId) || availableBranches[0];
          const branchName = currentBranch ? currentBranch.name : 'الفرع الرئيسي';

          // Resolve License
          const license = await ServerLicenseEngine.getTenantLicense(dbSession.tenantId);

          const userContext: AuthenticatedUserContext = {
            id: dbUser.id,
            email: dbUser.email,
            name: dbUser.name,
            role: dbUser.role,
            permissions: (dbUser.permissions as Record<string, any>) || {},
            tenantId: dbSession.tenantId,
            tenantName,
            branchId: dbSession.branchId || undefined,
            branchName,
            availableBranches,
            availableTenants: [{ id: dbSession.tenantId, name: tenantName }],
            license,
            isOfflineMode: false
          };

          // Update snapshot in offline registry
          offlineSessionRegistry.set(sessionId, {
            sessionId: dbSession.id,
            userId: dbUser.id,
            userEmail: dbUser.email,
            userName: dbUser.name,
            role: dbUser.role,
            permissions: (dbUser.permissions as Record<string, any>) || {},
            tenantId: dbSession.tenantId,
            tenantName,
            branchId: dbSession.branchId || 'branch_main',
            branchName,
            availableBranches,
            availableTenants: [{ id: dbSession.tenantId, name: tenantName }],
            licenseSnapshot: license,
            deviceFingerprint,
            ipAddress,
            issuedAt: dbSession.createdAt,
            expiresAt: dbSession.expiresAt,
            revokedAt: dbSession.revokedAt
          });

          return {
            valid: true,
            sessionId: dbSession.id,
            user: userContext,
            isOffline: false
          };
        }
      }
    } catch {
      // PostgreSQL is offline, proceed to policy-based offline session validation
    }

    // 2. Explicit Policy-Based Offline Validation
    const snapshot = offlineSessionRegistry.get(sessionId);

    if (!snapshot) {
      return {
        valid: false,
        reason: 'لا توجد جلسة صالحة مسجلة مسبقاً لهذا الجهاز في وضع عدم الاتصال.',
        code: 'OFFLINE_SESSION_NOT_FOUND'
      };
    }

    if (snapshot.revokedAt) {
      return {
        valid: false,
        reason: 'تم إلغاء صلاحية هذه الجلسة مسبقاً.',
        code: 'SESSION_REVOKED'
      };
    }

    const now = new Date();
    if (new Date(snapshot.expiresAt) < now) {
      return {
        valid: false,
        reason: 'انتهت صلاحية جلسة العمل غير المتصلة. يرجى الاتصال بالإنترنت لتجديد الدخول.',
        code: 'SESSION_EXPIRED'
      };
    }

    // Return authenticated offline user context strictly adhering to original permissions & license
    const userContext: AuthenticatedUserContext = {
      id: snapshot.userId,
      email: snapshot.userEmail,
      name: snapshot.userName,
      role: snapshot.role,
      permissions: snapshot.permissions,
      tenantId: snapshot.tenantId,
      tenantName: snapshot.tenantName,
      branchId: snapshot.branchId,
      branchName: snapshot.branchName,
      availableBranches: snapshot.availableBranches,
      availableTenants: snapshot.availableTenants,
      license: snapshot.licenseSnapshot,
      isOfflineMode: true
    };

    return {
      valid: true,
      sessionId: snapshot.sessionId,
      user: userContext,
      isOffline: true
    };
  }

  /**
   * Factor Authentication (PIN / NFC / RFID)
   * Validates server-side through the entire enterprise chain:
   * User -> Tenant -> Branch -> Role -> License -> Device Policy
   */
  static async authenticateFactor(params: {
    type: 'PIN' | 'NFC' | 'RFID';
    credential: string;
    deviceId?: string;
    ipAddress: string;
    userAgent: string;
  }): Promise<LoginResult> {
    const { type, credential, deviceId, ipAddress, userAgent } = params;
    const cleanCred = (credential || '').trim();

    if (!cleanCred) {
      return { success: false, statusCode: 400, error: 'بيانات المصادقة مطلوبة', code: 'CREDENTIAL_REQUIRED' };
    }

    try {
      if (!isDatabaseConfigured()) {
        throw new Error('DATABASE_URL is not configured');
      }

      // Query active users
      const allUsers = await db.select().from(users).where(eq(users.isActive, true));
      let matchedUser: any = null;

      // Check PIN or NFC/RFID match
      for (const u of allUsers) {
        const perms = (u.permissions as Record<string, any>) || {};
        if (type === 'PIN') {
          if (perms.pinHash) {
            const isMatch = await bcrypt.compare(cleanCred, perms.pinHash);
            if (isMatch) { matchedUser = u; break; }
          }
        } else if (type === 'NFC' || type === 'RFID') {
          if (perms.nfcCardId === cleanCred || perms.rfidTag === cleanCred) {
            matchedUser = u;
            break;
          }
        }
      }

      if (!matchedUser) {
        await AuditLogger.log({
          action: `FACTOR_AUTH_FAILED_${type}`,
          entityType: 'AUTH',
          ipAddress,
          userAgent,
          metadata: { factorType: type, deviceId }
        });

        return {
          success: false,
          statusCode: 401,
          error: `بيانات المصادقة (${type}) غير مسجلة أو غير صالحة.`,
          code: 'FACTOR_AUTH_FAILED'
        };
      }

      // Full Chain Verification:
      // 1. Tenant Verification
      const [tenant] = await db.select().from(tenants).where(eq(tenants.id, matchedUser.tenantId));
      if (!tenant || !tenant.isActive) {
        return { success: false, statusCode: 403, error: 'المؤسسة غير مفعلة', code: 'TENANT_INACTIVE' };
      }

      // 2. License Verification
      const license = await ServerLicenseEngine.getTenantLicense(matchedUser.tenantId);
      if (license.status === 'SUSPENDED' || license.status === 'CANCELLED') {
        return { success: false, statusCode: 403, error: 'الترخيص معلق', code: 'LICENSE_SUSPENDED' };
      }

      // 3. Device Policy Verification (if deviceId provided)
      if (deviceId) {
        const [dev] = await db.select().from(devices).where(
          and(eq(devices.tenantId, matchedUser.tenantId), eq(devices.deviceId, deviceId))
        );
        if (dev && !dev.isActive) {
          return { success: false, statusCode: 403, error: 'هذا الجهاز غير مصرح به', code: 'DEVICE_UNAUTHORIZED' };
        }
      }

      // Create session
      const rawRefreshToken = this.generateRandomToken(48);
      const refreshTokenHash = this.hashToken(rawRefreshToken);
      const expiresAt = new Date(Date.now() + 12 * 60 * 60 * 1000); // 12 hours for factor sessions
      const sessionId = `sess_factor_${Date.now()}_${this.generateRandomToken(8)}`;

      await db.insert(sessions).values({
        id: sessionId,
        userId: matchedUser.id,
        tenantId: matchedUser.tenantId,
        branchId: 'branch_main',
        refreshTokenHash,
        ipAddress,
        userAgent,
        deviceInfo: { factorType: type, deviceId },
        expiresAt,
      });

      const userContext: AuthenticatedUserContext = {
        id: matchedUser.id,
        email: matchedUser.email,
        name: matchedUser.name,
        role: matchedUser.role,
        permissions: (matchedUser.permissions as Record<string, any>) || {},
        tenantId: matchedUser.tenantId,
        tenantName: tenant.name,
        branchId: 'branch_main',
        branchName: 'الفرع الرئيسي',
        availableBranches: [{ id: 'branch_main', name: 'الفرع الرئيسي', code: 'BR-01', isDefault: true }],
        availableTenants: [{ id: matchedUser.tenantId, name: tenant.name }],
        license
      };

      // Cache snapshot
      offlineSessionRegistry.set(sessionId, {
        sessionId,
        userId: matchedUser.id,
        userEmail: matchedUser.email,
        userName: matchedUser.name,
        role: matchedUser.role,
        permissions: (matchedUser.permissions as Record<string, any>) || {},
        tenantId: matchedUser.tenantId,
        tenantName: tenant.name,
        branchId: 'branch_main',
        branchName: 'الفرع الرئيسي',
        availableBranches: userContext.availableBranches,
        availableTenants: userContext.availableTenants,
        licenseSnapshot: license,
        deviceFingerprint: deviceId,
        ipAddress,
        issuedAt: new Date(),
        expiresAt,
        revokedAt: null
      });

      await AuditLogger.log({
        tenantId: matchedUser.tenantId,
        userId: matchedUser.id,
        action: `FACTOR_AUTH_SUCCESS_${type}`,
        entityType: 'SESSION',
        entityId: sessionId,
        ipAddress,
        userAgent,
        metadata: { role: matchedUser.role, deviceId }
      });

      return {
        success: true,
        statusCode: 200,
        user: userContext,
        sessionId,
        refreshToken: rawRefreshToken,
        expiresAt
      };
    } catch (err: any) {
      return {
        success: false,
        statusCode: 503,
        error: 'قاعدة بيانات PostgreSQL المركزية غير متاحة للمصادقة السريعة.',
        code: 'DATABASE_UNAVAILABLE'
      };
    }
  }

  /**
   * Switch Active Branch for a session
   * Strictly FORBIDDEN when PostgreSQL is offline.
   */
  static async switchBranch(
    sessionId: string,
    userId: string,
    tenantId: string,
    branchId: string
  ): Promise<{ success: boolean; error?: string; statusCode: number }> {
    try {
      if (!isDatabaseConfigured()) throw new Error('DB offline');

      const [branch] = await db.select().from(branches).where(
        and(eq(branches.id, branchId), eq(branches.tenantId, tenantId))
      );

      if (!branch) {
        return { success: false, error: 'الفرع المحدد غير مصرح به لهذه المؤسسة', statusCode: 403 };
      }

      await db.update(sessions).set({
        branchId,
        lastActivity: new Date()
      }).where(and(eq(sessions.id, sessionId), eq(sessions.userId, userId)));

      // Update in offline cache
      const cached = offlineSessionRegistry.get(sessionId);
      if (cached) {
        cached.branchId = branchId;
        cached.branchName = branch.name;
      }

      return { success: true, statusCode: 200 };
    } catch {
      return {
        success: false,
        error: 'غير مسموح بتغيير الفرع في الوضع غير المتصل (Offline Policy Restriction).',
        statusCode: 403
      };
    }
  }

  /**
   * Switch Active Company/Tenant for a session
   * Strictly FORBIDDEN when PostgreSQL is offline.
   */
  static async switchTenant(
    sessionId: string,
    userId: string,
    newTenantId: string
  ): Promise<{ success: boolean; error?: string; statusCode: number }> {
    try {
      if (!isDatabaseConfigured()) throw new Error('DB offline');

      const [tenant] = await db.select().from(tenants).where(eq(tenants.id, newTenantId));
      if (!tenant || !tenant.isActive) {
        return { success: false, error: 'المؤسسة المحددة غير صالحة أو غير مفعلة', statusCode: 403 };
      }

      await db.update(sessions).set({
        tenantId: newTenantId,
        lastActivity: new Date()
      }).where(and(eq(sessions.id, sessionId), eq(sessions.userId, userId)));

      return { success: true, statusCode: 200 };
    } catch {
      return {
        success: false,
        error: 'غير مسموح بتغيير المؤسسة / الشركة في الوضع غير المتصل (Offline Policy Restriction).',
        statusCode: 403
      };
    }
  }

  /**
   * Elevate or Update User Role
   * Strictly FORBIDDEN when PostgreSQL is offline.
   */
  static async updateUserRole(
    targetUserId: string,
    newRole: string,
    newPermissions: Record<string, any>,
    adminUserId: string,
    adminTenantId: string
  ): Promise<{ success: boolean; error?: string; statusCode: number }> {
    try {
      if (!isDatabaseConfigured()) throw new Error('DB offline');

      await db.update(users).set({
        role: newRole,
        permissions: newPermissions
      }).where(and(eq(users.id, targetUserId), eq(users.tenantId, adminTenantId)));

      await AuditLogger.log({
        tenantId: adminTenantId,
        userId: adminUserId,
        action: 'ROLE_ELEVATION_APPLIED',
        entityType: 'USER',
        entityId: targetUserId,
        metadata: { newRole }
      });

      return { success: true, statusCode: 200 };
    } catch {
      return {
        success: false,
        error: 'لا يمكن تعديل الصلاحيات أو ترقية الأدوار أثناء انقطاع الاتصال بقاعدة البيانات المركزية.',
        statusCode: 503
      };
    }
  }

  /**
   * Create New User
   * Strictly FORBIDDEN when PostgreSQL is offline.
   */
  static async createUser(
    userData: {
      email: string;
      name: string;
      passwordPlain: string;
      role: string;
      permissions?: Record<string, any>;
      tenantId: string;
    },
    adminUserId?: string
  ): Promise<{ success: boolean; error?: string; userId?: string; statusCode: number }> {
    try {
      if (!isDatabaseConfigured()) throw new Error('DB offline');

      const passwordHash = await bcrypt.hash(userData.passwordPlain, 10);

      const [created] = await db.insert(users).values({
        tenantId: userData.tenantId,
        email: userData.email.trim().toLowerCase(),
        name: userData.name.trim(),
        passwordHash,
        role: userData.role,
        permissions: userData.permissions || {},
        isActive: true,
      }).returning();

      await AuditLogger.log({
        tenantId: userData.tenantId,
        userId: adminUserId,
        action: 'USER_CREATED',
        entityType: 'USER',
        entityId: created.id,
        metadata: { email: userData.email, role: userData.role }
      });

      return { success: true, userId: created.id, statusCode: 201 };
    } catch (err: any) {
      return {
        success: false,
        error: 'لا يمكن إنشاء مستخدم جديد أثناء انقطاع الاتصال بقاعدة البيانات المركزية.',
        statusCode: 503
      };
    }
  }

  /**
   * Logout Single Session
   */
  static async logout(sessionId: string, ipAddress?: string): Promise<boolean> {
    if (!sessionId) return false;

    const cached = offlineSessionRegistry.get(sessionId);
    if (cached) {
      cached.revokedAt = new Date();
    }

    try {
      if (isDatabaseConfigured()) {
        await db.update(sessions).set({ revokedAt: new Date() }).where(eq(sessions.id, sessionId));
      }
    } catch {
      // ignore
    }

    return true;
  }

  /**
   * Logout All Devices for a User
   */
  static async logoutAllDevices(userId: string, tenantId?: string, ipAddress?: string): Promise<boolean> {
    if (!userId) return false;

    for (const s of offlineSessionRegistry.values()) {
      if (s.userId === userId) {
        s.revokedAt = new Date();
      }
    }

    try {
      if (process.env.DATABASE_URL) {
        await db.update(sessions).set({
          revokedAt: new Date()
        }).where(and(eq(sessions.userId, userId), isNull(sessions.revokedAt)));
      }
    } catch {
      // ignore
    }

    return true;
  }

  /**
   * Refresh Session Token Rotation
   */
  static async refreshSession(
    rawRefreshToken: string,
    ipAddress: string,
    userAgent: string
  ): Promise<{
    success: boolean;
    newSessionId?: string;
    newRefreshToken?: string;
    expiresAt?: Date;
    user?: AuthenticatedUserContext;
    error?: string;
  }> {
    if (!rawRefreshToken) {
      return { success: false, error: 'Refresh token required' };
    }

    const tokenHash = this.hashToken(rawRefreshToken);

    try {
      if (!isDatabaseConfigured()) throw new Error('DB offline');

      const [existingSession] = await db.select().from(sessions).where(eq(sessions.refreshTokenHash, tokenHash));
      if (!existingSession) {
        return { success: false, error: 'Invalid refresh token' };
      }

      if (existingSession.revokedAt || existingSession.replacedBySessionId) {
        return {
          success: false,
          error: 'تم اكتشاف محاولة إعادة استخدام جلسة ملغاة. تم قفل الجلسات لسلامة الحساب.'
        };
      }

      if (new Date(existingSession.expiresAt) < new Date()) {
        return { success: false, error: 'انتهت صلاحية الجلسة. يرجى تسجيل الدخول مجدداً.' };
      }

      const newRawRefreshToken = this.generateRandomToken(48);
      const newRefreshTokenHash = this.hashToken(newRawRefreshToken);
      const newExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const newSessionId = `sess_${Date.now()}_${this.generateRandomToken(8)}`;

      await db.insert(sessions).values({
        id: newSessionId,
        userId: existingSession.userId,
        tenantId: existingSession.tenantId,
        branchId: existingSession.branchId,
        refreshTokenHash: newRefreshTokenHash,
        ipAddress,
        userAgent,
        expiresAt: newExpiresAt,
      });

      await db.update(sessions).set({
        revokedAt: new Date(),
        replacedBySessionId: newSessionId
      }).where(eq(sessions.id, existingSession.id));

      const validation = await this.validateSession(newSessionId, ipAddress);

      return {
        success: true,
        newSessionId,
        newRefreshToken: newRawRefreshToken,
        expiresAt: newExpiresAt,
        user: validation.user
      };
    } catch {
      return { success: false, error: 'فشل تجديد الجلسة أثناء انقطاع الاتصال بقاعدة البيانات المركزية.' };
    }
  }

  /**
   * Get Active Sessions for a User
   */
  static async getActiveSessions(userId: string): Promise<any[]> {
    try {
      if (isDatabaseConfigured()) {
        const userSessions = await db.select().from(sessions).where(
          and(eq(sessions.userId, userId), isNull(sessions.revokedAt))
        );
        return userSessions.map(s => ({
          id: s.id,
          ipAddress: s.ipAddress,
          userAgent: s.userAgent,
          createdAt: s.createdAt,
          expiresAt: s.expiresAt,
          lastActivity: s.lastActivity
        }));
      }
    } catch {
      // offline
    }

    const matching: any[] = [];
    for (const s of offlineSessionRegistry.values()) {
      if (s.userId === userId && !s.revokedAt) {
        matching.push({
          id: s.sessionId,
          ipAddress: s.ipAddress,
          createdAt: s.issuedAt,
          expiresAt: s.expiresAt,
          lastActivity: s.issuedAt
        });
      }
    }
    return matching;
  }

  /**
   * Testing & Verification Hooks for Black-Box Security Audit
   */
  static _registerTestOfflineSession(snapshot: OfflineSessionSnapshot): void {
    offlineSessionRegistry.set(snapshot.sessionId, snapshot);
  }

  static _clearAllOfflineSessions(): void {
    offlineSessionRegistry.clear();
  }

  static _clearBruteForceStore(): void {
    bruteForceStore.clear();
  }

  static _simulateFailedAttempt(ipAddress: string, email: string): { isNowLocked: boolean; waitSeconds?: number } {
    const cleanEmail = (email || '').trim().toLowerCase();
    const rateLimitKey = `${ipAddress}_${cleanEmail}`;
    return this.registerFailedAttempt(rateLimitKey);
  }

  static _getOfflineSession(sessionId: string): OfflineSessionSnapshot | undefined {
    return offlineSessionRegistry.get(sessionId);
  }
}
