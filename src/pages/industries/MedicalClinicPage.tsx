import React, { useState } from 'react';
import { 
  HeartPulse, 
  Users, 
  Calendar, 
  FileText, 
  Stethoscope, 
  Plus, 
  Search, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  DollarSign, 
  Sparkles,
  Pill
} from 'lucide-react';
import { MedicalPatientEMR, DoctorAppointment } from '../../types/industryModules';
import { formatCurrency, cn } from '../../lib/utils';

export const MedicalClinicPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'queue' | 'patients' | 'doctor_split'>('queue');
  const [searchPatient, setSearchPatient] = useState('');

  // Doctor Appointments / Waiting Queue
  const [appointments, setAppointments] = useState<DoctorAppointment[]>([
    {
      id: 'apt1',
      appointmentNumber: 'APT-2026-081',
      patientId: 'p1',
      patientName: 'مروان فتحي الديب',
      patientPhone: '01019284712',
      doctorName: 'د. أشرف الشربيني',
      specialty: 'باطنة وجهاز هضمي',
      appointmentDate: '2026-08-14',
      appointmentTime: '06:30 م',
      type: 'كشف جديد',
      fee: 300,
      doctorSharePercent: 65,
      paymentStatus: 'PAID',
      status: 'IN_EXAMINATION',
      diagnosis: 'التهاب معدي حاد مع عسر هضم وظيفي',
      prescriptionRx: [
        { drugName: 'Controloc 40mg', dosage: 'قرص واحد قبل الإفطار', duration: '14 يوم', instructions: 'على معدة فارغة' },
        { drugName: 'Duspatalin Retard 200mg', dosage: 'قرص مرتين يومياً', duration: '10 أيام', instructions: 'قبل الأكل بنصف ساعة' }
      ]
    },
    {
      id: 'apt2',
      appointmentNumber: 'APT-2026-082',
      patientId: 'p2',
      patientName: 'ندى سمير الألفي',
      patientPhone: '01229184710',
      doctorName: 'د. ريهام علام',
      specialty: 'جلدية وتجميل',
      appointmentDate: '2026-08-14',
      appointmentTime: '07:00 م',
      type: 'إجراء جراحي / جلسة علاجية',
      fee: 650,
      doctorSharePercent: 60,
      paymentStatus: 'PAID',
      status: 'IN_WAITING_ROOM'
    },
    {
      id: 'apt3',
      appointmentNumber: 'APT-2026-083',
      patientId: 'p3',
      patientName: 'الطفل / يوسف أحمد كمال (4 سنوات)',
      patientPhone: '01118294719',
      doctorName: 'د. تامر فودة',
      specialty: 'أطفال وحديثي ولادة',
      appointmentDate: '2026-08-14',
      appointmentTime: '07:30 م',
      type: 'إعادة واستشارة',
      fee: 100,
      doctorSharePercent: 50,
      paymentStatus: 'PAID',
      status: 'SCHEDULED'
    }
  ]);

  // Patients EMR
  const [patients, setPatients] = useState<MedicalPatientEMR[]>([
    {
      id: 'p1',
      fileNumber: 'MED-FILE-901',
      patientName: 'مروان فتحي الديب',
      age: 42,
      gender: 'ذكر',
      phone: '01019284712',
      bloodType: 'O+',
      chronicDiseases: ['ضغط دم مرتفع'],
      allergies: ['حساسية من البنسلين (Penicillin Allergy)'],
      lastVisitDate: '2026-08-14',
      totalVisits: 4
    },
    {
      id: 'p2',
      fileNumber: 'MED-FILE-902',
      patientName: 'ندى سمير الألفي',
      age: 29,
      gender: 'أنثى',
      phone: '01229184710',
      bloodType: 'A+',
      chronicDiseases: [],
      allergies: ['لا توجد حساسية معروفة'],
      lastVisitDate: '2026-08-01',
      totalVisits: 2
    }
  ]);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-[#151b2b] border border-rose-500/30 rounded-3xl p-6 shadow-2xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-r from-rose-500 via-pink-500 to-red-500"></div>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
              <HeartPulse size={14} />
              <span>Medical Clinics & EMR Master Module</span>
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-white">
            العيادات والمراكز الطبية والملف الطبي (EMR)
          </h1>
          <p className="text-xs md:text-sm text-slate-400">
            طابور الانتظار، حجز الكشوفات والاستشارات، الروشتة الإلكترونية الرقمية Rx، ومحاسبة وتوزيع أتعاب ونسب الأطباء.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-[#0f172a] p-3 rounded-2xl border border-slate-800 flex items-center gap-3">
            <Stethoscope className="text-rose-400" size={24} />
            <div>
              <p className="text-[10px] text-slate-400">كشوفات وحجوزات اليوم</p>
              <p className="text-xs font-bold text-white">{appointments.length} مرضى بالعيادة</p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('queue')}
          className={cn(
            "px-5 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2",
            activeTab === 'queue' ? "bg-rose-600 text-white shadow-md shadow-rose-600/20" : "bg-slate-900 text-slate-400 hover:text-white"
          )}
        >
          <Clock size={16} />
          <span>طابور الكشف والعيادات ({appointments.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('patients')}
          className={cn(
            "px-5 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2",
            activeTab === 'patients' ? "bg-rose-600 text-white shadow-md shadow-rose-600/20" : "bg-slate-900 text-slate-400 hover:text-white"
          )}
        >
          <Users size={16} />
          <span>الملفات الطبية للمرضى (EMR) ({patients.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('doctor_split')}
          className={cn(
            "px-5 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2",
            activeTab === 'doctor_split' ? "bg-rose-600 text-white shadow-md shadow-rose-600/20" : "bg-slate-900 text-slate-400 hover:text-white"
          )}
        >
          <DollarSign size={16} />
          <span>توزيع إيرادات ونسب الأطباء</span>
        </button>
      </div>

      {/* TAB 1: QUEUE & APPOINTMENTS */}
      {activeTab === 'queue' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {appointments.map((apt) => (
              <div key={apt.id} className="bg-[#151b2b] border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-slate-900 text-rose-400 border border-slate-700">
                      {apt.appointmentNumber}
                    </span>
                    <h3 className="text-base font-black text-white mt-1">{apt.patientName}</h3>
                    <p className="text-xs text-slate-400">{apt.doctorName} • <span className="text-rose-300 font-bold">{apt.specialty}</span></p>
                  </div>
                  <span className={cn(
                    "text-[10px] font-bold px-2.5 py-0.5 rounded-full border",
                    apt.status === 'IN_EXAMINATION' ? "bg-rose-500/20 text-rose-300 border-rose-500/30 animate-pulse" :
                    apt.status === 'IN_WAITING_ROOM' ? "bg-amber-500/20 text-amber-300 border-amber-500/30" : "bg-blue-500/20 text-blue-300 border-blue-500/30"
                  )}>
                    {apt.status === 'IN_EXAMINATION' ? 'داخل الكشف الآن' :
                     apt.status === 'IN_WAITING_ROOM' ? 'في استراحة الانتظار' : 'مجدول'}
                  </span>
                </div>

                <div className="bg-[#0f172a] p-3 rounded-xl border border-slate-800 text-xs space-y-1.5">
                  <div className="flex justify-between text-slate-400">
                    <span>نوع الكشف:</span>
                    <span className="font-bold text-white">{apt.type}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>الموعد:</span>
                    <span className="text-slate-200">{apt.appointmentTime}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>قيمة الكشف:</span>
                    <span className="text-emerald-400 font-bold">{formatCurrency(apt.fee)} (مدفوع)</span>
                  </div>
                </div>

                {/* Prescription Preview if examined */}
                {apt.prescriptionRx && (
                  <div className="border-t border-slate-800 pt-3 space-y-1.5">
                    <span className="text-[11px] font-bold text-rose-400 flex items-center gap-1">
                      <Pill size={14} /> الروشتة الطبية Rx:
                    </span>
                    {apt.prescriptionRx.map((rx, idx) => (
                      <div key={idx} className="bg-[#0f172a] p-2 rounded text-[11px]">
                        <span className="font-bold text-white block">{rx.drugName}</span>
                        <span className="text-slate-400 text-[10px]">{rx.dosage} • {rx.duration}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: PATIENTS EMR */}
      {activeTab === 'patients' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {patients.map((patient) => (
              <div key={patient.id} className="bg-[#151b2b] border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-900 text-rose-400 border border-slate-700">
                      {patient.fileNumber}
                    </span>
                    <h3 className="text-base font-black text-white mt-1">{patient.patientName}</h3>
                    <p className="text-xs text-slate-400">السن: {patient.age} سنة • الجنس: {patient.gender} • فصيلة الدم: <span className="text-red-400 font-bold">{patient.bloodType}</span></p>
                  </div>
                  <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-slate-800 text-slate-300">
                    {patient.totalVisits} زيارات سابقة
                  </span>
                </div>

                <div className="bg-[#0f172a] p-3 rounded-xl border border-slate-800 space-y-2 text-xs">
                  <div>
                    <span className="text-slate-500 text-[10px] block font-bold">الحساسية الدوائية والغذائية:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {patient.allergies.map((a, i) => (
                        <span key={i} className="px-2 py-0.5 bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded text-[10px] font-bold">
                          ⚠️ {a}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] block font-bold">الأمراض المزمنة:</span>
                    <span className="text-slate-300 font-bold">{patient.chronicDiseases.length > 0 ? patient.chronicDiseases.join('، ') : 'لا يوجد أمراض مزمنة'}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: DOCTOR REVENUE SPLIT */}
      {activeTab === 'doctor_split' && (
        <div className="bg-[#151b2b] p-6 rounded-2xl border border-slate-800 space-y-6">
          <h3 className="text-base font-black text-white flex items-center gap-2">
            <Sparkles className="text-rose-400" size={18} />
            <span>تسوية نسب وإيرادات الأطباء اليومية (14 أغسطس 2026)</span>
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-[#0f172a] text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="p-3">اسم الطبيب</th>
                  <th className="p-3">التخصص</th>
                  <th className="p-3">إجمالي الكشوفات</th>
                  <th className="p-3">نسبة الطبيب</th>
                  <th className="p-3">مستحق الطبيب الصافي</th>
                  <th className="p-3">حصة المركز الطبي</th>
                  <th className="p-3 text-center">الإجراء</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {appointments.map((apt) => {
                  const docNet = apt.fee * (apt.doctorSharePercent / 100);
                  const centerNet = apt.fee - docNet;
                  return (
                    <tr key={apt.id} className="hover:bg-slate-900/50">
                      <td className="p-3 font-bold text-white">{apt.doctorName}</td>
                      <td className="p-3 text-slate-300">{apt.specialty}</td>
                      <td className="p-3 font-bold text-emerald-400">{formatCurrency(apt.fee)}</td>
                      <td className="p-3 text-amber-400 font-bold">{apt.doctorSharePercent}%</td>
                      <td className="p-3 font-black text-rose-300">{formatCurrency(docNet)}</td>
                      <td className="p-3 font-bold text-slate-300">{formatCurrency(centerNet)}</td>
                      <td className="p-3 text-center">
                        <button className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs shadow-md">
                          ترحيل قيد الأتعاب
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
