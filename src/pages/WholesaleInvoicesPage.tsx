import React, { useState, useEffect } from 'react';
import { 
  Layers, Plus, Search, FileText, Printer, CheckCircle, 
  Building2, UserCheck, DollarSign, Package, ArrowRight, ShieldAlert, Send
} from 'lucide-react';
import { SalesInvoice, SalesInvoiceItem, Customer } from '../types/sprint8';
import { ProductMaster } from '../types/productMaster';
import { CustomerRepository } from '../repositories/customerRepository';
import { ProductRepository } from '../repositories/productRepository';
import { MaroSyncEngine } from '../lib/maroSyncEngine';
import { formatCurrency, formatDate, cn } from '../lib/utils';
import { toast } from 'react-hot-toast';

export const WholesaleInvoicesPage: React.FC = () => {
  const [invoices, setInvoices] = useState<SalesInvoice[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<ProductMaster[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);

  // New Wholesale Invoice State
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [salesRep, setSalesRep] = useState('أحمد ممدوح (مندوب أول)');
  const [warehouse, setWarehouse] = useState('مستودع الجملة الرئيسي - برج العرب');
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'CREDIT'>('CREDIT');
  const [cart, setCart] = useState<Array<{
    product: ProductMaster;
    unit: 'قطعة' | 'كرتونة' | 'دستة' | 'بالته';
    quantity: number;
    unitPrice: number;
    discountPercent: number;
  }>>([]);

  useEffect(() => {
    loadData();
    const unsub = MaroSyncEngine.subscribe<SalesInvoice>('invoices', (data) => {
      setInvoices((data || []).filter(inv => inv.type === 'WHOLESALE'));
    });
    return () => unsub();
  }, []);

  const loadData = () => {
    setCustomers(CustomerRepository.getCustomers());
    setProducts(ProductRepository.getProducts());
    const allInvs = MaroSyncEngine.getLocalCollection<SalesInvoice>('invoices');
    setInvoices(allInvs.filter(inv => inv.type === 'WHOLESALE'));
  };

  const handleAddProductToCart = (prod: ProductMaster) => {
    const existing = cart.find(item => item.product.id === prod.id);
    if (existing) {
      setCart(cart.map(item => item.product.id === prod.id ? { ...item, quantity: item.quantity + 1 } : item));
    } else {
      setCart([...cart, {
        product: prod,
        unit: 'كرتونة',
        quantity: 5,
        unitPrice: prod.price * 0.85, // Wholesale discounted price
        discountPercent: 5
      }]);
    }
    toast.success(`تم إضافة "${prod.name}" لفاتورة الجملة`);
  };

  const calculateTotals = () => {
    let subtotal = 0;
    cart.forEach(item => {
      let multiplier = 1;
      if (item.unit === 'كرتونة') multiplier = 12;
      if (item.unit === 'دستة') multiplier = 12;
      if (item.unit === 'بالته') multiplier = 120;
      
      const lineTotal = item.quantity * multiplier * item.unitPrice * (1 - item.discountPercent / 100);
      subtotal += lineTotal;
    });
    const tax = subtotal * 0.14;
    return { subtotal, tax, grandTotal: subtotal + tax };
  };

  const handleSaveWholesaleInvoice = () => {
    if (!selectedCustomer) {
      toast.error('يرجى اختيار عميل الجملة');
      return;
    }
    if (cart.length === 0) {
      toast.error('السلة فارغة');
      return;
    }

    const { subtotal, tax, grandTotal } = calculateTotals();

    // Check credit limit if credit invoice
    if (paymentMethod === 'CREDIT' && selectedCustomer.creditLimit && selectedCustomer.currentBalance && (selectedCustomer.currentBalance + grandTotal > selectedCustomer.creditLimit)) {
      toast.error(`⚠️ تحذير: الفاتورة تتجاوز الحد الائتماني للعميل (${formatCurrency(selectedCustomer.creditLimit)})!`);
    }

    const newInvoice: SalesInvoice = {
      id: 'wh_inv_' + Date.now(),
      invoiceNumber: 'WH-INV-' + Math.floor(100000 + Math.random() * 900000),
      type: 'WHOLESALE',
      branchId: 'branch_main',
      warehouseId: 'wh_main',
      warehouseName: warehouse,
      customerId: selectedCustomer.id,
      customerName: selectedCustomer.name,
      items: cart.map(item => ({
        id: 'item_' + Math.random(),
        productId: item.product.id,
        productName: item.product.name,
        sku: item.product.sku,
        unitName: item.unit,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discountPercent: item.discountPercent,
        lineTotal: item.quantity * item.unitPrice * (1 - item.discountPercent / 100)
      })) as any,
      totalUntaxed: subtotal,
      totalTax: tax,
      totalDiscount: 0,
      grandTotal: grandTotal,
      paidAmount: paymentMethod === 'CASH' ? grandTotal : 0,
      dueAmount: paymentMethod === 'CASH' ? 0 : grandTotal,
      paymentMethod: paymentMethod,
      status: paymentMethod === 'CASH' ? 'PAID' : 'APPROVED',
      notes: `مندوب المبيعات: ${salesRep} | المستودع: ${warehouse}`,
      createdAt: new Date().toISOString()
    };

    MaroSyncEngine.saveDocument('invoices', newInvoice);
    toast.success(`تم اصدار فاتورة الجملة رقم ${newInvoice.invoiceNumber} بنجاح وإنشاء إذن التسليم المخزني!`);
    setIsNewModalOpen(false);
    setCart([]);
    loadData();
  };

  const { subtotal, tax, grandTotal } = calculateTotals();

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="bg-[#151b2b] p-8 rounded-3xl border border-[#1e293b] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-1">
            <Layers size={16} />
            <span>قسم إدارة المبيعات المركزية وتوزيع الجملة (B2B Wholesale Hub)</span>
          </div>
          <h1 className="text-2xl font-black text-white">فواتير البيع بالجملة وإدارة الموزعين</h1>
          <p className="text-slate-400 text-xs mt-1">
            إصدار الفواتير الآجلة والنقدية، تحديد وحدات التعبئة (كرتونة، بالته)، متابعة مناديب المبيعات والحدود الائتمانية.
          </p>
        </div>
        <button
          onClick={() => setIsNewModalOpen(true)}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-2xl font-bold text-xs shadow-lg shadow-emerald-900/30 transition-all hover:scale-105"
        >
          <Plus size={18} />
          <span>إصدار فاتورة جملة جديدة (B2B)</span>
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-[#151b2b] p-5 rounded-2xl border border-[#1e293b]">
          <p className="text-xs font-bold text-slate-500 uppercase">إجمالي مبيعات الجملة</p>
          <p className="text-2xl font-black text-white mt-1">
            {formatCurrency(invoices.reduce((acc, i) => acc + i.grandTotal, 0))}
          </p>
        </div>
        <div className="bg-[#151b2b] p-5 rounded-2xl border border-[#1e293b]">
          <p className="text-xs font-bold text-slate-500 uppercase">عدد فواتير الجملة الصادرة</p>
          <p className="text-2xl font-black text-emerald-400 mt-1">{invoices.length}</p>
        </div>
        <div className="bg-[#151b2b] p-5 rounded-2xl border border-[#1e293b]">
          <p className="text-xs font-bold text-slate-500 uppercase">المديونيات الآجلة للتحصيل</p>
          <p className="text-2xl font-black text-amber-400 mt-1">
            {formatCurrency(invoices.reduce((acc, i) => acc + (i.dueAmount || 0), 0))}
          </p>
        </div>
        <div className="bg-[#151b2b] p-5 rounded-2xl border border-[#1e293b]">
          <p className="text-xs font-bold text-slate-500 uppercase">ضريبة القيمة المضافة (14%)</p>
          <p className="text-2xl font-black text-blue-400 mt-1">
            {formatCurrency(invoices.reduce((acc, i) => acc + i.totalTax, 0))}
          </p>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-[#151b2b] rounded-2xl border border-[#1e293b] overflow-hidden shadow-xl">
        <div className="p-4 border-b border-[#1e293b] flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input
              type="text"
              placeholder="بحث برقم الفاتورة أو اسم عميل الجملة..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pr-10 pl-4 py-2 bg-[#0f172a] border border-[#1e293b] rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500"
            />
          </div>
          <div className="text-xs text-slate-400 font-bold">
            عرض {invoices.length} فاتورة جملة مسجلة
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead className="bg-slate-900/50 text-slate-500 text-[10px] font-bold uppercase tracking-widest">
              <tr>
                <th className="px-6 py-4">رقم الفاتورة</th>
                <th className="px-6 py-4">عميل الجملة / الموزع</th>
                <th className="px-6 py-4">ملاحظات ومندوب المبيعات</th>
                <th className="px-6 py-4">طريقة السداد</th>
                <th className="px-6 py-4">الإجمالي الشامل</th>
                <th className="px-6 py-4">المتبقي (آجل)</th>
                <th className="px-6 py-4">الحالة</th>
                <th className="px-6 py-4 text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e293b]">
              {invoices.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-slate-600 font-bold">
                    لا توجد فواتير بيع جملة مسجلة حتى الآن. انقر على "إصدار فاتورة جملة جديدة".
                  </td>
                </tr>
              ) : (
                invoices.map(inv => (
                  <tr key={inv.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4 font-mono font-bold text-white">{inv.invoiceNumber}</td>
                    <td className="px-6 py-4 font-bold text-slate-200">{inv.customerName}</td>
                    <td className="px-6 py-4 text-xs text-slate-400">{inv.notes || 'غير محدد'}</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 rounded bg-slate-800 text-xs text-slate-300 font-mono">
                        {inv.paymentMethod === 'CASH' ? 'نقدي' : 'آجل (Credit)'}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono font-black text-emerald-400">{formatCurrency(inv.grandTotal)}</td>
                    <td className="px-6 py-4 font-mono text-amber-400">{formatCurrency(inv.dueAmount || 0)}</td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "px-2.5 py-1 rounded-lg text-xs font-bold border inline-block",
                        inv.status === 'PAID' ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                      )}>
                        {inv.status === 'PAID' ? 'مدفوعة بالكامل' : 'مستحقة (آجلة)'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => toast.success(`جاري طباعة إذن التسليم والفاتورة رقم ${inv.invoiceNumber}`)}
                        className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors inline-flex items-center gap-1 text-xs font-bold"
                      >
                        <Printer size={14} />
                        <span>طباعة</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Wholesale Invoice Modal */}
      {isNewModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#151b2b] border border-[#1e293b] w-full max-w-5xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-[#1e293b] flex items-center justify-between bg-slate-900/40">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-emerald-600/20 text-emerald-400 rounded-2xl">
                  <FileText size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">إصدار فاتورة بيع جملة جديدة (B2B Wholesale Invoice)</h3>
                  <p className="text-xs text-slate-400">إدخال وحدات كرتونية، خصومات شرائح، وتحقق ائتماني تلقائي.</p>
                </div>
              </div>
              <button 
                onClick={() => setIsNewModalOpen(false)}
                className="p-2 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              {/* Customer & Rep Selection */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">عميل الجملة / الموزع</label>
                  <select
                    className="w-full p-3 bg-[#0f172a] border border-[#1e293b] rounded-xl text-white text-xs font-bold focus:outline-none focus:border-emerald-500"
                    onChange={(e) => {
                      const cust = customers.find(c => c.id === e.target.value);
                      setSelectedCustomer(cust || null);
                    }}
                  >
                    <option value="">-- اختر عميل الجملة --</option>
                    {customers.map(c => (
                      <option key={c.id} value={c.id}>{c.name} (حد ائتماني: {formatCurrency(c.creditLimit)})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">مندوب المبيعات المسؤول</label>
                  <input
                    type="text"
                    value={salesRep}
                    onChange={(e) => setSalesRep(e.target.value)}
                    className="w-full p-3 bg-[#0f172a] border border-[#1e293b] rounded-xl text-white text-xs font-bold focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">المستودع الصادر منه البضاعة</label>
                  <input
                    type="text"
                    value={warehouse}
                    onChange={(e) => setWarehouse(e.target.value)}
                    className="w-full p-3 bg-[#0f172a] border border-[#1e293b] rounded-xl text-white text-xs font-bold focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">طريقة السداد</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as any)}
                    className="w-full p-3 bg-[#0f172a] border border-[#1e293b] rounded-xl text-white text-xs font-bold focus:outline-none focus:border-emerald-500"
                  >
                    <option value="CASH">نقدي (سداد فوري)</option>
                    <option value="CREDIT">آجل (Credit Account)</option>
                  </select>
                </div>
              </div>

              {/* Product Selector Bar */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-300 uppercase">إضافة منتجات من المستودع</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-h-48 overflow-y-auto p-2 bg-[#0f172a] rounded-2xl border border-[#1e293b]">
                  {products.map(prod => (
                    <div 
                      key={prod.id}
                      onClick={() => handleAddProductToCart(prod)}
                      className="p-3 bg-[#151b2b] border border-[#1e293b] hover:border-emerald-500 rounded-xl cursor-pointer transition-all flex flex-col justify-between"
                    >
                      <div>
                        <div className="font-bold text-white text-xs truncate">{prod.name}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">SKU: {prod.sku}</div>
                      </div>
                      <div className="flex items-center justify-between mt-3 text-xs">
                        <span className="font-mono text-emerald-400 font-bold">{formatCurrency(prod.price)}</span>
                        <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded font-bold">+ إضافة</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Cart Items Table */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-300 uppercase">بنود الفاتورة (مع وحدات التعبئة)</h4>
                <div className="bg-[#0f172a] rounded-2xl border border-[#1e293b] overflow-hidden">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-slate-900/60 text-slate-400">
                      <tr>
                        <th className="p-3">المنتج</th>
                        <th className="p-3">وحدة البيع</th>
                        <th className="p-3">الكمية</th>
                        <th className="p-3">سعر الوحدة بالجملة</th>
                        <th className="p-3">خصم (%)</th>
                        <th className="p-3">الإجمالي</th>
                        <th className="p-3 text-center">إزالة</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1e293b]">
                      {cart.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="p-6 text-center text-slate-500">
                            اختر منتجات من الأعلى لإضافتها لفاتورة الجملة.
                          </td>
                        </tr>
                      ) : (
                        cart.map((item, index) => {
                          let mult = 1;
                          if (item.unit === 'كرتونة') mult = 12;
                          if (item.unit === 'دستة') mult = 12;
                          if (item.unit === 'بالته') mult = 120;
                          const lineT = item.quantity * mult * item.unitPrice * (1 - item.discountPercent / 100);

                          return (
                            <tr key={index}>
                              <td className="p-3 font-bold text-white">{item.product.name}</td>
                              <td className="p-3">
                                <select 
                                  value={item.unit}
                                  onChange={(e) => {
                                    const updated = [...cart];
                                    updated[index].unit = e.target.value as any;
                                    setCart(updated);
                                  }}
                                  className="bg-[#151b2b] border border-[#1e293b] text-white rounded p-1 text-xs"
                                >
                                  <option value="قطعة">قطعة</option>
                                  <option value="كرتونة">كرتونة (12 قطعة)</option>
                                  <option value="دستة">دستة (12 قطعة)</option>
                                  <option value="بالته">بالته (120 قطعة)</option>
                                </select>
                              </td>
                              <td className="p-3">
                                <input
                                  type="number"
                                  value={item.quantity}
                                  min={1}
                                  onChange={(e) => {
                                    const updated = [...cart];
                                    updated[index].quantity = Number(e.target.value);
                                    setCart(updated);
                                  }}
                                  className="w-16 bg-[#151b2b] border border-[#1e293b] text-white rounded p-1 text-xs font-mono"
                                />
                              </td>
                              <td className="p-3">
                                <input
                                  type="number"
                                  value={item.unitPrice}
                                  onChange={(e) => {
                                    const updated = [...cart];
                                    updated[index].unitPrice = Number(e.target.value);
                                    setCart(updated);
                                  }}
                                  className="w-24 bg-[#151b2b] border border-[#1e293b] text-emerald-400 rounded p-1 text-xs font-mono font-bold"
                                />
                              </td>
                              <td className="p-3">
                                <input
                                  type="number"
                                  value={item.discountPercent}
                                  min={0}
                                  max={100}
                                  onChange={(e) => {
                                    const updated = [...cart];
                                    updated[index].discountPercent = Number(e.target.value);
                                    setCart(updated);
                                  }}
                                  className="w-16 bg-[#151b2b] border border-[#1e293b] text-amber-400 rounded p-1 text-xs font-mono"
                                />
                              </td>
                              <td className="p-3 font-mono font-black text-white">{formatCurrency(lineT)}</td>
                              <td className="p-3 text-center">
                                <button
                                  onClick={() => setCart(cart.filter((_, i) => i !== index))}
                                  className="text-red-400 hover:text-red-300 font-bold"
                                >
                                  ✕
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Totals Box */}
              <div className="p-5 rounded-2xl bg-[#0f172a] border border-[#1e293b] flex items-center justify-between">
                <div className="space-y-1 text-xs text-slate-400">
                  <div>الصافي قبل الضريبة: <span className="font-mono text-white font-bold">{formatCurrency(subtotal)}</span></div>
                  <div>ضريبة القيمة المضافة (14%): <span className="font-mono text-blue-400 font-bold">{formatCurrency(tax)}</span></div>
                </div>
                <div className="text-left">
                  <div className="text-xs text-slate-400 font-bold">الإجمالي الشامل النهائي:</div>
                  <div className="text-2xl font-black text-emerald-400 font-mono">{formatCurrency(grandTotal)}</div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-[#1e293b] bg-slate-900/60 flex items-center justify-end gap-3">
              <button
                onClick={() => setIsNewModalOpen(false)}
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-all"
              >
                إلغاء
              </button>
              <button
                onClick={handleSaveWholesaleInvoice}
                className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-900/30 transition-all hover:scale-105"
              >
                حفظ وإصدار الفاتورة وإذن التسليم
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
