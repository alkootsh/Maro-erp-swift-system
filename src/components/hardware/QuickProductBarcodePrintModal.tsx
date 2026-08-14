import React, { useState, useEffect } from 'react';
import { 
  Printer, 
  Barcode, 
  X, 
  CheckCircle2, 
  Layers, 
  Sliders, 
  Copy, 
  Eye,
  Play,
  FileText
} from 'lucide-react';
import { ProductMaster } from '../../types/productMaster';
import { BarcodeLabelTemplate, HardwarePrinterProfile } from '../../types/thermalBarcodeScale';
import { ThermalBarcodeScaleEngine } from '../../services/thermalBarcodeScaleEngine';
import { VisualBarcodeRenderer } from './VisualBarcodeRenderer';
import { formatCurrency } from '../../lib/utils';
import { toast } from 'react-hot-toast';

interface QuickProductBarcodePrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: ProductMaster | null;
}

export const QuickProductBarcodePrintModal: React.FC<QuickProductBarcodePrintModalProps> = ({
  isOpen,
  onClose,
  product
}) => {
  const [templates, setTemplates] = useState<BarcodeLabelTemplate[]>([]);
  const [printers, setPrinters] = useState<HardwarePrinterProfile[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [selectedPrinterId, setSelectedPrinterId] = useState<string>('');
  const [copies, setCopies] = useState<number>(1);
  const [customPrice, setCustomPrice] = useState<number>(0);
  const [includePrice, setIncludePrice] = useState<boolean>(true);
  const [isPrinting, setIsPrinting] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen && product) {
      const tmpls = ThermalBarcodeScaleEngine.getTemplates();
      const prns = ThermalBarcodeScaleEngine.getPrinters();
      setTemplates(tmpls);
      setPrinters(prns);
      if (tmpls.length > 0) setSelectedTemplateId(tmpls[0].id);
      if (prns.length > 0) setSelectedPrinterId(prns[0].id);
      setCustomPrice(product.price);
      setCopies(1);
    }
  }, [isOpen, product]);

  if (!isOpen || !product) return null;

  const currentTemplate = templates.find(t => t.id === selectedTemplateId) || templates[0];
  const currentPrinter = printers.find(p => p.id === selectedPrinterId) || printers[0];

  const barcodeValue = product.barcode || product.sku || '6223001000010';

  const handlePrint = () => {
    setIsPrinting(true);
    toast.loading(`جاري إرسال ${copies} ملصق حراري إلى طابعة [${currentPrinter?.name || 'الطابعة الافتراضية'}]...`, { duration: 1200 });

    setTimeout(() => {
      setIsPrinting(false);
      ThermalBarcodeScaleEngine.logPrintJob({
        jobType: 'BARCODE_LABEL',
        templateName: currentTemplate?.nameAr || 'استيكر باركود منتج',
        targetPrinter: currentPrinter?.name || 'طابعة الباركود الرئيسية',
        itemsCount: 1,
        copies: copies,
        executedBy: 'مدير النظام',
        status: 'PRINTED',
        details: `المنتج: ${product.name} (SKU: ${product.sku}) - الباركود: ${barcodeValue}`
      });
      toast.success(`تمت طباعة ${copies} استيكر باركود بنجاح`);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#151b2b] border border-slate-800 rounded-3xl p-6 w-full max-w-2xl space-y-5 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-500/10 text-blue-400 rounded-xl">
              <Barcode size={22} />
            </div>
            <div>
              <h3 className="text-base font-black text-white">طباعة استيكر وباركود حراري للمنتج</h3>
              <p className="text-xs text-slate-400">{product.name} (SKU: {product.sku})</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          
          {/* Controls Form (7 cols) */}
          <div className="md:col-span-7 space-y-3.5">
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">اختر نموذج وقالب الملصق:</label>
              <select
                value={selectedTemplateId}
                onChange={e => setSelectedTemplateId(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
              >
                {templates.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.nameAr} ({t.widthMm}x{t.heightMm}mm)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">طابعة الباركود المستهدفة:</label>
              <select
                value={selectedPrinterId}
                onChange={e => setSelectedPrinterId(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
              >
                {printers.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.brandModel}) - {p.protocol}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">عدد النسخ المطلوبة:</label>
                <input
                  type="number"
                  min={1}
                  max={500}
                  value={copies}
                  onChange={e => setCopies(Math.max(1, Number(e.target.value) || 1))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono text-center"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">سعر البيع على الاستيكر:</label>
                <input
                  type="number"
                  step="0.5"
                  value={customPrice}
                  onChange={e => setCustomPrice(Number(e.target.value) || 0)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono"
                />
              </div>
            </div>

            <div className="pt-2">
              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includePrice}
                  onChange={e => setIncludePrice(e.target.checked)}
                  className="rounded accent-blue-500"
                />
                <span>إظهار السعر النهائي على بطاقة الرف / الاستيكر</span>
              </label>
            </div>
          </div>

          {/* Live Preview (5 cols) */}
          <div className="md:col-span-5 flex flex-col items-center justify-center bg-[#070b13] p-4 rounded-2xl border border-slate-800 space-y-2">
            <span className="text-[10px] font-bold text-slate-400">معاينة الاستيكر النهائي (Live Preview)</span>
            
            <div className="w-[190px] bg-white text-black rounded-lg p-2.5 shadow-xl border-2 border-slate-300 select-none space-y-1.5 text-center">
              <div className="font-black text-xs leading-tight truncate">
                {product.name}
              </div>

              {includePrice && (
                <div className="font-black text-sm text-red-600">
                  {formatCurrency(customPrice)}
                </div>
              )}

              <VisualBarcodeRenderer
                value={barcodeValue}
                format="CODE128"
                width={150}
                height={28}
                showText={true}
              />
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex items-center gap-3 pt-3 border-t border-slate-800">
          <button
            onClick={handlePrint}
            disabled={isPrinting}
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-black text-xs transition-all shadow-lg shadow-blue-600/20 active:scale-95 disabled:opacity-50"
          >
            <Printer size={16} />
            <span>{isPrinting ? 'جاري الإرسال للطابعة...' : `طباعة ${copies} ملصق الآن`}</span>
          </button>
          <button
            onClick={onClose}
            className="px-5 py-3 bg-slate-800 text-slate-300 hover:bg-slate-700 rounded-xl font-bold text-xs transition-all"
          >
            إلغاء
          </button>
        </div>

      </div>
    </div>
  );
};
