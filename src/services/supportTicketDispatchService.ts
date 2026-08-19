/**
 * @file supportTicketDispatchService.ts
 * @module MARO Support Ticket Dispatch & Repeating Audio-Visual Alert Engine
 * @description محرك إرسال تذاكر الدعم الفني لأرقام الدعم المخصصة والتنبيه المرئي/الصوتي المتكرر حسب الأهمية
 */

import { SupportTicket, IssueSeverity } from '../types/smartSupport';
import { soundAlerts } from '../lib/soundAlerts';
import { MaroEventBus } from '../lib/eventBus';

export interface SupportPhoneNumbersConfig {
  primarySupportNumber: string; // e.g. "+201001234567"
  whatsappSupportNumber: string; // e.g. "+201119876543"
  escalationSupportNumber: string; // e.g. "+966501234567"
  enableWhatsappDispatch: boolean;
  enableSmsDispatch: boolean;
  enableAudioAlerts: boolean;
  audioVolume: number; // 0 to 1
  repeatIntervalSeconds: {
    CRITICAL: number; // default 10 seconds
    HIGH: number; // default 20 seconds
    MEDIUM: number; // default 45 seconds
    LOW: number; // default 0 (no repeat)
  };
}

export interface ActiveTicketAlert {
  ticket: SupportTicket;
  receivedAt: string;
  lastAlertAt: string;
  alertCount: number;
  isMuted: boolean;
  isAcknowledged: boolean;
}

const STORAGE_KEYS = {
  PHONE_CONFIG: 'maro_support_phone_config',
  ACTIVE_ALERTS: 'maro_support_active_alerts'
};

const DEFAULT_CONFIG: SupportPhoneNumbersConfig = {
  primarySupportNumber: '+201001234567',
  whatsappSupportNumber: '+201119876543',
  escalationSupportNumber: '+966501234567',
  enableWhatsappDispatch: true,
  enableSmsDispatch: true,
  enableAudioAlerts: true,
  audioVolume: 0.8,
  repeatIntervalSeconds: {
    CRITICAL: 10,
    HIGH: 20,
    MEDIUM: 45,
    LOW: 0
  }
};

export class SupportTicketDispatchService {
  private static activeAlertsMap: Map<string, ActiveTicketAlert> = new Map();
  private static timerId: any = null;
  private static isInitialized = false;

  // =========================================================================
  // CONFIGURATION MANAGERS
  // =========================================================================

