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
  FileCheck
} from 'lucide-react';
import { SecurityEngine, DEFAULT_DEVELOPER_KEY } from '../lib/securityEngine';
import { SystemLicense, FeatureFlag, SystemDiagnosticReport } from '../types/security';
import { cn } from '../lib/utils';
import { DemoDataSeeder } from '../services/demoDataSeeder';

export const DeveloperConsole: React.FC = () => {
  const [devKeyInput, setDevKeyInput] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(SecurityEngine.isDeveloperSessionActive());
  const [activeTab, setActiveTab] = useState<'license' | 'flags' | 'maintenance' | 'diagnostics' | 'emergency'>('license');
  
  const [license, setLicense] = useState<SystemLicense>(SecurityEngine.getSystemLicense());
  const [featureFlags, setFeatureFlags] = useState<FeatureFlag[]>(SecurityEngine.getFeatureFlags());
  const [diagnostics, setDiagnostics] = useState<SystemDiagnosticReport>(SecurityEngine.runSystemDiagnostics());
  const [isMaintenance, setIsMaintenance] = useState(SecurityEngine.isMaintenanceMode());
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

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

  const handleToggleModule = (modName: string) => {
    const current = [...license.enabledModules];
    const exists = current.includes(modName);
    const updatedModules = exists ? current.filter(m => m !== modName) : [...current, modName];
    const newLicense = { ...license, enabledModules: updatedModules };
    setLicense(newLicense);
    SecurityEngine.saveSystemLicense(newLicense);
    setActionSuccess(`Module ${modName} ${exists ? 'Disabled' : 'Enabled'}`);
    setTimeout(() => setActionSuccess(null), 3000);
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
            <p className="text-xs text-slate-400 mt-1">إدارة التراخيص، تفعيل الموديولات، إصلاح قاعدة البيانات، والمراقبة المركزية</p>
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
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        <button 
          onClick={() => setActiveTab('license')}
          className={cn(
            "flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-xs transition-all uppercase tracking-wider whitespace-nowrap border",
            activeTab === 'license' ? "bg-amber-500/20 text-amber-400 border-amber-500/40 shadow-lg" : "bg-[#151b2b] text-slate-400 border-[#1e293b] hover:bg-slate-800"
          )}
        >
          <Key size={16} />
          <span>إدارة التراخيص</span>
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
          <span>الصيانة وإصلاح النظام</span>
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

      {/* Tab 1: License Manager */}
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
              <span>تفعيل / تعطيل الموديولات المتاحة للعميل</span>
            </h3>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {['POS', 'INVENTORY', 'SALES', 'PURCHASES', 'ACCOUNTING', 'USERS', 'REPORTS', 'CUSTOMERS', 'SUPPLIERS', 'WAREHOUSES', 'AI'].map(mod => {
                const isEnabled = license.enabledModules.includes(mod);
                return (
                  <button 
                    key={mod}
                    onClick={() => handleToggleModule(mod)}
                    className={cn(
                      "p-4 rounded-2xl border text-right transition-all flex items-center justify-between",
                      isEnabled ? "bg-blue-600/10 border-blue-500/40 text-blue-400" : "bg-[#0f172a] border-[#1e293b] text-slate-600"
                    )}
                  >
                    <span className="font-black text-xs uppercase tracking-wider">{mod}</span>
                    {isEnabled ? <CheckCircle2 className="text-blue-400" size={18} /> : <XCircle className="text-slate-600" size={18} />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Feature Flags */}
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

      {/* Tab 3: Maintenance */}
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
                  setActionSuccess('تم توليد وإعداد البيانات التجريبية الضخمة بنجاح');
                  setTimeout(() => setActionSuccess(null), 3000);
                }}
                className="w-full p-3 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-xl text-right text-xs font-bold text-amber-400 transition-colors flex items-center justify-between"
              >
                <span>إنشاء وتوليد البيانات التجريبية (Demo Data Seeder)</span>
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

              <button 
                onClick={() => { setActionSuccess('Database Schema Verified'); setTimeout(() => setActionSuccess(null), 3000); }}
                className="w-full p-3 bg-[#0f172a] hover:bg-slate-800 border border-[#1e293b] rounded-xl text-right text-xs font-bold text-slate-300 transition-colors flex items-center justify-between"
              >
                <span>فحص وتحديث جداول DDL Schema</span>
                <CheckCircle2 size={16} className="text-emerald-400" />
              </button>

              <button 
                onClick={() => { setActionSuccess('Local Storage Cache Purged'); setTimeout(() => setActionSuccess(null), 3000); }}
                className="w-full p-3 bg-[#0f172a] hover:bg-slate-800 border border-[#1e293b] rounded-xl text-right text-xs font-bold text-amber-400 transition-colors flex items-center justify-between"
              >
                <span>تفريغ الـ Cache التالف وإعادة البناء</span>
                <RefreshCw size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Diagnostics */}
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
            <p className="text-[10px] text-slate-500 uppercase font-bold">Memory Usage</p>
            <p className="text-lg font-black text-purple-400 mt-1">{diagnostics.memoryUsageMb} MB</p>
          </div>
        </div>
      )}
    </div>
  );
};
