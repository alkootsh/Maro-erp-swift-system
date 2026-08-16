/**
 * @file FastKeyboardInvoiceLineEntry.tsx
 * @module المكونات القابلة لإعادة الاستخدام (Reusable Components)
 * @description شريط إدخال الأصناف فائق السرعة عبر لوحة المفاتيح (Keyboard-First Invoice Line Entry). يتيح البحث الفوري عن الصنف، تحديد الكمية والسعر والخصم بالأسهم وEnter، وإضافة الصنف مباشرة دون لمس الماوس.
 */

import React, { useState, useRef, useEffect } from 'react';
import { Plus, Package, Sparkles, Check, ArrowRight, CornerDownLeft } from 'lucide-react';
import { ProductMaster } from '../../types/productMaster';
import { KeyboardSearchSelect, SearchOption } from '../common/KeyboardSearchSelect';
import { formatCurrency, cn } from '../../lib/utils';
import { toast } from 'react-hot-toast';

export interface FastInvoiceLinePayload {
  product: ProductMaster;
  unit: string;
  quantity: number;
  unitPrice: number;
  discountPercent: number;
}

interface FastKeyboardInvoiceLineEntryProps {
  products: ProductMaster[];
  onAddLine: (line: FastInvoiceLinePayload) => void;
  defaultUnit?: string;
  allowWholesaleUnits?: boolean;
  priceType?: 'retail' | 'wholesale' | 'cost';
  className?: string;
  autoFocusSearch?: boolean;
}

