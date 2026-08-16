/**
 * @file QuickAddProductModal.tsx
 * @module المكونات القابلة لإعادة الاستخدام (Reusable Components)
 * @description نافذة سريعة لإضافة وتسجيل صنف جديد غير مسجل مباشرة من شاشة الاستعلام أو الكاشير.
 */
import React, { useState } from 'react';
import { 
  Plus, 
  X, 
  Barcode, 
  Tag, 
  Check, 
  DollarSign, 
  Boxes, 
  MapPin, 
  Sparkles,
  Layers
} from 'lucide-react';
import { ProductRepository } from '../repositories/productRepository';
import { MaroSyncEngine } from '../lib/maroSyncEngine';
import { PriceCheckProduct } from '../types/industryModules';
import { formatCurrency } from '../lib/utils';

interface QuickAddProductModalProps {
  isOpen: boolean;
  initialBarcode: string;
  onClose: () => void;
  onProductCreated: (product: PriceCheckProduct) => void;
}

export const QuickAddProductModal: React.FC<QuickAddProductModalProps> = ({
  isOpen,
  initialBarcode,
  onClose,
  onProductCreated
}) => {
  const [barcode, setBarcode] = useState(initialBarcode || '');
  const [nameAr, setNameAr] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [category, setCategory] = useState('المشروبات والأغذية المحفوظة');
  const [retailPrice, setRetailPrice] = useState<string>('50');
  const [costPrice, setCostPrice] = useState<string>('35');
  const [quantity, setQuantity] = useState<string>('20');
  const [shelfLocation, setShelfLocation] = useState('ممر 1 - رف 2 - خانة 05');
  const [unit, setUnit] = useState('قطعة');
  const [isSaving, setIsSaving] = useState(false);

  // Update barcode when initialBarcode changes
  React.useEffect(() => {
    if (initialBarcode) {
      setBarcode(initialBarcode);
    }
  }, [initialBarcode]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameAr.trim() || !barcode.trim()) {
      alert('يرجى كتابة اسم الصنف والباركود');
      return;
    }

    setIsSaving(true);
    try {
      const priceNum = parseFloat(retailPrice) || 0;
      const costNum = parseFloat(costPrice) || 0;
      const qtyNum = parseFloat(quantity) || 0;

      // 1. Save to ProductRepository (Master Products)
      const nowIso = new Date().toISOString();
      const newMasterId = await ProductRepository.addProduct({
        name: nameAr.trim(),
        nameArabic: nameAr.trim(),
        nameEnglish: nameEn.trim() || nameAr.trim(),
        sku: `SKU-${barcode.trim().slice(-6) || Date.now().toString().slice(-6)}`,
        barcode: barcode.trim(),
        category,
        categoryId: `cat_${Date.now()}`,
        price: priceNum,
        costPrice: costNum,
        quantity: qtyNum,
        openingBalance: qtyNum,
        reorderLevel: 5,
        batchTracking: false,
        expiryTracking: false,
        serialNumberTracking: false,
        allowNegativeStock: true,
        allowFraction: false,
        isTaxable: true,
        taxIncluded: true,
        taxRate: 14,
        status: 'active',
        units: [
          { id: `u_${Date.now()}`, name: unit, symbol: unit, factor: 1, isBaseUnit: true, barcode: barcode.trim(), salePrice: priceNum }
        ],
        barcodes: [
          { id: `b_${Date.now()}`, code: barcode.trim(), type: 'EAN13', isPrimary: true }
        ],
        warehouseStocks: [
          { warehouseId: 'BR-CAIRO-01', warehouseName: 'فرع المعادي الرئيسي', locationCode: shelfLocation, quantity: qtyNum }
        ],
        priceLists: [
          { priceListId: 'pl_retail', priceListName: 'قطاعي', price: priceNum, minQuantity: 1 },
          { priceListId: 'pl_wholesale', priceListName: 'جملة', price: Math.round(priceNum * 0.9), minQuantity: 3 }
        ],
        description: nameEn || nameAr,
        batches: [],
        images: [],
        attachments: [],
        createdAt: nowIso,
        updatedAt: nowIso
      });

      // 2. Build PriceCheckProduct
      const createdPriceCheck: PriceCheckProduct = {
        id: newMasterId,
        barcode: barcode.trim(),
        sku: `SKU-${barcode.trim().slice(-6)}`,
        nameAr: nameAr.trim(),
        nameEn: nameEn.trim() || nameAr.trim(),
        brand: 'عام',
        category,
        unit,
        costPrice: costNum,
        retailPrice: priceNum,
        taxRate: 0.14,
        finalPriceWithTax: Math.round(priceNum * 1.14 * 100) / 100,
        hasPromotion: false,
        priceLevels: [
          { levelNameAr: 'قطاعي (سعر المستهلك)', price: Math.round(priceNum * 1.14 * 100) / 100, minQuantity: 1 },
          { levelNameAr: 'سعر الجملة (3+)', price: Math.round(priceNum * 0.9 * 1.14 * 100) / 100, minQuantity: 3 }
        ],
        loyaltyPointsEarned: Math.max(1, Math.round(priceNum * 0.05)),
        stockInCurrentBranch: qtyNum,
        stockTotalAllBranches: qtyNum,
        shelfLocation,
        binCode: 'BIN-NEW-01',
        descriptionAr: `تم تسجيل الصنف بنجاح في دليل الأصناف.`
      };

      // Also save to PDA collection for fast sync
      const currentPda = MaroSyncEngine.getLocalCollection<PriceCheckProduct>('pda_price_check_products');
      MaroSyncEngine.setLocalCollection('pda_price_check_products', [createdPriceCheck, ...currentPda]);

      onProductCreated(createdPriceCheck);
      onClose();
    } catch (err) {
      console.error('Failed to create product:', err);
      alert('حدث خطأ أثناء حفظ الصنف، يرجى المحاولة مرة أخرى.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-[120] flex items-center justify-center p-4" dir="rtl">
      <div className="bg-[#0f172a] border border-amber-500/40 rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col text-right animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-800 bg-gradient-to-r from-amber-950/40 via-slate-900 to-slate-900 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center font-black">
              <Plus size={22} />
            </div>
            <div>
              <h2 className="text-base font-black text-white flex items-center gap-2">
                <span>تسجيل صنف جديد سريع</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">
                  فوري بدليل الأصناف
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                تسجيل الصنف مباشرة في قاعدة البيانات لإتاحته فوراُ في الاستعلام وشاشات البيع
              </p>
            </div>
          </div>

          <button 
            type="button" 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto max-h-[75vh]">
          
          {/* Barcode Display / Input */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Barcode size={14} className="text-amber-400" />
              <span>الباركود الممسوح:</span>
            </label>
            <input
              type="text"
              required
              value={barcode}
              onChange={(e) => setBarcode(e.target.value)}
              placeholder="622..."
              className="w-full px-4 py-2.5 bg-[#151b2b] border border-amber-500/40 rounded-xl text-amber-400 font-mono text-base font-bold focus:outline-none focus:border-amber-400"
            />
          </div>

          {/* Product Name in Arabic */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Tag size={14} className="text-emerald-400" />
              <span>اسم الصنف بالعربية: *</span>
            </label>
            <input
              type="text"
              required
              value={nameAr}
              onChange={(e) => setNameAr(e.target.value)}
              placeholder="مثال: شاي العروسة ناعم 100 جم"
              className="w-full px-4 py-2.5 bg-[#151b2b] border border-slate-700 rounded-xl text-white font-bold text-sm focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Product Name in English / Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1.5">الاسم بالإنجليزية (اختياري):</label>
              <input
                type="text"
                value={nameEn}
                onChange={(e) => setNameEn(e.target.value)}
                placeholder="El Arosa Tea 100g"
                className="w-full px-3.5 py-2 bg-[#151b2b] border border-slate-700 rounded-xl text-slate-200 text-xs focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1.5">التصنيف / القسم:</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2 bg-[#151b2b] border border-slate-700 rounded-xl text-slate-200 text-xs focus:outline-none focus:border-blue-500"
              >
                <option value="المشروبات والأغذية المحفوظة">المشروبات والأغذية المحفوظة</option>
                <option value="الأغذية الطازجة والمخبوزات">الأغذية الطازجة والمخبوزات</option>
                <option value="المنظفات ومستلزمات العناية">المنظفات ومستلزمات العناية</option>
                <option value="إلكترونيات وهواتف ذكية">إلكترونيات وهواتف ذكية</option>
                <option value="الأدوية والمسكنات الطبية">الأدوية والمسكنات الطبية</option>
                <option value="الملابس والأحذية">الملابس والأحذية</option>
                <option value="قطع غيار السيارات">قطع غيار السيارات</option>
                <option value="أصناف عامة">أصناف عامة</option>
              </select>
            </div>
          </div>

          {/* Prices & Unit */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-amber-400 mb-1.5">سعر البيع (قطاعي):</label>
              <input
                type="number"
                step="any"
                required
                value={retailPrice}
                onChange={(e) => setRetailPrice(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#151b2b] border border-slate-700 rounded-xl text-amber-400 font-mono font-black text-base focus:outline-none focus:border-amber-500 text-center"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1.5">سعر التكلفة:</label>
              <input
                type="number"
                step="any"
                value={costPrice}
                onChange={(e) => setCostPrice(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#151b2b] border border-slate-700 rounded-xl text-slate-300 font-mono text-sm focus:outline-none focus:border-slate-500 text-center"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1.5">الوحدة:</label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full px-3 py-2.5 bg-[#151b2b] border border-slate-700 rounded-xl text-slate-200 text-xs focus:outline-none"
              >
                <option value="قطعة">قطعة</option>
                <option value="علبة">علبة</option>
                <option value="زجاجة">زجاجة</option>
                <option value="كرتونة">كرتونة</option>
                <option value="كيس">كيس</option>
                <option value="كجم">كجم</option>
                <option value="جرام">جرام</option>
                <option value="شريط">شريط</option>
              </select>
            </div>
          </div>

          {/* Stock & Shelf Location */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1">
                <Boxes size={14} className="text-sky-400" />
                <span>الرصيد الإفتتاحي بالمخزن:</span>
              </label>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full px-3.5 py-2 bg-[#151b2b] border border-slate-700 rounded-xl text-white font-mono text-sm focus:outline-none focus:border-sky-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1">
                <MapPin size={14} className="text-emerald-400" />
                <span>موقع الرف بالصالة:</span>
              </label>
              <input
                type="text"
                value={shelfLocation}
                onChange={(e) => setShelfLocation(e.target.value)}
                placeholder="ممر 2 - رف 3"
                className="w-full px-3.5 py-2 bg-[#151b2b] border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-black text-xs transition-all flex items-center gap-2 shadow-lg shadow-amber-600/30 disabled:opacity-50"
            >
              {isSaving ? (
                <span>جاري الحفظ...</span>
              ) : (
                <>
                  <Check size={16} />
                  <span>حفظ الصنف وتفعيله فورياً</span>
                </>
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
