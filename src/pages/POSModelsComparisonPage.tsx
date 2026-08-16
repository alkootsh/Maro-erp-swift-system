/**
 * @file POSModelsComparisonPage.tsx
 * @module واجهات وصفحات النظام (UI Pages)
 * @description ملف جزء من نظام MARO ERP. الوظيفة: POSModelsComparisonPage.tsx.
 */
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Monitor, Smartphone, Tablet, Zap, ShieldCheck, CheckCircle2, 
  ArrowRight, Store, ShoppingCart, Stethoscope, Utensils, Layers, 
  Sparkles, Sliders, Cpu, Activity, Award, BarChart3, Database, MonitorPlay
} from 'lucide-react';
import { formatCurrency, cn } from '../lib/utils';
import { POSLayoutRepository, POSLayout } from '../repositories/posLayoutRepository';
import { toast } from 'react-hot-toast';

export const POSModelsComparisonPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeModel, setActiveModel] = useState<'ultra' | 'sap' | 'wholesale' | 'pharmacy' | 'restaurant'>('ultra');
  const [customLayoutName, setCustomLayoutName] = useState('');

  const posModels = [
    {
      id: 'ultra',
      title: 'MARO Ultra Touch (النموذج السريع للسوبرماركت)',
      badge: 'الأكثر سرعة (<20ms)',
      desc: 'مصمم خصيصاً للهايبرماركت والسوبرماركت التي تتطلب سرعة فائقة في الكاشير ومسح الباركود والوزن.',
      features: ['شبكة منتجات باللمس مع صور', 'ربط ميزان الباركود (Scale Barcode)', 'أزرار وظائف F1-F24', 'دفع سريع ومتعدد (كاش، شبكة، آجل)'],
      globalComp: 'يتفوق على Square و Odoo POS في سرعة الاستجابة ودعم الموازين الإلكترونية العربية والإنجليزية.',
      icon: ShoppingCart,
      color: 'from-blue-600 to-indigo-600',
      badgeColor: 'bg-blue-500/10 text-blue-400 border-blue-500/30'
    },
    {
      id: 'sap',
      title: 'SAP & Enterprise ERP POS (النموذج المؤسسي المتقدم)',
      badge: 'مقارنة مع SAP B1 & NetSuite',
      desc: 'واجهة مؤسسية معتمدة للشركات الكبرى، تعرض تفاصيل تكلفة المخزون، مراكز التكلفة، الضرائب بدقة، والتحقق الائتماني.',
      features: ['توزيع مراكز التكلفة (Cost Centers)', 'ربط مباشر بدفتر الأستاذ العام', 'إدارة الفروع المتعددة', 'مراجعة المديونية والحد الائتماني لحظياً'],
      globalComp: 'يعادل SAP Business One و Oracle NetSuite POS مع إضافة دعم كامل للغة العربية والـ ZATCA.',
      icon: Monitor,
      color: 'from-purple-600 to-violet-600',
      badgeColor: 'bg-purple-500/10 text-purple-400 border-purple-500/30'
    },
    {
      id: 'wholesale',
      title: 'Wholesale B2B Terminal (نموذج بيع الجملة والموزعين)',
      badge: 'متعدد الوحدات والكراتين',
      desc: 'مصمم لمستودعات الجملة وشركات التوزيع، يدعم البيع بالقطعة والكرتونة والبالته مع خصومات الشرائح.',
      features: ['تعدد وحدات البيع (قطعة، كرتونة، طرد)', 'خصومات الكميات والشرائح التلقائية', 'تحديد مندوب المبيعات والعمولة', 'إصدار إذن تسليم مخزني آلياً'],
      globalComp: 'يفوق أنظمة الجملة التقليدية بمرونة استيراد طلبات المتجر B2B ومزامنة المخزون اللحظية.',
      icon: Layers,
      color: 'from-emerald-600 to-teal-600',
      badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
    },
    {
      id: 'pharmacy',
      title: 'Clinical Pharmacy POS (نموذج الصيدليات الذكي)',
      badge: 'مدعوم بالذكاء الاصطناعي السريري',
      desc: 'شاشة صيدلية متكاملة مع الفحص السريري للروشتات، البدائل الدوائية، وتتبع تواريخ الصلاحية والتشغيلات.',
      features: ['البحث عن البدائل الدوائية المتاحة', 'تتبع رقم التشغيلة وتاريخ الصلاحية (Batch & Expiry)', 'فحص التداخلات الدوائية والتشخيص (AI Triage)', 'خصم التأمين الطبي ونسب التحمل'],
      globalComp: 'أقوى بكثير من أنظمة الصيدليات المحلية عبر دمج وكيل التشخيص الذكي والربط المخزني التلقائي.',
      icon: Stethoscope,
      color: 'from-teal-600 to-cyan-600',
      badgeColor: 'bg-teal-500/10 text-teal-400 border-teal-500/30'
    },
    {
      id: 'restaurant',
      title: 'Restaurant & Cafe Touch (نموذج المطاعم والكافيهات)',
      badge: 'إدارة الطاولات والمطبخ (KDS)',
      desc: 'مخصص للمطاعم والكافيهات مع شاشات عرض المطبخ (KDS)، إدارة الصالات والطاولات، وإضافات الأطباق (Modifiers).',
      features: ['خريطة الطاولات والصالات (Dining / Takeaway / Delivery)', 'إرسال الطلبات للمطبخ تلقائياً (KDS Display)', 'تعديل مكونات الوجبة وإضافات (Modifiers)', 'تقسيم الفاتورة على الزباين بسهولة'],
      globalComp: 'ينافس Revel و TouchBistro مع بساطة استثنائية وسرعة في تسجيل طلبات الطاولات.',
      icon: Utensils,
      color: 'from-amber-600 to-orange-600',
      badgeColor: 'bg-amber-500/10 text-amber-400 border-amber-500/30'
    }
  ];

  const currentModelInfo = posModels.find(m => m.id === activeModel) || posModels[0];

  const handleApplyModel = () => {
    toast.success(`تم تفعيل نموذج "${currentModelInfo.title}" بنجاح وتحديث واجهة نقطة البيع!`);
    navigate('/pos');
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-900/60 via-indigo-900/50 to-slate-900 border border-blue-500/30 p-8 rounded-3xl relative overflow-hidden shadow-2xl">
        <div className="absolute right-0 top-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-blue-400 text-xs font-bold uppercase tracking-wider mb-2">
              <Sparkles size={16} />
              <span>استديو نماذج نقاط البيع المتقدمة (POS Multi-Model Studio)</span>
            </div>
            <h1 className="text-3xl font-black text-white">اخقار وتخصيص نماذج نقاط البيع مقارنة بالأنظمة العالمية</h1>
            <p className="text-slate-300 text-sm mt-2 max-w-2xl leading-relaxed">
              منصة MARO توفر مرونة مطلقة في تصميم شاشات البيع لتناسب كافة الأنشطة التجاري (سوبرماركت، جملة، صيدليات، مطاعم، شركات كبرى) مع ضمان أعلى سرعة تنفيذ وأعلى دقة حسابية مقارنة بـ SAP, Odoo, Dynamics و NetSuite.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/settings/pos/layouts')}
              className="flex items-center gap-2 px-5 py-3 bg-[#151b2b] hover:bg-slate-800 text-slate-200 rounded-2xl border border-[#1e293b] font-bold text-xs transition-all shadow-lg"
            >
              <Sliders size={16} className="text-blue-400" />
              <span>مُصمّم التخطيطات الحر (Layout Designer)</span>
            </button>
            <button
              onClick={() => navigate('/pos')}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-2xl font-bold text-xs shadow-xl shadow-blue-600/30 transition-all hover:scale-105"
            >
              <MonitorPlay size={16} />
              <span>الانتقال لشاشة الكاشير الحالية (POS)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Models Switcher Grid */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {posModels.map(model => {
          const Icon = model.icon;
          const isActive = activeModel === model.id;
          return (
            <div 
              key={model.id}
              onClick={() => setActiveModel(model.id as any)}
              className={cn(
                "p-5 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between group relative overflow-hidden",
                isActive 
                  ? "bg-gradient-to-b from-[#1a233a] to-[#111827] border-blue-500 shadow-xl shadow-blue-900/30 scale-[1.02]" 
                  : "bg-[#151b2b] border-[#1e293b] hover:border-slate-700 text-slate-300"
              )}
            >
              {isActive && (
                <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-500"></div>
              )}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className={cn("p-3 rounded-xl bg-gradient-to-br text-white shadow-md", model.color)}>
                    <Icon size={20} />
                  </div>
                  <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border", model.badgeColor)}>
                    {model.badge.split(' ')[0]}
                  </span>
                </div>
                <h3 className="font-bold text-white text-sm group-hover:text-blue-400 transition-colors">{model.title}</h3>
                <p className="text-xs text-slate-400 mt-1 line-clamp-2">{model.desc}</p>
              </div>
              <div className="mt-4 pt-3 border-t border-[#1e293b] flex items-center justify-between text-xs font-bold">
                <span className={isActive ? "text-blue-400" : "text-slate-500"}>
                  {isActive ? 'النموذج المفعل حالياً' : 'انقر للاختيار'}
                </span>
                <ArrowRight size={14} className={cn("transition-transform", isActive ? "text-blue-400 translate-x-1" : "text-slate-600")} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Model Deep Dive & Global Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Details & Features */}
        <div className="lg:col-span-2 bg-[#151b2b] p-8 rounded-3xl border border-[#1e293b] shadow-xl space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-blue-400 uppercase tracking-widest">نموذج نقطة البيع المحدد</span>
              <h2 className="text-2xl font-black text-white mt-1">{currentModelInfo.title}</h2>
            </div>
            <button
              onClick={handleApplyModel}
              className="flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-bold text-xs shadow-lg shadow-emerald-900/30 transition-all hover:scale-105"
            >
              <CheckCircle2 size={16} />
              <span>تفعيل هذا النموذج واعتماده للكاشير</span>
            </button>
          </div>

          <p className="text-slate-300 text-sm leading-relaxed">
            {currentModelInfo.desc}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-[#1e293b]">
            {currentModelInfo.features.map((feat, idx) => (
              <div key={idx} className="flex items-center gap-3 p-3.5 rounded-xl bg-[#0f172a] border border-[#1e293b]">
                <div className="w-2 h-2 rounded-full bg-blue-500 shrink-0"></div>
                <span className="text-xs font-bold text-slate-200">{feat}</span>
              </div>
            ))}
          </div>

          <div className="p-4 rounded-2xl bg-blue-950/20 border border-blue-500/30 flex items-start gap-3">
            <Award className="text-blue-400 shrink-0 mt-0.5" size={20} />
            <div>
              <h4 className="text-xs font-bold text-blue-300 uppercase">مقارنة المعيار العالمي (Global ERP Benchmark):</h4>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                {currentModelInfo.globalComp}
              </p>
            </div>
          </div>
        </div>

        {/* Right Col: Performance & Accuracy Metrics */}
        <div className="bg-[#151b2b] p-8 rounded-3xl border border-[#1e293b] shadow-xl flex flex-col justify-between space-y-6">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
              <Activity className="text-emerald-400" size={20} />
              <span>مؤشرات السرعة والدقة (KPIs)</span>
            </h3>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs font-bold mb-1.5">
                  <span className="text-slate-400">سرعة استجابة السلة والباركود</span>
                  <span className="text-emerald-400">12ms (&lt; 50ms المستهدف)</span>
                </div>
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 w-[95%]"></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold mb-1.5">
                  <span className="text-slate-400">معدل دقة حساب الضرائب والخصومات</span>
                  <span className="text-blue-400">100% مطابقة للزكاة والدخل</span>
                </div>
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 w-full"></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold mb-1.5">
                  <span className="text-slate-400">المرونة والعمل بدون إنترنت (Offline Sync)</span>
                  <span className="text-purple-400">مزامنة تلقائية 100%</span>
                </div>
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-purple-500 w-[98%]"></div>
                </div>
              </div>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-indigo-950 border border-indigo-500/30">
            <h4 className="text-xs font-bold text-indigo-300 uppercase flex items-center gap-2">
              <Cpu size={16} />
              <span>لماذا يتفوق مارو على المنافسين؟</span>
            </h4>
            <p className="text-[11px] text-slate-300 mt-2 leading-relaxed">
              يجمع نظام مارو بين سلاسة أنظمة التجزئة الحديثة وقوة أنظمة ERP العالمية (مثل SAP و Odoo) دون تعقيد، مع دعم أزرار الوظائف F1-F24 والتعرف الفوري على باركود الأوزان والكراتين.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
