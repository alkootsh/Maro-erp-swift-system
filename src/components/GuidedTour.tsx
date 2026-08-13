import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { 
  Sparkles, 
  ChevronRight, 
  ChevronLeft, 
  X, 
  CheckCircle2, 
  Compass, 
  HelpCircle,
  RotateCcw,
  Lightbulb
} from 'lucide-react';

export interface TourStep {
  title: string;
  description: string;
  tip?: string;
  highlightSelector?: string;
}

export const TOUR_DATA: Record<string, { pageTitle: string; steps: TourStep[] }> = {
  '/': {
    pageTitle: 'لوحة التحكم الرئيسية',
    steps: [
      {
        title: 'مرحباً بك في لوحة تحكم سويفت ERP',
        description: 'هذه الشاشة تعكس الرؤية الكاملة لمؤسستك من مبيعات، مشتريات، وسيولة نقدية في الوقت الفعلي.',
        tip: 'يمكنك تخصيص المؤشرات الظاهرة من إعدادات لوحة التحكم.'
      },
      {
        title: 'المؤشرات المالية الحية (KPIs)',
        description: 'تابع المبيعات اليومية، أرباح اليوم، والسيولة النقدية المتوفرة بمجرد نظرة سريعة.',
        tip: 'يتم تحديث البيانات تلقائياً بفضل محرك المزامنة اللحظي.'
      },
      {
        title: 'الوصول السريع والإشعارات',
        description: 'استخدم الشاشات المختصرة أعلى الصفحة لإصدار فاتورة سريعة أو معاينة التنبيهات والأخطار المخزنية.',
        tip: 'يمكنك الضغط على زر F1 في أي وقت لفتح الشرح التفصيلي للواجهة.'
      }
    ]
  },
  '/pos': {
    pageTitle: 'نقطة البيع الفائقة (POS)',
    steps: [
      {
        title: 'نقطة البيع السريعة',
        description: 'واجهة بيع مصممة لتحقيق أقصى سرعة معالجة أقل من 50 مللي ثانية مع دعم القراءة الآلية للباركود والميزان.',
        tip: 'تدعم العمل الأوفلاين 100% بدون انقطاع عند غياب الإنترنت.'
      },
      {
        title: 'البحث الشامل والمتقدم',
        description: 'ابحث بالباركود، الاسم، الكود، أو الاسم العربي والانجليزي في وقت واحد.',
        tip: 'اضغط F5 أو اكتب جزءاً من اسم المنتج للوصول الفوري.'
      },
      {
        title: 'مفاتيح الوظائف الفورية (F1 - F24)',
        description: 'نفذ كافة العمليات بنقرة زر واحدة أو اختصار لوحة المفاتيح: الخصم، تعليق الفاتورة، طرق الدفع، والطباعة.',
        tip: 'يمكن للمدير تخصيص تخطيط الأزرار لكل كاشير بشكل منفصل.'
      },
      {
        title: 'خيارات الدفع المتعددة والتقسيم',
        description: 'إمكانية السداد نقداً، شبكة، فيزا، أو تقسيم المبلغ بين أكثر من طريقة دفع بسهولة.',
        tip: 'يدعم النظام طباعة إيصالات الفواتير الحرارية مع كود QR الفاتورة الضريبية.'
      }
    ]
  },
  '/products': {
    pageTitle: 'إدارة المنتجات والمخزون',
    steps: [
      {
        title: 'دليل المنتجات والخدمات',
        description: 'إدارة شاملة لكافة الأصناف، الفئات، وحدات القياس المركبة، وأسعار البيع والتكلفة.',
        tip: 'استخدم استيراد/تصدير Excel لإضافة مئات المنتجات دفعة واحدة.'
      },
      {
        title: 'تتبع الدفعات وتاريخ الصلاحية',
        description: 'دعم كامل لتتبع الأرقام التسلسلية (Serial Number) ورقم التشغيلة (Batch) وتاريخ الانتهاء (Expiry Date).',
        tip: 'يقوم النظام بتنبيهك تلقائياً قبل انقضاء تاريخ الصلاحية.'
      }
    ]
  },
  '/warehouses': {
    pageTitle: 'إدارة المخازن والفروع',
    steps: [
      {
        title: 'تعدد المخازن والمواقع',
        description: 'إدارة الأرصدة في كل مخزن بشكل منفصل مع متابعة التحويلات المخزنية وإذونات الصرف والإضافة.',
        tip: 'تأكد من تحديد المخزن الافتراضي لكل فرع.'
      }
    ]
  },
  '/inventory': {
    pageTitle: 'حركة وحركات المخزون',
    steps: [
      {
        title: 'سجل حركات المخزون',
        description: 'عرض كشف حركة كل صنف من شراء، بيع، تسوية، وترديد لمعرفة مصدر أي تغيير في الرصيد.',
        tip: 'يمكنك فلترة الحركات حسب التاريخ أو نوع الحركة.'
      }
    ]
  },
  '/invoices': {
    pageTitle: 'إدارة المبيعات والفواتير',
    steps: [
      {
        title: 'فواتير المبيعات والعروض',
        description: 'إصدار واستعراض الفواتير الضريبية، عروض الأسعار، وفواتير المبيعات الآجلة والنقدية.',
        tip: 'تستطيع تصدير الفاتورة لـ PDF أو طباعتها مباشرة.'
      }
    ]
  },
  '/returns': {
    pageTitle: 'إدارة المرتجعات',
    steps: [
      {
        title: 'مرتجعات المبيعات والمشتريات',
        description: 'معالجة مرتجعات الفواتير بسهولة مع إعادة المواد للمخزن آلياً وتعديل حسابات العميل/المورد.',
        tip: 'يمكنك إرجاع جزئي أو كلي بناءً على رقم الفاتورة الأصلي.'
      }
    ]
  },
  '/bills': {
    pageTitle: 'إدارة المشتريات والمصروفات',
    steps: [
      {
        title: 'فواتير التوريد والمصروفات',
        description: 'تسجيل أوامر الشراء وفواتير المشتريات من الموردين وتسجيل المصروفات العمومية والإدارية.',
        tip: 'تؤثر فواتير الشراء مباشرة على متوسط تكلفة المخزون وحسابات الموردين.'
      }
    ]
  },
  '/customers': {
    pageTitle: 'إدارة العملاء والائتمان',
    steps: [
      {
        title: 'دليل العملاء والحسابات',
        description: 'إضافة بيانات العملاء، حدود الائتمان، فترات السداد، واستعراض كشف حساب تفصيلي للعميل.',
        tip: 'ينبهك النظام فور تجاوز العميل لحده الائتماني أثناء البيع.'
      }
    ]
  },
  '/suppliers': {
    pageTitle: 'إدارة الموردين',
    steps: [
      {
        title: 'بيانات الموردين والمستحقات',
        description: 'متابعة حسابات الموردين، الأرصدة الدائنة، وجدولات الدفع المستحقة.',
        tip: 'استعرض أرصدة الموردين بضغطة زر واحدة.'
      }
    ]
  },
  '/transactions': {
    pageTitle: 'المحاسبة والقيود المالية',
    steps: [
      {
        title: 'دفتر اليومية وشجرة الحسابات',
        description: 'نظام محاسبي متكامل بقيد مزدوج آلي، يضمن الدقة المالية والتطابق التام للحسابات.',
        tip: 'تُنشأ القيود الآلية مع كل عملية بيع أو شراء أو صرف.'
      }
    ]
  },
  '/reports': {
    pageTitle: 'التقارير والتحليلات الشاملة',
    steps: [
      {
        title: 'مركز تقارير القرارات الذكية',
        description: 'استخرج تقارير الأرباح والخسائر، ميزان المراجعة، حركة المنتجات الأكثر مبيعاً، وتحليلات الذكاء الاصطناعي.',
        tip: 'يمكنك تصدير كافة التقارير بصيغة Excel أو PDF.'
      }
    ]
  },
  '/settings': {
    pageTitle: 'إعدادات النظام العامة',
    steps: [
      {
        title: 'تخصيص النظام والفروع',
        description: 'ضبط معلومات الشعار، الضريبة، الفواتير، والأجهزة الملحقة كالطابعات والشفار.',
        tip: 'قم بحفظ الإعدادات لتطبيقها على جميع الأجهزة المرتبطة.'
      }
    ]
  }
};

