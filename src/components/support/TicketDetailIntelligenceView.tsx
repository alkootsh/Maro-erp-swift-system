/**
 * @file TicketDetailIntelligenceView.tsx
 * @description عرض تفاصيل التذكرة مع سياق الذكاء الاصطناعي الكامل، سجل الفحص، وتحويل الحلول لقاعدة المعرفة
 */

import React, { useState } from 'react';
import { 
  SupportTicket, 
  TicketMessageEvent, 
  SimilarTicketMatch 
} from '../../types/smartSupport';
import { SmartSupportRepository } from '../../repositories/smartSupportRepository';
import { 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  User, 
  Send, 
  FileText, 
  ShieldCheck, 
  Layers, 
  Smartphone, 
  Wifi, 
  Check, 
  BookOpen, 
  RefreshCw,
  MessageSquare,
  Lock,
  ArrowRight
} from 'lucide-react';

interface TicketDetailIntelligenceViewProps {
  ticket: SupportTicket;
  events?: TicketMessageEvent[];
  similarTickets?: SimilarTicketMatch[];
  onBack: () => void;
  onTicketUpdated?: () => void;
}

export const TicketDetailIntelligenceView: React.FC<TicketDetailIntelligenceViewProps> = ({
  ticket,
  events = [],
  similarTickets = [],
  onBack,
  onTicketUpdated
}) => {
  const [localEvents, setLocalEvents] = useState<TicketMessageEvent[]>(events);
  const [newMessage, setNewMessage] = useState<string>('');
  const [isInternalNote, setIsInternalNote] = useState<boolean>(false);
  const [isSending, setIsSending] = useState<boolean>(false);

  // Resolution Modal State
  const [showResolveModal, setShowResolveModal] = useState<boolean>(false);
  const [resolutionText, setResolutionText] = useState<string>('');
  const [makeKnowledgeCandidate, setMakeKnowledgeCandidate] = useState<boolean>(true);
  const [isResolving, setIsResolving] = useState<boolean>(false);

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;
    setIsSending(true);
    try {
      const userStr = localStorage.getItem('maro_auth_user');
      const currentUser = userStr ? JSON.parse(userStr) : { name: 'المسؤول' };

      const ok = await SmartSupportRepository.addTicketEvent(
        ticket.id, 
        newMessage, 
        currentUser.name, 
        'SUPPORT_AGENT'
      );

      if (ok) {
        setLocalEvents([
          ...localEvents,
          {
            id: `evt_loc_${Date.now()}`,
            ticketId: ticket.id,
            senderType: 'SUPPORT_AGENT',
            senderName: currentUser.name,
            message: newMessage,
            isInternalNote,
            createdAt: new Date().toISOString()
          }
        ]);
        setNewMessage('');
      }
    } finally {
      setIsSending(false);
    }
  };

  const handleResolveTicket = async () => {
    if (!resolutionText.trim()) return;
    setIsResolving(true);
    try {
      const res = await SmartSupportRepository.resolveTicket(ticket.id, resolutionText, makeKnowledgeCandidate);
      if (res.success) {
        setShowResolveModal(false);
        if (onTicketUpdated) onTicketUpdated();
      }
    } finally {
      setIsResolving(false);
    }
  };

  return (
    <div id="ticket-detail-intelligence-view" className="space-y-6">
      {/* 1. Header & Navigation */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="p-2 text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-800 rounded-lg border border-slate-700 transition"
              title="رجوع للقائمة"
            >
              <ArrowRight className="w-5 h-5" />
            </button>

            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded border border-emerald-500/20">
                  {ticket.ticketNumber}
                </span>
                <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full ${
                  ticket.status === 'RESOLVED' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                  ticket.status === 'IN_PROGRESS' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                  'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                }`}>
                  {ticket.status === 'RESOLVED' ? 'تم الحل والمعالجة' :
                   ticket.status === 'IN_PROGRESS' ? 'قيد المتابعة والتدقيق' : 'مفتوحة وجديدة'}
                </span>
                <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                  موديول: {ticket.module}
                </span>
              </div>
              <h2 className="text-lg font-bold text-white mt-1">{ticket.title}</h2>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            {ticket.status !== 'RESOLVED' && (
              <button
                onClick={() => setShowResolveModal(true)}
                className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-xl shadow-md transition"
              >
                <CheckCircle2 className="w-4 h-4" />
                إغلاق وحل التذكرة
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): AI Intelligence Context & Chat */}
        <div className="lg:col-span-2 space-y-6">
          {/* AI Diagnostic Summary Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-white">ملخص التشخيص الذكي (AI Resolution Summary)</h3>
              </div>
              <span className="text-xs text-slate-400 font-mono">
                كود الجلسة: {ticket.aiSessionId || 'SESS-OFFLINE'}
              </span>
            </div>

            {/* AI Summary Text */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 text-xs text-slate-200 leading-relaxed whitespace-pre-line">
              {ticket.aiSummary || 'تم تجميع سجلات الفحص والبيانات من النظام تلقائياً.'}
            </div>

            {/* Diagnostic Actions Timeline */}
            {ticket.actionsAttempted && ticket.actionsAttempted.length > 0 && (
              <div>
                <span className="text-xs font-bold text-slate-300 block mb-2">
                  سجل الفحوصات المنفذة قبل التصعيد ({ticket.actionsAttempted.length}):
                </span>
                <div className="space-y-2">
                  {ticket.actionsAttempted.map((act, i) => (
                    <div 
                      key={i} 
                      className={`p-3 rounded-lg border text-xs flex items-start gap-3 ${
                        act.status === 'SUCCESS' ? 'bg-slate-950 border-emerald-500/30' : 'bg-slate-950 border-rose-500/30'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold ${
                        act.status === 'SUCCESS' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                      }`}>
                        {act.status === 'SUCCESS' ? <Check className="w-3 h-3" /> : act.step}
                      </div>
                      <div className="flex-1">
                        <span className="font-semibold text-white">{act.title}</span>
                        <p className="text-slate-400 text-[11px] mt-0.5">{act.result}</p>
                      </div>
                      <span className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                        act.status === 'SUCCESS' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                      }`}>
                        {act.status === 'SUCCESS' ? 'سليم' : 'فشل/تعارض'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recommended Next Action */}
            {ticket.recommendedNextAction && (
              <div className="p-3.5 bg-emerald-950/20 border border-emerald-500/30 rounded-xl text-xs flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-emerald-300 block mb-0.5">الإجراء المقترح لمهندس الدعم:</span>
                  <p className="text-slate-300">{ticket.recommendedNextAction}</p>
                </div>
              </div>
            )}
          </div>

          {/* Resolution Card if Resolved */}
          {ticket.status === 'RESOLVED' && (
            <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-xl p-5 shadow-lg">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <h4 className="text-sm font-bold text-white">الحل النهائي المسجل للحالة</h4>
                {ticket.knowledgeCandidate && (
                  <span className="px-2 py-0.5 text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded-md mr-auto">
                    مرشح للإضافة في قاعدة المعرفة (KB Candidate)
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-200 bg-slate-950 p-4 rounded-lg border border-slate-800 whitespace-pre-line leading-relaxed">
                {ticket.resolution}
              </p>
            </div>
          )}

          {/* Messages & Activity Timeline */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-slate-400" />
                <h3 className="text-sm font-bold text-white">المحادثة وسجل النشاط ({localEvents.length})</h3>
              </div>
            </div>

            {/* Events List */}
            <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
              {localEvents.map((evt, i) => (
                <div 
                  key={evt.id || i}
                  className={`p-3.5 rounded-xl border text-xs space-y-1.5 ${
                    evt.isInternalNote ? 'bg-amber-950/20 border-amber-500/30' :
                    evt.senderType === 'SYSTEM' ? 'bg-slate-950 border-slate-800' :
                    evt.senderType === 'USER' ? 'bg-sky-950/20 border-sky-500/30' :
                    'bg-slate-950 border-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-200">{evt.senderName}</span>
                      {evt.isInternalNote && (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-amber-400 bg-amber-500/20 px-1.5 py-0.5 rounded">
                          <Lock className="w-2.5 h-2.5" /> ملاحظة داخلية
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-500">
                      {new Date(evt.createdAt).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-slate-300 whitespace-pre-line leading-relaxed">{evt.message}</p>
                </div>
              ))}
            </div>

            {/* Reply Input Box */}
            <div className="border-t border-slate-800 pt-3 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">إضافة رد أو تحديث للحالة:</span>
                <label className="flex items-center gap-1.5 cursor-pointer text-slate-400 hover:text-slate-200">
                  <input
                    type="checkbox"
                    checked={isInternalNote}
                    onChange={(e) => setIsInternalNote(e.target.checked)}
                    className="rounded border-slate-700 bg-slate-950 text-amber-500"
                  />
                  <span>ملاحظة داخلية للفريق فقط</span>
                </label>
              </div>

              <div className="flex items-center gap-2">
                <textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="اكتب ردك أو الإجراء المتخذ هنا..."
                  rows={2}
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={isSending || !newMessage.trim()}
                  className="p-3 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold rounded-lg transition"
                >
                  {isSending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (1 Col): Client Telemetry & Similar Tickets */}
        <div className="space-y-6">
          {/* Client Telemetry Box */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-slate-400" />
              بيانات العميل والجهاز التشغيلي
            </h3>

            <div className="space-y-2 text-xs divide-y divide-slate-800/60">
              <div className="pt-2 flex justify-between">
                <span className="text-slate-400">الشركة / المنشأة:</span>
                <span className="text-white font-medium">{ticket.companyName}</span>
              </div>
              <div className="pt-2 flex justify-between">
                <span className="text-slate-400">الفرع:</span>
                <span className="text-white font-medium">{ticket.branchName || 'الرئيسي'}</span>
              </div>
              <div className="pt-2 flex justify-between">
                <span className="text-slate-400">المستخدم:</span>
                <span className="text-white font-medium">{ticket.userName}</span>
              </div>
              <div className="pt-2 flex justify-between">
                <span className="text-slate-400">معرّف الجهاز (UUID):</span>
                <span className="text-slate-300 font-mono text-[11px] truncate max-w-[140px]">{ticket.deviceId}</span>
              </div>
              <div className="pt-2 flex justify-between">
                <span className="text-slate-400">إصدار MARO:</span>
                <span className="text-emerald-400 font-mono font-bold">{ticket.clientContext?.appVersion || '4.0.0'}</span>
              </div>
              <div className="pt-2 flex justify-between">
                <span className="text-slate-400">خطة الترخيص:</span>
                <span className="text-purple-400 font-semibold">{ticket.clientContext?.licensePlan || 'ENTERPRISE'}</span>
              </div>
              <div className="pt-2 flex justify-between">
                <span className="text-slate-400">حالة الاتصال:</span>
                <span className={`font-semibold ${ticket.clientContext?.isOnline ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {ticket.clientContext?.isOnline ? 'متصل سحابياً (Online)' : 'أوفلاين (Local Engine)'}
                </span>
              </div>
            </div>
          </div>

          {/* Similar Tickets Box */}
          {similarTickets.length > 0 && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-emerald-400" />
                تذاكر سابقة ذات تطابق عالي ({similarTickets.length})
              </h3>

              <div className="space-y-3">
                {similarTickets.map((st, i) => (
                  <div key={i} className="p-3 bg-slate-950 border border-slate-800 rounded-lg text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[11px] text-emerald-400 font-bold">{st.ticket.ticketNumber}</span>
                      <span className="px-1.5 py-0.5 text-[10px] font-bold bg-emerald-500/20 text-emerald-400 rounded">
                        نسبة الشبه {st.similarityScore}%
                      </span>
                    </div>
                    <p className="font-semibold text-slate-200 line-clamp-1">{st.ticket.title}</p>
                    {st.usedSolution && (
                      <p className="text-slate-400 text-[11px] line-clamp-2">
                        الحل: {st.usedSolution}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Resolve Ticket Modal */}
      {showResolveModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                تسجيل حل التذكرة وإغلاقها
              </h3>
              <button onClick={() => setShowResolveModal(false)} className="text-slate-400 hover:text-white text-xs">
                إلغاء
              </button>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                شرح الحل والخطوات المتخذة بالتفصيل
              </label>
              <textarea
                value={resolutionText}
                onChange={(e) => setResolutionText(e.target.value)}
                placeholder="اكتب كيف تم حل المشكلة وما هو الإجراء الفني الدائم..."
                rows={4}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="p-3 bg-purple-950/30 border border-purple-500/30 rounded-xl flex items-start gap-3">
              <input
                type="checkbox"
                id="kbCandidateCheck"
                checked={makeKnowledgeCandidate}
                onChange={(e) => setMakeKnowledgeCandidate(e.target.checked)}
                className="mt-0.5 rounded border-slate-700 bg-slate-950 text-purple-500"
              />
              <label htmlFor="kbCandidateCheck" className="text-xs text-purple-200 cursor-pointer">
                <span className="font-bold block text-white mb-0.5">اعتماد كمرشح لقاعدة المعرفة (KB Candidate)</span>
                يسمح هذا بتضمين الحل تلقائياً لمساعدة المستخدمين الآخرين مستقبلاً بعد مراجعة المشرف.
              </label>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowResolveModal(false)}
                className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white bg-slate-800 rounded-lg transition"
              >
                رجوع
              </button>
              <button
                onClick={handleResolveTicket}
                disabled={isResolving || !resolutionText.trim()}
                className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 disabled:opacity-50 rounded-xl transition"
              >
                {isResolving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                تأكيد الحل وإغلاق التذكرة
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
