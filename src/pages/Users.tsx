/**
 * @file Users.tsx
 * @module واجهات وصفحات النظام (UI Pages)
 * @description ملف جزء من نظام MARO ERP. الوظيفة: Users.tsx.
 */
import React, { useEffect, useState } from 'react';
import { 
  Plus, 
  Search, 
  UserPlus, 
  Shield, 
  Mail, 
  MoreVertical, 
  Edit2, 
  Trash2, 
  User as UserIcon,
  X,
  Phone,
  Lock,
  Eye,
  EyeOff,
  KeyRound,
  MessageSquare,
  Smartphone,
  CheckCircle2,
  Send,
  AlertTriangle,
  UserCheck,
  UserX,
  Power,
  ToggleLeft,
  ToggleRight,
  Ban,
  CheckCircle
} from 'lucide-react';
import { MaroSyncEngine } from '../lib/maroSyncEngine';
import { cn } from '../lib/utils';
import { SecurityEngine, DEVELOPER_ACCOUNT_ID, DEVELOPER_EMAIL } from '../lib/securityEngine';
import { EmployeeAuthService } from '../services/employeeAuthService';
import { useAuth } from '../components/AuthProvider';
import { toast } from 'react-hot-toast';

export interface UserProfile {
  id: string;
  displayName: string;
  email: string;
  phone?: string;
  password?: string;
  pinCode?: string;
  role: 'admin' | 'accountant' | 'cashier';
  status: 'active' | 'inactive';
  department?: string;
  idCardCode?: string; // كارت ID الذكي
  branchId?: string;
  branchName?: string;
  warehouseId?: string;
  warehouseName?: string;
  safeId?: string;
  safeName?: string;
  lastPasswordReset?: string;
}

