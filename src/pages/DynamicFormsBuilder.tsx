/**
 * @file DynamicFormsBuilder.tsx
 * @module واجهات وصفحات النظام (UI Pages)
 * @description ملف جزء من نظام MARO ERP. الوظيفة: DynamicFormsBuilder.tsx.
 */
import React, { useState } from 'react';
import { 
  Settings, 
  Layers, 
  Database, 
  FileText, 
  Plus, 
  Trash2, 
  ToggleLeft, 
  ToggleRight,
  Briefcase,
  CheckCircle2,
  AlertTriangle,
  Type,
  Hash,
  Calendar,
  List as ListIcon
} from 'lucide-react';
import { cn } from '../lib/utils';

interface CustomField {
  id: string;
  label: string;
  name: string;
  type: 'text' | 'number' | 'date' | 'select' | 'boolean';
  isRequired: boolean;
  targetIndustry: string;
  options?: string[]; // For select type
}

export const DynamicFormsBuilder: React.FC = () => {
  const [selectedEntity, setSelectedEntity] = useState<'products' | 'customers' | 'sales_orders' | 'employees'>('products');
  
  const [fields, setFields] = useState<CustomField[]>([
    { id: 'f1', label: 'رقم الشاسيه (VIN)', name: 'vin_number', type: 'text', isRequired: true, targetIndustry: 'automotive' },
    { id: 'f2', label: 'تاريخ انتهاء الصلاحية', name: 'expiry_date', type: 'date', isRequired: true, targetIndustry: 'pharmacy' },
    { id: 'f3', label: 'نوع المحرك', name: 'engine_type', type: 'select', isRequired: false, targetIndustry: 'automotive', options: ['V6', 'V8', 'Electric', 'Hybrid'] },
    { id: 'f4', label: 'مسببات الحساسية', name: 'allergens', type: 'text', isRequired: false, targetIndustry: 'restaurant' },
  ]);

  const [isAdding, setIsAdding] = useState(false);
  const [newField, setNewField] = useState<Partial<CustomField>>({
    type: 'text',
    isRequired: false,
    targetIndustry: 'all'
  });

  const industries = [
    { id: 'all', name: 'جميع الأنشطة (عام)' },
    { id: 'automotive', name: 'السيارات وقطع الغيار' },
    { id: 'pharmacy', name: 'الصيدليات' },
    { id: 'restaurant', name: 'المطاعم' },
    { id: 'retail', name: 'التجزئة' }
  ];

  const handleAddField = () => {
    if (!newField.label || !newField.name) return;
    
    setFields([...fields, { 
      id: `f${Date.now()}`, 
      ...newField as CustomField 
    }]);
    
    setIsAdding(false);
    setNewField({ type: 'text', isRequired: false, targetIndustry: 'all' });
  };

  const removeField = (id: string) => {
    setFields(fields.filter(f => f.id !== id));
  };

  const getFieldIcon = (type: string) => {
    switch (type) {
      case 'text': return <Type size={16} className="text-blue-400" />;
      case 'number': return <Hash size={16} className="text-emerald-400" />;
      case 'date': return <Calendar size={16} className="text-amber-400" />;
      case 'select': return <ListIcon size={16} className="text-purple-400" />;
      case 'boolean': return <ToggleRight size={16} className="text-slate-400" />;
      default: return <FileText size={16} />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-950 via-[#151b2b] to-[#0f172a] p-6 rounded-2xl border border-blue-900/40 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-400 font-bold text-xs border border-blue-500/30">
              MARO Phase 6: Dynamic Forms & Config
            </span>
          </div>
          <h1 className="text-2xl font-black text-white">محرك النماذج الديناميكية</h1>
          <p className="text-xs text-slate-400 mt-1">
            إضافة حقول مخصصة (Custom Fields) تتكيف مع الصناعة والنشاط، يتم تخزينها كـ JSONB دون الحاجة لتعديل معمارية قاعدة البيانات الأساسية (Relational Core).
          </p>
        </div>
        <div className="flex items-center gap-3">
           <div className="bg-[#0f172a] p-3 rounded-xl border border-slate-800 flex items-center gap-3">
             <Database className="text-blue-400" size={24} />
             <div>
               <p className="text-[10px] text-slate-400">هيكل البيانات</p>
               <p className="text-xs font-bold text-blue-400">JSONB Hybrid Core</p>
             </div>
           </div>
        </div>
      </div>

      {/* Main Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Sidebar: Entities */}
        <div className="bg-[#151b2b] rounded-2xl border border-slate-800 p-4 space-y-4">
          <h3 className="text-white font-bold text-sm flex items-center gap-2 pb-3 border-b border-slate-800">
            <Layers size={18} className="text-slate-400" />
            الكيانات الأساسية (Entities)
          </h3>
          <div className="space-y-2">
            {[
              { id: 'products', name: 'المنتجات والأصناف' },
              { id: 'customers', name: 'العملاء' },
              { id: 'sales_orders', name: 'أوامر البيع' },
              { id: 'employees', name: 'الموظفين (HR)' }
            ].map(entity => (
              <button
                key={entity.id}
                onClick={() => setSelectedEntity(entity.id as any)}
                className={cn(
                  "w-full text-right px-4 py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-between",
                  selectedEntity === entity.id 
                    ? "bg-blue-600/20 text-blue-400 border border-blue-500/30" 
                    : "bg-[#0f172a] text-slate-400 border border-slate-800 hover:border-slate-700 hover:text-white"
                )}
              >
                {entity.name}
                {selectedEntity === entity.id && <CheckCircle2 size={14} />}
              </button>
            ))}
          </div>
          
          <div className="mt-6 bg-amber-500/10 border border-amber-500/20 rounded-xl p-3">
             <p className="text-[10px] text-amber-400 flex gap-2 items-start font-bold">
               <AlertTriangle size={14} className="shrink-0" />
               الحقول المُضافة هنا ستظهر للمستخدمين فقط إذا كان نشاط الشركة مطابقاً لإعدادات الحقل.
             </p>
          </div>
        </div>

        {/* Form Builder Canvas */}
        <div className="lg:col-span-3 bg-[#151b2b] rounded-2xl border border-slate-800 p-6 space-y-6 min-h-[500px]">
          
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Settings size={20} className="text-blue-400" />
                تكوين الحقول الديناميكية - {selectedEntity === 'products' ? 'المنتجات والأصناف' : 'الكيان المحدد'}
              </h2>
            </div>
            <button 
              onClick={() => setIsAdding(true)}
              className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-lg shadow-blue-600/20 flex items-center gap-2"
            >
              <Plus size={16} />
              إضافة حقل جديد
            </button>
          </div>

          {/* Add New Field Panel */}
          {isAdding && (
            <div className="bg-[#0f172a] border border-blue-500/30 p-5 rounded-xl space-y-4 mb-6 shadow-inner animate-in fade-in slide-in-from-top-4">
              <h4 className="text-sm font-bold text-white mb-2">إعدادات الحقل الجديد</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <label className="text-xs text-slate-400 block font-bold">اسم الحقل (Label)</label>
                  <input 
                    type="text" 
                    placeholder="مثال: رقم اللوحة"
                    value={newField.label || ''}
                    onChange={e => setNewField({...newField, label: e.target.value})}
                    className="w-full bg-[#151b2b] border border-slate-700 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs text-slate-400 block font-bold">الاسم البرمجي (Key)</label>
                  <input 
                    type="text" 
                    placeholder="مثال: plate_number"
                    value={newField.name || ''}
                    onChange={e => setNewField({...newField, name: e.target.value})}
                    className="w-full bg-[#151b2b] border border-slate-700 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs text-slate-400 block font-bold">نوع البيانات (Type)</label>
                  <select 
                    value={newField.type || 'text'}
                    onChange={e => setNewField({...newField, type: e.target.value as any})}
                    className="w-full bg-[#151b2b] border border-slate-700 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-blue-500 appearance-none"
                  >
                    <option value="text">نص (Text)</option>
                    <option value="number">رقم (Number)</option>
                    <option value="date">تاريخ (Date)</option>
                    <option value="select">قائمة منسدلة (Select)</option>
                    <option value="boolean">نعم/لا (Boolean)</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs text-slate-400 block font-bold">النشاط المستهدف (Industry)</label>
                  <select 
                    value={newField.targetIndustry || 'all'}
                    onChange={e => setNewField({...newField, targetIndustry: e.target.value})}
                    className="w-full bg-[#151b2b] border border-slate-700 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-blue-500 appearance-none"
                  >
                    {industries.map(ind => (
                      <option key={ind.id} value={ind.id}>{ind.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex items-center gap-4 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={newField.isRequired}
                    onChange={e => setNewField({...newField, isRequired: e.target.checked})}
                    className="rounded bg-slate-800 border-slate-700 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-xs text-slate-300 font-bold">حقل إجباري (Required)</span>
                </label>
              </div>
              <div className="flex justify-end gap-2 pt-4 border-t border-slate-800">
                <button 
                  onClick={() => setIsAdding(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-all"
                >
                  إلغاء
                </button>
                <button 
                  onClick={handleAddField}
                  disabled={!newField.label || !newField.name}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-xl text-xs font-bold transition-all"
                >
                  حفظ الحقل المخصص
                </button>
              </div>
            </div>
          )}

          {/* Fields List */}
          <div className="space-y-3">
            {fields.map((field) => {
              const industry = industries.find(i => i.id === field.targetIndustry);
              return (
                <div key={field.id} className="bg-[#0f172a] p-4 rounded-xl border border-slate-800 flex items-center justify-between group hover:border-slate-700 transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-[#151b2b] border border-slate-700 flex items-center justify-center shrink-0">
                      {getFieldIcon(field.type)}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        {field.label}
                        {field.isRequired && <span className="text-[10px] bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded font-bold">إجباري</span>}
                      </h4>
                      <div className="flex items-center gap-3 mt-1.5 text-xs font-mono text-slate-500">
                        <span>{field.name}</span>
                        <span>•</span>
                        <span className="text-slate-400 uppercase">{field.type}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1 text-emerald-400">
                          <Briefcase size={12} />
                          {industry?.name}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => removeField(field.id)}
                    className="w-8 h-8 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              );
            })}
            
            {fields.length === 0 && (
              <div className="text-center py-12 text-slate-500 text-sm">
                لا توجد حقول مخصصة لهذا الكيان.
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};
