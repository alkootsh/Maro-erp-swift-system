/**
 * @file CashierSessionView.tsx
 * @module واجهات وصفحات النظام (UI Pages)
 * @description شاشة إدارة الورديات وتغطية الكاميرات (CCTV & Shifts Engine).
 * تم تحديث التصميم والتنسيق البصري بالكامل لإضافة ألوان زاهية، بطاقات تفاعلية متطورة، وأرائك بصرية جذابة.
 */
import React, { useState, useEffect } from 'react';
import { POSSession, SalesInvoice, Customer } from '../types/sprint8';
import { POSRepository } from '../repositories/posRepository';
import { SalesRepository } from '../repositories/salesRepository';
import { MaroSyncEngine } from '../lib/maroSyncEngine';
import { useAuth, UserProfile } from '../components/AuthProvider';
import { printSalesInvoice } from '../lib/invoicePrinter';
import { WhatsAppNotificationService } from '../services/whatsappNotificationService';
import ColumnManagerModal from '../components/ColumnManagerModal';
import { SHIFTS_COLUMNS, SHIFTS_DEFAULT_VISIBLE } from '../lib/columns';
import { 
  ShieldAlert, 
  CheckCircle2, 
  DollarSign, 
  Lock, 
  Unlock, 
  FileText, 
  RefreshCw, 
  MessageSquare, 
  Camera, 
  Video, 
  Eye, 
  Zap, 
  Printer, 
  Clock, 
  AlertTriangle,
  Play,
  Maximize2,
  Activity,
  Vault,
  Store,
  Sliders,
  TrendingUp,
  Download,
  Users,
  CreditCard,
  Wallet,
  ArrowUpRight,
  ShieldCheck,
  Calendar,
  Sparkles,
  Layers,
  ChevronRight,
  Search
} from 'lucide-react';
import { formatCurrency, cn } from '../lib/utils';

// Audio/Sound helper for tactile enterprise UX
const playSuccessSound = () => {
  try {
    const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-84.wav');
    audio.volume = 0.4;
    audio.play();
  } catch (e) {
    console.warn('Audio feedback failed to play', e);
  }
};

