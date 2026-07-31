import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Plus, 
  Search, 
  MapPin, 
  Phone,
  Edit2,
  Trash2,
  Calendar,
  Save,
  X
} from 'lucide-react';
import { MaroSyncEngine } from '../lib/maroSyncEngine';
import { cn } from '../lib/utils';

export interface Rep {
  id: string;
  name: string;
  phone: string;
  route: string;
  status: 'active' | 'inactive';
  notes: string;
}

export const Reps: React.FC = () => {
  const [reps, setReps] = useState<Rep[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRep, setEditingRep] = useState<Rep | null>(null);

  useEffect(() => {
    const unsub = MaroSyncEngine.subscribe<Rep>('reps', (items) => {
      setReps(items);
      setLoading(false);
    });
    const local = MaroSyncEngine.getLocalCollection<Rep>('reps');
    if (local.length === 0) {
      const defs: Rep[] = [
        { id: 'rep_1', name: 'أحمد محمود', phone: '+966 50 111 2233', route: 'خط الرياض الشمالي', status: 'active', notes: 'مندوب مبيعات معتمد' },
        { id: 'rep_2', name: 'سعد العتيبي', phone: '+966 55 444 5566', route: 'خط جدة والوسطى', status: 'active', notes: 'مندوب توزيع رئيسي' }
      ];
      defs.forEach(d => MaroSyncEngine.saveDocument('reps', d, true));
    }
    return () => unsub();
  }, []);

  const filteredReps = reps.filter(r => 
    r.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    r.route.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = async (id: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذا المندوب؟')) {
      await MaroSyncEngine.deleteDocument('reps', id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight">المناديب وخطوط السير</h2>
          <p className="text-slate-500 font-bold text-sm">إدارة مناديب المبيعات وخطوط التوزيع الجغرافية</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input 
              type="text" 
              placeholder="بحث عن مندوب أو خط سير..." 
              className="w-full pr-10 pl-4 py-2.5 bg-[#151b2b] border border-[#1e293b] rounded-xl text-white focus:outline-none focus:border-blue-500 transition-all placeholder:text-slate-600"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button 
            onClick={() => { setEditingRep(null); setIsModalOpen(true); }}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-2xl hover:bg-blue-500 transition-all font-bold shadow-lg shadow-blue-600/20 active:scale-95 text-xs uppercase tracking-widest"
          >
            <Plus size={18} />
            <span>إضافة مندوب</span>
          </button>
        </div>
      </div>

      <div className="bg-[#151b2b] rounded-3xl border border-[#1e293b] shadow-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead className="bg-[#0f172a]/50 text-slate-500 text-[10px] font-bold uppercase tracking-widest">
              <tr>
                <th className="px-8 py-5">المندوب</th>
                <th className="px-8 py-5">رقم الهاتف</th>
                <th className="px-8 py-5">خط السير</th>
                <th className="px-8 py-5">الحالة</th>
                <th className="px-8 py-5"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e293b]">
              {loading ? (
                <tr><td colSpan={5} className="px-8 py-16 text-center text-slate-600 font-medium">جاري التحميل...</td></tr>
              ) : filteredReps.length === 0 ? (
                <tr><td colSpan={5} className="px-8 py-16 text-center text-slate-600 font-medium">لا توجد مناديب حالياً</td></tr>
              ) : filteredReps.map((rep) => (
                <tr key={rep.id} className="hover:bg-slate-800/30 transition-colors group">
                  <td className="px-8 py-5 font-bold text-white">{rep.name}</td>
                  <td className="px-8 py-5 text-slate-400 font-medium">{rep.phone}</td>
                  <td className="px-8 py-5 text-slate-300 font-medium">{rep.route}</td>
                  <td className="px-8 py-5">
                    <span className={cn(
                      "px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border",
                      rep.status === 'active' ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : "bg-slate-800 text-slate-500 border-slate-700"
                    )}>
                      {rep.status === 'active' ? 'نشط' : 'متوقف'}
                    </span>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-2 justify-end">
                      <button 
                        onClick={() => { setEditingRep(rep); setIsModalOpen(true); }}
                        className="p-2.5 hover:bg-blue-500/10 text-blue-400 rounded-xl transition-colors"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        onClick={() => handleDelete(rep.id)}
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
        <RepModal 
          rep={editingRep} 
          onClose={() => setIsModalOpen(false)} 
        />
      )}
    </div>
  );
};

const RepModal: React.FC<{ rep: Rep | null, onClose: () => void }> = ({ rep, onClose }) => {
  const [formData, setFormData] = useState({
    name: rep?.name || '',
    phone: rep?.phone || '',
    route: rep?.route || '',
    status: rep?.status || 'active',
    notes: rep?.notes || ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rep) {
      await MaroSyncEngine.saveDocument('reps', { ...rep, ...formData }, false);
    } else {
      const newId = `rep_${Date.now()}`;
      await MaroSyncEngine.saveDocument('reps', { id: newId, ...formData }, true);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-[#0b0f1a]/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#151b2b] w-full max-w-md rounded-3xl border border-[#1e293b] shadow-2xl overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 to-purple-600"></div>
        <div className="p-8 border-b border-[#1e293b] flex items-center justify-between bg-[#0f172a]/50">
          <h3 className="font-black text-xl text-white tracking-tight">{rep ? 'تعديل بيانات المندوب' : 'إضافة مندوب جديد'}</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-xl text-slate-500 transition-colors"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">اسم المندوب</label>
            <input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full bg-[#0b0f1a] border border-[#334155] rounded-xl px-4 py-3 text-white text-sm font-medium" />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">رقم الهاتف</label>
            <input type="text" required value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="w-full bg-[#0b0f1a] border border-[#334155] rounded-xl px-4 py-3 text-white text-sm font-medium" />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">خط السير</label>
            <input type="text" required value={formData.route} onChange={(e) => setFormData({ ...formData, route: e.target.value })} className="w-full bg-[#0b0f1a] border border-[#334155] rounded-xl px-4 py-3 text-white text-sm font-medium" />
          </div>
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#1e293b]">
            <button type="button" onClick={onClose} className="px-6 py-3 rounded-xl bg-slate-800 text-slate-300 font-bold hover:bg-slate-700 transition-all text-xs">إلغاء</button>
            <button type="submit" className="px-6 py-3 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-500 transition-all shadow-lg shadow-blue-600/20 text-xs">حفظ البيانات</button>
          </div>
        </form>
      </div>
    </div>
  );
};
