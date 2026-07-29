import React from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../firebase';
import { useFirebase } from '../components/FirebaseProvider';
import { LogIn } from 'lucide-react';

export const Login: React.FC = () => {
  const { user, loading } = useFirebase();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (user && !loading) {
      navigate('/', { replace: true });
    }
  }, [user, loading, navigate]);

  const handleGoogleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      navigate('/', { replace: true });
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  if (loading) return null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0b0f1a] p-4 text-slate-200">
      <div className="max-w-md w-full bg-[#151b2b] rounded-3xl border border-[#1e293b] shadow-2xl p-10 text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 to-emerald-600"></div>
        <div className="w-20 h-20 bg-blue-600 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-lg shadow-blue-600/20 rotate-3">
          <span className="text-white font-black text-4xl -rotate-3">S</span>
        </div>
        <h1 className="text-3xl font-black text-white mb-3 tracking-tight">سويفت ERP</h1>
        <p className="text-slate-400 mb-10 text-sm font-medium">نظام محاسبي متكامل لإدارة أعمالك بكل سهولة</p>
        
        <button
          onClick={handleGoogleLogin}
          className="w-full flex items-center justify-center gap-4 bg-[#1e293b] border border-[#334155] py-4 px-6 rounded-2xl font-bold text-white hover:bg-[#334155] transition-all active:scale-95 shadow-xl"
        >
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-6 h-6" />
          <span>تسجيل الدخول باستخدام جوجل</span>
        </button>
        
        <div className="mt-12 pt-8 border-t border-[#1e293b]">
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-2">Swift ERP v2.0</p>
          <p className="text-[10px] text-slate-600">بالمتابعة، أنت توافق على شروط الخدمة وسياسة الخصوصية الخاصة بنا</p>
        </div>
      </div>
    </div>
  );
};
