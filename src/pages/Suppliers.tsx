/**
 * @file Suppliers.tsx
 * @module واجهات وصفحات النظام (UI Pages)
 * @description ملف جزء من نظام MARO ERP. الوظيفة: Suppliers.tsx.
 */
import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { 
  Search, 
  Truck, 
  Mail, 
  Phone, 
  Edit2, 
  Trash2,
  X,
  History,
  DollarSign,
  Power
} from 'lucide-react';
import { Supplier, SupplierLedger } from '../types/sprint8';
import { SupplierRepository } from '../repositories/supplierRepository';
import { SaveSupplierCommand, DeleteSupplierCommand, RecordSupplierPaymentCommand, ToggleSupplierStatusCommand } from '../cqrs/commands';
import { MaroSyncEngine } from '../lib/maroSyncEngine';
import { cn, formatCurrency, formatDate } from '../lib/utils';

export const Suppliers: React.FC = () => {
  const location = useLocation();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isLedgerOpen, setIsLedgerOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);

  useEffect(() => {
    if (location.search.includes('action=add')) {
      setIsModalOpen(true);
      setEditingSupplier(null);
    }
  }, [location.search]);

  useEffect(() => {
    // Reactive subscription to local offline supplier store
    const unsubscribe = MaroSyncEngine.subscribe<Supplier>('suppliers', (data) => {
      setSuppliers(data || []);
    });
    return () => unsubscribe();
  }, []);

  const filteredSuppliers = suppliers.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (s.email && s.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (s.phone && s.phone.includes(searchTerm)) ||
    (s.taxNumber && s.taxNumber.includes(searchTerm))
  );

  const totalAPBalance = suppliers.reduce((sum, s) => sum + (s.currentBalance || 0), 0);
  const activeCount = suppliers.filter(s => s.status === 'active').length;

  const handleDelete = async (supplier: Supplier) => {
    if (window.confirm(`هل أنت متأكد من حذف المورد "${supplier.name}"؟`)) {
      try {
        const cmd = new DeleteSupplierCommand(supplier.id, supplier.name);
        await cmd.execute();
      } catch (e: any) {
        alert(e.message || 'حدث خطأ أثناء الحذف');
      }
    }
  };

  const handleToggleStatus = async (supplier: Supplier) => {
    try {
      const cmd = new ToggleSupplierStatusCommand(supplier.id, supplier.status);
      await cmd.execute();
    } catch (e: any) {
      alert(e.message || 'حدث خطأ أثناء تغيير الحالة');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#151b2b] p-5 rounded-2xl border border-[#1e293b]">
          <p className="text-xs font-bold text-slate-500 uppercase">إجمالي الموردين</p>
          <p className="text-2xl font-black text-white mt-1">{suppliers.length}</p>
        </div>
        <div className="bg-[#151b2b] p-5 rounded-2xl border border-[#1e293b]">
          <p className="text-xs font-bold text-slate-500 uppercase">الموردون النشطون</p>
          <p className="text-2xl font-black text-emerald-400 mt-1">{activeCount}</p>
        </div>
        <div className="bg-[#151b2b] p-5 rounded-2xl border border-[#1e293b]">
          <p className="text-xs font-bold text-slate-500 uppercase">إجمالي الذمم الدائنة (مستحقات الموردين AP)</p>
          <p className="text-2xl font-black text-red-400 mt-1">{formatCurrency(totalAPBalance)}</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
          <input 
            type="text" 
            placeholder="البحث باسم المورد، البريد، الرقم الضريبي..." 
            className="w-full pr-10 pl-4 py-2.5 bg-[#151b2b] border border-[#1e293b] rounded-xl text-white focus:outline-none focus:border-blue-500 transition-all placeholder:text-slate-600"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button 
          onClick={() => { setEditingSupplier(null); setIsModalOpen(true); }}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-500 transition-all font-bold shadow-lg shadow-blue-600/20 active:scale-95"
        >
          <Truck size={18} />
          <span>إضافة مورد جديد</span>
        </button>
      </div>

      <div className="bg-[#151b2b] rounded-2xl border border-[#1e293b] shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead className="bg-slate-900/50 text-slate-500 text-[10px] font-bold uppercase tracking-widest">
              <tr>
                <th className="px-6 py-4">المورد</th>
                <th className="px-6 py-4">الهاتف / البريد</th>
                <th className="px-6 py-4">الحالة</th>
                <th className="px-6 py-4">الرقم الضريبي</th>
                <th className="px-6 py-4">شروط السداد</th>
                <th className="px-6 py-4">المستحقات المتبقية (AP)</th>
                <th className="px-6 py-4 text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e293b]">
              {filteredSuppliers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-600 font-bold">لا يوجد موردون مضافون حالياً</td>
                </tr>
              ) : filteredSuppliers.map((supplier) => (
                <tr key={supplier.id} className="hover:bg-slate-800/30 transition-colors group">
                  <td className="px-6 py-4 font-bold text-white">{supplier.name}</td>
                  <td className="px-6 py-4 text-sm text-slate-400">
                    <div>{supplier.phone || '—'}</div>
                    <div className="text-xs text-slate-500">{supplier.email || '—'}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "px-2.5 py-1 rounded-full text-xs font-bold",
                      supplier.status === 'active' ? "bg-emerald-500/10 text-emerald-400" : "bg-slate-800 text-slate-400"
                    )}>
                      {supplier.status === 'active' ? 'نشط' : 'غير نشط'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm font-mono text-slate-300">
                    {supplier.taxNumber || 'غير مسجل'}
                  </td>
                  <td className="px-6 py-4 text-sm font-bold text-blue-400">
                    {supplier.paymentTerms || 'آجل 30 يوم'}
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "font-black text-sm font-mono px-3 py-1 rounded-lg inline-block",
                      supplier.currentBalance > 0 ? "bg-red-500/10 text-red-400 border border-red-500/20" : "bg-emerald-500/10 text-emerald-400"
                    )}>
                      {formatCurrency(supplier.currentBalance || 0)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 justify-center">
                      <button 
                        onClick={() => { setSelectedSupplier(supplier); setIsPaymentModalOpen(true); }}
                        className="px-2.5 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 rounded-lg text-xs font-bold transition-all flex items-center gap-1"
                        title="سداد مستحقات"
                      >
                        <DollarSign size={14} />
                        سداد
                      </button>
                      <button 
                        onClick={() => handleToggleStatus(supplier)}
                        className={cn("p-2 rounded-lg transition-colors", supplier.status === 'active' ? "hover:bg-amber-500/10 text-amber-400" : "hover:bg-emerald-500/10 text-emerald-400")}
                        title={supplier.status === 'active' ? "إيقاف المورد" : "تنشيط المورد"}
                      >
                        <Power size={16} />
                      </button>
                      <button 
                        onClick={() => { setSelectedSupplier(supplier); setIsLedgerOpen(true); }}
                        className="px-2.5 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 rounded-lg transition-all flex items-center gap-1 text-xs font-bold"
                        title="كشف حساب"
                      >
                        <History size={14} />
                        <span>كشف حساب</span>
                      </button>
                      <button 
                        onClick={() => { setEditingSupplier(supplier); setIsModalOpen(true); }}
                        className="p-2 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        onClick={() => handleDelete(supplier)}
                        className="p-2 hover:bg-red-500/10 text-red-400 rounded-lg transition-colors"
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

      {/* Supplier Form Modal */}
      {isModalOpen && (
        <SupplierModal 
          supplier={editingSupplier} 
          onClose={() => setIsModalOpen(false)} 
        />
      )}

      {/* Payment Modal */}
      {isPaymentModalOpen && selectedSupplier && (
        <SupplierPaymentModal
          supplier={selectedSupplier}
          onClose={() => setIsPaymentModalOpen(false)}
        />
      )}

      {/* Supplier Ledger Statement Drawer */}
      {isLedgerOpen && selectedSupplier && (
        <SupplierLedgerDrawer 
          supplier={selectedSupplier}
          onClose={() => setIsLedgerOpen(false)}
        />
      )}
    </div>
  );
};

