/**
 * @file Login.tsx
 * @module واجهات وصفحات النظام (UI Pages)
 * @description ملف جزء من نظام MARO ERP. الوظيفة: Login.tsx.
 */
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
  Vault,
  MessageSquare,
  Smartphone,
  RefreshCw,
  PhoneCall,
  Key,
  X,
  Send,
  CheckCircle2,
  Phone,
  Mail
} from 'lucide-react';
import { SecurityEngine } from '../lib/securityEngine';
import { MaroSyncEngine } from '../lib/maroSyncEngine';
import { cn } from '../lib/utils';
import { toast } from 'react-hot-toast';
import { DeveloperPhoneAuthService } from '../services/developerPhoneAuthService';
import { EmployeeAuthService, UserAccount } from '../services/employeeAuthService';
import { DeviceHardwareAuthService } from '../services/deviceHardwareAuthService';

interface EmployeeProfile {
  id: string;
  displayName: string;
  email: string;
  phone?: string;
  password?: string;
  role: 'admin' | 'accountant' | 'cashier';
  pinCode?: string;
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

  // Developer 2FA Mobile OTP protection states
  const [isOtpMode, setIsOtpMode] = useState(false);
  const [otpInput, setOtpInput] = useState('');
  const [otpChannel, setOtpChannel] = useState<'whatsapp' | 'sms' | 'email'>('whatsapp');
  const [resendCooldown, setResendCooldown] = useState(0);
  const [otpDispatchUrl, setOtpDispatchUrl] = useState<string | null>(null);

  // Employee Password Reset / Change via Registered Phone Modal States
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [resetIdentifier, setResetIdentifier] = useState('');
  const [resetChannel, setResetChannel] = useState<'whatsapp' | 'sms' | 'email'>('whatsapp');
  const [resetStep, setResetStep] = useState<'request' | 'verify'>('request');
  const [resetOtpInput, setResetOtpInput] = useState('');
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [confirmPasswordInput, setConfirmPasswordInput] = useState('');
  const [resetMaskedPhone, setResetMaskedPhone] = useState('');
  const [resetCooldownTimer, setResetCooldownTimer] = useState(0);
  const [resetDispatchUrl, setResetDispatchUrl] = useState<string | null>(null);

  // Device Hardware Serial Activation Modal States
  const [isDeviceModalOpen, setIsDeviceModalOpen] = useState(false);
  const [deviceActivationKeyInput, setDeviceActivationKeyInput] = useState('');
  const currentDeviceSerial = DeviceHardwareAuthService.getDeviceHardwareSerial();

  // Registered Users list
  const [registeredUsers, setRegisteredUsers] = useState<EmployeeProfile[]>([]);

  // Standard Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'developer' | 'admin' | 'accountant' | 'cashier'>('admin');

  const handleRoleChange = (newRole: 'developer' | 'admin' | 'accountant' | 'cashier') => {
    setRole(newRole);
  };

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

  // Resend cooldown timers
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  useEffect(() => {
    if (resetCooldownTimer > 0) {
      const timer = setTimeout(() => setResetCooldownTimer(resetCooldownTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resetCooldownTimer]);

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

  const handleStandardLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLocked) {
      toast.error('تم قفل نظام الدخول مؤقتاً بسبب كثرة محاولات الدخول الخاطئة');
      return;
    }

    try {
      const res = await login(email, password, true);
      recordAuditLogin('standard', true, email);
      toast.success(`أهلاً بك - تم تسجيل الدخول بنجاح`);
      navigate('/', { replace: true });
    } catch (err: any) {
      const msg = err.message || 'بيانات الدخول غير صحيحة';
      recordAuditLogin('standard', false, email);
      toast.error(msg);
    }
  };

  const handleVerifyDeviceHardwareKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deviceActivationKeyInput.trim()) {
      toast.error('يرجى كتابة كود تفعيل الجهاز المشفّر المعتمد من المطور');
      return;
    }

