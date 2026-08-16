/**
 * @file thermalBarcodeScaleEngine.ts
 * @module خدمات النظام (Services)
 * @description ملف جزء من نظام MARO ERP. الوظيفة: thermalBarcodeScaleEngine.ts.
 */
// MARO ERP - Enterprise Thermal Printer, Barcode Label Designer & Scale PLU Engine
import { 
  BarcodeLabelTemplate, 
  HardwarePrinterProfile, 
  ScaleDeviceConfig, 
  ScalePluItem, 
  PrintJobLog,
  LabelDesignElement,
  ThermalPrintProtocol
} from '../types/thermalBarcodeScale';
import { ProductMaster } from '../types/productMaster';
import { MaroSyncEngine } from '../lib/maroSyncEngine';

// Default Ready-to-Use Enterprise Templates
const DEFAULT_LABEL_TEMPLATES: BarcodeLabelTemplate[] = [
  {
    id: 'tmpl_shelf_50x30',
    code: 'TMPL-SHELF-50X30',
    nameAr: 'بطاقة رف ممتازة للسوبرماركت والتجزئة (50x30 مم)',
    nameEn: 'Supermarket Shelf Edge Label (50x30mm)',
    category: 'SHELF_EDGE_LABEL',
    widthMm: 50,
    heightMm: 30,
    gapMm: 2,
    targetPrinters: ['Xprinter XP-365B', 'Zebra ZD220', 'TSC TE200', 'Bixolon'],
    isDefault: true,
    elements: [
      {
        id: 'el_pname',
        type: 'PRODUCT_NAME_AR',
        labelAr: 'اسم الصنف بالعربي',
        xMm: 2,
        yMm: 2,
        widthMm: 46,
        heightMm: 8,
        fontSizePt: 10,
        fontWeight: 'bold',
        alignment: 'right',
        isVisible: true
      },
      {
        id: 'el_barcode',
        type: 'BARCODE_1D',
        labelAr: 'الباركود الخطي (EAN13 / Code128)',
        xMm: 2,
        yMm: 11,
        widthMm: 28,
        heightMm: 11,
        fontSizePt: 8,
        fontWeight: 'normal',
        alignment: 'center',
        barcodeFormat: 'EAN13',
        includeBarcodeText: true,
        isVisible: true
      },
      {
        id: 'el_price',
        type: 'PRICE_RETAIL',
        labelAr: 'سعر البيع النهائي (شامل الضريبة)',
        xMm: 31,
        yMm: 11,
        widthMm: 17,
        heightMm: 12,
        fontSizePt: 16,
        fontWeight: 'black',
        alignment: 'center',
        isVisible: true
      },
      {
        id: 'el_unit',
        type: 'UNIT_NAME',
        labelAr: 'الوحدة (قطعة / كجم / كرتونة)',
        xMm: 31,
        yMm: 24,
        widthMm: 17,
        heightMm: 4,
        fontSizePt: 7,
        fontWeight: 'bold',
        alignment: 'center',
        isVisible: true
      },
      {
        id: 'el_shelf',
        type: 'SHELF_BIN_LOCATION',
        labelAr: 'موقع الرف والممر (Aisle / Bin)',
        xMm: 2,
        yMm: 24,
        widthMm: 28,
        heightMm: 4,
        fontSizePt: 7,
        fontWeight: 'normal',
        alignment: 'right',
        isVisible: true
      }
    ],
    updatedAt: new Date().toISOString()
  },
  {
    id: 'tmpl_product_38x25',
    code: 'TMPL-PROD-38X25',
    nameAr: 'استيكر باركود منتج قياسي صغير (38x25 مم)',
    nameEn: 'Compact Product Barcode (38x25mm)',
    category: 'PRODUCT_BARCODE',
    widthMm: 38,
    heightMm: 25,
    gapMm: 2,
    targetPrinters: ['Xprinter XP-235B', 'Zebra ZD421', 'TSC TTP-244 Pro', 'HPRT'],
    isDefault: true,
    elements: [
      {
        id: 'el_p1',
        type: 'PRODUCT_NAME_AR',
        labelAr: 'اسم الصنف',
        xMm: 2,
        yMm: 1.5,
        widthMm: 34,
        heightMm: 6,
        fontSizePt: 8,
        fontWeight: 'bold',
        alignment: 'center',
        isVisible: true
      },
      {
        id: 'el_p2',
        type: 'BARCODE_1D',
        labelAr: 'باركود الصنف',
        xMm: 2,
        yMm: 8,
        widthMm: 34,
        heightMm: 11,
        fontSizePt: 7,
        fontWeight: 'normal',
        alignment: 'center',
        barcodeFormat: 'CODE128',
        includeBarcodeText: true,
        isVisible: true
      },
      {
        id: 'el_p3',
        type: 'PRICE_RETAIL',
        labelAr: 'السعر',
        xMm: 2,
        yMm: 19.5,
        widthMm: 34,
        heightMm: 5,
        fontSizePt: 10,
        fontWeight: 'black',
        alignment: 'center',
        isVisible: true
      }
    ],
    updatedAt: new Date().toISOString()
  },
  {
    id: 'tmpl_scale_60x40',
    code: 'TMPL-SCALE-60X40',
    nameAr: 'ملصق موازين الباركود الحرارية بالوزن والصلاحية (60x40 مم)',
    nameEn: 'Barcode Weight Scale Label (60x40mm)',
    category: 'SCALE_WEIGHT_LABEL',
    widthMm: 60,
    heightMm: 40,
    gapMm: 2,
    targetPrinters: ['CAS CL5000', 'Digi SM100', 'Rongta RLS1000', 'Mettler Toledo'],
    isDefault: true,
    elements: [
      {
        id: 'el_sc_name',
        type: 'PRODUCT_NAME_AR',
        labelAr: 'اسم الصنف الموزون',
        xMm: 3,
        yMm: 2,
        widthMm: 54,
        heightMm: 8,
        fontSizePt: 12,
        fontWeight: 'black',
        alignment: 'center',
        isVisible: true
      },
      {
        id: 'el_sc_weight',
        type: 'WEIGHT_KG',
        labelAr: 'الوزن الصافي (كجم)',
        xMm: 3,
        yMm: 11,
        widthMm: 26,
        heightMm: 8,
        fontSizePt: 13,
        fontWeight: 'black',
        alignment: 'right',
        isVisible: true
      },
      {
        id: 'el_sc_price_per_kg',
        type: 'PRICE_RETAIL',
        labelAr: 'سعر الكيلو',
        xMm: 31,
        yMm: 11,
        widthMm: 26,
        heightMm: 8,
        fontSizePt: 11,
        fontWeight: 'bold',
        alignment: 'left',
        isVisible: true
      },
      {
        id: 'el_sc_barcode',
        type: 'BARCODE_1D',
        labelAr: 'باركود الميزان المدمج (21XXXXXWWWWW)',
        xMm: 3,
        yMm: 20,
        widthMm: 34,
        heightMm: 13,
        fontSizePt: 8,
        fontWeight: 'normal',
        alignment: 'center',
        barcodeFormat: 'EAN13',
        includeBarcodeText: true,
        isVisible: true
      },
      {
        id: 'el_sc_total_price',
        type: 'PRICE_PROMO',
        labelAr: 'المبلغ الإجمالي المستحق',
        xMm: 38,
        yMm: 20,
        widthMm: 20,
        heightMm: 13,
        fontSizePt: 15,
        fontWeight: 'black',
        alignment: 'center',
        isVisible: true
      },
      {
        id: 'el_sc_dates',
        type: 'EXPIRY_DATE',
        labelAr: 'تاريخ التعبئة والصلاحية',
        xMm: 3,
        yMm: 34,
        widthMm: 54,
        heightMm: 5,
        fontSizePt: 7,
        fontWeight: 'normal',
        alignment: 'center',
        isVisible: true
      }
    ],
    updatedAt: new Date().toISOString()
  },
  {
    id: 'tmpl_receipt_80mm',
    code: 'TMPL-RECEIPT-80MM',
    nameAr: 'نموذج فاتورة وإيصال كاشير حراري متوافق مع هيئة الزكاة (80 مم)',
    nameEn: 'Thermal POS Receipt with ZATCA QR (80mm)',
    category: 'RECEIPT_THERMAL_80MM',
    widthMm: 80,
    heightMm: 160,
    gapMm: 0,
    targetPrinters: ['Epson TM-T20III', 'Bixolon SRP-330', 'Xprinter XP-Q800', 'Citizen CT-S310'],
    isDefault: true,
    elements: [
      {
        id: 'el_rec_header',
        type: 'STATIC_TEXT',
        labelAr: 'ترويسة الشركة والفرع',
        xMm: 2,
        yMm: 2,
        widthMm: 76,
        heightMm: 10,
        fontSizePt: 13,
        fontWeight: 'black',
        alignment: 'center',
        staticCustomText: 'سوبر ماركت ومتاجر MARO المركزية',
        isVisible: true
      },
      {
        id: 'el_rec_zatca_qr',
        type: 'ZATCA_QR',
        labelAr: 'رمز الاستجابة السريع للفوترة الإلكترونية (ZATCA QR)',
        xMm: 25,
        yMm: 14,
        widthMm: 30,
        heightMm: 30,
        fontSizePt: 8,
        fontWeight: 'normal',
        alignment: 'center',
        isVisible: true
      },
      {
        id: 'el_rec_footer',
        type: 'STATIC_TEXT',
        labelAr: 'تذييل الفاتورة والشكر',
        xMm: 2,
        yMm: 50,
        widthMm: 76,
        heightMm: 8,
        fontSizePt: 9,
        fontWeight: 'bold',
        alignment: 'center',
        staticCustomText: 'شكراً لزيارتكم - البضاعة المباعة ترد وتستبدل خلال 14 يوماً',
        isVisible: true
      }
    ],
    updatedAt: new Date().toISOString()
  }
];

