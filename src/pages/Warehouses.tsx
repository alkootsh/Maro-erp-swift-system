/**
 * @file Warehouses.tsx
 * @module واجهات وصفحات النظام (UI Pages)
 * @description ملف جزء من نظام MARO ERP. الوظيفة: Warehouses.tsx.
 */
import React, { useEffect, useState } from 'react';
import { 
  Plus, 
  Search, 
  Warehouse, 
  ArrowRightLeft, 
  MoreVertical, 
  Edit2, 
  Trash2, 
  X,
  Package,
  Settings,
  ChevronRight,
  History,
  TrendingUp
} from 'lucide-react';
import { formatCurrency, cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { MaroSyncEngine } from '../lib/maroSyncEngine';
import { CreateWarehouseCommand, UpdateWarehouseCommand, DeleteWarehouseCommand } from '../cqrs/commands';
import { GetWarehousesQuery, SearchProductsQuery } from '../cqrs/queries';
import { ProductMaster, WarehouseData } from '../types/productMaster';

interface WarehouseProduct {
  productId: string;
  productName: string;
  quantity: number;
  sku: string;
  category: string;
}

export const Warehouses: React.FC = () => {
  const [warehouses, setWarehouses] = useState<WarehouseData[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'list' | 'transfers'>('list');
  const [selectedWarehouse, setSelectedWarehouse] = useState<WarehouseData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState<WarehouseData | null>(null);

  useEffect(() => {
    const unsub = MaroSyncEngine.subscribe<WarehouseData>('warehouses', (data) => {
      setWarehouses(data);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleDeleteWarehouse = async (id: string, name: string) => {
    if (confirm(`هل أنت تأكد من حذف المخزن: ${name}؟`)) {
      const cmd = new DeleteWarehouseCommand(id, name);
      await cmd.execute();
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-black text-white tracking-tight">إدارة المخازن</h2>
          <div className="flex bg-[#151b2b] p-1 rounded-xl border border-[#1e293b]">
            <button 
              onClick={() => setActiveTab('list')}
              className={cn(
                "px-4 py-1.5 rounded-lg text-xs font-bold transition-all",
                activeTab === 'list' ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" : "text-slate-500 hover:text-slate-300"
              )}
            >
              قائمة المخازن
            </button>
            <button 
              onClick={() => setActiveTab('transfers')}
              className={cn(
                "px-4 py-1.5 rounded-lg text-xs font-bold transition-all",
                activeTab === 'transfers' ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" : "text-slate-500 hover:text-slate-300"
              )}
            >
              التحويلات المخزنية
            </button>
          </div>
        </div>
        <button 
          onClick={() => { setEditingWarehouse(null); setIsModalOpen(true); }}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-2xl hover:bg-blue-500 transition-all font-bold shadow-lg shadow-blue-600/20 active:scale-95"
        >
          <Plus size={20} />
          <span>إضافة مخزن جديد</span>
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'list' ? (
          <motion.div 
            key="list"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {loading ? (
              <div className="col-span-full text-center py-20 text-slate-500 font-bold">جاري تحميل البيانات من محرك المزامن MARO Sync Engine...</div>
            ) : warehouses.length === 0 ? (
              <div className="col-span-full text-center py-20 text-slate-500 font-bold">لا توجد مخازن مضافة بعد. اضغط على إضافة مخزن جديد.</div>
            ) : (
              warehouses.map(w => (
                <div key={w.id} className="bg-[#151b2b] p-8 rounded-3xl border border-[#1e293b] shadow-xl relative overflow-hidden group hover:border-blue-500/50 transition-all">
                  <div className="flex items-start justify-between mb-6">
                    <div className="w-12 h-12 bg-blue-600/10 text-blue-500 rounded-2xl flex items-center justify-center border border-blue-500/20">
                      <Warehouse size={24} />
                    </div>
                    <div className="flex items-center gap-2">
                      {w.isMain && (
                        <span className="px-3 py-1 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-lg text-[10px] font-bold uppercase tracking-widest">المخزن الرئيسي</span>
                      )}
                      <button 
                        onClick={() => { setEditingWarehouse(w); setIsModalOpen(true); }}
                        className="p-2 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition-colors"
                      >
                        <Edit2 size={16} />
                      </button>
                      {!w.isMain && (
                        <button 
                          onClick={() => handleDeleteWarehouse(w.id, w.name)}
                          className="p-2 hover:bg-red-500/10 rounded-xl text-slate-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </div>

                  <h3 className="font-black text-xl text-white tracking-tight mb-2">{w.name}</h3>
                  <p className="text-slate-400 text-xs font-medium mb-6">{w.location || 'لا يوجد عنوان مسجل'}</p>

                  <div className="pt-6 border-t border-[#1e293b] flex items-center justify-between">
                    <button 
                      onClick={() => setSelectedWarehouse(w)}
                      className="flex items-center gap-2 text-blue-500 hover:text-blue-400 font-bold text-xs transition-colors"
                    >
                      <span>عرض محتويات المخزن</span>
                      <ChevronRight size={16} className="rotate-180" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </motion.div>
        ) : (
          <TransfersList />
        )}
      </AnimatePresence>

      {selectedWarehouse && (
        <WarehouseDetails warehouse={selectedWarehouse} onClose={() => setSelectedWarehouse(null)} />
      )}

      {isModalOpen && (
        <WarehouseModal warehouse={editingWarehouse} onClose={() => setIsModalOpen(false)} />
      )}
    </div>
  );
};

const WarehouseDetails: React.FC<{ warehouse: WarehouseData, onClose: () => void }> = ({ warehouse, onClose }) => {
  const [products, setProducts] = useState<WarehouseProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [visibleColumns, setVisibleColumns] = useState(['sku', 'name', 'category', 'quantity']);

  useEffect(() => {
    const fetchProducts = async () => {
      const query = new SearchProductsQuery('', 'all', 'all');
      const allProds = await query.execute();
      setProducts(allProds.map(p => ({
        productId: p.id,
        productName: p.name,
        sku: p.sku,
        category: p.category,
        quantity: p.quantity || 0
      })));
      setLoading(false);
    };
    fetchProducts();
  }, [warehouse.id]);

  return (
    <div className="fixed inset-0 bg-[#0b0f1a]/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#151b2b] w-full max-w-6xl rounded-3xl border border-[#1e293b] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-8 border-b border-[#1e293b] flex items-center justify-between bg-[#0f172a]/50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-blue-600/20">
              <Warehouse size={24} />
            </div>
            <div>
              <h3 className="font-black text-2xl text-white tracking-tight">تفاصيل مخزن: {warehouse.name}</h3>
              <p className="text-slate-500 font-bold text-sm mt-1">{warehouse.location}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-xl text-slate-500 transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="p-8 bg-[#0f172a]/30 border-b border-[#1e293b] grid grid-cols-4 gap-6">
          <div className="bg-[#1e293b] p-6 rounded-2xl border border-[#334155]">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">إجمالي الأصناف</p>
            <p className="text-2xl font-black text-white">{products.length}</p>
          </div>
          <div className="bg-[#1e293b] p-6 rounded-2xl border border-[#334155]">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">إجمالي الكميات</p>
            <p className="text-2xl font-black text-blue-500">{products.reduce((s, p) => s + p.quantity, 0)}</p>
          </div>
          <div className="bg-[#1e293b] p-6 rounded-2xl border border-[#334155]">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">معمارية التخزين</p>
            <p className="text-sm font-black text-emerald-500">PostgreSQL Offline-First</p>
          </div>
          <div className="bg-[#1e293b] p-6 rounded-2xl border border-[#334155]">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">حالة المزامن</p>
            <p className="text-sm font-black text-amber-500">MARO Sync Active</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-8">
          <table className="w-full text-right">
            <thead className="text-slate-500 text-[10px] font-bold uppercase tracking-widest border-b border-[#1e293b]">
              <tr>
                <th className="px-4 py-4">الرمز (SKU)</th>
                <th className="px-4 py-4">اسم المنتج</th>
                <th className="px-4 py-4">الفئة</th>
                <th className="px-4 py-4">الكمية المتوفرة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e293b]">
              {loading ? (
                <tr><td colSpan={4} className="py-20 text-center text-slate-600">جاري التحميل...</td></tr>
              ) : products.map(p => (
                <tr key={p.productId} className="hover:bg-slate-800/20 transition-colors">
                  <td className="px-4 py-4 text-slate-500 font-mono text-xs">{p.sku}</td>
                  <td className="px-4 py-4 font-bold text-white">{p.productName}</td>
                  <td className="px-4 py-4 text-slate-400 text-xs">{p.category}</td>
                  <td className="px-4 py-4 font-black text-lg text-white">{p.quantity}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const TransfersList: React.FC = () => {
  const [transfers, setTransfers] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const unsub = MaroSyncEngine.subscribe('warehouse_transfers', (data) => {
      setTransfers(data);
    });
    return () => unsub();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-black text-white tracking-tight">سجل التحويلات</h3>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-2xl hover:bg-emerald-500 transition-all font-bold shadow-lg shadow-emerald-600/20 active:scale-95"
        >
          <ArrowRightLeft size={20} />
          <span>تحويل مخزني جديد</span>
        </button>
      </div>

      <div className="bg-[#151b2b] rounded-3xl border border-[#1e293b] shadow-2xl overflow-hidden">
        <table className="w-full text-right">
          <thead className="bg-[#0f172a]/50 text-slate-500 text-[10px] font-bold uppercase tracking-widest">
            <tr>
              <th className="px-8 py-5">رقم العملية</th>
              <th className="px-8 py-5">من مخزن</th>
              <th className="px-8 py-5">إلى مخزن</th>
              <th className="px-8 py-5">عدد الأصناف</th>
              <th className="px-8 py-5">التاريخ</th>
              <th className="px-8 py-5">الحالة</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1e293b]">
            {transfers.length === 0 ? (
              <tr><td colSpan={6} className="py-20 text-center text-slate-600">لا توجد تحويلات حالياً</td></tr>
            ) : transfers.map(t => (
              <tr key={t.id} className="hover:bg-slate-800/30 transition-colors">
                <td className="px-8 py-5 font-bold text-white">#{t.id.slice(0, 8)}</td>
                <td className="px-8 py-5 text-slate-400">{t.fromWarehouseName}</td>
                <td className="px-8 py-5 text-slate-400">{t.toWarehouseName}</td>
                <td className="px-8 py-5 font-black text-white">{t.itemsCount}</td>
                <td className="px-8 py-5 text-slate-500 text-xs">{new Date(t.date).toLocaleDateString('ar-EG')}</td>
                <td className="px-8 py-5">
                  <span className="px-3 py-1 bg-emerald-500/10 text-emerald-500 text-[10px] font-bold uppercase tracking-widest rounded-lg border border-emerald-500/20">مكتمل</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && <TransferModal onClose={() => setIsModalOpen(false)} />}
    </div>
  );
};

const TransferModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [fromId, setFromId] = useState('');
  const [toId, setToId] = useState('');
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const wCmd = new GetWarehousesQuery();
      setWarehouses(await wCmd.execute());
      const pCmd = new SearchProductsQuery('', 'all', 'all');
      setProducts(await pCmd.execute());
    };
    fetchData();
  }, []);

  const addItem = (prod: any) => {
    if (items.find(i => i.productId === prod.id)) return;
    setItems([...items, { productId: prod.id, name: prod.name, quantity: 1 }]);
  };

  const handleSubmit = async () => {
    if (!fromId || !toId || items.length === 0) return;
    try {
      const fromW = warehouses.find(w => w.id === fromId);
      const toW = warehouses.find(w => w.id === toId);
      const transferDoc = {
        id: `tr_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`,
        fromWarehouseId: fromId,
        fromWarehouseName: fromW?.name || '',
        toWarehouseId: toId,
        toWarehouseName: toW?.name || '',
        itemsCount: items.length,
        items,
        date: new Date().toISOString()
      };
      await MaroSyncEngine.saveDocument('warehouse_transfers', transferDoc, true);
      onClose();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="fixed inset-0 bg-[#0b0f1a]/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#151b2b] w-full max-w-4xl rounded-3xl border border-[#1e293b] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-8 border-b border-[#1e293b] flex items-center justify-between bg-[#0f172a]/50">
          <h3 className="font-black text-2xl text-white tracking-tight">تحويل مخزني جديد</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-xl text-slate-500 transition-colors"><X size={24} /></button>
        </div>

        <div className="p-8 grid grid-cols-2 gap-8 overflow-y-auto">
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">من مخزن</label>
                <select 
                  className="w-full px-4 py-3 bg-[#1e293b] border border-[#334155] rounded-2xl text-white outline-none"
                  value={fromId}
                  onChange={(e) => setFromId(e.target.value)}
                >
                  <option value="">اختر...</option>
                  {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">إلى مخزن</label>
                <select 
                  className="w-full px-4 py-3 bg-[#1e293b] border border-[#334155] rounded-2xl text-white outline-none"
                  value={toId}
                  onChange={(e) => setToId(e.target.value)}
                >
                  <option value="">اختر...</option>
                  {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                </select>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-sm font-bold text-white uppercase tracking-widest">الأصناف المحولة</h4>
              <div className="bg-[#0f172a]/30 border border-[#1e293b] rounded-2xl overflow-hidden">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-900/50 text-slate-500 font-bold uppercase tracking-widest">
                    <tr>
                      <th className="px-4 py-3">المنتج</th>
                      <th className="px-4 py-3">الكمية</th>
                      <th className="px-4 py-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1e293b]">
                    {items.map((item, idx) => (
                      <tr key={idx}>
                        <td className="px-4 py-3 text-white font-bold">{item.name}</td>
                        <td className="px-4 py-3">
                          <input 
                            type="number" 
                            value={item.quantity}
                            onChange={(e) => setItems(items.map((it, i) => i === idx ? { ...it, quantity: parseInt(e.target.value) || 1 } : it))}
                            className="w-16 bg-slate-900 border border-slate-800 rounded text-center text-white py-1"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <button onClick={() => setItems(items.filter((_, i) => i !== idx))} className="text-red-500"><Trash2 size={16} /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="bg-[#0f172a]/50 rounded-3xl p-6 border border-[#1e293b] flex flex-col gap-4">
            <h4 className="text-sm font-bold text-white uppercase tracking-widest">اختر الأصناف</h4>
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
              {products.map(p => (
                <button 
                  key={p.id}
                  onClick={() => addItem(p)}
                  className="w-full text-right p-3 bg-[#1e293b] border border-[#334155] rounded-xl hover:border-blue-500/50 transition-all"
                >
                  <div className="text-xs font-bold text-white">{p.name}</div>
                  <div className="text-[10px] text-slate-500 mt-1">SKU: {p.sku}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="p-8 bg-[#0f172a] border-t border-[#1e293b] flex justify-end gap-4">
          <button onClick={onClose} className="px-8 py-3 bg-slate-800 text-white rounded-xl font-bold">إلغاء</button>
          <button onClick={handleSubmit} className="px-8 py-3 bg-emerald-600 text-white rounded-xl font-black shadow-lg shadow-emerald-600/20">تأكيد التحويل</button>
        </div>
      </div>
    </div>
  );
};

const WarehouseModal: React.FC<{ warehouse: WarehouseData | null, onClose: () => void }> = ({ warehouse, onClose }) => {
  const [formData, setFormData] = useState({
    name: warehouse?.name || '',
    location: warehouse?.location || '',
    isMain: warehouse?.isMain || false
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (warehouse) {
        const cmd = new UpdateWarehouseCommand(warehouse.id, formData);
        await cmd.execute();
      } else {
        const cmd = new CreateWarehouseCommand(formData);
        await cmd.execute();
      }
      onClose();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="fixed inset-0 bg-[#0b0f1a]/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#151b2b] w-full max-w-lg rounded-3xl border border-[#1e293b] shadow-2xl overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 to-emerald-600"></div>
        <div className="p-8 border-b border-[#1e293b] flex items-center justify-between bg-[#0f172a]/50">
          <h3 className="font-black text-xl text-white tracking-tight">{warehouse ? 'تعديل مخزن' : 'إضافة مخزن جديد'}</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-xl text-slate-500 transition-colors"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">اسم المخزن</label>
            <input required type="text" className="w-full px-4 py-3 bg-[#1e293b] border border-[#334155] rounded-2xl text-white outline-none" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">الموقع / العنوان</label>
            <input required type="text" className="w-full px-4 py-3 bg-[#1e293b] border border-[#334155] rounded-2xl text-white outline-none" value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} />
          </div>
          <div className="flex items-center gap-3">
            <input 
              type="checkbox" 
              id="isMain"
              checked={formData.isMain}
              onChange={(e) => setFormData({ ...formData, isMain: e.target.checked })}
              className="w-5 h-5 rounded border-slate-700 bg-slate-800 text-blue-600 focus:ring-blue-500/20"
            />
            <label htmlFor="isMain" className="text-sm font-bold text-slate-300 cursor-pointer">تعيين كمخزن رئيسي</label>
          </div>
          <div className="pt-4 flex gap-4">
            <button type="submit" className="flex-1 bg-blue-600 text-white py-4 rounded-2xl font-bold hover:bg-blue-500 transition-all shadow-lg shadow-blue-600/20">حفظ</button>
            <button type="button" onClick={onClose} className="flex-1 bg-[#1e293b] text-slate-300 py-4 rounded-2xl font-bold hover:bg-[#334155] transition-all">إلغاء</button>
          </div>
        </form>
      </div>
    </div>
  );
};
