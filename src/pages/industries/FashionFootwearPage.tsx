// MARO ERP - Fashion, Footwear & Multi-Attribute Matrix Module
// Master Enterprise Protocol v4.0 - Clean Architecture
import React, { useState } from 'react';
import { 
  Shirt, 
  Plus, 
  Layers, 
  Tag, 
  Barcode, 
  TrendingUp, 
  Search, 
  Filter, 
  CheckCircle2, 
  PackageCheck,
  Printer,
  Sparkles,
  Globe2,
  Calendar,
  Users,
  Eye,
  SlidersHorizontal,
  X
} from 'lucide-react';
import { IndustryModuleEngine } from '../../lib/industryModuleEngine';
import { 
  FashionMatrixItem, 
  FashionVariant, 
  FashionGenderCategory, 
  FashionSeason, 
  FashionOrigin 
} from '../../types/industryModules';
import { cn } from '../../lib/utils';

export const FashionFootwearPage: React.FC = () => {
  const [items, setItems] = useState<FashionMatrixItem[]>(IndustryModuleEngine.getFashionMatrixItems());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGender, setSelectedGender] = useState<string>('ALL');
  const [selectedOrigin, setSelectedOrigin] = useState<string>('ALL');
  const [selectedSeason, setSelectedSeason] = useState<string>('ALL');
  const [activeTab, setActiveTab] = useState<'matrix' | 'variants' | 'tag_designer' | 'reports'>('matrix');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedTagVariant, setSelectedTagVariant] = useState<any>(null);

  // Form State for Matrix Generator
  const [modelCode, setModelCode] = useState('');
  const [modelName, setModelName] = useState('');
  const [brand, setBrand] = useState('MARO Couture');
  const [gender, setGender] = useState<FashionGenderCategory>('حريمي (نساء)');
  const [origin, setOrigin] = useState<FashionOrigin>('صيني (China)');
  const [season, setSeason] = useState<FashionSeason>('شتوي 2026');
  const [material, setMaterial] = useState('قطن تركي فاخر 100%');
  const [basePrice, setBasePrice] = useState(750);
  const [costPrice, setCostPrice] = useState(420);
  const [selectedColors, setSelectedColors] = useState<string[]>(['أسود', 'كحلي', 'نبيتي']);
  const [selectedSizes, setSelectedSizes] = useState<string[]>(['M', 'L', 'XL']);

  const genderOptions: FashionGenderCategory[] = [
    'حريمي (نساء)',
    'رجالي',
    'بناتي',
    'أولادي (أطفال)',
    'مواليد وبيبي',
    'للجنسين (Unisex)'
  ];

  const originOptions: FashionOrigin[] = [
    'صيني (China)',
    'تركي (Turkey)',
    'مصري (Egypt)',
    'إيطالي (Italy)',
    'فيتنامي (Vietnam)',
    'بنجلاديش (Bangladesh)',
    'هندي (India)',
    'مستورد عام'
  ];

  const seasonOptions: FashionSeason[] = [
    'شتوي 2026',
    'صيفي 2026',
    'خريفي 2026',
    'ربيعي 2026',
    'طوال العام / كلاسيك'
  ];

  const colorOptions = ['أسود', 'أبيض', 'كحلي', 'رمادي', 'أزرق', 'بني', 'بيج', 'أحمر', 'زيتي', 'نبيتي', 'وردي', 'متعدد الألوان'];
  const sizeOptions = ['S', 'M', 'L', 'XL', '2XL', '3XL', '38', '39', '40', '41', '42', '43', '44', '45', '46'];

  const toggleColor = (c: string) => {
    setSelectedColors(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]);
  };

  const toggleSize = (s: string) => {
    setSelectedSizes(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
  };

  const handleGenerateMatrix = (e: React.FormEvent) => {
    e.preventDefault();
    if (!modelCode || !modelName || selectedColors.length === 0 || selectedSizes.length === 0) {
      alert('يرجى ملء جميع الحقول واختيار لون ومقاس واحد على الأقل');
      return;
    }

    const generatedVariants: FashionVariant[] = [];
    selectedColors.forEach((color, cIdx) => {
      selectedSizes.forEach((size, sIdx) => {
        const barcodeNum = `622${Math.floor(100000000 + Math.random() * 900000000)}`;
        generatedVariants.push({
          id: `var_${Date.now()}_${cIdx}_${sIdx}`,
          productId: `prod_fsh_${Date.now()}_${cIdx}_${sIdx}`,
          productName: `${modelName} - ${color} / ${size} (${gender} - ${origin.split(' ')[0]})`,
          color,
          size,
          gender,
          origin,
          sku: `${modelCode}-${color.substring(0, 3)}-${size}`,
          barcode: barcodeNum,
          stock: 12,
          price: basePrice,
          costPrice: costPrice
        });
      });
    });

    const newItem: FashionMatrixItem = {
      id: `fsh_${Date.now()}`,
      modelCode,
      modelName,
      brand: brand || 'MARO Fashion',
      gender,
      origin,
      season,
      material,
      colors: selectedColors,
      sizes: selectedSizes,
      basePrice,
      costPrice,
      variants: generatedVariants
    };

    IndustryModuleEngine.saveFashionMatrixItem(newItem);
    setItems(IndustryModuleEngine.getFashionMatrixItems());
    setShowAddModal(false);
    setModelCode('');
    setModelName('');
  };

  const filteredItems = items.filter(i => {
    const matchesQuery = i.modelName.includes(searchQuery) || i.modelCode.toLowerCase().includes(searchQuery.toLowerCase()) || i.brand.includes(searchQuery);
    const matchesGender = selectedGender === 'ALL' || i.gender === selectedGender;
    const matchesOrigin = selectedOrigin === 'ALL' || i.origin === selectedOrigin;
    const matchesSeason = selectedSeason === 'ALL' || i.season === selectedSeason;
    return matchesQuery && matchesGender && matchesOrigin && matchesSeason;
  });

  const allVariants = items.flatMap(i => i.variants.map(v => ({ 
    ...v, 
    modelName: i.modelName, 
    brand: i.brand, 
    gender: i.gender,
    origin: i.origin,
    season: i.season, 
    material: i.material 
  })));

  const activeTagItem = selectedTagVariant || allVariants[0];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-[#151b2b] border border-purple-500/30 rounded-3xl p-6 shadow-2xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-r from-purple-500 via-pink-500 to-indigo-600"></div>
        <div className="flex items-center gap-4">
          <div className="p-3.5 bg-purple-500/10 border border-purple-500/30 text-purple-400 rounded-2xl shadow-lg shadow-purple-500/10">
            <Shirt size={32} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-white tracking-tight">موديول الملابس، الأحذية ومصفوفة المقاسات والألوان</h1>
              <span className="px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[10px] font-bold font-mono">
                Multi-Attribute Matrix Engine
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              تصنيفات الجنس (حريمي / رجالي / بناتي / أطفال)، المنشأ (صيني / تركي / مصري)، المواسم (شتوي / صيفي)، وطباعة تيكت وباركود المقاس واللون
            </p>
          </div>
        </div>

        <button 
          onClick={() => setShowAddModal(true)}
          className="px-5 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-2xl font-bold text-xs flex items-center gap-2 shadow-lg shadow-purple-600/20 transition-all active:scale-95 whitespace-nowrap"
        >
          <Plus size={18} />
          <span>توليد موديل جديد (مصفوفة ألوان ومقاسات)</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-[#1e293b] pb-3">
        <button 
          onClick={() => setActiveTab('matrix')}
          className={cn(
            "flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold transition-all",
            activeTab === 'matrix' ? "bg-purple-600/20 text-purple-300 border border-purple-500/40 shadow-md" : "text-slate-400 hover:text-white"
          )}
        >
          <Layers size={16} />
          <span>الموديلات والمصفوفات ({items.length})</span>
        </button>

        <button 
          onClick={() => setActiveTab('variants')}
          className={cn(
            "flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold transition-all",
            activeTab === 'variants' ? "bg-purple-600/20 text-purple-300 border border-purple-500/40 shadow-md" : "text-slate-400 hover:text-white"
          )}
        >
          <Barcode size={16} />
          <span>الأصناف التفصيلية والباركود ({allVariants.length})</span>
        </button>

        <button 
          onClick={() => setActiveTab('tag_designer')}
          className={cn(
            "flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold transition-all",
            activeTab === 'tag_designer' ? "bg-purple-600/20 text-purple-300 border border-purple-500/40 shadow-md" : "text-slate-400 hover:text-white"
          )}
        >
          <Tag size={16} />
          <span>مصمم ومعاينة تيكت الملابس والباركود</span>
        </button>

        <button 
          onClick={() => setActiveTab('reports')}
          className={cn(
            "flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold transition-all",
            activeTab === 'reports' ? "bg-purple-600/20 text-purple-300 border border-purple-500/40 shadow-md" : "text-slate-400 hover:text-white"
          )}
        >
          <TrendingUp size={16} />
          <span>تحليلات المبيعات حسب الفئة والمنشأ والمقاس</span>
        </button>
      </div>

      {/* Multi-Dimensional Filter Bar */}
      <div className="bg-[#151b2b] border border-[#1e293b] rounded-3xl p-5 shadow-xl space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="relative flex-1">
            <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
            <input 
              type="text" 
              placeholder="بحث باسم الموديل، كود التصميم، البراند، الخامة أو الباركود..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-4 pr-10 py-2.5 bg-[#0f172a] border border-[#1e293b] rounded-2xl text-xs text-white focus:border-purple-500 outline-none"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Gender filter */}
            <div className="flex items-center gap-1 bg-[#0f172a] px-3 py-1.5 rounded-xl border border-[#1e293b]">
              <Users size={14} className="text-purple-400" />
              <select 
                value={selectedGender} 
                onChange={(e) => setSelectedGender(e.target.value)}
                className="bg-transparent text-xs text-slate-200 outline-none cursor-pointer"
              >
                <option value="ALL" className="bg-[#0f172a]">جميع الفئات (حريمي/رجالي/أطفال)</option>
                {genderOptions.map(g => (
                  <option key={g} value={g} className="bg-[#0f172a]">{g}</option>
                ))}
              </select>
            </div>

            {/* Origin filter */}
            <div className="flex items-center gap-1 bg-[#0f172a] px-3 py-1.5 rounded-xl border border-[#1e293b]">
              <Globe2 size={14} className="text-pink-400" />
              <select 
                value={selectedOrigin} 
                onChange={(e) => setSelectedOrigin(e.target.value)}
                className="bg-transparent text-xs text-slate-200 outline-none cursor-pointer"
              >
                <option value="ALL" className="bg-[#0f172a]">جميع بلدان المنشأ (صيني/تركي/مصري)</option>
                {originOptions.map(o => (
                  <option key={o} value={o} className="bg-[#0f172a]">{o}</option>
                ))}
              </select>
            </div>

            {/* Season filter */}
            <div className="flex items-center gap-1 bg-[#0f172a] px-3 py-1.5 rounded-xl border border-[#1e293b]">
              <Calendar size={14} className="text-indigo-400" />
              <select 
                value={selectedSeason} 
                onChange={(e) => setSelectedSeason(e.target.value)}
                className="bg-transparent text-xs text-slate-200 outline-none cursor-pointer"
              >
                <option value="ALL" className="bg-[#0f172a]">جميع المواسم (شتوي/صيفي)</option>
                {seasonOptions.map(s => (
                  <option key={s} value={s} className="bg-[#0f172a]">{s}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Tab 1: Models & Matrices Overview */}
      {activeTab === 'matrix' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map(item => (
            <div 
              key={item.id} 
              className="bg-[#151b2b] border border-[#1e293b] hover:border-purple-500/40 rounded-3xl p-5 shadow-xl transition-all space-y-4 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="px-2.5 py-0.5 rounded-lg bg-slate-800 text-purple-300 font-mono text-[10px] border border-slate-700">
                    {item.modelCode}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded-lg bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[10px] font-bold">
                      {item.gender}
                    </span>
                    <span className="px-2 py-0.5 rounded-lg bg-pink-500/20 text-pink-300 border border-pink-500/30 text-[10px] font-bold">
                      {item.origin.split(' ')[0]}
                    </span>
                  </div>
                </div>

                <h3 className="font-bold text-white text-sm line-clamp-2">{item.modelName}</h3>
                <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
                  <span>البراند: <strong className="text-slate-300">{item.brand}</strong></span>
                  <span>الموسم: <strong className="text-slate-300">{item.season}</strong></span>
                </div>
                {item.material && (
                  <p className="text-[10px] text-slate-500 mt-1 truncate">الخامة: {item.material}</p>
                )}

                {/* Matrix Badges */}
                <div className="mt-4 bg-[#0f172a] rounded-2xl p-3 border border-[#1e293b] space-y-2">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block mb-1">الألوان المتاحة ({item.colors.length}):</span>
                    <div className="flex flex-wrap gap-1">
                      {item.colors.map((c, i) => (
                        <span key={i} className="px-2 py-0.5 bg-[#151b2b] text-slate-200 border border-slate-700 rounded-lg text-[10px]">
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block mb-1">المقاسات ({item.sizes.length}):</span>
                    <div className="flex flex-wrap gap-1">
                      {item.sizes.map((s, i) => (
                        <span key={i} className="px-2 py-0.5 bg-purple-500/10 text-purple-300 border border-purple-500/30 rounded-lg text-[10px] font-mono font-bold">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom stock and action */}
              <div className="pt-3 border-t border-[#1e293b] flex items-center justify-between text-xs">
                <div>
                  <span className="text-[10px] text-slate-500 block">إجمالي الأصناف</span>
                  <span className="font-mono font-bold text-white text-xs">{item.variants.length} صنف ومقاس</span>
                </div>

                <div className="text-left font-mono">
                  <span className="text-[10px] text-slate-500 block">السعر الأساسي</span>
                  <span className="font-black text-purple-400 text-sm">{item.basePrice} ج.م</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 2: Detailed Variants & Barcodes Table */}
      {activeTab === 'variants' && (
        <div className="bg-[#151b2b] border border-[#1e293b] rounded-3xl overflow-hidden shadow-xl">
          <div className="p-4 bg-[#0f172a] border-b border-[#1e293b] flex items-center justify-between">
            <h3 className="font-bold text-white text-xs flex items-center gap-2">
              <Barcode className="text-purple-400" size={16} />
              <span>جدول جميع الأصناف والمقاسات التفصيلية والباركود المزدوج</span>
            </h3>
            <span className="text-[11px] text-slate-400 font-mono">إجمالي الأصناف المولدة: {allVariants.length}</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-right">
              <thead className="text-slate-400 border-b border-[#1e293b]">
                <tr>
                  <th className="p-4 font-bold">اسم الصنف والموديل</th>
                  <th className="p-4 font-bold text-center">الفئة</th>
                  <th className="p-4 font-bold text-center">بلد المنشأ</th>
                  <th className="p-4 font-bold text-center">الموسم</th>
                  <th className="p-4 font-bold text-center">اللون</th>
                  <th className="p-4 font-bold text-center">المقاس</th>
                  <th className="p-4 font-bold font-mono">الباركود (EAN-13)</th>
                  <th className="p-4 font-bold text-center">الرصيد</th>
                  <th className="p-4 font-bold text-left font-mono">السعر</th>
                  <th className="p-4 font-bold text-center">طباعة كارت</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e293b]">
                {allVariants.map(v => (
                  <tr key={v.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-4 font-bold text-white">
                      <div>{v.productName}</div>
                      <div className="text-[10px] text-slate-500 font-mono">{v.sku}</div>
                    </td>
                    <td className="p-4 text-center">
                      <span className="px-2 py-0.5 bg-purple-500/10 text-purple-300 border border-purple-500/20 rounded-lg text-[10px]">
                        {v.gender || 'عام'}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <span className="px-2 py-0.5 bg-pink-500/10 text-pink-300 border border-pink-500/20 rounded-lg text-[10px]">
                        {(v.origin || 'مستورد').split(' ')[0]}
                      </span>
                    </td>
                    <td className="p-4 text-center text-slate-300">{v.season}</td>
                    <td className="p-4 text-center font-bold text-slate-200">{v.color}</td>
                    <td className="p-4 text-center font-mono font-bold text-purple-300">{v.size}</td>
                    <td className="p-4 font-mono text-emerald-400">{v.barcode}</td>
                    <td className="p-4 text-center font-bold text-white font-mono">{v.stock} قطعة</td>
                    <td className="p-4 text-left font-black text-purple-400 font-mono">{v.price} ج.م</td>
                    <td className="p-4 text-center">
                      <button 
                        onClick={() => {
                          setSelectedTagVariant(v);
                          setActiveTab('tag_designer');
                        }}
                        className="p-2 bg-[#0f172a] hover:bg-purple-600 text-slate-300 hover:text-white rounded-xl border border-[#1e293b] transition-all"
                        title="معاينة وطباعة التيكت"
                      >
                        <Printer size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Tag & Barcode Label Designer */}
      {activeTab === 'tag_designer' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-6 space-y-6">
            <div className="bg-[#151b2b] border border-[#1e293b] rounded-3xl p-6 space-y-5 shadow-xl">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-white text-sm flex items-center gap-2">
                  <Tag className="text-purple-400" size={18} />
                  <span>إعدادات وتخصيص كارت وتيكت الملابس (Hang Tag)</span>
                </h3>
                <span className="text-[11px] text-purple-400 font-bold">Standard Clothing Tag</span>
              </div>

              <p className="text-xs text-slate-400">
                اختر أي صنف من القائمة لعرض كارت الملابس الجاهز للطباعة على ورق مقوى أو ستيكر حراري.
              </p>

              <div>
                <label className="text-xs text-slate-400 font-bold block mb-1">اختر الصنف والمقاس:</label>
                <select 
                  value={activeTagItem?.id}
                  onChange={(e) => {
                    const found = allVariants.find(v => v.id === e.target.value);
                    if (found) setSelectedTagVariant(found);
                  }}
                  className="w-full p-3.5 bg-[#0f172a] border border-[#1e293b] rounded-2xl text-xs text-white outline-none focus:border-purple-500"
                >
                  {allVariants.map(v => (
                    <option key={v.id} value={v.id}>
                      {v.productName} - (مقاس: {v.size} / لون: {v.color})
                    </option>
                  ))}
                </select>
              </div>

              <div className="p-4 bg-[#0f172a] rounded-2xl border border-[#1e293b] space-y-2 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>الماركة:</span>
                  <span className="text-white font-bold">{activeTagItem?.brand}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>الفئة والتصنيف:</span>
                  <span className="text-purple-400 font-bold">{activeTagItem?.gender}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>بلد المنشأ والتصنيع:</span>
                  <span className="text-pink-400 font-bold">{activeTagItem?.origin}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>الخامة:</span>
                  <span className="text-slate-300 font-bold">{activeTagItem?.material || 'قطن طبيعي'}</span>
                </div>
              </div>

              <button 
                onClick={() => alert(`تم إرسال تيكت ${activeTagItem?.productName} إلى طابعة الباركود الحرارية`)}
                className="w-full py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-2xl font-bold text-xs shadow-lg shadow-purple-600/20 transition-all flex items-center justify-center gap-2"
              >
                <Printer size={16} />
                <span>طباعة تيكت الملابس الآن</span>
              </button>
            </div>
          </div>

          {/* Right Column: Physical Hang Tag Preview */}
          <div className="lg:col-span-6 flex items-center justify-center">
            <div className="w-72 bg-gradient-to-b from-slate-900 to-black text-white p-6 rounded-3xl shadow-2xl border-2 border-purple-500/40 relative font-sans space-y-4">
              {/* Hang Tag Hole */}
              <div className="w-4 h-4 rounded-full bg-slate-800 border-2 border-slate-600 mx-auto"></div>

              <div className="text-center border-b border-slate-800 pb-3">
                <h4 className="font-black text-lg tracking-wider uppercase text-purple-300">{activeTagItem?.brand || 'MARO COUTURE'}</h4>
                <p className="text-[9px] text-slate-400 tracking-widest uppercase">Premium Fashion & Footwear</p>
              </div>

              <div className="space-y-2 text-xs">
                <p className="font-bold text-white text-center text-sm">{activeTagItem?.modelName}</p>
                
                <div className="grid grid-cols-2 gap-2 text-center text-[10px] pt-1">
                  <div className="p-2 bg-slate-800/80 rounded-xl border border-slate-700">
                    <span className="text-slate-400 block text-[9px]">الفئة</span>
                    <span className="font-bold text-purple-300">{activeTagItem?.gender}</span>
                  </div>
                  <div className="p-2 bg-slate-800/80 rounded-xl border border-slate-700">
                    <span className="text-slate-400 block text-[9px]">بلد المنشأ</span>
                    <span className="font-bold text-pink-300">{activeTagItem?.origin}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-center text-[10px]">
                  <div className="p-2 bg-slate-800/80 rounded-xl border border-slate-700">
                    <span className="text-slate-400 block text-[9px]">المقاس (SIZE)</span>
                    <span className="font-black text-white font-mono text-base">{activeTagItem?.size}</span>
                  </div>
                  <div className="p-2 bg-slate-800/80 rounded-xl border border-slate-700">
                    <span className="text-slate-400 block text-[9px]">اللون (COLOR)</span>
                    <span className="font-bold text-white">{activeTagItem?.color}</span>
                  </div>
                </div>
              </div>

              <div className="pt-2 text-center border-t border-slate-800">
                <span className="text-[10px] text-slate-400 block">السعر النهائي للمستهلك</span>
                <span className="font-black text-xl text-purple-400 font-mono">{activeTagItem?.price} ج.م</span>
              </div>

              {/* Barcode representation */}
              <div className="bg-white p-3 rounded-xl text-black text-center space-y-1">
                <div className="h-9 flex items-center justify-around">
                  {[...Array(30)].map((_, i) => (
                    <div key={i} className={cn("h-full bg-black", (i % 2 === 0 || i % 5 === 0) ? "w-1" : "w-0.5")} />
                  ))}
                </div>
                <p className="font-mono text-[10px] font-black tracking-wider">{activeTagItem?.barcode}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Reports & Multi-Dimensional Analytics */}
      {activeTab === 'reports' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-[#151b2b] border border-[#1e293b] rounded-3xl p-6 space-y-4 shadow-xl">
            <h4 className="font-bold text-white text-sm flex items-center gap-2">
              <Users className="text-purple-400" size={18} />
              <span>تحليل المبيعات حسب الفئة والجنس (حريمي vs رجالي vs أطفال)</span>
            </h4>
            <div className="space-y-3 pt-2">
              {[
                { label: 'حريمي (نساء)', percentage: 48, revenue: '145,000 ج.م', color: 'bg-purple-500' },
                { label: 'رجالي', percentage: 32, revenue: '96,000 ج.م', color: 'bg-indigo-500' },
                { label: 'أولادي (أطفال)', percentage: 14, revenue: '42,000 ج.م', color: 'bg-pink-500' },
                { label: 'بناتي ومواليد', percentage: 6, revenue: '18,000 ج.م', color: 'bg-teal-500' }
              ].map((row, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-bold text-white">{row.label}</span>
                    <span className="font-mono text-slate-300">{row.revenue} ({row.percentage}%)</span>
                  </div>
                  <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div className={cn("h-full rounded-full", row.color)} style={{ width: `${row.percentage}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[#151b2b] border border-[#1e293b] rounded-3xl p-6 space-y-4 shadow-xl">
            <h4 className="font-bold text-white text-sm flex items-center gap-2">
              <Globe2 className="text-pink-400" size={18} />
              <span>تحليل المبيعات وهوامش الربح حسب بلد المنشأ (تركي vs صيني vs مصري)</span>
            </h4>
            <div className="space-y-3 pt-2">
              {[
                { label: 'تركي (Turkey) - ملابس صوف وقطن فاخر', margin: '45% هامش ربح', revenue: '120,000 ج.م' },
                { label: 'صيني (China) - فساتين شيفون وترتر وإكسسوارات', margin: '52% هامش ربح', revenue: '98,000 ج.م' },
                { label: 'مصري (Egypt) - جينز قطن محلي وتيشرتات', margin: '38% هامش ربح', revenue: '83,000 ج.م' }
              ].map((row, idx) => (
                <div key={idx} className="p-3 bg-[#0f172a] rounded-2xl border border-slate-800 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-bold text-white">{row.label}</p>
                    <p className="text-[10px] text-pink-400 font-bold mt-0.5">{row.margin}</p>
                  </div>
                  <span className="font-mono font-bold text-white">{row.revenue}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modal: Generate New Fashion Matrix */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#151b2b] border border-purple-500/40 rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto relative">
            <button 
              onClick={() => setShowAddModal(false)}
              className="absolute left-6 top-6 text-slate-400 hover:text-white p-2 rounded-full bg-slate-800"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-500/10 text-purple-400 rounded-2xl border border-purple-500/30">
                <Shirt size={24} />
              </div>
              <div>
                <h3 className="text-lg font-black text-white">توليد موديل جديد (مصفوفة ألوان ومقاسات وتصنيفات)</h3>
                <p className="text-xs text-slate-400">توليد تلقائي لجميع التباديل وتخصيص الباركود وSKU لكل مقاس ولون</p>
              </div>
            </div>

            <form onSubmit={handleGenerateMatrix} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-400 font-bold block mb-1">كود الموديل الموحد:</label>
                  <input 
                    type="text" 
                    required
                    placeholder="MOD-2026-JACKET"
                    value={modelCode}
                    onChange={(e) => setModelCode(e.target.value)}
                    className="w-full p-3 bg-[#0f172a] border border-[#1e293b] rounded-xl text-xs text-white font-mono focus:border-purple-500 outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-400 font-bold block mb-1">اسم الموديل والتصميم:</label>
                  <input 
                    type="text" 
                    required
                    placeholder="جاكيت بليزر كلاسيك رجالي"
                    value={modelName}
                    onChange={(e) => setModelName(e.target.value)}
                    className="w-full p-3 bg-[#0f172a] border border-[#1e293b] rounded-xl text-xs text-white focus:border-purple-500 outline-none"
                  />
                </div>
              </div>

              {/* Gender, Origin, Season 3-columns */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] text-slate-400 font-bold block mb-1">الفئة / الجنس:</label>
                  <select 
                    value={gender}
                    onChange={(e) => setGender(e.target.value as any)}
                    className="w-full p-2.5 bg-[#0f172a] border border-[#1e293b] rounded-xl text-xs text-white focus:border-purple-500 outline-none"
                  >
                    {genderOptions.map(g => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] text-slate-400 font-bold block mb-1">بلد المنشأ والتصنيع:</label>
                  <select 
                    value={origin}
                    onChange={(e) => setOrigin(e.target.value as any)}
                    className="w-full p-2.5 bg-[#0f172a] border border-[#1e293b] rounded-xl text-xs text-white focus:border-purple-500 outline-none"
                  >
                    {originOptions.map(o => (
                      <option key={o} value={o}>{o}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] text-slate-400 font-bold block mb-1">الموسم / التشكيلة:</label>
                  <select 
                    value={season}
                    onChange={(e) => setSeason(e.target.value as any)}
                    className="w-full p-2.5 bg-[#0f172a] border border-[#1e293b] rounded-xl text-xs text-white focus:border-purple-500 outline-none"
                  >
                    {seasonOptions.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Material and Brand */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-400 font-bold block mb-1">الخامة والقماش:</label>
                  <input 
                    type="text" 
                    placeholder="مثال: قطن تركي 100%، صوف مخلوط"
                    value={material}
                    onChange={(e) => setMaterial(e.target.value)}
                    className="w-full p-2.5 bg-[#0f172a] border border-[#1e293b] rounded-xl text-xs text-white focus:border-purple-500 outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-400 font-bold block mb-1">الماركة / البراند:</label>
                  <input 
                    type="text" 
                    placeholder="MARO Fashion"
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    className="w-full p-2.5 bg-[#0f172a] border border-[#1e293b] rounded-xl text-xs text-white focus:border-purple-500 outline-none"
                  />
                </div>
              </div>

              {/* Price */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-400 font-bold block mb-1">سعر البيع الأساسي للمستهلك:</label>
                  <input 
                    type="number" 
                    value={basePrice}
                    onChange={(e) => setBasePrice(Number(e.target.value))}
                    className="w-full p-2.5 bg-[#0f172a] border border-[#1e293b] rounded-xl text-xs text-white font-mono text-center focus:border-purple-500 outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-400 font-bold block mb-1">سعر التكلفة:</label>
                  <input 
                    type="number" 
                    value={costPrice}
                    onChange={(e) => setCostPrice(Number(e.target.value))}
                    className="w-full p-2.5 bg-[#0f172a] border border-[#1e293b] rounded-xl text-xs text-white font-mono text-center focus:border-purple-500 outline-none"
                  />
                </div>
              </div>

              {/* Colors selection */}
              <div className="space-y-1.5">
                <label className="text-xs text-slate-400 font-bold block">الألوان المتاحة في الموديل:</label>
                <div className="flex flex-wrap gap-2">
                  {colorOptions.map(c => (
                    <button
                      type="button"
                      key={c}
                      onClick={() => toggleColor(c)}
                      className={cn(
                        "px-3 py-1.5 rounded-xl text-xs font-bold transition-all",
                        selectedColors.includes(c) 
                          ? "bg-purple-600 text-white shadow-md" 
                          : "bg-[#0f172a] text-slate-400 hover:text-white border border-[#1e293b]"
                      )}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sizes selection */}
              <div className="space-y-1.5">
                <label className="text-xs text-slate-400 font-bold block">المقاسات المتاحة في الموديل:</label>
                <div className="flex flex-wrap gap-2">
                  {sizeOptions.map(s => (
                    <button
                      type="button"
                      key={s}
                      onClick={() => toggleSize(s)}
                      className={cn(
                        "px-3 py-1.5 rounded-xl text-xs font-bold font-mono transition-all",
                        selectedSizes.includes(s) 
                          ? "bg-purple-600 text-white shadow-md" 
                          : "bg-[#0f172a] text-slate-400 hover:text-white border border-[#1e293b]"
                      )}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Preview of generated combinations */}
              <div className="p-3 bg-[#0f172a] rounded-xl border border-purple-500/30 text-xs text-purple-300 flex items-center justify-between font-mono">
                <span>سيتم توليد عدد: <strong>{selectedColors.length * selectedSizes.length}</strong> صنف ومقاس تلقائياً</span>
                <span>(بأكواد باركود وSKU فريدة)</span>
              </div>

              <div className="flex items-center gap-3 pt-4 border-t border-[#1e293b]">
                <button 
                  type="submit" 
                  className="flex-1 py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-2xl font-bold text-xs shadow-lg shadow-purple-600/20"
                >
                  توليد وحفظ مصفوفة الأصناف والباركود
                </button>
                <button 
                  type="button" 
                  onClick={() => setShowAddModal(false)}
                  className="px-5 py-3.5 bg-[#0f172a] hover:bg-slate-800 text-slate-300 rounded-2xl font-bold text-xs"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
