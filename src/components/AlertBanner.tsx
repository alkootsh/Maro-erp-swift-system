import React, { useState, useEffect } from 'react';
import { MaroSyncEngine } from '../lib/maroSyncEngine';
import { motion, AnimatePresence } from 'motion/react';
import { Info, AlertTriangle, X, CheckCircle } from 'lucide-react';
import { cn } from '../lib/utils';

export const AlertBanner: React.FC = () => {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [currentAlertIndex, setCurrentAlertIndex] = useState(0);

  useEffect(() => {
    const unsub = MaroSyncEngine.subscribe('settings_alerts', (items: any[]) => {
      const activeAlerts = items.filter((a: any) => a.isActive);
      setAlerts(activeAlerts);
    });
    // Fallback default alert if empty
    const local = MaroSyncEngine.getLocalCollection('settings_alerts');
    if (local.length === 0) {
      setAlerts([
        {
          id: 'def_1',
          type: 'info',
          message: 'مرحباً بك في نظام MARO Business Platform الإصدار 4.0 (PostgreSQL Offline-First)',
          duration: 10,
          isActive: true
        }
      ]);
    }
    return () => unsub();
  }, []);

  useEffect(() => {
    if (alerts.length <= 1) return;
    
    const duration = (alerts[currentAlertIndex]?.duration || 10) * 1000;
    const timeout = setTimeout(() => {
      setCurrentAlertIndex((prev) => (prev + 1) % alerts.length);
    }, duration);
    
    return () => clearTimeout(timeout);
  }, [alerts, currentAlertIndex]);

  if (alerts.length === 0) return null;

  const alert = alerts[currentAlertIndex];
  if (!alert) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] px-8 pb-4 pointer-events-none">
      <AnimatePresence mode="wait">
        <motion.div
          key={alert.id}
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className={cn(
            "max-w-4xl mx-auto p-4 rounded-2xl shadow-2xl flex items-center gap-4 border pointer-events-auto",
            alert.type === 'info' && "bg-blue-600/90 border-blue-400 text-white",
            alert.type === 'warning' && "bg-amber-600/90 border-amber-400 text-white",
            alert.type === 'error' && "bg-red-600/90 border-red-400 text-white",
            alert.type === 'success' && "bg-emerald-600/90 border-emerald-400 text-white",
          )}
        >
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
            {alert.type === 'info' && <Info size={24} />}
            {alert.type === 'warning' && <AlertTriangle size={24} />}
            {alert.type === 'error' && <X size={24} />}
            {alert.type === 'success' && <CheckCircle size={24} />}
          </div>
          <div className="flex-1 text-right overflow-hidden">
            <p className="font-black text-lg truncate">{alert.message}</p>
          </div>
          {alerts.length > 1 && (
            <div className="text-[10px] font-black bg-black/20 px-2 py-1 rounded-full shrink-0">
              {currentAlertIndex + 1} / {alerts.length}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
