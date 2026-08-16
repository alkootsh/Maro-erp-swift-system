/**
 * @file BarcodeLabelDesigner.tsx
 * @module المكونات القابلة لإعادة الاستخدام (Reusable Components)
 * @description ملف جزء من نظام MARO ERP. الوظيفة: BarcodeLabelDesigner.tsx.
 */
import React, { useState } from 'react';
import { 
  Printer, 
  Settings, 
  Trash2, 
  Plus, 
  Edit3, 
  Eye, 
  Copy, 
  CheckCircle2, 
  Move, 
  Layers, 
  Type, 
  Barcode, 
  QrCode, 
  FileText, 
  Sliders,
  Sparkles,
  Maximize2,
  RefreshCw,
  Save,
  Download
} from 'lucide-react';
import { 
  BarcodeLabelTemplate, 
  LabelDesignElement, 
  LabelElementFieldType 
} from '../../types/thermalBarcodeScale';
import { ThermalBarcodeScaleEngine } from '../../services/thermalBarcodeScaleEngine';
import { VisualBarcodeRenderer } from './VisualBarcodeRenderer';
import { formatCurrency, cn } from '../../lib/utils';
import { toast } from 'react-hot-toast';

interface LabelDesignerProps {
  initialTemplate?: BarcodeLabelTemplate;
  onSave?: (tmpl: BarcodeLabelTemplate) => void;
  onClose?: () => void;
}

const AVAILABLE_FIELDS: { type: LabelElementFieldType; labelAr: string; icon: any; defaultSize: number; defaultWeight: 'normal' | 'bold' | 'black' }[] = [
  { type: 'PRODUCT_NAME_AR', labelAr: 'اسم الصنف بالعربي', icon: Type, defaultSize: 11, defaultWeight: 'bold' },
  { type: 'PRODUCT_NAME_EN', labelAr: 'اسم الصنف بالإنجليزية', icon: Type, defaultSize: 9, defaultWeight: 'normal' },
  { type: 'BARCODE_1D', labelAr: 'باركود خطي (EAN/Code128)', icon: Barcode, defaultSize: 8, defaultWeight: 'normal' },
  { type: 'QR_CODE', labelAr: 'رمز الاستجابة السريع QR', icon: QrCode, defaultSize: 8, defaultWeight: 'normal' },
  { type: 'PRICE_RETAIL', labelAr: 'السعر النهائي مع العملة', icon: FileText, defaultSize: 15, defaultWeight: 'black' },
  { type: 'PRICE_BEFORE_DISCOUNT', labelAr: 'السعر قبل الخصم (مشطوب)', icon: FileText, defaultSize: 10, defaultWeight: 'normal' },
  { type: 'UNIT_NAME', labelAr: 'الوحدة (قطعة / كجم)', icon: Layers, defaultSize: 8, defaultWeight: 'bold' },
  { type: 'SHELF_BIN_LOCATION', labelAr: 'موقع الرف والممر (Aisle / Bin)', icon: Move, defaultSize: 7, defaultWeight: 'normal' },
  { type: 'WEIGHT_KG', labelAr: 'الوزن الصافي (كجم)', icon: Sliders, defaultSize: 12, defaultWeight: 'black' },
  { type: 'EXPIRY_DATE', labelAr: 'تاريخ الصلاحية والتعبئة', icon: FileText, defaultSize: 8, defaultWeight: 'normal' },
  { type: 'STATIC_TEXT', labelAr: 'نص مخصص / اسم الشركة', icon: Type, defaultSize: 9, defaultWeight: 'bold' },
  { type: 'ZATCA_QR', labelAr: 'رمز ZATCA المشفر للفوترة', icon: QrCode, defaultSize: 8, defaultWeight: 'normal' }
];

