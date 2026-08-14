import React, { useState } from 'react';
import { 
  Users, 
  Wallet, 
  CalendarClock, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  Briefcase,
  UserPlus,
  Clock,
  Building,
  DollarSign,
  TrendingUp,
  Download
} from 'lucide-react';
import { formatCurrency, cn } from '../lib/utils';

type Tab = 'employees' | 'attendance' | 'payroll';

export const HRAndPayroll: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('employees');

  const mockEmployees = [
    { id: 'EMP-001', name: 'أحمد محمود', position: 'مدير فرع', department: 'العمليات', status: 'active', salary: 12000, joinDate: '2020-05-10' },
    { id: 'EMP-002', name: 'سارة خالد', position: 'محاسب أول', department: 'المالية', status: 'active', salary: 8500, joinDate: '2021-08-01' },
    { id: 'EMP-003', name: 'عمر ياسين', position: 'مسؤول مبيعات', department: 'المبيعات', status: 'on_leave', salary: 5500, joinDate: '2022-01-15' },
    { id: 'EMP-004', name: 'فاطمة علي', position: 'أخصائي تسويق', department: 'التسويق', status: 'active', salary: 7000, joinDate: '2023-03-20' },
  ];

  const mockAttendance = [
    { name: 'أحمد محمود', date: '2023-11-14', checkIn: '08:00 AM', checkOut: '05:15 PM', status: 'present', hours: 9.25 },
    { name: 'سارة خالد', date: '2023-11-14', checkIn: '08:15 AM', checkOut: '05:00 PM', status: 'late', hours: 8.75 },
    { name: 'عمر ياسين', date: '2023-11-14', checkIn: '-', checkOut: '-', status: 'leave', hours: 0 },
    { name: 'فاطمة علي', date: '2023-11-14', checkIn: '07:55 AM', checkOut: '05:00 PM', status: 'present', hours: 9.08 },
  ];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-950 via-[#151b2b] to-[#0f172a] p-6 rounded-2xl border border-blue-900/40 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-400 font-bold text-xs border border-blue-500/30">
              MARO Phase 12: HR & Payroll
            </span>
          </div>
          <h1 className="text-2xl font-black text-white">الموارد البشرية والرواتب</h1>
          <p className="text-xs text-slate-400 mt-1">
            إدارة متكاملة لملفات الموظفين، تتبع الحضور والانصراف، وإصدار مسيرات الرواتب تلقائياً.
          </p>
        </div>
        <div className="flex items-center gap-3">
           <div className="bg-[#0f172a] p-3 rounded-xl border border-slate-800 flex items-center gap-3">
             <Users className="text-blue-400" size={24} />
             <div>
               <p className="text-[10px] text-slate-400">عدد الموظفين</p>
               <p className="text-xs font-bold text-blue-400">124 موظف نشط</p>
             </div>
           </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('employees')}
          className={cn(
            "px-5 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2",
            activeTab === 'employees' ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" : "bg-[#151b2b] text-slate-400 hover:text-white border border-slate-800"
          )}
        >
          <Briefcase size={16} />
          شؤون الموظفين
        </button>
        <button
          onClick={() => setActiveTab('attendance')}
          className={cn(
            "px-5 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2",
            activeTab === 'attendance' ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" : "bg-[#151b2b] text-slate-400 hover:text-white border border-slate-800"
          )}
        >
          <CalendarClock size={16} />
          الحضور والانصراف
        </button>
        <button
          onClick={() => setActiveTab('payroll')}
          className={cn(
            "px-5 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2",
            activeTab === 'payroll' ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" : "bg-[#151b2b] text-slate-400 hover:text-white border border-slate-800"
          )}
        >
          <Wallet size={16} />
          مسير الرواتب
        </button>
      </div>

      {/* Employees Tab */}
      {activeTab === 'employees' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-white flex items-center gap-2">
              <Users className="text-emerald-400" size={20} />
              قائمة الموظفين
            </h3>
            <button className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2">
              <UserPlus size={16} /> إضافة موظف
            </button>
          </div>

          <div className="bg-[#151b2b] rounded-2xl border border-slate-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-sm">
                <thead className="bg-[#0f172a] border-b border-slate-800 text-slate-400 text-xs">
                  <tr>
                    <th className="px-6 py-4 font-bold">رقم الموظف</th>
                    <th className="px-6 py-4 font-bold">الاسم</th>
                    <th className="px-6 py-4 font-bold">القسم / المسمى الوظيفي</th>
                    <th className="px-6 py-4 font-bold">الراتب الأساسي</th>
                    <th className="px-6 py-4 font-bold">الحالة</th>
                    <th className="px-6 py-4 font-bold text-center">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {mockEmployees.map((emp) => (
                    <tr key={emp.id} className="hover:bg-[#0f172a]/50 transition-colors">
                      <td className="px-6 py-4 font-mono text-xs text-slate-500">{emp.id}</td>
                      <td className="px-6 py-4 text-white font-bold text-xs flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-xs">
                          {emp.name.substring(0, 1)}
                        </div>
                        {emp.name}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-xs text-white">{emp.position}</div>
                        <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-1">
                          <Building size={10} /> {emp.department}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-emerald-400 font-bold font-mono text-xs">
                        {formatCurrency(emp.salary)}
                      </td>
                      <td className="px-6 py-4">
                        <span className={cn(
                          "px-2 py-1 rounded-lg text-[10px] font-bold border",
                          emp.status === 'active' ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                        )}>
                          {emp.status === 'active' ? 'على رأس العمل' : 'في إجازة'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button className="text-blue-400 hover:text-blue-300 text-xs font-bold bg-blue-500/10 px-3 py-1.5 rounded-lg transition-colors">
                          الملف
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Attendance Tab */}
      {activeTab === 'attendance' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-[#151b2b] p-4 rounded-xl border border-slate-800 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                <CheckCircle2 size={24} />
              </div>
              <div>
                <p className="text-[10px] text-slate-400">الحضور اليوم</p>
                <p className="text-xl font-bold text-white font-mono">118</p>
              </div>
            </div>
            <div className="bg-[#151b2b] p-4 rounded-xl border border-slate-800 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-amber-500/10 text-amber-400 flex items-center justify-center">
                <AlertCircle size={24} />
              </div>
              <div>
                <p className="text-[10px] text-slate-400">التأخير</p>
                <p className="text-xl font-bold text-white font-mono">4</p>
              </div>
            </div>
            <div className="bg-[#151b2b] p-4 rounded-xl border border-slate-800 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-red-500/10 text-red-400 flex items-center justify-center">
                <Users size={24} />
              </div>
              <div>
                <p className="text-[10px] text-slate-400">الغياب</p>
                <p className="text-xl font-bold text-white font-mono">2</p>
              </div>
            </div>
          </div>

          <div className="bg-[#151b2b] rounded-2xl border border-slate-800 overflow-hidden">
            <div className="p-4 border-b border-slate-800 bg-[#0f172a] flex justify-between items-center">
              <h4 className="font-bold text-white text-sm">سجل اليوم (14 نوفمبر 2023)</h4>
              <button className="text-xs text-blue-400 hover:text-white flex items-center gap-1">
                <Download size={14} /> سحب من البصمة
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-right text-sm">
                <thead className="bg-[#151b2b] border-b border-slate-800 text-slate-400 text-xs">
                  <tr>
                    <th className="px-6 py-4 font-bold">اسم الموظف</th>
                    <th className="px-6 py-4 font-bold">وقت الحضور</th>
                    <th className="px-6 py-4 font-bold">وقت الانصراف</th>
                    <th className="px-6 py-4 font-bold">ساعات العمل</th>
                    <th className="px-6 py-4 font-bold">الحالة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {mockAttendance.map((record, idx) => (
                    <tr key={idx} className="hover:bg-[#0f172a]/50 transition-colors">
                      <td className="px-6 py-4 text-white font-bold text-xs">{record.name}</td>
                      <td className="px-6 py-4 font-mono text-xs text-slate-300">{record.checkIn}</td>
                      <td className="px-6 py-4 font-mono text-xs text-slate-300">{record.checkOut}</td>
                      <td className="px-6 py-4 font-mono text-xs text-blue-400">{record.hours > 0 ? `${record.hours} ساعة` : '-'}</td>
                      <td className="px-6 py-4">
                        <span className={cn(
                          "px-2 py-1 rounded-lg text-[10px] font-bold border",
                          record.status === 'present' ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : 
                          record.status === 'late' ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
                          "bg-slate-500/10 text-slate-400 border-slate-500/20"
                        )}>
                          {record.status === 'present' ? 'حاضر' : record.status === 'late' ? 'متأخر' : 'إجازة'}
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

      {/* Payroll Tab */}
      {activeTab === 'payroll' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-bold text-white flex items-center gap-2">
                <Wallet className="text-blue-400" size={20} />
                إعداد مسير الرواتب (نوفمبر 2023)
              </h3>
              <p className="text-xs text-slate-400 mt-1">يتم احتساب البدلات، الخصومات، والغيابات تلقائياً بناءً على الحضور.</p>
            </div>
            <button className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-lg shadow-emerald-600/20 flex items-center gap-2">
              <CheckCircle2 size={16} /> اعتماد وإنشاء القيد المحاسبي
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1 space-y-4">
              <div className="bg-[#151b2b] p-5 rounded-2xl border border-slate-800">
                <h4 className="text-sm font-bold text-white mb-4">ملخص المسير</h4>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-xs border-b border-slate-800 pb-2">
                    <span className="text-slate-400">إجمالي الرواتب الأساسية</span>
                    <span className="font-bold text-white font-mono">{formatCurrency(650000)}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs border-b border-slate-800 pb-2">
                    <span className="text-slate-400">البدلات (سكن، مواصلات)</span>
                    <span className="font-bold text-emerald-400 font-mono">+{formatCurrency(125000)}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs border-b border-slate-800 pb-2">
                    <span className="text-slate-400">الاستقطاعات (تأخير، غياب)</span>
                    <span className="font-bold text-red-400 font-mono">-{formatCurrency(12500)}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2">
                    <span className="text-sm font-bold text-blue-400">صافي الدفع</span>
                    <span className="text-lg font-black text-white font-mono">{formatCurrency(762500)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="md:col-span-2 bg-[#151b2b] rounded-2xl border border-slate-800 overflow-hidden">
               <div className="p-4 border-b border-slate-800 bg-[#0f172a] flex justify-between items-center">
                <h4 className="font-bold text-white text-sm">تفاصيل رواتب الموظفين (معاينة)</h4>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-right text-sm">
                  <thead className="bg-[#151b2b] border-b border-slate-800 text-slate-400 text-xs">
                    <tr>
                      <th className="px-6 py-4 font-bold">الموظف</th>
                      <th className="px-6 py-4 font-bold">الأساسي</th>
                      <th className="px-6 py-4 font-bold">البدلات</th>
                      <th className="px-6 py-4 font-bold">الخصومات</th>
                      <th className="px-6 py-4 font-bold">الصافي</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    <tr className="hover:bg-[#0f172a]/50 transition-colors">
                      <td className="px-6 py-4 text-white font-bold text-xs">أحمد محمود</td>
                      <td className="px-6 py-4 font-mono text-xs text-slate-300">{formatCurrency(12000)}</td>
                      <td className="px-6 py-4 font-mono text-xs text-emerald-400">+{formatCurrency(3000)}</td>
                      <td className="px-6 py-4 font-mono text-xs text-slate-500">0.00</td>
                      <td className="px-6 py-4 font-mono text-xs text-white font-bold">{formatCurrency(15000)}</td>
                    </tr>
                    <tr className="hover:bg-[#0f172a]/50 transition-colors">
                      <td className="px-6 py-4 text-white font-bold text-xs">سارة خالد</td>
                      <td className="px-6 py-4 font-mono text-xs text-slate-300">{formatCurrency(8500)}</td>
                      <td className="px-6 py-4 font-mono text-xs text-emerald-400">+{formatCurrency(2125)}</td>
                      <td className="px-6 py-4 font-mono text-xs text-red-400">-{formatCurrency(150)}</td>
                      <td className="px-6 py-4 font-mono text-xs text-white font-bold">{formatCurrency(10475)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
