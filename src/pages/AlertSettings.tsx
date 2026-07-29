import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  Save, 
  Trash2, 
  Plus, 
  Users, 
  Layout, 
  Clock, 
  AlertTriangle,
  Info,
  CheckCircle,
  X
} from 'lucide-react';
import { doc, onSnapshot, setDoc, serverTimestamp, collection } from 'firebase/firestore';
import { db } from '../firebase';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface Alert {
  id: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  targetDepartments: string[];
  targetUsers: string[];
  duration: number; // in seconds
  isActive: boolean;
  createdAt: any;
}

export const AlertSettings: React.FC = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAlert, setEditingAlert] = useState<Partial<Alert> | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [departments, setDepartments] = useState<string[]>(['المبيعات', 'المخازن', 'المحاسبة', 'الإدارة']);
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    const unsubAlerts = onSnapshot(doc(db, 'settings', 'alerts'), (snap) => {
      if (snap.exists()) {
        setAlerts(snap.data().list || []);
      }
    });

    const unsubUsers = onSnapshot(collection(db, 'users'), (snap) => {
      setUsers(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => {
      unsubAlerts();
      unsubUsers();
    };
  }, []);

  const handleSave = async () => {
    if (!editingAlert?.message) return;
    setIsSaving(true);
    try {
      const newAlerts = [...alerts];
      if (editingAlert.id) {
        const index = newAlerts.findIndex(a => a.id === editingAlert.id);
        newAlerts[index] = { ...editingAlert, createdAt: serverTimestamp() } as Alert;
      } else {
        newAlerts.push({
          ...editingAlert,
          id: Date.now().toString(),
          createdAt: serverTimestamp(),
          isActive: true
        } as Alert);
      }
      await setDoc(doc(db, 'settings', 'alerts'), { list: newAlerts });
      setIsModalOpen(false);
      setEditingAlert(null);
    } catch (error) {
      console.error(error);
      alert('حدث خطأ أثناء حفظ التنبيه');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleAlert = async (id: string) => {
    const newAlerts = alerts.map(a => a.id === id ? { ...a, isActive: !a.isActive } : a);
    await setDoc(doc(db, 'settings', 'alerts'), { list: newAlerts });
  };

  const deleteAlert = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا التنبيه؟')) return;
    const newAlerts = alerts.filter(a => a.id !== id);
    await setDoc(doc(db, 'settings', 'alerts'), { list: newAlerts });
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-white tracking-tight">إدارة التنبيهات</h2>
          <p className="text-slate-500 mt-1">التحكم في رسائل التنبيه التي تظهر للمستخدمين</p>
        </div>
        <button 
          onClick={() => {
            setEditingAlert({
              message: '',
              type: 'info',
              targetDepartments: [],
              targetUsers: [],
              duration: 30,
              isActive: true
            });
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-blue-600/20"
        >
          <Plus size={20} />
          <span>تنبيه جديد</span>
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {alerts.map((alert) => (
          <div 
            key={alert.id}
            className={cn(
              "bg-[#0f172a] border border-[#1e293b] rounded-2xl p-6 flex items-center justify-between group transition-all hover:border-blue-500/50",
              !alert.isActive && "opacity-50 grayscale"
            )}
          >
            <div className="flex items-center gap-6 flex-1">
              <div className={cn(
                "w-12 h-12 rounded-xl flex items-center justify-center shadow-lg",
                alert.type === 'info' && "bg-blue-600/20 text-blue-500",
                alert.type === 'warning' && "bg-amber-600/20 text-amber-500",
                alert.type === 'error' && "bg-red-600/20 text-red-500",
                alert.type === 'success' && "bg-emerald-600/20 text-emerald-500",
              )}>
                {alert.type === 'info' && <Info size={24} />}
                {alert.type === 'warning' && <AlertTriangle size={24} />}
                {alert.type === 'error' && <X size={24} />}
                {alert.type === 'success' && <CheckCircle size={24} />}
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-white mb-1">{alert.message}</p>
                <div className="flex items-center gap-4 text-xs text-slate-500 font-medium">
                  <span className="flex items-center gap-1">
                    <Clock size={14} />
                    مدة العرض: {alert.duration} ثانية
                  </span>
                  <span className="flex items-center gap-1">
                    <Users size={14} />
                    المستهدفون: {alert.targetDepartments.length > 0 ? alert.targetDepartments.join(', ') : 'الكل'}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={() => toggleAlert(alert.id)}
                className={cn(
                  "px-4 py-2 rounded-lg font-bold text-sm transition-all",
                  alert.isActive ? "bg-emerald-600/10 text-emerald-500 hover:bg-emerald-600 hover:text-white" : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                )}
              >
                {alert.isActive ? 'نشط' : 'متوقف'}
              </button>
              <button 
                onClick={() => {
                  setEditingAlert(alert);
                  setIsModalOpen(true);
                }}
                className="p-2 bg-blue-600/10 text-blue-500 hover:bg-blue-600 hover:text-white rounded-lg transition-all"
              >
                <Layout size={18} />
              </button>
              <button 
                onClick={() => deleteAlert(alert.id)}
                className="p-2 bg-red-600/10 text-red-500 hover:bg-red-600 hover:text-white rounded-lg transition-all"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[100] p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-[#151b2b] w-full max-w-xl rounded-3xl border border-[#1e293b] shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-[#1e293b] flex items-center justify-between bg-[#0f172a]">
                <button onClick={() => setIsModalOpen(false)} className="text-slate-500 hover:text-white">
                  <X size={24} />
                </button>
                <h3 className="font-black text-xl text-white">إعداد التنبيه</h3>
              </div>
              <div className="p-8 space-y-6">
                <div>
                  <label className="block text-sm font-bold text-slate-400 mb-2 text-right">رسالة التنبيه</label>
                  <textarea 
                    value={editingAlert?.message}
                    onChange={(e) => setEditingAlert({ ...editingAlert, message: e.target.value })}
                    className="w-full bg-[#0b0f1a] border border-[#1e293b] rounded-xl py-3 px-4 text-white text-right focus:outline-none focus:border-blue-600 transition-all min-h-[100px]"
                    placeholder="اكتب رسالة التنبيه هنا..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-400 mb-2 text-right">نوع التنبيه</label>
                    <select 
                      value={editingAlert?.type}
                      onChange={(e) => setEditingAlert({ ...editingAlert, type: e.target.value as any })}
                      className="w-full bg-[#0b0f1a] border border-[#1e293b] rounded-xl py-3 px-4 text-white text-right focus:outline-none focus:border-blue-600 transition-all"
                    >
                      <option value="info">معلومات (أزرق)</option>
                      <option value="warning">تحذير (أصفر)</option>
                      <option value="error">خطأ (أحمر)</option>
                      <option value="success">نجاح (أخضر)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-400 mb-2 text-right">مدة العرض (ثانية)</label>
                    <input 
                      type="number"
                      value={editingAlert?.duration}
                      onChange={(e) => setEditingAlert({ ...editingAlert, duration: parseInt(e.target.value) })}
                      className="w-full bg-[#0b0f1a] border border-[#1e293b] rounded-xl py-3 px-4 text-white text-right focus:outline-none focus:border-blue-600 transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-400 mb-2 text-right">الأقسام المستهدفة (اترك فارغاً للكل)</label>
                    <div className="flex flex-wrap gap-2 justify-end">
                      {departments.map(dept => (
                        <button
                          key={dept}
                          onClick={() => {
                            const current = editingAlert?.targetDepartments || [];
                            const next = current.includes(dept) 
                              ? current.filter(d => d !== dept)
                              : [...current, dept];
                            setEditingAlert({ ...editingAlert, targetDepartments: next });
                          }}
                          className={cn(
                            "px-3 py-1.5 rounded-lg text-xs font-bold transition-all border",
                            editingAlert?.targetDepartments?.includes(dept)
                              ? "bg-blue-600 border-blue-500 text-white"
                              : "bg-slate-900 border-slate-800 text-slate-500 hover:border-slate-700"
                          )}
                        >
                          {dept}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-400 mb-2 text-right">المستخدمون المستهدفون (اترك فارغاً للكل)</label>
                    <div className="flex flex-wrap gap-2 justify-end max-h-32 overflow-y-auto p-2 bg-[#0b0f1a] rounded-xl border border-[#1e293b]">
                      {users.map(user => (
                        <button
                          key={user.id}
                          onClick={() => {
                            const current = editingAlert?.targetUsers || [];
                            const next = current.includes(user.id) 
                              ? current.filter(u => u !== user.id)
                              : [...current, user.id];
                            setEditingAlert({ ...editingAlert, targetUsers: next });
                          }}
                          className={cn(
                            "px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all border",
                            editingAlert?.targetUsers?.includes(user.id)
                              ? "bg-emerald-600 border-emerald-500 text-white"
                              : "bg-slate-800 border-slate-700 text-slate-500 hover:border-slate-600"
                          )}
                        >
                          {user.name || user.email}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <button 
                  onClick={handleSave}
                  disabled={isSaving}
                  className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-black text-lg transition-all shadow-xl shadow-blue-600/20 disabled:opacity-50"
                >
                  {isSaving ? 'جاري الحفظ...' : 'حفظ التنبيه'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
