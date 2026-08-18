/**
 * @file PriceAdjustmentPage.tsx
 * @module واجهات وصفحات النظام (UI Pages)
 * @description ملف جزء من نظام MARO ERP. الوظيفة: شاشة تعديل أسعار البيع والشراء بالجملة والتجزئة وبالمجموعات والفئات والنسب المئوية
 */
import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  Percent, 
  Search, 
  Filter, 
  Save, 
  RefreshCw, 
  FileSpreadsheet, 
  CheckCircle2, 
  Layers, 
  Truck, 
  Tag, 
  ArrowUpRight, 
  ArrowDownRight, 
  Sparkles,
  Zap,
  Building2,
  Sliders,
  Check,
  RotateCcw
} from 'lucide-react';
import { ProductMaster, ProductCategory, ProductGroup, Brand, Manufacturer } from '../types/productMaster';
import { ProductRepository } from '../repositories/productRepository';
import { MaroSyncEngine } from '../lib/maroSyncEngine';
import { formatCurrency } from '../lib/utils';
import { toast } from 'react-hot-toast';

interface PriceRow {
  id: string;
  sku: string;
  name: string;
  category: string;
  groupName?: string;
  brandName?: string;
  supplierName?: string;
  
  // Current values
  oldPrice: number;
  oldCostPrice: number;
  oldWholesalePrice: number;
  
  // Modified values
  newPrice: number;
  newCostPrice: number;
  newWholesalePrice: number;

  isSelected: boolean;
  isModified: boolean;
}

type TargetPriceField = 'price' | 'costPrice' | 'wholesalePrice';
type AdjustmentMode = 'percent_increase' | 'percent_decrease' | 'fixed_add' | 'fixed_subtract' | 'fixed_set';
type RoundingRule = 'none' | 'nearest_1' | 'nearest_5' | 'nearest_half';

