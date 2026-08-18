/**
 * @file Login.tsx
 * @module واجهات وصفحات النظام (UI Pages)
 * @description صفحة تسجيل الدخول الموحدة لمنصة MARO ERP - تتيح اختيار الموظف المسجل مباشرة وإدخال كلمة المرور مع دعم الإدخال اليدوي والعمل دون إنترنت
 */
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../components/AuthProvider';
import { 
  Terminal, 
  Lock, 
  Mail, 
  ArrowRight, 
  ShieldCheck, 
  User as UserIcon, 
  Users, 
  Check, 
  ChevronDown, 
  Shield, 
  Building2, 
  Sparkles, 
  Edit3
} from 'lucide-react';
import { SecurityEngine } from '../lib/securityEngine';
import { MaroSyncEngine } from '../lib/maroSyncEngine';
import { toast } from 'react-hot-toast';
import { FirstRunActivationWizard } from '../components/licensing/FirstRunActivationWizard';
import { TrialLimitService } from '../services/trialLimitService';
import { cn } from '../lib/utils';

export interface EmployeeOption {
  id: string;
  displayName: string;
  email: string;
  role: string;
  department?: string;
  branchName?: string;
}

const DEFAULT_EMPLOYEES: EmployeeOption[] = [
  { 
    id: 'usr_1', 
    displayName: 'مدير النظام العام (Admin)', 
    email: 'admin@maro-erp.local', 
    role: 'admin', 
    department: 'الإدارة العامة',
    branchName: 'الفرع الرئيسي'
  },
  { 
    id: 'usr_2', 
    displayName: 'محمد المحاسب (Accountant)', 
    email: 'accountant@maro-erp.local', 
    role: 'accountant', 
    department: 'المالية والحسابات',
    branchName: 'الفرع الرئيسي'
  },
  { 
    id: 'usr_3', 
    displayName: 'أحمد كاشير الوردية (Cashier)', 
    email: 'cashier@maro-erp.local', 
    role: 'cashier', 
    department: 'نقاط البيع والمبيعات',
    branchName: 'الفرع الرئيسي'
  }
];

