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
import { 
  collection, 
  query, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  doc,
  Timestamp,
  orderBy
} from 'firebase/firestore';
import { db } from '../firebase';
import { cn } from '../lib/utils';
import { toast } from 'react-hot-toast';

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

  const [formData, setFormData] = useState<{
    name: string;
    phone: string;
    route: string;
    status: 'active' | 'inactive';
    notes: string;
  }>({
    name: '',
    phone: '',
    route: '',
    status: 'active',
    notes: ''
  });

  useEffect(() => {
    const q = query(collection(db, 'reps'), orderBy('name'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Rep));
      setReps(list);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const duplicatePhone = reps.find(r => r.phone === formData.phone && r.id !== editingRep?.id);
      if (duplicatePhone) {
        toast.error('رقم الهاتف مستخدم بالفعل لمندوب آخر');
        return;
      }
      const duplicateName = reps.find(r => r.name.toLowerCase() === formData.name.toLowerCase() && r.id !== editingRep?.id);
      if (duplicateName) {
        toast.error('يوجد مندوب مسجل بنفس الاسم');
        return;
      }

      if (editingRep) {
        await updateDoc(doc(db, 'reps', editingRep.id), formData);
        toast.success('تم تحديث بيانات المندوب بنجاح');
      } else {
        await addDoc(collection(db, 'reps'), formData);
        toast.success('تمت إضافة المندوب بنجاح');
      }
      setIsModalOpen(false);
      setFormData({ name: '', phone: '', route: '', status: 'active', notes: '' });
      setEditingRep(null);
    } catch (error) {
      console.error('Error saving rep:', error);
      toast.error('حدث خطأ أثناء الحفظ');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذا المندوب؟')) {
      try {
        await deleteDoc(doc(db, 'reps', id));
        toast.success('تم حذف المندوب بنجاح');
      } catch (error) {
        console.error('Error deleting rep:', error);
        toast.error('حدث خطأ أثناء الحذف');
      }
    }
  };

  const openEditModal = (rep: Rep) => {
    setEditingRep(rep);
    setFormData({
      name: rep.name,
      phone: rep.phone,
      route: rep.route,
      status: rep.status,
      notes: rep.notes || ''
    });
    setIsModalOpen(true);
  };

  const filteredReps = reps.filter(rep => 
    rep.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    rep.phone.includes(searchTerm) ||
    rep.route.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight">المناديب وخطوط السير</h2>
          <p className="text-slate-400 text-sm mt-1 font-medium">إدارة المناديب وتتبع خطوط سيرهم ومناطق التوزيع</p>
        </div>
        <button 
          onClick={() => {
            setEditingRep(null);
            setFormData({ name: '', phone: '', route: '', status: 'active', notes: '' });
            setIsModalOpen(true);
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-colors shadow-lg shadow-blue-600/20"
        >
          <Plus size={20} />
          <span>إضافة مندوب جديد</span>
        </button>
      </div>

      <div className="bg-[#151b2b] p-6 rounded-3xl border border-[#1e293b] shadow-xl">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
            <input 
              type="text" 
              placeholder="ابحث بالاسم، رقم الهاتف، أو خط السير..." 
              className="w-full pr-12 pl-4 py-3 bg-[#0b0f1a] border border-[#1e293b] rounded-xl text-white focus:outline-none focus:border-blue-500 transition-all placeholder:text-slate-600"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            <div className="col-span-full py-12 text-center text-slate-500">جاري التحميل...</div>
          ) : filteredReps.length === 0 ? (
            <div className="col-span-full py-12 text-center text-slate-500">لا يوجد مناديب مسجلين</div>
          ) : (
            filteredReps.map((rep) => (
              <div key={rep.id} className="bg-[#0b0f1a] border border-[#1e293b] rounded-2xl p-6 hover:border-blue-500/50 transition-all group">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center border border-blue-500/20 text-blue-500">
                      <Users size={24} />
                    </div>
                    <div>
                      <h3 className="text-white font-bold text-lg">{rep.name}</h3>
                      <span className={cn(
                        "text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-widest mt-1 inline-block",
                        rep.status === 'active' ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"
                      )}>
                        {rep.status === 'active' ? 'نشط' : 'غير نشط'}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => openEditModal(rep)}
                      className="p-2 bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button 
                      onClick={() => handleDelete(rep.id)}
                      className="p-2 bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white rounded-lg transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-slate-400 text-sm">
                    <Phone size={16} className="text-slate-500" />
                    <span dir="ltr">{rep.phone}</span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-400 text-sm">
                    <MapPin size={16} className="text-slate-500" />
                    <span>{rep.route}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#151b2b] rounded-3xl border border-[#1e293b] shadow-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-[#1e293b] flex items-center justify-between bg-[#0f172a]">
              <h3 className="text-xl font-bold text-white">
                {editingRep ? 'تعديل بيانات المندوب' : 'إضافة مندوب جديد'}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              <form id="rep-form" onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-slate-300">اسم المندوب</label>
                    <input 
                      type="text" 
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="w-full bg-[#0b0f1a] border border-[#1e293b] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-all"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-slate-300">رقم الهاتف</label>
                    <input 
                      type="tel" 
                      required
                      dir="ltr"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      className="w-full bg-[#0b0f1a] border border-[#1e293b] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-all text-left"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-bold text-slate-300">خط السير (المنطقة)</label>
                  <input 
                    type="text" 
                    required
                    value={formData.route}
                    onChange={(e) => setFormData({...formData, route: e.target.value})}
                    className="w-full bg-[#0b0f1a] border border-[#1e293b] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-bold text-slate-300">الحالة</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value as 'active' | 'inactive'})}
                    className="w-full bg-[#0b0f1a] border border-[#1e293b] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-all"
                  >
                    <option value="active">نشط</option>
                    <option value="inactive">غير نشط</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-bold text-slate-300">ملاحظات إضافية</label>
                  <textarea 
                    rows={3}
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    className="w-full bg-[#0b0f1a] border border-[#1e293b] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-all resize-none"
                  ></textarea>
                </div>
              </form>
            </div>
            
            <div className="px-6 py-4 border-t border-[#1e293b] bg-[#0f172a] flex justify-end gap-3">
              <button 
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-6 py-2.5 rounded-xl font-bold text-slate-300 hover:bg-slate-800 transition-colors"
              >
                إلغاء
              </button>
              <button 
                type="submit"
                form="rep-form"
                className="px-6 py-2.5 rounded-xl font-bold bg-blue-600 hover:bg-blue-700 text-white transition-colors shadow-lg shadow-blue-500/20"
              >
                حفظ البيانات
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
