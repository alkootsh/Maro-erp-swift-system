// MARO ERP - Vertical Industry Modules Type Definitions
// Master Enterprise Modular Protocol v4.0

export type IndustryModuleId = 
  | 'FOOD_SUPERMARKET'
  | 'FASHION_FOOTWEAR'
  | 'ELECTRONICS_MAINTENANCE'
  | 'RESTAURANT_CAFE'
  | 'PHARMACY_MEDICAL'
  | 'AUTO_SPARE_PARTS'
  | 'MANUFACTURING_MRP'
  | string;

export interface CustomFieldDefinition {
  id: string;
  name: string;
  nameAr: string;
  type: 'text' | 'number' | 'date' | 'boolean' | 'select' | 'matrix' | 'serial_list';
  options?: string[];
  required?: boolean;
  defaultValue?: any;
  placeholderAr?: string;
  helpTextAr?: string;
}

export interface IndustryModule {
  id: IndustryModuleId;
  code: string;
  nameAr: string;
  nameEn: string;
  category: 'RETAIL' | 'SERVICES' | 'HEALTHCARE' | 'FOOD_BEVERAGE' | 'INDUSTRIAL' | 'AUTOMOTIVE' | 'DISTRIBUTION' | 'LOGISTICS' | 'CUSTOM';
  descriptionAr: string;
  iconName: string;
  badgeColor: string;
  isActive: boolean;
  isCoreBackbone: boolean;
  version: string;
  routePath?: string;
  customProductFields: CustomFieldDefinition[];
  specializedFeatures: {
    id: string;
    nameAr: string;
    descriptionAr: string;
    enabled: boolean;
  }[];
  specializedReports: {
    id: string;
    nameAr: string;
    descriptionAr: string;
  }[];
  accountingMapping: {
    salesRevenueAccount: string;
    cogsAccount: string;
    inventoryAssetAccount: string;
    serviceRevenueAccount?: string;
  };
  createdAt: string;
  updatedAt: string;
}

// -------------------------------------------------------------
// Module 1: Fashion & Footwear Matrix
// -------------------------------------------------------------
export type FashionGenderCategory = 
  | 'حريمي (نساء)' 
  | 'رجالي' 
  | 'بناتي' 
  | 'أولادي (أطفال)' 
  | 'مواليد وبيبي' 
  | 'للجنسين (Unisex)';

export type FashionSeason = 
  | 'شتوي 2026' 
  | 'صيفي 2026' 
  | 'خريفي 2026' 
  | 'ربيعي 2026' 
  | 'طوال العام / كلاسيك';

export type FashionOrigin = 
  | 'صيني (China)' 
  | 'تركي (Turkey)' 
  | 'مصري (Egypt)' 
  | 'إيطالي (Italy)' 
  | 'فيتنامي (Vietnam)' 
  | 'بنجلاديش (Bangladesh)' 
  | 'هندي (India)' 
  | 'مستورد عام';

export interface FashionVariant {
  id: string;
  productId: string;
  productName: string;
  color: string;
  size: string;
  gender?: FashionGenderCategory;
  origin?: FashionOrigin;
  sku: string;
  barcode: string;
  stock: number;
  price: number;
  costPrice: number;
}

export interface FashionMatrixItem {
  id: string;
  modelCode: string;
  modelName: string;
  brand: string;
  gender: FashionGenderCategory;
  season: FashionSeason;
  origin: FashionOrigin;
  material?: string;
  colors: string[];
  sizes: string[];
  basePrice: number;
  costPrice: number;
  variants: FashionVariant[];
}

// -------------------------------------------------------------
// Module 1.5: Food & Supermarket Multi-Unit & Scale Barcode
// -------------------------------------------------------------
export type FoodUnitType = 'كرتونة' | 'علبة' | 'قطعة' | 'دستة' | 'كيلوجرام' | 'جرام' | 'شيكارة' | 'طرد' | 'لتر';

export interface ProductUnitConversion {
  id: string;
  unitName: FoodUnitType;
  factor: number; // Factor relative to base unit (e.g., كرتونة = 24 قطعة -> factor = 24, قطعة = 1 -> factor = 1)
  barcode: string; // Distinct barcode for this specific unit
  costPrice: number;
  wholesalePrice: number;
  retailPrice: number;
  isBaseUnit: boolean; // Base unit e.g. قطعة
  isDefaultSalesUnit?: boolean;
}