export const FastKeyboardInvoiceLineEntry: React.FC<FastKeyboardInvoiceLineEntryProps> = ({
  products,
  onAddLine,
  defaultUnit = 'قطعة',
  allowWholesaleUnits = true,
  priceType = 'wholesale',
  className,
  autoFocusSearch = false,
}) => {
  const [selectedProductId, setSelectedProductId] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<ProductMaster | null>(null);
  const [unit, setUnit] = useState(defaultUnit);
  const [quantity, setQuantity] = useState<number>(allowWholesaleUnits ? 5 : 1);
  const [unitPrice, setUnitPrice] = useState<number>(0);
  const [discountPercent, setDiscountPercent] = useState<number>(0);

  // Refs for sequential field focus
  const searchInputRef = useRef<HTMLInputElement>(null);
  const unitSelectRef = useRef<HTMLSelectElement>(null);
  const qtyInputRef = useRef<HTMLInputElement>(null);
  const priceInputRef = useRef<HTMLInputElement>(null);
  const discountInputRef = useRef<HTMLInputElement>(null);
  const addBtnRef = useRef<HTMLButtonElement>(null);

  // Transform products into SearchOptions
  const productOptions: SearchOption[] = React.useMemo(() => {
    return products.map(p => {
      const price = priceType === 'wholesale' 
        ? (p.price * 0.85) 
        : priceType === 'cost' 
        ? (p.costPrice || p.price || 0) 
        : (p.price || 0);

      return {
        id: p.id,
        title: p.name,
        subtitle: `SKU: ${p.sku} | باركود: ${p.barcode || '—'}`,
        badge: `${p.quantity || 0} بالمخزن`,
        badgeColor: (p.quantity || 0) > 10 ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30' : 'bg-amber-600/20 text-amber-400 border border-amber-500/30',
        meta: `السعر: ${formatCurrency(price)}`,
        raw: p
      };
    });
  }, [products, priceType]);

  const handleProductSelect = (productId: string, option?: SearchOption) => {
    if (!productId || !option?.raw) {
      setSelectedProductId('');
      setSelectedProduct(null);
      return;
    }

    const prod: ProductMaster = option.raw;
    setSelectedProductId(prod.id);
    setSelectedProduct(prod);

    // Compute appropriate price
    let computedPrice = prod.price || 0;
    if (priceType === 'wholesale') {
      computedPrice = +(prod.price * 0.85).toFixed(2);
    } else if (priceType === 'cost') {
      computedPrice = prod.costPrice || prod.price || 0;
    }
    setUnitPrice(computedPrice);

    // Auto-advance focus to Quantity input
    setTimeout(() => {
      if (qtyInputRef.current) {
        qtyInputRef.current.focus();
        qtyInputRef.current.select();
      }
    }, 60);
  };

  const handleCommitLine = () => {
    if (!selectedProduct) {
      toast.error('يرجى اختيار صنف أولاً (أو كتابة جزء من اسمه والضغط على Enter)');
      searchInputRef.current?.focus();
      return;
    }

    if (quantity <= 0) {
      toast.error('الكمية يجب أن تكون أكبر من الصفر');
      qtyInputRef.current?.focus();
      return;
    }

    // Emit payload to parent
    onAddLine({
      product: selectedProduct,
      unit,
      quantity,
      unitPrice,
      discountPercent
    });

    // Reset line entry state and focus back to product search
    setSelectedProductId('');
    setSelectedProduct(null);
    setQuantity(allowWholesaleUnits ? 5 : 1);
    setDiscountPercent(0);
    setUnitPrice(0);

    setTimeout(() => {
      if (searchInputRef.current) {
        searchInputRef.current.focus();
        searchInputRef.current.select();
      }
    }, 60);
  };

  return (
    <div className={cn("p-4 bg-[#0f172a] rounded-2xl border border-[#1e293b] space-y-3", className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-blue-600/20 text-blue-400 rounded-lg">
            <Package size={16} />
          </div>
          <span className="text-xs font-black text-white">إدخال الأصناف السريع بلوحة المفاتيح (Keyboard-First Entry)</span>
        </div>
        <div className="flex items-center gap-2 text-[10px] text-slate-400">
          <span className="hidden sm:inline">التنقل:</span>
          <span className="bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700 font-mono text-slate-300">Enter ↵</span>
          <span className="text-slate-500">للتأكيد والانتقال</span>
          <span className="bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700 font-mono text-slate-300">↑ / ↓</span>
          <span className="text-slate-500">لاختيار الصنف</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
        {/* 1. Product Search Autocomplete */}
        <div className="md:col-span-5">
          <KeyboardSearchSelect
            id="fast-product-search"
            label="اسم الصنف / الباركود / الكود (SKU)"
            placeholder="اكتب أول حرف أو جزء من اسم الصنف..."
            options={productOptions}
            value={selectedProductId}
            onChange={handleProductSelect}
            inputRef={searchInputRef}
            autoFocus={autoFocusSearch}
            shortcutBadge="F3"
            emptyMessage="لا يوجد صنف مطابق — تأكد من الاسم أو الباركود"
          />
        </div>

        {/* 2. Unit Selection */}
        {allowWholesaleUnits && (
          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-slate-400 mb-1">وحدة البيع</label>
            <select
              ref={unitSelectRef}
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  qtyInputRef.current?.focus();
                  qtyInputRef.current?.select();
                }
              }}
              className="w-full px-3 py-2.5 bg-[#151b2b] border border-[#1e293b] rounded-xl text-white text-xs font-bold focus:outline-none focus:border-emerald-500"
            >
              <option value="قطعة">قطعة (Unit)</option>
              <option value="كرتونة">كرتونة (12 قطعة)</option>
              <option value="دستة">دستة (12 قطعة)</option>
              <option value="بالته">بالته (120 قطعة)</option>
              <option value="شريط">شريط</option>
              <option value="علبة">علبة</option>
              <option value="كجم">كجم (Kg)</option>
            </select>
          </div>
        )}

        {/* 3. Quantity */}
        <div className={cn("md:col-span-2", !allowWholesaleUnits && "md:col-span-2")}>
          <label className="block text-xs font-bold text-slate-400 mb-1">الكمية</label>
          <input
            ref={qtyInputRef}
            type="number"
            min={1}
            step="any"
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
            onFocus={(e) => e.target.select()}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                priceInputRef.current?.focus();
                priceInputRef.current?.select();
              }
            }}
            className="w-full px-3 py-2.5 bg-[#151b2b] border border-[#1e293b] rounded-xl text-white font-mono font-bold text-xs focus:outline-none focus:border-emerald-500"
          />
        </div>

        {/* 4. Unit Price */}
        <div className={cn("md:col-span-2", !allowWholesaleUnits && "md:col-span-3")}>
          <label className="block text-xs font-bold text-slate-400 mb-1">سعر الوحدة</label>
          <input
            ref={priceInputRef}
            type="number"
            min={0}
            step="any"
            value={unitPrice}
            onChange={(e) => setUnitPrice(Number(e.target.value))}
            onFocus={(e) => e.target.select()}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                if (discountInputRef.current) {
                  discountInputRef.current.focus();
                  discountInputRef.current.select();
                } else {
                  handleCommitLine();
                }
              }
            }}
            className="w-full px-3 py-2.5 bg-[#151b2b] border border-[#1e293b] rounded-xl text-emerald-400 font-mono font-bold text-xs focus:outline-none focus:border-emerald-500"
          />
        </div>

        {/* 5. Discount Percent (Optional) */}
        <div className="md:col-span-1">
          <label className="block text-xs font-bold text-slate-400 mb-1">خصم %</label>
          <input
            ref={discountInputRef}
            type="number"
            min={0}
            max={100}
            value={discountPercent}
            onChange={(e) => setDiscountPercent(Number(e.target.value))}
            onFocus={(e) => e.target.select()}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleCommitLine();
              }
            }}
            className="w-full px-3 py-2.5 bg-[#151b2b] border border-[#1e293b] rounded-xl text-amber-400 font-mono font-bold text-xs focus:outline-none focus:border-amber-500"
          />
        </div>

        {/* 6. Commit Button */}
        <div className={cn("md:col-span-12 lg:col-span-2", allowWholesaleUnits && "md:col-span-12 lg:col-span-12")}>
          <button
            ref={addBtnRef}
            type="button"
            onClick={handleCommitLine}
            className="w-full py-2.5 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-black shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all active:scale-95"
          >
            <Plus size={16} />
            <span>إضافة بند (Enter)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
