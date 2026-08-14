// MARO ERP - Ceramics, Porcelain & Sanitary Ware Module
import React, { useState } from 'react';
import { 
  Grid, 
  Search, 
  Layers, 
  CheckCircle2, 
  MapPin, 
  Box, 
  Calculator, 
  Sparkles, 
  Palette, 
  Sliders, 
  AlertTriangle,
  BookmarkCheck,
  Building
} from 'lucide-react';
import { cn } from '../../lib/utils';

// Types inside page
interface CeramicItem {
  id: string;
  name: string;
  sku: string;
  category: 'CERAMICS' | 'PORCELAIN' | 'SANITARY';
  tileSize?: string;
  grade: 'فرز أول ممتاز' | 'فرز ثاني' | 'فرز ثالث';
  m2PerBox?: number;
  pcsPerBox?: number;
  lotNumber: string; // Tone
  stockBoxes: number;
  pricePerM2OrUnit: number;
  shelfLocation: string;
}

export const CeramicsSanitaryPage: React.FC = () => {
  const [items, setItems] = useState<CeramicItem[]>([
    {
      id: 'c1',
      name: 'سيراميك كليوباترا أرضيات ليزر رويال بيج 60×60 سم',
      sku: 'CER-6060-CLEO',
      category: 'CERAMICS',
      tileSize: '60×60',
      grade: 'فرز أول ممتاز',
      m2PerBox: 1.44,
      pcsPerBox: 4,
      lotNumber: 'TONE-A450',
      stockBoxes: 120,
      pricePerM2OrUnit: 185,
      shelfLocation: 'مستودع A - ممر 3 - الرف الخلفي'
    },
    {
      id: 'c2',
      name: 'بورسلين مستورد سوبر جلوسي أبيض كلكتا 120×60 سم',
      sku: 'POR-1260-CALA',
      category: 'PORCELAIN',
      tileSize: '120×60',
      grade: 'فرز أول ممتاز',
      m2PerBox: 1.44,
      pcsPerBox: 2,
      lotNumber: 'TONE-B12',
      stockBoxes: 85,
      pricePerM2OrUnit: 420,
      shelfLocation: 'مستودع B - ممر 1 - ساحة الجرانيت'
    },
    {
      id: 'c3',
      name: 'سيراميك الجوهرة جدران كلاسيك كريمي 30×60 سم',
      sku: 'CER-3060-JAWH',
      category: 'CERAMICS',
      tileSize: '30×60',
      grade: 'فرز ثاني',
      m2PerBox: 1.62,
      pcsPerBox: 9,
      lotNumber: 'TONE-C104',
      stockBoxes: 210,
      pricePerM2OrUnit: 140,
      shelfLocation: 'مستودع A - ممر 4 - الرف السفلي'
    },
    {
      id: 'c4',
      name: 'خلاط مغسلة جروهي يورو سمارت ألماني كروم أصلي',
      sku: 'SAN-GROHE-EU',
      category: 'SANITARY',
      grade: 'فرز أول ممتاز',
      lotNumber: 'N/A',
      stockBoxes: 45,
      pricePerM2OrUnit: 1450,
      shelfLocation: 'قسم الأدوات الصحية - رف 2'
    },
    {
      id: 'c5',
      name: 'طقم خلاطات كامل هانس جروهي دش ومطبخ ومغسلة',
      sku: 'SAN-HANS-SET',
      category: 'SANITARY',
      grade: 'فرز أول ممتاز',
      lotNumber: 'N/A',
      stockBoxes: 25,
      pricePerM2OrUnit: 4800,
      shelfLocation: 'قسم الأدوات الصحية - رف 1'
    },
    {
      id: 'c6',
      name: 'حوض ديورافيت معلق بالعامود كامل بالمسامير سفيدو',
      sku: 'SAN-DURA-SEV',
      category: 'SANITARY',
      grade: 'فرز أول ممتاز',
      lotNumber: 'N/A',
      stockBoxes: 30,
      pricePerM2OrUnit: 1950,
      shelfLocation: 'ساحة الأدوات الصحية الكبيرة - حارة 2'
    }
  ]);

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | 'CERAMICS' | 'PORCELAIN' | 'SANITARY'>('ALL');

  // Calculator State
  const [targetM2, setTargetM2] = useState<number>(50);
  const [wastePercent, setWastePercent] = useState<number>(10);
  const [selectedCalcItem, setSelectedCalcItem] = useState<CeramicItem>(items[0]);

  // Tone Matcher state
  const [toneToMatch, setToneToMatch] = useState<string>('TONE-A450');

  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.includes(searchQuery) || item.sku.toLowerCase().includes(searchQuery.toLowerCase()) || item.lotNumber.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = categoryFilter === 'ALL' || item.category === categoryFilter;
    return matchesSearch && matchesCat;
  });

  // Calculate required items
  const m2PerBox = selectedCalcItem.m2PerBox || 1;
  const pricePerM2OrUnit = selectedCalcItem.pricePerM2OrUnit;
  const wasteMultiplier = 1 + (wastePercent / 100);
  const calculatedTotalM2 = +(targetM2 * wasteMultiplier).toFixed(2);
  const calculatedBoxesNeeded = Math.ceil(calculatedTotalM2 / m2PerBox);
  const calculatedActualM2 = +(calculatedBoxesNeeded * m2PerBox).toFixed(2);
  const calculatedCost = +(calculatedBoxesNeeded * m2PerBox * pricePerM2OrUnit).toFixed(2);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-[#151b2b] border border-blue-500/30 rounded-3xl p-6 shadow-2xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-r from-blue-500 via-sky-400 to-indigo-600"></div>
        <div className="flex items-center gap-4">
          <div className="p-3.5 bg-blue-500/10 border border-blue-500/30 text-blue-400 rounded-2xl shadow-lg shadow-blue-500/10">
            <Building size={30} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-white tracking-tight">موديول السيراميك، البورسلين والأدوات الصحية</h1>
              <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[10px] font-bold">
                Ceramics & Sanitary Ware
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">حساب المساحات والكراتين الذكية، مطابقة درجات طباخات الألوان (Tones)، وحجز طلبيات المستودع المؤجلة</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Core Controls & Stock List */}
        <div className="lg:col-span-2 space-y-6">
          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-3 items-center justify-between bg-[#111625] p-4 rounded-2xl border border-[#1e293b]">
            <div className="relative w-full md:w-80">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" size={15} />
              <input 
                type="text" 
                placeholder="البحث باسم الصنف، كود SKU، أو الطبخة..." 
                className="w-full pr-9 pl-3 py-2 bg-[#151b2b] border border-[#1e293b] rounded-xl text-xs text-white focus:border-blue-500 outline-none"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto">
              {[
                { id: 'ALL', label: 'الكل' },
                { id: 'CERAMICS', label: 'سيراميك' },
                { id: 'PORCELAIN', label: 'بورسلين' },
                { id: 'SANITARY', label: 'أدوات صحية' }
              ].map(cat => (
                <button 
                  key={cat.id}
                  onClick={() => setCategoryFilter(cat.id as any)}
                  className={cn(
                    "px-3 py-1.5 rounded-xl text-xs font-bold border transition-all whitespace-nowrap",
                    categoryFilter === cat.id ? "bg-blue-600/20 border-blue-500/50 text-blue-300" : "bg-[#151b2b] border-[#1e293b] text-slate-400 hover:text-white"
                  )}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Stock List Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredItems.map(item => (
              <div 
                key={item.id} 
                className={cn(
                  "bg-[#151b2b] border rounded-2xl p-4 flex flex-col justify-between transition-all relative overflow-hidden cursor-pointer",
                  selectedCalcItem.id === item.id ? "border-blue-500 shadow-lg shadow-blue-500/5" : "border-[#1e293b] hover:border-slate-700"
                )}
                onClick={() => {
                  if (item.category !== 'SANITARY') {
                    setSelectedCalcItem(item);
                  }
                }}
              >
                {selectedCalcItem.id === item.id && item.category !== 'SANITARY' && (
                  <div className="absolute top-0 left-0 bg-blue-600 text-white text-[10px] font-black px-2 py-0.5 rounded-br-lg">
                    محمل بالحاسبة
                  </div>
                )}

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className={cn(
                      "px-2 py-0.5 rounded text-[10px] font-bold",
                      item.category === 'CERAMICS' ? "bg-blue-500/10 text-blue-400 border border-blue-500/20" :
                      item.category === 'PORCELAIN' ? "bg-purple-500/10 text-purple-400 border border-purple-500/20" :
                      "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                    )}>
                      {item.category === 'CERAMICS' ? 'سيراميك' : item.category === 'PORCELAIN' ? 'بورسلين' : 'أدوات صحية'}
                    </span>
                    <span className="text-[11px] font-bold text-slate-400 font-mono">{item.sku}</span>
                  </div>

                  <h3 className="text-xs font-black text-white line-clamp-2">{item.name}</h3>

                  <div className="grid grid-cols-2 gap-1.5 pt-2 text-[11px] text-slate-400">
                    <div>
                      <span>الفرز: </span>
                      <strong className="text-slate-200">{item.grade}</strong>
                    </div>
                    {item.tileSize && (
                      <div>
                        <span>المقاس: </span>
                        <strong className="text-slate-200">{item.tileSize} سم</strong>
                      </div>
                    )}
                    {item.m2PerBox && (
                      <div>
                        <span>الكرتونة: </span>
                        <strong className="text-slate-200">{item.m2PerBox} م² ({item.pcsPerBox} ق)</strong>
                      </div>
                    )}
                    <div>
                      <span>الطبخة / اللوت: </span>
                      <strong className="text-amber-400 font-mono">{item.lotNumber}</strong>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-[#1e293b]/60 flex items-center justify-between">
                  <div>
                    <span className="text-[9px] text-slate-500 font-bold block">السعر</span>
                    <span className="text-sm font-black text-white">
                      {item.pricePerM2OrUnit} ج.م {item.category === 'SANITARY' ? '/قطعة' : '/م²'}
                    </span>
                  </div>
                  <div className="text-left">
                    <span className="text-[9px] text-slate-500 font-bold block">الرصيد المتاح</span>
                    <span className="text-xs font-black text-emerald-400">
                      {item.stockBoxes} {item.category === 'SANITARY' ? 'قطعة' : 'كرتونة'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Special Calculators & Tone Shading Checker */}
        <div className="space-y-6">
          {/* Smart Area Calculator */}
          <div className="bg-[#111625] border border-blue-500/20 rounded-2xl p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Calculator className="text-blue-400" size={18} />
              <h3 className="text-xs font-black text-white">حاسبة المساحات والكراتين الذكية</h3>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              اختر صنف السيراميك من القائمة، ثم أدخل المساحة الصافية ليتم احتساب كسر الزوايا والهدر وعدد الكراتين.
            </p>

            <div className="space-y-3 pt-2">
              <div className="p-3 bg-[#151b2b] rounded-xl border border-[#1e293b] text-xs">
                <span className="text-slate-400 block text-[10px]">الصنف النشط بالحاسبة:</span>
                <span className="font-bold text-white block truncate mt-1">{selectedCalcItem.name}</span>
                <span className="text-blue-400 font-mono block mt-0.5">معدل التغطية: {selectedCalcItem.m2PerBox} م² / كرتونة</span>
              </div>

              <div>
                <label className="text-[11px] text-slate-400 font-bold block mb-1">المساحة المطلوبة بالمتر المربع (م²):</label>
                <div className="relative">
                  <input 
                    type="number" 
                    className="w-full px-3 py-2 bg-[#151b2b] border border-[#1e293b] rounded-xl text-xs text-white outline-none focus:border-blue-500"
                    value={targetM2}
                    onChange={(e) => setTargetM2(Math.max(0, +e.target.value))}
                  />
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-black">متر مربع</span>
                </div>
              </div>

              <div>
                <label className="text-[11px] text-slate-400 font-bold block mb-1">نسبة الهدر والقص (Wastage Rate %):</label>
                <select 
                  className="w-full px-3 py-2 bg-[#151b2b] border border-[#1e293b] rounded-xl text-xs text-white outline-none focus:border-blue-500"
                  value={wastePercent}
                  onChange={(e) => setWastePercent(+e.target.value)}
                >
                  <option value={5}>5% (تركيب مستقيم عادي)</option>
                  <option value={10}>10% (تركيب بزاوية 45 / سمبكسة)</option>
                  <option value={15}>15% (قص وتداخلات كثيرة)</option>
                </select>
              </div>

              {/* Results Matrix */}
              <div className="bg-[#151b2b] rounded-xl p-3 border border-[#1e293b] space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">المساحة بعد الهدر:</span>
                  <span className="font-bold text-white">{calculatedTotalM2} م²</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">الكراتين المطلوبة:</span>
                  <span className="font-black text-amber-400">{calculatedBoxesNeeded} كرتونة</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">المساحة الفعلية المفوترة:</span>
                  <span className="font-bold text-white">{calculatedActualM2} م²</span>
                </div>
                <div className="flex justify-between border-t border-slate-800 pt-2 text-sm font-black">
                  <span className="text-slate-300">تكلفة الصنف المقدرة:</span>
                  <span className="text-emerald-400">{calculatedCost} ج.م</span>
                </div>
              </div>
            </div>
          </div>

          {/* Tone Matcher Alert System */}
          <div className="bg-[#111625] border border-amber-500/20 rounded-2xl p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Palette className="text-amber-400" size={18} />
              <h3 className="text-xs font-black text-white">مطابقة درجات طباخات الألوان (Tone Shading Matcher)</h3>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              لتجنب اختلاف اللون في صالة البناء الواحدة للعميل، يفحص هذا النظام مدى توافق رقم اللوت والطبخة في أمر التسليم الحالي.
            </p>

            <div className="space-y-3 pt-1">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">حدد كود لوت الطبخة الأول (Tone):</label>
                <select 
                  className="w-full px-3 py-2 bg-[#151b2b] border border-[#1e293b] rounded-xl text-xs text-white outline-none focus:border-blue-500 font-mono"
                  value={toneToMatch}
                  onChange={(e) => setToneToMatch(e.target.value)}
                >
                  <option value="TONE-A450">TONE-A450 (سيراميك كليوباترا رويال)</option>
                  <option value="TONE-B12">TONE-B12 (بورسلين كلكتا مستورد)</option>
                  <option value="TONE-C104">TONE-C104 (سيراميك الجوهرة كريمي)</option>
                </select>
              </div>

              {/* Matching Status Alert */}
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex gap-2.5 items-start">
                <CheckCircle2 size={16} className="text-emerald-400 mt-0.5 shrink-0" />
                <div className="text-[11px] text-slate-300">
                  <span className="font-bold text-emerald-400 block mb-0.5">مطابقة آمنة بنسبة 100%</span>
                  جميع كراتين الطلبية سيتم سحبها من نفس خط الإنتاج والطبخة لتفادي أي فروقات بصرية بالأرضيات.
                </div>
              </div>
            </div>
          </div>

          {/* Reserved Order System */}
          <div className="bg-[#111625] border border-blue-500/20 rounded-2xl p-5 space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookmarkCheck className="text-blue-400" size={18} />
                <h3 className="text-xs font-black text-white">حجز طلبيات السيراميك بالمستودع</h3>
              </div>
              <span className="text-[9px] bg-blue-500/20 text-blue-300 border border-blue-500/30 px-1.5 py-0.5 rounded font-black">
                نشط
              </span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              تمكين العميل من شراء بضائعه وحجزها في عنابر المستودع المعزولة مع تأجيل الاستلام لحين بدء التشطيب والتركيب لتفادي نفاذ طبخة الألوان الخاصة به.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
