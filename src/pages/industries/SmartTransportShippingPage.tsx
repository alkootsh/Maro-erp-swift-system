/**
 * @file SmartTransportShippingPage.tsx
 * @module واجهات وصفحات النظام (UI Pages)
 * @description ملف جزء من نظام MARO ERP. الوظيفة: SmartTransportShippingPage.tsx.
 */
import React, { useState } from 'react';
import { 
  Truck, Navigation, MapPin, Package, Users, DollarSign, 
  Clock, CheckCircle2, AlertTriangle, Plus, Search, Shield, Filter, 
  Phone, Calculator, Send, ArrowRight
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { toast } from 'react-hot-toast';

interface Shipment {
  id: string;
  awb: string;
  senderName: string;
  recipientName: string;
  destinationCity: string;
  weightKg: number;
  codAmount: number; // Cash on Delivery
  shippingFee: number;
  status: 'PENDING_PICKUP' | 'IN_TRANSIT' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'RETURNED';
  driverName: string;
  createdAt: string;
}

interface FleetVehicle {
  id: string;
  plateNumber: string;
  vehicleType: string;
  driverName: string;
  status: 'AVAILABLE' | 'ON_MISSION' | 'MAINTENANCE';
  currentLocation: string;
  fuelLevel: number; // percentage
}

export const SmartTransportShippingPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'shipments' | 'fleet' | 'calculator' | 'analytics'>('shipments');
  
  const [shipments, setShipments] = useState<Shipment[]>([
    {
      id: 'shp_1',
      awb: 'AWB-882910',
      senderName: 'متجر الإلكترونيات الحديثة',
      recipientName: 'محمود حسن (القاهرة)',
      destinationCity: 'القاهرة - المعادي',
      weightKg: 2.5,
      codAmount: 1850,
      shippingFee: 65,
      status: 'OUT_FOR_DELIVERY',
      driverName: 'كابتن سعيد مهران',
      createdAt: '2026-08-14 09:30'
    },
    {
      id: 'shp_2',
      awb: 'AWB-882911',
      senderName: 'أزياء النخبة',
      recipientName: 'هبة الدسوقي (الإسكندرية)',
      destinationCity: 'الإسكندرية - سموحة',
      weightKg: 1.2,
      codAmount: 640,
      shippingFee: 85,
      status: 'IN_TRANSIT',
      driverName: 'كابتن إبراهيم صبري',
      createdAt: '2026-08-14 10:15'
    },
    {
      id: 'shp_3',
      awb: 'AWB-882912',
      senderName: 'شركة الأدوية الكبرى',
      recipientName: 'صيدلية النور (الجيزة)',
      destinationCity: 'الجيزة - الدقي',
      weightKg: 5.0,
      codAmount: 0,
      shippingFee: 50,
      status: 'DELIVERED',
      driverName: 'كابتن وليد عبد الرازق',
      createdAt: '2026-08-14 08:00'
    }
  ]);

  const [vehicles, setVehicles] = useState<FleetVehicle[]>([
    { id: 'v_1', plateNumber: 'أ ب ج - 1234', vehicleType: 'دراجة نارية (Scooter)', driverName: 'سعيد مهران', status: 'ON_MISSION', currentLocation: 'المعادي - شارع 9', fuelLevel: 75 },
    { id: 'v_2', plateNumber: 'س ط ع - 5678', vehicleType: 'سيارة فان مغلقة (Van)', driverName: 'إبراهيم صبري', status: 'ON_MISSION', currentLocation: 'طريق مصر الإسكندرية الصحراوي', fuelLevel: 40 },
    { id: 'v_3', plateNumber: 'م ن ر - 9876', vehicleType: 'نقل خفيف (Mini Truck)', driverName: 'وليد عبد الرازق', status: 'AVAILABLE', currentLocation: 'المستودع الرئيسي - الجيزة', fuelLevel: 90 }
  ]);

  // Calculator State
  const [calcWeight, setCalcWeight] = useState(2);
  const [calcDistance, setCalcDistance] = useState(15);
  const [calcIsExpress, setCalcIsExpress] = useState(false);

  const calculateFee = () => {
    let base = 40;
    base += calcWeight * 10;
    base += calcDistance * 2;
    if (calcIsExpress) base *= 1.5;
    return Math.round(base);
  };

  const [newAwb, setNewAwb] = useState('AWB-' + Math.floor(100000 + Math.random() * 900000));
  const [newSender, setNewSender] = useState('');
  const [newRecipient, setNewRecipient] = useState('');
  const [newCity, setNewCity] = useState('');
  const [newWeight, setNewWeight] = useState('1');
  const [newCod, setNewCod] = useState('0');

  const handleCreateShipment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSender || !newRecipient || !newCity) {
      toast.error('يرجى إدخال بيانات المرسل والمستلم والمدينة');
      return;
    }

    const fee = calculateFee();
    const item: Shipment = {
      id: 'shp_' + Date.now(),
      awb: newAwb,
      senderName: newSender,
      recipientName: newRecipient,
      destinationCity: newCity,
      weightKg: parseFloat(newWeight) || 1,
      codAmount: parseFloat(newCod) || 0,
      shippingFee: fee,
      status: 'PENDING_PICKUP',
      driverName: 'غير مخصص (بانتظار التوزيع)',
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16)
    };

    setShipments([item, ...shipments]);
    toast.success(`تم إنشاء بوليصة الشحن ${newAwb} بنجاح برسم شحن ${fee} ج.م`);
    setNewAwb('AWB-' + Math.floor(100000 + Math.random() * 900000));
    setNewSender('');
    setNewRecipient('');
    setNewCity('');
    setActiveTab('shipments');
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="bg-[#151b2b] p-8 rounded-3xl border border-[#1e293b] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider mb-1">
            <Truck size={16} />
            <span>موديول النقل الذكي وشركات الشحن (Smart Logistics & Courier Fleet v4.0)</span>
          </div>
          <h1 className="text-2xl font-black text-white">إدارة بوليصات الشحن، تتبع الأسطول الحي (GPS)، وتحصيل الدفع عند الاستلام (COD)</h1>
          <p className="text-slate-400 text-xs mt-1">
            إدارة كاملة لعمليات الميل الأخير (Last-Mile Delivery)، توزيع الطرود على السائقين، حساب أسعار الشحن بالوزن والمسافة، والتسوية المالية الآلية.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveTab('calculator')}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-2xl font-bold text-xs shadow-lg shadow-indigo-900/30 transition-all hover:scale-105"
          >
            <Plus size={18} />
            <span>إنشاء بوليصة شحن جديدة</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-[#1e293b] pb-3 overflow-x-auto">
        <button
          onClick={() => setActiveTab('shipments')}
          className={cn(
            "px-5 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap",
            activeTab === 'shipments' ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30" : "bg-[#151b2b] text-slate-400 hover:text-white border border-[#1e293b]"
          )}
        >
          <Package size={16} />
          <span>بوليصات وشحنات التوصيل ({shipments.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('fleet')}
          className={cn(
            "px-5 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap",
            activeTab === 'fleet' ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30" : "bg-[#151b2b] text-slate-400 hover:text-white border border-[#1e293b]"
          )}
        >
          <Navigation size={16} />
          <span>تتبع الأسطول الحي والمركبات ({vehicles.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('calculator')}
          className={cn(
            "px-5 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap",
            activeTab === 'calculator' ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30" : "bg-[#151b2b] text-slate-400 hover:text-white border border-[#1e293b]"
          )}
        >
          <Calculator size={16} />
          <span>حاسبة أسعار الشحن الفورية ونقاط التوصيل</span>
        </button>
        <button
          onClick={() => setActiveTab('analytics')}
          className={cn(
            "px-5 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap",
            activeTab === 'analytics' ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30" : "bg-[#151b2b] text-slate-400 hover:text-white border border-[#1e293b]"
          )}
        >
          <DollarSign size={16} />
          <span>تقارير التحصيل والـ COD والأرباح</span>
        </button>
      </div>

      {/* Tab 1: Shipments */}
      {activeTab === 'shipments' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-[#151b2b] p-5 rounded-2xl border border-[#1e293b]">
              <div className="text-xs font-bold text-slate-500 uppercase">إجمالي الشحنات</div>
              <div className="text-2xl font-black text-white mt-1">{shipments.length} شحنة</div>
            </div>
            <div className="bg-[#151b2b] p-5 rounded-2xl border border-[#1e293b]">
              <div className="text-xs font-bold text-slate-500 uppercase">شحنات جاري توصيلها</div>
              <div className="text-2xl font-black text-amber-400 mt-1">
                {shipments.filter(s => s.status === 'OUT_FOR_DELIVERY' || s.status === 'IN_TRANSIT').length} شحنة
              </div>
            </div>
            <div className="bg-[#151b2b] p-5 rounded-2xl border border-[#1e293b]">
              <div className="text-xs font-bold text-slate-500 uppercase">تم التوصيل بنجاح</div>
              <div className="text-2xl font-black text-emerald-400 mt-1">
                {shipments.filter(s => s.status === 'DELIVERED').length} شحنة
              </div>
            </div>
            <div className="bg-[#151b2b] p-5 rounded-2xl border border-[#1e293b]">
              <div className="text-xs font-bold text-slate-500 uppercase">إجمالي التحصيل (COD)</div>
              <div className="text-2xl font-black text-indigo-400 mt-1">
                {shipments.reduce((acc, s) => acc + s.codAmount, 0).toLocaleString()} ج.م
              </div>
            </div>
          </div>

          <div className="bg-[#151b2b] rounded-3xl border border-[#1e293b] overflow-hidden shadow-xl">
            <div className="p-6 border-b border-[#1e293b] flex items-center justify-between">
              <h3 className="text-base font-bold text-white">سجل بوليصات الشحن والطرود (AWB Tracking)</h3>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">تحديث تلقائي عبر GPS والسائقين</span>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="bg-[#0f172a] text-slate-400 border-b border-[#1e293b]">
                    <th className="p-4">رقم البوليصة (AWB)</th>
                    <th className="p-4">المرسل والمستلم</th>
                    <th className="p-4">المدينة والوجهة</th>
                    <th className="p-4">الوزن وسعر الشحن</th>
                    <th className="p-4">مبلغ التحصيل (COD)</th>
                    <th className="p-4">السائق المسؤول</th>
                    <th className="p-4">حالة الشحنة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1e293b] text-slate-300">
                  {shipments.map(s => (
                    <tr key={s.id} className="hover:bg-[#1e293b]/30">
                      <td className="p-4 font-mono font-bold text-indigo-400">{s.awb}</td>
                      <td className="p-4">
                        <strong className="text-white block">{s.recipientName}</strong>
                        <span className="text-slate-500 text-[10px]">من: {s.senderName}</span>
                      </td>
                      <td className="p-4 font-medium text-white">{s.destinationCity}</td>
                      <td className="p-4">
                        <div>{s.weightKg} كجم</div>
                        <div className="text-emerald-400 text-[10px] font-bold">{s.shippingFee} ج.م شحن</div>
                      </td>
                      <td className="p-4 font-bold text-amber-400">
                        {s.codAmount > 0 ? `${s.codAmount.toLocaleString()} ج.م` : 'مدفوع مسبقاً'}
                      </td>
                      <td className="p-4 text-slate-300">{s.driverName}</td>
                      <td className="p-4">
                        <span className={cn(
                          "px-2.5 py-1 rounded-full text-[10px] font-bold inline-block",
                          s.status === 'DELIVERED' ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                          s.status === 'OUT_FOR_DELIVERY' ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" :
                          s.status === 'IN_TRANSIT' ? "bg-blue-500/10 text-blue-400 border border-blue-500/20" :
                          "bg-purple-500/10 text-purple-400 border border-purple-500/20"
                        )}>
                          {s.status === 'DELIVERED' ? '✅ تم التوصيل' :
                           s.status === 'OUT_FOR_DELIVERY' ? '🛵 خرج للتوصيل' :
                           s.status === 'IN_TRANSIT' ? '🚚 في الطريق بين المحافظات' : '⏳ بانتظار الاستلام'}
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

      {/* Tab 2: Fleet */}
      {activeTab === 'fleet' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {vehicles.map(v => (
              <div key={v.id} className="bg-[#151b2b] p-6 rounded-3xl border border-[#1e293b] space-y-4 shadow-xl">
                <div className="flex items-center justify-between">
                  <div className="p-3 bg-indigo-600/20 text-indigo-400 rounded-2xl">
                    <Truck size={24} />
                  </div>
                  <span className={cn(
                    "px-3 py-1 rounded-full text-[10px] font-bold",
                    v.status === 'AVAILABLE' ? "bg-emerald-500/10 text-emerald-400" : "bg-blue-500/10 text-blue-400"
                  )}>
                    {v.status === 'AVAILABLE' ? 'متاح بالمستودع' : 'في مهمة توصيل'}
                  </span>
                </div>
                <div>
                  <h3 className="text-base font-bold text-white font-mono">{v.plateNumber}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">{v.vehicleType}</p>
                </div>
                <div className="p-3 bg-[#0f172a] rounded-2xl border border-[#1e293b] space-y-2 text-xs">
                  <div className="flex items-center justify-between text-slate-400">
                    <span>السائق:</span>
                    <strong className="text-white">{v.driverName}</strong>
                  </div>
                  <div className="flex items-center justify-between text-slate-400">
                    <span>الموقع الحي (GPS):</span>
                    <strong className="text-indigo-400">{v.currentLocation}</strong>
                  </div>
                  <div className="flex items-center justify-between text-slate-400">
                    <span>مستوى الوقود:</span>
                    <strong className="text-emerald-400">{v.fuelLevel}%</strong>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Calculator & New Shipment */}
      {activeTab === 'calculator' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-[#151b2b] p-8 rounded-3xl border border-[#1e293b] space-y-6 shadow-2xl">
            <div>
              <h2 className="text-xl font-bold text-white">حاسبة أسعار الشحن والتوصيل الفورية</h2>
              <p className="text-xs text-slate-400 mt-1">حساب تكلفة الشحنة تلقائياً بناءً على الوزن والمسافة ونوع الخدمة.</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">الوزن التقديري (كيلوجرام)</label>
                <input
                  type="number"
                  min="0.5"
                  step="0.5"
                  value={calcWeight}
                  onChange={(e) => setCalcWeight(parseFloat(e.target.value) || 1)}
                  className="w-full p-3 bg-[#0f172a] border border-[#1e293b] rounded-xl text-white text-xs font-bold focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">مسافة التوصيل التقريبية (كم)</label>
                <input
                  type="number"
                  value={calcDistance}
                  onChange={(e) => setCalcDistance(parseInt(e.target.value) || 5)}
                  className="w-full p-3 bg-[#0f172a] border border-[#1e293b] rounded-xl text-white text-xs font-bold focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <input
                  type="checkbox"
                  id="express"
                  checked={calcIsExpress}
                  onChange={(e) => setCalcIsExpress(e.target.checked)}
                  className="w-4 h-4 rounded bg-[#0f172a] border-[#1e293b] text-indigo-600 focus:ring-0"
                />
                <label htmlFor="express" className="text-xs font-bold text-slate-300">توصيل سريع فوري خلال ساعتين (Express Delivery)</label>
              </div>

              <div className="p-6 bg-[#0f172a] rounded-2xl border border-indigo-500/30 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-400 uppercase">تكلفة الشحنة المقدرة</div>
                  <div className="text-3xl font-black text-emerald-400 mt-1">{calculateFee()} ج.م</div>
                </div>
                <div className="text-right text-xs text-slate-500">
                  شاملة ضريبة القيمة المضافة ومصاريف التأمين على الشحنة
                </div>
              </div>
            </div>
          </div>

          <div className="bg-[#151b2b] p-8 rounded-3xl border border-[#1e293b] space-y-6 shadow-2xl">
            <div>
              <h2 className="text-xl font-bold text-white">إصدار بوليصة شحن وتوصيل جديدة (Create AWB)</h2>
              <p className="text-xs text-slate-400 mt-1">أدخل بيانات المرسل والمستلم لإنشاء البوليصة فوريًا.</p>
            </div>

            <form onSubmit={handleCreateShipment} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">رقم البوليصة (AWB)</label>
                <input
                  type="text"
                  readOnly
                  value={newAwb}
                  className="w-full p-3 bg-[#0f172a] border border-[#1e293b] rounded-xl text-indigo-400 font-mono text-xs font-bold"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">اسم المرسل / المتجر *</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: متجر الإلكترونيات"
                    value={newSender}
                    onChange={(e) => setNewSender(e.target.value)}
                    className="w-full p-3 bg-[#0f172a] border border-[#1e293b] rounded-xl text-white text-xs focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">اسم المستلم ورقم الهاتف *</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: أحمد محمود - 0100..."
                    value={newRecipient}
                    onChange={(e) => setNewRecipient(e.target.value)}
                    className="w-full p-3 bg-[#0f172a] border border-[#1e293b] rounded-xl text-white text-xs focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">المدينة والمنطقة *</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: الإسكندرية - سموحة"
                    value={newCity}
                    onChange={(e) => setNewCity(e.target.value)}
                    className="w-full p-3 bg-[#0f172a] border border-[#1e293b] rounded-xl text-white text-xs focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">الوزن (كجم)</label>
                  <input
                    type="number"
                    value={newWeight}
                    onChange={(e) => setNewWeight(e.target.value)}
                    className="w-full p-3 bg-[#0f172a] border border-[#1e293b] rounded-xl text-white text-xs focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">مبلغ التحصيل (COD)</label>
                  <input
                    type="number"
                    value={newCod}
                    onChange={(e) => setNewCod(e.target.value)}
                    className="w-full p-3 bg-[#0f172a] border border-[#1e293b] rounded-xl text-white text-xs focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-900/30 transition-all hover:scale-[1.01]"
              >
                إصدار وحفظ بوليصة الشحن (AWB)
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Tab 4: Analytics */}
      {activeTab === 'analytics' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-[#151b2b] p-6 rounded-3xl border border-[#1e293b] space-y-4">
            <div className="text-xs font-bold text-slate-500 uppercase">إيرادات الشحن والتوصيل</div>
            <div className="text-3xl font-black text-emerald-400">14,250 ج.م</div>
            <p className="text-xs text-slate-400">إجمالي رسوم الشحن المحصلة من المتاجر والمرسلين خلال هذا الأسبوع.</p>
          </div>

          <div className="bg-[#151b2b] p-6 rounded-3xl border border-[#1e293b] space-y-4">
            <div className="text-xs font-bold text-slate-500 uppercase">مبالغ التحصيل لدى السائقين (COD)</div>
            <div className="text-3xl font-black text-amber-400">48,900 ج.م</div>
            <p className="text-xs text-slate-400">النقدية المححصلة من العملاء بانتظار توريدها لخزينة الشركة.</p>
          </div>

          <div className="bg-[#151b2b] p-6 rounded-3xl border border-[#1e293b] space-y-4">
            <div className="text-xs font-bold text-slate-500 uppercase">كفاءة التوصيل في الموعد (OTD)</div>
            <div className="text-3xl font-black text-indigo-400">96.8%</div>
            <p className="text-xs text-slate-400">نسبة الشحنات التي تم توصيلها في المواعيد المحددة بدون تأخير.</p>
          </div>
        </div>
      )}
    </div>
  );
};
