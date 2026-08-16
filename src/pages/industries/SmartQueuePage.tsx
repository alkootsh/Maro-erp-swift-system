/**
 * @file SmartQueuePage.tsx
 * @module واجهات وصفحات النظام (UI Pages)
 * @description ملف جزء من نظام MARO ERP. الوظيفة: SmartQueuePage.tsx.
 */
import React, { useState, useId } from 'react';
import { 
  MessageSquare, 
  Tv, 
  Users, 
  Ticket, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Plus, 
  Phone, 
  Send, 
  Volume2, 
  UserCheck, 
  Sparkles, 
  Layers, 
  ExternalLink,
  Smartphone,
  ShieldCheck,
  Stethoscope,
  Scissors,
  Car,
  Plane,
  Building2,
  RefreshCw,
  Printer,
  QrCode,
  Check,
  Flame,
  Coffee,
  GraduationCap,
  Store,
  Tag,
  Share2
} from 'lucide-react';
import { QueueDepartment, QueueCounter, QueueTicket, QueueServiceItem } from '../../types/industryModules';
import { formatCurrency, cn } from '../../lib/utils';

// Industry Configurations & Service Catalogs
interface IndustryProfile {
  id: string;
  nameAr: string;
  categoryName: string;
  icon: React.ElementType;
  badgeColor: string;
  description: string;
  departments: {
    id: string;
    nameAr: string;
    prefix: string;
    averageWaitTimeMinutes: number;
    services: QueueServiceItem[];
  }[];
  counters: {
    id: string;
    counterNumber: string;
    assignedEmployeeName: string;
    assignedDepartmentId: string;
  }[];
}

