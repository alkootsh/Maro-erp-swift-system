/**
 * @file Settings.tsx
 * @module واجهات وصفحات النظام (UI Pages)
 * @description ملف جزء من نظام MARO ERP. الوظيفة: Settings.tsx.
 */
import React, { useState, useRef, useMemo, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { IndustryModuleEngine } from '../lib/industryModuleEngine';
import { 
  Building2, 
  Settings as SettingsIcon, 
  Shield, 
  User, 
  Keyboard, 
  Save,
  Boxes,
  Briefcase,
  Wallet,
  CheckCircle2,
  AlertTriangle,
  PlayCircle,
  Database,
  Layers,
  Store,
  Factory,
  Utensils,
  Stethoscope,
  Activity,
  Download,
  Upload,
  FileSpreadsheet,
  RefreshCw,
  Trash2,
  Cloud,
  CloudOff,
  Wifi,
  WifiOff,
  Zap,
  Server,
  HardDrive,
  Code
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuth } from '../components/AuthProvider';
import { exportToExcel, importFromExcel } from '../lib/excel';
import { MaroSyncEngine, SyncStatusEvent } from '../lib/maroSyncEngine';
import { toast } from 'react-hot-toast';
import { ProductRepository } from '../repositories/productRepository';
import { DataSeeder } from '../components/settings/DataSeeder';
import { BackupManagerPanel } from '../components/settings/BackupManagerPanel';

export const Settings: React.FC = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const urlTab = searchParams.get('tab');
  const validTabs = ['tenant', 'industry', 'finance', 'modules', 'database', 'sync', 'developer'];
  const [activeTab, setActiveTab] = useState<'tenant' | 'industry' | 'finance' | 'modules' | 'database' | 'sync' | 'developer'>(
    urlTab && validTabs.includes(urlTab) ? (urlTab as any) : 'tenant'
  );

  useEffect(() => {
    const currentTab = searchParams.get('tab');
    if (currentTab && validTabs.includes(currentTab)) {
      setActiveTab(currentTab as any);
    }
  }, [searchParams]);

  const handleTabChange = (tabId: 'tenant' | 'industry' | 'finance' | 'modules' | 'database' | 'sync' | 'developer') => {
    setActiveTab(tabId);
    setSearchParams({ tab: tabId });
  };
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

  // Sync Engine States
  const [cloudSyncEnabled, setCloudSyncEnabled] = useState<boolean>(() => MaroSyncEngine.isCloudSyncEnabled());
  const [syncStatus, setSyncStatus] = useState<SyncStatusEvent>(() => MaroSyncEngine.getStatus());
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Loyalty Settings
  const [loyaltyEnabled, setLoyaltyEnabled] = useState<boolean>(() => localStorage.getItem('maro_loyalty_enabled') === 'true');

  React.useEffect(() => {
    const unsub = MaroSyncEngine.subscribeStatus((st) => {
      setSyncStatus(st);
    });
    return unsub;
  }, []);

  const handleToggleCloudSync = (enabled: boolean) => {
    setCloudSyncEnabled(enabled);
    MaroSyncEngine.setCloudSyncEnabled(enabled);
    if (enabled) {
      toast.success('تم تفعيل المزامنة السحابية التلقائية. سيتم ترحيل البيانات عند توفر الإنترنت.');
    } else {
      toast.success('تم إيقاف المزامنة السحابية. النظام يعمل الآن في وضع محلي معزول 100% (Offline-First Air-Gapped).');
    }
  };

  const handleManualSync = async () => {
    setIsSyncing(true);
    try {
      const res = await MaroSyncEngine.forceSyncNow();
      if (res.success) {
        toast.success(res.message);
      } else {
        toast.error(res.message);
      }
    } catch (e: any) {
      toast.error(e.message || 'تعذر استكمال المزامنة السحابية');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleFlushQueue = () => {
    MaroSyncEngine.flushQueueLocally();
    toast.success('تم تفريغ طابور المزامنة وحفظ الحالة المحلية بنجاح');
  };

  // Excel Import States
  const [importedProducts, setImportedProducts] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Core Configuration States
  const [tenantConfig, setTenantConfig] = useState({
    companyName: 'MARO Global Trading',
    taxNumber: '300123456789003',
    registrationNumber: '1010123456',
    baseCurrency: 'SAR',
    taxRate: 15,
  });

  const [selectedIndustry, setSelectedIndustry] = useState<string>('FOOD_SUPERMARKET');
  const [coaStatus, setCoaStatus] = useState<'pending' | 'generating' | 'ready'>('pending');
  const [industrySearch, setIndustrySearch] = useState<string>('');

  const allIndustryModules = useMemo(() => IndustryModuleEngine.getModules(), []);

  const filteredIndustryModules = useMemo(() => {
    if (!industrySearch.trim()) return allIndustryModules;
    const query = industrySearch.toLowerCase();
    return allIndustryModules.filter(m => 
      m.nameAr.toLowerCase().includes(query) || 
      m.descriptionAr.toLowerCase().includes(query) ||
      m.code.toLowerCase().includes(query)
    );
  }, [allIndustryModules, industrySearch]);

  const modules = [
    { id: 'crm', name: 'إدارة علاقات العملاء (CRM)', category: 'P1', enabled: true },
    { id: 'workflow', name: 'محرك سير العمل (Workflow Engine)', category: 'P1', enabled: true },
    { id: 'manufacturing', name: 'التصنيع والإنتاج (MRP)', category: 'P2', enabled: false },
    { id: 'ecommerce', name: 'ربط المتاجر الإلكترونية (Omnichannel)', category: 'P2', enabled: false },
    { id: 'hr', name: 'الموارد البشرية والرواتب (HR)', category: 'P2', enabled: true },
  ];

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulate API Save
    setTimeout(() => {
      localStorage.setItem('maro_loyalty_enabled', loyaltyEnabled.toString());
      setMessage({ type: 'success', text: 'تم تحديث التكوين الأساسي (Core Configuration) بنجاح.' });
      setLoading(false);
      setTimeout(() => setMessage(null), 3000);
    }, 800);
  };

  const handleGenerateCOA = async () => {
    setCoaStatus('generating');
    try {
      const response = await fetch('/api/erp/finance/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ industry: selectedIndustry })
      });
      
      if (!response.ok) throw new Error('Failed to initialize');
      
      setCoaStatus('ready');
      setMessage({ type: 'success', text: 'تم إنشاء الدليل المحاسبي الافتراضي بناءً على نشاط الشركة.' });
    } catch (e) {
      setCoaStatus('pending');
      setMessage({ type: 'error', text: 'حدث خطأ أثناء إنشاء الدليل المحاسبي.' });
    }
    setTimeout(() => setMessage(null), 3000);
  };

  const handleDownloadBackup = () => {
    try {
      const backupData: Record<string, string> = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('maro_') || key.startsWith('smart_'))) {
          backupData[key] = localStorage.getItem(key) || '';
        }
      }
      const dataStr = JSON.stringify(backupData, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
      
      const exportFileDefaultName = `maro_database_backup_${new Date().toISOString().split('T')[0]}.json`;
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
      setMessage({ type: 'success', text: 'تم إنشاء وتحميل النسخة الاحتياطية بنجاح!' });
    } catch (err) {
      setMessage({ type: 'error', text: 'حدث خطأ أثناء إنشاء النسخة الاحتياطية.' });
    }
    setTimeout(() => setMessage(null), 3000);
  };

  const handleRestoreBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    if (e.target.files && e.target.files[0]) {
      fileReader.readAsText(e.target.files[0], "UTF-8");
      fileReader.onload = (event) => {
        try {
          const parsedData = JSON.parse(event.target?.result as string);
          if (typeof parsedData === 'object' && parsedData !== null) {
            const keys = Object.keys(parsedData);
            if (keys.length === 0) {
              setMessage({ type: 'error', text: 'ملف النسخة الاحتياطية فارغ أو غير صالح.' });
              return;
            }
            keys.forEach(key => {
              localStorage.setItem(key, parsedData[key]);
            });
            setMessage({ type: 'success', text: 'تمت استعادة البيانات بالكامل بنجاح! جاري إعادة تشغيل المنظومة...' });
            setTimeout(() => {
              window.location.reload();
            }, 1500);
          } else {
            setMessage({ type: 'error', text: 'صيغة ملف النسخة الاحتياطية غير صالحة.' });
          }
        } catch (error) {
          setMessage({ type: 'error', text: 'حدث خطأ أثناء قراءة ملف النسخة الاحتياطية.' });
        }
      };
    }
  };

  const handleExportProducts = () => {
    try {
      const products = MaroSyncEngine.getLocalCollection('products');
      if (products.length === 0) {
        setMessage({ type: 'error', text: 'لا توجد أصناف في المستودع لتصديرها!' });
        return;
      }
      const excelData = products.map((p: any) => ({
        'رقم SKU': p.sku,
        'اسم المنتج': p.name,
        'الباركود': p.barcodes ? p.barcodes[0] : '',
        'سعر البيع': p.price,
        'سعر التكلفة': p.costPrice || 0,
        'الكمية الحالية': p.quantity,
        'القسم / التصنيف': p.category,
        'الماركة / العلامة': p.brand,
        'وحدة القياس': p.unit,
        'الفرز / النخب': p.grade || 'N/A',
        'رقم اللوط': p.lotNumber || 'N/A'
      }));
      exportToExcel(excelData, `maro_products_export_${new Date().toISOString().split('T')[0]}`);
      setMessage({ type: 'success', text: 'تم تصدير الأصناف إلى ملف إكسيل بنجاح!' });
    } catch (err) {
      setMessage({ type: 'error', text: 'حدث خطأ أثناء تصدير البيانات إلى إكسيل.' });
    }
    setTimeout(() => setMessage(null), 3000);
  };

  const handleExcelImportSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      try {
        const rawJson = await importFromExcel(e.target.files[0]);
        if (rawJson && Array.isArray(rawJson)) {
          const mapped = rawJson.map((row: any, idx) => {
            return {
              id: `imported_${Date.now()}_${idx}`,
              sku: String(row['رقم SKU'] || row['sku'] || row['SKU'] || `SKU-${Date.now()}-${idx}`),
              name: String(row['اسم المنتج'] || row['name'] || row['الاسم'] || 'منتج مستورد بدون اسم'),
              barcodes: [String(row['الباركود'] || row['barcode'] || '')],
              price: Number(row['سعر البيع'] || row['price'] || 0),
              costPrice: Number(row['سعر التكلفة'] || row['cost'] || 0),
              quantity: Number(row['الكمية الحالية'] || row['quantity'] || row['المخزون'] || 0),
              category: String(row['القسم / التصنيف'] || row['category'] || 'general'),
              brand: String(row['الماركة / العلامة'] || row['brand'] || 'general'),
              unit: String(row['وحدة القياس'] || row['unit'] || 'قطعة'),
              grade: String(row['الفرز / النخب'] || row['grade'] || 'N/A'),
              lotNumber: String(row['رقم اللوط'] || row['lot'] || 'N/A'),
              status: 'active',
              warehouseStocks: [
                { warehouseId: 'wh_main', quantity: Number(row['الكمية الحالية'] || row['quantity'] || 0) }
              ],
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            };
          });
          setImportedProducts(mapped);
          setMessage({ type: 'success', text: `تم استخراج ${mapped.length} صنف من ملف الإكسيل بنجاح. يرجى مراجعة الجدول والضغط على تأكيد للحفظ.` });
        }
      } catch (err) {
        setMessage({ type: 'error', text: 'خطأ أثناء قراءة ملف الإكسيل. يرجى التأكد من التنسيق الصحيح.' });
      }
      setTimeout(() => setMessage(null), 4000);
    }
  };

  const handleConfirmExcelImport = () => {
    if (importedProducts.length === 0) return;
    try {
      const currentProducts = MaroSyncEngine.getLocalCollection('products');
      const updatedProducts = [...currentProducts];
      
      importedProducts.forEach(newProd => {
        const idx = updatedProducts.findIndex(p => p.sku === newProd.sku);
        if (idx >= 0) {
          updatedProducts[idx] = {
            ...updatedProducts[idx],
            ...newProd,
            id: updatedProducts[idx].id
          };
        } else {
          updatedProducts.push(newProd);
        }
      });
      
      MaroSyncEngine.setLocalCollection('products', updatedProducts);
      setImportedProducts([]);
      setMessage({ type: 'success', text: `تم دمج وحفظ الأصناف بنجاح! الإجمالي الحالي في النظام: ${updatedProducts.length} صنف.` });
    } catch (err) {
      setMessage({ type: 'error', text: 'حدث خطأ أثناء دمج وحفظ البيانات.' });
    }
    setTimeout(() => setMessage(null), 3000);
  };

  const tabs = [
    { id: 'tenant', name: 'الشركة (Tenant Identity)', icon: Building2 },
    { id: 'industry', name: 'محرك الأنشطة (Industry Engine)', icon: Layers },
    { id: 'finance', name: 'المحاسبة والمالية (Finance Core)', icon: Wallet },
    { id: 'modules', name: 'الوحدات (Module Enablement)', icon: Boxes },
    { id: 'sync', name: 'المزامنة السحابية والعمل دون إنترنت (Offline-First Sync)', icon: Cloud },
    { id: 'database', name: 'النسخ الاحتياطي والبيانات التجريبية (Data, Backup & Seed)', icon: Database },
    { id: 'developer', name: 'خيارات المطور وتوليد البيانات (Developer & Seed)', icon: Code },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-950 via-[#151b2b] to-[#0f172a] p-6 rounded-2xl border border-blue-900/40 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-400 font-bold text-xs border border-blue-500/30">
              MARO Adaptive ERP — Core Engine
            </span>
          </div>
          <h1 className="text-2xl font-black text-white">إعدادات النظام والمحرك الأساسي</h1>
          <p className="text-xs text-slate-400 mt-1">
            تهيئة حساب الشركة (Tenant Isolation)، اختيار النشاط، وإنشاء الدليل المحاسبي.
          </p>
        </div>
        {message && (
          <div className={cn(
            "px-4 py-3 rounded-xl text-xs font-bold animate-in fade-in flex items-center gap-2 border",
            message.type === 'success' ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-red-500/10 text-red-400 border-red-500/20"
          )}>
            <CheckCircle2 size={16} /> {message.text}
          </div>
        )}
      </div>

      <div className="flex gap-2 border-b border-[#1e293b] pb-4 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id as any)}
            className={cn(
              "flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-xs transition-all whitespace-nowrap",
              activeTab === tab.id 
                ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" 
                : "bg-[#151b2b] text-slate-400 hover:text-white border border-[#1e293b] hover:border-slate-700"
            )}
          >
            <tab.icon size={16} />
            <span>{tab.name}</span>
          </button>
        ))}
      </div>

      <div className="bg-[#151b2b] rounded-2xl border border-[#1e293b] p-6 shadow-2xl min-h-[500px]">
        {/* TAB 1: TENANT IDENTITY */}
        {activeTab === 'tenant' && (
          <form onSubmit={handleSave} className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
            <div className="border-b border-slate-800 pb-4">
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <Building2 className="text-blue-500" /> الهوية القانونية للشركة (Tenant)
              </h3>
              <p className="text-xs text-slate-400 mt-1">المعلومات الضريبية والقانونية التي تظهر على الفواتير الرسمية.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-2">اسم الشركة (الرسمي)</label>
                <input 
                  type="text" 
                  value={tenantConfig.companyName}
                  onChange={(e) => setTenantConfig({...tenantConfig, companyName: e.target.value})}
                  className="w-full bg-[#0f172a] border border-slate-800 rounded-xl px-4 py-3 text-white text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all" 
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-2">الرقم الضريبي (VAT Number)</label>
                <input 
                  type="text" 
                  value={tenantConfig.taxNumber}
                  onChange={(e) => setTenantConfig({...tenantConfig, taxNumber: e.target.value})}
                  className="w-full bg-[#0f172a] border border-slate-800 rounded-xl px-4 py-3 text-white text-sm font-mono focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all" 
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-2">رقم السجل التجاري (CR)</label>
                <input 
                  type="text" 
                  value={tenantConfig.registrationNumber}
                  onChange={(e) => setTenantConfig({...tenantConfig, registrationNumber: e.target.value})}
                  className="w-full bg-[#0f172a] border border-slate-800 rounded-xl px-4 py-3 text-white text-sm font-mono focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all" 
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-2">عملة الأساس</label>
                  <input 
                    type="text" 
                    value={tenantConfig.baseCurrency}
                    readOnly
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-slate-500 text-sm font-bold cursor-not-allowed" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-2">نسبة الضريبة %</label>
                  <input 
                    type="number" 
                    value={tenantConfig.taxRate}
                    onChange={(e) => setTenantConfig({...tenantConfig, taxRate: Number(e.target.value)})}
                    className="w-full bg-[#0f172a] border border-slate-800 rounded-xl px-4 py-3 text-white text-sm font-mono focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all" 
                  />
                </div>
              </div>
            </div>
            
            <div className="flex justify-end pt-6">
              <button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-xl text-sm font-bold transition-all flex items-center gap-2">
                <Save size={18} /> حفظ التكوين
              </button>
            </div>
          </form>
        )}

        {/* TAB 2: INDUSTRY ENGINE */}
        {activeTab === 'industry' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
            <div className="border-b border-slate-800 pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-black text-white flex items-center gap-2">
                  <Layers className="text-purple-500" /> محرك الأنشطة (Dynamic Industry Engine - {allIndustryModules.length} نشاط)
                </h3>
                <p className="text-xs text-slate-400 mt-1">يقوم محرك MARO بتشكيل الشاشات والميزات تلقائياً بناءً على طبيعة نشاطك للحفاظ على النظام خفيفاً وسريعاً.</p>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  value={industrySearch}
                  onChange={(e) => setIndustrySearch(e.target.value)}
                  placeholder="بحث في الأنشطة..."
                  className="bg-[#0f172a] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                />
                <Link 
                  to="/adaptive-erp" 
                  className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-lg shadow-purple-900/20 active:scale-95 whitespace-nowrap"
                >
                  <Layers size={15} />
                  <span>منصة الأنشطة ↗</span>
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[500px] overflow-y-auto pr-1">
              {filteredIndustryModules.map((ind) => (
                <div 
                  key={ind.id}
                  onClick={() => setSelectedIndustry(ind.id)}
                  className={cn(
                    "p-4 rounded-2xl border cursor-pointer transition-all flex flex-col gap-2 relative overflow-hidden group",
                    selectedIndustry === ind.id 
                      ? "bg-purple-600/10 border-purple-500 shadow-lg shadow-purple-900/20" 
                      : "bg-[#0f172a] border-slate-800 hover:border-slate-600 hover:bg-slate-800/50"
                  )}
                >
                  {selectedIndustry === ind.id && (
                    <div className="absolute top-3 left-3 bg-purple-500 text-white p-1 rounded-full">
                      <CheckCircle2 size={14} />
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-purple-400 font-mono font-bold bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
                      {ind.code}
                    </span>
                    <span className="text-[10px] text-slate-500">{ind.category}</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-white mb-1 line-clamp-1">{ind.nameAr}</h4>
                    <p className="text-[11px] text-slate-400 leading-relaxed line-clamp-2">{ind.descriptionAr}</p>
                  </div>
                  <div className="flex items-center gap-2 pt-2 border-t border-slate-800 text-[10px] text-slate-500">
                    <span>{ind.specializedFeatures?.length || 0} ميزات مفعلة</span>
                    <span>•</span>
                    <span>{ind.customProductFields?.length || 0} حقول مخصصة</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex gap-3 mt-6">
              <AlertTriangle className="text-amber-500 shrink-0" size={20} />
              <div>
                <h5 className="text-sm font-bold text-amber-500 mb-1">ملاحظة معمارية</h5>
                <p className="text-xs text-amber-400/80">تغيير نشاط الشركة بعد بدء العمليات سيؤثر على القوالب الافتراضية للفواتير وتقارير ذكاء الأعمال (BI). النظام يدعم Hybrid Industry (مثال: تجزئة + مطعم).</p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: FINANCE ENGINE */}
        {activeTab === 'finance' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
            <div className="border-b border-slate-800 pb-4">
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <Wallet className="text-emerald-500" /> المحرك المالي والدليل المحاسبي
              </h3>
              <p className="text-xs text-slate-400 mt-1">يُشترط توليد دليل حسابات قياسي (Chart of Accounts) لتتمكن من إصدار أي فاتورة أو حركة مخزنية.</p>
            </div>

            <div className="bg-[#0f172a] rounded-2xl border border-slate-800 p-8 flex flex-col items-center justify-center text-center">
              <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mb-6">
                <Database className={cn("text-emerald-500", coaStatus === 'generating' && "animate-pulse")} size={40} />
              </div>
              
              <h4 className="text-xl font-bold text-white mb-2">الدليل المحاسبي (Chart of Accounts)</h4>
              
              {coaStatus === 'pending' && (
                <>
                  <p className="text-sm text-slate-400 max-w-md mx-auto mb-6">لم يتم إنشاء الدليل المحاسبي بعد. هل ترغب في قيام MARO بتوليد دليل شجري متوافق مع معايير IFRS مخصص لنشاط ({allIndustryModules.find(i => i.id === selectedIndustry)?.nameAr || selectedIndustry})؟</p>
                  <button onClick={handleGenerateCOA} className="bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-3 rounded-xl text-sm font-bold transition-all shadow-lg shadow-emerald-900/20">
                    توليد الدليل المحاسبي الآن
                  </button>
                </>
              )}

              {coaStatus === 'generating' && (
                <div className="space-y-4">
                  <p className="text-sm text-slate-300 font-bold">جاري بناء الشجرة المحاسبية وتكوين قيود الافتتاح...</p>
                  <div className="w-64 h-2 bg-slate-800 rounded-full overflow-hidden mx-auto">
                    <div className="h-full bg-emerald-500 w-1/2 animate-[pulse_1s_ease-in-out_infinite]"></div>
                  </div>
                </div>
              )}

              {coaStatus === 'ready' && (
                <div className="space-y-4">
                  <div className="inline-flex items-center gap-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-4 py-2 rounded-lg text-sm font-bold">
                    <CheckCircle2 size={18} /> الدليل المحاسبي جاهز ونشط
                  </div>
                  <p className="text-xs text-slate-400 block">تم بناء 124 حساب فرعي ورئيسي بناءً على النشاط المحدد.</p>
                  <button className="text-blue-400 text-xs font-bold hover:underline mt-2">استعراض الشجرة المحاسبية →</button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: MODULES ENABLEMENT */}
        {activeTab === 'modules' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
            <div className="border-b border-slate-800 pb-4">
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <Boxes className="text-rose-500" /> تفعيل وتعطيل الوحدات (Module Enablement)
              </h3>
              <p className="text-xs text-slate-400 mt-1">حافظ على MARO كنظام "Lite" عن طريق تعطيل الوحدات التي لا تحتاجها، أو حوّله إلى "Full ERP" متى أردت.</p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-4 bg-[#0f172a] rounded-xl border border-blue-900/50">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-xs bg-emerald-500/20 text-emerald-400">
                    LOY
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-sm">برنامج نقاط الولاء (Loyalty Points)</h4>
                    <p className="text-[10px] text-slate-500">يتيح إضافة حقل تليفون العميل في شاشة البيع النقدي لاكتساب واستبدال النقاط.</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer" 
                    checked={loyaltyEnabled}
                    onChange={(e) => {
                      const val = e.target.checked;
                      setLoyaltyEnabled(val);
                      localStorage.setItem('maro_loyalty_enabled', val.toString());
                      toast.success(val ? 'تم تفعيل برنامج الولاء' : 'تم تعطيل برنامج الولاء');
                    }}
                  />
                  <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
                </label>
              </div>

              {modules.map((mod) => (
                <div key={mod.id} className="flex items-center justify-between p-4 bg-[#0f172a] rounded-xl border border-slate-800">
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "w-10 h-10 rounded-lg flex items-center justify-center font-bold text-xs",
                      mod.category === 'P1' ? "bg-purple-500/20 text-purple-400" : "bg-blue-500/20 text-blue-400"
                    )}>
                      {mod.category}
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-sm">{mod.name}</h4>
                      <p className="text-[10px] text-slate-500">ميزة إضافية يتم تشغيلها وإيقافها بدون التأثير على النواة الأساسية (Core).</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked={mod.enabled} />
                    <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
                  </label>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB: OFFLINE FIRST & CLOUD SYNC CONTROL */}
        {activeTab === 'sync' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 text-right" dir="rtl">
            {/* Header & Core Philosophy Banner */}
            <div className="border-b border-slate-800 pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-black text-white flex items-center gap-2">
                  <Cloud className="text-blue-500" /> إعدادات المزامنة السحابية والعمل دون إنترنت (Offline-First Architecture)
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  نظام MARO ERP يعمل بشكل محلي كامل (Offline-First) كأصل، ويقوم بمزامنة البيانات تلقائياً مع السحابة عند توفر الإنترنت.
                </p>
              </div>

              <div className="flex items-center gap-3 bg-[#0a0f1d] px-4 py-2.5 rounded-2xl border border-slate-800">
                <span className="text-xs font-bold text-slate-300">مفتاح المزامنة السحابية:</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer" 
                    checked={cloudSyncEnabled} 
                    onChange={(e) => handleToggleCloudSync(e.target.checked)} 
                  />
                  <div className="w-12 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
                <span className={cn(
                  "text-xs font-black px-2.5 py-0.5 rounded-full border",
                  cloudSyncEnabled ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" : "bg-amber-500/20 text-amber-400 border-amber-500/30"
                )}>
                  {cloudSyncEnabled ? 'مفعلة (Auto Cloud Sync)' : 'معطلة (Offline Only)'}
                </span>
              </div>
            </div>

            {/* Architectural Rule Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-5 rounded-2xl bg-blue-950/20 border border-blue-800/40 space-y-2">
                <div className="flex items-center gap-2 text-blue-400 font-black text-sm">
                  <HardDrive size={18} />
                  <span>1. العمل محلياً هو الأساس (Offline Native)</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  كل عمليات الكاشير، إصدار الفواتير، الاستعلام، وإدارة المخزون تتم على الجهاز نفسه بسرعة استجابة فائقة (&lt; 20ms) حتى لو انقطع اتصال الإنترنت نهائياً.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-emerald-950/20 border border-emerald-800/40 space-y-2">
                <div className="flex items-center gap-2 text-emerald-400 font-black text-sm">
                  <Wifi size={18} />
                  <span>2. مزامنة ذكية عند الاتصال (Auto-Sync)</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  بمجرد توفر شبكة الإنترنت وتفعيل خيار المزامنة، يتم ترحيل الفواتير والعمليات المتراكمة في طابور العمليات (Sync Queue) إلى السيرفر المركزي بسلاسة وبدون مقاطعة العمل.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-purple-950/20 border border-purple-800/40 space-y-2">
                <div className="flex items-center gap-2 text-purple-400 font-black text-sm">
                  <Server size={18} />
                  <span>3. وضع العزل التام (Air-Gapped Mode)</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  إذا أوقفت المزامنة السحابية من هذا المفتاح، سيعمل النظام في وضع محلي معزول تماماً ولن يقوم بإجراء أي اتصالات خارجية مع الاحتفاظ بالبيانات بأمان محلياً.
                </p>
              </div>
            </div>

            {/* Live Engine Monitor & Action Dashboard */}
            <div className="bg-[#0f172a] rounded-2xl border border-slate-800 p-6 space-y-6">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className={cn(
                    "w-3.5 h-3.5 rounded-full animate-pulse",
                    !cloudSyncEnabled ? "bg-amber-400" : (syncStatus.state === 'OFFLINE' ? "bg-red-500" : "bg-emerald-500")
                  )} />
                  <span className="text-white font-black text-sm">لوحة مراقبة حالة المحرك وقناة الاتصال المباشرة</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleManualSync}
                    disabled={isSyncing || !cloudSyncEnabled}
                    className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-black py-2 px-4 rounded-xl transition shadow-lg shadow-blue-600/20 cursor-pointer"
                  >
                    <RefreshCw size={14} className={cn(isSyncing && "animate-spin")} />
                    <span>{isSyncing ? 'جاري المزامنة...' : 'مزامنة يدوية الآن'}</span>
                  </button>

                  <button
                    onClick={handleFlushQueue}
                    className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold py-2 px-3.5 rounded-xl transition border border-slate-700"
                  >
                    <Trash2 size={14} />
                    <span>تفريغ الطابور محلياً</span>
                  </button>
                </div>
              </div>

              {/* Status Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-[#151b2b] p-4 rounded-xl border border-slate-800">
                  <span className="text-[11px] font-bold text-slate-400 block mb-1">حالة اتصال الشبكة</span>
                  <div className="flex items-center gap-2">
                    {typeof navigator !== 'undefined' && navigator.onLine ? (
                      <span className="text-emerald-400 font-black text-sm flex items-center gap-1">
                        <Wifi size={16} /> متصل بالإنترنت
                      </span>
                    ) : (
                      <span className="text-amber-400 font-black text-sm flex items-center gap-1">
                        <WifiOff size={16} /> غير متصل (أوفلاين)
                      </span>
                    )}
                  </div>
                </div>

                <div className="bg-[#151b2b] p-4 rounded-xl border border-slate-800">
                  <span className="text-[11px] font-bold text-slate-400 block mb-1">حالة المزامنة السحابية</span>
                  <div className="flex items-center gap-2">
                    {cloudSyncEnabled ? (
                      <span className="text-blue-400 font-black text-sm flex items-center gap-1">
                        <Cloud size={16} /> نشطة ومفعلة
                      </span>
                    ) : (
                      <span className="text-amber-400 font-black text-sm flex items-center gap-1">
                        <CloudOff size={16} /> معطلة بطلب المستخدم
                      </span>
                    )}
                  </div>
                </div>

                <div className="bg-[#151b2b] p-4 rounded-xl border border-slate-800">
                  <span className="text-[11px] font-bold text-slate-400 block mb-1">العمليات المعلقة في الطابور</span>
                  <div className="flex items-center gap-2">
                    <span className="text-white font-black text-base">
                      {syncStatus.pendingCount}
                    </span>
                    <span className="text-[10px] text-slate-400">عملية تنتظر الإرسال</span>
                  </div>
                </div>

                <div className="bg-[#151b2b] p-4 rounded-xl border border-slate-800">
                  <span className="text-[11px] font-bold text-slate-400 block mb-1">آخر مزامنة ناجحة</span>
                  <div className="text-slate-300 font-medium text-xs">
                    {syncStatus.lastSyncedAt 
                      ? new Date(syncStatus.lastSyncedAt).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                      : 'لم تتم مزامنة بعد / وضع محلي'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: DATABASE BACKUP, RESET, SCHEDULE & EXCEL EXCHANGE */}
        {activeTab === 'database' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 text-right" dir="rtl">
            {/* Enterprise Backup & Data Hygiene Panel */}
            <BackupManagerPanel />

            {/* Excel Exchange Section */}
            <div className="bg-[#0f172a] rounded-3xl border border-slate-800 p-6 space-y-4 shadow-xl">
              <div className="flex items-center gap-2 text-white font-bold border-b border-slate-800 pb-3">
                <FileSpreadsheet className="text-emerald-400 w-5 h-5" />
                <span className="text-base font-black">تبادل بيانات الأصناف وشيتات المخازن (Excel Data Exchange)</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                قم بتصدير شيت الأصناف والباركود الحالية للعمل عليها وتحديثها، أو قم باستيراد كشوفات الأصناف والمخازن دفعة واحدة لتوفير الوقت والجهد.
              </p>
              <div className="flex flex-wrap gap-3 pt-2">
                <button
                  onClick={handleExportProducts}
                  className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2.5 px-4 rounded-xl transition shadow-lg shadow-emerald-600/20 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>تصدير قائمة المنتجات (.xlsx)</span>
                </button>

                <label className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 cursor-pointer font-bold text-xs py-2.5 px-4 rounded-xl transition border border-slate-700">
                  <Upload className="w-4 h-4" />
                  <span>استيراد وتحديث من Excel</span>
                  <input
                    type="file"
                    accept=".xlsx, .xls"
                    ref={fileInputRef}
                    onChange={handleExcelImportSelect}
                    className="hidden"
                  />
                </label>
              </div>
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-[11px] text-emerald-400 leading-relaxed flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                <span>يدعم النظام مطابقة الكود الفريد (SKU) تلقائياً لتحديث الأسعار والكميات القائمة في النظام دون تكرار.</span>
              </div>
            </div>

            {/* Excel Preview Panel */}
            {importedProducts.length > 0 && (
              <div className="bg-[#0f172a] rounded-2xl border border-slate-800 p-6 space-y-4 mt-6 animate-in fade-in zoom-in-95">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div>
                    <h4 className="text-white font-bold text-sm">معاينة قائمة الأصناف المستخرجة من شيت الإكسيل</h4>
                    <p className="text-[11px] text-slate-400 mt-1">يرجى مراجعة الأصناف أدناه والتحقق منها قبل اعتماد دمجها في مخزن MARO.</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleConfirmExcelImport}
                      className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2 px-3.5 rounded-xl transition"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>اعتماد ودمج البيانات ({importedProducts.length} صنف)</span>
                    </button>
                    <button
                      onClick={() => setImportedProducts([])}
                      className="flex items-center gap-1.5 bg-rose-600/20 hover:bg-rose-600 text-rose-400 hover:text-white text-xs font-bold py-2 px-3.5 rounded-xl transition border border-rose-500/20"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>إلغاء</span>
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto max-h-80 border border-slate-800/80 rounded-xl">
                  <table className="w-full text-right text-xs">
                    <thead>
                      <tr className="bg-[#151b2b] text-slate-300 font-bold border-b border-slate-800/80">
                        <th className="p-3">رمز SKU</th>
                        <th className="p-3">الاسم والوصف</th>
                        <th className="p-3 text-center">الباركود</th>
                        <th className="p-3 text-center">سعر البيع</th>
                        <th className="p-3 text-center">سعر التكلفة</th>
                        <th className="p-3 text-center">المخزون الحالي</th>
                        <th className="p-3">القسم</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-slate-300">
                      {importedProducts.slice(0, 15).map((prod, idx) => (
                        <tr key={idx} className="hover:bg-slate-800/20 transition">
                          <td className="p-3 font-mono text-indigo-400">{prod.sku}</td>
                          <td className="p-3 font-bold text-white">{prod.name}</td>
                          <td className="p-3 text-center font-mono text-slate-400">{prod.barcodes[0] || '-'}</td>
                          <td className="p-3 text-center font-bold text-emerald-400">{prod.price} EGP</td>
                          <td className="p-3 text-center text-slate-400">{prod.costPrice} EGP</td>
                          <td className="p-3 text-center font-bold text-blue-400">{prod.quantity} {prod.unit}</td>
                          <td className="p-3 text-slate-400">{prod.category}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {importedProducts.length > 15 && (
                    <div className="p-3 text-center text-[11px] text-slate-500 bg-[#151b2b]/50 border-t border-slate-800">
                      تم عرض أول 15 صنفًا فقط للمعاينة من إجمالي {importedProducts.length} صنفًا مستوردًا.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 6: DEVELOPER & DATA SEEDING */}
        {activeTab === 'developer' && (
          <DataSeeder />
        )}
      </div>
    </div>
  );
};
