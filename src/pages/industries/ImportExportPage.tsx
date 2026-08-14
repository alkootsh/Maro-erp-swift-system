import React, { useState } from 'react';
import { 
  Ship, 
  Container, 
  Anchor, 
  FileCheck, 
  DollarSign, 
  ArrowDownToLine, 
  ArrowUpFromLine, 
  Calendar, 
  Plus, 
  Search, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  Scale,
  CreditCard,
  Building,
  Landmark,
  Calculator
} from 'lucide-react';
import { ImportExportShipment } from '../../types/industryModules';
import { formatCurrency, cn } from '../../lib/utils';

export const ImportExportPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'shipments' | 'landed_cost' | 'lc_banking'>('shipments');
  const [filterType, setFilterType] = useState<'ALL' | 'IMPORT' | 'EXPORT'>('ALL');

  // Active Shipments State
  const [shipments, setShipments] = useState<ImportExportShipment[]>([
    {
      id: 'shp1',
      shipmentNumber: 'IMP-2026-8801',
      operationType: 'IMPORT',
      customsDeclarationNumber: 'شهادة جمركية 46 - رقم 99120',
      acidNumber: 'ACID-EG-2026-99882190',
      clientOrSupplierName: 'شركة شنغهاي للآلات والمعدات الثقيلة (China)',
      countryOfOriginOrDestination: 'جمهورية الصين الشعبية (China)',
      incoterms: 'CIF',
      portOfLoading: 'ميناء شنغهاي الدولي (Shanghai Port)',
      portOfDischarge: 'ميناء الإسكندرية البحري (Alexandria Port)',
      shippingLine: 'ميرسك العالمية (Maersk Line)',
      blOrAwbNumber: 'MSK-BL-88910293',
      containerCount: 4,
      containerNumbers: ['MSKU-991823-1', 'MSKU-991824-7', 'MSKU-991825-2', 'MSKU-991826-8'],
      goodsDescription: 'خطوط إنتاج وتعبئة أوتوماتيكية وقطع غيار إلكترونية',
      totalInvoiceForeignCurrency: 120000,
      foreignCurrency: 'USD',
      exchangeRate: 48.50,
      totalInvoiceLocalCurrency: 5820000,
      customsDuty: 291000, // 5%
      vatTax: 855540, // 14%
      shippingFreightCost: 280000,
      customsClearanceFee: 35000,
      portHandlingAndStorageCost: 45000,
      totalLandedCost: 6471000, // FOB + Freight + Customs + Clearance + Handling
      paymentFinancingMethod: 'اعتماد مستندي (LC)',
      lcNumber: 'LC-NBE-2026-4401',
      issuingBank: 'البنك الأهلي المصري (NBE)',
      status: 'CUSTOMS_CLEARANCE'
    },
    {
      id: 'shp2',
      shipmentNumber: 'EXP-2026-3304',
      operationType: 'EXPORT',
      customsDeclarationNumber: 'شهادة صادر 46 - رقم 41209',
      acidNumber: 'ACID-SA-9901123',
      clientOrSupplierName: 'مؤسسة الرياض لتجارة الأغذية والتوزيع (السعودية)',
      countryOfOriginOrDestination: 'المملكة العربية السعودية',
      incoterms: 'FOB',
      portOfLoading: 'ميناء دمياط البحري',
      portOfDischarge: 'ميناء جدة الإسلامي',
      shippingLine: 'MSC Mediterranean Shipping',
      blOrAwbNumber: 'MSC-BL-33019284',
      containerCount: 2,
      containerNumbers: ['MSCU-440192-3', 'MSCU-440193-9'],
      goodsDescription: 'حاصلات زراعية مصرية درجة أولى (برتقال صيفي وفراولة مبردة)',
      totalInvoiceForeignCurrency: 65000,
      foreignCurrency: 'USD',
      exchangeRate: 48.50,
      totalInvoiceLocalCurrency: 3152500,
      customsDuty: 0,
      vatTax: 0,
      shippingFreightCost: 85000,
      customsClearanceFee: 18000,
      portHandlingAndStorageCost: 15000,
      totalLandedCost: 3152500,
      paymentFinancingMethod: 'تحصيل مستندي (CAD)',
      issuingBank: 'بنك مصر (Banque Misr)',
      status: 'ON_VESSEL'
    }
  ]);

  const filteredShipments = filterType === 'ALL' ? shipments : shipments.filter(s => s.operationType === filterType);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-[#151b2b] border border-indigo-500/30 rounded-3xl p-6 shadow-2xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-blue-500"></div>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Ship size={14} />
              <span>Import, Export & International Trade Logistics</span>
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-white">
            شركات الاستيراد والتصدير، التخليص الجمركي والشحن الدولي
          </h1>
          <p className="text-xs md:text-sm text-slate-400">
            تتبع الحاويات وبوالص الشحن B/L، شهادات الـ ACID والإفراج الجمركي، الاعتمادات المستندية LC، واحتساب التكلفة الاستيرادية المحملة (Landed Cost).
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-[#0f172a] p-3.5 rounded-2xl border border-slate-800 flex items-center gap-3">
            <Container className="text-indigo-400" size={26} />
            <div>
              <p className="text-[10px] text-slate-400">إجمالي قيمة الرسائل الاستيرادية</p>
              <p className="text-xs font-bold text-white">
                {formatCurrency(shipments.filter(s => s.operationType === 'IMPORT').reduce((acc, s) => acc + s.totalLandedCost, 0))}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('shipments')}
          className={cn(
            "px-5 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2",
            activeTab === 'shipments' ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20" : "bg-slate-900 text-slate-400 hover:text-white"
          )}
        >
          <Ship size={16} />
          <span>بوالص الشحن والرسائل الجمركية ({shipments.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('landed_cost')}
          className={cn(
            "px-5 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2",
            activeTab === 'landed_cost' ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20" : "bg-slate-900 text-slate-400 hover:text-white"
          )}
        >
          <Calculator size={16} />
          <span>حاسبة التكلفة الاستيرادية المحملة (Landed Cost)</span>
        </button>
        <button
          onClick={() => setActiveTab('lc_banking')}
          className={cn(
            "px-5 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2",
            activeTab === 'lc_banking' ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20" : "bg-slate-900 text-slate-400 hover:text-white"
          )}
        >
          <Landmark size={16} />
          <span>الاعتمادات المستندية (LC) والتمويل البنكي</span>
        </button>
      </div>

      {/* TAB 1: SHIPMENTS & CUSTOMS */}
      {activeTab === 'shipments' && (
        <div className="space-y-6">
          {/* Sub Filters */}
          <div className="flex gap-2">
            {[
              { id: 'ALL', label: 'جميع الرسائل' },
              { id: 'IMPORT', label: 'رسائل استيرادية (وارد)' },
              { id: 'EXPORT', label: 'شحنات تصديرية (صادر)' }
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setFilterType(f.id as any)}
                className={cn(
                  "px-4 py-1.5 rounded-xl text-xs font-bold transition-all",
                  filterType === f.id ? "bg-indigo-600 text-white" : "bg-slate-900 text-slate-400 hover:text-white"
                )}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredShipments.map((shp) => (
              <div key={shp.id} className="bg-[#151b2b] border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-900 text-indigo-400 border border-slate-700">
                        {shp.shipmentNumber}
                      </span>
                      <span className={cn(
                        "text-[10px] font-bold px-2 py-0.5 rounded-full border",
                        shp.operationType === 'IMPORT' ? "bg-purple-500/20 text-purple-300 border-purple-500/30" : "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                      )}>
                        {shp.operationType === 'IMPORT' ? 'استيراد وارد' : 'تصدير خارجي'} ({shp.incoterms})
                      </span>
                    </div>
                    <h3 className="text-base font-black text-white mt-1.5">{shp.clientOrSupplierName}</h3>
                    <p className="text-xs text-slate-400">{shp.countryOfOriginOrDestination}</p>
                  </div>

                  <span className={cn(
                    "text-[10px] font-bold px-2.5 py-0.5 rounded-full border",
                    shp.status === 'CUSTOMS_CLEARANCE' ? "bg-amber-500/20 text-amber-300 border-amber-500/30" :
                    shp.status === 'ON_VESSEL' ? "bg-blue-500/20 text-blue-300 border-blue-500/30" : "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                  )}>
                    {shp.status === 'CUSTOMS_CLEARANCE' ? 'قيد التخليص الجمركي' :
                     shp.status === 'ON_VESSEL' ? 'على ظهر السفينة (في البحر)' : 'تم الإفراج بالمخازن'}
                  </span>
                </div>

                <div className="bg-[#0f172a] p-3.5 rounded-2xl border border-slate-800 space-y-2 text-xs">
                  <div className="flex justify-between text-slate-400">
                    <span>رقم الـ ACID المسبق:</span>
                    <span className="font-mono text-amber-400 font-bold">{shp.acidNumber || 'غير مطلوب'}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>بوليصة الشحن (B/L):</span>
                    <span className="font-mono text-white font-bold">{shp.blOrAwbNumber}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>الخط الملاحي والموانئ:</span>
                    <span className="text-slate-200">{shp.shippingLine} ({shp.portOfLoading} ← {shp.portOfDischarge})</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>عدد الحاويات والأرقام:</span>
                    <span className="text-indigo-300 font-bold">{shp.containerCount} حاويات ({shp.containerNumbers.join(', ')})</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>بيان البضاعة:</span>
                    <span className="text-slate-200">{shp.goodsDescription}</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-800 pt-2">
                    <span className="text-slate-400">قيمة الفاتورة الأجنبية:</span>
                    <span className="text-emerald-400 font-black font-mono">
                      ${shp.totalInvoiceForeignCurrency.toLocaleString()} {shp.foreignCurrency} (@ {shp.exchangeRate})
                    </span>
                  </div>
                </div>

                <div className="flex justify-between items-center border-t border-slate-800 pt-3">
                  <div>
                    <span className="text-[10px] text-slate-500 block">إجمالي التكلفة بالمخازن (Landed Cost)</span>
                    <span className="text-base font-black text-indigo-400">{formatCurrency(shp.totalLandedCost)}</span>
                  </div>
                  <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs shadow-md">
                    متابعة إجراءات الإفراج
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: LANDED COST ENGINE */}
      {activeTab === 'landed_cost' && (
        <div className="bg-[#151b2b] p-6 rounded-3xl border border-slate-800 space-y-6">
          <div className="flex justify-between items-center border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <Calculator className="text-indigo-400" size={20} />
                <span>شجرة توزيع التكاليف الاستيرادية المحملة (Landed Cost Allocation)</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">تحميل مصاريف النولون والجمارك والتخليص والأرضيات على سعر القطعة الفعلي بالمخازن</p>
            </div>
          </div>

          <div className="space-y-4">
            {shipments.filter(s => s.operationType === 'IMPORT').map((shp) => (
              <div key={shp.id} className="bg-[#0f172a] p-5 rounded-2xl border border-slate-800 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-white text-sm">{shp.clientOrSupplierName} - بوليصة {shp.blOrAwbNumber}</span>
                  <span className="text-xs font-mono text-emerald-400 font-bold">سعر الصرف: 1 USD = {shp.exchangeRate} EGP</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 text-xs">
                  <div className="bg-[#151b2b] p-3 rounded-xl border border-slate-800">
                    <span className="text-slate-500 text-[10px] block">فاتورة الشراء (FOB)</span>
                    <span className="font-bold text-white">{formatCurrency(shp.totalInvoiceLocalCurrency)}</span>
                  </div>
                  <div className="bg-[#151b2b] p-3 rounded-xl border border-slate-800">
                    <span className="text-slate-500 text-[10px] block">النولون والشحن البحري</span>
                    <span className="font-bold text-blue-400">{formatCurrency(shp.shippingFreightCost)}</span>
                  </div>
                  <div className="bg-[#151b2b] p-3 rounded-xl border border-slate-800">
                    <span className="text-slate-500 text-[10px] block">الرسوم الجمركية (التعريفة)</span>
                    <span className="font-bold text-amber-400">{formatCurrency(shp.customsDuty)}</span>
                  </div>
                  <div className="bg-[#151b2b] p-3 rounded-xl border border-slate-800">
                    <span className="text-slate-500 text-[10px] block">ضريبة القيمة المضافة</span>
                    <span className="font-bold text-cyan-400">{formatCurrency(shp.vatTax)}</span>
                  </div>
                  <div className="bg-[#151b2b] p-3 rounded-xl border border-slate-800">
                    <span className="text-slate-500 text-[10px] block">أتعاب التخليص والمخلص</span>
                    <span className="font-bold text-purple-400">{formatCurrency(shp.customsClearanceFee)}</span>
                  </div>
                  <div className="bg-[#151b2b] p-3 rounded-xl border border-slate-800">
                    <span className="text-slate-500 text-[10px] block">أرضيات وغرامات الميناء</span>
                    <span className="font-bold text-rose-400">{formatCurrency(shp.portHandlingAndStorageCost)}</span>
                  </div>
                </div>

                <div className="flex justify-between items-center bg-[#151b2b] p-4 rounded-xl border border-indigo-500/30">
                  <div>
                    <span className="text-xs text-slate-400">إجمالي التكلفة الرأسمالية للمخزون (Landed Inventory Cost):</span>
                    <p className="text-xs text-slate-500">تم ترحيل القيد التلقائي: مدين حـ/ مخزون البضائع الواردة - دائن حـ/ المورد والمصاريف</p>
                  </div>
                  <span className="text-xl font-black text-indigo-400">{formatCurrency(shp.totalLandedCost)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: LC & BANKING */}
      {activeTab === 'lc_banking' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {shipments.map((shp) => (
              <div key={shp.id} className="bg-[#151b2b] border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-xs font-bold text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-full">
                      طريقة السداد: {shp.paymentFinancingMethod}
                    </span>
                    <h3 className="text-base font-black text-white mt-2">{shp.issuingBank || 'البنك المعني'}</h3>
                    <p className="text-xs text-slate-400">رقم الاعتماد: <span className="font-mono text-white font-bold">{shp.lcNumber || 'CAD / تحويل بنكي مباشر'}</span></p>
                  </div>
                  <Landmark className="text-indigo-400" size={32} />
                </div>

                <div className="bg-[#0f172a] p-3.5 rounded-2xl border border-slate-800 space-y-2 text-xs">
                  <div className="flex justify-between text-slate-400">
                    <span>قيمة الاعتماد البنكي:</span>
                    <span className="font-bold text-emerald-400 font-mono">${shp.totalInvoiceForeignCurrency.toLocaleString()} {shp.foreignCurrency}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>شروط التسليم (Incoterms):</span>
                    <span className="font-bold text-white">{shp.incoterms}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>مستندات الشحن المفرج عنها:</span>
                    <span className="text-emerald-400 font-bold">بوليصة أصلية + فاتورة موثقة + شهادة منشأ ✓</span>
                  </div>
                </div>

                <button className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold text-xs">
                  طباعة مطابقة مستندات الاعتماد البنكي
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
