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
import { collection, onSnapshot, query, orderBy, addDoc, doc, getDocs, Timestamp, updateDoc, getDoc, where } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
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
  date: any;
  status: 'completed' | 'pending';
}

export const Returns: React.FC = () => {
  const [returns, setReturns] = useState<ReturnInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'returns'), orderBy('date', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ReturnInvoice));
      setReturns(list);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'returns');
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black text-white tracking-tight">مرتجعات المبيعات</h2>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-2xl hover:bg-red-500 transition-all font-bold shadow-lg shadow-red-600/20 active:scale-95"
        >
          <Plus size={20} />
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
                    {ret.date?.toDate ? formatDate(ret.date.toDate()) : '---'}
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-3 justify-end">
                      <button className="p-2.5 hover:bg-blue-500/10 text-blue-400 rounded-xl transition-colors">
                        <Eye size={18} />
                      </button>
                      <button className="p-2.5 hover:bg-emerald-500/10 text-emerald-400 rounded-xl transition-colors">
                        <Download size={18} />
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
        <ReturnModal 
          onClose={() => setIsModalOpen(false)} 
        />
      )}
    </div>
  );
};

const ReturnModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [searchInvoiceId, setSearchInvoiceId] = useState('');
  const [originalInvoice, setOriginalInvoice] = useState<any>(null);
  const [returnItems, setReturnItems] = useState<ReturnItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const searchInvoice = async () => {
    if (!searchInvoiceId) return;
    setIsSearching(true);
    try {
      // Search by full ID or short ID
      const q = query(collection(db, 'invoices'), where('__name__', '>=', searchInvoiceId), where('__name__', '<=', searchInvoiceId + '\uf8ff'));
      const snap = await getDocs(q);
      if (!snap.empty) {
        const inv = { id: snap.docs[0].id, ...snap.docs[0].data() } as any;
        setOriginalInvoice(inv);
        setReturnItems(inv.items.map((item: any) => ({
          productId: item.productId,
          name: item.name,
          price: item.price,
          quantity: 0,
          reason: 'مرتجع مبيعات'
        })));
      } else {
        alert('الفاتورة غير موجودة');
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsSearching(false);
    }
  };

  const updateReturnQty = (productId: string, qty: number, max: number) => {
    setReturnItems(prev => prev.map(item => {
      if (item.productId === productId) {
        return { ...item, quantity: Math.min(max, Math.max(0, qty)) };
      }
      return item;
    }));
  };

  const totalAmount = returnItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const handleSubmit = async () => {
    if (returnItems.filter(i => i.quantity > 0).length === 0) return;
    try {
      const now = Timestamp.now();
      await addDoc(collection(db, 'returns'), {
        originalInvoiceId: originalInvoice?.id || null,
        customerId: originalInvoice?.customerId || 'walk-in',
        customerName: originalInvoice?.customerName || 'عميل نقدي',
        items: returnItems.filter(i => i.quantity > 0),
        totalAmount,
        date: now,
        status: 'completed'
      });

      // Update stock back
      for (const item of returnItems.filter(i => i.quantity > 0)) {
        const prodRef = doc(db, 'products', item.productId);
        const prodDoc = await getDoc(prodRef);
        if (prodDoc.exists()) {
          await updateDoc(prodRef, {
            stock: (prodDoc.data().stock || 0) + item.quantity
          });
        }
      }

      onClose();
      alert('تم حفظ المرتجع وتحديث المخزون');
    } catch (error) {
      console.error(error);
      alert('حدث خطأ أثناء الحفظ');
    }
  };

  return (
    <div className="fixed inset-0 bg-[#0b0f1a]/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#151b2b] w-full max-w-4xl rounded-3xl border border-[#1e293b] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-8 border-b border-[#1e293b] flex items-center justify-between bg-[#0f172a]/50">
          <h3 className="font-black text-2xl text-white tracking-tight">إنشاء مرتجع مبيعات</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-xl text-slate-500 transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="p-8 space-y-8 overflow-y-auto">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
              <input 
                type="text"
                placeholder="ابحث برقم الفاتورة..."
                value={searchInvoiceId}
                onChange={(e) => setSearchInvoiceId(e.target.value)}
                className="w-full bg-[#0b0f1a] border border-[#1e293b] rounded-2xl py-4 pr-12 pl-4 text-white focus:outline-none focus:border-red-500 transition-all"
              />
            </div>
            <button 
              onClick={searchInvoice}
              disabled={isSearching}
              className="px-8 bg-red-600 hover:bg-red-500 text-white rounded-2xl font-bold transition-all disabled:opacity-50"
            >
              بحث
            </button>
          </div>

          {originalInvoice && (
            <div className="space-y-6">
              <div className="bg-[#0f172a]/50 p-6 rounded-2xl border border-[#1e293b] flex items-center justify-between">
                <div className="text-right">
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mb-1">تفاصيل الفاتورة</p>
                  <p className="text-lg font-black text-white">#{originalInvoice.id.slice(0, 8)} - {originalInvoice.customerName}</p>
                </div>
                <div className="text-left">
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mb-1">إجمالي الفاتورة</p>
                  <p className="text-lg font-black text-blue-400">{formatCurrency(originalInvoice.totalAmount)}</p>
                </div>
              </div>

              <div className="bg-[#0f172a]/30 border border-[#1e293b] rounded-2xl overflow-hidden">
                <table className="w-full text-right text-sm">
                  <thead className="bg-slate-900/50 text-slate-500 text-[10px] font-bold uppercase tracking-widest">
                    <tr>
                      <th className="px-6 py-4">المنتج</th>
                      <th className="px-6 py-4">الكمية المباعة</th>
                      <th className="px-6 py-4">كمية المرتجع</th>
                      <th className="px-6 py-4">السعر</th>
                      <th className="px-6 py-4">الإجمالي</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1e293b]">
                    {returnItems.map((item, idx) => {
                      const originalItem = originalInvoice.items.find((i: any) => i.productId === item.productId);
                      return (
                        <tr key={item.productId} className="hover:bg-slate-800/20 transition-colors">
                          <td className="px-6 py-4 font-bold text-white">{item.name}</td>
                          <td className="px-6 py-4 text-slate-400">{originalItem?.quantity || 0}</td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3 justify-end">
                              <button onClick={() => updateReturnQty(item.productId, item.quantity - 1, originalItem?.quantity || 0)} className="text-slate-500 hover:text-red-400 transition-colors"><MinusCircle size={18} /></button>
                              <input 
                                type="number" 
                                value={item.quantity}
                                onChange={(e) => updateReturnQty(item.productId, parseInt(e.target.value) || 0, originalItem?.quantity || 0)}
                                className="w-12 bg-slate-900 border border-slate-800 rounded text-center font-black text-white py-1"
                              />
                              <button onClick={() => updateReturnQty(item.productId, item.quantity + 1, originalItem?.quantity || 0)} className="text-slate-500 hover:text-blue-400 transition-colors"><PlusCircle size={18} /></button>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-slate-400">{formatCurrency(item.price)}</td>
                          <td className="px-6 py-4 font-black text-red-400">{formatCurrency(item.price * item.quantity)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <div className="p-8 bg-[#0f172a] border-t border-[#1e293b] flex items-center justify-between">
          <div className="text-right">
            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">إجمالي المبلغ المسترد</p>
            <p className="text-3xl font-black text-red-500 tracking-tighter">{formatCurrency(totalAmount)}</p>
          </div>
          <div className="flex gap-4">
            <button onClick={onClose} className="px-8 py-4 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl font-bold transition-all">إلغاء</button>
            <button 
              onClick={handleSubmit}
              disabled={totalAmount <= 0}
              className="px-8 py-4 bg-red-600 hover:bg-red-500 text-white rounded-2xl font-black transition-all shadow-xl shadow-red-600/20 disabled:opacity-50"
            >
              تأكيد المرتجع
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
