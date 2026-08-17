/**
 * @file SyncEngineStatusBadge.tsx
 * @module المكونات القابلة لإعادة الاستخدام (Reusable Components)
 * @description مؤشر حالة محرك المزامنة اللحظية (Offline-First / PostgreSQL Sync Engine)
 */
import React, { useEffect, useState } from 'react';
import { MaroSyncEngine, SyncStatusEvent } from '../lib/maroSyncEngine';
import { Database, RefreshCw, CheckCircle2, AlertTriangle, WifiOff } from 'lucide-react';
import { cn } from '../lib/utils';
import { toast } from 'react-hot-toast';

export const SyncEngineStatusBadge: React.FC = () => {
  const [status, setStatus] = useState<SyncStatusEvent>(MaroSyncEngine.getStatus());
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    const unsub = MaroSyncEngine.subscribeStatus((newStatus) => {
      setStatus(newStatus);
    });
    return () => unsub();
  }, []);

  const triggerManualSync = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    toast('جاري بدء مزامنة محرك MARO اللحظي...', { icon: '🔄' });
    try {
      const res = await MaroSyncEngine.forceSyncNow();
      if (res.success) {
        toast.success(res.message);
      } else {
        toast(res.message, { icon: '⚠️' });
      }
    } catch {
      toast('تم تأمين البيانات محلياً بنمط Offline-First', { icon: '💾' });
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <button
      type="button"
      onClick={triggerManualSync}
      title="اضغط لبدء المزامنة اليدوية والتحديث الفوري"
      className={cn(
        "flex items-center gap-2 px-3 py-1.5 rounded-xl text-[11px] font-bold cursor-pointer transition-all border shadow-sm select-none outline-none",
        status.state === 'OFFLINE' && "bg-amber-500/10 text-amber-400 border-amber-500/30 hover:bg-amber-500/20",
        (status.state === 'SYNCING' || isSyncing) && "bg-blue-500/10 text-blue-400 border-blue-500/30 hover:bg-blue-500/20",
        status.state === 'ERROR' && "bg-amber-500/10 text-amber-400 border-amber-500/30 hover:bg-amber-500/20",
        (status.state === 'IDLE' || status.state === 'COMPLETED') && !isSyncing && "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20"
      )}
    >
      <div className="flex items-center gap-1.5">
        {status.state === 'OFFLINE' ? (
          <WifiOff size={14} className="text-amber-400" />
        ) : (status.state === 'SYNCING' || isSyncing) ? (
          <RefreshCw size={14} className="animate-spin text-blue-400" />
        ) : status.state === 'ERROR' ? (
          <AlertTriangle size={14} className="text-amber-400" />
        ) : (
          <CheckCircle2 size={14} className="text-emerald-400" />
        )}
        <Database size={13} className="opacity-75" />
      </div>

      <span>
        {status.state === 'OFFLINE'
          ? 'وضع غير متصل (Offline Ready)'
          : (status.state === 'SYNCING' || isSyncing)
          ? `جاري المزامنة (${status.pendingCount || 0} معلق)`
          : status.state === 'ERROR'
          ? 'المزامنة المحلية مؤمنة'
          : 'مزامنة MARO (متصل ومحدث)'}
      </span>
    </button>
  );
};
