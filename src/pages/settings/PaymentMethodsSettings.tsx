import React, { useState, useEffect } from 'react';
import { 
  CreditCard, 
  Plus, 
  Trash2, 
  Edit2, 
  Check, 
  X, 
  DollarSign, 
  Wallet, 
  Building2, 
  Layers, 
  ToggleLeft, 
  ToggleRight,
  Shield,
  Smartphone
} from 'lucide-react';
import { MaroSyncEngine } from '../../lib/maroSyncEngine';
import { cn } from '../../lib/utils';
import { toast } from 'react-hot-toast';

export interface PaymentMethodConfig {
  id: string;
  code: string;
  nameAr: string;
  nameEn: string;
  type: 'cash' | 'card' | 'credit' | 'partial' | 'digital_wallet' | 'bnpl';
  isActive: boolean;
  feePercentage: number;
  accountCode: string;
  accountName: string;
  allowInPOS: boolean;
  allowInInvoices: boolean;
  iconName?: string;
}

const DEFAULT_METHODS: PaymentMethodConfig[] = [
  { id: 'pm_cash', code: 'CASH', nameAr: 'كاش نقدي (Cash)', nameEn: 'Cash', type: 'cash', isActive: true, feePercentage: 0, accountCode: '110101', accountName: 'الصندوق الرئيسي / الخزينة', allowInPOS: true, allowInInvoices: true },
  { id: 'pm_card', code: 'CARD', nameAr: 'فيزا / مدى / بطاقة (Card)', nameEn: 'Visa/Mada', type: 'card', isActive: true, feePercentage: 1.5, accountCode: '110201', accountName: 'حساب البنك - بطاقات مدى وفيزا', allowInPOS: true, allowInInvoices: true },
  { id: 'pm_credit', code: 'CREDIT', nameAr: 'بيع آجل كامل (Full Credit)', nameEn: 'Credit', type: 'credit', isActive: true, feePercentage: 0, accountCode: '110301', accountName: 'الذمم المدينة - العملاء', allowInPOS: true, allowInInvoices: true },
  { id: 'pm_partial', code: 'PARTIAL', nameAr: 'بيع آجل جزئي (Partial Credit)', nameEn: 'Partial Credit', type: 'partial', isActive: true, feePercentage: 0, accountCode: '110301', accountName: 'الذمم المدينة - العملاء', allowInPOS: true, allowInInvoices: true },
  { id: 'pm_stc', code: 'STC_PAY', nameAr: 'محفظة STC Pay / Apple Pay', nameEn: 'STC Pay', type: 'digital_wallet', isActive: true, feePercentage: 0.8, accountCode: '110202', accountName: 'حساب المحافظ الإلكترونية', allowInPOS: true, allowInInvoices: true },
  { id: 'pm_tabby', code: 'TABBY', nameAr: 'تقسيط تابي (Tabby BNPL)', nameEn: 'Tabby', type: 'bnpl', isActive: false, feePercentage: 4.0, accountCode: '110203', accountName: 'حساب شركات التقسيط تابي', allowInPOS: true, allowInInvoices: true }
];

