/**
 * @file OpeningBalancesPage.tsx
 * @module واجهات وصفحات النظام (UI Pages)
 * @description ملف جزء من نظام MARO ERP. الوظيفة: شاشة إدارة وتسجيل أرصدة أول المدة للمخزون (Opening Balances Entry Screen)
 */
import React, { useState, useEffect } from 'react';
import { 
  Boxes, 
  Package, 
  Search, 
  Filter, 
  Save, 
  RefreshCw, 
  FileSpreadsheet, 
  CheckCircle2, 
  Warehouse as WarehouseIcon, 
  Calendar, 
  Plus, 
  Trash2, 
  Layers, 
  DollarSign, 
  AlertCircle,
  HelpCircle,
  Zap,
  ArrowRight
} from 'lucide-react';
import { ProductMaster, ProductUnit } from '../types/productMaster';
import { ProductRepository } from '../repositories/productRepository';
import { InventoryRepository } from '../repositories/inventoryRepository';
import { MaroSyncEngine } from '../lib/maroSyncEngine';
import { formatCurrency, formatDate } from '../lib/utils';
import { toast } from 'react-hot-toast';

interface OpeningBalanceRow {
  productId: string;
  sku: string;
  name: string;
  category: string;
  warehouseId: string;
  warehouseName: string;
  unitId: string;
  unitName: string;
  unitFactor: number;
  openingQuantity: number;
  unitCost: number;
  totalValuation: number;
  batchNumber?: string;
  expiryDate?: string;
  notes?: string;
  unitsList: ProductUnit[];
}

