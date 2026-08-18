/**
 * @file SmartSupportAssistant.tsx
 * @module MARO Smart Support Assistant
 * @description مكون المساعد الذكي الذي يقوم بتحليل المشكلات في النظام وتقديم حلول ومقترحات تفاعلية مع ربطها بقاعدة المعرفة
 */

import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Send, 
  Activity, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  RefreshCw, 
  ShieldCheck, 
  HelpCircle, 
  Layers, 
  BookOpen, 
  FileText,
  Search,
  ArrowRight,
  LifeBuoy
} from 'lucide-react';
import { SmartSupportClassifier } from '../../services/smartSupportEngine';
import { SmartSupportRepository } from '../../repositories/smartSupportRepository';
import { SupportDiagnosis, SupportSession, KnowledgeArticle } from '../../types/smartSupport';
import { InteractiveResolutionFlow } from './InteractiveResolutionFlow';

interface SmartSupportAssistantProps {
  initialQuery?: string;
  screenContext?: string;
  onTicketCreated?: () => void;
}

export const SmartSupportAssistant: React.FC<SmartSupportAssistantProps> = ({
  initialQuery = '',
  screenContext = 'General',
  onTicketCreated
}) => {
  const [query, setQuery] = useState(initialQuery);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [diagnosis, setDiagnosis] = useState<SupportDiagnosis | null>(null);
  const [session, setSession] = useState<SupportSession | null>(null);
  const [matchedArticle, setMatchedArticle] = useState<KnowledgeArticle | undefined>(undefined);
  const [recentSessions, setRecentSessions] = useState<SupportSession[]>([]);

  // Frequent Symptoms Shortcuts
  const quickSymptoms = [
    'الفاتورة مش بتتحفظ في نقطة البيع POS',
    'طابعة الإيصالات الحرارية لا تستجيب',
    'اختلاف رصيد المخزون بعد تترحيل الفاتورة',
    'توقف المزامنة الأوفلاين ولا تنتقل للسيرفر',
    'خطأ توقيع XML في الفاتورة الإلكترونية ZATCA',
    'تفعيل الترخيص الرقمي أوفلاين'
  ];

  const handleStartAnalysis = async (selectedText?: string) => {
    const textToDiagnose = selectedText || query;
    if (!textToDiagnose.trim()) return;

    setIsAnalyzing(true);
    try {
      const userStr = localStorage.getItem('maro_auth_user');
      const currentUser = userStr ? JSON.parse(userStr) : { name: 'المسؤول', id: 'usr_admin' };

      // Call diagnostic endpoint
      const res = await fetch('/api/support/diagnose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userQuery: textToDiagnose,
          screen: screenContext,
          userId: currentUser.id,
          userName: currentUser.name,
          deviceId: 'DEV-UUID-LOCAL'
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setDiagnosis(data.diagnosis);
          setSession(data.session);
          setMatchedArticle(data.matchedArticle);
        }
      } else {
        // Fallback local diagnosis
        const localDiagnosis = SmartSupportClassifier.analyzeProblem(textToDiagnose, screenContext);
        setDiagnosis(localDiagnosis);
      }
    } catch (e) {
      console.warn('Network issue during diagnosis, using local analyzer...');
      const localDiagnosis = SmartSupportClassifier.analyzeProblem(textToDiagnose, screenContext);
      setDiagnosis(localDiagnosis);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleReset = () => {
    setDiagnosis(null);
    setSession(null);
    setMatchedArticle(undefined);
    setQuery('');
  };

  return (
    <div className="bg-[#151b2b] border border-[#1e293b] rounded-2xl shadow-2xl p-6 text-right space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#1e293b] pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-600/30">
            <Sparkles size={20} />
          </div>
          <div>
            <h2 className="text-lg font-black text-white flex items-center gap-2">
              <span>مساعد الدعم الفني والتشخيص الذكي (Smart Support)</span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-mono border border-emerald-500/30">Offline-First Engine</span>
            </h2>
            <p className="text-xs text-slate-400">تحليل فوري للمشكلات، تشخيص الأسباب الجذرية، وتقديم خطوات معالجة تفاعلية.</p>
          </div>
        </div>
        {(diagnosis || session) && (
          <button 
            onClick={handleReset}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
          >
            <RefreshCw size={14} />
            <span>تشخيص جديد</span>
          </button>
        )}
      </div>

      {/* Main Content View */}
      {!diagnosis ? (
        <div className="space-y-6">
          {/* Query Input Box */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <LifeBuoy size={14} className="text-blue-400" />
              <span>صف المشكلة أو الخطأ الذي يواجهك بالتفصيل:</span>
            </label>
            <div className="relative">
              <textarea
                rows={3}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="مثال: الفاتورة مش بتتحفظ في نقطة البيع وبتظهر رسالة فشل المزامنة..."
                className="w-full p-4 bg-[#0b0f19] border border-[#1e293b] rounded-xl text-white placeholder-slate-600 text-sm focus:outline-none focus:border-blue-500 transition-all resize-none font-sans"
              />
              <button
                onClick={() => handleStartAnalysis()}
                disabled={isAnalyzing || !query.trim()}
                className="absolute left-3 bottom-3 px-5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-600/30 flex items-center gap-2 transition-all cursor-pointer"
              >
                {isAnalyzing ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    <span>جاري جاري التقييم...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={14} />
                    <span>بدء التشخيص الذكي</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Quick Symptoms Shortcuts */}
          <div className="space-y-2">
            <p className="text-xs font-bold text-slate-400">أو اختر من المشكلات الشائعة الأكثر تكراراً:</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {quickSymptoms.map((symptom, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setQuery(symptom);
                    handleStartAnalysis(symptom);
                  }}
                  className="p-3 bg-slate-900/60 hover:bg-slate-800 border border-slate-800 hover:border-blue-500/40 rounded-xl text-right text-xs text-slate-300 hover:text-white transition-all flex items-center justify-between group"
                >
                  <span className="font-semibold">{symptom}</span>
                  <ArrowRight size={14} className="text-slate-600 group-hover:text-blue-400 group-hover:-translate-x-1 transition-all" />
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* Interactive Resolution View */
        <InteractiveResolutionFlow
          diagnosis={diagnosis}
          initialSession={session || {
            id: `sess_${Date.now()}`,
            tenantId: 'tenant_maro_main',
            branchId: 'branch_main',
            userId: 'usr_admin',
            userName: 'المستخدم',
            deviceId: 'DEV-UUID-LOCAL',
            screen: screenContext,
            module: diagnosis.module,
            userQuery: query,
            diagnosis,
            actionsTaken: [],
            status: 'ACTIVE',
            currentStepIndex: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }}
          matchedArticle={matchedArticle}
          onSessionResolved={() => {
            if (onTicketCreated) onTicketCreated();
          }}
          onTicketCreated={() => {
            if (onTicketCreated) onTicketCreated();
          }}
          onBackToSearch={handleReset}
        />
      )}
    </div>
  );
};
