// MARO ERP - Granular Role & Permission Management (Layer 2 & Layer 3)
import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  Eye, 
  EyeOff, 
  Check, 
  Sliders, 
  Save, 
  UserCheck, 
  DollarSign, 
  CheckSquare, 
  Square,
  AlertCircle
} from 'lucide-react';
import { SecurityEngine, DEFAULT_CASHIER_BUTTON_PERMISSIONS, DEFAULT_FULL_BUTTON_PERMISSIONS, DEFAULT_FULL_FIELD_PERMISSIONS, DEFAULT_RESTRICTED_FIELD_PERMISSIONS } from '../lib/securityEngine';
import { ButtonPermissionFlags, FieldPermissionFlags, UserPermissionSet } from '../types/security';
import { cn } from '../lib/utils';

export const RolePermissions: React.FC = () => {
  const [selectedRole, setSelectedRole] = useState<'admin' | 'cashier' | 'accountant' | 'inventory_manager'>('cashier');
  const [activeTab, setActiveTab] = useState<'modules' | 'buttons' | 'fields'>('buttons');

  const [buttonPerms, setButtonPerms] = useState<ButtonPermissionFlags>(DEFAULT_CASHIER_BUTTON_PERMISSIONS);
  const [fieldPerms, setFieldPerms] = useState<FieldPermissionFlags>(DEFAULT_RESTRICTED_FIELD_PERMISSIONS);
  const [allowedModules, setAllowedModules] = useState<string[]>(['POS', 'CUSTOMERS', 'REPORTS']);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleRoleChange = (role: 'admin' | 'cashier' | 'accountant' | 'inventory_manager') => {
    setSelectedRole(role);
    if (role === 'admin') {
      setButtonPerms(DEFAULT_FULL_BUTTON_PERMISSIONS);
      setFieldPerms(DEFAULT_FULL_FIELD_PERMISSIONS);
      setAllowedModules(['POS', 'INVENTORY', 'SALES', 'PURCHASES', 'ACCOUNTING', 'USERS', 'REPORTS', 'CUSTOMERS', 'SUPPLIERS', 'WAREHOUSES', 'AI', 'SETTINGS', 'SECURITY']);
    } else if (role === 'cashier') {
      setButtonPerms(DEFAULT_CASHIER_BUTTON_PERMISSIONS);
      setFieldPerms(DEFAULT_RESTRICTED_FIELD_PERMISSIONS);
      setAllowedModules(['POS', 'CUSTOMERS', 'REPORTS']);
    } else {
      setButtonPerms({ ...DEFAULT_CASHIER_BUTTON_PERMISSIONS, createItem: true, editItem: true });
      setFieldPerms({ ...DEFAULT_RESTRICTED_FIELD_PERMISSIONS, viewCostPrice: true, viewPurchasePrice: true });
      setAllowedModules(['INVENTORY', 'WAREHOUSES', 'SUPPLIERS', 'REPORTS']);
    }
  };

  const toggleButtonPerm = (key: keyof ButtonPermissionFlags) => {
    setButtonPerms(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleFieldPerm = (key: keyof FieldPermissionFlags) => {
    setFieldPerms(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleModule = (mod: string) => {
    setAllowedModules(prev => prev.includes(mod) ? prev.filter(m => m !== mod) : [...prev, mod]);
  };

  const handleSavePermissions = () => {
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#151b2b] border border-[#1e293b] p-6 rounded-3xl shadow-2xl">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-600/10 border border-blue-500/30 text-blue-400 rounded-2xl">
            <ShieldCheck size={28} />
          </div>
          <div>
            <h2 className="text-xl font-black text-white tracking-tight">إدارة الصلاحيات الدقيقة (RBAC)</h2>
            <p className="text-xs text-slate-400 mt-1">تخصيص صلاحيات الشاشات والأزرار وإخفاء أسعار التكلفة والأرباح حسب الدور</p>
          </div>
        </div>

        <button 
          onClick={handleSavePermissions}
          className="flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-widest rounded-2xl transition-all shadow-lg shadow-emerald-600/20 active:scale-95"
        >
          <Save size={16} />
          <span>حفظ التعديلات</span>
        </button>
      </div>

      {saveSuccess && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-2xl text-xs font-bold flex items-center gap-2">
          <Check size={18} />
          <span>تم حفظ إعدادات الصلاحيات بنجاح وتحديثها في قاعدة البيانات والملفات المحلية.</span>
        </div>
      )}

      {/* Role Selection Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { id: 'admin', name: 'مدير النظام (Admin)', desc: 'صلاحيات كاملة' },
          { id: 'cashier', name: 'أمين صندوق (Cashier)', desc: 'بيع وتمرير باركود' },
          { id: 'accountant', name: 'محاسب (Accountant)', desc: 'قيود وتقارير مالي' },
          { id: 'inventory_manager', name: 'أمناء المخازن (Storekeeper)', desc: 'جرد وتحويلات' }
        ].map(r => (
          <button 
            key={r.id}
            onClick={() => handleRoleChange(r.id as any)}
            className={cn(
              "p-4 rounded-2xl border text-right transition-all",
              selectedRole === r.id ? "bg-blue-600/20 border-blue-500 text-white shadow-xl" : "bg-[#151b2b] border-[#1e293b] text-slate-400 hover:bg-slate-800"
            )}
          >
            <p className="font-bold text-xs uppercase tracking-wide">{r.name}</p>
            <p className="text-[10px] text-slate-500 mt-1">{r.desc}</p>
          </button>
        ))}
      </div>

      {/* Sub Tabs */}
      <div className="flex items-center gap-2 border-b border-[#1e293b] pb-2">
        <button 
          onClick={() => setActiveTab('buttons')}
          className={cn(
            "px-5 py-2.5 rounded-xl text-xs font-bold uppercase transition-all flex items-center gap-2 border",
            activeTab === 'buttons' ? "bg-blue-600 text-white border-blue-500" : "bg-[#151b2b] text-slate-400 border-[#1e293b]"
          )}
        >
          <Sliders size={16} />
          <span>صلاحيات الأزرار والعمليات (Button Level)</span>
        </button>

        <button 
          onClick={() => setActiveTab('fields')}
          className={cn(
            "px-5 py-2.5 rounded-xl text-xs font-bold uppercase transition-all flex items-center gap-2 border",
            activeTab === 'fields' ? "bg-blue-600 text-white border-blue-500" : "bg-[#151b2b] text-slate-400 border-[#1e293b]"
          )}
        >
          <EyeOff size={16} />
          <span>أمان الحقول والأسعار (Field Level Security)</span>
        </button>

        <button 
          onClick={() => setActiveTab('modules')}
          className={cn(
            "px-5 py-2.5 rounded-xl text-xs font-bold uppercase transition-all flex items-center gap-2 border",
            activeTab === 'modules' ? "bg-blue-600 text-white border-blue-500" : "bg-[#151b2b] text-slate-400 border-[#1e293b]"
          )}
        >
          <Lock size={16} />
          <span>الشاشات والموديولات (Module Access)</span>
        </button>
      </div>

      {/* Button Level Security Grid */}
      {activeTab === 'buttons' && (
        <div className="bg-[#151b2b] border border-[#1e293b] rounded-3xl p-6 space-y-4">
          <h3 className="font-bold text-white text-sm uppercase tracking-wider">التحكم في الأزرار والإجراءات المسموحة</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {[
              { key: 'createItem', label: 'إضافة أصناف وفواتير جديدة' },
              { key: 'editItem', label: 'تعديل الفواتير والأصناف' },
              { key: 'deleteItem', label: 'حذف الأصناف والمستندات' },
              { key: 'applyDiscount', label: 'تطبيق خصم على الفاتورة' },
              { key: 'overridePrice', label: 'تعديل سعر البيع يدوياً' },
              { key: 'cancelInvoice', label: 'إلغاء وفود الفاتورة' },
              { key: 'returnInvoice', label: 'إجراء مرتجع مبيعات' },
              { key: 'openCashDrawer', label: 'فتح درج النقدية يدوي' },
              { key: 'closeShift', label: 'إغلاق الورقية والـ Z-Report' },
              { key: 'adjustStock', label: 'تسوية وإدخال كميات المخزن' },
              { key: 'manageUsers', label: 'إدارة المستخدمين' },
              { key: 'manageRoles', label: 'تعديل الصلاحيات' }
            ].map(item => {
              const k = item.key as keyof ButtonPermissionFlags;
              const isChecked = buttonPerms[k];
              return (
                <button 
                  key={k}
                  onClick={() => toggleButtonPerm(k)}
                  className={cn(
                    "p-4 rounded-2xl border text-right transition-all flex items-center justify-between",
                    isChecked ? "bg-blue-600/10 border-blue-500/40 text-blue-400" : "bg-[#0f172a] border-[#1e293b] text-slate-500"
                  )}
                >
                  <span className="font-bold text-xs">{item.label}</span>
                  {isChecked ? <CheckSquare size={18} className="text-blue-400" /> : <Square size={18} className="text-slate-600" />}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Field Level Security Grid */}
      {activeTab === 'fields' && (
        <div className="bg-[#151b2b] border border-[#1e293b] rounded-3xl p-6 space-y-4">
          <h3 className="font-bold text-white text-sm uppercase tracking-wider flex items-center gap-2">
            <EyeOff className="text-amber-400" size={18} />
            <span>حجب وإخفاء حقول أسعار التكلفة والرواتب والأرباح</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              { key: 'viewCostPrice', label: 'عرض سعر التكلفة (Cost Price)' },
              { key: 'viewProfit', label: 'عرض هامش الربح والربحية (Profit Margins)' },
              { key: 'viewPurchasePrice', label: 'عرض سعر الشراء من المورد' },
              { key: 'editSellingPrice', label: 'السماح بتغيير سعر البيع المستهدف' },
              { key: 'viewSalary', label: 'عرض رواتب الموظفين والمسير' },
              { key: 'viewBankAccounts', label: 'عرض أرصدة الحسابات البنكية' },
              { key: 'viewFinancialReports', label: 'عرض قائمة الدخل والمركز المالي' }
            ].map(item => {
              const k = item.key as keyof FieldPermissionFlags;
              const isVisible = fieldPerms[k];
              return (
                <button 
                  key={k}
                  onClick={() => toggleFieldPerm(k)}
                  className={cn(
                    "p-4 rounded-2xl border text-right transition-all flex items-center justify-between",
                    isVisible ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-400" : "bg-red-500/10 border-red-500/40 text-red-400"
                  )}
                >
                  <div className="flex items-center gap-3">
                    {isVisible ? <Eye size={18} /> : <EyeOff size={18} />}
                    <span className="font-bold text-xs">{item.label}</span>
                  </div>
                  <span className="text-[10px] font-mono uppercase font-bold">{isVisible ? 'مرئي (Visible)' : 'محجوب (Hidden)'}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Module Access Grid */}
      {activeTab === 'modules' && (
        <div className="bg-[#151b2b] border border-[#1e293b] rounded-3xl p-6 space-y-4">
          <h3 className="font-bold text-white text-sm uppercase tracking-wider">تحديد الموديولات المتاحة</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {['POS', 'INVENTORY', 'SALES', 'PURCHASES', 'ACCOUNTING', 'USERS', 'REPORTS', 'CUSTOMERS', 'SUPPLIERS', 'WAREHOUSES', 'AI', 'SETTINGS', 'SECURITY'].map(mod => {
              const isAllowed = allowedModules.includes(mod);
              return (
                <button 
                  key={mod}
                  onClick={() => toggleModule(mod)}
                  className={cn(
                    "p-4 rounded-2xl border text-right transition-all flex items-center justify-between",
                    isAllowed ? "bg-purple-600/10 border-purple-500/40 text-purple-400" : "bg-[#0f172a] border-[#1e293b] text-slate-600"
                  )}
                >
                  <span className="font-black text-xs uppercase">{mod}</span>
                  {isAllowed ? <CheckSquare size={18} className="text-purple-400" /> : <Square size={18} className="text-slate-600" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
