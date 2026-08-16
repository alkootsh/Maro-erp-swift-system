/**
 * @file DocumentManagement.tsx
 * @module واجهات وصفحات النظام (UI Pages)
 * @description ملف جزء من نظام MARO ERP. الوظيفة: DocumentManagement.tsx.
 */
import React, { useState } from 'react';
import { 
  FileText, 
  UploadCloud, 
  ScanLine, 
  CheckCircle2, 
  Search, 
  Filter,
  Download,
  Trash2,
  FileSearch,
  Building,
  Calendar,
  DollarSign,
  AlertCircle
} from 'lucide-react';
import { formatCurrency, cn } from '../lib/utils';

export const DocumentManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'documents' | 'ocr'>('documents');
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<any>(null);

  const mockDocuments = [
    { id: 'DOC-001', title: 'فاتورة مشتريات - مكتبة جرير', type: 'فاتورة (Invoice)', date: '2023-11-10', size: '2.4 MB', status: 'مؤرشف' },
    { id: 'DOC-002', title: 'عقد إيجار فرع الدمام', type: 'عقد (Contract)', date: '2023-11-05', size: '5.1 MB', status: 'مؤرشف' },
    { id: 'DOC-003', title: 'إيصال استلام نقدية', type: 'إيصال (Receipt)', date: '2023-11-01', size: '1.2 MB', status: 'مؤرشف' },
  ];

  const handleSimulateOCR = () => {
    setIsScanning(true);
    setScanResult(null);
    
    // Simulate OCR processing time
    setTimeout(() => {
      setIsScanning(false);
      setScanResult({
        supplierName: 'مؤسسة التوريدات الحديثة',
        taxNumber: '310987654300003',
        date: '2023-11-12',
        invoiceNumber: 'INV-2023-9981',
        totalAmount: 14500,
        taxAmount: 2175,
        confidence: 94,
        lines: [
          { name: 'أجهزة حاسب آلي (لابتوب)', qty: 5, price: 2900, total: 14500 }
        ]
      });
    }, 2500);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-950 via-[#151b2b] to-[#0f172a] p-6 rounded-2xl border border-blue-900/40 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-400 font-bold text-xs border border-blue-500/30">
              MARO Phase 10: Docs & OCR
            </span>
          </div>
          <h1 className="text-2xl font-black text-white">إدارة الوثائق والتعرف الضوئي (OCR)</h1>
          <p className="text-xs text-slate-400 mt-1">
            أرشفة إلكترونية ذكية واستخراج تلقائي للبيانات من الفواتير والإيصالات لتحويلها إلى قيود محاسبية.
          </p>
        </div>
        <div className="flex items-center gap-3">
           <div className="bg-[#0f172a] p-3 rounded-xl border border-slate-800 flex items-center gap-3">
             <ScanLine className="text-emerald-400" size={24} />
             <div>
               <p className="text-[10px] text-slate-400">محرك القراءة الذكي</p>
               <p className="text-xs font-bold text-emerald-400">OCR Engine v1.0</p>
             </div>
           </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('documents')}
          className={cn(
            "px-5 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2",
            activeTab === 'documents' ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" : "bg-[#151b2b] text-slate-400 hover:text-white border border-slate-800"
          )}
        >
          <FileText size={16} />
          الأرشيف الرقمي (Document Archive)
        </button>
        <button
          onClick={() => setActiveTab('ocr')}
          className={cn(
            "px-5 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2",
            activeTab === 'ocr' ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" : "bg-[#151b2b] text-slate-400 hover:text-white border border-slate-800"
          )}
        >
          <ScanLine size={16} />
          المعالجة الذكية (Smart OCR)
        </button>
      </div>

      {/* Documents Tab */}
      {activeTab === 'documents' && (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-[#151b2b] p-4 rounded-2xl border border-slate-800">
            <div className="flex items-center gap-4 w-full md:w-auto">
              <div className="relative flex-1 md:w-64">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                <input 
                  type="text" 
                  placeholder="ابحث في الوثائق..." 
                  className="w-full bg-[#0f172a] border border-slate-700 rounded-xl pr-10 pl-4 py-2 text-white text-xs focus:outline-none focus:border-blue-500"
                />
              </div>
              <button className="bg-[#0f172a] p-2 rounded-xl border border-slate-700 text-slate-400 hover:text-white">
                <Filter size={18} />
              </button>
            </div>
            <button className="w-full md:w-auto bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2">
              <UploadCloud size={16} /> رفع وثيقة
            </button>
          </div>

          <div className="bg-[#151b2b] rounded-2xl border border-slate-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-sm">
                <thead className="bg-[#0f172a] border-b border-slate-800 text-slate-400 text-xs">
                  <tr>
                    <th className="px-6 py-4 font-bold">معرف الوثيقة</th>
                    <th className="px-6 py-4 font-bold">اسم الوثيقة</th>
                    <th className="px-6 py-4 font-bold">النوع</th>
                    <th className="px-6 py-4 font-bold">تاريخ الرفع</th>
                    <th className="px-6 py-4 font-bold">الحجم</th>
                    <th className="px-6 py-4 font-bold text-center">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {mockDocuments.map((doc) => (
                    <tr key={doc.id} className="hover:bg-[#0f172a]/50 transition-colors">
                      <td className="px-6 py-4 font-mono text-xs text-slate-500">{doc.id}</td>
                      <td className="px-6 py-4 text-white font-bold text-xs flex items-center gap-2">
                        <FileText size={16} className="text-blue-400" /> {doc.title}
                      </td>
                      <td className="px-6 py-4 text-slate-300 text-xs">{doc.type}</td>
                      <td className="px-6 py-4 text-slate-400 text-xs font-mono">{doc.date}</td>
                      <td className="px-6 py-4 text-slate-400 text-xs font-mono">{doc.size}</td>
                      <td className="px-6 py-4">
                        <div className="flex justify-center gap-2">
                          <button className="p-1.5 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 rounded-lg transition-colors">
                            <Download size={14} />
                          </button>
                          <button className="p-1.5 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* OCR Tab */}
      {activeTab === 'ocr' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Upload Area */}
          <div className="bg-[#151b2b] rounded-2xl border border-slate-800 p-6 flex flex-col items-center justify-center min-h-[400px]">
            <div className="w-full max-w-sm">
              <div className="border-2 border-dashed border-slate-700 bg-[#0f172a] rounded-2xl p-8 text-center hover:border-blue-500 hover:bg-blue-900/10 transition-all cursor-pointer">
                <UploadCloud size={48} className="mx-auto text-slate-500 mb-4" />
                <h3 className="text-white font-bold text-sm mb-2">اسحب وأفلت الفاتورة هنا</h3>
                <p className="text-xs text-slate-400 mb-6">أو اضغط لاختيار ملف (PDF, PNG, JPG)</p>
                <button 
                  onClick={handleSimulateOCR}
                  disabled={isScanning}
                  className="w-full bg-slate-800 hover:bg-slate-700 text-white py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isScanning ? (
                    <>
                      <ScanLine size={16} className="animate-pulse text-emerald-400" />
                      جاري تحليل الفاتورة...
                    </>
                  ) : (
                    <>
                      <ScanLine size={16} />
                      محاكاة القراءة الضوئية
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Results Area */}
          <div className="bg-[#151b2b] rounded-2xl border border-slate-800 p-6 relative">
            {!scanResult && !isScanning && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500">
                <FileSearch size={48} className="mb-4 opacity-50" />
                <p className="text-sm font-bold">النتائج ستظهر هنا بعد التحليل</p>
              </div>
            )}
            
            {isScanning && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-emerald-500 bg-[#151b2b]/80 backdrop-blur-sm z-10 rounded-2xl">
                <ScanLine size={48} className="animate-bounce mb-4" />
                <p className="text-sm font-bold animate-pulse">جاري استخراج البيانات (OCR Processing)...</p>
              </div>
            )}

            {scanResult && (
              <div className="space-y-6 animate-in fade-in duration-500">
                <div className="flex justify-between items-center border-b border-slate-800 pb-4">
                  <h3 className="font-bold text-white flex items-center gap-2">
                    <CheckCircle2 size={20} className="text-emerald-400" />
                    تم الاستخراج بنجاح
                  </h3>
                  <div className="bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-lg text-xs font-bold border border-emerald-500/20">
                    دقة القراءة: {scanResult.confidence}%
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-[#0f172a] p-4 rounded-xl border border-slate-800">
                    <p className="text-[10px] text-slate-500 font-bold mb-1 flex items-center gap-1"><Building size={12}/> المورد</p>
                    <p className="text-sm font-bold text-white">{scanResult.supplierName}</p>
                    <p className="text-[10px] text-slate-400 mt-1 font-mono">الرقم الضريبي: {scanResult.taxNumber}</p>
                  </div>
                  
                  <div className="bg-[#0f172a] p-4 rounded-xl border border-slate-800">
                    <p className="text-[10px] text-slate-500 font-bold mb-1 flex items-center gap-1"><Calendar size={12}/> تاريخ الفاتورة</p>
                    <p className="text-sm font-bold text-white font-mono">{scanResult.date}</p>
                    <p className="text-[10px] text-slate-400 mt-1 font-mono">رقم المرجع: {scanResult.invoiceNumber}</p>
                  </div>
                </div>

                <div className="bg-[#0f172a] p-4 rounded-xl border border-slate-800">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-xs font-bold text-slate-300">أصناف الفاتورة</h4>
                  </div>
                  <div className="space-y-2">
                    {scanResult.lines.map((line: any, idx: number) => (
                      <div key={idx} className="flex justify-between items-center text-xs border-b border-slate-800/50 pb-2 last:border-0 last:pb-0">
                        <span className="text-white font-bold">{line.name}</span>
                        <div className="flex items-center gap-4 font-mono">
                          <span className="text-slate-400">{line.qty} × {formatCurrency(line.price)}</span>
                          <span className="text-blue-400 font-bold">{formatCurrency(line.total)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-between items-center bg-blue-950/20 p-4 rounded-xl border border-blue-900/30">
                  <div>
                    <p className="text-[10px] text-slate-400">إجمالي الفاتورة</p>
                    <p className="text-xl font-black text-white font-mono">{formatCurrency(scanResult.totalAmount + scanResult.taxAmount)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-slate-400">قيمة الضريبة (15%)</p>
                    <p className="text-sm font-bold text-emerald-400 font-mono">{formatCurrency(scanResult.taxAmount)}</p>
                  </div>
                </div>

                <button className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-xl text-xs font-bold transition-all shadow-lg shadow-emerald-600/20 flex justify-center items-center gap-2">
                  <FileText size={16} /> إنشاء قيد محاسبي وفاتورة مشتريات (Draft)
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
