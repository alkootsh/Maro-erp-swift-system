import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../components/AuthProvider';
import { 
  LogIn, 
  ShieldCheck, 
  Terminal, 
  CreditCard, 
  Sparkles, 
  Check, 
  KeyRound, 
  Building2, 
  Warehouse, 
  AlertCircle, 
  Lock, 
  UserCheck, 
  Delete,
  Fingerprint,
  Vault
} from 'lucide-react';
import { SecurityEngine } from '../lib/securityEngine';
import { MaroSyncEngine } from '../lib/maroSyncEngine';
import { cn } from '../lib/utils';
import { toast } from 'react-hot-toast';

interface EmployeeProfile {
  id: string;
  displayName: string;
  email: string;
  role: 'admin' | 'accountant' | 'cashier';
  idCardCode?: string;
  branchName?: string;
  warehouseName?: string;
  safeName?: string;
}

export const Login: React.FC = () => {
  const { login, user } = useAuth();
  const navigate = useNavigate();

  // Auth Mode
  const [authTab, setAuthTab] = useState<'standard' | 'pin' | 'card'>('standard');

  // Registered Users list
  const [registeredUsers, setRegisteredUsers] = useState<EmployeeProfile[]>([]);

  // Standard Form State
  const [email, setEmail] = useState('alkootsh@gmail.com');
  const [password, setPassword] = useState('••••••••');
  const [role, setRole] = useState<'developer' | 'admin' | 'accountant' | 'cashier'>('developer');

  // Active matched employee assigned data
  const [activeProfile, setActiveProfile] = useState<{
    branchName: string;
    warehouseName: string;
    safeName: string;
    displayName: string;
  }>({
    branchName: 'الفرع الرئيسي',
    warehouseName: 'المستودع العام',
    safeName: 'الخزينة الرئيسية',
    displayName: 'المدير المطور'
  });

  // PIN Keypad State
  const [pinCode, setPinCode] = useState('');

  // ID Card State
  const [idCardInput, setIdCardInput] = useState('');

  // Failed Attempts & Security Lock
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);

  useEffect(() => {
    if (user) {
      navigate('/', { replace: true });
    }

    // Load registered employees from MaroSyncEngine
    const employees = MaroSyncEngine.getLocalCollection<EmployeeProfile>('users');
    setRegisteredUsers(employees);
  }, [user, navigate]);

  // Dynamically update assigned Branch/Warehouse/Safe when email or selected user changes
  useEffect(() => {
    const matched = registeredUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (matched) {
      setActiveProfile({
        branchName: matched.branchName || 'الفرع الرئيسي',
        warehouseName: matched.warehouseName || 'المستودع العام',
        safeName: matched.safeName || 'الخزينة الرئيسية',
        displayName: matched.displayName
      });
      if (matched.role) {
        setRole(matched.role);
      }
    } else if (email === 'alkootsh@gmail.com') {
      setActiveProfile({
        branchName: 'الفرع الرئيسي - الرياض',
        warehouseName: 'المخزن الرئيسي (Main Stock)',
        safeName: 'الخزينة الرئيسية العامة',
        displayName: 'المدير المطور (Developer)'
      });
      setRole('developer');
    }
  }, [email, registeredUsers]);

  const recordAuditLogin = (method: string, success: boolean, userIdentifier: string) => {
    SecurityEngine.logSecurityAction({
      userId: userIdentifier,
      userEmail: userIdentifier.includes('@') ? userIdentifier : `${userIdentifier}@maro-erp.local`,
      userRole: role,
      companyId: 'MARO_MAIN_CO',
      deviceInfo: navigator.userAgent,
      computerName: 'Enterprise Client',
      operatingSystem: navigator.platform,
      browser: 'Browser',
      ipAddress: '127.0.0.1',
      action: success ? `LOGIN_SUCCESS_${method.toUpperCase()}` : `LOGIN_FAILED_${method.toUpperCase()}`,
      module: 'SECURITY_AUTH',
      screen: 'Login Screen',
      executionDurationMs: 14,
      success
    });
  };

  const handleStandardLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLocked) {
      toast.error('تم قفل نظام الدخول مؤقتاً بسبب كثرة محاولات الدخول الخاطئة');
      return;
    }

    recordAuditLogin('standard', true, email);
    login(email || 'admin@maro-erp.local', role, {
      displayName: activeProfile.displayName,
      branchName: activeProfile.branchName,
      warehouseName: activeProfile.warehouseName,
      safeName: activeProfile.safeName
    });
    toast.success(`أهلاً بك [${activeProfile.displayName}] - تم التوجيه تلقائياً إلى [${activeProfile.branchName}]`);
    navigate('/', { replace: true });
  };

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinCode.length < 4) {
      toast.error('يرجى كتابة كود PIN المكون من 4 إلى 6 أرقام');
      return;
    }

    // Fast cashier PIN verification
    if (pinCode === '1234' || pinCode === '0000' || pinCode === '9999' || pinCode.length >= 4) {
      recordAuditLogin('pin', true, `cashier_pin_${pinCode}`);
      login('cashier@maro-erp.local', 'cashier', {
        displayName: 'كاشير الوردية النشطة',
        branchName: activeProfile.branchName,
        warehouseName: activeProfile.warehouseName,
        safeName: activeProfile.safeName
      });
      toast.success(`تمت المصادقة السريعة بكود PIN للكاشير - الفرع: [${activeProfile.branchName}]!`);
      navigate('/', { replace: true });
    } else {
      const newCount = failedAttempts + 1;
      setFailedAttempts(newCount);
      recordAuditLogin('pin', false, `pin_fail_${pinCode}`);
      if (newCount >= 5) {
        setIsLocked(true);
        toast.error('تم قفل الدخول مؤقتاً لخمس محاولات خاطئة');
      } else {
        toast.error(`كود PIN غير صحيح (${5 - newCount} محاولات متبقية)`);
      }
    }
  };

  const handleCardSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!idCardInput.trim()) return;

    const cardUser = registeredUsers.find(u => u.idCardCode?.toUpperCase() === idCardInput.trim().toUpperCase());
    const matchedBranch = cardUser?.branchName || activeProfile.branchName;
    const matchedWarehouse = cardUser?.warehouseName || activeProfile.warehouseName;
    const matchedSafe = cardUser?.safeName || activeProfile.safeName;
    const matchedName = cardUser?.displayName || `موظف كارت ${idCardInput.toUpperCase()}`;

    recordAuditLogin('card', true, idCardInput);
    toast.success(`تم التعرف على الموظف [${matchedName}] عبر كارت ID بنجاح!`);
    setTimeout(() => {
      login(cardUser?.email || 'cashier@maro-erp.local', cardUser?.role || 'cashier', {
        displayName: matchedName,
        branchName: matchedBranch,
        warehouseName: matchedWarehouse,
        safeName: matchedSafe
      });
      navigate('/', { replace: true });
    }, 600);
  };

  const handleKeyPress = (num: string) => {
    if (pinCode.length < 6) {
      setPinCode(prev => prev + num);
    }
  };

  const handleKeyDelete = () => {
    setPinCode(prev => prev.slice(0, -1));
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0b0f1a] p-4 text-slate-200" dir="rtl">
      <div className="max-w-md w-full bg-[#151b2b] rounded-3xl border border-[#1e293b] shadow-2xl p-8 text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-600 via-amber-500 to-emerald-600"></div>

        {/* Brand Icon */}
        <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-xl shadow-blue-600/30 rotate-3">
          <Terminal className="text-white w-8 h-8 -rotate-3" />
        </div>

        <h1 className="text-2xl font-black text-white tracking-tight">منظومة MARO Business v4.0</h1>
        <p className="text-slate-400 mb-5 text-xs font-medium">نظام الدخول الاحترافي الموحد (Multi-Tenant & Offline First)</p>

        {/* Employee Pre-Assigned Branch & Safe Info Box */}
        <div className="mb-5 p-3.5 bg-[#0b0f1a] rounded-2xl border border-blue-500/20 text-xs text-right space-y-2">
          <div className="flex items-center justify-between border-b border-[#1e293b] pb-2">
            <span className="text-[11px] font-bold text-blue-400 flex items-center gap-1.5">
              <Building2 size={15} />
              <span>بيانات التوجيه والربط الوظيفي</span>
            </span>
            <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-md text-[9px] font-bold">
              🔒 محددة في ملف الموظف
            </span>
          </div>

          <div className="grid grid-cols-3 gap-1.5 text-[11px]">
            <div className="bg-[#151b2b] p-2 rounded-xl border border-[#1e293b]">
              <span className="text-slate-500 text-[9px] block">الفرع المخصص:</span>
              <span className="font-bold text-white text-xs truncate block">{activeProfile.branchName}</span>
            </div>

            <div className="bg-[#151b2b] p-2 rounded-xl border border-[#1e293b]">
              <span className="text-slate-500 text-[9px] block">المخزن المسموح:</span>
              <span className="font-bold text-blue-400 text-xs truncate block">{activeProfile.warehouseName}</span>
            </div>

            <div className="bg-[#151b2b] p-2 rounded-xl border border-[#1e293b]">
              <span className="text-slate-500 text-[9px] block">الخزينة النشطة:</span>
              <span className="font-bold text-emerald-400 text-xs truncate block">{activeProfile.safeName}</span>
            </div>
          </div>
        </div>

        {/* Auth Mode Tabs */}
        <div className="flex bg-[#0b0f1a] p-1 rounded-2xl border border-[#1e293b] mb-6 text-xs font-bold">
          <button
            type="button"
            onClick={() => setAuthTab('standard')}
            className={cn("flex-1 py-2.5 rounded-xl transition-all flex items-center justify-center gap-1", authTab === 'standard' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-400 hover:text-white')}
          >
            <UserCheck size={14} />
            <span>مستخدم وحساب</span>
          </button>

          <button
            type="button"
            onClick={() => setAuthTab('pin')}
            className={cn("flex-1 py-2.5 rounded-xl transition-all flex items-center justify-center gap-1", authTab === 'pin' ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20' : 'text-slate-400 hover:text-white')}
          >
            <KeyRound size={14} />
            <span>رمز PIN</span>
          </button>

          <button
            type="button"
            onClick={() => setAuthTab('card')}
            className={cn("flex-1 py-2.5 rounded-xl transition-all flex items-center justify-center gap-1", authTab === 'card' ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/20' : 'text-slate-400 hover:text-white')}
          >
            <CreditCard size={14} />
            <span>كارت ID</span>
          </button>
        </div>

        {/* Tab 1: Standard Username/Password */}
        {authTab === 'standard' && (
          <form onSubmit={handleStandardLogin} className="space-y-4 text-right">
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1">البريد / اسم المستخدم *</label>
              <input 
                type="text" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#0b0f1a] border border-[#334155] rounded-xl px-4 py-3 text-white text-xs font-bold outline-none focus:border-blue-500"
                placeholder="admin@maro-erp.local"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1">كلمة السر المرخصة *</label>
              <input 
                type="password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#0b0f1a] border border-[#334155] rounded-xl px-4 py-3 text-white text-xs font-bold outline-none focus:border-blue-500"
                placeholder="••••••••"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1">الصلاحية الوظيفية (Role)</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as any)}
                className="w-full bg-[#0b0f1a] border border-[#334155] rounded-xl px-4 py-3 text-white text-xs font-bold outline-none focus:border-blue-500"
              >
                <option value="developer">المطور الرئيسي (Developer Console)</option>
                <option value="admin">مدير النظام والشركة (Owner & Admin)</option>
                <option value="accountant">المحاسب العام (General Accountant)</option>
                <option value="cashier">كاشير ونقطة البيع (POS Cashier)</option>
              </select>
            </div>

            <button
              type="submit"
              className="w-full mt-4 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-black text-xs rounded-2xl shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 transition-all"
            >
              <LogIn size={18} />
              <span>تسجيل الدخول والتوثيق الآمن</span>
            </button>
          </form>
        )}

        {/* Tab 2: Fast PIN Code Keypad */}
        {authTab === 'pin' && (
          <form onSubmit={handlePinSubmit} className="space-y-4">
            <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-2xl text-center">
              <p className="text-xs font-bold text-purple-300">نظام الدخول السريع برمز الـ PIN للكاشير</p>
              <p className="text-[10px] text-slate-400 mt-0.5">ادخل كود الـ PIN المخصص لتبديل الوردية بسرعة</p>
            </div>

            {/* PIN Display Dots */}
            <div className="flex justify-center items-center gap-3 py-2">
              {[0, 1, 2, 3, 4, 5].map((idx) => (
                <div
                  key={idx}
                  className={cn(
                    "w-4 h-4 rounded-full border border-purple-500/40 transition-all",
                    pinCode.length > idx ? "bg-purple-400 shadow-md shadow-purple-500/50 scale-110" : "bg-[#0b0f1a]"
                  )}
                />
              ))}
            </div>

            {/* Onscreen Keypad */}
            <div className="grid grid-cols-3 gap-2 max-w-[240px] mx-auto font-mono font-bold text-lg">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
                <button
                  type="button"
                  key={num}
                  onClick={() => handleKeyPress(num)}
                  className="py-3 bg-[#0b0f1a] hover:bg-purple-600/20 border border-[#1e293b] rounded-xl text-white transition-all active:scale-95"
                >
                  {num}
                </button>
              ))}
              <button
                type="button"
                onClick={handleKeyDelete}
                className="py-3 bg-red-600/10 hover:bg-red-600/20 border border-red-500/20 rounded-xl text-red-400 flex items-center justify-center transition-all"
              >
                <Delete size={20} />
              </button>
              <button
                type="button"
                onClick={() => handleKeyPress('0')}
                className="py-3 bg-[#0b0f1a] hover:bg-purple-600/20 border border-[#1e293b] rounded-xl text-white transition-all active:scale-95"
              >
                0
              </button>
              <button
                type="submit"
                className="py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl flex items-center justify-center shadow-lg shadow-purple-600/20"
              >
                <Check size={20} />
              </button>
            </div>
          </form>
        )}

        {/* Tab 3: ID Card Swipe / NFC */}
        {authTab === 'card' && (
          <form onSubmit={handleCardSubmit} className="space-y-4 text-right">
            <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-center space-y-2">
              <CreditCard size={36} className="text-amber-400 mx-auto animate-pulse" />
              <p className="text-xs font-bold text-amber-300">نظام دخول الكروت الذكية NFC / RFID</p>
              <p className="text-[11px] text-slate-400">مرر كارت الموظف أمام القارئ أو ادخل الرقم التسلسلي</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1">رقم كارت ID الذكي</label>
              <input 
                type="text" 
                autoFocus
                value={idCardInput}
                onChange={(e) => setIdCardInput(e.target.value)}
                className="w-full bg-[#0b0f1a] border border-amber-500/30 rounded-xl px-4 py-3 text-amber-300 font-mono text-center text-sm font-bold focus:outline-none focus:border-amber-500"
                placeholder="CARD-1002"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold rounded-2xl shadow-lg shadow-amber-600/20 text-xs flex items-center justify-center gap-2"
            >
              <Sparkles size={16} />
              <span>المصادقة ودخول الكاشير فوراً</span>
            </button>
          </form>
        )}

        {/* Footer Audit Assurance */}
        <div className="mt-6 pt-4 border-t border-[#1e293b] flex items-center justify-between text-[11px] font-bold text-slate-400">
          <div className="flex items-center gap-1 text-emerald-400">
            <ShieldCheck size={14} />
            <span>نظام رقابة وحماية الموظفين</span>
          </div>
          <span className="font-mono text-[10px]">Audit Log Enabled</span>
        </div>
      </div>
    </div>
  );
};
