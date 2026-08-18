/**
 * @file Products.tsx
 * @module واجهات وصفحات النظام (UI Pages)
 * @description ملف جزء من نظام MARO ERP. الوظيفة: Products.tsx.
 */
import React, { useEffect, useState, useMemo } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Edit2, 
  Trash2, 
  Package, 
  AlertTriangle, 
  Barcode, 
  Download, 
  Upload, 
  Settings2, 
  FolderTree, 
  Award, 
  Layers, 
  Building2, 
  CheckCircle2,
  Printer,
  Scale,
  MoreHorizontal
} from 'lucide-react';
import { formatCurrency, cn } from '../lib/utils';
import { BarcodeScanner } from '../components/BarcodeScanner';
import { exportToExcel, importFromExcel } from '../lib/excel';
import { toast } from 'react-hot-toast';
import { ProductRepository } from '../repositories/productRepository';
import { ProductMaster, ProductCategory, ProductGroup, Brand, Manufacturer } from '../types/productMaster';
import { CategoriesTab } from '../components/products/CategoriesTab';
import { BrandsTab } from '../components/products/BrandsTab';
import { InventorySettingsModal } from '../components/products/InventorySettingsModal';
import { ProductFormModal } from '../components/products/ProductFormModal';
import { QuickProductBarcodePrintModal } from '../components/hardware/QuickProductBarcodePrintModal';
import { ExportOptionsModal, ExportColumnDef } from '../components/common/ExportOptionsModal';
import { TrialLimitService } from '../services/trialLimitService';
import { Link } from 'react-router-dom';
import { ScreenHubTabs } from '../components/common/ScreenHubTabs';

const PRODUCT_EXPORT_COLUMNS: ExportColumnDef[] = [
  { id: 'name', label: 'الاسم (Name)', isDefaultSummary: true },
  { id: 'nameArabic', label: 'الاسم بالعربية (Arabic Name)' },
  { id: 'sku', label: 'الرمز (SKU)', isDefaultSummary: true },
  { id: 'category', label: 'الفئة (Category)', isDefaultSummary: true },
  { id: 'price', label: 'سعر البيع (Sale Price)', isDefaultSummary: true },
  { id: 'costPrice', label: 'سعر التكلفة (Cost Price)' },
  { id: 'quantity', label: 'الكمية الحالية (Quantity)', isDefaultSummary: true },
  { id: 'group', label: 'المجموعة (Group)' },
  { id: 'brandName', label: 'الماركة (Brand)' },
  { id: 'reorderLevel', label: 'حد الطلب (Reorder Level)' },
  { id: 'description', label: 'الوصف (Description)' },
  { id: 'type', label: 'النوع (Type)' },
  { id: 'unit', label: 'الوحدة (Unit)' },
  { id: 'status', label: 'الحالة (Status)' },
];

