/**
 * @file InteractiveResolutionFlow.tsx
 * @description تدفق التشخيص والحل التفاعلي خطوة بخطوة مع الفحص الذاتي وتصعيد التذاكر التلقائي
 */

import React, { useState } from 'react';
import { 
  SupportDiagnosis, 
  DiagnosticAction, 
  KnowledgeArticle, 
  SimilarTicketMatch,
  SupportSession,
  SupportTicket
} from '../../types/smartSupport';
import { DiagnosticExecutionEngine } from '../../services/smartSupportEngine';
import { SmartSupportRepository } from '../../repositories/smartSupportRepository';
import { 
  CheckCircle2, 
  AlertTriangle, 
  HelpCircle, 
  ArrowLeft, 
  ArrowRight, 
  Activity, 
  Sparkles, 
  Play, 
  Star, 
  Send, 
  Check, 
  Layers, 
  LifeBuoy, 
  RefreshCw, 
  FileText,
  ShieldCheck,
  AlertOctagon,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface InteractiveResolutionFlowProps {
  diagnosis: SupportDiagnosis;
  initialSession: SupportSession;
  matchedArticle?: KnowledgeArticle;
  similarTickets?: SimilarTicketMatch[];
  onSessionResolved?: (session: SupportSession) => void;
  onTicketCreated?: (ticket: SupportTicket) => void;
  onBackToSearch?: () => void;
}

export const InteractiveResolutionFlow: React.FC<InteractiveResolutionFlowProps> = ({
  diagnosis,
  initialSession,
  matchedArticle,
  similarTickets = [],
  onSessionResolved,
  onTicketCreated,
  onBackToSearch
}) => {
  const [session, setSession] = useState<SupportSession>(initialSession);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [executingStep, setExecutingStep] = useState<boolean>(false);
  const [showAlternative, setShowAlternative] = useState<boolean>(false);
  const [feedbackRating, setFeedbackRating] = useState<number>(5);
  const [feedbackComment, setFeedbackComment] = useState<string>('');
  const [isResolved, setIsResolved] = useState<boolean | null>(null);
  const [isEscalating, setIsEscalating] = useState<boolean>(false);
  const [escalationReason, setEscalationReason] = useState<string>('');

  const actions = session.actionsTaken || [];
  const currentAction = actions[currentStep];

  // Execute Auto Check or mark manual step
  const handleExecuteAction = async (action: DiagnosticAction, stepIndex: number) => {
    setExecutingStep(true);
    try {
      let resultMessage = 'تم فحص الخطوة والتأكد من الجاهزية.';
      let isSuccess = true;

      if (action.autoActionKey) {
        const checkResult = await DiagnosticExecutionEngine.executeDiagnosticAction(action);
        resultMessage = checkResult.message;
        isSuccess = checkResult.success;
      }

      // Update on server & local state
      const updatedActions = [...actions];
      updatedActions[stepIndex] = {
        ...action,
        status: isSuccess ? 'SUCCESS' : 'FAILED',
        resultMessage,
        timestamp: new Date().toISOString()
      };

      const updatedSession = {
        ...session,
        actionsTaken: updatedActions,
        currentStepIndex: Math.min(actions.length - 1, stepIndex + 1)
      };

      setSession(updatedSession);

      // Record to server
      fetch('/api/support/session/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: session.id,
          stepIndex,
          status: isSuccess ? 'SUCCESS' : 'FAILED',
          resultMessage
        })
      }).catch(console.error);

      // Move to next step if available
      if (stepIndex < actions.length - 1) {
        setCurrentStep(stepIndex + 1);
      }
    } finally {
      setExecutingStep(false);
    }
  };

  // Submit Feedback
  const handleFeedbackSubmit = async (resolved: boolean) => {
    setIsResolved(resolved);
    try {
      await fetch('/api/support/session/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: session.id,
          resolved,
          rating: feedbackRating,
          comment: feedbackComment
        })
      });

      if (resolved && onSessionResolved) {
        onSessionResolved({ ...session, status: 'RESOLVED_BY_AI' });
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Escalate to Ticket with Complete Diagnostic History
  const handleEscalateToTicket = async () => {
    setIsEscalating(true);
    try {
      const userStr = localStorage.getItem('maro_auth_user');
      const currentUser = userStr ? JSON.parse(userStr) : { name: 'المسؤول', id: 'usr_admin', email: 'admin@maro.com' };

      const res = await SmartSupportRepository.createTicket({
        aiSessionId: session.id,
        title: `تعذر حل مشكلة: ${session.userQuery.substring(0, 50)}...`,
        description: `${session.userQuery}\n\nملاحظة المستخدم أثناء التصعيد: ${escalationReason || 'لم تنجح خطوات الفحص الذاتي المتاحة.'}`,
        severity: diagnosis.severity,
        module: diagnosis.module,
        screen: diagnosis.screen,
        userName: currentUser.name,
        userEmail: currentUser.email,
        userId: currentUser.id,
        actionsAttempted: session.actionsTaken.map(a => ({
          step: a.stepNumber,
          title: a.title,
          result: a.resultMessage || 'غير مكتمل',
          status: a.status
        })),
        diagnosticEvidence: {
          confidenceScore: diagnosis.confidenceScore,
          errorType: diagnosis.errorType,
          causeProbability: diagnosis.causeProbability
        }
      });

      if (res.success && res.ticket) {
        if (onTicketCreated) {
          onTicketCreated(res.ticket);
        }
      }
    } catch (err) {
      console.error('Escalation failed', err);
    } finally {
      setIsEscalating(false);
    }
  };

  return (
    <div id="interactive-resolution-flow" className="space-y-6">
      {/* 1. Problem Intelligence Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white">تشخيص المشكلة الذكي</h3>
                <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full ${
                  diagnosis.severity === 'CRITICAL' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                  diagnosis.severity === 'HIGH' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                  'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                }`}>
                  مستوى الأهمية: {diagnosis.severity}
                </span>
                <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                  الموديول: {diagnosis.module}
                </span>
              </div>
              <p className="text-sm text-slate-400 mt-0.5">
                الشاشة: <span className="text-slate-200 font-medium">{diagnosis.screen}</span> | دقة التشخيص: <span className="text-emerald-400 font-bold">{diagnosis.confidenceScore}%</span>
              </p>
            </div>
          </div>

          <button
            onClick={onBackToSearch}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-800 rounded-lg border border-slate-700 transition"
          >
            <ArrowRight className="w-4 h-4" />
            تعديل السؤال أو البحث مجدداً
          </button>
        </div>

        {/* Query & Probable Causes */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 text-sm">
          <div className="bg-slate-950/60 rounded-lg p-3.5 border border-slate-800/60">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">وصف الحالة المدخل</span>
            <p className="text-slate-200 font-medium leading-relaxed">"{session.userQuery}"</p>
          </div>

          <div className="bg-slate-950/60 rounded-lg p-3.5 border border-slate-800/60">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">الأسباب المحتملة الأكثر ترجيحاً</span>
            <div className="space-y-1.5">
              {diagnosis.causeProbability.map((c, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <span className="text-slate-300 truncate max-w-[80%]">• {c.cause}</span>
                  <span className="text-emerald-400 font-mono font-semibold">{c.probability}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Interactive Diagnostic Steps */}
      {actions.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-emerald-400" />
              <h4 className="text-base font-bold text-white">خطوات الفحص والتحقق الذاتي ({actions.length} خطوات)</h4>
            </div>
            <span className="text-xs text-slate-400">
              الخطوة {currentStep + 1} من {actions.length}
            </span>
          </div>

          {/* Stepper Progress */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
            {actions.map((act, idx) => (
              <div 
                key={act.id || idx}
                onClick={() => setCurrentStep(idx)}
                className={`p-3 rounded-lg border cursor-pointer transition flex items-start gap-3 ${
                  currentStep === idx 
                    ? 'bg-emerald-500/10 border-emerald-500/50 text-white' 
                    : act.status === 'SUCCESS' 
                      ? 'bg-slate-950 border-emerald-500/30 text-slate-300'
                      : act.status === 'FAILED'
                        ? 'bg-slate-950 border-rose-500/30 text-slate-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                  act.status === 'SUCCESS' ? 'bg-emerald-500 text-slate-950' :
                  act.status === 'FAILED' ? 'bg-rose-500 text-white' :
                  currentStep === idx ? 'bg-emerald-400 text-slate-950' : 'bg-slate-800 text-slate-400'
                }`}>
                  {act.status === 'SUCCESS' ? <Check className="w-3.5 h-3.5" /> : idx + 1}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold truncate">{act.title}</p>
                  <span className="text-[11px] text-slate-400 block truncate">
                    {act.status === 'SUCCESS' ? 'تم الفحص (سليم)' :
                     act.status === 'FAILED' ? 'تعارض أو عطل' : 'في الانتظار'}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Active Action Panel */}
          {currentAction && (
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-5">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div>
                  <h5 className="text-sm font-bold text-white flex items-center gap-2">
                    <span>{currentAction.stepNumber}. {currentAction.title}</span>
                    {currentAction.actionType === 'AUTO_CHECK' && (
                      <span className="px-2 py-0.5 text-[10px] font-semibold bg-emerald-500/20 text-emerald-400 rounded-md border border-emerald-500/30">
                        فحص آلي مباشر (Auto-Check)
                      </span>
                    )}
                  </h5>
                  <p className="text-xs text-slate-300 mt-1">{currentAction.description}</p>
                </div>

                <button
                  onClick={() => handleExecuteAction(currentAction, currentStep)}
                  disabled={executingStep}
                  className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 disabled:opacity-50 rounded-lg shadow-sm transition shrink-0"
                >
                  {executingStep ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      جاري الفحص...
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4" />
                      {currentAction.actionType === 'AUTO_CHECK' ? 'تنفيذ الفحص الآن' : 'تأكيد إتمام الخطوة'}
                    </>
                  )}
                </button>
              </div>

              {currentAction.resultMessage && (
                <div className={`mt-3 p-3 rounded-lg text-xs font-medium border flex items-start gap-2.5 ${
                  currentAction.status === 'SUCCESS'
                    ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300'
                    : 'bg-rose-950/40 border-rose-500/30 text-rose-300'
                }`}>
                  {currentAction.status === 'SUCCESS' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <span className="font-bold block mb-0.5">نتيجة الفحص:</span>
                    {currentAction.resultMessage}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 3. Recommended Solution & Knowledge Base Recommendation */}
      {matchedArticle && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <h4 className="text-base font-bold text-white">الحل المعتمد من قاعدة المعرفة</h4>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span>معدل نجاح الحل:</span>
              <span className="font-bold text-emerald-400">{matchedArticle.successRate}%</span>
              <span>(تم حله {matchedArticle.solvedCount} مرة)</span>
            </div>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 mb-4">
            <p className="text-sm font-semibold text-slate-100 whitespace-pre-line leading-relaxed">
              {matchedArticle.solutionArabic || matchedArticle.solution}
            </p>
          </div>

          {/* Alternative Solutions */}
          {matchedArticle.alternativeSolutions && matchedArticle.alternativeSolutions.length > 0 && (
            <div className="mb-4">
              <button
                onClick={() => setShowAlternative(!showAlternative)}
                className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-slate-200 transition"
              >
                {showAlternative ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                حلول بديلة واستثنائية ({matchedArticle.alternativeSolutions.length})
              </button>

              {showAlternative && (
                <div className="mt-2.5 space-y-2">
                  {matchedArticle.alternativeSolutions.map((alt, i) => (
                    <div key={i} className="p-3 rounded-lg bg-slate-950/70 border border-slate-800 text-xs text-slate-300">
                      • {alt}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Similar Tickets from Past Cases */}
          {similarTickets.length > 0 && (
            <div className="border-t border-slate-800 pt-4 mt-4">
              <span className="text-xs font-bold text-slate-300 block mb-2">حالات سابقة مماثلة تم حلها بنجاح:</span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {similarTickets.map((st, i) => (
                  <div key={i} className="p-2.5 bg-slate-950/80 border border-slate-800 rounded-lg text-xs">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-slate-200 truncate">{st.ticket.ticketNumber} - {st.ticket.title}</span>
                      <span className="px-1.5 py-0.5 text-[10px] font-bold bg-emerald-500/20 text-emerald-400 rounded">
                        تطابق {st.similarityScore}%
                      </span>
                    </div>
                    {st.usedSolution && (
                      <p className="text-slate-400 line-clamp-2 mt-1">حل الحالة: {st.usedSolution}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 4. Feedback & Escalation Action Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
        {isResolved === null ? (
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h4 className="text-sm font-bold text-white">هل ساعدتك هذه الخطوات في حل المشكلة؟</h4>
              <p className="text-xs text-slate-400 mt-0.5">
                تقييمك يُحدث خوارزميات قاعدة المعرفة فورياً ويوفر الوقت على جميع المستخدمين.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => handleFeedbackSubmit(true)}
                className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-xl shadow-md transition"
              >
                <CheckCircle2 className="w-4 h-4" />
                نعم، تم حل المشكلة بنجاح
              </button>

              <button
                onClick={() => handleFeedbackSubmit(false)}
                className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 rounded-xl transition"
              >
                <AlertOctagon className="w-4 h-4" />
                لم يتم الحل (تحويل لتذكرة)
              </button>
            </div>
          </div>
        ) : isResolved === true ? (
          <div className="p-4 bg-emerald-950/30 border border-emerald-500/30 rounded-xl text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-base font-bold text-emerald-300">رائع! تم حل المشكلة وتوثيق النتيجة بنجاح</h4>
              <p className="text-xs text-slate-400 mt-1">تم تحديث مؤشر كفاءة المقال في قاعدة المعرفة المركزية.</p>
            </div>

            <div className="flex items-center justify-center gap-2 pt-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setFeedbackRating(star)}
                  className={`p-1 transition ${star <= feedbackRating ? 'text-amber-400' : 'text-slate-600'}`}
                >
                  <Star className="w-5 h-5 fill-current" />
                </button>
              ))}
            </div>

            <button
              onClick={onBackToSearch}
              className="px-4 py-2 text-xs font-bold text-slate-900 bg-emerald-400 hover:bg-emerald-300 rounded-lg transition mt-2"
            >
              العودة لشاشة الدعم الرئيسية
            </button>
          </div>
        ) : (
          /* Escalation to Ticket Form */
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-300 text-xs">
              <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block mb-0.5">تصعيد الحالة تلقائياً إلى مهندسي الدعم الفني:</span>
                سيتم إرفاق كل ما حدث (خطوات الفحص، النتائج، وتفاصيل النظام) تلقائياً داخل التذكرة، دون الحاجة لإعادة الشرح.
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                ملاحظات إضافية لمهندس الدعم (اختياري)
              </label>
              <textarea
                value={escalationReason}
                onChange={(e) => setEscalationReason(e.target.value)}
                placeholder="أضف أي تفاصيل أو رسائل خطأ إضافية ظهرت على الشاشة..."
                rows={2}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                onClick={onBackToSearch}
                className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white bg-slate-800 rounded-lg transition"
              >
                إلغاء
              </button>

              <button
                onClick={handleEscalateToTicket}
                disabled={isEscalating}
                className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 disabled:opacity-50 rounded-xl shadow-lg transition"
              >
                {isEscalating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    جاري إنشاء التذكرة وإرفاق التشخيص...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    إنشاء تذكرة دعم فني فوريّة
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
