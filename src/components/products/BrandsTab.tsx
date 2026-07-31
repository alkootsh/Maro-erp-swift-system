// MARO ERP - Brands & Manufacturers Management
import React, { useState, useEffect } from 'react';
import { Plus, Award, Factory, Trash2, Globe, Mail, Phone, ExternalLink } from 'lucide-react';
import { ProductRepository } from '../../repositories/productRepository';
import { Brand, Manufacturer } from '../../types/productMaster';
import { toast } from 'react-hot-toast';

export const BrandsTab: React.FC = () => {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [manufacturers, setManufacturers] = useState<Manufacturer[]>([]);

  // Brand form state
  const [bName, setBName] = useState('');
  const [bCode, setBCode] = useState('');
  const [bWebsite, setBWebsite] = useState('');
  const [bCountry, setBCountry] = useState('');

  // Manufacturer form state
  const [mName, setMName] = useState('');
  const [mCode, setMCode] = useState('');
  const [mContact, setMContact] = useState('');
  const [mEmail, setMEmail] = useState('');
  const [mPhone, setMPhone] = useState('');

  useEffect(() => {
    const unsubB = ProductRepository.subscribeBrands(setBrands);
    const unsubM = ProductRepository.subscribeManufacturers(setManufacturers);
    return () => {
      unsubB();
      unsubM();
    };
  }, []);

  const handleAddBrand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bName || !bCode) {
      toast.error('اسم العلامة التجارية والرمز مطلوبة');
      return;
    }
    try {
      await ProductRepository.addBrand({
        name: bName,
        code: bCode,
        website: bWebsite,
        country: bCountry,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      toast.success('تمت إضافة العلامة التجارية بنجاح');
      setBName('');
      setBCode('');
      setBWebsite('');
      setBCountry('');
    } catch (err: any) {
      toast.error('خطأ أثناء إضافة العلامة التجارية');
    }
  };

  const handleAddManufacturer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mName || !mCode) {
      toast.error('اسم المصنّع والرمز مطلوبة');
      return;
    }
    try {
      await ProductRepository.addManufacturer({
        name: mName,
        code: mCode,
        contactPerson: mContact,
        email: mEmail,
        phone: mPhone,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      toast.success('تمت إضافة الجهة المصنّعة بنجاح');
      setMName('');
      setMCode('');
      setMContact('');
      setMEmail('');
      setMPhone('');
    } catch (err: any) {
      toast.error('خطأ أثناء إضافة المصنّع');
    }
  };

  const handleDeleteBrand = async (id: string, name: string) => {
    if (window.confirm(`حذف العلامة التجارية "${name}"؟`)) {
      await ProductRepository.deleteBrand(id, name);
      toast.success('تم الحذف');
    }
  };

  const handleDeleteManufacturer = async (id: string, name: string) => {
    if (window.confirm(`حذف المصنّع "${name}"؟`)) {
      await ProductRepository.deleteManufacturer(id, name);
      toast.success('تم الحذف');
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Brands Panel */}
      <div className="bg-[#151b2b] border border-[#1e293b] rounded-2xl p-6 space-y-6">
        <div className="flex items-center gap-3 border-b border-[#1e293b] pb-4">
          <div className="w-10 h-10 bg-amber-500/10 text-amber-400 rounded-xl flex items-center justify-center">
            <Award size={20} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">العلامات التجارية (Brands)</h3>
            <p className="text-xs text-slate-400">إدارة الماركات التجارية والعلامات المسجلة</p>
          </div>
        </div>

        <form onSubmit={handleAddBrand} className="space-y-3 bg-[#0b0f17] p-4 rounded-xl border border-[#1e293b]">
          <h4 className="text-xs font-bold text-slate-300 uppercase">إضافة ماركة جديدة</h4>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-400 block mb-1">اسم الماركة *</label>
              <input 
                type="text" 
                value={bName} 
                onChange={(e) => setBName(e.target.value)}
                placeholder="Apple / Samsung"
                className="w-full bg-[#151b2b] border border-[#1e293b] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">الرمز (Code) *</label>
              <input 
                type="text" 
                value={bCode} 
                onChange={(e) => setBCode(e.target.value)}
                placeholder="BRD-APL"
                className="w-full bg-[#151b2b] border border-[#1e293b] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-400 block mb-1">الموقع الإلكتروني</label>
              <input 
                type="text" 
                value={bWebsite} 
                onChange={(e) => setBWebsite(e.target.value)}
                placeholder="https://..."
                className="w-full bg-[#151b2b] border border-[#1e293b] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">دولة المنشأ</label>
              <input 
                type="text" 
                value={bCountry} 
                onChange={(e) => setBCountry(e.target.value)}
                placeholder="الولايات المتحدة / ألمانيا"
                className="w-full bg-[#151b2b] border border-[#1e293b] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>
          <button type="submit" className="w-full bg-amber-600 hover:bg-amber-500 text-white font-bold py-2 rounded-xl text-sm transition-colors flex items-center justify-center gap-2">
            <Plus size={16} /> إضافة العلامة التجارية
          </button>
        </form>

        <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
          {brands.length === 0 ? (
            <div className="text-center py-6 text-slate-500 text-sm">لا توجد ماركات تجارية بعد</div>
          ) : (
            brands.map((b) => (
              <div key={b.id} className="flex items-center justify-between p-3 bg-[#0b0f17] border border-[#1e293b] rounded-xl">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-sm">{b.name}</span>
                    <span className="text-[10px] bg-amber-500/20 text-amber-400 font-mono px-2 py-0.5 rounded-full">{b.code}</span>
                  </div>
                  {b.country && <p className="text-xs text-slate-400 mt-1">البلد: {b.country}</p>}
                </div>
                <button onClick={() => handleDeleteBrand(b.id, b.name)} className="p-1.5 hover:bg-red-500/20 text-red-400 rounded-lg">
                  <Trash2 size={16} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Manufacturers Panel */}
      <div className="bg-[#151b2b] border border-[#1e293b] rounded-2xl p-6 space-y-6">
        <div className="flex items-center gap-3 border-b border-[#1e293b] pb-4">
          <div className="w-10 h-10 bg-emerald-500/10 text-emerald-400 rounded-xl flex items-center justify-center">
            <Factory size={20} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">الجهات المصنّعة (Manufacturers)</h3>
            <p className="text-xs text-slate-400">إدارة شركات التصنيع والمصانع الموردة</p>
          </div>
        </div>

        <form onSubmit={handleAddManufacturer} className="space-y-3 bg-[#0b0f17] p-4 rounded-xl border border-[#1e293b]">
          <h4 className="text-xs font-bold text-slate-300 uppercase">إضافة مصنّع جديد</h4>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-400 block mb-1">اسم الشركة المصنعة *</label>
              <input 
                type="text" 
                value={mName} 
                onChange={(e) => setMName(e.target.value)}
                placeholder="Foxconn / Bosch"
                className="w-full bg-[#151b2b] border border-[#1e293b] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">الرمز (Code) *</label>
              <input 
                type="text" 
                value={mCode} 
                onChange={(e) => setMCode(e.target.value)}
                placeholder="MFR-100"
                className="w-full bg-[#151b2b] border border-[#1e293b] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-xs text-slate-400 block mb-1">مسؤول التواصل</label>
              <input 
                type="text" 
                value={mContact} 
                onChange={(e) => setMContact(e.target.value)}
                placeholder="الاسم"
                className="w-full bg-[#151b2b] border border-[#1e293b] rounded-lg px-2 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">البريد الإلكتروني</label>
              <input 
                type="email" 
                value={mEmail} 
                onChange={(e) => setMEmail(e.target.value)}
                placeholder="info@mfr.com"
                className="w-full bg-[#151b2b] border border-[#1e293b] rounded-lg px-2 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">الهاتف</label>
              <input 
                type="text" 
                value={mPhone} 
                onChange={(e) => setMPhone(e.target.value)}
                placeholder="+20 100..."
                className="w-full bg-[#151b2b] border border-[#1e293b] rounded-lg px-2 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>
          <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 rounded-xl text-sm transition-colors flex items-center justify-center gap-2">
            <Plus size={16} /> إضافة المصنّع
          </button>
        </form>

        <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
          {manufacturers.length === 0 ? (
            <div className="text-center py-6 text-slate-500 text-sm">لا يوجد مصنّعون مضافون بعد</div>
          ) : (
            manufacturers.map((m) => (
              <div key={m.id} className="flex items-center justify-between p-3 bg-[#0b0f17] border border-[#1e293b] rounded-xl">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-sm">{m.name}</span>
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-400 font-mono px-2 py-0.5 rounded-full">{m.code}</span>
                  </div>
                  {m.contactPerson && <p className="text-xs text-slate-400 mt-1">المسؤول: {m.contactPerson} {m.phone && `(${m.phone})`}</p>}
                </div>
                <button onClick={() => handleDeleteManufacturer(m.id, m.name)} className="p-1.5 hover:bg-red-500/20 text-red-400 rounded-lg">
                  <Trash2 size={16} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
