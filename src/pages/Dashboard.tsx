import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFirebase } from '../components/FirebaseProvider';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Package, 
  ArrowUpRight, 
  ArrowDownRight,
  DollarSign,
  Calendar,
  FileText,
  AlertTriangle,
  Plus,
  BarChart3
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area,
  Cell,
  PieChart,
  Pie,
  Legend
} from 'recharts';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { formatCurrency, cn } from '../lib/utils';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

interface StatCardProps {
  title: string;
  value: string;
  change: string;
  trend: 'up' | 'down';
  icon: any;
  color: 'blue' | 'red' | 'green' | 'amber';
}

const StatCard: React.FC<StatCardProps> = ({ title, value, change, trend, icon: Icon, color }) => {
  const colorClasses = {
    blue: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    red: "bg-red-500/10 text-red-500 border-red-500/20",
    green: "bg-green-500/10 text-green-500 border-green-500/20",
    amber: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  };

  return (
    <div className="bg-[#151b2b] p-6 rounded-2xl border border-[#1e293b] shadow-xl hover:bg-[#1a2133] transition-colors group">
      <div className="flex items-center justify-between mb-4">
        <div className={cn(
          "flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-lg uppercase tracking-wider transition-colors",
          trend === 'up' ? "bg-green-500/10 text-green-500 group-hover:bg-green-500/20" : "bg-red-500/10 text-red-500 group-hover:bg-red-500/20"
        )}>
          {trend === 'up' ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
          {change}
        </div>
        <div className={cn("p-3 rounded-xl border transition-colors", colorClasses[color])}>
          <Icon size={24} />
        </div>
      </div>
      <p className="text-slate-500 text-xs font-medium mb-1 text-right">{title}</p>
      <h4 className="text-2xl font-bold text-white text-right">{value}</h4>
    </div>
  );
};

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { loading, user } = useFirebase();
  const [stats, setStats] = useState({
    totalCustomers: 0,
    totalProducts: 0,
  });
  const [lowStockProducts, setLowStockProducts] = useState<any[]>([]);
  
  const [invoices, setInvoices] = useState<any[]>([]);
  const [bills, setBills] = useState<any[]>([]);

  useEffect(() => {
    if (loading || !user) return;
    const unsubInvoices = onSnapshot(collection(db, 'invoices'), (snap) => {
      setInvoices(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (err) => console.warn('[Dashboard] invoices snapshot offline:', err));

    const unsubBills = onSnapshot(collection(db, 'bills'), (snap) => {
      setBills(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (err) => console.warn('[Dashboard] bills snapshot offline:', err));

    const unsubCustomers = onSnapshot(collection(db, 'customers'), (snap) => {
      setStats(prev => ({ ...prev, totalCustomers: snap.size }));
    }, (err) => console.warn('[Dashboard] customers snapshot offline:', err));

    const unsubProducts = onSnapshot(collection(db, 'products'), (snap) => {
      const allProds = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      const lowStock = allProds.filter((p: any) => p.quantity <= 5).slice(0, 3);
      setLowStockProducts(lowStock);
      setStats(prev => ({ ...prev, totalProducts: snap.size }));
    }, (err) => console.warn('[Dashboard] products snapshot offline:', err));

    return () => {
      unsubInvoices();
      unsubBills();
      unsubCustomers();
      unsubProducts();
    };
  }, [loading, user]);

  const { totalSales, totalExpenses, recentInvoices, dailySales, monthlyData, categoryData } = useMemo(() => {
    let totalSales = 0;
    let totalExpenses = 0;

    const dailyMap = new Map<string, number>();
    const monthlySalesMap = new Map<string, number>();
    const monthlyExpensesMap = new Map<string, number>();
    const categoryMap = new Map<string, number>();
    
    const today = new Date();
    
    // Last 7 days for daily sales
    const last7Days: string[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toLocaleDateString('ar-EG', { weekday: 'short', month: 'short', day: 'numeric' });
      last7Days.push(dateStr);
      dailyMap.set(dateStr, 0);
    }

    // Last 6 months for monthly profits
    const last6Months: string[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(today);
      d.setMonth(d.getMonth() - i);
      const monthStr = d.toLocaleDateString('ar-EG', { month: 'long', year: 'numeric' });
      last6Months.push(monthStr);
      monthlySalesMap.set(monthStr, 0);
      monthlyExpensesMap.set(monthStr, 0);
    }

    invoices.forEach(inv => {
      const amount = inv.totalAmount || 0;
      totalSales += amount;

      const date = inv.date?.toDate ? inv.date.toDate() : new Date();
      
      const dayStr = date.toLocaleDateString('ar-EG', { weekday: 'short', month: 'short', day: 'numeric' });
      if (dailyMap.has(dayStr)) {
        dailyMap.set(dayStr, dailyMap.get(dayStr)! + amount);
      }

      const monthStr = date.toLocaleDateString('ar-EG', { month: 'long', year: 'numeric' });
      if (monthlySalesMap.has(monthStr)) {
        monthlySalesMap.set(monthStr, monthlySalesMap.get(monthStr)! + amount);
      }
      
      if (inv.items) {
        inv.items.forEach((item: any) => {
           const cat = item.category || 'عام';
           categoryMap.set(cat, (categoryMap.get(cat) || 0) + (item.price * item.quantity));
        });
      }
    });

    bills.forEach(bill => {
      const amount = bill.totalAmount || 0;
      totalExpenses += amount;

      const date = bill.date?.toDate ? bill.date.toDate() : new Date();
      const monthStr = date.toLocaleDateString('ar-EG', { month: 'long', year: 'numeric' });
      if (monthlyExpensesMap.has(monthStr)) {
        monthlyExpensesMap.set(monthStr, monthlyExpensesMap.get(monthStr)! + amount);
      }
    });

    const recentInvoices = [...invoices].sort((a, b) => (b.date?.seconds || 0) - (a.date?.seconds || 0)).slice(0, 5);
    
    const dailySales = last7Days.map(day => ({
      name: day,
      المبيعات: dailyMap.get(day) || 0
    }));

    const monthlyData = last6Months.map(month => {
      const sales = monthlySalesMap.get(month) || 0;
      const expenses = monthlyExpensesMap.get(month) || 0;
      return {
        name: month,
        المبيعات: sales,
        المصروفات: expenses,
        الربح: sales - expenses
      };
    });

    let categoryData = Array.from(categoryMap.entries()).map(([name, value]) => ({ name, value }));
    if (categoryData.length === 0) {
      categoryData = [
        { name: 'مواد غذائية', value: 35 },
        { name: 'مشروبات', value: 22 },
        { name: 'ألبان وأجبان', value: 15 },
        { name: 'أخرى', value: 28 },
      ];
    } else {
       categoryData.sort((a, b) => b.value - a.value);
       if (categoryData.length > 5) {
         const top4 = categoryData.slice(0, 4);
         const otherVal = categoryData.slice(4).reduce((acc, curr) => acc + curr.value, 0);
         top4.push({ name: 'أخرى', value: otherVal });
         categoryData = top4;
       }
    }

    return { totalSales, totalExpenses, recentInvoices, dailySales, monthlyData, categoryData };
  }, [invoices, bills]);

  return (
    <div className="space-y-10">
      {/* Quick Actions */}
      <div className="bg-[#151b2b] p-6 rounded-3xl border border-[#1e293b] shadow-xl flex items-center justify-between gap-4">
        <h3 className="font-black text-lg text-white tracking-tight">إجراءات سريعة</h3>
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/pos')} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-500 transition-all font-bold text-sm">
            <Plus size={16} />
            <span>فاتورة جديدة</span>
          </button>
          <button onClick={() => navigate('/transactions')} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-500 transition-all font-bold text-sm">
            <Plus size={16} />
            <span>قيد جديد</span>
          </button>
          <button onClick={() => navigate('/products')} className="flex items-center gap-2 px-4 py-2 bg-slate-700 text-white rounded-xl hover:bg-slate-600 transition-all font-bold text-sm">
            <Package size={16} />
            <span>إضافة منتج</span>
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        <StatCard 
          title="إجمالي المبيعات" 
          value={formatCurrency(totalSales)} 
          change="+12.5%" 
          trend="up" 
          icon={TrendingUp} 
          color="blue"
        />
        <StatCard 
          title="صافي الأرباح" 
          value={formatCurrency(totalSales - totalExpenses)} 
          change="+8.3%" 
          trend="up" 
          icon={DollarSign} 
          color="green"
        />
        <StatCard 
          title="إجمالي الفواتير" 
          value={invoices.length.toString()} 
          change="18" 
          trend="up" 
          icon={FileText} 
          color="amber"
        />
        <StatCard 
          title="العملاء النشطون" 
          value={stats.totalCustomers.toString()} 
          change="+8" 
          trend="up" 
          icon={Users} 
          color="blue"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div className="bg-[#151b2b] p-8 rounded-3xl border border-[#1e293b] shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 to-emerald-600 opacity-50"></div>
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold uppercase tracking-widest">
              <BarChart3 size={14} className="text-blue-500" />
              <span>آخر 7 أيام</span>
            </div>
            <h3 className="font-black text-xl text-white tracking-tight">المبيعات اليومية</h3>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailySales} barSize={30}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10, fontWeight: 700 }} dy={15} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10, fontWeight: 700 }} dx={-15} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '16px', border: '1px solid #1e293b', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.5)', padding: '12px' }}
                  itemStyle={{ fontSize: '12px', fontWeight: 800, color: '#f1f5f9', padding: '4px 0' }}
                  cursor={{ fill: '#1e293b', opacity: 0.4 }}
                />
                <Bar dataKey="المبيعات" fill="#3b82f6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-[#151b2b] p-8 rounded-3xl border border-[#1e293b] shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-600 to-blue-600 opacity-50"></div>
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold uppercase tracking-widest">
              <Calendar size={14} className="text-emerald-500" />
              <span>آخر 6 أشهر</span>
            </div>
            <h3 className="font-black text-xl text-white tracking-tight">الأرباح الشهرية</h3>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyData}>
                <defs>
                  <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10, fontWeight: 700 }} dy={15} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10, fontWeight: 700 }} dx={-15} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '16px', border: '1px solid #1e293b', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.5)', padding: '12px' }}
                  itemStyle={{ fontSize: '12px', fontWeight: 800, color: '#f1f5f9', padding: '4px 0' }}
                  cursor={{ stroke: '#334155', strokeWidth: 2 }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: 'bold', color: '#94a3b8', paddingTop: '20px' }} />
                <Area type="monotone" dataKey="الربح" stroke="#10b981" strokeWidth={4} fillOpacity={1} fill="url(#colorProfit)" />
                <Area type="monotone" dataKey="المبيعات" stroke="#3b82f6" strokeWidth={2} fillOpacity={0} />
                <Area type="monotone" dataKey="المصروفات" stroke="#ef4444" strokeWidth={2} fillOpacity={0} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Recent Invoices */}
        <div className="lg:col-span-2 bg-[#151b2b] rounded-3xl border border-[#1e293b] shadow-2xl overflow-hidden flex flex-col">
          <div className="p-8 border-b border-[#1e293b] flex items-center justify-between bg-[#0f172a]/50">
            <button onClick={() => navigate('/invoices')} className="text-blue-500 text-[10px] font-black hover:text-blue-400 uppercase tracking-widest transition-colors">عرض الكل</button>
            <h3 className="font-black text-xl text-white tracking-tight">أحدث الفواتير</h3>
          </div>
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-right">
              <thead className="bg-slate-900/50 text-slate-500 text-[10px] font-bold uppercase tracking-widest">
                <tr>
                  <th className="px-8 py-5">رقم الفاتورة</th>
                  <th className="px-8 py-5">العميل</th>
                  <th className="px-8 py-5">المبلغ</th>
                  <th className="px-8 py-5">الحالة</th>
                  <th className="px-8 py-5"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e293b]">
                {recentInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-8 py-16 text-center text-slate-600 font-medium">لا توجد فواتير حديثة</td>
                  </tr>
                ) : recentInvoices.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-slate-800/30 transition-colors group">
                    <td className="px-8 py-5 font-bold text-white text-sm tracking-tighter">#{invoice.id.slice(0, 8)}</td>
                    <td className="px-8 py-5 text-slate-400 text-sm font-medium">{invoice.customerName}</td>
                    <td className="px-8 py-5 font-black text-blue-400 text-sm">{formatCurrency(invoice.totalAmount)}</td>
                    <td className="px-8 py-5">
                      <span className={cn(
                        "px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border",
                        invoice.status === 'paid' ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" :
                        invoice.status === 'pending' ? "bg-amber-500/10 text-amber-500 border-amber-500/20" :
                        "bg-red-500/10 text-red-500 border-red-500/20"
                      )}>
                        {invoice.status === 'paid' ? 'مكتمل' : 
                         invoice.status === 'pending' ? 'معلق' : 'متأخر'}
                      </span>
                    </td>
                    <td className="px-8 py-5">
                      <button onClick={() => navigate('/invoices')} className="p-2.5 hover:bg-blue-500/10 text-blue-400 rounded-xl transition-colors">
                        <ArrowUpRight size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Inventory Alerts */}
        <div className="bg-[#151b2b] p-8 rounded-3xl border border-[#1e293b] shadow-2xl relative overflow-hidden flex flex-col">
          <div className="absolute top-0 left-0 w-full h-1 bg-red-600/50"></div>
          <h3 className="font-black text-xl text-white mb-8 text-right flex items-center justify-end gap-3 tracking-tight">
            تنبيهات المخزون
            <AlertTriangle size={20} className="text-red-500" />
          </h3>
          <div className="space-y-5 flex-1">
            {lowStockProducts.length === 0 ? (
              <div className="p-8 text-center text-slate-600 font-medium bg-slate-900/30 rounded-2xl border border-dashed border-[#1e293b]">
                المخزون مستقر حالياً
              </div>
            ) : lowStockProducts.map((p) => (
              <div key={p.id} className="p-5 bg-red-500/5 border border-red-500/10 rounded-2xl flex items-center justify-between group hover:bg-red-500/10 transition-all">
                <span className={cn(
                  "text-[10px] font-black px-2 py-1 rounded-lg uppercase tracking-widest",
                  p.quantity <= 2 ? "bg-red-500 text-white" : "bg-amber-500/20 text-amber-500"
                )}>
                  {p.quantity} قطعة
                </span>
                <div className="text-right">
                  <p className="text-sm font-bold text-white group-hover:text-red-400 transition-colors">{p.name}</p>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">{p.category}</p>
                </div>
              </div>
            ))}
          </div>
          {lowStockProducts.length > 0 && (
            <button onClick={() => navigate('/inventory')} className="w-full mt-8 py-4 bg-[#1e293b] text-slate-400 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-[#252f44] hover:text-white transition-all border border-[#334155]">
              عرض تقرير المخزون
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

