// MARO ERP - Commercial Industry Modules Central Hub
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ShoppingBag, 
  Shirt, 
  Smartphone, 
  Utensils, 
  HeartPulse, 
  Car, 
  Factory, 
  Layers, 
  ArrowLeft, 
  CheckCircle2, 
  Sparkles, 
  Terminal,
  ShieldCheck,
  GraduationCap,
  ThermometerSnowflake,
  Scissors,
  Dumbbell,
  Baby,
  ParkingSquare,
  Plane,
  Ship,
  MessageSquare,
  ScanLine
} from 'lucide-react';
import { IndustryModuleEngine } from '../lib/industryModuleEngine';
import { cn } from '../lib/utils';

export const IndustryModulesHub: React.FC = () => {
  const navigate = useNavigate();
  const activeModules = IndustryModuleEngine.getActiveModules();
  const allModules = IndustryModuleEngine.getModules();

  const getModuleIcon = (iconName: string) => {
    switch (iconName) {
      case 'ShoppingBag': return <ShoppingBag size={28} />;
      case 'Shirt': return <Shirt size={28} />;
      case 'Smartphone': return <Smartphone size={28} />;
      case 'Utensils': return <Utensils size={28} />;
      case 'HeartPulse': return <HeartPulse size={28} />;
      case 'Car': return <Car size={28} />;
      case 'Factory': return <Factory size={28} />;
      case 'GraduationCap': return <GraduationCap size={28} />;
      case 'ThermometerSnowflake': return <ThermometerSnowflake size={28} />;
      case 'Scissors': return <Scissors size={28} />;
      case 'Dumbbell': return <Dumbbell size={28} />;
      case 'Baby': return <Baby size={28} />;
      case 'ParkingSquare': return <ParkingSquare size={28} />;
      case 'Plane': return <Plane size={28} />;
      case 'Ship': return <Ship size={28} />;
      case 'MessageSquare': return <MessageSquare size={28} />;
      case 'ScanLine': return <ScanLine size={28} />;
      default: return <Layers size={28} />;
    }
  };

  const getColorClasses = (color: string) => {
    switch (color) {
      case 'emerald': return { bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', text: 'text-emerald-400', hover: 'hover:border-emerald-500/60' };
      case 'purple': return { bg: 'bg-purple-500/10', border: 'border-purple-500/30', text: 'text-purple-400', hover: 'hover:border-purple-500/60' };
      case 'cyan': return { bg: 'bg-cyan-500/10', border: 'border-cyan-500/30', text: 'text-cyan-400', hover: 'hover:border-cyan-500/60' };
      case 'amber': return { bg: 'bg-amber-500/10', border: 'border-amber-500/30', text: 'text-amber-400', hover: 'hover:border-amber-500/60' };
      case 'rose': return { bg: 'bg-rose-500/10', border: 'border-rose-500/30', text: 'text-rose-400', hover: 'hover:border-rose-500/60' };
      case 'blue': return { bg: 'bg-blue-500/10', border: 'border-blue-500/30', text: 'text-blue-400', hover: 'hover:border-blue-500/60' };
      case 'indigo': return { bg: 'bg-indigo-500/10', border: 'border-indigo-500/30', text: 'text-indigo-400', hover: 'hover:border-indigo-500/60' };
      default: return { bg: 'bg-slate-800', border: 'border-slate-700', text: 'text-slate-300', hover: 'hover:border-slate-500' };
    }
  };

  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <div className="bg-[#151b2b] border border-blue-500/30 rounded-3xl p-8 shadow-2xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-emerald-500"></div>
        <div className="space-y-2 max-w-2xl">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles size={14} />
              <span>Modular Industry Architecture v4.0</span>
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
            موديولات الأنشطة التجارية المتخصصة
          </h1>
          <p className="text-xs md:text-sm text-slate-400 leading-relaxed">
            منظومة موديولات تجارية منفصلة (Plug & Play) تعمل على الكور المحاسبي الموحد. كل نشاط تجاري يمتلك خصائص أصناف، شاشات تشغيل، وتقارير مخصصة قابلة للتنشيط والإضافة دون التأثير على المحاسبة العامة.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button 
            onClick={() => navigate('/developer/console')}
            className="px-5 py-3.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-2xl text-xs font-bold flex items-center gap-2 transition-all shadow-lg"
          >
            <Terminal size={16} />
            <span>لوحة المبرمج (تنشيط الموديولات)</span>
          </button>
        </div>
      </div>

      {/* Grid of Commercial Modules */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {allModules.map(mod => {
          const colors = getColorClasses(mod.badgeColor);
          return (
            <div 
              key={mod.id}
              className={cn(
                "bg-[#151b2b] border rounded-3xl p-6 space-y-5 transition-all shadow-xl flex flex-col justify-between relative overflow-hidden group",
                mod.isActive ? `${colors.border} ${colors.hover}` : "border-[#1e293b] opacity-60 hover:opacity-100"
              )}
            >
              {mod.isActive && (
                <div className="absolute top-4 left-4">
                  <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full text-[10px] font-bold flex items-center gap-1">
                    <CheckCircle2 size={12} />
                    <span>نشط في النظام</span>
                  </span>
                </div>
              )}

              <div className="space-y-4">
                <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center border transition-transform group-hover:scale-110", colors.bg, colors.border, colors.text)}>
                  {getModuleIcon(mod.iconName)}
                </div>

                <div>
                  <h3 className="text-lg font-bold text-white group-hover:text-blue-300 transition-colors">
                    {mod.nameAr}
                  </h3>
                  <p className="text-[11px] font-mono text-slate-500 mt-0.5">{mod.code} • الإصدار {mod.version}</p>
                  <p className="text-xs text-slate-400 mt-2 leading-relaxed">{mod.descriptionAr}</p>
                </div>

                {/* Custom Fields Highlights */}
                <div className="p-3 bg-[#0f172a] rounded-2xl border border-[#1e293b] space-y-1.5">
                  <p className="text-[10px] text-slate-400 font-bold uppercase">خصائص الأصناف الفريدة للنشاط:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {mod.customProductFields.map(f => (
                      <span key={f.id} className="px-2 py-0.5 bg-[#151b2b] border border-slate-700/60 rounded text-[10px] text-slate-300 font-medium">
                        {f.nameAr}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-[#1e293b] flex items-center justify-between">
                <span className="text-[11px] text-slate-400 font-bold">
                  {mod.specializedReports.length} تقارير متخصصة
                </span>

                {mod.isActive && mod.routePath ? (
                  <button 
                    onClick={() => navigate(mod.routePath!)}
                    className={cn(
                      "px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all text-white shadow-md",
                      mod.badgeColor === 'purple' ? "bg-purple-600 hover:bg-purple-500" :
                      mod.badgeColor === 'cyan' ? "bg-cyan-600 hover:bg-cyan-500" :
                      mod.badgeColor === 'emerald' ? "bg-emerald-600 hover:bg-emerald-500" :
                      mod.badgeColor === 'amber' ? "bg-amber-600 hover:bg-amber-500" :
                      mod.badgeColor === 'rose' ? "bg-rose-600 hover:bg-rose-500" :
                      mod.badgeColor === 'blue' ? "bg-blue-600 hover:bg-blue-500" :
                      "bg-indigo-600 hover:bg-indigo-500"
                    )}
                  >
                    <span>فتح الشاشات</span>
                    <ArrowLeft size={14} />
                  </button>
                ) : (
                  <button 
                    onClick={() => navigate('/developer/console')}
                    className="px-3.5 py-1.5 bg-[#0f172a] hover:bg-slate-800 text-slate-400 border border-[#1e293b] rounded-xl text-xs font-bold"
                  >
                    تنشيط من لوحة المبرمج
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
