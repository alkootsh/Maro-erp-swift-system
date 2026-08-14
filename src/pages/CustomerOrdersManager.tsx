import React, { useState, useEffect, useMemo } from 'react';
import { 
  ShoppingBag, 
  Search, 
  Eye, 
  CheckCircle, 
  Clock, 
  Phone, 
  MapPin, 
  QrCode, 
  Copy, 
  ExternalLink, 
  Sparkles, 
  Send, 
  Receipt, 
  FileText, 
  Filter, 
  Volume2, 
  VolumeX, 
  Smartphone, 
  Laptop, 
  Settings as SettingsIcon, 
  X, 
  Check, 
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  Package,
  Layers
} from 'lucide-react';
import { CustomerPortalService } from '../services/customerPortalService';
import { 
  CustomerPortalOrder, 
  PortalOrderStatus, 
  PortalStoreSettings 
} from '../types/customerPortal';
import { MaroSyncEngine } from '../lib/maroSyncEngine';
import { formatCurrency, formatDate, cn } from '../lib/utils';
import { CustomerOrderPortalApp } from './portal/CustomerOrderPortalApp';

export const CustomerOrdersManager: React.FC = () => {
  const [orders, setOrders] = useState<CustomerPortalOrder[]>([]);
  const [settings, setSettings] = useState<PortalStoreSettings>(CustomerPortalService.getStoreSettings());
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  
  // Modals & Views
  const [selectedOrder, setSelectedOrder] = useState<CustomerPortalOrder | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [convertSuccessInvoice, setConvertSuccessInvoice] = useState<any>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);
  const [simulatorDevice, setSimulatorDevice] = useState<'MOBILE' | 'DESKTOP'>('MOBILE');
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    // Reactive subscription to customer_portal_orders
    const unsubscribe = MaroSyncEngine.subscribe<CustomerPortalOrder>('customer_portal_orders', (data) => {
      setOrders(data || []);
    });
    return () => unsubscribe();
  }, []);

  const portalUrl = `${window.location.origin}/portal/order`;

  const filteredOrders = useMemo(() => {
    return orders.filter(ord => {
      const matchesSearch = 
        ord.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ord.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ord.phone.includes(searchTerm) ||
        (ord.deliveryAddress && ord.deliveryAddress.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesStatus = selectedStatus === 'ALL' || ord.status === selectedStatus;

      return matchesSearch && matchesStatus;
    });
  }, [orders, searchTerm, selectedStatus]);

  // Metrics
  const totalRevenue = useMemo(() => orders.reduce((sum, o) => sum + (o.grandTotal || 0), 0), [orders]);
  const pendingCount = useMemo(() => orders.filter(o => o.status === 'PENDING_REVIEW').length, [orders]);
  const convertedCount = useMemo(() => orders.filter(o => o.status === 'CONVERTED_TO_INVOICE').length, [orders]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(portalUrl);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2500);
  };

  const handleOpenDetail = (order: CustomerPortalOrder) => {
    setSelectedOrder(order);
    setConvertSuccessInvoice(null);
    setIsDetailOpen(true);
  };

  const handleUpdateStatus = async (orderId: string, status: PortalOrderStatus) => {
    try {
      const updated = await CustomerPortalService.updateOrderStatus(orderId, status);
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder(updated);
      }
    } catch (e: any) {
      alert(e.message || 'حدث خطأ أثناء تحديث الحالة');
    }
  };

  const handleConvertToInvoice = async (order: CustomerPortalOrder) => {
    if (!confirm(`هل أنت متأكد من تحويل طلب الشراء ${order.orderNumber} إلى فاتورة مبيعات معتمدة وخصم الأصناف من المخزن؟`)) {
      return;
    }

    try {
      setIsConverting(true);
      const result = await CustomerPortalService.convertOrderToSalesInvoice(order.id, {
        warehouseId: 'wh_main'
      });

      setConvertSuccessInvoice(result.invoice);
      setSelectedOrder(result.order);
    } catch (e: any) {
      alert(`خطأ: ${e.message}`);
    } finally {
      setIsConverting(false);
    }
  };

  const handleSendWhatsAppToCustomer = (order: CustomerPortalOrder) => {
    const msg = CustomerPortalService.generateCustomerWhatsAppMessage(order);
    const link = CustomerPortalService.generateWhatsAppLink(order.phone, msg);
    window.open(link, '_blank');
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = CustomerPortalService.saveStoreSettings(settings);
    setSettings(updated);
    setIsSettingsOpen(false);
    alert('تم حفظ إعدادات متجر وبوابة الطلبات بنجاح!');
  };

  const getStatusBadge = (status: PortalOrderStatus) => {
    switch (status) {
      case 'PENDING_REVIEW':
        return (
          <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center gap-1">
            <Clock size={12} />
            <span>بانتظار الاعتماد</span>
          </span>
        );
      case 'APPROVED':
        return (
          <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center gap-1">
            <CheckCircle size={12} />
            <span>معتمد للتجهيز</span>
          </span>
        );
      case 'CONVERTED_TO_INVOICE':
        return (
          <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
            <Receipt size={12} />
            <span>تم التحويل لفاتورة</span>
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-red-500/20 text-red-400 border border-red-500/30 flex items-center gap-1">
            <X size={12} />
            <span>ملغي</span>
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-[#151b2b] p-5 rounded-2xl border border-[#1e293b]">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-white">بوابة طلبات العملاء وتجار الجملة (B2B Ordering Portal)</h1>
            <span className="px-2.5 py-0.5 text-xs font-bold bg-blue-600/20 text-blue-400 border border-blue-500/30 rounded-full">
              متجر إلكتروني مباشر
            </span>
          </div>
          <p className="text-xs text-slate-400">
            استقبال طلبات الشراء الواردة من العملاء عبر المتجر ورابط الواتساب، ومراجعتها وتحويلها مباشرة لفواتير مبيعات معتمدة.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setIsSimulatorOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-black shadow-lg shadow-purple-600/20 transition-all active:scale-95"
          >
            <Smartphone size={16} />
            <span>معاينة تطبيق العميل (Live Simulator)</span>
          </button>

          <button
            onClick={handleCopyLink}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition-all active:scale-95"
          >
            {isCopied ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
            <span>{isCopied ? 'تم نسخ الرابط!' : 'نسخ رابط المتجر للعملاء'}</span>
          </button>

          <a
            href="/portal/order"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-blue-600/20"
          >
            <ExternalLink size={16} />
            <span>فتح صفحة الطلب</span>
          </a>

          <button
            onClick={() => setIsSettingsOpen(true)}
            className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 rounded-xl transition-colors"
            title="إعدادات المتجر والبوابة"
          >
            <SettingsIcon size={18} />
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#151b2b] p-5 rounded-2xl border border-[#1e293b] flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase">إجمالي الطلبات الواردة</p>
            <p className="text-2xl font-black text-white mt-1">{orders.length}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center border border-blue-500/30">
            <ShoppingBag size={24} />
          </div>
        </div>

        <div className="bg-[#151b2b] p-5 rounded-2xl border border-[#1e293b] flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase">طلبات بانتظار الاعتماد</p>
            <p className="text-2xl font-black text-amber-400 mt-1">{pendingCount}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
            <Clock size={24} />
          </div>
        </div>

        <div className="bg-[#151b2b] p-5 rounded-2xl border border-[#1e293b] flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase">تم تحويلها لفواتير</p>
            <p className="text-2xl font-black text-emerald-400 mt-1">{convertedCount}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
            <Receipt size={24} />
          </div>
        </div>

        <div className="bg-[#151b2b] p-5 rounded-2xl border border-[#1e293b] flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase">إجمالي قيمة الطلبيات</p>
            <p className="text-2xl font-black text-indigo-400 mt-1">{formatCurrency(totalRevenue)}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
            <TrendingUp size={24} />
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
          <input 
            type="text" 
            placeholder="بحث برقم الطلب، اسم العميل، الهاتف، أو العنوان..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pr-10 pl-4 py-2.5 bg-[#151b2b] border border-[#1e293b] rounded-xl text-white text-xs focus:outline-none focus:border-blue-500 transition-all placeholder:text-slate-600"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {[
            { id: 'ALL', label: 'كافة الطلبات' },
            { id: 'PENDING_REVIEW', label: `بانتظار المراجعة (${pendingCount})` },
            { id: 'CONVERTED_TO_INVOICE', label: 'تم التحويل لفاتورة' },
            { id: 'CANCELLED', label: 'الملغية' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setSelectedStatus(tab.id)}
              className={cn(
                "px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all",
                selectedStatus === tab.id
                  ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
                  : "bg-[#151b2b] text-slate-400 hover:text-white border border-[#1e293b]"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-[#151b2b] rounded-2xl border border-[#1e293b] shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead className="bg-slate-900/50 text-slate-500 text-[10px] font-bold uppercase tracking-widest">
              <tr>
                <th className="px-6 py-4">رقم الطلب</th>
                <th className="px-6 py-4">العميل والموبايل</th>
                <th className="px-6 py-4">عنوان التسليم</th>
                <th className="px-6 py-4">الأصناف المطلوبة</th>
                <th className="px-6 py-4">الإجمالي</th>
                <th className="px-6 py-4">طريقة الدفع</th>
                <th className="px-6 py-4">الحالة</th>
                <th className="px-6 py-4 text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e293b]">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-slate-500 font-bold text-sm">
                    لا توجد طلبات شراء مطابقة للفلاتر الحالية
                  </td>
                </tr>
              ) : (
                filteredOrders.map(order => (
                  <tr key={order.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs font-bold text-blue-400">
                      {order.orderNumber}
                      <p className="text-[10px] text-slate-500 font-sans mt-0.5">{formatDate(order.createdAt)}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-xs font-bold text-white">{order.customerName}</p>
                      <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5" dir="ltr">
                        <Phone size={11} className="text-emerald-400" />
                        <span>{order.phone}</span>
                      </p>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-300 max-w-[200px] truncate" title={order.deliveryAddress}>
                      <span className="flex items-center gap-1">
                        <MapPin size={12} className="text-slate-500 shrink-0" />
                        <span>{order.deliveryAddress}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs font-bold text-slate-300">
                      <span>{order.items.length} أصناف</span>
                      <span className="text-[10px] text-slate-500 block">({order.items.reduce((s, i) => s + i.quantity, 0)} وحدة)</span>
                    </td>
                    <td className="px-6 py-4 font-black text-emerald-400 text-xs">
                      {formatCurrency(order.grandTotal)}
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-300">
                      {order.paymentMethod === 'COD' && 'كاش عند الاستلام'}
                      {order.paymentMethod === 'CREDIT_ACCOUNT' && 'آجل على الحساب'}
                      {order.paymentMethod === 'BANK_TRANSFER' && 'تحويل بنكي'}
                      {order.paymentMethod === 'E_WALLET' && 'محفظة إلكترونية'}
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(order.status)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleOpenDetail(order)}
                          className="px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 rounded-lg text-xs font-bold transition-all flex items-center gap-1"
                        >
                          <Eye size={13} />
                          <span>معاينة</span>
                        </button>

                        <button
                          onClick={() => handleSendWhatsAppToCustomer(order)}
                          className="p-1.5 text-emerald-400 hover:bg-emerald-500/10 rounded-lg border border-emerald-500/20 transition-colors"
                          title="إرسال إشعار واتساب للعميل"
                        >
                          <Send size={15} />
                        </button>

                        {order.status !== 'CONVERTED_TO_INVOICE' && (
                          <button
                            onClick={() => handleConvertToInvoice(order)}
                            className="px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-lg text-xs font-black shadow-md shadow-emerald-600/20 transition-all flex items-center gap-1 active:scale-95"
                            title="تحويل مباشر لفاتورة مبيعات معتمدة وخصم من المخزن"
                          >
                            <Receipt size={13} />
                            <span>تحويل لفاتورة</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Detail & Conversion Modal */}
      {isDetailOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#151b2b] border border-[#1e293b] rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-[#1e293b] flex items-center justify-between bg-slate-900/60">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center">
                  <ShoppingBag size={20} />
                </div>
                <div>
                  <h3 className="font-black text-white text-base">تفاصيل طلب الشراء: {selectedOrder.orderNumber}</h3>
                  <p className="text-xs text-slate-400">تاريخ التسجيل: {formatDate(selectedOrder.createdAt)}</p>
                </div>
              </div>
              <button onClick={() => setIsDetailOpen(false)} className="text-slate-400 hover:text-white p-1 rounded-lg">
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {/* Success Notification if converted */}
              {convertSuccessInvoice && (
                <div className="p-4 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 space-y-1">
                  <p className="font-black text-sm flex items-center gap-2">
                    <CheckCircle size={18} />
                    <span>تم تحويل الطلب بنجاح إلى فاتورة مبيعات رقم ({convertSuccessInvoice.invoiceNumber})</span>
                  </p>
                  <p className="text-xs text-emerald-400/80">
                    تم خصم الكميات من المستودع وقيد القيد المحاسبي وحساب العميل بنجاح.
                  </p>
                </div>
              )}

              {/* Customer Info Card */}
              <div className="bg-[#182032] border border-[#1e293b] rounded-2xl p-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-400 block mb-0.5">اسم العميل / المتجر:</span>
                  <span className="font-bold text-white text-sm">{selectedOrder.customerName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">رقم الهاتف / الواتساب:</span>
                  <span className="font-bold text-emerald-400 text-sm" dir="ltr">{selectedOrder.phone}</span>
                </div>
                <div className="sm:col-span-2">
                  <span className="text-slate-400 block mb-0.5">عنوان وموقع التسليم:</span>
                  <span className="font-bold text-slate-200">{selectedOrder.deliveryAddress} - {selectedOrder.city}</span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">تاريخ ووقت التوريد المفضل:</span>
                  <span className="font-bold text-white">{selectedOrder.preferredDeliveryDate} ({selectedOrder.preferredDeliveryTime})</span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">حالة الطلب الحالية:</span>
                  <div>{getStatusBadge(selectedOrder.status)}</div>
                </div>
              </div>

              {/* Items List Table */}
              <div className="space-y-2">
                <h4 className="text-xs font-black text-slate-300">الأصناف والكميات المطلوبة ({selectedOrder.items.length})</h4>
                <div className="bg-[#182032] border border-[#1e293b] rounded-2xl overflow-hidden">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-slate-900/50 text-slate-400 text-[10px] font-bold uppercase">
                      <tr>
                        <th className="p-3">الصنف</th>
                        <th className="p-3">الوحدة المطلوبة</th>
                        <th className="p-3">الكمية</th>
                        <th className="p-3">سعر الوحدة</th>
                        <th className="p-3">الإجمالي</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1e293b]">
                      {selectedOrder.items.map((item, idx) => (
                        <tr key={idx}>
                          <td className="p-3 font-bold text-white">
                            {item.productName}
                            <span className="text-[10px] text-slate-500 font-mono block">{item.sku}</span>
                          </td>
                          <td className="p-3 text-blue-400 font-bold">{item.unitName}</td>
                          <td className="p-3 font-black text-white">{item.quantity}</td>
                          <td className="p-3 text-slate-300">{formatCurrency(item.unitPrice)}</td>
                          <td className="p-3 font-black text-emerald-400">{formatCurrency(item.lineTotal)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Totals Summary */}
              <div className="bg-[#182032] border border-[#1e293b] rounded-2xl p-4 space-y-2 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>المجموع قبل الضريبة:</span>
                  <span className="font-bold text-white">{formatCurrency(selectedOrder.subtotal)}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>ضريبة القيمة المضافة (14%):</span>
                  <span className="font-bold text-emerald-400">{formatCurrency(selectedOrder.taxAmount)}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>رسوم التوصيل:</span>
                  <span className="font-bold text-white">{selectedOrder.shippingCost === 0 ? 'مجاناً' : formatCurrency(selectedOrder.shippingCost)}</span>
                </div>
                <div className="flex justify-between text-base font-black text-white pt-2 border-t border-slate-700">
                  <span>الإجمالي النهائي:</span>
                  <span className="text-blue-400">{formatCurrency(selectedOrder.grandTotal)}</span>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="p-5 border-t border-[#1e293b] bg-slate-900/60 flex flex-wrap items-center justify-between gap-3">
              <button
                onClick={() => handleSendWhatsAppToCustomer(selectedOrder)}
                className="flex items-center gap-2 px-4 py-2.5 bg-[#25D366] hover:bg-[#20bd5a] text-slate-950 font-black rounded-xl text-xs transition-all"
              >
                <Send size={15} />
                <span>إرسال تفاصيل للعميل عبر الواتساب</span>
              </button>

              <div className="flex items-center gap-2">
                {selectedOrder.status !== 'CONVERTED_TO_INVOICE' && (
                  <button
                    onClick={() => handleConvertToInvoice(selectedOrder)}
                    disabled={isConverting}
                    className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-black shadow-lg shadow-emerald-600/30 transition-all active:scale-95"
                  >
                    <Receipt size={16} />
                    <span>{isConverting ? 'جاري التحويل...' : 'تحويل لفاتورة مبيعات رسمية'}</span>
                  </button>
                )}
                <button
                  onClick={() => setIsDetailOpen(false)}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-all"
                >
                  إغلاق
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Store Settings Drawer */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleSaveSettings} className="bg-[#151b2b] border border-[#1e293b] rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-[#1e293b] flex items-center justify-between bg-slate-900/60">
              <h3 className="font-black text-white text-base flex items-center gap-2">
                <SettingsIcon size={18} className="text-blue-400" />
                <span>إعدادات متجر وبوابة طلبات العملاء</span>
              </h3>
              <button type="button" onClick={() => setIsSettingsOpen(false)} className="text-slate-400 hover:text-white">
                <X size={20} />
              </button>
            </div>

            <div className="p-5 space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="text-slate-300 font-bold">اسم المتجر / الشركة المعلن للعملاء</label>
                <input 
                  type="text"
                  value={settings.storeName}
                  onChange={(e) => setSettings({ ...settings, storeName: e.target.value })}
                  className="w-full px-3.5 py-2 bg-[#182032] border border-[#1e293b] rounded-xl text-white text-xs focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-bold">الوصف الترحيبي</label>
                <input 
                  type="text"
                  value={settings.storeSubtitle}
                  onChange={(e) => setSettings({ ...settings, storeSubtitle: e.target.value })}
                  className="w-full px-3.5 py-2 bg-[#182032] border border-[#1e293b] rounded-xl text-white text-xs focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-300 font-bold">رقم هاتف الخط الساخن</label>
                  <input 
                    type="tel"
                    value={settings.hotlinePhone}
                    onChange={(e) => setSettings({ ...settings, hotlinePhone: e.target.value })}
                    className="w-full px-3.5 py-2 bg-[#182032] border border-[#1e293b] rounded-xl text-white text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-bold">رقم الواتساب لاستقبال الطلبات</label>
                  <input 
                    type="tel"
                    value={settings.whatsappPhone}
                    onChange={(e) => setSettings({ ...settings, whatsappPhone: e.target.value })}
                    className="w-full px-3.5 py-2 bg-[#182032] border border-[#1e293b] rounded-xl text-white text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-300 font-bold">ضريبة المبيعات (%)</label>
                  <input 
                    type="number"
                    value={settings.defaultTaxRate}
                    onChange={(e) => setSettings({ ...settings, defaultTaxRate: +e.target.value })}
                    className="w-full px-3.5 py-2 bg-[#182032] border border-[#1e293b] rounded-xl text-white text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-bold">حد التوصيل المجاني</label>
                  <input 
                    type="number"
                    value={settings.freeDeliveryThreshold}
                    onChange={(e) => setSettings({ ...settings, freeDeliveryThreshold: +e.target.value })}
                    className="w-full px-3.5 py-2 bg-[#182032] border border-[#1e293b] rounded-xl text-white text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-900/60 rounded-xl border border-slate-800">
                <span className="font-bold text-slate-300">تشغيل تنبيه صوتي فوري عند وصول طلب جديد</span>
                <input 
                  type="checkbox"
                  checked={settings.enableSoundAlerts}
                  onChange={(e) => setSettings({ ...settings, enableSoundAlerts: e.target.checked })}
                  className="w-4 h-4 rounded text-blue-600"
                />
              </div>
            </div>

            <div className="p-4 border-t border-[#1e293b] bg-slate-900/60 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsSettingsOpen(false)}
                className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-bold"
              >
                إلغاء
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-black shadow-lg shadow-blue-600/30"
              >
                حفظ التغييرات
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Live Interactive Simulator Modal */}
      {isSimulatorOpen && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col p-2 sm:p-4 overflow-hidden">
          {/* Simulator Bar */}
          <div className="bg-[#151b2b] border border-[#1e293b] rounded-2xl p-3 px-4 flex items-center justify-between text-xs mb-3">
            <div className="flex items-center gap-3">
              <span className="font-black text-white flex items-center gap-1.5">
                <Smartphone size={16} className="text-purple-400" />
                <span>المعاينة التفاعلية لتطبيق العميل والمتجر</span>
              </span>
              <span className="text-slate-400 hidden sm:inline">| يمكنك تجربة الطلب واختيار الأصناف كما يراها عميلك بالضبط</span>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex bg-slate-900 rounded-xl p-1 border border-slate-800">
                <button
                  onClick={() => setSimulatorDevice('MOBILE')}
                  className={cn(
                    "px-3 py-1 rounded-lg font-bold flex items-center gap-1 transition-all",
                    simulatorDevice === 'MOBILE' ? "bg-purple-600 text-white shadow" : "text-slate-400 hover:text-white"
                  )}
                >
                  <Smartphone size={14} />
                  <span>موبايل</span>
                </button>
                <button
                  onClick={() => setSimulatorDevice('DESKTOP')}
                  className={cn(
                    "px-3 py-1 rounded-lg font-bold flex items-center gap-1 transition-all",
                    simulatorDevice === 'DESKTOP' ? "bg-purple-600 text-white shadow" : "text-slate-400 hover:text-white"
                  )}
                >
                  <Laptop size={14} />
                  <span>كمبيوتر / تابلت</span>
                </button>
              </div>

              <button
                onClick={() => setIsSimulatorOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Simulator Window */}
          <div className="flex-1 overflow-y-auto flex items-center justify-center p-2">
            <div className={cn(
              "transition-all duration-300 h-full max-h-[88vh] overflow-y-auto",
              simulatorDevice === 'MOBILE' ? "w-full max-w-md shadow-2xl border-4 border-slate-800 rounded-[40px] bg-slate-950 p-2" : "w-full max-w-6xl shadow-2xl border-2 border-slate-800 rounded-3xl"
            )}>
              <CustomerOrderPortalApp isSimulator={true} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
