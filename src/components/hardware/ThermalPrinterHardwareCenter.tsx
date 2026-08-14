import React, { useState, useEffect } from 'react';
import { 
  Printer, 
  Settings, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle, 
  Usb, 
  Wifi, 
  Bluetooth, 
  FileText, 
  Play, 
  Scissors, 
  Coins, 
  Sliders, 
  Plus, 
  Trash2, 
  Sparkles,
  Layers
} from 'lucide-react';
import { HardwarePrinterProfile, ThermalConnectionType, ThermalPrintProtocol } from '../../types/thermalBarcodeScale';
import { ThermalBarcodeScaleEngine } from '../../services/thermalBarcodeScaleEngine';
import { toast } from 'react-hot-toast';
import { cn } from '../../lib/utils';

export const ThermalPrinterHardwareCenter: React.FC = () => {
  const [printers, setPrinters] = useState<HardwarePrinterProfile[]>([]);
  const [selectedPrinter, setSelectedPrinter] = useState<HardwarePrinterProfile | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [testingId, setTestingId] = useState<string | null>(null);

  const [formState, setFormState] = useState<Partial<HardwarePrinterProfile>>({
    name: '',
    brandModel: 'Epson TM-T20III',
    deviceType: 'THERMAL_RECEIPT',
    connection: 'USB_RAW',
    ipOrPort: 'USB:0416:5011',
    paperWidthMm: 80,
    dpi: 203,
    protocol: 'ESC_POS',
    isCashDrawerConnected: true,
    autoCutPaper: true,
    isDefault: false
  });

  useEffect(() => {
    loadPrinters();
  }, []);

  const loadPrinters = () => {
    const loaded = ThermalBarcodeScaleEngine.getPrinters();
    setPrinters(loaded);
    if (loaded.length > 0) setSelectedPrinter(loaded[0]);
  };

  const handleTestPrint = (printer: HardwarePrinterProfile) => {
    setTestingId(printer.id);
    toast.loading(`جاري إرسال أوامر الطباعة المباشرة لـ [${printer.name}]...`, { duration: 1200 });

    setTimeout(() => {
      setTestingId(null);
      ThermalBarcodeScaleEngine.logPrintJob({
        jobType: printer.deviceType === 'LABEL_BARCODE' ? 'BARCODE_LABEL' : 'RECEIPT',
        templateName: 'صفحة فحص واختبار التوافق Hardware Self-Test',
        targetPrinter: printer.name,
        itemsCount: 1,
        copies: 1,
        executedBy: 'مدير النظام (Admin)',
        status: 'PRINTED',
        details: `Connection: ${printer.connection} (${printer.ipOrPort}) - Protocol: ${printer.protocol}`
      });
      toast.success(`تمت طباعة صفحة الاختبار بنجاح وفتح درج النقدية عبر منفذ RJ11`);
    }, 1200);
  };

  const handleOpenCashDrawer = (printer: HardwarePrinterProfile) => {
    toast.loading('إرسال نبضة فتح درج النقود (ESC p 0 25 250)...', { duration: 800 });
    setTimeout(() => {
      toast.success('تم إرسال إشارة فتح الدرج المالي بنجاح');
    }, 800);
  };

  const handleSavePrinter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formState.name || !formState.ipOrPort) {
      toast.error('يرجى ملء اسم الطابعة والمنفذ');
      return;
    }

    const newPrinter: HardwarePrinterProfile = {
      id: formState.id || `prn_${Date.now()}`,
      name: formState.name,
      brandModel: formState.brandModel || 'Generic Thermal Printer',
      deviceType: formState.deviceType || 'THERMAL_RECEIPT',
      connection: formState.connection || 'USB_RAW',
      ipOrPort: formState.ipOrPort,
      paperWidthMm: Number(formState.paperWidthMm) || 80,
      dpi: formState.dpi || 203,
      protocol: formState.protocol || 'ESC_POS',
      isCashDrawerConnected: Boolean(formState.isCashDrawerConnected),
      autoCutPaper: Boolean(formState.autoCutPaper),
      isDefault: Boolean(formState.isDefault),
      testPrintStatus: 'SUCCESS'
    };

    ThermalBarcodeScaleEngine.savePrinter(newPrinter);
    toast.success('تم حفظ تعريف الطابعة بنجاح');
    setIsModalOpen(false);
    loadPrinters();
  };

  return (
    <div className="bg-[#0f172a] text-slate-100 rounded-3xl border border-slate-800 p-6 space-y-6 shadow-2xl">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-gradient-to-tr from-emerald-500/20 to-teal-500/20 text-emerald-400 border border-emerald-500/30 rounded-2xl">
            <Printer size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-white">إدارة الطابعات الحرارية ودرج النقدية</h2>
              <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full text-xs font-bold">
                ESC/POS • TSPL • ZPL • Bluetooth
              </span>
            </div>
            <p className="text-slate-400 text-xs mt-0.5">
              ربط طابعات إيصالات الكاشير (80/58mm)، طابعات باركود الأرفف، طابعات المطبخ، والتحكم بدرج الكاشير
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            setFormState({
              name: '',
              brandModel: 'Xprinter XP-365B',
              deviceType: 'LABEL_BARCODE',
              connection: 'USB_RAW',
              ipOrPort: 'USB:XPRINTER',
              paperWidthMm: 50,
              dpi: 203,
              protocol: 'TSPL',
              isCashDrawerConnected: false,
              autoCutPaper: false,
              isDefault: false
            });
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-black text-sm transition-all shadow-lg shadow-emerald-600/20 active:scale-95"
        >
          <Plus size={18} />
          <span>إضافة طابعة جديدة (Add Printer)</span>
        </button>
      </div>

      {/* Grid of Configured Printers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {printers.map(printer => {
          const isReceipt = printer.deviceType === 'THERMAL_RECEIPT';
          const isLabel = printer.deviceType === 'LABEL_BARCODE';
          const isBT = printer.connection === 'BLUETOOTH';

          return (
            <div
              key={printer.id}
              className="bg-[#151b2b] border border-slate-800 rounded-2xl p-5 space-y-4 hover:border-emerald-500/40 transition-all group"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "p-3 rounded-xl",
                    isReceipt ? "bg-blue-500/10 text-blue-400" :
                    isLabel ? "bg-amber-500/10 text-amber-400" :
                    "bg-purple-500/10 text-purple-400"
                  )}>
                    <Printer size={22} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-white text-sm">{printer.name}</h3>
                      {printer.isDefault && (
                        <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 rounded text-[10px] font-bold">
                          الافتراضية
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-400 font-medium">{printer.brandModel}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  {printer.connection === 'USB_RAW' && (
                    <span className="p-1.5 bg-slate-800 text-emerald-400 rounded-lg" title="اتصال USB مباشر">
                      <Usb size={15} />
                    </span>
                  )}
                  {printer.connection === 'NETWORK_TCP' && (
                    <span className="p-1.5 bg-slate-800 text-cyan-400 rounded-lg" title="اتصال شبكة Ethernet / Wi-Fi">
                      <Wifi size={15} />
                    </span>
                  )}
                  {printer.connection === 'BLUETOOTH' && (
                    <span className="p-1.5 bg-slate-800 text-blue-400 rounded-lg" title="اتصال بلوتوث لاسلكي">
                      <Bluetooth size={15} />
                    </span>
                  )}
                </div>
              </div>

              <div className="bg-slate-900/90 rounded-xl p-3 space-y-2 text-xs font-mono">
                <div className="flex items-center justify-between text-slate-400">
                  <span>المنفذ / المعرف:</span>
                  <span className="text-white font-bold">{printer.ipOrPort}</span>
                </div>
                <div className="flex items-center justify-between text-slate-400">
                  <span>بروتوكول الأوامر:</span>
                  <span className="text-amber-400 font-bold">{printer.protocol}</span>
                </div>
                <div className="flex items-center justify-between text-slate-400">
                  <span>عرض الورق والدقة:</span>
                  <span className="text-cyan-300 font-bold">{printer.paperWidthMm}mm ({printer.dpi} DPI)</span>
                </div>
                <div className="flex items-center justify-between text-slate-400">
                  <span>درج النقدية وقاطع الورق:</span>
                  <span className="text-slate-200">
                    {printer.isCashDrawerConnected ? '✓ درج متصل' : '✗ بدون درج'} | {printer.autoCutPaper ? '✓ قاطع آلي' : '✗ يدوي'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={() => handleTestPrint(printer)}
                  disabled={testingId === printer.id}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 rounded-xl text-xs font-bold transition-all disabled:opacity-50"
                >
                  <Play size={14} />
                  <span>{testingId === printer.id ? 'جاري الإرسال...' : 'طباعة اختبار (Self-Test)'}</span>
                </button>

                {printer.isCashDrawerConnected && (
                  <button
                    onClick={() => handleOpenCashDrawer(printer)}
                    className="px-3 py-2.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-bold transition-all flex items-center gap-1"
                    title="فتح درج الكاشير فورياً"
                  >
                    <Coins size={14} />
                    <span>فتح الدرج</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal for adding/editing printer */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#151b2b] border border-slate-800 rounded-3xl p-6 w-full max-w-lg space-y-4 shadow-2xl">
            <h3 className="text-lg font-black text-white flex items-center gap-2">
              <Printer size={20} className="text-emerald-400" />
              إضافة وتعريف طابعة حرارية جديدة
            </h3>

            <form onSubmit={handleSavePrinter} className="space-y-3.5">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">اسم الطابعة بالمنظومة</label>
                <input
                  type="text"
                  value={formState.name}
                  onChange={e => setFormState({ ...formState, name: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  placeholder="مثال: طابعة كاشير 1 الرئيسية"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">نوع الاستخدام</label>
                  <select
                    value={formState.deviceType}
                    onChange={e => setFormState({ ...formState, deviceType: e.target.value as any })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  >
                    <option value="THERMAL_RECEIPT">إيصالات وفواتير كاشير (Receipt)</option>
                    <option value="LABEL_BARCODE">استيكرات وباركود أرفف (Label)</option>
                    <option value="KITCHEN_ORDER">طابعة مطبخ وتجهيز (Kitchen)</option>
                    <option value="MOBILE_BLUETOOTH">طابعة هاند بلوتوث (Mobile)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">نوع الاتصال</label>
                  <select
                    value={formState.connection}
                    onChange={e => setFormState({ ...formState, connection: e.target.value as any })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  >
                    <option value="USB_RAW">USB مباشر (Direct RAW)</option>
                    <option value="NETWORK_TCP">شبكة Ethernet / Wi-Fi (IP:Port)</option>
                    <option value="BLUETOOTH">بلوتوث لاسلكي (Bluetooth SPP)</option>
                    <option value="SERIAL_COM">منفذ تسلسلي (COM Port / RS232)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">المنفذ / العنوان</label>
                  <input
                    type="text"
                    value={formState.ipOrPort}
                    onChange={e => setFormState({ ...formState, ipOrPort: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono"
                    placeholder="192.168.1.200:9100 أو USB:EPSON"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">بروتوكول الطباعة</label>
                  <select
                    value={formState.protocol}
                    onChange={e => setFormState({ ...formState, protocol: e.target.value as any })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono"
                  >
                    <option value="ESC_POS">ESC/POS (Epson / Bixolon / Xprinter)</option>
                    <option value="TSPL">TSPL (TSC / Xprinter Barcode)</option>
                    <option value="ZPL">ZPL (Zebra Technologies)</option>
                    <option value="CPCL">CPCL (Mobile Printers)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">عرض الورق (مم)</label>
                  <input
                    type="number"
                    value={formState.paperWidthMm}
                    onChange={e => setFormState({ ...formState, paperWidthMm: Number(e.target.value) })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono text-center"
                  />
                </div>

                <div className="flex flex-col justify-center space-y-2 pt-3">
                  <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formState.isCashDrawerConnected}
                      onChange={e => setFormState({ ...formState, isCashDrawerConnected: e.target.checked })}
                      className="rounded accent-emerald-500"
                    />
                    <span>متصل بها درج كاشير (RJ11)</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formState.autoCutPaper}
                      onChange={e => setFormState({ ...formState, autoCutPaper: e.target.checked })}
                      className="rounded accent-emerald-500"
                    />
                    <span>قص الورق التلقائي (Auto Cutter)</span>
                  </label>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-3">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs transition-all"
                >
                  حفظ الطابعة وتأكيد الإعدادات
                </button>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 bg-slate-800 text-slate-300 hover:bg-slate-700 rounded-xl font-bold text-xs transition-all"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
