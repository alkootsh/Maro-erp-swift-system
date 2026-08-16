/**
 * @file Invoices.tsx
 * @module واجهات وصفحات النظام (UI Pages)
 * @description ملف جزء من نظام MARO ERP. الوظيفة: Invoices.tsx.
 */
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, 
  Search, 
  Eye, 
  X, 
  PlusCircle,
  MinusCircle,
  Printer,
  QrCode,
  Send,
  MessageSquare,
  Store,
  Download
} from 'lucide-react';
import { SalesInvoice, SalesInvoiceItem, Customer } from '../types/sprint8';
import { ProductMaster } from '../types/productMaster';
import { CustomerRepository } from '../repositories/customerRepository';
import { ProductRepository } from '../repositories/productRepository';
import { CreateSalesInvoiceCommand } from '../cqrs/commands';
import { MaroSyncEngine } from '../lib/maroSyncEngine';
import { formatCurrency, formatDate, cn } from '../lib/utils';
import { usbScannerEngine } from '../services/usbScannerEngine';
import { USBScannerBadge, USBScannerModal } from '../components/USBBarcodeScannerManager';
import { WhatsAppNotificationService } from '../services/whatsappNotificationService';
import { handleSmartKeyDown, getNumericInputProps, handleInputFocus } from '../lib/smartKeyboardEngine';
import { exportToExcel } from '../lib/excel';
import { printSalesInvoice } from '../lib/invoicePrinter';