export interface FoodSupermarketProduct {
  id: string;
  code: string;
  nameAr: string;
  nameEn?: string;
  department: 'بقالة جافة ومعلبات' | 'ألبان وأجبان' | 'لحوم ودواجن طازجة' | 'خضروات وفواكه' | 'مخبوزات وحلويات' | 'منظفات وعناية منزلية' | 'مشروبات ومياه';
  isWeighted: boolean; // Scale barcode product
  scaleItemCode?: string; // e.g. "00105" (5 digits for scale EAN-13)
  defaultPricePerKg?: number;
  baseUnit: FoodUnitType;
  units: ProductUnitConversion[];
  batchNumber?: string;
  expiryDate?: string;
  storageTemp?: 'عادي (درجة الغرفة)' | 'مبرد (2° إلى 5° م)' | 'مجمد (-18° م)';
  stockInBaseUnit: number;
  minStockAlert: number;
}

// -------------------------------------------------------------
// Module 2: Electronics & Maintenance Repair Tickets
// -------------------------------------------------------------
export interface MaintenanceTicket {
  id: string;
  ticketNumber: string;
  customerName: string;
  customerPhone: string;
  deviceType: 'هاتف ذكي' | 'كمبيوتر محمول' | 'شاشة تلفزيون' | 'جهاز كهربائي منزلي' | 'طابعة' | 'أخرى';
  deviceBrand: string;
  deviceModel: string;
  serialNumberOrIMEI: string;
  reportedProblem: string;
  inspectionNotes?: string;
  costEstimate: number;
  finalCost: number;
  technicianName: string;
  status: 'RECEIVED' | 'INSPECTION' | 'WAITING_PARTS' | 'IN_PROGRESS' | 'REPAIRED' | 'DELIVERED' | 'CANCELLED';
  warrantyMonths: number;
  receivedDate: string;
  promisedDate: string;
  completedDate?: string;
  sparePartsUsed: {
    partId: string;
    partName: string;
    quantity: number;
    unitPrice: number;
  }[];
}

// -------------------------------------------------------------
// Module 3: Restaurant & Cafe Table / KDS
// -------------------------------------------------------------
export interface RestaurantTable {
  id: string;
  tableNumber: string;
  zone: 'الصالة الرئيسية' | 'العائلات' | 'التراس الخارجي' | 'VIP';
  capacity: number;
  status: 'AVAILABLE' | 'OCCUPIED' | 'RESERVED' | 'BILL_PRINTED';
  currentOrderId?: string;
  currentTotal?: number;
  openedAt?: string;
}

export interface KitchenOrderTicket {
  id: string;
  kotNumber: string;
  orderType: 'DINE_IN' | 'TAKEAWAY' | 'DELIVERY';
  tableNumber?: string;
  waiterName?: string;
  items: {
    id: string;
    itemName: string;
    quantity: number;
    notes?: string;
    modifiers?: string[];
    status: 'PENDING' | 'COOKING' | 'READY' | 'SERVED';
  }[];
  createdAt: string;
  estimatedMinutes: number;
}

// -------------------------------------------------------------
// Module 4: Pharmacy & Medical Alternatives (FEFO, Shelf Guidance, Generics)
// -------------------------------------------------------------
export interface PharmacyDrugBatch {
  id: string;
  batchNumber: string;
  expiryDate: string;
  productionDate?: string;
  quantity: number;
  stripsQuantity?: number;
  costPrice?: number;
  supplierName?: string;
  shelfLocationOverride?: string;
  isNearExpiry?: boolean;
  isRecommendedFEFO?: boolean; // True if this batch should be picked first (earliest expiry)
  notes?: string;
}

export interface PharmacyShelfLocation {
  zone: string; // e.g. 'الصالة الرئيسية - صيدلية التجزئة'
  cabinet: string; // e.g. 'خزانة المسكنات ومضادات الالتهاب C-04'
  shelfNumber: string; // e.g. 'الرف الثالث (المستوى المتوسط)'
  drawerOrSlot?: string; // e.g. 'درج رقم 12 - خانة B'
  storageType: 'درجة حرارة الغرفة (15°-25°C)' | 'ثلاجة الأدوية والمصل (2°-8°C)' | 'مكان جاف ومظلم' | 'خزينة الأدوية المراقبة (جدول)';
  fullDisplayPath?: string;
}

export interface PharmacyAlternativeDrug {
  id: string;
  tradeName: string;
  tradeNameEn?: string;
  activeIngredient: string;
  concentration?: string;
  manufacturer: string;
  fixedPrice: number;
  stock: number;
  shelfLocation: string;
  pharmaceuticalForm: string;
  isDirectGeneric: boolean; // True if exact same active ingredient & strength
  priceDifference: number; // Difference in currency
  priceDifferencePercentage: number; // Positive = more expensive, Negative = cheaper
  badgeText?: string;
}

