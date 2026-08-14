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
      const saved = localStorage.getItem('maro_erp_session');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      // ignore
    }
    // Default logged in as Developer/Admin for smooth enterprise experience
    return {
      uid: 'dev_user_001',
      email: 'alkootsh@gmail.com',
      displayName: 'المدير المطور (Developer)',
      role: 'developer',
      branchId: 'branch_main',
      branchName: 'الفرع الرئيسي',
      warehouseName: 'المستودع العام',
      safeName: 'الخزينة الرئيسية',
      companyId: 'comp_maro_01'
    };
  });
  const [loading, setLoading] = useState(false);

  const login = (
    email: string, 
    role: 'developer' | 'admin' | 'accountant' | 'cashier' = 'admin',
    customProfile?: Partial<UserProfile>
  ) => {
    const profile: UserProfile = {
      uid: customProfile?.uid || `user_${Date.now()}`,
      email,
      displayName: customProfile?.displayName || (email === 'alkootsh@gmail.com' ? 'المدير المطور' : 'مستخدم النظام'),
      role,
      branchId: 'branch_main',
      branchName: customProfile?.branchName || 'الفرع الرئيسي',
      warehouseName: customProfile?.warehouseName || 'المستودع العام',
      safeName: customProfile?.safeName || 'الخزينة الرئيسية',
      companyId: 'comp_maro_01'
    };
    setUser(profile);
    localStorage.setItem('maro_erp_session', JSON.stringify(profile));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('maro_erp_session');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
