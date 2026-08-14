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
  Sparkles
} from 'lucide-react';
import { SecurityEngine, DEFAULT_DEVELOPER_KEY } from '../lib/securityEngine';
import { SystemLicense, FeatureFlag, SystemDiagnosticReport } from '../types/security';
import { IndustryModuleEngine } from '../lib/industryModuleEngine';
import { IndustryModule } from '../types/industryModules';
import { cn } from '../lib/utils';
import { DemoDataSeeder } from '../services/demoDataSeeder';

export const DeveloperConsole: React.FC = () => {
  const [devKeyInput, setDevKeyInput] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(SecurityEngine.isDeveloperSessionActive());
  const [activeTab, setActiveTab] = useState<'industries' | 'license' | 'flags' | 'maintenance' | 'diagnostics'>('industries');
  
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

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (SecurityEngine.authenticateDeveloper(devKeyInput)) {
      setIsAuthenticated(true);
      setActionSuccess('Developer Master Authenticated');
      setTimeout(() => setActionSuccess(null), 3000);
    } else {
      alert('مفتاح المطور غير صحيح!');
    }
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
        <div className="bg-[#151b2b] border border-red-500/30 rounded-3xl p-8 max-w-md w-full shadow-2xl relative overflow-hidden text-center space-y-6">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-600 via-amber-500 to-red-600"></div>
          
          <div className="w-16 h-16 bg-red-500/10 border border-red-500/30 text-red-500 rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-red-500/10">
            <ShieldAlert size={32} />
          </div>

          <div>
            <h2 className="text-xl font-black text-white tracking-tight">MARO SYSTEM OWNER CONSOLE</h2>
            <p className="text-xs text-slate-400 mt-1">المستوى الأول — لوحة التحكم الحصرية لمهندس النظام (Developer Layer 1)</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="relative">
              <Key className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input 
                type="password" 
                placeholder="أدخل مفتاح المطور Master Key..." 
                className="w-full pr-10 pl-4 py-3 bg-[#1e293b] border border-[#334155] rounded-2xl text-white focus:border-red-500 text-center font-mono text-sm outline-none"
                value={devKeyInput}
                onChange={(e) => setDevKeyInput(e.target.value)}
              />
            </div>
            <p className="text-[10px] text-slate-500">مفتاح التطوير الافتراضي: <code className="text-amber-400 font-mono">{DEFAULT_DEVELOPER_KEY}</code></p>

            <button 
              type="submit"
              className="w-full py-3.5 bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-red-600/20 active:scale-95"
            >
              التحقق وفتح لوحة المطور
            </button>
          </form>
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
            </div>
            <p className="text-xs text-slate-400 mt-1">تنشيط وإضافة موديولات الأنشطة التجارية، إدارة التراخيص، وإصلاح النظام والمحاسبة العامة</p>
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
                      <span className="text-[10px] text-slate-400 font-bold bg-slate-800 px-2 py-0.5 rounded">
                        v{mod.version}
                      </span>
                    </div>
                    <h4 className="text-base font-bold text-white mt-2">{mod.nameAr}</h4>
                    <p className="text-xs text-slate-400 mt-1">{mod.descriptionAr}</p>
                  </div>

                  <button 
                    onClick={() => handleToggleIndustryModule(mod.id)}
                    className={cn(
                      "px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-md",
                      mod.isActive 
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-red-500/20 hover:text-red-300 hover:border-red-500/40" 
                        : "bg-slate-800 text-slate-400 border border-slate-700 hover:bg-emerald-500/20 hover:text-emerald-300"
                    )}
                  >
                    {mod.isActive ? <CheckCircle2 size={14} /> : <Unlock size={14} />}
                    <span>{mod.isActive ? 'نشط (إلغاء التنشيط)' : 'معطل (تنشيط الآن)'}</span>
                  </button>
                </div>

                {/* Custom Fields List */}
                <div className="pt-3 border-t border-[#1e293b] space-y-1.5 text-xs">
                  <p className="text-[10px] text-slate-500 uppercase font-bold">الحقول والخصائص المخصصة للأصناف:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {mod.customProductFields.map(f => (
                      <span key={f.id} className="px-2 py-0.5 bg-[#0f172a] border border-[#1e293b] rounded text-[11px] text-slate-300">
                        {f.nameAr} ({f.type})
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-2 border-t border-[#1e293b] flex items-center justify-between text-[11px] text-slate-500">
                  <span>ربط الحسابات: إيرادات ({mod.accountingMapping.salesRevenueAccount}) / تكلفة ({mod.accountingMapping.cogsAccount})</span>
                  <span className="text-emerald-400 font-bold">{mod.specializedReports.length} تقارير متخصصة</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab: License Manager */}
      {activeTab === 'license' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1 bg-[#151b2b] border border-[#1e293b] rounded-3xl p-6 space-y-6">
            <h3 className="font-bold text-white text-sm uppercase tracking-wider flex items-center gap-2">
              <Key className="text-amber-400" size={18} />
              <span>ترخيص العميل الحالي</span>
            </h3>

            <div className="space-y-3 font-mono text-xs">
              <div className="p-3 bg-[#0f172a] rounded-xl border border-[#1e293b]">
                <p className="text-slate-500 text-[10px] uppercase">License Key</p>
                <p className="text-amber-400 font-bold mt-0.5">{license.licenseKey}</p>
              </div>

              <div className="p-3 bg-[#0f172a] rounded-xl border border-[#1e293b]">
                <p className="text-slate-500 text-[10px] uppercase">Company</p>
                <p className="text-white font-bold mt-0.5">{license.companyName}</p>
              </div>

              <div className="p-3 bg-[#0f172a] rounded-xl border border-[#1e293b]">
                <p className="text-slate-500 text-[10px] uppercase">Current Plan</p>
                <p className="text-emerald-400 font-black uppercase mt-0.5">{license.plan}</p>
              </div>

              <div className="p-3 bg-[#0f172a] rounded-xl border border-[#1e293b]">
                <p className="text-slate-500 text-[10px] uppercase">Limits</p>
                <p className="text-slate-300 font-bold mt-0.5">{license.maxUsers} Users / {license.maxTerminals} POS Terminals</p>
              </div>
            </div>

            <div>
              <p className="text-[10px] text-slate-500 font-bold uppercase mb-2">ترقية الباقة مباشرة</p>
              <div className="grid grid-cols-3 gap-2">
                {(['standard', 'premium', 'enterprise'] as const).map(plan => (
                  <button 
                    key={plan}
                    onClick={() => handleUpgradePlan(plan)}
                    className={cn(
                      "py-2 px-2 rounded-xl border text-[10px] font-bold uppercase transition-all",
                      license.plan === plan ? "bg-amber-500/20 border-amber-500/50 text-amber-400" : "bg-[#1e293b] border-[#334155] text-slate-400 hover:text-white"
                    )}
                  >
                    {plan}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="md:col-span-2 bg-[#151b2b] border border-[#1e293b] rounded-3xl p-6 space-y-6">
            <h3 className="font-bold text-white text-sm uppercase tracking-wider flex items-center gap-2">
              <Layers className="text-blue-400" size={18} />
              <span>الكور المحاسبي والخدمات الأساسية للمنظومة</span>
            </h3>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {['ACCOUNTING', 'POS', 'INVENTORY', 'SALES', 'PURCHASES', 'USERS', 'REPORTS', 'CUSTOMERS', 'SUPPLIERS', 'WAREHOUSES', 'AI'].map(mod => {
                const isEnabled = license.enabledModules.includes(mod);
                return (
                  <div 
                    key={mod}
                    className="p-4 rounded-2xl border text-right bg-blue-600/10 border-blue-500/40 text-blue-400 flex items-center justify-between"
                  >
                    <span className="font-black text-xs uppercase tracking-wider">{mod}</span>
                    <CheckCircle2 className="text-blue-400" size={18} />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Tab: Feature Flags */}
      {activeTab === 'flags' && (
        <div className="bg-[#151b2b] border border-[#1e293b] rounded-3xl p-6 space-y-6">
          <h3 className="font-bold text-white text-sm uppercase tracking-wider flex items-center gap-2">
            <Sliders className="text-amber-400" size={18} />
            <span>مصفوفة الخصائص الدقيقة (Feature Flags Matrix)</span>
          </h3>

          <div className="space-y-3">
            {featureFlags.map(flag => (
              <div key={flag.id} className="p-4 bg-[#0f172a] border border-[#1e293b] rounded-2xl flex items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-white text-sm">{flag.name}</p>
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-mono text-[10px] uppercase border border-slate-700">{flag.module}</span>
                    <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 font-mono text-[10px] uppercase border border-amber-500/20">{flag.requiresPlan}</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">{flag.description}</p>
                </div>

                <button 
                  onClick={() => handleToggleFlag(flag.id, flag.status)}
                  className={cn(
                    "px-4 py-2 rounded-xl border text-xs font-bold uppercase transition-all flex items-center gap-2",
                    flag.status === 'enabled' ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-400" : "bg-red-500/20 border-red-500/40 text-red-400"
                  )}
                >
                  {flag.status === 'enabled' ? <Unlock size={14} /> : <Lock size={14} />}
                  <span>{flag.status}</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab: Maintenance */}
      {activeTab === 'maintenance' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-[#151b2b] border border-[#1e293b] rounded-3xl p-6 space-y-6">
            <h3 className="font-bold text-white text-sm uppercase tracking-wider flex items-center gap-2">
              <Wrench className="text-amber-400" size={18} />
              <span>وضع الصيانة وإغلاق النظام</span>
            </h3>

            <p className="text-xs text-slate-400">
              تفعيل وضع الصيانة يمنع جميع المستخدمين العاديين من إجراء أي عمليات بيع أو تعديل بيانات أثناء إجراء الصيانة.
            </p>

            <button 
              onClick={handleToggleMaintenance}
              className={cn(
                "w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg border flex items-center justify-center gap-2",
                isMaintenance ? "bg-red-600 border-red-500 text-white" : "bg-emerald-600 border-emerald-500 text-white"
              )}
            >
              {isMaintenance ? <Lock size={18} /> : <Unlock size={18} />}
              <span>{isMaintenance ? 'تعطيل وضع الصيانة (فتح النظام)' : 'تفعيل وضع الصيانة الطارئة'}</span>
            </button>
          </div>

          <div className="bg-[#151b2b] border border-[#1e293b] rounded-3xl p-6 space-y-6">
            <h3 className="font-bold text-white text-sm uppercase tracking-wider flex items-center gap-2">
              <Database className="text-blue-400" size={18} />
              <span>أدوات قاعدة البيانات والبيانات التجريبية (Demo Data)</span>
            </h3>

            <div className="space-y-3">
              <button 
                onClick={async () => {
                  await DemoDataSeeder.generateDemoData();
                  setActionSuccess('تم توليد وإعداد البيانات التجريبية بنجاح');
                  setTimeout(() => setActionSuccess(null), 3000);
                }}
                className="w-full p-3 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-xl text-right text-xs font-bold text-amber-400 transition-colors flex items-center justify-between"
              >
                <span>إنشاء وتوليد البيانات التجريبية لكافة الأنشطة (Demo Data)</span>
                <CheckCircle2 size={16} />
              </button>

              <button 
                onClick={() => {
                  if (confirm('هل أنت متأكد من رغبتك في إعادة ضبط وحذف جميع بيانات النظام؟')) {
                    DemoDataSeeder.resetDemoData();
                  }
                }}
                className="w-full p-3 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-xl text-right text-xs font-bold text-red-400 transition-colors flex items-center justify-between"
              >
                <span>إعادة ضبط وحذف البيانات (Reset Demo Data)</span>
                <RefreshCw size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Diagnostics */}
      {activeTab === 'diagnostics' && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-[#151b2b] border border-[#1e293b] rounded-2xl p-4">
            <p className="text-[10px] text-slate-500 uppercase font-bold">System Status</p>
            <p className="text-lg font-black text-emerald-400 mt-1">{diagnostics.systemStatus}</p>
          </div>

          <div className="bg-[#151b2b] border border-[#1e293b] rounded-2xl p-4">
            <p className="text-[10px] text-slate-500 uppercase font-bold">DB Latency</p>
            <p className="text-lg font-black text-blue-400 mt-1">{diagnostics.databaseLatencyMs} ms</p>
          </div>

          <div className="bg-[#151b2b] border border-[#1e293b] rounded-2xl p-4">
            <p className="text-[10px] text-slate-500 uppercase font-bold">Sync Queue Depth</p>
            <p className="text-lg font-black text-amber-400 mt-1">{diagnostics.syncQueueDepth} items</p>
          </div>

          <div className="bg-[#151b2b] border border-[#1e293b] rounded-2xl p-4">
            <p className="text-[10px] text-slate-500 uppercase font-bold">Active Commercial Modules</p>
            <p className="text-lg font-black text-purple-400 mt-1">{industryModules.filter(m => m.isActive).length} Modules</p>
          </div>
        </div>
      )}

      {/* Modal: New Custom Vertical Module */}
      {showNewModModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#151b2b] border border-blue-500/40 rounded-3xl max-w-lg w-full p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-[#1e293b] pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-500/10 text-blue-400 rounded-xl">
                  <Plus size={22} />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">إضافة موديول نشاط تجاري جديد</h3>
                  <p className="text-xs text-slate-400">توسيع النظام بإضافة نشاط تجاري دون المساس بالمحاسبة العامة</p>
                </div>
              </div>
              <button onClick={() => setShowNewModModal(false)} className="text-slate-500 hover:text-white font-bold text-xl">✕</button>
            </div>

            <form onSubmit={handleCreateCustomModule} className="space-y-4">
              <div>
                <label className="text-xs text-slate-400 font-bold block mb-1">اسم الموديول بالعربية *</label>
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
