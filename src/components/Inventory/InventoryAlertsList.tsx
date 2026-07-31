import React from 'react';
import { AlertTriangle, ShieldAlert, Info, CheckCircle, Package, ArrowRight, X } from 'lucide-react';
import { InventoryAlert, AlertSeverity } from '../../types/inventoryIntelligence';
import { cn } from '../../lib/utils';

interface Props {
  alerts: InventoryAlert[];
  onResolve: (id: string) => void;
}

const SeverityIcon = ({ severity }: { severity: AlertSeverity }) => {
  switch (severity) {
    case 'critical': return <ShieldAlert className="text-red-500" size={20} />;
    case 'high': return <AlertTriangle className="text-amber-500" size={20} />;
    case 'medium': return <AlertTriangle className="text-yellow-500" size={20} />;
    default: return <Info className="text-blue-500" size={20} />;
  }
};

export const InventoryAlertsList: React.FC<Props> = ({ alerts, onResolve }) => {
  return (
    <div className="bg-[#151b2b] rounded-2xl border border-[#1e293b] shadow-xl overflow-hidden mt-6">
      <div className="p-4 border-b border-[#1e293b] bg-slate-900/50">
        <h3 className="font-bold text-white text-base">مركز التنبيهات الذكي</h3>
      </div>
      <div className="divide-y divide-[#1e293b]">
        {alerts.length === 0 ? (
          <div className="p-8 text-center text-slate-500 font-bold">لا توجد تنبيهات حالياً</div>
        ) : (
          alerts.map(alert => (
            <div key={alert.id} className="p-4 flex items-center justify-between hover:bg-slate-800/30 transition-colors">
              <div className="flex items-center gap-4">
                <SeverityIcon severity={alert.severity} />
                <div>
                  <p className="text-sm font-bold text-white">{alert.productName}</p>
                  <p className="text-xs text-slate-400">{alert.message}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => onResolve(alert.id)}
                  className="p-2 text-slate-400 hover:text-emerald-400 transition-colors"
                >
                  <CheckCircle size={18} />
                </button>
                <button className="p-2 text-slate-400 hover:text-blue-400 transition-colors">
                  <ArrowRight size={18} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
