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
  Building2
} from 'lucide-react';
import { Customer, CustomerLedger } from '../types/sprint8';
import { CustomerRepository } from '../repositories/customerRepository';
import { SaveCustomerCommand, DeleteCustomerCommand, RecordCustomerPaymentCommand } from '../cqrs/commands';
import { MaroSyncEngine } from '../lib/maroSyncEngine';
import { cn, formatCurrency, formatDate } from '../lib/utils';

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
      } catch (e: any) {
        alert(e.message || 'حدث خطأ أثناء الحذف');
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
            className="w-full pr-10 pl-4 py-2.5 bg-[#151b2b] border border-[#1e293b] rounded-xl text-white focus:outline-none focus:border-blue-500 transition-all placeholder:text-slate-600"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button 
          onClick={() => { setEditingCustomer(null); setIsModalOpen(true); }}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-500 transition-all font-bold shadow-lg shadow-blue-600/20 active:scale-95"
        >
          <UserPlus size={18} />
          <span>إضافة عميل جديد</span>
        </button>
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
                          className="p-2 hover:bg-blue-500/10 text-blue-400 rounded-lg transition-colors"
                          title="كشف حساب"
                        >
                          <History size={16} />
                        </button>
                        <button 
                          onClick={() => { setEditingCustomer(customer); setIsModalOpen(true); }}
                          className="p-2 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          onClick={() => handleDelete(customer)}
                          className="p-2 hover:bg-red-500/10 text-red-400 rounded-lg transition-colors"
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const cmd = new SaveCustomerCommand({
        ...formData,
        id: customer?.id,
        currentBalance: customer?.currentBalance || 0
      });
      await cmd.execute();
      onClose();
    } catch (e: any) {
      alert(e.message || 'حدث خطأ أثناء إدخال العميل');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#151b2b] w-full max-w-lg rounded-3xl border border-[#1e293b] shadow-2xl overflow-hidden">
        <div className="p-6 border-b border-[#1e293b] flex items-center justify-between">
          <h3 className="font-bold text-xl text-white">
            {customer ? 'تعديل بيانات عميل' : 'إضافة عميل جديد'}
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-xl text-slate-500">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">اسم العميل *</label>
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
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">الحد الائتماني (EGP)</label>
              <input 
                type="number" 
                className="w-full px-4 py-2.5 bg-[#1e293b] border border-[#334155] rounded-xl text-white outline-none focus:border-blue-500 font-mono"
                value={formData.creditLimit}
                onChange={(e) => setFormData({ ...formData, creditLimit: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">قائمة الأسعار</label>
              <select
                className="w-full px-4 py-2.5 bg-[#1e293b] border border-[#334155] rounded-xl text-white outline-none focus:border-blue-500"
                value={formData.priceListId}
                onChange={(e) => setFormData({ ...formData, priceListId: e.target.value })}
              >
                <option value="RETAIL">سعر التجزئة (عادي)</option>
                <option value="WHOLESALE">سعر الجملة</option>
                <option value="DISTRIBUTOR">سعر الموزع VIP</option>
              </select>
            </div>
          </div>
          <div className="pt-4 flex gap-3">
            <button 
              type="submit"
              className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-xl font-bold shadow-lg shadow-blue-600/20"
            >
              حفظ العميل
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

const PaymentModal: React.FC<{ customer: Customer; onClose: () => void }> = ({ customer, onClose }) => {
  const [amount, setAmount] = useState<number>(customer.currentBalance > 0 ? customer.currentBalance : 0);
  const [refNo, setRefNo] = useState<string>(`REC-${Date.now().toString().slice(-6)}`);
  const [notes, setNotes] = useState<string>('تحصيل دفعة نقدية لحساب العميل');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const cmd = new RecordCustomerPaymentCommand(customer.id, amount, refNo, notes);
      await cmd.execute();
      onClose();
    } catch (e: any) {
      alert(e.message || 'حدث خطأ أثناء تحصيل الدفعة');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#151b2b] w-full max-w-md rounded-3xl border border-[#1e293b] shadow-2xl overflow-hidden">
        <div className="p-6 border-b border-[#1e293b] flex items-center justify-between">
          <div>
            <h3 className="font-bold text-xl text-white">تحصيل دفعة نقدية</h3>
            <p className="text-xs text-blue-400 font-bold mt-0.5">{customer.name}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-xl text-slate-500">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="bg-[#1e293b] p-4 rounded-xl border border-[#334155] flex justify-between items-center">
            <span className="text-xs text-slate-400 font-bold">الرصيد المستحق الحالي:</span>
            <span className="text-lg font-black text-amber-400 font-mono">{formatCurrency(customer.currentBalance)}</span>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">المبلغ المحصّل (EGP) *</label>
            <input 
              required
              type="number" 
              step="0.01"
              className="w-full px-4 py-2.5 bg-[#1e293b] border border-[#334155] rounded-xl text-white outline-none focus:border-emerald-500 text-lg font-bold font-mono"
              value={amount}
              onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">رقم الإيصال / المرجع</label>
            <input 
              required
              type="text" 
              className="w-full px-4 py-2.5 bg-[#1e293b] border border-[#334155] rounded-xl text-white outline-none focus:border-emerald-500 font-mono"
              value={refNo}
              onChange={(e) => setRefNo(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">ملاحظات</label>
            <input 
              type="text" 
              className="w-full px-4 py-2.5 bg-[#1e293b] border border-[#334155] rounded-xl text-white outline-none focus:border-emerald-500"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div className="pt-4 flex gap-3">
            <button 
              type="submit"
              className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-xl font-bold shadow-lg shadow-emerald-600/20"
            >
              تأكيد التحصيل والقيد
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
