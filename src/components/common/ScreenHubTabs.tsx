/**
 * @file ScreenHubTabs.tsx
 * @description شريط تبويبات تنقل علوي موحد وسلس يجمع الشاشات المترابطة معاً لمنع التشتت وتسهيل الحركة
 */

import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { 
  ShoppingCart, FileText, RotateCcw, Layers, Percent, 
  Package, Warehouse, History, Boxes, Printer, Truck,
  Receipt, Users, FileSignature, Wallet, BarChart3, ShieldCheck,
  Settings, Key, ShieldAlert, Lock, UserCheck, Smartphone, Megaphone,
  Briefcase, Globe, UserPlus, Factory, Bot, Activity, ScanLine, Sparkles, Headphones
} from 'lucide-react';

export type HubCategory = 'sales' | 'inventory' | 'purchases' | 'accounting' | 'crm' | 'settings' | 'ai';

interface HubTabItem {
  name: string;
  path: string;
  icon: React.ElementType;
  badge?: string | number;
}

const HUB_DEFINITIONS: Record<HubCategory, { title: string; subtitle: string; tabs: HubTabItem[] }> = {
  sales: {
    title: 'مركز المبيعات ونقاط البيع المتكامل (Sales & POS Hub)',
    subtitle: 'إدارة الفواتير، عروض الأسعار، نقاط البيع السريعة، المرتجعات، وطلبات الجملة',
    tabs: [
      { name: 'فواتير المبيعات وعروض الأسعار', path: '/invoices', icon: FileText },
      { name: 'نقطة البيع السريعة (POS)', path: '/pos', icon: ShoppingCart },
      { name: 'طلبات الجملة و B2B', path: '/wholesale-invoices', icon: Layers },
      { name: 'مرتجعات المبيعات', path: '/returns', icon: RotateCcw },
      { name: 'الورديات وكاميرات الكاشير', path: '/cashier-sessions', icon: ShieldCheck },
      { name: 'العروض والخصومات', path: '/advanced-sales', icon: Percent },
      { name: 'استديو نماذج POS', path: '/pos-models', icon: Layers }
    ]
  },
  purchases: {
    title: 'مركز المشتريات والموردين (Procurement Hub)',
    subtitle: 'متابعة فواتير الشراء، حسابات الموردين، أوامر التوريد، والمرتجعات',
    tabs: [
      { name: 'فواتير المشتريات', path: '/bills', icon: Receipt },
      { name: 'دليل وحسابات الموردين', path: '/suppliers', icon: Users },
      { name: 'إدارة المشتريات والعقود', path: '/procurement', icon: FileSignature },
      { name: 'مرتجعات المشتريات', path: '/purchase-returns', icon: RotateCcw }
    ]
  },
  inventory: {
    title: 'مركز المخزون وسلاسل الإمداد (Inventory Hub)',
    subtitle: 'دليل الأصناف، حركة المخزون والجرد، المستودعات، الأرصدة الافتتاحية، وأجهزة الباركود',
    tabs: [
      { name: 'دليل المنتجات والأصناف', path: '/products', icon: Package },
      { name: 'حركة وتتبع المخزون', path: '/inventory', icon: History },
      { name: 'المخازن والمستودعات', path: '/warehouses', icon: Warehouse },
      { name: 'أرصدة أول المدة والأسعار', path: '/opening-balances', icon: Boxes },
      { name: 'طباعة الباركود والموازين', path: '/hardware-thermal-barcode', icon: Printer },
      { name: 'إدارة الأصول والأسطول', path: '/assets-fleet', icon: Truck }
    ]
  },
  accounting: {
    title: 'المركز المالي والحسابات العامة (Financials & Treasury Hub)',
    subtitle: 'الخزائن، البنوك، قيود اليومية، الفوترة الإلكترونية، والتقارير المالية و BI',
    tabs: [
      { name: 'الخزائن والبنوك', path: '/accounting/treasury-banks', icon: Wallet },
      { name: 'قيود اليومية ودفتر الأستاذ', path: '/transactions', icon: FileText },
      { name: 'الفوترة الإلكترونية (ZATCA)', path: '/zatca', icon: ShieldCheck },
      { name: 'التقارير المالية والتحليلات', path: '/reports', icon: BarChart3 },
      { name: 'ذكاء الأعمال المتقدم (BI)', path: '/advanced-reporting', icon: BarChart3 }
    ]
  },
  crm: {
    title: 'مركز العملاء والمشاريع والموارد البشرية (CRM & Workforce Hub)',
    subtitle: 'حسابات العملاء، خطوط سير المناديب، المشاريع، الموظفين والرواتب',
    tabs: [
      { name: 'حسابات ومديونيات العملاء', path: '/customers', icon: Users },
      { name: 'إدارة علاقات العملاء والمشاريع', path: '/crm-projects', icon: Briefcase },
      { name: 'المناديب وطيارين التوصيل', path: '/reps', icon: Truck },
      { name: 'الموارد البشرية والرواتب', path: '/hr-payroll', icon: UserPlus },
      { name: 'التجارة الإلكترونية', path: '/ecommerce', icon: Globe }
    ]
  },
  settings: {
    title: 'مركز الإدارة والأمان والترخيص (Administration & Security Hub)',
    subtitle: 'الإعدادات العامة، الصلاحيات والأدوار، سجل المراجعة، وتراخيص المنظومة',
    tabs: [
      { name: 'الإعدادات العامة للشركة', path: '/settings', icon: Settings },
      { name: 'إعدادات الفواتير والضرائب', path: '/settings/invoices', icon: FileText },
      { name: 'طرق البيع والدفع', path: '/settings/payment-methods', icon: Wallet },
      { name: 'مخططات شاشات POS', path: '/settings/pos/layout', icon: Layers },
      { name: 'إدارة المستخدمين', path: '/users', icon: UserCheck },
      { name: 'إدارة الأدوار (RBAC)', path: '/settings/security/roles', icon: Lock },
      { name: 'سجل الرقابة والأمان', path: '/settings/security/audit', icon: ShieldAlert },
      { name: 'تفعيل وترخيص المنظومة', path: '/settings/license', icon: Key },
      { name: 'الدعم الفني الذكي', path: '/support', icon: Headphones }
    ]
  },
  ai: {
    title: 'مركز الذكاء الاصطناعي والأتمتة (AI & Automation Hub)',
    subtitle: 'وكلاء الذكاء الاصطناعي، محرك سير العمل، قارئ المستندات OCR، والمساعد الذكي',
    tabs: [
      { name: 'وكلاء الذكاء الاصطناعي (AI Agents)', path: '/ai-agents', icon: Bot },
      { name: 'محرك سير العمل الذكي', path: '/workflow-engine', icon: Activity },
      { name: 'مسح وإدارة الوثائق والـ OCR', path: '/documents-ocr', icon: ScanLine },
      { name: 'المديولات المساعدة الذكية', path: '/assistant-modules', icon: Sparkles }
    ]
  }
};

