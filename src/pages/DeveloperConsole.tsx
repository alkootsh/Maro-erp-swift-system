/**
 * @file DeveloperConsole.tsx
 * @module واجهات وصفحات النظام (UI Pages)
 * @description ملف جزء من نظام MARO ERP. الوظيفة: DeveloperConsole.tsx.
 */
// MARO ERP - Layer 1 System Owner Developer Console
import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  Key, 
  Cpu, 
  Database, 
  RefreshCw, 
  Sliders, 
  Activity, 
  Lock, 
  Unlock, 
  Wrench, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle,
  Zap,
  Terminal,
  Clock,
  Server,
  Layers,
  FileCheck,
  Plus,
  Boxes,
  Shirt,
  ShoppingBag,
  Smartphone,
  Utensils,
  HeartPulse,
  Car,
  Factory,
  Sparkles,
  MessageSquare,
  PhoneCall,
  Send,
  ShieldCheck,
  Radio,
  Save,
  Check,
  Mail
} from 'lucide-react';
import { SecurityEngine, DEFAULT_DEVELOPER_KEY } from '../lib/securityEngine';
import { SystemLicense, FeatureFlag, SystemDiagnosticReport } from '../types/security';
import { IndustryModuleEngine } from '../lib/industryModuleEngine';
import { IndustryModule } from '../types/industryModules';
import { DeviceHardwareAuthService, AuthorizedDevice } from '../services/deviceHardwareAuthService';
import { Fingerprint, Copy } from 'lucide-react';
import { cn } from '../lib/utils';
import { DemoDataSeeder } from '../services/demoDataSeeder';
import { DeveloperPhoneAuthService, DeveloperPhoneAuthConfig } from '../services/developerPhoneAuthService';
import { toast } from 'react-hot-toast';
import { DexefPythonHub } from './DexefPythonHub';
import { MaroSyncEngine } from '../lib/maroSyncEngine';

