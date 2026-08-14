import React, { useState } from 'react';
import { 
  Dumbbell, 
  Users, 
  Calendar, 
  Activity, 
  Plus, 
  Search, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  QrCode,
  Flame,
  Scale,
  CreditCard,
  Lock
} from 'lucide-react';
import { GymMembershipPlan, GymMemberProfile } from '../../types/industryModules';
import { formatCurrency, cn } from '../../lib/utils';

export const GymFitnessPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'members' | 'gate' | 'plans' | 'inbody'>('members');
  const [searchMember, setSearchMember] = useState('');
  const [scanBarcode, setScanBarcode] = useState('');
  const [gateAccessResult, setGateAccessResult] = useState<{ status: 'GRANTED' | 'DENIED' | null; message: string; member?: GymMemberProfile }>({
    status: null,
    message: ''
  });

  // Plans
  const [plans, setPlans] = useState<GymMembershipPlan[]>([
    {
      id: 'pl1',
      planName: 'باقة الفضة الشهرية (Silver Monthly)',
      durationDays: 30,
      price: 600,
      includesTrainer: false,
      freeFreezesDays: 3,
      spaAndSaunaAccess: false,
      nutritionPlanIncluded: false
    },
    {
      id: 'pl2',
      planName: 'باقة الذهب 3 شهور (Gold Quarterly)',
      durationDays: 90,
      price: 1500,
      includesTrainer: true,
      freeFreezesDays: 14,
      spaAndSaunaAccess: true,
      nutritionPlanIncluded: true
    },
    {
      id: 'pl3',
      planName: 'باقة VIP السنوية الشاملة (Diamond VIP)',
      durationDays: 365,
      price: 4800,
      includesTrainer: true,
      freeFreezesDays: 45,
      spaAndSaunaAccess: true,
      nutritionPlanIncluded: true
    }
  ]);

  // Members Profile & InBody
  const [members, setMembers] = useState<GymMemberProfile[]>([
    {
      id: 'm1',
      membershipNumber: 'GYM-2026-8801',
      memberBarcode: '62299001',
      fullName: 'كابتن / محمد إبراهيم الشناوي',
      phone: '01019283746',
      gender: 'ذكر',
      planName: 'باقة الذهب 3 شهور (Gold Quarterly)',
      startDate: '2026-06-01',
      endDate: '2026-09-01',
      daysRemaining: 18,
      assignedTrainer: 'كابتن رامي مدرب اللياقة',
      lockerNumber: 'L-42',
      status: 'ACTIVE',
      inBodyHistory: [
        { date: '2026-06-01', weightKg: 88.5, fatPercentage: 22.4, muscleMassKg: 38.2, waterPercent: 56.1 },
        { date: '2026-08-01', weightKg: 82.0, fatPercentage: 16.8, muscleMassKg: 40.5, waterPercent: 61.2 }
      ],
      attendanceLog: [
        { checkInTime: '2026-08-14 05:40 م', gate: 'البوابة الإلكترونية 1' }
      ]
    },
    {
      id: 'm2',
      membershipNumber: 'GYM-2026-8802',
      memberBarcode: '62299002',
      fullName: 'ياسمين محمود شاكر',
      phone: '01229384719',
      gender: 'أنثى',
      planName: 'باقة الفضة الشهرية (Silver Monthly)',
      startDate: '2026-07-10',
      endDate: '2026-08-10',
      daysRemaining: 0,
      status: 'EXPIRED',
      inBodyHistory: [
        { date: '2026-07-10', weightKg: 64.0, fatPercentage: 28.5, muscleMassKg: 22.1, waterPercent: 52.0 }
      ],
      attendanceLog: []
    },
    {
      id: 'm3',
      membershipNumber: 'GYM-2026-8803',
      memberBarcode: '62299003',
      fullName: 'أحمد وائل الحديدي',
      phone: '01118293847',
      gender: 'ذكر',
      planName: 'باقة VIP السنوية الشاملة (Diamond VIP)',
      startDate: '2026-01-15',
      endDate: '2027-01-15',
      daysRemaining: 154,
      assignedTrainer: 'كابتن حسام مدرب كمال أجسام',
      lockerNumber: 'VIP-08',
      status: 'ACTIVE',
      inBodyHistory: [
        { date: '2026-01-15', weightKg: 95.0, fatPercentage: 26.0, muscleMassKg: 41.0, waterPercent: 54.0 },
        { date: '2026-07-15', weightKg: 86.5, fatPercentage: 14.5, muscleMassKg: 45.2, waterPercent: 63.5 }
      ],
      attendanceLog: [
        { checkInTime: '2026-08-14 06:15 م', gate: 'بوابة الـ VIP' }
      ]
    }
  ]);

  const handleSimulateGateScan = (barcode: string) => {
    const mem = members.find(m => m.memberBarcode === barcode || m.membershipNumber === barcode);
    if (!mem) {
      setGateAccessResult({
        status: 'DENIED',
        message: 'عذراً، الباركود غير مسجل في قاعدة بيانات الجيم!'
      });
      return;
    }

    if (mem.status === 'EXPIRED') {
      setGateAccessResult({
        status: 'DENIED',
        message: `تم رفض الدخول! اشتراك العضو [${mem.fullName}] منتهي ويحتاج تجديد.`,
        member: mem
      });
    } else if (mem.status === 'FROZEN') {
      setGateAccessResult({
        status: 'DENIED',
        message: `تم رفض الدخول! اشتراك العضو [${mem.fullName}] مجمد حالياً.`,
        member: mem
      });
    } else {
      setGateAccessResult({
        status: 'GRANTED',
        message: `أهلاً بك يا ${mem.fullName}! تم فتح البوابة الإلكترونية بنجاح (المتبقي ${mem.daysRemaining} يوم).`,
        member: mem
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-[#151b2b] border border-emerald-500/30 rounded-3xl p-6 shadow-2xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500"></div>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Dumbbell size={14} />
              <span>Gym & Fitness Club Master Module</span>
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-white">
            صالات الجيم، اللياقة البدنية والنوادي الصحية
          </h1>
          <p className="text-xs md:text-sm text-slate-400">
            إدارة الاشتراكات والتجديدات، بوابة الدخول بالباركود والـ RFID، تتبع قياسات InBody والمدربين الشخصيين PT.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-[#0f172a] p-3 rounded-2xl border border-slate-800 flex items-center gap-3">
            <Users className="text-emerald-400" size={24} />
            <div>
              <p className="text-[10px] text-slate-400">الأعضاء النشطين</p>
              <p className="text-xs font-bold text-white">
                {members.filter(m => m.status === 'ACTIVE').length} من إجمالي {members.length} عضو
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('members')}
          className={cn(
            "px-5 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2",
            activeTab === 'members' ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20" : "bg-slate-900 text-slate-400 hover:text-white"
          )}
        >
          <Users size={16} />
          <span>سجل المشتركين والأعضاء ({members.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('gate')}
          className={cn(
            "px-5 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2",
            activeTab === 'gate' ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20" : "bg-slate-900 text-slate-400 hover:text-white"
          )}
        >
          <QrCode size={16} />
          <span>بوابة الدخول الذكية والباركود</span>
        </button>
        <button
          onClick={() => setActiveTab('inbody')}
          className={cn(
            "px-5 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2",
            activeTab === 'inbody' ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20" : "bg-slate-900 text-slate-400 hover:text-white"
          )}
        >
          <Scale size={16} />
          <span>قياسات الـ InBody واللياقة</span>
        </button>
        <button
          onClick={() => setActiveTab('plans')}
          className={cn(
            "px-5 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2",
            activeTab === 'plans' ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20" : "bg-slate-900 text-slate-400 hover:text-white"
          )}
        >
          <CreditCard size={16} />
          <span>باقات وعروض الاشتراكات ({plans.length})</span>
        </button>
      </div>

      {/* TAB 1: MEMBERS */}
      {activeTab === 'members' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {members.map((mem) => (
              <div key={mem.id} className="bg-[#151b2b] border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-slate-900 text-emerald-400 border border-slate-700">
                      {mem.membershipNumber}
                    </span>
                    <h3 className="text-base font-black text-white mt-1">{mem.fullName}</h3>
                    <p className="text-xs text-slate-400">{mem.phone}</p>
                  </div>
                  <span className={cn(
                    "text-[10px] font-bold px-2.5 py-0.5 rounded-full border",
                    mem.status === 'ACTIVE' ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" :
                    mem.status === 'EXPIRED' ? "bg-rose-500/20 text-rose-300 border-rose-500/30" : "bg-amber-500/20 text-amber-300 border-amber-500/30"
                  )}>
                    {mem.status === 'ACTIVE' ? `ساري (${mem.daysRemaining} يوم)` :
                     mem.status === 'EXPIRED' ? 'منتهي الصلاحية' : 'مجمد'}
                  </span>
                </div>

                <div className="bg-[#0f172a] p-3 rounded-xl border border-slate-800 space-y-2 text-xs">
                  <div className="flex justify-between text-slate-400">
                    <span>الباقة:</span>
                    <span className="font-bold text-white">{mem.planName}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>المدرب الشخصي:</span>
                    <span className="text-amber-300 font-bold">{mem.assignedTrainer || 'بدون مدرب'}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>رقم الخزينة (Locker):</span>
                    <span className="text-cyan-300 font-mono font-bold">{mem.lockerNumber || 'غير محدد'}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>تاريخ الانتهاء:</span>
                    <span className="text-slate-200">{mem.endDate}</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleSimulateGateScan(mem.memberBarcode)}
                    className="flex-1 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5"
                  >
                    <QrCode size={14} /> فحص البوابة
                  </button>
                  <button className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold text-xs">
                    تجديد الباقة
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: GATE ACCESS SIMULATOR */}
      {activeTab === 'gate' && (
        <div className="bg-[#151b2b] p-6 rounded-3xl border border-slate-800 space-y-6 max-w-2xl mx-auto shadow-2xl">
          <div className="text-center space-y-2">
            <QrCode className="mx-auto text-emerald-400" size={48} />
            <h3 className="text-xl font-black text-white">محاكي بوابة الجيم الإلكترونية الذكية</h3>
            <p className="text-xs text-slate-400">امسح باركود كارت العضو أو أدخل رقم العضوية للتحقق الفوري من سريان الاشتراك</p>
          </div>

          <div className="flex gap-3">
            <input
              type="text"
              value={scanBarcode}
              onChange={(e) => setScanBarcode(e.target.value)}
              placeholder="امسح الباركود أو اكتب كود العضو (مثال: 62299001 أو 62299002)"
              className="flex-1 bg-[#0f172a] border border-slate-700 rounded-xl px-4 py-3 text-sm text-white font-mono placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
            />
            <button
              onClick={() => handleSimulateGateScan(scanBarcode)}
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-lg"
            >
              فحص وتمرير
            </button>
          </div>

          {gateAccessResult.status && (
            <div className={cn(
              "p-5 rounded-2xl border text-right space-y-3 transition-all",
              gateAccessResult.status === 'GRANTED' ? "bg-emerald-950/40 border-emerald-500/50 text-emerald-200" : "bg-rose-950/40 border-rose-500/50 text-rose-200"
            )}>
              <div className="flex items-center gap-2 text-base font-black">
                {gateAccessResult.status === 'GRANTED' ? (
                  <>
                    <CheckCircle2 className="text-emerald-400" size={24} />
                    <span>تم السماح بالدخول - البوابة مفتوحة ✓</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="text-rose-400" size={24} />
                    <span>تم منع الدخول - البوابة مغلقة ✕</span>
                  </>
                )}
              </div>
              <p className="text-sm font-bold">{gateAccessResult.message}</p>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: INBODY */}
      {activeTab === 'inbody' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {members.filter(m => m.inBodyHistory && m.inBodyHistory.length > 0).map((mem) => (
              <div key={mem.id} className="bg-[#151b2b] p-6 rounded-2xl border border-slate-800 space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="text-base font-black text-white">{mem.fullName}</h4>
                    <p className="text-xs text-slate-400">{mem.membershipNumber}</p>
                  </div>
                  <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                    تطور قياسات الجسم
                  </span>
                </div>

                <div className="space-y-3">
                  {mem.inBodyHistory?.map((ib, idx) => (
                    <div key={idx} className="bg-[#0f172a] p-3.5 rounded-xl border border-slate-800 text-xs grid grid-cols-4 gap-2 text-center">
                      <div>
                        <span className="text-[10px] text-slate-500 block">التاريخ</span>
                        <span className="font-bold text-slate-300">{ib.date}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block">الوزن</span>
                        <span className="font-bold text-white">{ib.weightKg} كجم</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block">نسبة الدهون</span>
                        <span className="font-bold text-amber-400">{ib.fatPercentage}%</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block">الكتلة العضلية</span>
                        <span className="font-bold text-emerald-400">{ib.muscleMassKg} كجم</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: PLANS */}
      {activeTab === 'plans' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div key={plan.id} className="bg-[#151b2b] border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full">
                  {plan.durationDays} يوم اشتراك
                </span>
                <h3 className="text-lg font-black text-white mt-2">{plan.planName}</h3>
                <p className="text-2xl font-black text-emerald-400">{formatCurrency(plan.price)}</p>

                <div className="space-y-2 text-xs text-slate-300 border-t border-slate-800 pt-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-emerald-400" />
                    <span>أيام تجميد مجانية: {plan.freeFreezesDays} يوم</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={14} className={plan.includesTrainer ? "text-emerald-400" : "text-slate-600"} />
                    <span>{plan.includesTrainer ? 'شامل مدرب شخصي PT' : 'بدون مدرب شخصي'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={14} className={plan.spaAndSaunaAccess ? "text-emerald-400" : "text-slate-600"} />
                    <span>{plan.spaAndSaunaAccess ? 'دخول مجاني للسبا والساونا والجاكوزي' : 'بدون خدمات السبا'}</span>
                  </div>
                </div>
              </div>

              <button className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-lg">
                اشتراك جديد في الباقة
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
