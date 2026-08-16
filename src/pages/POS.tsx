/**
 * @file POS.tsx
 * @module POS Terminal
 * @description شاشة نقطة البيع الرئيسية (Core POS Terminal). المسؤولة عن عمليات البيع المباشر، التعامل مع الباركود، الطابعات، وإدارة سلة المشتريات.
 */
import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  ShoppingCart, 
  User, 
  Plus, 
  Minus, 
  Trash2, 
  X, 
  Barcode, 
  Power, 
  Lock,
  Calculator,
  PauseCircle,
  PlayCircle,
  Percent,
  Tag,
  MessageSquare,
  BarChart2,
  Printer,
  Unlock,
  CheckCircle2,
  FileText,
  PackageCheck,
  Scale,
  Puzzle,
  Edit3,
  RotateCcw,
  Clock,
  DollarSign,
  Hash,
  Layers,
  Archive,
  Award,
  Gift,
  Ticket,
  ListFilter,
  Info,
  HelpCircle,
  Keyboard,
  CreditCard
} from 'lucide-react';
import { ProductMaster } from '../types/productMaster';
import { POSSession, SalesInvoice, Customer } from '../types/sprint8';
import { FunctionKey, POSKeyMapping, POSActionDefinition } from '../types/posKeys';
import { POSRepository } from '../repositories/posRepository';
import { ProductRepository } from '../repositories/productRepository';
import { CustomerRepository } from '../repositories/customerRepository';
import { POSKeyRepository } from '../repositories/posKeyRepository';
import { PosActionRegistry } from '../lib/posActionRegistry';
import { IndustryModuleEngine } from '../lib/industryModuleEngine';
import { OpenPOSSessionCommand, ClosePOSSessionCommand, ProcessPOSTransactionCommand } from '../cqrs/commands';
import { MaroSyncEngine } from '../lib/maroSyncEngine';
import { MaroEventBus } from '../lib/eventBus';
import { formatCurrency, cn, playSystemChime } from '../lib/utils';
import { toast } from 'react-hot-toast';
import { BarcodeScanner } from '../components/BarcodeScanner';
import { printSalesInvoice } from '../lib/invoicePrinter';
import { usbScannerEngine } from '../services/usbScannerEngine';
import { USBScannerBadge, USBScannerModal } from '../components/USBBarcodeScannerManager';
import { FunctionKeyBar } from '../components/common/FunctionKeyBar';
import { handleSmartKeyDown, getNumericInputProps, handleInputFocus } from '../lib/smartKeyboardEngine';
import { POSStockInquiryModal } from '../components/POSStockInquiryModal';

const CATEGORIES = ['الكل', 'مواد غذائية', 'مشروبات', 'خضروات وفواكه', 'لحوم ودواجن', 'ألبان وأجبان', 'عناية شخصية', 'مواد تنظيف'];

// Icon Map for Function Keys Bar
const ICON_COMPONENTS: { [key: string]: any } = {
  PlusCircle: Plus,
  PauseCircle,
  PlayCircle,
  Archive,
  Clock,
  RotateCcw,
  Repeat: RotateCcw,
  Trash2,
  XCircle: X,
  Search,
  Barcode,
  Hash,
  DollarSign,
  Percent,
  Tag,
  Layers,
  Edit3,
  MinusCircle: Minus,
  Scale,
  QrCode: Barcode,
  Boxes: PackageCheck,
  Banknote: DollarSign,
  CreditCard: User,
  Split: Layers,
  UserCheck: User,
  FileText,
  Award,
  Gift,
  Ticket,
  Warehouse: PackageCheck,
  ListFilter,
  PackageCheck,
  Info,
  HelpCircle,
  Lock,
  BarChart2,
  Printer,
  Unlock,
  Copy: Printer,
  Calculator,
  MessageSquare,
  Puzzle
};

