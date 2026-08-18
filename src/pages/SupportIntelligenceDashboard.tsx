/**
 * @file SupportIntelligenceDashboard.tsx
 * @module MARO Support Intelligence Dashboard Page
 * @description صفحة تحليلات ولوحة قيادة الدعم الفني والذكاء التشخيصي (AI Support BI & Analytics)
 */

import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Sparkles, 
  RefreshCw, 
  Layers, 
  ShieldCheck, 
  Clock, 
  TrendingUp, 
  AlertTriangle,
  Building,
  CheckCircle2,
  HelpCircle,
  Activity
} from 'lucide-react';
import { ScreenHubTabs } from '../components/common/ScreenHubTabs';
import { SmartSupportRepository } from '../repositories/smartSupportRepository';
import { SupportAnalyticsOverview, ProblemCluster } from '../types/smartSupport';
import { SupportAnalyticsDashboard } from '../components/support/SupportAnalyticsDashboard';

export const SupportIntelligenceDashboard: React.FC = () => {
  const [analytics, setAnalytics] = useState<SupportAnalyticsOverview | null>(null);
  const [clusters, setClusters] = useState<ProblemCluster[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [fetchedAnalytics, fetchedClusters] = await Promise.all([
        SmartSupportRepository.getAnalyticsOverview(),
        SmartSupportRepository.getProblemClusters()
      ]);
      setAnalytics(fetchedAnalytics);
      setClusters(fetchedClusters);
    } catch (e) {
      console.error('Error loading support intelligence overview:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="space-y-6 text-right">
      {/* Top Navigation Tabs */}
      <ScreenHubTabs hub="support" />

      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#151b2b] p-6 rounded-2xl border border-[#1e293b]">
        <div>
          <h1 className="text-xl font-black text-white flex items-center gap-2">
            <BarChart3 className="text-blue-400" size={24} />
            <span>لوحة تحليلات ومؤشرات الدعم الفني (Support Intelligence Dashboard)</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            مراقبة معدل الحل الذكي (AI Resolution Rate)، متوسط زمن إغلاق التذاكر (MTTR)، وأكثر الشاشات والموديلز المسببة للبلاغات.
          </p>
        </div>
        <button
          onClick={loadData}
          disabled={loading}
          className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer shadow-md"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin text-blue-400' : ''} />
          <span>تحديث البيانات</span>
        </button>
      </div>

      {/* Main Analytics Content */}
      {loading || !analytics ? (
        <div className="p-12 text-center bg-[#151b2b] rounded-2xl border border-[#1e293b]">
          <RefreshCw size={32} className="animate-spin text-blue-400 mx-auto mb-3" />
          <p className="text-slate-400 text-xs font-bold">جاري تحميل المؤشرات والتحليلات البيانية للـ AI Support...</p>
        </div>
      ) : (
        <SupportAnalyticsDashboard analytics={analytics} clusters={clusters} />
      )}
    </div>
  );
};

export default SupportIntelligenceDashboard;