// Seed Connected Scale Devices
const DEFAULT_SCALE_DEVICES: ScaleDeviceConfig[] = [
  {
    id: 'scale_dev_1',
    name: 'ميزان قسم الأجبان والألبان (CAS CL5200)',
    branchId: 'BR-01',
    branchName: 'الفرع الرئيسي',
    departmentName: 'قسم الأجبان والألبان',
    modelProtocol: 'CAS_CL5000',
    ipAddress: '192.168.1.150',
    port: 2004,
    barcodePrefix: '21',
    itemCodeLength: 5,
    valueLength: 5,
    decimalPlaces: 3,
    barcodeType: 'WEIGHT_EMBEDDED',
    connectionStatus: 'CONNECTED',
    lastSyncTime: 'اليوم 10:30 ص',
    syncedPluCount: 68,
    totalPluCount: 68
  },
  {
    id: 'scale_dev_2',
    name: 'ميزان قسم الجزارة واللحوم الطازجة (Digi SM-100)',
    branchId: 'BR-01',
    branchName: 'الفرع الرئيسي',
    departmentName: 'قسم الجزارة واللحوم',
    modelProtocol: 'DIGI_SM',
    ipAddress: '192.168.1.151',
    port: 1001,
    barcodePrefix: '21',
    itemCodeLength: 5,
    valueLength: 5,
    decimalPlaces: 3,
    barcodeType: 'WEIGHT_EMBEDDED',
    connectionStatus: 'CONNECTED',
    lastSyncTime: 'اليوم 10:45 ص',
    syncedPluCount: 42,
    totalPluCount: 42
  },
  {
    id: 'scale_dev_3',
    name: 'ميزان قسم الخضار والفاكهة (Rongta RLS1000)',
    branchId: 'BR-01',
    branchName: 'الفرع الرئيسي',
    departmentName: 'قسم الخضار والفواكه',
    modelProtocol: 'RONGTA_RLS',
    ipAddress: '192.168.1.152',
    port: 4001,
    barcodePrefix: '21',
    itemCodeLength: 5,
    valueLength: 5,
    decimalPlaces: 3,
    barcodeType: 'WEIGHT_EMBEDDED',
    connectionStatus: 'CONNECTED',
    lastSyncTime: 'اليوم 09:15 ص',
    syncedPluCount: 115,
    totalPluCount: 115
  }
];

