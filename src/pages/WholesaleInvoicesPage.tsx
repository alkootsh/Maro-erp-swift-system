import React, { useState, useEffect } from 'react';
import { FileText, Search } from 'lucide-react';
import { WholesaleInvoiceView } from '../components/wholesale/WholesaleInvoiceView';
import { FastPosView } from '../components/pos/FastPosView';
import { SalesInvoice } from '../types/sprint8';
import { SalesRepository } from '../repositories/salesRepository';
import { formatCurrency, formatDate } from '../lib/utils';

export const WholesaleInvoicesPage: React.FC = () => {
  const [activeViewMode, setActiveViewMode] = useState<'WHOLESALE' | 'POS' | 'LIST'>('WHOLESALE');
  const [invoices, setInvoices] = useState<SalesInvoice[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    setInvoices(SalesRepository.getInvoices());
  }, [activeViewMode]);

  if (activeViewMode === 'POS') {
    return <FastPosView onSwitchMode={(mode) => setActiveViewMode(mode)} />;
  }

  if (activeViewMode === 'WHOLESALE') {
    return (
      <div className="flex flex-col min-h-screen bg-[#070b13]">
        {/* Top Header Switcher */}
        <div className="bg-[#0f172a] border-b border-slate-800 px-6 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveViewMode('WHOLESALE')}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition ${
                (activeViewMode as string) === 'WHOLESALE' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              شاشة فواتير الجملة
            </button>

            <button
              onClick={() => setActiveViewMode('POS')}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition ${
                (activeViewMode as string) === 'POS' ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              البيع السريع (Fast POS)
            </button>

            <button
              onClick={() => setActiveViewMode('LIST')}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition ${
                (activeViewMode as string) === 'LIST' ? 'bg-slate-700 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              أرشيف الفواتير السابقة ({invoices.length})
            </button>
          </div>
        </div>

        <WholesaleInvoiceView onSwitchMode={(mode) => setActiveViewMode(mode)} />
      </div>
    );
  }

  // LIST view mode
  return (
    <div className="p-6 bg-[#070b13] min-h-screen text-slate-100 font-sans space-y-6" dir="rtl">
      <div className="flex items-center justify-between bg-[#0f172a] p-4 rounded-2xl border border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-600/20 text-blue-400 rounded-xl">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">أرشيف فواتير الجملة والمبيعات</h1>
            <p className="text-xs text-slate-400">سجل كامل بجميع الفواتير الصادرة والمعتمدة</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveViewMode('WHOLESALE')}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition shadow-lg shadow-blue-600/20"
          >
            + إنشاء فاتورة جملة جديدة
          </button>
          <button
            onClick={() => setActiveViewMode('POS')}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-xl transition"
          >
            فتح الكاشير (POS)
          </button>
        </div>
      </div>

      <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-4 space-y-4">
        <div className="relative">
          <Search className="w-4 h-4 absolute right-3.5 top-3 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="ابحث برقم الفاتورة، اسم العميل..."
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pr-10 pl-4 py-2 text-xs text-slate-200 focus:outline-none"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="bg-slate-900 text-slate-400 border-b border-slate-800 font-bold">
                <th className="py-3 px-4">رقم الفاتورة</th>
                <th className="py-3 px-4">اسم العميل</th>
                <th className="py-3 px-4">التاريخ</th>
                <th className="py-3 px-4">نوع الدفع</th>
                <th className="py-3 px-4">الإجمالي (ج.م)</th>
                <th className="py-3 px-4">الحالة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {invoices
                .filter(i => !searchTerm || i.invoiceNumber.includes(searchTerm) || i.customerName?.includes(searchTerm))
                .map(inv => (
                  <tr key={inv.id} className="hover:bg-slate-800/50 transition">
                    <td className="py-3 px-4 font-mono font-bold text-blue-400">{inv.invoiceNumber}</td>
                    <td className="py-3 px-4 font-bold text-white">{inv.customerName || 'عميل كاش'}</td>
                    <td className="py-3 px-4 text-slate-400">{formatDate(inv.createdAt)}</td>
                    <td className="py-3 px-4 text-emerald-400 font-bold">{inv.paymentMethod === 'CASH' ? 'نقدي' : 'آجل'}</td>
                    <td className="py-3 px-4 font-mono font-bold text-white">{formatCurrency(inv.grandTotal)}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        {inv.status || 'معتمدة'}
                      </span>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default WholesaleInvoicesPage;
