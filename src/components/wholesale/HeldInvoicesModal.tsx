import React from 'react';
import { X, PlayCircle, Trash2, Clock, User, DollarSign, Package } from 'lucide-react';
import { formatCurrency, formatDate } from '../../lib/utils';

export interface HeldInvoice {
  id: string;
  heldAt: string;
  type: 'WHOLESALE' | 'POS';
  customerName: string;
  itemsCount: number;
  grandTotal: number;
  note?: string;
  cartData: any[];
  customerData?: any;
  headerDetails?: any;
}

interface HeldInvoicesModalProps {
  isOpen: boolean;
  onClose: () => void;
  heldInvoices: HeldInvoice[];
  onRestore: (invoice: HeldInvoice) => void;
  onDelete: (id: string) => void;
}

export const HeldInvoicesModal: React.FC<HeldInvoicesModalProps> = ({
  isOpen,
  onClose,
  heldInvoices,
  onRestore,
  onDelete
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" dir="rtl">
      <div className="bg-[#0f172a] border border-slate-700/80 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-800/80 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">الفواتير المعلقة (المعلقة مؤقتاً)</h3>
              <p className="text-xs text-slate-400">استرجاع أو حذف الفواتير المحفوظة مؤقتاً بالذاكرة</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-3">
          {heldInvoices.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <Clock className="w-12 h-12 mx-auto mb-3 opacity-30 text-amber-400" />
              <p className="text-sm font-semibold">لا توجد فواتير معلقة حالياً</p>
              <p className="text-xs text-slate-500 mt-1">يمكنك تعليق الفاتورة الحالية في أي وقت لاستكمالها لاحقاً</p>
            </div>
          ) : (
            heldInvoices.map((inv) => (
              <div 
                key={inv.id}
                className="bg-slate-800/50 border border-slate-700/70 hover:border-amber-500/50 rounded-xl p-4 transition flex items-center justify-between gap-4 group"
              >
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      {inv.type === 'WHOLESALE' ? 'فاتورة جملة' : 'نقطة بيع POS'}
                    </span>
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDate(inv.heldAt)}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm pt-1">
                    <div className="flex items-center gap-1.5 text-white font-semibold">
                      <User className="w-4 h-4 text-blue-400" />
                      <span>{inv.customerName || 'عميل نقدي'}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-300">
                      <Package className="w-4 h-4 text-emerald-400" />
                      <span>{inv.itemsCount} أصناف</span>
                    </div>
                  </div>

                  {inv.note && (
                    <p className="text-xs text-amber-300/80 italic">ملاحظة: {inv.note}</p>
                  )}
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-left">
                    <span className="text-xs text-slate-400 block">الإجمالي</span>
                    <span className="text-base font-bold text-emerald-400 font-mono">
                      {formatCurrency(inv.grandTotal)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 border-r border-slate-700 pr-4">
                    <button
                      onClick={() => onRestore(inv)}
                      className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition shadow-sm"
                    >
                      <PlayCircle className="w-4 h-4" />
                      <span>استرجاع</span>
                    </button>
                    <button
                      onClick={() => onDelete(inv.id)}
                      className="p-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-lg transition"
                      title="حذف الفاتورة المعلقة"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-slate-900 border-t border-slate-800 flex justify-between items-center text-xs text-slate-400">
          <span>إجمالي الفواتير المعلقة: {heldInvoices.length}</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium transition"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