// Seed Scale PLUs
const DEFAULT_SCALE_PLUS: ScalePluItem[] = [
  {
    id: 'plu_01',
    pluNumber: 1,
    itemCode: '00101',
    productId: 'prod_cheese_romi',
    productNameAr: 'جبنة رومي قديمة فاخرة ممتازة',
    productNameEn: 'Aged Roumy Cheese',
    unitPrice: 380,
    unit: 'كجم',
    tareWeightKg: 0.010,
    shelfLifeDays: 90,
    departmentCode: 1,
    hotkeySlot: 1,
    barcodeFormat: '2100101WWWWWC',
    syncedToScales: ['scale_dev_1']
  },
  {
    id: 'plu_02',
    pluNumber: 2,
    itemCode: '00102',
    productId: 'prod_cheese_feta',
    productNameAr: 'جبنة فيتا طبيعي دومتي اسطنبولي',
    productNameEn: 'Natural Feta Cheese',
    unitPrice: 160,
    unit: 'كجم',
    tareWeightKg: 0.015,
    shelfLifeDays: 30,
    departmentCode: 1,
    hotkeySlot: 2,
    barcodeFormat: '2100102WWWWWC',
    syncedToScales: ['scale_dev_1']
  },
  {
    id: 'plu_03',
    pluNumber: 10,
    itemCode: '00201',
    productId: 'prod_meat_beef',
    productNameAr: 'لحم بقري بلدي مفروم طازج خالي من الدهن',
    productNameEn: 'Fresh Minced Beef Local',
    unitPrice: 420,
    unit: 'كجم',
    tareWeightKg: 0.015,
    shelfLifeDays: 3,
    departmentCode: 2,
    hotkeySlot: 1,
    barcodeFormat: '2100201WWWWWC',
    syncedToScales: ['scale_dev_2']
  },
  {
    id: 'plu_04',
    pluNumber: 20,
    itemCode: '00301',
    productId: 'prod_fruit_apple',
    productNameAr: 'تفاح أحمر إيطالي سكري فرز أول',
    productNameEn: 'Italian Red Apple Premium',
    unitPrice: 95,
    unit: 'كجم',
    tareWeightKg: 0.005,
    shelfLifeDays: 14,
    departmentCode: 3,
    hotkeySlot: 1,
    barcodeFormat: '2100301WWWWWC',
    syncedToScales: ['scale_dev_3']
  }
];

