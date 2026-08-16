/**
 * @file TourismTravelPage.tsx
 * @module واجهات وصفحات النظام (UI Pages)
 * @description ملف جزء من نظام MARO ERP. الوظيفة: TourismTravelPage.tsx.
 */
import React, { useState } from 'react';
import { 
  Plane, 
  Palmtree, 
  Compass, 
  Users, 
  Calendar, 
  MapPin, 
  CreditCard, 
  Plus, 
  Search, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  FileText, 
  Hotel, 
  Building2,
  Ticket,
  Send
} from 'lucide-react';
import { TourismTravelPackage, TourismBookingTicket } from '../../types/industryModules';
import { formatCurrency, cn } from '../../lib/utils';

export const TourismTravelPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'packages' | 'bookings' | 'visas'>('packages');
  const [searchTerm, setSearchTerm] = useState('');

  // Packages state
  const [packages, setPackages] = useState<TourismTravelPackage[]>([
    {
      id: 'pkg1',
      packageCode: 'UMR-2026-08',
      packageName: 'برنامج رحلة عمرة المولد النبوي الشريف - 5 نجوم',
      packageType: 'حج وعمرة',
      destination: 'مكة المكرمة والمدينة المنورة (المملكة العربية السعودية)',
      startDate: '2026-09-10',
      endDate: '2026-09-24',
      durationDaysNights: '14 ليلة (7 مكة + 7 المدينة)',
      airlineCarrier: 'مصر للطيران (EgyptAir)',
      hotelDetails: 'فندق فيرمونت مكة برج الساعة + فندق دار التقوى المدينة',
      visaRequired: true,
      totalSeats: 45,
      availableSeats: 6,
      sellingPricePerPerson: 48500,
      costPerPerson: 41000,
      commissionPerBooking: 1500,
      itinerarySummary: [
        'الانطلاق من مطار القاهرة إلى مطار جدة الدولي والتسكين الفندقي',
        'أداء مناسك العمرة وزيارة مزارات مكة المكرمة (غار حراء، عرفات، منى)',
        'الانتقال بقطار الحرمين السريع إلى المدينة المنورة',
        'زيارة المسجد النبوي الشريف والروضة الشريفة ومسجد قباء'
      ]
    },
    {
      id: 'pkg2',
      packageCode: 'DXB-2026-14',
      packageName: 'باقة سياحة دبي الفاخرة - برج خليفة وسفاري الصحراء',
      packageType: 'سياحة خارجية',
      destination: 'دبي - الإمارات العربية المتحدة',
      startDate: '2026-09-01',
      endDate: '2026-09-06',
      durationDaysNights: '5 ليالي / 6 أيام',
      airlineCarrier: 'طيران الإمارات (Emirates)',
      hotelDetails: 'فندق أتلانتس ذا بالم أو ماريوت داون تاون',
      visaRequired: true,
      totalSeats: 30,
      availableSeats: 12,
      sellingPricePerPerson: 32000,
      costPerPerson: 26500,
      commissionPerBooking: 1000,
      itinerarySummary: [
        'الوصول والاستقبال في مطار دبي بسيارة خاصة والانتقال للفندق',
        'جولة سيتي تور دبي وصعود قمة برج خليفة وزيارة دبي مول',
        'رحلة سفاري الصحراء بالدفع الرباعي وحفل عشاء بدوي مع عروض فلكلورية',
        'يوم كامل ترفيهي في حديقة وايلد وادي المائية وجزيرة النخلة'
      ]
    },
    {
      id: 'pkg3',
      packageCode: 'SHM-2026-22',
      packageName: 'رحلة شرم الشيخ الساحرة - خليج نعمة ورأس محمد VIP',
      packageType: 'سياحة داخلية',
      destination: 'شرم الشيخ - جنوب سيناء',
      startDate: '2026-08-20',
      endDate: '2026-08-24',
      durationDaysNights: '4 ليالي / 5 أيام',
      airlineCarrier: 'باصات سياحية مكيفة VIP',
      hotelDetails: 'منتجع ريكسوس شرم الشيخ All Inclusive',
      visaRequired: false,
      totalSeats: 50,
      availableSeats: 18,
      sellingPricePerPerson: 8500,
      costPerPerson: 6900,
      commissionPerBooking: 400,
      itinerarySummary: [
        'التحرك من نقطة التجمع بالقاهرة بأحدث الأتوبيسات السياحية',
        'رحلة بحرية باليخت إلى محمية رأس محمد وجزيرة تيران مع الغطس',
        'سهرة بدوية في وادي مندر وعشاء مشويات في الجبل',
        'جولة تسوق حرة بسوق سوهو سكوير وخليج نعمة'
      ]
    }
  ]);

  // Bookings state
  const [bookings, setBookings] = useState<TourismBookingTicket[]>([
    {
      id: 'bk1',
      bookingNumber: 'TRV-2026-5501',
      clientName: 'الحاج / عبد الله سعد المنياوي وحرمه',
      clientPhone: '01019283746',
      clientPassportNumber: 'A28917402',
      clientNationality: 'مصري',
      packageName: 'برنامج رحلة عمرة المولد النبوي الشريف - 5 نجوم',
      packageType: 'حج وعمرة',
      numberOfAdults: 2,
      numberOfChildren: 0,
      totalAmount: 97000,
      paidAmount: 97000,
      remainingAmount: 0,
      paymentStatus: 'PAID',
      visaStatus: 'APPROVED',
      flightTicketStatus: 'ISSUED',
      bookingDate: '2026-08-10',
      assignedTourAgent: 'أ/ شريف علام (مسؤول الحج والعمرة)'
    },
    {
      id: 'bk2',
      bookingNumber: 'TRV-2026-5502',
      clientName: 'م. كريم سامي العطار والعائلة',
      clientPhone: '01229384715',
      clientPassportNumber: 'A19827361',
      clientNationality: 'مصري',
      packageName: 'باقة سياحة دبي الفاخرة - برج خليفة وسفاري الصحراء',
      packageType: 'سياحة خارجية',
      numberOfAdults: 2,
      numberOfChildren: 2,
      totalAmount: 96000,
      paidAmount: 50000,
      remainingAmount: 46000,
      paymentStatus: 'PARTIAL',
      visaStatus: 'APPLIED',
      flightTicketStatus: 'PENDING',
      bookingDate: '2026-08-12',
      assignedTourAgent: 'أ/ نورهان عادل (مسؤولة حجوزات دبي)'
    }
  ]);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-[#151b2b] border border-blue-500/30 rounded-3xl p-6 shadow-2xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-r from-blue-500 via-sky-500 to-indigo-500"></div>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Plane size={14} />
              <span>Tourism, Travel & Umrah Agency ERP</span>
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-white">
            شركات السياحة، الطيران وحجوزات الحج والعمرة
          </h1>
          <p className="text-xs md:text-sm text-slate-400">
            برامج الأفواج والرحلات، حجز الطيران والفنادق، إصدار التأشيرات، كشوفات المسافرين، وحساب عمولات الوكلاء والمبيعات.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-[#0f172a] p-3.5 rounded-2xl border border-slate-800 flex items-center gap-3">
            <Palmtree className="text-blue-400" size={26} />
            <div>
              <p className="text-[10px] text-slate-400">إجمالي الحجوزات النشطة</p>
              <p className="text-xs font-bold text-white">
                {formatCurrency(bookings.reduce((acc, b) => acc + b.totalAmount, 0))}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('packages')}
          className={cn(
            "px-5 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2",
            activeTab === 'packages' ? "bg-blue-600 text-white shadow-md shadow-blue-600/20" : "bg-slate-900 text-slate-400 hover:text-white"
          )}
        >
          <Compass size={16} />
          <span>باقات وبرامج الأفواج السياحية ({packages.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('bookings')}
          className={cn(
            "px-5 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2",
            activeTab === 'bookings' ? "bg-blue-600 text-white shadow-md shadow-blue-600/20" : "bg-slate-900 text-slate-400 hover:text-white"
          )}
        >
          <Ticket size={16} />
          <span>حجوزات المسافرين والتذاكر ({bookings.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('visas')}
          className={cn(
            "px-5 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2",
            activeTab === 'visas' ? "bg-blue-600 text-white shadow-md shadow-blue-600/20" : "bg-slate-900 text-slate-400 hover:text-white"
          )}
        >
          <FileText size={16} />
          <span>متابعة التأشيرات وجوازات السفر</span>
        </button>
      </div>

      {/* TAB 1: TOUR PACKAGES */}
      {activeTab === 'packages' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {packages.map((pkg) => (
              <div key={pkg.id} className="bg-[#151b2b] border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-slate-900 text-blue-400 border border-slate-700">
                      {pkg.packageCode}
                    </span>
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                      {pkg.packageType}
                    </span>
                  </div>

                  <h3 className="text-base font-black text-white">{pkg.packageName}</h3>

                  <div className="space-y-2 text-xs bg-[#0f172a] p-3.5 rounded-2xl border border-slate-800 text-slate-300">
                    <div className="flex items-center gap-2 text-slate-400">
                      <MapPin size={14} className="text-rose-400 shrink-0" />
                      <span className="truncate">{pkg.destination}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-400">
                      <Calendar size={14} className="text-blue-400 shrink-0" />
                      <span>{pkg.durationDaysNights} ({pkg.startDate})</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-400">
                      <Hotel size={14} className="text-amber-400 shrink-0" />
                      <span className="truncate">{pkg.hotelDetails}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-400">
                      <Plane size={14} className="text-sky-400 shrink-0" />
                      <span className="truncate">{pkg.airlineCarrier}</span>
                    </div>
                  </div>

                  {/* Seat availability bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">المقاعد المتبقية:</span>
                      <span className="text-amber-400 font-bold">{pkg.availableSeats} من {pkg.totalSeats} مقعد</span>
                    </div>
                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div 
                        className="bg-blue-500 h-full rounded-full" 
                        style={{ width: `${((pkg.totalSeats - pkg.availableSeats) / pkg.totalSeats) * 100}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center border-t border-slate-800 pt-3">
                    <div>
                      <span className="text-[10px] text-slate-500 block">سعر الفرد</span>
                      <span className="text-lg font-black text-emerald-400">{formatCurrency(pkg.sellingPricePerPerson)}</span>
                    </div>
                    <div className="text-left">
                      <span className="text-[10px] text-slate-500 block">ربح الرحلة المتوقع</span>
                      <span className="text-xs font-bold text-amber-300">
                        {formatCurrency((pkg.sellingPricePerPerson - pkg.costPerPerson) * (pkg.totalSeats - pkg.availableSeats))}
                      </span>
                    </div>
                  </div>
                </div>

                <button className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-lg mt-2">
                  حجز عميل جديد في هذا الفوج
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: BOOKINGS */}
      {activeTab === 'bookings' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {bookings.map((bk) => (
              <div key={bk.id} className="bg-[#151b2b] border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-slate-900 text-blue-400 border border-slate-700">
                      {bk.bookingNumber}
                    </span>
                    <h3 className="text-base font-black text-white mt-1">{bk.clientName}</h3>
                    <p className="text-xs text-slate-400">{bk.clientPhone} • جواز: <span className="font-mono text-slate-200">{bk.clientPassportNumber}</span></p>
                  </div>
                  <span className={cn(
                    "text-[10px] font-bold px-2.5 py-0.5 rounded-full border",
                    bk.paymentStatus === 'PAID' ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" : "bg-amber-500/20 text-amber-300 border-amber-500/30"
                  )}>
                    {bk.paymentStatus === 'PAID' ? 'مدفوع بالكامل' : 'متبقي أقساط'}
                  </span>
                </div>

                <div className="bg-[#0f172a] p-3.5 rounded-2xl border border-slate-800 space-y-2 text-xs">
                  <div className="flex justify-between text-slate-400">
                    <span>البرنامج:</span>
                    <span className="font-bold text-white max-w-xs truncate">{bk.packageName}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>عدد الأفراد:</span>
                    <span className="text-slate-200">{bk.numberOfAdults} بالغين {bk.numberOfChildren > 0 ? `+ ${bk.numberOfChildren} أطفال` : ''}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>حالة التأشيرة:</span>
                    <span className={cn(
                      "font-bold",
                      bk.visaStatus === 'APPROVED' ? "text-emerald-400" : "text-amber-400"
                    )}>
                      {bk.visaStatus === 'APPROVED' ? 'تمت الموافقة وإصدار التأشيرة ✓' : 'قيد المراجعة بالقنصلية'}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>تذاكر الطيران:</span>
                    <span className={bk.flightTicketStatus === 'ISSUED' ? "text-emerald-400 font-bold" : "text-amber-400"}>
                      {bk.flightTicketStatus === 'ISSUED' ? 'تم إصدار التذاكر الإلكترونية (E-Ticket)' : 'في انتظار التأكيد'}
                    </span>
                  </div>
                  <div className="flex justify-between border-t border-slate-800 pt-2 text-slate-400">
                    <span>مسؤول الحجز:</span>
                    <span className="text-blue-300">{bk.assignedTourAgent}</span>
                  </div>
                </div>

                <div className="flex justify-between items-center border-t border-slate-800 pt-3">
                  <div>
                    <span className="text-[10px] text-slate-500 block">إجمالي الفاتورة</span>
                    <span className="text-base font-black text-emerald-400">{formatCurrency(bk.totalAmount)}</span>
                  </div>
                  {bk.remainingAmount > 0 && (
                    <div className="text-left">
                      <span className="text-[10px] text-slate-500 block">المبلغ المتبقي</span>
                      <span className="text-sm font-black text-rose-400">{formatCurrency(bk.remainingAmount)}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: VISAS & PASSPORTS */}
      {activeTab === 'visas' && (
        <div className="bg-[#151b2b] p-6 rounded-3xl border border-slate-800 space-y-6">
          <h3 className="text-base font-black text-white flex items-center gap-2">
            <FileText className="text-blue-400" size={18} />
            <span>جدول متابعة إصدار التأشيرات والجوازات للمعتمرين والسياح</span>
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-[#0f172a] text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="p-3">اسم المسافر</th>
                  <th className="p-3">رقم الجواز</th>
                  <th className="p-3">الوجهة والرحلة</th>
                  <th className="p-3">الهاتف</th>
                  <th className="p-3">حالة التأشيرة</th>
                  <th className="p-3 text-center">الإجراء</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {bookings.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-900/50">
                    <td className="p-3 font-bold text-white">{b.clientName}</td>
                    <td className="p-3 font-mono text-blue-300">{b.clientPassportNumber}</td>
                    <td className="p-3 text-slate-300 max-w-xs truncate">{b.packageName}</td>
                    <td className="p-3 font-mono text-slate-400">{b.clientPhone}</td>
                    <td className="p-3">
                      <span className={cn(
                        "px-2.5 py-1 rounded-full text-[10px] font-bold border",
                        b.visaStatus === 'APPROVED' ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" : "bg-amber-500/20 text-amber-300 border-amber-500/30"
                      )}>
                        {b.visaStatus === 'APPROVED' ? 'تأشيرة صادرة ✓' : 'قيد الإجراء'}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <button className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs shadow-md">
                        طباعة كارت الصعود والتأشيرة
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
