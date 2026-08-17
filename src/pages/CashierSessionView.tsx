/**
 * @file CashierSessionView.tsx
 * @module واجهات وصفحات النظام (UI Pages)
 * @description ملف جزء من نظام MARO ERP. الوظيفة: CashierSessionView.tsx.
 */
import React, { useState, useEffect } from 'react';
import { POSSession, SalesInvoice, Customer } from '../types/sprint8';
import { POSRepository } from '../repositories/posRepository';
import { SalesRepository } from '../repositories/salesRepository';
import { CustomerRepository } from '../repositories/customerRepository';
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
  Upload
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
          setCashierId(cashiers[0].uid);
          setCashierName(cashiers[0].displayName);
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
      // Call standard repository operation to preserve enterprise architecture
      const session = await POSRepository.openSession(
        'TERM-01', 
        cashierId, 
        cashierName, 
        amount
      );

      // Enhance session object with rich layout metadata
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
      
      // Log Security CCTV event
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

    // Calculate sales during session using the posSessionId link
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
        // Split or default to cash
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
      // Execute the closing transaction on POSRepository
      await POSRepository.closeSession(activeSession.id, actual, 'تم الإغلاق والمطابقة عبر شاشة الورديات');

      // Update local storage/MaroSyncEngine with richer metadata
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

      // Dispatch Z-Report to WhatsApp directly using standard WhatsApp Communication Engine
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
🎯 *المتوقع بالدرج:* ${(expectedCash || 0).toLocaleString()} ج.م
📥 *الفعلي بالدرج:* ${(actual || 0).toLocaleString()} ج.م
⚖️ *الفارق (عجز/زيادة):* ${variance === 0 ? 'مطابق تماماً 0 ج.م ✅' : variance > 0 ? `+${(variance || 0).toLocaleString()} ج.م (زيادة)` : `${(variance || 0).toLocaleString()} ج.م (عجز ⚠️)`}`;

      // Dispatch Z-Report directly to Manager's Phone Number silently without popping up window on cashier screen
      await WhatsAppNotificationService.dispatchManagerAlert('CASH_DRAWER_CLOSING', zMsg, whatsappSettings.managerPhoneNumber);

      setSecurityLog(prev => [
        { time: new Date().toLocaleTimeString('ar-EG'), cam: 'كاميرا 04 (الخزينة)', event: `إغلاق الوردية وإنشاء تقرير Z. النقدية الفعلية: ${actual} ج.م (الفارق: ${variance} ج.م)`, status: variance !== 0 ? 'warning' : 'info' },
        ...prev
      ]);

      alert('تم إغلاق الوردية وإنشاء تقرير Z بنجاح وإرسال التنبيه للمدير ✅');
    } catch (err: any) {
      alert(err.message || 'فشل إغلاق الوردية');
    }
  };

  // Live X-Report counters
  const activeSessionSales = activeSession ? sales.filter(s => s.posSessionId === activeSession.id) : [];
  let liveCash = 0;
  let liveCard = 0;
  let liveWallet = 0;
  let liveCredit = 0;

  activeSessionSales.forEach(s => {
    if (s.paymentMethod === 'CASH') liveCash += s.grandTotal;
    else if (s.paymentMethod === 'CARD') liveCard += s.grandTotal;
    else if (s.paymentMethod === 'CREDIT') liveCredit += s.grandTotal;
    else {
      liveCash += s.paidAmount || s.grandTotal;
      liveCredit += s.dueAmount || 0;
    }
  });

  const liveExpectedCash = activeSession ? activeSession.openingFloat + liveCash : 0;

  const captureSnapshot = () => {
    const camName = selectedCam === 1 ? 'درج الكاشير' : selectedCam === 2 ? 'المدخل الرئيسي' : selectedCam === 3 ? 'المخزن والأرفف' : 'الخزينة الرئيسية';
    const timestamp = new Date().toLocaleTimeString('ar-EG');
    const msg = `📷 تم التقاط لقطة كاميرا سريعة (${camName}) - ${timestamp}`;
    setSnapshots(prev => [msg, ...prev]);
    playSuccessSound();
  };

  // Filtered Sessions Data (Only closed for history)
  const filteredSessions = sessionsData.filter(s => {
    if (s.status !== 'CLOSED') return false;
    if (filterDate && s.openedAt.split('T')[0] !== filterDate) return false;
    if (filterCashier !== 'all' && s.cashierName !== filterCashier) return false;
    return true;
  });

  // Unique Cashiers for historical filtering
  const uniqueCashiers = Array.from(new Set(sessionsData.map(s => s.cashierName).filter(Boolean)));

  // Consolidated Daily Report Logic
  const getConsolidatedReport = (date: string) => {
    const daySessions = sessionsData.filter(s => s.openedAt.split('T')[0] === date && s.status === 'CLOSED');
    let totalOpening = 0;
    let totalActual = 0;
    let totalExpected = 0;
    let totalDiff = 0;
    let totalSales = 0;
    let totalCash = 0;
    let totalCard = 0;
    let totalCredit = 0;

    daySessions.forEach(s => {
      totalOpening += s.openingFloat;
      totalActual += s.closingCash || 0;
      totalExpected += s.expectedCash || 0;
      totalDiff += (s.variance || 0);
      totalSales += (s.totalSales || 0);
      totalCash += (s.totalSales || 0); // fallback or parsed
    });

    return {
      count: daySessions.length,
      totalOpening,
      totalActual,
      totalExpected,
      totalDiff,
      totalSales,
      totalCash,
      totalCard,
      totalCredit
    };
  };

  const dailyReport = getConsolidatedReport(consolidatedDate);

  // Dynamic lists for advanced transactional audit filtering
  const txCustomers = Array.from(new Set(sales.map(s => s.customerName || 'عميل نقدي').filter(Boolean)));
  const txCashiers = Array.from(new Set(sessionsData.map(s => s.cashierName).filter(Boolean)));

  const filteredSales = sales.filter(sale => {
    if (txFilterCashier !== 'all') {
      const sess = sessionsData.find(s => s.id === sale.posSessionId);
      if (!sess || sess.cashierName !== txFilterCashier) return false;
    }

    if (txFilterCustomer !== 'all') {
      const name = sale.customerName || 'عميل نقدي';
      if (name !== txFilterCustomer) return false;
    }

    if (txFilterPaymentMethod !== 'all') {
      if (txFilterPaymentMethod === 'cash' && sale.paymentMethod !== 'CASH') return false;
      if (txFilterPaymentMethod === 'card' && sale.paymentMethod !== 'CARD') return false;
      if (txFilterPaymentMethod === 'credit' && sale.paymentMethod !== 'CREDIT') return false;
    }

    if (txFilterCamera !== 'all') {
      if (txFilterCamera === 'cam1' && sale.paymentMethod !== 'CASH') return false;
      if (txFilterCamera === 'cam4' && sale.paymentMethod !== 'CARD') return false;
    }

    if (txFilterSessionId !== 'all' && sale.posSessionId !== txFilterSessionId) {
      return false;
    }

    return true;
  });

  // Excel Export of Shifts History
  const exportShiftsToExcel = () => {
    let csvContent = "data:text/csv;charset=utf-8,\uFEFF";
    csvContent += "رقم الوردية,الكاشير,تاريخ الفتح,تاريخ الإغلاق,رصيد أول المدة,إجمالي المبيعات,الرصيد الفعلي,الفارق\n";
    
    filteredSessions.forEach(s => {
      const row = [
        s.id,
        s.cashierName,
        new Date(s.openedAt).toLocaleString('ar-EG'),
        s.closedAt ? new Date(s.closedAt).toLocaleString('ar-EG') : '-',
        s.openingFloat,
        s.totalSales || 0,
        s.closingCash || 0,
        s.variance || 0
      ].join(",");
      csvContent += row + "\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `تقرير_ورديات_مارو_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    playSuccessSound();
  };

  // Excel Print of Invoices
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
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto pb-28">
      
      {/* Top Header & Tab Selector */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card p-5 sm:p-6 rounded-3xl border border-border shadow-sm">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-text-main flex items-center gap-2">
            <ShieldAlert className="text-gold" size={26} />
            <span>إدارة الورديات وتغطية كاميرات المراقبة (CCTV & Shifts)</span>
          </h1>
          <p className="text-xs text-text-dim mt-1">
            متابعة فتح وإغلاق الوردية، النقدية المتوقعة، وتقارير X & Z مع البث المباشر لكاميرات المراقبة للربط المالي
          </p>
        </div>

        <div className="flex items-center bg-card2 p-1.5 rounded-2xl border border-border gap-1 w-full sm:w-auto">
          <button
            onClick={() => setActiveTab('shifts')}
            className={`flex-1 sm:flex-none px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'shifts' ? 'bg-gold text-white shadow-md' : 'text-text-dim hover:text-text-main'
            }`}
          >
            <Clock size={16} />
            <span>تقارير الورديات Z & X</span>
          </button>
          <button
            onClick={() => setActiveTab('cameras')}
            className={`flex-1 sm:flex-none px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'cameras' ? 'bg-gold text-white shadow-md' : 'text-text-dim hover:text-text-main'
            }`}
          >
            <Video size={16} />
            <span>كاميرات المراقبة M-CCTV</span>
          </button>
        </div>
      </div>

      {activeTab === 'shifts' ? (
        <div className="space-y-6">
          
          {/* Active Session Status Bar */}
          {activeSession ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Active Session Info & X Report */}
              <div className="bg-card p-6 rounded-3xl border border-border space-y-4 shadow-sm">
                <div className="flex justify-between items-center border-b border-border pb-4">
                  <div>
                    <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-3 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1.5 animate-pulse">
                      <Unlock size={14} /> الوردية مفتوحة ونشطة الآن
                    </span>
                    <p className="text-xs text-text-dim mt-2 font-bold">الكاشير المسؤول: <span className="text-text-main">{activeSession.cashierName}</span></p>
                    <div className="flex flex-wrap items-center gap-2 mt-1.5">
                      <span className="text-[11px] font-bold text-gold bg-gold/10 border border-gold/30 px-2.5 py-0.5 rounded-lg flex items-center gap-1">
                        <span>🏦 الخزنة:</span> {activeSession.treasuryName || 'الخزنة الرئيسية (MAIN SAFE)'}
                      </span>
                      <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 rounded-lg flex items-center gap-1">
                        <span>🏬 المخزن:</span> {activeSession.warehouseName || 'المستودع الرئيسي'}
                      </span>
                    </div>
                    <p className="text-[11px] text-text-dim font-mono mt-1">وقت الفتح: {new Date(activeSession.openedAt).toLocaleString('ar-EG')}</p>
                  </div>
                  <div className="text-left">
                    <p className="text-[11px] text-text-dim">رصيد أول الوردية</p>
                    <p className="text-lg font-black text-gold font-mono">{(activeSession.openingFloat || 0).toLocaleString()} ج.م</p>
                  </div>
                </div>

                <h3 className="font-bold text-sm text-text-main flex items-center gap-2">
                  <Zap size={16} className="text-gold" />
                  <span>تقرير X اللحظي (Live X-Report Metrics)</span>
                </h3>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="bg-card2 p-3.5 rounded-2xl border border-border">
                    <p className="text-text-dim font-bold">مبيعات نقدية (Cash)</p>
                    <p className="text-lg font-black text-emerald-400 mt-1 font-mono">{(liveCash || 0).toLocaleString()} ج.م</p>
                  </div>
                  <div className="bg-card2 p-3.5 rounded-2xl border border-border">
                    <p className="text-text-dim font-bold">مبيعات بطاقة (Card)</p>
                    <p className="text-lg font-black text-blue-400 mt-1 font-mono">{(liveCard || 0).toLocaleString()} ج.م</p>
                  </div>
                  <div className="bg-card2 p-3.5 rounded-2xl border border-border">
                    <p className="text-text-dim font-bold">مبيعات محفظة (Wallet)</p>
                    <p className="text-lg font-black text-purple-400 mt-1 font-mono">{(liveWallet || 0).toLocaleString()} ج.م</p>
                  </div>
                  <div className="bg-card2 p-3.5 rounded-2xl border border-border">
                    <p className="text-text-dim font-bold">مبيعات آجل (Credit)</p>
                    <p className="text-lg font-black text-amber-400 mt-1 font-mono">{(liveCredit || 0).toLocaleString()} ج.م</p>
                  </div>
                </div>

                <div className="bg-gold/10 border border-gold/30 p-4 rounded-2xl flex justify-between items-center text-xs">
                  <span className="font-bold text-text-main">النقدية المتوقعة بالدرج (Expected Cash):</span>
                  <span className="text-xl font-black text-gold font-mono">{(liveExpectedCash || 0).toLocaleString()} ج.م</span>
                </div>
              </div>

              {/* Close Session Panel */}
              <div className="bg-card p-6 rounded-3xl border border-border space-y-4 shadow-sm">
                <h3 className="font-bold text-base text-text-main flex items-center gap-2">
                  <Lock size={18} className="text-danger" />
                  <span>إغلاق الوردية وتوليد تقرير Z النهائى</span>
                </h3>
                <p className="text-xs text-text-dim">قم بعد النقدية الفعلية بالدرج وأدخل المبلغ لمقارنته بالنقدية المتوقعة:</p>
                
                <div className="space-y-4 pt-2">
                  <div>
                    <label className="text-xs text-text-dim font-bold block mb-1">النقدية الفعلية بالدرج (Actual Cash) *</label>
                    <input
                      type="number"
                      placeholder="أدخل المبلغ النقدي بالجنيه..."
                      className="w-full bg-card2 border border-border p-3.5 rounded-2xl text-lg font-bold font-mono focus:outline-none focus:border-gold text-white"
                      value={actualCashInput}
                      onChange={e => setActualCashInput(e.target.value)}
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2">
                    <button
                      type="button"
                      onClick={handleCloseSession}
                      className="flex-1 bg-danger text-white py-3.5 rounded-2xl font-bold hover:bg-danger/90 transition-all shadow-lg active:scale-95 text-xs flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Lock size={16} />
                      <span>إغلاق الوردية وحفظ Z</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handlePrintPastSession(activeSession)}
                      className="bg-card2 border border-border text-text-main px-4 py-3.5 rounded-2xl font-bold hover:bg-card transition-all text-xs flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Printer size={16} />
                      <span>طباعة التقرير</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Open Session Form */
            <div className="bg-card p-8 rounded-3xl border border-border max-w-md mx-auto space-y-6 shadow-sm text-center">
              <div className="w-16 h-16 bg-gold/10 text-gold rounded-full flex items-center justify-center mx-auto text-3xl">
                🔓
              </div>
              <div>
                <h2 className="text-lg font-black text-text-main">لا توجد وردية مفتوحة حالياً</h2>
                <p className="text-xs text-text-dim mt-1">قم بفتح وردية جديدة لتحديد اسم الكاشير ورصيد بداية الخزينة</p>
              </div>

              <form onSubmit={handleOpenSession} className="space-y-4 text-right">
                <div>
                  <label className="text-xs text-text-dim font-bold block mb-1">اختر الكاشير / الموظف المسؤول: *</label>
                  {users.length > 0 ? (
                    <select
                      className="w-full bg-card2 border border-border p-3 rounded-2xl text-xs font-bold text-white focus:outline-none focus:border-gold"
                      value={cashierId}
                      onChange={e => handleCashierSelect(e.target.value)}
                    >
                      {users.map((u, uIdx) => (
                        <option key={u.uid || u.id || `usr-opt-${uIdx}`} value={u.uid || u.id}>
                          {u.displayName} (@{u.email ? u.email.split('@')[0] : 'user'})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      className="w-full bg-card2 border border-border p-3 rounded-2xl text-xs font-bold text-white focus:outline-none"
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
                    <div className="bg-card2 p-4 rounded-2xl border border-gold/30 space-y-3 text-xs">
                      <div className="flex items-center justify-between border-b border-border/50 pb-2">
                        <span className="text-gold font-bold flex items-center gap-1.5">
                          <Vault size={16} />
                          <span>الخزنة المربوطة بالحساب:</span>
                        </span>
                        <span className="font-bold text-gold bg-gold/10 border border-gold/30 px-3 py-1 rounded-xl">
                          {tName}
                        </span>
                      </div>

                      <div className="flex items-center justify-between border-b border-border/50 pb-2">
                        <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                          <Store size={16} />
                          <span>المخزن المربوط بالحساب:</span>
                        </span>
                        <span className="font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 rounded-xl">
                          {wName}
                        </span>
                      </div>

                      <div className="flex items-center gap-1 text-[11px] text-text-dim justify-center pt-0.5">
                        <ShieldAlert size={12} className="text-gold" />
                        <span>محددان مسبقاً بحساب الموظف في "إدارة الموظفين"</span>
                      </div>
                    </div>
                  );
                })()}

                <div>
                  <label className="text-xs text-text-dim font-bold block mb-1">رصيد الافتتاح النقدي (بداية الوردية): *</label>
                  <input
                    type="number"
                    placeholder="مثال: 500"
                    className="w-full bg-card2 border border-border p-3 rounded-2xl text-xs font-bold font-mono text-white"
                    value={openingCashInput}
                    onChange={e => setOpeningCashInput(e.target.value)}
                    required
                  />
                </div>
                <button type="submit" className="w-full bg-gold hover:bg-gold/90 text-white py-3.5 rounded-2xl font-bold transition-all shadow-md active:scale-95 text-xs flex items-center justify-center gap-2 cursor-pointer">
                  <span>🔓 فتح الوردية وتخصيص الخزنة والمخزن</span>
                </button>
              </form>
            </div>
          )}

          {/* Past Z-Reports History */}
          <div className="bg-card p-6 rounded-3xl border border-border space-y-4 shadow-sm">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h3 className="font-bold text-base text-text-main flex items-center gap-2">
                  <FileText size={18} className="text-gold" />
                  <span>أرشيف تقارير تقفيل الورديات السابقة (Z-Reports History)</span>
                </h3>
                <p className="text-xs text-text-dim mt-0.5">مراجعة سجلات تقفيل الورديات النقدية والمبيعات والعجز والزيادة</p>
              </div>

              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={exportShiftsToExcel}
                  className="bg-emerald-600/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-600 hover:text-white px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
                  title="تصدير جدول الورديات إلى إكسيل"
                >
                  <Download size={13} />
                  <span>تصدير Excel</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowColModal(true)}
                  className="bg-card2 border border-border hover:border-gold px-3 py-1.5 rounded-xl text-xs font-bold text-text-main transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
                  title="تخصيص أعمدة جدول الورديات"
                >
                  <Sliders size={13} className="text-gold" />
                  <span>تخصيص الأعمدة</span>
                </button>

                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-text-dim">التاريخ:</span>
                  <input 
                    type="date" 
                    value={filterDate} 
                    onChange={e => setFilterDate(e.target.value)}
                    className="bg-card2 border border-border rounded-xl px-2 py-1 text-[10px] outline-none focus:border-gold text-white"
                  />
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-text-dim">الموظف:</span>
                  <select 
                    value={filterCashier} 
                    onChange={e => setFilterCashier(e.target.value)}
                    className="bg-card2 border border-border rounded-xl px-2 py-1 text-[10px] outline-none focus:border-gold text-white"
                  >
                    <option value="all">الكل</option>
                    {uniqueCashiers.map((name, nameIdx) => (
                      <option key={`csh-filter-${name}-${nameIdx}`} value={name}>{name}</option>
                    ))}
                  </select>
                </div>
                <button 
                  onClick={() => setShowDailyConsolidated(!showDailyConsolidated)}
                  className="bg-gold/20 text-gold border border-gold/40 px-3 py-1 rounded-xl text-[10px] font-bold hover:bg-gold hover:text-white transition-all cursor-pointer"
                >
                  {showDailyConsolidated ? 'إخفاء التقرير المجمع' : 'عرض التقرير اليومي المجمع'}
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
              <div className="bg-card2 p-4 rounded-2xl border border-gold/30 space-y-4 animate-in slide-in-from-top-2 duration-300">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <h4 className="text-xs font-bold text-gold flex items-center gap-2">
                    <Activity size={14} />
                    <span>التقرير المجمع ليوم: {consolidatedDate}</span>
                  </h4>
                  <div className="flex items-center gap-2">
                    <input 
                      type="date" 
                      value={consolidatedDate} 
                      onChange={e => setConsolidatedDate(e.target.value)}
                      className="bg-card border border-border rounded-xl px-2 py-1 text-[10px] text-white"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="p-3 bg-card rounded-xl border border-border">
                    <p className="text-[10px] text-text-dim font-bold">عدد الورديات</p>
                    <p className="text-lg font-black text-text-main">{dailyReport.count}</p>
                  </div>
                  <div className="p-3 bg-card rounded-xl border border-border">
                    <p className="text-[10px] text-text-dim font-bold">إجمالي المبيعات</p>
                    <p className="text-lg font-black text-gold font-mono">{(dailyReport.totalSales || 0).toLocaleString()} ج.م</p>
                  </div>
                  <div className="p-3 bg-card rounded-xl border border-border">
                    <p className="text-[10px] text-text-dim font-bold">عجز/زيادة الكلي</p>
                    <p className={`text-lg font-black font-mono ${(dailyReport.totalDiff || 0) < 0 ? 'text-danger' : 'text-emerald-400'}`}>
                      {(dailyReport.totalDiff || 0).toLocaleString()} ج.م
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="overflow-x-auto rounded-2xl border border-border">
              <table className="w-full text-right text-xs">
                <thead className="bg-card2 text-text-dim font-bold border-b border-border">
                  <tr>
                    {orderedKeys.map((colKey, headIdx) => {
                      if (!visibleKeys.includes(colKey)) return null;
                      const colDef = SHIFTS_COLUMNS.find(c => c.key === colKey);
                      return (
                        <th key={`shift-th-${colKey}-${headIdx}`} className={`p-3 ${colKey !== 'id' && colKey !== 'cashierName' && colKey !== 'openedAt' && colKey !== 'closedAt' ? 'text-center' : ''}`}>
                          {colDef?.label}
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border font-mono text-white">
                  {filteredSessions.length > 0 ? filteredSessions.map((s, sIdx) => {
                    const diff = s.variance || 0;
                    const rowKey = s.id || `shift-row-${sIdx}`;
                    return (
                      <tr key={rowKey} className="hover:bg-card2/50 transition-colors">
                        {orderedKeys.map((colKey, cellIdx) => {
                          if (!visibleKeys.includes(colKey)) return null;
                          const cellKey = `cell-${rowKey}-${colKey}-${cellIdx}`;
                          switch (colKey) {
                            case 'id':
                              return (
                                <td key={cellKey} className="p-3 font-mono text-[11px] text-gold font-bold">
                                  #{s.id ? s.id.slice(0, 8) : `SESS-${sIdx}`}
                                </td>
                              );
                            case 'cashierName':
                              return (
                                <td key={cellKey} className="p-3 font-bold font-sans text-text-main">
                                  {s.cashierName}
                                </td>
                              );
                            case 'openedAt':
                              return (
                                <td key={cellKey} className="p-3 text-[11px] text-text-dim font-sans">
                                  {new Date(s.openedAt).toLocaleString('ar-EG')}
                                </td>
                              );
                            case 'closedAt':
                              return (
                                <td key={cellKey} className="p-3 text-[11px] text-text-dim font-sans">
                                  {s.closedAt ? new Date(s.closedAt).toLocaleString('ar-EG') : '-'}
                                </td>
                              );
                            case 'openingBalance':
                              return (
                                <td key={cellKey} className="p-3 text-center text-text-main">
                                  {(s.openingFloat || 0).toLocaleString()} ج.م
                                </td>
                              );
                            case 'totalSales':
                              return (
                                <td key={cellKey} className="p-3 text-center font-bold text-gold">
                                  {(s.totalSales || 0).toLocaleString()} ج.م
                                </td>
                              );
                            case 'totalCash':
                              return (
                                <td key={cellKey} className="p-3 text-center text-emerald-400 font-bold">
                                  {(s.totalSales || 0).toLocaleString()} ج.م
                                </td>
                              );
                            case 'totalCard':
                              return (
                                <td key={cellKey} className="p-3 text-center text-blue-400 font-bold">
                                  0 ج.م
                                </td>
                              );
                            case 'totalExpenses':
                              return (
                                <td key={cellKey} className="p-3 text-center text-rose-400 font-bold">
                                  0 ج.م
                                </td>
                              );
                            case 'closingBalance':
                              return (
                                <td key={cellKey} className="p-3 text-center font-bold text-text-main">
                                  {(s.closingCash ?? s.expectedCash ?? 0).toLocaleString()} ج.م
                                </td>
                              );
                            case 'difference':
                              return (
                                <td key={cellKey} className={`p-3 text-center font-bold font-sans ${diff < 0 ? 'text-danger' : diff > 0 ? 'text-emerald-400' : 'text-text-dim'}`}>
                                  {diff === 0 ? 'مطابق 0 ج' : diff > 0 ? `+${(diff || 0).toLocaleString()} ج (زيادة)` : `${(diff || 0).toLocaleString()} ج (عجز)`}
                                </td>
                              );
                            case 'status':
                              return (
                                <td key={cellKey} className="p-3 text-center font-sans">
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                    s.status === 'CLOSED'
                                      ? 'bg-card2 text-text-dim border border-border'
                                      : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                  }`}>
                                    {s.status === 'CLOSED' ? 'مغلقة' : 'مفتوحة'}
                                  </span>
                                </td>
                              );
                            case 'actions':
                              return (
                                <td key={cellKey} className="p-3 text-center font-sans">
                                  <div className="flex items-center justify-center gap-1.5">
                                    <button
                                      type="button"
                                      onClick={() => handlePrintPastSession(s)}
                                      className="bg-card2 hover:bg-card text-text-main border border-border px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all inline-flex items-center gap-1 cursor-pointer"
                                    >
                                      <Printer size={12} />
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
                                      className="bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-white px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all inline-flex items-center gap-1 border border-emerald-500/30 cursor-pointer"
                                    >
                                      <MessageSquare size={12} />
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
                      <td colSpan={visibleKeys.length} className="p-8 text-center text-text-dim font-sans italic">
                        لا توجد ورديات مطابقة لخيارات البحث
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Advanced Transaction Audit Section */}
          <div className="bg-card p-6 rounded-3xl border border-border space-y-6 shadow-sm">
            <div>
              <h3 className="font-bold text-base text-text-main flex items-center gap-2">
                <span className="text-xl">🔍</span>
                <span>المراقبة والفلترة المتقدمة لمعاملات وفواتير الوردية (Shift Sales Audit)</span>
              </h3>
              <p className="text-xs text-text-dim mt-1">
                استعلام لحظي وتفصيلي للمبيعات حسب طريقة البيع (كاش، آجل، جزئي، فيزا)، العميل، والربط مع كاميرات المراقبة لتتبع النقدية والأمان بالدرج.
              </p>
            </div>

            {/* Filters Dashboard Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <div>
                <label className="text-xs text-text-dim block mb-1.5 font-bold">الوردية / الجلسة:</label>
                <select
                  value={txFilterSessionId}
                  onChange={e => setTxFilterSessionId(e.target.value)}
                  className="w-full bg-card2 border border-border p-3 rounded-2xl text-xs font-bold text-white focus:outline-none focus:border-gold"
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
                <label className="text-xs text-text-dim block mb-1.5 font-bold">الكاشير / الموظف:</label>
                <select
                  value={txFilterCashier}
                  onChange={e => setTxFilterCashier(e.target.value)}
                  className="w-full bg-card2 border border-border p-3 rounded-2xl text-xs font-bold text-white focus:outline-none focus:border-gold"
                >
                  <option value="all">كل الموظفين</option>
                  {txCashiers.map((name, cshIdx) => (
                    <option key={`tx-cashier-${name}-${cshIdx}`} value={name}>{name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-text-dim block mb-1.5 font-bold">العميل:</label>
                <select
                  value={txFilterCustomer}
                  onChange={e => setTxFilterCustomer(e.target.value)}
                  className="w-full bg-card2 border border-border p-3 rounded-2xl text-xs font-bold text-white focus:outline-none"
                >
                  <option value="all">كل العملاء</option>
                  {txCustomers.map((custName, custIdx) => (
                    <option key={`tx-customer-${custName}-${custIdx}`} value={custName}>{custName}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-text-dim block mb-1.5 font-bold">نوعية البيع / طريقة الدفع:</label>
                <select
                  value={txFilterPaymentMethod}
                  onChange={e => setTxFilterPaymentMethod(e.target.value)}
                  className="w-full bg-card2 border border-border p-3 rounded-2xl text-xs font-bold text-white focus:outline-none"
                >
                  <option value="all">كل طرق البيع</option>
                  <option value="cash">كاش (نقدي كامل)</option>
                  <option value="card">فيزا / بطاقة (Visa)</option>
                  <option value="credit">آجل (Credit)</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-text-dim block mb-1.5 font-bold">ربط وتغطية الكاميرات:</label>
                <select
                  value={txFilterCamera}
                  onChange={e => setTxFilterCamera(e.target.value)}
                  className="w-full bg-card2 border border-border p-3 rounded-2xl text-xs font-bold text-white focus:outline-none"
                >
                  <option value="all">كل كاميرات المراقبة</option>
                  <option value="cam1">كاميرا 01 (درج النقدية بالماكينة)</option>
                  <option value="cam4">كاميرا 04 (خزينة وبوابة الدفع)</option>
                  <option value="cam2">كاميرا 02 (مدخل صالة العرض)</option>
                </select>
              </div>
            </div>

            {/* Results Table */}
            <div className="overflow-x-auto rounded-2xl border border-border">
              <table className="w-full text-right text-xs">
                <thead className="bg-card2 text-text-dim font-bold border-b border-border">
                  <tr>
                    <th className="p-3">رقم الفاتورة</th>
                    <th className="p-3">العميل</th>
                    <th className="p-3">التاريخ والوقت</th>
                    <th className="p-3 text-center">طريقة البيع</th>
                    <th className="p-3 text-center">الصافي النهائي</th>
                    <th className="p-3 text-center">المدفوع بالكامل</th>
                    <th className="p-3 text-center">المتبقي الآجل</th>
                    <th className="p-3 text-center">الكاميرا المرتبطة</th>
                    <th className="p-3 text-center">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border font-mono text-white">
                  {filteredSales.length > 0 ? (
                    filteredSales.map((sale, saleIdx) => {
                      const isPartial = (sale.paidAmount || 0) > 0 && (sale.dueAmount || 0) > 0;
                      let payBadge = <span className="bg-emerald-500/10 text-emerald-400 px-2.5 py-1 rounded-lg text-[10px] font-black border border-emerald-500/30">كاش نقدي</span>;
                      let cameraLabel = "كاميرا 01 (الدرج)";
                      let camId = 1;

                      if (isPartial) {
                        payBadge = <span className="bg-amber-500/10 text-amber-400 px-2.5 py-1 rounded-lg text-[10px] font-black border border-amber-500/30">دفع جزئي</span>;
                        cameraLabel = "كاميرا 04 (الخزينة)";
                        camId = 4;
                      } else if (sale.paymentMethod === 'CREDIT') {
                        payBadge = <span className="bg-red-500/10 text-red-400 px-2.5 py-1 rounded-lg text-[10px] font-black border border-red-500/30">بيع آجل</span>;
                        cameraLabel = "كاميرا 02 (المدخل)";
                        camId = 2;
                      } else if (sale.paymentMethod === 'CARD') {
                        payBadge = <span className="bg-blue-500/10 text-blue-400 px-2.5 py-1 rounded-lg text-[10px] font-black border border-blue-500/30">فيزا / بطاقة</span>;
                        cameraLabel = "كاميرا 04 (الخزينة)";
                        camId = 4;
                      }

                      const handlePrintInvoice = (s: SalesInvoice) => {
                        printSalesInvoice(s);
                      };

                      const saleKey = sale.id || sale.invoiceNumber || `sale-item-${saleIdx}`;

                      return (
                        <tr key={saleKey} className="hover:bg-card2/50 transition-colors">
                          <td className="p-3 font-bold text-text-main">#{sale.invoiceNumber || (sale.id ? sale.id.substring(0, 8) : `INV-${saleIdx}`)}</td>
                          <td className="p-3 font-bold font-sans text-text-main">{sale.customerName || 'عميل نقدي'}</td>
                          <td className="p-3 text-text-dim text-[11px]">{new Date(sale.createdAt).toLocaleString('ar-EG')}</td>
                          <td className="p-3 text-center font-sans">{payBadge}</td>
                          <td className="p-3 text-center text-text-main font-bold">{(sale.grandTotal || 0).toLocaleString()} ج.م</td>
                          <td className="p-3 text-center text-emerald-400 font-bold">{(sale.paidAmount || sale.grandTotal || 0).toLocaleString()} ج.م</td>
                          <td className="p-3 text-center text-red-400 font-bold">{(sale.dueAmount || 0).toLocaleString()} ج.م</td>
                          <td className="p-3 text-center font-sans">
                            <span className="text-[10px] bg-neutral-800 text-neutral-300 border border-neutral-700 px-2 py-0.5 rounded-md inline-flex items-center gap-1">
                              <span>🎥</span> {cameraLabel}
                            </span>
                          </td>
                          <td className="p-3 text-center font-sans flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handlePrintInvoice(sale)}
                              className="bg-card2 hover:bg-card text-text-main border border-border px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all inline-flex items-center gap-1 cursor-pointer"
                            >
                              <Printer size={12} />
                              <span>طباعة</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedCam(camId);
                                setActiveTab('cameras');
                                playSuccessSound();
                              }}
                              className="bg-gold/10 hover:bg-gold text-gold hover:text-white border border-gold/20 px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all inline-flex items-center gap-1 cursor-pointer"
                              title="تبديل الكاميرا لمراجعة تسجيل عملية الدفع هذه أمنياً"
                            >
                              <Video size={12} />
                              <span>بث أمني للكاميرا</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={9} className="p-8 text-center text-text-dim font-sans italic">
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
        /* CCTV Cameras View */
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Live Camera Grid Feed */}
            <div className="lg:col-span-2 space-y-4">
              <div className="bg-black/90 rounded-3xl border border-border p-4 relative overflow-hidden shadow-2xl">
                {/* Simulated Live Camera Stream */}
                <div className="aspect-video bg-neutral-950 rounded-2xl relative flex items-center justify-center overflow-hidden border border-neutral-800">
                  
                  {/* Camera overlay HUD */}
                  <div className="absolute top-3 left-3 bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 animate-pulse z-10">
                    <span className="w-2 h-2 rounded-full bg-white"></span>
                    <span>LIVE HD 1080p</span>
                  </div>

                  <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md text-emerald-400 text-[11px] font-mono px-3 py-1 rounded-xl border border-emerald-500/30 z-10">
                    {new Date().toLocaleTimeString('ar-EG')} • {selectedCam === 1 ? 'CAM-01: درج الكاشير' : selectedCam === 2 ? 'CAM-02: مدخل المتجر' : selectedCam === 3 ? 'CAM-03: منطقة المخزن' : 'CAM-04: الخزينة الرئيسية'}
                  </div>

                  {/* Simulated Visual Angle Content */}
                  <div className="text-center space-y-3 text-neutral-400">
                    <Video size={56} className="mx-auto opacity-30 animate-pulse text-gold" />
                    <div>
                      <p className="font-bold text-sm text-neutral-200">
                        {selectedCam === 1 && '📹 البث الحي: كاميرا 01 - ماكينة ودرج النقدية الكاشير'}
                        {selectedCam === 2 && '📹 البث الحي: كاميرا 02 - مدخل المتجر وصالة البيع'}
                        {selectedCam === 3 && '📹 البث الحي: كاميرا 03 - المخزن الداخلي والأرفف'}
                        {selectedCam === 4 && '📹 البث الحي: كاميرا 04 - الخزينة والآمنة الكبرى'}
                      </p>
                      <p className="text-xs text-neutral-500 mt-1 font-mono">Status: Connected • FPS: 30 • Bitrate: 4.2 Mbps</p>
                    </div>
                  </div>

                  {/* Motion Detection Grid Graphic */}
                  <div className="absolute bottom-3 left-3 text-[10px] bg-black/70 text-gold px-2.5 py-1 rounded-lg border border-gold/20 flex items-center gap-1.5 font-mono animate-pulse">
                    <Zap size={12} />
                    <span>مستشعر الحركة: نشط (Motion Detected OK)</span>
                  </div>
                </div>

                {/* Camera Selector Buttons */}
                <div className="grid grid-cols-4 gap-2 mt-4 text-xs font-bold">
                  {[
                    { id: 1, label: 'كاميرا 01 (الدرج)' },
                    { id: 2, label: 'كاميرا 02 (المدخل)' },
                    { id: 3, label: 'كاميرا 03 (المخزن)' },
                    { id: 4, label: 'كاميرا 04 (الخزينة)' },
                  ].map(cam => (
                    <button
                      key={cam.id}
                      onClick={() => setSelectedCam(cam.id)}
                      className={`p-2.5 rounded-xl border transition-all text-center cursor-pointer ${
                        selectedCam === cam.id ? 'bg-gold text-white border-gold shadow' : 'bg-card2 text-text-dim border-border hover:text-white'
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
                    className="bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-white border border-emerald-500/30 px-4 py-2 rounded-xl font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Camera size={14} />
                    <span>التقاط لقطة كاميرا (Take Snapshot)</span>
                  </button>

                  <span className="text-[11px] text-text-dim">نظام المراقبة M-CCTV v4.2 مفعل</span>
                </div>
              </div>
            </div>

            {/* Security Audit Log & Snapshots */}
            <div className="space-y-4">
              <div className="bg-card p-5 rounded-3xl border border-border space-y-3 shadow-sm">
                <h3 className="font-bold text-sm text-text-main flex items-center gap-2">
                  <Eye size={16} className="text-gold" />
                  <span>سجل المراقبة والأحداث الأمنية</span>
                </h3>

                <div className="space-y-2 max-h-72 overflow-y-auto pr-1 text-xs text-white">
                  {securityLog.map((log, idx) => (
                    <div key={`sec-log-${log.time}-${idx}`} className="bg-card2 p-2.5 rounded-2xl border border-border space-y-1">
                      <div className="flex justify-between items-center text-[10px] text-text-dim font-mono">
                        <span className="text-gold font-bold">{log.cam}</span>
                        <span>{log.time}</span>
                      </div>
                      <p className="text-text-main font-bold">{log.event}</p>
                    </div>
                  ))}
                </div>
              </div>

              {snapshots.length > 0 && (
                <div className="bg-card p-4 rounded-3xl border border-border space-y-2 text-xs">
                  <h4 className="font-bold text-emerald-400">اللقطات الملتقطة:</h4>
                  <ul className="space-y-1 text-text-dim font-mono text-[11px]">
                    {snapshots.map((s, i) => (
                      <li key={`snapshot-item-${i}-${s.substring(0, 10)}`} className="bg-card2 p-2 rounded-xl border border-border text-white">{s}</li>
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
