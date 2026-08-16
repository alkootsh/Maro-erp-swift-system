/**
 * @file ProcurementContracts.tsx
 * @module واجهات وصفحات النظام (UI Pages)
 * @description ملف جزء من نظام MARO ERP. الوظيفة: ProcurementContracts.tsx.
 */
import React, { useState } from 'react';
import { 
  FileSignature, 
  Truck, 
  Box, 
  ShieldCheck, 
  Plus, 
  Clock, 
  CheckCircle2, 
  AlertTriangle,
  Receipt,
  Eye,
  Check
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { formatCurrency, cn } from '../lib/utils';
import { MaroSyncEngine } from '../lib/maroSyncEngine';

export const ProcurementContracts: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'po' | 'contracts'>('po');

  const [posList, setPosList] = useState([
    { id: 'PO-2026-0901', supplier: 'الشركة السعودية للتوريدات', date: '2026-08-15', amount: 45000, status: 'approved', convertedBillId: '' },
    { id: 'PO-2026-0902', supplier: 'مؤسسة الأفق المحدودة', date: '2026-08-14', amount: 12500, status: 'pending', convertedBillId: '' },
    { id: 'PO-2026-0903', supplier: 'المصنع الوطني للتقنية', date: '2026-08-10', amount: 150000, status: 'received', convertedBillId: '' },
  ]);

  const handleConvertToBill = (poId: string) => {
    const po = posList.find(p => p.id === poId);
    if (!po) return;

    const newBill = {
      id: `bill_${Date.now()}`,
      billNumber: `BILL-${po.id.replace('PO-', '')}`,
      supplierName: po.supplier,
      date: po.date,
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      totalAmount: po.amount,
      taxAmount: po.amount * 0.14,
      grandTotal: po.amount * 1.14,
      status: 'UNPAID',
      notes: `فاتورة مشتريات صادرة بناءً على أمر الشراء رقم ${po.id}`
    };

    MaroSyncEngine.saveDocument('purchase_bills', newBill, true);

    setPosList(prev => prev.map(p => p.id === poId ? { ...p, status: 'converted', convertedBillId: newBill.billNumber } : p));
    toast.success(`تم تحويل أمر الشراء ${po.id} بنجاح إلى فاتورة مشتريات رقم ${newBill.billNumber}`);
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-950 via-[#151b2b] to-[#0f172a] p-6 rounded-2xl border border-blue-900/40 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-400 font-bold text-xs border border-blue-500/30">
              MARO Phase 16: Procurement
            </span>
          </div>
          <h1 className="text-2xl font-black text-white">إدارة المشتريات وعقود الموردين</h1>
          <p className="text-xs text-slate-400 mt-1">
            إدارة دورة المشتريات من طلب الشراء (PR) إلى أمر التوريد (PO) واستلام البضائع وتقييم الموردين.
          </p>
        </div>
        <div className="flex items-center gap-3">
           <button className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2">
             <Plus size={16} /> أمر شراء جديد (PO)
           </button>
        </div>
      </div>

      <div className="flex gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('po')}
          className={cn(
            "px-5 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2",
            activeTab === 'po' ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" : "bg-[#151b2b] text-slate-400 hover:text-white border border-slate-800"
          )}
        >
          <Box size={16} /> أوامر الشراء (Purchase Orders)
        </button>
        <button
          onClick={() => setActiveTab('contracts')}
          className={cn(
            "px-5 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2",
            activeTab === 'contracts' ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" : "bg-[#151b2b] text-slate-400 hover:text-white border border-slate-800"
          )}
        >
          <FileSignature size={16} /> عقود الموردين (Vendor Contracts)
        </button>
      </div>

      {activeTab === 'po' && (
        <div className="bg-[#151b2b] rounded-2xl border border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead className="bg-[#0f172a] border-b border-slate-800 text-slate-400 text-xs">
                <tr>
                  <th className="px-6 py-4 font-bold">رقم الأمر (PO)</th>
                  <th className="px-6 py-4 font-bold">المورد</th>
                  <th className="px-6 py-4 font-bold">التاريخ</th>
                  <th className="px-6 py-4 font-bold">القيمة الإجمالية</th>
                  <th className="px-6 py-4 font-bold">الحالة</th>
                  <th className="px-6 py-4 font-bold text-center">الإجراءات والتحويل</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {posList.map((po) => (
                  <tr key={po.id} className="hover:bg-[#0f172a]/50 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs text-blue-400 font-bold">{po.id}</td>
                    <td className="px-6 py-4 text-white font-bold text-xs">{po.supplier}</td>
                    <td className="px-6 py-4 text-slate-400 font-mono text-xs">{po.date}</td>
                    <td className="px-6 py-4 font-mono text-xs text-white font-bold">{formatCurrency(po.amount)}</td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "px-2.5 py-1 rounded-lg text-xs font-bold border flex items-center gap-1 w-max",
                        po.status === 'converted' ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                        po.status === 'approved' ? "bg-blue-500/10 text-blue-400 border-blue-500/20" :
                        po.status === 'received' ? "bg-teal-500/10 text-teal-400 border-teal-500/20" :
                        "bg-amber-500/10 text-amber-400 border-amber-500/20"
                      )}>
                        {po.status === 'converted' && <><Check size={14}/> تم التحويل لفاتورة ({po.convertedBillId})</>}
                        {po.status === 'approved' && <><CheckCircle2 size={12}/> معتمد (بانتظار الاستلام)</>}
                        {po.status === 'received' && <><Truck size={12}/> تم الاستلام بالكامل</>}
                        {po.status === 'pending' && <><Clock size={12}/> بانتظار الاعتماد</>}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {po.status === 'converted' ? (
                        <span className="text-xs text-emerald-400 font-bold flex items-center justify-center gap-1">
                          <Receipt size={14} />
                          <span>محررة بفاتورة</span>
                        </span>
                      ) : (
                        <button
                          onClick={() => handleConvertToBill(po.id)}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-600/20 flex items-center gap-1.5 mx-auto active:scale-95"
                        >
                          <Receipt size={14} />
                          <span>تحويل لفاتورة مشتريات</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'contracts' && (
        <div className="bg-[#151b2b] rounded-2xl border border-slate-800 p-8 text-center flex flex-col items-center justify-center min-h-[400px]">
          <FileSignature size={48} className="text-slate-600 mb-4" />
          <h3 className="text-lg font-bold text-white mb-2">إدارة عقود الموردين (Vendor SLAs)</h3>
          <p className="text-sm text-slate-400 max-w-md mx-auto">
            يتم إدارة اتفاقيات مستوى الخدمة (SLA)، شروط الدفع، والاعتمادات المستندية في هذه الوحدة.
          </p>
        </div>
      )}
    </div>
  );
};
