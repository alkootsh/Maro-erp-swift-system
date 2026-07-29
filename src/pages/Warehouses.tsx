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
import { collection, onSnapshot, query, orderBy, addDoc, updateDoc, deleteDoc, doc, getDocs, where, Timestamp } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { formatCurrency, cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface WarehouseData {
  id: string;
  name: string;
  location: string;
  isMain: boolean;
}

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
    const q = query(collection(db, 'warehouses'), orderBy('name'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as WarehouseData));
      setWarehouses(list);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'warehouses');
    });

    return () => unsubscribe();
  }, []);

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
            {warehouses.map(w => (
              <WarehouseCard 
                key={w.id} 
                warehouse={w} 
                onClick={() => setSelectedWarehouse(w)}
                onEdit={() => { setEditingWarehouse(w); setIsModalOpen(true); }}
              />
            ))}
          </motion.div>
        ) : (
          <motion.div 
            key="transfers"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <TransfersList />
          </motion.div>
        )}
      </AnimatePresence>

      {selectedWarehouse && (
        <WarehouseDetails 
          warehouse={selectedWarehouse} 
          onClose={() => setSelectedWarehouse(null)} 
        />
      )}

      {isModalOpen && (
        <WarehouseModal 
          warehouse={editingWarehouse}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </div>
  );
};

const WarehouseCard: React.FC<{ warehouse: WarehouseData, onClick: () => void, onEdit: () => void }> = ({ warehouse, onClick, onEdit }) => {
  return (
    <div className="bg-[#151b2b] rounded-3xl border border-[#1e293b] shadow-xl overflow-hidden group hover:border-blue-500/50 transition-all cursor-pointer" onClick={onClick}>
      <div className="p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div className="w-12 h-12 bg-blue-600/10 text-blue-500 rounded-2xl flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all">
            <Warehouse size={24} />
          </div>
          <button 
            onClick={(e) => { e.stopPropagation(); onEdit(); }}
            className="p-2 hover:bg-slate-800 rounded-xl text-slate-500 transition-colors"
          >
            <Edit2 size={18} />
          </button>
        </div>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-xl font-black text-white tracking-tight">{warehouse.name}</h3>
            {warehouse.isMain && (
              <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-500 text-[8px] font-bold uppercase tracking-widest rounded border border-emerald-500/20">رئيسي</span>
            )}
          </div>
          <p className="text-sm text-slate-500 font-medium">{warehouse.location}</p>
        </div>
        <div className="pt-6 border-t border-[#1e293b] flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-400">
            <Package size={16} className="text-blue-500" />
            <span className="text-xs font-bold">150 صنف</span>
          </div>
          <ChevronRight size={18} className="text-slate-600 group-hover:translate-x-[-4px] transition-transform" />
        </div>
      </div>
    </div>
  );
};