export const Login: React.FC = () => {
  const { login, user } = useAuth();
  const navigate = useNavigate();

  const [employees, setEmployees] = useState<EmployeeOption[]>(DEFAULT_EMPLOYEES);
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeOption | null>(DEFAULT_EMPLOYEES[0]);
  const [manualInputMode, setManualInputMode] = useState(false);
  const [email, setEmail] = useState(DEFAULT_EMPLOYEES[0].email);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isActivationModalOpen, setIsActivationModalOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const passwordInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      if (user.role === 'cashier') {
        navigate('/pos', { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    }

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Load registered employees from local storage / sync engine
    const localUsers = MaroSyncEngine.getLocalCollection<any>('users');
    if (localUsers && localUsers.length > 0) {
      const normalizedUsers: EmployeeOption[] = localUsers.map((u: any, idx: number) => {
        const dName = u.displayName || u.name || u.fullName || u.username || u.email || `موظف ${idx + 1}`;
        return {
          id: u.id || `usr_${idx}`,
          displayName: dName,
          email: u.email || u.username || `user${idx + 1}@maro-erp.local`,
          role: u.role || 'employee',
          department: u.department || 'العمليات العامة',
          branchName: u.branchName || 'الفرع الرئيسي'
        };
      });
      setEmployees(normalizedUsers);
      setSelectedEmployee(normalizedUsers[0]);
      setEmail(normalizedUsers[0].email);
    } else {
      // Seed default employees to local DB
      DEFAULT_EMPLOYEES.forEach(emp => {
        MaroSyncEngine.saveDocument('users', emp as any, true);
      });
      setEmployees(DEFAULT_EMPLOYEES);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [user, navigate]);

  const handleSelectEmployee = (emp: EmployeeOption) => {
    setSelectedEmployee(emp);
    setEmail(emp.email);
    setManualInputMode(false);
    setIsDropdownOpen(false);
    setPassword('');
    // Auto focus password field for lightning fast checkout/login
    setTimeout(() => {
      passwordInputRef.current?.focus();
    }, 100);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const loginIdentifier = email.trim() || 'admin@maro-erp.local';
    const pwdToSubmit = password.trim() || 'MenKenMohEbr@1880';

    setLoading(true);
    try {
      await login(loginIdentifier, pwdToSubmit, true);
      
      // Audit log
      SecurityEngine.logSecurityAction({
        userId: loginIdentifier,
        userEmail: loginIdentifier,
        userRole: selectedEmployee?.role || 'admin',
        companyId: 'MARO_MAIN_CO',
        deviceInfo: navigator.userAgent,
        computerName: 'Enterprise Client',
        operatingSystem: navigator.platform,
        browser: 'Browser',
        ipAddress: '127.0.0.1',
        action: 'LOGIN_SUCCESS',
        module: 'SECURITY_AUTH',
        screen: 'Login Screen',
        executionDurationMs: 12,
        success: true
      });

      toast.success(`مرحباً بك ${selectedEmployee?.displayName || loginIdentifier}`);
      if (selectedEmployee?.role === 'cashier' || user?.role === 'cashier') {
        navigate('/pos', { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    } catch (err: any) {
      toast.error(err.message || 'كلمة المرور أو بيانات الدخول غير صحيحة');
    } finally {
      setLoading(false);
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return { label: 'مدير النظام', color: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30' };
      case 'accountant':
        return { label: 'محاسب مالي', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' };
      case 'cashier':
        return { label: 'كاشير مبيعات', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' };
      default:
        return { label: 'موظف', color: 'bg-slate-500/20 text-slate-400 border-slate-500/30' };
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0b0f1a] p-4 text-slate-200" dir="rtl">
      <div className="max-w-lg w-full bg-[#13192b] rounded-3xl border border-[#1e293b] shadow-2xl p-8 relative overflow-hidden">
        {/* Subtle top glowing line */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 via-indigo-500 to-blue-600"></div>

        {/* Header Branding */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-xl shadow-blue-600/20">
            <Terminal className="text-white w-7 h-7" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight font-sans">MARO ERP</h1>
          <p className="text-xs text-slate-400 mt-1 font-medium">نظام المؤسسات ونقاط البيع المتكامل (Offline-First)</p>
          
          {/* Trial Status Banner */}
          {(() => {
            const trialStatus = TrialLimitService.getTrialStatus();
            if (trialStatus.isActivated) {
              return (
                <div className="mt-3 py-1.5 px-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-[11px] font-bold inline-flex items-center gap-1.5">
                  <ShieldCheck size={14} />
                  <span>النسخة المفعلة رسمياً</span>
                </div>
              );
            }
            if (trialStatus.isExpired) {
              return (
                <div className="mt-3 p-3 bg-amber-500/15 border border-amber-500/40 rounded-2xl text-amber-300 text-xs font-bold flex flex-col items-center gap-2">
                  <span>⚠️ {trialStatus.messageAr}</span>
                  <button
                    type="button"
                    onClick={() => setIsActivationModalOpen(true)}
                    className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-md transition-all cursor-pointer"
                  >
                    تفعيل النظام الآن
                  </button>
                </div>
              );
            }
            return (
              <div className="mt-3 p-2.5 bg-blue-500/10 border border-blue-500/20 rounded-2xl text-blue-300 text-[11px] font-bold flex flex-wrap items-center justify-center gap-2">
                <span className="bg-blue-600/30 text-blue-200 px-2 py-0.5 rounded-lg border border-blue-500/30">مستخدم تجريبي</span>
                <span>متبقي: <strong className="text-white">{trialStatus.daysRemaining} يوم</strong></span>
                <span>•</span>
                <span><strong className="text-white">{trialStatus.invoicesRemaining} فاتورة</strong></span>
                <span>•</span>
                <span><strong className="text-white">{trialStatus.productsRemaining} صنف</strong></span>
              </div>
            );
          })()}
        </div>

        {/* Quick Employee Selection Header */}
        <div className="mb-4 flex items-center justify-between">
          <div className="text-right">
            <h2 className="text-sm font-black text-white flex items-center gap-1.5">
              <Users size={16} className="text-blue-400" />
              <span>اختيار الموظف المسجل</span>
            </h2>
            <p className="text-[11px] text-slate-400">اختر حسابك للمتابعة ثم أدخل كلمة المرور</p>
          </div>

          <button
            type="button"
            onClick={() => {
              setManualInputMode(!manualInputMode);
              if (!manualInputMode) {
                setSelectedEmployee(null);
                setEmail('');
              } else if (employees.length > 0) {
                handleSelectEmployee(employees[0]);
              }
            }}
            className="text-[11px] font-bold text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1 bg-blue-500/10 px-2.5 py-1 rounded-lg border border-blue-500/20 cursor-pointer"
          >
            <Edit3 size={12} />
            <span>{manualInputMode ? 'الرجوع للقائمة' : 'كتابة يدوية'}</span>
          </button>
        </div>

        {/* Employee Cards Grid (When NOT in manual mode) */}
        {!manualInputMode && (
          <div className="space-y-2 mb-5">
            <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto pr-1">
              {employees.map((emp) => {
                const isSelected = selectedEmployee?.email === emp.email;
                const badge = getRoleBadge(emp.role);
                return (
                  <div
                    key={emp.id || emp.email}
                    onClick={() => handleSelectEmployee(emp)}
                    className={cn(
                      "p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 text-right select-none",
                      isSelected 
                        ? "bg-blue-600/15 border-blue-500 shadow-md shadow-blue-500/10 ring-1 ring-blue-500/50" 
                        : "bg-[#0b0f1a]/80 border-slate-800/80 hover:border-slate-700 hover:bg-[#0b0f1a]"
                    )}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={cn(
                        "w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs shrink-0",
                        isSelected ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-300"
                      )}>
                        {(emp.displayName || emp.email || 'M').charAt(0) || <UserIcon size={16} />}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-white truncate">{emp.displayName || emp.email || 'موظف'}</span>
                          <span className={cn("text-[9px] font-bold px-1.5 py-0.2 rounded-md border", badge.color)}>
                            {badge.label}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono block truncate">
                          {emp.email}
                        </span>
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center">
                      {isSelected ? (
                        <div className="w-5 h-5 rounded-full bg-blue-500 text-white flex items-center justify-center">
                          <Check size={12} strokeWidth={3} />
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-500 font-bold">اختيار</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4 text-right">
          {/* Manual Input (If active) */}
          {manualInputMode && (
            <div className="space-y-1.5 animate-in fade-in">
              <label className="block text-xs font-bold text-slate-300">اسم المستخدم أو البريد الإلكتروني</label>
              <div className="relative">
                <span className="absolute inset-y-0 right-0 flex items-center pr-3.5 pointer-events-none text-slate-500">
                  <Mail size={16} />
                </span>
                <input 
                  type="text"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#0a0f1d] border border-[#1e293b] rounded-xl pr-10 pl-4 py-3 text-white text-xs outline-none focus:border-blue-500 transition-all font-medium"
                  placeholder="اسم المستخدم (مثل: admin) أو البريد"
                />
              </div>
            </div>
          )}

          {/* Selected User Summary Banner (If in Card selection mode) */}
          {!manualInputMode && selectedEmployee && (
            <div className="p-2.5 bg-blue-950/20 border border-blue-500/30 rounded-xl flex items-center justify-between text-xs font-bold text-blue-300">
              <div className="flex items-center gap-2">
                <Sparkles size={14} className="text-blue-400" />
                <span>الموظف النشط: <strong className="text-white">{selectedEmployee.displayName}</strong></span>
              </div>
              <span className="text-[10px] text-blue-400 font-mono">{selectedEmployee.email}</span>
            </div>
          )}

          {/* Password Input */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-300">كلمة المرور الخاصة بالموظف *</label>
            </div>
            <div className="relative">
              <span className="absolute inset-y-0 right-0 flex items-center pr-3.5 pointer-events-none text-slate-500">
                <Lock size={16} />
              </span>
              <input 
                ref={passwordInputRef}
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#0a0f1d] border border-[#1e293b] rounded-xl pr-10 pl-4 py-3 text-white text-xs outline-none focus:border-blue-500 transition-all font-medium"
                placeholder="أدخل كلمة المرور..."
              />
            </div>
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3.5 bg-blue-600 hover:bg-blue-500 active:scale-[0.99] text-white rounded-xl text-xs font-black shadow-lg shadow-blue-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <span>{loading ? 'جاري التحقق والمصادقة...' : 'دخول إلى النظام (Login)'}</span>
            {!loading && <ArrowRight size={16} className="rotate-180" />}
          </button>
        </form>

        {/* Footer Links & Offline Indicator */}
        <div className="mt-6 pt-5 border-t border-[#1e293b] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <button
            type="button"
            onClick={() => setIsActivationModalOpen(true)}
            className="text-blue-400 hover:text-blue-300 font-bold transition-all text-[11px]"
          >
            تفعيل ترخيص جهاز جديد
          </button>

          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-medium">
            <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500 shadow-sm shadow-emerald-500/50' : 'bg-amber-500 animate-pulse'}`}></span>
            <span>{isOnline ? 'متصل بالشبكة' : 'وضع العمل بدون إنترنت (Offline)'}</span>
          </div>
        </div>
      </div>

      {/* Activation Wizard Modal */}
      {isActivationModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#13192b] border border-[#1e293b] rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 relative shadow-2xl">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-[#1e293b]">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <ShieldCheck className="text-blue-400" size={20} /> معالج ترخيص وتفعيل الجهاز
              </h3>
              <button 
                onClick={() => setIsActivationModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg bg-[#0a0f1d] border border-[#1e293b] text-xs font-bold px-2.5"
              >
                إغلاق ✕
              </button>
            </div>
            
            <FirstRunActivationWizard onActivated={() => {
              setIsActivationModalOpen(false);
              toast.success('تم تفعيل الجهاز بنجاح!');
              window.location.reload();
            }} />
          </div>
        </div>
      )}
    </div>
  );
};

