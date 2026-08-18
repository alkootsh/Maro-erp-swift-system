/**
 * @file SupportCenter.tsx
 * @module MARO Smart Support & Ticket Intelligence Hub
 * @description مركز الدعم الفني الذكي، التشخيص التفاعلي، إدارة التذاكر، وقاعدة المعرفة مع دعم الأوفلاين
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Headphones, 
  Sparkles, 
  Send, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Layers, 
  FileText, 
  Search, 
  RefreshCw, 
  ShieldCheck, 
  HelpCircle, 
  Activity, 
  BookOpen, 
  BarChart3, 
  Wifi, 
  WifiOff, 
  Plus, 
  ChevronRight, 
  User, 
  Smartphone,
  Check
} from 'lucide-react';
import { ScreenHubTabs } from '../components/common/ScreenHubTabs';
import { SmartSupportRepository } from '../repositories/smartSupportRepository';
import { 
  SupportTicket, 
  SupportDiagnosis, 
  SupportSession, 
  KnowledgeArticle, 
  SimilarTicketMatch,
  SupportAnalyticsOverview,
  ProblemCluster 
} from '../types/smartSupport';
import { InteractiveResolutionFlow } from '../components/support/InteractiveResolutionFlow';
import { TicketDetailIntelligenceView } from '../components/support/TicketDetailIntelligenceView';
import { KnowledgeBaseManager } from '../components/support/KnowledgeBaseManager';
import { SupportAnalyticsDashboard } from '../components/support/SupportAnalyticsDashboard';

export const SupportCenter: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'assistant' | 'tickets' | 'kb' | 'analytics' | 'offline'>('assistant');
  
  // Data States
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [kbArticles, setKbArticles] = useState<KnowledgeArticle[]>([]);
  const [analytics, setAnalytics] = useState<SupportAnalyticsOverview | null>(null);
  const [clusters, setClusters] = useState<ProblemCluster[]>([]);
  const [offlineQueue, setOfflineQueue] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Active Ticket Detail View
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [selectedTicketEvents, setSelectedTicketEvents] = useState<any[]>([]);
  const [selectedTicketSimilar, setSelectedTicketSimilar] = useState<SimilarTicketMatch[]>([]);

  // Interactive Assistant State
  const [userQuery, setUserQuery] = useState<string>('');
  const [isDiagnosing, setIsDiagnosing] = useState<boolean>(false);
  const [activeDiagnosis, setActiveDiagnosis] = useState<SupportDiagnosis | null>(null);
  const [activeSession, setActiveSession] = useState<SupportSession | null>(null);
  const [matchedArticle, setMatchedArticle] = useState<KnowledgeArticle | undefined>(undefined);
  const [similarTickets, setSimilarTickets] = useState<SimilarTicketMatch[]>([]);

  // Ticket Filters
  const [ticketSearch, setTicketSearch] = useState<string>('');
  const [ticketStatusFilter, setTicketStatusFilter] = useState<string>('ALL');
  const [ticketModuleFilter, setTicketModuleFilter] = useState<string>('ALL');

  // Load Initial Data
  const loadData = async () => {
    setLoading(true);
    try {
      const [fetchedTickets, fetchedArticles, fetchedAnalytics, fetchedClusters] = await Promise.all([
        SmartSupportRepository.getTickets(),
        SmartSupportRepository.getKnowledgeArticles(),
        SmartSupportRepository.getAnalyticsOverview(),
        SmartSupportRepository.getProblemClusters()
      ]);

      setTickets(fetchedTickets);
      setKbArticles(fetchedArticles);
      setAnalytics(fetchedAnalytics);
      setClusters(fetchedClusters);

      // Check Offline Queue
      const queueStr = localStorage.getItem('maro_support_offline_tickets_queue');
      if (queueStr) {
        try { setOfflineQueue(JSON.parse(queueStr)); } catch {}
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Handle Diagnose
  const handleStartDiagnosis = async (selectedQuery?: string) => {
    const text = selectedQuery || userQuery;
    if (!text.trim()) return;

    setIsDiagnosing(true);
    try {
      const userStr = localStorage.getItem('maro_auth_user');
      const currentUser = userStr ? JSON.parse(userStr) : { name: 'المسؤول', id: 'usr_admin' };

      const res = await fetch('/api/support/diagnose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userQuery: text,
          screen: 'Support Center Hub',
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
          setSimilarTickets(data.similarTickets || []);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsDiagnosing(false);
    }
  };

  // Open Ticket Details
  const handleSelectTicket = async (ticket: SupportTicket) => {
    setSelectedTicket(ticket);
    const detail = await SmartSupportRepository.getTicketById(ticket.id);
    if (detail) {
      setSelectedTicketEvents(detail.events || []);
      setSelectedTicketSimilar(detail.similarTickets || []);
    }
  };

  // Sync Offline Queue
  const handleSyncOfflineQueue = async () => {
    setIsSyncing(true);
    try {
      const res = await SmartSupportRepository.syncOfflineQueue();
      if (res.syncedCount > 0) {
        setOfflineQueue([]);
        await loadData();
      }
    } finally {
      setIsSyncing(false);
    }
  };

  // Filtered Tickets
  const filteredTickets = tickets.filter(t => {
    const matchSearch = !ticketSearch || 
      t.ticketNumber.toLowerCase().includes(ticketSearch.toLowerCase()) ||
      t.title.toLowerCase().includes(ticketSearch.toLowerCase()) ||
      t.userName.toLowerCase().includes(ticketSearch.toLowerCase());
    const matchStatus = ticketStatusFilter === 'ALL' || t.status === ticketStatusFilter;
    const matchModule = ticketModuleFilter === 'ALL' || t.module === ticketModuleFilter;
    return matchSearch && matchStatus && matchModule;
  });

  return (
    <div id="support-center-page" className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Screen Hub Tabs */}
      <ScreenHubTabs hub="settings" />

      {/* Main Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-600 flex items-center justify-center text-slate-950 font-bold shadow-lg shadow-emerald-500/20">
              <Headphones className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-white">MARO Smart Support & Ticket Intelligence</h1>
                <span className="px-2.5 py-0.5 text-xs font-bold bg-emerald-500/20 text-emerald-400 rounded-full border border-emerald-500/30">
                  ذكاء تشخيصي متكامل v4.0
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                نظام دعم فني يتعلم من مشاكل وحلول المنظومة الحقيقية، يحل المشاكل فورياً، ويمنع تكرار الأعطال.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link 
              to="/adaptive-erp" 
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 rounded-xl text-xs font-bold transition-all whitespace-nowrap"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>دليل موديولات MARO Adaptive ERP</span>
            </Link>

            {/* Navigation Sub-Tabs */}
            <div className="flex flex-wrap items-center bg-slate-950 p-1.5 rounded-xl border border-slate-800">
              <button
                onClick={() => { setActiveTab('assistant'); setSelectedTicket(null); }}
                className={`flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-lg transition ${
                  activeTab === 'assistant'
                    ? 'bg-emerald-500 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Sparkles className="w-4 h-4" />
                <span>المساعد الذكي (Diagnosis)</span>
              </button>

              <button
                onClick={() => { setActiveTab('tickets'); setSelectedTicket(null); }}
                className={`flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-lg transition ${
                  activeTab === 'tickets'
                    ? 'bg-emerald-500 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>تذاكر الدعم ({tickets.length})</span>
              </button>

              <button
                onClick={() => { setActiveTab('kb'); setSelectedTicket(null); }}
                className={`flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-lg transition ${
                  activeTab === 'kb'
                    ? 'bg-emerald-500 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <BookOpen className="w-4 h-4" />
                <span>قاعدة المعرفة ({kbArticles.length})</span>
              </button>

              <button
                onClick={() => { setActiveTab('analytics'); setSelectedTicket(null); }}
                className={`flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-lg transition ${
                  activeTab === 'analytics'
                    ? 'bg-emerald-500 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <BarChart3 className="w-4 h-4" />
                <span>لوحة التحليلات</span>
              </button>

              <button
                onClick={() => { setActiveTab('offline'); setSelectedTicket(null); }}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-lg transition ${
                  activeTab === 'offline'
                    ? 'bg-emerald-500 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <WifiOff className="w-3.5 h-3.5" />
                <span>طابور الأوفلاين</span>
                {offlineQueue.length > 0 && (
                  <span className="px-1.5 py-0.2 bg-amber-500 text-slate-950 rounded-full text-[10px] font-black">
                    {offlineQueue.length}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 1. TAB: SMART ASSISTANT & LIVE DIAGNOSIS */}
      {activeTab === 'assistant' && (
        <div>
          {activeDiagnosis && activeSession ? (
            <InteractiveResolutionFlow
              diagnosis={activeDiagnosis}
              initialSession={activeSession}
              matchedArticle={matchedArticle}
              similarTickets={similarTickets}
              onBackToSearch={() => {
                setActiveDiagnosis(null);
                setActiveSession(null);
                setUserQuery('');
              }}
              onTicketCreated={(ticket) => {
                setTickets([ticket, ...tickets]);
                handleSelectTicket(ticket);
                setActiveTab('tickets');
              }}
            />
          ) : (
            <div className="space-y-6">
              {/* Hero Search Box */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-xl text-center space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 mx-auto flex items-center justify-center shadow-inner">
                  <Sparkles className="w-7 h-7" />
                </div>
                <div className="max-w-xl mx-auto">
                  <h2 className="text-xl font-black text-white">ما هي المشكلة التي تواجهك في المنظومة؟</h2>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    اكتب تفاصيل المشكلة أو رسالة الخطأ وسيقوم المساعد الذكي بفحص الصلاحيات، المخزون، الطابعات، ومزامنة السيرفر فورياً.
                  </p>
                </div>

                <div className="max-w-2xl mx-auto space-y-3">
                  <div className="relative">
                    <textarea
                      value={userQuery}
                      onChange={(e) => setUserQuery(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleStartDiagnosis();
                        }
                      }}
                      placeholder="اكتب هنا مثلاً: الفاتورة مش بتتحفظ في نقطة البيع أو طابعة الباركود لا تستجيب..."
                      rows={3}
                      className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 shadow-inner"
                    />
                  </div>

                  <button
                    onClick={() => handleStartDiagnosis()}
                    disabled={isDiagnosing || !userQuery.trim()}
                    className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 disabled:opacity-50 text-slate-950 font-black text-xs rounded-xl shadow-lg transition flex items-center justify-center gap-2"
                  >
                    {isDiagnosing ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        جاري التشخيص والفحص التلقائي...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        بدء التشخيص الذكي الفوري
                      </>
                    )}
                  </button>
                </div>

                {/* Quick Symptom Chips */}
                <div className="max-w-2xl mx-auto pt-4 border-t border-slate-800/80">
                  <span className="text-xs font-bold text-slate-400 block mb-2.5">
                    أو اختر من المشاكل التشغيلية الشائعة:
                  </span>
                  <div className="flex flex-wrap items-center justify-center gap-2">
                    {[
                      'الفاتورة مش بتتحفظ في نقطة البيع POS',
                      'طابعة الإيصالات الحرارية لا تستجيب',
                      'اختلاف رصيد المخزون بعد الترحيل',
                      'توقف مزامنة العمليات أوفلاين',
                      'خطأ في توقيع XML لفاتورة زاتكا'
                    ].map((symptom, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setUserQuery(symptom);
                          handleStartDiagnosis(symptom);
                        }}
                        className="px-3 py-1.5 text-xs bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-emerald-500/40 text-slate-300 rounded-xl transition"
                      >
                        • {symptom}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Fast Stats Row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-white font-mono">74.2%</h4>
                    <p className="text-xs text-slate-400">معدل الحل الذكي دون الحاجة لفتح تذكرة</p>
                  </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-sky-500/10 text-sky-400 flex items-center justify-center font-bold">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-white font-mono">1.4 دقيقة</h4>
                    <p className="text-xs text-slate-400">متوسط زمن الاستجابة والتشخيص الأولى</p>
                  </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center font-bold">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-white font-mono">{kbArticles.length} حل معتمد</h4>
                    <p className="text-xs text-slate-400">في قاعدة المعرفة المحدثة تلقائياً</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 2. TAB: TICKETS MANAGEMENT */}
      {activeTab === 'tickets' && (
        <div>
          {selectedTicket ? (
            <TicketDetailIntelligenceView
              ticket={selectedTicket}
              events={selectedTicketEvents}
              similarTickets={selectedTicketSimilar}
              onBack={() => setSelectedTicket(null)}
              onTicketUpdated={loadData}
            />
          ) : (
            <div className="space-y-4">
              {/* Search & Filters */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow flex flex-col md:flex-row items-center gap-3">
                <div className="relative flex-1 w-full">
                  <Search className="w-4 h-4 absolute right-3 top-2.5 text-slate-500" />
                  <input
                    type="text"
                    value={ticketSearch}
                    onChange={(e) => setTicketSearch(e.target.value)}
                    placeholder="ابحث برقم التذكرة، العنوان، أو اسم العميل..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pr-9 pl-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <select
                  value={ticketStatusFilter}
                  onChange={(e) => setTicketStatusFilter(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200"
                >
                  <option value="ALL">جميع الحالات</option>
                  <option value="OPEN">مفتوحة</option>
                  <option value="IN_PROGRESS">قيد المتابعة</option>
                  <option value="RESOLVED">تم الحل</option>
                </select>

                <select
                  value={ticketModuleFilter}
                  onChange={(e) => setTicketModuleFilter(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200"
                >
                  <option value="ALL">جميع الموديولات</option>
                  <option value="POS">POS</option>
                  <option value="HARDWARE_PRINTING">العتاد والطابعات</option>
                  <option value="INVENTORY">المخزون</option>
                  <option value="SYNC_OFFLINE">المزامنة</option>
                  <option value="ZATCA_E_INVOICE">ZATCA</option>
                </select>
              </div>

              {/* Tickets Table */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                      <tr>
                        <th className="p-3.5">رقم التذكرة</th>
                        <th className="p-3.5">الموضوع والتشخيص</th>
                        <th className="p-3.5">الموديول</th>
                        <th className="p-3.5">المستخدم والفرع</th>
                        <th className="p-3.5">الأهمية</th>
                        <th className="p-3.5">الحالة</th>
                        <th className="p-3.5">الإجراءات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {filteredTickets.map((t) => (
                        <tr
                          key={t.id}
                          onClick={() => handleSelectTicket(t)}
                          className="hover:bg-slate-800/40 cursor-pointer transition"
                        >
                          <td className="p-3.5 font-mono font-bold text-emerald-400">{t.ticketNumber}</td>
                          <td className="p-3.5">
                            <span className="font-semibold text-white block">{t.title}</span>
                            <span className="text-[11px] text-slate-400 line-clamp-1">{t.aiSummary || t.description}</span>
                          </td>
                          <td className="p-3.5">
                            <span className="px-2 py-0.5 text-[10px] font-bold bg-slate-800 text-slate-300 rounded border border-slate-700">
                              {t.module}
                            </span>
                          </td>
                          <td className="p-3.5">
                            <span className="text-slate-200 block">{t.userName}</span>
                            <span className="text-[10px] text-slate-500">{t.companyName} ({t.branchName || 'الرئيسي'})</span>
                          </td>
                          <td className="p-3.5">
                            <span className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                              t.severity === 'CRITICAL' ? 'bg-rose-500/20 text-rose-300' :
                              t.severity === 'HIGH' ? 'bg-amber-500/20 text-amber-300' :
                              'bg-sky-500/20 text-sky-300'
                            }`}>
                              {t.severity}
                            </span>
                          </td>
                          <td className="p-3.5">
                            <span className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                              t.status === 'RESOLVED' ? 'bg-emerald-500/20 text-emerald-400' :
                              t.status === 'IN_PROGRESS' ? 'bg-amber-500/20 text-amber-400' :
                              'bg-rose-500/20 text-rose-400'
                            }`}>
                              {t.status === 'RESOLVED' ? 'تم الحل' :
                               t.status === 'IN_PROGRESS' ? 'قيد المتابعة' : 'مفتوحة'}
                            </span>
                          </td>
                          <td className="p-3.5">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSelectTicket(t);
                              }}
                              className="px-3 py-1 text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg transition"
                            >
                              عرض التشخيص ⬅
                            </button>
                          </td>
                        </tr>
                      ))}

                      {filteredTickets.length === 0 && (
                        <tr>
                          <td colSpan={7} className="p-8 text-center text-slate-400">
                            لا توجد تذاكر دعم تطابق معايير البحث.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3. TAB: KNOWLEDGE BASE */}
      {activeTab === 'kb' && (
        <KnowledgeBaseManager
          articles={kbArticles}
          onRefresh={loadData}
          onSelectArticle={(art) => {
            setUserQuery(art.titleArabic);
            setActiveTab('assistant');
            handleStartDiagnosis(art.titleArabic);
          }}
        />
      )}

      {/* 4. TAB: ANALYTICS & BI */}
      {activeTab === 'analytics' && analytics && (
        <SupportAnalyticsDashboard
          analytics={analytics}
          clusters={clusters}
        />
      )}

      {/* 5. TAB: OFFLINE SYNC QUEUE */}
      {activeTab === 'offline' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <WifiOff className="w-5 h-5 text-amber-400" />
                طابور تذاكر الدعم أوفلاين (Offline Sync Queue)
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                تذاكر تم إنشاؤها محلياً أثناء انقطاع الإنترنت، يتم مزامنتها تلقائياً مع تفادي التكرار (Idempotent Sync).
              </p>
            </div>

            <button
              onClick={handleSyncOfflineQueue}
              disabled={isSyncing || offlineQueue.length === 0}
              className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 disabled:opacity-50 rounded-xl transition"
            >
              {isSyncing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              مزامنة الطابور الآن ({offlineQueue.length})
            </button>
          </div>

          <div className="space-y-3">
            {offlineQueue.map((item, idx) => (
              <div key={idx} className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl text-xs flex items-center justify-between">
                <div>
                  <span className="font-mono text-emerald-400 font-bold block">{item.ticketNumber}</span>
                  <span className="font-semibold text-white">{item.title}</span>
                  <span className="text-[10px] text-slate-500 block">المفتاح الثابت: {item.idempotencyKey}</span>
                </div>
                <span className="px-2.5 py-1 text-[10px] font-bold bg-amber-500/20 text-amber-400 rounded-md border border-amber-500/30">
                  معلق في التخزين المحلي
                </span>
              </div>
            ))}

            {offlineQueue.length === 0 && (
              <div className="p-8 text-center text-slate-400 space-y-2">
                <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-400" />
                <p className="text-sm font-semibold text-white">طابور الأوفلاين فارغ ونظيف تماماً</p>
                <p className="text-xs text-slate-500">جميع تذاكر الدعم والتشخيص متزامنة مع خادم MARO المركزي.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
