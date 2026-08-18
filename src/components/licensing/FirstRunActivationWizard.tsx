/**
 * @file FirstRunActivationWizard.tsx
 * @module المكونات القابلة لإعادة الاستخدام (Reusable Components)
 * @description معالج التفعيل الأول لمؤسسات MARO ERP عند غياب الترخيص الرقمي.
 * يوفر دورة تفعيل متكاملة (بناء الطلب -> رمز الاستجابة السريعة -> تصدير -> توقيع المطور -> رفع وتفعيل أوفلاين).
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
  Mail,
  Phone,
  MessageSquare,
  Share2,
  ArrowRight,
  ArrowLeft,
  ChevronRight
} from 'lucide-react';
import QRCode from 'qrcode';
import { toast } from 'react-hot-toast';

interface FirstRunActivationWizardProps {
  onActivated?: () => void;
}

export const FirstRunActivationWizard: React.FC<FirstRunActivationWizardProps> = ({ onActivated }) => {
  // Wizard Steps: 'collect' | 'request' | 'import' | 'developer' | 'success'
  const [activeStep, setActiveStep] = useState<'collect' | 'request' | 'import' | 'developer' | 'success'>('collect');
  const [loading, setLoading] = useState(false);

  // System and Device Info
  const [deviceIdentity, setDeviceIdentity] = useState<any>(null);

  // Form Fields
  const [companyName, setCompanyName] = useState('');
  const [businessActivity, setBusinessActivity] = useState('RETAIL');
  const [responsibleName, setResponsibleName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [requestedModules, setRequestedModules] = useState<string[]>([
    'POS', 'SALES', 'PURCHASES', 'INVENTORY', 'ACCOUNTING', 'REPORTS', 'AI'
  ]);

  // Request Data
  const [activationRequest, setActivationRequest] = useState<any>(null);
  const [requestQrCodeUrl, setRequestQrCodeUrl] = useState<string>('');

  // License Import Field
  const [signedLicenseInput, setSignedLicenseInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Developer Panel Fields
  const [devPassword, setDevPassword] = useState('');
  const [isDevAuthorized, setIsDevAuthorized] = useState(false);
  const [devPrivateKey, setDevPrivateKey] = useState('');
  const [devPlan, setDevPlan] = useState<'FREE' | 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE' | 'UNLIMITED'>('ENTERPRISE');
  const [devMaxUsers, setDevMaxUsers] = useState(50);
  const [devMaxBranches, setDevMaxBranches] = useState(10);
  const [devMaxWarehouses, setDevMaxWarehouses] = useState(15);
  const [devMaxPosDevices, setDevMaxPosDevices] = useState(20);
  const [devModules, setDevModules] = useState<string[]>([
    'POS', 'SALES', 'PURCHASES', 'INVENTORY', 'ACCOUNTING', 'REPORTS', 'AI'
  ]);
  const [devDurationDays, setDevDurationDays] = useState(365);
  const [devGeneratedLicense, setDevGeneratedLicense] = useState<any>(null);
  const [devGeneratedQr, setDevGeneratedQr] = useState<string>('');

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

  // Load device info on mount
  useEffect(() => {
    const fetchDeviceData = async () => {
      try {
        const res = await fetch('/api/licensing/device-identity');
        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            setDeviceIdentity(data.identity);
          }
        }
      } catch (err) {
        console.error('Error fetching device identity:', err);
      }
    };
    fetchDeviceData();
  }, []);

  const handleToggleModule = (code: string) => {
    if (requestedModules.includes(code)) {
      setRequestedModules(prev => prev.filter(m => m !== code));
    } else {
      setRequestedModules(prev => [...prev, code]);
    }
  };

  const handleToggleDevModule = (code: string) => {
    if (devModules.includes(code)) {
      setDevModules(prev => prev.filter(m => m !== code));
    } else {
      setDevModules(prev => [...prev, code]);
    }
  };

  // Generate Activation Request
  const handleCreateActivationRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim()) {
      toast.error('يرجى إدخال اسم الشركة أو المؤسسة أولاً');
      return;
    }
    if (!responsibleName.trim()) {
      toast.error('يرجى إدخال اسم الشخص المسؤول');
      return;
    }
    if (!phone.trim()) {
      toast.error('يرجى إدخال رقم هاتف للتواصل وسرعة التفعيل');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/licensing/activation-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company: {
            companyName: companyName.trim(),
            vertical: businessActivity
          },
          contact: {
            email: email.trim(),
            phone: phone.trim(),
            responsibleName: responsibleName.trim(),
            address: address.trim()
          },
          requested: {
            plan: 'ENTERPRISE',
            modules: requestedModules
          }
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setActivationRequest(data.requestPackage);
          // Generate QR code URL
          const qrData = JSON.stringify(data.requestPackage);
          const qrUrl = await QRCode.toDataURL(qrData, { margin: 2, scale: 5 });
          setRequestQrCodeUrl(qrUrl);
          setActiveStep('request');
          toast.success('تم إنشاء كود تفعيل الهوية الرقمية لجهازك بنجاح!');
        } else {
          toast.error(data.error || 'فشل في إنشاء الطلب.');
        }
      } else {
        toast.error('استجابة غير صالحة من السيرفر المحلي.');
      }
    } catch (err: any) {
      toast.error(`خطأ أثناء الاتصال: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Copy helper
  const handleCopyToClipboard = (text: string, successMsg: string) => {
    navigator.clipboard.writeText(text);
    toast.success(successMsg);
  };

  // Download .maroreq file
  const handleDownloadRequestFile = () => {
    if (!activationRequest) return;
    const blob = new Blob([JSON.stringify(activationRequest, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `MARO_ACTIVATION_${companyName.replace(/\s+/g, '_')}.maroreq`;
    link.click();
    toast.success('تم تحميل ملف الهوية الرقمية (.maroreq) لتقديمه للمطور.');
  };

  // Send to WhatsApp Technical Support
  const handleSendToWhatsApp = async () => {
    if (!activationRequest) return;
    
    // Auto-record request into central licensing queue
    try {
      await fetch('/api/licensing/submit-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestPackage: activationRequest,
          notes: 'طلب تفعيل مرسل مباشرة عبر معالج البدء / الواتساب'
        })
      });
    } catch (e) {
      console.warn('Failed to post request to central queue:', e);
    }

    // Format text
    const message = `مرحباً دعم منصة مارو للأعمال (MARO Business Platform),\n\nأود طلب ترخيص المنصة أوفلاين للمؤسسة التالية:\n` +
      `🏢 الشركة: ${activationRequest.company?.companyName}\n` +
      `💼 النشاط: ${activationRequest.company?.vertical}\n` +
      `👤 المسؤول: ${activationRequest.contact?.responsibleName || 'غير محدد'}\n` +
      `📞 هاتف: ${activationRequest.contact?.phone}\n` +
      `✉️ البريد: ${activationRequest.contact?.email || 'لا يوجد'}\n` +
      `💻 معرف جهاز العميل: ${activationRequest.device?.persistentDeviceId}\n` +
      `🔐 بصمة التشفير: ${activationRequest.device?.compositeHash}\n` +
      `📦 موديولات: ${activationRequest.requested?.modules?.join(', ')}\n\n` +
      `الرجاء مراجعة البيانات وتوقيع وإصدار ملف الترخيص (.marolic) واعتماده في السيرفر المركزي. شكراً لك!`;

    const encoded = encodeURIComponent(message);
    const whatsappUrl = `https://api.whatsapp.com/send?phone=201000000000&text=${encoded}`; // Predefined template support
    window.open(whatsappUrl, '_blank');
    toast.success('تم تسجيل طلبك وتوجيهك الآن إلى واتساب الدعم الفني لمراجعة واعتماد الترخيص.');
  };

  // Upload signed license file
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);
        if (parsed.signature && parsed.licenseId) {
          setSignedLicenseInput(content);
          toast.success('تم استيراد ملف الترخيص (.marolic) بنجاح!');
        } else {
          toast.error('الملف غير صالح أو لا يحتوي على توقيع رقمي معتمد.');
        }
      } catch {
        toast.error('فشل في قراءة الملف، يرجى التأكد من اختيار ملف JSON صالح للترخيص.');
      }
    };
    reader.readAsText(file);
  };

  // Verify and activate license
  const handleActivatePlatform = async () => {
    if (!signedLicenseInput.trim()) {
      toast.error('الرجاء إدخال أو رفع كود الترخيص الصادر للبدء.');
      return;
    }

    setLoading(true);
    try {
      let signedLicense;
      try {
        signedLicense = JSON.parse(signedLicenseInput.trim());
      } catch {
        toast.error('الترخيص المدخل غير صالح، يجب أن يكون بتنسيق JSON المعياري.');
        setLoading(false);
        return;
      }

      const res = await fetch('/api/licensing/activate-ed25519', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signedLicense })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          localStorage.setItem('maro_erp_first_run_completed', 'true');
          toast.success('تم تفعيل منصة MARO للأعمال بنجاح تام! تم فك تجميد السيرفر أوفلاين.');
          setActiveStep('success');
        } else {
          toast.error(data.error || 'فشل التفعيل. يرجى التأكد أن الترخيص موقع ومربوط بهوية هذا الجهاز.');
        }
      } else {
        const data = await res.json();
        toast.error(data.error || 'فشل التحقق من صحة الترخيص الرقمي.');
      }
    } catch (err: any) {
      toast.error(`خطأ أثناء عملية التنشيط: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Instant 1-Click Master Enterprise Activation
  const handleInstantActivation = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/licensing/activate-instant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          localStorage.setItem('maro_erp_first_run_completed', 'true');
          localStorage.setItem('maro_erp_license_cache', JSON.stringify({
            valid: true,
            status: 'ACTIVE',
            plan: 'UNLIMITED',
            allowOperationalWrite: true,
            allowAdminAccess: true,
            enabledModules: ['POS', 'SALES', 'PURCHASES', 'INVENTORY', 'ACCOUNTING', 'REPORTS', 'AI', 'CUSTOMERS', 'SUPPLIERS', 'WAREHOUSES', 'CRM', 'MANUFACTURING', 'TOURISM', 'MEDICAL', 'RESTAURANTS', 'SECURITY'],
            companyName: companyName || 'مؤسسة مارو للأعمال',
            daysRemaining: 3650
          }));
          toast.success('تم تفعيل ترخيص المؤسسات الشامل بنجاح!');
          setActiveStep('success');
          if (onActivated) {
            setTimeout(() => onActivated(), 400);
          }
        } else {
          toast.error(data.error || 'فشل التفعيل الفوري.');
        }
      }
    } catch (err: any) {
      toast.error(`خطأ: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Developer Authorization Check
  const handleDeveloperAuth = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/licensing/developer/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: devPassword })
      });
      const contentType = res.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const data = await res.json();
        if (res.ok && data.success) {
          setIsDevAuthorized(true);
          toast.success('مرحباً بك مطور MARO. تم فك حماية مولد التراخيص اللامتناظرة.');
          // Automatically fetch valid default key pair
          try {
            const keyRes = await fetch('/api/licensing/developer/keygen', { method: 'POST' });
            if (keyRes.ok) {
              const keyData = await keyRes.json();
              if (keyData.privateKeyPem) {
                setDevPrivateKey(keyData.privateKeyPem);
              }
            }
          } catch {}
        } else {
          toast.error(data.error || 'كلمة مرور المطور غير صحيحة.');
        }
      } else {
        toast.error('كلمة مرور المطور غير صحيحة أو الاستجابة غير صالحة.');
      }
    } catch (err: any) {
      toast.error(`خطأ أثناء التحقق: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Developer Sign & Issue License
  const handleDeveloperSign = async () => {
    if (!devPrivateKey) {
      toast.error('يرجى إدخال مفتاح المطور الخاص (Private Key PEM) للتوقيع.');
      return;
    }

    setLoading(true);
    try {
      // Form request package representation
      const targetRequest = activationRequest || {
        requestId: `DEV-REQ-${Date.now()}`,
        device: deviceIdentity || {
          persistentDeviceId: 'default-dev-id',
          compositeHash: 'default-dev-hash'
        },
        company: { companyName: companyName || 'مؤسسة المروة للتقييم والتشغيل' }
      };

      const payload = {
        licenseId: `LIC-MARO-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`,
        licenseVersion: 'v2.0-asymmetric',
        keyId: 'key_ed25519_2026_v1',
        tenant: {
          tenantId: 'default-tenant',
          companyName: targetRequest.company?.companyName || 'مؤسسة تجريبية مرخصة',
          industry: targetRequest.company?.vertical || 'RETAIL'
        },
        deviceBinding: {
          persistentDeviceId: targetRequest.device?.persistentDeviceId,
          compositeHash: targetRequest.device?.compositeHash,
          maxPosDevices: devMaxPosDevices,
          allowHardwareTolerance: true
        },
        entitlements: {
          plan: devPlan,
          enabledModules: devModules,
          maxUsers: devMaxUsers,
          maxBranches: devMaxBranches,
          maxWarehouses: devMaxWarehouses,
          maxPosDevices: devMaxPosDevices
        },
        validity: {
          issuedAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + devDurationDays * 24 * 60 * 60 * 1000).toISOString(),
          gracePeriodDays: 7
        }
      };

      const res = await fetch('/api/licensing/developer/sign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          payload,
          privateKeyPem: devPrivateKey.trim()
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.signedLicense) {
          setDevGeneratedLicense(data.signedLicense);
          const qrUrl = await QRCode.toDataURL(JSON.stringify(data.signedLicense), { margin: 2, scale: 5 });
          setDevGeneratedQr(qrUrl);
          toast.success('تم إصدار وتشفير ملف الترخيص اللامتناظر بنجاح! 🔑');
        } else {
          toast.error(data.error || 'فشل التوقيع.');
        }
      } else {
        const data = await res.json();
        toast.error(data.error || 'خطأ في عملية التشفير اللامتناظرة.');
      }
    } catch (err: any) {
      toast.error(`فشل التوقيع الرقمي: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Generate new keypair helper
  const handleGenerateDevKeys = async () => {
    try {
      const res = await fetch('/api/licensing/developer/keygen', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setDevPrivateKey(data.privateKeyPem);
          toast.success('تم توليد وتثبيت مفاتيح التوقيع الرقمي المتطابق بنجاح!');
        }
      }
    } catch (err: any) {
      toast.error(`خطأ: ${err.message}`);
    }
  };

  // Finish and reload
  const handleReload = () => {
    if (onActivated) {
      onActivated();
    } else {
      window.location.reload();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#090d16] text-white flex flex-col md:flex-row h-screen overflow-hidden font-sans" dir="rtl">
      {/* Sidebar - Design Banner */}
      <div className="w-full md:w-1/3 bg-gradient-to-b from-[#111827] via-[#0f172a] to-[#020617] p-4 md:p-8 flex flex-row md:flex-col justify-between items-center md:items-stretch border-b md:border-b-0 md:border-l border-[#1e293b] select-none relative shrink-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-500/5 via-transparent to-transparent pointer-events-none"></div>
        
        <div className="flex items-center md:block w-full justify-between md:justify-start">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 md:w-12 md:h-12 bg-gradient-to-tr from-blue-600 to-indigo-600 text-white rounded-xl md:rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Key className="w-5 h-5 md:w-6 md:h-6 animate-pulse" />
            </div>
            <div>
              <span className="text-[9px] md:text-[10px] bg-blue-500/10 text-blue-400 px-1.5 py-0.5 rounded-full border border-blue-500/20 font-mono tracking-wider">
                PRO EDITION
              </span>
              <h2 className="text-sm md:text-xl font-black text-white tracking-tight mt-0.5">MARO Business</h2>
            </div>
          </div>

          <div className="mt-0 md:mt-12 space-y-6">
            <h1 className="text-xs md:text-2xl font-black leading-tight text-white hidden md:block">تنشيط السيرفر الموحد وبصمة التفعيل التلقائي</h1>
            <p className="text-xs text-slate-400 leading-relaxed hidden md:block">
              تلتزم منصة مارو للأعمال بأعلى معايير الأمان لحفظ التراخيص والبيانات محلياً. يستخدم النظام آلية التشفير اللامتناظرة <strong className="text-blue-400">Ed25519</strong> لضمان حماية خادم العميل وإلغاء الحاجة للاتصال الدائم بالسحابة (Offline-First Trust Chain).
            </p>
          </div>
        </div>

        {/* Dynamic Status / Progress Steps */}
        <div className="space-y-4 my-8 md:my-0 hidden md:block">
          <div className="flex items-center gap-3.5">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs transition-colors ${
              activeStep === 'collect' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'bg-[#151b2b] text-slate-400 border border-slate-800'
            }`}>
              ١
            </div>
            <div>
              <p className="text-xs font-black text-white">بيانات المنشأة</p>
              <p className="text-[10px] text-slate-400">تسجيل وتحديد قطاع المنشأة</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs transition-colors ${
              activeStep === 'request' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'bg-[#151b2b] text-slate-400 border border-slate-800'
            }`}>
              ٢
            </div>
            <div>
              <p className="text-xs font-black text-white">بصمة الجهاز وهويته الرقمية</p>
              <p className="text-[10px] text-slate-400">استخراج كود التفعيل والـ QR</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs transition-colors ${
              activeStep === 'import' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'bg-[#151b2b] text-slate-400 border border-slate-800'
            }`}>
              ٣
            </div>
            <div>
              <p className="text-xs font-black text-white">إدخال رمز الترخيص (.marolic)</p>
              <p className="text-[10px] text-slate-400">حقن شهادة فك تجميد السيرفر</p>
            </div>
          </div>
        </div>

        <div className="text-[10px] text-slate-500 border-t border-[#1e293b] pt-4 flex justify-between items-center hidden md:flex">
          <span>أمان المنصة المدمج: Ed25519</span>
          <button 
            type="button"
            onClick={() => setActiveStep('developer')}
            className="text-purple-400 hover:text-purple-300 font-bold hover:underline"
          >
            بوابة المطور 🔑
          </button>
        </div>

        {/* Developer link helper for mobile */}
        <div className="md:hidden flex items-center gap-2">
          <button 
            type="button"
            onClick={() => setActiveStep('developer')}
            className="bg-purple-600/10 border border-purple-500/20 px-2.5 py-1.5 rounded-lg text-[10px] font-bold text-purple-400 flex items-center gap-1"
          >
            بوابة المطور 🔑
          </button>
        </div>
      </div>

      {/* Main Form/Content Canvas */}
      <div className="flex-1 flex flex-col justify-between h-full bg-[#0a0f1d] overflow-y-auto">
        <div className="p-8 md:p-12 max-w-3xl w-full mx-auto space-y-8">
          
          {/* STEP 1: COLLECT FORM */}
          {activeStep === 'collect' && (
            <div className="space-y-6">
              {/* Quick Instant Offline Activation Card */}
              <div className="p-5 bg-gradient-to-r from-blue-900/30 via-purple-900/20 to-emerald-900/30 border border-blue-500/30 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4 shadow-xl">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 bg-blue-600/20 border border-blue-500/40 rounded-xl flex items-center justify-center text-blue-400 shrink-0">
                    <Sparkles className="w-6 h-6 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-white flex items-center gap-2">
                      <span>تفعيل ترخيص المؤسسات الدائم بنقرة واحدة (Offline Enterprise)</span>
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold">10 سنوات</span>
                    </h3>
                    <p className="text-[11px] text-slate-300 mt-0.5">
                      تخطي معالج التصدير وتنشيط خادم MARO فوراً بكافة الصلاحيات والموديولات دون الحاجة لانتظار التوقيع اليدوي.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleInstantActivation}
                  disabled={loading}
                  className="w-full md:w-auto px-5 py-2.5 bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-500 hover:to-emerald-500 text-white text-xs font-black rounded-xl shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 shrink-0 transition-all cursor-pointer"
                >
                  <ShieldCheck size={16} />
                  <span>تفعيل فوري الآن</span>
                </button>
              </div>

              <div>
                <span className="px-3 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full text-[10px] font-black">
                  الخطوة الأولى • تجميع بيانات المنشأة والنشاط
                </span>
                <h2 className="text-2xl font-black text-white mt-3">إنشاء هوية المنصة وبصمة الجهاز الرقمية</h2>
                <p className="text-xs text-slate-400 mt-1">
                  الرجاء ملء البيانات التالية بدقة لتشفيرها مع هوية العتاد الحالية لجهازك وإصدار طلب ترخيص معتمد.
                </p>
              </div>

              <form onSubmit={handleCreateActivationRequest} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-slate-300 font-bold text-xs">اسم الشركة / المؤسسة *</label>
                    <input 
                      type="text" 
                      required
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      className="w-full bg-[#131929] border border-[#1e293b] focus:border-blue-500 rounded-xl px-4 py-3 text-white text-xs outline-none transition-all"
                      placeholder="مثال: شركة المروة للمقاولات"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-slate-300 font-bold text-xs">النشاط التجاري الرئيسي *</label>
                    <select 
                      value={businessActivity}
                      onChange={(e) => setBusinessActivity(e.target.value)}
                      className="w-full bg-[#131929] border border-[#1e293b] focus:border-blue-500 rounded-xl px-4 py-3 text-white text-xs outline-none transition-all"
                    >
                      <option value="RETAIL">التجزئة والهايبرماركت</option>
                      <option value="WHOLESALE">الجملة والتوزيع</option>
                      <option value="CERAMICS">سيراميك ومواد صحية ومواد بناء</option>
                      <option value="ELECTRONICS">أجهزة كهربائية وإلكترونيات وصيانة</option>
                      <option value="PHARMACY">صيدليات ومجمعات طبية</option>
                      <option value="RESTAURANT">مطاعم ومطابخ وكافيهات</option>
                      <option value="MANUFACTURING">المصانع والتصنيع (MRP)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-slate-300 font-bold text-xs">اسم الشخص المسؤول (المدير الإداري) *</label>
                    <input 
                      type="text" 
                      required
                      value={responsibleName}
                      onChange={(e) => setResponsibleName(e.target.value)}
                      className="w-full bg-[#131929] border border-[#1e293b] focus:border-blue-500 rounded-xl px-4 py-3 text-white text-xs outline-none transition-all"
                      placeholder="مثال: المهندس أحمد محمد"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-slate-300 font-bold text-xs">رقم هاتف الواتساب للتواصل والتحقق *</label>
                    <input 
                      type="tel" 
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full bg-[#131929] border border-[#1e293b] focus:border-blue-500 rounded-xl px-4 py-3 text-white text-xs outline-none transition-all text-left"
                      placeholder="+20 100 000 000"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-slate-300 font-bold text-xs">البريد الإلكتروني للإشعارات والتفعيل (اختياري)</label>
                    <input 
                      type="email" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-[#131929] border border-[#1e293b] focus:border-blue-500 rounded-xl px-4 py-3 text-white text-xs outline-none transition-all text-left"
                      placeholder="info@yourcompany.com"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-slate-300 font-bold text-xs">العنوان الجغرافي للمقر الرئيسي</label>
                    <input 
                      type="text" 
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="w-full bg-[#131929] border border-[#1e293b] focus:border-blue-500 rounded-xl px-4 py-3 text-white text-xs outline-none transition-all"
                      placeholder="مثال: القاهرة، مدينة نصر"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-slate-300 font-bold text-xs block">الموديولات وحزم العمليات المطلوبة للترخيص</label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5">
                    {MODULE_OPTIONS.map((m) => (
                      <button
                        type="button"
                        key={m.code}
                        onClick={() => handleToggleModule(m.code)}
                        className={`p-3 rounded-xl border text-right text-[11px] font-bold flex items-center justify-between transition-all ${
                          requestedModules.includes(m.code)
                            ? 'bg-blue-600/10 border-blue-500 text-blue-400'
                            : 'bg-[#131929] border-[#1e293b] text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <span>{m.name}</span>
                        {requestedModules.includes(m.code) ? (
                          <CheckCircle2 size={14} className="text-blue-400 shrink-0" />
                        ) : (
                          <span className="w-3.5 h-3.5 rounded-full border border-slate-700 shrink-0"></span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {deviceIdentity && (
                  <div className="p-4 bg-slate-900/40 rounded-xl border border-slate-800 space-y-1.5 text-[10px] text-slate-400">
                    <p className="font-bold text-slate-300 flex items-center gap-1.5">
                      <Cpu size={14} className="text-blue-500" /> بصمة الجهاز الحالية المربوطة والموثقة:
                    </p>
                    <div className="grid grid-cols-2 gap-2 font-mono">
                      <p>المعرف الدائم: <span className="text-slate-200">{deviceIdentity.persistentDeviceId}</span></p>
                      <p>المعالج: <span className="text-slate-200 truncate inline-block max-w-[200px]">{deviceIdentity.cpuModel}</span></p>
                      <p>البصمة الهيكلية: <span className="text-slate-200">{deviceIdentity.compositeHash.substring(0, 32)}...</span></p>
                      <p>نظام التشغيل: <span className="text-slate-200">{deviceIdentity.osPlatform} ({deviceIdentity.osRelease})</span></p>
                    </div>
                  </div>
                )}

                <div className="pt-4 flex justify-between items-center">
                  <button 
                    type="button"
                    onClick={() => setActiveStep('import')}
                    className="text-xs text-blue-400 font-black hover:underline flex items-center gap-1.5"
                  >
                    لدي ملف ترخيص (.marolic) بالفعل 🔑
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-8 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-xs rounded-xl shadow-lg shadow-blue-500/10 flex items-center gap-2 transition-all disabled:opacity-50"
                  >
                    {loading ? <RefreshCw className="animate-spin" size={16} /> : <FileCheck size={16} />}
                    توليد هوية التفعيل الرقمية للجهاز
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* STEP 2: SHOW ACTIVATION REQUEST QR & METRICS */}
          {activeStep === 'request' && activationRequest && (
            <div className="space-y-6">
              <div>
                <span className="px-3 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-full text-[10px] font-black">
                  الخطوة الثانية • طلب الهوية الرقمية جاهز للتسليم
                </span>
                <h2 className="text-2xl font-black text-white mt-3 font-sans">بصمة جهازك الرقمية (Activation Request Code)</h2>
                <p className="text-xs text-slate-400 mt-1">
                  قم بتقديم بصمة جهازك الرقمية المشفرة للدعم الفني لتوقيعها وإصدار ترخيص السيرفر الفوري.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 bg-[#131929] border border-[#1e293b] rounded-2xl p-6">
                {/* QR Code Container */}
                <div className="md:col-span-4 flex flex-col items-center justify-center space-y-3">
                  <div className="bg-white p-2.5 rounded-2xl shadow-xl">
                    {requestQrCodeUrl && (
                      <img src={requestQrCodeUrl} alt="Activation Request QR" className="w-40 h-40" referrerPolicy="no-referrer" />
                    )}
                  </div>
                  <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
                    <QrCode size={12} className="text-amber-500" /> مسح الهوية بهاتف الدعم
                  </span>
                </div>

                {/* Details list */}
                <div className="md:col-span-8 space-y-4">
                  <div className="border-b border-[#1e293b] pb-3">
                    <h3 className="text-xs font-black text-white">تفاصيل هوية الطلب الرقمية:</h3>
                    <p className="text-[10px] text-slate-500 mt-0.5">مؤمنة بالكامل كودياً ولا تشمل أي بيانات سرية أو مالية للمستخدم.</p>
                  </div>

                  <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[10px]">المنشأة:</span>
                      <strong className="text-white truncate block">{activationRequest.company?.companyName}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">المدير المسؤول:</span>
                      <strong className="text-white truncate block">{activationRequest.contact?.responsibleName}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">الهاتف والمراسلة:</span>
                      <strong className="text-white truncate block">{activationRequest.contact?.phone}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">معرف العتاد للترخيص:</span>
                      <strong className="text-white block font-mono text-[9px] truncate">{activationRequest.device?.persistentDeviceId}</strong>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-2">
                    <button 
                      onClick={() => handleCopyToClipboard(JSON.stringify(activationRequest), 'تم نسخ الهوية الرقمية للجهاز بنجاح!')}
                      className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-bold text-[10px] flex items-center gap-1.5 transition-all"
                    >
                      <Copy size={12} /> نسخ النص (JSON)
                    </button>
                    <button 
                      onClick={handleDownloadRequestFile}
                      className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-bold text-[10px] flex items-center gap-1.5 transition-all"
                    >
                      <Download size={12} /> تحميل بصمة التفعيل (.maroreq)
                    </button>
                  </div>
                </div>
              </div>

              {/* Contact Actions */}
              <div className="space-y-3.5">
                <h4 className="text-xs font-black text-white">خيارات تسليم البصمة للدعم الفني والتنشيط الفوري:</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <button 
                    onClick={handleSendToWhatsApp}
                    className="p-4 bg-emerald-600/10 border border-emerald-500/20 hover:border-emerald-500 rounded-2xl flex items-center justify-between group transition-all text-right cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-xl">
                        <MessageSquare size={18} />
                      </div>
                      <div>
                        <span className="text-xs font-black text-white group-hover:text-emerald-400 transition-colors">إرسال فوري لواتساب الدعم الفني</span>
                        <p className="text-[10px] text-slate-400 mt-0.5">فتح محادثة واتساب آمنة وتلقائية مع الدعم الفني المعتمد.</p>
                      </div>
                    </div>
                    <ChevronRight size={16} className="text-slate-500 group-hover:translate-x-1 transition-transform" />
                  </button>

                  <button 
                    onClick={() => setActiveStep('import')}
                    className="p-4 bg-blue-600/10 border border-blue-500/20 hover:border-blue-500 rounded-2xl flex items-center justify-between group transition-all text-right cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-blue-500/20 text-blue-400 rounded-xl">
                        <Upload size={18} />
                      </div>
                      <div>
                        <span className="text-xs font-black text-white group-hover:text-blue-400 transition-colors">لدي ملف الترخيص المعتمد (.marolic)</span>
                        <p className="text-[10px] text-slate-400 mt-0.5">رفع وتثبيت الترخيص لإطلاق قفل السيرفر مباشرة.</p>
                      </div>
                    </div>
                    <ChevronRight size={16} className="text-slate-500 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>

              <div className="flex justify-between items-center pt-4">
                <button 
                  onClick={() => setActiveStep('collect')}
                  className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5"
                >
                  <ArrowRight size={14} /> تعديل بيانات المنشأة
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: IMPORT & UNLOCK SCREEN */}
          {activeStep === 'import' && (
            <div className="space-y-6">
              <div>
                <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-[10px] font-black">
                  الخطوة الثالثة • تفعيل منصة مارو وفك التجميد أوفلاين
                </span>
                <h2 className="text-2xl font-black text-white mt-3">استيراد شهادة الترخيص الرقمي المعتمد</h2>
                <p className="text-xs text-slate-400 mt-1">
                  الرجاء رفع ملف الترخيص الصادر للمنشأة بصيغة (.marolic) أو لصق الكود الرقمي لتفعيله أوفلاين بالكامل.
                </p>
              </div>

              <div className="space-y-4">
                {/* Drag and Drop Zone / File selector */}
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-[#1e293b] hover:border-blue-500 rounded-2xl p-8 text-center cursor-pointer bg-[#131929]/50 hover:bg-[#131929] transition-all space-y-3 group"
                >
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileUpload} 
                    accept=".marolic,application/json" 
                    className="hidden" 
                  />
                  <div className="w-12 h-12 bg-blue-500/10 text-blue-400 border border-blue-500/20 group-hover:bg-blue-500 group-hover:text-white rounded-xl flex items-center justify-center mx-auto transition-colors">
                    <Upload size={20} />
                  </div>
                  <div>
                    <span className="text-xs font-black text-white block">انقر لاختيار ملف الترخيص المعتمد (.marolic)</span>
                    <p className="text-[10px] text-slate-400 mt-1">أو اسحب وأسقط الملف في هذه المنطقة لتسجيله تلقائياً</p>
                  </div>
                </div>

                {/* Plain-text Paste container */}
                <div className="space-y-1.5">
                  <label className="text-slate-300 font-bold text-xs">أو قم بلصق كود التفعيل بالكامل (JSON Format) هنا:</label>
                  <textarea 
                    value={signedLicenseInput}
                    onChange={(e) => setSignedLicenseInput(e.target.value)}
                    rows={8}
                    className="w-full bg-[#131929] border border-[#1e293b] focus:border-blue-500 rounded-xl p-4 text-[10px] font-mono text-emerald-400 outline-none leading-relaxed"
                    placeholder='ألصق الكود التفعيلي الذي يبدأ بـ { "licenseId": ... "signature": ... }'
                  />
                </div>

                <div className="flex justify-between items-center pt-4">
                  <button 
                    onClick={() => setActiveStep('request')}
                    className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5"
                  >
                    <ArrowRight size={14} /> عرض وتصدير كود الهوية الرقمية لجهازي
                  </button>

                  <button 
                    onClick={handleActivatePlatform}
                    disabled={loading || !signedLicenseInput}
                    className="px-8 py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs rounded-xl shadow-lg shadow-emerald-500/10 flex items-center gap-2 transition-all disabled:opacity-50"
                  >
                    {loading ? <RefreshCw className="animate-spin" size={16} /> : <FileCheck size={16} />}
                    تفعيل المنظومة وإطلاق التشغيل 🚀
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* DEVELOPER SIGNING HUB - 100% OFFLINE LOCAL TESTABILITY */}
          {activeStep === 'developer' && (
            <div className="space-y-6">
              <div>
                <span className="px-3 py-1 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded-full text-[10px] font-black animate-pulse">
                  Developer Sandbox & Asymmetric Signature Key Ring
                </span>
                <h2 className="text-2xl font-black text-white mt-3">بوابة مطوري وشبكة عملاء MARO Enterprise</h2>
                <p className="text-xs text-slate-400 mt-1">
                  لوحة مخصصة ومدمجة تتيح للمطور فك حماية المنصة، توليد واختبار شهادات Ed25519 اللامتناظرة فوراً بشكل متكامل.
                </p>
              </div>

              {!isDevAuthorized ? (
                <div className="bg-[#131929] border border-[#1e293b] rounded-2xl p-6 space-y-4 max-w-md mx-auto">
                  <div className="flex items-center gap-3 border-b border-[#1e293b] pb-4">
                    <div className="p-2.5 bg-purple-500/10 text-purple-400 rounded-xl">
                      <Lock size={18} />
                    </div>
                    <div>
                      <h3 className="font-black text-sm text-white">إثبات صلاحية مطور معتمد</h3>
                      <p className="text-[10px] text-slate-400">يلزم إدخال رمز التحقق الخاص بالبيئة الحالية لفتح لوحة التوقيع.</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-slate-300 font-bold text-xs">كلمة مرور المطور / أدمن السيرفر *</label>
                    <input 
                      type="password"
                      value={devPassword}
                      onChange={(e) => setDevPassword(e.target.value)}
                      className="w-full bg-[#0a0f1d] border border-[#1e293b] rounded-xl px-4 py-3 text-white text-xs outline-none focus:border-purple-500"
                      placeholder="أدخل الرمز الافتراضي (admin) للتجربة..."
                    />
                  </div>

                  <button 
                    onClick={handleDeveloperAuth}
                    className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-black transition-all"
                  >
                    فك حماية حلقة المفاتيح 🔓
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Key Generator Controls */}
                  <div className="bg-[#131929] border border-[#1e293b] rounded-2xl p-6 space-y-4">
                    <div className="flex items-center justify-between border-b border-[#1e293b] pb-3">
                      <div>
                        <h3 className="font-black text-sm text-white flex items-center gap-2">
                          <Cpu size={16} className="text-purple-400" /> مولد حلقة التشفير (Ed25519 Keypair Generator)
                        </h3>
                        <p className="text-[10px] text-slate-400 mt-0.5">توليد زوج مفاتيح التوقيع الرقمي للمطور فوري لتوقيع التراخيص محلياً.</p>
                      </div>
                      <button 
                        onClick={handleGenerateDevKeys}
                        className="px-3 py-1.5 bg-purple-600/20 hover:bg-purple-600 text-purple-300 hover:text-white rounded-lg font-black text-[10px] flex items-center gap-1.5 transition-all border border-purple-500/20"
                      >
                        <RefreshCw size={12} /> توليد زوج مفاتيح جديد
                      </button>
                    </div>

                    <div className="space-y-3">
                      <div className="space-y-1">
                        <span className="text-slate-400 text-[10px] font-mono">1. مفتاح التوقيع الخاص (Private Key Pem - Ed25519) *</span>
                        <textarea 
                          value={devPrivateKey}
                          onChange={(e) => setDevPrivateKey(e.target.value)}
                          rows={4}
                          className="w-full bg-[#0a0f1d] border border-purple-500/20 rounded-xl p-3 text-[9px] font-mono text-purple-300 leading-relaxed"
                          placeholder="سيتم تعبئة المفتاح الخاص هنا تلقائياً، أو قم بلصق مفتاح التوقيع المعياري..."
                        />
                      </div>
                    </div>
                  </div>

                  {/* Entitlements form */}
                  <div className="bg-[#131929] border border-[#1e293b] rounded-2xl p-6 space-y-4">
                    <h3 className="font-black text-sm text-white flex items-center gap-2 border-b border-[#1e293b] pb-3">
                      <Layers size={16} className="text-purple-400" /> تخصيص صلاحيات وبطاقة ترخيص السيرفر
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-slate-300 font-bold text-[10px] uppercase block mb-1">خطة الاشتراك (Plan)</label>
                        <select 
                          value={devPlan}
                          onChange={(e) => setDevPlan(e.target.value as any)}
                          className="w-full bg-[#0a0f1d] border border-slate-800 rounded-xl px-3 py-2 text-white text-xs outline-none"
                        >
                          <option value="FREE">المجانية (Free Trial)</option>
                          <option value="STARTER">المبتدئة (Starter)</option>
                          <option value="PROFESSIONAL">الاحترافية (Professional)</option>
                          <option value="ENTERPRISE">المؤسسية الكبرى (Enterprise Plan)</option>
                          <option value="UNLIMITED">اللامحدودة (Unlimited Enterprise Suite)</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-slate-300 font-bold text-[10px] uppercase block mb-1">فترة الصلاحية (بالأيام)</label>
                        <input 
                          type="number"
                          value={devDurationDays}
                          onChange={(e) => setDevDurationDays(parseInt(e.target.value) || 30)}
                          className="w-full bg-[#0a0f1d] border border-slate-800 rounded-xl px-3 py-2 text-white text-xs outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div>
                        <span className="text-slate-400 text-[9px] uppercase block mb-1">المستخدمين</span>
                        <input type="number" value={devMaxUsers} onChange={e => setDevMaxUsers(parseInt(e.target.value) || 1)} className="w-full bg-[#0a0f1d] border border-slate-800 rounded-xl p-2 text-xs text-white" />
                      </div>
                      <div>
                        <span className="text-slate-400 text-[9px] uppercase block mb-1">الفروع</span>
                        <input type="number" value={devMaxBranches} onChange={e => setDevMaxBranches(parseInt(e.target.value) || 1)} className="w-full bg-[#0a0f1d] border border-slate-800 rounded-xl p-2 text-xs text-white" />
                      </div>
                      <div>
                        <span className="text-slate-400 text-[9px] uppercase block mb-1">المستودعات</span>
                        <input type="number" value={devMaxWarehouses} onChange={e => setDevMaxWarehouses(parseInt(e.target.value) || 1)} className="w-full bg-[#0a0f1d] border border-slate-800 rounded-xl p-2 text-xs text-white" />
                      </div>
                      <div>
                        <span className="text-slate-400 text-[9px] uppercase block mb-1">أجهزة الـ POS</span>
                        <input type="number" value={devMaxPosDevices} onChange={e => setDevMaxPosDevices(parseInt(e.target.value) || 1)} className="w-full bg-[#0a0f1d] border border-slate-800 rounded-xl p-2 text-xs text-white" />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-slate-300 font-bold text-[10px] uppercase block mb-1">تحديد الموديولات المصرحة بالترخيص</label>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {MODULE_OPTIONS.map((m) => (
                          <button
                            type="button"
                            key={m.code}
                            onClick={() => handleToggleDevModule(m.code)}
                            className={`p-2.5 rounded-lg border text-right text-[10px] font-bold flex items-center justify-between transition-all ${
                              devModules.includes(m.code)
                                ? 'bg-purple-600/10 border-purple-500 text-purple-400'
                                : 'bg-[#0a0f1d] border-slate-800 text-slate-400 hover:border-slate-700'
                            }`}
                          >
                            <span>{m.name}</span>
                            {devModules.includes(m.code) ? (
                              <CheckCircle2 size={12} className="text-purple-400 shrink-0" />
                            ) : (
                              <span className="w-3 h-3 rounded-full border border-slate-700 shrink-0"></span>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>

                    <button 
                      onClick={handleDeveloperSign}
                      disabled={loading || !devPrivateKey}
                      className="w-full py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-xs rounded-xl shadow-lg shadow-purple-500/10 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                    >
                      <FileCheck size={16} /> توقيع وإصدار شهادة الترخيص فوراً (.marolic)
                    </button>
                  </div>

                  {/* Dev Output container */}
                  {devGeneratedLicense && (
                    <div className="bg-[#131929] border border-[#1e293b] rounded-2xl p-6 space-y-4">
                      <div className="flex items-center justify-between border-b border-[#1e293b] pb-3">
                        <h3 className="font-black text-sm text-white">الترخيص الرقمي الموقع (Signed License Result)</h3>
                        <button 
                          onClick={() => handleCopyToClipboard(JSON.stringify(devGeneratedLicense), 'تم نسخ ترخيص السيرفر الصادر بالكامل!')}
                          className="text-[10px] text-blue-400 font-bold flex items-center gap-1 hover:underline"
                        >
                          <Copy size={12} /> نسخ كود الترخيص الصادر
                        </button>
                      </div>

                      <div className="flex flex-col md:flex-row gap-4 items-center">
                        <div className="bg-white p-2 rounded-xl shadow-md shrink-0">
                          {devGeneratedQr && (
                            <img src={devGeneratedQr} alt="Signed License QR" className="w-28 h-28" referrerPolicy="no-referrer" />
                          )}
                        </div>
                        <div className="text-[10px] space-y-1.5 text-slate-400 flex-1 leading-relaxed">
                          <p className="font-bold text-slate-200">لقد تم إصدار شهادة التوقيع الرقمي بنجاح!</p>
                          <p>تم حقن وبصم ترخيص السيرفر على هوية جهاز العميل بالتشفير اللامتناظر.</p>
                          <div className="pt-2 flex gap-2">
                            <button 
                              onClick={() => {
                                const blob = new Blob([JSON.stringify(devGeneratedLicense, null, 2)], { type: 'application/json' });
                                const url = URL.createObjectURL(blob);
                                const link = document.createElement('a');
                                link.href = url;
                                link.download = `MARO_SIGNED_LICENSE_${companyName.replace(/\s+/g, '_') || 'SANDBOX'}.marolic`;
                                link.click();
                                toast.success('تم تحميل ملف الترخيص الجديد (.marolic) بنجاح.');
                              }}
                              className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-bold text-[10px] flex items-center gap-1 transition-all"
                            >
                              <Download size={12} /> تحميل ملف الترخيص (.marolic)
                            </button>
                            <button 
                              onClick={() => {
                                setSignedLicenseInput(JSON.stringify(devGeneratedLicense, null, 2));
                                setActiveStep('import');
                                toast.success('تم نقل الترخيص تلقائياً إلى تبويب التفعيل! قم بالنقر على تنشيط الآن.');
                              }}
                              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold text-[10px] flex items-center gap-1 transition-all"
                            >
                              <Check size={12} /> استخدام الترخيص لتنشيط هذا السيرفر فورا
                            </button>
                          </div>
                        </div>
                      </div>

                      <textarea 
                        readOnly
                        value={JSON.stringify(devGeneratedLicense, null, 2)}
                        rows={6}
                        className="w-full bg-[#0a0f1d] border border-[#1e293b] rounded-xl p-3 text-[9px] font-mono text-emerald-400 outline-none leading-relaxed resize-none"
                      />
                    </div>
                  )}

                  <div className="flex justify-between pt-4">
                    <button 
                      onClick={() => setIsDevAuthorized(false)}
                      className="text-xs text-slate-400 hover:text-white"
                    >
                      خروج من بوابة المطور
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* SUCCESS UNLOCKED SCREEN */}
          {activeStep === 'success' && (
            <div className="space-y-8 text-center py-12 animate-in fade-in zoom-in duration-500">
              <div className="w-24 h-24 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-full flex items-center justify-center mx-auto shadow-2xl shadow-emerald-500/10 relative">
                <CheckCircle2 size={48} className="animate-bounce" />
                <div className="absolute inset-0 rounded-full border-4 border-emerald-500/20 animate-ping"></div>
              </div>

              <div className="space-y-3">
                <h2 className="text-3xl font-black text-white">تم تنشيط منصة MARO للأعمال بنجاح تام!</h2>
                <p className="text-sm text-slate-400 max-w-lg mx-auto leading-relaxed">
                  مرحباً بك في عالم الريادة الرقمية أوفلاين. تم التحقق من سلامة التوقيع الرقمي ومطابقة الهوية الرقمية للعتاد بنجاح بنسبة 100%. تم فتح السيرفر بالكامل وإلغاء قيود التشغيل.
                </p>
              </div>

              <div className="p-5 bg-slate-900/50 rounded-2xl border border-slate-800/80 max-w-md mx-auto grid grid-cols-2 gap-4 text-xs text-slate-400">
                <div className="text-right">
                  <span className="block text-[10px] text-slate-500">اسم المؤسسة:</span>
                  <strong className="text-white block mt-0.5">{companyName || 'مؤسستك المرخصة'}</strong>
                </div>
                <div className="text-right">
                  <span className="block text-[10px] text-slate-500">خطة الترخيص:</span>
                  <strong className="text-emerald-400 block mt-0.5 flex items-center gap-1 justify-end">
                    <ShieldCheck size={14} /> المؤسسية الكبرى (Enterprise)
                  </strong>
                </div>
              </div>

              <button 
                onClick={handleReload}
                className="px-10 py-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-sm rounded-xl shadow-xl shadow-emerald-500/10 flex items-center gap-2 transition-all mx-auto"
              >
                الدخول إلى لوحة تحكم المنصة الآن
                <ChevronRight size={18} />
              </button>
            </div>
          )}

        </div>

        {/* Footer controls */}
        {activeStep !== 'success' && (
          <div className="border-t border-[#1e293b] bg-[#0c1224] py-4 px-8 flex justify-between items-center text-xs select-none">
            <p className="text-slate-500">منظومة MARO لإدارة وتنشيط التراخيص الموزعة.</p>
            <div className="flex gap-4">
              <button 
                onClick={() => {
                  if (activeStep === 'developer') {
                    setActiveStep('collect');
                  } else if (activeStep === 'import' || activeStep === 'request') {
                    setActiveStep('collect');
                  } else {
                    setActiveStep('import');
                  }
                }}
                className="text-blue-400 font-bold hover:underline"
              >
                {activeStep === 'collect' ? 'تنشيط يدوي (.marolic)' : 'معالج طلب الهوية'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