export const PriceAdjustmentPage: React.FC = () => {
  const [products, setProducts] = useState<ProductMaster[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [groups, setGroups] = useState<ProductGroup[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);

  // Filter States
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedGroupId, setSelectedGroupId] = useState<string>('ALL');
  const [selectedBrandId, setSelectedBrandId] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Bulk Rule Configuration States
  const [targetField, setTargetField] = useState<TargetPriceField>('price');
  const [adjMode, setAdjMode] = useState<AdjustmentMode>('percent_increase');
  const [adjValue, setAdjValue] = useState<number>(10);
  const [roundingRule, setRoundingRule] = useState<RoundingRule>('nearest_1');

  // Rows State
  const [rows, setRows] = useState<PriceRow[]>([]);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  useEffect(() => {
    const loadedProds = ProductRepository.getProducts();
    setProducts(loadedProds);

    const cats = Array.from(new Set(loadedProds.map(p => p.category || 'عام').filter(Boolean)));
    setCategories(cats);

    initRowsFromProducts(loadedProds);

    const unsub = MaroSyncEngine.subscribe<ProductMaster>('products', (data) => {
      if (data) {
        setProducts(data);
      }
    });
    return () => unsub();
  }, []);

  const initRowsFromProducts = (prods: ProductMaster[]) => {
    const initialRows: PriceRow[] = prods.map(p => ({
      id: p.id,
      sku: p.sku,
      name: p.name,
      category: p.category || 'عام',
      groupName: p.groupName || 'غير محدد',
      brandName: p.brandName || 'غير محدد',
      oldPrice: p.price || 0,
      oldCostPrice: p.costPrice || 0,
      oldWholesalePrice: p.wholesalePrice || p.price || 0,

      newPrice: p.price || 0,
      newCostPrice: p.costPrice || 0,
      newWholesalePrice: p.wholesalePrice || p.price || 0,

      isSelected: true,
      isModified: false
    }));
    setRows(initialRows);
  };

  // Filtered rows
  const filteredRows = rows.filter(r => {
    const matchesSearch = r.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          r.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = selectedCategory === 'ALL' || r.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  const selectedRowsCount = filteredRows.filter(r => r.isSelected).length;
  const modifiedRowsCount = filteredRows.filter(r => r.isModified).length;

  // Rounding helper
  const applyRounding = (val: number, rule: RoundingRule): number => {
    if (val <= 0) return 0;
    if (rule === 'nearest_1') return Math.round(val);
    if (rule === 'nearest_5') return Math.round(val / 5) * 5;
    if (rule === 'nearest_half') return Math.round(val * 2) / 2;
    return Number(val.toFixed(2));
  };

  // Apply Bulk Adjustment Rule Preview
  const handleApplyBulkRule = () => {
    if (selectedRowsCount === 0) {
      toast.error('يرجى تحديد الأغذية أو الأصناف المراد تطبيق التعديل عليها');
      return;
    }

    setRows(prev => prev.map(row => {
      const isMatchCategory = selectedCategory === 'ALL' || row.category === selectedCategory;
      const matchesSearch = row.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            row.sku.toLowerCase().includes(searchTerm.toLowerCase());

      if (row.isSelected && isMatchCategory && matchesSearch) {
        let currentBase = targetField === 'price' 
          ? row.oldPrice 
          : targetField === 'costPrice' 
          ? row.oldCostPrice 
          : row.oldWholesalePrice;

        let calculated = currentBase;

        if (adjMode === 'percent_increase') {
          calculated = currentBase * (1 + (adjValue / 100));
        } else if (adjMode === 'percent_decrease') {
          calculated = currentBase * (1 - (adjValue / 100));
        } else if (adjMode === 'fixed_add') {
          calculated = currentBase + adjValue;
        } else if (adjMode === 'fixed_subtract') {
          calculated = Math.max(0, currentBase - adjValue);
        } else if (adjMode === 'fixed_set') {
          calculated = adjValue;
        }

        const roundedFinal = applyRounding(calculated, roundingRule);

        const updated = { ...row };
        if (targetField === 'price') {
          updated.newPrice = roundedFinal;
        } else if (targetField === 'costPrice') {
          updated.newCostPrice = roundedFinal;
        } else if (targetField === 'wholesalePrice') {
          updated.newWholesalePrice = roundedFinal;
        }

        updated.isModified = (updated.newPrice !== updated.oldPrice) || 
                             (updated.newCostPrice !== updated.oldCostPrice) || 
                             (updated.newWholesalePrice !== updated.oldWholesalePrice);

        return updated;
      }
      return row;
    }));

    toast.success(`تمت معاينة تحديث الأسعار لـ ${selectedRowsCount} صنف بنجاح`);
  };

  // Inline Row Modification
  const handleRowPriceChange = (id: string, field: 'newPrice' | 'newCostPrice' | 'newWholesalePrice', val: number) => {
    setRows(prev => prev.map(row => {
      if (row.id === id) {
        const updated = { ...row, [field]: val };
        updated.isModified = (updated.newPrice !== updated.oldPrice) || 
                             (updated.newCostPrice !== updated.oldCostPrice) || 
                             (updated.newWholesalePrice !== updated.oldWholesalePrice);
        return updated;
      }
      return row;
    }));
  };

  // Select / Deselect All
  const toggleSelectAll = (checked: boolean) => {
    setRows(prev => prev.map(r => ({ ...r, isSelected: checked })));
  };

  // Reset Changes
  const handleReset = () => {
    initRowsFromProducts(products);
    toast.success('تمت إعادة ضبط الجدول إلى الأسعار الحالية الأصلية');
  };

  // Commit New Prices to System & POS
  const handleCommitPrices = async () => {
    const modifiedItems = rows.filter(r => r.isModified);
    if (modifiedItems.length === 0) {
      toast.error('لا توجد أي تعديلات في الأسعار للحفظ');
      return;
    }

    setIsSaving(true);
    try {
      for (const item of modifiedItems) {
        await ProductRepository.updateProduct(item.id, {
          price: item.newPrice,
          costPrice: item.newCostPrice,
          wholesalePrice: item.newWholesalePrice
        });
      }

      await ProductRepository.logAudit('UPDATE', 'products_bulk_price_adjustment', `BULK_PRICE_${Date.now()}`, `تعديل أسعار جماعي لـ (${modifiedItems.length}) صنف`, {
        modifiedCount: modifiedItems.length,
        targetField,
        adjMode,
        adjValue
      });

      // Reload products state
      const reloaded = ProductRepository.getProducts();
      setProducts(reloaded);
      initRowsFromProducts(reloaded);

      toast.success(`تم اعتماد وتحديث الأسعار لـ (${modifiedItems.length}) صنف بنجاح وشاشات الـ POS!`);
    } catch (err: any) {
      toast.error(err.message || 'حدث خطأ أثناء حفظ الأسعار الجديدة');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="bg-[#151b2b] p-6 rounded-2xl border border-[#1e293b] shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-blue-500/10 text-blue-400 rounded-2xl flex items-center justify-center border border-blue-500/20">
            <DollarSign size={26} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-white">تعديل وتحديث أسعار البيع والشراء والجملة</h1>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                أداة التسعير الذكي الذاتي
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              تعديل أسعار الأصناف سواء صنف صنف أو بالمجموعات والفئات بنسب مئوية أو قيمة ثابته وشامل المزامنة الحية
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#1e293b] hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-all cursor-pointer border border-[#334155]"
          >
            <RotateCcw size={16} />
            <span>إعادة الضبط</span>
          </button>

          <button
            type="button"
            onClick={handleCommitPrices}
            disabled={isSaving || modifiedRowsCount === 0}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold text-white transition-all shadow-lg cursor-pointer ${
              modifiedRowsCount === 0 
                ? 'bg-blue-600/40 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-500 active:bg-blue-700 shadow-blue-600/20'
            }`}
          >
            <Save size={16} />
            <span>{isSaving ? 'جاري حفظ الأسعار...' : `اعتماد التعديلات (${modifiedRowsCount} صنف معدل)`}</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Category Filter */}
        <div className="bg-[#151b2b] p-4 rounded-xl border border-[#1e293b]">
          <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
            <Filter size={14} className="text-amber-400" />
            التصنيف والقطاع
          </label>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full bg-[#0b0f17] border border-[#1e293b] rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">جميع الفئات ({products.length} صنف)</option>
            {categories.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {/* Live Search */}
        <div className="bg-[#151b2b] p-4 rounded-xl border border-[#1e293b] md:col-span-2">
          <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
            <Search size={14} className="text-emerald-400" />
            بحث عن صنف بالاسم أو الكود (SKU / Barcode)
          </label>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="اكتب اسم المنتج أو كود الباركود للفلترة السريعة..."
            className="w-full bg-[#0b0f17] border border-[#1e293b] rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-blue-500 placeholder:text-slate-600"
          />
        </div>
      </div>

      {/* Smart Bulk Rule Builder Panel */}
      <div className="bg-[#151b2b] p-6 rounded-2xl border border-blue-500/30 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-[#1e293b] pb-3">
          <div className="flex items-center gap-2">
            <Zap size={18} className="text-amber-400" />
            <h3 className="font-black text-white text-sm">أداة محرك التعديل الجماعي الذكي بالأسعار (Bulk Price Engine)</h3>
          </div>
          <span className="text-xs text-slate-400 font-bold">
            محدد حالياً: <span className="text-blue-400">{selectedRowsCount}</span> من <span className="text-white">{filteredRows.length}</span> صنف
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {/* Target Price Field */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">السعر المستهدف للتعديل</label>
            <select
              value={targetField}
              onChange={(e) => setTargetField(e.target.value as any)}
              className="w-full bg-[#0b0f17] border border-[#1e293b] rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
            >
              <option value="price">سعر البيع الأساسي (Retail Price)</option>
              <option value="costPrice">سعر الشراء والتكلفة (Cost Price)</option>
              <option value="wholesalePrice">سعر الجملة (Wholesale Price)</option>
            </select>
          </div>

          {/* Adjustment Mode */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">نوع التعديل المطلوب</label>
            <select
              value={adjMode}
              onChange={(e) => setAdjMode(e.target.value as any)}
              className="w-full bg-[#0b0f17] border border-[#1e293b] rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
            >
              <option value="percent_increase">زيادة بنسبة مئوية (+ %)</option>
              <option value="percent_decrease">خصم / نقصان بنسبة مئوية (- %)</option>
              <option value="fixed_add">إضافة مبلغ ثابت (+ ج.م)</option>
              <option value="fixed_subtract">خصم مبلغ ثابت (- ج.م)</option>
              <option value="fixed_set">تحديد سعر موحد مباشر (= ج.م)</option>
            </select>
          </div>

          {/* Adjustment Value */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">القيمة أو النسبة</label>
            <input
              type="number"
              value={adjValue}
              onChange={(e) => setAdjValue(Number(e.target.value))}
              placeholder="مثال: 10 أو 50"
              className="w-full bg-[#0b0f17] border border-[#1e293b] rounded-xl p-2.5 text-xs text-white font-bold font-mono focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Rounding Rule */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">قواعد تقريب النتيجة</label>
            <select
              value={roundingRule}
              onChange={(e) => setRoundingRule(e.target.value as any)}
              className="w-full bg-[#0b0f17] border border-[#1e293b] rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
            >
              <option value="nearest_1">تقريب لأقرب 1 ج.م صحيح</option>
              <option value="nearest_5">تقريب لأقرب 5 ج.م</option>
              <option value="nearest_half">تقريب لأقرب 0.50 ج.م</option>
              <option value="none">بدون تقريب (كسور دقيقة)</option>
            </select>
          </div>

          {/* Apply Button */}
          <div className="flex items-end">
            <button
              type="button"
              onClick={handleApplyBulkRule}
              className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Sliders size={16} />
              <span>تطبيق القاعدة والمعاينة</span>
            </button>
          </div>
        </div>
      </div>

      {/* Editable Interactive Products Table */}
      <div className="bg-[#151b2b] rounded-2xl border border-[#1e293b] shadow-xl overflow-hidden">
        <div className="p-4 border-b border-[#1e293b] bg-[#0b0f17] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h3 className="font-black text-white text-sm">جدول الأسعار وقوائم البيع والشراء للأصناف</h3>
            <span className="text-xs text-slate-400">يمكنك تعديل أي سعر مباشرة في الجدول (صنف صنف)</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-emerald-400 font-bold bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
              {modifiedRowsCount} صنف تم تعديل سعره
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-[#0b0f17] text-slate-400 font-bold border-b border-[#1e293b]">
              <tr>
                <th className="px-4 py-3 text-center">
                  <input
                    type="checkbox"
                    checked={filteredRows.length > 0 && filteredRows.every(r => r.isSelected)}
                    onChange={(e) => toggleSelectAll(e.target.checked)}
                    className="rounded border-slate-700 bg-slate-900 text-blue-600"
                  />
                </th>
                <th className="px-4 py-3">كود SKU</th>
                <th className="px-4 py-3">اسم المنتج</th>
                <th className="px-4 py-3">الفئة</th>
                <th className="px-4 py-3 text-center">سعر التكلفة الحالي</th>
                <th className="px-4 py-3 text-center">سعر التكلفة الجديد</th>
                <th className="px-4 py-3 text-center">سعر البيع الحالي</th>
                <th className="px-4 py-3 text-center">سعر البيع الجديد</th>
                <th className="px-4 py-3 text-center">سعر الجملة الجديد</th>
                <th className="px-4 py-3 text-center">هامش الربح %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e293b]">
              {filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-6 py-12 text-center text-slate-500 font-bold">
                    لا توجد أصناف تطابق تصفية البحث
                  </td>
                </tr>
              ) : (
                filteredRows.map((r) => {
                  const profitMargin = r.newCostPrice > 0 
                    ? (((r.newPrice - r.newCostPrice) / r.newCostPrice) * 100).toFixed(1) 
                    : '0';

                  return (
                    <tr key={r.id} className={`hover:bg-[#1e293b]/50 transition-colors ${r.isModified ? 'bg-amber-500/5' : ''}`}>
                      <td className="px-4 py-3 text-center">
                        <input
                          type="checkbox"
                          checked={r.isSelected}
                          onChange={(e) => setRows(prev => prev.map(item => item.id === r.id ? { ...item, isSelected: e.target.checked } : item))}
                          className="rounded border-slate-700 bg-slate-900 text-blue-600"
                        />
                      </td>

                      <td className="px-4 py-3 font-mono font-bold text-slate-400 whitespace-nowrap">{r.sku}</td>
                      <td className="px-4 py-3 font-bold text-white whitespace-nowrap">
                        {r.name}
                        {r.isModified && (
                          <span className="mr-2 text-[10px] font-bold text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                            مُعدل
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-400 whitespace-nowrap">{r.category}</td>

                      {/* Current Cost */}
                      <td className="px-4 py-3 text-center text-slate-400 font-mono">
                        {formatCurrency(r.oldCostPrice)}
                      </td>

                      {/* New Cost Input */}
                      <td className="px-4 py-3 text-center">
                        <input
                          type="number"
                          value={r.newCostPrice}
                          onChange={(e) => handleRowPriceChange(r.id, 'newCostPrice', Number(e.target.value))}
                          className="w-24 text-center bg-[#0b0f17] border border-[#334155] rounded-lg p-1 font-bold text-slate-200 focus:outline-none focus:border-blue-500"
                        />
                      </td>

                      {/* Current Sale Price */}
                      <td className="px-4 py-3 text-center text-slate-400 font-mono">
                        {formatCurrency(r.oldPrice)}
                      </td>

                      {/* New Sale Price Input */}
                      <td className="px-4 py-3 text-center">
                        <input
                          type="number"
                          value={r.newPrice}
                          onChange={(e) => handleRowPriceChange(r.id, 'newPrice', Number(e.target.value))}
                          className="w-24 text-center bg-[#0b0f17] border border-[#334155] rounded-lg p-1 font-bold text-emerald-400 focus:outline-none focus:border-emerald-500"
                        />
                      </td>

                      {/* New Wholesale Price Input */}
                      <td className="px-4 py-3 text-center">
                        <input
                          type="number"
                          value={r.newWholesalePrice}
                          onChange={(e) => handleRowPriceChange(r.id, 'newWholesalePrice', Number(e.target.value))}
                          className="w-24 text-center bg-[#0b0f17] border border-[#334155] rounded-lg p-1 font-bold text-blue-400 focus:outline-none focus:border-blue-500"
                        />
                      </td>

                      {/* Profit Margin % */}
                      <td className="px-4 py-3 text-center font-bold font-mono">
                        <span className={`px-2 py-0.5 rounded-md ${Number(profitMargin) >= 15 ? 'text-emerald-400 bg-emerald-500/10' : 'text-amber-400 bg-amber-500/10'}`}>
                          {profitMargin}%
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