export const Products: React.FC = () => {
  const [activeMainTab, setActiveMainTab] = useState<'products' | 'categories' | 'brands'>('products');
  const [products, setProducts] = useState<ProductMaster[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [groups, setGroups] = useState<ProductGroup[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [manufacturers, setManufacturers] = useState<Manufacturer[]>([]);

  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductMaster | null>(null);
  const [barcodePrintProduct, setBarcodePrintProduct] = useState<ProductMaster | null>(null);
  const [lowStockThreshold, setLowStockThreshold] = useState(5);
  const [showThresholdInput, setShowThresholdInput] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'needs_completion' | 'low_stock'>('all');

  useEffect(() => {
    const unsubProducts = ProductRepository.subscribeProducts(setProducts, (err) => {
      console.error('Error reading products:', err);
    });
    const unsubCat = ProductRepository.subscribeCategories(setCategories);
    const unsubGrp = ProductRepository.subscribeGroups(setGroups);
    const unsubB = ProductRepository.subscribeBrands(setBrands);
    const unsubM = ProductRepository.subscribeManufacturers((m) => {
      setManufacturers(m);
      setLoading(false);
    });

    return () => {
      unsubProducts();
      unsubCat();
      unsubGrp();
      unsubB();
      unsubM();
    };
  }, []);

  const needsCompletionProducts = useMemo(() => {
    return products.filter(p => p.needsCompletion);
  }, [products]);

  const lowStockProducts = useMemo(() => {
    return products.filter(p => p.quantity <= (p.reorderLevel || lowStockThreshold));
  }, [products, lowStockThreshold]);

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.barcodes && p.barcodes.some(bc => (typeof bc === 'string' ? bc : bc.code).toLowerCase().includes(searchTerm.toLowerCase())));
    const matchesCat = !selectedCategory || p.category === selectedCategory || p.categoryId === selectedCategory;
    
    let matchesStatus = true;
    if (statusFilter === 'needs_completion') {
      matchesStatus = !!p.needsCompletion;
    } else if (statusFilter === 'low_stock') {
      matchesStatus = p.quantity <= (p.reorderLevel || lowStockThreshold);
    }

    return matchesSearch && matchesCat && matchesStatus;
  });

  const handleBarcodeScan = (scannedCode: string) => {
    setSearchTerm(scannedCode);
    setIsScannerOpen(false);
  };

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`هل أنت متأكد من حذف المنتج "${name}"؟`)) {
      try {
        await ProductRepository.deleteProduct(id, name);
        toast.success('تم حذف المنتج بنجاح');
      } catch (error) {
        console.error('Error deleting product:', error);
        toast.error('حدث خطأ أثناء حذف المنتج');
      }
    }
  };

  const handleExportExcel = () => {
    setIsExportModalOpen(true);
  };

  const executeExport = (selectedColumns: string[]) => {
    const dataToExport = products.map(p => {
      const row: any = {};
      selectedColumns.forEach(col => {
        switch (col) {
          case 'name': row['الاسم'] = p.name; break;
          case 'nameArabic': row['الاسم بالعربية'] = p.nameArabic || ''; break;
          case 'sku': row['الرمز (SKU)'] = p.sku; break;
          case 'category': row['الفئة'] = p.category || ''; break;
          case 'price': row['سعر البيع'] = p.price; break;
          case 'costPrice': row['سعر التكلفة'] = p.costPrice || 0; break;
          case 'quantity': row['الكمية الحالية'] = p.quantity; break;
          case 'group': row['المجموعة'] = (p as any).group || p.groupId || ''; break;
          case 'brandName': row['الماركة'] = p.brandName || ''; break;
          case 'reorderLevel': row['حد الطلب'] = p.reorderLevel || 5; break;
          case 'description': row['الوصف'] = p.description || ''; break;
          case 'type': row['النوع'] = (p as any).type === 'service' ? 'خدمة' : 'منتج مخزني'; break;
          case 'unit': row['الوحدة'] = (p as any).unit || p.units?.[0]?.name || ''; break;
          case 'status': row['الحالة'] = p.status === 'active' ? 'نشط' : 'غير نشط'; break;
        }
      });
      return row;
    });
    
    exportToExcel(dataToExport, 'Products_Export');
    toast.success('تم تصدير البيانات بنجاح');
  };

  const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const data = await importFromExcel(file);
      if (data && data.length > 0) {
        for (const item of data) {
          await ProductRepository.addProduct({ ...({} as any),
            name: item['الاسم'] || '',
            sku: item['الرمز (SKU)'] || `SKU-${Math.floor(100000 + Math.random() * 900000)}`,
            price: Number(item['سعر البيع']) || Number(item['السعر']) || 0,
            costPrice: Number(item['سعر التكلفة']) || 0,
            quantity: Number(item['الكمية الحالية']) || Number(item['الكمية']) || 0,
            category: item['الفئة'] || 'عام',
            description: item['الوصف'] || '',
            reorderLevel: Number(item['حد إعادة الطلب']) || 5,
            units: [{ id: 'unit-base', name: 'قطعة', symbol: 'pcs', factor: 1, isBaseUnit: true }],
            barcodes: [],
            warehouseStocks: [],
            priceLists: [],
            batches: [],
            images: [],
            attachments: [],
            isTaxable: true,
            status: 'active',
            openingBalance: Number(item['الكمية الحالية']) || 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });
        }
        toast.success(`تم استيراد ${data.length} منتج بنجاح عبر محرك المزامن MARO Sync Engine`);
      }
    } catch (error) {
      console.error('Error importing:', error);
      toast.error('حدث خطأ أثناء الاستيراد');
    }
    
    if (e.target) e.target.value = '';
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Unified Inventory Hub Tabs */}
      <ScreenHubTabs hub="inventory" />

      {/* Page Header & Module Navigation */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#1e293b] pb-4">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-3">
            <Package className="text-blue-500" size={28} />
            إدارة دليل المنتجات والمخزون المتقدم (Product Master)
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            دليل المنتجات الشامل، الفئات، الماركات، وحدات التعبئة المتعددة، والباركودات
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/hardware-thermal-barcode"
            className="flex items-center gap-2 px-3.5 py-2 bg-gradient-to-r from-blue-600/20 to-cyan-600/20 border border-blue-500/40 text-blue-300 hover:text-white rounded-xl hover:border-blue-400 transition-all text-xs font-bold shadow-sm"
          >
            <Printer size={16} className="text-cyan-400" />
            <span>طباعة الباركود واستيكرات الرف والموازين</span>
          </Link>
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 bg-[#151b2b] border border-[#1e293b] text-slate-300 hover:text-white rounded-xl hover:border-slate-700 transition-all text-xs font-bold"
          >
            <Settings2 size={16} className="text-blue-400" />
            إعدادات المخزون والتقويم
          </button>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-[#1e293b]">
        <button
          onClick={() => setActiveMainTab('products')}
          className={`py-3 px-5 text-sm font-bold flex items-center gap-2 border-b-2 transition-all ${
            activeMainTab === 'products'
              ? 'border-blue-500 text-blue-400 bg-blue-500/10 rounded-t-xl'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <Package size={18} /> دليل المنتجات ({products.length})
        </button>
        <button
          onClick={() => setActiveMainTab('categories')}
          className={`py-3 px-5 text-sm font-bold flex items-center gap-2 border-b-2 transition-all ${
            activeMainTab === 'categories'
              ? 'border-blue-500 text-blue-400 bg-blue-500/10 rounded-t-xl'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <FolderTree size={18} /> الفئات والمجموعات ({categories.length})
        </button>
        <button
          onClick={() => setActiveMainTab('brands')}
          className={`py-3 px-5 text-sm font-bold flex items-center gap-2 border-b-2 transition-all ${
            activeMainTab === 'brands'
              ? 'border-blue-500 text-blue-400 bg-blue-500/10 rounded-t-xl'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <Award size={18} /> الماركات والمصنّعون ({brands.length})
        </button>
      </div>

      {/* TAB CONTENT: Categories */}
      {activeMainTab === 'categories' && <CategoriesTab />}

      {/* TAB CONTENT: Brands */}
      {activeMainTab === 'brands' && <BrandsTab />}

      {/* TAB CONTENT: Products List */}
      {activeMainTab === 'products' && (
        <div className="space-y-6">
          {/* Pending Completion Banner */}
          {needsCompletionProducts.length > 0 && (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex items-center justify-between animate-in fade-in duration-300">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-500/20 text-amber-300 rounded-xl flex items-center justify-center border border-amber-500/30">
                  <Package size={20} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <span>أصناف مضافة سريعاً من فواتير الشراء</span>
                    <span className="bg-amber-500/20 text-amber-300 text-[10px] px-2 py-0.5 rounded-full font-black border border-amber-500/30">
                      {needsCompletionProducts.length} صنف بانتظار استكمال البيانات
                    </span>
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    تمت إضافة هذه الأصناف أثناء تسجيل فواتير المشتريات لتسريع العمل، ويمكنك استكمال تفاصيلها (الفئات، الباركودات، الموردين) في أي وقت.
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setStatusFilter(statusFilter === 'needs_completion' ? 'all' : 'needs_completion')}
                className="text-xs font-black bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 px-3 py-1.5 rounded-xl border border-amber-500/30 transition-colors"
              >
                {statusFilter === 'needs_completion' ? 'عرض جميع الأصناف' : 'تصفية الأصناف غير المكتملة'}
              </button>
            </div>
          )}

          {/* Low Stock Alert Banner */}
          {lowStockProducts.length > 0 && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 flex items-center justify-between animate-in fade-in duration-300">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-500/20 text-red-400 rounded-xl flex items-center justify-center">
                  <AlertTriangle size={20} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">تنبيه مخزون حرِج</h4>
                  <p className="text-xs text-slate-400">
                    يوجد {lowStockProducts.length} منتج وصلت إلى حد إعادة الطلب أو أقل
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setStatusFilter(statusFilter === 'low_stock' ? 'all' : 'low_stock')}
                className="text-xs font-bold text-red-400 hover:underline"
              >
                {statusFilter === 'low_stock' ? 'عرض جميع الأصناف' : 'تصفية المنتجات المنخفضة'}
              </button>
            </div>
          )}

          {/* Action Bar & Controls */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-1 flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-[240px] max-w-md">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input 
                  type="text" 
                  placeholder="البحث باسم المنتج، SKU، الباركود..." 
                  className="w-full pr-10 pl-12 py-2.5 bg-[#151b2b] border border-[#1e293b] rounded-xl text-white focus:outline-none focus:border-blue-500 transition-all text-sm placeholder:text-slate-600"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <button 
                  onClick={() => setIsScannerOpen(true)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-blue-500 transition-colors"
                  title="مسح باركود بالكاميرا"
                >
                  <Barcode size={18} />
                </button>
              </div>

              {/* Status Filter Chips */}
              <div className="flex items-center gap-1.5 bg-[#151b2b] p-1 border border-[#1e293b] rounded-xl text-xs font-bold">
                <button
                  onClick={() => setStatusFilter('all')}
                  className={cn(
                    "px-3 py-1.5 rounded-lg transition-colors",
                    statusFilter === 'all' ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"
                  )}
                >
                  الكل ({products.length})
                </button>
                {needsCompletionProducts.length > 0 && (
                  <button
                    onClick={() => setStatusFilter('needs_completion')}
                    className={cn(
                      "px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5",
                      statusFilter === 'needs_completion' ? "bg-amber-500 text-slate-950 font-black" : "text-amber-400 hover:text-amber-300"
                    )}
                  >
                    <span>بانتظار الاستكمال</span>
                    <span className="bg-amber-950/40 text-amber-200 text-[10px] px-1.5 py-0.2 rounded-full font-mono">
                      {needsCompletionProducts.length}
                    </span>
                  </button>
                )}
                {lowStockProducts.length > 0 && (
                  <button
                    onClick={() => setStatusFilter('low_stock')}
                    className={cn(
                      "px-3 py-1.5 rounded-lg transition-colors",
                      statusFilter === 'low_stock' ? "bg-red-600 text-white" : "text-red-400 hover:text-red-300"
                    )}
                  >
                    نواقص ({lowStockProducts.length})
                  </button>
                )}
              </div>

              {/* Category Filter */}
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-[#151b2b] border border-[#1e293b] text-slate-300 text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:border-blue-500"
              >
                <option value="">جميع الفئات</option>
                {categories.map(c => (
                  <option key={c.id} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-3">
              <button 
                onClick={() => {
                  const check = TrialLimitService.canCreateProduct();
                  if (!check.allowed) {
                    toast.error(check.messageAr || 'تم الوصول للحد الأقصى للأصناف التجريبية (20 صنف). يرجى تفعيل النظام.');
                    return;
                  }
                  setEditingProduct(null); 
                  setIsModalOpen(true); 
                }}
                className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-500 transition-all font-bold text-sm shadow-lg shadow-blue-600/20 active:scale-95"
              >
                <Plus size={18} />
                <span>إضافة منتج جديد</span>
              </button>
              
              <div className="flex bg-[#151b2b] border border-[#1e293b] rounded-xl overflow-hidden">
                <button 
                  onClick={handleExportExcel}
                  className="px-3 py-2.5 hover:bg-slate-800 text-slate-400 hover:text-emerald-400 transition-colors border-l border-[#1e293b]"
                  title="تصدير إلى إكسيل"
                >
                  <Download size={18} />
                </button>
                <label className="px-3 py-2.5 hover:bg-slate-800 text-slate-400 hover:text-blue-400 transition-colors cursor-pointer" title="استيراد من إكسيل">
                  <Upload size={18} />
                  <input type="file" accept=".xlsx, .xls" className="hidden" onChange={handleImportExcel} />
                </label>
              </div>
            </div>
          </div>

          {/* Products Table */}
          <div className="bg-[#151b2b] rounded-2xl border border-[#1e293b] shadow-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-right">
                <thead className="bg-[#0b0f17] text-slate-400 text-xs font-bold uppercase tracking-wider border-b border-[#1e293b] sticky top-0 z-10">
                  <tr>
                    <th className="px-6 py-4">تفاصيل المنتج</th>
                    <th className="px-6 py-4">الرمز (SKU)</th>
                    <th className="px-6 py-4">الفئة</th>
                    <th className="px-6 py-4">سعر البيع</th>
                    <th className="px-6 py-4">الكمية</th>
                    <th className="px-6 py-4">الحالة</th>
                    <th className="px-6 py-4 text-left">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1e293b]">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-slate-500 text-sm">جاري تحميل بيانات دليل المنتجات...</td>
                    </tr>
                  ) : filteredProducts.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-slate-500 text-sm">لا توجد منتجات مطابقة لعملية البحث</td>
                    </tr>
                  ) : filteredProducts.map((product) => {
                    const isLowStock = product.quantity <= (product.reorderLevel || lowStockThreshold);
                    return (
                      <tr key={product.id} className="hover:bg-[#1a2336] transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-[#0b0f17] rounded-xl flex items-center justify-center text-slate-400 border border-[#1e293b] group-hover:border-blue-500/50 transition-colors overflow-hidden">
                              {product.images && product.images.length > 0 ? (
                                <img src={product.images[0].url} alt={product.name} className="w-full h-full object-cover" />
                              ) : (
                                <Package size={20} />
                              )}
                            </div>
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-bold text-white text-sm block">{product.name}</span>
                                {product.needsCompletion && (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-black text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded-full border border-amber-500/30">
                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
                                    <span>مضاف من فاتورة شراء (غير مكتمل)</span>
                                  </span>
                                )}
                              </div>
                              {product.brandName && (
                                <span className="text-[10px] text-amber-400 font-medium">ماركة: {product.brandName}</span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 font-mono text-xs text-slate-400">{product.sku}</td>
                        <td className="px-6 py-4">
                          <span className="inline-block bg-slate-800 text-slate-300 text-xs px-2.5 py-1 rounded-lg">
                            {product.category || 'عام'}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-bold text-blue-400 text-sm">{formatCurrency(product.price)}</td>
                        <td className="px-6 py-4 font-bold text-white text-sm">{product.quantity} قطعة</td>
                        <td className="px-6 py-4">
                          {isLowStock ? (
                            <span className="inline-flex items-center gap-1.5 text-red-400 text-[10px] font-bold uppercase bg-red-500/10 px-2.5 py-1 rounded-lg border border-red-500/20">
                              <AlertTriangle size={12} />
                              منخفض ({product.quantity})
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 text-emerald-400 text-[10px] font-bold uppercase bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                              <CheckCircle2 size={12} />
                              متوفر
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-left">
                          <div className="flex items-center gap-2 justify-end lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                            {product.needsCompletion && (
                              <button
                                onClick={() => { setEditingProduct(product); setIsModalOpen(true); }}
                                className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 rounded-lg text-xs font-black transition-colors flex items-center gap-1"
                                title="استكمال كارتة الصنف وتفاصيل الفئات والباركود"
                              >
                                <Edit2 size={13} />
                                <span>استكمال الكارتة</span>
                              </button>
                            )}
                            <button 
                              onClick={() => setBarcodePrintProduct(product)} 
                              className="p-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-lg transition-colors border border-emerald-500/20"
                              title="طباعة باركود"
                            >
                              <Printer size={16} />
                            </button>
                            <button 
                              onClick={() => { setEditingProduct(product); setIsModalOpen(true); }} 
                              className="p-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-lg transition-colors border border-blue-500/20"
                              title="تعديل المنتج"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button 
                              onClick={() => handleDelete(product.id, product.name)} 
                              className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors border border-red-500/20"
                              title="حذف المنتج"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <ExportOptionsModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        columns={PRODUCT_EXPORT_COLUMNS}
        onExport={executeExport}
        entityName="المنتجات"
      />

      <ProductFormModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        editingProduct={editingProduct}
        categories={categories}
        groups={groups}
        brands={brands}
        manufacturers={manufacturers}
      />

      <InventorySettingsModal 
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />

      {isScannerOpen && (
        <BarcodeScanner 
          onScan={handleBarcodeScan} 
          onClose={() => setIsScannerOpen(false)} 
        />
      )}

      <QuickProductBarcodePrintModal
        isOpen={!!barcodePrintProduct}
        onClose={() => setBarcodePrintProduct(null)}
        product={barcodePrintProduct}
      />
    </div>
  );
};
