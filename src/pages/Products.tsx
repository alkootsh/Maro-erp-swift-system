import React, { useEffect, useState } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  Edit2, 
  Trash2, 
  Package, 
  AlertTriangle,
  ArrowUpDown,
  Barcode
} from 'lucide-react';
import { 
  collection, 
  onSnapshot, 
  query, 
  orderBy, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc,
  writeBatch
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { formatCurrency, cn } from '../lib/utils';
import { BarcodeScanner } from '../components/BarcodeScanner';
import { exportToExcel, importFromExcel } from '../lib/excel';
import { Download, Upload } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface ProductUnit {
  name: string;
  factor: number;
  barcode: string;
  price?: number;
}

interface Product {
  id: string;
  name: string;
  sku: string;
  price: number;
  quantity: number;
  category: string;
  description: string;
  units: ProductUnit[];
  barcodes: string[];
  openingBalance: number;
}

export const Products: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [lowStockThreshold, setLowStockThreshold] = useState(5);
  const [showThresholdInput, setShowThresholdInput] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'products'), orderBy('name'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const productList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
      setProducts(productList);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'products');
    });

    return () => unsubscribe();
  }, []);

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.barcodes.some(bc => bc.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const lowStockProducts = products.filter(p => p.quantity <= lowStockThreshold);

  const handleBarcodeScan = (barcode: string) => {
    setSearchTerm(barcode);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذا المنتج؟')) {
      try {
        await deleteDoc(doc(db, 'products', id));
        toast.success('تم حذف المنتج بنجاح');
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `products/${id}`);
      }
    }
  };

  const handleExportExcel = () => {
    const dataToExport = products.map(p => ({
      'الاسم': p.name,
      'الرمز (SKU)': p.sku,
      'السعر': p.price,
      'الكمية': p.quantity,
      'الفئة': p.category,
      'الوصف': p.description,
      'الرصيد الافتتاحي': p.openingBalance
    }));
    exportToExcel(dataToExport, 'المنتجات');
    toast.success('تم التصدير بنجاح');
  };

  const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const data = await importFromExcel(file);
      if (data && data.length > 0) {
        const batch = writeBatch(db);
        data.forEach(item => {
          const newDocRef = doc(collection(db, 'products'));
          batch.set(newDocRef, {
            name: item['الاسم'] || '',
            sku: item['الرمز (SKU)'] || '',
            price: Number(item['السعر']) || 0,
            quantity: Number(item['الكمية']) || 0,
            category: item['الفئة'] || '',
            description: item['الوصف'] || '',
            openingBalance: Number(item['الرصيد الافتتاحي']) || 0,
            units: [],
            barcodes: []
          });
        });
        await batch.commit();
        toast.success(`تم استيراد ${data.length} منتج بنجاح`);
      }
    } catch (error) {
      console.error('Error importing:', error);
      toast.error('حدث خطأ أثناء الاستيراد');
    }
    
    // Reset file input
    if (e.target) e.target.value = '';
  };

  return (
    <div className="space-y-6">
      {/* Low Stock Alert Banner */}
      {lowStockProducts.length > 0 && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 flex items-center justify-between animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-500/20 text-red-500 rounded-xl flex items-center justify-center">
              <AlertTriangle size={20} />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">تنبيه: مخزون منخفض</h4>
              <p className="text-xs text-slate-400">يوجد {lowStockProducts.length} منتجات وصلت للحد الأدنى ({lowStockThreshold} قطع)</p>
            </div>
          </div>
          <button 
            onClick={() => setSearchTerm('')} // Clear search to see all
            className="text-xs font-bold text-red-400 hover:underline"
          >
            عرض المنتجات
          </button>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
          <input 
            type="text" 
            placeholder="البحث عن منتج بالاسم، الرمز (SKU)، أو الباركود..." 
            className="w-full pr-10 pl-12 py-2.5 bg-[#151b2b] border border-[#1e293b] rounded-xl text-white focus:outline-none focus:border-blue-500 transition-all placeholder:text-slate-600"
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
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-[#151b2b] border border-[#1e293b] rounded-xl p-1">
            {showThresholdInput ? (
              <div className="flex items-center gap-2 px-2">
                <span className="text-[10px] font-bold text-slate-500 uppercase">الحد:</span>
                <input 
                  type="number" 
                  value={lowStockThreshold}
                  onChange={(e) => setLowStockThreshold(Number(e.target.value))}
                  className="w-12 bg-transparent text-xs font-bold text-white focus:outline-none text-center"
                  onBlur={() => setShowThresholdInput(false)}
                  autoFocus
                />
              </div>
            ) : (
              <button 
                onClick={() => setShowThresholdInput(true)}
                className="flex items-center gap-2 px-3 py-1.5 text-slate-400 hover:text-white transition-colors text-xs font-bold"
              >
                <AlertTriangle size={14} className="text-amber-500" />
                <span>تنبيه المخزون: {lowStockThreshold}</span>
              </button>
            )}
          </div>
          <button 
            onClick={() => { setEditingProduct(null); setIsModalOpen(true); }}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-500 transition-all font-bold shadow-lg shadow-blue-600/20 active:scale-95"
          >
            <Plus size={18} />
            <span className="hidden sm:inline">إضافة منتج</span>
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

      <div className="bg-[#151b2b] rounded-2xl border border-[#1e293b] shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead className="bg-slate-900/50 text-slate-500 text-[10px] font-bold uppercase tracking-widest">
              <tr>
                <th className="px-6 py-4">المنتج</th>
                <th className="px-6 py-4">الرمز (SKU)</th>
                <th className="px-6 py-4">الفئة</th>
                <th className="px-6 py-4">السعر</th>
                <th className="px-6 py-4">الكمية</th>
                <th className="px-6 py-4">الحالة</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e293b]">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-600">جاري التحميل...</td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-600">لا توجد منتجات مطابقة للبحث</td>
                </tr>
              ) : filteredProducts.map((product) => (
                <tr key={product.id} className="hover:bg-slate-800/30 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3 justify-end">
                      <span className="font-bold text-white">{product.name}</span>
                      <div className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center text-slate-500 border border-slate-700 group-hover:border-blue-500/50 transition-colors">
                        <Package size={20} />
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-500 font-mono text-xs">{product.sku}</td>
                  <td className="px-6 py-4 text-slate-400 text-sm">{product.category}</td>
                  <td className="px-6 py-4 font-bold text-blue-400">{formatCurrency(product.price)}</td>
                  <td className="px-6 py-4 font-bold text-white">{product.quantity}</td>
                  <td className="px-6 py-4">
                    {product.quantity <= lowStockThreshold ? (
                      <span className="inline-flex items-center gap-1.5 text-red-500 text-[10px] font-bold uppercase tracking-wider bg-red-500/10 px-2 py-1 rounded-lg border border-red-500/20">
                        <AlertTriangle size={12} />
                        مخزون منخفض
                      </span>
                    ) : (
                      <span className="inline-flex text-emerald-500 text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 px-2 py-1 rounded-lg border border-emerald-500/20">
                        متوفر
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 justify-end">
                      <button 
                        onClick={() => { setEditingProduct(product); setIsModalOpen(true); }}
                        className="p-2 hover:bg-blue-500/10 text-blue-400 rounded-lg transition-colors"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        onClick={() => handleDelete(product.id)}
                        className="p-2 hover:bg-red-500/10 text-red-400 rounded-lg transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <ProductModal 
          product={editingProduct} 
          onClose={() => setIsModalOpen(false)} 
        />
      )}

      {isScannerOpen && (
        <BarcodeScanner 
          onScan={handleBarcodeScan} 
          onClose={() => setIsScannerOpen(false)} 
        />
      )}
    </div>
  );
};

const ProductModal: React.FC<{ product: Product | null, onClose: () => void }> = ({ product, onClose }) => {
  const [formData, setFormData] = useState({
    name: product?.name || '',
    sku: product?.sku || '',
    price: product?.price || 0,
    quantity: product?.quantity || 0,
    category: product?.category || '',
    description: product?.description || '',
    units: product?.units || [],
    barcodes: product?.barcodes || [],
    openingBalance: product?.openingBalance || 0,
  });

  const [newBarcode, setNewBarcode] = useState('');
  const [newUnit, setNewUnit] = useState<ProductUnit>({ name: '', factor: 1, barcode: '' });

  const addBarcode = () => {
    if (newBarcode && !formData.barcodes.includes(newBarcode)) {
      setFormData({ ...formData, barcodes: [...formData.barcodes, newBarcode] });
      setNewBarcode('');
    }
  };

  const removeBarcode = (bc: string) => {
    setFormData({ ...formData, barcodes: formData.barcodes.filter(b => b !== bc) });
  };

  const addUnit = () => {
    if (newUnit.name) {
      setFormData({ ...formData, units: [...formData.units, newUnit] });
      setNewUnit({ name: '', factor: 1, barcode: '' });
    }
  };

  const removeUnit = (index: number) => {
    setFormData({ ...formData, units: formData.units.filter((_, i) => i !== index) });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (product) {
        await updateDoc(doc(db, 'products', product.id), formData);
      } else {
        await addDoc(collection(db, 'products'), {
          ...formData,
          quantity: formData.openingBalance + formData.quantity // Initial stock is opening balance
        });
      }
      onClose();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'products');
    }
  };

  return (
    <div className="fixed inset-0 bg-[#0b0f1a]/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#151b2b] w-full max-w-2xl rounded-3xl border border-[#1e293b] shadow-2xl overflow-hidden relative flex flex-col max-h-[90vh]">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 to-emerald-600"></div>
        <div className="p-8 border-b border-[#1e293b] flex items-center justify-between bg-[#0f172a]/50">
          <h3 className="font-black text-xl text-white tracking-tight">
            {product ? 'تعديل منتج' : 'إضافة منتج جديد'}
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-xl text-slate-500 transition-colors">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-8 space-y-6 overflow-y-auto">
          <div className="grid grid-cols-2 gap-6">
            <div className="col-span-2">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">اسم المنتج</label>
              <input 
                required
                type="text" 
                className="w-full px-4 py-3 bg-[#1e293b] border border-[#334155] rounded-2xl text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">الرمز الأساسي (SKU)</label>
              <div className="relative">
                <input 
                  required
                  type="text" 
                  className="w-full px-4 py-3 bg-[#1e293b] border border-[#334155] rounded-2xl text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                />
                <Barcode className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">الفئة</label>
              <input 
                type="text" 
                className="w-full px-4 py-3 bg-[#1e293b] border border-[#334155] rounded-2xl text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">السعر الأساسي</label>
              <input 
                required
                type="number" 
                className="w-full px-4 py-3 bg-[#1e293b] border border-[#334155] rounded-2xl text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">الرصيد الافتتاحي</label>
              <input 
                required
                type="number" 
                className="w-full px-4 py-3 bg-[#1e293b] border border-[#334155] rounded-2xl text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                value={formData.openingBalance}
                onChange={(e) => setFormData({ ...formData, openingBalance: Number(e.target.value) })}
              />
            </div>
          </div>

          {/* Multiple Barcodes */}
          <div className="space-y-4">
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">باركود إضافي</label>
            <div className="flex gap-2">
              <input 
                type="text"
                value={newBarcode}
                onChange={(e) => setNewBarcode(e.target.value)}
                className="flex-1 px-4 py-2 bg-[#1e293b] border border-[#334155] rounded-xl text-white focus:outline-none focus:border-blue-500"
                placeholder="أدخل باركود إضافي..."
              />
              <button 
                type="button"
                onClick={addBarcode}
                className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-500"
              >
                <Plus size={18} />
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.barcodes.map(bc => (
                <span key={bc} className="bg-slate-800 text-slate-300 px-3 py-1 rounded-full text-xs flex items-center gap-2">
                  {bc}
                  <button type="button" onClick={() => removeBarcode(bc)} className="text-red-500 hover:text-red-400"><X size={12} /></button>
                </span>
              ))}
            </div>
          </div>

          {/* Units */}
          <div className="space-y-4">
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">الوحدات</label>
            <div className="grid grid-cols-3 gap-2">
              <input 
                type="text"
                value={newUnit.name}
                onChange={(e) => setNewUnit({ ...newUnit, name: e.target.value })}
                className="px-4 py-2 bg-[#1e293b] border border-[#334155] rounded-xl text-white text-xs"
                placeholder="اسم الوحدة (كرتون...)"
              />
              <input 
                type="number"
                value={newUnit.factor}
                onChange={(e) => setNewUnit({ ...newUnit, factor: Number(e.target.value) })}
                className="px-4 py-2 bg-[#1e293b] border border-[#334155] rounded-xl text-white text-xs"
                placeholder="معامل التحويل"
              />
              <button 
                type="button"
                onClick={addUnit}
                className="bg-emerald-600 text-white rounded-xl hover:bg-emerald-500 flex items-center justify-center"
              >
                <Plus size={18} />
              </button>
            </div>
            <div className="space-y-2">
              {formData.units.map((unit, idx) => (
                <div key={idx} className="flex items-center justify-between bg-slate-800/50 p-3 rounded-xl border border-slate-700">
                  <div className="flex gap-4 text-xs font-bold">
                    <span className="text-white">{unit.name}</span>
                    <span className="text-slate-500">× {unit.factor}</span>
                  </div>
                  <button type="button" onClick={() => removeUnit(idx)} className="text-red-500 hover:text-red-400"><Trash2 size={14} /></button>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">الوصف</label>
            <textarea 
              rows={2}
              className="w-full px-4 py-3 bg-[#1e293b] border border-[#334155] rounded-2xl text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none resize-none transition-all"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>
          <div className="pt-4 flex gap-4">
            <button 
              type="submit"
              className="flex-1 bg-blue-600 text-white py-4 rounded-2xl font-bold hover:bg-blue-500 transition-all shadow-lg shadow-blue-600/20 active:scale-95"
            >
              {product ? 'حفظ التغييرات' : 'إضافة المنتج'}
            </button>
            <button 
              type="button"
              onClick={onClose}
              className="flex-1 bg-[#1e293b] text-slate-300 py-4 rounded-2xl font-bold hover:bg-[#334155] transition-all"
            >
              إلغاء
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const X = ({ size, className }: { size?: number, className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size || 24} 
    height={size || 24} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
  </svg>
);
