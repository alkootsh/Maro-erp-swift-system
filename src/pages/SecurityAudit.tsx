/**
 * @file SecurityAudit.tsx
 * @module واجهات وصفحات النظام (UI Pages)
 * @description ملف جزء من نظام MARO ERP. الوظيفة: SecurityAudit.tsx.
 */
// MARO ERP - Realtime Security Audit Log Viewer & Alert Console
import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  Search, 
  Filter, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Laptop, 
  Eye, 
  FileText, 
  Bell,
  RefreshCw,
  X
} from 'lucide-react';
import { SecurityEngine } from '../lib/securityEngine';
import { DetailedAuditRecord, SecurityAlert } from '../types/security';
import { cn } from '../lib/utils';

export const SecurityAudit: React.FC = () => {
  const [auditLogs, setAuditLogs] = useState<DetailedAuditRecord[]>([]);
  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedModule, setSelectedModule] = useState('ALL');
  const [selectedRecord, setSelectedRecord] = useState<DetailedAuditRecord | null>(null);

  const loadData = () => {
    setAuditLogs(SecurityEngine.getAuditRecords());
    setAlerts(SecurityEngine.getSecurityAlerts());
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleMarkAlertsRead = () => {
    SecurityEngine.markAlertsRead();
    setAlerts(SecurityEngine.getSecurityAlerts());
  };

  const filteredLogs = auditLogs.filter(log => {
    const matchesSearch = 
      log.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.module.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.documentNo && log.documentNo.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesModule = selectedModule === 'ALL' || log.module === selectedModule;
    return matchesSearch && matchesModule;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#151b2b] border border-[#1e293b] p-6 rounded-3xl shadow-2xl">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-red-600/10 border border-red-500/30 text-red-400 rounded-2xl">
            <ShieldAlert size={28} />
          </div>
          <div>
            <h2 className="text-xl font-black text-white tracking-tight">سجل المراجعة والتنبيهات الأمنية (Audit & Security Console)</h2>
            <p className="text-xs text-slate-400 mt-1">تتبع مستمر لجميع العمليات، التعديلات، إغلاق الورديات، وتنبيهات الاختراق</p>
          </div>
        </div>

        <button 
          onClick={loadData}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#1e293b] hover:bg-[#334155] text-slate-300 rounded-2xl text-xs font-bold transition-all"
        >
          <RefreshCw size={16} />
          <span>تحديث السجل</span>
        </button>
      </div>

      {/* Security Alerts Stream */}
      {alerts.length > 0 && (
        <div className="bg-[#151b2b] border border-amber-500/30 rounded-3xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-amber-400 font-black text-xs uppercase tracking-wider">
              <Bell size={18} />
              <span>التنبيهات الأمنية الحية ({alerts.filter(a => !a.read).length} غير مقروء)</span>
            </div>
            <button onClick={handleMarkAlertsRead} className="text-[10px] text-slate-400 hover:text-white font-bold uppercase">
              تحديد الكل كمقروء
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {alerts.slice(0, 4).map(alert => (
              <div 
                key={alert.id}
                className={cn(
                  "p-4 rounded-2xl border flex items-start gap-3 transition-all",
                  alert.severity === 'critical' ? "bg-red-500/10 border-red-500/30 text-red-400" : "bg-amber-500/10 border-amber-500/30 text-amber-400"
                )}
              >
                <AlertTriangle size={20} className="shrink-0 mt-0.5" />
                <div className="text-right flex-1">
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-xs">{alert.title}</p>
                    <span className="text-[10px] opacity-70 font-mono">{new Date(alert.timestamp).toLocaleTimeString('ar-EG')}</span>
                  </div>
                  <p className="text-[11px] opacity-80 mt-1">{alert.details}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative flex-1 w-full">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
          <input 
            type="text" 
            placeholder="البحث باسم المستخدم، الإجراء، المستند، الموديول..."
            className="w-full pr-10 pl-4 py-3 bg-[#151b2b] border border-[#1e293b] rounded-2xl text-white text-xs outline-none focus:border-blue-500 transition-all placeholder:text-slate-600"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <select 
          className="w-full md:w-48 py-3 px-4 bg-[#151b2b] border border-[#1e293b] rounded-2xl text-white text-xs font-bold outline-none"
          value={selectedModule}
          onChange={(e) => setSelectedModule(e.target.value)}
        >
          <option value="ALL">جميع الموديولات</option>
          <option value="POS">شاشة البيع (POS)</option>
          <option value="INVENTORY">المخازن (Inventory)</option>
          <option value="SALES">المبيعات (Sales)</option>
          <option value="PURCHASES">المشتريات (Purchases)</option>
          <option value="ACCOUNTING">المحاسبة (Accounting)</option>
          <option value="SECURITY">الأمان (Security)</option>
        </select>
      </div>

      {/* Audit Log Table */}
      <div className="bg-[#151b2b] rounded-3xl border border-[#1e293b] shadow-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-[#0f172a]/50 text-slate-500 font-bold uppercase text-[10px] tracking-widest border-b border-[#1e293b]">
              <tr>
                <th className="px-6 py-4">التاريخ والوقت</th>
                <th className="px-6 py-4">المستخدم</th>
                <th className="px-6 py-4">الموديول</th>
                <th className="px-6 py-4">الإجراء</th>
                <th className="px-6 py-4">مستند / رقم</th>
                <th className="px-6 py-4">النتيجة</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e293b]">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-600 font-medium">
                    لا توجد سجلات مراجعة مطابقة للبحث
                  </td>
                </tr>
              ) : (
                filteredLogs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-800/30 transition-colors group">
                    <td className="px-6 py-4 font-mono text-slate-400 text-[11px]">
                      {new Date(log.timestamp).toLocaleString('ar-EG')}
                    </td>
                    <td className="px-6 py-4 font-bold text-white">
                      {log.userEmail}
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[10px] font-mono uppercase font-bold">
                        {log.module}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-300">
                      {log.action}
                    </td>
                    <td className="px-6 py-4 font-mono text-slate-400">
                      {log.documentNo || log.screen || '-'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border flex items-center gap-1 w-fit",
                        log.success ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-red-500/10 text-red-400 border-red-500/20"
                      )}>
                        {log.success ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                        <span>{log.success ? 'ناجح' : 'فشل'}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button 
                        onClick={() => setSelectedRecord(log)}
                        className="p-2 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl transition-colors"
                      >
                        <Eye size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Inspector Drawer */}
      {selectedRecord && (
        <div className="fixed inset-0 bg-[#0b0f1a]/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#151b2b] border border-[#1e293b] rounded-3xl max-w-lg w-full p-6 space-y-6 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-[#1e293b] pb-4">
              <h3 className="font-bold text-white text-sm">تفاصيل عملية المراجعة</h3>
              <button onClick={() => setSelectedRecord(null)} className="p-2 text-slate-500 hover:text-white rounded-xl">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 font-mono text-xs">
              <div className="p-3 bg-[#0f172a] rounded-xl border border-[#1e293b]">
                <p className="text-slate-500 text-[10px] uppercase">User & Role</p>
                <p className="text-white font-bold">{selectedRecord.userEmail} ({selectedRecord.userRole})</p>
              </div>

              <div className="p-3 bg-[#0f172a] rounded-xl border border-[#1e293b]">
                <p className="text-slate-500 text-[10px] uppercase">Action & Module</p>
                <p className="text-amber-400 font-bold">{selectedRecord.action} @ {selectedRecord.module}</p>
              </div>

              <div className="p-3 bg-[#0f172a] rounded-xl border border-[#1e293b]">
                <p className="text-slate-500 text-[10px] uppercase">Device & IP</p>
                <p className="text-slate-300 font-bold">{selectedRecord.ipAddress} | {selectedRecord.computerName} | {selectedRecord.operatingSystem}</p>
              </div>

              {selectedRecord.oldValue && (
                <div className="p-3 bg-[#0f172a] rounded-xl border border-[#1e293b]">
                  <p className="text-slate-500 text-[10px] uppercase">Old Value</p>
                  <p className="text-red-400 font-bold break-all">{selectedRecord.oldValue}</p>
                </div>
              )}

              {selectedRecord.newValue && (
                <div className="p-3 bg-[#0f172a] rounded-xl border border-[#1e293b]">
                  <p className="text-slate-500 text-[10px] uppercase">New Value</p>
                  <p className="text-emerald-400 font-bold break-all">{selectedRecord.newValue}</p>
                </div>
              )}

              <div className="p-3 bg-[#0f172a] rounded-xl border border-[#1e293b]">
                <p className="text-slate-500 text-[10px] uppercase">Execution Duration</p>
                <p className="text-blue-400 font-bold">{selectedRecord.executionDurationMs} ms</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
