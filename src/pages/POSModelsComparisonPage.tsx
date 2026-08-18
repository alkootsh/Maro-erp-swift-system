/**
 * @file POSModelsComparisonPage.tsx
 * @module واجهات وصفحات النظام (UI Pages)
 * @description استديو ومقارنة نماذج نقاط البيع (POS Models) مع معاينة تفاعلية حية لكل نموذج وتطبيق المخطط المختار.
 */
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Monitor, ShoppingCart, Stethoscope, Utensils, Layers, 
  Sparkles, Sliders, Cpu, Activity, Award, CheckCircle2, 
  ArrowRight, Scale, Tag, ShieldCheck, CreditCard, Users, 
  FileText, Percent, Clock, AlertTriangle, MonitorPlay, QrCode,
  Building2, Hash, Truck, DollarSign
} from 'lucide-react';
import { formatCurrency, cn } from '../lib/utils';
import { toast } from 'react-hot-toast';

export const POSModelsComparisonPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeModel, setActiveModel] = useState<'ultra' | 'sap' | 'wholesale' | 'pharmacy' | 'restaurant'>('ultra');

  // Interactive state for Ultra model
  const [scaleBarcodeVal, setScaleBarcodeVal] = useState('2100055004509');
  
  // Interactive state for Wholesale model
  const [selectedUnit, setSelectedUnit] = useState<'piece' | 'box' | 'pallet'>('box');
  const [boxQty, setBoxQty] = useState(15);

  // Interactive state for Restaurant model
  const [selectedTable, setSelectedTable] = useState<number>(3);
  const [tableStatus, setTableStatus] = useState<Record<number, 'free' | 'occupied' | 'reserved'>>({
    1: 'occupied', 2: 'free', 3: 'occupied', 4: 'free', 5: 'reserved', 6: 'free'
  });

  // Interactive state for Pharmacy model
  const [selectedInsuranceCoPay, setSelectedInsuranceCoPay] = useState<number>(20);

  const posModels = [
    {
      id: 'ultra',
      title: 'MARO Ultra Touch (النموذج السريع للسوبرماركت)',
      badge: 'الأكثر سرعة (<20ms)',
      desc: 'واجهة باللمس فائق السرعة مخصصة للهايبرماركت والسوبرماركت. تدعم قراءة باركود ميزان الوزن، أزرار السعر السريع F1-F12، والدفع المتعدد بنقرة واحدة.',
      features: ['شبكة منتجات باللمس مع صور عالية الجودة', 'حساب تلقائي لباركود الميزان الإلكتروني (Scale Barcode)', 'أزرار الوظائف السريعة F1-F24', 'دفع فوري وسريع (كاش، شبكة، كارت)'],
      globalComp: 'يتفوق على Square و Odoo POS في سرعة الاستجابة ودعم موازين الوزن العربية والإلكترونية.',
      icon: ShoppingCart,
      color: 'from-blue-600 to-indigo-600',
      badgeColor: 'bg-blue-500/10 text-blue-400 border-blue-500/30'
    },
    {
      id: 'sap',
      title: 'SAP & Enterprise ERP POS (النموذج المؤسسي المتقدم)',
      badge: 'مقارنة مع SAP B1 & NetSuite',
      desc: 'واجهة مؤسسية معتمدة للشركات الكبرى، تعرض تفاصيل مراكز التكلفة، حسابات الأستاذ العام، حدود المديونية الائتمانية، وشروحات ضريبة ZATCA.',
      features: ['توزيع مراكز التكلفة (Cost Centers) لكل سطر', 'ربط مباشر بدفتر الأستاذ العام وجدول الضرائب', 'إدارة الفروع والعملات المزدوجة', 'التحقق الائتماني لمبيعات الآجل لحظياً'],
      globalComp: 'يعادل SAP Business One و Oracle NetSuite POS مع إضافة دعم كامل للـ ZATCA واللغة العربية.',
      icon: Monitor,
      color: 'from-purple-600 to-violet-600',
      badgeColor: 'bg-purple-500/10 text-purple-400 border-purple-500/30'
    },
    {
      id: 'wholesale',
      title: 'Wholesale B2B Terminal (نموذج بيع الجملة والموزعين)',
      badge: 'متعدد الوحدات والشرائح',
      desc: 'مصمم لمستودعات الجملة وشركات التوزيع، يدعم التحويل التلقائي بين القطعة والكرتونة والبالته، وخصومات الكميات والمندوبين.',
      features: ['تعدد وحدات البيع (قطعة، كرتونة، طرد، بالته)', 'خصومات الكميات والشرائح التلقائية', 'تحديد مندوب المبيعات وحساب العمولة', 'إصدار إذن تسليم مخزني آلياً'],
      globalComp: 'يفوق أنظمة الجملة التقليدية بمرونة تحويل الوحدات اللحظية ومزامنة أذونات الاستلام.',
      icon: Layers,
      color: 'from-emerald-600 to-teal-600',
      badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
    },
    {
      id: 'pharmacy',
      title: 'Clinical Pharmacy POS (نموذج الصيدليات الذكي)',
      badge: 'ذكاء اصطناعي سريري',
      desc: 'شاشة صيدلية متكاملة مع البحث في المادة الفعالة والبدائل الدوائية، تتبع أرقام التشغيلات وتواريخ الصلاحية، ونسب التأمين الطبي.',
      features: ['البحث عن البدائل الدوائية بالمواد الفعالة', 'تتبع رقم التشغيلة وتاريخ الصلاحية (Batch & Expiry)', 'فحص التداخلات الدوائية والتنبيه السريري', 'خصم التأمين الطبي ونسب التحمل'],
      globalComp: 'أقوى بكثير من أنظمة الصيدليات المحلية عبر دمج وكيل البدائل والربط المخزني التلقائي.',
      icon: Stethoscope,
      color: 'from-teal-600 to-cyan-600',
      badgeColor: 'bg-teal-500/10 text-teal-400 border-teal-500/30'
    },
    {
      id: 'restaurant',
      title: 'Restaurant & Cafe Touch (نموذج المطاعم والكافيهات)',
      badge: 'إدارة الطاولات والمطبخ (KDS)',
      desc: 'مخصص للمطاعم والكافيهات مع شاشات عرض المطبخ (KDS)، خريطة الصالات والطاولات، تعديلات الأطباق (Modifiers)، وتقسيم الحسابات.',
      features: ['خريطة الطاولات والصالات التفاعلية', 'إرسال الطلبات للمطبخ تلقائياً (KDS Display)', 'تعديل مكونات الوجبة وإضافات (Modifiers)', 'تقسيم الفاتورة على الزباين بسهولة'],
      globalComp: 'ينافس Revel و TouchBistro مع بساطة استثنائية وسرعة في تسجيل طلبات الطاولات.',
      icon: Utensils,
      color: 'from-amber-600 to-orange-600',
      badgeColor: 'bg-amber-500/10 text-amber-400 border-amber-500/30'
    }
  ];

  const currentModelInfo = posModels.find(m => m.id === activeModel) || posModels[0];

  const handleApplyModel = () => {
    localStorage.setItem('maro_pos_active_layout', activeModel);
    toast.success(`تم تفعيل نموذج "${currentModelInfo.title}" بنجاح وتحديث واجهة نقطة البيع!`);
    navigate('/pos');
  };

  return (
    <div className="space-y-6 pb-12 text-slate-200">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-900/60 via-indigo-900/50 to-slate-900 border border-blue-500/30 p-8 rounded-3xl relative overflow-hidden shadow-2xl">
        <div className="absolute right-0 top-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-blue-400 text-xs font-bold uppercase tracking-wider mb-2">
              <Sparkles size={16} />
              <span>استديو نماذج نقاط البيع المتقدمة (POS Multi-Model Studio)</span>
            </div>
            <h1 className="text-3xl font-black text-white">اختر وخصص نموذج الكاشير المناسب لنشاطك التجاري</h1>
            <p className="text-slate-300 text-sm mt-2 max-w-2xl leading-relaxed">
              تتيح منصة MARO نماذج متخصصة ومصممة لكل نشاط تجاري (سوبرماركت، جملة، صيدليات، مطاعم، شركات مؤسسية) مع حزم تفاعلية كاملة وأعلى سرعة أداء.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/settings/pos/layout')}
              className="flex items-center gap-2 px-5 py-3 bg-[#151b2b] hover:bg-slate-800 text-slate-200 rounded-2xl border border-[#1e293b] font-bold text-xs transition-all shadow-lg"
            >
              <Sliders size={16} className="text-blue-400" />
              <span>مُصمّم التخطيطات الحر (Layout Designer)</span>
            </button>
            <button
              onClick={() => navigate('/pos')}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-2xl font-bold text-xs shadow-xl shadow-blue-600/30 transition-all hover:scale-105"
            >
              <MonitorPlay size={16} />
              <span>الانتقال لشاشة الكاشير الحالية (POS)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Models Switcher Grid */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {posModels.map(model => {
          const Icon = model.icon;
          const isActive = activeModel === model.id;
          return (
            <div 
              key={model.id}
              onClick={() => setActiveModel(model.id as any)}
              className={cn(
                "p-5 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between group relative overflow-hidden",
                isActive 
                  ? "bg-gradient-to-b from-[#1a233a] to-[#111827] border-blue-500 shadow-xl shadow-blue-900/30 scale-[1.02]" 
                  : "bg-[#151b2b] border-[#1e293b] hover:border-slate-700 text-slate-300"
              )}
            >
              {isActive && (
                <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-500"></div>
              )}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className={cn("p-3 rounded-xl bg-gradient-to-br text-white shadow-md", model.color)}>
                    <Icon size={20} />
                  </div>
                  <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border", model.badgeColor)}>
                    {model.badge.split(' ')[0]}
                  </span>
                </div>
                <h3 className="font-bold text-white text-sm group-hover:text-blue-400 transition-colors">{model.title}</h3>
                <p className="text-xs text-slate-400 mt-1 line-clamp-2">{model.desc}</p>
              </div>
              <div className="mt-4 pt-3 border-t border-[#1e293b] flex items-center justify-between text-xs font-bold">
                <span className={isActive ? "text-blue-400" : "text-slate-500"}>
                  {isActive ? 'النموذج المحدد حالياً' : 'انقر للمعاينة'}
                </span>
                <ArrowRight size={14} className={cn("transition-transform", isActive ? "text-blue-400 translate-x-1" : "text-slate-600")} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Model Overview & Activation Bar */}
      <div className="bg-[#151b2b] p-6 rounded-3xl border border-[#1e293b] shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-blue-400 uppercase tracking-widest">الموديل المختار للعرض والتفعيل</span>
          <h2 className="text-xl font-black text-white mt-1 flex items-center gap-2">
            <span>{currentModelInfo.title}</span>
            <span className={cn("text-xs px-2.5 py-0.5 rounded-full font-bold border", currentModelInfo.badgeColor)}>
              {currentModelInfo.badge}
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">{currentModelInfo.desc}</p>
        </div>

        <button
          onClick={handleApplyModel}
          className="w-full md:w-auto px-8 py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-sm rounded-2xl shadow-xl shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all hover:scale-105 shrink-0 cursor-pointer"
        >
          <CheckCircle2 size={18} />
          <span>تفعيل واكتفاء هذا الموديل بنقطة البيع</span>
        </button>
      </div>

      {/* Interactive Visual Preview Stage for Selected POS Model */}
      <div className="bg-[#0f172a] p-6 rounded-3xl border border-[#1e293b] shadow-2xl relative overflow-hidden">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-[#1e293b]">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-xs font-black text-white uppercase tracking-wider">
              معاينة الواجهة التفاعلية الحية ({activeModel.toUpperCase()} LIVE TERMINAL PREVIEW)
            </span>
          </div>
          <span className="text-[11px] font-mono text-slate-400 bg-slate-800 px-3 py-1 rounded-lg border border-slate-700">
            أدوات تحكم تفاعلية مخصصة لهذا النمط
          </span>
        </div>

        {/* 1. ULTRA SUPERMARKET TOUCH MODEL */}
        {activeModel === 'ultra' && (
          <div className="space-y-6">
            {/* Speed Function Keys F1-F6 */}
            <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
              {[
                { key: 'F1', label: 'بحث سريع (Search)', color: 'bg-blue-600/30 text-blue-300 border-blue-500/40' },
                { key: 'F2', label: 'ميزان الوزن (Scale)', color: 'bg-emerald-600/30 text-emerald-300 border-emerald-500/40' },
                { key: 'F3', label: 'خصومات وفئات', color: 'bg-purple-600/30 text-purple-300 border-purple-500/40' },
                { key: 'F4', label: 'تعليق السلة (Hold)', color: 'bg-amber-600/30 text-amber-300 border-amber-500/40' },
                { key: 'F5', label: 'دفع سريع كاش', color: 'bg-teal-600/30 text-teal-300 border-teal-500/40' },
                { key: 'F12', label: 'إغلاق وردية Z', color: 'bg-rose-600/30 text-rose-300 border-rose-500/40' }
              ].map((fk) => (
                <div key={fk.key} className={cn("p-2.5 rounded-xl border text-center font-mono text-xs font-bold", fk.color)}>
                  <div className="text-[10px] opacity-75">{fk.key}</div>
                  <div className="truncate mt-0.5">{fk.label}</div>
                </div>
              ))}
            </div>

            {/* Scale Barcode Simulator */}
            <div className="p-4 rounded-2xl bg-[#151b2b] border border-blue-500/30 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-500/20 text-blue-400 rounded-xl border border-blue-500/30">
                  <Scale size={24} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">محاكي ميزان الباركود الإلكتروني (Scale Barcode Parser)</h4>
                  <p className="text-[11px] text-slate-400">فك شفرة باركود الوزن التلقائي (الرمز + الوزن بالكيلو + السعر الإجمالي)</p>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full md:w-auto">
                <input 
                  type="text" 
                  value={scaleBarcodeVal}
                  onChange={(e) => setScaleBarcodeVal(e.target.value)}
                  className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-emerald-400 text-center w-40"
                  placeholder="2100055004509"
                />
                <div className="px-3 py-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold rounded-xl whitespace-nowrap">
                  الوزن المستخرج: 4.50 كجم | الإجمالي: 55.00 ج.م
                </div>
              </div>
            </div>

            {/* Grocery Touch Grid Mockup */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { name: 'تفاح أحمر سكري (وزن)', price: '35.00 ج.م/كجم', tag: 'ميزان', img: '🍎' },
                { name: 'حليب كامل الدسم 1 لتر', price: '42.00 ج.م', tag: 'باركود', img: '🥛' },
                { name: 'أرز بسمتي فاخر 5 كجم', price: '280.00 ج.م', tag: 'عرض', img: '🌾' },
                { name: 'مياه معدنية 1.5 لتر (كرتونة)', price: '65.00 ج.م', tag: 'جملة', img: '💧' }
              ].map((p, idx) => (
                <div key={idx} className="p-4 rounded-2xl bg-[#151b2b] border border-[#1e293b] hover:border-blue-500/50 transition-all flex items-center gap-3">
                  <span className="text-3xl">{p.img}</span>
                  <div>
                    <span className="text-[10px] font-bold text-blue-400 px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/20">{p.tag}</span>
                    <h5 className="text-xs font-bold text-white mt-1">{p.name}</h5>
                    <p className="text-xs font-mono text-emerald-400 font-bold mt-0.5">{p.price}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 2. SAP & ENTERPRISE ERP POS MODEL */}
        {activeModel === 'sap' && (
          <div className="space-y-6">
            {/* Corporate Header & G/L Credit Line Indicator */}
            <div className="p-4 rounded-2xl bg-purple-950/30 border border-purple-500/30 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-purple-500/20 text-purple-400 rounded-xl border border-purple-500/30">
                  <Building2 size={24} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">الربط بدفتر الأستاذ العام ومراكز التكلفة (SAP G/L & Cost Center)</h4>
                  <p className="text-[11px] text-slate-400">توجيه المحاسبة التلقائي، حساب الضريبة المركبة، والتحقق من السقف الائتماني للعميل</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="px-3 py-1.5 bg-slate-900 border border-slate-700 text-purple-300 text-xs font-mono rounded-xl">
                  مركز التكلفة: CC-101 (الفرع الرئيسي)
                </div>
                <div className="px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-bold rounded-xl">
                  الحد الائتماني: 100,000 ج.م (المتبقي: 64,500 ج.م)
                </div>
              </div>
            </div>

            {/* Enterprise G/L Item Line Table Mockup */}
            <div className="overflow-x-auto rounded-2xl border border-[#1e293b] bg-[#151b2b]">
              <table className="w-full text-right text-xs">
                <thead className="bg-[#0f172a] text-slate-400 font-bold border-b border-[#1e293b]">
                  <tr>
                    <th className="p-3">الصنف / الخادمة</th>
                    <th className="p-3">مركز التكلفة</th>
                    <th className="p-3">حساب الأستاذ (G/L Account)</th>
                    <th className="p-3">الضريبة (VAT 15%)</th>
                    <th className="p-3">الإجمالي الشامل</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1e293b]">
                  <tr>
                    <td className="p-3 font-bold text-white">تجهيزات مكتبية وشاشات VDT</td>
                    <td className="p-3 text-purple-400 font-mono">CC-DEPT-IT</td>
                    <td className="p-3 text-slate-300 font-mono">410100 - إيرادات مبيعات المعدات</td>
                    <td className="p-3 text-emerald-400 font-mono">150.00 ج.م</td>
                    <td className="p-3 text-white font-mono font-bold">1,150.00 ج.م</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-bold text-white">عقد صيانة خوادم سنوي B2B</td>
                    <td className="p-3 text-purple-400 font-mono">CC-DEPT-SERV</td>
                    <td className="p-3 text-slate-300 font-mono">410200 - إيرادات الخدمات والاستشارات</td>
                    <td className="p-3 text-emerald-400 font-mono">750.00 ج.م</td>
                    <td className="p-3 text-white font-mono font-bold">5,750.00 ج.م</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 3. WHOLESALE B2B TERMINAL MODEL */}
        {activeModel === 'wholesale' && (
          <div className="space-y-6">
            <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-500/30 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
                  <Truck size={24} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">محول وحدات الجملة والتوزيع (Multi-Unit Wholesale Engine)</h4>
                  <p className="text-[11px] text-slate-400">التحويل التلقائي بين (قطعة - كرتونة - بالته) وتطبيق خصومات شرائح الكمية</p>
                </div>
              </div>

              {/* Unit Selector Switches */}
              <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-700">
                {(['piece', 'box', 'pallet'] as const).map((u) => (
                  <button
                    key={u}
                    onClick={() => setSelectedUnit(u)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer",
                      selectedUnit === u 
                        ? "bg-emerald-600 text-white shadow-md" 
                        : "text-slate-400 hover:text-white"
                    )}
                  >
                    {u === 'piece' ? 'قطعة (Piece)' : u === 'box' ? 'كرتونة (Box x24)' : 'بالته (Pallet x120)'}
                  </button>
                ))}
              </div>
            </div>

            {/* Volume Tier Discount Mockup */}
            <div className="p-5 rounded-2xl bg-[#151b2b] border border-[#1e293b] flex flex-col md:flex-row items-center justify-between gap-4">
              <div>
                <span className="text-[10px] text-emerald-400 font-bold uppercase">جدول خصم الشرائح التلقائي</span>
                <h5 className="text-sm font-bold text-white mt-1">عصير طبيعي 1 لتر - معامل التحويل: 1 كرتونة = 24 قطعة</h5>
                <p className="text-xs text-slate-400 mt-1">الكمية المطلوبة حالياً: {boxQty} كرتونة ({boxQty * 24} قطعة)</p>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-center p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <div className="text-[10px] text-slate-400">السعر الأساسي</div>
                  <div className="text-xs font-bold text-slate-200 mt-0.5">360 ج.م / كرتونة</div>
                </div>
                <div className="text-center p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/40">
                  <div className="text-[10px] text-emerald-400 font-bold">خصم الشريحة (10+ كرتونة)</div>
                  <div className="text-xs font-bold text-emerald-300 mt-0.5">324 ج.م / كرتونة (-10%)</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 4. CLINICAL PHARMACY POS MODEL */}
        {activeModel === 'pharmacy' && (
          <div className="space-y-6">
            <div className="p-4 rounded-2xl bg-teal-950/30 border border-teal-500/30 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-teal-500/20 text-teal-400 rounded-xl border border-teal-500/30">
                  <Stethoscope size={24} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">مساعد الصيدلية السريري والبدائل (Clinical AI & Alternatives)</h4>
                  <p className="text-[11px] text-slate-400">البحث بالاسم العلمي، فحص التداخل الدوائي، وتتبع تاريخ الصلاحية والتشغيلة</p>
                </div>
              </div>

              {/* Insurance Copay Selector */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-300">نسبة التحمل التأميني:</span>
                <select 
                  value={selectedInsuranceCoPay}
                  onChange={(e) => setSelectedInsuranceCoPay(Number(e.target.value))}
                  className="bg-slate-900 border border-slate-700 text-teal-300 text-xs font-bold rounded-xl px-3 py-1.5"
                >
                  <option value={0}>تأمين شامل 100% (تحمل 0%)</option>
                  <option value={10}>تأمين بوبا (تحمل 10%)</option>
                  <option value={20}>تأمين التعاونية (تحمل 20%)</option>
                  <option value={50}>تأمين نقابي (تحمل 50%)</option>
                </select>
              </div>
            </div>

            {/* Medicine Batch & Expiry Table Mockup */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-[#151b2b] border border-[#1e293b]">
                <div className="flex items-center justify-between mb-2">
                  <h5 className="text-xs font-bold text-white">باندول اكسترا 500 ملجم (24 قرص)</h5>
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">صالح 18 شهر</span>
                </div>
                <div className="text-[11px] text-slate-400 font-mono space-y-1">
                  <div>المادة الفعالة: Paracetamol 500mg + Caffeine 65mg</div>
                  <div>رقم التشغيلة (Batch): BATCH-2026-9904</div>
                  <div>تاريخ الانتهاء: 12/2027 | المخزون المتاح: 140 علبة</div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[#151b2b] border border-amber-500/30 bg-amber-950/10">
                <div className="flex items-center justify-between mb-2">
                  <h5 className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                    <AlertTriangle size={14} />
                    <span>البدائل الدوائية المتاحة بنفس المادة الفعالة</span>
                  </h5>
                  <span className="text-[10px] font-bold text-amber-400">3 بدائل متوفرة</span>
                </div>
                <div className="text-[11px] text-slate-300 space-y-1">
                  <div className="flex justify-between border-b border-amber-500/20 pb-1">
                    <span>1. بارامول 500 ملجم</span>
                    <span className="font-mono text-emerald-400 font-bold">18.00 ج.م (توفير 40%)</span>
                  </div>
                  <div className="flex justify-between pt-1">
                    <span>2. أدول اكسترا أقراص</span>
                    <span className="font-mono text-emerald-400 font-bold">22.00 ج.م</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 5. RESTAURANT & CAFE TOUCH MODEL */}
        {activeModel === 'restaurant' && (
          <div className="space-y-6">
            <div className="p-4 rounded-2xl bg-amber-950/30 border border-amber-500/30 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-amber-500/20 text-amber-400 rounded-xl border border-amber-500/30">
                  <Utensils size={24} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">خريطة طاولات الصالة وإرسال المطبخ (Dining Tables & KDS)</h4>
                  <p className="text-[11px] text-slate-400">إدارة الصالات، توزيع الطلبات للشاشات والمطبخ، وتعديل المكونات (Modifiers)</p>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs font-bold">
                <span className="flex items-center gap-1 text-emerald-400"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> فارغة</span>
                <span className="flex items-center gap-1 text-amber-400"><span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> مشغول</span>
                <span className="flex items-center gap-1 text-purple-400"><span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span> محجوزة</span>
              </div>
            </div>

            {/* Dining Table Map Mockup Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
              {[1, 2, 3, 4, 5, 6].map((tbl) => {
                const st = tableStatus[tbl];
                const isSelected = selectedTable === tbl;
                return (
                  <div
                    key={tbl}
                    onClick={() => setSelectedTable(tbl)}
                    className={cn(
                      "p-4 rounded-2xl border text-center cursor-pointer transition-all",
                      isSelected ? "ring-2 ring-amber-400 border-amber-500 scale-105" : "",
                      st === 'occupied' ? "bg-amber-950/40 border-amber-500/50 text-amber-200" :
                      st === 'reserved' ? "bg-purple-950/40 border-purple-500/50 text-purple-200" :
                      "bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700"
                    )}
                  >
                    <div className="text-[10px] font-bold opacity-75">طاولة</div>
                    <div className="text-lg font-black mt-0.5">#{tbl}</div>
                    <div className="text-[10px] font-bold mt-1">
                      {st === 'occupied' ? 'مشغولة (4)' : st === 'reserved' ? 'محجوزة 8:00' : 'فارغة'}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Model Comparison Checklist & Global ERP Benchmarks */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-[#151b2b] p-8 rounded-3xl border border-[#1e293b] shadow-xl space-y-6">
          <div className="flex items-center justify-between border-b border-[#1e293b] pb-4">
            <div>
              <span className="text-xs font-bold text-blue-400 uppercase tracking-widest">مميزات الموديل المختار</span>
              <h3 className="text-xl font-black text-white mt-0.5">{currentModelInfo.title}</h3>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {currentModelInfo.features.map((feat, idx) => (
              <div key={idx} className="flex items-center gap-3 p-3.5 rounded-xl bg-[#0f172a] border border-[#1e293b]">
                <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                <span className="text-xs font-bold text-slate-200">{feat}</span>
              </div>
            ))}
          </div>

          <div className="p-4 rounded-2xl bg-blue-950/20 border border-blue-500/30 flex items-start gap-3">
            <Award className="text-blue-400 shrink-0 mt-0.5" size={20} />
            <div>
              <h4 className="text-xs font-bold text-blue-300 uppercase">مقارنة المعيار العالمي (Global ERP Benchmark):</h4>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                {currentModelInfo.globalComp}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-[#151b2b] p-8 rounded-3xl border border-[#1e293b] shadow-xl flex flex-col justify-between space-y-6">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
              <Activity className="text-emerald-400" size={20} />
              <span>مؤشرات السرعة والدقة (KPIs)</span>
            </h3>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs font-bold mb-1.5">
                  <span className="text-slate-400">سرعة استجابة السلة والباركود</span>
                  <span className="text-emerald-400">12ms (&lt; 50ms المستهدف)</span>
                </div>
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 w-[95%]"></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold mb-1.5">
                  <span className="text-slate-400">معدل دقة حساب الضرائب والخصومات</span>
                  <span className="text-blue-400">100% مطابقة للزكاة والدخل</span>
                </div>
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 w-full"></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold mb-1.5">
                  <span className="text-slate-400">المرونة والعمل بدون إنترنت (Offline Sync)</span>
                  <span className="text-purple-400">مزامنة تلقائية 100%</span>
                </div>
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-purple-500 w-[98%]"></div>
                </div>
              </div>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-indigo-950 border border-indigo-500/30">
            <h4 className="text-xs font-bold text-indigo-300 uppercase flex items-center gap-2">
              <Cpu size={16} />
              <span>لماذا يتفوق مارو على المنافسين؟</span>
            </h4>
            <p className="text-[11px] text-slate-300 mt-2 leading-relaxed">
              يجمع نظام مارو بين سلاسة أنظمة التجزئة الحديثة وقوة أنظمة ERP العالمية (مثل SAP و Odoo) دون تعقيد، مع دعم أزرار الوظائف F1-F24 والتعرف الفوري على باركود الأوزان والكراتين.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
