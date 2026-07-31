import React, { useState, useEffect } from 'react';
import { 
  LayoutTemplate, Monitor, Smartphone, Tablet, Save, Plus, 
  Settings, GripVertical, Trash2, Copy, MonitorPlay, 
  ArrowRight, Check
} from 'lucide-react';
import { POSLayoutRepository, POSLayout, POSPanelConfig } from '../../../repositories/posLayoutRepository';
import { toast } from 'react-hot-toast';

export const POSLayoutDesigner: React.FC = () => {
  const [layouts, setLayouts] = useState<POSLayout[]>([]);
  const [selectedLayoutId, setSelectedLayoutId] = useState<string | null>(null);
  const [editingLayout, setEditingLayout] = useState<POSLayout | null>(null);
  
  useEffect(() => {
    loadLayouts();
  }, []);

  const loadLayouts = () => {
    const data = POSLayoutRepository.getLayouts();
    if (data.length === 0) {
      const defaultLayout = POSLayoutRepository.getDefaultLayout();
      POSLayoutRepository.saveLayout(defaultLayout).then(() => {
        setLayouts([defaultLayout]);
        if (!selectedLayoutId) setSelectedLayoutId(defaultLayout.id);
      });
    } else {
      setLayouts(data);
      if (!selectedLayoutId) setSelectedLayoutId(data[0].id);
    }
  };

  useEffect(() => {
    if (selectedLayoutId) {
      const layout = layouts.find(l => l.id === selectedLayoutId);
      if (layout) {
        setEditingLayout(JSON.parse(JSON.stringify(layout)));
      }
    }
  }, [selectedLayoutId, layouts]);

  const handleSave = async () => {
    if (!editingLayout) return;
    try {
      await POSLayoutRepository.saveLayout(editingLayout);
      toast.success('تم حفظ المخطط بنجاح');
      loadLayouts();
    } catch (error) {
      toast.error('حدث خطأ أثناء الحفظ');
    }
  };

  const handleAddNew = () => {
    const newLayout: POSLayout = {
      id: 'layout_' + Date.now(),
      name: 'مخطط جديد',
      description: '',
      isDefault: false,
      deviceType: 'desktop',
      theme: 'system',
      panels: [
        { id: 'p1', type: 'products', title: 'المنتجات', visible: true, order: 1, position: 'center' },
        { id: 'p2', type: 'cart', title: 'سلة المشتريات', visible: true, order: 2, position: 'right' },
      ],
      allowFractionalQuantities: false,
      showProductImages: true,
      keyboardShortcutsEnabled: true,
      quickAmounts: [50, 100, 200, 500],
      assignedRoles: [],
      assignedUsers: [],
      assignedBranches: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    setEditingLayout(newLayout);
    setSelectedLayoutId(newLayout.id); // It's not in db yet, but we have it in state
  };

  const handleClone = (layout: POSLayout) => {
    const clone: POSLayout = {
      ...JSON.parse(JSON.stringify(layout)),
      id: 'layout_' + Date.now(),
      name: layout.name + ' (نسخة)',
      isDefault: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    setEditingLayout(clone);
    setSelectedLayoutId(clone.id);
  };

  const handleDelete = async (id: string) => {
    if (confirm('هل أنت متأكد من حذف هذا المخطط؟')) {
      await POSLayoutRepository.deleteLayout(id);
      toast.success('تم حذف المخطط');
      loadLayouts();
      if (selectedLayoutId === id) setSelectedLayoutId(null);
    }
  };

  if (!editingLayout) return <div className="p-8 text-white">جاري التحميل...</div>;

  const availablePanelTypes = [
    { type: 'products', label: 'المنتجات', desc: 'شبكة المنتجات المتاحة' },
    { type: 'cart', label: 'سلة المشتريات', desc: 'عناصر الفاتورة الحالية' },
    { type: 'customer', label: 'العميل', desc: 'بيانات العميل' },
    { type: 'payment', label: 'الدفع', desc: 'طرق وخيارات الدفع' },
    { type: 'functions', label: 'أزرار المهام', desc: 'F1-F12 أزرار المهام' },
    { type: 'categories', label: 'الفئات', desc: 'شريط فئات المنتجات' },
    { type: 'totals', label: 'الإجماليات', desc: 'ملخص الفاتورة' }
  ];

  const handleTogglePanel = (panelType: string) => {
    if (!editingLayout) return;
    const exists = editingLayout.panels.find(p => p.type === panelType);
    if (exists) {
      setEditingLayout({
        ...editingLayout,
        panels: editingLayout.panels.filter(p => p.type !== panelType)
      });
    } else {
      const typeInfo = availablePanelTypes.find(t => t.type === panelType);
      setEditingLayout({
        ...editingLayout,
        panels: [
          ...editingLayout.panels,
          { 
            id: 'p_' + Date.now(), 
            type: panelType as any, 
            title: typeInfo?.label || panelType, 
            visible: true, 
            order: editingLayout.panels.length + 1,
            position: 'center'
          }
        ]
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0f1a] flex flex-col md:flex-row">
      {/* Sidebar: List of Layouts */}
      <div className="w-full md:w-64 bg-[#151b2b] border-l border-[#1e293b] flex flex-col">
        <div className="p-4 border-b border-[#1e293b]">
          <h2 className="text-white font-bold flex items-center gap-2">
            <LayoutTemplate size={20} className="text-blue-500" />
            مخططات الشاشة
          </h2>
          <button 
            onClick={handleAddNew}
            className="w-full mt-4 flex items-center justify-center gap-2 bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 py-2 rounded-lg text-sm font-bold transition-colors"
          >
            <Plus size={16} />
            مخطط جديد
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {layouts.map(layout => (
            <div 
              key={layout.id} 
              className={`p-3 rounded-xl cursor-pointer border transition-colors relative group \${
                selectedLayoutId === layout.id || (editingLayout.id === layout.id && !layouts.find(l => l.id === editingLayout.id))
                  ? 'bg-blue-600/20 border-blue-500/50 text-white' 
                  : 'bg-[#0f172a] border-[#1e293b] text-slate-300 hover:border-slate-600'
              }`}
              onClick={() => setSelectedLayoutId(layout.id)}
            >
              <div className="flex items-center gap-2 font-bold text-sm">
                {layout.deviceType === 'desktop' && <Monitor size={16} className="text-slate-400" />}
                {layout.deviceType === 'touch' && <MonitorPlay size={16} className="text-blue-400" />}
                {layout.deviceType === 'tablet' && <Tablet size={16} className="text-purple-400" />}
                {layout.deviceType === 'mobile' && <Smartphone size={16} className="text-emerald-400" />}
                {layout.name}
              </div>
              <div className="text-xs text-slate-500 mt-1 flex justify-between items-center">
                <span>{layout.isDefault ? 'افتراضي' : 'مخصص'}</span>
                {layout.id !== 'default' && (
                  <div className="hidden group-hover:flex items-center gap-1">
                    <button onClick={(e) => { e.stopPropagation(); handleClone(layout); }} className="p-1 hover:text-blue-400">
                      <Copy size={12} />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); handleDelete(layout.id); }} className="p-1 hover:text-red-400">
                      <Trash2 size={12} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Designer Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Header */}
        <div className="h-16 bg-[#151b2b] border-b border-[#1e293b] flex items-center justify-between px-6 shrink-0">
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              تصميم تخطيط نقطة البيع (POS Designer)
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={handleSave}
              className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-blue-700 transition-colors"
            >
              <Save size={18} />
              حفظ المخطط
            </button>
          </div>
        </div>

        {/* Workspace */}
        <div className="flex-1 overflow-auto p-6 grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* Settings Panel */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-[#151b2b] border border-[#1e293b] rounded-2xl p-5">
              <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                <Settings size={18} className="text-slate-400" />
                إعدادات المخطط الأساسية
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-slate-400 block mb-1">اسم المخطط</label>
                  <input 
                    type="text" 
                    value={editingLayout.name}
                    onChange={(e) => setEditingLayout({...editingLayout, name: e.target.value})}
                    className="w-full bg-[#0b0f1a] border border-[#1e293b] rounded-xl px-3 py-2 text-sm text-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-400 block mb-1">نوع الجهاز المستهدف</label>
                  <div className="grid grid-cols-2 gap-2">
                    {['desktop', 'touch', 'tablet', 'mobile'].map(type => (
                      <button 
                        key={type}
                        onClick={() => setEditingLayout({...editingLayout, deviceType: type as any})}
                        className={`py-2 rounded-lg text-xs font-bold capitalize border \${
                          editingLayout.deviceType === type 
                            ? 'bg-blue-600/20 border-blue-500 text-blue-400'
                            : 'bg-[#0b0f1a] border-[#1e293b] text-slate-400 hover:border-slate-600'
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="flex items-center gap-2 text-sm text-white cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={editingLayout.isDefault}
                      onChange={(e) => setEditingLayout({...editingLayout, isDefault: e.target.checked})}
                      className="w-4 h-4 accent-blue-600"
                    />
                    تعيين كمخطط افتراضي للكل
                  </label>
                </div>
              </div>
            </div>

            <div className="bg-[#151b2b] border border-[#1e293b] rounded-2xl p-5">
              <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                <LayoutTemplate size={18} className="text-purple-400" />
                اللوحات المتاحة (Panels)
              </h3>
              <div className="space-y-2">
                {availablePanelTypes.map(panel => {
                  const isActive = editingLayout.panels.some(p => p.type === panel.type);
                  return (
                    <div 
                      key={panel.type}
                      onClick={() => handleTogglePanel(panel.type)}
                      className={`p-3 rounded-xl border cursor-pointer flex items-center justify-between transition-colors \${
                        isActive 
                          ? 'bg-purple-600/10 border-purple-500/50 text-white' 
                          : 'bg-[#0b0f1a] border-[#1e293b] text-slate-400 hover:border-slate-600'
                      }`}
                    >
                      <div>
                        <div className="font-bold text-sm">{panel.label}</div>
                        <div className="text-[10px] opacity-70 mt-0.5">{panel.desc}</div>
                      </div>
                      {isActive && <Check size={16} className="text-purple-400" />}
                    </div>
                  )
                })}
              </div>
            </div>
            
            <div className="bg-[#151b2b] border border-[#1e293b] rounded-2xl p-5">
              <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                <Settings size={18} className="text-amber-400" />
                خيارات التشغيل (Behavior)
              </h3>
              <div className="space-y-3">
                <label className="flex items-center justify-between text-sm text-slate-300 cursor-pointer">
                  <span>إظهار صور المنتجات</span>
                  <input type="checkbox" checked={editingLayout.showProductImages} onChange={e => setEditingLayout({...editingLayout, showProductImages: e.target.checked})} className="w-4 h-4 accent-amber-500" />
                </label>
                <label className="flex items-center justify-between text-sm text-slate-300 cursor-pointer">
                  <span>تفعيل اختصارات لوحة المفاتيح</span>
                  <input type="checkbox" checked={editingLayout.keyboardShortcutsEnabled} onChange={e => setEditingLayout({...editingLayout, keyboardShortcutsEnabled: e.target.checked})} className="w-4 h-4 accent-amber-500" />
                </label>
              </div>
            </div>
          </div>

          {/* Visual Preview / Builder */}
          <div className="lg:col-span-3 bg-[#151b2b] border border-[#1e293b] rounded-2xl p-6 flex flex-col items-center justify-center overflow-hidden relative">
            <div className="absolute top-4 right-4 text-xs font-bold text-slate-500 flex items-center gap-2">
              <MonitorPlay size={14} />
              معاينة حية للمخطط (Live Preview)
            </div>
            
            {/* The mock POS screen container */}
            <div 
              className={`border-4 border-[#334155] rounded-3xl overflow-hidden bg-[#0b0f1a] shadow-2xl relative transition-all duration-300 \${
                editingLayout.deviceType === 'mobile' ? 'w-[375px] h-[812px]' :
                editingLayout.deviceType === 'tablet' ? 'w-[768px] h-[1024px] rotate-90' :
                'w-full h-full max-h-[800px] aspect-video'
              }`}
            >
              {/* Top Bar Mock */}
              <div className="h-10 bg-[#151b2b] border-b border-[#1e293b] flex items-center px-4">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-600"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-600"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-600"></div>
                </div>
              </div>
              
              {/* Content Mock based on selected panels */}
              <div className="flex h-[calc(100%-40px)] p-2 gap-2 relative">
                
                {/* Center / Left Panel */}
                <div className="flex-1 flex flex-col gap-2">
                  {editingLayout.panels.some(p => p.type === 'categories') && (
                    <div className="h-12 bg-[#1e293b] rounded-lg border border-[#334155] flex items-center justify-center text-slate-400 text-xs font-bold">
                      شريط الفئات (Categories)
                    </div>
                  )}
                  {editingLayout.panels.some(p => p.type === 'products') && (
                    <div className="flex-1 bg-[#1e293b] rounded-lg border border-[#334155] flex items-center justify-center text-slate-400 text-xs font-bold">
                      شبكة المنتجات (Products Grid)
                    </div>
                  )}
                </div>

                {/* Right Sidebar (Cart, Totals, Customer) */}
                {(editingLayout.panels.some(p => ['cart', 'totals', 'customer', 'payment'].includes(p.type))) && (
                  <div className="w-72 flex flex-col gap-2">
                    {editingLayout.panels.some(p => p.type === 'customer') && (
                      <div className="h-16 bg-[#1e293b] rounded-lg border border-[#334155] flex items-center justify-center text-slate-400 text-xs font-bold">
                        بيانات العميل
                      </div>
                    )}
                    {editingLayout.panels.some(p => p.type === 'cart') && (
                      <div className="flex-1 bg-[#1e293b] rounded-lg border border-[#334155] flex items-center justify-center text-slate-400 text-xs font-bold">
                        سلة المشتريات
                      </div>
                    )}
                    {editingLayout.panels.some(p => p.type === 'totals') && (
                      <div className="h-24 bg-[#1e293b] rounded-lg border border-[#334155] flex items-center justify-center text-slate-400 text-xs font-bold">
                        الإجماليات
                      </div>
                    )}
                    {editingLayout.panels.some(p => p.type === 'payment') && (
                      <div className="h-32 bg-blue-900/30 rounded-lg border border-blue-500/30 flex items-center justify-center text-blue-400 text-xs font-bold">
                        خيارات الدفع
                      </div>
                    )}
                  </div>
                )}

                {/* Bottom Bar (Functions) - Absolutely positioned for simplicity in preview */}
                {editingLayout.panels.some(p => p.type === 'functions') && (
                  <div className="absolute bottom-2 left-2 right-2 h-16 bg-[#1e293b] rounded-lg border border-[#334155] flex items-center justify-center text-amber-400 text-xs font-bold shadow-lg">
                    أزرار المهام السريعة (F1-F12)
                  </div>
                )}
              </div>

            </div>

          </div>
        </div>
      </div>
    </div>
  );
};
