// MARO ERP - Master Pharmacy & Medical Generics, Shelf Guidance & FEFO Engine
// Master Enterprise Modular Protocol v4.0

import React, { useState, useEffect, useRef } from 'react';
import { 
  HeartPulse, 
  Search, 
  Pill, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  DollarSign, 
  FileText,
  ShieldCheck,
  ScanLine,
  Barcode,
  MapPin,
  Calendar,
  Layers,
  ArrowRight,
  Plus,
  Printer,
  Volume2,
  VolumeX,
  AlertTriangle,
  Boxes,
  ThermometerSnowflake,
  ShieldAlert,
  ShoppingCart,
  ChevronRight,
  TrendingDown,
  RefreshCw,
  Info,
  Check,
  X,
  ExternalLink,
  Share2,
  Building2,
  FileCheck2,
  Tag,
  Stethoscope
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { IndustryModuleEngine } from '../../lib/industryModuleEngine';
import { PharmacyDrug, PharmacyDrugBatch, PharmacyAlternativeDrug } from '../../types/industryModules';
import { formatCurrency, cn } from '../../lib/utils';
import { MaroSyncEngine } from '../../lib/maroSyncEngine';

export const PharmacyPage: React.FC = () => {
  const navigate = useNavigate();
  const [drugs, setDrugs] = useState<PharmacyDrug[]>(() => IndustryModuleEngine.getPharmacyDrugs());
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedDrug, setSelectedDrug] = useState<PharmacyDrug | null>(() => {
    const list = IndustryModuleEngine.getPharmacyDrugs();
    return list[0] || null;
  });

  // Filter Category: 'ALL' | 'IN_STOCK' | 'OUT_OF_STOCK' | 'MULTI_BATCH' | 'REFRIGERATED' | 'RX_ONLY'
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'IN_STOCK' | 'OUT_OF_STOCK' | 'MULTI_BATCH' | 'REFRIGERATED' | 'RX_ONLY'>('ALL');
  
  // Barcode Scanner & Audio State
  const [barcodeInput, setBarcodeInput] = useState<string>('');
  const [isAudioEnabled, setIsAudioEnabled] = useState<boolean>(true);
  const [speechStatus, setSpeechStatus] = useState<string>('');
  const [scannerFeedback, setScannerFeedback] = useState<{ message: string; type: 'success' | 'warning' | 'error' } | null>(null);

  // Pharmacist Active Dispense Form
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);
  const [dispenseQuantity, setDispenseQuantity] = useState<number>(1);
  const [dispenseUnit, setDispenseUnit] = useState<'PACK' | 'STRIP'>('PACK');
  const [dispenseSuccessMessage, setDispenseSuccessMessage] = useState<string | null>(null);

  // Modals
  const [isAddDrugModalOpen, setIsAddDrugModalOpen] = useState<boolean>(false);
  const [isDosageLabelModalOpen, setIsDosageLabelModalOpen] = useState<boolean>(false);
  const [isRequisitionModalOpen, setIsRequisitionModalOpen] = useState<boolean>(false);

  // Patient Dosage Form State for Label Printing
  const [patientName, setPatientName] = useState<string>('أحمد عبد الحميد');
  const [patientDosageInstructions, setPatientDosageInstructions] = useState<string>('');
  const [prescribingDoctor, setPrescribingDoctor] = useState<string>('د. طارق السعدني - استشاري الباطنة');

  // Sync selectedBatchId when selectedDrug changes
  useEffect(() => {
    if (selectedDrug && selectedDrug.batches && selectedDrug.batches.length > 0) {
      // Find the recommended FEFO batch, or fallback to first
      const fefoBatch = selectedDrug.batches.find(b => b.isRecommendedFEFO) || selectedDrug.batches[0];
      setSelectedBatchId(fefoBatch.id);
      setPatientDosageInstructions(selectedDrug.dosage);
    } else {
      setSelectedBatchId(null);
      if (selectedDrug) setPatientDosageInstructions(selectedDrug.dosage);
    }
  }, [selectedDrug]);

  // Text-To-Speech Arabic Guidance Synthesizer
  const speakPharmacistGuidance = (drug: PharmacyDrug) => {
    if (!isAudioEnabled || typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    window.speechSynthesis.cancel(); // Stop any pending speech

    let message = '';
    if (drug.stock === 0) {
      const topAlt = drug.detailedAlternatives && drug.detailedAlternatives.length > 0 ? drug.detailedAlternatives[0] : null;
      message = `تنبيه: صنف ${drug.tradeName} غير متوفر حالياً في الصيدلية. `;
      if (topAlt) {
        message += `البديل المتاح فوراً هو ${topAlt.tradeName} بنفس المادة الفعالة، موجود في ${topAlt.shelfLocation}.`;
      }
    } else {
      message = `صنف ${drug.tradeName} متوفر رصيد ${drug.stock} علبة. `;
      if (drug.shelfLocationSummary) {
        message += `الموقع: ${drug.shelfLocationSummary}. `;
      }
      if (drug.batches && drug.batches.length > 1) {
        const fefoBatch = drug.batches.find(b => b.isRecommendedFEFO);
        if (fefoBatch) {
          message += `تنبيه: يوجد تاريخا صلاحية، يُرجى سحب تشغيلة ${fefoBatch.expiryDate} أولاً لتطبيق مبدأ فيفو.`;
        }
      }
    }

    setSpeechStatus(message);
    const utterance = new SpeechSynthesisUtterance(message);
    utterance.lang = 'ar-SA';
    utterance.rate = 0.95;
    utterance.pitch = 1.0;
    window.speechSynthesis.speak(utterance);
  };

  // Barcode / Search handler
  const handleBarcodeOrCodeScan = (codeToSearch: string) => {
    const clean = codeToSearch.trim();
    if (!clean) return;

    // Search by Barcode, SKU, MOH code, or Name
    const found = drugs.find(d => 
      (d.barcode && d.barcode.toLowerCase() === clean.toLowerCase()) ||
      (d.sku && d.sku.toLowerCase() === clean.toLowerCase()) ||
      (d.mohCode && d.mohCode.toLowerCase() === clean.toLowerCase()) ||
      d.tradeName.toLowerCase().includes(clean.toLowerCase())
    );

    if (found) {
      setSelectedDrug(found);
      setScannerFeedback({
        message: `تم العثور على: ${found.tradeName} (${found.stock > 0 ? `متوفر ${found.stock} علبة` : 'غير متوفر / نافذ'})`,
        type: found.stock > 0 ? 'success' : 'warning'
      });
      speakPharmacistGuidance(found);
    } else {
      setScannerFeedback({
        message: `لم يتم العثور على صنف بالباركود/الكود: "${clean}"`,
        type: 'error'
      });
    }

    setBarcodeInput('');
    setTimeout(() => setScannerFeedback(null), 5000);
  };

  // Filter logic
  const filteredDrugs = drugs.filter(d => {
    const matchesSearch = 
      d.tradeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.activeIngredient.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (d.activeIngredientAr && d.activeIngredientAr.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (d.tradeNameEn && d.tradeNameEn.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (d.barcode && d.barcode.includes(searchQuery)) ||
      (d.sku && d.sku.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (d.shelfLocationSummary && d.shelfLocationSummary.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (d.mohCode && d.mohCode.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    if (activeFilter === 'IN_STOCK') return d.stock > 0;
    if (activeFilter === 'OUT_OF_STOCK') return d.stock === 0;
    if (activeFilter === 'MULTI_BATCH') return d.batches && d.batches.length > 1;
    if (activeFilter === 'REFRIGERATED') return d.isRefrigerated === true;
    if (activeFilter === 'RX_ONLY') return d.prescriptionRequired === true;

    return true;
  });

  // Calculate Metrics
  const totalDrugsCount = drugs.length;
  const inStockCount = drugs.filter(d => d.stock > 0).length;
  const outOfStockCount = drugs.filter(d => d.stock === 0).length;
  const multiBatchCount = drugs.filter(d => d.batches && d.batches.length > 1).length;
  const refrigeratedCount = drugs.filter(d => d.isRefrigerated).length;

  // Selected Batch Object
  const currentBatch = selectedDrug?.batches?.find(b => b.id === selectedBatchId) || selectedDrug?.batches?.[0];

  // Dispense Action Handler
  const handleDispenseItem = () => {
    if (!selectedDrug || selectedDrug.stock === 0) return;

    const unitLabel = dispenseUnit === 'PACK' ? 'علبة' : 'شريط';
    setDispenseSuccessMessage(`✓ تم بنجاح إضافة (${dispenseQuantity} ${unitLabel}) من [${selectedDrug.tradeName}] - تشغيلة [${currentBatch?.batchNumber || 'الافتراضية'}] إلى فاتورة الكاشير السريعة.`);
    setTimeout(() => setDispenseSuccessMessage(null), 4000);
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Banner & Pharmacy Live Metrics */}
      <div className="bg-[#151b2b] border border-rose-500/30 rounded-3xl p-6 shadow-2xl relative overflow-hidden flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-r from-rose-500 via-pink-500 to-amber-500"></div>
        
        <div className="flex items-center gap-4">
          <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-2xl shadow-lg shadow-rose-500/10 flex items-center justify-center">
            <HeartPulse size={34} className="animate-pulse text-rose-400" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl md:text-2xl font-black text-white tracking-tight">
                منظومة الصيدليات الذكية، توجيه الرفوف وبدائل المادة الفعالة
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px] font-bold">
                FEFO & Generic Engine v4.0
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              الاستعلام اللحظي عن الأدوية، توجيه مكان الرف والخزانة والدرج، اقتراح البدائل الجاهزة عند النفاذ، وتنبيه سحب أقرب تاريخ انتهاء أولاً (FEFO).
            </p>
          </div>
        </div>

        {/* Quick Actions & Speech Toggle */}
        <div className="flex items-center gap-3 flex-wrap">
          <button
            type="button"
            onClick={() => navigate('/ai-agents')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-lg shadow-emerald-900/30 transition-all hover:scale-105"
            title="فتح وكيل الاستشارة والتشخيص الصيدلاني السريري الذكي"
          >
            <Stethoscope size={16} />
            <span>الوكيل الصيدلاني الذكي (AI Triage)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setIsAudioEnabled(!isAudioEnabled);
              if (selectedDrug) speakPharmacistGuidance(selectedDrug);
            }}
            className={cn(
              "flex items-center gap-2 px-3.5 py-2.5 rounded-2xl border text-xs font-bold transition-all shadow-md",
              isAudioEnabled 
                ? "bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30" 
                : "bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700"
            )}
            title="تفعيل/تعطيل التوجيه الصوتي الآلي للصيدلي"
          >
            {isAudioEnabled ? <Volume2 size={16} className="text-amber-400" /> : <VolumeX size={16} />}
            <span>{isAudioEnabled ? 'المساعد الصوتي: مفعل' : 'المساعد الصوتي: صامت'}</span>
          </button>

          <button
            type="button"
            onClick={() => setIsAddDrugModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white text-xs font-bold shadow-lg shadow-rose-900/30 transition-all"
          >
            <Plus size={16} />
            <span>إضافة دواء جديد</span>
          </button>
        </div>
      </div>

      {/* 2. Pharmacy KPIs Summary Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 text-xs">
        <div className="bg-[#151b2b] border border-[#1e293b] p-4 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-slate-400 text-[11px] font-bold">إجمالي الأدوية المسجلة</p>
            <p className="text-white text-xl font-black mt-1">{totalDrugsCount}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-800/80 text-slate-300 flex items-center justify-center">
            <Boxes size={20} />
          </div>
        </div>

        <div className="bg-[#151b2b] border border-emerald-500/30 p-4 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-emerald-400 text-[11px] font-bold">أدوية متوفرة بالصيدلية</p>
            <p className="text-emerald-400 text-xl font-black mt-1">{inStockCount}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
            <CheckCircle2 size={20} />
          </div>
        </div>

        <div className="bg-[#151b2b] border border-red-500/30 p-4 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-red-400 text-[11px] font-bold">أصناف نافذة (Out of Stock)</p>
            <p className="text-red-400 text-xl font-black mt-1">{outOfStockCount}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-red-500/10 text-red-400 border border-red-500/30 flex items-center justify-center">
            <AlertTriangle size={20} />
          </div>
        </div>

        <div className="bg-[#151b2b] border border-amber-500/30 p-4 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-amber-400 text-[11px] font-bold">أدوية بتواريخ متعددة (FEFO)</p>
            <p className="text-amber-400 text-xl font-black mt-1">{multiBatchCount}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center justify-center">
            <Clock size={20} />
          </div>
        </div>

        <div className="bg-[#151b2b] border border-sky-500/30 p-4 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-sky-400 text-[11px] font-bold">أدوية الثلاجة والتبريد</p>
            <p className="text-sky-400 text-xl font-black mt-1">{refrigeratedCount}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/30 flex items-center justify-center">
            <ThermometerSnowflake size={20} />
          </div>
        </div>
      </div>

      {/* 3. Fast Barcode Scanner & Search Bar */}
      <div className="bg-[#151b2b] border border-[#1e293b] rounded-3xl p-5 shadow-xl space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          {/* Barcode Scanner Direct Input */}
          <div className="md:col-span-4 relative">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <ScanLine className="absolute right-3.5 top-1/2 -translate-y-1/2 text-rose-400 animate-pulse" size={18} />
                <input
                  type="text"
                  placeholder="امسح الباركود بالماسح الضوئي..."
                  value={barcodeInput}
                  onChange={(e) => setBarcodeInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleBarcodeOrCodeScan(barcodeInput);
                    }
                  }}
                  className="w-full pr-11 pl-4 py-3 bg-[#0f172a] border border-rose-500/40 rounded-2xl text-xs text-white placeholder-slate-500 focus:border-rose-400 focus:ring-1 focus:ring-rose-400 outline-none font-mono"
                />
              </div>
              <button
                type="button"
                onClick={() => handleBarcodeOrCodeScan(barcodeInput)}
                className="px-4 py-3 bg-rose-600 hover:bg-rose-500 text-white rounded-2xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-md"
              >
                <Barcode size={16} />
                <span>فحص</span>
              </button>
            </div>
          </div>

          {/* Multi-Parameter Name & Ingredient Search */}
          <div className="md:col-span-8 relative">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="ابحث بالاسم التجاري (عربي/إنجليزي)، المادة الفعالة، كود وزارة الصحة، أو موقع الرف..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pr-11 pl-4 py-3 bg-[#0f172a] border border-[#1e293b] rounded-2xl text-xs text-white placeholder-slate-500 focus:border-rose-500 outline-none"
            />
          </div>
        </div>

        {/* Scanner Live Feedback Alert */}
        {scannerFeedback && (
          <div className={cn(
            "p-3 rounded-2xl text-xs font-bold flex items-center justify-between border animate-in fade-in duration-200",
            scannerFeedback.type === 'success' && "bg-emerald-500/10 border-emerald-500/40 text-emerald-300",
            scannerFeedback.type === 'warning' && "bg-amber-500/10 border-amber-500/40 text-amber-300",
            scannerFeedback.type === 'error' && "bg-red-500/10 border-red-500/40 text-red-300"
          )}>
            <div className="flex items-center gap-2">
              {scannerFeedback.type === 'success' && <CheckCircle2 size={16} />}
              {scannerFeedback.type === 'warning' && <AlertTriangle size={16} />}
              {scannerFeedback.type === 'error' && <AlertCircle size={16} />}
              <span>{scannerFeedback.message}</span>
            </div>
            <button type="button" onClick={() => setScannerFeedback(null)} className="text-slate-400 hover:text-white">
              <X size={14} />
            </button>
          </div>
        )}

        {/* Filter Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          <span className="text-slate-500 text-[11px] font-bold whitespace-nowrap">التصنيف السريع:</span>
          
          <button
            type="button"
            onClick={() => setActiveFilter('ALL')}
            className={cn(
              "px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all border",
              activeFilter === 'ALL'
                ? "bg-rose-500 text-white border-rose-500 shadow-md shadow-rose-900/30"
                : "bg-[#0f172a] text-slate-400 border-slate-800 hover:border-slate-700"
            )}
          >
            كل الأدوية ({drugs.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter('IN_STOCK')}
            className={cn(
              "px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all border flex items-center gap-1.5",
              activeFilter === 'IN_STOCK'
                ? "bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-900/30"
                : "bg-[#0f172a] text-emerald-400 border-emerald-500/20 hover:border-emerald-500/40"
            )}
          >
            <CheckCircle2 size={12} />
            <span>متوفر بالصيدلية ({inStockCount})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter('OUT_OF_STOCK')}
            className={cn(
              "px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all border flex items-center gap-1.5",
              activeFilter === 'OUT_OF_STOCK'
                ? "bg-red-600 text-white border-red-600 shadow-md shadow-red-900/30"
                : "bg-[#0f172a] text-red-400 border-red-500/20 hover:border-red-500/40"
            )}
          >
            <AlertTriangle size={12} />
            <span>🚨 نافذ / رصيد صفر ({outOfStockCount})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter('MULTI_BATCH')}
            className={cn(
              "px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all border flex items-center gap-1.5",
              activeFilter === 'MULTI_BATCH'
                ? "bg-amber-600 text-white border-amber-600 shadow-md shadow-amber-900/30"
                : "bg-[#0f172a] text-amber-400 border-amber-500/20 hover:border-amber-500/40"
            )}
          >
            <Clock size={12} />
            <span>⚠️ تواريخ متعددة (FEFO) ({multiBatchCount})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter('REFRIGERATED')}
            className={cn(
              "px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all border flex items-center gap-1.5",
              activeFilter === 'REFRIGERATED'
                ? "bg-sky-600 text-white border-sky-600 shadow-md shadow-sky-900/30"
                : "bg-[#0f172a] text-sky-400 border-sky-500/20 hover:border-sky-500/40"
            )}
          >
            <ThermometerSnowflake size={12} />
            <span>أدوية الثلاجة ({refrigeratedCount})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter('RX_ONLY')}
            className={cn(
              "px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all border flex items-center gap-1.5",
              activeFilter === 'RX_ONLY'
                ? "bg-purple-600 text-white border-purple-600 shadow-md shadow-purple-900/30"
                : "bg-[#0f172a] text-purple-400 border-purple-500/20 hover:border-purple-500/40"
            )}
          >
            <FileText size={12} />
            <span>روشتة طبية (Rx)</span>
          </button>
        </div>
      </div>

      {/* 4. Main Two-Column View: Drug Selector vs Intelligent Pharmacist Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Drug List Card Catalog (4 Cols) */}
        <div className="lg:col-span-4 bg-[#151b2b] border border-[#1e293b] rounded-3xl p-4 space-y-3 shadow-xl h-fit">
          <div className="flex items-center justify-between pb-2 border-b border-[#1e293b]">
            <h3 className="font-bold text-xs text-slate-300">قائمة الأدوية المفلترة ({filteredDrugs.length})</h3>
            <span className="text-[10px] text-slate-500 font-mono">انقر للاستعلام الفوري</span>
          </div>

          <div className="space-y-2.5 max-h-[720px] overflow-y-auto pr-1">
            {filteredDrugs.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs">
                لا توجد أدوية مطابقة لمعايير البحث الحالية.
              </div>
            ) : (
              filteredDrugs.map(drug => {
                const isSelected = selectedDrug?.id === drug.id;
                const isOutOfStock = drug.stock === 0;
                const hasMultiBatches = drug.batches && drug.batches.length > 1;

                return (
                  <button
                    key={drug.id}
                    type="button"
                    onClick={() => {
                      setSelectedDrug(drug);
                      speakPharmacistGuidance(drug);
                    }}
                    className={cn(
                      "w-full p-3.5 rounded-2xl border text-right transition-all block relative overflow-hidden group",
                      isSelected
                        ? isOutOfStock
                          ? "bg-red-500/10 border-red-500/50 text-white shadow-lg ring-1 ring-red-500/40"
                          : "bg-rose-500/10 border-rose-500/50 text-white shadow-lg ring-1 ring-rose-500/40"
                        : "bg-[#0f172a] border-[#1e293b] text-slate-300 hover:border-slate-700 hover:bg-[#151d33]"
                    )}
                  >
                    {/* Active selection bar */}
                    {isSelected && (
                      <div className={cn(
                        "absolute right-0 top-0 bottom-0 w-1.5",
                        isOutOfStock ? "bg-red-500" : "bg-rose-500"
                      )}></div>
                    )}

                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-bold text-xs text-white group-hover:text-rose-300 transition-colors line-clamp-1">
                          {drug.tradeName}
                        </h4>
                        <p className="text-[10px] text-rose-300/90 font-mono mt-0.5 line-clamp-1">
                          {drug.activeIngredient}
                        </p>
                      </div>

                      <div className="text-left shrink-0">
                        <span className="font-bold text-xs text-emerald-400 font-mono">
                          {formatCurrency(drug.fixedPrice)}
                        </span>
                      </div>
                    </div>

                    {/* Meta Badges */}
                    <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-slate-800/80 text-[10px]">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {isOutOfStock ? (
                          <span className="px-2 py-0.5 rounded-md bg-red-500/20 text-red-400 border border-red-500/30 font-bold flex items-center gap-1">
                            <AlertTriangle size={10} />
                            <span>نافذ (0)</span>
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
                            متوفر: {drug.stock} علبة
                          </span>
                        )}

                        {hasMultiBatches && (
                          <span className="px-1.5 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold flex items-center gap-0.5">
                            <Clock size={10} />
                            <span>{drug.batches.length} تواريخ</span>
                          </span>
                        )}

                        {drug.isRefrigerated && (
                          <span className="px-1.5 py-0.5 rounded-md bg-sky-500/20 text-sky-300 border border-sky-500/30 font-bold flex items-center gap-0.5">
                            <ThermometerSnowflake size={10} />
                            <span>ثلاجة</span>
                          </span>
                        )}
                      </div>

                      <span className="text-slate-400 font-mono text-[9px] flex items-center gap-1">
                        <MapPin size={10} className="text-slate-500" />
                        <span className="truncate max-w-[110px]">{drug.shelfLocationSummary?.split('-')[1] || drug.shelfLocationSummary || 'رف عام'}</span>
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Deep Pharmacist Intelligence Dashboard (8 Cols) */}
        <div className="lg:col-span-8 space-y-6">
          {selectedDrug ? (
            <div className="space-y-6">
              
              {/* 4.1 Master Drug Header & Stock Status Card */}
              <div className={cn(
                "bg-[#151b2b] border rounded-3xl p-6 shadow-xl relative overflow-hidden transition-all",
                selectedDrug.stock === 0 
                  ? "border-red-500/40 shadow-red-950/20" 
                  : "border-rose-500/30"
              )}>
                {/* Top Colored Accent line */}
                <div className={cn(
                  "absolute top-0 right-0 w-full h-1 bg-gradient-to-r",
                  selectedDrug.stock === 0 
                    ? "from-red-600 via-rose-600 to-amber-600" 
                    : "from-rose-500 via-pink-500 to-emerald-500"
                )}></div>

                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 border-b border-[#1e293b] pb-5">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-3 py-1 bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded-full text-xs font-bold flex items-center gap-1">
                        <Pill size={13} />
                        <span>{selectedDrug.pharmaceuticalForm}</span>
                      </span>

                      {selectedDrug.prescriptionRequired ? (
                        <span className="px-2.5 py-1 bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded-full text-xs font-bold flex items-center gap-1">
                          <FileText size={12} />
                          <span>روشتة طبية (Rx Only)</span>
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full text-xs font-bold">
                          صرف مباشر بدون روشتة (OTC)
                        </span>
                      )}

                      {selectedDrug.isRefrigerated && (
                        <span className="px-2.5 py-1 bg-sky-500/20 text-sky-300 border border-sky-500/30 rounded-full text-xs font-bold flex items-center gap-1">
                          <ThermometerSnowflake size={12} />
                          <span>سلسلة تبريد وثلاجة (2°-8°C)</span>
                        </span>
                      )}

                      {selectedDrug.isScheduleDrug && (
                        <span className="px-2.5 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-full text-xs font-bold flex items-center gap-1">
                          <ShieldAlert size={12} />
                          <span>دواء جدول خاضع للرقابة</span>
                        </span>
                      )}
                    </div>

                    <h2 className="text-xl md:text-2xl font-black text-white">{selectedDrug.tradeName}</h2>
                    
                    <div className="text-xs text-slate-300 space-y-1">
                      <p>
                        المادة الفعالة والتركيز: <strong className="text-rose-400 font-bold">{selectedDrug.activeIngredient}</strong>
                        {selectedDrug.activeIngredientAr && <span className="text-slate-400 mr-1">({selectedDrug.activeIngredientAr})</span>}
                      </p>
                      <p className="text-slate-400 text-[11px]">
                        الشركة المصنعة: <strong className="text-slate-200">{selectedDrug.manufacturer || 'شركة دوائية معتمدة'}</strong> | تسجيل الصحة: <strong className="text-slate-200 font-mono">{selectedDrug.mohCode}</strong>
                      </p>
                    </div>
                  </div>

                  {/* Pricing Box */}
                  <div className="text-left md:min-w-[180px] bg-[#0f172a] p-4 rounded-2xl border border-slate-800 space-y-1">
                    <p className="text-[10px] text-slate-400 uppercase font-bold">التسعيرة الجبرية المعتمدة</p>
                    <p className="text-2xl font-black text-emerald-400 font-mono">
                      {formatCurrency(selectedDrug.fixedPrice)}
                    </p>
                    {selectedDrug.pricePerStrip && (
                      <p className="text-[11px] text-slate-400 pt-1 border-t border-slate-800">
                        سعر الشريط المفرد: <strong className="text-amber-400 font-mono">{formatCurrency(selectedDrug.pricePerStrip)}</strong>
                      </p>
                    )}
                  </div>
                </div>

                {/* 4.2 Immediate Stock Existence Status Banner (Crucial Alert) */}
                <div className="mt-5">
                  {selectedDrug.stock === 0 ? (
                    <div className="p-5 rounded-2xl bg-gradient-to-r from-red-950/80 via-red-900/60 to-[#151b2b] border-2 border-red-500/60 text-white shadow-xl space-y-3">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-red-500 text-white flex items-center justify-center font-black animate-bounce">
                            <AlertTriangle size={24} />
                          </div>
                          <div>
                            <h3 className="font-black text-base text-red-200">
                              🚨 تنبيه الصيدلي: هذا الصنف غير متوفر حالياً بالصيدلية (رصيد صفر)
                            </h3>
                            <p className="text-xs text-red-300/90 mt-0.5">
                              تم تفعيل محرك البدائل الدوائية الذكي تلقائياً بالأسفل لاقتراح المثائل المتوفرة فورياً بنفس المادة الفعالة والتركيز.
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => setIsRequisitionModalOpen(true)}
                          className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow-lg transition-all"
                        >
                          طلب توريد عاجل من المخزن / الموزع
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/60 via-emerald-900/40 to-[#0f172a] border border-emerald-500/40 text-white flex items-center justify-between flex-wrap gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center">
                          <CheckCircle2 size={22} />
                        </div>
                        <div>
                          <p className="font-bold text-sm text-emerald-300">
                            ✓ الصنف متوفر في الصيدلية والمخزن الرئيسي
                          </p>
                          <p className="text-xs text-slate-300 mt-0.5">
                            الرصيد الفعلي: <strong className="text-white font-bold">{selectedDrug.stock} علبة كاملة</strong> 
                            {selectedDrug.stripStock ? ` + ${selectedDrug.stripStock} شريط مفكوك` : ''}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => speakPharmacistGuidance(selectedDrug)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 text-xs font-bold transition-all"
                      >
                        <Volume2 size={14} />
                        <span>نطق التوجيه الصوتي</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* 4.3 Exact Shelf, Cabinet & Drawer Location Guide Card */}
              {selectedDrug.shelfLocationDetails ? (
                <div className="bg-[#151b2b] border border-amber-500/30 rounded-3xl p-6 shadow-xl space-y-4 relative overflow-hidden">
                  <div className="flex items-center justify-between border-b border-[#1e293b] pb-3">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-amber-500/20 text-amber-400 rounded-xl border border-amber-500/30">
                        <MapPin size={18} />
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-white">
                          دليل التوجيه المكاني للرف والخزانة والدرج (Shelf & Location Locator)
                        </h3>
                        <p className="text-[11px] text-slate-400">تحديد موقع الدواء الدقيق للوصول السريع بدون تأخير</p>
                      </div>
                    </div>

                    <span className="px-3 py-1 bg-amber-500/10 text-amber-300 border border-amber-500/30 rounded-full text-xs font-bold">
                      {selectedDrug.shelfLocationDetails.storageType}
                    </span>
                  </div>

                  {/* 4-Step Interactive Breadcrumb Location Chain */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="p-3.5 bg-[#0f172a] rounded-2xl border border-slate-800">
                      <p className="text-[10px] text-slate-400 font-bold">1. الممر / الصالة (Zone)</p>
                      <p className="text-xs font-black text-amber-300 mt-1">
                        {selectedDrug.shelfLocationDetails.zone}
                      </p>
                    </div>

                    <div className="p-3.5 bg-[#0f172a] rounded-2xl border border-slate-800">
                      <p className="text-[10px] text-slate-400 font-bold">2. الخزانة / الكابينة (Cabinet)</p>
                      <p className="text-xs font-black text-white mt-1">
                        {selectedDrug.shelfLocationDetails.cabinet}
                      </p>
                    </div>

                    <div className="p-3.5 bg-[#0f172a] rounded-2xl border border-slate-800">
                      <p className="text-[10px] text-slate-400 font-bold">3. رقم الرف (Shelf)</p>
                      <p className="text-xs font-black text-white mt-1">
                        {selectedDrug.shelfLocationDetails.shelfNumber}
                      </p>
                    </div>

                    <div className="p-3.5 bg-[#0f172a] rounded-2xl border border-amber-500/40 bg-amber-500/5">
                      <p className="text-[10px] text-amber-400 font-bold">4. الدرج / الخانة (Drawer)</p>
                      <p className="text-xs font-black text-amber-300 mt-1">
                        {selectedDrug.shelfLocationDetails.drawerOrSlot || 'الخانة الرئيسية'}
                      </p>
                    </div>
                  </div>

                  {/* Visual Path Display */}
                  <div className="p-3 rounded-xl bg-[#0f172a] border border-slate-800 flex items-center justify-between text-xs text-slate-300">
                    <div className="flex items-center gap-2">
                      <span className="text-amber-400 font-bold">المسار الكامل:</span>
                      <span className="font-mono text-slate-200">{selectedDrug.shelfLocationDetails.fullDisplayPath}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => alert(`تم إرسال أمر طباعة استيكر موقع الرف [${selectedDrug.shelfLocationSummary}] إلى طابعة الباركود بنجاح.`)}
                      className="flex items-center gap-1 text-[11px] text-amber-400 hover:text-amber-300 font-bold"
                    >
                      <Printer size={13} />
                      <span>طباعة استيكر الرف</span>
                    </button>
                  </div>
                </div>
              ) : null}

              {/* 4.4 Multi-Batch & FEFO Smart Pick Alert (CRITICAL PHARMACY RULE) */}
              {selectedDrug.batches && selectedDrug.batches.length > 0 && (
                <div className="bg-[#151b2b] border border-[#1e293b] rounded-3xl p-6 shadow-xl space-y-4">
                  <div className="flex items-center justify-between border-b border-[#1e293b] pb-3">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-rose-500/20 text-rose-400 rounded-xl border border-rose-500/30">
                        <Clock size={18} />
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-white">
                          إدارة التشغيلات المتعددة وتوجيه سحب أقرب صلاحية (FEFO Smart Pick Engine)
                        </h3>
                        <p className="text-[11px] text-slate-400">First Expired, First Out - سحب التاريخ الأقرب لمنع الرواكد والتوالف بالصيدلية</p>
                      </div>
                    </div>

                    <span className="px-3 py-1 bg-slate-800 text-slate-300 border border-slate-700 rounded-full text-xs font-bold">
                      عدد التشغيلات: {selectedDrug.batches.length}
                    </span>
                  </div>

                  {/* Highlight Alert if Multiple Batches Exist */}
                  {selectedDrug.batches.length > 1 && (
                    <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-950/80 via-amber-900/40 to-[#0f172a] border-2 border-amber-500/60 text-white space-y-2">
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-xl bg-amber-500 text-slate-950 font-black shrink-0 mt-0.5">
                          <AlertTriangle size={20} />
                        </div>
                        <div>
                          <h4 className="font-black text-sm text-amber-300">
                            ⚠️ تنبيه صيدلاني هام: متوفر من هذا الصنف تاريخا صلاحية (تشغيلتان)!
                          </h4>
                          <p className="text-xs text-slate-200 mt-1 leading-relaxed">
                            يُرجى سحب التاريخ المقارب على الانتهاء أولاً 
                            <strong className="text-amber-300 font-mono mx-1">
                              [{selectedDrug.batches.find(b => b.isRecommendedFEFO)?.batchNumber || selectedDrug.batches[0].batchNumber} - انتهاء: {selectedDrug.batches.find(b => b.isRecommendedFEFO)?.expiryDate || selectedDrug.batches[0].expiryDate}]
                            </strong> 
                            لتفادي خسائر انتهاء الصلاحية على الرفوف.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Batches Detailed Interactive Table */}
                  <div className="space-y-2.5">
                    {selectedDrug.batches.map((batch, index) => {
                      const isSelectedBatch = selectedBatchId === batch.id;

                      return (
                        <div
                          key={batch.id}
                          onClick={() => setSelectedBatchId(batch.id)}
                          className={cn(
                            "p-4 rounded-2xl border transition-all cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4",
                            batch.isRecommendedFEFO
                              ? "bg-amber-500/10 border-amber-500/50 shadow-md ring-1 ring-amber-500/30"
                              : "bg-[#0f172a] border-[#1e293b] hover:border-slate-700",
                            isSelectedBatch && "ring-2 ring-rose-500"
                          )}
                        >
                          <div className="flex items-center gap-3.5">
                            <div className={cn(
                              "w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0",
                              batch.isRecommendedFEFO
                                ? "bg-amber-500 text-slate-950"
                                : "bg-slate-800 text-slate-400"
                            )}>
                              {index + 1}
                            </div>

                            <div className="space-y-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-mono font-bold text-xs text-white">
                                  رقم التشغيلة: {batch.batchNumber}
                                </span>
                                
                                {batch.isRecommendedFEFO && (
                                  <span className="px-2.5 py-0.5 rounded-full bg-amber-500 text-slate-950 text-[10px] font-black animate-pulse flex items-center gap-1">
                                    <Sparkles size={11} />
                                    <span>🎯 اسحب هذه التشغيلة أولاً (FEFO Priority)</span>
                                  </span>
                                )}

                                {batch.isNearExpiry && (
                                  <span className="px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/30 text-[10px] font-bold">
                                    قريب الانتهاء
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-4 text-xs text-slate-400 flex-wrap">
                                <span>تاريخ الانتهاء: <strong className="text-emerald-400 font-mono">{batch.expiryDate}</strong></span>
                                <span>الكمية المتاحة: <strong className="text-white font-bold">{batch.quantity} علبة</strong></span>
                                {batch.supplierName && <span>المورد: <strong className="text-slate-300">{batch.supplierName}</strong></span>}
                              </div>

                              {batch.notes && (
                                <p className="text-[11px] text-amber-300/80 italic">{batch.notes}</p>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedBatchId(batch.id);
                                handleDispenseItem();
                              }}
                              className={cn(
                                "px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all",
                                batch.isRecommendedFEFO
                                  ? "bg-amber-500 hover:bg-amber-400 text-slate-950"
                                  : "bg-slate-800 hover:bg-slate-700 text-slate-300"
                              )}
                            >
                              <ShoppingCart size={13} />
                              <span>صرف هذه التشغيلة</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 4.5 Generic Substitutes & In-Stock Alternatives Engine (CRITICAL MEDICAL EQUIVALENTS) */}
              <div className="bg-[#151b2b] border border-rose-500/30 rounded-3xl p-6 shadow-xl space-y-4">
                <div className="flex items-center justify-between border-b border-[#1e293b] pb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-rose-500/20 text-rose-400 rounded-xl border border-rose-500/30">
                      <Sparkles size={18} />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-white">
                        محرك البدائل والمثائل الدوائية المعتمدة (Generic Equivalents Engine)
                      </h3>
                      <p className="text-[11px] text-slate-400">
                        البدائل الصيدلانية المطابقة بنسبة 100% لنفس المادة الفعالة والتركيز مع مقارنة الأسعار وموقع الرف
                      </p>
                    </div>
                  </div>

                  <span className="px-3 py-1 bg-rose-500/10 text-rose-300 border border-rose-500/30 rounded-full text-xs font-bold">
                    {selectedDrug.detailedAlternatives?.length || 0} بدائل متوفرة
                  </span>
                </div>

                {selectedDrug.detailedAlternatives && selectedDrug.detailedAlternatives.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                    {selectedDrug.detailedAlternatives.map((alt) => (
                      <div
                        key={alt.id}
                        className="bg-[#0f172a] border border-[#1e293b] hover:border-rose-500/40 rounded-2xl p-4 space-y-3 transition-all flex flex-col justify-between"
                      >
                        <div className="space-y-2">
                          {/* Badge if available */}
                          {alt.badgeText && (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[9px] font-bold block w-fit">
                              {alt.badgeText}
                            </span>
                          )}

                          <h4 className="font-bold text-xs text-white line-clamp-1">{alt.tradeName}</h4>
                          <p className="text-[10px] text-slate-400 line-clamp-1">المصنع: {alt.manufacturer}</p>

                          <div className="p-2.5 rounded-xl bg-[#151b2b] border border-slate-800 space-y-1 text-[11px]">
                            <div className="flex items-center justify-between">
                              <span className="text-slate-400">السعر الجبري:</span>
                              <span className="font-bold text-emerald-400 font-mono">{formatCurrency(alt.fixedPrice)}</span>
                            </div>

                            <div className="flex items-center justify-between">
                              <span className="text-slate-400">الرصيد بالصيدلية:</span>
                              <span className="font-bold text-white">{alt.stock} علبة ✓</span>
                            </div>

                            <div className="flex items-center justify-between pt-1 border-t border-slate-800 text-[10px]">
                              <span className="text-amber-400 font-bold">موقع الرف:</span>
                              <span className="text-slate-300 font-mono truncate max-w-[130px]">{alt.shelfLocation}</span>
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            // Find if this alternative is in the main list, switch to it
                            const altDrug = drugs.find(d => d.tradeName.includes(alt.tradeName.split(' ')[0]));
                            if (altDrug) {
                              setSelectedDrug(altDrug);
                              speakPharmacistGuidance(altDrug);
                            } else {
                              alert(`تم اختيار البديل: [${alt.tradeName}] بالسعر [${alt.fixedPrice} ج.م] الموجود في [${alt.shelfLocation}].`);
                            }
                          }}
                          className="w-full py-2 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1"
                        >
                          <span>اختيار هذا البديل للمريض</span>
                          <ChevronRight size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-6 text-center text-slate-500 text-xs">
                    لا توجد بدائل مسجلة لهذا الصنف حالياً.
                  </div>
                )}
              </div>

              {/* 4.6 Quick Dispense & Action Operations Bar */}
              <div className="bg-[#151b2b] border border-[#1e293b] rounded-3xl p-5 shadow-xl space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  
                  {/* Dispense Controls */}
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-xs font-bold text-slate-300">الكمية المصروفة:</span>
                    
                    <div className="flex items-center gap-1 bg-[#0f172a] border border-[#1e293b] rounded-2xl p-1">
                      <button
                        type="button"
                        onClick={() => setDispenseQuantity(Math.max(1, dispenseQuantity - 1))}
                        className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-black text-sm flex items-center justify-center"
                      >
                        -
                      </button>
                      <span className="w-10 text-center font-mono font-bold text-white text-xs">{dispenseQuantity}</span>
                      <button
                        type="button"
                        onClick={() => setDispenseQuantity(dispenseQuantity + 1)}
                        className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-black text-sm flex items-center justify-center"
                      >
                        +
                      </button>
                    </div>

                    <div className="flex items-center gap-1 bg-[#0f172a] border border-[#1e293b] rounded-2xl p-1">
                      <button
                        type="button"
                        onClick={() => setDispenseUnit('PACK')}
                        className={cn(
                          "px-3 py-1.5 rounded-xl text-xs font-bold transition-all",
                          dispenseUnit === 'PACK' ? "bg-rose-600 text-white shadow-md" : "text-slate-400 hover:text-white"
                        )}
                      >
                        علبة كاملة
                      </button>
                      <button
                        type="button"
                        onClick={() => setDispenseUnit('STRIP')}
                        className={cn(
                          "px-3 py-1.5 rounded-xl text-xs font-bold transition-all",
                          dispenseUnit === 'STRIP' ? "bg-rose-600 text-white shadow-md" : "text-slate-400 hover:text-white"
                        )}
                      >
                        شريط مفرد ({selectedDrug.pricePerStrip ? `${selectedDrug.pricePerStrip} ج.م` : 'تجزئة'})
                      </button>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => setIsDosageLabelModalOpen(true)}
                      className="px-4 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold flex items-center gap-1.5 transition-all"
                    >
                      <Printer size={15} />
                      <span>طباعة ملصق الجرعة للمريض</span>
                    </button>

                    <button
                      type="button"
                      disabled={selectedDrug.stock === 0}
                      onClick={handleDispenseItem}
                      className={cn(
                        "px-5 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 shadow-lg transition-all",
                        selectedDrug.stock > 0 
                          ? "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-900/30" 
                          : "bg-slate-800 text-slate-600 cursor-not-allowed border border-slate-700"
                      )}
                    >
                      <ShoppingCart size={16} />
                      <span>إرسال لفاتورة الكاشير السريعة</span>
                    </button>
                  </div>
                </div>

                {/* Dispense Toast Notification */}
                {dispenseSuccessMessage && (
                  <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2 animate-in fade-in">
                    <CheckCircle2 size={16} />
                    <span>{dispenseSuccessMessage}</span>
                  </div>
                )}
              </div>

              {/* 4.7 Clinical Notes & Drug Precautions */}
              <div className="bg-[#151b2b] border border-[#1e293b] rounded-3xl p-5 shadow-xl space-y-3 text-xs">
                <div className="flex items-center gap-2 border-b border-[#1e293b] pb-2">
                  <Info size={16} className="text-rose-400" />
                  <h4 className="font-bold text-white">الدليل الإكلينيكي وإرشادات الصيدلي للمريض</h4>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-slate-300">
                  <div className="p-3.5 bg-[#0f172a] rounded-2xl border border-slate-800 space-y-1">
                    <p className="text-[10px] text-emerald-400 font-bold">الجرعة وطريقة الاستخدام المقترحة:</p>
                    <p className="text-xs text-white leading-relaxed">{selectedDrug.dosage}</p>
                  </div>

                  <div className="p-3.5 bg-[#0f172a] rounded-2xl border border-slate-800 space-y-1">
                    <p className="text-[10px] text-amber-400 font-bold">المجموعة العلاجية:</p>
                    <p className="text-xs text-slate-200">{selectedDrug.therapeuticClass || 'أدوية عامة'}</p>
                  </div>
                </div>

                {selectedDrug.contraindications && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-2xl text-[11px] text-red-300 flex items-start gap-2">
                    <AlertTriangle size={15} className="shrink-0 mt-0.5 text-red-400" />
                    <span><strong>موانع الاستعمال والتحذيرات:</strong> {selectedDrug.contraindications}</span>
                  </div>
                )}
              </div>

            </div>
          ) : (
            <div className="bg-[#151b2b] border border-[#1e293b] rounded-3xl p-16 text-center text-slate-500 space-y-3">
              <Pill size={48} className="mx-auto text-slate-600 animate-pulse" />
              <p className="text-sm font-bold text-slate-400">اختر دواء أو امسح الباركود للاستعلام عن المخزون وموقع الرف والتشغيلات والبدائل</p>
            </div>
          )}
        </div>

      </div>

      {/* 5. Modal: Patient Dosage Label Printing */}
      {isDosageLabelModalOpen && selectedDrug && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#151b2b] border border-rose-500/40 rounded-3xl p-6 max-w-lg w-full space-y-5 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-[#1e293b] pb-3">
              <div className="flex items-center gap-2">
                <Printer className="text-rose-400" size={20} />
                <h3 className="font-black text-sm text-white">طباعة ملصق الجرعة والتعليمات للمريض</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsDosageLabelModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            {/* Label Interactive Form */}
            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 font-bold block mb-1">اسم المريض:</label>
                <input
                  type="text"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  className="w-full px-3 py-2 bg-[#0f172a] border border-[#1e293b] rounded-xl text-white outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="text-slate-400 font-bold block mb-1">تعليمات الجرعة وطريقة التناول:</label>
                <textarea
                  rows={2}
                  value={patientDosageInstructions}
                  onChange={(e) => setPatientDosageInstructions(e.target.value)}
                  className="w-full px-3 py-2 bg-[#0f172a] border border-[#1e293b] rounded-xl text-white outline-none focus:border-rose-500 text-xs"
                />
              </div>

              <div>
                <label className="text-slate-400 font-bold block mb-1">الطبيب المعالج / الصيدلي:</label>
                <input
                  type="text"
                  value={prescribingDoctor}
                  onChange={(e) => setPrescribingDoctor(e.target.value)}
                  className="w-full px-3 py-2 bg-[#0f172a] border border-[#1e293b] rounded-xl text-white outline-none focus:border-rose-500"
                />
              </div>
            </div>

            {/* Print Label Thermal Preview */}
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 text-slate-900 font-sans space-y-2 shadow-inner">
              <div className="border-b border-dashed border-slate-400 pb-2 text-center">
                <p className="font-black text-sm">صيدلية MARO المركزية ⚕️</p>
                <p className="text-[10px] text-slate-600">خدمة الرعاية الصيدلانية على مدار الساعة</p>
              </div>

              <div className="space-y-1 text-xs">
                <p><strong>المريض:</strong> {patientName}</p>
                <p><strong>الدواء:</strong> {selectedDrug.tradeName}</p>
                <p className="p-2 bg-amber-100/80 rounded-lg font-bold text-slate-900 border border-amber-300 mt-1">
                  الجرعة: {patientDosageInstructions}
                </p>
                <p className="text-[10px] text-slate-600"><strong>تاريخ الصرف:</strong> {new Date().toLocaleDateString('ar-EG')} | <strong>التشغيلة:</strong> {currentBatch?.batchNumber || 'N/A'}</p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsDosageLabelModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={() => {
                  alert(`تم إرسال ملصق الجرعة للمريض [${patientName}] إلى طابعة ملصقات الصيدلية بنجاح.`);
                  setIsDosageLabelModalOpen(false);
                }}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg"
              >
                <Printer size={15} />
                <span>طباعة الملصق الحراري</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. Modal: Quick Purchase Requisition for Out of Stock */}
      {isRequisitionModalOpen && selectedDrug && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#151b2b] border border-red-500/40 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-[#1e293b] pb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="text-red-400" size={20} />
                <h3 className="font-black text-sm text-white">إصدار أمر شراء سريع لصنف نافذ</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsRequisitionModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-[#0f172a] rounded-xl border border-slate-800">
                <p className="text-slate-400 text-[11px]">اسم الدواء المطلوب:</p>
                <p className="text-white font-bold text-sm mt-0.5">{selectedDrug.tradeName}</p>
                <p className="text-rose-400 font-mono text-[10px]">{selectedDrug.activeIngredient}</p>
              </div>

              <div>
                <label className="text-slate-400 font-bold block mb-1">الكمية المطلوبة (علبة):</label>
                <input
                  type="number"
                  defaultValue={50}
                  className="w-full px-3 py-2 bg-[#0f172a] border border-[#1e293b] rounded-xl text-white outline-none focus:border-red-500 font-mono"
                />
              </div>

              <div>
                <label className="text-slate-400 font-bold block mb-1">الموزع المعتمد:</label>
                <select className="w-full px-3 py-2 bg-[#0f172a] border border-[#1e293b] rounded-xl text-white outline-none focus:border-red-500">
                  <option>الشركة المتحدة للصيادلة (UCP)</option>
                  <option>ابن سينا فارما (Ibnsina)</option>
                  <option>فارما أوفرسيز (Pharma Overseas)</option>
                  <option>المخزن الرئيسي للمؤسسة</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsRequisitionModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={() => {
                  alert(`تم بنجاح إصدار طلب شراء فوري لصنف [${selectedDrug.tradeName}] وربطه بموديول المشتريات والموردين.`);
                  setIsRequisitionModalOpen(false);
                }}
                className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold"
              >
                تأكيد إرسال أمر الشراء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. Modal: Add New Pharmacy Drug */}
      {isAddDrugModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#151b2b] border border-rose-500/40 rounded-3xl p-6 max-w-2xl w-full space-y-4 shadow-2xl my-8">
            <div className="flex items-center justify-between border-b border-[#1e293b] pb-3">
              <div className="flex items-center gap-2">
                <Plus className="text-rose-400" size={20} />
                <h3 className="font-black text-sm text-white">إضافة صنف دواء جديد مع توجيه الرف والتشغيلات</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddDrugModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const tradeName = formData.get('tradeName') as string;
                const activeIngredient = formData.get('activeIngredient') as string;
                const fixedPrice = parseFloat(formData.get('fixedPrice') as string) || 50;
                const stock = parseInt(formData.get('stock') as string, 10) || 0;
                const shelf = formData.get('shelfLocation') as string || 'ممر A - رف 1';
                const batchNumber = formData.get('batchNumber') as string || 'LOT-2026-NEW';
                const expiryDate = formData.get('expiryDate') as string || '2027-01-01';

                const newDrug: PharmacyDrug = {
                  id: `drg_${Date.now()}`,
                  tradeName,
                  activeIngredient,
                  dosage: formData.get('dosage') as string || 'قرص بعد الأكل',
                  pharmaceuticalForm: (formData.get('form') as any) || 'أقراص',
                  prescriptionRequired: formData.get('rx') === 'on',
                  isRefrigerated: formData.get('refrigerated') === 'on',
                  mohCode: formData.get('mohCode') as string || `MOH-${Math.floor(Math.random() * 90000 + 10000)}`,
                  fixedPrice,
                  stock,
                  shelfLocationSummary: shelf,
                  shelfLocationDetails: {
                    zone: 'الصالة الرئيسية',
                    cabinet: shelf.split('-')[0] || 'كابينة عامة',
                    shelfNumber: shelf.split('-')[1] || 'رف 1',
                    storageType: formData.get('refrigerated') === 'on' ? 'ثلاجة الأدوية والمصل (2°-8°C)' : 'درجة حرارة الغرفة (15°-25°C)',
                    fullDisplayPath: `صيدلية رئيسية > ${shelf}`
                  },
                  batches: [
                    {
                      id: `b_${Date.now()}`,
                      batchNumber,
                      expiryDate,
                      quantity: stock,
                      isRecommendedFEFO: true,
                      notes: 'التشغيلة الأولى المسجلة'
                    }
                  ],
                  genericAlternatives: [],
                  expiryDate
                };

                IndustryModuleEngine.savePharmacyDrug(newDrug);
                setDrugs(prev => [newDrug, ...prev]);
                setSelectedDrug(newDrug);
                setIsAddDrugModalOpen(false);
                speakPharmacistGuidance(newDrug);
              }}
              className="space-y-4 text-xs"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-bold block mb-1">الاسم التجاري للدواء *</label>
                  <input
                    name="tradeName"
                    required
                    placeholder="مثال: بنادول إكسترا أقراص"
                    className="w-full px-3 py-2 bg-[#0f172a] border border-[#1e293b] rounded-xl text-white outline-none focus:border-rose-500"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-bold block mb-1">المادة الفعالة والتركيز *</label>
                  <input
                    name="activeIngredient"
                    required
                    placeholder="مثال: Paracetamol 500mg"
                    className="w-full px-3 py-2 bg-[#0f172a] border border-[#1e293b] rounded-xl text-white outline-none focus:border-rose-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="text-slate-300 font-bold block mb-1">التسعيرة الجبرية (ج.م) *</label>
                  <input
                    name="fixedPrice"
                    type="number"
                    step="0.5"
                    required
                    defaultValue={45}
                    className="w-full px-3 py-2 bg-[#0f172a] border border-[#1e293b] rounded-xl text-white outline-none focus:border-rose-500 font-mono"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-bold block mb-1">الرصيد الافتتاحي (علب) *</label>
                  <input
                    name="stock"
                    type="number"
                    required
                    defaultValue={30}
                    className="w-full px-3 py-2 bg-[#0f172a] border border-[#1e293b] rounded-xl text-white outline-none focus:border-rose-500 font-mono"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-bold block mb-1">الشكل الصيدلاني</label>
                  <select name="form" className="w-full px-3 py-2 bg-[#0f172a] border border-[#1e293b] rounded-xl text-white outline-none focus:border-rose-500">
                    <option value="أقراص">أقراص</option>
                    <option value="كبسولات">كبسولات</option>
                    <option value="شراب">شراب</option>
                    <option value="حقن">حقن</option>
                    <option value="مرهم">مرهم / كريم</option>
                    <option value="قطرة">قطرة</option>
                    <option value="فوار">فوار</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-bold block mb-1">موقع الرف والخزانة والدرج *</label>
                  <input
                    name="shelfLocation"
                    required
                    placeholder="مثال: ممر A - خزانة C-04 - رف 3 - درج 12"
                    className="w-full px-3 py-2 bg-[#0f172a] border border-[#1e293b] rounded-xl text-white outline-none focus:border-rose-500"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-bold block mb-1">رقم التشغيلة (Batch #) *</label>
                  <input
                    name="batchNumber"
                    required
                    placeholder="مثال: LOT-2026-AUG-99"
                    className="w-full px-3 py-2 bg-[#0f172a] border border-[#1e293b] rounded-xl text-white outline-none focus:border-rose-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-bold block mb-1">تاريخ انتهاء الصلاحية *</label>
                  <input
                    name="expiryDate"
                    type="date"
                    required
                    defaultValue="2027-06-30"
                    className="w-full px-3 py-2 bg-[#0f172a] border border-[#1e293b] rounded-xl text-white outline-none focus:border-rose-500 font-mono"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-bold block mb-1">الجرعة المقترحة</label>
                  <input
                    name="dosage"
                    placeholder="مثال: قرص كل 8 ساعات بعد الأكل"
                    className="w-full px-3 py-2 bg-[#0f172a] border border-[#1e293b] rounded-xl text-white outline-none focus:border-rose-500"
                  />
                </div>
              </div>

              <div className="flex items-center gap-6 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" name="rx" className="rounded text-rose-600 focus:ring-rose-500" />
                  <span className="text-slate-300">يتطلب وصفة طبية (Rx)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" name="refrigerated" className="rounded text-sky-600 focus:ring-sky-500" />
                  <span className="text-slate-300">يحفظ في الثلاجة (2°-8°C)</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddDrugModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-lg"
                >
                  حفظ الدواء بالمنظومة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
