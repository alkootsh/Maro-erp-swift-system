import React, { useState, useEffect } from 'react';
import { 
  User, 
  Building2, 
  Settings as SettingsIcon, 
  Bell, 
  Shield, 
  Database, 
  Save,
  Globe,
  DollarSign,
  Percent,
  AlertTriangle,
  Keyboard
} from 'lucide-react';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { useFirebase } from '../components/FirebaseProvider';
import { cn } from '../lib/utils';
import { POSFunctionKeysManager } from '../components/settings/POSFunctionKeysManager';

export const Settings: React.FC = () => {
  const { user, profile } = useFirebase();
  const [activeTab, setActiveTab] = useState<'profile' | 'company' | 'system' | 'pos_keys' | 'security'>('profile');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const [settings, setSettings] = useState({
    companyName: 'سويفت للتجارة',
    companyAddress: 'الرياض، المملكة العربية السعودية',
    companyPhone: '+966 50 000 0000',
    companyEmail: 'info@swift-erp.com',
    currency: 'SAR',
    taxRate: 15,
    lowStockThreshold: 5,
    language: 'ar',
    notificationsEnabled: true,
  });

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'settings', 'general'), (snap) => {
      if (snap.exists()) {
        setSettings(prev => ({ ...prev, ...snap.data() }));
      }
    });
    return () => unsub();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      await setDoc(doc(db, 'settings', 'general'), settings);
      setMessage({ type: 'success', text: 'تم حفظ الإعدادات بنجاح' });
    } catch (error) {
      console.error(error);
      setMessage({ type: 'error', text: 'حدث خطأ أثناء حفظ الإعدادات' });
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'profile', name: 'الملف الشخصي', icon: User },
    { id: 'company', name: 'بيانات المؤسسة', icon: Building2 },
    { id: 'system', name: 'إعدادات النظام', icon: SettingsIcon },
    { id: 'pos_keys', name: 'مفاتيح وظائف POS', icon: Keyboard },
    { id: 'security', name: 'الأمان والخصوصية', icon: Shield },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black text-white tracking-tight">الإعدادات</h2>
        {message && (
          <div className={cn(
            "px-4 py-2 rounded-xl text-xs font-bold animate-in fade-in slide-in-from-top-2",
            message.type === 'success' ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" : "bg-red-500/10 text-red-500 border border-red-500/20"
          )}>
            {message.text}
          </div>
        )}
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar Tabs */}
        <div className="w-full lg:w-64 space-y-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all font-bold text-sm",
                activeTab === tab.id 
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" 
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
              )}
            >
              <tab.icon size={18} />
              <span>{tab.name}</span>
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="flex-1 bg-[#151b2b] rounded-3xl border border-[#1e293b] shadow-2xl overflow-hidden">
          <form onSubmit={handleSave} className="p-8 space-y-8">
            {activeTab === 'profile' && (
              <div className="space-y-6 animate-in fade-in duration-500">
                <div className="flex items-center gap-6 mb-8">
                  <div className="w-24 h-24 bg-slate-800 rounded-3xl border-2 border-[#1e293b] flex items-center justify-center text-slate-500 relative group">
                    <User size={40} />
                    <button type="button" className="absolute inset-0 bg-black/50 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-bold uppercase">تغيير</button>
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-white">{profile?.displayName || user?.email?.split('@')[0]}</h3>
                    <p className="text-slate-500 text-sm font-medium">{user?.email}</p>
                    <span className="inline-block mt-2 px-3 py-1 bg-blue-600/10 text-blue-500 rounded-lg text-[10px] font-bold uppercase tracking-widest border border-blue-500/20">
                      {profile?.role === 'admin' ? 'مدير النظام' : 'محاسب'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">الاسم الكامل</label>
                    <input type="text" className="w-full px-4 py-3 bg-[#1e293b] border border-[#334155] rounded-2xl text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" defaultValue={profile?.displayName || ''} />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">البريد الإلكتروني</label>
                    <input type="email" disabled className="w-full px-4 py-3 bg-[#0f172a] border border-[#1e293b] rounded-2xl text-slate-500 cursor-not-allowed outline-none" value={user?.email || ''} />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'company' && (
              <div className="space-y-6 animate-in fade-in duration-500">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">اسم المؤسسة / الشركة</label>
                    <input 
                      type="text" 
                      className="w-full px-4 py-3 bg-[#1e293b] border border-[#334155] rounded-2xl text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" 
                      value={settings.companyName}
                      onChange={(e) => setSettings({ ...settings, companyName: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">رقم الهاتف</label>
                    <input 
                      type="text" 
                      className="w-full px-4 py-3 bg-[#1e293b] border border-[#334155] rounded-2xl text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" 
                      value={settings.companyPhone}
                      onChange={(e) => setSettings({ ...settings, companyPhone: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">البريد الإلكتروني للمؤسسة</label>
                    <input 
                      type="email" 
                      className="w-full px-4 py-3 bg-[#1e293b] border border-[#334155] rounded-2xl text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" 
                      value={settings.companyEmail}
                      onChange={(e) => setSettings({ ...settings, companyEmail: e.target.value })}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">العنوان</label>
                    <textarea 
                      rows={3}
                      className="w-full px-4 py-3 bg-[#1e293b] border border-[#334155] rounded-2xl text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none resize-none transition-all" 
                      value={settings.companyAddress}
                      onChange={(e) => setSettings({ ...settings, companyAddress: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'system' && (
              <div className="space-y-6 animate-in fade-in duration-500">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">العملة الافتراضية</label>
                    <div className="relative">
                      <DollarSign className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                      <select 
                        className="w-full px-4 py-3 pr-12 bg-[#1e293b] border border-[#334155] rounded-2xl text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none appearance-none transition-all font-bold"
                        value={settings.currency}
                        onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
                      >
                        <option value="SAR">ريال سعودي (SAR)</option>
                        <option value="USD">دولار أمريكي (USD)</option>
                        <option value="EGP">جنيه مصري (EGP)</option>
                        <option value="AED">درهم إماراتي (AED)</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">نسبة ضريبة القيمة المضافة (%)</label>
                    <div className="relative">
                      <Percent className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                      <input 
                        type="number" 
                        className="w-full px-4 py-3 pr-12 bg-[#1e293b] border border-[#334155] rounded-2xl text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-bold" 
                        value={settings.taxRate}
                        onChange={(e) => setSettings({ ...settings, taxRate: Number(e.target.value) })}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">تنبيه المخزون المنخفض (أقل من)</label>
                    <div className="relative">
                      <AlertTriangle className="absolute right-4 top-1/2 -translate-y-1/2 text-amber-500" size={18} />
                      <input 
                        type="number" 
                        className="w-full px-4 py-3 pr-12 bg-[#1e293b] border border-[#334155] rounded-2xl text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-bold" 
                        value={settings.lowStockThreshold}
                        onChange={(e) => setSettings({ ...settings, lowStockThreshold: Number(e.target.value) })}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">لغة النظام</label>
                    <div className="relative">
                      <Globe className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                      <select 
                        className="w-full px-4 py-3 pr-12 bg-[#1e293b] border border-[#334155] rounded-2xl text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none appearance-none transition-all font-bold"
                        value={settings.language}
                        onChange={(e) => setSettings({ ...settings, language: e.target.value })}
                      >
                        <option value="ar">العربية</option>
                        <option value="en">English</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="space-y-6 animate-in fade-in duration-500">
                <div className="p-6 bg-blue-600/5 border border-blue-600/10 rounded-2xl">
                  <div className="flex items-center gap-4 mb-4">
                    <Shield className="text-blue-500" size={24} />
                    <h4 className="font-bold text-white">تغيير كلمة المرور</h4>
                  </div>
                  <p className="text-xs text-slate-500 mb-6 font-medium">يمكنك طلب رابط إعادة تعيين كلمة المرور عبر بريدك الإلكتروني المسجل.</p>
                  <button type="button" className="px-6 py-3 bg-[#1e293b] text-white rounded-xl font-bold hover:bg-[#334155] transition-all text-xs uppercase tracking-widest">إرسال رابط إعادة التعيين</button>
                </div>

                <div className="p-6 bg-red-600/5 border border-red-600/10 rounded-2xl">
                  <div className="flex items-center gap-4 mb-4">
                    <Database className="text-red-500" size={24} />
                    <h4 className="font-bold text-white">إدارة البيانات</h4>
                  </div>
                  <p className="text-xs text-slate-500 mb-6 font-medium">تحذير: مسح البيانات سيؤدي إلى حذف جميع السجلات بشكل نهائي.</p>
                  <div className="flex gap-4">
                    <button type="button" className="px-6 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-500 transition-all text-xs uppercase tracking-widest">مسح جميع البيانات</button>
                    <button type="button" className="px-6 py-3 bg-[#1e293b] text-slate-300 rounded-xl font-bold hover:bg-[#334155] transition-all text-xs uppercase tracking-widest">تصدير نسخة احتياطية</button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'pos_keys' && (
              <div className="animate-in fade-in duration-300">
                <POSFunctionKeysManager />
              </div>
            )}

            {activeTab !== 'pos_keys' && (
              <div className="pt-8 border-t border-[#1e293b] flex justify-end">
                <button 
                  type="submit" 
                  disabled={loading}
                  className="flex items-center gap-2 px-8 py-4 bg-blue-600 text-white rounded-2xl font-black hover:bg-blue-500 transition-all shadow-lg shadow-blue-600/20 active:scale-95 disabled:opacity-50 uppercase tracking-widest"
                >
                  <Save size={20} />
                  <span>{loading ? 'جاري الحفظ...' : 'حفظ التغييرات'}</span>
                </button>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};
