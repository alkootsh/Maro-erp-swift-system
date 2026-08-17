/**
 * @file securityMiddleware.ts
 * @module Server Security Middlewares
 * @description Enterprise Express Middlewares for Authentication, Tenant Isolation, RBAC & License Enforcement
 */
import { Request, Response, NextFunction } from 'express';
import { ServerAuthEngine, AuthenticatedUserContext } from './authEngine';
import { ServerLicenseEngine, LicenseValidationResult } from './licenseEngine';
import { AuditLogger } from './auditLogger';

// Extend Express Request interface with security context
declare global {
  namespace Express {
    interface Request {
      userContext?: AuthenticatedUserContext;
      tenantId?: string;
      branchId?: string;
      userId?: string;
      userRole?: string;
      license?: LicenseValidationResult;
      sessionId?: string;
    }
  }
}

/**
 * Middleware 1: Require Valid Authentication & Session (Online or Valid Offline Policy)
 */
export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const bearerHeader = req.headers['authorization'];
    let sessionId = req.cookies?.session_id || req.cookies?.access_token || req.cookies?.sessionId || (req.headers['x-session-id'] as string);

    if (!sessionId && bearerHeader && bearerHeader.startsWith('Bearer ')) {
      sessionId = bearerHeader.split(' ')[1].trim();
    }

    if (!sessionId) {
      return res.status(401).json({
        error: 'غير مصرح - يرجى تسجيل الدخول أولاً',
        code: 'UNAUTHORIZED'
      });
    }

    const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
    const deviceFingerprint = req.headers['x-device-fingerprint'] as string | undefined;

    const validation = await ServerAuthEngine.validateSession(sessionId, clientIp, deviceFingerprint);

    if (!validation.valid || !validation.user) {
      res.clearCookie('session_id');
      res.clearCookie('access_token');
      return res.status(401).json({
        error: validation.reason || 'انتهت صلاحية الجلسة أو تم إلغاؤها. يرجى تسجيل الدخول مجدداً.',
        code: validation.code || 'SESSION_EXPIRED',
        reason: validation.reason
      });
    }

    // Attach verified server-side security context to Request
    req.sessionId = validation.sessionId;
    req.userContext = validation.user;
    req.tenantId = validation.user.tenantId;
    req.branchId = validation.user.branchId;
    req.userId = validation.user.id;
    req.userRole = validation.user.role;
    req.license = validation.user.license;

    // Tenant Isolation Check: If frontend provided an explicit x-tenant-id header, verify it matches
    const clientHeaderTenant = req.headers['x-tenant-id'] as string;
    if (clientHeaderTenant && clientHeaderTenant.trim() !== req.tenantId) {
      await AuditLogger.log({
        tenantId: req.tenantId,
        userId: req.userId,
        action: 'TENANT_VIOLATION_ATTEMPT',
        entityType: 'SECURITY',
        ipAddress: clientIp,
        userAgent: req.headers['user-agent'],
        metadata: {
          attemptedTenantId: clientHeaderTenant,
          actualTenantId: req.tenantId,
          url: req.originalUrl,
          method: req.method
        }
      });

      return res.status(403).json({
        error: 'محاولة وصول غير مصرح بها لبيانات شركة أخرى (Tenant Isolation Violation).',
        code: 'FORBIDDEN_TENANT_ACCESS'
      });
    }

    next();
  } catch (err: any) {
    console.error('[AUTH MIDDLEWARE ERROR]', err);
    return res.status(500).json({ error: 'خطأ في التحقق الأمني من الجلسة' });
  }
}

/**
 * Middleware 2: Enforce Module Entitlement & License Write Control
 */
export function requireModule(moduleCode: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tenantId = req.tenantId;
      if (!tenantId) {
        return res.status(401).json({ error: 'غير مصرح' });
      }

      const isMutatingMethod = ['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method.toUpperCase());
      const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';

      // 1. Check Module Entitlement in License
      const entitlement = await ServerLicenseEngine.checkModuleEntitlement(tenantId, moduleCode);
      if (!entitlement.allowed) {
        await AuditLogger.log({
          tenantId,
          userId: req.userId,
          action: 'MODULE_ENTITLEMENT_DENIED',
          entityType: 'MODULE',
          entityId: moduleCode,
          ipAddress: clientIp,
          userAgent: req.headers['user-agent'],
          metadata: { module: moduleCode, plan: entitlement.license.plan }
        });

        return res.status(403).json({
          error: entitlement.reason || `موديول (${moduleCode}) غير متاح في باقة الاشتراك الحالية.`,
          code: 'MODULE_NOT_ENTITLED',
          module: moduleCode,
          plan: entitlement.license.plan
        });
      }

      // 2. Check Operational Write Restrictions (e.g. when license is EXPIRED or SUSPENDED)
      if (isMutatingMethod && !entitlement.license.allowOperationalWrite) {
        await AuditLogger.log({
          tenantId,
          userId: req.userId,
          action: 'LICENSE_WRITE_BLOCKED',
          entityType: 'LICENSE',
          entityId: entitlement.license.licenseId,
          ipAddress: clientIp,
          userAgent: req.headers['user-agent'],
          metadata: { status: entitlement.license.status, method: req.method, url: req.originalUrl }
        });

        return res.status(402).json({
          error: entitlement.license.reason || 'انتهت صلاحية الترخيص - تم إيقاف إنشاء وتعديل المعاملات حتى يتم التجديد. يمكنك تصفح البيانات والتقارير.',
          code: 'LICENSE_EXPIRED_READ_ONLY',
          status: entitlement.license.status,
          plan: entitlement.license.plan,
          expiryDate: entitlement.license.expiryDate
        });
      }

      next();
    } catch (err: any) {
      console.error('[MODULE ENTITLEMENT ERROR]', err);
      return res.status(500).json({ error: 'خطأ في التحقق من تراخيص الموديول' });
    }
  };
}

/**
 * Middleware 3: Require Specific Role (RBAC)
 */
export function requireRole(...allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const userRole = (req.userRole || '').toLowerCase();
    const normalizedAllowed = allowedRoles.map(r => r.toLowerCase());

    if (userRole === 'admin' || userRole === 'developer' || normalizedAllowed.includes(userRole)) {
      return next();
    }

    return res.status(403).json({
      error: 'ليس لديك صلاحية لتنفيذ هذا الإجراء.',
      code: 'INSUFFICIENT_PERMISSIONS',
      requiredRoles: allowedRoles,
      userRole
    });
  };
}
