/**
 * @file EducationCenterPage.tsx
 * @module واجهات وصفحات النظام (UI Pages)
 * @description ملف جزء من نظام MARO ERP. الوظيفة: EducationCenterPage.tsx.
 */
import React, { useState } from 'react';
import { 
  GraduationCap, 
  Users, 
  Calendar, 
  Barcode, 
  DollarSign, 
  Plus, 
  Search, 
  CheckCircle2, 
  XCircle, 
  FileText, 
  Clock, 
  Sparkles,
  BookOpen
} from 'lucide-react';
import { EducationalCourseGroup, StudentEnrollment } from '../../types/industryModules';
import { formatCurrency, cn } from '../../lib/utils';

export const EducationCenterPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'groups' | 'students' | 'teacher_settlement'>('groups');
  const [searchStudent, setSearchStudent] = useState('');

  // Course Groups
  const [groups, setGroups] = useState<EducationalCourseGroup[]>([
    {
      id: 'grp1',
      courseName: 'فيزياء لغات (Physics 3rd Sec)',
      gradeLevel: 'الصف الثالث الثانوي',
      instructorName: 'أ. د. حسام عبد المقصود',
      instructorCommissionPercent: 75,
      hallName: 'القاعة الكبرى (مسرح السنتر 1)',
      capacity: 120,
      scheduleDays: 'السبت والثلاثاء (04:00 م - 06:30 م)',
      sessionPrice: 100,
      monthlySubscriptionPrice: 380,
      enrolledStudentsCount: 98,
      isActive: true
    },
    {
      id: 'grp2',
      courseName: 'كيمياء الثانوية العامة',
      gradeLevel: 'الصف الثالث الثانوي',
      instructorName: 'أ. إيهاب منصور',
      instructorCommissionPercent: 70,
      hallName: 'قاعة 2 (Smart Hall)',
      capacity: 80,
      scheduleDays: 'الأحد والأربعاء (05:00 م - 07:00 م)',
      sessionPrice: 90,
      monthlySubscriptionPrice: 340,
      enrolledStudentsCount: 64,
      isActive: true
    },
    {
      id: 'grp3',
      courseName: 'رياضيات بحتة وتطبيقية (Calculus & Algebra)',
      gradeLevel: 'الصف الثاني الثانوي',
      instructorName: 'أ. محمد سراج',
      instructorCommissionPercent: 70,
      hallName: 'قاعة 3',
      capacity: 60,
      scheduleDays: 'الإثنين والخميس (03:30 م - 05:30 م)',
      sessionPrice: 80,
      monthlySubscriptionPrice: 300,
      enrolledStudentsCount: 45,
      isActive: true
    }
  ]);

  // Students
  const [students, setStudents] = useState<StudentEnrollment[]>([
    {
      id: 'std1',
      studentCode: 'STD-2026-0109',
      studentBarcode: '62210928101',
      studentName: 'عمر خالد البهنساوي',
      studentPhone: '01092817462',
      parentPhone: '01228491029',
      groupId: 'grp1',
      groupName: 'فيزياء لغات (Physics 3rd Sec)',
      subscriptionType: 'بالحصة',
      balance: 0,
      attendanceSessions: [
        { sessionDate: '2026-08-10', isPresent: true, paidAmount: 100, notes: 'حاضر مع استلام ملزمة المراجعة' },
        { sessionDate: '2026-08-14', isPresent: true, paidAmount: 100 }
      ]
    },
    {
      id: 'std2',
      studentCode: 'STD-2026-0110',
      studentBarcode: '62210928102',
      studentName: 'سارة محمود الجندي',
      studentPhone: '01119284712',
      parentPhone: '01009182736',
      groupId: 'grp1',
      groupName: 'فيزياء لغات (Physics 3rd Sec)',
      subscriptionType: 'اشتراك شهري',
      balance: 0,
      attendanceSessions: [
        { sessionDate: '2026-08-10', isPresent: true, paidAmount: 380, notes: 'تم سداد اشتراك شهر أغسطس بالكامل' },
        { sessionDate: '2026-08-14', isPresent: true, paidAmount: 0 }
      ]
    },
    {
      id: 'std3',
      studentCode: 'STD-2026-0111',
      studentBarcode: '62210928103',
      studentName: 'يوسف حازم النجار',
      studentPhone: '01558291048',
      parentPhone: '01019284729',
      groupId: 'grp2',
      groupName: 'كيمياء الثانوية العامة',
      subscriptionType: 'بالحصة',
      balance: -90, // متبقي عليه حصة
      attendanceSessions: [
        { sessionDate: '2026-08-12', isPresent: true, paidAmount: 0, notes: 'متبقي عليه حساب الحصة' }
      ]
    }
  ]);

  const filteredStudents = students.filter(s => 
    s.studentName.includes(searchStudent) || 
    s.studentCode.includes(searchStudent) || 
    s.studentBarcode.includes(searchStudent)
  );

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-[#151b2b] border border-indigo-500/30 rounded-3xl p-6 shadow-2xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
              <GraduationCap size={14} />
              <span>Educational Centers & Academies Module</span>
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-white">
            السناتر التعليمية والمجموعات ونسب المدرسين
          </h1>
          <p className="text-xs md:text-sm text-slate-400">
            إدارة شاملة للسناتر: حضور الطلاب بمسح الباركود، تحصيل رسوم الحصص والملازم، جداول القاعات، وحساب نسب وعمولات المدرسين تلقائياً.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-[#0f172a] p-3 rounded-2xl border border-slate-800 flex items-center gap-3">
            <Users className="text-indigo-400" size={24} />
            <div>
              <p className="text-[10px] text-slate-400">إجمالي الطلاب المسجلين</p>
              <p className="text-xs font-bold text-white">207 طلاب في 3 مجموعات</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('groups')}
          className={cn(
            "px-5 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2",
            activeTab === 'groups' ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20" : "bg-slate-900 text-slate-400 hover:text-white"
          )}
        >
          <BookOpen size={16} />
          <span>المجموعات والقاعات ({groups.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('students')}
          className={cn(
            "px-5 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2",
            activeTab === 'students' ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20" : "bg-slate-900 text-slate-400 hover:text-white"
          )}
        >
          <Users size={16} />
          <span>سجل الطلاب وحضور الباركود ({students.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('teacher_settlement')}
          className={cn(
            "px-5 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2",
            activeTab === 'teacher_settlement' ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20" : "bg-slate-900 text-slate-400 hover:text-white"
          )}
        >
          <DollarSign size={16} />
          <span>حساب مستحقات المدرسين</span>
        </button>
      </div>

      {/* TAB 1: GROUPS */}
      {activeTab === 'groups' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {groups.map((grp) => (
            <div key={grp.id} className="bg-[#151b2b] border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-indigo-400 border border-slate-700">
                    {grp.gradeLevel}
                  </span>
                  <h3 className="text-base font-black text-white mt-1.5">{grp.courseName}</h3>
                  <p className="text-xs font-bold text-slate-300 mt-0.5">المدرس: {grp.instructorName}</p>
                </div>
                <span className="px-2 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30">
                  نشطة
                </span>
              </div>

              <div className="bg-[#0f172a] p-3 rounded-xl border border-slate-800 text-xs space-y-1.5">
                <div className="flex justify-between text-slate-400">
                  <span>القاعة والمكان:</span>
                  <span className="text-white font-bold">{grp.hallName}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>المواعيد:</span>
                  <span className="text-indigo-300 font-bold">{grp.scheduleDays}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>سعر الحصة / الشهر:</span>
                  <span className="text-emerald-400 font-bold">{grp.sessionPrice} ج / {grp.monthlySubscriptionPrice} ج</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>نسبة المدرس:</span>
                  <span className="text-amber-400 font-bold">{grp.instructorCommissionPercent}%</span>
                </div>
              </div>

              <div className="flex justify-between items-center border-t border-slate-800 pt-3 text-xs">
                <span className="text-slate-400">الطلاب المقيدين:</span>
                <span className="font-bold text-white">{grp.enrolledStudentsCount} من {grp.capacity} طالب</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 2: STUDENTS */}
      {activeTab === 'students' && (
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-[#151b2b] p-4 rounded-2xl border border-slate-800">
            <div className="relative w-full md:w-96">
              <Search className="absolute right-3 top-3 text-slate-500" size={16} />
              <input
                type="text"
                placeholder="بحث باسم الطالب، كود الطالب، أو مسح الباركود..."
                value={searchStudent}
                onChange={(e) => setSearchStudent(e.target.value)}
                className="w-full bg-[#0f172a] border border-slate-700 rounded-xl pr-10 pl-4 py-2.5 text-xs text-white placeholder-slate-500 focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {filteredStudents.map((std) => (
              <div key={std.id} className="bg-[#151b2b] border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-slate-900 text-indigo-400 border border-slate-700">
                      {std.studentCode}
                    </span>
                    <h3 className="text-sm font-black text-white mt-1">{std.studentName}</h3>
                    <p className="text-[11px] text-slate-400">{std.groupName}</p>
                  </div>
                  <span className={cn(
                    "text-[10px] font-bold px-2 py-0.5 rounded-full border",
                    std.balance >= 0 ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" : "bg-red-500/20 text-red-400 border-red-500/30"
                  )}>
                    {std.balance >= 0 ? 'خالص السداد' : `متبقي ${Math.abs(std.balance)} ج`}
                  </span>
                </div>

                <div className="bg-[#0f172a] p-3 rounded-xl border border-slate-800 text-[11px] space-y-1">
                  <div className="flex justify-between text-slate-400">
                    <span>باركود الكارت:</span>
                    <span className="font-mono text-white font-bold flex items-center gap-1">
                      <Barcode size={14} className="text-indigo-400" />
                      {std.studentBarcode}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>هاتف ولي الأمر:</span>
                    <span className="text-slate-300 font-bold">{std.parentPhone}</span>
                  </div>
                </div>

                <div className="border-t border-slate-800 pt-2 flex justify-between items-center text-xs">
                  <span className="text-slate-500">نظام السداد: {std.subscriptionType}</span>
                  <button className="px-3 py-1 bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 rounded-lg text-xs font-bold transition-all">
                    تسجيل حضور الآن
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: TEACHER SETTLEMENT */}
      {activeTab === 'teacher_settlement' && (
        <div className="bg-[#151b2b] p-6 rounded-2xl border border-slate-800 space-y-6">
          <h3 className="text-base font-black text-white flex items-center gap-2">
            <Sparkles className="text-indigo-400" size={18} />
            <span>كشف حساب وتصفية إيرادات المدرسين لشهر أغسطس 2026</span>
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-[#0f172a] text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="p-3">اسم المدرس</th>
                  <th className="p-3">المادة</th>
                  <th className="p-3">إجمالي الإيراد المحصل</th>
                  <th className="p-3">نسبة المدرس</th>
                  <th className="p-3">مستحق المدرس الصافي</th>
                  <th className="p-3">حصة السنتر</th>
                  <th className="p-3 text-center">الإجراء</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {groups.map((grp) => {
                  const estRevenue = grp.enrolledStudentsCount * grp.sessionPrice * 8; // 8 sessions a month
                  const teacherNet = estRevenue * (grp.instructorCommissionPercent / 100);
                  const centerNet = estRevenue - teacherNet;
                  return (
                    <tr key={grp.id} className="hover:bg-slate-900/50">
                      <td className="p-3 font-bold text-white">{grp.instructorName}</td>
                      <td className="p-3 text-slate-300">{grp.courseName}</td>
                      <td className="p-3 font-bold text-emerald-400">{formatCurrency(estRevenue)}</td>
                      <td className="p-3 text-amber-400 font-bold">{grp.instructorCommissionPercent}%</td>
                      <td className="p-3 font-black text-indigo-300">{formatCurrency(teacherNet)}</td>
                      <td className="p-3 font-bold text-slate-300">{formatCurrency(centerNet)}</td>
                      <td className="p-3 text-center">
                        <button className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs shadow-md">
                          صرف وتوليد قيد المحاسبة
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
