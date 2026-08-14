import React, { useState } from 'react';
import { 
  Baby, 
  Users, 
  Calendar, 
  Heart, 
  Plus, 
  Search, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  Bus,
  UtensilsCrossed,
  ShieldAlert,
  FileCheck
} from 'lucide-react';
import { NurseryChildProfile } from '../../types/industryModules';
import { formatCurrency, cn } from '../../lib/utils';

export const NurseryPreschoolPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'children' | 'attendance' | 'daily_report'>('children');
  const [searchChild, setSearchChild] = useState('');

  // Children Profiles
  const [children, setChildren] = useState<NurseryChildProfile[]>([
    {
      id: 'ch1',
      childCode: 'NUR-2026-041',
      fullName: 'حمزة أحمد عبد الرحمن',
      dateOfBirth: '2023-04-12',
      ageYearsMonths: '3 سنوات و4 شهور',
      gender: 'ولد',
      className: 'فصل البراعم (KG1)',
      guardianName: 'أحمد عبد الرحمن (الأب)',
      guardianPhone: '01019283746',
      emergencyPhone: '01099283711',
      monthlyFee: 1600,
      busServiceIncluded: true,
      busRoute: 'خط باص النزهة والتجمع',
      mealsIncluded: true,
      specialNeedsOrAllergies: 'حساسية من الفراولة والشوكولاتة',
      paymentStatus: 'PAID',
      attendanceStatusToday: 'PRESENT',
      dailyActivitiesLog: {
        activityName: 'رسم وتلوين بالأصابع + تحفيظ سورة الفاتحة والأرقام بالإنجليزية',
        napTime: 'ساعة واحدة (من 01:00 م إلى 02:00 م)',
        mealEatenPercent: 95,
        behaviorNote: 'ممتاز ومتعاون جداً مع أصدقائه ومحب للمشاركة'
      }
    },
    {
      id: 'ch2',
      childCode: 'NUR-2026-042',
      fullName: 'فريدة حسام الشاذلي',
      dateOfBirth: '2024-01-20',
      ageYearsMonths: 'سنتان و7 شهور',
      gender: 'بنت',
      className: 'بيبي كلاس (Toddlers)',
      guardianName: 'د. مروة فؤاد (الأم)',
      guardianPhone: '01229384715',
      emergencyPhone: '01229988771',
      monthlyFee: 1400,
      busServiceIncluded: false,
      mealsIncluded: true,
      specialNeedsOrAllergies: 'حساسية خفيفة من اللاكتوز / حليب الأبقار',
      paymentStatus: 'PAID',
      attendanceStatusToday: 'PRESENT',
      dailyActivitiesLog: {
        activityName: 'أنشطة مونتيسوري الحسية وتنمية المهارات الحركية الدقيقة',
        napTime: 'ساعة ونصف',
        mealEatenPercent: 80,
        behaviorNote: 'هادئة وتستجيب للألعاب الموسيقية ببراعة'
      }
    },
    {
      id: 'ch3',
      childCode: 'NUR-2026-043',
      fullName: 'عمر خالد المنشاوي',
      dateOfBirth: '2022-11-05',
      ageYearsMonths: '3 سنوات و9 شهور',
      gender: 'ولد',
      className: 'فصل العباقرة (KG2)',
      guardianName: 'خالد المنشاوي (الأب)',
      guardianPhone: '01118273645',
      emergencyPhone: '01119922883',
      monthlyFee: 1800,
      busServiceIncluded: true,
      busRoute: 'خط باص مصر الجديدة ومدينة نصر',
      mealsIncluded: true,
      paymentStatus: 'PARTIAL',
      attendanceStatusToday: 'ABSENT'
    }
  ]);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-[#151b2b] border border-amber-500/30 rounded-3xl p-6 shadow-2xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-r from-amber-500 via-yellow-500 to-orange-500"></div>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Baby size={14} />
              <span>Nursery, Preschool & Childcare Master Module</span>
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-white">
            الحضانات، رياض الأطفال ومراكز رعاية الطفولة
          </h1>
          <p className="text-xs md:text-sm text-slate-400">
            ملفات الأطفال والحساسية الطبية، اشتراكات الباص والوجبات، تقرير اليومية وسلوك الطفل، وحضور وغياب الفصول.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-[#0f172a] p-3 rounded-2xl border border-slate-800 flex items-center gap-3">
            <Users className="text-amber-400" size={24} />
            <div>
              <p className="text-[10px] text-slate-400">الأطفال المسجلين</p>
              <p className="text-xs font-bold text-white">
                {children.length} طفل بالحضانة
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('children')}
          className={cn(
            "px-5 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2",
            activeTab === 'children' ? "bg-amber-600 text-white shadow-md shadow-amber-600/20" : "bg-slate-900 text-slate-400 hover:text-white"
          )}
        >
          <Baby size={16} />
          <span>ملفات الأطفال والاشتراكات ({children.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('daily_report')}
          className={cn(
            "px-5 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2",
            activeTab === 'daily_report' ? "bg-amber-600 text-white shadow-md shadow-amber-600/20" : "bg-slate-900 text-slate-400 hover:text-white"
          )}
        >
          <FileCheck size={16} />
          <span>تقرير اليومية والأنشطة والسلوكيات</span>
        </button>
        <button
          onClick={() => setActiveTab('attendance')}
          className={cn(
            "px-5 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2",
            activeTab === 'attendance' ? "bg-amber-600 text-white shadow-md shadow-amber-600/20" : "bg-slate-900 text-slate-400 hover:text-white"
          )}
        >
          <Calendar size={16} />
          <span>حضور وغياب الفصول اليومي</span>
        </button>
      </div>

      {/* TAB 1: CHILDREN PROFILES */}
      {activeTab === 'children' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {children.map((child) => (
              <div key={child.id} className="bg-[#151b2b] border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-slate-900 text-amber-400 border border-slate-700">
                      {child.childCode}
                    </span>
                    <h3 className="text-base font-black text-white mt-1">{child.fullName}</h3>
                    <p className="text-xs text-slate-400">السن: <span className="text-slate-200 font-bold">{child.ageYearsMonths}</span> ({child.gender})</p>
                  </div>
                  <span className={cn(
                    "text-[10px] font-bold px-2.5 py-0.5 rounded-full border",
                    child.attendanceStatusToday === 'PRESENT' ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" : "bg-rose-500/20 text-rose-300 border-rose-500/30"
                  )}>
                    {child.attendanceStatusToday === 'PRESENT' ? 'حاضر اليوم' : 'غائب'}
                  </span>
                </div>

                <div className="bg-[#0f172a] p-3 rounded-xl border border-slate-800 space-y-2 text-xs">
                  <div className="flex justify-between text-slate-400">
                    <span>الفصل والمرحلة:</span>
                    <span className="font-bold text-amber-300">{child.className}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>ولي الأمر والهاتف:</span>
                    <span className="text-slate-200">{child.guardianName} ({child.guardianPhone})</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>خدمة الباص:</span>
                    <span className={child.busServiceIncluded ? "text-emerald-400 font-bold flex items-center gap-1" : "text-slate-500"}>
                      <Bus size={12} /> {child.busServiceIncluded ? child.busRoute : 'بدون باص'}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>المصروفات الشهرية:</span>
                    <span className="text-emerald-400 font-black">{formatCurrency(child.monthlyFee)}</span>
                  </div>
                </div>

                {/* Medical & Allergies Alert */}
                {child.specialNeedsOrAllergies && (
                  <div className="bg-rose-500/10 border border-rose-500/30 p-2.5 rounded-xl text-xs space-y-1 text-rose-300">
                    <span className="font-bold flex items-center gap-1">
                      <ShieldAlert size={14} /> تنبيه الحساسية والرعاية:
                    </span>
                    <p className="text-[11px] text-rose-200 font-medium">{child.specialNeedsOrAllergies}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: DAILY REPORT */}
      {activeTab === 'daily_report' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {children.filter(c => c.dailyActivitiesLog).map((child) => (
              <div key={child.id} className="bg-[#151b2b] p-6 rounded-2xl border border-slate-800 space-y-4">
                <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                  <div>
                    <h3 className="text-base font-black text-white">{child.fullName}</h3>
                    <p className="text-xs text-amber-400 font-bold">{child.className}</p>
                  </div>
                  <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                    تقرير يوم 14 أغسطس 2026
                  </span>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="bg-[#0f172a] p-3 rounded-xl border border-slate-800 space-y-1">
                    <span className="text-slate-500 text-[10px] block font-bold">الأنشطة والتعليم:</span>
                    <p className="text-slate-200 font-bold">{child.dailyActivitiesLog?.activityName}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-[#0f172a] p-3 rounded-xl border border-slate-800">
                      <span className="text-slate-500 text-[10px] block font-bold">القيلولة والنوم:</span>
                      <span className="text-amber-300 font-bold">{child.dailyActivitiesLog?.napTime}</span>
                    </div>
                    <div className="bg-[#0f172a] p-3 rounded-xl border border-slate-800">
                      <span className="text-slate-500 text-[10px] block font-bold">نسبة تناول الوجبة:</span>
                      <span className="text-emerald-400 font-black">{child.dailyActivitiesLog?.mealEatenPercent}%</span>
                    </div>
                  </div>

                  <div className="bg-[#0f172a] p-3 rounded-xl border border-slate-800 space-y-1">
                    <span className="text-slate-500 text-[10px] block font-bold">ملاحظة المشرفة والسلوك:</span>
                    <p className="text-slate-300">{child.dailyActivitiesLog?.behaviorNote}</p>
                  </div>
                </div>

                <button className="w-full py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold text-xs">
                  إرسال التقرير لولي الأمر عبر WhatsApp
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: ATTENDANCE */}
      {activeTab === 'attendance' && (
        <div className="bg-[#151b2b] p-6 rounded-2xl border border-slate-800 space-y-6">
          <h3 className="text-base font-black text-white flex items-center gap-2">
            <Calendar className="text-amber-400" size={18} />
            <span>كشف الحضور والغياب اليومي</span>
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-[#0f172a] text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="p-3">كود الطفل</th>
                  <th className="p-3">اسم الطفل</th>
                  <th className="p-3">الفصل</th>
                  <th className="p-3">هاتف ولي الأمر</th>
                  <th className="p-3">حالة الحضور</th>
                  <th className="p-3 text-center">الإجراء</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {children.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-900/50">
                    <td className="p-3 font-mono text-amber-300">{c.childCode}</td>
                    <td className="p-3 font-bold text-white">{c.fullName}</td>
                    <td className="p-3 text-slate-300">{c.className}</td>
                    <td className="p-3 font-mono text-slate-400">{c.guardianPhone}</td>
                    <td className="p-3">
                      <span className={cn(
                        "px-2.5 py-1 rounded-full text-[10px] font-bold border",
                        c.attendanceStatusToday === 'PRESENT' ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" : "bg-rose-500/20 text-rose-300 border-rose-500/30"
                      )}>
                        {c.attendanceStatusToday === 'PRESENT' ? 'حاضر' : 'غائب'}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <button className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-bold text-xs">
                        تعديل الحالة
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
