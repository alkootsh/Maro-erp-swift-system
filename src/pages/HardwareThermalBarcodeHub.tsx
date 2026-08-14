import React, { useState, useEffect } from 'react';
import { 
  Printer, 
  Barcode, 
  Scale, 
  Usb, 
  Sliders, 
  Sparkles, 
  Layers, 
  History, 
  FileText, 
  Plus, 
  CheckCircle2, 
  Eye, 
  Edit3, 
  Copy, 
  DownloadCloud, 
  Wifi, 
  Settings,
  Activity,
  Play,
  RotateCcw,
  Trash2
} from 'lucide-react';
import { BarcodeLabelTemplate, PrintJobLog } from '../types/thermalBarcodeScale';
import { ThermalBarcodeScaleEngine } from '../services/thermalBarcodeScaleEngine';
import { BarcodeLabelDesigner } from '../components/hardware/BarcodeLabelDesigner';
import { ScaleManagementStudio } from '../components/hardware/ScaleManagementStudio';
import { ThermalPrinterHardwareCenter } from '../components/hardware/ThermalPrinterHardwareCenter';
import { USBScannerModal } from '../components/USBBarcodeScannerManager';
import { VisualBarcodeRenderer } from '../components/hardware/VisualBarcodeRenderer';
import { cn } from '../lib/utils';
import { toast } from 'react-hot-toast';

