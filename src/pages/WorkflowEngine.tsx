/**
 * @file WorkflowEngine.tsx
 * @module واجهات وصفحات النظام (UI Pages)
 * @description ملف جزء من نظام MARO ERP. الوظيفة: WorkflowEngine.tsx.
 */
import React, { useState } from 'react';
import { 
  Activity, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  FileText, 
  ArrowLeft, 
  Settings,
  ShieldAlert,
  DollarSign,
  UserCheck,
  Building
} from 'lucide-react';
import { formatCurrency, cn } from '../lib/utils';

type WorkflowStatus = 'draft' | 'manager_approval' | 'finance_approval' | 'approved' | 'rejected';

interface DocumentTask {
  id: string;
  type: 'purchase_order' | 'discount_request' | 'expense_claim' | 'sales_invoice';
  title: string;
  requester: string;
  department: string;
  amount: number;
  status: WorkflowStatus;
  date: string;
  journalEntryRef?: string;
}

export const WorkflowEngine: React.FC = () => {
  const [tasks, setTasks] = useState<DocumentTask[]>([
    {
      id: 'PO-2023-089',
      type: 'purchase_order',
      title: 'طلب شراء أجهزة ومعدات للمخزن الجديد',
      requester: 'أحمد محمود',
      department: 'المشتريات',
      amount: 45000,
      status: 'manager_approval',
      date: '2023-10-25'
    },
    {
      id: 'EXP-2023-142',
      type: 'expense_claim',
      title: 'عُهدة نقدية لفرع التجمع',
      requester: 'سارة خالد',
      department: 'العمليات',
      amount: 15000,
      status: 'finance_approval',
      date: '2023-10-26'
    },
    {
      id: 'DIS-2023-011',
      type: 'discount_request',
      title: 'طلب خصم 15% لعميل VIP',
      requester: 'محمد طارق',
      department: 'المبيعات',
      amount: 2500,
      status: 'draft',
      date: '2023-10-27'
    }
  ]);

  const [activeTab, setActiveTab] = useState<'pending' | 'completed'>('pending');

  const advanceWorkflow = (id: string, action: 'approve' | 'reject') => {
    setTasks(prev => prev.map(task => {
      if (task.id !== id) return task;
      
      if (action === 'reject') {
        return { ...task, status: 'rejected' };
      }

      // State machine logic
      if (task.status === 'draft') return { ...task, status: 'manager_approval' };
      if (task.status === 'manager_approval') return { ...task, status: 'finance_approval' };
      if (task.status === 'finance_approval') {
        // Finance Approved -> Final State, trigger Journal Entry creation
        return { 
          ...task, 
          status: 'approved',
          journalEntryRef: `JV-${Math.floor(1000 + Math.random() * 9000)}` // Mock Journal Entry generation
        };
      }
      
      return task;
    }));
  };

  const getStatusBadge = (status: WorkflowStatus) => {
    const badges = {
      draft: { text: 'مسودة', color: 'bg-slate-500/20 text-slate-400 border-slate-500/30' },
      manager_approval: { text: 'بانتظار الإدارة', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
      finance_approval: { text: 'بانتظار المالية', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
      approved: { text: 'معتمد (تم التوجيه المحاسبي)', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
      rejected: { text: 'مرفوض', color: 'bg-red-500/20 text-red-400 border-red-500/30' }
    };
    const b = badges[status];
    return <span className={cn("px-2.5 py-1 rounded-lg text-xs font-bold border", b.color)}>{b.text}</span>;
  };

  const getTypeIcon = (type: string) => {
    switch(type) {
      case 'purchase_order': return <Building className="text-blue-400" size={18} />;
      case 'expense_claim': return <DollarSign className="text-emerald-400" size={18} />;
      case 'discount_request': return <ShieldAlert className="text-amber-400" size={18} />;
      default: return <FileText className="text-slate-400" size={18} />;
    }
  };

  const filteredTasks = tasks.filter(t => 
    activeTab === 'pending' 
      ? ['draft', 'manager_approval', 'finance_approval'].includes(t.status)
      : ['approved', 'rejected'].includes(t.status)
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-950 via-[#151b2b] to-[#0f172a] p-6 rounded-2xl border border-blue-900/40 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-400 font-bold text-xs border border-blue-500/30">
              Phase 5: Workflow Engine
            </span>
          </div>
          <h1 className="text-2xl font-black text-white">محرك سير العمل والموافقات</h1>
          <p className="text-xs text-slate-400 mt-1">
            فصل مسار اتخاذ القرار (Approval Matrix) عن النواة المحاسبية. يتم توليد القيود المالية (Journal Entries) تلقائياً فقط بعد اكتمال دورة الاعتماد.
          </p>
        </div>
        <div className="flex items-center gap-3">
           <div className="bg-[#0f172a] p-3 rounded-xl border border-slate-800 flex items-center gap-3">
             <Activity className="text-emerald-400 animate-pulse" size={24} />
             <div>
               <p className="text-[10px] text-slate-400">حالة المحرك</p>
               <p className="text-xs font-bold text-emerald-400">متصل (Real-time)</p>
             </div>
           </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('pending')}
          className={cn(
            "px-5 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2",
            activeTab === 'pending' ? "bg-blue-600 text-white" : "bg-[#151b2b] text-slate-400 hover:text-white"
          )}
        >
          <Clock size={16} />
          المهام المعلقة ({tasks.filter(t => ['draft', 'manager_approval', 'finance_approval'].includes(t.status)).length})
        </button>
        <button
          onClick={() => setActiveTab('completed')}
          className={cn(
            "px-5 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2",
            activeTab === 'completed' ? "bg-blue-600 text-white" : "bg-[#151b2b] text-slate-400 hover:text-white"
          )}
        >
          <CheckCircle2 size={16} />
          السجل المكتمل ({tasks.filter(t => ['approved', 'rejected'].includes(t.status)).length})
        </button>
      </div>

      {/* Task List */}
      <div className="grid gap-4">
        {filteredTasks.length === 0 ? (
          <div className="bg-[#151b2b] p-8 rounded-2xl border border-slate-800 text-center text-slate-500">
            لا توجد مهام في هذا التصنيف حالياً.
          </div>
        ) : (
          filteredTasks.map(task => (
            <div key={task.id} className="bg-[#151b2b] p-5 rounded-2xl border border-slate-800 hover:border-blue-500/30 transition-all flex flex-col md:flex-row gap-4 justify-between">
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-xl bg-[#0f172a] border border-slate-700 flex items-center justify-center shrink-0">
                  {getTypeIcon(task.type)}
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-white text-sm">{task.title}</h3>
                    {getStatusBadge(task.status)}
                  </div>
                  <div className="flex items-center gap-4 text-xs font-mono text-slate-400">
                    <span>{task.id}</span>
                    <span className="flex items-center gap-1"><UserCheck size={12}/> {task.requester} ({task.department})</span>
                    <span>{task.date}</span>
                  </div>
                  {task.status === 'approved' && task.journalEntryRef && (
                    <div className="mt-2 inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 text-emerald-400 rounded-lg text-xs font-bold border border-emerald-500/20">
                      <FileText size={14} />
                      تم توليد القيد المحاسبي التلقائي: {task.journalEntryRef}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-col items-end justify-between gap-3 shrink-0 border-t md:border-t-0 md:border-r border-slate-800 pt-3 md:pt-0 md:pr-4">
                <div className="text-lg font-black text-white font-mono">
                  {formatCurrency(task.amount)}
                </div>
                
                {activeTab === 'pending' && (
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => advanceWorkflow(task.id, 'reject')}
                      className="px-4 py-2 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded-xl text-xs font-bold transition-all"
                    >
                      رفض
                    </button>
                    <button 
                      onClick={() => advanceWorkflow(task.id, 'approve')}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-blue-600/20 flex items-center gap-2"
                    >
                      {task.status === 'draft' ? 'إرسال للإدارة' : task.status === 'manager_approval' ? 'اعتماد إداري' : 'اعتماد مالي نهائي'}
                      <ArrowLeft size={14} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Visualizer */}
      <div className="bg-[#0f172a] p-6 rounded-2xl border border-slate-800 mt-6 space-y-4">
        <h3 className="text-white font-bold text-sm flex items-center gap-2">
          <Settings size={18} className="text-slate-400" />
          معمارية تدفق العمل (Workflow Architecture)
        </h3>
        <div className="flex flex-col lg:flex-row items-center justify-between gap-4 text-xs font-bold text-center">
          <div className="flex-1 w-full bg-[#151b2b] p-4 rounded-xl border border-slate-700">1. مسودة (Draft)</div>
          <span className="text-slate-600 hidden lg:block">←</span>
          <div className="flex-1 w-full bg-amber-500/10 text-amber-400 p-4 rounded-xl border border-amber-500/20">2. اعتماد إداري (Manager)</div>
          <span className="text-slate-600 hidden lg:block">←</span>
          <div className="flex-1 w-full bg-blue-500/10 text-blue-400 p-4 rounded-xl border border-blue-500/20">3. اعتماد مالي (Finance)</div>
          <span className="text-emerald-500 hidden lg:block">←</span>
          <div className="flex-1 w-full bg-emerald-500/10 text-emerald-400 p-4 rounded-xl border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.1)]">
            4. معتمد (تمت المحاسبة)
            <span className="block text-[10px] mt-1 text-slate-400 font-normal">Finance Engine Hook Triggered</span>
          </div>
        </div>
      </div>
    </div>
  );
};
