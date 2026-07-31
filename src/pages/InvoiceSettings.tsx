import React, { useEffect, useState } from 'react';
import { Save, Settings, FileText, Hash, Layout, User, Warehouse, Building } from 'lucide-react';
import { MaroSyncEngine } from '../lib/maroSyncEngine';
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
    const unsub = MaroSyncEngine.subscribe('settings_invoices', (items: any[]) => {
      const found = items.find((i: any) => i.id === 'invoices');
      if (found) setSettings(found);
      setLoading(false);
    });
    const local = MaroSyncEngine.getLocalDocument('settings_invoices', 'invoices');
    if (local) setSettings(local);
    setLoading(false);
    return () => unsub();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await MaroSyncEngine.saveDocument('settings_invoices', { id: 'invoices', ...settings }, false);
      alert('تم حفظ الإعدادات بنجاح');
    } catch (error) {
      console.error('Save failed:', error);
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
                    type="button"
                    onClick={() => setSettings({ ...settings, sequenceType: type.id as any })}
                    className={cn(
                      "p-4 rounded-2xl border font-bold text-xs flex flex-col items-center gap-2 transition-all",
                      settings.sequenceType === type.id ? "bg-blue-600/10 border-blue-500 text-blue-400" : "bg-[#0b0f1a] border-[#334155] text-slate-400 hover:border-slate-500"
                    )}
                  >
                    <type.icon size={20} />
                    <span>{type.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">بادئة الرقم (Prefix)</label>
                <input 
                  type="text" 
                  value={settings.prefix}
                  onChange={(e) => setSettings({ ...settings, prefix: e.target.value })}
                  className="w-full bg-[#0b0f1a] border border-[#334155] rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-blue-500 font-medium"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">الرقم البدائي</label>
                <input 
                  type="number" 
                  value={settings.startNumber}
                  onChange={(e) => setSettings({ ...settings, startNumber: Number(e.target.value) })}
                  className="w-full bg-[#0b0f1a] border border-[#334155] rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-blue-500 font-medium"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-[#151b2b] rounded-3xl border border-[#1e293b] p-8 space-y-6">
          <h3 className="text-lg font-black text-white flex items-center gap-2">
            <FileText size={20} className="text-emerald-500" />
            الشروط والضرائب
          </h3>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">نسبة الضريبة (%)</label>
                <input 
                  type="number" 
                  value={settings.taxRate}
                  onChange={(e) => setSettings({ ...settings, taxRate: Number(e.target.value) })}
                  className="w-full bg-[#0b0f1a] border border-[#334155] rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-blue-500 font-medium"
                />
              </div>
              <div className="flex items-center pt-6">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input 
                    type="checkbox"
                    checked={settings.showTax}
                    onChange={(e) => setSettings({ ...settings, showTax: e.target.checked })}
                    className="w-5 h-5 rounded border-[#334155] bg-[#0b0f1a] text-blue-600 focus:ring-0"
                  />
                  <span className="text-sm font-bold text-white">إظهار الضريبة بالفاتورة</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">شروط وأحكام الفاتورة</label>
              <textarea 
                rows={3}
                value={settings.terms}
                onChange={(e) => setSettings({ ...settings, terms: e.target.value })}
                className="w-full bg-[#0b0f1a] border border-[#334155] rounded-xl p-4 text-white text-sm focus:outline-none focus:border-blue-500 font-medium resize-none"
              ></textarea>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
