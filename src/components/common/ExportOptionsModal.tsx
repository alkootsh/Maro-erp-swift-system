import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, Download, Table, List, Settings } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface ExportColumnDef {
  id: string;
  label: string;
  isDefaultSummary?: boolean;
}

interface ExportOptionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  columns: ExportColumnDef[];
  onExport: (selectedColumnIds: string[]) => void;
  entityName?: string;
}

export const ExportOptionsModal: React.FC<ExportOptionsModalProps> = ({
  isOpen,
  onClose,
  columns,
  onExport,
  entityName = 'البيانات'
}) => {
  const [exportMode, setExportMode] = useState<'summary' | 'detailed' | 'custom'>('summary');
  const [selectedCols, setSelectedCols] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (isOpen) {
      if (exportMode === 'summary') {
        setSelectedCols(new Set(columns.filter(c => c.isDefaultSummary).map(c => c.id)));
      } else if (exportMode === 'detailed') {
        setSelectedCols(new Set(columns.map(c => c.id)));
      }
    }
  }, [isOpen, exportMode, columns]);

  if (!isOpen) return null;

  const handleToggleCol = (id: string) => {
    setExportMode('custom');
    const newSet = new Set(selectedCols);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedCols(newSet);
  };

  const handleExport = () => {
    onExport(Array.from(selectedCols));
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <div className="bg-[#151b2b] w-full max-w-lg rounded-3xl border border-[#1e293b] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-5 border-b border-[#1e293b] flex items-center justify-between shrink-0 bg-[#0b0f17]/50">
          <div className="flex items-center gap-3 text-white">
            <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center border border-blue-500/20">
              <Download className="text-blue-400" size={20} />
            </div>
            <div>
              <h3 className="font-black text-lg">خيارات تصدير {entityName}</h3>
              <p className="text-xs text-slate-400 font-medium">حدد الأعمدة ومستوى التفاصيل المراد تصديرها</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 bg-[#1e293b] hover:bg-slate-700 text-slate-400 rounded-xl transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          
          {/* Mode Selection */}
          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={() => setExportMode('summary')}
              className={cn(
                "p-3 rounded-xl border flex flex-col items-center gap-2 transition-all text-center",
                exportMode === 'summary' 
                  ? "bg-blue-600/10 border-blue-500 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.1)]" 
                  : "bg-[#1e293b] border-transparent text-slate-400 hover:bg-slate-800"
              )}
            >
              <List size={20} />
              <div className="space-y-0.5">
                <div className="font-bold text-xs">إجمالي</div>
                <div className="text-[9px] opacity-70">البيانات الأساسية فقط</div>
              </div>
            </button>

            <button
              onClick={() => setExportMode('detailed')}
              className={cn(
                "p-3 rounded-xl border flex flex-col items-center gap-2 transition-all text-center",
                exportMode === 'detailed' 
                  ? "bg-emerald-600/10 border-emerald-500 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.1)]" 
                  : "bg-[#1e293b] border-transparent text-slate-400 hover:bg-slate-800"
              )}
            >
              <Table size={20} />
              <div className="space-y-0.5">
                <div className="font-bold text-xs">مفصل</div>
                <div className="text-[9px] opacity-70">جميع البيانات المتاحة</div>
              </div>
            </button>

            <button
              onClick={() => setExportMode('custom')}
              className={cn(
                "p-3 rounded-xl border flex flex-col items-center gap-2 transition-all text-center",
                exportMode === 'custom' 
                  ? "bg-amber-600/10 border-amber-500 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.1)]" 
                  : "bg-[#1e293b] border-transparent text-slate-400 hover:bg-slate-800"
              )}
            >
              <Settings size={20} />
              <div className="space-y-0.5">
                <div className="font-bold text-xs">مخصص</div>
                <div className="text-[9px] opacity-70">اختيار الأعمدة يدوياً</div>
              </div>
            </button>
          </div>

          {/* Columns Selection */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <h4 className="font-bold text-sm text-slate-300">الأعمدة المحددة ({selectedCols.size} من {columns.length})</h4>
              {exportMode === 'custom' && (
                <button 
                  onClick={() => setSelectedCols(new Set(columns.map(c => c.id)))}
                  className="text-xs text-blue-400 hover:text-blue-300 font-bold"
                >
                  تحديد الكل
                </button>
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-2 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
              {columns.map((col) => {
                const isSelected = selectedCols.has(col.id);
                return (
                  <button
                    key={col.id}
                    onClick={() => handleToggleCol(col.id)}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-xl border text-right transition-all",
                      isSelected
                        ? "bg-blue-600/10 border-blue-500/50 text-white"
                        : "bg-[#0b0f17] border-[#1e293b] text-slate-400 hover:bg-[#1e293b]"
                    )}
                  >
                    <div className={cn(
                      "w-4 h-4 rounded-full border flex items-center justify-center shrink-0 transition-colors",
                      isSelected ? "bg-blue-500 border-blue-500" : "border-slate-500"
                    )}>
                      {isSelected && <CheckCircle2 size={12} className="text-white" />}
                    </div>
                    <span className="font-bold text-xs truncate">{col.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-[#1e293b] bg-[#0b0f17]/50 flex gap-3 shrink-0">
          <button 
            onClick={handleExport}
            disabled={selectedCols.size === 0}
            className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-500 text-white py-3 rounded-xl font-bold text-sm shadow-lg shadow-blue-600/20 disabled:shadow-none flex items-center justify-center gap-2 transition-all"
          >
            <Download size={18} />
            <span>تصدير الآن ({selectedCols.size} أعمدة)</span>
          </button>
        </div>

      </div>
    </div>
  );
};
