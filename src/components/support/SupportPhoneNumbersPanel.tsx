/**
 * @file SupportPhoneNumbersPanel.tsx
 * @module MARO Support Phone Numbers & Alarm Dispatch Settings
 * @description لوحة تخصيص أرقام الدعم الفني المخصصة، إعدادات التنبيه المرئي/الصوتي المتكرر، واختبار الأصوات
 */

import React, { useState } from 'react';
import { 
  PhoneCall, 
  MessageSquare, 
  Volume2, 
  Clock, 
  Save, 
  Play, 
  ShieldAlert, 
  CheckCircle2, 
  Smartphone,
  Send
} from 'lucide-react';
import { 
  SupportTicketDispatchService, 
  SupportPhoneNumbersConfig 
} from '../../services/supportTicketDispatchService';
import { soundAlerts } from '../../lib/soundAlerts';
import { toast } from 'react-hot-toast';

export const SupportPhoneNumbersPanel: React.FC = () => {
  const [config, setConfig] = useState<SupportPhoneNumbersConfig>(SupportTicketDispatchService.getConfig());
  const [saved, setSaved] = useState<boolean>(false);

  const handleSave = () => {
    SupportTicketDispatchService.saveConfig(config);
    setSaved(true);
    soundAlerts.playSave();
    toast.success('تم حفظ وتفعيل أرقام الدعم الفني وإعدادات التنبيه التكراري بنجاح');
    setTimeout(() => setSaved(false), 3000);
  };

  const handleTestAudio = (severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL') => {
    soundAlerts.playSupportTicketAlarm(severity);
    toast.success(`جاري تشغيل صوت التنبيه التجريبي بدرجة الأهمية: ${severity}`);
  };

  return (
    <div className="bg-[#0f172a] border border-[#1e293b] rounded-2xl p-5 space-y-6 text-right">
      
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-[#1e293b]">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-400">
            <PhoneCall className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">أرقام الدعم الفني المخصصة وإعدادات التنبيه المتكرر</h3>
            <p className="text-xs text-slate-400">ربط استلام التذاكر بأرقام الواتساب والـ SMS وتفعيل الصوت والمرئيات المتكررة حسب الأهمية</p>
          </div>
        </div>

        <button
          onClick={handleSave}
          className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-lg shadow-indigo-900/40 transition-all cursor-pointer"
        >
          <Save className="w-4 h-4" />
          <span>{saved ? 'تم الحفظ ✓' : 'حفظ الإعدادات'}</span>
        </button>
      </div>

      {/* Support Phone Numbers Section */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold text-indigo-400 flex items-center gap-2">
          <Smartphone className="w-4 h-4 text-indigo-400" />
          <span>أرقام الدعم الفني المخصصة للاستلام والتوجيه (Support Phone Directory):</span>
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          <div className="bg-[#0b0f19] p-3.5 rounded-xl border border-[#1e293b] space-y-1.5">
            <label className="text-xs font-bold text-slate-300 block">الرقم الرئيسي للاتصال المباشر:</label>
            <input
              type="text"
              value={config.primarySupportNumber}
              onChange={(e) => setConfig(prev => ({ ...prev, primarySupportNumber: e.target.value }))}
              placeholder="+201001234567"
              className="w-full bg-[#070b13] border border-[#1e293b] rounded-xl px-3 py-2 text-white font-mono text-xs font-bold dir-ltr text-left"
            />
            <span className="text-[10px] text-slate-400 block">يستخدم لإرسال الرسائل النصية القصيرة SMS والاتصال الفوري</span>
          </div>

          <div className="bg-[#0b0f19] p-3.5 rounded-xl border border-[#1e293b] space-y-1.5">
            <label className="text-xs font-bold text-emerald-400 block flex items-center gap-1">
              <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
              <span>رقم الواتساب المخصص (WhatsApp Support):</span>
            </label>
            <input
              type="text"
              value={config.whatsappSupportNumber}
              onChange={(e) => setConfig(prev => ({ ...prev, whatsappSupportNumber: e.target.value }))}
              placeholder="+201119876543"
              className="w-full bg-[#070b13] border border-[#1e293b] rounded-xl px-3 py-2 text-emerald-300 font-mono text-xs font-bold dir-ltr text-left"
            />
            <span className="text-[10px] text-slate-400 block">توجيه التذاكر ببث واتساب المباشر بنقرة واحدة</span>
          </div>

          <div className="bg-[#0b0f19] p-3.5 rounded-xl border border-[#1e293b] space-y-1.5">
            <label className="text-xs font-bold text-rose-400 block flex items-center gap-1">
              <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
              <span>رقم الطوارئ والحالات الحرجة (Escalation):</span>
            </label>
            <input
              type="text"
              value={config.escalationSupportNumber}
              onChange={(e) => setConfig(prev => ({ ...prev, escalationSupportNumber: e.target.value }))}
              placeholder="+966501234567"
              className="w-full bg-[#070b13] border border-[#1e293b] rounded-xl px-3 py-2 text-rose-300 font-mono text-xs font-bold dir-ltr text-left"
            />
            <span className="text-[10px] text-slate-400 block">إرسال التذاكر الحرجة العاجلة لمشرف الدعم المباشر</span>
          </div>

        </div>
      </div>

      {/* Repeating Audio Alert Settings & Intervals */}
      <div className="pt-3 border-t border-[#1e293b] space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold text-amber-400 flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-400" />
            <span>معدل تكرار التنبيهات الصوتية والمرئية حسب أهمية التذكرة (Audio/Visual Repeat Intervals):</span>
          </h4>

          <label className="flex items-center gap-2 cursor-pointer bg-[#0b0f19] px-3 py-1.5 rounded-xl border border-[#1e293b]">
            <input
              type="checkbox"
              checked={config.enableAudioAlerts}
              onChange={(e) => setConfig(prev => ({ ...prev, enableAudioAlerts: e.target.checked }))}
              className="w-4 h-4 accent-indigo-600 rounded cursor-pointer"
            />
            <span className="text-xs font-bold text-white">تفعيل التنبيهات الصوتية</span>
          </label>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          
          {/* CRITICAL */}
          <div className="bg-[#0b0f19] p-3 rounded-xl border border-rose-500/30 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-rose-400">🔴 حرج جداً (CRITICAL)</span>
              <button
                onClick={() => handleTestAudio('CRITICAL')}
                className="p-1 bg-rose-950 text-rose-300 border border-rose-500/40 rounded-lg hover:bg-rose-900 transition-colors text-[10px] font-bold flex items-center gap-1 cursor-pointer"
              >
                <Play className="w-3 h-3" />
                <span>اختبار</span>
              </button>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">التكرار كل:</span>
              <select
                value={config.repeatIntervalSeconds.CRITICAL}
                onChange={(e) => setConfig(prev => ({
                  ...prev,
                  repeatIntervalSeconds: { ...prev.repeatIntervalSeconds, CRITICAL: Number(e.target.value) }
                }))}
                className="bg-[#070b13] border border-[#1e293b] rounded-lg px-2 py-1 text-white text-xs font-mono font-bold"
              >
                <option value={5}>كل 5 ثوانٍ</option>
                <option value={10}>كل 10 ثوانٍ (موصى به)</option>
                <option value={15}>كل 15 ثانية</option>
                <option value={20}>كل 20 ثانية</option>
              </select>
            </div>
            <p className="text-[10px] text-slate-500">جرس إنذار سرين طوارئ متكرر لحين الإقرار بالاستلام</p>
          </div>

          {/* HIGH */}
          <div className="bg-[#0b0f19] p-3 rounded-xl border border-amber-500/30 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-amber-400">🟠 مرتفع (HIGH)</span>
              <button
                onClick={() => handleTestAudio('HIGH')}
                className="p-1 bg-amber-950 text-amber-300 border border-amber-500/40 rounded-lg hover:bg-amber-900 transition-colors text-[10px] font-bold flex items-center gap-1 cursor-pointer"
              >
                <Play className="w-3 h-3" />
                <span>اختبار</span>
              </button>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">التكرار كل:</span>
              <select
                value={config.repeatIntervalSeconds.HIGH}
                onChange={(e) => setConfig(prev => ({
                  ...prev,
                  repeatIntervalSeconds: { ...prev.repeatIntervalSeconds, HIGH: Number(e.target.value) }
                }))}
                className="bg-[#070b13] border border-[#1e293b] rounded-lg px-2 py-1 text-white text-xs font-mono font-bold"
              >
                <option value={10}>كل 10 ثوانٍ</option>
                <option value={20}>كل 20 ثانية (موصى به)</option>
                <option value={30}>كل 30 ثانية</option>
                <option value={60}>كل دقيقة</option>
              </select>
            </div>
            <p className="text-[10px] text-slate-500">إنذار نغمة ثنائية مرتفعة النبرة</p>
          </div>

          {/* MEDIUM */}
          <div className="bg-[#0b0f19] p-3 rounded-xl border border-yellow-500/30 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-yellow-400">🟡 متوسط (MEDIUM)</span>
              <button
                onClick={() => handleTestAudio('MEDIUM')}
                className="p-1 bg-yellow-950 text-yellow-300 border border-yellow-500/40 rounded-lg hover:bg-yellow-900 transition-colors text-[10px] font-bold flex items-center gap-1 cursor-pointer"
              >
                <Play className="w-3 h-3" />
                <span>اختبار</span>
              </button>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">التكرار كل:</span>
              <select
                value={config.repeatIntervalSeconds.MEDIUM}
                onChange={(e) => setConfig(prev => ({
                  ...prev,
                  repeatIntervalSeconds: { ...prev.repeatIntervalSeconds, MEDIUM: Number(e.target.value) }
                }))}
                className="bg-[#070b13] border border-[#1e293b] rounded-lg px-2 py-1 text-white text-xs font-mono font-bold"
              >
                <option value={30}>كل 30 ثانية</option>
                <option value={45}>كل 45 ثانية (موصى به)</option>
                <option value={60}>كل دقيقة</option>
                <option value={120}>كل دقيقتين</option>
              </select>
            </div>
            <p className="text-[10px] text-slate-500">نغمة جرس تنبيه معتدلة</p>
          </div>

          {/* LOW */}
          <div className="bg-[#0b0f19] p-3 rounded-xl border border-indigo-500/30 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-indigo-400">🟢 منخفض (LOW)</span>
              <button
                onClick={() => handleTestAudio('LOW')}
                className="p-1 bg-indigo-950 text-indigo-300 border border-indigo-500/40 rounded-lg hover:bg-indigo-900 transition-colors text-[10px] font-bold flex items-center gap-1 cursor-pointer"
              >
                <Play className="w-3 h-3" />
                <span>اختبار</span>
              </button>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">التكرار كل:</span>
              <select
                value={config.repeatIntervalSeconds.LOW}
                onChange={(e) => setConfig(prev => ({
                  ...prev,
                  repeatIntervalSeconds: { ...prev.repeatIntervalSeconds, LOW: Number(e.target.value) }
                }))}
                className="bg-[#070b13] border border-[#1e293b] rounded-lg px-2 py-1 text-white text-xs font-mono font-bold"
              >
                <option value={0}>تنبيه مرة واحدة فقط</option>
                <option value={60}>كل دقيقة</option>
                <option value={120}>كل دقيقتين</option>
              </select>
            </div>
            <p className="text-[10px] text-slate-500">صوت رنين هادئ عند الاستلام فقط</p>
          </div>

        </div>
      </div>

    </div>
  );
};
