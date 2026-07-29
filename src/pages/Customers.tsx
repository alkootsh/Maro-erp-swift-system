import React, { useEffect, useState } from 'react';
import { 
  Plus, 
  Search, 
  UserPlus, 
  Mail, 
  Phone, 
  MapPin, 
  MoreVertical, 
  Edit2, 
  Trash2,
  X,
  FileText,
  History
} from 'lucide-react';
import { collection, onSnapshot, query, orderBy, addDoc, updateDoc, deleteDoc, doc, where, getDocs } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { cn, formatCurrency, formatDate } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  lastPurchaseDate?: any;
}

export const Customers: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isStatementOpen, setIsStatementOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'customers'), orderBy('name'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Customer));
      setCustomers(list);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'customers');
    });

    return () => unsubscribe();
  }, []);

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.phone.includes(searchTerm)
  );

  const handleDelete = async (id: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذا العميل؟')) {
      try {
        await deleteDoc(doc(db, 'customers', id));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `customers/${id}`);
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
            placeholder="البحث عن عميل بالاسم، البريد أو الهاتف..." 
            className="w-full pr-10 pl-4 py-2.5 bg-[#151b2b] border border-[#1e293b] rounded-xl text-white focus:outline-none focus:border-blue-500 transition-all placeholder:text-slate-600"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button 
          onClick={() => { setEditingCustomer(null); setIsModalOpen(true); }}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-500 transition-all font-bold shadow-lg shadow-blue-600/20 active:scale-95"
        >
          <UserPlus size={18} />
          <span>إضافة عميل</span>
        </button>
      </div>

      <div className="bg-[#151b2b] rounded-2xl border border-[#1e293b] shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead className="bg-slate-900/50 text-slate-500 text-[10px] font-bold uppercase tracking-widest">
              <tr>
                <th className="px-6 py-4">العميل</th>
                <th className="px-6 py-4">البريد الإلكتروني</th>
                <th className="px-6 py-4">الهاتف</th>
                <th className="px-6 py-4">آخر عملية شراء</th>
                <th className="px-6 py-4">العنوان</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e293b]">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-600">جاري التحميل...</td>
                </tr>
              ) : filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-600">لا يوجد عملاء حالياً</td>
                </tr>
              ) : filteredCustomers.map((customer) => (
                <tr key={customer.id} className="hover:bg-slate-800/30 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="font-bold text-white">{customer.name}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-slate-400 justify-end">
                      <span className="text-sm">{customer.email}</span>
                      <Mail size={14} className="text-slate-500" />
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-slate-400 justify-end">
                      <span className="text-sm">{customer.phone}</span>
                      <Phone size={14} className="text-slate-500" />
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-slate-400 text-right">
                      {customer.lastPurchaseDate 
                        ? new Date(customer.lastPurchaseDate.seconds * 1000).toLocaleDateString('ar-EG')
                        : '—'}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-slate-400 justify-end">
                      <span className="truncate max-w-[200px] text-sm">{customer.address}</span>
                      <MapPin size={14} className="text-slate-500" />
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 justify-end">
                      <button 
                        onClick={() => { setSelectedCustomer(customer); setIsStatementOpen(true); }}
                        className="p-2 hover:bg-emerald-500/10 text-emerald-400 rounded-lg transition-colors"
                        title="كشف حساب"
                      >
                        <History size={16} />
                      </button>
                      <button 
                        onClick={() => { setEditingCustomer(customer); setIsModalOpen(true); }}
                        className="p-2 hover:bg-blue-500/10 text-blue-400 rounded-lg transition-colors"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        onClick={() => handleDelete(customer.id)}
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
        <CustomerModal 
          customer={editingCustomer} 
          onClose={() => setIsModalOpen(false)} 
        />
      )}

      {isStatementOpen && selectedCustomer && (
        <CustomerStatement 
          customer={selectedCustomer}
          onClose={() => setIsStatementOpen(false)}
        />
      )}
    </div>
  );
};