// Seed Connected Hardware Printers
const DEFAULT_PRINTER_PROFILES: HardwarePrinterProfile[] = [
  {
    id: 'prn_01',
    name: 'طابعة إيصالات الكاشير الرئيسية (POS Receipt 80mm)',
    brandModel: 'Epson TM-T20III High Speed',
    deviceType: 'THERMAL_RECEIPT',
    connection: 'USB_RAW',
    ipOrPort: 'USB:EPSON-TM-T20',
    paperWidthMm: 80,
    dpi: 203,
    protocol: 'ESC_POS',
    isCashDrawerConnected: true,
    autoCutPaper: true,
    isDefault: true,
    testPrintStatus: 'SUCCESS'
  },
  {
    id: 'prn_02',
    name: 'طابعة استيكرات الباركود والأرفف (Barcode Label Printer)',
    brandModel: 'Xprinter XP-365B / XP-420B',
    deviceType: 'LABEL_BARCODE',
    connection: 'USB_RAW',
    ipOrPort: 'USB:XPRINTER-365B',
    paperWidthMm: 50,
    dpi: 203,
    protocol: 'TSPL',
    isCashDrawerConnected: false,
    autoCutPaper: false,
    isDefault: true,
    testPrintStatus: 'SUCCESS'
  },
  {
    id: 'prn_03',
    name: 'طابعة البلوتوث المتنقلة لأجهزة الهاند تيرمينال (Mobile BT)',
    brandModel: 'Bixolon SPP-R200 / Zebra ZQ320',
    deviceType: 'MOBILE_BLUETOOTH',
    connection: 'BLUETOOTH',
    ipOrPort: 'BT:BIXOLON-SPP-R200',
    paperWidthMm: 58,
    dpi: 203,
    protocol: 'CPCL',
    isCashDrawerConnected: false,
    autoCutPaper: false,
    isDefault: false,
    testPrintStatus: 'SUCCESS'
  },
  {
    id: 'prn_04',
    name: 'طابعة أوامر المطبخ والتحضير (Kitchen Network Printer)',
    brandModel: 'Bixolon SRP-350III Ethernet',
    deviceType: 'KITCHEN_ORDER',
    connection: 'NETWORK_TCP',
    ipOrPort: '192.168.1.188:9100',
    paperWidthMm: 80,
    dpi: 203,
    protocol: 'ESC_POS',
    isCashDrawerConnected: false,
    autoCutPaper: true,
    isDefault: false,
    testPrintStatus: 'SUCCESS'
  }
];

