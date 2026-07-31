import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../components/AuthProvider';
import { LogIn, ShieldCheck, Terminal, UserCheck } from 'lucide-react';

export const Login: React.FC = () => {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('alkootsh@gmail.com');
  const [role, setRole] = useState<'developer' | 'admin' | 'accountant' | 'cashier'>('developer');

  React.useEffect(() => {
    if (user) {
      navigate('/', { replace: true });
    }
  }, [user, navigate]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    login(email || 'admin@maro-erp.local', role);
    navigate('/', { replace: true });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0b0f1a] p-4 text-slate-200">
      <div className="max-w-md w-full bg-[#151b2b] rounded-3xl border border-[#1e293b] shadow-2xl p-10 text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 to-emerald-600"></div>
        
        <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-blue-600/20 rotate-3">
          <Terminal className="text-white w-10 h-10 -rotate-3" />
        </div>
        
        <h1 className="text-3xl font-black text-white mb-2 tracking-tight">منصة MARO ERP</h1>
        <p className="text-slate-400 mb-8 text-sm font-medium">نظام تخطيط موارد المؤسسات (PostgreSQL + Sync Engine)</p>
        
        <form onSubmit={handleLogin} className="space-y-4 text-right">
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1">البريد الإلكتروني / اسم المستخدم</label>
            <input 
              type="text" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[#0b0f1a] border border-[#334155] rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-blue-500 font-medium"
              placeholder="admin@maro-erp.local"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1">الدور الوظيفي (RBAC)</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as any)}
              className="w-full bg-[#0b0f1a] border border-[#334155] rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-blue-500 font-medium"
            >
              <option value="developer">المطور الرئيسي (Developer)</option>
              <option value="admin">مدير النظام (Administrator)</option>
              <option value="accountant">محاسب عام (Accountant)</option>
              <option value="cashier">كاشير المبيعات (POS Cashier)</option>
            </select>
          </div>

          <button
            type="submit"
            className="w-full mt-4 flex items-center justify-center gap-3 bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 px-6 rounded-xl transition-all shadow-lg shadow-blue-600/30 active:scale-95"
          >
            <LogIn size={18} />
            <span>دخول آمن (Enterprise Auth)</span>
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-[#1e293b] flex items-center justify-center gap-2 text-xs text-emerald-400 font-bold">
          <ShieldCheck size={16} />
          <span>متصل بقاعدة بيانات PostgreSQL المحلية الآمنة</span>
        </div>
        
        <div className="mt-4">
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">MARO Business Platform v4.0</p>
        </div>
      </div>
    </div>
  );
};
