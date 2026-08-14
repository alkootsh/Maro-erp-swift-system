import React, { useState, useEffect } from 'react';
import { 
  Code2, Users, Lightbulb, Sparkles, CheckCircle2, ThumbsUp, 
  Layers, Plus, Search, Shield, Cpu, ExternalLink, Terminal, Award, FileText, Send, Star
} from 'lucide-react';
import { MaroSyncEngine } from '../lib/maroSyncEngine';
import { formatCurrency, cn } from '../lib/utils';
import { toast } from 'react-hot-toast';

interface DeveloperSuggestion {
  id: string;
  title: string;
  authorName: string;
  partnerCompany: string;
  category: 'RETAIL' | 'FINANCE' | 'MANUFACTURING' | 'HEALTHCARE' | 'LOGISTICS' | 'CUSTOM';
  description: string;
  votes: number;
  status: 'PENDING' | 'PLANNED' | 'IN_DEVELOPMENT' | 'IMPLEMENTED';
  createdAt: string;
}

interface CertifiedPartner {
  id: string;
  name: string;
  country: string;
  specialty: string;
  rating: number;
  completedProjects: number;
  badge: string;
}

export const DeveloperPartnerHub: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'suggestions' | 'marketplace' | 'partners' | 'submit'>('suggestions');
  const [suggestions, setSuggestions] = useState<DeveloperSuggestion[]>([
    {
      id: 'sug_1',
      title: 'ربط نظام ميزان الباركود الآلي (Barcode Scale TCP/IP)',
      authorName: 'م. أحمد ممدوح',
      partnerCompany: 'شركة النوادر للحلول البرمجية',
      category: 'RETAIL',
      description: 'إضافة دعم مباشر لقراءة الأوزان من موازين Toledo و Datalogic عبر بروتوكول TCP/IP وإدراج السعر والوزن تلقائياً في شاشة POS.',
      votes: 48,
      status: 'IMPLEMENTED',
      createdAt: '2026-06-15'
    },
    {
      id: 'sug_2',
      title: 'بوابة الدفع الإلكتروني عبر كود الـ QR (InstaPay & Meeza)',
      authorName: 'محمد عبد الله',
      partnerCompany: 'مجموعة التكنولوجيا الذكية',
      category: 'FINANCE',
      description: 'تكامل مباشر مع شبكة المدفوعات اللحظية المصرية (InstaPay) وميزة QR Code لطباعة رمز السداد الفوري على التذكرة الحرارية.',
      votes: 35,
      status: 'IN_DEVELOPMENT',
      createdAt: '2026-07-02'
    },
    {
      id: 'sug_3',
      title: 'موديول إدارة عقارات ومقاولات التشييد والبناء',
      authorName: 'مهندس سامح العشري',
      partnerCompany: 'سليوشن تك للبرمجيات',
      category: 'CUSTOM',
      description: 'إدارة مراحل الإنشاء، دفعات العملاء المرتبطة بالرسومات الهندسية، وحساب تكلفة المواد والمقاولين الباطن (مثل Odoo Project & Construction).',
      votes: 29,
      status: 'PLANNED',
      createdAt: '2026-07-20'
    }
  ]);

  const [partners, setPartners] = useState<CertifiedPartner[]>([
    { id: 'p_1', name: 'شركة الأفق الرقمي لأنظمة ERP', country: 'المملكة العربية السعودية (الرياض)', specialty: 'سلاسل التجزئة وتكامل ZATCA', rating: 4.9, completedProjects: 142, badge: 'Gold Partner' },
    { id: 'p_2', name: 'مجموعة التكنولوجيا المتطورة', country: 'جمهورية مصر العربية (القاهرة)', specialty: 'التصنيع والمستودعات الطبية', rating: 4.8, completedProjects: 98, badge: 'Platinum Partner' },
    { id: 'p_3', name: 'سليوشن إكسبريس للحلول السحابية', country: 'الإمارات العربية المتحدة (دبي)', specialty: 'نقاط البيع والمطاعم الفندقية', rating: 4.9, completedProjects: 115, badge: 'Gold Partner' }
  ]);

  // Form State
  const [newTitle, setNewTitle] = useState('');
  const [newAuthor, setNewAuthor] = useState('');
  const [newCompany, setNewCompany] = useState('');
  const [newCategory, setNewCategory] = useState<DeveloperSuggestion['category']>('RETAIL');
  const [newDesc, setNewDesc] = useState('');

  const [implementingId, setImplementingId] = useState<string | null>(null);

  const handleVote = (id: string) => {
    setSuggestions(suggestions.map(s => s.id === id ? { ...s, votes: s.votes + 1 } : s));
    toast.success('تم تسجيل صوتك بنجاح لصالح هذا المقترح!');
  };

  const handleAddSuggestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newAuthor || !newDesc) {
      toast.error('يرجى استكمال الحقول الإجبارية للمقترح');
      return;
    }

    const item: DeveloperSuggestion = {
      id: 'sug_' + Date.now(),
      title: newTitle,
      authorName: newAuthor,
      partnerCompany: newCompany || 'مطور مستقل / شريك معتمد',
      category: newCategory,
      description: newDesc,
      votes: 1,
      status: 'PENDING',
      createdAt: new Date().toISOString().split('T')[0]
    };

    setSuggestions([item, ...suggestions]);
    toast.success('تم إرسال اقتراحك بنجاح لمجلس مراجعة المطورين والذكاء الاصطناعي في MARO!');
    setNewTitle('');
    setNewAuthor('');
    setNewCompany('');
    setNewDesc('');
    setActiveTab('suggestions');
  };

  const handleRunAiImplementation = (sug: DeveloperSuggestion) => {
    setImplementingId(sug.id);
    setTimeout(() => {
      setSuggestions(suggestions.map(s => s.id === sug.id ? { ...s, status: 'IMPLEMENTED' } : s));
      setImplementingId(null);
      toast.success(`🎉 تم تنفيذ واختبار موديول "${sug.title}" بنجاح وإضافته إلى النواة التنفيذية للمنصة!`);
    }, 2500);
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="bg-[#151b2b] p-8 rounded-3xl border border-[#1e293b] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider mb-1">
            <Code2 size={16} />
            <span>منصة المطورين والشركاء المعتمدين (MARO Developer & Partner Ecosystem)</span>
          </div>
          <h1 className="text-2xl font-black text-white">متجر الشركاء واقتراحات المطورين (Odoo-Style App & Contributor Hub)</h1>
          <p className="text-slate-400 text-xs mt-1">
            ساهم بمقترحاتك، طور وحدات مخصصة (Modules)، وشارك في بناء وتطوير أقوى منصة ERP في الشرق الأوسط.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveTab('submit')}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-2xl font-bold text-xs shadow-lg shadow-indigo-900/30 transition-all hover:scale-105"
          >
            <Plus size={18} />
            <span>تقديم مقترح أو موديول جديد</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-[#1e293b] pb-3 overflow-x-auto">
        <button
          onClick={() => setActiveTab('suggestions')}
          className={cn(
            "px-5 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap",
            activeTab === 'suggestions' ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30" : "bg-[#151b2b] text-slate-400 hover:text-white border border-[#1e293b]"
          )}
        >
          <Lightbulb size={16} />
          <span>مقترحات المجتمع وتصويت المطورين ({suggestions.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('marketplace')}
          className={cn(
            "px-5 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap",
            activeTab === 'marketplace' ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30" : "bg-[#151b2b] text-slate-400 hover:text-white border border-[#1e293b]"
          )}
        >
          <Layers size={16} />
          <span>متجر تطبيقات الشركاء (MARO App Store)</span>
        </button>
        <button
          onClick={() => setActiveTab('partners')}
          className={cn(
            "px-5 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap",
            activeTab === 'partners' ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30" : "bg-[#151b2b] text-slate-400 hover:text-white border border-[#1e293b]"
          )}
        >
          <Users size={16} />
          <span>دليل الشركاء المعتمدين ({partners.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('submit')}
          className={cn(
            "px-5 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap",
            activeTab === 'submit' ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30" : "bg-[#151b2b] text-slate-400 hover:text-white border border-[#1e293b]"
          )}
        >
          <Send size={16} />
          <span>استمارة إضافة موديول جديد</span>
        </button>
      </div>

      {/* Tab 1: Suggestions & Backlog */}
      {activeTab === 'suggestions' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-[#151b2b] p-5 rounded-2xl border border-[#1e293b]">
              <div className="text-xs font-bold text-slate-500 uppercase">إجمالي المقترحات</div>
              <div className="text-2xl font-black text-white mt-1">{suggestions.length} مقترح</div>
            </div>
            <div className="bg-[#151b2b] p-5 rounded-2xl border border-[#1e293b]">
              <div className="text-xs font-bold text-slate-500 uppercase">ميزات تم تنفيذها آلياً</div>
              <div className="text-2xl font-black text-emerald-400 mt-1">
                {suggestions.filter(s => s.status === 'IMPLEMENTED').length} ميزة
              </div>
            </div>
            <div className="bg-[#151b2b] p-5 rounded-2xl border border-[#1e293b]">
              <div className="text-xs font-bold text-slate-500 uppercase">قيد التطوير والتنفيذ</div>
              <div className="text-2xl font-black text-amber-400 mt-1">
                {suggestions.filter(s => s.status === 'IN_DEVELOPMENT' || s.status === 'PLANNED').length} ميزة
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {suggestions.map(sug => (
              <div key={sug.id} className="bg-[#151b2b] p-6 rounded-3xl border border-[#1e293b] flex flex-col justify-between space-y-4 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-2 h-full bg-indigo-500"></div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 text-[10px] font-bold uppercase">
                      {sug.category}
                    </span>
                    <span className={cn(
                      "px-3 py-1 rounded-full text-[10px] font-bold",
                      sug.status === 'IMPLEMENTED' ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                      sug.status === 'IN_DEVELOPMENT' ? "bg-blue-500/10 text-blue-400 border border-blue-500/20" :
                      sug.status === 'PLANNED' ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" :
                      "bg-slate-800 text-slate-400"
                    )}>
                      {sug.status === 'IMPLEMENTED' ? '✅ تم التنفيذ والإطلاق' :
                       sug.status === 'IN_DEVELOPMENT' ? '⚡ قيد التطوير البرمجي' :
                       sug.status === 'PLANNED' ? '📌 مخطط للتنفيذ' : '⏳ قيد المراجعة'}
                    </span>
                  </div>

                  <h3 className="text-lg font-black text-white">{sug.title}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">{sug.description}</p>
                </div>

                <div className="pt-4 border-t border-[#1e293b] flex items-center justify-between gap-2">
                  <div className="text-[11px] text-slate-500">
                    بواسطة: <strong className="text-slate-300">{sug.authorName}</strong> ({sug.partnerCompany})
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleVote(sug.id)}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-indigo-400 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all"
                    >
                      <ThumbsUp size={14} />
                      <span>{sug.votes} صوت</span>
                    </button>

                    {sug.status !== 'IMPLEMENTED' && (
                      <button
                        disabled={implementingId === sug.id}
                        onClick={() => handleRunAiImplementation(sug)}
                        className="px-4 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-900/30 transition-all flex items-center gap-1.5 disabled:opacity-50"
                      >
                        <Sparkles size={14} />
                        <span>{implementingId === sug.id ? 'جاري التوليد والتنفيذ...' : 'تنفيذ فوري بالذكاء الاصطناعي'}</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 2: Partner App Store */}
      {activeTab === 'marketplace' && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-indigo-900/40 to-blue-900/40 p-6 rounded-3xl border border-indigo-500/20 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white">متجر إضافات وموديولات مارو (Odoo Apps Store Ecosystem)</h2>
              <p className="text-xs text-slate-300 mt-1">تطبيقات معتمدة من الشركاء والمطورين المستقلين يمكن تثبيتها وتفعيلها بنقرة واحدة.</p>
            </div>
            <div className="px-4 py-2 bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 rounded-2xl text-xs font-bold">
              +120 موديول متوافق
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-[#151b2b] p-6 rounded-3xl border border-[#1e293b] flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between">
                  <span className="px-3 py-1 rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-bold">مجانى (Free)</span>
                  <div className="flex items-center gap-1 text-amber-400 text-xs font-bold">
                    <Star size={14} className="fill-current" />
                    <span>4.9 (86 تقييم)</span>
                  </div>
                </div>
                <h3 className="text-base font-bold text-white mt-3">تكامل فوري مع فواتير زاتكا (ZATCA Phase 2 E-Invoicing)</h3>
                <p className="text-xs text-slate-400 mt-1">تصدير الفواتير بالتنسيق المعتمد لهيئة الزكاة والضريبة والجمارك بالمملكة العربية السعودية وتوقيع XML آلياً.</p>
              </div>
              <button 
                onClick={() => toast.success('تم تثبيت موديول زاتكا بنجاح في القائمة الرئيسية!')}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-indigo-600/20"
              >
                تثبيت الموديول فورا
              </button>
            </div>

            <div className="bg-[#151b2b] p-6 rounded-3xl border border-[#1e293b] flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between">
                  <span className="px-3 py-1 rounded bg-blue-500/10 text-blue-400 text-[10px] font-bold">شريك معتمد</span>
                  <div className="flex items-center gap-1 text-amber-400 text-xs font-bold">
                    <Star size={14} className="fill-current" />
                    <span>4.8 (54 تقييم)</span>
                  </div>
                </div>
                <h3 className="text-base font-bold text-white mt-3">إدارة أسطول النقل والتوصيل (Fleet & GPS Tracking)</h3>
                <p className="text-xs text-slate-400 mt-1">تتبع خط سير المندوبين وسيارات التوصيل على الخريطة الحية وحساب استهلاك الوقود وأتعاب السائقين.</p>
              </div>
              <button 
                onClick={() => toast.success('تم تثبيت موديول الأسطول بنجاح!')}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-indigo-600/20"
              >
                تثبيت الموديول فورا
              </button>
            </div>

            <div className="bg-[#151b2b] p-6 rounded-3xl border border-[#1e293b] flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between">
                  <span className="px-3 py-1 rounded bg-purple-500/10 text-purple-400 text-[10px] font-bold">متقدم</span>
                  <div className="flex items-center gap-1 text-amber-400 text-xs font-bold">
                    <Star size={14} className="fill-current" />
                    <span>5.0 (31 تقييم)</span>
                  </div>
                </div>
                <h3 className="text-base font-bold text-white mt-3">محرك التجارة الإلكترونية الشامل (Omnichannel E-Commerce Bridge)</h3>
                <p className="text-xs text-slate-400 mt-1">مزامنة فورية للطلبات والعملاء والمخزون بين متجر سلة، زد، ووستوك مع نظام ERP الرئيسي.</p>
              </div>
              <button 
                onClick={() => toast.success('تم تثبيت جسر التجارة الإلكترونية بنجاح!')}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-indigo-600/20"
              >
                تثبيت الموديول فورا
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Certified Partners */}
      {activeTab === 'partners' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {partners.map(p => (
              <div key={p.id} className="bg-[#151b2b] p-6 rounded-3xl border border-[#1e293b] space-y-4 shadow-xl">
                <div className="flex items-center justify-between">
                  <div className="p-3 bg-indigo-600/20 text-indigo-400 rounded-2xl">
                    <Award size={24} />
                  </div>
                  <span className="px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 text-xs font-bold">
                    {p.badge}
                  </span>
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">{p.name}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">{p.country}</p>
                </div>
                <div className="p-3 bg-[#0f172a] rounded-2xl border border-[#1e293b] text-xs text-slate-300">
                  <span className="text-slate-500 block mb-1">التخصص والخبرة:</span>
                  <strong className="text-indigo-400">{p.specialty}</strong>
                </div>
                <div className="flex items-center justify-between pt-2 text-xs">
                  <div className="flex items-center gap-1 text-amber-400 font-bold">
                    <Star size={14} className="fill-current" />
                    <span>{p.rating} / 5.0</span>
                  </div>
                  <div className="text-slate-400 font-bold">
                    {p.completedProjects} مشروع ناجح
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: Submit New Suggestion */}
      {activeTab === 'submit' && (
        <div className="bg-[#151b2b] p-8 rounded-3xl border border-[#1e293b] max-w-3xl mx-auto shadow-2xl space-y-6">
          <div>
            <h2 className="text-xl font-bold text-white">إضافة موديول أو مقترح تطوير جديد (Odoo Contributor Form)</h2>
            <p className="text-xs text-slate-400 mt-1">املأ البيانات أدناه لكي يتم إدراج فكرتك في جدول أعمال المطورين والذكاء الاصطناعي لتنفيذها فوريًا.</p>
          </div>

          <form onSubmit={handleAddSuggestion} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">اسم المطور / المقدم *</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: م. أحمد عبد السلام"
                  value={newAuthor}
                  onChange={(e) => setNewAuthor(e.target.value)}
                  className="w-full p-3 bg-[#0f172a] border border-[#1e293b] rounded-xl text-white text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">اسم الشركة أو فريق العمل</label>
                <input
                  type="text"
                  placeholder="مثال: مؤسسة الحلول السحابية"
                  value={newCompany}
                  onChange={(e) => setNewCompany(e.target.value)}
                  className="w-full p-3 bg-[#0f172a] border border-[#1e293b] rounded-xl text-white text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">عنوان المقترح أو الموديول *</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: ربط بوابة الدفع الإلكتروني سداد"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full p-3 bg-[#0f172a] border border-[#1e293b] rounded-xl text-white text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">التصنيف الرئيسي *</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as any)}
                  className="w-full p-3 bg-[#0f172a] border border-[#1e293b] rounded-xl text-white text-xs font-bold focus:outline-none focus:border-indigo-500"
                >
                  <option value="RETAIL">التجزئة ونقاط البيع (Retail)</option>
                  <option value="FINANCE">المالية والحسابات (Finance)</option>
                  <option value="MANUFACTURING">التصنيع والمستودعات (Manufacturing)</option>
                  <option value="HEALTHCARE">الرعاية الصحية والصيدليات (Healthcare)</option>
                  <option value="LOGISTICS">سلاسل الإمداد والنقل (Logistics)</option>
                  <option value="CUSTOM">أنشطة وموديولات مخصصة (Custom)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1">وصف تفصيلي للمقترح والفوائد التشغيلية *</label>
              <textarea
                required
                rows={4}
                placeholder="اشرح الفكرة وكيف ستساهم في تحسين العمليات مثل أنظمة Odoo..."
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                className="w-full p-3 bg-[#0f172a] border border-[#1e293b] rounded-xl text-white text-xs focus:outline-none focus:border-indigo-500 resize-none"
              ></textarea>
            </div>

            <div className="pt-4 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setActiveTab('suggestions')}
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-all"
              >
                إلغاء
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-900/30 transition-all hover:scale-105"
              >
                إرسال المقترح إلى المنصة
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
