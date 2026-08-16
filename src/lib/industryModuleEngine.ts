/**
 * @file industryModuleEngine.ts
 * @module المكتبات والمحركات الأساسية (Core Libraries)
 * @description ملف جزء من نظام MARO ERP. الوظيفة: industryModuleEngine.ts.
 */
// MARO ERP - Industry Modules Registry & Plugin Engine
// Master Enterprise Architecture v4.0

import { MaroSyncEngine } from './maroSyncEngine';
import { 
  IndustryModule, 
  FashionMatrixItem, 
  FashionVariant,
  FashionGenderCategory,
  FashionSeason,
  FashionOrigin,
  MaintenanceTicket, 
  RestaurantTable, 
  PharmacyDrug, 
  AutoPartFitment,
  FoodSupermarketProduct,
  ProductUnitConversion,
  FoodUnitType
} from '../types/industryModules';
import { MaroEventBus } from './eventBus';
import { AccountingService } from '../services/accountingService';

const MODULES_COLLECTION = 'industry_modules_config';
const FOOD_COLLECTION = 'food_supermarket_products';
const FASHION_COLLECTION = 'fashion_matrix';
const MAINTENANCE_COLLECTION = 'maintenance_tickets';
const RESTAURANT_TABLES_COLLECTION = 'restaurant_tables';
const PHARMACY_COLLECTION = 'pharmacy_drugs';
const AUTO_PARTS_COLLECTION = 'auto_parts';

