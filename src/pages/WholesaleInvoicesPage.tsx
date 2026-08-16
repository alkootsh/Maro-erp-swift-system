/**
 * @file WholesaleInvoicesPage.tsx
 * @module واجهات وصفحات النظام (UI Pages)
 * @description ملف جزء من نظام MARO ERP. الوظيفة: WholesaleInvoicesPage.tsx.
 */
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Layers, Plus, Search, FileText, Printer, CheckCircle, 
  Building2, UserCheck, DollarSign, Package, ArrowRight, 
  ShieldAlert, Send, Eye, Columns, Upload, Download, 
  Settings2, Check, Smartphone, Volume2, HelpCircle, Save,
  Truck, Coins, Compass, Keyboard, CornerDownLeft
} from 'lucide-react';
import { SalesInvoice, SalesInvoiceItem, Customer } from '../types/sprint8';
import { ProductMaster } from '../types/productMaster';
import { CustomerRepository } from '../repositories/customerRepository';
import { ProductRepository } from '../repositories/productRepository';
import { MaroSyncEngine } from '../lib/maroSyncEngine';
import { formatCurrency, formatDate, cn } from '../lib/utils';
import { toast } from 'react-hot-toast';
import { CustomerOrdersManager } from './CustomerOrdersManager';
import { KeyboardSearchSelect, SearchOption } from '../components/common/KeyboardSearchSelect';
import { FastKeyboardInvoiceLineEntry, FastInvoiceLinePayload } from '../components/invoices/FastKeyboardInvoiceLineEntry';

// Synthesize a beautiful double-tone chime offline using Web Audio API
const playSuccessChime = () => {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.type = 'sine';
    // Beautiful upward electronic perfect-fifth chord
    osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    osc.start();
    
    osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.08); // G5
    gain.gain.setValueAtTime(0.08, ctx.currentTime + 0.08);
    
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.45);
    osc.stop(ctx.currentTime + 0.45);
  } catch (err) {
    console.warn('Audio feedback failed to play:', err);
  }
};