const STORAGE_KEY = 'maro_completed_tours_v1';

export const GuidedTour: React.FC = () => {
  const location = useLocation();
  const currentPath = location.pathname;

  const [completedPages, setCompletedPages] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);

  const routeTourData = TOUR_DATA[currentPath] || TOUR_DATA['/'];
  const steps = routeTourData?.steps || [];

  // Check on route change whether to auto-open tour for first time visit
  useEffect(() => {
    if (steps.length > 0 && !completedPages[currentPath]) {
      // Auto open tour for unvisited page
      setCurrentStepIndex(0);
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  }, [currentPath]);

  const markPageAsCompleted = (path: string) => {
    const updated = { ...completedPages, [path]: true };
    setCompletedPages(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to save tour state to localStorage:', e);
    }
  };

  const handleNext = () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
    } else {
      handleFinish();
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
    }
  };

  const handleFinish = () => {
    markPageAsCompleted(currentPath);
    setIsOpen(false);
  };

  const handleSkip = () => {
    markPageAsCompleted(currentPath);
    setIsOpen(false);
  };

  const handleManualStart = () => {
    setCurrentStepIndex(0);
    setIsOpen(true);
  };

  const currentStep = steps[currentStepIndex];

  return (
    <>
      {/* Trigger Button if tour is not open */}
      {!isOpen && (
        <button
          onClick={handleManualStart}
          className="fixed bottom-20 right-6 z-40 bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-3 rounded-full shadow-lg hover:shadow-blue-500/25 transition-all hover:scale-105 flex items-center gap-2 text-xs font-bold border border-blue-400/30 group"
          title="بدء الجولة الإرشادية لهذه الصفحة"
        >
          <Compass size={18} className="animate-spin-slow group-hover:rotate-45 transition-transform" />
          <span className="hidden sm:inline">جولة تفاعلية</span>
        </button>
      )}

      {/* Modal / Tour Spotlight Card */}
      {isOpen && currentStep && (
        <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[#0f172a] border border-blue-500/30 rounded-2xl w-full max-w-lg p-6 shadow-2xl relative overflow-hidden text-right" dir="rtl">
            {/* Background Glow Accent */}
            <div className="absolute -top-16 -right-16 w-36 h-36 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute -bottom-16 -left-16 w-36 h-36 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-md">
                  <Sparkles size={20} />
                </div>
                <div>
                  <div className="text-[11px] font-bold text-blue-400 uppercase tracking-wider">
                    {routeTourData.pageTitle} • جولة تعليمية
                  </div>
                  <h3 className="text-lg font-bold text-white mt-0.5">
                    {currentStep.title}
                  </h3>
                </div>
              </div>
              <button
                onClick={handleSkip}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                title="إغلاق وتخطي الجولة"
              >
                <X size={18} />
              </button>
            </div>

            {/* Step Content */}
            <div className="space-y-4 my-4">
              <p className="text-slate-200 text-sm leading-relaxed">
                {currentStep.description}
              </p>

              {currentStep.tip && (
                <div className="bg-blue-950/40 border border-blue-500/20 rounded-xl p-3.5 flex items-start gap-3">
                  <Lightbulb size={18} className="text-amber-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-blue-200/90 leading-relaxed">
                    <strong className="text-amber-300 font-bold ml-1">نصيحة ذكية:</strong>
                    {currentStep.tip}
                  </p>
                </div>
              )}
            </div>

            {/* Step Dots & Progress */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 mt-6">
              <div className="flex items-center gap-1.5">
                {steps.map((_, idx) => (
                  <div
                    key={idx}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      idx === currentStepIndex
                        ? 'w-6 bg-blue-500'
                        : idx < currentStepIndex
                        ? 'w-2 bg-blue-400/50'
                        : 'w-2 bg-slate-700'
                    }`}
                  />
                ))}
                <span className="text-[11px] font-medium text-slate-400 mr-2">
                  الخطوة {currentStepIndex + 1} من {steps.length}
                </span>
              </div>

              {/* Navigation Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSkip}
                  className="px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors"
                >
                  تخطي الجولة
                </button>

                {currentStepIndex > 0 && (
                  <button
                    onClick={handlePrev}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                  >
                    <ChevronRight size={16} />
                    السابق
                  </button>
                )}

                <button
                  onClick={handleNext}
                  className="px-4 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-md shadow-blue-600/20 transition-all hover:scale-[1.02]"
                >
                  {currentStepIndex === steps.length - 1 ? (
                    <>
                      <CheckCircle2 size={16} />
                      إنهاء وقبول
                    </>
                  ) : (
                    <>
                      التالي
                      <ChevronLeft size={16} />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
