/**
 * @file ReportDesigner.tsx
 * @module واجهات وصفحات النظام (UI Pages)
 * @description ملف جزء من نظام MARO ERP. الوظيفة: ReportDesigner.tsx.
 */
import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  FileText, 
  Database, 
  Settings, 
  LayoutTemplate, 
  BarChart2, 
  PieChart as PieChartIcon, 
  Table as TableIcon, 
  Type, 
  Download, 
  Save, 
  Play, 
  Grid, 
  List, 
  Activity, 
  Check, 
  Trash2, 
  Printer, 
  FileSpreadsheet, 
  Sparkles, 
  ArrowRight,
  Filter,
  Eye,
  Columns
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell } from 'recharts';
import { MaroSyncEngine } from '../../lib/maroSyncEngine';
import { formatCurrency, formatDate, cn } from '../../lib/utils';
import { toast } from 'react-hot-toast';

interface ReportField {
  id: string;
  name: string;
  nameAr: string;
  type: 'string' | 'number' | 'date';
  enabled: boolean;
}

interface DatasetConfig {
  id: string;
  nameAr: string;
  collection: string;
  fields: ReportField[];
}

const DATASETS: DatasetConfig[] = [
  {
    id: 'sales',
    nameAr: 'المبيعات والفواتير (Invoices)',
    collection: 'invoices',
    fields: [
      { id: 'invoiceNumber', name: 'Invoice #', nameAr: 'رقم الفاتورة', type: 'string', enabled: true },
      { id: 'customerName', name: 'Customer', nameAr: 'اسم العميل', type: 'string', enabled: true },
      { id: 'createdAt', name: 'Date', nameAr: 'تاريخ الفاتورة', type: 'date', enabled: true },
      { id: 'totalUntaxed', name: 'Subtotal', nameAr: 'المبلغ قبل الضريبة', type: 'number', enabled: false },
      { id: 'totalTax', name: 'Tax', nameAr: 'قيمة الضريبة (14%)', type: 'number', enabled: false },
      { id: 'grandTotal', name: 'Total', nameAr: 'إجمالي الفاتورة', type: 'number', enabled: true },
      { id: 'paymentMethod', name: 'Payment Method', nameAr: 'طريقة الدفع', type: 'string', enabled: true },
      { id: 'status', name: 'Status', nameAr: 'حالة السداد', type: 'string', enabled: true }
    ]
  },
  {
    id: 'shifts',
    nameAr: 'ورديات الكاشير والصناديق (Cashier Shifts)',
    collection: 'pos_shifts',
    fields: [
      { id: 'shiftNumber', name: 'Shift #', nameAr: 'رقم الوردية', type: 'string', enabled: true },
      { id: 'cashierName', name: 'Cashier', nameAr: 'اسم الكاشير', type: 'string', enabled: true },
      { id: 'branchName', name: 'Branch', nameAr: 'الفرع', type: 'string', enabled: true },
      { id: 'startTime', name: 'Opened At', nameAr: 'تاريخ ووقت الفتح', type: 'date', enabled: true },
      { id: 'endTime', name: 'Closed At', nameAr: 'تاريخ ووقت الإغلاق', type: 'date', enabled: true },
      { id: 'openingCash', name: 'Opening Cash', nameAr: 'عهد بداية الوردية', type: 'number', enabled: true },
      { id: 'totalSales', name: 'Total Sales', nameAr: 'إجمالي المبيعات', type: 'number', enabled: true },
      { id: 'totalCash', name: 'Cash Paid', nameAr: 'المبيعات النقدية (كاش)', type: 'number', enabled: true },
      { id: 'totalVisa', name: 'Visa/Card Paid', nameAr: 'مبيعات الشبكة والفيزا', type: 'number', enabled: true },
      { id: 'totalCredit', name: 'Credit Paid', nameAr: 'المبيعات الآجلة', type: 'number', enabled: false },
      { id: 'expenses', name: 'Expenses', nameAr: 'مصروفات ومسحوبات', type: 'number', enabled: false },
      { id: 'closingCash', name: 'Closing Cash', nameAr: 'النية الصافية بالصندوق', type: 'number', enabled: true },
      { id: 'difference', name: 'Variance', nameAr: 'فرق الصندوق (عجز / زيادة)', type: 'number', enabled: true },
      { id: 'status', name: 'Status', nameAr: 'حالة الوردية', type: 'string', enabled: true }
    ]
  },
  {
    id: 'products',
    nameAr: 'المنتجات والمخزون (Inventory & Products)',
    collection: 'products',
    fields: [
      { id: 'name', name: 'Product Name', nameAr: 'اسم المنتج', type: 'string', enabled: true },
      { id: 'sku', name: 'SKU / Barcode', nameAr: 'رمز الصنف / الباركود', type: 'string', enabled: true },
      { id: 'category', name: 'Category', nameAr: 'الفئة / التصنيف', type: 'string', enabled: true },
      { id: 'stock', name: 'Stock Qty', nameAr: 'الرصيد المتاح', type: 'number', enabled: true },
      { id: 'costPrice', name: 'Cost', nameAr: 'سعر التكلفة', type: 'number', enabled: true },
      { id: 'price', name: 'Selling Price', nameAr: 'سعر البيع', type: 'number', enabled: true }
    ]
  },
  {
    id: 'customers',
    nameAr: 'العملاء والذمم المدينة (Customers & Receivables)',
    collection: 'customers',
    fields: [
      { id: 'name', name: 'Customer Name', nameAr: 'اسم العميل', type: 'string', enabled: true },
      { id: 'phone', name: 'Phone', nameAr: 'الهاتف', type: 'string', enabled: true },
      { id: 'creditLimit', name: 'Credit Limit', nameAr: 'الحد الائتماني', type: 'number', enabled: true },
      { id: 'currentBalance', name: 'Balance Due', nameAr: 'الرصيد المدين المستحق', type: 'number', enabled: true },
      { id: 'status', name: 'Status', nameAr: 'الحالة', type: 'string', enabled: true }
    ]
  },
  {
    id: 'work_orders',
    nameAr: 'أوامر التصنيع والتشغيل (Manufacturing & Production)',
    collection: 'work_orders',
    fields: [
      { id: 'orderNumber', name: 'WO #', nameAr: 'رقم أمر الشغل', type: 'string', enabled: true },
      { id: 'finishedProductName', name: 'Finished Product', nameAr: 'المنتج التام', type: 'string', enabled: true },
      { id: 'plannedQuantity', name: 'Planned Qty', nameAr: 'الكمية المطلوبة', type: 'number', enabled: true },
      { id: 'producedQuantity', name: 'Produced Qty', nameAr: 'الكمية المنفذة', type: 'number', enabled: true },
      { id: 'totalCost', name: 'Total Cost', nameAr: 'إجمالي تكلفة التشغيل', type: 'number', enabled: true },
      { id: 'status', name: 'Status', nameAr: 'حالة أمر التشغيل', type: 'string', enabled: true }
    ]
  }
];