const SupplierModal: React.FC<{ supplier: Supplier | null; onClose: () => void }> = ({ supplier, onClose }) => {
  const [formData, setFormData] = useState({
    name: supplier?.name || '',
    phone: supplier?.phone || '',
    email: supplier?.email || '',
    taxNumber: supplier?.taxNumber || '',
    paymentTerms: supplier?.paymentTerms || 'NET30',
    status: supplier?.status || 'active'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const cmd = new SaveSupplierCommand({
        ...formData,
        id: supplier?.id,
        currentBalance: supplier?.currentBalance || 0
      });
      await cmd.execute();
      onClose();
    } catch (e: any) {
      alert(e.message || 'حدث خطأ أثناء حفظ المورد');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#151b2b] w-full max-w-lg rounded-3xl border border-[#1e293b] shadow-2xl overflow-hidden">
        <div className="p-6 border-b border-[#1e293b] flex items-center justify-between">
          <h3 className="font-bold text-xl text-white">
            {supplier ? 'تعديل بيانات مورد' : 'إضافة مورد جديد'}
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-xl text-slate-500">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">اسم المورد *</label>
            <input 
              required
              type="text" 
              className="w-full px-4 py-2.5 bg-[#1e293b] border border-[#334155] rounded-xl text-white outline-none focus:border-blue-500"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">رقم الهاتف</label>
              <input 
                type="text" 
                className="w-full px-4 py-2.5 bg-[#1e293b] border border-[#334155] rounded-xl text-white outline-none focus:border-blue-500"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">الرقم الضريبي (TRN)</label>
              <input 
                type="text" 
                className="w-full px-4 py-2.5 bg-[#1e293b] border border-[#334155] rounded-xl text-white outline-none focus:border-blue-500 font-mono"
                value={formData.taxNumber}
                onChange={(e) => setFormData({ ...formData, taxNumber: e.target.value })}
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">شروط السداد</label>
            <select
              className="w-full px-4 py-2.5 bg-[#1e293b] border border-[#334155] rounded-xl text-white outline-none focus:border-blue-500"
              value={formData.paymentTerms}
              onChange={(e) => setFormData({ ...formData, paymentTerms: e.target.value })}
            >
              <option value="NET15">آجل 15 يوم (NET 15)</option>
              <option value="NET30">آجل 30 يوم (NET 30)</option>
              <option value="NET60">آجل 60 يوم (NET 60)</option>
              <option value="CASH">نقداً عند الاستلام (COD)</option>
            </select>
          </div>
          <div className="pt-4 flex gap-3">
            <button 
              type="submit"
              className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-xl font-bold shadow-lg shadow-blue-600/20"
            >
              حفظ المورد
            </button>
            <button 
              type="button"
              onClick={onClose}
              className="flex-1 bg-[#1e293b] text-slate-300 py-3 rounded-xl font-bold hover:bg-[#334155]"
            >
              إلغاء
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const SupplierPaymentModal: React.FC<{ supplier: Supplier; onClose: () => void }> = ({ supplier, onClose }) => {
  const [amount, setAmount] = useState<number>(supplier.currentBalance > 0 ? supplier.currentBalance : 0);
  const [refNo, setRefNo] = useState<string>(`PAY-${Date.now().toString().slice(-6)}`);
  const [notes, setNotes] = useState<string>('سداد مستحقات فاتورة شراء للمورد');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const cmd = new RecordSupplierPaymentCommand(supplier.id, amount, refNo, notes);
      await cmd.execute();
      onClose();
    } catch (e: any) {
      alert(e.message || 'حدث خطأ أثناء السداد');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#151b2b] w-full max-w-md rounded-3xl border border-[#1e293b] shadow-2xl overflow-hidden">
        <div className="p-6 border-b border-[#1e293b] flex items-center justify-between">
          <div>
            <h3 className="font-bold text-xl text-white">سداد مستحقات المورد</h3>
            <p className="text-xs text-blue-400 font-bold mt-0.5">{supplier.name}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-xl text-slate-500">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="bg-[#1e293b] p-4 rounded-xl border border-[#334155] flex justify-between items-center">
            <span className="text-xs text-slate-400 font-bold">المستحقات الحالية للمورد:</span>
            <span className="text-lg font-black text-red-400 font-mono">{formatCurrency(supplier.currentBalance)}</span>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">المبلغ المسدد (EGP) *</label>
            <input 
              required
              type="number" 
              step="0.01"
              className="w-full px-4 py-2.5 bg-[#1e293b] border border-[#334155] rounded-xl text-white outline-none focus:border-blue-500 text-lg font-bold font-mono"
              value={amount}
              onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">رقم الإذن / الشيك / المرجع</label>
            <input 
              required
              type="text" 
              className="w-full px-4 py-2.5 bg-[#1e293b] border border-[#334155] rounded-xl text-white outline-none focus:border-blue-500 font-mono"
              value={refNo}
              onChange={(e) => setRefNo(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">ملاحظات البيان</label>
            <input 
              type="text" 
              className="w-full px-4 py-2.5 bg-[#1e293b] border border-[#334155] rounded-xl text-white outline-none focus:border-blue-500"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div className="pt-4 flex gap-3">
            <button 
              type="submit"
              className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-xl font-bold shadow-lg shadow-blue-600/20"
            >
              تأكيد السداد والقيد
            </button>
            <button 
              type="button"
              onClick={onClose}
              className="flex-1 bg-[#1e293b] text-slate-300 py-3 rounded-xl font-bold hover:bg-[#334155]"
            >
              إلغاء
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const SupplierLedgerDrawer: React.FC<{ supplier: Supplier; onClose: () => void }> = ({ supplier, onClose }) => {
  const [ledger, setLedger] = useState<SupplierLedger[]>([]);

  useEffect(() => {
    const list = SupplierRepository.getLedger(supplier.id);
    setLedger(list);
  }, [supplier.id]);

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#151b2b] w-full max-w-3xl rounded-3xl border border-[#1e293b] shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        <div className="p-6 border-b border-[#1e293b] flex items-center justify-between">
          <div>
            <h3 className="font-black text-xl text-white">كشف حساب المورد التفصيلي</h3>
            <p className="text-sm text-slate-400 font-bold mt-1">{supplier.name} - (الرصيد: {formatCurrency(supplier.currentBalance)})</p>
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
                <th className="px-4 py-3 text-red-400">دائن (مستحق للمورد)</th>
                <th className="px-4 py-3 text-emerald-400">مدين (سداد)</th>
                <th className="px-4 py-3">الرصيد المتبقي</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e293b]">
              {ledger.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-600 font-bold">لا توجد حركات سابقة لهذا المورد</td>
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
                    {item.credit > 0 ? formatCurrency(item.credit) : '—'}
                  </td>
                  <td className="px-4 py-3 font-mono font-bold text-emerald-400">
                    {item.debit > 0 ? formatCurrency(item.debit) : '—'}
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
