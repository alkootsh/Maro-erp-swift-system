import React, { useState, useEffect } from 'react';
import { 
  Key, 
  ShieldCheck, 
  CheckCircle2, 
  AlertTriangle, 
  Cpu, 
  HardDrive, 
  Calendar, 
  Building2, 
  Users, 
  Monitor, 
  Download, 
  Upload, 
  Sparkles,
  Lock,
  RefreshCw,
  Copy
} from 'lucide-react';
import { SecurityEngine } from '../../lib/securityEngine';
import { LicenseEngine, MachineFingerprint } from '../../lib/licenseEngine';
import { SystemLicense } from '../../types/security';
import { cn } from '../../lib/utils';
import { toast } from 'react-hot-toast';

export const LicenseActivation: React.FC = () => {
  const [license, setLicense] = useState<SystemLicense>(SecurityEngine.getSystemLicense());
  const [fingerprint, setFingerprint] = useState<MachineFingerprint>(LicenseEngine.getMachineFingerprint());
  const [inputKey, setInputKey] = useState('');
  const [companyName, setCompanyName] = useState(license.companyName);
  const [isActivating, setIsActivating] = useState(false);

  useEffect(() => {
    setLicense(SecurityEngine.getSystemLicense());
    setFingerprint(LicenseEngine.getMachineFingerprint());
  }, []);

  const daysRemaining = Math.max(0, Math.ceil((new Date(license.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));

  const handleActivate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputKey.trim()) {
      toast.error('يرجى إدخال مفتاح التفعيل أولاً');
      return;
    }

    setIsActivating(true);
    setTimeout(() => {
      const res = LicenseEngine.activateLicense(inputKey, companyName);
      if (res.success && res.license) {
        setLicense(res.license);
        toast.success(res.messageAr);
        setInputKey('');
      } else {
        toast.error(res.messageAr);
      }
      setIsActivating(false);
    }, 800);
  };

  const handleDownloadLicenseFile = () => {
    const data = LicenseEngine.exportOfflineLicenseFile();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `MARO_LICENSE_${license.licenseKey}.marolic`;
    a.click();
    toast.success('تم تحميل ملف التفعيل الأوفلاين (.marolic) بنجاح');
  };

  const handleCopyFingerprint = () => {
    navigator.clipboard.writeText(fingerprint.machineId);
    toast.success('تم نسخ كود بصمة الجهاز (Hardware ID)');
  };

  return (
    <div className="p-8 space-y-8 bg-[#0b0f1a] text-white min-h-screen" dir="rtl">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#1e293b] pb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-tr from-amber-500 to-emerald-600 text-white rounded-2xl shadow-lg shadow-amber-500/20">
            <Key size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">نظام التفعيل والتراخيص المتقدم (Software License & Activation)</h1>
            <p className="text-xs text-slate-400 font-medium mt-1">
              إدارة اشتراك المنظومة، ربط بصمة الجهاز (Machine Fingerprint)، وتفعيل السيرفر أونلاين أو أوفلاين
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className={cn(
            "px-4 py-2 rounded-2xl text-xs font-black border flex items-center gap-2 shadow-md",
            license.status === 'active' ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" : "bg-red-500/10 text-red-400 border-red-500/30"
          )}>
            <ShieldCheck size={18} />
            <span>الحالة: {license.status === 'active' ? 'ترخيص نشط ومعتمد' : 'ترخيص منتهي'}</span>
          </span>
        </div>
      </div>

      {/* Grid Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-[#151b2b] p-5 rounded-3xl border border-[#1e293b] space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold">اسم المؤسسة المرخصة</span>
            <Building2 size={18} className="text-blue-400" />
          </div>
          <p className="text-base font-black text-white truncate">{license.companyName}</p>
          <p className="text-[10px] text-slate-500 font-mono">الخطة: {license.plan.toUpperCase()}</p>
        </div>

        <div className="bg-[#151b2b] p-5 rounded-3xl border border-[#1e293b] space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold">الأيام المتبقية بالاشتراك</span>
            <Calendar size={18} className="text-amber-400" />
          </div>
          <p className="text-2xl font-black text-amber-400">{daysRemaining} يوم</p>
          <p className="text-[10px] text-slate-500 font-mono">وينتهي في: {new Date(license.expiresAt).toLocaleDateString('ar-EG')}</p>
        </div>

        <div className="bg-[#151b2b] p-5 rounded-3xl border border-[#1e293b] space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold">أقصى عدد مستخدمين (Users)</span>
            <Users size={18} className="text-purple-400" />
          </div>
          <p className="text-2xl font-black text-white">{license.maxUsers} مستخدم</p>
          <p className="text-[10px] text-emerald-400 font-bold">متاح للربط بالشبكة</p>
        </div>

        <div className="bg-[#151b2b] p-5 rounded-3xl border border-[#1e293b] space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold">أجهزة الكاشير والـ Terminals</span>
            <Monitor size={18} className="text-emerald-400" />
          </div>
          <p className="text-2xl font-black text-white">{license.maxTerminals} شاشة</p>
          <p className="text-[10px] text-slate-500 font-mono">دعم الأوفلاين الكامل</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Card: Hardware Machine Fingerprint */}
        <div className="bg-[#151b2b] rounded-3xl border border-[#1e293b] p-6 space-y-5 shadow-2xl">
          <div className="flex items-center gap-3 border-b border-[#1e293b] pb-4">
            <div className="p-2.5 bg-blue-500/10 text-blue-400 rounded-xl border border-blue-500/20">
              <Cpu size={20} />
            </div>
            <div>
              <h3 className="font-black text-base text-white">بصمة الجهاز المعتمد (Hardware Machine ID)</h3>
              <p className="text-xs text-slate-400">كود مشفر يربط ترخيص المنظومة بالمعالج والسيرفر المحلي الحالي</p>
            </div>
          </div>

          <div className="space-y-3 font-mono text-xs">
            <div className="p-4 bg-[#0f172a] rounded-2xl border border-[#1e293b] flex items-center justify-between">
              <div>
                <span className="text-slate-500 text-[10px] block uppercase">Machine ID (بصمة السيرفر):</span>
                <span className="text-amber-400 font-bold text-sm tracking-wider">{fingerprint.machineId}</span>
              </div>
              <button 
                onClick={handleCopyFingerprint}
                className="px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 rounded-xl font-bold flex items-center gap-1 text-[11px]"
              >
                <Copy size={14} /> نسخ الكود
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-[#0f172a] rounded-xl border border-[#1e293b]">
                <span className="text-slate-500 text-[10px] block">اسم الجهاز:</span>
                <span className="text-white font-bold">{fingerprint.hostname}</span>
              </div>
              <div className="p-3 bg-[#0f172a] rounded-xl border border-[#1e293b]">
                <span className="text-slate-500 text-[10px] block">أنوية المعالج (CPU):</span>
                <span className="text-white font-bold">{fingerprint.cpuCores} Cores</span>
              </div>
            </div>

            <div className="p-3 bg-[#0f172a] rounded-xl border border-[#1e293b]">
              <span className="text-slate-500 text-[10px] block">نظام التشغيل والبيئة:</span>
              <span className="text-slate-300 font-bold">{fingerprint.operatingSystem} ({fingerprint.browser})</span>
            </div>
          </div>

          <div className="pt-2">
            <button
              onClick={handleDownloadLicenseFile}
              className="w-full py-3 bg-[#1e293b] hover:bg-[#334155] text-slate-200 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 border border-[#334155] transition-all"
            >
              <Download size={16} />
              <span>تصدير ملف التفعيل أوفلاين (.marolic File)</span>
            </button>
          </div>
        </div>

        {/* Right Card: License Activation Form */}
        <div className="bg-[#151b2b] rounded-3xl border border-[#1e293b] p-6 space-y-5 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl pointer-events-none"></div>

          <div className="flex items-center gap-3 border-b border-[#1e293b] pb-4">
            <div className="p-2.5 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
              <Sparkles size={20} />
            </div>
            <div>
              <h3 className="font-black text-base text-white">تفعيل سيرفر المنظومة / تجديد الاشتراك</h3>
              <p className="text-xs text-slate-400">إدخال مفتاح ترخيص جديد لتمديد الاشتراك أو فتح الموديولات المتقدمة</p>
            </div>
          </div>

          <form onSubmit={handleActivate} className="space-y-4 text-xs font-bold">
            <div>
              <label className="block text-slate-300 mb-1">اسم المؤسسة / الشركة المرخص لها *</label>
              <input 
                type="text"
                required
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full bg-[#0b0f1a] border border-[#334155] rounded-xl px-4 py-3 text-white font-medium"
                placeholder="مثال: شركة المروة لتكنولوجيا المعلومات"
              />
            </div>

            <div>
              <label className="block text-slate-300 mb-1">مفتاح التفعيل (License Key) *</label>
              <input 
                type="text"
                required
                value={inputKey}
                onChange={(e) => setInputKey(e.target.value.toUpperCase())}
                className="w-full bg-[#0b0f1a] border border-amber-500/30 rounded-xl px-4 py-3 text-amber-300 font-mono text-sm tracking-wider uppercase"
                placeholder="MARO-ENT-2026-9988-7766"
              />
              <p className="text-[10px] text-slate-500 mt-1">صيغة المفتاح المقبولة: MARO-ENT-2026-XXXX-YYYY</p>
            </div>

            <div className="p-4 bg-[#0f172a] rounded-2xl border border-[#1e293b] space-y-2">
              <span className="text-slate-400 block font-bold">الموديولات المتاحة بالترخيص الحقيقي:</span>
              <div className="flex flex-wrap gap-1.5">
                {license.enabledModules.map((m) => (
                  <span key={m} className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg text-[10px] font-mono font-bold">
                    ✓ {m}
                  </span>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={isActivating}
              className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-2xl font-black text-xs shadow-xl shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              {isActivating ? <RefreshCw size={18} className="animate-spin" /> : <ShieldCheck size={18} />}
              <span>تفعيل الترخيص وتوثيق السيرفر فوراً</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
