import React, { useEffect, useState } from 'react';
import { 
  Plus, 
  Search, 
  Truck, 
  Mail, 
  Phone, 
  MapPin, 
  Edit2, 
  Trash2,
  X,
  History
} from 'lucide-react';
import { collection, onSnapshot, query, orderBy, addDoc, updateDoc, deleteDoc, doc, where, getDocs } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { cn, formatCurrency, formatDate } from '../lib/utils';

interface Supplier {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
}

export const Suppliers: React.FC = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isStatementOpen, setIsStatementOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'suppliers'), orderBy('name'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Supplier));
      setSuppliers(list);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'suppliers');
    });

    return () => unsubscribe();
  }, []);

  const filteredSuppliers = suppliers.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = async (id: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذا المورد؟')) {
      try {
        await deleteDoc(doc(db, 'suppliers', id));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `suppliers/${id}`);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
          <input 
            type="text" 
            placeholder="البحث عن مورد..." 
            className="w-full pr-10 pl-4 py-2.5 bg-[#151b2b] border border-[#1e293b] rounded-xl text-white focus:outline-none focus:border-blue-500 transition-all placeholder:text-slate-600"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button 
          onClick={() => { setEditingSupplier(null); setIsModalOpen(true); }}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-500 transition-all font-bold shadow-lg shadow-blue-600/20 active:scale-95"
        >
          <Truck size={18} />
          <span>إضافة مورد</span>
        </button>
      </div>

      <div className="bg-[#151b2b] rounded-2xl border border-[#1e293b] shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead className="bg-slate-900/50 text-slate-500 text-[10px] font-bold uppercase tracking-widest">
              <tr>
                <th className="px-6 py-4">المورد</th>
                <th className="px-6 py-4">البريد الإلكتروني</th>
                <th className="px-6 py-4">الهاتف</th>
                <th className="px-6 py-4">العنوان</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e293b]">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-600">جاري التحميل...</td>
                </tr>
              ) : filteredSuppliers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-600">لا يوجد موردين حالياً</td>
                </tr>
              ) : filteredSuppliers.map((supplier) => (
                <tr key={supplier.id} className="hover:bg-slate-800/30 transition-colors group">
                  <td className="px-6 py-4 font-bold text-white">{supplier.name}</td>
                  <td className="px-6 py-4 text-slate-400 text-sm">{supplier.email}</td>
                  <td className="px-6 py-4 text-slate-400 text-sm">{supplier.phone}</td>
                  <td className="px-6 py-4 text-slate-400 text-sm truncate max-w-[200px]">{supplier.address}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 justify-end">
                      <button 
                        onClick={() => { setSelectedSupplier(supplier); setIsStatementOpen(true); }}
                        className="p-2 hover:bg-emerald-500/10 text-emerald-400 rounded-lg transition-colors"
                        title="كشف حساب"
                      >
                        <History size={16} />
                      </button>
                      <button onClick={() => { setEditingSupplier(supplier); setIsModalOpen(true); }} className="p-2 hover:bg-blue-500/10 text-blue-400 rounded-lg transition-colors"><Edit2 size={16} /></button>
                      <button onClick={() => handleDelete(supplier.id)} className="p-2 hover:bg-red-500/10 text-red-400 rounded-lg transition-colors"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <SupplierModal 
          supplier={editingSupplier} 
          onClose={() => setIsModalOpen(false)} 
        />
      )}

      {isStatementOpen && selectedSupplier && (
        <SupplierStatement 
          supplier={selectedSupplier}
          onClose={() => setIsStatementOpen(false)}
        />
      )}
    </div>
  );
};

