/**
 * @file SmartSupportAssistantWidget.tsx
 * @description المساعد الذكي العائم وسريع الاستجابة المتاح عبر كافة شاشات MARO ERP مع الوعي بالسياق
 */

import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { 
  Sparkles, 
  HelpCircle, 
  X, 
  Send, 
  ArrowLeft, 
  Activity, 
  ShieldCheck, 
  RefreshCw,
  MessageSquare,
  ChevronUp,
  ChevronDown
} from 'lucide-react';
import { SmartSupportClassifier } from '../../services/smartSupportEngine';
import { SmartSupportRepository } from '../../repositories/smartSupportRepository';
import { InteractiveResolutionFlow } from './InteractiveResolutionFlow';
import { SupportDiagnosis, SupportSession, KnowledgeArticle } from '../../types/smartSupport';

export const SmartSupportAssistantWidget: React.FC = () => {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isMinimized, setIsMinimized] = useState<boolean>(false);
  const [query, setQuery] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);

  // Active Diagnosis & Session State
  const [activeDiagnosis, setActiveDiagnosis] = useState<SupportDiagnosis | null>(null);
  const [activeSession, setActiveSession] = useState<SupportSession | null>(null);
  const [matchedArticle, setMatchedArticle] = useState<KnowledgeArticle | undefined>(undefined);

  // Contextual Quick Symptoms based on Current Screen
  const getContextualQuickSymptoms = () => {
    const path = location.pathname.toLowerCase();
    if (path.includes('pos')) {
      return [
        'الفاتورة مش بتتحفظ في نقطة البيع',
        'طابعة الإيصالات الحرارية لا تستجيب',
        'شاشة الكاشير بطيئة أو متجمدة',
        'قارئ باركود الميزان لا يقرأ السعر'
      ];
    }
    if (path.includes('inventory') || path.includes('products')) {
      return [
        'اختلاف رصيد المخزون بعد الترحيل',
        'منع البيع بالسالب للصنف',
        'فشل ترحيل أمر تحويل بين الفروع',
        'تكرار رقم الباركود الدولي'
      ];
    }
    if (path.includes('zatca') || path.includes('tax')) {
      return [
        'خطأ في توقيع XML لفاتورة زاتكا',
        'انتهاء صلاحية شهادة CSID',
        'عدم تطابق الرقم الضريبي للعميل'
      ];
    }
    if (path.includes('license') || path.includes('security')) {
      return [
        'رسالة انتهاء صلاحية الترخيص',
        'تفعيل المفتاح الرقمي أوفلاين',
        'إضافة فرع جديد للترخيص'
      ];
    }
    return [
      'تعذر حفظ الفاتورة أو المستند',
      'توقف مزامنة العمليات أوفلاين',
      'الطابعة الحرارية لا تعمل',
      'طلب مساعدة عامة في النظام'
    ];
  };

  const handleStartDiagnosis = async (selectedQuery?: string) => {
    const textToDiagnose = selectedQuery || query;
    if (!textToDiagnose.trim()) return;

    setIsAnalyzing(true);
    try {
      const userStr = localStorage.getItem('maro_auth_user');
      const currentUser = userStr ? JSON.parse(userStr) : { name: 'المسؤول', id: 'usr_admin' };

      const res = await fetch('/api/support/diagnose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userQuery: textToDiagnose,
          screen: location.pathname,
          userId: currentUser.id,
          userName: currentUser.name,
          deviceId: 'DEV-UUID-LOCAL'
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setActiveDiagnosis(data.diagnosis);
          setActiveSession(data.session);
          setMatchedArticle(data.matchedArticle);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleReset = () => {
    setActiveDiagnosis(null);
    setActiveSession(null);
    setMatchedArticle(undefined);
    setQuery('');
  };

  return (
    <div id="smart-support-assistant-widget" className="fixed bottom-5 left-5 z-40">
      {/* Floating Trigger Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2.5 px-4 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black text-xs rounded-full shadow-2xl hover:scale-105 transition-all duration-200 border border-emerald-400/40 group"
        >
          <div className="w-6 h-6 rounded-full bg-slate-950 text-emerald-400 flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5 group-hover:rotate-12 transition-transform" />
          </div>
          <span>المساعد الذكي للدعم الفني</span>
          <span className="w-2 h-2 rounded-full bg-emerald-950 animate-ping" />
        </button>
      )}

      {/* Floating Drawer / Panel */}
      {isOpen && (
        <div className={`bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl transition-all duration-200 overflow-hidden flex flex-col ${
          isMinimized ? 'w-80 h-14' : 'w-[90vw] md:w-[620px] max-h-[85vh] h-[650px]'
        }`}>
          {/* Header */}
          <div className="bg-slate-950 px-4 py-3 border-b border-slate-800 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span>MARO Smart Support Intelligence</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                </h3>
                <p className="text-[10px] text-slate-400">
                  شاشة العمل الحالية: <span className="text-slate-300 font-semibold">{location.pathname}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 text-slate-400">
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="p-1 hover:text-white transition"
              >
                {isMinimized ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:text-white transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Body Content */}
          {!isMinimized && (
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {activeDiagnosis && activeSession ? (
                <InteractiveResolutionFlow
                  diagnosis={activeDiagnosis}
                  initialSession={activeSession}
                  matchedArticle={matchedArticle}
                  onBackToSearch={handleReset}
                  onSessionResolved={() => {
                    setTimeout(() => setIsOpen(false), 2000);
                  }}
                  onTicketCreated={() => {
                    setTimeout(() => setIsOpen(false), 2000);
                  }}
                />
              ) : (
                /* Initial Prompt / Symptom Search */
                <div className="space-y-4">
                  <div className="p-4 bg-emerald-950/20 border border-emerald-500/20 rounded-xl space-y-1.5">
                    <h4 className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                      <Activity className="w-4 h-4" />
                      تشخيص ذكي فوري للمشكلة
                    </h4>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      اكتب المشكلة التي تواجهك بلغتك الطبيعية (مثل: "الفاتورة مش بتتحفظ" أو "الطابعة الحرارية لا تطبع").
                      سيقوم المساعد باختبار النظام فورياً واقتراح الحل المعتمد قبل الحاجة لفتح تذكرة.
                    </p>
                  </div>

                  {/* Input Box */}
                  <div className="space-y-2">
                    <div className="relative">
                      <textarea
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleStartDiagnosis();
                          }
                        }}
                        placeholder="صف ما الذي حدث معك بالتفصيل..."
                        rows={3}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <button
                      onClick={() => handleStartDiagnosis()}
                      disabled={isAnalyzing || !query.trim()}
                      className="w-full py-2.5 bg-emerald-400 hover:bg-emerald-300 disabled:opacity-50 text-slate-950 font-bold text-xs rounded-xl shadow transition flex items-center justify-center gap-2"
                    >
                      {isAnalyzing ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          جاري الفحص واستخراج الأعراض...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          بدء التشخيص الذكي
                        </>
                      )}
                    </button>
                  </div>

                  {/* Contextual Quick Suggestions */}
                  <div>
                    <span className="text-[11px] font-bold text-slate-400 block mb-2">
                      مشاكل شائعة في هذه الشاشة:
                    </span>
                    <div className="space-y-1.5">
                      {getContextualQuickSymptoms().map((symptom, i) => (
                        <button
                          key={i}
                          onClick={() => {
                            setQuery(symptom);
                            handleStartDiagnosis(symptom);
                          }}
                          className="w-full text-right p-2.5 rounded-lg bg-slate-950 hover:bg-slate-800/80 border border-slate-800/80 hover:border-emerald-500/40 text-xs text-slate-300 transition flex items-center justify-between group"
                        >
                          <span className="truncate">{symptom}</span>
                          <span className="text-[10px] text-emerald-400 font-semibold opacity-0 group-hover:opacity-100 transition">
                            فحص ⬅
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
