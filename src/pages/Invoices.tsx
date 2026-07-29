import React, { useEffect, useState } from 'react';
import { 
  Plus, 
  Search, 
  FileText, 
  Download, 
  Trash2, 
  Eye, 
  X, 
  User as UserIcon,
  Package,
  PlusCircle,
  MinusCircle,
  MessageCircle
} from 'lucide-react';
import { collection, onSnapshot, query, orderBy, addDoc, doc, getDocs, Timestamp, updateDoc, getDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { formatCurrency, formatDate, cn } from '../lib/utils';
import { toast } from 'react-hot-toast';

interface InvoiceItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
}

interface Invoice {
  id: string;
  customerId: string;
  customerName: string;
  items: InvoiceItem[];
  totalAmount: number;
  status: 'paid' | 'pending' | 'overdue';
  date: any;
  dueDate: any;
}

export const Invoices: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');

  useEffect(() => {
    const q = query(collection(db, 'invoices'), orderBy('date', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Invoice));
      setInvoices(list);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'invoices');
    });

    return () => unsubscribe();
  }, []);

  const filteredInvoices = invoices.filter(invoice => {
    const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;
    const matchesSearch = invoice.customerName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          invoice.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    let matchesDate = true;
    if (startDate || endDate) {
      const invoiceDate = invoice.date?.toDate ? invoice.date.toDate() : null;
      if (invoiceDate) {
        if (startDate && invoiceDate < new Date(startDate)) matchesDate = false;
        if (endDate) {
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999);
          if (invoiceDate > end) matchesDate = false;
        }
      } else {
        matchesDate = false;
      }
    }
    
    return matchesStatus && matchesSearch && matchesDate;
  });

  const markAsPaid = async (invoice: Invoice) => {
    try {
      const now = Timestamp.now();
      await updateDoc(doc(db, 'invoices', invoice.id), {
        status: 'paid'
      });

      if (invoice.customerId) {
        await updateDoc(doc(db, 'customers', invoice.customerId), {
          lastPurchaseDate: now
        });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `invoices/${invoice.id}`);
    }
  };

  const handleWhatsApp = async (invoice: Invoice) => {
    try {
      let phone = '';
      if (invoice.customerId) {
        const customerDoc = await getDoc(doc(db, 'customers', invoice.customerId));
        if (customerDoc.exists()) {
          phone = customerDoc.data().phone || '';
        }
      }
      
      if (!phone) {
        toast.error('لم يتم العثور على رقم هاتف العميل');
        const manualPhone = window.prompt('أدخل رقم الهاتف للعميل للتواصل عبر الواتس آب (يفضل مسبوقاً برمز الدولة مثل 2010...):');
        if (!manualPhone) return;
        phone = manualPhone;
      }
      
      phone = phone.replace(/[^0-9]/g, '');
      if (phone.startsWith('01')) phone = '2' + phone; 

      const text = `مرحباً بك، 
مرفق تفاصيل فاتورتك رقم #${invoice.id.slice(0, 8)}
الإجمالي: ${formatCurrency(invoice.totalAmount)}
الحالة: ${invoice.status === 'paid' ? 'مدفوعة' : 'مستحقة'}

شكراً لتعاملك معنا.`;

      const url = `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
      window.open(url, '_blank');
    } catch (error) {
      console.error(error);
      toast.error('حدث خطأ أثناء محاولة فتح الواتس آب');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black text-white tracking-tight">الفواتير والمبيعات</h2>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-2xl hover:bg-blue-500 transition-all font-bold shadow-lg shadow-blue-600/20 active:scale-95"
        >
          <Plus size={20} />
          <span>إنشاء فاتورة جديدة</span>
        </button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-[#151b2b] p-6 rounded-3xl border border-[#1e293b] shadow-xl">
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
          <input 
            type="text" 
            placeholder="بحث عن فاتورة أو عميل..." 
            className="w-full pr-10 pl-4 py-2 bg-[#0b0f1a] border border-[#1e293b] rounded-xl text-white focus:outline-none focus:border-blue-500 transition-all placeholder:text-slate-600 text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select 
          className="bg-[#0b0f1a] border border-[#1e293b] rounded-xl px-4 py-2 text-sm text-white outline-none focus:border-blue-500 transition-all appearance-none text-right"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">كل الحالات</option>
          <option value="paid">مدفوعة</option>
          <option value="pending">معلقة</option>
          <option value="overdue">متأخرة</option>
        </select>
        <div className="flex items-center gap-2">
          <span className="text-slate-500 text-xs font-bold whitespace-nowrap">من:</span>
          <input 
            type="date" 
            className="w-full bg-[#0b0f1a] border border-[#1e293b] rounded-xl px-4 py-2 text-xs text-white outline-none focus:border-blue-500 transition-all"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-slate-500 text-xs font-bold whitespace-nowrap">إلى:</span>
          <input 
            type="date" 
            className="w-full bg-[#0b0f1a] border border-[#1e293b] rounded-xl px-4 py-2 text-xs text-white outline-none focus:border-blue-500 transition-all"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-[#151b2b] rounded-3xl border border-[#1e293b] shadow-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead className="bg-[#0f172a]/50 text-slate-500 text-[10px] font-bold uppercase tracking-widest">
              <tr>
                <th className="px-8 py-5">رقم الفاتورة</th>
                <th className="px-8 py-5">العميل</th>
                <th className="px-8 py-5">المبلغ الإجمالي</th>
                <th className="px-8 py-5">الحالة</th>
                <th className="px-8 py-5">تاريخ الفاتورة</th>
                <th className="px-8 py-5">تاريخ الاستحقاق</th>
                <th className="px-8 py-5"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e293b]">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-8 py-16 text-center text-slate-600 font-medium tracking-tight">جاري التحميل...</td>
                </tr>
              ) : filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-8 py-16 text-center text-slate-600 font-medium tracking-tight">لا توجد فواتير تطابق البحث</td>
                </tr>
              ) : filteredInvoices.map((invoice) => (
                <tr key={invoice.id} className="hover:bg-slate-800/30 transition-colors group">
                  <td className="px-8 py-5 font-bold text-white tracking-tighter">#{invoice.id.slice(0, 8)}</td>
                  <td className="px-8 py-5 text-slate-400 font-medium">{invoice.customerName}</td>
                  <td className="px-8 py-5 font-black text-blue-400">{formatCurrency(invoice.totalAmount)}</td>
                  <td className="px-8 py-5">
                    <span className={cn(
                      "px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border",
                      invoice.status === 'paid' ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" :
                      invoice.status === 'pending' ? "bg-amber-500/10 text-amber-500 border-amber-500/20" :
                      "bg-red-500/10 text-red-500 border-red-500/20"
                    )}>
                      {invoice.status === 'paid' ? 'مدفوعة' : 
                       invoice.status === 'pending' ? 'معلقة' : 'متأخرة'}
                    </span>
                  </td>
                  <td className="px-8 py-5 text-slate-500 text-xs font-medium">
                    {invoice.date?.toDate ? formatDate(invoice.date.toDate()) : '---'}
                  </td>
                  <td className="px-8 py-5">
                    <div className={cn(
                      "text-xs font-medium px-2 py-1 rounded inline-block",
                      invoice.status !== 'paid' && invoice.dueDate?.toDate() < new Date() 
                        ? "text-red-400 bg-red-400/10 border border-red-400/20" 
                        : "text-slate-500"
                    )}>
                      {invoice.dueDate?.toDate ? formatDate(invoice.dueDate.toDate()) : '---'}
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-3 justify-end">
                      {invoice.status !== 'paid' && (
                        <button 
                          onClick={() => markAsPaid(invoice)}
                          className="p-2.5 hover:bg-emerald-500/10 text-emerald-400 rounded-xl transition-colors"
                          title="تحديد كمدفوع"
                        >
                          <PlusCircle size={18} />
                        </button>
                      )}
                      <button 
                        onClick={() => handleWhatsApp(invoice)}
                        className="p-2.5 hover:bg-green-500/10 text-green-400 rounded-xl transition-colors"
                        title="إرسال عبر الواتس آب"
                      >
                        <MessageCircle size={18} />
                      </button>
                      <button className="p-2.5 hover:bg-blue-500/10 text-blue-400 rounded-xl transition-colors">
                        <Eye size={18} />
                      </button>
                      <button className="p-2.5 hover:bg-emerald-500/10 text-emerald-400 rounded-xl transition-colors">
                        <Download size={18} />
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
        <InvoiceModal 
          onClose={() => setIsModalOpen(false)} 
        />
      )}
    </div>
  );
};

const InvoiceModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [customers, setCustomers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [invoiceItems, setInvoiceItems] = useState<InvoiceItem[]>([]);
  const [status, setStatus] = useState<'paid' | 'pending' | 'overdue'>('pending');
  const [dueDate, setDueDate] = useState<string>(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);

  useEffect(() => {
    const fetchData = async () => {
      const custSnap = await getDocs(collection(db, 'customers'));
      setCustomers(custSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      
      const prodSnap = await getDocs(collection(db, 'products'));
      setProducts(prodSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    };
    fetchData();
  }, []);

  const addItem = (product: any) => {
    const existing = invoiceItems.find(item => item.productId === product.id);
    if (existing) {
      setInvoiceItems(invoiceItems.map(item => 
        item.productId === product.id ? { ...item, quantity: item.quantity + 1 } : item
      ));
    } else {
      setInvoiceItems([...invoiceItems, { 
        productId: product.id, 
        name: product.name, 
        price: product.price, 
        quantity: 1 
      }]);
    }
  };

  const removeItem = (productId: string) => {
    setInvoiceItems(invoiceItems.filter(item => item.productId !== productId));
  };

  const updateQuantity = (productId: string, delta: number) => {
    setInvoiceItems(invoiceItems.map(item => {
      if (item.productId === productId) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const totalAmount = invoiceItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerId || invoiceItems.length === 0) return;

    const customer = customers.find(c => c.id === selectedCustomerId);

    try {
      const now = Timestamp.now();
      const dueTimestamp = Timestamp.fromDate(new Date(dueDate));
      await addDoc(collection(db, 'invoices'), {
        customerId: selectedCustomerId,
        customerName: customer?.name || 'غير معروف',
        items: invoiceItems,
        totalAmount,
        status,
        date: now,
        dueDate: dueTimestamp,
      });

      // Update customer's last purchase date
      await updateDoc(doc(db, 'customers', selectedCustomerId), {
        lastPurchaseDate: now
      });

      onClose();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'invoices');
    }
  };

  return (
    <div className="fixed inset-0 bg-[#0b0f1a]/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#151b2b] w-full max-w-6xl rounded-3xl border border-[#1e293b] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] relative">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 to-emerald-600"></div>
        <div className="p-8 border-b border-[#1e293b] flex items-center justify-between bg-[#0f172a]/50">
          <h3 className="font-black text-2xl text-white tracking-tight">إنشاء فاتورة جديدة</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-xl text-slate-500 transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Form Side */}
          <div className="lg:col-span-2 space-y-8">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">العميل</label>
                <select 
                  required
                  className="w-full px-4 py-3 bg-[#1e293b] border border-[#334155] rounded-2xl text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all appearance-none"
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                >
                  <option value="">اختر عميلاً...</option>
                  {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">حالة الفاتورة</label>
                <select 
                  className="w-full px-4 py-3 bg-[#1e293b] border border-[#334155] rounded-2xl text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all appearance-none"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                >
                  <option value="pending">معلقة</option>
                  <option value="paid">مدفوعة</option>
                  <option value="overdue">متأخرة</option>
                </select>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">تاريخ الاستحقاق</label>
                <input 
                  type="date"
                  required
                  className="w-full px-4 py-3 bg-[#1e293b] border border-[#334155] rounded-2xl text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-bold text-white flex items-center gap-2 text-sm uppercase tracking-wider">
                <Package size={18} className="text-blue-500" />
                عناصر الفاتورة
              </h4>
              <div className="bg-[#0f172a]/30 border border-[#1e293b] rounded-2xl overflow-hidden">
                <table className="w-full text-right text-sm">
                  <thead className="bg-slate-900/50 text-slate-500 text-[10px] font-bold uppercase tracking-widest">
                    <tr>
                      <th className="px-6 py-4">المنتج</th>
                      <th className="px-6 py-4">السعر</th>
                      <th className="px-6 py-4">الكمية</th>
                      <th className="px-6 py-4">الإجمالي</th>
                      <th className="px-6 py-4"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1e293b]">
                    {invoiceItems.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-slate-600 italic">لا توجد عناصر مضافة</td>
                      </tr>
                    ) : invoiceItems.map((item) => (
                      <tr key={item.productId} className="hover:bg-slate-800/20 transition-colors">
                        <td className="px-6 py-4 font-bold text-white">{item.name}</td>
                        <td className="px-6 py-4 text-slate-400">{formatCurrency(item.price)}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3 justify-end">
                            <button onClick={() => updateQuantity(item.productId, -1)} className="text-slate-500 hover:text-red-400 transition-colors"><MinusCircle size={18} /></button>
                            <span className="w-8 text-center font-black text-white">{item.quantity}</span>
                            <button onClick={() => updateQuantity(item.productId, 1)} className="text-slate-500 hover:text-blue-400 transition-colors"><PlusCircle size={18} /></button>
                          </div>
                        </td>
                        <td className="px-6 py-4 font-black text-blue-400">{formatCurrency(item.price * item.quantity)}</td>
                        <td className="px-6 py-4">
                          <button onClick={() => removeItem(item.productId)} className="text-red-500 hover:bg-red-500/10 p-2 rounded-xl transition-colors"><Trash2 size={18} /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Products Selection Side */}
          <div className="bg-[#0f172a]/50 rounded-3xl p-6 flex flex-col gap-6 border border-[#1e293b]">
            <h4 className="font-bold text-white text-sm uppercase tracking-wider">قائمة المنتجات</h4>
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
              <input 
                type="text" 
                placeholder="بحث عن منتج..." 
                className="w-full pr-10 pl-4 py-3 bg-[#1e293b] border border-[#334155] rounded-xl text-sm text-white focus:outline-none focus:border-blue-500 transition-all"
              />
            </div>
            <div className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar">
              {products.map(p => (
                <button 
                  key={p.id}
                  onClick={() => addItem(p)}
                  className="w-full text-right p-4 bg-[#1e293b] border border-[#334155] rounded-2xl hover:border-blue-500/50 hover:bg-[#252f44] transition-all group relative overflow-hidden"
                >
                  <div className="font-bold text-slate-200 group-hover:text-white transition-colors">{p.name}</div>
                  <div className="text-[10px] text-slate-500 mt-2 flex justify-between font-bold uppercase tracking-wider">
                    <span className="text-blue-400">{formatCurrency(p.price)}</span>
                    <span>المخزون: {p.quantity}</span>
                  </div>
                </button>
              ))}
            </div>
            <div className="pt-6 border-t border-[#1e293b]">
              <div className="flex justify-between items-center mb-6">
                <span className="text-slate-500 font-bold text-xs uppercase tracking-widest">المجموع الكلي</span>
                <span className="text-2xl font-black text-emerald-500 tracking-tighter">{formatCurrency(totalAmount)}</span>
              </div>
              <button 
                onClick={handleSubmit}
                disabled={!selectedCustomerId || invoiceItems.length === 0}
                className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-600 disabled:cursor-not-allowed transition-all shadow-xl shadow-blue-600/20 active:scale-95 uppercase tracking-widest"
              >
                حفظ الفاتورة
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
