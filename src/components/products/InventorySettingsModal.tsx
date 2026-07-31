// MARO ERP - Inventory Settings Modal Component
import React, { useState, useEffect } from 'react';
import { X, Settings2, Save, ShieldAlert, Percent, Clock, AlertTriangle } from 'lucide-react';
import { ProductRepository } from '../../repositories/productRepository';
import { ProductService } from '../../services/productService';
import { InventorySettings } from '../../types/productMaster';
import { toast } from 'react-hot-toast';

interface InventorySettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InventorySettingsModal: React.FC<InventorySettingsModalProps> = ({ isOpen, onClose }) => {
  const [settings, setSettings] = useState<InventorySettings>({
    defaultValuationMethod: 'FIFO',
    allowNegativeStock: false,
    defaultTaxRate: 14,
    defaultReorderLevel: 5,
    enforceBatchTracking: false,
    enforceExpiryTracking: false,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      ProductRepository.getInventorySettings().then(setSettings).catch(console.error);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await ProductService.updateInventorySettings(settings);
      toast.success('تم حفظ إعدادات المخزون بنجاح');
      onClose();
    } catch (err: any) {
      toast.error('فشل حفظ الإعدادات: ' + (err.message || 'خطأ في البيانات'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#151b2b] border border-[#1e293b] w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#1e293b] bg-[#0b0f17]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500/10 text-blue-400 rounded-xl flex items-center justify-center">
              <Settings2 size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">إعدادات المخزون وسياسات التقويم (Inventory Settings)</h3>
              <p className="text-xs text-slate-400">تكوين السياسات المخزنية العامة وحظر البيع بالسالب والضريبة</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-[#1e293b]">
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* Inventory Valuation Method */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-white block">طريقة تقييم المخزون (Inventory Valuation Method)</label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { id: 'FIFO', label: 'الوارد أولاً يخرج أولاً (FIFO)', desc: 'الأنسب للمنتجات القابلة للتلف' },
                { id: 'LIFO', label: 'الوارد أخيراً يخرج أولاً (LIFO)', desc: 'تقييم حسب أسعار التكلفة الأخيرة' },
                { id: 'WEIGHTED_AVG', label: 'المتوسط المرجّح (Weighted Avg)', desc: 'تعديل التكلفة مع كل شحنة' }
              ].map((m) => (
                <button
                  type="button"
                  key={m.id}
                  onClick={() => setSettings({ ...settings, defaultValuationMethod: m.id as any })}
                  className={`p-3 rounded-xl border text-right transition-all flex flex-col justify-between ${
                    settings.defaultValuationMethod === m.id
                      ? 'bg-blue-600/20 border-blue-500 text-white'
                      : 'bg-[#0b0f17] border-[#1e293b] text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <span className="text-xs font-bold">{m.label}</span>
                  <span className="text-[10px] text-slate-500 mt-2">{m.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Rules & Policy Toggles */}
          <div className="space-y-4 bg-[#0b0f17] p-4 rounded-xl border border-[#1e293b]">
            <h4 className="text-xs font-bold text-slate-300 uppercase">قواعد الضبط والحظر</h4>
            
            {/* Allow Negative Stock */}
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm font-bold text-white block">السماح بالسحب على المكشوف (Negative Stock)</span>
                <span className="text-xs text-slate-400">السماح بإصدار فواتير بيع حتى وإن كان المخزون المتاح صفر</span>
              </div>
              <input
                type="checkbox"
                checked={settings.allowNegativeStock}
                onChange={(e) => setSettings({ ...settings, allowNegativeStock: e.target.checked })}
                className="w-5 h-5 accent-blue-600 rounded cursor-pointer"
              />
            </div>

            {/* Enforce Batch Tracking */}
            <div className="flex items-center justify-between pt-3 border-t border-[#1e293b]">
              <div>
                <span className="text-sm font-bold text-white block">تتبع الوجبات/التشغيلات (Batch Tracking)</span>
                <span className="text-xs text-slate-400">إلزام إدخال أرقام الوجبات لكل حركة مخزنية</span>
              </div>
              <input
                type="checkbox"
                checked={settings.enforceBatchTracking}
                onChange={(e) => setSettings({ ...settings, enforceBatchTracking: e.target.checked })}
                className="w-5 h-5 accent-blue-600 rounded cursor-pointer"
              />
            </div>

            {/* Enforce Expiry Tracking */}
            <div className="flex items-center justify-between pt-3 border-t border-[#1e293b]">
              <div>
                <span className="text-sm font-bold text-white block">تتبع تواريخ الصلاحية (Expiry Tracking)</span>
                <span className="text-xs text-slate-400">تنبيه وإلزام تاريخ الانتهاء للمنتجات الغذائية والطبية</span>
              </div>
              <input
                type="checkbox"
                checked={settings.enforceExpiryTracking}
                onChange={(e) => setSettings({ ...settings, enforceExpiryTracking: e.target.checked })}
                className="w-5 h-5 accent-blue-600 rounded cursor-pointer"
              />
            </div>
          </div>

          {/* Numeric Defaults */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-slate-400 block mb-1">نسبة ضريبة القيمة المضافة الافتراضية (%)</label>
              <input
                type="number"
                value={settings.defaultTaxRate}
                onChange={(e) => setSettings({ ...settings, defaultTaxRate: Number(e.target.value) })}
                className="w-full bg-[#0b0f17] border border-[#1e293b] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-400 block mb-1">حد إعادة الطلب الافتراضي (قطع)</label>
              <input
                type="number"
                value={settings.defaultReorderLevel}
                onChange={(e) => setSettings({ ...settings, defaultReorderLevel: Number(e.target.value) })}
                className="w-full bg-[#0b0f17] border border-[#1e293b] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-[#1e293b]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-bold"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-bold flex items-center gap-2 transition-colors disabled:opacity-50"
            >
              <Save size={16} /> {saving ? 'جاري الحفظ...' : 'حفظ الإعدادات'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
