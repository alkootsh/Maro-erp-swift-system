/**
 * @file Products.tsx
 * @module واجهات وصفحات النظام (UI Pages)
 * @description ملف جزء من نظام MARO ERP. الوظيفة: Products.tsx.
 */
import React, { useEffect, useState } from 'react';
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
  Scale
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
import { Link } from 'react-router-dom';

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
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductMaster | null>(null);
  const [barcodePrintProduct, setBarcodePrintProduct] = useState<ProductMaster | null>(null);
  const [lowStockThreshold, setLowStockThreshold] = useState(5);
  const [showThresholdInput, setShowThresholdInput] = useState(false);

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

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.barcodes && p.barcodes.some(bc => (typeof bc === 'string' ? bc : bc.code).toLowerCase().includes(searchTerm.toLowerCase())));
    const matchesCat = !selectedCategory || p.category === selectedCategory || p.categoryId === selectedCategory;
    return matchesSearch && matchesCat;
  });

  const lowStockProducts = products.filter(p => p.quantity <= (p.reorderLevel || lowStockThreshold));

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
    const dataToExport = products.map(p => ({
      'الاسم': p.name,
      'الرمز (SKU)': p.sku,
      'سعر البيع': p.price,
      'سعر التكلفة': p.costPrice || 0,
      'الكمية الحالية': p.quantity,
      'الفئة': p.category,
      'الماركة': p.brandName || '',
      'حد إعادة الطلب': p.reorderLevel || 5,
      'الوصف': p.description || ''
    }));
    exportToExcel(dataToExport, 'دليل_المنتجات_الشامل');
    toast.success('تم تصدير الدليل بنجاح');
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
                onClick={() => setSearchTerm('')}
                className="text-xs font-bold text-red-400 hover:underline"
              >
                تصفية المنتجات المنخفضة
              </button>
            </div>
          )}

          {/* Action Bar & Controls */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-1 items-center gap-3">
              <div className="relative flex-1 max-w-md">
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
                onClick={() => { setEditingProduct(null); setIsModalOpen(true); }}
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
                <thead className="bg-[#0b0f17] text-slate-400 text-xs font-bold uppercase tracking-wider border-b border-[#1e293b]">
                  <tr>
                    <th className="px-6 py-4">تفاصيل المنتج</th>
                    <th className="px-6 py-4">الرمز (SKU)</th>
                    <th className="px-6 py-4">الفئة والتصنيف</th>
                    <th className="px-6 py-4">سعر البيع</th>
                    <th className="px-6 py-4">الكمية المخزنية</th>
                    <th className="px-6 py-4">حالة المخزون</th>
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
                              <span className="font-bold text-white text-sm block">{product.name}</span>
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
                          <div className="flex items-center gap-2 justify-end">
                            <button 
                              onClick={() => setBarcodePrintProduct(product)}
                              className="p-2 hover:bg-emerald-500/10 text-emerald-400 rounded-lg transition-colors"
                              title="طباعة استيكر وباركود للمنتج"
                            >
                              <Printer size={16} />
                            </button>
                            <button 
                              onClick={() => { setEditingProduct(product); setIsModalOpen(true); }}
                              className="p-2 hover:bg-blue-500/10 text-blue-400 rounded-lg transition-colors"
                              title="تعديل المنتج"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button 
                              onClick={() => handleDelete(product.id, product.name)}
                              className="p-2 hover:bg-red-500/10 text-red-400 rounded-lg transition-colors"
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
