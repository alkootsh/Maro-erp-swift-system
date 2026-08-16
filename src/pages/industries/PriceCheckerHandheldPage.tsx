/**
 * @file PriceCheckerHandheldPage.tsx
 * @module واجهات وصفحات النظام (UI Pages)
 * @description ملف جزء من نظام MARO ERP. الوظيفة: PriceCheckerHandheldPage.tsx.
 */
import React, { useState, useEffect, useRef } from 'react';
import { 
  ScanLine, 
  Search, 
  Smartphone, 
  Printer, 
  Barcode, 
  Volume2, 
  VolumeX, 
  Tag, 
  Percent, 
  Sparkles, 
  Layers, 
  CheckCircle2, 
  AlertCircle, 
  Plus, 
  Trash2, 
  ArrowRight, 
  ExternalLink, 
  ShieldCheck, 
  RefreshCw, 
  Sliders, 
  Tv, 
  ShoppingBag, 
  Boxes, 
  ShoppingCart, 
  Clock, 
  Calendar, 
  Warehouse, 
  MapPin, 
  Zap, 
  Award, 
  CreditCard, 
  QrCode, 
  ChevronRight, 
  Check, 
  X, 
  FileText, 
  Share2, 
  Download, 
  Flame, 
  BatteryCharging, 
  Wifi, 
  Play, 
  Pause,
  AlertTriangle,
  RotateCcw,
  PackageCheck
} from 'lucide-react';
import { 
  PriceCheckProduct, 
  HandheldPdaDevice, 
  HandheldPdaMode, 
  ShelfLabelPrintRecord, 
  MobileStockCountItem, 
  MobileLineBustingCart, 
  MobileLineBustingCartItem 
} from '../../types/industryModules';
import { formatCurrency, cn } from '../../lib/utils';
import { MaroSyncEngine } from '../../lib/maroSyncEngine';
import { DigitalSignageMediaPlayer } from '../../components/kiosk/DigitalSignageMediaPlayer';
import { DigitalSignageAdManagerModal } from '../../components/kiosk/DigitalSignageAdManagerModal';
import { KioskPromotionalTicker } from '../../components/kiosk/KioskPromotionalTicker';
import { DigitalSignageEngine } from '../../services/digitalSignageEngine';
import { PriceCheckerMediaAd, KioskDigitalSignageSettings } from '../../types/digitalSignageAds';

// Seed Catalog for Supermarket, Electronics, Pharmacy, Retail & Fashion
const SEED_PRODUCTS: PriceCheckProduct[] = [
  {
    id: 'prod_pda_1',
    barcode: '622100100101',
    sku: 'SKU-NES-200',
    nameAr: 'نسكافيه جولد قهوة سريعة التحضير برطمان 200 جم أصلي',
    nameEn: 'Nescafe Gold Instant Coffee 200g Jar',
    brand: 'Nestle - نستله',
    category: 'المشروبات والأغذية المحفوظة',
    unit: 'برطمان',
    costPrice: 175,
    retailPrice: 240,
    taxRate: 0.14,
    finalPriceWithTax: 240,
    hasPromotion: true,
    promoDiscountPercent: 15,
    promoPrice: 204,
    promoLabel: 'عرض سوبر ماركت الأسبوع - وفر 36 ج.م!',
    promoValidUntil: '2026-08-31',
    priceLevels: [
      { levelNameAr: 'قطاعي (1 - 2 برطمان)', price: 204, minQuantity: 1 },
      { levelNameAr: 'نصف جملة (3 - 5 برطمان)', price: 195, minQuantity: 3 },
      { levelNameAr: 'كرتونة جملة (12 برطمان)', price: 185, minQuantity: 12 }
    ],
    loyaltyPointsEarned: 15,
    stockInCurrentBranch: 48,
    stockTotalAllBranches: 320,
    shelfLocation: 'ممر A2 - رف 3 - خانة 14',
    binCode: 'BIN-A2-03',
    batchNumber: 'LOT-2026-04B',
    expiryDate: '2027-11-30',
    imageUrl: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    descriptionAr: 'حبيبات قهوة أرابيكا محمصة بعناية ونكهة غنية فاخرة برائحة مميزة، سريعة الذوبان 100% بن طبيعي.',
    alternativeProducts: [
      { id: 'prod_alt_1', nameAr: 'قهوة دافيدوف ريتش أروما 100 جم', barcode: '622100100102', price: 290, stock: 18, reason: 'بديل بريميوم فاخر' },
      { id: 'prod_alt_2', nameAr: 'نسكافيه كلاسيك أحمر 200 جم', barcode: '622100100103', price: 165, stock: 65, reason: 'بديل اقتصادي' }
    ]
  },
  {
    id: 'prod_pda_2',
    barcode: '622200200202',
    sku: 'SKU-OIL-CRN',
    nameAr: 'زيت ذرة كريستال نقي 1.6 لتر عالي الجودة',
    nameEn: 'Crystal Pure Corn Oil 1.6L Bottle',
    brand: 'Crystal - كريستال',
    category: 'زيوت وسمن ومواد تموينية',
    unit: 'زجاجة',
    costPrice: 98,
    retailPrice: 130,
    taxRate: 0.14,
    finalPriceWithTax: 130,
    hasPromotion: true,
    promoDiscountPercent: 10,
    promoPrice: 117,
    promoLabel: 'اشتري 2 زجاجة واحصل على خصم 10% فوري',
    promoValidUntil: '2026-09-15',
    priceLevels: [
      { levelNameAr: 'قطاعي (1 زجاجة)', price: 117, minQuantity: 1 },
      { levelNameAr: 'عرض التوفير (2 زجاجة)', price: 112, minQuantity: 2 },
      { levelNameAr: 'كرتونة (6 زجاجات)', price: 108, minQuantity: 6 }
    ],
    loyaltyPointsEarned: 10,
    stockInCurrentBranch: 112,
    stockTotalAllBranches: 840,
    shelfLocation: 'ممر B1 - رف 1 - خانة 02',
    binCode: 'BIN-B1-01',
    batchNumber: 'CRY-9921',
    expiryDate: '2027-06-20',
    imageUrl: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    descriptionAr: 'زيت ذرة نقي 100% معصور على البارد، خالي من الكوليسترول ومثالي للطهي الصحي والقلي الخفيف.',
    alternativeProducts: [
      { id: 'prod_alt_3', nameAr: 'زيت عباد الشمس عافية 1.6 لتر', barcode: '622200200203', price: 110, stock: 45, reason: 'بديل مماثل' }
    ]
  },
  {
    id: 'prod_pda_3',
    barcode: '622300300303',
    sku: 'SKU-APL-IP15',
    nameAr: 'هاتف آبل آيفون 15 برو ماكس 256 جيجابايت تيتانيوم طبيعي',
    nameEn: 'Apple iPhone 15 Pro Max 256GB Natural Titanium',
    brand: 'Apple',
    category: 'إلكترونيات وهواتف ذكية',
    unit: 'جهاز',
    costPrice: 62000,
    retailPrice: 69900,
    taxRate: 0.14,
    finalPriceWithTax: 69900,
    hasPromotion: false,
    priceLevels: [
      { levelNameAr: 'سعر القطاعي الرسمي', price: 69900, minQuantity: 1 },
      { levelNameAr: 'سعر كبار العملاء VIP', price: 67500, minQuantity: 2 }
    ],
    loyaltyPointsEarned: 1500,
    stockInCurrentBranch: 4,
    stockTotalAllBranches: 22,
    shelfLocation: 'خزينة العرض الزجاجية VIP - رف 1',
    binCode: 'SAFE-TECH-01',
    batchNumber: 'IMEI-SERIES-15PM',
    imageUrl: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    descriptionAr: 'شريحة A17 Pro فائقة القوة، هيكل تيتانيوم فائق الخفة والمتانة، كاميرا 48 ميجابكسل مع تقريب بصري 5x، وشاشة Super Retina XDR مع ProMotion.',
    alternativeProducts: [
      { id: 'prod_alt_4', nameAr: 'سامسونج جالاكسي S24 ألترا 256GB', barcode: '622300300304', price: 62500, stock: 7, reason: 'فلاجشيب أندرويد منافس' }
    ]
  },
  {
    id: 'prod_pda_4',
    barcode: '622400400404',
    sku: 'SKU-PAN-EXT',
    nameAr: 'بنادول إكسترا أقراص مسكن سريع للصداع والآلام 24 قرص',
    nameEn: 'Panadol Extra Tablets 24s Pack',
    brand: 'GSK - بانادول',
    category: 'الأدوية والمسكنات الطبية',
    unit: 'علبة',
    costPrice: 42,
    retailPrice: 55,
    taxRate: 0,
    finalPriceWithTax: 55,
    hasPromotion: false,
    priceLevels: [
      { levelNameAr: 'قطاعي (علبة)', price: 55, minQuantity: 1 },
      { levelNameAr: 'شريط مفرد (12 قرص)', price: 27.5, minQuantity: 1 }
    ],
    loyaltyPointsEarned: 4,
    stockInCurrentBranch: 90,
    stockTotalAllBranches: 620,
    shelfLocation: 'صيدلية - درج C - خانة 05',
    binCode: 'PHARM-DR-05',
    batchNumber: 'PND-2026-X8',
    expiryDate: '2028-03-31',
    imageUrl: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    descriptionAr: 'تركيبة فعالة من الباراسيتامول مع الكافيين لامتصاص أسرع وتسكين قوي لآلام الصداع، آلام المفاصل، والأسنان.',
    alternativeProducts: [
      { id: 'prod_alt_5', nameAr: 'أدول إكسترا 24 قرص', barcode: '622400400405', price: 48, stock: 35, reason: 'بديل متوفر' }
    ]
  }
];

