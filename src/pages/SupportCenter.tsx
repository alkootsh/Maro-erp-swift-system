/**
 * @file SupportCenter.tsx
 * @module واجهات وصفحات النظام (UI Pages)
 * @description ملف جزء من نظام MARO ERP. الوظيفة: SupportCenter.tsx.
 */
import React, { useState } from 'react';
import { 
  Headphones, MessageSquare, Bot, Sparkles, Send, CheckCircle2, 
  AlertTriangle, Clock, UserCheck, Layers, FileText, Search, 
  RefreshCw, Shield, HelpCircle, PhoneCall, ArrowUpRight, Cpu
} from 'lucide-react';
import { cn } from '../lib/utils';
import { toast } from 'react-hot-toast';

interface SupportTicket {
  id: string;
  ticketNumber: string;
  clientName: string;
  companyName: string;
  department: 'TECHNICAL' | 'FINANCE' | 'POS_HARDWARE' | 'VAT_ZATCA' | 'CUSTOM_DEV';
  issueSubject: string;
  status: 'AI_RESOLVED' | 'PENDING_AGENT' | 'IN_PROGRESS' | 'CLOSED';
  priority: 'LOW' | 'MEDIUM' | 'URGENT' | 'CRITICAL';
  createdAt: string;
  lastMessage: string;
  channel: 'WHATSAPP_BOT' | 'PLATFORM_PORTAL' | 'EMAIL' | 'PHONE';
}

interface WhatsAppMessage {
  id: string;
  sender: 'user' | 'ai_bot' | 'agent';
  text: string;
  timestamp: string;
}