export interface PharmacyDrug {
  id: string;
  barcode?: string;
  sku?: string;
  tradeName: string;
  tradeNameEn?: string;
  activeIngredient: string;
  activeIngredientAr?: string;
  concentration?: string;
  manufacturer?: string;
  dosage: string;
  pharmaceuticalForm: 'أقراص' | 'شراب' | 'حقن' | 'مرهم' | 'كبسولات' | 'قطرة' | 'فوار' | 'تحاميل' | 'بخاخ' | 'محلول' | 'جل';
  prescriptionRequired: boolean;
  isScheduleDrug?: boolean; // أدوية الجدول والمخدرات
  isRefrigerated?: boolean; // أدوية الثلاجة 2-8 مئوية
  shelfLocationDetails?: PharmacyShelfLocation;
  shelfLocationSummary?: string; // e.g. 'خزانة C-04 - رف 3 - درج 12'
  batches: PharmacyDrugBatch[];
  genericAlternatives: string[];
  detailedAlternatives?: PharmacyAlternativeDrug[];
  therapeuticClass?: string;
  clinicalIndications?: string;
  contraindications?: string;
  pregnancyCategory?: 'A' | 'B' | 'C' | 'D' | 'X';
  mohCode: string;
  fixedPrice: number;
  stock: number;
  stripsPerPack?: number; // عدد الأشرطة داخل العلبة
  pricePerStrip?: number; // سعر بيع الشريط المفرد
  stripStock?: number; // رصيد الأشرطة المفتوحة
  minStockAlert?: number;
  expiryDate: string; // Earliest expiry date or primary
  notes?: string;
}

// -------------------------------------------------------------
// Module 5: Auto Spare Parts Fitment
// -------------------------------------------------------------
export interface AutoPartFitment {
  id: string;
  partNumber: string;
  oemNumber: string;
  partName: string;
  category: 'فلاتر وسيور' | 'مكابح وفرامل' | 'عفشة ومساعدين' | 'كهرباء وإشعال' | 'محرك وجيربوكس' | 'إطارات وبطاريات';
  compatibleVehicles: {
    make: string;
    model: string;
    yearFrom: number;
    yearTo: number;
    engineSize?: string;
  }[];
  stock: number;
  price: number;
  costPrice: number;
  shelfLocation: string;
}

// -------------------------------------------------------------
// Module 6: Automotive Dealership & Showrooms (معارض وتجارة السيارات)
// -------------------------------------------------------------
export interface VehicleShowroomItem {
  id: string;
  vin: string; // رقم الشاسيه VIN
  engineNumber: string; // رقم الموتور
  make: string; // الشركة المصنعة (تويوتا، مرسيدس، هيونداي...)
  model: string; // الموديل (كورولا، إلنترا...)
  year: number; // سنة الصنع
  color: string; // اللون الخارجي
  interiorColor?: string; // اللون الداخلي
  transmission: 'أوتوماتيك' | 'مانيوال' | 'CVT' | 'كهربائي بالكامل' | 'هايبرد';
  fuelType: 'بنزين 95' | 'بنزين 92' | 'ديزل' | 'كهرباء' | 'هايبرد';
  mileageKm: number; // قراءة العداد
  condition: 'جديد (زيرو)' | 'مستعمل كسر زيرو' | 'مستعمل بحالة ممتازة' | 'وارد خليجي' | 'وارد أوروبا';
  customsStatus: 'خالص الجمارك والضريبة' | 'منطقة حرة' | 'مبادرة سيارات المغتربين' | 'ذوي الهمم';
  costPrice: number;
  salePrice: number;
  minPrice: number;
  status: 'AVAILABLE' | 'RESERVED' | 'SOLD' | 'UNDER_INSPECTION';
  plateNumber?: string;
  locationBay?: string; // موقعها بالمعرض
  features: string[]; // كماليات (فتحة سقف، بصمة، شاشة، كاميرات 360...)
  inspectionReport?: {
    paintCondition: string;
    engineHealthPercent: number;
    tiresCondition: string;
    notes: string;
  };
}

export interface VehicleInstallmentPlan {
  id: string;
  vehicleId: string;
  customerName: string;
  customerPhone: string;
  nationalId: string;
  totalVehiclePrice: number;
  downPayment: number; // المقدم
  remainingAmount: number; // المبلغ المتبقي
  annualInterestRate: number; // الفائدة السنوية %
  monthsCount: number; // عدد الشهور
  monthlyInstallment: number; // القسط الشهري
  startDate: string;
  installmentsSchedule: {
    installmentNo: number;
    dueDate: string;
    amount: number;
    status: 'PAID' | 'PENDING' | 'OVERDUE';
    paidDate?: string;
    penalty: number;
  }[];
}