export class ThermalBarcodeScaleEngine {
  private static TEMPLATES_KEY = 'thermal_barcode_label_templates';
  private static SCALES_KEY = 'thermal_scale_devices';
  private static PLUS_KEY = 'thermal_scale_plus';
  private static PRINTERS_KEY = 'thermal_printer_profiles';
  private static LOGS_KEY = 'thermal_print_job_logs';

  // -------------------------------------------------------------
  // Template Management
  // -------------------------------------------------------------
  static getTemplates(): BarcodeLabelTemplate[] {
    const saved = MaroSyncEngine.getLocalCollection<BarcodeLabelTemplate>(this.TEMPLATES_KEY);
    if (saved && saved.length > 0) return saved;
    MaroSyncEngine.setLocalCollection(this.TEMPLATES_KEY, DEFAULT_LABEL_TEMPLATES);
    return DEFAULT_LABEL_TEMPLATES;
  }

  static saveTemplate(template: BarcodeLabelTemplate): void {
    const all = this.getTemplates();
    const index = all.findIndex(t => t.id === template.id);
    let updated: BarcodeLabelTemplate[];
    if (index >= 0) {
      updated = [...all];
      updated[index] = { ...template, updatedAt: new Date().toISOString() };
    } else {
      updated = [template, ...all];
    }
    MaroSyncEngine.setLocalCollection(this.TEMPLATES_KEY, updated);
  }

  static deleteTemplate(id: string): void {
    const all = this.getTemplates();
    const filtered = all.filter(t => t.id !== id);
    MaroSyncEngine.setLocalCollection(this.TEMPLATES_KEY, filtered);
  }

  // -------------------------------------------------------------
  // Scale Devices & PLU Management
  // -------------------------------------------------------------
  static getScales(): ScaleDeviceConfig[] {
    const saved = MaroSyncEngine.getLocalCollection<ScaleDeviceConfig>(this.SCALES_KEY);
    if (saved && saved.length > 0) return saved;
    MaroSyncEngine.setLocalCollection(this.SCALES_KEY, DEFAULT_SCALE_DEVICES);
    return DEFAULT_SCALE_DEVICES;
  }