export const Users: React.FC = () => {
  const { user: currentAuthUser } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [selectedUserForReset, setSelectedUserForReset] = useState<UserProfile | null>(null);
  const [userToDelete, setUserToDelete] = useState<UserProfile | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const unsubscribe = MaroSyncEngine.subscribe<UserProfile>('users', (data) => {
      setUsers(data);
      setLoading(false);
    });

    // Seed initial users if empty
    const local = MaroSyncEngine.getLocalCollection<UserProfile>('users');
    if (local.length === 0) {
      const defaultUsers: UserProfile[] = [
        { 
          id: 'usr_1', 
          displayName: 'مدير النظام العام', 
          email: 'admin@maro-erp.local', 
          phone: '01011122233',
          password: '••••••••',
          role: 'admin', 
          status: 'active', 
          department: 'الإدارة العليا',
          branchName: 'الفرع الرئيسي',
          warehouseName: 'المستودع العام',
          safeName: 'الخزينة الرئيسية'
        },
        { 
          id: 'usr_2', 
          displayName: 'محمد المحاسب', 
          email: 'accountant@maro-erp.local', 
          phone: '01122233344',
          password: '••••••••',
          role: 'accountant', 
          status: 'active', 
          department: 'المالية والحسابات',
          branchName: 'الفرع الرئيسي',
          warehouseName: 'المستودع العام',
          safeName: 'الخزينة الرئيسية'
        },
        { 
          id: 'usr_3', 
          displayName: 'أحمد كاشير الوردية', 
          email: 'cashier@maro-erp.local', 
          phone: '01233344455',
          password: '••••••••',
          pinCode: '1234',
          role: 'cashier', 
          status: 'active', 
          department: 'المبيعات ونقاط البيع',
          branchName: 'الفرع الرئيسي',
          warehouseName: 'مخزن المعرض',
          safeName: 'درج كاشير 1'
        }
      ];
      defaultUsers.forEach(u => MaroSyncEngine.saveDocument('users', u, true));
    }

    return () => unsubscribe();
  }, []);

  // Determine if a user is protected from deletion
  const isProtectedUser = (targetUser: UserProfile): { isProtected: boolean; reason?: string } => {
    if (SecurityEngine.isDeveloperAccount(targetUser.id, targetUser.email)) {
      return { isProtected: true, reason: 'حساب مهندس النظام ومطور المنصة محمي كلياً ولا يمكن حذفه' };
    }
    if (targetUser.id === 'usr_1' || targetUser.email === 'admin@maro-erp.local') {
      return { isProtected: true, reason: 'حساب مدير النظام الرئيسي محمي لضمان استقرار المنصة' };
    }
    if (currentAuthUser && (currentAuthUser.id === targetUser.id || currentAuthUser.email === targetUser.email)) {
      return { isProtected: true, reason: 'لا يمكن حذف الحساب المسجل به حالياً' };
    }
    return { isProtected: false };
  };

  const filteredUsers = SecurityEngine.filterOutSystemDeveloper(users)
    .filter(u => {
      if (statusFilter === 'active') return u.status === 'active';
      if (statusFilter === 'inactive') return u.status === 'inactive';
      return true;
    })
    .filter(u => 
      (u.displayName || '').toLowerCase().includes((searchTerm || '').toLowerCase()) || 
      (u.email || '').toLowerCase().includes((searchTerm || '').toLowerCase()) ||
      (u.phone && u.phone.includes(searchTerm))
    );

  const inactiveUsersCount = users.filter(u => u.status === 'inactive' && !isProtectedUser(u).isProtected).length;

  const confirmDeleteUser = async () => {
    if (!userToDelete) return;
    const protection = isProtectedUser(userToDelete);
    if (protection.isProtected) {
      toast.error(protection.reason || 'لا يمكن حذف هذا المستخدم');
      setUserToDelete(null);
      return;
    }

    try {
      setIsDeleting(true);
      await MaroSyncEngine.deleteDocument('users', userToDelete.id);
      toast.success(`تم حذف المستخدم [${userToDelete.displayName}] بنجاح`);
      setUserToDelete(null);
    } catch (error) {
      console.error('Delete user failed:', error);
      toast.error('حدث خطأ أثناء حذف المستخدم');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteInactiveUsers = async () => {
    const inactiveUsers = users.filter(u => u.status === 'inactive' && !isProtectedUser(u).isProtected);
    if (inactiveUsers.length === 0) {
      toast.error('لا يوجد مستخدمون موقوفون قابلون للحذف حالياً');
      return;
    }

    if (window.confirm(`هل أنت متأكد من حذف جميع المستخدمين الموقوفين وعددهم (${inactiveUsers.length}) مستخدم نهائياً؟`)) {
      try {
        for (const u of inactiveUsers) {
          await MaroSyncEngine.deleteDocument('users', u.id);
        }
        toast.success(`تم حذف ${inactiveUsers.length} مستخدم موقوف بنجاح`);
      } catch (error) {
        console.error('Delete inactive users failed:', error);
        toast.error('حدث خطأ أثناء حذف المستخدمين الموقوفين');
      }
    }
  };

  const handleDelete = (targetUser: UserProfile) => {
    const protection = isProtectedUser(targetUser);
    if (protection.isProtected) {
      toast.error(protection.reason || 'لا يمكن حذف هذا المستخدم المحمي');
      return;
    }
    setUserToDelete(targetUser);
  };

  const handleToggleStatus = async (targetUser: UserProfile) => {
    const protection = isProtectedUser(targetUser);
    if (protection.isProtected && targetUser.status === 'active') {
      toast.error('لا يمكن إيقاف حساب النظام المحمي');
      return;
    }

    const newStatus = targetUser.status === 'active' ? 'inactive' : 'active';
    try {
      await MaroSyncEngine.saveDocument('users', { ...targetUser, status: newStatus }, false);
      toast.success(`تم تغيير حالة المستخدم إلى: ${newStatus === 'active' ? 'نشط ومفعل' : 'موقوف وغير نشط'}`);
    } catch (error) {
      toast.error('فشل تغيير حالة المستخدم');
    }
  };

  const handleSendResetCode = (targetUser: UserProfile, channel: 'whatsapp' | 'sms') => {
    if (!targetUser.phone) {
      toast.error(`الموظف [${targetUser.displayName}] غير مربوط برقم هاتف. يرجى تعديل بياناته أولاً وإضافة رقم هاتفه.`);
      return;
    }

    const res = EmployeeAuthService.sendPasswordResetOtp(targetUser.id, channel);
    if (res.success) {
      toast.success(res.message);
    } else {
      toast.error(res.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight">إدارة المستخدمين وصلاحيات الموظفين</h2>
          <p className="text-xs text-slate-400 mt-1">
            تسجيل بيانات الموظفين، كلمات المرور، التحكم في الحسابات النشطة والموقوفة وحذف المستخدمين غير النشطين.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 sm:w-64 max-w-md">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input 
              type="text" 
              placeholder="البحث بالاسم، البريد، أو رقم الهاتف..." 
              className="w-full pr-10 pl-4 py-2.5 bg-[#151b2b] border border-[#1e293b] rounded-xl text-white focus:outline-none focus:border-blue-500 transition-all placeholder:text-slate-600 text-xs"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Quick Filter: All / Active / Inactive */}
          <div className="flex items-center bg-[#151b2b] p-1 border border-[#1e293b] rounded-2xl">
            <button
              onClick={() => setStatusFilter('all')}
              className={cn(
                "px-3 py-1.5 rounded-xl text-xs font-bold transition-all",
                statusFilter === 'all' ? "bg-blue-600 text-white shadow" : "text-slate-400 hover:text-white"
              )}
            >
              الكل ({users.length})
            </button>
            <button
              onClick={() => setStatusFilter('active')}
              className={cn(
                "px-3 py-1.5 rounded-xl text-xs font-bold transition-all",
                statusFilter === 'active' ? "bg-emerald-600 text-white shadow" : "text-slate-400 hover:text-white"
              )}
            >
              النشطين ({users.filter(u => u.status === 'active').length})
            </button>
            <button
              onClick={() => setStatusFilter('inactive')}
              className={cn(
                "px-3 py-1.5 rounded-xl text-xs font-bold transition-all",
                statusFilter === 'inactive' ? "bg-red-600 text-white shadow" : "text-slate-400 hover:text-white"
              )}
            >
              الموقوفين ({users.filter(u => u.status === 'inactive').length})
            </button>
          </div>

          {/* Delete All Inactive Users Button */}
          {inactiveUsersCount > 0 && (
            <button
              onClick={handleDeleteInactiveUsers}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-2xl transition-all font-bold text-xs shadow-sm active:scale-95"
              title="حذف كافة المستخدمين الموقوفين بنقرة واحدة"
            >
              <Trash2 size={15} />
              <span>حذف الموقوفين ({inactiveUsersCount})</span>
            </button>
          )}

          <button 
            onClick={() => { setEditingUser(null); setIsModalOpen(true); }}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-2xl hover:bg-blue-500 transition-all font-bold shadow-lg shadow-blue-600/20 active:scale-95 text-xs uppercase tracking-widest"
          >
            <UserPlus size={18} />
            <span>إضافة مستخدم جديد</span>
          </button>
        </div>
      </div>

      {/* Master Developer Protected Account Badge */}
      <div className="bg-gradient-to-r from-[#0f172a] via-[#151b2b] to-[#0b0f1a] rounded-3xl border border-purple-500/30 p-5 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-r from-purple-500 via-pink-500 to-emerald-500"></div>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/20 text-purple-400 border border-purple-500/40 flex items-center justify-center shadow-lg shadow-purple-500/10">
              <Shield size={24} />
            </div>
            <div className="text-right">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-black text-white">حساب مبرمج ومهندس النظام (System Architect & Lead Developer)</h3>
                <span className="px-2.5 py-0.5 bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded-full text-[10px] font-bold font-mono">
                  ROOT IMMUTABLE
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                حساب محمي غير قابل للحذف أو التعديل من المستخدمين العاديين، مربوط بالتوثيق الثنائي المشفر.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="px-3.5 py-2 bg-[#0b0f1a] border border-[#1e293b] rounded-2xl flex items-center gap-2">
              <Mail size={14} className="text-slate-400" />
              <span className="text-xs font-mono font-bold text-slate-300">alkootsh@gmail.com</span>
            </div>

            <div className="px-3.5 py-2 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center gap-2">
              <Smartphone size={14} className="text-emerald-400" />
              <span className="text-xs font-mono font-bold text-emerald-300" dir="ltr">01050557853</span>
              <span className="px-1.5 py-0.5 bg-emerald-500/20 text-emerald-300 rounded text-[9px] font-bold">2FA Active</span>
            </div>

            <a 
              href="https://wa.me/201050557853" 
              target="_blank" 
              rel="noreferrer"
              className="px-4 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 rounded-2xl text-xs font-bold flex items-center gap-1.5 transition-all"
            >
              <MessageSquare size={14} />
              <span>واتساب المبرمج</span>
            </a>
          </div>
        </div>
      </div>

      <div className="bg-[#151b2b] rounded-3xl border border-[#1e293b] shadow-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead className="bg-[#0f172a]/50 text-slate-500 text-[10px] font-bold uppercase tracking-widest">
              <tr>
                <th className="px-6 py-5">الموظف / المستخدم</th>
                <th className="px-6 py-5">البريد الإلكتروني</th>
                <th className="px-6 py-5">رقم الهاتف المربوط (2FA)</th>
                <th className="px-6 py-5">كارت ID / PIN</th>
                <th className="px-6 py-5">الفرع والمخزن والخزينة</th>
                <th className="px-6 py-5">الدور والصلاحية</th>
                <th className="px-6 py-5">الحالة</th>
                <th className="px-6 py-5 text-center">إجراءات وكلمة المرور</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e293b]">
              {loading ? (
                <tr><td colSpan={8} className="px-8 py-16 text-center text-slate-600 font-medium">جاري التحميل...</td></tr>
              ) : filteredUsers.length === 0 ? (
                <tr><td colSpan={8} className="px-8 py-16 text-center text-slate-600 font-medium">لا يوجد موظفون أو مستخدمون مسجلون</td></tr>
              ) : filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-slate-800/30 transition-colors group">
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-4 justify-end">
                      <div className="text-right">
                        <p className="font-bold text-white text-xs">{user.displayName}</p>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">ID: {user.id.slice(0, 8)}</p>
                      </div>
                      <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center text-slate-500 border border-[#1e293b] group-hover:border-blue-500/50 transition-colors">
                        <UserIcon size={20} />
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-slate-400 font-medium text-xs">{user.email}</td>
                  <td className="px-6 py-5">
                    {user.phone ? (
                      <div className="flex items-center gap-1.5 text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20 w-fit">
                        <Smartphone size={13} />
                        <span className="font-mono text-xs font-bold" dir="ltr">{user.phone}</span>
                      </div>
                    ) : (
                      <span className="text-amber-400/80 bg-amber-500/10 px-2 py-0.5 rounded text-[10px] font-bold border border-amber-500/20">
                        ⚠️ غير مربوط بهاتف
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-5">
                    <div className="space-y-1">
                      {user.idCardCode && (
                        <span className="px-2 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-md text-[10px] font-mono font-bold block w-fit">
                          💳 {user.idCardCode}
                        </span>
                      )}
                      {user.pinCode && (
                        <span className="px-2 py-0.5 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded-md text-[10px] font-mono font-bold block w-fit">
                          🔢 PIN: {user.pinCode}
                        </span>
                      )}
                      {!user.idCardCode && !user.pinCode && (
                        <span className="text-slate-600 text-xs font-mono">-</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-5 text-xs text-slate-300">
                    <div className="space-y-0.5 text-[11px]">
                      <div><span className="text-slate-500">الفرع:</span> <span className="font-bold text-white">{user.branchName || 'الفرع الرئيسي'}</span></div>
                      <div><span className="text-slate-500">المخزن:</span> <span className="font-bold text-blue-400">{user.warehouseName || 'المستودع العام'}</span></div>
                      <div><span className="text-slate-500">الخزينة:</span> <span className="font-bold text-emerald-400">{user.safeName || 'الخزينة الرئيسية'}</span></div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className={cn(
                      "px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border",
                      user.role === 'admin' ? "bg-purple-500/10 text-purple-400 border-purple-500/20" : user.role === 'cashier' ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-blue-500/10 text-blue-400 border-blue-500/20"
                    )}>
                      {user.role === 'admin' ? 'مدير النظام' : user.role === 'cashier' ? 'كاشير مبيعات' : 'محاسب عام'}
                    </span>
                  </td>
                  <td className="px-6 py-5">
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(user)}
                      title={user.status === 'active' ? 'انقر لتعطيل وإيقاف الحساب' : 'انقر لتفعيل وتنشيط الحساب'}
                      className={cn(
                        "px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider border flex items-center gap-1.5 transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-sm",
                        user.status === 'active' 
                          ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/25" 
                          : "bg-red-500/15 text-red-400 border-red-500/30 hover:bg-red-500/25"
                      )}
                    >
                      {user.status === 'active' ? (
                        <>
                          <UserCheck size={14} className="text-emerald-400" />
                          <span>نشط ومفعل</span>
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                        </>
                      ) : (
                        <>
                          <UserX size={14} className="text-red-400" />
                          <span>موقوف ومُعطل</span>
                          <span className="w-2 h-2 rounded-full bg-red-400"></span>
                        </>
                      )}
                    </button>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-1.5 justify-center">
                      {/* Quick Toggle Status Button (تفعيل / إيقاف) */}
                      <button 
                        type="button"
                        title={user.status === 'active' ? "إيقاف الحساب وتعطيله مؤقتاً" : "تفعيل الحساب وتنشيط الدخول"}
                        onClick={() => handleToggleStatus(user)}
                        className={cn(
                          "p-2 rounded-xl transition-all border font-bold text-xs flex items-center gap-1 cursor-pointer",
                          user.status === 'active'
                            ? "bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border-amber-500/30"
                            : "bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                        )}
                      >
                        <Power size={14} />
                        <span className="text-[10px] hidden md:inline">{user.status === 'active' ? 'إيقاف' : 'تفعيل'}</span>
                      </button>

                      {/* Send Password reset via WhatsApp */}
                      <button 
                        title="إرسال كود استعادة كلمة المرور عبر الواتساب"
                        onClick={() => handleSendResetCode(user, 'whatsapp')}
                        className="p-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-xl transition-colors border border-emerald-500/20 text-[11px] flex items-center gap-1 font-bold"
                      >
                        <MessageSquare size={13} />
                        <span className="hidden sm:inline">واتساب</span>
                      </button>

                      {/* Send Password reset via SMS */}
                      <button 
                        title="إرسال كود استعادة كلمة المرور عبر SMS"
                        onClick={() => handleSendResetCode(user, 'sms')}
                        className="p-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-xl transition-colors border border-blue-500/20 text-[11px] flex items-center gap-1 font-bold"
                      >
                        <Send size={13} />
                        <span className="hidden sm:inline">SMS</span>
                      </button>

                      {/* Edit */}
                      <button 
                        title="تعديل بيانات وصلاحيات وكلمة مرور الموظف"
                        onClick={() => { setEditingUser(user); setIsModalOpen(true); }}
                        className="p-2 hover:bg-slate-700/50 text-slate-300 rounded-xl transition-colors border border-[#1e293b]"
                      >
                        <Edit2 size={15} />
                      </button>

                      {/* Delete */}
                      {(() => {
                        const protection = isProtectedUser(user);
                        return (
                          <button 
                            type="button"
                            title={protection.isProtected ? protection.reason : "حذف المستخدم نهائياً"}
                            disabled={protection.isProtected}
                            onClick={() => handleDelete(user)}
                            className={cn(
                              "p-2 rounded-xl transition-all border",
                              protection.isProtected 
                                ? "opacity-30 cursor-not-allowed bg-slate-800/40 text-slate-500 border-slate-700/50 hover:bg-slate-800/40" 
                                : "hover:bg-red-500/10 text-red-400 border-red-500/20 hover:scale-105 active:scale-95 cursor-pointer"
                            )}
                          >
                            <Trash2 size={15} />
                          </button>
                        );
                      })()}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete User Confirmation Modal */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#151b2b] border border-[#1e293b] w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-5 text-right relative">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center shrink-0">
                <AlertTriangle size={24} />
              </div>
              <div>
                <h3 className="text-base font-black text-white">تأكيد حذف المستخدم نهائياً</h3>
                <p className="text-xs text-slate-400 mt-0.5">هذا الإجراء لا يمكن التراجع عنه وسيحذف كافة صلاحيات الدخول.</p>
              </div>
            </div>

            <div className="p-4 bg-[#0f172a] rounded-2xl border border-[#1e293b] space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">اسم الموظف:</span>
                <span className="font-bold text-white">{userToDelete.displayName}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">البريد الإلكتروني:</span>
                <span className="font-mono text-slate-300">{userToDelete.email}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">الدور الوظيفي:</span>
                <span className="font-bold text-blue-400">
                  {userToDelete.role === 'admin' ? 'مدير النظام' : userToDelete.role === 'cashier' ? 'كاشير مبيعات' : 'محاسب عام'}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">الحالة الحالية:</span>
                <span className={userToDelete.status === 'active' ? "text-emerald-400 font-bold" : "text-red-400 font-bold"}>
                  {userToDelete.status === 'active' ? 'نشط' : 'موقوف'}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setUserToDelete(null)}
                className="px-5 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-bold hover:bg-slate-700 transition-all text-xs"
              >
                إلغاء
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={confirmDeleteUser}
                className="px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold transition-all shadow-lg shadow-red-600/20 text-xs flex items-center gap-1.5 active:scale-95 disabled:opacity-50"
              >
                <Trash2 size={15} />
                <span>{isDeleting ? 'جاري الحذف...' : 'نعم، احذف المستخدم'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {isModalOpen && (
        <UserModal 
          user={editingUser} 
          users={users}
          isProtected={editingUser ? isProtectedUser(editingUser) : { isProtected: false }}
          onDelete={(user) => {
            setIsModalOpen(false);
            handleDelete(user);
          }}
          onClose={() => setIsModalOpen(false)} 
        />
      )}
    </div>
  );
};

const UserModal: React.FC<{ 
  user: UserProfile | null; 
  users: UserProfile[]; 
  isProtected: { isProtected: boolean; reason?: string };
  onDelete: (user: UserProfile) => void;
  onClose: () => void; 
}> = ({ user, users, isProtected, onDelete, onClose }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    displayName: user?.displayName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    password: user?.password || '123456',
    pinCode: user?.pinCode || '',
    role: user?.role || 'cashier',
    status: user?.status || 'active',
    department: user?.department || '',
    idCardCode: user?.idCardCode || '',
    branchName: user?.branchName || 'الفرع الرئيسي',
    warehouseName: user?.warehouseName || 'المستودع العام',
    safeName: user?.safeName || 'الخزينة الرئيسية',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const duplicateEmail = users.find(u => u.email && u.email.toLowerCase() === (formData.email || '').toLowerCase() && u.id !== user?.id);
      if (duplicateEmail) {
        toast.error('البريد الإلكتروني مستخدم بالفعل لموظف آخر');
        return;
      }
      
      const duplicateName = users.find(u => u.displayName && u.displayName.toLowerCase() === (formData.displayName || '').toLowerCase() && u.id !== user?.id);
      if (duplicateName) {
        toast.error('اسم المستخدم موجود بالفعل');
        return;
      }

      if (!formData.phone || formData.phone.trim().length < 8) {
        toast.error('يرجى إدخال رقم هاتف صحيح للموظف لربط الحساب وتأكيد كلمة المرور');
        return;
      }

      if (user) {
        await MaroSyncEngine.saveDocument('users', { ...user, ...formData }, false);
        toast.success(`تم تحديث بيانات وصلاحيات الموظف [${formData.displayName}] بنجاح`);
      } else {
        const newId = `usr_${Date.now()}`;
        await MaroSyncEngine.saveDocument('users', { id: newId, ...formData }, true);
        toast.success(`تم تسجيل الموظف الجديد [${formData.displayName}] وربط رقم هاتفه بنجاح`);
      }
      onClose();
    } catch (error) {
      console.error('Save user failed:', error);
      toast.error('حدث خطأ أثناء حفظ بيانات الموظف');
    }
  };

  // Handle Escape key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div 
      className="fixed inset-0 bg-[#0b0f1a]/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" 
      dir="rtl"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="bg-[#151b2b] w-full max-w-xl rounded-3xl border border-[#1e293b] shadow-2xl overflow-hidden relative max-h-[92vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 via-emerald-500 to-purple-600"></div>
        <div className="p-6 border-b border-[#1e293b] flex items-center justify-between bg-[#0f172a]/50">
          <div>
            <h3 className="font-black text-lg text-white tracking-tight">
              {user ? 'تعديل بيانات وصلاحيات وكلمة مرور الموظف' : 'تسجيل موظف جديد وربطه برقم الهاتف'}
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              ربط الحساب برقم هاتف الموظف لتأكيد واستعادة كلمة المرور عبر OTP
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-xl text-slate-500 transition-colors cursor-pointer" title="إغلاق النافذة (Esc)">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Personal & Account Info */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-300 mb-1">الاسم الكامل للموظف *</label>
              <input 
                type="text" 
                required
                value={formData.displayName}
                onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                className="w-full bg-[#0b0f1a] border border-[#334155] rounded-xl px-3.5 py-2.5 text-white text-xs font-bold outline-none focus:border-blue-500"
                placeholder="أحمد محمد سالم"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-300 mb-1">اسم الدخول / البريد الإلكتروني *</label>
              <input 
                type="text" 
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full bg-[#0b0f1a] border border-[#334155] rounded-xl px-3.5 py-2.5 text-white text-xs font-bold outline-none focus:border-blue-500"
                placeholder="مثال: ahmed أو ahmed@maro-erp.com"
              />
            </div>
          </div>

          {/* Linked Phone Number and Password (CRITICAL REQUIREMENT) */}
          <div className="p-4 bg-emerald-950/20 border border-emerald-500/30 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                <Smartphone size={16} />
                <span>ربط الحساب برقم الهاتف وكلمة المرور (2FA & Password Reset)</span>
              </span>
              <span className="text-[10px] text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded-md font-bold">
                🔒 تأكيد عبر OTP
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-emerald-300 mb-1">
                  رقم الهاتف المحمول المربوط (WhatsApp / SMS) *
                </label>
                <div className="relative">
                  <Phone className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                  <input 
                    type="tel" 
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full bg-[#0b0f1a] border border-emerald-500/40 rounded-xl pr-9 pl-3 py-2.5 text-white font-mono text-xs font-bold outline-none focus:border-emerald-400 text-left"
                    placeholder="01050557853"
                    dir="ltr"
                  />
                </div>
                <span className="text-[9px] text-slate-400 mt-1 block">يُستخدم لاستلام كود OTP لتأكيد أو استعادة كلمة المرور</span>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-emerald-300 mb-1">
                  كلمة مرور الحساب (Password) *
                </label>
                <div className="relative">
                  <Lock className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                  <input 
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full bg-[#0b0f1a] border border-emerald-500/40 rounded-xl pr-9 pl-10 py-2.5 text-white text-xs font-bold outline-none focus:border-emerald-400"
                    placeholder="••••••••"
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
                <span className="text-[9px] text-slate-400 mt-1 block">كلمة السر المعتمدة لتسجيل الدخول للنظام</span>
              </div>
            </div>
          </div>

          {/* Status, Role & Secondary Credentials */}
          <div className="p-4 bg-[#0f172a] rounded-2xl border border-[#1e293b] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Power size={15} className={formData.status === 'active' ? "text-emerald-400" : "text-red-400"} />
                <span>حالة الحساب (تفعيل / إيقاف) والصلاحية</span>
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, status: 'active' })}
                  className={cn(
                    "px-3 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer",
                    formData.status === 'active'
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm"
                      : "text-slate-400 hover:text-white bg-slate-800/50"
                  )}
                >
                  <UserCheck size={13} />
                  <span>نشط ومفعل</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, status: 'inactive' })}
                  className={cn(
                    "px-3 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer",
                    formData.status === 'inactive'
                      ? "bg-red-500/20 text-red-300 border border-red-500/40 shadow-sm"
                      : "text-slate-400 hover:text-white bg-slate-800/50"
                  )}
                >
                  <UserX size={13} />
                  <span>موقوف ومُعطل</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 pt-1">
              <div>
                <label className="block text-[10px] font-bold text-slate-300 mb-1">الصلاحية والدور (Role)</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                  className="w-full bg-[#0b0f1a] border border-[#334155] rounded-xl px-3 py-2.5 text-white text-xs font-bold"
                >
                  <option value="admin">مدير النظام والفرع (Admin)</option>
                  <option value="accountant">محاسب عام (Accountant)</option>
                  <option value="cashier">كاشير مبيعات (POS Cashier)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-purple-400 mb-1">كود الـ PIN السريع (للكاشير)</label>
                <input 
                  type="text" 
                  maxLength={6}
                  value={formData.pinCode}
                  onChange={(e) => setFormData({ ...formData, pinCode: e.target.value })}
                  className="w-full bg-[#0b0f1a] border border-purple-500/30 rounded-xl px-3 py-2.5 text-purple-300 font-mono text-xs font-bold"
                  placeholder="1234"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-amber-400 mb-1">كارت ID الذكي (NFC/RFID)</label>
                <input 
                  type="text" 
                  value={formData.idCardCode}
                  onChange={(e) => setFormData({ ...formData, idCardCode: e.target.value })}
                  className="w-full bg-[#0b0f1a] border border-amber-500/30 rounded-xl px-3 py-2.5 text-amber-300 font-mono text-xs font-bold"
                  placeholder="CARD-1003"
                />
              </div>
            </div>
          </div>

          {/* Linking User to Branch, Warehouse, Safe */}
          <div className="p-4 bg-[#0f172a] rounded-2xl border border-blue-500/20 space-y-3">
            <p className="text-xs font-bold text-blue-400 flex items-center gap-1.5">
              <span>🏢 ربط الموظف بالفروع والمخازن والخزن</span>
            </p>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1">الفرع المربوط</label>
                <select
                  value={formData.branchName}
                  onChange={(e) => setFormData({ ...formData, branchName: e.target.value })}
                  className="w-full bg-[#151b2b] border border-[#334155] rounded-xl px-2.5 py-2 text-white text-[11px] font-bold"
                >
                  <option value="الفرع الرئيسي">الفرع الرئيسي</option>
                  <option value="فرع الرياض - التخصصي">فرع الرياض - التخصصي</option>
                  <option value="فرع جدة - الكورنيش">فرع جدة - الكورنيش</option>
                  <option value="فرع الدمام - الساحل">فرع الدمام - الساحل</option>
                  <option value="فرع القاهرة - النصر">فرع القاهرة - النصر</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1">المخزن المسموح</label>
                <select
                  value={formData.warehouseName}
                  onChange={(e) => setFormData({ ...formData, warehouseName: e.target.value })}
                  className="w-full bg-[#151b2b] border border-[#334155] rounded-xl px-2.5 py-2 text-white text-[11px] font-bold"
                >
                  <option value="المستودع العام">المستودع العام</option>
                  <option value="مخزن المواد الخام">مخزن المواد الخام</option>
                  <option value="مخزن المعرض">مخزن المعرض</option>
                  <option value="مخزن التبريد">مخزن التبريد</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1">الخزينة / الصندوق</label>
                <select
                  value={formData.safeName}
                  onChange={(e) => setFormData({ ...formData, safeName: e.target.value })}
                  className="w-full bg-[#151b2b] border border-[#334155] rounded-xl px-2.5 py-2 text-white text-[11px] font-bold"
                >
                  <option value="الخزينة الرئيسية">الخزينة الرئيسية</option>
                  <option value="درج كاشير 1">درج كاشير 1</option>
                  <option value="درج كاشير 2">درج كاشير 2</option>
                  <option value="خزينة المبيعات اليومية">خزينة المبيعات اليومية</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 pt-3 border-t border-[#1e293b]">
            <div>
              {user && (
                <button
                  type="button"
                  disabled={isProtected.isProtected}
                  title={isProtected.isProtected ? isProtected.reason : "حذف المستخدم نهائياً"}
                  onClick={() => onDelete(user)}
                  className={cn(
                    "px-4 py-2.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all",
                    isProtected.isProtected
                      ? "opacity-30 cursor-not-allowed bg-slate-800/40 text-slate-500 border-slate-700/50"
                      : "bg-red-500/10 hover:bg-red-500/20 text-red-400 border-red-500/30 active:scale-95"
                  )}
                >
                  <Trash2 size={15} />
                  <span>حذف المستخدم</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-bold hover:bg-slate-700 transition-all text-xs"
              >
                إلغاء
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-emerald-600 text-white font-bold hover:from-blue-500 hover:to-emerald-500 transition-all shadow-lg shadow-blue-600/20 text-xs flex items-center gap-1.5"
              >
                <CheckCircle2 size={16} />
                <span>حفظ الموظف وتأكيد الربط</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