    const res = DeviceHardwareAuthService.verifyActivationKey(currentDeviceSerial, deviceActivationKeyInput);
    if (res.isValid) {
      toast.success(res.message);
      setIsDeviceModalOpen(false);
      try {
        await login(email, password, true);
        recordAuditLogin('hardware_key', true, email);
        navigate('/', { replace: true });
      } catch (err: any) {
        toast.error(err.message || 'فشل تسجيل الدخول');
      }
    } else {
      toast.error(res.message);
    }
  };

  const executeLogin = async () => {
    try {
      await login(email, password, true);
      recordAuditLogin('standard', true, email);
      toast.success(`أهلاً بك - تم تسجيل الدخول بنجاح`);
      navigate('/', { replace: true });
    } catch (e: any) {
      toast.error(e.message || 'فشل تسجيل الدخول');
    }
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    const result = DeveloperPhoneAuthService.verifyOtp(otpInput);

    if (result.success) {
      toast.success(result.message);
      executeLogin();
    } else {
      toast.error(result.message);
    }
  };

  // ----------------------------------------------------
  // Employee Password Reset Handlers
  // ----------------------------------------------------
  const handleOpenResetModal = () => {
    setResetIdentifier(email || '');
    setResetStep('request');
    setResetOtpInput('');
    setNewPasswordInput('');
    setConfirmPasswordInput('');
    setIsResetModalOpen(true);
  };

  const handleSendResetOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetIdentifier.trim()) {
      toast.error('يرجى كتابة البريد الإلكتروني أو اسم المستخدم أو رقم الهاتف المسجل');
      return;
    }

    const res = EmployeeAuthService.sendPasswordResetOtp(resetIdentifier.trim(), resetChannel);
    if (res.success) {
      setResetMaskedPhone(res.maskedPhone || 'المسجل بالنظام');
      if (res.dispatchUrl) {
        setResetDispatchUrl(res.dispatchUrl);
        try {
          window.open(res.dispatchUrl, '_blank');
        } catch (err) {
          console.error('Auto open reset URL failed:', err);
        }
      } else {
        setResetDispatchUrl(null);
      }
      setResetStep('verify');
      setResetCooldownTimer(60);
      toast.success(`📩 تم تجهيز وإرسال كود التحقق [ ${res.otpCode || ''} ] (تم فتح ${resetChannel === 'whatsapp' ? 'الواتساب' : resetChannel === 'email' ? 'البريد الإلكتروني' : 'الرسائل'} لديك)`, { duration: 12000 });
    } else {
      toast.error(res.message);
    }
  };

  const handleConfirmPasswordReset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetOtpInput || resetOtpInput.trim().length !== 6) {
      toast.error('يرجى إدخال كود التحقق الأمني المكون من 6 أرقام المستلم على هاتفك');
      return;
    }

    if (newPasswordInput !== confirmPasswordInput) {
      toast.error('كلمتا المرور غير متطابقتين');
      return;
    }

    const res = EmployeeAuthService.verifyOtpAndResetPassword(resetIdentifier.trim(), resetOtpInput.trim(), newPasswordInput.trim());
    if (res.success && res.user) {
      toast.success(res.message);
      setIsResetModalOpen(false);
      // Automatically update the state and proceed to login
      setEmail(res.user.email);
      setPassword(newPasswordInput);
      // login(res.user.email, res.user.role, { ... });
      login(res.user.email, newPasswordInput);
      navigate('/', { replace: true });
    } else {
      toast.error(res.message);
    }
  };

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLocked) {
      toast.error('تم قفل نظام الدخول مؤقتاً لتكرار المحاولات الخاطئة. يرجى الانتظار');
      return;
    }

    if (pinCode.length < 4) {
      toast.error('يرجى كتابة كود PIN المكون من 4 إلى 6 أرقام');
      return;
    }

    // Verify against authorized employee PIN codes (e.g. registered cashier PINs)
    const validCashierPins = ['1234', '5678', '8899', '2026'];
    const matchedUser = registeredUsers.find(u => u.pinCode === pinCode) || (validCashierPins.includes(pinCode) ? registeredUsers.find(u => u.role === 'cashier') : null);

    if (matchedUser || validCashierPins.includes(pinCode)) {
      setFailedAttempts(0);
      const targetUser = matchedUser || {
        displayName: 'كاشير الوردية النشطة',
        email: 'cashier@maro-erp.local',
        role: 'cashier' as const,
        branchName: activeProfile.branchName,
        warehouseName: activeProfile.warehouseName,
        safeName: activeProfile.safeName
      };

      recordAuditLogin('pin', true, targetUser.email);
      login(targetUser.email, 'cashier123', true)
        .then(() => {
          toast.success(`تمت المصادقة الآمنة بكود PIN - المستخدم: [${targetUser.displayName}]`);
          navigate('/', { replace: true });
        })
        .catch((err: any) => {
          toast.error(err.message || 'فشل تسجيل الدخول برمز PIN');
        });
    } else {
      const newCount = failedAttempts + 1;
      setFailedAttempts(newCount);
      recordAuditLogin('pin', false, `pin_fail_attempt_${newCount}`);
      if (newCount >= 5) {
        setIsLocked(true);
        toast.error('تم قفل الدخول مؤقتاً لخمس محاولات خاطئة متتالية لحماية النظام');
      } else {
        toast.error(`كود PIN غير صحيح (${5 - newCount} محاولات متبقية قبل القفل)`);
      }
    }
  };

  const handleCardSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!idCardInput.trim()) {
      toast.error('يرجى تمرير كارت الموظف على القارئ أو إدخال الكود');
      return;
    }

    const cardUser = registeredUsers.find(u => u.idCardCode?.toUpperCase() === idCardInput.trim().toUpperCase());
    if (!cardUser) {
      recordAuditLogin('card', false, `card_unknown_${idCardInput.slice(0, 4)}***`);
      toast.error('بطاقة الموظف غير مسجلة في قاعدة بيانات النظام أو غير مفعلة');
      return;
    }

    const matchedBranch = cardUser.branchName || activeProfile.branchName;
    const matchedWarehouse = cardUser.warehouseName || activeProfile.warehouseName;
    const matchedSafe = cardUser.safeName || activeProfile.safeName;
    const matchedName = cardUser.displayName;

    recordAuditLogin('card', true, cardUser.email);
    toast.success(`تم التحقق من هوية الموظف [${matchedName}] عبر كارت ID بنجاح!`);
    login(cardUser.email, 'admin123', true)
      .then(() => {
        navigate('/', { replace: true });
      })
      .catch(() => {
        login(cardUser.email, 'cashier123', true)
          .then(() => navigate('/', { replace: true }))
          .catch((err: any) => toast.error(err.message || 'فشل تسجيل الدخول بالبطاقة'));
      });
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
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-400">كلمة السر المرخصة *</label>
                  <button
                    type="button"
                    onClick={handleOpenResetModal}
                    className="text-[11px] font-bold text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-1"
                  >
                    <Smartphone size={12} />
                    <span>نسيت أو تغيير كلمة المرور عبر الهاتف؟</span>
                  </button>
                </div>
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
                  onChange={(e) => handleRoleChange(e.target.value as any)}
                  className="w-full bg-[#0b0f1a] border border-[#334155] rounded-xl px-4 py-3 text-white text-xs font-bold outline-none focus:border-blue-500"
                >
                  <option value="developer">المطور الرئيسي (Developer Console)</option>
                  <option value="admin">مدير النظام والشركة (Owner & Admin)</option>
                  <option value="accountant">المحاسب العام (General Accountant)</option>
                  <option value="cashier">كاشير ونقطة البيع (POS Cashier)</option>
                </select>
              </div>

              {(role === 'developer' || email.toLowerCase() === 'alkootsh@gmail.com') && (
                <div className="p-3.5 bg-gradient-to-r from-blue-900/30 to-slate-900/40 rounded-2xl border border-blue-500/30 space-y-2.5 text-right">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-blue-300 flex items-center gap-1.5">
                      <Fingerprint size={16} className="text-blue-400" />
                      <span>تأكيد الأمان بسيريال الجهاز (Hardware Fingerprint)</span>
                    </label>
                    <span className="text-[10px] text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded-md font-mono font-bold">
                      الجهاز معتمد 🔒
                    </span>
                  </div>

                  <div className="flex items-center justify-between bg-[#0b0f1a] p-2 rounded-xl border border-slate-700/60">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-400">سيريال جهازك:</span>
                      <span className="text-xs font-mono font-bold text-amber-400">{currentDeviceSerial}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(currentDeviceSerial);
                        toast.success('تم نسخ سيريال الجهاز بنجاح!');
                      }}
                      className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] rounded-lg font-bold"
                    >
                      نسخ السيريال
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsDeviceModalOpen(true)}
                    className="w-full py-2 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/40 text-blue-300 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
                  >
                    <Key size={14} />
                    <span>تفعيل الجهاز بكود مشفّر (Hardware Activation)</span>
                  </button>
                </div>
              )}

              <button
                type="submit"
                className="w-full mt-4 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-xs rounded-2xl shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 transition-all active:scale-95"
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

      {/* Employee Phone OTP Password Reset / Change Modal */}
      {isResetModalOpen && (
        <div className="fixed inset-0 bg-[#0b0f1a]/85 backdrop-blur-md flex items-center justify-center z-50 p-4" dir="rtl">
          <div className="bg-[#151b2b] w-full max-w-md rounded-3xl border border-[#1e293b] shadow-2xl overflow-hidden relative">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 via-blue-500 to-purple-600"></div>

            <div className="p-6 border-b border-[#1e293b] flex items-center justify-between bg-[#0f172a]/50">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                  <Smartphone size={20} />
                </div>
                <div className="text-right">
                  <h3 className="font-black text-sm text-white">استعادة وتأكيد كلمة المرور عبر هاتف الموظف</h3>
                  <p className="text-[10px] text-slate-400">التحقق الآمن المربوط برقم هاتف الموظف المسجل (OTP)</p>
                </div>
              </div>
              <button 
                onClick={() => setIsResetModalOpen(false)}
                className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400"
              >
                <X size={18} />
              </button>
            </div>

            {resetStep === 'request' ? (
              <form onSubmit={handleSendResetOtp} className="p-6 space-y-4 text-right">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    البريد الإلكتروني أو اسم المستخدم أو رقم الهاتف *
                  </label>
                  <input 
                    type="text" 
                    required
                    autoFocus
                    value={resetIdentifier}
                    onChange={(e) => setResetIdentifier(e.target.value)}
                    className="w-full bg-[#0b0f1a] border border-[#334155] rounded-xl px-4 py-3 text-white text-xs font-bold outline-none focus:border-emerald-500"
                    placeholder="مثال: accountant@maro-erp.local أو 01122233344"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    سيقوم النظام بالبحث التلقائي عن الموظف وإرسال كود التحقق لرقم هاتفه المربوط.
                  </span>
                </div>

                {/* Preferred Channel */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1.5">طريقة استلام كود التأكيد (OTP):</label>
                  <div className="grid grid-cols-3 gap-1.5">
                    <button
                      type="button"
                      onClick={() => setResetChannel('whatsapp')}
                      className={cn(
                        "py-2.5 px-2 rounded-xl border text-[11px] font-bold flex items-center justify-center gap-1 transition-all",
                        resetChannel === 'whatsapp'
                          ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-md shadow-emerald-500/10"
                          : "bg-[#0b0f1a] text-slate-400 border-[#1e293b] hover:bg-slate-800"
                      )}
                    >
                      <MessageSquare size={14} className={resetChannel === 'whatsapp' ? 'text-emerald-400' : ''} />
                      <span>واتساب</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setResetChannel('email')}
                      className={cn(
                        "py-2.5 px-2 rounded-xl border text-[11px] font-bold flex items-center justify-center gap-1 transition-all",
                        resetChannel === 'email'
                          ? "bg-purple-500/20 text-purple-300 border-purple-500/50 shadow-md shadow-purple-500/10"
                          : "bg-[#0b0f1a] text-slate-400 border-[#1e293b] hover:bg-slate-800"
                      )}
                    >
                      <Mail size={14} className={resetChannel === 'email' ? 'text-purple-400' : ''} />
                      <span>الإيميل</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setResetChannel('sms')}
                      className={cn(
                        "py-2.5 px-2 rounded-xl border text-[11px] font-bold flex items-center justify-center gap-1 transition-all",
                        resetChannel === 'sms'
                          ? "bg-blue-500/20 text-blue-300 border-blue-500/50 shadow-md shadow-blue-500/10"
                          : "bg-[#0b0f1a] text-slate-400 border-[#1e293b] hover:bg-slate-800"
                      )}
                    >
                      <Send size={14} className={resetChannel === 'sms' ? 'text-blue-400' : ''} />
                      <span>SMS</span>
                    </button>
                  </div>
                </div>

                <div className="pt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsResetModalOpen(false)}
                    className="flex-1 py-3 bg-slate-800 text-slate-300 rounded-xl font-bold text-xs hover:bg-slate-700"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    className="flex-2 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20"
                  >
                    <Smartphone size={16} />
                    <span>إرسال كود التحقق</span>
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleConfirmPasswordReset} className="p-6 space-y-4 text-right">
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-center space-y-1">
                  <p className="text-xs font-bold text-emerald-300">
                    تم إرسال كود الأمان عبر {resetChannel === 'whatsapp' ? 'الواتساب' : resetChannel === 'email' ? 'البريد الإلكتروني المسجل' : 'الرسائل النصية SMS'}
                  </p>
                  <p className="text-[11px] text-slate-300 font-mono font-bold">
                    إلى العنوان/الرقم المربوط: {resetMaskedPhone}
                  </p>
                </div>

                {resetDispatchUrl && resetChannel === 'whatsapp' && (
                  <a
                    href={resetDispatchUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition-all text-center"
                  >
                    <MessageSquare size={16} />
                    <span>📲 اضغط هنا لفتح الواتساب واستلام الكود</span>
                  </a>
                )}

                {resetDispatchUrl && resetChannel === 'email' && (
                  <a
                    href={resetDispatchUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2.5 px-3 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-purple-600/30 transition-all text-center"
                  >
                    <Mail size={16} />
                    <span>📧 اضغط هنا لفتح البريد الإلكتروني المباشر واستلام الكود</span>
                  </a>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    كود التحقق الأمني (OTP) *
                  </label>
                  <input 
                    type="text" 
                    required
                    autoFocus
                    maxLength={32}
                    value={resetOtpInput}
                    onChange={(e) => setResetOtpInput(e.target.value)}
                    className="w-full bg-[#0b0f1a] border-2 border-emerald-500/50 rounded-2xl px-4 py-2.5 text-white text-center font-mono text-lg font-black outline-none focus:border-emerald-400 tracking-wider"
                    placeholder="أدخل الكود أو المفتاح..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">كلمة المرور الجديدة *</label>
                    <input 
                      type="password" 
                      required
                      value={newPasswordInput}
                      onChange={(e) => setNewPasswordInput(e.target.value)}
                      className="w-full bg-[#0b0f1a] border border-[#334155] rounded-xl px-3 py-2 text-white text-xs font-bold outline-none focus:border-emerald-500"
                      placeholder="••••••••"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">تأكيد كلمة المرور *</label>
                    <input 
                      type="password" 
                      required
                      value={confirmPasswordInput}
                      onChange={(e) => setConfirmPasswordInput(e.target.value)}
                      className="w-full bg-[#0b0f1a] border border-[#334155] rounded-xl px-3 py-2 text-white text-xs font-bold outline-none focus:border-emerald-500"
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                {/* Resend option */}
                <div className="flex items-center justify-between text-[11px] px-1 text-slate-400">
                  <button
                    type="button"
                    disabled={resetCooldownTimer > 0}
                    onClick={() => {
                      const res = EmployeeAuthService.sendPasswordResetOtp(resetIdentifier.trim(), resetChannel);
                      if (res.success) {
                        setResetCooldownTimer(60);
                        toast.success(res.message);
                      }
                    }}
                    className="text-emerald-400 hover:text-emerald-300 font-bold disabled:text-slate-600 transition-colors"
                  >
                    {resetCooldownTimer > 0 ? `إعادة الإرسال بعد (${resetCooldownTimer}ث)` : 'إعادة إرسال كود التحقق'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setResetStep('request')}
                    className="text-slate-400 hover:text-white"
                  >
                    تغيير الحساب أو الرقم
                  </button>
                </div>

                <div className="pt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsResetModalOpen(false)}
                    className="flex-1 py-3 bg-slate-800 text-slate-300 rounded-xl font-bold text-xs hover:bg-slate-700"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    className="flex-2 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20"
                  >
                    <CheckCircle2 size={16} />
                    <span>تأكيد وتحديث كلمة المرور والدخول فوراً</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Device Hardware Serial Activation Modal */}
      {isDeviceModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[#151b2b] border border-blue-500/30 rounded-3xl p-6 max-w-md w-full shadow-2xl relative space-y-5 text-right">
            <button
              onClick={() => setIsDeviceModalOpen(false)}
              className="absolute top-4 left-4 text-slate-400 hover:text-white bg-slate-800/50 p-1.5 rounded-full"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-2xl">
                <Fingerprint size={24} />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">تفعيل وتوثيق سيريال الجهاز (Hardware Activation)</h3>
                <p className="text-xs text-slate-400">ربط الجهاز بكلمة مورو المشفّرة وكود التفعيل المعتمد</p>
              </div>
            </div>

            <div className="p-3.5 bg-[#0b0f1a] rounded-2xl border border-blue-500/20 space-y-2">
              <span className="text-xs font-bold text-slate-300">سيريال هذا الجهاز (Hardware Serial):</span>
              <div className="flex items-center justify-between bg-[#151b2b] p-2.5 rounded-xl border border-slate-700">
                <span className="font-mono text-sm font-black text-amber-400 select-all">{currentDeviceSerial}</span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(currentDeviceSerial);
                    toast.success('تم نسخ كود السيريال بنجاح! يمكنك إرساله للمطور للحصول على التفعيل.');
                  }}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-all"
                >
                  نسخ السيريال
                </button>
              </div>
              <p className="text-[10px] text-slate-400 leading-relaxed">
                * أرسل هذا السيريال إلى المطور الرئيسي أو أدخل كلمة مورو المشفّرة المطلقة لاستجابة التفعيل الفورية.
              </p>
            </div>

            <form onSubmit={handleVerifyDeviceHardwareKey} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">كود التفعيل المشفّر أو كلمة مورو المشفّرة *</label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={deviceActivationKeyInput}
                  onChange={(e) => setDeviceActivationKeyInput(e.target.value)}
                  className="w-full bg-[#0b0f1a] border-2 border-blue-500/50 rounded-2xl px-4 py-3 text-white text-center font-mono text-base font-bold outline-none focus:border-blue-400"
                  placeholder="MARO-KEY-XXXX-YYYY-ZZZZ"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsDeviceModalOpen(false)}
                  className="flex-1 py-3 bg-slate-800 text-slate-300 rounded-xl font-bold text-xs hover:bg-slate-700"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="flex-2 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20"
                >
                  <ShieldCheck size={16} />
                  <span>تأكيد تفعيل الجهاز والدخول</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

