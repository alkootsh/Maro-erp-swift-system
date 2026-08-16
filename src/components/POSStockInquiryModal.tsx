/**
 * @file POSStockInquiryModal.tsx
 * @module المكونات القابلة لإعادة الاستخدام (Reusable Components)
 * @description شاشة ونافذة استعلام سريعة لفحص الأسعار والمخزون في نقطة البيع (POS) عبر الباركود أو الكاميرا أو الاسم.
 */
import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Search, 
  Barcode, 
  Camera, 
  Plus, 
  Tag, 
  Boxes, 
  MapPin, 
  ShoppingCart, 
  Printer, 
  Volume2, 
  VolumeX, 
  AlertTriangle, 
  CheckCircle2, 
  Sparkles,
  Zap,
  RotateCcw
} from 'lucide-react';
import { ProductLookupService } from '../services/productLookupService';
import { PriceCheckProduct } from '../types/industryModules';
import { formatCurrency, cn } from '../lib/utils';
import { usbScannerEngine } from '../services/usbScannerEngine';
import { BarcodeScanner } from './BarcodeScanner';
import { QuickAddProductModal } from './QuickAddProductModal';

interface POSStockInquiryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddToCart?: (product: PriceCheckProduct) => void;
}

export const POSStockInquiryModal: React.FC<POSStockInquiryModalProps> = ({
  isOpen,
  onClose,
  onAddToCart
}) => {
  const [searchInput, setSearchInput] = useState('');
  const [scannedCode, setScannedCode] = useState('');
  const [currentProduct, setCurrentProduct] = useState<PriceCheckProduct | null>(null);
  const [isNotFound, setIsNotFound] = useState(false);
  const [notFoundCode, setNotFoundCode] = useState('');
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [suggestions, setSuggestions] = useState<PriceCheckProduct[]>([]);
  const [isChimeActive, setIsChimeActive] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus input on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
      setIsNotFound(false);
      setSuggestions([]);
    }
  }, [isOpen]);

  // Subscribe to USB Scanner Engine while modal is open
  useEffect(() => {
    if (!isOpen) return;

    const unsubscribe = usbScannerEngine.subscribe((parsed, rawCode) => {
      handleLookup(rawCode);
    });

    return unsubscribe;
  }, [isOpen]);

  // Execute Lookup
  const handleLookup = (codeOrName: string) => {
    const clean = (codeOrName || '').trim();
    if (!clean) return;

    setIsChimeActive(true);
    setTimeout(() => setIsChimeActive(false), 1200);

    const result = ProductLookupService.lookup(clean);
    setScannedCode(clean);
    setSearchInput(clean);

    if (result.found && result.product) {
      setCurrentProduct(result.product);
      setIsNotFound(false);
      setNotFoundCode('');
      setSuggestions([]);

      // Audio feedback
      usbScannerEngine.playBeep('SUCCESS');
      if (isAudioEnabled && 'speechSynthesis' in window) {
        try {
          window.speechSynthesis.cancel();
          const effectivePrice = result.product.hasPromotion && result.product.promoPrice 
            ? result.product.promoPrice 
            : result.product.finalPriceWithTax;
          const msg = new SpeechSynthesisUtterance(`${result.product.nameAr}. السعر: ${effectivePrice} جنيه.`);
          msg.lang = 'ar-SA';
          window.speechSynthesis.speak(msg);
        } catch {
          // ignore
        }
      }
    } else {
      setCurrentProduct(null);
      setIsNotFound(true);
      setNotFoundCode(clean);
      setSuggestions([]);

      // Error feedback
      usbScannerEngine.playBeep('ERROR');
      if (isAudioEnabled && 'speechSynthesis' in window) {
        try {
          window.speechSynthesis.cancel();
          const msg = new SpeechSynthesisUtterance(`عفواً، الصنف غير مسجل بالنظام`);
          msg.lang = 'ar-SA';
          window.speechSynthesis.speak(msg);
        } catch {
          // ignore
        }
      }
    }
  };

  // Handle typing suggestions
  const handleInputChange = (val: string) => {
    setSearchInput(val);
    if (val.trim().length >= 2) {
      const list = ProductLookupService.searchSuggestions(val, 6);
      setSuggestions(list);
    } else {
      setSuggestions([]);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-[110] flex items-center justify-center p-4" dir="rtl">
      <div className="bg-[#0f172a] border border-cyan-500/40 rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-right animate-in fade-in duration-200">
        
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-800 bg-gradient-to-r from-cyan-950/40 via-slate-900 to-slate-900 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-11 h-11 rounded-2xl flex items-center justify-center transition-all",
              isChimeActive ? "bg-cyan-400 text-slate-950 scale-110 shadow-lg shadow-cyan-400/50" : "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
            )}>
              <Barcode size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-white">استعلام سريع عن الأسعار والمخزون (F13 / F14)</h2>
                <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[10px] font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse" />
                  ماسح الباركود نشط
                </span>
              </div>
              <p className="text-xs text-slate-400">
                مرر الباركود بماسح الـ USB أو ابحث بالاسم والـ SKU لفحص السعر والأرصدة فورياً
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsAudioEnabled(!isAudioEnabled)}
              className={cn(
                "p-2 rounded-xl border text-xs font-bold transition-all",
                isAudioEnabled ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/30" : "bg-slate-800 text-slate-400 border-slate-700"
              )}
              title="تشغيل / كتم الصوت الناطق بالسعر"
            >
              {isAudioEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
            </button>
            <button 
              type="button" 
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Search & Trigger Toolbar */}
        <div className="p-4 bg-[#151b2b] border-b border-slate-800 space-y-3">
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              handleLookup(searchInput);
            }} 
            className="flex gap-2 relative"
          >
            <div className="relative flex-1">
              <input
                ref={inputRef}
                type="text"
                value={searchInput}
                onChange={(e) => handleInputChange(e.target.value)}
                placeholder="مرر الباركود أو اكتب اسم الصنف أو SKU..."
                className="w-full pl-10 pr-4 py-3 bg-[#0f172a] border border-cyan-500/40 rounded-2xl text-white font-mono text-sm placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20"
              />
              <Search size={18} className="absolute left-3.5 top-3.5 text-slate-400 pointer-events-none" />
            </div>

            <button
              type="submit"
              className="px-6 py-3 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-black text-xs rounded-2xl flex items-center gap-1.5 transition-all shadow-md shadow-cyan-600/20"
            >
              <span>استعلام</span>
            </button>

            <button
              type="button"
              onClick={() => setIsCameraOpen(true)}
              className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 rounded-2xl text-xs font-bold flex items-center gap-1.5 transition-all"
              title="مسح الباركود باستخدام كاميرا الجهاز"
            >
              <Camera size={16} />
              <span className="hidden sm:inline">مسح بالكاميرا</span>
            </button>
          </form>

          {/* Suggestions Dropdown */}
          {suggestions.length > 0 && (
            <div className="bg-[#0f172a] border border-slate-700 rounded-2xl p-2 space-y-1 max-h-48 overflow-y-auto">
              <p className="text-[10px] text-slate-400 font-bold px-2 py-1">نتائج البحث المقترحة:</p>
              {suggestions.map((sug) => (
                <button
                  key={sug.id}
                  type="button"
                  onClick={() => handleLookup(sug.barcode || sug.sku)}
                  className="w-full px-3 py-2 rounded-xl hover:bg-slate-800/80 text-right flex items-center justify-between text-xs transition-colors"
                >
                  <div>
                    <span className="font-bold text-white">{sug.nameAr}</span>
                    <span className="text-[10px] text-slate-400 mr-2 font-mono">({sug.barcode})</span>
                  </div>
                  <span className="font-mono font-bold text-cyan-400">{formatCurrency(sug.finalPriceWithTax)}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          
          {/* STATE 1: NOT FOUND (الصنف غير مسجل) */}
          {isNotFound && (
            <div className="bg-rose-950/30 border-2 border-rose-500/50 rounded-3xl p-6 sm:p-8 text-center space-y-5 animate-in fade-in zoom-in-95">
              <div className="w-16 h-16 bg-rose-500/20 text-rose-400 border border-rose-500/40 rounded-full flex items-center justify-center mx-auto">
                <AlertTriangle size={32} className="animate-bounce" />
              </div>

              <div className="space-y-2">
                <span className="px-3 py-1 bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded-full text-xs font-black">
                  ⚠️ صنف غير مسجل بدليل الأصناف
                </span>
                <h3 className="text-xl font-black text-white">
                  لم يتم العثور على الصنف صاحب الباركود
                </h3>
                <div className="inline-block bg-[#0f172a] px-4 py-2 rounded-xl border border-rose-500/40 font-mono text-rose-400 font-black text-lg tracking-wider">
                  {notFoundCode}
                </div>
                <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                  هذا الباركود غير معرف في قاعدة بيانات المتجر أو الفروع. يمكنك تسجيله الآن بضغطة زر واحدة لإتاحته فوراً.
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsQuickAddOpen(true)}
                  className="px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs rounded-2xl flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all"
                >
                  <Plus size={18} />
                  <span>تسجيل الصنف الآن (إضافة منتج جديد)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSearchInput('');
                    setIsNotFound(false);
                    inputRef.current?.focus();
                  }}
                  className="px-5 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-2xl flex items-center gap-2 transition-all"
                >
                  <RotateCcw size={16} />
                  <span>مسح صنف آخر</span>
                </button>
              </div>
            </div>
          )}

          {/* STATE 2: PRODUCT FOUND (تم العثور على الصنف) */}
          {currentProduct && !isNotFound && (
            <div className="bg-[#151b2b] border border-cyan-500/30 rounded-3xl p-6 space-y-6 shadow-xl animate-in fade-in">
              <div className="flex flex-col md:flex-row items-start justify-between gap-6">
                
                {/* Product Meta & Names */}
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded bg-slate-800 text-cyan-400 border border-slate-700 text-xs font-mono font-bold">
                      {currentProduct.category}
                    </span>
                    <span className="px-2.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-mono">
                      باركود: {currentProduct.barcode}
                    </span>
                    {currentProduct.shelfLocation && (
                      <span className="px-2.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 text-xs flex items-center gap-1">
                        <MapPin size={12} className="text-emerald-400" />
                        <span>{currentProduct.shelfLocation}</span>
                      </span>
                    )}
                  </div>

                  <h3 className="text-2xl font-black text-white leading-snug">
                    {currentProduct.nameAr}
                  </h3>
                  {currentProduct.nameEn && (
                    <p className="text-xs text-slate-400 font-sans">{currentProduct.nameEn}</p>
                  )}
                </div>

                {/* Price Display Card */}
                <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-4 sm:p-5 min-w-[240px] text-right">
                  <p className="text-xs text-slate-400 font-bold mb-1">
                    {currentProduct.hasPromotion ? 'السعر النهائي بعد الخصم:' : 'سعر المستهلك (شامل الضريبة):'}
                  </p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl sm:text-4xl font-black text-cyan-400 font-mono">
                      {formatCurrency(currentProduct.hasPromotion && currentProduct.promoPrice ? currentProduct.promoPrice : currentProduct.finalPriceWithTax)}
                    </span>
                    <span className="text-xs text-slate-400">/ {currentProduct.unit}</span>
                  </div>

                  {currentProduct.hasPromotion && currentProduct.promoPrice && (
                    <div className="mt-2 pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
                      <span className="text-slate-500 line-through font-mono">{formatCurrency(currentProduct.retailPrice)}</span>
                      <span className="text-rose-400 font-black">خصم {currentProduct.promoDiscountPercent || 15}%</span>
                    </div>
                  )}
                </div>

              </div>

              {/* Stock Levels & Warehouses Breakdown */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-800">
                <div className="bg-[#0f172a] p-3.5 rounded-xl border border-slate-800">
                  <p className="text-xs text-slate-400">الرصيد بالفرع الحالي</p>
                  <p className="text-lg font-black text-emerald-400 font-mono mt-0.5">
                    {currentProduct.stockInCurrentBranch} {currentProduct.unit}
                  </p>
                </div>

                <div className="bg-[#0f172a] p-3.5 rounded-xl border border-slate-800">
                  <p className="text-xs text-slate-400">إجمالي كافة الفروع</p>
                  <p className="text-lg font-black text-sky-400 font-mono mt-0.5">
                    {currentProduct.stockTotalAllBranches} {currentProduct.unit}
                  </p>
                </div>

                <div className="bg-[#0f172a] p-3.5 rounded-xl border border-slate-800">
                  <p className="text-xs text-slate-400">سعر التكلفة (COGS)</p>
                  <p className="text-lg font-black text-slate-300 font-mono mt-0.5">
                    {formatCurrency(currentProduct.costPrice)}
                  </p>
                </div>

                <div className="bg-[#0f172a] p-3.5 rounded-xl border border-slate-800">
                  <p className="text-xs text-slate-400">نقاط الولاء المكتسبة</p>
                  <p className="text-lg font-black text-purple-400 font-mono mt-0.5">
                    +{currentProduct.loyaltyPointsEarned} نقطة
                  </p>
                </div>
              </div>

              {/* Price Tiers (Wholesale, Retail) */}
              {currentProduct.priceLevels && currentProduct.priceLevels.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <Tag size={14} className="text-cyan-400" />
                    <span>مستويات أسعار الكميات والجملة:</span>
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {currentProduct.priceLevels.map((lvl, i) => (
                      <div key={i} className="bg-[#0f172a] p-2.5 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                        <span className="text-slate-300 font-medium">{lvl.levelNameAr}</span>
                        <span className="font-mono font-black text-white">{formatCurrency(lvl.price)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-800">
                <div className="flex items-center gap-2">
                  {onAddToCart && (
                    <button
                      type="button"
                      onClick={() => {
                        onAddToCart(currentProduct);
                        onClose();
                      }}
                      className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all shadow-md shadow-emerald-600/20"
                    >
                      <ShoppingCart size={16} />
                      <span>إضافة لفاتورة الكاشير (POS)</span>
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSearchInput('');
                      setCurrentProduct(null);
                      inputRef.current?.focus();
                    }}
                    className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition-all"
                  >
                    استعلام عن صنف آخر
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STATE 3: INITIAL IDLE STATE */}
          {!currentProduct && !isNotFound && (
            <div className="bg-[#151b2b] border border-slate-800 rounded-3xl p-12 text-center space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center mx-auto">
                <Barcode size={36} className="animate-pulse" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-black text-white">شاشة الاستعلام جاهزة لمسح الباركود</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  وجه ماسح الباركود USB أو البلوتوث نحو أي صنف، أو اكتب الاسم/الكود في شريط البحث أعلاه
                </p>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-[#151b2b] flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={14} className="text-cyan-400" />
            <span>نظام الاستعلام الفوري الموحد - MARO ERP Engine</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold transition-colors"
          >
            إغلاق
          </button>
        </div>

      </div>

      {/* Camera Barcode Scanner Modal */}
      {isCameraOpen && (
        <BarcodeScanner
          onScan={(code) => {
            setIsCameraOpen(false);
            handleLookup(code);
          }}
          onClose={() => setIsCameraOpen(false)}
        />
      )}

      {/* Quick Add Product Modal */}
      <QuickAddProductModal
        isOpen={isQuickAddOpen}
        initialBarcode={notFoundCode}
        onClose={() => setIsQuickAddOpen(false)}
        onProductCreated={(prod) => {
          setCurrentProduct(prod);
          setIsNotFound(false);
        }}
      />
    </div>
  );
};
