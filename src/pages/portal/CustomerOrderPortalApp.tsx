/**
 * @file CustomerOrderPortalApp.tsx
 * @module واجهات وصفحات النظام (UI Pages)
 * @description ملف جزء من نظام MARO ERP. الوظيفة: CustomerOrderPortalApp.tsx.
 */
import React, { useState, useEffect, useMemo } from 'react';
import { 
  ShoppingBag, 
  Search, 
  Plus, 
  Minus, 
  Trash2, 
  CheckCircle2, 
  Phone, 
  MapPin, 
  Clock, 
  CreditCard, 
  Send, 
  Sparkles, 
  ArrowRight, 
  ArrowLeft, 
  Receipt, 
  Store, 
  Check, 
  AlertCircle,
  PackageCheck,
  Printer,
  ChevronRight,
  Filter,
  X,
  Compass,
  UtensilsCrossed,
  Zap,
  Barcode,
  UserCheck,
  LogIn,
  LogOut,
  KeyRound,
  Mic,
  MicOff,
  Copy
} from 'lucide-react';
import { CustomerPortalService } from '../../services/customerPortalService';
import { CustomerRepository } from '../../repositories/customerRepository';
import { toast } from 'react-hot-toast';
import { 
  CustomerPortalOrder, 
  CustomerPortalOrderItem, 
  PortalStoreSettings 
} from '../../types/customerPortal';
import { ProductMaster } from '../../types/productMaster';
import { Customer } from '../../types/sprint8';
import { formatCurrency, cn, playSystemChime } from '../../lib/utils';

interface CartItem {
  product: ProductMaster;
  unitName: string;
  unitMultiplier: number;
  unitPrice: number;
  quantity: number;
  notes?: string;
}

interface Props {
  isSimulator?: boolean;
}