const CustomerStatement: React.FC<{ customer: Customer, onClose: () => void }> = ({ customer, onClose }) => {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        // Fetch invoices for this customer
        const invQ = query(collection(db, 'invoices'), where('customerId', '==', customer.id), orderBy('date', 'desc'));
        const invSnap = await getDocs(invQ);
        const invList = invSnap.docs.map(d => ({ id: d.id, type: 'invoice', ...d.data() }));

        // Fetch direct transactions if any (e.g. manual payments)
        const transQ = query(collection(db, 'transactions'), where('customerId', '==', customer.id), orderBy('date', 'desc'));
        const transSnap = await getDocs(transQ);
        const transList = transSnap.docs.map(d => ({ id: d.id, type: 'transaction', ...d.data() }));

        const all = [...invList, ...transList].sort((a: any, b: any) => b.date?.seconds - a.date?.seconds);
        setTransactions(all);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchTransactions();
  }, [customer.id]);

  const totalInvoiced = transactions.filter(t => t.type === 'invoice').reduce((sum, t) => sum + (t.totalAmount || 0), 0);
  const totalPaid = transactions.filter(t => t.type === 'transaction' && t.category === 'income').reduce((sum, t) => sum + (t.amount || 0), 0);
  const balance = totalInvoiced - totalPaid;

  return (
    <div className="fixed inset-0 bg-[#0b0f1a]/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#151b2b] w-full max-w-4xl rounded-3xl border border-[#1e293b] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-8 border-b border-[#1e293b] flex items-center justify-between bg-[#0f172a]/50">
          <div>
            <h3 className="font-black text-2xl text-white tracking-tight">كشف حساب العميل</h3>
            <p className="text-slate-500 font-bold text-sm mt-1">{customer.name}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-xl text-slate-500 transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="p-8 grid grid-cols-3 gap-6 bg-[#0f172a]/30 border-b border-[#1e293b]">
          <div className="bg-[#1e293b] p-4 rounded-2xl border border-[#334155]">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">إجمالي المبيعات</p>
            <p className="text-xl font-black text-white">{formatCurrency(totalInvoiced)}</p>
          </div>
          <div className="bg-[#1e293b] p-4 rounded-2xl border border-[#334155]">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">إجمالي المدفوعات</p>
            <p className="text-xl font-black text-emerald-500">{formatCurrency(totalPaid)}</p>
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
                    {t.type === 'invoice' ? `فاتورة مبيعات #${t.id.slice(0, 8)}` : t.description}
                  </td>
                  <td className="px-4 py-4">
                    <span className={cn(
                      "px-2 py-1 rounded text-[10px] font-bold uppercase",
                      t.type === 'invoice' ? "bg-blue-500/10 text-blue-400" : "bg-emerald-500/10 text-emerald-400"
                    )}>
                      {t.type === 'invoice' ? 'فاتورة' : 'سداد'}
                    </span>
                  </td>
                  <td className={cn(
                    "px-4 py-4 font-black",
                    t.type === 'invoice' ? "text-white" : "text-emerald-500"
                  )}>
                    {formatCurrency(t.type === 'invoice' ? t.totalAmount : t.amount)}
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

const CustomerModal: React.FC<{ customer: Customer | null, onClose: () => void }> = ({ customer, onClose }) => {
  const [formData, setFormData] = useState({
    name: customer?.name || '',
    email: customer?.email || '',
    phone: customer?.phone || '',
    address: customer?.address || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (customer) {
        await updateDoc(doc(db, 'customers', customer.id), formData);
      } else {
        await addDoc(collection(db, 'customers'), formData);
      }
      onClose();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'customers');
    }
  };

  return (
    <div className="fixed inset-0 bg-[#0b0f1a]/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#151b2b] w-full max-w-lg rounded-3xl border border-[#1e293b] shadow-2xl overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 to-emerald-600"></div>
        <div className="p-8 border-b border-[#1e293b] flex items-center justify-between bg-[#0f172a]/50">
          <h3 className="font-black text-xl text-white tracking-tight">
            {customer ? 'تعديل بيانات عميل' : 'إضافة عميل جديد'}
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-xl text-slate-500 transition-colors">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">اسم العميل</label>
            <input 
              required
              type="text" 
              className="w-full px-4 py-3 bg-[#1e293b] border border-[#334155] rounded-2xl text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">البريد الإلكتروني</label>
            <input 
              type="email" 
              className="w-full px-4 py-3 bg-[#1e293b] border border-[#334155] rounded-2xl text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">رقم الهاتف</label>
            <input 
              type="tel" 
              className="w-full px-4 py-3 bg-[#1e293b] border border-[#334155] rounded-2xl text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">العنوان</label>
            <textarea 
              rows={3}
              className="w-full px-4 py-3 bg-[#1e293b] border border-[#334155] rounded-2xl text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none resize-none transition-all"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            />
          </div>
          <div className="pt-4 flex gap-4">
            <button 
              type="submit"
              className="flex-1 bg-blue-600 text-white py-4 rounded-2xl font-bold hover:bg-blue-500 transition-all shadow-lg shadow-blue-600/20 active:scale-95"
            >
              {customer ? 'حفظ التغييرات' : 'إضافة العميل'}
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
