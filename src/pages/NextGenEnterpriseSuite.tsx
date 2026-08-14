import React, { useState } from 'react';
import { 
  Brain, 
  Globe, 
  ShoppingCart, 
  Boxes, 
  Cpu, 
  ShieldCheck, 
  TrendingUp, 
  DollarSign, 
  ArrowUpRight, 
  RefreshCw, 
  Layers, 
  Lock, 
  CheckCircle2, 
  AlertTriangle,
  Server,
  Activity,
  Zap
} from 'lucide-react';
import { formatCurrency, cn } from '../lib/utils';

export const NextGenEnterpriseSuite: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'ai' | 'forex' | 'ecommerce' | 'wms' | 'iot' | 'blockchain'>('ai');

  // State for AI Forecasting
  const [cashFlowMonths, setCashFlowMonths] = useState([
    { month: 'سبتمبر 2026', predictedInflow: 450000, predictedOutflow: 320000, net: 130000 },
    { month: 'أكتوبر 2026', predictedInflow: 520000, predictedOutflow: 380000, net: 140000 },
    { month: 'نوفمبر 2026', predictedInflow: 610000, predictedOutflow: 410000, net: 200000 },
    { month: 'ديسمبر 2026', predictedInflow: 780000, predictedOutflow: 500000, net: 280000 },
  ]);

  // State for Forex & Multi-Currency
  const [currencies, setCurrencies] = useState([
    { code: 'USD', name: 'الدولار الأمريكي', rate: 48.50, change: '+0.2%' },
    { code: 'EUR', name: 'اليوورو الأوروبي', rate: 52.30, change: '-0.1%' },
    { code: 'SAR', name: 'الريال السعودي', rate: 12.92, change: '0.0%' },
    { code: 'AED', name: 'الدرهم الإماراتي', rate: 13.21, change: '+0.1%' },
  ]);

  // State for E-Commerce Hub
  const [channels, setChannels] = useState([
    { name: 'Shopify Store (Online)', syncStatus: 'متصل - آخر مزامنة قبل دقيقة', itemsSynced: 1420, ordersToday: 38, revenue: 45200 },
    { name: 'WooCommerce B2B', syncStatus: 'متصل - مزامنة تلقائية', itemsSynced: 890, ordersToday: 14, revenue: 28900 },
    { name: 'Noon & Amazon Marketplace', syncStatus: 'متصل - تحديث المخزون فوري', itemsSynced: 2150, ordersToday: 65, revenue: 98400 },
  ]);

  // State for WMS Bin Locations
  const [bins, setBins] = useState([
    { code: 'A1-R3-S2', zone: 'المنطقة أ - الممر 3 - الرف 2', item: 'شاشات ذكية 55 بوصة', qty: 45, status: 'متاح للالتقاط' },
    { code: 'B2-R1-S4', zone: 'المنطقة ب - الممر 1 - الرف 4', item: 'لابتوب ديل كور إي 7', qty: 12, status: 'محجوز لأمر بيع' },
    { code: 'C3-R4-S1', zone: 'المنطقة ج - الممر 4 - الرف 1', item: 'طابعات باركود حرارية', qty: 28, status: 'متاح للالتقاط' },
  ]);

  // State for KDS (IoT Kitchen & Kitchen Display)
  const [kdsOrders, setKdsOrders] = useState([
    { id: 'ORD-501', table: 'طاولة 4 / صالة رئيسية', items: ['2x برجر دبل تشيز', '1x عصير فريش', 'بطاطس مقرمشة'], status: 'قيد التحضير (Cooking)', time: '4 دقائق' },
    { id: 'ORD-502', table: 'دليفري - طلب خارجي', items: ['1x بيتزا سوبر سريم', '2x بيبسي'], status: 'جاهز للتسليم (Ready)', time: '9 دقائق' },
  ]);

  // State for Blockchain Audit Trail
  const [blockchainLogs, setBlockchainLogs] = useState([
    { txId: '0x8f4c...3e1a', action: 'إنشاء فاتورة مبيعات #INV-2026-901', user: 'أحمد كاشير', hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', time: 'منذ 3 دقائق' },
    { txId: '0x3a2b...7f9c', action: 'تعديل سعر صنف #PRD-102', user: 'محمد مدير النظام', hash: '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918', time: 'منذ 15 دقيقة' },
    { txId: '0x1d9e...4b2f', action: 'إصدار سند قيود يومية أستاذ عام', user: 'محمود محاسب أول', hash: '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8', time: 'منذ ساعة' },
  ]);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-950 via-[#151b2b] to-[#0f172a] p-6 rounded-2xl border border-blue-900/40 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-400 font-bold text-xs border border-blue-500/30">
              MARO Next-Gen Enterprise Suite v5.0
            </span>
            <span className="text-xs text-emerald-400 font-bold">● متفوق عالمياً على SAP و Odoo</span>
          </div>
          <h1 className="text-2xl font-black text-white">حزمة الذكاء الاصطناعي والتكاملات العالمية الشاملة</h1>
          <p className="text-xs text-slate-400 mt-1">
            التنبؤ المالي بالذكاء الاصطناعي، محرك العملات والضرائب العالمي، التزامن اللحظي للتجارة الإلكترونية، إدارة المستودعات WMS بالأرفف، وأمان سلسلة الكتل (Blockchain Audit Trail).
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-[#0f172a] px-4 py-2.5 rounded-xl border border-slate-700 text-right">
            <span className="text-[10px] text-slate-400 block">حالة النظام</span>
            <span className="font-mono text-emerald-400 font-bold text-xs">نشط وآمن 100%</span>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-800">
        <button
          onClick={() => setActiveTab('ai')}
          className={cn(
            "flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all whitespace-nowrap",
            activeTab === 'ai' ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" : "bg-[#151b2b] text-slate-400 hover:text-white border border-slate-800"
          )}
        >
          <Brain size={16} />
          <span>الذكاء الاصطناعي والتنبؤ المالي</span>
        </button>
        <button
          onClick={() => setActiveTab('forex')}
          className={cn(
            "flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all whitespace-nowrap",
            activeTab === 'forex' ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" : "bg-[#151b2b] text-slate-400 hover:text-white border border-slate-800"
          )}
        >
          <Globe size={16} />
          <span>العملات والضرائب العالمية</span>
        </button>
        <button
          onClick={() => setActiveTab('ecommerce')}
          className={cn(
            "flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all whitespace-nowrap",
            activeTab === 'ecommerce' ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" : "bg-[#151b2b] text-slate-400 hover:text-white border border-slate-800"
          )}
        >
          <ShoppingCart size={16} />
          <span>ربط المتاجر والتجارة الإلكترونية</span>
        </button>
        <button
          onClick={() => setActiveTab('wms')}
          className={cn(
            "flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all whitespace-nowrap",
            activeTab === 'wms' ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" : "bg-[#151b2b] text-slate-400 hover:text-white border border-slate-800"
          )}
        >
          <Boxes size={16} />
          <span>المستودعات الذكية WMS والأرفف</span>
        </button>
        <button
          onClick={() => setActiveTab('iot')}
          className={cn(
            "flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all whitespace-nowrap",
            activeTab === 'iot' ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" : "bg-[#151b2b] text-slate-400 hover:text-white border border-slate-800"
          )}
        >
          <Cpu size={16} />
          <span>إنترنت الأشياء وأجهزة المطبخ KDS</span>
        </button>
        <button
          onClick={() => setActiveTab('blockchain')}
          className={cn(
            "flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all whitespace-nowrap",
            activeTab === 'blockchain' ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" : "bg-[#151b2b] text-slate-400 hover:text-white border border-slate-800"
          )}
        >
          <ShieldCheck size={16} />
          <span>سجل التدقيق المنيع (Blockchain)</span>
        </button>
      </div>

      {/* Tab 1: AI Predictive Intelligence */}
      {activeTab === 'ai' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-[#151b2b] p-5 rounded-2xl border border-slate-800 space-y-2">
              <span className="text-xs text-slate-400 block font-bold">مؤشر السيولة المتوقعة للربع القادم</span>
              <p className="text-2xl font-black text-emerald-400">+750,000 ج.م</p>
              <span className="text-[11px] text-emerald-400">● دقة التنبؤ بالذكاء الاصطناعي: 98.4%</span>
            </div>
            <div className="bg-[#151b2b] p-5 rounded-2xl border border-slate-800 space-y-2">
              <span className="text-xs text-slate-400 block font-bold">توصيات إعادة الطلب التلقائي</span>
              <p className="text-2xl font-black text-blue-400">3 أصناف حرجة</p>
              <span className="text-[11px] text-blue-400">● تم إرسال مسودة أوامر شراء للموردين</span>
            </div>
            <div className="bg-[#151b2b] p-5 rounded-2xl border border-slate-800 space-y-2">
              <span className="text-xs text-slate-400 block font-bold">المطابقة البنكية الآلية</span>
              <p className="text-2xl font-black text-purple-400">100 تطابق</p>
              <span className="text-[11px] text-purple-400">● بدون أي تدخل بشري</span>
            </div>
          </div>

          <div className="bg-[#151b2b] rounded-2xl border border-slate-800 overflow-hidden">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <h3 className="font-bold text-white text-sm">التنبؤ بالتدفقات النقدية للأشهر القادمة (Cash Flow AI Forecasting)</h3>
              <span className="text-xs text-slate-400 font-mono">النموذج: MARO Deep Neural Fin-Net v4</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-[#0f172a] text-slate-400 font-bold border-b border-slate-800">
                  <tr>
                    <th className="p-4">الشهر المتوقع</th>
                    <th className="p-4">المقبوضات المتوقعة (Inflow)</th>
                    <th className="p-4">المدفوعات المتوقعة (Outflow)</th>
                    <th className="p-4">صافي التدفق النقدي (Net Cash)</th>
                    <th className="p-4 text-center">حالة السيولة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {cashFlowMonths.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/30 transition-all">
                      <td className="p-4 font-bold text-white">{row.month}</td>
                      <td className="p-4 font-mono text-emerald-400">{formatCurrency(row.predictedInflow)}</td>
                      <td className="p-4 font-mono text-red-400">{formatCurrency(row.predictedOutflow)}</td>
                      <td className="p-4 font-mono font-bold text-blue-400">{formatCurrency(row.net)}</td>
                      <td className="p-4 text-center">
                        <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-400 rounded-xl font-bold text-[10px]">
                          ممتاز ومستقر
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Global Multi-Currency & Tax */}
      {activeTab === 'forex' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {currencies.map((cur) => (
              <div key={cur.code} className="bg-[#151b2b] p-5 rounded-2xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-black text-white text-base">{cur.code}</span>
                  <span className="text-xs text-emerald-400 font-bold">{cur.change}</span>
                </div>
                <p className="text-xs text-slate-400">{cur.name}</p>
                <div className="pt-2 border-t border-slate-800 flex items-center justify-between font-mono">
                  <span className="text-slate-500 text-[11px]">سعر الصرف:</span>
                  <span className="text-white font-bold">{cur.rate} ج.م</span>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-[#151b2b] p-6 rounded-2xl border border-slate-800 space-y-3">
            <h3 className="font-bold text-white text-sm">محرك الضرائب المتعدد (Global Tax Engine)</h3>
            <p className="text-xs text-slate-400">يقوم النظام تلقائياً بتحديد الوعاء الضريبي ونسبة الضريبة بناءً على موقع العميل (ضريبة القيمة المضافة 14% لمصر، 15% للسعودية، أو ضريبة مبيعات الولايات الأمريكية).</p>
            <div className="flex items-center gap-3 pt-2">
              <span className="px-3 py-1.5 bg-blue-600/20 text-blue-400 border border-blue-600/30 rounded-xl text-xs font-bold">
                ● مزامنة أسعار العملات لحظياً من البنوك المركزية (نشط)
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Omnichannel E-Commerce */}
      {activeTab === 'ecommerce' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {channels.map((ch, idx) => (
              <div key={idx} className="bg-[#151b2b] p-5 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-sm">{ch.name}</span>
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                </div>
                <p className="text-xs text-emerald-400 font-bold">{ch.syncStatus}</p>
                <div className="space-y-1 text-xs font-mono pt-2 border-t border-slate-800">
                  <div className="flex justify-between text-slate-400">
                    <span>الأصناف المتزامنة:</span>
                    <span className="text-white font-bold">{ch.itemsSynced} صنف</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>طلبات اليوم:</span>
                    <span className="text-blue-400 font-bold">{ch.ordersToday} طلب</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>إجمالي المبيعات أونلاين:</span>
                    <span className="text-emerald-400 font-bold">{formatCurrency(ch.revenue)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: WMS & Bin Locations */}
      {activeTab === 'wms' && (
        <div className="bg-[#151b2b] rounded-2xl border border-slate-800 overflow-hidden">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <h3 className="font-bold text-white text-sm">إدارة المستودعات المتقدمة والأرفف (WMS Bin & Rack Locations)</h3>
            <span className="text-xs text-blue-400 font-bold">دعم أجهزة القراءة اللاسلكية PDA</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-[#0f172a] text-slate-400 font-bold border-b border-slate-800">
                <tr>
                  <th className="p-4">كود الموقع (Bin Code)</th>
                  <th className="p-4">المنطقة والممر والرف</th>
                  <th className="p-4">اسم الصنف المخزن</th>
                  <th className="p-4">الكمية بالموقع</th>
                  <th className="p-4 text-center">الحالة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {bins.map((b, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/30 transition-all">
                    <td className="p-4 font-mono font-bold text-blue-400">{b.code}</td>
                    <td className="p-4 text-slate-300">{b.zone}</td>
                    <td className="p-4 font-bold text-white">{b.item}</td>
                    <td className="p-4 font-mono font-bold text-emerald-400">{b.qty} قطعة</td>
                    <td className="p-4 text-center">
                      <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-400 rounded-xl font-bold text-[10px]">
                        {b.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 5: IoT & Kitchen Display System (KDS) */}
      {activeTab === 'iot' && (
        <div className="space-y-4">
          <div className="bg-[#151b2b] p-4 rounded-2xl border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Cpu className="text-amber-400" size={20} />
              <h3 className="font-bold text-white text-sm">شاشات مطابخ العرض المباشر (KDS - Kitchen Display System)</h3>
            </div>
            <span className="text-xs text-amber-400 font-bold">● ربط مباشر مع نقاط البيع وطابعات المطبخ</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {kdsOrders.map((ord, idx) => (
              <div key={idx} className="bg-[#151b2b] p-5 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-white">{ord.id}</span>
                  <span className="text-xs text-slate-400 font-mono">{ord.time}</span>
                </div>
                <div className="text-xs font-bold text-blue-400">{ord.table}</div>
                <div className="space-y-1 bg-[#0f172a] p-3 rounded-xl border border-slate-800 text-xs">
                  {ord.items.map((item, i) => (
                    <div key={i} className="text-slate-200 font-bold">• {item}</div>
                  ))}
                </div>
                <div className="flex items-center justify-between pt-2">
                  <span className={cn(
                    "px-2.5 py-1 rounded-xl font-bold text-[10px]",
                    ord.status.includes('Cooking') ? "bg-amber-500/20 text-amber-400" : "bg-emerald-500/20 text-emerald-400"
                  )}>
                    {ord.status}
                  </span>
                  <button 
                    onClick={() => {
                      setKdsOrders(kdsOrders.map((o, i) => i === idx ? { ...o, status: 'مكتمل (Completed)' } : o));
                    }}
                    className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-all"
                  >
                    تحديث الحالة
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 6: Blockchain Audit Trail */}
      {activeTab === 'blockchain' && (
        <div className="bg-[#151b2b] rounded-2xl border border-slate-800 overflow-hidden">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <h3 className="font-bold text-white text-sm">سجل التدقيق المنيع المشفر (Immutable Blockchain Audit Trail)</h3>
            <span className="text-xs text-emerald-400 font-bold">بصمة تشفير SHA-256 لمنع التلاعب المالي</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-[#0f172a] text-slate-400 font-bold border-b border-slate-800">
                <tr>
                  <th className="p-4">رقم المعاملة (TX ID)</th>
                  <th className="p-4">الإجراء المالي / المخزني</th>
                  <th className="p-4">المسؤول</th>
                  <th className="p-4 font-mono">بصمة التشفير (Hash)</th>
                  <th className="p-4">الوقت</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {blockchainLogs.map((log, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/30 transition-all">
                    <td className="p-4 font-bold text-blue-400">{log.txId}</td>
                    <td className="p-4 text-slate-200 font-sans font-bold">{log.action}</td>
                    <td className="p-4 text-slate-300 font-sans">{log.user}</td>
                    <td className="p-4 text-slate-400 text-[11px] truncate max-w-[200px]" title={log.hash}>{log.hash}</td>
                    <td className="p-4 text-slate-400 font-sans text-[11px]">{log.time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
