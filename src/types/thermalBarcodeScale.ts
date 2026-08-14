// MARO ERP - Enterprise Thermal Printer, Barcode Label & Scale Integration Engine Types

export type ThermalPrintProtocol = 'ESC_POS' | 'TSPL' | 'ZPL' | 'EPL' | 'CPCL' | 'RAW_HTML' | 'PDF_BLOB';

export type ThermalConnectionType = 'USB_RAW' | 'NETWORK_TCP' | 'BLUETOOTH' | 'SERIAL_COM' | 'SYSTEM_SPOOLER';

export type LabelTemplateCategory = 
  | 'SHELF_EDGE_LABEL'     // بطاقة رف للأسعار والعروض
  | 'PRODUCT_BARCODE'      // استيكر باركود منتج فردي
  | 'SCALE_WEIGHT_LABEL'   // ملصق ميزان بالوزن والسعر
  | 'RECEIPT_THERMAL_80MM' // إيصال كاشير حراري 80 مم
  | 'RECEIPT_THERMAL_58MM' // إيصال كاشير حراري مصغر 58 مم
  | 'SHIPPING_CARRIER_4X6' // بوليصة شحن واستلام 4x6 إنش
  | 'JEWELRY_BUTTERFLY'    // استيكر فراشة للمجوهرات والنظارات
  | 'APPAREL_HANGTAG';     // كارت تعليق ملابس مقوى

export interface LabelDimension {
  widthMm: number;
  heightMm: number;
  gapMm: number;
  dpmm: number; // 8 dpmm = 203 DPI, 12 dpmm = 300 DPI
}

export type LabelElementFieldType = 
  | 'PRODUCT_NAME_AR' 
  | 'PRODUCT_NAME_EN' 
  | 'BARCODE_1D' 
  | 'QR_CODE' 
  | 'PRICE_RETAIL' 
  | 'PRICE_PROMO' 
  | 'PRICE_BEFORE_DISCOUNT' 
  | 'UNIT_NAME' 
  | 'WEIGHT_KG' 
  | 'SHELF_BIN_LOCATION' 
  | 'PRODUCTION_DATE' 
  | 'EXPIRY_DATE' 
  | 'COMPANY_LOGO' 
  | 'STATIC_TEXT' 
  | 'BORDER_LINE' 
  | 'CATEGORY_NAME' 
  | 'PACKED_TIME' 
  | 'ZATCA_QR' 
  | 'NUTRITION_FACTS' 
  | 'INGREDIENTS';

export interface LabelDesignElement {
  id: string;
  type: LabelElementFieldType;
  labelAr: string;
  xMm: number;
  yMm: number;
  widthMm?: number;
  heightMm?: number;
  fontSizePt: number;
  fontWeight: 'normal' | 'bold' | 'black';
  alignment: 'left' | 'center' | 'right';
  barcodeFormat?: 'EAN13' | 'CODE128' | 'EAN8' | 'QR' | 'DATAMATRIX';
  includeBarcodeText?: boolean;
  staticCustomText?: string;
  fontFamily?: string;
  rotation?: 0 | 90 | 180 | 270;
  isVisible: boolean;
}

export interface BarcodeLabelTemplate {
  id: string;
  code: string;
  nameAr: string;
  nameEn: string;
  category: LabelTemplateCategory;
  widthMm: number;
  heightMm: number;
  gapMm: number;
  targetPrinters: string[]; // Zebra ZD220, Xprinter 365B, Bixolon, TSC TE200, Dymo
  isDefault: boolean;
  elements: LabelDesignElement[];
  customTsplScript?: string;
  customZplScript?: string;
  customEscPosScript?: string;
  updatedAt: string;
}

export type ScaleProtocol = 
  | 'CAS_CL5000'       // CAS CL5000 / CL5200 / CT100
  | 'DIGI_SM'          // Digi SM-100 / SM-500 / SM-300
  | 'METTLER_TOLEDO'   // Mettler Toledo bPlus / FreshBase
  | 'RONGTA_RLS'       // Rongta RLS1000 / RLS1100
  | 'BIZERBA'          // Bizerba SC II / XC
  | 'ACLAS_LS2X'       // Aclas LS2X / LS265
  | 'GENERIC_EAN13';   // أي ميزان باركود قياسي

export interface ScaleDeviceConfig {
  id: string;
  name: string;
  branchId: string;
  branchName: string;
  departmentName: string; // أجبان و ألبان / جزارة ولحوم / خضروات وفواكه / عطارة وبقوليات
  modelProtocol: ScaleProtocol;
  ipAddress: string;
  port: number;
  barcodePrefix: string; // '21' للوزن, '27' للسعر, '22' للعدد
  itemCodeLength: number; // 4 أو 5 أرقام
  valueLength: number; // 5 أرقام
  decimalPlaces: number; // 3 أرقام عشرية للوزن كجم (e.g. 1.250 kg)
  barcodeType: 'WEIGHT_EMBEDDED' | 'PRICE_EMBEDDED' | 'COUNT_EMBEDDED';
  connectionStatus: 'CONNECTED' | 'DISCONNECTED' | 'SYNCING' | 'ERROR';
  lastSyncTime?: string;
  syncedPluCount: number;
  totalPluCount: number;
}

export interface ScalePluItem {
  id: string;
  pluNumber: number; // رقم الصنف السريع على لوحة أزرار الميزان (1..9999)
  itemCode: string; // كود الصنف بالباركود (مثلاً 0105)
  productId: string;
  productNameAr: string;
  productNameEn?: string;
  unitPrice: number;
  unit: string; // كجم / جرام / قطعة
  tareWeightKg?: number; // وزن العبوة الفارغة (التارة)
  shelfLifeDays: number;
  departmentCode: number;
  hotkeySlot?: number; // رقم الزر المباشر على لوحة الميزان Hotkey (1..112)
  ingredients?: string;
  barcodeFormat: string; // 21WWWWWEAN13
  syncedToScales: string[]; // IDs of scale devices
}

export interface HardwarePrinterProfile {
  id: string;
  name: string;
  brandModel: string; // Zebra, Xprinter, Epson, Citizen, Star Micronics, Bixolon, Honeywell
  deviceType: 'THERMAL_RECEIPT' | 'LABEL_BARCODE' | 'KITCHEN_ORDER' | 'MOBILE_BLUETOOTH';
  connection: ThermalConnectionType;
  ipOrPort: string; // e.g. 192.168.1.200:9100 or COM3 or USB:0416:5011
  paperWidthMm: number; // 80, 58, 100, 50
  dpi: 203 | 300 | 600;
  protocol: ThermalPrintProtocol;
  isCashDrawerConnected: boolean;
  autoCutPaper: boolean;
  isDefault: boolean;
  testPrintStatus?: 'SUCCESS' | 'FAILED' | 'PENDING';
}

export interface PrintJobLog {
  id: string;
  jobType: 'BARCODE_LABEL' | 'RECEIPT' | 'SCALE_PLU_SYNC' | 'PRICE_TAG';
  templateName: string;
  targetPrinter: string;
  itemsCount: number;
  copies: number;
  executedBy: string;
  status: 'PRINTED' | 'FAILED' | 'SPOOLED';
  timestamp: string;
  details?: string;
}
