import React, { useState } from 'react';
import { 
  ParkingSquare, 
  Car, 
  Clock, 
  QrCode, 
  Plus, 
  Search, 
  CheckCircle2, 
  AlertCircle, 
  DollarSign, 
  Zap, 
  Accessibility, 
  Layers,
  Receipt
} from 'lucide-react';
import { ParkingSlot, ParkingTicket } from '../../types/industryModules';
import { formatCurrency, cn } from '../../lib/utils';

export const ParkingGaragePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'slots' | 'tickets' | 'entry_exit'>('slots');
  const [selectedFloor, setSelectedFloor] = useState<string>('ALL');
  const [ticketInput, setTicketInput] = useState('');
  const [checkoutResult, setCheckoutResult] = useState<{ ticket?: ParkingTicket; calculatedAmount?: number; durationMinutes?: number } | null>(null);

  // Parking Slots Map
  const [slots, setSlots] = useState<ParkingSlot[]>([
    { id: 's1', slotNumber: 'A-01', floorLevel: 'الطابق الأرضي', slotType: 'شحن سيارات كهربائية (EV)', status: 'OCCUPIED', currentPlateNumber: 'أ ب ج 1928', currentTicketNumber: 'PKG-101', occupiedSince: '04:15 م' },
    { id: 's2', slotNumber: 'A-02', floorLevel: 'الطابق الأرضي', slotType: 'VIP حجز شهري', status: 'OCCUPIED', currentPlateNumber: 'س ص ع 9901', currentTicketNumber: 'PKG-102', occupiedSince: '02:00 م' },
    { id: 's3', slotNumber: 'A-03', floorLevel: 'الطابق الأرضي', slotType: 'ذوي الهمم', status: 'AVAILABLE' },
    { id: 's4', slotNumber: 'A-04', floorLevel: 'الطابق الأرضي', slotType: 'عادي', status: 'AVAILABLE' },
    { id: 's5', slotNumber: 'B-01', floorLevel: 'البدروم -1', slotType: 'عادي', status: 'OCCUPIED', currentPlateNumber: 'د ر و 5521', currentTicketNumber: 'PKG-103', occupiedSince: '05:30 م' },
    { id: 's6', slotNumber: 'B-02', floorLevel: 'البدروم -1', slotType: 'عادي', status: 'AVAILABLE' },
    { id: 's7', slotNumber: 'B-03', floorLevel: 'البدروم -1', slotType: 'عادي', status: 'AVAILABLE' },
    { id: 's8', slotNumber: 'B-04', floorLevel: 'البدروم -1', slotType: 'عادي', status: 'AVAILABLE' },
    { id: 's9', slotNumber: 'C-01', floorLevel: 'البدروم -2', slotType: 'عادي', status: 'AVAILABLE' },
    { id: 's10', slotNumber: 'C-02', floorLevel: 'البدروم -2', slotType: 'عادي', status: 'AVAILABLE' }
  ]);

  // Active Tickets
  const [tickets, setTickets] = useState<ParkingTicket[]>([
    {
      id: 't1',
      ticketNumber: 'PKG-101',
      barcode: '622700101',
      plateNumber: 'أ ب ج 1928',
      carMakeModel: 'مرسيدس EQE كهربائية',
      slotNumber: 'A-01',
      entryTime: '04:15 م',
      tariffType: 'بالساعة',
      hourlyRate: 20,
      totalFee: 60,
      paidAmount: 0,
      paymentMethod: 'كاش',
      status: 'PARKED'
    },
    {
      id: 't2',
      ticketNumber: 'PKG-102',
      barcode: '622700102',
      plateNumber: 'س ص ع 9901',
      carMakeModel: 'بي إم دبليو X6',
      slotNumber: 'A-02',
      entryTime: '02:00 م',
      tariffType: 'خدمة فاليه VIP',
      valetDriverName: 'كابتن محمود فاليه',
      hourlyRate: 35,
      totalFee: 140,
      paidAmount: 0,
      paymentMethod: 'فيزا / بطاقة',
      status: 'PARKED'
    },
    {
      id: 't3',
      ticketNumber: 'PKG-103',
      barcode: '622700103',
      plateNumber: 'د ر و 5521',
      carMakeModel: 'تويوتا كورولا 2024',
      slotNumber: 'B-01',
      entryTime: '05:30 م',
      tariffType: 'بالساعة',
      hourlyRate: 15,
      totalFee: 30,
      paidAmount: 0,
      paymentMethod: 'كاش',
      status: 'PARKED'
    }
  ]);

  const handleCheckoutTicket = (tickCode: string) => {
    const t = tickets.find(x => x.ticketNumber === tickCode || x.barcode === tickCode || x.plateNumber.includes(tickCode));
    if (t) {
      setCheckoutResult({
        ticket: t,
        calculatedAmount: t.totalFee,
        durationMinutes: 125
      });
    }
  };

  const filteredSlots = selectedFloor === 'ALL' ? slots : slots.filter(s => s.floorLevel === selectedFloor);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-[#151b2b] border border-cyan-500/30 rounded-3xl p-6 shadow-2xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500"></div>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
              <ParkingSquare size={14} />
              <span>Smart Parking Garage & Valet Master Module</span>
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-white">
            الجراجات، مواقف السيارات وخدمات الفاليه
          </h1>
          <p className="text-xs md:text-sm text-slate-400">
            مخطط الباكيات والأدوار الفوري، تذاكر الباركود واحتساب زمن الوقوف، شحن السيارات الكهربائية (EV)، واشتراكات المبيت والفاليه.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-[#0f172a] p-3 rounded-2xl border border-slate-800 flex items-center gap-3">
            <Car className="text-cyan-400" size={24} />
            <div>
              <p className="text-[10px] text-slate-400">الباكيات الشاغرة</p>
              <p className="text-xs font-bold text-white">
                {slots.filter(s => s.status === 'AVAILABLE').length} من إجمالي {slots.length} باكية
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('slots')}
          className={cn(
            "px-5 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2",
            activeTab === 'slots' ? "bg-cyan-600 text-white shadow-md shadow-cyan-600/20" : "bg-slate-900 text-slate-400 hover:text-white"
          )}
        >
          <Layers size={16} />
          <span>مخطط الأدوار والباكيات ({slots.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('entry_exit')}
          className={cn(
            "px-5 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2",
            activeTab === 'entry_exit' ? "bg-cyan-600 text-white shadow-md shadow-cyan-600/20" : "bg-slate-900 text-slate-400 hover:text-white"
          )}
        >
          <QrCode size={16} />
          <span>بوابة الخروج والتحصيل السريع</span>
        </button>
        <button
          onClick={() => setActiveTab('tickets')}
          className={cn(
            "px-5 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2",
            activeTab === 'tickets' ? "bg-cyan-600 text-white shadow-md shadow-cyan-600/20" : "bg-slate-900 text-slate-400 hover:text-white"
          )}
        >
          <Receipt size={16} />
          <span>تذاكر السيارات المتواجدة الآن ({tickets.length})</span>
        </button>
      </div>

      {/* TAB 1: PARKING SLOTS MAP */}
      {activeTab === 'slots' && (
        <div className="space-y-4">
          <div className="flex gap-2 pb-2">
            {['ALL', 'الطابق الأرضي', 'البدروم -1', 'البدروم -2'].map((flr) => (
              <button
                key={flr}
                onClick={() => setSelectedFloor(flr)}
                className={cn(
                  "px-4 py-2 rounded-xl text-xs font-bold transition-all",
                  selectedFloor === flr ? "bg-slate-800 text-cyan-400 border border-cyan-500/30" : "bg-slate-900 text-slate-400 hover:text-white"
                )}
              >
                {flr === 'ALL' ? 'جميع الأدوار' : flr}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            {filteredSlots.map((slot) => (
              <div
                key={slot.id}
                className={cn(
                  "p-4 rounded-2xl border transition-all flex flex-col justify-between min-h-[140px]",
                  slot.status === 'OCCUPIED' ? "bg-rose-950/20 border-rose-500/40 text-rose-200" :
                  slot.status === 'AVAILABLE' ? "bg-emerald-950/20 border-emerald-500/40 text-emerald-200" : "bg-amber-950/20 border-amber-500/40 text-amber-200"
                )}
              >
                <div className="flex justify-between items-start">
                  <span className="font-mono text-base font-black">{slot.slotNumber}</span>
                  {slot.slotType === 'شحن سيارات كهربائية (EV)' && <Zap size={16} className="text-emerald-400" />}
                  {slot.slotType === 'ذوي الهمم' && <Accessibility size={16} className="text-cyan-400" />}
                </div>

                {slot.status === 'OCCUPIED' ? (
                  <div className="space-y-1 my-2">
                    <span className="text-[11px] font-black block text-white bg-slate-900/80 px-2 py-0.5 rounded text-center border border-slate-700">
                      {slot.currentPlateNumber}
                    </span>
                    <span className="text-[10px] text-slate-400 block text-center">
                      منذ {slot.occupiedSince}
                    </span>
                  </div>
                ) : (
                  <div className="text-center py-2">
                    <span className="text-xs font-bold text-emerald-400 bg-emerald-500/20 px-2.5 py-1 rounded-full border border-emerald-500/30">
                      شاغرة متاحة
                    </span>
                  </div>
                )}

                <div className="text-[10px] text-slate-400 text-center border-t border-slate-800/60 pt-1">
                  {slot.floorLevel}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: CHECKOUT PORTAL */}
      {activeTab === 'entry_exit' && (
        <div className="bg-[#151b2b] p-6 rounded-3xl border border-slate-800 space-y-6 max-w-2xl mx-auto shadow-2xl">
          <div className="text-center space-y-2">
            <QrCode className="mx-auto text-cyan-400" size={48} />
            <h3 className="text-xl font-black text-white">بوابة خروج الجيج واحتساب التكلفة الآلي</h3>
            <p className="text-xs text-slate-400">امسح باركود التذكرة أو أدخل رقم اللوحة لحساب القيمة بالدقيقة وفتح البوابة</p>
          </div>

          <div className="flex gap-3">
            <input
              type="text"
              value={ticketInput}
              onChange={(e) => setTicketInput(e.target.value)}
              placeholder="امسح الباركود أو اكتب رقم التذكرة (مثال: PKG-101 أو 622700101)"
              className="flex-1 bg-[#0f172a] border border-slate-700 rounded-xl px-4 py-3 text-sm text-white font-mono placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
            />
            <button
              onClick={() => handleCheckoutTicket(ticketInput)}
              className="px-6 py-3 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl font-bold text-xs shadow-lg"
            >
              حساب الخروج
            </button>
          </div>

          {checkoutResult && checkoutResult.ticket && (
            <div className="bg-[#0f172a] p-5 rounded-2xl border border-slate-800 space-y-4">
              <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                <div>
                  <span className="font-mono text-cyan-400 text-xs font-bold">{checkoutResult.ticket.ticketNumber}</span>
                  <h4 className="text-base font-black text-white">{checkoutResult.ticket.plateNumber}</h4>
                  <p className="text-xs text-slate-400">{checkoutResult.ticket.carMakeModel}</p>
                </div>
                <div className="text-left">
                  <p className="text-xs text-slate-400">زمن الانتظار</p>
                  <p className="text-sm font-bold text-amber-400">{checkoutResult.durationMinutes} دقيقة (~ ساعتين)</p>
                </div>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>وقت الدخول:</span>
                  <span className="text-slate-200">{checkoutResult.ticket.entryTime}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>الباكية المحجوزة:</span>
                  <span className="text-white font-bold">{checkoutResult.ticket.slotNumber}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>نوع التعريفة:</span>
                  <span className="text-white font-bold">{checkoutResult.ticket.tariffType}</span>
                </div>
                <div className="flex justify-between border-t border-slate-800 pt-3">
                  <span className="text-base font-black text-white">المبلغ المطلوب سداده:</span>
                  <span className="text-xl font-black text-emerald-400">{formatCurrency(checkoutResult.calculatedAmount || 0)}</span>
                </div>
              </div>

              <button className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg">
                <CheckCircle2 size={16} />
                <span>تحصيل المبلغ وفتح بوابة الخروج الآن</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: TICKETS */}
      {activeTab === 'tickets' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {tickets.map((t) => (
              <div key={t.id} className="bg-[#151b2b] border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-slate-900 text-cyan-400 border border-slate-700">
                      {t.ticketNumber}
                    </span>
                    <h3 className="text-base font-black text-white mt-1">{t.plateNumber}</h3>
                    <p className="text-xs text-slate-400">{t.carMakeModel}</p>
                  </div>
                  <span className="text-xs font-bold text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
                    باكية {t.slotNumber}
                  </span>
                </div>

                <div className="bg-[#0f172a] p-3 rounded-xl border border-slate-800 space-y-2 text-xs">
                  <div className="flex justify-between text-slate-400">
                    <span>وقت الدخول:</span>
                    <span className="text-slate-200">{t.entryTime}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>التعريفة:</span>
                    <span className="font-bold text-white">{t.tariffType} ({formatCurrency(t.hourlyRate)} / س)</span>
                  </div>
                  {t.valetDriverName && (
                    <div className="flex justify-between text-slate-400">
                      <span>سائق الفاليه:</span>
                      <span className="text-cyan-300 font-bold">{t.valetDriverName}</span>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => {
                    setActiveTab('entry_exit');
                    handleCheckoutTicket(t.ticketNumber);
                  }}
                  className="w-full py-2.5 bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/30 rounded-xl font-bold text-xs flex items-center justify-center gap-2"
                >
                  <DollarSign size={14} /> سداد وخروج
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