export const PaymentMethodsSettings: React.FC = () => {
  const [methods, setMethods] = useState<PaymentMethodConfig[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMethod, setEditingMethod] = useState<PaymentMethodConfig | null>(null);

  useEffect(() => {
    const unsub = MaroSyncEngine.subscribe<PaymentMethodConfig>('payment_methods', (data) => {
      setMethods(data);
    });

    // Seed defaults if empty
    const local = MaroSyncEngine.getLocalCollection<PaymentMethodConfig>('payment_methods');
    if (local.length === 0) {
      DEFAULT_METHODS.forEach(m => MaroSyncEngine.saveDocument('payment_methods', m, true));
      setMethods(DEFAULT_METHODS);
    } else {
      setMethods(local);
    }

    return () => unsub();
  }, []);

  const handleToggleActive = (method: PaymentMethodConfig) => {
    const updated = { ...method, isActive: !method.isActive };
    MaroSyncEngine.saveDocument('payment_methods', updated, false);
    toast.success(updated.isActive ? `تم تفعيل نظام البيع [${method.nameAr}]` : `تم تعطيل نظام البيع [${method.nameAr}]`);
  };

  const handleDelete = (id: string, nameAr: string) => {
    if (window.confirm(`هل أنت متأكد من حذف نظام البيع والدفع [${nameAr}]؟`)) {
      MaroSyncEngine.deleteDocument('payment_methods', id);
      toast.success('تم الحذف بنجاح');
    }
  };

  return (
    <div className="p-8 space-y-8 bg-[#0b0f1a] text-white min-h-screen" dir="rtl">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#1e293b] pb-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-500/20 text-amber-400 rounded-2xl border border-amber-500/30">
              <CreditCard size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white tracking-tight">إدارة أنظمة وطرق البيع والدفع المتقدمة</h1>
              <p className="text-xs text-slate-400 font-medium mt-1">
                تخصيص أنظمة البيع (كاش نقدياً، آجل كامل، آجل جزئي، بطاقة فيزا/شبكة، محفظة إلكترونية، تقسيط) والتكامل المحاسبي
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => { setEditingMethod(null); setIsModalOpen(true); }}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-bold transition-all shadow-lg shadow-blue-600/20 text-xs"
        >
          <Plus size={18} />
          <span>إضافة نظام بيع / طريقة دفع جديدة</span>
        </button>
      </div>

      {/* Payment Methods Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {methods.map((pm) => (
          <div 
            key={pm.id} 
            className={cn(
              "bg-[#151b2b] rounded-3xl border p-6 space-y-4 relative overflow-hidden transition-all group",
              pm.isActive ? "border-[#1e293b] hover:border-blue-500/50" : "border-red-900/30 bg-[#151b2b]/50 opacity-70"
            )}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-12 h-12 rounded-2xl flex items-center justify-center border font-bold text-lg",
                  pm.type === 'cash' ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" :
                  pm.type === 'card' ? "bg-blue-500/10 border-blue-500/30 text-blue-400" :
                  pm.type === 'credit' || pm.type === 'partial' ? "bg-purple-500/10 border-purple-500/30 text-purple-400" :
                  "bg-amber-500/10 border-amber-500/30 text-amber-400"
                )}>
                  {pm.type === 'cash' && <DollarSign size={22} />}
                  {pm.type === 'card' && <CreditCard size={22} />}
                  {(pm.type === 'credit' || pm.type === 'partial') && <Layers size={22} />}
                  {pm.type === 'digital_wallet' && <Smartphone size={22} />}
                  {pm.type === 'bnpl' && <Wallet size={22} />}
                </div>

                <div>
                  <h3 className="font-black text-white text-base">{pm.nameAr}</h3>
                  <span className="text-[10px] text-slate-500 font-mono uppercase tracking-widest">{pm.code}</span>
                </div>
              </div>

              {/* Status Badge */}
              <button 
                onClick={() => handleToggleActive(pm)}
                className="flex items-center gap-1.5"
                title={pm.isActive ? "تعطيل نظام البيع" : "تفعيل نظام البيع"}
              >
                {pm.isActive ? (
                  <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg text-[10px] font-bold flex items-center gap-1">
                    <Check size={12} /> نشط
                  </span>
                ) : (
                  <span className="px-2.5 py-1 bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg text-[10px] font-bold flex items-center gap-1">
                    <X size={12} /> معطل
                  </span>
                )}
              </button>
            </div>

            {/* Details */}
            <div className="p-3 bg-[#0f172a] rounded-2xl space-y-2 text-xs border border-[#1e293b]">
              <div className="flex justify-between text-slate-400">
                <span>الحساب المحاسبي:</span>
                <span className="font-bold text-white">{pm.accountName} ({pm.accountCode})</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>رسوم الخدمة/البنك:</span>
                <span className="font-bold text-amber-400">{pm.feePercentage}%</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>متاح في الشاشات:</span>
                <span className="font-bold text-blue-400">
                  {pm.allowInPOS && 'POS الكاشير'} {pm.allowInInvoices && '| فواتير المبيعات'}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#1e293b]">
              <button
                onClick={() => { setEditingMethod(pm); setIsModalOpen(true); }}
                className="px-3 py-1.5 bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 rounded-xl text-xs font-bold transition-colors flex items-center gap-1"
              >
                <Edit2 size={14} /> تعديل
              </button>

              <button
                onClick={() => handleDelete(pm.id, pm.nameAr)}
                className="px-3 py-1.5 bg-red-600/10 hover:bg-red-600/20 text-red-400 rounded-xl text-xs font-bold transition-colors flex items-center gap-1"
              >
                <Trash2 size={14} /> حذف
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Edit / Add Modal */}
      {isModalOpen && (
        <PaymentMethodModal 
          method={editingMethod} 
          onClose={() => setIsModalOpen(false)} 
        />
      )}
    </div>
  );
};