const INDUSTRY_PROFILES: IndustryProfile[] = [
  {
    id: 'medical_clinics',
    nameAr: 'عيادات ومراكز طبية ومستشفيات',
    categoryName: 'القطاع الطبي والصحي',
    icon: Stethoscope,
    badgeColor: 'bg-teal-500/20 text-teal-300 border-teal-500/30',
    description: 'تنظيم كشوفات المرضى، العيادات التخصصية، ومعامل التحاليل مع إشعار واتساب بدخول الحالة',
    departments: [
      {
        id: 'dept_med_cardio',
        nameAr: 'عيادة الباطنة والقلب والسكر',
        prefix: 'MED',
        averageWaitTimeMinutes: 15,
        services: [
          { id: 'srv_med_1', departmentId: 'dept_med_cardio', nameAr: 'كشف باطنة وفحص سريري شامل', estimatedDurationMins: 15, price: 350, descriptionAr: 'فحص العلامات الحيوية، الضغط، والسكر' },
          { id: 'srv_med_2', departmentId: 'dept_med_cardio', nameAr: 'رسم قلب كهربائي ECG + كشف استشاري', estimatedDurationMins: 20, price: 500, descriptionAr: 'تخطيط قلب وفحص كفاءة عضلة القلب' },
          { id: 'srv_med_3', departmentId: 'dept_med_cardio', nameAr: 'استشارة ومتابعة نتائج تحاليل', estimatedDurationMins: 10, price: 150, descriptionAr: 'مراجعة دورية لنتائج المختبر والأدوية' }
        ]
      },
      {
        id: 'dept_med_dental',
        nameAr: 'عيادة الأسنان وجراحة الفم',
        prefix: 'DEN',
        averageWaitTimeMinutes: 20,
        services: [
          { id: 'srv_den_1', departmentId: 'dept_med_dental', nameAr: 'كشف وطوارئ أسنان وتسكين آلام', estimatedDurationMins: 15, price: 250, descriptionAr: 'فحص فوري للألم الحاد والأشعة السينية' },
          { id: 'srv_den_2', departmentId: 'dept_med_dental', nameAr: 'تنظيف وتلميع جير بالموجات فوق الصوتية', estimatedDurationMins: 25, price: 450, descriptionAr: 'إزالة الرواسب الجيرية وتلميع الأسنان' },
          { id: 'srv_den_3', departmentId: 'dept_med_dental', nameAr: 'جلسة حشو عصب وعلاج جذور', estimatedDurationMins: 35, price: 800, descriptionAr: 'علاج القنوات العصبية والحشو الضوئي' }
        ]
      },
      {
        id: 'dept_med_lab',
        nameAr: 'معمل التحاليل الطبية وسحب العينات',
        prefix: 'LAB',
        averageWaitTimeMinutes: 8,
        services: [
          { id: 'srv_lab_1', departmentId: 'dept_med_lab', nameAr: 'سحب عينات دم وفحص شامل (CBC, وظائف كلى وكبد)', estimatedDurationMins: 8, price: 600, descriptionAr: 'باقة التحاليل الوقائية الدورية' },
          { id: 'srv_lab_2', departmentId: 'dept_med_lab', nameAr: 'تحليل سكر تراكمي HbA1c ودهون ثلاثية', estimatedDurationMins: 5, price: 280, descriptionAr: 'فحص السكري والكوليسترول' }
        ]
      }
    ],
    counters: [
      { id: 'cnt_med_1', counterNumber: 'عيادة 1 - باطنة وقلب (غرفة 102)', assignedEmployeeName: 'د. سامح فهمي (استشاري باطنة)', assignedDepartmentId: 'dept_med_cardio' },
      { id: 'cnt_med_2', counterNumber: 'عيادة 2 - طب وجراحة الأسنان (غرفة 105)', assignedEmployeeName: 'د. ياسمين الشريف (أخصائية أسنان)', assignedDepartmentId: 'dept_med_dental' },
      { id: 'cnt_med_3', counterNumber: 'شباك سحب العينات - المعمل الرئيسي', assignedEmployeeName: 'أ. هاني كمال (كيميائي تحاليل)', assignedDepartmentId: 'dept_med_lab' }
    ]
  },
  {
    id: 'salon_beauty',
    nameAr: 'صالونات التجميل والكوافير والسبا',
    categoryName: 'قطاع العناية والجمال',
    icon: Scissors,
    badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
    description: 'توزيع الحجوزات على كراسي التصفيف، غرف العناية بالبشرة، والسبا مع إشعار عند جهوزية المصفف',
    departments: [
      {
        id: 'dept_sal_hair',
        nameAr: 'قسم تصفيف وقص الشعر والعلاج',
        prefix: 'SAL',
        averageWaitTimeMinutes: 25,
        services: [
          { id: 'srv_sal_1', departmentId: 'dept_sal_hair', nameAr: 'قص شعر احترافي + سشوار وسيروم', estimatedDurationMins: 25, price: 200, descriptionAr: 'أحدث قصات الشعر مع ترطيب حراري' },
          { id: 'srv_sal_2', departmentId: 'dept_sal_hair', nameAr: 'جلسة ترميم بروتين وبوتوكس علاجي', estimatedDurationMins: 60, price: 1200, descriptionAr: 'معالجة الشعر التالف بالفيتامينات' },
          { id: 'srv_sal_3', departmentId: 'dept_sal_hair', nameAr: 'صبغة كاملة وخصل لولايت وتفتيح', estimatedDurationMins: 50, price: 900, descriptionAr: 'ألوان صبغة إيطالية خالية من الأمونيا' }
        ]
      },
      {
        id: 'dept_sal_skin',
        nameAr: 'قسم العناية بالبشرة والفيشيل والسبا',
        prefix: 'SPA',
        averageWaitTimeMinutes: 30,
        services: [
          { id: 'srv_spa_1', departmentId: 'dept_sal_skin', nameAr: 'تنظيف بشرة هيدرافيشيل عميق (9 مراحل)', estimatedDurationMins: 45, price: 650, descriptionAr: 'إزالة الرؤوس السوداء والتقشير الماسي' },
          { id: 'srv_spa_2', departmentId: 'dept_sal_skin', nameAr: 'جلسة بديكير ومناكير سبا ومساج لليدين والقدمين', estimatedDurationMins: 35, price: 300, descriptionAr: 'عناية كاملة بالأظافر والجلد الميت' },
          { id: 'srv_spa_3', departmentId: 'dept_sal_skin', nameAr: 'جلسة مساج ريلاكس كامل للجسم (45 دقيقة)', estimatedDurationMins: 45, price: 500, descriptionAr: 'تدليك بالزيوت العطرية العضوية' }
        ]
      }
    ],
    counters: [
      { id: 'cnt_sal_1', counterNumber: 'كرسي VIP 1 - تصفيف وقص', assignedEmployeeName: 'كابتن / أسطى كريم عاصم', assignedDepartmentId: 'dept_sal_hair' },
      { id: 'cnt_sal_2', counterNumber: 'كرسي 2 - صبغات وبروتين', assignedEmployeeName: 'أخصائية / دينا المهدي', assignedDepartmentId: 'dept_sal_hair' },
      { id: 'cnt_sal_3', counterNumber: 'غرفة السبا والهيدرافيشيل 1', assignedEmployeeName: 'أخصائية / نورهان سالم', assignedDepartmentId: 'dept_sal_skin' }
    ]
  },
  {
    id: 'tourism_travel',
    nameAr: 'شركات السياحة والسفر والحج والعمرة',
    categoryName: 'قطاع السياحة والطيران',
    icon: Plane,
    badgeColor: 'bg-sky-500/20 text-sky-300 border-sky-500/30',
    description: 'إدارة طوابير استلام الجوازات والتأشيرات، وحجوزات تذاكر الطيران، وباقات الحج والعمرة والرحلات',
    departments: [
      {
        id: 'dept_trv_umrah',
        nameAr: 'باقات وحجوزات الحج والعمرة وزيارة الروضة',
        prefix: 'UMR',
        averageWaitTimeMinutes: 12,
        services: [
          { id: 'srv_umr_1', departmentId: 'dept_trv_umrah', nameAr: 'حجز باقة عمرة رجب/رمضان 5 نجوم (طيران + فنادق الحرم)', estimatedDurationMins: 15, price: 28500, descriptionAr: 'شاملة التأشيرة والإقامة والتنقلات' },
          { id: 'srv_umr_2', departmentId: 'dept_trv_umrah', nameAr: 'استخراج تأشيرة نسك الإلكترونية وتأمين السفر', estimatedDurationMins: 10, price: 6500, descriptionAr: 'إصدار فوري خلال 24 ساعة' }
        ]
      },
      {
        id: 'dept_trv_ticketing',
        nameAr: 'تذاكر الطيران الدولي وحجوزات الفنادق',
        prefix: 'TRV',
        averageWaitTimeMinutes: 10,
        services: [
          { id: 'srv_trv_1', departmentId: 'dept_trv_ticketing', nameAr: 'إصدار وتعديل تذاكر طيران دولي وداخلي', estimatedDurationMins: 10, price: 0, descriptionAr: 'حجز ومقارنة أسعار خطوط الطيران' },
          { id: 'srv_trv_2', departmentId: 'dept_trv_ticketing', nameAr: 'حجز بكج سياحة خارجية (دبي / تركيا / أوروبا)', estimatedDurationMins: 20, price: 18000, descriptionAr: 'شاملة الطيران والفنادق والجولات اليومية' }
        ]
      }
    ],
    counters: [
      { id: 'cnt_trv_1', counterNumber: 'شباك 1 - باقات الحج والعمرة', assignedEmployeeName: 'أ. معتز فوزي (مسؤول الحج والعمرة)', assignedDepartmentId: 'dept_trv_umrah' },
      { id: 'cnt_trv_2', counterNumber: 'شباك 2 - تذاكر الطيران والسياحة الدولية', assignedEmployeeName: 'أ. ريم عبد الخالق (مسؤولة الحجوزات)', assignedDepartmentId: 'dept_trv_ticketing' }
    ]
  },
  {
    id: 'carwash_auto',
    nameAr: 'مغاسل السيارات والعناية بالمركبات والجراجات',
    categoryName: 'قطاع السيارات والخدمات',
    icon: Car,
    badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    description: 'تنظيم حارات الغسيل والتلميع والنانو سيراميك وإشعار العميل فور انتهاء تجهيز سيارته',
    departments: [
      {
        id: 'dept_car_wash',
        nameAr: 'حارات الغسيل السريع والشامل',
        prefix: 'CAR',
        averageWaitTimeMinutes: 15,
        services: [
          { id: 'srv_car_1', departmentId: 'dept_car_wash', nameAr: 'غسيل رغوي سوبر واش خارجي وداخلي + تعطير وتلميع إطارات', estimatedDurationMins: 15, price: 120, descriptionAr: 'تنظيف شامل بالرغوة الفعالة' },
          { id: 'srv_car_2', departmentId: 'dept_car_wash', nameAr: 'غسيل محرك بالبخار الجاف + تنظيف الشاسيه من الأسفل', estimatedDurationMins: 20, price: 200, descriptionAr: 'إزالة الزيوت والأتربة المستعصية' }
        ]
      },
      {
        id: 'dept_car_detail',
        nameAr: 'حارة النانو سيراميك والتلميع والعناية الكيماوية',
        prefix: 'DET',
        averageWaitTimeMinutes: 35,
        services: [
          { id: 'srv_car_3', departmentId: 'dept_car_detail', nameAr: 'غسيل كيماوي كامل للفرش والتابلوه بالبخار وإزالة البقع', estimatedDurationMins: 45, price: 650, descriptionAr: 'تعقيم كامل للصالون وإزالة الروائح' },
          { id: 'srv_car_4', departmentId: 'dept_car_detail', nameAr: 'تلميع وبولش نانو سيراميك 3 طبقات (حماية طلاء ومقاومة خدوش)', estimatedDurationMins: 60, price: 2200, descriptionAr: 'لمعان زجاجي وحماية فائقة' }
        ]
      }
    ],
    counters: [
      { id: 'cnt_car_1', counterNumber: 'حارة 1 - غسيل سريع وتجفيف', assignedEmployeeName: 'كابتن / إبراهيم جودة', assignedDepartmentId: 'dept_car_wash' },
      { id: 'cnt_car_2', counterNumber: 'حارة 2 - غسيل بخار ومحركات', assignedEmployeeName: 'فني / صبحي العطار', assignedDepartmentId: 'dept_car_wash' },
      { id: 'cnt_car_3', counterNumber: 'حارة 3 - ديتيلنج ونانو سيراميك', assignedEmployeeName: 'أخصائي تلميع / وائل حنفي', assignedDepartmentId: 'dept_car_detail' }
    ]
  },
  {
    id: 'retail_pos_cs',
    nameAr: 'خدمة العملاء ونقاط البيع والصرافة والتجزئة',
    categoryName: 'قطاع التجزئة والخدمات العامة',
    icon: Building2,
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    description: 'طوابير خدمة العملاء، الخزينة والتحصيل، والاستبدال والمرتجعات لمنع الازدحام',
    departments: [
      {
        id: 'dept_pos_cs',
        nameAr: 'خدمة العملاء والاستفسارات والدعم',
        prefix: 'CS',
        averageWaitTimeMinutes: 7,
        services: [
          { id: 'srv_pos_1', departmentId: 'dept_pos_cs', nameAr: 'استفسار وفتح حساب اشتراك / عضوية VIP', estimatedDurationMins: 8, price: 0, descriptionAr: 'تسجيل العضوية وتفعيل نقاط الولاء' },
          { id: 'srv_pos_2', departmentId: 'dept_pos_cs', nameAr: 'استبدال واسترجاع بضائع وضمان', estimatedDurationMins: 10, price: 0, descriptionAr: 'فحص الفواتير وإرجاع المبالغ' },
          { id: 'srv_pos_3', departmentId: 'dept_pos_cs', nameAr: 'تقديم شكوى ومقترحات ومتابعة طلبات', estimatedDurationMins: 6, price: 0, descriptionAr: 'معالجة فنية ومتابعة إدارية' }
        ]
      },
      {
        id: 'dept_pos_cashier',
        nameAr: 'الخزينة العامة والتحصيل السريع',
        prefix: 'CSH',
        averageWaitTimeMinutes: 3,
        services: [
          { id: 'srv_csh_1', departmentId: 'dept_pos_cashier', nameAr: 'سداد فواتير وتحصيل نقدي / فيزا سريع', estimatedDurationMins: 3, price: 0, descriptionAr: 'دفع فوري وطباعة الإيصال' },
          { id: 'srv_csh_2', departmentId: 'dept_pos_cashier', nameAr: 'صرف مستحقات وشيكات بنكية', estimatedDurationMins: 5, price: 0, descriptionAr: 'مطابقة التوقيعات وصرف الشيك' }
        ]
      }
    ],
    counters: [
      { id: 'cnt_pos_1', counterNumber: 'شباك 1 - خدمة عملاء واستقبال', assignedEmployeeName: 'أحمد علي حسن', assignedDepartmentId: 'dept_pos_cs' },
      { id: 'cnt_pos_2', counterNumber: 'شباك 2 - استبدال واسترجاع', assignedEmployeeName: 'مروة الشافعي', assignedDepartmentId: 'dept_pos_cs' },
      { id: 'cnt_pos_3', counterNumber: 'شباك 3 - الخزينة السريعة', assignedEmployeeName: 'محمود عبد الفتاح (صراف)', assignedDepartmentId: 'dept_pos_cashier' }
    ]
  }
];

