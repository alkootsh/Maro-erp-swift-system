import React, { useState } from 'react';
import { 
  Building2, 
  Settings as SettingsIcon, 
  Shield, 
  User, 
  Keyboard, 
  Save,
  Boxes,
  Briefcase,
  Wallet,
  CheckCircle2,
  AlertTriangle,
  PlayCircle,
  Database,
  Layers,
  Store,
  Factory,
  Utensils,
  Stethoscope,
  Activity
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuth } from '../components/AuthProvider';

export const Settings: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'tenant' | 'industry' | 'finance' | 'modules'>('tenant');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

  // Core Configuration States
  const [tenantConfig, setTenantConfig] = useState({
    companyName: 'MARO Global Trading',
    taxNumber: '300123456789003',
    registrationNumber: '1010123456',
    baseCurrency: 'SAR',
    taxRate: 15,
  });

  const [selectedIndustry, setSelectedIndustry] = useState<string>('retail');
  const [coaStatus, setCoaStatus] = useState<'pending' | 'generating' | 'ready'>('pending');

  const industries = [
    { id: 'retail', name: 'تجزئة (Retail)', icon: Store, desc: 'نقاط بيع، مخزون، باركود، وعروض ترويجية.' },
    { id: 'wholesale', name: 'جملة وتوزيع (Wholesale)', icon: Briefcase, desc: 'مخازن متعددة، تسعير شرائح، مناديب، وسيارات.' },
    { id: 'restaurant', name: 'مطاعم وكافيهات (F&B)', icon: Utensils, desc: 'طاولات، مطبخ، وصفات (Recipes)، وورديات.' },
    { id: 'manufacturing', name: 'تصنيع (Manufacturing)', icon: Factory, desc: 'BOM، أوامر إنتاج، هدر، وتكاليف.' },
    { id: 'medical', name: 'طبي (Medical)', icon: Stethoscope, desc: 'مواعيد، مرضى، تأمين، وسجلات طبية.' },
    { id: 'services', name: 'خدمات وصيانة (Services)', icon: SettingsIcon, desc: 'مشاريع، عقود، تذاكر دعم، وحجوزات.' }
  ];

  const modules = [
    { id: 'crm', name: 'إدارة علاقات العملاء (CRM)', category: 'P1', enabled: true },
    { id: 'workflow', name: 'محرك سير العمل (Workflow Engine)', category: 'P1', enabled: true },
    { id: 'manufacturing', name: 'التصنيع والإنتاج (MRP)', category: 'P2', enabled: false },
    { id: 'ecommerce', name: 'ربط المتاجر الإلكترونية (Omnichannel)', category: 'P2', enabled: false },
    { id: 'hr', name: 'الموارد البشرية والرواتب (HR)', category: 'P2', enabled: true },
  ];

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulate API Save
    setTimeout(() => {
      setMessage({ type: 'success', text: 'تم تحديث التكوين الأساسي (Core Configuration) بنجاح.' });
      setLoading(false);
      setTimeout(() => setMessage(null), 3000);
    }, 800);
  };

  const handleGenerateCOA = async () => {
    setCoaStatus('generating');
    try {
      const response = await fetch('/api/erp/finance/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ industry: selectedIndustry })
      });
      
      if (!response.ok) throw new Error('Failed to initialize');
      
      setCoaStatus('ready');
      setMessage({ type: 'success', text: 'تم إنشاء الدليل المحاسبي الافتراضي بناءً على نشاط الشركة.' });
    } catch (e) {
      setCoaStatus('pending');
      setMessage({ type: 'error', text: 'حدث خطأ أثناء إنشاء الدليل المحاسبي.' });
    }
    setTimeout(() => setMessage(null), 3000);
  };

  const tabs = [
    { id: 'tenant', name: 'الشركة (Tenant Identity)', icon: Building2 },
    { id: 'industry', name: 'محرك الأنشطة (Industry Engine)', icon: Layers },
    { id: 'finance', name: 'المحاسبة والمالية (Finance Core)', icon: Wallet },
    { id: 'modules', name: 'الوحدات (Module Enablement)', icon: Boxes },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-950 via-[#151b2b] to-[#0f172a] p-6 rounded-2xl border border-blue-900/40 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-400 font-bold text-xs border border-blue-500/30">
              MARO Adaptive ERP — Core Engine
            </span>
          </div>
          <h1 className="text-2xl font-black text-white">إعدادات النظام والمحرك الأساسي</h1>
          <p className="text-xs text-slate-400 mt-1">
            تهيئة حساب الشركة (Tenant Isolation)، اختيار النشاط، وإنشاء الدليل المحاسبي.
          </p>
        </div>
        {message && (
          <div className={cn(
            "px-4 py-3 rounded-xl text-xs font-bold animate-in fade-in flex items-center gap-2 border",
            message.type === 'success' ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-red-500/10 text-red-400 border-red-500/20"
          )}>
            <CheckCircle2 size={16} /> {message.text}
          </div>
        )}
      </div>

      <div className="flex gap-2 border-b border-[#1e293b] pb-4 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={cn(
              "flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-xs transition-all whitespace-nowrap",
              activeTab === tab.id 
                ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" 
                : "bg-[#151b2b] text-slate-400 hover:text-white border border-[#1e293b] hover:border-slate-700"
            )}
          >
            <tab.icon size={16} />
            <span>{tab.name}</span>
          </button>
        ))}
      </div>

      <div className="bg-[#151b2b] rounded-2xl border border-[#1e293b] p-6 shadow-2xl min-h-[500px]">
        {/* TAB 1: TENANT IDENTITY */}
        {activeTab === 'tenant' && (
          <form onSubmit={handleSave} className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
            <div className="border-b border-slate-800 pb-4">
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <Building2 className="text-blue-500" /> الهوية القانونية للشركة (Tenant)
              </h3>
              <p className="text-xs text-slate-400 mt-1">المعلومات الضريبية والقانونية التي تظهر على الفواتير الرسمية.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-2">اسم الشركة (الرسمي)</label>
                <input 
                  type="text" 
                  value={tenantConfig.companyName}
                  onChange={(e) => setTenantConfig({...tenantConfig, companyName: e.target.value})}
                  className="w-full bg-[#0f172a] border border-slate-800 rounded-xl px-4 py-3 text-white text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all" 
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-2">الرقم الضريبي (VAT Number)</label>
                <input 
                  type="text" 
                  value={tenantConfig.taxNumber}
                  onChange={(e) => setTenantConfig({...tenantConfig, taxNumber: e.target.value})}
                  className="w-full bg-[#0f172a] border border-slate-800 rounded-xl px-4 py-3 text-white text-sm font-mono focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all" 
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-2">رقم السجل التجاري (CR)</label>
                <input 
                  type="text" 
                  value={tenantConfig.registrationNumber}
                  onChange={(e) => setTenantConfig({...tenantConfig, registrationNumber: e.target.value})}
                  className="w-full bg-[#0f172a] border border-slate-800 rounded-xl px-4 py-3 text-white text-sm font-mono focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all" 
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-2">عملة الأساس</label>
                  <input 
                    type="text" 
                    value={tenantConfig.baseCurrency}
                    readOnly
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-slate-500 text-sm font-bold cursor-not-allowed" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-2">نسبة الضريبة %</label>
                  <input 
                    type="number" 
                    value={tenantConfig.taxRate}
                    onChange={(e) => setTenantConfig({...tenantConfig, taxRate: Number(e.target.value)})}
                    className="w-full bg-[#0f172a] border border-slate-800 rounded-xl px-4 py-3 text-white text-sm font-mono focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all" 
                  />
                </div>
              </div>
            </div>
            
            <div className="flex justify-end pt-6">
              <button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-xl text-sm font-bold transition-all flex items-center gap-2">
                <Save size={18} /> حفظ التكوين
              </button>
            </div>
          </form>
        )}

        {/* TAB 2: INDUSTRY ENGINE */}
        {activeTab === 'industry' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
            <div className="border-b border-slate-800 pb-4">
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <Layers className="text-purple-500" /> محرك الأنشطة (Dynamic Industry Engine)
              </h3>
              <p className="text-xs text-slate-400 mt-1">يقوم محرك MARO بتشكيل الشاشات والميزات تلقائياً بناءً على طبيعة نشاطك للحفاظ على النظام خفيفاً وسريعاً.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {industries.map((ind) => (
                <div 
                  key={ind.id}
                  onClick={() => setSelectedIndustry(ind.id)}
                  className={cn(
                    "p-5 rounded-2xl border cursor-pointer transition-all flex flex-col gap-3 relative overflow-hidden group",
                    selectedIndustry === ind.id 
                      ? "bg-blue-600/10 border-blue-500 shadow-lg shadow-blue-900/20" 
                      : "bg-[#0f172a] border-slate-800 hover:border-slate-600 hover:bg-slate-800/50"
                  )}
                >
                  {selectedIndustry === ind.id && (
                    <div className="absolute top-3 left-3 bg-blue-500 text-white p-1 rounded-full">
                      <CheckCircle2 size={14} />
                    </div>
                  )}
                  <div className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center transition-colors",
                    selectedIndustry === ind.id ? "bg-blue-500 text-white" : "bg-slate-800 text-slate-400 group-hover:text-white"
                  )}>
                    <ind.icon size={24} />
                  </div>
                  <div>
                    <h4 className="font-bold text-white mb-1">{ind.name}</h4>
                    <p className="text-[10px] text-slate-400 leading-relaxed">{ind.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex gap-3 mt-6">
              <AlertTriangle className="text-amber-500 shrink-0" size={20} />
              <div>
                <h5 className="text-sm font-bold text-amber-500 mb-1">ملاحظة معمارية</h5>
                <p className="text-xs text-amber-400/80">تغيير نشاط الشركة بعد بدء العمليات سيؤثر على القوالب الافتراضية للفواتير وتقارير ذكاء الأعمال (BI). النظام يدعم Hybrid Industry (مثال: تجزئة + مطعم).</p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: FINANCE ENGINE */}
        {activeTab === 'finance' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
            <div className="border-b border-slate-800 pb-4">
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <Wallet className="text-emerald-500" /> المحرك المالي والدليل المحاسبي
              </h3>
              <p className="text-xs text-slate-400 mt-1">يُشترط توليد دليل حسابات قياسي (Chart of Accounts) لتتمكن من إصدار أي فاتورة أو حركة مخزنية.</p>
            </div>

            <div className="bg-[#0f172a] rounded-2xl border border-slate-800 p-8 flex flex-col items-center justify-center text-center">
              <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mb-6">
                <Database className={cn("text-emerald-500", coaStatus === 'generating' && "animate-pulse")} size={40} />
              </div>
              
              <h4 className="text-xl font-bold text-white mb-2">الدليل المحاسبي (Chart of Accounts)</h4>
              
              {coaStatus === 'pending' && (
                <>
                  <p className="text-sm text-slate-400 max-w-md mx-auto mb-6">لم يتم إنشاء الدليل المحاسبي بعد. هل ترغب في قيام MARO بتوليد دليل شجري متوافق مع معايير IFRS مخصص لنشاط ({industries.find(i => i.id === selectedIndustry)?.name})؟</p>
                  <button onClick={handleGenerateCOA} className="bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-3 rounded-xl text-sm font-bold transition-all shadow-lg shadow-emerald-900/20">
                    توليد الدليل المحاسبي الآن
                  </button>
                </>
              )}

              {coaStatus === 'generating' && (
                <div className="space-y-4">
                  <p className="text-sm text-slate-300 font-bold">جاري بناء الشجرة المحاسبية وتكوين قيود الافتتاح...</p>
                  <div className="w-64 h-2 bg-slate-800 rounded-full overflow-hidden mx-auto">
                    <div className="h-full bg-emerald-500 w-1/2 animate-[pulse_1s_ease-in-out_infinite]"></div>
                  </div>
                </div>
              )}

              {coaStatus === 'ready' && (
                <div className="space-y-4">
                  <div className="inline-flex items-center gap-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-4 py-2 rounded-lg text-sm font-bold">
                    <CheckCircle2 size={18} /> الدليل المحاسبي جاهز ونشط
                  </div>
                  <p className="text-xs text-slate-400 block">تم بناء 124 حساب فرعي ورئيسي بناءً على النشاط المحدد.</p>
                  <button className="text-blue-400 text-xs font-bold hover:underline mt-2">استعراض الشجرة المحاسبية →</button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: MODULES ENABLEMENT */}
        {activeTab === 'modules' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
            <div className="border-b border-slate-800 pb-4">
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <Boxes className="text-rose-500" /> تفعيل وتعطيل الوحدات (Module Enablement)
              </h3>
              <p className="text-xs text-slate-400 mt-1">حافظ على MARO كنظام "Lite" عن طريق تعطيل الوحدات التي لا تحتاجها، أو حوّله إلى "Full ERP" متى أردت.</p>
            </div>

            <div className="space-y-3">
              {modules.map((mod) => (
                <div key={mod.id} className="flex items-center justify-between p-4 bg-[#0f172a] rounded-xl border border-slate-800">
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "w-10 h-10 rounded-lg flex items-center justify-center font-bold text-xs",
                      mod.category === 'P1' ? "bg-purple-500/20 text-purple-400" : "bg-blue-500/20 text-blue-400"
                    )}>
                      {mod.category}
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-sm">{mod.name}</h4>
                      <p className="text-[10px] text-slate-500">ميزة إضافية يتم تشغيلها وإيقافها بدون التأثير على النواة الأساسية (Core).</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked={mod.enabled} />
                    <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
                  </label>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
