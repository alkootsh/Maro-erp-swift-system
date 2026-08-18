/**
 * @file QuickProductModalOnPurchase.tsx
 * @module المكونات القابلة لإعادة الاستخدام (Purchases Components)
 * @description نافذة فورية فائقة السرعة لإضافة صنف جديد مباشرة من داخل فاتورة المشتريات دون الحاجة لمغادرة الفاتورة أو الذهاب لكارتة الصنف، مع إدراجه فوراً في سطور الفاتورة ووسمه للاستكمال لاحقاً من دليل الأصناف.
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Plus, 
  X, 
  Barcode, 
  Tag, 
  Check, 
  DollarSign, 
  Boxes, 
  Layers, 
  Sparkles, 
  AlertCircle, 
  RefreshCw,
  Clock,
  CheckCircle2,
  CornerDownLeft,
  Info
} from 'lucide-react';
import { ProductRepository } from '../../repositories/productRepository';
import { ProductMaster, ProductCategory } from '../../types/productMaster';
import { formatCurrency, cn } from '../../lib/utils';
import { toast } from 'react-hot-toast';

export interface QuickAddedBillProductResult {
  product: ProductMaster;
  initialQuantity: number;
  unitCost: number;
  unitName: string;
}

interface QuickProductModalOnPurchaseProps {
  isOpen: boolean;
  initialSearchQuery?: string;
  onClose: () => void;
  onProductCreated: (result: QuickAddedBillProductResult) => void;
}

export const QuickProductModalOnPurchase: React.FC<QuickProductModalOnPurchaseProps> = ({
  isOpen,
  initialSearchQuery = '',
  onClose,
  onProductCreated
}) => {
  const [name, setName] = useState('');
  const [barcode, setBarcode] = useState('');
  const [sku, setSku] = useState('');
  const [costPrice, setCostPrice] = useState<number | ''>(0);
  const [salePrice, setSalePrice] = useState<number | ''>(0);
  const [quantity, setQuantity] = useState<number>(1);
  const [unit, setUnit] = useState<string>('قطعة');
  const [category, setCategory] = useState<string>('عام');
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [taxRate, setTaxRate] = useState<number>(14);
  const [status, setStatus] = useState<'active' | 'draft'>('active');
  const [markForLaterCompletion, setMarkForLaterCompletion] = useState<boolean>(true);
  const [notes, setNotes] = useState<string>('صنف مضاف سريعاً من فاتورة المشتريات');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [existingProducts, setExistingProducts] = useState<ProductMaster[]>([]);

  // Refs for sequential keyboard focus
  const nameInputRef = useRef<HTMLInputElement>(null);
  const barcodeInputRef = useRef<HTMLInputElement>(null);
  const costInputRef = useRef<HTMLInputElement>(null);
  const saleInputRef = useRef<HTMLInputElement>(null);
  const qtyInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      // Load current products for duplicate detection
      const allProds = ProductRepository.getProducts();
      setExistingProducts(allProds || []);

      // Load categories
      ProductRepository.subscribeCategories((cats) => {
        setCategories(cats || []);
      });

      // Initialize fields
      const queryTrimmed = initialSearchQuery.trim();
      const isNumBarcode = /^\d{5,14}$/.test(queryTrimmed);
      if (isNumBarcode) {
        setBarcode(queryTrimmed);
        setName('');
        setSku(`SKU-${queryTrimmed.slice(-6)}`);
      } else {
        setName(queryTrimmed);
        generateAutoBarcode();
      }

      // Auto focus name or barcode input
      setTimeout(() => {
        if (isNumBarcode) {
          nameInputRef.current?.focus();
        } else {
          nameInputRef.current?.focus();
          nameInputRef.current?.select();
        }
      }, 50);
    }
  }, [isOpen, initialSearchQuery]);

  const generateAutoBarcode = () => {
    const randomDigits = Math.floor(10000000 + Math.random() * 90000000);
    const autoCode = `622${randomDigits}`;
    setBarcode(autoCode);
    setSku(`SKU-${autoCode.slice(-6)}`);
  };

  // Duplicate Barcode check
  const duplicateBarcodeProduct = useMemo(() => {
    if (!barcode.trim()) return null;
    const cleanBc = barcode.trim();
    return existingProducts.find(p => 
      p.barcode === cleanBc || 
      p.barcodes?.some(b => b.code === cleanBc) ||
      p.units?.some(u => u.barcode === cleanBc || u.additionalBarcodes?.includes(cleanBc))
    ) || null;
  }, [barcode, existingProducts]);

  // Duplicate Name warning
  const duplicateNameProduct = useMemo(() => {
    if (!name.trim() || name.trim().length < 3) return null;
    const cleanName = name.trim().toLowerCase();
    return existingProducts.find(p => p.name.toLowerCase() === cleanName) || null;
  }, [name, existingProducts]);

  // Handle using existing product when barcode is found
  const handleUseExistingProduct = (existing: ProductMaster) => {
    const finalCost = typeof costPrice === 'number' && costPrice > 0 
      ? costPrice 
      : (existing.costPrice || existing.price || 0);
    const finalQty = quantity > 0 ? quantity : 1;

    toast.success(`تم اختيار الصنف الحالي "${existing.name}" وإدراجه في الفاتورة`, { duration: 3500 });
    onProductCreated({
      product: existing,
      initialQuantity: finalQty,
      unitCost: finalCost,
      unitName: existing.units?.[0]?.name || unit
    });
    onClose();
  };

  if (!isOpen) return null;

  const calculatedCost = typeof costPrice === 'number' ? costPrice : 0;
  const calculatedSale = typeof salePrice === 'number' ? salePrice : 0;
  const marginPercent = calculatedCost > 0 
    ? Math.round(((calculatedSale - calculatedCost) / calculatedCost) * 100)
    : 0;

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!name.trim()) {
      toast.error('يرجى إدخال اسم الصنف');
      nameInputRef.current?.focus();
      return;
    }

    const finalBarcode = barcode.trim() || `622${Math.floor(10000000 + Math.random() * 90000000)}`;
    const finalSku = sku.trim() || `SKU-${finalBarcode.slice(-6)}`;
    const finalCost = typeof costPrice === 'number' ? costPrice : 0;
    const finalSale = typeof salePrice === 'number' && salePrice > 0 
      ? salePrice 
      : Math.round(finalCost > 0 ? finalCost * 1.25 : 10);
    const finalQty = quantity > 0 ? quantity : 1;

    setIsSubmitting(true);
    try {
      const nowIso = new Date().toISOString();

      // Find or assign category
      const matchedCat = categories.find(c => c.name === category || c.id === category);
      const catId = matchedCat ? matchedCat.id : 'cat_general';
      const catName = matchedCat ? matchedCat.name : category || 'عام';

      const newProductData: Omit<ProductMaster, 'id'> = {
        name: name.trim(),
        nameArabic: name.trim(),
        nameEnglish: name.trim(),
        sku: finalSku,
        barcode: finalBarcode,
        description: notes || 'صنف مضاف سريعاً من فاتورة المشتريات',
        price: finalSale,
        costPrice: finalCost,
        purchasePrice: finalCost,
        lastPurchasePrice: finalCost,
        quantity: 0, // Stock will be credited when the Purchase Bill is posted/saved
        openingBalance: 0,
        reorderLevel: 5,
        category: catName,
        categoryId: catId,
        status: status,
        needsCompletion: markForLaterCompletion,
        isQuickAdded: true,
        quickAddedFrom: 'BILL',
        isTaxable: taxRate > 0,
        taxIncluded: true,
        taxRate: taxRate,
        allowNegativeStock: true,
        allowFraction: unit === 'كجم' || unit === 'لتر' || unit === 'متر',
        batchTracking: false,
        expiryTracking: false,
        serialNumberTracking: false,
        units: [
          {
            id: `u_${Date.now()}_1`,
            name: unit,
            symbol: unit,
            factor: 1,
            isBaseUnit: true,
            barcode: finalBarcode,
            salePrice: finalSale,
            purchasePrice: finalCost,
            unitLevel: 'smallest'
          }
        ],
        barcodes: [
          {
            id: `bc_${Date.now()}`,
            code: finalBarcode,
            type: 'EAN13',
            isPrimary: true
          }
        ],
        warehouseStocks: [
          {
            warehouseId: 'wh_main',
            warehouseName: 'المستودع الرئيسي',
            quantity: 0
          }
        ],
        priceLists: [
          {
            priceListId: 'pl_retail',
            priceListName: 'قطاعي (سعر المستهلك)',
            price: finalSale,
            minQuantity: 1
          },
          {
            priceListId: 'pl_wholesale',
            priceListName: 'جملة',
            price: Math.round(finalSale * 0.9),
            minQuantity: 3
          }
        ],
        batches: [],
        images: [],
        attachments: [],
        notes: markForLaterCompletion 
          ? `[يحتاج استكمال] تم إنشاؤه سريعاً من فاتورة مشتريات بتاريخ ${new Date().toLocaleDateString('ar-EG')}. يرجى استكمال بيانات المورد والمواصفات لاحقاً.`
          : notes,
        createdAt: nowIso,
        updatedAt: nowIso
      };

      const newId = await ProductRepository.addProduct(newProductData);

      // Audit Logging
      await ProductRepository.logAudit(
        'CREATE',
        'PRODUCTS_QUICK_ADD',
        newId,
        name.trim(),
        {
          source: 'PURCHASE_INVOICE',
          barcode: finalBarcode,
          costPrice: finalCost,
          salePrice: finalSale,
          needsCompletion: markForLaterCompletion
        }
      );

      const createdProduct: ProductMaster = {
        id: newId,
        ...newProductData
      };

      toast.success(
        `تم تسجيل الصنف "${name.trim()}" بنجاح وإدراجه في الفاتورة!`, 
        { duration: 4000 }
      );

      onProductCreated({
        product: createdProduct,
        initialQuantity: finalQty,
        unitCost: finalCost,
        unitName: unit
      });

      onClose();
    } catch (err: any) {
      console.error('Failed to quick add product in purchase bill:', err);
      toast.error('حدث خطأ أثناء حفظ الصنف: ' + (err.message || 'خطأ غير متوقع'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-[70] p-4 animate-in fade-in duration-200"
      onKeyDown={(e) => {
        if ((e.ctrlKey && e.key === 'Enter') || e.key === 'F9') {
          e.preventDefault();
          handleSubmit();
        } else if (e.key === 'Escape') {
          e.preventDefault();
          onClose();
        }
      }}
    >
      <div 
        id="quick-product-on-bill-modal" 
        className="bg-[#151b2b] w-full max-w-2xl rounded-3xl border border-blue-500/30 shadow-2xl shadow-blue-500/10 overflow-hidden flex flex-col max-h-[95vh] text-right"
        dir="rtl"
      >
        {/* Header */}
        <div className="p-5 border-b border-[#1e293b] bg-gradient-to-r from-blue-900/30 via-slate-900/40 to-slate-900/40 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Sparkles size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-lg text-white">إضافة صنف جديد فوري لفاتورة المشتريات</h3>
                <span className="bg-amber-500/20 text-amber-300 text-[10px] px-2 py-0.5 rounded-full font-bold border border-amber-500/30 flex items-center gap-1">
                  <Clock size={11} />
                  استكمال البيانات لاحقاً
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                سجّل البيانات الأساسية الآن ليتم إدراج الصنف مباشرة في الفاتورة، ويمكنك استكمال بطاقته لاحقاً من دليل الأصناف.
              </p>
            </div>
          </div>
          <button 
            type="button" 
            onClick={onClose} 
            className="p-2 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1">
          
          {/* Duplicate Barcode Protection Card */}
          {duplicateBarcodeProduct && (
            <div className="p-4 bg-red-950/40 border border-red-500/50 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-right animate-in fade-in duration-200">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-red-500/20 text-red-300 rounded-xl mt-0.5">
                  <AlertCircle size={18} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">هذا الباركود مرتبط بصنف موجود بالفعل</h4>
                  <p className="text-xs text-red-200 mt-0.5 font-bold">
                    الصنف: <span className="text-white underline">{duplicateBarcodeProduct.name}</span> (كود: {duplicateBarcodeProduct.sku})
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    السعر الحالي: {formatCurrency(duplicateBarcodeProduct.price)} | التكلفة: {formatCurrency(duplicateBarcodeProduct.costPrice || 0)}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleUseExistingProduct(duplicateBarcodeProduct)}
                className="w-full sm:w-auto px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-black transition-all shadow-md active:scale-95 whitespace-nowrap"
              >
                استخدام الصنف الموجود وإدراجه بالفاتورة
              </button>
            </div>
          )}

          {/* Duplicate Name Non-blocking Warning */}
          {duplicateNameProduct && !duplicateBarcodeProduct && (
            <div className="p-3 bg-amber-950/30 border border-amber-500/40 rounded-xl flex items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2 text-amber-300">
                <Info size={16} />
                <span>تنبيه: يوجد صنف بنفس الاسم أو مشابه له ({duplicateNameProduct.name} - {duplicateNameProduct.sku})</span>
              </div>
              <button
                type="button"
                onClick={() => handleUseExistingProduct(duplicateNameProduct)}
                className="text-[11px] text-amber-400 hover:text-white underline font-bold whitespace-nowrap"
              >
                استخدام الصنف السابق
              </button>
            </div>
          )}

          {/* Main Info: Product Name */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Tag size={14} className="text-blue-400" />
                اسم الصنف (مطلوب) *
              </span>
              <span className="text-[11px] text-slate-500 font-mono">الاسم بالعربية أو التجارية</span>
            </label>
            <input 
              ref={nameInputRef}
              type="text" 
              required
              placeholder="مثال: شاي العروسة 250 جم، كابل شاحن Type-C، زيت ذرة..." 
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  costInputRef.current?.focus();
                  costInputRef.current?.select();
                }
              }}
              className="w-full px-4 py-3 bg-[#1e293b] border border-[#334155] rounded-xl text-white font-bold text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all placeholder:text-slate-500"
            />
          </div>

          {/* Barcode & SKU Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Barcode size={14} className="text-amber-400" />
                  الباركود (Barcode)
                </label>
                <button 
                  type="button" 
                  onClick={generateAutoBarcode}
                  className="text-[11px] text-blue-400 hover:text-blue-300 flex items-center gap-1 font-bold"
                >
                  <RefreshCw size={11} />
                  توليد تلقائي
                </button>
              </div>
              <input 
                ref={barcodeInputRef}
                type="text" 
                placeholder="امسح بالماسح الضوئي أو اكتب الباركود" 
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    costInputRef.current?.focus();
                    costInputRef.current?.select();
                  }
                }}
                className="w-full px-3.5 py-2.5 bg-[#1e293b] border border-[#334155] rounded-xl text-white font-mono font-bold text-xs focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Boxes size={14} className="text-emerald-400" />
                كود الصنف الداخلي (SKU)
              </label>
              <input 
                type="text" 
                placeholder="SKU-XXXXXX" 
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#1e293b] border border-[#334155] rounded-xl text-white font-mono text-xs focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Pricing & Quantities Row */}
          <div className="p-4 bg-slate-900/60 rounded-2xl border border-[#1e293b] space-y-4">
            <div className="flex items-center justify-between text-xs text-slate-400 font-bold border-b border-[#1e293b] pb-2">
              <span className="flex items-center gap-1.5 text-white">
                <DollarSign size={15} className="text-emerald-400" />
                التكلفة وأسعار الفاتورة
              </span>
              {calculatedCost > 0 && calculatedSale > 0 && (
                <span className={cn(
                  "px-2 py-0.5 rounded-full text-[11px] font-bold border font-mono",
                  marginPercent >= 15 ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                )}>
                  هامش الربح المتوقع: {marginPercent}%
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  سعر الشراء / التكلفة *
                </label>
                <div className="relative">
                  <input 
                    ref={costInputRef}
                    type="number" 
                    step="any"
                    min="0"
                    placeholder="0.00" 
                    value={costPrice === '' ? '' : costPrice}
                    onChange={(e) => {
                      const val = e.target.value === '' ? '' : parseFloat(e.target.value);
                      setCostPrice(val);
                      if (typeof val === 'number' && (!salePrice || salePrice === 0)) {
                        setSalePrice(+(val * 1.25).toFixed(2));
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        saleInputRef.current?.focus();
                        saleInputRef.current?.select();
                      }
                    }}
                    className="w-full px-3 py-2 bg-[#151b2b] border border-[#334155] rounded-xl text-white font-mono font-black text-sm focus:outline-none focus:border-amber-500"
                  />
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-500 font-bold">ج.م</span>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  سعر البيع المقترح (قطاعي)
                </label>
                <div className="relative">
                  <input 
                    ref={saleInputRef}
                    type="number" 
                    step="any"
                    min="0"
                    placeholder="0.00" 
                    value={salePrice === '' ? '' : salePrice}
                    onChange={(e) => setSalePrice(e.target.value === '' ? '' : parseFloat(e.target.value))}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        qtyInputRef.current?.focus();
                        qtyInputRef.current?.select();
                      }
                    }}
                    className="w-full px-3 py-2 bg-[#151b2b] border border-[#334155] rounded-xl text-white font-mono font-bold text-sm focus:outline-none focus:border-blue-500"
                  />
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-500 font-bold">ج.م</span>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  الكمية في هذه الفاتورة
                </label>
                <input 
                  ref={qtyInputRef}
                  type="number" 
                  step="any"
                  min="0.01"
                  value={quantity}
                  onChange={(e) => setQuantity(parseFloat(e.target.value) || 1)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleSubmit();
                    }
                  }}
                  className="w-full px-3 py-2 bg-[#151b2b] border border-[#334155] rounded-xl text-white font-mono font-bold text-sm focus:outline-none focus:border-emerald-500 text-center"
                />
              </div>
            </div>
          </div>

          {/* Unit & Category */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                وحدة القياس الأساسية (Base Unit) *
              </label>
              <div className="flex gap-2">
                <select
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="flex-1 px-3 py-2.5 bg-[#1e293b] border border-[#334155] rounded-xl text-white font-bold text-xs focus:outline-none focus:border-blue-500"
                >
                  <option value="قطعة">قطعة (Piece)</option>
                  <option value="كرتونة">كرتونة (Carton)</option>
                  <option value="علبة">علبة (Box)</option>
                  <option value="باكت">باكت (Pack)</option>
                  <option value="كجم">كيلوجرام (Kg)</option>
                  <option value="لتر">لتر (Liter)</option>
                  <option value="متر">متر (Meter)</option>
                  <option value="طقم">طقم (Set)</option>
                </select>
                <input 
                  type="text" 
                  placeholder="أو اكتب وحدة..." 
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="w-28 px-3 py-2.5 bg-[#1e293b] border border-[#334155] rounded-xl text-white text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                المجموعة / التصنيف (Category) *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2.5 bg-[#1e293b] border border-[#334155] rounded-xl text-white font-bold text-xs focus:outline-none focus:border-blue-500"
              >
                <option value="عام">عام (General)</option>
                <option value="أغذية ومشروبات">أغذية ومشروبات</option>
                <option value="إلكترونيات">إلكترونيات</option>
                <option value="ملابس وأزياء">ملابس وأزياء</option>
                <option value="أدوية ومستلزمات">أدوية ومستلزمات</option>
                <option value="أدوات ومعدات">أدوات ومعدات</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Tax & Status Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                الضريبة (VAT Tax)
              </label>
              <select
                value={taxRate}
                onChange={(e) => setTaxRate(Number(e.target.value))}
                className="w-full px-3 py-2.5 bg-[#1e293b] border border-[#334155] rounded-xl text-white font-bold text-xs focus:outline-none focus:border-blue-500"
              >
                <option value={14}>ضريبة القيمة المضافة 14% (قياسي)</option>
                <option value={0}>معفى من الضريبة 0%</option>
                <option value={5}>ضريبة مخفضة 5%</option>
                <option value={10}>ضريبة 10%</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                حالة الصنف في النظام (Status)
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as 'active' | 'draft')}
                className="w-full px-3 py-2.5 bg-[#1e293b] border border-[#334155] rounded-xl text-white font-bold text-xs focus:outline-none focus:border-blue-500"
              >
                <option value="active">نشط ومتاح للعمليات (Active)</option>
                <option value="draft">مسودة قيد التجهيز (Draft)</option>
              </select>
            </div>
          </div>

          {/* Tag for Later Completion Toggle Banner */}
          <div className="p-3.5 bg-blue-950/30 border border-blue-800/40 rounded-2xl flex items-start gap-3">
            <input 
              id="mark-for-completion-check"
              type="checkbox" 
              checked={markForLaterCompletion}
              onChange={(e) => setMarkForLaterCompletion(e.target.checked)}
              className="mt-1 w-4 h-4 rounded text-blue-600 bg-slate-900 border-slate-700 focus:ring-blue-500"
            />
            <label htmlFor="mark-for-completion-check" className="cursor-pointer text-xs text-slate-300 leading-relaxed">
              <span className="font-bold text-blue-300 block mb-0.5">
                تحديد الصنف كـ «بانتظار استكمال كارتة الصنف لاحقاً»
              </span>
              سيظهر الصنف في دليل الأصناف بعلامة تمييز خاصة لتنبيه إدارة المخازن والمشتريات لاستكمال بيانات التوكيل، فترات الصلاحية، وحدات الجملة ومواقع الرفوف لاحقاً دون تعطيل الفاتورة الحالية.
            </label>
          </div>

        </form>

        {/* Footer Actions */}
        <div className="p-5 border-t border-[#1e293b] bg-[#0f1422] flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="flex items-center gap-1 font-bold text-slate-300">
              <CornerDownLeft size={13} className="text-amber-400" />
              Ctrl+Enter:
            </span>
            <span>حفظ وإدراج في الفاتورة</span>
          </div>

          <div className="flex items-center gap-3">
            <button 
              type="button" 
              onClick={onClose}
              disabled={isSubmitting}
              className="px-5 py-2.5 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl text-xs font-bold transition-all"
            >
              إلغاء
            </button>
            <button 
              type="button" 
              onClick={() => handleSubmit()}
              disabled={isSubmitting}
              className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white rounded-xl text-xs font-black shadow-lg shadow-blue-600/25 active:scale-95 transition-all disabled:opacity-50"
            >
              <Check size={16} />
              <span>{isSubmitting ? 'جاري الحفظ...' : 'إضافة الصنف ومتابعة الفاتورة'}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
