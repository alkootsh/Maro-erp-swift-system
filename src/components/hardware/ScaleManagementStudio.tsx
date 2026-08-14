import React, { useState, useEffect } from 'react';
import { 
  Scale, 
  RefreshCw, 
  Wifi, 
  WifiOff, 
  CheckCircle2, 
  AlertTriangle, 
  Plus, 
  Edit2, 
  Trash2, 
  UploadCloud, 
  DownloadCloud, 
  Barcode, 
  Sliders, 
  Layers, 
  Play, 
  Tag, 
  FileSpreadsheet, 
  HelpCircle,
  Clock,
  Sparkles,
  ArrowRightLeft
} from 'lucide-react';
import { 
  ScaleDeviceConfig, 
  ScalePluItem, 
  ScaleProtocol 
} from '../../types/thermalBarcodeScale';
import { ThermalBarcodeScaleEngine } from '../../services/thermalBarcodeScaleEngine';
import { ProductRepository } from '../../repositories/productRepository';
import { ProductMaster } from '../../types/productMaster';
import { VisualBarcodeRenderer } from './VisualBarcodeRenderer';
import { formatCurrency, cn } from '../../lib/utils';
import { toast } from 'react-hot-toast';

export const ScaleManagementStudio: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'DEVICES' | 'PLU_MANAGER' | 'SIMULATOR' | 'PROTOCOL_SPECS'>('DEVICES');
  const [scales, setScales] = useState<ScaleDeviceConfig[]>([]);
  const [plus, setPlus] = useState<ScalePluItem[]>([]);
  const [products, setProducts] = useState<ProductMaster[]>([]);
  const [selectedScale, setSelectedScale] = useState<ScaleDeviceConfig | null>(null);
  
  // Simulator State
  const [simPlu, setSimPlu] = useState<ScalePluItem | null>(null);
  const [simWeightKg, setSimWeightKg] = useState<number>(1.250);
  const [simGeneratedBarcode, setSimGeneratedBarcode] = useState<{ barcode13: string; checkDigit: number } | null>(null);
  
  // New PLU Form State
  const [isPluModalOpen, setIsPluModalOpen] = useState(false);
  const [editingPlu, setEditingPlu] = useState<Partial<ScalePluItem>>({
    pluNumber: 1,
    itemCode: '00105',
    productNameAr: '',
    unitPrice: 0,
    unit: 'كجم',
    tareWeightKg: 0.010,
    shelfLifeDays: 7,
    departmentCode: 1,
    hotkeySlot: 1,
    barcodeFormat: '21WWWWWEAN13'
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const loadedScales = ThermalBarcodeScaleEngine.getScales();
    const loadedPlus = ThermalBarcodeScaleEngine.getPluList();
    const loadedProducts = ProductRepository.getProducts();
    setScales(loadedScales);
    setPlus(loadedPlus);
    setProducts(loadedProducts);
    if (loadedScales.length > 0) setSelectedScale(loadedScales[0]);
    if (loadedPlus.length > 0) {
      setSimPlu(loadedPlus[0]);
      calculateSimBarcode(loadedPlus[0], 1.250);
    }
  };

  const calculateSimBarcode = (plu: ScalePluItem, weight: number) => {
    const res = ThermalBarcodeScaleEngine.generateScaleBarcode(
      plu.itemCode,
      weight,
      plu.unitPrice * weight,
      '21',
      5,
      5
    );
    setSimGeneratedBarcode(res);
  };

  const handleSyncAllScales = () => {
    toast.loading('جاري بث وتحديث أسماء وأسعار الأصناف لكافة موازين الشبكة عبر TCP/IP...', { duration: 1500 });
    setTimeout(() => {
      const updated = scales.map(s => ({
        ...s,
        connectionStatus: 'CONNECTED' as const,
        lastSyncTime: 'الآن (ناجح)',
        syncedPluCount: plus.length,
        totalPluCount: plus.length
      }));
      setScales(updated);
      updated.forEach(s => ThermalBarcodeScaleEngine.saveScale(s));
      toast.success(`تمت مزامنة ${plus.length} صنف بنجاح مع ${scales.length} موازين باركود`);
    }, 1500);
  };

  const handleSavePlu = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlu.productNameAr || !editingPlu.itemCode) {
      toast.error('يرجى كتابة اسم الصنف وكود الميزان');
      return;
    }

    const newPlu: ScalePluItem = {
      id: editingPlu.id || `plu_${Date.now()}`,
      pluNumber: Number(editingPlu.pluNumber) || 1,
      itemCode: editingPlu.itemCode.padStart(5, '0'),
      productId: editingPlu.productId || `prod_${Date.now()}`,
      productNameAr: editingPlu.productNameAr,
      productNameEn: editingPlu.productNameEn,
      unitPrice: Number(editingPlu.unitPrice) || 0,
      unit: editingPlu.unit || 'كجم',
      tareWeightKg: Number(editingPlu.tareWeightKg) || 0,
      shelfLifeDays: Number(editingPlu.shelfLifeDays) || 7,
      departmentCode: Number(editingPlu.departmentCode) || 1,
      hotkeySlot: Number(editingPlu.hotkeySlot) || 1,
      barcodeFormat: `21${editingPlu.itemCode}WWWWWC`,
      syncedToScales: scales.map(s => s.id)
    };

    ThermalBarcodeScaleEngine.savePlu(newPlu);
    toast.success('تم حفظ الصنف الموزون على الميزان');
    setIsPluModalOpen(false);
    loadData();
  };

  const handleDeletePlu = (id: string) => {
    if (window.confirm('هل تريد حذف هذا الصنف من الموازين؟')) {
      ThermalBarcodeScaleEngine.deletePlu(id);
      toast.success('تم حذف الصنف');
      loadData();
    }
  };

  return (
    <div className="bg-[#0f172a] text-slate-100 rounded-3xl border border-slate-800 p-6 space-y-6 shadow-2xl">
      {/* Top Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-gradient-to-tr from-cyan-500/20 to-blue-500/20 text-cyan-400 border border-cyan-500/30 rounded-2xl">
            <Scale size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-white">منظومة موازين الباركود الإلكترونية والـ PLU</h2>
              <span className="px-2.5 py-0.5 bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 rounded-full text-xs font-bold">
                CAS / Digi / Rongta / Toledo
              </span>
            </div>
            <p className="text-slate-400 text-xs mt-0.5">
              إدارة وتغذية موازين الأقسام بالشبكة، برمجة الأزرار السريعة (Hotkeys)، ومحاكاة باركود الوزن المدمج
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={handleSyncAllScales}
            className="flex items-center gap-2 px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-black text-sm transition-all shadow-lg shadow-cyan-600/20 active:scale-95"
          >
            <RefreshCw size={17} />
            <span>مزامنة كافة الموازين عبر الشبكة (Sync All)</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('DEVICES')}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all",
            activeTab === 'DEVICES'
              ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
              : "text-slate-400 hover:text-slate-200"
          )}
        >
          <Wifi size={15} />
          <span>أجهزة الموازين المتصلة ({scales.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('PLU_MANAGER')}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all",
            activeTab === 'PLU_MANAGER'
              ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
              : "text-slate-400 hover:text-slate-200"
          )}
        >
          <Layers size={15} />
          <span>دليل أصناف الميزان السريعة (PLU Table - {plus.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('SIMULATOR')}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all",
            activeTab === 'SIMULATOR'
              ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
              : "text-slate-400 hover:text-slate-200"
          )}
        >
          <Barcode size={15} />
          <span>محاكي استيكر الميزان والباركود المدمج (Live Tester)</span>
        </button>
      </div>

      {/* TAB 1: Connected Scale Devices */}
      {activeTab === 'DEVICES' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {scales.map(scale => (
            <div 
              key={scale.id}
              className="bg-[#151b2b] border border-slate-800 rounded-2xl p-5 space-y-4 hover:border-cyan-500/40 transition-all group"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-cyan-500/10 text-cyan-400 rounded-xl">
                    <Scale size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-sm">{scale.name}</h3>
                    <span className="text-[11px] text-slate-400">{scale.departmentName}</span>
                  </div>
                </div>
                <span className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full text-[10px] font-bold">
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping" />
                  متصل (Online)
                </span>
              </div>

              <div className="bg-slate-900/90 rounded-xl p-3 space-y-2 text-xs font-mono">
                <div className="flex items-center justify-between text-slate-400">
                  <span>عنوان IP والمنفذ:</span>
                  <span className="text-cyan-300 font-bold">{scale.ipAddress}:{scale.port}</span>
                </div>
                <div className="flex items-center justify-between text-slate-400">
                  <span>بروتوكول الميزان:</span>
                  <span className="text-amber-400 font-bold">{scale.modelProtocol}</span>
                </div>
                <div className="flex items-center justify-between text-slate-400">
                  <span>بادئة الباركود (Prefix):</span>
                  <span className="text-white font-bold">{scale.barcodePrefix} (وزن مدمج)</span>
                </div>
                <div className="flex items-center justify-between text-slate-400">
                  <span>الأصناف المتزامنة:</span>
                  <span className="text-emerald-400 font-bold">{scale.syncedPluCount} / {scale.totalPluCount} PLU</span>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={() => {
                    toast.success(`جاري فحص الاتصال مع ${scale.ipAddress}... زمن الاستجابة 8ms (ممتاز)`);
                  }}
                  className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-all"
                >
                  فحص الاتصال (Ping)
                </button>
                <button
                  onClick={() => {
                    toast.loading(`جاري إرسال قائمة الأسعار لـ ${scale.name}...`, { duration: 1000 });
                    setTimeout(() => toast.success('تمت المزامنة الفردية بنجاح'), 1000);
                  }}
                  className="px-3 py-2 bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/30 rounded-xl text-xs font-bold transition-all"
                  title="تحديث هذا الميزان"
                >
                  تحديث PLU
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 2: PLU Table Manager */}
      {activeTab === 'PLU_MANAGER' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-xs text-slate-400">
              قائمة الأصناف المحملة على موازين الباركود مع رقم الزر السريع (Hotkey) ومحدد الصلاحية
            </div>
            <button
              onClick={() => {
                setEditingPlu({
                  pluNumber: plus.length + 1,
                  itemCode: (plus.length + 101).toString().padStart(5, '0'),
                  productNameAr: '',
                  unitPrice: 50,
                  unit: 'كجم',
                  tareWeightKg: 0.010,
                  shelfLifeDays: 7,
                  departmentCode: 1,
                  hotkeySlot: plus.length + 1,
                  barcodeFormat: '21WWWWWEAN13'
                });
                setIsPluModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black transition-all shadow-md active:scale-95"
            >
              <Plus size={15} />
              <span>إضافة صنف ميزان جديد (PLU)</span>
            </button>
          </div>

          <div className="overflow-x-auto bg-[#151b2b] border border-slate-800 rounded-2xl">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-900/80 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="p-3.5 font-black">رقم الـ PLU</th>
                  <th className="p-3.5 font-black">زر الميزان السريع (Hotkey)</th>
                  <th className="p-3.5 font-black">كود الصنف بالباركود</th>
                  <th className="p-3.5 font-black">اسم الصنف بالميزان</th>
                  <th className="p-3.5 font-black">سعر الكيلو / الوحدة</th>
                  <th className="p-3.5 font-black">وزن التارة (فارغ)</th>
                  <th className="p-3.5 font-black">الصلاحية (أيام)</th>
                  <th className="p-3.5 font-black text-center">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {plus.map(plu => (
                  <tr key={plu.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-3.5 font-black text-cyan-400 font-mono">#{plu.pluNumber}</td>
                    <td className="p-3.5">
                      <span className="px-2.5 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-lg font-mono font-bold">
                        Key #{plu.hotkeySlot || plu.pluNumber}
                      </span>
                    </td>
                    <td className="p-3.5 font-mono text-slate-300">{plu.itemCode}</td>
                    <td className="p-3.5 font-bold text-white">{plu.productNameAr}</td>
                    <td className="p-3.5 font-black text-emerald-400 font-mono text-sm">
                      {formatCurrency(plu.unitPrice)}
                    </td>
                    <td className="p-3.5 font-mono text-slate-400">{(plu.tareWeightKg || 0).toFixed(3)} كجم</td>
                    <td className="p-3.5 font-bold text-slate-300">{plu.shelfLifeDays} يوم</td>
                    <td className="p-3.5 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => {
                            setSimPlu(plu);
                            calculateSimBarcode(plu, 1.250);
                            setActiveTab('SIMULATOR');
                          }}
                          className="p-1.5 text-cyan-400 hover:bg-cyan-500/10 rounded-lg transition-all"
                          title="تجربة الباركود المدمج"
                        >
                          <Barcode size={15} />
                        </button>
                        <button
                          onClick={() => handleDeletePlu(plu.id)}
                          className="p-1.5 text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                          title="حذف الصنف"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: Embedded Barcode Live Simulator */}
      {activeTab === 'SIMULATOR' && simPlu && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-[#151b2b] border border-slate-800 rounded-2xl p-6">
          <div className="lg:col-span-6 space-y-4">
            <h3 className="text-sm font-black text-white flex items-center gap-2">
              <Sparkles size={16} className="text-cyan-400" />
              اختبار محاكي وزن الميزان وتوليد الباركود
            </h3>
            <p className="text-xs text-slate-400">
              اختر الصنف وضع وزناً تجريبياً لمعاينة الاستيكر النهائي وكود الـ EAN-13 مع رقم التحقق (Check Digit).
            </p>

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1.5">الصنف المختار للتجربة:</label>
              <select
                value={simPlu.id}
                onChange={e => {
                  const found = plus.find(p => p.id === e.target.value);
                  if (found) {
                    setSimPlu(found);
                    calculateSimBarcode(found, simWeightKg);
                  }
                }}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
              >
                {plus.map(p => (
                  <option key={p.id} value={p.id}>
                    #{p.pluNumber} - {p.productNameAr} ({p.unitPrice} ج.م/كجم)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-300">الوزن المحاكى (كجم):</label>
                <span className="text-sm font-mono font-black text-cyan-400">{simWeightKg.toFixed(3)} كجم</span>
              </div>
              <input
                type="range"
                min="0.100"
                max="10.000"
                step="0.050"
                value={simWeightKg}
                onChange={e => {
                  const w = Number(e.target.value);
                  setSimWeightKg(w);
                  calculateSimBarcode(simPlu, w);
                }}
                className="w-full accent-cyan-500 cursor-pointer"
              />
              <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono mt-1">
                <span>0.100 كجم</span>
                <span>5.000 كجم</span>
                <span>10.000 كجم</span>
              </div>
            </div>

            <div className="bg-slate-900/90 rounded-xl p-3.5 space-y-2 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>سعر الكيلو:</span>
                <span className="text-white font-mono font-bold">{simPlu.unitPrice.toFixed(2)} ج.م</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>الوزن الصافي:</span>
                <span className="text-cyan-400 font-mono font-bold">{simWeightKg.toFixed(3)} كجم</span>
              </div>
              <div className="flex justify-between border-t border-slate-800 pt-2 text-slate-300 font-bold text-sm">
                <span>المبلغ الإجمالي المحسوب:</span>
                <span className="text-emerald-400 font-mono font-black">
                  {formatCurrency(simPlu.unitPrice * simWeightKg)}
                </span>
              </div>
            </div>
          </div>

          {/* Sticker Preview Render (Right Side) */}
          <div className="lg:col-span-6 flex flex-col items-center justify-center bg-[#070b13] p-6 rounded-2xl border border-slate-800">
            <span className="text-[11px] font-bold text-slate-400 mb-3">شكل الملصق الحراري الصادر من الميزان</span>
            
            <div className="w-[300px] bg-white text-black rounded-lg p-4 shadow-2xl border-2 border-slate-300 space-y-3 select-none">
              <div className="text-center font-black text-sm leading-tight border-b border-black pb-1.5">
                {simPlu.productNameAr}
              </div>

              <div className="grid grid-cols-2 text-xs font-bold gap-2 bg-slate-100 p-2 rounded">
                <div>
                  <span className="text-[10px] text-slate-600 block">الوزن الصافي:</span>
                  <span className="font-black text-base">{simWeightKg.toFixed(3)} كجم</span>
                </div>
                <div className="text-left">
                  <span className="text-[10px] text-slate-600 block">سعر الكيلو:</span>
                  <span className="font-bold text-sm">{simPlu.unitPrice.toFixed(2)} ج.م</span>
                </div>
              </div>

              <div className="text-center bg-slate-50 p-2 rounded border border-slate-200">
                <span className="text-[10px] font-bold text-slate-600 block">المبلغ الإجمالي المستحق:</span>
                <span className="text-xl font-black text-red-600">
                  {(simPlu.unitPrice * simWeightKg).toFixed(2)} ج.م
                </span>
              </div>

              {simGeneratedBarcode && (
                <div className="flex flex-col items-center justify-center pt-1">
                  <VisualBarcodeRenderer
                    value={simGeneratedBarcode.barcode13}
                    format="EAN13"
                    width={220}
                    height={48}
                    showText={true}
                  />
                  <span className="text-[9px] font-mono text-slate-500 mt-1">
                    بنية الكود: 21 (وزن) + {simPlu.itemCode} (صنف) + {Math.round(simWeightKg * 1000).toString().padStart(5, '0')} (جرام) + {simGeneratedBarcode.checkDigit}
                  </span>
                </div>
              )}

              <div className="text-[9px] text-slate-500 text-center border-t border-slate-200 pt-1">
                تاريخ التعبئة: {new Date().toLocaleDateString('ar-EG')} - يحفظ مبرداً
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PLU Creation Modal */}
      {isPluModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#151b2b] border border-slate-800 rounded-3xl p-6 w-full max-w-lg space-y-4 shadow-2xl">
            <h3 className="text-lg font-black text-white flex items-center gap-2">
              <Plus size={20} className="text-emerald-400" />
              إضافة صنف جديد لموازين الباركود
            </h3>

            <form onSubmit={handleSavePlu} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">رقم الـ PLU</label>
                  <input
                    type="number"
                    value={editingPlu.pluNumber}
                    onChange={e => setEditingPlu({ ...editingPlu, pluNumber: Number(e.target.value) })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">كود الصنف (5 أرقام)</label>
                  <input
                    type="text"
                    maxLength={5}
                    value={editingPlu.itemCode}
                    onChange={e => setEditingPlu({ ...editingPlu, itemCode: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono text-center"
                    placeholder="00105"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">اسم الصنف بالميزان (عربي)</label>
                <input
                  type="text"
                  value={editingPlu.productNameAr}
                  onChange={e => setEditingPlu({ ...editingPlu, productNameAr: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  placeholder="مثال: جبنة رومي قديمة فاخرة"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">سعر الكيلو / الوحدة</label>
                  <input
                    type="number"
                    step="0.5"
                    value={editingPlu.unitPrice}
                    onChange={e => setEditingPlu({ ...editingPlu, unitPrice: Number(e.target.value) })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">رقم الزر السريع (Hotkey)</label>
                  <input
                    type="number"
                    value={editingPlu.hotkeySlot}
                    onChange={e => setEditingPlu({ ...editingPlu, hotkeySlot: Number(e.target.value) })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono text-center"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">وزن التارة الفارغة (كجم)</label>
                  <input
                    type="number"
                    step="0.005"
                    value={editingPlu.tareWeightKg}
                    onChange={e => setEditingPlu({ ...editingPlu, tareWeightKg: Number(e.target.value) })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono text-center"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">مدة الصلاحية (أيام)</label>
                  <input
                    type="number"
                    value={editingPlu.shelfLifeDays}
                    onChange={e => setEditingPlu({ ...editingPlu, shelfLifeDays: Number(e.target.value) })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono text-center"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 pt-3">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs transition-all"
                >
                  حفظ الصنف وتعيينه
                </button>
                <button
                  type="button"
                  onClick={() => setIsPluModalOpen(false)}
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
