// MARO ERP - Enterprise First Run Wizard Modal
import React, { useState } from 'react';
import { Sparkles, Database, ArrowRight, ShieldCheck, CheckCircle2, Loader2, Building2, Package, Users, ShoppingBag, Utensils, Zap, HelpCircle, LayoutGrid, Check } from 'lucide-react';
import { DemoDataSeeder } from '../services/demoDataSeeder';

interface FirstRunWizardProps {
  onComplete: () => void;
}

export const FirstRunWizard: React.FC<FirstRunWizardProps> = ({ onComplete }) => {
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: Size, 2: Industry, 3: Generation
  const [businessSize, setBusinessSize] = useState<'small' | 'enterprise'>('enterprise');
  const [industry, setIndustry] = useState<'ceramics' | 'food' | 'electronics' | 'all'>('all');
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('جاهز لإعداد بيئة العمل التجريبية المتكاملة...');

  const handleNextStep = () => {
    if (step < 2) {
      setStep(step + 1);
    } else {
      handleCreateDemo();
    }
  };

  const handleCreateDemo = async () => {
    setLoading(true);
    setStep(3);
    try {
      await DemoDataSeeder.generateDemoData(businessSize, industry, (prog, stat) => {
        setProgress(prog);
        setStatusText(stat);
      });
      setTimeout(() => {
        setLoading(false);
        onComplete();
      }, 1000);
    } catch (err) {
      console.error(err);
      setLoading(false);
      alert('حدث خطأ أثناء توليد البيانات التجريبية');
    }
  };

  const handleStartEmpty = () => {
    localStorage.setItem('maro_business_size', businessSize);
    localStorage.setItem('maro_business_industry', industry);
    DemoDataSeeder.markFirstRunCompleted();
    onComplete();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#111625] border border-blue-500/20 rounded-3xl max-w-2xl w-full shadow-2xl relative overflow-hidden text-right" dir="rtl">
        <div className="absolute top-0 right-0 w-full h-1.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-amber-500"></div>

        <div className="p-8 space-y-6 relative">
          {/* Top-Right Close/Exit button */}
          <button 
            onClick={onComplete}
            className="absolute top-5 left-5 text-slate-500 hover:text-white text-base font-bold transition-colors w-8 h-8 rounded-full bg-slate-900/60 border border-slate-800/80 flex items-center justify-center cursor-pointer z-10"
            title="خروج وإنهاء"
          >
            ✕
          </button>

          {/* Header */}
          <div className="flex items-center gap-4 border-b border-slate-800/60 pb-5">
            <div className="w-14 h-14 bg-blue-500/10 border border-blue-500/30 text-blue-400 rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-blue-500/10">
              <Sparkles size={28} className="animate-pulse" />
            </div>
            <div className="flex-1">
              <span className="px-2.5 py-0.5 bg-blue-500/20 text-blue-400 rounded-full text-[10px] font-black font-mono">
                MARO ENTERPRISE PLATFORM v4.0
              </span>
              <h2 className="text-xl font-black text-white tracking-tight mt-1">مساعد تهيئة وإعداد النظام الذكي</h2>
              <p className="text-[11px] text-slate-400 mt-0.5">خطوات مخصصة لبناء بيئة عمل مثالية تلائم نشاطك وحجم أعمالك</p>
            </div>
            {step < 3 && (
              <span className="text-xs text-slate-500 font-bold ml-6">الخطوة {step} من 2</span>
            )}
          </div>

          {/* STEP 1: CHOOSE BUSINESS SIZE */}
          {step === 1 && (
            <div className="space-y-4 animate-in fade-in duration-300">
              <div className="space-y-1">
                <h3 className="text-sm font-black text-white">١. حدد حجم أعمال مؤسستك أو متجرك:</h3>
                <p className="text-xs text-slate-400">يتكيف مظهر ووظائف النظام تلقائياً لإبراز الأدوات الأكثر ملائمة لمتطلبات حجم التشغيل.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Small Shop Card */}
                <button
                  type="button"
                  onClick={() => setBusinessSize('small')}
                  className={`p-5 rounded-2xl text-right border transition-all flex flex-col justify-between gap-4 relative group ${
                    businessSize === 'small' 
                      ? 'bg-blue-600/10 border-blue-500 shadow-lg shadow-blue-500/5' 
                      : 'bg-[#151b2b] border-[#1e293b] hover:border-[#334155]'
                  }`}
                >
                  {businessSize === 'small' && (
                    <div className="absolute top-3 left-3 bg-blue-500 text-white p-1 rounded-full">
                      <Check size={12} className="stroke-[3]" />
                    </div>
                  )}
                  <div className="space-y-1">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-colors ${
                      businessSize === 'small' ? 'bg-blue-500/20 border-blue-500 text-blue-400' : 'bg-slate-800/40 border-slate-700 text-slate-400'
                    }`}>
                      <ShoppingBag size={20} />
                    </div>
                    <h4 className="text-xs font-black text-white mt-2">محل تجاري / نقطة بيع مستقلة (Small Shop)</h4>
                    <p className="text-[10px] text-slate-400 leading-relaxed">
                      للأنشطة الصغيرة، ومحلات التجزئة المستقلة. يركز النظام بالكامل على تفعيل واجهة <strong className="text-blue-400">Smart Cashier المصغرة</strong> والـ POS المدمج، مع تبسيط القوائم الجانبية لتجنب أي تعقيد غير مبرر.
                    </p>
                  </div>
                </button>

                {/* Large Enterprise Card */}
                <button
                  type="button"
                  onClick={() => setBusinessSize('enterprise')}
                  className={`p-5 rounded-2xl text-right border transition-all flex flex-col justify-between gap-4 relative group ${
                    businessSize === 'enterprise' 
                      ? 'bg-blue-600/10 border-blue-500 shadow-lg shadow-blue-500/5' 
                      : 'bg-[#151b2b] border-[#1e293b] hover:border-[#334155]'
                  }`}
                >
                  {businessSize === 'enterprise' && (
                    <div className="absolute top-3 left-3 bg-blue-500 text-white p-1 rounded-full">
                      <Check size={12} className="stroke-[3]" />
                    </div>
                  )}
                  <div className="space-y-1">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-colors ${
                      businessSize === 'enterprise' ? 'bg-blue-500/20 border-blue-500 text-blue-400' : 'bg-slate-800/40 border-slate-700 text-slate-400'
                    }`}>
                      <Building2 size={20} />
                    </div>
                    <h4 className="text-xs font-black text-white mt-2">مؤسسة كبرى / فروع متعددة (Enterprise ERP)</h4>
                    <p className="text-[10px] text-slate-400 leading-relaxed">
                      للشركات والأنشطة المتوسطة والكبرى ذات السلاسل والشركات القابضة. يتيح النظام واجهة <strong className="text-indigo-400">Advanced ERP المتكاملة</strong>؛ بما تشمله من تصنيع (MRP)، فروع مستقلة، إدارة أصول، وأمن سيبراني متقدم.
                    </p>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: CHOOSE INDUSTRY SECTOR */}
          {step === 2 && (
            <div className="space-y-4 animate-in fade-in duration-300">
              <div className="space-y-1">
                <h3 className="text-sm font-black text-white">٢. حدد القطاع التجاري الرئيسي لنشاطك:</h3>
                <p className="text-xs text-slate-400">سيقوم النظام بتوليد عينات بضائع ومقاييس حقيقية وصيغ فواتير متخصصة تلائم طبيعة القطاع المختار.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {/* Ceramics Industry */}
                <button
                  type="button"
                  onClick={() => setIndustry('ceramics')}
                  className={`p-4 rounded-xl text-right border transition-all flex items-start gap-3 relative ${
                    industry === 'ceramics' 
                      ? 'bg-blue-600/10 border-blue-500' 
                      : 'bg-[#151b2b] border-[#1e293b] hover:border-[#334155]'
                  }`}
                >
                  <div className={`p-2.5 rounded-lg border shrink-0 ${
                    industry === 'ceramics' ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' : 'bg-slate-800 border-slate-700 text-slate-400'
                  }`}>
                    <LayoutGrid size={18} />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-white">السيراميك والأدوات الصحية</h4>
                    <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                      توليد منتجات ببيانات تفصيلية كالمتر المربع، درجات ألوان اللوت (Tones)، الفرز الأول والثاني وسلاسل الأدوات الصحية الفاخرة.
                    </p>
                  </div>
                </button>

                {/* Food Industry */}
                <button
                  type="button"
                  onClick={() => setIndustry('food')}
                  className={`p-4 rounded-xl text-right border transition-all flex items-start gap-3 relative ${
                    industry === 'food' 
                      ? 'bg-blue-600/10 border-blue-500' 
                      : 'bg-[#151b2b] border-[#1e293b] hover:border-[#334155]'
                  }`}
                >
                  <div className={`p-2.5 rounded-lg border shrink-0 ${
                    industry === 'food' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-slate-800 border-slate-700 text-slate-400'
                  }`}>
                    <Utensils size={18} />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-white">المواد الغذائية والسوبرماركت</h4>
                    <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                      توليد منتجات التجزئة اليومية السريعة (FMCG) بالباركود الدولي، وإعداد الخزائن وحسابات الدائنين التموينية المناسبة.
                    </p>
                  </div>
                </button>

                {/* Electronics */}
                <button
                  type="button"
                  onClick={() => setIndustry('electronics')}
                  className={`p-4 rounded-xl text-right border transition-all flex items-start gap-3 relative ${
                    industry === 'electronics' 
                      ? 'bg-blue-600/10 border-blue-500' 
                      : 'bg-[#151b2b] border-[#1e293b] hover:border-[#334155]'
                  }`}
                >
                  <div className={`p-2.5 rounded-lg border shrink-0 ${
                    industry === 'electronics' ? 'bg-purple-500/10 border-purple-500/30 text-purple-400' : 'bg-slate-800 border-slate-700 text-slate-400'
                  }`}>
                    <Zap size={18} />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-white">الأجهزة الكهربائية والإلكترونيات</h4>
                    <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                      توليد أصناف تتبع الأرقام التسلسلية (Serial Numbers)، وبطاقات الضمان الطويلة وحساب تكاليف الصيانة وخدمة العملاء.
                    </p>
                  </div>
                </button>

                {/* All Industries */}
                <button
                  type="button"
                  onClick={() => setIndustry('all')}
                  className={`p-4 rounded-xl text-right border transition-all flex items-start gap-3 relative ${
                    industry === 'all' 
                      ? 'bg-blue-600/10 border-blue-500' 
                      : 'bg-[#151b2b] border-[#1e293b] hover:border-[#334155]'
                  }`}
                >
                  <div className={`p-2.5 rounded-lg border shrink-0 ${
                    industry === 'all' ? 'bg-blue-500/10 border-blue-500/30 text-blue-400' : 'bg-slate-800 border-slate-700 text-slate-400'
                  }`}>
                    <Database size={18} />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-white">منظومة شاملة لجميع القطاعات</h4>
                    <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                      مزيج شامل يغطي كافة المجالات لتجربة تداخل الأعمال وتوزيع المستودعات وحساب الأرصدة المتكاملة في آن واحد.
                    </p>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: LOADING GENERATION STATUS */}
          {step === 3 && (
            <div className="py-8 space-y-6 text-center animate-in fade-in duration-300">
              <div className="w-20 h-20 bg-blue-500/10 border border-blue-500/30 text-blue-400 rounded-full flex items-center justify-center mx-auto shadow-xl animate-pulse">
                <Loader2 size={36} className="animate-spin text-blue-400" />
              </div>
              <div className="space-y-3">
                <h3 className="text-sm font-black text-white">{statusText}</h3>
                <div className="w-full bg-[#1e293b] rounded-full h-3 overflow-hidden border border-[#1e293b] max-w-md mx-auto">
                  <div 
                    className="bg-gradient-to-l from-blue-500 to-indigo-500 h-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
                <span className="text-xs font-mono text-blue-400 font-bold">{progress}% مكتمل</span>
              </div>

              <div className="pt-4">
                <button
                  onClick={handleStartEmpty}
                  className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl font-bold text-xs transition-all border border-slate-800 cursor-pointer mx-auto block"
                >
                  تخطي والبدء بالمنظومة فوراً ✕
                </button>
              </div>
            </div>
          )}

          {/* Navigation Controls */}
          {step < 3 && (
            <div className="flex items-center gap-3 pt-4 border-t border-slate-800/60">
              {step > 1 && (
                <button
                  type="button"
                  onClick={() => setStep(step - 1)}
                  className="px-5 py-3.5 bg-[#151b2b] hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl font-bold text-xs transition-all border border-[#1e293b] cursor-pointer"
                >
                  السابق
                </button>
              )}
              <button
                onClick={handleNextStep}
                className="flex-1 py-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-black text-xs uppercase transition-all shadow-lg shadow-blue-600/10 flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
              >
                <span>{step === 1 ? 'متابعة لاختيار القطاع الرئيسي' : 'تأكيد وإنشاء البيئة التجريبية'}</span>
                <ArrowRight size={16} className="rotate-180" />
              </button>
              <button
                onClick={handleStartEmpty}
                className="px-5 py-3.5 bg-[#151b2b] hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl font-bold text-xs transition-all border border-[#1e293b] cursor-pointer"
              >
                بدء بدون بيانات
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
