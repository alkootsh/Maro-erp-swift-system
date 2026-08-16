/**
 * @file AdvancedReportingBI.tsx
 * @module واجهات وصفحات النظام (UI Pages)
 * @description ملف جزء من نظام MARO ERP. الوظيفة: AdvancedReportingBI.tsx.
 */
import React, { useState } from 'react';
import { 
  BarChart3, 
  PieChart, 
  TrendingUp, 
  Filter, 
  Download, 
  Save,
  LayoutDashboard,
  TableProperties,
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  Boxes,
  Users,
  Calendar,
  Layers,
  FileText,
  Database
} from 'lucide-react';
import { formatCurrency, cn } from '../lib/utils';
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

const mockSalesData = [
  { name: 'يناير', sales: 4000, profit: 2400 },
  { name: 'فبراير', sales: 3000, profit: 1398 },
  { name: 'مارس', sales: 2000, profit: 9800 },
  { name: 'أبريل', sales: 2780, profit: 3908 },
  { name: 'مايو', sales: 1890, profit: 4800 },
  { name: 'يونيو', sales: 2390, profit: 3800 },
  { name: 'يوليو', sales: 3490, profit: 4300 },
];

const availableColumns = [
  { id: 'date', label: 'التاريخ' },
  { id: 'branch', label: 'الفرع' },
  { id: 'customer', label: 'العميل' },
  { id: 'product', label: 'المنتج' },
  { id: 'quantity', label: 'الكمية' },
  { id: 'total', label: 'الإجمالي' },
  { id: 'profit', label: 'الربح' },
  { id: 'margin', label: 'هامش الربح %' },
];

