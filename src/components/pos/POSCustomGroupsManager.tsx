/**
 * @file POSCustomGroupsManager.tsx
 * @module POS Custom User Groups & Categories
 * @description مكون إدارة المجموعات والتصنيفات المخصصة من قبل المستخدم في شاشات البيع (مثل: أصناف بدون باركود، أصناف سريعة البيع)
 */

import React, { useState, useEffect } from 'react';
import { Layers, Plus, Trash2, Edit3, Check, X, Search, Sparkles, Tag, Package, Zap, Scale, CheckSquare, Square } from 'lucide-react';
import { ProductMaster } from '../../types/productMaster';
import { formatCurrency, playSystemChime } from '../../lib/utils';

export interface POSCustomGroup {
  id: string;
  name: string;
  description?: string;
  badgeColor: string; // e.g., 'bg-amber-500', 'bg-emerald-500', 'bg-blue-500', 'bg-purple-500'
  iconName: string; // 'Zap' | 'Scale' | 'Tag' | 'Package' | 'Layers'
  productIds: string[];
}

export const DEFAULT_POS_GROUPS: POSCustomGroup[] = [
  {
    id: 'grp_no_barcode',
    name: 'أصناف بدون باركود',
    description: 'المنتجات التي تباع بالوزن أو بالقطعة بدون ملصق باركود',
    badgeColor: 'bg-amber-500',
    iconName: 'Scale',
    productIds: []
  },
  {
    id: 'grp_fast_selling',
    name: 'أصناف سريعة البيع',
    description: 'أهم الأصناف الأكثر طلباً وتكراراً على الكاشير',
    badgeColor: 'bg-emerald-500',
    iconName: 'Zap',
    productIds: []
  },
  {
    id: 'grp_scale_items',
    name: 'أصناف الميزان والوزن',
    description: 'المنتجات المباعة بالجرام والكيلو مثل اللحوم والأجبان والخضروات',
    badgeColor: 'bg-blue-500',
    iconName: 'Scale',
    productIds: []
  }
];

export class POSCustomGroupService {
  private static STORAGE_KEY = 'maro_pos_custom_user_groups';

  public static getGroups(products: ProductMaster[] = []): POSCustomGroup[] {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY);
      if (saved) {
        const parsed: POSCustomGroup[] = JSON.parse(saved);
        if (parsed && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('Error reading custom groups:', e);
    }

    // Auto seed default groups if empty
    const seeded = [...DEFAULT_POS_GROUPS];
    if (products.length > 0) {
      // Auto assign non-barcoded or weighted items to 'grp_no_barcode' & 'grp_scale_items'
      const scaleIds = products.filter(p => (p as any).isWeighted || p.allowFraction || p.units?.[0]?.name === 'كجم' || !p.barcode).map(p => p.id);
      const fastIds = products.slice(0, 8).map(p => p.id);

      seeded[0].productIds = scaleIds;
      seeded[1].productIds = fastIds;
      seeded[2].productIds = scaleIds;
    }

    this.saveGroups(seeded);
    return seeded;
  }

  public static saveGroups(groups: POSCustomGroup[]) {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(groups));
      window.dispatchEvent(new CustomEvent('maro:pos-custom-groups-updated', { detail: groups }));
    } catch (e) {
      console.error('Error saving custom groups:', e);
    }
  }
}

interface POSCustomGroupsManagerProps {
  isOpen: boolean;
  onClose: () => void;
  products: ProductMaster[];
  onGroupsChanged: (groups: POSCustomGroup[]) => void;
}