  static saveScale(scale: ScaleDeviceConfig): void {
    const all = this.getScales();
    const index = all.findIndex(s => s.id === scale.id);
    let updated: ScaleDeviceConfig[];
    if (index >= 0) {
      updated = [...all];
      updated[index] = scale;
    } else {
      updated = [...all, scale];
    }
    MaroSyncEngine.setLocalCollection(this.SCALES_KEY, updated);
  }

  static getPluList(): ScalePluItem[] {
    const saved = MaroSyncEngine.getLocalCollection<ScalePluItem>(this.PLUS_KEY);
    if (saved && saved.length > 0) return saved;
    MaroSyncEngine.setLocalCollection(this.PLUS_KEY, DEFAULT_SCALE_PLUS);
    return DEFAULT_SCALE_PLUS;
  }

  static savePlu(plu: ScalePluItem): void {
    const all = this.getPluList();
    const index = all.findIndex(p => p.id === plu.id);
    let updated: ScalePluItem[];
    if (index >= 0) {
      updated = [...all];
      updated[index] = plu;
    } else {
      updated = [plu, ...all];
    }
    MaroSyncEngine.setLocalCollection(this.PLUS_KEY, updated);
  }

  static deletePlu(id: string): void {
    const all = this.getPluList();
    const filtered = all.filter(p => p.id !== id);
    MaroSyncEngine.setLocalCollection(this.PLUS_KEY, filtered);
  }

  // Generate Embedded Barcode for Scale Item (Weight or Price)
  static generateScaleBarcode(
    itemCode: string, 
    weightKg: number, 
    priceTotal?: number, 
    prefix: string = '21', 
    itemCodeLen: number = 5, 
    valueLen: number = 5
  ): { barcode13: string; checkDigit: number } {
    // Pad Item Code e.g. "101" -> "00101"
    const paddedItemCode = itemCode.padStart(itemCodeLen, '0').slice(-itemCodeLen);
    
    // Format value (e.g. 1.250 kg -> 1250 or 45.00 EGP -> 4500)
    let rawValInt = 0;
    if (prefix === '21') {
      rawValInt = Math.round(weightKg * 1000); // 3 decimals for kg
    } else {
      rawValInt = Math.round((priceTotal || 0) * 100); // 2 decimals for price
    }
    const paddedValue = rawValInt.toString().padStart(valueLen, '0').slice(-valueLen);

    // 12 Digits body without check digit
    const body12 = `${prefix}${paddedItemCode}${paddedValue}`;

    // Calculate EAN-13 Check Digit
    let sumOdd = 0;
    let sumEven = 0;
    for (let i = 0; i < 12; i++) {
      const digit = parseInt(body12[i], 10);
      if (i % 2 === 0) {
        sumOdd += digit;
      } else {
        sumEven += digit * 3;
      }
    }
    const total = sumOdd + sumEven;
    const checkDigit = (10 - (total % 10)) % 10;

    return {
      barcode13: `${body12}${checkDigit}`,
      checkDigit
    };
  }

  // -------------------------------------------------------------
  // Printer Profiles Management
  // -------------------------------------------------------------
  static getPrinters(): HardwarePrinterProfile[] {
    const saved = MaroSyncEngine.getLocalCollection<HardwarePrinterProfile>(this.PRINTERS_KEY);
    if (saved && saved.length > 0) return saved;
    MaroSyncEngine.setLocalCollection(this.PRINTERS_KEY, DEFAULT_PRINTER_PROFILES);
    return DEFAULT_PRINTER_PROFILES;
  }

  static savePrinter(printer: HardwarePrinterProfile): void {
    const all = this.getPrinters();
    const index = all.findIndex(p => p.id === printer.id);
    let updated: HardwarePrinterProfile[];
    if (index >= 0) {
      updated = [...all];
      updated[index] = printer;
    } else {
      updated = [...all, printer];
    }
    MaroSyncEngine.setLocalCollection(this.PRINTERS_KEY, updated);
  }

