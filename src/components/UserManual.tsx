import React, { useState, useEffect, useRef } from 'react';
import { 
  X, BookOpen, Compass, Sparkles, Shield, User, FileText, Layers, 
  Play, Pause, CheckCircle, Printer, HelpCircle, Activity, Video, Award, Info, RefreshCw
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { manualData } from '../data/userManualContent';
import { getTourForRoute } from '../data/guidedTourContent';
import { useLocation } from 'react-router-dom';

interface UserManualProps {
  isOpen: boolean;
  onClose: () => void;
}

type TabType = 'current' | 'roles' | 'industries' | 'academy' | 'pdf' | 'pdf-dev';

interface TutorialVideo {
  id: string;
  title: string;
  duration: string;
  category: string;
  steps: { title: string; desc: string; screen: string }[];
  narration: string[];
}

export const UserManual: React.FC<UserManualProps> = ({ isOpen, onClose }) => {
  const location = useLocation();
  const screenTour = getTourForRoute(location.pathname);
  const [activeTab, setActiveTab] = useState<TabType>('current');
  const printRef = useRef<HTMLDivElement>(null);

  // Video Academy State
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<string>('cashier_sale');
  const [currentVideoStep, setCurrentVideoStep] = useState(0);
  const [videoProgress, setVideoProgress] = useState(0);

  // Active Screen Content
  const content = manualData[location.pathname] || { 
    title: screenTour.pageTitle || 'دليل استخدام الشاشة', 
    content: `### ${screenTour.pageTitle}\n\n**التصنيف:** ${screenTour.pageCategory}\n\n${screenTour.overview}\n\n### أهم محتويات الشاشة:\n` +
      screenTour.steps.map((s, i) => `${i + 1}. **${s.title}**: ${s.description}`).join('\n\n')
  };

  const handleStartTour = () => {
    onClose();
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('maro:open-tour'));
    }, 100);
  };

  // Video Academy Library
  const tutorials: TutorialVideo[] = [
    {
      id: 'cashier_sale',
      title: 'محاكاة تفاعلية: إتمام عملية بيع وتطبيق ضريبة القيمة المضافة 14%',
      duration: '1:45 دقيقة',
      category: 'المبيعات ونقاط البيع',
      steps: [
        { title: 'بدء الفاتورة ومسح الباركود', desc: 'يقوم الكاشير بفتح نقطة البيع ومسح باركود الصنف (الاستجابة < 20ms)', screen: 'صندوق المنتجات الفوري' },
        { title: 'احتساب ضريبة الـ VAT تلقائياً', desc: 'النظام يحسب ضريبة القيمة المضافة 14% على الإجمالي ويحدث الخصومات المتاحة آلياً', screen: 'بطاقة التلخيص والتحليل المالي' },
        { title: 'اختيار طريقة الدفع وإنهاء المبيعات', desc: 'دفع نقدي أو شبكة، مع ترحيل القيد آلياً للحسابات العامة وتحديث المخزون بنجاح', screen: 'فاتورة مبيعات مرحّلة بنجاح' }
      ],
      narration: [
        "أهلاً بك في أكاديمية مارو. سنقوم بمحاكاة دور كاشير المبيعات. الخطوة الأولى هي مسح الباركود.",
        "النظام الآن يحسب ضريبة القيمة المضافة 14% تلقائياً ويقوم بتحديث السلة فورياً.",
        "تم الدفع بنجاح وترحيل القيود للحسابات العامة وتحديث كارت الصنف في المستودع."
      ]
    },
    {
      id: 'fuel_station_atg',
      title: 'محاكاة تفاعلية: معايرة تانكات الوقود وقراءة الطلمبات',
      duration: '2:30 دقيقة',
      category: 'محطات الوقود والتموين',
      steps: [
        { title: 'أخذ القراءة الافتتاحية للمسدسات', desc: 'تسجيل العداد الافتتاحي لكل مضخة قبل بدء الوردية لضمان الدقة المالية المتكاملة', screen: 'لوحة التحكم بالمضخات والمسدسات' },
        { title: 'تسجيل قراءة مستوى الـ ATG ومستوى المياه الكيميائي', desc: 'تتبع منسوب الوقود الفعلي في التانك وارتفاع الماء المترسب أسفل الخزان', screen: 'نظام إدارة الخزانات التلقائي' },
        { title: 'تسوية عجز التبخر الحراري الطبيعي', desc: 'تطبيق الحسابات الرياضية لاقتطاع عجز التبخر الحراري المسموح به قانونياً وحفظ الوردية', screen: 'شاشة إغلاق الوردية والترحيل المالي' }
      ],
      narration: [
        "سنبدأ الوردية بمطابقة قراءات العدادات الافتتاحية للمسدسات.",
        "يتم الآن جلب قراءة حساسات المنسوب ATG والتحقق من جودة ونقاء الوقود من الماء.",
        "تم احتساب عجز التبخر الطبيعي وترحيل الفروقات دفترياً تلقائياً بدون أي تدخل بشري."
      ]
    },
    {
      id: 'ceramics_lot',
      title: 'محاكاة تفاعلية: جرد مستودع السيراميك والفرز والنخب وحجز البضاعة',
      duration: '2:10 دقيقة',
      category: 'سيراميك وأدوات صحية',
      steps: [
        { title: 'تحديد النخب والفرز واللوط للأصناف', desc: 'تسجيل الصنف مع تحديد فرز أول/ثاني، ورقم اللوط، وحساب التمتير الكلي والوزن', screen: 'بطاقة صنف السيراميك والفرز' },
        { title: 'إنشاء أمر حجز بضاعة مؤقت للعميل', desc: 'حجز كمية محددة من اللوط لمنع بيعها لعميل آخر لحين تأكيد السداد الفعلي للطلب', screen: 'حجز البضاعة المؤقت' },
        { title: 'تحويل أمر الحجز إلى فاتورة مبيعات وسحب مستودعي', desc: 'تأكيد السداد وسحب الكمية بدقة وتحديث الأرصدة وإصدار إذن التسليم آلياً', screen: 'فاتورة مبيعات السيراميك وسحب البضاعة' }
      ],
      narration: [
        "سجل صنف السيراميك الآن مع تحديد رقم اللوط والفرز والوزن الإجمالي للشحنة.",
        "يتم حجز البضاعة مؤقتاً للعميل لضمان عدم بيع نفس اللوط من قبل بائع آخر.",
        "تم دفع الفاتورة وحساب الوزن الكلي للشاحنة لضمان أمان النقل وتأكيد تسليم البضاعة."
      ]
    }
  ];

  const currentVideo = tutorials.find(t => t.id === selectedVideo) || tutorials[0];

  // Simulated Video Player loop
  useEffect(() => {
    let interval: any;
    if (isPlaying) {
      interval = setInterval(() => {
        setVideoProgress(prev => {
          if (prev >= 100) {
            if (currentVideoStep < currentVideo.steps.length - 1) {
              setCurrentVideoStep(curr => curr + 1);
              return 0;
            } else {
              setIsPlaying(false);
              setCurrentVideoStep(0);
              return 0;
            }
          }
          return prev + 4;
        });
      }, 150);
    }
    return () => clearInterval(interval);
  }, [isPlaying, currentVideoStep, selectedVideo]);

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleVideoSelect = (videoId: string) => {
    setSelectedVideo(videoId);
    setCurrentVideoStep(0);
    setVideoProgress(0);
    setIsPlaying(false);
  };

  const handlePrint = () => {
    const printContent = printRef.current?.innerHTML;
    const originalContent = document.body.innerHTML;
    if (printContent) {
      const windowPrint = window.open('', '', 'left=0,top=0,width=800,height=900,toolbar=0,scrollbars=0,status=0');
      if (windowPrint) {
        windowPrint.document.write(`
          <html dir="rtl" lang="ar">
            <head>
              <title>دليل الاستخدام الشامل - منصة مارو للأعمال</title>
              <style>
                body { font-family: system-ui, sans-serif; padding: 40px; color: #1e293b; background: white; line-height: 1.6; }
                h1 { color: #1e3a8a; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px; font-size: 26px; }
                h2 { color: #2563eb; margin-top: 30px; font-size: 20px; border-bottom: 1px solid #f1f5f9; padding-bottom: 6px; }
                h3 { color: #0f172a; font-size: 16px; margin-top: 20px; }
                table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                th, td { border: 1px solid #cbd5e1; padding: 12px; text-align: right; font-size: 13px; }
                th { background-color: #f8fafc; font-weight: bold; }
                .badge { display: inline-block; padding: 3px 8px; border-radius: 4px; font-size: 11px; font-weight: bold; }
                .badge-admin { background: #fee2e2; color: #991b1b; }
                .badge-cashier { background: #dcfce7; color: #166534; }
                .badge-inv { background: #ecfdf5; color: #065f46; }
                .badge-acc { background: #fef3c7; color: #92400e; }
              </style>
            </head>
            <body>
              ${printContent}
            </body>
          </html>
        `);
        windowPrint.document.close();
        windowPrint.focus();
        windowPrint.print();
        windowPrint.close();
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[9999] flex items-center justify-center p-2 sm:p-4 text-right" dir="rtl">
      <div className="bg-[#0b0f19] border border-blue-500/20 rounded-3xl w-full max-w-5xl h-[95vh] sm:h-[88vh] flex flex-col overflow-hidden text-slate-200 shadow-2xl relative">
        <div className="absolute top-0 right-0 w-full h-1.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-amber-500"></div>

        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800/80 flex items-center justify-between gap-4 shrink-0 bg-[#0f1524]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-blue-500/10 border border-blue-500/30 text-blue-400 flex items-center justify-center shadow-lg shadow-blue-500/5 shrink-0">
              <BookOpen size={22} className="animate-pulse" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base lg:text-lg font-black text-white flex items-center gap-2">
                دليل الاستخدام وأكاديمية مارو التفاعلية
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
                  MARO Enterprise Academy v4.0
                </span>
              </h2>
              <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5 font-bold">
                شرح شامل للأدوار والصلاحيات، الأنشطة المتخصصة ومحاكاة عمليات التشغيل خطوة بخطوة
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 sm:p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 border border-slate-800 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Headers */}
        <div className="flex border-b border-slate-800/80 overflow-x-auto bg-[#0a0d17] shrink-0 no-scrollbar">
          <button
            onClick={() => setActiveTab('current')}
            className={`px-4 sm:px-5 py-3 text-xs font-bold transition-all border-b-2 flex items-center gap-2 shrink-0 cursor-pointer ${
              activeTab === 'current' ? 'border-blue-500 text-blue-400 bg-blue-500/5' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText size={14} />
            <span>شرح الشاشة الحالية ({content.title})</span>
          </button>
          <button
            onClick={() => setActiveTab('roles')}
            className={`px-4 sm:px-5 py-3 text-xs font-bold transition-all border-b-2 flex items-center gap-2 shrink-0 cursor-pointer ${
              activeTab === 'roles' ? 'border-blue-500 text-blue-400 bg-blue-500/5' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Shield size={14} />
            <span>الأدوار والصلاحيات للفرع والمؤسسة</span>
          </button>
          <button
            onClick={() => setActiveTab('industries')}
            className={`px-4 sm:px-5 py-3 text-xs font-bold transition-all border-b-2 flex items-center gap-2 shrink-0 cursor-pointer ${
              activeTab === 'industries' ? 'border-blue-500 text-blue-400 bg-blue-500/5' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers size={14} />
            <span>كتالوج وأدلة الأنشطة التجارية</span>
          </button>
          <button
            onClick={() => setActiveTab('academy')}
            className={`px-4 sm:px-5 py-3 text-xs font-bold transition-all border-b-2 flex items-center gap-2 shrink-0 cursor-pointer ${
              activeTab === 'academy' ? 'border-blue-500 text-blue-400 bg-blue-500/5' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Video size={14} />
            <span>الأكاديمية وفيديوهات المحاكاة التفاعلية</span>
          </button>
          <button
            onClick={() => setActiveTab('pdf')}
            className={`px-4 sm:px-5 py-3 text-xs font-bold transition-all border-b-2 flex items-center gap-2 shrink-0 cursor-pointer ${
              activeTab === 'pdf' ? 'border-emerald-500 text-emerald-400 bg-emerald-500/5' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText size={14} />
            <span>دليل العميل التشغيلي (PDF)</span>
          </button>
          <button
            onClick={() => setActiveTab('pdf-dev')}
            className={`px-4 sm:px-5 py-3 text-xs font-bold transition-all border-b-2 flex items-center gap-2 shrink-0 cursor-pointer ${
              activeTab === 'pdf-dev' ? 'border-purple-500 text-purple-400 bg-purple-500/5' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Shield size={14} />
            <span>دليل المبرمج الفني لإعداد النظام (PDF)</span>
          </button>
        </div>

        {/* Tab Body (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[#090d16]">
          {activeTab === 'current' && (
            <div className="space-y-4">
              <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800 text-slate-200 text-sm leading-relaxed">
                <div className="markdown-body">
                  <ReactMarkdown>{content.content}</ReactMarkdown>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  onClick={handleStartTour}
                  className="px-5 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-black flex items-center justify-center gap-2 shadow-lg shadow-blue-600/10 transition-all cursor-pointer"
                >
                  <Compass size={16} />
                  <span>تشغيل المساعد الصوتي التفاعلي لتوجيه هذه الشاشة</span>
                </button>
              </div>
            </div>
          )}

          {activeTab === 'roles' && (
            <div className="space-y-6">
              <div className="bg-blue-500/5 border border-blue-500/20 p-4 rounded-xl text-xs text-blue-300 flex items-start gap-3">
                <Info size={16} className="shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  يحتوي نظام مارو على نظام متطور لإدارة صلاحيات الوصول المعتمد على الأدوار (RBAC). كل مستخدم يرى فقط الشاشات، الحقول، والعمليات المطابقة لدوره الوظيفي. تم برمجتها لمنع تسريب البيانات الحساسة أو التلاعب المحاسبي.
                </p>
              </div>

              {/* Roles Matrix Table */}
              <div className="overflow-x-auto border border-slate-800 rounded-2xl bg-slate-900/40">
                <table className="w-full text-right text-xs">
                  <thead>
                    <tr className="bg-slate-900 border-b border-slate-800 text-slate-300">
                      <th className="p-3.5 font-bold">الدور الوظيفي (Role)</th>
                      <th className="p-3.5 font-bold">الشاشات المسموحة والمحرمة</th>
                      <th className="p-3.5 font-bold">نطاق السيطرة بالفرع</th>
                      <th className="p-3.5 font-bold">الأثر والأمان المالي</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    <tr className="hover:bg-slate-800/30">
                      <td className="p-3.5 font-bold text-red-400">المدير العام (Admin)</td>
                      <td className="p-3.5 text-slate-300">
                        <span className="px-1.5 py-0.5 rounded bg-red-500/10 border border-red-500/20 text-red-300 text-[10px] font-bold">صلاحيات كاملة 100%</span>
                        <p className="text-[10px] text-slate-400 mt-1">كافة إعدادات النظام، التقارير الضريبية، شجرة الحسابات، وقواعد البيانات</p>
                      </td>
                      <td className="p-3.5">الشركة بأكملها (جميع الفروع)</td>
                      <td className="p-3.5 text-slate-400">إشراف واعتماد كافة التسويات والقيود اليومية</td>
                    </tr>
                    <tr className="hover:bg-slate-800/30">
                      <td className="p-3.5 font-bold text-emerald-400">الكاشير / المبيعات (Cashier)</td>
                      <td className="p-3.5 text-slate-300">
                        <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-[10px] font-bold">نقاط البيع (POS) فقط</span>
                        <p className="text-[10px] text-slate-400 mt-1">فقط شاشات البيع المباشر، السلة، تعليق/استدعاء الفواتير وطباعة الإيصال</p>
                      </td>
                      <td className="p-3.5">جهاز الـ POS / الوردية الحالية</td>
                      <td className="p-3.5 text-slate-400">مسؤول عن مطابقة الخزينة النقدية للوردية عند الإقفال</td>
                    </tr>
                    <tr className="hover:bg-slate-800/30">
                      <td className="p-3.5 font-bold text-cyan-400">أمين المخزن (Inventory Manager)</td>
                      <td className="p-3.5 text-slate-300">
                        <span className="px-1.5 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-[10px] font-bold">المخزون والمشتريات</span>
                        <p className="text-[10px] text-slate-400 mt-1">إدخال الأصناف، الجرد، فواتير المشتريات الموردين، والتحويل المستودعي</p>
                      </td>
                      <td className="p-3.5">المستودعات المحددة له</td>
                      <td className="p-3.5 text-slate-400">مسؤول عن مطابقة الجرد الفعلي للمنتجات ومنع الهدر</td>
                    </tr>
                    <tr className="hover:bg-slate-800/30">
                      <td className="p-3.5 font-bold text-amber-400">المحاسب المالي (Accountant)</td>
                      <td className="p-3.5 text-slate-300">
                        <span className="px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[10px] font-bold">الحسابات العامة والقيود</span>
                        <p className="text-[10px] text-slate-400 mt-1">مراجعة قيود اليومية، شجرة الحسابات، تقارير عجز التبخر، الميزان والأرباح</p>
                      </td>
                      <td className="p-3.5">فروع محددة إدارياً</td>
                      <td className="p-3.5 text-slate-400">اعتماد المطابقات والترحيل النهائي لدفتر الأستاذ</td>
                    </tr>
                    <tr className="hover:bg-slate-800/30">
                      <td className="p-3.5 font-bold text-purple-400">حساب المطور (Developer)</td>
                      <td className="p-3.5 text-slate-300">
                        <span className="px-1.5 py-0.5 rounded bg-purple-500/10 border border-purple-500/20 text-purple-300 text-[10px] font-bold">بوابة الصيانة والهيكلية</span>
                        <p className="text-[10px] text-slate-400 mt-1">تعديل كود الـ API، مراقبة اتصالات الشبكة، وإصلاح تجميد الفواتير</p>
                      </td>
                      <td className="p-3.5">المستوى التقني الداخلي</td>
                      <td className="p-3.5 text-slate-400">حماية وتفعيل موديولات الأنشطة وإصلاح الأعطال الطارئة</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'industries' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Ceramics Industry Guide */}
                <div className="bg-[#121826] border border-slate-800 p-5 rounded-2xl relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1.5 h-full bg-amber-500"></div>
                  <h3 className="text-sm font-black text-white flex items-center gap-2 mb-2">
                    🏺 نشاط السيراميك والأدوات الصحية
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed mb-4">
                    مخصص لتفاصيل فرز السيراميك (نخب أول، ثانٍ، ثالث) ورقم اللوط، وتوزيع أوزان البضاعة على الشاحنات مع دعم احتساب التمتير والتحجيم آلياً لمنع الأخطاء الحسابية.
                  </p>
                  <div className="space-y-2 text-[11px]">
                    <div className="flex justify-between border-b border-slate-800/50 pb-1.5 text-slate-300">
                      <span>خطوة الجرد:</span>
                      <span className="font-bold">حسب رقم اللوط والفرز والكرتونة</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-800/50 pb-1.5 text-slate-300">
                      <span>الصلاحية الأساسية:</span>
                      <span className="text-amber-400 font-bold">مبيعات السيراميك + مسؤول المخزن</span>
                    </div>
                  </div>
                </div>

                {/* Food Industry Guide */}
                <div className="bg-[#121826] border border-slate-800 p-5 rounded-2xl relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-500"></div>
                  <h3 className="text-sm font-black text-white flex items-center gap-2 mb-2">
                    🛒 نشاط المواد الغذائية والسوبرماركت
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed mb-4">
                    يدعم قراءة الموازين الإلكترونية وبطاقات الوزن المسبق والترميز السريع للأصناف مع تتبع فوري لتواريخ الانتهاء والصلاحية لتصفية المنتجات الراكدة أو التي أوشكت على الانتهاء.
                  </p>
                  <div className="space-y-2 text-[11px]">
                    <div className="flex justify-between border-b border-slate-800/50 pb-1.5 text-slate-300">
                      <span>تحديث كروت الصنف:</span>
                      <span className="font-bold">تنبيهات تلقائية قبل تاريخ الانتهاء بـ 30 يوم</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-800/50 pb-1.5 text-slate-300">
                      <span>الصلاحية الأساسية:</span>
                      <span className="text-emerald-400 font-bold">كاشير السوبرماركت + أمين المستودع</span>
                    </div>
                  </div>
                </div>

                {/* Electronics Industry Guide */}
                <div className="bg-[#121826] border border-slate-800 p-5 rounded-2xl relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-500"></div>
                  <h3 className="text-sm font-black text-white flex items-center gap-2 mb-2">
                    💻 نشاط الأجهزة والإلكترونيات والصيانة
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed mb-4">
                    يعتمد على تتبع الرقم التسلسلي (Serial Number) الفريد لكل جهاز، إدارة تذاكر ومواعيد الصيانة، وتتبع حالة الضمان والإصلاح في الورشة بشكل لحظي متكامل.
                  </p>
                  <div className="space-y-2 text-[11px]">
                    <div className="flex justify-between border-b border-slate-800/50 pb-1.5 text-slate-300">
                      <span>إدارة الصيانة:</span>
                      <span className="font-bold">أرقام تذاكر تسلسلية وربط قطع الغيار بالمخزن</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-800/50 pb-1.5 text-slate-300">
                      <span>الصلاحية الأساسية:</span>
                      <span className="text-blue-400 font-bold">فني الورشة + موظف المبيعات</span>
                    </div>
                  </div>
                </div>

                {/* Fuel Station Industry Guide */}
                <div className="bg-[#121826] border border-slate-800 p-5 rounded-2xl relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1.5 h-full bg-purple-500"></div>
                  <h3 className="text-sm font-black text-white flex items-center gap-2 mb-2">
                    ⛽ نشاط محطات الوقود والخدمات البترولية
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed mb-4">
                    مصمم للتحكم بذكاء في قراءات المسدسات اليومية، ومعايرة تانكات الوقود، ومطابقتها وحساب فوارق عجز التبخر الحراري الطبيعي آلياً تماشياً مع معايير وزارة البترول.
                  </p>
                  <div className="space-y-2 text-[11px]">
                    <div className="flex justify-between border-b border-slate-800/50 pb-1.5 text-slate-300">
                      <span>معايرة ATG:</span>
                      <span className="font-bold">تتبع وقود بنزين 95/92/80 وسولار مع مستويات المياه</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-800/50 pb-1.5 text-slate-300">
                      <span>الصلاحية الأساسية:</span>
                      <span className="text-purple-400 font-bold">مدير المحطة + محاسب الخزينة</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'academy' && (
            <div className="space-y-6">
              {/* Select Video */}
              <div className="flex gap-2 overflow-x-auto pb-2 border-b border-slate-800">
                {tutorials.map(t => (
                  <button
                    key={t.id}
                    onClick={() => handleVideoSelect(t.id)}
                    className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all shrink-0 cursor-pointer ${
                      selectedVideo === t.id 
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20 border border-blue-500' 
                        : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                    }`}
                  >
                    {t.title.split(':')[0]}: {t.category}
                  </button>
                ))}
              </div>

              {/* Simulated Video Player */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-4">
                  {/* Player Container */}
                  <div className="aspect-video w-full bg-slate-950 rounded-3xl border-2 border-slate-800 shadow-2xl relative overflow-hidden flex flex-col justify-between p-4 group">
                    {/* Top Stats HUD */}
                    <div className="flex justify-between items-center z-10">
                      <span className="text-[10px] font-mono bg-black/60 px-2 py-0.5 rounded-full text-blue-400 border border-blue-500/20">
                        HD 1080p | محاكاة حية
                      </span>
                      <span className="text-[10px] font-bold bg-slate-900/80 px-2 py-0.5 rounded-md text-slate-300">
                        {currentVideo.duration}
                      </span>
                    </div>

                    {/* Animated Screen Preview Simulation depending on active step */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center pointer-events-none">
                      <div className="w-20 h-20 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mb-4 shadow-xl animate-pulse">
                        <Activity size={36} />
                      </div>
                      <span className="text-[10px] text-blue-400 font-bold tracking-widest uppercase">شاشة المعاينة والمحاكاة</span>
                      <h4 className="text-base sm:text-lg font-black text-white mt-1 leading-tight max-w-md">
                        {currentVideo.steps[currentVideoStep].screen}
                      </h4>
                      <p className="text-xs text-slate-400 mt-2 max-w-sm">
                        {currentVideo.steps[currentVideoStep].desc}
                      </p>
                    </div>

                    {/* Bottom Voice / Subtitle Display */}
                    <div className="mt-auto bg-black/80 backdrop-blur-sm border border-slate-800 p-3.5 rounded-2xl z-10 text-center">
                      <div className="flex justify-center items-center gap-1 mb-1">
                        <span className="w-1.5 h-3 bg-blue-500 rounded-full animate-bounce"></span>
                        <span className="w-1.5 h-5 bg-indigo-500 rounded-full animate-bounce" style={{animationDelay:'0.1s'}}></span>
                        <span className="w-1.5 h-2 bg-purple-500 rounded-full animate-bounce" style={{animationDelay:'0.2s'}}></span>
                        <p className="text-xs font-black text-amber-400 mr-2">المساعد الصوتي التفاعلي للتدريب:</p>
                      </div>
                      <p className="text-[11px] text-slate-300 leading-relaxed font-bold">
                        "{currentVideo.narration[currentVideoStep]}"
                      </p>
                    </div>

                    {/* Progress Bar & Controls */}
                    <div className="absolute bottom-0 left-0 w-full h-1 bg-slate-800/80">
                      <div className="bg-blue-500 h-full transition-all duration-150" style={{width: `${videoProgress}%`}}></div>
                    </div>
                  </div>

                  {/* Controller Buttons */}
                  <div className="flex gap-3 justify-center">
                    <button
                      onClick={handlePlayPause}
                      className={`px-6 py-3 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                        isPlaying 
                          ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-lg shadow-amber-600/10' 
                          : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/15'
                      }`}
                    >
                      {isPlaying ? (
                        <>
                          <Pause size={15} />
                          <span>إيقاف مؤقت للمحاكاة</span>
                        </>
                      ) : (
                        <>
                          <Play size={15} />
                          <span>تشغيل المحاكاة التفاعلية</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => {
                        setCurrentVideoStep(0);
                        setVideoProgress(0);
                        setIsPlaying(false);
                      }}
                      className="px-4 py-3 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-2 cursor-pointer"
                    >
                      <RefreshCw size={14} />
                      <span>إعادة التشغيل</span>
                    </button>
                  </div>
                </div>

                {/* Tutorial Steps Breakdown */}
                <div className="space-y-3">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider">خطوات ودور التشغيل:</h3>
                  <div className="space-y-2.5">
                    {currentVideo.steps.map((s, idx) => (
                      <div 
                        key={idx}
                        onClick={() => {
                          setCurrentVideoStep(idx);
                          setVideoProgress(0);
                        }}
                        className={`p-3.5 rounded-2xl border transition-all cursor-pointer text-right ${
                          idx === currentVideoStep 
                            ? 'bg-blue-500/10 border-blue-500/40 text-white' 
                            : 'bg-slate-900/60 border-slate-800/80 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`w-5 h-5 rounded-full flex items-center justify-center font-mono text-[10px] font-bold ${
                            idx === currentVideoStep ? 'bg-blue-500 text-white' : 'bg-slate-800 text-slate-400'
                          }`}>
                            {idx + 1}
                          </span>
                          <h4 className="text-xs font-bold">{s.title}</h4>
                        </div>
                        <p className="text-[10px] leading-relaxed mr-7">{s.desc}</p>
                      </div>
                    ))}
                  </div>

                  <div className="bg-amber-950/20 border border-amber-500/20 p-3.5 rounded-2xl text-[11px] text-amber-200 mt-4">
                    <h4 className="font-bold flex items-center gap-1.5 mb-1 text-amber-400">
                      <Award size={14} />
                      تذكر دائماً:
                    </h4>
                    <p className="leading-relaxed">
                      العملية تفاعلية بالكامل ويتم فيها ترحيل العمليات المالية وتحديث مستويات المخزون تلقائياً دون أي تجميد للنظام.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'pdf' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-3" dir="rtl">
              <div className="bg-emerald-500/5 border border-emerald-500/20 p-4 rounded-2xl text-xs text-emerald-300 flex items-start gap-3">
                <Printer size={18} className="shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  <strong>دليل الاستخدام التشغيلي للعميل (Client Operations Manual):</strong> هذا الدليل منسق باللون الأبيض الناصع وهو جاهز للطباعة الفورية أو الحفظ كملف PDF رسمي لتدريب الموظفين والمستخدمين على الشاشات ومبيعات نقاط البيع والمستودعات والتقارير.
                </p>
              </div>

              {/* Printable Area Box */}
              <div className="bg-white text-slate-900 p-8 rounded-3xl max-h-[50vh] overflow-y-auto border border-slate-300 shadow-2xl" dir="rtl">
                <div ref={printRef}>
                  <div style={{ borderBottom: '3px double #10b981', paddingBottom: '20px', marginBottom: '25px', textAlign: 'center' }}>
                    <h1 style={{ fontSize: '26px', color: '#064e3b', margin: '0 0 10px 0' }}>الدليل التشغيلي المعتمد لمنصة MARO للأعمال v4.0</h1>
                    <p style={{ fontSize: '13px', color: '#4b5563', margin: '0' }}>دليل استخدام شاشات النظام | لمالكي الشركات والمحاسبين ومشغلي نقاط البيع (POS)</p>
                    <p style={{ fontSize: '11px', color: '#9ca3af', marginTop: '5px' }}>وثيقة مرجعية معتمدة من القسم المالي والإداري - تاريخ الإصدار: {new Date().toLocaleDateString('ar-EG')}</p>
                  </div>

                  <h2 style={{ color: '#047857', borderBottom: '1px solid #e5e7eb', paddingBottom: '6px', fontSize: '18px' }}>1. لوحة القيادة الذكية والمؤشرات الرئيسية (Executive Dashboard)</h2>
                  <p style={{ fontSize: '13px', lineHeight: '1.7', color: '#374151' }}>
                    تعد لوحة القيادة هي المركز العصبي وصمام الأمان في <strong>MARO ERP</strong>. تعرض اللوحة تحليلاً بيانياً فورياً وسهلاً للأداء العام للمؤسسة من خلال:
                  </p>
                  <ul style={{ fontSize: '12.5px', lineHeight: '1.7', color: '#4b5563' }}>
                    <li><strong>مؤشر المبيعات اللحظي:</strong> مراقبة المبيعات وتحديث الأرباح فورياً مع خصم الكميات من المخزن دون أي تأخير.</li>
                    <li><strong>حركة المشتريات:</strong> رصد إجمالي المصروفات ومدفوعات الموردين للمحافظة على توازن التدفقات النقدية (Cash Flow).</li>
                    <li><strong>مستوى المخزون والقيمة الرأسمالية:</strong> يعرض القيمة الإجمالية للبضاعة بالمخازن بسعر التكلفة وسعر البيع لبيان هامش الربح المتوقع.</li>
                    <li><strong>التنبيهات الاستباقية:</strong> قائمة تلقائية بالسلع التي أوشكت على انتهاء الصلاحية أو الأصناف الراكدة لتفادي الخسائر وتنشيط حركة البيع.</li>
                  </ul>

                  <h2 style={{ color: '#047857', borderBottom: '1px solid #e5e7eb', paddingBottom: '6px', fontSize: '18px', marginTop: '25px' }}>2. شاشة مبيعات الكاشير ونقاط البيع السريعة (POS Terminal)</h2>
                  <p style={{ fontSize: '13px', lineHeight: '1.7', color: '#374151' }}>
                    شاشة الـ POS في مارو مصممة لتكون الأسرع على الإطلاق لتلبية ضغط العملاء في الهايبرماركت ومحلات التجزئة الكبرى:
                  </p>
                  <ul style={{ fontSize: '12.5px', lineHeight: '1.7', color: '#4b5563' }}>
                    <li><strong>مسح الباركود السريع (Barcode):</strong> استجابة فائقة تقل عن 20 مللي ثانية للتعرف على الأصناف تلقائياً وإضافتها لسلة البيع.</li>
                    <li><strong>مفاتيح الوظائف السريعة (F1 - F24):</strong> تتيح تشغيل العمليات مباشرة عبر لوحة المفاتيح دون لمس الماوس (مثال: تعليق الفاتورة، ترحيل، جلب عميل، الخصم المباشر).</li>
                    <li><strong>احتساب ضريبة القيمة المضافة الذكية (VAT 14%):</strong> يقوم النظام بتوزيع الضريبة على الأصناف الخاضعة وحساب الصافي والضريبة الشاملة تلقائياً وبأعلى دقة مالية.</li>
                    <li><strong>طرق الدفع المتعددة:</strong> يدعم الدفع النقدي (Cash)، الدفع بالفيزا والشبكة (Card)، والبيع الآجل لعملاء الذمم، بالإضافة إلى الدفع المجزأ (Split Payment).</li>
                  </ul>

                  <h2 style={{ color: '#047857', borderBottom: '1px solid #e5e7eb', paddingBottom: '6px', fontSize: '18px', marginTop: '25px' }}>3. إدارة الأصناف والمستودعات والأنشطة المتنوعة (Inventory & Industries)</h2>
                  <p style={{ fontSize: '13px', lineHeight: '1.7', color: '#374151' }}>
                    منظومة مارو تدعم إدارة المخازن المتعددة وتهيئ خصائصها حسب نشاطك التجاري:
                  </p>
                  <ul style={{ fontSize: '12.5px', lineHeight: '1.7', color: '#4b5563' }}>
                    <li><strong>أقسام السيراميك والأدوات الصحية🏺:</strong> تتبع الأصناف حسب الفرز (نخب أول/ثانٍ)، رقم اللوط (Lot Number)، وحساب التمتير والوزن الإجمالي لتوزيع الأحمال على الشاحنات.</li>
                    <li><strong>المواد الغذائية والسوبرماركت🛒:</strong> قراءة موازين الباركود الإلكترونية تلقائياً وتتبع تواريخ الصلاحية وتدقيق الهدر اليومي.</li>
                    <li><strong>الأجهزة الإلكترونية والصيانة💻:</strong> تتبع الأرقام التسلسلية الفريدة (Serial Numbers) للأجهزة لمنع التزوير، وإدارة تذاكر الصيانة الدورية وحالات الضمان.</li>
                    <li><strong>محطات الوقود والتموين⛽:</strong> جرد مستوى التانكات عبر ATG، مطابقة قراءة عدادات المسدسات، واحتساب نسبة عجز التبخر الطبيعي وترحيل القيود آلياً.</li>
                  </ul>

                  <h2 style={{ color: '#047857', borderBottom: '1px solid #e5e7eb', paddingBottom: '6px', fontSize: '18px', marginTop: '25px' }}>4. مركز التقارير والإقفالات المالية (Financial & Audits)</h2>
                  <p style={{ fontSize: '13px', lineHeight: '1.7', color: '#374151' }}>
                    يوفر النظام تقارير مالية وتفصيلية تضاهي الأنظمة العالمية المعتمدة:
                  </p>
                  <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '15px', fontSize: '12px' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#f0fdf4', fontWeight: 'bold' }}>
                        <th style={{ border: '1px solid #d1d5db', padding: '10px', textAlign: 'right' }}>اسم التقرير</th>
                        <th style={{ border: '1px solid #d1d5db', padding: '10px', textAlign: 'right' }}>الهدف والغرض منه</th>
                        <th style={{ border: '1px solid #d1d5db', padding: '10px', textAlign: 'right' }}>الفئة المستهدفة للتشغيل</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td style={{ border: '1px solid #d1d5db', padding: '10px' }}><strong>كشف المبيعات والأرباح</strong></td>
                        <td style={{ border: '1px solid #d1d5db', padding: '10px' }}>متابعة مبيعات الفروع وهوامش الأرباح الإجمالية والصافية ومعدل دوران السلع.</td>
                        <td style={{ border: '1px solid #d1d5db', padding: '10px' }}>الإدارة العليا، مالكي الشركات</td>
                      </tr>
                      <tr>
                        <td style={{ border: '1px solid #d1d5db', padding: '10px' }}><strong>حركة كارت الصنف التفصيلي</strong></td>
                        <td style={{ border: '1px solid #d1d5db', padding: '10px' }}>تتبع حركة الصنف (وارد/صادر) ورصيد المستودع لتفادي عجز المخزون أو تكدس البضاعة.</td>
                        <td style={{ border: '1px solid #d1d5db', padding: '10px' }}>أمين المخزن، إدارة المشتريات</td>
                      </tr>
                      <tr>
                        <td style={{ border: '1px solid #d1d5db', padding: '10px' }}><strong>تقرير الحسابات القيادي وميزان المراجعة</strong></td>
                        <td style={{ border: '1px solid #d1d5db', padding: '10px' }}>التأكد من توازن شجرة القيود المحاسبية، وتدقيق حسابات الأستاذ العام ومطابقتها.</td>
                        <td style={{ border: '1px solid #d1d5db', padding: '10px' }}>المحاسب المالي، المدير المالي</td>
                      </tr>
                    </tbody>
                  </table>

                  <h2 style={{ color: '#047857', borderBottom: '1px solid #e5e7eb', paddingBottom: '6px', fontSize: '18px', marginTop: '25px' }}>5. النسخ الاحتياطي ومشاركة شيت الأصناف (Data Administration)</h2>
                  <p style={{ fontSize: '13px', lineHeight: '1.7', color: '#374151' }}>
                    يقوم النظام بحفظ بياناتك محلياً بشكل فوري لضمان التشغيل دون اتصال بالإنترنت (Offline-First). نوصي بالدخول أسبوعياً إلى صفحة الإعدادات وتنزيل "النسخة الاحتياطية" للنظام والاحتفاظ بها في مكان آمن، كما يمكنك استخدام ملفات Excel لتصدير أو استيراد وتحديث أسعار وأرصدة المنتجات فورياً دون أي عناء.
                  </p>
                </div>
              </div>

              {/* PDF Action Buttons */}
              <div className="flex gap-3 justify-center">
                <button
                  onClick={handlePrint}
                  className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black flex items-center gap-2 shadow-lg shadow-emerald-600/15 cursor-pointer transition-all active:scale-95"
                >
                  <Printer size={15} />
                  <span>بدء طباعة دليل العميل أو حفظه كـ PDF 📄</span>
                </button>
              </div>
            </div>
          )}

          {activeTab === 'pdf-dev' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-3" dir="rtl">
              <div className="bg-purple-500/5 border border-purple-500/20 p-4 rounded-2xl text-xs text-purple-300 flex items-start gap-3">
                <Shield size={18} className="shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  <strong>دليل إعداد النظام الفني للمبرمج (Developer Setup Manual):</strong> هذا الدليل الفني مخصص لمهندسي الدعم الفني والمبرمجين لشرح خطوات تثبيت وتهيئة وإطلاق النظام محلياً على جهاز العميل وتوصيله بالطابعات والموازين وقواعد البيانات بأمان وسرية تامة.
                </p>
              </div>

              {/* Printable Area Box */}
              <div className="bg-white text-slate-900 p-8 rounded-3xl max-h-[50vh] overflow-y-auto border border-slate-300 shadow-2xl" dir="rtl">
                <div ref={printRef}>
                  <div style={{ borderBottom: '3px double #7c3aed', paddingBottom: '20px', marginBottom: '25px', textAlign: 'center' }}>
                    <h1 style={{ fontSize: '26px', color: '#4c1d95', margin: '0 0 10px 0' }}>دليل التثبيت والتهيئة الفنية لمهندس النظام (Maro Systems v4.0)</h1>
                    <p style={{ fontSize: '13px', color: '#4b5563', margin: '0' }}>دليل المطور والمبرمج لإعداد وتشغيل المنصة على أجهزة العميل (Local Server Deployment)</p>
                    <p style={{ fontSize: '11px', color: '#9ca3af', marginTop: '5px' }}>وثيقة مرجعية تقنية سرية - موجهة لفريق الصيانة والدعم الفني الميداني</p>
                  </div>

                  <h2 style={{ color: '#6d28d9', borderBottom: '1px solid #e5e7eb', paddingBottom: '6px', fontSize: '18px' }}>1. المتطلبات والبيئة التقنية الأساسية (System Requirements & Environment)</h2>
                  <p style={{ fontSize: '13px', lineHeight: '1.7', color: '#374151' }}>
                    تعمل منصة <strong>MARO Business Platform</strong> كمنظومة هجينة فائقة الأداء (Full-Stack Express + React). لتثبيتها محلياً كخادم تشغيل رئيسي في فرع العميل، يرجى تهيئة المواصفات التالية:
                  </p>
                  <ul style={{ fontSize: '12.5px', lineHeight: '1.7', color: '#4b5563' }}>
                    <li><strong>بيئة العمل الأساسية:</strong> تثبيت إصدار Node.js LTS (إصدار 18 أو أحدث) على جهاز العميل.</li>
                    <li><strong>مستعرض الويب:</strong> نوصي باستخدام Google Chrome أو Microsoft Edge في وضع ملء الشاشة (Kiosk Mode) لتوفير أسرع تجربة لبيع الكاشير.</li>
                    <li><strong>حسابات الصيانة المحمية:</strong> يحتوي النظام على حساب مطور داخلي مشفر محمي لا يمكن حذفه، للوصول وبث التعديلات المباشرة وإصلاح تجميد العمليات المحاسبية.</li>
                  </ul>

                  <h2 style={{ color: '#6d28d9', borderBottom: '1px solid #e5e7eb', paddingBottom: '6px', fontSize: '18px', marginTop: '25px' }}>2. إعداد قاعدة البيانات وتأمين البيانات (Database & Offline Storage Engine)</h2>
                  <p style={{ fontSize: '13px', lineHeight: '1.7', color: '#374151' }}>
                    يعتمد النظام على هندسة <strong>Offline-First Architecture</strong> لضمان استقرار العمل عند انقطاع التيار الكهربائي أو شبكة الإنترنت:
                  </p>
                  <ul style={{ fontSize: '12.5px', lineHeight: '1.7', color: '#4b5563' }}>
                    <li><strong>التخزين المحلي اللحظي:</strong> تحفظ البيانات محلياً في ذاكرة التخزين المؤمنة بالمتصفح بشكل متناسق مع الحسابات، مما يمنع فقدان أي فاتورة تم حفظها من قبل الكاشير.</li>
                    <li><strong>قاعدة البيانات المركزية (PostgreSQL):</strong> يتم تفعيلها لربط شبكة الفروع وحفظ البيانات التراكمية، مع حظر حفظ أي بيانات محاسبية أو مالية حساسة في قواعد البيانات العامة الخارجية للمحافظة على أسرار العميل التجارية.</li>
                    <li><strong>محرك المزامنة التلقائي (Sync Engine):</strong> يقوم بترحيل ومزامنة الفواتير المحلية مع الخادم السحابي بمجرد عودة الاتصال دون الحاجة لتدخل الكاشير وبسرعة استجابة فائقة.</li>
                  </ul>

                  <h2 style={{ color: '#6d28d9', borderBottom: '1px solid #e5e7eb', paddingBottom: '6px', fontSize: '18px', marginTop: '25px' }}>3. إعداد الأجهزة الملحقة وربطها بالبرنامج (Hardware Setup & Drivers)</h2>
                  <p style={{ fontSize: '13px', lineHeight: '1.7', color: '#374151' }}>
                    لربط ملحقات الكاشير والـ POS بنجاح، يرجى اتباع الخطوات الفنية التالية:
                  </p>
                  <ul style={{ fontSize: '12.5px', lineHeight: '1.7', color: '#4b5563' }}>
                    <li><strong>طابعة الفواتير الحرارية (Thermal Printer 80mm):</strong> ضبط إعدادات تخطيط الصفحة وتحديد الهوامش لتكون "بلا هوامش" (Margins: None) لضمان طباعة الإيصال وقارئ الكود QR بشكل متناسق وثابت.</li>
                    <li><strong>قارئ الباركود (USB/Wireless Barcode Scanner):</strong> يتم توصيل القارئ مباشرة ليعمل كمحاكاة للوحة المفاتيح (HID Keyboard Emulation)، ليدعم النظام التقاط الأكواد بسرعة تامة.</li>
                    <li><strong>الموازين الإلكترونية وبطاقات الوزن:</strong> تهيئة كود البادئة لقراءة الأكواد مسبقة الوزن المتوافقة مع موازين السوبرماركت واستخلاص الوزن والسعر المباشر بدقة متناهية.</li>
                  </ul>

                  <h2 style={{ color: '#6d28d9', borderBottom: '1px solid #e5e7eb', paddingBottom: '6px', fontSize: '18px', marginTop: '25px' }}>4. التهيئة البرمجية والتشغيل (Compilation & Running)</h2>
                  <p style={{ fontSize: '13px', lineHeight: '1.7', color: '#374151' }}>
                    خطوات سحب وبناء وتثبيت ملفات النظام على سيرفر العميل الداخلي:
                  </p>
                  <div style={{ backgroundColor: '#f5f5f5', padding: '15px', borderRadius: '10px', fontFamily: 'Courier New, monospace', fontSize: '12px', direction: 'ltr', textAlign: 'left', border: '1px solid #e5e7eb' }}>
                    # 1. تثبيت حزم التبعيات والموديولات البرمجية<br/>
                    npm install<br/><br/>
                    # 2. تشغيل النظام في وضع التطوير والاختبار المحلي<br/>
                    npm run dev<br/><br/>
                    # 3. بناء وتجميع كود الإنتاج عالي الكفاءة والسرعة<br/>
                    npm run build<br/><br/>
                    # 4. إطلاق خادم السيرفر ليعمل كـ Service دائمة التشغيل في الخلفية<br/>
                    npm run start
                  </div>

                  <h2 style={{ color: '#6d28d9', borderBottom: '1px solid #e5e7eb', paddingBottom: '6px', fontSize: '18px', marginTop: '25px' }}>5. استكشاف الأخطاء وإصلاحها وإجراءات الطوارئ (Troubleshooting Guides)</h2>
                  <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '15px', fontSize: '12px' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#f5f3ff', fontWeight: 'bold' }}>
                        <th style={{ border: '1px solid #d1d5db', padding: '10px', textAlign: 'right' }}>المشكلة الفنية</th>
                        <th style={{ border: '1px solid #d1d5db', padding: '10px', textAlign: 'right' }}>السبب المحتمل</th>
                        <th style={{ border: '1px solid #d1d5db', padding: '10px', textAlign: 'right' }}>الحل التقني السريع</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td style={{ border: '1px solid #d1d5db', padding: '10px' }}><strong>عدم تعرف قارئ الباركود على الأصناف</strong></td>
                        <td style={{ border: '1px solid #d1d5db', padding: '10px' }}>لغة لوحة مفاتيح نظام التشغيل ويندوز مضبوطة على اللغة العربية بدلاً من الإنجليزية أثناء مسح الكود.</td>
                        <td style={{ border: '1px solid #d1d5db', padding: '10px' }}>تغيير لغة الإدخال الافتراضية للجهاز إلى EN-US أو تفعيل خاصية الـ USB Scanner البديلة في شاشة الكاشير.</td>
                      </tr>
                      <tr>
                        <td style={{ border: '1px solid #d1d5db', padding: '10px' }}><strong>خطأ في طباعة باركود الـ QR الحراري</strong></td>
                        <td style={{ border: '1px solid #d1d5db', padding: '10px' }}>تعريف الطابعة غير مجهز لاستقبال رسوميات أو الحجم المحدد للورق أصغر من 80 مم.</td>
                        <td style={{ border: '1px solid #d1d5db', padding: '10px' }}>تحديث تعريف الطابعة الحرارية وتأكيد حجم الورق 80mm x Receipt في تفاصيل الطباعة.</td>
                      </tr>
                      <tr>
                        <td style={{ border: '1px solid #d1d5db', padding: '10px' }}><strong>تأخر استجابة جلب البيانات من الفروع</strong></td>
                        <td style={{ border: '1px solid #d1d5db', padding: '10px' }}>انقطاع خط الإنترنت الرئيسي أو ضعف إشارة سيرفر الشبكة المحلية بالفرع.</td>
                        <td style={{ border: '1px solid #d1d5db', padding: '10px' }}>يفعل النظام وضع Offline-First تلقائياً؛ قم بترحيل القيود المحلية لاحقاً بمجرد عودة الاتصال.</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* PDF Action Buttons */}
              <div className="flex gap-3 justify-center">
                <button
                  onClick={handlePrint}
                  className="px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-black flex items-center gap-2 shadow-lg shadow-purple-600/15 cursor-pointer transition-all active:scale-95"
                >
                  <Printer size={15} />
                  <span>بدء طباعة دليل المطور أو حفظه كـ PDF 📄</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800/80 flex items-center justify-between gap-3 bg-[#0a0d17] shrink-0">
          <span className="text-[10px] text-slate-500 font-bold font-mono">© 2026 MARO Systems. All rights reserved.</span>
          <button 
            onClick={onClose} 
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            إغلاق نافذة الأكاديمية
          </button>
        </div>
      </div>
    </div>
  );
};
