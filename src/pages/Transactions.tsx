import React, { useEffect, useState } from 'react';
import { 
  Plus, 
  Search, 
  Wallet, 
  ArrowUpRight, 
  ArrowDownRight, 
  Filter,
  X,
  Calendar
} from 'lucide-react';
import { collection, onSnapshot, query, orderBy, addDoc, Timestamp } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { formatCurrency, formatDate, cn } from '../lib/utils';

interface Transaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  description: string;
  date: any;
}

export const Transactions: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Extract unique categories for the filter dropdown
  const categories = Array.from(new Set(transactions.map(t => t.category))).filter(Boolean);

  useEffect(() => {
    const q = query(collection(db, 'transactions'), orderBy('date', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction));
      setTransactions(list);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'transactions');
    });

    return () => unsubscribe();
  }, []);

  const filteredTransactions = transactions.filter(t => {
    // 1. Date Filter
    if (startDate || endDate) {
      if (!t.date) return false;
      const txDate = t.date.toDate();
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        if (txDate < start) return false;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        if (txDate > end) return false;
      }
    }

    // 2. Type Filter
    if (filterType !== 'all' && t.type !== filterType) return false;

    // 3. Category Filter
    if (filterCategory !== 'all' && t.category !== filterCategory) return false;

    // 4. Search Filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      if (!t.description.toLowerCase().includes(query) && !t.category.toLowerCase().includes(query)) {
        return false;
      }
    }

    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h2 className="text-2xl font-black text-white tracking-tight">الحسابات والقيود</h2>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-2xl hover:bg-blue-500 transition-all font-bold shadow-lg shadow-blue-600/20 active:scale-95"
        >
          <Plus size={20} />
          <span>إضافة قيد جديد</span>
        </button>
      </div>

      {/* Filters Section */}
      <div className="bg-[#151b2b] p-4 rounded-2xl border border-[#1e293b] flex flex-wrap items-center gap-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
          <input 
            type="text" 
            placeholder="بحث في الوصف أو الفئة..." 
            className="w-full pr-10 pl-4 py-2.5 bg-[#0f172a] border border-[#1e293b] rounded-xl text-white focus:outline-none focus:border-blue-500 transition-all placeholder:text-slate-600"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2 bg-[#0f172a] border border-[#1e293b] rounded-xl px-3 py-2">
          <Filter size={16} className="text-slate-500" />
          <select 
            className="bg-transparent text-white text-sm focus:outline-none appearance-none pr-2"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as any)}
          >
            <option value="all" className="bg-[#151b2b]">كل الأنواع</option>
            <option value="income" className="bg-[#151b2b]">دخل (+)</option>
            <option value="expense" className="bg-[#151b2b]">مصروف (-)</option>
          </select>
        </div>

        <div className="flex items-center gap-2 bg-[#0f172a] border border-[#1e293b] rounded-xl px-3 py-2">
          <select 
            className="bg-transparent text-white text-sm focus:outline-none appearance-none pr-2"
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
          >
            <option value="all" className="bg-[#151b2b]">كل الفئات</option>
            {categories.map(cat => (
              <option key={cat} value={cat} className="bg-[#151b2b]">{cat}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2 bg-[#0f172a] border border-[#1e293b] rounded-xl px-3 py-2">
          <Calendar size={16} className="text-slate-500" />
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">من</span>
          <input 
            type="date" 
            className="bg-transparent text-white text-sm focus:outline-none [&::-webkit-calendar-picker-indicator]:invert"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mx-1">إلى</span>
          <input 
            type="date" 
            className="bg-transparent text-white text-sm focus:outline-none [&::-webkit-calendar-picker-indicator]:invert"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>

        {(startDate || endDate || filterType !== 'all' || filterCategory !== 'all' || searchQuery) && (
          <button 
            onClick={() => { 
              setStartDate(''); 
              setEndDate(''); 
              setFilterType('all');
              setFilterCategory('all');
              setSearchQuery('');
            }}
            className="p-2 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-red-400 transition-colors"
            title="مسح الفلاتر"
          >
            <X size={18} />
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#151b2b] p-8 rounded-3xl border border-[#1e293b] shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/5 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-blue-600/10 transition-colors"></div>
          <div className="flex items-center gap-3 mb-4 text-slate-500 text-[10px] font-bold uppercase tracking-widest relative z-10">
            <Wallet size={18} className="text-blue-500" />
            <span>الرصيد الحالي</span>
          </div>
          <div className="text-3xl font-black text-white tracking-tighter relative z-10">
            {formatCurrency(filteredTransactions.reduce((acc, t) => t.type === 'income' ? acc + t.amount : acc - t.amount, 0))}
          </div>
        </div>
        <div className="bg-[#151b2b] p-8 rounded-3xl border border-[#1e293b] shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-600/5 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-emerald-600/10 transition-colors"></div>
          <div className="flex items-center gap-3 mb-4 text-emerald-500/70 text-[10px] font-bold uppercase tracking-widest relative z-10">
            <ArrowUpRight size={18} className="text-emerald-500" />
            <span>إجمالي الدخل</span>
          </div>
          <div className="text-3xl font-black text-emerald-500 tracking-tighter relative z-10">
            {formatCurrency(filteredTransactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0))}
          </div>
        </div>
        <div className="bg-[#151b2b] p-8 rounded-3xl border border-[#1e293b] shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-red-600/5 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-red-600/10 transition-colors"></div>
          <div className="flex items-center gap-3 mb-4 text-red-500/70 text-[10px] font-bold uppercase tracking-widest relative z-10">
            <ArrowDownRight size={18} className="text-red-500" />
            <span>إجمالي المصروفات</span>
          </div>
          <div className="text-3xl font-black text-red-500 tracking-tighter relative z-10">
            {formatCurrency(filteredTransactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0))}
          </div>
        </div>
      </div>

      <div className="bg-[#151b2b] rounded-3xl border border-[#1e293b] shadow-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead className="bg-[#0f172a]/50 text-slate-500 text-[10px] font-bold uppercase tracking-widest">
              <tr>
                <th className="px-8 py-5">التاريخ</th>
                <th className="px-8 py-5">الوصف</th>
                <th className="px-8 py-5">الفئة</th>
                <th className="px-8 py-5">النوع</th>
                <th className="px-8 py-5">المبلغ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e293b]">
              {loading ? (
                <tr><td colSpan={5} className="px-8 py-16 text-center text-slate-600 font-medium">جاري التحميل...</td></tr>
              ) : filteredTransactions.length === 0 ? (
                <tr><td colSpan={5} className="px-8 py-16 text-center text-slate-600 font-medium">لا توجد قيود مطابقة للبحث</td></tr>
              ) : filteredTransactions.map((t) => (
                <tr key={t.id} className="hover:bg-slate-800/30 transition-colors group">
                  <td className="px-8 py-5 text-slate-500 text-xs font-medium">
                    {t.date?.toDate ? formatDate(t.date.toDate()) : '---'}
                  </td>
                  <td className="px-8 py-5 font-bold text-white">{t.description}</td>
                  <td className="px-8 py-5 text-slate-400 font-medium">{t.category}</td>
                  <td className="px-8 py-5">
                    <span className={cn(
                      "px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border",
                      t.type === 'income' ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : "bg-red-500/10 text-red-500 border-red-500/20"
                    )}>
                      {t.type === 'income' ? 'دخل' : 'مصروف'}
                    </span>
                  </td>
                  <td className={cn(
                    "px-8 py-5 font-black tracking-tighter text-lg",
                    t.type === 'income' ? "text-emerald-500" : "text-red-500"
                  )}>
                    {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <TransactionModal onClose={() => setIsModalOpen(false)} />
      )}
    </div>
  );
};

const TransactionModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [formData, setFormData] = useState({
    type: 'income' as 'income' | 'expense',
    amount: 0,
    category: '',
    description: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'transactions'), {
        ...formData,
        date: Timestamp.now(),
      });
      onClose();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'transactions');
    }
  };

  return (
    <div className="fixed inset-0 bg-[#0b0f1a]/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#151b2b] w-full max-w-md rounded-3xl border border-[#1e293b] shadow-2xl overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 to-emerald-600"></div>
        <div className="p-8 border-b border-[#1e293b] flex items-center justify-between bg-[#0f172a]/50">
          <h3 className="font-black text-xl text-white tracking-tight">إضافة قيد مالي</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-xl text-slate-500 transition-colors"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="flex p-1.5 bg-[#0f172a] rounded-2xl border border-[#1e293b]">
            <button 
              type="button"
              onClick={() => setFormData({ ...formData, type: 'income' })}
              className={cn("flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all", formData.type === 'income' ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/20" : "text-slate-500 hover:text-slate-400")}
            >دخل</button>
            <button 
              type="button"
              onClick={() => setFormData({ ...formData, type: 'expense' })}
              className={cn("flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all", formData.type === 'expense' ? "bg-red-600 text-white shadow-lg shadow-red-600/20" : "text-slate-500 hover:text-slate-400")}
            >مصروف</button>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">المبلغ</label>
            <input required type="number" className="w-full px-4 py-3 bg-[#1e293b] border border-[#334155] rounded-2xl text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-black text-lg" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })} />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">الفئة</label>
            <input required type="text" className="w-full px-4 py-3 bg-[#1e293b] border border-[#334155] rounded-2xl text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">الوصف</label>
            <textarea required rows={3} className="w-full px-4 py-3 bg-[#1e293b] border border-[#334155] rounded-2xl text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none resize-none transition-all" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
          </div>
          <div className="pt-4 flex gap-4">
            <button type="submit" className="flex-1 bg-blue-600 text-white py-4 rounded-2xl font-black hover:bg-blue-500 transition-all shadow-lg shadow-blue-600/20 active:scale-95 uppercase tracking-widest">حفظ القيد</button>
            <button type="button" onClick={onClose} className="flex-1 bg-[#1e293b] text-slate-300 py-4 rounded-2xl font-bold hover:bg-[#334155] transition-all">إلغاء</button>
          </div>
        </form>
      </div>
    </div>
  );
};
