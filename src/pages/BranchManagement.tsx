import React, { useState } from 'react';
import { 
  Network, 
  Store, 
  MapPin, 
  Users, 
  Activity, 
  CheckCircle2, 
  ArrowLeftRight,
  TrendingUp
} from 'lucide-react';
import { formatCurrency, cn } from '../lib/utils';

export const BranchManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'branches' | 'transfers'>('branches');

  const mockBranches = [
    { id: 'BR-01', name: 'الفرع الرئيسي (الرياض)', type: 'HQ', region: 'الوسطى', posCount: 5, status: 'online', salesToday: 45000 },
    { id: 'BR-02', name: 'فرع الدمام', type: 'Branch', region: 'الشرقية', posCount: 2, status: 'online', salesToday: 12500 },
    { id: 'BR-03', name: 'فرع جدة (امتياز)', type: 'Franchise', region: 'الغربية', posCount: 3, status: 'offline', salesToday: 0 },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-950 via-[#151b2b] to-[#0f172a] p-6 rounded-2xl border border-blue-900/40 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-400 font-bold text-xs border border-blue-500/30">
              MARO Phase 17: Branches
            </span>
          </div>
          <h1 className="text-2xl font-black text-white">إدارة الفروع والامتياز التجاري (Franchise)</h1>
          <p className="text-xs text-slate-400 mt-1">
            لوحة تحكم مركزية لإدارة الفروع المتعددة، المتاجر التابعة، ونقاط البيع، مع تتبع المبيعات الحية والمخزون.
          </p>
        </div>
        <div className="flex items-center gap-3">
           <div className="bg-[#0f172a] p-3 rounded-xl border border-slate-800 flex items-center gap-3">
             <Network className="text-blue-400" size={24} />
             <div>
               <p className="text-[10px] text-slate-400">إجمالي الفروع</p>
               <p className="text-xs font-bold text-emerald-400">12 فرع نشط</p>
             </div>
           </div>
        </div>
      </div>

      <div className="flex gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('branches')}
          className={cn(
            "px-5 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2",
            activeTab === 'branches' ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" : "bg-[#151b2b] text-slate-400 hover:text-white border border-slate-800"
          )}
        >
          <Store size={16} /> شبكة الفروع
        </button>
        <button
          onClick={() => setActiveTab('transfers')}
          className={cn(
            "px-5 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2",
            activeTab === 'transfers' ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" : "bg-[#151b2b] text-slate-400 hover:text-white border border-slate-800"
          )}
        >
          <ArrowLeftRight size={16} /> التحويلات بين الفروع
        </button>
      </div>

      {activeTab === 'branches' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {mockBranches.map((branch) => (
            <div key={branch.id} className="bg-[#151b2b] p-5 rounded-2xl border border-slate-800 flex flex-col hover:border-slate-700 transition-all">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center",
                    branch.status === 'online' ? "bg-emerald-500/10 text-emerald-400" : "bg-slate-800 text-slate-400"
                  )}>
                    <Store size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-sm">{branch.name}</h4>
                    <p className="text-[10px] font-mono text-slate-500">{branch.id} • {branch.region}</p>
                  </div>
                </div>
                <span className={cn(
                  "px-2 py-1 rounded text-[10px] font-bold border",
                  branch.type === 'HQ' ? "bg-purple-500/10 text-purple-400 border-purple-500/20" :
                  branch.type === 'Franchise' ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
                  "bg-blue-500/10 text-blue-400 border-blue-500/20"
                )}>
                  {branch.type}
                </span>
              </div>

              <div className="space-y-3 flex-1 mt-2">
                <div className="flex justify-between items-center p-3 bg-[#0f172a] rounded-xl border border-slate-800 text-xs">
                  <span className="text-slate-400">حالة الاتصال</span>
                  <span className={cn(
                    "font-bold flex items-center gap-1",
                    branch.status === 'online' ? "text-emerald-400" : "text-slate-500"
                  )}>
                    {branch.status === 'online' ? <><CheckCircle2 size={12}/> متصل (Online)</> : 'غير متصل (Offline)'}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-[#0f172a] rounded-xl border border-slate-800 text-xs">
                  <span className="text-slate-400 flex items-center gap-1"><MonitorSmartphone size={14} /> أجهزة (POS)</span>
                  <span className="font-bold text-white">{branch.posCount}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-[#0f172a] rounded-xl border border-slate-800 text-xs">
                  <span className="text-slate-400 flex items-center gap-1"><TrendingUp size={14} /> مبيعات اليوم</span>
                  <span className="font-bold text-emerald-400 font-mono">{formatCurrency(branch.salesToday)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'transfers' && (
        <div className="bg-[#151b2b] rounded-2xl border border-slate-800 p-8 text-center flex flex-col items-center justify-center min-h-[400px]">
          <ArrowLeftRight size={48} className="text-slate-600 mb-4" />
          <h3 className="text-lg font-bold text-white mb-2">طلبات التحويل بين الفروع</h3>
          <p className="text-sm text-slate-400 max-w-md mx-auto">
            مراقبة المخزون المنقول بين الفروع والمستودعات الإقليمية (In-Transit Inventory).
          </p>
        </div>
      )}
    </div>
  );
};

const MonitorSmartphone = ({ size }: { size: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h8"/><path d="M10 19v-3.96 3.15"/><path d="M7 19h5"/><rect x="16" y="12" width="6" height="10" rx="2"/>
  </svg>
);
