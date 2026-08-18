/**
 * @file AdaptiveERPHub.tsx
 * @module واجهات وصفحات النظام (UI Pages)
 * @description ملف جزء من نظام MARO ERP. الوظيفة: AdaptiveERPHub.tsx.
 */
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Briefcase,
  Utensils,
  HeartPulse,
  Car,
  Factory,
  Scissors,
  Dumbbell,
  Baby,
  ParkingSquare,
  Plane,
  Ship,
  MessageSquare,
  ScanLine,
  Award,
  Truck,
  Trees,
  Paintbrush,
  Sparkles,
  Flame,
  LayoutTemplate,
  Eye,
  ArrowLeft
} from 'lucide-react';
import { formatCurrency, cn } from '../lib/utils';
import { IndustryModuleEngine } from '../lib/industryModuleEngine';
import { IndustryModule } from '../types/industryModules';

export const AdaptiveERPHub: React.FC = () => {
  const navigate = useNavigate();
  const allModules = useMemo(() => IndustryModuleEngine.getModules(), []);

  const [selectedModuleId, setSelectedModuleId] = useState<string>(allModules[0]?.id || 'FOOD_SUPERMARKET');
  const [activeLayer, setActiveLayer] = useState<'core' | 'finance' | 'inventory' | 'industry' | 'ai' | 'workflow'>('industry');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const currentModule = useMemo(() => {
    return allModules.find(m => m.id === selectedModuleId) || allModules[0];
  }, [allModules, selectedModuleId]);

  const categories = [
    { id: 'ALL', name: `الكل (${allModules.length})` },
    { id: 'RETAIL', name: 'التجزئة والجملة' },
    { id: 'FOOD_BEVERAGE', name: 'المطاعم والأغذية' },
    { id: 'HEALTHCARE', name: 'الصحة والرعاية' },
    { id: 'AUTOMOTIVE', name: 'السيارات والقطع' },
    { id: 'INDUSTRIAL', name: 'التصنيع والمقاولات' },
    { id: 'SERVICES', name: 'الخدمات والأكاديميات' },
    { id: 'DISTRIBUTION', name: 'الشحن والتوزيع' }
  ];

  const filteredModules = useMemo(() => {
    return allModules.filter(mod => {
      const matchesCategory = selectedCategory === 'ALL' || mod.category === selectedCategory;
      const matchesSearch = !searchQuery.trim() || 
        mod.nameAr.toLowerCase().includes(searchQuery.toLowerCase()) ||
        mod.descriptionAr.toLowerCase().includes(searchQuery.toLowerCase()) ||
        mod.code.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [allModules, selectedCategory, searchQuery]);

  const getModuleIcon = (iconName: string) => {
    switch (iconName) {
      case 'ShoppingBag': return <ShoppingCart size={18} />;
      case 'Shirt': return <Layers size={18} />;
      case 'Smartphone': return <Zap size={18} />;
      case 'Utensils': return <Utensils size={18} />;
      case 'HeartPulse': return <HeartPulse size={18} />;
      case 'Car': return <Car size={18} />;
      case 'Factory': return <Factory size={18} />;
      case 'Scissors': return <Scissors size={18} />;
      case 'Dumbbell': return <Dumbbell size={18} />;
      case 'Baby': return <Baby size={18} />;
      case 'ParkingSquare': return <ParkingSquare size={18} />;
      case 'Plane': return <Plane size={18} />;
      case 'Ship': return <Ship size={18} />;
      case 'MessageSquare': return <MessageSquare size={18} />;
      case 'ScanLine': return <ScanLine size={18} />;
      case 'Award': return <Award size={18} />;
      case 'Truck': return <Truck size={18} />;
      case 'Trees': return <Trees size={18} />;
      case 'Paintbrush': return <Paintbrush size={18} />;
      case 'Flame': return <Flame size={18} />;
      case 'LayoutTemplate': return <LayoutTemplate size={18} />;
      case 'Eye': return <Eye size={18} />;
      case 'Building2': return <Building2 size={18} />;
      default: return <Layers size={18} />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-950 via-[#151b2b] to-[#0f172a] p-6 rounded-2xl border border-blue-900/40 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-400 font-bold text-xs border border-blue-500/30">
              MARO Adaptive ERP Platform v6.0
            </span>
            <span className="text-xs text-emerald-400 font-bold">● متوافق مع كافة الأنشطة التجارية ({allModules.length} نشاط متاح)</span>
          </div>
          <h1 className="text-2xl font-black text-white">منصة مارو المؤسسية المتكيفة مع الصناعة (Plug & Play Industry Modules)</h1>
          <p className="text-xs text-slate-400 mt-1">
            نواة محاسبية ومخزنية صارمة بالخلفية، مع وحدات صناعية وتجارية متخصصة لكل نشاط، مع حقول وشاشات مخصصة تلقائياً.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-[#0f172a] px-4 py-2.5 rounded-xl border border-slate-700 text-right">
            <span className="text-[10px] text-slate-400 block">النشاط النشط حالياً</span>
            <span className="font-bold text-emerald-400 text-xs flex items-center gap-1.5">
              {getModuleIcon(currentModule.iconName)}
              <span>{currentModule.nameAr}</span>
            </span>
          </div>
          <button
            onClick={() => navigate(currentModule.routePath)}
            className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-purple-900/20 active:scale-95 flex items-center gap-2 whitespace-nowrap"
          >
            <span>دخول موديول {currentModule.nameAr.split(' ')[0]}</span>
            <ArrowLeft size={16} />
          </button>
        </div>
      </div>

      {/* Category Tabs & Search Engine */}
      <div className="bg-[#151b2b] p-4 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Sliders size={18} className="text-blue-400" />
            <h3 className="text-sm font-bold text-white">دليل الأنشطة القطاعية المتاحة بالنظام ({allModules.length} نشاط):</h3>
          </div>
          
          {/* Search Box */}
          <div className="relative w-full md:w-80">
            <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث عن نشاط (مثل: سوبرماركت، مطعم، صيدلية، طيور، عطور)..."
              className="w-full bg-[#0f172a] border border-slate-700 rounded-xl pr-9 pl-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={cn(
                "px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap border",
                selectedCategory === cat.id
                  ? "bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-900/30"
                  : "bg-[#0f172a] text-slate-400 border-slate-800 hover:text-white hover:border-slate-700"
              )}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Modules Grid - Show ALL 34+ Modules */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-[380px] overflow-y-auto pr-1">
          {filteredModules.map(mod => {
            const isSelected = selectedModuleId === mod.id;
            return (
              <div
                key={mod.id}
                onClick={() => setSelectedModuleId(mod.id)}
                className={cn(
                  "p-3.5 rounded-xl border text-right transition-all cursor-pointer flex flex-col justify-between gap-2 relative group overflow-hidden",
                  isSelected
                    ? "bg-blue-600/15 border-blue-500 shadow-lg shadow-blue-900/20 ring-1 ring-blue-500/50"
                    : "bg-[#0f172a] border-slate-800 hover:border-slate-700 hover:bg-slate-800/60"
                )}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className={cn(
                      "w-9 h-9 rounded-lg flex items-center justify-center transition-colors",
                      isSelected ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-400 group-hover:text-white"
                    )}>
                      {getModuleIcon(mod.iconName)}
                    </div>
                    {isSelected ? (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-[10px] border border-emerald-500/30">
                        النشاط المحدد
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-500 font-mono">{mod.code}</span>
                    )}
                  </div>
                  <h4 className="font-bold text-xs text-white mb-1 line-clamp-1">{mod.nameAr}</h4>
                  <p className="text-[10px] text-slate-400 line-clamp-2 leading-relaxed">{mod.descriptionAr}</p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-[10px]">
                  <span className="text-slate-500">{mod.customProductFields?.length || 0} حقول مخصصة</span>
                  <span className="text-blue-400 font-bold hover:underline flex items-center gap-1">
                    <span>عرض التفاصيل</span>
                    <span>←</span>
                  </span>
                </div>
              </div>
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
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#0f172a] p-5 rounded-2xl border border-slate-800">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center shrink-0 border border-blue-500/30">
                  {getModuleIcon(currentModule.iconName)}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-white text-base">{currentModule.nameAr}</h3>
                    <span className="px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-400 text-[10px] font-mono border border-purple-500/30">
                      {currentModule.code}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed max-w-3xl">{currentModule.descriptionAr}</p>
                </div>
              </div>
              <button
                onClick={() => navigate(currentModule.routePath)}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-blue-900/30 flex items-center gap-2 shrink-0"
              >
                <span>فتح شاشة الموديول المخصصة</span>
                <ArrowLeft size={16} />
              </button>
            </div>

            {/* Specialized Features */}
            <div>
              <h4 className="text-xs font-bold text-slate-300 mb-3 flex items-center gap-2">
                <Zap size={15} className="text-amber-400" />
                <span>الميزات والوظائف المتخصصة المفعلة لهذا النشاط:</span>
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {currentModule.specializedFeatures?.map((feat) => (
                  <div key={feat.id} className="bg-[#0f172a] p-3.5 rounded-xl border border-slate-800 space-y-1">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                      <span className="text-xs font-bold text-white">{feat.nameAr}</span>
                    </div>
                    <p className="text-[11px] text-slate-400 pr-6 leading-relaxed">{feat.descriptionAr}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Custom Product Fields */}
            {currentModule.customProductFields && currentModule.customProductFields.length > 0 && (
              <div>
                <h4 className="text-xs font-bold text-slate-300 mb-3 flex items-center gap-2">
                  <Sliders size={15} className="text-blue-400" />
                  <span>الحقول المخصصة المضافة تلقائياً لبطاقة الصنف (Custom Product Attributes):</span>
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                  {currentModule.customProductFields.map((field) => (
                    <div key={field.id} className="bg-[#0f172a] p-3 rounded-xl border border-slate-800 text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white">{field.nameAr}</span>
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">{field.type}</span>
                      </div>
                      {field.options && (
                        <p className="text-[10px] text-slate-400 line-clamp-2">
                          خيارات: {field.options.slice(0, 3).join(' ، ')}...
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Specialized Reports */}
            {currentModule.specializedReports && currentModule.specializedReports.length > 0 && (
              <div>
                <h4 className="text-xs font-bold text-slate-300 mb-3 flex items-center gap-2">
                  <FileText size={15} className="text-purple-400" />
                  <span>التقارير التحليلية والذكاء الاصطناعي المدمج لهذا النشاط:</span>
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {currentModule.specializedReports.map((report) => (
                    <div key={report.id} className="bg-[#0f172a] p-3 rounded-xl border border-slate-800 flex items-start gap-3">
                      <FileText size={18} className="text-purple-400 shrink-0 mt-0.5" />
                      <div>
                        <h5 className="font-bold text-xs text-white mb-0.5">{report.nameAr}</h5>
                        <p className="text-[11px] text-slate-400">{report.descriptionAr}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
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
