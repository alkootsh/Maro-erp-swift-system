/**
 * @file AlertBanner.tsx
 * @module المكونات القابلة لإعادة الاستخدام (Reusable Components)
 * @description ملف جزء من نظام MARO ERP. الوظيفة: AlertBanner.tsx.
 */
import React, { useState, useEffect } from 'react';
import { MaroSyncEngine } from '../lib/maroSyncEngine';
import { motion, AnimatePresence } from 'motion/react';
import { Info, AlertTriangle, X, CheckCircle } from 'lucide-react';
import { cn } from '../lib/utils';

export const AlertBanner: React.FC = () => {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [currentAlertIndex, setCurrentAlertIndex] = useState(0);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(() => {
    try {
      const saved = sessionStorage.getItem('maro_dismissed_alerts');
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch {
      return new Set();
    }
  });

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

  // Filter out dismissed alerts
  const visibleAlerts = alerts.filter(a => !dismissedIds.has(a.id));

  // Auto-dismiss or cycle through alerts after their duration
  useEffect(() => {
    if (visibleAlerts.length === 0) return;

    const currentAlert = visibleAlerts[currentAlertIndex] || visibleAlerts[0];
    const durationMs = (currentAlert?.duration || 10) * 1000;

    const timeout = setTimeout(() => {
      if (visibleAlerts.length > 1) {
        setCurrentAlertIndex((prev) => (prev + 1) % visibleAlerts.length);
      } else {
        // Auto-dismiss single alert after its duration
        handleDismiss(currentAlert.id);
      }
    }, durationMs);

    return () => clearTimeout(timeout);
  }, [visibleAlerts, currentAlertIndex]);

  const handleDismiss = (id: string) => {
    setDismissedIds(prev => {
      const next = new Set(prev);
      next.add(id);
      try {
        sessionStorage.setItem('maro_dismissed_alerts', JSON.stringify(Array.from(next)));
      } catch (e) {
        console.warn('Failed to save dismissed alert:', e);
      }
      return next;
    });
  };

  if (visibleAlerts.length === 0) return null;

  const alert = visibleAlerts[currentAlertIndex] || visibleAlerts[0];
  if (!alert) return null;

  return (
    <div className="fixed bottom-4 left-0 right-0 z-[100] px-8 pointer-events-none">
      <AnimatePresence mode="wait">
        <motion.div
          key={alert.id}
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className={cn(
            "max-w-3xl mx-auto p-4 rounded-2xl shadow-2xl flex items-center gap-4 border pointer-events-auto backdrop-blur-md",
            alert.type === 'info' && "bg-blue-600/95 border-blue-400 text-white shadow-blue-500/20",
            alert.type === 'warning' && "bg-amber-600/95 border-amber-400 text-white shadow-amber-500/20",
            alert.type === 'error' && "bg-red-600/95 border-red-400 text-white shadow-red-500/20",
            alert.type === 'success' && "bg-emerald-600/95 border-emerald-400 text-white shadow-emerald-500/20",
          )}
        >
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
            {alert.type === 'info' && <Info size={22} />}
            {alert.type === 'warning' && <AlertTriangle size={22} />}
            {alert.type === 'error' && <AlertTriangle size={22} />}
            {alert.type === 'success' && <CheckCircle size={22} />}
          </div>
          <div className="flex-1 text-right overflow-hidden">
            <p className="font-bold text-sm md:text-base leading-snug">{alert.message}</p>
          </div>
          {visibleAlerts.length > 1 && (
            <div className="text-[10px] font-black bg-black/20 px-2 py-1 rounded-full shrink-0 text-white/90">
              {currentAlertIndex + 1} / {visibleAlerts.length}
            </div>
          )}
          <button
            onClick={() => handleDismiss(alert.id)}
            className="p-1.5 hover:bg-black/20 rounded-lg text-white/80 hover:text-white transition-colors shrink-0"
            title="إغلاق التنبيه"
          >
            <X size={18} />
          </button>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