export const OpeningBalancesPage: React.FC = () => {
  const [products, setProducts] = useState<ProductMaster[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>('wh-main');
  const [selectedWarehouseName, setSelectedWarehouseName] = useState<string>('المخزن الرئيسي');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [rows, setRows] = useState<OpeningBalanceRow[]>([]);
  const [isCommitted, setIsCommitted] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [documentNo] = useState<string>(`OPB-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`);
  const [entryDate, setEntryDate] = useState<string>(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    const loadedProds = ProductRepository.getProducts();
    setProducts(loadedProds);

    const cats = Array.from(new Set(loadedProds.map(p => p.category || 'عام').filter(Boolean)));
    setCategories(cats);

    // Populate initial rows from existing products
    initRowsFromProducts(loadedProds);

    const unsub = MaroSyncEngine.subscribe<ProductMaster>('products', (data) => {
      if (data) {
        setProducts(data);
      }
    });
    return () => unsub();
  }, []);

  const initRowsFromProducts = (prods: ProductMaster[]) => {
    const initialRows: OpeningBalanceRow[] = prods.map(p => {
      const unitsList = p.units && p.units.length > 0 ? p.units : [
        { id: 'u-sm', name: 'قطعة', symbol: 'قطعة', factor: 1, isBaseUnit: true }
      ];
      const baseUnit = unitsList[0];
      const initialQty = p.openingBalance ?? p.quantity ?? 0;
      const cost = p.costPrice || 0;

      return {
        productId: p.id,
        sku: p.sku,
        name: p.name,
        category: p.category || 'عام',
        warehouseId: 'wh-main',
        warehouseName: 'المخزن الرئيسي',
        unitId: baseUnit.id,
        unitName: baseUnit.name,
        unitFactor: baseUnit.factor || 1,
        openingQuantity: initialQty,
        unitCost: cost,
        totalValuation: initialQty * cost,
        notes: 'رصيد افتتاح بداية الفترة الماليو',
        unitsList
      };
    });
    setRows(initialRows);
  };

  // Filtered rows
  const filteredRows = rows.filter(r => {
    const matchesSearch = r.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          r.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = selectedCategory === 'ALL' || r.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  // Totals calculations
  const totalItemsCount = filteredRows.filter(r => r.openingQuantity > 0).length;
  const totalUnitsCount = filteredRows.reduce((sum, r) => sum + Number(r.openingQuantity || 0), 0);
  const totalValuationEgp = filteredRows.reduce((sum, r) => sum + Number(r.totalValuation || 0), 0);

  // Update line details
  const updateRow = (productId: string, field: keyof OpeningBalanceRow, value: any) => {
    setRows(prev => prev.map(row => {
      if (row.productId === productId) {
        const updated = { ...row, [field]: value };

        if (field === 'unitId') {
          const selectedUnit = row.unitsList.find(u => u.id === value);
          if (selectedUnit) {
            updated.unitName = selectedUnit.name;
            updated.unitFactor = selectedUnit.factor || 1;
          }
        }

        if (field === 'openingQuantity' || field === 'unitCost' || field === 'unitId') {
          const qty = Number(field === 'openingQuantity' ? value : updated.openingQuantity) || 0;
          const cost = Number(field === 'unitCost' ? value : updated.unitCost) || 0;
          updated.totalValuation = qty * cost;
        }

        return updated;
      }
      return row;
    }));
  };

  // Bulk Apply Warehouses
  const applyWarehouseToAll = (whId: string, whName: string) => {
    setSelectedWarehouseId(whId);
    setSelectedWarehouseName(whName);
    setRows(prev => prev.map(r => ({
      ...r,
      warehouseId: whId,
      warehouseName: whName
    })));
    toast.success(`تم تعيين المخزن (${whName}) لجميع بنود الجدول`);
  };

  // Excel / CSV Export / Import helper
  const handleExportCSV = () => {
    const headers = ['SKU', 'اسم المنتج', 'الفئة', 'المخزن', 'الوحدة', 'الكمية الافتتاحية', 'تكلفة الوحدة', 'إجمالي القيمة'];
    const csvContent = [
      headers.join(','),
      ...rows.map(r => [
        `"${r.sku}"`,
        `"${r.name.replace(/"/g, '""')}"`,
        `"${r.category}"`,
        `"${r.warehouseName}"`,
        `"${r.unitName}"`,
        r.openingQuantity,
        r.unitCost,
        r.totalValuation
      ].join(','))
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `أرصدة_أول_المدة_${documentNo}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('تم تصدير جدول أول المدة كملف CSV بنجاح');
  };

  // Commit Opening Balances to system
  const handleCommitOpeningBalances = async () => {
    const validRows = rows.filter(r => r.openingQuantity > 0);
    if (validRows.length === 0) {
      toast.error('يرجى كتابة كميات أرصدة أول المدة لصنف واحد على الأقل قبل الاعتماد');
      return;
    }

    setIsSaving(true);
    try {
      for (const r of validRows) {
        // Calculate base unit quantity equivalent
        const baseQty = r.openingQuantity * (r.unitFactor || 1);

        // Update Product Opening Balance and Quantity in Repository
        const product = ProductRepository.getProductByIdSync(r.productId);
        if (product) {
          const whStocks = [...(product.warehouseStocks || [])];
          const idx = whStocks.findIndex(w => w.warehouseId === r.warehouseId);
          if (idx >= 0) {
            whStocks[idx].quantity = baseQty;
          } else {
            whStocks.push({
              warehouseId: r.warehouseId,
              warehouseName: r.warehouseName,
              quantity: baseQty
            });
          }

          const totalQty = whStocks.reduce((sum, w) => sum + w.quantity, 0);

          await ProductRepository.updateProduct(r.productId, {
            openingBalance: baseQty,
            quantity: totalQty,
            costPrice: r.unitCost,
            warehouseStocks: whStocks
          });

          // Record Inventory Movement
          await InventoryRepository.recordMovement({
            productId: r.productId,
            productName: r.name,
            sku: r.sku,
            warehouseId: r.warehouseId,
            warehouseName: r.warehouseName,
            type: 'OPENING_BALANCE',
            quantity: baseQty,
            unitCost: r.unitCost,
            referenceNo: documentNo,
            notes: `قيد أرصدة أول المدة - ${r.notes || 'تسجيل رصيد بداية الفترة'}`
          });
        }
      }

      // Log Security & Audit Trail
      await ProductRepository.logAudit('CREATE', 'inventory_opening_balances', documentNo, `اعتماد سند أرصدة أول المدة (${validRows.length} صنف)`, {
        documentNo,
        entryDate,
        totalItems: validRows.length,
        totalValuation: totalValuationEgp
      });

      setIsCommitted(true);
      toast.success(`تم اعتماد أرصدة أول المدة بنجاح وتوثيق القيد المحاسبي وحسابات المخزون!`);
    } catch (err: any) {
      toast.error(err.message || 'حدث خطأ أثناء اعتماد أرصدة أول المدة');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Page Header */}
      <div className="bg-[#151b2b] p-6 rounded-2xl border border-[#1e293b] shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-emerald-500/10 text-emerald-400 rounded-2xl flex items-center justify-center border border-emerald-500/20">
            <Boxes size={26} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-white">إدخال وإدارة أرصدة أول المدة للمخزون</h1>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-mono">
                {documentNo}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              الشاشة المعتمدة لتسجيل وتوثيق مخزون بداية الفترة وتحديد التكاليف ورأس المال المباشر
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#1e293b] hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-all cursor-pointer border border-[#334155]"
          >
            <FileSpreadsheet size={16} className="text-emerald-400" />
            <span>تصدير CSV / Excel</span>
          </button>

          <button
            type="button"
            onClick={handleCommitOpeningBalances}
            disabled={isSaving || isCommitted}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold text-white transition-all shadow-lg cursor-pointer ${
              isCommitted 
                ? 'bg-emerald-600/50 cursor-not-allowed'
                : 'bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 shadow-emerald-600/20'
            }`}
          >
            <Save size={16} />
            <span>{isSaving ? 'جاري الاعتماد والحفظ...' : isCommitted ? 'تم الاعتماد والتسجيل' : 'اعتماد وحفظ أرصدة أول المدة'}</span>
          </button>
        </div>
      </div>

      {/* Control Toolbar & Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Warehouse Selector */}
        <div className="bg-[#151b2b] p-4 rounded-xl border border-[#1e293b]">
          <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
            <WarehouseIcon size={14} className="text-blue-400" />
            المخزن المستهدف (تعيين جماعي)
          </label>
          <select
            value={selectedWarehouseId}
            onChange={(e) => {
              const name = e.target.options[e.target.selectedIndex].text;
              applyWarehouseToAll(e.target.value, name);
            }}
            className="w-full bg-[#0b0f17] border border-[#1e293b] rounded-lg p-2.5 text-xs text-white font-bold focus:outline-none focus:border-blue-500"
          >
            <option value="wh-main">المخزن الرئيسي (Main Warehouse)</option>
            <option value="wh-sub">فرع التجزئة / صالة العرض</option>
            <option value="wh-raw">مخزن المواد الخام والمستلزمات</option>
          </select>
        </div>

        {/* Date Selector */}
        <div className="bg-[#151b2b] p-4 rounded-xl border border-[#1e293b]">
          <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
            <Calendar size={14} className="text-purple-400" />
            تاريخ القيد والجرد
          </label>
          <input
            type="date"
            value={entryDate}
            onChange={(e) => setEntryDate(e.target.value)}
            className="w-full bg-[#0b0f17] border border-[#1e293b] rounded-lg p-2.5 text-xs text-white font-mono focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Category Filter */}
        <div className="bg-[#151b2b] p-4 rounded-xl border border-[#1e293b]">
          <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
            <Filter size={14} className="text-amber-400" />
            تصفية بالحسب الفئة
          </label>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full bg-[#0b0f17] border border-[#1e293b] rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">جميع الفئات التصنيفية ({products.length} صنف)</option>
            {categories.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {/* Live Search */}
        <div className="bg-[#151b2b] p-4 rounded-xl border border-[#1e293b]">
          <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
            <Search size={14} className="text-emerald-400" />
            بحث بالاسم أو الكود
          </label>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="بحث عن صنف..."
            className="w-full bg-[#0b0f17] border border-[#1e293b] rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-blue-500 placeholder:text-slate-600"
          />
        </div>
      </div>

      {/* Summary Valuation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#151b2b] p-4 rounded-xl border border-[#1e293b] flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 block font-bold">الأصناف المسجل لها رصيد</span>
            <span className="text-2xl font-black text-white mt-1 block">{totalItemsCount} <span className="text-xs font-normal text-slate-500">صنف</span></span>
          </div>
          <div className="w-10 h-10 bg-blue-500/10 text-blue-400 rounded-xl flex items-center justify-center font-bold">
            {filteredRows.length}
          </div>
        </div>

        <div className="bg-[#151b2b] p-4 rounded-xl border border-[#1e293b] flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 block font-bold">إجمالي كمية الوحدات</span>
            <span className="text-2xl font-black text-blue-400 mt-1 block">{totalUnitsCount.toLocaleString()} <span className="text-xs font-normal text-slate-500">وحدة</span></span>
          </div>
          <div className="w-10 h-10 bg-blue-500/10 text-blue-400 rounded-xl flex items-center justify-center">
            <Layers size={20} />
          </div>
        </div>

        <div className="bg-[#151b2b] p-4 rounded-xl border border-emerald-500/30 flex items-center justify-between shadow-lg">
          <div>
            <span className="text-xs text-emerald-400 block font-bold">إجمالي تقييم رصيد أول المدة (التكلفة)</span>
            <span className="text-2xl font-black text-emerald-400 mt-1 block">{formatCurrency(totalValuationEgp)}</span>
          </div>
          <div className="w-10 h-10 bg-emerald-500/10 text-emerald-400 rounded-xl flex items-center justify-center">
            <DollarSign size={20} />
          </div>
        </div>
      </div>

      {/* Data Entry Table */}
      <div className="bg-[#151b2b] rounded-2xl border border-[#1e293b] shadow-xl overflow-hidden">
        <div className="p-4 border-b border-[#1e293b] bg-[#0b0f17] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap size={16} className="text-amber-400" />
            <h3 className="font-black text-white text-sm">جدول تسجيل كميات وأسعار أول المدة</h3>
          </div>
          <span className="text-xs text-slate-400">يمكنك الضغط والتنقل بـ Enter بين الحقول بسهولة</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-[#0b0f17] text-slate-400 font-bold border-b border-[#1e293b]">
              <tr>
                <th className="px-4 py-3">كود SKU</th>
                <th className="px-4 py-3">اسم المنتج</th>
                <th className="px-4 py-3">الفئة</th>
                <th className="px-4 py-3">وحدة الرصيد</th>
                <th className="px-4 py-3 text-center">كمية أول المدة</th>
                <th className="px-4 py-3 text-center">تكلفة الوحدة (ج.م)</th>
                <th className="px-4 py-3 text-center">إجمالي القيمة (ج.م)</th>
                <th className="px-4 py-3">التشغيلة / الصلاحية</th>
                <th className="px-4 py-3">ملاحظات الجرد</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e293b]">
              {filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-slate-500 font-bold">
                    لا توجد أصناف مطابقة للتصفية الحالية
                  </td>
                </tr>
              ) : (
                filteredRows.map((r) => {
                  return (
                    <tr key={r.productId} className={`hover:bg-[#1e293b]/50 transition-colors ${r.openingQuantity > 0 ? 'bg-blue-500/5' : ''}`}>
                      <td className="px-4 py-3 font-mono font-bold text-slate-400 whitespace-nowrap">{r.sku}</td>
                      <td className="px-4 py-3 font-bold text-white whitespace-nowrap">{r.name}</td>
                      <td className="px-4 py-3 text-slate-400 whitespace-nowrap">{r.category}</td>
                      
                      {/* Unit Select */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <select
                          value={r.unitId}
                          onChange={(e) => updateRow(r.productId, 'unitId', e.target.value)}
                          className="bg-[#0b0f17] border border-[#1e293b] rounded-lg px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                        >
                          {r.unitsList.map(u => (
                            <option key={u.id} value={u.id}>
                              {u.name} (×{u.factor || 1})
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* Opening Quantity Input */}
                      <td className="px-4 py-3 text-center">
                        <input
                          type="number"
                          min={0}
                          value={r.openingQuantity}
                          onChange={(e) => updateRow(r.productId, 'openingQuantity', Number(e.target.value))}
                          className="w-24 text-center bg-[#0b0f17] border border-[#334155] rounded-lg p-1.5 font-bold text-emerald-400 focus:outline-none focus:border-emerald-500"
                        />
                      </td>

                      {/* Unit Cost Price Input */}
                      <td className="px-4 py-3 text-center">
                        <input
                          type="number"
                          min={0}
                          value={r.unitCost}
                          onChange={(e) => updateRow(r.productId, 'unitCost', Number(e.target.value))}
                          className="w-24 text-center bg-[#0b0f17] border border-[#334155] rounded-lg p-1.5 font-bold text-white focus:outline-none focus:border-blue-500"
                        />
                      </td>

                      {/* Line Valuation Total */}
                      <td className="px-4 py-3 text-center font-bold font-mono text-emerald-400">
                        {formatCurrency(r.totalValuation)}
                      </td>

                      {/* Batch & Expiry Optional */}
                      <td className="px-4 py-3">
                        <input
                          type="text"
                          value={r.batchNumber || ''}
                          onChange={(e) => updateRow(r.productId, 'batchNumber', e.target.value)}
                          placeholder="رقم الوجبة/التشغيلة"
                          className="w-28 bg-[#0b0f17] border border-[#1e293b] rounded-lg p-1 text-[11px] text-slate-300 focus:outline-none"
                        />
                      </td>

                      {/* Notes */}
                      <td className="px-4 py-3">
                        <input
                          type="text"
                          value={r.notes || ''}
                          onChange={(e) => updateRow(r.productId, 'notes', e.target.value)}
                          placeholder="ملاحظات..."
                          className="w-full bg-[#0b0f17] border border-[#1e293b] rounded-lg p-1 text-[11px] text-slate-300 focus:outline-none"
                        />
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
