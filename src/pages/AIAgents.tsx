/**
 * @file AIAgents.tsx
 * @module واجهات وصفحات النظام (UI Pages)
 * @description ملف جزء من نظام MARO ERP. الوظيفة: AIAgents.tsx.
 */
// MARO ERP - Autonomous Enterprise AI Agent Suite & Clinical Pharmacy Triage Engine
// Master Enterprise Modular Protocol v4.0

import React, { useState, useEffect, useRef } from 'react';
import { 
  Bot, 
  BrainCircuit, 
  Sparkles, 
  Send, 
  CheckCircle2, 
  Zap,
  TrendingUp,
  PackageSearch,
  MessageSquare,
  ShieldAlert,
  AlertTriangle,
  HeartPulse,
  Pill,
  Thermometer,
  Wind,
  Activity,
  Flame,
  Volume2,
  VolumeX,
  ShoppingCart,
  Printer,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Stethoscope,
  Info,
  Check,
  Building2,
  DollarSign,
  ArrowRight,
  FileCheck,
  ShieldCheck,
  Clock
} from 'lucide-react';
import { cn, formatCurrency } from '../lib/utils';
import { PharmacyAITriageEngine, TriageCondition, TriageAssessmentResult } from '../lib/pharmacyAITriageEngine';
import { AIEngine, AIMessage, AIContext } from '../components/AIAgent/AIEngine';
import { MaroEventBus } from '../lib/eventBus';
import { useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import toast from 'react-hot-toast';

type AgentModuleTab = 'pharmacy_triage' | 'cfo' | 'inventory' | 'copilot_chat';

export const AIAgents: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<AgentModuleTab>('pharmacy_triage');

  // --- 1. Clinical Pharmacy Triage Agent State ---
  const [selectedConditionId, setSelectedConditionId] = useState<string>('cold_flu');
  const [triageStep, setTriageStep] = useState<number>(0);
  const [answers, setAnswers] = useState<Record<string, string>>({
    'patient_profile': 'adult_healthy',
    'chronic_diseases': 'hypertension', // Default showcasing blood pressure cold safety
    'symptom_nature': 'congestion_bodyache',
    'symptom_duration': '1_2_days'
  });
  const [assessmentResult, setAssessmentResult] = useState<TriageAssessmentResult | null>(null);
  const [freeTextComplaint, setFreeTextComplaint] = useState<string>('');
  const [isTriageAnalyzing, setIsTriageAnalyzing] = useState<boolean>(false);
  const [isSpeakingTriage, setIsSpeakingTriage] = useState<boolean>(false);

  // --- 2. Copilot Chat State ---
  const [chatMessages, setChatMessages] = useState<AIMessage[]>([
    {
      role: 'assistant',
      content: `مرحباً بك! أنا وكيل الذكاء الاصطناعي المؤسسي لنظام MARO ERP.
أنا لست مجرد شات بوت عادي، بل وكيل تنفيذي قادر على:
1. **الاستشارة والتوجيه الصيدلاني السريري**: طرح الأسئلة التشخيصية وتحديد الأدوية الآمنة OTC لمختلف الحالات وتجنب التداخلات الخطرة لمرضى الضغط والحوامل.
2. **التحليل المالي ورقابة التكاليف**: التنبؤ بالسيولة واكتشاف تضخم المصروفات.
3. **التنبؤ بسلاسل الإمداد**: حساب موعد نفاد المخزون واقتراح أوامر شراء.
4. **تنفيذ الأوامر الحقيقية**: إنشاء فواتير، البحث في المنتجات، والتنقل بين الشاشات.

كيف يمكنني مساعدتك الآن؟`,
      timestamp: new Date().toISOString()
    }
  ]);
  const [chatPrompt, setChatPrompt] = useState<string>('');
  const [isChatProcessing, setIsChatProcessing] = useState<boolean>(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, activeTab]);

  // Run initial triage calculation on load
  useEffect(() => {
    handleRunTriageEvaluation(selectedConditionId, answers);
  }, [selectedConditionId]);

  // Evaluate clinical case
  const handleRunTriageEvaluation = (conditionId: string, currentAnswers: Record<string, string>) => {
    setIsTriageAnalyzing(true);
    setTimeout(() => {
      const result = PharmacyAITriageEngine.evaluateClinicalCase(conditionId, currentAnswers);
      setAssessmentResult(result);
      setIsTriageAnalyzing(false);
    }, 350);
  };

  // Handle selecting an answer option
  const handleSelectOption = (questionId: string, value: string) => {
    const newAnswers = { ...answers, [questionId]: value };
    setAnswers(newAnswers);
    handleRunTriageEvaluation(selectedConditionId, newAnswers);
  };

  // Natural language symptom parser
  const handleAnalyzeFreeText = () => {
    if (!freeTextComplaint.trim()) return;
    setIsTriageAnalyzing(true);

    setTimeout(() => {
      const text = freeTextComplaint.toLowerCase();
      let targetCond = selectedConditionId;
      const detectedAnswers: Record<string, string> = { ...answers };

      if (text.includes('كحة') || text.includes('سعال') || text.includes('بلغم') || text.includes('صدر')) {
        targetCond = 'cough_wet_dry';
        setSelectedConditionId('cough_wet_dry');
        if (text.includes('بلغم') || text.includes('مخاط')) {
          detectedAnswers['cough_type'] = 'wet_cough';
        } else {
          detectedAnswers['cough_type'] = 'dry_cough';
        }
      } else if (text.includes('برد') || text.includes('زكام') || text.includes('رشح') || text.includes('انفلونزا')) {
        targetCond = 'cold_flu';
        setSelectedConditionId('cold_flu');
      } else if (text.includes('حموضة') || text.includes('معد') || text.includes('حرقان') || text.includes('مغص')) {
        targetCond = 'gerd_gastric';
        setSelectedConditionId('gerd_gastric');
      }

      if (text.includes('ضغط') || text.includes('هايبرتنشن')) {
        detectedAnswers['chronic_diseases'] = 'hypertension';
      } else if (text.includes('قرحة') || text.includes('نزيف معدة')) {
        detectedAnswers['chronic_diseases'] = 'ulcer';
      } else if (text.includes('ربو') || text.includes('حساسية صدر')) {
        detectedAnswers['chronic_diseases'] = 'asthma';
      }

      if (text.includes('حامل') || text.includes('حمل')) {
        detectedAnswers['patient_profile'] = 'pregnant';
      } else if (text.includes('طفل') || text.includes('سنتين') || text.includes('سنوات')) {
        detectedAnswers['patient_profile'] = 'child';
      }

      setAnswers(detectedAnswers);
      handleRunTriageEvaluation(targetCond, detectedAnswers);
      toast.success('تم تحليل شكوى المريض واستخراج محددات الحالة السريرية بنجاح!');
    }, 600);
  };

  // Text-To-Speech for clinical advice
  const handleSpeakTriageAdvice = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      toast.error('المتصفح لا يدعم التوليد الصوتي');
      return;
    }

    if (isSpeakingTriage) {
      window.speechSynthesis.cancel();
      setIsSpeakingTriage(false);
      return;
    }

    if (!assessmentResult) return;

    let textToSpeak = `التشخيص الموجه: ${assessmentResult.clinicalDiagnosis}. `;
    if (assessmentResult.contraindications.length > 0) {
      textToSpeak += `تنبيهات الأمان الهامة: ${assessmentResult.contraindications.join(' و ')}. `;
    }
    textToSpeak += `الأدوية الموصى بها تشمل: ${assessmentResult.safeMedications.map(m => m.name + ' ' + m.dosage).join(' وكذلك ')}.`;

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.lang = 'ar-SA';
    utterance.rate = 0.95;

    utterance.onend = () => setIsSpeakingTriage(false);
    utterance.onerror = () => setIsSpeakingTriage(false);

    setIsSpeakingTriage(true);
    window.speechSynthesis.speak(utterance);
  };

  // Send prescribed medicines directly to POS
  const handleSendToPOS = () => {
    if (!assessmentResult || assessmentResult.safeMedications.length === 0) return;
    
    // Publish intent to POS via EventBus
    MaroEventBus.publish('TRANSFER_RX_TO_POS', {
      items: assessmentResult.safeMedications.map(m => ({
        name: m.name,
        price: m.unitPrice,
        quantity: 1,
        barcode: m.barcode,
        dosage: m.dosage
      }))
    });

    toast.success(`تم تحويل ${assessmentResult.safeMedications.length} أصناف دوائية بنجاح إلى شاشة الكاشير / POS!`);
    setTimeout(() => {
      navigate('/pos');
    }, 600);
  };

  // Send Chat message
  const handleSendChatMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!chatPrompt.trim() || isChatProcessing) return;

    const userText = chatPrompt.trim();
    setChatPrompt('');
    setIsChatProcessing(true);

    const userMsg: AIMessage = {
      role: 'user',
      content: userText,
      timestamp: new Date().toISOString()
    };
    setChatMessages(prev => [...prev, userMsg]);

    const context: AIContext = {
      screen: '/ai-agents',
      user: { email: 'admin@maro-erp.com', role: 'admin' },
      branch: 'الفرع الرئيسي',
      warehouse: 'المستودع المركزي',
      isOffline: !navigator.onLine
    };

    try {
      const response = await AIEngine.processMessage(userText, context);
      setChatMessages(prev => [...prev, response]);
    } catch (err: any) {
      setChatMessages(prev => [...prev, {
        role: 'assistant',
        content: `عذراً، حدث خطأ أثناء الاتصال بالوكيل: ${err.message || 'يرجى المحاولة ثانية'}.`,
        timestamp: new Date().toISOString()
      }]);
    } finally {
      setIsChatProcessing(false);
    }
  };

  const currentQuestions = PharmacyAITriageEngine.getTriageQuestions(selectedConditionId);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12" dir="rtl">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-950 via-[#151b2b] to-[#0f172a] p-6 rounded-3xl border border-blue-900/40 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none -translate-x-1/2 -translate-y-1/2"></div>
        <div className="relative z-10 space-y-2">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-gradient-to-r from-blue-500/20 to-indigo-500/20 text-blue-400 font-bold text-xs border border-blue-500/30 flex items-center gap-1.5 shadow-sm">
              <Sparkles size={14} className="text-amber-400" />
              وكلاء الذكاء الاصطناعي المستقلين (Autonomous AI Agent Suite v4.0)
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-[11px] border border-emerald-500/30">
              Gemini 3.7 Flash Engine
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight flex items-center gap-3">
            <Bot className="text-blue-400" size={32} />
            وكيل الذكاء الاصطناعي المؤسسي لـ MARO
          </h1>
          <p className="text-xs md:text-sm text-slate-300 max-w-2xl leading-relaxed">
            محرك ذكاء متكامل يتجاوز المحادثات التقليدية إلى التشخيص والتوجيه السريري الصيدلاني، الرقابة المالية، التنبؤ بسلاسل الإمداد، والتنفيذ الفوري للعمليات.
          </p>
        </div>

        <div className="relative z-10 flex flex-wrap items-center gap-3">
          <div className="bg-[#0b0f1a]/80 backdrop-blur-md px-4 py-3 rounded-2xl border border-slate-800 flex items-center gap-3 shadow-lg">
            <BrainCircuit className="text-indigo-400 animate-pulse" size={26} />
            <div>
              <p className="text-[11px] text-slate-400">حالة التفكير والاستجابة</p>
              <p className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                جاهز للتوجيه والتنفيذ السريري
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-[#0f172a] p-2 rounded-2xl border border-slate-800/80 shadow-lg">
        <button
          onClick={() => setActiveTab('pharmacy_triage')}
          className={cn(
            "py-3 px-4 rounded-xl font-bold text-xs md:text-sm transition-all flex items-center justify-center gap-2 text-center",
            activeTab === 'pharmacy_triage'
              ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-600/20"
              : "bg-[#151b2b] text-slate-400 hover:text-white hover:bg-slate-800"
          )}
        >
          <Stethoscope size={18} className={activeTab === 'pharmacy_triage' ? "animate-bounce" : ""} />
          <span>الوكيل الصيدلاني السريري (Clinical Triage)</span>
        </button>

        <button
          onClick={() => setActiveTab('cfo')}
          className={cn(
            "py-3 px-4 rounded-xl font-bold text-xs md:text-sm transition-all flex items-center justify-center gap-2 text-center",
            activeTab === 'cfo'
              ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-600/20"
              : "bg-[#151b2b] text-slate-400 hover:text-white hover:bg-slate-800"
          )}
        >
          <TrendingUp size={18} />
          <span>المدير المالي والرقابي (AI CFO)</span>
        </button>

        <button
          onClick={() => setActiveTab('inventory')}
          className={cn(
            "py-3 px-4 rounded-xl font-bold text-xs md:text-sm transition-all flex items-center justify-center gap-2 text-center",
            activeTab === 'inventory'
              ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-600/20"
              : "bg-[#151b2b] text-slate-400 hover:text-white hover:bg-slate-800"
          )}
        >
          <PackageSearch size={18} />
          <span>وكيل سلاسل الإمداد (Supply Chain)</span>
        </button>

        <button
          onClick={() => setActiveTab('copilot_chat')}
          className={cn(
            "py-3 px-4 rounded-xl font-bold text-xs md:text-sm transition-all flex items-center justify-center gap-2 text-center",
            activeTab === 'copilot_chat'
              ? "bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-lg shadow-amber-600/20"
              : "bg-[#151b2b] text-slate-400 hover:text-white hover:bg-slate-800"
          )}
        >
          <MessageSquare size={18} />
          <span>المساعد التنفيذي والشات الذكي</span>
        </button>
      </div>

      {/* --- TAB 1: CLINICAL PHARMACY TRIAGE AGENT --- */}
      {activeTab === 'pharmacy_triage' && (
        <div className="space-y-6">
          {/* Top Quick Natural Language Complaint Bar */}
          <div className="bg-[#151b2b] p-5 rounded-3xl border border-emerald-500/30 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
                  <Stethoscope size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">شكوى المريض المباشرة (Natural Language Complaint Bar)</h3>
                  <p className="text-[11px] text-slate-400">اكتب أو الصق ما يشتكي منه المريض وسيقوم الوكيل بتوجيهك فوراً بالأسئلة السريرية اللازمة</p>
                </div>
              </div>
              <span className="text-[11px] bg-emerald-500/10 text-emerald-300 px-3 py-1 rounded-full border border-emerald-500/20">
                بروتوكول OTC الطبي المعتمد
              </span>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={freeTextComplaint}
                onChange={(e) => setFreeTextComplaint(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAnalyzeFreeText()}
                placeholder="مثال: جه مريض بيشتكي من نزلة برد شديدة وتكسير بالجسم وعنده ضغط دم مرتفع..."
                className="flex-1 bg-[#0b0f1a] border border-slate-700 rounded-2xl px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
              />
              <button
                onClick={handleAnalyzeFreeText}
                disabled={isTriageAnalyzing || !freeTextComplaint.trim()}
                className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-2xl font-bold text-xs md:text-sm flex items-center gap-2 transition-all shadow-lg shadow-emerald-600/20"
              >
                <Sparkles size={16} />
                <span>تحليل الحالة وتوجيه الصيدلي</span>
              </button>
            </div>
          </div>

          {/* Condition Selectors */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-400 flex items-center gap-2">
              <HeartPulse size={16} className="text-emerald-400" />
              اختر الشكوى الرئيسية أو اضغط على أحد السيناريوهات السريرية الشائعة:
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {PharmacyAITriageEngine.availableConditions.map(cond => (
                <button
                  key={cond.id}
                  onClick={() => {
                    setSelectedConditionId(cond.id);
                    setFreeTextComplaint(cond.samplePatientComplaint);
                  }}
                  className={cn(
                    "p-3.5 rounded-2xl border text-right transition-all flex flex-col justify-between gap-2 relative overflow-hidden",
                    selectedConditionId === cond.id
                      ? "bg-gradient-to-b from-emerald-950/80 to-[#151b2b] border-emerald-500 shadow-lg shadow-emerald-500/10 text-white"
                      : "bg-[#151b2b] border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-800/80"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-emerald-400 font-mono font-bold">{cond.category}</span>
                    {selectedConditionId === cond.id && (
                      <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400"></span>
                    )}
                  </div>
                  <h5 className="font-bold text-xs leading-snug">{cond.name}</h5>
                  <p className="text-[10px] text-slate-400 line-clamp-2">{cond.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Interactive Guided Questions & Live Clinical Prescription Result Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left/Main Column: Guided Triage Questions */}
            <div className="lg:col-span-6 space-y-4">
              <div className="bg-[#151b2b] p-6 rounded-3xl border border-slate-800 shadow-xl space-y-5">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
                      <Stethoscope size={18} />
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-sm">أسئلة التوجيه السريري (Interactive Triage Protocol)</h4>
                      <p className="text-[11px] text-slate-400">حدد إجابات أسئلة المريض لتوليد التوصية الطبية والتحقق من الأمان</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setAnswers({
                        'patient_profile': 'adult_healthy',
                        'chronic_diseases': 'none',
                        'symptom_nature': 'congestion_bodyache',
                        'symptom_duration': '1_2_days'
                      });
                      handleRunTriageEvaluation(selectedConditionId, {
                        'patient_profile': 'adult_healthy',
                        'chronic_diseases': 'none',
                        'symptom_nature': 'congestion_bodyache',
                        'symptom_duration': '1_2_days'
                      });
                    }}
                    className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 text-xs flex items-center gap-1"
                    title="إعادة ضبط الاختيارات"
                  >
                    <RotateCcw size={14} />
                    <span>إعادة ضبط</span>
                  </button>
                </div>

                <div className="space-y-5">
                  {currentQuestions.map((q, qIdx) => (
                    <div key={q.id} className="space-y-2.5">
                      <label className="text-xs font-bold text-slate-200 flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px] font-bold">
                          {qIdx + 1}
                        </span>
                        {q.text}
                      </label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {q.options.map((opt) => {
                          const isSelected = answers[q.id] === opt.value;
                          return (
                            <button
                              key={opt.value}
                              onClick={() => handleSelectOption(q.id, opt.value)}
                              className={cn(
                                "p-3 rounded-2xl border text-right transition-all flex flex-col justify-between gap-1 text-xs",
                                isSelected
                                  ? (opt.isHighRisk 
                                      ? "bg-amber-950/60 border-amber-500 text-amber-200 shadow-md"
                                      : "bg-emerald-950/60 border-emerald-500 text-emerald-100 shadow-md")
                                  : "bg-[#0b0f1a] border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-900"
                              )}
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-bold">{opt.label}</span>
                                {isSelected && <Check size={14} className={opt.isHighRisk ? "text-amber-400" : "text-emerald-400"} />}
                              </div>
                              {opt.description && (
                                <p className="text-[10px] text-slate-400 leading-tight">{opt.description}</p>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column: Clinical Assessment & Recommended Safe Medicines */}
            <div className="lg:col-span-6 space-y-4">
              {assessmentResult && (
                <div className="bg-[#151b2b] p-6 rounded-3xl border border-slate-800 shadow-2xl space-y-5">
                  {/* Result Header */}
                  <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={cn(
                          "px-2.5 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1",
                          assessmentResult.severityLevel === 'HIGH_DOCTOR_REFERRAL'
                            ? "bg-red-500/20 text-red-400 border-red-500/30"
                            : assessmentResult.severityLevel === 'MODERATE_MONITORED'
                            ? "bg-amber-500/20 text-amber-400 border-amber-500/30"
                            : "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                        )}>
                          {assessmentResult.severityLevel === 'HIGH_DOCTOR_REFERRAL' ? '🚨 تستدعي تحويل طبيب' : assessmentResult.severityLevel === 'MODERATE_MONITORED' ? '⚠️ حالة خاصة تحت المتابعة' : '✅ آمن للصرف المباشر OTC'}
                        </span>
                      </div>
                      <h4 className="font-bold text-white text-base">{assessmentResult.conditionTitle}</h4>
                      <p className="text-xs text-slate-400 mt-0.5">{assessmentResult.patientSummary}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleSpeakTriageAdvice}
                        className={cn(
                          "p-2.5 rounded-xl border transition-all flex items-center gap-1.5 text-xs font-bold",
                          isSpeakingTriage
                            ? "bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse"
                            : "bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700 hover:text-white"
                        )}
                        title="قراءة التوجيهات صوتياً للصيدلي"
                      >
                        {isSpeakingTriage ? <VolumeX size={16} /> : <Volume2 size={16} />}
                        <span className="hidden sm:inline">{isSpeakingTriage ? 'إيقاف الصوت' : 'استماع صوتي'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Red Flags Alert if present */}
                  {assessmentResult.redFlags.length > 0 && (
                    <div className="p-4 rounded-2xl bg-red-950/40 border border-red-500/40 text-red-300 text-xs space-y-1.5">
                      <div className="font-bold flex items-center gap-2 text-red-200">
                        <AlertTriangle size={16} />
                        علامات الخطر (Clinical Red Flags):
                      </div>
                      <ul className="list-disc list-inside space-y-1 text-[11px] text-red-200/80">
                        {assessmentResult.redFlags.map((flag, i) => (
                          <li key={i}>{flag}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Contraindications Warning */}
                  {assessmentResult.contraindications.length > 0 && (
                    <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-500/40 text-amber-200 text-xs space-y-1.5">
                      <div className="font-bold flex items-center gap-2">
                        <ShieldAlert size={16} className="text-amber-400" />
                        محاذير الأمان وموانع الاستعمال الدوائية (Contraindications):
                      </div>
                      <div className="text-[11px] text-amber-200/90 leading-relaxed">
                        {assessmentResult.contraindications.map((c, i) => (
                          <p key={i}>{c}</p>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Prescribed Medications list from Pharmacy Inventory */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h5 className="text-xs font-bold text-white flex items-center gap-2">
                        <Pill size={16} className="text-emerald-400" />
                        البروتوكول الدوائي المقترح من واقع مخزون صيدلية MARO:
                      </h5>
                      <span className="text-[11px] font-mono text-emerald-400 font-bold">
                        {assessmentResult.safeMedications.length} أصناف جاهزة للصرف
                      </span>
                    </div>

                    <div className="space-y-2.5">
                      {assessmentResult.safeMedications.map(med => (
                        <div key={med.id} className="p-3.5 bg-[#0b0f1a] rounded-2xl border border-slate-800 hover:border-slate-700 transition-all flex flex-col gap-2">
                          <div className="flex items-center justify-between">
                            <div>
                              <h6 className="font-bold text-white text-xs md:text-sm">{med.name}</h6>
                              <p className="text-[10px] text-emerald-400 font-mono">{med.genericName}</p>
                            </div>
                            <div className="text-left">
                              <span className="text-xs font-bold text-white">{formatCurrency(med.unitPrice)}</span>
                              <span className="block text-[9px] text-slate-400">{med.shelfLocation}</span>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-2 bg-[#151b2b] p-2 rounded-xl text-[11px]">
                            <div>
                              <span className="text-slate-400 block text-[10px]">الجرعة المحددة:</span>
                              <span className="text-slate-200 font-medium">{med.dosage}</span>
                            </div>
                            <div>
                              <span className="text-slate-400 block text-[10px]">المدة والتوقيت:</span>
                              <span className="text-slate-200 font-medium">{med.duration} ({med.timing})</span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-1 border-t border-slate-800/80 text-[10px] text-slate-400">
                            <span className="flex items-center gap-1 text-slate-300">
                              <ShieldCheck size={12} className="text-emerald-400" />
                              {med.safetyReason}
                            </span>
                            <span className="font-mono text-slate-500">باركود: {med.barcode}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Non-Pharmacological Advice */}
                  {assessmentResult.nonPharmAdvice.length > 0 && (
                    <div className="p-3.5 bg-blue-950/20 border border-blue-500/20 rounded-2xl space-y-1.5">
                      <span className="text-xs font-bold text-blue-300 flex items-center gap-1.5">
                        <Info size={14} />
                        إرشادات العناية المنزلية ونمط الحياة للمريض:
                      </span>
                      <ul className="text-[11px] text-slate-300 space-y-1 list-disc list-inside">
                        {assessmentResult.nonPharmAdvice.map((adv, i) => (
                          <li key={i}>{adv}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Action Buttons: Transfer to POS, Print, or View in Pharmacy */}
                  <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
                    <button
                      onClick={handleSendToPOS}
                      className="w-full sm:flex-1 py-3 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-2xl font-bold text-xs md:text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition-all hover:scale-[1.02]"
                    >
                      <ShoppingCart size={18} />
                      <span>صرف الروشتة وتحويلها فوراً لكاشير الصيدلية (POS)</span>
                    </button>

                    <button
                      onClick={() => navigate('/pharmacy')}
                      className="w-full sm:w-auto py-3 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-all border border-slate-700"
                    >
                      <Pill size={16} />
                      <span>فتح شاشة الصيدلية والأرفف</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* --- TAB 2: AI CFO & FINANCIAL AUDITOR --- */}
      {activeTab === 'cfo' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-[#151b2b] p-5 rounded-3xl border border-red-500/30 shadow-xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="p-2.5 bg-red-500/20 text-red-400 rounded-2xl">
                  <AlertTriangle size={20} />
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 bg-red-500/10 text-red-300 rounded-full border border-red-500/20">
                  تنبؤ عالي الأهمية
                </span>
              </div>
              <h4 className="font-bold text-white text-sm">مخاطر السيولة النقدية (Cash Flow Gap)</h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                توقع عجز سيولة متوقع بقيمة 45,000 ريال خلال الـ 15 يوماً القادمة نتيجة استحقاق شيكات موردين قبل تحصيل آجال العملاء.
              </p>
              <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">الحل المقترح: جدولة سداد 3 فواتير توريد</span>
                <button 
                  onClick={() => {
                    toast.success('تمت جدولة وتأجيل الدفعات بالتنسيق مع الحسابات الدائنة');
                  }}
                  className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold transition-colors"
                >
                  إعادة جدولة
                </button>
              </div>
            </div>

            <div className="bg-[#151b2b] p-5 rounded-3xl border border-emerald-500/30 shadow-xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-2xl">
                  <TrendingUp size={20} />
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 bg-emerald-500/10 text-emerald-300 rounded-full border border-emerald-500/20">
                  فرصة تعظيم أرباح
                </span>
              </div>
              <h4 className="font-bold text-white text-sm">أعلى هوامش الربحية (Margin Optimization)</h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                مكملات الفيتامينات ومنتجات العناية بالبشرة تحقق هامش ربح 42% مقارنة بـ 15% للأدوية المسعرة جبرياً. نقترح زيادة واجهة العرض لها.
              </p>
              <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">الأثر المالي المتوقع: +18,500 ريال/شهر</span>
                <button 
                  onClick={() => navigate('/products')}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-colors"
                >
                  تعديل خطة العرض
                </button>
              </div>
            </div>

            <div className="bg-[#151b2b] p-5 rounded-3xl border border-amber-500/30 shadow-xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="p-2.5 bg-amber-500/20 text-amber-400 rounded-2xl">
                  <ShieldAlert size={20} />
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 bg-amber-500/10 text-amber-300 rounded-full border border-amber-500/20">
                  كشف شذوذ تدقيقي
                </span>
              </div>
              <h4 className="font-bold text-white text-sm">شذوذ في مصاريف الصيانة والضيافة</h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                ارتفاع مصاريف الصيانة لفرع الرياض بنسبة 135% عن المتوسط الربع سنوي. تم تحديد 4 فواتير تحتاج مراجعة قبل اعتمادها.
              </p>
              <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">حالة الاعتماد: معلقة للمراجعة</span>
                <button 
                  onClick={() => navigate('/bills')}
                  className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold transition-colors"
                >
                  فحص الفواتير
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- TAB 3: AI SUPPLY CHAIN & INVENTORY PREDICTOR --- */}
      {activeTab === 'inventory' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Stockout Predictions */}
            <div className="bg-[#151b2b] p-6 rounded-3xl border border-slate-800 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-white text-sm flex items-center gap-2">
                  <AlertTriangle className="text-red-400" size={18} />
                  تنبؤات بنفاد المخزون الحرج (Predicted Stockouts)
                </h4>
                <span className="text-[11px] bg-red-500/10 text-red-400 px-2.5 py-0.5 rounded-full font-bold">
                  خلال 7 أيام
                </span>
              </div>
              <div className="space-y-3">
                {[
                  { name: 'بانادول أدفانس 500 مجم أقراص', currentStock: 14, daysLeft: 3, dailyBurn: 5, supplier: 'شركة فارما العالمية' },
                  { name: 'كونكور 5 مجم (Concor 5mg)', currentStock: 8, daysLeft: 4, dailyBurn: 2, supplier: 'المتحدة للتوزيع الدوائي' },
                  { name: 'أوميبرازول 20 مجم كبسول', currentStock: 12, daysLeft: 5, dailyBurn: 3, supplier: 'ابن سينا فارما' }
                ].map((item, idx) => (
                  <div key={idx} className="p-3.5 bg-[#0b0f1a] rounded-2xl border border-slate-800 flex items-center justify-between">
                    <div>
                      <h5 className="font-bold text-white text-xs">{item.name}</h5>
                      <p className="text-[10px] text-slate-400">الرصيد: {item.currentStock} علب | معدل الصرف: {item.dailyBurn}/يوم</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-red-400 bg-red-950/40 px-2 py-1 rounded-lg border border-red-500/30">
                        ينفد خلال {item.daysLeft} أيام
                      </span>
                      <button 
                        onClick={() => {
                          toast.success(`تم إصدار مسودة أمر شراء عاجل للصنف: ${item.name}`);
                          navigate('/procurement/contracts');
                        }}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all"
                      >
                        أمر شراء
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Dead Stock & Slow Movers */}
            <div className="bg-[#151b2b] p-6 rounded-3xl border border-slate-800 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-white text-sm flex items-center gap-2">
                  <PackageSearch className="text-amber-400" size={18} />
                  الأصناف الراكدة وبطيئة الحركة (Dead Stock Clearance)
                </h4>
                <span className="text-[11px] bg-amber-500/10 text-amber-400 px-2.5 py-0.5 rounded-full font-bold">
                  سيولة مجمدة: 32,400 ر.س
                </span>
              </div>
              <div className="space-y-3">
                {[
                  { name: 'جهاز قياس ضغط أومرون ديجيتال', qty: 15, frozenValue: 4500, noMoveDays: 75, suggestion: 'خصم 15% أو هدية مع جهاز سكر' },
                  { name: 'كريم ترطيب سيرافيه 454 جم', qty: 28, frozenValue: 2800, noMoveDays: 60, suggestion: 'حزمة ترويجية اشترِ 1 واحصل على الثاني بنصف السعر' }
                ].map((item, idx) => (
                  <div key={idx} className="p-3.5 bg-[#0b0f1a] rounded-2xl border border-slate-800 flex items-center justify-between">
                    <div>
                      <h5 className="font-bold text-white text-xs">{item.name}</h5>
                      <p className="text-[10px] text-slate-400">راكد منذ {item.noMoveDays} يوم | القيمة: {formatCurrency(item.frozenValue)}</p>
                      <p className="text-[10px] text-amber-400 mt-1">اقتراح: {item.suggestion}</p>
                    </div>
                    <button 
                      onClick={() => {
                        toast.success(`تم تفعيل العرض الترويجي للصنف: ${item.name}`);
                      }}
                      className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold transition-all shrink-0"
                    >
                      تفعيل العرض
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- TAB 4: EXECUTIVE COPILOT CHAT & REAL ACTION EXECUTOR --- */}
      {activeTab === 'copilot_chat' && (
        <div className="bg-[#151b2b] rounded-3xl border border-slate-800 shadow-2xl overflow-hidden flex flex-col h-[650px]">
          {/* Chat Header */}
          <div className="p-4 bg-gradient-to-r from-blue-900/30 to-indigo-900/30 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-600/20 text-blue-400 flex items-center justify-center border border-blue-500/30">
                <Bot size={22} />
              </div>
              <div>
                <h4 className="font-bold text-white text-sm">محادثة الوكيل التنفيذي التفاعلية</h4>
                <p className="text-[11px] text-emerald-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  متصل ومستعد لتنفيذ العمليات
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                AIEngine.clearHistory();
                setChatMessages([{
                  role: 'assistant',
                  content: 'تم بدء جلسة محادثة جديدة مع وكيل MARO الذكي.',
                  timestamp: new Date().toISOString()
                }]);
              }}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium transition-colors flex items-center gap-1"
            >
              <RotateCcw size={14} />
              <span>محادثة جديدة</span>
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {chatMessages.map((msg, idx) => (
              <div key={idx} className={cn("flex gap-3 max-w-[85%]", msg.role === 'user' ? "mr-auto flex-row-reverse" : "ml-auto")}>
                <div className={cn(
                  "w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border text-xs",
                  msg.role === 'user' ? "bg-slate-800 border-slate-700 text-slate-400" : "bg-blue-600/20 border-blue-500/30 text-blue-400"
                )}>
                  {msg.role === 'user' ? 'U' : <Bot size={16} />}
                </div>
                <div className={cn(
                  "p-4 rounded-3xl text-sm leading-relaxed",
                  msg.role === 'user' ? "bg-blue-600 text-white rounded-tr-none" : "bg-[#0b0f1a] border border-slate-800 text-slate-200 rounded-tl-none shadow-lg"
                )}>
                  <div className="markdown-body text-xs md:text-sm">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                  {msg.isAction && (
                    <div className="mt-3 p-2 bg-emerald-950/50 rounded-xl border border-emerald-500/30 text-emerald-400 text-xs font-mono flex items-center gap-1.5">
                      <Sparkles size={14} />
                      <span>تم تنفيذ العملية المطلوبة بنجاح داخل نظام MARO</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {isChatProcessing && (
              <div className="flex gap-3 max-w-[85%] ml-auto">
                <div className="w-8 h-8 rounded-xl bg-blue-600/20 border border-blue-500/30 text-blue-400 flex items-center justify-center shrink-0">
                  <Bot size={16} />
                </div>
                <div className="p-4 bg-[#0b0f1a] border border-slate-800 rounded-3xl rounded-tl-none text-slate-400 text-xs flex items-center gap-2">
                  <BrainCircuit className="animate-spin text-blue-400" size={16} />
                  <span>جاري التحليل المعرفي والتنفيذ عبر محرك Gemini 3.7...</span>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Quick Prompts */}
          <div className="px-4 py-2 border-t border-slate-800/80 bg-[#0b0f1a]/50 flex gap-2 overflow-x-auto text-[11px]">
            {[
              'اعرض لي مبيعات اليوم مع مقارنة بالأمس',
              'مريض ضغط عنده كحة ببلغم، ما هو العلاج الآمن؟',
              'افتح لي شاشة نقطة البيع السريعة POS',
              'اعرض لي الأدوية التي ستنفد قريباً',
              'ما هي الفروع الأعلى تحقيقاً للأرباح؟'
            ].map((qp, i) => (
              <button
                key={i}
                onClick={() => {
                  setChatPrompt(qp);
                }}
                className="px-3 py-1 bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg border border-slate-700 whitespace-nowrap transition-colors"
              >
                {qp}
              </button>
            ))}
          </div>

          {/* Input Footer */}
          <form onSubmit={handleSendChatMessage} className="p-4 bg-[#0b0f1a] border-t border-slate-800 flex gap-2">
            <input
              type="text"
              value={chatPrompt}
              onChange={(e) => setChatPrompt(e.target.value)}
              placeholder="اكتب سؤالك أو اطلب تنفيذ عملية في النظام..."
              className="flex-1 bg-[#151b2b] border border-slate-700 rounded-2xl px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
            />
            <button
              type="submit"
              disabled={isChatProcessing || !chatPrompt.trim()}
              className="px-5 py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-2xl font-bold text-xs md:text-sm flex items-center gap-2 transition-all shadow-lg shadow-blue-600/20"
            >
              <Send size={16} />
              <span>إرسال</span>
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
