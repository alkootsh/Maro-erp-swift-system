/**
 * @file Reps.tsx
 * @module واجهات وصفحات النظام (UI Pages)
 * @description ملف جزء من نظام MARO ERP. الوظيفة: Reps.tsx.
 */
import React, { useState, useEffect } from 'react';
import { 
  Users, Plus, Search, MapPin, Phone, Edit2, Trash2, Calendar, Save, X,
  Map, Layers, Compass, Lock, ShieldCheck, TrendingUp, Smartphone, 
  Coins, FileText, Check, Truck, ArrowRight, Landmark, ArrowUpRight, 
  CheckCircle, ClipboardList, ShieldAlert, AlertTriangle, Play, HelpCircle
} from 'lucide-react';
import { MaroSyncEngine } from '../lib/maroSyncEngine';
import { cn, formatCurrency, formatDate } from '../lib/utils';
import { CustomerRepository } from '../repositories/customerRepository';
import { ProductRepository } from '../repositories/productRepository';
import { Customer, SalesInvoice } from '../types/sprint8';
import { toast } from 'react-hot-toast';

export interface Rep {
  id: string;
  name: string;
  phone: string;
  route: string;
  status: 'active' | 'inactive';
  notes: string;
}

// Route sequence interface
export interface RouteStop {
  id: string;
  repId: string;
  customerId: string;
  customerName: string;
  sequence: number;
  estDistance: string; // e.g. "2.4 كم"
  status: 'pending' | 'delivered' | 'skipped';
}

// Field collection custody interface
export interface CustodyRecord {
  id: string;
  repId: string;
  invoiceId: string;
  invoiceNumber: string;
  customerId: string;
  customerName: string;
  collectedAmount: number;
  paymentMethod: 'CASH' | 'CHEQUE' | 'BANK_TRANSFER';
  status: 'OPEN' | 'PENDING_VERIFICATION' | 'SETTLED' | 'SHORTAGE' | 'SURPLUS' | 'OVERDUE';
  date: string;
  chequeDetails?: string;
}

