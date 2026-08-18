/**
 * @file SupportAnalyticsDashboard.tsx
 * @description لوحة تحليلات الدعم الفني الذكي ومؤشرات الأداء (BI Intelligence & Resolution Analytics)
 */

import React from 'react';
import { SupportAnalyticsOverview, ProblemCluster } from '../../types/smartSupport';
import { 
  BarChart3, 
  TrendingUp, 
  Sparkles, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Layers, 
  ShieldCheck, 
  Activity, 
  ArrowUpRight, 
  Building,
  Target
} from 'lucide-react';

interface SupportAnalyticsDashboardProps {
  analytics: SupportAnalyticsOverview;
  clusters?: ProblemCluster[];
}

export const SupportAnalyticsDashboard: React.FC<SupportAnalyticsDashboardProps> = ({
  analytics,
  clusters = []
}) => {
  return (
    <div id="support-analytics-dashboard" className="space-y-6">
      {/* 1. Core KPIs Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: AI Resolution Rate */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">معدل الحل الذكي للـ AI</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black text-emerald-400 font-mono">{analytics.aiResolutionRate}%</h3>
            <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
              <ArrowUpRight className="w-3 h-3 text-emerald-400" />
              <span>تم حل {analytics.aiResolvedCount} مشكلة دون الحاجة لتذكرة</span>
            </p>
          </div>
        </div>

        {/* KPI 2: Total Sessions & Cases */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">إجمالي جلسات التشخيص</span>
            <div className="w-8 h-8 rounded-lg bg-sky-500/10 text-sky-400 flex items-center justify-center">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black text-white font-mono">{analytics.totalSessions}</h3>
            <p className="text-[11px] text-slate-400 mt-1">
              تم تصعيد {analytics.totalTickets} تذكرة للمهندسين
            </p>
          </div>
        </div>

        {/* KPI 3: Avg Resolution Speed */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">متوسط زمن الحل (MTTR)</span>
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black text-purple-400 font-mono">{analytics.averageResolutionMinutes} دقيقة</h3>
            <p className="text-[11px] text-slate-400 mt-1">
              متوسط الاستجابة الأولى: {analytics.averageFirstResponseMinutes} د
            </p>
          </div>
        </div>

        {/* KPI 4: Repeated Problems */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">أنماط المشاكل المتكررة</span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black text-amber-400 font-mono">{analytics.repeatedProblemsCount}</h3>
            <p className="text-[11px] text-slate-400 mt-1">
              تم تجميعها في عناقيد تشخيصية تلقائية
            </p>
          </div>
        </div>
      </div>

      {/* 2. Middle Section: Module Distribution & Top Clusters */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Module Breakdown */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-emerald-400" />
              توزيع المشاكل حسب موديولات MARO
            </h3>
          </div>

          <div className="space-y-3">
            {analytics.topModules.map((m, i) => (
              <div key={i} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-200">{m.module}</span>
                  <span className="font-mono text-slate-400">{m.count} حالة ({m.percentage}%)</span>
                </div>
                <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-emerald-400 rounded-full transition-all duration-500"
                    style={{ width: `${m.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Problem Clusters */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-purple-400" />
              أكبر عناقيد المشاكل الشائعة (Problem Clusters)
            </h3>
          </div>

          <div className="space-y-3">
            {analytics.topClusters.map((c, i) => (
              <div key={i} className="p-3 bg-slate-950 border border-slate-800 rounded-lg text-xs flex items-center justify-between">
                <div>
                  <span className="font-bold text-white block">{c.name}</span>
                  <span className="text-[11px] text-slate-400">الموديول: {c.module}</span>
                </div>
                <div className="text-left">
                  <span className="px-2 py-0.5 text-[11px] font-bold bg-purple-500/20 text-purple-300 rounded border border-purple-500/30">
                    {c.count} تذكرة
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 3. Effective vs Failing Solutions & Branch Ranking */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Most Effective Solutions */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-3">
          <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            أعلى الحلول كفاءة ونجاحاً
          </h3>

          <div className="space-y-2.5">
            {analytics.mostEffectiveSolutions.map((sol, i) => (
              <div key={i} className="p-3 bg-slate-950 border border-emerald-500/20 rounded-lg text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-200">{sol.title}</span>
                  <span className="text-emerald-400 font-bold font-mono">{sol.successRate}%</span>
                </div>
                <span className="text-[10px] text-slate-500">تم تطبيقه بنجاح {sol.count} مرة</span>
              </div>
            ))}
          </div>
        </div>

        {/* Failed / Deprecated Solutions */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-3">
          <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
            <AlertTriangle className="w-4 h-4 text-rose-400" />
            حلول ذات معدل فشل مرتفع (تحتاج مراجعة)
          </h3>

          <div className="space-y-2.5">
            {analytics.failedSolutions.map((f, i) => (
              <div key={i} className="p-3 bg-slate-950 border border-rose-500/20 rounded-lg text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-200">{f.title}</span>
                  <span className="text-rose-400 font-bold font-mono">فشل {f.failureRate}%</span>
                </div>
                <span className="text-[10px] text-slate-500">تم رصده في {f.count} محاولة</span>
              </div>
            ))}
          </div>
        </div>

        {/* Branch Activity Ranking */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-3">
          <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
            <Building className="w-4 h-4 text-sky-400" />
            نشاط الدعم حسب الفروع
          </h3>

          <div className="space-y-2.5">
            {analytics.topBranches.map((b, i) => (
              <div key={i} className="p-3 bg-slate-950 border border-slate-800 rounded-lg text-xs flex items-center justify-between">
                <span className="font-semibold text-slate-200">{b.branchName}</span>
                <span className="px-2 py-0.5 text-[11px] font-bold bg-sky-500/10 text-sky-400 rounded">
                  {b.count} تذكرة
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