export const BarcodeLabelDesigner: React.FC<LabelDesignerProps> = ({
  initialTemplate,
  onSave,
  onClose
}) => {
  const [template, setTemplate] = useState<BarcodeLabelTemplate>(
    initialTemplate || ThermalBarcodeScaleEngine.getTemplates()[0]
  );
  const [selectedElementId, setSelectedElementId] = useState<string | null>(
    template.elements[0]?.id || null
  );
  const [activeTab, setActiveTab] = useState<'VISUAL' | 'RAW_TSPL' | 'RAW_ZPL' | 'PRINTER_PRESETS'>('VISUAL');

  const [sampleProduct, setSampleProduct] = useState({
    name: 'حليب المراعي كامل الدسم 1 لتر طازج',
    nameEn: 'Almarai Fresh Milk Full Cream 1L',
    barcode: '6223001458921',
    price: 48.50,
    priceBefore: 55.00,
    unit: 'عبوة',
    shelf: 'الممر A3 - رف 2',
    weight: 1.250,
    expiry: '2026-12-31'
  });

  const selectedElement = template.elements.find(e => e.id === selectedElementId);

  const handleUpdateElement = (id: string, updates: Partial<LabelDesignElement>) => {
    const updatedElements = template.elements.map(el => {
      if (el.id === id) {
        return { ...el, ...updates };
      }
      return el;
    });
    setTemplate({ ...template, elements: updatedElements });
  };

  const handleAddElement = (fieldType: LabelElementFieldType) => {
    const fieldDef = AVAILABLE_FIELDS.find(f => f.type === fieldType);
    if (!fieldDef) return;

    const newElement: LabelDesignElement = {
      id: `el_${Date.now()}`,
      type: fieldType,
      labelAr: fieldDef.labelAr,
      xMm: 2,
      yMm: Math.min(template.heightMm - 8, template.elements.length * 4 + 2),
      widthMm: Math.min(template.widthMm - 4, 30),
      heightMm: fieldType === 'BARCODE_1D' || fieldType === 'QR_CODE' ? 12 : 6,
      fontSizePt: fieldDef.defaultSize,
      fontWeight: fieldDef.defaultWeight,
      alignment: 'center',
      isVisible: true,
      staticCustomText: fieldType === 'STATIC_TEXT' ? 'سوبر ماركت MARO' : undefined
    };

    setTemplate({
      ...template,
      elements: [...template.elements, newElement]
    });
    setSelectedElementId(newElement.id);
    toast.success(`تمت إضافة عنصر: ${fieldDef.labelAr}`);
  };

  const handleDeleteElement = (id: string) => {
    const updated = template.elements.filter(e => e.id !== id);
    setTemplate({ ...template, elements: updated });
    if (selectedElementId === id) {
      setSelectedElementId(updated[0]?.id || null);
    }
  };

  const handleSaveTemplate = () => {
    ThermalBarcodeScaleEngine.saveTemplate(template);
    toast.success('تم حفظ وتثبيت قالب الملصق بنجاح');
    if (onSave) onSave(template);
  };

  // Convert mm to preview px (scale factor ~ 6px per mm)
  const scale = 5.8;
  const canvasWidthPx = Math.round(template.widthMm * scale);
  const canvasHeightPx = Math.round(template.heightMm * scale);

  return (
    <div className="bg-[#0f172a] text-slate-100 rounded-3xl border border-slate-800 p-6 space-y-6 shadow-2xl">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-gradient-to-tr from-amber-500/20 to-orange-500/20 text-amber-400 border border-amber-500/30 rounded-2xl">
            <Sparkles size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-white">مصمم بطاقات الباركود والملصقات الحرارية الذكي</h2>
              <span className="px-2.5 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-full text-xs font-bold">
                WYSIWYG Visual Studio
              </span>
            </div>
            <p className="text-slate-400 text-xs mt-0.5">
              تعديل قياسات ومواقع العناصر بالملليمتر وتوليد أوامر الطباعة المباشرة (TSPL / ZPL / ESC-POS)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleSaveTemplate}
            className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-black text-sm transition-all shadow-lg shadow-emerald-600/20 active:scale-95"
          >
            <Save size={18} />
            <span>حفظ القالب والتصميم</span>
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold text-sm transition-all"
            >
              إغلاق
            </button>
          )}
        </div>
      </div>

      {/* Main Designer Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        
        {/* Left Toolbar: Add Elements & Template Specs (3 cols) */}
        <div className="xl:col-span-3 space-y-4">
          <div className="bg-[#151b2b] rounded-2xl border border-slate-800 p-4 space-y-3">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <Sliders size={14} className="text-amber-400" />
              أبعاد الملصق ونوع الورق
            </h3>
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="text-[10px] font-bold text-slate-400 block mb-1">العرض (مم)</label>
                <input
                  type="number"
                  value={template.widthMm}
                  onChange={e => setTemplate({ ...template, widthMm: Number(e.target.value) || 30 })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono text-center"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 block mb-1">الارتفاع (مم)</label>
                <input
                  type="number"
                  value={template.heightMm}
                  onChange={e => setTemplate({ ...template, heightMm: Number(e.target.value) || 20 })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono text-center"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 block mb-1">اسم القالب</label>
              <input
                type="text"
                value={template.nameAr}
                onChange={e => setTemplate({ ...template, nameAr: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
              />
            </div>
          </div>

          {/* Add Elements Panel */}
          <div className="bg-[#151b2b] rounded-2xl border border-slate-800 p-4 space-y-2.5">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <Plus size={14} className="text-emerald-400" />
              إضافة حقول وبيانات للملصق
            </h3>
            <div className="grid grid-cols-1 gap-1.5 max-h-[300px] overflow-y-auto pr-1">
              {AVAILABLE_FIELDS.map(f => {
                const Icon = f.icon;
                return (
                  <button
                    key={f.type}
                    onClick={() => handleAddElement(f.type)}
                    className="flex items-center justify-between px-3 py-2 bg-slate-900/80 hover:bg-slate-800 border border-slate-700/60 hover:border-amber-500/50 rounded-xl text-xs font-bold text-slate-300 transition-all text-right group"
                  >
                    <div className="flex items-center gap-2">
                      <Icon size={14} className="text-amber-400 group-hover:scale-110 transition-transform" />
                      <span>{f.labelAr}</span>
                    </div>
                    <Plus size={13} className="text-slate-500 group-hover:text-emerald-400" />
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Center: Interactive Visual Label Preview (6 cols) */}
        <div className="xl:col-span-6 flex flex-col items-center justify-center bg-[#070b13] border border-slate-800/80 rounded-2xl p-6 relative overflow-hidden min-h-[420px]">
          <div className="absolute top-3 right-4 flex items-center gap-2">
            <span className="text-[11px] font-bold text-slate-500">معاينة تفاعلية حية (1:1 Aspect Ratio)</span>
            <span className="px-2 py-0.5 bg-slate-800 text-slate-400 rounded text-[10px] font-mono">
              {template.widthMm}mm × {template.heightMm}mm
            </span>
          </div>

          {/* Render Physical Sticker Body */}
          <div 
            className="bg-white text-black rounded-lg shadow-2xl relative border-2 border-dashed border-slate-300 transition-all overflow-hidden"
            style={{
              width: `${canvasWidthPx}px`,
              height: `${canvasHeightPx}px`
            }}
          >
            {template.elements.map(element => {
              if (!element.isVisible) return null;
              const isSelected = element.id === selectedElementId;
              const leftPx = Math.round(element.xMm * scale);
              const topPx = Math.round(element.yMm * scale);
              const widthPx = element.widthMm ? Math.round(element.widthMm * scale) : undefined;
              const heightPx = element.heightMm ? Math.round(element.heightMm * scale) : undefined;

              return (
                <div
                  key={element.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedElementId(element.id);
                  }}
                  style={{
                    position: 'absolute',
                    left: `${leftPx}px`,
                    top: `${topPx}px`,
                    width: widthPx ? `${widthPx}px` : 'auto',
                    height: heightPx ? `${heightPx}px` : 'auto',
                    fontSize: `${element.fontSizePt}pt`,
                    fontWeight: element.fontWeight === 'black' ? 900 : element.fontWeight === 'bold' ? 700 : 400,
                    textAlign: element.alignment,
                    cursor: 'pointer'
                  }}
                  className={cn(
                    "p-0.5 rounded transition-all select-none leading-tight",
                    isSelected 
                      ? "ring-2 ring-amber-500 bg-amber-100/60 shadow-md" 
                      : "hover:outline hover:outline-1 hover:outline-blue-400"
                  )}
                >
                  {/* Field Value Rendering */}
                  {element.type === 'PRODUCT_NAME_AR' && (
                    <div className="truncate font-black">{sampleProduct.name}</div>
                  )}

                  {element.type === 'PRODUCT_NAME_EN' && (
                    <div className="truncate font-mono">{sampleProduct.nameEn}</div>
                  )}

                  {element.type === 'PRICE_RETAIL' && (
                    <div className="font-black text-red-600 flex items-baseline justify-center gap-0.5">
                      <span>{sampleProduct.price.toFixed(2)}</span>
                      <span className="text-[8pt] text-slate-700 font-bold">ج.م</span>
                    </div>
                  )}

                  {element.type === 'PRICE_BEFORE_DISCOUNT' && (
                    <div className="line-through text-slate-500 font-bold">
                      {sampleProduct.priceBefore.toFixed(2)} ج.م
                    </div>
                  )}

                  {element.type === 'UNIT_NAME' && (
                    <div className="text-slate-700 font-bold">لكل {sampleProduct.unit}</div>
                  )}

                  {element.type === 'SHELF_BIN_LOCATION' && (
                    <div className="text-slate-600 font-mono text-[8pt]">{sampleProduct.shelf}</div>
                  )}

                  {element.type === 'WEIGHT_KG' && (
                    <div className="font-black text-black">
                      الوزن: {sampleProduct.weight.toFixed(3)} كجم
                    </div>
                  )}

                  {element.type === 'EXPIRY_DATE' && (
                    <div className="text-slate-600 font-mono text-[7pt]">
                      تاريخ الصلاحية: {sampleProduct.expiry}
                    </div>
                  )}

                  {element.type === 'STATIC_TEXT' && (
                    <div className="font-bold">{element.staticCustomText || 'MARO ERP'}</div>
                  )}

                  {element.type === 'BARCODE_1D' && (
                    <VisualBarcodeRenderer
                      value={sampleProduct.barcode}
                      format={element.barcodeFormat || 'CODE128'}
                      width={widthPx ? widthPx - 4 : 120}
                      height={heightPx ? heightPx - 16 : 30}
                      showText={element.includeBarcodeText !== false}
                    />
                  )}

                  {element.type === 'QR_CODE' && (
                    <div className="flex flex-col items-center justify-center p-1 bg-white border border-slate-300 rounded">
                      <QrCode size={heightPx ? heightPx - 4 : 32} className="text-black" />
                    </div>
                  )}

                  {element.type === 'ZATCA_QR' && (
                    <div className="flex flex-col items-center justify-center p-1 bg-white border border-emerald-600 rounded">
                      <QrCode size={heightPx ? heightPx - 4 : 36} className="text-black" />
                      <span className="text-[6pt] font-mono text-emerald-800">ZATCA</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-4 text-center">
            <span className="text-xs text-slate-400">
              انقر على أي عنصر لتعديل إحداثياته (X, Y) والخط وحجم النص في اللوحة الجانبية
            </span>
          </div>
        </div>

        {/* Right: Selected Element Properties Editor (3 cols) */}
        <div className="xl:col-span-3 space-y-4">
          {selectedElement ? (
            <div className="bg-[#151b2b] rounded-2xl border border-slate-800 p-4 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                <div className="flex items-center gap-2">
                  <Edit3 size={15} className="text-amber-400" />
                  <h3 className="text-xs font-black text-white">{selectedElement.labelAr}</h3>
                </div>
                <button
                  onClick={() => handleDeleteElement(selectedElement.id)}
                  className="text-red-400 hover:text-red-300 p-1 rounded-lg hover:bg-red-500/10"
                  title="حذف هذا الحقل"
                >
                  <Trash2 size={15} />
                </button>
              </div>

              {/* Coordinates */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1">الموقع الأفقي X (مم)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={selectedElement.xMm}
                    onChange={e => handleUpdateElement(selectedElement.id, { xMm: Number(e.target.value) || 0 })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono text-center"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1">الموقع الرأسي Y (مم)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={selectedElement.yMm}
                    onChange={e => handleUpdateElement(selectedElement.id, { yMm: Number(e.target.value) || 0 })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono text-center"
                  />
                </div>
              </div>

              {/* Dimensions */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1">العرض (مم)</label>
                  <input
                    type="number"
                    step="1"
                    value={selectedElement.widthMm || ''}
                    onChange={e => handleUpdateElement(selectedElement.id, { widthMm: Number(e.target.value) || undefined })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono text-center"
                    placeholder="تلقائي"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1">الارتفاع (مم)</label>
                  <input
                    type="number"
                    step="1"
                    value={selectedElement.heightMm || ''}
                    onChange={e => handleUpdateElement(selectedElement.id, { heightMm: Number(e.target.value) || undefined })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono text-center"
                    placeholder="تلقائي"
                  />
                </div>
              </div>

              {/* Typography */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1">حجم الخط (Pt)</label>
                  <input
                    type="number"
                    value={selectedElement.fontSizePt}
                    onChange={e => handleUpdateElement(selectedElement.id, { fontSizePt: Number(e.target.value) || 8 })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono text-center"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1">سُمك الخط</label>
                  <select
                    value={selectedElement.fontWeight}
                    onChange={e => handleUpdateElement(selectedElement.id, { fontWeight: e.target.value as any })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white"
                  >
                    <option value="normal">عادي (Normal)</option>
                    <option value="bold">عريض (Bold)</option>
                    <option value="black">سميك جداً (Black)</option>
                  </select>
                </div>
              </div>

              {/* Alignment */}
              <div>
                <label className="text-[10px] font-bold text-slate-400 block mb-1">المحاذاة</label>
                <div className="grid grid-cols-3 gap-1">
                  {(['right', 'center', 'left'] as const).map(align => (
                    <button
                      key={align}
                      onClick={() => handleUpdateElement(selectedElement.id, { alignment: align })}
                      className={cn(
                        "py-1 rounded text-xs font-bold transition-all",
                        selectedElement.alignment === align
                          ? "bg-amber-500 text-slate-950"
                          : "bg-slate-900 text-slate-400 hover:bg-slate-800"
                      )}
                    >
                      {align === 'right' ? 'يمين' : align === 'center' ? 'وسط' : 'يسار'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Text Option */}
              {selectedElement.type === 'STATIC_TEXT' && (
                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1">النص المخصص</label>
                  <input
                    type="text"
                    value={selectedElement.staticCustomText || ''}
                    onChange={e => handleUpdateElement(selectedElement.id, { staticCustomText: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                  />
                </div>
              )}
            </div>
          ) : (
            <div className="bg-[#151b2b] rounded-2xl border border-slate-800 p-6 text-center text-slate-500">
              اختر عنصراً لتعديل خصائصه
            </div>
          )}

          {/* Quick Raw Code View */}
          <div className="bg-[#151b2b] rounded-2xl border border-slate-800 p-4 space-y-2">
            <h4 className="text-xs font-black text-slate-300 flex items-center justify-between">
              <span>كود الطابعات المباشر (TSPL / ZPL)</span>
              <span className="text-[10px] text-amber-400">Generated Code</span>
            </h4>
            <pre className="bg-slate-950 p-2.5 rounded-xl font-mono text-[10px] text-emerald-400 max-h-36 overflow-auto dir-ltr">
              {ThermalBarcodeScaleEngine.generateTsplCommand(template, sampleProduct)}
            </pre>
          </div>
        </div>

      </div>
    </div>
  );
};
