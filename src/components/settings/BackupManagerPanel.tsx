/**
 * @file BackupManagerPanel.tsx
 * @module Backup & Data Hygiene Settings
 * @description لوحة إعدادات النسخ الاحتياطي، الاستعادة، الجدولة، التصفير التفصيلي/الإجمالي، والتوصيل المشفر للإيميل والواتساب.
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Database, 
  DatabaseZap,
  Download, 
  Upload, 
  Trash2, 
  RotateCcw, 
  ShieldCheck, 
  Mail, 
  MessageSquare, 
  Clock, 
  Calendar, 
  CheckCircle2, 
  AlertTriangle, 
  Key, 
  Lock, 
  Send, 
  FileCheck, 
  RefreshCw, 
  Layers, 
  FileSpreadsheet, 
  X, 
  Sparkles, 
  Sliders,
  Check
} from 'lucide-react';
import { BackupService, BackupScheduleConfig, BackupMetadata, SelectiveWipeOptions } from '../../services/backupService';
import { DataSeeder } from './DataSeeder';
import { formatCurrency, playSystemChime } from '../../lib/utils';
import { toast } from 'react-hot-toast';
import { useAuth } from '../AuthProvider';

export const BackupManagerPanel: React.FC = () => {
  const { user } = useAuth();
  const activeTenantId = user?.tenantId || user?.companyId || 'tenant_maro_main';
  const activeUserId = user?.id;
  const [config, setConfig] = useState<BackupScheduleConfig>(() => BackupService.getConfig());
  const [activeTab, setActiveTab] = useState<'backup_restore' | 'wipe_data' | 'dispatch_schedule' | 'seeding'>('backup_restore');

  // Inspection & Restore Modal State
  const [inspectModalOpen, setInspectModalOpen] = useState(false);
  const [inspectData, setInspectData] = useState<{ metadata: BackupMetadata; rawData: any; filename: string } | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);

  // Selective Wipe Form State
  const [wipeMode, setWipeMode] = useState<'selective' | 'factory'>('selective');
  const [wipeOptions, setWipeOptions] = useState<SelectiveWipeOptions>({
    wipeSales: true,
    wipePurchases: false,
    wipeInventory: false,
    wipeAccounting: false,
    wipeCustomers: false,
    wipeSuppliers: false,
    wipePosSessions: true,
    wipeSupportTickets: false,
  });
  const [wipeConfirmInput, setWipeConfirmInput] = useState('');
  const [isWiping, setIsWiping] = useState(false);

  // Dispatch Test State
  const [isDispatching, setIsDispatching] = useState(false);
  const [dispatchResult, setDispatchResult] = useState<any | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    BackupService.saveConfig(config);
  }, [config]);

  // Handle Full Download
  const handleDownloadBackup = () => {
    try {
      const { filename, jsonContent } = BackupService.generateFullBackup();
      const blob = new Blob([jsonContent], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.click();
      URL.revokeObjectURL(url);

      playSystemChime('confirm');
      toast.success('تمت عملية إنشاء وتحميل النسخة الاحتياطية الكاملة (.json) بنجاح');
    } catch (e: any) {
      toast.error('حدث خطأ أثناء إنشاء النسخة الاحتياطية');
    }
  };

  // Handle File Selection for Inspecting Backup
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const res = BackupService.inspectBackupFile(content);
      if (res.valid) {
        setInspectData({
          metadata: res.metadata,
          rawData: res.rawData,
          filename: file.name
        });
        setInspectModalOpen(true);
      } else {
        toast.error(res.error || 'ملف النسخة الاحتياطية غير صالح');
      }
    };
    reader.readAsText(file, 'UTF-8');
    e.target.value = '';
  };

  // Confirm Full Restore
  const handleConfirmRestore = () => {
    if (!inspectData) return;
    setIsRestoring(true);
    try {
      setTimeout(() => {
        BackupService.restoreBackupData(inspectData.rawData);
        playSystemChime('success');
        toast.success('تمت استعادة كافة بيانات قاعدة البيانات بنجاح! جاري تنشيط النظام...');
        setTimeout(() => {
          window.location.reload();
        }, 1200);
      }, 1000);
    } catch (e: any) {
      setIsRestoring(false);
      toast.error(e.message || 'فشلت عملية استعادة البيانات');
    }
  };

  // Handle Wipe Execution
  const handleExecuteWipe = async () => {
    const requiredCode = wipeMode === 'factory' ? 'DESTROY' : 'تصفير';
    if (wipeConfirmInput.trim().toUpperCase() !== requiredCode) {
      toast.error(`يرجى كتابة الكلمة التأكيدية الصحيحة: [${requiredCode}] للتنفيذ`);
      return;
    }

    setIsWiping(true);
    try {
      if (wipeMode === 'factory') {
        await BackupService.performTotalFactoryReset(activeTenantId, wipeConfirmInput.trim(), activeUserId);
        toast.success('تم مسح وتصفير كافة بيانات النظام وإعادته لحالة المصنع الكاملة');
      } else {
        const res = await BackupService.performSelectiveWipe(activeTenantId, wipeOptions, activeUserId);
        toast.success(`تم التصفير التفصيلي بنجاح! تم مسح الأقسام: (${res.wipedModules.join(', ')})`);
      }
      setIsWiping(false);
      setWipeConfirmInput('');
      setTimeout(() => {
        window.location.reload();
      }, 1200);
    } catch (err: any) {
      setIsWiping(false);
      toast.error(`فشلت عملية التصفير: ${err.message || err}`);
    }
  };

  // Handle Instant Dispatch
  const handleInstantDispatch = async () => {
    setIsDispatching(true);
    setDispatchResult(null);
    try {
      const res = await BackupService.dispatchEncryptedBackupNow(
        config.adminEmail,
        config.adminWhatsappPhone,
        config.encryptBackups,
        config.encryptionPassphrase
      );
      setDispatchResult(res);
      playSystemChime('success');
      toast.success(res.message);
    } catch (e: any) {
      toast.error('حدث خطأ أثناء محاكاة إرسال النسخة الاحتياطية');
    } finally {
      setIsDispatching(false);
    }
  };

  return (
    <div className="space-y-6 text-right dir-rtl font-sans pb-28" dir="rtl">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#151b2b] via-[#101726] to-[#0f172a] p-6 rounded-3xl border border-[#1e293b] shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center shadow-lg">
            <Database size={26} />
          </div>
          <div>
            <h2 className="text-xl font-black text-white flex items-center gap-2">
              <span>إدارة النسخ الاحتياطي وتصفير البيانات والربط الآلي</span>
              <span className="text-[10px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-full font-mono">
                System Backup & Hygiene Engine v4.0
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              تصدير واستيراد النسخ الاحتياطية، التصفير التفصيلي والإجمالي، الجدولة التلقائية، والإرسال المشفر اليومي للإيميل والواتساب.
            </p>
          </div>
        </div>

        <button
          onClick={handleDownloadBackup}
          className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs py-2.5 px-5 rounded-xl shadow-lg shadow-indigo-600/30 transition-all cursor-pointer whitespace-nowrap"
        >
          <Download size={16} />
          <span>تحميل نسخة احتياطية الآن (.json)</span>
        </button>
      </div>

      {/* Tabs Bar */}
      <div className="flex items-center gap-2 border-b border-[#1e293b] pb-2">
        <button
          onClick={() => setActiveTab('backup_restore')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all ${
            activeTab === 'backup_restore'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
              : 'bg-[#151b2b] text-slate-400 hover:text-white border border-[#1e293b]'
          }`}
        >
          <Download size={16} />
          <span>تصدير واستعادة النسخ الاحتياطية</span>
        </button>

        <button
          onClick={() => setActiveTab('dispatch_schedule')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all ${
            activeTab === 'dispatch_schedule'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
              : 'bg-[#151b2b] text-slate-400 hover:text-white border border-[#1e293b]'
          }`}
        >
          <Mail size={16} />
          <span>الجدولة والتوصيل بالإيميل والواتساب</span>
        </button>

        <button
          onClick={() => setActiveTab('wipe_data')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all ${
            activeTab === 'wipe_data'
              ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/20'
              : 'bg-[#151b2b] text-slate-400 hover:text-white border border-[#1e293b]'
          }`}
        >
          <Trash2 size={16} />
          <span>تصفير البيانات (تفصيلي / إجمالي)</span>
        </button>

        <button
          onClick={() => setActiveTab('seeding')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all ${
            activeTab === 'seeding'
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20'
              : 'bg-[#151b2b] text-slate-400 hover:text-white border border-[#1e293b]'
          }`}
        >
          <DatabaseZap size={16} />
          <span>توليد البيانات التجريبية (Demo Data)</span>
        </button>
      </div>

      {/* TAB 1: BACKUP & RESTORE */}
      {activeTab === 'backup_restore' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-2">
          {/* Download Full Backup Card */}
          <div className="bg-[#151b2b] border border-[#1e293b] rounded-3xl p-6 space-y-4 shadow-lg">
            <div className="flex items-center justify-between border-b border-[#1e293b] pb-3">
              <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm">
                <Download size={18} />
                <span>تصدير نسخة احتياطية كاملة (JSON Export)</span>
              </div>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-mono">Encrypted Format</span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              تتضمن النسخة كافة جداول المبيعات، الفواتير، دليل الحسابات، الأرصدة المخزنية، بيانات العملاء والموردين، وتكوين النظام.
            </p>

            <div className="bg-[#0b0f19] p-4 rounded-2xl border border-[#1e293b] space-y-2 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>تاريخ آخر نسخة تم تنشيطها:</span>
                <span className="font-mono text-white">
                  {config.lastBackupAt ? new Date(config.lastBackupAt).toLocaleString('ar-EG') : 'لم تنفذ بعد'}
                </span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>نوع التشفير المطبق:</span>
                <span className="font-mono text-emerald-400">AES-256 Standard</span>
              </div>
            </div>

            <button
              onClick={handleDownloadBackup}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Download size={16} />
              <span>تحميل وتنزيل النسخة الاحتياطية (.json)</span>
            </button>
          </div>

          {/* Restore Backup Card */}
          <div className="bg-[#151b2b] border border-[#1e293b] rounded-3xl p-6 space-y-4 shadow-lg">
            <div className="flex items-center justify-between border-b border-[#1e293b] pb-3">
              <div className="flex items-center gap-2 text-purple-400 font-bold text-sm">
                <Upload size={18} />
                <span>استيراد ومعاينة واستعادة نسخة احتياطية</span>
              </div>
              <span className="text-[10px] bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full font-mono">Auto Inspection</span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              اختر ملف نسخة احتياطية سابقة لمراجعته وفحص محتوياته (عدد الفواتير، الأصناف، والعملاء) قبل تأكيد الاستعادة بالكامل.
            </p>

            <div className="border-2 border-dashed border-[#1e293b] hover:border-purple-500/50 rounded-2xl p-6 text-center space-y-3 transition-colors bg-[#0b0f19]/50">
              <Upload className="w-8 h-8 text-purple-400 mx-auto" />
              <div>
                <p className="text-xs font-bold text-white">اسحب ملف النسخة الاحتياطية هنا أو قم باختياره</p>
                <p className="text-[10px] text-slate-500 mt-1">يدعم ملفات بصيغة (.json / .marobackup)</p>
              </div>

              <input
                type="file"
                ref={fileInputRef}
                accept=".json,.marobackup"
                onChange={handleFileSelect}
                className="hidden"
              />

              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl text-xs transition-all shadow-md cursor-pointer"
              >
                اختيار ملف النسخة الاحتياطية
              </button>
            </div>

            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-[11px] text-amber-300 leading-relaxed flex items-start gap-2">
              <AlertTriangle size={16} className="shrink-0 mt-0.5" />
              <span>ملاحظة: يقوم النظام بفحص وتقييم سلامة وتناسق محتويات الملف تلقائياً قبل إجراء الاستعادة.</span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: DISPATCH & SCHEDULE */}
      {activeTab === 'dispatch_schedule' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
          {/* Scheduling & Destination Configuration Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Email & WhatsApp Config */}
            <div className="bg-[#151b2b] border border-[#1e293b] rounded-3xl p-6 space-y-4 shadow-lg">
              <div className="flex items-center justify-between border-b border-[#1e293b] pb-3">
                <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm">
                  <Mail size={18} />
                  <span>ربط التوصيل المباشر (الإيميل والواتساب)</span>
                </div>
                <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full font-mono">Automated Dispatch</span>
              </div>

              <div className="space-y-3">
                {/* Admin Email */}
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">البريد الإلكتروني للمدير (Email Target):</label>
                  <div className="relative">
                    <Mail size={16} className="absolute right-3 top-3 text-slate-500" />
                    <input
                      type="email"
                      value={config.adminEmail}
                      onChange={(e) => setConfig(prev => ({ ...prev, adminEmail: e.target.value }))}
                      className="w-full bg-[#0b0f19] border border-[#1e293b] rounded-xl pr-10 pl-3 py-2 text-white text-xs font-mono focus:outline-none focus:border-indigo-500"
                      placeholder="alkootsh@gmail.com"
                    />
                  </div>
                </div>

                {/* Admin WhatsApp */}
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">رقم واتساب المدير (WhatsApp Phone Target):</label>
                  <div className="relative">
                    <MessageSquare size={16} className="absolute right-3 top-3 text-slate-500" />
                    <input
                      type="text"
                      value={config.adminWhatsappPhone}
                      onChange={(e) => setConfig(prev => ({ ...prev, adminWhatsappPhone: e.target.value }))}
                      className="w-full bg-[#0b0f19] border border-[#1e293b] rounded-xl pr-10 pl-3 py-2 text-white text-xs font-mono focus:outline-none focus:border-indigo-500"
                      placeholder="+201000000000"
                    />
                  </div>
                </div>

                {/* Encryption Settings */}
                <div className="pt-2 border-t border-[#1e293b] space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Lock size={16} className="text-emerald-400" />
                      <span className="text-xs font-bold text-white">تشفير الملفات بكلمة مرور (AES-256)</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={config.encryptBackups}
                      onChange={(e) => setConfig(prev => ({ ...prev, encryptBackups: e.target.checked }))}
                      className="w-4 h-4 accent-indigo-600 rounded cursor-pointer"
                    />
                  </div>

                  {config.encryptBackups && (
                    <div>
                      <input
                        type="password"
                        value={config.encryptionPassphrase || ''}
                        onChange={(e) => setConfig(prev => ({ ...prev, encryptionPassphrase: e.target.value }))}
                        className="w-full bg-[#0b0f19] border border-[#1e293b] rounded-xl px-3 py-2 text-white text-xs font-mono focus:outline-none focus:border-emerald-500"
                        placeholder="كلمة المرور لتفكيك التشفير..."
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Schedule Automated Run Config */}
            <div className="bg-[#151b2b] border border-[#1e293b] rounded-3xl p-6 space-y-4 shadow-lg flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-[#1e293b] pb-3">
                  <div className="flex items-center gap-2 text-purple-400 font-bold text-sm">
                    <Clock size={18} />
                    <span>جدولة النسخ التلقائي (Automated Cron)</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.enabled}
                      onChange={(e) => setConfig(prev => ({ ...prev, enabled: e.target.checked }))}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">معدل التكرار للجدولة:</label>
                    <select
                      value={config.frequency}
                      onChange={(e) => setConfig(prev => ({ ...prev, frequency: e.target.value as any }))}
                      className="w-full bg-[#0b0f19] border border-[#1e293b] rounded-xl px-3 py-2 text-white text-xs font-bold"
                    >
                      <option value="custom_hours">كل عدد ساعات محدد (Hourly Interval)</option>
                      <option value="daily">يومياً في توقيت محدد (Daily)</option>
                      <option value="weekly">أسبوعياً (Weekly)</option>
                      <option value="monthly">شهرياً (Monthly)</option>
                    </select>
                  </div>

                  {config.frequency === 'custom_hours' || config.frequency === 'hourly' ? (
                    <div>
                      <label className="text-xs font-bold text-slate-300 block mb-1">التكرار كل (عدد الساعات):</label>
                      <select
                        value={config.intervalHours || 2}
                        onChange={(e) => setConfig(prev => ({ ...prev, intervalHours: Number(e.target.value) }))}
                        className="w-full bg-[#0b0f19] border border-[#1e293b] rounded-xl px-3 py-2 text-white text-xs font-mono font-bold"
                      >
                        <option value={1}>كل ساعة واحدة (Every 1 Hour)</option>
                        <option value={2}>كل ساعتين (Every 2 Hours)</option>
                        <option value={3}>كل 3 ساعات (Every 3 Hours)</option>
                        <option value={4}>كل 4 ساعات (Every 4 Hours)</option>
                        <option value={6}>كل 6 ساعات (Every 6 Hours)</option>
                        <option value={8}>كل 8 ساعات (Every 8 Hours)</option>
                        <option value={12}>كل 12 ساعة (Every 12 Hours)</option>
                        <option value={24}>كل 24 ساعة (Every 24 Hours)</option>
                      </select>
                    </div>
                  ) : (
                    <div>
                      <label className="text-xs font-bold text-slate-300 block mb-1">وقت التنفيذ المفضّل:</label>
                      <input
                        type="time"
                        value={config.scheduledTime}
                        onChange={(e) => setConfig(prev => ({ ...prev, scheduledTime: e.target.value }))}
                        className="w-full bg-[#0b0f19] border border-[#1e293b] rounded-xl px-3 py-2 text-white text-xs font-mono font-bold"
                      />
                    </div>
                  )}
                </div>

                {/* Startup & Shutdown Triggers */}
                <div className="pt-3 border-t border-[#1e293b] space-y-2.5">
                  <span className="text-xs font-bold text-indigo-400 block">أحداث دورة حياة النظام (App Lifecycle Events):</span>

                  <label className="p-2.5 bg-[#0b0f19] border border-[#1e293b] hover:border-indigo-500/40 rounded-xl flex items-center justify-between cursor-pointer transition-colors">
                    <div className="flex items-center gap-2">
                      <span className="text-base">🚀</span>
                      <div>
                        <span className="text-xs font-bold text-white block">نسخ احتياطي تلقائي عند فتح البرنامج</span>
                        <span className="text-[10px] text-slate-400">يتم إنشاء نسخة فورية عند إقلاع وتشغيل التطبيق</span>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={config.onAppStartup}
                      onChange={(e) => setConfig(prev => ({ ...prev, onAppStartup: e.target.checked }))}
                      className="w-4 h-4 accent-indigo-600 rounded cursor-pointer"
                    />
                  </label>

                  <label className="p-2.5 bg-[#0b0f19] border border-[#1e293b] hover:border-rose-500/40 rounded-xl flex items-center justify-between cursor-pointer transition-colors">
                    <div className="flex items-center gap-2">
                      <span className="text-base">🛑</span>
                      <div>
                        <span className="text-xs font-bold text-white block">نسخ احتياطي تلقائي عند إغلاق البرنامج</span>
                        <span className="text-[10px] text-slate-400">يتم أخذ نسخة أمان قبل خروج المستخدم أو إغلاق المتصفح</span>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={config.onAppShutdown}
                      onChange={(e) => setConfig(prev => ({ ...prev, onAppShutdown: e.target.checked }))}
                      className="w-4 h-4 accent-rose-600 rounded cursor-pointer"
                    />
                  </label>
                </div>

                <div className="bg-[#0b0f19] p-3.5 rounded-2xl border border-[#1e293b] space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-400">
                    <span>حالة الجدولة والربط:</span>
                    <span className={config.enabled ? 'text-emerald-400 font-bold' : 'text-slate-500'}>
                      {config.enabled ? 'مفعلة وتعمل تلقائياً ✓' : 'متوقفة'}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>آخر نسخة عند الفتح:</span>
                    <span className="font-mono text-indigo-300">
                      {config.lastStartupBackupAt ? new Date(config.lastStartupBackupAt).toLocaleString('ar-EG') : 'لم تنفذ بعد'}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>آخر نسخة عند الإغلاق:</span>
                    <span className="font-mono text-rose-300">
                      {config.lastShutdownBackupAt ? new Date(config.lastShutdownBackupAt).toLocaleString('ar-EG') : 'لم تنفذ بعد'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Test Dispatch */}
              <button
                onClick={handleInstantDispatch}
                disabled={isDispatching}
                className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 text-white font-bold rounded-xl text-xs shadow-lg shadow-purple-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {isDispatching ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" />
                    <span>جاري تشفير ملف النسخة الاحتياطية وإرسالها...</span>
                  </>
                ) : (
                  <>
                    <Send size={16} />
                    <span>اختبار وإرسال نسخة مشفرة الآن للإيميل والواتساب 🚀</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Dispatch Result Card */}
          {dispatchResult && (
            <div className="bg-[#151b2b] border border-emerald-500/40 rounded-3xl p-6 space-y-3 animate-in fade-in zoom-in-95">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm border-b border-[#1e293b] pb-2">
                <CheckCircle2 size={18} />
                <span>تقرير نجاح عملية التوصيل والتشفير المباشرة</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-[#0b0f19] rounded-xl border border-emerald-500/20 text-slate-300">
                  <p className="font-bold text-emerald-400 mb-1">📧 البريد الإلكتروني (Email Delivery):</p>
                  <p className="font-mono text-[11px] text-slate-300">{dispatchResult.emailRef}</p>
                </div>

                <div className="p-3 bg-[#0b0f19] rounded-xl border border-emerald-500/20 text-slate-300">
                  <p className="font-bold text-emerald-400 mb-1">💬 الواتساب (WhatsApp Notification):</p>
                  <p className="font-mono text-[11px] text-slate-300">{dispatchResult.whatsappRef}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: DATA WIPE & RESET */}
      {activeTab === 'wipe_data' && (
        <div className="bg-[#151b2b] border border-rose-500/40 rounded-3xl p-6 space-y-6 shadow-2xl animate-in fade-in slide-in-from-bottom-2">
          <div className="flex items-center justify-between border-b border-[#1e293b] pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center border border-rose-500/30">
                <Trash2 size={22} />
              </div>
              <div>
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <span>تصفير ومسح بيانات النظام (Data Wipe & Reset)</span>
                  <span className="text-[10px] bg-rose-500/20 text-rose-300 border border-rose-500/30 px-2 py-0.5 rounded-full font-mono">
                    High Risk Security Action
                  </span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  تفريغ قاعدة البيانات جزئياً (تصفير مبيعات/مخزون فقط) أو كلياً للبدء بشرائح عمل جديدة أو تسليم المنظومة.
                </p>
              </div>
            </div>

            {/* Mode Switcher */}
            <div className="flex bg-[#0b0f19] p-1 rounded-xl border border-[#1e293b]">
              <button
                onClick={() => setWipeMode('selective')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  wipeMode === 'selective' ? 'bg-amber-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                تصفير تفصيلي (Selective)
              </button>
              <button
                onClick={() => setWipeMode('factory')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  wipeMode === 'factory' ? 'bg-rose-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                تصفير إجمالي (Factory Reset)
              </button>
            </div>
          </div>

          {wipeMode === 'selective' ? (
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-amber-400">حدد القطاعات المراد تصفير ومسح بياناتها تفصيلياً:</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { key: 'wipeSales', label: '🛒 فواتير وسجلات المبيعات الكاشير' },
                  { key: 'wipePurchases', label: '📦 فواتير وسجلات المشتروات' },
                  { key: 'wipeInventory', label: '🏷️ أرصدة المنتجات والمخزون' },
                  { key: 'wipeAccounting', label: '🏛️ القيود وخزينة النقدية' },
                  { key: 'wipeCustomers', label: '👥 سجلات وحسابات العملاء' },
                  { key: 'wipeSuppliers', label: '🚚 سجلات وحسابات الموردين' },
                  { key: 'wipePosSessions', label: '📟 جلسات الـ POS والفواتير المعلقة' },
                  { key: 'wipeSupportTickets', label: '💬 تذاكر وسلسلة الدعم الذكي' },
                ].map(({ key, label }) => {
                  const checked = wipeOptions[key as keyof SelectiveWipeOptions];
                  return (
                    <label
                      key={key}
                      className={`p-3 rounded-2xl border cursor-pointer transition-all flex items-center gap-2.5 ${
                        checked
                          ? 'bg-amber-950/30 border-amber-500/60 text-white font-bold'
                          : 'bg-[#0b0f19] border-[#1e293b] text-slate-400 hover:bg-slate-800'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) => setWipeOptions(prev => ({ ...prev, [key]: e.target.checked }))}
                        className="w-4 h-4 accent-amber-500 rounded"
                      />
                      <span className="text-xs">{label}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="p-4 bg-rose-950/30 border border-rose-500/40 rounded-2xl space-y-2 text-rose-200 text-xs leading-relaxed">
              <p className="font-bold flex items-center gap-1.5 text-rose-400">
                <AlertTriangle size={16} />
                تنبيه: التصفير الإجمالي سيقوم بإعادة النظام لحالة التثبيت الأولى!
              </p>
              <p>سيتم حذف كافة البيانات المسجلة نهائياً (منتجات، عملاء، فواتير، حسابات، وإعدادات) وإفراغ الـ LocalStorage بالكامل.</p>
            </div>
          )}

          {/* Wipe Confirmation Form */}
          <div className="bg-[#0b0f19] p-4 rounded-2xl border border-[#1e293b] space-y-3">
            <label className="text-xs font-bold text-slate-300 block">
              لتأكيد التنفيذ، يرجى كتابة الكلمة التأكيدية [{wipeMode === 'factory' ? 'DESTROY' : 'تصفير'}]:
            </label>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <input
                type="text"
                placeholder={wipeMode === 'factory' ? 'أدخل كلمة DESTROY لتأكيد المسح الكلي' : 'أدخل كلمة تصفير للتأكيد'}
                value={wipeConfirmInput}
                onChange={(e) => setWipeConfirmInput(e.target.value)}
                className="flex-1 bg-[#151b2b] border border-slate-700 rounded-xl px-4 py-2.5 text-white font-mono text-xs focus:outline-none focus:border-rose-500 min-w-0"
              />

              <button
                onClick={handleExecuteWipe}
                disabled={isWiping}
                className={`w-full sm:w-auto px-6 py-3 font-bold text-xs rounded-xl text-white shadow-lg transition-all cursor-pointer whitespace-nowrap ${
                  wipeMode === 'factory' ? 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/30' : 'bg-amber-600 hover:bg-amber-500 shadow-amber-600/30'
                }`}
              >
                {isWiping ? 'جاري المسح والتصفير...' : wipeMode === 'factory' ? 'تأكيد التصفير الإجمالي الكلي ⚠️' : 'تأكيد التصفير التفصيلي ⚠️'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: DEMO DATA SEEDING */}
      {activeTab === 'seeding' && (
        <div className="bg-[#151b2b] border border-[#1e293b] rounded-3xl p-6 shadow-xl animate-in fade-in slide-in-from-bottom-2">
          <DataSeeder />
        </div>
      )}

      {/* Pre-Restore Inspection Modal */}
      {inspectModalOpen && inspectData && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4 font-sans text-right dir-rtl">
          <div className="bg-[#151b2b] w-full max-w-lg rounded-3xl border border-purple-500/50 p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-[#1e293b] pb-3">
              <div className="flex items-center gap-2 text-purple-400 font-bold text-sm">
                <FileCheck size={20} />
                <span>نتائج فحص النسخة الاحتياطية قبل الاستعادة</span>
              </div>
              <button onClick={() => setInspectModalOpen(false)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <div className="bg-[#0b0f19] p-4 rounded-2xl border border-[#1e293b] space-y-2 text-xs">
              <div className="flex justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-400">اسم الملف:</span>
                <span className="font-mono text-white font-bold">{inspectData.filename}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-400">تاريخ إنشاء النسخة:</span>
                <span className="font-mono text-purple-300">
                  {new Date(inspectData.metadata.timestamp).toLocaleString('ar-EG')}
                </span>
              </div>

              {/* Stats Breakdown */}
              <div className="grid grid-cols-2 gap-2 pt-2 text-center">
                <div className="bg-[#151b2b] p-2.5 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">إجمالي المنتجات:</span>
                  <span className="font-mono text-emerald-400 font-black text-sm">{inspectData.metadata.totalProducts} صنف</span>
                </div>
                <div className="bg-[#151b2b] p-2.5 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">إجمالي الفواتير:</span>
                  <span className="font-mono text-blue-400 font-black text-sm">{inspectData.metadata.totalInvoices} فاتورة</span>
                </div>
                <div className="bg-[#151b2b] p-2.5 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">إجمالي العملاء:</span>
                  <span className="font-mono text-indigo-400 font-black text-sm">{inspectData.metadata.totalCustomers} عميل</span>
                </div>
                <div className="bg-[#151b2b] p-2.5 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">القيود المحاسبية:</span>
                  <span className="font-mono text-amber-400 font-black text-sm">{inspectData.metadata.totalEntries} قيد</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleConfirmRestore}
                disabled={isRestoring}
                className="flex-1 py-3 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold rounded-xl text-xs shadow-lg shadow-purple-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {isRestoring ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" />
                    <span>جاري استعادة وتنظيف البيانات...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={16} />
                    <span>تأكيد واستعادة قاعدة البيانات الآن</span>
                  </>
                )}
              </button>

              <button
                onClick={() => setInspectModalOpen(false)}
                className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