// -------------------------------------------------------------
// Module 7: Agri-Export Stations & Cold Storage (محطات تصدير الخضار والفواكه وثلاجات التبريد)
// -------------------------------------------------------------
export interface ColdStorageChamber {
  id: string;
  chamberNumber: string; // عنبر رقم
  name: string;
  capacityTons: number; // السعة بالأطنان
  currentLoadTons: number;
  temperatureCelsius: number; // درجة الحرارة الحالية
  targetTemperature: number;
  humidityPercent: number; // نسبة الرطوبة
  coolingType: 'تبريد عادي (Chiller 0-4°C)' | 'تجميد سريع (Blast Freezer -30°C)' | 'تخزين مجمد (-18°C)' | 'جو محكوم (CA Controlled Atmosphere)';
  status: 'OPTIMAL' | 'WARNING_TEMP' | 'EMPTY' | 'MAINTENANCE';
  storedLots: {
    lotCode: string;
    productType: 'موالح برتقال' | 'فراولة طازجة' | 'عنب تصدير' | 'رمان' | 'بصل وثوم' | 'بطاطس تصدير' | 'مانجو' | 'خضار مشكل';
    palletsCount: number;
    weightTons: number;
    farmerOrSupplier: string;
    entryDate: string;
    expiryDate: string;
  }[];
}

export interface AgriExportShipment {
  id: string;
  shipmentNumber: string; // كود الشحنة
  destinationCountry: string; // دولة التصدير (روسيا، هولندا، إنجلترا، السعودية، الإمارات...)
  importerName: string; // العميل المستورد
  shippingLine: string; // الخط الملاحي
  containerNumber: string; // رقم الحاوية المبردة (Reefer Container)
  productType: string;
  caliberGrade: string; // الحجم والعيار (Caliber e.g. 48/56/64/72/80)
  packagingType: 'كرتونة تلسكوبية 15 كجم' | 'أوبن توب 10 كجم' | 'بنتس 500 جم' | 'جامبو باج 1 طن';
  totalPallets: number;
  grossWeightKg: number;
  netWeightKg: number;
  departurePort: string; // ميناء الشحن
  phytosanitaryCertNumber: string; // الشهادة الزراعية والصحية
  status: 'PACKING' | 'COOLING' | 'INSPECTION' | 'LOADED' | 'DISPATCHED' | 'DELIVERED';
  invoiceValueUSD: number;
  invoiceValueLocal: number;
  exportDate: string;
}

// -------------------------------------------------------------
// Module 8: Car Wash & Auto Service Centers (مغاسل ومراكز صيانة السيارات)
// -------------------------------------------------------------
export interface ServiceBay {
  id: string;
  bayNumber: string;
  bayType: 'غسيل يدوي وكيماوي' | 'غسيل آلي نفق' | 'حفرة تغيير زيوت وفلاتر' | 'حارة نانو سيراميك وتلميع' | 'ميكانيكا وكهرباء سيارات';
  status: 'AVAILABLE' | 'BUSY' | 'CLEANING' | 'MAINTENANCE';
  currentJobCardNumber?: string;
  assignedWorkers: string[];
}

export interface CarWashJobCard {
  id: string;
  jobCardNumber: string;
  plateNumber: string;
  carMakeModel: string;
  carColor?: string;
  vehicleSize: 'سيدان صغيرة' | 'سيدان كبيرة / كروس أوفر' | 'SUV عائلية 7 راكب' | 'بيك آب / نقل';
  customerName: string;
  customerPhone: string;
  serviceType: 'غسيل سوبر خارجي وداخلي' | 'غسيل بخار ومحرك' | 'نانو سيراميك وتلميع' | 'تغيير زيت وفلتر' | 'فحص شامل 20 نقطة' | 'صيانة تكييف وفرامل';
  packageName?: string;
  bayId: string;
  assignedStaff: string[];
  totalPrice: number;
  discount: number;
  netPrice: number;
  paymentStatus: 'PAID' | 'UNPAID';
  paymentMethod: 'نقد' | 'شبكة / مدى' | 'اشتراك شهري / باقة';
  status: 'RECEIVED' | 'IN_WASH' | 'DETAILING' | 'READY_FOR_DELIVERY' | 'COMPLETED';
  receivedTime: string;
  completedTime?: string;
  partsOrMaterialsUsed?: {
    name: string;
    quantity: number;
    price: number;
  }[];
}

