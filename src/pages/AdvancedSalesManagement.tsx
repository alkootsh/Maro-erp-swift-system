import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Tag, 
  Percent, 
  TrendingUp, 
  ShieldAlert, 
  Plus, 
  Search, 
  CheckCircle2, 
  Clock, 
  DollarSign, 
  Users, 
  Truck, 
  Award, 
  AlertTriangle,
  Send,
  Gift,
  Layers,
  Check
} from 'lucide-react';
import { MaroSyncEngine } from '../lib/maroSyncEngine';
import { formatCurrency, formatDate, cn } from '../lib/utils';

interface SalesOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  type: 'QUOTATION' | 'SALES_ORDER' | 'DISPATCH';
  totalAmount: number;
  status: 'PENDING' | 'APPROVED' | 'CONVERTED' | 'REJECTED';
  date: string;
  repName: string;
}

interface PromotionRule {
  id: string;
  title: string;
  type: 'BOGO' | 'DISCOUNT_PERCENT' | 'BULK_DISCOUNT';
  description: string;
  status: 'ACTIVE' | 'EXPIRED';
  minQty: number;
  discountValue: number;
}

interface SalesRepTarget {
  id: string;
  name: string;
  targetAmount: number;
  achievedAmount: number;
  commissionRate: number;
  area: string;
}

interface CustomerCredit {
  id: string;
  name: string;
  creditLimit: number;
  currentBalance: number;
  aging0_30: number;
  aging30_60: number;
  aging60_plus: number;
}