const CHART_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

export const ReportDesigner: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'datasets' | 'design' | 'preview'>('design');
  const [reportName, setReportName] = useState('تقرير تحليلي مخصص - مبيعات وأداء');
  const [reportSubtitle, setReportSubtitle] = useState('نظام MARO ERP - قطاع الأعمال');
  const [selectedDatasetId, setSelectedDatasetId] = useState('sales');
  const [activeFields, setActiveFields] = useState<ReportField[]>(DATASETS[0].fields);
  const [themeColor, setThemeColor] = useState('#3b82f6');
  const [showCharts, setShowCharts] = useState(true);
  const [showSummaryCards, setShowSummaryCards] = useState(true);
  const [chartType, setChartType] = useState<'bar' | 'pie'>('bar');
  const [groupByField, setGroupByField] = useState('status');

  // Real data state
  const [datasetRecords, setDatasetRecords] = useState<any[]>([]);

  // Load real data when dataset changes
  useEffect(() => {
    const currentDataset = DATASETS.find(d => d.id === selectedDatasetId) || DATASETS[0];
    setActiveFields(currentDataset.fields);
    
    // Fetch data from MaroSyncEngine
    let records = MaroSyncEngine.getLocalCollection(currentDataset.collection);

    if (currentDataset.collection === 'pos_shifts' && records.length === 0) {
      const demoShifts = [
        { id: 'shift_101', shiftNumber: 'SH-2026-001', cashierName: 'أحمد محمود', branchName: 'الفرع الرئيسي', startTime: '2026-08-10 08:00', endTime: '2026-08-10 16:00', openingCash: 500, totalSales: 4850, totalCash: 3200, totalVisa: 1650, totalCredit: 0, expenses: 150, closingCash: 3550, difference: 0, status: 'مغلقة ومعتمدة' },
        { id: 'shift_102', shiftNumber: 'SH-2026-002', cashierName: 'سارة خالد', branchName: 'فرع الرياض', startTime: '2026-08-11 09:00', endTime: '2026-08-11 17:00', openingCash: 500, totalSales: 6200, totalCash: 4100, totalVisa: 2100, totalCredit: 0, expenses: 200, closingCash: 4400, difference: 0, status: 'مغلقة ومعتمدة' },
        { id: 'shift_103', shiftNumber: 'SH-2026-003', cashierName: 'عمر المالي', branchName: 'الفرع الرئيسي', startTime: '2026-08-12 16:00', endTime: '2026-08-13 00:00', openingCash: 1000, totalSales: 8900, totalCash: 5300, totalVisa: 3600, totalCredit: 0, expenses: 300, closingCash: 6000, difference: -20, status: 'مغلقة بفرقية' },
        { id: 'shift_104', shiftNumber: 'SH-2026-004', cashierName: 'محمد الكاشير', branchName: 'فرع جدة', startTime: '2026-08-13 08:00', endTime: 'قيد التشغيل', openingCash: 500, totalSales: 3400, totalCash: 2200, totalVisa: 1200, totalCredit: 0, expenses: 50, closingCash: 2650, difference: 0, status: 'وردية مفتوحة' },
      ];
      demoShifts.forEach(s => MaroSyncEngine.saveDocument('pos_shifts', s, true));
      records = demoShifts;
    }

    setDatasetRecords(records);

    const unsub = MaroSyncEngine.subscribe(currentDataset.collection, (updatedRecords) => {
      setDatasetRecords(updatedRecords);
    });

    return () => unsub();
  }, [selectedDatasetId]);

  // Toggle field
  const toggleField = (fieldId: string) => {
    setActiveFields(prev => prev.map(f => f.id === fieldId ? { ...f, enabled: !f.enabled } : f));
  };

  // Export to CSV
  const handleExportCSV = () => {
    if (datasetRecords.length === 0) {
      toast.error('لا توجد بيانات لتصديرها');
      return;
    }
    const enabledFields = activeFields.filter(f => f.enabled);
    const headers = enabledFields.map(f => f.nameAr).join(',');
    const rows = datasetRecords.map(rec => {
      return enabledFields.map(f => {
        let val = rec[f.id];
        if (f.type === 'number') val = Number(val) || 0;
        if (f.type === 'date' && val) val = formatDate(val);
        return `"${val ?? ''}"`;
      }).join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${reportName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('تم تصدير ملف التقرير Excel/CSV بنجاح');
  };

  // Handle Save Template
  const handleSaveReport = () => {
    const template = {
      id: `rep_${Date.now()}`,
      name: reportName,
      subtitle: reportSubtitle,
      datasetId: selectedDatasetId,
      fields: activeFields,
      themeColor,
      showCharts,
      showSummaryCards,
      chartType,
      updatedAt: new Date().toISOString()
    };
    MaroSyncEngine.saveDocument('custom_reports', template);
    toast.success('تم حفظ قالب التقرير في مكتبة التقارير بنجاح!');
  };

  // Print Report
  const handlePrint = () => {
    window.print();
  };

  // Calculations for preview
  const enabledFields = activeFields.filter(f => f.enabled);
  const totalRecordCount = datasetRecords.length;
  
  // Find numeric fields to sum
  const numericField = enabledFields.find(f => f.type === 'number');
  const totalSum = numericField 
    ? datasetRecords.reduce((acc, r) => acc + (Number(r[numericField.id]) || 0), 0)
    : 0;

  // Chart aggregated data
  const chartAggregatedData = React.useMemo(() => {
    const map: Record<string, number> = {};
    datasetRecords.forEach(r => {
      const key = String(r[groupByField] || r.category || r.status || r.customerName || 'عام');
      const val = numericField ? (Number(r[numericField.id]) || 1) : 1;
      map[key] = (map[key] || 0) + val;
    });
    return Object.entries(map).slice(0, 6).map(([name, value]) => ({ name, value }));
  }, [datasetRecords, groupByField, numericField]);

  return (
    <div className="h-screen flex flex-col bg-[#0b0f1a] text-white" dir="rtl">
      {/* Header Bar */}
      <div className="h-16 bg-[#151b2b] border-b border-[#1e293b] flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-blue-600/20 text-blue-400 rounded-xl flex items-center justify-center border border-blue-500/30">
            <LayoutTemplate size={20} />
          </div>
          <div>
            <input 
              type="text" 
              value={reportName}
              onChange={(e) => setReportName(e.target.value)}
              className="bg-transparent border-none text-base font-black text-white focus:outline-none focus:ring-1 focus:ring-blue-500 rounded px-1.5"
            />
            <div className="text-[10px] text-slate-400 font-semibold px-1.5">مصمم التقارير المتقدم - السحب والإفلات وتخصيص البيانات</div>
          </div>
        </div>
        
        {/* View Mode Tabs */}
        <div className="flex items-center bg-[#0f172a] p-1 rounded-xl border border-[#1e293b]">
          <button 
            onClick={() => setActiveTab('datasets')}
            className={cn(
              "px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5",
              activeTab === 'datasets' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
            )}
          >
            <Database size={15} />
            <span>مصدر البيانات (Dataset)</span>
          </button>

          <button 
            onClick={() => setActiveTab('design')}
            className={cn(
              "px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5",
              activeTab === 'design' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
            )}
          >
            <Settings size={15} />
            <span>تخصيص القالب (Design)</span>
          </button>

          <button 
            onClick={() => setActiveTab('preview')}
            className={cn(
              "px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5",
              activeTab === 'preview' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
            )}
          >
            <Play size={15} />
            <span>المعاينة الحية والتصدير (Preview)</span>
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5">
          <button 
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 bg-[#1e293b] text-slate-200 hover:text-white px-3.5 py-2 rounded-xl font-bold hover:bg-[#334155] transition-colors text-xs border border-[#334155]"
          >
            <FileSpreadsheet size={15} className="text-emerald-400" />
            <span>تصدير Excel</span>
          </button>

          <button 
            onClick={handlePrint}
            className="flex items-center gap-1.5 bg-[#1e293b] text-slate-200 hover:text-white px-3.5 py-2 rounded-xl font-bold hover:bg-[#334155] transition-colors text-xs border border-[#334155]"
          >
            <Printer size={15} className="text-amber-400" />
            <span>طباعة PDF</span>
          </button>

          <button 
            onClick={handleSaveReport}
            className="flex items-center gap-1.5 bg-blue-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-blue-500 transition-colors text-xs shadow-md shadow-blue-600/20"
          >
            <Save size={15} />
            <span>حفظ القالب</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Tab 1: Dataset Selector & Field Selector */}
        {activeTab === 'datasets' && (
          <div className="flex-1 flex">
            {/* Datasets Sidebar */}
            <div className="w-80 bg-[#151b2b] border-l border-[#1e293b] flex flex-col">
              <div className="p-4 border-b border-[#1e293b]">
                <h3 className="font-bold flex items-center gap-2 text-xs text-slate-300">
                  <Database size={16} className="text-blue-400" />
                  <span>الجداول والكيانات المتاحة (Data Sources)</span>
                </h3>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
                {DATASETS.map(dataset => {
                  const isSelected = dataset.id === selectedDatasetId;
                  return (
                    <button
                      key={dataset.id}
                      onClick={() => setSelectedDatasetId(dataset.id)}
                      className={cn(
                        "w-full p-3 rounded-xl text-right text-xs font-bold transition-all border flex items-center justify-between",
                        isSelected 
                          ? "bg-blue-600/10 border-blue-500 text-white shadow-sm" 
                          : "bg-[#0b0f1a] border-[#1e293b] text-slate-400 hover:border-slate-700 hover:text-slate-200"
                      )}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className={cn("w-2 h-2 rounded-full", isSelected ? "bg-blue-500" : "bg-slate-600")} />
                        <span>{dataset.nameAr}</span>
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono">({dataset.fields.length} حقول)</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Field Selector & Aggregation Options */}
            <div className="flex-1 p-6 flex flex-col overflow-y-auto space-y-6">
              <div className="bg-[#151b2b] p-5 rounded-2xl border border-[#1e293b]">
                <h4 className="font-bold text-sm text-white mb-1 flex items-center gap-2">
                  <Columns size={16} className="text-blue-400" />
                  <span>اختيار الحقول والأعمدة للظهور في التقرير</span>
                </h4>
                <p className="text-xs text-slate-400 mb-4">قم بتفعيل أو إلغاء تفعيل الأعمدة المراد تضمينها في جدول التقرير وتصدير Excel</p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {activeFields.map(field => (
                    <div 
                      key={field.id}
                      onClick={() => toggleField(field.id)}
                      className={cn(
                        "p-3 rounded-xl border text-xs font-semibold cursor-pointer transition-all flex items-center justify-between",
                        field.enabled 
                          ? "bg-blue-600/15 border-blue-500 text-white" 
                          : "bg-[#0f172a] border-[#1e293b] text-slate-500 hover:text-slate-300"
                      )}
                    >
                      <div>
                        <div className="font-bold">{field.nameAr}</div>
                        <div className="text-[10px] text-slate-500 font-mono">{field.name} ({field.type})</div>
                      </div>
                      <div className={cn(
                        "w-5 h-5 rounded-md flex items-center justify-center border",
                        field.enabled ? "bg-blue-600 border-blue-500 text-white" : "border-slate-700 bg-slate-800 text-transparent"
                      )}>
                        <Check size={12} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Data Preview table */}
              <div className="bg-[#151b2b] p-5 rounded-2xl border border-[#1e293b] flex-1 flex flex-col">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-bold text-sm text-white">سجلات البيانات الحية المتصلة ({datasetRecords.length} سجل)</h4>
                  <span className="text-[11px] text-emerald-400 font-bold">● متصل بمحرك MaroSyncEngine</span>
                </div>

                <div className="overflow-x-auto border border-[#1e293b] rounded-xl flex-1 bg-[#0b0f1a]">
                  <table className="w-full text-right text-xs">
                    <thead>
                      <tr className="bg-[#0f172a] text-slate-400 font-bold border-b border-[#1e293b]">
                        {enabledFields.map(f => (
                          <th key={f.id} className="py-2.5 px-3.5">{f.nameAr}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1e293b] text-slate-300">
                      {datasetRecords.slice(0, 8).map((rec, i) => (
                        <tr key={i} className="hover:bg-slate-800/30">
                          {enabledFields.map(f => {
                            let val = rec[f.id];
                            if (f.type === 'number') val = formatCurrency(Number(val) || 0);
                            if (f.type === 'date' && val) val = formatDate(val);
                            return (
                              <td key={f.id} className="py-2.5 px-3.5 font-semibold">
                                {val ?? '---'}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Visual Designer & Layout Settings */}
        {activeTab === 'design' && (
          <div className="flex-1 flex">
            {/* Toolbox Controls */}
            <div className="w-72 bg-[#151b2b] border-l border-[#1e293b] flex flex-col shrink-0 p-5 space-y-6 overflow-y-auto text-xs">
              <div>
                <h4 className="font-bold text-slate-300 mb-2 uppercase text-[11px]">معلومات الترويسة والعنوان</h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-slate-400 mb-1">عنوان التقرير الرئيسي</label>
                    <input 
                      type="text" 
                      value={reportName} 
                      onChange={(e) => setReportName(e.target.value)}
                      className="w-full bg-[#0b0f1a] border border-[#1e293b] rounded-lg px-3 py-1.5 text-white font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">العنوان الفرعي / الشركة</label>
                    <input 
                      type="text" 
                      value={reportSubtitle} 
                      onChange={(e) => setReportSubtitle(e.target.value)}
                      className="w-full bg-[#0b0f1a] border border-[#1e293b] rounded-lg px-3 py-1.5 text-white font-semibold"
                    />
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-slate-300 mb-2 uppercase text-[11px]">مكونات التقرير</h4>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer bg-[#0b0f1a] p-2.5 rounded-lg border border-[#1e293b]">
                    <input 
                      type="checkbox" 
                      checked={showSummaryCards} 
                      onChange={(e) => setShowSummaryCards(e.target.checked)}
                      className="rounded border-slate-700" 
                    />
                    <span className="font-bold text-slate-200">بطاقات المؤشرات الإحصائية (KPIs)</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer bg-[#0b0f1a] p-2.5 rounded-lg border border-[#1e293b]">
                    <input 
                      type="checkbox" 
                      checked={showCharts} 
                      onChange={(e) => setShowCharts(e.target.checked)}
                      className="rounded border-slate-700" 
                    />
                    <span className="font-bold text-slate-200">الرسم البياني التحليلي</span>
                  </label>
                </div>
              </div>

              {showCharts && (
                <div>
                  <h4 className="font-bold text-slate-300 mb-2 uppercase text-[11px]">نوع الرسم البياني والتجميع</h4>
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <button 
                      onClick={() => setChartType('bar')}
                      className={cn(
                        "flex items-center justify-center gap-1.5 p-2 rounded-lg border font-bold",
                        chartType === 'bar' ? "bg-blue-600/20 border-blue-500 text-blue-400" : "bg-[#0b0f1a] border-[#1e293b] text-slate-400"
                      )}
                    >
                      <BarChart2 size={16} />
                      <span>أعمدة (Bar)</span>
                    </button>
                    <button 
                      onClick={() => setChartType('pie')}
                      className={cn(
                        "flex items-center justify-center gap-1.5 p-2 rounded-lg border font-bold",
                        chartType === 'pie' ? "bg-blue-600/20 border-blue-500 text-blue-400" : "bg-[#0b0f1a] border-[#1e293b] text-slate-400"
                      )}
                    >
                      <PieChartIcon size={16} />
                      <span>دائري (Pie)</span>
                    </button>
                  </div>

                  <label className="block text-slate-400 mb-1">تجميع البيانات حسب</label>
                  <select 
                    value={groupByField}
                    onChange={(e) => setGroupByField(e.target.value)}
                    className="w-full bg-[#0b0f1a] border border-[#1e293b] rounded-lg px-2.5 py-1.5 text-slate-200 font-semibold"
                  >
                    {enabledFields.map(f => (
                      <option key={f.id} value={f.id}>{f.nameAr}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <h4 className="font-bold text-slate-300 mb-2 uppercase text-[11px]">اللون المميز (Theme Accent)</h4>
                <div className="flex gap-2">
                  {['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444'].map(color => (
                    <button 
                      key={color}
                      onClick={() => setThemeColor(color)}
                      className={cn(
                        "w-8 h-8 rounded-full border-2 transition-transform",
                        themeColor === color ? "scale-110 border-white shadow-md" : "border-transparent"
                      )}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Design Interactive Visual Paper */}
            <div className="flex-1 bg-[#0b0f1a] p-8 overflow-auto flex justify-center">
              <div className="w-[820px] min-h-[1050px] bg-white text-slate-900 shadow-2xl rounded-sm p-10 flex flex-col justify-between space-y-6">
                
                {/* Header Section */}
                <div className="border-b-2 pb-5" style={{ borderColor: themeColor }}>
                  <div className="flex items-start justify-between">
                    <div>
                      <h1 className="text-2xl font-black text-slate-900 tracking-tight">{reportName}</h1>
                      <p className="text-xs text-slate-500 font-bold mt-1">{reportSubtitle}</p>
                    </div>
                    <div className="text-left text-xs font-semibold text-slate-500">
                      <div>تاريخ التقرير: <span className="font-mono text-slate-800">{new Date().toLocaleDateString('ar-EG')}</span></div>
                      <div>المصدر: <span className="text-blue-600 font-bold">{DATASETS.find(d => d.id === selectedDatasetId)?.nameAr}</span></div>
                    </div>
                  </div>
                </div>

                {/* KPI Summary Blocks */}
                {showSummaryCards && (
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                      <div className="text-xs text-slate-500 font-bold">إجمالي عدد السجلات</div>
                      <div className="text-2xl font-black text-slate-900 mt-1">{totalRecordCount}</div>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                      <div className="text-xs text-slate-500 font-bold">إجمالي القيمة التقديرية</div>
                      <div className="text-2xl font-black" style={{ color: themeColor }}>{formatCurrency(totalSum)}</div>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                      <div className="text-xs text-slate-500 font-bold">متوسط القيمة بالسجل</div>
                      <div className="text-2xl font-black text-slate-700 mt-1">
                        {formatCurrency(totalRecordCount > 0 ? (totalSum / totalRecordCount) : 0)}
                      </div>
                    </div>
                  </div>
                )}

                {/* Chart Section */}
                {showCharts && (
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <h3 className="text-xs font-bold text-slate-700 mb-3">تحليل بياني وتوزيعي</h3>
                    <div className="h-48 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        {chartType === 'bar' ? (
                          <BarChart data={chartAggregatedData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                            <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 10, fontWeight: 700 }} />
                            <YAxis tick={{ fill: '#64748b', fontSize: 10, fontWeight: 700 }} />
                            <Tooltip />
                            <Bar dataKey="value" fill={themeColor} radius={[4, 4, 0, 0]} name="القيمة" />
                          </BarChart>
                        ) : (
                          <PieChart>
                            <Tooltip />
                            <Pie data={chartAggregatedData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70}>
                              {chartAggregatedData.map((_, index) => (
                                <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                              ))}
                            </Pie>
                          </PieChart>
                        )}
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}

                {/* Table Section */}
                <div className="flex-1">
                  <h3 className="text-xs font-bold text-slate-700 mb-2">جدول البيانات التفصيلي</h3>
                  <table className="w-full text-right text-xs border border-slate-200 rounded-lg overflow-hidden">
                    <thead>
                      <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                        {enabledFields.map(f => (
                          <th key={f.id} className="py-2.5 px-3">{f.nameAr}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 text-slate-800 font-semibold">
                      {datasetRecords.slice(0, 6).map((rec, i) => (
                        <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50/70'}>
                          {enabledFields.map(f => {
                            let val = rec[f.id];
                            if (f.type === 'number') val = formatCurrency(Number(val) || 0);
                            if (f.type === 'date' && val) val = formatDate(val);
                            return (
                              <td key={f.id} className="py-2 px-3">
                                {val ?? '---'}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Footer Section */}
                <div className="border-t border-slate-200 pt-4 flex items-center justify-between text-[11px] text-slate-400 font-semibold">
                  <div>تم استخراج التقرير بواسطة MARO Business Platform</div>
                  <div>صفحة 1 من 1</div>
                  <div>اعتماد المدير المالي: ___________________</div>
                </div>

              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Full Screen Preview */}
        {activeTab === 'preview' && (
          <div className="flex-1 bg-[#0f172a] p-8 overflow-auto flex justify-center">
            <div className="w-[840px] bg-white text-slate-900 shadow-2xl p-10 space-y-6">
              <div className="border-b-2 pb-5 flex items-start justify-between" style={{ borderColor: themeColor }}>
                <div>
                  <h1 className="text-3xl font-black text-slate-900">{reportName}</h1>
                  <p className="text-sm text-slate-600 font-bold mt-1">{reportSubtitle}</p>
                </div>
                <div className="text-left text-xs font-semibold text-slate-500">
                  <div>تاريخ التقرير: <span className="font-mono text-slate-800">{new Date().toLocaleDateString('ar-EG')}</span></div>
                  <div>المصدر: <span className="text-blue-600 font-bold">{DATASETS.find(d => d.id === selectedDatasetId)?.nameAr}</span></div>
                </div>
              </div>

              {showSummaryCards && (
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-center">
                    <div className="text-xs text-slate-500 font-bold">إجمالي السجلات</div>
                    <div className="text-2xl font-black text-slate-900 mt-1">{totalRecordCount}</div>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-center">
                    <div className="text-xs text-slate-500 font-bold">إجمالي القيمة</div>
                    <div className="text-2xl font-black" style={{ color: themeColor }}>{formatCurrency(totalSum)}</div>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-center">
                    <div className="text-xs text-slate-500 font-bold">المتوسط</div>
                    <div className="text-2xl font-black text-slate-700 mt-1">
                      {formatCurrency(totalRecordCount > 0 ? (totalSum / totalRecordCount) : 0)}
                    </div>
                  </div>
                </div>
              )}

              {showCharts && (
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <h3 className="text-xs font-bold text-slate-700 mb-3">الرسم البياني للمخرجات</h3>
                  <div className="h-56 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartAggregatedData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11, fontWeight: 700 }} />
                        <YAxis tick={{ fill: '#64748b', fontSize: 11, fontWeight: 700 }} />
                        <Tooltip />
                        <Bar dataKey="value" fill={themeColor} radius={[4, 4, 0, 0]} name="القيمة" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              <div>
                <table className="w-full text-right text-xs border border-slate-200 rounded-lg overflow-hidden">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                      {enabledFields.map(f => (
                        <th key={f.id} className="py-2.5 px-3">{f.nameAr}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-slate-800 font-semibold">
                    {datasetRecords.map((rec, i) => (
                      <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50/70'}>
                        {enabledFields.map(f => {
                          let val = rec[f.id];
                          if (f.type === 'number') val = formatCurrency(Number(val) || 0);
                          if (f.type === 'date' && val) val = formatDate(val);
                          return (
                            <td key={f.id} className="py-2 px-3">
                              {val ?? '---'}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="border-t border-slate-200 pt-6 flex items-center justify-between text-xs text-slate-500 font-semibold">
                <div>نظام MARO ERP - وثيقة رسمية معتمدة</div>
                <div>تاريخ الطباعة: {new Date().toLocaleDateString('ar-EG')}</div>
                <div>توقيع المسؤول: __________________</div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
