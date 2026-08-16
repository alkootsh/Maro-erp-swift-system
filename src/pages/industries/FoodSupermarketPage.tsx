/**
 * @file FoodSupermarketPage.tsx
 * @module واجهات وصفحات النظام (UI Pages)
 * @description ملف جزء من نظام MARO ERP. الوظيفة: FoodSupermarketPage.tsx.
 */
// MARO ERP - Food, Supermarket, Multi-Units & Scale Barcode Module
// Master Enterprise Protocol v4.0 - Clean Architecture
import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import { 
  ShoppingBag, 
  Scale, 
  Calendar, 
  AlertTriangle, 
  Barcode, 
  Percent, 
  TrendingUp, 
  Search, 
  Plus, 
  CheckCircle2, 
  Printer, 
  RefreshCw,
  Layers,
  Box,
  Package,
  Boxes,
  ArrowRightLeft,
  DollarSign,
  Tag,
  Clock,
  Sparkles,
  ChevronDown,
  ChevronUp,
  X,
  FileSpreadsheet,
  Edit2
} from 'lucide-react';
import { IndustryModuleEngine } from '../../lib/industryModuleEngine';
import { FoodSupermarketProduct, ProductUnitConversion, FoodUnitType } from '../../types/industryModules';
import { cn } from '../../lib/utils';

export function formatMultiUnitStock(totalBase: number, units?: ProductUnitConversion[]): string {
  if (!units || units.length === 0) return `${totalBase} قطعة`;
  const sorted = [...units].sort((a, b) => b.factor - a.factor);
  let rem = totalBase;
  const parts: string[] = [];

  for (const u of sorted) {
    if (u.factor > 0) {
      const count = Math.floor(rem / u.factor);
      if (count > 0 || sorted.length === 1) {
        parts.push(`${count} ${u.unitName}`);
        rem %= u.factor;
      }
    }
  }

  if (parts.length === 0) return `0 ${sorted[sorted.length - 1]?.unitName || 'قطعة'}`;
  return parts.join(' و ');
}

