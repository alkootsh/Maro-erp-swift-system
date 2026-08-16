/**
 * @file Transactions.tsx
 * @module واجهات وصفحات النظام (UI Pages)
 * @description ملف جزء من نظام MARO ERP. الوظيفة: Transactions.tsx.
 */
import React, { useEffect, useState } from 'react';
import { 
  Plus, 
  Search, 
  Wallet, 
  ArrowUpRight, 
  ArrowDownRight, 
  X, 
  Calendar, 
  BookOpen, 
  PieChart 
} from 'lucide-react';
import { formatCurrency, formatDate, cn } from '../lib/utils';
import { AccountingService, Account, JournalEntry } from '../services/finance/accountingService';
import { MaroSyncEngine } from '../lib/maroSyncEngine';

export const Transactions: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'ENTRIES' | 'COA'>('ENTRIES');
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [coa, setCoa] = useState<Account[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    // Sync Chart of Accounts & Journal Entries
    setCoa(AccountingService.getChartOfAccounts());
    setJournalEntries(AccountingService.getJournalEntries());

    const unsubGL = MaroSyncEngine.subscribe<JournalEntry>('journal_entries', (data) => {
      setJournalEntries(data || []);
    });
    const unsubCOA = MaroSyncEngine.subscribe<Account>('chart_of_accounts', (data) => {
      setCoa(data || []);
    });

    return () => {
      unsubGL();
      unsubCOA();
    };
  }, []);

  let totalDebits = 0;
  let totalCredits = 0;
  journalEntries.forEach(je => {
    je.lines?.forEach(l => {
      totalDebits += l.debit || 0;
      totalCredits += l.credit || 0;
    });
  });

  const filteredEntries = journalEntries.filter(e => {
    const matchesSearch = e.entryNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          e.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          e.lines?.some(l => l.accountName.toLowerCase().includes(searchTerm.toLowerCase()));
    if (startDate) {
      if (new Date(e.createdAt) < new Date(startDate)) return false;
    }
    if (endDate) {
      if (new Date(e.createdAt) > new Date(endDate)) return false;
    }
    return matchesSearch;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight">النظام المحاسبي وقيود اليومية العامة (GL)</h2>
          <p className="text-xs text-slate-400 font-bold mt-1">مزدوج القيد - متوافق مع معايير IFRS & ZATCA e-Invoicing</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-500 transition-all font-bold shadow-lg shadow-blue-600/20 text-sm"
          >
            <Plus size={18} />
            <span>إنشاء قيد محاسبي جديد</span>
          </button>
        </div>
      </div>

      {/* Tabs Header */}
      <div className="flex gap-2 border-b border-[#1e293b] pb-2">
        <button
          onClick={() => setActiveTab('ENTRIES')}
          className={cn(
            "px-5 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2",
            activeTab === 'ENTRIES' ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" : "bg-[#151b2b] text-slate-400 hover:text-white"
          )}
        >
          <BookOpen size={18} />
          <span>دفتر القيود اليومية (GL Ledger)</span>
        </button>

        <button
          onClick={() => setActiveTab('COA')}
          className={cn(
            "px-5 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2",
            activeTab === 'COA' ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" : "bg-[#151b2b] text-slate-400 hover:text-white"
          )}
        >
          <PieChart size={18} />
          <span>دليل الحسابات (Chart of Accounts)</span>
        </button>
      </div>

      {/* Overview Top Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#151b2b] p-6 rounded-2xl border border-[#1e293b]">
          <div className="flex items-center gap-3 text-slate-400 text-xs font-bold uppercase mb-2">
            <Wallet size={18} className="text-blue-400" />
            <span>إجمالي حركات المدين (Total Debits)</span>
          </div>
          <p className="text-2xl font-black text-white font-mono">{formatCurrency(totalDebits)}</p>
        </div>

        <div className="bg-[#151b2b] p-6 rounded-2xl border border-[#1e293b]">
          <div className="flex items-center gap-3 text-emerald-400/80 text-xs font-bold uppercase mb-2">
            <ArrowUpRight size={18} className="text-emerald-400" />
            <span>إجمالي حركات الدائن (Total Credits)</span>
          </div>
          <p className="text-2xl font-black text-emerald-400 font-mono">{formatCurrency(totalCredits)}</p>
        </div>

        <div className="bg-[#151b2b] p-6 rounded-2xl border border-[#1e293b]">
          <div className="flex items-center gap-3 text-slate-400 text-xs font-bold uppercase mb-2">
            <ArrowDownRight size={18} className="text-amber-400" />
            <span>حالة ميزان المراجعة (Trial Balance)</span>
          </div>
          <p className={cn(
            "text-2xl font-black font-mono",
            Math.abs(totalDebits - totalCredits) < 0.01 ? "text-emerald-400" : "text-amber-400"
          )}>
            {Math.abs(totalDebits - totalCredits) < 0.01 ? 'متوازن 100%' : 'معلق التسوية'}
          </p>
        </div>
      </div>

      {activeTab === 'ENTRIES' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="bg-[#151b2b] p-4 rounded-2xl border border-[#1e293b] flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input 
                type="text" 
                placeholder="بحث برقم القيد، الحساب، أو البيان..." 
                className="w-full pr-10 pl-4 py-2.5 bg-[#0f172a] border border-[#1e293b] rounded-xl text-white focus:outline-none focus:border-blue-500 transition-all text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-2 bg-[#0f172a] border border-[#1e293b] rounded-xl px-3 py-2 text-xs text-slate-400">
              <Calendar size={16} className="text-slate-500" />
              <span>من:</span>
              <input 
                type="date" 
                className="bg-transparent text-white outline-none [&::-webkit-calendar-picker-indicator]:invert"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
              <span>إلى:</span>
              <input 
                type="date" 
                className="bg-transparent text-white outline-none [&::-webkit-calendar-picker-indicator]:invert"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>

            {(startDate || endDate || searchTerm) && (
              <button 
                onClick={() => { setStartDate(''); setEndDate(''); setSearchTerm(''); }}
                className="p-2 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-red-400"
              >
                <X size={18} />
              </button>
            )}
          </div>

          {/* GL Table */}
          <div className="bg-[#151b2b] rounded-2xl border border-[#1e293b] shadow-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-900/50 text-slate-500 font-bold uppercase">
                  <tr>
                    <th className="px-6 py-4">رقم القيد</th>
                    <th className="px-6 py-4">المرجع</th>
                    <th className="px-6 py-4">البيان الشامل</th>
                    <th className="px-6 py-4">تفاصيل البنود (مدين / دائن)</th>
                    <th className="px-6 py-4">التاريخ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1e293b]">
                  {filteredEntries.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-slate-600 font-bold">لا توجد قيود يومية مطابقة للبحث</td>
                    </tr>
                  ) : filteredEntries.map((je) => (
                    <tr key={je.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="px-6 py-4 font-mono font-bold text-blue-400">{je.entryNumber}</td>
                      <td className="px-6 py-4 font-mono text-slate-400">{je.reference || '---'}</td>
                      <td className="px-6 py-4 font-bold text-white">{je.description}</td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          {je.lines.map((l, idx) => (
                            <div key={idx} className="flex justify-between items-center text-[11px] gap-4 font-mono">
                              <span className="text-slate-300 font-bold">{l.accountCode} - {l.accountName}:</span>
                              <div>
                                {l.debit > 0 && <span className="text-emerald-400 font-bold">مدين: {formatCurrency(l.debit)}</span>}
                                {l.credit > 0 && <span className="text-blue-400 font-bold mr-2">دائن: {formatCurrency(l.credit)}</span>}
                              </div>
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-500 font-mono">{formatDate(new Date(je.createdAt))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'COA' && (
        <div className="bg-[#151b2b] rounded-2xl border border-[#1e293b] shadow-xl overflow-hidden p-6 space-y-4">
          <h3 className="text-lg font-bold text-white">دليل الحسابات الشامل (Chart of Accounts Master)</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-900/50 text-slate-500 font-bold uppercase">
                <tr>
                  <th className="px-6 py-4">كود الحساب</th>
                  <th className="px-6 py-4">اسم الحساب (AR/EN)</th>
                  <th className="px-6 py-4">نوع الحساب</th>
                  <th className="px-6 py-4">الرصيد الحالي</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e293b]">
                {coa.map((acc) => (
                  <tr key={acc.code} className="hover:bg-slate-800/30">
                    <td className="px-6 py-4 font-mono font-black text-blue-400">{acc.code}</td>
                    <td className="px-6 py-4 font-bold text-white text-sm">{acc.name}</td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 bg-slate-800 text-slate-300 rounded font-bold">
                        {acc.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono font-black text-emerald-400 text-sm">
                      {formatCurrency(acc.balance)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Manual Journal Entry Modal */}
      {isModalOpen && (
        <CreateJournalEntryModal onClose={() => setIsModalOpen(false)} coa={coa} />
      )}
    </div>
  );
};

const CreateJournalEntryModal: React.FC<{ onClose: () => void; coa: Account[] }> = ({ onClose, coa }) => {
  const [debitAccCode, setDebitAccCode] = useState(coa[0]?.code || '11100');
  const [creditAccCode, setCreditAccCode] = useState(coa[1]?.code || '11200');
  const [amount, setAmount] = useState<number>(0);
  const [description, setDescription] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0) {
      alert('المبلغ يجب أن يكون أكبر من الصفر');
      return;
    }

    try {
      await AccountingService.postJournalEntry(
        `MANUAL-${Date.now()}`,
        description || 'قيد يومية تسوية يدوية',
        [
          { accountCode: debitAccCode, debit: amount, credit: 0 },
          { accountCode: creditAccCode, debit: 0, credit: amount }
        ]
      );

      onClose();
    } catch (err: any) {
      alert(err.message || 'حدث خطأ أثناء حفظ القيد');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#151b2b] w-full max-w-lg rounded-3xl border border-[#1e293b] shadow-2xl p-6 space-y-4">
        <div className="flex justify-between items-center border-b border-[#1e293b] pb-3">
          <h3 className="font-bold text-lg text-white">تسجيل قيد يومية يدوي (Double-Entry Journal)</h3>
          <button onClick={onClose} className="text-slate-500"><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">الحساب المدين (+ Debit)</label>
            <select
              className="w-full px-4 py-2.5 bg-[#1e293b] border border-[#334155] rounded-xl text-white outline-none focus:border-blue-500 text-sm"
              value={debitAccCode}
              onChange={(e) => setDebitAccCode(e.target.value)}
            >
              {coa.map(a => (
                <option key={a.code} value={a.code}>{a.code} - {a.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">الحساب الدائن (- Credit)</label>
            <select
              className="w-full px-4 py-2.5 bg-[#1e293b] border border-[#334155] rounded-xl text-white outline-none focus:border-blue-500 text-sm"
              value={creditAccCode}
              onChange={(e) => setCreditAccCode(e.target.value)}
            >
              {coa.map(a => (
                <option key={a.code} value={a.code}>{a.code} - {a.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">المبلغ القيد (EGP)</label>
            <input 
              required
              type="number" 
              step="0.01"
              className="w-full px-4 py-2.5 bg-[#1e293b] border border-[#334155] rounded-xl text-white font-mono text-lg font-bold text-center"
              value={amount}
              onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">بيان / شرح القيد</label>
            <input 
              required
              type="text" 
              placeholder="مثال: تسوية مصاريف نقدية من الخزينة الرئيسية..."
              className="w-full px-4 py-2.5 bg-[#1e293b] border border-[#334155] rounded-xl text-white text-sm"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="pt-2 flex gap-3">
            <button 
              type="submit"
              className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-xl font-bold shadow-lg shadow-blue-600/20"
            >
              اعتماد القيد وترحيل الدفاتر
            </button>
            <button 
              type="button"
              onClick={onClose}
              className="px-6 bg-[#1e293b] text-slate-300 py-3 rounded-xl font-bold"
            >
              إلغاء
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
