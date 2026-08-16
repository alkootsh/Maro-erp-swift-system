/**
 * @file AlertSettings.tsx
 * @module واجهات وصفحات النظام (UI Pages)
 * @description ملف جزء من نظام MARO ERP. الوظيفة: AlertSettings.tsx.
 */
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
import { MaroSyncEngine } from '../lib/maroSyncEngine';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface Alert {
  id: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  targetDepartments: string[];
  targetUsers: string[];
  duration: number;
  isActive: boolean;
  createdAt: any;
}

export const AlertSettings: React.FC = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAlert, setEditingAlert] = useState<Partial<Alert> | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [departments] = useState<string[]>(['المبيعات', 'المخازن', 'المحاسبة', 'الإدارة']);
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    const unsubAlerts = MaroSyncEngine.subscribe('settings_alerts', (items: any[]) => {
      setAlerts(items);
    });
    const unsubUsers = MaroSyncEngine.subscribe('users', (items: any[]) => {
      setUsers(items);
    });

    // Seed default if empty
    const local = MaroSyncEngine.getLocalCollection('settings_alerts');
    if (local.length === 0) {
      const def: Alert = {
        id: 'alt_1',
        message: 'تنبيه النظام: تم تفعيل محرك المزامنة المحلي بنجاح.',
        type: 'info',
        targetDepartments: ['الإدارة'],
        targetUsers: [],
        duration: 10,
        isActive: true,
        createdAt: new Date().toISOString()
      };
      MaroSyncEngine.saveDocument('settings_alerts', def, true);
    }

    return () => {
      unsubAlerts();
      unsubUsers();
    };
  }, []);

  const handleSave = async () => {
    if (!editingAlert?.message) return;
    setIsSaving(true);
    try {
      const alertId = editingAlert.id || `alt_${Date.now()}`;
      const payload: Alert = {
        id: alertId,
        message: editingAlert.message,
        type: editingAlert.type || 'info',
        targetDepartments: editingAlert.targetDepartments || [],
        targetUsers: editingAlert.targetUsers || [],
        duration: Number(editingAlert.duration) || 10,
        isActive: editingAlert.isActive ?? true,
        createdAt: new Date().toISOString()
      };
      await MaroSyncEngine.saveDocument('settings_alerts', payload, !editingAlert.id);
      setIsModalOpen(false);
      setEditingAlert(null);
    } catch (error) {
      console.error('Save alert failed:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذا التنبيه؟')) {
      await MaroSyncEngine.deleteDocument('settings_alerts', id);
    }
  };

  const toggleStatus = async (alert: Alert) => {
    await MaroSyncEngine.saveDocument('settings_alerts', { ...alert, isActive: !alert.isActive }, false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight">إدارة التنبيهات والإشعارات</h2>
          <p className="text-slate-500 font-bold text-sm">تخصيص التنبيهات الفورية التي تظهر للمستخدمين في النظام</p>
        </div>
        <button 
          onClick={() => { setEditingAlert({ type: 'info', duration: 10, targetDepartments: [], targetUsers: [] }); setIsModalOpen(true); }}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-2xl hover:bg-blue-500 transition-all font-bold shadow-lg shadow-blue-600/20 active:scale-95 text-xs uppercase tracking-widest"
        >
          <Plus size={18} />
          <span>إضافة تنبيه جديد</span>
        </button>
      </div>

      <div className="bg-[#151b2b] rounded-3xl border border-[#1e293b] shadow-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead className="bg-[#0f172a]/50 text-slate-500 text-[10px] font-bold uppercase tracking-widest">
              <tr>
                <th className="px-8 py-5">الرسالة والتنبيه</th>
                <th className="px-8 py-5">النوع</th>
                <th className="px-8 py-5">المدة (ثانية)</th>
                <th className="px-8 py-5">الحالة</th>
                <th className="px-8 py-5"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e293b]">
              {alerts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-8 py-16 text-center text-slate-600 font-medium">لا توجد تنبيهات حالياً</td>
                </tr>
              ) : alerts.map((alert) => (
                <tr key={alert.id} className="hover:bg-slate-800/30 transition-colors group">
                  <td className="px-8 py-5 font-bold text-white max-w-md truncate">
                    {alert.message}
                  </td>
                  <td className="px-8 py-5">
                    <span className={cn(
                      "px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border",
                      alert.type === 'info' && "bg-blue-500/10 text-blue-500 border-blue-500/20",
                      alert.type === 'warning' && "bg-amber-500/10 text-amber-500 border-amber-500/20",
                      alert.type === 'error' && "bg-red-500/10 text-red-500 border-red-500/20",
                      alert.type === 'success' && "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
                    )}>
                      {alert.type}
                    </span>
                  </td>
                  <td className="px-8 py-5 text-slate-400 font-medium">{alert.duration} ثوانٍ</td>
                  <td className="px-8 py-5">
                    <button 
                      onClick={() => toggleStatus(alert)}
                      className={cn(
                        "px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border transition-colors",
                        alert.isActive ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/20" : "bg-slate-800 text-slate-500 border-slate-700"
                      )}
                    >
                      {alert.isActive ? 'نشط' : 'متوقف'}
                    </button>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-2 justify-end">
                      <button 
                        onClick={() => { setEditingAlert(alert); setIsModalOpen(true); }}
                        className="p-2.5 hover:bg-blue-500/10 text-blue-400 rounded-xl transition-colors"
                      >
                        تعديل
                      </button>
                      <button 
                        onClick={() => handleDelete(alert.id)}
                        className="p-2.5 hover:bg-red-500/10 text-red-400 rounded-xl transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-[#0b0f1a]/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#151b2b] w-full max-w-lg rounded-3xl border border-[#1e293b] shadow-2xl overflow-hidden relative">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 to-emerald-600"></div>
            <div className="p-8 border-b border-[#1e293b] flex items-center justify-between bg-[#0f172a]/50">
              <h3 className="font-black text-xl text-white tracking-tight">
                {editingAlert?.id ? 'تعديل التنبيه' : 'إضافة تنبيه جديد'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-800 rounded-xl text-slate-500 transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="p-8 space-y-6">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">نص التنبيه</label>
                <textarea 
                  rows={3}
                  value={editingAlert?.message || ''}
                  onChange={(e) => setEditingAlert({ ...editingAlert, message: e.target.value })}
                  className="w-full bg-[#0b0f1a] border border-[#334155] rounded-xl p-4 text-white text-sm focus:outline-none focus:border-blue-500 font-medium resize-none"
                  placeholder="أدخل رسالة التنبيه..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">نوع التنبيه</label>
                  <select 
                    value={editingAlert?.type || 'info'}
                    onChange={(e) => setEditingAlert({ ...editingAlert, type: e.target.value as any })}
                    className="w-full bg-[#0b0f1a] border border-[#334155] rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-blue-500 font-medium"
                  >
                    <option value="info">معلومة (Info)</option>
                    <option value="warning">تحذير (Warning)</option>
                    <option value="error">خطأ (Error)</option>
                    <option value="success">نجاح (Success)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">المدة (بالثواني)</label>
                  <input 
                    type="number"
                    value={editingAlert?.duration || 10}
                    onChange={(e) => setEditingAlert({ ...editingAlert, duration: Number(e.target.value) })}
                    className="w-full bg-[#0b0f1a] border border-[#334155] rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-blue-500 font-medium"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#1e293b]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-3 rounded-xl bg-slate-800 text-slate-300 font-bold hover:bg-slate-700 transition-all text-xs"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isSaving}
                  className="px-6 py-3 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-500 transition-all shadow-lg shadow-blue-600/20 text-xs disabled:opacity-50"
                >
                  {isSaving ? 'جاري الحفظ...' : 'حفظ التنبيه'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
