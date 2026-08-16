/**
 * @file AgriExportPage.tsx
 * @module واجهات وصفحات النظام (UI Pages)
 * @description ملف جزء من نظام MARO ERP. الوظيفة: AgriExportPage.tsx.
 */
import React, { useState } from 'react';
import { 
  Factory, 
  ThermometerSnowflake, 
  Ship, 
  Package, 
  Plus, 
  Search, 
  AlertTriangle, 
  CheckCircle2, 
  Layers, 
  FileText, 
  Globe, 
  Scale,
  Sparkles,
  TrendingUp
} from 'lucide-react';
import { ColdStorageChamber, AgriExportShipment } from '../../types/industryModules';
import { formatCurrency, cn } from '../../lib/utils';

export const AgriExportPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'chambers' | 'shipments' | 'grading'>('chambers');

  // Cold Storage Chambers Data
  const [chambers, setChambers] = useState<ColdStorageChamber[]>([
    {
      id: 'c1',
      chamberNumber: 'CH-01',
      name: 'عنبر تبريد موالح وتصدير (برتقال صيفي)',
      capacityTons: 150,
      currentLoadTons: 125,
      temperatureCelsius: 3.2,
      targetTemperature: 3.0,
      humidityPercent: 88,
      coolingType: 'تبريد عادي (Chiller 0-4°C)',
      status: 'OPTIMAL',
      storedLots: [
        {
          lotCode: 'LOT-ORG-2026-08',
          productType: 'موالح برتقال',
          palletsCount: 42,
          weightTons: 65,
          farmerOrSupplier: 'مزارع النوبارية للتصدير',
          entryDate: '2026-08-10',
          expiryDate: '2026-09-25'
        },
        {
          lotCode: 'LOT-ORG-2026-09',
          productType: 'موالح برتقال',
          palletsCount: 38,
          weightTons: 60,
          farmerOrSupplier: 'مزارع وادي النطرون',
          entryDate: '2026-08-12',
          expiryDate: '2026-09-30'
        }
      ]
    },
    {
      id: 'c2',
      chamberNumber: 'CH-02',
      name: 'عنبر التجميد السريع والخضار المشكل (Blast Freezer)',
      capacityTons: 80,
      currentLoadTons: 70,
      temperatureCelsius: -19.4,
      targetTemperature: -20.0,
      humidityPercent: 95,
      coolingType: 'تخزين مجمد (-18°C)',
      status: 'OPTIMAL',
      storedLots: [
        {
          lotCode: 'LOT-STR-2026-01',
          productType: 'فراولة طازجة',
          palletsCount: 50,
          weightTons: 70,
          farmerOrSupplier: 'جمعية الإسماعيلية الزراعية',
          entryDate: '2026-08-05',
          expiryDate: '2027-02-15'
        }
      ]
    },
    {
      id: 'c3',
      chamberNumber: 'CH-03',
      name: 'عنبر جو محكوم (CA Controlled) رمان وعنب',
      capacityTons: 100,
      currentLoadTons: 40,
      temperatureCelsius: 1.8,
      targetTemperature: 1.5,
      humidityPercent: 92,
      coolingType: 'جو محكوم (CA Controlled Atmosphere)',
      status: 'OPTIMAL',
      storedLots: [
        {
          lotCode: 'LOT-POM-2026-02',
          productType: 'رمان',
          palletsCount: 25,
          weightTons: 40,
          farmerOrSupplier: 'مزارع أسيوط النموذجية',
          entryDate: '2026-08-14',
          expiryDate: '2026-11-10'
        }
      ]
    }
  ]);

  // Export Shipments Data
  const [shipments, setShipments] = useState<AgriExportShipment[]>([
    {
      id: 'sh1',
      shipmentNumber: 'EXP-2026-RUS-041',
      destinationCountry: 'روسيا (سانت بطرسبرغ)',
      importerName: 'Global Fresh Import LLC',
      shippingLine: 'مايرسك (Maersk Line)',
      containerNumber: 'MSKU-891240-9 (40ft Reefer)',
      productType: 'برتقال فالنسيا نمرة 1',
      caliberGrade: 'عيار 56 / 64 مكس',
      packagingType: 'كرتونة تلسكوبية 15 كجم',
      totalPallets: 20,
      grossWeightKg: 26400,
      netWeightKg: 24000,
      departurePort: 'ميناء الدخيلة / الإسكندرية',
      phytosanitaryCertNumber: 'PH-EG-2026-98124',
      status: 'LOADED',
      invoiceValueUSD: 18500,
      invoiceValueLocal: 925000,
      exportDate: '2026-08-14'
    },
    {
      id: 'sh2',
      shipmentNumber: 'EXP-2026-NLD-019',
      destinationCountry: 'هولندا (ميناء روتردام)',
      importerName: 'Rotterdam Agro B.V.',
      shippingLine: 'Hapag-Lloyd',
      containerNumber: 'HLXU-441092-1 (40ft Reefer)',
      productType: 'عنب بدون بذر (Superior Seedless)',
      caliberGrade: 'صنف نمرة 1 تصدير',
      packagingType: 'بنتس 500 جم',
      totalPallets: 22,
      grossWeightKg: 22000,
      netWeightKg: 20000,
      departurePort: 'ميناء دمياط البحري',
      phytosanitaryCertNumber: 'PH-EG-2026-98440',
      status: 'INSPECTION',
      invoiceValueUSD: 34000,
      invoiceValueLocal: 1700000,
      exportDate: '2026-08-16'
    }
  ]);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-[#151b2b] border border-emerald-500/30 rounded-3xl p-6 shadow-2xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500"></div>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
              <ThermometerSnowflake size={14} />
              <span>Agri-Export & Cold Chain Engine</span>
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-white">
            محطات تصدير الحاصلات الزراعية وثلاجات التبريد
          </h1>
          <p className="text-xs md:text-sm text-slate-400">
            إدارة شاملة لعنابر التبريد والتجميد، درجات الحرارة والرطوبة، فرز وتدريج العيارات، وحاويات التصدير والشهادات الزراعية والصحية.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-[#0f172a] p-3 rounded-2xl border border-slate-800 flex items-center gap-3">
            <Ship className="text-emerald-400" size={24} />
            <div>
              <p className="text-[10px] text-slate-400">إجمالي شحنات التصدير النشطة</p>
              <p className="text-xs font-bold text-white">{shipments.length} حاويات مبردة (Reefer)</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('chambers')}
          className={cn(
            "px-5 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2",
            activeTab === 'chambers' ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20" : "bg-slate-900 text-slate-400 hover:text-white"
          )}
        >
          <ThermometerSnowflake size={16} />
          <span>عنابر وثلاجات التبريد ({chambers.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('shipments')}
          className={cn(
            "px-5 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2",
            activeTab === 'shipments' ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20" : "bg-slate-900 text-slate-400 hover:text-white"
          )}
        >
          <Ship size={16} />
          <span>شحنات وحاويات التصدير ({shipments.length})</span>
        </button>
      </div>

      {/* TAB 1: COLD STORAGE CHAMBERS */}
      {activeTab === 'chambers' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {chambers.map((ch) => {
            const occupancyPercent = Math.round((ch.currentLoadTons / ch.capacityTons) * 100);
            return (
              <div key={ch.id} className="bg-[#151b2b] border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-emerald-400 border border-slate-700">
                      {ch.chamberNumber}
                    </span>
                    <h3 className="text-sm font-black text-white mt-1.5">{ch.name}</h3>
                    <p className="text-[11px] text-slate-400">{ch.coolingType}</p>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
                    جاهز ومستقر
                  </span>
                </div>

                {/* Telemetry Gauge */}
                <div className="grid grid-cols-2 gap-3 bg-[#0f172a] p-3 rounded-xl border border-slate-800/80">
                  <div className="flex items-center gap-2.5">
                    <ThermometerSnowflake className="text-cyan-400" size={20} />
                    <div>
                      <span className="text-[10px] text-slate-400 block">درجة الحرارة</span>
                      <span className="text-sm font-black text-white">{ch.temperatureCelsius}°C</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Layers className="text-emerald-400" size={20} />
                    <div>
                      <span className="text-[10px] text-slate-400 block">الرطوبة النسبية</span>
                      <span className="text-sm font-black text-white">{ch.humidityPercent}%</span>
                    </div>
                  </div>
                </div>

                {/* Occupancy Progress */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-bold text-slate-400">
                    <span>نسبة إشغال العنبر ({ch.currentLoadTons} طن)</span>
                    <span className="text-white">{occupancyPercent}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full" 
                      style={{ width: `${occupancyPercent}%` }}
                    ></div>
                  </div>
                </div>

                {/* Stored Lots */}
                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <span className="text-[11px] font-bold text-slate-400 block">اللوطات المخزنة بالداخل:</span>
                  {ch.storedLots.map((lot, idx) => (
                    <div key={idx} className="bg-[#0f172a] p-2.5 rounded-lg border border-slate-800/60 text-[11px] flex justify-between items-center">
                      <div>
                        <span className="font-bold text-white block">{lot.productType}</span>
                        <span className="text-slate-500 text-[10px]">{lot.farmerOrSupplier}</span>
                      </div>
                      <div className="text-left">
                        <span className="font-bold text-emerald-400 block">{lot.weightTons} طن</span>
                        <span className="text-slate-500 text-[10px]">{lot.palletsCount} طبلية</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 2: EXPORT SHIPMENTS */}
      {activeTab === 'shipments' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {shipments.map((shipment) => (
              <div key={shipment.id} className="bg-[#151b2b] border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      {shipment.shipmentNumber}
                    </span>
                    <h3 className="text-base font-black text-white mt-1.5 flex items-center gap-2">
                      <Globe size={16} className="text-cyan-400" />
                      <span>{shipment.destinationCountry}</span>
                    </h3>
                    <p className="text-xs text-slate-400 font-bold">{shipment.importerName}</p>
                  </div>
                  <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
                    {shipment.status === 'LOADED' ? 'تم الشحن والتحميل' : 'قيد الفحص والتفتيش'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs bg-[#0f172a] p-3 rounded-xl border border-slate-800">
                  <div>
                    <span className="text-slate-500 text-[10px] block">رقم الحاوية المبردة:</span>
                    <span className="font-mono font-bold text-white">{shipment.containerNumber}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] block">الخط الملاحي:</span>
                    <span className="font-bold text-slate-300">{shipment.shippingLine}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] block">الصنف والعيار:</span>
                    <span className="font-bold text-emerald-400">{shipment.productType} ({shipment.caliberGrade})</span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] block">الشهادة الصحية والزراعية:</span>
                    <span className="font-mono text-cyan-300 font-bold">{shipment.phytosanitaryCertNumber}</span>
                  </div>
                </div>

                <div className="flex justify-between items-center border-t border-slate-800 pt-3 text-xs">
                  <div>
                    <span className="text-slate-500 text-[10px] block">الوزن الصافي:</span>
                    <span className="font-bold text-white">{shipment.netWeightKg.toLocaleString()} كجم ({shipment.totalPallets} طبلية)</span>
                  </div>
                  <div className="text-left">
                    <span className="text-slate-500 text-[10px] block">قيمة فاتورة التصدير:</span>
                    <span className="font-black text-emerald-400 text-sm">${shipment.invoiceValueUSD.toLocaleString()} USD</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
