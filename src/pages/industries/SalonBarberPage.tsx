import React, { useState } from 'react';
import { 
  Scissors, 
  Users, 
  Calendar, 
  Plus, 
  Search, 
  Clock, 
  CheckCircle2, 
  Sparkles, 
  DollarSign, 
  Crown,
  UserCheck,
  Percent,
  Receipt
} from 'lucide-react';
import { SalonServiceItem, SalonBookingTicket } from '../../types/industryModules';
import { formatCurrency, cn } from '../../lib/utils';

export const SalonBarberPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'queue' | 'services' | 'staff_commissions'>('queue');
  const [searchTerm, setSearchTerm] = useState('');

  // Queue of Active Salon Chairs / Bookings
  const [tickets, setTickets] = useState<SalonBookingTicket[]>([
    {
      id: 'tkt1',
      ticketNumber: 'SAL-2026-101',
      clientName: 'طارق عبد المحسن',
      clientPhone: '01019827364',
      staffName: 'أسطى / حسام مصفف أول',
      chairNumber: 'كرسي VIP 01',
      serviceName: 'باقة VIP ملكي (قص شعر + سشوار + تصفيف + تنظيف بشرة بالبخار + ماسك كولاجين)',
      serviceCategory: 'قص شعر وتصفيف',
      bookingTime: '06:00 م',
      durationMinutes: 45,
      totalAmount: 350,
      discount: 0,
      netAmount: 350,
      staffCommission: 140, // 40%
      centerShare: 210,
      paymentStatus: 'PAID',
      paymentMethod: 'فيزا / بطاقة',
      status: 'IN_SERVICE'
    },
    {
      id: 'tkt2',
      ticketNumber: 'SAL-2026-102',
      clientName: 'سارة عبد المنعم والعروسة',
      clientPhone: '01229182731',
      staffName: 'مدام / رانيا خبيرة تجميل',
      chairNumber: 'جناح العرائس Suite 1',
      serviceName: 'تجهيز ميك اب سينمائي + صبغة هاي لايت وسشوار ملكي',
      serviceCategory: 'ميك اب وتجهيز عرايس',
      bookingTime: '06:30 م',
      durationMinutes: 90,
      totalAmount: 1800,
      discount: 100,
      netAmount: 1700,
      staffCommission: 680, // 40%
      centerShare: 1020,
      paymentStatus: 'PAID',
      paymentMethod: 'نقد',
      status: 'IN_SERVICE'
    },
    {
      id: 'tkt3',
      ticketNumber: 'SAL-2026-103',
      clientName: 'المهندس / زياد كمال',
      clientPhone: '01119283746',
      staffName: 'كابتن / إسلام باربر',
      chairNumber: 'كرسي 03',
      serviceName: 'قص شعر عصري فاديج + تدريج لحية بالليزر + حمام زيت كيراتين',
      serviceCategory: 'قص شعر وتصفيف',
      bookingTime: '07:15 م',
      durationMinutes: 30,
      totalAmount: 180,
      discount: 0,
      netAmount: 180,
      staffCommission: 72,
      centerShare: 108,
      paymentStatus: 'PENDING',
      paymentMethod: 'نقد',
      status: 'WAITING'
    }
  ]);

  // Catalog of Salon & Beauty Services
  const [services, setServices] = useState<SalonServiceItem[]>([
    {
      id: 'srv1',
      serviceName: 'قص شعر عصري وتصفيف سشوار',
      category: 'قص شعر وتصفيف',
      targetAudience: 'رجالي',
      durationMinutes: 25,
      price: 100,
      defaultStaffCommissionPercent: 40
    },
    {
      id: 'srv2',
      serviceName: 'جلسة تنظيف عميق للبشرة بالهيدرافيشيل وجهاز البخار',
      category: 'عناية بالبشرة وتنظيف',
      targetAudience: 'للجنسين',
      durationMinutes: 45,
      price: 350,
      defaultStaffCommissionPercent: 35
    },
    {
      id: 'srv3',
      serviceName: 'جلسة علاجية بروتين وفيلر شعر برازيلي أصلي 100%',
      category: 'صبغات وبروتين وكرياتين',
      targetAudience: 'حريمي',
      durationMinutes: 120,
      price: 1200,
      defaultStaffCommissionPercent: 40
    },
    {
      id: 'srv4',
      serviceName: 'باقة VIP تجهيز ميك اب سواريه / عرايس كامل',
      category: 'ميك اب وتجهيز عرايس',
      targetAudience: 'حريمي',
      durationMinutes: 90,
      price: 1800,
      defaultStaffCommissionPercent: 40
    },
    {
      id: 'srv5',
      serviceName: 'بديكير ومساج سبا قدمين وجاكوزي',
      category: 'بديكير ومنيكير',
      targetAudience: 'للجنسين',
      durationMinutes: 40,
      price: 250,
      defaultStaffCommissionPercent: 35
    }
  ]);

  const handleFinishService = (ticketId: string) => {
    setTickets(tickets.map(t => t.id === ticketId ? { ...t, status: 'COMPLETED', paymentStatus: 'PAID' } : t));
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-[#151b2b] border border-rose-500/30 rounded-3xl p-6 shadow-2xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-r from-rose-500 via-pink-500 to-amber-500"></div>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Scissors size={14} />
              <span>Barber, Beauty Salon & Spa Master Module</span>
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-white">
            صالونات الحلاقة، مراكز التجميل، الكوافير والسبا
          </h1>
          <p className="text-xs md:text-sm text-slate-400">
            إدارة الكراسي والغرف، حجز المواعيد والخدمات، طابور الانتظار، وتقسيم وحساب نسب وعمولات المصففين والحلاقين التلقائية.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-[#0f172a] p-3 rounded-2xl border border-slate-800 flex items-center gap-3">
            <Crown className="text-amber-400" size={24} />
            <div>
              <p className="text-[10px] text-slate-400">إجمالي إيراد اليوم</p>
              <p className="text-xs font-bold text-white">
                {formatCurrency(tickets.reduce((acc, t) => acc + t.netAmount, 0))}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('queue')}
          className={cn(
            "px-5 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2",
            activeTab === 'queue' ? "bg-rose-600 text-white shadow-md shadow-rose-600/20" : "bg-slate-900 text-slate-400 hover:text-white"
          )}
        >
          <Clock size={16} />
          <span>كراسي وطابور الخدمة المباشرة ({tickets.filter(t => t.status !== 'COMPLETED').length})</span>
        </button>
        <button
          onClick={() => setActiveTab('services')}
          className={cn(
            "px-5 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2",
            activeTab === 'services' ? "bg-rose-600 text-white shadow-md shadow-rose-600/20" : "bg-slate-900 text-slate-400 hover:text-white"
          )}
        >
          <Sparkles size={16} />
          <span>قائمة وباقات الخدمات والتسعير ({services.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('staff_commissions')}
          className={cn(
            "px-5 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2",
            activeTab === 'staff_commissions' ? "bg-rose-600 text-white shadow-md shadow-rose-600/20" : "bg-slate-900 text-slate-400 hover:text-white"
          )}
        >
          <DollarSign size={16} />
          <span>تسوية عمولات ونسب المصففين اليومية</span>
        </button>
      </div>

      {/* TAB 1: CHAIRS & QUEUE */}
      {activeTab === 'queue' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {tickets.map((t) => (
              <div key={t.id} className="bg-[#151b2b] border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-slate-900 text-rose-400 border border-slate-700">
                        {t.ticketNumber}
                      </span>
                      <h3 className="text-base font-black text-white mt-1">{t.clientName}</h3>
                      <p className="text-xs text-slate-400">{t.clientPhone}</p>
                    </div>
                    <span className={cn(
                      "text-[10px] font-bold px-2.5 py-0.5 rounded-full border",
                      t.status === 'IN_SERVICE' ? "bg-rose-500/20 text-rose-300 border-rose-500/30 animate-pulse" :
                      t.status === 'WAITING' ? "bg-amber-500/20 text-amber-300 border-amber-500/30" : "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                    )}>
                      {t.status === 'IN_SERVICE' ? 'على الكرسي الآن' :
                       t.status === 'WAITING' ? 'في الانتظار' : 'مكتمل'}
                    </span>
                  </div>

                  <div className="bg-[#0f172a] p-3 rounded-xl border border-slate-800 space-y-2 text-xs">
                    <div className="flex justify-between text-slate-400">
                      <span>الكرسي / الغرفة:</span>
                      <span className="font-bold text-amber-300">{t.chairNumber}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>المصفف / الكوافيرة:</span>
                      <span className="font-bold text-white">{t.staffName}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>الخدمة:</span>
                      <span className="font-bold text-rose-200">{t.serviceName}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>توقيت الحجز والمدة:</span>
                      <span className="text-slate-300">{t.bookingTime} ({t.durationMinutes} دقيقة)</span>
                    </div>
                    <div className="flex justify-between border-t border-slate-800 pt-2">
                      <span className="text-slate-400">إجمالي الحساب:</span>
                      <span className="text-emerald-400 font-black text-sm">{formatCurrency(t.netAmount)}</span>
                    </div>
                  </div>
                </div>

                {t.status !== 'COMPLETED' ? (
                  <button
                    onClick={() => handleFinishService(t.id)}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition-all"
                  >
                    <CheckCircle2 size={16} />
                    <span>إنهاء الجلسة وطباعة الإيصال المحاسبي</span>
                  </button>
                ) : (
                  <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-2.5 rounded-xl text-xs font-bold text-center">
                    تمت الخدمة وترحيل القيد للدفتر اليومي ✓
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: SERVICES CATALOG */}
      {activeTab === 'services' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((srv) => (
              <div key={srv.id} className="bg-[#151b2b] border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
                <div className="flex justify-between items-start">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                    {srv.category}
                  </span>
                  <span className="text-emerald-400 font-black text-base">{formatCurrency(srv.price)}</span>
                </div>

                <h3 className="text-sm font-black text-white">{srv.serviceName}</h3>

                <div className="bg-[#0f172a] p-3 rounded-xl border border-slate-800 space-y-1.5 text-xs text-slate-400">
                  <div className="flex justify-between">
                    <span>الفئة المستهدفة:</span>
                    <span className="text-slate-200 font-bold">{srv.targetAudience}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>المدة التقريبية:</span>
                    <span className="text-slate-200">{srv.durationMinutes} دقيقة</span>
                  </div>
                  <div className="flex justify-between">
                    <span>نسبة المصفف التلقائية:</span>
                    <span className="text-amber-400 font-bold">{srv.defaultStaffCommissionPercent}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: STAFF COMMISSIONS */}
      {activeTab === 'staff_commissions' && (
        <div className="bg-[#151b2b] p-6 rounded-2xl border border-slate-800 space-y-6">
          <h3 className="text-base font-black text-white flex items-center gap-2">
            <Percent className="text-rose-400" size={18} />
            <span>تسوية نسب وعمولات المصففين والحلاقين اليومية</span>
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-[#0f172a] text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="p-3">اسم المصفف / الحلاق</th>
                  <th className="p-3">رقم التذكرة</th>
                  <th className="p-3">الخدمة المنفذة</th>
                  <th className="p-3">إجمالي القيمة</th>
                  <th className="p-3">عمولة المصفف</th>
                  <th className="p-3">حصة الصالون</th>
                  <th className="p-3 text-center">الإجراء</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {tickets.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-900/50">
                    <td className="p-3 font-bold text-white">{t.staffName}</td>
                    <td className="p-3 font-mono text-rose-300">{t.ticketNumber}</td>
                    <td className="p-3 text-slate-300 max-w-xs truncate">{t.serviceName}</td>
                    <td className="p-3 font-bold text-emerald-400">{formatCurrency(t.netAmount)}</td>
                    <td className="p-3 font-black text-amber-300">{formatCurrency(t.staffCommission)}</td>
                    <td className="p-3 font-bold text-slate-300">{formatCurrency(t.centerShare)}</td>
                    <td className="p-3 text-center">
                      <button className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs shadow-md">
                        صرف العمولة
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
