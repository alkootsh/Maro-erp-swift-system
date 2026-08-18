/**
 * @file QuickAddModal.tsx
 * @module المكونات القابلة لإعادة الاستخدام (Reusable Components)
 * @description ملف جزء من نظام MARO ERP. الوظيفة: QuickAddModal.tsx.
 */
// MARO ERP - Quick Add Modal for Categories, Groups, Brands, etc.
import React, { useState } from 'react';
import { X, Save } from 'lucide-react';
import { ProductRepository } from '../../repositories/productRepository';
import { ProductCategory } from '../../types/productMaster';
import { toast } from 'react-hot-toast';

interface QuickAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'category' | 'group' | 'brand' | 'manufacturer';
  categories?: ProductCategory[];
  onSuccess: () => void;
}

export const QuickAddModal: React.FC<QuickAddModalProps> = ({ isOpen, onClose, type, categories = [], onSuccess }) => {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [parentId, setParentId] = useState(''); // for sub-categories
  const [categoryId, setCategoryId] = useState(''); // for groups
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) {
      toast.error('الاسم مطلوب');
      return;
    }

    const finalCode = code.trim() || `${type.toUpperCase().slice(0, 3)}-${Math.floor(1000 + Math.random() * 9000)}`;

    setLoading(true);
    try {
      if (type === 'category') {
        await ProductRepository.addCategory({
          name,
          code: finalCode,
          parentId: parentId || null,
          status: 'active',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      } else if (type === 'group') {
        let catId = categoryId;
        let catName = '';
        if (catId) {
          const cat = categories.find(c => c.id === catId);
          catName = cat?.name || '';
        } else if (categories.length > 0) {
          catId = categories[0].id;
          catName = categories[0].name;
        }

        await ProductRepository.addGroup({
          name,
          code: finalCode,
          categoryId: catId || 'default-cat',
          categoryName: catName || 'فئة عامة',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      } else if (type === 'brand') {
        await ProductRepository.addBrand({
          name,
          code: finalCode,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      } else if (type === 'manufacturer') {
        await ProductRepository.addManufacturer({
          name,
          code: finalCode,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }

      toast.success('تمت الإضافة بنجاح');
      onSuccess();
      onClose();
      // Reset form
      setName('');
      setCode('');
      setParentId('');
      setCategoryId('');
    } catch (err: any) {
      toast.error('فشلت الإضافة: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const getTitle = () => {
    switch (type) {
      case 'category': return 'إضافة فئة جديدة';
      case 'group': return 'إضافة مجموعة جديدة';
      case 'brand': return 'إضافة علامة تجارية جديدة';
      case 'manufacturer': return 'إضافة جهة مصنعة جديدة';
      default: return '';
    }
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#151b2b] border border-[#1e293b] w-full max-w-md rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1e293b] bg-[#0b0f17]">
          <h3 className="text-lg font-bold text-white">{getTitle()}</h3>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-[#1e293b]">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="text-xs font-medium text-slate-400 block mb-1">الاسم *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-[#0b0f17] border border-[#1e293b] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
              required
            />
          </div>
          
          <div>
            <label className="text-xs font-medium text-slate-400 block mb-1">الرمز (Code) *</label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full bg-[#0b0f17] border border-[#1e293b] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 font-mono"
              required
            />
          </div>

          {type === 'category' && (
            <div>
              <label className="text-xs font-medium text-slate-400 block mb-1">الفئة الأب (لتصنيف فرعي)</label>
              <select
                value={parentId}
                onChange={(e) => setParentId(e.target.value)}
                className="w-full bg-[#0b0f17] border border-[#1e293b] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
              >
                <option value="">-- فئة رئيسية --</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          )}

          {type === 'group' && (
            <div>
              <label className="text-xs font-medium text-slate-400 block mb-1">الفئة المرتبطة *</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full bg-[#0b0f17] border border-[#1e293b] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                required
              >
                <option value="">-- اختر الفئة --</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          )}

          <div className="pt-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center gap-2"
            >
              <Save size={16} /> {loading ? 'جاري الحفظ...' : 'حفظ'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