// -------------------------------------------------------------
// Module 9: Educational Centers & Training Academies (السناتر والمراكز التعليمية)
// -------------------------------------------------------------
export interface EducationalCourseGroup {
  id: string;
  courseName: string; // اسم المادة أو الكورس (فيزياء، لغات، برمجة، إدارة أعمال...)
  gradeLevel: string; // المرحلة (ثانوية عامة، جامعي، دبلومة مهنية...)
  instructorName: string; // المدرس / المحاضر
  instructorCommissionPercent: number; // نسبة المدرس %
  hallName: string; // القاعة (قاعة 1، مسرح السنتر...)
  capacity: number;
  scheduleDays: string; // مواعيد المحاضرات (السبت والثلاثاء 4:00 م)
  sessionPrice: number; // سعر الحصة الفردية
  monthlySubscriptionPrice: number; // الاشتراك الشهري
  enrolledStudentsCount: number;
  isActive: boolean;
}

export interface StudentEnrollment {
  id: string;
  studentCode: string;
  studentBarcode: string;
  studentName: string;
  studentPhone: string;
  parentPhone: string;
  groupId: string;
  groupName: string;
  subscriptionType: 'بالحصة' | 'اشتراك شهري' | 'باقة الترم كامل';
  balance: number; // رصيد الطالب أو المتبقي عليه
  attendanceSessions: {
    sessionDate: string;
    isPresent: boolean;
    paidAmount: number;
    notes?: string;
  }[];
}

// -------------------------------------------------------------
// Module 10: Medical Clinics & Healthcare Centers (العيادات والمراكز الطبية)
// -------------------------------------------------------------
export interface MedicalPatientEMR {
  id: string;
  fileNumber: string;
  patientName: string;
  age: number;
  gender: 'ذكر' | 'أنثى';
  phone: string;
  bloodType?: 'A+' | 'A-' | 'B+' | 'B-' | 'O+' | 'O-' | 'AB+' | 'AB-';
  chronicDiseases: string[]; // أمراض مزمنة (ضغط، سكر، حساسية بنسلين...)
  allergies: string[];
  lastVisitDate?: string;
  totalVisits: number;
}

export interface DoctorAppointment {
  id: string;
  appointmentNumber: string;
  patientId: string;
  patientName: string;
  patientPhone: string;
  doctorName: string;
  specialty: 'باطنة وجهاز هضمي' | 'أطفال وحديثي ولادة' | 'أسنان وتجميل' | 'عظام ومفاصل' | 'جلدية وتجميل' | 'عيون ورمد' | 'نساء وتوليد' | 'جراحة عامة';
  appointmentDate: string;
  appointmentTime: string;
  type: 'كشف جديد' | 'إعادة واستشارة' | 'إجراء جراحي / جلسة علاجية' | 'طوارئ';
  fee: number;
  doctorSharePercent: number; // نسبة الطبيب من الكشف
  paymentStatus: 'PAID' | 'PENDING';
  status: 'SCHEDULED' | 'IN_WAITING_ROOM' | 'IN_EXAMINATION' | 'COMPLETED' | 'CANCELLED';
  diagnosis?: string;
  prescriptionRx?: {
    drugName: string;
    dosage: string;
    duration: string;
    instructions: string;
  }[];
}

// -------------------------------------------------------------
// Module 11: Barbershop & Beauty Salon (صالونات الحلاقة، مراكز التجميل والكوافير)
// -------------------------------------------------------------
export interface SalonServiceItem {
  id: string;
  serviceName: string;
  category: 'قص شعر وتصفيف' | 'عناية بالبشرة وتنظيف' | 'صبغات وبروتين وكرياتين' | 'مساج وسبا' | 'ميك اب وتجهيز عرايس' | 'بديكير ومنيكير';
  targetAudience: 'رجالي' | 'حريمي' | 'أطفال' | 'للجنسين';
  durationMinutes: number;
  price: number;
  defaultStaffCommissionPercent: number; // نسبة الكوافير / الحلاق %
  materialsUsed?: {
    materialName: string;
    quantity: number;
    unit: string;
  }[];
}

export interface SalonBookingTicket {
  id: string;
  ticketNumber: string;
  clientName: string;
  clientPhone: string;
  staffName: string; // الحلاق / الكوافيرة
  chairNumber: string; // كرسي رقم / غرفة رقم
  serviceName: string;
  serviceCategory: string;
  bookingTime: string;
  durationMinutes: number;
  totalAmount: number;
  discount: number;
  netAmount: number;
  staffCommission: number;
  centerShare: number;
  paymentStatus: 'PAID' | 'PENDING';
  paymentMethod: 'نقد' | 'فيزا / بطاقة' | 'محفظة إلكترونية';
  status: 'WAITING' | 'IN_SERVICE' | 'COMPLETED' | 'CANCELLED';
}