export const SupportCenter: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'copilot' | 'whatsapp_bot' | 'tickets' | 'kb'>('whatsapp_bot');

  // Tickets state
  const [tickets, setTickets] = useState<SupportTicket[]>([
    {
      id: 't_1',
      ticketNumber: 'TICK-9082',
      clientName: 'أحمد ممدوح',
      companyName: 'مؤسسة السعادة للتجارة',
      department: 'POS_HARDWARE',
      issueSubject: 'تعذر طباعة الفاتورة على طابعة الحراريه EPSON TM-T20',
      status: 'AI_RESOLVED',
      priority: 'URGENT',
      createdAt: '2026-08-14 10:15',
      lastMessage: 'قام بوت الويسبر بالتعرف على الكود وأرسل كود تعريف الطابعة وتم حل المشكلة بنجاح.',
      channel: 'WHATSAPP_BOT'
    },
    {
      id: 't_2',
      ticketNumber: 'TICK-9083',
      clientName: 'سارة عبد الله',
      companyName: 'صيدليات الشفاء الكبرى',
      department: 'VAT_ZATCA',
      issueSubject: 'خطأ في توقيع الـ XML لفاتورة المرحلة الثانية لهيئة الزكاة',
      status: 'IN_PROGRESS',
      priority: 'CRITICAL',
      createdAt: '2026-08-14 11:30',
      lastMessage: 'تم تحويل التذكرة إلى قسم الأمن السيبراني وربط ZATCA للمراجعة.',
      channel: 'PLATFORM_PORTAL'
    },
    {
      id: 't_3',
      ticketNumber: 'TICK-9084',
      clientName: 'محمد الشيخ',
      companyName: 'شركة النور للمقاولات',
      department: 'FINANCE',
      issueSubject: 'استفسار حول طريقة إقفال السنة المالية وترحيل الأرصدة',
      status: 'PENDING_AGENT',
      priority: 'MEDIUM',
      createdAt: '2026-08-14 12:00',
      lastMessage: 'أهلاً بك، تم استلام استفسارك وسيتم الرد من قبل المحاسب القانوني خلال دقائق.',
      channel: 'WHATSAPP_BOT'
    }
  ]);

  // WhatsApp Bot Simulator State
  const [whatsappChat, setWhatsappChat] = useState<WhatsAppMessage[]>([
    { id: 'w_1', sender: 'user', text: 'السلام عليكم، عندي مشكلة في ربط الباركود على شاشة POS وسعر المنتج لا يظهر تلقائياً.', timestamp: '10:30 ص' },
    { id: 'w_2', sender: 'ai_bot', text: 'وعليكم السلام أخي الكريم 👋! معك مساعد MARO الذكي للدعم الفني. بناءً على كود الخطأ الشائع، غالباً ما تكون المشكلة في إعدادات الماسح الضوئي (Barcode Scanner Mode - HID/COM). هل قمت بتفعيل قارئ الباركود على وضع USB HID Keyboard؟', timestamp: '10:30 ص' },
    { id: 'w_3', sender: 'user', text: 'جربت أفعله بس لسه الباركود بيقرا الحروف ناقصة.', timestamp: '10:32 ص' },
    { id: 'w_4', sender: 'ai_bot', text: 'فهمت عليك! هذه المشكلة تحدث غالباً بسبب سرعة تدفق لوحة المفاتيح (Inter-character delay). قمت بإنشاء تذكرة رقم #TICK-9085 وتحويلها فوراً إلى **قسم الهاردوير ونقاط البيع**. مهندس الصيانة أحمد متصل الآن وسيتواصل معك خلال دقيقة عبر هذا الواتساب لحل المشكلة نهائياً 🛠️.', timestamp: '10:32 ص' }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isAiThinking, setIsAiThinking] = useState(false);

  // Copilot AI Test State
  const [copilotQuery, setCopilotQuery] = useState('');
  const [copilotResult, setCopilotResult] = useState<string | null>(null);

  const handleSendWhatsapp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    const userMsg: WhatsAppMessage = {
      id: 'w_' + Date.now(),
      sender: 'user',
      text: inputMessage,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setWhatsappChat(prev => [...prev, userMsg]);
    const queryText = inputMessage;
    setInputMessage('');
    setIsAiThinking(true);

    setTimeout(() => {
      let botReplyText = 'شكراً لتواصلك مع دعم MARO ERP. لقد قمنا بتحليل استفسارك آلياً وجاري تطبيق الحل المناسب.';
      
      if (queryText.includes('فاتورة') || queryText.includes('ضريبة')) {
        botReplyText = '📊 بالنسبة لإعدادات الفواتير والضرائب، يمكنك تعديل نسبة ضريبة القيمة المضافة من (إعدادات النظام > الضرائب والفواتير). هل ترغب في إرسال فيديو توضيحي؟';
      } else if (queryText.includes('مخزن') || queryText.includes('صنف')) {
        botReplyText = '📦 لتعديل حد الأمان للمخزون والأصناف، انتقل إلى شاشة (المخزن والمستودعات > حد الطلب)، أو يمكنك طلب تقرير النواقص الفوري.';
      } else {
        botReplyText = '🤖 لقد استلمت استفسارك وحاولت إيجاد حل في قاعدة المعارف، ونظراً لأهمية الطلب، قمت بتحويله إلى **قسم الدعم الفني المتقدم** وسيتصل بك المهندس المختص فوراً.';
      }

      const botMsg: WhatsAppMessage = {
        id: 'w_bot_' + Date.now(),
        sender: 'ai_bot',
        text: botReplyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setWhatsappChat(prev => [...prev, botMsg]);
      setIsAiThinking(false);
    }, 1500);
  };

  const handleCopilotDiagnose = (e: React.FormEvent) => {
    e.preventDefault();
    if (!copilotQuery.trim()) return;

    setCopilotResult('جاري تحليل السجلات (Logs)، وفحص قاعدة البيانات والذكاء الاصطناعي...');
    setTimeout(() => {
      setCopilotResult(`🔍 **نتيجة التحليل الذكي للخطأ:**
- **سبب المشكلة المكتشف:** انقطاع مؤقت في مزامنة الـ IndexedDB المحلي مع قاعدة بيانات PostgreSQL المركزية بسبب بطء الاتصال بالإنترنت.
- **الحل المقترح الفوري:** 
  1. اضغط على زر "مزامنة يدوية فورية" من الشريط العلوي.
  2. تأكد من عمل سيرفر العقدة (Node Server) على البورت 3000.
  3. تم إنشاء قيد تدقيق (Audit Log) تلقائي بالعملية.`);
    }, 1200);
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="bg-[#151b2b] p-8 rounded-3xl border border-[#1e293b] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider mb-1">
            <Headphones size={16} />
            <span>نظام الدعم الفني الاحترافي الذكي (AI & WhatsApp Helpdesk Center v4.0)</span>
          </div>
          <h1 className="text-2xl font-black text-white">مركز الدعم الفني الآلي وبوت واتساب الذكي للرد الفوري</h1>
          <p className="text-slate-400 text-xs mt-1">
            دعم فني يعمل على مدار الساعة بالذكاء الاصطناعي، تشخيص الأخطاء آلياً، بوت واتساب للتفاعل الفوري، وتحويل الذكي للقسم المختص.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-2xl text-xs font-bold flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>بوت واتساب متصل وجاهز (+20 100 MARO SUP)</span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-[#1e293b] pb-3 overflow-x-auto">
        <button
          onClick={() => setActiveTab('whatsapp_bot')}
          className={cn(
            "px-5 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap",
            activeTab === 'whatsapp_bot' ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30" : "bg-[#151b2b] text-slate-400 hover:text-white border border-[#1e293b]"
          )}
        >
          <MessageSquare size={16} />
          <span>محاكي بوت واتساب الذكي (WhatsApp Bot Simulator)</span>
        </button>
        <button
          onClick={() => setActiveTab('copilot')}
          className={cn(
            "px-5 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap",
            activeTab === 'copilot' ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30" : "bg-[#151b2b] text-slate-400 hover:text-white border border-[#1e293b]"
          )}
        >
          <Bot size={16} />
          <span>المساعد الذكي لتشخيص الأخطاء (AI Diagnostic Copilot)</span>
        </button>
        <button
          onClick={() => setActiveTab('tickets')}
          className={cn(
            "px-5 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap",
            activeTab === 'tickets' ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30" : "bg-[#151b2b] text-slate-400 hover:text-white border border-[#1e293b]"
          )}
        >
          <Layers size={16} />
          <span>إدارة التذاكر والتحويل الآلي ({tickets.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('kb')}
          className={cn(
            "px-5 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap",
            activeTab === 'kb' ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30" : "bg-[#151b2b] text-slate-400 hover:text-white border border-[#1e293b]"
          )}
        >
          <FileText size={16} />
          <span>قاعدة المعارف والدعم الذاتي (Knowledge Base)</span>
        </button>
      </div>

      {/* Tab 1: WhatsApp Bot Simulator */}
      {activeTab === 'whatsapp_bot' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-[#151b2b] p-6 rounded-3xl border border-[#1e293b] flex flex-col h-[600px]">
            <div className="flex items-center justify-between pb-4 border-b border-[#1e293b]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-600/20 text-emerald-400 flex items-center justify-center font-black">
                  WA
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">بوت واتساب MARO ERP الآلي</h3>
                  <p className="text-[11px] text-emerald-400">متصل الآن • يرد فوراً على الاستفسارات والمشاكل</p>
                </div>
              </div>
              <div className="text-xs text-slate-400">
                رقم البوت: <strong className="text-white">+20 100 555 MARO</strong>
              </div>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-2">
              {whatsappChat.map(msg => (
                <div key={msg.id} className={cn("flex flex-col", msg.sender === 'user' ? "items-end" : "items-start")}>
                  <div className="flex items-center gap-1 text-[10px] text-slate-500 mb-1">
                    <span>{msg.sender === 'user' ? 'العميل' : msg.sender === 'ai_bot' ? 'بوت الذكاء الاصطناعي' : 'مهندس الدعم'}</span>
                    <span>• {msg.timestamp}</span>
                  </div>
                  <div className={cn(
                    "p-4 rounded-2xl text-xs max-w-[85%] leading-relaxed",
                    msg.sender === 'user' ? "bg-indigo-600 text-white rounded-br-none" : "bg-[#0f172a] text-slate-200 border border-[#1e293b] rounded-bl-none"
                  )}>
                    {msg.text}
                  </div>
                </div>
              ))}

              {isAiThinking && (
                <div className="flex items-center gap-2 text-xs text-indigo-400 bg-[#0f172a] p-3 rounded-2xl w-fit border border-[#1e293b]">
                  <RefreshCw size={14} className="animate-spin" />
                  <span>البوت الذكي يكتب الرد ويقوم بفحص قاعدة البيانات...</span>
                </div>
              )}
            </div>

            {/* Input Form */}
            <form onSubmit={handleSendWhatsapp} className="pt-4 border-t border-[#1e293b] flex items-center gap-2">
              <input
                type="text"
                placeholder="اكتب رسالتك أو مشكلتك هنا لتجربة رد البوت الآلي..."
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                className="flex-1 p-3 bg-[#0f172a] border border-[#1e293b] rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500"
              />
              <button
                type="submit"
                className="px-5 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-emerald-900/30 flex items-center gap-2"
              >
                <Send size={16} />
                <span>إرسال</span>
              </button>
            </form>
          </div>

          <div className="space-y-6">
            <div className="bg-[#151b2b] p-6 rounded-3xl border border-[#1e293b] space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Sparkles size={16} className="text-indigo-400" />
                <span>كيف يعمل بوت واتساب الذكي؟</span>
              </h3>
              <div className="space-y-3 text-xs text-slate-400 leading-relaxed">
                <div className="p-3 bg-[#0f172a] rounded-2xl border border-[#1e293b]">
                  <strong className="text-white block mb-1">1. الاستقبال والرد الفوري</strong>
                  يستقبل الرسائل على مدار الساعة ويطابقها مع آلاف الأخطاء والحلول المسجلة في النظام.
                </div>
                <div className="p-3 bg-[#0f172a] rounded-2xl border border-[#1e293b]">
                  <strong className="text-white block mb-1">2. محاولة الإصلاح الذاتي</strong>
                  يقوم البوت بإرسال خطوات الإصلاح، أو الأكواد التعريفية، أو روابط الفيديوهات التعليمية للعميل.
                </div>
                <div className="p-3 bg-[#0f172a] rounded-2xl border border-[#1e293b]">
                  <strong className="text-white block mb-1">3. التحويل الذكي للقسم المختص</strong>
                  إذا تعذر الحل الآلي، ينشئ تذكرة دعم فني ويصنفها (هاردوير، زاتكا، محاسبة) ويقوم بتنبيه المهندس المناوب.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: AI Diagnostic Copilot */}
      {activeTab === 'copilot' && (
        <div className="bg-[#151b2b] p-8 rounded-3xl border border-[#1e293b] max-w-4xl mx-auto space-y-6 shadow-2xl">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Bot size={20} className="text-indigo-400" />
              <span>المساعد الذكي لتشخيص أعطال وأخطاء النظام (AI Error Diagnostic Copilot)</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              اكتب وصف المشكلة أو كود الخطأ (Error Code) وسيقوم الذكاء الاصطناعي بتحليله وإيجاد الحل الجذري فوراً.
            </p>
          </div>

          <form onSubmit={handleCopilotDiagnose} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1">وصف الخطأ أو المشكلة التشغيلية</label>
              <textarea
                rows={3}
                required
                placeholder="مثال: ظهور خطأ 500 عند حفظ فاتورة مبيعات في نقطة البيع أو توقف تزامن الباركود..."
                value={copilotQuery}
                onChange={(e) => setCopilotQuery(e.target.value)}
                className="w-full p-4 bg-[#0f172a] border border-[#1e293b] rounded-2xl text-white text-xs focus:outline-none focus:border-indigo-500 resize-none"
              ></textarea>
            </div>
            <button
              type="submit"
              className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-900/30 transition-all flex items-center gap-2"
            >
              <Sparkles size={16} />
              <span>فحص وتشخيص بالذكاء الاصطناعي</span>
            </button>
          </form>

          {copilotResult && (
            <div className="p-6 bg-[#0f172a] rounded-2xl border border-indigo-500/30 text-xs text-slate-200 leading-relaxed space-y-3">
              <div className="font-bold text-indigo-400 flex items-center gap-2">
                <CheckCircle2 size={16} />
                <span>تقرير التشخيص والحل المقترح:</span>
              </div>
              <div className="whitespace-pre-line">{copilotResult}</div>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Tickets & Routing */}
      {activeTab === 'tickets' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-[#151b2b] p-5 rounded-2xl border border-[#1e293b]">
              <div className="text-xs font-bold text-slate-500 uppercase">إجمالي التذاكر النشطة</div>
              <div className="text-2xl font-black text-white mt-1">{tickets.length} تذكرة</div>
            </div>
            <div className="bg-[#151b2b] p-5 rounded-2xl border border-[#1e293b]">
              <div className="text-xs font-bold text-slate-500 uppercase">تم حلها بواسطة البوت</div>
              <div className="text-2xl font-black text-emerald-400 mt-1">
                {tickets.filter(t => t.status === 'AI_RESOLVED').length} تذكرة
              </div>
            </div>
            <div className="bg-[#151b2b] p-5 rounded-2xl border border-[#1e293b]">
              <div className="text-xs font-bold text-slate-500 uppercase">قيد معالجة المهندسين</div>
              <div className="text-2xl font-black text-amber-400 mt-1">
                {tickets.filter(t => t.status === 'IN_PROGRESS' || t.status === 'PENDING_AGENT').length} تذكرة
              </div>
            </div>
            <div className="bg-[#151b2b] p-5 rounded-2xl border border-[#1e293b]">
              <div className="text-xs font-bold text-slate-500 uppercase">حرجة وعاجلة</div>
              <div className="text-2xl font-black text-rose-400 mt-1">
                {tickets.filter(t => t.priority === 'CRITICAL' || t.priority === 'URGENT').length} تذكرة
              </div>
            </div>
          </div>

          <div className="bg-[#151b2b] rounded-3xl border border-[#1e293b] overflow-hidden">
            <div className="p-6 border-b border-[#1e293b]">
              <h3 className="text-base font-bold text-white">سجل تذاكر الدعم والتحويل الآلي</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="bg-[#0f172a] text-slate-400 border-b border-[#1e293b]">
                    <th className="p-4">رقم التذكرة</th>
                    <th className="p-4">العميل والشركة</th>
                    <th className="p-4">القسم المختص</th>
                    <th className="p-4">موضوع المشكلة</th>
                    <th className="p-4">قناة الوارد</th>
                    <th className="p-4">الأولوية والحالة</th>
                    <th className="p-4">الإجراء</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1e293b] text-slate-300">
                  {tickets.map(ticket => (
                    <tr key={ticket.id} className="hover:bg-[#1e293b]/30">
                      <td className="p-4 font-mono font-bold text-indigo-400">{ticket.ticketNumber}</td>
                      <td className="p-4">
                        <strong className="text-white block">{ticket.clientName}</strong>
                        <span className="text-slate-500 text-[10px]">{ticket.companyName}</span>
                      </td>
                      <td className="p-4">
                        <span className="px-2.5 py-1 bg-slate-800 text-slate-300 rounded-lg text-[10px] font-bold">
                          {ticket.department === 'POS_HARDWARE' ? 'نقاط بيع وهاردوير' :
                           ticket.department === 'VAT_ZATCA' ? 'زاتكا وضرائب' :
                           ticket.department === 'FINANCE' ? 'حسابات ومالية' : 'الدعم الفني التقني'}
                        </span>
                      </td>
                      <td className="p-4 font-medium text-white max-w-xs truncate">{ticket.issueSubject}</td>
                      <td className="p-4">
                        <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 rounded-lg text-[10px] font-bold">
                          {ticket.channel === 'WHATSAPP_BOT' ? '🤖 بوت واتساب' : '💻 بوابة المنصة'}
                        </span>
                      </td>
                      <td className="p-4 space-y-1">
                        <span className={cn(
                          "px-2 py-0.5 rounded text-[10px] font-bold inline-block",
                          ticket.status === 'AI_RESOLVED' ? "bg-emerald-500/10 text-emerald-400" :
                          ticket.status === 'IN_PROGRESS' ? "bg-blue-500/10 text-blue-400" :
                          "bg-amber-500/10 text-amber-400"
                        )}>
                          {ticket.status === 'AI_RESOLVED' ? 'تم الحل بالبوت' : ticket.status === 'IN_PROGRESS' ? 'قيد المعالجة' : 'بانتظار المهندس'}
                        </span>
                      </td>
                      <td className="p-4">
                        <button
                          onClick={() => {
                            setTickets(tickets.map(t => t.id === ticket.id ? { ...t, status: 'AI_RESOLVED' } : t));
                            toast.success(`تم تحديث وإغلاق التذكرة ${ticket.ticketNumber}`);
                          }}
                          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-[11px] font-bold transition-all"
                        >
                          مراجعة وحل
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Knowledge Base */}
      {activeTab === 'kb' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-[#151b2b] p-6 rounded-3xl border border-[#1e293b] space-y-3">
            <div className="p-3 bg-indigo-600/20 text-indigo-400 rounded-2xl w-fit">
              <FileText size={24} />
            </div>
            <h3 className="text-base font-bold text-white">دليل إعداد نقاط البيع (POS Hardware Setup)</h3>
            <p className="text-xs text-slate-400 leading-relaxed">ربط طابعات الإيصالات الحرارية، أدراج النقدية، وقارئات الباركود لاسلكياً وبالكابل.</p>
            <button 
              onClick={() => toast.success('جاري فتح الدليل الشامل...')}
              className="text-xs font-bold text-indigo-400 hover:underline flex items-center gap-1 pt-2"
            >
              <span>قراءة المقال والدليل</span>
              <ArrowUpRight size={14} />
            </button>
          </div>

          <div className="bg-[#151b2b] p-6 rounded-3xl border border-[#1e293b] space-y-3">
            <div className="p-3 bg-purple-600/20 text-purple-400 rounded-2xl w-fit">
              <Shield size={24} />
            </div>
            <h3 className="text-base font-bold text-white">دليل الفوترة الإلكترونية وزاتكا (ZATCA E-Invoicing)</h3>
            <p className="text-xs text-slate-400 leading-relaxed">خطوات ربط الشهادة الرقمية (CSID) وإرسال الفواتير للمرحلة الثانية بنجاح.</p>
            <button 
              onClick={() => toast.success('جاري فتح دليل زاتكا الشامل...')}
              className="text-xs font-bold text-purple-400 hover:underline flex items-center gap-1 pt-2"
            >
              <span>قراءة المقال والدليل</span>
              <ArrowUpRight size={14} />
            </button>
          </div>

          <div className="bg-[#151b2b] p-6 rounded-3xl border border-[#1e293b] space-y-3">
            <div className="p-3 bg-emerald-600/20 text-emerald-400 rounded-2xl w-fit">
              <Cpu size={24} />
            </div>
            <h3 className="text-base font-bold text-white">إعدادات المزامنة وقاعدة البيانات المحلية (Offline Sync)</h3>
            <p className="text-xs text-slate-400 leading-relaxed">كيف يعمل النظام بدون إنترنت وكيفية التحقق من المزامنة مع سحابية PostgreSQL.</p>
            <button 
              onClick={() => toast.success('جاري فتح دليل المزامنة...')}
              className="text-xs font-bold text-emerald-400 hover:underline flex items-center gap-1 pt-2"
            >
              <span>قراءة المقال والدليل</span>
              <ArrowUpRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
