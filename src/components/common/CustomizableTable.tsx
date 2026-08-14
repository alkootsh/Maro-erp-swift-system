import React, { useState, useEffect } from 'react';
import { 
  SlidersHorizontal, 
  Eye, 
  EyeOff, 
  ArrowUp, 
  ArrowDown, 
  Plus, 
  Trash2, 
  X, 
  RotateCcw, 
  Check, 
  Sparkles,
  Search
} from 'lucide-react';
import { cn } from '../../lib/utils';

export interface ColumnDef<T> {
  id: string;
  header: string;
  accessorKey?: keyof T;
  cell?: (row: T, index: number) => React.ReactNode;
  visible?: boolean;
  isCustom?: boolean;
  type?: 'text' | 'number' | 'date' | 'badge';
  sortable?: boolean;
  width?: string;
}

interface CustomizableTableProps<T> {
  tableId: string;
  tableName: string;
  columns: ColumnDef<T>[];
  data: T[];
  keyExtractor: (item: T) => string;
  emptyMessage?: string;
  onRowClick?: (item: T) => void;
  className?: string;
}

interface CustomColumnMeta {
  id: string;
  header: string;
  type: 'text' | 'number' | 'date' | 'badge';
  defaultValue: string;
}

export function CustomizableTable<T>({
  tableId,
  tableName,
  columns: initialColumns,
  data,
  keyExtractor,
  emptyMessage = 'لا توجد بيانات للعرض',
  onRowClick,
  className
}: CustomizableTableProps<T>) {
  const storageKey = `maro_table_config_${tableId}`;

  const [activeColumns, setActiveColumns] = useState<ColumnDef<T>[]>([]);
  const [customMetas, setCustomMetas] = useState<CustomColumnMeta[]>([]);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [isAddColumnOpen, setIsAddColumnOpen] = useState(false);
  const [newColHeader, setNewColHeader] = useState('');
  const [newColType, setNewColType] = useState<'text' | 'number' | 'date' | 'badge'>('text');
  const [searchTerm, setSearchTerm] = useState('');

  // Custom values stored per row ID
  const [customRowValues, setCustomRowValues] = useState<Record<string, Record<string, any>>>(() => {
    try {
      const stored = localStorage.getItem(`maro_custom_row_vals_${tableId}`);
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    loadTableConfig();
  }, [tableId]);

  const loadTableConfig = () => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.columns && Array.isArray(parsed.columns)) {
          // Merge stored column order/visibility with original definitions
          const merged: ColumnDef<T>[] = [];
          
          parsed.columns.forEach((sc: any) => {
            const original = initialColumns.find(ic => ic.id === sc.id);
            if (original) {
              merged.push({
                ...original,
                visible: sc.visible !== undefined ? sc.visible : true
              });
            } else if (sc.isCustom) {
              // Custom user-created column
              merged.push({
                id: sc.id,
                header: sc.header,
                visible: sc.visible !== undefined ? sc.visible : true,
                isCustom: true,
                type: sc.type || 'text',
                cell: (row: T) => {
                  const rowKey = keyExtractor(row);
                  const val = customRowValues[rowKey]?.[sc.id] ?? '-';
                  return <span className="text-slate-300 font-medium">{val}</span>;
                }
              });
            }
          });

          // Add any new initial columns that weren't saved before
          initialColumns.forEach(ic => {
            if (!merged.some(m => m.id === ic.id)) {
              merged.push({ ...ic, visible: true });
            }
          });

          setActiveColumns(merged);
          return;
        }
      }
    } catch (e) {
      console.warn('Failed to load table config', e);
    }

    // Default setup
    setActiveColumns(initialColumns.map(c => ({ ...c, visible: c.visible !== false })));
  };

  const saveTableConfig = (cols: ColumnDef<T>[]) => {
    try {
      const payload = {
        columns: cols.map(c => ({
          id: c.id,
          header: c.header,
          visible: c.visible !== false,
          isCustom: c.isCustom || false,
          type: c.type || 'text'
        }))
      };
      localStorage.setItem(storageKey, JSON.stringify(payload));
    } catch (e) {
      console.warn('Failed to save table config', e);
    }
  };

  const toggleColumnVisibility = (colId: string) => {
    const updated = activeColumns.map(c => 
      c.id === colId ? { ...c, visible: c.visible === false ? true : false } : c
    );
    setActiveColumns(updated);
    saveTableConfig(updated);
  };

  const moveColumn = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= activeColumns.length) return;

    const updated = [...activeColumns];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;

    setActiveColumns(updated);
    saveTableConfig(updated);
  };

  const handleAddCustomColumn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newColHeader.trim()) return;

    const customId = `custom_col_${Date.now()}`;
    const newCol: ColumnDef<T> = {
      id: customId,
      header: newColHeader.trim(),
      visible: true,
      isCustom: true,
      type: newColType,
      cell: (row: T) => {
        const rowKey = keyExtractor(row);
        const val = customRowValues[rowKey]?.[customId] ?? '-';
        return <span className="text-slate-300 font-medium">{val}</span>;
      }
    };

    const updated = [...activeColumns, newCol];
    setActiveColumns(updated);
    saveTableConfig(updated);

    setNewColHeader('');
    setIsAddColumnOpen(false);
  };

  const handleDeleteColumn = (colId: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذا العمود؟')) {
      const updated = activeColumns.filter(c => c.id !== colId);
      setActiveColumns(updated);
      saveTableConfig(updated);
    }
  };

  const handleResetLayout = () => {
    localStorage.removeItem(storageKey);
    setActiveColumns(initialColumns.map(c => ({ ...c, visible: c.visible !== false })));
  };

  const visibleCols = activeColumns.filter(c => c.visible !== false);

  return (
    <div className={cn("space-y-4", className)}>
      {/* Table Toolbar Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#151b2b] p-3 rounded-2xl border border-[#1e293b]">
        <div className="flex items-center gap-2">
          <span className="text-xs font-black text-white px-3 py-1 bg-blue-600/20 text-blue-400 rounded-xl border border-blue-500/20">
            {tableName}
          </span>
          <span className="text-xs text-slate-400">
            ({data.length} عنصر - {visibleCols.length} عمود ظاهر)
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsConfigOpen(true)}
            className="px-3.5 py-1.5 bg-[#1e293b] hover:bg-slate-700 text-slate-200 border border-[#334155] rounded-xl font-bold text-xs flex items-center gap-2 transition-all"
            title="تخصيص ترتيب وإخفاء وإضافة العمود"
          >
            <SlidersHorizontal size={14} className="text-blue-400" />
            <span>تخصيص الأعمدة ⚙️</span>
          </button>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-[#151b2b] rounded-2xl border border-[#1e293b] overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-[#1e293b] text-slate-300 font-bold uppercase border-b border-[#334155]">
              <tr>
                {visibleCols.map((col) => (
                  <th key={col.id} className="p-3.5 whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <span>{col.header}</span>
                      {col.isCustom && (
                        <span className="px-1.5 py-0.5 bg-purple-500/20 text-purple-300 text-[9px] rounded font-mono">
                          مخصص
                        </span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e293b] text-slate-200">
              {data.length === 0 ? (
                <tr>
                  <td colSpan={visibleCols.length} className="p-8 text-center text-slate-500 font-bold">
                    {emptyMessage}
                  </td>
                </tr>
              ) : (
                data.map((row, idx) => {
                  const rowKey = keyExtractor(row);
                  return (
                    <tr
                      key={rowKey}
                      onClick={() => onRowClick && onRowClick(row)}
                      className={cn(
                        "hover:bg-[#1e293b]/60 transition-colors",
                        onRowClick && "cursor-pointer"
                      )}
                    >
                      {visibleCols.map((col) => {
                        let content: React.ReactNode = null;
                        if (col.cell) {
                          content = col.cell(row, idx);
                        } else if (col.accessorKey) {
                          content = String(row[col.accessorKey] ?? '-');
                        } else {
                          content = '-';
                        }

                        return (
                          <td key={col.id} className="p-3.5 whitespace-nowrap">
                            {content}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Column Customizer Modal */}
      {isConfigOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#151b2b] w-full max-w-lg rounded-3xl border border-[#1e293b] shadow-2xl p-6 space-y-5 animate-in zoom-in-95">
            <div className="flex justify-between items-center border-b border-[#1e293b] pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-600/20 text-blue-400 rounded-xl">
                  <SlidersHorizontal size={20} />
                </div>
                <div>
                  <h3 className="font-black text-white text-base">تخصيص أعمدة الجدول ({tableName})</h3>
                  <p className="text-[11px] text-slate-400">إخفاء، ترتيب، وإضافة أي أعمدة حسب رغبتك</p>
                </div>
              </div>
              <button onClick={() => setIsConfigOpen(false)} className="text-slate-500 hover:text-white">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-3 max-h-[380px] overflow-y-auto pl-1">
              {activeColumns.map((col, idx) => (
                <div 
                  key={col.id}
                  className="flex items-center justify-between p-3 bg-[#1e293b] border border-[#334155] rounded-xl hover:border-slate-500 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => toggleColumnVisibility(col.id)}
                      className={cn(
                        "p-1.5 rounded-lg border transition-all",
                        col.visible !== false 
                          ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                          : "bg-slate-800 text-slate-500 border-slate-700"
                      )}
                      title={col.visible !== false ? "إخفاء العمود" : "إظهار العمود"}
                    >
                      {col.visible !== false ? <Eye size={16} /> : <EyeOff size={16} />}
                    </button>

                    <div>
                      <span className={cn(
                        "font-bold text-xs block",
                        col.visible !== false ? "text-white" : "text-slate-500 line-through"
                      )}>
                        {col.header}
                      </span>
                      {col.isCustom && (
                        <span className="text-[9px] text-purple-400 font-mono">عمود مخصص من المستخدم</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => moveColumn(idx, 'up')}
                      disabled={idx === 0}
                      className="p-1.5 bg-[#0f172a] hover:bg-slate-700 text-slate-300 rounded-lg disabled:opacity-30"
                      title="تحريك للأعلى"
                    >
                      <ArrowUp size={14} />
                    </button>
                    <button
                      onClick={() => moveColumn(idx, 'down')}
                      disabled={idx === activeColumns.length - 1}
                      className="p-1.5 bg-[#0f172a] hover:bg-slate-700 text-slate-300 rounded-lg disabled:opacity-30"
                      title="تحريك للأسفل"
                    >
                      <ArrowDown size={14} />
                    </button>

                    {col.isCustom && (
                      <button
                        onClick={() => handleDeleteColumn(col.id)}
                        className="p-1.5 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg border border-red-500/20"
                        title="حذف العمود المخصص"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-[#1e293b] flex items-center justify-between gap-3">
              <button
                onClick={() => setIsAddColumnOpen(true)}
                className="px-4 py-2 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 rounded-xl text-xs font-bold flex items-center gap-2"
              >
                <Plus size={14} />
                <span>إضافة عمود جديد ➕</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleResetLayout}
                  className="px-3 py-2 bg-[#1e293b] text-slate-300 rounded-xl text-xs font-bold flex items-center gap-1.5"
                >
                  <RotateCcw size={14} />
                  <span>استعادة</span>
                </button>
                <button
                  onClick={() => setIsConfigOpen(false)}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-black"
                >
                  حفظ وتطبيق
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Custom Column Modal */}
      {isAddColumnOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#151b2b] w-full max-w-md rounded-3xl border border-[#1e293b] shadow-2xl p-6 space-y-4 animate-in zoom-in-95">
            <div className="flex justify-between items-center border-b border-[#1e293b] pb-3">
              <h3 className="font-black text-white text-base">إضافة عمود مخصص جديد للجدول</h3>
              <button onClick={() => setIsAddColumnOpen(false)} className="text-slate-500 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddCustomColumn} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">اسم العمود / الرأس</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: ملاحظات السائق، التصدير، الكود الخارجي..."
                  value={newColHeader}
                  onChange={(e) => setNewColHeader(e.target.value)}
                  className="w-full bg-[#1e293b] border border-[#334155] rounded-xl px-4 py-2.5 text-white text-xs font-bold focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">نوع البيانات</label>
                <select
                  value={newColType}
                  onChange={(e) => setNewColType(e.target.value as any)}
                  className="w-full bg-[#1e293b] border border-[#334155] rounded-xl px-3 py-2.5 text-white text-xs font-bold"
                >
                  <option value="text">نص عادي (Text)</option>
                  <option value="number">رقم (Number)</option>
                  <option value="date">تاريخ (Date)</option>
                  <option value="badge">شارة / حالة (Badge)</option>
                </select>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-bold text-xs"
                >
                  إضافة العمود للجدول
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddColumnOpen(false)}
                  className="px-4 bg-[#1e293b] text-slate-300 rounded-xl font-bold text-xs"
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
}