// -------------------------------------------------------------
// Module 12: Gym & Fitness Club (صالات الجيم واللياقة البدنية والنوادي الصحية)
// -------------------------------------------------------------
export interface GymMembershipPlan {
  id: string;
  planName: string; // شهري، ربع سنوي، سنوي، باقة VIP
  durationDays: number;
  price: number;
  includesTrainer: boolean;
  freeFreezesDays: number; // عدد أيام تجميد الاشتراك
  spaAndSaunaAccess: boolean;
  nutritionPlanIncluded: boolean;
}

export interface GymMemberProfile {
  id: string;
  membershipNumber: string;
  memberBarcode: string;
  fullName: string;
  phone: string;
  gender: 'ذكر' | 'أنثى';
  planName: string;
  startDate: string;
  endDate: string;
  daysRemaining: number;
  assignedTrainer?: string;
  inBodyHistory?: {
    date: string;
    weightKg: number;
    fatPercentage: number;
    muscleMassKg: number;
    waterPercent: number;
  }[];
  lockerNumber?: string;
  status: 'ACTIVE' | 'EXPIRED' | 'FROZEN' | 'BLOCKED';
  attendanceLog: {
    checkInTime: string;
    gate: string;
  }[];
}

// -------------------------------------------------------------
// Module 13: Nurseries & Preschools (الحضانات ورياض الأطفال ومراكز رعاية الطفولة)
// -------------------------------------------------------------
export interface NurseryChildProfile {
  id: string;
  childCode: string;
  fullName: string;
  dateOfBirth: string;
  ageYearsMonths: string;
  gender: 'ولد' | 'بنت';
  className: string; // فصل البراعم، فصل العباقرة...
  guardianName: string;
  guardianPhone: string;
  emergencyPhone: string;
  monthlyFee: number;
  busServiceIncluded: boolean;
  busRoute?: string;
  mealsIncluded: boolean;
  specialNeedsOrAllergies?: string;
  medicalConditions?: string;
  paymentStatus: 'PAID' | 'PARTIAL' | 'UNPAID';
  attendanceStatusToday: 'PRESENT' | 'ABSENT' | 'EXCUSED';
  dailyActivitiesLog?: {
    activityName: string;
    napTime: string;
    mealEatenPercent: number;
    behaviorNote: string;
  };
}

// -------------------------------------------------------------
// Module 14: Parking Garage & Valet Management (الجراجات، مواقف السيارات وخدمات الفاليه)
// -------------------------------------------------------------
export interface ParkingSlot {
  id: string;
  slotNumber: string; // A-01, B-12
  floorLevel: 'البدروم -1' | 'البدروم -2' | 'السطح' | 'الطابق الأرضي' | 'VIP';
  slotType: 'عادي' | 'شحن سيارات كهربائية (EV)' | 'ذوي الهمم' | 'VIP حجز شهري';
  status: 'AVAILABLE' | 'OCCUPIED' | 'RESERVED' | 'MAINTENANCE';
  currentTicketNumber?: string;
  currentPlateNumber?: string;
  occupiedSince?: string;
}

export interface ParkingTicket {
  id: string;
  ticketNumber: string;
  barcode: string;
  plateNumber: string;
  carMakeModel?: string;
  slotNumber: string;
  entryTime: string;
  exitTime?: string;
  durationMinutes?: number;
  tariffType: 'بالساعة' | 'مبيت يومي' | 'اشتراك شهري' | 'خدمة فاليه VIP';
  hourlyRate: number;
  totalFee: number;
  paidAmount: number;
  valetDriverName?: string;
  paymentMethod: 'كاش' | 'فيزا / بطاقة' | 'بوابة آلية ذكية';
  status: 'PARKED' | 'PAID_READY_EXIT' | 'EXITED';
}

// -------------------------------------------------------------
// Module 15: Tourism & Travel Agency (شركات السياحة، الطيران، الحج والعمرة والرحلات)
// -------------------------------------------------------------
export interface TourismTravelPackage {
  id: string;
  packageCode: string;
  packageName: string; // برنامج رحلة عمرة رجب، سياحة دبي 5 أيام، شرم الشيخ VIP
  packageType: 'سياحة خارجية' | 'سياحة داخلية' | 'حج وعمرة' | 'حجز طيران وفنادق' | 'تأشيرات سياحية';
  destination: string;
  startDate: string;
  endDate: string;
  durationDaysNights: string;
  airlineCarrier?: string;
  hotelDetails?: string;
  visaRequired: boolean;
  totalSeats: number;
  availableSeats: number;
  sellingPricePerPerson: number;
  costPerPerson: number;
  commissionPerBooking: number;
  itinerarySummary: string[];
}