export const DEFAULT_INDUSTRY_MODULES: IndustryModule[] = [
  {
    id: 'FOOD_SUPERMARKET',
    code: 'MOD-FOOD',
    nameAr: 'المواد الغذائية، السوبر ماركت وميزان الباركود (Food & Supermarkets)',
    nameEn: 'Food & Supermarkets',
    category: 'RETAIL',
    descriptionAr: 'موديول مخصص للمواد الغذائية والتموينات، يدعم تعدد الوحدات (كرتونة / علبة / قطعة / شيكارة) بباركود وأسعار مستقلة، وتوليد وفك باركود الموازين الإلكترونية EAN-13، وتتبع الصلاحيات والتشغيلات.',
    iconName: 'ShoppingBag',
    badgeColor: 'emerald',
    isActive: true,
    isCoreBackbone: false,
    version: '2.5.0',
    routePath: '/industries/food-retail',
    customProductFields: [
      { id: 'baseUnit', name: 'Base Unit', nameAr: 'الوحدة الأساسية الصغرى', type: 'select', options: ['قطعة', 'علبة', 'كيلوجرام', 'جرام', 'لتر'], required: true },
      { id: 'multiUnits', name: 'Multi Units & Barcodes', nameAr: 'تعدد الوحدات والباركود (كرتونة/علبة/قطعة)', type: 'matrix', helpTextAr: 'ربط كل وحدة بمعامل تحويل، باركود مستقل وسعر بيع مخصص' },
      { id: 'isWeighted', name: 'Scale Weighted Product', nameAr: 'صنف ميزان إلكتروني EAN-13', type: 'boolean', defaultValue: false, helpTextAr: 'توليد وقراءة باركود الوزن والسعر EAN-13 (بادئة 99 / 20)' },
      { id: 'scaleItemCode', name: 'Scale Item Code (PLU)', nameAr: 'كود الصنف بالميزان (5 أرقام)', type: 'text', placeholderAr: 'مثال: 00105' },
      { id: 'expiryDate', name: 'Expiry Date', nameAr: 'تاريخ الصلاحية', type: 'date', required: true, helpTextAr: 'تاريخ انتهاء صلاحية الصنف الاستهلاكي' },
      { id: 'batchNumber', name: 'Batch / Lot #', nameAr: 'رقم التشغيلة (Batch)', type: 'text', required: true, placeholderAr: 'مثال: LOT-2026-AUG' },
      { id: 'storageTemp', name: 'Storage Temperature', nameAr: 'درجة حرارة التخزين', type: 'select', options: ['عادي (درجة حرارة الغرفة)', 'مبرد (2° إلى 5° مئوية)', 'مجمد (-18° مئوية)'] }
    ],
    specializedFeatures: [
      { id: 'f_unit', nameAr: 'نظام تعدد الوحدات والباركودات (Multi-Unit Engine)', descriptionAr: 'بيع وشراء الصنف بالكرتونة والعلبة والقطعة مع التحويل التلقائي للمخزون', enabled: true },
      { id: 'f_scale', nameAr: 'محرك باركود الميزان الذكي EAN-13', descriptionAr: 'استخراج كود الصنف والوزن الصافي والقيمة الإجمالية فورياً على الكاشير بسرعة < 15ms', enabled: true },
      { id: 'f_exp', nameAr: 'تنبيهات الأصناف قريبة الصلاحية والتشغيلات', descriptionAr: 'إشعارات تلقائية قبل انتهاء الصلاحية بـ 30/60 يوماً وجدولة التخفيضات', enabled: true },
      { id: 'f_promo', nameAr: 'محرك باقات التوفير وعروض الكميات', descriptionAr: 'عروض اشترِ 2 واحصل على 1 مجاناً وخصومات الباقات', enabled: true }
    ],
    specializedReports: [
      { id: 'r_u1', nameAr: 'تقرير حركة مبيعات الوحدات (كرتونة مقابل قطعة)', descriptionAr: 'تحليل نسبة مبيعات الجملة والتجزئة لكل صنف' },
      { id: 'r1', nameAr: 'تقرير الأصناف الراكدة وقريبة الانتهاء', descriptionAr: 'حصر الخسائر المحتملة وجدولة التخفيضات' },
      { id: 'r2', nameAr: 'تقرير مبيعات موازين اللحوم والأجبان والخضار', descriptionAr: 'أوزان ومبيعات الأقسام الموزونة' }
    ],
    accountingMapping: {
      salesRevenueAccount: '41200',
      cogsAccount: '51100',
      inventoryAssetAccount: '11300'
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'FASHION_FOOTWEAR',
    code: 'MOD-FASHION',
    nameAr: 'الملابس، الأحذية والأزياء (Fashion & Footwear Matrix)',
    nameEn: 'Fashion & Footwear',
    category: 'RETAIL',
    descriptionAr: 'موديول مصفوفة المقاسات والألوان متعدد التصنيفات (حريمي، رجالي، بناتي، أطفال، مواليد) وتصنيف بلد المنشأ (صيني، تركي، مصري، إيطالي) والمواسم، وطباعة تيكت وباركود المقاس واللون.',
    iconName: 'Shirt',
    badgeColor: 'purple',
    isActive: true,
    isCoreBackbone: false,
    version: '2.5.0',
    routePath: '/industries/fashion',
    customProductFields: [
      { id: 'modelCode', name: 'Model / Design Code', nameAr: 'كود الموديل / التصميم', type: 'text', required: true, placeholderAr: 'مثال: MOD-2026-JKT' },
      { id: 'gender', name: 'Gender / Category', nameAr: 'الفئة والجنس (حريمي / رجالي / بناتي / أطفال)', type: 'select', options: ['حريمي (نساء)', 'رجالي', 'بناتي', 'أولادي (أطفال)', 'مواليد وبيبي', 'للجنسين (Unisex)'], required: true },
      { id: 'origin', name: 'Origin / Manufacturing Country', nameAr: 'بلد المنشأ والتصنيع (صيني / تركي / مصري / إيطالي)', type: 'select', options: ['صيني (China)', 'تركي (Turkey)', 'مصري (Egypt)', 'إيطالي (Italy)', 'فيتنامي (Vietnam)', 'بنجلاديش (Bangladesh)', 'هندي (India)', 'مستورد عام'], required: true },
      { id: 'season', name: 'Season', nameAr: 'الموسم / التشكيلة (شتوي / صيفي / ربيعي / خريفي)', type: 'select', options: ['شتوي 2026', 'صيفي 2026', 'خريفي 2026', 'ربيعي 2026', 'طوال العام / كلاسيك'], required: true },
      { id: 'material', name: 'Fabric / Material', nameAr: 'الخامة والقماش', type: 'text', placeholderAr: 'مثال: قطن 100%، صوف، جينز تركي' },
      { id: 'color', name: 'Color', nameAr: 'اللون', type: 'select', options: ['أسود', 'أبيض', 'كحلي', 'رمادي', 'أزرق', 'بني', 'بيج', 'أحمر', 'زيتي', 'متعدد الألوان'] },
      { id: 'size', name: 'Size', nameAr: 'المقاس', type: 'select', options: ['S', 'M', 'L', 'XL', '2XL', '3XL', '38', '39', '40', '41', '42', '43', '44', '45'] },
      { id: 'brand', name: 'Brand', nameAr: 'الماركة / البراند', type: 'text', placeholderAr: 'اسم الماركة التجارية' }
    ],
    specializedFeatures: [
      { id: 'f_mat', nameAr: 'مصفوفة توليد المقاسات والألوان الذكية (Matrix Generator)', descriptionAr: 'إنشاء حتى 50 صنف ومقاس بضغطة زر واحدة بكود موحد وتصنيف جنس ومنشأ', enabled: true },
      { id: 'f_tag', nameAr: 'طباعة تيكت وكارت الملابس بالباركود والمنشأ', descriptionAr: 'طباعة بطاقة الصنف بالمقاس واللون وبلد الصنع والسعر والباركود', enabled: true },
      { id: 'f_filt', nameAr: 'فلترة متعددة الأبعاد (حريمي/رجالي/صيني/تركي/شتوي)', descriptionAr: 'بحث وفلترة فورية للموديلات والأصناف في نقاط البيع', enabled: true }
    ],
    specializedReports: [
      { id: 'r_gen', nameAr: 'تقرير مبيعات الفئات (حريمي vs رجالي vs أطفال)', descriptionAr: 'تحليل الحصص البيعية حسب الفئات العمرية والجنس' },
      { id: 'r_orig', nameAr: 'تقرير مبيعات وربحية الماركات والمنشأ (تركي vs صيني)', descriptionAr: 'مقارنة هامش ربح المستورد الصيني والتركي بالمحلي' },
      { id: 'r_f1', nameAr: 'تقرير مبيعات المقاسات والألوان الأكثر طلباً', descriptionAr: 'معرفة المقاسات الأكثر استهلاكاً للشراء الذكي' },
      { id: 'r_f2', nameAr: 'تقرير تصفيات نهاية الموسم للموديلات', descriptionAr: 'متابعة رصيد الموديلات المتبقية لكل فرع' }
    ],
    accountingMapping: {
      salesRevenueAccount: '41200',
      cogsAccount: '51100',
      inventoryAssetAccount: '11300'
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'ELECTRONICS_MAINTENANCE',
    code: 'MOD-TECH-REPAIR',
    nameAr: 'الأجهزة الكهربائية، المحمول والصيانة (Electronics & Repair)',
    nameEn: 'Electronics & Repair Workshop',
    category: 'SERVICES',
    descriptionAr: 'موديول تتبع السيريال نمبر وIMEI، إدارة بطاقات وكروت الصيانة (Job Cards)، الضمانات، وقطع الغيار وخدمات الفنيين.',
    iconName: 'Smartphone',
    badgeColor: 'cyan',
    isActive: true,
    isCoreBackbone: false,
    version: '3.0.0',
    routePath: '/industries/maintenance',
    customProductFields: [
      { id: 'serialNumber', name: 'Serial Number / IMEI', nameAr: 'السيريال نمبر / IMEI', type: 'text', required: true, placeholderAr: 'أدخل أو امسح السيريال' },
      { id: 'warrantyMonths', name: 'Warranty Period (Months)', nameAr: 'فترة الضمان (بالشهور)', type: 'number', defaultValue: 12 },
      { id: 'deviceBrand', name: 'Manufacturer / Brand', nameAr: 'الشركة المصنعة / الماركة', type: 'text' },
      { id: 'specs', name: 'Technical Specs', nameAr: 'المواصفات الفنية', type: 'text' }
    ],
    specializedFeatures: [
      { id: 'f_jc', nameAr: 'بطاقات فحص واستلام أجهزة الصيانة (Job Cards)', descriptionAr: 'طباعة إيصال استلام جهاز، تسعير قطع الغيار وأجور الفني', enabled: true },
      { id: 'f_imei', nameAr: 'سجل تتبع السيريال والـ IMEI التراكمي', descriptionAr: 'معرفة تاريخ شراء كل جهاز وتاريخ بيعه والعميل المستلم', enabled: true },
      { id: 'f_war', nameAr: 'فحص سريان الضمان الفوري', descriptionAr: 'التحقق من الضمان برقم السيريال أو هاتف العميل', enabled: true }
    ],
    specializedReports: [
      { id: 'r_tech1', nameAr: 'تقرير كروت الصيانة والأجهزة المسلّمة', descriptionAr: 'متابعة أرباح الصيانة، قطع الغيار، ومستحقات الفنيين' },
      { id: 'r_tech2', nameAr: 'تقرير مطالبات وأجهزة الضمان والاستبدال', descriptionAr: 'حصر الأجهزة المعيبة المرتجعة للوكيل' }
    ],
    accountingMapping: {
      salesRevenueAccount: '41200',
      cogsAccount: '51100',
      inventoryAssetAccount: '11300',
      serviceRevenueAccount: '41300'
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'RESTAURANT_CAFE',
    code: 'MOD-RESTAURANT',
    nameAr: 'المطاعم، الكافيهات وشاشات المطبخ (Restaurant & Cafe KDS)',
    nameEn: 'Restaurant, Cafe & KDS',
    category: 'FOOD_BEVERAGE',
    descriptionAr: 'موديول إدارة الطاولات ومناطق الصالة، شاشات المطبخ الفورية (KDS)، إضافات ومعدلات الوجبات، والتوصيل والسفري.',
    iconName: 'Utensils',
    badgeColor: 'amber',
    isActive: true,
    isCoreBackbone: false,
    version: '2.5.0',
    routePath: '/industries/restaurants',
    customProductFields: [
      { id: 'preparationTimeMin', name: 'Prep Time (Mins)', nameAr: 'زمن التحضير بالدقائق', type: 'number', defaultValue: 15 },
      { id: 'kitchenSection', name: 'Kitchen Workstation', nameAr: 'محطة المطبخ', type: 'select', options: ['المطبخ الساخن / المشويات', 'المطبخ البارد / السلطات', 'المشروبات والبار', 'الحلويات والمخبوزات'] },
      { id: 'modifiers', name: 'Modifiers & Add-ons', nameAr: 'الإضافات والتعديلات', type: 'text', placeholderAr: 'مثال: جبنة زيادة، بدون بصل، صوص حار' }
    ],
    specializedFeatures: [
      { id: 'f_tab', nameAr: 'إدارة الطاولات ومخطط الصالة (Floor Map)', descriptionAr: 'توزيع الطاولات، نقل الحساب، دمج وتقسيم الشيكات', enabled: true },
      { id: 'f_kds', nameAr: 'شاشة المطبخ الذكية الفورية (KDS)', descriptionAr: 'إرسال الطلبات فوراً للشيف مع توقيت التحضير', enabled: true },
      { id: 'f_rec', nameAr: 'خصم مكونات الوجبة من مخزن الخامات', descriptionAr: 'خصم اللحوم والخبز والخضار مع كل وجبة تباع', enabled: true }
    ],
    specializedReports: [
      { id: 'r_res1', nameAr: 'تقرير مبيعات الأقسام والوجبات الأكثر ربحية', descriptionAr: 'تحليل هامش ربح الأطباق' },
      { id: 'r_res2', nameAr: 'تقرير متوسط زمن تحضير الطلبات وسرعة الخدمة', descriptionAr: 'مؤشرات كفاءة طاقم المطبخ والصالة' }
    ],
    accountingMapping: {
      salesRevenueAccount: '41200',
      cogsAccount: '51100',
      inventoryAssetAccount: '11300'
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'PHARMACY_MEDICAL',
    code: 'MOD-PHARMA',
    nameAr: 'الصيدليات والمستلزمات الطبية (Pharmacy & Healthcare)',
    nameEn: 'Pharmacy & Healthcare',
    category: 'HEALTHCARE',
    descriptionAr: 'موديول الصيدليات الذكي المتكامل، يدعم فحص المخزون الفوري، التوجيه المكاني لموقع الرف والخزانة والدرج، محرك اقتراح البدائل والمثائل لنفس المادة الفعالة، والتنبيه الذكي لسحب أقرب تاريخ صلاحية أولاً (FEFO) لتفادي الرواكد.',
    iconName: 'HeartPulse',
    badgeColor: 'rose',
    isActive: true,
    isCoreBackbone: false,
    version: '3.5.0',
    routePath: '/industries/pharmacy',
    customProductFields: [
      { id: 'activeIngredient', name: 'Active Ingredient', nameAr: 'المادة الفعالة والتركيز', type: 'text', required: true, placeholderAr: 'مثال: Paracetamol 500mg + Caffeine 65mg' },
      { id: 'shelfLocation', name: 'Exact Shelf & Cabinet Location', nameAr: 'موقع الرف والخزانة والدرج بالصيدلية', type: 'text', required: true, placeholderAr: 'مثال: ممر A - خزانة C-04 - رف 3 - درج 12' },
      { id: 'pharmaForm', name: 'Pharmaceutical Form', nameAr: 'الشكل الصيدلاني', type: 'select', options: ['أقراص', 'كبسولات', 'شراب', 'حقن', 'مرهم / كريم', 'نقط / قطرة', 'فوار', 'تحاميل', 'بخاخ'] },
      { id: 'isRefrigerated', name: 'Refrigerated Cold Chain (2-8°C)', nameAr: 'صنف ثلاجة وسلسلة تبريد (2°-8°C)', type: 'boolean', defaultValue: false },
      { id: 'prescriptionRequired', name: 'Prescription Only (Rx)', nameAr: 'يتطلب وصفة طبية (Rx)', type: 'boolean', defaultValue: false },
      { id: 'isScheduleDrug', name: 'Controlled Schedule Drug', nameAr: 'دواء جدول ومخدرات خاضع للرقابة', type: 'boolean', defaultValue: false },
      { id: 'stripsPerPack', name: 'Strips Per Pack', nameAr: 'عدد الأشرطة بالعلبة', type: 'number', defaultValue: 2 },
      { id: 'mohCode', name: 'MOH Registration Code', nameAr: 'كود تسجيل وزارة الصحة', type: 'text' }
    ],
    specializedFeatures: [
      { id: 'f_fefo', nameAr: 'محرك التوجيه الصيدلاني لسحب أقرب تاريخ انتهاء (FEFO Alert Engine)', descriptionAr: 'تنبيه الصيدلي بالتشغيلة الأقرب على الانتهاء وسحبها أولاً لتفادي الرواكد', enabled: true },
      { id: 'f_shelf', nameAr: 'نظام الملاحة والتوجيه المكاني للرف والخزانة والدرج بالصيدلية', descriptionAr: 'تحديد موقع الدواء الدقيق بالممر ورقم الخزانة والدرج وخريطة الثلاجة', enabled: true },
      { id: 'f_alt', nameAr: 'محرك البدائل والمثائل الدوائية التلقائي (Generic Equivalents)', descriptionAr: 'اقتراح البدائل المتوفرة فورياً بنفس المادة الفعالة والتركيز عند نفاذ الدواء مع مقارنة السعر', enabled: true },
      { id: 'f_strip', nameAr: 'نظام بيع وتجزئة الأشرطة والكبسولات المفردة', descriptionAr: 'حساب سعر وخصم رصيد الشريط تلقائياً من العلبة المفتوحة', enabled: true },
      { id: 'f_voice', nameAr: 'النطق والتنبيه الصوتي الذكي للصيدلي', descriptionAr: 'قراءة صوتية عربية فورية لموقع الرف والتاريخ الموصى بسحبه وحالة التوفر', enabled: true }
    ],
    specializedReports: [
      { id: 'r_ph_fefo', nameAr: 'تقرير الأدوية متعددة التشغيلات والتواريخ المقتربة (FEFO Audit)', descriptionAr: 'حصر التشغيلات التي يجب تصريفها وسحبها فوراً لمنع التوالف' },
      { id: 'r_ph1', nameAr: 'تقرير نواقص الأدوية والبدائل المتوفرة فورياً بالصيدلية', descriptionAr: 'قائمة بالأدوية المنتهية مع بدائلها الجاهزة ومواقع رفوفها' },
      { id: 'r_ph_shelf', nameAr: 'تقرير خريطة الرفوف وتوزيع المخزون الصيدلاني', descriptionAr: 'جرد وتوزيع الأدوية حسب الخزانات والممرات والثلاجات' },
      { id: 'r_ph2', nameAr: 'تقرير مبيعات المجموعات العلاجية ونسب الأدوية المستوردة والمحلية', descriptionAr: 'تحليل مبيعات المضادات الحيوية والمسكنات وأدوية الضغط والسكر' }
    ],
    accountingMapping: {
      salesRevenueAccount: '41200',
      cogsAccount: '51100',
      inventoryAssetAccount: '11300'
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'AUTO_SPARE_PARTS',
    code: 'MOD-AUTO-PARTS',
    nameAr: 'قطع غيار ومراكز خدمة السيارات (Auto Parts & Service)',
    nameEn: 'Auto Spare Parts & Service',
    category: 'AUTOMOTIVE',
    descriptionAr: 'موديول كود القطعة الأصلي OEM، توافق موديلات وسنوات السيارات (Vehicle Fitment)، ورقم الشاسيه VIN.',
    iconName: 'Car',
    badgeColor: 'blue',
    isActive: true,
    isCoreBackbone: false,
    version: '2.2.0',
    routePath: '/industries/auto-parts',
    customProductFields: [
      { id: 'oemNumber', name: 'OEM / Manufacturer Part #', nameAr: 'رقم القطعة الأصلي (OEM)', type: 'text', required: true, placeholderAr: 'مثال: 04152-YZZA1' },
      { id: 'partCategory', name: 'Part Section', nameAr: 'قسم القطعة', type: 'select', options: ['فلاتر وسيور', 'مكابح وفرامل', 'عفشة ومساعدين', 'كهرباء وإشعال', 'محرك وجيربوكس', 'إطارات وبطاريات'] },
      { id: 'shelfLocation', name: 'Warehouse Shelf / Bin Location', nameAr: 'موقع الرف والممر في المستودع', type: 'text', placeholderAr: 'مثال: ممر B - رف 4 - خانة 12' }
    ],
    specializedFeatures: [
      { id: 'f_fit', nameAr: 'محرك مطابقة توافق الموديلات والسنوات', descriptionAr: 'البحث بنوع السيارة وموديلها لمعرفة القطع المتوافقة', enabled: true },
      { id: 'f_vin', nameAr: 'بطاقة خدمة واستلام سيارات العميل', descriptionAr: 'تسجيل العداد، رقم الشاسيه، وفحص الصيانة', enabled: true }
    ],
    specializedReports: [
      { id: 'r_auto1', nameAr: 'تقرير حركة قطع الغيار الأكثر طلباً بالشركات', descriptionAr: 'تويوتا، هيونداي، نيسان، مرسيدس، بي إم دبليو' },
      { id: 'r_auto2', nameAr: 'تقرير كروت الخدمة ومراكز الصيانة', descriptionAr: 'إيرادات قطع الغيار مقابل أجور التركيب' }
    ],
    accountingMapping: {
      salesRevenueAccount: '41200',
      cogsAccount: '51100',
      inventoryAssetAccount: '11300',
      serviceRevenueAccount: '41300'
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'MANUFACTURING_MRP',
    code: 'MOD-MRP',
    nameAr: 'التصنيع والإنتاج والتشغيل (Manufacturing & Production)',
    nameEn: 'Manufacturing & MRP',
    category: 'INDUSTRIAL',
    descriptionAr: 'موديول قوائم مواد التصنيع BOM، أوامر التشغيل، وتكلفة المواد الخام والعمالة والمصروفات غير المباشرة.',
    iconName: 'Factory',
    badgeColor: 'indigo',
    isActive: true,
    isCoreBackbone: false,
    version: '3.1.0',
    routePath: '/manufacturing',
    customProductFields: [
      { id: 'productType', name: 'Product Class', nameAr: 'نوع الصنف التصنيعي', type: 'select', options: ['مادة خام (Raw Material)', 'نصف مصنع (WIP)', 'منتج تام (Finished Good)', 'مستهلكات تشغيل (Consumable)'] },
      { id: 'defaultBOMCode', name: 'Default BOM Code', nameAr: 'كود تركيبة التصنيع الافتراضية', type: 'text' }
    ],
    specializedFeatures: [
      { id: 'f_bom', nameAr: 'إدارة قوائم مواد التصنيع والتراكيب (BOM)', descriptionAr: 'حساب دقيق لتكلفة المواد، الهدر، والعمالة', enabled: true },
      { id: 'f_wo', nameAr: 'أوامر التشغيل ومراحل خطوط الإنتاج', descriptionAr: 'تتبع سير العمليات وتوليد قيود المحاسبة تلقائياً', enabled: true }
    ],
    specializedReports: [
      { id: 'r_mrp1', nameAr: 'تقرير مقارنة تكلفة الإنتاج الفعلي بالمعياري', descriptionAr: 'تحليل الانحرافات والتكاليف الصناعية' },
      { id: 'r_mrp2', nameAr: 'تقرير استهلاك وهدر المواد الخام', descriptionAr: 'حصر الفاقد في صالات التشغيل' }
    ],
    accountingMapping: {
      salesRevenueAccount: '41100',
      cogsAccount: '51100',
      inventoryAssetAccount: '11300'
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'AUTO_SHOWROOM',
    code: 'MOD-SHOWROOM',
    nameAr: 'معارض وتجارة السيارات (Automotive Showroom & Dealership)',
    nameEn: 'Automotive Showroom & Dealership',
    category: 'AUTOMOTIVE',
    descriptionAr: 'موديول معارض وتجارة السيارات، يدعم تتبع رقم الشاسيه (VIN)، رقم الموتور، قراءة العداد، حالة الجمارك، حاسبة الأقساط الشهرية وجداول السداد.',
    iconName: 'Car',
    badgeColor: 'amber',
    isActive: true,
    isCoreBackbone: false,
    version: '2.8.0',
    routePath: '/industries/auto-showroom',
    customProductFields: [
      { id: 'vin', name: 'Chassis / VIN #', nameAr: 'رقم الشاسيه (VIN)', type: 'text', required: true, placeholderAr: '17 خانة كود الشاسيه' },
      { id: 'engineNumber', name: 'Engine #', nameAr: 'رقم المحرك / الموتور', type: 'text', required: true },
      { id: 'makeModel', name: 'Make & Model', nameAr: 'الشركة والموديل', type: 'text', required: true },
      { id: 'modelYear', name: 'Year', nameAr: 'سنة الصنع', type: 'number', required: true },
      { id: 'mileageKm', name: 'Mileage (KM)', nameAr: 'قراءة العداد (كم)', type: 'number' },
      { id: 'condition', name: 'Condition', nameAr: 'حالة السيارة', type: 'select', options: ['جديد (زيرو)', 'مستعمل كسر زيرو', 'مستعمل بحالة ممتازة', 'وارد خليجي', 'وارد أوروبا'] },
      { id: 'customsStatus', name: 'Customs & Tax Status', nameAr: 'الوضع الجمركي والضريبي', type: 'select', options: ['خالص الجمارك والضريبة', 'منطقة حرة', 'مبادرة سيارات المغتربين', 'ذوي الهمم'] }
    ],
    specializedFeatures: [
      { id: 'f_vin', nameAr: 'إدارة وتتبع مخزون السيارات بالشاسيه واللوحات', descriptionAr: 'تتبع تاريخ كل سيارة، الفحص الفني، والكماليات', enabled: true },
      { id: 'f_inst', nameAr: 'حاسبة وبرنامج إدارة أقساط السيارات', descriptionAr: 'حساب الفائدة والشهور وجدول أقساط العميل ومتابعة المتأخرات', enabled: true }
    ],
    specializedReports: [
      { id: 'r_auto_s1', nameAr: 'تقرير حركة السيارات المباعة والمتاحة بالمعرض', descriptionAr: 'ربحية كل سيارة ومدة بقائها في صالة العرض' },
      { id: 'r_auto_s2', nameAr: 'تقرير الأقساط المستحقة والمتعثرة', descriptionAr: 'متابعة سداد العملاء والشيكات البنكية' }
    ],
    accountingMapping: {
      salesRevenueAccount: '41100',
      cogsAccount: '51100',
      inventoryAssetAccount: '11300'
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'AGRI_EXPORT_COLD',
    code: 'MOD-AGRI-COLD',
    nameAr: 'محطات تصدير الخضار والفواكه وثلاجات التبريد (Agri-Export & Cold Storage)',
    nameEn: 'Agri-Export & Cold Storage',
    category: 'INDUSTRIAL',
    descriptionAr: 'موديول محطات التصدير الزراعي وثلاجات الحفظ، يدعم غرف التبريد والتجميد ودرجات الحرارة، عيار وأحجام الفرز، الشحنات والتعبئة والتصدير الدولي والحاويات.',
    iconName: 'Factory',
    badgeColor: 'emerald',
    isActive: true,
    isCoreBackbone: false,
    version: '3.0.0',
    routePath: '/industries/agri-export',
    customProductFields: [
      { id: 'caliberGrade', name: 'Caliber / Grade', nameAr: 'العيار والفرز (Caliber)', type: 'select', options: ['صنف نمرة 1 تصدير', 'صنف نمرة 2 محلي', 'عيار 48', 'عيار 56', 'عيار 64', 'عيار 72', 'عيار 80', 'جامبو'] },
      { id: 'packagingType', name: 'Packaging Type', nameAr: 'نوع العبوة والتعبئة', type: 'select', options: ['كرتونة تلسكوبية 15 كجم', 'أوبن توب 10 كجم', 'بنتس 500 جم', 'جامبو باج 1 طن', 'قفص بلاستيك'] },
      { id: 'targetTemp', name: 'Storage Temperature (°C)', nameAr: 'درجة حرارة الثلاجة (°م)', type: 'number', defaultValue: 3 }
    ],
    specializedFeatures: [
      { id: 'f_cold', nameAr: 'مراقبة عنابر وثلاجات التبريد والتجميد واللوتات', descriptionAr: 'تسجيل السعة بالأطنان، الرطوبة، ومتابعة لوطات المزارعين', enabled: true },
      { id: 'f_reefer', nameAr: 'إدارة شحنات وحاويات التصدير والشهادات الزراعية', descriptionAr: 'بيان وزن الحاوية، رقم الخط الملاحي، والشهادة الصحية', enabled: true }
    ],
    specializedReports: [
      { id: 'r_agri1', nameAr: 'تقرير رصيد عنابر التبريد والأوزان المخزنة', descriptionAr: 'إشغال الثلاجات والأطنان المتوفرة لكل منتج' },
      { id: 'r_agri2', nameAr: 'تقرير شحنات التصدير الدولية والإيرادات بالعملات', descriptionAr: 'تحليل تكلفة الشحن ومردود العملات الأجنبية' }
    ],
    accountingMapping: {
      salesRevenueAccount: '41100',
      cogsAccount: '51100',
      inventoryAssetAccount: '11300'
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'CAR_WASH_SERVICE',
    code: 'MOD-CARWASH',
    nameAr: 'مغاسل ومراكز صيانة السيارات (Car Wash & Auto Service)',
    nameEn: 'Car Wash & Auto Service',
    category: 'SERVICES',
    descriptionAr: 'موديول إدارة مغاسل السيارات وحارات الخدمة، كروت تشغيل الصيانة السريعة، باقات الغسيل والنانو سيراميك وتغيير الزيوت.',
    iconName: 'Car',
    badgeColor: 'cyan',
    isActive: true,
    isCoreBackbone: false,
    version: '2.5.0',
    routePath: '/industries/car-wash',
    customProductFields: [
      { id: 'serviceType', name: 'Service Category', nameAr: 'نوع الخدمة', type: 'select', options: ['غسيل وتلميع', 'نانو سيراميك', 'تغيير زيوت وفلاتر', 'فحص دوري', 'كهرباء وميكانيكا'] },
      { id: 'vehicleSizeRate', name: 'Vehicle Size Multiplier', nameAr: 'تسعير حسب حجم المركبة', type: 'select', options: ['سيدان صغيرة', 'سيدان كبيرة / SUV', 'نقل / باص'] }
    ],
    specializedFeatures: [
      { id: 'f_bay', nameAr: 'إدارة طابور وحارات الغسيل والخدمة (Bay Queue)', descriptionAr: 'متابعة السيارات الجاري غسيلها والجاهزة للتسليم فورياً', enabled: true },
      { id: 'f_job', nameAr: 'كروت تشغيل الصيانة وتغيير الزيت وفحص 20 نقطة', descriptionAr: 'تسجيل العداد، الزيت المستخدم، وتنبيه موعد التغيير القادم عبر SMS/WhatsApp', enabled: true }
    ],
    specializedReports: [
      { id: 'r_wash1', nameAr: 'تقرير إنتاجية حارات الغسيل والعمال', descriptionAr: 'عدد السيارات المنجزة يومياً ومتوسط وقت الخدمة' },
      { id: 'r_wash2', nameAr: 'تقرير استهلاك الزيوت ومواد التلميع', descriptionAr: 'مراقبة هدر المواد المستهلكة في المغسلة' }
    ],
    accountingMapping: {
      salesRevenueAccount: '41300',
      cogsAccount: '51100',
      inventoryAssetAccount: '11300'
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'EDUCATION_CENTER',
    code: 'MOD-EDUCATION',
    nameAr: 'السناتر والمراكز التعليمية والأكاديميات (Education & Academies)',
    nameEn: 'Educational Centers & Academies',
    category: 'SERVICES',
    descriptionAr: 'موديول إدارة السناتر التعليمية، تسجيل المجموعات والمحاضرات، تحصيل الاشتراكات والملازم، حضور الطلاب بالباركود، وحساب عمولات ونسب المدرسين.',
    iconName: 'Layers',
    badgeColor: 'indigo',
    isActive: true,
    isCoreBackbone: false,
    version: '2.7.0',
    routePath: '/industries/education',
    customProductFields: [
      { id: 'courseSubject', name: 'Subject / Course', nameAr: 'المادة التعليمية', type: 'text', required: true },
      { id: 'instructor', name: 'Instructor Name', nameAr: 'اسم المدرس / المحاضر', type: 'text', required: true },
      { id: 'commission', name: 'Teacher Commission %', nameAr: 'نسبة المدرس %', type: 'number', defaultValue: 70 }
    ],
    specializedFeatures: [
      { id: 'f_grp', nameAr: 'إدارة المجموعات والقاعات والحضور بالباركود', descriptionAr: 'تسجيل دخول الطالب بمسح باركود الكارت وطباعة إيصال الحصة', enabled: true },
      { id: 'f_teach', nameAr: 'حساب مستحقات وعمولات المدرسين التلقائية', descriptionAr: 'توزيع الإيراد بين السنتر والمدرس بعد خصم مصاريف القاعة والملازم', enabled: true }
    ],
    specializedReports: [
      { id: 'r_edu1', nameAr: 'تقرير كشف حساب المدرسين والأرباح الصافية', descriptionAr: 'حصص كل مدرس، عدد الطلاب الحاضرين ومستحقاته' },
      { id: 'r_edu2', nameAr: 'تقرير غياب ومتأخرات اشتراكات الطلاب', descriptionAr: 'حصر الطلاب غير المسددين وإرسال تنبيهات لأولياء الأمور' }
    ],
    accountingMapping: {
      salesRevenueAccount: '41300',
      cogsAccount: '51100',
      inventoryAssetAccount: '11300'
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'CLINIC_MEDICAL',
    code: 'MOD-CLINIC',
    nameAr: 'العيادات والمراكز الطبية (Clinics & Medical Centers)',
    nameEn: 'Medical Clinics & Health Centers',
    category: 'HEALTHCARE',
    descriptionAr: 'موديول العيادات التخصصية والمراكز الطبية، ملف المريض الطبي (EMR)، جدول مواعيد الأطباء، الروشتة الإلكترونية، وحساب نسب الأطباء من الكشوفات والخدمات.',
    iconName: 'HeartPulse',
    badgeColor: 'rose',
    isActive: true,
    isCoreBackbone: false,
    version: '3.0.0',
    routePath: '/industries/clinics',
    customProductFields: [
      { id: 'medicalSpecialty', name: 'Medical Specialty', nameAr: 'التخصص الطبي', type: 'select', options: ['باطنة', 'أطفال', 'أسنان', 'عظام', 'جلدية', 'عيون', 'نساء وتوليد', 'جراحة'] },
      { id: 'doctorShare', name: 'Doctor Share %', nameAr: 'نسبة الطبيب %', type: 'number', defaultValue: 60 }
    ],
    specializedFeatures: [
      { id: 'f_emr', nameAr: 'الملف الطبي الإلكتروني والروشتة الرقمية Rx', descriptionAr: 'حفظ تاريخ الزيارات، التحاليل، الحساسية، والأدوية الموصوفة', enabled: true },
      { id: 'f_doc_split', nameAr: 'حساب إيرادات الكشوفات وتقسيم أرباح الأطباء', descriptionAr: 'حساب حصة العيادة وحصة الطبيب اليومية مع الترحيل المحاسبي التلقائي', enabled: true }
    ],
    specializedReports: [
      { id: 'r_med1', nameAr: 'تقرير إيرادات العيادات ونسب الأطباء اليومية', descriptionAr: 'كشوفات، استشارات، جلسات علاجية وصافي المستحق لكل طبيب' },
      { id: 'r_med2', nameAr: 'تقرير حركة المرضى والتردد الشهري', descriptionAr: 'تحليل أكثر التخصصات طلباً وأوقات الذروة' }
    ],
    accountingMapping: {
      salesRevenueAccount: '41300',
      cogsAccount: '51100',
      inventoryAssetAccount: '11300'
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'SALON_BARBER',
    code: 'MOD-SALON',
    nameAr: 'صالونات الحلاقة، مراكز التجميل والكوافير (Salon, Barber & Spa)',
    nameEn: 'Salon, Barber & Beauty Center',
    category: 'SERVICES',
    descriptionAr: 'موديول صالونات الحلاقة الرجالي ومراكز الكوافير والتجميل الحريمي، إدارة الكراسي والغرف، حجز المواعيد والخدمات، وحساب نسب وعمولات المصففين فورياً.',
    iconName: 'Scissors',
    badgeColor: 'rose',
    isActive: true,
    isCoreBackbone: false,
    version: '3.0.0',
    routePath: '/industries/salon-barber',
    customProductFields: [
      { id: 'serviceDuration', name: 'Duration (Mins)', nameAr: 'مدة الخدمة بالدقائق', type: 'number', defaultValue: 30 },
      { id: 'staffCommission', name: 'Staff Commission %', nameAr: 'نسبة الحلاق / الكوافيرة %', type: 'number', defaultValue: 40 }
    ],
    specializedFeatures: [
      { id: 'f_chair', nameAr: 'إدارة وتوزيع الكراسي والغرف والخدمات', descriptionAr: 'طابور الانتظار، حجز المصفف المفضل، وتوقيت الجلسة', enabled: true },
      { id: 'f_comm', nameAr: 'محاسبة وتقسيم عمولات المصففين التلقائية', descriptionAr: 'تسوية يومية لعمولات الحلاقين وحصة الصالون مع قيود الصرف', enabled: true }
    ],
    specializedReports: [
      { id: 'r_sal1', nameAr: 'تقرير مبيعات الخدمات ونسب المصففين اليومية', descriptionAr: 'أرباح الصالون وصافي مستحقات كل صنايعي / كوافيرة' },
      { id: 'r_sal2', nameAr: 'تقرير استهلاك خامات البروتين والصبغات', descriptionAr: 'مراقبة هدر مستحضرات التجميل والعناية' }
    ],
    accountingMapping: {
      salesRevenueAccount: '41300',
      cogsAccount: '51100',
      inventoryAssetAccount: '11300'
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'GYM_FITNESS',
    code: 'MOD-GYM',
    nameAr: 'صالات الجيم واللياقة البدنية (Gym & Fitness Clubs)',
    nameEn: 'Gym & Fitness Clubs',
    category: 'SERVICES',
    descriptionAr: 'موديول النوادي الصحية وصالات الجيم، إدارة اشتراكات الأعضاء، تجديد وتجميد الاشتراكات، الدخول ببوابات الباركود، متابعة قياسات InBody والمدربين الشخصيين (PT).',
    iconName: 'Dumbbell',
    badgeColor: 'emerald',
    isActive: true,
    isCoreBackbone: false,
    version: '3.0.0',
    routePath: '/industries/gym-fitness',
    customProductFields: [
      { id: 'planDuration', name: 'Plan Duration (Days)', nameAr: 'مدة الباقة بالأيام', type: 'number', defaultValue: 30 },
      { id: 'freezeDays', name: 'Free Freezes (Days)', nameAr: 'أيام التجميد المجانية', type: 'number', defaultValue: 7 }
    ],
    specializedFeatures: [
      { id: 'f_gate', nameAr: 'التحكم في الدخول ببوابات الباركود والـ RFID', descriptionAr: 'فحص سريان الاشتراك وتنبيه العضو بانتهاء الباقة فورياً', enabled: true },
      { id: 'f_inbody', nameAr: 'سجل قياسات InBody ومتابعة المدربين (PT)', descriptionAr: 'تسجيل قياسات الوزن، الدهون، العضلات، ومتابعة تطور المشتركين', enabled: true }
    ],
    specializedReports: [
      { id: 'r_gym1', nameAr: 'تقرير الاشتراكات المنتهية وقريبة التجديد', descriptionAr: 'إرسال تنبيهات تلقائية وتفعيل عروض التجديد' },
      { id: 'r_gym2', nameAr: 'تقرير كثافة الحضور وأوقات الذروة بالجيم', descriptionAr: 'إحصائيات تواجد المشتركين على مدار اليوم' }
    ],
    accountingMapping: {
      salesRevenueAccount: '41300',
      cogsAccount: '51100',
      inventoryAssetAccount: '11300'
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'NURSERY_PRESCHOOL',
    code: 'MOD-NURSERY',
    nameAr: 'الحضانات ورياض الأطفال (Nurseries & Preschools)',
    nameEn: 'Nurseries & Preschools',
    category: 'SERVICES',
    descriptionAr: 'موديول إدارة الحضانات ورياض الأطفال، ملفات الأطفال، اشتراكات الباص والوجبات، تسجيل الحضور والغياب، ومتابعة الأنشطة اليومية والتواصل مع أولياء الأمور.',
    iconName: 'Baby',
    badgeColor: 'amber',
    isActive: true,
    isCoreBackbone: false,
    version: '3.0.0',
    routePath: '/industries/nursery',
    customProductFields: [
      { id: 'classGroup', name: 'Class / Stage', nameAr: 'المرحلة والفصل', type: 'select', options: ['بيبي كلاس (مواليد إلى سنتين)', 'براعم (2-3 سنوات)', 'تمهيدي KG1', 'روضة KG2'] },
      { id: 'monthlyFee', name: 'Monthly Fee', nameAr: 'المصروفات الشهرية', type: 'number', defaultValue: 1500 }
    ],
    specializedFeatures: [
      { id: 'f_child', nameAr: 'سجل رعاية الطفل الشامل والحساسية الطبية', descriptionAr: 'بيانات الطوارئ، الحساسية، والأدوية، وأرقام أولياء الأمور', enabled: true },
      { id: 'f_daily', nameAr: 'تقرير اليومية للطفل (وجبات، قيلولة، سلوكيات)', descriptionAr: 'تحديث ولي الأمر إلكترونياً بنشاط طفله وسلوكه طوال اليوم', enabled: true }
    ],
    specializedReports: [
      { id: 'r_nur1', nameAr: 'تقرير تحصيل الرسوم والمصروفات الشهرية والباص', descriptionAr: 'متابعة المتأخرات والمبالغ المسددة لكل فصل' },
      { id: 'r_nur2', nameAr: 'تقرير نسب الحضور والغياب اليومي للأطفال', descriptionAr: 'بيان كامل بحضور وغياب كل مرحلة تعليمية' }
    ],
    accountingMapping: {
      salesRevenueAccount: '41300',
      cogsAccount: '51100',
      inventoryAssetAccount: '11300'
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'PARKING_GARAGE',
    code: 'MOD-GARAGE',
    nameAr: 'الجراجات، مواقف السيارات وخدمات الفاليه (Parking & Garage)',
    nameEn: 'Parking Garage & Valet Services',
    category: 'SERVICES',
    descriptionAr: 'موديول إدارة الجراجات وساحات الانتظار، حجز وتتبع الباكيات والأدوار، تذاكر الباركود بالساعة والمبيت والاشتراكات الشهرية، وحساب تسعيرة الوقوف الذكية وتوجيه الفاليه.',
    iconName: 'ParkingSquare',
    badgeColor: 'cyan',
    isActive: true,
    isCoreBackbone: false,
    version: '3.0.0',
    routePath: '/industries/parking-garage',
    customProductFields: [
      { id: 'hourlyTariff', name: 'Hourly Rate', nameAr: 'تعريفة الساعة', type: 'number', defaultValue: 15 },
      { id: 'monthlyTariff', name: 'Monthly Subscription', nameAr: 'الاشتراك الشهري', type: 'number', defaultValue: 600 }
    ],
    specializedFeatures: [
      { id: 'f_slots', nameAr: 'مخطط الباكيات والأدوار الفوري (Slot Map)', descriptionAr: 'متابعة الأماكن الشاغرة والمشغولة في كل دور والبوابات', enabled: true },
      { id: 'f_park_tick', nameAr: 'تذاكر باركود الدخول والاحتساب الآلي للوقت', descriptionAr: 'طباعة تذكرة الدخول وحساب القيمة عند الخروج بالدقيقة', enabled: true }
    ],
    specializedReports: [
      { id: 'r_gar1', nameAr: 'تقرير إيرادات الجراج اليومية وحركة البوابات', descriptionAr: 'إجمالي السيارات العابرة، المبيت والاشتراكات الشهرية' },
      { id: 'r_gar2', nameAr: 'تقرير معدل إشغال الأدوار وساعات الذروة', descriptionAr: 'تحليل أوقات الازدحام لتعديل التسعيرة التشغيلية' }
    ],
    accountingMapping: {
      salesRevenueAccount: '41300',
      cogsAccount: '51100',
      inventoryAssetAccount: '11300'
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'TOURISM_TRAVEL',
    code: 'MOD-TOURISM',
    nameAr: 'شركات السياحة، الطيران وحجوزات العمرة والرحلات (Tourism & Travel)',
    nameEn: 'Tourism, Travel & Umrah Agency',
    category: 'SERVICES',
    descriptionAr: 'موديول إدارة شركات ووكالات السياحة والسفر، برامج وباقات الرحلات الخارجية والداخلية، رحلات الحج والعمرة، حجز تذاكر الطيران والفنادق، وإصدار التأشيرات وحساب عمولات الوكلاء.',
    iconName: 'Plane',
    badgeColor: 'blue',
    isActive: true,
    isCoreBackbone: false,
    version: '3.0.0',
    routePath: '/industries/tourism-travel',
    customProductFields: [
      { id: 'packageDuration', name: 'Duration (Days)', nameAr: 'مدة الرحلة بالأيام', type: 'number', defaultValue: 5 },
      { id: 'agentCommission', name: 'Agent Commission', nameAr: 'عمولة حجز المندوب / الوكيل', type: 'number', defaultValue: 250 }
    ],
    specializedFeatures: [
      { id: 'f_tour_pack', nameAr: 'إدارة باقات وبرامج الأفواج والرحلات السياحية', descriptionAr: 'تتبع المقاعد المتاحة، الفنادق، النقل السياحي، وتذاكر الطيران', enabled: true },
      { id: 'f_visa_mgmt', nameAr: 'متابعة التأشيرات وجوازات السفر للمسافرين', descriptionAr: 'تحديث حالة التأشيرة وطباعة بيانات الفوج السياحي', enabled: true }
    ],
    specializedReports: [
      { id: 'r_tour1', nameAr: 'تقرير ربحية البرامج السياحية وأفواج الحج والعمرة', descriptionAr: 'الإيرادات المحصلة وتكلفة الإقامة والطيران وصافي الربح' },
      { id: 'r_tour2', nameAr: 'تقرير عمولات شركات الطيران والوكلاء الخارجيين', descriptionAr: 'كشف حساب الوكلاء والموردين لخدمات السياحة' }
    ],
    accountingMapping: {
      salesRevenueAccount: '41300',
      cogsAccount: '51100',
      inventoryAssetAccount: '11300'
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'IMPORT_EXPORT',
    code: 'MOD-IMPORT-EXPORT',
    nameAr: 'شركات الاستيراد والتصدير والشحن الدولي (Import & Export)',
    nameEn: 'Import & Export Logistics',
    category: 'DISTRIBUTION',
    descriptionAr: 'موديول شركات التجارة الخارجية والاستيراد والتصدير، متابعة الحاويات وبوالص الشحن B/L، شهادات الإفراج الجمركي والـ ACID، الاعتمادات المستندية (LC)، واحتساب التكلفة الاستيرادية المحملة (Landed Cost).',
    iconName: 'Ship',
    badgeColor: 'indigo',
    isActive: true,
    isCoreBackbone: false,
    version: '3.0.0',
    routePath: '/industries/import-export',
    customProductFields: [
      { id: 'hsCode', name: 'HS Tariff Code', nameAr: 'بند التعريفة الجمركية HS Code', type: 'text', defaultValue: '' },
      { id: 'countryOfOrigin', name: 'Country of Origin', nameAr: 'بلد المنشأ', type: 'text', defaultValue: '' }
    ],
    specializedFeatures: [
      { id: 'f_landed_cost', nameAr: 'حساب التكلفة الاستيرادية المحملة (Landed Cost)', descriptionAr: 'توزيع النولون، الرسوم الجمركية، التأمين، والتخليص على الأصناف بالعملة الأجنبية والمحلية', enabled: true },
      { id: 'f_shipment_track', nameAr: 'تتبع الحاويات وبوالص الشحن والاعتمادات المستندية', descriptionAr: 'إدارة أرقام الحاويات، الخطوط الملاحية، وموانئ الشحن والتفريغ', enabled: true }
    ],
    specializedReports: [
      { id: 'r_impexp1', nameAr: 'تقرير كشف التكاليف الاستيرادية والجمارك للشحنة', descriptionAr: 'تفصيل النولون والجمارك والقيمة المضافة لكل بوليصة' },
      { id: 'r_impexp2', nameAr: 'تقرير أرباح ومردوديات صفقات التصدير بالعملة الأجنبية', descriptionAr: 'عوائد الصادرات وفروق أسعار صرف العملات الأجنبية' }
    ],
    accountingMapping: {
      salesRevenueAccount: '41200',
      cogsAccount: '51100',
      inventoryAssetAccount: '11300'
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'SMART_QUEUE',
    code: 'MOD-QUEUE',
    nameAr: 'نظام إدارة الطوابير، نداء العملاء وتنبيهات الواتساب (Smart Queue & WhatsApp)',
    nameEn: 'Smart Queue & WhatsApp Calling',
    category: 'SERVICES',
    descriptionAr: 'نظام ذكي متكامل لإدارة تدفق وحركة العملاء، إصدار تذاكر الدور بالأقسام والشبابيك، شاشة المناداة والنداء الصوتي، وإرسال تنبيهات تلقائية عبر WhatsApp عند اقتراب الدور وحين المناداة.',
    iconName: 'MessageSquare',
    badgeColor: 'emerald',
    isActive: true,
    isCoreBackbone: false,
    version: '3.0.0',
    routePath: '/industries/queue-system',
    customProductFields: [
      { id: 'avgWaitTime', name: 'Avg Wait (Mins)', nameAr: 'متوسط وقت الانتظار بالدقائق', type: 'number', defaultValue: 10 }
    ],
    specializedFeatures: [
      { id: 'f_q_screen', nameAr: 'شاشة العرض المركزية للنداء الصوتي والمرئي', descriptionAr: 'عرض الرقم المستدعى ورقم الشباك / العيادة / الكرسي مع جرس تنبيه', enabled: true },
      { id: 'f_q_whatsapp', nameAr: 'التنبيه التلقائي عبر الواتساب للعملاء', descriptionAr: 'إرسال رسالة عند استلام التذكرة، ورسالة تحذيرية "أمامك عميل واحد فقط"، ورسالة المناداة المباشرة', enabled: true },
      { id: 'f_q_integration', nameAr: 'الربط الشامل مع العيادات والمغاسل والصالونات والمطاعم', descriptionAr: 'تكامل مباشر مع كافة الأنشطة الخدمية لتنظيم تدفق العملاء وحجز الطاولات والأدوار', enabled: true }
    ],
    specializedReports: [
      { id: 'r_q1', nameAr: 'تقرير كفاءة خدمة العملاء ومتوسط زمن الخدمة', descriptionAr: 'إحصائيات زمن الانتظار وزمن تقديم الخدمة لكل موظف وشباك' },
      { id: 'r_q2', nameAr: 'سجل رسائل وتنبيهات الواتساب المرسلة للعملاء', descriptionAr: 'بيان كامل بحالة تسليم الإشعارات وأرقام الهواتف' }
    ],
    accountingMapping: {
      salesRevenueAccount: '41300',
      cogsAccount: '51100',
      inventoryAssetAccount: '11300'
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'PRICE_CHECKER_HANDHELD',
    code: 'MOD-PDA-PRICE-CHECKER',
    nameAr: 'استعلام الأسعار وأجهزة الهاند تيرمينال (Price Checker & Handheld PDA)',
    nameEn: 'Price Checker & Handheld Terminal',
    category: 'RETAIL',
    descriptionAr: 'شاشة وكشك استعلام وفحص الأسعار التفاعلي للعملاء بالصالة، مع تطبيق الهاند تيرمينال (PDA) المتنقل للموظفين: فحص الأسعار، طباعة بطاقات الرف بالبلوتوث، الجرد الدوري المستمر، استلام البضائع، وتفكيك طوابير الكاشير (Line Busting).',
    iconName: 'ScanLine',
    badgeColor: 'amber',
    isActive: true,
    isCoreBackbone: false,
    version: '3.0.0',
    routePath: '/industries/price-checker',
    customProductFields: [
      { id: 'shelfLocation', name: 'Shelf Location', nameAr: 'موقع الرف والممر (Bin / Shelf)', type: 'text', defaultValue: 'A1-01' },
      { id: 'loyaltyPoints', name: 'Loyalty Points', nameAr: 'نقاط الولاء المكتسبة', type: 'number', defaultValue: 5 }
    ],
    specializedFeatures: [
      { id: 'f_pda_kiosk', nameAr: 'كشك استعلام الأسعار الذكي للعملاء (Price Checker Kiosk)', descriptionAr: 'مسح الباركود، عرض السعر شامل الضريبة، العروض الترويجية، مستويات الأسعار، ونقاط الولاء مع النطق الصوتي', enabled: true },
      { id: 'f_pda_terminal', nameAr: 'تطبيق الهاند تيرمينال للموظفين (Employee PDA Scanner)', descriptionAr: 'دعم أجهزة Zebra / Honeywell / Datalogic والهواتف الذكية لمسح الباركود السريع', enabled: true },
      { id: 'f_pda_label_print', nameAr: 'طباعة بطاقات الرف المحمولة بالبلوتوث (Shelf Label Printing)', descriptionAr: 'طباعة استيكرات الأسعار والباركود المحدثة فورياً عند الرف عبر طابعات البلوتوث المحمولة', enabled: true },
      { id: 'f_pda_stock_count', nameAr: 'الجرد المخزني المتنقل ومطابقة الأرصدة (Cycle Counting)', descriptionAr: 'جرد مستمر وفوري للأرفف مع حساب العجز والزيادة والترحيل التلقائي لتسويات المخزون', enabled: true },
      { id: 'f_pda_line_busting', nameAr: 'البيع السريع المتنقل وتفكيك الطوابير (Line Busting Mobile Cart)', descriptionAr: 'إنشاء سلة مشتريات متنقلة للعميل داخل الصالة وتمريرها لكاشير الـ POS برقم كود سريع', enabled: true }
    ],
    specializedReports: [
      { id: 'r_pda1', nameAr: 'سجل عمليات فحص الأسعار وبطاقات الأرفف المطبوعة', descriptionAr: 'بيان كامل بتعديلات الأسعار والاستيكرات المطبوعة لكل موظف وجهاز هاند' },
      { id: 'r_pda2', nameAr: 'تقرير نتائج الجرد المتنقل وفروقات الأرصدة بالمخازن', descriptionAr: 'مقارنة الكميات الفعلية بالدفترية وقيمة العجز والزيادة بالأرفف' }
    ],
    accountingMapping: {
      salesRevenueAccount: '41100',
      cogsAccount: '51100',
      inventoryAssetAccount: '11300'
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'GOLD_JEWELRY_ACCESSORIES',
    code: 'MOD-GOLD',
    nameAr: 'محلات الذهب، الفضة، المجوهرات والإكسسوارات الفاخرة (Gold & Jewelry)',
    nameEn: 'Gold, Silver & Luxury Jewelry',
    category: 'RETAIL',
    descriptionAr: 'موديول مخصص لمحلات الذهب والفضة والمجوهرات، يدعم حساب العيار (24, 21, 18, فضة 925)، الوزن الدقيق بالجرام، احتساب المصنعية (المثقال/الجرام)، فصوص والأحجار الكريمة، وتسجيل حركة المبيعات والمرتجعات مع دمغات مصلحة الاستواز.',
    iconName: 'Award',
    badgeColor: 'amber',
    isActive: true,
    isCoreBackbone: false,
    version: '3.0.0',
    routePath: '/industries/gold-jewelry',
    customProductFields: [
      { id: 'goldCarat', name: 'Carat / Purity', nameAr: 'العيار والدرجة', type: 'select', options: ['عيار 24 (سباك)', 'عيار 21 (مشغولات)', 'عيار 18', 'عيار 14', 'فضة عيار 925', 'ساعات وإكسسوارات فاخرة'] },
      { id: 'weightGrams', name: 'Weight in Grams', nameAr: 'الوزن الصافي بالجرام', type: 'number', required: true, defaultValue: 10.5 },
      { id: 'makingFeePerGram', name: 'Making Fee per Gram', nameAr: 'سعر المصنعية لكل جرام', type: 'number', defaultValue: 75 },
      { id: 'stoneWeight', name: 'Stone / Diamond Weight', nameAr: 'وزن الفصوص والأحجار (جرام/قيراط)', type: 'number', defaultValue: 0 },
      { id: 'itemCategory', name: 'Item Category', nameAr: 'نوع القطعة', type: 'select', options: ['غويشة / أسوارة', 'خاتم / دبلة', 'سلسلة / كوليه', 'حلق', 'طقم كامل', 'سبائك وعملات ذهبية', 'ساعة فاخرة'] }
    ],
    specializedFeatures: [
      { id: 'f_gold_calc', nameAr: 'محساب السعر الآلي (الوزن × سعر الذهب الحي + المصنعية)', descriptionAr: 'حساب القيمة الإجمالية فورياً بناءً على سعر الذهب العالمي اليومي والمصنعية والدمغة', enabled: true },
      { id: 'f_gold_stamp', nameAr: 'تسجيل أرقام الدمغة والأكواد الفريدة لكل قطعة', descriptionAr: 'تتبع فريد لكل قطعة مجوهرات برقم الدمغة والوزن والعيار لتفادي التلاعب', enabled: true }
    ],
    specializedReports: [
      { id: 'r_gold1', nameAr: 'تقرير مبيعات وربحية المشغولات بالعيار والوزن', descriptionAr: 'إجمالي الأوزان المباعة وعوائد المصنعية وقيمة الذهب' },
      { id: 'r_gold2', nameAr: 'تقرير حركة السباك والذهب الخام والمرتجعات', descriptionAr: 'متابعة رصيد الخزينة من السباك والعملات والذهب المشغول' }
    ],
    accountingMapping: {
      salesRevenueAccount: '41100',
      cogsAccount: '51100',
      inventoryAssetAccount: '11300'
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'BOOKSTORE_STATIONERY',
    code: 'MOD-BOOKSTORE',
    nameAr: 'المكتبات، الأدوات المدرسية والكتب التعليمية (Bookstores & Stationery)',
    nameEn: 'Bookstores & Stationery',
    category: 'RETAIL',
    descriptionAr: 'موديول المكتبات المتكامل، إدارة الكتب المدرسية والخارجية، الروايات، الأدوات المدرسية والهندسية، البحث برقم الـ ISBN، المرحلة الدراسية، والمؤلف.',
    iconName: 'FileText',
    badgeColor: 'blue',
    isActive: true,
    isCoreBackbone: false,
    version: '3.0.0',
    routePath: '/industries/bookstore',
    customProductFields: [
      { id: 'isbn', name: 'ISBN / Book Code', nameAr: 'رقم الترقيم الدولي (ISBN / باركود الكتاب)', type: 'text', placeholderAr: 'مثال: 978-977-...' },
      { id: 'authorName', name: 'Author / Publisher', nameAr: 'المؤلف / دار النشر', type: 'text', placeholderAr: 'اسم المؤلف أو الناشر' },
      { id: 'academicStage', name: 'Academic Stage', nameAr: 'المرحلة الدراسية', type: 'select', options: ['عام / أدوات مكتبية', 'رياض الأطفال (KG)', 'المرحلة الابتدائية', 'المرحلة الإعدادية', 'المرحلة الثانوية', 'كتب جامعية وأكاديمية', 'روايات وتنمية بشرية'] }
    ],
    specializedFeatures: [
      { id: 'f_isbn', nameAr: 'محرك البحث السريع برقم الـ ISBN والمؤلف', descriptionAr: 'البحث الفوري عن الكتب الدراسية والخارجية والمراجع برقم الباركود أو اسم المؤلف', enabled: true },
      { id: 'f_school_kit', nameAr: 'تجهيز وحزم الحقائب والأدوات المدرسية المتكاملة', descriptionAr: 'بيع المجموعات المدرسية (شاملة الكشاكيل والأقلام والأدوات) بكود واحد', enabled: true },
      { id: 'f_textbooks', nameAr: 'إدارة مخزون الكتب الفصلية والمناهج التعليمية', descriptionAr: 'متابعة نواقص الكتب الدراسية حسب الصفوف والمراحل', enabled: true }
    ],
    specializedReports: [
      { id: 'r_book1', nameAr: 'تقرير مبيعات الكتب والمراجع الدراسية الأكثر طلباً', descriptionAr: 'تحليل حركة بيع المراحل والكتب الخارجية' },
      { id: 'r_book2', nameAr: 'تقرير الأقسام والأدوات المكتبية والهندسية', descriptionAr: 'مبيعات وهامش ربح أدوات الرسم والكتابة والشنط' }
    ],
    accountingMapping: {
      salesRevenueAccount: '41100',
      cogsAccount: '51100',
      inventoryAssetAccount: '11300'
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'TIRES_BATTERIES',
    code: 'MOD-TIRES-BATT',
    nameAr: 'محلات إطارات السيارات (الكاوتش)، البطاريات والخدمات السريعة (Tires & Batteries)',
    nameEn: 'Tires, Batteries & Quick Services',
    category: 'AUTOMOTIVE',
    descriptionAr: 'موديول مخصص لمحلات إطارات السيارات (الكاوتش)، البطاريات، والخدمات السريعة (ترصيع، زوايا)، مع تسجيل مقاسات الكاوتش (عرض/ارتفاع/جنط)، تاريخ الإنتاج DOT، وسعة البطاريات بالأمبير وفترات الضمان واستبدال القديم.',
    iconName: 'Car',
    badgeColor: 'cyan',
    isActive: true,
    isCoreBackbone: false,
    version: '3.0.0',
    routePath: '/industries/tires-batteries',
    customProductFields: [
      { id: 'productSubClass', name: 'Sub-Category', nameAr: 'التصنيف الفرعي', type: 'select', options: ['إطارات سيارات (كاوتش)', 'بطاريات سيارات ومعدات', 'زيوت وفلاتر صيانة', 'إكسسوارات ومعدات طوارئ'] },
      { id: 'tireSizeSpecs', name: 'Tire Specs (Width/Profile/Rim)', nameAr: 'مقاس الكاوتش (مثال: 205/55R16)', type: 'text', placeholderAr: 'مثال: 205/55R16 91V' },
      { id: 'dotProductionDate', name: 'DOT Production Week/Year', nameAr: 'تاريخ الإنتاج (أسبوع/سنة DOT)', type: 'text', placeholderAr: 'مثال: 2425 (أسبوع 24 سنة 2025)' },
      { id: 'batteryAmperage', name: 'Battery Capacity (Ah)', nameAr: 'سعة البطارية بالأمبير (Ah)', type: 'select', options: ['غير ذلك / كاوتش', '35 أمبير', '45 أمبير', '55 أمبير', '70 أمبير جاف', '80 أمبير', '100 أمبير', '150+ أمبير نقل'] },
      { id: 'warrantyMonths', name: 'Warranty Period (Months)', nameAr: 'فترة الضمان الرسمي (بالشهور)', type: 'number', defaultValue: 12 }
    ],
    specializedFeatures: [
      { id: 'f_tire_search', nameAr: 'البحث الذكي بمقاس الإطار وسرعة النقشة', descriptionAr: 'البحث برقم المقاس (عرض/ارتفاع/جنط) لتوفير البدائل المتاحة بالمستودع', enabled: true },
      { id: 'f_battery_trade', nameAr: 'نظام خصم واستبدال البطارية القديمة (Trade-In)', descriptionAr: 'حساب قيمة خردة البطارية القديمة وخصمها من الفاتورة وتسجيل السيريال للضمان', enabled: true }
    ],
    specializedReports: [
      { id: 'r_tire1', nameAr: 'تقرير مبيعات الإطارات والبطاريات وتواريخ الإنتاج', descriptionAr: 'حركة المخزون حسب المقاسات وسنوات الصنع وتنبيهات التقادم' },
      { id: 'r_tire2', nameAr: 'تقرير مطالبات ضمان البطاريات والمرتجعات', descriptionAr: 'متابعة البطاريات التالفة المسترجعة من العملاء للوكيل' }
    ],
    accountingMapping: {
      salesRevenueAccount: '41100',
      cogsAccount: '51100',
      inventoryAssetAccount: '11300'
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'PERFUMES_COSMETICS',
    code: 'MOD-PERFUME',
    nameAr: 'محلات العطور، مستحضرات التجميل، العود والبخور (Perfumes & Cosmetics)',
    nameEn: 'Perfumes, Cosmetics & Oud',
    category: 'RETAIL',
    descriptionAr: 'موديول محلات العطور والشرقيات ومستحضرات التجميل، بيع العطور بالمليلتر وزجاجات التعبئة، العود الطبيعي والصناعي، مسك العبايات، وتركيب العطور الخاصة.',
    iconName: 'Sparkles',
    badgeColor: 'purple',
    isActive: true,
    isCoreBackbone: false,
    version: '3.0.0',
    routePath: '/industries/perfumes',
    customProductFields: [
      { id: 'perfumeType', name: 'Perfume Category', nameAr: 'نوع الصنف العطري', type: 'select', options: ['عطور شرقية وعود', 'عطور فرنسية عالمية', 'زيوت عطرية خام (بالملي)', 'مستحضرات تجميل ومكياج', 'بخور ومبثوث وعنبر'] },
      { id: 'volumeMl', name: 'Volume in ML', nameAr: 'الحجم بالمليلتر (ML)', type: 'number', defaultValue: 100 },
      { id: 'scentNotes', name: 'Scent Notes', nameAr: 'المكونات العطرية (النوتة)', type: 'text', placeholderAr: 'مثال: مقدمة برغموت، قلب ياسمين، قاعدة مسك وعنبر' }
    ],
    specializedFeatures: [
      { id: 'f_ml_sale', nameAr: 'نظام بيع العطور السائلة بالمليلتر والزجاجات المخصصة', descriptionAr: 'حساب سعر الملي وتعبئة الزجاجة مع احتساب سعر الزجاجة الفارغة والخصم من المستودع الخام', enabled: true },
      { id: 'f_custom_mix', nameAr: 'تأليف وتركيب العطور المخصصة للعملاء', descriptionAr: 'حفظ وصفة العميل الخاصة وتكرار تركيبها برقم كود فريد للعميل', enabled: true }
    ],
    specializedReports: [
      { id: 'r_perf1', nameAr: 'تقرير مبيعات العطور والزيوت الخام الأكثر طلباً', descriptionAr: 'حركة استهلاك الزيوت العطرية العالية والزجاجات' },
      { id: 'r_perf2', nameAr: 'تقرير الأرباح اليومية لمبيعات التعبئة والزجاجات', descriptionAr: 'مقارنة إيرادات العطور الجاهزة والتركيبات الخاصة' }
    ],
    accountingMapping: {
      salesRevenueAccount: '41100',
      cogsAccount: '51100',
      inventoryAssetAccount: '11300'
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'BUILDING_MATERIALS_HARDWARE',
    code: 'MOD-HARDWARE',
    nameAr: 'مواد البناء، الأدوات الصحية، والعدد اليدوية (Building Materials & Hardware)',
    nameEn: 'Building Materials & Hardware',
    category: 'RETAIL',
    descriptionAr: 'موديول محلات مواد البناء، السيراميك، الأدوات الصحية، الدهانات، والعدد اليدوية والكهربائية، بيع بالشكارة، الطن، المتر المربع، والقطعة.',
    iconName: 'Layers',
    badgeColor: 'blue',
    isActive: true,
    isCoreBackbone: false,
    version: '3.0.0',
    routePath: '/industries/hardware',
    customProductFields: [
      { id: 'unitMeasure', name: 'Unit of Measure', nameAr: 'وحدة القياس البيعية', type: 'select', options: ['طن (Tonne)', 'شكارة / أكياس', 'متر مربع (m²)', 'متر طولى', 'علبة / كرتونة', 'قطعة / حبة'] },
      { id: 'materialGrade', name: 'Grade / Spec', nameAr: 'المواصفات والدرجة', type: 'text', placeholderAr: 'مثال: حديد عز تسليح 37، أسمنت مقاوم' }
    ],
    specializedFeatures: [
      { id: 'f_weight_calc', nameAr: 'حساب وزن وأطنان مواد البناء والسيارات الناقلة', descriptionAr: 'حساب وزن الحمولة على سيارات النقل وإصدار بوليصة التحميل', enabled: true },
      { id: 'f_batch_shade', nameAr: 'تتبع درجات فرز السيراميك والدهانات (Shade & Batch)', descriptionAr: 'منع اختلاط درجات ألوان السيراميك والدهانات في الفاتورة الواحدة', enabled: true }
    ],
    specializedReports: [
      { id: 'r_hw1', nameAr: 'تقرير حركة مخزون مواد البناء والأسمنت والحديد', descriptionAr: 'متابعة الأرصدة والأطنان المتبقية وحركة التوريدات' },
      { id: 'r_hw2', nameAr: 'تقرير مبيعات السيراميك والفرزات والأدوات الصحية', descriptionAr: 'تحليل مبيعات الفرز الأول والثاني والثالث' }
    ],
    accountingMapping: {
      salesRevenueAccount: '41100',
      cogsAccount: '51100',
      inventoryAssetAccount: '11300'
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'OPTICAL_EYEWEAR',
    code: 'MOD-OPTICAL',
    nameAr: 'محلات النظارات الطبية، الشمسية وفحص الإبصار (Optical Stores & Eyewear)',
    nameEn: 'Optical Stores & Eyewear',
    category: 'RETAIL',
    descriptionAr: 'موديول محلات النظارات المتكامل، كروشتات الكشف الطبي للعيون (مقاسات النظر Sphere, Cylinder, Axis, Add)، النظارات الشمسية، العدسات اللاصقة والإطارات.',
    iconName: 'Eye',
    badgeColor: 'cyan',
    isActive: true,
    isCoreBackbone: false,
    version: '3.0.0',
    routePath: '/industries/optical',
    customProductFields: [
      { id: 'opticalType', name: 'Product Type', nameAr: 'نوع الصنف البصري', type: 'select', options: ['إطار نظارة طبية', 'نظارة شمسية', 'عدسات طبية مفصلة', 'عدسات لاصقة ملونة / شفافة', 'إكسسوارات ومحافظ نظارات'] },
      { id: 'lensMaterial', name: 'Lens Material', nameAr: 'خامة العدسة', type: 'select', options: ['بلاستيك CR39', 'بوليکاربونات', 'فوتوكروميك (Anti-Radiation)', 'بلوك بلو لايت (Blue Control)', 'زجاجي'] }
    ],
    specializedFeatures: [
      { id: 'f_rx_eyes', nameAr: 'تسجيل روشتة قياس النظر الطبية للعملاء (Sphere / Cylinder / Axis)', descriptionAr: 'حفظ قياسات العين اليمنى واليسرى وطباعة أمر تفصيل العدسات للمعامل', enabled: true },
      { id: 'f_contact_lenses', nameAr: 'إدارة مخزون العدسات اللاصقة بالانحناء وبدلات النظر', descriptionAr: 'تتبع مقاسات وانحناءات العدسات اللاصقة وتواريخ الصلاحية', enabled: true }
    ],
    specializedReports: [
      { id: 'r_opt1', nameAr: 'تقرير مقاسات وروشتات العيون والعملاء', descriptionAr: 'أرشيف فحص النظر ومبيعات الإطارات والعدسات' },
      { id: 'r_opt2', nameAr: 'تقرير مبيعات النظارات الشمسية والماركات العالمية', descriptionAr: 'حركة مخزون الماركات والبراندات ومعدل دورانها' }
    ],
    accountingMapping: {
      salesRevenueAccount: '41100',
      cogsAccount: '51100',
      inventoryAssetAccount: '11300'
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'VETERINARY_CLINIC_PETSHOP',
    code: 'MOD-VET-PET',
    nameAr: 'العيادات البيطرية ومحلات مستلزمات الحيوانات الأليفة (Vet Clinic & Pet Shop)',
    nameEn: 'Veterinary Clinic & Pet Shop',
    category: 'HEALTHCARE',
    descriptionAr: 'موديول العيادات البيطرية ومتاجر الحيوانات الأليفة، السجل الطبي للحيوانات، تطعيمات الكلاب والقطط، أغذية الحيوانات، والإكسسوارات ومستلزمات العناية.',
    iconName: 'ShieldCheck',
    badgeColor: 'emerald',
    isActive: true,
    isCoreBackbone: false,
    version: '3.0.0',
    routePath: '/industries/vet-pet',
    customProductFields: [
      { id: 'petCategory', name: 'Target Pet Species', nameAr: 'نوع الحيوان المستهدف', type: 'select', options: ['قطط (Cats)', 'كلاب (Dogs)', 'طيور وعصافير', 'أسماك ومحواة', 'حيوانات أليفة أخرى', 'أغذية وأدوية عامة'] },
      { id: 'petProductType', name: 'Product Class', nameAr: 'نوع الصنف', type: 'select', options: ['دراي فود وأغذية جافة', 'معلبات ومكافآت', 'أدوية ومضادات طفيليات', 'فيتامينات ومكملات', 'شامبو ومستلزمات نظافة', 'ألعاب وأقفاص وإكسسوارات'] }
    ],
    specializedFeatures: [
      { id: 'f_pet_emr', nameAr: 'السجل الطبي للحيوان الأليف وجدول التطعيمات (Vaccine Tracker)', descriptionAr: 'تسجيل اسم الحيوان، المالك، تاريخ الميلاد، ومواعيد التطعيمات القادمة مع إرسال تذكير', enabled: true },
      { id: 'f_pet_clinic', nameAr: 'إدارة كشوفات العيادة البيطرية والعمليات الجراحية', descriptionAr: 'تسجيل التشخيص، الأدوية المصروفة بالعيادة، وأتعاب الطبيب البيطري', enabled: true }
    ],
    specializedReports: [
      { id: 'r_vet1', nameAr: 'تقرير مواعيد التطعيمات والجرعات القادمة للحيوانات', descriptionAr: 'متابعة العملاء المتخلفين عن تطعيمات الحيوانات' },
      { id: 'r_vet2', nameAr: 'تقرير مبيعات أغذية الأكياس والمكملات البيطرية', descriptionAr: 'حركة أصناف الدراي فود والأغذية الأكثر مبيعاً' }
    ],
    accountingMapping: {
      salesRevenueAccount: '41100',
      cogsAccount: '51100',
      inventoryAssetAccount: '11300',
      serviceRevenueAccount: '41300'
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'FURNITURE_DECOR',
    code: 'MOD-FURNITURE',
    nameAr: 'الأثاث، المفروشات والديكور المنزلي (Furniture & Home Decor)',
    nameEn: 'Furniture & Home Decor',
    category: 'RETAIL',
    descriptionAr: 'موديول معارض الأثاث المنزلي والمكتبي، المفروشات، الديكورات، تفصيل غرف النوم والانتريهات، حساب ألوان الأقمشة والأخشاب، وجداول التوصيل والتركيب.',
    iconName: 'ShoppingBag',
    badgeColor: 'amber',
    isActive: true,
    isCoreBackbone: false,
    version: '3.0.0',
    routePath: '/industries/furniture',
    customProductFields: [
      { id: 'furnitureCategory', name: 'Furniture Category', nameAr: 'قسم الأثاث', type: 'select', options: ['غرف نوم كاملة', 'صالونات وانتريهات', 'ركنات ومجالس مودرن', 'سفرة وطاولات طعام', 'مكاتب وأثاث إداري', 'مفروشات ومراتب', 'إكسسوارات ديكور وحائط'] },
      { id: 'woodType', name: 'Wood / Material Spec', nameAr: 'نوع الخشب والخامة الأساسية', type: 'select', options: ['خشب زان طبيعي أحمر', 'خشب موسكي / سويدي', 'كونتر زان مكبس', 'إم دي إف (MDF)', 'معدن وفولاذ', 'أقمشة مخملية / قطيفة'] }
    ],
    specializedFeatures: [
      { id: 'f_custom_order', nameAr: 'إدارة تفصيل الأثاث واختيار ألوان الأقمشة والخشب', descriptionAr: 'تسجيل طلب تفصيل خاص للعميل بأبعاد ومواصفات وألوان محددة مع عربون وموعد تسليم', enabled: true },
      { id: 'f_delivery_sched', nameAr: 'جدولة فرق النقل والتركيب المنزلي للعملاء', descriptionAr: 'تحديد موعد التوصيل والتركيب وفريق الفنيين المختص برقم الفاتورة', enabled: true }
    ],
    specializedReports: [
      { id: 'r_furn1', nameAr: 'تقرير حجوزات التفصيل ومواعيد التسليم للعملاء', descriptionAr: 'متابعة الطلبات الجاري تصنيعها وتاريخ تسليمها المتفق عليه' },
      { id: 'r_furn2', nameAr: 'تقرير مبيعات المعارض وأقسام الأثاث والمفروشات', descriptionAr: 'تحليل ربحية مجموعات غرف النوم والصالونات' }
    ],
    accountingMapping: {
      salesRevenueAccount: '41100',
      cogsAccount: '51100',
      inventoryAssetAccount: '11300'
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'SMART_TRANSPORT_COURIER',
    code: 'MOD-TRANSPORT',
    nameAr: 'شركات النقل الذكي والشحن والطرود (Smart Transport & Courier Logistics)',
    nameEn: 'Smart Transport & Courier Logistics',
    category: 'SERVICES',
    descriptionAr: 'موديول شركات النقل الذكي والتوصيل السريع وشحن الطرود، تتبع أسطول المركبات والسائقين بالـ GPS، إدارة بوليصات الشحن (AWB)، تحصيل الدفع عند الاستلام (COD)، وتسوية عمولات السائقين.',
    iconName: 'Truck',
    badgeColor: 'blue',
    isActive: true,
    isCoreBackbone: false,
    version: '3.0.0',
    routePath: '/industries/transport-shipping',
    customProductFields: [
      { id: 'shipmentType', name: 'Shipment Type', nameAr: 'نوع الشحنة / الطرد', type: 'select', options: ['طرود وثائق ومستندات', 'طرد تجارة إلكترونية (E-Commerce)', 'نقل أثاث وبضائع ثقيلة', 'نقل ركاب / توصيل ذكي'] },
      { id: 'serviceLevel', name: 'Service Level', nameAr: 'مستوى الخدمة', type: 'select', options: ['توصيل قياسي (Standard)', 'توصيل سريع فوري (Express 2h)', 'شحن بين المحافظات'] }
    ],
    specializedFeatures: [
      { id: 'f_awb_track', nameAr: 'إدارة بوليصات الشحن (AWB) وتتبع خط سير الطرود', descriptionAr: 'تتبع حالة الشحنة لحظياً من الاستلام وحتى التسليم النهائي للعميل', enabled: true },
      { id: 'f_cod_settle', nameAr: 'إدارة تحصيل الدفع عند الاستلام (COD) وتسوية السائقين', descriptionAr: 'حساب النقدية المحصلة لكل سائق وإصدار سندات التوريد للخزينة', enabled: true }
    ],
    specializedReports: [
      { id: 'r_tr1', nameAr: 'تقرير حركة الشحنات ومعدل التوصيل في الموعد (OTD)', descriptionAr: 'متابعة أداء السائقين ونسب التسليم الناجح' },
      { id: 'r_tr2', nameAr: 'تقرير إيرادات الشحن وعمولات السائقين والوقود', descriptionAr: 'تحليل ربحية أسطول النقل ومصاريف التشغيل' }
    ],
    accountingMapping: {
      salesRevenueAccount: '41300',
      cogsAccount: '51200',
      inventoryAssetAccount: '11300'
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'CERAMICS_SANITARY',
    code: 'MOD-CERAMICS',
    nameAr: 'السيراميك، البورسلين والأدوات الصحية (Ceramics & Sanitary)',
    nameEn: 'Ceramics & Sanitary Ware',
    category: 'RETAIL',
    descriptionAr: 'موديول مخصص لمعارض ومستودعات السيراميك والبورسلين والأدوات الصحية، يدعم حساب المساحات بالمتر المربع والفرز (فرز أول، فرز ثاني)، وتتبع اللوتات ومقاسات البلاطات وحجز الطلبيات المؤجل.',
    iconName: 'LayoutTemplate',
    badgeColor: 'blue',
    isActive: true,
    isCoreBackbone: false,
    version: '3.0.0',
    routePath: '/industries/ceramics-sanitary',
    customProductFields: [
      { id: 'tileSize', name: 'Tile Size (cm)', nameAr: 'مقاس البلاطة (سم)', type: 'text', required: true, placeholderAr: 'مثال: 60×60 أو 120×60' },
      { id: 'grade', name: 'Grade / Sorting', nameAr: 'الفرز / الدرجة', type: 'select', options: ['فرز أول ممتاز', 'فرز ثاني', 'فرز ثالث', 'فرز رابع / تجاري'], required: true },
      { id: 'm2PerBox', name: 'M2 per Box', nameAr: 'عدد الأمتار بالكرتونة (م²)', type: 'number', required: true, defaultValue: 1.44 },
      { id: 'pcsPerBox', name: 'Pieces per Box', nameAr: 'عدد القطع بالكرتونة', type: 'number', required: true, defaultValue: 4 },
      { id: 'lotNumber', name: 'Lot Number / Tone', nameAr: 'رقم الطبخة / اللوت (Tone)', type: 'text', placeholderAr: 'مثال: T-450 (لتطابق اللون)' }
    ],
    specializedFeatures: [
      { id: 'f_m2_calc', nameAr: 'حاسبة المساحات والكراتين الذكية (M2 Calculator)', descriptionAr: 'إدخال المساحة المطلوبة بالمتر المربع ليقوم النظام بحساب عدد الكراتين والقطع اللازمة بدقة وبصورة تلقائية', enabled: true },
      { id: 'f_lot_match', nameAr: 'محرك مطابقة اللوت والطبخة (Tone Matching Engine)', descriptionAr: 'ضمان عدم صرف كراتين من طباخات مختلفة لنفس العميل لتفادي اختلاف درجات ألوان السيراميك', enabled: true },
      { id: 'f_hold_reserve', nameAr: 'نظام حجز وتخصيص البضائع بالمستودع', descriptionAr: 'حجز طلبيات السيراميك للعملاء بالمخزن حتى موعد استلام البناء لمنع بيعها لعملاء آخرين', enabled: true }
    ],
    specializedReports: [
      { id: 'r_m2_stock', nameAr: 'تقرير رصيد السيراميك الفعلي بالكرتونة والمتر المربع', descriptionAr: 'جرد فوري للمخزون بالوحدتين (كراتين مساحة م²)' },
      { id: 'r_lot_inventory', nameAr: 'تقرير الأرصدة حسب رقم اللوت والطبخة (Tone Balance)', descriptionAr: 'متابعة الكميات المتاحة من كل طبخة لون لمنع الخلط' },
      { id: 'r_reserved_goods', nameAr: 'تقرير الطلبيات المحجوزة غير المسلمة للعملاء', descriptionAr: 'حصر البضائع المحجوزة في مستودعات المعرض' }
    ],
    accountingMapping: {
      salesRevenueAccount: '41200',
      cogsAccount: '51100',
      inventoryAssetAccount: '11300'
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'FUEL_STATION',
    code: 'MOD-FUEL-STATION',
    nameAr: 'محطات الوقود والتموين (Fuel Stations)',
    nameEn: 'Fuel Station Module',
    category: 'SERVICES',
    descriptionAr: 'موديول مخصص لإدارة محطات الوقود والخدمات البترولية، يدعم قراءة عدادات الطلمبات اليومية، تتبع منسوب خزانات البترول وحساب مستوى رطوبة قعر التانك، تسوية وإقفال الوردية والتحليل الرياضي لعجز التبخر الحراري الطبيعي آلياً.',
    iconName: 'Flame',
    badgeColor: 'amber',
    isActive: true,
    isCoreBackbone: false,
    version: '4.0.0',
    routePath: '/industries/fuel-station',
    customProductFields: [
      { id: 'fuelType', name: 'Fuel Type', nameAr: 'نوع الوقود والأوكتان', type: 'select', options: ['بنزين 95', 'بنزين 92', 'بنزين 80', 'سولار / ديزل'], required: true },
      { id: 'tankCapacity', name: 'Tank Capacity', nameAr: 'سعة الخزان المرتبط (لتر)', type: 'number', required: true, defaultValue: 45000 },
      { id: 'evaporationLimit', name: 'Evaporation Limit %', nameAr: 'حد التبخر المسموح به %', type: 'number', required: true, defaultValue: 0.15 }
    ],
    specializedFeatures: [
      { id: 'f_nozzle_tracking', nameAr: 'محرك تتبع قراءات المضخات والمسدسات', descriptionAr: 'تسجيل القراءة الافتتاحية والختامية وحساب السحب الإجمالي آلياً بمعدل استجابة < 20ms', enabled: true },
      { id: 'f_tank_atg', nameAr: 'نظام المعايرة التلقائي ومستوى تانكات الوقود', descriptionAr: 'ربط سحب المضخات بالخزان وتنبيهات الخلط أو منسوب المياه الكيميائي الزائد', enabled: true },
      { id: 'f_thermal_loss', nameAr: 'حاسبة التبخر الحراري الطبيعي ونسبة الفاقد', descriptionAr: 'تقدير الفارق الطبيعي للوقود حسب درجات الحرارة لضمان التدقيق المالي المتكامل', enabled: true }
    ],
    specializedReports: [
      { id: 'r_fuel_sales', nameAr: 'تقرير مبيعات الوقود ومطابقة قراءات الطلمبات', descriptionAr: 'مقارنة قراءة العداد الفعلي مع إيرادات الخزينة لليوم' },
      { id: 'r_evaporation', nameAr: 'تقرير عجز التبخر وتغيير الكثافة الحرارية الخزانات', descriptionAr: 'تحليل نسب هدر وتطاير الوقود الطبيعي في الحر الشديد' }
    ],
    accountingMapping: {
      salesRevenueAccount: '41200',
      cogsAccount: '51100',
      inventoryAssetAccount: '11300'
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'CONTRACTING_PROJECTS',
    code: 'MOD-CONTRACTING',
    nameAr: 'شركات المقاولات، إدارة المشاريع والمستخلصات (Contracting & Project Management)',
    nameEn: 'Contracting & Construction Projects',
    category: 'SERVICES',
    descriptionAr: 'موديول مخصص لشركات المقاولات والتشييد، يدعم إدارة جداول الكميات (BoQ)، المستخلصات الجارية والختامية، نسب ضمان الأعمال (Retention)، الدفعات المقدمة، ومتابعة تكلفة المعدات والعمالة والمقاولين الباطن.',
    iconName: 'Building2',
    badgeColor: 'amber',
    isActive: true,
    isCoreBackbone: false,
    version: '4.0.0',
    routePath: '/industries/contracting',
    customProductFields: [
      { id: 'projectCode', name: 'Project Reference Code', nameAr: 'كود المشروع', type: 'text', required: true, placeholderAr: 'مثال: PRJ-2026-01' },
      { id: 'boqUnit', name: 'BoQ Unit of Measure', nameAr: 'وحدة بند المقايسة', type: 'select', options: ['متر مكعب (م³)', 'متر مربع (م²)', 'متر طولي (م.ط)', 'طن حديد/أسمنت', 'نقطة كهرباء/صحي', 'مقطوعية إجمالية', 'يومية معدة/عمالة'] },
      { id: 'retentionRate', name: 'Retention / Guarantee %', nameAr: 'نسبة ضمان الأعمال المحتجزة %', type: 'number', defaultValue: 5 }
    ],
    specializedFeatures: [
      { id: 'f_boq_mgmt', nameAr: 'إدارة مقايسات الأعمال وجداول الكميات (BoQ)', descriptionAr: 'تتبع الكميات التقديرية والمنفذة وتكلفة الوحدة وهوامش الأرباح للمشروع', enabled: true },
      { id: 'f_progress_certs', nameAr: 'إصدار المستخلصات الجارية والختامية وحسم الضمانات', descriptionAr: 'حساب نسبة الإنجاز وخصم الدفعة المقدمة وضمان الأعمال آلياً مع الترحيل المحاسبي للقيود', enabled: true },
      { id: 'f_subcontractor', nameAr: 'حسابات مقاولي الباطن وتكلفة المعدات والتشغيل', descriptionAr: 'تسجيل أوامر إسناد مقاولي الباطن والوقود واليوميات وربطها بمركز تكلفة المشروع', enabled: true }
    ],
    specializedReports: [
      { id: 'r_prj_cost', nameAr: 'تقرير الأرباح والمصروفات الفعلية لكل مشروع', descriptionAr: 'مقارنة الميزانية التقديرية بالتكلفة الفعلية والمستخلصات المحصلة' },
      { id: 'r_prj_retention', nameAr: 'تقرير مستحقات ضمان الأعمال والدفعات المعلقة', descriptionAr: 'متابعة مبالغ التأمين المحتجزة لدى العملاء وتاريخ استحقاق الإفراج عنها' }
    ],
    accountingMapping: {
      salesRevenueAccount: '41300',
      cogsAccount: '51200',
      inventoryAssetAccount: '11300'
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'LANDSCAPING_GARDENS',
    code: 'MOD-LANDSCAPING',
    nameAr: 'تنسيق الحدائق، اللاندسكيب والمشاتل وشبكات الري (Landscaping & Nursery)',
    nameEn: 'Landscaping, Gardens & Nursery',
    category: 'SERVICES',
    descriptionAr: 'موديول مخصص لشركات ومؤسسات اللاندسكيب وتنسيق الحدائق والمشاتل، يدعم إدارة أصناف الأشجار والشتلات والنجيلة، شبكات الري الآلي، عقود الصيانة الدورية للحدائق، وزيارات الرعاية الدورية.',
    iconName: 'Trees',
    badgeColor: 'emerald',
    isActive: true,
    isCoreBackbone: false,
    version: '4.0.0',
    routePath: '/industries/landscaping',
    customProductFields: [
      { id: 'plantCategory', name: 'Plant Category', nameAr: 'تصنيف النبات', type: 'select', options: ['أشجار ظل ونخيل', 'نباتات زينة وشجيرات', 'أزهار موسمية ومغطيات', 'نجيلة طبيعية وصناعية', 'مستلزمات شبكات ري وطلمبات', 'أسمدة ومبيدات حدائق'] },
      { id: 'sunlightExposure', name: 'Sunlight Exposure', nameAr: 'احتياج الشمس والإضاءة', type: 'select', options: ['شمس مباشرة كاملة (Full Sun)', 'نصف ظل (Partial Shade)', 'نبات ظل داخلي (Indoor)'] },
      { id: 'irrigationType', name: 'Irrigation Spec', nameAr: 'نظام الري الموصى به', type: 'select', options: ['ري بالتنقيط (Drip)', 'رشاشات مائية (Sprinklers)', 'غمر يدوي', 'بابلر أشجار (Bubbler)'] }
    ],
    specializedFeatures: [
      { id: 'f_nursery_stock', nameAr: 'إدارة مخزون المشاتل وحجم الأصص والارتفاعات', descriptionAr: 'تتبع كميات الشتلات ومقاس القصيص وأعمار الأشجار ومعدل النمو', enabled: true },
      { id: 'f_landscape_contracts', nameAr: 'عقود الصيانة الدورية للحدائق والمسطحات الخضراء', descriptionAr: 'جدولة زيارات قص النجيل، التسميد، مكافحة الآفات وفحص شبكات الري تلقائياً', enabled: true },
      { id: 'f_irrigation_calc', nameAr: 'حاسبة شبكات الري وضغوط المحابس والمحابس الكهربية', descriptionAr: 'حساب احتياجات الأمتار من مواسير الري والرشاشات بناءً على مساحة الحديقة', enabled: true }
    ],
    specializedReports: [
      { id: 'r_garden_contracts', nameAr: 'تقرير عقود صيانة الحدائق والزيارات المجدولة', descriptionAr: 'بيان بالحدائق والمجمعات والمواعيد الأسبوعية لفرق العناية' },
      { id: 'r_plant_sales', nameAr: 'تقرير مبيعات المشاتل والأشجار الأكثر طلباً', descriptionAr: 'حركة بيع الشتلات ومستلزمات الحدائق ونسب الهالك الزراعي' }
    ],
    accountingMapping: {
      salesRevenueAccount: '41300',
      cogsAccount: '51100',
      inventoryAssetAccount: '11300'
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'PAINTS_COATINGS',
    code: 'MOD-PAINTS',
    nameAr: 'الدهانات، البويات ومكائن التلوين بالكمبيوتر (Paints, Coatings & Tinting)',
    nameEn: 'Paints, Coatings & Tinting Machine',
    category: 'RETAIL',
    descriptionAr: 'موديول متكامل لمعارض ومصانع البويات والدهانات، يدعم قواعد الدهان الأساسية (Base A, B, C)، كروت الألوان العالمية (NCS, RAL, Jotun)، حساب نسب وحقن أحبار التلوين بالمليلتر، والتحويل بين الجالون والبستلة والبرميل.',
    iconName: 'Paintbrush',
    badgeColor: 'purple',
    isActive: true,
    isCoreBackbone: false,
    version: '4.0.0',
    routePath: '/industries/paints',
    customProductFields: [
      { id: 'paintBase', name: 'Base Type', nameAr: 'نوع القاعدة (Base)', type: 'select', options: ['قاعدة Base A (ألوان فاتحة)', 'قاعدة Base B (ألوان متوسطة)', 'قاعدة Base C (ألوان داكنة ونقية)', 'جاهز للدهان بدون خلط (Ready Mix)'] },
      { id: 'glossLevel', name: 'Gloss / Finish Level', nameAr: 'درجة اللمعان', type: 'select', options: ['مط كلياً (Dead Matt)', 'مط حريري (Matt)', 'نصف لامع (Semi-Gloss)', 'لامع زيتي (High Gloss)', 'ديكوري ومؤثرات خاصة'] },
      { id: 'packVolume', name: 'Package Volume', nameAr: 'حجم العبوة والتعبئة', type: 'select', options: ['بستلة / جردل 18 لتر', 'جالون 3.6 لتر', 'ربع جالون 0.9 لتر', 'كيلو / أنبوبة'] },
      { id: 'colorCode', name: 'Color Recipe Code', nameAr: 'كود اللون بالكمبيوتر', type: 'text', placeholderAr: 'مثال: NCS S 1010-Y50R أو RAL 9010' }
    ],
    specializedFeatures: [
      { id: 'f_tinting_dispenser', nameAr: 'محرك ماكينة تلوين الكمبيوتر وحقن الأحبار (Color Tinting Engine)', descriptionAr: 'حساب كميات أحبار التلوين (YOX, BLK, RED, BLU) وسعر التلوين المضاف آلياً', enabled: true },
      { id: 'f_formula_history', nameAr: 'أرشيف تركيبات العملاء والألوان المخصصة', descriptionAr: 'حفظ وصفة اللون الخاصة بكل عميل برقم جواله لإعادة خلط نفس الدرجة بدقة 100%', enabled: true },
      { id: 'f_coverage_calc', nameAr: 'حاسبة مساحات الجدران وعدد العبوات المطلوبة', descriptionAr: 'إدخال أبعاد الغرف لحساب عدد الجالونات والبستلات ووجه الأساس والبطانة والتشطيب', enabled: true }
    ],
    specializedReports: [
      { id: 'r_paint_recipes', nameAr: 'تقرير استهلاك أحبار ماكينة التلوين والخلط', descriptionAr: 'متابعة رصيد الصبغات والأحبار المحقونة في ماكينة التلوين' },
      { id: 'r_paint_sales', nameAr: 'تقرير مبيعات القواعد والدهانات والبراندات', descriptionAr: 'مقارنة مبيعات جوتن، GLC، سايبس، الجزيرة وهامش الربح' }
    ],
    accountingMapping: {
      salesRevenueAccount: '41100',
      cogsAccount: '51100',
      inventoryAssetAccount: '11300'
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

export class IndustryModuleEngine {
  // 1. Get all modules
  public static getModules(): IndustryModule[] {
    const list = MaroSyncEngine.getLocalCollection<IndustryModule>(MODULES_COLLECTION);
    if (list.length === 0) {
      MaroSyncEngine.setLocalCollection(MODULES_COLLECTION, DEFAULT_INDUSTRY_MODULES);
      return DEFAULT_INDUSTRY_MODULES;
    }
    // Auto-inject missing core modules to ensure newly added defaults appear
    let hasNew = false;
    for (const def of DEFAULT_INDUSTRY_MODULES) {
      if (!list.some(m => m.id === def.id)) {
        list.push(def);
        hasNew = true;
      }
    }
    if (hasNew) {
      MaroSyncEngine.setLocalCollection(MODULES_COLLECTION, list);
    }
    return list;
  }

  // 2. Get only active modules
  public static getActiveModules(): IndustryModule[] {
    return this.getModules().filter(m => m.isActive);
  }

  // 3. Get module by ID
  public static getModuleById(id: string): IndustryModule | undefined {
    return this.getModules().find(m => m.id === id);
  }

  // 4. Toggle module status (Activate / Deactivate) from Developer Console
  public static toggleModule(id: string, activeState?: boolean): IndustryModule {
    const modules = this.getModules();
    const mod = modules.find(m => m.id === id);
    if (!mod) throw new Error(`الموديول ${id} غير موجود`);

    mod.isActive = activeState !== undefined ? activeState : !mod.isActive;
    mod.updatedAt = new Date().toISOString();

    MaroSyncEngine.saveDocument(MODULES_COLLECTION, mod);
    MaroEventBus.publish('MODULE_STATE_CHANGED', { moduleId: id, isActive: mod.isActive });
    MaroEventBus.publish('AUDIT_LOG_ADDED', {
      entity: 'IndustryModule',
      entityId: id,
      action: mod.isActive ? 'ACTIVATE' : 'DEACTIVATE',
      details: `تم ${mod.isActive ? 'تنشيط' : 'تعطيل'} موديول النشاط التجاري: ${mod.nameAr}`,
      timestamp: new Date().toISOString()
    });

    return mod;
  }

  // 5. Register / Add a Brand-New Custom Vertical Industry Module (Extensible Architecture)
  public static registerCustomModule(newModule: Omit<IndustryModule, 'createdAt' | 'updatedAt'>): IndustryModule {
    const moduleToSave: IndustryModule = {
      ...newModule,
      isCoreBackbone: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    MaroSyncEngine.saveDocument(MODULES_COLLECTION, moduleToSave);
    MaroEventBus.publish('CUSTOM_MODULE_REGISTERED', moduleToSave);
    return moduleToSave;
  }

  // 6. Get all custom fields from all currently active modules to render dynamically in product screens
  public static getActiveProductCustomFields() {
    const activeMods = this.getActiveModules();
    return activeMods.flatMap(m => m.customProductFields.map(f => ({ ...f, moduleId: m.id, moduleNameAr: m.nameAr })));
  }

  // -------------------------------------------------------------
  // Data Repositories for Sub-Modules
  // -------------------------------------------------------------

  // Food & Supermarket Multi-Unit & Scale Repository
  public static getFoodSupermarketProducts(): FoodSupermarketProduct[] {
    const list = MaroSyncEngine.getLocalCollection<FoodSupermarketProduct>(FOOD_COLLECTION);
    if (list.length === 0) return this.seedFoodSampleData();
    return list;
  }

  public static saveFoodSupermarketProduct(product: FoodSupermarketProduct): void {
    MaroSyncEngine.saveDocument(FOOD_COLLECTION, product);
  }

  // Helper: Decode EAN-13 Scale Barcode
  public static decodeScaleBarcode(barcode: string, products: FoodSupermarketProduct[]) {
    const clean = barcode.trim();
    if (clean.length !== 13) {
      return { success: false, error: 'طول الباركود يجب أن يكون 13 رقماً بالضبط (EAN-13)' };
    }
    const prefix = clean.substring(0, 2);
    if (prefix !== '99' && prefix !== '20' && prefix !== '21' && prefix !== '22') {
      return { success: false, error: 'بادئة باركود الميزان غير مدعومة (يجب أن تبدأ بـ 99 أو 20 أو 21)' };
    }

    const scaleItemCode = clean.substring(2, 7); // 5 digits PLU
    const rawVal = parseInt(clean.substring(7, 12), 10); // 5 digits weight/price
    const checksum = clean.substring(12, 13);

    // Find product matching scaleItemCode
    const matchedProduct = products.find(p => p.isWeighted && p.scaleItemCode === scaleItemCode) || 
      products.find(p => p.isWeighted);

    const weightKg = rawVal / 1000;
    const unitPrice = matchedProduct?.defaultPricePerKg || 180;
    const totalPrice = weightKg * unitPrice;

    return {
      success: true,
      prefix,
      scaleItemCode,
      weightKg,
      weightGrams: rawVal,
      checksum,
      product: matchedProduct,
      unitPricePerKg: unitPrice,
      totalPrice: Number(totalPrice.toFixed(2))
    };
  }

  // Fashion Matrix Repository
  public static getFashionMatrixItems(): FashionMatrixItem[] {
    const list = MaroSyncEngine.getLocalCollection<FashionMatrixItem>(FASHION_COLLECTION);
    if (list.length === 0) return this.seedFashionSampleData();
    return list;
  }

  public static saveFashionMatrixItem(item: FashionMatrixItem): void {
    MaroSyncEngine.saveDocument(FASHION_COLLECTION, item);
  }

  // Maintenance Tickets Repository
  public static getMaintenanceTickets(): MaintenanceTicket[] {
    const list = MaroSyncEngine.getLocalCollection<MaintenanceTicket>(MAINTENANCE_COLLECTION);
    if (list.length === 0) return this.seedMaintenanceSampleData();
    return list;
  }

  public static saveMaintenanceTicket(ticket: MaintenanceTicket): void {
    MaroSyncEngine.saveDocument(MAINTENANCE_COLLECTION, ticket);
    // Automatic posting of Service Revenue to General Accounting if completed
    if (ticket.status === 'DELIVERED' && ticket.finalCost > 0) {
      try {
        AccountingService.postJournalEntry(
          ticket.ticketNumber,
          `إيرادات صيانة جهاز: ${ticket.deviceType} (${ticket.customerName})`,
          [
            { accountCode: '11100', debit: ticket.finalCost, credit: 0 },
            { accountCode: '41200', debit: 0, credit: ticket.finalCost }
          ]
        );
      } catch (e) {
        console.warn('Accounting notice:', e);
      }
    }
  }

  // Restaurant Tables Repository
  public static getRestaurantTables(): RestaurantTable[] {
    const list = MaroSyncEngine.getLocalCollection<RestaurantTable>(RESTAURANT_TABLES_COLLECTION);
    if (list.length === 0) return this.seedRestaurantSampleData();
    return list;
  }

  public static saveRestaurantTable(table: RestaurantTable): void {
    MaroSyncEngine.saveDocument(RESTAURANT_TABLES_COLLECTION, table);
  }

  // Pharmacy Drugs Repository
  public static getPharmacyDrugs(): PharmacyDrug[] {
    const list = MaroSyncEngine.getLocalCollection<PharmacyDrug>(PHARMACY_COLLECTION);
    if (list.length === 0) return this.seedPharmacySampleData();
    return list;
  }

  public static savePharmacyDrug(drug: PharmacyDrug): void {
    MaroSyncEngine.saveDocument(PHARMACY_COLLECTION, drug);
  }

  // Auto Spare Parts Repository
  public static getAutoParts(): AutoPartFitment[] {
    const list = MaroSyncEngine.getLocalCollection<AutoPartFitment>(AUTO_PARTS_COLLECTION);
    if (list.length === 0) return this.seedAutoPartsSampleData();
    return list;
  }

  public static saveAutoPart(part: AutoPartFitment): void {
    MaroSyncEngine.saveDocument(AUTO_PARTS_COLLECTION, part);
  }

  // -------------------------------------------------------------
  // Seed Sample Real Data for All Vertical Industries
  // -------------------------------------------------------------
  private static seedFoodSampleData(): FoodSupermarketProduct[] {
    const products: FoodSupermarketProduct[] = [
      {
        id: 'food_01',
        code: 'PRD-FD-001',
        nameAr: 'تونة قطع صن شاين فاخرة في زيت دوار الشمس 185جم',
        nameEn: 'Sunshine Solid Tuna 185g',
        department: 'بقالة جافة ومعلبات',
        isWeighted: false,
        baseUnit: 'قطعة',
        batchNumber: 'LOT-2026-SUN-99',
        expiryDate: '2028-06-30',
        storageTemp: 'عادي (درجة الغرفة)',
        stockInBaseUnit: 480,
        minStockAlert: 50,
        units: [
          {
            id: 'u_01_ctn',
            unitName: 'كرتونة',
            factor: 24, // 24 pieces in 1 carton
            barcode: '6221100240101',
            costPrice: 850,
            wholesalePrice: 960,
            retailPrice: 1020,
            isBaseUnit: false
          },
          {
            id: 'u_01_box',
            unitName: 'علبة',
            factor: 6, // 6 pieces in 1 pack
            barcode: '6221100060102',
            costPrice: 215,
            wholesalePrice: 245,
            retailPrice: 260,
            isBaseUnit: false
          },
          {
            id: 'u_01_pcs',
            unitName: 'قطعة',
            factor: 1,
            barcode: '6221100010103',
            costPrice: 36,
            wholesalePrice: 42,
            retailPrice: 45,
            isBaseUnit: true,
            isDefaultSalesUnit: true
          }
        ]
      },
      {
        id: 'food_02',
        code: 'PRD-FD-002',
        nameAr: 'حليب جهينة كامل الدسم طويل الأجل 1 لتر',
        nameEn: 'Juhayna Full Cream Milk 1L',
        department: 'ألبان وأجبان',
        isWeighted: false,
        baseUnit: 'قطعة',
        batchNumber: 'LOT-2026-JUH-04',
        expiryDate: '2026-12-15',
        storageTemp: 'عادي (درجة الغرفة)',
        stockInBaseUnit: 360,
        minStockAlert: 40,
        units: [
          {
            id: 'u_02_ctn',
            unitName: 'كرتونة',
            factor: 12, // 12 packs in 1 carton
            barcode: '6221000120201',
            costPrice: 440,
            wholesalePrice: 490,
            retailPrice: 520,
            isBaseUnit: false
          },
          {
            id: 'u_02_pcs',
            unitName: 'قطعة',
            factor: 1,
            barcode: '6221000010202',
            costPrice: 38,
            wholesalePrice: 42,
            retailPrice: 45,
            isBaseUnit: true,
            isDefaultSalesUnit: true
          }
        ]
      },
      {
        id: 'food_03',
        code: 'PRD-FD-003',
        nameAr: 'أرز مصري عريض الحبة فاخر درجة أولى كفر الشيخ',
        nameEn: 'Egyptian Premium Rice 1kg / 25kg Sack',
        department: 'بقالة جافة ومعلبات',
        isWeighted: false,
        baseUnit: 'كيلوجرام',
        batchNumber: 'LOT-2026-RICE-11',
        expiryDate: '2027-08-01',
        storageTemp: 'عادي (درجة الغرفة)',
        stockInBaseUnit: 1250,
        minStockAlert: 100,
        units: [
          {
            id: 'u_03_sack',
            unitName: 'شيكارة',
            factor: 25, // 25kg in 1 sack
            barcode: '6223000250301',
            costPrice: 700,
            wholesalePrice: 780,
            retailPrice: 825,
            isBaseUnit: false
          },
          {
            id: 'u_03_kg',
            unitName: 'كيلوجرام',
            factor: 1,
            barcode: '6223000010302',
            costPrice: 29,
            wholesalePrice: 32,
            retailPrice: 35,
            isBaseUnit: true,
            isDefaultSalesUnit: true
          }
        ]
      },
      {
        id: 'food_04',
        code: 'PRD-FD-004',
        nameAr: 'جبن رومي قديم مبشور فاخر (صنف ميزان باركود)',
        nameEn: 'Grated Aged Rumi Cheese (Scale Weighted)',
        department: 'ألبان وأجبان',
        isWeighted: true,
        scaleItemCode: '00105', // 5 digits PLU
        defaultPricePerKg: 340,
        baseUnit: 'كيلوجرام',
        batchNumber: 'LOT-2026-CHEESE-88',
        expiryDate: '2026-10-30',
        storageTemp: 'مبرد (2° إلى 5° م)',
        stockInBaseUnit: 85.5,
        minStockAlert: 10,
        units: [
          {
            id: 'u_04_kg',
            unitName: 'كيلوجرام',
            factor: 1,
            barcode: '9900105000000', // Scale template
            costPrice: 270,
            wholesalePrice: 310,
            retailPrice: 340,
            isBaseUnit: true,
            isDefaultSalesUnit: true
          }
        ]
      },
      {
        id: 'food_05',
        code: 'PRD-FD-005',
        nameAr: 'مفروم بقري بلدي طازج قليل الدسم (صنف ميزان باركود)',
        nameEn: 'Fresh Minced Beef (Scale Weighted)',
        department: 'لحوم ودواجن طازجة',
        isWeighted: true,
        scaleItemCode: '00210',
        defaultPricePerKg: 390,
        baseUnit: 'كيلوجرام',
        batchNumber: 'LOT-2026-MEAT-02',
        expiryDate: '2026-08-20',
        storageTemp: 'مبرد (2° إلى 5° م)',
        stockInBaseUnit: 45.2,
        minStockAlert: 5,
        units: [
          {
            id: 'u_05_kg',
            unitName: 'كيلوجرام',
            factor: 1,
            barcode: '9900210000000',
            costPrice: 320,
            wholesalePrice: 360,
            retailPrice: 390,
            isBaseUnit: true,
            isDefaultSalesUnit: true
          }
        ]
      }
    ];

    products.forEach(p => MaroSyncEngine.saveDocument(FOOD_COLLECTION, p));
    return products;
  }

  private static seedFashionSampleData(): FashionMatrixItem[] {
    const sample1: FashionMatrixItem = {
      id: 'fsh_01',
      modelCode: 'MOD-2026-JKT-PREM',
      modelName: 'جاكيت بليزر كلاسيك مارو بريميوم صوف فاخر',
      brand: 'MARO Couture',
      gender: 'رجالي',
      origin: 'تركي (Turkey)',
      season: 'شتوي 2026',
      material: 'صوف تركي مخلوط كشمير 80%',
      colors: ['أسود', 'كحلي', 'رمادي'],
      sizes: ['M', 'L', 'XL', '2XL'],
      basePrice: 850,
      costPrice: 500,
      variants: [
        { id: 'v1', productId: 'p_fsh_1', productName: 'جاكيت بليزر كلاسيك - أسود / M (رجالي - تركي)', color: 'أسود', size: 'M', gender: 'رجالي', origin: 'تركي (Turkey)', sku: 'JKT-BLK-M', barcode: '622100010011', stock: 15, price: 850, costPrice: 500 },
        { id: 'v2', productId: 'p_fsh_2', productName: 'جاكيت بليزر كلاسيك - أسود / L (رجالي - تركي)', color: 'أسود', size: 'L', gender: 'رجالي', origin: 'تركي (Turkey)', sku: 'JKT-BLK-L', barcode: '622100010012', stock: 20, price: 850, costPrice: 500 },
        { id: 'v3', productId: 'p_fsh_3', productName: 'جاكيت بليزر كلاسيك - كحلي / L (رجالي - تركي)', color: 'كحلي', size: 'L', gender: 'رجالي', origin: 'تركي (Turkey)', sku: 'JKT-NAV-L', barcode: '622100010021', stock: 12, price: 850, costPrice: 500 },
        { id: 'v4', productId: 'p_fsh_4', productName: 'جاكيت بليزر كلاسيك - رمادي / XL (رجالي - تركي)', color: 'رمادي', size: 'XL', gender: 'رجالي', origin: 'تركي (Turkey)', sku: 'JKT-GRY-XL', barcode: '622100010031', stock: 8, price: 850, costPrice: 500 }
      ]
    };

    const sample2: FashionMatrixItem = {
      id: 'fsh_02',
      modelCode: 'MOD-2026-DRS-FLWR',
      modelName: 'فستان شيفون مطرز حريمي صيفي أنيق',
      brand: 'Bella Donna Milano',
      gender: 'حريمي (نساء)',
      origin: 'صيني (China)',
      season: 'صيفي 2026',
      material: 'شيفون طبيعي مبطن قطن 100%',
      colors: ['أحمر', 'بيج', 'كحلي'],
      sizes: ['S', 'M', 'L', 'XL'],
      basePrice: 620,
      costPrice: 340,
      variants: [
        { id: 'v21', productId: 'p_fsh_21', productName: 'فستان شيفون مطرز - أحمر / S (حريمي - صيني)', color: 'أحمر', size: 'S', gender: 'حريمي (نساء)', origin: 'صيني (China)', sku: 'DRS-RED-S', barcode: '622100020011', stock: 18, price: 620, costPrice: 340 },
        { id: 'v22', productId: 'p_fsh_22', productName: 'فستان شيفون مطرز - أحمر / M (حريمي - صيني)', color: 'أحمر', size: 'M', gender: 'حريمي (نساء)', origin: 'صيني (China)', sku: 'DRS-RED-M', barcode: '622100020012', stock: 25, price: 620, costPrice: 340 },
        { id: 'v23', productId: 'p_fsh_23', productName: 'فستان شيفون مطرز - بيج / M (حريمي - صيني)', color: 'بيج', size: 'M', gender: 'حريمي (نساء)', origin: 'صيني (China)', sku: 'DRS-BEG-M', barcode: '622100020022', stock: 14, price: 620, costPrice: 340 }
      ]
    };

    const sample3: FashionMatrixItem = {
      id: 'fsh_03',
      modelCode: 'MOD-2026-KID-PNT',
      modelName: 'بنطلون جينز أطفال أولادي وبناتي مريح مرن',
      brand: 'Little Stars',
      gender: 'أولادي (أطفال)',
      origin: 'مصري (Egypt)',
      season: 'طوال العام / كلاسيك',
      material: 'جينز قطن ليكرا مصري فاخر',
      colors: ['أزرق', 'أسود'],
      sizes: ['38', '39', '40', '41'],
      basePrice: 280,
      costPrice: 150,
      variants: [
        { id: 'v31', productId: 'p_fsh_31', productName: 'بنطلون جينز أطفال - أزرق / 38 (أولادي - مصري)', color: 'أزرق', size: '38', gender: 'أولادي (أطفال)', origin: 'مصري (Egypt)', sku: 'KID-BLU-38', barcode: '622100030011', stock: 30, price: 280, costPrice: 150 },
        { id: 'v32', productId: 'p_fsh_32', productName: 'بنطلون جينز أطفال - أسود / 40 (أولادي - مصري)', color: 'أسود', size: '40', gender: 'أولادي (أطفال)', origin: 'مصري (Egypt)', sku: 'KID-BLK-40', barcode: '622100030022', stock: 22, price: 280, costPrice: 150 }
      ]
    };

    const items = [sample1, sample2, sample3];
    items.forEach(item => MaroSyncEngine.saveDocument(FASHION_COLLECTION, item));
    return items;
  }

  private static seedMaintenanceSampleData(): MaintenanceTicket[] {
    const sample: MaintenanceTicket = {
      id: 'mnt_01',
      ticketNumber: 'TKT-2026-0042',
      customerName: 'طارق عبد المنعم',
      customerPhone: '01012345678',
      deviceType: 'هاتف ذكي',
      deviceBrand: 'Apple iPhone',
      deviceModel: 'iPhone 15 Pro Max',
      serialNumberOrIMEI: '358942110987654',
      reportedProblem: 'كسر في الشاشة وتوقف الشحن اللاسلكي',
      inspectionNotes: 'تم فحص اللوحة الأم سليمة، تحتاج شاشة OLED أصلية ومنفذ شحن',
      costEstimate: 1200,
      finalCost: 1150,
      technicianName: 'م. حسام الدين',
      status: 'IN_PROGRESS',
      warrantyMonths: 6,
      receivedDate: new Date(Date.now() - 86400000).toISOString(),
      promisedDate: new Date(Date.now() + 86400000).toISOString(),
      sparePartsUsed: [
        { partId: 'sp_1', partName: 'شاشة iPhone 15 Pro Max OLED', quantity: 1, unitPrice: 900 },
        { partId: 'sp_2', partName: 'شريط فليكس الشحن والميكروفون', quantity: 1, unitPrice: 250 }
      ]
    };
    MaroSyncEngine.saveDocument(MAINTENANCE_COLLECTION, sample);
    return [sample];
  }

  private static seedRestaurantSampleData(): RestaurantTable[] {
    const tables: RestaurantTable[] = [
      { id: 'tbl_1', tableNumber: 'T-01', zone: 'الصالة الرئيسية', capacity: 4, status: 'OCCUPIED', currentOrderId: 'KOT-101', currentTotal: 340, openedAt: '14:20' },
      { id: 'tbl_2', tableNumber: 'T-02', zone: 'الصالة الرئيسية', capacity: 2, status: 'AVAILABLE' },
      { id: 'tbl_3', tableNumber: 'T-03', zone: 'العائلات', capacity: 6, status: 'RESERVED' },
      { id: 'tbl_4', tableNumber: 'T-04', zone: 'العائلات', capacity: 8, status: 'OCCUPIED', currentOrderId: 'KOT-102', currentTotal: 780, openedAt: '13:45' },
      { id: 'tbl_5', tableNumber: 'T-05', zone: 'التراس الخارجي', capacity: 4, status: 'AVAILABLE' },
      { id: 'tbl_6', tableNumber: 'VIP-1', zone: 'VIP', capacity: 10, status: 'AVAILABLE' }
    ];
    tables.forEach(t => MaroSyncEngine.saveDocument(RESTAURANT_TABLES_COLLECTION, t));
    return tables;
  }

  private static seedPharmacySampleData(): PharmacyDrug[] {
    const drugs: PharmacyDrug[] = [
      {
        id: 'drg_1',
        barcode: '622400400404',
        sku: 'PH-PAN-EXT-24',
        tradeName: 'بنادول إكسترا أقراص مسكن سريع للصداع والآلام 24 قرص',
        tradeNameEn: 'Panadol Extra 24 Tablets (GSK)',
        activeIngredient: 'Paracetamol 500mg + Caffeine 65mg',
        activeIngredientAr: 'باراسيتامول 500 مجم + كافيين 65 مجم',
        concentration: '500mg / 65mg',
        manufacturer: 'GSK Consumer Healthcare',
        dosage: 'قرص إلى قرصين كل 6-8 ساعات بعد الأكل (حد أقصى 8 أقراص يومياً)',
        pharmaceuticalForm: 'أقراص',
        prescriptionRequired: false,
        isScheduleDrug: false,
        isRefrigerated: false,
        therapeuticClass: 'مسكنات وخافضات حرارة (Analgesic & Antipyretic)',
        clinicalIndications: 'تسكين آلام الصداع النصفي، آلام الأسنان، المفاصل، العضلات، والتهاب الحلق وخفض الحرارة.',
        contraindications: 'يحذر لمرضى الفشل الكبدي، الحساسية للباراسيتامول، الحذر مع مرضى ارتفاع ضغط الدم الشديد بسبب الكافيين.',
        pregnancyCategory: 'B',
        shelfLocationSummary: 'ممر A - خزانة المسكنات C-04 - رف 3 - درج 12',
        shelfLocationDetails: {
          zone: 'الممر A - الصالة الرئيسية لصيدلية التجزئة',
          cabinet: 'خزانة المسكنات ومضادات الالتهاب C-04',
          shelfNumber: 'الرف رقم 3 (المستوى المتوسط)',
          drawerOrSlot: 'درج رقم 12 (خانة B)',
          storageType: 'درجة حرارة الغرفة (15°-25°C)',
          fullDisplayPath: 'صيدلية رئيسية > ممر A > كابينة C-04 > رف 3 > درج 12'
        },
        batches: [
          {
            id: 'b_pan_1',
            batchNumber: 'LOT-2026-NOV-81',
            expiryDate: '2026-11-30',
            productionDate: '2024-11-01',
            quantity: 15,
            stripsQuantity: 30,
            costPrice: 38,
            supplierName: 'الشركة المتحدة للصيادلة (UCP)',
            isNearExpiry: true,
            isRecommendedFEFO: true,
            notes: '⚠️ تشغيلة مقربة على الانتهاء (متبقي أقل من 4 أشهر) - اسحب هذه التشغيلة أولاً للعملاء'
          },
          {
            id: 'b_pan_2',
            batchNumber: 'LOT-2028-MAY-14',
            expiryDate: '2028-05-15',
            productionDate: '2025-05-01',
            quantity: 50,
            stripsQuantity: 100,
            costPrice: 42,
            supplierName: 'ابن سينا فارما (Ibnsina)',
            isNearExpiry: false,
            isRecommendedFEFO: false,
            notes: 'تشغيلة حديثة الإنتاج - صلاحية ممتازة (احتفظ بها على الرف الخلفي)'
          }
        ],
        genericAlternatives: ['أدول إكسترا 24 قرص', 'بارامول بلس أقراص', 'سيتامول إكسترا كبسولات'],
        detailedAlternatives: [
          {
            id: 'alt_pan_1',
            tradeName: 'أدول إكسترا 24 قرص (Adol Extra Tablets)',
            tradeNameEn: 'Adol Extra Tablets 24s',
            activeIngredient: 'Paracetamol 500mg + Caffeine 65mg',
            concentration: '500mg / 65mg',
            manufacturer: 'Julphar (جلفار للصناعات الدوائية)',
            fixedPrice: 38,
            stock: 40,
            shelfLocation: 'خزانة C-04 - رف 3 - درج 15',
            pharmaceuticalForm: 'أقراص',
            isDirectGeneric: true,
            priceDifference: -7,
            priceDifferencePercentage: -15.5,
            badgeText: 'بديل متطابق 100% وأوفر بـ 15%'
          },
          {
            id: 'alt_pan_2',
            tradeName: 'بارامول بلس 20 قرص (Paramol Plus)',
            tradeNameEn: 'Paramol Plus Tablets',
            activeIngredient: 'Paracetamol 500mg + Caffeine 65mg',
            concentration: '500mg / 65mg',
            manufacturer: 'Misr Pharma (مصر للمستحضرات الطبية)',
            fixedPrice: 30,
            stock: 25,
            shelfLocation: 'خزانة C-04 - رف 3 - درج 18',
            pharmaceuticalForm: 'أقراص',
            isDirectGeneric: true,
            priceDifference: -15,
            priceDifferencePercentage: -33.3,
            badgeText: 'بديل محلي ممتاز وأوفر بـ 33%'
          },
          {
            id: 'alt_pan_3',
            tradeName: 'سيتامول إكسترا 20 كبسولة (Cetamol Extra)',
            tradeNameEn: 'Cetamol Extra Capsules',
            activeIngredient: 'Paracetamol 500mg + Caffeine 65mg',
            concentration: '500mg / 65mg',
            manufacturer: 'Kahira Pharma (القاهرة للأدوية)',
            fixedPrice: 34,
            stock: 18,
            shelfLocation: 'خزانة C-04 - رف 3 - درج 19',
            pharmaceuticalForm: 'كبسولات',
            isDirectGeneric: true,
            priceDifference: -11,
            priceDifferencePercentage: -24.4,
            badgeText: 'كبسولات سهلة البلع وأوفر بـ 24%'
          }
        ],
        mohCode: 'MOH-EGY-49281-2024',
        fixedPrice: 45,
        stock: 65,
        stripsPerPack: 2,
        pricePerStrip: 22.5,
        stripStock: 3,
        minStockAlert: 15,
        expiryDate: '2026-11-30',
        notes: 'الأكثر مبيعاً في الصيدلية - معدل دوران سريع'
      },
      {
        id: 'drg_2',
        barcode: '622150080020',
        sku: 'PH-AUG-1G-14',
        tradeName: 'أوجمنتين 1جم 14 قرص مضاد حيوي واسع المجال',
        tradeNameEn: 'Augmentin 1g Tablets 14s (GSK)',
        activeIngredient: 'Amoxicillin 875mg + Clavulanic acid 125mg',
        activeIngredientAr: 'أموكسيسيلين 875 مجم + حمض الكلافولانيك 125 مجم',
        concentration: '1g (875/125mg)',
        manufacturer: 'GlaxoSmithKline (GSK)',
        dosage: 'قرص واحد كل 12 ساعة في بداية الوجبة لمدة 7 إلى 10 أيام حسب إرشادات الطبيب',
        pharmaceuticalForm: 'أقراص',
        prescriptionRequired: true,
        isScheduleDrug: false,
        isRefrigerated: false,
        therapeuticClass: 'مضادات حيوية بنسلينية (Penicillin Antibacterial)',
        clinicalIndications: 'علاج التهابات الجهاز التنفسي العلوي والسفلي، التهاب الجيوب الأنفية، التهاب الأذن الوسطى، والتهابات المسالك والجلد.',
        contraindications: 'الحساسية للبنسلين ومشتقات البيتالاكتام، تاريخ يرقان أو خلل كبدي مصاحب للأوجمنتين.',
        pregnancyCategory: 'B',
        shelfLocationSummary: 'ممر B - خزانة المضادات الحيوية B-02 - رف 2 - درج 04',
        shelfLocationDetails: {
          zone: 'الممر B - قسم المضادات الحيوية والوصفات الطبية (Rx)',
          cabinet: 'خزانة المضادات الحيوية والبيتالاكتام B-02',
          shelfNumber: 'الرف الثاني (المستوى العلوي)',
          drawerOrSlot: 'درج رقم 04',
          storageType: 'مكان جاف ومظلم',
          fullDisplayPath: 'صيدلية رئيسية > ممر B > كابينة B-02 > رف 2 > درج 04'
        },
        batches: [
          {
            id: 'b_aug_1',
            batchNumber: 'LOT-2026-OCT-19',
            expiryDate: '2026-10-31',
            productionDate: '2024-10-01',
            quantity: 6,
            stripsQuantity: 12,
            costPrice: 82,
            supplierName: 'الشركة المتحدة للصيادلة (UCP)',
            isNearExpiry: true,
            isRecommendedFEFO: true,
            notes: '⚠️ تشغيلة مقربة على الانتهاء (متبقي 3 أشهر) - اسحب هذه التشغيلة أولاً'
          },
          {
            id: 'b_aug_2',
            batchNumber: 'LOT-2027-DEC-05',
            expiryDate: '2027-12-15',
            productionDate: '2025-06-01',
            quantity: 18,
            stripsQuantity: 36,
            costPrice: 85,
            supplierName: 'فارما أوفرسيز (Pharma Overseas)',
            isNearExpiry: false,
            isRecommendedFEFO: false,
            notes: 'تشغيلة آمنة حتى نهاية 2027'
          }
        ],
        genericAlternatives: ['هاي بيوتك 1جم 16 قرص', 'ميجاموكس 1جم أقراص', 'كيورام 1جم أقراص'],
        detailedAlternatives: [
          {
            id: 'alt_aug_1',
            tradeName: 'هاي بيوتك 1جم 16 قرص (Hibiotic 1g Tablets)',
            tradeNameEn: 'Hibiotic 1g 16 Tablets (Amoun)',
            activeIngredient: 'Amoxicillin 875mg + Clavulanic acid 125mg',
            concentration: '1g (875/125mg)',
            manufacturer: 'Amoun Pharmaceutical Co. (آمون)',
            fixedPrice: 85,
            stock: 55,
            shelfLocation: 'خزانة B-02 - رف 2 - درج 08',
            pharmaceuticalForm: 'أقراص',
            isDirectGeneric: true,
            priceDifference: -14,
            priceDifferencePercentage: -14.1,
            badgeText: 'البديل الأكثر مبيعاً 16 قرص وأوفر بـ 14%'
          },
          {
            id: 'alt_aug_2',
            tradeName: 'ميجاموكس 1جم 14 قرص (Megamox 1g)',
            tradeNameEn: 'Megamox 1g Tablets',
            activeIngredient: 'Amoxicillin 875mg + Clavulanic acid 125mg',
            concentration: '1g (875/125mg)',
            manufacturer: 'Hikma Pharmaceuticals (حكمة للأدوية)',
            fixedPrice: 80,
            stock: 30,
            shelfLocation: 'خزانة B-02 - رف 2 - درج 10',
            pharmaceuticalForm: 'أقراص',
            isDirectGeneric: true,
            priceDifference: -19,
            priceDifferencePercentage: -19.2,
            badgeText: 'بديل عالي الجودة وأوفر بـ 19%'
          },
          {
            id: 'alt_aug_3',
            tradeName: 'كيورام 1جم 14 قرص (Curam 1g)',
            tradeNameEn: 'Curam 1g Tablets (Sandoz)',
            activeIngredient: 'Amoxicillin 875mg + Clavulanic acid 125mg',
            concentration: '1g (875/125mg)',
            manufacturer: 'Sandoz Novartis Group (ساندوز)',
            fixedPrice: 90,
            stock: 22,
            shelfLocation: 'خزانة B-02 - رف 2 - درج 12',
            pharmaceuticalForm: 'أقراص',
            isDirectGeneric: true,
            priceDifference: -9,
            priceDifferencePercentage: -9.1,
            badgeText: 'صناعة سويسرية معتمدة'
          }
        ],
        mohCode: 'MOH-EGY-12890-2023',
        fixedPrice: 99,
        stock: 24,
        stripsPerPack: 2,
        pricePerStrip: 49.5,
        stripStock: 1,
        minStockAlert: 10,
        expiryDate: '2026-10-31',
        notes: 'صنف أساسي في الروشتات الطبية'
      },
      {
        id: 'drg_3',
        barcode: '622110055030',
        sku: 'PH-CAT-50-20',
        tradeName: 'كتافلام 50مجم 20 قرص مسكن سريع ومضاد للالتهاب',
        tradeNameEn: 'Cataflam 50mg Tablets 20s (Novartis)',
        activeIngredient: 'Diclofenac Potassium 50mg',
        activeIngredientAr: 'ديكلوفيناك بوتاسيوم 50 مجم',
        concentration: '50mg',
        manufacturer: 'Novartis Pharma (نوفارتس العالمية)',
        dosage: 'قرص واحد 2 إلى 3 مرات يومياً بعد الوجبات مع كوب ماء وفير',
        pharmaceuticalForm: 'أقراص',
        prescriptionRequired: false,
        isScheduleDrug: false,
        isRefrigerated: false,
        therapeuticClass: 'مضادات الالتهاب غير الستيرويدية (NSAID)',
        clinicalIndications: 'تسكين سريع لآلام الأسنان الحادة، آلام الطمث، المغص الكلوي، ونوبات النقرس وآلام العمود الفقري.',
        contraindications: 'قرحة المعدة النشطة، نزيف الجهاز الهضمي، قصور القلب الشديد، والثلث الأخير من الحمل.',
        pregnancyCategory: 'D',
        shelfLocationSummary: 'ممر A - خزانة المسكنات C-02 - رف 1 - درج 03',
        shelfLocationDetails: {
          zone: 'الممر A - صيدلية التجزئة',
          cabinet: 'خزانة المسكنات ومضادات الروماتيزم C-02',
          shelfNumber: 'الرف الأول (السفلي)',
          drawerOrSlot: 'درج رقم 03',
          storageType: 'درجة حرارة الغرفة (15°-25°C)',
          fullDisplayPath: 'صيدلية رئيسية > ممر A > كابينة C-02 > رف 1 > درج 03'
        },
        batches: [],
        genericAlternatives: ['ديكلوفين 50مجم أقراص', 'فولتارين 50مجم أقراص', 'أوفلام 50مجم أقراص'],
        detailedAlternatives: [
          {
            id: 'alt_cat_1',
            tradeName: 'ديكلوفين 50مجم 20 قرص (Declophen 50mg)',
            tradeNameEn: 'Declophen 50mg Tablets (Pharco)',
            activeIngredient: 'Diclofenac Potassium 50mg',
            concentration: '50mg',
            manufacturer: 'Pharco Pharmaceuticals (فاركو للأدوية)',
            fixedPrice: 28,
            stock: 45,
            shelfLocation: 'خزانة C-02 - رف 1 - درج 06',
            pharmaceuticalForm: 'أقراص',
            isDirectGeneric: true,
            priceDifference: -27,
            priceDifferencePercentage: -49.1,
            badgeText: 'متوفر فوراً بالصيدلية كبديل مباشر وأوفر بـ 49%'
          },
          {
            id: 'alt_cat_2',
            tradeName: 'فولتارين 50مجم 20 قرص (Voltaren 50mg)',
            tradeNameEn: 'Voltaren 50mg Tablets (Novartis)',
            activeIngredient: 'Diclofenac Sodium 50mg',
            concentration: '50mg',
            manufacturer: 'Novartis Pharma (نوفارتس)',
            fixedPrice: 42,
            stock: 30,
            shelfLocation: 'خزانة C-02 - رف 1 - درج 09',
            pharmaceuticalForm: 'أقراص',
            isDirectGeneric: true,
            priceDifference: -13,
            priceDifferencePercentage: -23.6,
            badgeText: 'متوفر فوراً بالصيدلية (صوديوم طويل المفعول)'
          },
          {
            id: 'alt_cat_3',
            tradeName: 'أوفلام 50مجم 20 قرص (Oflam 50mg)',
            tradeNameEn: 'Oflam 50mg Tablets',
            activeIngredient: 'Diclofenac Potassium 50mg',
            concentration: '50mg',
            manufacturer: 'Eva Pharma (إيفا فارما)',
            fixedPrice: 26,
            stock: 18,
            shelfLocation: 'خزانة C-02 - رف 1 - درج 11',
            pharmaceuticalForm: 'أقراص',
            isDirectGeneric: true,
            priceDifference: -29,
            priceDifferencePercentage: -52.7,
            badgeText: 'متوفر بالصيدلية وأوفر بـ 52%'
          }
        ],
        mohCode: 'MOH-EGY-78190-2022',
        fixedPrice: 55,
        stock: 0, // 0 Stock to demonstrate the Out-of-Stock scenario perfectly!
        stripsPerPack: 2,
        pricePerStrip: 27.5,
        stripStock: 0,
        minStockAlert: 20,
        expiryDate: '2026-08-15',
        notes: '🚨 صنف نافذ من المخزن حالياً - تم تفعيل اقتراح البدائل الجاهزة تلقائياً'
      },
      {
        id: 'drg_4',
        barcode: '622170099040',
        sku: 'PH-LNT-SOLO-05',
        tradeName: 'لانتوس سولوستار 100 وحدة/مل قلم إنسولين طويل المفعول',
        tradeNameEn: 'Lantus SoloStar 100 U/ml Insulin Glargine Pen (Sanofi)',
        activeIngredient: 'Insulin Glargine 100 units/ml',
        activeIngredientAr: 'إنسولين جلارجين 100 وحدة دولية / مل',
        concentration: '100 IU / ml (3ml Pen)',
        manufacturer: 'Sanofi Aventis (سانوفي أفينتس)',
        dosage: 'حقن تحت الجلد مرة واحدة يومياً في نفس الموعد حسب الجرعة المحددة من طبيب الغدد والسكر',
        pharmaceuticalForm: 'حقن',
        prescriptionRequired: true,
        isScheduleDrug: false,
        isRefrigerated: true,
        therapeuticClass: 'أدوية علاج السكري - إنسولين ممتد المفعول (Long-Acting Insulin)',
        clinicalIndications: 'السيطرة على مستوى السكر في الدم لمرضى السكري من النوع الأول والنوع الثاني للبالغين والأطفال فوق 6 سنوات.',
        contraindications: 'نوبات هبوط السكر الحادة (Hypoglycemia)، الحساسية للإنسولين جلارجين أو أي من مكونات المستحضر.',
        pregnancyCategory: 'B',
        shelfLocationSummary: 'ثلاجة الأدوية الرئيسية R-01 - رف الأنسولين الأوسط - خانة 03',
        shelfLocationDetails: {
          zone: 'غرفة التبريد وحفظ الأدوية الحساسة',
          cabinet: 'ثلاجة الأدوية والمصل الطبية الذكية R-01',
          shelfNumber: 'الرف الأوسط المبرد',
          drawerOrSlot: 'خانة أقلام الأنسولين رقم 03',
          storageType: 'ثلاجة الأدوية والمصل (2°-8°C)',
          fullDisplayPath: 'صيدلية رئيسية > غرفة التبريد > ثلاجة R-01 > رف أوسط > خانة 03'
        },
        batches: [
          {
            id: 'b_lnt_1',
            batchNumber: 'LOT-2026-SEP-12',
            expiryDate: '2026-09-30',
            productionDate: '2024-09-01',
            quantity: 8,
            costPrice: 460,
            supplierName: 'الشركة المتحدة للصيادلة (UCP)',
            isNearExpiry: true,
            isRecommendedFEFO: true,
            notes: '⚠️ تشغيلة قريبة على الانتهاء (متبقي أقل من شهرين) - اسحب هذه الأقلام أولاً للعملاء'
          },
          {
            id: 'b_lnt_2',
            batchNumber: 'LOT-2027-AUG-20',
            expiryDate: '2027-08-31',
            productionDate: '2025-08-01',
            quantity: 25,
            costPrice: 475,
            supplierName: 'سانوفي مصر للتوزيع',
            isNearExpiry: false,
            isRecommendedFEFO: false,
            notes: 'تشغيلة مبردة حديثة - صالحة حتى أغسطس 2027'
          }
        ],
        genericAlternatives: ['باساجلار كويك بن قلم إنسولين 100 وحدة', 'توجيو سولوستار 300 وحدة/مل'],
        detailedAlternatives: [
          {
            id: 'alt_lnt_1',
            tradeName: 'باساجلار كويك بن 100 وحدة/مل (Basaglar KwikPen)',
            tradeNameEn: 'Basaglar KwikPen 100 IU/ml (Eli Lilly)',
            activeIngredient: 'Insulin Glargine 100 units/ml',
            concentration: '100 IU / ml',
            manufacturer: 'Eli Lilly & Boehringer Ingelheim',
            fixedPrice: 490,
            stock: 15,
            shelfLocation: 'ثلاجة R-01 - رف الأنسولين - خانة 05',
            pharmaceuticalForm: 'حقن',
            isDirectGeneric: true,
            priceDifference: -60,
            priceDifferencePercentage: -10.9,
            badgeText: 'بديل حيوي مطابق ومبرد بالثلاجة وأوفر بـ 11%'
          },
          {
            id: 'alt_lnt_2',
            tradeName: 'توجيو سولوستار 300 وحدة/مل (Toujeo SoloStar)',
            tradeNameEn: 'Toujeo SoloStar 300 IU/ml (Sanofi)',
            activeIngredient: 'Insulin Glargine 300 units/ml',
            concentration: '300 IU / ml',
            manufacturer: 'Sanofi (سانوفي)',
            fixedPrice: 620,
            stock: 20,
            shelfLocation: 'ثلاجة R-01 - رف الأنسولين - خانة 08',
            pharmaceuticalForm: 'حقن',
            isDirectGeneric: false,
            priceDifference: 70,
            priceDifferencePercentage: 12.7,
            badgeText: 'تركيز مكثف يدوم أكثر من 24 ساعة'
          }
        ],
        mohCode: 'MOH-EGY-90342-2023',
        fixedPrice: 550,
        stock: 33,
        minStockAlert: 10,
        expiryDate: '2026-09-30',
        notes: 'يجب حفظه في الثلاجة (2°-8°C) وعدم التجميد مطلقاً'
      },
      {
        id: 'drg_5',
        barcode: '622190033050',
        sku: 'PH-CON-5-30',
        tradeName: 'كونكور 5مجم 30 قرص لعلاج ضغط الدم والقلب',
        tradeNameEn: 'Concor 5mg Tablets 30s (Merck KGaA)',
        activeIngredient: 'Bisoprolol Fumarate 5mg',
        activeIngredientAr: 'بيسوبرولول فيومارات 5 مجم',
        concentration: '5mg',
        manufacturer: 'Merck Healthcare (ميرك الألمانية)',
        dosage: 'قرص واحد يومياً صباحاً قبل أو مع وجبة الإفطار',
        pharmaceuticalForm: 'أقراص',
        prescriptionRequired: true,
        isScheduleDrug: false,
        isRefrigerated: false,
        therapeuticClass: 'حاصرات بيتا القلبية (Beta Blockers)',
        clinicalIndications: 'علاج ارتفاع ضغط الدم، الذبحة الصدرية المزمنة، والقصور القلبي المستقر.',
        contraindications: 'بطء ضربات القلب الشديد (< 50 نبضة)، الصدمة القلبية، والربو القصبي الحاد.',
        pregnancyCategory: 'C',
        shelfLocationSummary: 'ممر C - خزانة أدوية القلب والضغط D-01 - رف 4 - درج 02',
        shelfLocationDetails: {
          zone: 'الممر C - أدوية الأمراض المزمنة والقلب',
          cabinet: 'خزانة أدوية القلب والأوعية الدموية D-01',
          shelfNumber: 'الرف الرابع (المستوى العلوي)',
          drawerOrSlot: 'درج رقم 02',
          storageType: 'درجة حرارة الغرفة (15°-25°C)',
          fullDisplayPath: 'صيدلية رئيسية > ممر C > كابينة D-01 > رف 4 > درج 02'
        },
        batches: [
          {
            id: 'b_con_1',
            batchNumber: 'LOT-2026-DEC-01',
            expiryDate: '2026-12-31',
            productionDate: '2024-12-01',
            quantity: 20,
            stripsQuantity: 60,
            costPrice: 48,
            supplierName: 'ابن سينا فارما',
            isNearExpiry: true,
            isRecommendedFEFO: true,
            notes: '⚠️ تشغيلة ديسمبر 2026 - اسحب هذه التشغيلة أولاً'
          },
          {
            id: 'b_con_2',
            batchNumber: 'LOT-2028-JUN-15',
            expiryDate: '2028-06-30',
            productionDate: '2025-06-01',
            quantity: 55,
            stripsQuantity: 165,
            costPrice: 50,
            supplierName: 'فارما أوفرسيز',
            isNearExpiry: false,
            isRecommendedFEFO: false,
            notes: 'تشغيلة صالحة حتى منتصف 2028'
          }
        ],
        genericAlternatives: ['بيسوكارد 5مجم 30 قرص', 'كونكور بلس 5/12.5 مجم'],
        detailedAlternatives: [
          {
            id: 'alt_con_1',
            tradeName: 'بيسوكارد 5مجم 30 قرص (Bisocard 5mg)',
            tradeNameEn: 'Bisocard 5mg Tablets (Global Napi)',
            activeIngredient: 'Bisoprolol Fumarate 5mg',
            concentration: '5mg',
            manufacturer: 'Global Napi Pharmaceuticals',
            fixedPrice: 38,
            stock: 60,
            shelfLocation: 'خزانة D-01 - رف 4 - درج 05',
            pharmaceuticalForm: 'أقراص',
            isDirectGeneric: true,
            priceDifference: -20,
            priceDifferencePercentage: -34.5,
            badgeText: 'بديل مباشر مطابق 100% وأوفر بـ 34%'
          }
        ],
        mohCode: 'MOH-EGY-33104-2023',
        fixedPrice: 58,
        stock: 75,
        stripsPerPack: 3,
        pricePerStrip: 19.33,
        stripStock: 4,
        minStockAlert: 15,
        expiryDate: '2026-12-31',
        notes: 'دواء ضغط مزمن مستمر لعملاء الصيدلية'
      }
    ];
    drugs.forEach(d => MaroSyncEngine.saveDocument(PHARMACY_COLLECTION, d));
    return drugs;
  }

  private static seedAutoPartsSampleData(): AutoPartFitment[] {
    const parts: AutoPartFitment[] = [
      {
        id: 'ap_1',
        partNumber: '04152-YZZA1',
        oemNumber: '04152-37010',
        partName: 'فلتر زيت محرك أصلي تويوتا / لكزس',
        category: 'فلاتر وسيور',
        compatibleVehicles: [
          { make: 'Toyota', model: 'Corolla', yearFrom: 2014, yearTo: 2024, engineSize: '1.6L / 1.8L' },
          { make: 'Toyota', model: 'Camry', yearFrom: 2012, yearTo: 2020, engineSize: '2.5L' },
          { make: 'Toyota', model: 'RAV4', yearFrom: 2013, yearTo: 2023, engineSize: '2.5L' }
        ],
        stock: 65,
        price: 180,
        costPrice: 120,
        shelfLocation: 'ممر B - رف 2 - خانة 08'
      },
      {
        id: 'ap_2',
        partNumber: '58101-1RA00',
        oemNumber: '58101-0UA00',
        partName: 'طقم تيل فرامل أمامي سيراميك هيونداي / كيا',
        category: 'مكابح وفرامل',
        compatibleVehicles: [
          { make: 'Hyundai', model: 'Elantra HD / MD', yearFrom: 2011, yearTo: 2022 },
          { make: 'Kia', model: 'Cerato', yearFrom: 2012, yearTo: 2021 }
        ],
        stock: 30,
        price: 450,
        costPrice: 310,
        shelfLocation: 'ممر D - رف 1 - خانة 14'
      }
    ];
    parts.forEach(p => MaroSyncEngine.saveDocument(AUTO_PARTS_COLLECTION, p));
    return parts;
  }
}