export const PriceCheckerHandheldPage: React.FC = () => {
  // Top-level Navigation Mode:
  // 'kiosk' = شاشة كشك العميل التفاعلية لاستعلام الأسعار
  // 'pda' = وضع جهاز الهاند تيرمينال المتنقل للموظفين
  // 'audit_log' = سجل طباعة بطاقات الرف والجرد والمشتريات
  const [activeSystemView, setActiveSystemView] = useState<'kiosk' | 'pda' | 'audit_log'>('kiosk');

  // Master Products Catalog in State
  const [products, setProducts] = useState<PriceCheckProduct[]>(() => {
    const saved = MaroSyncEngine.getLocalCollection<PriceCheckProduct>('pda_price_check_products');
    if (saved.length > 0) return saved;
    MaroSyncEngine.setLocalCollection('pda_price_check_products', SEED_PRODUCTS);
    return SEED_PRODUCTS;
  });

  // Active Scanned Product for Kiosk & PDA
  const [scannedBarcode, setScannedBarcode] = useState<string>('622100100101');
  const [currentProduct, setCurrentProduct] = useState<PriceCheckProduct | null>(SEED_PRODUCTS[0]);
  const [scanStatusMessage, setScanStatusMessage] = useState<string>('جاهز لقراءة الباركود أو إدخال الكود');
  const [isAudioEnabled, setIsAudioEnabled] = useState<boolean>(true);
  const [isChimeActive, setIsChimeActive] = useState<boolean>(false);
  const [manualBarcodeInput, setManualBarcodeInput] = useState<string>('');

  // Handheld Terminal State (PDA)
  const [pdaDevice, setPdaDevice] = useState<HandheldPdaDevice>({
    id: 'PDA-ZEBRA-01',
    deviceName: 'Zebra TC26 Pro Mobile Terminal',
    serialNumber: 'ZBR-99482-TC',
    assignedStaffName: 'م. مروان البدري (مشرف الصالة والمخازن)',
    assignedStaffRole: 'Floor Supervisor & Inventory Officer',
    branchId: 'BR-CAIRO-01',
    branchName: 'فرع المعادي الرئيسي - هايبر ماركت',
    batteryPercent: 88,
    wifiSignal: 'EXCELLENT',
    scannerStatus: 'READY_LASER',
    bluetoothPrinterConnected: true,
    printerModel: 'Bixolon SPP-R200 Mobile Bluetooth 58mm',
    currentMode: 'PRICE_CHECK'
  });

  // PDA Sub-tab modes
  const [pdaSubMode, setPdaSubMode] = useState<HandheldPdaMode>('PRICE_CHECK');

  // Shelf Labels Print Queue
  const [shelfLabelLogs, setShelfLabelLogs] = useState<ShelfLabelPrintRecord[]>([
    {
      id: 'lbl_01',
      barcode: '622100100101',
      productName: 'نسكافيه جولد قهوة سريعة التحضير برطمان 200 جم',
      unit: 'برطمان',
      oldPrice: 240,
      newPrice: 204,
      shelfLocation: 'ممر A2 - رف 3 - خانة 14',
      promoText: 'عرض خاص -15%',
      labelSize: '50x30mm',
      printerTarget: 'Bixolon SPP-R200 (Bluetooth Mobile)',
      status: 'PRINTED',
      printedAt: '10:14 ص',
      printedBy: 'مروان البدري'
    },
    {
      id: 'lbl_02',
      barcode: '622200200202',
      productName: 'زيت ذرة كريستال نقي 1.6 لتر',
      unit: 'زجاجة',
      oldPrice: 130,
      newPrice: 117,
      shelfLocation: 'ممر B1 - رف 1 - خانة 02',
      promoText: 'خصم 10% للمستهلك',
      labelSize: '50x30mm',
      printerTarget: 'Bixolon SPP-R200 (Bluetooth Mobile)',
      status: 'PRINTED',
      printedAt: '10:22 ص',
      printedBy: 'مروان البدري'
    }
  ]);

  // Mobile Stock Count Items
  const [stockCountItems, setStockCountItems] = useState<MobileStockCountItem[]>([
    {
      id: 'cnt_01',
      barcode: '622100100101',
      productName: 'نسكافيه جولد 200 جم',
      shelfLocation: 'ممر A2 - رف 3',
      expectedQty: 48,
      countedQty: 48,
      differenceQty: 0,
      unit: 'برطمان',
      unitCost: 175,
      differenceValue: 0,
      status: 'MATCH',
      countedAt: '10:30 ص',
      countedBy: 'مروان البدري',
      batchOrSerial: 'LOT-2026-04B'
    },
    {
      id: 'cnt_02',
      barcode: '622200200202',
      productName: 'زيت ذرة كريستال 1.6 لتر',
      shelfLocation: 'ممر B1 - رف 1',
      expectedQty: 112,
      countedQty: 110,
      differenceQty: -2,
      unit: 'زجاجة',
      unitCost: 98,
      differenceValue: -196,
      status: 'DEFICIT',
      countedAt: '10:35 ص',
      countedBy: 'مروان البدري',
      batchOrSerial: 'CRY-9921'
    }
  ]);

  // Mobile Line Busting Active Carts
  const [activeMobileCarts, setActiveMobileCarts] = useState<MobileLineBustingCart[]>([
    {
      id: 'cart_01',
      cartCode: 'CART-9042',
      customerName: 'الحاج عثمان الألفي',
      customerPhone: '01019283746',
      items: [
        {
          productId: 'prod_pda_1',
          barcode: '622100100101',
          nameAr: 'نسكافيه جولد قهوة سريعة التحضير برطمان 200 جم',
          unit: 'برطمان',
          quantity: 2,
          unitPrice: 204,
          taxPercent: 14,
          discountAmount: 0,
          netTotal: 408
        },
        {
          productId: 'prod_pda_2',
          barcode: '622200200202',
          nameAr: 'زيت ذرة كريستال نقي 1.6 لتر',
          unit: 'زجاجة',
          quantity: 1,
          unitPrice: 117,
          taxPercent: 14,
          discountAmount: 0,
          netTotal: 117
        }
      ],
      subtotal: 525,
      discountTotal: 0,
      taxTotal: 64.4,
      netTotal: 525,
      createdByAgent: 'مروان البدري (PDA-01)',
      status: 'PENDING_CASHIER',
      createdAt: '10:45 ص'
    }
  ]);

  // Current In-Progress Line Busting Cart being created on PDA
  const [currentBustingItems, setCurrentBustingItems] = useState<MobileLineBustingCartItem[]>([]);
  const [bustingCustomerName, setBustingCustomerName] = useState('');
  const [bustingCustomerPhone, setBustingCustomerPhone] = useState('');

  // Quick Price Override Modal on PDA
  const [overrideModalProduct, setOverrideModalProduct] = useState<PriceCheckProduct | null>(null);
  const [newOverridePrice, setNewOverridePrice] = useState<number>(0);
  const [overrideSupervisorPin, setOverrideSupervisorPin] = useState<string>('');

  // Label Printing Preview Modal
  const [activePrintPreviewLabel, setActivePrintPreviewLabel] = useState<ShelfLabelPrintRecord | null>(null);

  // Digital Signage & Media Advertising State
  const [isAdManagerOpen, setIsAdManagerOpen] = useState<boolean>(false);
  const [isFullscreenSignage, setIsFullscreenSignage] = useState<boolean>(false);
  const [mediaAds, setMediaAds] = useState<PriceCheckerMediaAd[]>(DigitalSignageEngine.getAds());
  const [signageSettings, setSignageSettings] = useState<KioskDigitalSignageSettings>(DigitalSignageEngine.getSettings());

  // Kiosk Screensaver & Idle Ad Carousel timer
  const [isScreenSaverActive, setIsScreenSaverActive] = useState<boolean>(false);
  const screenSaverTimerRef = useRef<NodeJS.Timeout | null>(null);

  const refreshMediaAds = () => {
    setMediaAds(DigitalSignageEngine.getAds());
    setSignageSettings(DigitalSignageEngine.getSettings());
  };

  const resetScreenSaverTimer = () => {
    if (isScreenSaverActive) setIsScreenSaverActive(false);
    if (screenSaverTimerRef.current) clearTimeout(screenSaverTimerRef.current);
    const idleSeconds = signageSettings?.idleTimeoutSeconds || 15;
    screenSaverTimerRef.current = setTimeout(() => {
      if (activeSystemView === 'kiosk') {
        setIsScreenSaverActive(true);
      }
    }, idleSeconds * 1000);
  };

  useEffect(() => {
    resetScreenSaverTimer();
    return () => {
      if (screenSaverTimerRef.current) clearTimeout(screenSaverTimerRef.current);
    };
  }, [activeSystemView, scannedBarcode, signageSettings?.idleTimeoutSeconds]);

  // Handle Scanning Execution
  const executeScan = (barcodeToScan: string) => {
    resetScreenSaverTimer();
    const cleanCode = barcodeToScan.trim();
    if (!cleanCode) return;

    setIsChimeActive(true);
    setTimeout(() => setIsChimeActive(false), 1500);

    const found = products.find(p => p.barcode === cleanCode || p.sku.toLowerCase() === cleanCode.toLowerCase());
    if (found) {
      setCurrentProduct(found);
      setScannedBarcode(cleanCode);
      setScanStatusMessage(`تم العثور على الصنف: ${found.nameAr}`);

      // Voice Audio Speech Announcement
      if (isAudioEnabled && 'speechSynthesis' in window) {
        try {
          window.speechSynthesis.cancel();
          const effectivePrice = found.hasPromotion && found.promoPrice ? found.promoPrice : found.finalPriceWithTax;
          const msg = new SpeechSynthesisUtterance(`${found.nameAr}. السعر: ${effectivePrice} جنيه مصري.`);
          msg.lang = 'ar-SA';
          msg.rate = 1.0;
          window.speechSynthesis.speak(msg);
        } catch {
          // Audio fallback silent
        }
      }

      // If in Line Busting Mode on PDA, add item automatically
      if (activeSystemView === 'pda' && pdaSubMode === 'LINE_BUSTING_SALE') {
        addItemToBustingCart(found);
      }
    } else {
      setScanStatusMessage(`⚠️ الباركود [${cleanCode}] غير مسجل بدليل الأصناف!`);
    }
  };

  // Keyboard shortcut listener for physical laser scanner gun (triggers on Enter)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // If pressing F2, switch to PDA mode, F1 for Kiosk
      if (e.key === 'F1') {
        e.preventDefault();
        setActiveSystemView('kiosk');
      } else if (e.key === 'F2') {
        e.preventDefault();
        setActiveSystemView('pda');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Print Shelf Label from PDA
  const handlePrintShelfLabel = (product: PriceCheckProduct, customPrice?: number) => {
    const priceToPrint = customPrice !== undefined ? customPrice : (product.hasPromotion && product.promoPrice ? product.promoPrice : product.finalPriceWithTax);
    
    const newRecord: ShelfLabelPrintRecord = {
      id: `lbl_${Date.now()}`,
      barcode: product.barcode,
      productName: product.nameAr,
      unit: product.unit,
      oldPrice: product.retailPrice !== priceToPrint ? product.retailPrice : undefined,
      newPrice: priceToPrint,
      shelfLocation: product.shelfLocation,
      promoText: product.hasPromotion ? product.promoLabel : undefined,
      labelSize: '50x30mm',
      printerTarget: pdaDevice.printerModel || 'Bixolon SPP-R200 (Bluetooth)',
      status: 'PRINTED',
      printedAt: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
      printedBy: pdaDevice.assignedStaffName.split(' ')[0]
    };

    setShelfLabelLogs(prev => [newRecord, ...prev]);
    setActivePrintPreviewLabel(newRecord);
  };

  // Quick Price Override Action
  const handleApplyPriceOverride = () => {
    if (!overrideModalProduct) return;
    if (overrideSupervisorPin !== '1234' && overrideSupervisorPin !== '9999') {
      alert('⚠️ كود المشرف غير صحيح! يرجى إدخال رمز المشرف المصرح (الافتراضي: 1234)');
      return;
    }

    const updated = products.map(p => {
      if (p.id === overrideModalProduct.id) {
        return {
          ...p,
          retailPrice: newOverridePrice,
          finalPriceWithTax: newOverridePrice,
          hasPromotion: false
        };
      }
      return p;
    });

    setProducts(updated);
    MaroSyncEngine.setLocalCollection('pda_price_check_products', updated);
    setCurrentProduct(prev => prev ? { ...prev, retailPrice: newOverridePrice, finalPriceWithTax: newOverridePrice } : null);

    // Auto-trigger shelf label print
    handlePrintShelfLabel({ ...overrideModalProduct, retailPrice: newOverridePrice, finalPriceWithTax: newOverridePrice }, newOverridePrice);
    
    setOverrideModalProduct(null);
    setOverrideSupervisorPin('');
    alert(`✓ تم تحديث سعر الصنف إلى ${formatCurrency(newOverridePrice)} وطباعة بطاقة الرف المحدثة بنجاح!`);
  };

  // Mobile Stock Count Action
  const handleAddStockCountRecord = (product: PriceCheckProduct, countedQuantity: number) => {
    const diff = countedQuantity - product.stockInCurrentBranch;
    const diffVal = diff * product.costPrice;

    const newCount: MobileStockCountItem = {
      id: `cnt_${Date.now()}`,
      barcode: product.barcode,
      productName: product.nameAr,
      shelfLocation: product.shelfLocation,
      expectedQty: product.stockInCurrentBranch,
      countedQty: countedQuantity,
      differenceQty: diff,
      unit: product.unit,
      unitCost: product.costPrice,
      differenceValue: diffVal,
      status: diff === 0 ? 'MATCH' : diff > 0 ? 'SURPLUS' : 'DEFICIT',
      countedAt: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
      countedBy: pdaDevice.assignedStaffName.split(' ')[0],
      batchOrSerial: product.batchNumber
    };

    setStockCountItems(prev => [newCount, ...prev]);
    alert(`✓ تم تسجيل جرد الصنف [${product.nameAr}]: الفعلي (${countedQuantity}) - الدفتري (${product.stockInCurrentBranch}) - الفارق: ${diff > 0 ? `+${diff} زيادة` : diff < 0 ? `${diff} عجز` : 'مطابق تماماً'}`);
  };

  // Line Busting Actions
  const addItemToBustingCart = (product: PriceCheckProduct) => {
    const effectivePrice = product.hasPromotion && product.promoPrice ? product.promoPrice : product.finalPriceWithTax;
    
    setCurrentBustingItems(prev => {
      const existing = prev.find(item => item.productId === product.id);
      if (existing) {
        return prev.map(item => item.productId === product.id ? {
          ...item,
          quantity: item.quantity + 1,
          netTotal: (item.quantity + 1) * item.unitPrice
        } : item);
      } else {
        return [...prev, {
          productId: product.id,
          barcode: product.barcode,
          nameAr: product.nameAr,
          unit: product.unit,
          quantity: 1,
          unitPrice: effectivePrice,
          taxPercent: product.taxRate * 100,
          discountAmount: 0,
          netTotal: effectivePrice
        }];
      }
    });
  };

  const handleSaveBustingCart = () => {
    if (currentBustingItems.length === 0) {
      alert('⚠️ سلة المشتريات فارغة! يرجى مسح أصناف أولاً.');
      return;
    }

    const subtotal = currentBustingItems.reduce((acc, item) => acc + item.netTotal, 0);
    const cartCode = `CART-${Math.floor(1000 + Math.random() * 9000)}`;

    const newCart: MobileLineBustingCart = {
      id: `cart_${Date.now()}`,
      cartCode,
      customerName: bustingCustomerName || 'عميل نقدي صالة',
      customerPhone: bustingCustomerPhone || undefined,
      items: [...currentBustingItems],
      subtotal,
      discountTotal: 0,
      taxTotal: subtotal * 0.14,
      netTotal: subtotal,
      createdByAgent: `${pdaDevice.assignedStaffName.split(' ')[0]} (${pdaDevice.deviceName.split(' ')[0]})`,
      status: 'PENDING_CASHIER',
      createdAt: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
    };

    setActiveMobileCarts(prev => [newCart, ...prev]);
    setCurrentBustingItems([]);
    setBustingCustomerName('');
    setBustingCustomerPhone('');
    alert(`🎉 تم إنشاء سلة مشتريات العميل بنجاح!\nكود السلة: [${cartCode}]\nيمكن للكاشير الآن مسح كود السلة وتحويلها لفاتورة مبيعات في أقل من ثانية واحدة!`);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-[#151b2b] border border-amber-500/30 rounded-3xl p-6 shadow-2xl relative overflow-hidden flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-500"></div>
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
              <ScanLine size={14} />
              <span>Smart Price Checker Kiosk & Mobile Handheld PDA</span>
            </span>
            <span className="px-3 py-1 rounded-full bg-slate-800 text-slate-300 text-xs font-bold border border-slate-700 flex items-center gap-1.5">
              <Sparkles size={13} className="text-amber-400" />
              <span>نظام فحص الأسعار الذكي ومساعد الموظف المتنقل</span>
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-white">
            كشك استعلام الأسعار وأجهزة الهاند تيرمينال (PDA)
          </h1>
          <p className="text-xs md:text-sm text-slate-400">
            شاشة استعلام وفحص الأسعار التفاعلية للعميل بالصالة مع النطق الصوتي، وتطبيق الهاند تيرمينال المحمول للموظفين: فحص ومطابقة أسعار الأرفف، طباعة الاستيكرات بالبلوتوث، الجرد المتنقل المستمر، وتفكيك طوابير الكاشير (Line Busting).
          </p>
        </div>

        {/* Top Control View Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => {
              setActiveSystemView('kiosk');
              setIsScreenSaverActive(false);
            }}
            className={cn(
              "px-5 py-3 rounded-2xl font-black text-xs transition-all flex items-center gap-2 shadow-lg",
              activeSystemView === 'kiosk' && !isScreenSaverActive
                ? "bg-amber-500 text-slate-950 shadow-amber-500/25 ring-2 ring-amber-400"
                : "bg-slate-900 border border-slate-800 text-slate-300 hover:text-white"
            )}
          >
            <Tv size={18} />
            <span>شاشة كشك استعلام العميل (Kiosk)</span>
          </button>

          <button
            onClick={() => {
              setActiveSystemView('kiosk');
              setIsScreenSaverActive(true);
            }}
            className={cn(
              "px-5 py-3 rounded-2xl font-black text-xs transition-all flex items-center gap-2 shadow-lg",
              activeSystemView === 'kiosk' && isScreenSaverActive
                ? "bg-amber-500 text-slate-950 shadow-amber-500/25 ring-2 ring-amber-400"
                : "bg-slate-900 border border-slate-800 text-slate-300 hover:text-white"
            )}
            title="تشغيل شاشات الإعلانات والفيديوهات الترويجية والعروض"
          >
            <Play size={18} className="text-amber-400" />
            <span>شاشات الإعلانات والفيديوهات (Digital Signage)</span>
          </button>

          <button
            onClick={() => setActiveSystemView('pda')}
            className={cn(
              "px-5 py-3 rounded-2xl font-black text-xs transition-all flex items-center gap-2 shadow-lg",
              activeSystemView === 'pda'
                ? "bg-amber-500 text-slate-950 shadow-amber-500/25 ring-2 ring-amber-400"
                : "bg-slate-900 border border-slate-800 text-slate-300 hover:text-white"
            )}
          >
            <Smartphone size={18} />
            <span>جهاز الهاند تيرمينال للموظف (PDA)</span>
          </button>

          <button
            onClick={() => setActiveSystemView('audit_log')}
            className={cn(
              "px-4 py-3 rounded-2xl font-bold text-xs transition-all flex items-center gap-2 shadow-lg",
              activeSystemView === 'audit_log'
                ? "bg-amber-500 text-slate-950 shadow-amber-500/25"
                : "bg-slate-900 border border-slate-800 text-slate-300 hover:text-white"
            )}
          >
            <FileText size={16} />
            <span>سجل الرقابة والطباعة</span>
          </button>

          <button
            onClick={() => setIsAdManagerOpen(true)}
            className="px-4 py-3 rounded-2xl font-bold text-xs bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/40 transition-all flex items-center gap-2 shadow-lg"
            title="إدارة ونشر الفيديوهات والإعلانات الترويجية على الشاشات"
          >
            <Sliders size={16} />
            <span>إدارة الإعلانات الترويجية (Ads Manager)</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* VIEW 1: CUSTOMER PRICE CHECKER KIOSK (كشك استعلام الأسعار التفاعلي بالصالة) */}
      {/* ========================================================================= */}
      {activeSystemView === 'kiosk' && (
        <div className="space-y-6">
          {/* Live Promotional Ticker Bar */}
          {signageSettings?.showTickerBar && (
            <KioskPromotionalTicker 
              tickerText={signageSettings.tickerTextAr} 
              storeName={signageSettings.storeNameAr} 
            />
          )}

          {/* Kiosk Floating Barcode Trigger Bar */}
          <div className="bg-[#101623] border border-amber-500/30 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center transition-all",
                isChimeActive ? "bg-amber-500 text-slate-950 scale-110 shadow-lg shadow-amber-500/50" : "bg-slate-800 text-amber-400"
              )}>
                <Barcode size={22} />
              </div>
              <div>
                <p className="text-xs font-black text-white flex items-center gap-2">
                  <span>ماسح كشك الأسعار (Laser / Camera Scanner Barcode)</span>
                  {isChimeActive && <span className="text-[10px] text-amber-400 font-mono animate-pulse">✓ تم المسح بنجاح!</span>}
                </p>
                <p className="text-[10px] text-slate-400">{scanStatusMessage}</p>
              </div>
            </div>

            {/* Barcode Quick Simulators & Manual Input */}
            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-slate-400 font-bold">أصناف سريعة للاختبار:</span>
                {products.map(p => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => executeScan(p.barcode)}
                    className={cn(
                      "px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all truncate max-w-[130px]",
                      scannedBarcode === p.barcode 
                        ? "bg-amber-500/20 text-amber-300 border-amber-500" 
                        : "bg-slate-800 text-slate-300 border-slate-700 hover:border-slate-500"
                    )}
                  >
                    {p.nameAr.split(' ')[0]} {p.nameAr.split(' ')[1] || ''}
                  </button>
                ))}
              </div>

              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  executeScan(manualBarcodeInput);
                  setManualBarcodeInput('');
                }}
                className="flex items-center gap-1.5"
              >
                <input
                  type="text"
                  value={manualBarcodeInput}
                  onChange={(e) => setManualBarcodeInput(e.target.value)}
                  placeholder="ادخل الباركود أو SKU..."
                  className="bg-[#151b2b] border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white font-mono w-40 focus:outline-none focus:border-amber-500"
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-1 transition-all"
                >
                  <Search size={14} />
                  <span>فحص</span>
                </button>
              </form>

              <button
                type="button"
                onClick={() => setIsAudioEnabled(!isAudioEnabled)}
                className={cn(
                  "p-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all",
                  isAudioEnabled ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" : "bg-slate-800 text-slate-400 border-slate-700"
                )}
                title="تشغيل / كتم الصوت الناطق بالسعر"
              >
                {isAudioEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
                <span className="text-[10px] hidden sm:inline">{isAudioEnabled ? 'القارئ الصوتي مفعّل' : 'الصوت مكتوم'}</span>
              </button>
            </div>
          </div>

          {/* Screensaver mode or Interactive Product Presentation */}
          {isScreenSaverActive || !currentProduct ? (
            <div className="space-y-4">
              <DigitalSignageMediaPlayer
                onScanPromptClick={() => {
                  setIsScreenSaverActive(false);
                }}
                onOpenAdManager={() => setIsAdManagerOpen(true)}
                isFullscreenSignage={isFullscreenSignage}
                onToggleFullscreen={() => setIsFullscreenSignage(!isFullscreenSignage)}
                customAdList={mediaAds}
              />
            </div>
          ) : currentProduct ? (
            /* Active Product Interactive Showcase */
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Product Visual & Pricing Card */}
              <div className="lg:col-span-8 bg-[#151b2b] border border-amber-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 relative overflow-hidden">
                <div className="flex flex-col sm:flex-row items-start gap-6">
                  {/* Product Image */}
                  <div className="w-full sm:w-56 h-56 rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shrink-0 relative flex items-center justify-center p-2">
                    {currentProduct.imageUrl ? (
                      <img 
                        src={currentProduct.imageUrl} 
                        alt={currentProduct.nameAr}
                        className="w-full h-full object-cover rounded-xl"
                      />
                    ) : (
                      <ShoppingBag size={64} className="text-slate-600" />
                    )}
                    {currentProduct.hasPromotion && (
                      <div className="absolute top-3 right-3 bg-rose-600 text-white font-black text-xs px-3 py-1 rounded-full shadow-lg flex items-center gap-1">
                        <Flame size={14} />
                        <span>خصم {currentProduct.promoDiscountPercent}%</span>
                      </div>
                    )}
                  </div>

                  {/* Product Header & Pricing Details */}
                  <div className="space-y-4 flex-1">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded bg-slate-800 text-amber-400 border border-slate-700 text-xs font-mono font-bold">
                          {currentProduct.category}
                        </span>
                        {currentProduct.brand && (
                          <span className="px-2.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 text-xs font-bold">
                            {currentProduct.brand}
                          </span>
                        )}
                        <span className="px-2.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-mono">
                          باركود: {currentProduct.barcode}
                        </span>
                      </div>
                      <h2 className="text-xl sm:text-2xl font-black text-white leading-snug">
                        {currentProduct.nameAr}
                      </h2>
                      <p className="text-xs text-slate-400 font-sans">
                        {currentProduct.nameEn}
                      </p>
                    </div>

                    {/* Big Bold Price Display */}
                    <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <p className="text-xs text-slate-400 font-bold mb-1">
                          {currentProduct.hasPromotion ? 'السعر النهائي بعد العرض والتخفيض:' : 'سعر المستهلك (شامل ضريبة القيمة المضافة):'}
                        </p>
                        <div className="flex items-baseline gap-3">
                          <span className="text-3xl sm:text-4xl font-black text-amber-400 font-mono">
                            {formatCurrency(currentProduct.hasPromotion && currentProduct.promoPrice ? currentProduct.promoPrice : currentProduct.finalPriceWithTax)}
                          </span>
                          <span className="text-xs text-slate-400">/ {currentProduct.unit}</span>
                          
                          {currentProduct.hasPromotion && currentProduct.promoPrice && (
                            <span className="text-lg text-slate-500 line-through font-mono">
                              {formatCurrency(currentProduct.retailPrice)}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Promo or Savings Box */}
                      {currentProduct.hasPromotion && (
                        <div className="bg-rose-950/40 border border-rose-500/40 rounded-xl p-3 text-right">
                          <p className="text-xs font-bold text-rose-300 flex items-center gap-1">
                            <Flame size={14} className="text-rose-400" />
                            <span>وفرت في هذا الصنف:</span>
                          </p>
                          <p className="text-base font-black text-rose-400 font-mono mt-0.5">
                            {formatCurrency(currentProduct.retailPrice - (currentProduct.promoPrice || 0))}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Promotion Banner */}
                    {currentProduct.hasPromotion && currentProduct.promoLabel && (
                      <div className="bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-transparent border border-amber-500/30 rounded-xl p-3 flex items-center gap-2.5">
                        <Sparkles size={18} className="text-amber-400 shrink-0" />
                        <div>
                          <p className="text-xs font-black text-amber-300">{currentProduct.promoLabel}</p>
                          {currentProduct.promoValidUntil && (
                            <p className="text-[10px] text-slate-400">العرض ساري حتى تاريخ: {currentProduct.promoValidUntil}</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Tier Pricing & Wholesale Levels */}
                <div className="space-y-3 pt-2 border-t border-slate-800">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-black text-white flex items-center gap-1.5">
                      <Tag size={16} className="text-amber-400" />
                      <span>مستويات أسعار الكميات والتوفير (Tier Pricing):</span>
                    </p>
                    <span className="text-[11px] text-slate-400">وفر أكثر عند شراء كميات أكبر</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {currentProduct.priceLevels.map((lvl, index) => (
                      <div 
                        key={index}
                        className={cn(
                          "p-3.5 rounded-xl border text-right space-y-1 transition-all",
                          index === 0 ? "bg-amber-500/10 border-amber-500/40 text-amber-300" : "bg-[#0f172a] border-slate-800 text-slate-300"
                        )}
                      >
                        <p className="text-xs font-bold">{lvl.levelNameAr}</p>
                        <div className="flex items-baseline justify-between">
                          <span className="text-lg font-black font-mono text-white">
                            {formatCurrency(lvl.price)}
                          </span>
                          <span className="text-[10px] text-slate-400">للـ {currentProduct.unit}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Description & Additional Info */}
                {currentProduct.descriptionAr && (
                  <div className="bg-[#0f172a] p-4 rounded-2xl border border-slate-800 space-y-1">
                    <p className="text-xs font-bold text-slate-300">مواصفات واستخدام المنتج:</p>
                    <p className="text-xs text-slate-400 leading-relaxed">{currentProduct.descriptionAr}</p>
                  </div>
                )}

                {/* Return to Digital Signage & Video Ads Banner */}
                <div className="pt-2 flex items-center justify-between gap-4 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => {
                      setCurrentProduct(null);
                      setIsScreenSaverActive(true);
                    }}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold transition-all"
                  >
                    <Tv size={16} />
                    <span>العودة لشاشات العروض والفيديوهات الترويجية</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsAdManagerOpen(true)}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all"
                  >
                    <Sliders size={14} />
                    <span>إعدادات الإعلانات</span>
                  </button>
                </div>
              </div>

              {/* Sidebar: Loyalty Points, Stock, Shelf & Cross-Selling */}
              <div className="lg:col-span-4 space-y-6">
                {/* Loyalty Program Reward Box */}
                <div className="bg-gradient-to-br from-[#151b2b] to-[#1e1730] border border-purple-500/40 rounded-3xl p-6 shadow-xl space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center justify-center">
                      <Award size={22} />
                    </div>
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                      برنامج ولاء ومكافآت MARO
                    </span>
                  </div>

                  <div>
                    <p className="text-xs text-slate-300 font-bold">النقاط المكتسبة عند الشراء:</p>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="text-3xl font-black text-purple-400 font-mono">
                        +{currentProduct.loyaltyPointsEarned}
                      </span>
                      <span className="text-xs text-slate-400">نقطة تضاف لمحفظتك</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      يمكن استبدال النقاط بخصومات نقدية وقسائم مشتريات عند الكاشير.
                    </p>
                  </div>
                </div>

                {/* Shelf Location & In-Store Availability */}
                <div className="bg-[#151b2b] border border-slate-800 rounded-3xl p-6 shadow-xl space-y-3">
                  <p className="text-xs font-black text-white flex items-center gap-1.5">
                    <MapPin size={16} className="text-emerald-400" />
                    <span>موقع الصنف بالصالة والمخزن:</span>
                  </p>

                  <div className="bg-[#0f172a] p-3.5 rounded-xl border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">مكان الرف:</span>
                      <span className="font-bold text-emerald-400">{currentProduct.shelfLocation}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">الرصيد المتاح بالفرع:</span>
                      <span className="font-mono font-bold text-white">{currentProduct.stockInCurrentBranch} {currentProduct.unit}</span>
                    </div>
                    {currentProduct.expiryDate && (
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400">تاريخ الصلاحية:</span>
                        <span className="font-mono font-bold text-slate-300">{currentProduct.expiryDate}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Suggested Alternatives / Upsell */}
                {currentProduct.alternativeProducts && currentProduct.alternativeProducts.length > 0 && (
                  <div className="bg-[#151b2b] border border-slate-800 rounded-3xl p-6 shadow-xl space-y-3">
                    <p className="text-xs font-black text-white flex items-center gap-1.5">
                      <Sparkles size={16} className="text-amber-400" />
                      <span>منتجات بديلة ومقترحة:</span>
                    </p>

                    <div className="space-y-2">
                      {currentProduct.alternativeProducts.map(alt => (
                        <button
                          key={alt.id}
                          type="button"
                          onClick={() => executeScan(alt.barcode)}
                          className="w-full p-3 rounded-xl bg-[#0f172a] border border-slate-800 hover:border-amber-500/50 transition-all text-right flex items-center justify-between gap-3"
                        >
                          <div>
                            <p className="text-xs font-bold text-white">{alt.nameAr}</p>
                            <p className="text-[10px] text-amber-400/80 mt-0.5">{alt.reason}</p>
                          </div>
                          <div className="text-left shrink-0">
                            <p className="text-xs font-black text-amber-400 font-mono">{formatCurrency(alt.price)}</p>
                            <p className="text-[10px] text-slate-500">متوفر {alt.stock}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 2: EMPLOYEE HANDHELD PDA TERMINAL (جهاز الهاند تيرمينال المتنقل للموظفين) */}
      {/* ========================================================================= */}
      {activeSystemView === 'pda' && (
        <div className="space-y-6">
          {/* PDA Device Header Bar */}
          <div className="bg-[#151b2b] border-2 border-amber-500/40 rounded-3xl p-5 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shadow-lg">
                <Smartphone size={26} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm sm:text-base font-black text-white">{pdaDevice.deviceName}</h3>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
                    ONLINE ✓
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  {pdaDevice.assignedStaffName} • {pdaDevice.branchName}
                </p>
              </div>
            </div>

            {/* Device Hardware Status Indicators */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="bg-[#0f172a] px-3 py-2 rounded-xl border border-slate-800 flex items-center gap-2 text-xs">
                <BatteryCharging size={16} className="text-emerald-400" />
                <span className="font-mono font-bold text-white">{pdaDevice.batteryPercent}%</span>
              </div>

              <div className="bg-[#0f172a] px-3 py-2 rounded-xl border border-slate-800 flex items-center gap-2 text-xs">
                <Wifi size={16} className="text-sky-400" />
                <span className="text-slate-300">شبكة قوية</span>
              </div>

              <div className="bg-[#0f172a] px-3 py-2 rounded-xl border border-slate-800 flex items-center gap-2 text-xs">
                <Printer size={16} className={pdaDevice.bluetoothPrinterConnected ? "text-emerald-400" : "text-slate-500"} />
                <span className="text-slate-300 truncate max-w-[150px]">
                  {pdaDevice.bluetoothPrinterConnected ? 'طابعة البلوتوث متصلة' : 'لا توجد طابعة'}
                </span>
              </div>
            </div>
          </div>

          {/* PDA Sub-Mode Navigation */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2.5">
            <button
              onClick={() => setPdaSubMode('PRICE_CHECK')}
              className={cn(
                "p-3 rounded-2xl border text-right transition-all flex flex-col justify-between space-y-2",
                pdaSubMode === 'PRICE_CHECK'
                  ? "bg-amber-600/20 border-amber-500 text-white shadow-lg ring-1 ring-amber-500/30"
                  : "bg-[#151b2b] border-slate-800 text-slate-400 hover:text-white"
              )}
            >
              <div className="flex items-center justify-between">
                <Tag size={18} className={pdaSubMode === 'PRICE_CHECK' ? "text-amber-400" : "text-slate-400"} />
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-900 text-slate-400">1</span>
              </div>
              <div>
                <p className="text-xs font-black">فحص الأسعار والرف</p>
                <p className="text-[10px] text-slate-400">مطابقة وطباعة الاستيكر</p>
              </div>
            </button>

            <button
              onClick={() => setPdaSubMode('STOCK_COUNT')}
              className={cn(
                "p-3 rounded-2xl border text-right transition-all flex flex-col justify-between space-y-2",
                pdaSubMode === 'STOCK_COUNT'
                  ? "bg-amber-600/20 border-amber-500 text-white shadow-lg ring-1 ring-amber-500/30"
                  : "bg-[#151b2b] border-slate-800 text-slate-400 hover:text-white"
              )}
            >
              <div className="flex items-center justify-between">
                <Boxes size={18} className={pdaSubMode === 'STOCK_COUNT' ? "text-amber-400" : "text-slate-400"} />
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-900 text-slate-400">2</span>
              </div>
              <div>
                <p className="text-xs font-black">الجرد المخزني المتنقل</p>
                <p className="text-[10px] text-slate-400">حصر الفعلي والدفتري</p>
              </div>
            </button>

            <button
              onClick={() => setPdaSubMode('LABEL_PRINT')}
              className={cn(
                "p-3 rounded-2xl border text-right transition-all flex flex-col justify-between space-y-2",
                pdaSubMode === 'LABEL_PRINT'
                  ? "bg-amber-600/20 border-amber-500 text-white shadow-lg ring-1 ring-amber-500/30"
                  : "bg-[#151b2b] border-slate-800 text-slate-400 hover:text-white"
              )}
            >
              <div className="flex items-center justify-between">
                <Printer size={18} className={pdaSubMode === 'LABEL_PRINT' ? "text-amber-400" : "text-slate-400"} />
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-900 text-slate-400">3</span>
              </div>
              <div>
                <p className="text-xs font-black">طباعة بطاقات الرف</p>
                <p className="text-[10px] text-slate-400">طابعة بلوتوث وESL</p>
              </div>
            </button>

            <button
              onClick={() => setPdaSubMode('LINE_BUSTING_SALE')}
              className={cn(
                "p-3 rounded-2xl border text-right transition-all flex flex-col justify-between space-y-2",
                pdaSubMode === 'LINE_BUSTING_SALE'
                  ? "bg-amber-600/20 border-amber-500 text-white shadow-lg ring-1 ring-amber-500/30"
                  : "bg-[#151b2b] border-slate-800 text-slate-400 hover:text-white"
              )}
            >
              <div className="flex items-center justify-between">
                <ShoppingCart size={18} className={pdaSubMode === 'LINE_BUSTING_SALE' ? "text-amber-400" : "text-slate-400"} />
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-900 text-slate-400">4</span>
              </div>
              <div>
                <p className="text-xs font-black">البيع وتفكيك الطوابير</p>
                <p className="text-[10px] text-slate-400">سلة متنقلة Line Busting</p>
              </div>
            </button>

            <button
              onClick={() => setPdaSubMode('GOODS_RECEIVING')}
              className={cn(
                "p-3 rounded-2xl border text-right transition-all flex flex-col justify-between space-y-2",
                pdaSubMode === 'GOODS_RECEIVING'
                  ? "bg-amber-600/20 border-amber-500 text-white shadow-lg ring-1 ring-amber-500/30"
                  : "bg-[#151b2b] border-slate-800 text-slate-400 hover:text-white"
              )}
            >
              <div className="flex items-center justify-between">
                <PackageCheck size={18} className={pdaSubMode === 'GOODS_RECEIVING' ? "text-amber-400" : "text-slate-400"} />
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-900 text-slate-400">5</span>
              </div>
              <div>
                <p className="text-xs font-black">الاستلام وفحص التوريد</p>
                <p className="text-[10px] text-slate-400">مطابقة أوامر الشراء</p>
              </div>
            </button>

            <button
              onClick={() => setPdaSubMode('BIN_TRANSFER')}
              className={cn(
                "p-3 rounded-2xl border text-right transition-all flex flex-col justify-between space-y-2",
                pdaSubMode === 'BIN_TRANSFER'
                  ? "bg-amber-600/20 border-amber-500 text-white shadow-lg ring-1 ring-amber-500/30"
                  : "bg-[#151b2b] border-slate-800 text-slate-400 hover:text-white"
              )}
            >
              <div className="flex items-center justify-between">
                <MapPin size={18} className={pdaSubMode === 'BIN_TRANSFER' ? "text-amber-400" : "text-slate-400"} />
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-900 text-slate-400">6</span>
              </div>
              <div>
                <p className="text-xs font-black">التحويل بين الأرفف</p>
                <p className="text-[10px] text-slate-400">Bin-to-Bin Transfers</p>
              </div>
            </button>
          </div>

          {/* Quick Scanner Bar for PDA */}
          <div className="bg-[#101623] border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 w-full sm:w-auto">
              <Zap className="text-amber-400 shrink-0" size={20} />
              <span className="text-xs font-black text-white">مسح الصنف بالهاند تيرمينال:</span>
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
              {products.map(p => (
                <button
                  key={p.id}
                  onClick={() => executeScan(p.barcode)}
                  className="px-3 py-1.5 rounded-xl bg-[#151b2b] hover:bg-slate-800 border border-slate-700 text-xs text-slate-300 font-bold"
                >
                  مسح: {p.nameAr.split(' ')[0]}
                </button>
              ))}
            </div>
          </div>

          {/* PDA Sub-Feature 1: PRICE_CHECK & SHELF AUDIT */}
          {pdaSubMode === 'PRICE_CHECK' && currentProduct && (
            <div className="bg-[#151b2b] border border-slate-800 rounded-3xl p-6 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                <div>
                  <h3 className="text-lg font-black text-white">{currentProduct.nameAr}</h3>
                  <p className="text-xs text-slate-400 font-mono">باركود: {currentProduct.barcode} • موقع الرف: {currentProduct.shelfLocation}</p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePrintShelfLabel(currentProduct)}
                    className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-emerald-600/20"
                  >
                    <Printer size={16} />
                    <span>طباعة بطاقة الرف بالبلوتوث</span>
                  </button>

                  <button
                    onClick={() => {
                      setOverrideModalProduct(currentProduct);
                      setNewOverridePrice(currentProduct.retailPrice);
                    }}
                    className="px-4 py-2.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-xl text-xs font-bold flex items-center gap-2"
                  >
                    <Sliders size={16} />
                    <span>تعديل السعر السريع (مشرف)</span>
                  </button>
                </div>
              </div>

              {/* Price & Stock Stats Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-[#0f172a] p-4 rounded-2xl border border-slate-800">
                  <p className="text-xs text-slate-400">سعر البيع الحالي</p>
                  <p className="text-xl font-black text-amber-400 font-mono mt-1">{formatCurrency(currentProduct.retailPrice)}</p>
                </div>
                <div className="bg-[#0f172a] p-4 rounded-2xl border border-slate-800">
                  <p className="text-xs text-slate-400">تكلفة الصنف (COGS)</p>
                  <p className="text-xl font-black text-slate-300 font-mono mt-1">{formatCurrency(currentProduct.costPrice)}</p>
                </div>
                <div className="bg-[#0f172a] p-4 rounded-2xl border border-slate-800">
                  <p className="text-xs text-slate-400">الرصيد بالفرع</p>
                  <p className="text-xl font-black text-emerald-400 font-mono mt-1">{currentProduct.stockInCurrentBranch} {currentProduct.unit}</p>
                </div>
                <div className="bg-[#0f172a] p-4 rounded-2xl border border-slate-800">
                  <p className="text-xs text-slate-400">إجمالي الفروع</p>
                  <p className="text-xl font-black text-sky-400 font-mono mt-1">{currentProduct.stockTotalAllBranches} {currentProduct.unit}</p>
                </div>
              </div>
            </div>
          )}

          {/* PDA Sub-Feature 2: STOCK_COUNT (الجرد المخزني المتنقل) */}
          {pdaSubMode === 'STOCK_COUNT' && (
            <div className="bg-[#151b2b] border border-slate-800 rounded-3xl p-6 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                <div>
                  <h3 className="text-lg font-black text-white">الجرد الدوري والمستمر بالأرفف (Mobile Cycle Count)</h3>
                  <p className="text-xs text-slate-400">مسح سريع للباركود، إدخال الكمية الفعلية على الرف، واحتساب العجز والزيادة فورياً</p>
                </div>
                <span className="px-3 py-1 bg-amber-500/20 text-amber-300 rounded-full text-xs font-bold border border-amber-500/30">
                  جلسة الجرد رقم: AUD-2026-08
                </span>
              </div>

              {currentProduct && (
                <div className="bg-[#0f172a] p-5 rounded-2xl border border-amber-500/30 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-amber-400 font-bold">الصنف الممسوح حالياً:</p>
                      <p className="text-base font-black text-white">{currentProduct.nameAr}</p>
                    </div>
                    <span className="font-mono text-xs text-slate-400">الرصيد الدفتري: {currentProduct.stockInCurrentBranch} {currentProduct.unit}</span>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      onClick={() => handleAddStockCountRecord(currentProduct, currentProduct.stockInCurrentBranch)}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5"
                    >
                      <CheckCircle2 size={16} />
                      <span>تأكيد المطابقة ({currentProduct.stockInCurrentBranch} {currentProduct.unit})</span>
                    </button>

                    <button
                      onClick={() => {
                        const qty = prompt(`ادخل الكمية الفعلية الموجودة على الرف لـ [${currentProduct.nameAr}]:`, String(currentProduct.stockInCurrentBranch));
                        if (qty !== null && !isNaN(Number(qty))) {
                          handleAddStockCountRecord(currentProduct, Number(qty));
                        }
                      }}
                      className="px-4 py-2 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-bold flex items-center gap-1.5"
                    >
                      <Plus size={16} />
                      <span>تسجيل كمية أخرى</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Stock Count Grid */}
              <div className="space-y-3">
                <p className="text-xs font-black text-white">سجل الأصناف المجرودة في هذه الجلسة:</p>
                <div className="overflow-x-auto">
                  <table className="w-full text-right text-xs">
                    <thead>
                      <tr className="bg-[#0f172a] text-slate-400 border-b border-slate-800">
                        <th className="p-3">الباركود والصنف</th>
                        <th className="p-3">موقع الرف</th>
                        <th className="p-3">الكمية الدفترية</th>
                        <th className="p-3">الكمية الفعلية</th>
                        <th className="p-3">الفارق (عجز/زيادة)</th>
                        <th className="p-3">الحالة</th>
                        <th className="p-3">الوقت</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {stockCountItems.map(item => (
                        <tr key={item.id} className="hover:bg-slate-800/30">
                          <td className="p-3">
                            <p className="font-bold text-white">{item.productName}</p>
                            <p className="text-[10px] text-slate-400 font-mono">{item.barcode}</p>
                          </td>
                          <td className="p-3 font-mono text-slate-300">{item.shelfLocation}</td>
                          <td className="p-3 font-mono font-bold text-slate-300">{item.expectedQty} {item.unit}</td>
                          <td className="p-3 font-mono font-bold text-white">{item.countedQty} {item.unit}</td>
                          <td className="p-3 font-mono font-bold">
                            <span className={cn(
                              item.differenceQty === 0 ? "text-emerald-400" : item.differenceQty > 0 ? "text-sky-400" : "text-rose-400"
                            )}>
                              {item.differenceQty > 0 ? `+${item.differenceQty}` : item.differenceQty} {item.unit}
                            </span>
                          </td>
                          <td className="p-3">
                            <span className={cn(
                              "px-2 py-0.5 rounded text-[10px] font-bold",
                              item.status === 'MATCH' ? "bg-emerald-500/20 text-emerald-300" : item.status === 'SURPLUS' ? "bg-sky-500/20 text-sky-300" : "bg-rose-500/20 text-rose-300"
                            )}>
                              {item.status === 'MATCH' ? 'مطابق ✓' : item.status === 'SURPLUS' ? 'زيادة' : 'عجز مخزني'}
                            </span>
                          </td>
                          <td className="p-3 text-slate-400 font-mono text-[10px]">{item.countedAt}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* PDA Sub-Feature 4: LINE_BUSTING_SALE (البيع المتنقل وسلة الكاشير) */}
          {pdaSubMode === 'LINE_BUSTING_SALE' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-7 bg-[#151b2b] border border-slate-800 rounded-3xl p-6 space-y-6">
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <div>
                    <h3 className="text-base font-black text-white flex items-center gap-2">
                      <ShoppingCart className="text-amber-400" size={20} />
                      <span>تجهيز سلة المشتريات المتنقلة (Line Busting)</span>
                    </h3>
                    <p className="text-xs text-slate-400">امسح أصناف عربة العميل داخل الصالة لإصدار كود الفاتورة المسبقة</p>
                  </div>
                  <span className="text-xs font-mono font-bold text-amber-400 bg-amber-500/10 px-3 py-1 rounded-xl border border-amber-500/20">
                    {currentBustingItems.length} أصناف بالسلة
                  </span>
                </div>

                {/* Customer Contact input */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-[#0f172a] p-4 rounded-2xl border border-slate-800">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-300 block">اسم العميل (اختياري):</label>
                    <input
                      type="text"
                      value={bustingCustomerName}
                      onChange={(e) => setBustingCustomerName(e.target.value)}
                      placeholder="مثال: أ. وائل الشاذلي"
                      className="w-full bg-[#151b2b] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-300 block">رقم الهاتف:</label>
                    <input
                      type="tel"
                      value={bustingCustomerPhone}
                      onChange={(e) => setBustingCustomerPhone(e.target.value)}
                      placeholder="010XXXXXXXX"
                      className="w-full bg-[#151b2b] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                {/* Active Items in Cart Table */}
                <div className="space-y-3">
                  <p className="text-xs font-black text-white">محتويات سلة العميل الحالية:</p>
                  {currentBustingItems.length === 0 ? (
                    <div className="p-8 text-center bg-[#0f172a] rounded-2xl border border-dashed border-slate-800 text-slate-400 text-xs">
                      السلة فارغة. امسح باركود أي صنف لإضافته مباشرة.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {currentBustingItems.map(item => (
                        <div key={item.productId} className="p-3 bg-[#0f172a] rounded-xl border border-slate-800 flex items-center justify-between gap-3">
                          <div>
                            <p className="text-xs font-bold text-white">{item.nameAr}</p>
                            <p className="text-[10px] text-slate-400 font-mono">سعر الوحدة: {formatCurrency(item.unitPrice)}</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-mono font-bold text-xs text-amber-400">×{item.quantity}</span>
                            <span className="font-mono font-black text-xs text-white">{formatCurrency(item.netTotal)}</span>
                            <button
                              onClick={() => setCurrentBustingItems(prev => prev.filter(i => i.productId !== item.productId))}
                              className="text-rose-400 hover:text-rose-300 p-1"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Cart Subtotal & Save Button */}
                {currentBustingItems.length > 0 && (
                  <div className="bg-amber-950/20 border border-amber-500/30 rounded-2xl p-4 flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs text-slate-400">الإجمالي المستحق للسلة:</p>
                      <p className="text-xl font-black text-amber-400 font-mono">
                        {formatCurrency(currentBustingItems.reduce((acc, i) => acc + i.netTotal, 0))}
                      </p>
                    </div>

                    <button
                      onClick={handleSaveBustingCart}
                      className="px-5 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-amber-500/20 flex items-center gap-2 transition-all"
                    >
                      <QrCode size={18} />
                      <span>توليد كود السلة وطباعة باركود الكاشير 🖨️</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Ready Carts Waiting at POS */}
              <div className="lg:col-span-5 space-y-4">
                <div className="bg-[#151b2b] border border-slate-800 rounded-3xl p-6 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <p className="text-xs font-black text-white flex items-center gap-1.5">
                      <QrCode className="text-emerald-400" size={16} />
                      <span>سلات جاهزة للدفع عند الكاشير ({activeMobileCarts.length})</span>
                    </p>
                    <span className="text-[10px] text-slate-400">Line Busting Queue</span>
                  </div>

                  <div className="space-y-3">
                    {activeMobileCarts.map(cart => (
                      <div key={cart.id} className="p-4 bg-[#0f172a] rounded-2xl border border-emerald-500/30 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="px-3 py-1 rounded-xl bg-emerald-500/20 text-emerald-300 font-mono font-black text-xs border border-emerald-500/40">
                            {cart.cartCode}
                          </span>
                          <span className="text-xs font-mono font-black text-white">{formatCurrency(cart.netTotal)}</span>
                        </div>

                        <div className="text-xs space-y-1 text-slate-300">
                          <p className="font-bold">{cart.customerName}</p>
                          <p className="text-[10px] text-slate-400">أصناف: {cart.items.length} • التوقيت: {cart.createdAt}</p>
                        </div>

                        <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                          <span className="text-[10px] text-slate-400">بواسطة: {cart.createdByAgent}</span>
                          <button
                            onClick={() => alert(`✓ تم تحويل السلة [${cart.cartCode}] مباشرة لشاشة نقطة البيع POS!`)}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1"
                          >
                            <Check size={14} />
                            <span>ترحيل لـ POS</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* PDA Sub-Feature 3: LABEL_PRINT (طباعة بطاقات الرف) */}
          {pdaSubMode === 'LABEL_PRINT' && (
            <div className="bg-[#151b2b] border border-slate-800 rounded-3xl p-6 space-y-6">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <h3 className="text-base font-black text-white">طباعة بطاقات الرف المحمولة (Mobile Shelf Label Printing)</h3>
                  <p className="text-xs text-slate-400">طباعة فورية بالبلوتوث لمقاسات 38x25mm و 50x30mm و 80x40mm</p>
                </div>
                <span className="text-xs text-emerald-400 font-bold bg-emerald-500/10 px-3 py-1 rounded-xl border border-emerald-500/20">
                  الطابعة المتصلة: {pdaDevice.printerModel}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {products.map(p => (
                  <div key={p.id} className="p-4 bg-[#0f172a] rounded-2xl border border-slate-800 space-y-3 flex flex-col justify-between">
                    <div>
                      <p className="text-xs font-bold text-white line-clamp-2">{p.nameAr}</p>
                      <p className="text-[10px] text-slate-400 font-mono mt-1">{p.barcode}</p>
                      <p className="text-base font-black text-amber-400 font-mono mt-2">{formatCurrency(p.retailPrice)}</p>
                    </div>

                    <button
                      onClick={() => handlePrintShelfLabel(p)}
                      className="w-full py-2 bg-slate-800 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
                    >
                      <Printer size={14} />
                      <span>طباعة استيكر الرف</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 3: AUDIT TRAIL & LOGS (سجل الرقابة والعمليات) */}
      {/* ========================================================================= */}
      {activeSystemView === 'audit_log' && (
        <div className="bg-[#151b2b] border border-slate-800 rounded-3xl p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-lg font-black text-white">سجل الرقابة وطباعة بطاقات الرف والجرد المتنقل</h3>
              <p className="text-xs text-slate-400">تتبع دقيق لكافة عمليات الاستعلام، تعديل الأسعار، والاستيكرات المطبوعة لكل موظف</p>
            </div>
            <span className="px-3 py-1 bg-slate-800 text-slate-300 rounded-full text-xs font-bold">
              إجمالي السجلات: {shelfLabelLogs.length + stockCountItems.length} عملية
            </span>
          </div>

          <div className="space-y-3">
            <p className="text-xs font-black text-white">سجل بطاقات الرف المطبوعة (Shelf Label Printing Audit):</p>
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="bg-[#0f172a] text-slate-400 border-b border-slate-800">
                    <th className="p-3">الباركود والصنف</th>
                    <th className="p-3">السعر القديم</th>
                    <th className="p-3">السعر المطبوع الجديد</th>
                    <th className="p-3">المقاس والطابعة</th>
                    <th className="p-3">بواسطة الموظف</th>
                    <th className="p-3">التوقيت</th>
                    <th className="p-3">الحالة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {shelfLabelLogs.map(lbl => (
                    <tr key={lbl.id} className="hover:bg-slate-800/30">
                      <td className="p-3">
                        <p className="font-bold text-white">{lbl.productName}</p>
                        <p className="text-[10px] text-slate-400 font-mono">{lbl.barcode}</p>
                      </td>
                      <td className="p-3 font-mono text-slate-400">
                        {lbl.oldPrice ? formatCurrency(lbl.oldPrice) : '—'}
                      </td>
                      <td className="p-3 font-mono font-bold text-amber-400">
                        {formatCurrency(lbl.newPrice)}
                      </td>
                      <td className="p-3 text-slate-300">
                        <p className="font-mono text-[11px]">{lbl.labelSize}</p>
                        <p className="text-[10px] text-slate-500">{lbl.printerTarget.split(' ')[0]}</p>
                      </td>
                      <td className="p-3 text-slate-300">{lbl.printedBy}</td>
                      <td className="p-3 font-mono text-slate-400 text-[10px]">{lbl.printedAt}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
                          تمت الطباعة ✓
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Quick Price Override (Supervisor Mode) */}
      {overrideModalProduct && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#151b2b] border border-amber-500/50 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-5 animate-scale-up">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-amber-400">
                <Sliders size={20} />
                <h3 className="text-base font-black text-white">تعديل السعر السريع (Supervisor Override)</h3>
              </div>
              <button onClick={() => setOverrideModalProduct(null)} className="text-slate-400 hover:text-white">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-xs font-bold text-white">{overrideModalProduct.nameAr}</p>
                <p className="text-[10px] text-slate-400 font-mono">باركود: {overrideModalProduct.barcode}</p>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300 block">السعر الجديد المقترح:</label>
                <input
                  type="number"
                  value={newOverridePrice}
                  onChange={(e) => setNewOverridePrice(Number(e.target.value))}
                  className="w-full bg-[#0f172a] border border-slate-700 rounded-xl px-4 py-2.5 text-base text-amber-400 font-black font-mono focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300 block">رمز إذن المشرف المصرح (PIN Code):</label>
                <input
                  type="password"
                  value={overrideSupervisorPin}
                  onChange={(e) => setOverrideSupervisorPin(e.target.value)}
                  placeholder="ادخل كود المشرف (الافتراضي: 1234)"
                  className="w-full bg-[#0f172a] border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={handleApplyPriceOverride}
                className="flex-1 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-amber-500/20"
              >
                اعتماد وتحديث السعر وطباعة الاستيكر 🖨️
              </button>
              <button
                onClick={() => setOverrideModalProduct(null)}
                className="px-4 py-3 bg-slate-800 text-slate-300 rounded-xl text-xs font-bold hover:text-white"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Thermal Shelf Label Preview */}
      {activePrintPreviewLabel && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#151b2b] border border-slate-700 rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4 text-center">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                <CheckCircle2 size={16} />
                <span>تم إرسال أمر الطباعة للبلوتوث</span>
              </span>
              <button onClick={() => setActivePrintPreviewLabel(null)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            {/* Thermal Label Simulation */}
            <div className="bg-white text-black p-5 rounded-2xl border-2 border-dashed border-slate-400 text-right space-y-2 shadow-inner font-sans">
              <div className="flex items-center justify-between border-b border-black pb-1">
                <span className="font-black text-xs">MARO HYPERMARKET</span>
                <span className="text-[10px] font-mono">{activePrintPreviewLabel.shelfLocation}</span>
              </div>
              <p className="font-black text-xs leading-snug line-clamp-2">{activePrintPreviewLabel.productName}</p>
              
              <div className="flex items-baseline justify-between pt-1">
                <div>
                  <span className="text-2xl font-black font-mono">{formatCurrency(activePrintPreviewLabel.newPrice)}</span>
                  {activePrintPreviewLabel.oldPrice && (
                    <span className="text-xs line-through text-slate-500 font-mono mr-2">
                      {formatCurrency(activePrintPreviewLabel.oldPrice)}
                    </span>
                  )}
                </div>
                <span className="text-[10px] font-bold">شامل 14% VAT</span>
              </div>

              {activePrintPreviewLabel.promoText && (
                <p className="text-[10px] font-black bg-black text-white text-center py-0.5 rounded">
                  ★ {activePrintPreviewLabel.promoText} ★
                </p>
              )}

              <div className="pt-2 text-center">
                <div className="h-8 bg-slate-900 mx-auto rounded flex items-center justify-center text-white font-mono text-[10px] tracking-widest">
                  ||||| {activePrintPreviewLabel.barcode} |||||
                </div>
              </div>
            </div>

            <button
              onClick={() => setActivePrintPreviewLabel(null)}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold"
            >
              إغلاق المعاينة
            </button>
          </div>
        </div>
      )}

      {/* Digital Signage Ad Manager Studio Modal */}
      <DigitalSignageAdManagerModal
        isOpen={isAdManagerOpen}
        onClose={() => setIsAdManagerOpen(false)}
        onRefreshMedia={refreshMediaAds}
      />
    </div>
  );
};