export default function CashierSessionView() {
  const { user: currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'shifts' | 'cameras'>('shifts');
  
  // Database state
  const [sessionsData, setSessionsData] = useState<POSSession[]>([]);
  const [sales, setSales] = useState<SalesInvoice[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);

  // Shift opening/closing state
  const [activeSession, setActiveSession] = useState<POSSession | null>(null);
  const [openingCashInput, setOpeningCashInput] = useState('');
  const [actualCashInput, setActualCashInput] = useState('');
  const [cashierId, setCashierId] = useState('usr-cashier');
  const [cashierName, setCashierName] = useState('الكاشير الرئيسي');
  const [selectedTreasuryId, setSelectedTreasuryId] = useState<string>('treasury-main');
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>('wh-main');

  // Column Customization
  const [visibleKeys, setVisibleKeys] = useState<string[]>(() => {
    const saved = localStorage.getItem('shifts_pref_shifts_visible');
    return saved ? JSON.parse(saved) : SHIFTS_DEFAULT_VISIBLE;
  });
  const [orderedKeys, setOrderedKeys] = useState<string[]>(() => {
    const saved = localStorage.getItem('shifts_pref_shifts_order');
    return saved ? JSON.parse(saved) : SHIFTS_COLUMNS.map(c => c.key);
  });
  const [showColModal, setShowColModal] = useState<boolean>(false);

  // CCTV State
  const [selectedCam, setSelectedCam] = useState<number>(1);
  const [securityLog, setSecurityLog] = useState<Array<{ time: string; cam: string; event: string; status: 'info' | 'warning' | 'alert' }>>([
    { time: '10:15:22 AM', cam: 'كاميرا 01 (الدرج)', event: 'فتح درج النقدية بالماكينة تلقائياً بالفاتورة #INV-CSH1-0001', status: 'info' },
    { time: '11:42:05 AM', cam: 'كاميرا 04 (الخزينة)', event: 'رصد كشف غطاء الخزينة الرئيسية لتغذية النقدية', status: 'info' },
    { time: '01:20:10 PM', cam: 'كاميرا 01 (الدرج)', event: 'تخصيم صنف مرتجع بقيمة 180 ج.م بطلب كاشير', status: 'warning' },
    { time: '02:05:40 PM', cam: 'كاميرا 02 (المدخل)', event: 'حركة دخول مكثفة للعملاء بمنطقة الكاشير', status: 'info' },
  ]);
  const [snapshots, setSnapshots] = useState<string[]>([]);

  // Filters for History
  const [filterDate, setFilterDate] = useState('');
  const [filterCashier, setFilterCashier] = useState('all');
  const [showDailyConsolidated, setShowDailyConsolidated] = useState(false);
  const [consolidatedDate, setConsolidatedDate] = useState(new Date().toISOString().split('T')[0]);

  // Shift Transaction Advanced Filters
  const [txFilterCashier, setTxFilterCashier] = useState('all');
  const [txFilterCustomer, setTxFilterCustomer] = useState('all');
  const [txFilterPaymentMethod, setTxFilterPaymentMethod] = useState('all');
  const [txFilterCamera, setTxFilterCamera] = useState('all');
  const [txFilterSessionId, setTxFilterSessionId] = useState('all');

  // Load Real Data from MaroSyncEngine & Repositories
  useEffect(() => {
    // 1. Subscribe to POS Sessions
    const unsubSessions = MaroSyncEngine.subscribe<POSSession>('pos_sessions', (data) => {
      const sorted = (data || []).sort((a, b) => new Date(b.openedAt).getTime() - new Date(a.openedAt).getTime());
      setSessionsData(sorted);
      
      // Track active session for Term-01
      const active = sorted.find(s => s.status === 'OPEN');
      setActiveSession(active || null);
    });

    // 2. Subscribe to Sales Invoices
    const unsubInvoices = MaroSyncEngine.subscribe<SalesInvoice>('invoices', (data) => {
      setSales(data || []);
    });

    // 3. Subscribe to System Users
    const unsubUsers = MaroSyncEngine.subscribe<UserProfile>('users', (data) => {
      setUsers(data || []);
      if (data && data.length > 0) {
        // Pre-select first cashier/user
        const cashiers = data.filter(u => u.role === 'cashier' || u.role === 'admin' || u.role === 'developer');
        if (cashiers.length > 0) {
          setCashierId(cashiers[0].uid || (cashiers[0] as any).id || '');
          setCashierName(cashiers[0].displayName || (cashiers[0] as any).name || 'كاشير');
          if (cashiers[0].branchId) setSelectedWarehouseId(cashiers[0].branchId);
        }
      }
    });

    // 4. Subscribe to Warehouses
    const unsubWarehouses = MaroSyncEngine.subscribe<any>('warehouses', (data) => {
      setWarehouses(data || []);
    });

    // 5. Subscribe to Expenses
    const unsubExpenses = MaroSyncEngine.subscribe<any>('expenses', (data) => {
      setExpenses(data || []);
    });

    // Initial load fallback
    const initSessions = POSRepository.getSessions();
    setSessionsData(initSessions);
    const active = initSessions.find(s => s.status === 'OPEN');
    setActiveSession(active || null);
    setSales(SalesRepository.getInvoices());

    return () => {
      unsubSessions();
      unsubInvoices();
      unsubUsers();
      unsubWarehouses();
      unsubExpenses();
    };
  }, []);

  // Handle selecting different Cashiers
  const handleCashierSelect = (uId: string) => {
    setCashierId(uId);
    const found = users.find(u => u.uid === uId);
    if (found) {
      setCashierName(found.displayName);
      if (found.branchId) {
        setSelectedWarehouseId(found.branchId);
      }
    }
  };

  // Open Shift Handler
  const handleOpenSession = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(openingCashInput);
    if (isNaN(amount) || amount < 0) return alert('يرجى إدخال مبلغ افتتاح صحيح');

    const selectedUser = users.find(u => u.uid === cashierId);
    const warehouseObj = warehouses.find(w => w.id === selectedWarehouseId);
    
    const targetTreasuryName = selectedUser?.safeName || 'الخزنة الرئيسية (MAIN SAFE)';
    const targetWarehouseName = selectedUser?.warehouseName || warehouseObj?.name || 'المستودع الرئيسي';

    try {
      const session = await POSRepository.openSession(
        'TERM-01', 
        cashierId, 
        cashierName, 
        amount
      );

      const enrichedSession = {
        ...session,
        treasuryId: selectedTreasuryId,
        treasuryName: targetTreasuryName,
        warehouseId: selectedWarehouseId,
        warehouseName: targetWarehouseName
      };
      await MaroSyncEngine.saveDocument('pos_sessions', enrichedSession, false);

      setOpeningCashInput('');
      playSuccessSound();
      
      setSecurityLog(prev => [
        { 
          time: new Date().toLocaleTimeString('ar-EG'), 
          cam: 'كاميرا 01 (الدرج)', 
          event: `فتح وردية جديدة بواسطة الكاشير (${cashierName}) على ${targetTreasuryName} ومستودع (${targetWarehouseName}) برصيد افتتاح ${amount} ج.م`, 
          status: 'info' 
        },
        ...prev
      ]);
    } catch (err: any) {
      alert(err.message || 'خطأ في فتح الوردية');
    }
  };

  // Close Shift Handler
  const handleCloseSession = async () => {
    if (!activeSession) return;
    const actual = parseFloat(actualCashInput);
    if (isNaN(actual) || actual < 0) return alert('يرجى إدخال النقدية الفعلية الموجودة بالدرج');

    const sessionStartTime = new Date(activeSession.openedAt).getTime();
    const sessionInvoices = sales.filter(s => s.posSessionId === activeSession.id);
    const sessionExpenses = expenses.filter(e => new Date(e.date).getTime() >= sessionStartTime);
    
    let cashSales = 0;
    let cardSales = 0;
    let walletSales = 0;
    let creditSales = 0;
    let cashExpenses = 0;

    sessionInvoices.forEach(s => {
      if (s.paymentMethod === 'CASH') cashSales += s.grandTotal;
      else if (s.paymentMethod === 'CARD') cardSales += s.grandTotal;
      else if (s.paymentMethod === 'CREDIT') creditSales += s.grandTotal;
      else {
        cashSales += s.paidAmount || s.grandTotal;
        creditSales += s.dueAmount || 0;
      }
    });

    sessionExpenses.forEach(e => {
      cashExpenses += (e.amount || 0);
    });

    const totalSalesVal = cashSales + cardSales + walletSales + creditSales;
    const expectedCash = activeSession.openingFloat + cashSales - cashExpenses;
    const variance = actual - expectedCash;

    try {
      await POSRepository.closeSession(activeSession.id, actual, 'تم الإغلاق والمطابقة عبر شاشة الورديات');

      const closedSess: POSSession = {
        ...activeSession,
        status: 'CLOSED',
        closingCash: actual,
        expectedCash: expectedCash,
        variance: variance,
        closedAt: new Date().toISOString(),
        totalSales: totalSalesVal,
        totalTransactions: sessionInvoices.length,
        notes: `تقفيل نهائي يدوي - الفارق: ${variance} ج.م`
      };
      await MaroSyncEngine.saveDocument('pos_sessions', closedSess, false);

      setActualCashInput('');
      playSuccessSound();

      const whatsappSettings = WhatsAppNotificationService.getSettings();
      const zMsg = `📊 *تقرير تقفيل الوردية (Z-Report) للمدير*
🏪 *المنشأة:* شركة مارو للأعمال
👤 *الكاشير:* ${activeSession.cashierName}
⏰ *وقت الفتح:* ${new Date(activeSession.openedAt).toLocaleTimeString('ar-EG')}
🏁 *وقت الإغلاق:* ${new Date().toLocaleTimeString('ar-EG')}
━━━━━━━━━━━━━━━━━━━━━
💵 *رصيد الافتتاح:* ${(activeSession.openingFloat || 0).toLocaleString()} ج.م
🛒 *إجمالي المبيعات:* ${(totalSalesVal || 0).toLocaleString()} ج.م
💸 *إجمالي المصروفات النثرية:* ${(cashExpenses || 0).toLocaleString()} ج.م
━━━━━━━━━━━━━━━━━━━━━
💰 *مبيعات نقدية (Cash):* ${(cashSales || 0).toLocaleString()} ج.م
💳 *مبيعات بطاقة (Card):* ${(cardSales || 0).toLocaleString()} ج.م
🧾 *مبيعات آجل (Credit):* ${(creditSales || 0).toLocaleString()} ج.م
━━━━━━━━━━━━━━━━━━━━━
🎯 *النقدية المتوقعة بالدرج:* ${(expectedCash || 0).toLocaleString()} ج.م
📥 *النقدية الفعلية بالدرج:* ${(actual || 0).toLocaleString()} ج.م
⚖️ *الفارق (عجز/زيادة):* ${variance === 0 ? 'مطابق تماماً (0) ✅' : variance > 0 ? `+${variance} ج.م (زيادة)` : `${variance} ج.م (عجز ⚠️)`}`;

      WhatsAppNotificationService.openWhatsAppDirectly(whatsappSettings.managerPhoneNumber || '01050557853', zMsg);

      setActiveSession(null);
    } catch (err: any) {
      alert(err.message || 'خطأ أثناء إغلاق الوردية');
    }
  };

  // Calculate live session metric values for X Report
  let liveCash = 0;
  let liveCard = 0;
  let liveWallet = 0;
  let liveCredit = 0;
  let liveExpenses = 0;

  if (activeSession) {
    const sessionStartTime = new Date(activeSession.openedAt).getTime();
    const activeInvoices = sales.filter(s => s.posSessionId === activeSession.id || new Date(s.createdAt).getTime() >= sessionStartTime);
    const activeExp = expenses.filter(e => new Date(e.date).getTime() >= sessionStartTime);

    activeInvoices.forEach(s => {
      if (s.paymentMethod === 'CASH') liveCash += s.grandTotal;
      else if (s.paymentMethod === 'CARD') liveCard += s.grandTotal;
      else if (s.paymentMethod === 'CREDIT') liveCredit += s.grandTotal;
      else {
        liveCash += s.paidAmount || s.grandTotal;
        liveCredit += s.dueAmount || 0;
      }
    });

    activeExp.forEach(e => {
      liveExpenses += (e.amount || 0);
    });
  }

  const liveExpectedCash = activeSession ? (activeSession.openingFloat + liveCash - liveExpenses) : 0;

  // Filtered Sessions History
  const filteredSessions = sessionsData.filter(s => {
    if (filterDate && !s.openedAt.startsWith(filterDate)) return false;
    if (filterCashier !== 'all' && s.cashierName !== filterCashier) return false;
    return true;
  });

  const uniqueCashiers = Array.from(new Set(sessionsData.map(s => s.cashierName))).filter(Boolean);

  // Filtered Transactions
  const filteredSales = sales.filter(s => {
    if (txFilterSessionId !== 'all' && s.posSessionId !== txFilterSessionId) return false;
    if (txFilterCashier !== 'all' && (s as any).cashierName !== txFilterCashier) return false;
    if (txFilterCustomer !== 'all' && s.customerName !== txFilterCustomer) return false;
    if (txFilterPaymentMethod !== 'all') {
      const pm = (s.paymentMethod || '').toLowerCase();
      if (txFilterPaymentMethod === 'cash' && pm !== 'cash') return false;
      if (txFilterPaymentMethod === 'card' && pm !== 'card') return false;
      if (txFilterPaymentMethod === 'credit' && pm !== 'credit') return false;
    }
    return true;
  });

  const txCashiers = Array.from(new Set(sales.map(s => (s as any).cashierName).filter(Boolean)));
  const txCustomers = Array.from(new Set(sales.map(s => s.customerName).filter(Boolean)));

  // Daily Consolidated Report
  const dailySessions = sessionsData.filter(s => s.openedAt.startsWith(consolidatedDate));
  const dailyReport = {
    count: dailySessions.length,
    totalSales: dailySessions.reduce((acc, s) => acc + (s.totalSales || 0), 0),
    totalDiff: dailySessions.reduce((acc, s) => acc + (s.variance || 0), 0)
  };

  const captureSnapshot = () => {
    const timeStr = new Date().toLocaleTimeString('ar-EG');
    const camName = selectedCam === 1 ? 'كاميرا 01 (الدرج)' : selectedCam === 2 ? 'كاميرا 02 (المدخل)' : selectedCam === 3 ? 'كاميرا 03 (المخزن)' : 'كاميرا 04 (الخزينة)';
    setSnapshots(prev => [`لقطة أمنية تم التقاطها: ${camName} عند ${timeStr}`, ...prev]);
    playSuccessSound();
  };

  // Export to Excel
  const exportShiftsToExcel = () => {
    const dataToExport = filteredSessions.map((s, idx) => ({
      'رقم الوردية': s.id || `SESS-${idx + 1}`,
      'الكاشير المسؤول': s.cashierName,
      'وقت الفتح': new Date(s.openedAt).toLocaleString('ar-EG'),
      'وقت الإغلاق': s.closedAt ? new Date(s.closedAt).toLocaleString('ar-EG') : 'نشطة حالياً',
      'رصيد الافتتاح': s.openingFloat || 0,
      'إجمالي المبيعات': s.totalSales || 0,
      'النقدية المتوقعة': s.expectedCash || 0,
      'النقدية الفعلية': s.closingCash || 0,
      'الفارق (عجز/زيادة)': s.variance || 0,
      'الحالة': s.status === 'CLOSED' ? 'مغلقة' : 'مفتوحة'
    }));

    const str = JSON.stringify(dataToExport);
    const blob = new Blob([str], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `تقرير_الورديات_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    playSuccessSound();
  };

  // Print Past Session
  const handlePrintPastSession = (s: POSSession) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    const diff = s.variance || 0;
    printWindow.document.write(`
      <html dir="rtl" lang="ar">
        <head>
          <title>تقرير تقفيل وردية (Z-Report)</title>
          <style>
            body { font-family: Tahoma, Arial, sans-serif; padding: 20px; color: #111; }
            h2 { text-align: center; color: #333; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; }
            th, td { border: 1px solid #ddd; padding: 8px 12px; text-align: right; font-size: 14px; }
            th { background: #f4f4f4; }
          </style>
        </head>
        <body>
          <h2>تقرير تقفيل وردية كاشير (Z-Report)</h2>
          <p><strong>رقم الوردية:</strong> ${s.id}</p>
          <p><strong>اسم الكاشير:</strong> ${s.cashierName}</p>
          <p><strong>وقت الفتح:</strong> ${new Date(s.openedAt).toLocaleString('ar-EG')}</p>
          <p><strong>وقت الإغلاق:</strong> ${s.closedAt ? new Date(s.closedAt).toLocaleString('ar-EG') : '-'}</p>
          <table>
            <tr><th>البند المالي</th><th>القيمة (ج.م)</th></tr>
            <tr><td>رصيد افتتاح الوردية</td><td>${s.openingFloat || 0}</td></tr>
            <tr><td>النقدية المتوقعة بالدرج</td><td>${s.expectedCash || 0}</td></tr>
            <tr><td>النقدية الفعلية بالدرج</td><td>${s.closingCash || 0}</td></tr>
            <tr><td>الفارق (عجز / زيادة)</td><td><strong>${diff === 0 ? 'مطابق تماماً (0)' : diff > 0 ? `+${diff} (زيادة)` : `${diff} (عجز)`}</strong></td></tr>
          </table>
          <script>window.print();</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto pb-28 text-slate-100" dir="rtl">
      
      {/* Dynamic Modern Hero Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#0f172a] via-[#1e1b4b] to-[#0f172a] p-6 sm:p-8 rounded-3xl border border-indigo-500/30 shadow-2xl">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 bg-gradient-to-r from-amber-500/20 to-amber-600/20 border border-amber-500/40 rounded-full text-amber-300 text-xs font-black flex items-center gap-1.5 shadow-sm">
                <Sparkles size={14} className="text-amber-400" />
                <span>إدارة الورديات الذكية v4.0</span>
              </span>
              <span className="px-3 py-1 bg-blue-500/10 border border-blue-500/30 rounded-full text-blue-300 text-xs font-bold flex items-center gap-1.5">
                <Video size={14} className="text-blue-400" />
                <span>CCTV Live Sync</span>
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3">
              <ShieldAlert className="text-amber-400 w-8 h-8" />
              <span>إدارة الورديات وتغطية الكاميرات (CCTV & Shifts)</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 font-medium max-w-2xl">
              متابعة الورديات المفتوحة والمغلقة، الرقابة اللحظية على حركة النقدية والـ Z-Report بالربط المباشر مع كاميرات المراقبة الموزعة بالفرع.
            </p>
          </div>

          <div className="flex items-center bg-[#0a0f1d]/80 backdrop-blur-md p-1.5 rounded-2xl border border-slate-700/80 gap-1.5 w-full md:w-auto shadow-inner">
            <button
              onClick={() => setActiveTab('shifts')}
              className={`flex-1 md:flex-none px-6 py-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === 'shifts' 
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-600/30 border border-blue-400/40' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <Clock size={16} />
              <span>تقارير الورديات Z & X</span>
            </button>
            <button
              onClick={() => setActiveTab('cameras')}
              className={`flex-1 md:flex-none px-6 py-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === 'cameras' 
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-600/30 border border-blue-400/40' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <Video size={16} />
              <span>كاميرات المراقبة M-CCTV</span>
            </button>
          </div>
        </div>
      </div>

      {activeTab === 'shifts' ? (
        <div className="space-y-6">
          
          {/* Active Session Panel */}
          {activeSession ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Active Session Info & X Report Live Metrics */}
              <div className="lg:col-span-7 bg-[#13192b] p-6 rounded-3xl border border-slate-800 shadow-xl space-y-5">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-800/80 pb-4 gap-3">
                  <div>
                    <span className="bg-emerald-500/15 text-emerald-300 border border-emerald-500/40 px-3.5 py-1 rounded-full text-xs font-black inline-flex items-center gap-2 animate-pulse shadow-sm">
                      <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                      <span>الوردية نشطة ومفتوحة الآن</span>
                    </span>
                    
                    <div className="mt-3 flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-blue-600/20 border border-blue-500/30 text-blue-400 flex items-center justify-center font-bold">
                        <Users size={16} />
                      </div>
                      <div>
                        <p className="text-[11px] text-slate-400 font-bold">الكاشير المسؤول</p>
                        <p className="text-sm font-black text-white">{activeSession.cashierName}</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      <span className="text-[11px] font-bold text-amber-300 bg-amber-500/10 border border-amber-500/30 px-2.5 py-1 rounded-xl flex items-center gap-1.5">
                        <Vault size={14} className="text-amber-400" />
                        <span>الخزنة: {activeSession.treasuryName || 'الخزنة الرئيسية'}</span>
                      </span>
                      <span className="text-[11px] font-bold text-emerald-300 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 rounded-xl flex items-center gap-1.5">
                        <Store size={14} className="text-emerald-400" />
                        <span>المخزن: {activeSession.warehouseName || 'المستودع الرئيسي'}</span>
                      </span>
                    </div>
                  </div>

                  <div className="text-right sm:text-left bg-[#0a0f1d] p-3.5 rounded-2xl border border-slate-800 min-w-[140px]">
                    <p className="text-[10px] text-slate-400 font-bold">رصيد بداية الوردية</p>
                    <p className="text-xl font-black text-amber-400 font-mono mt-0.5">{(activeSession.openingFloat || 0).toLocaleString()} ج.م</p>
                    <p className="text-[10px] text-slate-500 font-mono mt-1">الفتح: {new Date(activeSession.openedAt).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <h3 className="font-black text-sm text-white flex items-center gap-2">
                    <Zap size={18} className="text-amber-400 animate-bounce" />
                    <span>تقرير X اللحظي للمبيعات (Live X-Report Metrics)</span>
                  </h3>
                  <span className="text-[10px] text-slate-400 font-mono">محدث آلياً</span>
                </div>

                {/* KPI Cards Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-gradient-to-br from-emerald-950/60 via-[#0e1726] to-[#0a0f1d] p-3.5 rounded-2xl border border-emerald-500/30 hover:border-emerald-500/60 transition-all shadow-md group">
                    <div className="flex items-center justify-between text-emerald-400 mb-1">
                      <span className="text-[11px] font-bold">مبيعات كاش</span>
                      <DollarSign size={16} className="group-hover:scale-110 transition-transform" />
                    </div>
                    <p className="text-lg font-black text-emerald-300 font-mono mt-1">{(liveCash || 0).toLocaleString()} <span className="text-xs">ج.م</span></p>
                  </div>

                  <div className="bg-gradient-to-br from-blue-950/60 via-[#0e1726] to-[#0a0f1d] p-3.5 rounded-2xl border border-blue-500/30 hover:border-blue-500/60 transition-all shadow-md group">
                    <div className="flex items-center justify-between text-blue-400 mb-1">
                      <span className="text-[11px] font-bold">مبيعات فيزا</span>
                      <CreditCard size={16} className="group-hover:scale-110 transition-transform" />
                    </div>
                    <p className="text-lg font-black text-blue-300 font-mono mt-1">{(liveCard || 0).toLocaleString()} <span className="text-xs">ج.م</span></p>
                  </div>

                  <div className="bg-gradient-to-br from-purple-950/60 via-[#0e1726] to-[#0a0f1d] p-3.5 rounded-2xl border border-purple-500/30 hover:border-purple-500/60 transition-all shadow-md group">
                    <div className="flex items-center justify-between text-purple-400 mb-1">
                      <span className="text-[11px] font-bold">مبيعات محفظة</span>
                      <Wallet size={16} className="group-hover:scale-110 transition-transform" />
                    </div>
                    <p className="text-lg font-black text-purple-300 font-mono mt-1">{(liveWallet || 0).toLocaleString()} <span className="text-xs">ج.م</span></p>
                  </div>

                  <div className="bg-gradient-to-br from-amber-950/60 via-[#0e1726] to-[#0a0f1d] p-3.5 rounded-2xl border border-amber-500/30 hover:border-amber-500/60 transition-all shadow-md group">
                    <div className="flex items-center justify-between text-amber-400 mb-1">
                      <span className="text-[11px] font-bold">مبيعات آجل</span>
                      <Clock size={16} className="group-hover:scale-110 transition-transform" />
                    </div>
                    <p className="text-lg font-black text-amber-300 font-mono mt-1">{(liveCredit || 0).toLocaleString()} <span className="text-xs">ج.م</span></p>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-amber-500/20 via-yellow-500/10 to-amber-500/20 border border-amber-500/40 p-4 rounded-2xl flex justify-between items-center shadow-lg">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center font-bold">
                      <Vault size={18} />
                    </div>
                    <div>
                      <span className="font-black text-xs text-white block">النقدية المتوقعة بالدرج (Expected Cash)</span>
                      <span className="text-[10px] text-slate-400">تشمل رصيد الافتتاح + المبيعات الكاش - المصروفات</span>
                    </div>
                  </div>
                  <span className="text-2xl font-black text-amber-300 font-mono">{(liveExpectedCash || 0).toLocaleString()} ج.م</span>
                </div>
              </div>

              {/* Close Session Panel */}
              <div className="lg:col-span-5 bg-[#13192b] p-6 rounded-3xl border border-slate-800 shadow-xl space-y-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-10 h-10 rounded-2xl bg-rose-500/20 border border-rose-500/30 text-rose-400 flex items-center justify-center">
                      <Lock size={20} />
                    </div>
                    <div>
                      <h3 className="font-black text-base text-white">إغلاق الوردية وتوليد تقرير Z</h3>
                      <p className="text-[11px] text-slate-400">قم بفرز النقدية الفعلية بالماكينة وإدخال المبلغ لمطابقته:</p>
                    </div>
                  </div>

                  <div className="space-y-4 pt-4">
                    <div>
                      <label className="text-xs text-slate-300 font-black block mb-1.5">النقدية الفعلية بالدرج (Actual Cash) *</label>
                      <div className="relative">
                        <input
                          type="number"
                          placeholder="أدخل النقدية الفعلية المحصولة..."
                          className="w-full bg-[#0a0f1d] border border-slate-700/80 p-4 rounded-2xl text-xl font-black font-mono focus:outline-none focus:border-amber-400 text-white pr-4 pl-12 shadow-inner"
                          value={actualCashInput}
                          onChange={e => setActualCashInput(e.target.value)}
                        />
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">ج.م</span>
                      </div>
                    </div>

                    {actualCashInput !== '' && (
                      <div className="p-3 bg-[#0a0f1d] rounded-2xl border border-slate-800 space-y-1 text-xs">
                        <div className="flex justify-between items-center">
                          <span className="text-slate-400 font-bold">الفارق المحسوب:</span>
                          {(() => {
                            const act = parseFloat(actualCashInput) || 0;
                            const diff = act - liveExpectedCash;
                            if (diff === 0) {
                              return <span className="font-black text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-lg border border-emerald-500/30">مطابق تماماً (0)</span>;
                            } else if (diff > 0) {
                              return <span className="font-black text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-lg border border-emerald-500/30">زيادة +{diff} ج.م</span>;
                            } else {
                              return <span className="font-black text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-lg border border-rose-500/30">عجز {diff} ج.م</span>;
                            }
                          })()}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <button
                    type="button"
                    onClick={handleCloseSession}
                    className="w-full bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white py-4 rounded-2xl font-black transition-all shadow-xl shadow-rose-600/25 active:scale-98 text-xs flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Lock size={18} />
                    <span>تأكيد إغلاق الوردية وحفظ Z-Report</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handlePrintPastSession(activeSession)}
                    className="w-full bg-[#0a0f1d] border border-slate-700/80 text-slate-300 hover:text-white hover:bg-slate-800 py-3 rounded-2xl font-bold transition-all text-xs flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Printer size={16} />
                    <span>طباعة معاينة تقرير الوردية</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Open Session Form Screen */
            <div className="bg-[#13192b] p-8 rounded-3xl border border-slate-800 max-w-lg mx-auto space-y-6 shadow-2xl text-center relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 via-indigo-500 to-amber-500"></div>

              <div className="w-20 h-20 bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-500/30 text-amber-400 rounded-3xl flex items-center justify-center mx-auto text-3xl shadow-xl shadow-amber-500/10">
                <Unlock size={36} />
              </div>

              <div>
                <h2 className="text-xl font-black text-white">لا توجد وردية مفتوحة حالياً</h2>
                <p className="text-xs text-slate-400 mt-1 font-medium">قم باختيار الموظف المسؤول وإدخال عهدة بداية الخزينة لفتح وردية جديدة</p>
              </div>

              <form onSubmit={handleOpenSession} className="space-y-4 text-right">
                <div>
                  <label className="text-xs text-slate-300 font-bold block mb-1.5">اختر الكاشير / الموظف المسؤول: *</label>
                  {users.length > 0 ? (
                    <select
                      className="w-full bg-[#0a0f1d] border border-slate-700/80 p-3.5 rounded-2xl text-xs font-bold text-white focus:outline-none focus:border-blue-500 transition-all"
                      value={cashierId}
                      onChange={e => handleCashierSelect(e.target.value)}
                    >
                      {users.map((u, uIdx) => (
                        <option key={u.uid || u.id || `usr-opt-${uIdx}`} value={u.uid || u.id}>
                          {u.displayName || (u as any).name || 'مستخدم'} (@{u.email ? u.email.split('@')[0] : 'user'})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      className="w-full bg-[#0a0f1d] border border-slate-700/80 p-3.5 rounded-2xl text-xs font-bold text-white focus:outline-none"
                      value={cashierName}
                      onChange={e => setCashierName(e.target.value)}
                      required
                    />
                  )}
                </div>

                {/* Linked Treasury & Warehouse */}
                {(() => {
                  const selectedUser = users.find(u => u.uid === cashierId);
                  const warehouseObj = warehouses.find(w => w.id === selectedWarehouseId);
                  const tName = selectedUser?.safeName || 'الخزينة الرئيسية (MAIN SAFE)';
                  const wName = selectedUser?.warehouseName || warehouseObj?.name || 'المستودع الرئيسي';

                  return (
                    <div className="bg-[#0a0f1d] p-4 rounded-2xl border border-amber-500/30 space-y-2.5 text-xs">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                        <span className="text-amber-400 font-bold flex items-center gap-1.5">
                          <Vault size={16} />
                          <span>الخزنة المربوطة:</span>
                        </span>
                        <span className="font-bold text-amber-300 bg-amber-500/10 border border-amber-500/30 px-3 py-1 rounded-xl text-[11px]">
                          {tName}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                          <Store size={16} />
                          <span>المخزن المربوط:</span>
                        </span>
                        <span className="font-bold text-emerald-300 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 rounded-xl text-[11px]">
                          {wName}
                        </span>
                      </div>
                    </div>
                  );
                })()}

                <div>
                  <label className="text-xs text-slate-300 font-bold block mb-1.5">رصيد الافتتاح النقدي (بداية الوردية): *</label>
                  <div className="relative">
                    <input
                      type="number"
                      placeholder="مثال: 500"
                      className="w-full bg-[#0a0f1d] border border-slate-700/80 p-3.5 rounded-2xl text-xs font-bold font-mono text-white focus:outline-none focus:border-amber-400 pr-4 pl-12 shadow-inner"
                      value={openingCashInput}
                      onChange={e => setOpeningCashInput(e.target.value)}
                      required
                    />
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">ج.م</span>
                  </div>
                </div>

                <button 
                  type="submit" 
                  className="w-full mt-2 bg-gradient-to-r from-amber-500 via-amber-600 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 text-slate-950 py-4 rounded-2xl font-black transition-all shadow-xl shadow-amber-500/20 active:scale-98 text-xs flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Unlock size={18} />
                  <span>فتح الوردية وتعيين الخزنة والمخزن</span>
                </button>
              </form>
            </div>
          )}

          {/* Past Z-Reports History Archive */}
          <div className="bg-[#13192b] p-6 rounded-3xl border border-slate-800 space-y-5 shadow-xl">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
              <div>
                <h3 className="font-black text-base text-white flex items-center gap-2">
                  <FileText size={20} className="text-amber-400" />
                  <span>أرشيف تقارير تقفيل الورديات السابقة (Z-Reports History)</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">مراجعة سجلات الورديات، الفوارق المالية والعجز/الزيادة، وتصدير التقارير المجمعة</p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
                <button
                  type="button"
                  onClick={exportShiftsToExcel}
                  className="bg-emerald-600/15 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-600 hover:text-white px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
                  title="تصدير جدول الورديات إلى إكسيل"
                >
                  <Download size={14} />
                  <span>تصدير Excel</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowColModal(true)}
                  className="bg-[#0a0f1d] border border-slate-700/80 hover:border-amber-400 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-200 hover:text-white transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
                  title="تخصيص أعمدة جدول الورديات"
                >
                  <Sliders size={14} className="text-amber-400" />
                  <span>الأعمدة</span>
                </button>

                <div className="flex items-center gap-1.5 bg-[#0a0f1d] border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs">
                  <Calendar size={13} className="text-slate-400" />
                  <input 
                    type="date" 
                    value={filterDate} 
                    onChange={e => setFilterDate(e.target.value)}
                    className="bg-transparent text-[11px] text-white outline-none"
                  />
                </div>

                <div className="flex items-center gap-1.5 bg-[#0a0f1d] border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs">
                  <Users size={13} className="text-slate-400" />
                  <select 
                    value={filterCashier} 
                    onChange={e => setFilterCashier(e.target.value)}
                    className="bg-transparent text-[11px] text-white outline-none cursor-pointer"
                  >
                    <option value="all" className="bg-[#0a0f1d]">كل الموظفين</option>
                    {uniqueCashiers.map((name, nameIdx) => (
                      <option key={`csh-filter-${name}-${nameIdx}`} value={name} className="bg-[#0a0f1d]">{name}</option>
                    ))}
                  </select>
                </div>

                <button 
                  onClick={() => setShowDailyConsolidated(!showDailyConsolidated)}
                  className="bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white px-3.5 py-2 rounded-xl text-xs font-black shadow-md transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Activity size={14} />
                  <span>{showDailyConsolidated ? 'إخفاء التقرير المجمع' : 'التقرير اليومي المجمع'}</span>
                </button>
              </div>
            </div>

            {/* Column Manager Modal */}
            {showColModal && (
              <ColumnManagerModal
                tableName="shifts"
                allColumns={SHIFTS_COLUMNS}
                defaultVisibleKeys={SHIFTS_DEFAULT_VISIBLE}
                currentVisibleKeys={visibleKeys}
                currentOrderedKeys={orderedKeys}
                onSave={(vis, ord) => {
                  setVisibleKeys(vis);
                  setOrderedKeys(ord);
                }}
                onClose={() => setShowColModal(false)}
              />
            )}

            {showDailyConsolidated && (
              <div className="bg-[#0a0f1d] p-5 rounded-2xl border border-indigo-500/30 space-y-4 animate-in slide-in-from-top-2 duration-300 shadow-inner">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <h4 className="text-xs font-black text-indigo-300 flex items-center gap-2">
                    <Activity size={16} className="text-indigo-400" />
                    <span>التقرير اليومي المجمع ليوم: {consolidatedDate}</span>
                  </h4>
                  <div className="flex items-center gap-2">
                    <input 
                      type="date" 
                      value={consolidatedDate} 
                      onChange={e => setConsolidatedDate(e.target.value)}
                      className="bg-[#13192b] border border-slate-700/80 rounded-xl px-3 py-1.5 text-xs text-white"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 bg-[#13192b] rounded-2xl border border-slate-800">
                    <p className="text-[11px] text-slate-400 font-bold">عدد الورديات المنفذة</p>
                    <p className="text-xl font-black text-white mt-1">{dailyReport.count} وردية</p>
                  </div>
                  <div className="p-4 bg-[#13192b] rounded-2xl border border-slate-800">
                    <p className="text-[11px] text-slate-400 font-bold">إجمالي مبيعات اليوم</p>
                    <p className="text-xl font-black text-amber-400 font-mono mt-1">{(dailyReport.totalSales || 0).toLocaleString()} ج.م</p>
                  </div>
                  <div className="p-4 bg-[#13192b] rounded-2xl border border-slate-800">
                    <p className="text-[11px] text-slate-400 font-bold">صافي عجز/زيادة الكلي</p>
                    <p className={`text-xl font-black font-mono mt-1 ${(dailyReport.totalDiff || 0) < 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                      {(dailyReport.totalDiff || 0).toLocaleString()} ج.م
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Archive Table */}
            <div className="overflow-x-auto rounded-2xl border border-slate-800/80 shadow-inner">
              <table className="w-full text-right text-xs">
                <thead className="bg-[#0a0f1d] text-slate-300 font-black border-b border-slate-800">
                  <tr>
                    {orderedKeys.map((colKey, headIdx) => {
                      if (!visibleKeys.includes(colKey)) return null;
                      const colDef = SHIFTS_COLUMNS.find(c => c.key === colKey);
                      return (
                        <th key={`shift-th-${colKey}-${headIdx}`} className={`p-3.5 ${colKey !== 'id' && colKey !== 'cashierName' && colKey !== 'openedAt' && colKey !== 'closedAt' ? 'text-center' : ''}`}>
                          {colDef?.label}
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 font-mono text-slate-200">
                  {filteredSessions.length > 0 ? filteredSessions.map((s, sIdx) => {
                    const diff = s.variance || 0;
                    const rowKey = s.id || `shift-row-${sIdx}`;
                    return (
                      <tr key={rowKey} className="hover:bg-slate-800/40 transition-colors">
                        {orderedKeys.map((colKey, cellIdx) => {
                          if (!visibleKeys.includes(colKey)) return null;
                          const cellKey = `cell-${rowKey}-${colKey}-${cellIdx}`;
                          switch (colKey) {
                            case 'id':
                              return (
                                <td key={cellKey} className="p-3.5 font-mono text-[11px] text-amber-400 font-bold">
                                  #{s.id ? s.id.slice(0, 8) : `SESS-${sIdx}`}
                                </td>
                              );
                            case 'cashierName':
                              return (
                                <td key={cellKey} className="p-3.5 font-bold font-sans text-white">
                                  {s.cashierName}
                                </td>
                              );
                            case 'openedAt':
                              return (
                                <td key={cellKey} className="p-3.5 text-[11px] text-slate-400 font-sans">
                                  {new Date(s.openedAt).toLocaleString('ar-EG')}
                                </td>
                              );
                            case 'closedAt':
                              return (
                                <td key={cellKey} className="p-3.5 text-[11px] text-slate-400 font-sans">
                                  {s.closedAt ? new Date(s.closedAt).toLocaleString('ar-EG') : '-'}
                                </td>
                              );
                            case 'openingBalance':
                              return (
                                <td key={cellKey} className="p-3.5 text-center text-slate-200 font-bold">
                                  {(s.openingFloat || 0).toLocaleString()} ج.م
                                </td>
                              );
                            case 'totalSales':
                              return (
                                <td key={cellKey} className="p-3.5 text-center font-black text-amber-300">
                                  {(s.totalSales || 0).toLocaleString()} ج.م
                                </td>
                              );
                            case 'totalCash':
                              return (
                                <td key={cellKey} className="p-3.5 text-center text-emerald-400 font-bold">
                                  {(s.totalSales || 0).toLocaleString()} ج.م
                                </td>
                              );
                            case 'totalCard':
                              return (
                                <td key={cellKey} className="p-3.5 text-center text-blue-400 font-bold">
                                  0 ج.م
                                </td>
                              );
                            case 'totalExpenses':
                              return (
                                <td key={cellKey} className="p-3.5 text-center text-rose-400 font-bold">
                                  0 ج.م
                                </td>
                              );
                            case 'closingBalance':
                              return (
                                <td key={cellKey} className="p-3.5 text-center font-bold text-white">
                                  {(s.closingCash ?? s.expectedCash ?? 0).toLocaleString()} ج.م
                                </td>
                              );
                            case 'difference':
                              return (
                                <td key={cellKey} className="p-3.5 text-center font-bold font-sans">
                                  {diff === 0 ? (
                                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                                      مطابق (0 ج)
                                    </span>
                                  ) : diff > 0 ? (
                                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                                      +{diff.toLocaleString()} ج (زيادة)
                                    </span>
                                  ) : (
                                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-500/15 text-rose-300 border border-rose-500/30">
                                      {diff.toLocaleString()} ج (عجز)
                                    </span>
                                  )}
                                </td>
                              );
                            case 'status':
                              return (
                                <td key={cellKey} className="p-3.5 text-center font-sans">
                                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                                    s.status === 'CLOSED'
                                      ? 'bg-slate-800 text-slate-300 border border-slate-700'
                                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 animate-pulse'
                                  }`}>
                                    {s.status === 'CLOSED' ? 'مغلقة' : 'نشطة'}
                                  </span>
                                </td>
                              );
                            case 'actions':
                              return (
                                <td key={cellKey} className="p-3.5 text-center font-sans">
                                  <div className="flex items-center justify-center gap-1.5">
                                    <button
                                      type="button"
                                      onClick={() => handlePrintPastSession(s)}
                                      className="bg-[#0a0f1d] hover:bg-slate-800 text-slate-200 border border-slate-700/80 px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all inline-flex items-center gap-1 cursor-pointer"
                                    >
                                      <Printer size={13} />
                                      <span>طباعة</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const whatsappSettings = WhatsAppNotificationService.getSettings();
                                        const zMsg = `📊 *تقرير تقفيل الوردية (Z-Report)*
🏪 شركة مارو للأعمال
👤 *الكاشير:* ${s.cashierName}
⏰ *وقت الفتح:* ${new Date(s.openedAt).toLocaleString('ar-EG')}
🏁 *وقت الإغلاق:* ${s.closedAt ? new Date(s.closedAt).toLocaleString('ar-EG') : '-'}
💵 *رصيد الافتتاح:* ${s.openingFloat} ج.م
🎯 *المتوقع بالدرج:* ${s.expectedCash || 0} ج.م
📥 *الفعلي بالدرج:* ${s.closingCash || 0} ج.م
⚖️ *الفارق:* ${diff === 0 ? 'مطابق تماماً 0 ج.م ✅' : diff > 0 ? `+${diff} ج.م (زيادة)` : `${diff} ج.م (عجز ⚠️)`}`;
                                        WhatsAppNotificationService.openWhatsAppDirectly(whatsappSettings.managerPhoneNumber || '01050557853', zMsg);
                                      }}
                                      className="bg-emerald-600 hover:bg-emerald-500 text-white px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all inline-flex items-center gap-1 shadow-sm cursor-pointer"
                                    >
                                      <MessageSquare size={13} />
                                      <span>واتساب</span>
                                    </button>
                                  </div>
                                </td>
                              );
                            default:
                              return null;
                          }
                        })}
                      </tr>
                    );
                  }) : (
                    <tr>
                      <td colSpan={visibleKeys.length} className="p-8 text-center text-slate-400 font-sans italic">
                        لا توجد ورديات مطابقة لخيارات البحث
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Advanced Transaction Audit Section */}
          <div className="bg-[#13192b] p-6 rounded-3xl border border-slate-800 space-y-6 shadow-xl">
            <div>
              <h3 className="font-black text-base text-white flex items-center gap-2">
                <Search size={20} className="text-blue-400" />
                <span>المراقبة والفلترة المتقدمة لمعاملات وفواتير الوردية (Shift Sales Audit)</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                استعلام لحظي وتفصيلي للمبيعات حسب طريقة البيع (كاش، آجل، جزئي، فيزا)، العميل، والربط مع كاميرات المراقبة لتتبع النقدية والأمان بالدرج.
              </p>
            </div>

            {/* Filters Dashboard Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
              <div>
                <label className="text-xs text-slate-300 block mb-1 font-bold">الوردية / الجلسة:</label>
                <select
                  value={txFilterSessionId}
                  onChange={e => setTxFilterSessionId(e.target.value)}
                  className="w-full bg-[#0a0f1d] border border-slate-700/80 p-3 rounded-2xl text-xs font-bold text-white focus:outline-none focus:border-blue-500 cursor-pointer"
                >
                  <option value="all">كل الورديات (تاريخي ومفتوح)</option>
                  {sessionsData.map((s, sessIdx) => (
                    <option key={s.id || `filter-sess-${sessIdx}`} value={s.id}>
                      {s.cashierName} - {new Date(s.openedAt).toLocaleDateString('ar-EG')} ({s.status === 'CLOSED' ? 'مغلقة' : 'نشطة'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-300 block mb-1 font-bold">الكاشير / الموظف:</label>
                <select
                  value={txFilterCashier}
                  onChange={e => setTxFilterCashier(e.target.value)}
                  className="w-full bg-[#0a0f1d] border border-slate-700/80 p-3 rounded-2xl text-xs font-bold text-white focus:outline-none focus:border-blue-500 cursor-pointer"
                >
                  <option value="all">كل الموظفين</option>
                  {txCashiers.map((name, cshIdx) => (
                    <option key={`tx-cashier-${name}-${cshIdx}`} value={name}>{name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-300 block mb-1 font-bold">العميل:</label>
                <select
                  value={txFilterCustomer}
                  onChange={e => setTxFilterCustomer(e.target.value)}
                  className="w-full bg-[#0a0f1d] border border-slate-700/80 p-3 rounded-2xl text-xs font-bold text-white focus:outline-none focus:border-blue-500 cursor-pointer"
                >
                  <option value="all">كل العملاء</option>
                  {txCustomers.map((custName, custIdx) => (
                    <option key={`tx-customer-${custName}-${custIdx}`} value={custName}>{custName}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-300 block mb-1 font-bold">طريقة الدفع:</label>
                <select
                  value={txFilterPaymentMethod}
                  onChange={e => setTxFilterPaymentMethod(e.target.value)}
                  className="w-full bg-[#0a0f1d] border border-slate-700/80 p-3 rounded-2xl text-xs font-bold text-white focus:outline-none focus:border-blue-500 cursor-pointer"
                >
                  <option value="all">كل طرق البيع</option>
                  <option value="cash">كاش (نقدي كامل)</option>
                  <option value="card">فيزا / بطاقة (Visa)</option>
                  <option value="credit">آجل (Credit)</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-300 block mb-1 font-bold">تغطية الكاميرات:</label>
                <select
                  value={txFilterCamera}
                  onChange={e => setTxFilterCamera(e.target.value)}
                  className="w-full bg-[#0a0f1d] border border-slate-700/80 p-3 rounded-2xl text-xs font-bold text-white focus:outline-none focus:border-blue-500 cursor-pointer"
                >
                  <option value="all">كل كاميرات المراقبة</option>
                  <option value="cam1">كاميرا 01 (درج النقدية بالماكينة)</option>
                  <option value="cam4">كاميرا 04 (خزينة وبوابة الدفع)</option>
                  <option value="cam2">كاميرا 02 (مدخل صالة العرض)</option>
                </select>
              </div>
            </div>

            {/* Results Table */}
            <div className="overflow-x-auto rounded-2xl border border-slate-800/80 shadow-inner">
              <table className="w-full text-right text-xs">
                <thead className="bg-[#0a0f1d] text-slate-300 font-black border-b border-slate-800">
                  <tr>
                    <th className="p-3.5">رقم الفاتورة</th>
                    <th className="p-3.5">العميل</th>
                    <th className="p-3.5">التاريخ والوقت</th>
                    <th className="p-3.5 text-center">طريقة البيع</th>
                    <th className="p-3.5 text-center">الصافي النهائي</th>
                    <th className="p-3.5 text-center">المدفوع بالكامل</th>
                    <th className="p-3.5 text-center">المتبقي الآجل</th>
                    <th className="p-3.5 text-center">الكاميرا المرتبطة</th>
                    <th className="p-3.5 text-center">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 font-mono text-slate-200">
                  {filteredSales.length > 0 ? (
                    filteredSales.map((sale, saleIdx) => {
                      const isPartial = (sale.paidAmount || 0) > 0 && (sale.dueAmount || 0) > 0;
                      let payBadge = <span className="bg-emerald-500/15 text-emerald-300 px-2.5 py-1 rounded-lg text-[10px] font-black border border-emerald-500/30">كاش نقدي</span>;
                      let cameraLabel = "كاميرا 01 (الدرج)";
                      let camId = 1;

                      if (isPartial) {
                        payBadge = <span className="bg-amber-500/15 text-amber-300 px-2.5 py-1 rounded-lg text-[10px] font-black border border-amber-500/30">دفع جزئي</span>;
                        cameraLabel = "كاميرا 04 (الخزينة)";
                        camId = 4;
                      } else if (sale.paymentMethod === 'CREDIT') {
                        payBadge = <span className="bg-rose-500/15 text-rose-300 px-2.5 py-1 rounded-lg text-[10px] font-black border border-rose-500/30">بيع آجل</span>;
                        cameraLabel = "كاميرا 02 (المدخل)";
                        camId = 2;
                      } else if (sale.paymentMethod === 'CARD') {
                        payBadge = <span className="bg-blue-500/15 text-blue-300 px-2.5 py-1 rounded-lg text-[10px] font-black border border-blue-500/30">فيزا / بطاقة</span>;
                        cameraLabel = "كاميرا 04 (الخزينة)";
                        camId = 4;
                      }

                      const handlePrintInvoice = (s: SalesInvoice) => {
                        printSalesInvoice(s);
                      };

                      const saleKey = sale.id || sale.invoiceNumber || `sale-item-${saleIdx}`;

                      return (
                        <tr key={saleKey} className="hover:bg-slate-800/40 transition-colors">
                          <td className="p-3.5 font-bold text-amber-400">#{sale.invoiceNumber || (sale.id ? sale.id.substring(0, 8) : `INV-${saleIdx}`)}</td>
                          <td className="p-3.5 font-bold font-sans text-white">{sale.customerName || 'عميل نقدي'}</td>
                          <td className="p-3.5 text-slate-400 text-[11px]">{new Date(sale.createdAt).toLocaleString('ar-EG')}</td>
                          <td className="p-3.5 text-center font-sans">{payBadge}</td>
                          <td className="p-3.5 text-center text-white font-bold">{(sale.grandTotal || 0).toLocaleString()} ج.م</td>
                          <td className="p-3.5 text-center text-emerald-400 font-bold">{(sale.paidAmount || sale.grandTotal || 0).toLocaleString()} ج.م</td>
                          <td className="p-3.5 text-center text-rose-400 font-bold">{(sale.dueAmount || 0).toLocaleString()} ج.م</td>
                          <td className="p-3.5 text-center font-sans">
                            <span className="text-[10px] bg-slate-900 text-slate-300 border border-slate-700/80 px-2.5 py-1 rounded-lg inline-flex items-center gap-1 font-bold">
                              <Video size={12} className="text-amber-400" />
                              <span>{cameraLabel}</span>
                            </span>
                          </td>
                          <td className="p-3.5 text-center font-sans flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handlePrintInvoice(sale)}
                              className="bg-[#0a0f1d] hover:bg-slate-800 text-slate-200 border border-slate-700/80 px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all inline-flex items-center gap-1 cursor-pointer"
                            >
                              <Printer size={13} />
                              <span>طباعة</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedCam(camId);
                                setActiveTab('cameras');
                                playSuccessSound();
                              }}
                              className="bg-amber-500/10 hover:bg-amber-500 text-amber-300 hover:text-slate-950 border border-amber-500/30 px-2.5 py-1 rounded-xl text-[11px] font-black transition-all inline-flex items-center gap-1 cursor-pointer"
                              title="تبديل الكاميرا لمراجعة تسجيل عملية الدفع هذه أمنياً"
                            >
                              <Video size={13} />
                              <span>بث الكاميرا</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={9} className="p-8 text-center text-slate-400 font-sans italic">
                        لا توجد فواتير أو معاملات مطابقة لمعايير البحث والفلترة المحددة
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      ) : (
        /* CCTV Cameras Stream View */
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Live Camera Grid Feed */}
            <div className="lg:col-span-2 space-y-4">
              <div className="bg-[#13192b] rounded-3xl border border-slate-800 p-5 relative overflow-hidden shadow-2xl">
                {/* Simulated Live Camera Stream */}
                <div className="aspect-video bg-black rounded-2xl relative flex items-center justify-center overflow-hidden border border-slate-800 shadow-inner">
                  
                  {/* Camera overlay HUD */}
                  <div className="absolute top-4 left-4 bg-rose-600 text-white text-[10px] font-black px-3 py-1 rounded-full flex items-center gap-1.5 animate-pulse z-10 shadow-lg">
                    <span className="w-2 h-2 rounded-full bg-white"></span>
                    <span>LIVE HD 1080p</span>
                  </div>

                  <div className="absolute top-4 right-4 bg-slate-950/80 backdrop-blur-md text-emerald-400 text-[11px] font-mono px-3.5 py-1.5 rounded-xl border border-emerald-500/30 z-10 font-bold shadow-md">
                    {new Date().toLocaleTimeString('ar-EG')} • {selectedCam === 1 ? 'CAM-01: درج الكاشير' : selectedCam === 2 ? 'CAM-02: مدخل المتجر' : selectedCam === 3 ? 'CAM-03: منطقة المخزن' : 'CAM-04: الخزينة الرئيسية'}
                  </div>

                  {/* Simulated Visual Angle Content */}
                  <div className="text-center space-y-3 text-slate-400 p-6">
                    <Video size={64} className="mx-auto text-amber-400 animate-pulse opacity-40" />
                    <div>
                      <p className="font-black text-base text-white">
                        {selectedCam === 1 && '📹 البث الحي: كاميرا 01 - ماكينة ودرج النقدية الكاشير'}
                        {selectedCam === 2 && '📹 البث الحي: كاميرا 02 - مدخل المتجر وصالة البيع'}
                        {selectedCam === 3 && '📹 البث الحي: كاميرا 03 - المخزن الداخلي والأرفف'}
                        {selectedCam === 4 && '📹 البث الحي: كاميرا 04 - الخزينة والآمنة الكبرى'}
                      </p>
                      <p className="text-xs text-slate-500 mt-1 font-mono">Status: Connected • FPS: 30 • Bitrate: 4.2 Mbps</p>
                    </div>
                  </div>

                  {/* Motion Detection Grid Graphic */}
                  <div className="absolute bottom-4 left-4 text-[10px] bg-slate-950/80 backdrop-blur-md text-amber-300 px-3 py-1.5 rounded-xl border border-amber-500/30 flex items-center gap-1.5 font-mono font-bold animate-pulse">
                    <Zap size={14} className="text-amber-400" />
                    <span>مستشعر الحركة: نشط (Motion Sensor Active OK)</span>
                  </div>
                </div>

                {/* Camera Selector Buttons */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-4 text-xs font-bold">
                  {[
                    { id: 1, label: 'كاميرا 01 (الدرج)' },
                    { id: 2, label: 'كاميرا 02 (المدخل)' },
                    { id: 3, label: 'كاميرا 03 (المخزن)' },
                    { id: 4, label: 'كاميرا 04 (الخزينة)' },
                  ].map(cam => (
                    <button
                      key={cam.id}
                      onClick={() => setSelectedCam(cam.id)}
                      className={`p-3 rounded-2xl border transition-all text-center cursor-pointer font-black ${
                        selectedCam === cam.id 
                          ? 'bg-gradient-to-r from-amber-500 to-yellow-600 text-slate-950 border-amber-400 shadow-lg shadow-amber-500/20' 
                          : 'bg-[#0a0f1d] text-slate-300 border-slate-800 hover:text-white hover:border-slate-700'
                      }`}
                    >
                      {cam.label}
                    </button>
                  ))}
                </div>

                <div className="mt-4 flex justify-between items-center text-xs">
                  <button
                    type="button"
                    onClick={captureSnapshot}
                    className="bg-emerald-600/15 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/30 px-4 py-2.5 rounded-2xl font-black flex items-center gap-2 transition-all cursor-pointer shadow-md"
                  >
                    <Camera size={16} />
                    <span>التقاط لقطة كاميرا (Take Snapshot)</span>
                  </button>

                  <span className="text-[11px] text-slate-400 font-bold">نظام المراقبة M-CCTV v4.2 مفعل</span>
                </div>
              </div>
            </div>

            {/* Security Audit Log & Snapshots */}
            <div className="space-y-4">
              <div className="bg-[#13192b] p-6 rounded-3xl border border-slate-800 space-y-4 shadow-xl">
                <h3 className="font-black text-sm text-white flex items-center gap-2">
                  <Eye size={18} className="text-amber-400" />
                  <span>سجل المراقبة والأحداث الأمنية</span>
                </h3>

                <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1 text-xs text-white">
                  {securityLog.map((log, idx) => (
                    <div key={`sec-log-${log.time}-${idx}`} className="bg-[#0a0f1d] p-3 rounded-2xl border border-slate-800 space-y-1 hover:border-slate-700 transition-colors">
                      <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono">
                        <span className="text-amber-400 font-bold">{log.cam}</span>
                        <span>{log.time}</span>
                      </div>
                      <p className="text-slate-200 font-bold">{log.event}</p>
                    </div>
                  ))}
                </div>
              </div>

              {snapshots.length > 0 && (
                <div className="bg-[#13192b] p-5 rounded-3xl border border-slate-800 space-y-2.5 text-xs shadow-xl">
                  <h4 className="font-black text-emerald-400 flex items-center gap-1.5">
                    <Camera size={14} />
                    <span>اللقطات الملتقطة:</span>
                  </h4>
                  <ul className="space-y-1.5 text-slate-300 font-mono text-[11px]">
                    {snapshots.map((s, i) => (
                      <li key={`snapshot-item-${i}-${s.substring(0, 10)}`} className="bg-[#0a0f1d] p-2.5 rounded-xl border border-slate-800 text-white font-bold">{s}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
