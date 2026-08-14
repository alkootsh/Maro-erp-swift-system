import React, { useState, useEffect } from 'react';
import { 
  Megaphone, 
  Plus, 
  Trash2, 
  Edit2, 
  Check, 
  X, 
  Bell, 
  AlertTriangle, 
  Info, 
  CheckCircle2, 
  ArrowUpCircle, 
  ArrowDownCircle,
  Eye,
  Settings
} from 'lucide-react';
import { SystemAnnouncement } from '../../components/SystemTickerBanner';
import { MaroSyncEngine } from '../../lib/maroSyncEngine';
import { cn } from '../../lib/utils';
import { toast } from 'react-hot-toast';

export const TickerControlPanel: React.FC = () => {
  const [announcements, setAnnouncements] = useState<SystemAnnouncement[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<SystemAnnouncement | null>(null);

  useEffect(() => {
    const unsub = MaroSyncEngine.subscribe<SystemAnnouncement>('system_announcements', (data) => {
      setAnnouncements(data || []);
    });

    const local = MaroSyncEngine.getLocalCollection<SystemAnnouncement>('system_announcements');
    setAnnouncements(local);

    return () => unsub();
  }, []);

  const handleToggleActive = (item: SystemAnnouncement) => {
    const updated = { ...item, isActive: !item.isActive };
    MaroSyncEngine.saveDocument('system_announcements', updated, false);
    toast.success(updated.isActive ? 'تم نشر التنبيه على البنر المتحرك' : 'تم إيقاف عرض التنبيه');
  };

  const handleDelete = (id: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذا التنبيه البارز؟')) {
      MaroSyncEngine.deleteDocument('system_announcements', id);
      toast.success('تم الحذف بنجاح');
    }
  };

  return (
    <div className="p-8 space-y-8 bg-[#0b0f1a] text-white min-h-screen" dir="rtl">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#1e293b] pb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-tr from-blue-600 to-indigo-600 text-white rounded-2xl shadow-lg shadow-blue-600/20">
            <Megaphone size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">لوحة تحكم البنر والشريط الإخباري المتحرك</h1>
            <p className="text-xs text-slate-400 font-medium mt-1">
              إرسال الرسائل والتنبيهات الإدارية العاجلة وتحديد موقعها (أعلى أو أسفل الشاشة) وسرعة التمرير
            </p>
          </div>
        </div>

        <button
          onClick={() => { setEditingItem(null); setIsModalOpen(true); }}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-bold transition-all shadow-lg shadow-blue-600/20 text-xs"
        >
          <Plus size={18} />
          <span>إضافة رسالة / تنبيه إداري جديد</span>
        </button>
      </div>

      {/* Announcements List Grid */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold text-slate-300">قائمة التنبيهات والرسائل الإدارية المسجلة ({announcements.length})</h2>

        <div className="grid grid-cols-1 gap-4">
          {announcements.map((anc) => (
            <div
              key={anc.id}
              className={cn(
                "p-5 rounded-3xl border bg-[#151b2b] flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all relative overflow-hidden",
                anc.isActive ? "border-blue-500/40" : "border-[#1e293b] opacity-60"
              )}
            >
              <div className="flex items-start gap-4 flex-1">
                <div className={cn(
                  "p-3 rounded-2xl font-bold text-white shrink-0 mt-1",
                  anc.type === 'urgent' ? "bg-red-500/20 text-red-400 border border-red-500/30" :
                  anc.type === 'warning' ? "bg-amber-500/20 text-amber-400 border border-amber-500/30" :
                  anc.type === 'success' ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" :
                  "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                )}>
                  {anc.type === 'urgent' && <AlertTriangle size={20} />}
                  {anc.type === 'warning' && <Bell size={20} />}
                  {anc.type === 'success' && <CheckCircle2 size={20} />}
                  {anc.type === 'info' && <Info size={20} />}
                </div>

                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="font-black text-white text-base">{anc.title}</h3>
                    <span className={cn(
                      "px-2.5 py-0.5 rounded-full text-[10px] font-bold border",
                      anc.position === 'top' ? "bg-blue-600/10 text-blue-400 border-blue-500/30" : "bg-purple-600/10 text-purple-400 border-purple-500/30"
                    )}>
                      {anc.position === 'top' ? 'أعلى الشاشة (Top)' : 'أسفل الشاشة (Bottom)'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 font-medium leading-relaxed">{anc.message}</p>
                  <div className="text-[10px] text-slate-500 font-mono pt-1">
                    السرعة: {anc.speedSec} ثانية | تاريخ النشر: {new Date(anc.createdAt).toLocaleDateString('ar-EG')}
                  </div>
                </div>
              </div>

              {/* Status & Controls */}
              <div className="flex items-center gap-3 shrink-0 self-end md:self-center">
                <button
                  onClick={() => handleToggleActive(anc)}
                  className={cn(
                    "px-4 py-2 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5",
                    anc.isActive 
                      ? "bg-emerald-600/20 text-emerald-400 border-emerald-500/30 hover:bg-emerald-600/30"
                      : "bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700"
                  )}
                >
                  {anc.isActive ? <Check size={14} /> : <X size={14} />}
                  <span>{anc.isActive ? 'نشط ويعرض الآن' : 'متوقف'}</span>
                </button>

                <button
                  onClick={() => { setEditingItem(anc); setIsModalOpen(true); }}
                  className="p-2 bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 rounded-xl border border-blue-500/20"
                  title="تعديل"
                >
                  <Edit2 size={16} />
                </button>

                <button
                  onClick={() => handleDelete(anc.id)}
                  className="p-2 bg-red-600/10 hover:bg-red-600/20 text-red-400 rounded-xl border border-red-500/20"
                  title="حذف"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Edit / Add Modal */}
      {isModalOpen && (
        <AnnouncementModal 
          item={editingItem} 
          onClose={() => setIsModalOpen(false)} 
        />
      )}
    </div>
  );
};

const AnnouncementModal: React.FC<{ item: SystemAnnouncement | null, onClose: () => void }> = ({ item, onClose }) => {
  const [formData, setFormData] = useState<SystemAnnouncement>({
    id: item?.id || `anc_${Date.now()}`,
    title: item?.title || '',
    message: item?.message || '',
    type: item?.type || 'info',
    position: item?.position || 'top',
    isActive: item ? item.isActive : true,
    speedSec: item?.speedSec || 30,
    createdAt: item?.createdAt || new Date().toISOString()
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.message) {
      toast.error('يرجى كتابة عنوان ورسالة التنبيه');
      return;
    }

    MaroSyncEngine.saveDocument('system_announcements', formData, !item);
    toast.success(item ? 'تم تعديل التنبيه بنجاح' : 'تم نشر التنبيه الجديد بنجاح');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-[#0b0f1a]/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" dir="rtl">
      <div className="bg-[#151b2b] w-full max-w-lg rounded-3xl border border-[#1e293b] shadow-2xl overflow-hidden relative">
        <div className="p-6 border-b border-[#1e293b] flex items-center justify-between bg-[#0f172a]/50">
          <h3 className="font-black text-xl text-white">
            {item ? 'تعديل التنبيه الإداري' : 'إنشاء تنبيه ورسالة جديدة للمستخدمين'}
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-xl text-slate-500">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs font-bold">
          <div>
            <label className="block text-[#94a3b8] mb-1">عنوان التنبيه *</label>
            <input 
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full bg-[#0b0f1a] border border-[#334155] rounded-xl px-3 py-2.5 text-white"
              placeholder="مثال: تنبيه إداري عاجل، إغلاق الوردية، تهنئة..."
            />
          </div>

          <div>
            <label className="block text-[#94a3b8] mb-1">نص الرسالة المرسلة لجميع الشاشات *</label>
            <textarea 
              rows={3}
              required
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              className="w-full bg-[#0b0f1a] border border-[#334155] rounded-xl px-3 py-2.5 text-white"
              placeholder="اكتب نص الرسالة التي ستظهر وتتحرك في شريط التنبيهات..."
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[#94a3b8] mb-1">موقع شريط التنبيه</label>
              <select
                value={formData.position}
                onChange={(e) => setFormData({ ...formData, position: e.target.value as any })}
                className="w-full bg-[#0b0f1a] border border-[#334155] rounded-xl px-3 py-2.5 text-white"
              >
                <option value="top">أعلى الشاشة (Top Banner)</option>
                <option value="bottom">أسفل الشاشة (Bottom Banner)</option>
              </select>
            </div>

            <div>
              <label className="block text-[#94a3b8] mb-1">نوع التنبيه / الأهمية</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                className="w-full bg-[#0b0f1a] border border-[#334155] rounded-xl px-3 py-2.5 text-white"
              >
                <option value="info">معلومات عامة (أزرق)</option>
                <option value="warning">تحذير تنبيهي (أصفر)</option>
                <option value="urgent">عاجل وهام جداً (أحمر)</option>
                <option value="success">تهنئة / إنجاز (أخضر)</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#1e293b]">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-bold"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-blue-600 text-white font-bold shadow-lg shadow-blue-600/20"
            >
              نشر وإظهار البنر
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
