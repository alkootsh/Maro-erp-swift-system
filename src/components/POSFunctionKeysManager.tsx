import React, { useState, useEffect } from 'react';
import { 
  Keyboard, 
  Save, 
  RotateCcw, 
  Plus, 
  Check, 
  Sparkles, 
  Settings2, 
  Info, 
  X, 
  Layers, 
  ShieldCheck,
  Palette
} from 'lucide-react';
import { 
  POSFunctionKeyRegistry, 
  POSKeyMapping, 
  POSActionDefinition, 
  POSActionCategory 
} from '../lib/posFunctionKeyRegistry';
import { cn } from '../lib/utils';

const COLOR_OPTIONS = [
  { label: 'أخضر Emerald', value: 'bg-emerald-600' },
  { label: 'أخضر زاهي Green', value: 'bg-emerald-500' },
  { label: 'أزرق Blue', value: 'bg-blue-600' },
  { label: 'أزرق فاتح Sky', value: 'bg-sky-600' },
  { label: 'بنفسجي Purple', value: 'bg-purple-600' },
  { label: 'بنفسجي داكن Violet', value: 'bg-violet-600' },
  { label: 'برتقالي Amber', value: 'bg-amber-600' },
  { label: 'برتقالي داكن Orange', value: 'bg-orange-600' },
  { label: 'أحمر Red', value: 'bg-red-600' },
  { label: 'وردي Pink', value: 'bg-pink-600' },
  { label: 'رمادي Slate', value: 'bg-slate-700' },
  { label: 'سماوي Cyan', value: 'bg-cyan-700' },
  { label: 'تيال Teal', value: 'bg-teal-600' },
];