  // -------------------------------------------------------------
  // TSPL & ZPL & ESC/POS Raw Code Generators for Physical Printers
  // -------------------------------------------------------------
  static generateTsplCommand(
    template: BarcodeLabelTemplate, 
    sampleData: { name: string; barcode: string; price: number; unit?: string; location?: string }
  ): string {
    const wDots = template.widthMm * 8;
    const hDots = template.heightMm * 8;

    let lines: string[] = [
      `SIZE ${template.widthMm} mm, ${template.heightMm} mm`,
      `GAP ${template.gapMm} mm, 0 mm`,
      `DIRECTION 1`,
      `CLS`
    ];

    template.elements.filter(e => e.isVisible).forEach(el => {
      const x = Math.round(el.xMm * 8);
      const y = Math.round(el.yMm * 8);

      if (el.type === 'PRODUCT_NAME_AR') {
        lines.push(`TEXT ${x},${y},"ARABIC.FNT",0,1,1,"${sampleData.name}"`);
      } else if (el.type === 'BARCODE_1D') {
        const height = Math.round((el.heightMm || 10) * 8);
        lines.push(`BARCODE ${x},${y},"128",${height},1,0,2,2,"${sampleData.barcode}"`);
      } else if (el.type === 'PRICE_RETAIL' || el.type === 'PRICE_PROMO') {
        lines.push(`TEXT ${x},${y},"3",0,2,2,"${sampleData.price.toFixed(2)} EGP"`);
      } else if (el.type === 'SHELF_BIN_LOCATION' && sampleData.location) {
        lines.push(`TEXT ${x},${y},"2",0,1,1,"${sampleData.location}"`);
      }
    });

    lines.push(`PRINT 1,1`);
    return lines.join('\n');
  }

  static generateZplCommand(
    template: BarcodeLabelTemplate,
    sampleData: { name: string; barcode: string; price: number }
  ): string {
    let lines: string[] = [
      `^XA`,
      `^PW${template.widthMm * 8}`,
      `^LL${template.heightMm * 8}`,
      `^LH0,0`,
      `^CI28` // UTF-8 Encoding for Arabic
    ];

    template.elements.filter(e => e.isVisible).forEach(el => {
      const x = Math.round(el.xMm * 8);
      const y = Math.round(el.yMm * 8);

      if (el.type === 'PRODUCT_NAME_AR') {
        lines.push(`^FO${x},${y}^A0N,28,28^FD${sampleData.name}^FS`);
      } else if (el.type === 'BARCODE_1D') {
        lines.push(`^FO${x},${y}^BCN,${Math.round((el.heightMm || 10) * 8)},Y,N,N^FD${sampleData.barcode}^FS`);
      } else if (el.type === 'PRICE_RETAIL') {
        lines.push(`^FO${x},${y}^A0N,40,40^FD${sampleData.price.toFixed(2)} EGP^FS`);
      }
    });

    lines.push(`^XZ`);
    return lines.join('\n');
  }

  // -------------------------------------------------------------
  // Print Job Logging
  // -------------------------------------------------------------
  static logPrintJob(job: Omit<PrintJobLog, 'id' | 'timestamp'>): void {
    const logs = MaroSyncEngine.getLocalCollection<PrintJobLog>(this.LOGS_KEY);
    const newLog: PrintJobLog = {
      ...job,
      id: `job_${Date.now()}`,
      timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    };
    MaroSyncEngine.setLocalCollection(this.LOGS_KEY, [newLog, ...logs.slice(0, 49)]);
  }

  static getPrintLogs(): PrintJobLog[] {
    return MaroSyncEngine.getLocalCollection<PrintJobLog>(this.LOGS_KEY);
  }
}