export interface TourismBookingTicket {
  id: string;
  bookingNumber: string;
  clientName: string;
  clientPhone: string;
  clientPassportNumber?: string;
  clientNationality?: string;
  packageName: string;
  packageType: string;
  numberOfAdults: number;
  numberOfChildren: number;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  paymentStatus: 'PAID' | 'PARTIAL' | 'PENDING';
  visaStatus: 'NOT_APPLICABLE' | 'APPLIED' | 'APPROVED' | 'REJECTED';
  flightTicketStatus: 'ISSUED' | 'PENDING' | 'CANCELLED';
  bookingDate: string;
  assignedTourAgent: string;
}

// -------------------------------------------------------------
// Module 16: Import & Export Operations (شركات الاستيراد والتصدير، التخليص والشحن الدولي)
// -------------------------------------------------------------
export interface ImportExportShipment {
  id: string;
  shipmentNumber: string; // EXP-2026-901 or IMP-2026-302
  operationType: 'IMPORT' | 'EXPORT'; // استيراد أو تصدير
  customsDeclarationNumber?: string; // رقم الشهادة الجمركية / 46
  acidNumber?: string; // رقم الـ ACID المصري المسبق
  clientOrSupplierName: string;
  countryOfOriginOrDestination: string;
  incoterms: 'FOB' | 'CIF' | 'CFR' | 'EXW' | 'DDP';
  portOfLoading: string; // ميناء الشحن
  portOfDischarge: string; // ميناء الوصول والتفريغ
  shippingLine: string; // الخط الملاحي
  blOrAwbNumber: string; // رقم بوليصة الشحن B/L
  containerCount: number;
  containerNumbers: string[];
  goodsDescription: string;
  totalInvoiceForeignCurrency: number; // المبلغ بالعملة الأجنبية
  foreignCurrency: 'USD' | 'EUR' | 'GBP' | 'SAR' | 'AED' | 'CNY';
  exchangeRate: number;
  totalInvoiceLocalCurrency: number;
  
  // Landed Cost & Customs Expenses Breakdown
  customsDuty: number; // ضريبة الوارد / الرسوم الجمركية
  vatTax: number; // ضريبة القيمة المضافة
  shippingFreightCost: number; // النولون البحري / الجوي
  customsClearanceFee: number; // أتعاب المخلص الجمركي
  portHandlingAndStorageCost: number; // أرضيات وغرامات ومصاريف الميناء
  totalLandedCost: number; // إجمالي التكلفة الاستيرادية المحملة على المخزون
  
  // LC and Financing
  paymentFinancingMethod: 'اعتماد مستندي (LC)' | 'تحصيل مستندي (CAD)' | 'تحويل بنكي مسبق (TT)' | 'آجل';
  lcNumber?: string;
  issuingBank?: string;
  
  status: 'DOCS_PREPARATION' | 'ON_VESSEL' | 'CUSTOMS_CLEARANCE' | 'RELEASED_WAREHOUSE' | 'SHIPPED_COMPLETED';
}

// -------------------------------------------------------------
// Module 17: Smart Queue & Customer Flow Management (نظام إدارة الطوابير، نداء العملاء وخدمة الواتساب)
// -------------------------------------------------------------
export interface QueueServiceItem {
  id: string;
  nameAr: string;
  departmentId: string;
  estimatedDurationMins: number;
  price?: number;
  descriptionAr?: string;
}

export interface QueueDepartment {
  id: string;
  nameAr: string; // الاستقبال وخدمة العملاء، الكشوفات الطبية، الصرافة والخزينة، تسليم الطرود
  prefix: string; // A, B, C, V
  currentCallingNumber: number;
  lastIssuedNumber: number;
  averageWaitTimeMinutes: number;
  associatedIndustryModule?: string; // clinics, salon, tourism, carwash, restaurant, pos
  availableServices?: QueueServiceItem[];
}

export interface QueueCounter {
  id: string;
  counterNumber: string; // شباك 1، شباك 2، عيادة 1، كرسي 1
  assignedEmployeeName: string;
  assignedDepartmentId: string;
  currentTicketNumber?: string;
  status: 'ONLINE_SERVING' | 'IDLE_WAITING' | 'BREAK' | 'OFFLINE';
  servedTodayCount: number;
}

export interface QueueTicket {
  id: string;
  ticketCode: string; // A-012
  departmentId: string;
  departmentName: string;
  serviceId?: string;
  serviceName?: string; // اسم الخدمة المختارة (مثل: كشف باطنة وقلب، حجز عمرة، تنظيف بشرة هيدرافيشيل، غسيل كيماوي كامل)
  servicePrice?: number;
  clientName: string;
  clientPhone: string;
  issueTime: string;
  callTime?: string;
  serveStartTime?: string;
  serveEndTime?: string;
  waitingPosition: number; // ترتيبه في الطابور (مثلاً: 2 عميل أمامه)
  counterAssigned?: string;
  status: 'WAITING' | 'CALLED' | 'IN_SERVICE' | 'COMPLETED' | 'NO_SHOW' | 'CANCELLED';
  whatsAppNotificationsSent: {
    type: 'TICKET_ISSUED' | 'TURN_APPROACHING' | 'NOW_CALLING';
    sentAt: string;
    messageText: string;
    delivered: boolean;
  }[];
}

