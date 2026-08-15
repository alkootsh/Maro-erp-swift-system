import React, { useState } from 'react';
import { X, Check, RefreshCw, ChevronUp, ChevronDown } from 'lucide-react';
import { TableColumn } from '../lib/columns';

interface ColumnManagerModalProps {
  tableName: string;
  allColumns: TableColumn[];
  defaultVisibleKeys: string[];
  currentVisibleKeys: string[];
  currentOrderedKeys: string[];
  onSave: (visible: string[], order: string[]) => void;
  onClose: () => void;
}

export default function ColumnManagerModal({
  tableName,
  allColumns,
  defaultVisibleKeys,
  currentVisibleKeys,
  currentOrderedKeys,
  onSave,
  onClose
}: ColumnManagerModalProps) {
  const [visible, setVisible] = useState<string[]>(currentVisibleKeys);
  const [order, setOrder] = useState<string[]>(currentOrderedKeys);

  const handleToggle = (key: string) => {
    // Keep at least cashierName and id visible to avoid empty tables
    if (key === 'id' || key === 'cashierName' || key === 'actions') return;

    if (visible.includes(key)) {
      setVisible(visible.filter(k => k !== key));
    } else {
      setVisible([...visible, key]);
    }
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const newOrder = [...order];
    const temp = newOrder[index];
    newOrder[index] = newOrder[index - 1];
    newOrder[index - 1] = temp;
    setOrder(newOrder);
  };

  const handleMoveDown = (index: number) => {
    if (index === order.length - 1) return;
    const newOrder = [...order];
    const temp = newOrder[index];
    newOrder[index] = newOrder[index + 1];
    newOrder[index + 1] = temp;
    setOrder(newOrder);
  };

  const handleReset = () => {
    setVisible(defaultVisibleKeys);
    setOrder(allColumns.map(c => c.key));
  };

  const handleSave = () => {
    onSave(visible, order);
    // Persist to local storage for user preferences
    localStorage.setItem(`shifts_pref_${tableName}_visible`, JSON.stringify(visible));
    localStorage.setItem(`shifts_pref_${tableName}_order`, JSON.stringify(order));
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200" dir="rtl">
      <div className="bg-card border border-border w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="p-5 border-b border-border flex justify-between items-center bg-card2">
          <div>
            <h3 className="font-black text-base text-text-main">تخصيص أعمدة الجدول</h3>
            <p className="text-[11px] text-text-dim mt-0.5">اختر الأعمدة التي تود رؤيتها ورتب موضع ظهورها في الجدول</p>
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 hover:bg-neutral-800 rounded-xl text-text-dim hover:text-white transition-all"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-text-dim">قائمة الأعمدة المتاحة</span>
            <button
              onClick={handleReset}
              className="text-[11px] font-bold text-gold hover:text-gold2 flex items-center gap-1 transition-colors"
            >
              <RefreshCw size={12} />
              <span>إعادة الضبط الافتراضي</span>
            </button>
          </div>

          <div className="space-y-2">
            {order.map((key, idx) => {
              const col = allColumns.find(c => c.key === key);
              if (!col) return null;
              const isVisible = visible.includes(key);
              const isLocked = key === 'id' || key === 'cashierName' || key === 'actions';

              return (
                <div 
                  key={key} 
                  className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${
                    isVisible ? 'bg-gold/5 border-gold/20' : 'bg-card2 border-border/40 opacity-70'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      disabled={isLocked}
                      onClick={() => handleToggle(key)}
                      className={`w-5 h-5 rounded-md flex items-center justify-center border transition-all ${
                        isVisible 
                          ? 'bg-gold border-gold text-white' 
                          : 'border-neutral-700 hover:border-gold'
                      } ${isLocked ? 'cursor-not-allowed opacity-50 bg-neutral-800' : ''}`}
                    >
                      {isVisible && <Check size={12} strokeWidth={3} />}
                    </button>
                    <div>
                      <span className="text-xs font-bold text-text-main">{col.label}</span>
                      {isLocked && <span className="text-[9px] text-gold font-bold mr-1.5">(عمود أساسي)</span>}
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleMoveUp(idx)}
                      disabled={idx === 0}
                      className="p-1 hover:bg-neutral-800 rounded text-text-dim hover:text-white disabled:opacity-20 disabled:pointer-events-none transition-all"
                      title="تحريك لأعلى"
                    >
                      <ChevronUp size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMoveDown(idx)}
                      disabled={idx === order.length - 1}
                      className="p-1 hover:bg-neutral-800 rounded text-text-dim hover:text-white disabled:opacity-20 disabled:pointer-events-none transition-all"
                      title="تحريك لأسفل"
                    >
                      <ChevronDown size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-card2 border-t border-border flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-border text-xs font-bold text-text-dim hover:bg-card transition-all"
          >
            إلغاء
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2.5 rounded-xl bg-gold text-white text-xs font-bold hover:bg-gold2 transition-all shadow-md"
          >
            حفظ التغييرات
          </button>
        </div>

      </div>
    </div>
  );
}