export const POS: React.FC = () => {
  const [products, setProducts] = useState<ProductMaster[]>([]);
  const [activeSession, setActiveSession] = useState<POSSession | null>(null);
  const [cart, setCart] = useState<{ product: ProductMaster; quantity: number; unitPrice: number; discount: number }[]>(() => {
    try {
      const saved = localStorage.getItem('maro_pos_draft_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [selectedCartIndex, setSelectedCartIndex] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('الكل');
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [barcodeBuffer, setBarcodeBuffer] = useState('');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(() => {
    try {
      const saved = localStorage.getItem('maro_pos_draft_customer');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Auto-save draft effect
  useEffect(() => {
    localStorage.setItem('maro_pos_draft_cart', JSON.stringify(cart));
    if (selectedCustomer) {
      localStorage.setItem('maro_pos_draft_customer', JSON.stringify(selectedCustomer));
    } else {
      localStorage.removeItem('maro_pos_draft_customer');
    }
  }, [cart, selectedCustomer]);
  
  // Key Mappings & Actions Registry State
  const [keyMappings, setKeyMappings] = useState<POSKeyMapping>(POSKeyRepository.getKeyMappings());
  const [actions, setActions] = useState<POSActionDefinition[]>(PosActionRegistry.getActions());

  // Modal States
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isOpenSessionModalOpen, setIsOpenSessionModalOpen] = useState(false);
  const [isCloseSessionModalOpen, setIsCloseSessionModalOpen] = useState(false);
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);
  const [isResumeModalOpen, setIsResumeModalOpen] = useState(false);
  const [isQtyModalOpen, setIsQtyModalOpen] = useState(false);
  const [isDiscountModalOpen, setIsDiscountModalOpen] = useState(false);
  const [isNotesModalOpen, setIsNotesModalOpen] = useState(false);
  const [isXReportModalOpen, setIsXReportModalOpen] = useState(false);
  const [isStockInquiryOpen, setIsStockInquiryOpen] = useState(false);
  const [isUSBManagerOpen, setIsUSBManagerOpen] = useState(false);

  // Form Inputs
  const [openingFloat, setOpeningFloat] = useState<number>(500);
  const [closingCashCount, setClosingCashCount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'CARD' | 'CREDIT' | 'SPLIT'>('CASH');
  const [paidAmount, setPaidAmount] = useState<string>('');
  const [invoiceNotes, setInvoiceNotes] = useState('');
  const [qtyInput, setQtyInput] = useState<string>('1');
  const [discountPercentInput, setDiscountPercentInput] = useState<string>('0');
  const [calcInput, setCalcInput] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [lastReceipt, setLastReceipt] = useState<SalesInvoice | null>(null);

  // Parked/Held Invoices State
  const [heldInvoices, setHeldInvoices] = useState<{ id: string; customerName: string; items: any[]; total: number; time: string }[]>([]);

  const [layoutMode, setLayoutMode] = useState<'compact' | 'advanced'>(
    localStorage.getItem('maro_business_size') === 'small' ? 'compact' : 'advanced'
  );

  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Initial load
    setProducts(ProductRepository.getProducts());
    setCustomers(CustomerRepository.getCustomers());
    setActiveSession(POSRepository.getActiveSession('term_01'));
    setKeyMappings(POSKeyRepository.getKeyMappings());
    setActions(PosActionRegistry.getActions());

    // Subscriptions
    const unsubProds = MaroSyncEngine.subscribe<ProductMaster>('products', (data) => setProducts(data || []));
    const unsubSessions = MaroSyncEngine.subscribe<POSSession>('pos_sessions', () => setActiveSession(POSRepository.getActiveSession('term_01')));
    const unsubKeys = MaroSyncEngine.subscribe('pos_function_keys', () => setKeyMappings(POSKeyRepository.getKeyMappings()));
    const unsubRegistry = PosActionRegistry.subscribe(() => setActions(PosActionRegistry.getActions()));
    const unsubRxTransfer = MaroEventBus.subscribe('TRANSFER_RX_TO_POS', (payload: any) => {
      const isPharmActive = IndustryModuleEngine.getActiveModules().some(m => m.id === 'PHARMACY_MEDICAL');
      if (!isPharmActive) return;
      if (payload && payload.items) {
        payload.items.forEach((rxItem: any) => {
          const foundProd = products.find(p => p.name.includes(rxItem.name) || p.barcode === rxItem.barcode);
          if (foundProd) {
            addToCart(foundProd, rxItem.quantity || 1);
          } else {
            // Add virtual or custom cart item
            setCart(prev => [...prev, {
              product: {
                id: 'rx_' + Math.random(),
                name: rxItem.name,
                sku: 'RX-ITEM',
                barcode: rxItem.barcode || '622000',
                salePrice: rxItem.price || 50,
                costPrice: (rxItem.price || 50) * 0.7,
                stock: 100,
                category: 'أدوية روشتات',
                unit: 'علبة'
              } as unknown as ProductMaster,
              quantity: rxItem.quantity || 1,
              unitPrice: rxItem.price || 50,
              discount: 0
            }]);
          }
        });
        showToast('تم استيراد روشتة الوكيل الصيدلاني وإضافتها للسلة بنجاح!');
      }
    });

    return () => {
      unsubProds();
      unsubSessions();
      unsubKeys();
      unsubRegistry();
      unsubRxTransfer();
    };
  }, []);

  // USB/Bluetooth Barcode Scanner Hardware Listener
  useEffect(() => {
    const unsubUSB = usbScannerEngine.subscribe((parsedResult, rawCode) => {
      if (parsedResult.product) {
        addToCart(parsedResult.product, parsedResult.quantity);
        setSearchQuery('');
        showToast(`تم مسح الباركود بنجاح: ${parsedResult.product.name} (${parsedResult.quantity} قطعة/كجم)`);
      } else {
        showToast(`باركود غير مسجل بالمنظومة: ${rawCode}`);
      }
    });
    return () => unsubUSB();
  }, [products]);

  // Global Function Key & Hardware Scanner Keyboard Handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Catch F1 through F12 function keys
      if (e.key.startsWith('F') && /^F(1[0-2]|[1-9])$/.test(e.key)) {
        e.preventDefault(); // Prevent browser default F-key behaviors (F1 help, F3 find, F5 refresh, etc.)
        const funcKey = e.key as FunctionKey;
        const actionId = keyMappings[funcKey];
        if (actionId) {
          executePOSAction(actionId);
        }
        return;
      }

      // Scanner buffer listener
      if (e.key === 'Enter') {
        if (barcodeBuffer.length >= 3) {
          handleScanBarcode(barcodeBuffer);
        }
        setBarcodeBuffer('');
      } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && document.activeElement?.tagName !== 'INPUT') {
        setBarcodeBuffer(prev => prev + e.key);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [keyMappings, barcodeBuffer, products, cart, selectedCartIndex, activeSession, heldInvoices]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Execute POS Action by ID
  const executePOSAction = (actionId: string) => {
    switch (actionId) {
      case 'NEW_INVOICE':
        if (cart.length > 0 && window.confirm('هل تريد إلغاء الفاتورة الحالية والبدء بشرائح جديدة؟')) {
          setCart([]);
          setSelectedCustomer(null);
          setInvoiceNotes('');
          showToast('تم فتح فاتورة بيع جديدة');
        } else if (cart.length === 0) {
          showToast('الشاشة جاهزة للبيع الجديد');
        }
        break;

      case 'HOLD_INVOICE':
      case 'SUSPEND_SALE':
      case 'PARK_SALE':
        if (cart.length === 0) {
          showToast('السلة فارغة، لا توجد بنود لتعليق الفاتورة');
          return;
        }
        const newHeld = {
          id: `HOLD_${Date.now()}`,
          customerName: selectedCustomer?.name || 'عميل نقدي',
          items: [...cart],
          total: cart.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0) * 1.14,
          time: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
        };
        setHeldInvoices(prev => [newHeld, ...prev]);
        setCart([]);
        setSelectedCustomer(null);
        showToast('تم تعليق الفاتورة بنجاح. يمكنك استرجاعها عبر (F6/استرجاع)');
        break;

      case 'RESUME_INVOICE':
        setIsResumeModalOpen(true);
        break;

      case 'CUSTOMER_SEARCH':
        setIsCustomerModalOpen(true);
        break;

      case 'PRODUCT_SEARCH':
      case 'MANUAL_BARCODE':
        if (searchInputRef.current) {
          searchInputRef.current.focus();
        } else {
          setIsScannerOpen(true);
        }
        break;

      case 'CHANGE_QTY':
        if (cart.length === 0) {
          showToast('يرجى إضافة أصناف للسلة أولاً للتعديل');
          return;
        }
        const targetIdx = selectedCartIndex !== null ? selectedCartIndex : cart.length - 1;
        setQtyInput(cart[targetIdx].quantity.toString());
        setSelectedCartIndex(targetIdx);
        setIsQtyModalOpen(true);
        break;

      case 'DISCOUNT_PERCENT':
      case 'DISCOUNT_VALUE':
        if (cart.length === 0) {
          showToast('يرجى إضافة أصناف للسلة أولاً لإضافة الخصم');
          return;
        }
        setIsDiscountModalOpen(true);
        break;

      case 'PAYMENT_CASH':
        if (cart.length === 0) return showToast('السلة فارغة');
        setPaymentMethod('CASH');
        setIsPaymentModalOpen(true);
        break;

      case 'PAYMENT_CARD':
        if (cart.length === 0) return showToast('السلة فارغة');
        setPaymentMethod('CARD');
        setIsPaymentModalOpen(true);
        break;

      case 'PAYMENT_SPLIT':
        if (cart.length === 0) return showToast('السلة فارغة');
        setPaymentMethod('SPLIT');
        setIsPaymentModalOpen(true);
        break;

      case 'CLOSE_SHIFT':
        if (!activeSession) {
          showToast('لا توجد جلسة مفتوحة لإغلاقها');
          return;
        }
        setIsCloseSessionModalOpen(true);
        break;

      case 'X_REPORT':
        setIsXReportModalOpen(true);
        break;

      case 'CALCULATOR':
        setIsCalculatorOpen(true);
        break;

      case 'DELETE_INVOICE':
      case 'VOID_INVOICE':
        if (cart.length > 0) {
          setCart([]);
          showToast('تم إفراغ السلة وإلغاء العناصر');
        }
        break;

      case 'DELETE_ITEM':
        if (selectedCartIndex !== null && cart[selectedCartIndex]) {
          removeFromCart(cart[selectedCartIndex].product.id);
          setSelectedCartIndex(null);
          showToast('تم حذف الصنف المحدد من السلة');
        } else if (cart.length > 0) {
          removeFromCart(cart[cart.length - 1].product.id);
          showToast('تم حذف آخر صنف في السلة');
        }
        break;

      case 'OPEN_DRAWER':
        showToast('تم إرسال إشارة فتح الدرج الإلكتروني Cash Drawer Unlocked');
        break;

      case 'PRINT_INVOICE':
      case 'REPRINT_INVOICE':
        if (lastReceipt) {
          printSalesInvoice(lastReceipt);
        } else {
          showToast('لا توجد فاتورة سابقة لإعادة طباعتها');
        }
        break;

      case 'STOCK_INQUIRY':
      case 'PRODUCT_INQUIRY':
      case 'PRICE_CHECK':
        setIsStockInquiryOpen(true);
        break;

      case 'ADD_NOTES':
        setIsNotesModalOpen(true);
        break;

      default:
        // Check if custom plugin action
        const matchedAction = actions.find(a => a.id === actionId);
        if (matchedAction) {
          showToast(`تم تنفيذ الأمر المخصص: [${matchedAction.titleAr}]`);
        } else {
          showToast(`أمر غير معروف: ${actionId}`);
        }
        break;
    }
  };

  const handleScanBarcode = (barcode: string) => {
    const scaleData = POSRepository.decodeScaleBarcode(barcode);
    if (scaleData) {
      const prod = products.find(p => p.sku === scaleData.itemSku || p.sku.endsWith(scaleData.itemSku));
      if (prod) {
        const qty = scaleData.weightKg > 0 ? scaleData.weightKg : (scaleData.totalPrice / prod.price);
        addToCart(prod, qty);
        setSearchQuery('');
        return;
      }
    }

    const prod = products.find(p => p.sku === barcode || (p.barcodes && p.barcodes.some(b => b.code.includes(barcode))));
    if (prod) {
      addToCart(prod, 1);
      setSearchQuery('');
    } else {
      showToast(`لم يتم العثور على صنف بالباركود: ${barcode}`);
    }
  };

  const addToCart = (product: ProductMaster, qty: number = 1) => {
    setCart(prev => {
      const existingIdx = prev.findIndex(item => item.product.id === product.id);
      if (existingIdx >= 0) {
        const updated = [...prev];
        updated[existingIdx].quantity += qty;
        return updated;
      }
      return [...prev, { product, quantity: qty, unitPrice: product.price, discount: 0 }];
    });
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.product.id === productId) {
        const newQty = Math.max(0.1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  const applyDiscountToCart = (percent: number) => {
    setCart(prev => prev.map(item => ({ ...item, discount: percent })));
    setIsDiscountModalOpen(false);
    showToast(`تم تطبيق خصم ${percent}% على كافة عناصر السلة`);
  };

  const totalAmount = cart.reduce((acc, item) => {
    const itemTotal = (item.unitPrice * item.quantity);
    const discounted = itemTotal * (1 - (item.discount / 100));
    return acc + discounted;
  }, 0);
  const taxAmount = totalAmount * 0.14; // 14% VAT
  const grandTotal = totalAmount + taxAmount;

  const handleOpenSession = async () => {
    try {
      const cmd = new OpenPOSSessionCommand('term_01', 'cashier_01', 'كاشير - أحمد محمود', openingFloat);
      await cmd.execute();
      setActiveSession(POSRepository.getActiveSession('term_01'));
      setIsOpenSessionModalOpen(false);
      
      // Sound & Visual alerts
      playSystemChime('confirm');
      toast.success(
        <div className="flex flex-col text-right font-sans">
          <span className="font-black text-xs text-white">🟢 تم فتح وردية الكاشير بنجاح!</span>
          <span className="text-[10px] text-slate-400 mt-0.5">العهدة الإفتتاحية: {formatCurrency(openingFloat)}</span>
        </div>,
        { duration: 4000 }
      );
      showToast('تم فتح وردية جديدة بنجاح');
    } catch (e: any) {
      playSystemChime('error');
      toast.error(e.message || 'خطأ أثناء فتح الجلسة');
    }
  };

  const handleCloseSession = async () => {
    if (!activeSession) return;
    try {
      const cmd = new ClosePOSSessionCommand(activeSession.id, closingCashCount, 'تم إغلاق الوردية ومطابقة النقدية بالدرج');
      await cmd.execute();
      setActiveSession(null);
      setIsCloseSessionModalOpen(false);
      
      // Sound & Visual alerts
      playSystemChime('success');
      toast.success(
        <div className="flex flex-col text-right font-sans">
          <span className="font-black text-xs text-white">🔒 تم إنهاء وإقفال الوردية الحالية!</span>
          <span className="text-[10px] text-slate-400 mt-0.5">تم تصدير تقرير Z-Report بنجاح للمراجعة المالية.</span>
        </div>,
        { duration: 5000 }
      );
    } catch (e: any) {
      playSystemChime('error');
      toast.error(e.message || 'خطأ أثناء إغلاق الجلسة');
    }
  };

  const handleCheckout = async () => {
    if (!activeSession) {
      playSystemChime('warning');
      alert('يرجى فتح جلسة نقطة البيع POS أولاً');
      setIsOpenSessionModalOpen(true);
      return;
    }
    if (cart.length === 0) return;

    try {
      const paidNum = parseFloat(paidAmount) || grandTotal;
      const cmd = new ProcessPOSTransactionCommand(
        activeSession.id,
        selectedCustomer?.id,
        selectedCustomer?.name || 'عميل نقدي مباشر',
        cart.map(c => ({
          id: `pos_item_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
          productId: c.product.id,
          productName: c.product.name,
          sku: c.product.sku,
          unitName: 'قطعة',
          quantity: c.quantity,
          unitPrice: c.unitPrice,
          costPrice: c.product.costPrice || 0,
          discountPercent: c.discount,
          taxRate: 14,
          lineTotal: (c.unitPrice * c.quantity) * (1 - c.discount / 100) * 1.14
        })),
        paymentMethod,
        paidNum
      );

      const txn = await cmd.execute();
      setLastReceipt(txn);
      printSalesInvoice(txn);

      // Sound & Visual Checkout confirmation
      playSystemChime('success');
      toast.success(
        <div className="flex flex-col text-right font-sans">
          <span className="font-black text-xs text-white">🧾 تم تأكيد وحفظ فاتورة البيع!</span>
          <span className="text-[10px] text-slate-400 mt-0.5">القيمة: {formatCurrency(grandTotal)} | تم طباعة إيصال العميل.</span>
        </div>,
        { duration: 5000 }
      );

      // Reset
      setCart([]);
      setSelectedCustomer(null);
      setIsPaymentModalOpen(false);
      setPaidAmount('');
      setInvoiceNotes('');
      showToast('تمت عملية البيع وحفظ الفاتورة بنجاح');
      
      // Refresh active session
      setActiveSession(POSRepository.getActiveSession('term_01'));
    } catch (e: any) {
      playSystemChime('error');
      toast.error(e.message || 'حدث خطأ أثناء تنفيذ عملية البيع');
    }
  };

  const filteredProducts = products.filter(p => {
    const matchesCat = selectedCategory === 'الكل' || p.category === selectedCategory;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.sku.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const ALL_KEYS_ORDER: FunctionKey[] = ['F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'F11', 'F12'];

  return (
    <div className="h-[calc(100vh-80px)] flex flex-col bg-[#0b0f1a] -m-8 relative">
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 bg-blue-600 text-white font-bold text-xs px-6 py-2.5 rounded-2xl shadow-2xl border border-blue-400 flex items-center gap-2 animate-in fade-in slide-in-from-top-3">
          <CheckCircle2 size={16} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* POS Session Header Bar */}
      <div className="bg-[#151b2b] border-b border-[#1e293b] p-2.5 px-6 flex items-center justify-between text-xs">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 font-bold text-white">
            <Power size={16} className={activeSession ? "text-emerald-400" : "text-red-400"} />
            <span>محطة POS-01 ({activeSession ? 'نشطة' : 'مغلقة'})</span>
          </div>

          {activeSession ? (
            <div className="flex items-center gap-4 text-slate-400 font-mono">
              <span>الكاشير: <strong className="text-white">{activeSession.cashierName}</strong></span>
              <span>عهدة الدرج: <strong className="text-emerald-400">{formatCurrency(activeSession.openingFloat)}</strong></span>
              <span>المبيعات: <strong className="text-blue-400">{formatCurrency(activeSession.totalSales)}</strong> ({activeSession.totalTransactions} فاتورة)</span>
            </div>
          ) : (
            <span className="text-amber-400 font-bold">يرجى فتح الوردية للبدء في إجراء المبيعات</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setLayoutMode(prev => prev === 'compact' ? 'advanced' : 'compact')}
            className={cn(
              "px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all text-[11px] border",
              layoutMode === 'compact' 
                ? "bg-purple-600/20 text-purple-400 border-purple-500/30 hover:bg-purple-600/30" 
                : "bg-blue-600/20 text-blue-400 border-blue-500/30 hover:bg-blue-600/30"
            )}
          >
            <span>{layoutMode === 'compact' ? 'تحويل للمبيعات المتقدمة' : 'تحويل للكاشير المصغر'}</span>
          </button>

          <USBScannerBadge onClick={() => setIsUSBManagerOpen(true)} />

          {heldInvoices.length > 0 && (
            <button
              onClick={() => setIsResumeModalOpen(true)}
              className="px-3 py-1 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-lg font-bold flex items-center gap-1.5 animate-pulse"
            >
              <PauseCircle size={14} />
              <span>فواتير معلقة ({heldInvoices.length})</span>
            </button>
          )}

          {activeSession ? (
            <button 
              onClick={() => executePOSAction('CLOSE_SHIFT')}
              className="px-4 py-1.5 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg font-bold border border-red-500/20 flex items-center gap-1.5"
            >
              <Lock size={14} />
              <span>إغلاق الوردية Z-Report (F10)</span>
            </button>
          ) : (
            <button 
              onClick={() => setIsOpenSessionModalOpen(true)}
              className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold shadow-lg shadow-emerald-600/20 flex items-center gap-1.5"
            >
              <Power size={14} />
              <span>فتح الوردية الجديدة (F1)</span>
            </button>
          )}
        </div>
      </div>

      {/* Dynamic Function Keys Toolbar (F1 - F12) */}
      <div className="bg-[#0f172a] border-b border-[#1e293b] p-2 flex gap-1.5 overflow-x-auto no-scrollbar">
        {ALL_KEYS_ORDER.map((fk) => {
          const actionId = keyMappings[fk];
          const actionDef = actions.find(a => a.id === actionId);
          const Icon = actionDef ? (ICON_COMPONENTS[actionDef.iconName] || Keyboard) : Keyboard;

          return (
            <button 
              key={fk}
              onClick={() => actionId && executePOSAction(actionId)}
              title={actionDef?.description || fk}
              className={cn(
                "flex-shrink-0 px-3 py-1.5 rounded-xl flex items-center gap-2 transition-all active:scale-95 text-white font-bold text-xs border border-white/10 shadow-sm hover:brightness-110",
                actionDef?.color || "bg-slate-800"
              )}
            >
              <span className="font-mono bg-black/40 px-1.5 py-0.5 rounded text-[10px] text-white/90 font-black">{fk}</span>
              <Icon size={14} className="shrink-0" />
              <span className="truncate max-w-[110px]">{actionDef ? actionDef.titleAr : 'غير مخصص'}</span>
            </button>
          );
        })}
      </div>

      <div className="flex-1 flex flex-col overflow-hidden w-full">
        {layoutMode === 'compact' ? (
          <div className="flex-1 flex flex-col md:flex-row overflow-hidden bg-[#090d16]">
            {/* Left: Products Grid */}
            <div className="flex-1 flex flex-col overflow-hidden p-4 space-y-4">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                  <input 
                    type="text"
                    placeholder="ابحث باسم المنتج أو الباركود..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-[#151b2b] border border-[#1e293b] rounded-xl py-2 pr-9 pl-3 text-white text-xs focus:outline-none focus:border-emerald-500 font-bold"
                  />
                </div>
                <button
                  onClick={() => {
                    setCart([]);
                    showToast('تم إخلاء سلة البيع بالكامل');
                  }}
                  className="px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold"
                >
                  تصفير السلة
                </button>
              </div>

              {/* Categories */}
              <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={cn(
                      "px-3 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition-all border",
                      selectedCategory === cat 
                        ? "bg-emerald-600 text-white border-emerald-500 shadow-md" 
                        : "bg-[#151b2b] text-slate-400 border-[#1e293b] hover:bg-slate-800"
                    )}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Products Items */}
              <div className="flex-1 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                {filteredProducts.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => addToCart(p)}
                    className="bg-[#151b2b] border border-[#1e293b] rounded-xl p-3 text-right hover:border-emerald-500 transition-all active:scale-95 flex flex-col justify-between"
                  >
                    <div>
                      <h4 className="font-bold text-white text-xs line-clamp-2 leading-snug">{p.name}</h4>
                      <p className="text-[9px] text-slate-500 mt-0.5 font-mono">مخزون: {p.quantity}</p>
                    </div>
                    <span className="text-emerald-400 font-black text-sm block mt-2 border-t border-[#1e293b]/50 pt-1 font-mono">
                      {formatCurrency(p.price)}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Right Sidebar: Cart & Totals */}
            <div className="w-full md:w-[400px] bg-[#111625] border-r border-[#1e293b] flex flex-col justify-between">
              {/* Compact Cart Header */}
              <div className="p-4 bg-slate-900/40 border-b border-[#1e293b] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShoppingCart size={18} className="text-emerald-400" />
                  <span className="font-bold text-white text-xs">سلة الكاشير الذكي ({cart.length})</span>
                </div>
                <button
                  onClick={() => setIsCustomerModalOpen(true)}
                  className="px-2.5 py-1 bg-[#1e293b] text-slate-300 hover:text-white rounded-lg text-[10px] font-bold border border-[#334155] flex items-center gap-1"
                >
                  <User size={12} />
                  <span>{selectedCustomer ? selectedCustomer.name : 'عميل افتراضي'}</span>
                </button>
              </div>

              {/* Compact Cart Items List */}
              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {cart.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-500 text-center p-6 space-y-2">
                    <ShoppingCart size={32} className="text-slate-700" />
                    <h4 className="text-xs font-bold text-slate-400">سلة البيع فارغة</h4>
                    <p className="text-[10px] text-slate-600">اختر أصناف من القائمة للبدء</p>
                  </div>
                ) : (
                  cart.map((item, idx) => (
                    <div 
                      key={item.product.id}
                      onClick={() => setSelectedCartIndex(idx)}
                      className={cn(
                        "p-2.5 rounded-xl border flex items-center justify-between transition-all cursor-pointer",
                        selectedCartIndex === idx ? "bg-slate-800/80 border-emerald-500" : "bg-slate-900/40 border-slate-800 hover:border-slate-700"
                      )}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-black text-white truncate">{item.product.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                          {item.quantity} × {formatCurrency(item.unitPrice)}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            updateQuantity(item.product.id, -1);
                          }}
                          className="w-6 h-6 bg-[#151b2b] hover:bg-slate-700 text-white rounded flex items-center justify-center font-bold text-xs"
                        >
                          -
                        </button>
                        <span className="w-8 text-center text-xs font-bold text-white font-mono">{item.quantity}</span>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            updateQuantity(item.product.id, 1);
                          }}
                          className="w-6 h-6 bg-[#151b2b] hover:bg-slate-700 text-white rounded flex items-center justify-center font-bold text-xs"
                        >
                          +
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            removeFromCart(item.product.id);
                          }}
                          className="p-1 text-rose-400 hover:text-rose-500 mr-1"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Compact Checkout and Summary Block */}
              <div className="p-4 bg-slate-900/60 border-t border-[#1e293b] space-y-3">
                <div className="space-y-1.5 text-xs text-right">
                  <div className="flex justify-between text-slate-400">
                    <span>عدد المواد:</span>
                    <span className="font-bold text-white font-mono">{cart.reduce((acc, c) => acc + c.quantity, 0)} قطعة</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>ضريبة القيمة المضافة (14%):</span>
                    <span className="font-bold text-white font-mono">{formatCurrency(taxAmount)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-black pt-1 border-t border-slate-800">
                    <span className="text-slate-300">الإجمالي النهائي:</span>
                    <span className="text-emerald-400 font-mono">{formatCurrency(grandTotal)}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      if (cart.length > 0) {
                        setPaymentMethod('CASH');
                        setPaidAmount(grandTotal.toString());
                        handleCheckout();
                      }
                    }}
                    disabled={cart.length === 0}
                    className="py-3 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white text-xs font-black rounded-xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-1.5 disabled:opacity-40"
                  >
                    <CheckCircle2 size={16} />
                    <span>دفع كاش سريع</span>
                  </button>
                  <button
                    onClick={() => {
                      if (cart.length > 0) {
                        setPaymentMethod('CARD');
                        setPaidAmount(grandTotal.toString());
                        handleCheckout();
                      }
                    }}
                    disabled={cart.length === 0}
                    className="py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-black rounded-xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-1.5 disabled:opacity-40"
                  >
                    <CreditCard size={16} />
                    <span>دفع فيزا سريع</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col lg:flex-row overflow-hidden bg-[#0b0f1a] w-full">
            {/* Left: Products Grid */}
            <div className="flex-1 flex flex-col overflow-hidden bg-[#0b0f1a] p-4 space-y-4 w-full">
              <div className="flex gap-3 items-center">
                <div className="relative flex-1">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                  <input 
                    ref={searchInputRef}
                    type="text"
                    placeholder="امسح باركود الصنف أو ابحث... (F3)"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-[#151b2b] border border-[#1e293b] rounded-xl py-2.5 pr-10 pl-4 text-white text-sm focus:outline-none focus:border-blue-500 font-bold"
                  />
                </div>
                <button 
                  onClick={() => setIsScannerOpen(true)}
                  className="p-2.5 bg-purple-600/20 text-purple-400 hover:bg-purple-600/30 rounded-xl border border-purple-500/20"
                  title="ماسح الباركود"
                >
                  <Barcode size={20} />
                </button>
              </div>

              {/* Categories */}
              <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={cn(
                      "px-4 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border",
                      selectedCategory === cat 
                        ? "bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-600/20" 
                        : "bg-[#151b2b] text-slate-400 border-[#1e293b] hover:bg-slate-800"
                    )}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Product Items */}
              <div className="flex-1 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {filteredProducts.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => addToCart(p)}
                    className="bg-[#151b2b] border border-[#1e293b] rounded-2xl p-3 flex flex-col justify-between text-right hover:border-blue-500 transition-all active:scale-95 group"
                  >
                    <div>
                      <div className="font-bold text-white text-sm group-hover:text-blue-400 transition-colors line-clamp-2">{p.name}</div>
                      <div className="text-[10px] text-slate-500 font-mono mt-1">SKU: {p.sku} | مخزون: {p.quantity}</div>
                    </div>
                    <div className="mt-3 font-mono font-black text-blue-400 text-base border-t border-[#1e293b] pt-2">
                      {formatCurrency(p.price)}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Right Sidebar: Cart & Totals */}
            <div className="w-full lg:w-96 bg-[#151b2b] border-t lg:border-t-0 lg:border-r border-[#1e293b] flex flex-col justify-between shrink-0 h-96 lg:h-full">
              {/* Cart Header */}
              <div className="p-4 border-b border-[#1e293b] flex items-center justify-between">
                <div className="flex items-center gap-2 text-white font-bold">
                  <ShoppingCart size={18} className="text-blue-400" />
                  <span>سلة المبيعات ({cart.length})</span>
                </div>
                
                <button
                  onClick={() => setIsCustomerModalOpen(true)}
                  className="px-3 py-1 bg-[#1e293b] hover:bg-slate-800 text-blue-400 rounded-lg text-xs font-bold border border-[#334155] flex items-center gap-1.5"
                >
                  <User size={14} />
                  <span className="truncate max-w-[120px]">{selectedCustomer ? selectedCustomer.name : 'عميل نقدي (F2)'}</span>
                </button>
              </div>

              {/* Cart Items List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {cart.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-2">
                    <ShoppingCart size={40} className="text-slate-700" />
                    <p className="text-xs">السلة فارغة حالياً</p>
                    <p className="text-[10px] text-slate-600">اختر أصناف من اليسار أو امسح الباركود</p>
                  </div>
                ) : (
                  cart.map((item, idx) => (
                    <div 
                      key={item.product.id}
                      onClick={() => setSelectedCartIndex(idx)}
                      className={cn(
                        "bg-[#1e293b]/60 p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between",
                        selectedCartIndex === idx ? "border-blue-500 bg-[#1e293b]" : "border-[#334155]/50 hover:border-slate-500"
                      )}
                    >
                      <div className="flex-1 min-w-0 pl-2">
                        <div className="font-bold text-white text-xs truncate">{item.product.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                          {item.quantity} × {formatCurrency(item.unitPrice)}
                          {item.discount > 0 && <span className="text-rose-400 mr-2">(خصم {item.discount}%)</span>}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 bg-[#0b0f1a] rounded-xl p-1 border border-[#334155]">
                          <button onClick={(e) => { e.stopPropagation(); updateQuantity(item.product.id, -1); }} className="p-1 hover:bg-slate-800 text-slate-400 rounded-lg"><Minus size={12} /></button>
                          <span className="font-mono text-xs font-bold text-white px-2">{item.quantity}</span>
                          <button onClick={(e) => { e.stopPropagation(); updateQuantity(item.product.id, 1); }} className="p-1 hover:bg-slate-800 text-slate-400 rounded-lg"><Plus size={12} /></button>
                        </div>

                        <button onClick={(e) => { e.stopPropagation(); removeFromCart(item.product.id); }} className="p-1.5 text-slate-500 hover:text-red-400"><Trash2 size={14} /></button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Cart Totals & Checkout */}
              <div className="p-4 border-t border-[#1e293b] bg-[#111623] space-y-3">
                <div className="space-y-1.5 text-xs text-slate-400">
                  <div className="flex justify-between">
                    <span>المجموع الخاضع للضريبة</span>
                    <span className="font-mono text-white font-bold">{formatCurrency(totalAmount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>ضريبة القيمة المضافة VAT (14%)</span>
                    <span className="font-mono text-emerald-400 font-bold">{formatCurrency(taxAmount)}</span>
                  </div>
                  <div className="flex justify-between text-base pt-2 border-t border-[#1e293b] font-black text-white">
                    <span>الإجمالي النهائي</span>
                    <span className="font-mono text-blue-400">{formatCurrency(grandTotal)}</span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <button 
                    onClick={() => { setPaymentMethod('CASH'); setIsPaymentModalOpen(true); }}
                    disabled={cart.length === 0}
                    className="py-2 bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-400 rounded-xl font-bold text-xs disabled:opacity-40"
                  >
                    كاش (F7)
                  </button>
                  <button 
                    onClick={() => { setPaymentMethod('CARD'); setIsPaymentModalOpen(true); }}
                    disabled={cart.length === 0}
                    className="py-2 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-400 rounded-xl font-bold text-xs disabled:opacity-40"
                  >
                    بطاقة (F8)
                  </button>
                  <button 
                    onClick={() => { setPaymentMethod('SPLIT'); setIsPaymentModalOpen(true); }}
                    disabled={cart.length === 0}
                    className="py-2 bg-amber-600/20 hover:bg-amber-600/30 border border-amber-500/30 text-amber-400 rounded-xl font-bold text-xs disabled:opacity-40"
                  >
                    مختلط (F9)
                  </button>
                </div>

                <button 
                  onClick={() => { setPaymentMethod('CASH'); setIsPaymentModalOpen(true); }}
                  disabled={cart.length === 0}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-black text-sm shadow-lg shadow-blue-600/20 disabled:opacity-50"
                >
                  تأكيد البيع والدفع
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* --- MODAL DIALOGS --- */}

      {/* Payment Modal */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#151b2b] w-full max-w-md rounded-3xl border border-[#1e293b] p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-[#1e293b] pb-3">
              <h3 className="font-black text-white text-base">إتمام السداد وإصدار الفاتورة</h3>
              <button onClick={() => setIsPaymentModalOpen(false)} className="text-slate-500 hover:text-white">✕</button>
            </div>

            <div className="bg-[#1e293b] p-4 rounded-2xl text-center space-y-1">
              <span className="text-xs text-slate-400">المبلغ المطلوب سداده شامل الضريبة</span>
              <div className="font-mono text-2xl font-black text-blue-400">{formatCurrency(grandTotal)}</div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1">طريقة الدفع</label>
              <div className="grid grid-cols-3 gap-2">
                <button onClick={() => setPaymentMethod('CASH')} className={cn("py-2.5 rounded-xl font-bold text-xs border", paymentMethod === 'CASH' ? "bg-emerald-600 text-white border-emerald-500" : "bg-[#1e293b] text-slate-400 border-[#334155]")}>نقدياً (كاش)</button>
                <button onClick={() => setPaymentMethod('CARD')} className={cn("py-2.5 rounded-xl font-bold text-xs border", paymentMethod === 'CARD' ? "bg-blue-600 text-white border-blue-500" : "bg-[#1e293b] text-slate-400 border-[#334155]")}>بطاقة فيزا</button>
                <button onClick={() => setPaymentMethod('SPLIT')} className={cn("py-2.5 rounded-xl font-bold text-xs border", paymentMethod === 'SPLIT' ? "bg-amber-600 text-white border-amber-500" : "bg-[#1e293b] text-slate-400 border-[#334155]")}>دفع مختلط/آجل</button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1">المبلغ المدفوع من العميل</label>
              <input 
                type="number"
                placeholder={grandTotal.toString()}
                value={paidAmount}
                onChange={(e) => setPaidAmount(e.target.value)}
                className="w-full px-4 py-3 bg-[#1e293b] border border-[#334155] rounded-xl text-white font-mono text-lg font-bold text-center"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button onClick={handleCheckout} className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-xl text-sm">تأكيد وطباعة الإيصال</button>
              <button onClick={() => setIsPaymentModalOpen(false)} className="px-4 bg-[#1e293b] text-slate-300 font-bold rounded-xl text-xs">إلغاء</button>
            </div>
          </div>
        </div>
      )}

      {/* Customer Picker Modal */}
      {isCustomerModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#151b2b] w-full max-w-sm rounded-2xl border border-[#1e293b] p-4 space-y-3">
            <h3 className="font-bold text-white text-sm">اختيار العميل (F2)</h3>
            <button onClick={() => { setSelectedCustomer(null); setIsCustomerModalOpen(false); }} className="w-full text-right p-3 bg-[#1e293b] hover:bg-slate-800 text-white rounded-xl text-xs font-bold">
              عميل نقدي مباشر
            </button>
            {customers.map(c => (
              <button key={c.id} onClick={() => { setSelectedCustomer(c); setIsCustomerModalOpen(false); }} className="w-full text-right p-3 bg-[#1e293b] hover:bg-slate-800 text-white rounded-xl text-xs flex justify-between items-center">
                <span>{c.name}</span>
                <span className="font-mono text-blue-400">{formatCurrency(c.currentBalance)}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Calculator Modal */}
      {isCalculatorOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#151b2b] w-full max-w-xs rounded-3xl border border-[#1e293b] p-5 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-[#1e293b] pb-2">
              <div className="flex items-center gap-2 text-white font-bold text-xs">
                <Calculator size={16} className="text-blue-400" />
                <span>الآلة الحاسبة (F11)</span>
              </div>
              <button onClick={() => setIsCalculatorOpen(false)} className="text-slate-500 hover:text-white">✕</button>
            </div>

            <div className="bg-[#0b0f1a] p-3 rounded-2xl border border-[#1e293b] text-right font-mono text-xl font-bold text-emerald-400 min-h-[48px] flex items-center justify-end overflow-x-auto">
              {calcInput || '0'}
            </div>

            <div className="grid grid-cols-4 gap-2">
              {['7','8','9','/','4','5','6','*','1','2','3','-','C','0','=','+'].map(btn => (
                <button
                  key={btn}
                  onClick={() => {
                    if (btn === 'C') setCalcInput('');
                    else if (btn === '=') {
                      try {
                        const sanitized = calcInput.replace(/[^0-9+\-*/.]/g, '');
                        const res = new Function(`return (${sanitized})`)();
                        setCalcInput(String(res));
                      } catch {
                        setCalcInput('Error');
                      }
                    } else {
                      setCalcInput(prev => prev + btn);
                    }
                  }}
                  className={cn(
                    "py-3 rounded-xl font-mono text-sm font-bold border transition-all active:scale-95",
                    ['/','*','-','+','='].includes(btn) 
                      ? "bg-blue-600/30 text-blue-400 border-blue-500/30"
                      : btn === 'C' ? "bg-red-600/30 text-red-400 border-red-500/30" : "bg-[#1e293b] text-white border-[#334155]"
                  )}
                >
                  {btn}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Parked / Held Invoices Modal */}
      {isResumeModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#151b2b] w-full max-w-md rounded-3xl border border-[#1e293b] p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-[#1e293b] pb-3">
              <h3 className="font-black text-white text-base">الفواتير المعلقة (F6)</h3>
              <button onClick={() => setIsResumeModalOpen(false)} className="text-slate-500 hover:text-white">✕</button>
            </div>

            {heldInvoices.length === 0 ? (
              <p className="text-slate-500 text-xs py-8 text-center">لا توجد فواتير معلقة حالياً</p>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {heldInvoices.map((inv, idx) => (
                  <div key={inv.id} className="p-3 bg-[#1e293b] rounded-2xl flex items-center justify-between border border-[#334155]">
                    <div>
                      <div className="font-bold text-white text-xs">{inv.customerName} ({inv.items.length} أصناف)</div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">{inv.time} - إجمالي: {formatCurrency(inv.total)}</div>
                    </div>

                    <button
                      onClick={() => {
                        setCart(inv.items);
                        setHeldInvoices(prev => prev.filter((_, i) => i !== idx));
                        setIsResumeModalOpen(false);
                        showToast('تم استرجاع الفاتورة المعلقة للسلة');
                      }}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-xs"
                    >
                      استرجاع
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Quantity Adjustment Modal */}
      {isQtyModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#151b2b] w-full max-w-xs rounded-3xl border border-[#1e293b] p-6 space-y-4">
            <h3 className="font-bold text-white text-sm">تعديل كمية الصنف (F4)</h3>
            <input 
              type="number"
              value={qtyInput}
              onChange={(e) => setQtyInput(e.target.value)}
              className="w-full px-4 py-3 bg-[#1e293b] border border-[#334155] rounded-xl text-white font-mono text-xl font-bold text-center"
            />
            <div className="flex gap-2">
              <button 
                onClick={() => {
                  const val = parseFloat(qtyInput);
                  if (val > 0 && selectedCartIndex !== null && cart[selectedCartIndex]) {
                    setCart(prev => {
                      const updated = [...prev];
                      updated[selectedCartIndex].quantity = val;
                      return updated;
                    });
                  }
                  setIsQtyModalOpen(false);
                }}
                className="flex-1 py-2.5 bg-blue-600 text-white font-bold rounded-xl text-xs"
              >
                تطبيق
              </button>
              <button onClick={() => setIsQtyModalOpen(false)} className="px-4 bg-[#1e293b] text-slate-300 font-bold rounded-xl text-xs">إلغاء</button>
            </div>
          </div>
        </div>
      )}

      {/* Discount Modal */}
      {isDiscountModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#151b2b] w-full max-w-xs rounded-3xl border border-[#1e293b] p-6 space-y-4">
            <h3 className="font-bold text-white text-sm">إضافة خصم على الفاتورة (F5)</h3>
            <div>
              <label className="block text-xs text-slate-400 mb-1">نسبة الخصم %</label>
              <input 
                type="number"
                value={discountPercentInput}
                onChange={(e) => setDiscountPercentInput(e.target.value)}
                className="w-full px-4 py-2.5 bg-[#1e293b] border border-[#334155] rounded-xl text-white font-mono text-lg font-bold text-center"
              />
            </div>
            <div className="flex gap-2">
              <button onClick={() => applyDiscountToCart(parseFloat(discountPercentInput) || 0)} className="flex-1 py-2.5 bg-rose-600 text-white font-bold rounded-xl text-xs">تطبيق الخصم</button>
              <button onClick={() => setIsDiscountModalOpen(false)} className="px-4 bg-[#1e293b] text-slate-300 font-bold rounded-xl text-xs">إلغاء</button>
            </div>
          </div>
        </div>
      )}

      {/* Scanner Modal */}
      {isScannerOpen && (
        <BarcodeScanner onScan={handleScanBarcode} onClose={() => setIsScannerOpen(false)} />
      )}

      {/* Open Session Modal */}
      {isOpenSessionModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#151b2b] w-full max-w-sm rounded-3xl border border-[#1e293b] p-6 space-y-4">
            <h3 className="font-black text-lg text-white">فتح وردية كاشير جديدة (F1)</h3>
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1">المبلغ الإفتتاحي بالدرج (EGP)</label>
              <input 
                type="number" 
                className="w-full px-4 py-2.5 bg-[#1e293b] border border-[#334155] rounded-xl text-white font-mono text-lg font-bold text-center"
                value={openingFloat}
                onChange={(e) => setOpeningFloat(parseFloat(e.target.value) || 0)}
              />
            </div>
            <div className="flex gap-2">
              <button onClick={handleOpenSession} className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold">بدء الوردية</button>
              <button onClick={() => setIsOpenSessionModalOpen(false)} className="px-4 bg-[#1e293b] text-slate-300 rounded-xl font-bold">إلغاء</button>
            </div>
          </div>
        </div>
      )}

      {/* Close Session Modal */}
      {isCloseSessionModalOpen && activeSession && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#151b2b] w-full max-w-md rounded-3xl border border-[#1e293b] p-6 space-y-4">
            <h3 className="font-black text-lg text-white">إغلاق الوردية Z-Report (F10)</h3>
            <div className="bg-[#1e293b] p-4 rounded-xl text-xs space-y-1 text-right">
              <div>إجمالي المبيعات: <strong className="text-blue-400 font-mono">{formatCurrency(activeSession.totalSales)}</strong></div>
              <div>العهدة الإفتتاحية: <strong className="text-emerald-400 font-mono">{formatCurrency(activeSession.openingFloat)}</strong></div>
              <div>المتوقع بالدرج: <strong className="text-amber-400 font-mono">{formatCurrency(activeSession.openingFloat + activeSession.totalSales)}</strong></div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1">المبلغ الفعلي المقاس بالدرج</label>
              <input 
                type="number" 
                className="w-full px-4 py-2.5 bg-[#1e293b] border border-[#334155] rounded-xl text-white font-mono text-lg font-bold text-center"
                value={closingCashCount}
                onChange={(e) => setClosingCashCount(parseFloat(e.target.value) || 0)}
              />
            </div>
            <div className="flex gap-2">
              <button onClick={handleCloseSession} className="flex-1 py-3 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold">إنهاء الوردية وإصدار التقرير</button>
              <button onClick={() => setIsCloseSessionModalOpen(false)} className="px-4 bg-[#1e293b] text-slate-300 rounded-xl font-bold">إلغاء</button>
            </div>
          </div>
        </div>
      )}

      {/* USB/Bluetooth Scanner Manager Modal */}
      <USBScannerModal isOpen={isUSBManagerOpen} onClose={() => setIsUSBManagerOpen(false)} />

      {/* Quick Price & Stock Inquiry Modal (F13 / F14) */}
      <POSStockInquiryModal
        isOpen={isStockInquiryOpen}
        onClose={() => setIsStockInquiryOpen(false)}
        onAddToCart={(priceCheckProd) => {
          const existingMaster = products.find(p => p.id === priceCheckProd.id || p.barcode === priceCheckProd.barcode || p.sku === priceCheckProd.sku);
          if (existingMaster) {
            addToCart(existingMaster, 1);
          } else {
            addToCart({
              id: priceCheckProd.id,
              name: priceCheckProd.nameAr,
              nameArabic: priceCheckProd.nameAr,
              nameEnglish: priceCheckProd.nameEn,
              sku: priceCheckProd.sku,
              barcode: priceCheckProd.barcode,
              description: priceCheckProd.descriptionAr || priceCheckProd.nameAr,
              price: priceCheckProd.hasPromotion && priceCheckProd.promoPrice ? priceCheckProd.promoPrice : priceCheckProd.retailPrice,
              costPrice: priceCheckProd.costPrice,
              category: priceCheckProd.category,
              quantity: priceCheckProd.stockInCurrentBranch,
              openingBalance: priceCheckProd.stockInCurrentBranch,
              reorderLevel: 5,
              batchTracking: false,
              expiryTracking: false,
              serialNumberTracking: false,
              allowNegativeStock: true,
              allowFraction: false,
              isTaxable: true,
              taxIncluded: true,
              taxRate: priceCheckProd.taxRate,
              units: [{ id: `u_${Date.now()}`, name: priceCheckProd.unit, symbol: priceCheckProd.unit, factor: 1, isBaseUnit: true, barcode: priceCheckProd.barcode, salePrice: priceCheckProd.retailPrice }],
              barcodes: [{ id: `b_${Date.now()}`, code: priceCheckProd.barcode, type: 'EAN13', isPrimary: true }],
              warehouseStocks: [{ warehouseId: 'BR-CAIRO-01', warehouseName: 'فرع المعادي الرئيسي', quantity: priceCheckProd.stockInCurrentBranch }],
              priceLists: [],
              batches: [],
              images: priceCheckProd.imageUrl ? [{ id: 'img_1', url: priceCheckProd.imageUrl, isPrimary: true }] : [],
              attachments: [],
              status: 'active',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            } as ProductMaster, 1);
          }
          showToast(`تمت إضافة [${priceCheckProd.nameAr}] إلى فاتورة البيع`);
        }}
      />

      {/* Global POS Function Keys & Smart Keyboard Toolbar Bar */}
      <FunctionKeyBar 
        onExecuteKey={(key, actionId) => executePOSAction(actionId)} 
        activeInputType="numeric"
      />
    </div>
  );
};
