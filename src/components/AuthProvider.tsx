/**
 * @file AuthProvider.tsx
 * @module المكونات القابلة لإعادة الاستخدام (Reusable Components)
 * @description نظام إدارة المصادقة والترخيص والجلسات في MARO ERP (PostgreSQL Multi-Tenant Core).
 */
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

export interface UserBranch {
  id: string;
  name: string;
  code: string;
}

export interface UserTenant {
  id: string;
  name: string;
}

export interface LicenseInfo {
  plan: 'FREE' | 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE' | 'UNLIMITED';
  status: 'ACTIVE' | 'TRIAL' | 'GRACE_PERIOD' | 'EXPIRED' | 'SUSPENDED' | 'REVOKED';
  enabledModules: string[];
  allowOperationalWrite: boolean;
  expiresAt?: string;
  daysRemaining?: number;
  maxUsers?: number;
  maxBranches?: number;
  maxWarehouses?: number;
  maxPosDevices?: number;
}

export interface UserProfile {
  id: string;
  uid?: string; // alias for id
  email: string;
  name: string;
  displayName: string; // alias for name
  role: 'developer' | 'admin' | 'accountant' | 'cashier' | string;
  tenantId: string;
  tenantName: string;
  branchId?: string;
  branchName?: string;
  warehouseName?: string;
  safeName?: string;
  companyId?: string; // alias for tenantId
  availableBranches?: UserBranch[];
  availableTenants?: UserTenant[];
  license?: LicenseInfo;
}

export interface UserSession {
  id: string;
  ipAddress?: string;
  userAgent?: string;
  deviceFingerprint?: string;
  lastActiveAt: string;
  expiresAt: string;
  isCurrent?: boolean;
}

