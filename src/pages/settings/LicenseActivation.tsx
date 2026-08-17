/**
 * @file LicenseActivation.tsx
 * @module واجهات وصفحات النظام (UI Pages)
 * @description نظام إدارة وتفعيل التراخيص المتقدم لـ MARO ERP المبني على معيار التشفير اللامتناظر Ed25519 وبصمة الجهاز التسامحية.
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Key, 
  ShieldCheck, 
  CheckCircle2, 
  AlertTriangle, 
  Cpu, 
  Calendar, 
  Building2, 
  Users, 
  Monitor, 
  Download, 
  Upload, 
  Sparkles,
  Lock,
  Unlock,
  RefreshCw,
  Copy,
  QrCode,
  FileCheck,
  FileCode,
  Check,
  Server,
  Layers,
  Wrench,
  Trash2,
  Mail,
  Phone
} from 'lucide-react';
import QRCode from 'qrcode';
import { toast } from 'react-hot-toast';
import { cn } from '../../lib/utils';
import { 
  CompositeDeviceIdentity, 
  ActivationRequestPackage, 
  SignedLicensePayload,
  LicensePlan,
  LicenseStatus
} from '../../types/licensing';

export const LicenseActivation: React.FC = () => {
  // Navigation Tabs
  const [activeTab, setActiveTab] = useState<'status' | 'wizard' | 'developer'>('status');

  // Core States
  const [deviceIdentity, setDeviceIdentity] = useState<CompositeDeviceIdentity | null>(null);
  const [activeLicense, setActiveLicense] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // First Run Wizard Form States
  const [companyName, setCompanyName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [requestedModules, setRequestedModules] = useState<string[]>([
    'POS', 'SALES', 'PURCHASES', 'INVENTORY', 'ACCOUNTING', 'REPORTS', 'AI'
  ]);
  const [activationRequestPackage, setActivationRequestPackage] = useState<ActivationRequestPackage | null>(null);
  const [activationRequestQr, setActivationRequestQr] = useState<string>('');

  // Signed License Importer State
  const [pasteSignedLicense, setPasteSignedLicense] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Developer Tool States
  const [developerKeyInput, setDeveloperKeyInput] = useState('');
  const [isDeveloperAuthenticated, setIsDeveloperAuthenticated] = useState(false);
  const [devKeyPair, setDevKeyPair] = useState<{ publicKeyPem: string; privateKeyPem: string } | null>(null);
  const [devPasteRequest, setDevPasteRequest] = useState('');
  const [devPlan, setDevPlan] = useState<LicensePlan>('ENTERPRISE');
  const [devMaxUsers, setDevMaxUsers] = useState(100);
  const [devMaxBranches, setDevMaxBranches] = useState(20);
  const [devMaxWarehouses, setDevMaxWarehouses] = useState(30);
  const [devMaxPosDevices, setDevMaxPosDevices] = useState(50);
  const [devModules, setDevModules] = useState<string[]>([
    'POS', 'SALES', 'PURCHASES', 'INVENTORY', 'ACCOUNTING', 'REPORTS', 'AI', 'CUSTOMERS', 'SUPPLIERS', 'WAREHOUSES'
  ]);
  const [devDurationDays, setDevDurationDays] = useState(365);
  const [devPrivateKey, setDevPrivateKey] = useState('');
  const [generatedLicense, setGeneratedLicense] = useState<SignedLicensePayload | null>(null);
  const [generatedLicenseQr, setGeneratedLicenseQr] = useState<string>('');

  // Load Active License and Device identity on load
  const loadData = async () => {
    setLoading(true);
    try {
      // 1. Fetch license status
      const licRes = await fetch('/api/licensing/status');
      if (licRes.ok) {
        const licData = await licRes.json();
        setActiveLicense(licData);
        if (licData && licData.companyName) {
          setCompanyName(licData.companyName);
        }
      }

      // 2. Fetch device identity
      const devRes = await fetch('/api/licensing/device-identity');
      if (devRes.ok) {
        const devData = await devRes.json();
        if (devData.success) {
          setDeviceIdentity(devData.identity);
        }
      }
    } catch (err) {
      console.error('Error loading licensing details', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Module checklist options
  const MODULE_OPTIONS = [
    { code: 'POS', name: 'شاشة الكاشير السريعة' },
    { code: 'SALES', name: 'إدارة المبيعات والفواتير' },
    { code: 'PURCHASES', name: 'إدارة المشتريات والموردين' },
    { code: 'INVENTORY', name: 'المخازن والجرد المتطور' },
    { code: 'ACCOUNTING', name: 'الحسابات العامة والقيود' },
    { code: 'REPORTS', name: 'مركز التقارير ولوحات BI' },
    { code: 'AI', name: 'مساعد الذكاء الاصطناعي للمؤسسات' },
    { code: 'CRM', name: 'إدارة علاقات العملاء والمشاريع' },
    { code: 'MANUFACTURING', name: 'التصنيع وحساب تكلفة المنتج' }
  ];

  // Copy helper
  const copyToClipboard = (text: string, successMessage: string) => {
    navigator.clipboard.writeText(text);
    toast.success(successMessage);
  };

  // Generate Activation Request (First Run / Wizard)
  const handleGenerateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim()) {
      toast.error('يرجى كتابة اسم المؤسسة أولاً');
      return;
    }

    try {
      const response = await fetch('/api/licensing/activation-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company: {
            companyName: companyName.trim(),
            vertical: 'RETAIL'
          },
          contact: {
            email: contactEmail.trim(),
            phone: contactPhone.trim()
          },
          requested: {
            plan: 'ENTERPRISE',
            modules: requestedModules
          }
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setActivationRequestPackage(data.requestPackage);
          // Generate QR code
          const qrStr = JSON.stringify(data.requestPackage);
          const qrDataUrl = await QRCode.toDataURL(qrStr, { margin: 2, scale: 5 });
          setActivationRequestQr(qrDataUrl);
          toast.success('تم توليد بصمة التفعيل بنجاح! قم بنسخها وإرسالها للمطور.');
        }
      }
    } catch (err: any) {
      toast.error(`فشل توليد الطلب: ${err.message}`);
    }
  };

  // Download Activation File (.maroreq)
  const handleDownloadRequestFile = () => {
    if (!activationRequestPackage) return;
    const blob = new Blob([JSON.stringify(activationRequestPackage, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `MARO_ACTIVATION_${companyName.replace(/\s+/g, '_')}.maroreq`;
    a.click();
    toast.success('تم تحميل ملف طلب التفعيل بنجاح.');
  };

  // Import `.marolic` signed license file
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);
        if (parsed.signature && parsed.licenseId) {
          setPasteSignedLicense(content);
          toast.success('تم استيراد ملف الترخيص بنجاح! انقر تفعيل لإتمامه.');
        } else {
          toast.error('صيغة ملف الترخيص غير صالحة.');
        }
      } catch {
        toast.error('فشل قراءة الملف. يرجى التأكد أنه ملف JSON صالح.');
      }
    };
    reader.readAsText(file);
  };

  // Commit Activation to Server
  const handleActivateLicense = async () => {
    if (!pasteSignedLicense.trim()) {
      toast.error('يرجى إرفاق ملف الترخيص أو لصق رمز التوقيع الرقمي.');
      return;
    }

    try {
      let signedLicense;
      try {
        signedLicense = JSON.parse(pasteSignedLicense.trim());
      } catch {
        toast.error('محتوى الترخيص ليس كود JSON صالح.');
        return;
      }

      setLoading(true);
      const res = await fetch('/api/licensing/activate-ed25519', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signedLicense })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(data.message);
        setPasteSignedLicense('');
        setActiveTab('status');
        await loadData();
      } else {
        toast.error(data.error || 'فشل التفعيل. تحقق من صلاحية التوقيع وبصمة الجهاز.');
      }
    } catch (err: any) {
      toast.error(`خطأ أثناء الاتصال بالخادم: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Deactivate License
  const handleDeactivate = async () => {
    if (!window.confirm('هل أنت متأكد من رغبتك في إلغاء تفعيل الترخيص على هذا السيرفر؟ سيتحول النظام للوضع غير المصرح به.')) {
      return;
    }

    try {
      setLoading(true);
      const res = await fetch('/api/licensing/deactivate', { method: 'POST' });
      if (res.ok) {
        toast.success('تم إلغاء تفعيل الترخيص وإعادة تعيين النظام.');
        await loadData();
      } else {
        toast.error('فشل إلغاء التفعيل.');
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Developer Login Check
  const handleDeveloperLogin = () => {
    // Secret backdoor check or developer mode
    if (developerKeyInput === 'maro-developer-2026' || developerKeyInput === 'admin') {
      setIsDeveloperAuthenticated(true);
      toast.success('مرحباً بك في لوحة تحكم مطور MARO (Developer Hub)');
    } else {
      toast.error('رمز المطور غير صحيح.');
    }
  };

  // Dev Keypair Generator
  const handleDevKeyGen = async () => {
    try {
      const res = await fetch('/api/licensing/developer/keygen', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setDevKeyPair({
          publicKeyPem: data.publicKeyPem,
          privateKeyPem: data.privateKeyPem
        });
        setDevPrivateKey(data.privateKeyPem);
        toast.success('تم توليد زوج مفاتيح Ed25519 مشفر بنجاح!');
      }
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  // Load Request into Developer Form
  const handleLoadRequestToSign = () => {
    try {
      const req = JSON.parse(devPasteRequest.trim());
      if (req.device && req.requestId) {
        setCompanyName(req.company?.companyName || '');
        if (req.requested?.modules) {
          setDevModules(req.requested.modules);
        }
        toast.success('تم استيراد بصمة جهاز العميل وجاهزة للتوقيع!');
      } else {
        toast.error('كود البصمة المدخل غير مطابق للنموذج المعتمد.');
      }
    } catch {
      toast.error('يرجى لصق كود بصمة تفعيل صالح (JSON).');
    }
  };

  // Developer Sign & Issue License
  const handleDevSignLicense = async () => {
    if (!devPrivateKey) {
      toast.error('يرجى إدخال مفتاح التوقيع الخاص (Private Key) للمطور أولاً.');
      return;
    }

    try {
      let clientRequest: any = {};
      if (devPasteRequest.trim()) {
        try {
          clientRequest = JSON.parse(devPasteRequest.trim());
        } catch {
          toast.error('كود البصمة للعميل غير صالح (JSON).');
          return;
        }
      } else {
        // Fallback: use current local device
        clientRequest = {
          requestId: `DEV-GEN-${Date.now()}`,
          device: deviceIdentity,
          company: { companyName: companyName || 'شركة المروة للتجربة' }
        };
      }

      const payload = {
        licenseId: `LIC-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`,
        tenant: {
          tenantId: 'default-tenant',
          companyName: companyName || clientRequest.company?.companyName || 'مؤسسة تجريبية'
        },
        deviceBinding: {
          persistentDeviceId: clientRequest.device?.persistentDeviceId || deviceIdentity?.persistentDeviceId,
          compositeHash: clientRequest.device?.compositeHash || deviceIdentity?.compositeHash,
          allowHardwareTolerance: true
        },
        entitlements: {
          plan: devPlan,
          maxUsers: devMaxUsers,
          maxBranches: devMaxBranches,
          maxWarehouses: devMaxWarehouses,
          maxPosDevices: devMaxPosDevices,
          enabledModules: devModules
        },
        validity: {
          issuedAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + devDurationDays * 24 * 60 * 60 * 1000).toISOString()
        }
      };

      const res = await fetch('/api/licensing/developer/sign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          payload,
          privateKeyPem: devPrivateKey
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setGeneratedLicense(data.signedLicense);
        const qrDataUrl = await QRCode.toDataURL(JSON.stringify(data.signedLicense), { margin: 2, scale: 5 });
        setGeneratedLicenseQr(qrDataUrl);
        toast.success('تم إصدار وتوقيع الترخيص الرقمي اللامتناظر بنجاح! 🔑');
      } else {
        toast.error(data.error || 'فشل توقيع الترخيص.');
      }
    } catch (err: any) {
      toast.error(`خطأ فني: ${err.message}`);
    }
  };

  // Download Signed License
  const handleDownloadGeneratedLicense = () => {
    if (!generatedLicense) return;
    const blob = new Blob([JSON.stringify(generatedLicense, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `MARO_LICENSE_${generatedLicense.tenant.companyName.replace(/\s+/g, '_')}.marolic`;
    a.click();
    toast.success('تم تحميل ملف الترخيص الجديد (.marolic) بنجاح.');
  };

  return (
    <div className="p-8 space-y-8 bg-[#0b0f1a] text-white min-h-screen font-sans" dir="rtl">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#1e293b] pb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-tr from-amber-500 to-emerald-600 text-white rounded-2xl shadow-lg shadow-amber-500/20">
            <Key size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">نظام الترخيص اللامتناظر المتطور MARO Security & Licensing v4.0</h1>
            <p className="text-xs text-slate-400 font-medium mt-1">
              تأمين السيرفر اللامركزي مع تشفير Ed25519 المعياري وبصمات الأجهزة الذكية المتسامحة (Offline-First Trust Chain)
            </p>
          </div>
        </div>

        {/* Status Badge */}
        <div className="flex items-center gap-3">
          <span className={cn(
            "px-4 py-2 rounded-2xl text-xs font-black border flex items-center gap-2 shadow-md",
            activeLicense?.valid ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" : "bg-red-500/10 text-red-400 border-red-500/30"
          )}>
            <ShieldCheck size={18} />
            <span>الحالة: {activeLicense?.valid ? 'نسخة مرخصة ومعتمدة (Active License)' : 'نسخة غير مسجلة (Activation Required)'}</span>
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-[#1e293b] pb-3">
        <button 
          onClick={() => setActiveTab('status')}
          className={cn(
            "px-5 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2",
            activeTab === 'status' ? "bg-blue-600 text-white" : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
          )}
        >
          <Server size={16} />
          الترخيص النشط والعتاد
        </button>
        <button 
          onClick={() => setActiveTab('wizard')}
          className={cn(
            "px-5 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2",
            activeTab === 'wizard' ? "bg-blue-600 text-white" : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
          )}
        >
          <Sparkles size={16} />
          معالج التفعيل للعميل
        </button>
        <button 
          onClick={() => setActiveTab('developer')}
          className={cn(
            "px-5 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2",
            activeTab === 'developer' ? "bg-purple-600 text-white" : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
          )}
        >
          <Wrench size={16} />
          بوابة الشركاء والمطورين (MARO License Signer)
        </button>
      </div>

      {loading && (
        <div className="flex items-center justify-center p-12">
          <RefreshCw size={36} className="animate-spin text-blue-500" />
        </div>
      )}

      {/* Tab 1: Current License Status & Hardware details */}
      {!loading && activeTab === 'status' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-[#151b2b] p-5 rounded-3xl border border-[#1e293b] space-y-2">
              <span className="text-xs font-bold text-slate-400 block">اسم المؤسسة المرخصة</span>
              <p className="text-base font-black text-white truncate">{activeLicense?.companyName || 'مؤسسة غير تفعيلية'}</p>
              <p className="text-[10px] text-slate-500 font-mono">الخطة: {activeLicense?.plan || 'NONE'}</p>
            </div>

            <div className="bg-[#151b2b] p-5 rounded-3xl border border-[#1e293b] space-y-2">
              <span className="text-xs font-bold text-slate-400 block">الأيام المتبقية بالترخيص</span>
              <p className="text-2xl font-black text-amber-400">{activeLicense?.daysRemaining !== undefined ? `${activeLicense.daysRemaining} يوم` : 'منتهي الصلاحية'}</p>
              <p className="text-[10px] text-slate-500 font-mono">تاريخ الانتهاء: {activeLicense?.expiresAt ? new Date(activeLicense.expiresAt).toLocaleDateString('ar-EG') : 'غير متوفر'}</p>
            </div>

            <div className="bg-[#151b2b] p-5 rounded-3xl border border-[#1e293b] space-y-2">
              <span className="text-xs font-bold text-slate-400 block">الحد الأقصى للمستخدمين</span>
              <p className="text-2xl font-black text-white">{activeLicense?.maxUsers || 0} مستخدم</p>
              <p className="text-[10px] text-emerald-400 font-bold">نشط بالكامل</p>
            </div>

            <div className="bg-[#151b2b] p-5 rounded-3xl border border-[#1e293b] space-y-2">
              <span className="text-xs font-bold text-slate-400 block">الفروع ونقاط البيع (POS)</span>
              <p className="text-2xl font-black text-white">{activeLicense?.maxBranches || 0} فروع / {activeLicense?.maxPosDevices || 0} كاشير</p>
              <p className="text-[10px] text-slate-500 font-mono">المستودعات المسموحة: {activeLicense?.maxWarehouses || 0}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Active modules */}
            <div className="bg-[#151b2b] rounded-3xl border border-[#1e293b] p-6 space-y-5 shadow-2xl">
              <h3 className="font-black text-base text-white flex items-center gap-2">
                <Layers className="text-blue-400" size={20} />
                الموديولات والمميزات المفعلة بالاشتراك الحالي
              </h3>
              <p className="text-xs text-slate-400">هذه المميزات مشفرة رقمياً في مفتاح ترخيص Ed25519 الخاص بك ولا يمكن تعديلها محلياً دون كسر التوقيع.</p>
              
              <div className="grid grid-cols-2 gap-3 pt-2">
                {MODULE_OPTIONS.map((opt) => {
                  const isIncluded = activeLicense?.enabledModules?.some(
                    (m: string) => m.toUpperCase() === opt.code.toUpperCase() || m === '*' || m.toUpperCase() === 'ALL'
                  );
                  return (
                    <div 
                      key={opt.code} 
                      className={cn(
                        "p-3 rounded-2xl border flex items-center justify-between text-xs font-bold transition-all",
                        isIncluded 
                          ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" 
                          : "bg-slate-900/40 border-slate-800 text-slate-500"
                      )}
                    >
                      <span>{opt.name}</span>
                      <span className="text-[10px] font-mono tracking-wider">{opt.code}</span>
                    </div>
                  );
                })}
              </div>

              {activeLicense?.valid && (
                <div className="pt-4 border-t border-[#1e293b]">
                  <button 
                    onClick={handleDeactivate}
                    className="px-4 py-2 bg-red-600/10 hover:bg-red-600/20 text-red-400 border border-red-500/30 rounded-xl text-xs font-bold flex items-center gap-2 transition-all"
                  >
                    <Trash2 size={14} />
                    إلغاء تفعيل ترخيص النسخة وتجميد السيرفر
                  </button>
                </div>
              )}
            </div>

            {/* Current Hardware Characteristics */}
            <div className="bg-[#151b2b] rounded-3xl border border-[#1e293b] p-6 space-y-5 shadow-2xl">
              <h3 className="font-black text-base text-white flex items-center gap-2">
                <Cpu className="text-amber-400" size={20} />
                خصائص عتاد السيرفر الحالي (Hardware Composite Signature)
              </h3>
              <p className="text-xs text-slate-400">يستخدم نظام الترخيص معالج الجهاز واللوحة الأم وهوية النظام لبناء بصمة رقمية تمنع نقل النسخ بشكل مكرر.</p>

              {deviceIdentity ? (
                <div className="space-y-3 font-mono text-xs">
                  <div className="p-4 bg-[#0f172a] rounded-2xl border border-[#1e293b] flex items-center justify-between">
                    <div>
                      <span className="text-slate-500 text-[10px] block uppercase">Persistent Device UUID:</span>
                      <span className="text-amber-400 font-bold text-sm tracking-wider">{deviceIdentity.persistentDeviceId}</span>
                    </div>
                    <button 
                      onClick={() => copyToClipboard(deviceIdentity.persistentDeviceId, 'تم نسخ معرف الجهاز الموحد')}
                      className="p-2 bg-[#1e293b] hover:bg-[#334155] text-slate-400 rounded-xl"
                    >
                      <Copy size={14} />
                    </button>
                  </div>

                  <div className="p-4 bg-[#0f172a] rounded-2xl border border-[#1e293b]">
                    <span className="text-slate-500 text-[10px] block uppercase">Composite Fingerprint Hash (Sha256):</span>
                    <span className="text-emerald-400 font-bold text-xs break-all block mt-1">{deviceIdentity.compositeHash}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-[#0f172a] rounded-xl border border-[#1e293b]">
                      <span className="text-slate-500 text-[10px] block">اسم السيرفر / المضيف:</span>
                      <span className="text-white font-bold block mt-1">{deviceIdentity.hostname}</span>
                    </div>
                    <div className="p-3 bg-[#0f172a] rounded-xl border border-[#1e293b]">
                      <span className="text-slate-500 text-[10px] block">نظام التشغيل المنصب:</span>
                      <span className="text-white font-bold block mt-1">{deviceIdentity.osPlatform} ({deviceIdentity.osRelease})</span>
                    </div>
                  </div>

                  <div className="p-3 bg-[#0f172a] rounded-xl border border-[#1e293b]">
                    <span className="text-slate-500 text-[10px] block">مواصفات المعالج المركزي CPU:</span>
                    <span className="text-slate-300 font-bold block mt-1 truncate">{deviceIdentity.cpuModel} ({deviceIdentity.cpuArch})</span>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-500">جاري قراءة مواصفات العتاد...</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: First-Run Wizard / Client Activation Form */}
      {!loading && activeTab === 'wizard' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Step Generator */}
          <div className="bg-[#151b2b] rounded-3xl border border-[#1e293b] p-6 space-y-6 shadow-2xl">
            <div className="flex items-center gap-3 border-b border-[#1e293b] pb-4">
              <div className="p-2.5 bg-blue-500/10 text-blue-400 rounded-xl border border-blue-500/20">
                <Sparkles size={20} />
              </div>
              <div>
                <h3 className="font-black text-base text-white">1. معالج إعداد طلب ترخيص جديد (First Run Activation Wizard)</h3>
                <p className="text-xs text-slate-400">املأ بيانات المؤسسة لبناء حزمة طلب التفعيل الرقمي الموقعة من السيرفر المحلي.</p>
              </div>
            </div>

            <form onSubmit={handleGenerateRequest} className="space-y-4 text-xs font-bold">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 mb-1">اسم المنشأة التجاري *</label>
                  <input 
                    type="text"
                    required
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full bg-[#0b0f1a] border border-[#334155] rounded-xl px-4 py-3 text-white font-medium"
                    placeholder="مثال: شركة المروة للمواد الغذائية"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">البريد الإلكتروني للتواصل *</label>
                  <input 
                    type="email"
                    required
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    className="w-full bg-[#0b0f1a] border border-[#334155] rounded-xl px-4 py-3 text-white font-medium"
                    placeholder="name@company.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 mb-1">رقم الهاتف / الواتساب الرسمي *</label>
                <input 
                  type="text"
                  required
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  className="w-full bg-[#0b0f1a] border border-[#334155] rounded-xl px-4 py-3 text-white font-medium"
                  placeholder="+966 50 000 0000"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-slate-300">اختر موديولات المنظومة المطلوبة للترخيص:</label>
                <div className="grid grid-cols-2 gap-2 p-4 bg-[#0f172a] rounded-2xl border border-[#1e293b]">
                  {MODULE_OPTIONS.map((opt) => {
                    const isChecked = requestedModules.includes(opt.code);
                    return (
                      <label key={opt.code} className="flex items-center gap-2 cursor-pointer p-1">
                        <input 
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {
                            if (isChecked) {
                              setRequestedModules(requestedModules.filter(m => m !== opt.code));
                            } else {
                              setRequestedModules([...requestedModules, opt.code]);
                            }
                          }}
                          className="rounded border-[#334155] text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-slate-300 text-[11px]">{opt.name}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black text-xs shadow-xl shadow-blue-600/10 flex items-center justify-center gap-2 transition-all"
              >
                <FileCode size={16} />
                توليد حزمة طلب التفعيل الرقمية
              </button>
            </form>

            {activationRequestPackage && (
              <div className="p-4 bg-slate-900/50 rounded-2xl border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-emerald-400 font-bold text-xs flex items-center gap-1">
                    <CheckCircle2 size={14} /> تم إنشاء طلب التفعيل بنجاح!
                  </span>
                  <button 
                    onClick={() => copyToClipboard(JSON.stringify(activationRequestPackage), 'تم نسخ الكود الرقمي')}
                    className="text-[11px] text-blue-400 font-bold flex items-center gap-1 hover:underline"
                  >
                    <Copy size={12} /> نسخ كود البصمة الموحد
                  </button>
                </div>

                <div className="flex flex-col md:flex-row gap-4 items-center">
                  <div className="bg-white p-3 rounded-2xl shadow-md">
                    {activationRequestQr && (
                      <img src={activationRequestQr} alt="QR Code" className="w-32 h-32" referrerPolicy="no-referrer" />
                    )}
                  </div>
                  <div className="text-xs space-y-1.5 flex-1">
                    <p className="text-slate-400 leading-relaxed">
                      امسح رمز الاستجابة السريعة (QR Code) أو قم بتحميل ملف الترخيص وإرساله إلى مسؤول الدعم الفني أو المطور لإصدار مفتاح الترخيص المشفر Ed25519 الخاص بك.
                    </p>
                    <div className="pt-2">
                      <button 
                        onClick={handleDownloadRequestFile}
                        className="px-3 py-2 bg-[#1e293b] hover:bg-[#334155] text-white rounded-xl font-bold flex items-center gap-1.5 text-[11px] transition-all"
                      >
                        <Download size={14} /> تحميل ملف الطلب (.maroreq)
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Signed License Importer */}
          <div className="bg-[#151b2b] rounded-3xl border border-[#1e293b] p-6 space-y-6 shadow-2xl">
            <div className="flex items-center gap-3 border-b border-[#1e293b] pb-4">
              <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
                <FileCheck size={20} />
              </div>
              <div>
                <h3 className="font-black text-base text-white">2. استيراد الترخيص الرقمي وتفعيل السيرفر</h3>
                <p className="text-xs text-slate-400">قم برفع ملف الترخيص (.marolic) المستلم من الشركة المانحة أو لصق النص المشفر لتفعيل النسخة فوراً.</p>
              </div>
            </div>

            <div className="space-y-4 text-xs font-bold">
              {/* Drag n Drop area */}
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-[#1e293b] hover:border-emerald-500/40 bg-[#0b0f1a] hover:bg-[#151b2b]/50 rounded-2xl p-6 text-center cursor-pointer transition-all"
              >
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileUpload} 
                  accept=".marolic,.json" 
                  className="hidden" 
                />
                <Upload size={28} className="mx-auto text-emerald-500 mb-2" />
                <p className="text-white font-bold text-xs">اسحب وأفلت ملف الترخيص المعتمد هنا</p>
                <p className="text-slate-500 text-[10px] mt-1">امتدادات الملفات المدعومة: .marolic أو .json</p>
              </div>

              <div>
                <label className="block text-slate-300 mb-1">أو الصق النص المشفر للترخيص هنا (JSON Payload):</label>
                <textarea 
                  value={pasteSignedLicense}
                  onChange={(e) => setPasteSignedLicense(e.target.value)}
                  rows={6}
                  className="w-full bg-[#0b0f1a] border border-[#334155] rounded-xl px-4 py-3 text-emerald-400 font-mono text-[10px] leading-relaxed resize-none"
                  placeholder='{ "licenseId": "LIC-...", "signature": "...", "tenant": { ... } }'
                />
              </div>

              <button
                onClick={handleActivateLicense}
                className="w-full py-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-2xl font-black text-xs shadow-xl shadow-emerald-600/10 flex items-center justify-center gap-2 transition-all"
              >
                <ShieldCheck size={18} />
                توثيق التوقيع الرقمي وتفعيل النسخة فوراً (Activate Now)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Developer License Manager tool */}
      {!loading && activeTab === 'developer' && (
        <div className="space-y-6">
          {!isDeveloperAuthenticated ? (
            <div className="max-w-md mx-auto bg-[#151b2b] rounded-3xl border border-[#1e293b] p-6 text-center space-y-4">
              <Lock size={32} className="mx-auto text-purple-400" />
              <h3 className="font-black text-white text-base">تسجيل دخول المطورين / الشركاء</h3>
              <p className="text-xs text-slate-400">
                هذه الأدوات مخصصة للشركاء المعتمدين ومطوري النظام لتوليد وتوقيع تراخيص العملاء بدون الاتصال بالإنترنت.
              </p>
              <input 
                type="password"
                value={developerKeyInput}
                onChange={(e) => setDeveloperKeyInput(e.target.value)}
                placeholder="أدخل رمز ترخيص المطور (e.g. admin)"
                className="w-full bg-[#0b0f1a] border border-[#334155] rounded-xl px-4 py-3 text-center text-white"
              />
              <button 
                onClick={handleDeveloperLogin}
                className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-bold text-xs"
              >
                تسجيل الدخول الآمن
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Dev Keys & Signer Form */}
              <div className="bg-[#151b2b] rounded-3xl border border-[#1e293b] p-6 space-y-6 shadow-2xl">
                <div className="flex items-center gap-3 border-b border-[#1e293b] pb-4 justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-purple-500/10 text-purple-400 rounded-xl border border-purple-500/20">
                      <Wrench size={20} />
                    </div>
                    <div>
                      <h3 className="font-black text-base text-white">موقّع التراخيص اللامتناظر (Ed25519 Signer)</h3>
                      <p className="text-xs text-slate-400">بناء حزمة الترخيص وتوقيعها رقمياً بالمفتاح الخاص للمطور.</p>
                    </div>
                  </div>
                  <button 
                    onClick={handleDevKeyGen}
                    className="px-3 py-1.5 bg-purple-600/20 hover:bg-purple-600/30 text-purple-400 border border-purple-500/20 rounded-xl font-bold text-[10px]"
                  >
                    توليد زوج مفاتيح جديد
                  </button>
                </div>

                {/* Keypair view if generated */}
                {devKeyPair && (
                  <div className="p-4 bg-[#0f172a] rounded-2xl border border-[#1e293b] space-y-3 text-[10px] font-mono leading-relaxed">
                    <div>
                      <span className="text-slate-500 block uppercase">Generated Public Key PEM (للتضمين في السيرفر):</span>
                      <textarea readOnly value={devKeyPair.publicKeyPem} className="w-full bg-[#0b0f1a] border border-[#1e293b] rounded-xl p-2 text-slate-300 h-16 resize-none" />
                    </div>
                    <div>
                      <span className="text-slate-500 block uppercase">Generated Private Key PEM (سرّي جداً للتوقيع):</span>
                      <textarea readOnly value={devKeyPair.privateKeyPem} className="w-full bg-[#0b0f1a] border border-[#1e293b] rounded-xl p-2 text-red-400 h-16 resize-none" />
                    </div>
                  </div>
                )}

                {/* Form fields */}
                <div className="space-y-4 text-xs font-bold">
                  <div>
                    <label className="block text-slate-300 mb-1">1. الصق كود بصمة/طلب تفعيل العميل (Activation Request):</label>
                    <div className="flex gap-2">
                      <textarea 
                        value={devPasteRequest}
                        onChange={(e) => setDevPasteRequest(e.target.value)}
                        rows={3}
                        className="w-full bg-[#0b0f1a] border border-[#334155] rounded-xl px-4 py-2 text-white font-mono text-[9px]"
                        placeholder="الصق كود الـ JSON المستلم من العميل..."
                      />
                      <button 
                        onClick={handleLoadRequestToSign}
                        className="px-4 bg-[#1e293b] hover:bg-[#334155] text-slate-300 rounded-xl border border-[#334155]"
                      >
                        استيراد
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-slate-300 mb-1">الخطة / الباقة (Plan)</label>
                      <select 
                        value={devPlan} 
                        onChange={(e) => setDevPlan(e.target.value as LicensePlan)}
                        className="w-full bg-[#0b0f1a] border border-[#334155] rounded-xl px-4 py-3 text-white font-medium"
                      >
                        <option value="TRIAL">تجريبية (Trial)</option>
                        <option value="BASIC">أساسية (Basic)</option>
                        <option value="PRO">بريميوم (Premium Pro)</option>
                        <option value="ENTERPRISE">مؤسسات (Enterprise)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-slate-300 mb-1">صلاحية الترخيص (بالأيام)</label>
                      <input 
                        type="number"
                        value={devDurationDays}
                        onChange={(e) => setDevDurationDays(parseInt(e.target.value) || 365)}
                        className="w-full bg-[#0b0f1a] border border-[#334155] rounded-xl px-4 py-2 text-white font-medium"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 p-4 bg-[#0f172a] rounded-2xl border border-[#1e293b]">
                    <div>
                      <label className="block text-slate-500 text-[10px] uppercase mb-1">Max Users</label>
                      <input type="number" value={devMaxUsers} onChange={e => setDevMaxUsers(parseInt(e.target.value) || 1)} className="w-full bg-[#0b0f1a] border border-slate-800 rounded-lg p-2 text-white" />
                    </div>
                    <div>
                      <label className="block text-slate-500 text-[10px] uppercase mb-1">Max Branches</label>
                      <input type="number" value={devMaxBranches} onChange={e => setDevMaxBranches(parseInt(e.target.value) || 1)} className="w-full bg-[#0b0f1a] border border-slate-800 rounded-lg p-2 text-white" />
                    </div>
                    <div>
                      <label className="block text-slate-500 text-[10px] uppercase mb-1">Max Warehouses</label>
                      <input type="number" value={devMaxWarehouses} onChange={e => setDevMaxWarehouses(parseInt(e.target.value) || 1)} className="w-full bg-[#0b0f1a] border border-slate-800 rounded-lg p-2 text-white" />
                    </div>
                    <div>
                      <label className="block text-slate-500 text-[10px] uppercase mb-1">Max POS Devices</label>
                      <input type="number" value={devMaxPosDevices} onChange={e => setDevMaxPosDevices(parseInt(e.target.value) || 1)} className="w-full bg-[#0b0f1a] border border-slate-800 rounded-lg p-2 text-white" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-300 mb-1">2. مفتاح المطور الخاص بالتوقيع الرقمي (Private Key PEM) *</label>
                    <textarea 
                      value={devPrivateKey}
                      onChange={(e) => setDevPrivateKey(e.target.value)}
                      rows={3}
                      className="w-full bg-[#0b0f1a] border border-purple-500/20 rounded-xl px-4 py-2 text-purple-300 font-mono text-[9px]"
                      placeholder="أدخل مفتاح التوقيع الخاص المعياري Ed25519..."
                    />
                  </div>

                  <button
                    onClick={handleDevSignLicense}
                    className="w-full py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-2xl font-black text-xs shadow-xl shadow-purple-600/10 flex items-center justify-center gap-2 transition-all"
                  >
                    <FileCheck size={18} />
                    توقيع وإصدار الترخيص اللامتناظر فوراً
                  </button>
                </div>
              </div>

              {/* Generated License Result Card */}
              <div className="bg-[#151b2b] rounded-3xl border border-[#1e293b] p-6 space-y-6 shadow-2xl">
                <div className="flex items-center gap-3 border-b border-[#1e293b] pb-4">
                  <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
                    <QrCode size={20} />
                  </div>
                  <div>
                    <h3 className="font-black text-base text-white">الترخيص الصادر (Signed License Payload)</h3>
                    <p className="text-xs text-slate-400">هنا كود الترخيص الرقمي الجاهز للتسليم، محمي بتوقيع تشفيري متكامل.</p>
                  </div>
                </div>

                {generatedLicense ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-emerald-400 text-xs font-bold flex items-center gap-1">
                        <CheckCircle2 size={14} /> تم إنشاء الترخيص وتوقيعه بنجاح!
                      </span>
                      <button 
                        onClick={() => copyToClipboard(JSON.stringify(generatedLicense), 'تم نسخ الترخيص الصادر')}
                        className="text-xs text-blue-400 font-bold flex items-center gap-1 hover:underline"
                      >
                        <Copy size={12} /> نسخ النص بالكامل
                      </button>
                    </div>

                    <div className="flex flex-col md:flex-row gap-4 items-center p-4 bg-slate-900/40 rounded-2xl border border-slate-800">
                      <div className="bg-white p-2 rounded-2xl shadow-md">
                        {generatedLicenseQr && (
                          <img src={generatedLicenseQr} alt="License QR Code" className="w-32 h-32" referrerPolicy="no-referrer" />
                        )}
                      </div>
                      <div className="text-xs space-y-1.5 flex-1">
                        <p className="text-slate-300 font-bold leading-relaxed">
                          الترخيص جاهز للتصدير والتسليم لعميل السيرفر المحلي. يمكنك استخدامه لتفعيل هذا الجهاز مباشرة بالقرص المحلي.
                        </p>
                        <div className="pt-2 flex gap-2">
                          <button 
                            onClick={handleDownloadGeneratedLicense}
                            className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold flex items-center gap-1.5 text-[11px] transition-all"
                          >
                            <Download size={14} /> تحميل ملف الترخيص (.marolic)
                          </button>
                        </div>
                      </div>
                    </div>

                    <div>
                      <span className="text-slate-500 text-[10px] block uppercase mb-1">الترخيص في صيغة JSON:</span>
                      <textarea 
                        readOnly
                        value={JSON.stringify(generatedLicense, null, 2)}
                        rows={10}
                        className="w-full bg-[#0b0f1a] border border-slate-800 rounded-xl p-3 text-[9px] font-mono text-emerald-400 leading-relaxed resize-none"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="p-12 text-center border-2 border-dashed border-[#1e293b] rounded-2xl text-slate-500 text-xs">
                    بانتظار بناء معايير الترخيص والتوقيع عليها رقمياً بالمفتاح الخاص للمطور.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
