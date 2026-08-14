import React, { useState } from 'react';
import { 
  Car, 
  Plus, 
  Search, 
  Calculator, 
  FileText, 
  Calendar, 
  DollarSign, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  ShieldCheck, 
  Printer, 
  ArrowLeft,
  KeyRound,
  Filter,
  Sparkles
} from 'lucide-react';
import { VehicleShowroomItem, VehicleInstallmentPlan } from '../../types/industryModules';
import { formatCurrency, cn } from '../../lib/utils';

export const AutoShowroomPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'inventory' | 'installments' | 'calculator'>('inventory');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCondition, setSelectedCondition] = useState('ALL');
  
  // Sample Initial Vehicles
  const [vehicles, setVehicles] = useState<VehicleShowroomItem[]>([
    {
      id: 'v1',
      vin: '1HGCR2F83HA109281',
      engineNumber: 'ENG-2026-9812',
      make: 'تويوتا (Toyota)',
      model: 'كورولا كروس Hybrid',
      year: 2026,
      color: 'أبيض لؤلؤي',
      interiorColor: 'جلد جملي',
      transmission: 'هايبرد',
      fuelType: 'هايبرد',
      mileageKm: 0,
      condition: 'جديد (زيرو)',
      customsStatus: 'خالص الجمارك والضريبة',
      costPrice: 820000,
      salePrice: 950000,
      minPrice: 930000,
      status: 'AVAILABLE',
      locationBay: 'صالة العرض A-01',
      features: ['فتحة سقف بانوراما', 'بصمة وتشغيل عن بعد', 'كاميرات 360 درجة', 'مثبت سرعة راداري', 'شاشة 12.3 بوصة'],
      inspectionReport: {
        paintCondition: 'فابريكا بالكامل 100%',
        engineHealthPercent: 100,
        tiresCondition: 'إطارات المصنع 2026',
        notes: 'سيارة زيرو وارد الوكيل مع شهادة ضمان 5 سنوات'
      }
    },
    {
      id: 'v2',
      vin: 'WBA33AY08MFL54109',
      engineNumber: 'BMW-B48-88124',
      make: 'بي إم دبليو (BMW)',
      model: '320i M Sport LCI',
      year: 2024,
      color: 'رمادي بروكلين ميتاليك',
      interiorColor: 'أحمر موكا',
      transmission: 'أوتوماتيك',
      fuelType: 'بنزين 95',
      mileageKm: 18500,
      condition: 'مستعمل كسر زيرو',
      customsStatus: 'خالص الجمارك والضريبة',
      costPrice: 1950000,
      salePrice: 2200000,
      minPrice: 2150000,
      status: 'AVAILABLE',
      locationBay: 'صالة العرض VIP-02',
      features: ['باقة M الرياضية', 'نظام صوتي Harman Kardon', 'مقاعد M الرياضية', 'إضاءة ليزر Laserlight', 'شاشة منحنية'],
      inspectionReport: {
        paintCondition: 'فابريكا بدون أي رش',
        engineHealthPercent: 98,
        tiresCondition: 'حالة ممتازة 85%',
        notes: 'صيانات توكيل بالكامل مع دفتر الصيانة'
      }
    },
    {
      id: 'v3',
      vin: 'KMHD84LF7NU918234',
      engineNumber: 'HYU-G4FP-1092',
      make: 'هيونداي (Hyundai)',
      model: 'توسان NX4 Turbo',
      year: 2025,
      color: 'أسود فانتوم',
      interiorColor: 'أسود مع تطريز رمادي',
      transmission: 'أوتوماتيك',
      fuelType: 'بنزين 92',
      mileageKm: 5400,
      condition: 'مستعمل كسر زيرو',
      customsStatus: 'خالص الجمارك والضريبة',
      costPrice: 1100000,
      salePrice: 1250000,
      minPrice: 1220000,
      status: 'RESERVED',
      locationBay: 'صالة العرض B-04',
      features: ['فتحة سقف', 'ناقل حركة إلكتروني Shift by Wire', 'حساسات أمامية وخلفية', 'جنوط 19 رياضية'],
      inspectionReport: {
        paintCondition: 'فابريكا بالكامل',
        engineHealthPercent: 99,
        tiresCondition: 'كالجديدة 95%',
        notes: 'محجوزة بدفعة حجز 50 ألف لحين استكمال إجراءات الترخيص'
      }
    }
  ]);

  // Installment Calculator State
  const [calcPrice, setCalcPrice] = useState(1000000);
  const [calcDownPayment, setCalcDownPayment] = useState(300000);
  const [calcInterestRate, setCalcInterestRate] = useState(12);
  const [calcMonths, setCalcMonths] = useState(36);

  // Computed Loan
  const loanPrincipal = Math.max(0, calcPrice - calcDownPayment);
  const totalInterest = loanPrincipal * (calcInterestRate / 100) * (calcMonths / 12);
  const totalRepayment = loanPrincipal + totalInterest;
  const monthlyInstallment = calcMonths > 0 ? totalRepayment / calcMonths : 0;

  // Filtered
  const filteredVehicles = vehicles.filter(v => {
    const matchSearch = v.make.includes(searchQuery) || v.model.includes(searchQuery) || v.vin.includes(searchQuery);
    const matchCondition = selectedCondition === 'ALL' || v.condition.includes(selectedCondition);
    return matchSearch && matchCondition;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-[#151b2b] border border-amber-500/30 rounded-3xl p-6 shadow-2xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-500"></div>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Car size={14} />
              <span>Automotive Dealership Master Module</span>
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-white">
            معارض وتجارة السيارات وحساب الأقساط
          </h1>
          <p className="text-xs md:text-sm text-slate-400">
            إدارة متكاملة لصالات عرض السيارات: تتبع أرقام الشاسيه (VIN)، الموتور، تقارير الفحص الفني، برامج التقسيط وجداول السداد.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => setActiveTab('calculator')}
            className="px-4 py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-2xl text-xs font-black flex items-center gap-2 transition-all shadow-lg shadow-amber-500/20"
          >
            <Calculator size={16} />
            <span>حاسبة أقساط السيارات</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('inventory')}
          className={cn(
            "px-5 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2",
            activeTab === 'inventory' ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20" : "bg-slate-900 text-slate-400 hover:text-white"
          )}
        >
          <Car size={16} />
          <span>مخزون السيارات المعروضة ({vehicles.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('calculator')}
          className={cn(
            "px-5 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2",
            activeTab === 'calculator' ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20" : "bg-slate-900 text-slate-400 hover:text-white"
          )}
        >
          <Calculator size={16} />
          <span>محاكي وجداول التقسيط</span>
        </button>
      </div>

      {/* TAB 1: INVENTORY */}
      {activeTab === 'inventory' && (
        <div className="space-y-4">
          {/* Controls */}
          <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-[#151b2b] p-4 rounded-2xl border border-slate-800">
            <div className="relative w-full md:w-96">
              <Search className="absolute right-3 top-3 text-slate-500" size={16} />
              <input
                type="text"
                placeholder="بحث بالموديل، الشاسيه VIN، الماركة..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#0f172a] border border-slate-700 rounded-xl pr-10 pl-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>
            <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
              {['ALL', 'جديد', 'مستعمل', 'خليجي'].map((cond) => (
                <button
                  key={cond}
                  onClick={() => setSelectedCondition(cond)}
                  className={cn(
                    "px-3.5 py-2 rounded-xl text-xs font-bold transition-all",
                    selectedCondition === cond ? "bg-amber-500/20 text-amber-300 border border-amber-500/40" : "bg-slate-900 text-slate-400 hover:text-white"
                  )}
                >
                  {cond === 'ALL' ? 'جميع الحالات' : cond}
                </button>
              ))}
            </div>
          </div>

          {/* Vehicles Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {filteredVehicles.map((vehicle) => (
              <div key={vehicle.id} className="bg-[#151b2b] border border-slate-800 hover:border-amber-500/40 rounded-2xl p-5 shadow-xl transition-all flex flex-col justify-between gap-4">
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                        {vehicle.year} • {vehicle.transmission}
                      </span>
                      <h3 className="text-base font-black text-white mt-1.5">{vehicle.make}</h3>
                      <p className="text-xs font-bold text-amber-400">{vehicle.model}</p>
                    </div>
                    <span className={cn(
                      "text-[10px] font-bold px-2.5 py-1 rounded-full border",
                      vehicle.status === 'AVAILABLE' ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" : "bg-blue-500/20 text-blue-400 border-blue-500/30"
                    )}>
                      {vehicle.status === 'AVAILABLE' ? 'متاح بالمعرض' : 'محجوز للعميل'}
                    </span>
                  </div>

                  {/* VIN & Engine Specs */}
                  <div className="bg-[#0f172a] p-3 rounded-xl border border-slate-800/80 space-y-1.5 text-[11px]">
                    <div className="flex justify-between text-slate-400">
                      <span>رقم الشاسيه (VIN):</span>
                      <span className="font-mono text-white font-bold">{vehicle.vin}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>العداد:</span>
                      <span className="text-white font-bold">{vehicle.mileageKm === 0 ? 'زيرو 0 كم' : `${vehicle.mileageKm.toLocaleString()} كم`}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>اللون والموقع:</span>
                      <span className="text-slate-200">{vehicle.color} • {vehicle.locationBay}</span>
                    </div>
                  </div>

                  {/* Features */}
                  <div className="flex flex-wrap gap-1">
                    {vehicle.features.slice(0, 3).map((f, i) => (
                      <span key={i} className="text-[10px] bg-slate-900 text-slate-400 px-2 py-0.5 rounded-md border border-slate-800">
                        {f}
                      </span>
                    ))}
                    {vehicle.features.length > 3 && (
                      <span className="text-[10px] bg-amber-500/10 text-amber-300 px-1.5 py-0.5 rounded-md">
                        +{vehicle.features.length - 3} كماليات
                      </span>
                    )}
                  </div>
                </div>

                {/* Price & Action */}
                <div className="border-t border-slate-800 pt-3 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-500 block">سعر البيع النقدي</span>
                    <span className="text-lg font-black text-emerald-400">{formatCurrency(vehicle.salePrice)}</span>
                  </div>
                  <button 
                    onClick={() => {
                      setCalcPrice(vehicle.salePrice);
                      setCalcDownPayment(vehicle.salePrice * 0.3);
                      setActiveTab('calculator');
                    }}
                    className="px-3.5 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all"
                  >
                    <Calculator size={14} />
                    <span>حساب القسط</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: INSTALLMENT CALCULATOR */}
      {activeTab === 'calculator' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Controls Form */}
          <div className="lg:col-span-5 bg-[#151b2b] p-6 rounded-2xl border border-slate-800 space-y-4">
            <h3 className="text-sm font-black text-white flex items-center gap-2">
              <Calculator className="text-amber-400" size={18} />
              <span>معايير خطة تقسيط السيارة</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1 font-bold">سعر السيارة الإجمالي:</label>
                <input
                  type="number"
                  value={calcPrice}
                  onChange={(e) => setCalcPrice(Number(e.target.value))}
                  className="w-full bg-[#0f172a] border border-slate-700 rounded-xl px-4 py-2.5 text-white font-bold text-sm focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1 font-bold">المقدم المدفوع (Down Payment):</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={calcDownPayment}
                    onChange={(e) => setCalcDownPayment(Number(e.target.value))}
                    className="w-full bg-[#0f172a] border border-slate-700 rounded-xl px-4 py-2.5 text-white font-bold text-sm focus:border-amber-500"
                  />
                  <button 
                    onClick={() => setCalcDownPayment(calcPrice * 0.2)}
                    className="px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold text-[11px]"
                  >
                    20%
                  </button>
                  <button 
                    onClick={() => setCalcDownPayment(calcPrice * 0.3)}
                    className="px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold text-[11px]"
                  >
                    30%
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1 font-bold">نسبة الفائدة السنوية %:</label>
                  <input
                    type="number"
                    value={calcInterestRate}
                    onChange={(e) => setCalcInterestRate(Number(e.target.value))}
                    className="w-full bg-[#0f172a] border border-slate-700 rounded-xl px-4 py-2.5 text-white font-bold text-sm focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1 font-bold">مدة السداد (شهور):</label>
                  <select
                    value={calcMonths}
                    onChange={(e) => setCalcMonths(Number(e.target.value))}
                    className="w-full bg-[#0f172a] border border-slate-700 rounded-xl px-4 py-2.5 text-white font-bold text-sm focus:border-amber-500"
                  >
                    <option value={12}>12 شهر (سنة)</option>
                    <option value={24}>24 شهر (سنتين)</option>
                    <option value={36}>36 شهر (3 سنوات)</option>
                    <option value={48}>48 شهر (4 سنوات)</option>
                    <option value={60}>60 شهر (5 سنوات)</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-300 text-xs">
              <span className="font-bold block mb-1 flex items-center gap-1">
                <Sparkles size={14} /> الترحيل المحاسبي الذكي
              </span>
              يتم إنشاء قيود فوائد مؤجلة للتقسيط وحساب الذمم المدينة للعميل تلقائياً في دفتر الأستاذ العام.
            </div>
          </div>

          {/* Financial Summary & Installment Table */}
          <div className="lg:col-span-7 bg-[#151b2b] p-6 rounded-2xl border border-slate-800 space-y-4">
            <h3 className="text-sm font-black text-white">ملخص التمويل والقسط الشهري</h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-[#0f172a] p-3 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 block">المبلغ الممول</span>
                <span className="text-sm font-bold text-white">{formatCurrency(loanPrincipal)}</span>
              </div>
              <div className="bg-[#0f172a] p-3 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 block">إجمالي الفوائد</span>
                <span className="text-sm font-bold text-amber-400">{formatCurrency(totalInterest)}</span>
              </div>
              <div className="bg-[#0f172a] p-3 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 block">إجمالي السداد</span>
                <span className="text-sm font-bold text-white">{formatCurrency(totalRepayment)}</span>
              </div>
              <div className="bg-amber-500/20 p-3 rounded-xl border border-amber-500/30">
                <span className="text-[10px] text-amber-300 block font-bold">القسط الشهري</span>
                <span className="text-base font-black text-amber-400">{formatCurrency(monthlyInstallment)}</span>
              </div>
            </div>

            {/* Schedule Preview */}
            <div className="border border-slate-800 rounded-xl overflow-hidden">
              <div className="bg-slate-900 px-4 py-2 text-xs font-bold text-slate-400 border-b border-slate-800 flex justify-between">
                <span>نموذج جدول الأقساط (أول 6 شهور)</span>
                <span>{calcMonths} قسط إجمالي</span>
              </div>
              <div className="divide-y divide-slate-800/60 text-xs">
                {[1, 2, 3, 4, 5, 6].map((num) => {
                  const d = new Date();
                  d.setMonth(d.getMonth() + num);
                  return (
                    <div key={num} className="px-4 py-2.5 flex justify-between items-center text-slate-300">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-slate-800 text-[10px] font-bold flex items-center justify-center text-slate-400">
                          {num}
                        </span>
                        <span>قسط شهر {d.toLocaleDateString('ar-EG', { month: 'short', year: 'numeric' })}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-white">{formatCurrency(monthlyInstallment)}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-400">مستحق</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
