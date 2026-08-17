/**
 * @file Login.tsx
 * @module واجهات وصفحات النظام (UI Pages)
 * @description صفحة تسجيل الدخول الموحدة لمنصة MARO ERP - تصميم نظيف، فخم، ومبسط (Enterprise Minimal SaaS Login)
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../components/AuthProvider';
import { Terminal, Lock, Mail, ArrowRight, ShieldCheck, Wifi, WifiOff } from 'lucide-react';
import { SecurityEngine } from '../lib/securityEngine';
import { toast } from 'react-hot-toast';
import { FirstRunActivationWizard } from '../components/licensing/FirstRunActivationWizard';

export const Login: React.FC = () => {
  const { login, user } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isActivationModalOpen, setIsActivationModalOpen] = useState(false);

  useEffect(() => {
    if (user) {
      navigate('/', { replace: true });
    }

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [user, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      toast.error('يرجى إدخال البريد الإلكتروني وكلمة المرور');
      return;
    }

    setLoading(true);
    try {
      await login(email.trim(), password, true);
      
      // Audit log
      SecurityEngine.logSecurityAction({
        userId: email.trim(),
        userEmail: email.trim(),
        userRole: 'admin',
        companyId: 'MARO_MAIN_CO',
        deviceInfo: navigator.userAgent,
        computerName: 'Enterprise Client',
        operatingSystem: navigator.platform,
        browser: 'Browser',
        ipAddress: '127.0.0.1',
        action: 'LOGIN_SUCCESS',
        module: 'SECURITY_AUTH',
        screen: 'Login Screen',
        executionDurationMs: 12,
        success: true
      });

      toast.success('تم تسجيل الدخول بنجاح');
      navigate('/', { replace: true });
    } catch (err: any) {
      toast.error(err.message || 'بيانات الدخول غير صحيحة');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0b0f1a] p-4 text-slate-200" dir="rtl">
      <div className="max-w-md w-full bg-[#13192b] rounded-3xl border border-[#1e293b] shadow-2xl p-8 relative overflow-hidden">
        {/* Subtle top glowing line */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 via-indigo-500 to-blue-600"></div>

        {/* Header Branding */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-blue-600/20">
            <Terminal className="text-white w-7 h-7" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight font-sans">MARO ERP</h1>
          <p className="text-xs text-slate-400 mt-1 font-medium">نظام محاسبي وإداري متكامل</p>
        </div>

        {/* Title & Subtitle */}
        <div className="mb-6 text-right">
          <h2 className="text-lg font-bold text-white mb-1">تسجيل الدخول</h2>
          <p className="text-xs text-slate-400">ادخل إلى حسابك للمتابعة</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4 text-right">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-300">البريد الإلكتروني / اسم المستخدم</label>
            <div className="relative">
              <span className="absolute inset-y-0 right-0 flex items-center pr-3.5 pointer-events-none text-slate-500">
                <Mail size={16} />
              </span>
              <input 
                type="text"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#0a0f1d] border border-[#1e293b] rounded-xl pr-10 pl-4 py-3 text-white text-xs outline-none focus:border-blue-500 transition-all font-medium"
                placeholder="name@company.com"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-300">كلمة المرور</label>
            </div>
            <div className="relative">
              <span className="absolute inset-y-0 right-0 flex items-center pr-3.5 pointer-events-none text-slate-500">
                <Lock size={16} />
              </span>
              <input 
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#0a0f1d] border border-[#1e293b] rounded-xl pr-10 pl-4 py-3 text-white text-xs outline-none focus:border-blue-500 transition-all font-medium"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3.5 bg-blue-600 hover:bg-blue-500 active:scale-[0.99] text-white rounded-xl text-xs font-black shadow-lg shadow-blue-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <span>{loading ? 'جاري التحقق...' : 'دخول آمن'}</span>
            {!loading && <ArrowRight size={16} className="rotate-180" />}
          </button>

          <button
            type="button"
            onClick={() => {
              setEmail('admin@maro-erp.local');
              setPassword('admin123');
            }}
            className="w-full py-2.5 bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl text-[11px] font-bold border border-slate-700 transition-all flex items-center justify-center gap-2"
          >
            <span>⚡ تعبئة بيانات مدير النظام التجريبي (admin@maro-erp.local)</span>
          </button>
        </form>

        {/* Footer Links & Offline Indicator */}
        <div className="mt-8 pt-6 border-t border-[#1e293b] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <button
            type="button"
            onClick={() => setIsActivationModalOpen(true)}
            className="text-blue-400 hover:text-blue-300 font-bold transition-all text-[11px]"
          >
            تفعيل جهاز جديد
          </button>

          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-medium">
            <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500 shadow-sm shadow-emerald-500/50' : 'bg-amber-500 animate-pulse'}`}></span>
            <span>{isOnline ? 'متصل بالشبكة' : 'وضع العمل بدون إنترنت'}</span>
          </div>
        </div>
      </div>

      {/* Activation Wizard Modal */}
      {isActivationModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#13192b] border border-[#1e293b] rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 relative shadow-2xl">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-[#1e293b]">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <ShieldCheck className="text-blue-400" size={20} /> معالج ترخيص وتفعيل الجهاز
              </h3>
              <button 
                onClick={() => setIsActivationModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg bg-[#0a0f1d] border border-[#1e293b] text-xs font-bold px-2.5"
              >
                إغلاق ✕
              </button>
            </div>
            
            <FirstRunActivationWizard onActivated={() => {
              setIsActivationModalOpen(false);
              toast.success('تم تفعيل الجهاز بنجاح!');
              window.location.reload();
            }} />
          </div>
        </div>
      )}
    </div>
  );
};
