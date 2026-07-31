import React, { useState } from 'react';
import { Plus, 
  FileText, Database, Settings, LayoutTemplate, 
  BarChart2, PieChart, Table, Type, Image as ImageIcon, 
  Download, Save, Play, Grid, List, Activity, Key, Check
} from 'lucide-react';

export const ReportDesigner: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'datasets' | 'design' | 'preview'>('design');
  const [reportName, setReportName] = useState('تقرير مبيعات جديد');

  return (
    <div className="h-screen flex flex-col bg-[#0b0f1a] text-white">
      {/* Header */}
      <div className="h-14 bg-[#151b2b] border-b border-[#1e293b] flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center gap-4">
          <FileText className="text-blue-500" size={24} />
          <input 
            type="text" 
            value={reportName}
            onChange={(e) => setReportName(e.target.value)}
            className="bg-transparent border-none text-lg font-bold focus:outline-none focus:ring-1 focus:ring-blue-500 rounded px-2"
          />
        </div>
        
        {/* Tabs */}
        <div className="flex items-center bg-[#0f172a] p-1 rounded-lg">
          <button 
            onClick={() => setActiveTab('datasets')}
            className={`px-4 py-1.5 rounded-md text-sm font-bold transition-colors flex items-center gap-2 \${activeTab === 'datasets' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
          >
            <Database size={16} />
            البيانات (Data)
          </button>
          <button 
            onClick={() => setActiveTab('design')}
            className={`px-4 py-1.5 rounded-md text-sm font-bold transition-colors flex items-center gap-2 \${activeTab === 'design' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
          >
            <LayoutTemplate size={16} />
            التصميم (Design)
          </button>
          <button 
            onClick={() => setActiveTab('preview')}
            className={`px-4 py-1.5 rounded-md text-sm font-bold transition-colors flex items-center gap-2 \${activeTab === 'preview' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
          >
            <Play size={16} />
            معاينة (Preview)
          </button>
        </div>

        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 bg-[#1e293b] text-white px-4 py-2 rounded-lg font-bold hover:bg-[#334155] transition-colors text-sm">
            <Download size={16} />
            تصدير
          </button>
          <button className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-blue-700 transition-colors text-sm">
            <Save size={16} />
            حفظ التقرير
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Dataset Builder */}
        {activeTab === 'datasets' && (
          <div className="flex-1 flex">
            {/* Tables List */}
            <div className="w-72 bg-[#151b2b] border-l border-[#1e293b] flex flex-col">
              <div className="p-4 border-b border-[#1e293b]">
                <h3 className="font-bold flex items-center gap-2 text-sm">
                  <Database size={16} className="text-slate-400" />
                  الجداول المتاحة (Tables)
                </h3>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {['Products', 'Sales', 'Customers', 'Users', 'Inventory'].map(table => (
                  <div key={table} className="p-3 bg-[#0b0f1a] border border-[#1e293b] rounded-lg text-sm cursor-pointer hover:border-blue-500 transition-colors flex items-center justify-between">
                    <span>{table}</span>
                    <Plus size={14} className="text-blue-500" />
                  </div>
                ))}
              </div>
            </div>

            {/* Query Builder Canvas */}
            <div className="flex-1 p-6 flex flex-col relative overflow-auto">
              <div className="bg-[#1e293b] p-3 rounded-lg flex items-center justify-between mb-4">
                 <div className="font-bold text-sm flex items-center gap-2">
                   <Activity size={16} className="text-emerald-400" />
                   Visual Query Builder
                 </div>
                 <button className="text-xs bg-blue-600 px-3 py-1.5 rounded font-bold">Run Query</button>
              </div>
              <div className="flex-1 border-2 border-dashed border-[#334155] rounded-xl flex items-center justify-center bg-[#0f172a] opacity-80">
                <div className="text-center">
                  <Database size={48} className="mx-auto text-slate-600 mb-4" />
                  <p className="text-slate-400 font-bold">اسحب الجداول هنا لإنشاء العلاقة (Joins)</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Designer */}
        {activeTab === 'design' && (
          <div className="flex-1 flex">
            {/* Toolbox */}
            <div className="w-64 bg-[#151b2b] border-l border-[#1e293b] flex flex-col shrink-0">
              <div className="p-4 border-b border-[#1e293b]">
                <h3 className="font-bold flex items-center gap-2 text-sm">
                  <Grid size={16} className="text-slate-400" />
                  صندوق الأدوات (Toolbox)
                </h3>
              </div>
              <div className="p-4 space-y-4">
                <div>
                  <div className="text-xs font-bold text-slate-500 mb-2 uppercase">تحليل (Analytics)</div>
                  <div className="grid grid-cols-2 gap-2">
                    <button className="flex flex-col items-center justify-center p-3 bg-[#0b0f1a] border border-[#1e293b] rounded-lg hover:border-blue-500 transition-colors text-slate-300">
                      <Activity size={20} className="mb-1 text-red-400" />
                      <span className="text-[10px] font-bold">What-If</span>
                    </button>
                  </div>
                </div>

                <div>
                  <div className="text-xs font-bold text-slate-500 mb-2 uppercase">بيانات (Data)</div>
                  <div className="grid grid-cols-2 gap-2">
                    <button className="flex flex-col items-center justify-center p-3 bg-[#0b0f1a] border border-[#1e293b] rounded-lg hover:border-blue-500 transition-colors text-slate-300">
                      <Table size={20} className="mb-1 text-blue-400" />
                      <span className="text-[10px] font-bold">جدول (Table)</span>
                    </button>
                    <button className="flex flex-col items-center justify-center p-3 bg-[#0b0f1a] border border-[#1e293b] rounded-lg hover:border-blue-500 transition-colors text-slate-300">
                      <List size={20} className="mb-1 text-purple-400" />
                      <span className="text-[10px] font-bold">مصفوفة (Matrix)</span>
                    </button>
                    <button className="flex flex-col items-center justify-center p-3 bg-[#0b0f1a] border border-[#1e293b] rounded-lg hover:border-blue-500 transition-colors text-slate-300">
                      <Activity size={20} className="mb-1 text-emerald-400" />
                      <span className="text-[10px] font-bold">محور (Pivot)</span>
                    </button>
                  </div>
                </div>

                <div>
                  <div className="text-xs font-bold text-slate-500 mb-2 uppercase">رسوم بيانية (Charts)</div>
                  <div className="grid grid-cols-2 gap-2">
                    <button className="flex flex-col items-center justify-center p-3 bg-[#0b0f1a] border border-[#1e293b] rounded-lg hover:border-blue-500 transition-colors text-slate-300">
                      <BarChart2 size={20} className="mb-1 text-amber-400" />
                      <span className="text-[10px] font-bold">أعمدة (Bar)</span>
                    </button>
                    <button className="flex flex-col items-center justify-center p-3 bg-[#0b0f1a] border border-[#1e293b] rounded-lg hover:border-blue-500 transition-colors text-slate-300">
                      <PieChart size={20} className="mb-1 text-rose-400" />
                      <span className="text-[10px] font-bold">دائري (Pie)</span>
                    </button>
                  </div>
                </div>
                
                <div>
                  <div className="text-xs font-bold text-slate-500 mb-2 uppercase">عناصر أساسية (Basic)</div>
                  <div className="grid grid-cols-2 gap-2">
                    <button className="flex flex-col items-center justify-center p-3 bg-[#0b0f1a] border border-[#1e293b] rounded-lg hover:border-blue-500 transition-colors text-slate-300">
                      <Type size={20} className="mb-1 text-slate-400" />
                      <span className="text-[10px] font-bold">نص (Text)</span>
                    </button>
                    <button className="flex flex-col items-center justify-center p-3 bg-[#0b0f1a] border border-[#1e293b] rounded-lg hover:border-blue-500 transition-colors text-slate-300">
                      <ImageIcon size={20} className="mb-1 text-slate-400" />
                      <span className="text-[10px] font-bold">صورة (Image)</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Design Canvas */}
            <div className="flex-1 bg-[#0f172a] p-8 overflow-auto flex justify-center">
              {/* The "Paper" */}
              <div className="w-[794px] min-h-[1123px] bg-white shadow-xl relative text-black p-10">
                <div className="absolute top-0 left-0 right-0 h-10 border-b border-dashed border-gray-300 flex items-center justify-center text-gray-400 text-xs font-bold">
                  Report Header
                </div>
                
                <div className="mt-14 mb-8">
                  <h1 className="text-3xl font-bold text-center text-gray-800">تقرير المبيعات الشامل</h1>
                  <p className="text-center text-gray-500 mt-2">التاريخ: 2026-07-30</p>
                </div>

                <div className="border border-blue-500/30 bg-blue-50/50 p-4 border-dashed rounded flex flex-col items-center justify-center h-64 text-blue-400">
                  <Table size={32} className="mb-2" />
                  <span className="font-bold">منطقة البيانات (Data Region)</span>
                  <span className="text-xs">اسحب جدول أو رسم بياني هنا</span>
                </div>

                <div className="absolute bottom-0 left-0 right-0 h-10 border-t border-dashed border-gray-300 flex items-center justify-center text-gray-400 text-xs font-bold">
                  Report Footer (Page 1 of ?)
                </div>
              </div>
            </div>
            
            {/* Properties Panel */}
            <div className="w-64 bg-[#151b2b] border-r border-[#1e293b] flex flex-col shrink-0">
              <div className="p-4 border-b border-[#1e293b]">
                <h3 className="font-bold flex items-center gap-2 text-sm">
                  <Settings size={16} className="text-slate-400" />
                  الخصائص (Properties)
                </h3>
              </div>
              <div className="p-4 space-y-4">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">الاسم</label>
                  <input type="text" className="w-full bg-[#0b0f1a] border border-[#1e293b] rounded px-2 py-1 text-sm text-white" value="Report Header" readOnly />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">لون الخلفية</label>
                  <div className="flex gap-2">
                    <input type="color" className="w-8 h-8 rounded cursor-pointer" value="#ffffff" readOnly />
                    <input type="text" className="flex-1 bg-[#0b0f1a] border border-[#1e293b] rounded px-2 py-1 text-sm text-white" value="#ffffff" readOnly />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Preview */}
        {activeTab === 'preview' && (
          <div className="flex-1 bg-[#0f172a] p-8 overflow-auto flex justify-center">
            <div className="w-[794px] min-h-[1123px] bg-white shadow-xl text-black p-10">
                <div className="text-center mb-8 border-b pb-4">
                  <h1 className="text-3xl font-bold text-gray-800">تقرير المبيعات الشامل</h1>
                  <p className="text-gray-500 mt-2">التاريخ: 2026-07-30 | الفرع: الرئيسي</p>
                </div>
                
                <table className="w-full text-sm text-right" dir="rtl">
                  <thead>
                    <tr className="bg-gray-100 border-b-2 border-gray-300 text-gray-700">
                      <th className="py-2 px-4">رقم الفاتورة</th>
                      <th className="py-2 px-4">العميل</th>
                      <th className="py-2 px-4">التاريخ</th>
                      <th className="py-2 px-4">الإجمالي</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-gray-200">
                      <td className="py-2 px-4">INV-1001</td>
                      <td className="py-2 px-4">شركة الأمل</td>
                      <td className="py-2 px-4">2026-07-30</td>
                      <td className="py-2 px-4">1,500.00 ر.س</td>
                    </tr>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      <td className="py-2 px-4">INV-1002</td>
                      <td className="py-2 px-4">مؤسسة التقنية</td>
                      <td className="py-2 px-4">2026-07-30</td>
                      <td className="py-2 px-4">3,200.00 ر.س</td>
                    </tr>
                  </tbody>
                </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