export const Reps: React.FC = () => {
  // Navigation Tabs
  const [activeView, setActiveView] = useState<'admin' | 'portal'>('portal');

  // Core collections
  const [reps, setReps] = useState<Rep[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [invoices, setInvoices] = useState<SalesInvoice[]>([]);
  const [routeStops, setRouteStops] = useState<RouteStop[]>([]);
  const [custodies, setCustodies] = useState<CustodyRecord[]>([]);

  // Selection & UI States
  const [activeRepId, setActiveRepId] = useState<string>('rep_1');
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRep, setEditingRep] = useState<Rep | null>(null);
  const [repSearchTerm, setRepSearchTerm] = useState('');

  // Payment popup states
  const [paymentInvoice, setPaymentInvoice] = useState<SalesInvoice | null>(null);
  const [collectedVal, setCollectedVal] = useState<number>(0);
  const [payMethod, setPayMethod] = useState<'CASH' | 'CHEQUE' | 'BANK_TRANSFER'>('CASH');
  const [chequeNo, setChequeNo] = useState('');

  // Audio synthesizing feedback for premium offline feedback
  const playSuccessChime = () => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContext) {
        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
        gain.gain.setValueAtTime(0.05, ctx.currentTime);
        osc.start();
        osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1); // E5
        osc.frequency.setValueAtTime(1046.50, ctx.currentTime + 0.2); // C6
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.4);
        osc.stop(ctx.currentTime + 0.4);
      }
    } catch {}
  };

  // Load resources on mount & listen to changes
  useEffect(() => {
    // 1. Subscribe to Reps
    const unsubReps = MaroSyncEngine.subscribe<Rep>('reps', (items) => {
      setReps(items);
    });
    const localReps = MaroSyncEngine.getLocalCollection<Rep>('reps');
    if (localReps.length === 0) {
      const defs: Rep[] = [
        { id: 'rep_1', name: 'أحمد محمود (المنطقة الشمالية)', phone: '+966 50 111 2233', route: 'مخطط الرياض الشمالي والوسطى', status: 'active', notes: 'مندوب مبيعات معتمد' },
        { id: 'rep_2', name: 'سعد العتيبي (المنطقة الغربية)', phone: '+966 55 444 5566', route: 'مخطط جدة والساحل الغربي', status: 'active', notes: 'مندوب توزيع رئيسي' }
      ];
      defs.forEach(d => MaroSyncEngine.saveDocument('reps', d, true));
    }

    // 2. Load Customers
    const unsubCusts = MaroSyncEngine.subscribe<Customer>('customers', (items) => {
      setCustomers(items);
    });

    // 3. Load Invoices
    const unsubInvs = MaroSyncEngine.subscribe<SalesInvoice>('invoices', (items) => {
      setInvoices(items);
    });

    // 4. Load Route Stops (Persisted locally in localStorage)
    const savedStops = localStorage.getItem('maro_rep_route_stops');
    if (savedStops) {
      setRouteStops(JSON.parse(savedStops));
    } else {
      // Default mock stops aligned to preloaded customers
      const defaultStops: RouteStop[] = [
        { id: 'stop_1', repId: 'rep_1', customerId: 'cust-1', customerName: 'شركة النور للتجارة', sequence: 1, estDistance: '1.8 كم', status: 'pending' },
        { id: 'stop_2', repId: 'rep_1', customerId: 'cust-2', customerName: 'سوبرماركت المدينة المنورة', sequence: 2, estDistance: '3.5 كم', status: 'pending' },
        { id: 'stop_3', repId: 'rep_2', customerId: 'cust-3', customerName: 'مؤسسة الفهد للمقاولات', sequence: 1, estDistance: '2.1 كم', status: 'pending' }
      ];
      setRouteStops(defaultStops);
      localStorage.setItem('maro_rep_route_stops', JSON.stringify(defaultStops));
    }

    // 5. Load Custody Records
    const savedCustodies = localStorage.getItem('maro_rep_custodies');
    if (savedCustodies) {
      setCustodies(JSON.parse(savedCustodies));
    } else {
      setCustodies([]);
    }

    return () => {
      unsubReps();
      unsubCusts();
      unsubInvs();
    };
  }, []);

  // Sync route stops to localStorage
  const saveRouteStopsToStorage = (updated: RouteStop[]) => {
    setRouteStops(updated);
    localStorage.setItem('maro_rep_route_stops', JSON.stringify(updated));
  };

  // Sync custodies to localStorage
  const saveCustodiesToStorage = (updated: CustodyRecord[]) => {
    setCustodies(updated);
    localStorage.setItem('maro_rep_custodies', JSON.stringify(updated));
  };

  // Action: Add a customer to a representative's active route
  const handleAddCustomerToRoute = (customer: Customer) => {
    if (!activeRepId) {
      toast.error('يرجى اختيار المندوب أولاً');
      return;
    }

    // Check if already in active route
    const exists = routeStops.some(s => s.repId === activeRepId && s.customerId === customer.id);
    if (exists) {
      toast.error('هذا العميل مضاف بالفعل إلى مخطط سير المندوب');
      return;
    }

    const nextSeq = routeStops.filter(s => s.repId === activeRepId).length + 1;
    const distanceOptions = ['1.2 كم', '2.8 كم', '4.3 كم', '5.1 كم', '0.7 كم', '3.9 كم'];
    const randomDistance = distanceOptions[Math.floor(Math.random() * distanceOptions.length)];

    const newStop: RouteStop = {
      id: `stop_${Date.now()}`,
      repId: activeRepId,
      customerId: customer.id,
      customerName: customer.name,
      sequence: nextSeq,
      estDistance: randomDistance,
      status: 'pending'
    };

    const updated = [...routeStops, newStop];
    saveRouteStopsToStorage(updated);
    playSuccessChime();
    toast.success(`🚀 تم ربط العميل "${customer.name}" بمخطط السير اليومي للمندوب بنجاح!`);
    setCustomerSearchQuery('');
  };

  // Action: Remove customer stop from route plan
  const handleRemoveCustomerFromRoute = (stopId: string) => {
    const updated = routeStops.filter(s => s.id !== stopId);
    saveRouteStopsToStorage(updated);
    toast.success('تم إزالة العميل من مخطط السير');
  };

  // Action: Skip / Toggle Route stop status
  const handleToggleStopStatus = (stopId: string, nextStatus: 'pending' | 'delivered' | 'skipped') => {
    const updated = routeStops.map(s => s.id === stopId ? { ...s, status: nextStatus } : s);
    saveRouteStopsToStorage(updated);
    toast.success('تم تحديث حالة تسليم محطة السير');
  };

  // Action: Trigger Payment popup
  const openPaymentModal = (invoice: SalesInvoice) => {
    setPaymentInvoice(invoice);
    setCollectedVal(invoice.dueAmount || invoice.grandTotal);
    setPayMethod('CASH');
    setChequeNo('');
  };

  // Action: Post field collection payment (The High-Integrity Accounting Action)
  const handlePostFieldPayment = async () => {
    if (!paymentInvoice) return;

    if (collectedVal <= 0) {
      toast.error('مبلغ التحصيل يجب أن يكون أكبر من الصفر');
      return;
    }

    if (collectedVal > (paymentInvoice.dueAmount || paymentInvoice.grandTotal)) {
      toast.error('لا يمكن تحصيل مبلغ أكبر من المتبقي الآجل للفاتورة');
      return;
    }

    try {
      // 1. DECREASE CUSTOMER RECEIVABLE (تخفيض مديونية العميل)
      await CustomerRepository.addLedgerEntry({
        customerId: paymentInvoice.customerId || '',
        transactionType: 'PAYMENT',
        referenceNo: paymentInvoice.invoiceNumber,
        debit: 0,
        credit: collectedVal,
        date: new Date().toISOString(),
        notes: `تحصيل ميداني بواسطة المندوب: ${reps.find(r => r.id === activeRepId)?.name || 'مجهول'} | طريقة السداد: ${payMethod}`
      });

      // 2. INCREMENT REPRESENTATIVE CUSTODY (إثبات الأموال كعهدة في حوزة المندوب)
      const newCustodyRecord: CustodyRecord = {
        id: `cust_${Date.now()}`,
        repId: activeRepId,
        invoiceId: paymentInvoice.id,
        invoiceNumber: paymentInvoice.invoiceNumber,
        customerId: paymentInvoice.customerId || '',
        customerName: paymentInvoice.customerName || 'عميل مجهول',
        collectedAmount: collectedVal,
        paymentMethod: payMethod,
        status: 'OPEN', // Starts as OPEN under custody
        date: new Date().toISOString(),
        chequeDetails: payMethod === 'CHEQUE' ? `شيك رقم: ${chequeNo}` : undefined
      };

      const updatedCustodies = [newCustodyRecord, ...custodies];
      saveCustodiesToStorage(updatedCustodies);

      // 3. UPDATE INVOICE RECORD
      const currentPaid = paymentInvoice.paidAmount || 0;
      const newPaid = currentPaid + collectedVal;
      const newDue = Math.max(0, paymentInvoice.grandTotal - newPaid);
      let nextStatus = paymentInvoice.status;
      if (newDue === 0) {
        nextStatus = 'PAID';
      } else if (newPaid > 0) {
        nextStatus = 'PARTIALLY_PAID';
      }

      const updatedInvoice: SalesInvoice = {
        ...paymentInvoice,
        paidAmount: newPaid,
        dueAmount: newDue,
        status: nextStatus,
        notes: `${paymentInvoice.notes || ''} | تحصيل ميداني معلق في عهدة المندوب`
      };

      await MaroSyncEngine.saveDocument('invoices', updatedInvoice);

      // 4. AUDIT TRAIL LOGGING
      await ProductRepository.logAudit(
        'UPDATE',
        'invoices',
        paymentInvoice.id,
        paymentInvoice.invoiceNumber,
        {
          event: 'FIELD_CUSTODY_COLLECTED',
          repId: activeRepId,
          repName: reps.find(r => r.id === activeRepId)?.name,
          collectedAmount: collectedVal,
          paymentMethod: payMethod
        }
      );

      // Auto-mark the route stop as delivered
      const currentStop = routeStops.find(s => s.repId === activeRepId && s.customerId === paymentInvoice.customerId);
      if (currentStop) {
        handleToggleStopStatus(currentStop.id, 'delivered');
      }

      playSuccessChime();
      toast.success(`🎉 تم تسجيل السداد بنجاح! تم تخفيض رصيد العميل وتحويل مبلغ ${formatCurrency(collectedVal)} لعهدة المندوب بانتظار توريد الخزينة.`);
      setPaymentInvoice(null);
    } catch (err: any) {
      toast.error(`فشل تسجيل عملية السداد: ${err.message}`);
    }
  };

  // Action: Submit handover request to Treasury (تسليم العهد المفتوحة للخزينة)
  const handleSubmitHandoverToTreasury = async () => {
    const openRecords = custodies.filter(c => c.repId === activeRepId && c.status === 'OPEN');
    if (openRecords.length === 0) {
      toast.error('لا توجد عهد مالية مفتوحة حالياً لتسليمها');
      return;
    }

    try {
      const updatedCustodies = custodies.map(c => 
        (c.repId === activeRepId && c.status === 'OPEN') 
          ? { ...c, status: 'PENDING_VERIFICATION' as const } 
          : c
      );

      saveCustodiesToStorage(updatedCustodies);

      // Audit handover
      await ProductRepository.logAudit(
        'UPDATE',
        'representatives_custody',
        activeRepId,
        reps.find(r => r.id === activeRepId)?.name || 'مندوب',
        {
          event: 'CUSTODY_HANDOVER_SUBMITTED',
          recordsCount: openRecords.length,
          totalSubmitted: openRecords.reduce((acc, curr) => acc + curr.collectedAmount, 0)
        }
      );

      playSuccessChime();
      toast.success(`🏦 تم إرسال طلب تسليم العهدة (${formatCurrency(openRecords.reduce((acc, curr) => acc + curr.collectedAmount, 0))}) لأمين الخزينة للمراجعة والعد الفعلي!`, {
        duration: 6000
      });
    } catch (err: any) {
      toast.error(`حدث خطأ أثناء إرسال طلب التسليم: ${err.message}`);
    }
  };

  // Filter lists
  const filteredReps = reps.filter(r => 
    r.name.toLowerCase().includes(repSearchTerm.toLowerCase()) || 
    r.route.toLowerCase().includes(repSearchTerm.toLowerCase())
  );

  const selectedRep = reps.find(r => r.id === activeRepId);
  const repStops = routeStops.filter(s => s.repId === activeRepId).sort((a, b) => a.sequence - b.sequence);
  const repCustodies = custodies.filter(c => c.repId === activeRepId);

  // Stats calculation
  const totalCollected = repCustodies.reduce((sum, r) => sum + r.collectedAmount, 0);
  const settledAmount = repCustodies.filter(c => c.status === 'SETTLED').reduce((sum, r) => sum + r.collectedAmount, 0);
  const pendingHandover = repCustodies.filter(c => c.status === 'OPEN').reduce((sum, r) => sum + r.collectedAmount, 0);
  const pendingVerification = repCustodies.filter(c => c.status === 'PENDING_VERIFICATION').reduce((sum, r) => sum + r.collectedAmount, 0);

  // Invoices matching the representative's active customers
  const repActiveCustomerIds = repStops.map(s => s.customerId);
  const assignedInvoices = invoices.filter(inv => 
    repActiveCustomerIds.includes(inv.customerId || '') && inv.status !== 'PAID'
  );

  return (
    <div className="space-y-6">
      
      {/* Visual Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#1e293b] pb-6">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <Truck className="text-blue-500" size={24} />
            <span>بوابة المندوب الذكية والعهد الميدانية</span>
          </h2>
          <p className="text-slate-500 font-bold text-xs mt-1">تتبع خطوط السير والتحصيل الميداني اللحظي مع الفصل المالي والتحقق الخزني المتكامل</p>
        </div>

        {/* Tab Switcher Controller */}
        <div className="bg-[#151b2b] p-1.5 rounded-2xl border border-[#1e293b] flex gap-1.5">
          <button
            onClick={() => setActiveView('portal')}
            className={cn(
              "px-5 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2",
              activeView === 'portal' ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg" : "text-slate-400 hover:text-white"
            )}
          >
            <Smartphone size={15} className="text-amber-400 animate-pulse" />
            <span>بوابة المندوب ومخطط السير الميداني</span>
          </button>
          
          <button
            onClick={() => setActiveView('admin')}
            className={cn(
              "px-5 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2",
              activeView === 'admin' ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg" : "text-slate-400 hover:text-white"
            )}
          >
            <Users size={15} />
            <span>إدارة المناديب العامة وخطوط السير</span>
          </button>
        </div>
      </div>

      {/* PORTAL VIEW (بوابة المندوب التفاعلية ومخطط السير الفوري) */}
      {activeView === 'portal' && (
        <div className="space-y-6">
          
          {/* Top Panel: Simulated Login Session Selector */}
          <div className="p-5 bg-[#151b2b] rounded-3xl border border-[#1e293b] flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 bg-blue-600/10 text-blue-400 border border-blue-500/20 rounded-2xl flex items-center justify-center">
                <Lock size={20} className="text-amber-400 animate-pulse" />
              </div>
              <div>
                <h4 className="text-white text-xs font-black">🔐 جلسة المندوب النشطة (محاكاة تسجيل الدخول)</h4>
                <p className="text-slate-500 text-[10px] font-bold mt-0.5">اختر المندوب الجاري لمحاكاة شاشة هاتفه والمستندات المحملة عليه</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <select
                value={activeRepId}
                onChange={(e) => {
                  setActiveRepId(e.target.value);
                  playSuccessChime();
                }}
                className="bg-[#0b0f1a] border border-slate-800 rounded-xl px-4 py-2.5 text-white font-bold text-xs focus:outline-none focus:border-blue-500 font-sans"
              >
                {reps.map(r => (
                  <option key={r.id} value={r.id}>{r.name} - ({r.route})</option>
                ))}
              </select>
              <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping"></span>
            </div>
          </div>

          {/* Representative Performance Dashboard Counters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            
            <div className="p-5 bg-gradient-to-br from-[#121c2c] to-[#0c1422] border border-[#1e293b] rounded-3xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-600"></div>
              <span className="text-[10px] text-slate-500 font-bold block">إجمالي تحصيلات اليوم</span>
              <h3 className="text-xl font-black text-white mt-1 font-mono">{formatCurrency(totalCollected)}</h3>
              <p className="text-[9px] text-slate-400 font-bold mt-2">تشمل التحصيلات النقدية والشيكات</p>
            </div>

            <div className="p-5 bg-gradient-to-br from-[#121c2c] to-[#0c1422] border border-[#1e293b] rounded-3xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-600"></div>
              <span className="text-[10px] text-slate-500 font-bold block">تم توريدها وتسويتها بالخزينة</span>
              <h3 className="text-xl font-black text-emerald-400 mt-1 font-mono">{formatCurrency(settledAmount)}</h3>
              <p className="text-[9px] text-slate-400 font-bold mt-2">معتمدة ومطابقة من أمين الخزينة</p>
            </div>

            <div className="p-5 bg-gradient-to-br from-[#121c2c] to-[#0c1422] border border-[#1e293b] rounded-3xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-amber-600"></div>
              <span className="text-[10px] text-slate-500 font-bold block">عهدة جارية معلقة (في يد المندوب)</span>
              <h3 className="text-xl font-black text-amber-400 mt-1 font-mono">{formatCurrency(pendingHandover)}</h3>
              <p className="text-[9px] text-slate-400 font-bold mt-2">بانتظار تسليمها للخزينة لتسويتها</p>
            </div>

            <div className="p-5 bg-gradient-to-br from-[#121c2c] to-[#0c1422] border border-[#1e293b] rounded-3xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-500"></div>
              <span className="text-[10px] text-slate-500 font-bold block">بانتظار التحقق والمطابقة</span>
              <h3 className="text-xl font-black text-blue-400 mt-1 font-mono">{formatCurrency(pendingVerification)}</h3>
              <p className="text-[9px] text-slate-400 font-bold mt-2">تم تسليمها ومطابقتها جارية بالخزنة</p>
            </div>

          </div>

          {/* Interactive Routing & Actions Section */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* 1. مخطط السير اليومي للمندوب (8 Columns) */}
            <div className="lg:col-span-7 bg-[#151b2b] p-6 rounded-3xl border border-[#1e293b] flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between border-b border-[#1e293b] pb-4">
                  <div>
                    <h3 className="text-sm font-black text-white flex items-center gap-2">
                      <MapPin size={16} className="text-blue-500" />
                      <span>مخطط السير والجدولة الجغرافية النشطة للمندوب</span>
                    </h3>
                    <p className="text-slate-500 text-[10px] font-bold mt-1">تحديد sequence تسليم العملاء، التحصيلات، وتحديثات الخريطة الجغرافية</p>
                  </div>
                  <span className="text-[10px] bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded-full font-black">
                    {repStops.length} محطات
                  </span>
                </div>

                {/* Vertical interactive path timeline */}
                <div className="space-y-4 mt-5 relative pl-4 border-l border-slate-800/80">
                  {repStops.map((stop, idx) => {
                    // find matching customer details
                    const cust = customers.find(c => c.id === stop.customerId);
                    return (
                      <div key={stop.id} className="relative flex items-start gap-4 p-4 bg-[#0c101c] rounded-2xl border border-slate-800/80 hover:border-slate-700 transition-all">
                        {/* Step Circle */}
                        <div className="absolute -left-[27px] top-6 w-5.5 h-5.5 rounded-full bg-[#151b2b] border-2 border-blue-500 flex items-center justify-center text-[10px] font-black text-white font-mono">
                          {idx + 1}
                        </div>

                        {/* Route marker */}
                        <div className="w-10 h-10 bg-slate-800/40 border border-slate-700/60 rounded-xl flex items-center justify-center text-blue-400 font-bold font-mono">
                          {stop.estDistance}
                        </div>

                        {/* Customer stop data */}
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center justify-between">
                            <h4 className="text-white text-xs font-black">{stop.customerName}</h4>
                            <div className="flex gap-1.5">
                              <button
                                onClick={() => handleToggleStopStatus(stop.id, 'delivered')}
                                className={cn(
                                  "px-2 py-0.5 rounded text-[9px] font-black transition-all",
                                  stop.status === 'delivered' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-slate-800 text-slate-500 hover:text-slate-300'
                                )}
                              >
                                تم التسليم
                              </button>
                              <button
                                onClick={() => handleToggleStopStatus(stop.id, 'skipped')}
                                className={cn(
                                  "px-2 py-0.5 rounded text-[9px] font-black transition-all",
                                  stop.status === 'skipped' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-slate-800 text-slate-500 hover:text-slate-300'
                                )}
                              >
                                تخطي مؤقت
                              </button>
                              <button
                                onClick={() => handleRemoveCustomerFromRoute(stop.id)}
                                className="text-slate-500 hover:text-red-400 p-0.5"
                                title="إلغاء من خط السير"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </div>

                          <div className="flex items-center gap-4 text-[10px] text-slate-400 font-bold">
                            <span className="flex items-center gap-1">
                              <Phone size={10} className="text-slate-500" />
                              <span>{cust?.phone || 'بدون هاتف مسجل'}</span>
                            </span>
                            <span className="flex items-center gap-1">
                              <Coins size={10} className="text-amber-500" />
                              <span>المديونية الحالية: <span className="text-amber-400">{formatCurrency(cust?.currentBalance || 0)}</span></span>
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {repStops.length === 0 && (
                    <div className="py-12 text-center text-slate-500 space-y-2">
                      <Compass size={36} className="text-slate-700 mx-auto animate-spin" />
                      <p className="text-xs font-bold text-slate-400">لا يوجد عملاء مضافين لجدول السير اليوم بعد</p>
                      <p className="text-[10px] text-slate-500">استخدم حقل البحث أدناه لربط عميل معتمد بمسار المندوب</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Linking Customers to Route planner */}
              <div className="border-t border-[#1e293b] pt-4">
                <label className="block text-slate-400 font-bold text-xs mb-2">➕ ربط وإضافة عملاء مسجلين بمخطط السير اليومي للمندوب:</label>
                <div className="relative">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                  <input
                    type="text"
                    value={customerSearchQuery}
                    onChange={(e) => setCustomerSearchQuery(e.target.value)}
                    placeholder="ابحث بالاسم أو الهاتف لربطه بالمندوب..."
                    className="w-full bg-[#0c101c] border border-slate-800 rounded-xl pr-10 pl-4 py-2.5 text-white font-bold text-xs placeholder:text-slate-600"
                  />
                </div>

                {customerSearchQuery && (
                  <div className="mt-2 bg-[#0c101c] border border-slate-800 rounded-xl max-h-40 overflow-y-auto divide-y divide-slate-800/60 text-xs">
                    {customers
                      .filter(c => c.name.toLowerCase().includes(customerSearchQuery.toLowerCase()))
                      .map(cust => (
                        <div
                          key={cust.id}
                          onClick={() => handleAddCustomerToRoute(cust)}
                          className="p-3 hover:bg-blue-600/10 cursor-pointer flex items-center justify-between text-slate-300 hover:text-white"
                        >
                          <div>
                            <span className="font-bold">{cust.name}</span>
                            <span className="text-[10px] text-slate-500 mr-2">({cust.city || 'الرياض'})</span>
                          </div>
                          <span className="text-[10px] text-amber-500 font-bold">المديونية: {formatCurrency(cust.currentBalance)}</span>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>

            {/* 2. الفواتير والتحصيل الميداني (4 Columns) */}
            <div className="lg:col-span-5 bg-[#151b2b] p-6 rounded-3xl border border-[#1e293b] space-y-4">
              <div className="border-b border-[#1e293b] pb-4">
                <h3 className="text-sm font-black text-white flex items-center gap-2">
                  <FileText size={16} className="text-amber-500 animate-pulse" />
                  <span>الفواتير والطلبات الميدانية لعملاء المسار</span>
                </h3>
                <p className="text-slate-500 text-[10px] font-bold mt-1">اضغط على "تسديد" لتسجيل التحصيل في عهدة المندوب فوراً</p>
              </div>

              <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
                {assignedInvoices.map((inv) => (
                  <div key={inv.id} className="p-4 bg-[#0c101c] border border-slate-800/80 rounded-2xl space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-[9px] text-slate-500 block">فاتورة مبيعات</span>
                        <span className="text-xs font-black text-white font-mono">{inv.invoiceNumber}</span>
                      </div>
                      <span className="text-[9px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full font-black">
                        متبقي {formatCurrency(inv.dueAmount || inv.grandTotal)}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-400 space-y-1">
                      <p className="font-bold text-slate-300">العميل: {inv.customerName}</p>
                      <p>مجموع الفاتورة: <span className="text-emerald-400 font-bold">{formatCurrency(inv.grandTotal)}</span></p>
                    </div>

                    <button
                      onClick={() => openPaymentModal(inv)}
                      className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow-md"
                    >
                      <Coins size={13} />
                      <span>تسديد وتحصيل ميداني 💵</span>
                    </button>
                  </div>
                ))}

                {assignedInvoices.length === 0 && (
                  <div className="py-12 text-center text-slate-500 space-y-2">
                    <CheckCircle size={32} className="text-emerald-500/40 mx-auto" />
                    <p className="text-xs font-bold text-slate-400">لا توجد مديونيات أو فواتير معلقة لعملاء المسار الحاليين</p>
                    <p className="text-[10px] text-slate-500">كل الفواتير مدفوعة بالكامل للمندوب</p>
                  </div>
                )}
              </div>

              {/* Handover trigger button */}
              <div className="border-t border-[#1e293b] pt-4">
                <button
                  onClick={handleSubmitHandoverToTreasury}
                  className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95"
                >
                  <Landmark size={15} />
                  <span>تسليم وإرسال العهدة للخزينة اليومية 🏦</span>
                </button>
                <p className="text-slate-500 text-[9px] text-center font-bold mt-2">تسليم {formatCurrency(pendingHandover)} معلق وتوجيهه للعد والمراجعة بالخزينة</p>
              </div>

            </div>

          </div>

          {/* Bottom Grid: Real-time Custody Ledger */}
          <div className="bg-[#151b2b] p-6 rounded-3xl border border-[#1e293b] space-y-4">
            <div className="flex items-center justify-between border-b border-[#1e293b] pb-4">
              <div>
                <h3 className="text-sm font-black text-white flex items-center gap-2">
                  <ClipboardList size={16} className="text-blue-500" />
                  <span>كشف العهد والتحصيلات الجارية للمندوب ({selectedRep?.name})</span>
                </h3>
                <p className="text-slate-500 text-[10px] font-bold">عرض فوري لحالة المبالغ المحصلة والتحقق من التوريد مع الخزينة المركزية بالشركة</p>
              </div>
              <span className="text-[10px] text-slate-500 font-bold">المطابقة الرقمية</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-500 font-black">
                    <th className="py-3 px-4">رقم التحصيل</th>
                    <th className="py-3 px-4">الفاتورة المرجعية</th>
                    <th className="py-3 px-4">العميل</th>
                    <th className="py-3 px-4">المبلغ المحصل</th>
                    <th className="py-3 px-4">طريقة السداد</th>
                    <th className="py-3 px-4">حالة العهدة</th>
                    <th className="py-3 px-4">تاريخ ووقت التحصيل</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-semibold text-slate-300">
                  {repCustodies.map((rec) => (
                    <tr key={rec.id} className="hover:bg-[#182030]/30 transition-colors">
                      <td className="py-3 px-4 text-slate-400 font-mono">{rec.id}</td>
                      <td className="py-3 px-4 text-white font-mono font-bold">{rec.invoiceNumber}</td>
                      <td className="py-3 px-4">{rec.customerName}</td>
                      <td className="py-3 px-4 text-emerald-400 font-bold">{formatCurrency(rec.collectedAmount)}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px]">
                          {rec.paymentMethod === 'CASH' ? 'نقدي (كاش)' : rec.paymentMethod === 'CHEQUE' ? 'شيك بنكي' : 'تحويل بنكي'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={cn(
                          "px-2.5 py-1 rounded text-[10px] font-black border",
                          rec.status === 'OPEN' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 
                          rec.status === 'PENDING_VERIFICATION' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                          'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        )}>
                          {rec.status === 'OPEN' ? 'عهدة معلقة مع المندوب' : 
                           rec.status === 'PENDING_VERIFICATION' ? 'جاري التحقق بالخزينة' :
                           'تم الاعتماد والتحويل للخزينة'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-500 text-[10px]">{new Date(rec.date).toLocaleString('ar-EG')}</td>
                    </tr>
                  ))}

                  {repCustodies.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-500 text-[11px]">
                        لم يتم تسجيل أي عهد نقدية أو تحصيلات للمندوب اليوم بعد.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* ADMIN VIEW (إدارة المناديب العامة وخطوط السير العامة) */}
      {activeView === 'admin' && (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-black text-white">إدارة مناديب مبيعات الجملة والتوزيع</h3>
              <p className="text-slate-500 font-bold text-xs mt-0.5">تعديل بيانات المناديب، الهواتف، والخطوط الجغرافية العامة بالشركة</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input 
                  type="text" 
                  placeholder="بحث عن مندوب أو خط سير..." 
                  className="w-full pr-10 pl-4 py-2.5 bg-[#151b2b] border border-[#1e293b] rounded-xl text-white focus:outline-none focus:border-blue-500 transition-all placeholder:text-slate-600 text-xs font-bold"
                  value={repSearchTerm}
                  onChange={(e) => setRepSearchTerm(e.target.value)}
                />
              </div>
              <button 
                onClick={() => { setEditingRep(null); setIsModalOpen(true); }}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-2xl hover:bg-blue-500 transition-all font-bold shadow-lg shadow-blue-600/20 active:scale-95 text-xs"
              >
                <Plus size={18} />
                <span>إضافة مندوب جديد</span>
              </button>
            </div>
          </div>

          <div className="bg-[#151b2b] rounded-3xl border border-[#1e293b] shadow-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-[#0f172a]/50 text-slate-500 font-black uppercase tracking-widest">
                  <tr>
                    <th className="px-8 py-5">المندوب</th>
                    <th className="px-8 py-5">رقم الهاتف</th>
                    <th className="px-8 py-5">خط السير الإقليمي</th>
                    <th className="px-8 py-5">حالة المندوب</th>
                    <th className="px-8 py-5">خيارات التحكم</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1e293b] font-semibold text-slate-300">
                  {filteredReps.length === 0 ? (
                    <tr><td colSpan={5} className="px-8 py-16 text-center text-slate-500 font-medium">لا توجد مناديب تطابق معايير البحث حالياً</td></tr>
                  ) : filteredReps.map((rep) => (
                    <tr key={rep.id} className="hover:bg-slate-800/30 transition-colors group">
                      <td className="px-8 py-5 font-bold text-white flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-blue-600/10 text-blue-400 flex items-center justify-center font-black">
                          {(rep.name || 'م').charAt(0)}
                        </div>
                        <span>{rep.name}</span>
                      </td>
                      <td className="px-8 py-5 text-slate-400 font-mono">{rep.phone}</td>
                      <td className="px-8 py-5 text-slate-300">{rep.route}</td>
                      <td className="px-8 py-5">
                        <span className={cn(
                          "px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border",
                          rep.status === 'active' ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : "bg-slate-800 text-slate-500 border-slate-700"
                        )}>
                          {rep.status === 'active' ? 'نشط ومصرح له بالبيع' : 'متوقف'}
                        </span>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => { setEditingRep(rep); setIsModalOpen(true); }}
                            className="p-2 bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 rounded-xl transition-colors"
                          >
                            <Edit2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: ADD / EDIT REPRESENTATIVE */}
      {isModalOpen && (
        <RepModal 
          rep={editingRep} 
          onClose={() => setIsModalOpen(false)} 
        />
      )}

      {/* MODAL 2: FIELD PAYMENT COLLECTOR AND CASHIER POPUP */}
      {paymentInvoice && (
        <div className="fixed inset-0 bg-[#0b0f1a]/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 font-sans">
          <div className="bg-[#151b2b] w-full max-w-md rounded-3xl border border-[#1e293b] shadow-2xl overflow-hidden relative">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-emerald-600 to-teal-600"></div>
            
            <div className="p-6 border-b border-[#1e293b] flex items-center justify-between bg-[#0f172a]/50">
              <div>
                <h3 className="font-black text-sm text-white tracking-tight">تسجيل تحصيل فوري لعهدة المندوب 💵</h3>
                <p className="text-[10px] text-slate-500 mt-1 font-bold">الفاتورة المرجعية: {paymentInvoice.invoiceNumber}</p>
              </div>
              <button onClick={() => setPaymentInvoice(null)} className="p-2 hover:bg-slate-800 rounded-xl text-slate-500 transition-colors">
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              
              <div className="p-4 bg-[#0c101c] rounded-2xl border border-slate-800 space-y-1.5">
                <p className="text-slate-400">العميل المستفيد: <span className="text-white font-black">{paymentInvoice.customerName}</span></p>
                <p className="text-slate-400">القيمة الإجمالية: <span className="text-emerald-400 font-bold">{formatCurrency(paymentInvoice.grandTotal)}</span></p>
                <p className="text-slate-400">المتبقي الآجل للتحصيل: <span className="text-amber-500 font-bold">{formatCurrency(paymentInvoice.dueAmount || paymentInvoice.grandTotal)}</span></p>
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-2">طريقة السداد الميدانية:</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setPayMethod('CASH')}
                    className={cn(
                      "py-2.5 rounded-xl font-bold border transition-all text-center",
                      payMethod === 'CASH' ? "bg-emerald-600/10 border-emerald-500 text-emerald-400" : "bg-[#0c101c] border-slate-800 text-slate-400"
                    )}
                  >
                    نقدي (كاش)
                  </button>
                  <button
                    type="button"
                    onClick={() => setPayMethod('CHEQUE')}
                    className={cn(
                      "py-2.5 rounded-xl font-bold border transition-all text-center",
                      payMethod === 'CHEQUE' ? "bg-emerald-600/10 border-emerald-500 text-emerald-400" : "bg-[#0c101c] border-slate-800 text-slate-400"
                    )}
                  >
                    شيك بنكي
                  </button>
                  <button
                    type="button"
                    onClick={() => setPayMethod('BANK_TRANSFER')}
                    className={cn(
                      "py-2.5 rounded-xl font-bold border transition-all text-center",
                      payMethod === 'BANK_TRANSFER' ? "bg-emerald-600/10 border-emerald-500 text-emerald-400" : "bg-[#0c101c] border-slate-800 text-slate-400"
                    )}
                  >
                    تحويل بنكي
                  </button>
                </div>
              </div>

              {payMethod === 'CHEQUE' && (
                <div>
                  <label className="block text-slate-400 font-bold mb-1.5">رقم الشيك والبنك المسحوب عليه:</label>
                  <input
                    type="text"
                    required
                    value={chequeNo}
                    onChange={(e) => setChequeNo(e.target.value)}
                    placeholder="مثال: شيك رقم 90812 بنك الراجحي"
                    className="w-full bg-[#0b0f1a] border border-slate-800 rounded-xl px-4 py-2.5 text-white font-bold"
                  />
                </div>
              )}

              <div>
                <label className="block text-slate-400 font-bold mb-1.5 flex justify-between">
                  <span>المبلغ المدفوع والمستلم فعلياً (ج.م):</span>
                  <span className="text-[10px] text-amber-400">المدفوع جزئياً متاح</span>
                </label>
                <input
                  type="number"
                  min="1"
                  max={paymentInvoice.dueAmount || paymentInvoice.grandTotal}
                  value={collectedVal || ''}
                  onChange={(e) => setCollectedVal(Number(e.target.value))}
                  className="w-full bg-[#0b0f1a] border border-slate-800 rounded-xl px-4 py-3 text-emerald-400 font-black text-sm font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="p-3 bg-blue-500/5 rounded-2xl border border-blue-500/20 text-[10px] leading-relaxed text-slate-400">
                ⚠️ **ملاحظة محاسبية**: السداد الفوري سيخفض حساب العميل بالسيستم فوراً لضمان دقة الأرصدة، ولكن الأموال ستظل محجوزة في حساب عهدتك كـ **"عهدة معلقة"** حتى تقرر إرسال طلب توريد الخزينة ويوافق عليه أمين الصندوق.
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-[#1e293b]">
                <button
                  type="button"
                  onClick={() => setPaymentInvoice(null)}
                  className="px-5 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-bold hover:bg-slate-700 transition-all"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  onClick={handlePostFieldPayment}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-black hover:from-emerald-500 hover:to-teal-500 transition-all"
                >
                  تأكيد التحصيل والترحيل ⚡
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
};

// Modal implementation for representative data edit/add
const RepModal: React.FC<{ rep: Rep | null, onClose: () => void }> = ({ rep, onClose }) => {
  const [formData, setFormData] = useState({
    name: rep?.name || '',
    phone: rep?.phone || '',
    route: rep?.route || '',
    status: rep?.status || 'active',
    notes: rep?.notes || ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rep) {
      await MaroSyncEngine.saveDocument('reps', { ...rep, ...formData }, false);
    } else {
      const newId = `rep_${Date.now()}`;
      await MaroSyncEngine.saveDocument('reps', { id: newId, ...formData }, true);
    }
    toast.success('تم حفظ بيانات المندوب بنجاح');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-[#0b0f1a]/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#151b2b] w-full max-w-md rounded-3xl border border-[#1e293b] shadow-2xl overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 to-purple-600"></div>
        <div className="p-8 border-b border-[#1e293b] flex items-center justify-between bg-[#0f172a]/50 font-sans">
          <h3 className="font-black text-base text-white tracking-tight">{rep ? 'تعديل بيانات المندوب' : 'إضافة مندوب جديد'}</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-xl text-slate-500 transition-colors"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-5 text-xs">
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">اسم المندوب الثنائي</label>
            <input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full bg-[#0b0f1a] border border-[#334155] rounded-xl px-4 py-3 text-white text-xs font-bold" />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">رقم الهاتف الجوال</label>
            <input type="text" required value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="w-full bg-[#0b0f1a] border border-[#334155] rounded-xl px-4 py-3 text-white text-xs font-bold" />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">خط السير الإقليمي الافتراضي</label>
            <input type="text" required value={formData.route} onChange={(e) => setFormData({ ...formData, route: e.target.value })} className="w-full bg-[#0b0f1a] border border-[#334155] rounded-xl px-4 py-3 text-white text-xs font-bold" />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">ملاحظات إضافية</label>
            <textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} className="w-full bg-[#0b0f1a] border border-[#334155] rounded-xl px-4 py-3 text-white text-xs font-bold h-20" />
          </div>
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#1e293b]">
            <button type="button" onClick={onClose} className="px-6 py-3 rounded-xl bg-slate-800 text-slate-300 font-bold hover:bg-slate-700 transition-all">إلغاء</button>
            <button type="submit" className="px-6 py-3 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-500 transition-all shadow-lg shadow-blue-600/20">حفظ البيانات</button>
          </div>
        </form>
      </div>
    </div>
  );
};
