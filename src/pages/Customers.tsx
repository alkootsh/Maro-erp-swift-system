/**
 * @file Customers.tsx
 * @module واجهات وصفحات النظام (UI Pages)
 * @description ملف جزء من نظام MARO ERP. الوظيفة: Customers.tsx.
 */
import React, { useEffect, useState } from 'react';
import { 
  Search, 
  UserPlus, 
  Mail, 
  Phone, 
  MoreVertical, 
  Edit2, 
  Trash2,
  X,
  History,
  DollarSign,
  AlertTriangle,
  CreditCard,
  Building2,
  Volume2,
  Sparkles,
  FileText
} from 'lucide-react';
import { Customer, CustomerLedger } from '../types/sprint8';
import { CustomerRepository } from '../repositories/customerRepository';
import { SaveCustomerCommand, DeleteCustomerCommand, RecordCustomerPaymentCommand } from '../cqrs/commands';
import { MaroSyncEngine } from '../lib/maroSyncEngine';
import { cn, formatCurrency, formatDate, playSystemChime } from '../lib/utils';
import { toast } from 'react-hot-toast';

export const Customers: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isLedgerOpen, setIsLedgerOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  useEffect(() => {
    // Reactive subscription to local offline customer store
    const unsubscribe = MaroSyncEngine.subscribe<Customer>('customers', (data) => {
      setCustomers(data || []);
    });
    return () => unsubscribe();
  }, []);

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (c.email && c.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (c.phone && c.phone.includes(searchTerm)) ||
    (c.taxNumber && c.taxNumber.includes(searchTerm))
  );

  const totalARBalance = customers.reduce((sum, c) => sum + (c.currentBalance || 0), 0);
  const activeCount = customers.filter(c => c.status === 'active').length;
  const creditLimitExceededCount = customers.filter(c => c.creditLimit > 0 && c.currentBalance > c.creditLimit).length;

  const handleDelete = async (customer: Customer) => {
    if (window.confirm(`هل أنت متأكد من حذف العميل "${customer.name}"؟`)) {
      try {
        const cmd = new DeleteCustomerCommand(customer.id, customer.name);
        await cmd.execute();
        playSystemChime('success');
        toast.success('تم حذف العميل بنجاح');
      } catch (e: any) {
        playSystemChime('error');
        alert(e.message || 'حدث خطأ أثناء الحذف');
      }
    }
  };

  const handleDeleteInactive = async () => {
    const inactiveCustomers = customers.filter(c => c.status !== 'active' || (c.currentBalance === 0 && !c.phone));
    if (inactiveCustomers.length === 0) {
      playSystemChime('warning');
      toast.error('لا يوجد عملاء غير نشطين حالياً للحذف.');
      return;
    }

    if (window.confirm(`هل أنت متأكد من حذف كافة العملاء غير النشطين والذين لا توجد عليهم أرصدة مالية (${inactiveCustomers.length} عميل)؟`)) {
      try {
        for (const c of inactiveCustomers) {
          const cmd = new DeleteCustomerCommand(c.id, c.name);
          await cmd.execute();
        }
        playSystemChime('success');
        toast.success(`✅ تم حذف ${inactiveCustomers.length} عميل غير نشط بنجاح!`);
      } catch (e: any) {
        playSystemChime('error');
        toast.error(e.message || 'حدث خطأ أثناء حذف العملاء غير النشطين');
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-[#151b2b] p-5 rounded-2xl border border-[#1e293b]">
          <p className="text-xs font-bold text-slate-500 uppercase">إجمالي العملاء</p>
          <p className="text-2xl font-black text-white mt-1">{customers.length}</p>
        </div>
        <div className="bg-[#151b2b] p-5 rounded-2xl border border-[#1e293b]">
          <p className="text-xs font-bold text-slate-500 uppercase">العملاء النشطون</p>
          <p className="text-2xl font-black text-emerald-400 mt-1">{activeCount}</p>
        </div>
        <div className="bg-[#151b2b] p-5 rounded-2xl border border-[#1e293b]">
          <p className="text-xs font-bold text-slate-500 uppercase">إجمالي الذمم المدينة (الديون)</p>
          <p className="text-2xl font-black text-amber-400 mt-1">{formatCurrency(totalARBalance)}</p>
        </div>
        <div className="bg-[#151b2b] p-5 rounded-2xl border border-[#1e293b]">
          <p className="text-xs font-bold text-slate-500 uppercase">تجاوز الحد الائتماني</p>
          <p className="text-2xl font-black text-red-400 mt-1">{creditLimitExceededCount}</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
          <input 
            type="text" 
            placeholder="البحث بالاسم، الهاتف، الرقم الضريبي..." 
            className="w-full pr-10 pl-4 py-2.5 bg-[#151b2b] border border-[#1e293b] rounded-xl text-white focus:outline-none focus:border-blue-500 transition-all placeholder:text-slate-600 font-bold text-xs"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-3">
          <button 
            type="button"
            onClick={handleDeleteInactive}
            className="flex items-center gap-2 px-4 py-2.5 bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/30 rounded-xl transition-all font-bold text-xs active:scale-95 shadow-lg shadow-red-950/20"
            title="حذف جميع العملاء غير النشطين وأصحاب الأرصدة الصفرية"
          >
            <Trash2 size={16} />
            <span>حذف غير النشطين 🗑️</span>
          </button>
          <button 
            type="button"
            onClick={() => { setEditingCustomer(null); setIsModalOpen(true); }}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-500 transition-all font-bold text-xs shadow-lg shadow-blue-600/20 active:scale-95"
          >
            <UserPlus size={16} />
            <span>إضافة عميل جديد</span>
          </button>
        </div>
      </div>

      <div className="bg-[#151b2b] rounded-2xl border border-[#1e293b] shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead className="bg-slate-900/50 text-slate-500 text-[10px] font-bold uppercase tracking-widest">
              <tr>
                <th className="px-6 py-4">العميل</th>
                <th className="px-6 py-4">الهاتف / البريد</th>
                <th className="px-6 py-4">الرقم الضريبي</th>
                <th className="px-6 py-4">قائمة الأسعار</th>
                <th className="px-6 py-4">الحد الائتماني</th>
                <th className="px-6 py-4">الرصيد المستحق (AR)</th>
                <th className="px-6 py-4 text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e293b]">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-600 font-bold">لا يوجد عملاء مضافون حالياً</td>
                </tr>
              ) : filteredCustomers.map((customer) => {
                const isOverLimit = customer.creditLimit > 0 && customer.currentBalance > customer.creditLimit;
                return (
                  <tr key={customer.id} className="hover:bg-slate-800/30 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="font-bold text-white flex items-center gap-2">
                        <span>{customer.name}</span>
                        {isOverLimit && (
                          <span className="px-2 py-0.5 text-[10px] bg-red-500/20 text-red-400 border border-red-500/30 rounded-full font-bold flex items-center gap-1">
                            <AlertTriangle size={10} />
                            متجاوز الائتمان
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-400">
                      <div>{customer.phone || '—'}</div>
                      <div className="text-xs text-slate-500">{customer.email || '—'}</div>
                    </td>
                    <td className="px-6 py-4 text-sm font-mono text-slate-300">
                      {customer.taxNumber || 'غير مسجل'}
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-blue-400">
                      {customer.priceListId === 'WHOLESALE' ? 'سعر الجملة' : customer.priceListId === 'DISTRIBUTOR' ? 'سعر الموزع' : 'سعر التجزئة'}
                    </td>
                    <td className="px-6 py-4 text-sm font-mono text-slate-300">
                      {customer.creditLimit > 0 ? formatCurrency(customer.creditLimit) : 'غير محدد'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "font-black text-sm font-mono px-3 py-1 rounded-lg inline-block",
                        customer.currentBalance > 0 ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" : "bg-emerald-500/10 text-emerald-400"
                      )}>
                        {formatCurrency(customer.currentBalance || 0)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 justify-center">
                        <button 
                          onClick={() => { setSelectedCustomer(customer); setIsPaymentModalOpen(true); }}
                          className="px-2.5 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 rounded-lg text-xs font-bold transition-all flex items-center gap-1"
                          title="تحصيل دفعة"
                        >
                          <DollarSign size={14} />
                          تحصيل
                        </button>
                        <button 
                          onClick={() => { setSelectedCustomer(customer); setIsLedgerOpen(true); }}
                          className="px-2.5 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 rounded-lg text-xs font-bold transition-all flex items-center gap-1"
                          title="كشف حساب تفصيلي"
                        >
                          <FileText size={14} />
                          كشف حساب
                        </button>
                        <button 
                          onClick={() => { setEditingCustomer(customer); setIsModalOpen(true); }}
                          className="p-2 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
                          title="تعديل العميل"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          onClick={() => handleDelete(customer)}
                          className="p-2 hover:bg-red-500/10 text-red-400 rounded-lg transition-colors"
                          title="حذف العميل"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Customer Form Modal */}
      {isModalOpen && (
        <CustomerModal 
          customer={editingCustomer} 
          onClose={() => setIsModalOpen(false)} 
        />
      )}

      {/* Record Payment Modal */}
      {isPaymentModalOpen && selectedCustomer && (
        <PaymentModal
          customer={selectedCustomer}
          onClose={() => setIsPaymentModalOpen(false)}
        />
      )}

      {/* Customer Ledger Statement Drawer */}
      {isLedgerOpen && selectedCustomer && (
        <CustomerLedgerDrawer 
          customer={selectedCustomer}
          onClose={() => setIsLedgerOpen(false)}
        />
      )}
    </div>
  );
};

const CustomerModal: React.FC<{ customer: Customer | null; onClose: () => void }> = ({ customer, onClose }) => {
  const [formData, setFormData] = useState({
    name: customer?.name || '',
    phone: customer?.phone || '',
    email: customer?.email || '',
    taxNumber: customer?.taxNumber || '',
    creditLimit: customer?.creditLimit || 0,
    creditDays: customer?.creditDays || 30,
    priceListId: customer?.priceListId || 'RETAIL',
    status: customer?.status || 'active'
  });

  const [hasPlayedWarning, setHasPlayedWarning] = useState(false);

  // Check for duplicate phone number dynamically in offline storage
  const allCustomers = MaroSyncEngine.getLocalCollection<Customer>('customers');
  const duplicateCustomer = formData.phone?.trim()
    ? allCustomers.find(c => c.phone?.trim() === formData.phone?.trim() && c.id !== customer?.id)
    : null;

  useEffect(() => {
    if (duplicateCustomer) {
      if (!hasPlayedWarning) {
        playSystemChime('warning');
        setHasPlayedWarning(true);
      }
    } else {
      setHasPlayedWarning(false);
    }
  }, [duplicateCustomer, hasPlayedWarning]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const cmd = new SaveCustomerCommand({
        ...formData,
        id: customer?.id,
        currentBalance: customer?.currentBalance || 0
      });
      await cmd.execute();
      
      // Visual & Auditory Confirmation
      playSystemChime('success');
      toast.success(
        <div className="flex flex-col text-right font-sans">
          <span className="font-black text-xs text-white">✅ تم حفظ بيانات العميل بنجاح!</span>
          <span className="text-[10px] text-slate-400 mt-0.5">تم ترحيل البيانات وتأمين الدفاتر المحاسبية بنجاح.</span>
        </div>,
        { duration: 4000 }
      );
      
      onClose();
    } catch (e: any) {
      playSystemChime('error');
      toast.error(e.message || 'حدث خطأ أثناء حفظ العميل');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 font-sans">
      <div className="bg-[#151b2b] w-full max-w-lg rounded-3xl border border-[#1e293b] shadow-2xl overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 to-indigo-600"></div>
        
        <div className="p-6 border-b border-[#1e293b] flex items-center justify-between bg-[#0f172a]/40">
          <div className="flex items-center gap-2">
            <Sparkles className="text-blue-400 animate-pulse" size={18} />
            <h3 className="font-black text-sm text-white tracking-tight">
              {customer ? 'تعديل بيانات عميل مسجل' : 'إضافة وتأسيس عميل جديد'}
            </h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-xl text-slate-500 transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs font-semibold">
          
          <div>
            <label className="block text-slate-400 font-bold mb-1.5">اسم العميل بالكامل *</label>
            <input 
              required
              type="text" 
              className="w-full px-4 py-2.5 bg-[#1e293b] border border-[#334155] rounded-xl text-white outline-none focus:border-blue-500 font-bold"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-400 font-bold mb-1.5">رقم الهاتف الجوال</label>
              <input 
                type="text" 
                className={cn(
                  "w-full px-4 py-2.5 bg-[#1e293b] border rounded-xl text-white outline-none font-bold",
                  duplicateCustomer ? "border-amber-500/50 focus:border-amber-500" : "border-[#334155] focus:border-blue-500"
                )}
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-slate-400 font-bold mb-1.5">الرقم الضريبي (TRN)</label>
              <input 
                type="text" 
                className="w-full px-4 py-2.5 bg-[#1e293b] border border-[#334155] rounded-xl text-white outline-none focus:border-blue-500 font-mono font-bold"
                value={formData.taxNumber}
                onChange={(e) => setFormData({ ...formData, taxNumber: e.target.value })}
              />
            </div>
          </div>

          {/* DYNAMIC DUPLICATE PHONE NUMBER WARNING (كاشف تكرار الهواتف) */}
          {duplicateCustomer && (
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-start gap-2.5 animate-pulse text-amber-300">
              <AlertTriangle className="text-amber-400 shrink-0 mt-0.5" size={16} />
              <div className="space-y-1">
                <p className="font-black text-[11px]">⚠️ تنبيه: رقم الهاتف مكرر ومسجل مسبقاً!</p>
                <p className="text-[10px] text-amber-400/90 leading-relaxed">
                  هذا الرقم مسجل بالفعل للعميل: <span className="font-black underline text-white">{duplicateCustomer.name}</span>. 
                  يُفضل استخدام رقم فريد لكل عميل لتفادي تداخل حسابات المندوبين وإشعارات الواتساب.
                </p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-400 font-bold mb-1.5">الحد الائتماني المالي (EGP)</label>
              <input 
                type="number" 
                className="w-full px-4 py-2.5 bg-[#1e293b] border border-[#334155] rounded-xl text-white outline-none focus:border-blue-500 font-mono font-bold"
                value={formData.creditLimit}
                onChange={(e) => setFormData({ ...formData, creditLimit: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div>
              <label className="block text-slate-400 font-bold mb-1.5">قائمة تسعير الفواتير</label>
              <select
                className="w-full px-4 py-2.5 bg-[#1e293b] border border-[#334155] rounded-xl text-white outline-none focus:border-blue-500 font-bold"
                value={formData.priceListId}
                onChange={(e) => setFormData({ ...formData, priceListId: e.target.value })}
              >
                <option value="RETAIL">سعر التجزئة (عادي)</option>
                <option value="WHOLESALE">سعر الجملة المعتمد</option>
                <option value="DISTRIBUTOR">سعر الموزع VIP</option>
              </select>
            </div>
          </div>

          <div className="pt-4 flex gap-3 border-t border-[#1e293b]">
            <button 
              type="submit"
              className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white py-3 rounded-xl font-black shadow-lg shadow-blue-600/20 active:scale-95 transition-all flex items-center justify-center gap-1.5"
            >
              <Volume2 size={14} className="animate-bounce" />
              <span>حفظ العميل وتأكيد القيد 🔊</span>
            </button>
            <button 
              type="button"
              onClick={onClose}
              className="flex-1 bg-[#1e293b] text-slate-300 py-3 rounded-xl font-bold hover:bg-[#334155] transition-all"
            >
              إلغاء
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const PaymentModal: React.FC<{ customer: Customer; onClose: () => void }> = ({ customer, onClose }) => {
  const [amount, setAmount] = useState<number>(customer.currentBalance > 0 ? customer.currentBalance : 0);
  const [refNo, setRefNo] = useState<string>(`REC-${Date.now().toString().slice(-6)}`);
  const [notes, setNotes] = useState<string>('تحصيل دفعة نقدية لحساب العميل');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const cmd = new RecordCustomerPaymentCommand(customer.id, amount, refNo, notes);
      await cmd.execute();
      
      // Visual & Auditory Confirmation
      playSystemChime('success');
      toast.success(
        <div className="flex flex-col text-right font-sans">
          <span className="font-black text-xs text-white">💵 تم قيد وتحصيل الدفعة النقدية!</span>
          <span className="text-[10px] text-slate-400 mt-0.5">المبلغ: {formatCurrency(amount)} | رقم المرجع: {refNo}</span>
        </div>,
        { duration: 5000 }
      );
      
      onClose();
    } catch (e: any) {
      playSystemChime('error');
      toast.error(e.message || 'حدث خطأ أثناء تحصيل الدفعة');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 font-sans">
      <div className="bg-[#151b2b] w-full max-w-md rounded-3xl border border-[#1e293b] shadow-2xl overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-600 to-teal-600"></div>
        
        <div className="p-6 border-b border-[#1e293b] flex items-center justify-between bg-[#0f172a]/40">
          <div>
            <h3 className="font-black text-sm text-white tracking-tight">تحصيل دفعة نقدية من عميل 💵</h3>
            <p className="text-[10px] text-blue-400 font-bold mt-1">العميل: {customer.name}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-xl text-slate-500 transition-colors">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs font-semibold">
          <div className="bg-[#1e293b] p-4 rounded-xl border border-[#334155] flex justify-between items-center">
            <span className="text-slate-400 font-bold">الرصيد المستحق الحالي للعميل:</span>
            <span className="text-base font-black text-amber-400 font-mono">{formatCurrency(customer.currentBalance)}</span>
          </div>

          <div>
            <label className="block text-slate-400 font-bold mb-1.5">المبلغ المحصّل والمسدد (EGP) *</label>
            <input 
              required
              type="number" 
              step="0.01"
              className="w-full px-4 py-3 bg-[#1e293b] border border-[#334155] rounded-xl text-emerald-400 outline-none focus:border-emerald-500 text-base font-black font-mono"
              value={amount}
              onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
            />
          </div>

          <div>
            <label className="block text-slate-400 font-bold mb-1.5">رقم سند القبض / المرجع المالي</label>
            <input 
              required
              type="text" 
              className="w-full px-4 py-2.5 bg-[#1e293b] border border-[#334155] rounded-xl text-white outline-none focus:border-emerald-500 font-mono font-bold"
              value={refNo}
              onChange={(e) => setRefNo(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-slate-400 font-bold mb-1.5">ملاحظات السند</label>
            <input 
              type="text" 
              className="w-full px-4 py-2.5 bg-[#1e293b] border border-[#334155] rounded-xl text-white outline-none focus:border-emerald-500"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div className="pt-4 flex gap-3 border-t border-[#1e293b]">
            <button 
              type="submit"
              className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white py-3 rounded-xl font-black shadow-lg shadow-emerald-600/20 active:scale-95 transition-all flex items-center justify-center gap-1.5"
            >
              <Volume2 size={14} className="animate-bounce" />
              <span>تأكيد التحصيل والقيد 🔊</span>
            </button>
            <button 
              type="button"
              onClick={onClose}
              className="flex-1 bg-[#1e293b] text-slate-300 py-3 rounded-xl font-bold hover:bg-[#334155] transition-all"
            >
              إلغاء
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};


const CustomerLedgerDrawer: React.FC<{ customer: Customer; onClose: () => void }> = ({ customer, onClose }) => {
  const [ledger, setLedger] = useState<CustomerLedger[]>([]);

  useEffect(() => {
    const list = CustomerRepository.getLedger(customer.id);
    setLedger(list);
  }, [customer.id]);

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#151b2b] w-full max-w-3xl rounded-3xl border border-[#1e293b] shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        <div className="p-6 border-b border-[#1e293b] flex items-center justify-between">
          <div>
            <h3 className="font-black text-xl text-white">كشف حساب العميل التفصيلي</h3>
            <p className="text-sm text-slate-400 font-bold mt-1">{customer.name} - (الرصيد: {formatCurrency(customer.currentBalance)})</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-xl text-slate-500">
            <X size={22} />
          </button>
        </div>

        <div className="p-6 flex-1 overflow-y-auto">
          <table className="w-full text-right">
            <thead className="bg-slate-900/50 text-slate-500 text-[10px] font-bold uppercase tracking-widest border-b border-[#1e293b]">
              <tr>
                <th className="px-4 py-3">التاريخ</th>
                <th className="px-4 py-3">النوع / المرجع</th>
                <th className="px-4 py-3 text-red-400">مدين (دين)</th>
                <th className="px-4 py-3 text-emerald-400">دائن (سداد)</th>
                <th className="px-4 py-3">الرصيد بعد الحركة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e293b]">
              {ledger.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-600 font-bold">لا توجد حركات سابقة لهذا العميل</td>
                </tr>
              ) : ledger.map(item => (
                <tr key={item.id} className="hover:bg-slate-800/30">
                  <td className="px-4 py-3 text-xs text-slate-400 font-mono">
                    {formatDate(new Date(item.date))}
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-bold text-white text-sm">{item.referenceNo}</div>
                    <div className="text-xs text-slate-500">{item.notes}</div>
                  </td>
                  <td className="px-4 py-3 font-mono font-bold text-red-400">
                    {item.debit > 0 ? formatCurrency(item.debit) : '—'}
                  </td>
                  <td className="px-4 py-3 font-mono font-bold text-emerald-400">
                    {item.credit > 0 ? formatCurrency(item.credit) : '—'}
                  </td>
                  <td className="px-4 py-3 font-mono font-black text-amber-400">
                    {formatCurrency(item.balanceAfter)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