export const AdvancedReportingBI: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'builder'>('dashboard');
  const [selectedEntity, setSelectedEntity] = useState('sales');
  const [selectedColumns, setSelectedColumns] = useState<string[]>(['date', 'branch', 'total', 'profit']);

  const toggleColumn = (colId: string) => {
    setSelectedColumns(prev => 
      prev.includes(colId) ? prev.filter(id => id !== colId) : [...prev, colId]
    );
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-950 via-[#151b2b] to-[#0f172a] p-6 rounded-2xl border border-blue-900/40 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-400 font-bold text-xs border border-blue-500/30">
              MARO Phase 7: Advanced Reporting & BI
            </span>
          </div>
          <h1 className="text-2xl font-black text-white">التقارير المتقدمة وذكاء الأعمال</h1>
          <p className="text-xs text-slate-400 mt-1">
            لوحات قيادة تنفيذية (Executive Dashboards) ومحرك بناء تقارير ديناميكي (Dynamic Report Builder).
          </p>
        </div>
        <div className="flex items-center gap-3">
           <div className="bg-[#0f172a] p-3 rounded-xl border border-slate-800 flex items-center gap-3">
             <BarChart3 className="text-blue-400" size={24} />
             <div>
               <p className="text-[10px] text-slate-400">محرك التحليلات</p>
               <p className="text-xs font-bold text-blue-400">BI Engine v2.0</p>
             </div>
           </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={cn(
            "px-5 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2",
            activeTab === 'dashboard' ? "bg-blue-600 text-white" : "bg-[#151b2b] text-slate-400 hover:text-white"
          )}
        >
          <LayoutDashboard size={16} />
          لوحة القيادة التنفيذية (Executive Dashboard)
        </button>
        <button
          onClick={() => setActiveTab('builder')}
          className={cn(
            "px-5 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2",
            activeTab === 'builder' ? "bg-blue-600 text-white" : "bg-[#151b2b] text-slate-400 hover:text-white"
          )}
        >
          <TableProperties size={16} />
          منشئ التقارير الديناميكي (Report Builder)
        </button>
      </div>

      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-[#151b2b] p-5 rounded-2xl border border-slate-800 flex flex-col gap-3">
              <div className="flex justify-between items-start">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400">
                  <DollarSign size={20} />
                </div>
                <span className="flex items-center gap-1 text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-lg">
                  <ArrowUpRight size={14} /> 12.5%
                </span>
              </div>
              <div>
                <p className="text-xs text-slate-400 font-bold mb-1">إجمالي الإيرادات</p>
                <h3 className="text-xl font-black text-white font-mono">{formatCurrency(1245000)}</h3>
              </div>
            </div>
            
            <div className="bg-[#151b2b] p-5 rounded-2xl border border-slate-800 flex flex-col gap-3">
              <div className="flex justify-between items-start">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                  <TrendingUp size={20} />
                </div>
                <span className="flex items-center gap-1 text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-lg">
                  <ArrowUpRight size={14} /> 4.2%
                </span>
              </div>
              <div>
                <p className="text-xs text-slate-400 font-bold mb-1">إجمالي الأرباح (Gross Profit)</p>
                <h3 className="text-xl font-black text-white font-mono">{formatCurrency(485000)}</h3>
              </div>
            </div>

            <div className="bg-[#151b2b] p-5 rounded-2xl border border-slate-800 flex flex-col gap-3">
              <div className="flex justify-between items-start">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400">
                  <Boxes size={20} />
                </div>
                <span className="flex items-center gap-1 text-xs font-bold text-red-400 bg-red-500/10 px-2 py-1 rounded-lg">
                  <ArrowDownRight size={14} /> 2.1%
                </span>
              </div>
              <div>
                <p className="text-xs text-slate-400 font-bold mb-1">قيمة المخزون</p>
                <h3 className="text-xl font-black text-white font-mono">{formatCurrency(3250000)}</h3>
              </div>
            </div>

            <div className="bg-[#151b2b] p-5 rounded-2xl border border-slate-800 flex flex-col gap-3">
              <div className="flex justify-between items-start">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400">
                  <Users size={20} />
                </div>
                <span className="flex items-center gap-1 text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-lg">
                  <ArrowUpRight size={14} /> 8.4%
                </span>
              </div>
              <div>
                <p className="text-xs text-slate-400 font-bold mb-1">الذمم المدينة (AR)</p>
                <h3 className="text-xl font-black text-white font-mono">{formatCurrency(150000)}</h3>
              </div>
            </div>
          </div>

          {/* Charts Area */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-[#151b2b] p-5 rounded-2xl border border-slate-800">
              <h3 className="text-white font-bold text-sm mb-6 flex items-center gap-2">
                <TrendingUp size={16} className="text-blue-400" />
                تحليل المبيعات والأرباح
              </h3>
              <div className="h-72 w-full" dir="ltr">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={mockSalesData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                    <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value / 1000}k`} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px' }}
                      itemStyle={{ color: '#f8fafc' }}
                    />
                    <Line type="monotone" dataKey="sales" name="المبيعات" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: '#0f172a' }} activeDot={{ r: 6 }} />
                    <Line type="monotone" dataKey="profit" name="الأرباح" stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#0f172a' }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-[#151b2b] p-5 rounded-2xl border border-slate-800">
              <h3 className="text-white font-bold text-sm mb-6 flex items-center gap-2">
                <BarChart3 size={16} className="text-purple-400" />
                مقارنة الفروع
              </h3>
              <div className="h-72 w-full" dir="ltr">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={mockSalesData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                    <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value / 1000}k`} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px' }}
                      itemStyle={{ color: '#f8fafc' }}
                      cursor={{fill: '#1e293b', opacity: 0.4}}
                    />
                    <Bar dataKey="sales" name="المبيعات" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'builder' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Builder Sidebar */}
          <div className="bg-[#151b2b] rounded-2xl border border-slate-800 p-5 space-y-6">
            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-400 flex items-center gap-2">
                <Database size={14} /> مصدر البيانات (Entity)
              </label>
              <select 
                value={selectedEntity}
                onChange={(e) => setSelectedEntity(e.target.value)}
                className="w-full bg-[#0f172a] border border-slate-700 rounded-xl px-3 py-2.5 text-white text-xs focus:outline-none focus:border-blue-500 appearance-none"
              >
                <option value="sales">المبيعات والفواتير</option>
                <option value="purchases">المشتريات</option>
                <option value="inventory">حركات المخزون</option>
                <option value="finance">القيود المالية (GL)</option>
              </select>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-400 flex items-center gap-2">
                <Layers size={14} /> الأعمدة المتاحة (Columns)
              </label>
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
                {availableColumns.map(col => (
                  <label key={col.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-[#0f172a] cursor-pointer transition-colors border border-transparent hover:border-slate-800">
                    <input 
                      type="checkbox" 
                      checked={selectedColumns.includes(col.id)}
                      onChange={() => toggleColumn(col.id)}
                      className="rounded bg-slate-800 border-slate-600 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-xs text-slate-300 font-bold">{col.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-3">
               <label className="text-xs font-bold text-slate-400 flex items-center gap-2">
                <Filter size={14} /> التجميع والتصفية
              </label>
              <select className="w-full bg-[#0f172a] border border-slate-700 rounded-xl px-3 py-2.5 text-white text-xs focus:outline-none focus:border-blue-500 appearance-none">
                <option>تجميع حسب الفرع</option>
                <option>تجميع حسب الشهر</option>
                <option>تجميع حسب التصنيف</option>
                <option>بدون تجميع (تفصيلي)</option>
              </select>
            </div>

            <div className="pt-4 border-t border-slate-800 space-y-2">
              <button className="w-full bg-blue-600 hover:bg-blue-500 text-white py-2.5 rounded-xl text-xs font-bold transition-all shadow-lg shadow-blue-600/20 flex justify-center items-center gap-2">
                <TableProperties size={16} />
                توليد التقرير
              </button>
              <button className="w-full bg-[#0f172a] hover:bg-slate-800 text-slate-300 border border-slate-700 py-2.5 rounded-xl text-xs font-bold transition-all flex justify-center items-center gap-2">
                <Save size={16} />
                حفظ كنموذج
              </button>
            </div>
          </div>

          {/* Report Preview */}
          <div className="lg:col-span-3 bg-[#151b2b] rounded-2xl border border-slate-800 p-6 flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-white font-bold text-sm flex items-center gap-2">
                <FileText size={18} className="text-blue-400" />
                معاينة التقرير (Live Preview)
              </h3>
              <button className="flex items-center gap-2 px-3 py-1.5 bg-[#0f172a] border border-slate-700 hover:border-slate-600 rounded-lg text-xs font-bold text-slate-300 transition-all">
                <Download size={14} /> تصدير Excel
              </button>
            </div>

            <div className="flex-1 border border-slate-800 rounded-xl overflow-hidden bg-[#0f172a]">
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead className="bg-[#151b2b] border-b border-slate-800 text-slate-400">
                    <tr>
                      {selectedColumns.map(colId => {
                        const col = availableColumns.find(c => c.id === colId);
                        return <th key={colId} className="px-4 py-3 font-bold">{col?.label}</th>;
                      })}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50 text-slate-300">
                    {[1, 2, 3, 4, 5].map((row) => (
                      <tr key={row} className="hover:bg-[#151b2b]/50 transition-colors">
                        {selectedColumns.map(colId => (
                          <td key={`${row}-${colId}`} className="px-4 py-3">
                            {colId === 'date' ? '2023-11-0' + row : 
                             colId === 'branch' ? (row % 2 === 0 ? 'فرع القاهرة' : 'فرع الإسكندرية') :
                             colId === 'total' ? formatCurrency(row * 1500) :
                             colId === 'profit' ? formatCurrency(row * 400) :
                             colId === 'margin' ? '26.6%' :
                             'بيانات تجريبية'}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="p-4 border-t border-slate-800 flex justify-between items-center text-xs text-slate-500">
                <span>يتم عرض 5 صفوف للمعاينة فقط.</span>
                <span>إجمالي السجلات: 1,245</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