export const Invoices: React.FC = () => {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState<SalesInvoice[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUSBManagerOpen, setIsUSBManagerOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<SalesInvoice | null>(null);

  useEffect(() => {
    // Reactive subscription to local sales invoices store
    const unsubscribe = MaroSyncEngine.subscribe<SalesInvoice>('invoices', (data) => {
      setInvoices(data || []);
    });
    return () => unsubscribe();
  }, []);

  const filteredInvoices = invoices.filter(inv => 
    inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (inv.customerName && inv.customerName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const totalSalesRevenue = invoices.reduce((sum, inv) => sum + (inv.grandTotal || 0), 0);
  const totalTaxAmount = invoices.reduce((sum, inv) => sum + (inv.totalTax || 0), 0);
  const totalPaidAmount = invoices.reduce((sum, inv) => sum + (inv.paidAmount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Top Header Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-[#151b2b] p-5 rounded-2xl border border-[#1e293b]">
          <p className="text-xs font-bold text-slate-500 uppercase">إجمالي المبيعات</p>
          <p className="text-2xl font-black text-white mt-1">{formatCurrency(totalSalesRevenue)}</p>
        </div>
        <div className="bg-[#151b2b] p-5 rounded-2xl border border-[#1e293b]">
          <p className="text-xs font-bold text-slate-500 uppercase">ضريبة المبيعات المحصلة (VAT 14%)</p>
          <p className="text-2xl font-black text-emerald-400 mt-1">{formatCurrency(totalTaxAmount)}</p>
        </div>
        <div className="bg-[#151b2b] p-5 rounded-2xl border border-[#1e293b]">
          <p className="text-xs font-bold text-slate-500 uppercase">إجمالي المحصل نقداً</p>
          <p className="text-2xl font-black text-blue-400 mt-1">{formatCurrency(totalPaidAmount)}</p>
        </div>
        <div className="bg-[#151b2b] p-5 rounded-2xl border border-[#1e293b]">
          <p className="text-xs font-bold text-slate-500 uppercase">عدد الفواتير الصادرة</p>
          <p className="text-2xl font-black text-amber-400 mt-1">{invoices.length}</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
          <input 
            type="text" 
            placeholder="بحث برقم الفاتورة أو اسم العميل..." 
            className="w-full pr-10 pl-4 py-2.5 bg-[#151b2b] border border-[#1e293b] rounded-xl text-white focus:outline-none focus:border-blue-500 transition-all placeholder:text-slate-600"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => navigate('/b2b-portal')}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl transition-all font-bold shadow-lg shadow-purple-600/20 active:scale-95 text-xs"
          >
            <Store size={16} />
            <span>طلبات المتجر الواردة (B2B)</span>
          </button>
          <USBScannerBadge onClick={() => setIsUSBManagerOpen(true)} />
          <button 
            onClick={() => {
              if (filteredInvoices.length === 0) return;
              const formatted = filteredInvoices.map(inv => ({
                'رقم الفاتورة': inv.invoiceNumber,
                'اسم العميل': inv.customerName || 'عميل نقدي',
                'الصافي (بدون ضريبة)': inv.totalUntaxed,
                'الضريبة (VAT 14%)': inv.totalTax,
                'الإجمالي الشامل': inv.grandTotal,
                'المبلغ المدفوع': inv.paidAmount || 0,
                'المتبقي المستحق': (inv.grandTotal || 0) - (inv.paidAmount || 0),
                'تاريخ الفاتورة': formatDate(new Date(inv.createdAt)),
                'الحالة': inv.status === 'PAID' ? 'مدفوعة' : 'مسودة / معلقة'
              }));
              exportToExcel(formatted, `maro_sales_invoices_${new Date().toISOString().split('T')[0]}`);
            }}
            disabled={filteredInvoices.length === 0}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl transition-all font-bold shadow-lg shadow-emerald-600/20 active:scale-95 text-xs"
          >
            <Download size={16} />
            <span>تصدير الفواتير Excel</span>
          </button>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-500 transition-all font-bold shadow-lg shadow-blue-600/20 active:scale-95 text-xs"
          >
            <Plus size={18} />
            <span>إنشاء فاتورة مبيعات جديدة</span>
          </button>
        </div>
      </div>

      <div className="bg-[#151b2b] rounded-2xl border border-[#1e293b] shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead className="bg-slate-900/50 text-slate-500 text-[10px] font-bold uppercase tracking-widest">
              <tr>
                <th className="px-6 py-4">رقم الفاتورة</th>
                <th className="px-6 py-4">العميل</th>
                <th className="px-6 py-4">الصافي بدون ضريبة</th>
                <th className="px-6 py-4">الضريبة (14%)</th>
                <th className="px-6 py-4">الإجمالي الشامل</th>
                <th className="px-6 py-4">الحالة</th>
                <th className="px-6 py-4">التاريخ</th>
                <th className="px-6 py-4 text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e293b]">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-slate-600 font-bold">لا توجد فواتير مبيعات سابقة</td>
                </tr>
              ) : filteredInvoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-slate-800/30 transition-colors group">
                  <td className="px-6 py-4 font-mono font-bold text-white">{inv.invoiceNumber}</td>
                  <td className="px-6 py-4 font-bold text-slate-300">{inv.customerName || 'عميل نقدي'}</td>
                  <td className="px-6 py-4 font-mono text-slate-400">{formatCurrency(inv.totalUntaxed)}</td>
                  <td className="px-6 py-4 font-mono text-emerald-400">{formatCurrency(inv.totalTax)}</td>
                  <td className="px-6 py-4 font-mono font-black text-blue-400 text-base">{formatCurrency(inv.grandTotal)}</td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "px-2.5 py-1 rounded-lg text-xs font-bold border inline-block",
                      inv.status === 'PAID' ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                      inv.status === 'PARTIALLY_PAID' ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
                      "bg-red-500/10 text-red-400 border-red-500/20"
                    )}>
                      {inv.status === 'PAID' ? 'مدفوعة كاملة' : inv.status === 'PARTIALLY_PAID' ? 'مدفوعة جزئياً' : 'آجلة (غير مدفوعة)'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-500 text-xs font-mono">{formatDate(new Date(inv.createdAt))}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 justify-center">
                      <button 
                        onClick={() => setSelectedInvoice(inv)}
                        className="p-2 hover:bg-blue-500/10 text-blue-400 rounded-lg transition-colors"
                        title="عرض تفاصيل ومعاينة Fatoora"
                      >
                        <Eye size={18} />
                      </button>
                      <button 
                        onClick={() => {
                          const customer = CustomerRepository.getCustomerById(inv.customerId);
                          const targetPhone = customer?.phone || prompt('أدخل رقم هاتف الواتساب الخاص بالعميل:', '') || '';
                          if (targetPhone) {
                            const msg = WhatsAppNotificationService.formatSalesInvoiceWhatsApp(inv);
                            WhatsAppNotificationService.openWhatsAppDirectly(targetPhone, msg);
                          }
                        }}
                        className="p-2 hover:bg-emerald-500/10 text-emerald-400 rounded-lg transition-colors flex items-center gap-1"
                        title="إرسال الفاتورة للعميل عبر الواتساب"
                      >
                        <Send size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invoice Form Modal */}
      {isModalOpen && (
        <CreateInvoiceModal onClose={() => setIsModalOpen(false)} />
      )}

      {/* Invoice Detail & ZATCA QR Modal */}
      {selectedInvoice && (
        <InvoiceDetailModal invoice={selectedInvoice} onClose={() => setSelectedInvoice(null)} />
      )}

      {/* USB/Bluetooth Scanner Manager Modal */}
      <USBScannerModal isOpen={isUSBManagerOpen} onClose={() => setIsUSBManagerOpen(false)} />
    </div>
  );
};

const CreateInvoiceModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<ProductMaster[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(() => {
    return localStorage.getItem('maro_invoice_draft_customerId') || '';
  });
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'CARD' | 'CREDIT' | 'SPLIT'>(() => {
    return (localStorage.getItem('maro_invoice_draft_paymentMethod') as any) || 'CASH';
  });
  const [items, setItems] = useState<SalesInvoiceItem[]>(() => {
    try {
      const saved = localStorage.getItem('maro_invoice_draft_items');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    setCustomers(CustomerRepository.getCustomers());
    setProducts(ProductRepository.getProducts());
  }, []);

  // Auto-save draft effect
  useEffect(() => {
    localStorage.setItem('maro_invoice_draft_customerId', selectedCustomerId);
    localStorage.setItem('maro_invoice_draft_paymentMethod', paymentMethod);
    localStorage.setItem('maro_invoice_draft_items', JSON.stringify(items));
  }, [selectedCustomerId, paymentMethod, items]);

  useEffect(() => {
    const unsubUSB = usbScannerEngine.subscribe((parsedResult) => {
      if (parsedResult.product) {
        handleAddItem(parsedResult.product, parsedResult.quantity);
      }
    });
    return () => unsubUSB();
  }, [products, items]);

  const handleAddItem = (prod: ProductMaster, qty: number = 1) => {
    const existingIndex = items.findIndex(i => i.productId === prod.id);
    if (existingIndex >= 0) {
      const updated = [...items];
      updated[existingIndex].quantity += qty;
      const untaxed = updated[existingIndex].quantity * updated[existingIndex].unitPrice * (1 - (updated[existingIndex].discountPercent || 0) / 100);
      updated[existingIndex].lineTotal = untaxed * 1.14;
      setItems(updated);
    } else {
      const price = prod.price || 0;
      const addQty = qty > 0 ? qty : 1;
      const untaxed = addQty * price;
      setItems([...items, {
        id: `sii_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        productId: prod.id,
        productName: prod.name,
        sku: prod.sku,
        unitName: 'قطعة',
        quantity: addQty,
        unitPrice: price,
        costPrice: prod.costPrice || 0,
        discountPercent: 0,
        taxRate: 14,
        lineTotal: untaxed * 1.14
      }]);
    }
  };

  const handleUpdateQty = (index: number, delta: number) => {
    const updated = [...items];
    const newQty = updated[index].quantity + delta;
    if (newQty <= 0) {
      updated.splice(index, 1);
    } else {
      updated[index].quantity = newQty;
      const untaxed = updated[index].quantity * updated[index].unitPrice * (1 - (updated[index].discountPercent || 0) / 100);
      updated[index].lineTotal = untaxed * 1.14;
    }
    setItems(updated);
  };

  const handleUpdateDiscount = (index: number, discountPercent: number) => {
    const updated = [...items];
    updated[index].discountPercent = discountPercent;
    const untaxed = updated[index].quantity * updated[index].unitPrice * (1 - discountPercent / 100);
    updated[index].lineTotal = untaxed * 1.14;
    setItems(updated);
  };

  let totalUntaxed = 0;
  let totalTax = 0;
  items.forEach(item => {
    const lineUntaxed = item.quantity * item.unitPrice * (1 - (item.discountPercent || 0) / 100);
    const lineTax = lineUntaxed * ((item.taxRate || 14) / 100);
    totalUntaxed += lineUntaxed;
    totalTax += lineTax;
  });
  const grandTotal = totalUntaxed + totalTax;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) {
      alert('يرجى إضافة منتج واحد على الأقل للفاتورة');
      return;
    }

    const customer = customers.find(c => c.id === selectedCustomerId);

    try {
      const cmd = new CreateSalesInvoiceCommand({
        type: 'WHOLESALE',
        branchId: 'main_branch',
        warehouseId: 'wh_main',
        customerId: selectedCustomerId || undefined,
        customerName: customer ? customer.name : 'عميل نقدي مباشر',
        items,
        totalUntaxed,
        totalTax,
        totalDiscount: 0,
        grandTotal,
        paidAmount: paymentMethod === 'CASH' ? grandTotal : 0,
        dueAmount: paymentMethod === 'CASH' ? 0 : grandTotal,
        paymentMethod,
        status: paymentMethod === 'CASH' ? 'PAID' : 'APPROVED'
      });

      await cmd.execute();
      localStorage.removeItem('maro_invoice_draft_customerId');
      localStorage.removeItem('maro_invoice_draft_paymentMethod');
      localStorage.removeItem('maro_invoice_draft_items');
      onClose();
    } catch (e: any) {
      alert(e.message || 'حدث خطأ أثناء إصدار الفاتورة');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-[#151b2b] w-full max-w-5xl rounded-3xl border border-[#1e293b] shadow-2xl overflow-hidden my-8">
        <div className="p-6 border-b border-[#1e293b] flex items-center justify-between">
          <h3 className="font-black text-xl text-white">إصدار فاتورة مبيعات معتمدة (ZATCA e-Invoice)</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-xl text-slate-500">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">تحديد العميل</label>
              <select
                className="w-full px-4 py-2.5 bg-[#1e293b] border border-[#334155] rounded-xl text-white outline-none focus:border-blue-500"
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
              >
                <option value="">-- عميل نقدي (مبيعات مباشرة) --</option>
                {customers.map(c => (
                  <option key={c.id} value={c.id}>{c.name} ({formatCurrency(c.currentBalance)} مستحق)</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">طريقة الدفع</label>
              <select
                className="w-full px-4 py-2.5 bg-[#1e293b] border border-[#334155] rounded-xl text-white outline-none focus:border-blue-500"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as any)}
              >
                <option value="CASH">نقداً بالكامل (Cash)</option>
                <option value="CARD">بطاقة / مدى (Card)</option>
                <option value="CREDIT">آجل على حساب العميل (Credit / AR)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">المخزن الصادر منه</label>
              <input 
                disabled
                type="text" 
                className="w-full px-4 py-2.5 bg-[#1e293b]/50 border border-[#334155] rounded-xl text-slate-400 font-bold"
                value="المستودع الرئيسي (Main Warehouse)"
              />
            </div>
          </div>

          {/* Product Picker & Table */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Products Selector */}
            <div className="bg-[#1e293b]/50 p-4 rounded-2xl border border-[#334155] space-y-3 max-h-[350px] overflow-y-auto">
              <p className="text-xs font-bold text-slate-400 uppercase">اختر منتج للإضافة للفاتورة:</p>
              {products.map(p => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleAddItem(p)}
                  className="w-full text-right p-3 bg-[#151b2b] hover:bg-blue-600/20 border border-[#334155] rounded-xl transition-all flex justify-between items-center"
                >
                  <div>
                    <div className="font-bold text-white text-sm">{p.name}</div>
                    <div className="text-xs text-slate-500">SKU: {p.sku} | المتاح: {p.quantity}</div>
                  </div>
                  <div className="font-mono font-black text-blue-400 text-sm">{formatCurrency(p.price)}</div>
                </button>
              ))}
            </div>

            {/* Selected Line Items */}
            <div className="lg:col-span-2 space-y-3">
              <p className="text-xs font-bold text-slate-400 uppercase">بنود الفاتورة المختارة:</p>
              <div className="border border-[#334155] rounded-2xl overflow-hidden bg-[#151b2b]">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-900/50 text-slate-500 font-bold uppercase">
                    <tr>
                      <th className="px-4 py-3">المنتج</th>
                      <th className="px-4 py-3">السعر</th>
                      <th className="px-4 py-3">الكمية</th>
                      <th className="px-4 py-3">خصم %</th>
                      <th className="px-4 py-3">الضريبة (14%)</th>
                      <th className="px-4 py-3">الإجمالي</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1e293b]">
                    {items.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-600 font-bold">لم يتم اختيار أي منتجات بعد</td>
                      </tr>
                    ) : items.map((item, idx) => {
                      const untaxed = item.quantity * item.unitPrice * (1 - (item.discountPercent || 0) / 100);
                      const tax = untaxed * 0.14;
                      const lineTotal = untaxed + tax;
                      return (
                        <tr key={idx}>
                          <td className="px-4 py-3 font-bold text-white">{item.productName}</td>
                          <td className="px-4 py-3 font-mono">{formatCurrency(item.unitPrice)}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1">
                              <button type="button" onClick={() => handleUpdateQty(idx, -1)} className="p-1 hover:bg-slate-800 text-slate-400 rounded"><MinusCircle size={14} /></button>
                              <input 
                                type="text"
                                {...getNumericInputProps(true)}
                                onKeyDown={(e) => handleSmartKeyDown(e)}
                                className="w-14 px-1 py-1 bg-[#1e293b] border border-[#334155] rounded text-white text-center font-bold font-mono text-xs focus:border-blue-500"
                                value={item.quantity}
                                onChange={(e) => {
                                  const val = parseFloat(e.target.value) || 0;
                                  const updated = [...items];
                                  updated[idx].quantity = val;
                                  const untaxed = val * updated[idx].unitPrice * (1 - (updated[idx].discountPercent || 0) / 100);
                                  updated[idx].lineTotal = untaxed * 1.14;
                                  setItems(updated);
                                }}
                              />
                              <button type="button" onClick={() => handleUpdateQty(idx, 1)} className="p-1 hover:bg-slate-800 text-slate-400 rounded"><PlusCircle size={14} /></button>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <input 
                              type="text" 
                              {...getNumericInputProps(true)}
                              onKeyDown={(e) => handleSmartKeyDown(e)}
                              className="w-16 px-2 py-1 bg-[#1e293b] border border-[#334155] rounded text-white text-center font-mono text-xs focus:border-blue-500"
                              value={item.discountPercent || 0}
                              onChange={(e) => handleUpdateDiscount(idx, parseFloat(e.target.value) || 0)}
                            />
                          </td>
                          <td className="px-4 py-3 font-mono text-emerald-400">{formatCurrency(tax)}</td>
                          <td className="px-4 py-3 font-mono font-bold text-blue-400">{formatCurrency(lineTotal)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Tax Breakdown & Total Summary */}
          <div className="bg-[#1e293b]/70 p-5 rounded-2xl border border-[#334155] flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex gap-6 text-sm">
              <div>
                <span className="text-slate-400 font-bold block text-xs">الصافي بدون ضريبة:</span>
                <span className="font-mono font-bold text-white text-base">{formatCurrency(totalUntaxed)}</span>
              </div>
              <div>
                <span className="text-slate-400 font-bold block text-xs">ضريبة القيمة المضافة (14%):</span>
                <span className="font-mono font-bold text-emerald-400 text-base">{formatCurrency(totalTax)}</span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs font-bold text-slate-400 uppercase block">الإجمالي الشامل النهائى (EGP):</span>
              <span className="text-3xl font-black font-mono text-blue-400">{formatCurrency(grandTotal)}</span>
            </div>
          </div>

          <div className="pt-2 flex gap-3">
            <button 
              type="submit"
              className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-3.5 rounded-xl font-black text-lg shadow-lg shadow-blue-600/20"
            >
              اعتماد الفاتورة وترحيل القيد الحسابي والمخزني
            </button>
            <button 
              type="button"
              onClick={onClose}
              className="px-8 bg-[#1e293b] text-slate-300 py-3.5 rounded-xl font-bold hover:bg-[#334155]"
            >
              إلغاء
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const InvoiceDetailModal: React.FC<{ invoice: SalesInvoice; onClose: () => void }> = ({ invoice, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#151b2b] w-full max-w-2xl rounded-3xl border border-[#1e293b] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-[#1e293b] flex items-center justify-between">
          <h3 className="font-bold text-xl text-white">معاينة الفاتورة الضريبية ZATCA e-Invoice</h3>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => {
                const customer = CustomerRepository.getCustomerById(invoice.customerId);
                const targetPhone = customer?.phone || prompt('أدخل رقم هاتف الواتساب الخاص بالعميل:', '') || '';
                if (targetPhone) {
                  const msg = WhatsAppNotificationService.formatSalesInvoiceWhatsApp(invoice);
                  WhatsAppNotificationService.openWhatsAppDirectly(targetPhone, msg);
                }
              }}
              className="p-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 rounded-xl text-xs font-bold flex items-center gap-1.5"
            >
              <Send size={16} />
              إرسال عبر الواتس
            </button>
            <button onClick={() => printSalesInvoice(invoice)} className="p-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 rounded-xl text-xs font-bold flex items-center gap-1">
              <Printer size={16} />
              طباعة
            </button>
            <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-xl text-slate-500">
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="p-8 flex-1 overflow-y-auto space-y-6 text-right">
          {/* Invoice Header */}
          <div className="flex justify-between items-start border-b border-[#1e293b] pb-6">
            <div>
              <h2 className="text-2xl font-black text-white">منصة MARO ERP Enterprise</h2>
              <p className="text-xs text-slate-400 font-bold mt-1">فاتورة ضريبية مبسطة / ZATCA Compliant</p>
              <p className="text-xs font-mono text-slate-500">الرقم الضريبي: 300000000000003</p>
            </div>
            <div className="text-left font-mono">
              <div className="text-lg font-bold text-blue-400">{invoice.invoiceNumber}</div>
              <div className="text-xs text-slate-400">{formatDate(new Date(invoice.createdAt))}</div>
              <div className="text-xs text-emerald-400 font-bold mt-1">الحالة: {invoice.status}</div>
            </div>
          </div>

          {/* Customer Info */}
          <div className="bg-[#1e293b]/50 p-4 rounded-xl border border-[#334155] flex justify-between items-center">
            <div>
              <span className="text-xs text-slate-400 block font-bold">اسم العميل:</span>
              <span className="text-base font-bold text-white">{invoice.customerName || 'عميل نقدي'}</span>
            </div>
            <div>
              <span className="text-xs text-slate-400 block font-bold">طريقة الدفع:</span>
              <span className="text-sm font-bold text-blue-400">{invoice.paymentMethod}</span>
            </div>
          </div>

          {/* Line Items Table */}
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-900/50 text-slate-400 font-bold uppercase">
              <tr>
                <th className="px-3 py-2">المنتج</th>
                <th className="px-3 py-2">الكمية</th>
                <th className="px-3 py-2">سعر الوحدة</th>
                <th className="px-3 py-2">الخصم %</th>
                <th className="px-3 py-2">الإجمالي الشامل</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e293b]">
              {invoice.items.map((it, idx) => (
                <tr key={idx}>
                  <td className="px-3 py-2.5 font-bold text-white">{it.productName}</td>
                  <td className="px-3 py-2.5 font-mono">{it.quantity}</td>
                  <td className="px-3 py-2.5 font-mono">{formatCurrency(it.unitPrice)}</td>
                  <td className="px-3 py-2.5 font-mono">{it.discountPercent || 0}%</td>
                  <td className="px-3 py-2.5 font-mono font-bold text-blue-400">{formatCurrency(it.lineTotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* ZATCA QR Code & Totals */}
          <div className="pt-4 border-t border-[#1e293b] flex justify-between items-center">
            <div className="bg-white p-3 rounded-2xl flex flex-col items-center">
              <QrCode size={90} className="text-slate-900" />
              <span className="text-[9px] font-mono text-slate-600 font-bold mt-1">ZATCA Base64 TLV</span>
            </div>

            <div className="space-y-1 text-left font-mono">
              <div className="text-xs text-slate-400">إجمالي الصافي: {formatCurrency(invoice.totalUntaxed)}</div>
              <div className="text-xs text-emerald-400">ضريبة القيمة المضافة (14%): {formatCurrency(invoice.totalTax)}</div>
              <div className="text-xl font-black text-blue-400 pt-1">النهائي: {formatCurrency(invoice.grandTotal)}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