export const AdvancedSalesManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'orders' | 'promotions' | 'commissions' | 'credit'>('orders');

  // State
  const [orders, setOrders] = useState<SalesOrder[]>([
    { id: 'ORD-101', orderNumber: 'SO-2026-001', customerName: 'شركة النور للتجارة والتوزيع', type: 'SALES_ORDER', totalAmount: 45000, status: 'APPROVED', date: '2026-08-13', repName: 'أحمد محمود' },
    { id: 'ORD-102', orderNumber: 'QT-2026-042', customerName: 'مؤسسة الأفق الحديث', type: 'QUOTATION', totalAmount: 18200, status: 'PENDING', date: '2026-08-12', repName: 'محمد علي' },
    { id: 'ORD-103', orderNumber: 'SO-2026-002', customerName: 'هايبر العروبة', type: 'DISPATCH', totalAmount: 125000, status: 'CONVERTED', date: '2026-08-10', repName: 'خالد إبراهيم' },
  ]);

  const [promotions, setPromotions] = useState<PromotionRule[]>([
    { id: 'PR-1', title: 'عرض صيف 2026: اشتري 2 واحصل على 1 هدية', type: 'BOGO', description: 'يسري على جميع أصناف المشروبات والمنظفات', status: 'ACTIVE', minQty: 2, discountValue: 100 },
    { id: 'PR-2', title: 'خصم 15% للطلبات الكبرى فوق 10,000 ج.م', type: 'DISCOUNT_PERCENT', description: 'يُطبق تلقائياً على إجمالي الفاتورة للعملاء التجاريين', status: 'ACTIVE', minQty: 1, discountValue: 15 },
    { id: 'PR-3', title: 'تخفيض كميات الجملة (شاي وقهوة)', type: 'BULK_DISCOUNT', description: 'خصم 50 ج.م لكل كرتونة عند شراء 5 كراتين فأكثر', status: 'ACTIVE', minQty: 5, discountValue: 50 },
  ]);

  const [reps, setReps] = useState<SalesRepTarget[]>([
    { id: 'REP-1', name: 'أحمد محمود', targetAmount: 200000, achievedAmount: 165000, commissionRate: 2.5, area: 'القاهرة الكبرى' },
    { id: 'REP-2', name: 'محمد علي', targetAmount: 150000, achievedAmount: 142000, commissionRate: 3.0, area: 'الإسكندرية والبحيرة' },
    { id: 'REP-3', name: 'خالد إبراهيم', targetAmount: 250000, achievedAmount: 210000, commissionRate: 2.0, area: 'الدلتا ومدن القناة' },
  ]);

  const [credits, setCredits] = useState<CustomerCredit[]>([
    { id: 'C-1', name: 'شركة النور للتجارة والتوزيع', creditLimit: 100000, currentBalance: 75000, aging0_30: 50000, aging30_60: 25000, aging60_plus: 0 },
    { id: 'C-2', name: 'مؤسسة الأفق الحديث', creditLimit: 50000, currentBalance: 48500, aging0_30: 20000, aging30_60: 15000, aging60_plus: 13500 },
    { id: 'C-3', name: 'هايبر العروبة', creditLimit: 300000, currentBalance: 120000, aging0_30: 120000, aging30_60: 0, aging60_plus: 0 },
  ]);

  const [showNewOrderModal, setShowNewOrderModal] = useState(false);
  const [newOrderCust, setNewOrderCust] = useState('');
  const [newOrderAmount, setNewOrderAmount] = useState('');
  const [newOrderType, setNewOrderType] = useState<'QUOTATION' | 'SALES_ORDER'>('SALES_ORDER');

  const handleCreateOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOrderCust || !newOrderAmount) return;
    const order: SalesOrder = {
      id: `ORD-${Date.now().toString().slice(-4)}`,
      orderNumber: `${newOrderType === 'QUOTATION' ? 'QT' : 'SO'}-2026-${Math.floor(Math.random() * 900 + 100)}`,
      customerName: newOrderCust,
      type: newOrderType,
      totalAmount: Number(newOrderAmount),
      status: 'PENDING',
      date: new Date().toISOString().split('T')[0],
      repName: 'أحمد محمود'
    };
    setOrders([order, ...orders]);
    setShowNewOrderModal(false);
    setNewOrderCust('');
    setNewOrderAmount('');
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-[#151b2b] to-[#0f172a] p-6 rounded-2xl border border-blue-900/40 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-400 font-bold text-xs border border-blue-500/30">
              MARO Enterprise Advanced Sales Suite
            </span>
            <span className="text-xs text-emerald-400 font-bold">● متوافق مع معايير SAP & Odoo</span>
          </div>
          <h1 className="text-2xl font-black text-white">إدارة دورة المبيعات المتقدمة، العروض والعمولات</h1>
          <p className="text-xs text-slate-400 mt-1">
            إدارة عروض الأسعار، أوامر البيع، محرك عروض BOGO الترويجية، مستهدفات وعمولات المندوبين، ومراقبة الحدود الائتمانية وأعمار الديون.
          </p>
        </div>
        <button 
          onClick={() => setShowNewOrderModal(true)}
          className="flex items-center gap-2 px-5 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-blue-600/30 text-xs active:scale-95"
        >
          <Plus size={18} />
          <span>إنشاء أمر بيع أو عرض سعر جديد</span>
        </button>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab('orders')}
          className={cn(
            "flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all",
            activeTab === 'orders' ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" : "bg-[#151b2b] text-slate-400 hover:text-white border border-slate-800"
          )}
        >
          <FileText size={16} />
          <span>أوامر البيع وعروض الأسعار</span>
        </button>
        <button
          onClick={() => setActiveTab('promotions')}
          className={cn(
            "flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all",
            activeTab === 'promotions' ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" : "bg-[#151b2b] text-slate-400 hover:text-white border border-slate-800"
          )}
        >
          <Gift size={16} />
          <span>عروض BOGO والتخفيضات الترويجية</span>
        </button>
        <button
          onClick={() => setActiveTab('commissions')}
          className={cn(
            "flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all",
            activeTab === 'commissions' ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" : "bg-[#151b2b] text-slate-400 hover:text-white border border-slate-800"
          )}
        >
          <Award size={16} />
          <span>مستهدفات وعمولات المندوبين</span>
        </button>
        <button
          onClick={() => setActiveTab('credit')}
          className={cn(
            "flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all",
            activeTab === 'credit' ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" : "bg-[#151b2b] text-slate-400 hover:text-white border border-slate-800"
          )}
        >
          <ShieldAlert size={16} />
          <span>الحدود الائتمانية وأعمار الديون</span>
        </button>
      </div>

      {/* Tab 1: Orders & Quotations Workflow */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-[#151b2b] p-4 rounded-2xl border border-slate-800">
              <span className="text-xs text-slate-400 block">عروض الأسعار المعلقة</span>
              <p className="text-xl font-black text-amber-400 mt-1">
                {orders.filter(o => o.type === 'QUOTATION').length} عروض
              </p>
            </div>
            <div className="bg-[#151b2b] p-4 rounded-2xl border border-slate-800">
              <span className="text-xs text-slate-400 block">أوامر البيع المعتمدة</span>
              <p className="text-xl font-black text-blue-400 mt-1">
                {orders.filter(o => o.type === 'SALES_ORDER').length} أوامر
              </p>
            </div>
            <div className="bg-[#151b2b] p-4 rounded-2xl border border-slate-800">
              <span className="text-xs text-slate-400 block">إجمالي القيمة قيد التنفيذ</span>
              <p className="text-xl font-black text-emerald-400 mt-1">
                {formatCurrency(orders.reduce((acc, o) => acc + o.totalAmount, 0))}
              </p>
            </div>
          </div>

          <div className="bg-[#151b2b] rounded-2xl border border-slate-800 overflow-hidden">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <h3 className="font-bold text-white text-sm">سجل عروض الأسعار وأوامر البيع والتسليم</h3>
              <span className="text-xs text-slate-400 font-mono">إجمالي الطلبات: {orders.length}</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-[#0f172a] text-slate-400 font-bold border-b border-slate-800">
                  <tr>
                    <th className="p-4">رقم المستند</th>
                    <th className="p-4">نوع المستند</th>
                    <th className="p-4">اسم العميل</th>
                    <th className="p-4">مندوب المبيعات</th>
                    <th className="p-4">التاريخ</th>
                    <th className="p-4">القيمة الإجمالية</th>
                    <th className="p-4 text-center">الحالة</th>
                    <th className="p-4 text-center">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {orders.map((ord) => (
                    <tr key={ord.id} className="hover:bg-slate-800/30 transition-all">
                      <td className="p-4 font-mono font-bold text-white">{ord.orderNumber}</td>
                      <td className="p-4">
                        {ord.type === 'QUOTATION' && <span className="px-2 py-1 bg-amber-500/20 text-amber-400 rounded-lg font-bold">عرض سعر</span>}
                        {ord.type === 'SALES_ORDER' && <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded-lg font-bold">أمر بيع</span>}
                        {ord.type === 'DISPATCH' && <span className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded-lg font-bold">أمر تسليم</span>}
                      </td>
                      <td className="p-4 font-bold text-slate-200">{ord.customerName}</td>
                      <td className="p-4 text-slate-300">{ord.repName}</td>
                      <td className="p-4 font-mono text-slate-400">{ord.date}</td>
                      <td className="p-4 font-mono font-bold text-emerald-400">{formatCurrency(ord.totalAmount)}</td>
                      <td className="p-4 text-center">
                        {ord.status === 'APPROVED' && <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-400 rounded-xl font-bold text-[10px]">معتمد</span>}
                        {ord.status === 'PENDING' && <span className="px-2.5 py-1 bg-amber-500/20 text-amber-400 rounded-xl font-bold text-[10px]">قيد المراجعة</span>}
                        {ord.status === 'CONVERTED' && <span className="px-2.5 py-1 bg-blue-500/20 text-blue-400 rounded-xl font-bold text-[10px]">محول لفاتورة</span>}
                      </td>
                      <td className="p-4 text-center">
                        <button 
                          onClick={() => {
                            setOrders(orders.map(o => o.id === ord.id ? { ...o, status: 'APPROVED' } : o));
                          }}
                          className="px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600 text-blue-400 hover:text-white rounded-lg font-bold transition-all"
                        >
                          اعتماد وتحويل
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Promotions & BOGO Engine */}
      {activeTab === 'promotions' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {promotions.map((promo) => (
              <div key={promo.id} className="bg-[#151b2b] p-5 rounded-2xl border border-slate-800 space-y-3 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-2 h-full bg-emerald-500"></div>
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-400 rounded-lg text-xs font-bold">
                    {promo.type === 'BOGO' && 'عرض BOGO'}
                    {promo.type === 'DISCOUNT_PERCENT' && 'خصم نسبة'}
                    {promo.type === 'BULK_DISCOUNT' && 'خصم كميات'}
                  </span>
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                </div>
                <h3 className="font-black text-white text-sm">{promo.title}</h3>
                <p className="text-xs text-slate-400">{promo.description}</p>
                <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-500">الحد الأدنى للكمية: {promo.minQty}</span>
                  <span className="text-emerald-400 font-bold">القيمة: {promo.discountValue}{promo.type === 'DISCOUNT_PERCENT' ? '%' : ' ج.م'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Sales Reps & Commissions */}
      {activeTab === 'commissions' && (
        <div className="bg-[#151b2b] rounded-2xl border border-slate-800 overflow-hidden">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <h3 className="font-bold text-white text-sm">مستهدفات ومبيعات وعمولات المندوبين</h3>
            <span className="text-xs text-slate-400">حساب العمولات الآلي بنسبة صافي المبيعات</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-[#0f172a] text-slate-400 font-bold border-b border-slate-800">
                <tr>
                  <th className="p-4">اسم المندوب</th>
                  <th className="p-4">منطقة العمل</th>
                  <th className="p-4">المستهدف الشهري</th>
                  <th className="p-4">المحقق فعلياً</th>
                  <th className="p-4">نسبة الإنجاز</th>
                  <th className="p-4">نسبة العمولة</th>
                  <th className="p-4 text-center">العمولة المستحقة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {reps.map((rep) => {
                  const pct = Math.round((rep.achievedAmount / rep.targetAmount) * 100);
                  const commission = (rep.achievedAmount * rep.commissionRate) / 100;
                  return (
                    <tr key={rep.id} className="hover:bg-slate-800/30 transition-all">
                      <td className="p-4 font-bold text-white">{rep.name}</td>
                      <td className="p-4 text-slate-300">{rep.area}</td>
                      <td className="p-4 font-mono text-slate-300">{formatCurrency(rep.targetAmount)}</td>
                      <td className="p-4 font-mono font-bold text-emerald-400">{formatCurrency(rep.achievedAmount)}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-slate-800 h-2 rounded-full overflow-hidden">
                            <div className="bg-blue-500 h-full rounded-full" style={{ width: `${Math.min(pct, 100)}%` }}></div>
                          </div>
                          <span className="font-mono font-bold text-white text-[11px]">{pct}%</span>
                        </div>
                      </td>
                      <td className="p-4 font-mono text-amber-400">{rep.commissionRate}%</td>
                      <td className="p-4 text-center font-mono font-bold text-emerald-400">{formatCurrency(commission)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: Customer Credit Limits & Aging */}
      {activeTab === 'credit' && (
        <div className="bg-[#151b2b] rounded-2xl border border-slate-800 overflow-hidden">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <h3 className="font-bold text-white text-sm">مراقبة الحدود الائتمانية وأعمار الديون (Aging of Accounts Receivable)</h3>
            <span className="text-xs text-red-400 font-bold">● تنبيه آلي عند تجاوز الحد الائتماني</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-[#0f172a] text-slate-400 font-bold border-b border-slate-800">
                <tr>
                  <th className="p-4">اسم العميل</th>
                  <th className="p-4">الحد الائتماني الأقصى</th>
                  <th className="p-4">الرصيد الحالي</th>
                  <th className="p-4">0 - 30 يوم</th>
                  <th className="p-4">30 - 60 يوم</th>
                  <th className="p-4 text-red-400">أكثر من 60 يوم</th>
                  <th className="p-4 text-center">حالة الائتمان</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {credits.map((c) => {
                  const isOver = c.currentBalance > c.creditLimit;
                  return (
                    <tr key={c.id} className="hover:bg-slate-800/30 transition-all">
                      <td className="p-4 font-bold text-white">{c.name}</td>
                      <td className="p-4 font-mono text-slate-300">{formatCurrency(c.creditLimit)}</td>
                      <td className="p-4 font-mono font-bold text-blue-400">{formatCurrency(c.currentBalance)}</td>
                      <td className="p-4 font-mono text-slate-300">{formatCurrency(c.aging0_30)}</td>
                      <td className="p-4 font-mono text-amber-400">{formatCurrency(c.aging30_60)}</td>
                      <td className="p-4 font-mono font-bold text-red-400">{formatCurrency(c.aging60_plus)}</td>
                      <td className="p-4 text-center">
                        {isOver ? (
                          <span className="px-2.5 py-1 bg-red-500/20 text-red-400 border border-red-500/30 rounded-xl font-bold text-[10px]">
                            متجاوز الحد!
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-400 rounded-xl font-bold text-[10px]">
                            ضمن الحد الآمن
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: Create Order */}
      {showNewOrderModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#151b2b] border border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4">
            <h3 className="text-base font-black text-white">إنشاء أمر بيع أو عرض سعر جديد</h3>
            <form onSubmit={handleCreateOrder} className="space-y-4">
              <div>
                <label className="text-xs text-slate-400 block mb-1 font-bold">نوع المستند:</label>
                <select 
                  value={newOrderType} 
                  onChange={(e) => setNewOrderType(e.target.value as any)}
                  className="w-full p-2.5 bg-[#0f172a] border border-slate-700 rounded-xl text-xs text-white outline-none font-bold"
                >
                  <option value="SALES_ORDER">أمر بيع (Sales Order)</option>
                  <option value="QUOTATION">عرض سعر (Quotation)</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1 font-bold">اسم العميل:</label>
                <input 
                  type="text" 
                  required
                  placeholder="مثال: شركة النور للتجارة" 
                  value={newOrderCust}
                  onChange={(e) => setNewOrderCust(e.target.value)}
                  className="w-full p-2.5 bg-[#0f172a] border border-slate-700 rounded-xl text-xs text-white outline-none"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1 font-bold">القيمة التقديرية (ج.م):</label>
                <input 
                  type="number" 
                  required
                  min="1"
                  placeholder="0.00" 
                  value={newOrderAmount}
                  onChange={(e) => setNewOrderAmount(e.target.value)}
                  className="w-full p-2.5 bg-[#0f172a] border border-slate-700 rounded-xl text-xs text-white outline-none font-mono font-bold"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button 
                  type="button" 
                  onClick={() => setShowNewOrderModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-all"
                >
                  إلغاء
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-blue-600/30"
                >
                  حفظ المستند
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
