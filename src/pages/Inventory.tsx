import React, { useEffect, useState } from 'react';
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  Search, 
  Filter, 
  Package, 
  Calendar,
  History,
  Plus,
  Minus
} from 'lucide-react';
import { collection, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase';
import { formatCurrency, cn } from '../lib/utils';

interface StockMovement {
  id: string;
  productId: string;
  productName: string;
  type: 'in' | 'out';
  quantity: number;
  reason: string;
  date: any;
  user: string;
}

export const Inventory: React.FC = () => {
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    // In a real app, we would have a 'stock_movements' collection
    // For now, we'll simulate it or use a placeholder
    const q = query(collection(db, 'stock_movements'), orderBy('date', 'desc'), limit(50));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as StockMovement));
      setMovements(list);
      setLoading(false);
    }, (error) => {
      console.error(error);
      // Fallback dummy data if collection doesn't exist yet
      setMovements([
        { id: '1', productId: 'p1', productName: 'آيفون 15 برو', type: 'in', quantity: 10, reason: 'توريد جديد', date: { seconds: Date.now()/1000 }, user: 'أحمد' },
        { id: '2', productId: 'p2', productName: 'ماك بوك إم 3', type: 'out', quantity: 2, reason: 'مبيعات فاتورة #1001', date: { seconds: Date.now()/1000 - 3600 }, user: 'سارة' },
        { id: '3', productId: 'p3', productName: 'ساعة آبل 9', type: 'in', quantity: 5, reason: 'مرتجع مبيعات', date: { seconds: Date.now()/1000 - 7200 }, user: 'محمد' },
      ]);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h2 className="text-2xl font-black text-white tracking-tight">حركة المخزون</h2>
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input 
              type="text" 
              placeholder="البحث عن منتج..." 
              className="w-full pr-10 pl-4 py-2.5 bg-[#151b2b] border border-[#1e293b] rounded-xl text-white focus:outline-none focus:border-blue-500 transition-all placeholder:text-slate-600"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="flex items-center gap-2 px-6 py-3 bg-[#151b2b] text-slate-300 rounded-2xl border border-[#1e293b] font-bold hover:bg-slate-800 transition-all text-xs uppercase tracking-widest">
            <Filter size={18} />
            <span>تصفية</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-[#151b2b] p-8 rounded-3xl border border-[#1e293b] shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-600/5 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-emerald-600/10 transition-colors"></div>
          <div className="flex items-center gap-3 mb-4 text-slate-500 text-[10px] font-bold uppercase tracking-widest relative z-10">
            <Plus size={18} className="text-emerald-500" />
            <span>إجمالي الوارد</span>
          </div>
          <div className="text-3xl font-black text-white tracking-tighter relative z-10">150 قطعة</div>
          <p className="mt-2 text-[10px] text-slate-500 font-bold uppercase tracking-widest">خلال آخر 30 يوم</p>
        </div>

        <div className="bg-[#151b2b] p-8 rounded-3xl border border-[#1e293b] shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-red-600/5 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-red-600/10 transition-colors"></div>
          <div className="flex items-center gap-3 mb-4 text-slate-500 text-[10px] font-bold uppercase tracking-widest relative z-10">
            <Minus size={18} className="text-red-500" />
            <span>إجمالي الصادر</span>
          </div>
          <div className="text-3xl font-black text-white tracking-tighter relative z-10">85 قطعة</div>
          <p className="mt-2 text-[10px] text-slate-500 font-bold uppercase tracking-widest">خلال آخر 30 يوم</p>
        </div>

        <div className="bg-[#151b2b] p-8 rounded-3xl border border-[#1e293b] shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/5 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-blue-600/10 transition-colors"></div>
          <div className="flex items-center gap-3 mb-4 text-slate-500 text-[10px] font-bold uppercase tracking-widest relative z-10">
            <History size={18} className="text-blue-500" />
            <span>متوسط الحركة اليومية</span>
          </div>
          <div className="text-3xl font-black text-white tracking-tighter relative z-10">7.8 حركة</div>
          <p className="mt-2 text-[10px] text-slate-500 font-bold uppercase tracking-widest">معدل الدوران</p>
        </div>
      </div>

      <div className="bg-[#151b2b] rounded-3xl border border-[#1e293b] shadow-2xl overflow-hidden">
        <div className="p-8 border-b border-[#1e293b] bg-[#0f172a]/50 flex items-center justify-between">
          <h3 className="font-black text-xl text-white tracking-tight">سجل الحركات</h3>
          <div className="flex gap-2">
            <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">وارد</span>
            <div className="w-3 h-3 rounded-full bg-red-500 ml-2"></div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">صادر</span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead className="bg-[#0f172a]/30 text-slate-500 text-[10px] font-bold uppercase tracking-widest">
              <tr>
                <th className="px-8 py-5">المنتج</th>
                <th className="px-8 py-5">النوع</th>
                <th className="px-8 py-5">الكمية</th>
                <th className="px-8 py-5">السبب</th>
                <th className="px-8 py-5">التاريخ</th>
                <th className="px-8 py-5">المستخدم</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e293b]">
              {movements.map((m) => (
                <tr key={m.id} className="hover:bg-slate-800/30 transition-colors group">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-3 justify-end">
                      <span className="font-bold text-white">{m.productName}</span>
                      <div className="w-8 h-8 bg-slate-800 rounded-lg flex items-center justify-center text-slate-500 border border-[#1e293b]">
                        <Package size={16} />
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <div className={cn(
                      "flex items-center gap-2 justify-end font-bold text-xs uppercase tracking-widest",
                      m.type === 'in' ? "text-emerald-500" : "text-red-500"
                    )}>
                      <span>{m.type === 'in' ? 'وارد' : 'صادر'}</span>
                      {m.type === 'in' ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <span className="text-lg font-black text-white">{m.quantity}</span>
                  </td>
                  <td className="px-8 py-5 text-slate-400 font-medium text-sm">{m.reason}</td>
                  <td className="px-8 py-5 text-slate-500 text-xs font-bold">
                    {new Date(m.date.seconds * 1000).toLocaleString('ar-EG')}
                  </td>
                  <td className="px-8 py-5">
                    <span className="px-3 py-1 bg-slate-800 text-slate-400 rounded-lg text-[10px] font-bold uppercase tracking-widest border border-[#1e293b]">
                      {m.user}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
