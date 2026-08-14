import React, { useState, useEffect } from 'react';
import { 
  X, 
  Plus, 
  Trash2, 
  Edit3, 
  Video, 
  Image as ImageIcon, 
  Sparkles, 
  CheckCircle2, 
  Play, 
  Sliders, 
  Layers, 
  RotateCcw, 
  Save, 
  Eye,
  Flame,
  Tag,
  QrCode,
  DollarSign
} from 'lucide-react';
import { PriceCheckerMediaAd, KioskDigitalSignageSettings } from '../../types/digitalSignageAds';
import { DigitalSignageEngine } from '../../services/digitalSignageEngine';
import { formatCurrency, cn } from '../../lib/utils';
import { toast } from 'react-hot-toast';

interface DigitalSignageAdManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRefreshMedia: () => void;
}

export const DigitalSignageAdManagerModal: React.FC<DigitalSignageAdManagerModalProps> = ({
  isOpen,
  onClose,
  onRefreshMedia
}) => {
  const [ads, setAds] = useState<PriceCheckerMediaAd[]>([]);
  const [settings, setSettings] = useState<KioskDigitalSignageSettings>(DigitalSignageEngine.getSettings());
  const [activeTab, setActiveTab] = useState<'ADS_LIST' | 'CREATE_AD' | 'SETTINGS'>('ADS_LIST');
  const [editingAd, setEditingAd] = useState<PriceCheckerMediaAd | null>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<PriceCheckerMediaAd>>({
    titleAr: '',
    type: 'VIDEO',
    mediaUrl: '',
    posterUrl: '',
    displayDurationSeconds: 10,
    videoDurationSeconds: 12,
    badgeTextAr: 'عرض خاص 🔥',
    badgeColor: 'bg-amber-600',
    headlineAr: '',
    subHeadlineAr: '',
    ctaTextAr: '',
    qrCodeLink: '',
    targetCategory: 'عام',
    isActive: true,
    displayOrder: 1,
    layoutStyle: 'FULLSCREEN'
  });

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  const loadData = () => {
    setAds(DigitalSignageEngine.getAds());
    setSettings(DigitalSignageEngine.getSettings());
  };

  if (!isOpen) return null;

  const handleStartCreate = () => {
    setEditingAd(null);
    setFormData({
      id: `ad_custom_${Date.now()}`,
      titleAr: 'حملة إعلانية جديدة',
      type: 'VIDEO',
      mediaUrl: 'https://assets.mixkit.co/videos/preview/mixkit-coffee-beans-falling-in-slow-motion-41865-large.mp4',
      posterUrl: '',
      displayDurationSeconds: 10,
      videoDurationSeconds: 12,
      badgeTextAr: 'عرض مميز 🔥',
      badgeColor: 'bg-amber-600',
      headlineAr: 'تخفيضات وعروض حصرية لعملاء المتجر',
      subHeadlineAr: 'استفد من أقوى العروض اليومية بأسعار خاصة جداً',
      ctaTextAr: 'مرر الباركود أمام الكشك للاستعلام عن السعر',
      qrCodeLink: 'https://maro-erp.com/offers',
      targetCategory: 'عام',
      isActive: true,
      displayOrder: ads.length + 1,
      layoutStyle: 'FULLSCREEN'
    });
    setActiveTab('CREATE_AD');
  };

  const handleEdit = (ad: PriceCheckerMediaAd) => {
    setEditingAd(ad);
    setFormData({ ...ad });
    setActiveTab('CREATE_AD');
  };

  const handleDelete = (id: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذا الإعلان الترويجي؟')) {
      DigitalSignageEngine.deleteAd(id);
      loadData();
      onRefreshMedia();
      toast.success('تم حذف الإعلان بنجاح');
    }
  };

  const handleToggleStatus = (id: string) => {
    DigitalSignageEngine.toggleAdStatus(id);
    loadData();
    onRefreshMedia();
  };

  const handleSaveAd = () => {
    if (!formData.headlineAr || !formData.mediaUrl) {
      toast.error('يرجى كتابة عنوان الإعلان ورابط الفيديو أو الصورة');
      return;
    }

    const adToSave: PriceCheckerMediaAd = {
      id: editingAd ? editingAd.id : (formData.id || `ad_${Date.now()}`),
      titleAr: formData.titleAr || formData.headlineAr || 'إعلان ترويجي',
      titleEn: formData.titleEn,
      type: formData.type || 'VIDEO',
      mediaUrl: formData.mediaUrl || '',
      posterUrl: formData.posterUrl,
      displayDurationSeconds: Number(formData.displayDurationSeconds) || 10,
      videoDurationSeconds: Number(formData.videoDurationSeconds) || 12,
      badgeTextAr: formData.badgeTextAr,
      badgeColor: formData.badgeColor || 'bg-amber-600',
      headlineAr: formData.headlineAr || '',
      subHeadlineAr: formData.subHeadlineAr,
      ctaTextAr: formData.ctaTextAr,
      qrCodeLink: formData.qrCodeLink,
      targetCategory: formData.targetCategory,
      targetProductId: formData.targetProductId,
      isActive: formData.isActive !== undefined ? formData.isActive : true,
      displayOrder: Number(formData.displayOrder) || 1,
      soundEnabledByDefault: false,
      layoutStyle: formData.layoutStyle || 'FULLSCREEN',
      createdAt: editingAd ? editingAd.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    DigitalSignageEngine.saveAd(adToSave);
    loadData();
    onRefreshMedia();
    setActiveTab('ADS_LIST');
    toast.success(editingAd ? 'تم تعديل الإعلان بنجاح' : 'تمت إضافة الإعلان الجديد بنجاح');
  };

  const handleSaveSettings = () => {
    DigitalSignageEngine.saveSettings(settings);
    onRefreshMedia();
    toast.success('تم حفظ إعدادات شاشات العرض الرقمية بنجاح');
  };

  const handleResetPresets = () => {
    if (window.confirm('هل تريد إعادة تعيين كافة الإعلانات والفيديوهات الافتراضية؟')) {
      DigitalSignageEngine.resetToDefaultPresets();
      loadData();
      onRefreshMedia();
      toast.success('تمت استعادة الإعلانات الافتراضية');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#121826] border border-slate-800 rounded-3xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-800 bg-[#0d121e] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-2xl">
              <Video size={24} />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-black text-white">إدارة الإعلانات الترويجية وشاشات العرض الرقمية</h2>
                <span className="px-2.5 py-0.5 bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded-full text-xs font-mono font-bold">
                  Digital Signage Hub v4.0
                </span>
              </div>
              <p className="text-xs text-slate-400">
                إدارة الفيديوهات الدعائية، معارض الصور، بنرات العروض الترويجية، وشريط الأخبار لكشك استعلام الأسعار
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="px-6 pt-4 border-b border-slate-800 flex items-center justify-between gap-4 bg-[#0e1422]">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('ADS_LIST')}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all",
                activeTab === 'ADS_LIST' 
                  ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/30" 
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
              )}
            >
              <Layers size={16} />
              <span>قائمة الإعلانات والفيديوهات ({ads.length})</span>
            </button>

            <button
              onClick={handleStartCreate}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all",
                activeTab === 'CREATE_AD' 
                  ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/30" 
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
              )}
            >
              <Plus size={16} />
              <span>{editingAd ? 'تعديل الإعلان' : 'إضافة فيديو / إعلان جديد'}</span>
            </button>

            <button
              onClick={() => setActiveTab('SETTINGS')}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all",
                activeTab === 'SETTINGS' 
                  ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/30" 
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
              )}
            >
              <Sliders size={16} />
              <span>إعدادات الشاشات وشريط الأخبار</span>
            </button>
          </div>

          <button
            onClick={handleResetPresets}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-400 hover:text-amber-400 rounded-lg transition-colors"
            title="استعادة الإعلانات الترويجية الافتراضية"
          >
            <RotateCcw size={14} />
            <span>استعادة الافتراضي</span>
          </button>
        </div>

        {/* Tab 1: Ads List */}
        {activeTab === 'ADS_LIST' && (
          <div className="p-6 flex-1 overflow-y-auto space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400">الإعلانات المعروضة على الشاشات:</span>
              <button
                onClick={handleStartCreate}
                className="flex items-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-500 text-slate-950 font-black text-xs rounded-xl shadow-md transition-all active:scale-95"
              >
                <Plus size={16} />
                <span>إضافة إعلان أو فيديو جديد</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {ads.map(ad => (
                <div
                  key={ad.id}
                  className={cn(
                    "border rounded-2xl p-4 flex flex-col justify-between gap-3 transition-all",
                    ad.isActive ? "bg-[#161f33] border-slate-700/80 hover:border-amber-500/50" : "bg-[#0f1420] border-slate-800 opacity-60"
                  )}
                >
                  <div className="flex items-start gap-3">
                    {/* Media Thumbnail */}
                    <div className="w-24 h-20 rounded-xl bg-slate-900 border border-slate-700 overflow-hidden relative shrink-0 flex items-center justify-center">
                      {ad.type === 'VIDEO' ? (
                        <div className="w-full h-full relative">
                          <img 
                            src={ad.posterUrl || 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=300'} 
                            alt=""
                            className="w-full h-full object-cover" 
                          />
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                            <Play size={20} className="text-amber-400" />
                          </div>
                        </div>
                      ) : (
                        <img 
                          src={ad.mediaUrl} 
                          alt="" 
                          className="w-full h-full object-cover" 
                        />
                      )}
                    </div>

                    {/* Details */}
                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-amber-300 font-mono">
                          {ad.type === 'VIDEO' ? '🎬 فيديو' : '🖼️ صورة'}
                        </span>
                        {ad.badgeTextAr && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300">
                            {ad.badgeTextAr}
                          </span>
                        )}
                        <span className="text-[10px] text-slate-400 font-mono">
                          ⏱️ {ad.displayDurationSeconds} ثوانٍ
                        </span>
                      </div>

                      <h4 className="text-sm font-black text-white truncate">{ad.headlineAr}</h4>
                      <p className="text-xs text-slate-400 truncate">{ad.subHeadlineAr || ad.titleAr}</p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between border-t border-slate-800 pt-2.5 mt-1">
                    <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={ad.isActive}
                        onChange={() => handleToggleStatus(ad.id)}
                        className="rounded accent-amber-500"
                      />
                      <span>{ad.isActive ? 'مفعّل على الشاشة' : 'معطّل مؤقتاً'}</span>
                    </label>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleEdit(ad)}
                        className="p-1.5 text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                        title="تعديل"
                      >
                        <Edit3 size={15} />
                      </button>
                      <button
                        onClick={() => handleDelete(ad.id)}
                        className="p-1.5 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                        title="حذف"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 2: Create / Edit Ad */}
        {activeTab === 'CREATE_AD' && (
          <div className="p-6 flex-1 overflow-y-auto space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">نوع الإعلان:</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, type: 'VIDEO' })}
                      className={cn(
                        "flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-bold transition-all",
                        formData.type === 'VIDEO' 
                          ? "bg-amber-500/20 text-amber-300 border-amber-500" 
                          : "bg-slate-900 text-slate-400 border-slate-800"
                      )}
                    >
                      <Video size={16} />
                      <span>فيديو ترويجي (MP4 / WebM)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, type: 'IMAGE_SLIDE' })}
                      className={cn(
                        "flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-bold transition-all",
                        formData.type === 'IMAGE_SLIDE' 
                          ? "bg-amber-500/20 text-amber-300 border-amber-500" 
                          : "bg-slate-900 text-slate-400 border-slate-800"
                      )}
                    >
                      <ImageIcon size={16} />
                      <span>صورة إعلانية / بانر</span>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">رابط ملف الفيديو أو الصورة (Direct URL):</label>
                  <input
                    type="url"
                    value={formData.mediaUrl || ''}
                    onChange={e => setFormData({ ...formData, mediaUrl: e.target.value })}
                    placeholder="https://example.com/video.mp4 or image.jpg"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono"
                  />
                </div>

                {formData.type === 'VIDEO' && (
                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">صورة الغلاف للفيديو (Poster Image):</label>
                    <input
                      type="url"
                      value={formData.posterUrl || ''}
                      onChange={e => setFormData({ ...formData, posterUrl: e.target.value })}
                      placeholder="https://images.unsplash.com/..."
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono"
                    />
                  </div>
                )}

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">العنوان الرئيسي للإعلان:</label>
                  <input
                    type="text"
                    value={formData.headlineAr || ''}
                    onChange={e => setFormData({ ...formData, headlineAr: e.target.value })}
                    placeholder="مثال: خصم 30% على منتجات الألبان والأجبان الفاخرة"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">العنوان الفرعي / الوصف الترويجي:</label>
                  <input
                    type="text"
                    value={formData.subHeadlineAr || ''}
                    onChange={e => setFormData({ ...formData, subHeadlineAr: e.target.value })}
                    placeholder="مثال: عند الشراء بقيمة 200 ج.م احصل على هدية مجانية فورية"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">شارة العرض (Badge):</label>
                    <input
                      type="text"
                      value={formData.badgeTextAr || ''}
                      onChange={e => setFormData({ ...formData, badgeTextAr: e.target.value })}
                      placeholder="خصم 50% 🔥"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">مدة العرض (بالثواني):</label>
                    <input
                      type="number"
                      min={3}
                      max={60}
                      value={formData.displayDurationSeconds || 10}
                      onChange={e => setFormData({ ...formData, displayDurationSeconds: Number(e.target.value) })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">نص الدعوة للإجراء (Call To Action):</label>
                  <input
                    type="text"
                    value={formData.ctaTextAr || ''}
                    onChange={e => setFormData({ ...formData, ctaTextAr: e.target.value })}
                    placeholder="مثال: متوفر في ممر 3 • امسح الباركود للاستعلام"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">القسم المستهدف:</label>
                  <select
                    value={formData.targetCategory || 'عام'}
                    onChange={e => setFormData({ ...formData, targetCategory: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  >
                    <option value="عام">جميع الأقسام (عرض عام)</option>
                    <option value="المشروبات والأغذية المحفوظة">المشروبات والأغذية المحفوظة</option>
                    <option value="خضار وفواكه طازجة">خضار وفواكه طازجة</option>
                    <option value="لحوم ودواجن">لحوم ودواجن</option>
                    <option value="ألبان وأجبان">ألبان وأجبان</option>
                    <option value="مخبوزات وحلويات">مخبوزات وحلويات</option>
                    <option value="إلكترونيات وأجهزة منزلية">إلكترونيات وأجهزة منزلية</option>
                    <option value="عطور ومستحضرات تجميل">عطور ومستحضرات تجميل</option>
                  </select>
                </div>

                {/* Live Preview Box */}
                <div className="bg-[#0b101c] p-3.5 rounded-2xl border border-slate-800 space-y-2">
                  <span className="text-[11px] font-bold text-slate-400">معاينة مباشرة للإعلان:</span>
                  <div className="h-28 rounded-xl bg-slate-900 overflow-hidden relative flex flex-col justify-end p-3 border border-slate-700">
                    <img 
                      src={formData.posterUrl || formData.mediaUrl || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400'} 
                      alt="" 
                      className="absolute inset-0 w-full h-full object-cover opacity-60"
                    />
                    <div className="relative z-10">
                      {formData.badgeTextAr && (
                        <span className="px-2 py-0.5 bg-amber-600 text-white rounded text-[9px] font-bold inline-block mb-1">
                          {formData.badgeTextAr}
                        </span>
                      )}
                      <h5 className="text-xs font-black text-white truncate">{formData.headlineAr || 'عنوان الإعلان'}</h5>
                      <p className="text-[10px] text-amber-200 truncate">{formData.subHeadlineAr}</p>
                    </div>
                  </div>
                </div>
              </div>

            </div>

            <div className="flex items-center gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={handleSaveAd}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-amber-600 hover:bg-amber-500 text-slate-950 font-black text-xs rounded-xl shadow-lg transition-all active:scale-95"
              >
                <Save size={16} />
                <span>حفظ الإعلان وتنشيطه على الشاشات</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('ADS_LIST')}
                className="px-4 py-2.5 bg-slate-800 text-slate-300 hover:bg-slate-700 rounded-xl text-xs font-bold"
              >
                إلغاء
              </button>
            </div>
          </div>
        )}

        {/* Tab 3: Kiosk & Signage Settings */}
        {activeTab === 'SETTINGS' && (
          <div className="p-6 flex-1 overflow-y-auto space-y-5">
            <div className="max-w-2xl mx-auto space-y-4">
              
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">اسم المتجر المعروض على الشاشات:</label>
                <input
                  type="text"
                  value={settings.storeNameAr}
                  onChange={e => setSettings({ ...settings, storeNameAr: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">وقت الانتظار قبل تشغيل الفيديوهات والإعلانات (بالثواني):</label>
                <input
                  type="number"
                  min={5}
                  max={120}
                  value={settings.idleTimeoutSeconds}
                  onChange={e => setSettings({ ...settings, idleTimeoutSeconds: Number(e.target.value) })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  عند عدم تمرير أي باركود لهذه المدة، ينتقل الكشك تلقائياً لعرض الفيديوهات والإعلانات الترويجية.
                </span>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">نص شريط الأخبار المتحرك (Ticker Bar):</label>
                <textarea
                  rows={3}
                  value={settings.tickerTextAr}
                  onChange={e => setSettings({ ...settings, tickerTextAr: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div className="space-y-2 pt-2">
                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.showTickerBar}
                    onChange={e => setSettings({ ...settings, showTickerBar: e.target.checked })}
                    className="rounded accent-amber-500"
                  />
                  <span>إظهار شريط الأخبار المتحرك أسفل شاشة الاستعلام</span>
                </label>

                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.autoTransitionOnScan}
                    onChange={e => setSettings({ ...settings, autoTransitionOnScan: e.target.checked })}
                    className="rounded accent-amber-500"
                  />
                  <span>الانتقال الفوري من شاشة الإعلانات لبيانات الصنف عند مسح الباركود (&lt; 50ms)</span>
                </label>
              </div>

              <div className="pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={handleSaveSettings}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-amber-600 hover:bg-amber-500 text-slate-950 font-black text-xs rounded-xl shadow-lg transition-all active:scale-95"
                >
                  <Save size={16} />
                  <span>حفظ إعدادات كشك الاستعلام والشاشات</span>
                </button>
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
};
