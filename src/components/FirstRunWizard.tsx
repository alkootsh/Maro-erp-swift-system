// MARO ERP - Enterprise First Run Wizard Modal
import React, { useState } from 'react';
import { Sparkles, Database, ArrowRight, ShieldCheck, CheckCircle2, Loader2, Building2, Package, Users } from 'lucide-react';
import { DemoDataSeeder } from '../services/demoDataSeeder';

interface FirstRunWizardProps {
  onComplete: () => void;
}

export const FirstRunWizard: React.FC<FirstRunWizardProps> = ({ onComplete }) => {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('جاهز لإعداد بيئة العمل التجريبية المتكاملة...');

  const handleCreateDemo = async () => {
    setLoading(true);
    try {
      await DemoDataSeeder.generateDemoData((prog, stat) => {
        setProgress(prog);
        setStatusText(stat);
      });
      setTimeout(() => {
        setLoading(false);
        onComplete();
      }, 800);
    } catch (err) {
      console.error(err);
      setLoading(false);
      alert('حدث خطأ أثناء توليد البيانات التجريبية');
    }
  };

  const handleStartEmpty = () => {
    DemoDataSeeder.markFirstRunCompleted();
    onComplete();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#151b2b] border border-amber-500/30 rounded-3xl max-w-2xl w-full shadow-2xl relative overflow-hidden text-right" dir="rtl">
        <div className="absolute top-0 right-0 w-full h-1.5 bg-gradient-to-r from-amber-500 via-red-500 to-indigo-600"></div>

        <div className="p-8 space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-amber-500/10">
              <Sparkles size={32} />
            </div>
            <div>
              <span className="px-3 py-1 bg-amber-500/20 text-amber-400 rounded-full text-xs font-bold font-mono">
                MARO ENTERPRISE v4.0
              </span>
              <h2 className="text-2xl font-black text-white tracking-tight mt-1">مرحباً بك في منصة مارو للأعمال (MARO ERP)</h2>
              <p className="text-xs text-slate-400 mt-0.5">نظام إدارة المؤسسات المتطور والمدعوم بالذكاء الاصطناعي</p>
            </div>
          </div>

          {!loading ? (
            <div className="space-y-6">
              <div className="bg-[#1e293b]/70 border border-[#334155] rounded-2xl p-5 space-y-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Database size={18} className="text-amber-400" />
                  خيارات بدء التشغيل الأول
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  النظام جاهز تماماً. يوصى بشدة بإنشاء <strong className="text-amber-400">البيئة التجريبية المتكاملة</strong> لتمكينك فوراً من تجربة نقاط البيع، المستودعات، الحسابات، التقارير والعملاء دون الحاجة لإدخال بيانات يدوية.
                </p>

                <div className="grid grid-cols-3 gap-3 pt-2">
                  <div className="bg-[#151b2b] border border-[#334155] rounded-xl p-3 text-center">
                    <Building2 size={20} className="mx-auto text-indigo-400 mb-1" />
                    <span className="text-[11px] font-bold text-white block">شركات وفروع</span>
                    <span className="text-[10px] text-slate-400">متعددة المستويات</span>
                  </div>
                  <div className="bg-[#151b2b] border border-[#334155] rounded-xl p-3 text-center">
                    <Package size={20} className="mx-auto text-emerald-400 mb-1" />
                    <span className="text-[11px] font-bold text-white block">250+ منتج</span>
                    <span className="text-[10px] text-slate-400">بالباركود الدولي</span>
                  </div>
                  <div className="bg-[#151b2b] border border-[#334155] rounded-xl p-3 text-center">
                    <Users size={20} className="mx-auto text-amber-400 mb-1" />
                    <span className="text-[11px] font-bold text-white block">عملاء وموردين</span>
                    <span className="text-[10px] text-slate-400">وحركات مالية</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={handleCreateDemo}
                  className="flex-1 py-4 bg-gradient-to-r from-amber-500 to-red-600 hover:from-amber-400 hover:to-red-500 text-white rounded-2xl font-black text-sm uppercase tracking-wider transition-all shadow-lg shadow-amber-600/20 flex items-center justify-center gap-2 active:scale-95"
                >
                  <Sparkles size={18} />
                  إنشاء البيئة التجريبية (يوصى به)
                </button>
                <button
                  onClick={handleStartEmpty}
                  className="px-6 py-4 bg-[#1e293b] hover:bg-[#334155] text-slate-300 rounded-2xl font-bold text-xs transition-all border border-[#334155]"
                >
                  ابدأ بقاعدة فارغة
                </button>
              </div>
            </div>
          ) : (
            <div className="py-8 space-y-6 text-center">
              <div className="w-20 h-20 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-full flex items-center justify-center mx-auto shadow-xl animate-pulse">
                <Loader2 size={36} className="animate-spin text-amber-400" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-white">{statusText}</h3>
                <div className="w-full bg-[#1e293b] rounded-full h-3 overflow-hidden border border-[#334155] max-w-md mx-auto">
                  <div 
                    className="bg-gradient-to-r from-amber-500 to-red-500 h-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
                <span className="text-xs font-mono text-amber-400 font-bold">{progress}% مكتمل</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
