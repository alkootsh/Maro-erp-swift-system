import React, { useState } from 'react';
import { 
  Layers, 
  Cpu, 
  ShieldCheck, 
  Globe, 
  DollarSign, 
  Boxes, 
  ShoppingCart, 
  Brain, 
  Activity, 
  FileText, 
  CheckCircle2, 
  Building2, 
  Sliders, 
  Zap, 
  TrendingUp, 
  Lock, 
  RefreshCw,
  Search,
  Server,
  Briefcase
} from 'lucide-react';
import { formatCurrency, cn } from '../lib/utils';

export const AdaptiveERPHub: React.FC = () => {
  const [selectedIndustry, setSelectedIndustry] = useState<string>('retail');
  const [activeLayer, setActiveLayer] = useState<'core' | 'finance' | 'inventory' | 'industry' | 'ai' | 'workflow'>('core');

  // Industry packs definition
  const industryPacks = [
    { id: 'retail', name: 'تجارة التجزئة والسوبرماركت', icon: ShoppingCart, features: ['POS سريع', 'ولاء العملاء', 'باركود الأوزان', 'العروض الترويجية'] },
    { id: 'restaurant', name: 'المطاعم والكافيهات', icon: Activity, features: ['شاشات المطبخ KDS', 'إدارة الطاولات', 'الوصفات والمكونات', 'التوصيل والدليفري'] },
    { id: 'pharmacy', name: 'الصيدليات والأدوية', icon: ShieldCheck, features: ['تواريخ الصلاحية', 'أرقام التشغيلات', 'البدائل الدوائية', 'صرف الروشتات'] },
    { id: 'automotive', name: 'قطع الغيار والسيارات', icon: Layers, features: ['أرقام الشاصيه VIN', 'أرقام الأجزاء SKU', 'كتالوج الموديلات', 'ورشة الصيانة'] },
    { id: 'construction', name: 'المقاولات والمشاريع', icon: Briefcase, features: ['مستخلصات المقاولات', 'جداول الكميات BOQ', 'تكلفة المعدات والعمالة', 'ميزانية المشروع'] },
    { id: 'manufacturing', name: 'التصنيع والإنتاج', icon: Cpu, features: ['قوائم المواد BOM', 'أوامر الإنتاج', 'تخطيط الاحتياجات MRP', 'مراكز العمل'] },
  ];

  const currentPack = industryPacks.find(p => p.id === selectedIndustry) || industryPacks[0];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-950 via-[#151b2b] to-[#0f172a] p-6 rounded-2xl border border-blue-900/40 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-400 font-bold text-xs border border-blue-500/30">
              MARO Adaptive ERP Platform v6.0
            </span>
            <span className="text-xs text-emerald-400 font-bold">● نظام واحد يتشكل حسب نشاطك التجاري</span>
          </div>
          <h1 className="text-2xl font-black text-white">منصة مارو المؤسسية المتكيفة مع الصناعة</h1>
          <p className="text-xs text-slate-400 mt-1">
            نواة محاسبية ومخزنية صارمة بالخلفية، مع وحدات صناعية متخصصة، طبقة ذكاء اصطناعي (AI Operating Layer)، ومحرك سير عمل متقدم (Workflow Engine).
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-[#0f172a] px-4 py-2.5 rounded-xl border border-slate-700 text-right">
            <span className="text-[10px] text-slate-400 block">النشاط الحالي النشط</span>
            <span className="font-bold text-emerald-400 text-xs">{currentPack.name}</span>
          </div>
        </div>
      </div>

      {/* Industry Selector Bar */}
      <div className="bg-[#151b2b] p-4 rounded-2xl border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-white flex items-center gap-2">
            <Sliders size={16} className="text-blue-400" />
            <span>اختر طبيعة النشاط التجاري (Industry-Adaptive Engine):</span>
          </span>
          <span className="text-[11px] text-slate-400">يتكيف النظام تلقائياً بالحقول والواجهات المناسبة دون تعديل قاعدة البيانات</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {industryPacks.map(pack => {
            const IconComponent = pack.icon;
            const isSelected = selectedIndustry === pack.id;
            return (
              <button
                key={pack.id}
                onClick={() => setSelectedIndustry(pack.id)}
                className={cn(
                  "p-3 rounded-xl border text-right transition-all flex flex-col gap-2",
                  isSelected ? "bg-blue-600/20 text-blue-400 border-blue-500/60 shadow-lg shadow-blue-600/10" : "bg-[#0f172a] text-slate-300 border-slate-800 hover:border-slate-700"
                )}
              >
                <div className="flex items-center justify-between">
                  <IconComponent size={18} className={isSelected ? "text-blue-400" : "text-slate-400"} />
                  {isSelected && <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></span>}
                </div>
                <span className="font-bold text-xs truncate">{pack.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Layer Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-800">
        <button
          onClick={() => setActiveLayer('core')}
          className={cn(
            "flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all whitespace-nowrap",
            activeLayer === 'core' ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" : "bg-[#151b2b] text-slate-400 hover:text-white border border-slate-800"
          )}
        >
          <Server size={16} />
          <span>1. النواة الصلبة (Core ERP)</span>
        </button>
        <button
          onClick={() => setActiveLayer('finance')}
          className={cn(
            "flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all whitespace-nowrap",
            activeLayer === 'finance' ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" : "bg-[#151b2b] text-slate-400 hover:text-white border border-slate-800"
          )}
        >
          <DollarSign size={16} />
          <span>2. المحرك المالي (Finance Engine)</span>
        </button>
        <button
          onClick={() => setActiveLayer('inventory')}
          className={cn(
            "flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all whitespace-nowrap",
            activeLayer === 'inventory' ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" : "bg-[#151b2b] text-slate-400 hover:text-white border border-slate-800"
          )}
        >
          <Boxes size={16} />
          <span>3. محرك المخزون (Inventory Engine)</span>
        </button>
        <button
          onClick={() => setActiveLayer('industry')}
          className={cn(
            "flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all whitespace-nowrap",
            activeLayer === 'industry' ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" : "bg-[#151b2b] text-slate-400 hover:text-white border border-slate-800"
          )}
        >
          <Layers size={16} />
          <span>4. حزمة النشاط (Industry Pack)</span>
        </button>
        <button
          onClick={() => setActiveLayer('ai')}
          className={cn(
            "flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all whitespace-nowrap",
            activeLayer === 'ai' ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" : "bg-[#151b2b] text-slate-400 hover:text-white border border-slate-800"
          )}
        >
          <Brain size={16} />
          <span>5. طبقة الذكاء الاصطناعي (AI & Agents)</span>
        </button>
        <button
          onClick={() => setActiveLayer('workflow')}
          className={cn(
            "flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all whitespace-nowrap",
            activeLayer === 'workflow' ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" : "bg-[#151b2b] text-slate-400 hover:text-white border border-slate-800"
          )}
        >
          <Activity size={16} />
          <span>6. دورة العمل (Workflow & Approvals)</span>
        </button>
      </div>

      {/* Layer Content View */}
      <div className="bg-[#151b2b] p-6 rounded-2xl border border-slate-800 space-y-6">
        {activeLayer === 'core' && (
          <div className="space-y-4">
            <h3 className="font-bold text-white text-base flex items-center gap-2">
              <Server className="text-blue-400" size={20} />
              <span>النواة الصلبة (Core ERP) - البيانات الأساسية والأمان والصلاحيات</span>
            </h3>
            <p className="text-xs text-slate-400">
              هذه النواة موحدة وثابتة عبر جميع الشركات والأنشطة، وتدير الهيكل التنظيمي، الشركات، الفروع، المستودعات، والمستخدمين مع صلاحيات صارمة (RBAC).
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className="bg-[#0f172a] p-4 rounded-xl border border-slate-800 space-y-2">
                <span className="text-xs text-blue-400 font-bold block">الهيكل التنظيمي</span>
                <p className="text-xs text-slate-300">شركات متعددة • فروع متعددة • مستودعات متعددة • مراكز تكلفة</p>
              </div>
              <div className="bg-[#0f172a] p-4 rounded-xl border border-slate-800 space-y-2">
                <span className="text-xs text-emerald-400 font-bold block">البيانات الأساسية (Master Data)</span>
                <p className="text-xs text-slate-300">الأصناف • البدائل • العملاء • الموردين • قوائم الأسعار • العملات</p>
              </div>
              <div className="bg-[#0f172a] p-4 rounded-xl border border-slate-800 space-y-2">
                <span className="text-xs text-purple-400 font-bold block">الأمان والصلاحيات (RBAC)</span>
                <p className="text-xs text-slate-300">Firebase Auth • صلاحيات الشاشات والأزرار • سجل التدقيق (Audit Trail)</p>
              </div>
            </div>
          </div>
        )}

        {activeLayer === 'finance' && (
          <div className="space-y-4">
            <h3 className="font-bold text-white text-base flex items-center gap-2">
              <DollarSign className="text-emerald-400" size={20} />
              <span>المحرك المالي (Finance Engine) - الحقيقة المحاسبية المطلقة</span>
            </h3>
            <p className="text-xs text-slate-400">
              دفتر أستاذ عام متكامل (GL)، شجرة حسابات خماسية قياسية، مطابقة بنكية آلية (Bank Reconciliation)، ومحرك ضرائب قابل للتكوين (VAT, Withholding).
            </p>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-2">
              <div className="bg-[#0f172a] p-4 rounded-xl border border-slate-800 space-y-1">
                <span className="text-xs text-slate-400 font-bold">دليل الحسابات (COA)</span>
                <p className="text-sm font-bold text-white">5 أقسام رئيسية قياسية</p>
              </div>
              <div className="bg-[#0f172a] p-4 rounded-xl border border-slate-800 space-y-1">
                <span className="text-xs text-slate-400 font-bold">الذمم المدينة والدائنة</span>
                <p className="text-sm font-bold text-emerald-400">متابعة أعمار الديون والتحصيل</p>
              </div>
              <div className="bg-[#0f172a] p-4 rounded-xl border border-slate-800 space-y-1">
                <span className="text-xs text-slate-400 font-bold">المطابقة البنكية الذكية</span>
                <p className="text-sm font-bold text-blue-400">مطابقة تلقائية 100%</p>
              </div>
              <div className="bg-[#0f172a] p-4 rounded-xl border border-slate-800 space-y-1">
                <span className="text-xs text-slate-400 font-bold">محرك الضرائب المرن</span>
                <p className="text-sm font-bold text-purple-400">إقرار ضريبي والفاتورة الإلكترونية</p>
              </div>
            </div>
          </div>
        )}

        {activeLayer === 'inventory' && (
          <div className="space-y-4">
            <h3 className="font-bold text-white text-base flex items-center gap-2">
              <Boxes className="text-blue-400" size={20} />
              <span>محرك المخزون (Inventory Engine) - تتبع الصنف والحركة بدقة</span>
            </h3>
            <p className="text-xs text-slate-400">
              سجل كامل لكل حركة مخزنية (Opening, Purchase, Transfer, Sale, Return, Production) مع دعم سياسات التقييم (FIFO, Weighted Average) وإدارة الأرفف والتشغيلات.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className="bg-[#0f172a] p-4 rounded-xl border border-slate-800 space-y-2">
                <span className="text-xs text-blue-400 font-bold">تقييم المخزون</span>
                <p className="text-xs text-slate-300">FIFO • متوسط الترجيح (Weighted Average) • التكلفة المعيارية</p>
              </div>
              <div className="bg-[#0f172a] p-4 rounded-xl border border-slate-800 space-y-2">
                <span className="text-xs text-emerald-400 font-bold">الأرفف والمستودعات (WMS)</span>
                <p className="text-xs text-slate-300">مواقع التخزين (Bin Locations) • النقل بين المستودعات • الجرد الدوري</p>
              </div>
              <div className="bg-[#0f172a] p-4 rounded-xl border border-slate-800 space-y-2">
                <span className="text-xs text-purple-400 font-bold">التشغيلات والسريال (Batch & Serial)</span>
                <p className="text-xs text-slate-300">تاريخ الصلاحية • أرقام التشغيلات (Batch) • الأرقام التسلسلية (Serial/IMEI)</p>
              </div>
            </div>
          </div>
        )}

        {activeLayer === 'industry' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <Layers className="text-amber-400" size={20} />
                <span>حزمة النشاط الحالي: <span className="text-blue-400">{currentPack.name}</span></span>
              </h3>
              <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-xl text-xs font-bold">
                تكييف تلقائي للشاشات والحقول
              </span>
            </div>
            <p className="text-xs text-slate-400">
              الميزات المتخصصة المفعلة خصيصاً لهذا النشاط دون الحاجة لبرمجة إضافية:
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
              {currentPack.features.map((feat, idx) => (
                <div key={idx} className="bg-[#0f172a] p-3 rounded-xl border border-slate-800 flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                  <span className="text-xs font-bold text-white">{feat}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeLayer === 'ai' && (
          <div className="space-y-4">
            <h3 className="font-bold text-white text-base flex items-center gap-2">
              <Brain className="text-purple-400" size={20} />
              <span>طبقة الذكاء الاصطناعي والوكلاء (AI & Agentic ERP)</span>
            </h3>
            <p className="text-xs text-slate-400">
              ليس مجرد شات بوت، بل محلل مالي ذكي، وتنبؤ بالمخزون والسيولة، ووكلاء آليون (Agents) ينفذون العمليات بعد موافقة الإدارة مع ارتباط مباشر بالقيود المحاسبية.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className="bg-[#0f172a] p-4 rounded-xl border border-slate-800 space-y-2">
                <span className="text-xs text-purple-400 font-bold">محلل الأرباح والسيولة (CFO AI)</span>
                <p className="text-xs text-slate-300">تحليل انخفاض الهوامش وتتبع الأسباب جذرياً حتى قيد اليومية والمستند</p>
              </div>
              <div className="bg-[#0f172a] p-4 rounded-xl border border-slate-800 space-y-2">
                <span className="text-xs text-blue-400 font-bold">مستشعر الطلب والمخزون</span>
                <p className="text-xs text-slate-300">توقع الأصناف التي ستنفد وإنشاء مسودات أوامر الشراء تلقائياً</p>
              </div>
              <div className="bg-[#0f172a] p-4 rounded-xl border border-slate-800 space-y-2">
                <span className="text-xs text-emerald-400 font-bold">الوكيل الآلي (Agentic Actions)</span>
                <p className="text-xs text-slate-300">تنفيذ دورة المشتريات والتحصيل بلمسة واحدة مع الحفاظ على الرقابة البشرية</p>
              </div>
            </div>
          </div>
        )}

        {activeLayer === 'workflow' && (
          <div className="space-y-4">
            <h3 className="font-bold text-white text-base flex items-center gap-2">
              <Activity className="text-blue-400" size={20} />
              <span>محرك دورة العمل والموافقات (Workflow & Approval Engine)</span>
            </h3>
            <p className="text-xs text-slate-400">
              فصل تام بين مسار اتخاذ القرار (Workflow: مسودة ← اعتماد مدير ← اعتماد مالي) وبين المحاسبة (Finance Engine يولد قيد اليومية تلقائياً عند اعتماد المستند).
            </p>
            <div className="bg-[#0f172a] p-4 rounded-xl border border-slate-800 flex items-center justify-between gap-2 overflow-x-auto text-xs">
              <div className="px-3 py-2 bg-slate-800 rounded-lg text-white font-bold whitespace-nowrap">1. مسودة المستند (Draft)</div>
              <span className="text-slate-500">←</span>
              <div className="px-3 py-2 bg-blue-600/20 text-blue-400 rounded-lg font-bold whitespace-nowrap border border-blue-500/30">2. موافقة المدير</div>
              <span className="text-slate-500">←</span>
              <div className="px-3 py-2 bg-purple-600/20 text-purple-400 rounded-lg font-bold whitespace-nowrap border border-purple-500/30">3. الموافقة المالية</div>
              <span className="text-slate-500">←</span>
              <div className="px-3 py-2 bg-emerald-600/20 text-emerald-400 rounded-lg font-bold whitespace-nowrap border border-emerald-500/30">4. اعتماد وإصدار قيد اليومية</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
