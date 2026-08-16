/**
 * @file AutoPartsPage.tsx
 * @module واجهات وصفحات النظام (UI Pages)
 * @description ملف جزء من نظام MARO ERP. الوظيفة: AutoPartsPage.tsx.
 */
// MARO ERP - Auto Spare Parts & Fitment Compatibility Module
import React, { useState } from 'react';
import { 
  Car, 
  Search, 
  Layers, 
  CheckCircle2, 
  MapPin, 
  Wrench, 
  Filter, 
  DollarSign, 
  PackageCheck,
  Sparkles
} from 'lucide-react';
import { IndustryModuleEngine } from '../../lib/industryModuleEngine';
import { AutoPartFitment } from '../../types/industryModules';
import { cn } from '../../lib/utils';

export const AutoPartsPage: React.FC = () => {
  const [parts, setParts] = useState<AutoPartFitment[]>(IndustryModuleEngine.getAutoParts());
  const [searchQuery, setSearchQuery] = useState('');
  const [vehicleMakeFilter, setVehicleMakeFilter] = useState<string>('ALL');

  const filteredParts = parts.filter(p => {
    const matchesSearch = p.partName.includes(searchQuery) || p.partNumber.toLowerCase().includes(searchQuery.toLowerCase()) || p.oemNumber.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesMake = vehicleMakeFilter === 'ALL' || p.compatibleVehicles.some(v => v.make === vehicleMakeFilter);
    return matchesSearch && matchesMake;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-[#151b2b] border border-blue-500/30 rounded-3xl p-6 shadow-2xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-r from-blue-500 via-cyan-500 to-indigo-600"></div>
        <div className="flex items-center gap-4">
          <div className="p-3.5 bg-blue-500/10 border border-blue-500/30 text-blue-400 rounded-2xl shadow-lg shadow-blue-500/10">
            <Car size={30} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-white tracking-tight">موديول قطع غيار ومراكز خدمة السيارات</h1>
              <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[10px] font-bold">
                Auto Spare Parts & Fitment
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">تتبع كود القطعة الأصلي (OEM)، فحص توافق موديلات وسنوات السيارات، وتحديد مواقع الرفوف بدقة</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
          <input 
            type="text" 
            placeholder="بحث برقم القطعة، OEM، أو اسم القطعة..." 
            className="w-full pr-10 pl-4 py-2.5 bg-[#151b2b] border border-[#1e293b] rounded-2xl text-xs text-white focus:border-blue-500 outline-none"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
          <span className="text-[11px] text-slate-400 font-bold whitespace-nowrap">الشركة المصنعة للسيارة:</span>
          {['ALL', 'Toyota', 'Hyundai', 'Kia'].map(m => (
            <button 
              key={m}
              onClick={() => setVehicleMakeFilter(m)}
              className={cn(
                "px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all whitespace-nowrap",
                vehicleMakeFilter === m ? "bg-blue-500/20 border-blue-500/50 text-blue-300" : "bg-[#151b2b] border-[#1e293b] text-slate-400 hover:text-white"
              )}
            >
              {m === 'ALL' ? 'كل السيارات' : m}
            </button>
          ))}
        </div>
      </div>

      {/* Parts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredParts.map(part => (
          <div key={part.id} className="bg-[#151b2b] border border-[#1e293b] hover:border-blue-500/40 rounded-3xl p-6 space-y-4 shadow-xl transition-all">
            <div className="flex items-start justify-between">
              <div>
                <span className="px-2.5 py-0.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-lg text-[10px] font-bold">
                  {part.category}
                </span>
                <h3 className="text-base font-bold text-white mt-1.5">{part.partName}</h3>
                <div className="flex items-center gap-3 mt-1 text-xs font-mono">
                  <span className="text-slate-400">كود القطعة: <strong className="text-white">{part.partNumber}</strong></span>
                  <span className="text-slate-400">OEM: <strong className="text-blue-400">{part.oemNumber}</strong></span>
                </div>
              </div>

              <div className="text-left">
                <p className="text-[10px] text-slate-500 uppercase font-bold">سعر البيع</p>
                <p className="text-lg font-black text-emerald-400">{part.price} ج.م</p>
              </div>
            </div>

            <div className="p-3 bg-[#0f172a] rounded-xl border border-[#1e293b] flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-slate-400">
                <MapPin size={15} className="text-amber-400" />
                <span>موقع الرف في المخزن: <strong className="text-slate-200">{part.shelfLocation}</strong></span>
              </div>
              <span className="font-bold text-emerald-400">الرصيد: {part.stock} قطعة</span>
            </div>

            {/* Fitment Compatibility */}
            <div className="space-y-1.5 pt-2 border-t border-[#1e293b]">
              <p className="text-[11px] text-slate-400 font-bold flex items-center gap-1.5">
                <Car size={13} className="text-blue-400" />
                <span>السيارات والموديلات المتوافقة مع القطعة (Vehicle Fitment):</span>
              </p>
              <div className="flex flex-wrap gap-1.5">
                {part.compatibleVehicles.map((veh, idx) => (
                  <span key={idx} className="px-2.5 py-1 bg-[#0f172a] border border-blue-500/20 text-blue-300 rounded-lg text-[11px] font-mono">
                    {veh.make} {veh.model} ({veh.yearFrom} - {veh.yearTo}) {veh.engineSize && `[${veh.engineSize}]`}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
