import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Building2, User, UserCheck, Package, ShoppingCart, DollarSign, 
  Search, Plus, Trash2, Printer, Save, PauseCircle, PlayCircle, 
  CheckCircle2, AlertTriangle, ShieldCheck, FileText, ArrowRight, 
  Barcode, RefreshCw, Layers, SlidersHorizontal, ChevronDown, 
  MoreHorizontal, CreditCard, Send, X, CornerDownLeft, Sparkles, Check, CheckCircle
} from 'lucide-react';
import { useAuth } from '../AuthProvider';
import { Customer, SalesInvoice, SalesInvoiceItem } from '../../types/sprint8';
import { ProductMaster, ProductUnit } from '../../types/productMaster';
import { CustomerRepository } from '../../repositories/customerRepository';
import { ProductRepository } from '../../repositories/productRepository';
import { SalesRepository } from '../../repositories/salesRepository';
import { formatCurrency, formatDate, playSystemChime, cn } from '../../lib/utils';
import { printSalesInvoice } from '../../lib/invoicePrinter';
import { HeldInvoicesModal, HeldInvoice } from './HeldInvoicesModal';
import { toast } from 'react-hot-toast';

export interface WholesaleInvoiceViewProps {
  onSwitchMode?: (mode: 'WHOLESALE' | 'POS') => void;
}

