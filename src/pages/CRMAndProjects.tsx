/**
 * @file CRMAndProjects.tsx
 * @module واجهات وصفحات النظام (UI Pages)
 * @description ملف جزء من نظام MARO ERP. الوظيفة: CRMAndProjects.tsx.
 */
import React, { useState } from 'react';
import { 
  Users, 
  Briefcase, 
  KanbanSquare, 
  PhoneCall, 
  Mail, 
  Calendar, 
  MoreHorizontal, 
  Plus, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  Building,
  Target,
  TrendingUp,
  DollarSign
} from 'lucide-react';
import { formatCurrency, cn } from '../lib/utils';

type Tab = 'crm' | 'projects';

export const CRMAndProjects: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('crm');

  const pipelineStages = [
    { id: 'lead', name: 'فرص جديدة (Leads)', color: 'border-slate-500' },
    { id: 'qualified', name: 'مؤهل (Qualified)', color: 'border-blue-500' },
    { id: 'proposal', name: 'تقديم عرض (Proposal)', color: 'border-amber-500' },
    { id: 'won', name: 'تم البيع (Won)', color: 'border-emerald-500' },
  ];

  const mockOpportunities = [
    { id: 1, title: 'تجهيز مطعم وكافيه', client: 'مجموعة الضيافة', value: 150000, stage: 'proposal', probability: 70 },
    { id: 2, title: 'توريد أجهزة نقاط بيع', client: 'أسواق العثيم', value: 450000, stage: 'qualified', probability: 40 },
    { id: 3, title: 'عقد صيانة سنوي', client: 'مستشفى النور', value: 85000, stage: 'lead', probability: 20 },
    { id: 4, title: 'تأسيس شبكة الفروع', client: 'صيدليات النهدي', value: 850000, stage: 'won', probability: 100 },
  ];

  const mockProjects = [
    { 
      id: 'PRJ-23-01', 
      name: 'تنفيذ وتجهيز فرع الرياض', 
      client: 'شركة التجزئة المتقدمة', 
      budget: 1200000, 
      actualCost: 850000, 
      progress: 75,
      status: 'active',
      deadline: '2023-12-01'
    },
    { 
      id: 'PRJ-23-02', 
      name: 'تطوير البنية التحتية', 
      client: 'مجموعة التصنيع', 
      budget: 450000, 
      actualCost: 460000, 
      progress: 90,
      status: 'delayed',
      deadline: '2023-11-15'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-950 via-[#151b2b] to-[#0f172a] p-6 rounded-2xl border border-blue-900/40 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-400 font-bold text-xs border border-blue-500/30">
              MARO Phase 8: CRM & Projects
            </span>
          </div>
          <h1 className="text-2xl font-black text-white">إدارة علاقات العملاء والمشاريع</h1>
          <p className="text-xs text-slate-400 mt-1">
            منظومة متكاملة لتبويب الفرص البيعية (Pipeline) وإدارة المشاريع (WIP, Budgets) والمقاولات، مرتبطة بالنواة المحاسبية.
          </p>
        </div>
        <div className="flex items-center gap-3">
           <div className="bg-[#0f172a] p-3 rounded-xl border border-slate-800 flex items-center gap-3">
             <Target className="text-blue-400" size={24} />
             <div>
               <p className="text-[10px] text-slate-400">الوحدة التشغيلية</p>
               <p className="text-xs font-bold text-blue-400">CRM & Project Engine</p>
             </div>
           </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('crm')}
          className={cn(
            "px-5 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2",
            activeTab === 'crm' ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" : "bg-[#151b2b] text-slate-400 hover:text-white border border-slate-800"
          )}
        >
          <KanbanSquare size={16} />
          إدارة الفرص البيعية (CRM Pipeline)
        </button>
        <button
          onClick={() => setActiveTab('projects')}
          className={cn(
            "px-5 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2",
            activeTab === 'projects' ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" : "bg-[#151b2b] text-slate-400 hover:text-white border border-slate-800"
          )}
        >
          <Briefcase size={16} />
          إدارة المشاريع (Projects & WIP)
        </button>
      </div>

      {/* CRM Content */}
      {activeTab === 'crm' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-white flex items-center gap-2">
              <TrendingUp className="text-emerald-400" size={20} />
              مسار المبيعات (Sales Funnel)
            </h3>
            <button className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2">
              <Plus size={16} /> إضافة فرصة بيعية
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 overflow-x-auto pb-4 custom-scrollbar">
            {pipelineStages.map(stage => (
              <div key={stage.id} className="bg-[#151b2b] rounded-2xl border border-slate-800 flex flex-col min-h-[400px]">
                <div className={cn("p-4 border-b-2 border-slate-800 flex justify-between items-center", stage.color)}>
                  <h4 className="font-bold text-white text-sm">{stage.name}</h4>
                  <span className="bg-[#0f172a] text-slate-400 text-[10px] px-2 py-1 rounded-lg font-bold border border-slate-800">
                    {mockOpportunities.filter(o => o.stage === stage.id).length}
                  </span>
                </div>
                <div className="p-3 flex-1 space-y-3">
                  {mockOpportunities.filter(o => o.stage === stage.id).map(opp => (
                    <div key={opp.id} className="bg-[#0f172a] p-4 rounded-xl border border-slate-800 hover:border-slate-700 transition-all cursor-pointer group">
                      <div className="flex justify-between items-start mb-2">
                        <h5 className="font-bold text-white text-xs leading-relaxed group-hover:text-blue-400 transition-colors">{opp.title}</h5>
                        <button className="text-slate-500 hover:text-white"><MoreHorizontal size={14}/></button>
                      </div>
                      <div className="flex items-center gap-1 text-[11px] text-slate-400 mb-3">
                        <Building size={12} className="text-slate-500" />
                        {opp.client}
                      </div>
                      <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                        <span className="font-mono text-emerald-400 font-bold text-xs">{formatCurrency(opp.value)}</span>
                        <div className="flex items-center gap-1 text-[10px] bg-slate-800/50 px-1.5 py-0.5 rounded font-bold text-slate-300">
                          <Target size={10} className="text-blue-400" /> {opp.probability}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Projects Content */}
      {activeTab === 'projects' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-white flex items-center gap-2">
              <Briefcase className="text-purple-400" size={20} />
              المشاريع والمقاولات (Active Projects)
            </h3>
            <button className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2">
              <Plus size={16} /> مشروع جديد
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {mockProjects.map(project => (
              <div key={project.id} className="bg-[#151b2b] p-5 rounded-2xl border border-slate-800 hover:border-slate-700 transition-all">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-mono text-slate-500 bg-[#0f172a] px-2 py-0.5 rounded border border-slate-800">{project.id}</span>
                      <span className={cn(
                        "text-[10px] px-2 py-0.5 rounded font-bold border",
                        project.status === 'active' ? "bg-blue-500/10 text-blue-400 border-blue-500/20" : "bg-red-500/10 text-red-400 border-red-500/20"
                      )}>
                        {project.status === 'active' ? 'قيد التنفيذ' : 'متأخر'}
                      </span>
                    </div>
                    <h4 className="font-bold text-white text-base">{project.name}</h4>
                    <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                      <Building size={12} /> {project.client}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-slate-500 mb-1">تاريخ التسليم</p>
                    <p className="text-xs font-bold text-white flex items-center gap-1 justify-end">
                      <Calendar size={12} className={project.status === 'delayed' ? 'text-red-400' : 'text-slate-400'} />
                      {project.deadline}
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Financials */}
                  <div className="grid grid-cols-2 gap-4 p-3 bg-[#0f172a] rounded-xl border border-slate-800">
                    <div>
                      <p className="text-[10px] text-slate-500 font-bold mb-1">الموازنة التقديرية (Budget)</p>
                      <p className="text-sm font-bold text-emerald-400 font-mono">{formatCurrency(project.budget)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 font-bold mb-1">التكلفة الفعلية (Actual)</p>
                      <p className={cn(
                        "text-sm font-bold font-mono",
                        project.actualCost > project.budget ? "text-red-400" : "text-amber-400"
                      )}>
                        {formatCurrency(project.actualCost)}
                      </p>
                    </div>
                  </div>

                  {/* Progress */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-bold text-slate-300">نسبة الإنجاز (Progress)</span>
                      <span className="text-xs font-bold text-white">{project.progress}%</span>
                    </div>
                    <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                      <div 
                        className={cn("h-full rounded-full", project.progress >= 90 && project.status === 'delayed' ? 'bg-amber-500' : 'bg-blue-500')}
                        style={{ width: `${project.progress}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