export const WholesaleInvoicesPage: React.FC = () => {
  const [invoices, setInvoices] = useState<SalesInvoice[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<ProductMaster[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);

  // Unified Tab State - checks pathname or query param to route dynamically
  const [activeTab, setActiveTab] = useState<'invoices' | 'orders' | 'mapper' | 'settlement'>(() => {
    if (window.location.pathname === '/b2b-portal') return 'orders';
    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab');
    if (tab === 'orders') return 'orders';
    if (tab === 'mapper') return 'mapper';
    if (tab === 'settlement') return 'settlement';
    return 'invoices';
  });

  // Global Tax & VAT Settings States (Synchronized with localStorage)
  const [isTaxEnabled, setIsTaxEnabled] = useState<boolean>(() => {
    return localStorage.getItem('maro_tax_enabled') !== 'false';
  });
  const [taxRate, setTaxRate] = useState<number>(() => {
    return Number(localStorage.getItem('maro_tax_rate') || '14');
  });

  // Table Column Customizer State
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem('wholesale_visible_columns');
      return saved ? JSON.parse(saved) : {
        invoiceNumber: true,
        customerName: true,
        notes: true,
        paymentMethod: true,
        totalUntaxed: true,
        totalTax: true,
        grandTotal: true,
        dueAmount: true,
        status: true,
      };
    } catch {
      return {
        invoiceNumber: true,
        customerName: true,
        notes: true,
        paymentMethod: true,
        totalUntaxed: true,
        totalTax: true,
        grandTotal: true,
        dueAmount: true,
        status: true,
      };
    }
  });

  // Excel / CSV Template Uploader & Mapper States
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvPreviewRows, setCsvPreviewRows] = useState<any[]>([]);
  const [columnMapping, setColumnMapping] = useState({
    invoiceNumber: '0',
    customerName: '1',
    notes: '2',
    paymentMethod: '3',
    totalUntaxed: '4',
    totalTax: '5',
    grandTotal: '6'
  });
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);

  // New Wholesale Invoice State
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [salesRep, setSalesRep] = useState('أحمد ممدوح (مندوب أول)');
  const [warehouse, setWarehouse] = useState('مستودع الجملة الرئيسي - برج العرب');
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'CREDIT'>('CREDIT');
  const [cart, setCart] = useState<Array<{
    product: ProductMaster;
    unit: 'قطعة' | 'كرتونة' | 'دستة' | 'بالته';
    quantity: number;
    unitPrice: number;
    discountPercent: number;
  }>>([]);

  // Representative Settlement States
  const [selectedSettlementInvoice, setSelectedSettlementInvoice] = useState<SalesInvoice | null>(null);
  const [settlementRepresentative, setSettlementRepresentative] = useState('كابتن سليم (مندوب التوصيل)');
  const [collectedAmount, setCollectedAmount] = useState<number>(0);
  const [settlementHistory, setSettlementHistory] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('maro_settlements_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const handleProcessSettlement = async () => {
    if (!selectedSettlementInvoice) {
      toast.error('الرجاء اختيار فاتورة لإجراء التسوية');
      return;
    }

    if (collectedAmount < 0) {
      toast.error('مبلغ التحصيل لا يمكن أن يكون سالباً');
      return;
    }

    try {
      // 1. STOCK AUTO-DEDUCTION (التخصيم التلقائي للمخزون)
      for (const item of selectedSettlementInvoice.items) {
        const prod = ProductRepository.getProductByIdSync(item.productId);
        if (prod) {
          const deductQty = item.quantity || 0;
          const currentQty = prod.quantity || 0;
          const newQty = Math.max(0, currentQty - deductQty);
          await ProductRepository.updateProduct(prod.id, { quantity: newQty });
        }
      }

      // 2. FINANCIAL LEDGER ENTRY (القيود المحاسبية وتعديل رصيد العميل تلقائياً)
      if (collectedAmount > 0) {
        await CustomerRepository.addLedgerEntry({
          customerId: selectedSettlementInvoice.customerId,
          transactionType: 'PAYMENT',
          referenceNo: selectedSettlementInvoice.invoiceNumber,
          debit: 0,
          credit: collectedAmount,
          date: new Date().toISOString(),
          notes: `تحصيل نقدي بواسطة المندوب: ${settlementRepresentative} عن الفاتورة ${selectedSettlementInvoice.invoiceNumber}`
        });
      }

      // 3. INVOICE BALANCE RECONCILIATION
      const currentPaid = selectedSettlementInvoice.paidAmount || 0;
      const newPaid = currentPaid + collectedAmount;
      const newDue = Math.max(0, selectedSettlementInvoice.grandTotal - newPaid);
      let nextStatus: 'PAID' | 'PARTIALLY_PAID' | 'APPROVED' = 'APPROVED';
      if (newDue === 0) {
        nextStatus = 'PAID';
      } else if (newPaid > 0) {
        nextStatus = 'PARTIALLY_PAID';
      }

      const updatedInvoice: SalesInvoice = {
        ...selectedSettlementInvoice,
        paidAmount: newPaid,
        dueAmount: newDue,
        status: nextStatus,
        notes: `${selectedSettlementInvoice.notes || ''} | تم التسليم والتحصيل لعهدة: ${settlementRepresentative}`
      };

      MaroSyncEngine.saveDocument('invoices', updatedInvoice);

      // 4. ENTERPRISE AUDIT LOGGER (التدقيق والرقابة الفورية)
      await ProductRepository.logAudit(
        'UPDATE',
        'invoices',
        selectedSettlementInvoice.id,
        selectedSettlementInvoice.invoiceNumber,
        {
          event: 'COURIER_RECONCILIATION',
          representative: settlementRepresentative,
          collected: collectedAmount,
          customer: selectedSettlementInvoice.customerName,
          finalStatus: nextStatus
        }
      );

      // 5. UPDATE LOCAL STATE AND PERSIST HISTORY
      const newRecord = {
        id: `set_${Date.now()}`,
        invoiceNumber: selectedSettlementInvoice.invoiceNumber,
        customerName: selectedSettlementInvoice.customerName,
        representative: settlementRepresentative,
        invoiceTotal: selectedSettlementInvoice.grandTotal,
        collected: collectedAmount,
        date: new Date().toISOString()
      };

      const updatedHistory = [newRecord, ...settlementHistory];
      setSettlementHistory(updatedHistory);
      localStorage.setItem('maro_settlements_history', JSON.stringify(updatedHistory));

      // Play success chime & voice alert feedback
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

      toast.success(`🎉 تم اعتماد تسوية عهدة المندوب بنجاح! تم الخصم التلقائي للمخزون وتحديث مديونية ${selectedSettlementInvoice.customerName}.`, {
        duration: 5000,
        icon: '✅'
      });

      // Clear selection
      setSelectedSettlementInvoice(null);
      setCollectedAmount(0);
      loadData();
    } catch (err: any) {
      toast.error(`حدث خطأ أثناء التسوية: ${err.message}`);
    }
  };

  useEffect(() => {
    loadData();
    const unsub = MaroSyncEngine.subscribe<SalesInvoice>('invoices', (data) => {
      setInvoices((data || []).filter(inv => inv.type === 'WHOLESALE'));
    });
    return () => unsub();
  }, []);

  const loadData = () => {
    setCustomers(CustomerRepository.getCustomers());
    setProducts(ProductRepository.getProducts());
    const allInvs = MaroSyncEngine.getLocalCollection<SalesInvoice>('invoices');
    setInvoices(allInvs.filter(inv => inv.type === 'WHOLESALE'));
  };

  // Toggle Taxes globally
  const handleToggleTax = (enabled: boolean) => {
    setIsTaxEnabled(enabled);
    localStorage.setItem('maro_tax_enabled', String(enabled));
    playSuccessChime();
    toast.success(enabled ? 'تم تفعيل ضريبة القيمة المضافة ومطابقة الفواتير' : 'تم تعطيل ضريبة القيمة المضافة بنجاح');
  };

  // Change VAT rate globally
  const handleTaxRateChange = (rate: number) => {
    setTaxRate(rate);
    localStorage.setItem('maro_tax_rate', String(rate));
    playSuccessChime();
    toast.success(`تم تحديث نسبة الضريبة العامة إلى ${rate}%`);
  };

  // Save layout custom columns
  const toggleColumnVisibility = (colKey: string) => {
    const updated = { ...visibleColumns, [colKey]: !visibleColumns[colKey] };
    setVisibleColumns(updated);
    localStorage.setItem('wholesale_visible_columns', JSON.stringify(updated));
    playSuccessChime();
    toast.success('تم حفظ وتعديل مظهر جدول بيانات الجملة');
  };

  const customerInputRef = useRef<HTMLInputElement>(null);

  const customerOptions: SearchOption[] = useMemo(() => {
    return customers.map(c => ({
      id: c.id,
      title: c.name,
      subtitle: `كود: ${(c as any).code || c.id} | هاتف: ${c.phone || '—'}`,
      badge: `حد ائتماني: ${formatCurrency(c.creditLimit || 0)}`,
      badgeColor: (c.creditLimit && c.currentBalance && c.currentBalance > c.creditLimit) 
        ? 'bg-rose-600/20 text-rose-400 border border-rose-500/30' 
        : 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30',
      meta: `الرصيد: ${formatCurrency(c.currentBalance || 0)}`,
      secondaryMeta: (c.creditLimit && c.currentBalance && c.currentBalance > c.creditLimit) ? '⚠️ متجاوز الحد' : undefined,
      raw: c
    }));
  }, [customers]);

  const handleAddFastLine = (line: FastInvoiceLinePayload) => {
    const existingIndex = cart.findIndex(item => item.product.id === line.product.id && item.unit === line.unit);
    if (existingIndex >= 0) {
      const updated = [...cart];
      updated[existingIndex].quantity += line.quantity;
      updated[existingIndex].unitPrice = line.unitPrice;
      updated[existingIndex].discountPercent = line.discountPercent;
      setCart(updated);
    } else {
      setCart([...cart, {
        product: line.product,
        unit: line.unit as any,
        quantity: line.quantity,
        unitPrice: line.unitPrice,
        discountPercent: line.discountPercent
      }]);
    }
    playSuccessChime();
    toast.success(`تم إضافة "${line.product.name}" بنجاح (${line.quantity} ${line.unit})`);
  };

  const handleAddProductToCart = (prod: ProductMaster) => {
    const existing = cart.find(item => item.product.id === prod.id);
    if (existing) {
      setCart(cart.map(item => item.product.id === prod.id ? { ...item, quantity: item.quantity + 1 } : item));
    } else {
      setCart([...cart, {
        product: prod,
        unit: 'كرتونة',
        quantity: 5,
        unitPrice: prod.price * 0.85, // Wholesale discounted price
        discountPercent: 5
      }]);
    }
    toast.success(`تم إضافة "${prod.name}" لفاتورة الجملة`);
  };

  const calculateTotals = () => {
    let subtotal = 0;
    cart.forEach(item => {
      let multiplier = 1;
      if (item.unit === 'كرتونة') multiplier = 12;
      if (item.unit === 'دستة') multiplier = 12;
      if (item.unit === 'بالته') multiplier = 120;
      
      const lineTotal = item.quantity * multiplier * item.unitPrice * (1 - item.discountPercent / 100);
      subtotal += lineTotal;
    });
    const tax = isTaxEnabled ? (subtotal * (taxRate / 100)) : 0;
    return { subtotal, tax, grandTotal: subtotal + tax };
  };

  const handleSaveWholesaleInvoice = () => {
    if (!selectedCustomer) {
      toast.error('يرجى اختيار عميل الجملة');
      return;
    }
    if (cart.length === 0) {
      toast.error('السلة فارغة');
      return;
    }

    const { subtotal, tax, grandTotal } = calculateTotals();

    // Check credit limit if credit invoice
    if (paymentMethod === 'CREDIT' && selectedCustomer.creditLimit && selectedCustomer.currentBalance && (selectedCustomer.currentBalance + grandTotal > selectedCustomer.creditLimit)) {
      toast.error(`⚠️ تحذير: الفاتورة تتجاوز الحد الائتماني للعميل (${formatCurrency(selectedCustomer.creditLimit)})!`);
    }

    const newInvoice: SalesInvoice = {
      id: 'wh_inv_' + Date.now(),
      invoiceNumber: 'WH-INV-' + Math.floor(100000 + Math.random() * 900000),
      type: 'WHOLESALE',
      branchId: 'branch_main',
      warehouseId: 'wh_main',
      warehouseName: warehouse,
      customerId: selectedCustomer.id,
      customerName: selectedCustomer.name,
      items: cart.map(item => ({
        id: 'item_' + Math.random(),
        productId: item.product.id,
        productName: item.product.name,
        sku: item.product.sku,
        unitName: item.unit,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discountPercent: item.discountPercent,
        lineTotal: item.quantity * item.unitPrice * (1 - item.discountPercent / 100)
      })) as any,
      totalUntaxed: subtotal,
      totalTax: tax,
      totalDiscount: 0,
      grandTotal: grandTotal,
      paidAmount: paymentMethod === 'CASH' ? grandTotal : 0,
      dueAmount: paymentMethod === 'CASH' ? 0 : grandTotal,
      paymentMethod: paymentMethod,
      status: paymentMethod === 'CASH' ? 'PAID' : 'APPROVED',
      notes: `مندوب المبيعات: ${salesRep} | المستودع: ${warehouse}`,
      createdAt: new Date().toISOString()
    };

    MaroSyncEngine.saveDocument('invoices', newInvoice);
    toast.success(`تم اصدار فاتورة الجملة رقم ${newInvoice.invoiceNumber} بنجاح وإنشاء إذن التسليم المخزني!`);
    setIsNewModalOpen(false);
    setCart([]);
    loadData();
  };

  // CSV/Excel upload and parsing handlers
  const handleCsvFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCsvFile(file);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) return;
      const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
      if (lines.length === 0) return;

      // Extract Headers & Rows
      const headers = lines[0].split(',').map(h => h.replace(/"/g, ''));
      setCsvHeaders(headers);

      const parsedRows = lines.slice(1).map((line, idx) => {
        const columns = line.split(',').map(c => c.replace(/"/g, ''));
        return {
          id: idx,
          rawValues: columns
        };
      });
      setCsvPreviewRows(parsedRows);
      toast.success(`تم قراءة الملف بنجاح! تم العثور على ${parsedRows.length} فاتورة جاهزة للمطابقة.`);
    };
    reader.readAsText(file);
  };

  // Auto-generate template sample
  const handleDownloadSampleCsv = () => {
    const headers = ['رقم الفاتورة', 'اسم العميل', 'مندوب المبيعات والمستودع', 'طريقة السداد', 'الصافي قبل الضريبة', 'الضريبة', 'الإجمالي الشامل'];
    const sampleRows = [
      ['WH-INV-800201', 'شركة الأمل للتجارة والتوزيع', 'عادل إمام | مخزن الجملة', 'CREDIT', '50000', '7000', '57000'],
      ['WH-INV-800202', 'مجموعة الفتح التجارية والمستودعات', 'حسام حسني | مخزن المنتجات', 'CASH', '25000', '3500', '28500'],
      ['WH-INV-800203', 'سوبرماركت التوحيد والنور فرع رمسيس', 'أحمد ممدوح | مخزن برج العرب', 'CREDIT', '120000', '16800', '136800']
    ];
    
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...sampleRows.map(e => e.join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "maro_wholesale_import_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('تم تحميل نموذج استيراد فواتير الجملة الافتراضي بنجاح');
  };

  // Post mapped invoices to local storage DB
  const handleImportMappedInvoices = () => {
    if (csvPreviewRows.length === 0) {
      toast.error('لا توجد بيانات مستوردة لمعالجتها');
      return;
    }

    let successCount = 0;
    csvPreviewRows.forEach(row => {
      try {
        const val = row.rawValues;
        const invNum = val[Number(columnMapping.invoiceNumber)] || ('WH-INV-IMP-' + Math.floor(100000 + Math.random() * 900000));
        const custName = val[Number(columnMapping.customerName)] || 'عميل جملة مستورد';
        const notes = val[Number(columnMapping.notes)] || 'مستورد بواسطة نموذج تخطيط الجداول';
        const pMethod = (val[Number(columnMapping.paymentMethod)] || 'CREDIT').toUpperCase() as 'CASH' | 'CREDIT';
        const subtotal = Number(val[Number(columnMapping.totalUntaxed)] || 0);
        const tax = isTaxEnabled ? (subtotal * (taxRate / 100)) : 0;
        const grandTotal = subtotal + tax;

        const importedInvoice: SalesInvoice = {
          id: 'wh_inv_imp_' + Date.now() + '_' + Math.random(),
          invoiceNumber: invNum,
          type: 'WHOLESALE',
          branchId: 'branch_main',
          warehouseId: 'wh_main',
          warehouseName: 'المستودع الرئيسي (مستورد)',
          customerId: 'cust_imported',
          customerName: custName,
          items: [
            {
              id: 'item_imp',
              productId: 'prod_imported',
              productName: 'منتجات جملة عامة',
              sku: 'IMP-GEN',
              unitName: 'بالته',
              quantity: 1,
              unitPrice: subtotal,
              discountPercent: 0,
              lineTotal: subtotal
            }
          ] as any,
          totalUntaxed: subtotal,
          totalTax: tax,
          totalDiscount: 0,
          grandTotal: grandTotal,
          paidAmount: pMethod === 'CASH' ? grandTotal : 0,
          dueAmount: pMethod === 'CASH' ? 0 : grandTotal,
          paymentMethod: pMethod,
          status: pMethod === 'CASH' ? 'PAID' : 'APPROVED',
          notes: notes,
          createdAt: new Date().toISOString()
        };

        MaroSyncEngine.saveDocument('invoices', importedInvoice);
        successCount++;
      } catch (err) {
        console.error('Failed to import row', err);
      }
    });

    playSuccessChime();
    toast.success(`تم استيراد ومعالجة وتحويل عدد (${successCount}) فاتورة بنجاح إلى قاعدة بيانات مبيعات MARO ERP!`);
    setCsvFile(null);
    setCsvPreviewRows([]);
    loadData();
    setActiveTab('invoices');
  };

  const filteredInvoices = invoices.filter(inv => {
    return inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
           inv.customerName.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const { subtotal: currentSubtotal, tax: currentTax, grandTotal: currentGrandTotal } = calculateTotals();

  return (
    <div className="space-y-6 pb-12 text-right" dir="rtl">
      {/* Dynamic Navigation Sidebar/Tabs Hub header */}
      <div className="bg-[#151b2b] p-8 rounded-3xl border border-[#1e293b] flex flex-col xl:flex-row items-start xl:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-1.5">
            <Layers size={16} />
            <span>لوحة مبيعات الجملة الموحدة وإدارة طلبات العملاء الرقمية (B2B Multi-Channel Sales Suite)</span>
          </div>
          <h1 className="text-2xl font-black text-white">بوابة مبيعات الجملة والطلبات والربط الموحدة</h1>
          <p className="text-slate-400 text-xs mt-1">
            شاشة مركزية تدمج فواتير مبيعات الجملة، مع متجر طلبات العملاء (B2B Portal)، بالإضافة لإعدادات الضريبة الفورية ومخطط جداول الاستيراد.
          </p>
        </div>
        
        {/* Main Tab Controller switches screens directly */}
        <div className="flex flex-wrap gap-2 p-1.5 bg-[#0f172a] border border-[#1e293b] rounded-2xl">
          <button
            onClick={() => setActiveTab('invoices')}
            className={cn(
              "px-5 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2",
              activeTab === 'invoices' ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg" : "text-slate-400 hover:text-white"
            )}
          >
            <FileText size={15} />
            <span>فواتير الجملة الصادرة</span>
          </button>
          
          <button
            onClick={() => setActiveTab('orders')}
            className={cn(
              "px-5 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2",
              activeTab === 'orders' ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg" : "text-slate-400 hover:text-white"
            )}
          >
            <Smartphone size={15} />
            <span>طلبات العملاء والمتجر والربط</span>
          </button>

          <button
            onClick={() => setActiveTab('settlement')}
            className={cn(
              "px-5 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2",
              activeTab === 'settlement' ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg" : "text-slate-400 hover:text-white"
            )}
          >
            <Truck size={15} className="text-amber-400" />
            <span className="flex items-center gap-1">
              <span>تسوية عهد ومبيعات المندوبين</span>
              <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-ping"></span>
            </span>
          </button>
          
          <button
            onClick={() => setActiveTab('mapper')}
            className={cn(
              "px-5 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2",
              activeTab === 'mapper' ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg" : "text-slate-400 hover:text-white"
            )}
          >
            <Columns size={15} />
            <span>تخطيط وتصميم جداول الاستيراد</span>
          </button>
        </div>
      </div>

      {/* Tax Quick Config & Audit Sidebar Card */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Main interactive control area left side */}
        <div className="lg:col-span-3 space-y-6">
          {activeTab === 'invoices' && (
            <>
              {/* Metrics Row */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-[#151b2b] p-5 rounded-2xl border border-[#1e293b]">
                  <p className="text-xs font-bold text-slate-500 uppercase">إجمالي مبيعات الجملة</p>
                  <p className="text-2xl font-black text-white mt-1">
                    {formatCurrency(filteredInvoices.reduce((acc, i) => acc + i.grandTotal, 0))}
                  </p>
                </div>
                <div className="bg-[#151b2b] p-5 rounded-2xl border border-[#1e293b]">
                  <p className="text-xs font-bold text-slate-500 uppercase">الفواتير المسجلة</p>
                  <p className="text-2xl font-black text-emerald-400 mt-1">{filteredInvoices.length}</p>
                </div>
                <div className="bg-[#151b2b] p-5 rounded-2xl border border-[#1e293b]">
                  <p className="text-xs font-bold text-slate-500 uppercase">ديون الموزعين الآجلة</p>
                  <p className="text-2xl font-black text-amber-400 mt-1">
                    {formatCurrency(filteredInvoices.reduce((acc, i) => acc + (i.dueAmount || 0), 0))}
                  </p>
                </div>
                <div className="bg-[#151b2b] p-5 rounded-2xl border border-[#1e293b]">
                  <p className="text-xs font-bold text-slate-500 uppercase">الضريبة العامة المجمعة ({isTaxEnabled ? `${taxRate}%` : 'معطلة'})</p>
                  <p className="text-2xl font-black text-blue-400 mt-1">
                    {formatCurrency(filteredInvoices.reduce((acc, i) => acc + (i.totalTax || 0), 0))}
                  </p>
                </div>
              </div>

              {/* Invoices Table layout */}
              <div className="bg-[#151b2b] rounded-2xl border border-[#1e293b] overflow-hidden shadow-xl">
                <div className="p-4 border-b border-[#1e293b] flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="relative flex-1 w-full max-w-md">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                    <input
                      type="text"
                      placeholder="بحث سريع برقم الفاتورة أو اسم عميل الجملة والموزع..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pr-10 pl-4 py-2.5 bg-[#0f172a] border border-[#1e293b] rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500 text-right font-bold"
                    />
                  </div>
                  <div className="flex gap-2 w-full sm:w-auto justify-end">
                    <button
                      onClick={() => setIsNewModalOpen(true)}
                      className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl font-bold text-xs shadow-lg transition-all"
                    >
                      <Plus size={16} />
                      <span>إصدار فاتورة جملة جديدة</span>
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-slate-900/50 text-slate-500 text-[10px] font-bold uppercase tracking-wider">
                      <tr>
                        {visibleColumns.invoiceNumber && <th className="px-6 py-4">رقم الفاتورة</th>}
                        {visibleColumns.customerName && <th className="px-6 py-4">عميل الجملة / الموزع</th>}
                        {visibleColumns.notes && <th className="px-6 py-4">ملاحظات ومندوب المبيعات</th>}
                        {visibleColumns.paymentMethod && <th className="px-6 py-4">طريقة السداد</th>}
                        {visibleColumns.totalUntaxed && <th className="px-6 py-4">الصافي قبل الضريبة</th>}
                        {visibleColumns.totalTax && <th className="px-6 py-4">الضريبة المضافة</th>}
                        {visibleColumns.grandTotal && <th className="px-6 py-4">الإجمالي الشامل</th>}
                        {visibleColumns.dueAmount && <th className="px-6 py-4">المتبقي (آجل)</th>}
                        {visibleColumns.status && <th className="px-6 py-4">الحالة</th>}
                        <th className="px-6 py-4 text-center">الإجراءات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1e293b]">
                      {filteredInvoices.length === 0 ? (
                        <tr>
                          <td colSpan={10} className="px-6 py-12 text-center text-slate-500 font-bold">
                            لا توجد فواتير مبيعات جملة تطابق خيارات البحث الحالية.
                          </td>
                        </tr>
                      ) : (
                        filteredInvoices.map(inv => (
                          <tr key={inv.id} className="hover:bg-slate-800/30 transition-colors">
                            {visibleColumns.invoiceNumber && (
                              <td className="px-6 py-4 font-mono font-bold text-white">{inv.invoiceNumber}</td>
                            )}
                            {visibleColumns.customerName && (
                              <td className="px-6 py-4 font-bold text-slate-200">{inv.customerName}</td>
                            )}
                            {visibleColumns.notes && (
                              <td className="px-6 py-4 text-slate-400">{inv.notes || 'غير محدد'}</td>
                            )}
                            {visibleColumns.paymentMethod && (
                              <td className="px-6 py-4">
                                <span className="px-2 py-1 rounded bg-[#0f172a] text-[10px] text-slate-300 font-mono">
                                  {inv.paymentMethod === 'CASH' ? 'نقدي' : 'آجل (Credit)'}
                                </span>
                              </td>
                            )}
                            {visibleColumns.totalUntaxed && (
                              <td className="px-6 py-4 font-mono font-bold text-slate-300">{formatCurrency(inv.totalUntaxed)}</td>
                            )}
                            {visibleColumns.totalTax && (
                              <td className="px-6 py-4 font-mono text-blue-400 font-bold">{formatCurrency(inv.totalTax)}</td>
                            )}
                            {visibleColumns.grandTotal && (
                              <td className="px-6 py-4 font-mono font-black text-emerald-400">{formatCurrency(inv.grandTotal)}</td>
                            )}
                            {visibleColumns.dueAmount && (
                              <td className="px-6 py-4 font-mono text-amber-500">{formatCurrency(inv.dueAmount || 0)}</td>
                            )}
                            {visibleColumns.status && (
                              <td className="px-6 py-4">
                                <span className={cn(
                                  "px-2 py-0.5 rounded text-[10px] font-bold border inline-block",
                                  inv.status === 'PAID' ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                                )}>
                                  {inv.status === 'PAID' ? 'مدفوعة بالكامل' : 'مستحقة (آجلة)'}
                                </span>
                              </td>
                            )}
                            <td className="px-6 py-4 text-center">
                              <button
                                onClick={() => {
                                  playSuccessChime();
                                  toast.success(`جاري فحص وتصدير الفاتورة رقم ${inv.invoiceNumber}`);
                                }}
                                className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors inline-flex items-center gap-1 font-bold text-[10px]"
                              >
                                <Printer size={13} />
                                <span>طباعة</span>
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {activeTab === 'orders' && (
            <div className="bg-[#151b2b] p-6 rounded-2xl border border-[#1e293b]">
              <div className="flex items-center justify-between border-b border-[#1e293b] pb-4 mb-4">
                <div>
                  <h3 className="text-lg font-black text-white">إدارة طلبات المتجر والربط الرقمي</h3>
                  <p className="text-slate-400 text-xs mt-1">تتبع وعرض وتحويل طلبات العملاء الواردة من المتجر الإلكتروني أو الواتساب فوراً إلى فواتير جملة مبيعات.</p>
                </div>
              </div>
              
              {/* Directly render the integrated CustomerOrdersManager component inside this tab to completely link screens */}
              <CustomerOrdersManager />
            </div>
          )}

          {activeTab === 'settlement' && (
            <div className="space-y-6">
              
              {/* Core cycle explainer alert banner */}
              <div className="p-5 bg-gradient-to-r from-[#111e2a] to-[#0c1322] border border-[#1e293b] rounded-3xl flex items-start gap-4">
                <Truck className="text-amber-400 shrink-0 mt-0.5" size={22} />
                <div className="space-y-1">
                  <h4 className="text-white text-sm font-black">🔄 الدورة المستندية والمالية المغلَقة للبيع والتحصيل بالمندوبين</h4>
                  <p className="text-slate-400 text-xs leading-relaxed font-semibold">
                    1. **الصرف والمستودع**: يتم حجز المخزون وتجهيز الطلب بالمستودع لعدم تكرار البيع. <br />
                    2. **تحميل العهدة**: يتم تسليم البضاعة والفواتير الآجلة أو الكاش كعهدة (سلعية ومالية) لمندوب التوصيل. <br />
                    3. **التسليم والتخصيم الفوري**: يسلم المندوب الفاتورة للعميل، ويقوم بتحصيل المبلغ (كاش، جزئي، أو شامل سداد مديونية قديمة). <br />
                    4. **التسوية التلقائية**: يسجل السيستم التسوية فوراً، فيقوم بـ **تخصيم المخزون المفرغ تلقائياً** وتخفيض رصيد العميل المالي المسدد مع تسجيلها بدفتر حساب الأرباح والخسائر وحركات الخزينة.
                  </p>
                </div>
              </div>

              {/* Main Interactive Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Right Column: Invoices ready for dispatch/delivery */}
                <div className="bg-[#151b2b] p-6 rounded-3xl border border-[#1e293b] flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between border-b border-[#1e293b] pb-4 mb-4">
                      <div>
                        <h3 className="text-base font-black text-white flex items-center gap-2">
                          <Package size={18} className="text-amber-500" />
                          <span>الفواتير والطلبات الجاهزة للشحن والتسوية</span>
                        </h3>
                        <p className="text-slate-500 text-[11px] font-bold mt-1">اختر الفاتورة الصادرة لتحميلها كعهدة على المندوب والبدء في تسويتها</p>
                      </div>
                      <span className="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full font-black">
                        {invoices.filter(i => i.status !== 'PAID').length} معلقة
                      </span>
                    </div>

                    <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                      {invoices.filter(i => i.status !== 'PAID').map((inv) => {
                        const isSelected = selectedSettlementInvoice?.id === inv.id;
                        return (
                          <div
                            key={inv.id}
                            onClick={() => {
                              setSelectedSettlementInvoice(inv);
                              setCollectedAmount(inv.dueAmount || inv.grandTotal);
                              playSuccessChime();
                            }}
                            className={cn(
                              "p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between",
                              isSelected 
                                ? "bg-[#18233c] border-amber-500/40 shadow-lg" 
                                : "bg-[#0f1422]/60 border-[#1e293b] hover:bg-[#121a2c]"
                            )}
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <span className="text-[10px] font-bold text-slate-500 block">رقم المستند</span>
                                <span className="text-xs font-black text-white font-mono">{inv.invoiceNumber}</span>
                              </div>
                              <span className={cn(
                                "text-[9px] px-2 py-0.5 rounded-full font-black",
                                inv.status === 'APPROVED' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                              )}>
                                {inv.status === 'APPROVED' ? 'جاهز للتجهيز' : 'مسلم جزئياً'}
                              </span>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mt-3 pt-3 border-t border-slate-800/80 text-[11px]">
                              <div>
                                <span className="text-slate-500 block">العميل المستلم:</span>
                                <span className="text-slate-200 font-bold block truncate">{inv.customerName}</span>
                              </div>
                              <div>
                                <span className="text-slate-500 block">مبلغ الفاتورة الكلي:</span>
                                <span className="text-emerald-400 font-black block">{formatCurrency(inv.grandTotal)}</span>
                              </div>
                              <div>
                                <span className="text-slate-500 block">المتبقي الآجل:</span>
                                <span className="text-amber-500 font-black block">{formatCurrency(inv.dueAmount || inv.grandTotal)}</span>
                              </div>
                              <div>
                                <span className="text-slate-500 block">مندوب مبيعات الشحنة:</span>
                                <span className="text-slate-300 font-bold block truncate">{inv.notes?.split('|')[0]?.replace('مندوب المبيعات:', '')?.trim() || 'غير معين'}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}

                      {invoices.filter(i => i.status !== 'PAID').length === 0 && (
                        <div className="py-12 text-center text-slate-500 space-y-2">
                          <CheckCircle size={36} className="text-emerald-500/40 mx-auto" />
                          <p className="text-xs font-bold text-slate-400">لا توجد فواتير معلقة حالياً!</p>
                          <p className="text-[10px] text-slate-500">كل فواتير الجملة تم سدادها وتسويتها وتخصيم مستودعاتها بالكامل.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Left Column: Interactive Settlement & Auto-Deductions Calculator */}
                <div className="bg-[#151b2b] p-6 rounded-3xl border border-[#1e293b] flex flex-col justify-between">
                  {selectedSettlementInvoice ? (
                    <div className="space-y-5">
                      <div className="border-b border-[#1e293b] pb-4">
                        <span className="text-[10px] text-amber-400 font-black tracking-widest uppercase flex items-center gap-1.5 mb-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping"></span>
                          <span>حاسبة تسوية عهد الموزعين الفورية</span>
                        </span>
                        <h3 className="text-base font-black text-white">
                          تسوية الفاتورة: <span className="text-amber-400 font-mono font-black">{selectedSettlementInvoice.invoiceNumber}</span>
                        </h3>
                        <p className="text-slate-500 text-[10px] font-bold">تأكيد خروج الشحنة مع المندوب ومراجعة النقدية المستلمة لتحديث مديونية العميل</p>
                      </div>

                      {/* Informational table */}
                      <div className="grid grid-cols-2 gap-3 bg-[#0f1422] p-4 rounded-2xl border border-slate-800 text-[11px]">
                        <div>
                          <span className="text-slate-500 block mb-0.5">العميل المستفيد:</span>
                          <span className="text-slate-200 font-bold">{selectedSettlementInvoice.customerName}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block mb-0.5">المستودع الرئيسي للصرف:</span>
                          <span className="text-slate-200 font-bold truncate block">{selectedSettlementInvoice.warehouseName}</span>
                        </div>
                        <div className="pt-2 border-t border-slate-800">
                          <span className="text-slate-500 block mb-0.5">القيمة الكلية:</span>
                          <span className="text-slate-200 font-black">{formatCurrency(selectedSettlementInvoice.grandTotal)}</span>
                        </div>
                        <div className="pt-2 border-t border-slate-800">
                          <span className="text-slate-500 block mb-0.5">المتبقي كعهدة تحصيل:</span>
                          <span className="text-amber-400 font-black">{formatCurrency(selectedSettlementInvoice.dueAmount || selectedSettlementInvoice.grandTotal)}</span>
                        </div>
                      </div>

                      {/* Form inputs */}
                      <div className="space-y-3.5 text-xs">
                        <div>
                          <label className="block text-slate-400 font-bold mb-1.5">1. كابتن التوصيل / المندوب المستلم للعهدة:</label>
                          <select
                            value={settlementRepresentative}
                            onChange={(e) => setSettlementRepresentative(e.target.value)}
                            className="w-full bg-[#0c101c] border border-slate-800 rounded-xl px-3.5 py-2.5 text-white font-bold"
                          >
                            <option value="كابتن سليم (مندوب التوصيل)">كابتن سليم (مندوب مبيعات الجملة والتوزيع)</option>
                            <option value="أحمد محمود (كابتن 1)">أحمد محمود (كابتن 1)</option>
                            <option value="محمد مصطفى (كابتن 2)">محمد مصطفى (كابتن 2)</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-slate-400 font-bold mb-1.5 flex justify-between">
                            <span>2. المبلغ المحصل والمورد نقداً بواسطة المندوب (ج.م):</span>
                            <span className="text-[10px] text-amber-400 font-bold">متبقي مديونية: {formatCurrency(Math.max(0, (selectedSettlementInvoice.dueAmount || selectedSettlementInvoice.grandTotal) - collectedAmount))}</span>
                          </label>
                          <div className="flex gap-2">
                            <input
                              type="number"
                              min="0"
                              max={selectedSettlementInvoice.dueAmount || selectedSettlementInvoice.grandTotal}
                              value={collectedAmount || ''}
                              onChange={(e) => setCollectedAmount(Number(e.target.value))}
                              className="flex-1 bg-[#0c101c] border border-slate-800 text-slate-200 px-4 py-2.5 rounded-xl font-bold focus:outline-none focus:border-amber-500 font-mono"
                              placeholder="أدخل المبلغ المحصل..."
                            />
                            <button
                              type="button"
                              onClick={() => setCollectedAmount(selectedSettlementInvoice.dueAmount || selectedSettlementInvoice.grandTotal)}
                              className="bg-amber-600/10 hover:bg-amber-600/20 text-amber-400 border border-amber-500/30 px-3 rounded-xl font-bold text-xs"
                            >
                              تسديد كامل
                            </button>
                            <button
                              type="button"
                              onClick={() => setCollectedAmount((selectedSettlementInvoice.dueAmount || selectedSettlementInvoice.grandTotal) / 2)}
                              className="bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 border border-blue-500/30 px-3 rounded-xl font-bold text-xs"
                            >
                              سداد نصف
                            </button>
                          </div>
                        </div>

                        <div className="p-3.5 bg-emerald-500/5 rounded-2xl border border-emerald-500/20 space-y-1 text-[11px] leading-relaxed">
                          <p className="text-emerald-400 font-black flex items-center gap-1.5">
                            <CheckCircle size={13} />
                            <span>تأثير التخصيم التلقائي بالسيستم فور الحفظ:</span>
                          </p>
                          <ul className="list-disc list-inside space-y-0.5 text-slate-400 font-semibold">
                            <li>خصم أصناف الفاتورة فوراً من مستودع <span className="text-slate-300 font-bold">({selectedSettlementInvoice.warehouseName})</span>.</li>
                            <li>تحديث رصيد العميل <span className="text-slate-300 font-bold">({selectedSettlementInvoice.customerName})</span> بكشف الحساب بمقدار <span className="text-emerald-400 font-bold">{formatCurrency(collectedAmount)}</span>.</li>
                            <li>تسجيل حركة الصندوق لصالح عهدة <span className="text-slate-300 font-bold">({settlementRepresentative})</span> لترحيل الأرباح والخسائر.</li>
                          </ul>
                        </div>
                      </div>

                      <button
                        onClick={handleProcessSettlement}
                        className="w-full py-3 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 active:scale-95 text-white font-black rounded-xl text-xs shadow-lg shadow-amber-950/20 transition-all flex items-center justify-center gap-2"
                      >
                        <Save size={15} />
                        <span>ترحيل وتخصيم العهدة وتأكيد تسليم الفاتورة ⚡</span>
                      </button>
                    </div>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center p-12 space-y-2">
                      <Truck size={42} className="text-slate-700 animate-pulse" />
                      <h4 className="text-sm font-black text-slate-300">لم يتم اختيار فاتورة للتسوية حالياً</h4>
                      <p className="text-[11px] text-slate-500 leading-relaxed max-w-sm">
                        يرجى النقر على أي فاتورة من القائمة اليمنى لبدء تسويتها، وإعداد نقدية المندوب وتخصيم مخزونها وحساباتها المالية بشكل آلي.
                      </p>
                    </div>
                  )}
                </div>

              </div>

              {/* Bottom ledger list of completed settlements */}
              <div className="bg-[#151b2b] p-6 rounded-3xl border border-[#1e293b] space-y-4">
                <div className="flex items-center justify-between border-b border-[#1e293b] pb-4">
                  <div>
                    <h3 className="text-sm font-black text-white flex items-center gap-2">
                      <Coins size={16} className="text-emerald-500" />
                      <span>دفتر قيود تسويات وعهد المندوبين اليومي</span>
                    </h3>
                    <p className="text-slate-500 text-[10px] font-bold">سجل فوري ومؤرشف لكافة حركات التسوية المالية والسلعية التي تمت خلال اليوم</p>
                  </div>
                  <span className="text-[10px] text-slate-500 font-bold">مرجع تدقيق الحسابات</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-right text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-500 font-black">
                        <th className="py-3 px-4">رقم الفاتورة</th>
                        <th className="py-3 px-4">العميل المستفيد</th>
                        <th className="py-3 px-4">كابتن التوصيل / المندوب</th>
                        <th className="py-3 px-4">مبلغ الفاتورة</th>
                        <th className="py-3 px-4">المورد نقداً</th>
                        <th className="py-3 px-4">حالة التسوية</th>
                        <th className="py-3 px-4">تاريخ ووقت الحركة</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-semibold text-slate-300">
                      {settlementHistory.map((rec) => (
                        <tr key={rec.id} className="hover:bg-[#182030]/30 transition-colors">
                          <td className="py-3 px-4 text-white font-mono font-bold">{rec.invoiceNumber}</td>
                          <td className="py-3 px-4">{rec.customerName}</td>
                          <td className="py-3 px-4 text-slate-400">{rec.representative}</td>
                          <td className="py-3 px-4">{formatCurrency(rec.invoiceTotal)}</td>
                          <td className="py-3 px-4 text-emerald-400 font-bold">{formatCurrency(rec.collected)}</td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-black">
                              تم التخصيم والترحيل
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-500 text-[10px]">{new Date(rec.date).toLocaleString('ar-EG')}</td>
                        </tr>
                      ))}

                      {settlementHistory.length === 0 && (
                        <tr>
                          <td colSpan={7} className="py-8 text-center text-slate-500 text-[11px]">
                            لا توجد تسويات مالية جارية ومسجلة في الوردية الحالية بعد.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {activeTab === 'mapper' && (
            <div className="space-y-6">
              {/* Column Designer Section */}
              <div className="bg-[#151b2b] p-6 rounded-2xl border border-[#1e293b]">
                <div className="flex items-center gap-2 mb-4">
                  <Columns className="text-emerald-400" size={20} />
                  <h3 className="text-lg font-bold text-white">تصميم وتخصيص أعمدة جداول بيانات الجملة</h3>
                </div>
                <p className="text-slate-400 text-xs mb-6">
                  تحكم بمرونة في طريقة عرض جداول فواتير البيع بالجملة والموزعين في النظام. يمكنك إظهار أو إخفاء أي عمود لحفظ المظهر الذي يناسب حجم شاشتك وتفاصيل شركتك.
                </p>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-[#0f172a] p-6 rounded-2xl border border-[#1e293b]">
                  {Object.keys(visibleColumns).map((colKey) => {
                    const columnLabels: Record<string, string> = {
                      invoiceNumber: 'رقم الفاتورة (مفتاحي)',
                      customerName: 'عميل الجملة / الموزع',
                      notes: 'ملاحظات ومندوب المبيعات',
                      paymentMethod: 'طريقة السداد',
                      totalUntaxed: 'الصافي قبل الضريبة',
                      totalTax: 'ضريبة القيمة المضافة',
                      grandTotal: 'الإجمالي النهائي الشامل',
                      dueAmount: 'المبلغ المتبقي (الآجل)',
                      status: 'الحالة والمطابقة'
                    };

                    const isMandatory = ['invoiceNumber', 'customerName', 'grandTotal'].includes(colKey);

                    return (
                      <label 
                        key={colKey} 
                        className={cn(
                          "flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all select-none",
                          visibleColumns[colKey] ? "bg-emerald-600/10 border-emerald-500/40 text-white" : "bg-[#151b2b]/50 border-slate-800 text-slate-500",
                          isMandatory && "opacity-75 cursor-not-allowed"
                        )}
                      >
                        <input
                          type="checkbox"
                          checked={visibleColumns[colKey]}
                          disabled={isMandatory}
                          onChange={() => toggleColumnVisibility(colKey)}
                          className="rounded border-[#1e293b] bg-slate-900 text-emerald-500 focus:ring-emerald-500 w-4 h-4"
                        />
                        <span className="text-xs font-bold">{columnLabels[colKey] || colKey}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Excel / CSV template mapper */}
              <div className="bg-[#151b2b] p-6 rounded-2xl border border-[#1e293b]">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1e293b] pb-4 mb-6">
                  <div className="flex items-center gap-2">
                    <Upload className="text-emerald-400" size={20} />
                    <div>
                      <h3 className="text-lg font-bold text-white">رفع النماذج واستيراد فواتير الجملة بملف CSV</h3>
                      <p className="text-xs text-slate-400 mt-0.5">قم برفع كشوفات الفواتير المجمعة من الموزعين لمطابقتها وترحيلها مباشرة بقاعدة البيانات.</p>
                    </div>
                  </div>
                  <button
                    onClick={handleDownloadSampleCsv}
                    className="flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition-all"
                  >
                    <Download size={14} />
                    <span>تحميل النموذج المرجعي</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* File Selector box */}
                  <div className="md:col-span-1 space-y-4">
                    <div className="border-2 border-dashed border-[#1e293b] hover:border-emerald-500 rounded-2xl p-6 text-center transition-all bg-[#0f172a]">
                      <Upload className="mx-auto text-slate-500 mb-2" size={32} />
                      <span className="block text-xs font-bold text-slate-300">اسحب كشف الفواتير هنا</span>
                      <span className="block text-[10px] text-slate-500 mt-1">يدعم ملفات CSV بترميز UTF-8</span>
                      <input
                        type="file"
                        accept=".csv"
                        onChange={handleCsvFileUpload}
                        className="hidden"
                        id="csv-file-selector"
                      />
                      <label 
                        htmlFor="csv-file-selector"
                        className="mt-4 inline-block px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold cursor-pointer"
                      >
                        تصفح الملفات
                      </label>
                    </div>

                    {csvFile && (
                      <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs flex items-center justify-between">
                        <span className="font-bold text-white truncate max-w-[150px]">{csvFile.name}</span>
                        <button 
                          onClick={() => { setCsvFile(null); setCsvPreviewRows([]); }}
                          className="text-red-400 font-bold hover:text-red-300"
                        >
                          إزالة
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Mapping column controls */}
                  <div className="md:col-span-2 space-y-4">
                    <h4 className="text-xs font-black text-slate-300 uppercase">تعيين وتخطيط الحقول (Column Field Mapper)</h4>
                    <p className="text-[11px] text-slate-500">اختر من القوائم العمود المقابل لكل حقل في ملف CSV الذي قمت برفعه للمطابقة الدقيقة:</p>
                    
                    <div className="grid grid-cols-2 gap-4 bg-[#0f172a] p-4 rounded-xl border border-[#1e293b]">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-400 mb-1">رقم الفاتورة (Unique Key)</label>
                        <select
                          value={columnMapping.invoiceNumber}
                          onChange={(e) => setColumnMapping({ ...columnMapping, invoiceNumber: e.target.value })}
                          className="w-full p-2 bg-[#151b2b] border border-slate-800 rounded-lg text-white text-xs"
                        >
                          {csvHeaders.length > 0 ? (
                            csvHeaders.map((h, i) => <option key={i} value={i}>{h}</option>)
                          ) : (
                            <option value="0">العمود 1 (رقم الفاتورة)</option>
                          )}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-400 mb-1">اسم عميل الجملة / الموزع</label>
                        <select
                          value={columnMapping.customerName}
                          onChange={(e) => setColumnMapping({ ...columnMapping, customerName: e.target.value })}
                          className="w-full p-2 bg-[#151b2b] border border-slate-800 rounded-lg text-white text-xs"
                        >
                          {csvHeaders.length > 0 ? (
                            csvHeaders.map((h, i) => <option key={i} value={i}>{h}</option>)
                          ) : (
                            <option value="1">العمود 2 (اسم العميل)</option>
                          )}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-400 mb-1">المبلغ الصافي قبل الضريبة</label>
                        <select
                          value={columnMapping.totalUntaxed}
                          onChange={(e) => setColumnMapping({ ...columnMapping, totalUntaxed: e.target.value })}
                          className="w-full p-2 bg-[#151b2b] border border-slate-800 rounded-lg text-white text-xs"
                        >
                          {csvHeaders.length > 0 ? (
                            csvHeaders.map((h, i) => <option key={i} value={i}>{h}</option>)
                          ) : (
                            <option value="4">العمود 5 (الصافي)</option>
                          )}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-400 mb-1">طريقة السداد (CASH/CREDIT)</label>
                        <select
                          value={columnMapping.paymentMethod}
                          onChange={(e) => setColumnMapping({ ...columnMapping, paymentMethod: e.target.value })}
                          className="w-full p-2 bg-[#151b2b] border border-slate-800 rounded-lg text-white text-xs"
                        >
                          {csvHeaders.length > 0 ? (
                            csvHeaders.map((h, i) => <option key={i} value={i}>{h}</option>)
                          ) : (
                            <option value="3">العمود 4 (السداد)</option>
                          )}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                {/* File Preview before ultimate saving */}
                {csvPreviewRows.length > 0 && (
                  <div className="mt-6 space-y-4 border-t border-[#1e293b] pt-6">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-slate-300">معاينة الفواتير المقروءة قبل الإدراج النهائي ({csvPreviewRows.length} فاتورة)</h4>
                      <button
                        onClick={handleImportMappedInvoices}
                        className="flex items-center gap-1.5 px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black rounded-xl shadow-lg"
                      >
                        <Check size={14} />
                        <span>ترحيل وتثبيت كافة الفواتير المقروءة</span>
                      </button>
                    </div>

                    <div className="overflow-x-auto rounded-xl border border-[#1e293b] bg-[#0f172a]">
                      <table className="w-full text-right text-xs">
                        <thead className="bg-slate-900 text-slate-400">
                          <tr>
                            <th className="p-3">رقم الفاتورة المكتشف</th>
                            <th className="p-3">عميل الجملة</th>
                            <th className="p-3">طريقة السداد</th>
                            <th className="p-3">الصافي</th>
                            <th className="p-3">قيمة الضريبة المضافة ({isTaxEnabled ? `${taxRate}%` : 'معطلة'})</th>
                            <th className="p-3">الإجمالي الشامل المتوقع</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#1e293b]">
                          {csvPreviewRows.map((row, idx) => {
                            const val = row.rawValues;
                            const invNum = val[Number(columnMapping.invoiceNumber)] || 'WH-INV-IMP-' + (100000 + idx);
                            const custName = val[Number(columnMapping.customerName)] || 'عميل جملة مستورد';
                            const pMethod = val[Number(columnMapping.paymentMethod)] || 'CREDIT';
                            const subtotal = Number(val[Number(columnMapping.totalUntaxed)] || 0);
                            const calculatedTax = isTaxEnabled ? (subtotal * (taxRate / 100)) : 0;
                            const total = subtotal + calculatedTax;

                            return (
                              <tr key={row.id} className="hover:bg-slate-800/30">
                                <td className="p-3 font-mono font-bold text-white">{invNum}</td>
                                <td className="p-3 text-slate-300">{custName}</td>
                                <td className="p-3">
                                  <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] text-slate-300">
                                    {pMethod === 'CASH' ? 'نقدي' : 'آجل (CREDIT)'}
                                  </span>
                                </td>
                                <td className="p-3 font-mono text-slate-400">{formatCurrency(subtotal)}</td>
                                <td className="p-3 font-mono text-blue-400 font-bold">{formatCurrency(calculatedTax)}</td>
                                <td className="p-3 font-mono text-emerald-400 font-black">{formatCurrency(total)}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Global Configuration Controls Panel (Right Side Bar) */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Interactive Global VAT Tax Manager Hub Card */}
          <div className="bg-[#151b2b] p-6 rounded-2xl border border-[#1e293b] space-y-6">
            <div className="flex items-center gap-2 border-b border-[#1e293b] pb-3">
              <Settings2 className="text-blue-400" size={18} />
              <h3 className="font-bold text-sm text-white">إعدادات الضريبة والتحقق الفوري</h3>
            </div>
            
            <p className="text-[11px] text-slate-400 leading-relaxed">
              تحكم بمرونة مطلقة في تفعيل أو تعطيل حسابات ضريبة القيمة المضافة (VAT) عبر كامل بوابة مبيعات الجملة وطلبات المتجر الرقمية.
            </p>

            {/* Enable/Disable VAT master Switch */}
            <div className="flex items-center justify-between p-3.5 bg-[#0f172a] rounded-xl border border-[#1e293b] transition-all">
              <div>
                <span className="block text-xs font-bold text-white">ضريبة القيمة المضافة</span>
                <span className="text-[10px] text-slate-500">{isTaxEnabled ? 'نشط ومفعل تلقائياً' : 'غير نشط (معطلة)'}</span>
              </div>
              <button
                onClick={() => handleToggleTax(!isTaxEnabled)}
                className={cn(
                  "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none",
                  isTaxEnabled ? "bg-emerald-600" : "bg-slate-800"
                )}
              >
                <span
                  className={cn(
                    "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                    isTaxEnabled ? "-translate-x-6" : "-translate-x-1"
                  )}
                />
              </button>
            </div>

            {/* Slider or custom tax rate selection buttons */}
            {isTaxEnabled && (
              <div className="space-y-3 pt-2">
                <label className="block text-xs font-bold text-slate-400">نسبة الضريبة المفروضة (VAT %)</label>
                <div className="grid grid-cols-4 gap-2">
                  {[0, 5, 14, 15].map((rate) => (
                    <button
                      key={rate}
                      onClick={() => handleTaxRateChange(rate)}
                      className={cn(
                        "py-2 rounded-lg text-xs font-mono font-bold border transition-all",
                        taxRate === rate 
                          ? "bg-blue-600/20 border-blue-500 text-blue-400" 
                          : "bg-[#0f172a] border-slate-800 text-slate-400 hover:text-white"
                      )}
                    >
                      {rate}%
                    </button>
                  ))}
                </div>
                
                {/* Custom sliding input for flexible rates */}
                <div className="pt-2">
                  <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                    <span>حد أدنى: 0%</span>
                    <span className="font-bold text-blue-400">النسبة الحالية: {taxRate}%</span>
                    <span>حد أقصى: 30%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="30"
                    value={taxRate}
                    onChange={(e) => handleTaxRateChange(Number(e.target.value))}
                    className="w-full accent-blue-500 h-1 bg-[#0f172a] rounded-lg cursor-pointer"
                  />
                </div>
              </div>
            )}

            {/* Tax audit impact block */}
            <div className="p-4 rounded-xl bg-slate-900/40 border border-[#1e293b] space-y-2">
              <span className="text-[10px] text-slate-500 uppercase font-black block">الأثر المالي والضريبي للمنظومة</span>
              <div className="text-xs space-y-1.5">
                <div className="flex justify-between text-slate-400">
                  <span>الامتثال الضريبي:</span>
                  <span className={cn("font-bold", isTaxEnabled ? "text-emerald-400" : "text-amber-500")}>
                    {isTaxEnabled ? 'مطابق لقوانين الجمارك' : 'غير خاضع للضريبة'}
                  </span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>صيغة الحساب:</span>
                  <span className="font-mono text-slate-300">
                    {isTaxEnabled ? `السعر × الكمية × ${taxRate}%` : 'السعر × الكمية'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick learning card explaining calculations as required */}
          <div className="bg-[#151b2b] p-6 rounded-2xl border border-[#1e293b] space-y-3">
            <div className="flex items-center gap-1.5 text-amber-400">
              <HelpCircle size={16} />
              <span className="font-bold text-xs">قواعد الاحتساب والمعادلات المحاسبية</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              تعتمد مبيعات الجملة على مستويات خصم متغيرة ووحدات تعبئة مجمعة. عند إصدار الفاتورة:
            </p>
            <ul className="text-[10px] text-slate-500 space-y-1.5 list-disc pr-4">
              <li>يتم ضرب الكمية في معامل التعبئة (كرتونة = 12، بالته = 120).</li>
              <li>يتم تطبيق خصم الشريحة الممنوح للموزع أولاً على السعر الصافي.</li>
              <li>تُحسب ضريبة القيمة المضافة على الصافي بعد الخصم مباشرة.</li>
              <li>يرتبط العميل بحد ائتماني يمنع تجاوز ديون الموزع خارج السقف المحدد.</li>
            </ul>
          </div>

        </div>
      </div>

      {/* New Wholesale Invoice Modal - Keyboard-First Architecture */}
      {isNewModalOpen && (
        <div 
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onKeyDown={(e) => {
            if (e.key === 'F2') {
              e.preventDefault();
              customerInputRef.current?.focus();
              customerInputRef.current?.select();
            } else if (e.key === 'F3') {
              e.preventDefault();
              const prodInput = document.getElementById('fast-product-search') as HTMLInputElement;
              prodInput?.focus();
              prodInput?.select();
            } else if ((e.ctrlKey && e.key === 'Enter') || e.key === 'F9') {
              e.preventDefault();
              handleSaveWholesaleInvoice();
            } else if (e.key === 'Escape') {
              e.preventDefault();
              setIsNewModalOpen(false);
            }
          }}
        >
          <div className="bg-[#151b2b] border border-[#1e293b] w-full max-w-5xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
            <div className="p-6 border-b border-[#1e293b] flex items-center justify-between bg-slate-900/40">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-emerald-600/20 text-emerald-400 rounded-2xl">
                  <FileText size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <span>إصدار فاتورة بيع جملة جديدة (B2B Wholesale)</span>
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-bold">إدخال بلوحة المفاتيح</span>
                  </h3>
                  <p className="text-xs text-slate-400">التنقل بالكامل بالأسهم ومفتاح Enter، بحث فوري ومطابقة سريعة دون الحاجة للماوس.</p>
                </div>
              </div>
              <button 
                onClick={() => setIsNewModalOpen(false)}
                className="p-2 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Keyboard Shortcuts Helper Bar */}
            <div className="bg-[#0b0f19] px-6 py-2 border-b border-[#1e293b] flex items-center justify-between text-xs text-slate-400 overflow-x-auto">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5 font-bold text-white">
                  <Keyboard size={14} className="text-emerald-400" />
                  اختصارات المفاتيح:
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="bg-slate-800 text-amber-300 font-mono text-[10px] px-1.5 py-0.5 rounded border border-slate-700 font-bold">F2</kbd>
                  <span>اختيار العميل</span>
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="bg-slate-800 text-blue-300 font-mono text-[10px] px-1.5 py-0.5 rounded border border-slate-700 font-bold">F3</kbd>
                  <span>بحث الأصناف</span>
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="bg-slate-800 text-emerald-300 font-mono text-[10px] px-1.5 py-0.5 rounded border border-slate-700 font-bold">Enter ↵</kbd>
                  <span>التأكيد والتنقل للحقل التالي</span>
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="bg-slate-800 text-teal-300 font-mono text-[10px] px-1.5 py-0.5 rounded border border-slate-700 font-bold">Ctrl+Enter / F9</kbd>
                  <span>حفظ وإصدار</span>
                </span>
              </div>
              <div className="flex items-center gap-1 text-[11px] text-slate-500">
                <kbd className="bg-slate-800 text-slate-300 font-mono text-[10px] px-1.5 py-0.5 rounded border border-slate-700">Esc</kbd>
                <span>إغلاق</span>
              </div>
            </div>

            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-right">
              {/* Customer & Rep Selection */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-start">
                <div className="md:col-span-1">
                  <KeyboardSearchSelect
                    id="wholesale-customer-search"
                    label="عميل الجملة / الموزع"
                    placeholder="اكتب أول حرف من اسم العميل أو الهاتف..."
                    options={customerOptions}
                    value={selectedCustomer?.id || ''}
                    onChange={(id, opt) => {
                      setSelectedCustomer(opt?.raw || null);
                    }}
                    inputRef={customerInputRef}
                    autoFocus={true}
                    shortcutBadge="F2"
                    onAdvanceToNextField={() => {
                      const repInput = document.getElementById('wholesale-sales-rep') as HTMLInputElement;
                      repInput?.focus();
                      repInput?.select();
                    }}
                  />
                  {selectedCustomer && (
                    <div className="mt-1.5 text-[11px] bg-slate-900/90 p-2 rounded-xl border border-slate-800 text-slate-300 space-y-0.5">
                      <div className="flex justify-between">
                        <span className="text-slate-400">الرصيد:</span>
                        <span className="font-mono text-emerald-400 font-bold">{formatCurrency(selectedCustomer.currentBalance || 0)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">الحد الائتماني:</span>
                        <span className="font-mono text-slate-200">{formatCurrency(selectedCustomer.creditLimit || 0)}</span>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label htmlFor="wholesale-sales-rep" className="block text-xs font-bold text-slate-400 mb-1">مندوب المبيعات المسؤول</label>
                  <input
                    id="wholesale-sales-rep"
                    type="text"
                    value={salesRep}
                    onChange={(e) => setSalesRep(e.target.value)}
                    onFocus={(e) => e.target.select()}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const whInput = document.getElementById('wholesale-warehouse') as HTMLInputElement;
                        whInput?.focus();
                        whInput?.select();
                      }
                    }}
                    className="w-full p-2.5 bg-[#0f172a] border border-[#1e293b] rounded-xl text-white text-xs font-bold focus:outline-none focus:border-emerald-500 text-right"
                  />
                </div>

                <div>
                  <label htmlFor="wholesale-warehouse" className="block text-xs font-bold text-slate-400 mb-1">المستودع الصادر منه</label>
                  <input
                    id="wholesale-warehouse"
                    type="text"
                    value={warehouse}
                    onChange={(e) => setWarehouse(e.target.value)}
                    onFocus={(e) => e.target.select()}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const paySelect = document.getElementById('wholesale-payment-method') as HTMLSelectElement;
                        paySelect?.focus();
                      }
                    }}
                    className="w-full p-2.5 bg-[#0f172a] border border-[#1e293b] rounded-xl text-white text-xs font-bold focus:outline-none focus:border-emerald-500 text-right"
                  />
                </div>

                <div>
                  <label htmlFor="wholesale-payment-method" className="block text-xs font-bold text-slate-400 mb-1">طريقة السداد</label>
                  <select
                    id="wholesale-payment-method"
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as any)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const prodInput = document.getElementById('fast-product-search') as HTMLInputElement;
                        prodInput?.focus();
                        prodInput?.select();
                      }
                    }}
                    className="w-full p-2.5 bg-[#0f172a] border border-[#1e293b] rounded-xl text-white text-xs font-bold focus:outline-none focus:border-emerald-500 text-right"
                  >
                    <option value="CREDIT">آجل (Credit Account)</option>
                    <option value="CASH">نقدي (سداد فوري)</option>
                  </select>
                </div>
              </div>

              {/* Fast Keyboard Product Line Entry Bar */}
              <FastKeyboardInvoiceLineEntry
                products={products}
                onAddLine={handleAddFastLine}
                allowWholesaleUnits={true}
                priceType="wholesale"
                defaultUnit="كرتونة"
              />

              {/* Cart Items Table with Keyboard Navigation */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-300 uppercase">بنود الفاتورة ({cart.length} بند)</h4>
                  <span className="text-[11px] text-slate-500">اضغط على الخانات لتعديل الكمية والسعر مباشرة</span>
                </div>
                <div className="bg-[#0f172a] rounded-2xl border border-[#1e293b] overflow-hidden">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-slate-900/60 text-slate-400">
                      <tr>
                        <th className="p-3">#</th>
                        <th className="p-3">المنتج</th>
                        <th className="p-3">وحدة البيع</th>
                        <th className="p-3">الكمية</th>
                        <th className="p-3">سعر الوحدة بالجملة</th>
                        <th className="p-3">خصم (%)</th>
                        <th className="p-3">الإجمالي</th>
                        <th className="p-3 text-center">إزالة</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1e293b]">
                      {cart.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="p-8 text-center text-slate-500">
                            <div className="flex flex-col items-center gap-2">
                              <Package size={28} className="text-slate-600" />
                              <p className="font-bold text-slate-400">السلة فارغة حالياً</p>
                              <p className="text-xs text-slate-500">اضغط <kbd className="bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded font-mono">F3</kbd> أو اكتب اسم الصنف في الشريط أعلاه للبدء.</p>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        cart.map((item, index) => {
                          let mult = 1;
                          if (item.unit === 'كرتونة') mult = 12;
                          if (item.unit === 'دستة') mult = 12;
                          if (item.unit === 'بالته') mult = 120;
                          const lineT = item.quantity * mult * item.unitPrice * (1 - item.discountPercent / 100);

                          return (
                            <tr key={index} className="hover:bg-slate-800/30 transition-colors">
                              <td className="p-3 text-slate-500 font-mono">{index + 1}</td>
                              <td className="p-3 font-bold text-white">
                                <div>{item.product.name}</div>
                                <div className="text-[10px] text-slate-400 font-mono">SKU: {item.product.sku}</div>
                              </td>
                              <td className="p-3">
                                <select 
                                  value={item.unit}
                                  onChange={(e) => {
                                    const updated = [...cart];
                                    updated[index].unit = e.target.value as any;
                                    setCart(updated);
                                  }}
                                  className="bg-[#151b2b] border border-[#1e293b] text-white rounded-lg p-1.5 text-xs font-bold"
                                >
                                  <option value="قطعة">قطعة</option>
                                  <option value="كرتونة">كرتونة (12 قطعة)</option>
                                  <option value="دستة">دستة (12 قطعة)</option>
                                  <option value="بالته">بالته (120 قطعة)</option>
                                  <option value="شريط">شريط</option>
                                  <option value="علبة">علبة</option>
                                  <option value="كجم">كجم</option>
                                </select>
                              </td>
                              <td className="p-3">
                                <input
                                  type="number"
                                  value={item.quantity}
                                  min={1}
                                  step="any"
                                  onFocus={(e) => e.target.select()}
                                  onChange={(e) => {
                                    const updated = [...cart];
                                    updated[index].quantity = Number(e.target.value);
                                    setCart(updated);
                                  }}
                                  className="w-20 bg-[#151b2b] border border-[#1e293b] focus:border-emerald-500 text-white rounded-lg p-1.5 text-xs font-mono font-bold"
                                />
                              </td>
                              <td className="p-3">
                                <input
                                  type="number"
                                  value={item.unitPrice}
                                  step="any"
                                  onFocus={(e) => e.target.select()}
                                  onChange={(e) => {
                                    const updated = [...cart];
                                    updated[index].unitPrice = Number(e.target.value);
                                    setCart(updated);
                                  }}
                                  className="w-28 bg-[#151b2b] border border-[#1e293b] focus:border-emerald-500 text-emerald-400 rounded-lg p-1.5 text-xs font-mono font-bold"
                                />
                              </td>
                              <td className="p-3">
                                <input
                                  type="number"
                                  value={item.discountPercent}
                                  min={0}
                                  max={100}
                                  step="any"
                                  onFocus={(e) => e.target.select()}
                                  onChange={(e) => {
                                    const updated = [...cart];
                                    updated[index].discountPercent = Number(e.target.value);
                                    setCart(updated);
                                  }}
                                  className="w-16 bg-[#151b2b] border border-[#1e293b] focus:border-amber-500 text-amber-400 rounded-lg p-1.5 text-xs font-mono font-bold"
                                />
                              </td>
                              <td className="p-3 font-mono font-black text-white">{formatCurrency(lineT)}</td>
                              <td className="p-3 text-center">
                                <button
                                  type="button"
                                  onClick={() => setCart(cart.filter((_, i) => i !== index))}
                                  className="p-1.5 hover:bg-rose-500/20 text-rose-400 rounded-lg transition-colors font-bold"
                                  title="حذف البند"
                                >
                                  ✕
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Totals Box inside creation modal */}
              <div className="p-5 rounded-2xl bg-[#0f172a] border border-[#1e293b] flex items-center justify-between">
                <div className="space-y-1 text-xs text-slate-400">
                  <div>الصافي قبل الضريبة: <span className="font-mono text-white font-bold">{formatCurrency(currentSubtotal)}</span></div>
                  <div>ضريبة القيمة المضافة ({isTaxEnabled ? `${taxRate}%` : 'معطلة'}): <span className="font-mono text-blue-400 font-bold">{formatCurrency(currentTax)}</span></div>
                  {paymentMethod === 'CREDIT' && selectedCustomer && (
                    <div className="text-amber-400 font-bold text-[11px]">
                      الرصيد بعد إصدار الفاتورة: {formatCurrency((selectedCustomer.currentBalance || 0) + currentGrandTotal)}
                    </div>
                  )}
                </div>
                <div className="text-left">
                  <div className="text-xs text-slate-400 font-bold">الإجمالي الشامل النهائي:</div>
                  <div className="text-2xl font-black text-emerald-400 font-mono">{formatCurrency(currentGrandTotal)}</div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-[#1e293b] bg-slate-900/60 flex items-center justify-between">
              <div className="text-xs text-slate-400 flex items-center gap-2">
                <kbd className="bg-slate-800 text-teal-300 font-mono text-[11px] px-2 py-1 rounded border border-slate-700 font-bold">Ctrl + Enter</kbd>
                <span>أو F9 للحفظ السريع</span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsNewModalOpen(false)}
                  className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-all"
                >
                  إلغاء (Esc)
                </button>
                <button
                  type="button"
                  onClick={handleSaveWholesaleInvoice}
                  className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-black shadow-lg transition-all hover:scale-105 active:scale-95"
                >
                  حفظ وإصدار الفاتورة (F9)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