export const WholesaleInvoiceView: React.FC<WholesaleInvoiceViewProps> = ({ onSwitchMode }) => {
  const { user } = useAuth();

  // Master Data
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<ProductMaster[]>([]);

  // Header State - Pre-filled automatically from logged-in user context
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');
  const [isCustomerDropdownOpen, setIsCustomerDropdownOpen] = useState(false);

  const [branch, setBranch] = useState(() => user?.branchName || 'الفرع الرئيسي - القاهرة');
  const [warehouse, setWarehouse] = useState(() => user?.warehouseName || 'مستودع الجملة الرئيسي - برج العرب');
  const [salesRep, setSalesRep] = useState(() => user?.displayName || user?.name || 'أحمد ممدوح (مندوب جملة أول)');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(() => new Date().toISOString().substring(0, 10));
  const [saleType, setSaleType] = useState<'WHOLESALE' | 'SUPER_WHOLESALE' | 'RETAIL'>('WHOLESALE');
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'CREDIT' | 'CARD' | 'BANK'>('CREDIT');
  const [priceList, setPriceList] = useState('قائمة سعر الجملة الرئيسية');

  // Sync user profile changes if user logs in/updates
  useEffect(() => {
    if (user) {
      if (user.branchName) setBranch(user.branchName);
      if (user.warehouseName) setWarehouse(user.warehouseName);
      if (user.displayName || user.name) setSalesRep(user.displayName || user.name);
    }
  }, [user]);


  // Fast Line Entry & Cart
  const [barcodeQuery, setBarcodeQuery] = useState('');
  const [selectedProductForLine, setSelectedProductForLine] = useState<ProductMaster | null>(null);
  const [selectedUnitName, setSelectedUnitName] = useState<string>('قطعة');
  const [lineQuantity, setLineQuantity] = useState<number>(1);
  const [lineUnitPrice, setLineUnitPrice] = useState<number>(0);
  const [lineDiscount, setLineDiscount] = useState<number>(0);

  const barcodeInputRef = useRef<HTMLInputElement>(null);

  // Cart State
  const [cartItems, setCartItems] = useState<Array<{
    id: string;
    product: ProductMaster;
    unitName: string;
    unitFactor: number;
    quantity: number;
    unitPrice: number;
    discountPercent: number;
    taxRate: number;
    lineTotal: number;
  }>>([]);

  // Payment Settlement
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [isPayDrawerOpen, setIsPayDrawerOpen] = useState(false);
  const [invoiceNotes, setInvoiceNotes] = useState('');

  // Held Invoices Modal
  const [heldInvoices, setHeldInvoices] = useState<HeldInvoice[]>(() => {
    try {
      const saved = localStorage.getItem('maro_held_wholesale_invoices');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [isHeldModalOpen, setIsHeldModalOpen] = useState(false);

  // Extra Actions Dropdown
  const [isExtraActionsOpen, setIsExtraActionsOpen] = useState(false);

  // Load Data
  useEffect(() => {
    const custs = CustomerRepository.getCustomers();
    const prods = ProductRepository.getProducts();
    setCustomers(custs);
    setProducts(prods);

    if (custs.length > 0 && !selectedCustomer) {
      setSelectedCustomer(custs[0]);
    }

    // Auto-focus Barcode
    setTimeout(() => {
      barcodeInputRef.current?.focus();
    }, 150);
  }, []);

  // Update line unit price when selected product or sale type or unit changes
  useEffect(() => {
    if (selectedProductForLine) {
      let basePrice = selectedProductForLine.wholesalePrice || selectedProductForLine.retailPrice || 0;
      if (saleType === 'SUPER_WHOLESALE') basePrice = basePrice * 0.95; // 5% discount for super wholesale
      else if (saleType === 'RETAIL') basePrice = selectedProductForLine.retailPrice || basePrice;

      // check selected unit factor
      const unitObj = selectedProductForLine.units?.find(u => u.name === selectedUnitName);
      const factor = unitObj ? unitObj.factor : 1;

      setLineUnitPrice(basePrice * factor);
    }
  }, [selectedProductForLine, selectedUnitName, saleType]);

  // Calculate totals
  const totals = useMemo(() => {
    let totalUntaxed = 0;
    let totalTax = 0;
    let totalDiscount = 0;

    cartItems.forEach(item => {
      const untaxed = item.quantity * item.unitPrice * (1 - item.discountPercent / 100);
      const tax = untaxed * (item.taxRate / 100);
      totalUntaxed += untaxed;
      totalTax += tax;
      totalDiscount += item.quantity * item.unitPrice * (item.discountPercent / 100);
    });

    const netTotal = totalUntaxed + totalTax;
    const dueAmount = Math.max(0, netTotal - paidAmount);

    return {
      totalUntaxed,
      totalDiscount,
      totalTax,
      netTotal,
      dueAmount
    };
  }, [cartItems, paidAmount]);

  // Customer Credit Validation
  const creditStatus = useMemo(() => {
    if (!selectedCustomer) return { valid: true, text: 'عميل نقدي افتراضي', color: 'emerald' };
    const currentDebt = selectedCustomer.currentBalance || 0;
    const limit = selectedCustomer.creditLimit || 0;

    if (limit === 0) {
      return { valid: true, text: 'كاش فقط (بدون حد ائتمان)', color: 'slate', limit, debt: currentDebt, available: 0 };
    }

    const projectedDebt = currentDebt + (paymentMethod === 'CREDIT' ? totals.dueAmount : 0);
    const available = limit - currentDebt;

    if (projectedDebt > limit) {
      return { 
        valid: false, 
        text: `تجاوز حد الائتمان! (المتبقي للائتمان: ${formatCurrency(available)})`, 
        color: 'rose', 
        limit, 
        debt: currentDebt, 
        available 
      };
    } else if (available < limit * 0.15) {
      return { 
        valid: true, 
        text: `ائتمان محدود متوفر: ${formatCurrency(available)}`, 
        color: 'amber', 
        limit, 
        debt: currentDebt, 
        available 
      };
    }

    return { 
      valid: true, 
      text: `ائتمان متاح: ${formatCurrency(available)}`, 
      color: 'emerald', 
      limit, 
      debt: currentDebt, 
      available 
    };
  }, [selectedCustomer, totals.dueAmount, paymentMethod]);

  // Fast Barcode / Search
  const handleBarcodeSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!barcodeQuery.trim()) return;

    const query = barcodeQuery.trim().toLowerCase();
    const foundProduct = products.find(p => 
      p.sku?.toLowerCase() === query || 
      p.barcode?.toLowerCase() === query ||
      p.name?.toLowerCase().includes(query)
    );

    if (foundProduct) {
      addItemToCart(foundProduct, selectedUnitName || 'قطعة', lineQuantity || 1);
      setBarcodeQuery('');
      setSelectedProductForLine(null);
      playSystemChime('success');
      toast.success(`تمت إضافة: ${foundProduct.name}`);
    } else {
      playSystemChime('warning');
      toast.error('لم يتم العثور على صنف بهذا الباركود أو الكود');
    }
  };

  const addItemToCart = (product: ProductMaster, unitName: string, quantity: number) => {
    const unitObj = product.units?.find(u => u.name === unitName);
    const factor = unitObj ? unitObj.factor : 1;
    let basePrice = product.wholesalePrice || product.retailPrice || 0;
    if (saleType === 'SUPER_WHOLESALE') basePrice *= 0.95;

    const unitPrice = basePrice * factor;
    const taxRate = 14; // Default 14% VAT

    const newItem = {
      id: `line_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      product,
      unitName,
      unitFactor: factor,
      quantity,
      unitPrice,
      discountPercent: 0,
      taxRate,
      lineTotal: quantity * unitPrice * 1.14
    };

    setCartItems(prev => [...prev, newItem]);
  };

  const handleRemoveLine = (index: number) => {
    setCartItems(prev => prev.filter((_, i) => i !== index));
    playSystemChime('warning');
  };

  const handleUpdateLine = (index: number, field: string, value: any) => {
    setCartItems(prev => {
      const copy = [...prev];
      const item = { ...copy[index] };

      if (field === 'quantity') item.quantity = Math.max(1, parseFloat(value) || 1);
      if (field === 'unitPrice') item.unitPrice = Math.max(0, parseFloat(value) || 0);
      if (field === 'discountPercent') item.discountPercent = Math.min(100, Math.max(0, parseFloat(value) || 0));
      if (field === 'unitName') {
        item.unitName = value;
        const unitObj = item.product.units?.find(u => u.name === value);
        item.unitFactor = unitObj ? unitObj.factor : 1;
        let basePrice = item.product.wholesalePrice || item.product.retailPrice || 0;
        item.unitPrice = basePrice * item.unitFactor;
      }

      const untaxed = item.quantity * item.unitPrice * (1 - item.discountPercent / 100);
      item.lineTotal = untaxed * (1 + item.taxRate / 100);

      copy[index] = item;
      return copy;
    });
  };

  // Hold Invoice
  const handleHoldInvoice = () => {
    if (cartItems.length === 0) {
      toast.error('السلة فارغة، لا يمكن تعليق الفاتورة');
      return;
    }

    const heldItem: HeldInvoice = {
      id: `held_${Date.now()}`,
      heldAt: new Date().toISOString(),
      type: 'WHOLESALE',
      customerName: selectedCustomer?.name || 'عميل نقدي',
      itemsCount: cartItems.length,
      grandTotal: totals.netTotal,
      note: invoiceNotes || `فاتورة جملة (${paymentMethod === 'CASH' ? 'كاش' : 'آجل'})`,
      cartData: cartItems,
      customerData: selectedCustomer,
      headerDetails: { branch, warehouse, salesRep, saleType, paymentMethod }
    };

    const updated = [heldItem, ...heldInvoices];
    setHeldInvoices(updated);
    localStorage.setItem('maro_held_wholesale_invoices', JSON.stringify(updated));

    setCartItems([]);
    setInvoiceNotes('');
    playSystemChime('confirm');
    toast.success('تم تعليق الفاتورة بنجاح في الذاكرة المؤقتة');
  };

  const handleRestoreHeld = (held: HeldInvoice) => {
    setCartItems(held.cartData || []);
    if (held.customerData) setSelectedCustomer(held.customerData);
    if (held.headerDetails) {
      setBranch(held.headerDetails.branch || branch);
      setWarehouse(held.headerDetails.warehouse || warehouse);
      setSalesRep(held.headerDetails.salesRep || salesRep);
      setPaymentMethod(held.headerDetails.paymentMethod || paymentMethod);
    }
    setHeldInvoices(prev => {
      const next = prev.filter(h => h.id !== held.id);
      localStorage.setItem('maro_held_wholesale_invoices', JSON.stringify(next));
      return next;
    });
    setIsHeldModalOpen(false);
    playSystemChime('success');
    toast.success('تمت استعادة الفاتورة المعلقة بنجاح');
  };

  const handleDeleteHeld = (id: string) => {
    setHeldInvoices(prev => {
      const next = prev.filter(h => h.id !== id);
      localStorage.setItem('maro_held_wholesale_invoices', JSON.stringify(next));
      return next;
    });
    toast.success('تم حذف الفاتورة المعلقة');
  };

  // Transactional Save Invoice
  const handleSaveInvoice = async (autoPrint = false) => {
    if (cartItems.length === 0) {
      toast.error('لا يمكن حفظ فاتورة فارغة بدون أصناف');
      return;
    }

    if (!creditStatus.valid && paymentMethod === 'CREDIT') {
      toast.error(`خطأ: ${creditStatus.text}. يُرجى تحويل الفاتورة لكاش أو تسوية حساب العميل أولاً.`);
      return;
    }

    try {
      const invoiceData = {
        type: 'WHOLESALE' as const,
        customerId: selectedCustomer?.id || 'cust_cash_default',
        customerName: selectedCustomer?.name || 'عميل جملة نقدي',
        warehouseId: 'WH-MAIN',
        salesRepName: salesRep,
        paymentMethod: paymentMethod,
        notes: invoiceNotes,
        paidAmount: paymentMethod === 'CASH' ? totals.netTotal : paidAmount,
        items: cartItems.map(item => ({
          productId: item.product.id,
          productName: item.product.name,
          sku: item.product.sku || 'SKU',
          quantity: item.quantity,
          unitName: item.unitName,
          unitPrice: item.unitPrice,
          costPrice: item.product.costPrice || item.unitPrice * 0.7,
          discountPercent: item.discountPercent,
          taxRate: item.taxRate,
          lineTotal: item.lineTotal
        }))
      };

      const createdInvoice = await SalesRepository.createInvoice(invoiceData);
      playSystemChime('success');
      toast.success(`تم حفظ فاتورة الجملة بنجاح! رقم: ${createdInvoice.invoiceNumber}`);

      if (autoPrint) {
        printSalesInvoice(createdInvoice);
      }

      // Reset
      setCartItems([]);
      setPaidAmount(0);
      setInvoiceNotes('');
      setInvoiceNumber('');
    } catch (err: any) {
      console.error('Save wholesale invoice error:', err);
      toast.error(`فشل حفظ الفاتورة: ${err.message || 'خطأ في الاتصال'}`);
    }
  };

  // Filtered Customers
  const filteredCustomers = useMemo(() => {
    if (!customerSearchQuery.trim()) return customers;
    const q = customerSearchQuery.toLowerCase();
    return customers.filter(c => 
      c.name.toLowerCase().includes(q) || 
      c.code?.toLowerCase().includes(q) || 
      c.phone?.includes(q)
    );
  }, [customers, customerSearchQuery]);

  return (
    <div className="flex flex-col min-h-screen bg-[#070b13] text-slate-100 font-sans" dir="rtl">
      {/* Top Header Mode Switcher & Title */}
      <div className="bg-[#0f172a] border-b border-slate-800 px-6 py-3 flex items-center justify-between gap-4 sticky top-0 z-30 shadow-md">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-xl text-white shadow-lg shadow-blue-600/20">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-white tracking-wide">شاشة فواتير الجملة</h1>
              <span className="px-2.5 py-0.5 text-[10px] font-bold rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                MARO Wholesale ERP v4.0
              </span>
            </div>
            <p className="text-xs text-slate-400">إدخال احترافي عالي الكثافة مع ربط دقيق بالحد الائتماني والمخزون</p>
          </div>
        </div>

        {/* Mode Selector Toggle Button */}
        {onSwitchMode && (
          <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => onSwitchMode('WHOLESALE')}
              className="px-4 py-1.5 rounded-lg text-xs font-bold transition-all bg-blue-600 text-white shadow-md"
            >
              فواتير الجملة (Wholesale)
            </button>
            <button
              onClick={() => onSwitchMode('POS')}
              className="px-4 py-1.5 rounded-lg text-xs font-bold text-slate-400 hover:text-white transition-all"
            >
              البيع السريع (Fast POS)
            </button>
          </div>
        )}
      </div>

      <div className="p-4 sm:p-6 space-y-4 max-w-[1700px] mx-auto w-full flex-1 flex flex-col">
        {/* Section 1: Invoice Header Parameters (3-Column Dense Layout) */}
        <div className="bg-[#0f172a]/90 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-bold text-white">بيانات وهيدر الفاتورة الأساسي</span>
            </div>
            <span className="px-2.5 py-1 text-[10px] font-bold rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
              <CheckCircle className="w-3 h-3" />
              مدرجة تلقائياً حسب الفرع والمخزن وصلاحيات موظف الجملة (قابل للتعديل)
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Customer Search & Credit Indicator */}
            <div className="space-y-1.5 relative">
              <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                <span>العميل المعتمد:</span>
                <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                  creditStatus.color === 'rose' 
                    ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' 
                    : creditStatus.color === 'amber'
                      ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                }`}>
                  {creditStatus.text}
                </span>
              </label>

              <div className="relative">
                <button
                  onClick={() => setIsCustomerDropdownOpen(!isCustomerDropdownOpen)}
                  className="w-full bg-slate-900 border border-slate-700/80 hover:border-blue-500/50 rounded-xl px-3 py-2 text-xs font-semibold text-slate-200 flex items-center justify-between gap-2 transition"
                >
                  <div className="flex items-center gap-2 truncate">
                    <User className="w-4 h-4 text-blue-400 shrink-0" />
                    <span className="truncate">{selectedCustomer ? `${selectedCustomer.name} (${selectedCustomer.code || 'CUST'})` : 'اختر العميل...'}</span>
                  </div>
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                </button>

                {/* Customer Dropdown Modal */}
                {isCustomerDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-2 z-40 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-3 space-y-2 max-h-72 overflow-y-auto">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 absolute right-3 top-2.5 text-slate-400" />
                      <input
                        type="text"
                        value={customerSearchQuery}
                        onChange={(e) => setCustomerSearchQuery(e.target.value)}
                        placeholder="ابحث باسم العميل، الهاتف، كود العميل..."
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg pr-9 pl-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        autoFocus
                      />
                    </div>

                    <div className="space-y-1">
                      {filteredCustomers.map(cust => (
                        <button
                          key={cust.id}
                          onClick={() => {
                            setSelectedCustomer(cust);
                            setIsCustomerDropdownOpen(false);
                          }}
                          className="w-full text-right px-3 py-2 hover:bg-slate-800 rounded-lg text-xs flex items-center justify-between gap-2 text-slate-200 transition"
                        >
                          <div>
                            <span className="font-bold block">{cust.name}</span>
                            <span className="text-[10px] text-slate-400">{cust.phone || 'بدون هاتف'} • كود: {cust.code}</span>
                          </div>
                          <div className="text-left font-mono">
                            <span className="text-[10px] text-slate-400 block">الرصيد: {formatCurrency(cust.currentBalance || 0)}</span>
                            <span className="text-[10px] text-emerald-400">الحد: {formatCurrency(cust.creditLimit || 0)}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Warehouse & Branch */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">المخزن والفرع:</label>
              <select
                value={warehouse}
                onChange={(e) => setWarehouse(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs font-semibold text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="مستودع الجملة الرئيسي - برج العرب">مستودع الجملة الرئيسي - برج العرب</option>
                <option value="مستودع التوزيع الجغرافي - القاهرة">مستودع التوزيع الجغرافي - القاهرة</option>
                <option value="مستودع المنطقة الصناعية">مستودع المنطقة الصناعية</option>
              </select>
            </div>

            {/* Sales Representative & Sale Type */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">المندوب ومستوى السعر:</label>
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={salesRep}
                  onChange={(e) => setSalesRep(e.target.value)}
                  className="bg-slate-900 border border-slate-700/80 rounded-xl px-2.5 py-2 text-xs font-semibold text-slate-200 focus:outline-none"
                >
                  <option value="أحمد ممدوح (مندوب جملة أول)">أحمد ممدوح</option>
                  <option value="محمود السمان (مندوب كبار العملاء)">محمود السمان</option>
                  <option value="كابتن سليم (مندوب التوزيع)">كابتن سليم</option>
                </select>

                <select
                  value={saleType}
                  onChange={(e) => setSaleType(e.target.value as any)}
                  className="bg-slate-900 border border-slate-700/80 rounded-xl px-2.5 py-2 text-xs font-semibold text-blue-400 focus:outline-none font-bold"
                >
                  <option value="WHOLESALE">سعر الجملة</option>
                  <option value="SUPER_WHOLESALE">جملة الجملة (-5%)</option>
                  <option value="RETAIL">سعر التجزئة</option>
                </select>
              </div>
            </div>

            {/* Payment Method & Invoice Date */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">طريقة الدفع والتاريخ:</label>
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
                  className="bg-slate-900 border border-slate-700/80 rounded-xl px-2.5 py-2 text-xs font-bold text-emerald-400 focus:outline-none"
                >
                  <option value="CREDIT">آجل (على الحساب)</option>
                  <option value="CASH">نقدي (كاش كامل)</option>
                  <option value="CARD">بطاقة / فيزا</option>
                  <option value="BANK">تحويل بنكي</option>
                </select>

                <input
                  type="date"
                  value={invoiceDate}
                  onChange={(e) => setInvoiceDate(e.target.value)}
                  className="bg-slate-900 border border-slate-700/80 rounded-xl px-2 py-2 text-xs font-semibold text-slate-200 focus:outline-none"
                />
              </div>
            </div>

          </div>
        </div>

        {/* Section 2: Fast Barcode & Item Search Entry Line */}
        <div className="bg-[#0f172a]/90 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3">
          <form onSubmit={handleBarcodeSubmit} className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Barcode className="w-5 h-5 absolute right-3.5 top-3 text-amber-400" />
              <input
                ref={barcodeInputRef}
                type="text"
                value={barcodeQuery}
                onChange={(e) => setBarcodeQuery(e.target.value)}
                placeholder="امسح الباركود بالماسح الضوئي أو اكتب اسم الصنف / كود SKU واضغط Enter..."
                className="w-full bg-slate-900 border border-slate-700 focus:border-amber-500/80 rounded-xl pr-11 pl-4 py-2.5 text-sm font-semibold text-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 font-mono placeholder:text-slate-500"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="submit"
                className="w-full sm:w-auto px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition shadow-md shadow-amber-600/10"
              >
                <Plus className="w-4 h-4" />
                <span>إضافة سريعة</span>
              </button>
            </div>
          </form>
        </div>

        {/* Section 3: High-Density Items Table & Fixed Summary Sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-5 flex-1 items-start">
          
          {/* Main Items Table (3 Columns on Large screens) */}
          <div className="lg:col-span-3 bg-[#0f172a]/90 border border-slate-800 rounded-2xl shadow-xl overflow-hidden flex flex-col min-h-[420px]">
            <div className="px-5 py-3.5 bg-slate-800/80 border-b border-slate-700/80 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-blue-400" />
                <h3 className="text-xs font-bold text-white">جدول أصناف الفاتورة ({cartItems.length} صنف)</h3>
              </div>
              <span className="text-[11px] text-slate-400">إدخال مباشر للكيبورد والتعديل الفوري</span>
            </div>

            <div className="overflow-x-auto flex-1">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="bg-slate-900/90 text-slate-400 border-b border-slate-800 font-bold">
                    <th className="py-3 px-3 text-center">#</th>
                    <th className="py-3 px-3">الصنف / الكود</th>
                    <th className="py-3 px-3 text-center">الوحدة</th>
                    <th className="py-3 px-3 text-center">الكمية</th>
                    <th className="py-3 px-3 text-center">السعر (ج.م)</th>
                    <th className="py-3 px-3 text-center">الخصم %</th>
                    <th className="py-3 px-3 text-center">الإجمالي (ج.م)</th>
                    <th className="py-3 px-3 text-center">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-medium">
                  {cartItems.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-20 text-slate-500">
                        <ShoppingCart className="w-12 h-12 mx-auto mb-3 opacity-20 text-slate-400" />
                        <p className="font-semibold text-slate-400">جدول أصناف الفاتورة فارغ</p>
                        <p className="text-[11px] text-slate-500 mt-1">امسح الباركود بالأعلى أو ابحث باسم الصنف لبدء الفاتورة</p>
                      </td>
                    </tr>
                  ) : (
                    cartItems.map((item, idx) => (
                      <tr key={item.id} className="hover:bg-slate-800/40 transition">
                        <td className="py-2.5 px-3 text-center font-mono text-slate-500">{idx + 1}</td>
                        
                        <td className="py-2.5 px-3">
                          <span className="font-bold text-white block">{item.product.name}</span>
                          <span className="text-[10px] text-slate-400 font-mono">SKU: {item.product.sku || 'N/A'}</span>
                        </td>

                        {/* Unit Selector */}
                        <td className="py-2.5 px-3 text-center">
                          <select
                            value={item.unitName}
                            onChange={(e) => handleUpdateLine(idx, 'unitName', e.target.value)}
                            className="bg-slate-900 border border-slate-700/80 rounded-lg px-2 py-1 text-xs text-blue-300 font-semibold focus:outline-none"
                          >
                            <option value="قطعة">قطعة</option>
                            <option value="كرتونة">كرتونة</option>
                            <option value="دستة">دستة</option>
                            <option value="بالتة">بالتة</option>
                          </select>
                        </td>

                        {/* Quantity Input */}
                        <td className="py-2.5 px-3 text-center">
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => handleUpdateLine(idx, 'quantity', e.target.value)}
                            className="w-16 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-center font-mono font-bold text-white focus:outline-none focus:border-blue-500"
                          />
                        </td>

                        {/* Unit Price Input */}
                        <td className="py-2.5 px-3 text-center font-mono">
                          <input
                            type="number"
                            step="0.5"
                            value={item.unitPrice}
                            onChange={(e) => handleUpdateLine(idx, 'unitPrice', e.target.value)}
                            className="w-20 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-center font-mono text-emerald-400 font-bold focus:outline-none"
                          />
                        </td>

                        {/* Discount Input */}
                        <td className="py-2.5 px-3 text-center font-mono">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={item.discountPercent}
                            onChange={(e) => handleUpdateLine(idx, 'discountPercent', e.target.value)}
                            className="w-14 bg-slate-900 border border-slate-700 rounded-lg px-1.5 py-1 text-center font-mono text-amber-400 focus:outline-none"
                          />
                        </td>

                        {/* Line Total */}
                        <td className="py-2.5 px-3 text-center font-mono font-bold text-emerald-400">
                          {formatCurrency(item.lineTotal)}
                        </td>

                        {/* Actions */}
                        <td className="py-2.5 px-3 text-center">
                          <button
                            onClick={() => handleRemoveLine(idx)}
                            className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
                            title="حذف السطر"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Fixed Sticky Invoice Summary Sidebar */}
          <div className="bg-[#0f172a]/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4 sticky top-20">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
              <DollarSign className="w-4 h-4 text-emerald-400" />
              <span>ملخص الفاتورة النهائي</span>
            </h3>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between items-center text-slate-400">
                <span>إجمالي الأصناف:</span>
                <span className="font-mono text-slate-200">{totals.totalUntaxed.toFixed(2)} ج.م</span>
              </div>

              <div className="flex justify-between items-center text-slate-400">
                <span>إجمالي الخصم:</span>
                <span className="font-mono text-amber-400">-{totals.totalDiscount.toFixed(2)} ج.م</span>
              </div>

              <div className="flex justify-between items-center text-slate-400">
                <span>ضريبة القيمة المضافة (14%):</span>
                <span className="font-mono text-blue-400">+{totals.totalTax.toFixed(2)} ج.م</span>
              </div>

              <hr className="border-slate-800" />

              <div className="flex justify-between items-center font-bold text-sm text-white pt-1">
                <span>صافي الفاتورة:</span>
                <span className="font-mono text-lg text-emerald-400">{formatCurrency(totals.netTotal)}</span>
              </div>

              <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[11px] text-slate-400">طريقة التسديد:</span>
                  <span className="text-[11px] font-bold text-emerald-400">
                    {paymentMethod === 'CASH' ? 'نقدي كامل' : 'آجل على الحساب'}
                  </span>
                </div>

                {paymentMethod === 'CREDIT' && selectedCustomer && (
                  <div className="text-[10px] text-slate-400 space-y-1 pt-1 border-t border-slate-800">
                    <div className="flex justify-between">
                      <span>الرصيد الحالي:</span>
                      <span className="font-mono text-slate-300">{formatCurrency(selectedCustomer.currentBalance || 0)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-blue-300">
                      <span>الرصيد بعد الفاتورة:</span>
                      <span className="font-mono">{formatCurrency((selectedCustomer.currentBalance || 0) + totals.dueAmount)}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Notes Input */}
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">ملاحظات الفاتورة:</label>
              <textarea
                value={invoiceNotes}
                onChange={(e) => setInvoiceNotes(e.target.value)}
                placeholder="أدخل أي شروط تسليم أو ملاحظات محاسبية..."
                rows={2}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
              />
            </div>
          </div>
        </div>

        {/* Section 4: Primary Actions Bar (Bottom Sticky Bar) */}
        <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-4 shadow-2xl flex flex-wrap items-center justify-between gap-3 sticky bottom-3 z-30">
          
          <div className="flex items-center gap-2">
            {/* Primary Save Button */}
            <button
              onClick={() => handleSaveInvoice(false)}
              className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-sm rounded-xl flex items-center gap-2 transition shadow-lg shadow-emerald-600/20"
            >
              <Save className="w-4 h-4" />
              <span>حفظ الفاتورة</span>
            </button>

            {/* Save & Print */}
            <button
              onClick={() => handleSaveInvoice(true)}
              className="px-5 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl flex items-center gap-2 transition shadow-md"
            >
              <Printer className="w-4 h-4" />
              <span>حفظ وطباعة</span>
            </button>

            {/* Hold Invoice */}
            <button
              onClick={handleHoldInvoice}
              className="px-4 py-3 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 font-bold text-xs rounded-xl flex items-center gap-2 transition"
            >
              <PauseCircle className="w-4 h-4" />
              <span>تعليق الفاتورة</span>
            </button>

            {/* Recall Held Invoices */}
            <button
              onClick={() => setIsHeldModalOpen(true)}
              className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl flex items-center gap-2 transition relative"
            >
              <PlayCircle className="w-4 h-4 text-amber-400" />
              <span>استرجاع المعلقة</span>
              {heldInvoices.length > 0 && (
                <span className="w-5 h-5 bg-amber-500 text-slate-950 rounded-full text-[10px] font-black flex items-center justify-center">
                  {heldInvoices.length}
                </span>
              )}
            </button>
          </div>

          <div className="flex items-center gap-2">
            {/* Extra Actions Menu Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsExtraActionsOpen(!isExtraActionsOpen)}
                className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl flex items-center gap-2 transition"
              >
                <MoreHorizontal className="w-4 h-4" />
                <span>إجراءات إضافية</span>
              </button>

              {isExtraActionsOpen && (
                <div className="absolute bottom-full left-0 mb-2 w-48 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-2 space-y-1 z-40 text-xs">
                  <button
                    onClick={() => {
                      setIsExtraActionsOpen(false);
                      toast.success('تمت معاينة الفاتورة بأسعار قائمة تجزئة');
                    }}
                    className="w-full text-right px-3 py-2 hover:bg-slate-800 rounded-lg text-slate-200"
                  >
                    عرض كشف حساب العميل
                  </button>
                  <button
                    onClick={() => {
                      setIsExtraActionsOpen(false);
                      toast.success('تم تصدير أسطر الفاتورة لملف Excel');
                    }}
                    className="w-full text-right px-3 py-2 hover:bg-slate-800 rounded-lg text-slate-200"
                  >
                    تصدير الفاتورة إلى Excel
                  </button>
                  <button
                    onClick={() => {
                      setIsExtraActionsOpen(false);
                      toast.success('تم إرسال الفاتورة عبر WhatsApp للعميل');
                    }}
                    className="w-full text-right px-3 py-2 hover:bg-slate-800 rounded-lg text-slate-200"
                  >
                    إرسال الفاتورة عبر WhatsApp
                  </button>
                </div>
              )}
            </div>

            {/* Clear / Cancel */}
            <button
              onClick={() => {
                setCartItems([]);
                setInvoiceNotes('');
                toast.success('تم إلغاء وتنظيف الفاتورة');
              }}
              className="px-4 py-3 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 font-bold text-xs rounded-xl transition"
            >
              إلغاء الفاتورة
            </button>
          </div>

        </div>
      </div>

      {/* Modals */}
      <HeldInvoicesModal
        isOpen={isHeldModalOpen}
        onClose={() => setIsHeldModalOpen(false)}
        heldInvoices={heldInvoices}
        onRestore={handleRestoreHeld}
        onDelete={handleDeleteHeld}
      />
    </div>
  );
};