export const HardwareThermalBarcodeHub: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'TEMPLATES' | 'DESIGNER' | 'SCALES' | 'PRINTERS' | 'SCANNER' | 'LOGS'>('TEMPLATES');
  const [templates, setTemplates] = useState<BarcodeLabelTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<BarcodeLabelTemplate | null>(null);
  const [isScannerModalOpen, setIsScannerModalOpen] = useState(false);
  const [printLogs, setPrintLogs] = useState<PrintJobLog[]>([]);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = () => {
    const tmpls = ThermalBarcodeScaleEngine.getTemplates();
    setTemplates(tmpls);
    setPrintLogs(ThermalBarcodeScaleEngine.getPrintLogs());
    if (tmpls.length > 0 && !selectedTemplate) {
      setSelectedTemplate(tmpls[0]);
    }
  };

  const handleCreateNewTemplate = () => {
    const newTmpl: BarcodeLabelTemplate = {
      id: `tmpl_${Date.now()}`,
      code: `TMPL-CUSTOM-${Date.now().toString().slice(-4)}`,
      nameAr: 'قالب ملصق مخصص جديد',
      nameEn: 'Custom Barcode Template',
      category: 'SHELF_EDGE_LABEL',
      widthMm: 50,
      heightMm: 30,
      gapMm: 2,
      targetPrinters: ['Xprinter XP-365B', 'Zebra ZD220'],
      isDefault: false,
      elements: [
        {
          id: 'el_name',
          type: 'PRODUCT_NAME_AR',
          labelAr: 'اسم الصنف',
          xMm: 2,
          yMm: 2,
          widthMm: 46,
          heightMm: 8,
          fontSizePt: 10,
          fontWeight: 'bold',
          alignment: 'center',
          isVisible: true
        },
        {
          id: 'el_barcode',
          type: 'BARCODE_1D',
          labelAr: 'الباركود الخطي',
          xMm: 2,
          yMm: 11,
          widthMm: 30,
          heightMm: 12,
          fontSizePt: 8,
          fontWeight: 'normal',
          alignment: 'center',
          barcodeFormat: 'CODE128',
          includeBarcodeText: true,
          isVisible: true
        },
        {
          id: 'el_price',
          type: 'PRICE_RETAIL',
          labelAr: 'سعر البيع',
          xMm: 33,
          yMm: 12,
          widthMm: 15,
          heightMm: 10,
          fontSizePt: 14,
          fontWeight: 'black',
          alignment: 'center',
          isVisible: true
        }
      ],
      updatedAt: new Date().toISOString()
    };

    ThermalBarcodeScaleEngine.saveTemplate(newTmpl);
    setSelectedTemplate(newTmpl);
    setActiveTab('DESIGNER');
    loadTemplates();
    toast.success('تم إنشاء مسودة قالب جديدة وتجهيز المصمم');
  };

  const handleDuplicateTemplate = (tmpl: BarcodeLabelTemplate) => {
    const dup: BarcodeLabelTemplate = {
      ...tmpl,
      id: `tmpl_${Date.now()}`,
      code: `${tmpl.code}-COPY`,
      nameAr: `${tmpl.nameAr} (نسخة معدلة)`,
      isDefault: false,
      updatedAt: new Date().toISOString()
    };
    ThermalBarcodeScaleEngine.saveTemplate(dup);
    loadTemplates();
    toast.success('تم تكرار القالب بنجاح');
  };

  const handleDeleteTemplate = (id: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذا القالب؟')) {
      ThermalBarcodeScaleEngine.deleteTemplate(id);
      loadTemplates();
      toast.success('تم حذف القالب');
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#0b1329] via-[#111c3a] to-[#0b1329] border border-blue-500/20 rounded-3xl p-6 lg:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-600/20 border border-blue-500/30 text-blue-400 rounded-2xl shadow-inner">
                <Printer size={28} />
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl lg:text-3xl font-black text-white tracking-tight">
                    مركز الطباعة الحرارية والموازين والباركود
                  </h1>
                  <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full text-xs font-black">
                    Hardware Engine v4.0
                  </span>
                </div>
                <p className="text-slate-400 text-sm font-medium mt-1">
                  مصمم القوالب المرئي (WYSIWYG) • إدارة موازين الباركود (PLU Sync) • تعريف الطابعات الحرارية • قارئات الباركود USB/Bluetooth
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={() => setIsScannerModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition-all hover:scale-105 active:scale-95 shadow-md"
            >
              <Usb size={16} className="text-emerald-400" />
              <span>ماسح الباركود USB/BT</span>
            </button>

            <button
              onClick={handleCreateNewTemplate}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-black transition-all hover:scale-105 active:scale-95 shadow-lg shadow-blue-600/20"
            >
              <Plus size={16} />
              <span>تصميم ملصق جديد (New Label)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3 overflow-x-auto">
        {[
          { id: 'TEMPLATES', label: 'نماذج وقوالب الملصقات الجاهزة', icon: Layers, count: templates.length },
          { id: 'DESIGNER', label: 'المصمم المرئي للأبعاد والاستيكرات', icon: Sparkles },
          { id: 'SCALES', label: 'موازين الباركود الإلكترونية والـ PLU', icon: Scale },
          { id: 'PRINTERS', label: 'الطابعات الحرارية ودرج النقدية', icon: Printer },
          { id: 'LOGS', label: 'سجل عمليات الطباعة (Print Logs)', icon: History, count: printLogs.length }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "flex items-center gap-2.5 px-4 py-2.5 rounded-2xl text-xs font-black transition-all whitespace-nowrap",
                isActive
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-600/25"
                  : "bg-slate-900/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 border border-slate-800"
              )}
            >
              <Icon size={16} />
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span className={cn(
                  "px-2 py-0.5 rounded-full text-[10px] font-mono font-bold",
                  isActive ? "bg-white/20 text-white" : "bg-slate-800 text-slate-400"
                )}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* TAB 1: Ready-made Templates Catalog */}
      {activeTab === 'TEMPLATES' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.map(tmpl => {
              const isDefault = tmpl.isDefault;

              return (
                <div
                  key={tmpl.id}
                  className="bg-[#151b2b] border border-slate-800 hover:border-blue-500/40 rounded-3xl p-5 space-y-4 transition-all group shadow-xl flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-black text-white text-base">{tmpl.nameAr}</h3>
                        </div>
                        <span className="text-[11px] text-slate-400 font-mono">{tmpl.nameEn}</span>
                      </div>
                      <span className="px-2.5 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-lg text-xs font-mono font-bold">
                        {tmpl.widthMm} × {tmpl.heightMm} مم
                      </span>
                    </div>

                    {/* Visual Mini Preview Container */}
                    <div className="h-36 bg-white rounded-xl p-3 flex flex-col items-center justify-between border-2 border-dashed border-slate-300 select-none overflow-hidden">
                      <div className="w-full text-center text-black font-black text-xs truncate">
                        جبنة رومي قديمة فاخرة 1 كجم
                      </div>

                      <div className="w-full flex items-center justify-between px-2 text-black">
                        <span className="font-black text-base text-red-600">380.00 ج.م</span>
                        <span className="text-[10px] text-slate-600 font-bold">رف A-02</span>
                      </div>

                      <VisualBarcodeRenderer
                        value="6223001005012"
                        format="EAN13"
                        width={140}
                        height={30}
                        showText={true}
                      />
                    </div>

                    <div className="space-y-1.5 text-xs text-slate-400">
                      <div className="flex items-center justify-between">
                        <span>نوع القالب:</span>
                        <span className="text-slate-200 font-bold">{tmpl.category}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>الطابعات المتوافقة:</span>
                        <span className="text-amber-400 font-mono text-[11px] truncate max-w-[180px]">
                          {tmpl.targetPrinters.join(', ')}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-3 border-t border-slate-800">
                    <button
                      onClick={() => {
                        setSelectedTemplate(tmpl);
                        setActiveTab('DESIGNER');
                      }}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 rounded-xl text-xs font-black transition-all active:scale-95"
                    >
                      <Edit3 size={14} />
                      <span>تعديل التصميم</span>
                    </button>

                    <button
                      onClick={() => handleDuplicateTemplate(tmpl)}
                      className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-all"
                      title="نسخ وتكرار القالب"
                    >
                      <Copy size={15} />
                    </button>

                    {!isDefault && (
                      <button
                        onClick={() => handleDeleteTemplate(tmpl.id)}
                        className="p-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl transition-all"
                        title="حذف القالب"
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: Visual Designer Studio */}
      {activeTab === 'DESIGNER' && (
        <BarcodeLabelDesigner
          initialTemplate={selectedTemplate || templates[0]}
          onSave={(updated) => {
            setSelectedTemplate(updated);
            loadTemplates();
          }}
        />
      )}

      {/* TAB 3: Scales Studio */}
      {activeTab === 'SCALES' && (
        <ScaleManagementStudio />
      )}

      {/* TAB 4: Thermal Printers & Cash Drawer */}
      {activeTab === 'PRINTERS' && (
        <ThermalPrinterHardwareCenter />
      )}

      {/* TAB 5: Print Logs */}
      {activeTab === 'LOGS' && (
        <div className="bg-[#151b2b] border border-slate-800 rounded-3xl p-6 space-y-4 shadow-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-500/10 text-blue-400 rounded-xl">
                <History size={20} />
              </div>
              <div>
                <h3 className="text-base font-black text-white">سجل أوامر الطباعة المباشرة والـ Spooler</h3>
                <p className="text-slate-400 text-xs">تتبع كل استيكر أو إيصال تمت طباعته بالطابعة المسؤولة والمستخدم</p>
              </div>
            </div>

            <button
              onClick={() => {
                setPrintLogs(ThermalBarcodeScaleEngine.getPrintLogs());
                toast.success('تم تحديث السجل');
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold"
            >
              <RotateCcw size={14} />
              <span>تحديث</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-900/80 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="p-3 font-black">الوقت</th>
                  <th className="p-3 font-black">نوع العملية</th>
                  <th className="p-3 font-black">القالب المستخدم</th>
                  <th className="p-3 font-black">الطابعة المستهدفة</th>
                  <th className="p-3 font-black">الكمية</th>
                  <th className="p-3 font-black">المستخدم</th>
                  <th className="p-3 font-black">الحالة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {printLogs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-500 font-sans">
                      لا توجد عمليات طباعة مسجلة حتى الآن
                    </td>
                  </tr>
                ) : (
                  printLogs.map(log => (
                    <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="p-3 text-slate-400">{log.timestamp}</td>
                      <td className="p-3 font-bold text-white font-sans">{log.jobType}</td>
                      <td className="p-3 text-cyan-300 font-sans">{log.templateName}</td>
                      <td className="p-3 text-amber-400">{log.targetPrinter}</td>
                      <td className="p-3 text-white font-bold">{log.copies} نسخة</td>
                      <td className="p-3 text-slate-300 font-sans">{log.executedBy}</td>
                      <td className="p-3">
                        <span className="flex items-center gap-1 text-emerald-400 font-bold font-sans">
                          <CheckCircle2 size={14} />
                          تمت الطباعة
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* USB Scanner Modal */}
      <USBScannerModal
        isOpen={isScannerModalOpen}
        onClose={() => setIsScannerModalOpen(false)}
      />
    </div>
  );
};
