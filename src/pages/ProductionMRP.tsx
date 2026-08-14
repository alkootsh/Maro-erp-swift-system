import React, { useState } from 'react';
import { 
  Factory, 
  Settings, 
  GitMerge, 
  Package, 
  Hammer, 
  Activity, 
  CheckCircle2, 
  Clock, 
  AlertTriangle,
  FileText,
  Boxes,
  Plus,
  PlayCircle
} from 'lucide-react';
import { formatCurrency, cn } from '../lib/utils';

export const ProductionMRP: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'bom' | 'orders' | 'workstations'>('bom');

  const mockBOM = {
    productName: 'كرسي مكتبي مريح (Premium)',
    sku: 'FURN-CHR-001',
    baseQuantity: 1,
    totalEstimatedCost: 145.50,
    components: [
      { id: 'RM-01', name: 'قاعدة معدنية (نجمة)', type: 'خامة', qty: 1, unit: 'قطعة', cost: 45.00 },
      { id: 'RM-02', name: 'عجلات بلاستيكية', type: 'خامة', qty: 5, unit: 'قطعة', cost: 15.00 },
      { id: 'RM-03', name: 'قماش شبكي (Mesh)', type: 'خامة', qty: 1.5, unit: 'متر', cost: 35.00 },
      { id: 'RM-04', name: 'مكبس هيدروليك', type: 'خامة', qty: 1, unit: 'قطعة', cost: 25.00 },
      { id: 'LB-01', name: 'عمالة تجميع', type: 'أجور', qty: 45, unit: 'دقيقة', cost: 25.50 },
    ]
  };

  const mockOrders = [
    { 
      id: 'PROD-2023-089', 
      product: 'كرسي مكتبي مريح (Premium)', 
      targetQty: 100, 
      completedQty: 65, 
      status: 'in_progress',
      startDate: '2023-11-15',
      workstation: 'خط التجميع رقم 1',
      progress: 65
    },
    { 
      id: 'PROD-2023-090', 
      product: 'طاولة اجتماعات (خشب زان)', 
      targetQty: 10, 
      completedQty: 0, 
      status: 'planned',
      startDate: '2023-11-18',
      workstation: 'قسم النجارة',
      progress: 0
    },
    { 
      id: 'PROD-2023-085', 
      product: 'مكتب إدارة حديث', 
      targetQty: 25, 
      completedQty: 25, 
      status: 'completed',
      startDate: '2023-11-10',
      workstation: 'قسم التشطيب والدهان',
      progress: 100
    }
  ];

  const mockWorkstations = [
    { id: 'WS-01', name: 'قسم تقطيع الأخشاب', status: 'active', utilization: 85, activeOrders: 2 },
    { id: 'WS-02', name: 'خط التجميع النهائي', status: 'active', utilization: 92, activeOrders: 3 },
    { id: 'WS-03', name: 'غرفة الدهان والتجفيف', status: 'maintenance', utilization: 0, activeOrders: 0 },
  ];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-950 via-[#151b2b] to-[#0f172a] p-6 rounded-2xl border border-blue-900/40 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-400 font-bold text-xs border border-blue-500/30">
              MARO Phase 11: Production & MRP
            </span>
          </div>
          <h1 className="text-2xl font-black text-white">إدارة التصنيع والإنتاج (MRP)</h1>
          <p className="text-xs text-slate-400 mt-1">
            إدارة شجرة المواد (BOM)، أوامر التشغيل، وتخطيط احتياجات المواد لمصانع وورش العمل.
          </p>
        </div>
        <div className="flex items-center gap-3">
           <div className="bg-[#0f172a] p-3 rounded-xl border border-slate-800 flex items-center gap-3">
             <Factory className="text-blue-400" size={24} />
             <div>
               <p className="text-[10px] text-slate-400">محرك التصنيع</p>
               <p className="text-xs font-bold text-blue-400">MRP Core v1.2</p>
             </div>
           </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('bom')}
          className={cn(
            "px-5 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2",
            activeTab === 'bom' ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" : "bg-[#151b2b] text-slate-400 hover:text-white border border-slate-800"
          )}
        >
          <GitMerge size={16} />
          شجرة المواد (BOM)
        </button>
        <button
          onClick={() => setActiveTab('orders')}
          className={cn(
            "px-5 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2",
            activeTab === 'orders' ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" : "bg-[#151b2b] text-slate-400 hover:text-white border border-slate-800"
          )}
        >
          <FileText size={16} />
          أوامر الإنتاج والتصنيع
        </button>
        <button
          onClick={() => setActiveTab('workstations')}
          className={cn(
            "px-5 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2",
            activeTab === 'workstations' ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" : "bg-[#151b2b] text-slate-400 hover:text-white border border-slate-800"
          )}
        >
          <Hammer size={16} />
          مراكز العمل (Workstations)
        </button>
      </div>

      {/* Tab Content: BOM */}
      {activeTab === 'bom' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-white flex items-center gap-2">
              <GitMerge className="text-purple-400" size={20} />
              شجرة المواد والتكاليف المعيارية (Bill of Materials)
            </h3>
            <button className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2">
              <Plus size={16} /> إنشاء تركيبة جديدة
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 space-y-4">
              <div className="bg-[#151b2b] p-5 rounded-2xl border border-slate-800">
                <div className="w-12 h-12 bg-blue-500/10 text-blue-400 rounded-xl flex items-center justify-center mb-4">
                  <Package size={24} />
                </div>
                <p className="text-[10px] text-slate-500 font-bold mb-1">المنتج التام (Finished Good)</p>
                <h2 className="text-lg font-bold text-white mb-1">{mockBOM.productName}</h2>
                <p className="text-xs font-mono text-slate-400 mb-6">SKU: {mockBOM.sku}</p>

                <div className="space-y-3 pt-4 border-t border-slate-800">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400">كمية التركيبة الأساسية</span>
                    <span className="font-bold text-white">{mockBOM.baseQuantity} وحدة</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400">إجمالي التكلفة التقديرية</span>
                    <span className="font-bold text-emerald-400 font-mono text-sm">{formatCurrency(mockBOM.totalEstimatedCost)}</span>
                  </div>
                </div>
              </div>

              <div className="bg-[#0f172a] p-4 rounded-xl border border-blue-900/30">
                <p className="text-[10px] text-blue-400 flex gap-2 items-start font-bold">
                  <Activity size={14} className="shrink-0" />
                  يتم سحب كميات الخامات تلقائياً من المستودع عند بدء أمر التصنيع (Backflushing) وتتحول تكلفتها إلى المنتج التام.
                </p>
              </div>
            </div>

            <div className="lg:col-span-2 bg-[#151b2b] rounded-2xl border border-slate-800 overflow-hidden">
              <div className="p-4 border-b border-slate-800 bg-[#0f172a] flex justify-between items-center">
                <h4 className="font-bold text-white text-sm">مكونات التركيبة (Components & Routing)</h4>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-right text-sm">
                  <thead className="bg-[#151b2b] border-b border-slate-800 text-slate-400 text-xs">
                    <tr>
                      <th className="px-6 py-4 font-bold">المكون / المورد</th>
                      <th className="px-6 py-4 font-bold">النوع</th>
                      <th className="px-6 py-4 font-bold">الكمية المطلوبة</th>
                      <th className="px-6 py-4 font-bold">التكلفة المعيارية</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {mockBOM.components.map((comp) => (
                      <tr key={comp.id} className="hover:bg-[#0f172a]/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              "w-8 h-8 rounded-lg flex items-center justify-center",
                              comp.type === 'أجور' ? "bg-amber-500/10 text-amber-400" : "bg-emerald-500/10 text-emerald-400"
                            )}>
                              {comp.type === 'أجور' ? <Settings size={14} /> : <Boxes size={14} />}
                            </div>
                            <div>
                              <p className="font-bold text-white text-xs">{comp.name}</p>
                              <p className="text-[10px] font-mono text-slate-500">{comp.id}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={cn(
                            "text-[10px] px-2 py-0.5 rounded font-bold border",
                            comp.type === 'أجور' ? "bg-amber-500/10 text-amber-400 border-amber-500/20" : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                          )}>
                            {comp.type}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-white text-xs font-mono">
                          {comp.qty} <span className="text-slate-500 text-[10px]">{comp.unit}</span>
                        </td>
                        <td className="px-6 py-4 font-mono text-xs text-blue-400 font-bold">
                          {formatCurrency(comp.cost)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab Content: Production Orders */}
      {activeTab === 'orders' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-white flex items-center gap-2">
              <FileText className="text-amber-400" size={20} />
              أوامر التصنيع النشطة (Active Production Orders)
            </h3>
            <button className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2">
              <Plus size={16} /> أمر تصنيع جديد
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {mockOrders.map(order => (
              <div key={order.id} className="bg-[#151b2b] p-5 rounded-2xl border border-slate-800 flex flex-col hover:border-slate-700 transition-all">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="font-bold text-white text-sm mb-1">{order.product}</h4>
                    <p className="text-[10px] font-mono text-slate-500">{order.id}</p>
                  </div>
                  <span className={cn(
                    "text-[10px] px-2 py-1 rounded-lg font-bold border flex items-center gap-1",
                    order.status === 'in_progress' ? "bg-blue-500/10 text-blue-400 border-blue-500/20" : 
                    order.status === 'planned' ? "bg-amber-500/10 text-amber-400 border-amber-500/20" : 
                    "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                  )}>
                    {order.status === 'in_progress' && <PlayCircle size={12} />}
                    {order.status === 'planned' && <Clock size={12} />}
                    {order.status === 'completed' && <CheckCircle2 size={12} />}
                    
                    {order.status === 'in_progress' ? 'قيد التنفيذ' : 
                     order.status === 'planned' ? 'مُجدول' : 'مكتمل'}
                  </span>
                </div>

                <div className="space-y-4 flex-1">
                  <div className="flex justify-between text-xs p-3 bg-[#0f172a] rounded-xl border border-slate-800">
                    <div>
                      <p className="text-[10px] text-slate-500 mb-1">الكمية المستهدفة</p>
                      <p className="font-bold text-white font-mono">{order.targetQty} وحدة</p>
                    </div>
                    <div className="text-left">
                      <p className="text-[10px] text-slate-500 mb-1">المنفذ حتى الآن</p>
                      <p className="font-bold text-emerald-400 font-mono">{order.completedQty} وحدة</p>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[10px] font-bold text-slate-400">نسبة الإنجاز</span>
                      <span className="text-[10px] font-bold text-white">{order.progress}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                      <div 
                        className={cn("h-full rounded-full transition-all duration-500", 
                          order.progress === 100 ? 'bg-emerald-500' : 'bg-blue-500'
                        )}
                        style={{ width: `${order.progress}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-800 flex justify-between items-center text-[10px]">
                  <span className="flex items-center gap-1 text-slate-400">
                    <Hammer size={12} /> {order.workstation}
                  </span>
                  <span className="text-slate-500 font-mono">{order.startDate}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab Content: Workstations */}
      {activeTab === 'workstations' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-white flex items-center gap-2">
              <Hammer className="text-emerald-400" size={20} />
              مراكز العمل وقدرة الإنتاج (Workstations Capacity)
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {mockWorkstations.map(station => (
              <div key={station.id} className="bg-[#151b2b] p-5 rounded-2xl border border-slate-800">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center",
                      station.status === 'active' ? 'bg-blue-500/10 text-blue-400' : 'bg-red-500/10 text-red-400'
                    )}>
                      <Settings className={station.status === 'active' ? "animate-[spin_4s_linear_infinite]" : ""} size={20} />
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-sm">{station.name}</h4>
                      <p className="text-[10px] font-mono text-slate-500">{station.id}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-[#0f172a] rounded-xl border border-slate-800">
                    <span className="text-xs text-slate-400">الحالة</span>
                    <span className={cn(
                      "text-xs font-bold flex items-center gap-1",
                      station.status === 'active' ? "text-emerald-400" : "text-red-400"
                    )}>
                      {station.status === 'active' ? <><CheckCircle2 size={14}/> يعمل بشكل ممتاز</> : <><AlertTriangle size={14}/> قيد الصيانة</>}
                    </span>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-bold text-slate-400">معدل الاستخدام (Utilization)</span>
                      <span className="text-xs font-bold text-white">{station.utilization}%</span>
                    </div>
                    <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                      <div 
                        className={cn("h-full rounded-full transition-all duration-500", 
                          station.utilization > 80 ? 'bg-amber-500' : 
                          station.utilization > 0 ? 'bg-emerald-500' : 'bg-slate-600'
                        )}
                        style={{ width: `${station.utilization}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="text-center pt-2 text-xs text-slate-500">
                    يعمل حالياً على <span className="font-bold text-white mx-1">{station.activeOrders}</span> أوامر إنتاج
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