export const FoodSupermarketPage: React.FC = () => {
  const [products, setProducts] = useState<FoodSupermarketProduct[]>([]);
  const [activeTab, setActiveTab] = useState<'units' | 'scale' | 'expiry' | 'promotions'>('units');

  React.useEffect(() => {
    setProducts(IndustryModuleEngine.getFoodSupermarketProducts());
  }, []);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('ALL');
  
  // Scale simulator state
  const [scaleInputBarcode, setScaleInputBarcode] = useState('9900105014508'); // Prefix 99, PLU 00105 (جبن رومي), Weight 1.450kg, Checksum 8
  const [scaleCustomPLU, setScaleCustomPLU] = useState('00105');
  const [scaleCustomWeightGrams, setScaleCustomWeightGrams] = useState(1450);
  const [decodedResult, setDecodedResult] = useState<any>(null);
  const [decodeTimeMs, setDecodeTimeMs] = useState<number | null>(null);

  // Add/Edit Product Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [prodNameAr, setProdNameAr] = useState('');
  const [prodDepartment, setProdDepartment] = useState<FoodSupermarketProduct['department']>('بقالة جافة ومعلبات');
  const [isWeightedProd, setIsWeightedProd] = useState(false);
  const [scaleItemCode, setScaleItemCode] = useState('');
  const [defaultPricePerKg, setDefaultPricePerKg] = useState(250);
  const [baseUnit, setBaseUnit] = useState<FoodUnitType>('قطعة');
  const [batchNumber, setBatchNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [storageTemp, setStorageTemp] = useState<FoodSupermarketProduct['storageTemp']>('عادي (درجة الغرفة)');
  const [stockBase, setStockBase] = useState(120);

  // Multi-unit opening stock breakdown inputs
  const [unitStockMap, setUnitStockMap] = useState<Record<string, number>>({
    'كرتونة': 1,
    'علبة': 2,
    'قطعة': 24
  });

  const calculateTotalStockFromUnits = (map: Record<string, number>, units: ProductUnitConversion[]) => {
    let total = 0;
    for (const u of units) {
      const qty = map[u.unitName] || 0;
      total += qty * (u.factor || 1);
    }
    return total;
  };

  // Units builder in modal
  const [modalUnits, setModalUnits] = useState<ProductUnitConversion[]>([
    {
      id: 'u_ctn',
      unitName: 'كرتونة',
      factor: 24,
      barcode: '6221100240999',
      costPrice: 480,
      wholesalePrice: 550,
      retailPrice: 600,
      isBaseUnit: false
    },
    {
      id: 'u_box',
      unitName: 'علبة',
      factor: 6,
      barcode: '6221100060999',
      costPrice: 125,
      wholesalePrice: 142,
      retailPrice: 155,
      isBaseUnit: false
    },
    {
      id: 'u_pcs',
      unitName: 'قطعة',
      factor: 1,
      barcode: '6221100010999',
      costPrice: 21,
      wholesalePrice: 24,
      retailPrice: 26,
      isBaseUnit: true,
      isDefaultSalesUnit: true
    }
  ]);

  const handleUpdateModalUnit = (index: number, field: keyof ProductUnitConversion, value: any) => {
    setModalUnits(prev => prev.map((u, i) => i === index ? { ...u, [field]: value } : u));
  };

  const handleAddModalUnit = () => {
    setModalUnits(prev => [
      ...prev,
      {
        id: `u_custom_${Date.now()}`,
        unitName: 'وحدة جديدة' as FoodUnitType,
        factor: 1,
        barcode: `622110${Math.floor(100000 + Math.random() * 900000)}`,
        costPrice: 10,
        wholesalePrice: 12,
        retailPrice: 15,
        isBaseUnit: false
      }
    ]);
  };

  const handleRemoveModalUnit = (index: number) => {
    if (modalUnits.length <= 1) {
      toast.error('يجب بقاء وحدة قياسية واحدة على الأقل للصنف');
      return;
    }
    setModalUnits(prev => prev.filter((_, i) => i !== index));
  };

  const handleOpenAddProduct = () => {
    setEditingProductId(null);
    setProdNameAr('');
    setProdDepartment('بقالة جافة ومعلبات');
    setIsWeightedProd(false);
    setScaleItemCode('');
    setDefaultPricePerKg(250);
    setBaseUnit('قطعة');
    setBatchNumber(`LOT-${new Date().getFullYear()}-GEN`);
    setExpiryDate(new Date(Date.now() + 180 * 86400000).toISOString().split('T')[0]);
    setStorageTemp('عادي (درجة الغرفة)');
    setStockBase(120);
    const initialUnits = [
      {
        id: 'u_ctn',
        unitName: 'كرتونة' as FoodUnitType,
        factor: 24,
        barcode: '6221100240999',
        costPrice: 480,
        wholesalePrice: 550,
        retailPrice: 600,
        isBaseUnit: false
      },
      {
        id: 'u_box',
        unitName: 'علبة' as FoodUnitType,
        factor: 6,
        barcode: '6221100060999',
        costPrice: 125,
        wholesalePrice: 142,
        retailPrice: 155,
        isBaseUnit: false
      },
      {
        id: 'u_pcs',
        unitName: 'قطعة' as FoodUnitType,
        factor: 1,
        barcode: '6221100010999',
        costPrice: 21,
        wholesalePrice: 24,
        retailPrice: 26,
        isBaseUnit: true,
        isDefaultSalesUnit: true
      }
    ];
    setModalUnits(initialUnits);
    setUnitStockMap({ 'كرتونة': 1, 'علبة': 2, 'قطعة': 24 });
    setShowAddModal(true);
  };

  const handleOpenEditProduct = (prod: FoodSupermarketProduct) => {
    setEditingProductId(prod.id);
    setProdNameAr(prod.nameAr);
    setProdDepartment(prod.department);
    setIsWeightedProd(!!prod.isWeighted);
    setScaleItemCode(prod.scaleItemCode || '');
    setDefaultPricePerKg(prod.defaultPricePerKg || 250);
    setBaseUnit(prod.baseUnit || 'قطعة');
    setBatchNumber(prod.batchNumber || '');
    setExpiryDate(prod.expiryDate || '');
    setStorageTemp(prod.storageTemp || 'عادي (درجة الغرفة)');
    setStockBase(prod.stockInBaseUnit || 0);
    const units = prod.units && prod.units.length > 0 ? prod.units : [
      {
        id: 'u_pcs',
        unitName: 'قطعة' as FoodUnitType,
        factor: 1,
        barcode: '6221100010999',
        costPrice: 20,
        wholesalePrice: 25,
        retailPrice: 30,
        isBaseUnit: true
      }
    ];
    setModalUnits(units);
    
    // Breakdown prod.stockInBaseUnit into modalUnits
    const map: Record<string, number> = {};
    const sorted = [...units].sort((a, b) => b.factor - a.factor);
    let rem = prod.stockInBaseUnit || 0;
    for (const u of sorted) {
      if (u.factor > 0) {
        const count = Math.floor(rem / u.factor);
        map[u.unitName] = count;
        rem %= u.factor;
      } else {
        map[u.unitName] = 0;
      }
    }
    setUnitStockMap(map);
    setShowAddModal(true);
  };

  // Unit conversion tester
  const [calcSelectedProduct, setCalcSelectedProduct] = useState<string>(products[0]?.id || '');
  const [calcCartons, setCalcCartons] = useState(2);
  const [calcBoxes, setCalcBoxes] = useState(3);
  const [calcPieces, setCalcPieces] = useState(5);

  const departments = [
    'ALL',
    'بقالة جافة ومعلبات',
    'ألبان وأجبان',
    'لحوم ودواجن طازجة',
    'خضروات وفواكه',
    'مخبوزات وحلويات',
    'منظفات وعناية منزلية',
    'مشروبات ومياه'
  ];

  // Decode scale barcode handler
  const handleDecodeScaleBarcode = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const t0 = performance.now();
    const result = IndustryModuleEngine.decodeScaleBarcode(scaleInputBarcode, products);
    const t1 = performance.now();
    setDecodeTimeMs(Number((t1 - t0).toFixed(2)));
    setDecodedResult(result);
  };

  // Generate scale barcode from PLU and weight
  const handleGenerateScaleBarcode = () => {
    const plu = scaleCustomPLU.padStart(5, '0');
    const weightStr = Math.round(scaleCustomWeightGrams).toString().padStart(5, '0');
    const prefix = '99';
    // Calculate simple EAN check digit
    const raw12 = `${prefix}${plu}${weightStr}`;
    let sum = 0;
    for (let i = 0; i < 12; i++) {
      const digit = parseInt(raw12[i], 10);
      sum += (i % 2 === 0) ? digit : digit * 3;
    }
    const checkDigit = (10 - (sum % 10)) % 10;
    const generated = `${raw12}${checkDigit}`;
    setScaleInputBarcode(generated);
    
    // Auto decode
    const t0 = performance.now();
    const res = IndustryModuleEngine.decodeScaleBarcode(generated, products);
    const t1 = performance.now();
    setDecodeTimeMs(Number((t1 - t0).toFixed(2)));
    setDecodedResult(res);
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodNameAr) {
      toast.error('يرجى كتابة اسم المنتج');
      return;
    }

    const existingProd = products.find(p => p.id === editingProductId);
    const targetId = editingProductId || `food_${Date.now()}`;
    const targetCode = existingProd?.code || `PRD-FD-${Math.floor(100 + Math.random() * 900)}`;

    const newProd: FoodSupermarketProduct = {
      id: targetId,
      code: targetCode,
      nameAr: prodNameAr,
      department: prodDepartment,
      isWeighted: isWeightedProd,
      scaleItemCode: isWeightedProd ? scaleItemCode || '00999' : undefined,
      defaultPricePerKg: isWeightedProd ? defaultPricePerKg : undefined,
      baseUnit,
      batchNumber: batchNumber || `LOT-${new Date().getFullYear()}-GEN`,
      expiryDate: expiryDate || new Date(Date.now() + 180 * 86400000).toISOString().split('T')[0],
      storageTemp,
      stockInBaseUnit: stockBase,
      minStockAlert: Math.round(stockBase * 0.15),
      units: isWeightedProd ? [
        {
          id: `u_${Date.now()}_kg`,
          unitName: 'كيلوجرام',
          factor: 1,
          barcode: `99${(scaleItemCode || '00999').padStart(5, '0')}000000`,
          costPrice: Math.round(defaultPricePerKg * 0.75),
          wholesalePrice: Math.round(defaultPricePerKg * 0.88),
          retailPrice: defaultPricePerKg,
          isBaseUnit: true,
          isDefaultSalesUnit: true
        }
      ] : modalUnits
    };

    IndustryModuleEngine.saveFoodSupermarketProduct(newProd);
    setProducts(IndustryModuleEngine.getFoodSupermarketProducts());
    toast.success(editingProductId ? 'تم تحديث الصنف وأسعار جميع الوحدات بنجاح!' : 'تم إضافة الصنف وأسعار الوحدات بنجاح!');
    setShowAddModal(false);
    setEditingProductId(null);
    setProdNameAr('');
    setScaleItemCode('');
  };

  const filteredProducts = products.filter(p => {
    const matchesDept = selectedDepartment === 'ALL' || p.department === selectedDepartment;
    const matchesSearch = p.nameAr.includes(searchQuery) || p.code.toLowerCase().includes(searchQuery.toLowerCase()) || (p.batchNumber && p.batchNumber.includes(searchQuery));
    return matchesDept && matchesSearch;
  });

  const selectedCalcProd = products.find(p => p.id === calcSelectedProduct) || products[0];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-[#151b2b] border border-emerald-500/30 rounded-3xl p-6 shadow-2xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-green-600"></div>
        <div className="flex items-center gap-4">
          <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-2xl shadow-lg shadow-emerald-500/10">
            <ShoppingBag size={32} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-white tracking-tight">موديول المواد الغذائية، السوبر ماركت وتعدد الوحدات</h1>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold font-mono">
                Multi-Unit & Scale EAN-13
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              تعدد الوحدات (كرتونة / علبة / قطعة / شيكارة) بباركود وأسعار مستقلة، فك وتوليد باركود موازين اللحوم والأجبان، وتتبع الصلاحيات
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={handleOpenAddProduct}
            className="px-5 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-2xl font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-600/20 transition-all active:scale-95 whitespace-nowrap"
          >
            <Plus size={18} />
            <span>إضافة صنف غذائي متعدد الوحدات / ميزان</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-[#1e293b] pb-3">
        <button 
          onClick={() => setActiveTab('units')}
          className={cn(
            "flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold transition-all",
            activeTab === 'units' ? "bg-emerald-600/20 text-emerald-300 border border-emerald-500/40 shadow-md" : "text-slate-400 hover:text-white"
          )}
        >
          <Boxes size={16} />
          <span>كتالوج الأصناف وتعدد الوحدات ({products.length})</span>
        </button>

        <button 
          onClick={() => { setActiveTab('scale'); if (!decodedResult) handleDecodeScaleBarcode(); }}
          className={cn(
            "flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold transition-all",
            activeTab === 'scale' ? "bg-emerald-600/20 text-emerald-300 border border-emerald-500/40 shadow-md" : "text-slate-400 hover:text-white"
          )}
        >
          <Scale size={16} />
          <span>محاكي وفك وتوليد باركود الميزان EAN-13</span>
        </button>

        <button 
          onClick={() => setActiveTab('expiry')}
          className={cn(
            "flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold transition-all",
            activeTab === 'expiry' ? "bg-emerald-600/20 text-emerald-300 border border-emerald-500/40 shadow-md" : "text-slate-400 hover:text-white"
          )}
        >
          <Calendar size={16} />
          <span>تتبع الصلاحيات والتشغيلات الحرجة (Batches)</span>
        </button>

        <button 
          onClick={() => setActiveTab('promotions')}
          className={cn(
            "flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold transition-all",
            activeTab === 'promotions' ? "bg-emerald-600/20 text-emerald-300 border border-emerald-500/40 shadow-md" : "text-slate-400 hover:text-white"
          )}
        >
          <Percent size={16} />
          <span>عروض باقات التوفير والكميات (BOGO)</span>
        </button>
      </div>

      {/* Tab 1: Multi-Units Catalog & Conversion */}
      {activeTab === 'units' && (
        <div className="space-y-6">
          {/* Quick Unit Conversion Calculator Bar */}
          <div className="bg-[#151b2b] border border-[#1e293b] rounded-3xl p-5 shadow-xl">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/30">
                  <ArrowRightLeft size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-white text-xs">محول الوحدات التلقائي السريع لكاشير ومخزن السوبرماركت</h3>
                  <p className="text-[11px] text-slate-400">تحويل فوري بين (الكرتونة والعلبة والقطعة) وحساب المخزون الإجمالي المتاح</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <select 
                  value={calcSelectedProduct} 
                  onChange={(e) => setCalcSelectedProduct(e.target.value)}
                  className="bg-[#0f172a] border border-[#1e293b] rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-emerald-500 max-w-[220px]"
                >
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.nameAr}</option>
                  ))}
                </select>

                {selectedCalcProd?.units.find(u => u.unitName === 'كرتونة') && (
                  <div className="flex items-center gap-1.5 bg-[#0f172a] px-3 py-1.5 rounded-xl border border-[#1e293b]">
                    <span className="text-[11px] text-slate-400 font-bold">كرتونة:</span>
                    <input 
                      type="number" 
                      min="0" 
                      value={calcCartons} 
                      onChange={(e) => setCalcCartons(Number(e.target.value))}
                      className="w-12 bg-transparent text-center font-bold text-white text-xs outline-none"
                    />
                  </div>
                )}

                {selectedCalcProd?.units.find(u => u.unitName === 'علبة') && (
                  <div className="flex items-center gap-1.5 bg-[#0f172a] px-3 py-1.5 rounded-xl border border-[#1e293b]">
                    <span className="text-[11px] text-slate-400 font-bold">علبة:</span>
                    <input 
                      type="number" 
                      min="0" 
                      value={calcBoxes} 
                      onChange={(e) => setCalcBoxes(Number(e.target.value))}
                      className="w-12 bg-transparent text-center font-bold text-white text-xs outline-none"
                    />
                  </div>
                )}

                <div className="flex items-center gap-1.5 bg-[#0f172a] px-3 py-1.5 rounded-xl border border-[#1e293b]">
                  <span className="text-[11px] text-slate-400 font-bold">{selectedCalcProd?.baseUnit || 'قطعة'}:</span>
                  <input 
                    type="number" 
                    min="0" 
                    value={calcPieces} 
                    onChange={(e) => setCalcPieces(Number(e.target.value))}
                    className="w-12 bg-transparent text-center font-bold text-white text-xs outline-none"
                  />
                </div>

                {/* Calculation Result */}
                {selectedCalcProd && (
                  <div className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs font-bold font-mono">
                    الإجمالي: {
                      (calcCartons * (selectedCalcProd.units.find(u => u.unitName === 'كرتونة')?.factor || 0)) +
                      (calcBoxes * (selectedCalcProd.units.find(u => u.unitName === 'علبة')?.factor || 0)) +
                      calcPieces
                    } {selectedCalcProd.baseUnit} (رصيد المخزن الحالي: {selectedCalcProd.stockInBaseUnit} {selectedCalcProd.baseUnit})
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative w-full sm:w-80">
              <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
              <input 
                type="text" 
                placeholder="بحث باسم الصنف الغذائي، الكود، الباركود أو رقم التشغيلة..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-4 pr-10 py-2.5 bg-[#151b2b] border border-[#1e293b] rounded-2xl text-xs text-white focus:border-emerald-500 outline-none"
              />
            </div>

            <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1">
              {departments.map(dept => (
                <button
                  key={dept}
                  onClick={() => setSelectedDepartment(dept)}
                  className={cn(
                    "px-3 py-1.5 rounded-xl text-[11px] font-bold whitespace-nowrap transition-all",
                    selectedDepartment === dept 
                      ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/30" 
                      : "bg-[#151b2b] text-slate-400 hover:text-white border border-[#1e293b]"
                  )}
                >
                  {dept === 'ALL' ? 'جميع الأقسام الغذائية' : dept}
                </button>
              ))}
            </div>
          </div>

          {/* Products Grid with Multi-Units */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map(prod => (
              <div 
                key={prod.id} 
                className="bg-[#151b2b] border border-[#1e293b] hover:border-emerald-500/40 rounded-3xl p-5 shadow-xl transition-all space-y-4 flex flex-col justify-between"
              >
                <div>
                  {/* Top badges */}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="px-2.5 py-0.5 rounded-lg bg-slate-800 text-slate-300 font-mono text-[10px] border border-slate-700">
                      {prod.code}
                    </span>
                    {prod.isWeighted ? (
                      <span className="px-2.5 py-0.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold text-[10px] flex items-center gap-1">
                        <Scale size={12} />
                        <span>ميزان EAN-13 (PLU: {prod.scaleItemCode})</span>
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold text-[10px] flex items-center gap-1">
                        <Boxes size={12} />
                        <span>{prod.units.length} وحدات قياس</span>
                      </span>
                    )}
                  </div>

                  <h3 className="font-bold text-white text-sm line-clamp-2">{prod.nameAr}</h3>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
                    <span>القسم: <strong className="text-slate-300">{prod.department}</strong></span>
                    <span>حرارة الحفظ: <strong className="text-slate-300">{prod.storageTemp || 'عادي'}</strong></span>
                  </div>

                  {/* Units Breakout Table */}
                  <div className="mt-4 bg-[#0f172a] rounded-2xl p-3 border border-[#1e293b] space-y-2">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center justify-between">
                      <span>أسعار الوحدات والباركودات المخصصة:</span>
                      <span className="text-emerald-400 font-mono">الأساسية: {prod.baseUnit}</span>
                    </p>

                    <div className="space-y-1.5">
                      {prod.units.map((u, uIdx) => (
                        <div key={u.id || uIdx} className="p-2.5 bg-[#151b2b] rounded-xl border border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold text-[10px] border border-emerald-500/20">
                              {u.unitName === 'كرتونة' ? 'ك' : u.unitName === 'علبة' ? 'ع' : 'ق'}
                            </div>
                            <div>
                              <p className="font-bold text-white text-xs">{u.unitName} <span className="text-[10px] text-slate-400 font-mono">({u.factor} {prod.baseUnit})</span></p>
                              <p className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                                <Barcode size={10} />
                                <span>{u.barcode}</span>
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 font-mono text-left">
                            <div className="bg-slate-900/80 px-2 py-1 rounded-lg border border-slate-800 text-center">
                              <span className="text-[9px] text-slate-400 block">تكلفة</span>
                              <span className="text-amber-400 font-bold text-[11px]">{u.costPrice || 0} ج.م</span>
                            </div>
                            <div className="bg-slate-900/80 px-2 py-1 rounded-lg border border-slate-800 text-center">
                              <span className="text-[9px] text-slate-400 block">جملة</span>
                              <span className="text-blue-400 font-bold text-[11px]">{u.wholesalePrice || 0} ج.م</span>
                            </div>
                            <div className="bg-emerald-500/10 px-2 py-1 rounded-lg border border-emerald-500/30 text-center">
                              <span className="text-[9px] text-emerald-400 block">مستهلك</span>
                              <span className="text-emerald-300 font-black text-[11px]">{u.retailPrice || 0} ج.م</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Bottom Stock & Batch Bar & Edit Button */}
                <div className="pt-3 border-t border-[#1e293b] flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[10px] text-slate-500 block">رصيد المخزن المتاح</span>
                    <span className="font-black text-emerald-400 font-mono text-xs">{formatMultiUnitStock(prod.stockInBaseUnit, prod.units)}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => handleOpenEditProduct(prod)}
                      className="px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 rounded-xl text-[11px] font-bold flex items-center gap-1 transition-all"
                    >
                      <Edit2 size={13} />
                      <span>تعديل الأسعار والوحدات</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 2: Scale Barcode Engine & Label Generator */}
      {activeTab === 'scale' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Scale Barcode Decoder & Tester */}
          <div className="lg:col-span-6 space-y-6">
            <div className="bg-[#151b2b] border border-[#1e293b] rounded-3xl p-6 space-y-6 shadow-xl">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-white text-sm flex items-center gap-2">
                  <Scale className="text-emerald-400" size={18} />
                  <span>محاكي وفك باركود الموازين الإلكترونية (EAN-13 Weighted)</span>
                </h3>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold border border-emerald-500/20 font-mono">
                  Standard 99 / 20 / 21
                </span>
              </div>

              <p className="text-xs text-slate-400">
                يقوم محرك مارو الذكي بفك تشفير الباركود الموزون واستخراج كود الصنف (PLU) والوزن الصافي والقيمة الإجمالية تلقائياً في أقل من 15 ملي ثانية.
              </p>

              <form onSubmit={handleDecodeScaleBarcode} className="space-y-4">
                <div>
                  <label className="text-xs text-slate-400 font-bold block mb-1">
                    امسح بالماسح الضوئي أو أدخل باركود الميزان المطبوع (13 رقماً):
                  </label>
                  <div className="relative">
                    <input 
                      type="text" 
                      className="w-full p-4 bg-[#0f172a] border border-[#1e293b] rounded-2xl text-emerald-300 font-mono text-center text-lg tracking-wider focus:border-emerald-500 outline-none"
                      value={scaleInputBarcode}
                      onChange={(e) => setScaleInputBarcode(e.target.value)}
                    />
                    <Barcode className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button 
                    type="submit" 
                    className="flex-1 py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-2xl font-bold text-xs shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 size={16} />
                    <span>فك التشفير وحساب السعر والوزن</span>
                  </button>

                  <button 
                    type="button" 
                    onClick={() => { setScaleInputBarcode('9900210008505'); }}
                    className="px-4 py-3.5 bg-[#0f172a] hover:bg-slate-800 text-slate-300 border border-[#1e293b] rounded-2xl text-xs font-bold transition-all"
                  >
                    مثال (لحم مفروم 850جم)
                  </button>
                </div>
              </form>

              {/* Decoded Breakdown Card */}
              {decodedResult && decodedResult.success ? (
                <div className="p-5 bg-[#0f172a] rounded-2xl border border-emerald-500/30 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-emerald-500/10 text-emerald-400 rounded-xl flex items-center justify-center border border-emerald-500/20">
                        <CheckCircle2 size={20} />
                      </div>
                      <div>
                        <h4 className="font-bold text-white text-sm">{decodedResult.product?.nameAr || 'صنف ميزان عام'}</h4>
                        <p className="text-[11px] text-slate-400 font-mono">كود الصنف PLU: {decodedResult.scaleItemCode}</p>
                      </div>
                    </div>

                    {decodeTimeMs !== null && (
                      <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg text-[10px] font-bold font-mono">
                        ⚡ سرعة المعالجة: {decodeTimeMs}ms
                      </span>
                    )}
                  </div>

                  {/* Digits Breakdown Graphic */}
                  <div className="bg-[#151b2b] p-3 rounded-xl border border-slate-800 space-y-1">
                    <p className="text-[10px] text-slate-400 font-bold">تشريح خانات كود EAN-13:</p>
                    <div className="flex items-center gap-1 font-mono text-center text-xs">
                      <div className="flex-1 bg-emerald-500/20 text-emerald-300 p-1.5 rounded-lg border border-emerald-500/30">
                        <span className="block font-bold">{decodedResult.prefix}</span>
                        <span className="text-[9px] text-slate-400">بادئة ميزان</span>
                      </div>
                      <div className="flex-1 bg-teal-500/20 text-teal-300 p-1.5 rounded-lg border border-teal-500/30">
                        <span className="block font-bold">{decodedResult.scaleItemCode}</span>
                        <span className="text-[9px] text-slate-400">كود PLU</span>
                      </div>
                      <div className="flex-1 bg-cyan-500/20 text-cyan-300 p-1.5 rounded-lg border border-cyan-500/30">
                        <span className="block font-bold">{decodedResult.weightGrams}g</span>
                        <span className="text-[9px] text-slate-400">الوزن بالجرام</span>
                      </div>
                      <div className="w-12 bg-slate-800 text-slate-300 p-1.5 rounded-lg border border-slate-700">
                        <span className="block font-bold">{decodedResult.checksum}</span>
                        <span className="text-[9px] text-slate-400">تدقيق</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3 font-mono text-center">
                    <div className="p-3 bg-[#151b2b] rounded-xl border border-slate-800">
                      <p className="text-[10px] text-slate-500 uppercase">الوزن الصافي</p>
                      <p className="text-lg font-black text-emerald-400">{decodedResult.weightKg.toFixed(3)} كجم</p>
                    </div>

                    <div className="p-3 bg-[#151b2b] rounded-xl border border-slate-800">
                      <p className="text-[10px] text-slate-500 uppercase">سعر الكيلو</p>
                      <p className="text-lg font-black text-white">{decodedResult.unitPricePerKg} ج.م</p>
                    </div>

                    <div className="p-3 bg-[#151b2b] rounded-xl border border-slate-800">
                      <p className="text-[10px] text-slate-500 uppercase">القيمة الإجمالية</p>
                      <p className="text-lg font-black text-emerald-400">{decodedResult.totalPrice} ج.م</p>
                    </div>
                  </div>
                </div>
              ) : decodedResult?.error ? (
                <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-400 text-xs flex items-center gap-2">
                  <AlertTriangle size={18} />
                  <span>{decodedResult.error}</span>
                </div>
              ) : null}
            </div>
          </div>

          {/* Right Column: Scale Label Generator & Thermal Sticker Preview */}
          <div className="lg:col-span-6 space-y-6">
            <div className="bg-[#151b2b] border border-[#1e293b] rounded-3xl p-6 space-y-6 shadow-xl">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-white text-sm flex items-center gap-2">
                  <Printer className="text-emerald-400" size={18} />
                  <span>توليد وطباعة ملصق الميزان الإلكتروني (Scale Label Designer)</span>
                </h3>
                <span className="text-[11px] text-slate-400">معاينة فورية لطابعات الباركود الحرارية</span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-400 font-bold block mb-1">اختر صنف الميزان (PLU):</label>
                  <select 
                    value={scaleCustomPLU} 
                    onChange={(e) => {
                      setScaleCustomPLU(e.target.value);
                      const matched = products.find(p => p.scaleItemCode === e.target.value);
                      if (matched && matched.defaultPricePerKg) {
                        // Keep synced
                      }
                    }}
                    className="w-full p-3 bg-[#0f172a] border border-[#1e293b] rounded-2xl text-xs text-white outline-none focus:border-emerald-500"
                  >
                    {products.filter(p => p.isWeighted).map(p => (
                      <option key={p.id} value={p.scaleItemCode || '00105'}>
                        {p.nameAr} ({p.scaleItemCode} - {p.defaultPricePerKg} ج.م/كجم)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs text-slate-400 font-bold block mb-1">الوزن على الميزان (بالجرام):</label>
                  <input 
                    type="number" 
                    step="10"
                    min="50"
                    max="99990"
                    value={scaleCustomWeightGrams} 
                    onChange={(e) => setScaleCustomWeightGrams(Number(e.target.value))}
                    className="w-full p-3 bg-[#0f172a] border border-[#1e293b] rounded-2xl text-xs text-white font-mono text-center outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <button 
                type="button" 
                onClick={handleGenerateScaleBarcode}
                className="w-full py-3 bg-[#0f172a] hover:bg-slate-800 text-emerald-400 border border-emerald-500/30 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-all"
              >
                <Sparkles size={16} />
                <span>توليد كود EAN-13 وتحديث معاينة الملصق</span>
              </button>

              {/* Thermal Label Sticker Visual */}
              <div className="bg-white text-black p-6 rounded-2xl shadow-2xl border-4 border-slate-300 max-w-sm mx-auto font-sans space-y-3">
                <div className="text-center border-b border-black pb-2">
                  <h4 className="font-black text-base tracking-tight">سوبرماركت وهايبر مارو</h4>
                  <p className="text-[10px] text-slate-700">قسم الأجبان والمصنعات الطازجة</p>
                </div>

                <div className="text-center">
                  <h5 className="font-bold text-sm">
                    {products.find(p => p.scaleItemCode === scaleCustomPLU)?.nameAr || 'جبن رومي قديم مبشور فاخر'}
                  </h5>
                  <p className="text-[10px] font-mono text-slate-600">PLU: {scaleCustomPLU}</p>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center border-t border-b border-dashed border-black py-2 font-mono">
                  <div>
                    <span className="text-[9px] text-slate-600 block">الوزن الصافي</span>
                    <span className="font-black text-sm">{(scaleCustomWeightGrams / 1000).toFixed(3)} كجم</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-600 block">سعر الكيلو</span>
                    <span className="font-bold text-xs">{products.find(p => p.scaleItemCode === scaleCustomPLU)?.defaultPricePerKg || 340} ج.م</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-600 block">الإجمالي</span>
                    <span className="font-black text-base text-emerald-800">
                      {((scaleCustomWeightGrams / 1000) * (products.find(p => p.scaleItemCode === scaleCustomPLU)?.defaultPricePerKg || 340)).toFixed(2)} ج.م
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[9px] text-slate-600 font-mono">
                  <span>تاريخ التعبئة: {new Date().toISOString().split('T')[0]}</span>
                  <span>صالح لمدة 30 يوماً</span>
                </div>

                {/* Barcode Graphic Representation */}
                <div className="text-center pt-2">
                  <div className="h-10 bg-slate-900 mx-auto w-full flex items-center justify-center">
                    {/* Simulated bars */}
                    <div className="w-full h-full flex items-center justify-around px-2">
                      {[...Array(38)].map((_, i) => (
                        <div key={i} className={cn("h-full bg-white", (i % 3 === 0 || i % 7 === 0) ? "w-1" : "w-0.5")} />
                      ))}
                    </div>
                  </div>
                  <p className="font-mono text-xs tracking-widest font-black mt-1">{scaleInputBarcode}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Expiry & Batch Control */}
      {activeTab === 'expiry' && (
        <div className="bg-[#151b2b] border border-[#1e293b] rounded-3xl overflow-hidden shadow-xl space-y-4 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#1e293b]">
            <div>
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <AlertTriangle className="text-amber-400" size={18} />
                <span>جدول متابعة الصلاحيات والتشغيلات (Batches & Expiry Dates)</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">تتبع أوتوماتيكي قبل انتهاء الصلاحية وجدولة التخفيضات للأصناف الغذائية</p>
            </div>

            <div className="flex items-center gap-3">
              <span className="px-3 py-1 bg-red-500/20 text-red-400 border border-red-500/30 rounded-xl text-xs font-bold font-mono">
                1 صنف حرج (&lt; 15 يوم)
              </span>
              <span className="px-3 py-1 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-xl text-xs font-bold font-mono">
                2 صنف تحذير (&lt; 90 يوم)
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-right">
              <thead className="text-slate-400 border-b border-[#1e293b]">
                <tr>
                  <th className="p-4 font-bold">اسم المنتج الغذائي</th>
                  <th className="p-4 font-bold">القسم</th>
                  <th className="p-4 font-bold">رقم التشغيلة (Batch)</th>
                  <th className="p-4 font-bold">تاريخ الانتهاء</th>
                  <th className="p-4 font-bold text-center">الرصيد المتاح</th>
                  <th className="p-4 font-bold text-center">حالة الصلاحية</th>
                  <th className="p-4 font-bold text-center">إجراء سريع</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e293b]">
                {products.map((item, idx) => {
                  const isNear = idx === 3;
                  const isMedium = idx === 1;
                  return (
                    <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="p-4 font-bold text-white">
                        <div>{item.nameAr}</div>
                        <div className="text-[10px] text-slate-500 font-mono">{item.code}</div>
                      </td>
                      <td className="p-4 text-slate-300">{item.department}</td>
                      <td className="p-4 font-mono text-emerald-400">{item.batchNumber || `LOT-2026-${idx + 10}`}</td>
                      <td className="p-4 font-mono text-slate-300">{item.expiryDate || '2027-06-30'}</td>
                      <td className="p-4 text-center font-bold text-emerald-400 font-mono text-xs">{formatMultiUnitStock(item.stockInBaseUnit, item.units)}</td>
                      <td className="p-4 text-center">
                        {isNear ? (
                          <span className="px-3 py-1 bg-red-500/20 text-red-400 border border-red-500/30 rounded-xl font-bold text-[10px]">
                            حرج (باقي 12 يوماً)
                          </span>
                        ) : isMedium ? (
                          <span className="px-3 py-1 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-xl font-bold text-[10px]">
                            تحذير (باقي 60 يوماً)
                          </span>
                        ) : (
                          <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-xl font-bold text-[10px]">
                            صلاحية ممتازة
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-center">
                        <button 
                          onClick={() => alert(`تم تطبيق خصم تصريف 25% على ${item.nameAr}`)}
                          className="px-3 py-1.5 bg-[#0f172a] hover:bg-emerald-600 text-slate-300 hover:text-white border border-[#1e293b] rounded-xl text-[11px] font-bold transition-all"
                        >
                          تطبيق خصم تصريف 25%
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: Promotions */}
      {activeTab === 'promotions' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { 
              title: 'عرض باقة الإفطار العائلية التوفيرية', 
              desc: 'جبن رومي 500جم مبشور + 1 كرتونة حليب جهينة (12 عبوة) + علبة تونة بسعر 540 ج.م بدلاً من 680 ج.م', 
              active: true, 
              tag: 'عرض باقة مجمعة',
              discount: 'توفير 140 ج.م' 
            },
            { 
              title: 'عرض اشترِ 2 واحصل على 1 مجاناً (BOGO)', 
              desc: 'على جميع عبوات تونة صن شاين 185جم عند الشراء بالقطعة للمستهلك', 
              active: true, 
              tag: 'اشترِ 2 واحصل على 1',
              discount: 'مجاني 100%' 
            },
            { 
              title: 'خصم الجملة للكراتين والشيكارات', 
              desc: 'خصم 10% إضافي عند شراء 5 كراتين فما فوق من منتجات الألبان والمعلبات', 
              active: true, 
              tag: 'خصم كميات جملة',
              discount: 'خصم 10%' 
            }
          ].map((promo, idx) => (
            <div key={idx} className="bg-[#151b2b] border border-[#1e293b] hover:border-emerald-500/40 rounded-3xl p-6 space-y-4 shadow-xl transition-all flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-lg text-[10px] font-bold">
                    {promo.tag}
                  </span>
                  <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 rounded text-[10px] font-bold font-mono">
                    {promo.discount}
                  </span>
                </div>
                <h4 className="font-bold text-white text-base">{promo.title}</h4>
                <p className="text-xs text-slate-400 leading-relaxed">{promo.desc}</p>
              </div>

              <div className="pt-3 border-t border-[#1e293b] flex items-center justify-between text-xs">
                <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  نشط تلقائياً على نقاط البيع POS
                </span>
                <button className="text-slate-400 hover:text-white font-bold text-[11px]">تعديل الشروط</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal: Add Food Product with Multi-Units or Scale Barcode */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#151b2b] border border-emerald-500/40 rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto relative">
            <button 
              onClick={() => setShowAddModal(false)}
              className="absolute left-6 top-6 text-slate-400 hover:text-white p-2 rounded-full bg-slate-800"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-3">
              <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-2xl border border-emerald-500/30">
                <ShoppingBag size={24} />
              </div>
              <div>
                <h3 className="text-lg font-black text-white">إضافة صنف غذائي جديد (تعدد الوحدات والميزان)</h3>
                <p className="text-xs text-slate-400">تحديد كرتونة / علبة / قطعة بباركود مستقل أو تفعيل باركود ميزان EAN-13</p>
              </div>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-400 font-bold block mb-1">اسم الصنف الغذائي:</label>
                  <input 
                    type="text" 
                    required
                    placeholder="مثال: بسكويت شاي فاخر سادة"
                    value={prodNameAr}
                    onChange={(e) => setProdNameAr(e.target.value)}
                    className="w-full p-3 bg-[#0f172a] border border-[#1e293b] rounded-xl text-xs text-white focus:border-emerald-500 outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-400 font-bold block mb-1">القسم الغذائي:</label>
                  <select 
                    value={prodDepartment}
                    onChange={(e) => setProdDepartment(e.target.value as any)}
                    className="w-full p-3 bg-[#0f172a] border border-[#1e293b] rounded-xl text-xs text-white focus:border-emerald-500 outline-none"
                  >
                    {departments.filter(d => d !== 'ALL').map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Toggle Scale Product vs Standard Packaged Multi-Unit */}
              <div className="p-4 bg-[#0f172a] rounded-2xl border border-[#1e293b] space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={isWeightedProd}
                    onChange={(e) => setIsWeightedProd(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-500 focus:ring-0"
                  />
                  <div>
                    <span className="text-xs font-bold text-white block">صنف ميزان إلكتروني مشفر (EAN-13 Scale Weighted)</span>
                    <span className="text-[10px] text-slate-400">للأجبان واللحوم والخضار المباعة بالوزن عبر كود الميزان</span>
                  </div>
                </label>

                {isWeightedProd ? (
                  <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-800">
                    <div>
                      <label className="text-[11px] text-slate-400 font-bold block mb-1">كود الميزان (PLU 5 أرقام):</label>
                      <input 
                        type="text" 
                        maxLength={5}
                        placeholder="مثال: 00340"
                        value={scaleItemCode}
                        onChange={(e) => setScaleItemCode(e.target.value)}
                        className="w-full p-2.5 bg-[#151b2b] border border-slate-800 rounded-xl text-xs text-white font-mono text-center focus:border-emerald-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-400 font-bold block mb-1">سعر الكيلوجرام للمستهلك:</label>
                      <input 
                        type="number" 
                        value={defaultPricePerKg}
                        onChange={(e) => setDefaultPricePerKg(Number(e.target.value))}
                        className="w-full p-2.5 bg-[#151b2b] border border-slate-800 rounded-xl text-xs text-white font-mono text-center focus:border-emerald-500 outline-none"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3 pt-2 border-t border-slate-800">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-slate-200">وحدات القياس وأسعارها المخصصة (كرتونة / علبة / قطعة):</span>
                      <button 
                        type="button" 
                        onClick={handleAddModalUnit}
                        className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-lg text-[10px] font-bold hover:bg-emerald-500/20"
                      >
                        + إضافة وحدة إضافية
                      </button>
                    </div>

                    <div className="space-y-3">
                      {modalUnits.map((u, idx) => (
                        <div key={idx} className="p-3 bg-[#151b2b] rounded-2xl border border-slate-800 space-y-2">
                          <div className="grid grid-cols-12 gap-2 items-center">
                            <div className="col-span-3">
                              <label className="text-[9px] text-slate-400 block mb-0.5">اسم الوحدة:</label>
                              <input 
                                type="text"
                                value={u.unitName}
                                onChange={(e) => handleUpdateModalUnit(idx, 'unitName', e.target.value)}
                                className="w-full bg-[#0f172a] border border-slate-700 rounded-lg p-1.5 text-xs text-white font-bold"
                              />
                            </div>
                            <div className="col-span-2">
                              <label className="text-[9px] text-slate-400 block mb-0.5">المعامل:</label>
                              <input 
                                type="number"
                                min="1"
                                value={u.factor}
                                onChange={(e) => handleUpdateModalUnit(idx, 'factor', Number(e.target.value))}
                                className="w-full bg-[#0f172a] border border-slate-700 rounded-lg p-1.5 text-xs text-white font-mono text-center"
                              />
                            </div>
                            <div className="col-span-3">
                              <label className="text-[9px] text-amber-400 font-bold block mb-0.5">سعر التكلفة:</label>
                              <input 
                                type="number"
                                min="0"
                                value={u.costPrice}
                                onChange={(e) => handleUpdateModalUnit(idx, 'costPrice', Number(e.target.value))}
                                className="w-full bg-[#0f172a] border border-amber-500/40 rounded-lg p-1.5 text-xs text-amber-300 font-bold font-mono text-center"
                              />
                            </div>
                            <div className="col-span-3">
                              <label className="text-[9px] text-blue-400 font-bold block mb-0.5">سعر الجملة:</label>
                              <input 
                                type="number"
                                min="0"
                                value={u.wholesalePrice}
                                onChange={(e) => handleUpdateModalUnit(idx, 'wholesalePrice', Number(e.target.value))}
                                className="w-full bg-[#0f172a] border border-blue-500/40 rounded-lg p-1.5 text-xs text-blue-300 font-bold font-mono text-center"
                              />
                            </div>
                            <div className="col-span-1 text-center pt-3">
                              <button 
                                type="button" 
                                onClick={() => handleRemoveModalUnit(idx)}
                                className="text-red-400 hover:text-red-300 text-xs p-1"
                              >
                                <X size={14} />
                              </button>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-800/60">
                            <div>
                              <label className="text-[9px] text-emerald-400 font-bold block mb-0.5">سعر المستهلك / القطاعي:</label>
                              <input 
                                type="number"
                                min="0"
                                value={u.retailPrice}
                                onChange={(e) => handleUpdateModalUnit(idx, 'retailPrice', Number(e.target.value))}
                                className="w-full bg-[#0f172a] border border-emerald-500/50 rounded-lg p-1.5 text-xs text-emerald-300 font-black font-mono text-center"
                              />
                            </div>
                            <div>
                              <label className="text-[9px] text-slate-400 block mb-0.5">باركود الوحدة المخصص:</label>
                              <input 
                                type="text"
                                value={u.barcode}
                                onChange={(e) => handleUpdateModalUnit(idx, 'barcode', e.target.value)}
                                className="w-full bg-[#0f172a] border border-slate-700 rounded-lg p-1.5 text-xs text-slate-300 font-mono"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Multi-Unit Opening Stock Breakdown Section */}
              <div className="p-3 bg-[#0f172a] rounded-2xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-amber-400">توزيع رصيد أول المدة لكل وحدة (كرتونة / علبة / قطعة):</span>
                  <span className="text-emerald-400 font-mono font-bold">
                    إجمالي الرصيد بالمخزن: {stockBase} {baseUnit}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {modalUnits.map((u, uIdx) => (
                    <div key={u.id || uIdx} className="bg-[#151b2b] p-2 rounded-xl border border-slate-800 text-center">
                      <span className="text-[10px] text-slate-400 block mb-1 font-bold">{u.unitName} (معامل: {u.factor})</span>
                      <input 
                        type="number"
                        min="0"
                        value={unitStockMap[u.unitName] ?? 0}
                        onChange={(e) => {
                          const val = Number(e.target.value) || 0;
                          const updatedMap = { ...unitStockMap, [u.unitName]: val };
                          setUnitStockMap(updatedMap);
                          const total = calculateTotalStockFromUnits(updatedMap, modalUnits);
                          setStockBase(total);
                        }}
                        className="w-full bg-[#0f172a] border border-slate-700 rounded-lg p-1.5 text-xs text-emerald-300 font-black font-mono text-center"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Batch & Expiry */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-slate-400 font-bold block mb-1">رقم التشغيلة (Batch #):</label>
                  <input 
                    type="text" 
                    placeholder="LOT-2026-AUG"
                    value={batchNumber}
                    onChange={(e) => setBatchNumber(e.target.value)}
                    className="w-full p-2.5 bg-[#0f172a] border border-[#1e293b] rounded-xl text-xs text-white focus:border-emerald-500 outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-400 font-bold block mb-1">تاريخ انتهاء الصلاحية:</label>
                  <input 
                    type="date" 
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                    className="w-full p-2.5 bg-[#0f172a] border border-[#1e293b] rounded-xl text-xs text-white focus:border-emerald-500 outline-none font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 pt-4 border-t border-[#1e293b]">
                <button 
                  type="submit" 
                  className="flex-1 py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-2xl font-bold text-xs shadow-lg shadow-emerald-600/20"
                >
                  حفظ الصنف وتفعيل الوحدات والباركود
                </button>
                <button 
                  type="button" 
                  onClick={() => setShowAddModal(false)}
                  className="px-5 py-3.5 bg-[#0f172a] hover:bg-slate-800 text-slate-300 rounded-2xl font-bold text-xs"
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