const WarehouseDetails: React.FC<{ warehouse: WarehouseData, onClose: () => void }> = ({ warehouse, onClose }) => {
  const [products, setProducts] = useState<WarehouseProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [visibleColumns, setVisibleColumns] = useState(['sku', 'name', 'category', 'quantity']);

  useEffect(() => {
    const fetchProducts = async () => {
      // In a real app, products would be linked to warehouses via a 'warehouse_stocks' collection
      // For now, we'll simulate it by fetching all products
      const snap = await getDocs(collection(db, 'products'));
      setProducts(snap.docs.map(d => ({
        productId: d.id,
        productName: d.data().name,
        sku: d.data().sku,
        category: d.data().category,
        quantity: Math.floor(Math.random() * 100) // Simulated per-warehouse quantity
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
          <div className="flex items-center gap-4">
            <div className="flex bg-[#1e293b] p-1 rounded-xl border border-[#334155]">
              <button className="p-2 text-slate-500 hover:text-white transition-colors"><Settings size={18} /></button>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-xl text-slate-500 transition-colors">
              <X size={24} />
            </button>
          </div>
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
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">قيمة المخزون</p>
            <p className="text-2xl font-black text-emerald-500">{formatCurrency(125400)}</p>
          </div>
          <div className="bg-[#1e293b] p-6 rounded-2xl border border-[#334155]">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">معدل الدوران</p>
            <div className="flex items-center gap-2">
              <p className="text-2xl font-black text-amber-500">12%</p>
              <TrendingUp size={18} className="text-emerald-500" />
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-8">
          <div className="mb-6 flex items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input 
                type="text" 
                placeholder="بحث في المخزن..." 
                className="w-full pr-10 pl-4 py-2.5 bg-[#0b0f1a] border border-[#1e293b] rounded-xl text-white focus:outline-none focus:border-blue-500 transition-all"
              />
            </div>
            <div className="flex gap-2">
              {['sku', 'name', 'category', 'quantity'].map(col => (
                <button 
                  key={col}
                  onClick={() => setVisibleColumns(prev => prev.includes(col) ? prev.filter(c => c !== col) : [...prev, col])}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest border transition-all",
                    visibleColumns.includes(col) ? "bg-blue-600/10 text-blue-400 border-blue-500/20" : "bg-slate-800 text-slate-500 border-slate-700"
                  )}
                >
                  {col === 'sku' ? 'الرمز' : col === 'name' ? 'الاسم' : col === 'category' ? 'الفئة' : 'الكمية'}
                </button>
              ))}
            </div>
          </div>

          <table className="w-full text-right">
            <thead className="text-slate-500 text-[10px] font-bold uppercase tracking-widest border-b border-[#1e293b]">
              <tr>
                {visibleColumns.includes('sku') && <th className="px-4 py-4">الرمز (SKU)</th>}
                {visibleColumns.includes('name') && <th className="px-4 py-4">اسم المنتج</th>}
                {visibleColumns.includes('category') && <th className="px-4 py-4">الفئة</th>}
                {visibleColumns.includes('quantity') && <th className="px-4 py-4">الكمية المتوفرة</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e293b]">
              {loading ? (
                <tr><td colSpan={4} className="py-20 text-center text-slate-600">جاري التحميل...</td></tr>
              ) : products.map(p => (
                <tr key={p.productId} className="hover:bg-slate-800/20 transition-colors">
                  {visibleColumns.includes('sku') && <td className="px-4 py-4 text-slate-500 font-mono text-xs">{p.sku}</td>}
                  {visibleColumns.includes('name') && <td className="px-4 py-4 font-bold text-white">{p.productName}</td>}
                  {visibleColumns.includes('category') && <td className="px-4 py-4 text-slate-400 text-xs">{p.category}</td>}
                  {visibleColumns.includes('quantity') && (
                    <td className="px-4 py-4">
                      <span className={cn(
                        "font-black text-lg",
                        p.quantity < 10 ? "text-red-500" : "text-white"
                      )}>{p.quantity}</span>
                    </td>
                  )}
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
    const q = query(collection(db, 'warehouse_transfers'), orderBy('date', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setTransfers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
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
                <td className="px-8 py-5 text-slate-500 text-xs">{t.date.toDate().toLocaleDateString('ar-EG')}</td>
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
      const wSnap = await getDocs(collection(db, 'warehouses'));
      setWarehouses(wSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      const pSnap = await getDocs(collection(db, 'products'));
      setProducts(pSnap.docs.map(d => ({ id: d.id, ...d.data() })));
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
      await addDoc(collection(db, 'warehouse_transfers'), {
        fromWarehouseId: fromId,
        fromWarehouseName: fromW.name,
        toWarehouseId: toId,
        toWarehouseName: toW.name,
        itemsCount: items.length,
        items,
        date: Timestamp.now()
      });
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
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
              <input type="text" placeholder="بحث عن منتج..." className="w-full pr-10 pl-4 py-2.5 bg-[#1e293b] border border-[#334155] rounded-xl text-xs text-white outline-none" />
            </div>
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
        await updateDoc(doc(db, 'warehouses', warehouse.id), formData);
      } else {
        await addDoc(collection(db, 'warehouses'), formData);
      }
      onClose();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'warehouses');
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
