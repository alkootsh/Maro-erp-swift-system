import React, { useState, useEffect } from 'react';
import { Megaphone, Bell, AlertTriangle, CheckCircle2, Info, X, ChevronRight, Settings } from 'lucide-react';
import { MaroSyncEngine } from '../lib/maroSyncEngine';
import { cn } from '../lib/utils';

export interface SystemAnnouncement {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'urgent' | 'success';
  position: 'top' | 'bottom';
  isActive: boolean;
  speedSec: number; // Duration of animation cycle in seconds
  targetBranch?: string;
  createdAt: string;
}

const DEFAULT_ANNOUNCEMENTS: SystemAnnouncement[] = [
  {
    id: 'anc_1',
    title: 'تنبيه إداري عاجل',
    message: 'تنبيه من إدارة المنظومة: يرجى إغلاق ورديات اليوم وتسليم النقدية قبل الساعة 11:59 مساءً لمطابقة الميزانية اليومية.',
    type: 'warning',
    position: 'top',
    isActive: true,
    speedSec: 25,
    createdAt: new Date().toISOString()
  },
  {
    id: 'anc_2',
    title: 'تحديث المنظومة',
    message: 'تم تفعيل نظام الكروت الذكية Smart ID ونظام الباركود للموازين الإلكترونية بنجاح في جميع الفروع.',
    type: 'info',
    position: 'top',
    isActive: true,
    speedSec: 30,
    createdAt: new Date().toISOString()
  }
];

export const SystemTickerBanner: React.FC<{ position: 'top' | 'bottom' }> = ({ position }) => {
  const [announcements, setAnnouncements] = useState<SystemAnnouncement[]>([]);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    const unsub = MaroSyncEngine.subscribe<SystemAnnouncement>('system_announcements', (data) => {
      setAnnouncements(data || []);
    });

    const local = MaroSyncEngine.getLocalCollection<SystemAnnouncement>('system_announcements');
    if (local.length === 0) {
      DEFAULT_ANNOUNCEMENTS.forEach(a => MaroSyncEngine.saveDocument('system_announcements', a, true));
      setAnnouncements(DEFAULT_ANNOUNCEMENTS);
    } else {
      setAnnouncements(local);
    }

    return () => unsub();
  }, []);

  const activeBanners = announcements.filter(a => a.isActive && a.position === position);

  if (activeBanners.length === 0 || isDismissed) return null;

  // Combine messages for continuous smooth ticker
  const combinedText = activeBanners.map(a => `📢 [${a.title}]: ${a.message}`).join('   ||   ');

  return (
    <div 
      className={cn(
        "w-full z-40 relative flex items-center overflow-hidden border-y text-xs font-bold py-2 px-4 shadow-lg backdrop-blur-md transition-all",
        position === 'top' ? "border-blue-500/30 bg-[#0f172a]/95 text-white" : "border-amber-500/30 bg-[#1e1b2e]/95 text-amber-200"
      )}
      dir="rtl"
    >
      {/* Icon Badge */}
      <div className="flex items-center gap-2 px-3 py-1 bg-blue-600 text-white rounded-xl font-black text-[11px] shrink-0 z-10 shadow-md">
        <Megaphone size={14} className="animate-bounce" />
        <span>تنبيهات النظام</span>
      </div>

      {/* Marquee Animated Ticker */}
      <div className="flex-1 overflow-hidden relative mx-4">
        <div className="animate-marquee whitespace-nowrap inline-block font-medium">
          <span className="px-8">{combinedText}</span>
          <span className="px-8">{combinedText}</span>
        </div>
      </div>

      {/* Dismiss Button */}
      <button 
        onClick={() => setIsDismissed(true)} 
        className="text-slate-400 hover:text-white p-1 rounded-lg shrink-0 z-10 hover:bg-white/10"
        title="إخفاء البنر المؤقت"
      >
        <X size={16} />
      </button>

      {/* Inline Keyframe Styles for Continuous Smooth Scrolling */}
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(-50%); }
          100% { transform: translateX(0%); }
        }
        .animate-marquee {
          display: inline-block;
          animation: marquee 35s linear infinite;
        }
        .animate-marquee:hover {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  );
};
