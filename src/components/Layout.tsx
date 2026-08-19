/**
 * @file Layout.tsx
 * @module المكونات القابلة لإعادة الاستخدام (Reusable Components)
 * @description ملف جزء من نظام MARO ERP. الوظيفة: Layout.tsx.
 */
import React, { useState, useEffect, useRef } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Package, 
  Users as UsersIcon, 
  FileText, 
  BarChart3, 
  Settings, 
  LogOut,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Receipt,
  User as UserIcon,
  RotateCcw,
  Warehouse,
  History,
  ShieldCheck,
  Truck,
  Lock,
  ShieldAlert,
  Wallet,
  LayoutTemplate,
  Bell,
  Terminal,
  Factory,
  Boxes,
  Shirt,
  ShoppingBag,
  Smartphone,
  Utensils,
  HeartPulse,
  Car,
  BookOpen,
  Send,
  MessageSquare,
  Store,
  Percent,
  Scissors,
  Dumbbell,
  Baby,
  ParkingSquare,
  Plane,
  Code2,
  Headphones,
  Ship,
  GraduationCap,
  ThermometerSnowflake,
  Brain,
  Layers,
  Activity,
  Database,
  Briefcase,
  Bot,
  ScanLine,
  UserPlus,
  Globe,
  FileSignature,
  Network,
  Printer,
  Scale,
  Compass
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuth } from './AuthProvider';
import { AlertBanner } from './AlertBanner';
import { SyncEngineStatusBadge } from './SyncEngineStatusBadge';
import { useLearningMode } from './learning/LearningModeProvider';
import { AIAgentOverlay } from './AIAgent/AIAgentOverlay';
import { UserManual } from './UserManual';
import { GuidedTour } from './GuidedTour';
import { IndustryModuleEngine } from '../lib/industryModuleEngine';
import { MaroSyncEngine } from '../lib/maroSyncEngine';
import { CustomerPortalOrder } from '../types/customerPortal';
import { SystemTickerBanner } from './SystemTickerBanner';
import { AIPaperScannerModal } from './AIPaperScannerModal';
import { SmartSupportAssistantWidget } from './support/SmartSupportAssistantWidget';
import { CreditCard, Megaphone, Key, Flame, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const Layout: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isManualOpen, setIsManualOpen] = useState(false);
  const [isAIScannerOpen, setIsAIScannerOpen] = useState(false);
  const [pendingOrdersCount, setPendingOrdersCount] = useState(0);
  const [deliveryEnabled, setDeliveryEnabled] = useState(localStorage.getItem('maro_module_delivery_enabled') === 'true');
  const [aiEnabled, setAiEnabled] = useState(localStorage.getItem('maro_module_ai_enabled') !== 'false');
  const { user, logout } = useAuth();
  const profile = { 
    role: user?.role || 'cashier', 
    displayName: user?.displayName || user?.name || user?.email?.split('@')[0] || 'مستخدم النظام' 
  };
  const navigate = useNavigate();
  const { isLearningModeEnabled, toggleLearningMode } = useLearningMode();

  // Spotlight global search state
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [selectedSearchIndex, setSelectedSearchIndex] = useState(0);

  // Keyboard shortcut listener (Ctrl+K or /)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') {
        if (e.key === 'Escape' && document.activeElement === searchInputRef.current) {
          searchInputRef.current.blur();
          setIsSearchFocused(false);
        }
        return;
      }
      if ((e.ctrlKey && e.key === 'k') || e.key === '/') {
        e.preventDefault();
        searchInputRef.current?.focus();
        setIsSearchFocused(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    const handleModulesChange = () => {
      setDeliveryEnabled(localStorage.getItem('maro_module_delivery_enabled') === 'true');
      setAiEnabled(localStorage.getItem('maro_module_ai_enabled') !== 'false');
    };
    window.addEventListener('maro_modules_changed', handleModulesChange);
    return () => window.removeEventListener('maro_modules_changed', handleModulesChange);
  }, []);

  useEffect(() => {
    const unsub = MaroSyncEngine.subscribe<CustomerPortalOrder>('customer_portal_orders', (orders) => {
      const pending = (orders || []).filter(o => o.status === 'PENDING_REVIEW').length;
      setPendingOrdersCount(pending);
    });
    return () => unsub();
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getModuleIcon = (iconName: string) => {
    switch (iconName) {
      case 'ShoppingBag': return ShoppingBag;
      case 'Shirt': return Shirt;
      case 'Smartphone': return Smartphone;
      case 'Utensils': return Utensils;
      case 'HeartPulse': return HeartPulse;
      case 'Car': return Car;
      case 'Factory': return Factory;
      case 'GraduationCap': return GraduationCap;
      case 'ThermometerSnowflake': return ThermometerSnowflake;
      case 'Scissors': return Scissors;
      case 'Dumbbell': return Dumbbell;
      case 'Baby': return Baby;
      case 'ParkingSquare': return ParkingSquare;
      case 'Plane': return Plane;
      case 'Ship': return Ship;
      case 'MessageSquare': return MessageSquare;
      case 'ScanLine': return ScanLine;
      case 'Flame': return Flame;
      default: return Boxes;
    }
  };

  const activeIndustryKey = localStorage.getItem('maro_business_industry') || 'all';

  // Dynamic industry modules active from Developer Console, filtered to ONLY show the active activity
  const activeIndustryModules = IndustryModuleEngine.getActiveModules().filter(m => {
    if (activeIndustryKey === 'all') return true;
    if (activeIndustryKey === 'ceramics' && m.id === 'CERAMICS_SANITARY') return true;
    if (activeIndustryKey === 'food' && m.id === 'FOOD_SUPERMARKET') return true;
    if (activeIndustryKey === 'electronics' && m.id === 'ELECTRONICS_MAINTENANCE') return true;
    if (activeIndustryKey === 'gas_station' && m.id === 'FUEL_STATION') return true;
    return false;
  });

  const activeActivityNameAr = (() => {
    switch (activeIndustryKey) {
      case 'ceramics': return 'سيراميك وأدوات صحية 🏺';
      case 'food': return 'المواد الغذائية والسوبرماركت 🛒';
      case 'electronics': return 'الأجهزة والإلكترونيات والصيانة 💻';
      case 'gas_station': return 'محطة الوقود والتموين ⛽️';
      default: return 'المنظومة الشاملة 🌐';
    }
  })();

  const companyName = 'شركة مارو للأعمال';
  const branchName = 'الفرع الرئيسي (القاهرة)';

  const navSections = [
    {
      title: 'الرئيسية ولوحات القيادة',
      items: [
        { name: 'لوحة التحكم العامة', path: '/', icon: LayoutDashboard },
      ]
    },
    {
      title: 'المبيعات ونقاط البيع',
      items: [
        { name: 'نقطة البيع السريعة (POS)', path: '/pos', icon: ShoppingCart },
        { name: 'فواتير المبيعات وعروض الأسعار', path: '/invoices', icon: FileText },
        { 
          name: 'فواتير الجملة وطلبات العملاء (B2B)', 
          path: '/wholesale-invoices', 
          icon: Layers,
          badge: pendingOrdersCount > 0 ? pendingOrdersCount : undefined
        },
        { name: 'إدارة الورديات وتغطية الكاميرات (CCTV)', path: '/cashier-sessions', icon: ShieldAlert },
        { name: 'استديو ومقارنة نماذج كاشير (POS Models)', path: '/pos-models', icon: LayoutTemplate },
        { name: 'إدارة المبيعات المتقدمة والعروض', path: '/advanced-sales', icon: Percent },
        { name: 'مرتجعات المبيعات', path: '/returns', icon: RotateCcw },
      ]
    },
    {
      title: 'المشتريات والموردين',
      items: [
        { name: 'فواتير المشتريات والموردين', path: '/bills', icon: Receipt },
        { name: 'دليل وحسابات الموردين', path: '/suppliers', icon: Truck },
        { name: 'إدارة المشتريات والعقود', path: '/procurement', icon: FileSignature },
        { name: 'مرتجعات المشتريات', path: '/purchase-returns', icon: RotateCcw },
      ]
    },
    {
      title: 'المخزون وسلاسل الإمداد',
      items: [
        { name: 'دليل المنتجات والأصناف', path: '/products', icon: Package },
        { name: 'حركة وتتبع المخزون والجرد', path: '/inventory', icon: History },
        { name: 'المخازن والمستودعات', path: '/warehouses', icon: Warehouse },
        { name: 'أرصدة أول المدة والأسعار', path: '/opening-balances', icon: Boxes },
        { name: 'طباعة الباركود والموازين والطابعات', path: '/hardware-thermal-barcode', icon: Printer },
        { name: 'إدارة الأصول والأسطول', path: '/assets-fleet', icon: Truck },
      ]
    },
    {
      title: 'المالية والخزائن والحسابات',
      items: [
        { name: 'الخزائن والبنوك', path: '/accounting/treasury-banks', icon: Wallet },
        { name: 'الحسابات وقيود اليومية العامة', path: '/transactions', icon: Wallet },
        { name: 'الفوترة الإلكترونية (ZATCA)', path: '/zatca', icon: ShieldCheck },
        { name: 'التقارير المالية والتحليلات', path: '/reports', icon: BarChart3 },
        { name: 'التقارير المتقدمة وذكاء الأعمال (BI)', path: '/advanced-reporting', icon: BarChart3 },
      ]
    },
    {
      title: 'العملاء والموارد البشرية والتوصيل',
      items: [
        { name: 'حسابات العملاء والمديونيات', path: '/customers', icon: UsersIcon },
        { name: 'إدارة علاقات العملاء والمشاريع', path: '/crm-projects', icon: Briefcase },
        { name: 'الموارد البشرية والرواتب', path: '/hr-payroll', icon: UserPlus },
        { name: 'المناديب وطيارين التوصيل', path: '/reps', icon: Truck },
        { name: 'التجارة الإلكترونية والربط', path: '/ecommerce', icon: Globe },
      ]
    },
    {
      title: 'التصنيع والأنشطة المتخصصة',
      items: [
        { name: 'التصنيع وتكاليف الإنتاج (MRP)', path: '/manufacturing', icon: Factory },
        { name: 'بوابة الأنشطة التجارية المتخصصة', path: '/industries/hub', icon: Layers },
        { name: 'إدارة الفروع والامتياز التجاري', path: '/branches', icon: Network },
      ]
    },
    {
      title: 'الذكاء الاصطناعي والأتمتة الذكية',
      items: [
        ...(aiEnabled ? [
          { name: 'وكلاء الذكاء الاصطناعي (AI Agents)', path: '/ai-agents', icon: Bot },
          { name: 'محرك سير العمل الذكي', path: '/workflow-engine', icon: Activity },
          { name: 'مسح وإدارة الوثائق والـ OCR', path: '/documents-ocr', icon: ScanLine }
        ] : []),
        { name: 'لوحة تفعيل المديولات المساعدة', path: '/assistant-modules', icon: Sparkles },
        { name: 'كشك فحص الأسعار وهاند تيرمينال (PDA)', path: '/industries/price-checker', icon: ScanLine },
        { name: 'تنبيهات وطلبيات الواتساب', path: '/notifications/whatsapp', icon: MessageSquare },
        { name: 'مركز التنبيهات والرقابة', path: '/alerts', icon: Bell, adminOnly: true },
      ]
    },
    {
      title: 'الإدارة والأمان والترخيص',
      items: [
        { name: 'الإعدادات العامة للشركة', path: '/settings', icon: Settings },
        { name: 'النسخ الاحتياطي واستعادة البيانات', path: '/settings?tab=database', icon: Database, adminOnly: true },
        { name: 'تصفير وإعادة تهيئة النظام (System Reset)', path: '/settings?tab=database', icon: RotateCcw, adminOnly: true },
        { name: 'منصة تكييف الأنشطة (Adaptive ERP)', path: '/adaptive-erp', icon: Layers, adminOnly: true },
        { name: 'إدارة المستخدمين والصلاحيات', path: '/users', icon: ShieldCheck, adminOnly: true },
        { name: 'إدارة الأدوار (RBAC)', path: '/settings/security/roles', icon: Lock, adminOnly: true },
        { name: 'سجل المراجعة والرقابة (Audit)', path: '/settings/security/audit', icon: ShieldAlert, adminOnly: true },
        { name: 'تفعيل وترخيص المنظومة والواتساب', path: '/settings/license', icon: Key, adminOnly: true },
        { name: 'أنظمة وطرق البيع والدفع', path: '/settings/payment-methods', icon: CreditCard, adminOnly: true },
        { name: 'إعدادات الفواتير والضرائب', path: '/settings/invoices', icon: FileText, adminOnly: true },
        { name: 'مخططات الشاشة (POS Layout)', path: '/settings/pos/layout', icon: LayoutTemplate, adminOnly: true },
      ]
    },
    {
      title: 'بيئة المطورين والـ DevOps',
      items: [
        { name: 'حزمة الذكاء الاصطناعي العالمية', path: '/next-gen-suite', icon: Brain, adminOnly: true },
        { name: 'لوحة المطور (Developer Console)', path: '/developer/console', icon: Terminal, adminOnly: true },
        { name: 'متجر ومجتمع المطورين والشركاء (Odoo Hub)', path: '/developer/hub', icon: Code2, adminOnly: true },
        { name: 'الدعم الفني الذكي وبوت الواتساب', path: '/support/center', icon: Headphones, adminOnly: true },
        { name: 'إدارة فريق العمل ودورة المهام', path: '/team/workflow', icon: UsersIcon, adminOnly: true },
      ]
    }
  ];

  const currentPath = window.location.pathname;
  const CASHIER_ALLOWED_PATHS = [
    '/pos',
    '/wholesale-invoices',
    '/invoices',
    '/pos-models',
    '/smart-cashier',
    '/cashier-sessions',
    '/sessions',
    '/products'
  ];

  useEffect(() => {
    if (profile.role === 'cashier' && !CASHIER_ALLOWED_PATHS.includes(currentPath)) {
      navigate('/pos', { replace: true });
    }
  }, [profile.role, currentPath, navigate]);

  const bizSize = localStorage.getItem('maro_business_size') || 'enterprise';

  // Compute allowed search items dynamically based on current user role & business size permissions
  const allowedSearchItems = navSections
    .filter(section => {
      if (bizSize === 'small') {
        if (['التصنيع والإنتاج', 'الأتمتة والذكاء الاصطناعي'].includes(section.title)) {
          return false;
        }
      }
      return true;
    })
    .flatMap(section => {
      let items = section.items.filter(item => !(item as any).adminOnly || profile?.role === 'admin' || profile?.role === 'developer');
      
      if (profile?.role === 'cashier') {
        items = items.filter(item => CASHIER_ALLOWED_PATHS.includes(item.path));
      } else if (profile?.role === 'accountant') {
        const adminOnlyPaths = [
          '/users', 
          '/settings/security/roles', 
          '/settings/security/audit', 
          '/settings/license', 
          '/developer/console', 
          '/developer/hub',
          '/next-gen-suite'
        ];
        items = items.filter(item => !adminOnlyPaths.includes(item.path));
      }

      if (bizSize === 'small') {
        const hiddenPathsForSmall = [
          '/wholesale-invoices', 
          '/assets-fleet', 
          '/manufacturing', 
          '/production-mrp', 
          '/advanced-sales',
          '/zatca',
          '/advanced-reporting',
          '/ecommerce',
          '/procurement',
          '/b2b-portal',
          '/hr-payroll',
          '/branches',
          '/adaptive-erp'
        ];
        items = items.filter(item => !hiddenPathsForSmall.includes(item.path));
      } else {
        items = items.filter(item => item.path !== '/smart-cashier');
      }
      return items;
    });

  const searchMatches = searchQuery.trim() === ''
    ? []
    : allowedSearchItems.filter(item => 
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.path.toLowerCase().includes(searchQuery.toLowerCase())
      );

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (searchMatches.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedSearchIndex(prev => (prev + 1) % searchMatches.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedSearchIndex(prev => (prev - 1 + searchMatches.length) % searchMatches.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const targetItem = searchMatches[selectedSearchIndex];
      if (targetItem) {
        navigate(targetItem.path);
        setSearchQuery('');
        setIsSearchFocused(false);
        searchInputRef.current?.blur();
      }
    } else if (e.key === 'Escape') {
      setIsSearchFocused(false);
      searchInputRef.current?.blur();
    }
  };

  const allItems = navSections.flatMap(section => section.items);
  const currentPageName = allItems.find(item => item.path === currentPath)?.name || 'لوحة التحكم';

  return (
    <div className="flex h-screen bg-[#0b0f1a] overflow-hidden text-slate-200">
      <UserManual isOpen={isManualOpen} onClose={() => setIsManualOpen(false)} />
      {isAIScannerOpen && <AIPaperScannerModal onClose={() => setIsAIScannerOpen(false)} />}
      <GuidedTour />
      
      {/* Main Content (Left) */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top System Ticker Banner */}
        {window.location.pathname !== '/pos' && <SystemTickerBanner position="top" />}

        <header className="h-16 bg-[#0f172a] border-b border-[#1e293b] flex items-center justify-between px-4 md:px-8">
          <div className="flex items-center gap-3 overflow-hidden">
            <h1 className="text-sm md:text-base lg:text-lg font-black text-white truncate shrink-0">
              {currentPageName}
            </h1>
            
            {/* Enterprise context displays (Elegant on large screens, automatically hidden on mobile/small tablets) */}
            <div className="hidden lg:flex items-center gap-2 border-r border-slate-800 pr-3 mr-1 shrink-0">
              <span className="px-2.5 py-1 bg-blue-500/10 border border-blue-500/20 text-blue-300 rounded-lg text-xs font-black select-none">
                🏢 {companyName}
              </span>
              <span className="px-2.5 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-300 rounded-lg text-xs font-black select-none">
                ⚙️ النشاط: {activeActivityNameAr}
              </span>
              <span className="px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 rounded-lg text-xs font-black select-none">
                📍 {branchName}
              </span>
            </div>

            <div className="text-[10px] md:text-xs text-slate-500 font-bold hidden xl:inline-block shrink-0">
              {new Intl.DateTimeFormat('ar-EG', { dateStyle: 'full' }).format(new Date())}
            </div>
          </div>

          {/* Global Spotlight Search Bar */}
          <div className="relative flex-1 max-w-xs md:max-w-md mx-6 hidden md:block">
            <div className="relative flex items-center bg-slate-900/60 border border-slate-800 focus-within:border-blue-500/50 rounded-xl transition-all px-3 py-1.5 gap-2">
              <Search size={14} className="text-slate-500" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setSelectedSearchIndex(0);
                }}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => {
                  // Small delay to allow clicking a dropdown item
                  setTimeout(() => setIsSearchFocused(false), 200);
                }}
                onKeyDown={handleSearchKeyDown}
                placeholder="ابحث عن أي شاشة أو موديول... (Ctrl+K)"
                className="bg-transparent text-xs text-white placeholder-slate-500 outline-none w-full text-right"
                dir="rtl"
              />
              <span className="text-[9px] font-bold text-slate-500 bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700/60 font-mono select-none">
                Ctrl+K
              </span>
            </div>

            {/* Dropdown Results */}
            <AnimatePresence>
              {isSearchFocused && searchMatches.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute top-12 left-0 right-0 bg-[#0f172a] border border-[#1e293b] rounded-2xl shadow-2xl overflow-hidden z-50 p-2 space-y-1"
                >
                  <p className="text-[10px] text-slate-500 px-2 pb-1.5 border-b border-slate-800 text-right font-black">
                    نتائج البحث ({searchMatches.length})
                  </p>
                  <div className="max-h-60 overflow-y-auto space-y-0.5">
                    {searchMatches.map((item, idx) => {
                      const Icon = item.icon;
                      return (
                        <button
                          key={`${item.name}-${item.path}`}
                          onMouseDown={() => {
                            navigate(item.path);
                            setSearchQuery('');
                          }}
                          className={cn(
                            "w-full px-3 py-2 rounded-xl flex items-center justify-between text-xs transition-all text-right",
                            idx === selectedSearchIndex
                              ? "bg-gradient-to-r from-blue-600/20 to-indigo-600/10 text-blue-300 border-r-2 border-blue-500 font-bold"
                              : "text-slate-400 hover:bg-slate-800/60 hover:text-white"
                          )}
                        >
                          <span className="text-[10px] text-slate-500 font-mono" dir="ltr">
                            {item.path}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="font-bold">{item.name}</span>
                            <Icon size={14} className="text-slate-500" />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <div className="flex items-center gap-1.5 md:gap-3 shrink-0">
            {(() => {
              const isPharmActive = activeIndustryModules.some(m => m.id === 'PHARMACY_MEDICAL');
              return (
                <button
                  onClick={() => setIsAIScannerOpen(true)}
                  className="px-2 sm:px-3.5 py-1.5 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-purple-600/20 flex items-center gap-1.5 transition-all cursor-pointer"
                  title={isPharmActive ? "القارئ البصري الذكي للروشتات والفواتير الورقية" : "القارئ البصري الذكي لفواتير المشتريات الورقية"}
                >
                  <Sparkles size={14} />
                  <span className="hidden sm:inline">{isPharmActive ? 'قراءة بالـ AI' : 'قراءة فاتورة بالـ AI'}</span>
                </button>
              );
            })()}
            <button
              onClick={() => window.dispatchEvent(new CustomEvent('maro:open-tour'))}
              id="btn-header-screen-tour"
              className="px-2 sm:px-3 py-1.5 bg-gradient-to-r from-blue-600/30 to-indigo-600/30 hover:from-blue-600/50 hover:to-indigo-600/50 text-blue-300 hover:text-white border border-blue-500/40 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm shadow-blue-500/10 cursor-pointer"
              title="الجولة التعليمية وشرح هذه الشاشة (F1)"
            >
              <Compass size={14} className="text-blue-400 animate-spin-slow" />
              <span className="hidden md:inline">جولة تعليمية</span>
              <span className="bg-blue-500/30 text-blue-200 text-[10px] px-1.5 py-0.5 rounded font-mono hidden lg:inline-block">F1</span>
            </button>
            <button onClick={() => setIsManualOpen(true)} className='p-1.5 sm:p-2 rounded-full text-slate-400 hover:bg-slate-800 hover:text-white' title='دليل المستخدم الشامل'><BookOpen size={18} /></button>
            <button onClick={toggleLearningMode} className={cn('p-1.5 sm:p-2 rounded-full transition-colors relative', isLearningModeEnabled ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-400 hover:bg-slate-800 hover:text-white')} title='وضع التعلم الذكي والمساعدة'><BookOpen size={18} />{isLearningModeEnabled && <span className='absolute top-0 right-0 w-2 h-2 bg-emerald-500 rounded-full border-2 border-[#0f172a]'></span>}</button>
            <SyncEngineStatusBadge />
          </div>
        </header>
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          {profile.role === 'cashier' && !CASHIER_ALLOWED_PATHS.includes(currentPath) ? (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
              <div className="p-4 bg-red-500/10 border border-red-500/30 text-red-400 rounded-3xl mb-4">
                <ShieldAlert size={48} />
              </div>
              <h2 className="text-xl font-black text-white mb-2">عفواً، هذه الشاشة مخصصة للمديرين والمشرفين فقط</h2>
              <p className="text-xs text-slate-400 max-w-md mb-6">تم تقييد الوصول لهذه الشاشة لأن صلاحية حسابك الحالية هي (كاشير مبيعات). يرجى التوجه لصفحة نقاط البيع.</p>
              <button 
                onClick={() => navigate('/pos')} 
                className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-black text-xs rounded-xl shadow-lg shadow-blue-600/30 cursor-pointer"
              >
                الذهاب لنقطة البيع السريعة (POS)
              </button>
            </div>
          ) : (
            <Outlet />
          )}
        </div>
        
        {/* Bottom System Ticker Banner */}
        {window.location.pathname !== '/pos' && <SystemTickerBanner position="bottom" />}

        <AlertBanner />
        <AIAgentOverlay />
        <SmartSupportAssistantWidget />
      </main>

      {/* Sidebar (Right) */}
      <aside 
        className={cn(
          "bg-[#0f172a] border-r border-[#1e293b] transition-all duration-300 flex flex-col z-20",
          isSidebarOpen ? "w-64" : "w-20"
        )}
      >
        <div className="p-5 flex items-center justify-between border-b border-[#1e293b]">
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-1.5 hover:bg-slate-800 rounded-xl text-slate-400"
          >
            {isSidebarOpen ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
          </button>
          {isSidebarOpen && (
            <div className="flex items-center gap-2.5">
              <div className="text-right">
                <span className="font-black text-base text-white tracking-tight">MARO ERP</span>
                <span className="block text-[9px] text-blue-400 font-bold uppercase tracking-wider">Business Platform v4.0</span>
              </div>
              <div className="w-8 h-8 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/30">
                <span className="text-white font-black text-lg">M</span>
              </div>
            </div>
          )}
        </div>

        <nav className="flex-1 px-3 py-4 space-y-5 overflow-y-auto">
          {navSections.map((section) => {
            const bizSize = localStorage.getItem('maro_business_size') || 'enterprise';
            
            // Hide specific modules/sections for small shops to maintain a compact, user-friendly cashier flow
            if (bizSize === 'small') {
              if (['التصنيع والإنتاج', 'الأتمتة والذكاء الاصطناعي'].includes(section.title)) {
                return null;
              }
            }

            let filteredItems = section.items.filter(item => !(item as any).adminOnly || profile?.role === 'admin' || profile?.role === 'developer');

            if (profile?.role === 'cashier') {
              filteredItems = filteredItems.filter(item => CASHIER_ALLOWED_PATHS.includes(item.path));
            } else if (profile?.role === 'accountant') {
              const adminOnlyPaths = [
                '/users', 
                '/settings/security/roles', 
                '/settings/security/audit', 
                '/settings/license', 
                '/developer/console', 
                '/developer/hub',
                '/next-gen-suite'
              ];
              filteredItems = filteredItems.filter(item => !adminOnlyPaths.includes(item.path));
            }

            if (bizSize === 'small') {
              // Exclude heavy multi-branch/enterprise routes
              const hiddenPathsForSmall = [
                '/wholesale-invoices', 
                '/assets-fleet', 
                '/manufacturing', 
                '/production-mrp', 
                '/advanced-sales',
                '/zatca',
                '/advanced-reporting',
                '/ecommerce',
                '/procurement',
                '/b2b-portal',
                '/hr-payroll',
                '/branches',
                '/adaptive-erp'
              ];
              filteredItems = filteredItems.filter(item => !hiddenPathsForSmall.includes(item.path));
            } else {
              // For Large Enterprise, hide the tiny shop's Smart Cashier to prevent clutter
              filteredItems = filteredItems.filter(item => item.path !== '/smart-cashier');
            }

            if (filteredItems.length === 0) return null;
            return (
              <div key={section.title} className="space-y-1">
                {isSidebarOpen && (
                  <h3 className="px-3 mb-1.5 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">
                    {section.title}
                  </h3>
                )}
                <div className="space-y-0.5">
                  {filteredItems.map((item) => (
                    <NavLink
                      key={`${item.name}-${item.path}`}
                      to={item.path}
                      className={({ isActive }) => cn(
                        "flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-all group text-xs font-semibold",
                        isActive 
                          ? "bg-gradient-to-r from-blue-600/20 to-indigo-600/10 text-blue-300 border-r-2 border-blue-500 font-bold" 
                          : "text-slate-400 hover:bg-slate-800/60 hover:text-white"
                      )}
                    >
                      {(item as any).badge !== undefined && (
                        <span className="px-1.5 py-0.5 text-[10px] font-black bg-amber-500 text-slate-950 rounded-full animate-pulse">
                          {(item as any).badge}
                        </span>
                      )}
                      {isSidebarOpen && <span className="flex-1 text-right truncate">{item.name}</span>}
                      <item.icon size={18} className={cn(
                        "transition-colors shrink-0",
                        isSidebarOpen ? "" : "mx-auto"
                      )} />
                    </NavLink>
                  ))}
                </div>
              </div>
            );
          })}
        </nav>

        <div className="p-3 border-t border-[#1e293b]">
          <div className={cn(
            "flex items-center gap-2.5 px-3 py-2 rounded-xl bg-slate-800/40 border border-slate-700/50",
            isSidebarOpen ? "" : "justify-center"
          )}>
            {isSidebarOpen && (
              <div className="flex-1 min-w-0 text-right">
                <p className="text-xs font-bold text-white truncate">
                  {profile?.displayName || user?.email?.split('@')[0]}
                </p>
                <p className="text-[10px] text-emerald-400 font-bold tracking-wider">
                  {profile?.role === 'admin' ? 'مدير النظام (Owner)' : 'محاسب عام'}
                </p>
              </div>
            )}
            <div className="w-8 h-8 bg-blue-600/20 text-blue-400 rounded-lg flex items-center justify-center border border-blue-500/30">
              <UserIcon size={16} />
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className={cn(
              "mt-2 flex items-center gap-2 w-full px-3 py-2 text-red-400 hover:bg-red-500/10 rounded-xl transition-colors text-xs font-bold",
              isSidebarOpen ? "flex-row-reverse" : "justify-center"
            )}
          >
            <LogOut size={16} />
            {isSidebarOpen && <span className="flex-1 text-right">تسجيل الخروج</span>}
          </button>
        </div>
      </aside>
    </div>
  );
};
