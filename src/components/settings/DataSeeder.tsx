import React, { useState } from 'react';
import { DatabaseZap, Activity, ShoppingCart, Store, PlayCircle, Info } from 'lucide-react';
import { MaroSyncEngine } from '../../lib/maroSyncEngine';
import { ProductMaster } from '../../types/productMaster';
import { toast } from 'react-hot-toast';

export const DataSeeder: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  const generateData = async (type: 'grocery' | 'pharmacy', count: number) => {
    if (count > 5000 && typeof localStorage !== 'undefined') {
      const confirm = window.confirm(`تنبيه (تحذير الذاكرة):\n\nتوليد ${count} صنف سيتجاوز الحد الأقصى للمتصفح (Local Storage) وقد يؤدي إلى مسح البيانات عند إعادة تحميل الصفحة أو بطء المتصفح في حال عدم التفعيل السحابي (PostgreSQL).\nهل أنت متأكد من المتابعة كاختبار؟`);
      if (!confirm) return;
    }

    setLoading(true);
    setProgress(0);
    toast.success(`جاري تحضير وتوليد ${count} صنف تجريبي...`);

    // We do it in a setTimeout to let the UI update
    setTimeout(() => {
      try {
        const existingProducts = MaroSyncEngine.getLocalCollection<ProductMaster>('products');
        const newProducts: ProductMaster[] = [];
        
        const groceryNames = ["أرز مصري", "مكرونة", "زيت قلي", "سكر", "شاي", "جبنة بيضاء", "حليب", "صلصة طماطم", "تونة", "دقيق"];
        const pharmacyNames = ["بانادول", "أوجمنتين", "كونجستال", "فيتامين سي", "أوميبرازول", "بروفين", "كلافوكس", "لوراتادين", "كريم مرطب", "قطرة عين"];

        const namePool = type === 'grocery' ? groceryNames : pharmacyNames;
        
        for (let i = 0; i < count; i++) {
          const randIndex = Math.floor(Math.random() * namePool.length);
          const baseName = namePool[randIndex];
          const sku = `${type === 'grocery' ? 'GRC' : 'PHR'}-${Date.now().toString().slice(-4)}-${i}`;
          
          const p: ProductMaster = {
            id: `seed_${Date.now()}_${i}_${Math.random().toString(36).substr(2,4)}`,
            name: `${baseName} - صنف تجريبي ${i + 1}`,
            sku: sku,
            barcode: Math.floor(1000000000000 + Math.random() * 9000000000000).toString(),
            description: `صنف مولد تلقائيا للنشاط ${type}`,
            price: Math.floor(Math.random() * 150) + 10,
            costPrice: Math.floor(Math.random() * 100) + 5,
            quantity: Math.floor(Math.random() * 500) + 10,
            status: 'active',
            isTaxable: true,
            taxIncluded: false,
            allowNegativeStock: false,
            batchTracking: type === 'pharmacy',
            expiryTracking: type === 'pharmacy',
            serialNumberTracking: false,
            allowFraction: false,
            openingBalance: 100,
            reorderLevel: 10,
            units: [],
            barcodes: [],
            warehouseStocks: [],
            priceLists: [],
            batches: [],
            images: [],
            attachments: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          newProducts.push(p);
          
          if (i % 1000 === 0 && i > 0) {
             setProgress(Math.floor((i / count) * 100));
          }
        }

        // Save directly to engine bypassing individual audit logs for speed
        MaroSyncEngine.setLocalCollection('products', [...existingProducts, ...newProducts]);
        
        setProgress(100);
        toast.success(`تم بنجاح توليد وحفظ ${count} صنف تجريبي!`);
      } catch (err) {
        console.error("Seed error:", err);
        toast.error('حدث خطأ أثناء التوليد (قد تكون الذاكرة غير كافية لعدد الأصناف)');
      } finally {
        setLoading(false);
      }
    }, 500);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 text-right" dir="rtl">
      <div className="border-b border-slate-800 pb-4">
        <h3 className="text-lg font-black text-white flex items-center gap-2">
          <DatabaseZap className="text-emerald-500" /> خيارات المطور (توليد بيانات تجريبية)
        </h3>
        <p className="text-xs text-slate-400 mt-1">توليد بيانات بكميات كبيرة لاختبار قدرات النظام على تحمل ملايين السجلات وإدارة المخزون.</p>
      </div>

      <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-400 font-bold flex items-start gap-2 leading-relaxed">
        <Info className="w-5 h-5 shrink-0" />
        <div>
          <p>أنت تعمل الآن في النسخة المحلية (Offline Mode).</p>
          <p className="text-amber-500/80 mt-1">توليد أكثر من 5,000 صنف تجريبي قد يؤدي لملء مساحة متصفحك وانهياره إذا لم يتم تفعيل قاعدة بيانات PostgreSQL السحابية. للكميات الضخمة (50,000+)، ينصح باستخدام "المزامنة السحابية".</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Grocery Seeder */}
        <div className="bg-[#0f172a] rounded-2xl border border-slate-800 p-5 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center text-orange-400">
              <ShoppingCart size={20} />
            </div>
            <div>
              <h4 className="font-bold text-white text-sm">المواد الغذائية / سوبر ماركت</h4>
              <p className="text-[10px] text-slate-500">توليد أصناف استهلاكية بباركود عشوائي</p>
            </div>
          </div>
          
          <div className="flex gap-2">
            <button 
              disabled={loading}
              onClick={() => generateData('grocery', 1000)}
              className="flex-1 py-2 bg-orange-600/20 hover:bg-orange-600 border border-orange-500/30 text-orange-400 hover:text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-1"
            >
              <PlayCircle size={14} /> 1,000 صنف
            </button>
            <button 
              disabled={loading}
              onClick={() => generateData('grocery', 5000)}
              className="flex-1 py-2 bg-orange-600/20 hover:bg-orange-600 border border-orange-500/30 text-orange-400 hover:text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-1"
            >
              <PlayCircle size={14} /> 5,000 صنف
            </button>
          </div>
        </div>

        {/* Pharmacy Seeder */}
        <div className="bg-[#0f172a] rounded-2xl border border-slate-800 p-5 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500/20 flex items-center justify-center text-teal-400">
              <Activity size={20} />
            </div>
            <div>
              <h4 className="font-bold text-white text-sm">الأدوية والصيدليات</h4>
              <p className="text-[10px] text-slate-500">توليد أدوية مع تتبع التشغيلات وتواريخ الصلاحية</p>
            </div>
          </div>
          
          <div className="flex gap-2">
            <button 
              disabled={loading}
              onClick={() => generateData('pharmacy', 10000)}
              className="flex-1 py-2 bg-teal-600/20 hover:bg-teal-600 border border-teal-500/30 text-teal-400 hover:text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-1"
            >
              <PlayCircle size={14} /> 10,000 صنف
            </button>
            <button 
              disabled={loading}
              onClick={() => generateData('pharmacy', 50000)}
              className="flex-1 py-2 bg-teal-600/20 hover:bg-teal-600 border border-teal-500/30 text-teal-400 hover:text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-1"
            >
              <PlayCircle size={14} /> 50,000 صنف (تحذير)
            </button>
          </div>
        </div>
      </div>

      {loading && (
        <div className="mt-6">
          <div className="flex justify-between text-xs mb-1">
            <span className="text-white font-bold">جاري التوليد...</span>
            <span className="text-blue-400 font-mono">{progress}%</span>
          </div>
          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
            <div className="bg-blue-500 h-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
          </div>
        </div>
      )}
    </div>
  );
};