interface AuthContextType {
  user: UserProfile | null;
  license: LicenseInfo | null;
  serverLicense: any | null;
  loading: boolean;
  activeSessions: UserSession[];
  login: (email: string, password: string, rememberDevice?: boolean) => Promise<any>;
  logout: () => Promise<void>;
  logoutAll: () => Promise<void>;
  switchBranch: (branchId: string) => Promise<void>;
  switchTenant: (tenantId: string) => Promise<void>;
  refreshAuth: () => Promise<void>;
  checkServerLicense: () => Promise<void>;
  fetchSessions: () => Promise<UserSession[]>;
  revokeSession: (sessionId: string) => Promise<void>;
  hasModule: (moduleName: string) => boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  license: null,
  serverLicense: null,
  loading: true,
  activeSessions: [],
  login: async () => {},
  logout: async () => {},
  logoutAll: async () => {},
  switchBranch: async () => {},
  switchTenant: async () => {},
  refreshAuth: async () => {},
  checkServerLicense: async () => {},
  fetchSessions: async () => [],
  revokeSession: async () => {},
  hasModule: () => false,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [license, setLicense] = useState<LicenseInfo | null>(null);
  const [serverLicense, setServerLicense] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeSessions, setActiveSessions] = useState<UserSession[]>([]);

  const formatUserProfile = (rawUser: any, rawLicense?: any): UserProfile => {
    return {
      id: rawUser.id || rawUser.uid,
      uid: rawUser.id || rawUser.uid,
      email: rawUser.email,
      name: rawUser.name || rawUser.displayName || rawUser.email.split('@')[0],
      displayName: rawUser.name || rawUser.displayName || rawUser.email.split('@')[0],
      role: rawUser.role || 'cashier',
      tenantId: rawUser.tenantId || rawUser.companyId || 'default-tenant',
      tenantName: rawUser.tenantName || 'المؤسسة الرئيسية',
      branchId: rawUser.branchId,
      branchName: rawUser.branchName || 'الفرع الرئيسي',
      warehouseName: rawUser.warehouseName || 'المستودع العام',
      safeName: rawUser.safeName || 'الخزينة الرئيسية',
      companyId: rawUser.tenantId || rawUser.companyId,
      availableBranches: rawUser.availableBranches || [],
      availableTenants: rawUser.availableTenants || [],
      license: rawLicense || rawUser.license
    };
  };

  const safeParseJsonResponse = async (response: Response) => {
    try {
      const text = await response.text();
      if (!text || !text.trim()) return null;
      return JSON.parse(text);
    } catch {
      return null;
    }
  };

  const checkServerLicense = useCallback(async () => {
    try {
      const response = await fetch('/api/licensing/public-status');
      if (response.ok) {
        const data = await response.json();
        setServerLicense(data);
      }
    } catch (e) {
      console.warn("Failed to check server license:", e);
    }
  }, []);

  const refreshAuth = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/me', {
        headers: { 'Cache-Control': 'no-cache' }
      });
      if (response.ok) {
        const data = await safeParseJsonResponse(response);
        if (data && (data.success || data.authenticated) && data.user) {
          const profile = formatUserProfile(data.user, data.license);
          setUser(profile);
          if (data.license) {
            setLicense(data.license);
          }
        } else {
          setUser(null);
          setLicense(null);
        }
      } else {
        setUser(null);
        setLicense(null);
      }
    } catch (e) {
      console.warn("Auth check error:", e);
      setUser(null);
    } finally {
      // Don't stop loading until both endpoints have been queried
    }
  }, []);

  useEffect(() => {
    const initAuth = async () => {
      setLoading(true);
      await Promise.all([refreshAuth(), checkServerLicense()]);
      setLoading(false);
    };
    initAuth();
  }, [refreshAuth, checkServerLicense]);

  const login = async (
    email: string, 
    password: string,
    rememberDevice: boolean = true
  ) => {
    setLoading(true);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, rememberDevice })
      });

      const data = await safeParseJsonResponse(response);

      if (!response.ok) {
        const errorMsg = data?.error || `تعذر تسجيل الدخول (استجابة الخادم: ${response.status})`;
        throw new Error(errorMsg);
      }

      if (!data) {
        throw new Error('فشل تسجيل الدخول: تم استلام استجابة غير صالحة من الخادم');
      }

      if (data.error) {
        throw new Error(data.error);
      }

      if (data.user) {
        const profile = formatUserProfile(data.user, data.license);
        setUser(profile);
        if (data.license) {
          setLicense(data.license);
        }
        return data;
      }

      throw new Error(data.error || 'بيانات المستخدم مفقودة في استجابة خادم تسجيل الدخول');
    } catch (e) {
      console.error("Login failed:", e);
      throw e;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (e) {
      console.warn("Logout error:", e);
    } finally {
      setUser(null);
      setLicense(null);
      setActiveSessions([]);
    }
  };

  const logoutAll = async () => {
    try {
      await fetch('/api/auth/logout-all', { method: 'POST' });
    } catch (e) {
      console.warn("Logout all error:", e);
    } finally {
      setUser(null);
      setLicense(null);
      setActiveSessions([]);
    }
  };

  const switchBranch = async (branchId: string) => {
    try {
      const res = await fetch('/api/auth/switch-branch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ branchId })
      });
      if (!res.ok) {
        const err = await safeParseJsonResponse(res);
        throw new Error(err?.error || 'تعذر تغيير الفرع');
      }
      await refreshAuth();
    } catch (e) {
      console.error("Switch branch error:", e);
      throw e;
    }
  };

  const switchTenant = async (tenantId: string) => {
    try {
      const res = await fetch('/api/auth/switch-tenant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantId })
      });
      if (!res.ok) {
        const err = await safeParseJsonResponse(res);
        throw new Error(err?.error || 'تعذر تغيير المؤسسة');
      }
      await refreshAuth();
    } catch (e) {
      console.error("Switch tenant error:", e);
      throw e;
    }
  };

  const fetchSessions = async (): Promise<UserSession[]> => {
    try {
      const res = await fetch('/api/auth/sessions');
      if (res.ok) {
        const data = await safeParseJsonResponse(res);
        setActiveSessions(data?.sessions || []);
        return data?.sessions || [];
      }
      return [];
    } catch (e) {
      console.warn("Fetch sessions error:", e);
      return [];
    }
  };

  const revokeSession = async (sessionId: string) => {
    try {
      const res = await fetch(`/api/auth/sessions/${sessionId}`, { method: 'DELETE' });
      if (res.ok) {
        setActiveSessions(prev => prev.filter(s => s.id !== sessionId));
      }
    } catch (e) {
      console.error("Revoke session error:", e);
    }
  };

  const hasModule = (moduleName: string): boolean => {
    if (!license) return true; // fallback
    if (!license.enabledModules || license.enabledModules.length === 0) return true;
    return license.enabledModules.includes('*') || license.enabledModules.includes(moduleName.toUpperCase());
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      license,
      serverLicense,
      loading, 
      activeSessions,
      login, 
      logout,
      logoutAll,
      switchBranch,
      switchTenant,
      refreshAuth,
      checkServerLicense,
      fetchSessions,
      revokeSession,
      hasModule
    }}>
      {children}
    </AuthContext.Provider>
  );
};

