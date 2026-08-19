/**
 * @file SupportTicketAlertOverlay.tsx
 * @module MARO Support Ticket Repeating Visual & Audio Alert Overlay
 * @description شريط وتأثير التنبيه المرئي والصوتي المتكرر لتذاكر الدعم الفني حسب الأهمية
 */

import React, { useState, useEffect } from 'react';
import { 
  AlertOctagon, 
  AlertTriangle, 
  Volume2, 
  VolumeX, 
  MessageSquare, 
  PhoneCall, 
  CheckCircle2, 
  X, 
  ExternalLink, 
  Clock,
  ShieldAlert
} from 'lucide-react';
import { 
  SupportTicketDispatchService, 
  ActiveTicketAlert, 
  SupportPhoneNumbersConfig 
} from '../../services/supportTicketDispatchService';
import { MaroEventBus } from '../../lib/eventBus';

export const SupportTicketAlertOverlay: React.FC = () => {
  const [activeAlerts, setActiveAlerts] = useState<ActiveTicketAlert[]>([]);
  const [phoneConfig, setPhoneConfig] = useState<SupportPhoneNumbersConfig>(SupportTicketDispatchService.getConfig());
  const [currentAlertIndex, setCurrentAlertIndex] = useState<number>(0);
  const [isMinimized, setIsMinimized] = useState<boolean>(false);

  useEffect(() => {
    // Initialize dispatch engine
    const cleanup = SupportTicketDispatchService.initEngine();

    // Set initial active alerts
    setActiveAlerts(SupportTicketDispatchService.getActiveAlerts());

    // Subscribe to events
    const unsubAlerts = MaroEventBus.subscribe('ACTIVE_SUPPORT_ALERTS_UPDATED', (event) => {
      const alerts = (event.payload.alerts || []) as ActiveTicketAlert[];
      setActiveAlerts([...alerts]);
      if (alerts.length > 0 && currentAlertIndex >= alerts.length) {
        setCurrentAlertIndex(0);
      }
    });

    const unsubConfig = MaroEventBus.subscribe('SUPPORT_PHONE_CONFIG_CHANGED', (event) => {
      const config = event.payload.config as SupportPhoneNumbersConfig;
      if (config) {
        setPhoneConfig(config);
      }
    });

    return () => {
      cleanup();
      unsubAlerts();
      unsubConfig();
    };
  }, []);

  if (activeAlerts.length === 0) return null;

  const currentAlert = activeAlerts[currentAlertIndex] || activeAlerts[0];
  if (!currentAlert) return null;

  const ticket = currentAlert.ticket;
  const severity = ticket.severity || 'MEDIUM';

  const severityBadgeConfig = {
    CRITICAL: {
      bg: 'bg-rose-950/90 border-rose-500 text-rose-200',
      badge: 'bg-rose-500 text-white animate-pulse',
      icon: <AlertOctagon className="w-5 h-5 text-rose-400 animate-bounce" />,
      label: '🚨 تذكرة حرجة جداً (CRITICAL ALARM)'
    },
    HIGH: {
      bg: 'bg-amber-950/90 border-amber-500 text-amber-200',
      badge: 'bg-amber-500 text-black font-bold',
      icon: <AlertTriangle className="w-5 h-5 text-amber-400" />,
      label: '🟠 تذكرة مرتفعة الأهمية (HIGH ALARM)'
    },
    MEDIUM: {
      bg: 'bg-yellow-950/90 border-yellow-500 text-yellow-200',
      badge: 'bg-yellow-500 text-black',
      icon: <AlertTriangle className="w-5 h-5 text-yellow-400" />,
      label: '🟡 تذكرة متوسطة الأهمية'
    },
    LOW: {
      bg: 'bg-indigo-950/90 border-indigo-500 text-indigo-200',
      badge: 'bg-indigo-500 text-white',
      icon: <ShieldAlert className="w-5 h-5 text-indigo-400" />,
      label: '🟢 تذكرة دعم عادي'
    }
  };

  const currentSeverityStyle = severityBadgeConfig[severity] || severityBadgeConfig.MEDIUM;

  const handleAcknowledge = () => {
    SupportTicketDispatchService.acknowledgeTicket(ticket.id);
  };

  const handleToggleMute = () => {
    SupportTicketDispatchService.toggleMuteTicket(ticket.id);
  };

  const handleOpenWhatsApp = () => {
    const url = SupportTicketDispatchService.getWhatsAppDispatchUrl(ticket);
    window.open(url, '_blank');
  };

  const handleOpenSms = () => {
    const url = SupportTicketDispatchService.getSmsDispatchUrl(ticket);
    window.location.href = url;
  };

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[99999] w-[95%] max-w-2xl transition-all duration-300">
      <div className={`p-4 rounded-2xl border-2 shadow-2xl backdrop-blur-xl ${currentSeverityStyle.bg} ${severity === 'CRITICAL' ? 'animate-pulse' : ''}`}>
        
        {/* Top Header Row */}
        <div className="flex items-center justify-between gap-3 mb-2.5 pb-2.5 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            {currentSeverityStyle.icon}
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider ${currentSeverityStyle.badge}`}>
              {currentSeverityStyle.label}
            </span>
            <span className="text-xs font-mono text-slate-300 bg-black/40 px-2 py-0.5 rounded-lg border border-white/10">
              #{ticket.ticketNumber}
            </span>
            {activeAlerts.length > 1 && (
              <span className="text-[11px] font-bold text-amber-300 bg-amber-950/80 px-2 py-0.5 rounded-full border border-amber-500/30">
                تذكرة {currentAlertIndex + 1} من {activeAlerts.length}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleToggleMute}
              title={currentAlert.isMuted ? 'تفعيل الصوت' : 'كتم التنبيه الصوتي مؤقتاً'}
              className={`p-1.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-1 ${
                currentAlert.isMuted 
                  ? 'bg-rose-900/60 border-rose-500/50 text-rose-300' 
                  : 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300 hover:bg-emerald-900'
              }`}
            >
              {currentAlert.isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400 animate-pulse" />}
              <span>{currentAlert.isMuted ? 'مكتوم' : 'صوت يعمل'}</span>
            </button>

            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="p-1.5 bg-black/40 border border-white/10 hover:bg-black/60 rounded-xl text-slate-300 hover:text-white transition-colors text-xs font-bold px-2"
            >
              {isMinimized ? 'توسيع' : 'طَي'}
            </button>
          </div>
        </div>

        {/* Content Body */}
        {!isMinimized && (
          <div className="space-y-3">
            <div className="bg-black/30 p-3 rounded-xl border border-white/5 space-y-1.5">
              <div className="flex justify-between items-start">
                <h4 className="text-sm font-bold text-white leading-snug">{ticket.title}</h4>
                <div className="flex items-center gap-1 text-[11px] text-slate-400 font-mono">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  <span>تنبيه رقم {currentAlert.alertCount}</span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-300">
                <span className="font-bold text-amber-300">🏢 {ticket.companyName || 'مؤسسة تجارية'}</span>
                <span>•</span>
                <span className="text-indigo-300">📍 {ticket.branchName || 'الفرع الرئيسي'}</span>
                <span>•</span>
                <span className="text-emerald-300">👤 {ticket.userName}</span>
              </div>

              <p className="text-xs text-slate-300 line-clamp-2 bg-black/40 p-2 rounded-lg border border-white/5 font-sans leading-relaxed">
                {ticket.description}
              </p>
            </div>

            {/* Support Phone Numbers & Dispatch Actions */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-400 font-bold">أرقام الدعم المخصصة:</span>
                <span className="font-mono font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-500/30">
                  {phoneConfig.whatsappSupportNumber || phoneConfig.primarySupportNumber}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleOpenWhatsApp}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-lg shadow-emerald-900/40 transition-all cursor-pointer"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>إرسال واتساب للدعم</span>
                </button>

                <button
                  onClick={handleOpenSms}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-lg shadow-blue-900/40 transition-all cursor-pointer"
                >
                  <PhoneCall className="w-3.5 h-3.5" />
                  <span>إرسال SMS</span>
                </button>

                <button
                  onClick={handleAcknowledge}
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-lg shadow-indigo-900/40 transition-all cursor-pointer"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>إقرار واستلام التذكرة</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Carousel indicator if multiple tickets */}
        {activeAlerts.length > 1 && (
          <div className="flex justify-center items-center gap-1.5 mt-2 pt-2 border-t border-white/5">
            {activeAlerts.map((a, idx) => (
              <button
                key={a.ticket.id}
                onClick={() => setCurrentAlertIndex(idx)}
                className={`w-2.5 h-2.5 rounded-full transition-all ${
                  idx === currentAlertIndex ? 'bg-amber-400 w-5' : 'bg-slate-600 hover:bg-slate-400'
                }`}
              />
            ))}
          </div>
        )}

      </div>
    </div>
  );
};