const SupplierStatement: React.FC<{ supplier: Supplier, onClose: () => void }> = ({ supplier, onClose }) => {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        // Fetch bills for this supplier
        const billQ = query(collection(db, 'bills'), where('supplierId', '==', supplier.id), orderBy('date', 'desc'));
        const billSnap = await getDocs(billQ);
        const billList = billSnap.docs.map(d => ({ id: d.id, type: 'bill', ...d.data() }));

        // Fetch direct transactions if any (e.g. manual payments)
        const transQ = query(collection(db, 'transactions'), where('supplierId', '==', supplier.id), orderBy('date', 'desc'));
        const transSnap = await getDocs(transQ);
        const transList = transSnap.docs.map(d => ({ id: d.id, type: 'transaction', ...d.data() }));

        const all = [...billList, ...transList].sort((a: any, b: any) => b.date?.seconds - a.date?.seconds);
        setTransactions(all);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchTransactions();
  }, [supplier.id]);

  const totalBilled = transactions.filter(t => t.type === 'bill').reduce((sum, t) => sum + (t.totalAmount || 0), 0);
  const totalPaid = transactions.filter(t => t.type === 'transaction' && t.category === 'expense').reduce((sum, t) => sum + (t.amount || 0), 0);
  const balance = totalBilled - totalPaid;

  return (
    <div className="fixed inset-0 bg-[#0b0f1a]/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#151b2b] w-full max-w-4xl rounded-3xl border border-[#1e293b] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-8 border-b border-[#1e293b] flex items-center justify-between bg-[#0f172a]/50">
          <div>
            <h3 className="font-black text-2xl text-white tracking-tight">كشف حساب المورد</h3>
            <p className="text-slate-500 font-bold text-sm mt-1">{supplier.name}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-xl text-slate-500 transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="p-8 grid grid-cols-3 gap-6 bg-[#0f172a]/30 border-b border-[#1e293b]">
          <div className="bg-[#1e293b] p-4 rounded-2xl border border-[#334155]">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">إجمالي المشتريات</p>
            <p className="text-xl font-black text-white">{formatCurrency(totalBilled)}</p>
          </div>
          <div className="bg-[#1e293b] p-4 rounded-2xl border border-[#334155]">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">إجمالي المدفوعات</p>
            <p className="text-xl font-black text-red-500">{formatCurrency(totalPaid)}</p>
          </div>
          <div className="bg-[#1e293b] p-4 rounded-2xl border border-[#334155]">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">الرصيد المتبقي</p>
            <p className="text-xl font-black text-amber-500">{formatCurrency(balance)}</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-8">
          <table className="w-full text-right">
            <thead className="text-slate-500 text-[10px] font-bold uppercase tracking-widest border-b border-[#1e293b]">
              <tr>
                <th className="px-4 py-4">التاريخ</th>
                <th className="px-4 py-4">البيان</th>
                <th className="px-4 py-4">النوع</th>
                <th className="px-4 py-4">المبلغ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e293b]">
              {loading ? (
                <tr><td colSpan={4} className="py-10 text-center text-slate-600">جاري التحميل...</td></tr>
              ) : transactions.length === 0 ? (
                <tr><td colSpan={4} className="py-10 text-center text-slate-600">لا توجد حركات مالية</td></tr>
              ) : transactions.map((t) => (
                <tr key={t.id} className="hover:bg-slate-800/20 transition-colors">
                  <td className="px-4 py-4 text-slate-400 text-xs">{t.date?.toDate ? formatDate(t.date.toDate()) : '---'}</td>
                  <td className="px-4 py-4 font-bold text-white">
                    {t.type === 'bill' ? `فاتورة مشتريات #${t.id.slice(0, 8)}` : t.description}
                  </td>
                  <td className="px-4 py-4">
                    <span className={cn(
                      "px-2 py-1 rounded text-[10px] font-bold uppercase",
                      t.type === 'bill' ? "bg-amber-500/10 text-amber-400" : "bg-red-500/10 text-red-400"
                    )}>
                      {t.type === 'bill' ? 'فاتورة' : 'سداد'}
                    </span>
                  </td>
                  <td className={cn(
                    "px-4 py-4 font-black",
                    t.type === 'bill' ? "text-white" : "text-red-500"
                  )}>
                    {formatCurrency(t.type === 'bill' ? t.totalAmount : t.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="p-8 bg-[#0f172a] border-t border-[#1e293b] flex justify-end">
          <button onClick={onClose} className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition-all">إغلاق</button>
        </div>
      </div>
    </div>
  );
};

const SupplierModal: React.FC<{ supplier: Supplier | null, onClose: () => void }> = ({ supplier, onClose }) => {
  const [formData, setFormData] = useState({
    name: supplier?.name || '',
    email: supplier?.email || '',
    phone: supplier?.phone || '',
    address: supplier?.address || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (supplier) {
        await updateDoc(doc(db, 'suppliers', supplier.id), formData);
      } else {
        await addDoc(collection(db, 'suppliers'), formData);
      }
      onClose();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'suppliers');
    }
  };

  return (
    <div className="fixed inset-0 bg-[#0b0f1a]/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#151b2b] w-full max-w-lg rounded-3xl border border-[#1e293b] shadow-2xl overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 to-emerald-600"></div>
        <div className="p-8 border-b border-[#1e293b] flex items-center justify-between bg-[#0f172a]/50">
          <h3 className="font-black text-xl text-white tracking-tight">{supplier ? 'تعديل مورد' : 'إضافة مورد جديد'}</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-xl text-slate-500 transition-colors"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">اسم المورد</label>
            <input required type="text" className="w-full px-4 py-3 bg-[#1e293b] border border-[#334155] rounded-2xl text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">البريد الإلكتروني</label>
            <input type="email" className="w-full px-4 py-3 bg-[#1e293b] border border-[#334155] rounded-2xl text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">رقم الهاتف</label>
            <input type="tel" className="w-full px-4 py-3 bg-[#1e293b] border border-[#334155] rounded-2xl text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">العنوان</label>
            <textarea rows={3} className="w-full px-4 py-3 bg-[#1e293b] border border-[#334155] rounded-2xl text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none resize-none transition-all" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} />
          </div>
          <div className="pt-4 flex gap-4">
            <button type="submit" className="flex-1 bg-blue-600 text-white py-4 rounded-2xl font-bold hover:bg-blue-500 transition-all shadow-lg shadow-blue-600/20 active:scale-95">حفظ</button>
            <button type="button" onClick={onClose} className="flex-1 bg-[#1e293b] text-slate-300 py-4 rounded-2xl font-bold hover:bg-[#334155] transition-all">إلغاء</button>
          </div>
        </form>
      </div>
    </div>
  );
};
