import React, { useState } from 'react';
import { 
  Car, 
  Sparkles, 
  Clock, 
  Plus, 
  CheckCircle2, 
  User, 
  Search, 
  DollarSign, 
  ShieldCheck, 
  FileText, 
  Calendar,
  Layers,
  Wrench
} from 'lucide-react';
import { ServiceBay, CarWashJobCard } from '../../types/industryModules';
import { formatCurrency, cn } from '../../lib/utils';

export const CarWashPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'bays' | 'jobcards' | 'newcard'>('bays');

  // Service Bays
  const [bays, setBays] = useState<ServiceBay[]>([
    {
      id: 'b1',
      bayNumber: 'حارة 01',
      bayType: 'غسيل يدوي وكيماوي',
      status: 'BUSY',
      currentJobCardNumber: 'WASH-2026-081',
      assignedWorkers: ['محمد علي', 'حسام عادل']
    },
    {
      id: 'b2',
      bayNumber: 'حارة 02',
      bayType: 'حارة نانو سيراميك وتلميع',
      status: 'BUSY',
      currentJobCardNumber: 'WASH-2026-079',
      assignedWorkers: ['محمود الشناوي (فني تلميع)']
    },
    {
      id: 'b3',
      bayNumber: 'حارة 03',
      bayType: 'حفرة تغيير زيوت وفلاتر',
      status: 'AVAILABLE',
      assignedWorkers: ['إبراهيم خليل (ميكانيكي)']
    },
    {
      id: 'b4',
      bayNumber: 'حارة 04',
      bayType: 'غسيل آلي نفق',
      status: 'AVAILABLE',
      assignedWorkers: ['عامل تشغيل النفق']
    }
  ]);

  // Active Job Cards
  const [jobCards, setJobCards] = useState<CarWashJobCard[]>([
    {
      id: 'jc1',
      jobCardNumber: 'WASH-2026-081',
      plateNumber: 'ق ص د 8412',
      carMakeModel: 'تويوتا كامري 2024',
      carColor: 'أبيض لؤلؤي',
      vehicleSize: 'سيدان كبيرة / كروس أوفر',
      customerName: 'أحمد طارق الشافعي',
      customerPhone: '01019823412',
      serviceType: 'غسيل سوبر خارجي وداخلي',
      packageName: 'باقة VIP شاملة غسيل الماكينة والتعطير',
      bayId: 'b1',
      assignedStaff: ['محمد علي'],
      totalPrice: 150,
      discount: 0,
      netPrice: 150,
      paymentStatus: 'PAID',
      paymentMethod: 'شبكة / مدى',
      status: 'IN_WASH',
      receivedTime: '10:30 ص'
    },
    {
      id: 'jc2',
      jobCardNumber: 'WASH-2026-079',
      plateNumber: 'ج م ر 1920',
      carMakeModel: 'مرسيدس E200 AMG',
      carColor: 'رمادي مطفي',
      vehicleSize: 'سيدان كبيرة / كروس أوفر',
      customerName: 'م. خالد المنشاوي',
      customerPhone: '01229018471',
      serviceType: 'نانو سيراميك وتلميع',
      packageName: 'طبقة حماية نانو سيراميك 9H ألماني',
      bayId: 'b2',
      assignedStaff: ['محمود الشناوي'],
      totalPrice: 4500,
      discount: 500,
      netPrice: 4000,
      paymentStatus: 'PAID',
      paymentMethod: 'شبكة / مدى',
      status: 'DETAILING',
      receivedTime: '09:00 ص'
    },
    {
      id: 'jc3',
      jobCardNumber: 'WASH-2026-077',
      plateNumber: 'د س ب 5531',
      carMakeModel: 'كيا سبورتاج 2025',
      carColor: 'أحمر نبيتي',
      vehicleSize: 'SUV عائلية 7 راكب',
      customerName: 'د. سامح عبد الفتاح',
      customerPhone: '01118492019',
      serviceType: 'تغيير زيت وفلتر',
      packageName: 'زيت موبيل 1 تخليقي 10,000 كم + فلتر أصلي',
      bayId: 'b3',
      assignedStaff: ['إبراهيم خليل'],
      totalPrice: 1850,
      discount: 0,
      netPrice: 1850,
      paymentStatus: 'PAID',
      paymentMethod: 'نقد',
      status: 'READY_FOR_DELIVERY',
      receivedTime: '08:45 ص'
    }
  ]);

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-[#151b2b] border border-cyan-500/30 rounded-3xl p-6 shadow-2xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500"></div>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles size={14} />
              <span>Car Wash & Auto Detailing Engine</span>
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-white">
            مغاسل السيارات والنانو سيراميك وتغيير الزيوت
          </h1>
          <p className="text-xs md:text-sm text-slate-400">
            إدارة طابور حارات الغسيل والخدمة (Bay Queue)، كروت التشغيل، باقات النانو سيراميك وتغيير الزيوت وفحص 20 نقطة.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-[#0f172a] p-3 rounded-2xl border border-slate-800 flex items-center gap-3">
            <Car className="text-cyan-400" size={24} />
            <div>
              <p className="text-[10px] text-slate-400">السيارات قيد الخدمة حالياً</p>
              <p className="text-xs font-bold text-white">{jobCards.length} سيارات داخل الصالة</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('bays')}
          className={cn(
            "px-5 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2",
            activeTab === 'bays' ? "bg-cyan-600 text-white shadow-md shadow-cyan-600/20" : "bg-slate-900 text-slate-400 hover:text-white"
          )}
        >
          <Layers size={16} />
          <span>حارات الخدمة المباشرة ({bays.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('jobcards')}
          className={cn(
            "px-5 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2",
            activeTab === 'jobcards' ? "bg-cyan-600 text-white shadow-md shadow-cyan-600/20" : "bg-slate-900 text-slate-400 hover:text-white"
          )}
        >
          <FileText size={16} />
          <span>كروت التشغيل وطابور الصالة ({jobCards.length})</span>
        </button>
      </div>

      {/* TAB 1: BAYS */}
      {activeTab === 'bays' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {bays.map((bay) => (
            <div key={bay.id} className={cn(
              "p-5 rounded-2xl border transition-all space-y-4 shadow-xl",
              bay.status === 'BUSY' ? "bg-[#151b2b] border-cyan-500/40" : "bg-[#151b2b] border-slate-800"
            )}>
              <div className="flex justify-between items-center">
                <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-lg bg-slate-900 text-white border border-slate-700">
                  {bay.bayNumber}
                </span>
                <span className={cn(
                  "text-[10px] font-bold px-2.5 py-0.5 rounded-full border",
                  bay.status === 'BUSY' ? "bg-amber-500/20 text-amber-300 border-amber-500/30 animate-pulse" : "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                )}>
                  {bay.status === 'BUSY' ? 'مشغولة حالياً' : 'متاحة للغسيل'}
                </span>
              </div>

              <div>
                <h3 className="text-sm font-black text-white">{bay.bayType}</h3>
                <p className="text-xs text-slate-400 mt-1">
                  {bay.currentJobCardNumber ? `كرت: ${bay.currentJobCardNumber}` : 'لا توجد سيارة بالداخل'}
                </p>
              </div>

              <div className="bg-[#0f172a] p-3 rounded-xl border border-slate-800 text-[11px] space-y-1">
                <span className="text-slate-500 block font-bold">الفنيين المعينين:</span>
                {bay.assignedWorkers.map((w, i) => (
                  <span key={i} className="text-slate-300 block">👤 {w}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 2: JOB CARDS */}
      {activeTab === 'jobcards' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {jobCards.map((jc) => (
              <div key={jc.id} className="bg-[#151b2b] border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded-md bg-slate-900 text-cyan-400 border border-slate-700">
                      {jc.jobCardNumber}
                    </span>
                    <h3 className="text-base font-black text-white mt-1.5">{jc.carMakeModel}</h3>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-slate-900 border border-slate-700 text-yellow-400 font-mono font-bold text-xs rounded">
                        {jc.plateNumber}
                      </span>
                      <span className="text-[11px] text-slate-400">{jc.carColor}</span>
                    </div>
                  </div>
                  <span className={cn(
                    "text-[10px] font-bold px-2.5 py-1 rounded-full border",
                    jc.status === 'READY_FOR_DELIVERY' ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" : "bg-cyan-500/20 text-cyan-300 border-cyan-500/30"
                  )}>
                    {jc.status === 'READY_FOR_DELIVERY' ? 'جاهزة للتسليم' : 'جاري العمل'}
                  </span>
                </div>

                <div className="bg-[#0f172a] p-3 rounded-xl border border-slate-800 space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-400">
                    <span>نوع الخدمة:</span>
                    <span className="font-bold text-white">{jc.serviceType}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>الباقة:</span>
                    <span className="text-cyan-300">{jc.packageName}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>العميل والهاتف:</span>
                    <span className="text-slate-300">{jc.customerName} ({jc.customerPhone})</span>
                  </div>
                </div>

                <div className="flex justify-between items-center border-t border-slate-800 pt-3 text-xs">
                  <div>
                    <span className="text-slate-500 text-[10px] block">وقت الاستلام</span>
                    <span className="text-slate-300 font-bold">{jc.receivedTime}</span>
                  </div>
                  <div className="text-left">
                    <span className="text-slate-500 text-[10px] block">إجمالي الفاتورة</span>
                    <span className="text-base font-black text-cyan-400">{formatCurrency(jc.netPrice)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