interface ScreenHubTabsProps {
  hub: HubCategory;
  className?: string;
}

export const ScreenHubTabs: React.FC<ScreenHubTabsProps> = ({ hub, className }) => {
  const location = useLocation();
  const def = HUB_DEFINITIONS[hub];
  if (!def) return null;

  return (
    <div className={cn("bg-[#151b2b] border border-[#1e293b] rounded-2xl p-3 mb-6 shadow-lg", className)} dir="rtl">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-2 mb-3 px-2 pb-2 border-b border-[#1e293b]/70">
        <div>
          <h2 className="text-xs font-black text-white flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
            {def.title}
          </h2>
          <p className="text-[10px] text-slate-400 mt-0.5">{def.subtitle}</p>
        </div>
      </div>

      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-slate-800">
        {def.tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = location.pathname === tab.path;

          return (
            <NavLink
              key={tab.path}
              to={tab.path}
              className={cn(
                "flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all select-none shrink-0",
                isActive
                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-900/30 font-black scale-[1.02]"
                  : "bg-[#0b0f1a] text-slate-400 hover:text-white hover:bg-slate-800/80 border border-[#1e293b]"
              )}
            >
              <Icon size={14} className={isActive ? "text-white" : "text-slate-400"} />
              <span>{tab.name}</span>
              {tab.badge && (
                <span className="px-1.5 py-0.2 bg-amber-500 text-slate-950 text-[9px] font-black rounded-full">
                  {tab.badge}
                </span>
              )}
            </NavLink>
          );
        })}
      </div>
    </div>
  );
};