  public static getConfig(): SupportPhoneNumbersConfig {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PHONE_CONFIG);
      if (saved) return { ...DEFAULT_CONFIG, ...JSON.parse(saved) };
    } catch { /* ignore */ }
    return DEFAULT_CONFIG;
  }

  public static saveConfig(config: Partial<SupportPhoneNumbersConfig>): SupportPhoneNumbersConfig {
    const updated = { ...this.getConfig(), ...config };
    try {
      localStorage.setItem(STORAGE_KEYS.PHONE_CONFIG, JSON.stringify(updated));
    } catch { /* ignore */ }
    MaroEventBus.publish('SUPPORT_PHONE_CONFIG_CHANGED', updated);
    return updated;
  }

  // =========================================================================
  // DISPATCH & ALERT ENGINE
  // =========================================================================

  public static initEngine(): () => void {
    if (this.isInitialized) return () => {};
    this.isInitialized = true;

    // Load persisted unacknowledged alerts
    this.loadPersistedAlerts();

    // Start background alert loop
    this.timerId = setInterval(() => {
      this.processAlertLoop();
    }, 2000);

    return () => {
      if (this.timerId) clearInterval(this.timerId);
      this.isInitialized = false;
    };
  }

  public static dispatchNewTicket(ticket: SupportTicket): ActiveTicketAlert {
    const activeAlert: ActiveTicketAlert = {
      ticket,
      receivedAt: new Date().toISOString(),
      lastAlertAt: new Date().toISOString(),
      alertCount: 1,
      isMuted: false,
      isAcknowledged: false
    };

    this.activeAlertsMap.set(ticket.id, activeAlert);
    this.persistActiveAlerts();

    // Play initial sound alert immediately
    const config = this.getConfig();
    if (config.enableAudioAlerts) {
      soundAlerts.playSupportTicketAlarm(ticket.severity);
    }

    // Publish event for global UI overlay
    MaroEventBus.publish('NEW_SUPPORT_TICKET_ALERT', { alert: activeAlert });
    MaroEventBus.publish('ACTIVE_SUPPORT_ALERTS_UPDATED', { alerts: this.getActiveAlerts() });

    return activeAlert;
  }

  public static acknowledgeTicket(ticketId: string): void {
    const alert = this.activeAlertsMap.get(ticketId);
    if (alert) {
      alert.isAcknowledged = true;
      this.activeAlertsMap.delete(ticketId);
      this.persistActiveAlerts();
      MaroEventBus.publish('SUPPORT_TICKET_ALERT_ACKNOWLEDGED', { ticketId });
      MaroEventBus.publish('ACTIVE_SUPPORT_ALERTS_UPDATED', { alerts: this.getActiveAlerts() });
    }
  }

  public static toggleMuteTicket(ticketId: string): void {
    const alert = this.activeAlertsMap.get(ticketId);
    if (alert) {
      alert.isMuted = !alert.isMuted;
      this.persistActiveAlerts();
      MaroEventBus.publish('ACTIVE_SUPPORT_ALERTS_UPDATED', { alerts: this.getActiveAlerts() });
    }
  }

  public static getActiveAlerts(): ActiveTicketAlert[] {
    return Array.from(this.activeAlertsMap.values()).filter(a => !a.isAcknowledged);
  }

  private static processAlertLoop(): void {
    const config = this.getConfig();
    if (!config.enableAudioAlerts) return;

    const now = Date.now();
    let hasAlerted = false;

    for (const [ticketId, alert] of this.activeAlertsMap.entries()) {
      if (alert.isAcknowledged || alert.isMuted) continue;

      const severity = alert.ticket.severity || 'MEDIUM';
      const repeatInterval = config.repeatIntervalSeconds[severity] || 0;

      if (repeatInterval <= 0) continue; // No repeating for LOW severity

      const lastAlertTime = new Date(alert.lastAlertAt).getTime();
      const elapsedSeconds = (now - lastAlertTime) / 1000;

      if (elapsedSeconds >= repeatInterval) {
        // Trigger audio alert
        soundAlerts.playSupportTicketAlarm(severity);
        alert.lastAlertAt = new Date().toISOString();
        alert.alertCount++;
        hasAlerted = true;
      }
    }

    if (hasAlerted) {
      this.persistActiveAlerts();
      MaroEventBus.publish('ACTIVE_SUPPORT_ALERTS_UPDATED', { alerts: this.getActiveAlerts() });
    }
  }

  // =========================================================================
  // WHATSAPP & SMS DISPATCH URL GENERATOR
  // =========================================================================

  public static getWhatsAppDispatchUrl(ticket: SupportTicket, customNumber?: string): string {
    const config = this.getConfig();
    const phone = customNumber || config.whatsappSupportNumber || config.primarySupportNumber;
    const cleanPhone = phone.replace(/[^0-9]/g, '');

    const severityEmadis = {
      CRITICAL: '🔴 [حرج جداً - عاجل]',
      HIGH: '🟠 [مرتفع - هام]',
      MEDIUM: '🟡 [متوسط]',
      LOW: '🟢 [عادي]'
    };

    const text = `🚨 *بلاغ دعم فني جديد - MARO ERP* 🚨\n\n` +
      `🎫 *رقم التذكرة:* ${ticket.ticketNumber}\n` +
      `⚠️ *درجة الأهمية:* ${severityEmadis[ticket.severity] || ticket.severity}\n` +
      `🏢 *المنشأة/الشركة:* ${ticket.companyName || 'مؤسسة تجارية'}\n` +
      `📍 *الفرع:* ${ticket.branchName || 'الفرع الرئيسي'}\n` +
      `👤 *المستخدم:* ${ticket.userName}\n` +
      `📁 *الموديول:* ${ticket.module}\n` +
      `📝 *العنوان:* ${ticket.title}\n\n` +
      `🔍 *الوصف:* ${ticket.description}\n\n` +
      `⏰ *تاريخ البلاغ:* ${new Date(ticket.createdAt).toLocaleString('ar-EG')}\n` +
      `-----------------------------------\n` +
      `يرجى اتخاذ الإجراء السريع والمعالجة.`;

    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
  }

  public static getSmsDispatchUrl(ticket: SupportTicket, customNumber?: string): string {
    const config = this.getConfig();
    const phone = customNumber || config.primarySupportNumber;
    const cleanPhone = phone.replace(/[^0-9]/g, '');

    const text = `[MARO ERP] بلاغ دعم فني جديد #${ticket.ticketNumber} - الأهمية: ${ticket.severity} - الفرع: ${ticket.branchName} - ${ticket.title}`;
    return `sms:${cleanPhone}?body=${encodeURIComponent(text)}`;
  }

  // =========================================================================
  // LOCAL STORAGE PERSISTENCE
  // =========================================================================

  private static persistActiveAlerts(): void {
    try {
      const list = Array.from(this.activeAlertsMap.values());
      localStorage.setItem(STORAGE_KEYS.ACTIVE_ALERTS, JSON.stringify(list));
    } catch { /* ignore */ }
  }

  private static loadPersistedAlerts(): void {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ACTIVE_ALERTS);
      if (saved) {
        const list: ActiveTicketAlert[] = JSON.parse(saved);
        list.forEach(a => {
          if (!a.isAcknowledged) {
            this.activeAlertsMap.set(a.ticket.id, a);
          }
        });
      }
    } catch { /* ignore */ }
  }
}
