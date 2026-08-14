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
  X
} from 'lucide-react';
import { MaroSyncEngine } from '../lib/maroSyncEngine';
import { cn } from '../lib/utils';
import { SecurityEngine } from '../lib/securityEngine';

interface UserProfile {
  id: string;
  displayName: string;
  email: string;
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
}

export const Users: React.FC = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);

  useEffect(() => {
    const unsubscribe = MaroSyncEngine.subscribe<UserProfile>('users', (data) => {
      setUsers(data);
      setLoading(false);
    });

    // Seed initial users if empty
    const local = MaroSyncEngine.getLocalCollection<UserProfile>('users');
    if (local.length === 0) {
      const defaultUsers: UserProfile[] = [
        { id: 'usr_1', displayName: 'مدير النظام العام', email: 'admin@maro-erp.local', role: 'admin', status: 'active', department: 'الإدارة العليا' },
        { id: 'usr_2', displayName: 'محمد المحاسب', email: 'accountant@maro-erp.local', role: 'accountant', status: 'active', department: 'المالية والحسابات' }
      ];
      defaultUsers.forEach(u => MaroSyncEngine.saveDocument('users', u, true));
    }

    return () => unsubscribe();
  }, []);

  const filteredUsers = SecurityEngine.filterOutSystemDeveloper(users).filter(u => 
    u.displayName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = async (id: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذا المستخدم؟')) {
      try {
        await MaroSyncEngine.deleteDocument('users', id);
      } catch (error) {
        console.error('Delete user failed:', error);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h2 className="text-2xl font-black text-white tracking-tight">إدارة المستخدمين</h2>
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input 
              type="text" 
              placeholder="البحث عن مستخدم..." 
              className="w-full pr-10 pl-4 py-2.5 bg-[#151b2b] border border-[#1e293b] rounded-xl text-white focus:outline-none focus:border-blue-500 transition-all placeholder:text-slate-600"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button 
            onClick={() => { setEditingUser(null); setIsModalOpen(true); }}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-2xl hover:bg-blue-500 transition-all font-bold shadow-lg shadow-blue-600/20 active:scale-95 text-xs uppercase tracking-widest"
          >
            <UserPlus size={18} />
            <span>إضافة مستخدم</span>
          </button>
        </div>
      </div>

      <div className="bg-[#151b2b] rounded-3xl border border-[#1e293b] shadow-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead className="bg-[#0f172a]/50 text-slate-500 text-[10px] font-bold uppercase tracking-widest">
              <tr>
                <th className="px-6 py-5">المستخدم</th>
                <th className="px-6 py-5">البريد الإلكتروني</th>
                <th className="px-6 py-5">كارت ID الذكي</th>
                <th className="px-6 py-5">الفرع والمخزن والخزينة</th>
                <th className="px-6 py-5">الدور</th>
                <th className="px-6 py-5">الحالة</th>
                <th className="px-6 py-5"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e293b]">
              {loading ? (
                <tr><td colSpan={7} className="px-8 py-16 text-center text-slate-600 font-medium">جاري التحميل...</td></tr>
              ) : filteredUsers.length === 0 ? (
                <tr><td colSpan={7} className="px-8 py-16 text-center text-slate-600 font-medium">لا يوجد مستخدمون حالياً</td></tr>
              ) : filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-slate-800/30 transition-colors group">
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-4 justify-end">
                      <div className="text-right">
                        <p className="font-bold text-white">{user.displayName}</p>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">ID: {user.id.slice(0, 8)}</p>
                      </div>
                      <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center text-slate-500 border border-[#1e293b] group-hover:border-blue-500/50 transition-colors">
                        <UserIcon size={20} />
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-slate-400 font-medium text-xs">{user.email}</td>
                  <td className="px-6 py-5">
                    {user.idCardCode ? (
                      <span className="px-2.5 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-lg text-xs font-mono font-bold">
                        💳 {user.idCardCode}
                      </span>
                    ) : (
                      <span className="text-slate-600 text-xs font-mono">-</span>
                    )}
                  </td>
                  <td className="px-6 py-5 text-xs text-slate-300">
                    <div className="space-y-0.5">
                      <div><span className="text-slate-500">الفرع:</span> <span className="font-bold text-white">{user.branchName || 'الفرع الرئيسي'}</span></div>
                      <div><span className="text-slate-500">المخزن:</span> <span className="font-bold text-blue-400">{user.warehouseName || 'المستودع العام'}</span></div>
                      <div><span className="text-slate-500">الخزينة:</span> <span className="font-bold text-emerald-400">{user.safeName || 'الخزينة الرئيسية'}</span></div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className={cn(
                      "px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border",
                      user.role === 'admin' ? "bg-purple-500/10 text-purple-500 border-purple-500/20" : user.role === 'cashier' ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-blue-500/10 text-blue-500 border-blue-500/20"
                    )}>
                      {user.role === 'admin' ? 'مدير النظام' : user.role === 'cashier' ? 'كاشير مبيعات' : 'محاسب'}
                    </span>
                  </td>
                  <td className="px-6 py-5">
                    <span className={cn(
                      "px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border",
                      user.status === 'active' ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : "bg-red-500/10 text-red-500 border-red-500/20"
                    )}>
                      {user.status === 'active' ? 'نشط' : 'غير نشط'}
                    </span>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2 justify-end">
                      <button 
                        onClick={() => { setEditingUser(user); setIsModalOpen(true); }}
                        className="p-2.5 hover:bg-blue-500/10 text-blue-400 rounded-xl transition-colors"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        onClick={() => handleDelete(user.id)}
                        className="p-2.5 hover:bg-red-500/10 text-red-400 rounded-xl transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <UserModal 
          user={editingUser} 
          users={users}
          onClose={() => setIsModalOpen(false)} 
        />
      )}
    </div>
  );
};

const UserModal: React.FC<{ user: UserProfile | null, users: UserProfile[], onClose: () => void }> = ({ user, users, onClose }) => {
  const [formData, setFormData] = useState({
    displayName: user?.displayName || '',
    email: user?.email || '',
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
      const duplicateEmail = users.find(u => u.email.toLowerCase() === formData.email.toLowerCase() && u.id !== user?.id);
      if (duplicateEmail) {
        alert('البريد الإلكتروني مستخدم بالفعل');
        return;
      }
      
      const duplicateName = users.find(u => u.displayName.toLowerCase() === formData.displayName.toLowerCase() && u.id !== user?.id);
      if (duplicateName) {
        alert('اسم المستخدم موجود بالفعل');
        return;
      }

      if (user) {
        await MaroSyncEngine.saveDocument('users', { ...user, ...formData }, false);
      } else {
        const newId = `usr_${Date.now()}`;
        await MaroSyncEngine.saveDocument('users', { id: newId, ...formData }, true);
      }
      onClose();
    } catch (error) {
      console.error('Save user failed:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-[#0b0f1a]/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#151b2b] w-full max-w-lg rounded-3xl border border-[#1e293b] shadow-2xl overflow-hidden relative max-h-[90vh] overflow-y-auto">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 to-purple-600"></div>
        <div className="p-6 border-b border-[#1e293b] flex items-center justify-between bg-[#0f172a]/50">
          <h3 className="font-black text-xl text-white tracking-tight">
            {user ? 'تعديل بيانات وصلاحيات المستخدم' : 'إضافة مستخدم جديد'}
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-xl text-slate-500 transition-colors">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">الاسم الكامل *</label>
              <input 
                type="text" 
                required
                value={formData.displayName}
                onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                className="w-full bg-[#0b0f1a] border border-[#334155] rounded-xl px-3 py-2.5 text-white text-xs font-bold"
                placeholder="محمد أحمد"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">البريد الإلكتروني *</label>
              <input 
                type="email" 
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full bg-[#0b0f1a] border border-[#334155] rounded-xl px-3 py-2.5 text-white text-xs font-bold"
                placeholder="user@maro-erp.local"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-amber-400 uppercase tracking-widest mb-1">💳 كارت ID الدخول الذكي (NFC/RFID)</label>
              <input 
                type="text" 
                value={formData.idCardCode}
                onChange={(e) => setFormData({ ...formData, idCardCode: e.target.value })}
                className="w-full bg-[#0b0f1a] border border-amber-500/30 rounded-xl px-3 py-2.5 text-amber-300 text-xs font-mono font-bold"
                placeholder="مثال: CARD-1002"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">الدور الوظيفي (Role)</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                className="w-full bg-[#0b0f1a] border border-[#334155] rounded-xl px-3 py-2.5 text-white text-xs font-bold"
              >
                <option value="admin">مدير النظام (Admin)</option>
                <option value="accountant">محاسب عام (Accountant)</option>
                <option value="cashier">كاشير مبيعات (POS Cashier)</option>
              </select>
            </div>
          </div>

          {/* Linking User to Branch, Warehouse, Safe */}
          <div className="p-4 bg-[#0f172a] rounded-2xl border border-blue-500/20 space-y-3">
            <p className="text-xs font-bold text-blue-400 flex items-center gap-1.5">
              <span>🏢 ربط المستخدم بالفروع والمخازن والخزن</span>
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

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#1e293b]">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-bold hover:bg-slate-700 transition-all text-xs"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-500 transition-all shadow-lg shadow-blue-600/20 text-xs"
            >
              حفظ المستخدم والتخصيصات
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
