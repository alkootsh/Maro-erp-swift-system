import React, { useEffect, useState } from 'react';
import { Save, Settings, FileText, Hash, Layout, User, Warehouse, Building } from 'lucide-react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { cn } from '../lib/utils';

interface InvoiceSettingsData {
  prefix: string;
  suffix: string;
  startNumber: number;
  currentNumber: number;
  template: 'standard' | 'compact' | 'modern';
  showLogo: boolean;
  showTax: boolean;
  taxRate: number;
  terms: string;
  footer: string;
  sequenceType: 'global' | 'per-user' | 'per-branch';
}

export const InvoiceSettings: React.FC = () => {
  const [settings, setSettings] = useState<InvoiceSettingsData>({
    prefix: 'INV',
    suffix: '',
    startNumber: 1001,
    currentNumber: 1001,
    template: 'standard',
    showLogo: true,
    showTax: true,
    taxRate: 15,
    terms: 'شكراً لتعاملكم معنا. الدفع خلال 15 يوماً.',
    footer: 'هذه فاتورة إلكترونية لا تحتاج لختم.',
    sequenceType: 'global'
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, 'settings', 'invoices'), (doc) => {
      if (doc.exists()) {
        setSettings(doc.data() as InvoiceSettingsData);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await setDoc(doc(db, 'settings', 'invoices'), settings);
      alert('تم حفظ الإعدادات بنجاح');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'settings/invoices');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-500">جاري التحميل...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-600/10 text-blue-500 rounded-2xl flex items-center justify-center">
            <Settings size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-black text-white tracking-tight">إعدادات الفواتير</h2>
            <p className="text-slate-500 font-bold text-sm">تخصيص تنسيق وتسلسل الفواتير</p>
          </div>
        </div>
        <button 
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-8 py-3 bg-blue-600 text-white rounded-2xl hover:bg-blue-500 transition-all font-bold shadow-lg shadow-blue-600/20 active:scale-95 disabled:opacity-50"
        >
          <Save size={20} />
          <span>{saving ? 'جاري الحفظ...' : 'حفظ الإعدادات'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Sequence Settings */}
        <div className="bg-[#151b2b] rounded-3xl border border-[#1e293b] p-8 space-y-6">
          <h3 className="text-lg font-black text-white flex items-center gap-2">
            <Hash size={20} className="text-blue-500" />
            تسلسل الفواتير
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">نوع التسلسل</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'global', label: 'عام', icon: Layout },
                  { id: 'per-user', label: 'حسب المستخدم', icon: User },
                  { id: 'per-branch', label: 'حسب الفرع', icon: Building }
                ].map(type => (
                  <button 
                    key={type.id}
                    onClick={() => setSettings({ ...settings, sequenceType: type.id as any })}
                    className={cn(
                      "flex flex-col items-center gap-2 p-3 rounded-xl border transition-all",
                      settings.sequenceType === type.id ? "bg-blue-600/10 border-blue-500 text-blue-400" : "bg-[#0b0f1a] border-[#1e293b] text-slate-500 hover:border-slate-700"
                    )}
                  >
                    <type.icon size={18} />
                    <span className="text-[10px] font-bold">{type.label}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">البادئة (Prefix)</label>
                <input 
                  type="text" 
                  className="w-full px-4 py-3 bg-[#0b0f1a] border border-[#1e293b] rounded-2xl text-white outline-none focus:border-blue-500 transition-all"
                  value={settings.prefix}
                  onChange={(e) => setSettings({ ...settings, prefix: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">اللاحقة (Suffix)</label>
                <input 
                  type="text" 
                  className="w-full px-4 py-3 bg-[#0b0f1a] border border-[#1e293b] rounded-2xl text-white outline-none focus:border-blue-500 transition-all"
                  value={settings.suffix}
                  onChange={(e) => setSettings({ ...settings, suffix: e.target.value })}
                />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">رقم البداية</label>
              <input 
                type="number" 
                className="w-full px-4 py-3 bg-[#0b0f1a] border border-[#1e293b] rounded-2xl text-white outline-none focus:border-blue-500 transition-all"
                value={settings.startNumber}
                onChange={(e) => setSettings({ ...settings, startNumber: parseInt(e.target.value) || 0 })}
              />
            </div>
          </div>
        </div>

        {/* Template Settings */}
        <div className="bg-[#151b2b] rounded-3xl border border-[#1e293b] p-8 space-y-6">
          <h3 className="text-lg font-black text-white flex items-center gap-2">
            <Layout size={20} className="text-emerald-500" />
            تنسيق الفاتورة
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">القالب</label>
              <select 
                className="w-full px-4 py-3 bg-[#0b0f1a] border border-[#1e293b] rounded-2xl text-white outline-none focus:border-blue-500 transition-all appearance-none"
                value={settings.template}
                onChange={(e) => setSettings({ ...settings, template: e.target.value as any })}
              >
                <option value="standard">قياسي (Standard)</option>
                <option value="compact">مختصر (Compact)</option>
                <option value="modern">عصري (Modern)</option>
              </select>
            </div>
            <div className="flex items-center justify-between p-4 bg-[#0b0f1a] rounded-2xl border border-[#1e293b]">
              <span className="text-sm font-bold text-slate-300">إظهار الشعار</span>
              <input 
                type="checkbox" 
                checked={settings.showLogo}
                onChange={(e) => setSettings({ ...settings, showLogo: e.target.checked })}
                className="w-5 h-5 rounded border-slate-700 bg-slate-800 text-blue-600"
              />
            </div>
            <div className="flex items-center justify-between p-4 bg-[#0b0f1a] rounded-2xl border border-[#1e293b]">
              <span className="text-sm font-bold text-slate-300">تفعيل الضريبة</span>
              <div className="flex items-center gap-3">
                {settings.showTax && (
                  <input 
                    type="number" 
                    className="w-16 bg-slate-800 border border-slate-700 rounded text-center text-xs text-white py-1"
                    value={settings.taxRate}
                    onChange={(e) => setSettings({ ...settings, taxRate: parseInt(e.target.value) || 0 })}
                  />
                )}
                <input 
                  type="checkbox" 
                  checked={settings.showTax}
                  onChange={(e) => setSettings({ ...settings, showTax: e.target.checked })}
                  className="w-5 h-5 rounded border-slate-700 bg-slate-800 text-blue-600"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Content Settings */}
        <div className="col-span-1 md:col-span-2 bg-[#151b2b] rounded-3xl border border-[#1e293b] p-8 space-y-6">
          <h3 className="text-lg font-black text-white flex items-center gap-2">
            <FileText size={20} className="text-amber-500" />
            نصوص الفاتورة
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">الشروط والأحكام</label>
              <textarea 
                rows={4}
                className="w-full px-4 py-3 bg-[#0b0f1a] border border-[#1e293b] rounded-2xl text-white outline-none focus:border-blue-500 transition-all resize-none"
                value={settings.terms}
                onChange={(e) => setSettings({ ...settings, terms: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">تذييل الفاتورة</label>
              <textarea 
                rows={4}
                className="w-full px-4 py-3 bg-[#0b0f1a] border border-[#1e293b] rounded-2xl text-white outline-none focus:border-blue-500 transition-all resize-none"
                value={settings.footer}
                onChange={(e) => setSettings({ ...settings, footer: e.target.value })}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
