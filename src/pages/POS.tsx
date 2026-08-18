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
  CreditCard,
  Utensils,
  Stethoscope,
  Building2,
  Monitor,
  Sliders,
  Sparkles,
  Pill,
  ShieldCheck,
  Truck,
  Grid,
  Check
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
import { formatCurrency, cn, playSystemChime, parseArabicNumbers } from '../lib/utils';
import { toast } from 'react-hot-toast';
import { BarcodeScanner } from '../components/BarcodeScanner';
import { printSalesInvoice } from '../lib/invoicePrinter';
import { usbScannerEngine } from '../services/usbScannerEngine';
import { USBScannerBadge, USBScannerModal } from '../components/USBBarcodeScannerManager';
import { FunctionKeyBar } from '../components/common/FunctionKeyBar';
import { handleSmartKeyDown, getNumericInputProps, handleInputFocus } from '../lib/smartKeyboardEngine';
import { POSStockInquiryModal } from '../components/POSStockInquiryModal';
import { TrialLimitService } from '../services/trialLimitService';

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

  // Function keys bar visibility state (toggleable, active in background)
  const [showFunctionKeysBar, setShowFunctionKeysBar] = useState<boolean>(() => localStorage.getItem('pos_show_fkeys') !== 'false');
  // Expanded Cart width mode for handling long invoices (10-30+ items)
  const [cartExpandedMode, setCartExpandedMode] = useState<boolean>(false);
  // Search box query inside POS cart
  const [cartSearchQuery, setCartSearchQuery] = useState<string>('');
  
  // Customer Modal Search & Loyalty state
  const [customerSearchQuery, setCustomerSearchQuery] = useState<string>('');
  const [cashCustomerPhone, setCashCustomerPhone] = useState<string>('');
  const [isLoyaltyEnabled, setIsLoyaltyEnabled] = useState<boolean>(false);

  useEffect(() => {
    setIsLoyaltyEnabled(localStorage.getItem('maro_loyalty_enabled') === 'true');
  }, []);

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

  // Active POS Model State (ultra | sap | wholesale | pharmacy | restaurant)
  const [activeModel, setActiveModel] = useState<'ultra' | 'sap' | 'wholesale' | 'pharmacy' | 'restaurant'>(() => {
    const saved = localStorage.getItem('maro_pos_active_layout');
    return (saved as any) || 'ultra';
  });

  const switchPOSModel = (model: 'ultra' | 'sap' | 'wholesale' | 'pharmacy' | 'restaurant') => {
    setActiveModel(model);
    localStorage.setItem('maro_pos_active_layout', model);
    showToast(`تم التبديل لموديل [${
      model === 'ultra' ? 'Supermarket Ultra Touch' :
      model === 'sap' ? 'SAP Enterprise ERP' :
      model === 'wholesale' ? 'Wholesale B2B Terminal' :
      model === 'pharmacy' ? 'Clinical Pharmacy POS' : 'Restaurant & Cafe'
    }] بنجاح`);
  };

  // Ultra Supermarket Barcode Scale Parser State
  const [scaleInput, setScaleInput] = useState('');
  
  // SAP Enterprise State
  const [selectedCostCenter, setSelectedCostCenter] = useState('CC-101 الفرع الرئيسي');
  const [selectedGLAccount, setSelectedGLAccount] = useState('410100 - مبيعات البضائع والمنتجات');

  // Wholesale B2B State
  const [selectedSalesRep, setSelectedSalesRep] = useState('محمود سالم (عمولة 2.5%)');

  // Pharmacy Clinical State
  const [searchByMolecule, setSearchByMolecule] = useState(false);
  const [selectedInsurance, setSelectedInsurance] = useState('بدون تأمين (نقدي 100%)');
  const [insuranceCopay, setInsuranceCopay] = useState(0);
  const [selectedSubstituteProduct, setSelectedSubstituteProduct] = useState<ProductMaster | null>(null);

  // Restaurant State
  const [selectedTable, setSelectedTable] = useState<number>(1);
  const [tableStatus, setTableStatus] = useState<Record<number, 'free' | 'occupied' | 'reserved'>>({
    1: 'occupied', 2: 'free', 3: 'reserved', 4: 'free', 5: 'occupied', 6: 'free'
  });
  const [selectedModifierItem, setSelectedModifierItem] = useState<{ productId: string; name: string } | null>(null);
  const [activeModifiers, setActiveModifiers] = useState<Record<string, string[]>>({});

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
      if (e.key && e.key.startsWith('F') && /^F(1[0-2]|[1-9])$/.test(e.key)) {
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

  const handleCheckout = async (print: boolean = true, whatsapp: boolean = false) => {
    if (!activeSession) {
      playSystemChime('warning');
      alert('يرجى فتح جلسة نقطة البيع POS أولاً');
      setIsOpenSessionModalOpen(true);
      return;
    }
    if (cart.length === 0) return;

    if (paymentMethod === 'SPLIT' && !selectedCustomer) {
      playSystemChime('error');
      toast.error('يجب تحديد عميل (آجل) مسجل أولاً لإتمام عملية الدفع المختلط أو الآجل', { duration: 5000 });
      setIsCustomerModalOpen(true);
      return;
    }

    const trialCheck = TrialLimitService.canCreateInvoice();
    if (!trialCheck.allowed) {
      playSystemChime('warning');
      toast.error(trialCheck.messageAr || 'انتهت حدود النسخة التجريبية. يرجى تفعيل النظام للمتابعة.');
      return;
    }

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
      if (print) {
        printSalesInvoice(txn);
      }
      if (whatsapp) {
        const invNum = txn.invoiceNumber || txn.id;
        const invTotal = txn.grandTotal ?? (txn as any).total ?? 0;
        const text = encodeURIComponent(`مرحباً ${txn.customerName || 'عميلنا العزيز'}، فاتورتك رقم ${invNum} بقيمة ${formatCurrency(invTotal)} من نظام MARO ERP. شكراً لتسوقكم معنا!`);
        window.open(`https://wa.me/?text=${text}`, '_blank');
      }

      // Sound & Visual Checkout confirmation
      playSystemChime('success');
      toast.success(
        <div className="flex flex-col text-right font-sans">
          <span className="font-black text-xs text-white">🧾 تم تأكيد وحفظ فاتورة البيع!</span>
          <span className="text-[10px] text-slate-400 mt-0.5">القيمة: {formatCurrency(grandTotal)} {print ? '| تم طباعة إيصال العميل.' : ''}</span>
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
    const searchLower = searchQuery.toLowerCase();
    
    let matchesSearch = p.name.toLowerCase().includes(searchLower) || 
                        p.sku.toLowerCase().includes(searchLower) ||
                        (p.barcodes && p.barcodes.some(b => b.code.includes(searchLower)));

    if (activeModel === 'pharmacy' && searchByMolecule && searchQuery.trim().length > 0) {
      matchesSearch = matchesSearch || 
                      (p.description && p.description.toLowerCase().includes(searchLower)) ||
                      (p.category && p.category.toLowerCase().includes(searchLower));
    }

    return matchesCat && matchesSearch;
  });

  const filteredCart = cart.filter((item, idx) => {
    if (!cartSearchQuery.trim()) return true;
    const q = cartSearchQuery.toLowerCase().trim();
    const idxMatch = (idx + 1).toString() === q || `#${idx + 1}` === q;
    const nameMatch = item.product.name.toLowerCase().includes(q);
    const skuMatch = item.product.sku && item.product.sku.toLowerCase().includes(q);
    return idxMatch || nameMatch || skuMatch;
  });

  const renderCartSidebar = () => {
    return (
      <div className={cn(
        "bg-[#111625] border-r border-[#1e293b] flex flex-col justify-between transition-all duration-300 shrink-0 h-full",
        cartExpandedMode 
          ? "w-full lg:w-[580px] xl:w-[660px]" 
          : "w-full lg:w-[460px] xl:w-[500px]"
      )}>
        {/* Cart Header */}
        <div className="p-3 bg-slate-900/80 border-b border-[#1e293b] flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <ShoppingCart size={18} className="text-emerald-400 shrink-0" />
            <span className="font-black text-white text-xs">سلة المبيعات</span>
            <span className="px-2 py-0.5 rounded-lg bg-blue-500/20 text-blue-300 border border-blue-500/30 font-bold font-mono text-[10px]">
              {cart.length} أصناف ({cart.reduce((acc, item) => acc + item.quantity, 0)} قطعة)
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Expand / Collapse Cart */}
            <button
              onClick={() => setCartExpandedMode(!cartExpandedMode)}
              className={cn(
                "px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all flex items-center gap-1",
                cartExpandedMode 
                  ? "bg-purple-600/30 text-purple-300 border-purple-500/40" 
                  : "bg-[#1e293b] text-slate-300 hover:text-white border-[#334155]"
              )}
              title={cartExpandedMode ? "تصغير عرض السلة" : "توسيع عرض السلة لرؤية مريحة للفواتير الطويلة"}
            >
              <Sliders size={12} />
              <span>{cartExpandedMode ? 'تصغير العرض' : 'توسيع السلة'}</span>
            </button>

            {/* Customer Button */}
            <button
              onClick={() => setIsCustomerModalOpen(true)}
              className="px-2 py-1 bg-[#1e293b] hover:bg-slate-800 text-blue-400 rounded-lg text-[10px] font-bold border border-[#334155] flex items-center gap-1 truncate max-w-[120px]"
              title="تغيير العميل (F2)"
            >
              <User size={12} />
              <span className="truncate">{selectedCustomer ? selectedCustomer.name : 'عميل افتراضي'}</span>
            </button>

            {/* Clear Cart */}
            {cart.length > 0 && (
              <button
                onClick={() => {
                  setCart([]);
                  setCartSearchQuery('');
                  showToast('تم إخلاء سلة البيع بالكامل');
                }}
                className="p-1 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-rose-500/10 transition-colors"
                title="تصفير السلة بالكامل"
              >
                <Trash2 size={15} />
              </button>
            )}
          </div>
        </div>

        {/* In-Cart Search Box (Appears when items >= 3) */}
        {cart.length >= 3 && (
          <div className="p-2 bg-[#0f172a] border-b border-[#1e293b] flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500" size={13} />
              <input 
                type="text"
                placeholder="ابحث برقم الصنف (#1, #2...) أو الاسم داخل الفاتورة..."
                value={cartSearchQuery}
                onChange={(e) => setCartSearchQuery(e.target.value)}
                className="w-full bg-[#151b2b] border border-[#1e293b] rounded-xl py-1.5 pr-8 pl-7 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-bold"
              />
              {cartSearchQuery && (
                <button 
                  onClick={() => setCartSearchQuery('')}
                  className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  <X size={12} />
                </button>
              )}
            </div>

            {/* Quick Navigation Jumps for large invoices */}
            {cart.length > 6 && (
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => {
                    const el = document.getElementById('cart-items-scroll-container');
                    if (el) el.scrollTop = el.scrollHeight;
                  }}
                  className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-[10px] font-bold border border-slate-700"
                  title="الذهاب لآخر صنف بالفاتورة"
                >
                  ⬇ للأسفل
                </button>
                <button
                  onClick={() => {
                    const el = document.getElementById('cart-items-scroll-container');
                    if (el) el.scrollTop = 0;
                  }}
                  className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-[10px] font-bold border border-slate-700"
                  title="الذهاب لأول الفاتورة"
                >
                  ⬆ للأعلى
                </button>
              </div>
            )}
          </div>
        )}

        {/* Cart Items List */}
        <div id="cart-items-scroll-container" className="flex-1 overflow-y-auto p-2.5 space-y-2">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-500 text-center p-6 space-y-2">
              <ShoppingCart size={36} className="text-slate-700" />
              <h4 className="text-xs font-bold text-slate-400">سلة البيع فارغة حالياً</h4>
              <p className="text-[10px] text-slate-600">اختر أصناف من اليسار أو امسح الباركود للبدء</p>
            </div>
          ) : filteredCart.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-xs font-bold">
              لا توجد أصناف تطابق البحث "{cartSearchQuery}" داخل الفاتورة.
            </div>
          ) : (
            filteredCart.map((item) => {
              const originalIndex = cart.findIndex(c => c.product.id === item.product.id);
              const itemNum = originalIndex >= 0 ? originalIndex + 1 : 1;
              const isSelected = selectedCartIndex === originalIndex;
              const itemTotal = item.unitPrice * item.quantity * (1 - (item.discount || 0) / 100);

              return (
                <div 
                  key={item.product.id}
                  onClick={() => setSelectedCartIndex(originalIndex)}
                  className={cn(
                    "p-2.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-2.5",
                    isSelected 
                      ? "bg-slate-800/90 border-emerald-500/80 ring-1 ring-emerald-500/30" 
                      : "bg-slate-900/60 border-slate-800 hover:border-slate-700"
                  )}
                >
                  {/* Item Sequence Badge */}
                  <span className="w-6 h-6 rounded-lg bg-blue-500/20 text-blue-300 border border-blue-500/30 font-mono font-black text-xs flex items-center justify-center shrink-0">
                    #{itemNum}
                  </span>

                  {/* Product Info */}
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-black text-white truncate leading-snug">
                      {item.product.name}
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono mt-0.5">
                      <span>{formatCurrency(item.unitPrice)}</span>
                      {item.discount > 0 && (
                        <span className="px-1 py-0.2 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 font-bold">
                          خصم {item.discount}%
                        </span>
                      )}
                      {item.product.sku && <span className="text-slate-500 shrink-0 font-sans">({item.product.sku})</span>}
                    </div>
                  </div>

                  {/* Quantity Controls */}
                  <div className="flex items-center gap-1 bg-[#151b2b] rounded-xl p-1 border border-[#1e293b] shrink-0">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        updateQuantity(item.product.id, -1);
                      }}
                      className="w-6 h-6 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg flex items-center justify-center font-bold text-xs active:scale-90 transition-transform"
                    >
                      <Minus size={12} />
                    </button>
                    
                    <input
                      type="text"
                      inputMode="decimal"
                      dir="ltr"
                      onFocus={(e) => e.target.select()}
                      onKeyDown={(e) => {
                        let val = item.quantity || 1;
                        if (e.key === 'ArrowUp' || e.key === '+' || e.code === 'NumpadAdd') {
                          e.preventDefault();
                          updateQuantity(item.product.id, 1);
                        } else if (e.key === 'ArrowDown' || e.key === '-' || e.code === 'NumpadSubtract') {
                          e.preventDefault();
                          updateQuantity(item.product.id, -1);
                        } else if (e.key === 'Enter' || e.code === 'NumpadEnter') {
                          e.preventDefault();
                          e.currentTarget.blur();
                        }
                      }}
                      value={item.quantity}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => {
                        const valStr = parseArabicNumbers(e.target.value).replace(/[^0-9.-]/g, '');
                        const val = parseFloat(valStr) || 1;
                        setCart(prev => prev.map(c => c.product.id === item.product.id ? { ...c, quantity: Math.max(1, val) } : c));
                      }}
                      className="w-9 text-center text-xs font-black text-white font-mono bg-transparent focus:outline-none focus:bg-slate-800 rounded"
                    />

                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        updateQuantity(item.product.id, 1);
                      }}
                      className="w-6 h-6 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg flex items-center justify-center font-bold text-xs active:scale-90 transition-transform"
                    >
                      <Plus size={12} />
                    </button>
                  </div>

                  {/* Item Total & Delete */}
                  <div className="flex items-center gap-2 shrink-0 text-left">
                    <span className="font-mono font-black text-emerald-400 text-xs sm:text-sm">
                      {formatCurrency(itemTotal)}
                    </span>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFromCart(item.product.id);
                      }}
                      className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                      title="حذف الصنف"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Totals & Checkout Section */}
        <div className="p-3.5 bg-slate-900/90 border-t border-[#1e293b] space-y-2.5">
          <div className="space-y-1 text-xs">
            <div className="flex justify-between text-slate-400">
              <span>إجمالي المواد:</span>
              <span className="font-bold text-white font-mono">{cart.reduce((acc, c) => acc + c.quantity, 0)} قطعة</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>ضريبة القيمة المضافة (14% VAT):</span>
              <span className="font-bold text-white font-mono">{formatCurrency(taxAmount)}</span>
            </div>
            <div className="flex justify-between items-center text-base font-black pt-1.5 border-t border-slate-800 text-white">
              <span className="text-slate-200">الإجمالي النهائي:</span>
              <span className="text-emerald-400 font-mono text-lg">{formatCurrency(grandTotal)}</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-0.5">
            <button
              onClick={() => {
                if (cart.length > 0) {
                  setPaymentMethod('CASH');
                  setPaidAmount(grandTotal.toString());
                  handleCheckout();
                }
              }}
              disabled={cart.length === 0}
              className="py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black rounded-xl shadow-lg shadow-emerald-600/20 transition-all active:scale-95 flex items-center justify-center gap-1 disabled:opacity-40"
            >
              <CheckCircle2 size={14} />
              <span>كاش (F7)</span>
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
              className="py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-black rounded-xl shadow-lg shadow-blue-600/20 transition-all active:scale-95 flex items-center justify-center gap-1 disabled:opacity-40"
            >
              <CreditCard size={14} />
              <span>فيزا (F8)</span>
            </button>

            <button
              onClick={() => {
                if (cart.length > 0) {
                  setPaymentMethod('SPLIT');
                  setIsPaymentModalOpen(true);
                }
              }}
              disabled={cart.length === 0}
              className="py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-black rounded-xl transition-all active:scale-95 flex items-center justify-center gap-1 disabled:opacity-40"
            >
              <DollarSign size={14} />
              <span>مختلط (F9)</span>
            </button>
          </div>
        </div>
      </div>
    );
  };

  const ALL_KEYS_ORDER: FunctionKey[] = ['F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'F11', 'F12'];

  const renderDomainHeader = () => {
    if (activeModel === 'ultra') {
      return (
        <div className="bg-emerald-950/40 border border-emerald-500/30 p-2.5 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs shadow-inner">
          <div className="flex items-center gap-2">
            <Scale size={18} className="text-emerald-400 shrink-0" />
            <span className="font-bold text-emerald-300 shrink-0">ميزان الوزن الباركود:</span>
            <input
              type="text"
              placeholder="امسح باركود الميزان (مثال: 2100055004509)"
              value={scaleInput}
              onChange={(e) => {
                setScaleInput(e.target.value);
                if (e.target.value.length === 13) {
                  handleScanBarcode(e.target.value);
                  setScaleInput('');
                }
              }}
              className="bg-[#151b2b] border border-emerald-500/40 rounded-xl px-3 py-1.5 text-white text-xs font-mono w-60 focus:outline-none focus:border-emerald-400"
            />
          </div>
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            <span className="text-[10px] text-slate-400 font-bold ml-1 shrink-0">دفع كاش سريع:</span>
            {[50, 100, 200, 500].map(amt => (
              <button
                key={amt}
                onClick={() => {
                  if (cart.length > 0) {
                    setPaidAmount(amt.toString());
                    setPaymentMethod('CASH');
                    handleCheckout();
                  }
                }}
                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-mono font-bold text-xs shadow transition-all active:scale-95 shrink-0"
              >
                {amt} ج.م
              </button>
            ))}
          </div>
        </div>
      );
    }

    if (activeModel === 'sap') {
      return (
        <div className="bg-blue-950/40 border border-blue-500/30 p-2.5 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs shadow-inner">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Building2 size={16} className="text-blue-400 shrink-0" />
              <span className="text-slate-300 font-bold shrink-0">مركز التكلفة:</span>
              <select
                value={selectedCostCenter}
                onChange={(e) => setSelectedCostCenter(e.target.value)}
                className="bg-[#151b2b] border border-blue-500/40 rounded-xl px-2.5 py-1 text-white text-xs font-bold"
              >
                <option value="CC-101 الفرع الرئيسي">CC-101 الفرع الرئيسي</option>
                <option value="CC-102 قطاع الجملة">CC-102 قطاع الجملة</option>
                <option value="CC-201 التسويق والمعارض">CC-201 التسويق والمعارض</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <FileText size={16} className="text-blue-400 shrink-0" />
              <span className="text-slate-300 font-bold shrink-0">حساب G/L:</span>
              <select
                value={selectedGLAccount}
                onChange={(e) => setSelectedGLAccount(e.target.value)}
                className="bg-[#151b2b] border border-blue-500/40 rounded-xl px-2.5 py-1 text-white text-xs font-bold"
              >
                <option value="410100 - مبيعات البضائع والمنتجات">410100 - مبيعات البضائع والمنتجات</option>
                <option value="410200 - إيرادات الخدمات">410200 - إيرادات الخدمات</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-blue-900/40 px-3 py-1 rounded-xl border border-blue-500/30">
            <ShieldCheck size={16} className="text-emerald-400 shrink-0" />
            <span className="text-[11px] font-mono text-blue-200">ZATCA Phase 2 Approved | TRN: 310984852900003</span>
          </div>
        </div>
      );
    }

    if (activeModel === 'wholesale') {
      return (
        <div className="bg-amber-950/40 border border-amber-500/30 p-2.5 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs shadow-inner">
          <div className="flex items-center gap-3">
            <Truck size={18} className="text-amber-400 shrink-0" />
            <span className="text-slate-300 font-bold shrink-0">مندوب المبيعات:</span>
            <select
              value={selectedSalesRep}
              onChange={(e) => setSelectedSalesRep(e.target.value)}
              className="bg-[#151b2b] border border-amber-500/40 rounded-xl px-3 py-1 text-white text-xs font-bold"
            >
              <option value="محمود سالم (عمولة 2.5%)">محمود سالم (عمولة 2.5%)</option>
              <option value="أحمد فاروق (عمولة 3.0%)">أحمد فاروق (عمولة 3.0%)</option>
              <option value="سامح السيد (عمولة 2.0%)">سامح السيد (عمولة 2.0%)</option>
            </select>
          </div>

          <div className="flex items-center gap-2 text-amber-300 text-[11px] font-mono bg-amber-900/30 px-3 py-1 rounded-xl border border-amber-500/30">
            <Percent size={14} className="text-amber-400 shrink-0" />
            <span>شرائح الخصم: (10+ كرتونة = -8% | 50+ كرتونة = -16%)</span>
          </div>
        </div>
      );
    }

    if (activeModel === 'pharmacy') {
      return (
        <div className="bg-rose-950/40 border border-rose-500/30 p-2.5 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs shadow-inner">
          <div className="flex items-center gap-3">
            <Pill size={18} className="text-rose-400 shrink-0" />
            <button
              onClick={() => {
                setSearchByMolecule(prev => !prev);
                showToast(!searchByMolecule ? 'تم تفعيل البحث بالمادة الفعالة (Scientific Molecule)' : 'تم التبديل للبحث بالاسم التجاري');
              }}
              className={cn(
                "px-3 py-1 rounded-xl font-bold text-xs border transition-all flex items-center gap-1.5 shrink-0",
                searchByMolecule ? "bg-rose-600 text-white border-rose-400 shadow" : "bg-[#151b2b] text-slate-300 border-rose-500/30"
              )}
            >
              <Sparkles size={14} />
              <span>{searchByMolecule ? 'البحث بالمادة الفعالة (نشط)' : 'التبديل للبحث بالمادة الفعالة'}</span>
            </button>

            <div className="flex items-center gap-2">
              <Stethoscope size={16} className="text-rose-400 shrink-0" />
              <span className="text-slate-300 font-bold shrink-0">التأمين الطبي:</span>
              <select
                value={selectedInsurance}
                onChange={(e) => {
                  setSelectedInsurance(e.target.value);
                  setInsuranceCopay(e.target.value.includes('20%') ? 20 : e.target.value.includes('30%') ? 30 : 0);
                }}
                className="bg-[#151b2b] border border-rose-500/40 rounded-xl px-2.5 py-1 text-white text-xs font-bold"
              >
                <option value="بدون تأمين (نقدي 100%)">بدون تأمين (نقدي 100%)</option>
                <option value="شركة ميدي جولد (تحمل العميل 20%)">شركة ميدي جولد (تحمل 20%)</option>
                <option value="تأمين أكسا الطبي (تحمل العميل 30%)">تأمين أكسا الطبي (تحمل 30%)</option>
              </select>
            </div>
          </div>

          {insuranceCopay > 0 && (
            <div className="bg-rose-900/50 px-3 py-1 rounded-xl border border-rose-500/40 text-rose-200 font-bold text-[11px] font-mono shrink-0">
              تغطية التأمين: {100 - insuranceCopay}% | تحمل العميل: {insuranceCopay}%
            </div>
          )}
        </div>
      );
    }

    if (activeModel === 'restaurant') {
      return (
        <div className="bg-purple-950/40 border border-purple-500/30 p-2.5 rounded-2xl flex flex-col gap-2 text-xs shadow-inner">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Utensils size={18} className="text-purple-400 shrink-0" />
              <span className="font-black text-white">خريطة الطاولات والصالة:</span>
            </div>
            <button
              onClick={() => {
                showToast(`تم إرسال أمر التشغيل للورشتين والمطبخ الرئيسي KDS بخصوص طاولة ${selectedTable}`);
                playSystemChime('confirm');
              }}
              className="px-3 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow"
            >
              <Printer size={14} />
              <span>إرسال للمطبخ KDS (طاولة {selectedTable})</span>
            </button>
          </div>

          <div className="grid grid-cols-6 gap-2">
            {[1, 2, 3, 4, 5, 6].map((tbl) => {
              const st = tableStatus[tbl] || 'free';
              return (
                <button
                  key={tbl}
                  onClick={() => setSelectedTable(tbl)}
                  className={cn(
                    "p-2 rounded-xl text-center font-bold text-xs border transition-all flex flex-col items-center justify-center gap-0.5",
                    selectedTable === tbl ? "ring-2 ring-purple-400 scale-105" : "",
                    st === 'occupied' ? "bg-rose-900/40 border-rose-500/50 text-rose-200" :
                    st === 'reserved' ? "bg-amber-900/40 border-amber-500/50 text-amber-200" :
                    "bg-emerald-900/30 border-emerald-500/40 text-emerald-300"
                  )}
                >
                  <span>طاولة {tbl}</span>
                  <span className="text-[9px] font-mono opacity-80">
                    {st === 'occupied' ? 'مشغولة' : st === 'reserved' ? 'محجوزة' : 'شاغرة'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      );
    }

    return null;
  };

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
            onClick={() => {
              const next = !showFunctionKeysBar;
              setShowFunctionKeysBar(next);
              localStorage.setItem('pos_show_fkeys', String(next));
              showToast(next ? 'تم إظهار شريط أزرار الوظائف (F1-F12)' : 'تم إخفاء شريط الوظائف (أزرار F1-F12 تعمل بالخلفية ⚡)');
            }}
            className={cn(
              "px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all text-[11px] border",
              showFunctionKeysBar 
                ? "bg-blue-600/20 text-blue-300 border-blue-500/40 hover:bg-blue-600/30" 
                : "bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700"
            )}
            title="شريط أزرار الوظائف السريعة F1-F12"
          >
            <Keyboard size={14} className={showFunctionKeysBar ? "text-blue-400" : "text-emerald-400"} />
            <span>{showFunctionKeysBar ? 'إخفاء أزرار (F1-F12)' : 'إظهار أزرار (F1-F12)'}</span>
            {!showFunctionKeysBar && (
              <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                شغالة بالخلفية ⚡
              </span>
            )}
          </button>

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
      {showFunctionKeysBar && (
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
      )}

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
            {renderCartSidebar()}
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
            {renderCartSidebar()}
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
                type="text"
                inputMode="decimal"
                dir="ltr"
                autoFocus
                onFocus={(e) => e.target.select()}
                onKeyDown={(e) => {
                  let val = parseFloat(paidAmount) || 0;
                  if (e.key === 'ArrowUp' || e.code === 'NumpadAdd') {
                    e.preventDefault();
                    setPaidAmount((val + 10).toString());
                  } else if (e.key === '+') {
                    e.preventDefault();
                    handleCheckout(false, false);
                  } else if (e.key === 'ArrowDown' || e.key === '-' || e.code === 'NumpadSubtract') {
                    e.preventDefault();
                    setPaidAmount(Math.max(0, val - 10).toString());
                  } else if ((e.key === 'Enter' || e.code === 'NumpadEnter') && e.shiftKey) {
                    e.preventDefault();
                    handleCheckout(false, false);
                  } else if (e.key === 'Enter' || e.code === 'NumpadEnter') {
                    e.preventDefault();
                    document.getElementById('btn-checkout-print')?.focus();
                  } else if (e.key === 'F9') {
                    e.preventDefault();
                    handleCheckout(false, true);
                  }
                }}
                placeholder={grandTotal.toString()}
                value={paidAmount}
                onChange={(e) => {
                   let valStr = parseArabicNumbers(e.target.value);
                   valStr = valStr.replace(/[^0-9.-]/g, '');
                   setPaidAmount(valStr);
                }}
                className="w-full px-4 py-3 bg-[#1e293b] border border-[#334155] rounded-xl text-white font-mono text-lg font-bold text-center"
              />
              {parseFloat(paidAmount) > 0 && (
                <div className={cn("mt-3 p-3 rounded-xl border text-center flex flex-col items-center justify-center", (parseFloat(paidAmount) || 0) >= grandTotal ? "bg-emerald-900/20 border-emerald-500/30" : "bg-rose-900/20 border-rose-500/30")}>
                  <span className="text-xs font-bold text-slate-400 mb-1">
                    {(parseFloat(paidAmount) || 0) >= grandTotal ? 'الباقي للعميل' : 'المبلغ المتبقي المطلوب'}
                  </span>
                  <span className={cn("font-mono text-xl font-black", (parseFloat(paidAmount) || 0) >= grandTotal ? "text-emerald-400" : "text-rose-400")}>
                    {formatCurrency(Math.abs((parseFloat(paidAmount) || 0) - grandTotal))}
                  </span>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <button 
                id="btn-checkout-print"
                onClick={() => handleCheckout(true, false)} 
                className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-xl text-sm focus:ring-4 focus:ring-blue-500/50 outline-none flex justify-center items-center gap-2"
                onKeyDown={(e) => {
                   if (e.key === 'ArrowRight') document.getElementById('btn-checkout-noprint')?.focus();
                   if (e.key === 'ArrowDown') document.getElementById('btn-checkout-whatsapp')?.focus();
                }}
              >
                تأكيد وطباعة الإيصال (Enter)
              </button>
              
              <div className="flex gap-2">
                <button 
                  id="btn-checkout-noprint"
                  onClick={() => handleCheckout(false, false)} 
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs focus:ring-4 focus:ring-emerald-500/50 outline-none"
                  onKeyDown={(e) => {
                     if (e.key === 'ArrowLeft') document.getElementById('btn-checkout-print')?.focus();
                     if (e.key === 'ArrowRight') document.getElementById('btn-checkout-whatsapp')?.focus();
                  }}
                >
                  بدون طباعة (Shift+Enter)
                </button>
                <button 
                  id="btn-checkout-whatsapp"
                  onClick={() => handleCheckout(false, true)} 
                  className="flex-1 py-2.5 bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl text-xs focus:ring-4 focus:ring-green-500/50 outline-none"
                  onKeyDown={(e) => {
                     if (e.key === 'ArrowLeft') document.getElementById('btn-checkout-noprint')?.focus();
                  }}
                >
                  إرسال واتساب (F9)
                </button>
              </div>
              
              <button 
                onClick={() => setIsPaymentModalOpen(false)} 
                className="w-full mt-1 py-2 bg-[#1e293b] hover:bg-[#334155] text-slate-300 font-bold rounded-xl text-xs"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Customer Picker Modal */}
      {isCustomerModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#151b2b] w-full max-w-md rounded-3xl border border-[#1e293b] p-5 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-[#1e293b] pb-3">
               <h3 className="font-bold text-white text-sm">اختيار العميل (F2)</h3>
               <button onClick={() => setIsCustomerModalOpen(false)} className="text-slate-500 hover:text-white">✕</button>
            </div>
            
            <input 
              type="text"
              autoFocus
              placeholder="ابحث باسم العميل أو رقم الهاتف..."
              className="w-full px-4 py-2.5 bg-[#0b0f17] border border-[#334155] rounded-xl text-white text-sm focus:border-blue-500 focus:outline-none transition-colors"
              value={customerSearchQuery}
              onChange={(e) => setCustomerSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                 if (e.key === 'Enter') {
                   const filtered = customers.filter(c => 
                     c.name.toLowerCase().includes(customerSearchQuery.toLowerCase()) || 
                     (c.phone && c.phone.includes(customerSearchQuery))
                   );
                   if (filtered.length > 0) {
                     setSelectedCustomer(filtered[0]);
                     setIsCustomerModalOpen(false);
                     setCustomerSearchQuery('');
                   }
                 }
              }}
            />

            <div className="max-h-64 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
              <div className="bg-[#1e293b] rounded-xl border border-[#334155] border-dashed overflow-hidden mb-3">
                <button 
                  onClick={() => { 
                    setSelectedCustomer(null); 
                    setIsCustomerModalOpen(false); 
                    setCustomerSearchQuery('');
                  }} 
                  className="w-full text-right p-3 hover:bg-slate-800 text-white text-xs font-bold transition-colors"
                >
                  عميل نقدي مباشر
                </button>
                {isLoyaltyEnabled && (
                  <div className="px-3 pb-3 pt-1 border-t border-[#334155]/50 flex items-center gap-2">
                    <span className="text-[10px] text-slate-400 whitespace-nowrap">هاتف العميل (للنقاط):</span>
                    <input
                      type="tel"
                      dir="ltr"
                      placeholder="اختياري (01xxxxxxxxx)"
                      value={cashCustomerPhone}
                      onChange={(e) => setCashCustomerPhone(e.target.value.replace(/\D/g, ''))}
                      className="flex-1 bg-[#0b0f17] border border-[#334155] rounded text-white text-xs px-2 py-1.5 focus:outline-none focus:border-blue-500 font-mono"
                    />
                  </div>
                )}
              </div>

              {customers.filter(c => 
                c.name.toLowerCase().includes(customerSearchQuery.toLowerCase()) || 
                (c.phone && c.phone.includes(customerSearchQuery))
              ).map(c => (
                <button 
                  key={c.id} 
                  onClick={() => { 
                    setSelectedCustomer(c); 
                    setIsCustomerModalOpen(false); 
                    setCustomerSearchQuery('');
                  }} 
                  className="w-full text-right p-3 bg-[#1e293b] hover:bg-blue-900/30 text-white rounded-xl text-xs flex justify-between items-center transition-colors border border-transparent hover:border-blue-500/30"
                >
                  <div className="flex flex-col gap-1">
                    <span className="font-bold">{c.name}</span>
                    {c.phone && <span className="text-slate-400 font-mono text-[10px]">{c.phone}</span>}
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="font-mono text-blue-400 font-bold">{formatCurrency(c.currentBalance)}</span>
                    <span className="text-slate-500 text-[10px]">الرصيد الحالي</span>
                  </div>
                </button>
              ))}
              {customers.filter(c => 
                c.name.toLowerCase().includes(customerSearchQuery.toLowerCase()) || 
                (c.phone && c.phone.includes(customerSearchQuery))
              ).length === 0 && (
                <div className="text-center text-slate-500 text-xs py-6">لا يوجد عملاء يطابقون البحث</div>
              )}
            </div>
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
              type="text"
              inputMode="decimal"
              dir="ltr"
              autoFocus
              onFocus={(e) => e.target.select()}
              onKeyDown={(e) => {
                let val = parseFloat(qtyInput) || 0;
                if (e.key === 'ArrowUp' || e.key === '+' || e.code === 'NumpadAdd') {
                  e.preventDefault();
                  setQtyInput((val + 1).toString());
                } else if (e.key === 'ArrowDown' || e.key === '-' || e.code === 'NumpadSubtract') {
                  e.preventDefault();
                  setQtyInput(Math.max(1, val - 1).toString());
                } else if (e.key === 'Enter' || e.code === 'NumpadEnter') {
                  e.preventDefault();
                  if (val > 0 && selectedCartIndex !== null && cart[selectedCartIndex]) {
                    setCart(prev => {
                      const updated = [...prev];
                      updated[selectedCartIndex].quantity = val;
                      return updated;
                    });
                  }
                  setIsQtyModalOpen(false);
                }
              }}
              value={qtyInput}
              onChange={(e) => {
                 let valStr = parseArabicNumbers(e.target.value);
                 valStr = valStr.replace(/[^0-9.-]/g, '');
                 setQtyInput(valStr);
              }}
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
                type="text"
                inputMode="decimal"
                dir="ltr"
                autoFocus
                onFocus={(e) => e.target.select()}
                onKeyDown={(e) => {
                  let val = parseFloat(discountPercentInput) || 0;
                  if (e.key === 'ArrowUp' || e.key === '+' || e.code === 'NumpadAdd') {
                    e.preventDefault();
                    setDiscountPercentInput((val + 1).toString());
                  } else if (e.key === 'ArrowDown' || e.key === '-' || e.code === 'NumpadSubtract') {
                    e.preventDefault();
                    setDiscountPercentInput(Math.max(0, val - 1).toString());
                  } else if (e.key === 'Enter' || e.code === 'NumpadEnter') {
                    e.preventDefault();
                    applyDiscountToCart(val);
                  }
                }}
                value={discountPercentInput}
                onChange={(e) => {
                   let valStr = parseArabicNumbers(e.target.value);
                   valStr = valStr.replace(/[^0-9.-]/g, '');
                   setDiscountPercentInput(valStr);
                }}
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
                type="text"
                inputMode="decimal"
                dir="ltr"
                autoFocus
                onFocus={(e) => e.target.select()}
                onKeyDown={(e) => {
                  let val = openingFloat || 0;
                  if (e.key === 'ArrowUp' || e.key === '+' || e.code === 'NumpadAdd') {
                    e.preventDefault();
                    setOpeningFloat(val + 50);
                  } else if (e.key === 'ArrowDown' || e.key === '-' || e.code === 'NumpadSubtract') {
                    e.preventDefault();
                    setOpeningFloat(Math.max(0, val - 50));
                  } else if (e.key === 'Enter' || e.code === 'NumpadEnter') {
                    e.preventDefault();
                    handleOpenSession();
                  }
                }}
                className="w-full px-4 py-2.5 bg-[#1e293b] border border-[#334155] rounded-xl text-white font-mono text-lg font-bold text-center"
                value={openingFloat}
                onChange={(e) => {
                   const valStr = parseArabicNumbers(e.target.value).replace(/[^0-9.-]/g, '');
                   setOpeningFloat(parseFloat(valStr) || 0);
                }}
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
                type="text"
                inputMode="decimal"
                dir="ltr"
                autoFocus
                onFocus={(e) => e.target.select()}
                onKeyDown={(e) => {
                  let val = closingCashCount || 0;
                  if (e.key === 'ArrowUp' || e.key === '+' || e.code === 'NumpadAdd') {
                    e.preventDefault();
                    setClosingCashCount(val + 50);
                  } else if (e.key === 'ArrowDown' || e.key === '-' || e.code === 'NumpadSubtract') {
                    e.preventDefault();
                    setClosingCashCount(Math.max(0, val - 50));
                  } else if (e.key === 'Enter' || e.code === 'NumpadEnter') {
                    e.preventDefault();
                    handleCloseSession();
                  }
                }}
                className="w-full px-4 py-2.5 bg-[#1e293b] border border-[#334155] rounded-xl text-white font-mono text-lg font-bold text-center"
                value={closingCashCount}
                onChange={(e) => {
                   const valStr = parseArabicNumbers(e.target.value).replace(/[^0-9.-]/g, '');
                   setClosingCashCount(parseFloat(valStr) || 0);
                }}
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

      {/* Restaurant Meal Modifiers Modal */}
      {selectedModifierItem && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#151b2b] w-full max-w-md rounded-3xl border border-purple-500/40 p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-[#1e293b] pb-3">
              <div className="flex items-center gap-2 text-purple-400 font-bold text-sm">
                <Utensils size={18} />
                <span>تعديل وإضافات وجبة: {selectedModifierItem.name}</span>
              </div>
              <button onClick={() => setSelectedModifierItem(null)} className="text-slate-500 hover:text-white">✕</button>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400">اختر الإضافات والملاحظات للمطبخ:</label>
              <div className="grid grid-cols-2 gap-2">
                {['بدون بصل', 'جبنة مضاعفة (+15 ج.م)', 'حجم عائلي (+25 ج.م)', 'سبايسي حار جداً', 'صوص إضافي (+10 ج.م)', 'سفري بديل محلي'].map(mod => {
                  const currentMods = activeModifiers[selectedModifierItem.productId] || [];
                  const isSelected = currentMods.includes(mod);
                  return (
                    <button
                      key={mod}
                      onClick={() => {
                        setActiveModifiers(prev => {
                          const existing = prev[selectedModifierItem.productId] || [];
                          const updated = existing.includes(mod) ? existing.filter(m => m !== mod) : [...existing, mod];
                          return { ...prev, [selectedModifierItem.productId]: updated };
                        });
                      }}
                      className={cn(
                        "p-2.5 rounded-xl font-bold text-xs border text-right transition-all flex items-center justify-between",
                        isSelected ? "bg-purple-600/30 text-purple-300 border-purple-500" : "bg-[#1e293b] text-slate-400 border-[#334155]"
                      )}
                    >
                      <span>{mod}</span>
                      {isSelected && <Check size={14} className="text-purple-400" />}
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              onClick={() => {
                showToast(`تم حفظ تعديلات الوجبة إلكترونياً إعداداً للطباعة بالمطبخ`);
                setSelectedModifierItem(null);
              }}
              className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-purple-600/20"
            >
              حفظ الملاحظات والإضافات
            </button>
          </div>
        </div>
      )}

      {/* Pharmacy Substitute Finder Modal */}
      {selectedSubstituteProduct && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#151b2b] w-full max-w-lg rounded-3xl border border-rose-500/40 p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-[#1e293b] pb-3">
              <div className="flex items-center gap-2 text-rose-400 font-bold text-sm">
                <Pill size={18} />
                <span>البدائل الدوائية المتاحة لـ: {selectedSubstituteProduct.name}</span>
              </div>
              <button onClick={() => setSelectedSubstituteProduct(null)} className="text-slate-500 hover:text-white">✕</button>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              الأدوية البديلة التالية تحتوي على نفس المادة الفعالة والتركيز وتعتبر بديل طبّي معتمد:
            </p>

            <div className="space-y-2 max-h-64 overflow-y-auto">
              {products.filter(p => p.id !== selectedSubstituteProduct.id).slice(0, 3).map(alt => (
                <div key={alt.id} className="p-3 bg-[#1e293b] rounded-2xl border border-rose-500/20 flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-white text-xs">{alt.name}</h4>
                    <span className="text-[10px] text-emerald-400 font-mono">مخزون: {alt.quantity} علبة | السعر: {formatCurrency(alt.price)}</span>
                  </div>
                  <button
                    onClick={() => {
                      addToCart(alt, 1);
                      setSelectedSubstituteProduct(null);
                      showToast(`تم إضافة البديل الدوائي [${alt.name}] للسلة`);
                    }}
                    className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold shadow"
                  >
                    استبدال وإضافة
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Global POS Function Keys & Smart Keyboard Toolbar Bar */}
      <FunctionKeyBar 
        onExecuteKey={(key, actionId) => executePOSAction(actionId)} 
        activeInputType="numeric"
      />
    </div>
  );
};
