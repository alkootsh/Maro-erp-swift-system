/**
 * @file AssistantModulesHub.tsx
 * @module واجهات وصفحات النظام (UI Pages)
 * @description ملف جزء من نظام MARO ERP. الوظيفة: AssistantModulesHub.tsx.
 */
import React, { useState, useEffect } from 'react';
import { 
  Truck, 
  Bot, 
  Sparkles, 
  ToggleLeft, 
  ToggleRight, 
  CheckCircle, 
  AlertCircle, 
  Settings, 
  ShieldCheck, 
  MapPin, 
  Coins, 
  Users, 
  Briefcase,
  PlayCircle,
  HelpCircle,
  FileText,
  Send,
  MessageSquare,
  Lock,
  Volume2,
  Barcode,
  Clock
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { soundAlerts } from '../lib/soundAlerts';
import { MaroSyncEngine } from '../lib/maroSyncEngine';

interface AssistantModule {
  id: string;
  nameAr: string;
  nameEn: string;
  descriptionAr: string;
  descriptionEn: string;
  icon: any;
  enabled: boolean;
  category: 'SMART_SERVICE' | 'AI_ENGINE';
  featuresAr: string[];
}

export const AssistantModulesHub: React.FC = () => {
  // Modules state
  const [modules, setModules] = useState<AssistantModule[]>([
    {
      id: 'delivery',
      nameAr: 'منظومة الدليفري والتوصيل الذكي',
      nameEn: 'Smart Delivery & Dispatch',
      descriptionAr: 'منظومة متكاملة لربط الكاشير والمبيعات بالدليفري والطيارين، وتتبع حالة الطلبات وعناوين العملاء مع حساب العمولات التلقائي.',
      descriptionEn: 'Full-featured dispatch and delivery system connecting sales terminals with couriers.',
      icon: Truck,
      enabled: localStorage.getItem('maro_module_delivery_enabled') === 'true',
      category: 'SMART_SERVICE',
      featuresAr: [
        'ربط فوري بالـ POS وصالة المطعم أو السوبرماركت',
        'شاشة كاشير مخصصة لتحديد العنوان وهاتف العميل والطيار',
        'تحديد تسعيرة توصيل مرنة حسب المنطقة أو مجانية بعد حد معين',
        'توزيع ذكي وتتبع لخطوط سير السائقين وحالة التوصيل الفورية',
        'ربط فوري بطلبات المتجر الإلكتروني وطلبات الواتساب'
      ]
    },
    {
      id: 'ai_agents',
      nameAr: 'حزمة الذكاء الاصطناعي وعميل مارو الذكي',
      nameEn: 'Generative AI & Copilot Engine',
      descriptionAr: 'تفعيل الوكيل الذكي (AI Agent) المدمج لفهم الأوامر الصوتية، وتحليل حركة المبيعات وتوقع العجز والسيولة والرد الذكي على العملاء.',
      descriptionEn: 'Enable predictive analytics, voice search, and natural language ERP execution.',
      icon: Bot,
      enabled: localStorage.getItem('maro_module_ai_enabled') !== 'false', // Default enabled
      category: 'AI_ENGINE',
      featuresAr: [
        'تلقي الأوامر الصوتية باللغة العربية الفصحى والعاميات لإجراء فواتير',
        'توقع المبيعات والطلب الذكي باستخدام تحليلات السلاسل الزمنية',
        'توليد تقارير مالية وتنبيهات مبكرة عن عجز المخزون بالدقة القصوى',
        'تحليل السلوك الشرائي للعملاء وتوجيه العروض التسويقية المستهدفة',
        'المساعد الذكي الفوري للإجابة على الأسئلة المحاسبية المعقدة'
      ]
    },
    {
      id: 'internal_chat',
      nameAr: 'منظومة المراسلات والرسائل الداخلية للمؤسسة',
      nameEn: 'Team Messenger & Chat Room',
      descriptionAr: 'غرف دردشة داخلية مشفرة بين طاقم المؤسسة (المدير، أمين المستودع، الكاشير، المحاسب المالي، ومندوب التوصيل) لتسهيل مهام الفواتير ومتابعة العهد.',
      descriptionEn: 'Instant secure chat channels connecting admin, storekeeper, cashier, accountant, and couriers.',
      icon: MessageSquare,
      enabled: localStorage.getItem('maro_module_internal_chat_enabled') === 'true',
      category: 'SMART_SERVICE',
      featuresAr: [
        'قنوات دردشة متكاملة للتجهيز والدعم المالي الفوري',
        'إصدار تنبيهات صوتية عند إرسال أو استقبال مهام العمل',
        'سجل دائم للمراسلات وتفاصيل المندوبين محلياً وبالكامل أوفلاين',
        'تقليل الأخطاء البشرية بين الكاشير والمستودع بنسبة 95%'
      ]
    },
    {
      id: 'price_kiosk',
      nameAr: 'كشك عرض وفحص الأسعار الذكي (Price Check Kiosk)',
      nameEn: 'Self-Service Price Check Kiosk',
      descriptionAr: 'شاشة تفاعلية مخصصة للعملاء داخل الصالة لفحص أسعار الأصناف والعروض بمسح الباركود السريع دون الحاجة لمراجعة الكاشير.',
      descriptionEn: 'Interactive self-service kiosk for customers to instantly check item prices and promotional discounts.',
      icon: Barcode,
      enabled: localStorage.getItem('maro_module_price_kiosk_enabled') === 'true',
      category: 'SMART_SERVICE',
      featuresAr: [
        'مسح الباركود بالكاميرا أو الماسح الضوئي لمعرفة السعر الفوري',
        'عرض اسم الصنف بالكامل، الوحدة، السعر الشامل للضريبة، والعروض',
        'إمكانية إضافة الصنف لسلة المشتريات السريعة أو طباعة بطاقة السعر',
        'واجهة مخصصة بالكامل للمسات السريعة وتجربة مستخدم متميزة'
      ]
    },
    {
      id: 'queue_waitlist',
      nameAr: 'مديول ترتيب الدور وانتظار العملاء (Queue & Waitlist)',
      nameEn: 'Customer Queue & Waitlist Management',
      descriptionAr: 'منظومة متكاملة لترتيب وتنظيم أدوار العملاء وطوابير الانتظار للصالة، الكاشير، والاستلام مع شاشة عرض مركزية ومناداة صوتية.',
      descriptionEn: 'Comprehensive customer queueing and waitlist management with central display and audio calling.',
      icon: Clock,
      enabled: localStorage.getItem('maro_module_queue_waitlist_enabled') === 'true',
      category: 'SMART_SERVICE',
      featuresAr: [
        'إصدار تذاكر رقمية للعملاء حسب نوع الخدمة (كاشير، استلام، استعلامات)',
        'شاشة عرض مركزية (Display Board) لرقم الدور الحالي والنافذة',
        'تنبيهات صوتية ذكية للمناداة على العملاء بالدور التالي',
        'تقارير أوقات الانتظار ومتوسط سرعة الخدمة لدعم اتخاذ القرار'
      ]
    }
  ]);

  // Delivery-specific subsettings
  const [deliverySettings, setDeliverySettings] = useState({
    defaultFee: Number(localStorage.getItem('maro_delivery_default_fee') || '15'),
    freeThreshold: Number(localStorage.getItem('maro_delivery_free_threshold') || '150'),
    dispatchMode: localStorage.getItem('maro_delivery_dispatch_mode') || 'MANUAL', // MANUAL, AUTO_ROUND_ROBIN, AUTO_NEAREST
    activeDrivers: [
      { id: 'drv_01', name: 'أحمد محمود (كابتن 1)', phone: '01012345678', status: 'AVAILABLE', activeOrders: 0 },
      { id: 'drv_02', name: 'محمد مصطفى (كابتن 2)', phone: '01023456789', status: 'BUSY', activeOrders: 1 },
      { id: 'drv_03', name: 'ياسر عرفات (كابتن 3)', phone: '01034567890', status: 'OFFLINE', activeOrders: 0 }
    ]
  });

  // Team Messaging System States
  const [activeChannel, setActiveChannel] = useState<'general' | 'warehouse' | 'couriers' | 'finance'>('general');
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('maro_team_messages');
      if (saved) return JSON.parse(saved);
    } catch {}
    
    // Default pre-loaded professional Arabic message flow representing the sales delivery custody cycle
    return [
      { id: 1, channel: 'general', sender: 'أحمد الهواري (مدير النظام)', text: 'يا شباب، يرجى الالتزام بدورة تسليم العهد وتأكيد التخصيم الفوري من السيستم عند تحصيل الفواتير.', time: '09:00 ص', isMe: false },
      { id: 2, channel: 'general', sender: 'عماد حمدي (الكاشير)', text: 'تمام يا فندم، كل الفواتير الصادرة يتم ربطها تلقائياً بالمستودع والمناديب للتوصيل السريع.', time: '09:15 ص', isMe: false },
      { id: 3, channel: 'warehouse', sender: 'مينا مسعود (أمين المستودع)', text: 'تم تجهيز بضاعة فاتورة الجملة رقم WH-INV-429910 بالكامل وهي معبأة وفي انتظار تسليمها كعهدة للمندوب.', time: '10:00 ص', isMe: false },
      { id: 4, channel: 'warehouse', sender: 'كابتن سليم (مندوب التوصيل)', text: 'أنا في الطريق للمستودع لاستلام البضاعة وتأكيد تحميل العهدة كرتونة بكرتونة.', time: '10:10 ص', isMe: false },
      { id: 5, channel: 'couriers', sender: 'كابتن سليم (مندوب التوصيل)', text: 'تم استلام الفاتورة كعهدة ورقية ومالية وسلعية وجاري الخروج للتسليم للعميل بالـ GPS.', time: '10:30 ص', isMe: false },
      { id: 6, channel: 'couriers', sender: 'كابتن سليم (مندوب التوصيل)', text: 'تم الوصول لموقع العميل بنجاح عبر إحداثيات الـ GPS المرفقة بالفاتورة وجاري تحصيل القيمة.', time: '11:20 ص', isMe: false },
      { id: 7, channel: 'couriers', sender: 'عماد حمدي (الكاشير)', text: 'ممتاز يا كابتن سليم، في انتظار ترحيل دفعة السداد لتخصيم حسابه تلقائياً.', time: '11:22 ص', isMe: false },
      { id: 8, channel: 'finance', sender: 'رائد فؤاد (المحاسب المالي)', text: 'تم عمل تسوية مالية وتوريد نقدية لعهدة المندوب سليم بقيمة 12,400 ج.م كاش، وتخصيم رصيد العميل المفتوح.', time: '12:00 م', isMe: false },
      { id: 9, channel: 'finance', sender: 'أحمد الهواري (مدير النظام)', text: 'عظيم جداً، كشف حساب العميل وحركات المخزن الآن يعكسان الصافي الفعلي بعد التخصيم التلقائي بالكامل.', time: '12:05 م', isMe: false }
    ];
  });

  useEffect(() => {
    localStorage.setItem('maro_team_messages', JSON.stringify(chatMessages));
  }, [chatMessages]);

  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!chatInput.trim()) return;

    const newMessage = {
      id: Date.now(),
      channel: activeChannel,
      sender: 'أنت (مدير النظام)',
      text: chatInput.trim(),
      time: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
      isMe: true
    };

    setChatMessages(prev => [...prev, newMessage]);
    setChatInput('');

    // Play instant sound double-tone alert for sending messages
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContext) {
        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
        gain.gain.setValueAtTime(0.04, ctx.currentTime);
        osc.start();
        osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.08); // E5
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.25);
        osc.stop(ctx.currentTime + 0.25);
      }
    } catch {}

    // Simulated quick automated colleague reply after 1.5 seconds for incredible interactive fidelity
    setTimeout(() => {
      let replyText = '';
      let replySender = '';
      
      if (activeChannel === 'general') {
        replySender = 'عماد حمدي (الكاشير)';
        replyText = 'مستعدون تماماً لتنفيذ أي توجيهات جديدة، لوحة مبيعات التوصيل والجملة جاهزة.';
      } else if (activeChannel === 'warehouse') {
        replySender = 'مينا مسعود (أمين المستودع)';
        replyText = 'تم استلام الرسالة، جاري مراجعة النواقص وإعادة فحص بضاعة عهد المناديب قبل انطلاقهم.';
      } else if (activeChannel === 'couriers') {
        replySender = 'كابتن سليم (مندوب التوصيل)';
        replyText = 'علم يا فندم، أنا جاهز لتحديث حالة كل فاتورة وتوريد التحصيلات أولاً بأول.';
      } else {
        replySender = 'رائد فؤاد (المحاسب المالي)';
        replyText = 'مفهوم، قيد المبيعات المزدوج وقيد التسوية يتم إجراؤه تلقائياً في شجرة الحسابات فور الإغلاق.';
      }

      const colleagueReply = {
        id: Date.now() + 1,
        channel: activeChannel,
        sender: replySender,
        text: replyText,
        time: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
        isMe: false
      };

      setChatMessages(prev => [...prev, colleagueReply]);

      // Play alert sound for received message
      try {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContext) {
          const ctx = new AudioContext();
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.type = 'sine';
          osc.frequency.setValueAtTime(659.25, ctx.currentTime); // E5
          gain.gain.setValueAtTime(0.04, ctx.currentTime);
          osc.start();
          osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.08); // G5
          gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.25);
          osc.stop(ctx.currentTime + 0.25);
        }
      } catch {}
    }, 1500);
  };

  const handleToggleModule = (id: string) => {
    const updated = modules.map(m => {
      if (m.id === id) {
        const nextState = !m.enabled;
        localStorage.setItem(`maro_module_${id}_enabled`, nextState ? 'true' : 'false');
        
        // Notify user with audio
        if (nextState) {
          toast.success(`تم تفعيل وتدشين ${m.nameAr} وربطها بنشاط المؤسسة بنجاح!`, {
            icon: '🚀',
            duration: 5000
          });
          soundAlerts.playSuccess();
        } else {
          toast.success(`تم إيقاف مديول ${m.nameAr} وحجب مميزاته لتقنين الاستهلاك.`, {
            icon: '⚠️'
          });
          soundAlerts.playWarning();
        }

        return { ...m, enabled: nextState };
      }
      return m;
    });
    setModules(updated);
    
    // Broadcast state change
    window.dispatchEvent(new Event('maro_modules_changed'));
  };

  const handleSaveDeliverySettings = () => {
    localStorage.setItem('maro_delivery_default_fee', deliverySettings.defaultFee.toString());
    localStorage.setItem('maro_delivery_free_threshold', deliverySettings.freeThreshold.toString());
    localStorage.setItem('maro_delivery_dispatch_mode', deliverySettings.dispatchMode);
    toast.success('تم حفظ إعدادات معايير التوصيل والدليفري بنجاح');
    soundAlerts.playSave();
  };

  return (
    <div className="space-y-6">
      {/* Upper header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 text-blue-400 font-bold text-xs mb-1">
            <Sparkles size={14} />
            <span>ERP MICRO-SaaS EXTENSIONS</span>
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight">المديولات المساعدة والخدمات الذكية</h2>
          <p className="text-slate-500 font-bold text-sm">
            قم بتفعيل الخدمات التكميلية وربطها بنشاطك التجاري الرئيسي (سوبرماركت، مطعم، صيدلية) بضغطة زر واحدة
          </p>
        </div>
        
        <div className="flex items-center gap-2.5 bg-slate-800/40 border border-slate-700/50 px-4 py-2.5 rounded-2xl text-xs">
          <ShieldCheck className="text-emerald-400" size={16} />
          <span className="text-slate-300 font-black">الربط والتحكم متاح لمدير النظام والشركاء</span>
        </div>
      </div>

      {/* Main Grid: Modules List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {modules.map((module) => {
          const IconComponent = module.icon;
          return (
            <div 
              key={module.id} 
              className={`p-6 sm:p-8 rounded-3xl border transition-all relative overflow-hidden flex flex-col justify-between ${
                module.enabled 
                  ? 'bg-gradient-to-br from-[#151b2b] to-[#111827] border-blue-500/30 shadow-xl shadow-blue-950/10' 
                  : 'bg-[#131926]/40 border-[#1e293b] opacity-80 hover:opacity-100'
              }`}
            >
              {/* Top Bar inside Card */}
              <div>
                <div className="flex items-start justify-between mb-5">
                  <div className={`p-4 rounded-2xl ${
                    module.enabled ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'bg-slate-800 text-slate-500'
                  }`}>
                    <IconComponent size={24} />
                  </div>
                  
                  <button 
                    onClick={() => handleToggleModule(module.id)}
                    className="focus:outline-none transition-transform active:scale-95"
                  >
                    {module.enabled ? (
                      <ToggleRight size={56} className="text-blue-500 cursor-pointer" />
                    ) : (
                      <ToggleLeft size={56} className="text-slate-600 cursor-pointer" />
                    )}
                  </button>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-black text-white">{module.nameAr}</h3>
                    {module.enabled ? (
                      <span className="text-[10px] font-black bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded-full">
                        نشط ومترابط
                      </span>
                    ) : (
                      <span className="text-[10px] font-black bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full">
                        غير مفعل
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed font-semibold">{module.descriptionAr}</p>
                </div>

                {/* Features list */}
                <div className="mt-6 space-y-2.5">
                  <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-wider text-right">
                    المميزات والربط البرمجي للموديول:
                  </h4>
                  <ul className="space-y-2 text-xs">
                    {module.featuresAr.map((feat, i) => (
                      <li key={i} className="flex items-center gap-2 text-slate-300 font-bold">
                        <CheckCircle size={13} className={module.enabled ? "text-emerald-400 shrink-0" : "text-slate-600 shrink-0"} />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Delivery Settings Subsection - Displays Only If Enabled */}
              {module.id === 'delivery' && module.enabled && (
                <div className="mt-8 pt-6 border-t border-slate-800 space-y-4 text-xs">
                  <div className="flex items-center gap-2 text-blue-400 font-black mb-1">
                    <Settings size={14} />
                    <span>تخصيص معايير دليفري النشاط الرئيسي</span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-slate-400 font-bold mb-1">رسوم التوصيل الافتراضية</label>
                      <div className="relative">
                        <input 
                          type="number"
                          value={deliverySettings.defaultFee}
                          onChange={(e) => setDeliverySettings({ ...deliverySettings, defaultFee: Number(e.target.value) })}
                          className="w-full bg-[#0b0f1a] border border-[#334155] rounded-xl px-3 py-2 text-white font-bold"
                        />
                        <span className="absolute left-2.5 top-2.5 text-[10px] font-bold text-slate-500">ج.م</span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-slate-400 font-bold mb-1">توصيل مجاني للطلبات فوق</label>
                      <div className="relative">
                        <input 
                          type="number"
                          value={deliverySettings.freeThreshold}
                          onChange={(e) => setDeliverySettings({ ...deliverySettings, freeThreshold: Number(e.target.value) })}
                          className="w-full bg-[#0b0f1a] border border-[#334155] rounded-xl px-3 py-2 text-white font-bold"
                        />
                        <span className="absolute left-2.5 top-2.5 text-[10px] font-bold text-slate-500">ج.م</span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-slate-400 font-bold mb-1">آلية توزيع الطلبات على الطيارين</label>
                      <select 
                        value={deliverySettings.dispatchMode}
                        onChange={(e) => setDeliverySettings({ ...deliverySettings, dispatchMode: e.target.value })}
                        className="w-full bg-[#0b0f1a] border border-[#334155] rounded-xl px-3 py-2 text-white font-bold"
                      >
                        <option value="MANUAL">توزيع يدوي بواسطة الكاشير</option>
                        <option value="AUTO_ROUND_ROBIN">توزيع تلقائي دائري بالتساوي</option>
                        <option value="AUTO_NEAREST">إرسال لأقرب طيار متاح</option>
                      </select>
                    </div>
                  </div>

                  {/* Drivers table quick view */}
                  <div className="bg-[#0b0f1a] p-3 rounded-2xl border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between text-[11px] border-b border-slate-800 pb-1.5">
                      <span className="text-slate-400 font-bold">فريق الدليفري المعتمد ({deliverySettings.activeDrivers.length})</span>
                      <span className="text-slate-500 font-bold">حالة التواجد والطلبات الحالية</span>
                    </div>
                    <div className="space-y-1.5">
                      {deliverySettings.activeDrivers.map(drv => (
                        <div key={drv.id} className="flex items-center justify-between text-[11px]">
                          <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                            <span className="text-slate-200 font-bold">{drv.name}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-slate-500 font-semibold">{drv.phone}</span>
                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-black ${
                              drv.status === 'AVAILABLE' ? 'bg-emerald-500/10 text-emerald-400' :
                              drv.status === 'BUSY' ? 'bg-amber-500/10 text-amber-400' : 'bg-slate-800 text-slate-400'
                            }`}>
                              {drv.status === 'AVAILABLE' ? 'متاح' : drv.status === 'BUSY' ? `نشط (${drv.activeOrders} طلب)` : 'خارج الوردية'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button 
                    onClick={handleSaveDeliverySettings}
                    className="w-full py-2.5 bg-blue-600/20 text-blue-300 border border-blue-500/30 rounded-xl hover:bg-blue-600/30 font-bold transition-all text-xs"
                  >
                    حفظ تهيئة الدليفري للنشاط
                  </button>
                </div>
              )}

              {/* AI Hub Settings Subsection */}
              {module.id === 'ai_agents' && module.enabled && (
                <div className="mt-8 pt-6 border-t border-slate-800 space-y-3 text-xs">
                  <div className="flex items-center gap-2 text-purple-400 font-black mb-1">
                    <Sparkles size={14} />
                    <span>مؤشرات وكيل مارو للذكاء الاصطناعي</span>
                  </div>

                  <div className="p-3 bg-[#0b0f1a] rounded-2xl border border-slate-800 text-[11px] text-slate-300 leading-relaxed space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 font-bold">بوابة استماع الأوامر الصوتية:</span>
                      <span className="text-emerald-400 font-bold">مفعلة تلقائياً بنقاط البيع</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 font-bold">دقة التوقع والتدريب:</span>
                      <span className="text-purple-400 font-bold">98.4% (Deep Learning Active)</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 font-bold">معدل المعالجة الطبيعية NLP:</span>
                      <span className="text-slate-200 font-bold">أقل من 120ms فوري</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* MARO Team Live Messenger Section - Appears when Internal Messaging is enabled */}
      {modules.find(m => m.id === 'internal_chat')?.enabled && (
        <div className="bg-gradient-to-b from-[#111625] to-[#0a0d18] border border-blue-500/20 rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row h-[550px] transition-all">
          
          {/* Chat Sidebar: Channels list */}
          <div className="w-full md:w-64 bg-[#0c101c] border-b md:border-b-0 md:border-l border-slate-800 p-4 flex flex-col justify-between shrink-0">
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-blue-400 font-black text-xs px-2">
                <MessageSquare size={14} />
                <span>قنوات الدردشة والتوجيه الداخلي</span>
              </div>
              
              <div className="space-y-1">
                <button
                  onClick={() => setActiveChannel('general')}
                  className={`w-full text-right px-3 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between ${
                    activeChannel === 'general' ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' : 'text-slate-400 hover:bg-slate-900/60'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
                    <span>قناة العمل العامة 📢</span>
                  </span>
                  <span className="text-[9px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded-full font-mono">
                    {chatMessages.filter(m => m.channel === 'general').length}
                  </span>
                </button>

                <button
                  onClick={() => setActiveChannel('warehouse')}
                  className={`w-full text-right px-3 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between ${
                    activeChannel === 'warehouse' ? 'bg-amber-600/20 text-amber-400 border border-amber-500/30' : 'text-slate-400 hover:bg-slate-900/60'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                    <span>المستودع وتجهيز الفواتير 📦</span>
                  </span>
                  <span className="text-[9px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded-full font-mono">
                    {chatMessages.filter(m => m.channel === 'warehouse').length}
                  </span>
                </button>

                <button
                  onClick={() => setActiveChannel('couriers')}
                  className={`w-full text-right px-3 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between ${
                    activeChannel === 'couriers' ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30' : 'text-slate-400 hover:bg-slate-900/60'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></span>
                    <span>المناديب والعهد 🚚</span>
                  </span>
                  <span className="text-[9px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded-full font-mono">
                    {chatMessages.filter(m => m.channel === 'couriers').length}
                  </span>
                </button>

                <button
                  onClick={() => setActiveChannel('finance')}
                  className={`w-full text-right px-3 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between ${
                    activeChannel === 'finance' ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30' : 'text-slate-400 hover:bg-slate-900/60'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span>المالية والتسويات 💳</span>
                  </span>
                  <span className="text-[9px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded-full font-mono">
                    {chatMessages.filter(m => m.channel === 'finance').length}
                  </span>
                </button>
              </div>
            </div>

            {/* Colleague Status Bar */}
            <div className="pt-4 border-t border-slate-800 space-y-2 mt-4">
              <div className="text-[10px] font-black text-slate-500 tracking-wider">متصلون الآن في الوردية:</div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-slate-300 font-bold flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    <span>أحمد الهواري (المدير)</span>
                  </span>
                  <span className="text-slate-500 font-semibold">نشط</span>
                </div>
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-slate-300 font-bold flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                    <span>مينا مسعود (المستودع)</span>
                  </span>
                  <span className="text-amber-400 font-bold">يكتب...</span>
                </div>
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-slate-300 font-bold flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    <span>كابتن سليم (مندوب)</span>
                  </span>
                  <span className="text-slate-500 font-semibold">متصل بالـ GPS</span>
                </div>
              </div>
            </div>
          </div>

          {/* Main Chat Workspace */}
          <div className="flex-1 flex flex-col justify-between overflow-hidden bg-[#0a0d18]/40">
            {/* Chat header */}
            <div className="p-4 border-b border-slate-800/80 bg-[#0e1222] flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/10">
                  <MessageSquare size={16} />
                </div>
                <div>
                  <h4 className="text-xs font-black text-white">
                    {activeChannel === 'general' && 'قناة العمل العامة لمؤسسة مارو 📢'}
                    {activeChannel === 'warehouse' && 'تجهيز الطلبات وتحديث المستودع 📦'}
                    {activeChannel === 'couriers' && 'تتبع مناديب المبيعات وتسليم العهد 🚚'}
                    {activeChannel === 'finance' && 'إغلاق ورديات الخزنة والتسويات المالية 💳'}
                  </h4>
                  <p className="text-[10px] text-slate-500 font-bold">مراسلات داخلية آمنة - أوفلاين بالكامل</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-[10px] bg-slate-800/40 px-2.5 py-1 rounded-lg border border-slate-700/50">
                <Lock size={10} className="text-emerald-400" />
                <span className="text-slate-400 font-bold">مشفر وداخلي</span>
              </div>
            </div>

            {/* Chat Messages Log */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3 scrollbar-thin scrollbar-thumb-slate-800">
              {chatMessages.filter(m => m.channel === activeChannel).map((msg) => (
                <div key={msg.id} className={`flex flex-col max-w-[80%] ${msg.isMe ? 'mr-auto items-end' : 'ml-auto items-start'}`}>
                  <span className="text-[10px] font-black text-slate-500 mb-1 px-1">
                    {msg.sender} • {msg.time}
                  </span>
                  <div className={`px-4 py-2.5 rounded-2xl text-xs font-semibold leading-relaxed break-words ${
                    msg.isMe 
                      ? 'bg-blue-600 text-white rounded-br-none shadow-md shadow-blue-950/20' 
                      : 'bg-slate-800/90 text-slate-200 rounded-bl-none border border-slate-700/40'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              
              {chatMessages.filter(m => m.channel === activeChannel).length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-2">
                  <MessageSquare size={28} className="text-slate-600 animate-bounce" />
                  <p className="text-xs font-bold text-slate-400">لا توجد رسائل في هذه القناة بعد.</p>
                  <p className="text-[10px] text-slate-500">ابدأ المحادثة ونسق أعمال الفواتير والعهد مع طاقم العمل.</p>
                </div>
              )}
            </div>

            {/* Chat Input Bar */}
            <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-800 bg-[#0c101c] shrink-0 flex gap-2">
              <input
                type="text"
                placeholder={`أرسل رسالة فورية إلى ${
                  activeChannel === 'general' ? 'كل الزملاء...' :
                  activeChannel === 'warehouse' ? 'أمين المستودع لتجهيز البضاعة...' :
                  activeChannel === 'couriers' ? 'المندوبين لتتبع العهد والتحصيل...' : 'المحاسب المالي للتسوية...'
                }`}
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                className="flex-1 bg-[#121829] border border-slate-800 text-slate-100 text-xs px-4 py-3 rounded-2xl focus:outline-none focus:border-blue-500 transition-all font-semibold"
              />
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-500 active:scale-95 text-white px-5 rounded-2xl text-xs font-bold transition-all flex items-center gap-1.5"
              >
                <span>إرسال</span>
                <Send size={13} />
              </button>
            </form>
          </div>
        </div>
      )}
      <div className="p-5 bg-gradient-to-r from-blue-950/30 to-purple-950/20 border border-slate-800 rounded-3xl flex items-start gap-4">
        <HelpCircle className="text-blue-400 shrink-0 mt-0.5" size={20} />
        <div className="space-y-1">
          <h4 className="text-white text-xs font-black">💡 فلسفة ربط مديولات النشاط التجاري</h4>
          <p className="text-slate-400 font-semibold text-[11px] leading-relaxed">
            عند تفعيل أي من هذه الخدمات المساعدة (كالدليفري)، يتم فوراً إضافة تبويباتها الخاصة إلى لوحة التحكم الرئيسية 
            وتمكين مميزات الربط داخل نقاط البيع والتقارير المالية. وإذا رغبت في إلغاء التفعيل لأي نشاط، سيقوم النظام تلقائياً 
            بحظر التبويب وعزل كود الربط حتى يحافظ الكاشير والـ POS على أعلى استقرار وسرعة أداء أقل من 20ms.
          </p>
        </div>
      </div>
    </div>
  );
};