const PaymentMethodModal: React.FC<{ method: PaymentMethodConfig | null, onClose: () => void }> = ({ method, onClose }) => {
  const [formData, setFormData] = useState<PaymentMethodConfig>({
    id: method?.id || `pm_${Date.now()}`,
    code: method?.code || '',
    nameAr: method?.nameAr || '',
    nameEn: method?.nameEn || '',
    type: method?.type || 'cash',
    isActive: method ? method.isActive : true,
    feePercentage: method?.feePercentage || 0,
    accountCode: method?.accountCode || '110101',
    accountName: method?.accountName || 'الصندوق الرئيسي / الخزينة',
    allowInPOS: method ? method.allowInPOS : true,
    allowInInvoices: method ? method.allowInInvoices : true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nameAr || !formData.code) {
      toast.error('يرجى تعبئة الحقول المطلوبة');
      return;
    }

    MaroSyncEngine.saveDocument('payment_methods', formData, !method);
    toast.success(method ? 'تم تحديث بيانات نظام البيع بنجاح' : 'تم إضافة نظام بيع جديد بنجاح');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-[#0b0f1a]/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#151b2b] w-full max-w-lg rounded-3xl border border-[#1e293b] shadow-2xl overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 to-amber-500"></div>
        <div className="p-6 border-b border-[#1e293b] flex items-center justify-between bg-[#0f172a]/50">
          <h3 className="font-black text-xl text-white tracking-tight">
            {method ? 'تعديل نظام بيع / دفع' : 'إضافة نظام بيع / دفع جديد'}
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-xl text-slate-500 transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs font-bold">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[#94a3b8] mb-1">الكود المرجعي (Code) *</label>
              <input 
                type="text" 
                required
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                className="w-full bg-[#0b0f1a] border border-[#334155] rounded-xl px-3 py-2.5 text-white font-mono"
                placeholder="VISA_MADA"
              />
            </div>
            <div>
              <label className="block text-[#94a3b8] mb-1">نوع النظام</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                className="w-full bg-[#0b0f1a] border border-[#334155] rounded-xl px-3 py-2.5 text-white"
              >
                <option value="cash">كاش نقدياً (Cash)</option>
                <option value="card">بطاقة / فيزا (Card)</option>
                <option value="credit">آجل كامل (Full Credit)</option>
                <option value="partial">آجل جزئي (Partial Credit)</option>
                <option value="digital_wallet">محفظة إلكترونية (Digital Wallet)</option>
                <option value="bnpl">تقسيط اشتر الآن وادفع لاحقاً (BNPL)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[#94a3b8] mb-1">الاسم بالعربية *</label>
            <input 
              type="text" 
              required
              value={formData.nameAr}
              onChange={(e) => setFormData({ ...formData, nameAr: e.target.value })}
              className="w-full bg-[#0b0f1a] border border-[#334155] rounded-xl px-3 py-2.5 text-white"
              placeholder="مثال: دفع مدى الشبكة الإلكترونية"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[#94a3b8] mb-1">اسم الحساب المحاسبي</label>
              <input 
                type="text" 
                value={formData.accountName}
                onChange={(e) => setFormData({ ...formData, accountName: e.target.value })}
                className="w-full bg-[#0b0f1a] border border-[#334155] rounded-xl px-3 py-2.5 text-white"
                placeholder="حساب البنك / الخزينة"
              />
            </div>
            <div>
              <label className="block text-[#94a3b8] mb-1">رقم الحساب بالدليل</label>
              <input 
                type="text" 
                value={formData.accountCode}
                onChange={(e) => setFormData({ ...formData, accountCode: e.target.value })}
                className="w-full bg-[#0b0f1a] border border-[#334155] rounded-xl px-3 py-2.5 text-white font-mono"
                placeholder="110201"
              />
            </div>
          </div>

          <div>
            <label className="block text-[#94a3b8] mb-1">نسبة اقتطاع رسوم البنك / الخدمة %</label>
            <input 
              type="number" 
              step="0.1"
              value={formData.feePercentage}
              onChange={(e) => setFormData({ ...formData, feePercentage: parseFloat(e.target.value) || 0 })}
              className="w-full bg-[#0b0f1a] border border-[#334155] rounded-xl px-3 py-2.5 text-amber-400 font-mono"
            />
          </div>

          <div className="p-3 bg-[#0f172a] rounded-2xl border border-[#1e293b] space-y-2">
            <p className="text-[#94a3b8] font-bold">خيارات الإتاحة والتشغيل</p>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer text-white">
                <input 
                  type="checkbox" 
                  checked={formData.allowInPOS} 
                  onChange={(e) => setFormData({ ...formData, allowInPOS: e.target.checked })} 
                />
                <span>متاح في شاشة الكاشير (POS)</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-white">
                <input 
                  type="checkbox" 
                  checked={formData.allowInInvoices} 
                  onChange={(e) => setFormData({ ...formData, allowInInvoices: e.target.checked })} 
                />
                <span>متاح في فواتير المبيعات</span>
              </label>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#1e293b]">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-bold hover:bg-slate-700 transition-all"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-500 transition-all shadow-lg shadow-blue-600/20"
            >
              حفظ وتطبيق
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
