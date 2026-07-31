// MARO ERP - Categories & Product Groups Management
import React, { useState, useEffect } from 'react';
import { Plus, FolderTree, Tag, Trash2, Edit2, Layers, CheckCircle } from 'lucide-react';
import { ProductRepository } from '../../repositories/productRepository';
import { ProductCategory, ProductGroup } from '../../types/productMaster';
import { toast } from 'react-hot-toast';

export const CategoriesTab: React.FC = () => {
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [groups, setGroups] = useState<ProductGroup[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [catName, setCatName] = useState('');
  const [catCode, setCatCode] = useState('');
  const [catDesc, setCatDesc] = useState('');
  const [catParentId, setCatParentId] = useState<string>('');

  const [groupName, setGroupName] = useState('');
  const [groupCode, setGroupCode] = useState('');
  const [groupCatId, setGroupCatId] = useState('');

  useEffect(() => {
    const unsubCat = ProductRepository.subscribeCategories(setCategories);
    const unsubGroup = ProductRepository.subscribeGroups((g) => {
      setGroups(g);
      setLoading(false);
    });
    return () => {
      unsubCat();
      unsubGroup();
    };
  }, []);

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName || !catCode) {
      toast.error('يرجى كتابة اسم الكود والفئة');
      return;
    }
    try {
      await ProductRepository.addCategory({
        name: catName,
        code: catCode,
        description: catDesc,
        parentId: catParentId || null,
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      toast.success('تمت إضافة الفئة بنجاح');
      setCatName('');
      setCatCode('');
      setCatDesc('');
      setCatParentId('');
    } catch (err: any) {
      toast.error('خطأ أثناء إضافة الفئة: ' + err.message);
    }
  };

  const handleAddGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName || !groupCode || !groupCatId) {
      toast.error('يرجى ملء جميع الحقول المطلوبة للمجموعة');
      return;
    }
    const catObj = categories.find(c => c.id === groupCatId);
    try {
      await ProductRepository.addGroup({
        name: groupName,
        code: groupCode,
        categoryId: groupCatId,
        categoryName: catObj?.name || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      toast.success('تمت إضافة مجموعة المنتجات بنجاح');
      setGroupName('');
      setGroupCode('');
      setGroupCatId('');
    } catch (err: any) {
      toast.error('خطأ أثناء إضافة المجموعة: ' + err.message);
    }
  };

  const handleDeleteCategory = async (id: string, name: string) => {
    if (window.confirm(`هل أنت متأكد من حذف الفئة "${name}"؟`)) {
      try {
        await ProductRepository.deleteCategory(id, name);
        toast.success('تم الحذف بنجاح');
      } catch (err: any) {
        toast.error('فشل الحذف');
      }
    }
  };

  const handleDeleteGroup = async (id: string, name: string) => {
    if (window.confirm(`هل أنت متأكد من حذف المجموعة "${name}"؟`)) {
      try {
        await ProductRepository.deleteGroup(id, name);
        toast.success('تم الحذف بنجاح');
      } catch (err: any) {
        toast.error('فشل الحذف');
      }
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Categories Panel */}
      <div className="bg-[#151b2b] border border-[#1e293b] rounded-2xl p-6 space-y-6">
        <div className="flex items-center gap-3 border-b border-[#1e293b] pb-4">
          <div className="w-10 h-10 bg-blue-500/10 text-blue-400 rounded-xl flex items-center justify-center">
            <FolderTree size={20} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">إدارة الفئات الهيكلية (Categories)</h3>
            <p className="text-xs text-slate-400">فئات المنتجات والتصنيفات الهيكلية</p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleAddCategory} className="space-y-4 bg-[#0b0f17] p-4 rounded-xl border border-[#1e293b]">
          <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">إضافة فئة جديدة</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-400 block mb-1">اسم الفئة *</label>
              <input 
                type="text" 
                value={catName} 
                onChange={(e) => setCatName(e.target.value)}
                placeholder="مثل: إلكترونيات"
                className="w-full bg-[#151b2b] border border-[#1e293b] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-400 block mb-1">رمز الفئة (Code) *</label>
              <input 
                type="text" 
                value={catCode} 
                onChange={(e) => setCatCode(e.target.value)}
                placeholder="CAT-01"
                className="w-full bg-[#151b2b] border border-[#1e293b] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-400 block mb-1">الفئة الأب (اختر في حال الفئات الفرعية)</label>
            <select
              value={catParentId}
              onChange={(e) => setCatParentId(e.target.value)}
              className="w-full bg-[#151b2b] border border-[#1e293b] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
            >
              <option value="">-- فئة رئيسية (بدون أب) --</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name} ({c.code})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-400 block mb-1">وصف الفئة</label>
            <input 
              type="text" 
              value={catDesc} 
              onChange={(e) => setCatDesc(e.target.value)}
              placeholder="وصف مختصر للتصنيف..."
              className="w-full bg-[#151b2b] border border-[#1e293b] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-4 rounded-xl flex items-center justify-center gap-2 text-sm transition-colors"
          >
            <Plus size={16} /> إضافة الفئة
          </button>
        </form>

        {/* List */}
        <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
          {categories.length === 0 ? (
            <div className="text-center py-6 text-slate-500 text-sm">لا توجد فئات مضافة بعد</div>
          ) : (
            categories.map((c) => {
              const parentName = categories.find(p => p.id === c.parentId)?.name;
              return (
                <div key={c.id} className="flex items-center justify-between p-3 bg-[#0b0f17] border border-[#1e293b] rounded-xl">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-sm">{c.name}</span>
                      <span className="text-[10px] bg-blue-500/20 text-blue-400 font-mono px-2 py-0.5 rounded-full">{c.code}</span>
                      {parentName && (
                        <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded">فرعية من: {parentName}</span>
                      )}
                    </div>
                    {c.description && <p className="text-xs text-slate-400 mt-1">{c.description}</p>}
                  </div>
                  <button 
                    onClick={() => handleDeleteCategory(c.id, c.name)}
                    className="p-1.5 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors"
                    title="حذف"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Product Groups Panel */}
      <div className="bg-[#151b2b] border border-[#1e293b] rounded-2xl p-6 space-y-6">
        <div className="flex items-center gap-3 border-b border-[#1e293b] pb-4">
          <div className="w-10 h-10 bg-purple-500/10 text-purple-400 rounded-xl flex items-center justify-center">
            <Layers size={20} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">إدارة مجموعات المنتجات (Product Groups)</h3>
            <p className="text-xs text-slate-400">تجميع المنتجات حسب الخطوط الإنتاجية والنوع</p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleAddGroup} className="space-y-4 bg-[#0b0f17] p-4 rounded-xl border border-[#1e293b]">
          <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">إضافة مجموعة جديدة</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-400 block mb-1">اسم المجموعة *</label>
              <input 
                type="text" 
                value={groupName} 
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="مثل: أجهزة محمولة"
                className="w-full bg-[#151b2b] border border-[#1e293b] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-400 block mb-1">رمز المجموعة (Code) *</label>
              <input 
                type="text" 
                value={groupCode} 
                onChange={(e) => setGroupCode(e.target.value)}
                placeholder="GRP-101"
                className="w-full bg-[#151b2b] border border-[#1e293b] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-400 block mb-1">الربط بالفئة الرئيسية *</label>
            <select
              value={groupCatId}
              onChange={(e) => setGroupCatId(e.target.value)}
              className="w-full bg-[#151b2b] border border-[#1e293b] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
            >
              <option value="">-- اختر الفئة الرئيسية --</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-2 px-4 rounded-xl flex items-center justify-center gap-2 text-sm transition-colors"
          >
            <Plus size={16} /> إضافة المجموعة
          </button>
        </form>

        {/* List */}
        <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
          {groups.length === 0 ? (
            <div className="text-center py-6 text-slate-500 text-sm">لا توجد مجموعات مضافة بعد</div>
          ) : (
            groups.map((g) => (
              <div key={g.id} className="flex items-center justify-between p-3 bg-[#0b0f17] border border-[#1e293b] rounded-xl">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-sm">{g.name}</span>
                    <span className="text-[10px] bg-purple-500/20 text-purple-400 font-mono px-2 py-0.5 rounded-full">{g.code}</span>
                  </div>
                  {g.categoryName && <p className="text-xs text-slate-400 mt-1">الفئة: {g.categoryName}</p>}
                </div>
                <button 
                  onClick={() => handleDeleteGroup(g.id, g.name)}
                  className="p-1.5 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors"
                  title="حذف"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
