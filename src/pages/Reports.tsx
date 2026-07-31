import React, { useState, useEffect } from 'react';
import { LayoutTemplate, BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Download, 
  Calendar, 
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  Package,
  Users,
  FileText,
  PieChart as PieChartIcon,
  Activity,
  ShieldCheck,
  Wallet,
  Truck,
  Percent,
  ChevronRight,
  Search,
  X
} from 'lucide-react';
import { BarChart, 
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
  Pie
} from 'recharts';
import { collection, onSnapshot, query, orderBy, getDocs, where, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { formatCurrency, cn, formatDate } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export const Reports: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'library'>('overview');
  const [selectedReport, setSelectedReport] = useState<any | null>(null);
  const [stats, setStats] = useState({
    totalSales: 0,
    totalExpenses: 0,
    totalProfit: 0,
    salesCount: 0,
  });
  const [recentSales, setRecentSales] = useState<any[]>([]);
  const [topProducts, setTopProducts] = useState<any[]>([]);

  useEffect(() => {
    const unsubInvoices = onSnapshot(collection(db, 'invoices'), (snap) => {
      const total = snap.docs.reduce((acc, doc) => acc + (doc.data().totalAmount || 0), 0);
      const sales = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setStats(prev => ({ ...prev, totalSales: total, salesCount: snap.size }));
      setRecentSales(sales.slice(0, 10));
    }, (err) => { console.warn('[Reports] invoices offline:', err); setLoading(false); });

    const unsubBills = onSnapshot(collection(db, 'bills'), (snap) => {
      const total = snap.docs.reduce((acc, doc) => acc + (doc.data().totalAmount || 0), 0);
      setStats(prev => ({ ...prev, totalExpenses: total }));
    }, (err) => console.warn('[Reports] bills offline:', err));

    const unsubProducts = onSnapshot(collection(db, 'products'), (snap) => {
      const prods = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setTopProducts(prods.slice(0, 5));
      setLoading(false);
    }, (err) => { console.warn('[Reports] products offline:', err); setLoading(false); });

    return () => {
      unsubInvoices();
      unsubBills();
      unsubProducts();
    };
  }, []);

  const chartData = [
    { name: 'يناير', sales: 4000, expenses: 2400 },
    { name: 'فبراير', sales: 3000, expenses: 1398 },
    { name: 'مارس', sales: 2000, expenses: 9800 },
    { name: 'أبريل', sales: 2780, expenses: 3908 },
    { name: 'مايو', sales: 1890, expenses: 4800 },
    { name: 'يونيو', sales: 2390, expenses: 3800 },
  ];

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-white tracking-tight">التقارير والتحليلات</h2>
          <p className="text-slate-500 font-bold text-sm mt-1">مركز التقارير المالية والإدارية الشامل</p>
        </div>
        <div className="flex items-center gap-3">
          <a href="/reports/designer" className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/20">
            <LayoutTemplate size={18} />
            تصميم تقرير جديد
          </a>
        </div>
        <div className="flex bg-[#151b2b] p-1 rounded-2xl border border-[#1e293b]">
          <button 
            onClick={() => setActiveTab('overview')}
            className={cn(
              "px-6 py-2 rounded-xl text-xs font-bold transition-all",
              activeTab === 'overview' ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" : "text-slate-500 hover:text-slate-300"
            )}
          >
            نظرة عامة
          </button>
          <button 
            onClick={() => setActiveTab('library')}
            className={cn(
              "px-6 py-2 rounded-xl text-xs font-bold transition-all",
              activeTab === 'library' ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" : "text-slate-500 hover:text-slate-300"
            )}
          >
            مكتبة التقارير
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'overview' ? (
          <motion.div 
            key="overview"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-10"
          >
            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="bg-[#151b2b] p-8 rounded-3xl border border-[#1e293b] shadow-xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/5 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-blue-600/10 transition-colors"></div>
                <div className="flex items-center gap-3 mb-4 text-slate-500 text-[10px] font-bold uppercase tracking-widest relative z-10">
                  <DollarSign size={18} className="text-blue-500" />
                  <span>إجمالي المبيعات</span>
                </div>
                <div className="text-3xl font-black text-white tracking-tighter relative z-10">
                  {formatCurrency(stats.totalSales)}
                </div>
                <div className="mt-4 flex items-center gap-1 text-emerald-500 text-[10px] font-bold uppercase tracking-widest relative z-10">
                  <ArrowUpRight size={14} />
                  <span>+12.5% عن الشهر الماضي</span>
                </div>
              </div>

              <div className="bg-[#151b2b] p-8 rounded-3xl border border-[#1e293b] shadow-xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-red-600/5 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-red-600/10 transition-colors"></div>
                <div className="flex items-center gap-3 mb-4 text-slate-500 text-[10px] font-bold uppercase tracking-widest relative z-10">
                  <TrendingDown size={18} className="text-red-500" />
                  <span>إجمالي المصروفات</span>
                </div>
                <div className="text-3xl font-black text-white tracking-tighter relative z-10">
                  {formatCurrency(stats.totalExpenses)}
                </div>
                <div className="mt-4 flex items-center gap-1 text-red-500 text-[10px] font-bold uppercase tracking-widest relative z-10">
                  <ArrowUpRight size={14} />
                  <span>+5.2% عن الشهر الماضي</span>
                </div>
              </div>

              <div className="bg-[#151b2b] p-8 rounded-3xl border border-[#1e293b] shadow-xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-600/5 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-emerald-600/10 transition-colors"></div>
                <div className="flex items-center gap-3 mb-4 text-slate-500 text-[10px] font-bold uppercase tracking-widest relative z-10">
                  <TrendingUp size={18} className="text-emerald-500" />
                  <span>صافي الربح</span>
                </div>
                <div className="text-3xl font-black text-emerald-500 tracking-tighter relative z-10">
                  {formatCurrency(stats.totalSales - stats.totalExpenses)}
                </div>
                <div className="mt-4 flex items-center gap-1 text-emerald-500 text-[10px] font-bold uppercase tracking-widest relative z-10">
                  <ArrowUpRight size={14} />
                  <span>+8.3% عن الشهر الماضي</span>
                </div>
              </div>

              <div className="bg-[#151b2b] p-8 rounded-3xl border border-[#1e293b] shadow-xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-600/5 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-amber-600/10 transition-colors"></div>
                <div className="flex items-center gap-3 mb-4 text-slate-500 text-[10px] font-bold uppercase tracking-widest relative z-10">
                  <BarChart3 size={18} className="text-amber-500" />
                  <span>عدد الفواتير</span>
                </div>
                <div className="text-3xl font-black text-white tracking-tighter relative z-10">
                  {stats.salesCount}
                </div>
                <div className="mt-4 flex items-center gap-1 text-emerald-500 text-[10px] font-bold uppercase tracking-widest relative z-10">
                  <ArrowUpRight size={14} />
                  <span>+18 فاتورة جديدة</span>
                </div>
              </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              <div className="bg-[#151b2b] p-8 rounded-3xl border border-[#1e293b] shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 to-emerald-600 opacity-50"></div>
                <h3 className="font-black text-xl text-white mb-8 text-right tracking-tight">تحليل المبيعات</h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10, fontWeight: 700 }} dy={15} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10, fontWeight: 700 }} dx={-15} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#0f172a', borderRadius: '16px', border: '1px solid #1e293b', padding: '12px' }}
                        itemStyle={{ fontSize: '12px', fontWeight: 800, color: '#f1f5f9' }}
                      />
                      <Area type="monotone" dataKey="sales" stroke="#3b82f6" strokeWidth={4} fillOpacity={1} fill="url(#colorSales)" name="المبيعات" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-[#151b2b] p-8 rounded-3xl border border-[#1e293b] shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-600 to-blue-600 opacity-50"></div>
                <h3 className="font-black text-xl text-white mb-8 text-right tracking-tight">المبيعات حسب الفئة</h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10, fontWeight: 700 }} dy={15} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10, fontWeight: 700 }} dx={-15} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#0f172a', borderRadius: '16px', border: '1px solid #1e293b', padding: '12px' }}
                        itemStyle={{ fontSize: '12px', fontWeight: 800, color: '#f1f5f9' }}
                      />
                      <Bar dataKey="sales" fill="#3b82f6" radius={[8, 8, 0, 0]} name="المبيعات" />
                      <Bar dataKey="expenses" fill="#ef4444" radius={[8, 8, 0, 0]} name="المصروفات" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Top Products & Customers */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              <div className="bg-[#151b2b] rounded-3xl border border-[#1e293b] shadow-2xl overflow-hidden">
                <div className="p-8 border-b border-[#1e293b] bg-[#0f172a]/50">
                  <h3 className="font-black text-xl text-white tracking-tight">المنتجات الأكثر مبيعاً</h3>
                </div>
                <div className="p-8 space-y-6">
                  {topProducts.map((p, i) => (
                    <div key={p.id} className="flex items-center justify-between group">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-slate-800 rounded-xl flex items-center justify-center text-slate-500 border border-[#1e293b] group-hover:border-blue-500/50 transition-colors">
                          <Package size={24} />
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-white">{p.name}</p>
                          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{p.category}</p>
                        </div>
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-black text-blue-400">{formatCurrency(p.price * 10)}</p>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">10 مبيعات</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-[#151b2b] rounded-3xl border border-[#1e293b] shadow-2xl overflow-hidden">
                <div className="p-8 border-b border-[#1e293b] bg-[#0f172a]/50">
                  <h3 className="font-black text-xl text-white tracking-tight">أفضل العملاء</h3>
                </div>
                <div className="p-8 space-y-6">
                  {[1, 2, 3, 4, 5].map((_, i) => (
                    <div key={i} className="flex items-center justify-between group">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-slate-800 rounded-xl flex items-center justify-center text-slate-500 border border-[#1e293b] group-hover:border-emerald-500/50 transition-colors">
                          <Users size={24} />
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-white">عميل مميز #{i + 1}</p>
                          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">عميل نشط</p>
                        </div>
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-black text-emerald-500">{formatCurrency(5000 + (i * 1000))}</p>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">إجمالي المشتريات</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="library"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <ReportLibrary onSelectReport={setSelectedReport} />
          </motion.div>
        )}
      </AnimatePresence>

      {selectedReport && (
        <ReportGenerator report={selectedReport} onClose={() => setSelectedReport(null)} />
      )}
    </div>
  );
};

const ReportLibrary: React.FC<{ onSelectReport: (report: any) => void }> = ({ onSelectReport }) => {
  const categories = [
    {
      title: 'القوائم المالية الأساسية',
      icon: FileText,
      color: 'text-blue-500',
      reports: [
        { id: 'balance-sheet', name: 'قائمة المركز المالي (الميزانية)', description: 'عرض الأصول والالتزامات وحقوق الملكية في تاريخ محدد.' },
        { id: 'income-statement', name: 'قائمة الدخل (الأرباح والخسائر)', description: 'قياس الأداء المالي خلال فترة زمنية محددة.' },
        { id: 'cash-flow', name: 'قائمة التدفقات النقدية', description: 'تتبع مصادر النقد وأوجه صرفه (تشغيلي، استثماري، تمويلي).' },
      ]
    },
    {
      title: 'التقارير الرقابية والتدقيقية',
      icon: ShieldCheck,
      color: 'text-emerald-500',
      reports: [
        { id: 'trial-balance', name: 'ميزان المراجعة', description: 'ملخص لكافة أرصدة الحسابات للتأكد من تساوي الجانبين.' },
        { id: 'general-ledger', name: 'دفتر الأستاذ العام', description: 'عرض تفصيلي لكافة الحركات المالية لكل حساب.' },
        { id: 'journal-audit', name: 'تقرير مراجعة القيود', description: 'تتبع القيود التي تم تعديلها أو حذفها لضمان الرقابة.' },
      ]
    },
    {
      title: 'إدارة النقد والسيولة',
      icon: Wallet,
      color: 'text-amber-500',
      reports: [
        { id: 'bank-reconciliation', name: 'تقرير التسوية البنكية', description: 'مطابقة رصيد البنك في النظام مع كشف الحساب الفعلي.' },
        { id: 'cash-forecast', name: 'تقرير توقعات السيولة', description: 'التنبؤ بالنقد المتاح بناءً على الفواتير والالتزامات.' },
      ]
    },
    {
      title: 'الذمم والتحصيل',
      icon: Users,
      color: 'text-purple-500',
      reports: [
        { id: 'aging-report', name: 'أعمار الديون', description: 'تصنيف المبالغ المستحقة حسب مدة تأخرها.' },
        { id: 'customer-profitability', name: 'تقرير ربحية العميل', description: 'تحليل صافي الربح الناتج من كل عميل.' },
        { id: 'supplier-statement', name: 'كشف حساب الموردين', description: 'متابعة الفواتير والمدفوعات والمبالغ المتبقية.' },
      ]
    },
    {
      title: 'التكاليف والمخزون',
      icon: Package,
      color: 'text-red-500',
      reports: [
        { id: 'inventory-valuation', name: 'تقرير تقييم المخزون', description: 'قيمة البضاعة الحالية بناءً على طرق التقييم المعتمدة.' },
        { id: 'stock-movement', name: 'تقرير حركة الأصناف', description: 'تحديد الأصناف الأكثر مبيعاً والأصناف الراكدة.' },
        { id: 'cost-centers', name: 'تقارير مراكز التكلفة', description: 'توزيع المصاريف على الأقسام أو المشاريع.' },
      ]
    },
    {
      title: 'التقارير الإدارية والتحليلية',
      icon: Activity,
      color: 'text-indigo-500',
      reports: [
        { id: 'budget-vs-actual', name: 'تحليل الموازنة التقديرية', description: 'مقارنة ما تم التخطيط له بما تحقق فعلياً.' },
        { id: 'financial-ratios', name: 'النسب المالية', description: 'مثل نسب السيولة، الربحية، وكفاءة الأصول.' },
      ]
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      {categories.map((cat, i) => (
        <div key={i} className="bg-[#151b2b] rounded-3xl border border-[#1e293b] overflow-hidden shadow-xl">
          <div className="p-6 border-b border-[#1e293b] bg-[#0f172a]/50 flex items-center gap-3">
            <cat.icon className={cn("w-6 h-6", cat.color)} />
            <h3 className="font-black text-lg text-white">{cat.title}</h3>
          </div>
          <div className="p-6 space-y-2">
            {cat.reports.map(report => (
              <button 
                key={report.id}
                onClick={() => onSelectReport(report)}
                className="w-full flex items-center justify-between p-4 rounded-2xl hover:bg-slate-800/50 transition-all group text-right"
              >
                <div className="flex-1">
                  <p className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors">{report.name}</p>
                  <p className="text-[10px] text-slate-500 font-medium mt-1">{report.description}</p>
                </div>
                <ChevronRight size={18} className="text-slate-700 group-hover:text-blue-500 group-hover:translate-x-[-4px] transition-all" />
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

const ReportGenerator: React.FC<{ report: any, onClose: () => void }> = ({ report, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any[]>([]);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  useEffect(() => {
    // Simulate data fetching based on report type
    const fetchData = async () => {
      setLoading(true);
      try {
        let collectionName = '';
        if (report.id === 'general-ledger' || report.id === 'trial-balance') {
          collectionName = 'transactions';
        } else if (report.id === 'stock-movement') {
          collectionName = 'stock_movements';
        } else if (report.id === 'supplier-statement') {
          collectionName = 'bills';
        } else {
          collectionName = 'invoices';
        }

        const snap = await getDocs(collection(db, collectionName));
        setData(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [report.id]);

  return (
    <div className="fixed inset-0 bg-[#0b0f1a]/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#151b2b] w-full max-w-5xl rounded-3xl border border-[#1e293b] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-8 border-b border-[#1e293b] flex items-center justify-between bg-[#0f172a]/50">
          <div>
            <h3 className="font-black text-2xl text-white tracking-tight">{report.name}</h3>
            <p className="text-slate-500 font-bold text-sm mt-1">{report.description}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-xl text-slate-500 transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="p-8 bg-[#0f172a]/30 border-b border-[#1e293b] flex flex-wrap items-center gap-6">
          <div className="flex items-center gap-3">
            <Calendar size={18} className="text-blue-500" />
            <div className="flex items-center gap-2">
              <input type="date" className="bg-[#1e293b] border border-[#334155] rounded-xl px-4 py-2 text-xs text-white outline-none" />
              <span className="text-slate-500 text-xs">إلى</span>
              <input type="date" className="bg-[#1e293b] border border-[#334155] rounded-xl px-4 py-2 text-xs text-white outline-none" />
            </div>
          </div>
          <button className="px-6 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-500 transition-all">تحديث التقرير</button>
          <div className="flex-1"></div>
          <button className="flex items-center gap-2 px-6 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-500 transition-all">
            <Download size={16} />
            <span>تصدير Excel</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-slate-500 font-bold">جاري توليد التقرير...</p>
            </div>
          ) : (
            <table className="w-full text-right">
              <thead className="text-slate-500 text-[10px] font-bold uppercase tracking-widest border-b border-[#1e293b]">
                <tr>
                  <th className="px-4 py-4">التاريخ</th>
                  <th className="px-4 py-4">البيان / الوصف</th>
                  <th className="px-4 py-4">المرجع</th>
                  <th className="px-4 py-4">المبلغ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e293b]">
                {data.length === 0 ? (
                  <tr><td colSpan={4} className="py-20 text-center text-slate-600">لا توجد بيانات لهذه الفترة</td></tr>
                ) : data.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/20 transition-colors">
                    <td className="px-4 py-4 text-slate-400 text-xs">
                      {item.date?.toDate ? formatDate(item.date.toDate()) : '---'}
                    </td>
                    <td className="px-4 py-4 font-bold text-white">
                      {item.description || item.customerName || item.supplierName || 'عملية مالية'}
                    </td>
                    <td className="px-4 py-4 text-slate-500 font-mono text-xs">#{item.id.slice(0, 8)}</td>
                    <td className="px-4 py-4 font-black text-white">
                      {formatCurrency(item.totalAmount || item.amount || 0)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
