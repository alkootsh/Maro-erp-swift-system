import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  ShoppingCart, Barcode, Search, Plus, Minus, Trash2, User, 
  DollarSign, CreditCard, Layers, PauseCircle, PlayCircle, Printer, 
  RotateCcw, CheckCircle2, X, Calculator, ShieldCheck, Zap, 
  Clock, Hash, Building2, ChevronRight, Tag, HelpCircle, Keyboard, Sparkles
} from 'lucide-react';
import { ProductMaster } from '../../types/productMaster';
import { Customer, SalesInvoice } from '../../types/sprint8';
import { ProductRepository } from '../../repositories/productRepository';
import { CustomerRepository } from '../../repositories/customerRepository';
import { SalesRepository } from '../../repositories/salesRepository';
import { formatCurrency, formatDate, playSystemChime, cn } from '../../lib/utils';
import { printSalesInvoice } from '../../lib/invoicePrinter';
import { ShiftZReportModal } from './ShiftZReportModal';
import { HeldInvoicesModal, HeldInvoice } from '../wholesale/HeldInvoicesModal';
import { toast } from 'react-hot-toast';

export interface FastPosViewProps {
  onSwitchMode?: (mode: 'WHOLESALE' | 'POS') => void;
}

export const FastPosView: React.FC<FastPosViewProps> = ({ onSwitchMode }) => {
  // Master Data
  const [products, setProducts] = useState<ProductMaster[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [categories, setCategories] = useState<string[]>(['الكل']);

  // POS State
  const [selectedCategory, setSelectedCategory] = useState('الكل');
  const [searchQuery, setSearchQuery] = useState('');
  const [barcodeInput, setBarcodeInput] = useState('');
  const barcodeRef = useRef<HTMLInputElement>(null);

  // Active Cart
  const [cart, setCart] = useState<Array<{
    id: string;
    product: ProductMaster;
    quantity: number;
    unitPrice: number;
    discountPercent: number;
    lineTotal: number;
  }>>([]);

  // Active Customer
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  // Payment Drawer & Payment Options
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentType, setPaymentType] = useState<'CASH' | 'CARD' | 'SPLIT' | 'CREDIT'>('CASH');
  const [cashTendered, setCashTendered] = useState<number>(0);
  const [cardTendered, setCardTendered] = useState<number>(0);
  const [discountAmount, setDiscountAmount] = useState<number>(0);

  // Return Mode
  const [isReturnMode, setIsReturnMode] = useState(false);

  // Shift & Z-Report
  const [isZReportOpen, setIsZReportOpen] = useState(false);
  const [shiftStats, setShiftStats] = useState({
    cashierName: 'الكاشير محمود السمان',
    terminalId: 'POS-TERM-01',
    startTime: new Date().toISOString(),
    openingFloat: 500,
    cashSales: 3450,
    cardSales: 1200,
    creditSales: 0,
    returnsTotal: 150,
    invoicesCount: 18
  });

  // Held Invoices
  const [heldInvoices, setHeldInvoices] = useState<HeldInvoice[]>(() => {
    try {
      const saved = localStorage.getItem('maro_held_pos_invoices');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [isHeldModalOpen, setIsHeldModalOpen] = useState(false);

  // Load Initial Data & Focus
  useEffect(() => {
    const prods = ProductRepository.getProducts();
    const custs = CustomerRepository.getCustomers();
    setProducts(prods);
    setCustomers(custs);

    const cats = ['الكل', ...Array.from(new Set(prods.map(p => p.categoryName || 'مواد غذائية')))];
    setCategories(cats);

    if (custs.length > 0) {
      setSelectedCustomer(custs[0]);
    }

    // Keep focus on barcode input
    const focusInterval = setInterval(() => {
      if (document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        barcodeRef.current?.focus();
      }
    }, 1500);

    return () => clearInterval(focusInterval);
  }, []);

  // Keyboard Shortcuts Handler (F1-F12)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F1') {
        e.preventDefault();
        handleNewSale();
      } else if (e.key === 'F2') {
        e.preventDefault();
        barcodeRef.current?.focus();
      } else if (e.key === 'F5') {
        e.preventDefault();
        if (cart.length > 0) {
          setPaymentType('CASH');
          setIsPaymentModalOpen(true);
        }
      } else if (e.key === 'F6') {
        e.preventDefault();
        if (cart.length > 0) {
          setPaymentType('CARD');
          setIsPaymentModalOpen(true);
        }
      } else if (e.key === 'F7') {
        e.preventDefault();
        handleHoldInvoice();
      } else if (e.key === 'F8') {
        e.preventDefault();
        setIsHeldModalOpen(true);
      } else if (e.key === 'F12') {
        e.preventDefault();
        setIsZReportOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cart]);

  // Totals Calculation
  const totals = useMemo(() => {
    let subtotal = 0;
    cart.forEach(item => {
      subtotal += item.quantity * item.unitPrice * (1 - item.discountPercent / 100);
    });

    const taxAmount = subtotal * 0.14; // 14% VAT
    const totalAfterDiscount = Math.max(0, subtotal + taxAmount - discountAmount);
    const grandTotal = isReturnMode ? -totalAfterDiscount : totalAfterDiscount;
    const changeDue = Math.max(0, cashTendered - grandTotal);

    return {
      subtotal,
      taxAmount,
      grandTotal,
      changeDue
    };
  }, [cart, discountAmount, cashTendered, isReturnMode]);

  // Filtered Products for Touch Grid
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchCat = selectedCategory === 'الكل' || p.categoryName === selectedCategory;
      const q = searchQuery.toLowerCase();
      const matchQuery = !q || p.name.toLowerCase().includes(q) || p.sku?.toLowerCase().includes(q) || p.barcode?.toLowerCase().includes(q);
      return matchCat && matchQuery;
    });
  }, [products, selectedCategory, searchQuery]);

  // Barcode Submit
  const handleBarcodeSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!barcodeInput.trim()) return;

    const query = barcodeInput.trim().toLowerCase();
    const foundProduct = products.find(p => 
      p.barcode?.toLowerCase() === query || 
      p.sku?.toLowerCase() === query ||
      p.name?.toLowerCase().includes(query)
    );

    if (foundProduct) {
      addToCart(foundProduct);
      setBarcodeInput('');
      playSystemChime('success');
    } else {
      playSystemChime('warning');
      toast.error('صنف غير موجود بقاعدة بيانات الكاشير');
    }
  };

  // Add Item to Cart
  const addToCart = (product: ProductMaster) => {
    setCart(prev => {
      const existingIdx = prev.findIndex(item => item.product.id === product.id);
      if (existingIdx >= 0) {
        const copy = [...prev];
        const current = copy[existingIdx];
        const newQty = current.quantity + 1;
        copy[existingIdx] = {
          ...current,
          quantity: newQty,
          lineTotal: newQty * current.unitPrice * (1 - current.discountPercent / 100) * 1.14
        };
        return copy;
      } else {
        const unitPrice = product.retailPrice || product.wholesalePrice || 10;
        return [...prev, {
          id: `pos_line_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
          product,
          quantity: 1,
          unitPrice,
          discountPercent: 0,
          lineTotal: unitPrice * 1.14
        }];
      }
    });
  };

  const updateCartQty = (idx: number, delta: number) => {
    setCart(prev => {
      const copy = [...prev];
      const item = { ...copy[idx] };
      const newQty = Math.max(1, item.quantity + delta);
      item.quantity = newQty;
      item.lineTotal = newQty * item.unitPrice * (1 - item.discountPercent / 100) * 1.14;
      copy[idx] = item;
      return copy;
    });
  };

  const removeCartItem = (idx: number) => {
    setCart(prev => prev.filter((_, i) => i !== idx));
    playSystemChime('warning');
  };

  const handleNewSale = () => {
    setCart([]);
    setDiscountAmount(0);
    setCashTendered(0);
    setIsReturnMode(false);
    toast.success('تم فتح عملية بيع جديدة');
  };

  // Hold Invoice
  const handleHoldInvoice = () => {
    if (cart.length === 0) {
      toast.error('السلة فارغة');
      return;
    }

    const heldItem: HeldInvoice = {
      id: `held_pos_${Date.now()}`,
      heldAt: new Date().toISOString(),
      type: 'POS',
      customerName: selectedCustomer?.name || 'عميل نقدي',
      itemsCount: cart.length,
      grandTotal: totals.grandTotal,
      cartData: cart,
      customerData: selectedCustomer
    };

    const updated = [heldItem, ...heldInvoices];
    setHeldInvoices(updated);
    localStorage.setItem('maro_held_pos_invoices', JSON.stringify(updated));

    setCart([]);
    playSystemChime('confirm');
    toast.success('تم تعليق العملية بنجاح');
  };

  const handleRestoreHeld = (held: HeldInvoice) => {
    setCart(held.cartData || []);
    if (held.customerData) setSelectedCustomer(held.customerData);
    setHeldInvoices(prev => {
      const next = prev.filter(h => h.id !== held.id);
      localStorage.setItem('maro_held_pos_invoices', JSON.stringify(next));
      return next;
    });
    setIsHeldModalOpen(false);
    playSystemChime('success');
    toast.success('تمت استعادة الفاتورة المعلقة');
  };

  // Process POS Transaction
  const handleCompleteSale = async (printReceipt = true) => {
    if (cart.length === 0) {
      toast.error('السلة فارغة');
      return;
    }

    try {
      const invoiceData = {
        type: 'POS' as const,
        customerId: selectedCustomer?.id || 'cust_cash_default',
        customerName: selectedCustomer?.name || 'عميل كاشير نقدي',
        warehouseId: 'WH-MAIN',
        salesRepName: 'الكاشير محمود السمان',
        paymentMethod: paymentType,
        notes: isReturnMode ? 'مرتجع مبيعات POS' : 'عملية بيع سريعة POS',
        paidAmount: totals.grandTotal,
        items: cart.map(item => ({
          productId: item.product.id,
          productName: item.product.name,
          sku: item.product.sku || 'SKU',
          quantity: isReturnMode ? -item.quantity : item.quantity,
          unitName: 'قطعة',
          unitPrice: item.unitPrice,
          costPrice: item.product.costPrice || item.unitPrice * 0.7,
          discountPercent: item.discountPercent,
          taxRate: 14,
          lineTotal: item.lineTotal
        }))
      };

      const createdInvoice = await SalesRepository.createInvoice(invoiceData);
      playSystemChime('success');
      toast.success(`تم إتمام البيع بنجاح! رقم الإيصال: ${createdInvoice.invoiceNumber}`);

      // Update shift stats
      setShiftStats(prev => ({
        ...prev,
        invoicesCount: prev.invoicesCount + 1,
        cashSales: paymentType === 'CASH' ? prev.cashSales + totals.grandTotal : prev.cashSales,
        cardSales: paymentType === 'CARD' ? prev.cardSales + totals.grandTotal : prev.cardSales
      }));

      if (printReceipt) {
        printSalesInvoice(createdInvoice);
      }

      // Reset
      setIsPaymentModalOpen(false);
      handleNewSale();
    } catch (err: any) {
      console.error('POS transaction error:', err);
      toast.error(`فشل إتمام البيع: ${err.message || 'خطأ في النظام'}`);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#070b13] text-slate-100 font-sans select-none" dir="rtl">
      
      {/* Top Header Bar */}
      <div className="bg-[#0f172a] border-b border-slate-800 px-4 py-2.5 flex items-center justify-between gap-3 sticky top-0 z-30 shadow-lg">
        
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-tr from-amber-500 to-orange-500 rounded-xl text-slate-950 shadow-lg shadow-amber-500/20">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-black text-white tracking-wide">البيع السريع — Fast POS</h1>
              <span className="px-2 py-0.5 text-[9px] font-extrabold rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                Ultra-Fast Touch & Barcode
              </span>
            </div>
            <p className="text-[11px] text-slate-400">محطة الكاشير فائقة السرعة مع دعم الاختصارات والماسح الضوئي</p>
          </div>
        </div>

        {/* Shortcuts Bar */}
        <div className="hidden lg:flex items-center gap-2 bg-slate-900/90 border border-slate-800 rounded-xl px-3 py-1.5 text-[10px] text-slate-300 font-mono">
          <span><strong className="text-amber-400">F1:</strong> جديد</span>
          <span className="text-slate-700">|</span>
          <span><strong className="text-amber-400">F2:</strong> بحث</span>
          <span className="text-slate-700">|</span>
          <span><strong className="text-amber-400">F5:</strong> كاش</span>
          <span className="text-slate-700">|</span>
          <span><strong className="text-amber-400">F6:</strong> فيزا</span>
          <span className="text-slate-700">|</span>
          <span><strong className="text-amber-400">F7:</strong> تعليق</span>
          <span className="text-slate-700">|</span>
          <span><strong className="text-amber-400">F12:</strong> Z-Report</span>
        </div>

        {/* Actions & Switcher */}
        <div className="flex items-center gap-2">
          {/* Z-Report Shift Button */}
          <button
            onClick={() => setIsZReportOpen(true)}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-bold flex items-center gap-1.5 transition"
          >
            <Calculator className="w-4 h-4" />
            <span>Z-Report التقفيل</span>
          </button>

          {/* Mode Switcher */}
          {onSwitchMode && (
            <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-800">
              <button
                onClick={() => onSwitchMode('WHOLESALE')}
                className="px-3 py-1 rounded-lg text-xs font-bold text-slate-400 hover:text-white transition-all"
              >
                فواتير الجملة
              </button>
              <button
                onClick={() => onSwitchMode('POS')}
                className="px-3 py-1 rounded-lg text-xs font-bold bg-amber-500 text-slate-950 shadow-md transition-all"
              >
                البيع السريع (POS)
              </button>
            </div>
          )}
        </div>

      </div>

      {/* Main POS Interface (2 Columns: Left Grid, Right Cart) */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 p-3 sm:p-4 max-w-[1800px] mx-auto w-full items-stretch">
        
        {/* Left Side: Touch Product Catalog & Categories (7 Cols) */}
        <div className="lg:col-span-7 flex flex-col gap-3">
          
          {/* Search Bar & Barcode Focus Receiver */}
          <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-3 shadow-lg flex items-center gap-3">
            <form onSubmit={handleBarcodeSubmit} className="flex-1 relative">
              <Barcode className="w-5 h-5 absolute right-3.5 top-2.5 text-amber-400" />
              <input
                ref={barcodeRef}
                type="text"
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value)}
                placeholder="امسح الباركود أو ابحث..."
                className="w-full bg-slate-900 border border-slate-700 focus:border-amber-500 rounded-xl pr-11 pl-4 py-2 text-xs font-bold text-white focus:outline-none font-mono"
              />
            </form>

            <div className="w-48 relative">
              <Search className="w-4 h-4 absolute right-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="تصفية بالاسم..."
                className="w-full bg-slate-900 border border-slate-700 rounded-xl pr-9 pl-3 py-2 text-xs text-slate-200 focus:outline-none"
              />
            </div>
          </div>

          {/* Category Pills Bar */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition shadow-sm ${
                  selectedCategory === cat 
                    ? 'bg-amber-500 text-slate-950 shadow-amber-500/20' 
                    : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Touch Grid Items */}
          <div className="flex-1 bg-[#0f172a]/80 border border-slate-800 rounded-2xl p-3 shadow-xl overflow-y-auto max-h-[calc(100vh-220px)] grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
            {filteredProducts.map(product => (
              <button
                key={product.id}
                onClick={() => addToCart(product)}
                className="bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 hover:border-amber-500/50 rounded-xl p-3 text-right flex flex-col justify-between transition active:scale-95 group min-h-[100px]"
              >
                <div>
                  <span className="text-[10px] text-amber-400/80 font-mono block">SKU: {product.sku || 'N/A'}</span>
                  <h4 className="text-xs font-bold text-white group-hover:text-amber-300 transition line-clamp-2 mt-0.5">
                    {product.name}
                  </h4>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-700/40 mt-2">
                  <span className="text-[10px] text-slate-400">قطعة</span>
                  <span className="text-xs font-extrabold text-emerald-400 font-mono">
                    {formatCurrency(product.retailPrice || product.wholesalePrice || 0)}
                  </span>
                </div>
              </button>
            ))}
          </div>

        </div>

        {/* Right Side: Active Cart & Cashier Controls (5 Cols) */}
        <div className="lg:col-span-5 bg-[#0f172a] border border-slate-800 rounded-2xl p-4 shadow-2xl flex flex-col justify-between gap-3">
          
          {/* Cart Header */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-amber-400" />
              <h3 className="text-sm font-bold text-white">سلة المشتريات ({cart.length})</h3>
              {isReturnMode && (
                <span className="px-2 py-0.5 text-[10px] bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded font-bold">
                  وضع المرتجع
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsReturnMode(!isReturnMode)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                  isReturnMode ? 'bg-rose-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>مرتجع</span>
              </button>

              <button
                onClick={handleNewSale}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-bold transition"
              >
                مسح
              </button>
            </div>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto space-y-2 max-h-[340px] pr-1">
            {cart.length === 0 ? (
              <div className="text-center py-16 text-slate-500">
                <ShoppingCart className="w-10 h-10 mx-auto mb-2 opacity-20 text-slate-400" />
                <p className="text-xs font-semibold">السلة فارغة</p>
                <p className="text-[10px] text-slate-600">امسح الباركود أو انقر على منتج لإضافته</p>
              </div>
            ) : (
              cart.map((item, idx) => (
                <div key={item.id} className="bg-slate-800/50 border border-slate-700/60 rounded-xl p-2.5 flex items-center justify-between gap-3">
                  <div className="flex-1 truncate">
                    <h5 className="text-xs font-bold text-white truncate">{item.product.name}</h5>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {formatCurrency(item.unitPrice)} × {item.quantity}
                    </span>
                  </div>

                  {/* Quantity Touch Buttons */}
                  <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-lg border border-slate-700">
                    <button
                      onClick={() => updateCartQty(idx, -1)}
                      className="p-1 hover:bg-slate-800 text-slate-300 rounded transition"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-xs font-extrabold text-amber-300 w-6 text-center font-mono">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateCartQty(idx, 1)}
                      className="p-1 hover:bg-slate-800 text-slate-300 rounded transition"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <span className="text-xs font-extrabold text-emerald-400 font-mono w-20 text-left">
                    {formatCurrency(item.lineTotal)}
                  </span>

                  <button
                    onClick={() => removeCartItem(idx)}
                    className="p-1 text-slate-500 hover:text-rose-400 transition"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Totals Summary */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 space-y-1.5 text-xs">
            <div className="flex justify-between text-slate-400">
              <span>المجموع الفرعي:</span>
              <span className="font-mono text-slate-200">{totals.subtotal.toFixed(2)} ج.م</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>ضريبة القيمة المضافة (14%):</span>
              <span className="font-mono text-blue-400">+{totals.taxAmount.toFixed(2)} ج.م</span>
            </div>
            <hr className="border-slate-800 my-1" />
            <div className="flex justify-between items-center text-base font-black text-white">
              <span>الإجمالي النهائي:</span>
              <span className="font-mono text-xl text-emerald-400">{formatCurrency(totals.grandTotal)}</span>
            </div>
          </div>

          {/* Quick Pay Buttons Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button
              onClick={() => {
                setPaymentType('CASH');
                setIsPaymentModalOpen(true);
              }}
              disabled={cart.length === 0}
              className="py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-extrabold text-xs rounded-xl flex flex-col items-center justify-center gap-1 transition shadow-lg shadow-emerald-600/20"
            >
              <DollarSign className="w-4 h-4" />
              <span>دفع كاش (F5)</span>
            </button>

            <button
              onClick={() => {
                setPaymentType('CARD');
                setIsPaymentModalOpen(true);
              }}
              disabled={cart.length === 0}
              className="py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white font-extrabold text-xs rounded-xl flex flex-col items-center justify-center gap-1 transition shadow-lg shadow-blue-600/20"
            >
              <CreditCard className="w-4 h-4" />
              <span>دفع فيزا (F6)</span>
            </button>

            <button
              onClick={handleHoldInvoice}
              disabled={cart.length === 0}
              className="py-3 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 disabled:opacity-40 font-bold text-xs rounded-xl flex flex-col items-center justify-center gap-1 transition"
            >
              <PauseCircle className="w-4 h-4" />
              <span>تعليق (F7)</span>
            </button>

            <button
              onClick={() => setIsHeldModalOpen(true)}
              className="py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl flex flex-col items-center justify-center gap-1 transition relative"
            >
              <PlayCircle className="w-4 h-4 text-amber-400" />
              <span>المعلقة ({heldInvoices.length})</span>
            </button>
          </div>

        </div>

      </div>

      {/* Payment Settlement Modal */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" dir="rtl">
          <div className="bg-[#0f172a] border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 bg-slate-800/90 border-b border-slate-700">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-emerald-400" />
                <span>إتمام عملية البيع النقدي السريع</span>
              </h3>
              <button onClick={() => setIsPaymentModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="text-center py-2 bg-slate-900 border border-slate-800 rounded-xl">
                <span className="text-xs text-slate-400 block">المبلغ المطلوب سداده</span>
                <span className="text-3xl font-black text-emerald-400 font-mono">{formatCurrency(totals.grandTotal)}</span>
              </div>

              {/* Quick Preset Buttons */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">أزرار النقدية السريعة:</label>
                <div className="grid grid-cols-4 gap-2">
                  {[totals.grandTotal, 50, 100, 200].map((amt, i) => (
                    <button
                      key={i}
                      onClick={() => setCashTendered(amt)}
                      className="py-2 bg-slate-800 hover:bg-slate-700 text-amber-300 font-mono text-xs font-bold rounded-lg border border-slate-700 transition"
                    >
                      {amt === totals.grandTotal ? 'المبلغ بالضبط' : `${amt} ج.م`}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">المبلغ المستلم من العميل:</label>
                <input
                  type="number"
                  value={cashTendered || ''}
                  onChange={(e) => setCashTendered(parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xl font-bold font-mono text-white text-left focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  autoFocus
                />
              </div>

              {cashTendered > 0 && (
                <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 flex justify-between items-center text-xs font-bold">
                  <span className="text-slate-300">المتبقي للعميل (الباقي):</span>
                  <span className="text-lg font-mono text-amber-400">{formatCurrency(totals.changeDue)}</span>
                </div>
              )}
            </div>

            <div className="px-6 py-4 bg-slate-900 border-t border-slate-800 flex items-center justify-end gap-3">
              <button
                onClick={() => setIsPaymentModalOpen(false)}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
              >
                إلغاء
              </button>
              <button
                onClick={() => handleCompleteSale(true)}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-emerald-600/20"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>إتمام وطباعة الإيصال</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <ShiftZReportModal
        isOpen={isZReportOpen}
        onClose={() => setIsZReportOpen(false)}
        shiftData={shiftStats}
        onCloseShiftConfirm={(details) => {
          console.log('Shift closed:', details);
        }}
      />

      <HeldInvoicesModal
        isOpen={isHeldModalOpen}
        onClose={() => setIsHeldModalOpen(false)}
        heldInvoices={heldInvoices}
        onRestore={handleRestoreHeld}
        onDelete={(id) => {
          setHeldInvoices(prev => {
            const next = prev.filter(h => h.id !== id);
            localStorage.setItem('maro_held_pos_invoices', JSON.stringify(next));
            return next;
          });
          toast.success('تم حذف العملية المعلقة');
        }}
      />

    </div>
  );
};
