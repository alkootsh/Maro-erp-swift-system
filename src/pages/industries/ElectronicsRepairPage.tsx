/**
 * @file ElectronicsRepairPage.tsx
 * @module واجهات وصفحات النظام (UI Pages)
 * @description ملف جزء من نظام MARO ERP. الوظيفة: ElectronicsRepairPage.tsx.
 */
// MARO ERP - Electronics, Mobile & Maintenance Workshop Module
import React, { useState } from 'react';
import { 
  Smartphone, 
  Wrench, 
  Plus, 
  Search, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  ShieldCheck, 
  FileText, 
  DollarSign, 
  Cpu, 
  Printer, 
  User,
  Phone
} from 'lucide-react';
import { IndustryModuleEngine } from '../../lib/industryModuleEngine';
import { MaintenanceTicket } from '../../types/industryModules';
import { cn } from '../../lib/utils';

export const ElectronicsRepairPage: React.FC = () => {
  const [tickets, setTickets] = useState<MaintenanceTicket[]>(IndustryModuleEngine.getMaintenanceTickets());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [showAddModal, setShowAddModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'tickets' | 'warranty' | 'reports'>('tickets');
  const [imeiLookup, setImeiLookup] = useState('');
  const [lookupResult, setLookupResult] = useState<MaintenanceTicket | null>(null);

  // New ticket state
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [deviceType, setDeviceType] = useState<MaintenanceTicket['deviceType']>('هاتف ذكي');
  const [deviceBrand, setDeviceBrand] = useState('');
  const [deviceModel, setDeviceModel] = useState('');
  const [serialOrIMEI, setSerialOrIMEI] = useState('');
  const [reportedProblem, setReportedProblem] = useState('');
  const [costEstimate, setCostEstimate] = useState(350);
  const [technicianName, setTechnicianName] = useState('م. حسام الدين');

  const handleCreateTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !customerPhone || !deviceModel || !reportedProblem) {
      alert('يرجى ملء البيانات الإلزامية لبطاقة الصيانة');
      return;
    }

    const newTicket: MaintenanceTicket = {
      id: `mnt_${Date.now()}`,
      ticketNumber: `TKT-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      customerName,
      customerPhone,
      deviceType,
      deviceBrand: deviceBrand || 'Generic',
      deviceModel,
      serialNumberOrIMEI: serialOrIMEI || 'N/A',
      reportedProblem,
      costEstimate,
      finalCost: costEstimate,
      technicianName,
      status: 'RECEIVED',
      warrantyMonths: 3,
      receivedDate: new Date().toISOString(),
      promisedDate: new Date(Date.now() + 48 * 3600 * 1000).toISOString(),
      sparePartsUsed: []
    };

    IndustryModuleEngine.saveMaintenanceTicket(newTicket);
    setTickets(IndustryModuleEngine.getMaintenanceTickets());
    setShowAddModal(false);
    // Reset
    setCustomerName('');
    setCustomerPhone('');
    setDeviceModel('');
    setReportedProblem('');
  };

  const handleUpdateStatus = (ticket: MaintenanceTicket, newStatus: MaintenanceTicket['status']) => {
    const updated = { ...ticket, status: newStatus };
    if (newStatus === 'DELIVERED') {
      updated.completedDate = new Date().toISOString();
    }
    IndustryModuleEngine.saveMaintenanceTicket(updated);
    setTickets(IndustryModuleEngine.getMaintenanceTickets());
  };

  const handleIMEILookup = () => {
    const found = tickets.find(t => 
      t.serialNumberOrIMEI.toLowerCase().includes(imeiLookup.toLowerCase()) || 
      t.ticketNumber.toLowerCase().includes(imeiLookup.toLowerCase()) ||
      t.customerPhone.includes(imeiLookup)
    );
    setLookupResult(found || null);
  };

  const filteredTickets = tickets.filter(t => {
    const matchesQuery = t.customerName.includes(searchQuery) || t.ticketNumber.includes(searchQuery) || t.deviceModel.includes(searchQuery) || t.serialNumberOrIMEI.includes(searchQuery);
    const matchesStatus = selectedStatus === 'ALL' || t.status === selectedStatus;
    return matchesQuery && matchesStatus;
  });

  const getStatusBadge = (status: MaintenanceTicket['status']) => {
    switch (status) {
      case 'RECEIVED': return <span className="px-2.5 py-1 rounded-lg bg-blue-500/20 text-blue-400 border border-blue-500/30 text-[10px] font-bold">تم الاستلام</span>;
      case 'INSPECTION': return <span className="px-2.5 py-1 rounded-lg bg-purple-500/20 text-purple-400 border border-purple-500/30 text-[10px] font-bold">قيد الفحص الفني</span>;
      case 'WAITING_PARTS': return <span className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] font-bold">انتظار قطع الغيار</span>;
      case 'IN_PROGRESS': return <span className="px-2.5 py-1 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 text-[10px] font-bold">جاري الإصلاح</span>;
      case 'REPAIRED': return <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">تم الإصلاح (جاهز)</span>;
      case 'DELIVERED': return <span className="px-2.5 py-1 rounded-lg bg-slate-700 text-slate-300 border border-slate-600 text-[10px] font-bold">تم التسليم للعميل</span>;
      case 'CANCELLED': return <span className="px-2.5 py-1 rounded-lg bg-red-500/20 text-red-400 border border-red-500/30 text-[10px] font-bold">ملغي / تعذر الإصلاح</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-[#151b2b] border border-cyan-500/30 rounded-3xl p-6 shadow-2xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-600"></div>
        <div className="flex items-center gap-4">
          <div className="p-3.5 bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 rounded-2xl shadow-lg shadow-cyan-500/10">
            <Wrench size={30} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-white tracking-tight">مركز صيانة الأجهزة الإلكترونية والمحمول</h1>
              <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[10px] font-bold">
                Electronics & Repair Job Cards
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">تتبع كروت الصيانة، السيريال والـ IMEI، فحص الضمانات، وقطع الغيار مع القيود المحاسبية التلقائية</p>
          </div>
        </div>

        <button 
          onClick={() => setShowAddModal(true)}
          className="px-5 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-2xl font-bold text-xs flex items-center gap-2 shadow-lg shadow-cyan-600/20 transition-all active:scale-95 whitespace-nowrap"
        >
          <Plus size={18} />
          <span>إصدار بطاقة صيانة جهاز جديدة (Job Card)</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-[#1e293b] pb-3">
        <button 
          onClick={() => setActiveTab('tickets')}
          className={cn(
            "flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold transition-all",
            activeTab === 'tickets' ? "bg-cyan-600/20 text-cyan-300 border border-cyan-500/40 shadow-md" : "text-slate-400 hover:text-white"
          )}
        >
          <FileText size={16} />
          <span>كروت الصيانة في الورشة ({tickets.length})</span>
        </button>

        <button 
          onClick={() => setActiveTab('warranty')}
          className={cn(
            "flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold transition-all",
            activeTab === 'warranty' ? "bg-cyan-600/20 text-cyan-300 border border-cyan-500/40 shadow-md" : "text-slate-400 hover:text-white"
          )}
        >
          <ShieldCheck size={16} />
          <span>فحص السيريال والضمان السريع</span>
        </button>
      </div>

      {/* Tab: Tickets View */}
      {activeTab === 'tickets' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
            <div className="relative w-full md:w-80">
              <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
              <input 
                type="text" 
                placeholder="بحث برقم الكارت، العميل، السيريال، أو الجهاز..." 
                className="w-full pr-10 pl-4 py-2.5 bg-[#151b2b] border border-[#1e293b] rounded-2xl text-xs text-white focus:border-cyan-500 outline-none"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
              <span className="text-[11px] text-slate-400 font-bold whitespace-nowrap">الحالة:</span>
              {['ALL', 'RECEIVED', 'IN_PROGRESS', 'REPAIRED', 'DELIVERED'].map(st => (
                <button 
                  key={st}
                  onClick={() => setSelectedStatus(st)}
                  className={cn(
                    "px-3 py-1.5 rounded-xl text-[11px] font-bold border transition-all whitespace-nowrap",
                    selectedStatus === st ? "bg-cyan-500/20 border-cyan-500/50 text-cyan-300" : "bg-[#151b2b] border-[#1e293b] text-slate-400 hover:text-white"
                  )}
                >
                  {st === 'ALL' ? 'الكل' : st === 'RECEIVED' ? 'مستلم' : st === 'IN_PROGRESS' ? 'قيد الإصلاح' : st === 'REPAIRED' ? 'تم الإصلاح' : 'تم التسليم'}
                </button>
              ))}
            </div>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredTickets.map(t => (
              <div key={t.id} className="bg-[#151b2b] border border-[#1e293b] hover:border-cyan-500/40 rounded-3xl p-6 space-y-4 shadow-xl transition-all">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-cyan-400 bg-cyan-500/10 px-2.5 py-1 rounded-lg border border-cyan-500/20">
                        {t.ticketNumber}
                      </span>
                      {getStatusBadge(t.status)}
                    </div>
                    <h3 className="text-base font-bold text-white mt-2">{t.deviceBrand} {t.deviceModel}</h3>
                    <p className="text-xs font-mono text-slate-400">IMEI/SN: <span className="text-slate-200">{t.serialNumberOrIMEI}</span></p>
                  </div>

                  <div className="text-left">
                    <p className="text-[10px] text-slate-500 uppercase font-bold">التكلفة التقديرية</p>
                    <p className="text-base font-black text-emerald-400">{t.finalCost || t.costEstimate} ج.م</p>
                  </div>
                </div>

                <div className="p-3 bg-[#0f172a] rounded-xl border border-[#1e293b] space-y-1.5 text-xs">
                  <p className="text-slate-400 font-bold">العطل المسجل:</p>
                  <p className="text-amber-300 font-medium">{t.reportedProblem}</p>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                  <div className="flex items-center gap-2 text-slate-400">
                    <User size={14} className="text-slate-500" />
                    <span>العميل: <strong className="text-white">{t.customerName}</strong></span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-400">
                    <Phone size={14} className="text-slate-500" />
                    <span className="font-mono text-slate-300">{t.customerPhone}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-400">
                    <Wrench size={14} className="text-slate-500" />
                    <span>الفني: <strong className="text-slate-300">{t.technicianName}</strong></span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-400">
                    <Clock size={14} className="text-slate-500" />
                    <span>الضمان: <strong className="text-emerald-400">{t.warrantyMonths} شهور</strong></span>
                  </div>
                </div>

                {/* Status Action Workflow */}
                <div className="pt-3 border-t border-[#1e293b] flex items-center justify-between gap-2">
                  <span className="text-[11px] text-slate-500 font-bold">تحديث الحالة:</span>
                  <div className="flex gap-1.5">
                    {t.status !== 'IN_PROGRESS' && t.status !== 'DELIVERED' && (
                      <button 
                        onClick={() => handleUpdateStatus(t, 'IN_PROGRESS')}
                        className="px-2.5 py-1 bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 rounded-lg text-[10px] font-bold hover:bg-cyan-500/30"
                      >
                        بدء الإصلاح
                      </button>
                    )}
                    {t.status !== 'REPAIRED' && t.status !== 'DELIVERED' && (
                      <button 
                        onClick={() => handleUpdateStatus(t, 'REPAIRED')}
                        className="px-2.5 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-lg text-[10px] font-bold hover:bg-emerald-500/30"
                      >
                        جاهز للتسليم
                      </button>
                    )}
                    {t.status === 'REPAIRED' && (
                      <button 
                        onClick={() => handleUpdateStatus(t, 'DELIVERED')}
                        className="px-3 py-1 bg-gradient-to-r from-emerald-600 to-cyan-600 text-white rounded-lg text-[10px] font-bold shadow-md"
                      >
                        تسليم وتحصيل القيمة
                      </button>
                    )}
                    <button 
                      onClick={() => alert(`جاري طباعة إيصال استلام الصيانة للكارت ${t.ticketNumber}...`)}
                      className="p-1.5 bg-[#0f172a] text-slate-400 hover:text-white rounded-lg border border-[#1e293b]"
                      title="طباعة إيصال الصيانة"
                    >
                      <Printer size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab: Warranty Lookup */}
      {activeTab === 'warranty' && (
        <div className="bg-[#151b2b] border border-[#1e293b] rounded-3xl p-8 max-w-2xl mx-auto space-y-6 shadow-2xl text-center">
          <div className="w-16 h-16 bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 rounded-2xl flex items-center justify-center mx-auto">
            <ShieldCheck size={32} />
          </div>

          <div>
            <h3 className="text-lg font-bold text-white">فحص سريان الضمان وتاريخ الجهاز الفوري</h3>
            <p className="text-xs text-slate-400 mt-1">ابحث برقم السيريال (Serial No)، كود الـ IMEI، أو هاتف العميل</p>
          </div>

          <div className="flex gap-2">
            <input 
              type="text" 
              placeholder="أدخل رقم السيريال أو IMEI..." 
              className="flex-1 p-3.5 bg-[#0f172a] border border-[#1e293b] rounded-2xl text-white font-mono text-sm focus:border-cyan-500 outline-none text-center"
              value={imeiLookup}
              onChange={(e) => setImeiLookup(e.target.value)}
            />
            <button 
              onClick={handleIMEILookup}
              className="px-6 bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-2xl font-bold text-xs shadow-lg shadow-cyan-600/30"
            >
              فحص
            </button>
          </div>

          {lookupResult && (
            <div className="p-4 bg-[#0f172a] border border-cyan-500/30 rounded-2xl text-right space-y-3 animate-fade-in">
              <div className="flex items-center justify-between border-b border-[#1e293b] pb-2">
                <span className="font-bold text-white">{lookupResult.deviceBrand} {lookupResult.deviceModel}</span>
                {getStatusBadge(lookupResult.status)}
              </div>
              <p className="text-xs text-slate-300">العميل: <strong>{lookupResult.customerName}</strong> ({lookupResult.customerPhone})</p>
              <p className="text-xs text-slate-300">تاريخ الاستلام: <strong>{new Date(lookupResult.receivedDate).toLocaleDateString('ar-EG')}</strong></p>
              <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 rounded-xl text-xs font-bold flex items-center gap-2">
                <CheckCircle2 size={16} />
                <span>الضمان ساري لمدة {lookupResult.warrantyMonths} شهور من تاريخ التسليم</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal: New Maintenance Ticket */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#151b2b] border border-cyan-500/40 rounded-3xl max-w-2xl w-full p-6 space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#1e293b] pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-cyan-500/10 text-cyan-400 rounded-xl">
                  <Wrench size={22} />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">إصدار كارت صيانة واستلام جهاز (Job Card)</h3>
                  <p className="text-xs text-slate-400">تسجيل بيانات العميل، فحص العطل، والتكلفة المبدئية</p>
                </div>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-slate-500 hover:text-white font-bold text-xl">✕</button>
            </div>

            <form onSubmit={handleCreateTicket} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-400 font-bold block mb-1">اسم العميل *</label>
                  <input 
                    type="text" 
                    placeholder="اسم العميل" 
                    className="w-full p-3 bg-[#0f172a] border border-[#1e293b] rounded-xl text-xs text-white focus:border-cyan-500 outline-none"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 font-bold block mb-1">رقم الهاتف *</label>
                  <input 
                    type="text" 
                    placeholder="010xxxxxxxx" 
                    className="w-full p-3 bg-[#0f172a] border border-[#1e293b] rounded-xl text-xs text-white focus:border-cyan-500 outline-none font-mono"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-xs text-slate-400 font-bold block mb-1">نوع الجهاز</label>
                  <select 
                    className="w-full p-3 bg-[#0f172a] border border-[#1e293b] rounded-xl text-xs text-white focus:border-cyan-500 outline-none"
                    value={deviceType}
                    onChange={(e) => setDeviceType(e.target.value as any)}
                  >
                    <option value="هاتف ذكي">هاتف ذكي (Smart Phone)</option>
                    <option value="كمبيوتر محمول">لاب توب (Laptop)</option>
                    <option value="شاشة تلفزيون">شاشة وتلفزيون</option>
                    <option value="جهاز كهربائي منزلي">أجهزة منزلية</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-400 font-bold block mb-1">الماركة / Brand</label>
                  <input 
                    type="text" 
                    placeholder="مثال: Samsung, Apple" 
                    className="w-full p-3 bg-[#0f172a] border border-[#1e293b] rounded-xl text-xs text-white focus:border-cyan-500 outline-none"
                    value={deviceBrand}
                    onChange={(e) => setDeviceBrand(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 font-bold block mb-1">الموديل *</label>
                  <input 
                    type="text" 
                    placeholder="مثال: Galaxy S24 Ultra" 
                    className="w-full p-3 bg-[#0f172a] border border-[#1e293b] rounded-xl text-xs text-white focus:border-cyan-500 outline-none"
                    value={deviceModel}
                    onChange={(e) => setDeviceModel(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-400 font-bold block mb-1">السيريال نمبر / IMEI</label>
                  <input 
                    type="text" 
                    placeholder="358xxxxxxxxxxxx" 
                    className="w-full p-3 bg-[#0f172a] border border-[#1e293b] rounded-xl text-xs text-white focus:border-cyan-500 outline-none font-mono"
                    value={serialOrIMEI}
                    onChange={(e) => setSerialOrIMEI(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 font-bold block mb-1">التكلفة التقديرية (ج.م)</label>
                  <input 
                    type="number" 
                    className="w-full p-3 bg-[#0f172a] border border-[#1e293b] rounded-xl text-xs text-white focus:border-cyan-500 outline-none"
                    value={costEstimate}
                    onChange={(e) => setCostEstimate(Number(e.target.value))}
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400 font-bold block mb-1">شكوى العميل والعطل المسجل *</label>
                <textarea 
                  rows={3}
                  placeholder="وصف المشكلة والأعطال الظاهرة في الجهاز..." 
                  className="w-full p-3 bg-[#0f172a] border border-[#1e293b] rounded-xl text-xs text-white focus:border-cyan-500 outline-none resize-none"
                  value={reportedProblem}
                  onChange={(e) => setReportedProblem(e.target.value)}
                  required
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button 
                  type="button" 
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-3 bg-[#0f172a] border border-[#1e293b] text-slate-400 hover:text-white rounded-xl text-xs font-bold"
                >
                  إلغاء
                </button>
                <button 
                  type="submit" 
                  className="flex-1 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-cyan-600/30"
                >
                  حفظ وطباعة إيصال الاستلام
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
