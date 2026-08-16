import React from 'react';
import { Wallet, Landmark, ArrowRightLeft } from 'lucide-react';

export const TreasuryBankDashboard: React.FC = () => {
  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white">الخزائن والبنوك</h1>
          <p className="text-sm text-slate-400">إدارة الأرصدة والحركات النقدية والبنكية</p>
        </div>
        <div className="flex gap-2">
            <button className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold">تحويل نقدية</button>
            <button className="px-4 py-2 bg-slate-800 text-white rounded-xl text-sm font-bold">إضافة خزنة/بنك</button>
        </div>
      </header>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#151b2b] p-5 rounded-2xl border border-slate-700">
            <div className="flex items-center gap-3 mb-2">
                <Wallet className="text-emerald-400" />
                <span className="text-xs font-bold text-slate-400">إجمالي النقدية (خزائن)</span>
            </div>
            <p className="text-2xl font-black text-white">150,000 ج.م</p>
        </div>
        <div className="bg-[#151b2b] p-5 rounded-2xl border border-slate-700">
            <div className="flex items-center gap-3 mb-2">
                <Landmark className="text-blue-400" />
                <span className="text-xs font-bold text-slate-400">إجمالي الأرصدة البنكية</span>
            </div>
            <p className="text-2xl font-black text-white">1,250,000 ج.م</p>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="bg-[#151b2b] border border-slate-700 rounded-3xl p-6">
        <p className="text-center text-slate-500">جاري تجهيز بيانات الخزائن والبنوك...</p>
      </div>
    </div>
  );
};
