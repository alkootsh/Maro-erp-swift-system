import React, { useState } from 'react';
import { 
  Sparkles, 
  Upload, 
  FileText, 
  Stethoscope, 
  CheckCircle2, 
  ArrowLeft, 
  X, 
  Loader2, 
  ShoppingCart, 
  Pill, 
  Plus, 
  Building2, 
  User, 
  Calendar,
  DollarSign
} from 'lucide-react';
import { MaroSyncEngine } from '../lib/maroSyncEngine';
import { IndustryModuleEngine } from '../lib/industryModuleEngine';
import { formatCurrency } from '../lib/utils';
import { toast } from 'react-hot-toast';

interface AIPaperScannerModalProps {
  onClose: () => void;
  initialType?: 'invoice' | 'prescription';
}

export const AIPaperScannerModal: React.FC<AIPaperScannerModalProps> = ({ onClose, initialType = 'invoice' }) => {
  const isPharmacyActive = IndustryModuleEngine.getActiveModules().some(m => m.id === 'PHARMACY_MEDICAL');
  const [docType, setDocType] = useState<'invoice' | 'prescription'>(isPharmacyActive ? initialType : 'invoice');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [extractedData, setExtractedData] = useState<any | null>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
        setExtractedData(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleScanWithAI = async () => {
    setIsScanning(true);
    try {
      const res = await fetch('/api/ai/scan-document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: imagePreview,
          documentType: docType
        })
      });

      const json = await res.json();
      if (json.success && json.data) {
        setExtractedData(json.data);
        toast.success(docType === 'invoice' ? 'تم تحليل الفاتورة الورقية بنجاح' : 'تم قراءة الروشتة الطبية بنجاح');
      } else {
        toast.error(json.error || 'فشل تحليل المستند');
      }
    } catch (err: any) {
      toast.error('حدث خطأ أثناء الاتصال بالذكاء الاصطناعي');
    } finally {
      setIsScanning(false);
    }
  };

  const handleConvertToPurchaseOrder = () => {
    if (!extractedData) return;

    const newPO = {
      id: `PO_AI_${Date.now()}`,
      billNumber: extractedData.invoiceNumber || `PO-${Math.floor(1000 + Math.random() * 9000)}`,
      supplierName: extractedData.supplierName || 'مورد عام ورقي',
      date: extractedData.date || new Date().toISOString().split('T')[0],
      items: extractedData.items || [],
      grandTotal: extractedData.grandTotal || 0,
      status: 'مسودة طلب شراء (Draft PO)',
      source: 'مسح ذكي AI OCR Vision',
      createdAt: new Date().toISOString()
    };

    MaroSyncEngine.saveDocument('bills', newPO, true);
    toast.success(`تم إنشاء طلب شراء [${newPO.billNumber}] بنجاح في المنظومة`);
    onClose();
  };

  const handleConvertToPrescriptionOrder = () => {
    if (!extractedData) return;

    const newPrescription = {
      id: `RX_AI_${Date.now()}`,
      rxNumber: `RX-${Math.floor(10000 + Math.random() * 90000)}`,
      patientName: extractedData.patientName || 'مريض عام',
      doctorName: extractedData.doctorName || 'طبيب عيادة',
      diagnosis: extractedData.diagnosis || 'فحص عام',
      medicines: extractedData.medicines || [],
      date: extractedData.date || new Date().toISOString().split('T')[0],
      status: 'روشتة جاهزة للصرف',
      source: 'مساعد MARO AI الذكي',
      createdAt: new Date().toISOString()
    };

    MaroSyncEngine.saveDocument('prescriptions', newPrescription, true);
    toast.success(`تم تحويل الروشتة إلى طلب صرف دواء برقم [${newPrescription.rxNumber}]`);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-[#0b0f1a]/85 backdrop-blur-md flex items-center justify-center z-50 p-4" dir="rtl">
      <div className="bg-[#151b2b] w-full max-w-4xl rounded-3xl border border-[#1e293b] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-[#1e293b] flex items-center justify-between bg-[#0f172a]/50">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-tr from-purple-600 to-blue-600 text-white rounded-2xl shadow-lg shadow-purple-600/20">
              <Sparkles size={22} />
            </div>
            <div>
              <h2 className="text-xl font-black text-white tracking-tight">المساعد الذكي للتعرف البصري (AI Document Vision Reader)</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                قراءة الفواتير الورقية والمشتريات وتحويلها لطلبات شراء، وقراءة روشتات المرضى وتحويلها لطلبات دواء
              </p>
            </div>
          </div>

          <button onClick={onClose} className="p-2 text-slate-500 hover:text-white hover:bg-slate-800 rounded-xl transition-all">
            <X size={20} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 flex-1 overflow-y-auto space-y-6">
          {/* Document Type Selector Tabs */}
          <div className="flex gap-3 p-1.5 bg-[#0b0f1a] rounded-2xl border border-[#1e293b]">
            <button
              onClick={() => { setDocType('invoice'); setExtractedData(null); }}
              className={`flex-1 py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                docType === 'invoice' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-400 hover:text-white'
              }`}
            >
              <FileText size={18} />
              <span>فاتورة شراء ورقية (Paper Invoice → Purchase Order)</span>
            </button>

            {isPharmacyActive && (
              <button
                onClick={() => { setDocType('prescription'); setExtractedData(null); }}
                className={`flex-1 py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                  docType === 'prescription' ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Stethoscope size={18} />
                <span>روشتة مريض طبية (Doctor Prescription → Rx Order)</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column: Image Dropzone & Camera */}
            <div className="space-y-4">
              <label className="block text-xs font-bold text-slate-300">
                رفع أو التقاط صورة {docType === 'invoice' ? 'الفاتورة الورقية' : 'الروشتة الطبية'}
              </label>

              <div className="border-2 border-dashed border-[#334155] hover:border-blue-500/80 rounded-3xl p-6 bg-[#0b0f1a] flex flex-col items-center justify-center min-h-[260px] relative transition-all group overflow-hidden">
                {imagePreview ? (
                  <div className="relative w-full h-full flex flex-col items-center">
                    <img src={imagePreview} alt="Doc preview" className="max-h-[220px] object-contain rounded-xl border border-[#1e293b]" />
                    <button
                      onClick={() => setImagePreview(null)}
                      className="mt-3 px-3 py-1 bg-red-600/20 text-red-400 border border-red-500/30 rounded-lg text-xs font-bold"
                    >
                      إعادة اختيار صورة أخرى
                    </button>
                  </div>
                ) : (
                  <div className="text-center space-y-3">
                    <div className="w-16 h-16 bg-blue-600/10 text-blue-400 rounded-2xl flex items-center justify-center mx-auto border border-blue-500/20 group-hover:scale-110 transition-transform">
                      <Upload size={28} />
                    </div>
                    <div>
                      <p className="font-bold text-sm text-white">اسحب واسقط الصورة هنا</p>
                      <p className="text-[11px] text-slate-500 mt-1">يدعم JPG, PNG, WEBP أو التقاط الكاميرا مباشرة</p>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                  </div>
                )}
              </div>

              <button
                onClick={handleScanWithAI}
                disabled={isScanning}
                className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white rounded-2xl font-black text-xs shadow-xl shadow-purple-600/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                {isScanning ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    <span>جاري تحليل المستند عبر ذكاء Gemini...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={18} />
                    <span>بدء التحليل واستخراج البيانات بذكاء (Scan with AI)</span>
                  </>
                )}
              </button>
            </div>

            {/* Right Column: AI Extraction Results */}
            <div className="space-y-4">
              <label className="block text-xs font-bold text-slate-300">النتائج المستخرجة ذكياً</label>

              {!extractedData ? (
                <div className="h-[280px] bg-[#0b0f1a] rounded-3xl border border-[#1e293b] p-6 flex flex-col items-center justify-center text-center space-y-2 text-slate-500">
                  <Sparkles size={36} className="text-slate-700 animate-pulse" />
                  <p className="text-xs font-bold">قم برفع الصورة واضغط على زر التحليل بالذكاء الاصطناعي</p>
                  <p className="text-[10px] text-slate-600">سيتم استخراج الحقول والأصناف والأسعار تلقائياً</p>
                </div>
              ) : (
                <div className="bg-[#0b0f1a] rounded-3xl border border-[#1e293b] p-5 space-y-4 text-xs">
                  {/* Invoice Extracted Output */}
                  {docType === 'invoice' && (
                    <>
                      <div className="space-y-2 border-b border-[#1e293b] pb-3">
                        <div className="flex justify-between items-center text-slate-400">
                          <span className="flex items-center gap-1.5"><Building2 size={14} className="text-blue-400" /> المورد:</span>
                          <span className="font-bold text-white text-sm">{extractedData.supplierName}</span>
                        </div>
                        <div className="flex justify-between items-center text-slate-400">
                          <span className="flex items-center gap-1.5"><FileText size={14} className="text-amber-400" /> رقم الفاتورة:</span>
                          <span className="font-mono text-white font-bold">{extractedData.invoiceNumber}</span>
                        </div>
                        <div className="flex justify-between items-center text-slate-400">
                          <span className="flex items-center gap-1.5"><Calendar size={14} className="text-purple-400" /> التاريخ:</span>
                          <span className="font-mono text-slate-300">{extractedData.date}</span>
                        </div>
                      </div>

                      {/* Items */}
                      <div className="space-y-2">
                        <span className="font-bold text-slate-300 block">الأصناف المكتشفة ({extractedData.items?.length || 0}):</span>
                        <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
                          {extractedData.items?.map((item: any, idx: number) => (
                            <div key={idx} className="p-2 bg-[#151b2b] rounded-xl flex justify-between items-center border border-[#1e293b]">
                              <span className="font-bold text-white">{item.name}</span>
                              <span className="font-mono text-blue-400">{item.quantity} × {item.unitPrice} = {item.total} ج.م</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="flex justify-between items-center pt-2 border-t border-[#1e293b] font-black text-sm">
                        <span className="text-slate-300">إجمالي الفاتورة:</span>
                        <span className="font-mono text-emerald-400">{formatCurrency(extractedData.grandTotal || 0)}</span>
                      </div>

                      <button
                        onClick={handleConvertToPurchaseOrder}
                        className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20"
                      >
                        <ShoppingCart size={16} />
                        <span>تحويل تلقائي إلى طلب شراء بالسيستم (Create Purchase Order)</span>
                      </button>
                    </>
                  )}

                  {/* Prescription Extracted Output */}
                  {docType === 'prescription' && (
                    <>
                      <div className="space-y-2 border-b border-[#1e293b] pb-3">
                        <div className="flex justify-between items-center text-slate-400">
                          <span className="flex items-center gap-1.5"><User size={14} className="text-purple-400" /> المريض:</span>
                          <span className="font-bold text-white text-sm">{extractedData.patientName}</span>
                        </div>
                        <div className="flex justify-between items-center text-slate-400">
                          <span className="flex items-center gap-1.5"><Stethoscope size={14} className="text-blue-400" /> الطبيب المعالج:</span>
                          <span className="font-bold text-slate-200">{extractedData.doctorName}</span>
                        </div>
                        {extractedData.diagnosis && (
                          <div className="text-slate-400">
                            <span>التشخيص: </span>
                            <span className="text-amber-300 font-medium">{extractedData.diagnosis}</span>
                          </div>
                        )}
                      </div>

                      {/* Medicines */}
                      <div className="space-y-2">
                        <span className="font-bold text-slate-300 block">الأدوية الموصوفة ({extractedData.medicines?.length || 0}):</span>
                        <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
                          {extractedData.medicines?.map((med: any, idx: number) => (
                            <div key={idx} className="p-2.5 bg-[#151b2b] rounded-xl space-y-0.5 border border-[#1e293b]">
                              <div className="flex justify-between font-bold text-white">
                                <span>{med.name}</span>
                                <span className="font-mono text-purple-400">{med.quantity} عبوة</span>
                              </div>
                              <div className="text-[10px] text-slate-400">الجرعة: {med.dosage} | المدة: {med.duration}</div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <button
                        onClick={handleConvertToPrescriptionOrder}
                        className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-purple-600/20"
                      >
                        <Pill size={16} />
                        <span>تحويل إلى طلب صرف روشتة بالصيدلية (Issue Prescription Order)</span>
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
