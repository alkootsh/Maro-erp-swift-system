import React, { createContext, useContext, useEffect, useState } from 'react';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: 'developer' | 'admin' | 'accountant' | 'cashier';
  branchId?: string;
  branchName?: string;
  warehouseName?: string;
  safeName?: string;
  companyId?: string;
  tenantId?: string;
  token?: string;
}

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  login: (email: string, role?: 'developer' | 'admin' | 'accountant' | 'cashier', customProfile?: Partial<UserProfile>) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: false,
  login: () => {},
  logout: () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(() => {
    try {
      if (typeof window !== 'undefined') {
        const saved = sessionStorage.getItem('maro_erp_session') || localStorage.getItem('maro_erp_session');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed && parsed.uid && parsed.email) {
            return parsed;
          }
        }
      }
    } catch (e) {
      // ignore
    }
    // No automatic default developer/admin auto-login bypass. When no session exists, user must be null to require authentication.
    return null;
  });
  const [loading, setLoading] = useState(false);

  // Sync state changes across memory/storage
  const login = (
    email: string, 
    role: 'developer' | 'admin' | 'accountant' | 'cashier' = 'admin',
    customProfile?: Partial<UserProfile>
  ) => {
    const profile: UserProfile = {
      uid: customProfile?.uid || `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      email,
      displayName: customProfile?.displayName || (role === 'developer' ? 'المدير المطور' : 'مستخدم النظام'),
      role,
      branchId: customProfile?.branchId || 'branch_main',
      branchName: customProfile?.branchName || 'الفرع الرئيسي',
      warehouseName: customProfile?.warehouseName || 'المستودع العام',
      safeName: customProfile?.safeName || 'الخزينة الرئيسية',
      companyId: customProfile?.companyId || 'comp_maro_01',
      tenantId: customProfile?.tenantId || 'tenant_main_01',
      token: customProfile?.token || `maro_sec_jwt_${Date.now()}`
    };
    setUser(profile);
    try {
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('maro_erp_session', JSON.stringify(profile));
        localStorage.setItem('maro_erp_session', JSON.stringify(profile));
      }
    } catch (_) {}
  };

  const logout = () => {
    setUser(null);
    try {
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('maro_erp_session');
        localStorage.removeItem('maro_erp_session');
      }
    } catch (_) {}
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