// -------------------------------------------------------------
// Module 18: Price Checker Kiosk & Employee Handheld PDA (كشك استعلام الأسعار وأجهزة الهاند تيرمينال للموظفين)
// -------------------------------------------------------------
export interface PriceCheckProduct {
  id: string;
  barcode: string;
  sku: string;
  nameAr: string;
  nameEn: string;
  brand?: string;
  category: string;
  unit: string;
  costPrice: number;
  retailPrice: number;
  taxRate: number; // 14% or 15%
  finalPriceWithTax: number;
  hasPromotion: boolean;
  promoDiscountPercent?: number;
  promoPrice?: number;
  promoLabel?: string;
  promoValidUntil?: string;
  priceLevels: {
    levelNameAr: string;
    price: number;
    minQuantity: number;
  }[];
  loyaltyPointsEarned: number;
  stockInCurrentBranch: number;
  stockTotalAllBranches: number;
  shelfLocation: string; // ممر A4 - رف 2 - خانة 08
  binCode: string;
  batchNumber?: string;
  expiryDate?: string;
  imageUrl?: string;
  descriptionAr?: string;
  alternativeProducts?: {
    id: string;
    nameAr: string;
    barcode: string;
    price: number;
    stock: number;
    reason: string;
  }[];
}

export type HandheldPdaMode = 
  | 'PRICE_CHECK'        // استعلام أسعار وتحديث بطاقات الرف
  | 'STOCK_COUNT'        // الجرد الدوري والمخزني المتنقل
  | 'LABEL_PRINT'        // طباعة استيكرات الأسعار والباركود بالبلوتوث
  | 'GOODS_RECEIVING'    // استلام بضائع وفحص أوامر الشراء
  | 'BIN_TRANSFER'       // التحويل بين الأرفف والمخازن
  | 'LINE_BUSTING_SALE'  // سلة البيع السريع وتفكيك طوابير الكاشير
  | 'EXPIRY_AUDIT';      // حصر تواريخ الصلاحية والتوالف

export interface HandheldPdaDevice {
  id: string;
  deviceName: string; // Zebra TC26 / Honeywell EDA52 / Urovo i6310 / Phone
  serialNumber: string;
  assignedStaffName: string;
  assignedStaffRole: string;
  branchId: string;
  branchName: string;
  batteryPercent: number;
  wifiSignal: 'EXCELLENT' | 'GOOD' | 'WEAK';
  scannerStatus: 'READY_LASER' | 'CAMERA_ACTIVE' | 'OFFLINE';
  bluetoothPrinterConnected: boolean;
  printerModel?: string; // Bixolon SPP-R200 / Zebra ZQ320 / Xprinter XP-P300
  currentMode: HandheldPdaMode;
}

export interface ShelfLabelPrintRecord {
  id: string;
  barcode: string;
  productName: string;
  unit: string;
  oldPrice?: number;
  newPrice: number;
  shelfLocation: string;
  promoText?: string;
  labelSize: '38x25mm' | '50x30mm' | '80x40mm' | 'ESL_DIGITAL';
  printerTarget: string;
  status: 'PRINTED' | 'QUEUED' | 'FAILED';
  printedAt: string;
  printedBy: string;
}

export interface MobileStockCountItem {
  id: string;
  barcode: string;
  productName: string;
  shelfLocation: string;
  expectedQty: number;
  countedQty: number;
  differenceQty: number;
  unit: string;
  unitCost: number;
  differenceValue: number;
  status: 'MATCH' | 'SURPLUS' | 'DEFICIT';
  countedAt: string;
  countedBy: string;
  batchOrSerial?: string;
}

export interface MobileLineBustingCartItem {
  productId: string;
  barcode: string;
  nameAr: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  taxPercent: number;
  discountAmount: number;
  netTotal: number;
}

export interface MobileLineBustingCart {
  id: string;
  cartCode: string; // CART-9042
  customerName?: string;
  customerPhone?: string;
  items: MobileLineBustingCartItem[];
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  netTotal: number;
  createdByAgent: string;
  status: 'PENDING_CASHIER' | 'PAID_AT_POS' | 'CANCELLED';
  createdAt: string;
}

