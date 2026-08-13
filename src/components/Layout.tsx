import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { 
  BarChart3,
  LayoutDashboard, 
  Package, 
  Users as UsersIcon, 
  Truck, 
  FileText, 
  Receipt, 
  Wallet, 
  MessageSquare, 
  Settings, 
  LogOut, 
  Menu, 
  X,
  User as UserIcon,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  LayoutTemplate,
  ShoppingCart,
  ShieldCheck,
  History,
  Warehouse,
  RotateCcw,
  Bell,
  ShieldAlert,
  Lock,
  Terminal
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuth } from './AuthProvider';
import { AlertBanner } from './AlertBanner';
import { SyncEngineStatusBadge } from './SyncEngineStatusBadge';
import { useLearningMode } from './learning/LearningModeProvider';
import { BookOpen } from 'lucide-react';

import { AIAgentOverlay } from './AIAgent/AIAgentOverlay';
import { UserManual } from './UserManual';
import { GuidedTour } from './GuidedTour';

const navSections = [
  {
    title: 'الرئيسية',
    items: [
      { name: 'لوحة التحكم', path: '/', icon: LayoutDashboard },
      { name: 'نقطة البيع', path: '/pos', icon: ShoppingCart },
    ]
  },
  {
    title: 'المخزون والمبيعات',
    items: [
      { name: 'المنتجات', path: '/products', icon: Package },
      { name: 'المخازن', path: '/warehouses', icon: Warehouse },
      { name: 'حركة المخزون', path: '/inventory', icon: History },
      { name: 'الفواتير والمبيعات', path: '/invoices', icon: FileText },
      { name: 'المرتجعات', path: '/returns', icon: RotateCcw },
      { name: 'المشتريات والمصروفات', path: '/bills', icon: Receipt },
    ]
  },
  {
    title: 'العلاقات',
    items: [
      { name: 'العملاء', path: '/customers', icon: UsersIcon },
      { name: 'الموردين', path: '/suppliers', icon: Truck },
    ]
  },
  {
    title: 'المالية والتقارير',
    items: [
      { name: 'الحسابات والقيود', path: '/transactions', icon: Wallet },
      { name: 'التقارير والتحليلات', path: '/reports', icon: BarChart3 },
    ]
  },
  {
    title: 'الإدارة والأمان',
    items: [
      { name: 'إدارة الصلاحيات (RBAC)', path: '/settings/security/roles', icon: Lock, adminOnly: true },
      { name: 'سجل المراجعة والتنبيهات', path: '/settings/security/audit', icon: ShieldAlert, adminOnly: true },
      { name: 'المستخدمين', path: '/users', icon: ShieldCheck, adminOnly: true },
      { name: 'المناديب وخطوط السير', path: '/reps', icon: Truck, adminOnly: true },
      { name: 'مخططات الشاشة (POS Layout)', path: '/settings/pos/layout', icon: LayoutTemplate, adminOnly: true },
      { name: 'إعدادات الفواتير', path: '/settings/invoices', icon: FileText, adminOnly: true },
      { name: 'التنبيهات', path: '/alerts', icon: Bell, adminOnly: true },
      { name: 'لوحة المطور (Developer)', path: '/developer/console', icon: Terminal, adminOnly: true },
      { name: 'الإعدادات العامة', path: '/settings', icon: Settings },
    ]
  }
];

