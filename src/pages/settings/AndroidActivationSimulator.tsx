/**
 * @file AndroidActivationSimulator.tsx
 * @module واجهات وصفحات النظام (UI Pages)
 * @description محاكي تطبيق الأندرويد الرسمي لإدارة وتفعيل تراخيص MARO Business ومراقبة الأحداث الأمنية ومكافحة الاستنساخ.
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Smartphone, 
  Wifi, 
  WifiOff, 
  QrCode, 
  RefreshCw, 
  CheckCircle, 
  AlertTriangle, 
  Lock, 
  Unlock, 
  Cpu, 
  Layers, 
  Key, 
  Copy, 
  Upload, 
  Download, 
  ShieldAlert, 
  Terminal, 
  Activity, 
  Info,
  Server,
  HelpCircle,
  Eye,
  Camera,
  Play
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'react-hot-toast';
import QRCode from 'qrcode';
import { useNavigate } from 'react-router-dom';

interface LogEntry {
  id: string;
  time: string;
  type: 'info' | 'success' | 'warn' | 'error';
  source: string;
  message: string;
}

export const AndroidActivationSimulator: React.FC = () => {
  const navigate = useNavigate();
  const isStandalone = window.location.pathname === '/android-activation-standalone';

  // Simulator States
  const [isOnline, setIsOnline] = useState(true);
  const [deviceIdentity, setDeviceIdentity] = useState<any>(null);
  const [activeLicense, setActiveLicense] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'home' | 'scan' | 'manual' | 'about'>('home');
  const [manualCode, setManualCode] = useState('');
  
  // Real-time Telemetry Logs
  const [logs, setLogs] = useState<LogEntry[]>([
    { id: '1', time: new Date().toLocaleTimeString(), type: 'info', source: 'Android-OS', message: 'تم إقلاع محاكي تطبيق تفعيل MARO Business للأندرويد بنجاح.' },
    { id: '2', time: new Date().toLocaleTimeString(), type: 'info', source: 'SecEngine', message: 'جاري جلب معرف بصمة عتاد السيرفر المحلي...' }
  ]);

  // QR Scanning States
  const [scanInput, setScanInput] = useState('');
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraStreamSimulated, setCameraStreamSimulated] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Central Hub Sync Settings
  const [showFormulaInfo, setShowFormulaInfo] = useState(false);

  // Load identity and status from server
  const loadStatus = async () => {
    try {
      // 1. Fetch license status
      const licRes = await fetch('/api/licensing/status');
      if (licRes.ok) {
        const licData = await licRes.json();
        setActiveLicense(licData);
      }

      // 2. Fetch device identity
      const devRes = await fetch('/api/licensing/device-identity');
      if (devRes.ok) {
        const devData = await devRes.json();
        if (devData.success) {
          setDeviceIdentity(devData.identity);
          addLog('info', 'SecEngine', `تم جلب بصمة العتاد: ${devData.identity.compositeHash.substring(0, 16)}...`);
        }
      }
    } catch (err) {
      addLog('error', 'SecEngine', 'فشل الاتصال بـ API التراخيص المحلي.');
    }
  };

  useEffect(() => {
    loadStatus();
  }, []);

  const addLog = (type: 'info' | 'success' | 'warn' | 'error', source: string, message: string) => {
    setLogs(prev => [
      {
        id: Math.random().toString(),
        time: new Date().toLocaleTimeString(),
        type,
        source,
        message
      },
      ...prev.slice(0, 49) // Keep last 50
    ]);
  };

  // Simulated Online Activation Flow
  const handleOnlineActivation = async () => {
    if (!isOnline) {
      toast.error('لا يمكن التفعيل التلقائي أونلاين: المحاكي مضبوط في وضع أوفلاين (غير متصل بالإنترنت).');
      addLog('warn', 'Activator', 'محاولة تفعيل أونلاين فاشلة: الهاتف مقطوع عن الإنترنت.');
      return;
    }

    if (!deviceIdentity) {
      toast.error('لم يتم تحميل مواصفات عتاد الجهاز الحالي بعد.');
      return;
    }

    setIsLoading(true);
    addLog('info', 'NetClient', `جاري إرسال طلب التفعيل الأونلاين لمعرف الجهاز: ${deviceIdentity.persistentDeviceId}`);
    
    try {
      // Simulate network lag
      await new Promise(resolve => setTimeout(resolve, 1500));

      const res = await fetch('/api/licensing/online-activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceId: deviceIdentity.persistentDeviceId })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(data.message, { duration: 6000 });
        addLog('success', 'SecEngine', 'تم التحقق من التوقيع الرقمي Ed25519 أونلاين بنجاح!');
        addLog('success', 'Activator', `تم تفعيل المنشأة: ${data.signedLicense.tenant.companyName}`);
        await loadStatus();
        setActiveTab('home');
      } else {
        toast.error(data.error || 'فشل التفعيل التلقائي.');
        addLog('error', 'NetClient', `رفض السيرفر المركزي الطلب: ${data.error}`);
      }
    } catch (err: any) {
      toast.error(`خطأ اتصال بالسيرفر: ${err.message}`);
      addLog('error', 'NetClient', `خطأ في اتصال الشبكة: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Apply JSON / Text code manually
  const handleApplyCode = async (codeText: string) => {
    if (!codeText.trim()) {
      toast.error('الرجاء إدخال كود أو نص التفعيل المعتمد أولاً.');
      return;
    }

    setIsLoading(true);
    addLog('info', 'SecEngine', 'جاري فك تشفير وفحص حزمة التوقيع الرقمي المُدخلة...');

    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      let signedLicense;
      try {
        signedLicense = JSON.parse(codeText.trim());
      } catch {
        addLog('error', 'SecEngine', 'الحزمة المدخلة ليست كود JSON صالح.');
        toast.error('الحزمة المُدخلة ليست كود JSON صالح.');
        setIsLoading(false);
        return;
      }

      const res = await fetch('/api/licensing/activate-ed25519', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signedLicense })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(data.message);
        addLog('success', 'SecEngine', 'التحقق اللامتناظر Ed25519: صالح بنسبة 100%!');
        addLog('success', 'Activator', `تم تفعيل الترخيص أوفلاين بنجاح لـ ${signedLicense.tenant.companyName}`);
        await loadStatus();
        setActiveTab('home');
        setManualCode('');
        setScanInput('');
      } else {
        toast.error(data.error || 'فشل تفعيل الترخيص.');
        addLog('error', 'SecEngine', `فشل توثيق الترخيص: ${data.error}`);
      }
    } catch (err: any) {
      toast.error(err.message);
      addLog('error', 'SecEngine', `فشل تطبيق الترخيص: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Simulate scanning a QR file upload
  const handleQrFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const content = event.target?.result as string;
        addLog('info', 'QrDecoder', `تم تحميل ملف الترخيص بنجاح بحجم ${content.length} بايت.`);
        setScanInput(content);
        toast.success('تمت قراءة كود التفعيل بنجاح من الملف!');
      } catch {
        toast.error('فشل قراءة الملف.');
      }
    };
    reader.readAsText(file);
  };

  // Simulate local Deactivation for trial setup
  const handleDeactivate = async () => {
    if (!window.confirm('هل أنت متأكد من إلغاء التفعيل؟ سيتحول النظام للوضع غير المرخص فوراً.')) return;
    setIsLoading(true);
    addLog('warn', 'Activator', 'طلب إلغاء تفعيل الترخيص الحالي...');

    try {
      const res = await fetch('/api/licensing/deactivate', { method: 'POST' });
      if (res.ok) {
        toast.success('تم إلغاء تفعيل السيرفر بنجاح.');
        addLog('warn', 'SecEngine', 'تم مسح ملف الترخيص المحلي بنجاح. تجميد موديولات المنظومة.');
        await loadStatus();
      } else {
        toast.error('فشل إلغاء التفعيل.');
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Copy helper
  const copyText = (txt: string, msg: string) => {
    navigator.clipboard.writeText(txt);
    toast.success(msg);
    addLog('info', 'UserAction', `تم نسخ الكود: ${txt.substring(0, 15)}...`);
  };

  return (
    <div className="p-8 space-y-8 bg-[#070b13] text-white min-h-screen font-sans" dir="rtl">
      {/* Top Main Navigation Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#131b2e] pb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-tr from-purple-600 to-indigo-600 text-white rounded-2xl shadow-lg shadow-purple-500/20">
            <Smartphone size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">بوابة الأندرويد للأعمال والتحقق الآمن (MARO Business Mobile Engine)</h1>
            <p className="text-xs text-slate-400 font-medium mt-1">
              تطبيق أندرويد متكامل يحاكي منظومة التفعيل اللامركزية والتحقق الفوري مع مكافحة القرصنة والاستنساخ.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <span className="text-xs text-slate-400 font-bold">وضع العرض:</span>
          {isStandalone ? (
            <button 
              onClick={() => navigate('/')}
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-lg shadow-blue-500/10 transition-all"
            >
              العودة للوحة المنصة 🏠
            </button>
          ) : (
            <button 
              onClick={() => navigate('/android-activation-standalone')}
              className="px-4 py-2 bg-gradient-to-r from-purple-600/20 to-indigo-600/20 hover:from-purple-600 hover:to-indigo-600 text-purple-300 hover:text-white border border-purple-500/30 rounded-xl text-xs font-black flex items-center gap-1.5 shadow-lg transition-all"
            >
              فتح في صفحة مستقلة كاملة 🖥️
            </button>
          )}

          <span className="text-xs text-slate-400 font-bold">اتصال الهاتف:</span>
          <button 
            onClick={() => {
              setIsOnline(!isOnline);
              addLog('info', 'NetClient', `تم تغيير حالة الشبكة للجهاز المحمول إلى: ${!isOnline ? 'أونلاين (متصل)' : 'أوفلاين (منقطع)'}`);
            }}
            className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 border transition-all ${
              isOnline 
                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20" 
                : "bg-red-500/10 text-red-400 border-red-500/30 hover:bg-red-500/20"
            }`}
          >
            {isOnline ? <Wifi size={14} /> : <WifiOff size={14} />}
            <span>{isOnline ? 'متصل بالإنترنت' : 'أوفلاين (بدون اتصال)'}</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Left is simulated Android Smartphone, Right is security logs and diagnostic panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left 5 Cols: Smartphone Simulator Container */}
        <div className="lg:col-span-5 flex flex-col items-center justify-center">
          <div className="w-full max-w-sm relative bg-[#0d121f] rounded-[48px] p-4 border-[10px] border-[#1e293b] shadow-2xl ring-1 ring-white/10 overflow-hidden">
            
            {/* Phone Top Notch */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-6 bg-[#1e293b] rounded-b-2xl z-50 flex items-center justify-center">
              <div className="w-12 h-1 bg-[#090d16] rounded-full"></div>
              <div className="w-3.5 h-3.5 bg-[#090d16] rounded-full ml-3 border border-slate-700"></div>
            </div>

            {/* Simulated Status Bar */}
            <div className="flex justify-between items-center px-6 pt-3 pb-2 text-[10px] text-slate-400 font-sans font-bold z-40 relative">
              <span>9:41 AM</span>
              <div className="flex items-center gap-1.5">
                {isOnline ? <Wifi size={11} className="text-emerald-400" /> : <WifiOff size={11} className="text-red-400" />}
                <span className={isOnline ? "text-emerald-400" : "text-red-400"}>{isOnline ? '4G' : 'OFFLINE'}</span>
                <div className="w-5 h-2.5 border border-slate-400 rounded-sm p-0.5 flex items-center">
                  <div className="w-full h-full bg-slate-400 rounded-xs"></div>
                </div>
              </div>
            </div>

            {/* Virtual App Screen Container */}
            <div className="bg-[#0b0f19] rounded-[36px] min-h-[580px] p-5 flex flex-col justify-between relative overflow-hidden text-right select-none">
              
              {/* Header inside App */}
              <div className="space-y-1 mt-4 text-center">
                <div className="mx-auto w-10 h-10 bg-gradient-to-tr from-purple-600 to-indigo-600 rounded-xl flex items-center justify-center text-white font-black text-lg shadow-md shadow-indigo-600/20">
                  M
                </div>
                <h2 className="text-sm font-black tracking-tight text-white mt-1">تطبيق التفعيل MARO Business</h2>
                <p className="text-[9px] text-slate-500 font-bold">بوابة التحقق اللامركزي • النسخة v1.4</p>
              </div>

              {/* Central Screen Tabs Content */}
              <div className="my-4 flex-1 flex flex-col justify-center">
                <AnimatePresence mode="wait">
                  
                  {/* TAB 1: HOME */}
                  {activeTab === 'home' && (
                    <motion.div 
                      key="home"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="space-y-4"
                    >
                      {/* Current Status Badge */}
                      <div className={`p-4 rounded-2xl border text-center space-y-1.5 ${
                        activeLicense?.valid 
                          ? "bg-emerald-500/5 border-emerald-500/20" 
                          : "bg-red-500/5 border-red-500/20"
                      }`}>
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                          activeLicense?.valid 
                            ? "bg-emerald-500/10 text-emerald-400" 
                            : "bg-red-500/10 text-red-400"
                        }`}>
                          {activeLicense?.valid ? 'نسخة مرخصة ومؤمنة' : 'بانتظار التفعيل الرقمي'}
                        </span>
                        
                        <p className="text-xs font-black text-white">
                          {activeLicense?.valid ? activeLicense.companyName : 'السيرفر المحلي متوقف'}
                        </p>
                        
                        {activeLicense?.valid && (
                          <p className="text-[9px] text-slate-400 font-mono">
                            الانتهاء: {new Date(activeLicense.expiresAt).toLocaleDateString('ar-EG')}
                          </p>
                        )}
                      </div>

                      {/* Info lines */}
                      <div className="space-y-2 text-[10px] font-bold p-3 bg-slate-900/40 rounded-2xl border border-slate-800">
                        <div className="flex justify-between">
                          <span className="text-slate-400">Persistent UUID:</span>
                          <span className="text-slate-300 font-mono tracking-tighter">
                            {deviceIdentity ? deviceIdentity.persistentDeviceId.substring(0, 16) + '...' : 'جاري التحميل...'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">البيئة الحالية:</span>
                          <span className="text-amber-500">مستودع تجريبي معزول</span>
                        </div>
                      </div>

                      {/* Main Interaction Buttons */}
                      <div className="space-y-2">
                        {/* 1. Online Activation Button */}
                        <button 
                          onClick={handleOnlineActivation}
                          disabled={isLoading}
                          className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-xs font-black shadow-lg shadow-blue-600/10 hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-1.5"
                        >
                          {isLoading ? (
                            <RefreshCw size={12} className="animate-spin" />
                          ) : (
                            <Wifi size={12} />
                          )}
                          التفعيل التلقائي الفوري (أونلاين)
                        </button>

                        <div className="grid grid-cols-2 gap-2">
                          {/* 2. Scan QR */}
                          <button 
                            onClick={() => setActiveTab('scan')}
                            className="py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-[10px] font-bold transition-all flex flex-col items-center justify-center gap-1 border border-slate-700"
                          >
                            <QrCode size={14} className="text-purple-400" />
                            مسح كود QR التفعيل
                          </button>

                          {/* 3. Manual Entry */}
                          <button 
                            onClick={() => setActiveTab('manual')}
                            className="py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-[10px] font-bold transition-all flex flex-col items-center justify-center gap-1 border border-slate-700"
                          >
                            <Key size={14} className="text-amber-400" />
                            إدخال مفتاح يدوي
                          </button>
                        </div>

                        {/* Reset Activation if licensed */}
                        {activeLicense?.valid && (
                          <button 
                            onClick={handleDeactivate}
                            className="w-full py-2 bg-red-600/10 hover:bg-red-600/20 text-red-400 border border-red-500/20 rounded-xl text-[9px] font-bold transition-all"
                          >
                            إلغاء تفعيل الترخيص (للإعادة التجريبية)
                          </button>
                        )}
                      </div>
                    </motion.div>
                  )}

                  {/* TAB 2: QR SCANNER */}
                  {activeTab === 'scan' && (
                    <motion.div 
                      key="scan"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-4 text-center"
                    >
                      <h3 className="text-xs font-black text-white">قراءة رمز الاستجابة السريعة (QR Code)</h3>
                      <p className="text-[9px] text-slate-400">وجه الكاميرا أو قم بتحميل ملف الترخيص لتطبيق التفعيل فورا.</p>

                      {/* Camera Simulation Canvas */}
                      <div className="relative w-full h-36 bg-[#000] rounded-2xl border border-[#334155] overflow-hidden flex items-center justify-center">
                        <div className="absolute inset-4 border-2 border-purple-500 rounded-lg pointer-events-none opacity-40"></div>
                        <div className="absolute top-1/2 left-0 w-full h-0.5 bg-purple-500 animate-bounce pointer-events-none"></div>
                        
                        {isCameraActive ? (
                          <div className="text-center space-y-1">
                            <Camera size={24} className="mx-auto text-purple-400 animate-pulse" />
                            <span className="text-[8px] text-purple-400 font-bold block">جاري بث الكاميرا المحمولة...</span>
                          </div>
                        ) : (
                          <button 
                            onClick={() => {
                              setIsCameraActive(true);
                              addLog('info', 'Android-Camera', 'تم فتح الكاميرا الخلفية بنجاح لجهاز الأندرويد.');
                            }}
                            className="px-3 py-1.5 bg-slate-800 text-[9px] font-bold rounded-lg hover:bg-slate-700 text-purple-400"
                          >
                            تشغيل الكاميرا
                          </button>
                        )}
                      </div>

                      {/* File Drag / Text Option */}
                      <div className="space-y-2">
                        <textarea 
                          value={scanInput}
                          onChange={(e) => setScanInput(e.target.value)}
                          placeholder="أو الصق كود التوقيع الرقمي (JSON Payload) هنا..."
                          className="w-full bg-[#05070c] border border-slate-800 rounded-xl px-2 py-1.5 text-[8px] font-mono text-emerald-400 h-16 resize-none"
                        />
                        
                        <div className="flex gap-2">
                          <button 
                            onClick={() => fileInputRef.current?.click()}
                            className="flex-1 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-[9px] font-bold transition-all flex items-center justify-center gap-1 border border-slate-700"
                          >
                            <Upload size={10} /> رفع ملف ترخيص
                          </button>
                          <input 
                            type="file" 
                            ref={fileInputRef} 
                            onChange={handleQrFileUpload} 
                            accept=".marolic,.json" 
                            className="hidden" 
                          />

                          <button 
                            onClick={() => handleApplyCode(scanInput)}
                            disabled={isLoading}
                            className="flex-1 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-[9px] font-black transition-all"
                          >
                            تفعيل البصمة
                          </button>
                        </div>
                      </div>

                      <button 
                        onClick={() => {
                          setActiveTab('home');
                          setIsCameraActive(false);
                        }}
                        className="text-[9px] text-slate-400 hover:underline block mx-auto font-bold"
                      >
                        رجوع للرئيسية
                      </button>
                    </motion.div>
                  )}

                  {/* TAB 3: MANUAL ENTRY */}
                  {activeTab === 'manual' && (
                    <motion.div 
                      key="manual"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-3"
                    >
                      <h3 className="text-xs font-black text-center text-white">إدخال رمز التفعيل يدوياً</h3>
                      <p className="text-[9px] text-slate-400 text-center">أدخل نص الترخيص الموقّع رقمياً المستلم من المطور لإتمام التثبيت أوفلاين.</p>

                      <textarea 
                        value={manualCode}
                        onChange={(e) => setManualCode(e.target.value)}
                        rows={6}
                        placeholder='{ "licenseId": "LIC-...", "signature": "...", "tenant": { ... } }'
                        className="w-full bg-[#05070c] border border-slate-800 rounded-xl px-3 py-2 text-[9px] font-mono text-amber-400 leading-normal resize-none focus:border-amber-500/50"
                      />

                      <button 
                        onClick={() => handleApplyCode(manualCode)}
                        disabled={isLoading}
                        className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 disabled:bg-amber-700 text-black font-black text-xs rounded-xl shadow-lg transition-all"
                      >
                        توثيق وتفعيل النسخة أوفلاين
                      </button>

                      <button 
                        onClick={() => setActiveTab('home')}
                        className="text-[9px] text-slate-400 hover:underline block mx-auto font-bold text-center"
                      >
                        رجوع للرئيسية
                      </button>
                    </motion.div>
                  )}

                </AnimatePresence>
              </div>

              {/* Bottom Android Soft Nav Bar */}
              <div className="flex justify-around items-center pt-2 border-t border-[#131b2e]">
                <button onClick={() => setActiveTab('home')} className="p-2 text-slate-500 hover:text-white transition-all">
                  <Smartphone size={14} className={activeTab === 'home' ? 'text-blue-500' : ''} />
                </button>
                <button onClick={() => setActiveTab('scan')} className="p-2 text-slate-500 hover:text-white transition-all">
                  <QrCode size={14} className={activeTab === 'scan' ? 'text-purple-500' : ''} />
                </button>
                <button onClick={() => setActiveTab('manual')} className="p-2 text-slate-500 hover:text-white transition-all">
                  <Key size={14} className={activeTab === 'manual' ? 'text-amber-500' : ''} />
                </button>
              </div>

            </div>
          </div>
        </div>

        {/* Right 7 Cols: Security Logs & Cryptographic Telemetry Dashboard */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Top Panel: Algorithmic Explainer Toggle */}
          <div className="bg-[#0c111d] rounded-3xl border border-[#131b2e] p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-blue-500/10 text-blue-400 rounded-lg">
                  <Info size={16} />
                </div>
                <h3 className="font-black text-xs text-white">الخلفية الرياضية والبرمجية لنظام الترخيص (Asymmetric Crypto Principles)</h3>
              </div>
              <button 
                onClick={() => setShowFormulaInfo(!showFormulaInfo)}
                className="text-xs text-blue-400 hover:underline font-bold"
              >
                {showFormulaInfo ? 'إخفاء التفاصيل' : 'عرض التفاصيل الرياضية'}
              </button>
            </div>

            <AnimatePresence>
              {showFormulaInfo && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-3 text-[11px] text-slate-400 border-t border-[#131b2e] pt-3 leading-relaxed overflow-hidden font-bold"
                >
                  <p>
                    يعتمد نظام الأمان المعتمد ببرنامج <span className="text-white">MARO ERP</span> على معيار تشفير التوقيعات الرقمية اللامتناظرة <span className="text-white">Ed25519</span> المقاوم للاختراق والتلاعب الفردي:
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-3 bg-slate-900/50 rounded-xl border border-slate-800 space-y-1">
                      <span className="text-purple-400 text-[10px] block font-mono">1. التوقيع اللامتناظر (Ed25519 Signature):</span>
                      <p className="text-[10px] text-slate-400 leading-normal">
                        يوقع المطور الترخيص بواسطة المفتاح السري الخاص (Private Key) ولا يتم الاحتفاظ به لدى العميل. يتحقق السيرفر والعميل محليًا بواسطة المفتاح العام (Public Key) الصلب المنقوش في الكود المصدري.
                        <br />
                        <span className="text-emerald-500 font-mono">Verified = Ed25519.verify(Payload, Signature, PublicKey)</span>
                      </p>
                    </div>

                    <div className="p-3 bg-slate-900/50 rounded-xl border border-slate-800 space-y-1">
                      <span className="text-amber-400 text-[10px] block font-mono">2. بصمة العتاد المتسامحة (Hardware Tolerance):</span>
                      <p className="text-[10px] text-slate-400 leading-normal">
                        يتم تشفير البنية الهيكلية لقطع السيرفر واللوحة الأم والمعالج ومفاتيح الماك عبر دالة التجزئة <span className="text-white">SHA-256</span>. يسمح محرك الأمان لدينا بنسبة سماح للتحديث العتادي (مثال: ترقية الذاكرة العشوائية RAM أو تبديل منفذ الشبكة) لضمان ثبات الترخيص.
                        <br />
                        <span className="text-emerald-500 font-mono">SimilarityScore = CalculateHWTolerance(Actual, Licensed) &ge; 80%</span>
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Center Panel: Central Cloud Simulation Console */}
          <div className="bg-[#0c111d] rounded-3xl border border-[#131b2e] p-6 space-y-4">
            <h3 className="font-black text-xs text-white flex items-center gap-2">
              <Server size={16} className="text-purple-400" />
              المنظومة المركزية السحابية (Simulated Central License Registry)
            </h3>
            <p className="text-[10px] text-slate-400 leading-relaxed font-bold">
              يمكنك محاكاة تسجيل الترخيص في المنظومة المركزية أولاً من صفحة <span className="text-blue-400">"الترخيص والعتاد &gt; بوابة الشركاء"</span> عبر توليد مفتاح وإصدار ترخيص ونقره على "نشر للسيرفر السحابي". بعد ذلك، قم بالنقر على زر <span className="text-white">"التفعيل التلقائي الفوري"</span> داخل الهاتف على اليسار لتتم محاكاة عملية التفعيل الأونلاين الآمنة بالكامل!
            </p>

            <div className="p-4 bg-slate-950/40 border border-slate-900 rounded-2xl flex flex-wrap gap-2 justify-between items-center text-xs">
              <div className="space-y-1">
                <span className="text-slate-500 text-[10px] block">معرف عتاد جهازك المطلوب للتسجيل:</span>
                <span className="text-amber-400 font-mono font-bold">{deviceIdentity?.persistentDeviceId || 'جاري التحميل...'}</span>
              </div>
              <button 
                onClick={() => copyText(deviceIdentity?.persistentDeviceId || '', 'تم نسخ معرف الجهاز')}
                className="px-3 py-1.5 bg-[#141b2d] hover:bg-[#1d2740] text-slate-300 rounded-xl font-bold flex items-center gap-1"
              >
                <Copy size={12} /> نسخ المعرف لتسجيل الترخيص
              </button>
            </div>
          </div>

          {/* Bottom Panel: Live Security Audit Trail & Event Telemetry */}
          <div className="bg-[#0c111d] rounded-3xl border border-[#131b2e] p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#131b2e] pb-3">
              <h3 className="font-black text-xs text-white flex items-center gap-2">
                <Activity size={16} className="text-emerald-400" />
                سجل الأنشطة الأمنية الفورية وتحليل البيانات (Security Live Audit)
              </h3>
              <button 
                onClick={() => {
                  setLogs([
                    { id: Date.now().toString(), time: new Date().toLocaleTimeString(), type: 'info', source: 'System', message: 'تم إعادة تصفير سجل الأحداث الأمنية.' }
                  ]);
                }}
                className="text-[10px] text-slate-500 hover:text-white font-bold"
              >
                تفريغ السجل
              </button>
            </div>

            {/* Simulated Live Logs terminal */}
            <div className="bg-[#04060c] rounded-2xl p-4 border border-slate-900 h-64 overflow-y-auto space-y-2 font-mono text-[10px] leading-relaxed">
              {logs.map((log) => (
                <div key={log.id} className="flex items-start gap-2 border-b border-slate-950 pb-1">
                  <span className="text-slate-600">[{log.time}]</span>
                  <span className={`font-black px-1 rounded text-[9px] ${
                    log.type === 'success' ? 'bg-emerald-500/10 text-emerald-400' :
                    log.type === 'warn' ? 'bg-amber-500/10 text-amber-400' :
                    log.type === 'error' ? 'bg-red-500/10 text-red-400' : 'bg-blue-500/10 text-blue-400'
                  }`}>
                    {log.source.toUpperCase()}
                  </span>
                  <span className={`flex-1 ${
                    log.type === 'success' ? 'text-emerald-300' :
                    log.type === 'warn' ? 'text-amber-300' :
                    log.type === 'error' ? 'text-red-300 font-bold' : 'text-slate-300'
                  }`}>
                    {log.message}
                  </span>
                </div>
              ))}
            </div>

            {/* Anti-Tamper Badges */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center text-[10px] font-bold">
              <div className="p-3 bg-slate-900/50 rounded-xl border border-slate-800 space-y-1">
                <span className="text-slate-500">حماية التعديل (Replay Lock):</span>
                <span className="text-emerald-400 flex items-center justify-center gap-1">
                  <CheckCircle size={10} /> نشط وآمن
                </span>
              </div>
              <div className="p-3 bg-slate-900/50 rounded-xl border border-slate-800 space-y-1">
                <span className="text-slate-500">منع فك الترخيص (Decompilation):</span>
                <span className="text-emerald-400 flex items-center justify-center gap-1">
                  <CheckCircle size={10} /> مشفر بالكامل
                </span>
              </div>
              <div className="p-3 bg-slate-900/50 rounded-xl border border-slate-800 space-y-1">
                <span className="text-slate-500">مراقبة الجلسات (Anti-Cloning):</span>
                <span className="text-emerald-400 flex items-center justify-center gap-1">
                  <CheckCircle size={10} /> نشط بالعتاد
                </span>
              </div>
              <div className="p-3 bg-slate-900/50 rounded-xl border border-slate-800 space-y-1">
                <span className="text-slate-500">التحديثات الأمنية (Auto-Roll):</span>
                <span className="text-emerald-400 flex items-center justify-center gap-1">
                  <CheckCircle size={10} /> مدعومة
                </span>
              </div>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
};