export const POSFunctionKeysManager: React.FC = () => {
  const [mappings, setMappings] = useState<POSKeyMapping[]>([]);
  const [actionGroups, setActionGroups] = useState<{ category: POSActionCategory; categoryName: string; actions: POSActionDefinition[] }[]>([]);
  const [allActions, setAllActions] = useState<POSActionDefinition[]>([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // New Plugin Action Modal State
  const [isPluginModalOpen, setIsPluginModalOpen] = useState(false);
  const [pluginId, setPluginId] = useState('');
  const [pluginName, setPluginName] = useState('');
  const [pluginNameEn, setPluginNameEn] = useState('');
  const [pluginCategory, setPluginCategory] = useState<POSActionCategory>('plugins');
  const [pluginDescription, setPluginDescription] = useState('');
  const [pluginVendor, setPluginVendor] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const currentMappings = POSFunctionKeyRegistry.getKeyMappings();
    setMappings(currentMappings);
    const groups = POSFunctionKeyRegistry.getActionsByCategory();
    setActionGroups(groups);
    setAllActions(POSFunctionKeyRegistry.getAllActions());
  };

  const handleActionChange = (keyCode: string, actionId: string) => {
    const actionDef = POSFunctionKeyRegistry.getActionById(actionId);
    setMappings(prev => prev.map(m => {
      if (m.key === keyCode) {
        return {
          ...m,
          actionId,
          customLabel: actionDef ? actionDef.name : m.customLabel,
          color: actionDef?.defaultColor || m.color || 'bg-blue-600'
        };
      }
      return m;
    }));
  };

  const handleLabelChange = (keyCode: string, customLabel: string) => {
    setMappings(prev => prev.map(m => m.key === keyCode ? { ...m, customLabel } : m));
  };

  const handleColorChange = (keyCode: string, color: string) => {
    setMappings(prev => prev.map(m => m.key === keyCode ? { ...m, color } : m));
  };

  const handleSave = () => {
    setSaving(true);
    try {
      POSFunctionKeyRegistry.saveKeyMappings(mappings);
      setMessage({ type: 'success', text: 'تم حفظ تخصيصات أزرار وظائف POS بنجاح وتحديث محطات البيع' });
      setTimeout(() => setMessage(null), 4000);
    } catch (e: any) {
      setMessage({ type: 'error', text: 'حدث خطأ أثناء حفظ التخصيصات: ' + (e.message || '') });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (window.confirm('هل أنت تأكد من إعادة تعيين جميع أزرار F1-F12 إلى الإعدادات الافتراضية للشركة؟')) {
      const defs = POSFunctionKeyRegistry.resetToDefaults();
      setMappings(defs);
      setMessage({ type: 'success', text: 'تمت إعادة تعيين أزرار الوظائف إلى الإعدادات الافتراضية' });
      setTimeout(() => setMessage(null), 4000);
    }
  };

  const handleRegisterPluginAction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pluginId || !pluginName) {
      alert('يرجى ملء معرف الإجراء والاسم');
      return;
    }

    const cleanId = pluginId.trim().toUpperCase().replace(/[^A-Z0-9_]/g, '_');
    const fullId = cleanId.startsWith('PLUGIN_') ? cleanId : `PLUGIN_${cleanId}`;

    POSFunctionKeyRegistry.registerPluginAction({
      id: fullId,
      name: pluginName,
      nameEn: pluginNameEn || pluginName,
      category: pluginCategory,
      categoryName: POSFunctionKeyRegistry.getCategoryName(pluginCategory),
      description: pluginDescription || 'إجراء ملحق مخصص تمت إضافته ديناميكياً',
      pluginName: pluginVendor || 'مطور خارجي / Plugin Event Registry',
      defaultColor: 'bg-violet-600'
    });

    loadData();
    setIsPluginModalOpen(false);
    setPluginId('');
    setPluginName('');
    setPluginNameEn('');
    setPluginDescription('');
    setPluginVendor('');
    setMessage({ type: 'success', text: `تم تسجيل إجراء الملحق الجديد (${pluginName}) بنجاح في السجل الديناميكي` });
    setTimeout(() => setMessage(null), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#151b2b] via-[#1e293b] to-[#0f172a] border border-[#1e293b] p-6 rounded-3xl shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-600/20 text-blue-400 rounded-2xl border border-blue-500/20">
            <Keyboard size={28} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-black text-white">تخصيص أزرار وظائف POS (F1 - F12)</h3>
              <span className="px-2.5 py-0.5 bg-blue-500/20 text-blue-400 text-[10px] font-bold rounded-full border border-blue-500/30">
                Sprint 8.1 Customizer
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              إدارة وتعيين أزرار الاختصار للشاشات والعمليات وتكامل الملحقات الديناميكية (Plugin Action Registry)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <button
            onClick={() => setIsPluginModalOpen(true)}
            className="flex-1 md:flex-initial px-4 py-2.5 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-all"
          >
            <Sparkles size={16} />
            <span>تسجيل إجراء ملحق (Plugin Action)</span>
          </button>
          <button
            onClick={handleReset}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 border border-slate-700 transition-all"
            title="إعادة للوضع الافتراضي"
          >
            <RotateCcw size={16} />
            <span>افتراضي</span>
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 md:flex-initial px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 transition-all disabled:opacity-50"
          >
            <Save size={16} />
            <span>{saving ? 'جاري الحفظ...' : 'حفظ التغييرات'}</span>
          </button>
        </div>
      </div>

      {message && (
        <div className={cn(
          "p-4 rounded-2xl text-xs font-bold border flex items-center justify-between animate-in fade-in slide-in-from-top-2",
          message.type === 'success' ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-red-500/10 text-red-400 border-red-500/20"
        )}>
          <div className="flex items-center gap-2">
            <Check size={18} />
            <span>{message.text}</span>
          </div>
          <button onClick={() => setMessage(null)} className="opacity-70 hover:opacity-100"><X size={16} /></button>
        </div>
      )}

      {/* Live Preview Bar */}
      <div className="bg-[#151b2b] border border-[#1e293b] p-5 rounded-3xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
            <Settings2 size={16} className="text-blue-400" />
            <span>معاينة شريط أزرار الوظائف الحقيقي في شاشة POS (Live Preview)</span>
          </div>
          <span className="text-[10px] text-slate-500 font-mono">12 Function Keys Ready</span>
        </div>

        <div className="bg-[#0f172a] p-3 rounded-2xl border border-[#1e293b] flex gap-2 overflow-x-auto no-scrollbar">
          {mappings.map(m => {
            const action = allActions.find(a => a.id === m.actionId);
            return (
              <div 
                key={m.key} 
                className={cn(
                  "flex-shrink-0 px-3.5 py-2 rounded-xl flex items-center gap-2 text-white font-bold text-xs shadow-md border border-white/10 transition-transform hover:scale-105 cursor-pointer",
                  m.color || action?.defaultColor || 'bg-blue-600'
                )}
              >
                <span className="font-mono bg-black/40 px-1.5 py-0.5 rounded text-[10px] text-amber-300 font-black">{m.key}</span>
                <span className="whitespace-nowrap">{m.customLabel || action?.name || 'غير معيّن'}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Grid of Key Configurations F1 to F12 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {mappings.map((mapping) => {
          const activeAction = allActions.find(a => a.id === mapping.actionId);

          return (
            <div 
              key={mapping.key}
              className="bg-[#151b2b] border border-[#1e293b] hover:border-slate-700 transition-all rounded-3xl p-5 space-y-4 shadow-lg group relative overflow-hidden"
            >
              {/* Header Badge */}
              <div className="flex items-center justify-between border-b border-[#1e293b] pb-3">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-10 h-10 rounded-2xl flex items-center justify-center font-mono font-black text-white text-base shadow-lg",
                    mapping.color || 'bg-blue-600'
                  )}>
                    {mapping.key}
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-sm">مفتاح {mapping.key}</h4>
                    <span className="text-[10px] text-slate-400 block font-mono">
                      {activeAction ? `${activeAction.categoryName}` : 'لم يتم اختيار إجراء'}
                    </span>
                  </div>
                </div>

                {activeAction?.isPlugin && (
                  <span className="px-2 py-0.5 bg-purple-500/20 text-purple-300 text-[10px] font-bold rounded-lg border border-purple-500/30 flex items-center gap-1">
                    <Sparkles size={10} />
                    Plugin
                  </span>
                )}
              </div>

              {/* Action Selector */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-400 uppercase">
                  الإجراء المرتبط (POS Action)
                </label>
                <select
                  value={mapping.actionId}
                  onChange={(e) => handleActionChange(mapping.key, e.target.value)}
                  className="w-full bg-[#1e293b] border border-[#334155] rounded-xl px-3 py-2.5 text-white text-xs font-bold focus:outline-none focus:border-blue-500"
                >
                  <option value="">-- اختر إجراء لنقطة البيع --</option>
                  {actionGroups.map((group) => (
                    <optgroup key={group.category} label={`── ${group.categoryName} ──`}>
                      {group.actions.map((act) => (
                        <option key={act.id} value={act.id}>
                          {act.name} ({act.nameEn}) {act.isPlugin ? '🧩 [Plugin]' : ''}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>

              {/* Custom Label Override */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-400 uppercase">
                  اسم الزر الظاهر بالنافذة (Custom Label)
                </label>
                <input
                  type="text"
                  value={mapping.customLabel || ''}
                  placeholder={activeAction?.name || 'اسم الزر...'}
                  onChange={(e) => handleLabelChange(mapping.key, e.target.value)}
                  className="w-full bg-[#1e293b] border border-[#334155] rounded-xl px-3 py-2 text-white text-xs font-bold focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Color Theme Selector */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-400 uppercase flex items-center gap-1">
                  <Palette size={12} className="text-amber-400" />
                  <span>لون الزر (Color Theme)</span>
                </label>
                <select
                  value={mapping.color || 'bg-blue-600'}
                  onChange={(e) => handleColorChange(mapping.key, e.target.value)}
                  className="w-full bg-[#1e293b] border border-[#334155] rounded-xl px-3 py-2 text-white text-xs font-bold focus:outline-none focus:border-blue-500"
                >
                  {COLOR_OPTIONS.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>

              {/* Action Description Footer */}
              {activeAction && (
                <div className="bg-[#0f172a] p-2.5 rounded-xl border border-[#1e293b] text-[11px] text-slate-400 space-y-0.5">
                  <div className="font-bold text-slate-300">{activeAction.name}</div>
                  <div className="text-[10px] text-slate-500 line-clamp-2">{activeAction.description}</div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Dynamic Plugin Creator Modal */}
      {isPluginModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#151b2b] w-full max-w-lg rounded-3xl border border-[#1e293b] shadow-2xl p-6 space-y-5 animate-in zoom-in-95">
            <div className="flex justify-between items-center border-b border-[#1e293b] pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-purple-600/20 text-purple-400 rounded-xl">
                  <Sparkles size={20} />
                </div>
                <h3 className="font-black text-lg text-white">تسجيل إجراء ملحق جديد (Plugin Registry)</h3>
              </div>
              <button onClick={() => setIsPluginModalOpen(false)} className="text-slate-500 hover:text-white">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleRegisterPluginAction} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">معرف الإجراء (Action ID)</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. LOYALTY_REDEMPTION, DELIVERY_PARCEL"
                  value={pluginId}
                  onChange={(e) => setPluginId(e.target.value)}
                  className="w-full bg-[#1e293b] border border-[#334155] rounded-xl px-4 py-2.5 text-white font-mono text-sm uppercase focus:outline-none focus:border-purple-500"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">سيتم تسجيل الإجراء تلقائياً تحت بادئة PLUGIN_</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">الاسم بالعربية</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: خصم كارت الهدايا"
                    value={pluginName}
                    onChange={(e) => setPluginName(e.target.value)}
                    className="w-full bg-[#1e293b] border border-[#334155] rounded-xl px-4 py-2.5 text-white text-xs font-bold focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">الاسم بالإنجليزية</label>
                  <input
                    type="text"
                    placeholder="e.g. Redeem Gift Card"
                    value={pluginNameEn}
                    onChange={(e) => setPluginNameEn(e.target.value)}
                    className="w-full bg-[#1e293b] border border-[#334155] rounded-xl px-4 py-2.5 text-white text-xs font-bold focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">التصنيف</label>
                  <select
                    value={pluginCategory}
                    onChange={(e) => setPluginCategory(e.target.value as POSActionCategory)}
                    className="w-full bg-[#1e293b] border border-[#334155] rounded-xl px-3 py-2.5 text-white text-xs font-bold focus:outline-none focus:border-purple-500"
                  >
                    <option value="plugins">الملحقات والإضافات Dynamic Plugins</option>
                    <option value="invoicing">إدارة الفواتير والبيع</option>
                    <option value="items">الأصناف والأسعار</option>
                    <option value="payments">طرق التحصيل والدفع</option>
                    <option value="customer">العملاء والولاء</option>
                    <option value="reports">التقارير والورديات</option>
                    <option value="inquiry">الاستعلامات والأدوات</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">اسم المطور / الملحق Vendor</label>
                  <input
                    type="text"
                    placeholder="e.g. Maro Loyalty Module v2"
                    value={pluginVendor}
                    onChange={(e) => setPluginVendor(e.target.value)}
                    className="w-full bg-[#1e293b] border border-[#334155] rounded-xl px-4 py-2.5 text-white text-xs font-bold focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">الوصف التفصيلي للإجراء</label>
                <textarea
                  rows={2}
                  placeholder="وصف الإجراء والحدث الذي سيتم إطلاقه عند ضغط الكاشير على المفتاح..."
                  value={pluginDescription}
                  onChange={(e) => setPluginDescription(e.target.value)}
                  className="w-full bg-[#1e293b] border border-[#334155] rounded-xl p-3 text-white text-xs focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-bold text-xs shadow-lg shadow-purple-600/20"
                >
                  تسجيل الإجراء في السجل الأوتوماتيكي
                </button>
                <button
                  type="button"
                  onClick={() => setIsPluginModalOpen(false)}
                  className="px-5 bg-[#1e293b] text-slate-300 rounded-xl font-bold text-xs"
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
