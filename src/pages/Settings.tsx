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
import { useAuth } from '../components/AuthProvider';
import { MaroSyncEngine } from '../lib/maroSyncEngine';
import { cn } from '../lib/utils';
import { POSFunctionKeysManager } from '../components/settings/POSFunctionKeysManager';

export const Settings: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'company' | 'system' | 'pos_keys' | 'security'>('profile');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const [settings, setSettings] = useState({
    companyName: 'MARO Business Platform',
    companyAddress: 'الرياض، المملكة العربية السعودية',
    companyPhone: '+966 50 000 0000',
    companyEmail: 'info@maro-erp.local',
    currency: 'SAR',
    taxRate: 15,
    lowStockThreshold: 5,
    language: 'ar',
    notificationsEnabled: true,
  });

  useEffect(() => {
    const unsub = MaroSyncEngine.subscribe('settings_general', (items: any[]) => {
      const found = items.find((i: any) => i.id === 'general');
      if (found) setSettings(prev => ({ ...prev, ...found }));
    });
    const local = MaroSyncEngine.getLocalDocument('settings_general', 'general');
    if (local) setSettings(prev => ({ ...prev, ...local }));
    return () => unsub();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      await MaroSyncEngine.saveDocument('settings_general', { id: 'general', ...settings }, false);
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
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight">إعدادات النظام</h2>
          <p className="text-slate-500 font-bold text-sm">إدارة تفضيلات النظام والشركات والصلاحيات</p>
        </div>
        {message && (
          <div className={cn(
            "px-4 py-2 rounded-xl text-xs font-bold animate-in fade-in slide-in-from-top-2",
            message.type === 'success' ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" : "bg-red-500/10 text-red-500 border border-red-500/20"
          )}>
            {message.text}
          </div>
        )}
      </div>

      <div className="flex gap-4 border-b border-[#1e293b] pb-4">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={cn(
              "flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-xs uppercase tracking-wider transition-all",
              activeTab === tab.id ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" : "text-slate-400 hover:bg-[#151b2b] hover:text-white"
            )}
          >
            <tab.icon size={16} />
            <span>{tab.name}</span>
          </button>
        ))}
      </div>

      <div className="bg-[#151b2b] rounded-3xl border border-[#1e293b] p-8 shadow-2xl">
        {activeTab === 'profile' && (
          <div className="space-y-6">
            <h3 className="text-lg font-black text-white">معلومات المستخدم الحالي</h3>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">الاسم</label>
                <input type="text" readOnly value={user?.displayName || 'مدير النظام'} className="w-full bg-[#0b0f1a] border border-[#334155] rounded-xl px-4 py-3 text-white text-sm font-medium" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">البريد الإلكتروني</label>
                <input type="text" readOnly value={user?.email || 'admin@maro-erp.local'} className="w-full bg-[#0b0f1a] border border-[#334155] rounded-xl px-4 py-3 text-white text-sm font-medium" />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'company' && (
          <form onSubmit={handleSave} className="space-y-6">
            <h3 className="text-lg font-black text-white">بيانات الشركة المؤسسية</h3>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">اسم الشركة</label>
                <input 
                  type="text" 
                  value={settings.companyName} 
                  onChange={(e) => setSettings({ ...settings, companyName: e.target.value })} 
                  className="w-full bg-[#0b0f1a] border border-[#334155] rounded-xl px-4 py-3 text-white text-sm font-medium" 
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">الهاتف</label>
                <input 
                  type="text" 
                  value={settings.companyPhone} 
                  onChange={(e) => setSettings({ ...settings, companyPhone: e.target.value })} 
                  className="w-full bg-[#0b0f1a] border border-[#334155] rounded-xl px-4 py-3 text-white text-sm font-medium" 
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">البريد الإلكتروني للشركة</label>
                <input 
                  type="text" 
                  value={settings.companyEmail} 
                  onChange={(e) => setSettings({ ...settings, companyEmail: e.target.value })} 
                  className="w-full bg-[#0b0f1a] border border-[#334155] rounded-xl px-4 py-3 text-white text-sm font-medium" 
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">العنوان</label>
                <input 
                  type="text" 
                  value={settings.companyAddress} 
                  onChange={(e) => setSettings({ ...settings, companyAddress: e.target.value })} 
                  className="w-full bg-[#0b0f1a] border border-[#334155] rounded-xl px-4 py-3 text-white text-sm font-medium" 
                />
              </div>
            </div>
            <div className="flex justify-end pt-4 border-t border-[#1e293b]">
              <button type="submit" disabled={loading} className="flex items-center gap-2 px-8 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-500 transition-all text-xs">
                <Save size={16} />
                <span>حفظ التغييرات</span>
              </button>
            </div>
          </form>
        )}

        {activeTab === 'system' && (
          <form onSubmit={handleSave} className="space-y-6">
            <h3 className="text-lg font-black text-white">إعدادات النظام والمحاسبة</h3>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">العملة الافتراضية</label>
                <input 
                  type="text" 
                  value={settings.currency} 
                  onChange={(e) => setSettings({ ...settings, currency: e.target.value })} 
                  className="w-full bg-[#0b0f1a] border border-[#334155] rounded-xl px-4 py-3 text-white text-sm font-medium" 
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">نسبة ضريبة القيمة المضافة (%)</label>
                <input 
                  type="number" 
                  value={settings.taxRate} 
                  onChange={(e) => setSettings({ ...settings, taxRate: Number(e.target.value) })} 
                  className="w-full bg-[#0b0f1a] border border-[#334155] rounded-xl px-4 py-3 text-white text-sm font-medium" 
                />
              </div>
            </div>
            <div className="flex justify-end pt-4 border-t border-[#1e293b]">
              <button type="submit" disabled={loading} className="flex items-center gap-2 px-8 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-500 transition-all text-xs">
                <Save size={16} />
                <span>حفظ التغييرات</span>
              </button>
            </div>
          </form>
        )}

        {activeTab === 'pos_keys' && (
          <POSFunctionKeysManager />
        )}

        {activeTab === 'security' && (
          <div className="space-y-6">
            <h3 className="text-lg font-black text-white">إعدادات الأمان والصلاحيات</h3>
            <p className="text-slate-400 text-sm">يتم تطبيق سياسات الأمان وقواعد RBAC المشددة تلقائياً عبر محرك MARO Security Engine.</p>
          </div>
        )}
      </div>
    </div>
  );
};
