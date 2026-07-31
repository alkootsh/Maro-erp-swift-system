import React, { useEffect, useState } from 'react';
import { 
  Search, 
  RefreshCw, 
  X, 
  AlertTriangle 
} from 'lucide-react';
import { formatCurrency, cn, formatDate } from '../lib/utils';
import { MaroSyncEngine } from '../lib/maroSyncEngine';
import { ProductMaster } from '../types/productMaster';
import { InventoryMovement } from '../types/sprint8';
import { InventoryRepository } from '../repositories/inventoryRepository';
import { ProductRepository } from '../repositories/productRepository';
import { AdjustStockCommand } from '../cqrs/commands';

export const Inventory: React.FC = () => {
  const [products, setProducts] = useState<ProductMaster[]>([]);
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductMaster | null>(null);

  useEffect(() => {
    // Initial Load
    setProducts(ProductRepository.getProducts());
    setMovements(InventoryRepository.getMovements());

    // Reactive subscription to stores
    const unsubProducts = MaroSyncEngine.subscribe<ProductMaster>('products', (data) => {
      setProducts(data || []);
    });
    const unsubMovements = MaroSyncEngine.subscribe<InventoryMovement>('inventory_movements', (data) => {
      setMovements(data || []);
    });

    return () => {
      unsubProducts();
      unsubMovements();
    };
  }, []);

  const totalSKUs = products.length;
  const totalStockQty = products.reduce((sum, p) => sum + (p.quantity || 0), 0);
  const totalStockValuation = products.reduce((sum, p) => sum + ((p.quantity || 0) * (p.costPrice || p.price || 0)), 0);
  const lowStockCount = products.filter(p => (p.quantity || 0) <= (p.reorderLevel || 5)).length;

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.category && p.category.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-[#151b2b] p-5 rounded-2xl border border-[#1e293b]">
          <p className="text-xs font-bold text-slate-500 uppercase">إجمالي الاصناف المسجلة (SKU)</p>
          <p className="text-2xl font-black text-white mt-1">{totalSKUs} صنف</p>
        </div>
        <div className="bg-[#151b2b] p-5 rounded-2xl border border-[#1e293b]">
          <p className="text-xs font-bold text-slate-500 uppercase">إجمالي القطع في المستودع</p>
          <p className="text-2xl font-black text-blue-400 mt-1">{totalStockQty} وحدة</p>
        </div>
        <div className="bg-[#151b2b] p-5 rounded-2xl border border-[#1e293b]">
          <p className="text-xs font-bold text-slate-500 uppercase">تقييم قيمة البضاعة (Cost Value)</p>
          <p className="text-2xl font-black text-emerald-400 mt-1">{formatCurrency(totalStockValuation)}</p>
        </div>
        <div className="bg-[#151b2b] p-5 rounded-2xl border border-[#1e293b]">
          <p className="text-xs font-bold text-slate-500 uppercase">أصناف تحت حد إعادة الطلب</p>
          <p className="text-2xl font-black text-amber-400 mt-1 flex items-center gap-2">
            <AlertTriangle size={20} />
            {lowStockCount} اصناف
          </p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
          <input 
            type="text" 
            placeholder="بحث بالاسم، الكود SKU، أو الفئة..." 
            className="w-full pr-10 pl-4 py-2.5 bg-[#151b2b] border border-[#1e293b] rounded-xl text-white focus:outline-none focus:border-blue-500 transition-all placeholder:text-slate-600 text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button 
          onClick={() => { setSelectedProduct(null); setIsAdjustModalOpen(true); }}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-500 transition-all font-bold shadow-lg shadow-blue-600/20 active:scale-95 text-sm"
        >
          <RefreshCw size={16} />
          <span>إجراء تسوية مخزنية / جرد</span>
        </button>
      </div>

      {/* Stock Table */}
      <div className="bg-[#151b2b] rounded-2xl border border-[#1e293b] shadow-xl overflow-hidden">
        <div className="p-4 border-b border-[#1e293b] bg-slate-900/50 flex items-center justify-between">
          <h3 className="font-bold text-white text-base">رصيد المخزون والأصناف المتاحة بالمستودع الرئيسي</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead className="bg-slate-900/30 text-slate-500 text-[10px] font-bold uppercase tracking-widest">
              <tr>
                <th className="px-6 py-4">كود SKU</th>
                <th className="px-6 py-4">اسم المنتج</th>
                <th className="px-6 py-4">الفئة</th>
                <th className="px-6 py-4">سعر البيع</th>
                <th className="px-6 py-4">تكلفة الوحدة</th>
                <th className="px-6 py-4">الكمية المتاحة</th>
                <th className="px-6 py-4 text-center">التسوية والتعديل</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e293b]">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-600 font-bold">لا توجد أصناف تطابق البحث</td>
                </tr>
              ) : filteredProducts.map((p) => {
                const isLow = (p.quantity || 0) <= (p.reorderLevel || 5);
                return (
                  <tr key={p.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4 font-mono font-bold text-slate-400">{p.sku}</td>
                    <td className="px-6 py-4 font-bold text-white">{p.name}</td>
                    <td className="px-6 py-4 text-xs font-bold text-blue-400">{p.category || 'عام'}</td>
                    <td className="px-6 py-4 font-mono font-bold text-white">{formatCurrency(p.price)}</td>
                    <td className="px-6 py-4 font-mono text-slate-400">{formatCurrency(p.costPrice || p.price)}</td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "font-black font-mono text-sm px-3 py-1 rounded-lg inline-block",
                        isLow ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" : "bg-emerald-500/10 text-emerald-400"
                      )}>
                        {p.quantity} وحدة
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button 
                        onClick={() => { setSelectedProduct(p); setIsAdjustModalOpen(true); }}
                        className="px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 rounded-lg text-xs font-bold transition-all"
                      >
                        تعديل / جرد
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Movements */}
      <div className="bg-[#151b2b] rounded-2xl border border-[#1e293b] shadow-xl overflow-hidden">
        <div className="p-4 border-b border-[#1e293b] bg-slate-900/50">
          <h3 className="font-bold text-white text-base">آخر حركات ودورات المخزون المسجلة</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-900/30 text-slate-500 font-bold uppercase">
              <tr>
                <th className="px-6 py-3">المنتج</th>
                <th className="px-6 py-3">نوع الحركة</th>
                <th className="px-6 py-3">الكمية</th>
                <th className="px-6 py-3">السبب / البيان</th>
                <th className="px-6 py-3">التاريخ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e293b]">
              {movements.slice(0, 10).map((m) => (
                <tr key={m.id} className="hover:bg-slate-800/20">
                  <td className="px-6 py-3 font-bold text-white">{m.productName}</td>
                  <td className="px-6 py-3">
                    <span className={cn(
                      "px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                      m.type === 'PURCHASE' ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
                    )}>
                      {m.type}
                    </span>
                  </td>
                  <td className="px-6 py-3 font-mono font-bold text-white">{m.quantity}</td>
                  <td className="px-6 py-3 text-slate-400">{m.notes || 'حركة مخزنية'}</td>
                  <td className="px-6 py-3 font-mono text-slate-500">{formatDate(new Date(m.createdAt))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Adjust Modal */}
      {isAdjustModalOpen && (
        <AdjustStockModal 
          product={selectedProduct} 
          products={products} 
          onClose={() => setIsAdjustModalOpen(false)} 
        />
      )}
    </div>
  );
};

const AdjustStockModal: React.FC<{ 
  product: ProductMaster | null; 
  products: ProductMaster[]; 
  onClose: () => void 
}> = ({ product, products, onClose }) => {
  const [selectedProdId, setSelectedProdId] = useState<string>(product?.id || products[0]?.id || '');
  const [adjType, setAdjType] = useState<'IN' | 'OUT' | 'ADJUSTMENT' | 'SCRAP'>('ADJUSTMENT');
  const [quantity, setQuantity] = useState<number>(1);
  const [reason, setReason] = useState<string>('تعديل نتيجة جرد دوري للمستودع');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProdId) return;

    try {
      const cmd = new AdjustStockCommand(
        selectedProdId,
        adjType,
        quantity,
        reason,
        'wh_main'
      );
      await cmd.execute();
      onClose();
    } catch (e: any) {
      alert(e.message || 'حدث خطأ أثناء إجراء التسوية');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#151b2b] w-full max-w-md rounded-3xl border border-[#1e293b] shadow-2xl p-6 space-y-4">
        <div className="flex justify-between items-center border-b border-[#1e293b] pb-3">
          <h3 className="font-bold text-lg text-white">إجراء تسوية وحركة مخزنية</h3>
          <button onClick={onClose} className="text-slate-500"><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">المنتج المستهدف</label>
            <select
              className="w-full px-4 py-2.5 bg-[#1e293b] border border-[#334155] rounded-xl text-white outline-none focus:border-blue-500 text-sm"
              value={selectedProdId}
              onChange={(e) => setSelectedProdId(e.target.value)}
            >
              {products.map(p => (
                <option key={p.id} value={p.id}>{p.name} (المتاح: {p.quantity})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">نوع الحركة / التسوية</label>
            <select
              className="w-full px-4 py-2.5 bg-[#1e293b] border border-[#334155] rounded-xl text-white outline-none focus:border-blue-500 text-sm"
              value={adjType}
              onChange={(e) => setAdjType(e.target.value as any)}
            >
              <option value="IN">إدخال مخزني (إضافة +)</option>
              <option value="OUT">إخراج مخزني (خصم -)</option>
              <option value="ADJUSTMENT">تعديل جردي مباشر</option>
              <option value="SCRAP">إتلاف / الهالك المخزني</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">الكمية (وحدة)</label>
            <input 
              required
              type="number" 
              className="w-full px-4 py-2.5 bg-[#1e293b] border border-[#334155] rounded-xl text-white font-mono text-lg font-bold text-center"
              value={quantity}
              onChange={(e) => setQuantity(parseFloat(e.target.value) || 0)}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">سبب الحركة / البيان</label>
            <input 
              required
              type="text" 
              className="w-full px-4 py-2.5 bg-[#1e293b] border border-[#334155] rounded-xl text-white text-sm"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>

          <div className="pt-2 flex gap-3">
            <button 
              type="submit"
              className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-xl font-bold shadow-lg shadow-blue-600/20"
            >
              اعتماد التسوية والمرحل
            </button>
            <button 
              type="button"
              onClick={onClose}
              className="px-6 bg-[#1e293b] text-slate-300 py-3 rounded-xl font-bold"
            >
              إلغاء
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
