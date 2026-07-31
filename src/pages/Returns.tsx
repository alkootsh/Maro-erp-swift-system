import React, { useEffect, useState } from 'react';
import { 
  Plus, 
  Search, 
  RotateCcw, 
  Download, 
  Trash2, 
  Eye, 
  X, 
  User as UserIcon,
  Package,
  PlusCircle,
  MinusCircle,
  FileText
} from 'lucide-react';
import { MaroSyncEngine } from '../lib/maroSyncEngine';
import { formatCurrency, formatDate, cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface ReturnItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  reason: string;
}

interface ReturnInvoice {
  id: string;
  originalInvoiceId?: string;
  customerId: string;
  customerName: string;
  items: ReturnItem[];
  totalAmount: number;
  date: string;
  status: 'completed' | 'pending';
}

export const Returns: React.FC = () => {
  const [returns, setReturns] = useState<ReturnInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [customerName, setCustomerName] = useState('عميل نقدي عام');
  const [returnItems, setReturnItems] = useState<ReturnItem[]>([
    { productId: 'p1', name: 'منتج تجريبي', price: 100, quantity: 1, reason: 'تالف' }
  ]);

  useEffect(() => {
    const unsub = MaroSyncEngine.subscribe<ReturnInvoice>('returns', (items) => {
      setReturns(items);
      setLoading(false);
    });
    const local = MaroSyncEngine.getLocalCollection<ReturnInvoice>('returns');
    if (local.length === 0) {
      const def: ReturnInvoice = {
        id: `ret_${Date.now()}`,
        originalInvoiceId: 'inv_1001',
        customerId: 'cust_1',
        customerName: 'شركة النور للتجارة',
        items: [{ productId: 'p1', name: 'شاشة سمارت 55 بوصة', price: 4500, quantity: 1, reason: 'عيب مصنعي' }],
        totalAmount: 4500,
        date: new Date().toISOString(),
        status: 'completed'
      };
      MaroSyncEngine.saveDocument('returns', def, true);
    }
    return () => unsub();
  }, []);

  const handleCreateReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    const totalAmount = returnItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const newReturn: ReturnInvoice = {
      id: `ret_${Date.now()}`,
      customerId: 'cust_gen',
      customerName,
      items: returnItems,
      totalAmount,
      date: new Date().toISOString(),
      status: 'completed'
    };
    await MaroSyncEngine.saveDocument('returns', newReturn, true);
    setIsModalOpen(false);
    setReturnItems([{ productId: 'p1', name: 'منتج تجريبي', price: 100, quantity: 1, reason: 'تالف' }]);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('هل أنت متأكد من حذف سجل المرتجع هذا؟')) {
      await MaroSyncEngine.deleteDocument('returns', id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight">مرتجعات المبيعات</h2>
          <p className="text-slate-500 font-bold text-sm">إدارة بضائع المرتجعات وعمليات الاسترجاع الآلي للمخزون</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-2xl hover:bg-red-500 transition-all font-bold shadow-lg shadow-red-600/20 active:scale-95 text-xs uppercase tracking-widest"
        >
          <Plus size={18} />
          <span>إنشاء مرتجع جديد</span>
        </button>
      </div>

      <div className="bg-[#151b2b] rounded-3xl border border-[#1e293b] shadow-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead className="bg-[#0f172a]/50 text-slate-500 text-[10px] font-bold uppercase tracking-widest">
              <tr>
                <th className="px-8 py-5">رقم المرتجع</th>
                <th className="px-8 py-5">الفاتورة الأصلية</th>
                <th className="px-8 py-5">العميل</th>
                <th className="px-8 py-5">المبلغ المسترد</th>
                <th className="px-8 py-5">التاريخ</th>
                <th className="px-8 py-5"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e293b]">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-8 py-16 text-center text-slate-600 font-medium">جاري التحميل...</td>
                </tr>
              ) : returns.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-8 py-16 text-center text-slate-600 font-medium">لا توجد مرتجعات حالياً</td>
                </tr>
              ) : returns.map((ret) => (
                <tr key={ret.id} className="hover:bg-slate-800/30 transition-colors group">
                  <td className="px-8 py-5 font-bold text-white tracking-tighter">#{ret.id.slice(0, 8)}</td>
                  <td className="px-8 py-5 text-slate-500 font-medium">
                    {ret.originalInvoiceId ? `#${ret.originalInvoiceId.slice(0, 8)}` : '---'}
                  </td>
                  <td className="px-8 py-5 text-slate-400 font-medium">{ret.customerName}</td>
                  <td className="px-8 py-5 font-black text-red-400">{formatCurrency(ret.totalAmount)}</td>
                  <td className="px-8 py-5 text-slate-500 text-xs font-medium">
                    {ret.date ? new Date(ret.date).toLocaleDateString('ar-EG') : '---'}
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-3 justify-end">
                      <button 
                        onClick={() => handleDelete(ret.id)}
                        className="p-2.5 hover:bg-red-500/10 text-red-400 rounded-xl transition-colors"
                      >
                        <Trash2 size={18} />
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
        <div className="fixed inset-0 bg-[#0b0f1a]/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#151b2b] w-full max-w-xl rounded-3xl border border-[#1e293b] shadow-2xl overflow-hidden relative">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-600 to-amber-600"></div>
            <div className="p-8 border-b border-[#1e293b] flex items-center justify-between bg-[#0f172a]/50">
              <h3 className="font-black text-xl text-white tracking-tight">إصدار مرتجع مبيعات جديد</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-800 rounded-xl text-slate-500 transition-colors">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreateReturn} className="p-8 space-y-6">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">اسم العميل</label>
                <input 
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full bg-[#0b0f1a] border border-[#334155] rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-blue-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">المنتجات المرتجعة</label>
                {returnItems.map((item, idx) => (
                  <div key={idx} className="flex gap-2 mb-2 items-center">
                    <input 
                      type="text"
                      value={item.name}
                      onChange={(e) => {
                        const items = [...returnItems];
                        items[idx].name = e.target.value;
                        setReturnItems(items);
                      }}
                      className="flex-1 bg-[#0b0f1a] border border-[#334155] rounded-xl px-4 py-2.5 text-white text-xs font-medium"
                      placeholder="اسم المنتج"
                    />
                    <input 
                      type="number"
                      value={item.price}
                      onChange={(e) => {
                        const items = [...returnItems];
                        items[idx].price = Number(e.target.value);
                        setReturnItems(items);
                      }}
                      className="w-24 bg-[#0b0f1a] border border-[#334155] rounded-xl px-4 py-2.5 text-white text-xs font-medium"
                      placeholder="السعر"
                    />
                    <input 
                      type="number"
                      value={item.quantity}
                      onChange={(e) => {
                        const items = [...returnItems];
                        items[idx].quantity = Number(e.target.value);
                        setReturnItems(items);
                      }}
                      className="w-20 bg-[#0b0f1a] border border-[#334155] rounded-xl px-4 py-2.5 text-white text-xs font-medium"
                      placeholder="الكمية"
                    />
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#1e293b]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-3 rounded-xl bg-slate-800 text-slate-300 font-bold hover:bg-slate-700 transition-all text-xs"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 rounded-xl bg-red-600 text-white font-bold hover:bg-red-500 transition-all shadow-lg shadow-red-600/20 text-xs"
                >
                  حفظ وإصدار المرتجع
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