export const SmartQueuePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'kiosk' | 'counters' | 'tv_screen' | 'whatsapp_log' | 'integrations'>('kiosk');
  const [selectedIndustryId, setSelectedIndustryId] = useState<string>('medical_clinics');

  // Selected Profile
  const currentProfile = INDUSTRY_PROFILES.find(p => p.id === selectedIndustryId) || INDUSTRY_PROFILES[0];

  // Dynamic Departments State loaded from profiles or persisted
  const [departments, setDepartments] = useState<QueueDepartment[]>(() => {
    return currentProfile.departments.map(d => ({
      id: d.id,
      nameAr: d.nameAr,
      prefix: d.prefix,
      currentCallingNumber: 3,
      lastIssuedNumber: 5,
      averageWaitTimeMinutes: d.averageWaitTimeMinutes,
      associatedIndustryModule: currentProfile.id,
      availableServices: d.services
    }));
  });

  // Operator Counters
  const [counters, setCounters] = useState<QueueCounter[]>(() => {
    return currentProfile.counters.map((c, index) => ({
      id: c.id,
      counterNumber: c.counterNumber,
      assignedEmployeeName: c.assignedEmployeeName,
      assignedDepartmentId: c.assignedDepartmentId,
      currentTicketNumber: index === 0 ? `${currentProfile.departments[0].prefix}-003` : undefined,
      status: index === 0 ? 'ONLINE_SERVING' : 'IDLE_WAITING',
      servedTodayCount: index === 0 ? 12 : 8
    }));
  });

  // When industry changes, reset departments & counters according to the new selected profile
  const handleSwitchIndustry = (industryId: string) => {
    setSelectedIndustryId(industryId);
    const profile = INDUSTRY_PROFILES.find(p => p.id === industryId) || INDUSTRY_PROFILES[0];

    const newDepts: QueueDepartment[] = profile.departments.map(d => ({
      id: d.id,
      nameAr: d.nameAr,
      prefix: d.prefix,
      currentCallingNumber: 1,
      lastIssuedNumber: 3,
      averageWaitTimeMinutes: d.averageWaitTimeMinutes,
      associatedIndustryModule: profile.id,
      availableServices: d.services
    }));
    setDepartments(newDepts);

    const newCounters: QueueCounter[] = profile.counters.map((c, index) => ({
      id: c.id,
      counterNumber: c.counterNumber,
      assignedEmployeeName: c.assignedEmployeeName,
      assignedDepartmentId: c.assignedDepartmentId,
      currentTicketNumber: index === 0 ? `${profile.departments[0].prefix}-001` : undefined,
      status: index === 0 ? 'ONLINE_SERVING' : 'IDLE_WAITING',
      servedTodayCount: 5
    }));
    setCounters(newCounters);

    // reset kiosk selection
    setKioskSelectedDept(newDepts[0]?.id || '');
    setKioskSelectedServiceId(newDepts[0]?.availableServices?.[0]?.id || '');
  };

  // Live Queue Tickets
  const [tickets, setTickets] = useState<QueueTicket[]>([
    {
      id: 'tkt_seed_1',
      ticketCode: 'MED-003',
      departmentId: 'dept_med_cardio',
      departmentName: 'عيادة الباطنة والقلب والسكر',
      serviceId: 'srv_med_1',
      serviceName: 'كشف باطنة وفحص سريري شامل',
      servicePrice: 350,
      clientName: 'طارق عبد المحسن',
      clientPhone: '01019827364',
      issueTime: '06:10 م',
      callTime: '06:25 م',
      waitingPosition: 0,
      counterAssigned: 'عيادة 1 - باطنة وقلب (غرفة 102)',
      status: 'IN_SERVICE',
      whatsAppNotificationsSent: [
        {
          type: 'TICKET_ISSUED',
          sentAt: '06:10 م',
          messageText: 'مرحباً طارق عبد المحسن! 🌟\nتم إصدار تذكرتك رقم: [MED-003]\nالنشاط: عيادات ومراكز طبية ومستشفيات\nالقسم: عيادة الباطنة والقلب والسكر\nالخدمة: كشف باطنة وفحص سريري شامل (350 ج.م)\nأمامك في الانتظار: 2 مريض.\nالوقت المتوقع: ~20 دقيقة.\nسنرسل لك تنبيهاً تلقائياً فور اقتراب دورك!',
          delivered: true
        },
        {
          type: 'TURN_APPROACHING',
          sentAt: '06:22 م',
          messageText: '⏳ تنبيه اقتراب الدور:\nأمامك مريض واحد فقط يا طارق! يرجى التواجد أمام غرفة 102 للاستعداد.',
          delivered: true
        },
        {
          type: 'NOW_CALLING',
          sentAt: '06:25 م',
          messageText: '📢 تفضل بالدخول الآن يا طارق عبد المحسن!\nتذكرتك رقم [MED-003]\nالعيادة: عيادة 1 - باطنة وقلب (غرفة 102)\nمع: د. سامح فهمي (استشاري باطنة). 🩺',
          delivered: true
        }
      ]
    },
    {
      id: 'tkt_seed_2',
      ticketCode: 'MED-004',
      departmentId: 'dept_med_cardio',
      departmentName: 'عيادة الباطنة والقلب والسكر',
      serviceId: 'srv_med_2',
      serviceName: 'رسم قلب كهربائي ECG + كشف استشاري',
      servicePrice: 500,
      clientName: 'هند إبراهيم مرسي',
      clientPhone: '01229182734',
      issueTime: '06:18 م',
      waitingPosition: 1,
      status: 'WAITING',
      whatsAppNotificationsSent: [
        {
          type: 'TICKET_ISSUED',
          sentAt: '06:18 م',
          messageText: 'مرحباً هند إبراهيم مرسي! 🌟\nتم إصدار تذكرتك رقم: [MED-004]\nالقسم: عيادة الباطنة والقلب والسكر\nالخدمة: رسم قلب كهربائي ECG + كشف استشاري\nأمامك: 1 مريض في الانتظار.\nالوقت المتوقع: ~15 دقيقة.',
          delivered: true
        }
      ]
    },
    {
      id: 'tkt_seed_3',
      ticketCode: 'MED-005',
      departmentId: 'dept_med_cardio',
      departmentName: 'عيادة الباطنة والقلب والسكر',
      serviceId: 'srv_med_3',
      serviceName: 'استشارة ومتابعة نتائج تحاليل',
      servicePrice: 150,
      clientName: 'د. زياد الكردي',
      clientPhone: '01118293847',
      issueTime: '06:25 م',
      waitingPosition: 2,
      status: 'WAITING',
      whatsAppNotificationsSent: [
        {
          type: 'TICKET_ISSUED',
          sentAt: '06:25 م',
          messageText: 'مرحباً د. زياد الكردي! 🌟\nتم تأكيد تذكرتك رقم: [MED-005] للمتابعة واستشارة التحاليل.',
          delivered: true
        }
      ]
    }
  ]);

  // Form State for Kiosk
  const [kioskClientName, setKioskClientName] = useState('');
  const [kioskClientPhone, setKioskClientPhone] = useState('');
  const [kioskSelectedDept, setKioskSelectedDept] = useState<string>(departments[0]?.id || 'dept_med_cardio');
  const [kioskSelectedServiceId, setKioskSelectedServiceId] = useState<string>('srv_med_1');
  const [lastIssuedTicketAlert, setLastIssuedTicketAlert] = useState<QueueTicket | null>(null);
  const [activeChime, setActiveChime] = useState(false);
  const [thermalPrintPreview, setThermalPrintPreview] = useState(false);

  // Sound chime simulator
  const playCallingChime = () => {
    setActiveChime(true);
    setTimeout(() => setActiveChime(false), 2500);
  };

  // Get active department in Kiosk
  const currentKioskDept = departments.find(d => d.id === kioskSelectedDept) || departments[0];
  const currentAvailableServices = currentKioskDept?.availableServices || [];
  const currentSelectedService = currentAvailableServices.find(s => s.id === kioskSelectedServiceId) || currentAvailableServices[0];

  // Dynamic calculated expected wait time for the new ticket
  const currentDeptWaitingCount = tickets.filter(t => t.departmentId === currentKioskDept?.id && (t.status === 'WAITING' || t.status === 'CALLED')).length;
  const estimatedWaitMins = Math.max(3, currentDeptWaitingCount * (currentSelectedService?.estimatedDurationMins || currentKioskDept?.averageWaitTimeMinutes || 10));

  // Issue Ticket from Kiosk
  const handleIssueTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!kioskClientName.trim() || !kioskClientPhone.trim() || !currentKioskDept) return;

    const newNum = currentKioskDept.lastIssuedNumber + 1;
    const ticketCode = `${currentKioskDept.prefix}-${String(newNum).padStart(3, '0')}`;
    const waitingCount = tickets.filter(t => t.departmentId === currentKioskDept.id && (t.status === 'WAITING' || t.status === 'CALLED')).length;
    const service: QueueServiceItem = currentSelectedService || { 
      id: 'srv_gen', 
      departmentId: currentKioskDept.id, 
      nameAr: 'خدمة عامة', 
      price: 0, 
      estimatedDurationMins: 10 
    };
    const waitTime = Math.max(3, waitingCount * (service.estimatedDurationMins || currentKioskDept.averageWaitTimeMinutes));

    const welcomeMsg = `مرحباً بك يا ${kioskClientName} في ${currentProfile.nameAr}! 🌟\n` +
      `📌 تذكرة الانتظار رقم: [${ticketCode}]\n` +
      `🏢 القسم: ${currentKioskDept.nameAr}\n` +
      `🛠️ الخدمة المختارة: ${service.nameAr} ${service.price ? `(${formatCurrency(service.price)})` : ''}\n` +
      `👥 أمامك في الطابور: ${waitingCount} عميل/مريض.\n` +
      `⏳ متوسط وقت الانتظار التقديري: ~${waitTime} دقيقة.\n` +
      `📲 سنرسل لك رسالة تلقائية فور اقتراب دورك والمناداة على تذكرتك!`;

    const newTicket: QueueTicket = {
      id: `tkt_${Date.now()}`,
      ticketCode,
      departmentId: currentKioskDept.id,
      departmentName: currentKioskDept.nameAr,
      serviceId: service.id,
      serviceName: service.nameAr,
      servicePrice: service.price,
      clientName: kioskClientName.trim(),
      clientPhone: kioskClientPhone.trim(),
      issueTime: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
      waitingPosition: waitingCount,
      status: 'WAITING',
      whatsAppNotificationsSent: [
        {
          type: 'TICKET_ISSUED',
          sentAt: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
          messageText: welcomeMsg,
          delivered: true
        }
      ]
    };

    setTickets(prev => [...prev, newTicket]);
    setDepartments(prev => prev.map(d => d.id === currentKioskDept.id ? { ...d, lastIssuedNumber: newNum } : d));
    setLastIssuedTicketAlert(newTicket);
    setThermalPrintPreview(true);

    // Reset form
    setKioskClientName('');
    setKioskClientPhone('');
  };

  // Operator Action: Call Next
  const handleCallNext = (counterId: string) => {
    const counter = counters.find(c => c.id === counterId);
    if (!counter) return;

    // Find first waiting ticket in this department
    const nextTkt = tickets.find(t => t.departmentId === counter.assignedDepartmentId && t.status === 'WAITING');
    if (!nextTkt) return;

    playCallingChime();

    const callMsg = `📢 تنبيه المناداة: دورك الآن يا ${nextTkt.clientName}!\n` +
      `تذكرتك رقم: [${nextTkt.ticketCode}]\n` +
      `الخدمة: ${nextTkt.serviceName || 'المعاملة المطلوبة'}\n` +
      `يرجى التفضل بالتوجه فوراً إلى: [${counter.counterNumber}]\n` +
      `المسؤول: ${counter.assignedEmployeeName}. 🌟`;

    const updatedTickets = tickets.map(t => {
      if (t.id === nextTkt.id) {
        return {
          ...t,
          status: 'IN_SERVICE' as const,
          counterAssigned: counter.counterNumber,
          callTime: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
          whatsAppNotificationsSent: [
            ...t.whatsAppNotificationsSent,
            {
              type: 'NOW_CALLING' as const,
              sentAt: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
              messageText: callMsg,
              delivered: true
            }
          ]
        };
      }
      return t;
    });

    setTickets(updatedTickets);
    setCounters(counters.map(c => c.id === counterId ? {
      ...c,
      currentTicketNumber: nextTkt.ticketCode,
      servedTodayCount: c.servedTodayCount + 1,
      status: 'ONLINE_SERVING'
    } : c));

    // Notify subsequent waiting client
    const subsequentTkt = updatedTickets.find(t => t.departmentId === counter.assignedDepartmentId && t.status === 'WAITING');
    if (subsequentTkt) {
      const approachMsg = `⏳ تنبيه اقتراب الدور:\nأمامك الآن عميل واحد فقط يا ${subsequentTkt.clientName}!\nيرجى التواجد بالقرب من صالة الانتظار لـ [${counter.counterNumber}] للاستعداد.`;
      setTickets(prev => prev.map(t => t.id === subsequentTkt.id ? {
        ...t,
        whatsAppNotificationsSent: [
          ...t.whatsAppNotificationsSent,
          {
            type: 'TURN_APPROACHING' as const,
            sentAt: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
            messageText: approachMsg,
            delivered: true
          }
        ]
      } : t));
    }
  };

  // Complete Service
  const handleFinishServing = (counterId: string) => {
    const counter = counters.find(c => c.id === counterId);
    if (!counter || !counter.currentTicketNumber) return;

    setTickets(tickets.map(t => t.ticketCode === counter.currentTicketNumber ? { ...t, status: 'COMPLETED' } : t));
    setCounters(counters.map(c => c.id === counterId ? { ...c, currentTicketNumber: undefined, status: 'IDLE_WAITING' } : c));
  };

  const totalWhatsAppMessages = tickets.reduce((acc, t) => acc + t.whatsAppNotificationsSent.length, 0);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-[#151b2b] border border-emerald-500/30 rounded-3xl p-6 shadow-2xl relative overflow-hidden flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-green-500"></div>
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
              <MessageSquare size={14} />
              <span>Smart Queue & WhatsApp Customer Flow Engine</span>
            </span>
            <span className="px-3 py-1 rounded-full bg-slate-800 text-slate-300 text-xs font-bold border border-slate-700 flex items-center gap-1.5">
              <Sparkles size={13} className="text-amber-400" />
              <span>النشاط الفعّال: {currentProfile.nameAr}</span>
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-white">
            نظام إدارة الطوابير، نداء العملاء والتنبيه بالواتساب
          </h1>
          <p className="text-xs md:text-sm text-slate-400">
            تسجيل العميل لبياناته واختيار الخدمة حسب نشاط الشركة الرئيسي لإصدار تذكرة فورية بالرقم التسلسلي ووقت الانتظار المتوقع مع إشعار WhatsApp فوري.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="bg-[#0f172a] p-3.5 rounded-2xl border border-slate-800 flex items-center gap-3">
            <Smartphone className="text-emerald-400" size={26} />
            <div>
              <p className="text-[10px] text-slate-400">إجمالي تنبيهات WhatsApp</p>
              <p className="text-xs font-bold text-white">
                {totalWhatsAppMessages} رسالة مسلّمة ✓✓
              </p>
            </div>
          </div>

          <div className="bg-[#0f172a] p-3.5 rounded-2xl border border-slate-800 flex items-center gap-3">
            <Users className="text-teal-400" size={26} />
            <div>
              <p className="text-[10px] text-slate-400">العملاء في الانتظار</p>
              <p className="text-xs font-bold text-white">
                {tickets.filter(t => t.status === 'WAITING').length} عميل في الطابور
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Industry Activity Switcher Bar */}
      <div className="bg-[#101623] border border-slate-800 rounded-2xl p-4 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Tag className="text-emerald-400" size={18} />
            <span className="text-xs font-black text-white">تخصيص نظام الكشك والطوابير حسب نشاط الشركة الرئيسي:</span>
          </div>
          <span className="text-[11px] text-slate-400">يتغير الكشك والخدمات والشبابيك تلقائياً وفقاً للنشاط المحدد</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
          {INDUSTRY_PROFILES.map((profile) => {
            const IconComponent = profile.icon;
            const isSelected = selectedIndustryId === profile.id;
            return (
              <button
                key={profile.id}
                type="button"
                onClick={() => handleSwitchIndustry(profile.id)}
                className={cn(
                  "p-3 rounded-xl border text-right transition-all flex items-center gap-2.5",
                  isSelected 
                    ? "bg-emerald-600/20 border-emerald-500 text-white shadow-lg shadow-emerald-600/10" 
                    : "bg-[#151b2b] border-slate-800 text-slate-400 hover:text-white hover:border-slate-700"
                )}
              >
                <div className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                  isSelected ? "bg-emerald-500 text-white" : "bg-slate-800 text-slate-400"
                )}>
                  <IconComponent size={16} />
                </div>
                <div className="overflow-hidden">
                  <p className="text-xs font-black truncate">{profile.nameAr.split(' ')[0]} {profile.nameAr.split(' ')[1] || ''}</p>
                  <p className="text-[10px] text-slate-400 truncate">{profile.categoryName}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('kiosk')}
          className={cn(
            "px-5 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2 whitespace-nowrap",
            activeTab === 'kiosk' ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20" : "bg-slate-900 text-slate-400 hover:text-white"
          )}
        >
          <Ticket size={16} />
          <span>كشك حجز التذاكر واختيار الخدمة الذاتي (Self Kiosk)</span>
        </button>
        <button
          onClick={() => setActiveTab('counters')}
          className={cn(
            "px-5 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2 whitespace-nowrap",
            activeTab === 'counters' ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20" : "bg-slate-900 text-slate-400 hover:text-white"
          )}
        >
          <UserCheck size={16} />
          <span>لوحة تحكم الشبابيك والعيادات والموظفين ({counters.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('tv_screen')}
          className={cn(
            "px-5 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2 whitespace-nowrap",
            activeTab === 'tv_screen' ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20" : "bg-slate-900 text-slate-400 hover:text-white"
          )}
        >
          <Tv size={16} />
          <span>شاشة العرض المركزية للنداء الفوري (TV Screen)</span>
        </button>
        <button
          onClick={() => setActiveTab('whatsapp_log')}
          className={cn(
            "px-5 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2 whitespace-nowrap",
            activeTab === 'whatsapp_log' ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20" : "bg-slate-900 text-slate-400 hover:text-white"
          )}
        >
          <MessageSquare size={16} />
          <span>سجل رسائل وتنبيهات الواتساب الحية</span>
        </button>
        <button
          onClick={() => setActiveTab('integrations')}
          className={cn(
            "px-5 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2 whitespace-nowrap",
            activeTab === 'integrations' ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20" : "bg-slate-900 text-slate-400 hover:text-white"
          )}
        >
          <Layers size={16} />
          <span>الربط مع كافة الأنشطة والموديولات</span>
        </button>
      </div>

      {/* TAB 1: SELF-SERVICE TICKET & SERVICE KIOSK */}
      {activeTab === 'kiosk' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Kiosk Form */}
          <div className="lg:col-span-7 bg-[#151b2b] border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
            <div className="text-center space-y-2 border-b border-slate-800 pb-5">
              <div className="w-14 h-14 rounded-2xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto shadow-lg shadow-emerald-600/10">
                <Ticket size={28} />
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white">
                كشك حجز التذاكر الذكي — {currentProfile.nameAr}
              </h2>
              <p className="text-xs text-slate-400">
                سجل بياناتك واختر الخدمة المطلوبة ليتم إصدار رقم دورك وإرسال التنبيهات ووقت الانتظار المتوقع عبر WhatsApp
              </p>
            </div>

            <form onSubmit={handleIssueTicket} className="space-y-6">
              {/* Step 1: Customer Contact Info */}
              <div className="bg-[#0f172a] p-4 rounded-2xl border border-slate-800 space-y-4">
                <div className="flex items-center gap-2 text-xs font-black text-emerald-400">
                  <span className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center text-xs">1</span>
                  <span>بيانات العميل الكريم ورقم الواتساب:</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-300 block">اسم العميل الثلاثي:</label>
                    <input
                      type="text"
                      required
                      value={kioskClientName}
                      onChange={(e) => setKioskClientName(e.target.value)}
                      placeholder="مثال: م. مصطفى عبد العزيز"
                      className="w-full bg-[#151b2b] border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-300 block">رقم الموبايل (لتنبيهات WhatsApp):</label>
                    <div className="relative">
                      <input
                        type="tel"
                        required
                        value={kioskClientPhone}
                        onChange={(e) => setKioskClientPhone(e.target.value)}
                        placeholder="مثال: 01019283746"
                        className="w-full bg-[#151b2b] border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                      />
                      <Smartphone className="absolute left-3 top-2.5 text-emerald-400" size={16} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 2: Department Selection */}
              <div className="bg-[#0f172a] p-4 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-black text-emerald-400">
                    <span className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center text-xs">2</span>
                    <span>اختر القسم أو العيادة أو الصالة:</span>
                  </div>
                  <span className="text-[11px] text-slate-400">
                    {departments.length} أقسام متاحة
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {departments.map((dept) => {
                    const isSelected = kioskSelectedDept === dept.id;
                    const waitingCount = tickets.filter(t => t.departmentId === dept.id && (t.status === 'WAITING' || t.status === 'CALLED')).length;
                    return (
                      <button
                        key={dept.id}
                        type="button"
                        onClick={() => {
                          setKioskSelectedDept(dept.id);
                          if (dept.availableServices && dept.availableServices.length > 0) {
                            setKioskSelectedServiceId(dept.availableServices[0].id);
                          }
                        }}
                        className={cn(
                          "p-3.5 rounded-xl border text-right transition-all flex flex-col justify-between space-y-2",
                          isSelected 
                            ? "bg-emerald-600/20 border-emerald-500 text-white shadow-md shadow-emerald-600/10 ring-1 ring-emerald-500/30" 
                            : "bg-[#151b2b] border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-black text-xs text-white">{dept.nameAr}</span>
                          <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-slate-900 text-emerald-400 border border-slate-700">
                            كود: {dept.prefix}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-slate-400">
                          <span>في الانتظار: {waitingCount}</span>
                          <span className="text-emerald-400">متوسط {dept.averageWaitTimeMinutes} دقيقة</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Step 3: Specific Service Selection according to business activity */}
              <div className="bg-[#0f172a] p-4 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-black text-emerald-400">
                    <span className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center text-xs">3</span>
                    <span>اختر الخدمة المحددة (Service Selection):</span>
                  </div>
                  <span className="text-[11px] text-slate-400">
                    خدمات قسم {currentKioskDept.nameAr}
                  </span>
                </div>

                <div className="space-y-2">
                  {currentAvailableServices.map((srv) => {
                    const isSelected = kioskSelectedServiceId === srv.id;
                    return (
                      <button
                        key={srv.id}
                        type="button"
                        onClick={() => setKioskSelectedServiceId(srv.id)}
                        className={cn(
                          "w-full p-3 rounded-xl border text-right transition-all flex items-center justify-between gap-3",
                          isSelected
                            ? "bg-emerald-950/40 border-emerald-500 text-white ring-1 ring-emerald-500/40"
                            : "bg-[#151b2b] border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "w-5 h-5 rounded-full border flex items-center justify-center text-xs",
                            isSelected ? "border-emerald-400 bg-emerald-500 text-white" : "border-slate-700 text-transparent"
                          )}>
                            ✓
                          </div>
                          <div>
                            <p className="text-xs font-black text-white">{srv.nameAr}</p>
                            {srv.descriptionAr && (
                              <p className="text-[10px] text-slate-400 mt-0.5">{srv.descriptionAr}</p>
                            )}
                          </div>
                        </div>

                        <div className="text-left shrink-0 font-mono">
                          {srv.price ? (
                            <p className="text-xs font-black text-emerald-400">{formatCurrency(srv.price)}</p>
                          ) : (
                            <span className="text-[10px] font-bold text-slate-400">خدمة مجانية / قياسية</span>
                          )}
                          <p className="text-[10px] text-slate-500">~{srv.estimatedDurationMins} دقيقة</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Dynamic Summary Callout */}
              <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <p className="text-xs font-black text-white">
                    الخدمة المحددة: <span className="text-emerald-300">{currentSelectedService?.nameAr}</span>
                  </p>
                  <p className="text-[11px] text-slate-400">
                    أمامك في الطابور: <span className="text-emerald-400 font-bold">{currentDeptWaitingCount} عملاء</span> • وقت الانتظار المتوقع: <span className="text-amber-400 font-bold">~{estimatedWaitMins} دقيقة</span>
                  </p>
                </div>
                <div className="text-left shrink-0">
                  <span className="text-xs font-black text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                    كود التذكرة: {currentKioskDept.prefix}-{String(currentKioskDept.lastIssuedNumber + 1).padStart(3, '0')}
                  </span>
                </div>
              </div>

              {/* Submit button */}
              <button
                type="submit"
                className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-xl shadow-emerald-600/25 transition-all active:scale-[0.99]"
              >
                <Ticket size={20} />
                <span>إصدار تذكرة الدور الفورية وإرسال إشعار WhatsApp 📲</span>
              </button>
            </form>
          </div>

          {/* Right Column: Issued Ticket Thermal Voucher & Live WhatsApp Simulator */}
          <div className="lg:col-span-5 space-y-6">
            {lastIssuedTicketAlert ? (
              <div className="bg-[#151b2b] border-2 border-emerald-500/50 rounded-3xl p-6 shadow-2xl space-y-5 animate-fade-in">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold flex items-center gap-1.5">
                    <CheckCircle2 size={14} />
                    <span>تم إصدار التذكرة بنجاح!</span>
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button 
                      onClick={() => alert(`جاري طباعة التذكرة حرارياً للكوبون: ${lastIssuedTicketAlert.ticketCode}`)}
                      className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1"
                      title="طباعة التذكرة"
                    >
                      <Printer size={14} />
                    </button>
                    <a
                      href={`https://wa.me/2${lastIssuedTicketAlert.clientPhone.startsWith('0') ? lastIssuedTicketAlert.clientPhone.substring(1) : lastIssuedTicketAlert.clientPhone}?text=${encodeURIComponent(lastIssuedTicketAlert.whatsAppNotificationsSent[0]?.messageText || '')}`}
                      target="_blank"
                      rel="noreferrer"
                      className="p-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 text-xs flex items-center gap-1"
                      title="إرسال عبر WhatsApp Web مباشرة"
                    >
                      <Share2 size={14} />
                    </a>
                  </div>
                </div>

                {/* Thermal Ticket Print Design */}
                <div className="bg-white text-black p-6 rounded-2xl shadow-xl font-mono text-center space-y-3 relative overflow-hidden border-t-8 border-emerald-600">
                  <div className="border-b-2 border-dashed border-slate-300 pb-2">
                    <p className="font-black text-sm tracking-wider">MARO ENTERPRISE PLATFORM</p>
                    <p className="text-[10px] text-slate-600">{currentProfile.nameAr}</p>
                  </div>

                  <div className="py-2">
                    <p className="text-[11px] font-bold text-slate-600">{lastIssuedTicketAlert.departmentName}</p>
                    <p className="text-4xl font-black text-black tracking-widest my-1">{lastIssuedTicketAlert.ticketCode}</p>
                    <p className="text-xs font-bold text-emerald-800 bg-emerald-50 py-1 px-2 rounded mt-1">
                      {lastIssuedTicketAlert.serviceName || 'خدمة عامة'}
                    </p>
                  </div>

                  <div className="border-t border-b border-dashed border-slate-300 py-2 text-[10px] text-slate-700 space-y-0.5 text-right">
                    <div className="flex justify-between">
                      <span>العميل:</span>
                      <span className="font-bold">{lastIssuedTicketAlert.clientName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>الهاتف:</span>
                      <span>{lastIssuedTicketAlert.clientPhone}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>وقت الإصدار:</span>
                      <span>{lastIssuedTicketAlert.issueTime}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>الترتيب في الطابور:</span>
                      <span className="font-bold text-emerald-700">{lastIssuedTicketAlert.waitingPosition} عميل أمامك</span>
                    </div>
                    {lastIssuedTicketAlert.servicePrice ? (
                      <div className="flex justify-between font-bold text-black border-t border-slate-200 pt-1">
                        <span>قيمة الخدمة:</span>
                        <span>{formatCurrency(lastIssuedTicketAlert.servicePrice)}</span>
                      </div>
                    ) : null}
                  </div>

                  <div className="pt-2 flex flex-col items-center">
                    <div className="w-16 h-16 bg-slate-100 p-1.5 rounded-lg border border-slate-300 flex items-center justify-center">
                      <QrCode size={48} className="text-slate-800" />
                    </div>
                    <p className="text-[9px] text-slate-500 mt-1.5">امسح الكود أو تفقد رسالة WhatsApp لمتابعة دورك</p>
                  </div>
                </div>

                {/* WhatsApp Message Preview */}
                <div className="bg-[#0b141a] p-4 rounded-2xl border border-emerald-900/50 space-y-2 text-right">
                  <div className="flex items-center justify-between text-xs text-emerald-400 font-bold">
                    <div className="flex items-center gap-1.5">
                      <Smartphone size={14} />
                      <span>رسالة WhatsApp المرسلة للعميل:</span>
                    </div>
                    <span className="text-[10px] text-slate-400">الآن • تم التسليم ✓✓</span>
                  </div>
                  <div className="bg-[#005c4b] text-white text-xs p-3.5 rounded-2xl rounded-tr-none leading-relaxed whitespace-pre-line shadow">
                    {lastIssuedTicketAlert.whatsAppNotificationsSent[0]?.messageText}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-[#151b2b] border border-slate-800 rounded-3xl p-8 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto text-slate-500">
                  <Ticket size={32} />
                </div>
                <h3 className="text-base font-black text-white">معاينة التذكرة ورسالة الواتساب</h3>
                <p className="text-xs text-slate-400 leading-relaxed max-w-sm mx-auto">
                  قم بتسجيل بيانات العميل واختيار الخدمة من النموذج لإصدار التذكرة وعرض نموذج الطباعة الحرارية ورسالة WhatsApp الفورية.
                </p>
              </div>
            )}

            {/* Quick Live Queue Snapshot */}
            <div className="bg-[#151b2b] border border-slate-800 rounded-2xl p-5 space-y-3">
              <h4 className="text-xs font-black text-white flex items-center gap-2">
                <Clock className="text-teal-400" size={16} />
                <span>حالة الطوابير الحالية في {currentProfile.nameAr}:</span>
              </h4>
              <div className="space-y-2">
                {departments.map((dept) => {
                  const waiting = tickets.filter(t => t.departmentId === dept.id && t.status === 'WAITING').length;
                  return (
                    <div key={dept.id} className="flex items-center justify-between text-xs bg-[#0f172a] p-2.5 rounded-xl border border-slate-800">
                      <span className="text-slate-300">{dept.nameAr}</span>
                      <span className={cn(
                        "font-bold px-2 py-0.5 rounded text-[11px]",
                        waiting > 0 ? "bg-amber-500/20 text-amber-300" : "bg-emerald-500/20 text-emerald-300"
                      )}>
                        {waiting} في الانتظار
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: OPERATOR COUNTERS & ROOMS */}
      {activeTab === 'counters' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#151b2b] p-4 rounded-2xl border border-slate-800">
            <div>
              <h3 className="text-sm font-black text-white">لوحة تحكم شبابيك وموظفي وأطباء {currentProfile.nameAr}</h3>
              <p className="text-xs text-slate-400">إمكانية نداء العميل التالي، إنهاء الخدمة، وإرسال تنبيهات WhatsApp للمناداة واقتراب الدور</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-400">النشاط:</span>
              <span className="text-xs font-black text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-xl border border-emerald-500/30">
                {currentProfile.nameAr}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {counters.map((counter) => {
              const dept = departments.find(d => d.id === counter.assignedDepartmentId);
              const waitingCount = tickets.filter(t => t.departmentId === counter.assignedDepartmentId && t.status === 'WAITING').length;
              const activeTkt = tickets.find(t => t.ticketCode === counter.currentTicketNumber && t.status === 'IN_SERVICE');

              return (
                <div key={counter.id} className="bg-[#151b2b] border border-slate-800 rounded-3xl p-6 shadow-xl space-y-5 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider block">
                          {counter.counterNumber}
                        </span>
                        <h3 className="text-base font-black text-white">{counter.assignedEmployeeName}</h3>
                        <p className="text-[11px] text-slate-400">{dept?.nameAr}</p>
                      </div>

                      <span className={cn(
                        "px-2.5 py-1 rounded-full text-[10px] font-bold border",
                        counter.status === 'ONLINE_SERVING' ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" : "bg-slate-800 text-slate-400 border-slate-700"
                      )}>
                        {counter.status === 'ONLINE_SERVING' ? 'متاح وقيد الخدمة' : 'في الانتظار'}
                      </span>
                    </div>

                    {/* Active Serving Ticket with Specific Service */}
                    <div className="bg-[#0f172a] p-4 rounded-2xl border border-slate-800 text-center space-y-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">التذكرة المستدعاة حالياً</span>
                      {counter.currentTicketNumber ? (
                        <div className="space-y-1.5">
                          <p className="text-3xl font-black font-mono text-emerald-400 tracking-wider">
                            {counter.currentTicketNumber}
                          </p>
                          <p className="text-xs font-bold text-white">{activeTkt?.clientName || 'عميل كريم'}</p>
                          {activeTkt?.serviceName && (
                            <span className="inline-block text-[11px] font-black text-teal-300 bg-teal-500/10 px-2.5 py-0.5 rounded border border-teal-500/20">
                              {activeTkt.serviceName}
                            </span>
                          )}
                          <p className="text-[10px] text-slate-400">{activeTkt?.clientPhone}</p>
                        </div>
                      ) : (
                        <p className="text-sm font-bold text-slate-500 py-3">لا توجد حالة نشطة حالياً</p>
                      )}
                    </div>

                    <div className="flex justify-between items-center text-xs text-slate-400 pt-1">
                      <span>العملاء في الانتظار بالقسم:</span>
                      <span className="font-bold text-white bg-slate-800 px-2 py-0.5 rounded">{waitingCount} عميل</span>
                    </div>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-slate-800">
                    <button
                      onClick={() => handleCallNext(counter.id)}
                      disabled={waitingCount === 0}
                      className={cn(
                        "w-full py-3 rounded-2xl font-black text-xs flex items-center justify-center gap-2 transition-all shadow-lg",
                        waitingCount > 0 
                          ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20 active:scale-[0.99]" 
                          : "bg-slate-800 text-slate-500 cursor-not-allowed"
                      )}
                    >
                      <Volume2 size={16} />
                      <span>نداء العميل التالي (Call Next & WhatsApp)</span>
                    </button>

                    {counter.currentTicketNumber && (
                      <button
                        onClick={() => handleFinishServing(counter.id)}
                        className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold text-xs transition-all"
                      >
                        إنهاء المعاملة وحفظ السجل ✓
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: CENTRAL TV CALLING DISPLAY */}
      {activeTab === 'tv_screen' && (
        <div className="bg-[#0b101b] border-2 border-emerald-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-8 relative overflow-hidden">
          {activeChime && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-emerald-500 text-black font-black px-6 py-2 rounded-full text-xs sm:text-sm animate-bounce flex items-center gap-2 shadow-2xl z-50">
              <Volume2 size={20} />
              <span>🔔 جاري النداء الصوتي الآلي وإرسال إشعار الواتساب...</span>
            </div>
          )}

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-800 pb-6 gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-600 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-emerald-600/30">
                M
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-wide">
                  MARO CENTRAL CALLING SYSTEM — {currentProfile.nameAr}
                </h2>
                <p className="text-xs text-slate-400">شاشة النداء الفوري والمناداة بالصالات والشبابيك والعيادات</p>
              </div>
            </div>
            <div className="text-left font-mono">
              <p className="text-2xl font-black text-emerald-400">
                {new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </p>
              <p className="text-xs text-slate-500">تحديث فوري مباشر</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {counters.filter(c => c.currentTicketNumber).map((cnt) => {
              const tkt = tickets.find(t => t.ticketCode === cnt.currentTicketNumber);
              return (
                <div key={cnt.id} className="bg-[#151b2b] border-2 border-emerald-500/60 rounded-3xl p-6 shadow-2xl text-center space-y-3 relative">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                    {cnt.counterNumber}
                  </span>
                  <div className="bg-[#0a0f1d] py-6 px-4 rounded-2xl border border-slate-800">
                    <p className="text-5xl font-black font-mono text-emerald-400 tracking-widest animate-pulse">
                      {cnt.currentTicketNumber}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-base font-black text-white">{tkt?.clientName || 'عميل كريم'}</p>
                    <p className="text-xs text-emerald-300 font-bold">{tkt?.departmentName}</p>
                    {tkt?.serviceName && (
                      <p className="text-xs text-teal-400 bg-teal-950/40 py-1 px-2 rounded-lg border border-teal-500/20 font-bold">
                        {tkt.serviceName}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {counters.filter(c => c.currentTicketNumber).length === 0 && (
            <div className="text-center py-12 text-slate-500 space-y-2">
              <Tv size={48} className="mx-auto text-slate-600" />
              <p className="text-sm font-bold">لا توجد نداءات نشطة على الشاشة حالياً</p>
              <p className="text-xs text-slate-600">سيتم عرض أرقام التذاكر والشبابيك تلقائياً عند قيام الموظف بالنداء</p>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: WHATSAPP NOTIFICATIONS LOG */}
      {activeTab === 'whatsapp_log' && (
        <div className="bg-[#151b2b] p-6 rounded-3xl border border-slate-800 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-4 gap-3">
            <div>
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <MessageSquare className="text-emerald-400" size={20} />
                <span>سجل تنبيهات الواتساب الآلية (Automated WhatsApp Notification Feed)</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                تتبع الرسائل التلقائية المرسلة فور إصدار التذكرة واختيار الخدمة، واقتراب الدور، ووقت المناداة
              </p>
            </div>
            <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/20">
              {totalWhatsAppMessages} إشعار مسجل
            </span>
          </div>

          <div className="space-y-4">
            {tickets.map((t) => (
              <div key={t.id} className="bg-[#0f172a] p-5 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm font-black px-2.5 py-1 rounded bg-slate-900 text-emerald-400 border border-slate-700">
                      {t.ticketCode}
                    </span>
                    <div>
                      <h4 className="text-sm font-black text-white">{t.clientName}</h4>
                      <p className="text-xs font-mono text-slate-400">{t.clientPhone} • {t.departmentName}</p>
                      {t.serviceName && (
                        <p className="text-[11px] font-bold text-teal-300 mt-0.5">الخدمة: {t.serviceName}</p>
                      )}
                    </div>
                  </div>

                  <a
                    href={`https://wa.me/2${t.clientPhone.startsWith('0') ? t.clientPhone.substring(1) : t.clientPhone}`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 rounded-xl font-bold text-xs flex items-center gap-1.5 self-start sm:self-auto"
                  >
                    <ExternalLink size={12} /> محادثة مباشرة
                  </a>
                </div>

                <div className="space-y-2 border-t border-slate-800/80 pt-3">
                  {t.whatsAppNotificationsSent.map((n, idx) => (
                    <div key={idx} className="bg-[#151b2b] p-3 rounded-xl border border-slate-800 text-xs flex justify-between items-start gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            "text-[10px] font-bold px-2 py-0.5 rounded",
                            n.type === 'TICKET_ISSUED' ? "bg-blue-500/20 text-blue-300" :
                            n.type === 'TURN_APPROACHING' ? "bg-amber-500/20 text-amber-300" : "bg-emerald-500/20 text-emerald-300"
                          )}>
                            {n.type === 'TICKET_ISSUED' ? 'إصدار تذكرة وحجز خدمة' :
                             n.type === 'TURN_APPROACHING' ? 'اقتراب الدور' : 'نداء الشباك'}
                          </span>
                          <span className="text-[10px] text-slate-500">{n.sentAt}</span>
                        </div>
                        <p className="text-slate-200 whitespace-pre-line text-[11px] leading-relaxed">{n.messageText}</p>
                      </div>
                      <span className="text-emerald-400 font-bold text-[10px] shrink-0">تم التسليم ✓✓</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: CROSS-INDUSTRY INTEGRATION MATRIX */}
      {activeTab === 'integrations' && (
        <div className="space-y-6">
          <div className="bg-[#151b2b] p-6 rounded-3xl border border-slate-800 space-y-4">
            <h3 className="text-lg font-black text-white flex items-center gap-2">
              <Layers className="text-emerald-400" size={22} />
              <span>مصفوفة الربط والتكامل المباشر مع الأنظمة التشغيلية حسب النشاط</span>
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              يرتبط موديول الطوابير والنداء الذكي بشكل تلقائي مع كافة الأنشطة الخدمية والطبية والتجارية لتنظيم حركة العملاء ومنع التكدس وتوفير تجربة رقمية احترافية:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-[#151b2b] border border-slate-800 rounded-2xl p-5 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center">
                <Stethoscope size={20} />
              </div>
              <h4 className="text-base font-black text-white">العيادات والمراكز الطبية والمستشفيات</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                تنظيم طابور كشوفات المرضى، اختيار الطبيب والخدمة الطبية، نداء غرفة الكشف، وإرسال تنبيه بالواتساب عند خروج الحالة السابقة لدخول المريض التالي فوراً.
              </p>
            </div>

            <div className="bg-[#151b2b] border border-slate-800 rounded-2xl p-5 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center">
                <Scissors size={20} />
              </div>
              <h4 className="text-base font-black text-white">صالونات التجميل والكوافير والسبا</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                إدارة طابور الكراسي والغرف وتوزيع الزبائن على المصففين حسب نوع الخدمة المختارة مع إشعار WhatsApp عند جهوزية الكرسي.
              </p>
            </div>

            <div className="bg-[#151b2b] border border-slate-800 rounded-2xl p-5 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
                <Car size={20} />
              </div>
              <h4 className="text-base font-black text-white">مغاسل السيارات والعناية بالمركبات والجراجات</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                حارات الغسيل وتجهيز السيارات، تنبيه العميل فور انتهاء الغسيل أو وصول سيارته من الفاليه للاستلام من البوابة.
              </p>
            </div>

            <div className="bg-[#151b2b] border border-slate-800 rounded-2xl p-5 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center">
                <Plane size={20} />
              </div>
              <h4 className="text-base font-black text-white">شركات السياحة والسفر والحج والعمرة</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                تنظيم شبابيك استلام الجوازات والتأشيرات، وحجوزات تذاكر الطيران وباقات الحج والعمرة.
              </p>
            </div>

            <div className="bg-[#151b2b] border border-slate-800 rounded-2xl p-5 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <Building2 size={20} />
              </div>
              <h4 className="text-base font-black text-white">نقاط البيع POS وخدمة العملاء والصرافة</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                طوابير الخزينة السريعة، المرتجعات، واستبدال البضائع، مع توجيه العميل للشباك الأقل ازدحاماً آلياً.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