export const Layout: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isManualOpen, setIsManualOpen] = useState(false);
  const { user, logout } = useAuth();
  const profile = { role: 'admin', displayName: user?.displayName || 'مدير النظام' };
  const navigate = useNavigate();
  const { isLearningModeEnabled, toggleLearningMode } = useLearningMode();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const currentPath = window.location.pathname;
  const allItems = navSections.flatMap(section => section.items);
  const currentPageName = allItems.find(item => item.path === currentPath)?.name || 'لوحة التحكم';

  return (
    <div className="flex h-screen bg-[#0b0f1a] overflow-hidden text-slate-200">
      <UserManual isOpen={isManualOpen} onClose={() => setIsManualOpen(false)} />
      <GuidedTour />
      {/* Main Content (Left) */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-[#0f172a] border-b border-[#1e293b] flex items-center justify-between px-8">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-bold text-white">
              {currentPageName}
            </h1>
            <div className="text-sm text-slate-500 font-medium">
              {new Intl.DateTimeFormat('ar-EG', { dateStyle: 'full' }).format(new Date())}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => setIsManualOpen(true)} className='p-2 rounded-full text-slate-400 hover:bg-slate-800 hover:text-white' title='مساعدة'><BookOpen size={20} /></button>
            <button onClick={toggleLearningMode} className={cn('p-2 rounded-full transition-colors relative', isLearningModeEnabled ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-400 hover:bg-slate-800 hover:text-white')} title='وضع التعلم الذكي'><BookOpen size={20} />{isLearningModeEnabled && <span className='absolute top-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-[#0f172a]'></span>}</button>
            <SyncEngineStatusBadge />
            <div className="w-8 h-8 bg-blue-600/10 text-blue-500 rounded-full flex items-center justify-center">
              <Sparkles size={18} />
            </div>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto p-8">
          <Outlet />
        </div>
        <AlertBanner />
        <AIAgentOverlay />
      </main>

      {/* Sidebar (Right) */}
      <aside 
        className={cn(
          "bg-[#0f172a] border-r border-[#1e293b] transition-all duration-300 flex flex-col z-20",
          isSidebarOpen ? "w-64" : "w-20"
        )}
      >
        <div className="p-6 flex items-center justify-between">
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-1 hover:bg-slate-800 rounded-md text-slate-400"
          >
            {isSidebarOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
          </button>
          {isSidebarOpen && (
            <div className="flex items-center gap-2">
              <span className="font-bold text-xl text-white">سويفت ERP</span>
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">S</span>
              </div>
            </div>
          )}
        </div>

        <nav className="flex-1 px-4 space-y-6 overflow-y-auto pb-6">
          {navSections.map((section) => {
            const filteredItems = section.items.filter(item => !item.adminOnly || profile?.role === 'admin');
            if (filteredItems.length === 0) return null;
            return (
              <div key={section.title}>
                {isSidebarOpen && (
                  <h3 className="px-3 mb-2 text-[10px] font-bold text-slate-600 uppercase tracking-widest text-right">
                    {section.title}
                  </h3>
                )}
                <div className="space-y-1">
                  {filteredItems.map((item) => (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      className={({ isActive }) => cn(
                        "flex items-center gap-3 px-3 py-3 rounded-lg transition-all group",
                        isActive 
                          ? "bg-blue-600/10 text-blue-400 border-l-4 border-blue-600 rounded-l-none" 
                          : "text-slate-400 hover:bg-slate-800 hover:text-white"
                      )}
                    >
                      {isSidebarOpen && <span className="flex-1 text-right">{item.name}</span>}
                      <item.icon size={20} className={cn(
                        "transition-colors",
                        isSidebarOpen ? "" : "mx-auto"
                      )} />
                    </NavLink>
                  ))}
                </div>
              </div>
            );
          })}
        </nav>

        <div className="p-4 border-t border-[#1e293b]">
          <div className={cn(
            "flex items-center gap-3 px-3 py-2 rounded-lg bg-slate-800/50",
            isSidebarOpen ? "" : "justify-center"
          )}>
            {isSidebarOpen && (
              <div className="flex-1 min-w-0 text-right">
                <p className="text-sm font-bold text-white truncate">
                  {profile?.displayName || user?.email?.split('@')[0]}
                </p>
                <p className="text-[10px] text-blue-400 font-medium uppercase tracking-wider">
                  {profile?.role === 'admin' ? 'مدير النظام' : 'محاسب'}
                </p>
              </div>
            )}
            <div className="w-10 h-10 bg-slate-700 rounded-xl flex items-center justify-center text-white border border-slate-600">
              <UserIcon size={20} />
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className={cn(
              "mt-3 flex items-center gap-3 w-full px-3 py-2.5 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors text-sm font-medium",
              isSidebarOpen ? "flex-row-reverse" : "justify-center"
            )}
          >
            <LogOut size={18} />
            {isSidebarOpen && <span className="flex-1 text-right">تسجيل الخروج</span>}
          </button>
        </div>
      </aside>
    </div>
  );
};