export const POSCustomGroupsManager: React.FC<POSCustomGroupsManagerProps> = ({
  isOpen,
  onClose,
  products,
  onGroupsChanged
}) => {
  const [groups, setGroups] = useState<POSCustomGroup[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');
  const [searchProductQuery, setSearchProductQuery] = useState('');
  
  // New Group Form State
  const [isAddingNewGroup, setIsAddingNewGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupBadgeColor, setNewGroupBadgeColor] = useState('bg-[#151b2b]');
  const [newGroupIcon, setNewGroupIcon] = useState('Tag');

  useEffect(() => {
    const loaded = POSCustomGroupService.getGroups(products);
    setGroups(loaded);
    if (loaded.length > 0) {
      setSelectedGroupId(loaded[0].id);
    }
  }, [isOpen, products]);

  if (!isOpen) return null;

  const currentGroup = groups.find(g => g.id === selectedGroupId);

  const handleCreateGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;

    const newGroup: POSCustomGroup = {
      id: `grp_${Date.now()}`,
      name: newGroupName.trim(),
      description: 'مجموعة مخصصة أنشأها المستخدم',
      badgeColor: newGroupBadgeColor,
      iconName: newGroupIcon,
      productIds: []
    };

    const updated = [...groups, newGroup];
    setGroups(updated);
    POSCustomGroupService.saveGroups(updated);
    onGroupsChanged(updated);
    setSelectedGroupId(newGroup.id);
    setNewGroupName('');
    setIsAddingNewGroup(false);
    playSystemChime('confirm');
  };

  const handleDeleteGroup = (groupId: string) => {
    if (!window.confirm('هل أنت تأكد من حذف هذه المجموعة المخصصة؟')) return;
    const updated = groups.filter(g => g.id !== groupId);
    setGroups(updated);
    POSCustomGroupService.saveGroups(updated);
    onGroupsChanged(updated);
    if (updated.length > 0) setSelectedGroupId(updated[0].id);
  };

  const handleToggleProductInGroup = (productId: string) => {
    if (!selectedGroupId) return;

    const updated = groups.map(g => {
      if (g.id === selectedGroupId) {
        const exists = g.productIds.includes(productId);
        const newProductIds = exists
          ? g.productIds.filter(id => id !== productId)
          : [...g.productIds, productId];
        return { ...g, productIds: newProductIds };
      }
      return g;
    });

    setGroups(updated);
    POSCustomGroupService.saveGroups(updated);
    onGroupsChanged(updated);
  };

  const filteredProducts = products.filter(p => {
    if (!searchProductQuery.trim()) return true;
    const q = searchProductQuery.toLowerCase();
    return p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q) || (p.category && p.category.toLowerCase().includes(q));
  });

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4 font-sans text-right dir-rtl">
      <div className="bg-[#151b2b] w-full max-w-4xl rounded-3xl border border-[#1e293b] shadow-2xl p-6 space-y-6 flex flex-col h-[85vh] animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#1e293b] pb-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-purple-600/30">
              <Layers size={22} />
            </div>
            <div>
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <span>إدارة المجموعات والتصنيفات المخصصة بالـ POS</span>
                <span className="text-[10px] bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded-full font-mono border border-purple-500/30">User-Defined Categories</span>
              </h3>
              <p className="text-xs text-slate-400">قم بإنشاء وتخصيص مجموعات سريعة (مثل: أصناف بدون باركود، أصناف سريعة البيع) وتنسيق منتجاتها</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-xl bg-slate-800 hover:bg-slate-700 transition-all">
            <X size={18} />
          </button>
        </div>

        {/* Main Body Grid */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6 overflow-hidden">
          {/* Left Column: Custom Groups List */}
          <div className="bg-[#0b0f19] border border-[#1e293b] rounded-2xl p-4 flex flex-col space-y-3 overflow-hidden">
            <div className="flex justify-between items-center pb-2 border-b border-[#1e293b]">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Tag size={14} className="text-purple-400" />
                <span>المجموعات الحالية ({groups.length}):</span>
              </span>
              <button
                onClick={() => setIsAddingNewGroup(prev => !prev)}
                className="px-2.5 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-[11px] font-bold flex items-center gap-1 transition-all"
              >
                <Plus size={14} />
                <span>مجموعة جديدة</span>
              </button>
            </div>

            {/* New Group Form */}
            {isAddingNewGroup && (
              <form onSubmit={handleCreateGroup} className="bg-slate-800/80 p-3 rounded-xl border border-purple-500/40 space-y-2 animate-in fade-in slide-in-from-top-2">
                <label className="text-[10px] font-bold text-purple-300">اسم المجموعة الجديدة:</label>
                <input
                  type="text"
                  placeholder="مثال: مخبوزات الصباح، أصناف بدون باركود..."
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  className="w-full p-2 bg-[#151b2b] border border-slate-700 rounded-lg text-white text-xs"
                  autoFocus
                />
                <div className="flex items-center gap-1.5 pt-1">
                  <button type="submit" className="flex-1 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-bold">
                    حفظ المجموعة
                  </button>
                  <button type="button" onClick={() => setIsAddingNewGroup(false)} className="px-2.5 py-1.5 bg-slate-700 text-slate-300 rounded-lg text-xs">
                    إلغاء
                  </button>
                </div>
              </form>
            )}

            {/* Groups Item List */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {groups.map((group) => {
                const isSelected = group.id === selectedGroupId;
                return (
                  <div
                    key={group.id}
                    onClick={() => setSelectedGroupId(group.id)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between group ${
                      isSelected
                        ? 'bg-gradient-to-r from-purple-900/40 to-indigo-900/40 border-purple-500/60 text-white shadow-md'
                        : 'bg-slate-800/60 border-slate-700/50 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={`w-3 h-3 rounded-full ${group.badgeColor}`} />
                      <div>
                        <h4 className="font-bold text-xs">{group.name}</h4>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {group.productIds.length} أصناف مضافة
                        </span>
                      </div>
                    </div>
                    {groups.length > 1 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteGroup(group.id);
                        }}
                        className="p-1 text-slate-500 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="حذف المجموعة"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Product Assignment Grid */}
          <div className="md:col-span-2 bg-[#0b0f19] border border-[#1e293b] rounded-2xl p-4 flex flex-col space-y-3 overflow-hidden">
            {currentGroup ? (
              <>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-[#1e293b]">
                  <div>
                    <h4 className="text-sm font-black text-white flex items-center gap-2">
                      <span>تخصيص منتجات مجموعة: [{currentGroup.name}]</span>
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-mono">
                        {currentGroup.productIds.length} أصناف محددة
                      </span>
                    </h4>
                    <p className="text-[11px] text-slate-400">اختر أو ألغِ تحديد الأصناف لإظهارها في هذه المجموعة على شاشة الكاشير</p>
                  </div>

                  <div className="relative w-full sm:w-48">
                    <Search size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="text"
                      placeholder="فلترة الأصناف..."
                      value={searchProductQuery}
                      onChange={(e) => setSearchProductQuery(e.target.value)}
                      className="w-full py-1.5 pr-8 pl-2 bg-[#151b2b] border border-[#1e293b] rounded-xl text-white text-xs"
                    />
                  </div>
                </div>

                {/* Product Selection List */}
                <div className="flex-1 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-2 pr-1">
                  {filteredProducts.map((p) => {
                    const isChecked = currentGroup.productIds.includes(p.id);
                    return (
                      <div
                        key={p.id}
                        onClick={() => handleToggleProductInGroup(p.id)}
                        className={`p-2.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                          isChecked
                            ? 'bg-emerald-950/30 border-emerald-500/50 text-white'
                            : 'bg-slate-800/40 border-slate-700/40 text-slate-400 hover:bg-slate-800/70'
                        }`}
                      >
                        <div className="flex items-center gap-2 overflow-hidden">
                          {isChecked ? (
                            <CheckSquare size={16} className="text-emerald-400 shrink-0" />
                          ) : (
                            <Square size={16} className="text-slate-600 shrink-0" />
                          )}
                          <div className="truncate">
                            <p className="font-bold text-xs truncate">{p.name}</p>
                            <p className="text-[10px] text-slate-500 font-mono">
                              {p.sku} | {formatCurrency(p.price)} {!p.barcode ? ' (بدون باركود)' : ''}
                            </p>
                          </div>
                        </div>

                        {isChecked && (
                          <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/20 px-1.5 py-0.5 rounded font-mono shrink-0">
                            مضمّن
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-slate-500 text-xs">
                اختر مجموعة من القائمة لإدارتها وتخصيص أصنافها
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center border-t border-[#1e293b] pt-3 shrink-0">
          <p className="text-xs text-slate-400">
            تأثير التعديل: تظهر هذه المجموعات كتبويبات سريعة فوق شبكة الأصناف بشاشات الـ POS و SmartCashier.
          </p>
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-purple-600/30 transition-all cursor-pointer"
          >
            حفظ وإغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