export const CustomerOrderPortalApp: React.FC<Props> = ({ isSimulator = false }) => {
  const [settings, setSettings] = useState<PortalStoreSettings>(CustomerPortalService.getStoreSettings());
  const [catalog, setCatalog] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState<'CART' | 'CUSTOMER_INFO' | 'CONFIRMATION' | 'SUCCESS'>('CART');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastSubmittedOrder, setLastSubmittedOrder] = useState<CustomerPortalOrder | null>(null);

  // Customer Login & Session
  const [loggedCustomer, setLoggedCustomer] = useState<Customer | null>(CustomerPortalService.getPortalCustomerSession());
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'LOGIN' | 'REGISTER'>('LOGIN');
  const [authPhone, setAuthPhone] = useState('');
  const [authPin, setAuthPin] = useState('');
  const [authName, setAuthName] = useState('');
  const [authAddress, setAuthAddress] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);

  // Form Fields
  const [customerName, setCustomerName] = useState(loggedCustomer?.name || '');
  const [phone, setPhone] = useState(loggedCustomer?.phone || '');
  const [deliveryAddress, setDeliveryAddress] = useState((loggedCustomer as any)?.address || '');
  const [city, setCity] = useState((loggedCustomer as any)?.city || 'المركز الرئيسي');
  const [deliveryLocationLink, setDeliveryLocationLink] = useState((loggedCustomer as any)?.deliveryLocationLink || '');
  const [isLocating, setIsLocating] = useState(false);
  const [deliveryDate, setDeliveryDate] = useState(new Date().toISOString().split('T')[0]);
  const [deliveryTime, setDeliveryTime] = useState('صباحاً (9:00 ص - 2:00 م)');
  const [paymentMethod, setPaymentMethod] = useState<CustomerPortalOrder['paymentMethod']>('COD');
  const [customerNotes, setCustomerNotes] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Session Restore & Tracking states
  const [isDraftRestored, setIsDraftRestored] = useState(false);
  const [hasBackup, setHasBackup] = useState(false);
  const [trackOrderNumber, setTrackOrderNumber] = useState('');
  const [trackedOrder, setTrackedOrder] = useState<CustomerPortalOrder | null>(null);
  const [trackError, setTrackError] = useState<string | null>(null);
  const [isTrackingSearched, setIsTrackingSearched] = useState(false);
  const [isTrackingOpen, setIsTrackingOpen] = useState(false);

  // Voice Assistant States & Handlers
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [voiceFeedbackMessage, setVoiceFeedbackMessage] = useState<string | null>(null);

  const startVoiceRecognition = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error('متصفحك لا يدعم التعرف الصوتي المباشر. يمكنك استخدام أزرار الأوامر السريعة أدناه.');
      setIsVoiceModalOpen(true);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'ar-EG';
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
        setTranscript('جاري الاستماع... تحدث الآن (مثال: أضف ثلاثة عصير أو 2 زيت)...');
        playSystemChime('confirm');
      };

      recognition.onresult = (event: any) => {
        const current = event.resultIndex;
        const text = event.results[current][0].transcript;
        setTranscript(text);
        if (event.results[current].isFinal) {
          processVoiceCommand(text);
        }
      };

      recognition.onerror = () => {
        setIsListening(false);
        setVoiceFeedbackMessage('حدث خطأ في التعرف الصوتي. يرجى المحاولة مرة أخرى.');
        playSystemChime('error');
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (e: any) {
      setIsListening(false);
      toast.error('تعذر تشغيل الميكروفون: ' + (e.message || ''));
      setIsVoiceModalOpen(true);
    }
  };

  const handlePrintReceipt = () => {
    if (!lastSubmittedOrder) return;
    const printWindow = window.open('', '_blank', 'width=400,height=600');
    if (!printWindow) {
      toast.error('يرجى السماح بفتح النوافذ المنبثقة للطباعة');
      return;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="ar" dir="rtl">
      <head>
        <meta charset="UTF-8">
        <title>إيصال حراري - طلب #${lastSubmittedOrder.orderNumber}</title>
        <style>
          body {
            font-family: 'Tahoma', 'Cairo', sans-serif;
            font-size: 12px;
            width: 80mm;
            margin: 0 auto;
            padding: 10px;
            background: #fff;
            color: #000;
          }
          .text-center { text-align: center; }
          .font-bold { font-weight: bold; }
          .border-b { border-bottom: 1px dashed #000; padding-bottom: 5px; margin-bottom: 5px; }
          .flex { display: flex; justify-content: space-between; }
          table { width: 100%; border-collapse: collapse; margin-top: 5px; }
          th, td { font-size: 11px; text-align: right; padding: 3px 0; }
          th { border-bottom: 1px solid #000; }
          .total { font-size: 14px; font-weight: bold; margin-top: 10px; text-align: left; }
        </style>
      </head>
      <body>
        <div class="text-center border-b">
          <h3>MARO ERP - طلب مبيعات العميل</h3>
          <p>${settings.storeName || 'مارو للأنظمة التجارية المتكاملة'}</p>
          <p>تاريخ الطلب: ${new Date(lastSubmittedOrder.createdAt).toLocaleString('ar-EG')}</p>
        </div>
        <div class="border-b">
          <p><strong>رقم الطلب:</strong> ${lastSubmittedOrder.orderNumber}</p>
          <p><strong>العميل:</strong> ${lastSubmittedOrder.customerName}</p>
          <p><strong>الهاتف:</strong> ${lastSubmittedOrder.phone}</p>
          <p><strong>العنوان:</strong> ${lastSubmittedOrder.deliveryAddress}</p>
        </div>
        <table>
          <thead>
            <tr>
              <th>المنتج</th>
              <th>الكمية</th>
              <th>السعر</th>
              <th>الإجمالي</th>
            </tr>
          </thead>
          <tbody>
            ${lastSubmittedOrder.items.map(item => `
              <tr>
                <td>${item.productName}</td>
                <td>${item.quantity}</td>
                <td>${item.unitPrice.toFixed(2)}</td>
                <td>${item.lineTotal.toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <div class="border-b" style="margin-top: 10px;"></div>
        <div class="flex">
          <span>الإجمالي النهائي:</span>
          <strong>${formatCurrency(lastSubmittedOrder.grandTotal)}</strong>
        </div>
        <div class="text-center border-b" style="margin-top: 15px;">
          <p>شكراً لتعاملكم معنا - MARO ERP</p>
        </div>
        <script>
          window.onload = function() {
            window.print();
          };
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
    playSystemChime('success');
  };

  const processVoiceCommand = (spokenText: string) => {
    const clean = spokenText.trim().toLowerCase();
    setTranscript(clean);

    const arabicWordsToNum: Record<string, number> = {
      'واحد': 1, 'واحدة': 1, 'اول': 1,
      'اتنين': 2, 'إتنين': 2, 'تنين': 2, 'اثنان': 2, 'اثنين': 2, '2': 2,
      'تلاتة': 3, 'ثلاثة': 3, 'تلات': 3, 'ثلاث': 3, '3': 3,
      'أربعة': 4, 'اربعة': 4, 'أربع': 4, 'اربع': 4, '4': 4,
      'خمسة': 5, 'خمس': 5, '5': 5,
      'ستة': 6, 'ست': 6, '6': 6,
      'سبعة': 7, 'سبع': 7, '7': 7,
      'ثمانية': 8, 'ثمان': 8, '8': 8,
      'تسعة': 9, 'تسع': 9, '9': 9,
      'عشرة': 10, 'عشر': 10, '10': 10
    };

    const englishWordsToNum: Record<string, number> = {
      'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5,
      'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10
    };

    let qty = 1;
    let remaining = clean;

    const digitMatch = clean.match(/(\d+|[٠١٢٣٤٥٦٧٨٩]+)/);
    if (digitMatch) {
      const rawNum = digitMatch[1];
      const westernNum = rawNum.replace(/[٠-٩]/g, d => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)));
      qty = parseInt(westernNum, 10) || 1;
      remaining = clean.replace(rawNum, '').trim();
    } else {
      const words = clean.split(/\s+/);
      for (const w of words) {
        if (arabicWordsToNum[w] !== undefined) {
          qty = arabicWordsToNum[w];
          remaining = remaining.replace(w, '').trim();
          break;
        }
        if (englishWordsToNum[w] !== undefined) {
          qty = englishWordsToNum[w];
          remaining = remaining.replace(w, '').trim();
          break;
        }
      }
    }

    remaining = remaining
      .replace(/^(أضف|اضف|ضيف|عايز|اريد|أريد|هات|من فضلك|لو سمحت|add|please|i want|بدي|عاوز)\s*/gi, '')
      .replace(/(إلى السلة|للسلة|السلة|to cart|cart)/gi, '')
      .trim();

    let matchedProduct = catalog.find(p => 
      p.name.toLowerCase().includes(remaining) || 
      remaining.includes(p.name.toLowerCase()) ||
      p.sku.toLowerCase() === remaining
    );

    if (!matchedProduct && remaining.length > 0) {
      matchedProduct = catalog.find(p => {
        const pName = p.name.toLowerCase();
        return pName.split(' ').some(word => remaining.includes(word) && word.length > 2);
      });
    }

    if (!matchedProduct && catalog.length > 0) {
      matchedProduct = catalog[0];
    }

    if (matchedProduct) {
      for (let i = 0; i < qty; i++) {
        addToCart(matchedProduct);
      }
      playSystemChime('success');
      setVoiceFeedbackMessage(`✅ تم إضافة (${qty}x) من المنتج "${matchedProduct.name}" إلى السلة بنجاح!`);
      toast.success(
        <div className="flex flex-col text-right font-sans">
          <span className="font-black text-xs text-white">🎙️ أمر صوتي ناجح!</span>
          <span className="text-[10px] text-slate-300 mt-0.5">تم إضافة {qty}x {matchedProduct.name}</span>
        </div>,
        { duration: 4000 }
      );
    } else {
      playSystemChime('warning');
      setVoiceFeedbackMessage(`⚠️ لم يتم العثور على منتج يطابق "${remaining}". حاول نطق اسم المنتج بوضوح.`);
    }
  };

  // Auto-restore complete draft (cart + form data) on mount
  useEffect(() => {
    loadCatalog();
    
    let restoredAny = false;
    const savedDraft = localStorage.getItem('MARO_PORTAL_DRAFT_STATE');
    
    if (savedDraft) {
      try {
        const draft = JSON.parse(savedDraft);
        if (draft && typeof draft === 'object') {
          if (Array.isArray(draft.cart) && draft.cart.length > 0) {
            setCart(draft.cart);
            restoredAny = true;
          }
          if (draft.customerName) setCustomerName(draft.customerName);
          if (draft.phone) setPhone(draft.phone);
          if (draft.deliveryAddress) setDeliveryAddress(draft.deliveryAddress);
          if (draft.city) setCity(draft.city);
          if (draft.deliveryLocationLink) setDeliveryLocationLink(draft.deliveryLocationLink);
          if (draft.deliveryDate) setDeliveryDate(draft.deliveryDate);
          if (draft.deliveryTime) setDeliveryTime(draft.deliveryTime);
          if (draft.paymentMethod) setPaymentMethod(draft.paymentMethod);
          if (draft.customerNotes) setCustomerNotes(draft.customerNotes);
          if (draft.checkoutStep && ['CART', 'CUSTOMER_INFO', 'CONFIRMATION'].includes(draft.checkoutStep)) {
            setCheckoutStep(draft.checkoutStep);
          }
        }
      } catch (e) {
        console.warn('Failed to parse portal draft state:', e);
      }
    } else {
      // Fallback to legacy MARO_PORTAL_CART_BACKUP
      const legacyBackup = localStorage.getItem('MARO_PORTAL_CART_BACKUP');
      if (legacyBackup) {
        try {
          const parsed = JSON.parse(legacyBackup);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setCart(parsed);
            restoredAny = true;
          }
        } catch (e) {}
      }
    }

    if (restoredAny) {
      toast.success('⚡ تم استرجاع محتويات السلة والبيانات غير المكتملة تلقائياً من الجلسة السابقة!', {
        duration: 4500,
        icon: '🛒'
      });
    }

    setIsDraftRestored(true);
  }, []);

  // Update form fields when logged customer changes
  useEffect(() => {
    if (loggedCustomer) {
      setCustomerName(loggedCustomer.name);
      setPhone(loggedCustomer.phone || '');
      if ((loggedCustomer as any).address) {
        setDeliveryAddress((loggedCustomer as any).address);
      }
      if ((loggedCustomer as any).city) {
        setCity((loggedCustomer as any).city);
      }
      if ((loggedCustomer as any).deliveryLocationLink) {
        setDeliveryLocationLink((loggedCustomer as any).deliveryLocationLink);
      }
    }
  }, [loggedCustomer]);

  const handleCustomerLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    const res = CustomerPortalService.authenticateCustomer(authPhone, authPin);
    if (res.success && res.customer) {
      setLoggedCustomer(res.customer);
      setIsAuthModalOpen(false);
    } else {
      setAuthError(res.error || 'تعذر تسجيل الدخول');
    }
  };

  const handleCustomerRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    const res = await CustomerPortalService.registerPortalCustomer({
      name: authName,
      phone: authPhone,
      address: authAddress,
      password: authPin
    });
    if (res.success && res.customer) {
      setLoggedCustomer(res.customer);
      setIsAuthModalOpen(false);
    } else {
      setAuthError(res.error || 'تعذر إنشاء الحساب');
    }
  };

  const handleLogoutCustomer = () => {
    CustomerPortalService.setPortalCustomerSession(null);
    setLoggedCustomer(null);
    setCustomerName('');
    setPhone('');
    setDeliveryAddress('');
  };

  // Auto-sync cart and uncompleted form fields to localStorage automatically
  useEffect(() => {
    if (!isDraftRestored) return;

    const hasDataToSave = 
      cart.length > 0 || 
      customerName.trim() !== '' || 
      phone.trim() !== '' || 
      deliveryAddress.trim() !== '' ||
      customerNotes.trim() !== '';

    if (hasDataToSave && checkoutStep !== 'SUCCESS') {
      const draftState = {
        cart,
        customerName,
        phone,
        deliveryAddress,
        city,
        deliveryLocationLink,
        deliveryDate,
        deliveryTime,
        paymentMethod,
        customerNotes,
        checkoutStep,
        savedAt: new Date().toISOString()
      };
      localStorage.setItem('MARO_PORTAL_DRAFT_STATE', JSON.stringify(draftState));
      localStorage.setItem('MARO_PORTAL_CART_BACKUP', JSON.stringify(cart));
      setHasBackup(false);
    } else if (cart.length === 0 && checkoutStep === 'CART') {
      localStorage.removeItem('MARO_PORTAL_DRAFT_STATE');
      localStorage.removeItem('MARO_PORTAL_CART_BACKUP');
    }
  }, [
    isDraftRestored,
    cart,
    customerName,
    phone,
    deliveryAddress,
    city,
    deliveryLocationLink,
    deliveryDate,
    deliveryTime,
    paymentMethod,
    customerNotes,
    checkoutStep
  ]);

  const restoreSession = () => {
    const backup = localStorage.getItem('MARO_PORTAL_CART_BACKUP');
    if (backup) {
      try {
        const parsed = JSON.parse(backup);
        if (Array.isArray(parsed)) {
          setCart(parsed);
          setHasBackup(false);
        }
      } catch (e) {}
    }
  };

  const handleTrackOrder = (e: React.FormEvent) => {
    e.preventDefault();
    setTrackError(null);
    setIsTrackingSearched(true);
    
    const orders = CustomerPortalService.getOrders();
    const cleanNum = trackOrderNumber.trim().toUpperCase();
    const found = orders.find(o => o.orderNumber.toUpperCase() === cleanNum || o.id === trackOrderNumber.trim());
    if (found) {
      setTrackedOrder(found);
    } else {
      setTrackedOrder(null);
      setTrackError('لم نجد أي طلب مسجل بهذا الرقم المرجعي. يرجى مراجعة الرقم وكتابته كاملاً (مثال: WEB-2026-00001).');
    }
  };

  const loadCatalog = () => {
    const products = CustomerPortalService.getPublicCatalog();
    setCatalog(products);
  };

  const categories = useMemo(() => {
    const cats = new Set<string>();
    catalog.forEach(p => {
      if (p.category) cats.add(p.category);
    });
    return ['ALL', ...Array.from(cats)];
  }, [catalog]);

  const filteredProducts = useMemo(() => {
    return catalog.filter(p => {
      const matchCat = selectedCategory === 'ALL' || p.category === selectedCategory;
      const matchQuery = !searchQuery.trim() || 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.barcode && p.barcode.includes(searchQuery));
      return matchCat && matchQuery;
    });
  }, [catalog, selectedCategory, searchQuery]);

  // Cart operations
  const addToCart = (product: ProductMaster, unitOption?: { name: string; multiplier: number; price: number }) => {
    const chosenUnit = unitOption || {
      name: (product as any).unit || (product.units?.[0]?.name) || 'قطعة',
      multiplier: 1,
      price: product.price || 0
    };

    setCart(prev => {
      const existingIdx = prev.findIndex(item => item.product.id === product.id && item.unitName === chosenUnit.name);
      if (existingIdx > -1) {
        const copy = [...prev];
        copy[existingIdx].quantity += 1;
        return copy;
      } else {
        return [...prev, {
          product,
          unitName: chosenUnit.name,
          unitMultiplier: chosenUnit.multiplier,
          unitPrice: chosenUnit.price,
          quantity: 1
        }];
      }
    });
  };

  const updateQuantity = (index: number, newQty: number) => {
    if (newQty <= 0) {
      removeFromCart(index);
      return;
    }
    setCart(prev => {
      const copy = [...prev];
      copy[index].quantity = newQty;
      return copy;
    });
  };

  const removeFromCart = (index: number) => {
    setCart(prev => prev.filter((_, i) => i !== index));
  };

  const clearCart = () => {
    setCart([]);
    setCheckoutStep('CART');
    localStorage.removeItem('MARO_PORTAL_DRAFT_STATE');
    localStorage.removeItem('MARO_PORTAL_CART_BACKUP');
  };

  // Calculations
  const subtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  }, [cart]);

  const taxAmount = useMemo(() => {
    return +(subtotal * (settings.defaultTaxRate / 100)).toFixed(2);
  }, [subtotal, settings.defaultTaxRate]);

  const shippingCost = useMemo(() => {
    if (subtotal >= settings.freeDeliveryThreshold || settings.deliveryFee === 0) return 0;
    return settings.deliveryFee;
  }, [subtotal, settings]);

  const grandTotal = useMemo(() => {
    return +(subtotal + taxAmount + shippingCost).toFixed(2);
  }, [subtotal, taxAmount, shippingCost]);

  const totalItemCount = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  }, [cart]);

  // Geolocation detection
  const handleDetectGPS = () => {
    if (!navigator.geolocation) {
      toast.error('مستعرض الويب الخاص بك لا يدعم تحديد المواقع GPS');
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const mapsLink = `https://www.google.com/maps?q=${latitude},${longitude}`;
        setDeliveryLocationLink(mapsLink);
        setIsLocating(false);
        
        // Play quick audio pitch-shift confirmation
        try {
          const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
          if (AudioContext) {
            const ctx = new AudioContext();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.type = 'sine';
            osc.frequency.setValueAtTime(600, ctx.currentTime);
            gain.gain.setValueAtTime(0.05, ctx.currentTime);
            osc.start();
            osc.frequency.setValueAtTime(900, ctx.currentTime + 0.1);
            gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.3);
            osc.stop(ctx.currentTime + 0.3);
          }
        } catch {}

        toast.success('تم تحديد موقعك الحالي بنجاح وإدراج رابط الخرائط!');
      },
      (error) => {
        console.warn('Geolocation error:', error);
        setIsLocating(false);
        toast.error('فشل تحديد الموقع. يرجى تفعيل إذن الوصول للموقع الجغرافي بالمستعرض أو إدخال الرابط يدوياً.');
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  // Save changes back to Customer Profile so they are permanently saved (ثابتة على السيستم)
  const handleSaveProfileChanges = async () => {
    if (!loggedCustomer) {
      toast.error('يرجى تسجيل الدخول أولاً لحفظ البيانات في ملفك الشخصي الدائم بالسيستم');
      return;
    }
    try {
      const updatedCustomer = {
        ...loggedCustomer,
        address: deliveryAddress.trim(),
        city: city.trim(),
        deliveryLocationLink: deliveryLocationLink.trim()
      };
      
      await CustomerRepository.saveCustomer(updatedCustomer as any);
      CustomerPortalService.setPortalCustomerSession(updatedCustomer as any);
      setLoggedCustomer(updatedCustomer as any);
      
      // Play success chime
      try {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContext) {
          const ctx = new AudioContext();
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.frequency.setValueAtTime(880, ctx.currentTime);
          gain.gain.setValueAtTime(0.05, ctx.currentTime);
          osc.start();
          gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.2);
          osc.stop(ctx.currentTime + 0.2);
        }
      } catch {}
      
      toast.success('تم حفظ وتثبيت عنوان وموقع التوصيل الافتراضي في حسابك بالسيستم بنجاح!');
    } catch (err: any) {
      toast.error(err.message || 'فشل حفظ البيانات بالسيستم');
    }
  };

  // Submit Order to Main ERP
  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!customerName.trim()) {
      setErrorMessage('يرجى كتابة اسم العميل أو اسم المتجر / المؤسسة');
      return;
    }
    if (!phone.trim()) {
      setErrorMessage('يرجى إدخال رقم هاتف للتواصل والتأكيد');
      return;
    }
    if (!deliveryAddress.trim()) {
      setErrorMessage('يرجى تحديد عنوان التوصيل بالتفصيل');
      return;
    }
    if (cart.length === 0) {
      setErrorMessage('سلة الطلبات فارغة!');
      return;
    }

    try {
      setIsSubmitting(true);
      const order = await CustomerPortalService.submitCustomerOrder({
        customerName,
        phone,
        deliveryAddress,
        city,
        deliveryLocationLink,
        preferredDeliveryDate: deliveryDate,
        preferredDeliveryTime: deliveryTime,
        paymentMethod,
        customerNotes,
        source: 'CUSTOMER_PORTAL',
        items: cart.map(item => ({
          productId: item.product.id,
          productName: item.product.name,
          sku: item.product.sku,
          unitName: item.unitName,
          unitMultiplier: item.unitMultiplier,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          taxRate: settings.defaultTaxRate,
          notes: item.notes
        }))
      });

      setLastSubmittedOrder(order);
      setCheckoutStep('SUCCESS');
      setCart([]);
      localStorage.removeItem('MARO_PORTAL_DRAFT_STATE');
      localStorage.removeItem('MARO_PORTAL_CART_BACKUP');
    } catch (err: any) {
      setErrorMessage(err.message || 'حدث خطأ أثناء إرسال الطلب');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendWhatsApp = () => {
    if (!lastSubmittedOrder) return;
    const currentSettings = CustomerPortalService.getStoreSettings();
    
    if (!currentSettings.whatsappPhone || currentSettings.whatsappPhone.trim() === '') {
      toast.error('عذراً، المتجر لم يقم بتهيئة رقم واتساب لاستقبال الطلبات بعد.');
      alert('لم يقم المتجر بتهيئة رقم واتساب حقيقي لاستقبال الطلبات.\n(إذا كنت مدير النظام، يرجى التوجه إلى: إدارة بوابة استقبال الطلبات -> إعدادات متجر وبوابة طلبات العملاء -> وتعديل "رقم الواتساب لاستقبال الطلبات")');
      return;
    }

    const msg = CustomerPortalService.generateCustomerWhatsAppMessage(lastSubmittedOrder);
    const link = CustomerPortalService.generateWhatsAppLink(currentSettings.whatsappPhone, msg);
    
    // Copy message to clipboard as a helpful fallback for mobile browsers
    navigator.clipboard?.writeText(msg).catch(() => {});
    
    const win = window.open(link, '_blank');
    if (!win) {
      window.location.href = link;
    }
  };

  const handleCopyWhatsAppText = () => {
    if (!lastSubmittedOrder) return;
    const msg = CustomerPortalService.generateCustomerWhatsAppMessage(lastSubmittedOrder);
    navigator.clipboard.writeText(msg).then(() => {
      toast.success('تم نسخ تفاصيل الطلب بنجاح! يمكنك لصقها مباشرة في الواتساب لأي رقم.');
    }).catch(() => {
      toast.error('تعذر النسخ تلقائياً');
    });
  };

  return (
    <div className={cn(
      "min-h-screen bg-[#0b0f19] text-white flex flex-col selection:bg-blue-600 selection:text-white",
      isSimulator ? "rounded-3xl border-4 border-slate-700 overflow-hidden shadow-2xl max-w-4xl mx-auto" : "w-full"
    )}>
      {/* Header Bar */}
      <header className="sticky top-0 z-40 bg-[#131927]/90 backdrop-blur-md border-b border-[#1e293b] px-4 py-3 sm:px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Store className="text-white" size={22} />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-black text-white leading-tight">
                {settings.storeName}
              </h1>
              <p className="text-[11px] text-slate-400 font-medium hidden sm:block">
                {settings.storeSubtitle}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {loggedCustomer ? (
              <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1.5 rounded-xl">
                <UserCheck size={16} className="text-emerald-400" />
                <div className="text-right hidden sm:block">
                  <p className="text-xs font-bold text-white leading-none">{loggedCustomer.name}</p>
                  <p className="text-[10px] text-emerald-400 font-mono mt-0.5">عميل مسجل</p>
                </div>
                <button
                  onClick={handleLogoutCustomer}
                  className="text-slate-400 hover:text-red-400 p-1 transition-colors"
                  title="تسجيل خروج"
                >
                  <LogOut size={14} />
                </button>
              </div>
            ) : (
              <button
                onClick={() => { setAuthMode('LOGIN'); setIsAuthModalOpen(true); }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 text-xs font-bold transition-all"
              >
                <LogIn size={14} />
                <span>دخول العميل المسجل</span>
              </button>
            )}

            <a 
              href={`tel:${settings.hotlinePhone}`}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-300 border border-slate-700 text-xs font-bold transition-all"
            >
              <Phone size={14} className="text-emerald-400" />
              <span>الخط الساخن: {settings.hotlinePhone}</span>
            </a>

            <button
              type="button"
              onClick={() => setIsVoiceModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-purple-600/30 to-indigo-600/30 hover:from-purple-600/40 hover:to-indigo-600/40 text-purple-300 border border-purple-500/30 text-xs font-bold transition-all active:scale-95 shadow-lg shadow-purple-950/20"
              title="الطلب الصوتي بالمايكروفون"
            >
              <Mic size={16} className="text-purple-400 animate-pulse" />
              <span className="hidden md:inline">الطلب الصوتي 🎙️</span>
            </button>

            {cart.length > 0 && (
              <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-bold" title="يتم حفظ السلة والبيانات تلقائياً في حالة انقطاع الاتصال أو تحديث الصفحة">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>حفظ تلقائي</span>
              </div>
            )}

            <button
              onClick={() => {
                setIsCartOpen(true);
                if (checkoutStep === 'SUCCESS') setCheckoutStep('CART');
              }}
              className="relative flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl font-black text-xs sm:text-sm shadow-lg shadow-blue-600/30 transition-all active:scale-95"
            >
              <ShoppingBag size={18} />
              <span>السلة</span>
              {totalItemCount > 0 && (
                <span className="bg-amber-400 text-slate-950 text-xs font-black px-2 py-0.5 rounded-full">
                  {totalItemCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* Banner */}
        <div className="relative overflow-hidden bg-gradient-to-r from-blue-900/40 via-indigo-900/30 to-purple-900/20 border border-blue-500/20 rounded-2xl p-5 sm:p-6">
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500/20 border border-blue-500/30 text-blue-400 text-[11px] font-black">
                <Sparkles size={12} />
                <span>طلب مباشر وتوريد فوري للشركات والمتاجر</span>
              </span>
              <h2 className="text-lg sm:text-xl font-black text-white">
                تصفح المنتجات وأرسل طلب الشراء مباشرة للسيستم
              </h2>
              <p className="text-xs text-slate-300 max-w-2xl">
                {settings.welcomeMessageAr}
              </p>
            </div>
            {settings.freeDeliveryThreshold > 0 && (
              <div className="bg-slate-900/80 border border-slate-700/60 rounded-xl p-3 text-center sm:text-left self-start sm:self-auto">
                <p className="text-[10px] text-slate-400 font-bold">عرض التوصيل المجاني</p>
                <p className="text-xs font-black text-emerald-400">للطلبات فوق {formatCurrency(settings.freeDeliveryThreshold)}</p>
              </div>
            )}
          </div>
        </div>

        {/* Restore Previous Session Prompt */}
        {hasBackup && cart.length === 0 && (
          <div className="bg-[#111625] border border-blue-500/30 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg shadow-blue-950/20 animate-in fade-in slide-in-from-top duration-300">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 text-blue-400 rounded-xl border border-blue-500/20">
                <ShoppingBag size={18} />
              </div>
              <div>
                <p className="text-xs font-black text-white">هل ترغب في استعادة أصناف سلتك الأخيرة؟</p>
                <p className="text-[11px] text-slate-400 mt-0.5">تم العثور على سلة تسوق محفوظة غير مكتملة من جلستك السابقة.</p>
              </div>
            </div>
            <button
              onClick={restoreSession}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-black shadow-md transition-all active:scale-95 whitespace-nowrap self-start sm:self-auto"
            >
              استعادة الجلسة السابقة
            </button>
          </div>
        )}

        {/* Real-Time Order Tracking Accordion */}
        <div className="bg-[#111625] border border-[#1e293b] rounded-2xl overflow-hidden transition-all duration-300">
          <button
            onClick={() => setIsTrackingOpen(!isTrackingOpen)}
            className="w-full px-5 py-4 flex items-center justify-between text-right hover:bg-[#131927] transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
                <PackageCheck size={18} />
              </div>
              <div>
                <h4 className="text-xs font-black text-white">تتبع حالة طلب الشراء</h4>
                <p className="text-[10px] text-slate-400 mt-0.5">استعلم عن حالة تجهيز وشحن طلبيتك الحالية برقم الطلب</p>
              </div>
            </div>
            <span className={cn(
              "text-xs font-bold px-3 py-1.5 rounded-lg border transition-all",
              isTrackingOpen ? "bg-amber-500/20 border-amber-500/30 text-amber-300" : "bg-[#151b2b] border-[#1e293b] text-slate-400"
            )}>
              {isTrackingOpen ? 'إغلاق نافذة التتبع' : 'افتح التتبع الآن'}
            </span>
          </button>

          {isTrackingOpen && (
            <div className="p-5 border-t border-[#1e293b] bg-[#131927]/40 space-y-4">
              <form onSubmit={handleTrackOrder} className="flex gap-2.5 max-w-xl">
                <input 
                  type="text"
                  placeholder="أدخل رقم الطلب المرجعي (مثال: WEB-2026-00001)..."
                  className="flex-1 px-4 py-2.5 bg-[#151b2b] border border-[#1e293b] rounded-xl text-xs text-white outline-none focus:border-blue-500 font-mono text-center tracking-wider placeholder:text-slate-500"
                  value={trackOrderNumber}
                  onChange={(e) => setTrackOrderNumber(e.target.value)}
                />
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-black text-xs rounded-xl shadow-md transition-all whitespace-nowrap"
                >
                  استعلم عن الحالة
                </button>
              </form>

              {trackError && (
                <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 p-3.5 rounded-xl">
                  {trackError}
                </div>
              )}

              {trackedOrder && (
                <div className="bg-[#151b2b] border border-[#1e293b] rounded-xl p-5 space-y-4 animate-in fade-in duration-200">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#1e293b]">
                    <div>
                      <span className="text-[10px] text-slate-500 font-bold block">الطلب المرجعي</span>
                      <strong className="text-sm text-blue-400 font-mono">{trackedOrder.orderNumber}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 font-bold block">تاريخ الطلب</span>
                      <strong className="text-xs text-white">{new Date(trackedOrder.createdAt).toLocaleString('ar-EG')}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 font-bold block">اسم العميل</span>
                      <strong className="text-xs text-white">{trackedOrder.customerName}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 font-bold block">الإجمالي الكلي</span>
                      <strong className="text-xs text-emerald-400 font-black">{formatCurrency(trackedOrder.grandTotal)}</strong>
                    </div>
                  </div>

                  {/* Real-Time Tracking Stepper Timeline */}
                  <div className="space-y-3">
                    <span className="text-[10px] text-slate-500 font-bold block mb-1">مسار حالة التوريد الفعلي:</span>
                    <div className="grid grid-cols-4 gap-2 relative">
                      {/* Connection lines */}
                      <div className="absolute top-4 left-[12%] right-[12%] h-0.5 bg-slate-800 -z-10"></div>
                      
                      {[
                        { 
                          label: 'طلب جديد', 
                          desc: 'بانتظار المراجعة',
                          active: true,
                          complete: true
                        },
                        { 
                          label: 'معتمد وجاري التجهيز', 
                          desc: 'في المستودع',
                          active: ['APPROVED', 'PREPARING', 'SHIPPED', 'DELIVERED', 'CONVERTED_TO_INVOICE'].includes(trackedOrder.status),
                          complete: ['APPROVED', 'PREPARING', 'SHIPPED', 'DELIVERED', 'CONVERTED_TO_INVOICE'].includes(trackedOrder.status)
                        },
                        { 
                          label: 'تم الشحن والتسليم الميداني', 
                          desc: 'مع السائق',
                          active: ['SHIPPED', 'DELIVERED', 'CONVERTED_TO_INVOICE'].includes(trackedOrder.status),
                          complete: ['SHIPPED', 'DELIVERED', 'CONVERTED_TO_INVOICE'].includes(trackedOrder.status)
                        },
                        { 
                          label: 'مكتمل بنجاح', 
                          desc: 'تم التسليم والتحصيل',
                          active: ['DELIVERED'].includes(trackedOrder.status),
                          complete: ['DELIVERED'].includes(trackedOrder.status)
                        }
                      ].map((step, idx) => (
                        <div key={idx} className="flex flex-col items-center text-center space-y-1">
                          <div className={cn(
                            "w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-black transition-all",
                            step.complete ? "bg-emerald-500/20 border-emerald-500 text-emerald-400" :
                            step.active ? "bg-blue-600/20 border-blue-500 text-blue-400 animate-pulse" :
                            "bg-slate-900 border-slate-800 text-slate-600"
                          )}>
                            {step.complete ? <Check size={14} /> : idx + 1}
                          </div>
                          <span className={cn(
                            "text-[10px] font-black block",
                            step.active ? "text-white" : "text-slate-500"
                          )}>{step.label}</span>
                          <span className="text-[9px] text-slate-500 block">{step.desc}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {trackedOrder.adminNotes && (
                    <div className="bg-blue-950/20 border border-blue-900/40 p-3 rounded-xl text-xs text-blue-300">
                      <span className="font-bold block mb-0.5">تحديثات لوحة التحكم والإدارة:</span>
                      {trackedOrder.adminNotes}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Search & Categories */}
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text"
              placeholder="ابحث بالاسم، كود الصنف (SKU)، أو الباركود..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pr-11 pl-4 py-3 bg-[#131927] border border-[#1e293b] rounded-2xl text-white text-sm focus:outline-none focus:border-blue-500 transition-all placeholder:text-slate-500 shadow-inner"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Category Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={cn(
                  "px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5",
                  selectedCategory === cat
                    ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
                    : "bg-[#131927] text-slate-400 hover:text-white border border-[#1e293b] hover:border-slate-700"
                )}
              >
                <span>{cat === 'ALL' ? 'جميع الأقسام' : cat}</span>
                {cat === 'ALL' && <span className="text-[10px] opacity-70">({catalog.length})</span>}
              </button>
            ))}
          </div>
        </div>

        {/* Product Catalog Grid */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-black text-slate-300 flex items-center gap-2">
              <span>الأصناف المتاحة للطلب</span>
              <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                {filteredProducts.length} صنف
              </span>
            </h3>
          </div>

          {filteredProducts.length === 0 ? (
            <div className="bg-[#131927] border border-[#1e293b] rounded-2xl p-12 text-center space-y-3">
              <PackageCheck size={48} className="mx-auto text-slate-600" />
              <p className="text-sm font-bold text-slate-400">لم يتم العثور على أصناف مطابقة لبحثك</p>
              <button 
                onClick={() => { setSearchQuery(''); setSelectedCategory('ALL'); }}
                className="text-xs text-blue-400 underline font-bold"
              >
                إعادة ضبط البحث
              </button>
            </div>
          ) : (
            <div className="flex sm:grid overflow-x-auto sm:overflow-visible pb-4 sm:pb-0 snap-x snap-mandatory gap-4 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-thin scrollbar-thumb-slate-800 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredProducts.map(p => {
                const stock = p.quantity || 0;
                const isOutOfStock = stock <= 0;
                const inCart = cart.filter(item => item.product.id === p.id);
                const totalInCart = inCart.reduce((sum, item) => sum + item.quantity, 0);

                // Dynamic vector icon based on product details
                const getCategoryIcon = (catName: string, prodName: string) => {
                  const nameLower = (prodName || '').toLowerCase();
                  const catLower = (catName || '').toLowerCase();
                  if (catLower.includes('سيراميك') || nameLower.includes('بلاط') || nameLower.includes('بورسلين') || nameLower.includes('صحي') || nameLower.includes('حوض') || nameLower.includes('خلاط')) {
                    return <Compass size={28} className="text-amber-400" />;
                  }
                  if (catLower.includes('غذائي') || catLower.includes('سوبر') || nameLower.includes('جبن') || nameLower.includes('زيت') || nameLower.includes('دقيق')) {
                    return <UtensilsCrossed size={28} className="text-emerald-400" />;
                  }
                  if (catLower.includes('كهربا') || nameLower.includes('شاشة') || nameLower.includes('سلك') || nameLower.includes('مصباح') || nameLower.includes('وصلة')) {
                    return <Zap size={28} className="text-blue-400" />;
                  }
                  return <ShoppingBag size={28} className="text-indigo-400" />;
                };

                return (
                  <div 
                    key={p.id}
                    className="bg-[#131927] border border-[#1e293b] hover:border-blue-500/40 rounded-2xl p-4 flex flex-col justify-between transition-all group hover:shadow-xl hover:shadow-blue-950/20 snap-center min-w-[280px] sm:min-w-0 flex-shrink-0 sm:flex-shrink"
                  >
                    <div>
                      {/* Image Placeholder with Hover Overlay */}
                      <div className="relative overflow-hidden h-28 rounded-xl bg-gradient-to-br from-[#101524] to-[#1e293b] border border-slate-800/50 mb-3 flex items-center justify-center group-hover:scale-[1.02] transition-all duration-300">
                        {/* Background subtle design */}
                        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-500 to-transparent"></div>
                        <div className="absolute top-2 right-2 flex items-center gap-1 bg-slate-950/60 backdrop-blur-md px-1.5 py-0.5 rounded-md text-[9px] text-slate-400 border border-slate-800 font-mono">
                          <Barcode size={10} className="text-blue-400" />
                          <span>{p.barcode || 'عام'}</span>
                        </div>
                        
                        {/* Vector Icon */}
                        <div className="relative flex flex-col items-center gap-1 transform group-hover:scale-95 transition-all duration-300">
                          {getCategoryIcon(p.category || '', p.name)}
                          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">{p.category || 'صنف عام'}</span>
                        </div>

                        {/* HOVER QUICK DETAILS OVERLAY */}
                        <div className="absolute inset-0 bg-[#0c101b]/95 backdrop-blur-sm p-3 flex flex-col justify-between opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-right">
                          <div>
                            <p className="text-[10px] font-black text-blue-400 mb-1">تفاصيل فنية سريعة:</p>
                            <p className="text-[10px] text-slate-300 leading-relaxed font-semibold line-clamp-3">
                              {p.description || `صنف متميز عالي الجودة ومعتمد للاستخدام والتوريد الفوري بمواصفات معيارية لقطاع ${p.category || 'العام'}.`}
                            </p>
                          </div>
                          <div className="flex justify-between items-center text-[9px] text-slate-500 border-t border-slate-800/60 pt-1.5">
                            <span>الباركود: {p.barcode || 'عام'}</span>
                            <span className="text-emerald-400 font-bold">متاح بالمخزن الفوري</span>
                          </div>
                        </div>
                      </div>

                      {/* Top Badges */}
                      <div className="flex items-center justify-between gap-2 mb-2.5">
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 border border-slate-700 font-mono">
                          {p.sku}
                        </span>
                        <span className="text-[10px] font-black px-2.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                          <CheckCircle2 size={11} />
                          <span>متوفر للطلب الفوري</span>
                        </span>
                      </div>

                      {/* Product Name & Category */}
                      <h4 className="text-sm font-black text-white group-hover:text-blue-400 transition-colors line-clamp-2">
                        {p.name}
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-1 mb-3">
                        {p.category || 'صنف عام'} {p.barcode ? `• باركود: ${p.barcode}` : ''}
                      </p>
                    </div>

                    {/* Price and Unit Options */}
                    <div className="space-y-3 pt-3 border-t border-[#1e293b]/70">
                      <div className="flex items-baseline justify-between">
                        <div>
                          <p className="text-lg font-black text-white">
                            {formatCurrency(p.price || 0)}
                          </p>
                          <span className="text-[10px] text-slate-500">للقطعة شامل الضريبة</span>
                        </div>
                        {totalInCart > 0 && (
                          <span className="px-2 py-0.5 text-xs font-black rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30">
                            في السلة: {totalInCart}
                          </span>
                        )}
                      </div>

                      {/* Action Buttons for Units */}
                      <div className="grid grid-cols-1 gap-1.5">
                        {p.unitOptions.map((unit: any) => (
                          <button
                            key={unit.name}
                            onClick={() => addToCart(p, unit)}
                            className="w-full flex items-center justify-between px-3 py-2 bg-slate-800/60 hover:bg-blue-600/20 hover:border-blue-500/40 text-slate-200 hover:text-blue-300 border border-slate-700/60 rounded-xl text-xs font-bold transition-all active:scale-95"
                          >
                            <span className="flex items-center gap-1.5">
                              <Plus size={14} className="text-blue-400" />
                              <span>إضافة {unit.name}</span>
                            </span>
                            <span className="text-white font-black">{formatCurrency(unit.price)}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Floating Bottom Cart Bar (if items in cart and drawer closed) */}
      {cart.length > 0 && !isCartOpen && (
        <div className="sticky bottom-4 z-30 max-w-xl mx-auto px-4 w-full">
          <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 p-3.5 rounded-2xl shadow-2xl shadow-blue-600/40 flex items-center justify-between text-white border border-blue-400/30 animate-in fade-in slide-in-from-bottom duration-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center font-black">
                {totalItemCount}
              </div>
              <div>
                <p className="text-xs font-bold text-blue-100">إجمالي سلة الطلبيات</p>
                <p className="text-base font-black text-white">{formatCurrency(grandTotal)}</p>
              </div>
            </div>
            <button
              onClick={() => {
                setIsCartOpen(true);
                setCheckoutStep('CART');
              }}
              className="flex items-center gap-2 px-5 py-2 bg-white text-slate-950 rounded-xl font-black text-xs hover:bg-slate-100 transition-all shadow-lg active:scale-95"
            >
              <span>متابعة الطلب والتأكيد</span>
              <ArrowLeft size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Cart & Checkout Drawer Modal */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex justify-end animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-[#131927] border-r border-[#1e293b] flex flex-col h-full shadow-2xl overflow-hidden">
            {/* Drawer Header */}
            <div className="p-4 border-b border-[#1e293b] flex items-center justify-between bg-slate-900/60">
              <div className="flex items-center gap-2">
                <ShoppingBag className="text-blue-400" size={20} />
                <h3 className="font-black text-white text-base">
                  {checkoutStep === 'CART' && 'سلة الطلبات والأصناف'}
                  {checkoutStep === 'CUSTOMER_INFO' && 'بيانات العميل والتسليم'}
                  {checkoutStep === 'SUCCESS' && 'تم تأكيد الطلب بنجاح'}
                </h3>
              </div>
              <button
                onClick={() => setIsCartOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Step: CART Items List */}
            {checkoutStep === 'CART' && (
              <div className="flex-1 flex flex-col justify-between overflow-hidden">
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {cart.length === 0 ? (
                    <div className="py-20 text-center space-y-3">
                      <ShoppingBag size={48} className="mx-auto text-slate-600" />
                      <p className="text-sm font-bold text-slate-400">سلة الطلبات فارغة</p>
                      <button
                        onClick={() => setIsCartOpen(false)}
                        className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl"
                      >
                        تصفح الأصناف الآن
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between text-xs text-slate-400 font-bold px-1">
                        <span>الأصناف المختارة ({cart.length})</span>
                        <button 
                          onClick={clearCart}
                          className="text-red-400 hover:text-red-300 flex items-center gap-1"
                        >
                          <Trash2 size={13} />
                          <span>إفراغ السلة</span>
                        </button>
                      </div>

                      {cart.map((item, idx) => (
                        <div 
                          key={`${item.product.id}-${item.unitName}`}
                          className="bg-[#182032] border border-[#1e293b] rounded-xl p-3.5 flex items-center justify-between gap-3"
                        >
                          <div className="flex-1 min-w-0">
                            <h5 className="text-xs font-bold text-white truncate">{item.product.name}</h5>
                            <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-1">
                              <span className="text-blue-400 font-black">{item.unitName}</span>
                              <span>•</span>
                              <span>{formatCurrency(item.unitPrice)} للوحدة</span>
                            </div>
                          </div>

                          {/* Stepper */}
                          <div className="flex items-center gap-2 bg-slate-900/80 border border-slate-700/60 rounded-xl p-1">
                            <button
                              onClick={() => updateQuantity(idx, item.quantity - 1)}
                              className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                            >
                              <Minus size={14} />
                            </button>
                            <span className="text-xs font-black text-white w-6 text-center">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(idx, item.quantity + 1)}
                              className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                            >
                              <Plus size={14} />
                            </button>
                          </div>

                          <div className="text-left min-w-[70px]">
                            <p className="text-xs font-black text-white">
                              {formatCurrency(item.quantity * item.unitPrice)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </>
                  )}
                </div>

                {/* Footer Totals & Proceed */}
                {cart.length > 0 && (
                  <div className="p-4 border-t border-[#1e293b] bg-slate-900/80 space-y-3">
                    <div className="space-y-1.5 text-xs text-slate-300">
                      <div className="flex justify-between">
                        <span>المجموع قبل الضريبة</span>
                        <span className="font-bold text-white">{formatCurrency(subtotal)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>ضريبة القيمة المضافة ({settings.defaultTaxRate}%)</span>
                        <span className="font-bold text-emerald-400">{formatCurrency(taxAmount)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>رسوم الشحن والتوصيل</span>
                        <span className="font-bold text-white">
                          {shippingCost === 0 ? 'مجاناً' : formatCurrency(shippingCost)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm font-black text-white pt-2 border-t border-slate-800">
                        <span>الإجمالي الكلي للطلب</span>
                        <span className="text-base text-blue-400">{formatCurrency(grandTotal)}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => setCheckoutStep('CUSTOMER_INFO')}
                      className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl font-black text-sm shadow-lg shadow-blue-600/30 transition-all active:scale-95"
                    >
                      <span>الانتقال لبيانات العميل والتوصيل</span>
                      <ArrowLeft size={16} />
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Step: CUSTOMER_INFO Form */}
            {checkoutStep === 'CUSTOMER_INFO' && (
              <form onSubmit={handleSubmitOrder} className="flex-1 flex flex-col justify-between overflow-hidden">
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {errorMessage && (
                    <div className="p-3 rounded-xl bg-red-500/20 border border-red-500/40 text-red-300 text-xs flex items-center gap-2">
                      <AlertCircle size={16} />
                      <span>{errorMessage}</span>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                      <span>اسم العميل / المؤسسة / المتجر</span>
                      <span className="text-red-400">*</span>
                    </label>
                    <input 
                      type="text"
                      required
                      placeholder="مثال: مؤسسة النور التجارية أو م/ أحمد علي"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-[#182032] border border-[#1e293b] rounded-xl text-white text-xs focus:outline-none focus:border-blue-500 transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                        <Phone size={13} className="text-emerald-400" />
                        <span>رقم الموبايل / الواتساب</span>
                        <span className="text-red-400">*</span>
                      </label>
                      <input 
                        type="tel"
                        required
                        placeholder="010XXXXXXXX"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-[#182032] border border-[#1e293b] rounded-xl text-white text-xs focus:outline-none focus:border-blue-500 transition-all"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-300">المدينة / المنطقة</label>
                      <input 
                        type="text"
                        placeholder="مثال: القاهرة / مدينة نصر"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-[#182032] border border-[#1e293b] rounded-xl text-white text-xs focus:outline-none focus:border-blue-500 transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                      <MapPin size={13} className="text-blue-400" />
                      <span>عنوان التسليم والمستودع بالتفصيل</span>
                      <span className="text-red-400">*</span>
                    </label>
                    <textarea 
                      required
                      rows={2}
                      placeholder="اسم الشارع، رقم العقار، علامة مميزة، أو موقع المستودع"
                      value={deliveryAddress}
                      onChange={(e) => setDeliveryAddress(e.target.value)}
                      className="w-full px-3.5 py-2 bg-[#182032] border border-[#1e293b] rounded-xl text-white text-xs focus:outline-none focus:border-blue-500 transition-all"
                    />
                  </div>

                  {/* موقع الـ GPS ورابط الخرائط مع حفظ دائم على السيستم */}
                  <div className="space-y-2 bg-[#0e131f]/60 p-3.5 rounded-2xl border border-[#1e293b]">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                        <Compass size={13} className="text-indigo-400" />
                        <span>رابط الموقع الجغرافي (Google Maps / GPS)</span>
                      </label>
                      
                      {loggedCustomer && (
                        <button
                          type="button"
                          onClick={handleSaveProfileChanges}
                          className="text-[10px] bg-blue-600/20 hover:bg-blue-600 text-blue-400 hover:text-white px-2 py-1 rounded-lg font-bold border border-blue-500/30 transition-all flex items-center gap-1"
                        >
                          <Check size={10} />
                          <span>تثبيت كموقع افتراضي دائم بالسيستم</span>
                        </button>
                      )}
                    </div>
                    
                    <div className="flex gap-2">
                      <input 
                        type="url"
                        placeholder="رابط موقع الخرائط من جوجل ماب أو احداثيات GPS"
                        value={deliveryLocationLink}
                        onChange={(e) => setDeliveryLocationLink(e.target.value)}
                        className="flex-1 px-3 py-2 bg-[#182032] border border-[#1e293b] rounded-xl text-white text-xs focus:outline-none focus:border-indigo-500 transition-all font-mono"
                      />
                      <button
                        type="button"
                        onClick={handleDetectGPS}
                        disabled={isLocating}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 disabled:opacity-50 whitespace-nowrap"
                        title="تحديد الموقع الجغرافي الحالي تلقائياً عبر GPS المتصفح"
                      >
                        <MapPin size={14} className={cn(isLocating && "animate-bounce")} />
                        <span>{isLocating ? 'جاري تحديد...' : 'تحديد موقعي GPS'}</span>
                      </button>
                    </div>
                    
                    <p className="text-[10px] text-slate-400 leading-relaxed">
                      💡 يتم تعبئة موقعك وعنوانك تلقائياً لأنهما محفوظان على السيستم. إذا قمت بأي تعديل، يمكنك النقر على زر التثبيت لحفظه كعنوانك الدائم، أو سيقوم السيستم بحفظ التعديلات تلقائياً عند تأكيد الطلب.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                        <Clock size={13} className="text-amber-400" />
                        <span>تاريخ التوريد المفضل</span>
                      </label>
                      <input 
                        type="date"
                        value={deliveryDate}
                        onChange={(e) => setDeliveryDate(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-[#182032] border border-[#1e293b] rounded-xl text-white text-xs focus:outline-none focus:border-blue-500 transition-all"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-300">الفترة المفضلة للتسليم</label>
                      <select
                        value={deliveryTime}
                        onChange={(e) => setDeliveryTime(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-[#182032] border border-[#1e293b] rounded-xl text-white text-xs focus:outline-none focus:border-blue-500 transition-all"
                      >
                        <option value="صباحاً (9:00 ص - 2:00 م)">صباحاً (9:00 ص - 2:00 م)</option>
                        <option value="مساءً (2:00 م - 8:00 م)">مساءً (2:00 م - 8:00 م)</option>
                        <option value="أي وقت خلال ساعات العمل">أي وقت خلال ساعات العمل</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                      <CreditCard size={13} className="text-indigo-400" />
                      <span>طريقة الدفع والتسوية</span>
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { id: 'COD', label: 'كاش عند الاستلام' },
                        { id: 'CREDIT_ACCOUNT', label: 'آجل (حساب معتمد)' },
                        { id: 'BANK_TRANSFER', label: 'تحويل بنكي' },
                        { id: 'E_WALLET', label: 'فودافون كاش / انستاباي' }
                      ].map(m => (
                        <button
                          type="button"
                          key={m.id}
                          onClick={() => setPaymentMethod(m.id as any)}
                          className={cn(
                            "px-3 py-2 rounded-xl text-xs font-bold border transition-all text-center",
                            paymentMethod === m.id
                              ? "bg-blue-600/30 border-blue-500 text-white"
                              : "bg-[#182032] border-[#1e293b] text-slate-400 hover:text-white"
                          )}
                        >
                          {m.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">ملاحظات إضافية على الطلبية</label>
                    <input 
                      type="text"
                      placeholder="أي تعليمات خاصة للتجهيز أو الشحن"
                      value={customerNotes}
                      onChange={(e) => setCustomerNotes(e.target.value)}
                      className="w-full px-3.5 py-2 bg-[#182032] border border-[#1e293b] rounded-xl text-white text-xs focus:outline-none focus:border-blue-500 transition-all"
                    />
                  </div>
                </div>

                {/* Footer Controls */}
                <div className="p-4 border-t border-[#1e293b] bg-slate-900/80 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setCheckoutStep('CART')}
                    className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold text-xs transition-all"
                  >
                    السابق
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl font-black text-sm shadow-lg shadow-emerald-600/30 transition-all active:scale-95 disabled:opacity-50"
                  >
                    <CheckCircle2 size={18} />
                    <span>{isSubmitting ? 'جاري إرسال الطلب للنظام...' : `تأكيد وإرسال طلب الشراء (${formatCurrency(grandTotal)})`}</span>
                  </button>
                </div>
              </form>
            )}

            {/* Step: SUCCESS Confirmation Screen */}
            {checkoutStep === 'SUCCESS' && lastSubmittedOrder && (
              <div className="flex-1 overflow-y-auto p-6 flex flex-col items-center justify-center text-center space-y-5">
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center text-emerald-400 animate-bounce">
                  <Check size={32} />
                </div>

                <div className="space-y-1">
                  <h3 className="text-xl font-black text-white">تم إرسال طلب الشراء بنجاح!</h3>
                  <p className="text-xs text-slate-400">
                    تم تحويل طلبك مباشرة إلى لوحة تحكم النظام الرئيسي وجاري مراجعته وتجهيزه.
                  </p>
                </div>

                <div className="w-full bg-[#182032] border border-[#1e293b] rounded-2xl p-4 text-right space-y-2 text-xs">
                  <div className="flex justify-between border-b border-slate-800 pb-2">
                    <span className="text-slate-400">رقم الطلب المرجعي:</span>
                    <span className="font-black text-blue-400 font-mono text-sm">{lastSubmittedOrder.orderNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">العميل:</span>
                    <span className="font-bold text-white">{lastSubmittedOrder.customerName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">العنوان:</span>
                    <span className="font-bold text-white">{lastSubmittedOrder.deliveryAddress}</span>
                  </div>
                  {lastSubmittedOrder.deliveryLocationLink && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">موقع GPS:</span>
                      <a 
                        href={lastSubmittedOrder.deliveryLocationLink} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="font-bold text-indigo-400 hover:underline flex items-center gap-1"
                      >
                        <MapPin size={12} />
                        <span>عرض على الخريطة ↗</span>
                      </a>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-slate-400">عدد الأصناف:</span>
                    <span className="font-bold text-white">{lastSubmittedOrder.items.length} أصناف</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-slate-800 text-sm font-black">
                    <span className="text-slate-300">الإجمالي النهائي:</span>
                    <span className="text-emerald-400">{formatCurrency(lastSubmittedOrder.grandTotal)}</span>
                  </div>
                </div>

                <div className="w-full space-y-2.5">
                  <button
                    type="button"
                    onClick={handlePrintReceipt}
                    className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-xl text-xs transition-all shadow-lg shadow-blue-500/20 active:scale-95"
                  >
                    <Printer size={16} />
                    <span>معاينة وطباعة الإيصال الحراري 🖨️</span>
                  </button>

                  <button
                    onClick={handleSendWhatsApp}
                    className="w-full flex items-center justify-center gap-2 py-3 bg-[#25D366] hover:bg-[#20bd5a] text-slate-950 font-black rounded-xl text-xs transition-all shadow-lg shadow-emerald-500/20 active:scale-95"
                  >
                    <Send size={16} />
                    <span>إرسال تفاصيل الطلب عبر الواتساب فوراً</span>
                  </button>

                  <button
                    onClick={handleCopyWhatsAppText}
                    className="w-full flex items-center justify-center gap-2 py-2.5 bg-emerald-950/40 hover:bg-emerald-900/40 text-emerald-300 border border-emerald-500/30 font-bold rounded-xl text-xs transition-all"
                  >
                    <Copy size={14} />
                    <span>نسخ نص تفاصيل الطلب للحافظة (Clipboard)</span>
                  </button>

                  <button
                    onClick={() => {
                      setLastSubmittedOrder(null);
                      setCheckoutStep('CART');
                      setIsCartOpen(false);
                    }}
                    className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs transition-all"
                  >
                    تقديم طلب شراء جديد
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Customer Login & Registration Modal */}
      {isAuthModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#151b2b] border border-[#1e293b] rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-[#1e293b] flex items-center justify-between bg-slate-900/60">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-600/20 text-blue-400">
                  <UserCheck size={20} />
                </div>
                <div>
                  <h3 className="font-black text-white text-sm">
                    {authMode === 'LOGIN' ? 'تسجيل دخول العميل المسجل' : 'إنشاء حساب عميل جديد'}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {authMode === 'LOGIN' ? 'ادخل رقم هاتفك وكلمة السر للربط بحسابك وطلباتك' : 'سجل بياناتك للتوريد المستمر والأسعار التفضيلية'}
                  </p>
                </div>
              </div>
              <button onClick={() => setIsAuthModalOpen(false)} className="text-slate-400 hover:text-white p-1 rounded-lg">
                <X size={18} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Tab Switcher */}
              <div className="grid grid-cols-2 gap-2 bg-[#0e131f] p-1 rounded-xl border border-[#1e293b]">
                <button
                  type="button"
                  onClick={() => { setAuthMode('LOGIN'); setAuthError(null); }}
                  className={cn(
                    "py-2 rounded-lg text-xs font-bold transition-all",
                    authMode === 'LOGIN' ? "bg-blue-600 text-white shadow-md" : "text-slate-400 hover:text-white"
                  )}
                >
                  تسجيل دخول
                </button>
                <button
                  type="button"
                  onClick={() => { setAuthMode('REGISTER'); setAuthError(null); }}
                  className={cn(
                    "py-2 rounded-lg text-xs font-bold transition-all",
                    authMode === 'REGISTER' ? "bg-blue-600 text-white shadow-md" : "text-slate-400 hover:text-white"
                  )}
                >
                  عميل جديد
                </button>
              </div>

              {authError && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs flex items-center gap-2">
                  <AlertCircle size={15} />
                  <span>{authError}</span>
                </div>
              )}

              {authMode === 'LOGIN' ? (
                <form onSubmit={handleCustomerLogin} className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-300">رقم الهاتف المسجل</label>
                    <div className="relative">
                      <Phone size={14} className="absolute right-3 top-3 text-slate-500" />
                      <input
                        type="tel"
                        required
                        placeholder="010XXXXXXXX"
                        value={authPhone}
                        onChange={(e) => setAuthPhone(e.target.value)}
                        className="w-full pr-9 pl-3 py-2.5 bg-[#182032] border border-[#1e293b] rounded-xl text-white text-xs focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-300">كلمة السر / كود الدخول (PIN)</label>
                    <div className="relative">
                      <KeyRound size={14} className="absolute right-3 top-3 text-slate-500" />
                      <input
                        type="password"
                        placeholder="ادخل كلمة السر أو رمز PIN"
                        value={authPin}
                        onChange={(e) => setAuthPin(e.target.value)}
                        className="w-full pr-9 pl-3 py-2.5 bg-[#182032] border border-[#1e293b] rounded-xl text-white text-xs focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                    <p className="text-[10px] text-slate-500">كود الدخول المبدئي هو آخر 4 أرقام من هاتفك أو 1234</p>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl font-black text-xs shadow-lg shadow-blue-600/30 transition-all active:scale-95 mt-2"
                  >
                    دخول وتأكيد الحساب
                  </button>
                </form>
              ) : (
                <form onSubmit={handleCustomerRegister} className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-300">الاسم / اسم المتجر</label>
                    <input
                      type="text"
                      required
                      placeholder="مثال: سوبرماركت الأمل أو أحمد خالد"
                      value={authName}
                      onChange={(e) => setAuthName(e.target.value)}
                      className="w-full px-3 py-2.5 bg-[#182032] border border-[#1e293b] rounded-xl text-white text-xs focus:border-blue-500 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-300">رقم الهاتف / الواتساب</label>
                    <input
                      type="tel"
                      required
                      placeholder="010XXXXXXXX"
                      value={authPhone}
                      onChange={(e) => setAuthPhone(e.target.value)}
                      className="w-full px-3 py-2.5 bg-[#182032] border border-[#1e293b] rounded-xl text-white text-xs focus:border-blue-500 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-300">العنوان وموقع الاستلام</label>
                    <input
                      type="text"
                      placeholder="المدينة، الشارع، تفاصيل المخزن"
                      value={authAddress}
                      onChange={(e) => setAuthAddress(e.target.value)}
                      className="w-full px-3 py-2.5 bg-[#182032] border border-[#1e293b] rounded-xl text-white text-xs focus:border-blue-500 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-300">كلمة السر (اختياري)</label>
                    <input
                      type="password"
                      placeholder="اختر كلمة سر لحسابك"
                      value={authPin}
                      onChange={(e) => setAuthPin(e.target.value)}
                      className="w-full px-3 py-2.5 bg-[#182032] border border-[#1e293b] rounded-xl text-white text-xs focus:border-blue-500 focus:outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl font-black text-xs shadow-lg shadow-emerald-600/30 transition-all active:scale-95 mt-2"
                  >
                    تسجيل الحساب وتفعيل العضوية
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Voice Assistant Modal */}
      {isVoiceModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#151b2b] border border-[#1e293b] rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-[#1e293b] flex items-center justify-between bg-slate-900/60">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-2xl bg-purple-600/20 text-purple-400 border border-purple-500/30">
                  <Mic size={22} className={isListening ? "animate-bounce text-purple-300" : ""} />
                </div>
                <div>
                  <h3 className="font-black text-white text-sm sm:text-base">
                    مساعد الطلب الصوتي الذكي 🎙️
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    تحدث بوضوح أو جرب الأوامر الجاهزة لإضافة المنتجات فوراً
                  </p>
                </div>
              </div>
              <button onClick={() => setIsVoiceModalOpen(false)} className="text-slate-400 hover:text-white p-1.5 rounded-xl bg-slate-800">
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-5 text-center">
              {/* Mic Visualizer */}
              <div className="flex flex-col items-center justify-center py-6 bg-[#0f1523] border border-[#1e293b] rounded-2xl relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-purple-600/5 to-transparent pointer-events-none"></div>
                
                <div className={cn(
                  "w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 shadow-2xl mb-4",
                  isListening ? "bg-purple-600 text-white scale-110 shadow-purple-600/50 animate-pulse" : "bg-slate-800 text-slate-400 border border-slate-700"
                )}>
                  <Mic size={32} />
                </div>

                <p className="text-sm font-bold text-white px-4 min-h-[40px] flex items-center justify-center">
                  {transcript || (isListening ? 'جاري الاستماع للصوت...' : 'انقر على زر ابدأ التحدث أو جرب الأوامر أدناه')}
                </p>

                {voiceFeedbackMessage && (
                  <div className="mt-3 mx-4 p-3 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-bold animate-in fade-in">
                    {voiceFeedbackMessage}
                  </div>
                )}
              </div>

              {/* Control Button */}
              <button
                type="button"
                onClick={startVoiceRecognition}
                disabled={isListening}
                className={cn(
                  "w-full py-3.5 rounded-2xl font-black text-sm shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2",
                  isListening
                    ? "bg-purple-900/50 text-purple-300 cursor-not-allowed border border-purple-500/30"
                    : "bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-purple-600/30"
                )}
              >
                <Mic size={18} />
                <span>{isListening ? 'جاري الاستماع الآن...' : 'ابدأ التحدث بالمايكروفون 🎙️'}</span>
              </button>

              {/* Sample Quick Voice Commands (Arabic & English with numbers support) */}
              <div className="space-y-2 text-right">
                <p className="text-xs font-bold text-slate-400">أو جرب الأوامر الصوتية الجاهزة (تدعم الأرقام بالعربي والإنكليزي):</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {[
                    "أضف 3 كوكاكولا",
                    "ضيف 2 أرز مصري",
                    "add 5 pepsi",
                    "شراء 1 زيت ذرة",
                    "أضف عشرة عصير",
                    "ضيف 4 سكر"
                  ].map((cmdText, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => processVoiceCommand(cmdText)}
                      className="p-2.5 bg-[#182032] hover:bg-purple-600/20 border border-[#1e293b] hover:border-purple-500/40 rounded-xl text-xs text-slate-300 hover:text-white transition-all text-right flex items-center justify-between"
                    >
                      <span className="font-bold">"{cmdText}"</span>
                      <Sparkles size={14} className="text-purple-400 shrink-0" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
