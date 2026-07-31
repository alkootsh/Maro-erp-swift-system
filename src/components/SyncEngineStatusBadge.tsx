import React, { useEffect, useState } from 'react';
import { MaroSyncEngine, SyncStatusEvent } from '../lib/maroSyncEngine';
import { Database, RefreshCw, CheckCircle2, AlertTriangle, WifiOff } from 'lucide-react';
import { cn } from '../lib/utils';

export const SyncEngineStatusBadge: React.FC = () => {
  const [status, setStatus] = useState<SyncStatusEvent>(MaroSyncEngine.getStatus());

  useEffect(() => {
    const unsub = MaroSyncEngine.subscribeStatus((newStatus) => {
      setStatus(newStatus);
    });
    return () => unsub();
  }, []);

  const triggerManualSync = () => {
    MaroSyncEngine.processSyncQueue();
  };

  return (
    <div 
      onClick={triggerManualSync}
      title="اضغط لبدء المزامنة اليدوية مع PostgreSQL"
      className={cn(
        "flex items-center gap-2 px-3 py-1.5 rounded-xl text-[11px] font-bold cursor-pointer transition-all border shadow-sm select-none",
        status.state === 'OFFLINE' && "bg-amber-500/10 text-amber-400 border-amber-500/30",
        status.state === 'SYNCING' && "bg-blue-500/10 text-blue-400 border-blue-500/30",
        status.state === 'ERROR' && "bg-red-500/10 text-red-400 border-red-500/30",
        (status.state === 'IDLE' || status.state === 'COMPLETED') && "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
      )}
    >
      <div className="flex items-center gap-1.5">
        {status.state === 'OFFLINE' ? (
          <WifiOff size={14} className="animate-pulse text-amber-400" />
        ) : status.state === 'SYNCING' ? (
          <RefreshCw size={14} className="animate-spin text-blue-400" />
        ) : status.state === 'ERROR' ? (
          <AlertTriangle size={14} className="text-red-400" />
        ) : (
          <CheckCircle2 size={14} className="text-emerald-400" />
        )}
        <Database size={13} className="opacity-75" />
      </div>

      <span>
        {status.state === 'OFFLINE'
          ? 'PostgreSQL (غير متصل - offline storage active)'
          : status.state === 'SYNCING'
          ? `جاري المزامن (${status.pendingCount} معلق)`
          : status.state === 'ERROR'
          ? 'فشل المزامن (أعد المحاولة)'
          : 'MARO Sync (PostgreSQL Active)'}
      </span>
    </div>
  );
};
