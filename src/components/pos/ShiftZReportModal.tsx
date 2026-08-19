import React, { useState } from 'react';
import { X, Printer, CheckCircle, AlertTriangle, ShieldCheck, DollarSign, CreditCard, RotateCcw, Clock, Calculator } from 'lucide-react';
import { formatCurrency, formatDate } from '../../lib/utils';
import { toast } from 'react-hot-toast';

interface ShiftZReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  shiftData: {
    cashierName: string;
    terminalId: string;
    startTime: string;
    openingFloat: number;
    cashSales: number;
    cardSales: number;
    creditSales: number;
    returnsTotal: number;
    invoicesCount: number;
  };
  onCloseShiftConfirm: (closingDetails: any) => void;
}

export const ShiftZReportModal: React.FC<ShiftZReportModalProps> = ({
  isOpen,
  onClose,
  shiftData,
  onCloseShiftConfirm
}) => {
  const [actualCashInDrawer, setActualCashInDrawer] = useState<number>(
    shiftData.openingFloat + shiftData.cashSales - shiftData.returnsTotal
  );
  const [closingNotes, setClosingNotes] = useState('');

  if (!isOpen) return null;

  const expectedCash = shiftData.openingFloat + shiftData.cashSales - shiftData.returnsTotal;
  const variance = actualCashInDrawer - expectedCash; // positive = excess, negative = shortage
  const netSales = shiftData.cashSales + shiftData.cardSales + shiftData.creditSales - shiftData.returnsTotal;

  const handlePrintZReport = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <html dir="rtl" lang="ar">
        <head>
          <title>تقرير تقفيل الوردية Z-Report</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, sans-serif; padding: 20px; color: #1e293b; max-width: 400px; margin: 0 auto; }
            .header { text-align: center; border-b: 2px dashed #64748b; padding-bottom: 12px; margin-bottom: 16px; }
            .title { font-size: 18px; font-weight: bold; margin: 0; }
            .row { display: flex; justify-content: space-between; padding: 4px 0; font-size: 13px; }
            .row.bold { font-weight: bold; border-top: 1px solid #cbd5e1; border-bottom: 1px solid #cbd5e1; padding: 8px 0; margin: 6px 0; }
            .badge { text-align: center; background: #f1f5f9; padding: 6px; border-radius: 6px; margin-top: 12px; font-weight: bold; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h2 class="title">MARO ERP - تقرير الوردية Z-REPORT</h2>
            <p style="font-size:11px; color:#64748b; margin:4px 0;">تاريخ التقرير: ${formatDate(new Date())}</p>
          </div>
          <div class="row"><span>الكاشير:</span> <strong>${shiftData.cashierName}</strong></div>
          <div class="row"><span>محطة البيع:</span> <strong>${shiftData.terminalId}</strong></div>
          <div class="row"><span>وقت البدء:</span> <span>${formatDate(shiftData.startTime)}</span></div>
          <div class="row"><span>عدد الفواتير:</span> <span>${shiftData.invoicesCount} فاتورة</span></div>
          <hr style="border: 0; border-top: 1px dashed #ccc; margin: 10px 0;" />
          <div class="row"><span>رصيد بداية الدرج:</span> <span>${formatCurrency(shiftData.openingFloat)}</span></div>
          <div class="row"><span>مبيعات نقدي (كاش):</span> <span>${formatCurrency(shiftData.cashSales)}</span></div>
          <div class="row"><span>مبيعات بطاقة (فيزا):</span> <span>${formatCurrency(shiftData.cardSales)}</span></div>
          <div class="row"><span>مبيعات آجل:</span> <span>${formatCurrency(shiftData.creditSales)}</span></div>
          <div class="row" style="color:#e11d48;"><span>إجمالي المرتجعات:</span> <span>-${formatCurrency(shiftData.returnsTotal)}</span></div>
          <div class="row bold"><span>صافي مبيعات الوردية:</span> <span>${formatCurrency(netSales)}</span></div>
          <hr style="border: 0; border-top: 1px dashed #ccc; margin: 10px 0;" />
          <div class="row"><span>النقدية المتوقعة بالدرج:</span> <span>${formatCurrency(expectedCash)}</span></div>
          <div class="row"><span>النقدية الفعلية المحسوبة:</span> <span>${formatCurrency(actualCashInDrawer)}</span></div>
          <div class="row bold" style="color: ${variance === 0 ? '#16a34a' : variance > 0 ? '#0284c7' : '#dc2626'};">
            <span>الفارق (عجز/زيادة):</span> 
            <span>${variance === 0 ? '0.00 ج.م (مطابق)' : formatCurrency(variance)}</span>
          </div>
          <div class="badge">تم اعتماد وتقفيل الوردية نهائياً</div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  const handleConfirmClose = () => {
    onCloseShiftConfirm({
      actualCashInDrawer,
      expectedCash,
      variance,
      netSales,
      closedAt: new Date().toISOString(),
      notes: closingNotes
    });
    toast.success('تم إغلاق الوردية وحفظ تقرير Z-Report بنجاح');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" dir="rtl">
      <div className="bg-[#0f172a] border border-slate-700 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-800/90 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">تقرير تقفيل الوردية (Z-Report)</h3>
              <p className="text-xs text-slate-400">جرد النقدية وإغلاق الوردية الحالية للكاشير</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Shift Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-800/60 border border-slate-700/60 p-3 rounded-xl">
              <span className="text-[11px] text-slate-400 block mb-1">بداية الدرج</span>
              <span className="text-sm font-bold text-white font-mono">{formatCurrency(shiftData.openingFloat)}</span>
            </div>
            <div className="bg-slate-800/60 border border-slate-700/60 p-3 rounded-xl">
              <span className="text-[11px] text-slate-400 block mb-1">مبيعات كاش</span>
              <span className="text-sm font-bold text-emerald-400 font-mono">{formatCurrency(shiftData.cashSales)}</span>
            </div>
            <div className="bg-slate-800/60 border border-slate-700/60 p-3 rounded-xl">
              <span className="text-[11px] text-slate-400 block mb-1">مبيعات فيزا</span>
              <span className="text-sm font-bold text-blue-400 font-mono">{formatCurrency(shiftData.cardSales)}</span>
            </div>
            <div className="bg-slate-800/60 border border-slate-700/60 p-3 rounded-xl">
              <span className="text-[11px] text-slate-400 block mb-1">المرتجعات</span>
              <span className="text-sm font-bold text-rose-400 font-mono">-{formatCurrency(shiftData.returnsTotal)}</span>
            </div>
          </div>

          {/* Detailed breakdown */}
          <div className="bg-slate-900/80 rounded-xl p-4 border border-slate-800 space-y-2 text-xs">
            <div className="flex justify-between items-center text-slate-300">
              <span>اسم الكاشير:</span>
              <span className="font-bold text-white">{shiftData.cashierName}</span>
            </div>
            <div className="flex justify-between items-center text-slate-300">
              <span>عدد الفواتير المنفذة:</span>
              <span className="font-bold text-white">{shiftData.invoicesCount} فاتورة</span>
            </div>
            <div className="flex justify-between items-center text-slate-300">
              <span>صافي مبيعات الوردية:</span>
              <span className="font-bold text-emerald-400 font-mono text-sm">{formatCurrency(netSales)}</span>
            </div>
          </div>

          {/* Actual cash input */}
          <div className="bg-emerald-950/30 border border-emerald-500/30 p-4 rounded-xl space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-emerald-300">
                أدخل النقدية الفعلية بالدرج عند التقفيل:
              </label>
              <span className="text-xs text-slate-400">
                المتوقع: <strong className="text-white font-mono">{formatCurrency(expectedCash)}</strong>
              </span>
            </div>
            <input
              type="number"
              value={actualCashInDrawer}
              onChange={(e) => setActualCashInDrawer(parseFloat(e.target.value) || 0)}
              className="w-full bg-slate-900 border border-emerald-500/50 rounded-lg px-4 py-2.5 text-lg font-bold text-emerald-300 text-left font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />

            {/* Variance Alert */}
            <div className={`p-3 rounded-lg flex items-center justify-between text-xs font-bold ${
              variance === 0 
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' 
                : variance > 0 
                  ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30' 
                  : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
            }`}>
              <div className="flex items-center gap-2">
                {variance === 0 ? <ShieldCheck className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                <span>
                  {variance === 0 ? 'المبلغ مطابق تماماً للدرج (بدون عجز أو زيادة)' : variance > 0 ? 'يوجد فائض بالدرج بمقدار:' : 'يوجد عجز بالدرج بمقدار:'}
                </span>
              </div>
              <span className="font-mono text-sm">{formatCurrency(Math.abs(variance))}</span>
            </div>
          </div>

          <div>
            <label className="text-xs text-slate-400 block mb-1">ملاحظات التقفيل:</label>
            <input
              type="text"
              value={closingNotes}
              onChange={(e) => setClosingNotes(e.target.value)}
              placeholder="أي ملاحظات إضافية بخصوص وردية اليوم..."
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* Footer actions */}
        <div className="px-6 py-4 bg-slate-900 border-t border-slate-800 flex items-center justify-between gap-3">
          <button
            onClick={handlePrintZReport}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold flex items-center gap-2 transition"
          >
            <Printer className="w-4 h-4" />
            <span>طباعة Z-Report</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition"
            >
              إلغاء
            </button>
            <button
              onClick={handleConfirmClose}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition shadow-lg shadow-emerald-600/20"
            >
              <CheckCircle className="w-4 h-4" />
              <span>إغلاق الوردية وحفظ التقرير</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