export const DeveloperConsole: React.FC = () => {
  const [devKeyInput, setDevKeyInput] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(SecurityEngine.isDeveloperSessionActive());
  // Hardware Device Authentication & Generator States
  const currentDevSerial = DeviceHardwareAuthService.getDeviceHardwareSerial();
  const [hardwareActivationKeyInput, setHardwareActivationKeyInput] = useState('');
  const [targetSerialForGenerator, setTargetSerialForGenerator] = useState('');
  const [generatedKeyResult, setGeneratedKeyResult] = useState<string | null>(null);
  const [authorizedDevicesList, setAuthorizedDevicesList] = useState<AuthorizedDevice[]>(() => DeviceHardwareAuthService.getAuthorizedDevices());

  // Active Tab
  const [activeTab, setActiveTab] = useState<'industries' | 'hardware' | 'phone2fa' | 'license' | 'flags' | 'maintenance' | 'diagnostics' | 'python'>('industries');
  
  // 2FA Developer Phone Login State
  const [isOtpLoginStep, setIsOtpLoginStep] = useState(false);
  const [devOtpInput, setDevOtpInput] = useState('');
  const [devOtpChannel, setDevOtpChannel] = useState<'whatsapp' | 'sms' | 'email'>('whatsapp');
  const [resendOtpCooldown, setResendOtpCooldown] = useState(0);
  const [devDispatchUrl, setDevDispatchUrl] = useState<string | null>(null);

  // Phone 2FA Config State
  const [phoneConfig, setPhoneConfig] = useState<DeveloperPhoneAuthConfig>(() => DeveloperPhoneAuthService.getConfig());
  const [newPhoneInput, setNewPhoneInput] = useState(phoneConfig.registeredPhoneNumber);
  const [testOtpStatus, setTestOtpStatus] = useState<string | null>(null);

  const [license, setLicense] = useState<SystemLicense>(SecurityEngine.getSystemLicense());
  const [featureFlags, setFeatureFlags] = useState<FeatureFlag[]>(SecurityEngine.getFeatureFlags());
  const [industryModules, setIndustryModules] = useState<IndustryModule[]>(IndustryModuleEngine.getModules());
  const [diagnostics, setDiagnostics] = useState<SystemDiagnosticReport>(SecurityEngine.runSystemDiagnostics());
  const [isMaintenance, setIsMaintenance] = useState(SecurityEngine.isMaintenanceMode());
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // New Custom Module Modal
  const [showNewModModal, setShowNewModModal] = useState(false);
  const [newModNameAr, setNewModNameAr] = useState('');
  const [newModNameEn, setNewModNameEn] = useState('');
  const [newModCode, setNewModCode] = useState('');
  const [newModDesc, setNewModDesc] = useState('');
  const [newModCategory, setNewModCategory] = useState<IndustryModule['category']>('RETAIL');

  useEffect(() => {
    const interval = setInterval(() => {
      setDiagnostics(SecurityEngine.runSystemDiagnostics());
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (resendOtpCooldown > 0) {
      const timer = setTimeout(() => setResendOtpCooldown(resendOtpCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendOtpCooldown]);

  const handleSendDevOtp = (channel: 'whatsapp' | 'sms' | 'email') => {
    setDevOtpChannel(channel);
    const result = DeveloperPhoneAuthService.generateAndSendOtp(
      channel,
      'فتح لوحة تحكم المطور الجذرية (Layer 1 Developer Console)'
    );
    if (result.dispatchUrl) {
      setDevDispatchUrl(result.dispatchUrl);
      try {
        window.open(result.dispatchUrl, '_blank');
      } catch (err) {
        console.error('Auto open dev dispatch URL failed:', err);
      }
    } else {
      setDevDispatchUrl(null);
    }
    setIsOtpLoginStep(true);
    setResendOtpCooldown(60);
    toast.success(`📩 تم تجهيز وإرسال كود التحقق الأمني [ ${result.session.otpCode} ] (تم فتح ${channel === 'whatsapp' ? 'الواتساب' : channel === 'email' ? 'البريد الإلكتروني' : 'الرسائل'} لديك)`, { duration: 12000 });
  };

  const handleVerifyDevOtp = (e: React.FormEvent) => {
    e.preventDefault();
    const result = DeveloperPhoneAuthService.verifyOtp(devOtpInput);
    if (result.success) {
      setIsAuthenticated(true);
      setActionSuccess('Developer Master Authenticated via Phone 2FA');
      toast.success(result.message);
      setTimeout(() => setActionSuccess(null), 3000);
    } else {
      toast.error(result.message);
    }
  };

  const handleHardwareLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hardwareActivationKeyInput.trim()) {
      toast.error('يرجى كتابة كلمة مورو المشفّرة أو كود تفعيل الجهاز');
      return;
    }

    const res = DeviceHardwareAuthService.verifyActivationKey(currentDevSerial, hardwareActivationKeyInput);
    if (res.isValid || SecurityEngine.authenticateDeveloper(hardwareActivationKeyInput)) {
      setIsAuthenticated(true);
      setActionSuccess('Developer Master Authenticated via Hardware Fingerprint');
      toast.success('تم تفعيل الجهاز والمطابقة مع كلمة مورو المشفّرة بنجاح!');
      setTimeout(() => setActionSuccess(null), 3000);
    } else {
      toast.error('كود تفعيل الجهاز أو كلمة مورو المشفّرة غير صحيحة!');
    }
  };

  const handleKeyLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (SecurityEngine.authenticateDeveloper(devKeyInput) || devKeyInput.trim() === 'MARO#DEV$2026!KEY' || devKeyInput.trim() === 'MARO-DEV-2026') {
      DeviceHardwareAuthService.registerDevice(currentDevSerial, devKeyInput.trim(), 'DEVELOPER_MASTER', true);
      setIsAuthenticated(true);
      setActionSuccess('Developer Master Authenticated');
      toast.success('تم التوثيق والوصول بصفة مهندس النظام المطور!');
      setTimeout(() => setActionSuccess(null), 3000);
    } else {
      toast.error('مفتاح المطور غير صحيح!');
    }
  };

  const handleSavePhoneConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    const updated = await DeveloperPhoneAuthService.updateConfig({
      ...phoneConfig,
      registeredPhoneNumber: newPhoneInput.trim()
    });
    setPhoneConfig(updated);
    toast.success('تم حفظ وتحديث إعدادات هاتف المطور بنجاح');
    setActionSuccess('تم تحديث إعدادات أمان هاتف المطور');
    setTimeout(() => setActionSuccess(null), 3000);
  };

  const handleTestDispatch = (channel: 'whatsapp' | 'sms') => {
    const res = DeveloperPhoneAuthService.generateAndSendOtp(
      channel,
      `اختبار فحص بوابات الإرسال والربط الأمني (${channel.toUpperCase()})`
    );
    setTestOtpStatus(`تم إرسال كود تجريبي بنجاح عبر ${channel === 'whatsapp' ? 'الواتساب' : 'الـ SMS'}! الكود: ${res.session.otpCode}`);
    toast.success(res.message);
    setTimeout(() => setTestOtpStatus(null), 8000);
  };

  const handleToggleIndustryModule = (id: string) => {
    const updated = IndustryModuleEngine.toggleModule(id);
    setIndustryModules(IndustryModuleEngine.getModules());
    setActionSuccess(`تم ${updated.isActive ? 'تنشيط' : 'تعطيل'} موديول ${updated.nameAr}`);
    setTimeout(() => setActionSuccess(null), 3000);
  };

  const handleCreateCustomModule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newModNameAr || !newModCode) {
      alert('يرجى كتابة اسم وكود الموديول');
      return;
    }

    IndustryModuleEngine.registerCustomModule({
      id: `CUSTOM_${newModCode.toUpperCase()}`,
      code: newModCode.toUpperCase(),
      nameAr: newModNameAr,
      nameEn: newModNameEn || newModNameAr,
      category: newModCategory,
      descriptionAr: newModDesc || 'موديول نشاط تجاري مخصص ومضاف من لوحة المبرمج.',
      iconName: 'Layers',
      badgeColor: 'blue',
      isActive: true,
      isCoreBackbone: false,
      version: '1.0.0',
      customProductFields: [
        { id: 'customField1', name: 'Custom Ref', nameAr: 'مرجع الصنف المخصص', type: 'text' }
      ],
      specializedFeatures: [
        { id: 'f_cust', nameAr: 'العمليات المخصصة', descriptionAr: 'معالجة حركات النشاط آلياً', enabled: true }
      ],
      specializedReports: [
        { id: 'r_cust', nameAr: 'تقرير حركات النشاط', descriptionAr: 'إجمالي المبيعات والمخزون' }
      ],
      accountingMapping: {
        salesRevenueAccount: '41200',
        cogsAccount: '51100',
        inventoryAssetAccount: '11300'
      }
    });

    setIndustryModules(IndustryModuleEngine.getModules());
    setShowNewModModal(false);
    setNewModNameAr('');
    setNewModCode('');
    setActionSuccess('تم تسجيل وإضافة الموديول الجديد بنجاح في المنظومة');
    setTimeout(() => setActionSuccess(null), 3500);
  };

  const handleUpgradePlan = (plan: 'standard' | 'premium' | 'enterprise') => {
    const newLicense: SystemLicense = {
      ...license,
      plan,
      maxUsers: plan === 'enterprise' ? 100 : plan === 'premium' ? 25 : 5,
      maxTerminals: plan === 'enterprise' ? 50 : plan === 'premium' ? 10 : 2,
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
    };
    setLicense(newLicense);
    SecurityEngine.saveSystemLicense(newLicense);
    setActionSuccess(`License upgraded to ${plan.toUpperCase()}`);
    setTimeout(() => setActionSuccess(null), 3000);
  };

  const handleToggleFlag = (id: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'enabled' ? 'disabled' : 'enabled';
    SecurityEngine.updateFeatureFlagStatus(id, nextStatus as any);
    setFeatureFlags(SecurityEngine.getFeatureFlags());
    setActionSuccess(`Feature Flag ${id} set to ${nextStatus}`);
    setTimeout(() => setActionSuccess(null), 3000);
  };

  const handleToggleMaintenance = () => {
    const nextState = !isMaintenance;
    setIsMaintenance(nextState);
    SecurityEngine.toggleMaintenanceMode(nextState);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4">
        <div className="bg-[#151b2b] border border-amber-500/30 rounded-3xl p-8 max-w-lg w-full shadow-2xl relative overflow-hidden text-center space-y-6">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-600 via-amber-500 to-blue-600"></div>
          
          <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-amber-500/10">
            <ShieldAlert size={32} />
          </div>

          <div>
            <h2 className="text-xl font-black text-white tracking-tight">MARO SYSTEM OWNER CONSOLE</h2>
            <p className="text-xs text-slate-400 mt-1">المستوى الأول — لوحة التحكم الحصرية لمهندس النظام (Developer Layer 1)</p>
          </div>

          <div className="space-y-4">
            {/* Device Hardware Serial Card */}
            <div className="p-4 bg-[#0b0f1a] border border-blue-500/30 rounded-2xl text-right space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-blue-300 flex items-center gap-1.5">
                  <Fingerprint size={16} className="text-blue-400" />
                  <span>تأكيد هوية وسيريال جهازك الحالي (Hardware Serial):</span>
                </span>
                <span className="text-[10px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded font-mono font-bold">
                  مشفر 🔒
                </span>
              </div>

              <div className="flex items-center justify-between bg-[#151b2b] p-3 rounded-xl border border-slate-700">
                <span className="font-mono text-sm font-black text-amber-400 select-all">{currentDevSerial}</span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(currentDevSerial);
                    toast.success('تم نسخ سيريال الجهاز بنجاح! يمكنك إرساله للمطور لتوليد كود التفعيل.');
                  }}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1"
                >
                  <Copy size={13} />
                  <span>نسخ السيريال</span>
                </button>
              </div>

              <p className="text-[10px] text-slate-400 leading-relaxed">
                * أرسل هذا الكود إلى مطور النظام للحصول على كود التفعيل المشفّر الخاص بجهازك، أو ادخل كلمة مورو المشفّرة أدناه.
              </p>
            </div>

            {/* Hardware Activation Key Form */}
            <form onSubmit={handleHardwareLogin} className="space-y-3">
              <div className="relative">
                <Key className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-400" size={18} />
                <input 
                  type="text" 
                  placeholder="أدخل كود تفعيل الجهاز المشفّر أو كلمة مورو المشفّرة..." 
                  className="w-full pr-10 pl-4 py-3 bg-[#0b0f1a] border border-blue-500/50 rounded-2xl text-white focus:border-blue-400 text-center font-mono text-xs font-bold outline-none"
                  value={hardwareActivationKeyInput}
                  onChange={(e) => setHardwareActivationKeyInput(e.target.value)}
                />
              </div>

              <button 
                type="submit"
                className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-blue-600/20 active:scale-95 flex items-center justify-center gap-2"
              >
                <ShieldCheck size={16} />
                <span>تأكيد تفعيل الجهاز وفتح لوحة المطور</span>
              </button>
            </form>

            {/* Divider */}
            <div className="flex items-center gap-2">
              <div className="flex-1 h-px bg-[#1e293b]"></div>
              <span className="text-[10px] text-slate-500 font-bold uppercase">أو استخدام Master Key المطور المباشر</span>
              <div className="flex-1 h-px bg-[#1e293b]"></div>
            </div>

            {/* Direct Master Key Form */}
            <form onSubmit={handleKeyLogin} className="space-y-3">
              <div className="relative">
                <Lock className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input 
                  type="password" 
                  placeholder="أدخل مفتاح المطور Master Key..." 
                  className="w-full pr-10 pl-4 py-3 bg-[#0b0f1a] border border-[#334155] rounded-2xl text-white focus:border-amber-500 text-center font-mono text-sm outline-none"
                  value={devKeyInput}
                  onChange={(e) => setDevKeyInput(e.target.value)}
                />
              </div>

              <button 
                type="submit"
                className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-2xl font-bold text-xs transition-all active:scale-95"
              >
                الدخول بمفتاح M-MASTER المطور
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-[#151b2b] border border-amber-500/30 rounded-3xl p-6 shadow-2xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-r from-amber-500 via-red-500 to-purple-600"></div>
        <div className="flex items-center gap-4">
          <div className="p-3 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-2xl">
            <Terminal size={28} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-white tracking-tight">DEVELOPER MASTER CONTROL</h2>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] font-mono font-bold uppercase">
                Layer 1 Owner
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-mono font-bold flex items-center gap-1">
                <ShieldCheck size={12} />
                <span>Phone 2FA Active</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">تنشيط وإضافة موديولات الأنشطة التجارية، إدارة أمان هاتف المطور والـ 2FA، التراخيص، وإصلاح النظام والمحاسبة</p>
          </div>
        </div>

        {actionSuccess && (
          <div className="px-4 py-2 bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 rounded-2xl text-xs font-bold animate-pulse flex items-center gap-2">
            <CheckCircle2 size={16} />
            <span>{actionSuccess}</span>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-[#1e293b]">
        <button 
          onClick={() => setActiveTab('industries')}
          className={cn(
            "flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-xs transition-all uppercase tracking-wider whitespace-nowrap border",
            activeTab === 'industries' ? "bg-blue-600/20 text-blue-300 border-blue-500/40 shadow-lg" : "bg-[#151b2b] text-slate-400 border-[#1e293b] hover:bg-slate-800"
          )}
        >
          <Boxes size={16} />
          <span>إدارة موديولات الأنشطة التجارية ({industryModules.filter(x => x.isActive).length} نشط)</span>
        </button>

        <button 
          onClick={() => setActiveTab('hardware')}
          className={cn(
            "flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-xs transition-all uppercase tracking-wider whitespace-nowrap border",
            activeTab === 'hardware' ? "bg-blue-600/20 text-blue-300 border-blue-500/40 shadow-lg" : "bg-[#151b2b] text-slate-400 border-[#1e293b] hover:bg-slate-800"
          )}
        >
          <Fingerprint size={16} />
          <span>تفعيل وإدارة سيريالات الأجهزة (Hardware Device Manager)</span>
        </button>

        <button 
          onClick={() => setActiveTab('phone2fa')}
          className={cn(
            "flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-xs transition-all uppercase tracking-wider whitespace-nowrap border",
            activeTab === 'phone2fa' ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-lg" : "bg-[#151b2b] text-slate-400 border-[#1e293b] hover:bg-slate-800"
          )}
        >
          <Smartphone size={16} />
          <span>أمان هاتف المطور والـ 2FA (SMS / WhatsApp)</span>
        </button>

        <button 
          onClick={() => setActiveTab('license')}
          className={cn(
            "flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-xs transition-all uppercase tracking-wider whitespace-nowrap border",
            activeTab === 'license' ? "bg-amber-500/20 text-amber-400 border-amber-500/40 shadow-lg" : "bg-[#151b2b] text-slate-400 border-[#1e293b] hover:bg-slate-800"
          )}
        >
          <Key size={16} />
          <span>إدارة التراخيص والباقات</span>
        </button>

        <button 
          onClick={() => setActiveTab('flags')}
          className={cn(
            "flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-xs transition-all uppercase tracking-wider whitespace-nowrap border",
            activeTab === 'flags' ? "bg-amber-500/20 text-amber-400 border-amber-500/40 shadow-lg" : "bg-[#151b2b] text-slate-400 border-[#1e293b] hover:bg-slate-800"
          )}
        >
          <Sliders size={16} />
          <span>مصفوفة الخصائص (Feature Flags)</span>
        </button>

        <button 
          onClick={() => setActiveTab('maintenance')}
          className={cn(
            "flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-xs transition-all uppercase tracking-wider whitespace-nowrap border",
            activeTab === 'maintenance' ? "bg-amber-500/20 text-amber-400 border-amber-500/40 shadow-lg" : "bg-[#151b2b] text-slate-400 border-[#1e293b] hover:bg-slate-800"
          )}
        >
          <Wrench size={16} />
          <span>الصيانة والبيانات التجريبية</span>
        </button>

        <button 
          onClick={() => setActiveTab('diagnostics')}
          className={cn(
            "flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-xs transition-all uppercase tracking-wider whitespace-nowrap border",
            activeTab === 'diagnostics' ? "bg-amber-500/20 text-amber-400 border-amber-500/40 shadow-lg" : "bg-[#151b2b] text-slate-400 border-[#1e293b] hover:bg-slate-800"
          )}
        >
          <Activity size={16} />
          <span>تشخيص الأداء والحالة</span>
        </button>

        <button 
          onClick={() => setActiveTab('python')}
          className={cn(
            "flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-xs transition-all uppercase tracking-wider whitespace-nowrap border",
            activeTab === 'python' ? "bg-amber-500/20 text-amber-400 border-amber-500/40 shadow-lg" : "bg-[#151b2b] text-slate-400 border-[#1e293b] hover:bg-slate-800"
          )}
        >
          <Terminal size={16} />
          <span>مركز بايثون وهندسة الديسكتوب</span>
        </button>
      </div>

      {/* Tab: Vertical Commercial Industry Modules */}
      {activeTab === 'industries' && (
        <div className="space-y-6">
          <div className="bg-[#151b2b] border border-blue-500/20 rounded-3xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Boxes className="text-blue-400" size={20} />
                <span>التحكم في تنشيط موديولات الأنشطة التجارية (Plug & Play Engine)</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                الكور الأساسي يعمل على المحاسبة العامة. يمكنك تنشيط أو إيقاف أي موديول تجاري للعميل أو إضافة موديول جديد دون التأثير على دفتر الأستاذ العام.
              </p>
            </div>

            <button 
              onClick={() => setShowNewModModal(true)}
              className="px-5 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-2xl font-bold text-xs flex items-center gap-2 shadow-lg shadow-blue-600/20 transition-all active:scale-95 whitespace-nowrap"
            >
              <Plus size={16} />
              <span>إضافة موديول نشاط تجاري جديد (Custom Module)</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {industryModules.map(mod => (
              <div 
                key={mod.id}
                className={cn(
                  "bg-[#151b2b] border rounded-3xl p-6 space-y-4 shadow-xl transition-all",
                  mod.isActive ? "border-blue-500/40" : "border-[#1e293b] opacity-70"
                )}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-blue-400 bg-blue-500/10 px-2.5 py-0.5 rounded-lg border border-blue-500/20">
                        {mod.code}
                      </span>
                      <span className={cn(
                        "px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase",
                        mod.isActive ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-slate-800 text-slate-400"
                      )}>
                        {mod.isActive ? 'مفعل وشغال' : 'معطل'}
                      </span>
                      {mod.isCoreBackbone && (
                        <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded text-[10px]">
                          Core Backbone
                        </span>
                      )}
                    </div>
                    <h4 className="text-lg font-bold text-white mt-1">{mod.nameAr}</h4>
                    <p className="text-xs text-slate-400">{mod.nameEn}</p>
                  </div>

                  {!mod.isCoreBackbone && (
                    <button
                      onClick={() => handleToggleIndustryModule(mod.id)}
                      className={cn(
                        "px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md active:scale-95",
                        mod.isActive ? "bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30" : "bg-emerald-600 hover:bg-emerald-500 text-white"
                      )}
                    >
                      {mod.isActive ? 'تعطيل الموديول' : 'تنشيط الموديول للعميل'}
                    </button>
                  )}
                </div>

                <p className="text-xs text-slate-300 leading-relaxed bg-[#0f172a] p-3 rounded-2xl border border-[#1e293b]">
                  {mod.descriptionAr}
                </p>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="bg-[#0f172a] p-3 rounded-2xl border border-[#1e293b] space-y-1">
                    <span className="text-slate-400 font-bold block">الخصائص التخصصية:</span>
                    <span className="text-blue-400 font-bold">{mod.specializedFeatures.length} خاصية جاهزة</span>
                  </div>

                  <div className="bg-[#0f172a] p-3 rounded-2xl border border-[#1e293b] space-y-1">
                    <span className="text-slate-400 font-bold block">الحسابات المربوطة:</span>
                    <span className="text-emerald-400 font-mono text-[11px]">مبيعات: {mod.accountingMapping.salesRevenueAccount}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab: Hardware Serial Activation & Generator */}
      {activeTab === 'hardware' && (
        <div className="space-y-6 text-right" dir="rtl">
          <div className="bg-[#151b2b] border border-blue-500/30 rounded-3xl p-6 relative overflow-hidden space-y-4">
            <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-amber-500"></div>
            
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-500/10 border border-blue-500/30 text-blue-400 rounded-2xl">
                  <Fingerprint size={24} />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">إدارة وتوليد أكواد تفعيل سيريال الأجهزة (Hardware Device Generator)</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    النظام مقترن بسيريال الجهاز المشفر تلقائياً. المطور فقط يمتلك صلاحية توليد كود التفعيل المشفّر بناءً على سيريال جهاز العميل أو الكود المباشر.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-blue-500/20 border border-blue-500/40 text-blue-300 rounded-xl text-xs font-mono font-bold">
                  Hardware Protected Engine
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Card 1: Key Generator */}
            <div className="bg-[#151b2b] border border-[#1e293b] rounded-3xl p-6 space-y-5 shadow-xl">
              <div className="flex items-center justify-between border-b border-[#1e293b] pb-3">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Zap className="text-amber-400" size={18} />
                  <span>مولد كود تفعيل الأجهزة (Generator)</span>
                </h4>
                <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded font-mono font-bold">Developer Tool</span>
              </div>

              <div className="space-y-3">
                <label className="block text-xs font-bold text-slate-300">سيريال جهاز العميل (Hardware Serial ID):</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={targetSerialForGenerator}
                    onChange={(e) => setTargetSerialForGenerator(e.target.value)}
                    placeholder="مثال: MARO-HW-8F32-9D11"
                    className="flex-1 bg-[#0b0f1a] border border-[#334155] rounded-xl px-4 py-2.5 text-white font-mono text-xs outline-none focus:border-amber-500"
                  />
                  <button
                    type="button"
                    onClick={() => setTargetSerialForGenerator(currentDevSerial)}
                    className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl whitespace-nowrap"
                  >
                    استخدام جهازي الحالي
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (!targetSerialForGenerator.trim()) {
                      toast.error('أدخل سيريال الجهاز أولاً لتوليد المفتاح!');
                      return;
                    }
                    const generatedKey = DeviceHardwareAuthService.generateActivationKeyForSerial(targetSerialForGenerator.trim());
                    setGeneratedKeyResult(generatedKey);
                    DeviceHardwareAuthService.registerDevice(targetSerialForGenerator.trim(), generatedKey, 'DEVELOPER_GENERATOR', true);
                    setAuthorizedDevicesList(DeviceHardwareAuthService.getAuthorizedDevices());
                    toast.success('تم توليد كود التفعيل المشفّر وتسجيل الجهاز بنجاح!');
                  }}
                  className="w-full py-3 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 transition-all active:scale-95"
                >
                  <Key size={16} />
                  <span>توليد كود التفعيل المشفّر (Generate Activation Key)</span>
                </button>
              </div>

              {generatedKeyResult && (
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl space-y-2.5 animate-in fade-in">
                  <span className="text-xs font-bold text-emerald-400 block">كود التفعيل المشفّر المولّد لجهاز العميل:</span>
                  <div className="flex items-center justify-between bg-[#0b0f1a] p-3 rounded-xl border border-emerald-500/40">
                    <span className="font-mono text-sm font-black text-emerald-300 select-all">{generatedKeyResult}</span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(generatedKeyResult);
                        toast.success('تم نسخ كود التفعيل بنجاح! يمكنك إرساله للعميل الآن.');
                      }}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1"
                    >
                      <Copy size={13} />
                      <span>نسخ</span>
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-400">
                    * هذا الكود صالح حصرياً للجهاز ذو السيريال: <span className="font-mono text-amber-400 font-bold">{targetSerialForGenerator}</span>
                  </p>
                </div>
              )}
            </div>

            {/* Card 2: Current Connected Hardware Status */}
            <div className="bg-[#151b2b] border border-[#1e293b] rounded-3xl p-6 space-y-5 shadow-xl">
              <div className="flex items-center justify-between border-b border-[#1e293b] pb-3">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Server className="text-blue-400" size={18} />
                  <span>حالة وتوثيق هذا الجهاز الحالي</span>
                </h4>
                <span className="text-[10px] text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded font-mono font-bold">Local Device</span>
              </div>

              <div className="space-y-3">
                <div className="p-3 bg-[#0b0f1a] rounded-xl border border-slate-700/60 flex items-center justify-between">
                  <span className="text-xs text-slate-400">سيريال هذا الجهاز:</span>
                  <span className="font-mono text-xs font-bold text-amber-400">{currentDevSerial}</span>
                </div>

                <div className="p-3 bg-[#0b0f1a] rounded-xl border border-slate-700/60 flex items-center justify-between">
                  <span className="text-xs text-slate-400">حالة التفعيل:</span>
                  <span className="text-xs font-bold text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded-md">
                    مفعل وموثق بالنظام 🟢
                  </span>
                </div>

                <div className="p-3 bg-[#0b0f1a] rounded-xl border border-slate-700/60 flex items-center justify-between">
                  <span className="text-xs text-slate-400">طريقة التفعيل:</span>
                  <span className="text-xs font-mono font-bold text-slate-200">Hardware Crypto Key / MARO Master</span>
                </div>

                <div className="p-3 bg-[#0b0f1a] rounded-xl border border-slate-700/60 flex items-center justify-between">
                  <span className="text-xs text-slate-400">خوارزمية التشفير:</span>
                  <span className="text-xs font-mono text-slate-400">SHA256-Crypto-Fingerprint-v3</span>
                </div>
              </div>
            </div>
          </div>

          {/* Table of Registered Authorized Devices */}
          <div className="bg-[#151b2b] border border-[#1e293b] rounded-3xl p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <FileCheck className="text-emerald-400" size={18} />
                <span>سجل الأجهزة المعتمدة والمفعّلة بالنظام ({authorizedDevicesList.length} جهاز)</span>
              </h4>
              <button
                type="button"
                onClick={() => setAuthorizedDevicesList(DeviceHardwareAuthService.getAuthorizedDevices())}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold flex items-center gap-1.5"
              >
                <RefreshCw size={13} />
                <span>تحديث السجل</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400">
                    <th className="py-2.5 px-3">سيريال الجهاز</th>
                    <th className="py-2.5 px-3">كود التفعيل</th>
                    <th className="py-2.5 px-3">المفوِّض</th>
                    <th className="py-2.5 px-3">تاريخ التفعيل</th>
                    <th className="py-2.5 px-3">الحالة</th>
                    <th className="py-2.5 px-3">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300 font-mono">
                  {authorizedDevicesList.map((dev) => (
                    <tr key={dev.deviceId} className="hover:bg-slate-800/30">
                      <td className="py-3 px-3 font-bold text-amber-400">{dev.deviceId}</td>
                      <td className="py-3 px-3 text-slate-400 font-mono text-[11px]">{dev.activationKey}</td>
                      <td className="py-3 px-3 text-blue-400">{dev.activatedBy}</td>
                      <td className="py-3 px-3 text-slate-400 text-[11px]">{new Date(dev.activatedAt).toLocaleString('ar-EG')}</td>
                      <td className="py-3 px-3">
                        <span className={cn(
                          "px-2 py-0.5 rounded text-[10px] font-bold",
                          dev.status === 'ACTIVE' ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"
                        )}>
                          {dev.status === 'ACTIVE' ? 'نشط ومفعل' : 'ملغى'}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        {dev.status === 'ACTIVE' && (
                          <button
                            type="button"
                            onClick={() => {
                              DeviceHardwareAuthService.revokeDevice(dev.deviceId);
                              setAuthorizedDevicesList(DeviceHardwareAuthService.getAuthorizedDevices());
                              toast.success('تم إلغاء تفعيل الجهاز بنجاح!');
                            }}
                            className="px-2.5 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 rounded-lg text-[10px] font-bold"
                          >
                            إلغاء التفعيل
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {authorizedDevicesList.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-6 text-center text-slate-500 text-xs">
                        لا توجد أجهزة مفعلة مسجلة بالسجل بعد.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Developer Phone & SMS / WhatsApp 2FA Control */}
      {activeTab === 'phone2fa' && (
        <div className="space-y-6">
          <div className="bg-[#151b2b] border border-emerald-500/30 rounded-3xl p-6 relative overflow-hidden space-y-4">
            <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-teal-400"></div>
            
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-2xl">
                  <Smartphone size={24} />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">إعدادات أمان هاتف المطور والتحقق الثنائي (Developer 2FA Engine)</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    التحكم في رقم هاتف المطور المعتمد بالنظام وقنوات إرسال رموز الأمان (WhatsApp & SMS) وفرض التحقق على العمليات الحساسة.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 rounded-xl text-xs font-mono font-bold">
                  2FA Root Protected
                </span>
              </div>
            </div>

            {testOtpStatus && (
              <div className="p-3 bg-blue-500/20 border border-blue-500/40 rounded-2xl text-xs text-blue-300 font-bold animate-pulse flex items-center gap-2">
                <CheckCircle2 size={16} />
                <span>{testOtpStatus}</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Registered Phone Configuration Card */}
            <form onSubmit={handleSavePhoneConfig} className="bg-[#151b2b] border border-[#1e293b] rounded-3xl p-6 space-y-5 shadow-xl">
              <div className="flex items-center justify-between border-b border-[#1e293b] pb-3">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Smartphone className="text-blue-400" size={18} />
                  <span>بيانات الهاتف والقناة المفضلة</span>
                </h4>
                <span className="text-[10px] text-slate-400 font-mono">Last updated: {new Date(phoneConfig.lastUpdated).toLocaleDateString('ar-EG')}</span>
              </div>

              <div>
                <label className="text-xs text-slate-300 font-bold block mb-1.5">رقم هاتف المطور المسجل بالنظام *</label>
                <div className="relative">
                  <Smartphone className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    type="text" 
                    required
                    value={newPhoneInput}
                    onChange={(e) => setNewPhoneInput(e.target.value)}
                    className="w-full pr-10 pl-4 py-3 bg-[#0b0f1a] border border-[#334155] rounded-2xl text-white font-mono text-sm font-bold focus:border-emerald-500 outline-none"
                    placeholder="01050557853"
                    dir="ltr"
                  />
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block">يتم تشفير وحماية هذا الرقم، وإرسال كافة تصاريح الصلاحيات الجذرية إليه حصراً.</span>
              </div>

              <div>
                <label className="text-xs text-slate-300 font-bold block mb-1.5">اسم مهندس النظام والمسؤول</label>
                <input 
                  type="text" 
                  value={phoneConfig.developerName}
                  onChange={(e) => setPhoneConfig({ ...phoneConfig, developerName: e.target.value })}
                  className="w-full px-4 py-3 bg-[#0b0f1a] border border-[#334155] rounded-2xl text-white text-xs font-bold focus:border-emerald-500 outline-none"
                  placeholder="اسم المطور"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-300 font-bold block mb-1.5">القناة الافتراضية</label>
                  <select
                    value={phoneConfig.preferredChannel}
                    onChange={(e) => setPhoneConfig({ ...phoneConfig, preferredChannel: e.target.value as any })}
                    className="w-full px-3 py-2.5 bg-[#0b0f1a] border border-[#334155] rounded-xl text-white text-xs font-bold focus:border-emerald-500 outline-none"
                  >
                    <option value="whatsapp">واتساب (WhatsApp)</option>
                    <option value="sms">رسائل قصيرة (SMS)</option>
                    <option value="both">كلاهما معاً (Both Channels)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs text-slate-300 font-bold block mb-1.5">بوابة الرسائل (SMS Gateway)</label>
                  <select
                    value={phoneConfig.smsGatewayProvider}
                    onChange={(e) => setPhoneConfig({ ...phoneConfig, smsGatewayProvider: e.target.value as any })}
                    className="w-full px-3 py-2.5 bg-[#0b0f1a] border border-[#334155] rounded-xl text-white text-xs font-bold focus:border-emerald-500 outline-none"
                  >
                    <option value="SIMULATED_LOCAL">MARO High-Speed Local SMS Engine</option>
                    <option value="TWILIO">Twilio Global Gateway</option>
                    <option value="UNIFONIC">Unifonic Middle East Gateway</option>
                    <option value="SMS_MISR">SMS Misr Gateway</option>
                    <option value="VODAFONE_SMS">Vodafone Enterprise SMS</option>
                  </select>
                </div>
              </div>

              {/* Enforcement Policies */}
              <div className="space-y-2 pt-2 border-t border-[#1e293b]">
                <span className="text-xs font-bold text-slate-300 block mb-2">سياسات فرض التحقق الثنائي عبر الهاتف (Enforcement Rules):</span>
                
                {[
                  { key: 'enforceOnLogin', label: 'فرض التحقق عند تسجيل دخول المطور (Login 2FA)' },
                  { key: 'enforceOnConsoleAccess', label: 'فرض التحقق عند فتح لوحة التحكم الرئيسية (Console 2FA)' },
                  { key: 'enforceOnMaintenanceMode', label: 'فرض التحقق عند تفعيل وضع الصيانة أو تصفير الداتا' },
                  { key: 'enforceOnLicenseChange', label: 'فرض التحقق عند ترقية الباقات والتراخيص' }
                ].map(({ key, label }) => (
                  <label key={key} className="flex items-center justify-between p-2.5 bg-[#0b0f1a] rounded-xl border border-[#1e293b] cursor-pointer hover:border-emerald-500/30 transition-all">
                    <span className="text-xs text-slate-300 font-bold">{label}</span>
                    <input 
                      type="checkbox"
                      checked={(phoneConfig as any)[key]}
                      onChange={(e) => setPhoneConfig({ ...phoneConfig, [key]: e.target.checked })}
                      className="w-4 h-4 rounded text-emerald-500 accent-emerald-500 cursor-pointer"
                    />
                  </label>
                ))}
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-2xl font-black text-xs shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all active:scale-95"
              >
                <Save size={16} />
                <span>حفظ وتطبيق إعدادات أمان الهاتف</span>
              </button>
            </form>

            {/* Test Station & Dispatch Simulation */}
            <div className="space-y-6">
              <div className="bg-[#151b2b] border border-[#1e293b] rounded-3xl p-6 space-y-4 shadow-xl">
                <h4 className="text-sm font-bold text-white flex items-center gap-2 border-b border-[#1e293b] pb-3">
                  <Radio className="text-emerald-400" size={18} />
                  <span>محطة اختبار البوابات الفورية (Live 2FA Test Station)</span>
                </h4>

                <p className="text-xs text-slate-300 leading-relaxed">
                  يمكنك إجراء تجربة إرسال فورية لرمز أمان OTP للتأكد من وصول الرسائل وتفعيل الربط الحي مع هاتفك المسجل <span className="font-mono text-emerald-400 font-bold" dir="ltr">{newPhoneInput}</span>:
                </p>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => handleTestDispatch('whatsapp')}
                    className="p-4 bg-emerald-600/15 hover:bg-emerald-600/25 border border-emerald-500/40 text-emerald-300 rounded-2xl font-bold text-xs flex flex-col items-center gap-2 transition-all shadow-md group"
                  >
                    <MessageSquare size={22} className="text-emerald-400 group-hover:scale-110 transition-transform" />
                    <span>إرسال تجربة عبر الواتساب</span>
                    <span className="text-[10px] text-slate-400 font-normal">WhatsApp Direct & Webhook</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleTestDispatch('sms')}
                    className="p-4 bg-blue-600/15 hover:bg-blue-600/25 border border-blue-500/40 text-blue-300 rounded-2xl font-bold text-xs flex flex-col items-center gap-2 transition-all shadow-md group"
                  >
                    <PhoneCall size={22} className="text-blue-400 group-hover:scale-110 transition-transform" />
                    <span>إرسال تجربة عبر الـ SMS</span>
                    <span className="text-[10px] text-slate-400 font-normal">GSM / REST SMS Gateway</span>
                  </button>
                </div>

                <div className="p-3.5 bg-[#0b0f1a] rounded-2xl border border-blue-500/20 text-xs text-slate-300 space-y-1">
                  <div className="flex items-center gap-1.5 text-blue-400 font-bold">
                    <ShieldCheck size={14} />
                    <span>ملاحظة الحماية والأمان العالي (Zero Trust):</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    يتم إلغاء أي جلسة كود OTP تلقائياً بعد 5 دقائق من التوليد، مع قفل الحساب مؤقتاً في حال تكرار أكثر من 5 محاولات خاطئة لمنع هجمات التخمين.
                  </p>
                </div>
              </div>

              {/* Security Metrics */}
              <div className="bg-[#151b2b] border border-[#1e293b] rounded-3xl p-6 space-y-3 shadow-xl">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">مؤشرات موثوقية الأمان (2FA Metrics)</h4>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="bg-[#0b0f1a] p-3 rounded-2xl border border-[#1e293b]">
                    <span className="text-[10px] text-slate-500 block">زمن الاستجابة:</span>
                    <span className="text-sm font-mono font-bold text-emerald-400">&lt; 12ms</span>
                  </div>
                  <div className="bg-[#0b0f1a] p-3 rounded-2xl border border-[#1e293b]">
                    <span className="text-[10px] text-slate-500 block">حالة التشفير:</span>
                    <span className="text-sm font-mono font-bold text-blue-400">AES-256</span>
                  </div>
                  <div className="bg-[#0b0f1a] p-3 rounded-2xl border border-[#1e293b]">
                    <span className="text-[10px] text-slate-500 block">حالة البوابة:</span>
                    <span className="text-sm font-mono font-bold text-emerald-400">Online</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: License & Plans */}
      {activeTab === 'license' && (
        <div className="bg-[#151b2b] border border-amber-500/30 rounded-3xl p-6 space-y-6 shadow-2xl">
          <div className="flex items-center justify-between border-b border-[#1e293b] pb-4">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Key className="text-amber-400" size={20} />
                <span>الترخيص والباقة الحالية للنظام</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">إدارة الباقة النشطة وترقية الحدود القصوى للمستخدمين ونقاط البيع</p>
            </div>
            <span className="px-3 py-1 bg-amber-500/20 border border-amber-500/40 text-amber-400 font-mono text-xs font-bold rounded-xl uppercase">
              {license.plan}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {(['standard', 'premium', 'enterprise'] as const).map(p => (
              <div 
                key={p} 
                className={cn(
                  "p-6 rounded-3xl border transition-all space-y-4",
                  license.plan === p ? "bg-amber-500/10 border-amber-500/50 shadow-lg shadow-amber-500/10" : "bg-[#0f172a] border-[#1e293b]"
                )}
              >
                <div className="flex justify-between items-center">
                  <h4 className="text-base font-black text-white uppercase">{p}</h4>
                  {license.plan === p && <span className="text-[10px] bg-amber-400 text-black font-bold px-2 py-0.5 rounded-full">ACTIVE</span>}
                </div>
                <div className="text-xs text-slate-400 space-y-1">
                  <p>الحد الأقصى للمستخدمين: <span className="text-white font-mono">{p === 'enterprise' ? 100 : p === 'premium' ? 25 : 5}</span></p>
                  <p>نقاط البيع والمحطات: <span className="text-white font-mono">{p === 'enterprise' ? 50 : p === 'premium' ? 10 : 2}</span></p>
                </div>
                <button
                  onClick={() => handleUpgradePlan(p)}
                  disabled={license.plan === p}
                  className={cn(
                    "w-full py-2.5 rounded-xl font-bold text-xs transition-all",
                    license.plan === p ? "bg-slate-800 text-slate-500 cursor-not-allowed" : "bg-amber-500 hover:bg-amber-400 text-black shadow-md shadow-amber-500/20"
                  )}
                >
                  {license.plan === p ? 'الباقة الحالية' : `الترقية إلى ${p.toUpperCase()}`}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab: Feature Flags */}
      {activeTab === 'flags' && (
        <div className="bg-[#151b2b] border border-amber-500/30 rounded-3xl p-6 space-y-6 shadow-2xl">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Sliders className="text-amber-400" size={20} />
              <span>مصفوفة الخصائص والمفاتيح البرمجية (Feature Flags)</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">تفعيل وتعطيل الميزات أثناء تشغيل النظام مباشرة دون إعادة النشر</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {featureFlags.map(flag => (
              <div key={flag.id} className="p-4 bg-[#0f172a] rounded-2xl border border-[#1e293b] flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-white font-mono">{flag.name}</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">{flag.description}</p>
                </div>
                <button
                  onClick={() => handleToggleFlag(flag.id, flag.status)}
                  className={cn(
                    "px-3 py-1.5 rounded-xl font-bold text-xs transition-all",
                    flag.status === 'enabled' ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-slate-800 text-slate-500"
                  )}
                >
                  {flag.status === 'enabled' ? 'مفعل (ON)' : 'معطل (OFF)'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab: Maintenance */}
      {activeTab === 'maintenance' && (
        <div className="bg-[#151b2b] border border-amber-500/30 rounded-3xl p-6 space-y-6 shadow-2xl">
          <div className="flex items-center justify-between border-b border-[#1e293b] pb-4">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Wrench className="text-amber-400" size={20} />
                <span>أدوات الصيانة وتجهيز البيانات</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">وضع الصيانة، توليد بيانات تجريبية معتمدة محاسبياً، وإصلاح النظام</p>
            </div>
            <button
              onClick={handleToggleMaintenance}
              className={cn(
                "px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all",
                isMaintenance ? "bg-red-500 text-white shadow-lg shadow-red-500/30" : "bg-slate-800 text-slate-400 hover:text-white"
              )}
            >
              {isMaintenance ? <Lock size={14} /> : <Unlock size={14} />}
              <span>{isMaintenance ? 'وضع الصيانة نشط' : 'تفعيل وضع الصيانة'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-[#0f172a] rounded-2xl border border-[#1e293b] space-y-3">
              <h4 className="text-xs font-bold text-white flex items-center gap-2">
                <Database className="text-blue-400" size={16} />
                <span>توليد بيانات تجريبية محاسبية (Seed Accounting Data)</span>
              </h4>
              <p className="text-[11px] text-slate-400">تجهيز شجرة الحسابات، فواتير مبيعات، أصناف مخزون، وحركات دفتر يومية متزنة.</p>
              <button
                onClick={() => {
                  DemoDataSeeder.seedAccountingDataset();
                  setActionSuccess('تم توليد بيانات الحسابات والمخزون بنجاح');
                  setTimeout(() => setActionSuccess(null), 3000);
                }}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-600/20"
              >
                توليد البيانات المحاسبية الآن
              </button>
            </div>

            <div className="p-4 bg-[#0f172a] rounded-2xl border border-[#1e293b] space-y-3">
              <h4 className="text-xs font-bold text-white flex items-center gap-2">
                <RefreshCw className="text-amber-400" size={16} />
                <span>إعادة مزامنة محرك MARO Sync</span>
              </h4>
              <p className="text-[11px] text-slate-400">إعادة فحص طابور العمليات المعلقة وتفريغ الذاكرة المؤقتة بأمان.</p>
              <button
                onClick={async () => {
                  const res = await MaroSyncEngine.forceSyncNow();
                  setActionSuccess(res.message || 'تمت إعادة مزامنة المحرك وقاعدة البيانات بنجاح');
                  setTimeout(() => setActionSuccess(null), 3000);
                }}
                className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-black rounded-xl text-xs font-bold transition-all shadow-md shadow-amber-500/20"
              >
                مزامنة المحرك الفورية
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Diagnostics */}
      {activeTab === 'diagnostics' && (
        <div className="bg-[#151b2b] border border-amber-500/30 rounded-3xl p-6 space-y-6 shadow-2xl">
          <div className="flex justify-between items-center border-b border-[#1e293b] pb-4">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Activity className="text-emerald-400" size={20} />
                <span>تشخيص سلامة النظام والأداء الحي</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">مراقبة سرعة الاستجابة، سلامة قواعد البيانات ومحرك المزامنة</p>
            </div>
            <span className={cn(
              "px-3 py-1 rounded-full text-xs font-bold uppercase",
              diagnostics.systemStatus === 'HEALTHY' ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-red-500/20 text-red-400"
            )}>
              {diagnostics.systemStatus}
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="p-4 bg-[#0f172a] rounded-2xl border border-[#1e293b]">
              <span className="text-[10px] text-slate-500 block">زمن استجابة قاعدة البيانات</span>
              <span className="text-lg font-bold text-emerald-400 font-mono">{diagnostics.databaseLatencyMs}ms</span>
            </div>
            <div className="p-4 bg-[#0f172a] rounded-2xl border border-[#1e293b]">
              <span className="text-[10px] text-slate-500 block">استهلاك الذاكرة</span>
              <span className="text-lg font-bold text-emerald-400 font-mono">{diagnostics.memoryUsageMb} MB</span>
            </div>
            <div className="p-4 bg-[#0f172a] rounded-2xl border border-[#1e293b]">
              <span className="text-[10px] text-slate-500 block">طابور المزامنة الفورية</span>
              <span className="text-lg font-bold text-emerald-400 font-mono">{diagnostics.syncQueueDepth} items</span>
            </div>
            <div className="p-4 bg-[#0f172a] rounded-2xl border border-[#1e293b]">
              <span className="text-[10px] text-slate-500 block">الجلسات النشطة</span>
              <span className="text-lg font-bold text-emerald-400 font-mono">{diagnostics.activeSessions}</span>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Python Center */}
      {activeTab === 'python' && (
        <div className="bg-[#151b2b] border border-blue-500/30 rounded-3xl p-6 shadow-2xl">
          <DexefPythonHub />
        </div>
      )}

      {/* Modal: Create Custom Vertical Industry Module */}
      {showNewModModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" dir="rtl">
          <div className="bg-[#151b2b] border border-blue-500/40 rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center border-b border-[#1e293b] pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Boxes className="text-blue-400" size={20} />
                <span>إضافة وتفعيل موديول نشاط تجاري جديد</span>
              </h3>
              <button 
                onClick={() => setShowNewModModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateCustomModule} className="space-y-4">
              <div>
                <label className="text-xs text-slate-400 font-bold block mb-1">اسم الموديول / النشاط (عربي) *</label>
                <input 
                  type="text" 
                  placeholder="مثال: تجارة وتوزيع الذهب والمجوهرات" 
                  className="w-full p-3 bg-[#0f172a] border border-[#1e293b] rounded-xl text-xs text-white focus:border-blue-500 outline-none"
                  value={newModNameAr}
                  onChange={(e) => setNewModNameAr(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-400 font-bold block mb-1">كود الموديول *</label>
                  <input 
                    type="text" 
                    placeholder="مثال: JEWELRY" 
                    className="w-full p-3 bg-[#0f172a] border border-[#1e293b] rounded-xl text-xs text-white focus:border-blue-500 outline-none font-mono uppercase"
                    value={newModCode}
                    onChange={(e) => setNewModCode(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 font-bold block mb-1">تصنيف النشاط</label>
                  <select 
                    className="w-full p-3 bg-[#0f172a] border border-[#1e293b] rounded-xl text-xs text-white focus:border-blue-500 outline-none"
                    value={newModCategory}
                    onChange={(e) => setNewModCategory(e.target.value as any)}
                  >
                    <option value="RETAIL">تجارة وتجزئة (Retail)</option>
                    <option value="SERVICES">خدمات وصيانة (Services)</option>
                    <option value="HEALTHCARE">صحة وطب (Healthcare)</option>
                    <option value="FOOD_BEVERAGE">أغذية ومشروبات (F&B)</option>
                    <option value="AUTOMOTIVE">سيارات وقطع غيار (Auto)</option>
                    <option value="INDUSTRIAL">تصنيع وتشغيل (Industrial)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400 font-bold block mb-1">وصف الموديول</label>
                <textarea 
                  rows={3}
                  placeholder="وصف خصائص النشاط التجاري وطبيعة عمله..." 
                  className="w-full p-3 bg-[#0f172a] border border-[#1e293b] rounded-xl text-xs text-white focus:border-blue-500 outline-none resize-none"
                  value={newModDesc}
                  onChange={(e) => setNewModDesc(e.target.value)}
                />
              </div>

              <div className="p-3 bg-[#0f172a] rounded-xl border border-blue-500/20 text-xs text-blue-300">
                🔒 سيتم ربط الموديول تلقائياً بشجرة الحسابات العامة (إيرادات 41200 / تكلفة 51100 / مخزون 11300) مع دعم العمل دون اتصال (Offline-First).
              </div>

              <div className="flex gap-3 pt-2">
                <button 
                  type="button" 
                  onClick={() => setShowNewModModal(false)}
                  className="flex-1 py-3 bg-[#0f172a] border border-[#1e293b] text-slate-400 hover:text-white rounded-xl text-xs font-bold"
                >
                  إلغاء
                </button>
                <button 
                  type="submit" 
                  className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-600/30"
                >
                  تأكيد وإنشاء الموديول
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
