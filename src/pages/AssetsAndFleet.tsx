/**
 * @file AssetsAndFleet.tsx
 * @module واجهات وصفحات النظام (UI Pages)
 * @description ملف جزء من نظام MARO ERP. الوظيفة: AssetsAndFleet.tsx.
 */
import React, { useState } from 'react';
import { 
  Truck, 
  Map, 
  Navigation, 
  Wrench, 
  AlertTriangle, 
  CheckCircle2, 
  Monitor,
  Building,
  Key,
  Shield,
  Clock,
  Plus
} from 'lucide-react';
import { formatCurrency, cn } from '../lib/utils';

type Tab = 'fleet' | 'assets' | 'maintenance';

export const AssetsAndFleet: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('fleet');

  const mockFleet = [
    { id: 'V-101', type: 'شاحنة تبريد', plate: 'أ ب ت 1234', driver: 'سعيد محمد', status: 'on_route', destination: 'فرع الدمام', fuelLevel: 80 },
    { id: 'V-102', type: 'فان توصيل', plate: 'س ر ح 9876', driver: 'خالد عبدالله', status: 'idle', destination: '-', fuelLevel: 45 },
    { id: 'V-103', type: 'شاحنة نقل ثقيل', plate: 'م ن ي 5544', driver: 'عمر زيد', status: 'maintenance', destination: 'ورشة الصيانة', fuelLevel: 15 },
  ];

  const mockAssets = [
    { id: 'AST-001', name: 'ماكينة قهوة لامارزوكو', category: 'معدات تشغيل', location: 'فرع العليا', purchaseValue: 45000, currentValue: 38000, condition: 'good' },
    { id: 'AST-002', name: 'أجهزة حاسب (نقاط بيع)', category: 'إلكترونيات', location: 'المستودع الرئيسي', purchaseValue: 12000, currentValue: 8500, condition: 'fair' },
    { id: 'AST-003', name: 'أثاث مكتبي الإدارة', category: 'أثاث', location: 'المبنى الإداري', purchaseValue: 85000, currentValue: 72000, condition: 'good' },
  ];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-950 via-[#151b2b] to-[#0f172a] p-6 rounded-2xl border border-blue-900/40 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-400 font-bold text-xs border border-blue-500/30">
              MARO Phase 13: Assets & Fleet
            </span>
          </div>
          <h1 className="text-2xl font-black text-white">إدارة الأصول والأسطول</h1>
          <p className="text-xs text-slate-400 mt-1">
            إدارة متكاملة للأصول الثابتة وإهلاكها، بالإضافة إلى تتبع أسطول النقل والمندوبين بشكل مباشر.
          </p>
        </div>
        <div className="flex items-center gap-3">
           <div className="bg-[#0f172a] p-3 rounded-xl border border-slate-800 flex items-center gap-3">
             <Truck className="text-blue-400" size={24} />
             <div>
               <p className="text-[10px] text-slate-400">حالة الأسطول</p>
               <p className="text-xs font-bold text-emerald-400">24 مركبة نشطة</p>
             </div>
           </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-800 pb-2 overflow-x-auto custom-scrollbar">
        <button
          onClick={() => setActiveTab('fleet')}
          className={cn(
            "px-5 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2 whitespace-nowrap",
            activeTab === 'fleet' ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" : "bg-[#151b2b] text-slate-400 hover:text-white border border-slate-800"
          )}
        >
          <Map size={16} />
          أسطول النقل والتوصيل
        </button>
        <button
          onClick={() => setActiveTab('assets')}
          className={cn(
            "px-5 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2 whitespace-nowrap",
            activeTab === 'assets' ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" : "bg-[#151b2b] text-slate-400 hover:text-white border border-slate-800"
          )}
        >
          <Monitor size={16} />
          سجل الأصول الثابتة
        </button>
        <button
          onClick={() => setActiveTab('maintenance')}
          className={cn(
            "px-5 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2 whitespace-nowrap",
            activeTab === 'maintenance' ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" : "bg-[#151b2b] text-slate-400 hover:text-white border border-slate-800"
          )}
        >
          <Wrench size={16} />
          أوامر الصيانة (CMMS)
        </button>
      </div>

      {/* Fleet Tab */}
      {activeTab === 'fleet' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-white flex items-center gap-2">
              <Navigation className="text-blue-400" size={20} />
              التتبع المباشر (Live Tracking)
            </h3>
            <button className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2">
              <Plus size={16} /> إضافة مركبة
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {mockFleet.map((vehicle) => (
              <div key={vehicle.id} className="bg-[#151b2b] p-5 rounded-2xl border border-slate-800 flex flex-col hover:border-slate-700 transition-all">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center",
                      vehicle.status === 'on_route' ? "bg-blue-500/10 text-blue-400" : 
                      vehicle.status === 'idle' ? "bg-slate-500/10 text-slate-400" :
                      "bg-amber-500/10 text-amber-400"
                    )}>
                      <Truck size={20} />
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-sm">{vehicle.type}</h4>
                      <p className="text-[10px] font-mono text-slate-500">{vehicle.plate} • {vehicle.id}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 flex-1">
                  <div className="flex justify-between items-center p-3 bg-[#0f172a] rounded-xl border border-slate-800 text-xs">
                    <span className="text-slate-400">السائق</span>
                    <span className="font-bold text-white">{vehicle.driver}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-[#0f172a] rounded-xl border border-slate-800 text-xs">
                    <span className="text-slate-400">الوجهة</span>
                    <span className="font-bold text-white flex items-center gap-1">
                      {vehicle.status === 'on_route' && <Navigation size={12} className="text-blue-400" />}
                      {vehicle.destination}
                    </span>
                  </div>
                  
                  <div>
                    <div className="flex justify-between items-center mb-1 text-[10px]">
                      <span className="text-slate-400">مستوى الوقود</span>
                      <span className={vehicle.fuelLevel > 20 ? "text-emerald-400" : "text-red-400"}>{vehicle.fuelLevel}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                      <div 
                        className={cn("h-full rounded-full transition-all", vehicle.fuelLevel > 20 ? "bg-emerald-500" : "bg-red-500")}
                        style={{ width: `${vehicle.fuelLevel}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Assets Tab */}
      {activeTab === 'assets' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-white flex items-center gap-2">
              <Shield className="text-purple-400" size={20} />
              سجل الأصول الثابتة والإهلاك
            </h3>
            <button className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2">
              <Plus size={16} /> تسجيل أصل جديد
            </button>
          </div>

          <div className="bg-[#151b2b] rounded-2xl border border-slate-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-sm">
                <thead className="bg-[#0f172a] border-b border-slate-800 text-slate-400 text-xs">
                  <tr>
                    <th className="px-6 py-4 font-bold">كود الأصل</th>
                    <th className="px-6 py-4 font-bold">وصف الأصل</th>
                    <th className="px-6 py-4 font-bold">الموقع (الفرع)</th>
                    <th className="px-6 py-4 font-bold">قيمة الشراء</th>
                    <th className="px-6 py-4 font-bold">القيمة الدفترية</th>
                    <th className="px-6 py-4 font-bold">الحالة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {mockAssets.map((asset) => (
                    <tr key={asset.id} className="hover:bg-[#0f172a]/50 transition-colors">
                      <td className="px-6 py-4 font-mono text-xs text-slate-500">{asset.id}</td>
                      <td className="px-6 py-4 text-white font-bold text-xs flex items-center gap-2">
                        <Monitor size={14} className="text-blue-400" />
                        {asset.name}
                        <span className="text-[10px] text-slate-500 bg-slate-800 px-1.5 py-0.5 rounded">{asset.category}</span>
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-300 flex items-center gap-1">
                        <Building size={12} className="text-slate-500" /> {asset.location}
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-slate-400">{formatCurrency(asset.purchaseValue)}</td>
                      <td className="px-6 py-4 font-mono text-xs text-emerald-400 font-bold">{formatCurrency(asset.currentValue)}</td>
                      <td className="px-6 py-4">
                        <span className={cn(
                          "px-2 py-1 rounded-lg text-[10px] font-bold border",
                          asset.condition === 'good' ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                        )}>
                          {asset.condition === 'good' ? 'حالة ممتازة' : 'بحاجة لتقييم'}
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

      {/* Maintenance Tab */}
      {activeTab === 'maintenance' && (
        <div className="bg-[#151b2b] rounded-2xl border border-slate-800 p-8 text-center flex flex-col items-center justify-center min-h-[400px]">
          <Wrench size={48} className="text-slate-600 mb-4" />
          <h3 className="text-lg font-bold text-white mb-2">إدارة أوامر الصيانة (CMMS)</h3>
          <p className="text-sm text-slate-400 max-w-md mx-auto">
            نظام متكامل لجدولة الصيانة الدورية والوقائية للأصول والمركبات. سيتم تفعيله بالكامل في التحديث القادم كجزء من أتمتة العمليات (Phase 13.5).
          </p>
        </div>
      )}

    </div>
  );
};
