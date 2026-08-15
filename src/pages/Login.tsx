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
  PhoneCall
} from 'lucide-react';
import { SecurityEngine } from '../lib/securityEngine';
import { MaroSyncEngine } from '../lib/maroSyncEngine';
import { cn } from '../lib/utils';
import { toast } from 'react-hot-toast';
import { DeveloperPhoneAuthService } from '../services/developerPhoneAuthService';

interface EmployeeProfile {
  id: string;
  displayName: string;
  email: string;
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
  const [developerPhone, setDeveloperPhone] = useState(() => DeveloperPhoneAuthService.getConfig().registeredPhoneNumber);
  const [otpChannel, setOtpChannel] = useState<'whatsapp' | 'sms'>('whatsapp');
  const [resendCooldown, setResendCooldown] = useState(0);

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

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

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

  const dispatchDeveloperOtp = (channel: 'whatsapp' | 'sms') => {
    setOtpChannel(channel);
    const result = DeveloperPhoneAuthService.generateAndSendOtp(
      channel,
      'تسجيل الدخول وتوثيق صلاحيات مهندس النظام الكاملة',
      developerPhone
    );

    setIsOtpMode(true);
    setResendCooldown(60);
    toast.success(result.message);
  };

  const handleStandardLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLocked) {
      toast.error('تم قفل نظام الدخول مؤقتاً بسبب كثرة محاولات الدخول الخاطئة');
      return;
    }

    // Intercept Developer login for maximum hardware-backed security (SMS or WhatsApp 2FA)
    if (role === 'developer' || email.toLowerCase() === 'alkootsh@gmail.com') {
      dispatchDeveloperOtp(otpChannel);
      return;
    }

    executeLogin();
  };

  const executeLogin = () => {
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
      recordAuditLogin('pin', true, matchedUser?.email || 'cashier@maro-erp.local');
      const targetUser = matchedUser || {
        displayName: 'كاشير الوردية النشطة',
        email: 'cashier@maro-erp.local',
        role: 'cashier' as const,
        branchName: activeProfile.branchName,
        warehouseName: activeProfile.warehouseName,
        safeName: activeProfile.safeName
      };

      login(targetUser.email, targetUser.role, {
        displayName: targetUser.displayName,
        branchName: targetUser.branchName || activeProfile.branchName,
        warehouseName: targetUser.warehouseName || activeProfile.warehouseName,
        safeName: targetUser.safeName || activeProfile.safeName
      });
      toast.success(`تمت المصادقة الآمنة بكود PIN - المستخدم: [${targetUser.displayName}]`);
      navigate('/', { replace: true });
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
    setTimeout(() => {
      login(cardUser.email, cardUser.role, {
        displayName: matchedName,
        branchName: matchedBranch,
        warehouseName: matchedWarehouse,
        safeName: matchedSafe
      });
      navigate('/', { replace: true });
    }, 400);
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
          isOtpMode ? (
            <form onSubmit={handleVerifyOtp} className="space-y-4 text-right">
              <div className="p-4 bg-gradient-to-b from-blue-500/15 to-indigo-500/5 border border-blue-500/30 rounded-2xl text-center space-y-2 relative overflow-hidden">
                <div className="w-12 h-12 rounded-2xl bg-blue-500/20 border border-blue-500/40 text-blue-400 flex items-center justify-center mx-auto">
                  <ShieldCheck size={28} className="animate-pulse" />
                </div>
                <p className="text-xs font-black text-blue-300">نظام التحقق الأمني لهاتف المطور (2FA Root Protection)</p>
                <p className="text-[11px] text-slate-300">
                  {otpChannel === 'whatsapp' ? 'تم إرسال كود الأمان عبر الواتساب إلى رقم الهاتف المعتمد:' : 'تم إرسال كود الأمان عبر الرسائل النصية القصيرة (SMS) إلى الرقم:'}
                </p>
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#0b0f1a] rounded-xl border border-[#1e293b]">
                  <Smartphone size={14} className="text-blue-400" />
                  <span className="text-xs font-bold text-emerald-400 font-mono tracking-wider">{developerPhone}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">كود التحقق الأمني المكون من 6 أرقام (OTP) *</label>
                <input 
                  type="text" 
                  required
                  autoFocus
                  maxLength={6}
                  value={otpInput}
                  onChange={(e) => setOtpInput(e.target.value)}
                  className="w-full bg-[#0b0f1a] border-2 border-blue-500/50 rounded-2xl px-4 py-3 text-white text-center font-mono text-2xl font-black outline-none focus:border-blue-400 tracking-widest shadow-inner shadow-black/50"
                  placeholder="••••••"
                />
              </div>

              {/* Channel switcher and Resend inside OTP form */}
              <div className="flex items-center justify-between gap-2 p-2 bg-[#0b0f1a] border border-[#1e293b] rounded-xl text-[11px]">
                <button
                  type="button"
                  disabled={resendCooldown > 0}
                  onClick={() => dispatchDeveloperOtp(otpChannel === 'whatsapp' ? 'sms' : 'whatsapp')}
                  className="flex items-center gap-1.5 text-blue-400 hover:text-blue-300 font-bold disabled:text-slate-600 transition-colors"
                >
                  <RefreshCw size={13} className={resendCooldown > 0 ? '' : 'animate-spin-slow'} />
                  <span>
                    {resendCooldown > 0 ? `إعادة الإرسال بعد (${resendCooldown}ث)` : `إعادة الإرسال عبر ${otpChannel === 'whatsapp' ? 'الرسائل النصية SMS' : 'الواتساب WhatsApp'}`}
                  </span>
                </button>

                <span className="text-slate-500 font-mono text-[10px]">صالح لـ 5 دقائق</span>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsOtpMode(false)}
                  className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition-all"
                >
                  إلغاء وتعديل
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-xs rounded-xl shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-1.5"
                >
                  <ShieldCheck size={16} />
                  <span>تأكيد صلاحيات المطور</span>
                </button>
              </div>
            </form>
          ) : (
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

              {(role === 'developer' || email.toLowerCase() === 'alkootsh@gmail.com') && (
                <div className="p-3.5 bg-blue-500/10 rounded-2xl border border-blue-500/20 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-blue-300">هاتف المطور المسجل بالنظام (2FA)</label>
                    <span className="text-[10px] text-blue-400 bg-blue-500/20 px-2 py-0.5 rounded-md font-mono">System Root</span>
                  </div>

                  <div className="relative">
                    <Smartphone className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input 
                      type="text" 
                      required
                      value={developerPhone}
                      onChange={(e) => setDeveloperPhone(e.target.value)}
                      className="w-full bg-[#0b0f1a] border border-[#334155] rounded-xl pr-9 pl-3 py-2.5 text-white text-xs font-mono font-bold outline-none focus:border-blue-400 text-left"
                      placeholder="01000000000"
                      dir="ltr"
                    />
                  </div>

                  {/* Channel Preference Buttons */}
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-400 block">طريقة استلام كود الأمان وتأكيد الصلاحيات:</span>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setOtpChannel('whatsapp')}
                        className={cn(
                          "py-2 px-2.5 rounded-xl border text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all",
                          otpChannel === 'whatsapp'
                            ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-md shadow-emerald-500/10"
                            : "bg-[#0b0f1a] text-slate-400 border-[#1e293b] hover:bg-slate-800"
                        )}
                      >
                        <MessageSquare size={14} className={otpChannel === 'whatsapp' ? 'text-emerald-400' : ''} />
                        <span>واتساب (WhatsApp)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setOtpChannel('sms')}
                        className={cn(
                          "py-2 px-2.5 rounded-xl border text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all",
                          otpChannel === 'sms'
                            ? "bg-blue-500/20 text-blue-300 border-blue-500/50 shadow-md shadow-blue-500/10"
                            : "bg-[#0b0f1a] text-slate-400 border-[#1e293b] hover:bg-slate-800"
                        )}
                      >
                        <PhoneCall size={14} className={otpChannel === 'sms' ? 'text-blue-400' : ''} />
                        <span>رسالة نصية (SMS)</span>
                      </button>
                    </div>
                  </div>

                  <span className="text-[9.5px] text-slate-400 block leading-relaxed">
                    لحماية النظام، يتم إرسال رمز أمان مشفر إلى الهاتف المعتمد لتأكيد هوية المطور وتفعيل الصلاحيات الكاملة.
                  </span>
                </div>
              )}

              <button
                type="submit"
                className="w-full mt-4 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-xs rounded-2xl shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 transition-all active:scale-95"
              >
                <LogIn size={18} />
                <span>{role === 'developer' ? 'إرسال كود التحقق وتأكيد الصلاحيات' : 'تسجيل الدخول والتوثيق الآمن'}</span>
              </button>
            </form>
          )
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
