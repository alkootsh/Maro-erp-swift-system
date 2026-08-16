/**
 * @file ZatcaEInvoicing.tsx
 * @module واجهات وصفحات النظام (UI Pages)
 * @description ملف جزء من نظام MARO ERP. الوظيفة: ZatcaEInvoicing.tsx.
 */
import React, { useState } from 'react';
import { 
  FileCheck, 
  QrCode, 
  ShieldCheck, 
  UploadCloud, 
  RefreshCcw, 
  Settings as SettingsIcon, 
  CheckCircle2, 
  AlertTriangle,
  FileText,
  Key,
  Server
} from 'lucide-react';
import { formatCurrency, cn } from '../lib/utils';

export const ZatcaEInvoicing: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'invoices' | 'settings'>('invoices');

  const mockInvoices = [
    { id: 'INV-2023-001', date: '2023-11-15 14:30', amount: 1500.00, customer: 'شركة الأفق التجارية', status: 'reported', type: 'B2B', hash: '8f9a2b...' },
    { id: 'INV-2023-002', date: '2023-11-15 15:45', amount: 350.50, customer: 'عميل نقدي', status: 'cleared', type: 'B2C', hash: '3c4d5e...' },
    { id: 'INV-2023-003', date: '2023-11-15 16:20', amount: 12500.00, customer: 'مؤسسة البناء الحديث', status: 'failed', type: 'B2B', hash: '1a2b3c...' },
  ];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-950 via-[#151b2b] to-[#0f172a] p-6 rounded-2xl border border-blue-900/40 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-xs border border-emerald-500/30">
              MARO Phase 14: ZATCA Integration
            </span>
          </div>
          <h1 className="text-2xl font-black text-white">الفوترة الإلكترونية (ZATCA Phase 2)</h1>
          <p className="text-xs text-slate-400 mt-1">
            تكامل مباشر مع هيئة الزكاة والضريبة والجمارك (FATOORA)، ختم التشفير (Cryptographic Stamp)، وتوليد رمز الاستجابة السريعة (QR Code).
          </p>
        </div>
        <div className="flex items-center gap-3">
           <div className="bg-[#0f172a] p-3 rounded-xl border border-slate-800 flex items-center gap-3">
             <ShieldCheck className="text-emerald-400" size={24} />
             <div>
               <p className="text-[10px] text-slate-400">حالة الربط مع الهيئة</p>
               <p className="text-xs font-bold text-emerald-400">متصل (Online)</p>
             </div>
           </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('invoices')}
          className={cn(
            "px-5 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2",
            activeTab === 'invoices' ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" : "bg-[#151b2b] text-slate-400 hover:text-white border border-slate-800"
          )}
        >
          <FileCheck size={16} />
          سجل فواتير الهيئة (B2B & B2C)
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={cn(
            "px-5 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2",
            activeTab === 'settings' ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" : "bg-[#151b2b] text-slate-400 hover:text-white border border-slate-800"
          )}
        >
          <SettingsIcon size={16} />
          إعدادات الربط والشهادات (CSID)
        </button>
      </div>

      {/* Invoices Tab */}
      {activeTab === 'invoices' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-[#151b2b] p-4 rounded-xl border border-slate-800 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center">
                <FileText size={24} />
              </div>
              <div>
                <p className="text-[10px] text-slate-400">الفواتير الضريبية (B2B)</p>
                <p className="text-xl font-bold text-white font-mono">145</p>
              </div>
            </div>
            <div className="bg-[#151b2b] p-4 rounded-xl border border-slate-800 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                <QrCode size={24} />
              </div>
              <div>
                <p className="text-[10px] text-slate-400">الفواتير المبسطة (B2C)</p>
                <p className="text-xl font-bold text-white font-mono">892</p>
              </div>
            </div>
            <div className="bg-[#151b2b] p-4 rounded-xl border border-slate-800 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-purple-500/10 text-purple-400 flex items-center justify-center">
                <UploadCloud size={24} />
              </div>
              <div>
                <p className="text-[10px] text-slate-400">بانتظار الرفع</p>
                <p className="text-xl font-bold text-white font-mono">0</p>
              </div>
            </div>
            <div className="bg-[#151b2b] p-4 rounded-xl border border-slate-800 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-red-500/10 text-red-400 flex items-center justify-center">
                <AlertTriangle size={24} />
              </div>
              <div>
                <p className="text-[10px] text-slate-400">مرفوضة / أخطاء</p>
                <p className="text-xl font-bold text-white font-mono">1</p>
              </div>
            </div>
          </div>

          <div className="bg-[#151b2b] rounded-2xl border border-slate-800 overflow-hidden">
            <div className="p-4 border-b border-slate-800 bg-[#0f172a] flex justify-between items-center">
              <h4 className="font-bold text-white text-sm">سجل التزامن المباشر</h4>
              <button className="text-xs bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-lg font-bold flex items-center gap-2 transition-all">
                <RefreshCcw size={14} /> مزامنة يدوية
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-right text-sm">
                <thead className="bg-[#151b2b] border-b border-slate-800 text-slate-400 text-xs">
                  <tr>
                    <th className="px-6 py-4 font-bold">رقم الفاتورة</th>
                    <th className="px-6 py-4 font-bold">النوع</th>
                    <th className="px-6 py-4 font-bold">العميل</th>
                    <th className="px-6 py-4 font-bold">المبلغ</th>
                    <th className="px-6 py-4 font-bold">التاريخ والوقت</th>
                    <th className="px-6 py-4 font-bold">حالة ZATCA</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {mockInvoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-[#0f172a]/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="text-white font-bold text-xs">{inv.id}</div>
                        <div className="text-[10px] text-slate-500 font-mono mt-1" title="Cryptographic Stamp">Hash: {inv.hash}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded text-[10px] font-bold">
                          {inv.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-300">{inv.customer}</td>
                      <td className="px-6 py-4 font-mono text-xs text-white font-bold">{formatCurrency(inv.amount)}</td>
                      <td className="px-6 py-4 font-mono text-xs text-slate-400">{inv.date}</td>
                      <td className="px-6 py-4">
                        <span className={cn(
                          "px-2 py-1 rounded-lg text-[10px] font-bold border flex items-center gap-1 w-max",
                          inv.status === 'cleared' ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : 
                          inv.status === 'reported' ? "bg-blue-500/10 text-blue-400 border-blue-500/20" :
                          "bg-red-500/10 text-red-400 border-red-500/20"
                        )}>
                          {inv.status === 'cleared' && <><CheckCircle2 size={12}/> Cleared (B2B)</>}
                          {inv.status === 'reported' && <><CheckCircle2 size={12}/> Reported (B2C)</>}
                          {inv.status === 'failed' && <><AlertTriangle size={12}/> مرفوضة (أخطاء تحقق)</>}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-[#151b2b] p-6 rounded-2xl border border-slate-800">
            <h3 className="font-bold text-white flex items-center gap-2 mb-6 border-b border-slate-800 pb-4">
              <Server className="text-blue-400" size={20} />
              إعدادات الاتصال (API Endpoints)
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-2">بيئة العمليات (Environment)</label>
                <select className="w-full bg-[#0f172a] border border-slate-700 rounded-xl px-4 py-2.5 text-white text-xs focus:border-blue-500 outline-none">
                  <option value="production">Production (البيئة الحية)</option>
                  <option value="simulation">Simulation (بيئة المحاكاة)</option>
                  <option value="sandbox">Sandbox (بيئة المطورين)</option>
                </select>
              </div>
              
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-2">الرقم الضريبي للمنشأة (VAT Number)</label>
                <input type="text" value="310123456700003" readOnly className="w-full bg-[#0f172a] border border-slate-700 rounded-xl px-4 py-2.5 text-slate-300 text-xs font-mono outline-none" />
              </div>
            </div>
          </div>

          <div className="bg-[#151b2b] p-6 rounded-2xl border border-slate-800">
            <h3 className="font-bold text-white flex items-center gap-2 mb-6 border-b border-slate-800 pb-4">
              <Key className="text-amber-400" size={20} />
              إدارة الشهادات (Cryptographic Stamp ID)
            </h3>
            
            <div className="bg-[#0f172a] rounded-xl border border-emerald-900/30 p-4 mb-4">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <ShieldCheck size={16} className="text-emerald-400" />
                    شهادة CSID مفعلة
                  </h4>
                  <p className="text-[10px] text-slate-400 mt-1">تاريخ الانتهاء: 15 نوفمبر 2024</p>
                </div>
                <span className="bg-emerald-500/10 text-emerald-400 px-2 py-1 rounded text-[10px] font-bold">Active</span>
              </div>
            </div>

            <button className="w-full bg-slate-800 hover:bg-slate-700 text-white py-2.5 rounded-xl text-xs font-bold transition-all flex justify-center items-center gap-2">
              <RefreshCcw size={16} /> تجديد شهادة CSID (Onboarding)
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
