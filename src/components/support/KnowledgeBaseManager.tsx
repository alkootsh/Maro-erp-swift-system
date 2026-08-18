/**
 * @file KnowledgeBaseManager.tsx
 * @description إدارة قاعدة المعرفة الذكية، تتبع معدلات نجاح الحلول، ومراجعة المرشحات الجديدة
 */

import React, { useState } from 'react';
import { KnowledgeArticle, SupportModule } from '../../types/smartSupport';
import { SmartSupportRepository } from '../../repositories/smartSupportRepository';
import { 
  BookOpen, 
  Search, 
  Filter, 
  Plus, 
  CheckCircle2, 
  Star, 
  Clock, 
  ShieldCheck, 
  AlertCircle, 
  ChevronRight, 
  Edit3, 
  Check, 
  X,
  Sparkles,
  Tag
} from 'lucide-react';

interface KnowledgeBaseManagerProps {
  articles: KnowledgeArticle[];
  onRefresh: () => void;
  onSelectArticle?: (article: KnowledgeArticle) => void;
}

export const KnowledgeBaseManager: React.FC<KnowledgeBaseManagerProps> = ({
  articles,
  onRefresh,
  onSelectArticle
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedModule, setSelectedModule] = useState<string>('ALL');
  const [activeTab, setActiveTab] = useState<'APPROVED' | 'PENDING_REVIEW'>('APPROVED');
  const [selectedArticle, setSelectedArticle] = useState<KnowledgeArticle | null>(null);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);

  // Form State
  const [formTitle, setFormTitle] = useState<string>('');
  const [formTitleAr, setFormTitleAr] = useState<string>('');
  const [formModule, setFormModule] = useState<SupportModule>('POS');
  const [formSolutionAr, setFormSolutionAr] = useState<string>('');
  const [formSymptoms, setFormSymptoms] = useState<string>('');

  const filteredArticles = articles.filter(a => {
    const matchTab = activeTab === 'APPROVED' ? a.status === 'APPROVED' : a.status === 'PENDING_REVIEW';
    const matchModule = selectedModule === 'ALL' || a.module === selectedModule;
    const matchSearch = !searchQuery || 
      a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.titleArabic.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.solutionArabic.toLowerCase().includes(searchQuery.toLowerCase());
    return matchTab && matchModule && matchSearch;
  });

  const pendingCount = articles.filter(a => a.status === 'PENDING_REVIEW').length;

  const handleApproveCandidate = async (article: KnowledgeArticle) => {
    await SmartSupportRepository.saveKnowledgeArticle({
      ...article,
      status: 'APPROVED'
    });
    onRefresh();
  };

  const handleCreateArticle = async () => {
    if (!formTitleAr.trim() || !formSolutionAr.trim()) return;

    await SmartSupportRepository.saveKnowledgeArticle({
      id: `kb_${Date.now()}`,
      tenantId: 'global',
      title: formTitle || formTitleAr,
      titleArabic: formTitleAr,
      module: formModule,
      category: 'GENERAL_GUIDE',
      symptoms: formSymptoms.split(',').map(s => s.trim()).filter(Boolean),
      possibleCauses: ['خطأ في التكوين أو الصلاحيات'],
      diagnosticSteps: [
        { step: 1, title: 'فحص الإعدادات الأساسية', instruction: 'التحقق من التكوينات' }
      ],
      solution: formSolutionAr,
      solutionArabic: formSolutionAr,
      alternativeSolutions: [],
      requiredPermissions: ['STANDARD_USER'],
      affectedVersions: ['4.0.0'],
      severity: 'MEDIUM',
      attemptsCount: 0,
      solvedCount: 0,
      successRate: 100.0,
      avgResolutionSeconds: 90,
      ratingAverage: 5.0,
      status: 'APPROVED',
      tags: [formModule, 'Manual Entry'],
      mediaUrls: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    setShowAddModal(false);
    setFormTitle('');
    setFormTitleAr('');
    setFormSolutionAr('');
    setFormSymptoms('');
    onRefresh();
  };

  return (
    <div id="knowledge-base-manager" className="space-y-6">
      {/* 1. Header & Controls */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-emerald-400" />
              قاعدة المعرفة الذكية وحلول الأعطال (Knowledge Intelligence)
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              مكتبة حلول حقيقية تتعلم من التذاكر وتتحدث تلقائياً بمعدلات النجاح الفعلية.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Tabs */}
            <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
              <button
                onClick={() => setActiveTab('APPROVED')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                  activeTab === 'APPROVED'
                    ? 'bg-emerald-500 text-slate-950 shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                المقالات المعتمدة ({articles.filter(a => a.status === 'APPROVED').length})
              </button>

              <button
                onClick={() => setActiveTab('PENDING_REVIEW')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition flex items-center gap-1.5 ${
                  activeTab === 'PENDING_REVIEW'
                    ? 'bg-purple-600 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>مرشحة للمراجعة</span>
                {pendingCount > 0 && (
                  <span className="w-5 h-5 rounded-full bg-purple-500 text-white text-[10px] flex items-center justify-center font-bold">
                    {pendingCount}
                  </span>
                )}
              </button>
            </div>

            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-xl shadow transition"
            >
              <Plus className="w-4 h-4" />
              إضافة حل جديد
            </button>
          </div>
        </div>

        {/* Search & Filter Filters */}
        <div className="flex flex-col md:flex-row items-center gap-3 mt-5 pt-4 border-t border-slate-800">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute right-3 top-2.5 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث في الأعراض، الحلول، أو الكلمات المفتاحية..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pr-9 pl-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <Filter className="w-4 h-4 text-slate-500" />
            <select
              value={selectedModule}
              onChange={(e) => setSelectedModule(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
            >
              <option value="ALL">جميع الموديولات</option>
              <option value="POS">نقطة البيع (POS)</option>
              <option value="HARDWARE_PRINTING">العتاد والطابعات</option>
              <option value="INVENTORY">المخزون والجرد</option>
              <option value="SYNC_OFFLINE">المزامنة أوفلاين</option>
              <option value="ZATCA_E_INVOICE">الفاتورة الإلكترونية ZATCA</option>
              <option value="SECURITY_LICENSING">التراخيص والأمان</option>
            </select>
          </div>
        </div>
      </div>

      {/* 2. Articles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredArticles.map((art) => (
          <div
            key={art.id}
            onClick={() => setSelectedArticle(art)}
            className="bg-slate-900 border border-slate-800 hover:border-emerald-500/50 rounded-xl p-5 shadow-md hover:shadow-xl transition cursor-pointer flex flex-col justify-between group"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="px-2.5 py-0.5 text-[11px] font-bold rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                  {art.module}
                </span>

                <div className="flex items-center gap-1.5 text-xs text-amber-400">
                  <Star className="w-3.5 h-3.5 fill-current" />
                  <span className="font-bold">{art.ratingAverage || '5.0'}</span>
                </div>
              </div>

              <h3 className="text-sm font-bold text-white group-hover:text-emerald-400 transition line-clamp-2 mb-2">
                {art.titleArabic || art.title}
              </h3>

              <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed mb-4">
                {art.solutionArabic || art.solution}
              </p>
            </div>

            <div className="border-t border-slate-800 pt-3 flex items-center justify-between text-[11px]">
              <div>
                <span className="text-slate-500 block">نسبة النجاح:</span>
                <span className="font-bold text-emerald-400">{art.successRate || 100}%</span>
                <span className="text-slate-500 text-[10px] mr-1">({art.solvedCount} حل)</span>
              </div>

              {art.status === 'PENDING_REVIEW' ? (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleApproveCandidate(art);
                  }}
                  className="px-2.5 py-1 text-[11px] font-bold bg-emerald-400 text-slate-950 rounded-lg hover:bg-emerald-300 transition"
                >
                  اعتماد فوري
                </button>
              ) : (
                <span className="text-emerald-400 group-hover:translate-x-[-4px] transition flex items-center gap-1">
                  عرض التفاصيل <ChevronRight className="w-3.5 h-3.5" />
                </span>
              )}
            </div>
          </div>
        ))}

        {filteredArticles.length === 0 && (
          <div className="col-span-full bg-slate-900 border border-slate-800 rounded-xl p-12 text-center text-slate-400">
            <BookOpen className="w-12 h-12 mx-auto text-slate-600 mb-3" />
            <p className="text-sm font-semibold">لا توجد مقالات تطابق معايير البحث الحالية.</p>
          </div>
        )}
      </div>

      {/* Article Detail Modal */}
      {selectedArticle && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-2xl w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 text-xs font-bold bg-emerald-500/20 text-emerald-300 rounded border border-emerald-500/30">
                  {selectedArticle.module}
                </span>
                <h3 className="text-base font-bold text-white">{selectedArticle.titleArabic}</h3>
              </div>
              <button onClick={() => setSelectedArticle(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Symptoms */}
            {selectedArticle.symptoms && selectedArticle.symptoms.length > 0 && (
              <div>
                <span className="text-xs font-bold text-slate-400 block mb-1">الأعراض المرصودة:</span>
                <div className="flex flex-wrap gap-1.5">
                  {selectedArticle.symptoms.map((s, i) => (
                    <span key={i} className="px-2.5 py-1 text-[11px] bg-slate-950 border border-slate-800 rounded-lg text-slate-300">
                      • {s}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Solution */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
              <span className="text-xs font-bold text-emerald-400 block mb-2">الحل المعتمد:</span>
              <p className="text-xs text-slate-200 whitespace-pre-line leading-relaxed">
                {selectedArticle.solutionArabic || selectedArticle.solution}
              </p>
            </div>

            {/* Verification Steps */}
            {selectedArticle.diagnosticSteps && selectedArticle.diagnosticSteps.length > 0 && (
              <div>
                <span className="text-xs font-bold text-slate-400 block mb-2">خطوات الفحص المقترحة:</span>
                <div className="space-y-2">
                  {selectedArticle.diagnosticSteps.map((step, i) => (
                    <div key={i} className="p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-xs flex items-center justify-between">
                      <span className="text-slate-200">{i + 1}. {step.title}</span>
                      <span className="text-slate-500 text-[11px]">{step.instruction}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="border-t border-slate-800 pt-4 flex items-center justify-between">
              <div className="flex items-center gap-4 text-xs text-slate-400">
                <span>نسبة النجاح: <strong className="text-emerald-400">{selectedArticle.successRate}%</strong></span>
                <span>مرات الحل: <strong className="text-white">{selectedArticle.solvedCount}</strong></span>
              </div>

              {selectedArticle.status === 'PENDING_REVIEW' && (
                <button
                  onClick={() => {
                    handleApproveCandidate(selectedArticle);
                    setSelectedArticle(null);
                  }}
                  className="px-4 py-2 text-xs font-bold bg-emerald-400 text-slate-950 rounded-xl transition"
                >
                  اعتماد الحل وترقيته
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add New Article Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-emerald-400" />
                إضافة مقال جديد لقاعدة المعرفة
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">الموديول</label>
                <select
                  value={formModule}
                  onChange={(e) => setFormModule(e.target.value as SupportModule)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white"
                >
                  <option value="POS">نقطة البيع (POS)</option>
                  <option value="HARDWARE_PRINTING">العتاد والطابعات</option>
                  <option value="INVENTORY">المخزون وحساب الأرصدة</option>
                  <option value="SYNC_OFFLINE">المزامنة أوفلاين</option>
                  <option value="ZATCA_E_INVOICE">الفاتورة الإلكترونية ZATCA</option>
                  <option value="SECURITY_LICENSING">التراخيص والأمان</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">عنوان المشكلة أو العَرَض (بالعربية)</label>
                <input
                  type="text"
                  value={formTitleAr}
                  onChange={(e) => setFormTitleAr(e.target.value)}
                  placeholder="مثال: تعذر مسح باركود الميزان في شاشة POS..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">كلمات مفتاحية وأعراض (مفصولة بفاصلة)</label>
                <input
                  type="text"
                  value={formSymptoms}
                  onChange={(e) => setFormSymptoms(e.target.value)}
                  placeholder="ميزان, باركود, خطأ في الوزن, وزن الصنف"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">الحل الفني المعتمد</label>
                <textarea
                  value={formSolutionAr}
                  onChange={(e) => setFormSolutionAr(e.target.value)}
                  placeholder="اكتب خطوات الحل بالتفصيل..."
                  rows={4}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white bg-slate-800 rounded-lg"
              >
                إلغاء
              </button>
              <button
                onClick={handleCreateArticle}
                className="px-5 py-2.5 text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-xl shadow transition"
              >
                حفظ ونشر المقال
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
