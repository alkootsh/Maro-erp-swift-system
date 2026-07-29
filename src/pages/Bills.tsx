import React, { useEffect, useState } from 'react';
import { 
  Plus, 
  Search, 
  Receipt, 
  Download, 
  Trash2, 
  Eye, 
  X, 
  Truck,
  Package,
  PlusCircle,
  MinusCircle
} from 'lucide-react';
import { collection, onSnapshot, query, orderBy, addDoc, doc, getDocs, Timestamp } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { formatCurrency, formatDate, cn } from '../lib/utils';

interface BillItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
}

interface Bill {
  id: string;
  supplierId: string;
  supplierName: string;
  items: BillItem[];
  totalAmount: number;
  status: 'paid' | 'pending' | 'overdue';
  date: any;
}

export const Bills: React.FC = () => {
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'bills'), orderBy('date', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Bill));
      setBills(list);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'bills');
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black text-white tracking-tight">المشتريات والمصروفات</h2>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-2xl hover:bg-blue-500 transition-all font-bold shadow-lg shadow-blue-600/20 active:scale-95"
        >
          <Plus size={20} />
          <span>تسجيل فاتورة شراء</span>
        </button>
      </div>

      <div className="bg-[#151b2b] rounded-3xl border border-[#1e293b] shadow-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead className="bg-[#0f172a]/50 text-slate-500 text-[10px] font-bold uppercase tracking-widest">
              <tr>
                <th className="px-8 py-5">رقم الفاتورة</th>
                <th className="px-8 py-5">المورد</th>
                <th className="px-8 py-5">المبلغ الإجمالي</th>
                <th className="px-8 py-5">الحالة</th>
                <th className="px-8 py-5">التاريخ</th>
                <th className="px-8 py-5"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e293b]">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-8 py-16 text-center text-slate-600 font-medium">جاري التحميل...</td>
                </tr>
              ) : bills.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-8 py-16 text-center text-slate-600 font-medium">لا توجد فواتير شراء حالياً</td>
                </tr>
              ) : bills.map((bill) => (
                <tr key={bill.id} className="hover:bg-slate-800/30 transition-colors group">
                  <td className="px-8 py-5 font-bold text-white tracking-tighter">#{bill.id.slice(0, 8)}</td>
                  <td className="px-8 py-5 text-slate-400 font-medium">{bill.supplierName}</td>
                  <td className="px-8 py-5 font-black text-blue-400">{formatCurrency(bill.totalAmount)}</td>
                  <td className="px-8 py-5">
                    <span className={cn(
                      "px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border",
                      bill.status === 'paid' ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" :
                      bill.status === 'pending' ? "bg-amber-500/10 text-amber-500 border-amber-500/20" :
                      "bg-red-500/10 text-red-500 border-red-500/20"
                    )}>
                      {bill.status === 'paid' ? 'مدفوعة' : 
                       bill.status === 'pending' ? 'معلقة' : 'متأخرة'}
                    </span>
                  </td>
                  <td className="px-8 py-5 text-slate-500 text-xs font-medium">
                    {bill.date?.toDate ? formatDate(bill.date.toDate()) : '---'}
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-3 justify-end">
                      <button className="p-2.5 hover:bg-blue-500/10 text-blue-400 rounded-xl transition-colors"><Eye size={18} /></button>
                      <button className="p-2.5 hover:bg-emerald-500/10 text-emerald-400 rounded-xl transition-colors"><Download size={18} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <BillModal onClose={() => setIsModalOpen(false)} />
      )}
    </div>
  );
};

const BillModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [billItems, setBillItems] = useState<BillItem[]>([]);
  const [status, setStatus] = useState<'paid' | 'pending' | 'overdue'>('pending');

  useEffect(() => {
    const fetchData = async () => {
      const suppSnap = await getDocs(collection(db, 'suppliers'));
      setSuppliers(suppSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      
      const prodSnap = await getDocs(collection(db, 'products'));
      setProducts(prodSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    };
    fetchData();
  }, []);

  const addItem = (product: any) => {
    const existing = billItems.find(item => item.productId === product.id);
    if (existing) {
      setBillItems(billItems.map(item => item.productId === product.id ? { ...item, quantity: item.quantity + 1 } : item));
    } else {
      setBillItems([...billItems, { productId: product.id, name: product.name, price: product.price, quantity: 1 }]);
    }
  };

  const removeItem = (productId: string) => setBillItems(billItems.filter(item => item.productId !== productId));

  const updateQuantity = (productId: string, delta: number) => {
    setBillItems(billItems.map(item => item.productId === productId ? { ...item, quantity: Math.max(1, item.quantity + delta) } : item));
  };

  const totalAmount = billItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSupplierId || billItems.length === 0) return;
    const supplier = suppliers.find(s => s.id === selectedSupplierId);
    try {
      await addDoc(collection(db, 'bills'), {
        supplierId: selectedSupplierId,
        supplierName: supplier?.name || 'غير معروف',
        items: billItems,
        totalAmount,
        status,
        date: Timestamp.now(),
      });
      onClose();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'bills');
    }
  };

  return (
    <div className="fixed inset-0 bg-[#0b0f1a]/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#151b2b] w-full max-w-6xl rounded-3xl border border-[#1e293b] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] relative">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 to-emerald-600"></div>
        <div className="p-8 border-b border-[#1e293b] flex items-center justify-between bg-[#0f172a]/50">
          <h3 className="font-black text-2xl text-white tracking-tight">تسجيل فاتورة شراء</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-xl text-slate-500 transition-colors"><X size={24} /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-8 grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 space-y-8">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">المورد</label>
                <select required className="w-full px-4 py-3 bg-[#1e293b] border border-[#334155] rounded-2xl text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all appearance-none" value={selectedSupplierId} onChange={(e) => setSelectedSupplierId(e.target.value)}>
                  <option value="">اختر مورداً...</option>
                  {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">الحالة</label>
                <select className="w-full px-4 py-3 bg-[#1e293b] border border-[#334155] rounded-2xl text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all appearance-none" value={status} onChange={(e) => setStatus(e.target.value as any)}>
                  <option value="pending">معلقة</option>
                  <option value="paid">مدفوعة</option>
                  <option value="overdue">متأخرة</option>
                </select>
              </div>
            </div>
            <div className="space-y-4">
              <h4 className="font-bold text-white flex items-center gap-2 text-sm uppercase tracking-wider"><Package size={18} className="text-blue-500" /> عناصر الفاتورة</h4>
              <div className="bg-[#0f172a]/30 border border-[#1e293b] rounded-2xl overflow-hidden">
                <table className="w-full text-right text-sm">
                  <thead className="bg-slate-900/50 text-slate-500 text-[10px] font-bold uppercase tracking-widest">
                    <tr><th className="px-6 py-4">المنتج</th><th className="px-6 py-4">السعر</th><th className="px-6 py-4">الكمية</th><th className="px-6 py-4">الإجمالي</th><th className="px-6 py-4"></th></tr>
                  </thead>
                  <tbody className="divide-y divide-[#1e293b]">
                    {billItems.length === 0 ? (<tr><td colSpan={5} className="px-6 py-12 text-center text-slate-600 italic">لا توجد عناصر مضافة</td></tr>) : billItems.map((item) => (
                      <tr key={item.productId} className="hover:bg-slate-800/20 transition-colors">
                        <td className="px-6 py-4 font-bold text-white">{item.name}</td>
                        <td className="px-6 py-4 text-slate-400">{formatCurrency(item.price)}</td>
                        <td className="px-6 py-4"><div className="flex items-center gap-3 justify-end"><button onClick={() => updateQuantity(item.productId, -1)} className="text-slate-500 hover:text-red-400 transition-colors"><MinusCircle size={18} /></button><span className="w-8 text-center font-black text-white">{item.quantity}</span><button onClick={() => updateQuantity(item.productId, 1)} className="text-slate-500 hover:text-blue-400 transition-colors"><PlusCircle size={18} /></button></div></td>
                        <td className="px-6 py-4 font-black text-blue-400">{formatCurrency(item.price * item.quantity)}</td>
                        <td className="px-6 py-4"><button onClick={() => removeItem(item.productId)} className="text-red-500 hover:bg-red-500/10 p-2 rounded-xl transition-colors"><Trash2 size={18} /></button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          <div className="bg-[#0f172a]/50 rounded-3xl p-6 flex flex-col gap-6 border border-[#1e293b]">
            <h4 className="font-bold text-white text-sm uppercase tracking-wider">قائمة المنتجات</h4>
            <div className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar">
              {products.map(p => (
                <button key={p.id} onClick={() => addItem(p)} className="w-full text-right p-4 bg-[#1e293b] border border-[#334155] rounded-2xl hover:border-blue-500/50 hover:bg-[#252f44] transition-all group relative overflow-hidden">
                  <div className="font-bold text-slate-200 group-hover:text-white transition-colors">{p.name}</div>
                  <div className="text-[10px] text-slate-500 mt-2 flex justify-between font-bold uppercase tracking-wider"><span className="text-blue-400">{formatCurrency(p.price)}</span><span>المخزون: {p.quantity}</span></div>
                </button>
              ))}
            </div>
            <div className="pt-6 border-t border-[#1e293b]">
              <div className="flex justify-between items-center mb-6"><span className="text-slate-500 font-bold text-xs uppercase tracking-widest">المجموع الكلي</span><span className="text-2xl font-black text-emerald-500 tracking-tighter">{formatCurrency(totalAmount)}</span></div>
              <button onClick={handleSubmit} disabled={!selectedSupplierId || billItems.length === 0} className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-600 disabled:cursor-not-allowed transition-all shadow-xl shadow-blue-600/20 active:scale-95 uppercase tracking-widest">حفظ الفاتورة</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
