import React, { useState, useEffect } from 'react';
import { 
  Keyboard, 
  Save, 
  RotateCcw, 
  Search, 
  CheckCircle2, 
  Plus, 
  Filter, 
  Zap, 
  Info, 
  Layers,
  Settings,
  HelpCircle,
  Tag,
  DollarSign,
  Percent,
  UserCheck,
  CreditCard,
  Banknote,
  Printer,
  Calculator,
  Lock,
  RotateCw,
  PlusCircle,
  MinusCircle,
  Hash,
  Barcode,
  PackageCheck,
  Building,
  Archive,
  Clock,
  Repeat,
  Trash2,
  XCircle,
  Scale,
  QrCode,
  Boxes,
  Split,
  FileText,
  Award,
  Gift,
  Ticket,
  Warehouse,
  ListFilter,
  BarChart2,
  Unlock,
  Copy,
  MessageSquare,
  Puzzle
} from 'lucide-react';
import { FunctionKey, POSActionDefinition, POSActionCategory, POSKeyMapping } from '../../types/posKeys';
import { PosActionRegistry } from '../../lib/posActionRegistry';
import { POSKeyRepository, DEFAULT_KEY_MAPPINGS } from '../../repositories/posKeyRepository';
import { cn } from '../../lib/utils';

const ALL_KEYS: FunctionKey[] = ['F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'F11', 'F12'];

const CATEGORY_LABELS: { [key in POSActionCategory]: { nameAr: string; icon: any } } = {
  INVOICE: { nameAr: 'الفواتير والمبيعات', icon: PlusCircle },
  PAYMENT: { nameAr: 'طرق السداد والدفع', icon: Banknote },
  ITEM: { nameAr: 'الأصناف والتعديل', icon: Hash },
  CUSTOMER: { nameAr: 'العملاء والخصومات', icon: UserCheck },
  INVENTORY: { nameAr: 'المخزون والأسعار', icon: PackageCheck },
  SHIFT: { nameAr: 'الورديات والتقارير', icon: Lock },
  SYSTEM: { nameAr: 'الأدوات والنظام', icon: Settings },
  PLUGIN: { nameAr: 'إضافات النظام (Plugins)', icon: Puzzle },
};

// Icon map helper
const ICON_COMPONENTS: { [key: string]: any } = {
  PlusCircle,
  PauseCircle: Clock,
  PlayCircle: Zap,
  Archive,
  Clock,
  RotateCcw,
  Repeat,
  Trash2,
  XCircle,
  Search,
  Barcode,
  Hash,
  DollarSign,
  Percent,
  Tag,
  Layers,
  Edit3: Tag,
  MinusCircle,
  Scale,
  QrCode,
  Boxes,
  Banknote,
  CreditCard,
  Split,
  UserCheck,
  FileText,
  Award,
  Gift,
  Ticket,
  Warehouse,
  ListFilter,
  PackageCheck,
  Info,
  HelpCircle,
  Lock,
  BarChart2,
  Printer,
  Unlock,
  Copy,
  Calculator,
  MessageSquare,
  Puzzle
};

export const POSFunctionKeysManager: React.FC = () => {
  const [mappings, setMappings] = useState<POSKeyMapping>(DEFAULT_KEY_MAPPINGS);
  const [actions, setActions] = useState<POSActionDefinition[]>([]);
  const [selectedKeyForModal, setSelectedKeyForModal] = useState<FunctionKey | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  
  // Custom Plugin Registration Modal State
  const [isPluginModalOpen, setIsPluginModalOpen] = useState(false);
  const [pluginTitleAr, setPluginTitleAr] = useState('');
  const [pluginTitleEn, setPluginTitleEn] = useState('');
  const [pluginId, setPluginId] = useState('');

  useEffect(() => {
    // Load current key mappings
    setMappings(POSKeyRepository.getKeyMappings());
    // Load current registered actions from registry
    setActions(PosActionRegistry.getActions());

    // Subscribe to PosActionRegistry updates (e.g. dynamic plugin registrations)
    const unsub = PosActionRegistry.subscribe(() => {
      setActions(PosActionRegistry.getActions());
    });

    return () => unsub();
  }, []);

  const handleKeyAssign = (key: FunctionKey, actionId: string) => {
    setMappings(prev => ({
      ...prev,
      [key]: actionId
    }));
    setSelectedKeyForModal(null);
  };

  const handleSave = () => {
    POSKeyRepository.saveKeyMappings(mappings);
    showToast('تم حفظ تخصيص مفاتيح الوظائف (F1-F12) بنجاح والمزامنة مع القاعدة');
  };

  const handleResetDefaults = () => {
    if (window.confirm('هل أنت تأكد من إعادة ضبط كافة المفاتيح للإفتراضيات القياسية للنظام؟')) {
      const defs = POSKeyRepository.resetToDefaults();
      setMappings(defs);
      showToast('تمت إعادة ضبط المفاتيح للقيم القياسية للنظام');
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleRegisterPluginAction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pluginTitleAr.trim()) return;

    const actionId = pluginId.trim() ? `PLUGIN_${pluginId.trim().toUpperCase()}` : `PLUGIN_${Date.now()}`;
    const newPluginAction: POSActionDefinition = {
      id: actionId,
      titleAr: pluginTitleAr,
      titleEn: pluginTitleEn || pluginTitleAr,
      category: 'PLUGIN',
      iconName: 'Puzzle',
      color: 'bg-violet-600',
      description: 'أمر خارجي مخصص تمت إضافته ديناميكياً عبر سجل الإضافات',
      isPlugin: true,
      pluginId: 'custom_plugin_01'
    };

    PosActionRegistry.registerAction(newPluginAction);
    setIsPluginModalOpen(false);
    setPluginTitleAr('');
    setPluginTitleEn('');
    setPluginId('');
    showToast(`تم تسجيل الأمر الجديد (${newPluginAction.titleAr}) ديناميكياً بنجاح!`);
  };

  const filteredActions = actions.filter(action => {
    const matchesCat = selectedCategory === 'ALL' || action.category === selectedCategory;
    const matchesQuery = searchQuery.trim() === '' || 
      action.titleAr.includes(searchQuery) || 
      action.titleEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
      action.id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesQuery;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Toast notification */}
      {toastMessage && (
        <div className="p-4 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 rounded-2xl flex items-center justify-between font-bold text-sm shadow-xl">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={18} />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

      {/* Header & Main Actions */}
      <div className="bg-[#1e293b]/60 p-6 rounded-3xl border border-[#334155]/50 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-600/20 text-blue-400 rounded-2xl border border-blue-500/30">
              <Keyboard size={24} />
            </div>
            <div>
              <h3 className="text-xl font-black text-white">مدير مفاتيح الوظائف (F1–F12) - POS Function Keys</h3>
              <p className="text-slate-400 text-xs mt-0.5">تخصيص الأوامر والإجراءات السريعة لنقاط البيع ولوحة المفاتيح الخارجية</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <button
            onClick={() => setIsPluginModalOpen(true)}
            className="flex-1 md:flex-none px-4 py-2.5 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 rounded-2xl border border-purple-500/30 font-bold text-xs flex items-center justify-center gap-2 transition-all"
          >
            <Puzzle size={16} />
            <span>تسجيل أمر Plugin جديد</span>
          </button>
          
          <button
            onClick={handleResetDefaults}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-2xl border border-slate-700 font-bold text-xs flex items-center justify-center gap-2 transition-all"
            title="إعادة ضبط كافة المفاتيح للقيم القياسية"
          >
            <RotateCcw size={16} />
            <span>افتراضي</span>
          </button>

          <button
            onClick={handleSave}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black text-xs shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2 transition-all"
          >
            <Save size={16} />
            <span>حفظ الإعدادات</span>
          </button>
        </div>
      </div>

      {/* Dynamic Registry Info Bar */}
      <div className="bg-[#151b2b] p-4 rounded-2xl border border-[#1e293b] flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <Zap size={16} className="text-amber-400" />
          <span>سجل الإجراءات المتاحة: <strong className="text-white font-mono">{actions.length} أمر مثبت</strong></span>
          <span className="text-slate-600">|</span>
          <span>منها إضافات خارجيّة (Plugins): <strong className="text-purple-400 font-mono">{actions.filter(a => a.isPlugin).length} إضافة</strong></span>
        </div>
        <div className="hidden sm:block text-[11px] text-slate-500">
          يدعم التعيين الديناميكي ومربوط بـ PostgreSQL و MARO Sync Engine
        </div>
      </div>

      {/* Function Keys Grid F1 - F12 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {ALL_KEYS.map((key) => {
          const actionId = mappings[key];
          const actionDef = actions.find(a => a.id === actionId);
          const Icon = actionDef ? (ICON_COMPONENTS[actionDef.iconName] || Keyboard) : Keyboard;

          return (
            <div 
              key={key} 
              className={cn(
                "bg-[#151b2b] rounded-3xl border transition-all duration-200 p-5 flex flex-col justify-between hover:border-blue-500/50 group relative overflow-hidden",
                actionDef ? "border-[#1e293b]" : "border-dashed border-slate-700/60"
              )}
            >
              {actionDef?.isPlugin && (
                <div className="absolute top-0 left-0 bg-purple-600 text-[9px] font-black uppercase text-white px-3 py-0.5 rounded-br-xl shadow-sm flex items-center gap-1">
                  <Puzzle size={10} />
                  <span>Plugin</span>
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2.5">
                    <span className="px-3 py-1 bg-[#1e293b] text-blue-400 border border-[#334155] rounded-xl font-mono text-sm font-black shadow-inner">
                      {key}
                    </span>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                      {actionDef ? (CATEGORY_LABELS[actionDef.category]?.nameAr || actionDef.category) : 'غير معين'}
                    </span>
                  </div>

                  {actionDef && (
                    <div className={cn("p-2 rounded-2xl text-white shadow-md", actionDef.color || 'bg-slate-700')}>
                      <Icon size={18} />
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <h4 className="font-black text-white text-base group-hover:text-blue-400 transition-colors">
                    {actionDef ? actionDef.titleAr : 'انقر لتخصيص المفتاح'}
                  </h4>
                  <p className="text-slate-500 text-xs line-clamp-2 min-h-[32px]">
                    {actionDef?.description || 'لا يوجد أمر مسند لهذا المفتاح'}
                  </p>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-[#1e293b]/80 flex items-center justify-between">
                <span className="font-mono text-[10px] text-slate-600 truncate max-w-[140px]">
                  ID: {actionDef?.id || 'UNASSIGNED'}
                </span>

                <button
                  onClick={() => setSelectedKeyForModal(key)}
                  className="px-3.5 py-1.5 bg-[#1e293b] hover:bg-blue-600 text-slate-300 hover:text-white rounded-xl text-xs font-bold border border-[#334155] hover:border-blue-500 transition-all flex items-center gap-1.5"
                >
                  <span>تغيير</span>
                  <Settings size={13} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal for Selecting / Assigning Action to Function Key */}
      {selectedKeyForModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-[#151b2b] w-full max-w-4xl rounded-3xl border border-[#1e293b] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-6 border-b border-[#1e293b] flex items-center justify-between bg-[#1e293b]/40">
              <div className="flex items-center gap-3">
                <span className="px-4 py-1.5 bg-blue-600 text-white rounded-2xl font-mono text-base font-black shadow-lg shadow-blue-600/30">
                  {selectedKeyForModal}
                </span>
                <div>
                  <h3 className="font-black text-lg text-white">اختر الوظيفة المراد ربطها بالمفتاح {selectedKeyForModal}</h3>
                  <p className="text-slate-400 text-xs">حدد الإجراء المطلوبة تنفيذه فور الضغط على مفتاح {selectedKeyForModal}</p>
                </div>
              </div>

              <button
                onClick={() => setSelectedKeyForModal(null)}
                className="w-10 h-10 bg-[#1e293b] text-slate-400 hover:text-white rounded-2xl border border-[#334155] flex items-center justify-center font-bold"
              >
                ✕
              </button>
            </div>

            {/* Filter & Search Toolbar */}
            <div className="p-4 border-b border-[#1e293b] bg-[#111623] flex flex-col sm:flex-row gap-3 items-center justify-between">
              {/* Category Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0 scrollbar-thin">
                <button
                  onClick={() => setSelectedCategory('ALL')}
                  className={cn(
                    "px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all",
                    selectedCategory === 'ALL'
                      ? "bg-blue-600 text-white shadow-md"
                      : "bg-[#1e293b] text-slate-400 hover:text-white"
                  )}
                >
                  الكل ({actions.length})
                </button>
                {Object.keys(CATEGORY_LABELS).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={cn(
                      "px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5",
                      selectedCategory === cat
                        ? "bg-blue-600 text-white shadow-md"
                        : "bg-[#1e293b] text-slate-400 hover:text-white"
                    )}
                  >
                    <span>{CATEGORY_LABELS[cat as POSActionCategory].nameAr}</span>
                  </button>
                ))}
              </div>

              {/* Search Bar */}
              <div className="relative w-full sm:w-64">
                <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  placeholder="بحث في الأوامر..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-4 pr-10 py-2 bg-[#1e293b] border border-[#334155] rounded-xl text-white text-xs outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {/* Actions Grid */}
            <div className="p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-3 flex-1">
              {filteredActions.length === 0 ? (
                <div className="col-span-full py-12 text-center text-slate-500">
                  لا توجد أوامر متطابقة مع نتائج البحث
                </div>
              ) : (
                filteredActions.map((act) => {
                  const Icon = ICON_COMPONENTS[act.iconName] || Keyboard;
                  const isCurrentlyAssigned = mappings[selectedKeyForModal] === act.id;

                  return (
                    <button
                      key={act.id}
                      onClick={() => handleKeyAssign(selectedKeyForModal, act.id)}
                      className={cn(
                        "p-4 rounded-2xl border text-right transition-all flex items-start gap-4 hover:scale-[1.01]",
                        isCurrentlyAssigned 
                          ? "bg-blue-600/10 border-blue-500 text-white ring-2 ring-blue-500/30" 
                          : "bg-[#1e293b]/60 border-[#334155]/60 hover:bg-[#1e293b] hover:border-slate-500 text-slate-300"
                      )}
                    >
                      <div className={cn("p-3 rounded-2xl text-white shadow-md shrink-0 mt-0.5", act.color || 'bg-slate-700')}>
                        <Icon size={20} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="font-bold text-sm text-white truncate">{act.titleAr}</h4>
                          {act.isPlugin && (
                            <span className="px-2 py-0.5 bg-purple-500/20 text-purple-300 text-[10px] font-bold rounded-lg border border-purple-500/30">
                              Plugin
                            </span>
                          )}
                        </div>
                        <p className="text-slate-400 text-xs mt-1 line-clamp-2">{act.description}</p>
                        <div className="mt-2 flex items-center gap-2 text-[10px] font-mono text-slate-500">
                          <span>{act.id}</span>
                          <span>•</span>
                          <span>{act.titleEn}</span>
                        </div>
                      </div>

                      {isCurrentlyAssigned && (
                        <CheckCircle2 size={20} className="text-blue-400 shrink-0 self-center" />
                      )}
                    </button>
                  );
                })
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-[#1e293b] bg-[#111623] flex items-center justify-between">
              <span className="text-xs text-slate-500">
                المفتاح المحدد: <strong className="text-white font-mono">{selectedKeyForModal}</strong>
              </span>
              <button
                onClick={() => setSelectedKeyForModal(null)}
                className="px-5 py-2 bg-[#1e293b] hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal for Dynamically Registering Plugin Actions (Requirement 4 Demonstration) */}
      {isPluginModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-[#151b2b] w-full max-w-md rounded-3xl border border-[#1e293b] shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#1e293b] pb-3">
              <div className="flex items-center gap-2">
                <Puzzle size={20} className="text-purple-400" />
                <h3 className="font-black text-white text-base">تسجيل أمر Plugin خارجي جديد</h3>
              </div>
              <button onClick={() => setIsPluginModalOpen(false)} className="text-slate-500 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleRegisterPluginAction} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">اسم الأمر بالعربية</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: طباعة المطبخ الفورية"
                  value={pluginTitleAr}
                  onChange={(e) => setPluginTitleAr(e.target.value)}
                  className="w-full px-4 py-2.5 bg-[#1e293b] border border-[#334155] rounded-xl text-white text-sm outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">اسم الأمر بالإنجليزية (English)</label>
                <input
                  type="text"
                  placeholder="e.g. Instant Kitchen Print"
                  value={pluginTitleEn}
                  onChange={(e) => setPluginTitleEn(e.target.value)}
                  className="w-full px-4 py-2.5 bg-[#1e293b] border border-[#334155] rounded-xl text-white text-sm outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">معرف الأمر المميز (Action ID)</label>
                <input
                  type="text"
                  placeholder="e.g. PRINT_KITCHEN_ORDER"
                  value={pluginId}
                  onChange={(e) => setPluginId(e.target.value)}
                  className="w-full px-4 py-2.5 bg-[#1e293b] border border-[#334155] rounded-xl text-white text-sm font-mono outline-none focus:border-purple-500"
                />
              </div>

              <div className="p-3 bg-purple-950/30 border border-purple-500/20 rounded-xl text-[11px] text-purple-300 space-y-1">
                <p className="font-bold">تسجيل حركي متوافق مع الديناميكية (Dynamic Registry):</p>
                <p className="text-slate-400">سيتم تسجيل هذا الأمر فوراً في `PosActionRegistry` وسيمكنك ربطه مباشرة بأي من المفاتيح (F1-F12).</p>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl text-xs transition-all shadow-lg shadow-purple-600/20"
                >
                  تسجيل في الـ Registry
                </button>
                <button
                  type="button"
                  onClick={() => setIsPluginModalOpen(false)}
                  className="px-4 bg-[#1e293b] text-slate-300 font-bold rounded-xl text-xs"
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
